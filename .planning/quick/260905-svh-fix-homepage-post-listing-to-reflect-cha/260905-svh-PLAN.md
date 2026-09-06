---
phase: quick-260905-svh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/index.astro
  - tests/site-structure.test.mjs
autonomous: true
requirements: [QUICK-SVH-01]

must_haves:
  truths:
    - "Homepage lists chapters in reading order: Cryptography appears above Quantum Algorithms"
    - "Each chapter has its own heading on the homepage"
    - "The Cryptography chapter shows its section post (cryptography.md) with title, meta and full excerpt, followed by an indented title-only sub-list of its 3 subsection posts"
    - "The Quantum Algorithms chapter (no section post) renders exactly as the homepage renders posts today: title + meta + full excerpt, unindented"
    - "The zero-posts empty state, the h1 and the intro paragraph are unchanged"
  artifacts:
    - path: "src/pages/index.astro"
      provides: "Chapter-grouped homepage listing driven by getChapters/splitChapter"
      contains: "getChapters"
    - path: "tests/site-structure.test.mjs"
      provides: "dist/index.html assertions for chapter order and section/subsection rendering"
      contains: "Quantum Algorithms"
  key_links:
    - from: "src/pages/index.astro"
      to: "src/lib/chapter-order.ts"
      via: "import { getChapters, splitChapter }"
      pattern: "from '\\.\\./lib/chapter-order'"
---

<objective>
`src/pages/index.astro` still sorts every post by date descending into one flat `<ul>`. Since the Cryptography chapter was deliberately dated August 2026 (before Quantum Algorithms' September posts) to mark it as prerequisite reading, reverse-chron pushes it to the bottom and interleaves chapters with no grouping — contradicting the reading-order hierarchy the sidebar, mini chapter ToC and prev/next nav already use.

Purpose: make the homepage the same book-shaped index as the rest of the site, from the single source of truth (`src/lib/chapter-order.ts`) rather than a second, divergent sort.
Output: rewritten homepage listing + extended `dist/index.html` assertions.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/pages/index.astro
@src/lib/chapter-order.ts
@tests/site-structure.test.mjs
</context>

<interfaces>
<!-- Contracts the executor needs. Do not re-derive these from the codebase. -->

From `src/lib/chapter-order.ts`:
```ts
export function getChapters(): Promise<Map<string, CollectionEntry<'posts'>[]>>;
export function splitChapter(chapterPosts: CollectionEntry<'posts'>[]): {
  sectionPost: CollectionEntry<'posts'> | null;
  subsectionPosts: CollectionEntry<'posts'>[];
};
```
`getChapters()` already filters `draft`, already sorts posts oldest-first within a chapter, and its Map insertion order already IS chapter reading order. Iterate it directly; do not sort it, do not re-filter drafts.

Post frontmatter fields used by the current listing: `title`, `date` (Date), `tags` (string[]), `excerpt`, `slug`.

Established content state (published posts only, in reading order):
- Chapter `Cryptography` — `cryptography` (2026-08-20, `section: true`), `asymmetric-and-symmetric-cryptography` (08-21), `hash-functions` (08-22), `digital-signatures` (08-23)
- Chapter `Quantum Algorithms` — `why-quantum-computers-threaten-bitcoin` (2026-09-03), `authoring-primitives` (09-05). No `section: true` post → flat fallback path.
- `shors-algorithm-in-plain-english` is `draft: true` and must stay off the homepage (already asserted by existing test 4).

Sidebar subsection indent, from `src/styles/nav-sidebars.css`:
```css
.left-nav .nav-subsection { padding-left: var(--space-md); }
```
Match `var(--space-md)` exactly for the homepage sub-list indent. `--space-*` tokens are defined in `global.css`; declare no new custom properties.

`global.css` already applies the serif accent font to `h1`–`h3` site-wide, so a bare `<h2>{chapterName}</h2>` needs no new CSS rule.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite the homepage listing as chapter-grouped sections</name>
  <files>src/pages/index.astro</files>
  <action>
Replace the frontmatter's `getCollection` + descending-date sort with `import { getChapters, splitChapter } from '../lib/chapter-order';` and `const chapters = await getChapters();`. Drop the now-unused `getCollection` import.

Keep `<h1>Learn Me a Threat</h1>` and the `.intro` paragraph exactly as they are, above everything.

Keep the existing empty-state branch verbatim — condition it on total post count being zero (e.g. `chapters.size === 0`), rendering the same `.empty-state` block.

Otherwise, iterate `[...chapters]` in Map order (no sorting, no reordering) and for each `[chapterName, chapterPosts]` render a `<section>` containing:
1. `<h2>{chapterName}</h2>` — plain, no class, no new CSS.
2. `const { sectionPost, subsectionPosts } = splitChapter(chapterPosts);`
3. If `sectionPost` is non-null: render it inside a `<ul class="post-list">` using the CURRENT `<li>` markup byte-for-byte — `<a class="post-title" href={`/posts/${post.data.slug}/`}>`, `<p class="meta">{post.data.date.toDateString()} &middot; {post.data.tags.join(', ')}</p>`, `<p class="excerpt">{post.data.excerpt}</p>`. Then, when `subsectionPosts.length > 0`, render them in a SEPARATE `<ul class="subsection-list">` element (not nested `<li>`s of the section entry — a distinct sibling list makes the test's "different list element" assertion structural). Each subsection `<li>` contains ONLY the title link: no `.meta` line, no `.excerpt` paragraph.
4. If `sectionPost` is null: render every post in `chapterPosts` in a single `<ul class="post-list">` with the exact same full `<li>` markup as (3)'s section entry — no indentation, no sub-list, no special casing. This path must be structurally identical to today's output for the Quantum Algorithms chapter.

Styles: keep the existing scoped `<style>` block's `.intro`, `.post-list`, `.post-title`, `.post-list .meta`, `.post-list .excerpt` rules unchanged. Add only what the new sub-list needs, reusing existing tokens: `.subsection-list { list-style: none; margin: 0; padding-left: var(--space-md); display: flex; flex-direction: column; gap: var(--space-sm); }` plus whatever minimal vertical spacing separates chapter `<section>`s (use an existing `--space-*` token). Declare zero new custom properties. Add zero client-side JS.

Do not touch LeftNavSidebar.astro, RightNavSidebar.astro, PostNav.astro, `[slug].astro`, or any post frontmatter/content.
  </action>
  <verify>
    <automated>cd "C:/Users/zachm/Documents/vibing/learnmeathreat" && npm run build</automated>
  </verify>
  <done>`npm run build` succeeds; `dist/index.html` shows a Cryptography chapter heading before a Quantum Algorithms heading, the Cryptography section post with its excerpt followed by 3 title-only indented links, and both Quantum Algorithms posts with full excerpts.</done>
</task>

<task type="auto">
  <name>Task 2: Extend homepage tests for chapter order and section/subsection structure</name>
  <files>tests/site-structure.test.mjs</files>
  <action>
Extend `tests/site-structure.test.mjs` (the file that already owns `dist/index.html` assertions). Existing tests 1–8 all remain valid — none of them assert reverse-chron ordering — so do NOT modify or renumber them. Append new tests numbered 9 onward, following the file's existing conventions: `node:test` + `node:assert/strict`, the module-local `readDistFile` helper, and the `escapeRegExp` helper for literal strings in regexes.

Add module-level constants for the exact strings (copy them byte-for-byte from the post frontmatter):
- `CRYPTO_EXCERPT` = cryptography.md's excerpt
- the three Cryptography subsection excerpts (asymmetric-and-symmetric-cryptography, hash-functions, digital-signatures)
- `AUTHORING_EXCERPT` = authoring-primitives.md's excerpt (`PUBLISHED_EXCERPT` already covers why-quantum-computers-threaten-bitcoin)

New tests:
9. Chapter reading order — match `/<h2[^>]*>Cryptography<\/h2>/` and `/<h2[^>]*>Quantum Algorithms<\/h2>/` against `dist/index.html`, assert both match, and assert the Cryptography heading's index is strictly less than the Quantum Algorithms heading's index. Use the heading regexes (not a bare `indexOf('Cryptography')`) so the substring inside the "Asymmetric and Symmetric Cryptography" post title cannot make the assertion pass or fail for the wrong reason.
10. Section post excerpt present — `html.includes(CRYPTO_EXCERPT)`.
11. Subsections are linked and title-only — assert `href="/posts/{slug}/"` is present for all three subsection slugs, AND that none of the three subsection excerpt strings appears anywhere in `dist/index.html` (they are only ever rendered on their own post pages, so a global absence check is both precise and simpler than a proximity check). Additionally assert `dist/index.html` contains `class="subsection-list"`, and that each of the three subsection links falls inside the `<ul class="subsection-list">…</ul>` slice while the Cryptography section post's own link does not — this pins the structural "different list element" requirement.
12. Flat fallback unchanged — assert `dist/index.html` still contains `PUBLISHED_EXCERPT` and `AUTHORING_EXCERPT` in full (the Quantum Algorithms chapter keeps excerpts because it has no section post).

If any new assertion fails because of an implementation detail chosen in Task 1 (e.g. a different sub-list class name), fix the test to match the shipped markup rather than weakening it to a substring check that would still pass under the old flat reverse-chron rendering.
  </action>
  <verify>
    <automated>cd "C:/Users/zachm/Documents/vibing/learnmeathreat" && npm run build && node --test tests/</automated>
  </verify>
  <done>Full `node --test tests/` suite passes, including new tests 9–12; no pre-existing test was modified or renumbered.</done>
</task>

</tasks>

<verification>
- `npm run build` exits 0.
- `node --test tests/` passes with zero failures across all five test files (`site-structure`, `theming`, `reading-navigation`, `markdown-pipeline`, `authoring-primitives`).
- `git diff --name-only` shows only `src/pages/index.astro` and `tests/site-structure.test.mjs` changed.
- `grep -c "getCollection" src/pages/index.astro` returns 0 — the homepage no longer runs its own query/sort.
- No new CSS custom property: `grep -E "^\s*--[a-z]" src/pages/index.astro` returns nothing.
- No client JS: `grep -c "<script" src/pages/index.astro` returns 0.
</verification>

<success_criteria>
Homepage renders chapters in reading order (Cryptography, then Quantum Algorithms), each under its own `<h2>`; Cryptography shows its section post in full followed by an indented title-only sub-list of 3 links; Quantum Algorithms renders unchanged from today's flat full-excerpt style; the empty state, h1 and intro are untouched; nav components, `[slug].astro` and all post content are unmodified; all tests pass.
</success_criteria>

<output>
Create `.planning/quick/260905-svh-fix-homepage-post-listing-to-reflect-cha/260905-svh-SUMMARY.md` when done
</output>
