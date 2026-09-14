#!/usr/bin/env node
// Plots a set of (x, y) points on labeled axes as an SVG. The point at
// infinity isn't a real coordinate (it's the group's identity element, the
// thing every vertical line is defined to meet), so it can't be plotted
// literally — pass --infinity to draw it as the usual symbolic arrow instead.
//
// Usage:
//   node scripts/plot-points.mjs [output.svg]
//   node scripts/plot-points.mjs [output.svg] "1,0 3,2 3,5 4,3 4,4"
//   node scripts/plot-points.mjs [output.svg] --infinity

import { writeFileSync } from "node:fs";

const defaultPoints = [
  [1, 0],
  [3, 2],
  [3, 5],
  [4, 3],
  [4, 4],
];

function parseArgs(argv) {
  let out = "plot-points.svg";
  let points = defaultPoints;
  let infinity = false;
  for (const arg of argv) {
    if (arg === "--infinity") {
      infinity = true;
    } else if (arg.includes(",")) {
      points = arg
        .trim()
        .split(/\s+/)
        .map((pair) => pair.split(",").map(Number));
    } else {
      out = arg;
    }
  }
  return { out, points, infinity };
}

function buildSvg(points, { infinity = false } = {}) {
  const width = 480;
  const height = infinity ? 520 : 480;
  const pad = 40;
  const topPad = infinity ? pad + 40 : pad;

  const xMax = Math.max(...points.map(([x]) => x)) + 1;
  const yMax = Math.max(...points.map(([, y]) => y)) + 1;

  const sx = (width - 2 * pad) / xMax;
  const sy = (height - pad - topPad) / yMax;
  const toX = (x) => pad + x * sx;
  const toY = (y) => height - pad - y * sy;

  const gridLines = [];
  for (let x = 0; x <= xMax; x++) {
    gridLines.push(
      `<line x1="${toX(x).toFixed(2)}" y1="${topPad}" x2="${toX(x).toFixed(2)}" y2="${height - pad}" stroke="#eee" stroke-width="1" />`,
    );
    gridLines.push(
      `<text x="${toX(x).toFixed(2)}" y="${height - pad + 20}" font-family="sans-serif" font-size="12" text-anchor="middle">${x}</text>`,
    );
  }
  for (let y = 0; y <= yMax; y++) {
    gridLines.push(
      `<line x1="${pad}" y1="${toY(y).toFixed(2)}" x2="${width - pad}" y2="${toY(y).toFixed(2)}" stroke="#eee" stroke-width="1" />`,
    );
    gridLines.push(
      `<text x="${pad - 12}" y="${toY(y) + 4}" font-family="sans-serif" font-size="12" text-anchor="end">${y}</text>`,
    );
  }

  const dots = points
    .map(
      ([x, y]) => `
    <circle cx="${toX(x).toFixed(2)}" cy="${toY(y).toFixed(2)}" r="5" fill="#1a1a2e" />
    <text x="${toX(x).toFixed(2)}" y="${(toY(y) - 12).toFixed(2)}" font-family="sans-serif" font-size="13" text-anchor="middle">(${x}, ${y})</text>`,
    )
    .join("");

  // The point at infinity has no (x, y) — it's the group's identity
  // element, defined as where every vertical line meets. Drawn as the
  // y-axis itself continuing upward past the grid into an arrowhead,
  // not a real plotted point.
  const yAxisTop = infinity ? topPad - 40 : topPad;
  const infinityLabel = infinity
    ? `<text x="${pad + 12}" y="${yAxisTop + 6}" font-family="Georgia, serif" font-size="18" text-anchor="start">𝒪</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#1a1a2e" />
    </marker>
  </defs>
  <rect width="${width}" height="${height}" fill="white" />

  ${gridLines.join("\n  ")}

  <!-- axes -->
  <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#1a1a2e" stroke-width="1.5" />
  <line x1="${pad}" y1="${height - pad}" x2="${pad}" y2="${yAxisTop}" stroke="#1a1a2e" stroke-width="1.5" marker-end="${infinity ? 'url(#arrow)' : ''}" />

  ${dots}
  ${infinityLabel}
</svg>
`;
}

const { out, points, infinity } = parseArgs(process.argv.slice(2));
writeFileSync(out, buildSvg(points, { infinity }));
console.log(`Wrote ${out}`);
