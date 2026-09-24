// Which directories posts are read from. Single source of truth for both the
// content collection (content.config.ts) and the \label/\ref registry
// (label-registry.mjs), which reads post files directly - if the two ever
// disagreed, a \ref to a fixture post would resolve in one and not the other.
//
// Fixture posts under tests/fixtures/posts exist only to exercise the build
// pipeline (math, directives, citations, cross-post refs, chapter nav). They
// are included ONLY when LMAT_TEST_FIXTURES=1, which scripts/test.mjs sets,
// and that build writes to dist-test/ instead of dist/ (see astro.config.mjs)
// so fixtures can never end up in a deployable build.

export const INCLUDE_TEST_FIXTURES = process.env.LMAT_TEST_FIXTURES === '1';

export const POST_DIRS = INCLUDE_TEST_FIXTURES
  ? ['src/content/posts', 'tests/fixtures/posts']
  : ['src/content/posts'];

export const OUT_DIR = INCLUDE_TEST_FIXTURES ? './dist-test' : './dist';
