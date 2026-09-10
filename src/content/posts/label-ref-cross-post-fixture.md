---
title: Label/Ref Cross-Post Fixture
date: 2026-09-04
tags: ["Quantum Algorithms"]
excerpt: "A second fixture post proving \\ref can reach a site-wide label (definition, heading) defined in a different post."
slug: label-ref-cross-post-fixture
draft: false
---

Also plumbing, not a real post. `authoring-primitives.md` labels an elliptic curve definition, a heading, an equation, and a figure. Definitions and headings are site-wide, so they should be `\ref`-able from here even though this is a different post; equations and figures are per-post, so they're deliberately not referenced from here at all.

Recall the definition of \ref{def-elliptic-curve}, first introduced back in the \ref{sec-labels-and-references} section.
