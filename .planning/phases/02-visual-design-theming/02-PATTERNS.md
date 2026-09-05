# Phase 2: Visual Design & Theming - Pattern Map

**Mapped:** 2026-09-04
**Files analyzed:** 6 (3 modified, 1 new component, 2 new test files considered)
**Analogs found:** 6 / 6 (all analogs are Phase 1's own files — this phase extends them in place, no cross-project borrowing needed)

## Context Note

This is a small, single-author Astro site with no component library and no prior theming/JS. There are no "role-equivalent" files elsewhere in the codebase to borrow from (e.g., no existing toggle component, no existing dark-mode CSS). Every analog below is the **same file this phase modifies** (Phase 1's own output) — the pattern to copy is "how Phase 1 already structures this file," which the new code must extend without breaking. Where a *net-new* file is introduced (`ThemeToggle.astro`), the closest analog is the layout/nav markup it's extracted from (`Layout.astro`), since it's the only `.astro` component-with-inline-script precedent in the repo.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `astro.config.mjs` | config | transform (build-time) | `astro.config.mjs` (self, Phase 1) | exact — same file, extend `shikiConfig` |
| `src/styles/global.css` | config/utility (design tokens) | transform (build-time CSS) | `src/styles/global.css` (self, Phase 1) | exact — same file, add `[data-theme="dark"]` block + font-family |
| `src/styles/prose.css` | config/utility | transform (build-time CSS) | `src/styles/prose.css` (self, Phase 1) | exact — same file, add dark KaTeX/Shiki overrides |
| `src/layouts/Layout.astro` | component (site-wide layout) | request-response (page render) + event-driven (theme-init script) | `src/layouts/Layout.astro` (self, Phase 1) | exact — same file, add `<script is:inline>` + toggle slot |
| `src/components/ThemeToggle.astro` | component | event-driven (client click handler) | `src/layouts/Layout.astro` (nav markup, lines 20-26) | role-match — repo's only precedent for `.astro` markup + scoped behavior; no prior component-with-script exists |
| `package.json` | config | batch (dependency install) | `package.json` (self, Phase 1) | exact — same file, add `@fontsource/ibm-plex-mono` dependency |
| `tests/theme-toggle.test.mjs` (new, if planner adds one) | test | batch (dist/ HTML assertions) | `tests/site-structure.test.mjs` | exact — same test style: read built `dist/**/*.html`, assert on string/regex presence, Node built-ins only |

## Pattern Assignments

### `astro.config.mjs` (config, build-time transform)

**Analog:** `astro.config.mjs` itself (Phase 1, current state)

**Full current file** (this is the file being modified, not a separate analog):
```javascript
// @ts-check
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
          properties: { class: 'heading-anchor-link' },
        }],
      ],
    }),
  },
});
```

**Change required (per RESEARCH.md Pattern 2):** Replace `shikiConfig: { theme: 'github-light' }` with:
```javascript
shikiConfig: {
  themes: {
    light: 'github-light',
    dark: 'github-dark',
  },
  defaultColor: false,
},
```
Everything else in the file (imports, `processor`, `rehypePlugins` order — note the existing comment about `rehypeSlug` needing to run before `rehypeAutolinkHeadings`) stays untouched. Keep the file's existing comment style (inline `//` explaining *why*, as seen on the current `theme: 'github-light'` line) — replace that comment with one explaining the dual-theme switch and reference DSGN-03.

---

### `src/styles/global.css` (config/utility, build-time CSS)

**Analog:** `src/styles/global.css` itself (Phase 1, current state — full file already read above, 86 lines)

**Token block pattern to extend** (lines 1-15):
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  --bg: #FFFFFF;
  --surface: #F4F4F5;
  --accent: #1D4ED8;
  --text: #18181B;
  --muted: #71717A;
}
```
**Add directly after this block** (same file, new sibling selector — do not touch `--space-*` values, only color roles get dark equivalents per CONTEXT.md):
```css
[data-theme="dark"] {
  --bg: #09090B;
  --surface: #18181B;
  --accent: #60A5FA;
  --text: #FAFAFA;
  --muted: #A1A1AA;
}
```

**Heading pattern to extend** (lines 37-48 — this is where the IBM Plex Mono font-family gets added, weight already correct):
```css
h1 {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
}

h2,
h3 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
}
```
Add `font-family: 'IBM Plex Mono', ui-monospace, "SFMono-Regular", Consolas, monospace;` to both rules — do NOT touch `.site-title` (lines 70-73) or `.site-header nav` (lines 75-85), per D-02/UI-SPEC guardrail against applying the mono font outside h1-h3.

**Import location:** Fontsource's weight-600-only CSS (`@fontsource/ibm-plex-mono/600.css`) should be imported in `Layout.astro`'s frontmatter alongside the existing `import '../styles/global.css';` line — matching that file's existing import-block convention (see Layout.astro pattern below), not hand-authored `@font-face` in `global.css`.

---

### `src/styles/prose.css` (config/utility, build-time CSS)

**Analog:** `src/styles/prose.css` itself (Phase 1, current state — full file already read above, 74 lines)

**Existing pre/code override pattern to extend** (lines 49-61 — shows the established convention of `!important` + explanatory comment for overriding Shiki's inline styles):
```css
pre {
  /* Shiki inlines its own background-color/color on the <pre> element
     itself (per-block, not per-token) - override with !important so the
     UI-SPEC's light --surface background wins over that inline style.
     Per-token <span style="color:..."> colours inside are left untouched. */
  background: var(--surface) !important;
  padding: var(--space-sm) var(--space-md);
  font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
}
```
**Add, following the same comment-then-rule convention**, per RESEARCH.md Pattern 2/3 (exact class confirmed as `.astro-code`, not `.shiki`, by inspecting this repo's own `dist/` output):
```css
[data-theme="dark"] .astro-code,
[data-theme="dark"] .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```

**Existing KaTeX block to extend** (lines 35-45):
```css
.katex-display {
  margin: var(--space-lg) 0;
  overflow-x: auto;
  text-align: center;
}

.katex {
  font-size: 1em;
}
```
Add dark override immediately after, per RESEARCH.md Pattern 3 (flagged LOW confidence on exact structural class names — planner must include a manual visual-verification step, per Assumptions Log A1):
```css
[data-theme="dark"] .katex {
  color: var(--text);
}
[data-theme="dark"] .katex .frac-line,
[data-theme="dark"] .katex .rule,
[data-theme="dark"] .katex .hline {
  border-color: var(--text) !important;
}
```
Also update the file's top-of-file comment (lines 1-5, "Explicitly out of scope this phase: dark mode, custom fonts...") — that comment is now stale and should be corrected/removed since dark mode is in scope this phase.

---

### `src/layouts/Layout.astro` (component, request-response + event-driven)

**Analog:** `src/layouts/Layout.astro` itself (Phase 1, current state — full file already read above, 32 lines)

**Existing import + head structure** (lines 1-18):
```astro
---
import '../styles/global.css';
import 'katex/dist/katex.min.css';
import '../styles/prose.css';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
```
**Changes required:**
1. Add `import '@fontsource/ibm-plex-mono/600.css';` to the frontmatter import block, following the existing import order (global styles first, then supporting libraries — matches current `katex/dist/katex.min.css` placement pattern).
2. Add the theme-init script as the FIRST thing in `<head>` (per RESEARCH.md Pattern 1 — must run before CSS paints, `is:inline` is mandatory or Astro will defer/module-wrap it):
```astro
<script is:inline>
  const stored = localStorage.getItem('theme');
  const theme = (stored === 'light' || stored === 'dark')
    ? stored
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
</script>
```
Note the explicit `stored === 'light' || stored === 'dark'` validation — this satisfies RESEARCH.md's Security Domain V5 requirement (don't trust `localStorage` blindly; fall back to `prefers-color-scheme` if tampered/invalid).

**Existing nav markup to extend** (lines 19-26):
```astro
  <body>
    <header class="site-header">
      <a class="site-title" href="/">Learn Me the Threat</a>
      <nav>
        <a href="/">Home</a>
        <a href="/about/">About</a>
      </nav>
    </header>
    <main>
      <slot />
    </main>
  </body>
</html>
```
Add `<ThemeToggle />` inside `<nav>`, after the About link — this reuses the existing `.site-header nav` flex-wrap container (`global.css` lines 75-85) as its layout parent, so no new wrapper markup/CSS is needed per the mobile-nav discretion decision (D-04 / UI-SPEC Interaction Contract).

---

### `src/components/ThemeToggle.astro` (component, event-driven — NEW FILE)

**Analog:** `src/layouts/Layout.astro` nav markup (closest precedent for `.astro` file structure in this repo; there is no prior component-with-script file to copy from — this is genuinely new territory for the codebase)

**Structural pattern to follow (from RESEARCH.md Code Examples, already adapted to this project's `data-theme` contract and UI-SPEC's state-reflecting aria-label requirement):**
```astro
---
// No props needed — button state is derived entirely client-side from
// document.documentElement's current data-theme attribute.
---
<button id="theme-toggle" aria-label="Switch to dark theme">
  <svg class="icon-sun" aria-hidden="true" ...><!-- sun path --></svg>
  <svg class="icon-moon" aria-hidden="true" ...><!-- moon path --></svg>
</button>

<script is:inline>
  const btn = document.getElementById('theme-toggle');
  function updateLabel() {
    const current = document.documentElement.getAttribute('data-theme');
    btn.setAttribute('aria-label', current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  updateLabel();
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateLabel();
  });
</script>
```
**Follow project conventions when integrating:**
- Match `Layout.astro`'s frontmatter style: TypeScript `interface Props` block only if props are actually needed (this component needs none, so an empty `---` frontmatter or omit `interface Props` entirely, consistent with minimal-file philosophy).
- CSS for the button (44×44px tap target per UI-SPEC Spacing Scale exception, `--text`/`--muted` coloring not `--accent` per UI-SPEC Color section) belongs in `global.css`'s existing `.site-header nav` region (lines 75-85), following that section's existing selector nesting convention (`.site-header nav a { color: var(--muted); }` → add `.site-header nav #theme-toggle { ... }` alongside it), not a new standalone stylesheet.
- Icon SVGs: inline static markup only, per UI-SPEC Registry Safety (no icon library dependency) — sourced from a single permissively-licensed set (e.g., Lucide sun/moon paths) and pasted directly into the component, consistent with the project's zero-extra-dependency posture.

---

### `package.json` (config, batch dependency install)

**Analog:** `package.json` itself (Phase 1, current state)

**Existing dependency block pattern** (lines 12-19):
```json
"dependencies": {
  "@astrojs/markdown-remark": "^7.3.0",
  "astro": "^7.3.1",
  "katex": "^0.18.5",
  "rehype-autolink-headings": "^7.1.0",
  "rehype-katex": "^7.0.1",
  "rehype-slug": "^6.0.0",
  "remark-math": "^6.0.0"
}
```
Add `"@fontsource/ibm-plex-mono": "^5.3.0"` maintaining alphabetical ordering already present in the block. Run `npm install @fontsource/ibm-plex-mono` rather than hand-editing the version pin, so `package-lock.json` stays in sync (matches how Phase 1's dependencies were presumably installed, not hand-typed).

---

### `tests/theme-toggle.test.mjs` (test, batch — new file, if planner scopes a Phase 2 test)

**Analog:** `tests/site-structure.test.mjs` (full file already read above, 90 lines)

**Structural pattern to copy exactly:**
```javascript
// Automated assertions over the built dist/ HTML output.
// Uses only Node built-ins (node:test, node:assert/strict, node:fs, node:path)
// so this test suite has no test-framework dependency of its own.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

function readDistFile(relPath) {
  const fullPath = path.join(distDir, relPath);
  try {
    return readFileSync(fullPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Missing built file: dist/${relPath} (expected at ${fullPath})`);
    }
    throw err;
  }
}

test('theme-init script is present and marked is:inline in every page head', () => {
  const html = readDistFile('index.html');
  assert.ok(html.includes("data-theme"), 'expected data-theme attribute logic in output');
});
```
Note: Because the theme toggle's runtime behavior (localStorage read/write, click handling) is client-side JS, `dist/` static-HTML assertions can only verify *presence* of the script/button/dark CSS block, not runtime behavior — this matches the existing suite's scope (it only asserts on static HTML/string presence, never spins up a browser). Follow `site-structure.test.mjs`'s exact style: one `test()` per assertion, descriptive numbered/plain-English test names, `assert.ok`/`assert.match`, no test framework beyond `node:test`.

---

## Shared Patterns

### CSS custom-property token reuse (do not introduce new token names)
**Source:** `src/styles/global.css` lines 1-15 (`:root` block)
**Apply to:** `global.css` dark override, `prose.css` dark overrides, `ThemeToggle.astro` styling
```css
/* Every dark-mode rule must reference one of these 5 existing role names —
   never introduce a 6th color role or a parallel variable naming scheme. */
--bg, --surface, --accent, --text, --muted
```

### `!important` + explanatory comment convention for overriding library-injected inline styles
**Source:** `src/styles/prose.css` lines 49-54 (existing `pre { background: var(--surface) !important; ... }` block, with the comment explaining *why* `!important` is needed against Shiki's inline styles)
**Apply to:** All new Shiki dark-mode CSS in `prose.css` (Pattern 2) — reuse this exact convention (comment above the rule explaining which library-injected inline style is being overridden and why `!important` is required) rather than a bare uncommented `!important` rule.

### `is:inline` for anything that must run before first paint
**Source:** RESEARCH.md Pattern 1 (no prior in-repo precedent — this is the site's first client script)
**Apply to:** Both the theme-init script in `Layout.astro`'s `<head>` and the click-handler script in `ThemeToggle.astro`
```astro
<script is:inline>
  /* ... */
</script>
```
Omitting `is:inline` on either script silently reintroduces flash-of-wrong-theme (init script) or breaks the click handler under Astro's module-wrapping (toggle script) — this is the single most load-bearing convention in this phase per RESEARCH.md.

### Minimal-token-budget discipline
**Source:** `01-UI-SPEC.md` (Phase 1) via `02-UI-SPEC.md`'s explicit callout ("only the font-family and color values change, not the scale system")
**Apply to:** All CSS changes this phase — 2 font weights, 4 type sizes, 5 color roles stay fixed; do not add a 6th color role, a 3rd weight, or a 5th size while implementing dark mode or the mono accent font.

## No Analog Found

None. Every file this phase touches is a Phase 1 file being extended in place, or a small new component (`ThemeToggle.astro`) with a documented external pattern (RESEARCH.md's Code Examples section) standing in for an in-repo analog since no prior component-with-script exists.

## Metadata

**Analog search scope:** `src/`, `tests/`, `astro.config.mjs`, `package.json` (entire repo — small enough to read in full; no Glob/Grep search needed beyond direct file reads, since RESEARCH.md and CONTEXT.md already named every file in scope)
**Files scanned:** 9 (`astro.config.mjs`, `package.json`, `src/layouts/Layout.astro`, `src/styles/global.css`, `src/styles/prose.css`, `src/pages/index.astro`/`about.astro`/`posts/[slug].astro` confirmed to contain no theming-relevant code, `tests/site-structure.test.mjs`)
**Pattern extraction date:** 2026-09-04
