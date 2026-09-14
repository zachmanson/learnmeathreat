#!/usr/bin/env node
// Generates an SVG showing elliptic curve point addition: P1, P2, the line
// through them, its third intersection R with the curve, and the reflection
// of R across the x-axis, P3 = P1 + P2.
//
// Usage:
//   node scripts/ec-point-addition.mjs [output.svg]
//   node scripts/ec-point-addition.mjs [output.svg] --a=0 --b=7 --x1=-1 --x2=1.5
//
// Curve form: y^2 = x^3 + a*x + b

import { writeFileSync } from "node:fs";

function parseArgs(argv) {
  const args = { a: 0, b: 7, x1: -1.5, x2: 1, out: "ec-point-addition.svg" };
  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      args.out = arg;
      continue;
    }
    const [key, value] = arg.slice(2).split("=");
    args[key] = Number(value);
  }
  return args;
}

function curveY(x, a, b) {
  const rhs = x ** 3 + a * x + b;
  return rhs < 0 ? null : Math.sqrt(rhs);
}

// Smallest real root of x^3 + a*x + b = 0, used as the left edge of the
// curve's domain (below it, y^2 is negative and there's no real point).
function domainStart(a, b) {
  let lo = -10;
  let hi = 10;
  // rhs is increasing for our chosen (a, b), so binary search for the
  // crossing point.
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (mid ** 3 + a * mid + b < 0) lo = mid;
    else hi = mid;
  }
  return hi;
}

function addPoints(p1, p2, a) {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const m = x1 === x2 && y1 === y2 ? (3 * x1 ** 2 + a) / (2 * y1) : (y2 - y1) / (x2 - x1);
  const xR = m ** 2 - x1 - x2;
  const yR = y1 + m * (xR - x1);
  return { m, r: [xR, yR], p3: [xR, -yR] };
}

function buildSvg({ a, b, p1, p2 }) {
  const { m, r, p3 } = addPoints(p1, p2, a);

  const xMin = Math.min(domainStart(a, b), p1[0], p2[0], r[0], p3[0]) - 0.5;
  const xMax = Math.max(p1[0], p2[0], r[0], p3[0]) + 0.5;
  const yMax = Math.max(Math.abs(p1[1]), Math.abs(p2[1]), Math.abs(r[1])) + 0.5;
  const yMin = -yMax;

  const width = 640;
  const height = 640;
  const pad = 40;
  const sx = (width - 2 * pad) / (xMax - xMin);
  const sy = (height - 2 * pad) / (yMax - yMin);
  const toX = (x) => pad + (x - xMin) * sx;
  const toY = (y) => height - pad - (y - yMin) * sy;

  const curvePoints = [];
  const steps = 400;
  const start = domainStart(a, b);
  for (let i = 0; i <= steps; i++) {
    const x = start + (xMax - start) * (i / steps);
    const y = curveY(x, a, b);
    if (y !== null) curvePoints.push([x, y]);
  }
  const upperPath = curvePoints.map(([x, y]) => `${toX(x)},${toY(y)}`).join(" ");
  const lowerPath = curvePoints.map(([x, y]) => `${toX(x)},${toY(-y)}`).join(" ");

  // Extend the secant/tangent line across the full plot width so it visibly
  // passes through R.
  const lineX0 = xMin;
  const lineX1 = xMax;
  const lineY0 = p1[1] + m * (lineX0 - p1[0]);
  const lineY1 = p1[1] + m * (lineX1 - p1[0]);

  // Renders an italic "P" with a subscript, the way LaTeX would set P_n.
  const pLabel = (sub) =>
    `<tspan font-style="italic">P</tspan><tspan baseline-shift="-25%" font-size="11">${sub}</tspan>`;

  const point = (p, labelMarkup, dy, fill, { dot = true } = {}) => `
    ${dot ? `<circle cx="${toX(p[0]).toFixed(2)}" cy="${toY(p[1]).toFixed(2)}" r="5" fill="${fill}" />` : ""}
    ${labelMarkup === null ? "" : `<text x="${toX(p[0]).toFixed(2)}" y="${(toY(p[1]) + dy).toFixed(2)}" font-family="Georgia, serif" font-size="16" fill="${fill}" text-anchor="middle">${labelMarkup}</text>`}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white" />

  <!-- axes -->
  <line x1="${pad}" y1="${toY(0).toFixed(2)}" x2="${width - pad}" y2="${toY(0).toFixed(2)}" stroke="#ccc" stroke-width="1" />
  <line x1="${toX(0).toFixed(2)}" y1="${pad}" x2="${toX(0).toFixed(2)}" y2="${height - pad}" stroke="#ccc" stroke-width="1" />

  <!-- curve -->
  <polyline points="${upperPath}" fill="none" stroke="#1a1a2e" stroke-width="2" />
  <polyline points="${lowerPath}" fill="none" stroke="#1a1a2e" stroke-width="2" />

  <!-- secant/tangent line through P1 and P2 -->
  <line x1="${toX(lineX0).toFixed(2)}" y1="${toY(lineY0).toFixed(2)}" x2="${toX(lineX1).toFixed(2)}" y2="${toY(lineY1).toFixed(2)}" stroke="#e63946" stroke-width="1.5" />

  <!-- reflection line from R to P3 -->
  <line x1="${toX(r[0]).toFixed(2)}" y1="${toY(r[1]).toFixed(2)}" x2="${toX(p3[0]).toFixed(2)}" y2="${toY(p3[1]).toFixed(2)}" stroke="#457b9d" stroke-width="1.5" stroke-dasharray="6 4" />

  ${point(p1, pLabel("1"), -14, "#1a1a2e")}
  ${point(p2, pLabel("2"), -14, "#1a1a2e")}
  ${point(r, null, 0, "#e63946")}
  ${point(p3, `${pLabel("3")} = ${pLabel("1")} + ${pLabel("2")}`, 24, "#2a9d8f")}
</svg>
`;
}

const args = parseArgs(process.argv.slice(2));
const { a, b, x1, x2 } = args;
const y1 = curveY(x1, a, b);
const y2 = curveY(x2, a, b);
if (y1 === null || y2 === null) {
  throw new Error(`x1=${x1} or x2=${x2} is outside the curve's real domain for a=${a}, b=${b}`);
}

const svg = buildSvg({ a, b, p1: [x1, y1], p2: [x2, y2] });
writeFileSync(args.out, svg);
console.log(`Wrote ${args.out}`);
