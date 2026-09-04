# Deferred Items — Phase 02.1

Items observed during execution but out of scope for the current task's changes (SCOPE BOUNDARY rule — not auto-fixed).

## tests/theming.test.mjs test 15 fails in worktree execution environment

- **Observed during:** 02.1-02 Task 1 verification (`npm test`)
- **Symptom:** `Error: Missing node_modules/katex/dist/katex.css` even though `npm run build` succeeds and KaTeX renders correctly in built output.
- **Root cause (not fixed, out of scope):** The git worktree at `.claude/worktrees/agent-a15bc6b196b17669e` has no local `node_modules` of its own (only `.astro`/`.vite` caches). Node's module resolution (`require.resolve('katex')`) walks up parent directories and finds the main repo's `node_modules`, which is why the Astro build itself succeeds. But `tests/theming.test.mjs`'s test 15 does a direct `fs.readFileSync` against a path built from `path.resolve(__dirname, '..', 'node_modules', 'katex', 'dist', 'katex.css')` relative to the worktree's own repo root, which has no `node_modules/katex` — so the file lookup fails even though the package is resolvable and the build passes.
- **Not caused by:** any change made in plan 02.1-02 (nav-sidebars.css, global.css, Layout.astro, LeftNavSidebar.astro, [slug].astro edits). Unrelated to sidebar/layout work.
- **Recommendation:** Orchestrator/worktree tooling should either symlink or `npm install` node_modules into each worktree, or the test should resolve the katex CSS path via `require.resolve('katex/dist/katex.css')` instead of a hardcoded relative path, so it works correctly under both direct-checkout and worktree execution.
