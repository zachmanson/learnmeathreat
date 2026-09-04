---
phase: 02-visual-design-theming
plan: 01
subsystem: theming
tags: [dark-mode, theme-toggle, localStorage, accessibility]
dependency-graph:
  requires: []
  provides: [data-theme attribute contract, ThemeToggle component, dark CSS token overrides]
  affects: [src/layouts/Layout.astro, src/styles/global.css]
tech-stack:
  added: []
  patterns:
    - "data-theme attribute (not .dark class) on <html>, driven by an is:inline pre-paint script in <head>"
    - "localStorage value allowlisted against exactly 'light'/'dark' before trust (tampering defense)"
    - "dark palette is a pure CSS custom-property value swap on the same 5 role names from :root, no new token names"
key-files:
  created:
    - tests/theming.test.mjs
    - src/components/ThemeToggle.astro
  modified:
    - src/styles/global.css
    - src/layouts/Layout.astro
decisions:
  - "Theme toggle placed inline in .site-header nav, no wrapper element, joining the existing flex-wrap group for mobile layout (no hamburger menu)"
  - "Toggle icon uses --muted/--text, not --accent, to avoid competing with the 10% accent color budget reserved for links"
metrics:
  duration: "~25 min"
  completed: 2026-09-04
---

# Phase 2 Plan 1: Dark Mode Vertical Slice Summary

Icon-only sun/moon theme toggle in the nav with `localStorage`-persisted choice, OS-preference fallback on first visit, and a flash-free `data-theme` attribute set by a pre-paint inline script — built and verified test-first against the site's built `dist/` output.

## What Was Built

- `tests/theming.test.mjs` — 9 Node-built-ins-only tests asserting the theming contract against `dist/` HTML+CSS: theme-init script presence/inlining/location, allowlist validation, toggle button markup (icon-sun/icon-moon, initial aria-label), and the dark CSS token block + 44px tap target in built stylesheets.
- `src/styles/global.css` — `[data-theme="dark"]` block swapping the same 5 custom-property role names Phase 1 already defined (`--bg`, `--surface`, `--accent`, `--text`, `--muted`); `#theme-toggle` button styling with a 44×44px minimum tap target (the spacing scale's one sanctioned mobile-accessibility exception); icon-sun/icon-moon visibility rules keyed off `[data-theme="dark"]`.
- `src/components/ThemeToggle.astro` — icon-only button (inline sun/moon SVGs, `aria-hidden="true"` on both), an `is:inline` click handler that flips `data-theme`, persists the choice to `localStorage` (write wrapped in `try`/`catch` so a private-browsing quota error can't break the toggle), and updates a state-reflecting `aria-label` ("Switch to dark theme" / "Switch to light theme").
- `src/layouts/Layout.astro` — an `is:inline` pre-paint script as the first child of `<head>`, reading `localStorage['theme']`, allowlisting it against exactly `'light'`/`'dark'`, falling back to `prefers-color-scheme` otherwise, and setting `<html data-theme="...">` before any CSS paints; `<ThemeToggle />` added to `.site-header nav` after the About link.

## How It Works

1. **Before paint:** Layout's inline head script reads the stored theme (defensively — a devtools-tampered value like `"purple"` is rejected), or derives it from the OS's `prefers-color-scheme`, and sets `data-theme` on `<html>`.
2. **CSS paints immediately correct:** `global.css`'s `[data-theme="dark"]` block overrides the 5 color custom properties; existing consumers (`body`, `a`, `.site-header nav`, etc.) pick up the new values automatically — no consumer-side changes needed.
3. **User toggles:** `ThemeToggle.astro`'s click handler flips the attribute, writes the explicit choice to `localStorage` (persisting across reloads and future visits, overriding OS preference from then on), and updates its own `aria-label`.

Both scripts use `is:inline` — without it Astro would module-wrap/defer them, which for the head script would reintroduce the exact flash-of-wrong-theme this plan exists to prevent, and for the toggle would mean the click handler never binds.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `is:inline` explanatory comments broke the plan's own acceptance-criteria grep check**

- **Found during:** Task 3, final acceptance-criteria verification
- **Issue:** My first draft of the explanatory comments (required by the plan's `<action>` text) literally repeated the string `is:inline` inside the comment body. `grep -c 'is:inline' <file>` counts matching *lines*, so this produced a count of 2 instead of the acceptance criterion's required 1 in both `Layout.astro` and `ThemeToggle.astro`.
- **Fix:** Reworded both comments to explain the requirement ("this directive must stay on the tag above...") without repeating the literal `is:inline` token.
- **Files modified:** `src/layouts/Layout.astro`, `src/components/ThemeToggle.astro`
- **Commit:** `bdd1577` (folded into Task 3's commit — caught before commit, not a separate fix commit)

No other deviations. Plan executed as written otherwise.

## Known Stubs

None. All wired end-to-end: clicking the toggle in a real browser changes `data-theme`, which is consumed by CSS already in the build; nothing here is a placeholder pending a future plan.

## Threat Flags

None beyond what the plan's own `<threat_model>` already covers (T-02-01 tampering, T-02-02 DoS/quota, T-02-03 accepted inline-script CSP note, T-02-04 accepted low-sensitivity storage). No new surface introduced beyond the plan's stated scope.

## Verification

- `npm test` — 25/25 tests pass (8 Phase 1 structure + 8 Phase 1 math/code + 9 new theming). The plan's `<verification>` step 1 cites "17 tests" (8 structure + 9 theming) but omits the pre-existing 8-test math/KaTeX suite (`tests/*.test.mjs` glob picks up all three files) — actual total is 25, all green.
- `grep -c 'is:inline' src/layouts/Layout.astro src/components/ThemeToggle.astro` — both return 1.
- `git diff --stat package.json package-lock.json` — empty; no dependency added.
- `grep -c 'IBM Plex Mono' src/styles/global.css` — returns 0 (correctly out of scope, plan 03's concern).
- Manual dark-mode legibility of math/code blocks intentionally NOT verified here per the plan — plan 02 owns Shiki/KaTeX dark-mode CSS and is expected to look wrong in dark mode until it lands.

## Self-Check: PASSED

- FOUND: tests/theming.test.mjs
- FOUND: src/components/ThemeToggle.astro
- FOUND: src/styles/global.css (modified)
- FOUND: src/layouts/Layout.astro (modified)
- FOUND commit b15dc52 (test: RED)
- FOUND commit b46f507 (feat: CSS)
- FOUND commit bdd1577 (feat: component + layout wiring)
