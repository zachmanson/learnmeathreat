// The \label/\ref site-wide label registry (CONTEXT.md: Label registry;
// ADR 0001: flat global namespace, two-pass build).
//
// Phase 1 of the \label/\ref primitive: scans every non-draft post's raw
// Markdown into an mdast tree (parse + remark-directive + remark-math only -
// no math/citation rendering needed, just enough structure to count
// headings/equations/figures/definitions in document order and detect a
// \label{key} paragraph immediately following one), and builds one flat
// key -> {type, postSlug, anchorId, displayText, scope} map covering the
// whole site. Recomputed from scratch on every call (no caching): the site
// is small enough that rescanning every post per page build is negligible,
// and it means there is no cache-invalidation logic to get wrong, in dev or
// in build (see CONTEXT.md's "Label registry" entry).
//
// Any inconsistency - a duplicate label key anywhere on the site, a \ref to
// a key that doesn't exist, a \ref to a per-post-scoped label (equation,
// figure) from a different post, or a \label on a :::definition::: block
// with no bolded lead term to use as its display name - throws immediately,
// failing the build loudly rather than rendering something silently broken
// (grill-with-docs Q3/Q9/Q10).

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import { labelableKind, bareLabelKey, flattenText, PER_POST_TYPES, REF_PATTERN } from './label-shared.mjs';

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

function extractDefinitionTerm(definitionNode) {
  const firstParagraph = definitionNode.children?.find((child) => child.type === 'paragraph');
  const strongNode = firstParagraph?.children?.find((child) => child.type === 'strong');
  if (!strongNode) return null;
  return flattenText(strongNode).replace(/:\s*$/, '').trim();
}

// Recursively walks `node.children`, bumping one counter per labelable type
// encountered (mirrors the counting rules rehypeSequentialIds,
// rehypeEquationNumbering, and remarkDirectiveToHast each apply
// independently during the real per-file render) and registering any
// \label{key} found immediately after a labelable element.
function walk(node, counters, postSlug, labels) {
  if (!node.children) return;
  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i];
    const kind = labelableKind(child);

    if (kind === 'heading') counters.heading += 1;
    else if (kind === 'equation') counters.equation += 1;
    else if (kind === 'figure') counters.figure += 1;
    else if (kind === 'definition') counters.definition += 1;

    if (kind) {
      const next = node.children[i + 1];
      const key = next ? bareLabelKey(next) : null;
      if (key) {
        if (labels.has(key)) {
          const existing = labels.get(key);
          throw new Error(
            `Duplicate \\label{${key}}: already defined in post "${existing.postSlug}" (${existing.type}), ` +
              `also found in post "${postSlug}" (${kind}). Labels must be unique across the entire site (ADR 0001).`
          );
        }

        let anchorId;
        let displayText;
        if (kind === 'heading') {
          anchorId = `h-${counters.heading}`;
          displayText = flattenText(child).trim();
        } else if (kind === 'equation') {
          anchorId = `eq-${counters.equation}`;
          displayText = `Equation ${counters.equation}`;
        } else if (kind === 'figure') {
          anchorId = `fig-${counters.figure}`;
          displayText = `Figure ${counters.figure}`;
        } else if (kind === 'definition') {
          const term = extractDefinitionTerm(child);
          if (!term) {
            throw new Error(
              `\\label{${key}} in post "${postSlug}" follows a :::definition::: block with no bolded lead term ` +
                `(e.g. "**Term:** ..."). Add one, or remove the label.`
            );
          }
          anchorId = `def-${counters.definition}`;
          displayText = term;
        }

        labels.set(key, {
          type: kind,
          postSlug,
          anchorId,
          displayText,
          scope: PER_POST_TYPES.has(kind) ? 'per-post' : 'site-wide',
        });
      }
    }

    walk(child, counters, postSlug, labels);
  }
}

export function scanPostRefs(tree) {
  const refs = [];
  visit(tree, 'text', (node) => {
    let match;
    REF_PATTERN.lastIndex = 0;
    while ((match = REF_PATTERN.exec(node.value))) {
      refs.push(match[1]);
    }
    REF_PATTERN.lastIndex = 0;
  });
  return refs;
}

// posts: [{ slug, tree }] - pure, no disk access, so it's directly testable
// against synthetic mdast trees.
export function buildRegistryFromPosts(posts) {
  const labels = new Map();
  const sorted = [...posts].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const { slug, tree } of sorted) {
    walk(tree, { heading: 0, equation: 0, figure: 0, definition: 0 }, slug, labels);
  }
  return labels;
}

export function resolveRef(registry, key, currentSlug) {
  const entry = registry.get(key);
  if (!entry) {
    throw new Error(
      `Undefined \\ref{${key}} in post "${currentSlug}" - no \\label{${key}} exists anywhere on the site.`
    );
  }
  if (entry.scope === 'per-post' && entry.postSlug !== currentSlug) {
    throw new Error(
      `\\ref{${key}} in post "${currentSlug}" points at a ${entry.type} defined in post "${entry.postSlug}" - ` +
        `${entry.type}s can only be referenced from the post that defines them (grill-with-docs Q2/Q4).`
    );
  }
  const href = entry.postSlug === currentSlug ? `#${entry.anchorId}` : `/posts/${entry.postSlug}/#${entry.anchorId}`;
  return { href, displayText: entry.displayText };
}

export function validateAllRefs(posts, registry) {
  for (const { slug, tree } of posts) {
    for (const key of scanPostRefs(tree)) {
      resolveRef(registry, key, slug);
    }
  }
}

function parseMarkdownBody(content) {
  const processor = unified().use(remarkParse).use(remarkDirective).use(remarkMath);
  const tree = processor.parse(content);
  processor.runSync(tree);
  return tree;
}

function readPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith('.md'));
  const posts = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    if (data.draft) continue; // draft posts get no route (see [slug].astro) so can't be a \ref target
    if (typeof data.slug !== 'string' || data.slug.length === 0) {
      // content.config.ts's Zod schema also requires this, but that
      // validation runs elsewhere in Astro's own pipeline - this module
      // reads frontmatter independently (see header comment), so it needs
      // its own check to fail with a clear message rather than a generic
      // TypeError later when the missing slug is used as a sort/map key.
      throw new Error(`Post file "${file}" has no (or a non-string) frontmatter "slug" field.`);
    }
    posts.push({ slug: data.slug, tree: parseMarkdownBody(content) });
  }
  return posts;
}

export function loadRegistry() {
  const posts = readPosts();
  const registry = buildRegistryFromPosts(posts);
  validateAllRefs(posts, registry);
  return registry;
}
