# Phase 1: Scaffolding & Core Content Pipeline - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

An Astro static site scaffolded end-to-end: a homepage listing posts, an about page, a working top nav, and individual post pages that render real Markdown content with build-time LaTeX math (KaTeX), heading anchors, and syntax-highlighted code blocks. Content is authored as local Markdown files with typed frontmatter (title, date, tags, excerpt, slug, draft) validated via Astro Content Collections. This phase proves the full content pipeline works, not final visual design (Phase 2) or discovery/deployment polish (Phases 3-4).

</domain>

<decisions>
## Implementation Decisions

### Seed content
- **D-01:** No real draft exists yet. Claude writes a short placeholder post with real LaTeX math (inline and block) and at least one heading, purely to prove the build pipeline end-to-end. This will be swapped for real content later.
- **D-02:** Only 1 post is needed to satisfy Phase 1's success criteria — homepage list + single post page. Multi-item list visuals (spacing between several items) are not required to be proven this phase.
- **D-03:** Draft/unpublished workflow uses a `draft: true` boolean field in frontmatter, in the same `posts` content collection (not a separate folder). Build-time filtering hides draft posts from the homepage list until the flag is flipped. The Content Collections Zod schema must include this field.

### Frontmatter schema
- **D-04:** Tags are **freeform strings** (`z.array(z.string())`), not a locked Zod enum. The user explicitly does not want a fixed taxonomy yet — they don't know full topic coverage. Do not lock categories in this phase; revisit if/when the Series/Topics page (deferred, v2 GROW-01) gets built.
- **D-05:** Post slugs come from an **explicit `slug` field in frontmatter**, not derived from the filename. This means the URL survives file renames. The Zod schema needs a required `slug: z.string()` field, and the dynamic route (`src/pages/posts/[slug].astro` or equivalent) must key off this field, not the collection entry's filename-derived `id`.
- **D-06:** The placeholder post's slug should be thematically appropriate (quantum/Bitcoin-related, e.g. something like `why-quantum-computers-threaten-bitcoin`) rather than a generic "hello world" — exact wording left to Claude's discretion.
- **D-07:** The placeholder post's tag can be any reasonable string (e.g. "Quantum Algorithms") since it's expected to be swapped out with the real taxonomy later — exact value is Claude's discretion.

### About page
- **D-08:** Claude writes placeholder About page copy — generic for now (physics background, writing about quantum threats to Bitcoin, no specific credentials/details). The user will write and drop in their own real copy later; Claude just needs to wire up the `/about` route and page so PAGE-03 is functionally satisfied.

### Claude's Discretion
- Exact wording/content of the placeholder post (title, body text, headings) beyond having real LaTeX math and a thematically appropriate slug.
- Exact wording of the placeholder About page copy, kept generic per D-08.
- Content Collections schema details not explicitly decided above (e.g., date field format, excerpt field type/length) — standard Zod schema patterns apply.
- Anchor-link ID generation scheme for headings (CONT-03) — standard kebab-case slugification.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract
- `.planning/phases/01-scaffolding-core-content-pipeline/01-UI-SPEC.md` — Locks Phase 1 visual/interaction contract: system-font-only typography (no custom webfont yet — DSGN-02 accent font is Phase 2), single light-only color surface (DSGN-03 dark mode is Phase 2), spacing scale, heading-anchor hover behavior, Shiki syntax highlighting via Astro's built-in integration, nav layout, and homepage post-list layout. Do not introduce dark mode, custom fonts, or icon libraries in this phase — explicitly deferred to Phase 2 per the UI-SPEC's own rationale.

### Project-level requirements and stack
- `.planning/PROJECT.md` — Core value, writing style guide (for cleaning up the placeholder/real posts later), and the confirmed tech stack table (Astro ^7.3, remark-math, rehype-katex, katex).
- `.planning/REQUIREMENTS.md` — CONT-01 through CONT-04 and PAGE-01 through PAGE-04 are this phase's requirement set; DISC/ANLY/DEPL requirements belong to later phases and must not be pulled in early.
- `.planning/ROADMAP.md` (Phase 1 section) — Goal statement and the 5 success criteria this phase must satisfy.

No other specs, ADRs, or external docs were referenced during this discussion.

</canonical_refs>

<code_context>
## Existing Code Insights

This is a greenfield repository — no scaffolded code exists yet (`ls` shows only `CLAUDE.md`). There are no existing components, patterns, or integration points to reuse. The 01-UI-SPEC.md confirms: no shadcn/component library, no icon library, plain `.astro` components + semantic HTML, system font stack only (Phase 1).

### Reusable Assets
- None — this phase creates the initial scaffold from `npm create astro@latest` (minimal/empty template) per PROJECT.md's stack decision.

### Established Patterns
- None yet — this phase establishes the first patterns (Content Collections schema, dynamic post route, layout structure) that later phases will follow.

### Integration Points
- Astro Content Collections (`src/content.config.ts`) is the single source of truth for post data — the homepage list, individual post pages, and (in later phases) RSS/sitemap/OG tags all read from this same typed collection.

</code_context>

<specifics>
## Specific Ideas

- Placeholder post slug should read as thematically on-brand (quantum computing + Bitcoin), not a generic "hello world" or "test post" — even though it's throwaway content, per D-06.
- The `draft: true` frontmatter flag pattern (D-03) should be architected now since the user will be authoring real posts iteratively and will want to hide in-progress posts from the live homepage without deleting/moving files.

</specifics>

<deferred>
## Deferred Ideas

- Tag taxonomy lock (fixed Zod enum for tags) — deferred until the user has enough posts to know what categories actually make sense. Revisit alongside the Series/Topics page (v2 GROW-01, currently out of scope for the whole v1 roadmap).
- Real About page copy and real first post content — user will supply both later; Phase 1 only needs the plumbing (routes, schema, rendering) to work with placeholder content.

### Reviewed Todos (not folded)
None — no pending todos existed for this phase.

</deferred>

---

*Phase: 1-scaffolding-core-content-pipeline*
*Context gathered: 2026-09-03*
