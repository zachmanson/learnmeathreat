# Phase 1: Scaffolding & Core Content Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 01-scaffolding-core-content-pipeline
**Areas discussed:** Seed content readiness, Tag taxonomy, Post slug source, About page content

---

## Seed content readiness

| Option | Description | Selected |
|--------|-------------|----------|
| I have a draft ready | You'll supply actual Markdown+LaTeX content before/during execution | |
| Write a placeholder | Claude writes a short throwaway post with real LaTeX math to verify the pipeline | ✓ |
| You decide | Claude picks based on what's fastest to unblock the phase | |

**User's choice:** Write a placeholder.
**Notes:** No real draft exists yet; placeholder gets swapped later.

| Option | Description | Selected |
|--------|-------------|----------|
| Just 1 | Minimum to prove a single post page + homepage entry works | ✓ |
| 2-3 posts | Enough to see real list ordering, spacing, varied tags | |

**User's choice:** Just 1 post is enough for Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| Separate drafts folder | e.g. /drafts/ outside the content collection | |
| Draft flag in frontmatter | `draft: true` in the same posts collection, filtered at build time | ✓ |

**User's choice:** Draft flag in frontmatter.
**Notes:** Schema needs a `draft` boolean field.

---

## Tag taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Lock fixed list now | Zod enum, catches typos, but adding a category later means editing the schema | (initially selected, then reversed) |
| Freeform strings for now | z.array(z.string()), no typo protection but zero friction | ✓ (final) |

**User's choice:** Freeform strings — final answer, after initially picking "lock fixed list now" and then correcting: "I don't want anything locked in yet i dont know whawt im covering."
**Notes:** The follow-up question about using PROJECT.md's example three categories (Bitcoin Fundamentals, Quantum Algorithms, Other Chains) as the enum was overridden by this correction — no enum ships in Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| Any reasonable tag is fine | Placeholder post's tag doesn't need to be exact | ✓ |
| You decide | Claude picks something sensible | |

**User's choice:** Any reasonable tag is fine.

---

## Post slug source

| Option | Description | Selected |
|--------|-------------|----------|
| From filename | Filename becomes URL slug automatically; renaming the file breaks the URL | |
| Explicit frontmatter field | `slug:` field independent of filename; survives file renames | ✓ |

**User's choice:** Explicit frontmatter field.

| Option | Description | Selected |
|--------|-------------|----------|
| Something quantum/Bitcoin-related | Thematically appropriate placeholder slug | ✓ |
| You decide | Claude picks any reasonable working title/slug | |

**User's choice:** Something quantum/Bitcoin-related. Exact wording left to Claude.

---

## About page content

| Option | Description | Selected |
|--------|-------------|----------|
| I'll write it myself | User supplies real About text; Claude just wires up the route | |
| Write a placeholder | Claude writes short placeholder copy to be replaced later | ✓ |

**User's choice:** Write a placeholder.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it generic for now | Placeholder gestures at physics background / quantum threats without specifics | ✓ |
| I'll specify details | User describes specific credentials/background to include | |

**User's choice:** Keep it generic for now.

---

## Claude's Discretion

- Exact wording/content of the placeholder post (title, body, headings) beyond real LaTeX math and a thematically appropriate slug.
- Exact wording of the placeholder About page copy (kept generic).
- Content Collections schema details not explicitly decided (date format, excerpt field type/length).
- Heading anchor-link ID generation scheme (standard kebab-case).

## Deferred Ideas

- Locking a fixed tag taxonomy (Zod enum) — revisit once the user knows their full topic coverage, alongside the deferred Series/Topics page (v2 GROW-01).
- Real About page copy and the real first post — user supplies both later; Phase 1 only needs the plumbing to work with placeholder content.
