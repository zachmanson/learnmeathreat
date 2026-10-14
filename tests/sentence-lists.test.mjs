// Unit tests for src/lib/remark-sentence-lists.mjs. Runs the plugin through a
// minimal unified pipeline on synthetic Markdown, so this suite doesn't depend
// on dist/ or on any particular post containing a sentence list.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkDirectiveToHast } from '../src/lib/remark-directive-to-hast.mjs';
import { remarkSentenceLists } from '../src/lib/remark-sentence-lists.mjs';

function render(markdown) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkMath)
      .use(remarkDirectiveToHast)
      .use(remarkSentenceLists)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(markdown)
  );
}

const LIST = [
  'It checks that\\',
  'every input exists;\\',
  'every signature verifies; and\\',
  'the outputs add up.',
  '',
].join('\n');

test('1. each line after a hard break becomes an indented item span', () => {
  const html = render(LIST);
  assert.equal(
    html,
    '<p class="sentence-list">It checks that' +
      '<span class="sentence-list-item">every input exists;</span>' +
      '<span class="sentence-list-item">every signature verifies; and</span>' +
      '<span class="sentence-list-item">the outputs add up.</span></p>'
  );
});

test('2. a paragraph without hard breaks is left alone', () => {
  const html = render('Just a sentence,\nwrapped over two lines.\n');
  assert.equal(html, '<p>Just a sentence,\nwrapped over two lines.</p>');
});

test('3. inline code, math, and links inside an item survive', () => {
  const html = render('Made of\\\nevery `txid`, $m$, and [a link](/x/).\n');
  assert.match(html, /<span class="sentence-list-item">every <code>txid<\/code>, <code class="language-math math-inline">m<\/code>, and <a href="\/x\/">a link<\/a>\.<\/span>/);
});

test('4. lists inside a definition box get the same treatment', () => {
  const html = render(':::definition\n**Thing:** A pair comprising\\\nan apple and\\\na pear.\n:::\n');
  assert.match(html, /<p class="sentence-list"><strong>Thing:<\/strong> A pair comprising<span class="sentence-list-item">an apple and<\/span><span class="sentence-list-item">a pear\.<\/span><\/p>/);
});
