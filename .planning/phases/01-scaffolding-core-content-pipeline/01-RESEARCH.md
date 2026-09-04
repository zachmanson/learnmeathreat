# Phase 1: Scaffolding & Core Content Pipeline - Research

**Researched:** 2026-09-03
**Domain:** Astro 7 static site generation, Content Collections, build-time Markdown/LaTeX/syntax-highlighting pipeline
**Confidence:** HIGH (core stack, wiring, versions all verified against official docs/GitHub source and live npm registry) / MEDIUM on one open question (see Open Questions)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Seed content**
- **D-01:** No real draft exists yet. Claude writes a short placeholder post with real LaTeX math (inline and block) and at least one heading, purely to prove the build pipeline end-to-end. This will be swapped for real content later.
- **D-02:** Only 1 post is needed to satisfy Phase 1's success criteria — homepage list + single post page. Multi-item list visuals (spacing between several items) are not required to be proven this phase.
- **D-03:** Draft/unpublished workflow uses a `draft: true` boolean field in frontmatter, in the same `posts` content collection (not a separate folder). Build-time filtering hides draft posts from the homepage list until the flag is flipped. The Content Collections Zod schema must include this field.

**Frontmatter schema**
- **D-04:** Tags are **freeform strings** (`z.array(z.string())`), not a locked Zod enum. The user explicitly does not want a fixed taxonomy yet — they don't know full topic coverage. Do not lock categories in this phase; revisit if/when the Series/Topics page (deferred, v2 GROW-01) gets built.
- **D-05:** Post slugs come from an **explicit `slug` field in frontmatter**, not derived from the filename. This means the URL survives file renames. The Zod schema needs a required `slug: z.string()` field, and the dynamic route (`src/pages/posts/[slug].astro` or equivalent) must key off this field, not the collection entry's filename-derived `id`.
- **D-06:** The placeholder post's slug should be thematically appropriate (quantum/Bitcoin-related, e.g. something like `why-quantum-computers-threaten-bitcoin`) rather than a generic "hello world" — exact wording left to Claude's discretion.
- **D-07:** The placeholder post's tag can be any reasonable string (e.g. "Quantum Algorithms") since it's expected to be swapped out with the real taxonomy later — exact value is Claude's discretion.

**About page**
- **D-08:** Claude writes placeholder About page copy — generic for now (physics background, writing about quantum threats to Bitcoin, no specific credentials/details). The user will write and drop in their own real copy later; Claude just needs to wire up the `/about` route and page so PAGE-03 is functionally satisfied.

### Claude's Discretion
- Exact wording/content of the placeholder post (title, body text, headings) beyond having real LaTeX math and a thematically appropriate slug.
- Exact wording of the placeholder About page copy, kept generic per D-08.
- Content Collections schema details not explicitly decided above (e.g., date field format, excerpt field type/length) — standard Zod schema patterns apply.
- Anchor-link ID generation scheme for headings (CONT-03) — standard kebab-case slugification.

### Deferred Ideas (OUT OF SCOPE)
- Tag taxonomy lock (fixed Zod enum for tags) — deferred until the user has enough posts to know what categories actually make sense. Revisit alongside the Series/Topics page (v2 GROW-01, currently out of scope for the whole v1 roadmap).
- Real About page copy and real first post content — user will supply both later; Phase 1 only needs the plumbing (routes, schema, rendering) to work with placeholder content.

**Design contract:** `.planning/phases/01-scaffolding-core-content-pipeline/01-UI-SPEC.md` locks Phase 1's visual/interaction contract — system-font-only typography (no custom webfont, DSGN-02 accent font is Phase 2), single light-only color surface (DSGN-03 dark mode is Phase 2), spacing scale, heading-anchor hover behavior, Shiki syntax highlighting via Astro's built-in integration, nav layout, and homepage post-list layout. Do not introduce dark mode, custom fonts, or icon libraries in this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------------|
| CONT-01 | Posts are authored as local Markdown files with frontmatter (title, date, tags, excerpt) | Content Collections `glob()` loader + Zod schema (Pattern 2); Package Legitimacy Audit confirms `astro` itself |
| CONT-02 | Inline/block LaTeX math renders as typeset equations at build time, no client-side flash | Pattern 1 (`unified()` processor wiring for remark-math + rehype-katex); Pitfall 2 (why pre-Astro-7 tutorials break) |
| CONT-03 | Every heading gets a stable, clickable anchor link | Pattern 1 (rehype-slug + rehype-autolink-headings, ordered correctly); Pitfall 1 (plugin ordering) |
| CONT-04 | Code blocks render with syntax highlighting | Astro's built-in Shiki integration (Standard Stack summary; State of the Art table) — no extra package needed |
| PAGE-01 | Homepage lists all posts in reverse-chronological order, title + excerpt | Code Examples: homepage post list pattern; Pitfall 4 (`z.coerce.date()` for correct sorting) |
| PAGE-02 | Each post has its own page at a clean URL | Pattern 2 (`[slug].astro` dynamic route keyed on `data.slug`); Code Examples (trailing-slash URL note, A2) |
| PAGE-03 | Static `/about` page with user-authored content | Recommended Project Structure (`src/pages/about.astro`) — plain static page, no collection needed |
| PAGE-04 | Top nav shows Home and About, present on every page | Recommended Project Structure (`Layout.astro`/`Nav.astro`); Architectural Responsibility Map |
</phase_requirements>


## Summary

Astro 7 changed its default Markdown/MDX processor from the classic remark/rehype (unified) pipeline to a new Rust-based processor called **Sätteri**. This is the single most important finding for this phase: the tech stack decisions already locked in PROJECT.md (`remark-math` + `rehype-katex`) are unified-ecosystem plugins, and **they will silently not run** under Astro 7's new default processor. To use them, the phase must explicitly install `@astrojs/markdown-remark` and opt back into the legacy `unified()` processor via a `processor:` config key — the old top-level `markdown.remarkPlugins` / `markdown.rehypePlugins` keys are deprecated and, per the GitHub source, non-functional without this opt-in package. This is a config-shape change, not a plugin-choice change — remark-math/rehype-katex remain the right plugins, they just need to be wired differently than pre-Astro-7 tutorials show.

Astro's Content Collections API (stable since Astro 5, unchanged in shape through 7.3) uses `src/content.config.ts` with `defineCollection()` + the `glob()` loader for Markdown files, and Zod for schema validation. Heading IDs are auto-injected by Astro itself (via `github-slugger`, the same library `rehype-slug` uses) — so `rehype-slug` is not strictly required for IDs to exist, but it is still needed in the custom pipeline to guarantee headings have IDs *before* `rehype-autolink-headings` runs (plugin ordering matters — see Pitfall 1). Shiki syntax highlighting is Astro's built-in default and requires no additional package.

All 8 packages this phase would install (astro, remark-math, rehype-katex, katex, rehype-slug, rehype-autolink-headings, @astrojs/markdown-remark, @astrojs/mdx) passed a `slopcheck` legitimacy scan against the **npm** registry (verify the correct ecosystem — a first pass against PyPI incorrectly flagged all of them as hallucinated, which is expected and is exactly the cross-ecosystem-confusion trap the audit protocol warns about).

**Primary recommendation:** Scaffold with `npm create astro@latest` (minimal template), then explicitly install and configure `@astrojs/markdown-remark`'s `unified()` processor with `remark-math` → `rehype-katex` → `rehype-slug` → `rehype-autolink-headings` in that plugin order, and use Content Collections with the `glob()` loader keyed on frontmatter `slug`, not filename `id`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Content authoring & schema validation (CONT-01) | Build (Astro Content Collections, build-time) | — | Zod schema validation happens during `astro build`/`astro dev` content sync, not at runtime — there is no server to validate against |
| Math rendering (CONT-02) | Build (remark-math + rehype-katex via unified processor) | — | Must render to final HTML at build time per explicit requirement (no client JS, no rendering flash) |
| Heading anchors (CONT-03) | Build (rehype-slug + rehype-autolink-headings) | Browser/Client (CSS `:hover`/`:focus` reveal of the `#` glyph, per UI-SPEC) | ID/link generation is static HTML at build time; the hover-reveal interaction is pure CSS, no JS needed |
| Syntax highlighting (CONT-04) | Build (Astro's built-in Shiki integration) | — | Shiki tokenizes and inlines styles at build time; ships zero client JS |
| Homepage post list (PAGE-01) | Build (Astro static route reading Content Collections) | CDN/Static (served as pre-rendered HTML) | No runtime query — list is fully known at build time |
| Post pages (PAGE-02) | Build (dynamic `getStaticPaths()` route) | CDN/Static | Static-path generation at build time produces one HTML file per post |
| About page (PAGE-03) | Build (static `.astro` page) | CDN/Static | Plain static content, no collection needed |
| Top nav (PAGE-04) | Browser/Client (shared layout markup) | CDN/Static | Rendered once per page at build time; no client-side routing/JS needed for a 2-link nav |

**No API/Backend or Database/Storage tier exists in this project** — local Markdown files under version control are the only "storage," read directly by the Astro build process. This is consistent with PROJECT.md's explicit "no backend, no CMS" constraint.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 7.3.1 [VERIFIED: npm registry] | Static site generator / build tool | Locked in PROJECT.md; largest 2025/2026 mindshare for Markdown-first static blogs |
| @astrojs/markdown-remark | 7.3.0 [VERIFIED: npm registry] | Restores the legacy unified/remark/rehype Markdown pipeline in Astro 7, since the new default (Sätteri) does not run remark/rehype plugins | [CITED: docs.astro.build/en/guides/markdown-content/, github.com/withastro/astro commit f732f3c] — Astro 7 made Sätteri (Rust-based) the default processor; this package is the documented, first-party way to opt back into `unified()` for existing remark/rehype plugins |
| remark-math | 6.0.0 [VERIFIED: npm registry] | Parses `$...$` / `$$...$$` into a math AST node | Standard, unified-collective-maintained plugin; unchanged shape from pre-Astro-7 usage |
| rehype-katex | 7.0.1 [VERIFIED: npm registry] | Renders math AST into KaTeX HTML at build time | Standard pairing with remark-math; renders before HTML is emitted, satisfying "no client-side rendering flash" (CONT-02) |
| katex | 0.18.5 [VERIFIED: npm registry] | Math typesetting engine + CSS | Required peer for rehype-katex's output to render correctly; let npm resolve the exact version rather than pinning manually |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rehype-slug | 6.0.0 [VERIFIED: npm registry] | Injects `id` attributes on headings using `github-slugger` | Add explicitly to the custom pipeline **before** rehype-autolink-headings — see Pitfall 1. Astro also auto-injects IDs after custom plugins run, but that happens too late for autolink-headings to find them |
| rehype-autolink-headings | 7.1.0 [VERIFIED: npm registry] | Generates the clickable anchor link/glyph on each heading | Needed to satisfy CONT-03's "stable, clickable anchor link" and the UI-SPEC's hover-reveal `#` glyph — Astro's own heading-ID injection does NOT include a clickable link, only the bare `id` attribute [CITED: docs.astro.build/en/guides/markdown-content/] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@astrojs/markdown-remark`'s `unified()` opt-in | Migrate to native Sätteri (`@astrojs/markdown-satteri`) + Sätteri-native math plugin | Sätteri is Astro 7's new default and is faster, but its plugin ecosystem is brand new (weeks old as of this research) — e.g. `@nullpinter/satteri-katex` exists on npm but was published within the last month with a single maintainer and no track record. Given this project's "don't want a web-dev exercise" constraint and the already-locked remark-math/rehype-katex decision in PROJECT.md, staying on the proven unified pipeline via `@astrojs/markdown-remark` is the safer, lower-maintenance choice for now. Revisit only if Sätteri's plugin ecosystem matures and a compelling reason to switch (e.g. build-speed pain) emerges. |
| `rehype-slug` + `rehype-autolink-headings` | Astro's built-in heading-ID injection only, with a hand-rolled component to add the anchor link | Astro's built-in IDs alone don't produce a clickable link — you'd still need custom code to add one. Using the two standard, widely-adopted rehype plugins is less code to maintain than hand-rolling the same behavior. |

**Installation:**
```bash
npm install astro @astrojs/markdown-remark remark-math rehype-katex katex rehype-slug rehype-autolink-headings
```

**Version verification:** All versions above were confirmed live against the npm registry on 2026-09-03 via `npm view <package> version`. No stale training-data versions were used.

## Package Legitimacy Audit

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|--------------|-----------|-------------|
| astro | npm | 2021 (astro), current 7.3.1 | github.com/withastro/astro | [OK] | Approved |
| remark-math | npm | created 2017 | github.com/remarkjs/remark-math | [OK] | Approved |
| rehype-katex | npm | created 2017 | github.com/remarkjs/remark-math (monorepo) | [OK] | Approved |
| katex | npm | created 2014 | github.com/KaTeX/KaTeX | [OK] | Approved |
| rehype-slug | npm | created 2016 | github.com/rehypejs/rehype-slug | [OK] | Approved |
| rehype-autolink-headings | npm | created 2016 | github.com/rehypejs/rehype-autolink-headings | [OK] | Approved |
| @astrojs/markdown-remark | npm | created 2021, current 7.3.0 | github.com/withastro/astro (monorepo) | [OK] | Approved |
| @astrojs/mdx | npm | current 8.0.0 | github.com/withastro/astro (monorepo) | [OK] | Not needed this phase — plain `.md`, not `.mdx`, satisfies all Phase 1 requirements; do not add unless a later phase needs JSX-in-Markdown |

All 8 packages scanned `[OK]` via `slopcheck install <pkgs> --ecosystem npm` against the live npm registry. No packages removed, none flagged suspicious. `npm view <pkg> scripts.postinstall` returned empty for all 8 — no postinstall script risk signals.

**Note on tool usage:** An initial `slopcheck` run without `--ecosystem npm` defaulted to PyPI and flagged 5 of these packages as "hallucinated" (they don't exist on PyPI, which is correct — they're npm-only). This is the documented cross-ecosystem confusion pitfall, not a real finding; the ecosystem-correct run against npm is the authoritative result above.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Local Markdown files (src/content/posts/*.md, frontmatter: title/date/tags/excerpt/slug/draft)
        |
        v
astro.config.mjs: markdown.processor = unified({ remarkPlugins: [remarkMath],
                                                   rehypePlugins: [rehypeKatex, rehypeSlug, rehypeAutolinkHeadings] })
        |
        v
Astro build: content.config.ts -> defineCollection({ loader: glob(...), schema: zodSchema })
        |                                  |
        |                                  v
        |                         Zod validates every post's frontmatter
        |                         (build FAILS loudly on schema violation --
        |                          no in-browser error state, per UI-SPEC)
        v
getCollection('posts') queries -----------------------------
        |                                                   |
        v                                                   v
src/pages/index.astro                          src/pages/posts/[slug].astro
  - filter out draft:true                        - getStaticPaths() over non-draft posts,
  - sort by date desc                              params keyed on data.slug (NOT entry.id)
  - render title+excerpt list                    - render(post) -> { Content, headings }
        |                                                   |
        v                                                   v
              Shared Layout.astro (nav: Home/About, <slot />)
                            |
                            v
                 Static HTML output (dist/) -- zero client JS,
                 math/code/anchors all pre-rendered
                            |
                            v
                 Cloudflare Pages (static hosting, later phase)
```

### Recommended Project Structure
```
src/
├── content/
│   └── posts/           # Markdown post files (e.g. why-quantum-computers-threaten-bitcoin.md)
├── content.config.ts     # defineCollection + Zod schema + glob() loader
├── layouts/
│   └── Layout.astro      # Shared shell: <html>, nav, <slot />
├── components/
│   └── Nav.astro         # Home/About links (or inline in Layout.astro -- either is fine at this scale)
├── pages/
│   ├── index.astro       # Homepage post list (PAGE-01)
│   ├── about.astro       # Static About page (PAGE-03)
│   └── posts/
│       └── [slug].astro  # Dynamic post route (PAGE-02)
astro.config.mjs
```

### Pattern 1: Custom unified() processor for math + heading anchors
**What:** Astro 7 requires explicitly opting into the legacy unified pipeline to run remark/rehype plugins.
**When to use:** Always, for this phase — Sätteri (the new default) does not execute remark-math/rehype-katex/rehype-slug/rehype-autolink-headings.
**Example:**
```javascript
// Source: docs.astro.build/en/guides/markdown-content/ ; github.com/withastro/astro commit f732f3c
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { h } from 'hastscript'; // ships as a transitive dep of rehype-autolink-headings; import directly if using its `content` option

export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        rehypeSlug,                 // must run BEFORE autolink-headings -- see Pitfall 1
        [rehypeAutolinkHeadings, {
          behavior: 'prepend',
          content: h('span.heading-anchor', '#'),
          properties: { ariaHidden: 'true', tabIndex: -1, class: 'heading-anchor' },
        }],
      ],
    }),
  },
});
```
Note: `hastscript` is a transitive dependency, not something to add to `package.json` directly unless direct import fails — verify at implementation time whether it resolves from node_modules or needs an explicit `npm install hastscript`.

### Pattern 2: Content Collection with frontmatter-driven slug
**What:** Define the `posts` collection so the URL comes from an explicit `slug` field, not the filename.
**When to use:** Required per D-05 (slug survives file renames).
**Example:**
```typescript
// Source: docs.astro.build/en/guides/content-collections/ (verified against Astro 7 API shape)
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    excerpt: z.string(),
    slug: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
```
```astro
---
// Source: docs.astro.build/en/guides/content-collections/
// src/pages/posts/[slug].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.data.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---
<Content />
```

### Anti-Patterns to Avoid
- **Keying routes off `entry.id`/filename instead of `data.slug`:** The `glob()` loader derives `id` from the filename by default [CITED: docs.astro.build/en/reference/content-loader-reference/]. D-05 explicitly requires the URL to survive file renames, so `[slug].astro` must read `post.data.slug`, never `post.id`.
- **Relying on top-level `markdown.remarkPlugins`/`markdown.rehypePlugins`:** Deprecated in Astro 7 and non-functional without the `unified()` processor opt-in — silently produces unrendered `$...$` text in output if left as-is from older tutorials.
- **Skipping `rehype-slug` because "Astro already adds IDs":** True, but only after custom plugins run — `rehype-autolink-headings` running as one of those custom plugins will not see IDs yet unless `rehype-slug` runs first in the same pipeline (see Pitfall 1).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LaTeX-to-HTML math rendering | A custom KaTeX wrapper/component that calls `katex.renderToString()` manually per math node | remark-math + rehype-katex | Handles inline vs. block detection, escaping, AST integration, and edge cases (nested delimiters, multiline) that a hand-rolled regex/string-replace approach will get wrong |
| Heading slug generation | A custom kebab-case function | rehype-slug (uses `github-slugger`, same library Astro uses internally) | Guarantees the generated IDs match Astro's own slugging algorithm exactly, avoiding ID mismatches between what Astro's `headings` array reports and what's actually in the DOM |
| Frontmatter validation | Manual frontmatter checks in each page template | Zod schema in `content.config.ts` | Fails loudly at build time with a clear error rather than rendering a page with `undefined` fields silently |
| Syntax highlighting | A client-side highlighter (e.g. Prism.js loaded via CDN) | Astro's built-in Shiki integration | Zero client JS, build-time tokenization — matches the project's zero-JS-by-default constraint and avoids a flash-of-unhighlighted-code |

**Key insight:** Every "don't hand-roll" item above already has a batteries-included, build-time-only solution in the Astro ecosystem — hand-rolling any of them would both violate the project's "don't want a web-dev exercise" constraint and reintroduce client-side JS or runtime flashes the requirements explicitly rule out.

## Common Pitfalls

### Pitfall 1: rehype-autolink-headings runs before headings have IDs
**What goes wrong:** Anchor links render with no working `href`, or `rehype-autolink-headings` silently skips headings.
**Why it happens:** Astro auto-injects heading IDs, but only *after* all custom rehype plugins have finished running [CITED: docs.astro.build/en/guides/markdown-content/]. If `rehype-autolink-headings` is the only ID-related plugin in the custom pipeline, it runs too early and finds headings with no `id` yet.
**How to avoid:** Explicitly add `rehype-slug` to the custom `rehypePlugins` array, ordered immediately before `rehype-autolink-headings`.
**Warning signs:** Anchor `<a>` tags render with `href="#"` (empty) or are missing entirely; clicking the `#` glyph does nothing.

### Pitfall 2: Assuming pre-Astro-7 KaTeX tutorials work unmodified
**What goes wrong:** `$...$` and `$$...$$` render as literal raw text in the final HTML with no error at build time.
**Why it happens:** Nearly all existing blog posts/tutorials about "Astro + KaTeX" (including sources cited in PROJECT.md's own Sources section) predate Astro 7's Sätteri default and show the old flat `markdown.remarkPlugins`/`markdown.rehypePlugins` config, which no longer executes.
**How to avoid:** Use the `processor: unified({...})` shape from `@astrojs/markdown-remark`, confirmed above. Test with an actual math-containing post during scaffolding, not just a build-succeeds check — a successful build does not prove math rendered correctly, since unrendered `$...$` is still valid HTML text.
**Warning signs:** Build succeeds with no errors, but rendered post page shows raw `$` delimiters instead of typeset equations.

### Pitfall 3: Duplicate/undefined heading IDs across a post
**What goes wrong:** Two identical headings (e.g. two "Summary" subheadings in different sections) get the same `id`, breaking anchor uniqueness.
**Why it happens:** `github-slugger` (used by both Astro and rehype-slug) de-duplicates within a single processing run by appending `-1`, `-2`, etc. — but only if both plugins are using the *same* slugger instance/run. Since Astro's own injection happens after the custom pipeline, and rehype-slug's happens during it, there is a small chance of divergence if headings are also programmatically generated (not applicable to Phase 1's plain Markdown posts, but relevant if MDX/dynamic headings are added later).
**How to avoid:** For plain `.md` files (this phase's scope), this is a non-issue — write distinct heading text. Revisit only if MDX components or programmatically generated headings enter the project.
**Warning signs:** Two `#` anchor links pointing to the same fragment.

### Pitfall 4: `date` frontmatter and sorting
**What goes wrong:** Homepage list sorts incorrectly (or crashes) if `date` is left as a raw string instead of parsed.
**Why it happens:** YAML frontmatter dates are strings unless the Zod schema explicitly coerces them.
**How to avoid:** Use `z.coerce.date()` in the schema (shown in Pattern 2 above), then sort with `b.data.date.valueOf() - a.data.date.valueOf()`.
**Warning signs:** Posts appear in file-creation order rather than date order, or `.toDateString()` throws.

## Code Examples

### Homepage post list, reverse-chronological, drafts filtered (PAGE-01, D-03)
```astro
---
// Source: docs.astro.build/en/guides/content-collections/ (adapted)
import { getCollection } from 'astro:content';
import Layout from '../layouts/Layout.astro';

const allPosts = await getCollection('posts', ({ data }) => !data.draft);
const posts = allPosts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<Layout title="Learn Me the Threat">
  <ul>
    {posts.map((post) => (
      <li>
        <a href={`/posts/${post.data.slug}/`}>{post.data.title}</a>
        <p class="meta">{post.data.date.toDateString()} · {post.data.tags.join(', ')}</p>
        <p>{post.data.excerpt}</p>
      </li>
    ))}
  </ul>
</Layout>
```

### Clean trailing-slash URLs (PAGE-02)
Astro's default `trailingSlash` config produces clean `/posts/slug/`-style URLs when routes are defined as `[slug].astro` and links are written with a trailing slash, as shown above. No extra config needed for the default `output: 'static'` mode used here — verify `trailingSlash: 'always'` isn't required at implementation time by checking the actual dev-server output URL.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `markdown.remarkPlugins` / `markdown.rehypePlugins` as flat top-level Astro config keys | `markdown.processor: unified({ remarkPlugins, rehypePlugins })` from `@astrojs/markdown-remark`, or migrate to Sätteri's `mdastPlugins`/`hastPlugins` | Astro 7.0 (2026) [CITED: astro.build/blog/astro-7/, github.com/withastro/astro commits f732f3c/6650ec2] | Every pre-Astro-7 "how to add KaTeX to Astro" tutorial (including ones in PROJECT.md's own Sources list) needs this config-shape update to actually work |
| unified/remark/rehype as Astro's only Markdown pipeline | Sätteri (Rust-based, `pulldown-cmark` + `oxc`) as the new default, unified kept as opt-in legacy path | Astro 6.4 introduced it, Astro 7.0 made it default [CITED: infoq.com/news/2026/08/astro-satteri-rust/, astro.build/blog/astro-640/] | Up to 61% faster builds reported for large sites on Sätteri, but the remark/rehype plugin ecosystem (including remark-math/rehype-katex) doesn't run under it without the explicit opt-in |

**Deprecated/outdated:**
- Flat `markdown.remarkPlugins`/`markdown.rehypePlugins` Astro config keys: still parse without a hard error but no longer take effect for plugin execution — silent failure, not a build error. Replaced by the `processor:` option.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `hastscript`'s `h()` helper resolves as a transitive import without an explicit `npm install hastscript` | Pattern 1 code example | Low — if the import fails, the fix is a one-line `npm install hastscript`; doesn't block the overall approach |
| A2 | Default `output: 'static'` + trailing-slash link convention produces clean `/posts/slug/` URLs without extra `trailingSlash` config | Code Examples | Low — if URLs render as `/posts/slug` (no trailing slash) or double-slash, a one-line `trailingSlash: 'always'` config fixes it; doesn't change the architecture |
| A3 | Draft posts should be excluded from BOTH the homepage list and direct-URL access (not just the homepage list) | Pattern 2 / D-03 | Medium — CONTEXT.md's D-03 only explicitly requires hiding drafts from the homepage list; whether direct-URL access to a draft post should also 404 is not decided. Recommend confirming with the user during planning; current example filters both for simplicity, but this is a discretionary choice, not a locked decision |

## Open Questions (RESOLVED)

1. **Should draft posts be reachable by direct URL, or fully unbuilt?**
   - What we know: D-03 requires drafts hidden from the homepage list.
   - What's unclear: Whether a draft's individual `/posts/slug/` page should still build (accessible only if you know the URL) or be excluded from `getStaticPaths()` entirely (fully absent from `dist/`).
   - Recommendation: Default to excluding drafts from `getStaticPaths()` too (fully unbuilt) — this is the simpler, more defensible "hidden" behavior and matches how D-03 frames the flag ("hide draft posts... until the flag is flipped"). Flag as a quick confirmation item for the planner/user rather than blocking on it.
   - **RESOLVED:** drafts fully unbuilt — 01-01-PLAN.md Task 2 filters `getStaticPaths()` with `({ data }) => !data.draft`, so a draft produces no file in `dist/` at all.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro build | ✓ (assumed present — verify with `node --version` at scaffold time) | ^20 LTS or ^22 LTS required per PROJECT.md | If missing/too old, install current Node LTS before scaffolding — no viable fallback, Astro's CLI will refuse to run |
| npm | Package install | ✓ (ships with Node) | — | — |
| git | Version control (already initialized per repo state) | ✓ (repo already exists) | — | — |

No other external services are required for Phase 1 — no database, no API keys, no network calls at build or runtime.

**Missing dependencies with no fallback:** none confirmed missing; verify Node version at scaffold time as the one environment check this phase actually needs.

## Security Domain

`security_enforcement` is not explicitly disabled in `.planning/config.json`, so this section is included per protocol. However, this phase is a static, read-only content site with no authentication, no user input, no forms, no backend, and no database — the vast majority of ASVS categories do not apply.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth surface exists or is planned (explicit "no CMS/no admin UI" decision in PROJECT.md) |
| V3 Session Management | No | No sessions — fully static site |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | Yes (narrow) | Frontmatter is the only "input" — validated at build time via the Zod schema in `content.config.ts`. This is a build-time correctness control, not a runtime security boundary (no untrusted user input reaches this pipeline) |
| V6 Cryptography | No | No secrets, no crypto operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Markdown/frontmatter injection from untrusted content | Tampering | Not applicable this phase — the user and Claude are the only content authors, both trusted, both editing local files directly. If a future phase adds any external/community-submitted content, revisit. |
| Supply-chain risk from new/hallucinated npm packages | Tampering | Addressed by the Package Legitimacy Audit above — all 8 packages verified `[OK]` via slopcheck against the npm registry, with no postinstall script risk signals |

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view <pkg> version`, live check 2026-09-03) — astro 7.3.1, remark-math 6.0.0, rehype-katex 7.0.1, katex 0.18.5, rehype-slug 6.0.0, rehype-autolink-headings 7.1.0, @astrojs/markdown-remark 7.3.0, @astrojs/mdx 8.0.0
- github.com/withastro/astro commit f732f3c ("feat: add markdown processor abstraction") — exact `unified()` config shape
- github.com/withastro/astro commit 6650ec2 ("feat: make Sätteri the default Markdown pipeline") — confirms Sätteri is now Astro 7's default
- docs.astro.build/en/guides/markdown-content/ — heading ID auto-injection behavior, processor deprecation notes
- docs.astro.build/en/guides/content-collections/ — Content Collections `glob()` loader + `defineCollection` + `render()` current API shape
- github.com/rehypejs/rehype-autolink-headings — `behavior`/`content`/`properties` option reference
- slopcheck (local tool, run against npm registry) — package legitimacy scan, all 8 packages `[OK]`

### Secondary (MEDIUM confidence)
- lilting.ch/en/articles/astro-6-to-7-upgrade — real-world 1,558-post blog's Astro 6→7 upgrade report confirming `@astrojs/markdown-remark` opt-in path and no rendering regressions with KaTeX
- infoq.com/news/2026/08/astro-satteri-rust/ — Sätteri architecture and performance claims (61% build speedup)
- astro.build/blog/astro-640/, astro.build/blog/astro-7/ — official announcement blog posts confirming Sätteri introduction/default timeline

### Tertiary (LOW confidence)
- `@nullpinter/satteri-katex` (npm) — noted only as an alternative considered and explicitly rejected for this phase (single maintainer, published within the last month, no track record) — not recommended for use

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version confirmed live against npm registry, legitimacy confirmed via slopcheck
- Architecture (Content Collections, routing): HIGH — current official docs match GitHub source directly
- Markdown processor config (Sätteri vs. unified opt-in): HIGH — confirmed via three independent sources (official docs, GitHub commit history, real-world migration report) that agree
- Pitfalls: MEDIUM-HIGH — Pitfall 1 (plugin ordering) is inferred from official docs' own stated behavior ("Astro injects IDs after custom plugins run... add the heading ID plugin before other plugins that depend on it") rather than directly tested in a live build

**Research date:** 2026-09-03
**Valid until:** ~30 days — Astro's markdown processor situation is actively evolving (Sätteri is weeks old as of this research); re-verify processor config if planning is delayed significantly past this window
