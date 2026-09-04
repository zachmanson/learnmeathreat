# Requirements: Learn Me a Threat

**Defined:** 2026-09-03
**Core Value:** A reader with zero background can start at post one and, post by post, actually understand how quantum computing threatens Bitcoin — every concept explained before it's used, math rendered properly, nothing assumed.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Content Pipeline

- [x] **CONT-01**: Posts are authored as local Markdown files with frontmatter (title, date, tags, excerpt)
- [x] **CONT-02**: Inline (`$..$`) and block (`$$..$$`) LaTeX math in post Markdown renders as typeset equations, in the same font as body text, at build time (no client-side rendering flash)
- [x] **CONT-03**: Every heading in a post gets a stable, clickable anchor link (`#id`) that survives future content edits
- [x] **CONT-04**: Code blocks in posts render with syntax highlighting
- [ ] **CONT-05**: Each post displays an estimated reading time

### Pages

- [x] **PAGE-01**: Homepage lists all posts in reverse-chronological order, each showing title and short excerpt
- [x] **PAGE-02**: Each post has its own page at a clean URL (e.g. `/posts/how-bitcoin-transactions-work/`)
- [x] **PAGE-03**: Static `/about` page exists with user-authored content
- [x] **PAGE-04**: Top nav shows Home and About, present on every page
- [ ] **PAGE-05**: A custom 404 page is shown for unknown URLs

### Reading Navigation

Added 2026-09-04 when Phase 02.1 was inserted. Pulls v2's NAV-01 forward and expands it into three
distinct capabilities (see `.planning/phases/02.1-.../02.1-CONTEXT.md` D-01 through D-13).

- [ ] **NAV-01a**: Post heading anchors use short, position-based sequential ids (`#h-1`, `#h-2`, ...) covering h2-h6, so a shared section link survives later rewording of that heading
- [ ] **NAV-01b**: Post pages show a site-wide table-of-contents sidebar listing every published post, grouped into collapsible chapters derived dynamically from existing tag frontmatter
- [ ] **NAV-01c**: Post pages show an "on this page" outline of the current post's h2/h3 headings, with the in-view section highlighted as the reader scrolls

### Design

- [x] **DSGN-01**: Site uses a minimal, text-first visual design — no stock photography, no hero images, no marketing-site styling
- [x] **DSGN-02**: Headers use a distinct monospace or serif accent font, separate from body text
- [x] **DSGN-03**: Site supports a light/dark theme toggle, and math/code rendering is legible and correctly themed in both modes
- [x] **DSGN-04**: Layout is readable on mobile screens

### Discovery & Sharing

- [ ] **DISC-01**: Site publishes an RSS/Atom feed of all posts
- [ ] **DISC-02**: Site publishes a sitemap.xml listing all pages
- [ ] **DISC-03**: Each post has per-page title, meta description, and Open Graph tags derived from its frontmatter, so shared links render properly on X/Discord/Reddit

### Analytics

- [ ] **ANLY-01**: Site tracks pageviews via a privacy-friendly, cookieless analytics tool (Cloudflare Web Analytics)

### Deployment

- [ ] **DEPL-01**: Site is deployed on Cloudflare Pages' free tier, auto-deploying on every push to the git repo
- [ ] **DEPL-02**: Site is reachable at a working `*.pages.dev` URL as an intermediate milestone before the custom domain is attached
- [ ] **DEPL-03**: Documented steps exist for attaching the learnmeathreat.com custom domain to the deployed site once it's registered (registration itself is a manual, out-of-band step by the user)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Navigation Polish

- ~~**NAV-01**: Table of contents on long posts, auto-generated from anchor headings~~ — superseded, pulled forward and expanded into v1 NAV-01a/NAV-01b/NAV-01c by inserted Phase 02.1
- **NAV-02**: Previous/Next post navigation, based on publish-date order

### Content Growth

- **GROW-01**: Series/Topics page grouping posts by their existing tag frontmatter
- **GROW-02**: Client-side search across posts (once archive is large enough, ~15-20+ posts)

### Polish

- **POLSH-01**: Copy-to-clipboard button on code blocks
- **POLSH-02**: Print/PDF-friendly stylesheet
- **POLSH-03**: Footnote/aside styling convention for definitions and tangents

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Comments section | Requires moderation and either a backend or third-party embed; no community yet for a single-author launch |
| Newsletter/email signup | Needs an email provider integration and ongoing list hygiene; RSS feed already covers "notify me of new posts" for this audience |
| Web-based CMS/editor | Adds a backend, auth surface, and hosting complexity that conflicts with the $0 static-hosting, no-backend constraint; local Markdown + git is the confirmed workflow |
| Domain registration | Hosting is free, but registering learnmeathreat.com is a manual billing step with a registrar, outside what a build phase can do |
| Analytics beyond pageviews (heatmaps, session replay) | Conflicts with the privacy-friendly, cookieless requirement |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 1 | Complete |
| CONT-02 | Phase 1 | Complete |
| CONT-03 | Phase 1 | Complete |
| CONT-04 | Phase 1 | Complete |
| CONT-05 | Phase 3 | Pending |
| PAGE-01 | Phase 1 | Complete |
| PAGE-02 | Phase 1 | Complete |
| PAGE-03 | Phase 1 | Complete |
| PAGE-04 | Phase 1 | Complete |
| PAGE-05 | Phase 3 | Pending |
| DSGN-01 | Phase 2 | Complete |
| DSGN-02 | Phase 2 | Complete |
| DSGN-03 | Phase 2 | Complete |
| DSGN-04 | Phase 2 | Complete |
| NAV-01a | Phase 02.1 | Pending |
| NAV-01b | Phase 02.1 | Pending |
| NAV-01c | Phase 02.1 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| ANLY-01 | Phase 4 | Pending |
| DEPL-01 | Phase 4 | Pending |
| DEPL-02 | Phase 4 | Pending |
| DEPL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 24 total (21 original + NAV-01a/b/c added with inserted Phase 02.1)
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-03*
*Last updated: 2026-09-04 — NAV-01a/b/c added for inserted Phase 02.1*
