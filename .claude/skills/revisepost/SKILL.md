---
name: revisepost
description: Use when the user wants to revise a Learn Me a Threat blog post draft — pasted text, or a reference to a file like "cryptography.md" — for flow, technical accuracy, and matching the user's own writing voice. Also use when drafting new prose for a post (an added example, paragraph, or section).
---

# Revise Post

## Overview

Revises a Learn Me a Threat draft for flow, technical accuracy, and voice — without smoothing it into generic polished blog prose. Two input modes: pasted draft text, or a post filename under `src/content/posts/`.

## When to Use

- User pastes raw draft text and asks for revision, feedback, or cleanup.
- User names a post file ("revise cryptography.md", "clean up hash-functions", "look at digital-signatures").
- Claude drafts new prose for a post (e.g. adding a real-world example). Every voice rule below applies to new prose exactly as it does to revisions; drafting from scratch is where the AI sound creeps in most.
- NOT for scaffolding new posts, frontmatter/schema changes, or site features — that's regular feature work, not this skill.

## Process

1. **Get the draft.**
   - Pasted text: use it as given.
   - Filename: read `src/content/posts/{name}.md` (accept the name with or without `.md` or the full path). If the file doesn't exist or the name is ambiguous, ask rather than guessing.

2. **Load the Writing Rules section below before touching a word.** It is the single source of truth for the user's voice and style. When the user states a new rule or refines one, update that section; memory only records why each rule exists.

3. **Revise for these things, in this order:**
   - **Technical accuracy** — verify every factual/technical claim in the draft. If something is wrong or unverifiable, flag it explicitly and ask; do not silently "fix" it into something that sounds plausible. When a fix is approved, make it in as few words as the accuracy needs. Fact-check fixes tend to pile on qualifiers ("Strictly speaking"), signposts ("as we're about to see", "which we'll get to below"), and detail the reader doesn't need (exact deprecation tiers); cut those and keep the one corrected fact.
   - **Prerequisites** — read every earlier post in the series (by `date` in frontmatter), not just the one being revised. Flag any concept the draft *relies on* that no earlier post (or earlier in this post) explains. A reader should be able to follow every argument using only what came before. A sentence whose point depends on an unexplained concept ("it lines up for textbook RSA") is never fine. Name-dropping a concept from a later post ("the miner", "more on this in mining") is also out, even with a link and even when the reader doesn't need it: describe the thing plainly with words the series already has ("whoever adds the transaction to the blockchain") and leave it there, without a forward pointer. Fix by cutting the reference, describing it plainly, or noting it needs an earlier explanation. Back-references ("from earlier", "as we saw") must point to something an earlier post actually explains, not just names; check the earlier post before writing one.
   - **Reader readiness (agent)** — after your own prerequisites pass, spawn one `general-purpose` agent with the prompt in "Reader-readiness agent prompt" below, filling in the post path and the earlier posts in date order. It reads only the earlier posts plus the draft, so it isn't primed by the revision you're doing. Its job is wording, not missing explanations: words, phrases, and ideas the reader hasn't been given yet, even when the point being made is fine (e.g. "block", "the person adding blocks", "two Bitcoins" before forks). Merge its findings into your own; each one gets a plain rewording that keeps the point, built only from words the reader already has. Drop findings that are deliberate simplifications or that an earlier post really does cover (check before dropping). Run it on every full-post revision, not on a pasted paragraph or a short piece of new prose.
   - **Notation** — read `docs/notation.md` and check every symbol against it. Flag a global symbol used for something else, or a local variable that shadows a global one in the same post. If the draft introduces a new symbol that later posts will reuse, propose adding it to the table (and update the table once the user approves).
   - **Structure/ordering** — rough drafts jump around; reordering paragraphs, sections, or even where an idea gets introduced is fair game, not just sentence-level editing. If reordering would improve the post, do it (or propose it) rather than leaving ideas in the order they were dumped in. Call out any reordering explicitly in the summary of changes so it's not a surprise on read-through.
   - **Flow** — split run-ons, cut redundant clauses, tighten transitions. Use the lightest touch that actually fixes the problem (fragment, typo, duplicated phrasing, grammar) rather than rewriting into a cleaner or more symmetric version. Repetition or rough rhythm that isn't actually broken is part of the voice — leave it. Do the since/as, comma, and pronoun passes from Writing Rules here.
   - **Voice** — conversational and rigorous at the same time. Talk to the reader directly ("you", contractions, telling a story in the order it happened), but keep the real math: show the equation that makes the point instead of just describing it, and explain *why* the thing works, not only *that* it does. Rhetorical questions are fine when they set up what comes next ("Does this look familiar?"), not as a dramatic hook. Keep it blunt and plain: no "Let's dive in" framing, em dashes, softening hedges, or a tidy closer sentence that wasn't there in some form already. When unsure whether a change adds polish vs. genuinely improves clarity, prefer cutting over adding flourish.

4. **Show the revision — never overwrite silently.** Present the revised text (inline, or as a diff against the file if working from one), with a short list of what changed and why. Put fact-check flags up front, separate from style edits, so they don't get lost.

5. **Write only on confirmation.** If the user approves and you were working from a file, write the revision back preserving frontmatter exactly, unless the user explicitly asked to change it too.

## Writing Rules

Every rule applies to revisions and to new prose drafted for a post.

### Voice

- No TED-talk polish — restructure for effect, but keep phrasing blunt/plain, not rhetorical or crafted-sounding. No copywriting hooks ("sounds like science fiction until you...", "that's not a stretch").
- Avoid the "AI sound": don't tidy sentences into neat parallel constructions ("That's X, and it's also Y") or wrap a paragraph with a punchy aphoristic closer. Both read as machine-generated even when grammatically fine.
- Banned AI patterns: no "Ron Weasleyisms" ("Not X, not Y, Z!", "It's not X, it's Y"), no corporate framing ("Here's the sharper read", "the load-bearing piece", "Here's the thing"), no sycophantic beats ("honestly? That's rare"). Never introduce these, and don't use them in the change summary either. A genuine one the user wrote in their own draft can stay. If a real contrast matters, state the true thing directly and mention the wrong idea plainly in its own sentence if needed at all.
- No short punchy lines: a sentence of a few words used as a beat or setup ("With ECDSA, that's easy.", "Nobody needs your private key to do this.", "The problem is the `txid`.") reads as AI. Fold the point into a full sentence that carries the actual fact ("You don't need the private key to do this, so anyone who sees your transaction could...").
- Don't write wall-to-wall fact density: a run of paragraphs that are each four or five compact declarative statements, with no asides, reads as AI even when every sentence follows the rules (Zach on the witness/SegWit draft: "lost that touch that I think makes it feel like a human wrote it"). Keep the human texture the user's own sections have: side facts in `:::note`s, parenthetical asides, back-references to earlier in the post ("Remember that $m$..."), the reader's obvious question asked before it's answered ("so why does it matter?"), casual framing ("To be fair", "basically", "pretty much"). History especially shouldn't read like an encyclopedia timeline. Never invent the user's opinions to add texture; use the user's own words from their notes where they exist.
- Plain and specific: every sentence carries a concrete fact or the user's own take. Stock filler sounds informative but says nothing; cut it or swap in a real fact. Typical offenders: vague superlative credentials ("one of the oldest and most widely used schemes out there") canned transitions into an example ("This isn't just a theoretical worry either", "To see why this matters, here's a real example"), and stock tutorial phrasing ("let's see X in action"). Introduce an example plainly in first person, with the actual reason for it ("I'll go through how RSA works with a small example, since it comes up again in the signatures post").
- When drafting new prose, write in first person and use the user's own habits: "basically", "actually", "I'll note that", "However,", rhetorical questions.
- Reader's vocabulary: name things the way the reader would, using only terms the series has already explained. Unexplained insider terms ("hardware security module", "signing oracle", "CPU core-years") get described plainly instead ("a device whose job is to sign things").
- Before the blocks post: "block" is defined in transactions.md only as a group of transactions recorded together, about one every 10 minutes. Use it only where the point is size (the 1 MB limit, weight). Never say "blockchain", and never rely on who makes blocks, how they're chained or numbered, signalling, or forks. Describe those plainly ("whoever records transactions", "different records of which transactions happened") or cut them.
- Pronouns, as established in `asymmetric-and-symmetric-cryptography.md`: "you" is the reader as protagonist in a scenario ("you want to send someone bitcoin"); "we" is author and reader working through math or reasoning together ("let's look at the group"); "I" is the author commenting on the post itself (scope, asides, opinions: "I'm not going to walk you through..."). Flag mismatches, e.g. "We are back at stage one" should be "You are back at stage one" because it describes the reader's scenario.

### Mechanics

- Run-on sentences — split them, don't just add commas. Don't over-correct into choppy short sentences either; break up only the ones visibly overloaded with clauses.
- No sentences starting with "And". Merge into the previous sentence or start directly with the content ("Also, ..." works).
- No em dashes, ever. Hard rule, not a style preference. Use a period, comma, or two sentences instead.
- "since" vs "as": the user mixes these up. "Since" signals time ("since post one") or causation ("since nobody's broken it"); "as" fits simultaneity or a looser "given that". Check each one and correct it.
- Commas: check for missing commas (clause boundaries, lists) and extraneous ones (between subject and verb, splitting a clause that shouldn't be split). Fix since/as and comma errors silently unless the fix changes meaning.
- One meaning per word: if a word is a technical term in the post (the *version* byte), don't also use it casually for something else (compressed vs uncompressed "version" of a key). Pick a different word, ideally one the post already uses ("format"). Scan for casual uses of words like version, format, key, hash, address, point, order, prefix.
- Strunk & White as the mechanics tiebreaker, using the specific rules in the "Strunk & White Rules" section below, but only within what the user could plausibly write. It never overrides the casual tone.

### Accuracy

- Fact-check technical claims, but don't flag a deliberate simplification made for reader accessibility as an error. A simplification is fine when the omitted nuance doesn't matter for anything the series builds on later.
- Check precise scope and naming, not just whether a claim is directionally true: which exact variant of a technique is meant, whether two related-but-distinct things are conflated. Example: Grover's algorithm strictly means the single-marked-element search; the multiple-marked case is a generalization. Shor's algorithm was for integer factorization; the discrete log version is a related adaptation. Flag these, and let the user decide whether the post needs the distinction.

### Math and notation

- Show, don't tell: when a sentence describes in words what an equation could show ("the private key is another exponent, chosen so that..."), show it. If the equation alone makes it clear, the equation is enough. Use a worked example in small numbers the reader can check by hand (like the mod 11 table or the mod 7 curve) only when the idea is hard to see from the equation alone; run the example first, then give the general equation that explains why it worked. Verify every number in an example with a script before showing it.
- Math layout: anything longer than a short inline expression (a quick $x = 5$, a symbol or two) goes on its own line as a `$$...$$` display equation. A display equation is still part of the sentence: the sentence runs into it and, where it makes sense, continues after it ("Encrypting gives $$c = 4^3 \equiv 31 \pmod{33},$$ and decrypting gives back..."). Punctuate it like the words around it, with the comma or period inside the `$$`. Don't introduce it with a colon and a stand-alone label sentence ("signing and verifying look like:").
- Hash function names are always math with their real hyphenated names, in prose and equations alike: `$\operatorname{SHA-256}$`, `$\operatorname{RIPEMD-160}$`, `$\operatorname{HASH160}$` (no hyphen in HASH160's real name). Double SHA-256 is `$\operatorname{SHA-256}^2$`, defined once in transactions.md; don't write it nested after that. KaTeX renders the hyphen as a hyphen, not a minus. MD5 and SHA-1 (historical examples in hash-functions.md) stay plain text; ask before extending the rule to them.

### Structure

- Section headers say what the section is about, conversationally ("The problem hashing doesn't solve", "Hash functions that broke"). Never generic structural headers ("Opening", "Introduction", "Motivation", "Wrapping up", "Conclusion"); flag existing ones.
- Endings: a closing of only a paragraph or two gets no section of its own; fold it into the last real section with no header. End plainly ("Next I'm going into Bitcoin itself and how it works."), not with teaser phrasing ("...is the subject of the next post").
- Cross-post links: never "the [digital signatures post](...)" or "in the locking scripts post". Link the specific thing being referenced, with no meta talk about posts: "the [order of $G$](/posts/digital-signatures/)", "the [birthday bound](/posts/hash-functions/)".
- Definition boxes (`:::definition`): the box must match the real thing exactly, never simplified. Simplify in the prose around it instead, because a reader should never have to unlearn a definition. Type every field with its size or shape ("32-bit index", "256-bit transaction identifier", "variable-length list of variable-length byte strings"), and give a size limit only when there's a single real one. Describe fields using only words the series has already explained ("the network", not "the blockchain" before blocks are covered). Prefer simpler wording inside the box over an apology note after it. Link to an earlier definition ("has the same form as a [UTXO](/posts/utxos/)") instead of restating it. Whether these rules extend beyond definition boxes (e.g. a field table in prose) is undecided; ask when that comes up.
- Unnumbered lists: no bullet markers. Put each item on its own line with a trailing backslash (a Markdown hard break), and punctuate the whole list as one running sentence: lowercase item starts, commas between items (semicolons when items contain their own commas), "and" before the last item, and a period at the end. Numbered lists keep their own style (capitalized items ending in periods) and are never converted to this form. Whether a list (including one in a definition box) is numbered or unnumbered is the user's style call for that spot; don't convert between them either way.

### Figures

- A caption explains everything in the figure and nothing beyond it: what the whole figure shows, what each part or panel is (by its in-figure label), and what every colour, shading, or line style represents. Walk each visual element and check the caption names it. Avoid colours that flip in dark mode (SVGs are inverted): say "unshaded", not "white".

## Reader-readiness agent prompt

Fill in `{POST}` and `{EARLIER_POSTS}` (paths under `src/content/posts/`, oldest first by frontmatter `date`, including `bitcoin.md`-style section intros).

```
You are checking a blog post for words and ideas its reader isn't ready for yet. The blog is a series meant to be read in order by someone with zero background, and every concept must be explained before it's used.

1. Read these earlier posts, in this order: {EARLIER_POSTS}. As you read, write down a glossary of what the reader actually knows after them: each term or idea, and whether it was explained (what it is and how it works) or only named (mentioned, no explanation). A bullet list of upcoming post titles counts as named only.
2. Read {POST}. Pretend you only know your glossary, not Bitcoin or cryptography. Go sentence by sentence and flag anything that leans on knowledge outside the glossary or outside what this post itself explained earlier:
   - terms that were never introduced, or only named (e.g. "block" when the reader only knows the word "blockchain");
   - roles or actors that haven't appeared ("block producers", "the people adding blocks");
   - phrasing that assumes a later mechanism ("signal", "locked in", "split off", "two Bitcoins", block numbers, "recorded" used as if the reader knows how recording works);
   - back-references to something an earlier post or section only named, not explained;
   - forward pointers or name-drops of later topics.
   Watch the second half of the post closely; that's where drift usually happens.
3. Don't flag: things explained earlier in the same post, deliberate simplifications, general English, or math the earlier posts covered.

Report each finding as: line number, the exact quote, what the reader is missing (and whether the glossary has it as named-only or not at all), and a suggested plain rewording that keeps the author's point using only glossary words. Then give the glossary entries you relied on for the borderline calls. Don't edit any files.
```

## Strunk & White Rules

From *The Elements of Style*. Apply these when fixing a sentence that's actually broken or bloated. Don't use them as an excuse to rewrite sentences that already work.

**Apply:**
- **Omit needless words.** "The fact that", "in order to", "it is important to note that", "what this means is" usually go.
- **Use the active voice.** "Alice signs the message" over "the message is signed by Alice", unless the actor genuinely doesn't matter.
- **Put statements in positive form.** "Forgot" over "did not remember", "insecure" over "not very secure".
- **Use definite, specific, concrete language.** Name the actual thing (the private key, 256 bits) rather than a vague stand-in ("the relevant information").
- **Make the paragraph the unit of composition.** One idea per paragraph. If a paragraph covers two ideas, split it. This pairs with reordering drafts.
- **Avoid a succession of loose sentences.** A run of "X, and Y" / "X, so Y" sentences is what the run-on rule is about; vary by splitting.
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
| A sentence sounds informative but has no specific fact in it | Cut it, or replace it with a concrete fact |
| A sentence explains a mechanism in the abstract | Show it with the equation; add a small worked example only if the equation alone isn't clear |
| Inline math longer than a few characters | Move it to its own `$$...$$` display line |
| SHA-256 / RIPEMD-160 / HASH160 in plain text | Convert to `$\operatorname{...}$` with the real hyphenated name |
| Definition box | Complete and correct, every field typed, reader-known words only, link earlier definitions |
| Unnumbered list | No bullets; backslash line breaks; punctuate as one sentence |
| Generic header ("Wrapping up") or tiny closing section | Rename by content, or fold the closing into the last section |
| Figure caption | Name every element; nothing beyond the figure |
| Prose uses a term the series hasn't explained | Describe the thing plainly instead |
| Revision reads "too clean" / neatly symmetric | Redo with the lightest touch that fixes the actual problem, don't rewrite for polish |

## Common Mistakes

- Smoothing the draft into generic "polished blog" voice — the user has explicitly said not to do this; it's the opposite of the point of this skill.
- Silently correcting a technical claim instead of surfacing it for the user to confirm.
- Overwriting the file before the user has seen and approved the revision.
- Treating a deliberate simplification for reader accessibility as an error to fix.
- Using an em dash anywhere in a revision.
- Rewriting a rough sentence into a tidy, symmetric one, or capping a paragraph with a neat summary sentence — both read as AI-generated even without banned words.
