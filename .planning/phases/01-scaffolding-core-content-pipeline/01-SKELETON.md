# Walking Skeleton — Learn Me the Threat

**Phase:** 1 (01-scaffolding-core-content-pipeline)
**Generated:** 2026-09-03

## Capability Proven End-to-End

A reader can land on the homepage, see the published post listed with its title and excerpt, click through to `/posts/why-quantum-computers-threaten-bitcoin/`, and read it with LaTeX math typeset, headings individually linkable, and code syntax-highlighted — all served as static HTML with zero client-side JavaScript.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Astro 7.3.x, `output: 'static'`, no adapter | Content-first SSG with first-class Markdown and typed Content Collections; ships zero JS by default, matching the "hand-built, text is the star" constraint in PROJECT.md. No adapter because there is no SSR — `@astrojs/cloudflare` solves a problem this project does not have. |
| Markdown processor | `markdown.processor: unified(...)` from `@astrojs/markdown-remark` | Astro 7's new default processor (Sätteri, Rust-based) does not execute remark/rehype plugins, and does so **silently** — the build succeeds and emits raw `$...$` text. Opting back into the unified pipeline is the documented first-party path and keeps the mature remark-math/rehype-katex ecosystem. Sätteri-native math plugins exist but are weeks old with single maintainers. |
| Math rendering | remark-math → rehype-katex, build-time, KaTeX CSS imported in the Layout | Build-time rendering means the shipped HTML already contains final math markup: no flash of unrendered LaTeX, no runtime JS. The CSS import is mandatory, not decorative — without it KaTeX output renders as overlapping garbage. |
| Heading anchors | rehype-slug → rehype-autolink-headings, in that order | Astro injects its own heading IDs only *after* custom rehype plugins run, so autolink-headings finds no IDs unless rehype-slug precedes it in the same pipeline. Both use `github-slugger`, so IDs match Astro's own slugging exactly. |
| Syntax highlighting | Astro's built-in Shiki, build-time | Already the default; zero extra packages, zero client JS, no flash of unhighlighted code. |
| Data layer | Local Markdown files under `src/content/posts/`, read via Content Collections `glob()` loader with a Zod schema | There is no database and no backend by explicit project constraint. Git is the storage layer and Zod is the validation layer — bad frontmatter fails the build loudly instead of rendering `undefined`. |
| URL source of truth | Explicit `slug` field in frontmatter, never the filename-derived `id` | URLs survive file renames (D-05). The `glob()` loader defaults `id` to the filename, so the dynamic route must read `post.data.slug` explicitly. |
| Draft workflow | `draft: true` boolean in the same `posts` collection; drafts excluded from `getStaticPaths()` entirely | One collection, one folder, one flag (D-03). Drafts are fully unbuilt rather than merely unlisted — simpler and more defensible than a hidden-but-reachable URL. Revisit if the user ever wants shareable preview links. |
| Auth | None, and none planned | Read-only content site. No CMS, no admin UI, no user input, no forms (explicit PROJECT.md decision). |
| Deployment target | Cloudflare Pages static Git deploy (Phase 4) — Phase 1 proves the stack via `npm run build && npx astro preview` | Free tier, auto-deploy on push, no adapter needed for static output. Phase 1 deliberately stops at a documented local full-stack run command; wiring the hosting account is Phase 4's slice. |
| Directory layout | `src/content/posts/`, `src/content.config.ts`, `src/layouts/`, `src/pages/`, `src/styles/`, `tests/` | Astro's documented conventional structure. Flat and small enough that feature-folders would be overhead at this scale. |
| Styling | Two hand-written stylesheets: `global.css` (tokens, typography, nav, layout) and `prose.css` (math, anchors, code) | No CSS framework, no component library, no themed starter — all rejected in PROJECT.md and the UI-SPEC. Design tokens live as CSS custom properties so Phase 2 can add a dark theme by redefining values, not by rewriting rules. |
| Test approach | `node --test` over `tests/*.test.mjs`, asserting against built `dist/` HTML | No test-framework dependency. Asserting on build *output* rather than source is the only way to catch the silent-failure modes that matter here — a green `astro build` does not prove math rendered. |

## Stack Touched in Phase 1

- [x] Project scaffold — Astro 7 minimal template, TypeScript strict, `npm test` script
- [x] Routing — three real routes: `/`, `/about/`, and the dynamic `/posts/[slug]/`
- [x] Data layer — one real read: Content Collections `getCollection('posts')` with Zod-validated frontmatter driving both the homepage list and the post route. (There is no write path; this project has no database by design, so "one real read" is the full extent of the data tier.)
- [x] UI — a real interaction wired to real data: clicking a post title on the homepage navigates to that post's page, and hovering/focusing a heading reveals a working fragment anchor
- [x] Deployment — documented local full-stack run: `npm run build && npx astro preview`. Hosting is Phase 4.

## Out of Scope (Deferred to Later Slices)

Explicitly not in the skeleton. This list exists so later phases do not relitigate Phase 1's minimalism.

- Dark mode / light-dark toggle, custom accent webfont, mobile-tuned layout → **Phase 2** (DSGN-01..04)
- RSS/Atom feed, `sitemap.xml`, Open Graph and meta description tags, reading time, custom 404 page → **Phase 3** (DISC-01..03, CONT-05, PAGE-05)
- Cloudflare Pages hosting, Web Analytics beacon, custom-domain attachment docs → **Phase 4** (DEPL-01..03, ANLY-01)
- Tag taxonomy lock (Zod enum instead of freeform strings), Series/Topics page → **v2 backlog** (GROW-01), deferred in CONTEXT.md
- Table of contents, prev/next post navigation, copy-to-clipboard on code blocks, print stylesheet, client-side search → **v2 backlog** (NAV-01/02, POLSH-01/02, GROW-02)
- MDX (`@astrojs/mdx`), any component library, any icon library, any CSS framework, any client-side JS
- Real post content and real About copy — the user supplies both later; Phase 1 ships deliberately throwaway placeholder content whose only job is exercising the pipeline

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering the architectural decisions above.

- **Phase 2:** A reader can read the site comfortably on a phone, in the dark, with headers in a distinct accent font — layered onto the same Layout and the same CSS custom properties, no structural change.
- **Phase 3:** A reader can subscribe via a feed reader, find the site via search, and share a post link that previews correctly — all driven off the same `posts` collection and the same frontmatter fields defined here.
- **Phase 4:** Anyone on the internet can reach the site at a public URL that updates on every `git push`, with cookieless pageview analytics — deploying the same static `dist/` output this skeleton already produces.
