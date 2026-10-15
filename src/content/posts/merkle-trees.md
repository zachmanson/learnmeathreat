---
title: Merkle Trees
date: 2026-08-23
tags: ["Cryptography"]
excerpt: "How hashing pairs of hashes lets you prove one item is in a huge set, without anyone sending you the whole set."
slug: merkle-trees
draft: false
---

## What problem do Merkle trees solve?

We've learned that a hash gives you a sort of fingerprint for a piece of data. If you have the hash from someone you trust, you can hash any copy of the data and check whether it gives the same result. This works great when you are checking *all* of the data. However, sometimes you only care about a small piece of a much larger set of data. If you want to know whether some piece is truly part of the larger set, the hash alone doesn't cut it.

Say you're downloading a huge file from a bunch of strangers that's been split into a million chunks, and there's a website that you trust that has published the hash of the entire file. You can't check any single chunk against that hash. The only way for you to make use of it is to download all million chunks, glue them together, hash the result, and compare. If the hashes don't match, you know that *something* is wrong, but not which chunk.

Maybe the obvious fix is to hash each chunk separately, and have the website publish the hash of that list of chunk hashes instead. Now each chunk can be checked against its own entry in the list, but you can't trust any one entry on its own. The only way to check the list is to hash all of it and compare against the website's hash, so you need the full list of a million hashes before you can check anything. Assume the hash function used here is $\operatorname{SHA-256}$, which produces a 256-bit hash. With 8 bits to a byte, each hash is 32 bytes, so a million hashes is 32 million bytes just to check one chunk. What we want is something in between: a single short hash that you can trust, with a small amount of extra data per chunk that proves the chunk's membership. In short, this is what a Merkle tree achieves.

## Building a Merkle tree

Before I get into what a Merkle tree is and how to build one, I need to establish some important notation.

:::notation
For bitstrings $a, b \in \{0, 1\}^*$, we write $a \| b$ to denote the concatenation of $a$ and $b$, i.e., the bitstring $a$ followed by $b$.
:::

A Merkle tree is a special type of binary tree that is used to efficiently determine membership, meaning whether one item is part of a larger set. The "binary" part means that every hash above the bottom layer is built from exactly two hashes below it. In my opinion, it's easier to understand through an example. Say you have 8 pieces of data, $m_1, m_2, \dots, m_8$. You can think of these as the chunks in the example above. First, we hash each chunk with whatever hash function we want, $h_i = \operatorname{hash}(m_i)$, to get $h_1, h_2, \dots, h_8$. These are the leaves of the Merkle tree. Every hash in the tree, from the leaves all the way up to the single hash at the top, is a node. The nodes are paired up, and the parent of each pair is made by concatenating the two children left to right and hashing the result. For example, the parent of $h_1$ and $h_2$ is
$$
h_{12} = \operatorname{hash}(h_1 \| h_2).
$$
Every new layer of the Merkle tree has half as many nodes, and we keep pairing and hashing, layer by layer, until only a single node, the Merkle root $h_\text{root}$, remains.

::figure[A Merkle tree over eight items, $m_1$ to $m_8$. Each item is hashed into the box above it ($h_1$ to $h_8$), and every box higher up is the hash of the two boxes joined to it from below. The single box at the top is the Merkle root, $h_{\text{root}}$.]{src="/images/merkle-tree.svg"}

\label{fig-merkle-tree}

The order matters here. $\operatorname{hash}(h_1 \| h_2)$ and $\operatorname{hash}(h_2 \| h_1)$ are two completely different hashes, since the inputs are different bitstrings, so every node above the leaves is made from two nodes below it, its left child and its right child, and you have to keep track of which is which.

To make this a bit more rigorous, I will define a Merkle tree formally, following Katz and Lindell \cite{KaLi14}.

:::definition
**Merkle tree:** For items $m_1, \dots, m_L$ and a hash function $\operatorname{hash}$, a Merkle tree is built as follows:
1. Each leaf is the hash of one item, $h_i = \operatorname{hash}(m_i)$.
2. Each node above the leaves is the hash of its left child concatenated with its right child, $\operatorname{hash}(h_{\text{left}} \| h_{\text{right}})$.
3. If a layer has an odd number of nodes, the last node is paired with a copy of itself.
4. The Merkle root $h_{\text{root}}$ is the single node at the top, with no node above it.
:::

\label{def-merkle-tree}

:::note
Duplicating the last node is the rule Bitcoin uses, and it can happen at any layer, not just the leaves \cite{Ant17}. When it does, that node's sibling is a copy of itself. Other Merkle trees do it differently, for example by moving the odd node up a layer unchanged \cite{LLK13}.
:::

## Changing any item changes the Merkle root

Similar to a hash, the Merkle root acts as a sort of fingerprint for all of the data contained in the tree. For example, if you were to change $m_3$ by just a single bit, then $h_3$, $h_{34}$, $h_{1234}$, and $h_{\text{root}}$ would also change, unless you managed to find a collision along the way. The same goes for reordering the items, adding items, or removing items. Any change bubbles up and is reflected in the Merkle root. This is similar to the example at the start where you checked the hash of the chunks glued together. By comparing Merkle roots, we know that something in the tree has changed, but not exactly what from the root alone.

There's one kind of exception, which comes from duplicating the last node. With three items, $h_3$ gets paired with a copy of itself, so the four items $m_1, m_2, m_3, m_3$ give exactly the same root as the three items $m_1, m_2, m_3$. The same thing happens whenever any layer has an odd number of nodes. For example, ten items give the same root as twelve items with $m_9$ and $m_{10}$ repeated at the end, since the duplication happens one layer up.

## Merkle proofs

Let's go back to the file example at the beginning. Say you trust the Merkle root, and a stranger sends you $m_3$ and claims it's part of the file. To recompute the Merkle root yourself, you need $h_{34}$ and $h_{1234}$ along the way. Hashing $m_3$ gives you $h_3$. To get $h_{34}$, you need $h_4$. To get $h_{1234}$ from $h_{34}$, you need $h_{12}$. To get the root from $h_{1234}$, you need $h_{5678}$. So if the stranger sends you $h_4$, $h_{12}$, and $h_{5678}$ alongside $m_3$, you can compute
$$
h_{\text{root}}' = \operatorname{hash}\left(\operatorname{hash}(h_{12} \| \operatorname{hash}(\operatorname{hash}(m_3) \| h_4)) \| h_{5678}\right),
$$
and check whether $h_{\text{root}}' = h_{\text{root}}$. If it matches, $m_3$ is in the tree. The three hashes the stranger sent along with $m_3$ are called a Merkle proof.

::figure[The same Merkle tree, showing a Merkle proof for $m_3$. The shaded boxes are the ones you compute: $m_3$ itself, and every hash from $h_3$ up to $h_{\text{root}}$, joined by thick lines. The dashed boxes, $h_4$, $h_{12}$, and $h_{5678}$, are the hashes the proof provides. You never see the faded boxes and lines.]{src="/images/merkle-proof.svg"}

\label{fig-merkle-proof}

Each hash in the proof is the sibling of a node on the path from $h_3$ up to the root, meaning the other node in its pair. The proof also has to say whether each sibling goes on the left or right, since $h_4$ goes after $h_3$ but $h_{12}$ goes before $h_{34}$. Getting this wrong would give a different Merkle root.

:::definition
**Merkle proof:** A Merkle proof that $m_i$ is in a Merkle tree with root $h_\text{root}$ is the list of siblings of the nodes on the path from $h_i$ up to (but not including) $h_\text{root}$, each marked as a left or right sibling. The proof is valid if hashing $m_i$, then hashing the result together with each sibling in turn (on its marked side), gives $h_\text{root}$.
:::

\label{def-merkle-proof}

Notice that each layer has half as many nodes as the one below it, and the proof needs one sibling per layer below the root. That's the number of times you can halve the number of items, $L$, before you get down to 1, which is written $\log_2 L$ (rounded up when $L$ isn't a power of 2). With 8 items that's 3, since $8 \to 4 \to 2 \to 1$. Back to the example at the beginning: if the Merkle tree has 1,000,000 leaves, it takes 20 halvings, since $2^{20} = 1{,}048{,}576$ is the first power of 2 above a million. With 256-bit hashes, that's only $20 \times 32 = 640$ bytes for the proof, which is significantly better than the 32 million bytes required before.

So why can't the stranger just make up a proof for a fake item, one that isn't in the tree? The fake item at the bottom is different from every real item, but the root at the top comes out the same, so somewhere on the way up, two different inputs must have hashed to the same output. That's a collision, and since the hash function is collision resistant (see \ref{def-cryptographic-hash-function}), it's computationally infeasible to fake a Merkle proof \cite{KaLi14}.

## Telling items apart from hashes higher up

There's one catch in that argument: it assumes you know how many layers the tree has \cite{KaLi14}. Remember that $h_{12} = \operatorname{hash}(h_1 \| h_2)$. The bitstring $h_1 \| h_2$ is just two hashes stuck together, and nothing about it says so. Say a stranger claims $h_1 \| h_2$ is one of the items. Hashing it gives $h_{12}$, so with $h_{34}$ and $h_{5678}$ as the proof, you get the real root, and it looks like a valid Merkle proof. No collision was needed, since every hash along the way is a real one from the tree. The giveaway is that this proof only has two hashes, when every real item in an 8-item tree needs three. If you check the length of the proof, this gets caught, but it's an easy check to forget.

The other fix is to hash items differently from pairs of nodes, by putting a fixed 8-bit tag in front of everything before hashing it: $00000000$ in front of every item, and $00000001$ in front of every pair,
$$
h_i = \operatorname{hash}(00000000 \| m_i), \qquad h_{12} = \operatorname{hash}(00000001 \| h_1 \| h_2).
$$
Now if someone passes off $h_1 \| h_2$ as an item, it gets the item tag in front,
$$
\operatorname{hash}(00000000 \| h_1 \| h_2) \ne h_{12},
$$
so the proof fails \cite{LLK13}. Not every Merkle tree does this. The ones that skip it are only safe if you check how many layers the tree has.

All of this only works if you already trust the root. A Merkle proof tells you an item belongs to the tree with a given root, but if a stranger hands you both the root and the proof, they could have built the whole tree themselves out of whatever they wanted. Just like with a plain hash, nothing here tells you *who* the root came from. Next I'm covering digital signatures, which are how you prove who something came from.
