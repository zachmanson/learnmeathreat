// Automated assertions over the built dist/ HTML output for the reading
// navigation left sidebar (site-wide chapter table of contents) and its
// supporting CSS contract. Uses only Node built-ins (node:test,
// node:assert/strict, node:fs, node:path, node:url) so this test suite has
// no test-framework dependency of its own, mirroring tests/site-structure.test.mjs
// and tests/markdown-pipeline.test.mjs.
//
// Right-sidebar coverage is added by plan 02.1-03; this file's test
// sequence deliberately ends at 6 to leave numbering room for that suite.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

function readHtml(relPath) {
  const fullPath = path.join(distDir, relPath);
  try {
    return readFileSync(fullPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Missing built file: dist/${relPath} (expected at ${fullPath})`);
    }
    throw err;
  }
}

function extractLeftNavRegion(html) {
  const start = html.indexOf('class="left-nav"');
  const end = html.indexOf('</nav>', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not find .left-nav region in post HTML');
  }
  return html.slice(start, end);
}

function nonDraftPostSlugs() {
  const postsDir = path.join(distDir, 'posts');
  return readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

const POST_SLUG = 'why-quantum-computers-threaten-bitcoin';

test('1. post page renders the .post-layout grid wrapper', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  assert.ok(html.includes('class="post-layout"'), 'expected class="post-layout" in post page HTML');
});

test('2. left sidebar is a labelled landmark listing every non-draft post', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  assert.ok(html.includes('aria-label="Site contents"'), 'expected aria-label="Site contents" landmark');
  const navRegion = extractLeftNavRegion(html);
  for (const slug of nonDraftPostSlugs()) {
    assert.ok(
      navRegion.includes(`href="/posts/${slug}/"`),
      `expected left-nav to link to /posts/${slug}/`
    );
  }
});

test('3. chapters render as native details/summary accordions', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  const navRegion = extractLeftNavRegion(html);
  assert.ok(navRegion.includes('<details'), 'expected at least one <details> in left-nav');
  assert.ok(navRegion.includes('<summary'), 'expected at least one <summary> in left-nav');
  const summaryCount = (navRegion.match(/<summary/g) || []).length;
  // Exactly one chapter exists in the current seed content (Quantum Algorithms).
  assert.equal(summaryCount, 1, `expected 1 distinct chapter, found ${summaryCount}`);
});

test("4. the current post's chapter is open and its link marked", () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  assert.ok(html.includes('<details open'), 'expected the current chapter <details> to carry the open attribute');
  const ariaCurrentCount = (html.match(/aria-current="page"/g) || []).length;
  assert.equal(ariaCurrentCount, 1, `expected exactly one aria-current="page" link, found ${ariaCurrentCount}`);
});

test('5. sidebars do not appear on home or about', () => {
  const home = readHtml('index.html');
  const about = readHtml('about/index.html');
  assert.ok(!home.includes('post-layout'), 'dist/index.html unexpectedly contains post-layout');
  assert.ok(!home.includes('left-nav'), 'dist/index.html unexpectedly contains left-nav');
  assert.ok(!about.includes('post-layout'), 'dist/about/index.html unexpectedly contains post-layout');
  assert.ok(!about.includes('left-nav'), 'dist/about/index.html unexpectedly contains left-nav');
});

test('6. nav-sidebars.css declares the 900px collapse and no new tokens', () => {
  const cssPath = path.join(repoRoot, 'src', 'styles', 'nav-sidebars.css');
  const css = readFileSync(cssPath, 'utf-8');
  assert.ok(css.includes('max-width: 900px'), 'expected a max-width: 900px media query');
  assert.ok(css.includes('grid-template-areas'), 'expected grid-template-areas');

  const bodyOnly = css
    .split('\n')
    .filter((line) => !line.trim().startsWith('/*') && !line.trim().startsWith('*'))
    .join('\n');
  assert.doesNotMatch(
    bodyOnly,
    /^\s*--[a-z0-9-]+\s*:/m,
    'nav-sidebars.css must not define new custom properties'
  );
  assert.doesNotMatch(
    bodyOnly,
    /#[0-9a-fA-F]{3,6}\b/,
    'nav-sidebars.css must not contain hardcoded hex color literals'
  );
});
