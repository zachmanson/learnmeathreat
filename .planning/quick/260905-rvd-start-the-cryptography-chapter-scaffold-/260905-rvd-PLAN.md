---
phase: quick-260905-rvd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/chapter-order.ts
  - src/components/LeftNavSidebar.astro
  - src/components/PostNav.astro
  - src/pages/posts/[slug].astro
  - src/styles/nav-sidebars.css
  - src/content/posts/cryptography.md
  - src/content/posts/asymmetric-and-symmetric-cryptography.md
  - src/content/posts/hash-functions.md
  - src/content/posts/digital-signatures.md
  - tests/reading-navigation.test.mjs
autonomous: true
requirements: [QUICK-260905-rvd]

must_haves:
  truths:
    - "A Cryptography chapter appears in the left ToC sidebar, listed before Quantum Algorithms, containing 4 posts in reading order"
    - "Every post page renders a prev link (bottom-left) and next link (bottom-right) labelled with the adjacent post's title"
    - "Prev/next order matches the left sidebar's chapter order exactly, and flows across chapter boundaries"
    - "The first post in reading order renders no prev link; the last renders no next link"
    - "Post nav adds zero new client-side JS"
  artifacts:
    - path: "src/lib/chapter-order.ts"
      provides: "Single source of truth for chapter grouping + flat reading order"
      exports: ["getChapters", "getReadingOrder"]
    - path: "src/components/PostNav.astro"
      provides: "Static prev/next footer navigation"
    - path: "src/content/posts/cryptography.md"
      provides: "Cryptography chapter intro stub"
      contains: "slug: cryptography"
  key_links:
    - from: "src/components/LeftNavSidebar.astro"
      to: "src/lib/chapter-order.ts"
      via: "import getChapters"
      pattern: "from '\\.\\./lib/chapter-order'"
    - from: "src/components/PostNav.astro"
      to: "src/lib/chapter-order.ts"
      via: "import getReadingOrder"
      pattern: "getReadingOrder"
    - from: "src/pages/posts/[slug].astro"
      to: "src/components/PostNav.astro"
      via: "component render inside <article>"
      pattern: "<PostNav"
---

<objective>
Scaffold the Cryptography chapter (4 stub posts) and add static prev/next post navigation driven by the same chapter reading order the left ToC sidebar already uses.

Purpose: The Cryptography chapter is foundational material the reader needs before Bitcoin/quantum posts, and sequential reading requires in-page forward/back links. Extracting the ordering logic into one module keeps the sidebar and the prev/next links from drifting apart.
Output: `src/lib/chapter-order.ts`, `src/components/PostNav.astro`, 4 stub post Markdown files, CSS in `nav-sidebars.css`, tests in `tests/reading-navigation.test.mjs`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@src/content.config.ts
@src/components/LeftNavSidebar.astro
@src/pages/posts/[slug].astro
@src/styles/nav-sidebars.css

<interfaces>
Post frontmatter schema (src/content.config.ts) — all fields except `draft` are required:
```ts
{
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()),   // tags[0] IS the chapter name, rendered verbatim as the <summary> label
  excerpt: z.string(),
  slug: z.string(),            // URL source of truth; route is /posts/{slug}/
  draft: z.boolean().default(false),
}
```

Existing ordering logic, currently inline in `src/components/LeftNavSidebar.astro` (lines 17-32) — this is the logic being extracted, do not rewrite its semantics:
```ts
const posts = (await getCollection('posts', ({ data }) => !data.draft))
  .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());

const chapters = new Map<string, typeof posts>();
for (const post of posts) {
  const chapterName = post.data.tags[0] ?? 'Uncategorized';
  if (!chapters.has(chapterName)) chapters.set(chapterName, []);
  chapters.get(chapterName)!.push(post);
}
```
Consequence to preserve: chapter display order = Map insertion order = ascending date of each chapter's oldest post. Within a chapter, posts are oldest-first.

Existing posts (for date/chapter placement):
- `why-quantum-computers-threaten-bitcoin` — 2026-09-03, tags ["Quantum Algorithms"], draft false
- `authoring-primitives` — 2026-09-05, tags ["Quantum Algorithms"], draft false
- `shors-algorithm-in-plain-english` — 2026-09-10, tags ["Quantum Algorithms"], draft TRUE (must stay excluded from nav)

CSS tokens available from global.css: `--bg`, `--surface`, `--accent`, `--text`, `--muted`, plus `--space-*` scale. `nav-sidebars.css` declares zero new custom properties — keep it that way.

Test harness: `npm test` = `astro build` then `node --test tests/**/*.test.mjs`. Tests assert over built `dist/` HTML using only Node built-ins. Follow the existing `readDistFile()` pattern in `tests/reading-navigation.test.mjs`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extract chapter ordering into a shared module</name>
  <files>src/lib/chapter-order.ts, src/components/LeftNavSidebar.astro</files>
  <action>
Create `src/lib/chapter-order.ts` exporting two async functions built on the exact grouping/sort semantics quoted in the interfaces block:

- `getChapters(): Promise<Map<string, CollectionEntry<'posts'>[]>>` — fetches non-draft posts via `getCollection('posts', ({ data }) => !data.draft)`, sorts ascending by `date.valueOf()`, groups by `tags[0] ?? 'Uncategorized'` into a Map preserving insertion order.
- `getReadingOrder(): Promise<CollectionEntry<'posts'>[]>` — flattens `getChapters()` values in Map order into one array. This flat array IS the site-wide reading order; prev/next index into it.

Have `getReadingOrder` call `getChapters` so there is literally one grouping implementation. Import the `CollectionEntry` type from `astro:content` for the signatures. Carry over the explanatory comments about Assumption A1 (one chapter per post = first tag) and oldest-first-within-chapter so the rationale is not lost.

Then edit `LeftNavSidebar.astro` to delete its inline `getCollection`/sort/grouping block and instead `import { getChapters } from '../lib/chapter-order';` and `const chapters = await getChapters();`. Leave the component's markup, `currentChapter` derivation, styling, and inline toggle script untouched — this is a pure refactor with no visual change.
  </action>
  <verify>
    <automated>npm run build && grep -q "getChapters" src/components/LeftNavSidebar.astro && grep -vc '^\s*//' src/components/LeftNavSidebar.astro >/dev/null && ! grep -n "chapters.set" src/components/LeftNavSidebar.astro</automated>
  </verify>
  <done>`src/lib/chapter-order.ts` exports `getChapters` and `getReadingOrder`; `LeftNavSidebar.astro` contains no grouping logic of its own and the build succeeds with the sidebar rendering identically.</done>
</task>

<task type="auto">
  <name>Task 2: Scaffold the four Cryptography chapter stub posts</name>
  <files>src/content/posts/cryptography.md, src/content/posts/asymmetric-and-symmetric-cryptography.md, src/content/posts/hash-functions.md, src/content/posts/digital-signatures.md</files>
  <action>
Create four stub posts. Filename = slug + `.md`, matching the existing convention. Every frontmatter field in the Zod schema is required (except `draft`), so include all of them; set `draft: false` so the posts appear in the ToC and nav.

Chapter tag: use `tags: ["Cryptography"]` — title case, because `tags[0]` is rendered verbatim as the chapter heading in the sidebar alongside the existing `"Quantum Algorithms"`.

Dates: assign 2026-08-20, 2026-08-21, 2026-08-22, 2026-08-23 in that reading order. These are deliberately EARLIER than the oldest Quantum Algorithms post (2026-09-03) because chapter display order is driven by each chapter's oldest post date — Cryptography is foundational and must sort ahead of Quantum Algorithms in both the sidebar and the reading order. Do not use post-09-03 dates.

The four posts in order:
1. `cryptography` — title "Cryptography". Chapter opener: frames that before Bitcoin or quantum computing makes sense, the reader needs three tools — asymmetric/symmetric encryption, hash functions, and digital signatures.
2. `asymmetric-and-symmetric-cryptography` — title "Asymmetric and Symmetric Cryptography".
3. `hash-functions` — title "Hash Functions".
4. `digital-signatures` — title "Digital Signatures".

Body content is a STUB only — one short paragraph per post saying the post is not written yet, optionally a short bullet outline of what it will cover. Do NOT write real explainer content, do NOT use math, figures, callouts, or citations. Write `excerpt` as a real one-sentence description of the intended post (it is user-facing on the homepage), in plain direct voice, no sentence starting with "And".
  </action>
  <verify>
    <automated>npm run build && ls dist/posts/cryptography/index.html dist/posts/asymmetric-and-symmetric-cryptography/index.html dist/posts/hash-functions/index.html dist/posts/digital-signatures/index.html</automated>
  </verify>
  <done>All four posts build to `/posts/{slug}/`; the left sidebar shows a "Cryptography" chapter listing the four titles in reading order, positioned above "Quantum Algorithms".</done>
</task>

<task type="auto">
  <name>Task 3: Add static prev/next post navigation</name>
  <files>src/components/PostNav.astro, src/pages/posts/[slug].astro, src/styles/nav-sidebars.css, tests/reading-navigation.test.mjs</files>
  <action>
Create `src/components/PostNav.astro` taking a single prop `currentSlug: string`. In its frontmatter: `const order = await getReadingOrder();` from `../lib/chapter-order`, find `const i = order.findIndex(p => p.data.slug === currentSlug)`, then `prev = i > 0 ? order[i - 1] : null` and `next = i >= 0 && i < order.length - 1 ? order[i + 1] : null`. Because `order` is the flat cross-chapter array, chapter-boundary flow works for free — do not special-case it.

Markup: a `<nav class="post-nav" aria-label="Post navigation">` containing at most two `<a>` elements, each `href={`/posts/${p.data.slug}/`}`. Link text is the adjacent post's TITLE, prefixed `←` for prev and suffixed `→` for next. Render nothing at all when prev/next is null — no disabled span, no placeholder. Add a small `<span class="post-nav-label">` reading "Previous"/"Next" above the title if it helps scannability; keep it text-only. Absolutely no `<script>` tag — this component ships zero JS.

Wire it into `src/pages/posts/[slug].astro` as the last child inside `<article>`, after `<Content />`: `<PostNav currentSlug={post.data.slug} />`. Placing it inside `<article>` keeps it in the `content` grid area so it aligns with the prose column on desktop and stays above the mobile right-sidebar area.

Append styles to `src/styles/nav-sidebars.css` under a short header comment. Use `display: flex; justify-content: space-between;` with the prev anchor pinned left and next pinned right — when only `next` exists it must still sit on the right, so give the next link `margin-left: auto`. Top border using the same border treatment already present in that file, generous `--space-*` top margin, `--accent` for link color, `--muted` for the optional label, `--text` on hover if that matches existing anchor behavior. Declare zero new custom properties. Add a `gap` so the two links do not collide on narrow viewports and allow wrapping.

Extend `tests/reading-navigation.test.mjs` (follow its existing `readDistFile` helper and import style) with assertions over built `dist/` HTML:
- `posts/cryptography/index.html` has a `post-nav` with a next link to `/posts/asymmetric-and-symmetric-cryptography/` labelled with that post's title, and NO prev link (it is first in reading order).
- `posts/hash-functions/index.html` links prev → `/posts/asymmetric-and-symmetric-cryptography/` and next → `/posts/digital-signatures/`.
- Chapter boundary: `posts/digital-signatures/index.html` next link points at `/posts/why-quantum-computers-threaten-bitcoin/` (first post of the next chapter).
- Last post overall (`authoring-primitives`) has a prev link and no next link.
- No post page's `post-nav` block references the draft post `shors-algorithm-in-plain-english`.
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>All post pages render prev/next links titled with adjacent post titles in chapter reading order, first/last posts omit the respective link, `npm test` passes, and no new `<script>` appears in built post HTML from PostNav.</done>
</task>

</tasks>

<verification>
- `npm test` passes (build + all node:test suites, including pre-existing ones).
- Manual spot check of `dist/posts/cryptography/index.html`: Cryptography chapter appears first in the left ToC, post nav shows only a next link.
- `grep -c "<script" dist/posts/hash-functions/index.html` is unchanged from a pre-change post page — PostNav contributes no script tag.
</verification>

<success_criteria>
- Chapter grouping/ordering exists in exactly one place (`src/lib/chapter-order.ts`), consumed by both the sidebar and PostNav.
- Four Cryptography stub posts build and appear in reading order, sorted ahead of Quantum Algorithms.
- Prev/next links use adjacent post titles, flow across chapter boundaries, and are omitted at the two ends of the reading order.
- Zero new client-side JS, zero new CSS custom properties.
- No real post body content was written.
</success_criteria>

<output>
Create `.planning/quick/260905-rvd-start-the-cryptography-chapter-scaffold-/260905-rvd-SUMMARY.md` when done
</output>
