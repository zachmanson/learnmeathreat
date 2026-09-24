// Unit tests for the bibliography URL linkifier. Runs the plugin directly
// on small hast trees, so it doesn't depend on any particular post existing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rehypeCitationLinks, linkifyText } from '../src/lib/rehype-citation-links.mjs';

function entry(...children) {
  return {
    type: 'root',
    children: [{
      type: 'element',
      tagName: 'div',
      properties: { className: ['csl-entry'] },
      children,
    }],
  };
}

const text = (value) => ({ type: 'text', value });

test('wraps a URL in a bibliography entry in an <a> with matching href and text', () => {
  const tree = entry(text('Available from: https://doi.org/b9qh92'));
  rehypeCitationLinks()(tree);
  const [before, link] = tree.children[0].children;
  assert.equal(before.value, 'Available from: ');
  assert.equal(link.tagName, 'a');
  assert.equal(link.properties.href, 'https://doi.org/b9qh92');
  assert.equal(link.children[0].value, 'https://doi.org/b9qh92');
});

test('leaves trailing sentence punctuation outside the link', () => {
  const nodes = linkifyText('See https://example.com/a.b. Next');
  assert.equal(nodes[1].properties.href, 'https://example.com/a.b');
  assert.equal(nodes[2].value, '. Next');
});

test('links every URL when an entry has more than one', () => {
  const nodes = linkifyText('https://a.example and https://b.example');
  const hrefs = nodes.filter((n) => n.tagName === 'a').map((n) => n.properties.href);
  assert.deepEqual(hrefs, ['https://a.example', 'https://b.example']);
});

test('returns null for text with no URL', () => {
  assert.equal(linkifyText('Katz J, Lindell Y. 2014.'), null);
});

test('does not touch URLs outside bibliography entries', () => {
  const tree = { type: 'root', children: [text('https://example.com')] };
  rehypeCitationLinks()(tree);
  assert.equal(tree.children[0].type, 'text');
});

test('does not nest a link inside an existing <a>', () => {
  const tree = entry({
    type: 'element',
    tagName: 'a',
    properties: { href: 'https://example.com' },
    children: [text('https://example.com')],
  });
  rehypeCitationLinks()(tree);
  const link = tree.children[0].children[0];
  assert.equal(link.children.length, 1);
  assert.equal(link.children[0].type, 'text');
});
