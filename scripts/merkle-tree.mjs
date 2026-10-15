#!/usr/bin/env node
// Draws the two Merkle tree figures: an 8-item tree built up to its root, and
// the same tree with the Merkle proof for item 3 marked. Items sit in a row
// at the bottom, each hashed into a leaf, and every node above is the hash of
// the two nodes below it.
//
// Usage:
//   node scripts/merkle-tree.mjs [tree.svg] [proof.svg]

import { writeFileSync } from "node:fs";

const INK = "#1a1a2e";
const LEAVES = 8;
const PROVE = 3; // the item the proof figure is for (1-indexed)

const NODE_W = 64;
const NODE_H = 30;
const GAP_X = 22;
const LEVEL_H = 70;
const PAD = 20;

const width = 2 * PAD + LEAVES * NODE_W + (LEAVES - 1) * GAP_X;
// Levels: items, leaf hashes, then up to the root (log2(8) = 3 more levels).
const levels = Math.log2(LEAVES) + 2;
const height = 2 * PAD + levels * NODE_H + (levels - 1) * (LEVEL_H - NODE_H);

// Node labels: items are m_i, hashes are h_ij..., the top one is h_root.
// A node is identified by its level (0 = items, 1 = leaf hashes) and the
// range of item numbers [lo, hi] underneath it.
function subscript(level, lo, hi) {
  if (level === levels - 1) return "root";
  let s = "";
  for (let i = lo; i <= hi; i++) s += i;
  return s;
}

function labelMarkup(level, lo, hi) {
  const base = level === 0 ? "m" : "h";
  return `<tspan font-style="italic">${base}</tspan><tspan baseline-shift="-25%" font-size="11">${subscript(level, lo, hi)}</tspan>`;
}

// Centre x of the node covering items lo..hi: midway between the centres of
// its first and last item columns.
function centreX(lo, hi) {
  const col = (i) => PAD + (i - 1) * (NODE_W + GAP_X) + NODE_W / 2;
  return (col(lo) + col(hi)) / 2;
}

function topY(level) {
  return height - PAD - NODE_H - level * LEVEL_H;
}

// Every node in the tree, bottom level first.
function nodes() {
  const out = [];
  for (let level = 0; level < levels; level++) {
    const span = level === 0 ? 1 : 2 ** (level - 1);
    for (let lo = 1; lo <= LEAVES; lo += span) {
      out.push({ level, lo, hi: lo + span - 1 });
    }
  }
  return out;
}

const covers = (n, item) => n.lo <= item && item <= n.hi;

// In the proof figure: nodes on the path from item PROVE to the root are the
// ones the verifier computes, and the sibling of each path node above the
// leaf level is a hash the proof has to supply.
function role(n) {
  if (covers(n, PROVE)) return "path";
  if (n.level < 1 || n.level === levels - 1) return "other";
  const span = n.hi - n.lo + 1;
  const parentLo = Math.floor((n.lo - 1) / (2 * span)) * (2 * span) + 1;
  const parentCoversItem = parentLo <= PROVE && PROVE <= parentLo + 2 * span - 1;
  return parentCoversItem ? "sibling" : "other";
}

const STYLE = {
  plain: `fill="none" stroke="${INK}" stroke-width="1.2"`,
  path: `fill="${INK}" fill-opacity="0.15" stroke="${INK}" stroke-width="1.2"`,
  sibling: `fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="5 3"`,
  faded: `fill="none" stroke="${INK}" stroke-width="1.2" stroke-opacity="0.35"`,
};

function box(n, style, textOpacity) {
  const x = centreX(n.lo, n.hi) - NODE_W / 2;
  const y = topY(n.level);
  return `<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="4" ${style} />
    <text x="${x + NODE_W / 2}" y="${y + NODE_H / 2 + 5}" font-family="Georgia, serif" font-size="16" style="font-variant-numeric: lining-nums" text-anchor="middle" fill="${INK}" fill-opacity="${textOpacity}">${labelMarkup(n.level, n.lo, n.hi)}</text>`;
}

// Line from the top of a child node to the bottom of its parent.
function edge(child, parent, opacity, strokeWidth) {
  const x1 = centreX(child.lo, child.hi);
  const y1 = topY(child.level);
  const x2 = centreX(parent.lo, parent.hi);
  const y2 = topY(parent.level) + NODE_H;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${strokeWidth}" stroke-opacity="${opacity}" />`;
}

function parentOf(n, all) {
  return all.find((p) => p.level === n.level + 1 && p.lo <= n.lo && n.hi <= p.hi);
}

function buildSvg(proof) {
  const all = nodes();
  const parts = [];
  for (const n of all) {
    if (n.level === levels - 1) continue;
    const p = parentOf(n, all);
    const onPath = proof && role(n) === "path";
    const faded = proof && (role(n) === "other" || role(p) === "other");
    parts.push(edge(n, p, faded ? 0.35 : 1, onPath ? 2.4 : 1.2));
  }
  for (const n of all) {
    if (!proof) {
      parts.push(box(n, STYLE.plain, 1));
      continue;
    }
    const r = role(n);
    if (r === "path") parts.push(box(n, STYLE.path, 1));
    else if (r === "sibling") parts.push(box(n, STYLE.sibling, 1));
    else parts.push(box(n, STYLE.faded, 0.35));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${parts.join("\n    ")}
</svg>
`;
}

const treeOut = process.argv[2] ?? "merkle-tree.svg";
const proofOut = process.argv[3] ?? "merkle-proof.svg";
writeFileSync(treeOut, buildSvg(false));
writeFileSync(proofOut, buildSvg(true));
console.log(`Wrote ${treeOut} and ${proofOut}`);
