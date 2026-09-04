---
quick_id: 260904-icf
slug: about-page-copy
date: 2026-09-04
---

# Quick Task: About page copy

## Description

Replace the placeholder About page copy in `src/pages/about.astro` with finalized
copy, worked out directly with the user in conversation (drafted by the user,
cleaned for structure/flow while preserving voice, revised twice per user
feedback — cut a cheesy sign-off, cut a "blogger" label, restored original
phrasing the smoothing pass had flattened).

## Content (final, user-approved)

1. Bio paragraph — Physics Master's, quantum computing threats to Bitcoin and
   other cryptocurrencies.
2. Motivation paragraph — likes teaching/"yapping," blog fills that outlet.
3. Credibility paragraph — not claiming expert status, but has a paper on
   arXiv (link: https://arxiv.org/abs/2607.23952, embedded on the word "arXiv"),
   in the process of being published.
4. Scope/goal paragraph — "museum of my thoughts," aims for comprehensive
   coverage of the broader quantum-vs-cryptocurrency landscape, not just Bitcoin,
   not exhaustive on every attack/edge case.
5. Accessibility paragraph — no prior knowledge assumed, ground-up rigor.
6. Attribution paragraph — inspired by learnmeabitcoin.com by Greg Walker
   (link: https://learnmeabitcoin.com, embedded on "learnmeabitcoin.com").
7. Disclaimer paragraph — dislikes writing, AI (Claude)-assisted drafting
   process disclosed plainly, no closing sendoff line.

## Task

<task type="auto">
  <name>Task 1: Replace about.astro placeholder copy</name>
  <files>src/pages/about.astro</files>
  <action>
    Replace the placeholder `<h1>`/`<p>` block and its preceding HTML comment
    with the finalized 7-paragraph copy above. Keep the existing `<Layout
    title="About">` wrapper and `<h1>About</h1>` unchanged. Use plain
    `<a href="...">text</a>` links matching the convention already used in
    src/pages/index.astro (no markdown link syntax — this is a `.astro` file).
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `src/pages/about.astro` no longer contains the placeholder comment or its
      original 3-paragraph filler text
    - Built `dist/about/index.html` contains an `<a href="https://arxiv.org/abs/2607.23952">`
      and an `<a href="https://learnmeabitcoin.com">`
    - `npm run build` succeeds; `npm test` still passes (about page structure
      unaffected — no test asserts on About's copy specifically)
  </acceptance_criteria>
</task>

## Output

Create `.planning/quick/260904-icf-about-page-copy/260904-icf-SUMMARY.md` when done.
