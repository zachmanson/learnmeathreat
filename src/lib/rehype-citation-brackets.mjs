// rehype-citation's Vancouver CSL style renders in-text citation marks as
// "(1)" - parentheses, not brackets. This transform rewrites the literal
// "(" / ")" text nodes rehype-citation emits around each citation mark
// into "[" / "]", per user preference for numeric bracket citations. It
// also rewrites the bibliography's own "1. "/"2. " entry markers (emitted
// as plain text inside <div class="csl-left-margin">) into "[1]"/"[2]" so
// the reference list matches the in-text mark style.
//
// Ordering constraint: MUST run after rehypeCitation, since it operates on
// the hast spans/divs rehypeCitation emits (id="citation--KEY--N" for
// in-text marks, class="csl-left-margin" for bibliography entry numbers).
// Position relative to rehypeSequentialIds/rehypeAutolinkHeadings does not
// matter - this only touches citation spans, not headings. See
// astro.config.mjs.

import { visit } from 'unist-util-visit';

function hasClassName(node, className) {
  const value = node.properties?.className;
  if (Array.isArray(value)) return value.includes(className);
  if (typeof value === 'string') return value.split(/\s+/).includes(className);
  return false;
}

export function rehypeCitationBrackets() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (
        node.tagName === 'span' &&
        typeof node.properties?.id === 'string' &&
        node.properties.id.startsWith('citation--')
      ) {
        const first = node.children[0];
        const last = node.children[node.children.length - 1];
        if (first?.type === 'text' && first.value.startsWith('(')) {
          first.value = '[' + first.value.slice(1);
        }
        if (last?.type === 'text' && last.value.endsWith(')')) {
          last.value = last.value.slice(0, -1) + ']';
        }
        return;
      }

      if (node.tagName === 'div' && hasClassName(node, 'csl-left-margin')) {
        const text = node.children[0];
        if (text?.type === 'text') {
          const match = text.value.match(/^(\d+)\.\s*$/);
          if (match) text.value = `[${match[1]}] `;
        }
      }
    });
  };
}
