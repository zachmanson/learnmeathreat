# Deferred Items — 260905-rvd

| Category | Item | Status |
|----------|------|--------|
| Pre-existing test failure (out of scope) | `tests/theming.test.mjs` test 15 ("(tripwire) installed KaTeX still derives structural-element color from currentColor") fails because `node_modules/katex/dist/katex.css` is missing. Pre-existing environment/dependency issue, unrelated to this plan's changes (confirmed: `node_modules/katex/dist/` does not exist before any of this plan's edits were made). | Not fixed — out of scope per task boundary. Run `npm install` to restore the missing katex dist assets. |
