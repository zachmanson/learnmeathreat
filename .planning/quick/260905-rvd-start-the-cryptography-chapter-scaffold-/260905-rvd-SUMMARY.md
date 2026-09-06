---
phase: quick-260905-rvd
plan: 01
subsystem: content-navigation
tags: [astro, content-collections, navigation]
dependency-graph:
  requires: []
  provides: [chapter-order-module, post-nav-component, cryptography-chapter-stubs]
  affects: [src/components/LeftNavSidebar.astro, src/pages/posts/[slug].astro]
tech-stack:
  added: []
  patterns: ["single-source-of-truth module for cross-component ordering logic"]
key-files:
  created:
    - src/lib/chapter-order.ts
    - src/components/PostNav.astro
    - src/content/posts/cryptography.md
    - src/content/posts/asymmetric-and-symmetric-cryptography.md
    - src/content/posts/hash-functions.md
    - src/content/posts/digital-signatures.md
  modified:
    - src/components/LeftNavSidebar.astro
    - src/pages/posts/[slug].astro
    - src/styles/nav-sidebars.css
    - tests/reading-navigation.test.mjs
decisions:
  - "Extracted chapter grouping/sort logic into src/lib/chapter-order.ts as the single source of truth for both the left ToC sidebar and the new PostNav prev/next footer, so the two can never drift apart."
  - "Dated the 4 Cryptography stub posts 2026-08-20 through 2026-08-23 (earlier than the oldest Quantum Algorithms post) so the chapter sorts ahead in both the sidebar and the flat reading order, per the plan's explicit instruction."
metrics:
  duration: ~25 min
  completed: 2026-09-05
---

# Phase quick-260905-rvd Plan 01: Cryptography Chapter Scaffold + Prev/Next Nav Summary

Extracted chapter-ordering logic into a shared module, scaffolded 4 stub posts for a new Cryptography chapter, and added static (zero-JS) prev/next post footer navigation driven by the same reading order the sidebar uses.

## What Was Built

**Task 1 — Shared chapter-order module** (`src/lib/chapter-order.ts`, commit `61e5182`)
- `getChapters()`: fetches non-draft posts, sorts ascending by date, groups by `tags[0]` into a Map (insertion order = chapter display order).
- `getReadingOrder()`: flattens `getChapters()` values into one flat array — the site-wide reading order that prev/next indexes into.
- `LeftNavSidebar.astro` now imports `getChapters` instead of duplicating the grouping logic inline. Pure refactor, no visual change, verified by the pre-existing sidebar tests still passing.

**Task 2 — Cryptography chapter stub posts** (commit `528b97f`)
- 4 new posts: `cryptography`, `asymmetric-and-symmetric-cryptography`, `hash-functions`, `digital-signatures`.
- Dated 2026-08-20 to 2026-08-23, ahead of the existing "Quantum Algorithms" chapter's oldest post (2026-09-03), so Cryptography sorts first in both the sidebar and the reading order.
- Stub content only: one placeholder paragraph plus an outline bullet list per post — no real explainer content, no math, figures, callouts, or citations, per the plan's stub-content boundary.

**Task 3 — Static prev/next post navigation** (commit `c20e2f1`)
- `PostNav.astro`: takes `currentSlug`, calls `getReadingOrder()`, computes `prev`/`next` by array index. Renders at most two `<a>` tags labelled with the adjacent post's title, ships zero `<script>` tags.
- Wired into `[slug].astro` as the last child inside `<article>`, after `<Content />`.
- CSS appended to `nav-sidebars.css`: flexbox `space-between` layout, `next` pinned right via `margin-left: auto`, border-top matching the existing `prose.css` precedent (`1px solid var(--muted)`), zero new custom properties.
- Extended `tests/reading-navigation.test.mjs` with 5 new tests (12-16) covering: first-post-in-order has next-only, mid-chapter prev/next, cross-chapter-boundary flow, last-post-overall has prev-only, and draft-post exclusion from all post-nav blocks.
- Updated the pre-existing test 3 assertion (chapter count) from 1 to 2, since the Cryptography chapter now exists alongside Quantum Algorithms — this assertion was stale as a direct, in-scope consequence of Task 2's content changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale chapter-count assertion in reading-navigation.test.mjs**
- **Found during:** Task 3 verification (`npm test`)
- **Issue:** Test 3 ("chapters render as native details/summary accordions") hardcoded an expectation of exactly 1 chapter, which broke once Task 2 added the Cryptography chapter.
- **Fix:** Updated the assertion from `assert.equal(summaryCount, 1, ...)` to `assert.equal(summaryCount, 2, ...)` with an updated comment.
- **Files modified:** `tests/reading-navigation.test.mjs`
- **Commit:** `c20e2f1`

## Deferred Issues

**1. [Out of scope] `tests/theming.test.mjs` test 15 fails: missing `node_modules/katex/dist/katex.css`**
- Pre-existing environment/dependency issue unrelated to this plan's changes — confirmed `node_modules/katex/dist/` does not exist in the worktree, unrelated to any file this plan touched.
- Logged to `.planning/quick/260905-rvd-start-the-cryptography-chapter-scaffold-/deferred-items.md`.
- Not fixed, per scope boundary rules (only auto-fix issues directly caused by this plan's changes).
- Resolution: run `npm install` to restore the missing katex dist assets.

## Verification

- `npm run build` succeeds after each task; all 8 pages (4 existing + 4 new) build.
- `npm test`: 70/71 tests pass. The 1 failure is the pre-existing, out-of-scope katex dependency issue documented above — no test related to this plan's changes fails.
- Manual spot check of `dist/posts/cryptography/index.html`: Cryptography chapter appears first in the left ToC (before Quantum Algorithms), listing all 4 posts in reading order; post-nav shows only a next link (correctly omits prev, since it's first in reading order).
- `grep -c "<script"` on post pages confirms PostNav introduces zero new `<script>` tags (script-count differences between pages are explained by the pre-existing RightNavSidebar's `>= 2 headings` guard, not by PostNav).

## Known Stubs

The 4 new Cryptography posts (`cryptography.md`, `asymmetric-and-symmetric-cryptography.md`, `hash-functions.md`, `digital-signatures.md`) are intentional stubs per the plan's explicit stub-content boundary — each contains a single "not written yet" paragraph plus an outline bullet list, no real explainer content. These are placeholders to be resolved when the user writes the actual chapter content in a future plan.

## Self-Check: PASSED

Verified all claimed files exist and all claimed commits exist in git log.
