---
phase: 02-visual-design-theming
plan: 03
subsystem: ui
tags: [astro, fontsource, css, typography, dark-mode]

# Dependency graph
requires:
  - phase: 02-visual-design-theming (02-01, 02-02)
    provides: dark-mode toggle, palette, and dual-theme math/code legibility
provides:
  - Self-hosted heading accent font (Newsreader, weight 600, h1-h3 only)
  - Softer dark palette (#1E1E1E bg / #34D399 emerald accent) replacing near-black/blue
  - Corrected site name ("Learn Me a Threat") across source and active planning docs
  - Human-verified sign-off on the full Phase 2 visual result
affects: [content, layout, future-phases]

# Tech tracking
tech-stack:
  added: ["@fontsource/newsreader@^5.3.0"]
  removed: ["@fontsource/ibm-plex-mono"]
  patterns: ["Self-hosted single-weight Fontsource import, scoped to h1-h3 only, enforced by an automated selector-scope guardrail test"]

key-files:
  created:
    - .planning/phases/02-visual-design-theming/02-03-SUMMARY.md
  modified:
    - package.json
    - package-lock.json
    - src/layouts/Layout.astro
    - src/styles/global.css
    - src/pages/index.astro
    - tests/theming.test.mjs
    - CLAUDE.md
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/research/SUMMARY.md

key-decisions:
  - "Swapped planned IBM Plex Mono heading accent for Newsreader (serif) after human-verify checkpoint feedback that the mono font read as a 'code-blog gimmick' rather than a quiet accent - serif-on-sans is a standard editorial pairing that keeps a distinct accent (D-02) without the terminal association."
  - "Darkened palette moved from near-black (#09090B) to a softer charcoal (#1E1E1E, Notepad++/VS-Code-style) and swapped the blue accent (#60A5FA) for a muted emerald green (#34D399, ~8.7:1 contrast) per user feedback, avoiding a saturated 'matrix green' look."
  - "Corrected project/site name from 'Learn Me the Threat' to 'Learn Me a Threat' (learnmeathreat.com reads as 'learn me a threat') across source and the currently-active planning docs (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, research/SUMMARY.md, CLAUDE.md). Did not rewrite historical phase 1/2 plan and research artifacts under .planning/phases/ - those are point-in-time records."

patterns-established:
  - "Human-verify checkpoints in this project can fold visual-feedback fixes (font, color) directly into the closing plan when the fix is small and mechanical, rather than always spinning up a new phase - deferred only the genuinely new feature (ToC/sidebar) to a future phase."

requirements-completed: [DSGN-01, DSGN-02, DSGN-04]

duration: ~35min
completed: 2026-09-04
---

# Phase 2: Visual Design & Theming Summary

**Self-hosted Newsreader heading accent, a softer charcoal/emerald dark palette, and a corrected site name, all signed off via human visual verification in both themes at desktop and 375px mobile width.**

## Performance

- **Duration:** ~35 min (Task 1 + checkpoint iteration)
- **Completed:** 2026-09-04
- **Tasks:** 2/2 (1 automated, 1 human-verify checkpoint)
- **Files modified:** 11

## Accomplishments
- Self-hosted `@fontsource/newsreader` weight-600-only heading accent, confined to h1-h3 by an automated selector-scope guardrail (test 20) and a fake-bold weight guard (test 21)
- Dark palette softened from near-black/blue to a charcoal/emerald combination that reads as intentional rather than harsh, still meeting WCAG AA contrast (~8.7:1 for the accent)
- Site name corrected project-wide in source and active docs
- Full Phase 2 visual result (toggle, no-flash persistence, OS-preference fallback, tamper-check fallback, dark-mode math/code legibility, heading font, mobile layout) human-verified and approved

## Task Commits

1. **Task 1: Install and apply IBM Plex Mono heading accent** - `1623e76` (feat) — later superseded by the checkpoint fix below
2. **STATE.md checkpoint note** - `08490c0` (docs)
3. **Checkpoint fix: font swap, palette swap, site name correction** - `359ba1a` (fix)

**Plan metadata:** this commit (docs: complete plan)

## Files Created/Modified
- `src/layouts/Layout.astro` - font import swapped to `@fontsource/newsreader/600.css`; site title corrected to "Learn Me a Threat"
- `src/styles/global.css` - h1/h2/h3 font-family swapped to Newsreader; dark-theme `--bg`/`--surface`/`--accent` values replaced
- `src/pages/index.astro` - site name corrected
- `tests/theming.test.mjs` - tests 17/20/21 updated to assert Newsreader instead of IBM Plex Mono; test 8's expected dark hex values updated
- `package.json` / `package-lock.json` - `@fontsource/ibm-plex-mono` removed, `@fontsource/newsreader@^5.3.0` added; package name corrected to `learn-me-a-threat`
- `CLAUDE.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/research/SUMMARY.md` - site name corrected

## Decisions Made
See `key-decisions` in frontmatter above.

## Deviations from Plan

### Auto-fixed Issues (originally reported by Task 1's executor, superseded)

**1. [Rule 1 - Cosmetic] Reworded `is:inline`-referencing comments (plan 02-01, prior wave)**
- Not part of this plan; recorded here only for continuity - see `02-01-SUMMARY.md`.

### Checkpoint-driven fix (this plan)

**1. Human-verify feedback: font, palette, and site name**
- **Found during:** Task 2 (Human verification checkpoint)
- **Issue:** User reported the IBM Plex Mono heading accent read as a "code-blog gimmick," the dark background was "too black," the blue accent should be a soft green (not neon/matrix), and the site name was wrong ("Learn Me the Threat" vs. the correct "Learn Me a Threat").
- **Fix:** Consulted `ui-ux-pro-max` typography guidance, selected Newsreader (serif) as a mechanical drop-in replacement at the same size/weight/line-height; picked `#1E1E1E`/`#2A2A2A`/`#34D399` as a softer charcoal + muted-emerald palette (contrast-checked); corrected the site name in source and active planning docs.
- **Files modified:** see Files Created/Modified above.
- **Verification:** `npm test` — 38/38 passing after each change; user visually re-verified in browser and confirmed "yes all look good."
- **Committed in:** `359ba1a`

---

**Total deviations:** 1 checkpoint-driven fix, user-approved.
**Impact on plan:** No scope creep — fix stayed within Phase 2's "visual design & theming" boundary (typography and color are exactly what this phase delivers). A related but genuinely new feature request (left ToC + right "on this page" sidebar, shorter anchor-link hashes) was explicitly deferred to a future phase rather than folded in here.

## Issues Encountered
None beyond the checkpoint feedback documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 (Visual Design & Theming) is complete: DSGN-01 (no imagery/marketing styling), DSGN-02 (distinct-but-quiet heading accent), DSGN-03 (working dark-mode toggle with legible math/code — completed in 02-01/02-02), and DSGN-04 (clean 375px layout) are all satisfied and human-verified.
- Deferred to a future phase (not yet planned): a collapsible left table-of-contents + right "on this page" section-header sidebar, and a shorter/different anchor-link hash scheme for headings. Should go through `gsd-discuss-phase` given the layout/responsive/interaction design surface.
- User also raised a question about the authoring workflow for future posts; answered in-session — confirmed as: local Markdown/LaTeX drafts in `src/content/posts/`, git-based, no CMS, collaborative editing with Claude. No code change needed; already matches PROJECT.md's existing decision.

---
*Phase: 02-visual-design-theming*
*Completed: 2026-09-04*
