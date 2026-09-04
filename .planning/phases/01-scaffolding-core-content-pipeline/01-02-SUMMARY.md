---
phase: 01-scaffolding-core-content-pipeline
plan: 02

subsystem: content-pipeline
tags: [astro, markdown, katex, shiki, rehype, unified]

requires: ["01-01"]
provides:
  - "markdown.processor: unified() wired in astro.config.mjs, opting Astro 7 back into the legacy remark/rehype pipeline (Satteri default does not run these plugins)"
  - "Build-time KaTeX math rendering (inline + block), zero client JS"
  - "Stable kebab-case heading ids with hover/focus-revealed clickable anchor links"
  - "Shiki build-time syntax highlighting pinned to a light theme matching the UI-SPEC"
  - "tests/markdown-pipeline.test.mjs - 8 node:test assertions over built HTML"
affects: []

tech-stack:
  added: []
  patterns:
    - "markdown.processor: unified({ remarkPlugins, rehypePlugins }) from @astrojs/markdown-remark - the only way to run remark-math/rehype-katex/rehype-slug/rehype-autolink-headings under Astro 7's Satteri default"
    - "rehypePlugins array order is load-bearing: rehypeKatex, then rehypeSlug, then rehypeAutolinkHeadings (rehypeSlug must run before autolink-headings so anchors find heading ids)"
    - "markdown.shikiConfig.theme pinned explicitly (github-light) rather than left at Astro's shiki default, to match the UI-SPEC's light-only surface"
    - "CSS overriding Shiki's per-block inline pre style uses !important (only acceptable use here - inline style otherwise always wins over an external stylesheet selector)"

key-files:
  created:
    - tests/markdown-pipeline.test.mjs
    - src/styles/prose.css
  modified:
    - astro.config.mjs
    - src/layouts/Layout.astro

key-decisions:
  - "Shiki theme pinned to github-light in astro.config.mjs (deviation, not in original plan interfaces block) - Astro's Shiki default is github-dark, which renders a dark background on <pre> and directly conflicts with the UI-SPEC's light-only surface and Task 2's own instruction that <pre> gets background: var(--surface)."
  - "prose.css overrides pre's background with !important - Shiki inlines background-color/color directly on the <pre> element (a per-block style, not per-token), and inline styles always beat external stylesheet selectors regardless of specificity tricks short of !important. Per-token <span style=\"color:...\"> colours are left untouched, honoring the plan's instruction not to override Shiki's token colours."
  - "RESEARCH Assumption A1 resolved: hastscript resolves as a transitive dependency (from rehype-autolink-headings) with no explicit npm install needed."
  - "RESEARCH Assumption A2 resolved: default output:'static' + trailingSlash config produced clean /posts/slug/ URLs with zero extra astro.config.mjs changes."

requirements-completed: [CONT-02, CONT-03, CONT-04]

duration: ~35min
completed: 2026-09-03
---

# Phase 1 Plan 2: Markdown Rendering Pipeline Summary

**Astro 7's unified() processor wired for build-time KaTeX math, hover/focus-revealed heading anchors, and Shiki syntax highlighting pinned to a light theme - all zero client-JS, verified by 8 new node:test assertions over real built HTML plus a human visual checkpoint.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3 completed (2 auto + 1 human checkpoint, approved)
- **Files modified:** 4 (2 created, 2 modified, across 2 commits)

## Final Working Processor Block

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { h } from 'hastscript';

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        rehypeSlug,
        [rehypeAutolinkHeadings, {
          behavior: 'prepend',
          content: h('span.heading-anchor', '#'),
          properties: { ariaHidden: 'true', tabIndex: -1, class: 'heading-anchor-link' },
        }],
      ],
    }),
  },
});
```

This matches the plan's interfaces block exactly, plus one addition (`shikiConfig.theme`) not in the original plan - see Deviations.

## Accomplishments
- `astro.config.mjs` opts into `@astrojs/markdown-remark`'s `unified()` processor - confirmed by building the seed post and inspecting real output, not just a successful `astro build` exit code (RESEARCH Pitfall 2's exact warning: a successful build proves nothing about whether math actually rendered)
- Inline math (`$P$`, `$d$`, `$Q$`, `$O(2^n)$`, `$O(n^3)$`) and block math (`$$Q = dP$$`) both render as real KaTeX HTML (`class="katex"`, `<annotation encoding="application/x-tex">`, `katex-display`), with zero surviving `$$` in the article body
- Both `<h2>` headings carry stable kebab-case ids (`what-bitcoins-public-keys-are-protecting`, `where-shors-algorithm-breaks-the-assumption`) with populated, non-empty anchor `href`s - `rehypeSlug` running before `rehypeAutolinkHeadings` in the same pipeline avoided RESEARCH Pitfall 1 entirely (verified zero `href="#"` empty anchors)
- Python code fence renders with real per-token Shiki colours on a light background, not flat monochrome
- Zero `<script>` tags reference katex/mathjax/prism/highlight anywhere in the built post page - confirming no client-side rendering flash is possible
- `tests/markdown-pipeline.test.mjs` (8 assertions) + existing `tests/site-structure.test.mjs` (8 assertions) = 16/16 passing
- Human checkpoint (Task 3): user visited the preview server and confirmed all 10 how-to-verify steps (post list, clean URL, inline/block math rendering, hover/focus anchor reveal with no text shift, syntax-highlighted code, mobile horizontal scroll without page overflow, About page, no JS requested / no rendering flash)

## Task Commits

1. **Task 1: Wire the unified() markdown processor and assert math, anchors, and highlighting in built HTML** - `0c8195e` (feat)
2. **Task 2: Style anchors, math, and code blocks to the UI-SPEC contract** - `d3dd46b` (feat)
3. **Task 3: Human verification checkpoint** - approved by user, no code changes required (no commit - verification only)

## Files Created/Modified
- `astro.config.mjs` - `markdown.processor: unified(...)` + `markdown.shikiConfig.theme: 'github-light'` (deviation, see below)
- `src/layouts/Layout.astro` - added `katex/dist/katex.min.css` and `prose.css` imports (after `global.css`)
- `tests/markdown-pipeline.test.mjs` - 8 node:test assertions over `dist/posts/why-quantum-computers-threaten-bitcoin/index.html`
- `src/styles/prose.css` - heading-anchor hover/focus reveal, `.katex-display` centering/scrolling, code block surface styling, all reusing `global.css`'s `--space-*`/colour custom properties, zero new hardcoded hex values

## Exact Shiki Wrapper Markup (Astro 7 + github-light)

```html
<pre class="astro-code github-light" style="background-color:#fff;color:#24292e; overflow-x: auto;" tabindex="0" data-language="python"><code><span class="line"><span style="color:#D73A49">def</span> <span style="color:#6F42C1">find_period</span>...</span></code></pre>
```

Key observations for future plans:
- `class="astro-code <theme-name>"` on `<pre>` - the theme name is baked into the class, so `astro-code github-light` after this plan (was `astro-code github-dark` before the fix)
- `style="background-color:...;color:...; overflow-x: auto;"` is set **inline on `<pre>` itself** - this is a per-block style Shiki emits directly, distinct from the per-token `<span style="color:...">` spans inside. Any CSS rule targeting `pre { background: ... }` must use `!important` to win against this inline style; there is no higher-specificity selector trick that beats an inline style.
- Per-token colours are individual `<span style="color:#HEX">` wrapping each highlighted fragment - these were left untouched per the plan's explicit instruction.

## Decisions Made
- Pinned Shiki to `github-light` rather than leaving Astro's `github-dark` default - resolves a direct conflict with the UI-SPEC's light-only surface requirement and Task 2's own instruction that code blocks use `var(--surface)`. See Deviations for full reasoning.
- `hastscript`'s `h()` resolved as a transitive dependency (via `rehype-autolink-headings`) - no explicit `npm install hastscript` was needed. Resolves RESEARCH Assumption A1 in favor of the low-risk outcome.
- Astro's default `output: 'static'` + trailing-slash link convention (`href={`/posts/${slug}/`}`, already established in 01-01) produced clean `/posts/slug/` URLs with zero additional `trailingSlash` config. Resolves RESEARCH Assumption A2 in favor of the low-risk outcome - no `trailingSlash: 'always'` needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Shiki's default theme (github-dark) conflicts with the Phase 1 light-only UI-SPEC**
- **Found during:** Task 1, immediately after the first successful build
- **Issue:** Astro's built-in Shiki highlighter defaults to the `github-dark` theme. The plan's Task 2 explicitly instructs styling the code block background with `var(--surface)` (a light grey, `#F4F4F5`), and the UI-SPEC locks a single light-only surface for the whole phase (DSGN-03 dark mode is Phase 2 scope). A dark-themed `<pre>` would visually clash with every other element on the page and directly contradict the design contract.
- **Fix:** Added `markdown.shikiConfig: { theme: 'github-light' }` to `astro.config.mjs`, alongside (not replacing) the `processor: unified(...)` key - these are independent Astro config keys and coexist without conflict, confirmed by a successful build with both present.
- **Files modified:** `astro.config.mjs`
- **Verification:** Rebuilt and grepped the post's `<pre>` tag - confirmed `class="astro-code github-light"` and `style="background-color:#fff;color:#24292e;..."` (previously `github-dark`/`#24292e` background). All 16 tests still pass.
- **Committed in:** `0c8195e`

**2. [Rule 1 - Bug] Shiki's inline `<pre>` background style would silently override any prose.css background rule**
- **Found during:** Task 2, while inspecting real rendered HTML before writing selectors (per the plan's own read_first instruction)
- **Issue:** Shiki emits `style="background-color:#fff;color:#24292e; overflow-x: auto;"` directly inline on the `<pre>` tag. Inline styles win over any external stylesheet rule regardless of selector specificity (short of `!important`), so a plain `pre { background: var(--surface); }` rule in `prose.css` would have been silently ignored at render time - the page would still show whatever `background-color` Shiki inlined.
- **Fix:** Used `!important` on `pre`'s `background` declaration in `prose.css`, explicitly scoped to only the block-level background property - the per-token `<span style="color:...">` colours inside are completely untouched, honoring the plan's explicit "do not override the per-token colours Shiki emits" instruction.
- **Files modified:** `src/styles/prose.css`
- **Verification:** Confirmed via browser rendering during the human checkpoint (Task 3) that the code block shows the `--surface` light grey background, and via `npm test` that no assertion regressed.
- **Committed in:** `d3dd46b`

**Impact on plan:** Both deviations were necessary corrections to make the plan's own stated intent (a light-themed, UI-SPEC-compliant code block) actually work - Shiki's defaults would have produced a dark block that directly contradicted the plan's Task 2 instructions and the UI-SPEC. No scope creep - no new files, no features beyond what CONT-04/the UI-SPEC already required.

## User Feedback (documented, no action taken)

During the human verification checkpoint, the user confirmed all 10 verification steps pass, and separately noted the overall site currently reads as more "professional/polished" than the "home-cooked charm" aesthetic they're aiming for. This is explicitly Phase 2 scope (DSGN-02 distinct accent header font, DSGN-03 theming) per both the roadmap and this phase's own UI-SPEC ("System fonts, light background only, no dark mode toggle... visual polish, the accent header font, and theming are Phase 2"). No styling changes were made in response - flagging here so Phase 2 planning has this feedback on record.

## Issues Encountered
None beyond the two auto-fixed deviations above, both resolved inline during execution.

## User Setup Required
None - everything in this plan runs locally via `npm test` / `npm run build` / `npx astro preview`.

## Next Phase Readiness
- The full Phase 1 content pipeline (scaffolding + markdown rendering) is complete and verified: 16/16 automated assertions plus a passed human visual checkpoint.
- `astro.config.mjs`'s `unified()` processor and `shikiConfig` are now the stable contract - Phase 2 (theming/fonts/dark mode) should extend `prose.css`/`global.css` and can add a `@font-face` + `prefers-color-scheme` block without touching the markdown processor itself.
- The `!important` override on `pre`'s background is worth a comment-level reminder for whoever builds Phase 2 dark mode: a `.dark pre` rule will also need `!important` (or a `:where()`/higher-specificity approach) to beat Shiki's inline style, or Shiki's theme itself will need to switch per light/dark mode via `shikiConfig`'s dual-theme option (`themes: { light: ..., dark: ... }`) - flagging now so Phase 2 doesn't rediscover this from scratch.
- No blockers.

---
*Phase: 01-scaffolding-core-content-pipeline*
*Completed: 2026-09-03*

## Self-Check: PASSED

All 4 files referenced in this plan verified present on disk (tests/markdown-pipeline.test.mjs, src/styles/prose.css, astro.config.mjs, src/layouts/Layout.astro). Both task commits (0c8195e, d3dd46b) verified present in git log.
