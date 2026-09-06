// Single source of truth for chapter grouping and the site-wide flat reading
// order. Extracted from LeftNavSidebar.astro so the left ToC sidebar and
// PostNav (prev/next footer nav) can never drift apart - both consume this
// module instead of each re-implementing the grouping logic.
import { getCollection, type CollectionEntry } from 'astro:content';

// !data.draft is mandatory (T-02.1-03) so drafts never leak into the
// site-wide contents or the reading order.
export async function getChapters(): Promise<Map<string, CollectionEntry<'posts'>[]>> {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    // Oldest-first within a chapter reads like book-chapter order
    // (RESEARCH.md Assumption A2, Claude's Discretion).
    .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());

  // Assumption A1 (RESEARCH.md): a post belongs to exactly one chapter, its
  // first tag - avoids the same post appearing in multiple chapters, which
  // would be confusing given the "book chapters" mental model (D-04).
  const chapters = new Map<string, CollectionEntry<'posts'>[]>();
  for (const post of posts) {
    const chapterName = post.data.tags[0] ?? 'Uncategorized';
    if (!chapters.has(chapterName)) chapters.set(chapterName, []);
    chapters.get(chapterName)!.push(post);
  }

  return chapters;
}

// Flattens getChapters() values in Map order into one array. This flat array
// IS the site-wide reading order: chapter display order = Map insertion
// order = ascending date of each chapter's oldest post, and within a
// chapter, posts are oldest-first. Prev/next nav indexes into this array.
export async function getReadingOrder(): Promise<CollectionEntry<'posts'>[]> {
  const chapters = await getChapters();
  return [...chapters.values()].flat();
}

// Partitions one chapter's already-ordered post array into its intro
// ("section") post and the rest ("subsections"). Takes the array rather than
// re-deriving grouping itself, so it stays a pure function both
// LeftNavSidebar (sidebar hierarchy) and [slug].astro (mini chapter ToC) can
// share without either re-implementing the split.
//
// If more than one post in a chapter is marked `section: true`, the first
// one (in the array's existing order) wins and the rest fall through into
// subsectionPosts - a build failure over a content typo would be worse than
// a slightly-off sidebar.
export function splitChapter(chapterPosts: CollectionEntry<'posts'>[]): {
  sectionPost: CollectionEntry<'posts'> | null;
  subsectionPosts: CollectionEntry<'posts'>[];
} {
  const sectionIndex = chapterPosts.findIndex((post) => post.data.section === true);
  if (sectionIndex === -1) {
    // No post in this chapter has been designated as its intro page yet -
    // the flat/unchanged rendering path.
    return { sectionPost: null, subsectionPosts: [...chapterPosts] };
  }

  const sectionPost = chapterPosts[sectionIndex];
  const subsectionPosts = chapterPosts.filter((_, i) => i !== sectionIndex);
  return { sectionPost, subsectionPosts };
}
