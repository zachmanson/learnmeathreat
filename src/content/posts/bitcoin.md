---
title: Bitcoin
date: 2026-09-24
tags: ["Bitcoin"]
excerpt: "How Bitcoin actually works, from keys and transactions to mining, covering just enough to see what quantum computers put at risk."
slug: bitcoin
draft: false
section: true
---

Now that we have a solid understanding of the required cryptography, we can discuss the mechanics of Bitcoin. This section will cover how bitcoins are owned, how they move, and how everyone agrees on who owns what without a central authority involved, all from the ground up.

Like the last section, this isn't a full-on tutorial. [Learn Me A Bitcoin](https://learnmeabitcoin.com/) already does that. My goal here is to cover just enough so that we can understand exactly what is being threatened by quantum computers, and what a working quantum attack would mean for Bitcoin.

Anyways, here is what this section will cover:

- [Keys and addresses](/posts/keys-and-addresses/), and how your public key turns into something you can hand out
- [UTXOs](/posts/utxos/), and how Bitcoin tracks who owns what
- [Transactions](/posts/transactions/), and how coins move from one person to another
- [Locking scripts](/posts/locking-scripts/), and how Bitcoin decides who's allowed to spend a coin
- [Blocks and the blockchain](/posts/blocks-and-the-blockchain/), and how transactions get bundled up and chained together
- [Proof-of-work](/posts/proof-of-work/), and why adding a block takes so much computation
- [Mining](/posts/mining/), and who does all that computation and why
- [Forks](/posts/forks/), and what happens when the network disagrees
