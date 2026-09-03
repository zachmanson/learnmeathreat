# Learn Me the Threat

## What This Is

A personal blog (learnmethethreat.com) publishing a rigorous, self-contained explainer series on quantum computing threats to cryptocurrencies, starting with Bitcoin. Written in the style of learnmeabitcoin.com: casual tone, ground-up rigor, no prior knowledge assumed — every concept is explained before it's used. The user writes rough drafts (Markdown + LaTeX), Claude helps clean them into polished posts.

## Core Value

A reader with zero background can start at post one and, post by post, actually understand how quantum computing threatens Bitcoin — every concept explained before it's used, math rendered properly, nothing assumed.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Homepage lists all posts in reverse-chronological order, each with title + short excerpt
- [ ] Static /about page (content authored by user)
- [ ] Individual post pages at clean URLs (e.g. /posts/how-bitcoin-transactions-work/)
- [ ] Simple top nav: Home, About
- [ ] Posts authored in Markdown with inline (`$..$`) and block (`$$..$$`) LaTeX math, rendered via KaTeX in the site's body font
- [ ] Every post has tag/category frontmatter (e.g. "Bitcoin Fundamentals", "Quantum Algorithms", "Other Chains") so posts can be grouped later, even though the grouping page itself isn't built yet
- [ ] Minimal, text-first visual design — no stock photography, no hero images, no marketing-site feel; monospace or serif accent for headers
- [ ] Light/dark theme toggle
- [ ] Privacy-friendly, cookieless analytics (pageviews only) via Cloudflare
- [ ] Site deployed on Cloudflare Pages, free tier, with instructions for pointing the custom domain at it once registered
- [ ] Editing workflow: posts are local Markdown files edited directly (by user and/or Claude) and tracked in git — no web-based admin UI

### Out of Scope

- Series/Topics page grouping posts by tag — tags are captured in frontmatter now, but the page itself is deferred until there are enough posts to justify it
- Comments — reading-only site for v1, avoids moderation overhead
- Email/newsletter signup — not needed for v1, revisit if audience grows
- Web-based post editor / CMS — user is comfortable editing Markdown files directly with git; avoids the extra build/auth surface
- Domain registration itself — hosting is free (Cloudflare Pages), but the learnmethethreat.com domain still needs to be purchased from a registrar (~$10-15/yr); this is a manual account/billing step outside what Claude can do

## Context

- User's technical background: new grad, physics → SWE, limited full-stack experience. Explicitly does not want this project to double as a "learn web dev" exercise — wants a working site with minimal ceremony, not a teaching vehicle for the build process itself.
- Design reference/tone model: learnmeabitcoin.com — casual voice, rigorous ground-up explanations.
- Aesthetic goal: "lean and hand-built," not templated — minimal, confident, understated, text is the star.
- Content pipeline is collaborative: user writes rough thoughts/structure, Claude helps polish into finished posts; both need to be able to edit the same Markdown/LaTeX source files.
- Domain (learnmethethreat.com) is not yet registered.

## Constraints

- **Budget**: Effectively $0 for hosting — must use a free static hosting tier (Cloudflare Pages chosen). Domain registration is a separate, small, one-time-ish cost the user will handle themselves.
- **Tech stack**: Must support Markdown authoring with LaTeX math rendering (KaTeX) out of the box or via well-established plugins; must build to static output deployable on Cloudflare Pages.
- **Maintainability**: User doesn't want to maintain custom app code beyond what's needed — favor a static site generator with strong Markdown/math support over a hand-rolled framework app.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site generator + Markdown/LaTeX (KaTeX), no CMS | Matches "lean and hand-built" goal, zero hosting cost, avoids maintaining a backend/admin UI the user doesn't want | — Pending |
| Hosting: Cloudflare Pages | Free static hosting with custom domain support and built-in privacy-friendly analytics, avoiding a separate analytics integration | — Pending |
| No Series/Topics page in v1, but tags captured from day one | Avoids building a UI with too little content to organize yet, while not losing the data needed to add it later | — Pending |
| Editing via local Markdown files + git, no web admin UI | User and Claude both edit the same source files directly; simplest possible workflow, matches "not a teaching vehicle for site-building" | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-03 after initialization*
