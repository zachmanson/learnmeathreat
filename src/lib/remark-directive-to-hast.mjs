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
// renders normally. Every `:::definition` also gets a sequential
// `id="def-N"` (mirroring figures' `figureCounter`) so it's a valid
// \ref target regardless of whether it's actually labeled - see
// src/lib/label-registry.mjs and CONTEXT.md's "Label registry" entry.
//
// Algorithms: a `:::algorithm[Title]` container directive becomes
// `<div class="algorithm" id="alg-N">`, numbered per post like figures. The
// directive label becomes an "Algorithm N: Title" caption. Inside the block,
// any line starting with `Input:`, `Output:`, or `Procedure:` becomes its own
// `<p class="algorithm-io">` row with the keyword wrapped in a span, so
// consecutive keyword lines (which Markdown would otherwise merge into one
// paragraph) render as separate rows. Everything else - typically an ordered
// list of steps after `Procedure:` - is left as normal Markdown.
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
const ALGORITHM_KEYWORD = /^(Input|Output|Procedure):[ \t]*/;

function span(className, value) {
  return {
    type: 'element',
    data: { hName: 'span', hProperties: { class: className } },
    children: [{ type: 'text', value }],
  };
}

// Splits a paragraph's inline children at soft line breaks ("\n" inside text
// nodes), returning one array of inline nodes per source line.
function splitLines(children) {
  const lines = [[]];
  for (const child of children) {
    if (child.type !== 'text' || !child.value.includes('\n')) {
      lines[lines.length - 1].push(child);
      continue;
    }
    child.value.split('\n').forEach((piece, i) => {
      if (i > 0) lines.push([]);
      if (piece) lines[lines.length - 1].push({ type: 'text', value: piece });
    });
  }
  return lines;
}

function keywordOf(line) {
  const first = line[0];
  if (!first || first.type !== 'text') return null;
  return ALGORITHM_KEYWORD.exec(first.value);
}

function keywordRow(line, match) {
  const rest = [...line];
  const remainder = rest[0].value.slice(match[0].length);
  if (remainder) rest[0] = { type: 'text', value: remainder };
  else rest.shift();
  return {
    type: 'paragraph',
    data: { hProperties: { class: 'algorithm-io' } },
    children: [span('algorithm-keyword', `${match[1]}:`), ...(rest.length ? [{ type: 'text', value: ' ' }, ...rest] : [])],
  };
}

// Rewrites a paragraph containing keyword lines into one paragraph per
// keyword row. A non-keyword line following a keyword line is treated as a
// wrapped continuation of that row; lines before the first keyword stay a
// plain paragraph.
function splitKeywordParagraph(paragraph) {
  const lines = splitLines(paragraph.children);
  if (!lines.some(keywordOf)) return [paragraph];

  const out = [];
  for (const line of lines) {
    const match = keywordOf(line);
    const current = out[out.length - 1];
    if (match) out.push(keywordRow(line, match));
    else if (current) current.children.push({ type: 'text', value: '\n' }, ...line);
    else out.push({ type: 'paragraph', children: line });
  }
  return out;
}

function transformAlgorithm(node, number) {
  const data = node.data || (node.data = {});
  data.hName = 'div';
  data.hProperties = { class: 'algorithm', id: `alg-${number}` };

  const children = [...node.children];
  const title = children[0]?.data?.directiveLabel ? children.shift().children : [];
  const caption = {
    type: 'paragraph',
    data: { hProperties: { class: 'algorithm-caption' } },
    children: title.length
      ? [span('algorithm-number', `Algorithm ${number}:`), { type: 'text', value: ' ' }, ...title]
      : [span('algorithm-number', `Algorithm ${number}`)],
  };

  node.children = [
    caption,
    ...children.flatMap((child) => (child.type === 'paragraph' ? splitKeywordParagraph(child) : [child])),
  ];
}

export function remarkDirectiveToHast() {
  return (tree) => {
    let figureCounter = 0;
    let definitionCounter = 0;
    let algorithmCounter = 0;

    visit(tree, (node) => {
      if (node.type !== 'containerDirective' && node.type !== 'leafDirective') return;

      if (CALLOUT_NAMES.has(node.name)) {
        const data = node.data || (node.data = {});
        const hast = h('div', { class: `callout callout-${node.name}` });
        if (node.name === 'definition') {
          definitionCounter += 1;
          hast.properties.id = `def-${definitionCounter}`;
        }
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
        return;
      }

      if (node.name === 'algorithm' && node.type === 'containerDirective') {
        algorithmCounter += 1;
        transformAlgorithm(node, algorithmCounter);
        return;
      }

      if (node.name === 'figure' && node.type === 'leafDirective') {
        figureCounter += 1;
        const { src, alt = '' } = node.attributes || {};
        const isSvg = /\.svg$/i.test(src || '');
        const data = node.data || (node.data = {});
        data.hName = 'figure';
        data.hProperties = { class: 'content-figure', id: `fig-${figureCounter}` };
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
