---
title: Authoring Primitives Reference
date: 2026-09-05
tags: ["Quantum Algorithms"]
excerpt: "A quick cheat-sheet for the figure, callout, definition, and labeling primitives available when writing posts."
slug: authoring-primitives
draft: false
---

This one isn't really a post, it's a cheat-sheet I'm keeping around so I remember the exact syntax for the block-level stuff the site supports beyond plain Markdown. If you're reading this and you're not me: hi, this is just plumbing.

## Figures

Figures get a caption and an automatically incrementing "Figure N" label, the same way a LaTeX `figure` environment works. Here's a vector diagram, drawn as black lines on a transparent background so it can invert cleanly in dark mode:

::figure[A vector diagram, inverted in dark mode]{src="/images/authoring-primitives-vector.svg" alt="Box and arrow diagram"}

\label{fig-vector-diagram}

And here's a raster image. Raster figures don't get inverted, since flipping the colors of a photo or a screenshot would just make it look wrong:

::figure[A raster test swatch, not inverted in dark mode]{src="/images/authoring-primitives-raster.png" alt="Colored test swatch"}

## Callouts

Four flavors of callout exist, each opened and closed explicitly so there's never any ambiguity about where a block starts and stops.

:::note
This is a note. Use it for a side comment that's useful but not essential to the main flow.
:::

:::warning
This is a warning. Use it when skipping this part could actually trip someone up.

It can also hold more than one paragraph, like this second one, and both should render inside the same box.
:::

:::tip
This is a tip. Use it for a shortcut or a "here's an easier way to think about it."
:::

:::definition
**Elliptic curve:** a curve defined by an equation of the form $y^2 = x^3 + ax + b$, used because certain operations on its points are easy to compute forward and hard to reverse.
:::

\label{def-elliptic-curve}

## Equations

Block math gets numbered automatically, whether it's labeled or not:

$$
E = mc^2
$$

\label{eq-mass-energy}

$$
a^2 + b^2 = c^2
$$

The first one is tagged "(1)" and is referenceable; the second is tagged "(2)" but has no label, so nothing can `\ref` it.

## Labels & References

\label{sec-labels-and-references}

`\label{key}` marks an equation, definition, figure, or heading as referenceable, written as its own line immediately after the thing it labels, the same convention LaTeX's own `\label` uses. `\ref{key}` anywhere in prose then resolves to a link back to it: a number for equations and figures, or the element's own name for definitions and headings.

Referencing things in this same post: \ref{eq-mass-energy}, \ref{fig-vector-diagram}, and \ref{def-elliptic-curve} all resolve locally. Equations and figures can only be `\ref`'d from the post that defines them; definitions and headings, like this section (\ref{sec-labels-and-references}), can be `\ref`'d from anywhere on the site, see `label-ref-cross-post-fixture.md` for that in action.

Writing the syntax itself inside inline code, like `` `\ref{eq-mass-energy}` ``, stays literal on purpose, the same escape hatch `\cite{}` already has.

## Citations

Citations use a LaTeX-familiar `\cite{key}` syntax, backed by the project-root `references.bib`. Shor's factoring algorithm \cite{shor1997} is the one this whole series keeps coming back to, and Grover's search algorithm \cite{grover1996} shows up whenever amplitude amplification is relevant. Citing the same key again, like \cite{shor1997}, doesn't add a second entry to the reference list below - it's deduplicated automatically.

Writing the syntax itself inside inline code, like `` `\cite{shor1997}` ``, stays literal on purpose - the translation only touches prose text, not code spans, so you can reference the citation syntax without accidentally triggering a real citation.

That's the full set for now. If a real need for more variants shows up while writing actual posts, we'll add them, but the whole point is to keep this list short.
