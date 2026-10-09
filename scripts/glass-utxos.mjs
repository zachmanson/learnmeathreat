#!/usr/bin/env node
// Draws the "pane of glass" picture of UTXOs: a pane shattered into shards
// (every UTXO), a few of your shards melted down, and the glass poured back
// into new shards. The pane is cut by straight lines, recursively, so every
// shard is a convex polygon and each group of neighbouring shards is itself
// a convex polygon (a node of the cut tree). That's what lets the "after"
// panel re-cut exactly the region your shards covered: the total area, and
// every shard you didn't touch, stays the same.
//
// Usage:
//   node scripts/glass-utxos.mjs [output.svg] [seed]
//
// Some seeds have no group of exactly three shards and throw; try another.

import { writeFileSync } from "node:fs";

const INK = "#1a1a2e";

// Small seeded PRNG (mulberry32) so the picture is the same on every run.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

function centroid(poly) {
  const n = poly.length;
  return [
    poly.reduce((s, [x]) => s + x, 0) / n,
    poly.reduce((s, [, y]) => s + y, 0) / n,
  ];
}

// Keeps the part of a convex polygon on the side of the line through p
// where dot(x - p, normal) >= 0 (one step of Sutherland-Hodgman).
function clip(poly, p, normal) {
  const side = ([x, y]) => (x - p[0]) * normal[0] + (y - p[1]) * normal[1];
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa >= 0) out.push(a);
    if (sa * sb < 0) {
      const t = sa / (sa - sb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

// Cuts a convex polygon in two along a random line near its middle.
function cut(poly, rand, minShare = 0.2) {
  const total = area(poly);
  for (let attempt = 0; attempt < 50; attempt++) {
    const angle = rand() * Math.PI;
    const normal = [Math.cos(angle), Math.sin(angle)];
    const [cx, cy] = centroid(poly);
    const jitter = Math.sqrt(total) * 0.3;
    const p = [cx + (rand() - 0.5) * jitter, cy + (rand() - 0.5) * jitter];
    const left = clip(poly, p, normal);
    const right = clip(poly, p, [-normal[0], -normal[1]]);
    if (Math.min(area(left), area(right)) >= minShare * total) {
      return [left, right];
    }
  }
  throw new Error("couldn't find a cut");
}

function shatter(poly, depth, rand) {
  if (depth <= 0) return { poly, children: [] };
  return {
    poly,
    children: cut(poly, rand).map((part) =>
      shatter(part, depth - 1 - (rand() < 0.3 ? 1 : 0), rand),
    ),
  };
}

function leaves(node) {
  return node.children.length ? node.children.flatMap(leaves) : [node.poly];
}

function nodes(node) {
  return [node, ...node.children.flatMap(nodes)];
}

// Pulls each corner towards the centre so neighbouring shards show a crack.
function shrink(poly, factor = 0.9) {
  const [cx, cy] = centroid(poly);
  return poly.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
}

function path(poly) {
  return (
    "M" + poly.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L") + " Z"
  );
}

const FILL = {
  other: `fill="white"`,
  yours: `fill="${INK}" fill-opacity="0.55"`,
  theirs: `fill="url(#hatch)"`,
};

function shard(poly, kind) {
  return `<path d="${path(shrink(poly))}" ${FILL[kind]} stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" />`;
}

// A puddle: a wobbly closed curve, smoothed with a Catmull-Rom spline.
function puddle(cx, cy, rx, ry, rand) {
  const n = 14;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 * Math.PI;
    const wobble = 1 + (rand() - 0.5) * 0.25;
    pts.push([cx + rx * wobble * Math.cos(t), cy + ry * wobble * Math.sin(t)]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1.map((v) => v.toFixed(1)).join(",")} ${c2.map((v) => v.toFixed(1)).join(",")} ${p2.map((v) => v.toFixed(1)).join(",")}`;
  }
  return `<path d="${d} Z" ${FILL.yours} stroke="${INK}" stroke-width="1.2" />`;
}

function arrow(x1, x2, y) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${INK}" stroke-width="1.5" marker-end="url(#arrow)" />`;
}

function label(x, y, text) {
  return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="16" text-anchor="middle" fill="${INK}">${text}</text>`;
}

function buildSvg(seed) {
  const rand = rng(seed);
  const paneW = 250;
  const paneH = 180;
  const top = 20;
  const leftX = 20;
  const rightX = 590;
  const width = rightX + paneW + 20;
  const height = top + paneH + 45;

  const pane = [
    [0, 0],
    [paneW, 0],
    [paneW, paneH],
    [0, paneH],
  ];
  const tree = shatter(pane, 5, rand);

  // Your shards: the biggest group of three neighbouring shards, so the
  // highlighted region is easy to see.
  const yours = nodes(tree)
    .filter((node) => leaves(node).length === 3)
    .sort((a, b) => area(b.poly) - area(a.poly))[0];
  if (!yours) throw new Error(`seed ${seed}: no group of three shards`);
  const yourShards = new Set(leaves(yours));
  const [paid, change] = cut(yours.poly, rand, 0.3);

  const others = leaves(tree).filter((poly) => !yourShards.has(poly));
  const at = (dx) => `transform="translate(${dx},${top})"`;

  const before = [
    ...others.map((poly) => shard(poly, "other")),
    ...[...yourShards].map((poly) => shard(poly, "yours")),
  ];
  const after = [
    ...others.map((poly) => shard(poly, "other")),
    shard(paid, "theirs"),
    shard(change, "yours"),
  ];

  const midX = (leftX + paneW + rightX) / 2;
  const midY = top + paneH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="${INK}" />
    </marker>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="white" />
      <line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="2" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="white" />

  <g ${at(leftX)}>
    ${before.join("\n    ")}
  </g>
  <g ${at(rightX)}>
    ${after.join("\n    ")}
  </g>

  ${arrow(leftX + paneW + 12, midX - 52, midY)}
  ${puddle(midX, midY, 36, 22, rand)}
  ${arrow(midX + 52, rightX - 12, midY)}

  ${label(leftX + paneW / 2, height - 12, "before")}
  ${label(midX, midY + 50, "melted down")}
  ${label(rightX + paneW / 2, height - 12, "after")}
</svg>
`;
}

const out = process.argv[2] ?? "glass-utxos.svg";
const seed = Number(process.argv[3] ?? 8);
writeFileSync(out, buildSvg(seed));
console.log(`Wrote ${out}`);
