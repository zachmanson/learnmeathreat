---
phase: 01-scaffolding-core-content-pipeline
plan: 01

subsystem: content-pipeline
tags: [astro, content-collections, zod, markdown, static-site]

requires: []
provides:
  - Scaffolded Astro 7 static site (package.json, astro.config.mjs, tsconfig.json)
  - "posts" Content Collection with glob() loader and 6-field Zod schema (title, date, tags, excerpt, slug, draft)
  - Two seed posts (one published with real LaTeX math + code fence, one draft) proving the draft-filter pipeline
  - Shared Layout.astro with Home/About nav, consumed by every page
  - Homepage post list (PAGE-01), About page (PAGE-03), dynamic post route (PAGE-02)
  - tests/site-structure.test.mjs - node:test suite asserting 8 properties of built dist/ HTML
affects: [01-02-markdown-rendering-pipeline]

tech-stack:
  added: [astro@^7.3.1, "@astrojs/markdown-remark@^7.3.0", remark-math@^6.0.0, rehype-katex@^7.0.1, katex@^0.18.5, rehype-slug@^6.0.0, rehype-autolink-headings@^7.1.0]
  patterns:
    - "Content Collections with frontmatter-driven slug (D-05): routes key off post.data.slug, never post.id"
    - "Draft posts fully unbuilt: getStaticPaths() filters ({ data }) => !data.draft, so drafts produce zero dist/ output (RESEARCH Open Question 1, resolved)"
    - "node:test as the only test runner - zero test-framework dependency, assertions run against built dist/ HTML rather than component output"

key-files:
  created:
    - src/content.config.ts
    - src/content/posts/why-quantum-computers-threaten-bitcoin.md
    - src/content/posts/shors-algorithm-in-plain-english.md
    - src/layouts/Layout.astro
    - src/pages/index.astro
    - src/pages/about.astro
    - "src/pages/posts/[slug].astro"
    - src/styles/global.css
    - tests/site-structure.test.mjs
  modified: []

key-decisions:
  - "Drafts fully unbuilt (not just unlisted): getStaticPaths() excludes draft posts entirely, so a draft:true post produces no page in dist/ at all - resolves RESEARCH Open Question 1 in favor of its own recommendation."
  - "package.json test script deviates from the plan's literal string (see Deviations) due to a reproducible Node 24 + Windows bug with directory-arg test discovery."
  - "PUBLISHED_EXCERPT reworded to avoid apostrophes after discovering Astro's template text interpolation HTML-escapes them (&#39;), which broke a byte-for-byte string match against raw frontmatter."

patterns-established:
  - "Layout.astro is the single shared shell every page renders through - accepts title: string, renders nav + <slot />"
  - "Homepage/post-list-specific CSS lives in a scoped <style> block inside the page, not in global.css, so later phases can style global.css without touching page-specific layout"

requirements-completed: [CONT-01, PAGE-01, PAGE-02, PAGE-03, PAGE-04]

duration: ~55min
completed: 2026-09-03
---

# Phase 1 Plan 1: Scaffolding & Core Content Pipeline Summary

**Astro 7 walking skeleton with a Zod-validated Content Collection, a homepage post list, an About page, and a dynamic post route, all proven end-to-end by a node:test suite that reads the built dist/ HTML.**

## Performance

- **Duration:** ~55 min
- **Tasks:** 3 completed
- **Files modified:** 15 (8 scaffold/config + 6 new source files + 1 test file, across 3 commits)

## Environment

- **Node version:** v24.14.0 (PROJECT.md's "^20/^22 LTS" line predates Node 24 going LTS; v24 works fine, per plan instructions this was not downgraded)
- **npm version:** 11.9.0
- **Astro version installed:** 7.3.1 (pinned range `^7.3.1` in package.json, matches RESEARCH)
- **Scaffold path:** `npm create astro@latest . -- --template minimal --install --no-git --typescript strict --yes` did NOT scaffold directly into `.` (repo root already contained `.git`, `CLAUDE.md`, `.planning/`) - the CLI silently created a sibling directory named `former-flare` instead of erroring. Treated this the same as the plan's documented temp-directory fallback: moved `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/`, `public/` up into the repo root, deleted the scaffold-generated `CLAUDE.md`/`AGENTS.md`/`README.md` (kept the project's real root `CLAUDE.md`), and removed the temp dir. Dependency install inside the scaffold temp dir hit a CLI-reported timeout, so `node_modules` was deleted and dependencies were reinstalled fresh with a plain `npm install` after the move - this succeeded cleanly.

## Accomplishments
- Astro 7 project scaffolded with all 7 pipeline dependencies installed, zero forbidden packages (`@astrojs/mdx`, `@astrojs/cloudflare`)
- Content Collection (`src/content.config.ts`) with build-time Zod validation - verified live by temporarily setting `title:` to a bare number and confirming `astro build` fails with a Zod error naming `title`, then reverting
- Draft/publish pipeline proven: `shors-algorithm-in-plain-english.md` (`draft: true`) is absent from the homepage list AND produces no file in `dist/posts/` at all
- Homepage, About page, and post route all render through the shared `Layout.astro`, all three carry working Home/About nav links
- `tests/site-structure.test.mjs` (8 assertions, node:test only) goes red after Task 1 (no pages built yet) and green after Task 3, proving the full pipeline against real built HTML rather than component output

## Task Commits

1. **Task 1: Scaffold Astro 7 and write the failing end-to-end build-output test** - `eaa150f` (feat)
2. **Task 2: Content collection, seed posts, and a readable post page** - `699fb6a` (feat)
3. **Task 3: Homepage post list and About page** - `a225d7d` (feat)

## Files Created/Modified
- `package.json` - Astro 7 + 6 content-pipeline deps, custom `test` script
- `astro.config.mjs` - untouched `defineConfig({})`, no markdown key (plan 01-02's job)
- `.gitignore` - excludes `node_modules/`, `dist/`, `.astro/`, `.DS_Store`
- `tests/site-structure.test.mjs` - 8 node:test assertions over `dist/` HTML, exports `PUBLISHED_EXCERPT`
- `src/content.config.ts` - `posts` collection, `glob()` loader, 6-field Zod schema
- `src/content/posts/why-quantum-computers-threaten-bitcoin.md` - published seed post (2 distinct h2s, inline + block LaTeX, one python fence)
- `src/content/posts/shors-algorithm-in-plain-english.md` - draft seed post
- `src/layouts/Layout.astro` - shared shell, Home/About nav, `<slot />`
- `src/pages/index.astro` - reverse-chronological post list, empty-state copy, scoped list styles
- `src/pages/about.astro` - placeholder About copy (D-08), HTML comment flagging it as placeholder
- `src/pages/posts/[slug].astro` - dynamic route keyed on `post.data.slug`, filters drafts out of `getStaticPaths()`
- `src/styles/global.css` - Phase 1 UI-SPEC tokens only (spacing scale, typography, color), no dark mode, no custom font

## Decisions Made
- Drafts fully unbuilt rather than merely unlisted (RESEARCH Open Question 1) - simpler, more defensible "hidden" behavior; downstream plans should treat a draft's `/posts/{slug}/` URL as genuinely 404 until the flag flips.
- Kept Node v24.14.0 rather than downgrading toward the PROJECT.md-era "^20/^22 LTS" guidance, per explicit plan instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `npm create astro` scaffolded into a sibling temp dir instead of `.`**
- **Found during:** Task 1
- **Issue:** The CLI didn't refuse and didn't scaffold in place; it silently created `former-flare/` next to the repo root and scaffolded there.
- **Fix:** Moved `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/`, `public/` into the repo root; discarded the scaffold's own `CLAUDE.md`/`AGENTS.md`/`README.md` (kept the project's real root `CLAUDE.md`); deleted the temp dir.
- **Files modified:** all scaffold output files (see Files Created/Modified)
- **Verification:** `git status --short` after the move showed only the intended files as untracked; `npx astro build` succeeded from the repo root.
- **Committed in:** `eaa150f`

**2. [Rule 3 - Blocking] Dependency install inside the scaffold temp dir timed out**
- **Found during:** Task 1
- **Issue:** The scaffold CLI's own npm install hit an internal timeout and left a partial `node_modules/`.
- **Fix:** Deleted the partial `node_modules/` before moving files, then ran a plain `npm install` (base Astro) followed by `npm install @astrojs/markdown-remark remark-math rehype-katex katex rehype-slug rehype-autolink-headings` from the repo root - both completed cleanly with 0 vulnerabilities.
- **Files modified:** `package-lock.json`
- **Verification:** `npm ls` implicitly confirmed via successful `npx astro build`.
- **Committed in:** `eaa150f`

**3. [Rule 1 - Bug] `node --test tests/` (the plan's literal test script) fails on this machine**
- **Found during:** Task 1
- **Issue:** Confirmed via bare `node --test tests/` (independent of npm, independent of shell - reproduced identically in git-bash and with `MSYS_NO_PATHCONV=1`) that Node 24.14.0 on this Windows machine throws `MODULE_NOT_FOUND` for a bare directory positional argument to `--test`, as if it were running `node tests/` directly rather than recursing into the directory for test files. A single explicit file path (`node --test tests/site-structure.test.mjs`) and an explicit glob (`node --test "tests/**/*.test.mjs"`) both work correctly.
- **Fix:** Changed `package.json`'s `test` script to `npm run build && node --test tests/**/*.test.mjs`. This deviates from the plan's literal acceptance-criteria string (`node --test tests/`) but preserves the same intent - node's built-in test runner, zero test-framework dependency, discovering everything in `tests/`.
- **Files modified:** `package.json`
- **Verification:** `npm test` now correctly exits 1 after Task 1 (red, no pages built) and exits 0 with 8/8 passing after Task 3 (green).
- **Committed in:** `eaa150f` (script), confirmed green in `a225d7d`

**4. [Rule 1 - Bug] PUBLISHED_EXCERPT apostrophes broke the byte-for-byte match**
- **Found during:** Task 3
- **Issue:** The original excerpt used apostrophes ("Shor's", "Bitcoin's"). Astro's `.astro` template text interpolation (`{post.data.excerpt}`) HTML-escapes apostrophes to `&#39;` in the emitted HTML, so the test's plain-string `.includes()` check against the raw frontmatter string failed even though the content was semantically identical.
- **Fix:** Reworded the excerpt in both `tests/site-structure.test.mjs` (`PUBLISHED_EXCERPT`) and the post's frontmatter to avoid apostrophes entirely, sidestepping the entity-encoding mismatch rather than teaching the test to decode HTML entities.
- **Files modified:** `tests/site-structure.test.mjs`, `src/content/posts/why-quantum-computers-threaten-bitcoin.md`
- **Verification:** `npm test` - assertion 3 (excerpt match) now passes.
- **Committed in:** `a225d7d`

---

**Total deviations:** 4 auto-fixed (2 Rule 1 scaffold-environment bugs, 1 Rule 3 blocking dependency-install issue, 1 Rule 1 content/encoding bug)
**Impact on plan:** All four were necessary to get a working, verifiably-green build on this machine. No scope creep - no new files, features, or architecture beyond what the plan specified. The test-script deviation (#3) is the one a future re-run on a different OS/Node version should double check; if `node --test tests/` starts working there, either form is fine functionally.

## Issues Encountered
See Deviations above - all four issues were resolved inline during execution, no open issues remain.

## User Setup Required

None - no external service configuration required. Everything in this plan runs locally via `npm test` / `npm run build`.

## Next Phase Readiness

- Content Collection schema, Layout, and page structure are stable contracts plan 01-02 (Markdown rendering pipeline: LaTeX, heading anchors, syntax highlighting) builds directly on top of - no changes needed to `content.config.ts`, `[slug].astro`, or `index.astro` for that plan to proceed.
- `astro.config.mjs` is still `defineConfig({})` by design - plan 01-02 is the one that wires in the `unified()` processor per RESEARCH Pattern 1.
- The published seed post already contains inline math, block math, and a python code fence specifically so plan 01-02 has real content to render against immediately.
- No blockers. One thing worth flagging to the user: the `test` script differs from what any future planner reading `01-01-PLAN.md` literally would expect (`node --test tests/**/*.test.mjs` vs. the plan's `node --test tests/`) - documented above, functionally equivalent, but worth a quick sanity check if this repo is ever built on a non-Windows/Node-24 CI runner.

---
*Phase: 01-scaffolding-core-content-pipeline*
*Completed: 2026-09-03*

## Self-Check: PASSED

All 12 files created by this plan verified present on disk (package.json, astro.config.mjs, .gitignore, tests/site-structure.test.mjs, src/content.config.ts, src/content/posts/why-quantum-computers-threaten-bitcoin.md, src/content/posts/shors-algorithm-in-plain-english.md, src/layouts/Layout.astro, src/pages/index.astro, src/pages/about.astro, src/pages/posts/[slug].astro, src/styles/global.css). All 3 task commits (eaa150f, 699fb6a, a225d7d) verified present in git log.
