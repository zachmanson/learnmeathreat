// rehype-citation renders each bibliography entry's URL/DOI as plain text
// ("Available from: https://..."), so nothing in the reference list is
// clickable. This transform finds URLs inside each <div class="csl-entry">
// and wraps them in <a href> elements.
//
// Ordering constraint: MUST run after rehypeCitation, since it operates on
// the bibliography markup rehypeCitation emits. See astro.config.mjs.

import { visit, SKIP } from 'unist-util-visit';

// Stop at whitespace or "<"; trailing sentence punctuation is trimmed below
// so "…/bip-0340.mediawiki." doesn't link the final period.
const URL_PATTERN = /https?:\/\/[^\s<]+/g;
const TRAILING_PUNCTUATION = /[.,;:)\]]+$/;

function hasClassName(node, className) {
  const value = node.properties?.className;
  if (Array.isArray(value)) return value.includes(className);
  if (typeof value === 'string') return value.split(/\s+/).includes(className);
  return false;
}

// Splits one text value into text/link hast nodes. Returns null when the
// text contains no URL, so callers can leave the node untouched.
export function linkifyText(value) {
  const nodes = [];
  let lastIndex = 0;
  for (const match of value.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, '');
    const start = match.index;
    if (start > lastIndex) nodes.push({ type: 'text', value: value.slice(lastIndex, start) });
    nodes.push({
      type: 'element',
      tagName: 'a',
      properties: { href: url },
      children: [{ type: 'text', value: url }],
    });
    lastIndex = start + url.length;
  }
  if (nodes.length === 0) return null;
  if (lastIndex < value.length) nodes.push({ type: 'text', value: value.slice(lastIndex) });
  return nodes;
}

export function rehypeCitationLinks() {
  return (tree) => {
    visit(tree, 'element', (entry) => {
      if (entry.tagName !== 'div' || !hasClassName(entry, 'csl-entry')) return;

      visit(entry, (node, index, parent) => {
        // Don't nest links if a URL is already inside an <a>.
        if (node.type === 'element' && node.tagName === 'a') return SKIP;
        if (node.type !== 'text' || !parent || index === undefined) return;

        const replacement = linkifyText(node.value);
        if (!replacement) return;
        parent.children.splice(index, 1, ...replacement);
        return [SKIP, index + replacement.length];
      });
      return SKIP;
    });
  };
}
