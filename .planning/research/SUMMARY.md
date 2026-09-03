# Project Research Summary

**Project:** Learn Me the Threat
**Domain:** Personal static Markdown+LaTeX technical blog (long-form, sequential, math-heavy explainer series), deployed to Cloudflare Pages
**Researched:** 2026-09-03
**Confidence:** HIGH

## Executive Summary

This is a text-first, minimal, single-author technical blog, the same category as learnmeabitcoin.com, but with sequential long-form posts rather than a wiki. It has no backend, no CMS, and no database: the entire system is a static site generator (SSG) that turns Markdown+LaTeX files in a git repo into static HTML, deployed via Cloudflare Pages' git integration. All four research tracks converge cleanly on a single stack decision: Astro, with `remark-math` + `rehype-katex` for build-time (not client-side) math rendering, because it is the only SSG in the comparison set with both first-class typed frontmatter (Content Collections) and a documented, non-hacky math pipeline. This is not a close call: Eleventy's KaTeX support is fragmented across competing community plugins, and Hugo requires learning a separate templating DSL, both of which work against the explicit goal of staying out of deep web-dev territory.

The recommended approach is thin and architecture-light on purpose: content lives in `src/content/blog/*.md`, validated at build time by a Zod schema (title/date/tags/excerpt), rendered through Astro's dynamic `[slug].astro` route, and deployed automatically on every `git push` via Cloudflare Pages' webhook, no manual deploy commands, no adapters, no server runtime. The main design risk is not technical failure but visual failure: "minimal" defaults to "looks unstyled" unless typography (measure/line-length, type scale, one deliberate accent font) is treated as its own explicit phase rather than an afterthought.

The two biggest technical risks, both well-documented and both cheap to prevent if addressed at the right time, are: (1) rendering math client-side instead of at build time, which adds JS weight, causes visible layout shift, and breaks the "text is the star, fast, minimal" goal, the fix is enforcing `remark-math`+`rehype-katex` from day one; and (2) Markdown's `_` emphasis parser eating LaTeX subscripts before the math plugin can claim them, which silently corrupts any formula with 2+ underscores unless verified with a "math torture test" post before real content is written. A secondary, non-technical risk cluster is Cloudflare Pages custom-domain sequencing (DNS/nameservers/SSL cert provisioning order), which is deferred until the domain is actually registered and should be handled as an explicit manual checklist, not something to design around now.

## Key Findings

### Recommended Stack

Astro (^7.3) as the SSG, with `remark-math` (^6.0.0) + `rehype-katex` (^7.0.1) + `katex` (^0.18.x) for build-time math rendering, deployed to Cloudflare Pages via git integration (no `@astrojs/cloudflare` adapter needed, this is a purely static site). No MDX, no headless CMS, no custom router.

**Core technologies:**
- Astro ^7.3 -- content-first SSG with built-in typed Content Collections and a first-class remark/rehype plugin pipeline; zero client JS unless explicitly opted in
- remark-math + rehype-katex -- parses and renders `$...$`/`$$...$$` LaTeX to static HTML **at build time**, so shipped pages contain zero runtime JS for math and no flash-of-unrendered-math
- katex (CSS + self-hosted fonts) -- required styling for rendered math; must be self-hosted from the npm package, not linked from a version-mismatched CDN
- Cloudflare Pages (git integration) -- hosting + CI/CD with zero manual deploy steps; auto-deploys on every push
- Cloudflare Web Analytics -- free, cookieless pageview analytics; opt-in per project, must be explicitly enabled

### Expected Features

**Must have (table stakes), all LOW complexity, most are near-free byproducts of frontmatter already in scope:**
- Anchor-linkable headings (stable `#id` per heading), cheapest now, very expensive to retrofit once links are shared/bookmarked
- Syntax highlighting for code blocks
- RSS/Atom feed, matches this audience's actual habits (technical readers use feed readers)
- sitemap.xml, baseline SEO for a brand-new domain with no backlinks
- Per-post meta description + Open Graph tags, determines how shared links render
- Reading time estimate
- 404 page

**Should have (differentiators):**
- Table of contents for long posts, highest-leverage differentiator for this sequential, concept-by-concept content style; depends on anchor headings being done right from day one
- Previous/Next post navigation, reinforces the "start at post one" sequential value prop
- Copy-to-clipboard on code blocks
- Footnotes/asides for jargon definitions without breaking flow

**Defer (v2+):**
- Client-side search (no value until ~15-20+ posts exist)
- Series/Topics grouping page (tags are captured now specifically so this is additive later, not a migration)
- Print/PDF stylesheet
- Comments, newsletter, web CMS, explicitly excluded anti-features (add auth surface/backend/moderation burden this project deliberately avoids)

### Architecture Approach

A single build-time pipeline with no runtime backend: Markdown files in `src/content/blog/` are validated against a Zod schema, run through Astro's Markdown pipeline (remark-math into rehype-katex), and emitted as static HTML in `dist/`, which Cloudflare Pages deploys on every git push. There is no server, no database, no client-side data fetching; every page (including the homepage list, built via `getCollection('blog')`) is fully static at build time.

**Major components:**
1. Content collection (`src/content/blog/*.md` + `config.ts` Zod schema) -- single source of truth for post content and typed frontmatter (title/date/tags/excerpt), fails the build loudly on a missing field instead of silently breaking a page
2. Layouts (`BaseLayout.astro`, `PostLayout.astro`) -- shared site chrome (nav, theme toggle, KaTeX CSS import) separated from post-specific chrome
3. Route pages (`index.astro`, `about.astro`, `posts/[slug].astro`) -- turn collection entries into actual static URLs via `getStaticPaths()`
4. Cloudflare Pages -- git-webhook-triggered build/deploy, no adapter, no manual `wrangler` commands

### Critical Pitfalls

1. **Underscore subscripts eaten by Markdown's italic parser** -- `remark-math` must claim `$...$` spans as opaque math nodes before emphasis parsing runs; verify with a "math torture test" post (`$a_{i,j} + b_{k}$`) before writing real content, not after.
2. **Client-side KaTeX rendering chosen for convenience** -- defaults to shipping a ~250KB JS bundle and a visible math "pop-in" layout shift; must use build-time rendering (`remark-math`+`rehype-katex`) so rendered `<span class="katex">` markup is already in the static HTML.
3. **KaTeX fonts linked from a CDN instead of self-hosted** -- version mismatches or CDN outages cause silently broken math styling (wrong glyphs/spacing); install `katex` as an npm dependency and serve its own `dist/fonts/`.
4. **Cloudflare custom-domain DNS added before linking the domain in the Pages dashboard** -- the natural order (DNS first) is backwards for Cloudflare Pages; always add the Custom Domain in the Pages project first, deferred until the domain is actually registered.
5. **"Minimal" design defaults to "unstyled template" without a deliberate typographic system** -- no type scale, no measure constraint, no distinct accent font reads as an unfinished markdown dump rather than intentional minimalism; needs its own explicit design-review phase.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Scaffolding & Core Content Pipeline
**Rationale:** Everything else depends on the content model (schema, math rendering) existing and being verified correct before real content or visual design work begins. This is also where the two highest-cost-to-retrofit decisions (build-time math rendering, anchor-linkable heading IDs) must be locked in.
**Delivers:** Astro project scaffolded, Content Collections schema (title/date/tags/excerpt) defined, remark-math/rehype-katex wired up and validated with a "math torture test" post, anchor-linkable headings enabled (rehype-slug or equivalent), homepage + about + post route pages rendering plain unstyled content correctly.
**Addresses:** Homepage listing, /about page, post pages at clean URLs, tag/category frontmatter, anchor-linkable headings, syntax highlighting (all table-stakes features from FEATURES.md).
**Avoids:** Pitfall 1 (underscore mangling), Pitfall 2 (client-side KaTeX), Pitfall 3 (unhosted KaTeX fonts).

### Phase 2: Visual Design & Theming
**Rationale:** Research strongly flags that skipping deliberate design work is the most likely source of a disappointing outcome even when the technical stack is correct. This must be its own explicit phase with a review checkpoint, not bundled into scaffolding.
**Delivers:** Type scale, line-length/measure constraint, one deliberate accent font (monospace or serif per PROJECT.md), light/dark theme toggle with CSS custom properties shared across body text/KaTeX/code blocks, persisted theme preference via localStorage with a blocking inline script to avoid theme-flash.
**Uses:** Astro's vanilla JS/CSS toggle pattern (no themed starter, hand-built per STACK.md's alternatives analysis).
**Implements:** `ThemeToggle.astro` component, `global.css` design tokens.
**Avoids:** Pitfall 7 (generic/unstyled look), Pitfall 8 (dark mode breaking math/code contrast).

### Phase 3: Discovery & Distribution Polish
**Rationale:** These are near-zero-marginal-cost additions once frontmatter and the post collection already exist (Phase 1), cheapest to batch together since they all consume the same data, and they're expected-by-convention for this specific audience (technical readers who use RSS, share links on X/Discord, and rely on search engines with no existing backlink profile).
**Delivers:** RSS/Atom feed, sitemap.xml, per-post OG/meta tags, reading time estimate, custom 404 page.
**Addresses:** RSS feed, sitemap.xml, OG/meta tags, reading time, 404 page (table-stakes features from FEATURES.md).

### Phase 4: Deployment & Custom Domain
**Rationale:** Deploy-to-`*.pages.dev` and custom-domain attachment are sequentially and causally separate steps per PITFALLS.md, combining them risks misdiagnosing a DNS/nameserver issue as a broken deploy. Domain registration is external to this project's control and explicitly deferred in PROJECT.md, so this phase's custom-domain portion may need to wait on a manual purchase step outside Claude's control.
**Delivers:** Cloudflare Pages project connected via GitHub git integration, confirmed working at `*.pages.dev`, Cloudflare Web Analytics enabled, and (once the domain is registered) an explicit checklist for nameserver change into Custom Domain attachment into SSL provisioning wait, executed in that order.
**Avoids:** Pitfall 4 (DNS-before-dashboard-link ordering), Pitfall 5 (registrar/nameserver mismatch), Pitfall 6 (SSL provisioning lag mistaken for a broken deploy).

### Phase Ordering Rationale

- Content pipeline first because it's the foundation every other phase's output depends on, and because the two hardest-to-retrofit decisions (build-time math rendering, heading anchor IDs) live here, get them right before any content or design investment compounds on top of them.
- Visual design is deliberately separated from scaffolding rather than folded in, because research explicitly flags "skipped design because it's minimal" as the most likely failure mode for this project, it deserves its own review checkpoint.
- Discovery/distribution features (RSS, sitemap, OG tags) are grouped together because they share a single data dependency (post frontmatter) already established in Phase 1, implementing them together avoids revisiting the same data model three separate times.
- Deployment/custom-domain is last and explicitly split into "get `*.pages.dev` working" vs. "attach custom domain" sub-steps, since research shows conflating these two causes the most commonly reported Cloudflare Pages failure mode.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Custom Domain):** Domain isn't registered yet; exact registrar/nameserver steps depend on which registrar is chosen later, flag for `--research-phase` if/when domain purchase becomes imminent, since propagation timing and registrar-specific UI details will need re-verification at that time.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffolding):** Astro Content Collections + remark-math/rehype-katex is a well-documented, current, official-docs-verified pattern (HIGH confidence).
- **Phase 2 (Design):** No framework-specific research needed, this is CSS/typography craft, not a tooling decision.
- **Phase 3 (Discovery/Distribution):** RSS/sitemap/OG tags via `@astrojs/rss`/`@astrojs/sitemap` are standard, well-documented Astro integrations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core recommendation (Astro + remark-math/rehype-katex) verified against official docs and cross-referenced across independent sources; exact micro-versions flagged MEDIUM since this is a fast-moving ecosystem (verify at install time) |
| Features | MEDIUM-HIGH | Grounded in well-established SSG/technical-blog conventions; direct competitor audit of learnmeabitcoin.com was blocked (403), so competitor-specific claims are general knowledge, not a live audit, flagged for manual spot-check |
| Architecture | HIGH | Cloudflare Pages git-integration behavior and Astro Content Collections verified against current official docs |
| Pitfalls | MEDIUM-HIGH | KaTeX/Markdown parsing issues and Cloudflare DNS issues are well-documented across multiple independent sources; design pitfalls (generic-look risk) are more subjective, LOW-MEDIUM confidence, treated as design-review heuristics |

**Overall confidence:** HIGH

### Gaps to Address

- Astro 6 into 7 markdown pipeline default behavior: one community report flags that Astro 7 changed default Markdown processor behavior in a way that might affect custom remark/rehype plugin pickup, verify against current Astro docs at Phase 1 implementation time, not assumed from this research.
- Competitor feature analysis (learnmeabitcoin.com) is unverified due to a blocked fetch (403), worth a manual spot-check by the user before finalizing IA/navigation decisions, though the confirmed scope (flat homepage, not a wiki-style sidebar) already appears correctly differentiated by content shape.
- Domain registrar has not been chosen yet, Phase 4's exact nameserver-change steps are registrar-UI-specific and should be re-verified once a registrar is selected.

## Sources

### Primary (HIGH confidence)
- https://docs.astro.build/en/guides/markdown-content/ -- Astro Markdown pipeline
- https://docs.astro.build/en/guides/content-collections/ -- Content Collections
- https://astro.build/blog/introducing-content-collections/ -- confirms collection entries require explicit route pages
- https://developers.cloudflare.com/pages/configuration/git-integration/ -- git-integration webhook behavior
- https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/ -- Astro build preset (`npm run build` / `dist`)
- https://developers.cloudflare.com/pages/configuration/custom-domains/ -- Custom Domains official docs
- https://developers.cloudflare.com/web-analytics/about/ -- cookieless, opt-in analytics
- https://katex.org/docs/browser -- KaTeX font-display defaults

### Secondary (MEDIUM confidence)
- https://github.com/remarkjs/remark-math , https://www.npmjs.com/package/rehype-katex -- standard Astro math integration
- https://github.com/orgs/community/discussions/17384 , https://github.com/markdown-it/markdown-it/issues/404 -- underscore/subscript emphasis-parser conflict, cross-platform confirmation
- https://community.cloudflare.com/t/cloudflare-pages-with-custom-cloudflare-registrar-domain/518154 -- registrar/nameserver mismatch pattern
- https://gautamkhorana.com/blog/static-site-generators-2026-astro-eleventy-hugo-jekyll-gatsby/ , https://hygraph.com/blog/top-12-ssgs -- SSG comparison landscape

### Tertiary (LOW confidence)
- learnmeabitcoin.com competitor feature claims -- general knowledge only, direct fetch blocked (403), needs manual spot-check
- Design pitfalls (generic template look) -- synthesized from general typographic best practices, not domain-specific sourcing

---
*Research completed: 2026-09-03*
*Ready for roadmap: yes*
