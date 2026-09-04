// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { rehypeSequentialIds } from './src/lib/rehype-sequential-ids.mjs';
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
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
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
