// Equation numbering rehype plugin.
//
// Implements grill-with-docs Q8: every display (block) equation gets a
// visible sequential "(N)" tag and an `id="eq-N"` anchor, whether or not it
// has a \label attached - the same "every element of this type is numbered"
// precedent figures already established (remark-directive-to-hast.mjs's
// "Figure N" captions), rather than LaTeX's equation/equation* split.
//
// Must run after rehypeKatex: it looks for the <span class="katex-display">
// element KaTeX renders block math into (pinned by inspecting real dist/
// output, same discipline as rehype-citation-brackets.mjs and the CONT-08
// bibliography-region tests), and wraps it in a
// <div class="katex-display-wrapper" id="eq-N"> alongside the visible tag.
// Position relative to rehypeCitation/rehypeSequentialIds/
// rehypeAutolinkHeadings does not matter - this only touches katex-display
// spans, not citations or headings. See astro.config.mjs.

import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

function hasKatexDisplayClass(node) {
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.includes('katex-display');
  if (typeof className === 'string') return className.split(/\s+/).includes('katex-display');
  return false;
}

export function rehypeEquationNumbering() {
  return (tree) => {
    let counter = 0;

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'span' || !hasKatexDisplayClass(node)) return;
      if (index === null || !parent) return;

      counter += 1;
      const wrapper = h('div', { class: 'katex-display-wrapper', id: `eq-${counter}` }, [
        node,
        h('span', { class: 'eq-tag' }, `(${counter})`),
      ]);
      parent.children[index] = wrapper;
    });
  };
}
