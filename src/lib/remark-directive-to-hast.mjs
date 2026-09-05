// Directive-to-hast remark plugin.
//
// Implements decisions D-01, D-02, D-03, D-09, D-10, D-11, D-12 from
// 02.2-CONTEXT.md: one shared transform serves both the figure/image
// primitive (`::figure[caption]{src alt}`) and the callout/definition block
// primitives (`:::note`, `:::warning`, `:::tip`, `:::definition`).
//
// Figures (D-01/D-02/D-03): a `::figure` leaf directive becomes
// `<figure class="content-figure">` containing a lazy-loaded `<img>` and a
// `<figcaption>` prefixed with a sequential `Figure N: ` label, numbered per
// post starting at 1. PDF is deliberately unsupported as a figure `src`
// (D-01) — only raster/SVG image formats are expected. Raster images are
// deliberately NOT marked invertible (D-03); only `.svg` sources get the
// `invertible` class so dark mode can safely `filter: invert(1)` line art
// without inverting photographic/raster content.
//
// Callouts and definitions (D-09/D-10/D-11/D-12): `:::note`, `:::warning`,
// `:::tip`, and `:::definition` container (or leaf) directives become
// `<div class="callout callout-{name}">`, leaving children untouched so
// nested Markdown (bold, links, inline math, multiple paragraphs) still
// renders normally.
//
// Ordering constraint (load-bearing, per RESEARCH.md Pitfall 3): this
// plugin MUST run after `remarkDirective` in `remarkPlugins` (which
// produces the `containerDirective`/`leafDirective` nodes this plugin
// consumes) and before Astro's internal remark-rehype conversion. See
// astro.config.mjs.
//
// CRITICAL scoping rule (RESEARCH.md Pitfall 3, copied from
// rehype-sequential-ids.mjs): the per-file `figureCounter` MUST be declared
// as the first statement inside the arrow function returned by this
// factory, never in the factory's outer scope. `unified().use()` calls the
// factory once per pipeline construction but the returned transformer once
// per file — outer-scope state would make figure numbers keep climbing
// across posts in a single `astro build`.

import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

const CALLOUT_NAMES = new Set(['note', 'warning', 'tip', 'definition']);

export function remarkDirectiveToHast() {
  return (tree) => {
    let figureCounter = 0;

    visit(tree, (node) => {
      if (node.type !== 'containerDirective' && node.type !== 'leafDirective') return;

      if (CALLOUT_NAMES.has(node.name)) {
        const data = node.data || (node.data = {});
        const hast = h('div', { class: `callout callout-${node.name}` });
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
        return;
      }

      if (node.name === 'figure' && node.type === 'leafDirective') {
        figureCounter += 1;
        const { src, alt = '' } = node.attributes || {};
        const isSvg = /\.svg$/i.test(src || '');
        const data = node.data || (node.data = {});
        data.hName = 'figure';
        data.hProperties = { class: 'content-figure' };
        node.children = [
          {
            type: 'element',
            data: {
              hName: 'img',
              hProperties: {
                src,
                alt,
                loading: 'lazy',
                ...(isSvg ? { class: 'invertible' } : {}),
              },
            },
            children: [],
          },
          {
            type: 'element',
            data: { hName: 'figcaption' },
            children: [{ type: 'text', value: `Figure ${figureCounter}: ` }, ...node.children],
          },
        ];
      }
    });
  };
}
