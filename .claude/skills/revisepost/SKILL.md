---
name: revisepost
description: Use when the user wants to revise a Learn Me a Threat blog post draft — pasted text, or a reference to a file like "cryptography.md" — for flow, technical accuracy, and matching the user's own writing voice.
---

# Revise Post

## Overview

Revises a Learn Me a Threat draft for flow, technical accuracy, and voice — without smoothing it into generic polished blog prose. Two input modes: pasted draft text, or a post filename under `src/content/posts/`.

## When to Use

- User pastes raw draft text and asks for revision, feedback, or cleanup.
- User names a post file ("revise cryptography.md", "clean up hash-functions", "look at digital-signatures").
- NOT for scaffolding new posts, frontmatter/schema changes, or site features — that's regular GSD work, not this skill.

## Process

1. **Get the draft.**
   - Pasted text: use it as given.
   - Filename: read `src/content/posts/{name}.md` (accept the name with or without `.md` or the full path). If the file doesn't exist or the name is ambiguous, ask rather than guessing.

2. **Load the user's voice guidance before touching a word.** Check memory for entries covering:
   - Run-on sentences — split them, don't just add commas.
   - No TED-talk polish — restructure for effect, but keep phrasing blunt/plain, not rhetorical or crafted-sounding.
   - No sentences starting with "And".
   - Fact-check technical claims, but don't flag a deliberate simplification made for reader accessibility as an error.

   If memory has since accumulated more voice/style entries than these four, use the current versions — they're the source of truth, this list is just the known baseline.

3. **Revise for three things, in this order:**
   - **Technical accuracy** — verify every factual/technical claim in the draft. If something is wrong or unverifiable, flag it explicitly and ask; do not silently "fix" it into something that sounds plausible.
   - **Flow** — split run-ons, cut redundant clauses, tighten transitions. Keep the paragraph and section structure the user chose unless it's actively broken.
   - **Voice** — keep it blunt and plain. Don't add rhetorical questions, "Let's dive in" framing, scene-setting em dashes, or softening hedges. When unsure whether a change adds polish vs. genuinely improves clarity, prefer cutting over adding flourish.

4. **Show the revision — never overwrite silently.** Present the revised text (inline, or as a diff against the file if working from one), with a short list of what changed and why. Put fact-check flags up front, separate from style edits, so they don't get lost.

5. **Write only on confirmation.** If the user approves and you were working from a file, write the revision back preserving frontmatter exactly, unless the user explicitly asked to change it too.

## Quick Reference

| Situation | Action |
|---|---|
| User pastes text | Revise inline, no file write |
| User says "revise X.md" | Read `src/content/posts/X.md`, revise body only, keep frontmatter as-is |
| A technical claim looks shaky | Flag it explicitly and ask — don't guess a fix |
| Draft already reads blunt/plain | Leave the phrasing alone — don't polish for polish's sake |
| Simplification looks intentional (accessibility) | Leave it — that's not a fact-check hit |

## Common Mistakes

- Smoothing the draft into generic "polished blog" voice — the user has explicitly said not to do this; it's the opposite of the point of this skill.
- Silently correcting a technical claim instead of surfacing it for the user to confirm.
- Overwriting the file before the user has seen and approved the revision.
- Treating a deliberate simplification for reader accessibility as an error to fix.
