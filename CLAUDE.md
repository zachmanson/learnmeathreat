<!-- GSD:project-start source:PROJECT.md -->
## Project

**Learn Me a Threat**

A personal blog (learnmeathreat.com) publishing a rigorous, self-contained explainer series on quantum computing threats to cryptocurrencies, starting with Bitcoin. Written in the style of learnmeabitcoin.com: casual tone, ground-up rigor, no prior knowledge assumed — every concept is explained before it's used. The user writes rough drafts (Markdown + LaTeX), Claude helps clean them into polished posts.

**Core Value:** A reader with zero background can start at post one and, post by post, actually understand how quantum computing threatens Bitcoin — every concept explained before it's used, math rendered properly, nothing assumed.

### Constraints

- **Budget**: Effectively $0 for hosting — must use a free static hosting tier (Cloudflare Pages chosen). Domain registration is a separate, small, one-time-ish cost the user will handle themselves.
- **Tech stack**: Must support Markdown authoring with LaTeX math rendering (KaTeX) out of the box or via well-established plugins; must build to static output deployable on Cloudflare Pages.
- **Maintainability**: User doesn't want to maintain custom app code beyond what's needed — favor a static site generator with strong Markdown/math support over a hand-rolled framework app.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Astro | ^7.3 | Static site generator / build tool | Astro is a **content-first** SSG: it ships with built-in Content Collections (typed frontmatter via Zod schemas), zero-JS-by-default output, and native Markdown processing built on the same remark/rehype pipeline the rest of the JS ecosystem uses. That means "plug in a remark/rehype plugin" is a first-class, documented workflow rather than a hack. It outputs plain static HTML/CSS with no client JS unless you opt in — matches "hand-built," not "framework app." It has by far the largest 2025/2026 mindshare for exactly this use case (markdown blogs), so troubleshooting help is easy to find. |
| Node.js | ^20 LTS or ^22 LTS | Build-time runtime | Required to run Astro's build. Not part of the deployed site — Cloudflare Pages serves static output only. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| remark-math | ^6.0.0 | Parses `$...$` / `$$...$$` LaTeX syntax in Markdown into a math AST node | Add to `markdown.remarkPlugins` in `astro.config.mjs`. This is the standard, maintained-by-unified-collective plugin every other math-in-markdown solution (Docusaurus, MDX, Eleventy via markdown-it) is built on top of. |
| rehype-katex | ^7.0.1 | Renders the math AST nodes from remark-math into KaTeX HTML at **build time** | Add to `markdown.rehypePlugins`. Because rendering happens at build time (not client-side), there's no flash-of-unrendered-math and no runtime JS needed for math — good fit for a static, zero-JS-by-default site. |
| katex | ^0.18.x | The actual math typesetting engine + required CSS | You still need to include KaTeX's CSS stylesheet (via CDN link or `import` into your layout) for the rendered math to be styled correctly. This is the one step people forget and it's the #1 cause of "math shows as raw text/garbled" bug reports. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Content Collections (`src/content.config.ts`) | Typed schema for post frontmatter (title, date, tags, excerpt) | Define a Zod schema once — e.g. `tags: z.array(z.string())`. This gets you frontmatter *validation* for free: if you or Claude typo a field, the build fails loudly instead of silently rendering a broken post. This directly serves the "tag/category frontmatter" requirement without any custom code. |
| Astro's file-based routing | Clean URLs (`/posts/slug/`) | Drop a `src/pages/posts/[slug].astro` dynamic route that reads from the content collection, or use Astro's built-in Content Collections + `getStaticPaths()`. No custom router, no `.html` extensions leaking into URLs — this is Astro's default behavior, not something you configure. |
| Cloudflare Pages (Git integration) | Hosting + CI/CD | Connect the GitHub repo, set build command `npm run build`, output directory `dist`. Every `git push` auto-deploys. No Cloudflare-specific adapter needed for a purely static site — the adapter (`@astrojs/cloudflare`) is only required for SSR/server rendering, which this project does not need. |
| Cloudflare Web Analytics | Cookieless pageview analytics | Free, no account/DNS changes needed beyond adding one `<script>` beacon tag (or toggling it on in the CF dashboard if the domain is already on Cloudflare). No cookies, no consent banner needed — matches the "privacy-friendly, cookieless" requirement exactly. |
## Installation
# Scaffold the project (interactive; choose "Empty"/minimal template, TypeScript strict optional)
# Core math pipeline
# No dev-only tooling required beyond what `npm create astro` scaffolds
# (Astro's CLI already sets up TypeScript config and the dev server)
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Astro | Eleventy (11ty) | Eleventy is a strong choice if you're allergic to any npm/build-tool ecosystem and want the absolute minimum abstraction (it's closer to "just a template engine over files"). But its KaTeX story is **not standardized** — the search landscape shows multiple competing approaches (markdown-it-katex, @mdit/plugin-katex, hand-rolled filters using `katex.renderToString`), several blog posts each documenting a different homegrown method. That's a signal of *missing* out-of-the-box support, meaning more decisions and more custom glue code land on you — directly against the "don't want this to become a web-dev exercise" constraint. Content Collections/typed frontmatter also doesn't exist in Eleventy; you'd validate tags manually or not at all. |
| Astro | Hugo | Hugo is extremely fast and has zero Node.js dependency (single Go binary), which is appealing for a "just works" static build. As of Hugo 0.122+, there's first-class render-hook support for wiring up KaTeX without a third-party module — genuinely good. However: Hugo's templating language (Go templates) is its own DSL with a steeper learning curve than plain component files, its docs/ecosystem assume more "Hugo-specific" knowledge (shortcodes, `_index.md` conventions, layout lookup order) than Astro's plain-file-and-frontmatter model, and Cloudflare Pages' Hugo support requires pinning a `HUGO_VERSION` env var correctly or builds silently use a stale default. For a physics-background dev who explicitly does not want deep web-dev investment, Astro's "it's mostly just HTML/Markdown with occasional JS you can ignore" model has a gentler surface than learning a bespoke templating language. |
| Astro's built-in dev-time light/dark toggle (vanilla JS + CSS class + localStorage) | A themed starter template (e.g. AstroPaper, Astro Cactus) with built-in dark mode | These themes give you dark mode "for free," but they also give you a large amount of pre-built CSS/JS/layout you didn't write and now have to fight or strip out to hit the "no templated feel, hand-built aesthetic" requirement. Since Astro's official tutorial shows the full toggle implementation is a small `ThemeIcon.astro` component + a `.dark` CSS class + ~15 lines of inline script, hand-rolling it is *less* total work than adopting and de-templating a themed starter. Use a themed starter only if visual "hand-built" distinctiveness stops mattering and speed-to-ship becomes the only priority. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|--------------|
| MathJax (client-side) | Renders in the browser after page load, causing a visible "flash of unrendered math" (raw `$...$` text briefly visible), and ships a heavier JS runtime than KaTeX. KaTeX is faster and, critically, can render at **build time** with rehype-katex so the shipped HTML already contains the final math markup — zero runtime JS cost. | KaTeX via remark-math + rehype-katex (build-time rendering) |
| `@astrojs/cloudflare` adapter | This adapter enables Astro SSR (server-rendered pages via Cloudflare Workers/Pages Functions). It solves a problem this project doesn't have — there's no dynamic/server-rendered content, everything is static Markdown known at build time. Adding it adds config complexity, a Workers runtime mental model, and (per recent Cloudflare Pages+adapter deprecation churn found in research) migration risk, for zero benefit. | Deploy Astro's static `dist/` output directly to Cloudflare Pages via Git integration — no adapter |
| A headless CMS or web-based Markdown editor (e.g. Decap CMS, TinaCMS) | Explicitly out of scope per PROJECT.md — adds an auth surface, a second admin UI, and a build/deploy dependency graph to maintain, for a workflow (local files + git) the user already prefers and finds simpler. | Edit `.md` files directly in the repo with any text editor; commit via git |
| A themed "blog-in-a-box" Astro starter as the base (rather than building from Astro's minimal/empty template) | Fighting a pre-built theme's opinionated CSS/component structure to achieve a distinctive "hand-built" look is more total effort than starting minimal and adding only what's needed. It also risks importing dependencies/config you don't understand and can't maintain — bad fit for someone who wants to stay out of deep web-dev territory. | Start from `npm create astro@latest` minimal/empty template; add Content Collections, the KaTeX pipeline, and a small custom layout by hand |
| markdown-it-katex / hand-rolled `katex.renderToString` filters (the Eleventy-world approaches) | These are community-maintained, less standardized, and require writing your own filter/transform glue code — more custom code than the Astro path, which is a documented first-class integration point. | If not using Astro: still prefer the most-starred, actively maintained plugin, but be aware this is inherently more DIY than the Astro route |
## Stack Patterns by Variant
- Use Astro's Content Collections query API (`getCollection('posts')` + `.filter()` on the `tags` field) to build a tag-index page.
- Because the tag frontmatter schema is already defined via Zod from day one, no data migration is needed later — the grouping page is purely additive.
- Cloudflare Pages supports adding a custom domain from the Pages project's "Custom domains" tab once the domain (learnmeathreat.com) is registered and its DNS is on Cloudflare (or a CNAME is pointed at the `*.pages.dev` deployment).
- No stack change required — this is a hosting-config step, not a code step.
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| astro@^7.3 | remark-math@^6.0.0, rehype-katex@^7.0.1 | Astro 7 uses Vite + its own remark/rehype pipeline by default for `.md` files (note: Astro 7 introduced a new default Markdown processor; per community upgrade reports, projects that need the classic remark/rehype plugin pipeline should keep/set `@astrojs/markdown-remark` explicitly if the default doesn't pick up custom plugins as expected — verify against the current Astro 7 docs at implementation time, this is a MEDIUM-confidence detail since it reflects a mid-2026 changelog item, not long-settled behavior). |
| katex@^0.18.x | rehype-katex@^7.0.1 | rehype-katex bundles/depends on a specific katex range; let npm resolve it rather than pinning katex manually to avoid a duplicate-version mismatch. |
| Node.js ^20 LTS / ^22 LTS | astro@^7.3 | Astro's current major version requires a current Node LTS; check `npm create astro@latest`'s own engine check at scaffold time — it will refuse to run on an unsupported Node version rather than fail silently. |
## Sources
- WebSearch, verified against multiple independent posts (MEDIUM-HIGH confidence): remark-math + rehype-katex as the standard Astro markdown-math integration — https://github.com/remarkjs/remark-math , https://www.npmjs.com/package/rehype-katex , https://www.byteli.com/blog/2024/math_in_astro/
- WebSearch (MEDIUM confidence, single real-world large-blog report): Astro 6→7 upgrade behavior re: remark/rehype pipeline defaults — https://lilting.ch/en/articles/astro-6-to-7-upgrade — flagged in Version Compatibility above as needing verification at implementation time.
- Official Astro docs (HIGH confidence): Cloudflare deploy guide, static vs SSR/adapter distinction — https://docs.astro.build/en/guides/deploy/cloudflare/ , https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/
- Official Astro tutorial (HIGH confidence): vanilla JS/CSS light-dark theme toggle pattern — https://docs.astro.build/en/tutorial/6-islands/2/
- WebSearch, cross-referenced (MEDIUM confidence): Eleventy's KaTeX integration landscape is fragmented across multiple competing community approaches, no single first-class plugin — https://ben.page/eleventy-katex , https://github.com/11ty/eleventy/issues/1318 , https://www.11ty.dev/docs/languages/markdown/
- WebSearch, cross-referenced (MEDIUM confidence): Hugo 0.122+ render-hook KaTeX support exists and is solid, but templating DSL is a steeper/different learning curve — https://hugomods.com/docs/content/katex/ , https://www.arj.no/2026/01/01/katex-setup/
- Official Cloudflare docs (HIGH confidence): Web Analytics is free, cookieless, no fingerprinting — https://developers.cloudflare.com/web-analytics/about/ , https://developers.cloudflare.com/pages/how-to/web-analytics/
- WebSearch, cross-referenced (MEDIUM confidence): Cloudflare Pages is not deprecated but Cloudflare's new investment is Workers-first; Pages remains fully functional for static Git-deploy sites, which is this project's use case — https://developers.cloudflare.com/workers/configuration/sites/ , https://dev.to/rickcogley/cloudflare-pages-vs-workers-in-2026-migration-guide-ka7
- npm registry (HIGH confidence, checked live): current published versions of astro, remark-math, rehype-katex, katex, @astrojs/mdx
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
