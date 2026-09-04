---
phase: 02-visual-design-theming
plan: 02
subsystem: theming
tags: [dark-mode, shiki, katex, syntax-highlighting, math-rendering]
dependency-graph:
  requires: [data-theme attribute contract from 02-01]
  provides: [dual-theme Shiki token colors, theme-anchored KaTeX color, KaTeX-upgrade tripwire test]
  affects: [astro.config.mjs, src/styles/prose.css, tests/theming.test.mjs, tests/markdown-pipeline.test.mjs]
tech-stack:
  added: []
  patterns:
    - "Shiki dual-theme (themes.light/dark + defaultColor: false) emits --shiki-light-*/--shiki-dark-* custom properties per token instead of a baked-in inline color, letting prose.css select a palette purely from the data-theme attribute with no client-side re-highlighting"
    - "KaTeX structural elements (fraction bars, overlines, radicals) all derive from currentColor internally, so a single .katex { color: var(--text) } anchors the entire math rendering to the theme"
    - "Regression tripwire tests read node_modules/<pkg>/dist/*.css directly to pin an upstream CSS assumption, failing npm test loudly if a dependency upgrade breaks it instead of shipping a silent visual bug"
key-files:
  created: []
  modified:
    - astro.config.mjs
    - src/styles/prose.css
    - tests/theming.test.mjs
    - tests/markdown-pipeline.test.mjs
decisions:
  - "Code block background stays --surface in both themes (not Shiki's own #24292e dark bg) so it visually matches the inline `code` chip background, which also uses --surface"
  - "Did NOT implement RESEARCH.md Pattern 3's per-selector KaTeX border-color override list - verified against the installed katex@0.18.5 stylesheet that .katex * { border-color: currentColor } and .katex svg { fill: currentColor } already cover every structural element, making the override list dead CSS"
metrics:
  duration: "~20 min"
  completed: 2026-09-04
---

# Phase 2 Plan 2: Dark-Mode Math & Code Legibility Summary

Dual-theme Shiki config plus a single theme-anchored KaTeX color declaration make syntax-highlighted code and typeset math legible in both light and dark mode, backed by a tripwire test that fails the build if a future KaTeX upgrade breaks the `currentColor` assumption this relies on.

## What Was Built

- `astro.config.mjs` — `shikiConfig` switched from a single `theme: 'github-light'` to `themes: { light: 'github-light', dark: 'github-dark' }` with `defaultColor: false`. This makes Shiki emit per-token `--shiki-light-*`/`--shiki-dark-*` CSS custom properties instead of baking a single inline `color` into each token `<span>`. No other part of the file changed — imports, the `processor: unified({...})` block, and plugin ordering are byte-identical to before.
- `src/styles/prose.css` — two new rules select `var(--shiki-light)` by default on `.astro-code` and `var(--shiki-dark)` (plus font-style/weight/decoration) under `[data-theme="dark"] .astro-code`. The code block background deliberately stays `var(--surface)` in both themes rather than adopting Shiki's own dark theme background, matching the inline `code` chip. The existing `.katex { font-size: 1em; }` rule gained `color: var(--text);` — theme-agnostic, since the custom property already swaps with the palette — anchoring every KaTeX structural element (fraction bars, overlines, underlines, hlines, square-root SVGs) to the theme via KaTeX's own internal `currentColor` derivation. The stale top-of-file comment claiming dark mode was out of scope was rewritten to reflect Phase 2 reality.
- `tests/theming.test.mjs` — tests 10-16 added: 10-13 assert the built HTML/CSS reflect the dual-theme variable handoff (no baked-in single-theme class, no inline `style="color:#"`, both `--shiki-light`/`--shiki-dark` selected in built CSS); 14 pins `.katex { color: var(--text) }`; 15 is the KaTeX-upgrade tripwire, reading `node_modules/katex/dist/katex.css` directly to assert both `border-color: currentColor` under `.katex *` and `fill: currentColor` under `.katex svg` are still present, with a failure message naming the exact per-selector overrides a future implementer would need to add if either disappears; 16 asserts the stale out-of-scope comment is gone.
- `tests/markdown-pipeline.test.mjs` — updated Phase 1's pre-existing test 7, which asserted the now-intentionally-removed inline `style="color:#..."` token styling, to instead assert the new `--shiki-light` custom property is present (see Deviations).

## How It Works

1. **Build time:** Shiki, configured with `themes: { light, dark }` and `defaultColor: false`, emits both palettes' colors as CSS custom properties on every token `<span>` — no inline `color`, so there's nothing for external CSS to fight with `!important`.
2. **CSS selects the active palette:** `.astro-code` (Astro's rename of Shiki's default `.shiki` class) reads `var(--shiki-light)` by default; `[data-theme="dark"] .astro-code` overrides to `var(--shiki-dark)` plus its font-style/weight/decoration variables. Both stay on the site's own `--surface` background rather than Shiki's per-theme background variables.
3. **Math:** KaTeX 0.18.5's own stylesheet already derives every structural element's color from `currentColor` (`.katex * { border-color: currentColor }`, `.katex svg { fill: currentColor }`), so the single `.katex { color: var(--text) }` declaration is sufficient — no per-selector overrides needed. This was verified by reading `node_modules/katex/dist/katex.css` directly (lines 150-154, 1065-1070) before writing the tripwire test, per the plan's `<read_first>` instruction.
4. **Regression safety:** Test 15 reads the installed KaTeX package's compiled CSS at test time (not a hardcoded assumption), so a future `npm update katex` that changes this internal behavior fails `npm test` with an actionable message rather than silently shipping invisible fraction bars.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing Phase 1 test asserted the now-intentionally-removed inline token color**

- **Found during:** Task 1, first `npm test` run after the `astro.config.mjs`/`prose.css` changes
- **Issue:** `tests/markdown-pipeline.test.mjs` test 7 ("Shiki build-time inline-style syntax highlighting present") asserted `<span style="color:...">` inside a `<pre>` block. This is exactly the behavior Task 1 intentionally removes (`defaultColor: false` stops Shiki from inlining a single `color`) — the plan's own `<interfaces>` block calls this out explicitly. The test was correct for Phase 1's single-theme config and became wrong the moment dual-theme mode landed.
- **Fix:** Reworded the test to assert the new emission format instead — a `<span style="...--shiki-light:...">` inside a `<pre>` block — preserving the test's original intent (confirm build-time highlighting is present, not client-side) under the new CSS-variable-based mechanism.
- **Files modified:** `tests/markdown-pipeline.test.mjs`
- **Commit:** `3a1f081` (folded into Task 1's commit — caught before commit, not a separate fix commit)

**2. [Rule 1 - Bug] Explanatory comment accidentally matched an acceptance-criteria grep**

- **Found during:** Task 1, acceptance-criteria verification
- **Issue:** My first draft of the `pre` rule's rewritten comment explained the `--surface`-vs-Shiki-dark-background rationale by literally writing `--shiki-dark-bg's #24292e`, which tripped the acceptance criterion `grep -c 'shiki-dark-bg\|shiki-light-bg' src/styles/prose.css` returning 1 instead of the required 0 (that grep exists to confirm no background-color override was added to the stylesheet, but it can't distinguish a real declaration from a comment mentioning the variable name).
- **Fix:** Reworded the comment to say "Shiki's own dark theme background, #24292e" instead of using the literal `--shiki-dark-bg` token.
- **Files modified:** `src/styles/prose.css`
- **Commit:** `3a1f081` (caught before commit)

No other deviations. Plan executed as written otherwise, including the explicit decision to NOT implement RESEARCH.md Pattern 3's per-selector KaTeX border-color override list (verified as dead CSS against the installed KaTeX version).

## Known Stubs

None. All CSS is wired end-to-end against the build output; nothing here is a placeholder pending a future plan. Visual (human-eye) confirmation of dark-mode math/code legibility is explicitly deferred to plan 03's checkpoint per this plan's own `<verification>` section, which is expected and not a stub — it's a fixture-post visual check that hasn't been built yet.

## Threat Flags

None beyond what the plan's own `<threat_model>` already covers (T-02-05 accepted, T-02-06 mitigated by test 15, T-02-SC mitigated by the empty `package.json`/`package-lock.json` diff). No new surface introduced beyond the plan's stated scope — this plan adds zero new dependencies and zero new client-side JS.

## Verification

- `npm test` — 32/32 tests pass (8 Phase 1 markdown-pipeline + 8 Phase 1 structure + 16 theming, up from 25 at the end of plan 01).
- `grep -c 'shiki-dark' dist/posts/why-quantum-computers-threaten-bitcoin/index.html` — 6, confirming per-token dark-theme variables reached the build output.
- `grep -c 'github-light"' dist/posts/why-quantum-computers-threaten-bitcoin/index.html` — 0, confirming the single-theme class marker is gone.
- `git diff --stat package.json package-lock.json` — empty, no dependency added.
- `grep -c "theme: 'github-light'" astro.config.mjs` — 0; `grep -c 'defaultColor' astro.config.mjs` — 2 (comment + declaration).
- `grep -c 'frac-line' src/styles/prose.css` — 0 (Pattern 3's selector list deliberately not added); `grep -c 'frac-line' tests/theming.test.mjs` — 1 (appears only in the tripwire's failure message).
- Manual dark-mode visual confirmation of math/code legibility intentionally NOT performed here per the plan — plan 03 owns the fixture-post checkpoint that provides a live visual check.

## Self-Check: PASSED

- FOUND: astro.config.mjs (modified)
- FOUND: src/styles/prose.css (modified)
- FOUND: tests/theming.test.mjs (modified)
- FOUND: tests/markdown-pipeline.test.mjs (modified)
- FOUND commit 3a1f081 (Task 1: dual-theme Shiki + token color mapping)
- FOUND commit c5daf5c (Task 2: KaTeX color anchoring + upgrade tripwire)
