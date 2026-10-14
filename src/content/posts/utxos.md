---
title: UTXOs
date: 2026-09-26
tags: ["Bitcoin"]
excerpt: "Bitcoin doesn't store balances anywhere. What it tracks instead are chunks of bitcoin called UTXOs, and that's where your coins actually are."
slug: utxos
draft: false
---

I've already gone through [how an address is built](/posts/keys-and-addresses/) from a private and public key pair. I was vague on purpose, though, about what actually ties those keys to any bitcoins. If your wallet only holds keys, where are the bitcoins?

The short answer is that they're recorded by the Bitcoin network itself. The strange part is that nowhere on the network is there a number saying "this address has X bitcoin". Bitcoin has no built-in balances or accounts. Wallets work these out on top of Bitcoin for the convenience of their users, but they were never part of Satoshi Nakamoto's original design.

Compare this to a bank. Your bank stores one number per account: your balance. When you pay someone, the amount is subtracted from your balance and added to theirs. If Bitcoin doesn't store balances at all, what does it store instead?

## Coins are transaction outputs

Bitcoin's record of who owns what is actually a big list of chunks of bitcoin called *unspent transaction outputs* (UTXOs).

The name says what these are: outputs of transactions that haven't been spent yet. There's no bank keeping track of who paid who, so instead every transaction ever made is recorded in a public record that anyone can check, called the blockchain. A transaction spends some UTXOs and creates new ones as its outputs. If you follow a chunk of bitcoin from where it was first created, through every transaction that spent it, you eventually reach an output that hasn't been spent yet. That output is a UTXO.

:::definition
**Unspent transaction output (UTXO):** A UTXO is a 2-tuple comprising an amount of bitcoin, as an integer number of satoshis (named after Satoshi, 1 satoshi = $10^{-8}$ bitcoin), and a variable-length string of bytes called the *locking script*, which sets the conditions for spending that amount \cite{Ant17}.
:::

:::note
The locking script is written in a small programming language called Script. Think of a locking script as saying "whoever has the private key behind this address can spend these coins", which they prove with a [digital signature](/posts/digital-signatures/). That's what most locking scripts boil down to. In the kind that matches the [address from earlier](/posts/keys-and-addresses/), the script holds the same 20-byte $\operatorname{HASH160}$ of the public key.
:::

## A UTXO gets spent all at once

A UTXO isn't tied to a person by any kind of ID or account. Whoever can satisfy its locking script can spend it. When you pay someone, no file, token, or any other string of data moves from your wallet to theirs.

You also can't spend part of a UTXO. So spending bitcoin means unlocking UTXOs with your keys, spending them in full, and creating new UTXOs in their place, each locked to whoever should control it next. The old ones are used up and can never be spent again. If you want to pay someone less than a whole UTXO, you make one new UTXO for them and another back to yourself with the rest.

I like to picture it like this. Imagine every bitcoin that exists as one big pane of glass, and then shatter it. Each shard is a UTXO, and together they add up to the whole pane. Spending bitcoin is like taking a few of your shards, melting them down, and pouring the glass into new shards of whatever sizes you need. The pieces keep getting broken up and fused back together over time, but no glass is lost in the process. The only time new glass gets added is when new bitcoins are created.

::figure[A pane of glass standing for every bitcoin in existence, where each shard is a UTXO. Before: your three UTXOs are shaded gray, and everyone else's are unshaded. Melted down: your three shards melted into one puddle when you spend them. After: the glass poured into two new shards, one for the person you're paying (hatched) and one back to you (gray). The unshaded shards are the same before and after.]{src="/images/glass-utxos.svg"}

## How do wallets determine your balance?

If no balance is stored anywhere, how does your wallet know what to show you? It looks through the blockchain for every UTXO that its keys can unlock and adds up their amounts to get your balance. When your wallet says you received some bitcoin, what actually happened is it spotted a new UTXO that one of your keys can unlock.

Your UTXOs can be scattered all over the blockchain, created at different times \cite{Ant17}. Several can even sit at the same address. If you think of an address like a bank account, you'd expect paying it twice to add to one number. Instead you end up with two separate UTXOs, both locked to the same $\operatorname{HASH160}$. They're told apart by which transaction created each one.

Your wallet also usually holds more than one key. Most wallets make a new key pair, and a new address, every time you ask to get paid. This is mostly for privacy, since anyone can look up every payment made to an address on the blockchain. So your balance is usually added up across lots of addresses.

## The UTXO set

Bitcoin has no central server keeping track of all this. Thousands of computers around the world each run Bitcoin's software, and each one keeps its own copy of the blockchain \cite{Ant17}. Each of these computers is called a *node*, and all of them together make up the Bitcoin network.

Whenever a node gets a new transaction, it has to check that every UTXO the transaction spends exists and hasn't been spent yet. Going through every transaction ever made each time would be slow. Instead, each node also keeps track of just the UTXOs that exist right now.

:::definition
**UTXO set:** The UTXO set is the set of all unspent transaction outputs at a given moment.
:::

The UTXO set is what answers "who can spend what". Every transaction changes it: the UTXOs it spends leave the set, and the new UTXOs it creates join it \cite{Ant17}. A node can fall a few seconds behind while updates spread across the network, but otherwise every node's copy of the UTXO set is the same.

That check is also what stops someone spending the same bitcoin twice, called a *double spend*. To be spent, a UTXO has to be in the set, and once it's spent it gets removed. So if you try to spend a UTXO that's already been spent, every node sees it's missing from the set and rejects the transaction. Two transactions spending the same UTXO at the same time is a harder problem, since nodes can receive them in different orders and disagree on which one came first.

So, back to the question from the start: where are your bitcoins? They're UTXOs in the UTXO set, and every node has a copy. Your wallet holds the private keys that can unlock them. For most UTXOs, the only thing stopping someone else from spending yours is that they can't make a [digital signature](/posts/digital-signatures/) without your private key, and no computer today can work out your private key from your public key.
