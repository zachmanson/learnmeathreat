// \ref{key} -> link translation remark plugin.
//
// Phase 2 (real per-file render) half of the \ref side of the \label/\ref
// primitive - see CONTEXT.md (Ref) and ADR 0001. Loads the whole-site label
// registry (src/lib/label-registry.mjs) fresh on every file (no caching -
// see that module's header comment), then rewrites every \ref{key} found in
// prose text into an mdast `link` node pointing at the labeled element,
// using the registry's resolved anchor id and display text (a number for
// equations/figures, the term/heading text for definitions/headings -
// grill-with-docs Q7).
//
// Like remarkCiteTranslate, this only visits mdast `text` nodes, never
// `inlineCode`/`code` - the same deliberate escape hatch for referencing the
// \ref syntax itself inside a code span.
//
// loadRegistry() throws on any undefined label, duplicate label, or
// out-of-scope cross-post reference anywhere on the site (not just in this
// file) - that failure propagates straight up through this transform and
// fails the whole `astro build`/`astro dev`, per grill-with-docs Q3/Q9.

import { visit } from 'unist-util-visit';
import { loadRegistry, resolveRef } from './label-registry.mjs';
import { REF_PATTERN } from './label-shared.mjs';

export function remarkRefResolve() {
  return (tree, file) => {
    const registry = loadRegistry();
    const currentSlug = file.data.astro.frontmatter.slug;

    visit(tree, 'text', (node, index, parent) => {
      if (index === null || !parent) return;
      if (!node.value.includes('\\ref{')) return;

      const parts = [];
      let lastIndex = 0;
      let match;
      REF_PATTERN.lastIndex = 0;
      while ((match = REF_PATTERN.exec(node.value))) {
        const { href, displayText } = resolveRef(registry, match[1], currentSlug);
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'link', url: href, children: [{ type: 'text', value: displayText }] });
        lastIndex = match.index + match[0].length;
      }
      REF_PATTERN.lastIndex = 0;

      if (lastIndex < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...parts);
      return index + parts.length; // skip past the nodes we just inserted
    });
  };
}
