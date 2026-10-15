---
title: Cryptography
date: 2026-08-20
tags: ["Cryptography"]
excerpt: "The four cryptographic tools Bitcoin leans on, and why you need to understand them before any of the quantum stuff makes sense."
slug: cryptography
draft: false
section: true
---

Before we get into how quantum computers threaten Bitcoin, it helps to cover cryptography first. After all, that's what the "crypto" in "cryptocurrency" stands for. This isn't meant to be a full-on tutorial of cryptography from the ground up, but since Bitcoin and every other cryptocurrency (and literally everything else online) relies on cryptography for security, I'll explain as much as I need to provide the right context. This is a blog about how quantum computers affect cryptocurrencies, and what's being threatened is the underlying cryptography itself. It makes sense that we at least get some idea of how these things work first. It would be like writing a blog on how to crack a safe without first explaining how the safe works. It's precisely because we know how the safe works that we can begin to crack it.

Anyways, here is what this section will cover:

- [Asymmetric and symmetric cryptography](/posts/asymmetric-and-symmetric-cryptography/), and which one Bitcoin actually relies on
- [Hash functions](/posts/hash-functions/), and what makes a function "cryptographically" hard to reverse
- [Merkle trees](/posts/merkle-trees/), and how to prove one item is in a huge set without needing the whole set
- [Digital signatures](/posts/digital-signatures/), and how they let you prove ownership without revealing a secret