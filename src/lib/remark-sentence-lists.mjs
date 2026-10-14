// Sentence-list remark plugin.
//
// Posts write unnumbered lists as one running sentence, with each item on its
// own line ending in a backslash (a Markdown hard break), e.g.
//
//   It checks that\
//   every input exists;\
//   every signature verifies; and\
//   the outputs add up.
//
// Plain Markdown renders that as a single <p> with <br>s, so the items sit
// flush with the lead-in and don't read as a list. This plugin turns any
// paragraph containing a hard break into <p class="sentence-list">: the first
// line (the lead-in) stays as is, and every later line is wrapped in
// <span class="sentence-list-item">, which prose.css indents as a block. The
// break nodes themselves are dropped since the block spans already start new
// lines.
//
// Hard breaks are only used for these lists in posts, so every paragraph
// with one is treated as a list.

import { visit } from 'unist-util-visit';

// Splits a paragraph's inline children at `break` nodes, returning one array
// of inline nodes per line. Leading whitespace left over from the source line
// ending is trimmed from the start of each new line.
function splitAtBreaks(children) {
  const lines = [[]];
  for (const child of children) {
    if (child.type === 'break') {
      lines.push([]);
      continue;
    }
    const line = lines[lines.length - 1];
    if (line.length === 0 && child.type === 'text') {
      const value = child.value.replace(/^\s+/, '');
      if (value) line.push({ ...child, value });
      continue;
    }
    line.push(child);
  }
  return lines;
}

export function remarkSentenceLists() {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      if (!node.children.some((child) => child.type === 'break')) return;

      const [leadIn, ...items] = splitAtBreaks(node.children);
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, className: ['sentence-list'] },
      };
      node.children = [
        ...leadIn,
        ...items.map((children) => ({
          type: 'element',
          data: { hName: 'span', hProperties: { className: ['sentence-list-item'] } },
          children,
        })),
      ];
    });
  };
}
