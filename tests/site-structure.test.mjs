// Automated assertions over the built dist/ HTML output.
// Uses only Node built-ins (node:test, node:assert/strict, node:fs, node:path)
// so this test suite has no test-framework dependency of its own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

// The exact excerpt string for the published seed post. Task 2 copies this
// byte-for-byte into the post's frontmatter `excerpt` field.
export const PUBLISHED_EXCERPT =
  'Quantum computers can factor the huge numbers that keep Bitcoin public keys secret, once they are big enough to run the algorithm behind it.';

const PUBLISHED_TITLE = 'Why Quantum Computers Threaten Bitcoin';
const DRAFT_TITLE = "Shor's Algorithm in Plain English";
const PUBLISHED_SLUG = 'why-quantum-computers-threaten-bitcoin';
const DRAFT_SLUG = 'shors-algorithm-in-plain-english';

function readDistFile(relPath) {
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

test('1. dist/index.html exists and contains the published post title', () => {
  const html = readDistFile('index.html');
  assert.match(html, new RegExp(escapeRegExp(PUBLISHED_TITLE)));
});

test('2. dist/index.html links to the published post clean URL', () => {
  const html = readDistFile('index.html');
  assert.match(html, new RegExp(escapeRegExp(`href="/posts/${PUBLISHED_SLUG}/"`)));
});

test('3. dist/index.html contains the published post excerpt', () => {
  const html = readDistFile('index.html');
  assert.ok(
    html.includes(PUBLISHED_EXCERPT),
    'dist/index.html does not contain PUBLISHED_EXCERPT'
  );
});

test('4. dist/index.html does NOT contain the draft post title', () => {
  const html = readDistFile('index.html');
  assert.ok(
    !html.includes(DRAFT_TITLE),
    'dist/index.html unexpectedly contains the draft post title'
  );
});

test('5. draft post produces no page in dist/', () => {
  const draftPath = path.join(distDir, 'posts', DRAFT_SLUG);
  assert.ok(!existsSync(draftPath), `dist/posts/${DRAFT_SLUG} should not exist`);
});

test('6. published post page exists and contains its title', () => {
  const html = readDistFile(`posts/${PUBLISHED_SLUG}/index.html`);
  assert.match(html, new RegExp(escapeRegExp(PUBLISHED_TITLE)));
});

test('7. About page exists and contains "About"', () => {
  const html = readDistFile('about/index.html');
  assert.ok(html.includes('About'));
});

test('8. Home and About nav links appear on every page', () => {
  const pages = ['index.html', 'about/index.html', `posts/${PUBLISHED_SLUG}/index.html`];
  for (const page of pages) {
    const html = readDistFile(page);
    assert.ok(html.includes('href="/"'), `${page} missing href="/"`);
    assert.ok(html.includes('href="/about/"'), `${page} missing href="/about/"`);
  }
});

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
