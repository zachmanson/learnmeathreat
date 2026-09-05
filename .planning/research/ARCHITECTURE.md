# Architecture Research

**Domain:** Personal static Markdown+LaTeX blog (SSG, no CMS, Cloudflare Pages hosting)
**Researched:** 2026-09-03
**Confidence:** HIGH (Cloudflare Pages git-integration behavior and Astro content collections verified against current official docs; specific plugin versions not pinned — verify at install time)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEV (git repo)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │ src/content/  │   │ src/pages/   │   │ src/layouts/    │  │
│  │ blog/*.md     │   │ index, about │   │ Base, Post      │  │
│  │ (posts+       │   │ (route       │   │ (shared HTML    │  │
│  │ frontmatter)  │   │ shells)      │   │ shell, nav,     │  │
│  │               │   │              │   │ theme toggle)   │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬────────┘  │
│         │                  │                    │            │
│         └──────────┬───────┴────────────────────┘            │
│                     ▼                                         │
│         ┌───────────────────────┐                             │
│         │  Astro build pipeline  │  (content collection       │
│         │  remark-math →         │   schema validates          │
│         │  rehype-katex →        │   frontmatter at build)     │
│         │  static HTML emit      │                             │
│         └───────────┬───────────┘                             │
│                      ▼                                         │
│                   dist/  (plain static HTML/CSS/JS)            │
└─────────────────────────────────────────────────────────────┘
                       │  git push
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE (git-connected Pages project)        │
├─────────────────────────────────────────────────────────────┤
│  Webhook on push → build container runs `npm run build`      │
│  → deploys dist/ to Cloudflare's edge network                │
│  → assigns *.pages.dev URL (+ custom domain once attached)    │
│  → Cloudflare Web Analytics script (cookieless pageviews)     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Content collection (`src/content/blog/`) | Holds one `.md` file per post; source of truth for post body + frontmatter | Astro `src/content/blog/*.md`, validated by a Zod schema in `src/content/config.ts` |
| Content config / schema | Defines and enforces frontmatter shape (title, date, tags, excerpt) at build time | `defineCollection({ schema: z.object({...}) })` — build fails loudly if a post is missing a required field, instead of silently rendering broken |
| Layouts | Shared page chrome: nav, theme toggle, KaTeX CSS import, base HTML | `src/layouts/BaseLayout.astro`, `PostLayout.astro` |
| Route pages | Turn collection entries + static content into actual URLs | `src/pages/index.astro` (post list), `src/pages/about.astro`, `src/pages/posts/[slug].astro` (dynamic post route via `getStaticPaths`) |
| Build pipeline | Parses Markdown, expands math via remark/rehype plugins, emits static HTML | Astro's built-in Markdown pipeline + `remark-math` + `rehype-katex`, configured in `astro.config.mjs` |
| Cloudflare Pages | Hosts static output, runs the build on every push, serves via CDN edge, terminates custom domain | Git-connected Pages project — no manual deploy step |
| Cloudflare Web Analytics | Cookieless pageview tracking | A single `<script>` tag injected via Cloudflare dashboard (beacon token) or added to `BaseLayout.astro` — no separate service integration |

## Recommended Project Structure

```
learnmeathreat/
├── src/
│   ├── content/
│   │   ├── config.ts        # Zod schema for blog collection frontmatter
│   │   └── blog/             # One .md file per post
│   │       ├── how-bitcoin-transactions-work.md
│   │       └── shors-algorithm-explained.md
│   ├── layouts/
│   │   ├── BaseLayout.astro  # <html> shell, nav, theme toggle, KaTeX CSS import
│   │   └── PostLayout.astro  # Post-specific chrome (title, date, tags) wrapping BaseLayout
│   ├── pages/
│   │   ├── index.astro       # Homepage: lists posts reverse-chronological w/ excerpt
│   │   ├── about.astro       # Static about page
│   │   └── posts/
│   │       └── [slug].astro  # Dynamic route: renders one collection entry
│   ├── components/
│   │   └── ThemeToggle.astro # Light/dark toggle (small, isolated — likely just this one)
│   └── styles/
│       └── global.css        # Base typography, monospace/serif accents, light+dark tokens
├── public/
│   └── favicon, static assets (not processed by build)
├── astro.config.mjs          # remarkMath/rehypeKatex plugin wiring
├── package.json
└── .planning/                 # GSD project files (not shipped)
```

### Structure Rationale

- **`src/content/blog/`:** Astro's content collections are the standard, current (Astro 2.0+) way to manage a folder of same-shaped Markdown files. Keeping posts here (not loose in `src/pages/`) is what unlocks frontmatter schema validation and lets `index.astro` query "all posts sorted by date" without hand-parsing frontmatter.
- **`src/content/config.ts`:** Centralizes the frontmatter contract (title, date, tags, excerpt) in one typed place. This directly satisfies the "tag/category frontmatter now" requirement — the schema is where tags become a first-class, typed field even though the grouping UI is deferred.
- **`src/pages/posts/[slug].astro`:** Content collection entries are not automatically routable pages (this changed in Astro 2.0) — a single dynamic route file is the standard pattern to turn every collection entry into `/posts/<slug>/`, rather than one file per post.
- **`src/layouts/`:** Separates "site chrome" (nav, theme toggle) from "post chrome" (title/date/tags block) so the homepage and about page share the base shell without inheriting post-specific markup.
- **No `src/content/config.ts` for "about"/"pages":** About and nav pages are simple enough to be plain `.astro` files with inline content — a second collection would be over-engineering for one static page.

## Architectural Patterns

### Pattern 1: Compile-time math rendering (no client JS)

**What:** `remark-math` parses `$..$` / `$$..$$` into a math AST node during Markdown processing; `rehype-katex` renders that node to static HTML/CSS at build time.
**When to use:** Any static-first blog with math — this is the standard combo, confirmed current in Astro's own Markdown pipeline docs.
**Trade-offs:** Zero runtime JS cost (good for a minimal, fast site) vs. Client-side rendering (e.g. loading KaTeX in-browser) which adds JS weight for no benefit here since content never changes after build.

**Example (`astro.config.mjs`):**
```javascript
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
```
KaTeX's CSS must still be imported once in the base layout (`import 'katex/dist/katex.min.css'`) — the plugin renders math markup, but katex.css supplies the font/spacing rules.

### Pattern 2: Schema-validated frontmatter via content collections

**What:** Define frontmatter shape once with Zod; every post is checked against it at build time.
**When to use:** Any multi-post blog where consistency matters (title/date/tags/excerpt required on every post) — catches a missing `tags:` field as a build error instead of a broken/inconsistent homepage listing.
**Trade-offs:** One extra file (`config.ts`) and a little Zod syntax to learn vs. hand-parsed frontmatter with no guardrails, which risks a post silently missing from the homepage list or rendering `undefined` for a missing excerpt.

**Example (`src/content/config.ts`):**
```typescript
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    excerpt: z.string(),
  }),
});

export const collections = { blog };
```

### Pattern 3: Git-push-to-live via Cloudflare Pages git integration

**What:** Connect the GitHub repo to a Cloudflare Pages project once. Cloudflare registers a webhook; every push to the production branch triggers a hosted build container that runs the configured build command and deploys the output directory.
**When to use:** Default for any static site with no need for custom CI logic — this is explicitly the "don't want to hand-manage CI" path.
**Trade-offs:** Zero local deploy commands, free preview URLs on other branches/PRs vs. Manual `wrangler pages deploy` — only needed if you want deploys from a machine with no git-hosted repo, or want deploys decoupled from git pushes (neither applies here).

## Data Flow

### Authoring → Publish Flow

```
User/Claude edits .md file in src/content/blog/
    ↓ (git add, commit, push to GitHub)
GitHub webhook fires → Cloudflare Pages build container starts
    ↓
npm install → npm run build
    ↓ (Astro: parse frontmatter → validate against Zod schema →
    ↓  remark-math/rehype-katex expand LaTeX → emit static HTML)
dist/ produced
    ↓
Cloudflare deploys dist/ to edge network, assigns URL
    ↓
Live at *.pages.dev (and later, the custom domain once DNS is pointed at it)
```

### Post List Rendering Flow (build-time, not runtime)

```
astro:content API: getCollection('blog')
    ↓ (sort by frontmatter.date, descending)
index.astro maps sorted list → <a href="/posts/{slug}"> + excerpt
    ↓
Static HTML for homepage baked at build time — no runtime data fetch, no client JS needed for listing
```

### Key Data Flows

1. **Frontmatter → homepage listing:** `index.astro` calls `getCollection('blog')`, sorts by `date`, renders title + `excerpt` per entry. This is the only place "all posts" logic lives — no duplicate list-building anywhere else.
2. **Frontmatter → post page:** `posts/[slug].astro` uses `getStaticPaths()` to enumerate every collection entry into a route, then renders that entry's body (with math already expanded by the build pipeline) inside `PostLayout`.
3. **Tags → (deferred) topic page:** Tags are already structured data on every post via the schema. When a v2 topics/series page is built, it queries the same collection and groups by `tags` — no migration of existing posts needed, which is the entire point of capturing tags now.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| A handful of posts (v1, current) | Current structure as-is. Every page is statically generated at build time — this is already the simplest, fastest-loading form there is. |
| Dozens of posts | No structural change needed. Consider adding the deferred Series/Topics page once there's enough content to justify grouping — this was already scoped for v2. |
| Hundreds of posts | Still fine as fully static — Astro's build scales linearly with post count and Cloudflare Pages has no meaningful traffic/build limits on the free tier for a text blog. Only concern would be build time creeping up; not a real risk at this content volume. |

### Scaling Priorities

1. **First "bottleneck":** None expected at blog scale — this is a reading-only static site with no database, no runtime backend, and Cloudflare's CDN handles arbitrary traffic on the free tier. The architecture is already at its simplest form.
2. **Second bottleneck:** If post count grows very large (hundreds+) build time is the only thing that could grow — mitigated by Cloudflare's incremental/cached builds; not worth designing around now.

## Anti-Patterns

### Anti-Pattern 1: Hand-rolling a Markdown pipeline instead of using content collections

**What people do:** Read `.md` files off disk manually (e.g. with `fs.readdirSync` + `gray-matter`) and glob them together for the homepage.
**Why it's wrong:** Loses build-time frontmatter validation, loses type safety on `tags`/`date`/`excerpt`, and duplicates logic Astro already provides natively — creates exactly the kind of "custom app code" the project explicitly wants to avoid.
**Do this instead:** Use Astro's built-in content collections (`astro:content`) — it is the current, first-party, actively maintained way to do this, not a third-party workaround.

### Anti-Pattern 2: Manual `wrangler pages deploy` as the primary publish path

**What people do:** Skip git integration, run `wrangler pages deploy dist` from a local machine to publish.
**Why it's wrong:** Adds a manual step (has to be remembered every time), requires Cloudflare API token management locally, and provides no automatic history/rollback tied to git commits, no PR preview URLs — reintroduces "hand-managed CI" the project explicitly wants to avoid.
**Do this instead:** Connect the GitHub repo to a Cloudflare Pages project once (dashboard, one-time setup). Every `git push` after that is the entire publish flow — this is the standard, zero-ceremony path and matches Cloudflare's own documented default for git-hosted static sites.

### Anti-Pattern 3: Client-side KaTeX rendering

**What people do:** Ship raw `$...$` LaTeX strings to the browser and render with KaTeX's JS auto-render extension at page load.
**Why it's wrong:** Adds unnecessary client JS and a render flash for a site whose content never changes after build — directly works against the "minimal, text-first" and "lean and hand-built" goals.
**Do this instead:** Render math at build time via `remark-math`/`rehype-katex` (Pattern 1) — output is plain static HTML/CSS, same as the rest of the page.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Cloudflare Pages | Git integration (GitHub app + webhook), configured once via dashboard | Framework preset "Astro" auto-fills build command (`npm run build`) and output directory (`dist`) — verify these match after `npm create astro@latest` scaffolding, since preset mismatches are the most common first-deploy failure |
| Cloudflare Web Analytics | `<script>` beacon snippet added once to `BaseLayout.astro`, token generated in Cloudflare dashboard | No cookies, no separate account/service — satisfies "privacy-friendly, cookieless" requirement without a third-party analytics integration |
| Custom domain (learnmeathreat.com, not yet registered) | Added later via Cloudflare Pages dashboard "Custom Domains" tab once the domain is purchased | No code/architecture change required — this is a DNS/dashboard step, doesn't affect repo structure |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Content collection ↔ pages | `astro:content` API (`getCollection`, `getEntry`) at build time only | No runtime coupling — pages are fully static once built; a bad frontmatter field fails the build, not a live page |
| Layouts ↔ pages | Astro slot/props composition (`<PostLayout {...frontmatter}>`) | Straightforward one-directional: pages pass data down into layouts, layouts never reach back up |
| Build pipeline ↔ Cloudflare | Build command + output directory contract only (`npm run build` → `dist/`) | Cloudflare has no visibility into Astro internals — the only integration surface is "run this command, deploy this folder" |

## Sources

- [Astro: Markdown in Astro](https://docs.astro.build/en/guides/markdown-content/) — HIGH confidence, official docs
- [Astro: Content collections](https://docs.astro.build/en/guides/content-collections/) — HIGH confidence, official docs
- [Astro: Introducing Content Collections (2.0)](https://astro.build/blog/introducing-content-collections/) — HIGH confidence, official blog, confirms collection entries require explicit route pages (not auto-routed)
- [Cloudflare Pages: Git integration docs](https://developers.cloudflare.com/pages/configuration/git-integration/) — HIGH confidence, official docs, confirms webhook-based auto-build/deploy on push
- [Cloudflare Pages: Deploy an Astro site](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) — HIGH confidence, official docs, confirms `npm run build` / `dist` preset
- [Cloudflare Pages: Branch deployment controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/) — HIGH confidence, official docs, confirms production-branch auto-deploy toggle and preview deployments
- remark-math / rehype-katex Astro integration pattern — MEDIUM confidence (cross-referenced across multiple current community write-ups, consistent with Astro's own markdown plugin API; verify exact package versions at install time)

---
*Architecture research for: Personal static Markdown+LaTeX blog*
*Researched: 2026-09-03*
