// Unit tests for the `:::algorithm` directive in
// src/lib/remark-directive-to-hast.mjs. Runs the plugin through a minimal
// unified pipeline (parse -> directive -> math -> plugin -> rehype ->
// stringify) on synthetic Markdown, so this suite doesn't depend on dist/ or
// on any particular post containing an algorithm block.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkDirectiveToHast } from '../src/lib/remark-directive-to-hast.mjs';

function render(markdown) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkMath)
      .use(remarkDirectiveToHast)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(markdown)
  );
}

const ECDSA = [
  ':::algorithm[ECDSA signing]',
  'Input: private key $sk$, message $m$',
  'Output: signature $(r, s)$',
  'Procedure:',
  '1. $z \\gets H(m)$',
  '2. **return** $(r, s)$',
  ':::',
  '',
].join('\n');

test('1. an algorithm block becomes div.algorithm with a sequential id', () => {
  const html = render(ECDSA);
  assert.match(html, /<div class="algorithm" id="alg-1">/);
});

test('2. the directive label becomes a numbered caption', () => {
  const html = render(ECDSA);
  assert.match(
    html,
    /<p class="algorithm-caption"><span class="algorithm-number">Algorithm 1:<\/span> ECDSA signing<\/p>/
  );
});

test('3. an algorithm with no label still gets a numbered caption', () => {
  const html = render(':::algorithm\nProcedure:\n1. step\n:::\n');
  assert.match(html, /<p class="algorithm-caption"><span class="algorithm-number">Algorithm 1<\/span><\/p>/);
});

test('4. Input/Output/Procedure lines split into separate keyword rows', () => {
  const html = render(ECDSA);
  const rows = html.match(/<p class="algorithm-io">[\s\S]*?<\/p>/g) || [];
  assert.equal(rows.length, 3, `expected 3 algorithm-io rows, got ${rows.length}: ${rows.join('\n')}`);
  assert.match(rows[0], /^<p class="algorithm-io"><span class="algorithm-keyword">Input:<\/span> private key /);
  assert.match(rows[0], /math-inline/);
  assert.match(rows[1], /^<p class="algorithm-io"><span class="algorithm-keyword">Output:<\/span> signature /);
  assert.match(rows[2], /^<p class="algorithm-io"><span class="algorithm-keyword">Procedure:<\/span><\/p>$/);
  assert.ok(!/\n/.test(rows[0]), 'row text should not carry the source line break');
});

test('5. the procedure list renders as an ordered list after the keyword rows', () => {
  const html = render(ECDSA);
  const olIndex = html.indexOf('<ol>');
  assert.ok(olIndex > html.indexOf('Procedure:'), 'expected <ol> after the Procedure: row');
  assert.match(html, /<strong>return<\/strong>/);
});

test('6. algorithms number sequentially within a file and restart per file', () => {
  const two = render(`${ECDSA}\n${ECDSA}`);
  assert.match(two, /id="alg-1"/);
  assert.match(two, /id="alg-2"/);
  assert.match(two, /Algorithm 2:/);
  const again = render(ECDSA);
  assert.ok(!again.includes('alg-2'), 'numbering must restart at 1 for each file');
});

test('7. keyword-looking text outside an algorithm block is left alone', () => {
  const html = render(':::definition\nInput: not special here\n:::\n\nInput: nor here\n');
  assert.ok(!html.includes('algorithm-io'));
});
