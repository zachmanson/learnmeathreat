// rehype-citation's Vancouver CSL style renders in-text citation marks as
// "(1)" - parentheses, not brackets. This transform rewrites the literal
// "(" / ")" text nodes rehype-citation emits around each citation mark
// into "[" / "]", per user preference for numeric bracket citations.
//
// Ordering constraint: MUST run after rehypeCitation, since it operates on
// the hast spans rehypeCitation emits (id="citation--KEY--N"). Position
// relative to rehypeSequentialIds/rehypeAutolinkHeadings does not matter -
// this only touches citation spans, not headings. See astro.config.mjs.

import { visit } from 'unist-util-visit';

export function rehypeCitationBrackets() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (
        node.tagName !== 'span' ||
        typeof node.properties?.id !== 'string' ||
        !node.properties.id.startsWith('citation--')
      ) {
        return;
      }
      const first = node.children[0];
      const last = node.children[node.children.length - 1];
      if (first?.type === 'text' && first.value.startsWith('(')) {
        first.value = '[' + first.value.slice(1);
      }
      if (last?.type === 'text' && last.value.endsWith(')')) {
        last.value = last.value.slice(0, -1) + ']';
      }
    });
  };
}
