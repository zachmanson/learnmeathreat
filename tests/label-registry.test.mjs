// Unit tests for the pure functions in src/lib/label-registry.mjs - the
// error-path seam (duplicate labels, undefined refs, cross-post scope
// violations, missing definition terms) that can't be exercised through a
// real `astro build`, since any of these errors is designed to fail the
// whole build (grill-with-docs Q3/Q9/Q10). Builds synthetic mdast trees
// directly with the same remark parsing the registry uses internally, so
// this test suite has no dependency on dist/ or a prior `npm run build`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import { buildRegistryFromPosts, resolveRef, validateAllRefs, scanPostRefs } from '../src/lib/label-registry.mjs';

function parse(markdown) {
  const processor = unified().use(remarkParse).use(remarkDirective).use(remarkMath);
  const tree = processor.parse(markdown);
  processor.runSync(tree);
  return tree;
}

test('1. a heading label resolves to a site-wide entry keyed by its heading text', () => {
  const tree = parse('## Elliptic Curves\n\n\\label{sec-ec}\n\nSome body text.\n');
  const registry = buildRegistryFromPosts([{ slug: 'post-a', tree }]);
  const entry = registry.get('sec-ec');
  assert.equal(entry.type, 'heading');
  assert.equal(entry.scope, 'site-wide');
  assert.equal(entry.anchorId, 'h-1');
  assert.equal(entry.displayText, 'Elliptic Curves');
});

test('2. an equation label resolves to a per-post entry with a sequential number', () => {
  const tree = parse('$$\nE = mc^2\n$$\n\n\\label{eq-mass}\n');
  const registry = buildRegistryFromPosts([{ slug: 'post-a', tree }]);
  const entry = registry.get('eq-mass');
  assert.equal(entry.type, 'equation');
  assert.equal(entry.scope, 'per-post');
  assert.equal(entry.anchorId, 'eq-1');
  assert.equal(entry.displayText, 'Equation 1');
});

test('3. a definition label uses the bolded lead term as its display text', () => {
  const tree = parse(':::definition\n**Elliptic curve:** a curve.\n:::\n\n\\label{def-ec}\n');
  const registry = buildRegistryFromPosts([{ slug: 'post-a', tree }]);
  const entry = registry.get('def-ec');
  assert.equal(entry.type, 'definition');
  assert.equal(entry.scope, 'site-wide');
  assert.equal(entry.displayText, 'Elliptic curve');
});

test('4. a definition label with no bolded lead term throws (grill-with-docs Q10)', () => {
  const tree = parse(':::definition\nJust plain prose, no bold term.\n:::\n\n\\label{def-broken}\n');
  assert.throws(
    () => buildRegistryFromPosts([{ slug: 'post-a', tree }]),
    /no bolded lead term/
  );
});

test('5. an unlabeled figure/equation/heading still counts toward the sequence, but registers no key', () => {
  const tree = parse('## First\n\n## Second\n\n\\label{sec-second}\n');
  const registry = buildRegistryFromPosts([{ slug: 'post-a', tree }]);
  assert.equal(registry.get('sec-second').anchorId, 'h-2');
  assert.equal(registry.size, 1);
});

test('6. duplicate label keys across two posts throw (ADR 0001 flat namespace)', () => {
  const treeA = parse('## Intro\n\n\\label{dup}\n');
  const treeB = parse('## Also Intro\n\n\\label{dup}\n');
  assert.throws(
    () => buildRegistryFromPosts([
      { slug: 'post-a', tree: treeA },
      { slug: 'post-b', tree: treeB },
    ]),
    /Duplicate \\label\{dup\}/
  );
});

test('7. resolveRef on an undefined key throws', () => {
  const registry = new Map();
  assert.throws(() => resolveRef(registry, 'nope', 'post-a'), /Undefined \\ref\{nope\}/);
});

test('8. resolveRef on a per-post label from a DIFFERENT post throws (grill-with-docs Q9)', () => {
  const registry = new Map([['eq-x', { type: 'equation', postSlug: 'post-a', anchorId: 'eq-1', displayText: 'Equation 1', scope: 'per-post' }]]);
  assert.throws(() => resolveRef(registry, 'eq-x', 'post-b'), /can only be referenced from the post that defines them/);
});

test('9. resolveRef on a per-post label from its OWN post returns a bare-hash href', () => {
  const registry = new Map([['eq-x', { type: 'equation', postSlug: 'post-a', anchorId: 'eq-1', displayText: 'Equation 1', scope: 'per-post' }]]);
  const { href, displayText } = resolveRef(registry, 'eq-x', 'post-a');
  assert.equal(href, '#eq-1');
  assert.equal(displayText, 'Equation 1');
});

test('10. resolveRef on a site-wide label from a different post returns a cross-post href', () => {
  const registry = new Map([['def-x', { type: 'definition', postSlug: 'post-a', anchorId: 'def-1', displayText: 'Elliptic curve', scope: 'site-wide' }]]);
  const { href } = resolveRef(registry, 'def-x', 'post-b');
  assert.equal(href, '/posts/post-a/#def-1');
});

test('11. validateAllRefs throws on an undefined \\ref found anywhere on the site', () => {
  const treeA = parse('## Intro\n\n\\label{sec-intro}\n');
  const treeB = parse('See \\ref{does-not-exist}.\n');
  const posts = [{ slug: 'post-a', tree: treeA }, { slug: 'post-b', tree: treeB }];
  const registry = buildRegistryFromPosts(posts);
  assert.throws(() => validateAllRefs(posts, registry), /Undefined \\ref\{does-not-exist\}/);
});

test('12. scanPostRefs finds every \\ref{key} in a tree\'s text nodes', () => {
  const tree = parse('See \\ref{a} and also \\ref{b} again.\n');
  assert.deepEqual(scanPostRefs(tree), ['a', 'b']);
});

test('13. a \\ref written inside inline code is not collected (mirrors \\cite\'s code-span exemption)', () => {
  const tree = parse('Use `\\ref{key}` to reference something.\n');
  assert.deepEqual(scanPostRefs(tree), []);
});
