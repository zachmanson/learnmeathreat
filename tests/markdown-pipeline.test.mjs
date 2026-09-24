// Automated assertions over the built dist/ HTML output for the markdown
// rendering pipeline (math, heading anchors, syntax highlighting).
// Uses only Node built-ins (node:test, node:assert/strict, node:fs, node:path)
// so this test suite has no test-framework dependency of its own, mirroring
// tests/site-structure.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist-test');

const POST_SLUG = 'why-quantum-computers-threaten-bitcoin';

function readPostHtml() {
  const fullPath = path.join(distDir, 'posts', POST_SLUG, 'index.html');
  try {
    return readFileSync(fullPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Missing built file: dist/posts/${POST_SLUG}/index.html (expected at ${fullPath})`);
    }
    throw err;
  }
}

// Extract just the <article>...</article> region so KaTeX's own internal
// markup or any frontmatter echo cannot produce a false negative/positive
// when checking for surviving raw `$$` delimiters.
function extractArticleBody(html) {
  const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (!match) {
    // Fall back to <main> if there's no explicit <article> tag, so this
    // helper stays useful even if the post page's wrapper element changes.
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    if (mainMatch) return mainMatch[1];
    throw new Error('Could not find <article> or <main> region in post HTML');
  }
  return match[1];
}

test('1. rendered math contains class="katex"', () => {
  const html = readPostHtml();
  assert.ok(html.includes('class="katex"'), 'expected class="katex" in rendered HTML');
});

test('2. rendered math contains the MathML annotation encoding', () => {
  const html = readPostHtml();
  assert.ok(
    html.includes('<annotation encoding="application/x-tex">'),
    'expected KaTeX MathML annotation in rendered HTML'
  );
});

test('3. block math rendered in display mode (katex-display)', () => {
  const html = readPostHtml();
  assert.ok(html.includes('katex-display'), 'expected katex-display class for block math');
});

test('4. article body contains no surviving "$$" block delimiters', () => {
  const html = readPostHtml();
  const articleBody = extractArticleBody(html);
  assert.ok(!articleBody.includes('$$'), 'article body still contains raw $$ delimiters');
});

test('5. at least two <h2> tags carry a non-empty id attribute', () => {
  const html = readPostHtml();
  const h2WithId = html.match(/<h2[^>]*\sid="[^"]+"/g) || [];
  assert.ok(h2WithId.length >= 2, `expected >= 2 id-bearing h2 tags, found ${h2WithId.length}`);
});

test('6. heading anchor link href matches the first h2 id', () => {
  // Under the D-01 sequential-id scheme (see src/lib/rehype-sequential-ids.mjs),
  // the first h2's id is now expected to be "h-1" rather than a text-derived
  // slug. This assertion logic is scheme-agnostic (it derives the id and
  // checks the matching href), so it still holds.
  const html = readPostHtml();
  const idMatch = html.match(/<h2[^>]*\sid="([^"]+)"/);
  assert.ok(idMatch, 'expected to find an h2 with an id attribute');
  const firstId = idMatch[1];
  assert.ok(html.includes('heading-anchor-link'), 'expected heading-anchor-link class in rendered HTML');
  assert.ok(
    html.includes(`href="#${firstId}"`),
    `expected an anchor href="#${firstId}" matching the first h2's id`
  );
});

test('7. Shiki build-time syntax highlighting present', () => {
  const html = readPostHtml();
  // Primary, stable-across-versions signal: a --shiki-light custom property
  // inside a <pre> block. Phase 2 switched shikiConfig to dual-theme mode
  // with defaultColor: false (see 02-02-PLAN.md), so Shiki no longer bakes
  // a single inline `color` into token spans - it emits per-token
  // --shiki-light/--shiki-dark custom properties instead, consumed by
  // prose.css. This test asserts build-time highlighting is still present
  // under the new emission format.
  assert.match(
    html,
    /<pre[^>]*>[\s\S]*?<span style="[^"]*--shiki-light:[^"]*"/,
    'expected a <span style="--shiki-light:..."> inside a <pre> block'
  );
  // Secondary hint (not asserted as primary since Shiki's wrapper class name
  // is more likely to shift across versions than the inline-style pattern):
  // Astro's Shiki output also carries class="astro-code" on the <pre>.
});

test('8. no client-side rendering script for katex/mathjax/prism/highlight', () => {
  const html = readPostHtml();
  const scriptTags = html.match(/<script[^>]*>/g) || [];
  const forbidden = /katex|mathjax|prism|highlight/i;
  const offending = scriptTags.filter((tag) => forbidden.test(tag));
  assert.deepEqual(offending, [], `found client-side rendering script tag(s): ${offending.join(', ')}`);
});

test('9. heading ids follow the sequential h-N scheme', () => {
  const html = readPostHtml();
  const ids = [...html.matchAll(/<h[2-6][^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 2, `expected >= 2 heading ids, found ${ids.length}`);
  const expected = ids.map((_, i) => `h-${i + 1}`);
  assert.deepEqual(ids, expected, `expected sequential h-N ids, got ${ids.join(', ')}`);
});

test('10. no text-derived slug ids remain', () => {
  const html = readPostHtml();
  const headingTags = [...html.matchAll(/<h[2-6][^>]*>/g)].map((m) => m[0]);
  for (const tag of headingTags) {
    const idMatch = tag.match(/\sid="([^"]+)"/);
    if (!idMatch) continue;
    assert.match(
      idMatch[1],
      /^h-\d+$/,
      `expected heading id to match ^h-\\d+$, found "${idMatch[1]}" (text-derived slug leaked through)`
    );
  }
});

test('11. h1 carries no h-N id', () => {
  const html = readPostHtml();
  const h1Match = html.match(/<h1[^>]*>/);
  assert.ok(h1Match, 'expected to find an h1 tag');
  assert.ok(
    !/\sid="h-/.test(h1Match[0]),
    `expected h1 to carry no h-N id (D-02), found: ${h1Match[0]}`
  );
});
