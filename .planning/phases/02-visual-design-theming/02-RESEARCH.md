# Phase 2: Visual Design & Theming - Research

**Researched:** 2026-09-04
**Domain:** Astro static site theming — light/dark mode toggle, dual-theme syntax highlighting, dark-mode KaTeX overrides, self-hosted webfont accent typography
**Confidence:** HIGH (verified directly against this repo's built output, official Astro docs, and live npm registry)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Headers (h1-h3) use **IBM Plex Mono**, weight 600 only (matches Phase 1's existing 2-weight system: 400 body, 600 headings). Self-hosted (not Google Fonts CDN) — no external network request, consistent with the site's no-unnecessary-third-party posture.
- **D-02:** The mono accent applies to **headings only** — site title, nav, and body text stay on the existing system-ui stack. Keeps the accent feeling intentional rather than overused.
- **D-03 (general aesthetic guidance from user, applies across this whole phase):** The user wants the site to look **homegrown and professional, not a generic templated blog** — but explicitly does NOT want it to look "obviously code-themed" (e.g. don't lean into the mono font as a "look, it's a code font!" gimmick) and does NOT want it to be a visual copy of learnmeabitcoin.com. Use IBM Plex Mono as a quiet, confident accent — not a loud stylistic statement.
- **D-04:** The user explicitly stopped the granular Q&A partway through ("GSD might have been overkill... I trust you... if there's an issue later with the layout I'll tell you, it won't be that big of a deal to change"). The remaining areas (theme toggle mechanics, dark palette, mobile nav behavior) are Claude's Discretion with reasonable, low-risk defaults — not locked user decisions.

### Claude's Discretion

Per D-04, the following are Claude's call at planning/implementation time, guided by D-03's overall aesthetic direction (homegrown + professional, not templated, not a code-blog cliché, not a learnmeabitcoin.com clone):

- **Theme toggle mechanics:** Recommend a simple icon-based toggle (sun/moon) in the nav, defaulting to the visitor's OS preference (`prefers-color-scheme`) on first visit, with the explicit choice persisted in `localStorage` afterward and applied via a `data-theme` attribute (avoids flash-of-wrong-theme by inlining the check before first paint).
- **Dark palette:** Derive a dark palette from Phase 1's existing light tokens (`--bg`, `--surface`, `--accent`, `--text`, `--muted` in `src/styles/global.css`) — near-black (not pure black) background, a slightly lighter surface for code blocks/tag chips, an accent color re-tuned for sufficient contrast on dark backgrounds, and light/muted text tones with the same relative hierarchy as light mode. Must explicitly verify KaTeX-rendered math and Shiki-highlighted code blocks stay legible in dark mode.
- **Mobile nav behavior:** Phase 1's `.site-header` already uses `flex-wrap: wrap`. Default to keeping this simple wrap-based approach (no hamburger menu, no JS-driven collapse) unless it visibly breaks.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. No scope creep occurred; the user's request to cut discussion short was about depth of upfront specification, not about adding/removing capabilities.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| DSGN-01 | Site uses a minimal, text-first visual design — no stock photography, no hero images, no marketing-site styling | Not directly re-researched this phase (Phase 1 already established the minimal layout/typography scale — see `01-UI-SPEC.md`); this phase only adds accent typography and theming on top without introducing imagery or marketing-site patterns. See "Anti-Patterns to Avoid" for guardrails against scope creep into visual gimmicks. |
| DSGN-02 | Headers use a distinct monospace or serif accent font, separate from body text | See "Standard Stack" (`@fontsource/ibm-plex-mono`), "Code Examples" (`@font-face`/import pattern), and "Common Pitfalls" Pitfall 4 (weight mismatch/fake-bold risk) |
| DSGN-03 | Site supports a light/dark theme toggle, and math/code rendering is legible and correctly themed in both modes | Core focus of this research — see "Architecture Patterns" Patterns 1-3 (theme toggle mechanics, dual-theme Shiki, KaTeX dark-mode CSS), "Common Pitfalls" 1-3, and "Security Domain" (localStorage validation) |
| DSGN-04 | Layout is readable on mobile screens | Not independently re-researched — Phase 1's `.site-header { flex-wrap: wrap }` baseline is reused per CONTEXT.md Claude's Discretion; this phase's only mobile-relevant addition is the 44×44px theme toggle tap target, already specified in `02-UI-SPEC.md`'s Spacing Scale exception |
</phase_requirements>

## Summary

This phase adds the site's first client-side JavaScript (a theme toggle), a dark color palette, a self-hosted accent heading font, and dark-mode-safe overrides for two build-time-rendered subsystems (KaTeX math, Shiki code blocks) that were built light-mode-only in Phase 1. All the underlying mechanics are small and well-documented, but there are three sharp edges that will silently break if skipped: (1) Astro's inline script optimization will defer/module-wrap a plain `<script>` tag unless it carries `is:inline`, which reintroduces the flash-of-wrong-theme this phase is explicitly trying to prevent; (2) Shiki's current single-theme config (`shikiConfig: { theme: 'github-light' }`) bakes hard-coded hex colors into inline `style="color:#..."` attributes on every token span — confirmed by inspecting this repo's own `dist/` build output — so a CSS override on `<pre>`'s background alone (already in place from Phase 1) does nothing for token text color in dark mode; and (3) KaTeX's fraction bars, radical lines, and matrix brackets are drawn with `border-color`/`background-color`, not `color`, so a naive `color: inherit` override leaves those structural elements invisible against a dark background.

**Primary recommendation:** Reuse Phase 1's CSS-custom-property token system by adding a `[data-theme="dark"]` override block in `global.css` (no parallel theming mechanism); switch `astro.config.mjs`'s `shikiConfig` to dual-theme mode (`themes: { light: 'github-light', dark: 'github-dark' }`, `defaultColor: false`) and pair it with CSS that maps Shiki's emitted `--shiki-dark*` variables under `[data-theme="dark"] .astro-code`; add explicit KaTeX dark-mode CSS beyond a single `color` override; self-host IBM Plex Mono (weight 600 only) via the `@fontsource/ibm-plex-mono` npm package rather than manually managing `.woff2` files; and write the theme-init script as `<script is:inline>` in `<head>`, before any CSS paints.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Theme selection (light/dark) persistence | Browser / Client | — | `localStorage` read/write and `data-theme` attribute toggling only make sense client-side; there is no server/SSR tier in this static-only project |
| Flash-of-wrong-theme prevention | Browser / Client (inline `<head>` script) | — | Must execute synchronously before first paint; Astro has no server-rendered request to inject theme state into, so this is unavoidably a client-side, pre-paint concern |
| Color token values (light/dark palettes) | CDN / Static (build-time CSS) | — | Both palettes ship as static CSS custom properties in the build output; no runtime computation needed beyond the `data-theme` attribute selector |
| KaTeX math rendering + dark-mode color overrides | CDN / Static (build-time HTML/CSS) | — | Math HTML is generated once at build time by rehype-katex (per Phase 1 CONT-02); dark-mode legibility is a CSS override applied to that static output, not a re-render |
| Shiki code block syntax highlighting + dual-theme colors | CDN / Static (build-time HTML/CSS) | — | Shiki runs once per build, emitting both light and dark CSS variables per token; theme switching at runtime is pure CSS variable selection, no re-highlighting |
| Accent webfont delivery | CDN / Static (build-time asset) | Browser / Client (font-display swap) | Font files are static assets bundled at build time; `font-display: swap` is a browser-tier rendering behavior during load, not a separate service |

## Standard Stack

### Core

No new core technology — this phase extends the existing Astro + remark-math/rehype-katex/katex stack from Phase 1 (locked in `.planning/research/STACK.md`). No changes to that stack are needed for theming.

### Supporting

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource/ibm-plex-mono` | ^5.3.0 [VERIFIED: npm registry] | Self-hosted IBM Plex Mono webfont, pre-split by weight and subset | Avoids hand-managing `.woff2` files and manually authoring `@font-face` blocks. Fontsource is the de facto standard npm-packaged self-hosting solution for Google Fonts-family typefaces in the Astro/Vite ecosystem — ships per-weight CSS files (e.g. `600.css`) that only pull in the requested weight, keeping the "one weight only" (D-01/D-02) constraint trivial to enforce. No build-step font subsetting tooling needed (UI-SPEC explicitly said not to add a build dependency solely for subsetting) since Fontsource already ships pre-subset files. |

No syntax-highlighter or theme-toggle library is needed — Astro's built-in Shiki integration (already active from Phase 1) supports dual-theme config natively via `shikiConfig`, and the toggle itself is ~15 lines of vanilla JS per the project's own STACK.md decision (explicitly rejecting themed starters in favor of hand-rolling this).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource/ibm-plex-mono` (self-hosted npm package) | Manually download `.woff2` from Google Fonts / IBM's GitHub and hand-write `@font-face` | More manual file management, easier to get subsetting/format choices wrong, no benefit over the packaged version for a single-author blog |
| `@fontsource/ibm-plex-mono` | Google Fonts CDN `<link>` | Rejected per D-01 — adds an external network request/third-party dependency the project explicitly wants to avoid |
| Shiki dual-theme (`themes: {light, dark}` + `defaultColor: false`) | Two separate Shiki passes swapped via JS at runtime, or a single theme with manual CSS color list per token type | Dual-theme is Astro/Shiki's documented first-class mechanism; hand-rolling a second highlight pass would mean re-running Shiki client-side (reintroducing a JS runtime cost Phase 1 explicitly avoided) or maintaining a manual color mapping outside the syntax highlighter, which drifts from upstream theme updates |
| `data-theme` attribute + `[data-theme="dark"]` CSS selectors | `.dark` class on `<html>` (Astro's own tutorial pattern) | UI-SPEC already locked `data-theme="light|dark"` (not a class) — functionally equivalent, but attribute-based selectors read slightly more explicit for a tri-state concept (light/dark, not just "dark applied or not"); no compatibility difference for this project's needs |

**Installation:**
```bash
npm install @fontsource/ibm-plex-mono
```

**Version verification:** `npm view @fontsource/ibm-plex-mono version` returned `5.3.0` (checked 2026-09-04, live npm registry query). Package first published 2020-12-23 — long-established, not a recently squatted name.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|--------------|-----------|-------------|
| `@fontsource/ibm-plex-mono` | npm | ~6 years (first published 2020-12-23) | not queried numerically, but part of the Fontsource monorepo (1500+ font packages, widely used in Astro/Vite ecosystem) | `github.com/fontsource/fontsource` (confirmed via `npm view` `repository` field) | `[OK]` (ran `slopcheck install @fontsource/ibm-plex-mono`; verdict printed before an unrelated Windows subprocess error occurred post-scan — the scan step itself completed and reported `[OK]`, `1 packages scanned, 1 OK`) | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No other new packages are introduced this phase (theme toggle is hand-written vanilla JS per project convention; icon is inlined static SVG, not an icon library dependency, per `02-UI-SPEC.md`'s Registry Safety section).

## Architecture Patterns

### System Architecture Diagram

```
Build time (npm run build)
┌─────────────────────────────────────────────────────────────┐
│ astro.config.mjs                                             │
│   shikiConfig.themes: { light: 'github-light',                │
│                          dark: 'github-dark' }                │
│   shikiConfig.defaultColor: false                             │
│         │                                                     │
│         ▼                                                     │
│  Markdown post ──► remark-math ──► rehype-katex ──► static    │
│  (.md file)         (parse $..$)   (render HTML)   HTML+CSS   │
│         │                                                     │
│         └──► Shiki (code fences) ──► <pre class="astro-code"> │
│              emits per-token         with --shiki-light-*     │
│              CSS vars (light+dark)   and --shiki-dark-* vars  │
│                                       as inline custom props   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼  (dist/ static output, no server)
┌─────────────────────────────────────────────────────────────┐
│ Browser (request time)                                        │
│                                                                 │
│ 1. <head><script is:inline> runs FIRST, before paint:         │
│      read localStorage('theme')                               │
│        → found: use it                                        │
│        → not found: use matchMedia(prefers-color-scheme)      │
│      set <html data-theme="light|dark">                       │
│                                                                 │
│ 2. CSS paints using [data-theme="dark"] overrides:             │
│      global.css      → --bg/--surface/--accent/--text/--muted │
│      prose.css        → .katex color overrides                │
│      code-theme.css   → .astro-code var(--shiki-dark-*) swap  │
│                                                                 │
│ 3. User clicks toggle button:                                  │
│      → flip data-theme attribute                              │
│      → write choice to localStorage (persists across visits)  │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── layouts/
│   └── Layout.astro          # add: <script is:inline> theme-init in <head>,
│                              #      theme toggle button in .site-header nav
├── components/
│   └── ThemeToggle.astro     # optional: extract toggle button + its own
│                              #      inline click-handler script as a component
│                              #      (keeps Layout.astro from growing a large
│                              #      inline <script> block)
├── styles/
│   ├── global.css            # add: [data-theme="dark"] { --bg: ...; ... }
│   │                          #      @font-face for IBM Plex Mono (600 weight)
│   │                          #      h1/h2/h3 { font-family: 'IBM Plex Mono', ... }
│   └── prose.css             # add: [data-theme="dark"] .katex { ... } overrides
│                              #      [data-theme="dark"] .astro-code / span
│                              #        { color: var(--shiki-dark) !important; ... }
astro.config.mjs               # change: shikiConfig.theme → shikiConfig.themes
                                #         + defaultColor: false
```

### Pattern 1: Flash-free theme init via `is:inline`

**What:** An inline `<script>` in `<head>` that reads `localStorage`, falls back to `prefers-color-scheme`, and sets `data-theme` on `<html>` — before any CSS has painted.

**When to use:** Any time theme state must be known before first paint in a static (non-SSR) site with no server to inject the value server-side.

**Example:**
```astro
---
// Source: https://docs.astro.build/en/tutorial/6-islands/2/ (pattern),
// adapted to data-theme attribute per 02-UI-SPEC.md (not .dark class)
---
<html lang="en">
  <head>
    <script is:inline>
      const stored = localStorage.getItem('theme');
      const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    </script>
    <!-- ... rest of head, including global.css import ... -->
  </head>
```

**Critical detail (verified via WebSearch, cross-referenced against multiple Astro-specific dark-mode writeups):** Astro processes `<script>` tags by default — bundling, deferring, and turning them into ES modules unless the `is:inline` directive is present. A plain `<script>` (no `is:inline`) will NOT run synchronously before paint, reintroducing the exact flash this pattern exists to prevent. This is an Astro-specific gotcha not present in plain HTML and is easy to miss since the script "looks" inline in the source.

### Pattern 2: Dual-theme Shiki with CSS variable handoff

**What:** Configure Shiki to emit both light and dark colors per token as CSS custom properties (instead of a single hard-coded color), then select between them with a CSS selector scoped to the `data-theme` attribute.

**When to use:** Any Astro Markdown site needing dark-mode-aware syntax highlighting without re-running the highlighter client-side.

**Example — `astro.config.mjs` change:**
```js
// Source: https://docs.astro.build/en/guides/syntax-highlighting/ (official docs,
// confirmed via WebFetch 2026-09-04)
markdown: {
  shikiConfig: {
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    defaultColor: false, // required — without this, Shiki still bakes in
                          // the `light` theme's colors as the default inline style
  },
  // ...existing remarkPlugins/rehypePlugins/processor unchanged
}
```

**Example — CSS to consume the emitted variables:**
```css
/* Source: Shiki official docs (shiki.style/guide/dual-themes) + Astro docs,
   cross-verified via WebSearch 2026-09-04. Class name confirmed as
   `.astro-code` (NOT `.shiki`) by inspecting this repo's own dist/ build
   output — Astro renames Shiki's default class. */
[data-theme="dark"] .astro-code,
[data-theme="dark"] .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
```

**VERIFIED against this repo:** Inspecting `dist/posts/why-quantum-computers-threaten-bitcoin/index.html` after a build shows the current (Phase 1, single-theme) output as:
```html
<pre class="astro-code github-light" style="background-color:#fff;color:#24292e; overflow-x: auto;" ...>
  <code><span class="line"><span style="color:#D73A49">def</span>...
```
Every token span carries an inline `style="color:#HEXCODE"`. Phase 1's existing `prose.css` rule (`pre { background: var(--surface) !important; }`) only overrides the `<pre>` background — it does nothing for the per-span `color` styles. This confirms the UI-SPEC's stated Shiki dark-mode requirement is real and necessary, not speculative: without the dual-theme config change, dark mode would render near-invisible dark-on-dark syntax-highlighted text.

### Pattern 3: KaTeX dark-mode CSS — beyond a single `color` override

**What:** KaTeX renders structural math elements (fraction bars, radical/square-root lines, matrix brackets, `\overline`/`\underline` rules) using `border-color` or `background-color` on internal `<span>` elements, not the CSS `color` property. A single `.katex { color: var(--text); }` rule fixes glyph text but leaves these structural lines invisible against a dark background.

**When to use:** Any KaTeX-rendered math in a dark-themeable site.

**Example:**
```css
/* [data-theme="dark"] .katex { color: var(--text); } handles glyphs.
   Structural elements need explicit border/background overrides. Exact
   selector names (.katex .frac-line, .katex .sqrt > .vlist-t ... .rule,
   etc.) should be confirmed by inspecting KaTeX's actual rendered output
   in this repo (npm run build + inspect dist/ HTML for a post containing
   a fraction or square root) since selector internals can shift between
   KaTeX minor versions. */
[data-theme="dark"] .katex {
  color: var(--text);
}
[data-theme="dark"] .katex .frac-line,
[data-theme="dark"] .katex .rule,
[data-theme="dark"] .katex .sqrt > .vlist-t2::before,
[data-theme="dark"] .katex .hline,
[data-theme="dark"] .katex .vlist-r .vlist .pstrut ~ span[style*="border"] {
  border-color: var(--text) !important;
}
```

**Confidence note [ASSUMED — needs implementation-time visual verification]:** The exact CSS class names for KaTeX's structural elements (`.frac-line`, `.rule`, `.sqrt`, `.hline`) are drawn from general KaTeX CSS knowledge and match KaTeX's published stylesheet structure, but were not independently re-verified against the specific installed `katex@0.18.5` version's compiled CSS in this session. **Before considering DSGN-03 done, the plan must include a manual visual check**: render a post containing at least one fraction (`\frac{a}{b}`) and one square root (`\sqrt{x}`) in dark mode and confirm the bar/line renders visibly — this exact check is already called out in `02-UI-SPEC.md`'s Color section ("manually verify... fraction bars, square-root lines, and matrix brackets are visible").

### Anti-Patterns to Avoid

- **Relying on `color: inherit` alone for KaTeX dark mode:** Leaves structural rule/border elements invisible — confirmed pitfall, see Pattern 3.
- **Overriding only `<pre>` background for Shiki dark mode:** Leaves per-token text colors from the light theme baked in via inline styles — confirmed against this repo's actual build output, see Pattern 2.
- **Omitting `is:inline` on the theme-init script:** Astro will defer/module-wrap it, reintroducing flash-of-wrong-theme — see Pattern 1.
- **Introducing a second theming mechanism (e.g., a `.dark` class alongside the `data-theme` attribute, or new CSS variable names):** UI-SPEC and CONTEXT.md both explicitly lock the `data-theme` attribute approach reusing the exact same 5 token names from Phase 1 (`--bg`, `--surface`, `--accent`, `--text`, `--muted`) — introducing a parallel system would fragment the styling model Phase 1 established.
- **Applying IBM Plex Mono beyond h1-h3:** UI-SPEC explicitly guards against this ("code font gimmick" per D-03) — confine the `font-family` override strictly to heading selectors, do not touch `.site-title`, nav, body, meta text, or the toggle button.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Self-hosted webfont file management (subsetting, format conversion, `@font-face` boilerplate) | Manual `.woff2` download + hand-written `@font-face` block | `@fontsource/ibm-plex-mono` npm package | Pre-subset (Latin), pre-split by weight, standard `font-display: swap` already configured in the package's shipped CSS — see Fontsource's own install docs. Hand-rolling this is strictly more manual work for zero benefit on a project already avoiding unnecessary build tooling. |
| Dual-theme syntax highlighting | Running Shiki twice and swapping `<pre>` blocks with JS, or hand-mapping every token color for two themes | Shiki's native `themes: {light, dark}` + `defaultColor: false` config (already built into Astro's markdown pipeline) | This is a first-class, documented Shiki/Astro feature requiring only a config change — no custom highlighting logic, no client-side re-render, stays consistent with the zero-JS-by-default philosophy. |

**Key insight:** Every theming problem in this phase (fonts, code highlighting, math styling) already has a documented, build-time-only solution native to the existing stack (Astro + Shiki + KaTeX + Fontsource). The only genuinely new code this phase writes is the theme-toggle mechanics itself (~15-20 lines of vanilla JS) — everything else is CSS and config.

## Common Pitfalls

### Pitfall 1: Shiki inline styles override dark-mode CSS without `!important` + exact selector match

**What goes wrong:** Dark mode code blocks still show light-theme colors (or worse, invisible dark-on-dark text) even after adding dark CSS rules.
**Why it happens:** Shiki emits inline `style="color:#HEX"` per token span, which has higher CSS specificity than any external stylesheet rule without `!important`. Confirmed directly in this repo's build output (see Pattern 2).
**How to avoid:** Use `defaultColor: false` in `shikiConfig` so Shiki emits CSS variables instead of hard-coded inline colors, and select using the exact class Astro renders (`.astro-code`, not `.shiki`) with `!important` on the override.
**Warning signs:** After building, `grep -o 'class="[^"]*"' dist/**/*.html | grep astro-code` still shows a single theme name (e.g., `astro-code github-light`) instead of variable-based output; or inspecting a `<pre>` element still shows `style="color:#..."` instead of `style="--shiki-light:...; --shiki-dark:..."`.

### Pitfall 2: KaTeX structural elements invisible in dark mode despite a `color` override

**What goes wrong:** Math glyphs (numbers, letters, operators) look fine in dark mode, but fraction bars, square root lines, or matrix brackets are invisible/missing.
**Why it happens:** These elements are drawn via `border-color`/`background-color` CSS properties on internal spans, not `color` — a single `.katex { color: var(--text) }` rule doesn't touch them.
**How to avoid:** Add explicit border/background overrides for structural KaTeX classes (see Pattern 3) and manually visually verify against a real post containing a fraction and a square root.
**Warning signs:** A rendered fraction shows the numerator and denominator numbers clearly but no horizontal bar between them in dark mode.

### Pitfall 3: Theme-init script runs too late, causing a flash of wrong theme

**What goes wrong:** Page loads briefly in light mode (or the OS-preferred theme) before snapping to the user's stored dark preference.
**Why it happens:** Astro's default script handling defers/module-wraps `<script>` tags, so they execute after the DOM is parsed and initial CSS has already painted using the default (no `data-theme` attribute) styles.
**How to avoid:** Use `<script is:inline>` and place it as early as possible in `<head>`, before the `global.css` `<link>`/import if practical (though CSS custom property defaults on `:root` mean order relative to the stylesheet matters less than order relative to first paint).
**Warning signs:** A visible color "flash" on page load/refresh, especially noticeable when the stored preference is dark and the OS default is light (or vice versa).

### Pitfall 4: IBM Plex Mono weight/style mismatch causes browser-synthesized fake-bold

**What goes wrong:** Headings render with a browser-faked bold/oblique style instead of the actual IBM Plex Mono 600 glyphs, looking slightly "off" (uneven stroke weights).
**Why it happens:** If only a different weight (e.g., 400) is imported from the Fontsource package but CSS requests `font-weight: 600`, browsers synthesize a fake bold rather than erroring, which is easy to miss visually at a glance.
**How to avoid:** Import only the `600.css` file/weight from `@fontsource/ibm-plex-mono` (matching D-01's "weight 600 only" decision) and confirm the applied `font-weight: 600` in heading CSS rules exactly matches the imported weight — do not rely on `font-weight: bold` (which maps to 700, a weight that isn't imported).
**Warning signs:** Heading text looks slightly different (heavier, uneven) compared to IBM Plex Mono's official specimen/type samples; DevTools "Computed" panel shows `font-weight: 600` was requested but the actually-rendered font-family falls back to a synthesized variant.

## Code Examples

### Theme toggle button + click handler (component-level)

```astro
---
// ThemeToggle.astro — Source: pattern synthesized from Astro's official
// tutorial (docs.astro.build/en/tutorial/6-islands/2/) adapted to the
// data-theme attribute contract locked in 02-UI-SPEC.md
---
<button id="theme-toggle" aria-label="Switch to dark theme">
  <svg class="icon-sun" ...><!-- sun path --></svg>
  <svg class="icon-moon" ...><!-- moon path --></svg>
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
Note: `aria-label` is state-reflecting per `02-UI-SPEC.md`'s Copywriting Contract ("Switch to dark theme" / "Switch to light theme", not a static "Toggle theme" label).

### `@font-face` / import for IBM Plex Mono 600 only

```css
/* global.css, or import the Fontsource CSS directly in Layout.astro:
   import '@fontsource/ibm-plex-mono/600.css';
   This imports ONLY the 600-weight, normal-style, latin-subset file —
   matching D-01/D-02's "weight 600 only" constraint without manual
   @font-face authoring. */

h1, h2, h3 {
  font-family: 'IBM Plex Mono', ui-monospace, "SFMono-Regular", Consolas, monospace;
  /* font-weight: 600 already set in Phase 1's global.css h1/h2/h3 rules —
     no change needed there, only font-family is added per UI-SPEC */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Single Shiki theme (`theme: 'string'`) | Dual/multi-theme (`themes: {light, dark, ...}` + `defaultColor: false`) | Shiki has supported dual themes for several years; Astro exposes it directly via `shikiConfig` passthrough — not a recent change, but easy to miss since single-theme config (what Phase 1 used) is the more commonly copy-pasted starter example | Phase 1's `theme: 'github-light'` must become `themes: { light: 'github-light', dark: 'github-dark' }` with `defaultColor: false` added |

**Deprecated/outdated:** None identified specific to this phase's scope — the stack (Astro 7, Shiki via Astro's bundled markdown pipeline, KaTeX 0.18.x) is current per Phase 1's STACK.md research.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact KaTeX CSS class names for structural elements (`.frac-line`, `.rule`, `.sqrt`, `.hline`) match the installed `katex@0.18.5` version's compiled CSS | Pattern 3 / Code Examples | If class names differ, the dark-mode override CSS silently does nothing (no build error — just visually broken fraction bars/roots in dark mode). Mitigated by the explicit manual-verification step already required by 02-UI-SPEC.md and called out again here. |
| A2 | `@fontsource/ibm-plex-mono`'s weight-600 CSS file path follows the standard Fontsource convention (`@fontsource/ibm-plex-mono/600.css`) | Standard Stack / Code Examples | Low risk — this is Fontsource's universal, consistently-documented convention across all ~1500 packages in the monorepo, but the exact file wasn't opened and inspected directly in this session (only the package's weight list was confirmed via WebFetch of the install page). |

**If this table is empty:** N/A — see entries above.

## Open Questions

1. **Exact KaTeX structural-element selectors for this KaTeX version**
   - What we know: KaTeX generally uses `border-color`/`background-color` (not `color`) for fraction bars, radical lines, and similar structural elements; general class names (`.frac-line`, `.sqrt`, `.hline`) are consistent across recent KaTeX major versions per general KaTeX CSS structure knowledge.
   - What's unclear: The precise, version-pinned selector list for `katex@0.18.5`'s actual compiled CSS wasn't directly inspected in this session.
   - Recommendation: During implementation, after adding the KaTeX dark CSS override, run `npm run build`, open a rendered post containing `\frac{}{}`  and `\sqrt{}` in dark mode, and visually confirm. Inspect `node_modules/katex/dist/katex.css` directly if any element is still invisible, to find the exact class/property in use.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | Yes (repo requires `>=22.12.0` per `package.json` `engines`) | Not independently re-verified this session; assumed present since Phase 1 already built successfully in this repo | — |
| npm registry access | `@fontsource/ibm-plex-mono` install | Yes — confirmed live via `npm view` returning version 5.3.0 during this research session | 5.3.0 | — |
| slopcheck (Python CLI) | Package legitimacy audit | Yes — installed and ran successfully during this session (`pip install slopcheck`), returned `[OK]` verdict for the one new package | not captured | If unavailable in a future session, all newly recommended packages must be tagged `[ASSUMED]` per the Package Legitimacy Protocol |

No missing dependencies identified — this phase adds no new external services, only one npm package.

## Security Domain

This phase adds only client-side JavaScript reading/writing `localStorage` for a UI preference (theme name: `"light"` or `"dark"`) and toggling a DOM attribute. No user input, no authentication, no network requests beyond static asset delivery, no server-side code (this is a static-only Cloudflare Pages deployment per the project's locked stack). The OWASP ASVS categories most commonly relevant to web apps (authentication, session management, access control, most of input validation) do not apply to this phase's scope.

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | No auth surface in this project (explicitly out of scope per REQUIREMENTS.md "Out of Scope" — no CMS/admin) |
| V3 Session Management | No | No sessions — `localStorage` theme preference is not session/auth state |
| V4 Access Control | No | No access-controlled resources; site is fully public static content |
| V5 Input Validation | Marginal | The only "input" is the toggle button click (no free-text/URL-param input this phase); `localStorage.getItem('theme')` should be defensively checked against the two expected values (`'light'`/`'dark'`) rather than trusted blindly, in case of manual tampering via browser devtools — falling back to `prefers-color-scheme` if the stored value is neither, per UI-SPEC's "fail silently and fall back" requirement |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Malformed/tampered `localStorage` value causing unexpected CSS/JS state | Tampering (low severity — client-only, no server trust boundary crossed) | Validate the stored value is exactly `'light'` or `'dark'` before using it; otherwise fall back to `prefers-color-scheme` detection, matching the UI-SPEC's "fail silently" requirement in the Copywriting Contract's Error state row |

No other STRIDE categories are meaningfully applicable — this is a static, read-only content site with no forms, no user accounts, and no server-side attack surface introduced by this phase.

## Sources

### Primary (HIGH confidence)
- This repo's own `astro.config.mjs`, `src/styles/global.css`, `src/styles/prose.css`, `src/layouts/Layout.astro`, `package.json` — read directly.
- This repo's own `dist/` build output (`dist/posts/why-quantum-computers-threaten-bitcoin/index.html`) — inspected directly via `npm run build` + grep, confirming exact Shiki class name (`astro-code`) and inline-style behavior in current single-theme config.
- Official Astro docs, "Syntax Highlighting" — https://docs.astro.build/en/guides/syntax-highlighting/ (fetched 2026-09-04, confirms `shikiConfig.themes` + `defaultColor` config shape and `.astro-code` dark-mode CSS pattern)
- Official Astro tutorial, theme toggle — https://docs.astro.build/en/tutorial/6-islands/2/ (fetched 2026-09-04, confirms `is:inline` requirement and inline-script-before-paint pattern)
- npm registry — `npm view @fontsource/ibm-plex-mono` (version 5.3.0, published 2020-12-23, repository `github.com/fontsource/fontsource`) — checked live 2026-09-04
- slopcheck CLI — `slopcheck install @fontsource/ibm-plex-mono` returned `[OK]` verdict, run live 2026-09-04
- WCAG contrast ratio calculation (manual, using the standard WCAG relative-luminance formula) — `#60A5FA` on `#09090B` computes to approximately 7.9:1, well above the 4.5:1 AA threshold for normal text specified in `02-UI-SPEC.md`'s "Contrast requirement" — resolves that spec's open verification item without needing to shift to blue-300.

### Secondary (MEDIUM confidence)
- Fontsource official install page for IBM Plex Mono — https://fontsource.org/fonts/ibm-plex-mono/install (fetched 2026-09-04, confirms weight 600 is among available weights; exact per-weight import path convention not independently re-verified against this specific package's file listing)
- Shiki official docs, dual themes guide — https://shiki.style/guide/dual-themes and https://shiki.matsu.io/guide/dual-themes (WebSearch cross-referenced, confirms `--shiki-dark`/`--shiki-dark-bg` CSS variable naming and `[data-theme='dark'] .shiki` selector pattern, adapted to this repo's actual `.astro-code` class)
- amanhimself.dev, "How to change light and dark Shiki themes when using Astro" — https://amanhimself.dev/blog/dual-shiki-themes-with-astro/ (WebSearch, cross-referenced against official Astro docs, consistent findings)

### Tertiary (LOW confidence)
- General KaTeX structural CSS class names (`.frac-line`, `.rule`, `.sqrt`, `.hline`) — drawn from general training knowledge of KaTeX's CSS structure, not independently re-verified against the specific installed `katex@0.18.5` compiled stylesheet in this session. Flagged in Assumptions Log (A1) with an explicit required manual-verification step.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — only one new package (`@fontsource/ibm-plex-mono`), verified live on npm registry and via slopcheck
- Architecture: HIGH — theme toggle and dual-theme Shiki patterns confirmed against official Astro docs and this repo's own build output
- Pitfalls: HIGH for Shiki/inline-script pitfalls (directly reproduced against this repo's build output and official docs); MEDIUM for KaTeX structural-element pitfall (general KaTeX knowledge, flagged as needing implementation-time visual verification per A1)

**Research date:** 2026-09-04
**Valid until:** 30 days (stable stack, no fast-moving dependencies in this phase's scope)
