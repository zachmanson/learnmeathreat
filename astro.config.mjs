// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import rehypeCitation from 'rehype-citation';
import { rehypeSequentialIds } from './src/lib/rehype-sequential-ids.mjs';
import { remarkDirectiveToHast } from './src/lib/remark-directive-to-hast.mjs';
import { remarkCiteTranslate } from './src/lib/remark-cite-translate.mjs';
import { rehypeCitationBrackets } from './src/lib/rehype-citation-brackets.mjs';
import { remarkRefResolve } from './src/lib/remark-ref-resolve.mjs';
import { remarkLabelStrip } from './src/lib/remark-label-strip.mjs';
import { rehypeEquationNumbering } from './src/lib/rehype-equation-numbering.mjs';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { h } from 'hastscript';

// https://astro.build/config
export default defineConfig({
  markdown: {
    // defaultColor: false makes Shiki emit --shiki-light-*/--shiki-dark-*
    // custom properties per token instead of baking in a single inline
    // `color`, which is what lets prose.css select a palette from the
    // data-theme attribute without re-running the highlighter client-side
    // (DSGN-03).
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
    processor: unified({
      remarkPlugins: [
        remarkCiteTranslate, // MUST run before rehypeCitation sees the tree - RESEARCH.md Pattern 2
        remarkMath,
        remarkDirective,
        remarkDirectiveToHast, // MUST run after remarkDirective - RESEARCH.md Pattern 1
        remarkRefResolve, // \ref{key} -> link; needs `math`/directive node types to exist for its own registry scan of every post
        remarkLabelStrip, // removes \label{key} marker paragraphs; must run after remarkMath/remarkDirective
      ],
      rehypePlugins: [
        rehypeKatex,
        rehypeEquationNumbering, // MUST run after rehypeKatex - numbers the <span class="katex-display"> it renders
        [rehypeCitation, {
          bibliography: 'references.bib', // MUST run after rehypeKatex, before rehypeSequentialIds - RESEARCH.md Pattern 2 / Pitfall 4
          path: process.cwd(),
          csl: 'vancouver', // numeric [1], [2]... in order of first citation per page, per user request
          suppressBibliography: false,
          linkCitations: true,
        }],
        rehypeCitationBrackets, // MUST run after rehypeCitation - rewrites its "(1)" marks to "[1]"
        rehypeSequentialIds, // MUST run before autolink-headings - Pitfall 1
        [rehypeAutolinkHeadings, {
          behavior: 'prepend',
          content: h('span.heading-anchor', '#'),
          properties: { class: 'heading-anchor-link' },
        }],
      ],
    }),
  },
});
