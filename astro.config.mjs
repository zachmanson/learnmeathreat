// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { h } from 'hastscript';

// https://astro.build/config
export default defineConfig({
  markdown: {
    // github-light: Phase 1 UI-SPEC ships a single light surface only
    // (DSGN-03 dark mode is Phase 2) - Shiki's own default is github-dark,
    // which would render code blocks with a dark background that clashes
    // with prose.css's light --surface token (Rule 1 fix).
    shikiConfig: {
      theme: 'github-light',
    },
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        rehypeSlug, // MUST run before autolink-headings - Pitfall 1
        [rehypeAutolinkHeadings, {
          behavior: 'prepend',
          content: h('span.heading-anchor', '#'),
          properties: { class: 'heading-anchor-link' },
        }],
      ],
    }),
  },
});
