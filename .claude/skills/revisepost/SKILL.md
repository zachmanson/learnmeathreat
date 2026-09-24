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
   - No em dashes, ever. Hard rule, not a style preference.
   - Fact-check technical claims, but don't flag a deliberate simplification made for reader accessibility as an error.
   - Avoid the "AI sound": don't tidy sentences into neat parallel constructions ("That's X, and it's also Y") or wrap a paragraph with a punchy aphoristic closer. Both read as machine-generated even when grammatically fine.
   - Banned AI patterns: no "Ron Weasleyisms" ("Not X, not Y, Z!", "It's not X, it's Y"), no corporate framing ("Here's the sharper read", "the load-bearing piece", "Here's the thing"), no sycophantic beats ("honestly? That's rare"). Never introduce these, and don't use them in the change summary either.
   - Strunk & White as the mechanics tiebreaker, using the specific rules in the "Strunk & White Rules" section below, but only within what the user could plausibly write. It never overrides the casual tone.

   If memory has since accumulated more voice/style entries than these, use the current versions — they're the source of truth, this list is just the known baseline.

3. **Revise for these things, in this order:**
   - **Technical accuracy** — verify every factual/technical claim in the draft. If something is wrong or unverifiable, flag it explicitly and ask; do not silently "fix" it into something that sounds plausible.
   - **Structure/ordering** — rough drafts jump around; reordering paragraphs, sections, or even where an idea gets introduced is fair game, not just sentence-level editing. If reordering would improve the post, do it (or propose it) rather than leaving ideas in the order they were dumped in. Call out any reordering explicitly in the summary of changes so it's not a surprise on read-through.
   - **Flow** — split run-ons, cut redundant clauses, tighten transitions. Use the lightest touch that actually fixes the problem (fragment, typo, duplicated phrasing, grammar) rather than rewriting into a cleaner or more symmetric version. Repetition or rough rhythm that isn't actually broken is part of the voice — leave it.
   - **Voice** — keep it blunt and plain. Don't add rhetorical questions, "Let's dive in" framing, em dashes, softening hedges, or a tidy closer sentence that wasn't there in some form already. When unsure whether a change adds polish vs. genuinely improves clarity, prefer cutting over adding flourish.

4. **Show the revision — never overwrite silently.** Present the revised text (inline, or as a diff against the file if working from one), with a short list of what changed and why. Put fact-check flags up front, separate from style edits, so they don't get lost.

5. **Write only on confirmation.** If the user approves and you were working from a file, write the revision back preserving frontmatter exactly, unless the user explicitly asked to change it too.

## Strunk & White Rules

From *The Elements of Style*. Apply these when fixing a sentence that's actually broken or bloated. Don't use them as an excuse to rewrite sentences that already work.

**Apply:**
- **Omit needless words.** "The fact that", "in order to", "it is important to note that", "what this means is" usually go.
- **Use the active voice.** "Alice signs the message" over "the message is signed by Alice", unless the actor genuinely doesn't matter.
- **Put statements in positive form.** "Forgot" over "did not remember", "insecure" over "not very secure".
- **Use definite, specific, concrete language.** Name the actual thing (the private key, 256 bits) rather than a vague stand-in ("the relevant information").
- **Make the paragraph the unit of composition.** One idea per paragraph. If a paragraph covers two ideas, split it. This pairs with reordering drafts.
- **Avoid a succession of loose sentences.** A run of "X, and Y" / "X, so Y" sentences is what the run-on memory is about; vary by splitting.
- **Keep related words together.** Keep the subject near its verb and the modifier next to what it modifies. Watch for dangling modifiers ("Using a hash function, the signature..." when the signature isn't doing the using).
- **Express coordinate ideas in similar form.** This applies only to lists and series ("hash it, sign it, send it"). It is NOT permission for rhetorical symmetry or "Not X, but Y" constructions.
- **Comma basics.** No comma splices (two full sentences joined by just a comma); set off parenthetical phrases with a pair of commas, not one.
- **Write with nouns and verbs.** Cut stacked adjectives and adverbs that don't carry information.
- **Do not overstate.** No "incredibly", "fundamentally", "absolutely crucial" unless it's literally true.
- **Avoid fancy words.** "Use" over "utilize", "show" over "demonstrate", "start" over "commence".
- **Use figures of speech sparingly.** One analogy that explains something is good (this blog relies on them). Decorative metaphors are not.
- **Do not explain too much.** Balance this against the blog's core rule that every concept gets explained before it's used. Explain the concept once, then don't re-explain it or add "in other words" restatements.

**Deliberately ignored (they conflict with this blog's voice):**
- "Do not affect a breezy manner": the blog is casual on purpose.
- "Do not inject opinion": the user's takes are part of the point.
- "Avoid qualifiers" ("really", "pretty", "honestly"): cut them when they pile up, but some are part of how the user talks. Leave the occasional one alone.
- "Place the emphatic words at the end": following this aggressively produces punchy closer sentences, which are banned.

## Quick Reference

| Situation | Action |
|---|---|
| User pastes text | Revise inline, no file write |
| User says "revise X.md" | Read `src/content/posts/X.md`, revise body only, keep frontmatter as-is |
| A technical claim looks shaky | Flag it explicitly and ask — don't guess a fix |
| Draft already reads blunt/plain | Leave the phrasing alone — don't polish for polish's sake |
| Simplification looks intentional (accessibility) | Leave it — that's not a fact-check hit |
| Ideas are out of order / draft jumps around | Reorder freely — flag the reorder in the change summary, don't just leave it because "that's how they wrote it" |
| Revision uses an em dash | Remove it — this is a hard no, not a judgment call |
| Revision contains "Not X, but Y" / "It's not X, it's Y" | Rewrite to state the true thing directly |
| Revision reads "too clean" / neatly symmetric | Redo with the lightest touch that fixes the actual problem, don't rewrite for polish |

## Common Mistakes

- Smoothing the draft into generic "polished blog" voice — the user has explicitly said not to do this; it's the opposite of the point of this skill.
- Silently correcting a technical claim instead of surfacing it for the user to confirm.
- Overwriting the file before the user has seen and approved the revision.
- Treating a deliberate simplification for reader accessibility as an error to fix.
- Using an em dash anywhere in a revision.
- Rewriting a rough sentence into a tidy, symmetric one, or capping a paragraph with a neat summary sentence — both read as AI-generated even without banned words.
