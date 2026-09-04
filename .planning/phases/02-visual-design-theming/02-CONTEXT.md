# Phase 2: Visual Design & Theming - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Layer a distinct accent header font and a full light/dark theme system on top of Phase 1's working (but visually plain, light-only) Astro site. This phase does not touch content, routing, or the Markdown pipeline — it's purely visual: typography accent, color theming (including a dark palette), the toggle mechanism, and confirming/fixing mobile layout behavior. Phase 1 already established a CSS-custom-property-based styling system (`src/styles/global.css`) that this phase extends rather than replaces.

</domain>

<decisions>
## Implementation Decisions

### Accent header font
- **D-01:** Headers (h1-h3) use **IBM Plex Mono**, weight 600 only (matches Phase 1's existing 2-weight system: 400 body, 600 headings). Self-hosted (not Google Fonts CDN) — no external network request, consistent with the site's no-unnecessary-third-party posture.
- **D-02:** The mono accent applies to **headings only** — site title, nav, and body text stay on the existing system-ui stack. Keeps the accent feeling intentional rather than overused.
- **D-03 (general aesthetic guidance from user, applies across this whole phase):** The user wants the site to look **homegrown and professional, not a generic templated blog** — but explicitly does NOT want it to look "obviously code-themed" (e.g. don't lean into the mono font as a "look, it's a code font!" gimmick) and does NOT want it to be a visual copy of learnmeabitcoin.com. Use IBM Plex Mono as a quiet, confident accent — not a loud stylistic statement.

### Discussion cut short — user trusts Claude's judgment
- **D-04:** The user explicitly stopped the granular Q&A partway through ("GSD might have been overkill... I trust you... if there's an issue later with the layout I'll tell you, it won't be that big of a deal to change"). Per this explicit instruction, the remaining areas (theme toggle mechanics, dark palette, mobile nav behavior) are captured below as Claude's Discretion with reasonable, low-risk defaults — not locked user decisions. The user is opting into "ship it, iterate if something looks wrong" rather than pre-specifying every visual detail.

### Claude's Discretion
Per D-04, the following are Claude's call at planning/implementation time, guided by D-03's overall aesthetic direction (homegrown + professional, not templated, not a code-blog cliché, not a learnmeabitcoin.com clone):

- **Theme toggle mechanics:** Recommend a simple icon-based toggle (sun/moon) in the nav, defaulting to the visitor's OS preference (`prefers-color-scheme`) on first visit, with the explicit choice persisted in `localStorage` afterward and applied via a `data-theme` attribute (avoids flash-of-wrong-theme by inlining the check before first paint).
- **Dark palette:** Derive a dark palette from Phase 1's existing light tokens (`--bg`, `--surface`, `--accent`, `--text`, `--muted` in `src/styles/global.css`) — near-black (not pure black) background, a slightly lighter surface for code blocks/tag chips, an accent color re-tuned for sufficient contrast on dark backgrounds (the current `#1D4ED8` is likely too dark/muddy on a dark background and may need lightening), and light/muted text tones with the same relative hierarchy as light mode. Must explicitly verify KaTeX-rendered math and Shiki-highlighted code blocks stay legible in dark mode (KaTeX renders black glyphs by default — needs a CSS override; Shiki themes need a dark-mode-aware theme pair or CSS variable overrides).
- **Mobile nav behavior:** Phase 1's `.site-header` already uses `flex-wrap: wrap`, which gives baseline wrapping behavior on narrow viewports. Default to keeping this simple wrap-based approach (no hamburger menu, no JS-driven collapse) unless it visibly breaks — matches the "lean, hand-built" posture and avoids adding JS for a 2-link nav.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract (Phase 1, extended by this phase)
- `.planning/phases/01-scaffolding-core-content-pipeline/01-UI-SPEC.md` — Phase 1's locked spacing scale, typography scale (sizes/weights/line-heights), and light-only color palette. This phase's dark palette and accent font must stay consistent with the spacing/type scale already established there — only the font-family and color values change, not the scale system.
- `src/styles/global.css` — Existing CSS custom properties (`--space-*`, `--bg`, `--surface`, `--accent`, `--text`, `--muted`) that this phase extends with dark-mode equivalents. New dark values should be added as an alternate token set (e.g. `[data-theme="dark"]` override block), not a parallel styling system.

### Project-level requirements and stack
- `.planning/PROJECT.md` — Aesthetic goal ("lean and hand-built, not templated"), design reference note (learnmeabitcoin.com for tone/rigor, NOT literal visual copying per D-03).
- `.planning/REQUIREMENTS.md` — DSGN-01 through DSGN-04 are this phase's requirement set.
- `.planning/ROADMAP.md` (Phase 2 section) — Goal statement and the 4 success criteria this phase must satisfy.

No other specs, ADRs, or external docs were referenced during this discussion.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/styles/global.css` — Already uses CSS custom properties for spacing and color (`:root { --bg, --surface, --accent, --text, --muted, --space-* }`). This is the natural extension point for a dark palette (e.g. via `[data-theme="dark"]` selector overriding the same variable names) rather than introducing a new theming mechanism.
- `.site-header` in `global.css` already has `flex-wrap: wrap` and `gap: var(--space-sm)` — existing mobile-safe baseline for the nav that this phase can build on.

### Established Patterns
- Typography and color are both driven by a small, deliberately limited token set (2 font weights, 4 type sizes, 5 color roles) established in Phase 1's UI-SPEC. This phase should preserve that minimalism — add a dark equivalent of each existing color token, don't introduce new roles unless something (e.g. code block dark-mode legibility) genuinely requires it.
- No component library, no icon library, no client JS yet (Phase 1 shipped zero-JS by design). A theme toggle necessarily introduces a small amount of client JS (to read/write `localStorage` and toggle the `data-theme` attribute) — this is the first JS this site ships, and should stay minimal/vanilla, consistent with the "zero-JS-by-default, opt in only where needed" stack philosophy.

### Integration Points
- `src/layouts/Layout.astro` — Site-wide layout wrapping every page; the theme-init script (to avoid flash-of-wrong-theme) and the toggle control both belong here or in the nav markup it renders.
- KaTeX's rendered math and Shiki's syntax-highlighted code blocks are both build-time-generated static HTML/CSS (per Phase 1's CONT-02/CONT-04 decisions) — dark-mode legibility for both must be solved via CSS overrides scoped to `[data-theme="dark"]`, not by re-rendering content differently per theme.

</code_context>

<specifics>
## Specific Ideas

- D-03: "Homegrown, obviously professional enough to read and take seriously, but not a boilerplate blog look. Don't make it obviously 'this is code so I'm using a cool code font.' Don't copy learnmeabitcoin.com's look."
- User is comfortable with Claude making the remaining visual calls (toggle mechanics, dark palette values, mobile nav specifics) and course-correcting after seeing the result, rather than pre-deciding every detail now.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope creep occurred; the user's request to cut discussion short was about depth of upfront specification, not about adding/removing capabilities.

### Reviewed Todos (not folded)
None — no pending todos existed for this phase.

</deferred>

---

*Phase: 2-visual-design-theming*
*Context gathered: 2026-09-04*
