---
phase: quick-260905-svh
plan: 01
subsystem: ui
tags: [astro, content-collections, homepage]

requires:
  - phase: quick-260905-sdo
    provides: "getChapters()/splitChapter() in src/lib/chapter-order.ts (single source of truth for chapter grouping)"
provides:
  - "Homepage listing grouped by chapter reading order instead of flat reverse-chron"
  - "Section post (full excerpt) + subsection sub-list (title-only) rendering on the homepage, matching the sidebar/mini-ToC pattern"
affects: [homepage, content-authoring]

tech-stack:
  added: []
  patterns:
    - "Homepage consumes getChapters()/splitChapter() directly rather than re-querying/re-sorting the content collection — avoids a second divergent ordering rule"

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - tests/site-structure.test.mjs

key-decisions:
  - "Rendered subsection posts in a separate sibling <ul class=\"subsection-list\"> (not nested <li>s inside the section post's <li>) so the DOM structure itself distinguishes section vs subsections, matching the plan's structural test requirement"
  - "Used Astro's shorthand fragment (<>...</>) instead of an explicit Fragment import — no import needed, keeps the diff minimal"

patterns-established:
  - "Any future page that needs chapter-aware post listings should import getChapters/splitChapter from src/lib/chapter-order.ts rather than re-deriving chapter grouping"

requirements-completed: [QUICK-SVH-01]

duration: 25min
completed: 2026-09-05
---

# Quick Task 260905-svh: Homepage Chapter-Grouped Listing Summary

**Homepage now renders posts grouped by chapter in reading order (Cryptography before Quantum Algorithms) instead of one flat reverse-chronological list, using the existing `getChapters`/`splitChapter` helpers.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Replaced the homepage's own `getCollection` + descending-date sort with `getChapters()`/`splitChapter()` from `src/lib/chapter-order.ts`, eliminating a second, divergent ordering rule
- Cryptography chapter now shows its section post (`cryptography.md`) with full title/meta/excerpt, followed by a structurally separate title-only `<ul class="subsection-list">` for its 3 subsections
- Quantum Algorithms (no `section: true` post) renders exactly as before — flat, full excerpts, unindented
- Added 4 new tests (9-12) asserting chapter order, section excerpt presence, subsection title-only/separate-list structure, and unchanged flat-fallback rendering

## Task Commits

1. **Task 1: Rewrite the homepage listing as chapter-grouped sections** - `a1e1e33` (feat)
2. **Task 2: Extend homepage tests for chapter order and section/subsection structure** - `78e6475` (test)

## Files Created/Modified
- `src/pages/index.astro` - Chapter-grouped rendering via getChapters/splitChapter; added `.chapter` and `.subsection-list` styles reusing existing `--space-*` tokens
- `tests/site-structure.test.mjs` - Added tests 9-12 for chapter order, section excerpt, subsection structure, and flat-fallback

## Decisions Made
- Subsection list rendered as a sibling `<ul>`, not nested `<li>`s, per plan's structural test requirement (a "different list element" makes the section/subsection distinction unambiguous in the DOM and in tests)
- No new CSS custom properties — reused `--space-md`, `--space-sm`, `--space-xl` per plan's interface contract

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

`node --test tests/` (directory form) failed to resolve on this Windows/Node 24 environment with `MODULE_NOT_FOUND`; used the equivalent `node --test tests/*.test.mjs` glob instead, which ran the full suite as intended. This is an environment/invocation quirk, not a code issue — no change needed to the test files themselves.

One pre-existing, unrelated test failure was observed: `tests/theming.test.mjs` test 15 fails because `node_modules/katex/dist/katex.css` is missing in this worktree (likely a fresh `npm install` needed, unrelated to this plan's file scope). Out of scope per the plan's file list (`src/pages/index.astro`, `tests/site-structure.test.mjs` only) — not touched, not fixed, flagged here for visibility.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
Homepage now matches the sidebar/mini-ToC reading-order hierarchy. No blockers. The `katex.css` missing-file issue in `tests/theming.test.mjs` is unrelated to this task's scope and should be investigated separately (likely needs `npm install` in this worktree).

---
*Phase: quick-260905-svh*
*Completed: 2026-09-05*
