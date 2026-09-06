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

// Chapter-grouped homepage assertions (quick task 260905-svh).
const CRYPTO_EXCERPT =
  'The three cryptographic tools Bitcoin leans on, and why you need to understand them before any of the quantum stuff makes sense.';
const ASYMMETRIC_EXCERPT =
  'The difference between sharing one secret key and using a public/private key pair, and why Bitcoin relies on the latter.';
const HASH_FUNCTIONS_EXCERPT =
  'What a hash function actually does, and why being hard to reverse is the whole point.';
const DIGITAL_SIGNATURES_EXCERPT =
  "How you can prove you own a private key without ever revealing it, and why that's what actually authorizes a Bitcoin transaction.";
const AUTHORING_EXCERPT =
  'A quick cheat-sheet for the figure, callout, and definition blocks available when writing posts.';
const ASYMMETRIC_SLUG = 'asymmetric-and-symmetric-cryptography';
const HASH_FUNCTIONS_SLUG = 'hash-functions';
const DIGITAL_SIGNATURES_SLUG = 'digital-signatures';

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

test('9. dist/index.html renders chapters in reading order (Cryptography before Quantum Algorithms)', () => {
  const html = readDistFile('index.html');
  const cryptoMatch = html.match(/<a class="post-title" href="\/posts\/cryptography\/"[^>]*>Cryptography<\/a>/);
  const quantumMatch = html.match(/<h2[^>]*>Quantum Algorithms<\/h2>/);
  assert.ok(cryptoMatch, 'dist/index.html missing Cryptography section post link (its title stands in for the chapter heading)');
  assert.ok(quantumMatch, 'dist/index.html missing Quantum Algorithms chapter heading');
  assert.ok(
    cryptoMatch.index < quantumMatch.index,
    'Cryptography chapter heading should appear before Quantum Algorithms chapter heading'
  );
});

test('10. dist/index.html contains the Cryptography section post excerpt', () => {
  const html = readDistFile('index.html');
  assert.ok(
    html.includes(CRYPTO_EXCERPT),
    'dist/index.html does not contain CRYPTO_EXCERPT'
  );
});

test('11. Cryptography subsections are linked, title-only, and in a separate list element', () => {
  const html = readDistFile('index.html');

  for (const slug of [ASYMMETRIC_SLUG, HASH_FUNCTIONS_SLUG, DIGITAL_SIGNATURES_SLUG]) {
    assert.ok(
      html.includes(`href="/posts/${slug}/"`),
      `dist/index.html missing link to subsection ${slug}`
    );
  }

  for (const excerpt of [ASYMMETRIC_EXCERPT, HASH_FUNCTIONS_EXCERPT, DIGITAL_SIGNATURES_EXCERPT]) {
    assert.ok(
      !html.includes(excerpt),
      `dist/index.html unexpectedly contains a subsection excerpt: ${excerpt}`
    );
  }

  assert.ok(
    html.includes('class="subsection-list"'),
    'dist/index.html missing class="subsection-list"'
  );

  const subsectionListMatch = html.match(/<ul class="subsection-list"[^>]*>[\s\S]*?<\/ul>/);
  assert.ok(subsectionListMatch, 'dist/index.html missing a <ul class="subsection-list"> element');
  const subsectionListHtml = subsectionListMatch[0];

  for (const slug of [ASYMMETRIC_SLUG, HASH_FUNCTIONS_SLUG, DIGITAL_SIGNATURES_SLUG]) {
    assert.ok(
      subsectionListHtml.includes(`href="/posts/${slug}/"`),
      `subsection-list should contain link to ${slug}`
    );
  }

  assert.ok(
    !subsectionListHtml.includes('href="/posts/cryptography/"'),
    'subsection-list should NOT contain the Cryptography section post link'
  );
});

test('12. Quantum Algorithms chapter (flat fallback) keeps full excerpts unchanged', () => {
  const html = readDistFile('index.html');
  assert.ok(
    html.includes(PUBLISHED_EXCERPT),
    'dist/index.html missing PUBLISHED_EXCERPT for Quantum Algorithms chapter'
  );
  assert.ok(
    html.includes(AUTHORING_EXCERPT),
    'dist/index.html missing AUTHORING_EXCERPT for Quantum Algorithms chapter'
  );
});

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
