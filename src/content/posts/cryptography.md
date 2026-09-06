---
title: Cryptography
date: 2026-08-20
tags: ["Cryptography"]
excerpt: "The three cryptographic tools Bitcoin leans on, and why you need to understand them before any of the quantum stuff makes sense."
slug: cryptography
draft: false
---

This post isn't written yet. Before diving into how quantum computers threaten Bitcoin, there are three cryptographic building blocks worth understanding first: asymmetric and symmetric encryption, hash functions, and digital signatures. This chapter walks through each one from the ground up so nothing later in the series relies on unexplained machinery.

What this chapter will cover:

- Asymmetric and symmetric cryptography, and why Bitcoin uses one over the other in different places
- Hash functions, and what makes a function "cryptographically" hard to reverse
- Digital signatures, and how they let you prove ownership without revealing a secret
