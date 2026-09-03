# Feature Research

**Domain:** Minimal, text-first technical/explainer blog (static site, Markdown+LaTeX, learnmeabitcoin.com-style)
**Researched:** 2026-09-03
**Confidence:** MEDIUM-HIGH (grounded in well-established static-site-generator conventions and long-form technical blog norms; direct competitor fetch of learnmeabitcoin.com was blocked by a 403, so competitor-specific claims are from general knowledge, not a live audit)

## Feature Landscape

### Table Stakes (Users Expect These)

Features readers of a long-form, math-heavy technical blog assume exist. Missing these makes the site feel broken or amateurish, even though none of them were in the confirmed v1 scope.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Anchor-linkable headings** (stable `#id` on every `h2`/`h3`, clickable link icon on hover) | Readers share/cite specific sections of a long explainer ("see the part on Shor's algorithm"). Without this, the only way to reference a section is "scroll to it." | LOW | Almost every SSG markdown pipeline (remark/rehype, Hugo, MDX) generates heading `id`s automatically from the plugin ecosystem (e.g. `rehype-slug` + `rehype-autolink-headings` for Astro/remark-based tooling). Turning it on costs nothing at day one; **retrofitting is expensive** — once posts are published and indexed/shared, changing heading-to-slug rules changes every existing anchor URL, breaking external links and bookmarks. |
| **Syntax highlighting for code blocks** | Even a crypto/quantum blog will show pseudocode, Python snippets, or protocol data — unhighlighted code reads as unfinished. | LOW | Built into virtually every markdown-to-HTML pipeline (Shiki in Astro, Prism/Chroma in Hugo, highlight.js in 11ty) — usually a one-line config, not a custom build. |
| **RSS/Atom feed** | Technical-blog readers (the exact audience for a crypto/quantum-computing explainer) overwhelmingly still use feed readers to track niche blogs; it's the default "notify me of new posts" mechanism for this audience and expected by convention even if never asked for. | LOW (if built in from the start) | Most SSGs (Astro's `@astrojs/rss`, Hugo's built-in RSS templates, 11ty's RSS plugin) generate this from the same post collection already used for the homepage list — near-zero marginal work if added now. **Retrofitting is annoying but not catastrophic**: unlike anchors, it doesn't break existing content, it just means going back and wiring the existing post collection into a feed template later. Still, cheapest to do in the same pass as the homepage listing since it reuses the identical data. |
| **XML sitemap.xml** | Baseline technical SEO — search engines use it to discover/crawl all posts, especially important since this is a new domain with no backlink profile yet. | LOW | Same story as RSS: auto-generated from the post collection by nearly every SSG (`@astrojs/sitemap`, Hugo built-in, 11ty plugin). Trivial to add at project start, trivial to add later too — lowest-stakes item on this list. |
| **Descriptive `<title>` / meta description / Open Graph tags per post** | Determines how each post looks when shared on X/Twitter, Discord, Reddit (likely distribution channels for a crypto-adjacent blog) and in Google search results. A missing/generic OG image or title makes shared links look broken or untrustworthy. | LOW | Derivable from frontmatter (title + excerpt already required for the homepage listing) — no new authoring burden, just a template. Cheap now; retrofitting means going back through every post's frontmatter to backfill descriptions, which is tedious but not destructive. |
| **Readable typography for long-form + math** (adequate line length/measure, font sizing, spacing around block equations) | This is the core of the "learnmeabitcoin style" — dense, rigorous, long single-page reads. Bad line length or cramped KaTeX spacing makes 3000-word posts exhausting to read. | LOW–MEDIUM | Not a discrete "feature" so much as baseline CSS discipline, but worth calling out explicitly since it's the #1 UX factor for this specific content type. No dependency on other features — purely a CSS/typography pass. |
| **Mobile-responsive layout** | Baseline expectation for any 2026 website; a meaningful fraction of readers will land from a shared link on mobile. | LOW | Standard in any modern SSG's default templates/CSS; just needs verifying, not building from scratch. |
| **404 page** | Prevents broken/renamed post links from producing a blank browser error; especially relevant since URLs may be tweaked as the "clean URL" scheme settles early on. | LOW | One static page, essentially free with any SSG's routing. |

### Differentiators (Competitive Advantage)

Features that go beyond baseline and would meaningfully improve the reading/learning experience for *this* project's specific content (long, math-heavy, ground-up explainers), without being expected by default.

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| **Table of contents (sticky/inline) for long posts** | learnmeabitcoin-style posts run long and build concept-by-concept; a TOC lets a reader jump to "the part I don't understand yet" or skim structure before committing to read. This is the single highest-leverage differentiator for this specific content style. | LOW–MEDIUM | Can be auto-generated from the same heading structure used for anchor links (reuses `rehype-slug`/heading-extraction output) — so if anchor-linkable headings are done right from day one, a TOC is a cheap follow-on, not a rebuild. This is the concrete reason anchor headings belong in the table-stakes list even though "TOC" itself was deferred/unconfirmed in scope. |
| **Reading time estimate** ("~12 min read") | Sets expectations for a long, rigorous post before the reader commits — useful given these are not skimmable listicles. | LOW | Pure function of word count from the already-parsed markdown content; several SSG plugins compute this for free (e.g. `reading-time` npm package). Cheap, low-risk, no retrofit cost either way since it's just a computed display value, not a structural URL/ID decision. |
| **Previous/next post navigation** | Since the content is explicitly sequential ("start at post one and, post by post, actually understand..."), letting a reader move to the next post in the series without going back to the homepage directly reinforces the core value prop. | LOW–MEDIUM | Depends on post ordering (chronological, or eventually a defined "series order" if posts are reordered/renumbered later). Cheap now using publish-date order; if a curated non-chronological reading order is wanted later (e.g. "recommended path" vs. "publish order"), that's a design decision worth flagging, not a technical blocker. |
| **Copy-to-clipboard button on code blocks** | Small polish detail that matters when snippets are meant to be run/tried, not just read. | LOW | Common plugin/behavior in Shiki/rehype-pretty-code setups; trivial addition once syntax highlighting exists. |
| **Print/PDF-friendly stylesheet** | A niche but real want for dense technical references — some readers print or export long math-heavy explainers for offline study. | LOW | Just an additional `@media print` CSS block; no structural cost. Nice-to-have, not urgent. |
| **Basic search across posts** | With only a handful of posts at launch, low value now, but becomes genuinely useful once the archive grows past ~15-20 posts and tags/series aren't built yet. | MEDIUM (client-side index like Pagefind/Lunr) or effectively free (site: search via Google) | Explicitly a "not yet" — flag as v1.x, not v1. Building a search index over a 3-5 post site is solving a problem that doesn't exist yet. |
| **Footnotes / margin notes for asides** | Ground-up rigor often needs "aside: here's a definition" without breaking the main explanatory flow — footnotes are a natural fit for this teaching style (learnmeabitcoin itself leans on inline tooltips/asides for jargon). | LOW–MEDIUM | Standard markdown footnote syntax is supported by most markdown parsers (remark-footnotes, Hugo, etc.) with minimal config. Worth deciding on now since it affects authoring conventions, but not urgent to build out.|

### Anti-Features (Commonly Requested, Often Problematic)

Already correctly excluded from v1 scope per PROJECT.md — restated here with the reasoning made explicit, since it validates those calls and should discourage scope creep during build.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Comments section | "Feels more interactive/community-driven" | Requires moderation, spam handling, and either a backend or a third-party embed (privacy/tracking tradeoff) for a single-author blog with no community yet | Link to a personal X/Nostr/Mastodon account or GitHub Discussions for reader feedback if/when wanted — zero infra cost |
| Newsletter signup | "Standard blog thing to capture an audience" | Needs an email provider integration, a privacy policy, and ongoing list hygiene for a project with no confirmed readership yet | RSS feed (already table-stakes) covers "notify me of new posts" for the actual target audience (technical readers) with zero backend |
| Web-based CMS/editor | "Non-technical writing experience" | Adds a backend, auth surface, and hosting complexity that directly conflicts with the "$0 static hosting, no backend" constraint | Local Markdown + git, already the confirmed workflow |
| Full-text client-side search at launch | "Nice to have search" | Over-engineering for a 3-5 post launch corpus; adds a build step and JS payload for a feature nobody can use yet (nothing to search) | Defer until archive is large enough to need it (see Differentiators) |
| Series/Topics grouping page | "Organize by theme" | No payoff until there's enough content to group meaningfully; premature IA decisions are hard to walk back once readers have bookmarked category URLs | Tags captured in frontmatter now (already planned) — build the page later without re-authoring content |
| Analytics beyond pageviews (heatmaps, session replay, detailed funnels) | "More insight into readers" | Directly conflicts with the "privacy-friendly, cookieless" requirement and adds third-party tracking scripts to a text-first site | Cloudflare's built-in privacy-friendly pageview analytics (already chosen) is sufficient for a reading-only blog |

## Feature Dependencies

```
Anchor-linkable headings (rehype-slug style ID generation)
    ├──enables──> Table of Contents (reuses the same heading/ID extraction)
    └──enables──> Deep-linking/sharing specific sections

Post frontmatter (title, excerpt, date, tags — already in scope)
    ├──feeds──> Homepage listing (already in scope)
    ├──feeds──> RSS feed (same data, near-zero marginal cost)
    ├──feeds──> Sitemap.xml (same data, near-zero marginal cost)
    ├──feeds──> Open Graph / meta tags per post
    └──feeds──> Series/Topics page (deferred, but data already captured)

Syntax highlighting
    └──enables──> Copy-to-clipboard on code blocks

Publish-date ordering (already implied by "reverse-chronological homepage")
    └──enables──> Previous/Next post navigation
```

### Dependency Notes

- **Anchor-linkable headings enable Table of Contents:** both consume the same heading-extraction step in the markdown pipeline. Implementing heading IDs once, at day one, means a TOC later is a template addition, not a content migration. This is the single highest-priority "cheap now, expensive later" item — see MVP section below.
- **Frontmatter feeds RSS, sitemap, and OG tags "for free":** because title/excerpt/date/tags are already required fields for the homepage listing (per confirmed scope), generating RSS/sitemap/meta tags from that same data adds no new authoring burden — it's template-only work, not a structural change. This is why they're recommended as table-stakes additions to v1 rather than deferred.
- **Syntax highlighting enables copy-to-clipboard:** trivial add-on once a highlighter (Shiki/Prism/Chroma) is already parsing code fences.
- **Series/Topics page (deferred) depends on tags (in scope):** confirms the existing PROJECT.md decision is sound — capturing tags now without building the page is the correct sequencing, not wasted work.

## MVP Definition

### Launch With (v1)

Everything already confirmed in PROJECT.md, plus these additions — all LOW complexity and either free byproducts of already-planned work (frontmatter, markdown pipeline) or cheap-now/expensive-later items:

- [x] Homepage reverse-chronological listing (confirmed)
- [x] /about page (confirmed)
- [x] Individual post pages, clean URLs (confirmed)
- [x] Markdown + KaTeX (confirmed)
- [x] Tag/category frontmatter, no page yet (confirmed)
- [x] Light/dark toggle (confirmed)
- [x] Privacy-friendly analytics (confirmed)
- [ ] **Anchor-linkable headings** — cheapest possible now (one plugin/config), expensive to retrofit once posts are published and anchors are shared/bookmarked
- [ ] **Syntax highlighting for code blocks** — near-zero cost via standard SSG plugin, avoids a visibly unfinished look on any post with code/pseudocode
- [ ] **RSS/Atom feed** — reuses existing post frontmatter, matches the actual expected distribution channel for this audience (technical readers who use feed readers)
- [ ] **sitemap.xml** — reuses existing post frontmatter, baseline SEO for a brand-new domain with no backlinks yet
- [ ] **Per-post meta description + Open Graph tags** — reuses existing excerpt/title frontmatter, determines how shared links render
- [ ] **Reading time estimate** — trivial computed value, sets expectations for long posts
- [ ] **404 page** — effectively free with any SSG

### Add After Validation (v1.x)

- [ ] **Table of contents for long posts** — add once anchor-linkable headings exist (they're prerequisite groundwork already in v1) and once there are a couple of genuinely long posts to justify it
- [ ] **Previous/Next post navigation** — trivial once there are 3+ posts in a defined order; low value with only 1-2 posts
- [ ] **Copy-to-clipboard on code blocks** — small polish, add once syntax highlighting is live and there's real code content to copy
- [ ] **Footnotes/asides styling convention** — decide the authoring convention early (affects how future posts are written) even if visual polish comes later

### Future Consideration (v2+)

- [ ] **Client-side search** — defer until the archive is large enough (~15-20+ posts) that browsing/tags alone aren't sufficient
- [ ] **Series/Topics grouping page** — deferred per existing PROJECT.md decision; tags are already captured to support this later
- [ ] **Print/PDF-friendly stylesheet** — nice-to-have polish, no urgency
- [ ] **Comments, newsletter, CMS** — explicitly anti-features per PROJECT.md, revisit only if audience/goals materially change

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Anchor-linkable headings | HIGH (blocks future TOC + sharing) | LOW | P1 |
| Syntax highlighting | MEDIUM | LOW | P1 |
| RSS feed | MEDIUM-HIGH (matches audience habits) | LOW | P1 |
| sitemap.xml | MEDIUM (SEO) | LOW | P1 |
| OG/meta tags per post | MEDIUM (share appearance) | LOW | P1 |
| Reading time | LOW-MEDIUM | LOW | P1 |
| 404 page | LOW | LOW | P1 |
| Table of contents | HIGH (core to this content style) | LOW-MEDIUM | P2 |
| Prev/Next navigation | MEDIUM (reinforces sequential learning) | LOW-MEDIUM | P2 |
| Copy-to-clipboard | LOW | LOW | P2 |
| Client-side search | LOW now, rises over time | MEDIUM | P3 |
| Series/Topics page | MEDIUM, but no content yet | MEDIUM | P3 |
| Print stylesheet | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch (either explicitly confirmed, or cheap/free byproducts of confirmed work, or cheap-now/expensive-later structural decisions)
- P2: Should have, add shortly after there's enough content to justify it
- P3: Nice to have, defer until the archive/audience grows

## Competitor Feature Analysis

Direct live audit of learnmeabitcoin.com was blocked (403 on fetch); the following is based on general knowledge of the site and should be treated as MEDIUM/LOW confidence — worth a manual spot-check by the user before finalizing design decisions.

| Feature | learnmeabitcoin.com (reference model) | Typical minimal technical blogs generally | Our approach |
|---------|----------------------------------------|---------------------------------------------|--------------|
| Navigation depth | Sidebar/menu organizing many short, interlinked glossary-style pages (large corpus) | Usually a flat homepage list for small corpora | Flat reverse-chron homepage list is correct at this project's scale (few long posts, not many short ones) — confirmed scope is right, don't copy learnmeabitcoin's sidebar IA prematurely |
| Content shape | Many short, densely cross-linked pages (wiki-like) | This project: fewer, much longer, sequential explainer posts | Structurally different content shape means TOC + anchor headings matter more here than a sidebar-nav wiki style would need |
| Visual style | Minimal, text-first, understated | Matches project's stated aesthetic goal | Confirmed alignment, no change needed |
| RSS | Uncertain/not verified | Common on individual technical-writer blogs (vs. wiki-style reference sites) | Include — this project is closer to "sequential blog" than "reference wiki," making RSS more relevant here than it might be for learnmeabitcoin specifically |

## Sources

- General knowledge of static-site-generator ecosystem conventions (Astro `@astrojs/rss`, `@astrojs/sitemap`, rehype-slug/rehype-autolink-headings, Shiki syntax highlighting; Hugo built-in RSS/sitemap/Chroma highlighting; 11ty RSS/sitemap plugins) — HIGH confidence, these are stable, long-standing conventions, not fast-moving specifics
- [Best Static Site Generators in 2026: Top SSGs Compared](https://naturaily.com/blog/best-static-site-generators)
- [Astro vs Eleventy vs Hugo vs Jekyll vs Gatsby in 2026](https://gautamkhorana.com/blog/static-site-generators-2026-astro-eleventy-hugo-jekyll-gatsby/)
- [Our Top 12 picks for Static Site Generators (SSGs) in 2026](https://hygraph.com/blog/top-12-ssgs)
- Direct fetch of learnmeabitcoin.com returned HTTP 403 (bot-blocked) — competitor claims above are general knowledge, flagged as needing a manual spot-check, not a live audit
- `.planning/PROJECT.md` — confirmed v1 scope and explicit out-of-scope items used as the baseline for this analysis

---
*Feature research for: minimal text-first technical/personal blog (long-form, math-heavy, sequential explainer content)*
*Researched: 2026-09-03*
