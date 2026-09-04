---
phase: 01-scaffolding-core-content-pipeline
verified: 2026-09-03T23:45:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 01: Scaffolding & Core Content Pipeline Verification Report

**Phase Goal:** Astro site with real Markdown+LaTeX posts, homepage, about page, and nav, working end-to-end
**Verified:** 2026-09-03T23:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A reader can open the homepage and see the published post's title and excerpt | VERIFIED | `src/pages/index.astro` queries `getCollection('posts', ...)`, sorts desc, renders title/date/tags/excerpt. `npm test` assertion 1/3 (site-structure) confirms `dist/index.html` contains title + `PUBLISHED_EXCERPT` string. |
| 2 | A reader can click the post title and land on `/posts/why-quantum-computers-threaten-bitcoin/` | VERIFIED | `href={`/posts/${post.data.slug}/`}` in index.astro; `dist/posts/why-quantum-computers-threaten-bitcoin/index.html` exists (confirmed on disk after `astro build`). Test assertion 2/6 confirm. |
| 3 | A reader can open `/about/` and read About-page copy | VERIFIED | `src/pages/about.astro` renders real prose (3 paragraphs) through Layout; `dist/about/index.html` exists and contains "About". Test assertion 7 confirms. |
| 4 | Home and About nav appear on homepage, About page, and post page | VERIFIED | `Layout.astro` renders `<nav>` with `href="/"` and `href="/about/"`, used by all three pages. Test assertion 8 confirms both hrefs present on all three built pages. |
| 5 | A `draft: true` post is absent from homepage and produces no page in dist/ | VERIFIED | `getStaticPaths` in `[slug].astro` and the `index.astro` query both filter `!data.draft`. Confirmed on disk: `dist/posts/shors-algorithm-in-plain-english` does not exist after build. Test assertions 4/5 confirm. |
| 6 | Invalid frontmatter fails the build loudly (Zod) | VERIFIED | `src/content.config.ts` schema (`z.coerce.date()`, `z.array(z.string())`, `slug: z.string()`, `draft: z.boolean().default(false)`, no `z.enum`) — SUMMARY documents a live test (setting `title:` to a number, observing Zod error, reverting). Schema code confirmed present as written. |
| 7 | Inline/block LaTeX renders as typeset KaTeX HTML, not raw `$`/`$$` | VERIFIED | `astro.config.mjs` wires `markdown.processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex, ...] })` — the Astro-7-Sätteri-safe pattern. Ran `npm run build` fresh: `dist/posts/.../index.html` contains `class="katex"`, `<annotation encoding="application/x-tex">`, `katex-display`, and zero surviving `$$` in the article body (markdown-pipeline tests 1-4 pass). |
| 8 | Heading anchors are clickable, hover-revealed, AND keyboard-focusable (CONT-03) | VERIFIED (post-fix) | Code review found `tabIndex: -1` + `ariaHidden: 'true'` on the rehype-autolink-headings anchor, which removes it from Tab order — contradicting the plan's own keyboard-access requirement. Commit `78a19bb` removed both properties. Verified independently: current `astro.config.mjs` line 28 reads `properties: { class: 'heading-anchor-link' }` (no tabIndex/ariaHidden). Rebuilt fresh and grepped `dist/posts/.../index.html`: the anchor renders as a plain `<a class="heading-anchor-link" href="#...">` with `tabindex="-1"` count = 0 (the only `aria-hidden` occurrences left in the file are KaTeX's own internal `katex-html` spans, unrelated). A plain `<a href>` is natively focusable in default Tab order, and `prose.css` line 31 (`.heading-anchor-link:focus-visible .heading-anchor { opacity: 1 }`) correctly targets it, so the CSS reveal-on-keyboard-focus rule can now actually fire. |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/content.config.ts` | posts collection: glob() loader + 6-field Zod schema | VERIFIED | Matches interface contract exactly; `z.coerce.date()`, array tags, no enum, explicit slug, default-false draft. |
| `src/content/posts/why-quantum-computers-threaten-bitcoin.md` | published seed post w/ LaTeX + code fence | VERIFIED | Confirmed via built HTML: 2 distinct h2 ids, katex-display present, python Shiki block present. |
| `src/content/posts/shors-algorithm-in-plain-english.md` | draft seed post, `draft: true` | VERIFIED | Confirmed absent from dist/ after build (assertion 5). |
| `src/layouts/Layout.astro` | shared shell, Home/About nav, `<slot>` | VERIFIED | Imports global.css, katex CSS, prose.css; renders nav + `<main><slot /></main>`. |
| `src/pages/index.astro` | reverse-chron post list, drafts filtered | VERIFIED | `getCollection` + filter + sort; empty-state copy present verbatim. |
| `src/pages/about.astro` | static About page | VERIFIED | 3 paragraphs of generic on-brand copy, no institution/credential claims (D-08 honored), placeholder HTML comment present. |
| `src/pages/posts/[slug].astro` | dynamic route keyed on frontmatter slug | VERIFIED | `getStaticPaths` filters drafts, keys on `post.data.slug` (never `post.id`). |
| `astro.config.mjs` | `unified()` processor, ordered rehype chain | VERIFIED | `processor: unified(...)`, `rehypeSlug` before `rehypeAutolinkHeadings` (index-check passes), no legacy `markdown.remarkPlugins`/`rehypePlugins` keys. |
| `src/styles/prose.css` | anchor hover/focus reveal, math spacing, code surface | VERIFIED | Contains `.katex-display`, `.heading-anchor`, `pre`, `code` rules; `:hover` and `:focus-visible` both present; no `prefers-color-scheme`/`@font-face` leakage. |
| `tests/site-structure.test.mjs` + `tests/markdown-pipeline.test.mjs` | automated dist/ assertions | VERIFIED | Ran fresh: 16/16 passing (`npm test` exit 0). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `[slug].astro` | `post.data.slug` | `getStaticPaths` params | WIRED | Confirmed `slug: post.data.slug`, no `post.id` reference anywhere in file. |
| `index.astro` | `astro:content getCollection('posts')` | build-time query | WIRED | `getCollection('posts', ({ data }) => !data.draft)` present and consumed by render. |
| `index.astro` | `/posts/{slug}/` | anchor href | WIRED | `href={`/posts/${post.data.slug}/`}` confirmed in source and reflected in built HTML. |
| `Layout.astro` | `/about/` | nav link | WIRED | `<a href="/about/">About</a>` present, rendered on all 3 built pages. |
| `astro.config.mjs` | `@astrojs/markdown-remark unified()` | `markdown.processor` | WIRED | Confirmed `processor: unified({...})` and real KaTeX/Shiki output in rebuilt dist/, not just a green build exit code. |
| `astro.config.mjs` rehypePlugins | rehypeSlug before rehypeAutolinkHeadings | array order | WIRED | Source-order check passes; built h2 tags carry populated non-empty `id` attributes with anchors pointing at them. |
| `Layout.astro` | `katex/dist/katex.min.css` | build-time CSS import | WIRED | Import present; KaTeX markup renders correctly (no garbled overlapping glyphs implied by missing CSS — class-based styling confirmed present in dist). |

### Data-Flow Trace (Level 4)

Not applicable in the traditional sense (no client/server dynamic data) — this is a fully static build. The equivalent check is "does the build-time query produce real post data rather than empty arrays," which is covered above: `getCollection` reads real files from `src/content/posts/`, not a hardcoded stub, and the rendered `dist/` HTML contains the actual seed post content (title, excerpt, math, code) rather than placeholder text.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full build + test suite | `npm test` (fresh run) | 16/16 tests passing, `astro build` produced exactly 3 pages | PASS |
| Draft post excluded from dist/ | inspected `dist/posts/` after build | `shors-algorithm-in-plain-english` directory absent | PASS |
| Anchor keyboard-focusability fix landed | `grep -c 'tabindex="-1"'` on rebuilt post HTML | 0 occurrences on the heading-anchor-link elements | PASS |
| KaTeX math actually rendered (not just build exit 0) | grep for `class="katex"`, `<annotation encoding="application/x-tex">`, `katex-display` | All three present in fresh rebuild | PASS |
| Shiki syntax highlighting present | grep for `<span style="color:` inside `<pre>` | Present, light theme (`github-light`) confirmed via `astro-code github-light` class | PASS |
| Zero client-side rendering scripts | grep for `<script` referencing katex/mathjax/prism/highlight | 0 matches | PASS |

### Probe Execution

Not applicable — this phase is not a migration/tooling phase with dedicated `probe-*.sh` scripts. `npm test` (the phase's own automated verification harness) was run directly and serves the equivalent function; see Behavioral Spot-Checks above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| CONT-01 | 01-01 | Markdown + frontmatter (title, date, tags, excerpt) validated at build time | SATISFIED | Zod schema in content.config.ts, build-fail-on-invalid-title verified per SUMMARY narrative + code inspection of schema shape |
| CONT-02 | 01-02 | Inline/block LaTeX renders as typeset equations, build-time, no client JS | SATISFIED | Fresh rebuild confirms katex classes present, zero surviving `$$`, zero client-side katex/mathjax script tags |
| CONT-03 | 01-02 | Every heading gets a stable clickable anchor link, hover+keyboard revealed | SATISFIED (post-fix) | Original tabIndex:-1 bug found by code review and fixed in 78a19bb; independently reverified in this pass — anchor is a plain focusable `<a>`, CSS `:focus-visible` rule correctly wired |
| CONT-04 | 01-02 | Code blocks render with syntax highlighting | SATISFIED | Shiki inline per-token colour spans confirmed in rebuilt HTML, github-light theme, `--surface` background via prose.css `!important` override |
| PAGE-01 | 01-01 | Homepage lists non-draft posts reverse-chron with title/excerpt | SATISFIED | index.astro query+sort confirmed, dist/index.html contains title+excerpt |
| PAGE-02 | 01-01 | Post at clean URL from frontmatter slug, not filename | SATISFIED | `[slug].astro` keys on `post.data.slug`, never `post.id`; dist path matches slug |
| PAGE-03 | 01-01 | `/about/` renders user-facing content | SATISFIED | about.astro renders 3 paragraphs of real (placeholder-labeled) prose |
| PAGE-04 | 01-01 | Home/About nav on every page | SATISFIED | Layout.astro nav rendered on all 3 built pages, confirmed by test assertion 8 and manual grep |

No orphaned requirements: REQUIREMENTS.md maps exactly CONT-01..04 and PAGE-01..04 to Phase 1, and both plans' frontmatter `requirements:` fields collectively cover exactly this set with no gaps or extras.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `astro.config.mjs` (historical, now fixed) | 28 (pre-fix) | `tabIndex: -1` + `ariaHidden: 'true'` on interactive anchor | Was Critical, now resolved | Fixed in commit `78a19bb`; independently re-verified in this pass — no regression |
| `package.json` | 5-7 | `engines.node: ">=22.12.0"` contradicts project's documented "^20 or ^22 LTS" support | Warning (non-blocking) | Portability risk for CI/contributors on Node 20; does not affect current build correctness |
| `package.json` | 13 | `test` script relies on shell-level `**` glob expansion, not guaranteed portable across shells (cmd.exe won't expand it) | Warning (non-blocking) | Risk of silent "0 tests found" false-pass on a different platform/shell; current environment (git-bash on this machine) runs it correctly, confirmed by this verification's own fresh `npm test` run |
| `package.json` | 24-26 | `allowScripts` field is not a real npm config key, has no effect | Info | Dead/misleading field, no functional impact |
| `src/styles/prose.css` / `global.css` | 14-19 / 55-58 | Heading anchor glyph positioned via negative left-margin with no horizontal padding on `main`, so it can render off-screen on narrow viewports | Warning (non-blocking, flagged in 01-REVIEW.md as WR-03) | Mobile-specific visual defect; DSGN-04 (mobile readability) is explicitly Phase 2 scope per ROADMAP, so this does not block Phase 1's goal but should be tracked for Phase 2 |
| `src/content/posts/why-quantum-computers-threaten-bitcoin.md` | frontmatter excerpt | Excerpt says "factor the huge numbers" (RSA-style) while the post body and the actual math correctly describe an elliptic-curve discrete-log attack | Info | Content-accuracy nit on throwaway seed content, not user-facing production copy yet; flagged in 01-REVIEW.md IN-03 |

No unreferenced TBD/FIXME/XXX markers found in any file touched by this phase (`grep` across `src/`, `tests/`, `astro.config.mjs` returned zero matches).

### Human Verification Required

None outstanding. The phase's own PLAN already routed the visually-judged items (math legibility, anchor hover/focus behavior, code block colours, mobile horizontal-scroll behavior, no-flash-of-unrendered-math) through a blocking human checkpoint (01-02 Task 3), which SUMMARY records as approved. The one defect that checkpoint's approval glossed over (CR-01, keyboard focus) was independently caught by code review and is now fixed and re-verified above by direct inspection of the built HTML and CSS — not by re-trusting the prior human sign-off.

### Gaps Summary

No gaps. All 8 observable truths verified against a freshly rebuilt `dist/` and a freshly run `npm test` (16/16 passing), not against SUMMARY.md claims alone. The one Critical issue raised by code review (heading-anchor keyboard-focus regression from `tabIndex: -1`) is confirmed fixed in commit `78a19bb` and independently reverified here by inspecting the current `astro.config.mjs` source and the resulting built HTML/CSS wiring. The remaining lower-severity review findings (Node engines mismatch, shell-glob test script portability, dead `allowScripts` field, mobile anchor positioning, seed-content wording nit) are legitimate but non-blocking — none of them prevent the Phase 1 goal ("Astro site with real Markdown+LaTeX posts, homepage, about page, and nav, working end-to-end") from being true today, on this environment, as proven by the passing build and test suite.

---

_Verified: 2026-09-03T23:45:00Z_
_Verifier: Claude (gsd-verifier)_
