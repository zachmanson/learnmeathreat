# Roadmap: Learn Me a Threat

**Mode:** mvp (Vertical MVP — each phase delivers an end-to-end working slice)
**Granularity:** coarse
**Created:** 2026-09-03

## Core Value

A reader with zero background can start at post one and, post by post, actually understand how quantum computing threatens Bitcoin — every concept explained before it's used, math rendered properly, nothing assumed.

## Phases

- [x] **Phase 1: Scaffolding & Core Content Pipeline** - Astro site with real Markdown+LaTeX posts, homepage, about page, and nav, working end-to-end (completed 2026-09-04)
- [x] **Phase 2: Visual Design & Theming** - Minimal text-first design with accent font and light/dark theme, legible on mobile (completed 2026-09-04)
- [x] **Phase 02.1: Reading Navigation** - Sequential heading anchors, site-wide chapter sidebar, and on-this-page outline with scroll-spy (INSERTED, urgent) (completed 2026-09-04)
- [ ] **Phase 3: Discovery & Distribution Polish** - RSS, sitemap, OG tags, reading time, and 404 page so posts are shareable and discoverable
- [ ] **Phase 4: Deployment & Custom Domain** - Site live on Cloudflare Pages with analytics and a documented custom-domain attachment path

## Phase Details

### Phase 1: Scaffolding & Core Content Pipeline
**Goal**: A reader can visit the site and read a real post with correctly rendered math, navigating there from a working homepage and nav.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. Homepage lists real posts in reverse-chronological order, each showing title and excerpt
  2. Each post opens at a clean URL (e.g. `/posts/slug/`) and renders inline/block LaTeX math as typeset equations at build time, with no visible client-side rendering flash
  3. Every heading in a post has a stable, clickable anchor link, and code blocks render with syntax highlighting
  4. The `/about` page shows user-authored content, and a top nav (Home, About) is present and functional on every page
  5. Posts are authored as local Markdown files with typed frontmatter (title, date, tags, excerpt) validated at build time
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Walking skeleton: Astro scaffold, posts collection + Zod schema, seed posts, Layout/nav, homepage, About, dynamic post route (CONT-01, PAGE-01..04)
- [x] 01-02-PLAN.md — Markdown rendering pipeline: unified() processor, KaTeX math, heading anchors, Shiki highlighting, UI-SPEC prose styling (CONT-02..04)

Also produced: `01-SKELETON.md` — architectural contract for all later phases.
**UI hint**: yes

### Phase 2: Visual Design & Theming
**Goal**: The site reads as deliberately minimal and text-first, not an unstyled template, and works well on mobile in both light and dark themes.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04
**Success Criteria** (what must be TRUE):
  1. Site uses a minimal, text-first layout with no stock photography, hero images, or marketing-site styling
  2. Headers render in a distinct monospace or serif accent font, visually separate from body text
  3. User can toggle light/dark theme; math and code blocks stay legible and correctly themed in both modes
  4. Layout is readable and usable on mobile screen widths
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — Dark theme vertical slice: [data-theme="dark"] tokens, ThemeToggle component, pre-paint is:inline init script, theming test suite (DSGN-03, DSGN-04)
- [x] 02-02-PLAN.md — Dark-mode legibility: dual-theme Shiki config + CSS variable mapping, KaTeX color anchoring + upgrade tripwire (DSGN-03)
- [x] 02-03-PLAN.md — IBM Plex Mono heading accent (self-hosted, weight 600, h1-h3 only) + full-phase human visual verification (DSGN-01, DSGN-02, DSGN-04)
**UI hint**: yes

### Phase 02.1: Reading navigation: collapsible left table-of-contents sidebar, right on-this-page section-header sidebar with scroll-spy, and a shorter stable anchor-link hash scheme for headings (INSERTED)

**Goal**: A reader inside any post can see where that post sits in the whole site (chapter contents on the left), where they are within the post (outline on the right, tracking scroll position), and can share a section link that survives later edits to that heading's wording.
**Depends on**: Phase 2
**Requirements**: NAV-01a, NAV-01b, NAV-01c
**Success Criteria** (what must be TRUE):
  1. Every post heading (h2-h6) has a short sequential anchor id (`#h-1`, `#h-2`, ...); the existing hover-reveal `#` link points at it, and no text-derived slugs remain
  2. On desktop, a left sidebar on post pages lists every published post grouped into tag-derived chapters, with only the current post's chapter expanded and the current post's link marked
  3. On desktop, a right "On this page" sidebar lists the current post's h2/h3 headings (h3 nested), and the in-view section is highlighted with accent color + bold only
  4. Posts with fewer than 2 qualifying headings render no right sidebar; below 900px the right sidebar is gone entirely and the left sidebar is reachable via a single icon toggle
  5. The post content column is unchanged — still 68ch and page-centered — and the homepage and /about page render with no sidebars
**Plans**: 3 plans

Plans:
- [x] 02.1-01-PLAN.md — Sequential `#h-N` anchor scheme: custom rehype plugin replacing rehype-slug, pipeline rewire, test lock-in (NAV-01a)
- [x] 02.1-02-PLAN.md — 3-column grid + left site-wide chapter contents sidebar with `<details>` accordion and mobile toggle (NAV-01b)
- [x] 02.1-03-PLAN.md — Right "On this page" outline with IntersectionObserver scroll-spy + full-phase human visual verification (NAV-01c)
**UI hint**: yes

### Phase 3: Discovery & Distribution Polish
**Goal**: Posts are discoverable through standard technical-reader channels (feed readers, search engines, link shares) and unknown URLs are handled gracefully.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CONT-05, PAGE-05, DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. Visiting the RSS/Atom feed URL returns a valid feed listing all posts
  2. Visiting `/sitemap.xml` lists all site pages
  3. Sharing a post link on X/Discord/Reddit renders the correct title, meta description, and Open Graph preview derived from its frontmatter
  4. Each post displays an estimated reading time
  5. Visiting an unknown URL shows a custom 404 page instead of a generic error
**Plans**: TBD
**UI hint**: yes

### Phase 4: Deployment & Custom Domain
**Goal**: The site is live on the public internet with privacy-friendly analytics, and there's a clear path to attaching the custom domain once it's registered.
**Mode:** mvp
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: ANLY-01, DEPL-01, DEPL-02, DEPL-03
**Success Criteria** (what must be TRUE):
  1. Visiting the `*.pages.dev` URL shows a working homepage listing at least one real post, matching the latest git push
  2. Pushing a commit to the git repo triggers an automatic redeploy visible at the `*.pages.dev` URL
  3. Cloudflare Web Analytics tracks pageviews without cookies
  4. A documented, step-by-step checklist exists for attaching the learnmeathreat.com custom domain once it's registered
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffolding & Core Content Pipeline | 2/2 | Complete   | 2026-09-04 |
| 2. Visual Design & Theming | 3/3 | Complete   | 2026-09-04 |
| 02.1 Reading Navigation | 3/3 | Complete   | 2026-09-04 |
| 3. Discovery & Distribution Polish | 0/TBD | Not started | - |
| 4. Deployment & Custom Domain | 0/TBD | Not started | - |

---
*Roadmap created: 2026-09-03*
*Phase 1 planned: 2026-09-03*
*Phase 2 planned: 2026-09-04*
*Phase 02.1 planned: 2026-09-04*
