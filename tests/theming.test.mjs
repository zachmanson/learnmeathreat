// Automated assertions over the built dist/ HTML+CSS output, asserting the
// light/dark theming contract (DSGN-03/DSGN-04, 02-01-PLAN.md).
// Uses only Node built-ins (node:test, node:assert/strict, node:fs, node:path)
// so this test suite has no test-framework dependency of its own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

const PUBLISHED_SLUG = 'why-quantum-computers-threaten-bitcoin';

const PAGES = ['index.html', 'about/index.html', `posts/${PUBLISHED_SLUG}/index.html`];

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

function readDistCss() {
  const astroDir = path.join(distDir, '_astro');
  let entries;
  try {
    entries = readdirSync(astroDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Missing built directory: dist/_astro (expected at ${astroDir})`);
    }
    throw err;
  }
  const cssFiles = entries.filter((name) => name.endsWith('.css'));
  if (cssFiles.length === 0) {
    throw new Error(`No .css files found in dist/_astro (expected at ${astroDir})`);
  }
  return cssFiles
    .map((name) => readFileSync(path.join(astroDir, name), 'utf-8'))
    .join('\n');
}

test('1. every built page contains a theme-init script reading localStorage and setting data-theme', () => {
  for (const page of PAGES) {
    const html = readDistFile(page);
    assert.ok(
      html.includes("localStorage.getItem('theme')"),
      `${page} missing localStorage.getItem('theme') call`
    );
    assert.ok(
      html.includes("document.documentElement.setAttribute('data-theme'"),
      `${page} missing document.documentElement.setAttribute('data-theme' call`
    );
  }
});

test('2. the theme-init script is emitted as a plain inline <script> (no type="module", no src)', () => {
  for (const page of PAGES) {
    const html = readDistFile(page);
    const markerIndex = html.indexOf('data-theme');
    assert.ok(markerIndex !== -1, `${page} missing data-theme marker`);
    const beforeMarker = html.slice(0, markerIndex);
    const scriptOpenIndex = beforeMarker.lastIndexOf('<script');
    assert.ok(scriptOpenIndex !== -1, `${page} missing preceding <script> tag`);
    const scriptTagEnd = html.indexOf('>', scriptOpenIndex);
    const scriptTag = html.slice(scriptOpenIndex, scriptTagEnd + 1);
    const attrs = scriptTag.replace(/^<script/, '').replace(/>$/, '').trim();
    assert.equal(attrs, '', `${page} theme-init <script> tag has unexpected attributes: "${attrs}"`);
  }
});

test('3. the init script validates the stored value against a light/dark allowlist', () => {
  for (const page of PAGES) {
    const html = readDistFile(page);
    assert.ok(html.includes("'light'"), `${page} missing 'light' string literal in init script region`);
    assert.ok(html.includes("'dark'"), `${page} missing 'dark' string literal in init script region`);
  }
});

test('4. the init script appears inside <head>, before </head>', () => {
  for (const page of PAGES) {
    const html = readDistFile(page);
    const headCloseIndex = html.indexOf('</head>');
    const dataThemeIndex = html.indexOf('data-theme');
    assert.ok(headCloseIndex !== -1, `${page} missing </head>`);
    assert.ok(dataThemeIndex !== -1, `${page} missing data-theme marker`);
    assert.ok(
      dataThemeIndex < headCloseIndex,
      `${page} theme-init script (index ${dataThemeIndex}) is not before </head> (index ${headCloseIndex})`
    );
  }
});

test('5. every built page contains the theme toggle button with initial aria-label', () => {
  for (const page of PAGES) {
    const html = readDistFile(page);
    assert.ok(html.includes('id="theme-toggle"'), `${page} missing id="theme-toggle"`);
    assert.ok(
      html.includes('aria-label="Switch to dark theme"'),
      `${page} missing initial aria-label="Switch to dark theme"`
    );
  }
});

test('6. the toggle button markup contains icon-sun and icon-moon elements with aria-hidden', () => {
  for (const page of PAGES) {
    const html = readDistFile(page);
    assert.match(
      html,
      /class="icon-sun"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="icon-sun"/,
      `${page} missing icon-sun element with aria-hidden="true"`
    );
    assert.match(
      html,
      /class="icon-moon"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="icon-moon"/,
      `${page} missing icon-moon element with aria-hidden="true"`
    );
  }
});

test('7. the built stylesheet contains a [data-theme="dark"] selector', () => {
  const css = readDistCss();
  assert.match(css, /\[data-theme\s*=\s*["']?dark["']?\]/i, 'built CSS missing [data-theme="dark"] selector');
});

test('8. the built stylesheet contains all five dark hex values', () => {
  const css = readDistCss();
  const darkHexValues = ['#09090b', '#18181b', '#60a5fa', '#fafafa', '#a1a1aa'];
  for (const hex of darkHexValues) {
    assert.match(css, new RegExp(escapeRegExp(hex), 'i'), `built CSS missing dark hex value ${hex}`);
  }
});

test('9. the built stylesheet contains a #theme-toggle rule with 44px min-width/min-height', () => {
  const css = readDistCss();
  assert.match(
    css,
    /#theme-toggle[^}]*min-width\s*:\s*44px/i,
    'built CSS missing #theme-toggle rule with min-width: 44px'
  );
  assert.match(
    css,
    /#theme-toggle[^}]*min-height\s*:\s*44px/i,
    'built CSS missing #theme-toggle rule with min-height: 44px'
  );
});

test('10. the built published post HTML contains --shiki-dark: at least once', () => {
  const html = readDistFile(`posts/${PUBLISHED_SLUG}/index.html`);
  assert.ok(html.includes('--shiki-dark:'), 'published post HTML missing --shiki-dark: custom property');
});

test('11. the built published post HTML has no baked-in single-theme class or inline token color', () => {
  const html = readDistFile(`posts/${PUBLISHED_SLUG}/index.html`);
  assert.ok(
    !html.includes('astro-code github-light'),
    'published post HTML still contains astro-code github-light (single-theme class not removed)'
  );
  assert.ok(
    !/style="color:#/.test(html),
    'published post HTML still contains an inline style="color:#..." on a token span'
  );
});

test('12. the built CSS maps .astro-code to var(--shiki-dark) under [data-theme="dark"]', () => {
  const css = readDistCss();
  assert.match(
    css,
    /\[data-theme\s*=\s*["']?dark["']?\][^{]*\.astro-code[^{]*\{[^}]*var\(--shiki-dark\)/,
    'built CSS missing [data-theme="dark"] .astro-code rule declaring var(--shiki-dark)'
  );
});

test('13. the built CSS declares var(--shiki-light) on .astro-code', () => {
  const css = readDistCss();
  assert.match(
    css,
    /\.astro-code[^{]*\{[^}]*var\(--shiki-light\)/,
    'built CSS missing .astro-code rule declaring var(--shiki-light)'
  );
});

test('14. the built CSS declares color: var(--text) on .katex', () => {
  const css = readDistCss();
  assert.match(
    css,
    /\.katex[^}]*color\s*:\s*var\(--text\)/,
    'built CSS missing a .katex rule declaring color: var(--text)'
  );
});

test('15. (tripwire) installed KaTeX still derives structural-element color from currentColor', () => {
  const katexCssPath = path.join(repoRoot, 'node_modules', 'katex', 'dist', 'katex.css');
  let katexCss;
  try {
    katexCss = readFileSync(katexCssPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Missing node_modules/katex/dist/katex.css (expected at ${katexCssPath}) - run npm install`);
    }
    throw err;
  }
  const failureMessage =
    'KaTeX changed how structural elements derive their color (border-color: currentColor ' +
    'under .katex * and/or fill: currentColor under .katex svg no longer both present). ' +
    'src/styles/prose.css now needs explicit per-selector overrides for ' +
    '.katex .mfrac .frac-line, .katex .katex-overline .overline-line, ' +
    '.katex .katex-underline .underline-line, .katex .katex-hline, ' +
    '.katex .katex-hdashline, and .katex .katex-rule.';
  assert.match(
    katexCss,
    /\.katex\s*\*[^}]*border-color\s*:\s*currentColor/,
    failureMessage
  );
  assert.match(
    katexCss,
    /\.katex\s+svg[^}]*fill\s*:\s*currentColor/,
    failureMessage
  );
});

test('16. prose.css no longer contains the stale "out of scope this phase: dark mode" comment', () => {
  const prosePath = path.join(repoRoot, 'src', 'styles', 'prose.css');
  const proseCss = readFileSync(prosePath, 'utf-8');
  assert.ok(
    !proseCss.includes('out of scope this phase: dark mode'),
    'src/styles/prose.css still contains the stale "out of scope this phase: dark mode" comment'
  );
});

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
