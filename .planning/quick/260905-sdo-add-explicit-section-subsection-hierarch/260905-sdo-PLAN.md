---
phase: quick/260905-sdo
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [NAV-SECTION-01]
files_modified:
  - src/content.config.ts
  - src/content/posts/cryptography.md
  - src/lib/chapter-order.ts
  - src/components/LeftNavSidebar.astro
  - src/pages/posts/[slug].astro
  - src/styles/nav-sidebars.css
  - tests/reading-navigation.test.mjs

must_haves:
  truths:
    - "The Cryptography accordion shows cryptography.md first with heading weight, and its 3 sibling posts indented beneath it"
    - "The Quantum Algorithms accordion renders exactly as it does today (flat, no indentation, no weight change)"
    - "The cryptography.md page shows an 'In this chapter' box listing its 3 subsection posts and not itself"
    - "No non-section post renders the 'In this chapter' box"
    - "Active-page highlighting still works whether the current page is the section post or a subsection post"
  artifacts:
    - path: "src/lib/chapter-order.ts"
      provides: "splitChapter() section/subsection partition helper"
      contains: "export function splitChapter"
    - path: "src/styles/nav-sidebars.css"
      provides: "nav-section / nav-subsection / chapter-toc rules using only existing tokens"
      contains: "nav-subsection"
    - path: "tests/reading-navigation.test.mjs"
      provides: "tests 17-20 covering hierarchy, flat fallback, and mini-ToC"
  key_links:
    - from: "src/components/LeftNavSidebar.astro"
      to: "src/lib/chapter-order.ts"
      via: "splitChapter import"
      pattern: "splitChapter"
    - from: "src/pages/posts/[slug].astro"
      to: "src/lib/chapter-order.ts"
      via: "getChapters + splitChapter for the mini-ToC"
      pattern: "splitChapter"
---

<objective>
Introduce an explicit two-level chapter hierarchy: one post per chapter may be marked
`section: true` (the chapter's intro page); the rest become its subsections. That
hierarchy is expressed in the left sidebar (heading-weight section entry + indented
subsections) and via a small "In this chapter" ToC box rendered only on the section page.

Purpose: readers currently see every chapter as an undifferentiated flat list, so the
intro post that frames a chapter looks like a peer of the posts it introduces.
Output: schema field, one shared partition helper, sidebar hierarchy, mini-ToC box,
and tests including the "chapter has no section post" flat fallback.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/lib/chapter-order.ts
@src/components/LeftNavSidebar.astro
@src/pages/posts/[slug].astro
@src/styles/nav-sidebars.css
@tests/reading-navigation.test.mjs

<interfaces>
Existing exports from src/lib/chapter-order.ts:
```typescript
export async function getChapters(): Promise<Map<string, CollectionEntry<'posts'>[]>>;
export async function getReadingOrder(): Promise<CollectionEntry<'posts'>[]>;
```

Existing spacing tokens (src/styles/global.css :root) — the complete set, no new ones:
`--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 16px`, `--space-lg: 24px`,
`--space-xl: 32px`, `--space-2xl: 48px`, `--space-3xl: 64px`.
Color tokens: `--bg`, `--surface`, `--accent`, `--text`, `--muted`.

Existing heading accent (src/styles/global.css, h1 and h2,h3 only — there is NO
reusable class, only element selectors):
```css
font-weight: 600;
font-family: 'Newsreader', Georgia, "Times New Roman", serif;
```

Existing callout box appearance to visually match (src/styles/prose.css):
```css
.callout        { background: var(--surface); border-left: 3px solid var(--muted);
                  padding: var(--space-sm) var(--space-md); margin: var(--space-lg) 0; }
.callout-note   { border-left: 3px solid var(--accent); }
```
Note `.callout-note > :first-child::before { content: "Note: "; }` — this is why the
mini-ToC must NOT reuse the `.callout` classes; it would inherit a "Note: " label.

Existing indent precedent in nav-sidebars.css:
```css
.right-nav ul ul { padding-left: var(--space-md); }
```

Existing active-link rule in nav-sidebars.css (specificity 0,2,1):
```css
.left-nav a[aria-current="page"] { color: var(--accent); font-weight: 600; }
```
</interfaces>
</context>

<constraints>
- Zero new client-side JavaScript.
- Zero new CSS custom properties; zero hardcoded hex colors in nav-sidebars.css
  (tests/reading-navigation.test.mjs test 6 already enforces both).
- Do not touch PostNav.astro or RightNavSidebar.astro.
- Do not write real post body content for any post.
- Do not change the existing `getChapters` / `getReadingOrder` behaviour — extend only.
</constraints>

<tasks>

<task type="auto">
  <name>Task 1: Schema field, section flag, and splitChapter helper</name>
  <files>src/content.config.ts, src/content/posts/cryptography.md, src/lib/chapter-order.ts</files>
  <action>
Add `section: z.boolean().default(false),` to the posts schema in src/content.config.ts,
placed after `draft`. Add a short comment noting it marks a chapter's intro page and
that a chapter with no section-marked post renders flat.

In src/content/posts/cryptography.md frontmatter only, add `section: true`. Do NOT add
the field to asymmetric-and-symmetric-cryptography.md, hash-functions.md,
digital-signatures.md, or any Quantum Algorithms post — they take the schema default,
which keeps Quantum Algorithms on the flat-rendering path.

In src/lib/chapter-order.ts, add a synchronous exported helper that partitions one
chapter's already-ordered post array. Do not re-derive or duplicate getChapters()'s
grouping — the helper takes the array as an argument:

  export function splitChapter(chapterPosts): { sectionPost: CollectionEntry<'posts'> | null;
                                                subsectionPosts: CollectionEntry<'posts'>[] }

Behaviour:
- Find the FIRST post with `data.section === true`. If found, that is `sectionPost` and
  `subsectionPosts` is every other post in the array with its existing order preserved.
- If none is found, return `{ sectionPost: null, subsectionPosts: [...chapterPosts] }`.
  This is the flat/unchanged path and is the common case for chapters that have not yet
  designated an intro post.
- If more than one post in a chapter is marked, the first wins and the rest fall through
  into subsectionPosts. Document that tie-break in a comment rather than throwing — a
  build failure over a content typo is worse than a slightly-off sidebar.

Comment the helper in the same voice as the existing module header (why, not what).
  </action>
  <verify>
    <automated>npx astro build</automated>
  </verify>
  <done>Build succeeds with the new schema field; splitChapter is exported and returns null sectionPost for a chapter with no marked post.</done>
</task>

<task type="auto">
  <name>Task 2: Left sidebar section/subsection hierarchy</name>
  <files>src/components/LeftNavSidebar.astro, src/styles/nav-sidebars.css</files>
  <action>
In LeftNavSidebar.astro, import `splitChapter` alongside `getChapters`. Inside the
chapter map, call `splitChapter(chapterPosts)` and render the `<ul>` as:

- If `sectionPost` exists: first `<li class="nav-section">` containing the section post's
  link, then one `<li class="nav-subsection">` per subsection post.
- If `sectionPost` is null: emit `<li>` with NO class for every post — byte-identical to
  today's markup. This fallback is what keeps the Quantum Algorithms chapter unchanged.

Keep the existing anchor markup exactly as-is, including the
`aria-current={post.data.slug === currentSlug ? 'page' : undefined}` expression, on BOTH
the section link and the subsection links — the active highlight must work either way.
Factor the anchor into a small local render helper only if it reads cleaner; duplicating
the two-line anchor is acceptable and lower-risk.

In src/styles/nav-sidebars.css, add the hierarchy rules. CRITICAL placement: insert them
IMMEDIATELY BEFORE the existing `.left-nav a[aria-current="page"]` block. Both selectors
have specificity 0,2,1, so the active-page rule only keeps winning if it comes later in
source order. Getting this backwards silently kills the accent highlight on the section
post.

  .left-nav .nav-section > a {
    font-family: 'Newsreader', Georgia, "Times New Roman", serif;
    font-weight: 600;
    color: var(--text);
  }

  .left-nav .nav-subsection {
    padding-left: var(--space-md);
  }

Use `--space-md` (16px) for the indent — it matches the existing `.right-nav ul ul`
indent precedent, so both sidebars share one nesting rhythm. Do not introduce a new
value.

Add a comment above the `.nav-section` rule recording that this is a deliberate, narrowly
scoped exception to global.css's "serif accent confined to h1-h3" guardrail: the section
entry is a heading in the chapter hierarchy, so it carries the heading font. Note that
tests/theming.test.mjs test 20 only audits global.css, so this does not regress, and that
the exception is pinned by the new test in task 4 so it cannot spread across the nav.
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>Cryptography accordion renders cryptography.md in an li.nav-section followed by three li.nav-subsection entries; the Quantum Algorithms accordion's li elements carry no class.</done>
</task>

<task type="auto">
  <name>Task 3: Mini chapter ToC on the section page</name>
  <files>src/pages/posts/[slug].astro, src/styles/nav-sidebars.css</files>
  <action>
In [slug].astro's frontmatter, when `post.data.section` is true, resolve the current
post's chapter and its subsections:

  const chapters = await getChapters();
  const chapterPosts = chapters.get(post.data.tags[0] ?? 'Uncategorized') ?? [];
  const { subsectionPosts } = splitChapter(chapterPosts);

Guard the work so non-section posts do no extra lookup. Import `getChapters` and
`splitChapter` from '../../lib/chapter-order'.

Render the box inside `<article>` after the `<p class="meta">` excerpt/meta line and
before `<Content />`, gated on `post.data.section && subsectionPosts.length > 0`:

  <nav class="chapter-toc" aria-label="In this chapter">
    <p class="chapter-toc-label">In this chapter</p>
    <ul>
      ...one li per subsection post, linking /posts/{slug}/ with the post title...
    </ul>
  </nav>

The section post itself is already excluded because splitChapter never puts it in
subsectionPosts — do not add a second filter. Do not use the `:::note` remark directive
and do not apply the `.callout`/`.callout-note` classes (they would inject a "Note: "
pseudo-element label).

Add to src/styles/nav-sidebars.css, after the .post-nav block at the end of the file:

  .chapter-toc {
    background: var(--surface);
    border-left: 3px solid var(--accent);
    padding: var(--space-sm) var(--space-md);
    margin: var(--space-lg) 0;
  }
  .chapter-toc-label {
    font-weight: 600;
    color: var(--text);
    margin: 0 0 var(--space-sm) 0;
  }
  .chapter-toc ul { list-style: none; margin: 0; padding: 0; }
  .chapter-toc li + li { margin-top: var(--space-sm); }
  .chapter-toc a { color: var(--accent); text-decoration: none; }
  .chapter-toc a:hover, .chapter-toc a:focus-visible { color: var(--text); }

These four box declarations intentionally mirror prose.css's `.callout` +
`.callout-note` values; add a comment saying so and pointing at prose.css as the source
of truth if that treatment ever changes. Only existing tokens — no new custom
properties, no hex literals (test 6 enforces this).
  </action>
  <verify>
    <automated>npm run build</automated>
  </verify>
  <done>dist/posts/cryptography/index.html contains a .chapter-toc box with links to the 3 subsections and no self-link; dist/posts/hash-functions/index.html contains no .chapter-toc.</done>
</task>

<task type="auto">
  <name>Task 4: Extend reading-navigation tests</name>
  <files>tests/reading-navigation.test.mjs</files>
  <action>
Append tests 17-21, continuing the existing numbering and reusing the file's
`readHtml` / `extractLeftNavRegion` helpers rather than adding new file-reading code.

Add one local helper that slices a single chapter's accordion out of the left-nav
region: split the nav region on '<details' and return the fragment whose
`<summary>` text matches a given chapter name. Chapter accordions are siblings, so a
plain split is sufficient — no HTML parser needed.

17. Cryptography chapter is hierarchical: within the Cryptography accordion, assert the
    fragment contains `class="nav-section"` exactly once and `class="nav-subsection"`
    exactly three times, and that the nav-section li's href is
    "/posts/cryptography/" (assert the section marker appears before the first
    subsection marker by comparing indexOf).

18. Quantum Algorithms chapter renders flat: within that accordion fragment, assert it
    contains neither "nav-section" nor "nav-subsection". This is the no-section-post
    fallback and the common case for future chapters.

19. Mini-ToC on the section page: read dist/posts/cryptography/index.html, slice from
    'class="chapter-toc"' to the following '</nav>', assert it contains "In this chapter"
    and hrefs to /posts/asymmetric-and-symmetric-cryptography/,
    /posts/hash-functions/, /posts/digital-signatures/ — exactly 3 hrefs total — and
    does NOT contain 'href="/posts/cryptography/"'.

20. Mini-ToC absent on non-section posts: for every non-draft slug except 'cryptography'
    (use the existing `nonDraftPostSlugs()`), assert the built HTML does not contain
    'chapter-toc'.

21. Serif exception stays scoped: read src/styles/nav-sidebars.css and assert that
    exactly one selector block declares Newsreader and that its selector is
    `.left-nav .nav-section > a`. This pins the deliberate exception to global.css's
    h1-h3 serif guardrail so it cannot silently spread across the nav chrome.

Do not modify tests 1-16 — they must all still pass unchanged, which is the regression
gate on the flat-rendering path.
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>All tests in tests/reading-navigation.test.mjs pass, including the untouched 1-16, plus theming.test.mjs and the other suites.</done>
</task>

</tasks>

<verification>
- `npm test` (runs `astro build` then all suites) passes with zero failures.
- `grep -c -- "--[a-z0-9-]*:" src/styles/nav-sidebars.css` after filtering comment lines
  confirms no new custom properties (already covered by existing test 6).
- Manual read of dist/posts/why-quantum-computers-threaten-bitcoin/index.html confirms
  its chapter accordion markup is unchanged from before this task.
</verification>

<success_criteria>
- `section` exists on the posts schema with a `false` default; only cryptography.md sets it true.
- `splitChapter` is the single shared partition helper, consumed by both the sidebar and the mini-ToC.
- Cryptography accordion is hierarchical; Quantum Algorithms accordion is byte-compatible with today.
- Mini-ToC appears only on cryptography.md, lists exactly its 3 subsections, and matches the callout box treatment without using the `:::note` directive or `.callout` classes.
- Active-page accent highlight still applies to both section and subsection links.
- No new client-side JS, no new CSS custom properties.
</success_criteria>

<output>
Create `.planning/quick/260905-sdo-add-explicit-section-subsection-hierarch/260905-sdo-SUMMARY.md` when done
</output>
