---
phase: quick/260905-sdo
plan: 01
subsystem: reading-navigation
tags: [left-sidebar, content-schema, chapter-hierarchy]
requirements: [NAV-SECTION-01]
dependency-graph:
  requires: [src/lib/chapter-order.ts, src/components/LeftNavSidebar.astro, src/pages/posts/[slug].astro]
  provides: [splitChapter helper, .nav-section/.nav-subsection CSS, .chapter-toc mini-ToC]
  affects: [src/content.config.ts, src/content/posts/cryptography.md]
tech-stack:
  added: []
  patterns: ["synchronous partition helper over an already-ordered array, shared by two consumers"]
key-files:
  created: []
  modified:
    - src/content.config.ts
    - src/content/posts/cryptography.md
    - src/lib/chapter-order.ts
    - src/components/LeftNavSidebar.astro
    - src/pages/posts/[slug].astro
    - src/styles/nav-sidebars.css
    - tests/reading-navigation.test.mjs
decisions: []
metrics:
  duration: ~35 min
  completed: 2026-09-06
---

# Phase quick/260905-sdo Plan 01: Explicit section/subsection chapter hierarchy Summary

One-liner: Added a `section: true` frontmatter flag and a shared `splitChapter()` helper so the Cryptography chapter renders as an intro page + 3 indented subsections in the left sidebar, with a matching "In this chapter" mini-ToC box on the intro page itself — while chapters with no section post (Quantum Algorithms) stay byte-identical to their old flat rendering.

## What Was Built

**Task 1 — Schema field, section flag, and splitChapter helper**
- Added `section: z.boolean().default(false)` to the posts Zod schema in `src/content.config.ts`, with a comment explaining the default keeps unmarked chapters on the flat-rendering path.
- Marked `src/content/posts/cryptography.md` with `section: true`; the three sibling posts (asymmetric-and-symmetric-cryptography, hash-functions, digital-signatures) and all Quantum Algorithms posts were left untouched, taking the `false` default.
- Added `splitChapter(chapterPosts)` to `src/lib/chapter-order.ts` — a pure, synchronous function that partitions an already-ordered chapter array into `{ sectionPost, subsectionPosts }`. Finds the first post with `data.section === true`; if none exists, returns `{ sectionPost: null, subsectionPosts: [...chapterPosts] }` (the flat/unchanged path). If multiple posts are marked, the first wins — documented in a comment as a deliberate choice over throwing a build error.

**Task 2 — Left sidebar hierarchy**
- `LeftNavSidebar.astro` now imports `splitChapter` alongside `getChapters` and calls it per chapter. When a `sectionPost` exists, renders one `<li class="nav-section">` for it followed by `<li class="nav-subsection">` for each remaining post. When `sectionPost` is null, falls back to the original unclassed `<li>` markup, exactly as before.
- Added `.left-nav .nav-section > a` (Newsreader serif, weight 600) and `.left-nav .nav-subsection` (16px indent via the existing `--space-md` token) to `nav-sidebars.css`, inserted immediately before `.left-nav a[aria-current="page"]` per the plan's CRITICAL note — both selectors share specificity 0,2,1, so source order determines which wins the tie, and the active-page accent must still win.

**Task 3 — Mini chapter ToC**
- `[slug].astro` imports `getChapters`/`splitChapter`, guards the extra lookup behind `post.data.section`, and renders a `<nav class="chapter-toc" aria-label="In this chapter">` box (with an `<h/>`-free label paragraph and a `<ul>` of subsection links) between the post meta line and `<Content />`. Gated on `post.data.section && subsectionPosts.length > 0`.
- Added `.chapter-toc` + related rules to `nav-sidebars.css`, deliberately mirroring `prose.css`'s `.callout`/`.callout-note` visual values without reusing those classes (avoids inheriting the "Note: " pseudo-element label).

**Task 4 — Tests**
- Appended tests 17-21 to `tests/reading-navigation.test.mjs`, reusing `readHtml`/`extractLeftNavRegion`/`nonDraftPostSlugs` and adding one local `extractChapterFragment` helper (splits the nav region on `<details`, matches the fragment whose `<summary>` text equals the target chapter name).
  - 17: Cryptography accordion has exactly 1 `nav-section` and 3 `nav-subsection`, section link points at `/posts/cryptography/`, and the section marker precedes the first subsection marker.
  - 18: Quantum Algorithms accordion contains neither `nav-section` nor `nav-subsection`.
  - 19: cryptography.md's built HTML has a `.chapter-toc` box with exactly 3 hrefs (the three subsections) and no self-link.
  - 20: every non-draft, non-cryptography post's built HTML contains no `chapter-toc` string.
  - 21: exactly one CSS block in `nav-sidebars.css` declares Newsreader, and its selector is `.left-nav .nav-section > a`.
- Tests 1-16 were not modified and all still pass.

## Verification

- `npx astro build` and `npm run build` succeeded after every task.
- `npm test`: all 21 tests in `tests/reading-navigation.test.mjs` pass (76 total tests across all suites, 75 pass). The 1 failure is `tests/theming.test.mjs` test 15, a pre-existing environment issue (`Missing node_modules/katex/dist/katex.css - run npm install`) unrelated to any file touched by this plan — out of scope per the scope boundary rule, not fixed.
- Manually confirmed in built output: Cryptography chapter's `<li>` elements carry `nav-section`/`nav-subsection` classes; Quantum Algorithms chapter's `<li>` elements carry no class at all (byte-identical to pre-plan markup).
- `grep -c -- "--[a-z0-9-]*:" src/styles/nav-sidebars.css` (excluding comments) returns 0 — no new CSS custom properties introduced.

## Deviations from Plan

None — plan executed exactly as written. All 4 tasks completed in order with no Rule 1-4 triggers.

## Known Issues (Deferred, Out of Scope)

- `tests/theming.test.mjs` test 15 fails due to a missing `node_modules/katex/dist/katex.css` file in this environment. Pre-existing, unrelated to this plan's files — not touched per the scope boundary rule.

## Self-Check: PASSED

- FOUND: src/content.config.ts (section field present)
- FOUND: src/content/posts/cryptography.md (section: true present)
- FOUND: src/lib/chapter-order.ts (splitChapter exported)
- FOUND: src/components/LeftNavSidebar.astro (splitChapter import + nav-section/nav-subsection markup)
- FOUND: src/pages/posts/[slug].astro (chapter-toc markup)
- FOUND: src/styles/nav-sidebars.css (.nav-section, .nav-subsection, .chapter-toc rules)
- FOUND: tests/reading-navigation.test.mjs (tests 17-21)
- FOUND commit f27db1a (Task 1)
- FOUND commit 666fac8 (Task 2)
- FOUND commit d8a7fbf (Task 3)
- FOUND commit 6bdec07 (Task 4)
