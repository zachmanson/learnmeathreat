// Shared predicates for the \label{key}/\ref{key} primitive (CONTEXT.md:
// Label, Ref, Label registry). Used by both src/lib/remark-label-strip.mjs
// (phase 2: strips \label markers from the real per-file render) and
// src/lib/label-registry.mjs (phase 1: scans every post to build the
// site-wide label registry). Both need the IDENTICAL notion of "what counts
// as a labelable element" and "what counts as a bare \label paragraph" -
// sharing these two predicates is what keeps the two passes from silently
// drifting apart.
//
// Proximity convention (ADR 0001 / CONTEXT.md Label): \label{key} is written
// as its own paragraph, immediately after the element it labels - the same
// convention LaTeX's own \label uses.

// Keys are restricted to word characters and hyphens - NOT `[^}]+` - because
// remark-directive's inline text-directive syntax (`:name`) fires on a bare
// colon anywhere in running text, including inside a `\label{...}`/`\ref{...}`
// key. A colon in a key gets the surrounding text node mangled by
// remark-directive before this module ever sees it, so the key charset
// simply excludes the character that triggers it (learned the hard way
// authoring the authoring-primitives.md fixture: `\label{fig:example}` broke
// silently until the colon was replaced with a hyphen).
export const LABEL_PATTERN = /^\\label\{([\w-]+)\}$/;
export const REF_PATTERN = /\\ref\{([\w-]+)\}/g;

// Element types \label/\ref support (CONTEXT.md Label; grill-with-docs Q1).
export function labelableKind(node) {
  if (node.type === 'heading' && node.depth >= 2 && node.depth <= 6) return 'heading';
  if (node.type === 'math') return 'equation';
  if (node.type === 'leafDirective' && node.name === 'figure') return 'figure';
  if (node.type === 'containerDirective' && node.name === 'definition') return 'definition';
  return null;
}

// Per-post labels (equation, figure) can only be \ref'd from the post that
// defines them; site-wide labels (definition, heading) can be \ref'd from
// anywhere (grill-with-docs Q2/Q4).
export const PER_POST_TYPES = new Set(['equation', 'figure']);
export const SITE_WIDE_TYPES = new Set(['definition', 'heading']);

export function bareLabelKey(node) {
  if (node.type !== 'paragraph' || !node.children || node.children.length !== 1) return null;
  const child = node.children[0];
  if (child.type !== 'text') return null;
  const match = LABEL_PATTERN.exec(child.value.trim());
  return match ? match[1] : null;
}

export function flattenText(node) {
  if (node.type === 'text') return node.value;
  if (!node.children) return '';
  return node.children.map(flattenText).join('');
}
