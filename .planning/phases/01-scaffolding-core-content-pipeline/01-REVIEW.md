---
phase: 01-scaffolding-core-content-pipeline
reviewed: 2026-09-03T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - package.json
  - package-lock.json
  - .gitignore
  - tsconfig.json
  - astro.config.mjs
  - src/content.config.ts
  - src/content/posts/why-quantum-computers-threaten-bitcoin.md
  - src/content/posts/shors-algorithm-in-plain-english.md
  - src/layouts/Layout.astro
  - src/pages/index.astro
  - src/pages/about.astro
  - src/pages/posts/[slug].astro
  - src/styles/global.css
  - src/styles/prose.css
  - tests/site-structure.test.mjs
  - tests/markdown-pipeline.test.mjs
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-03
**Depth:** standard
**Files Reviewed:** 15 (package-lock.json reviewed only for presence/pinning, not line-by-line)
**Status:** issues_found

## Summary

This phase's 16 `node:test` assertions all read static, already-built HTML with string/regex matching. That is a solid pattern for proving markup shape (classes, `href`s, absence of `$$`), but it structurally cannot observe runtime DOM behavior — focus order, tab reachability, computed overflow. One of those blind spots produced a real, provable defect: the heading-anchor links are configured with `tabIndex: -1`, which removes them from the default keyboard Tab sequence entirely, directly contradicting this same phase's own locked requirement that the anchor be "revealed on hover and on keyboard focus" (CONT-03 must-have, restated explicitly in the 01-02 plan's Task 2 action text: "keyboard access must reveal it too, not hover alone"). The human checkpoint reportedly confirmed Tab-to-reveal worked, but that is inconsistent with `tabindex="-1"` semantics and should be re-verified rather than taken at face value.

Everything else found is lower-severity: a couple of environment/portability landmines the implementers themselves flagged but didn't fully resolve (Node `engines` mismatch, shell-glob-dependent test script), one dead/no-op `package.json` field, an unused-in-practice-but-technically-broken tsconfig exclude override, one missing `Props` type for consistency, one schema gap (no slug-uniqueness guard), and one content-accuracy nit in the seed post's excerpt.

## Critical Issues

### CR-01: Heading-anchor links are unreachable by keyboard Tab navigation, contradicting the locked CONT-03 requirement

**File:** `astro.config.mjs:20-30` (specifically line 28: `properties: { ariaHidden: 'true', tabIndex: -1, class: 'heading-anchor-link' }`)
**Issue:** `rehypeAutolinkHeadings` is configured with `tabIndex: -1` on the generated `<a class="heading-anchor-link">`. Per the HTML/ARIA spec, a negative `tabindex` makes an element focusable only *programmatically* — it is explicitly removed from the sequential (Tab-key) keyboard navigation order. The heading elements themselves (`<h2>`/`<h3>`) carry no `tabindex` either, so nothing in the anchor's vicinity is reachable by pressing Tab at all.

This directly contradicts the phase's own must-have: "A reader hovering a post heading sees a # anchor glyph appear, **and clicking it puts that heading's fragment in the URL bar**" combined with the 01-02 plan's explicit instruction: "`.heading-anchor-link:focus-visible` (**keyboard access must reveal it too, not hover alone**)." The `:focus-visible` CSS rule in `src/styles/prose.css:29-33` is correctly written, but it can never fire from keyboard Tab traversal because the element it targets is deliberately excluded from that traversal.

The 16 automated assertions cannot catch this — they only grep static HTML/CSS text (presence of the `heading-anchor-link` class, a populated `href`, the CSS rule text) and never simulate actual focus/Tab behavior. The 01-02-SUMMARY.md records the human checkpoint as approving "Press Tab repeatedly to reach a heading anchor by keyboard... confirmed," which is inconsistent with what `tabindex="-1"` actually does — this should be re-verified in a real browser (Tab through the post page and check whether focus ever visibly lands on the `#` glyph) rather than assumed correct because a human previously said so.

**Fix:** Remove `tabIndex: -1` (or set it to `0`) so the anchor participates in the default tab order:
```javascript
properties: { ariaHidden: 'true', class: 'heading-anchor-link' },
```
Note `ariaHidden: 'true'` alone is also questionable to keep once the element is keyboard-focusable and clickable — a link that is both interactive and `aria-hidden="true"` is an accessibility anti-pattern (screen readers will skip an interactive element). If the anchor is meant to be reachable by keyboard, drop `ariaHidden` too, or give it a real accessible name (e.g. `aria-label="Link to this section"`) instead of hiding it.

## Warnings

### WR-01: `package.json` `engines.node` requirement contradicts the project's own documented Node support

**File:** `package.json:5-7`
**Issue:** `"engines": { "node": ">=22.12.0" }` requires Node 22.12+, but `.planning`/`CLAUDE.md` and this phase's own RESEARCH.md explicitly state "Node.js ^20 LTS or ^22 LTS" is supported (`01-RESEARCH.md` Environment Availability table). A contributor or CI runner on Node 20 LTS would get an `engines` mismatch warning (or a hard failure under `npm ci --engine-strict` / many CI templates that pass `--engine-strict` by default), despite the project's own docs saying Node 20 is fine.
**Fix:** Either loosen the constraint to match documented support (`">=20.9.0"` or similar covering both LTS lines), or update CLAUDE.md/RESEARCH.md to reflect that Node 22.12+ is now actually required going forward. Pick one source of truth and make the other match it.

### WR-02: `test` script depends on shell-level glob expansion that isn't portable

**File:** `package.json:13` (`"test": "npm run build && node --test tests/**/*.test.mjs"`)
**Issue:** This was already flagged by the implementer in `01-01-SUMMARY.md` as a deviation worth double-checking on other platforms, but it was never actually resolved — it shipped as the permanent `test` script. `**` globstar expansion is not guaranteed: cmd.exe (the default `npm` script shell on many Windows setups) does not expand glob patterns at all and would pass the literal string `tests/**/*.test.mjs` to `node --test`; POSIX `sh`/`bash` only expands `**` recursively if the `globstar` shell option is enabled (off by default). If a future CI runner or contributor's shell doesn't expand this pattern the way it happened to on the original author's machine, `npm test` could silently discover **zero** test files and report a false "0 tests, 0 failures" success rather than an actual failure.
**Fix:** Use Node's own directory-recursion instead of relying on shell globbing, e.g. `"test": "npm run build && node --test tests/"` (the documented Node built-in behavior for directories) and fix the underlying environment issue that made that fail on the original machine, or use a small cross-platform glob runner (`node --test $(node -e "...")` is overkill — simplest fix is confirming `node --test tests` works with a current Node LTS and pinning `engines.node` accordingly, since WR-01 already touches this).

### WR-03: Heading-anchor glyph is positioned outside the viewport on narrow screens, defeating its own focus-reveal

**File:** `src/styles/prose.css:14-19`, `src/styles/global.css:55-58`
**Issue:** `.heading-anchor-link` is absolutely positioned at `left: calc(-1 * var(--space-md))` with `transform: translateX(-100%)` — i.e., entirely to the left of the heading's own left edge. `main` (global.css:55-58) has `margin: 0 auto` but **no horizontal padding**, so on any viewport narrower than the 68ch content column, the heading text sits flush against the left edge of the screen with zero room to its left. The anchor glyph therefore renders off-screen (clipped by the viewport) on mobile/narrow widths, so even if CR-01 is fixed and the element becomes keyboard-focusable, a narrow-viewport user still can't *see* the revealed glyph.
**Fix:** Give `main` (or the anchor's containing block) a minimum horizontal padding (e.g. `--space-md`) on narrow viewports so there's room for the anchor to render, or switch the anchor to `behavior: 'append'`/inline positioning after the heading text instead of before it, which avoids depending on left-margin space entirely.

### WR-04: `package.json` `allowScripts` field is not a real npm config key and has no effect

**File:** `package.json:24-26`
**Issue:** `"allowScripts": { "esbuild": true }` is not a field npm (or Astro) recognizes. There is no npm package.json schema entry named `allowScripts` — npm's actual script-permission mechanisms are CLI flags (`--ignore-scripts`) or, in newer npm, none at the package.json level at all (this pattern resembles pnpm's `pnpm.onlyBuiltDependencies`/Bun's `trustedDependencies`, neither of which is `allowScripts`). As committed, this field does nothing: it doesn't grant, restrict, or document any actual script-execution permission, and a future maintainer reading it could reasonably (and incorrectly) assume postinstall scripts are being controlled.
**Fix:** Remove the field, or if the intent was to explicitly allow/trust `esbuild`'s postinstall/build script under some tool, use that tool's actual documented field name (e.g. pnpm's `pnpm.onlyBuiltDependencies`) — but only if this project actually uses that package manager. Given the project uses plain `npm`, there's currently no npm-native equivalent to add; just delete the dead field.

## Info

### IN-01: `tsconfig.json` `exclude` override removes the default `node_modules` exclusion

**File:** `tsconfig.json:4` (`"exclude": ["dist"]` combined with `"include": ["**/*"]`)
**Issue:** TypeScript's documented default `exclude` list (`node_modules`, `bower_components`, `jspm_packages`, plus `outDir`) only applies when no `exclude` is specified at all; specifying your own `exclude` array replaces rather than extends the default. With `include: ["**/*"]` and `exclude: ["dist"]`, `node_modules` is no longer explicitly excluded from the TypeScript program. In practice this is Astro's own stock scaffolded tsconfig and `astro check`/most editors cope fine because TS only matches `.ts`/`.tsx`/`.d.ts` files under `**/*` by default (no `allowJs`), but it's worth a note since it's a common footgun if `allowJs`/`checkJs` are ever turned on later, or if `astro check` is added to CI and starts crawling `node_modules` for `.d.ts` files unnecessarily.
**Fix:** Add `"node_modules"` explicitly to `exclude` for clarity and future-proofing: `"exclude": ["dist", "node_modules"]`.

### IN-02: `[slug].astro` has no typed `Props` interface, unlike `Layout.astro`

**File:** `src/pages/posts/[slug].astro:13` (`const { post } = Astro.props;`)
**Issue:** `Layout.astro` declares `interface Props { title: string }` before destructuring `Astro.props`, giving compile-time type safety under the project's `strict` tsconfig. `[slug].astro` destructures `Astro.props` with no `Props` interface, so `post` (and its `.data.title`, `.data.date`, `.data.tags`) is implicitly typed as `any` inside this file — strict mode doesn't catch a typo or shape change here the way it would in `Layout.astro`.
**Fix:** Declare `interface Props { post: CollectionEntry<'posts'> }` (imported from `astro:content`) before the frontmatter destructure, matching the pattern already established in `Layout.astro`.

### IN-03: Seed post excerpt uses factoring language for an elliptic-curve (discrete-log) attack

**File:** `src/content/posts/why-quantum-computers-threaten-bitcoin.md:5`
**Issue:** The frontmatter excerpt reads "Quantum computers can factor the huge numbers that keep Bitcoin public keys secret..." Bitcoin's public/private key relationship is elliptic-curve based (`Q = dP`, as the post body itself correctly explains using "elliptic curve discrete logarithm problem" language two paragraphs later). Shor's algorithm threatens Bitcoin via the discrete-log problem, not integer factorization (factorization is the RSA-style attack surface, not ECDSA). Since this project's stated core value is "ground-up rigor... nothing assumed," and the post body gets this exactly right, the excerpt's looser factoring phrasing is a real inconsistency a careful reader (or the author, once swapping in real content) will likely want cleaned up before publishing.
**Fix:** Reword the excerpt to match the body's own correct framing, e.g. "...once they're big enough to solve the elliptic-curve math problem that keeps a Bitcoin private key hidden behind its public key." (Any wording is fine as long as it doesn't imply factorization.)

### IN-04: No slug-uniqueness guard in the Content Collection schema

**File:** `src/content.config.ts:12` (`slug: z.string()`)
**Issue:** The schema requires `slug` to be a non-empty string but does not (and structurally cannot, via a single-field Zod check) enforce cross-post uniqueness. Today there are only two posts with distinct slugs, so this is currently harmless, but once more posts are added, two posts accidentally sharing a `slug` value would only surface as an opaque Astro `getStaticPaths()` duplicate-route build error rather than a clear, named validation message pointing at the offending frontmatter field.
**Fix:** Not urgent for Phase 1's two-post scope, but worth a `refine()`-based collection-level uniqueness check (or a lint script) once the content set grows past a handful of posts.

---

_Reviewed: 2026-09-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
