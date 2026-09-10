// \label{key} marker-paragraph removal remark plugin.
//
// Implements the phase-2 (real per-file render) half of the \label/\ref
// primitive - see CONTEXT.md (Label, Ref) and ADR 0001. Authors write
// \label{key} as its own paragraph immediately after a labelable element
// (heading, equation, figure, or definition); this plugin removes that
// marker paragraph from the rendered output so it never appears as visible
// prose. It does NOT assign ids or numbers - those already happen
// independently (rehypeSequentialIds for headings, rehypeEquationNumbering
// for equations, remarkDirectiveToHast for figures/definitions), for EVERY
// element of those types regardless of whether it's labeled. Because phase 1
// (src/lib/label-registry.mjs) counts the exact same elements in the exact
// same document order to compute the anchor ids it hands out in \ref links,
// the ids always line up without this plugin needing to compute or store
// anything itself.
//
// Ordering constraint: must run after remarkMath and remarkDirective (needs
// `math`/`containerDirective`/`leafDirective` node types to already exist).
// Does not need to run after remarkDirectiveToHast - it only inspects
// node.type/node.name, not the hast tagging that plugin adds. See
// astro.config.mjs.

import { visit } from 'unist-util-visit';
import { labelableKind, bareLabelKey } from './label-shared.mjs';

export function remarkLabelStrip() {
  return (tree) => {
    const toRemove = [];

    visit(tree, 'paragraph', (node, index, parent) => {
      if (index === null || !parent) return;
      if (!bareLabelKey(node)) return;
      const prev = parent.children[index - 1];
      if (prev && labelableKind(prev)) {
        toRemove.push({ parent, index });
      }
    });

    // Remove in reverse index order so earlier-collected indices stay valid
    // as later ones are spliced out.
    toRemove.sort((a, b) => b.index - a.index);
    for (const { parent, index } of toRemove) {
      parent.children.splice(index, 1);
    }
  };
}
