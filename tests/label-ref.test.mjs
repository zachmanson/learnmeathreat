// Automated assertions over the built dist/ HTML for the \label/\ref
// primitive - see CONTEXT.md (Label, Ref, Label registry) and ADR 0001.
// Fixtures: src/content/posts/authoring-primitives.md (equation, figure,
// definition, and heading labels + local \ref) and
// src/content/posts/label-ref-cross-post-fixture.md (site-wide \ref to a
// definition/heading defined in the OTHER post).
// Uses only Node built-ins, mirroring tests/authoring-primitives.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

const PRIMARY_SLUG = 'authoring-primitives';
const CROSS_POST_SLUG = 'label-ref-cross-post-fixture';

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

test('1. every display equation gets a katex-display-wrapper with a sequential id and (N) tag', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  assert.ok(html.includes('<div class="katex-display-wrapper" id="eq-1">'), 'expected eq-1 wrapper');
  assert.ok(html.includes('<div class="katex-display-wrapper" id="eq-2">'), 'expected eq-2 wrapper');
  assert.ok(html.includes('<span class="eq-tag">(1)</span>'), 'expected (1) tag');
  assert.ok(html.includes('<span class="eq-tag">(2)</span>'), 'expected (2) tag');
});

test('2. every figure gets a sequential fig-N id, whether labeled or not', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  assert.ok(html.includes('<figure class="content-figure" id="fig-1">'), 'expected fig-1 id');
  assert.ok(html.includes('<figure class="content-figure" id="fig-2">'), 'expected fig-2 id (unlabeled figure still gets an id)');
});

test('3. every definition callout gets a sequential def-N id', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  assert.ok(html.includes('<div class="callout callout-definition" id="def-1">'), 'expected def-1 id');
});

test('4. a same-post \\ref to an equation resolves to a link with the equation number', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  assert.ok(html.includes('<a href="#eq-1">Equation 1</a>'), 'expected local ref to eq-1');
});

test('5. a same-post \\ref to a figure resolves to a link with the figure number', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  assert.ok(html.includes('<a href="#fig-1">Figure 1</a>'), 'expected local ref to fig-1');
});

test('6. a same-post \\ref to a definition resolves to a link with the term, not a number', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  assert.ok(html.includes('<a href="#def-1">Elliptic curve</a>'), 'expected local ref to def-1 rendered as its term');
});

test('7. a same-post \\ref to a heading resolves to a link with the heading text', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  assert.match(
    html,
    /<a href="#h-4">Labels(?:\s|&#x26;|&amp;)+References<\/a>/,
    'expected local ref to h-4 rendered as the heading text'
  );
});

test('8. a cross-post \\ref resolves to a definition defined in a DIFFERENT post', () => {
  const html = readDistFile(`posts/${CROSS_POST_SLUG}/index.html`);
  assert.ok(
    html.includes(`<a href="/posts/${PRIMARY_SLUG}/#def-1">Elliptic curve</a>`),
    'expected a cross-post link into authoring-primitives.md\'s definition'
  );
});

test('9. a cross-post \\ref resolves to a heading defined in a DIFFERENT post', () => {
  const html = readDistFile(`posts/${CROSS_POST_SLUG}/index.html`);
  assert.match(
    html,
    new RegExp(`<a href="/posts/${PRIMARY_SLUG}/#h-4">Labels(?:\\s|&#x26;|&amp;)+References</a>`),
    'expected a cross-post link into authoring-primitives.md\'s heading'
  );
});

test('10. no unresolved \\label{ or \\ref{ marker survives outside a <code> element', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  const withoutCode = html.replace(/<code>[\s\S]*?<\/code>/g, '');
  assert.ok(!withoutCode.includes('\\label{'), 'found an unstripped \\label{ marker outside <code>');
  assert.ok(!withoutCode.includes('\\ref{'), 'found an unresolved \\ref{ outside <code>');
});

test('11. \\label{ and \\ref{ written inside inline code stay literal', () => {
  const html = readDistFile(`posts/${PRIMARY_SLUG}/index.html`);
  const codeSpans = html.match(/<code>[\s\S]*?<\/code>/g) || [];
  assert.ok(codeSpans.some((span) => span.includes('\\label{')), 'expected a literal \\label{ inside <code>');
  assert.ok(codeSpans.some((span) => span.includes('\\ref{')), 'expected a literal \\ref{ inside <code>');
});
