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
  // Two chapters exist in the current seed content (Cryptography,
  // Quantum Algorithms) since the 260905-rvd quick task added the
  // Cryptography chapter stub posts.
  assert.equal(summaryCount, 2, `expected 2 distinct chapters, found ${summaryCount}`);
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

test('7. right sidebar renders with the On this page title', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  assert.ok(html.includes('class="right-nav"'), 'expected class="right-nav" in post HTML');
  assert.ok(html.includes('On this page'), 'expected the "On this page" title string');
});

function extractRightNavRegion(html) {
  const start = html.indexOf('class="right-nav"');
  const end = html.indexOf('</aside>', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not find .right-nav region in post HTML');
  }
  return html.slice(start, end);
}

test('8. every outline link resolves to a heading id in the same document', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  const rightNav = extractRightNavRegion(html);
  const hrefs = [...rightNav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length >= 2, `expected at least 2 outline links, found ${hrefs.length}`);
  for (const id of hrefs) {
    assert.ok(
      new RegExp(`<h[23][^>]*\\sid="${id}"`).test(html),
      `expected an <h2 or <h3 with id="${id}" in the document`
    );
  }
});

test('9. outline covers only depth 2 and 3', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  const rightNav = extractRightNavRegion(html);
  const hrefs = [...rightNav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  for (const id of hrefs) {
    const match = new RegExp(`<h([2-6])[^>]*\\sid="${id}"`).exec(html);
    assert.ok(match, `expected a heading with id="${id}"`);
    assert.ok(
      match[1] === '2' || match[1] === '3',
      `expected outline id "${id}" to belong to h2/h3, found h${match[1]}`
    );
  }
});

test('10. D-10 gate: fewer than 2 headings renders no right sidebar', () => {
  // Source-level assertion: the current seed content has no post with fewer
  // than 2 qualifying headings, so this cannot be asserted against built
  // output today. Upgrade to a rendered-output assertion once a short post
  // exists in the seed content.
  const srcPath = path.join(repoRoot, 'src', 'pages', 'posts', '[slug].astro');
  const src = readFileSync(srcPath, 'utf-8');
  assert.match(
    src,
    /outlineHeadings\.length >= 2 &&[\s\S]*<RightNavSidebar/,
    'expected outlineHeadings.length >= 2 && to guard the <RightNavSidebar element'
  );
});

test('11. scroll-spy ships as a single inline script with no external dependency', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  assert.ok(html.includes('IntersectionObserver'), 'expected IntersectionObserver in built HTML');
  const scriptSrcTags = [...html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)].map((m) => m[1]);
  for (const src of scriptSrcTags) {
    assert.doesNotMatch(
      src,
      /scrollspy|gsap|jquery/i,
      `unexpected third-party scroll library script: ${src}`
    );
  }
});

function extractPostNavRegion(html) {
  const start = html.indexOf('class="post-nav"');
  const end = html.indexOf('</nav>', start);
  if (start === -1 || end === -1) {
    throw new Error('Could not find .post-nav region in post HTML');
  }
  return html.slice(start, end);
}

test('12. first post in reading order has a next link and no prev link', () => {
  const html = readHtml('posts/cryptography/index.html');
  const postNav = extractPostNavRegion(html);
  assert.ok(
    postNav.includes('href="/posts/asymmetric-and-symmetric-cryptography/"'),
    'expected next link to /posts/asymmetric-and-symmetric-cryptography/'
  );
  assert.ok(
    postNav.includes('Asymmetric and Symmetric Cryptography'),
    'expected next link labelled with the adjacent post title'
  );
  assert.ok(
    !postNav.includes('post-nav-prev'),
    'expected no prev link on the first post in reading order'
  );
});

test('13. mid-chapter post links prev and next within the chapter', () => {
  const html = readHtml('posts/hash-functions/index.html');
  const postNav = extractPostNavRegion(html);
  assert.ok(
    postNav.includes('href="/posts/asymmetric-and-symmetric-cryptography/"'),
    'expected prev link to /posts/asymmetric-and-symmetric-cryptography/'
  );
  assert.ok(
    postNav.includes('href="/posts/digital-signatures/"'),
    'expected next link to /posts/digital-signatures/'
  );
});

test('14. last post of a chapter flows into the next chapter', () => {
  const html = readHtml('posts/digital-signatures/index.html');
  const postNav = extractPostNavRegion(html);
  assert.ok(
    postNav.includes('href="/posts/why-quantum-computers-threaten-bitcoin/"'),
    'expected next link to cross the chapter boundary into Quantum Algorithms'
  );
});

test('15. last post overall has a prev link and no next link', () => {
  const html = readHtml('posts/authoring-primitives/index.html');
  const postNav = extractPostNavRegion(html);
  assert.ok(
    postNav.includes('post-nav-prev'),
    'expected a prev link on the last post in reading order'
  );
  assert.ok(
    !postNav.includes('post-nav-next'),
    'expected no next link on the last post in reading order'
  );
});

test('16. post-nav never references the draft post', () => {
  const slugs = nonDraftPostSlugs();
  for (const slug of slugs) {
    const html = readHtml(`posts/${slug}/index.html`);
    const postNav = extractPostNavRegion(html);
    assert.ok(
      !postNav.includes('shors-algorithm-in-plain-english'),
      `expected post-nav on ${slug} to not reference the draft post`
    );
  }
});

// Chapter accordions are siblings inside the left-nav region, so a plain
// split on '<details' is sufficient to isolate one chapter's fragment - no
// HTML parser needed.
function extractChapterFragment(navRegion, chapterName) {
  const parts = navRegion.split('<details');
  const fragment = parts.find((part) => part.includes(`<summary>${chapterName}</summary>`));
  if (!fragment) {
    throw new Error(`Could not find chapter accordion for "${chapterName}"`);
  }
  return fragment;
}

test('17. Cryptography chapter is hierarchical', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  const navRegion = extractLeftNavRegion(html);
  const fragment = extractChapterFragment(navRegion, 'Cryptography');

  const sectionCount = (fragment.match(/class="nav-section"/g) || []).length;
  const subsectionCount = (fragment.match(/class="nav-subsection"/g) || []).length;
  assert.equal(sectionCount, 1, `expected exactly one nav-section, found ${sectionCount}`);
  assert.equal(subsectionCount, 3, `expected exactly three nav-subsection, found ${subsectionCount}`);

  const sectionIndex = fragment.indexOf('class="nav-section"');
  const firstSubsectionIndex = fragment.indexOf('class="nav-subsection"');
  assert.ok(
    sectionIndex < firstSubsectionIndex,
    'expected the nav-section marker to appear before the first nav-subsection marker'
  );

  const sectionLiEnd = fragment.indexOf('</li>', sectionIndex);
  const sectionLi = fragment.slice(sectionIndex, sectionLiEnd);
  assert.ok(
    sectionLi.includes('href="/posts/cryptography/"'),
    'expected the nav-section li to link to /posts/cryptography/'
  );
});

test('18. Quantum Algorithms chapter renders flat', () => {
  const html = readHtml(`posts/${POST_SLUG}/index.html`);
  const navRegion = extractLeftNavRegion(html);
  const fragment = extractChapterFragment(navRegion, 'Quantum Algorithms');
  assert.ok(!fragment.includes('nav-section'), 'expected no nav-section in the flat-rendered chapter');
  assert.ok(!fragment.includes('nav-subsection'), 'expected no nav-subsection in the flat-rendered chapter');
});

test('19. mini-ToC on the section page', () => {
  const html = readHtml('posts/cryptography/index.html');
  const start = html.indexOf('class="chapter-toc"');
  const end = html.indexOf('</nav>', start);
  assert.notEqual(start, -1, 'expected a .chapter-toc box on the cryptography page');
  const fragment = html.slice(start, end);

  assert.ok(fragment.includes('In this chapter'), 'expected the "In this chapter" label');

  const hrefs = [...fragment.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(hrefs.length, 3, `expected exactly 3 hrefs in the mini-ToC, found ${hrefs.length}`);
  assert.ok(hrefs.includes('/posts/asymmetric-and-symmetric-cryptography/'));
  assert.ok(hrefs.includes('/posts/hash-functions/'));
  assert.ok(hrefs.includes('/posts/digital-signatures/'));
  assert.ok(
    !fragment.includes('href="/posts/cryptography/"'),
    'expected the mini-ToC to not link to itself'
  );
});

test('20. mini-ToC absent on non-section posts', () => {
  const slugs = nonDraftPostSlugs().filter((slug) => slug !== 'cryptography');
  for (const slug of slugs) {
    const html = readHtml(`posts/${slug}/index.html`);
    assert.ok(!html.includes('chapter-toc'), `expected no chapter-toc on ${slug}`);
  }
});

test('21. serif exception stays scoped', () => {
  const cssPath = path.join(repoRoot, 'src', 'styles', 'nav-sidebars.css');
  const css = readFileSync(cssPath, 'utf-8');
  const blocks = css.split('}').filter((block) => block.includes('Newsreader'));
  assert.equal(blocks.length, 1, `expected exactly one block declaring Newsreader, found ${blocks.length}`);
  assert.match(
    blocks[0],
    /\.left-nav \.nav-section > a\s*\{/,
    'expected the Newsreader block selector to be .left-nav .nav-section > a'
  );
});
