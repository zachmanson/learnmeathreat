// Automated assertions over the built dist/ HTML for the authoring-primitives
// fixture post, pinning the figure/callout/definition contract emitted by
// src/lib/remark-directive-to-hast.mjs (CONT-06, CONT-09, CONT-10).
// Uses only Node built-ins (node:test, node:assert/strict, node:fs, node:url,
// node:path) so this test suite has no test-framework dependency of its own.
// CSS assertions belong in tests/theming.test.mjs, not here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

const FIXTURE_SLUG = 'authoring-primitives';

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

test('1. (CONT-06) the fixture page contains at least two content-figure elements', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const matches = html.match(/<figure class="content-figure"[^>]*>/g) || [];
  assert.ok(
    matches.length >= 2,
    `(CONT-06) expected at least 2 <figure class="content-figure"> elements, found ${matches.length}`
  );
});

test('2. (CONT-06) figure numbering restarts at 1 and increments in document order', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  assert.ok(html.includes('Figure 1:'), '(CONT-06) expected "Figure 1:" caption in fixture page');
  assert.ok(html.includes('Figure 2:'), '(CONT-06) expected "Figure 2:" caption in fixture page');
  assert.ok(!html.includes('Figure 3:'), '(CONT-06) unexpected "Figure 3:" caption - numbering should stop at 2');
  assert.ok(!html.includes('Figure 0:'), '(CONT-06) unexpected "Figure 0:" caption - numbering must start at 1');
  const idx1 = html.indexOf('Figure 1:');
  const idx2 = html.indexOf('Figure 2:');
  assert.ok(
    idx1 < idx2,
    `(CONT-06) expected "Figure 1:" (index ${idx1}) to appear before "Figure 2:" (index ${idx2})`
  );
});

test('3. (CONT-06/D-03) exactly one <img> carries invertible, and only the SVG source', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const imgTags = html.match(/<img[^>]*>/g) || [];
  const invertibleTags = imgTags.filter((tag) => tag.includes('invertible'));
  assert.equal(
    invertibleTags.length,
    1,
    `(D-03) expected exactly 1 <img> with class="invertible", found ${invertibleTags.length}`
  );
  for (const tag of imgTags) {
    const srcMatch = tag.match(/src="([^"]+)"/);
    const src = srcMatch ? srcMatch[1] : '';
    const isSvg = /\.svg$/i.test(src);
    const isInvertible = tag.includes('invertible');
    assert.equal(
      isSvg,
      isInvertible,
      `(D-03) <img src="${src}"> invertible=${isInvertible} does not match isSvg=${isSvg} - only SVG figures should invert`
    );
  }
});

test('4. (CONT-06) every <img> carries a non-empty alt attribute and loading="lazy"', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const imgTags = html.match(/<img[^>]*>/g) || [];
  assert.ok(imgTags.length > 0, '(CONT-06) expected at least one <img> tag on the fixture page');
  for (const tag of imgTags) {
    const altMatch = tag.match(/alt="([^"]*)"/);
    assert.ok(altMatch && altMatch[1].length > 0, `(CONT-06) <img> missing non-empty alt attribute: ${tag}`);
    assert.ok(tag.includes('loading="lazy"'), `(CONT-06) <img> missing loading="lazy": ${tag}`);
  }
});

test('5. (CONT-09) the fixture page contains note, warning, and tip callouts', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  assert.ok(html.includes('callout callout-note'), '(CONT-09) expected "callout callout-note" in fixture page');
  assert.ok(html.includes('callout callout-warning'), '(CONT-09) expected "callout callout-warning" in fixture page');
  assert.ok(html.includes('callout callout-tip'), '(CONT-09) expected "callout callout-tip" in fixture page');
});

test('6. (CONT-10) the fixture page contains a definition callout', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  assert.ok(
    html.includes('callout callout-definition'),
    '(CONT-10) expected "callout callout-definition" in fixture page'
  );
});

test('7. (CONT-09/Pitfall 5) a multi-paragraph callout renders two <p> elements in one callout div', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  // Isolate the warning callout block: from its opening <div class="callout
  // tag to the start of the next <div class="callout block (or end of
  // </article> if it's the last one). A naive non-greedy [\s\S]*? regex
  // can't safely find the *matching* closing </div> here because the
  // callout's own inline content (e.g. KaTeX output) can itself contain
  // nested <div>/</div> pairs, so we index between sibling callout starts
  // instead of trying to balance tags.
  const warningStart = html.indexOf('<div class="callout callout-warning">');
  assert.ok(warningStart !== -1, '(CONT-09) expected a callout-warning block to isolate for the multi-paragraph check');
  const afterWarning = html.slice(warningStart + 1);
  const nextCalloutOffset = afterWarning.indexOf('<div class="callout');
  const articleCloseOffset = afterWarning.indexOf('</article>');
  const endOffset =
    nextCalloutOffset === -1
      ? articleCloseOffset
      : articleCloseOffset === -1
        ? nextCalloutOffset
        : Math.min(nextCalloutOffset, articleCloseOffset);
  const block = html.slice(warningStart, warningStart + 1 + endOffset);
  const pCount = (block.match(/<p>/g) || []).length;
  assert.ok(
    pCount >= 2,
    `(CONT-09/Pitfall 5) expected at least 2 <p> elements inside the callout-warning block, found ${pCount}`
  );
});

test('8. (D-10/D-12) the fixture page ships no <script> referencing the primitives', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const scriptTags = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
  for (const tag of scriptTags) {
    assert.ok(
      !/callout|figure|definition/i.test(tag),
      `(D-10/D-12) found a <script> referencing a primitive keyword - primitives must ship zero client JS: ${tag}`
    );
  }
});

// --- Citations (CONT-08) ---
//
// The "bibliography region" selector below (#refs.references.csl-bib-body,
// .csl-entry) was pinned by inspecting real dist/ output from
// rehype-citation@2.3.2 during 02.2-03 Task 1 (recorded verbatim in
// 02.2-03-SUMMARY.md), not guessed from its README. If a future
// rehype-citation upgrade changes this wrapper markup, these tests should
// fail loudly rather than silently pass against the wrong region - the
// same tripwire discipline prose.css already uses for KaTeX's currentColor
// behavior (see prose.css test 15 in theming.test.mjs).

// D-08 negative control: this is the ONE references.bib entry the fixture
// post deliberately does NOT cite. Its surname must never appear in the
// built page's bibliography region. Do not "fix" a failing test here by
// adding a citation for this key - that would defeat the control.
const UNCITED_CONTROL_SURNAME = 'Nakamoto';

function extractBibliographyRegion(html) {
  const start = html.indexOf('<div id="refs"');
  assert.ok(start !== -1, '(CONT-08) expected a <div id="refs"> bibliography region in the built page');
  const end = html.indexOf('</article>', start);
  return html.slice(start, end === -1 ? undefined : end);
}

test('9. (CONT-08/D-06) no un-translated \\cite{ appears outside a <code> element', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const withoutCode = html.replace(/<code>[\s\S]*?<\/code>/g, '');
  assert.ok(
    !withoutCode.includes('\\cite{'),
    '(CONT-08/D-06) found an un-translated \\cite{ outside a <code> element - remarkCiteTranslate should have rewritten it to [@key]'
  );
});

test('10. (CONT-08/D-06) a \\cite{ written inside inline code stays literal', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const codeSpans = html.match(/<code>[\s\S]*?<\/code>/g) || [];
  assert.ok(
    codeSpans.some((span) => span.includes('\\cite{')),
    '(CONT-08/D-06) expected at least one <code> element to still contain literal \\cite{ - the deliberate code-span exemption should not translate it'
  );
});

test('11. (CONT-08) the bibliography region contains the author surname of each cited entry', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const bibRegion = extractBibliographyRegion(html);
  assert.ok(bibRegion.includes('Shor'), '(CONT-08) expected "Shor" in the bibliography region');
  assert.ok(bibRegion.includes('Grover'), '(CONT-08) expected "Grover" in the bibliography region');
});

test('12. (CONT-08/D-08) the bibliography region does not contain the uncited entry (negative control)', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const bibRegion = extractBibliographyRegion(html);
  assert.ok(
    !bibRegion.includes(UNCITED_CONTROL_SURNAME),
    `(CONT-08/D-08) found "${UNCITED_CONTROL_SURNAME}" in the bibliography region - this entry is deliberately uncited by the fixture post and must not appear (per-post scoping)`
  );
});

test('13. (CONT-08) a repeated cite key yields exactly one bibliography entry', () => {
  const html = readDistFile(`posts/${FIXTURE_SLUG}/index.html`);
  const bibRegion = extractBibliographyRegion(html);
  const shorEntries = (bibRegion.match(/Polynomial-Time Algorithms for Prime Factorization/g) || []).length;
  assert.equal(
    shorEntries,
    1,
    `(CONT-08) expected the repeated shor1997 citation to produce exactly 1 bibliography entry, found ${shorEntries}`
  );
});
