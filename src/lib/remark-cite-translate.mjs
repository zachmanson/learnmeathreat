// \cite{key} -> [@key] translation remark plugin.
//
// Implements decision D-06 from 02.2-CONTEXT.md: authors write citations
// using a LaTeX-familiar `\cite{key}` syntax; this plugin rewrites that
// text into `[@key]`, the native syntax `rehype-citation` recognizes,
// before `rehype-citation` (a rehype plugin) ever sees the tree.
//
// Ordering constraint (load-bearing): this plugin runs in the remark
// (mdast) phase and MUST run before `rehype-citation` in the pipeline -
// rehype-citation only scans hast text nodes for the `[@key]` pattern, so
// the rewrite has to have already happened by the time the tree crosses
// into the rehype phase. See astro.config.mjs.
//
// Accepted behaviour (D-06): this plugin visits ONLY mdast `text` nodes,
// never `inlineCode`/`code` nodes. That means a `\cite{key}` written inside
// inline code or a fenced code block is deliberately left untranslated and
// renders literally - mirroring how remark-math skips code spans. This is
// intentional, not a bug: it gives authors an escape hatch to reference the
// citation syntax itself in prose without triggering a real citation.

import { visit } from 'unist-util-visit';

const CITE_PATTERN = /\\cite\{([^}]+)\}/g;

export function remarkCiteTranslate() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      if (!CITE_PATTERN.test(node.value)) return;
      // .test() on a global regex advances lastIndex as a side effect;
      // reset it before .replace() or the second match in this text node
      // (and any subsequent node, since the regex is module-level) would
      // silently be skipped.
      CITE_PATTERN.lastIndex = 0;
      node.value = node.value.replace(CITE_PATTERN, '[@$1]');
      CITE_PATTERN.lastIndex = 0;
    });
  };
}
