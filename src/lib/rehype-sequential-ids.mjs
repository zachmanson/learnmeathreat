// Sequential heading-id rehype plugin.
//
// Implements decisions D-01 and D-02 from 02.1-CONTEXT.md: every h2-h6 in a
// rendered post gets a sequential id of the form `h-N`, numbered in document
// order starting at 1, using a single shared counter across all heading
// depths. The h1 post title is deliberately excluded — it is not a numbered
// section (D-02) and carries no id from this plugin.
//
// Accepted tradeoff (per RESEARCH.md Pitfall 3): because ids are derived
// from document position rather than heading text, they shift if headings
// are inserted, removed, or reordered within a post. They do NOT shift when
// a heading is only reworded — that stability (surviving rewording, not
// surviving structural edits) is the entire point of this scheme. Do not
// claim it is stable across structural changes.
//
// Ordering constraint (load-bearing): this plugin must run after
// rehypeKatex and before rehype-autolink-headings in the rehype pipeline —
// autolink-headings reads `node.properties.id` to build its anchor href, so
// the id must already exist by the time it runs. See astro.config.mjs.

import { visit } from 'unist-util-visit';

const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']); // h1 excluded per D-02

export function rehypeSequentialIds() {
  return (tree) => {
    let counter = 0;
    visit(tree, 'element', (node) => {
      if (!HEADING_TAGS.has(node.tagName)) return;
      counter += 1;
      node.properties = node.properties || {};
      node.properties.id = `h-${counter}`;
    });
  };
}
