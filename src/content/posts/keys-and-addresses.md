---
title: Keys and Addresses
date: 2026-09-25
tags: ["Bitcoin"]
excerpt: "How a Bitcoin private key turns into a public key, then a hash, then an address you can hand out to receive coins."
slug: keys-and-addresses
draft: false
---

## Somewhere to send coins

We have spent a lot of effort building up digital signatures from the basics of cryptography and hash functions, all to understand how you can prove you own a private key without revealing it. In a very general sense, this is how spending bitcoin works (we will get into the actual specifics later).

However, spending is only half of it. If someone wants to send you bitcoin, they need something of yours to send it to. You might expect that to be your public key. It can be, but usually it isn't, and the reasons why end up mattering a lot once we get to quantum computers. This post covers the keys Bitcoin uses and the thing you actually hand out to receive coins.

## Your private key is just a number

In Bitcoin, a private key is just a number $d$ picked at random. Whoever knows $d$ can authorize spending the coins tied to it. In other words, whoever owns $d$ owns those bitcoins. That also means if someone else learns your $d$, they can spend your bitcoins. If you lose $d$, no one can get them back for you.

:::note
I'm keeping the link between $d$ and its bitcoins vague on purpose, since we aren't ready for it yet. The point here is that every bitcoin is tied to a specific $d$, and you'll just have to trust me for now.
:::

The important thing here is that $d$ must be random. This is the only thing protecting $d$ from anyone else guessing it. If you generated $d$ with a predictable process, like a general-purpose random number generator such as `rand()` in C, then someone could run the same process, get the same $d$, and steal your coins. Instead, you need a random number generator that is cryptographically secure. I'm not going to get into the details of exactly what that means, since it's a whole area of research on its own. In 2013, a [bug in Android's random number generator](/posts/digital-signatures/) got coins stolen from Bitcoin wallets.

To get a little more specific, $d$ is picked uniformly from $\{1, \dots, n - 1\}$, where $n$ is the [order of $G$](/posts/digital-signatures/). For Bitcoin, $n$ is about $1.158 \times 10^{77}$, which is just under $2^{256}$, so every private key fits in a 256-bit number. In hex, that's 64 digits. Here's what a real one looks like \cite{Ant17}:

`1E99423A4ED27608A15A2616A2B0E9E52CED330AC530EDCC32C8FFC6A526AEDD`

Nobody is guessing that number by trying keys one at a time. There is simply not enough time in their life to do it.

As long as $d$ stays secret, your coins are safe, so you never show it to anyone. To actually use it, though, other people need something they can check your signatures against without ever learning $d$. That's your public key.

## From private key to public key

Now that you have a private key, the associated public key is the point $P = dG$ on the [elliptic curve](/posts/asymmetric-and-symmetric-cryptography/). Hopefully you recognize this by now. Going from $d$ to $P$ is quick, but going backwards from $P$ to $d$ is the \ref{def-ecdlp}.

Remember, $P$ is a point $(x, y)$ on the secp256k1 elliptic curve. To share $P$ with anyone, you can't just hand them the point itself. Computers only send bytes, so the public key has to be written as a string of bytes in a format everyone agrees on.

:::note
Taking some piece of data and turning it into a string of bytes comes up a lot, and it's called serialization. Exactly how a piece of data gets serialized depends on the standard written for it.
:::

The original serialization format for a public key is the byte `04`, followed by $x$ as 32 bytes, then $y$ as 32 bytes, for 65 bytes total \cite{Ant17}.

However, we don't actually need both coordinates. For any $x$, there are at most two points on the curve with that $x$-coordinate: $(x, y)$ and $(x, -y)$. Working mod $p$,

$$
-y \equiv p - y \pmod{p}.
$$

Since $p$ is odd (it's a huge prime, so it isn't 2), one of $y$ and $p - y$ is even and the other is odd (they add up to $p$, and two evens or two odds always add to an even number). In other words, if we know $x$, all we need to note is whether $y$ is even or odd.

This is the compressed format: write `02` if $y$ is even or `03` if $y$ is odd, followed by $x$ as 32 bytes. That's 33 bytes instead of 65.

Either way, you could hand out your public key like this and people could send you coins with it. Usually, though, you don't hand out $P$ at all. You hash it first, and what you hand out is built from that hash.

## Hashing public keys

Bitcoin hashes your public key with a specific function called $\operatorname{HASH160}$. This is actually a combination of two hash functions,

$$
\operatorname{HASH160}(P) = \operatorname{RIPEMD-160}\left(\operatorname{SHA-256}(P)\right),
$$

where $P$ is the serialized public key. These are the [two hash functions Bitcoin uses](/posts/hash-functions/) that I mentioned earlier.

:::note
Satoshi (Bitcoin's creator) never actually explained why Bitcoin uses this combination, so the best I can do is give the reasons people usually point to. $\operatorname{RIPEMD-160}$ has a 160-bit output, which keeps the hash short. Running $\operatorname{SHA-256}$ first means that to get from a hash back to a public key, an attacker would have to reverse both functions, so a break in just one of them isn't enough.

This only helps with going backwards, though. For collisions, the 160-bit output caps things at about $2^{80}$ tries by the [birthday bound](/posts/hash-functions/).
:::

As the name suggests, the output of this hash function is 160 bits, or 20 bytes. One benefit is that 20 bytes is shorter than the 33 or 65 bytes of the compressed or uncompressed public key. Which format of the public key you hash doesn't matter, since both are valid. However, the two formats are different bytes, so they hash to completely different outputs. This means the same public key technically has two valid hashes, depending on which format was hashed.

Another benefit of hashing the public key is that it hides the public key itself, at least until the associated coin is spent. This may not seem like a big deal now, but it will become very important once we get into the different quantum threats. Not every type of address does this. Some [leave the public key in plain view](/posts/locking-scripts/).

## Addresses

Now that we have a short hash of your public key, this is technically enough to give to someone so they can send you bitcoin. However, a 20-byte hash is not something you would want to read out to someone or type by hand. The final step is to encode the hash into an *address*, which is a string of characters representing that hash.

The idea is similar to an email address or a URL. If you wanted to go to Google's site, you would type www.google.com, not 142.250.80.46 (or whatever the IP address happens to be). The same goes for email. If you wanted to email Satoshi Nakamoto, for example, you would type in satoshin@gmx.com (at least before that account was hacked), not whatever raw string of bits corresponds to that email.

:::note
The analogy isn't perfect though. A website name or email address is a label that gets used to look up the raw data somewhere else. A Bitcoin address is the raw data itself, just written in a friendlier way.
:::

Here's how a hashed public key is turned into an address in Bitcoin, using the original encoding, called Base58Check \cite{Ant17}:

1. Put a version byte in front of the hashed public key. For addresses built from a public key hash, it's `00`.
2. Hash the result twice with $\operatorname{SHA-256}$ and keep the first 4 bytes. This is called the checksum.
3. Add the checksum to the end of the version byte and hashed public key.
4. Write the resulting 25 bytes as one number in base 58. Any leading `00` bytes would vanish when you do this (the same way 007 is just 7), so each one is written as a `1`, which is the zero digit in base 58.

Base 58 is the same idea as base 10 or base 16, just with 58 digits. These digits are all the numbers and letters except 0, O, I, and l, since these are easy to mix up. That leading `00` byte is also why these addresses always start with a `1`.

The point of the checksum is to catch typos. When a wallet (the software that stores your private and public keys) reads an address, it recomputes the checksum. If it doesn't match the last 4 bytes of the address, the address is rejected, so you don't send your coins somewhere nobody can spend them.

Base58Check isn't the only encoding. Newer addresses starting with `bc1` use one called Bech32, introduced in 2017 \cite{WuMa17}, or a slightly modified variant called Bech32m \cite{Wui20}. It never mixes uppercase and lowercase letters, and its checksum is better at catching typos.

Here's the whole process from start to finish, using the private key from earlier and its compressed public key \cite{Ant17}.

| Step | Result |
|---|---|
| Private key $d$ | `1E99423A4ED27608A15A2616A2B0E9E52CED330AC530EDCC32C8FFC6A526AEDD` |
| Public key $P = dG$ (compressed, $y$ is odd so the prefix is `03`) | `03F028892BAD7ED57D2FB57BF33081D5CFCF6F9ED3D3D7F159C2E2FFF579DC341A` |
| $\operatorname{SHA-256}(P)$ | `448997AE8759EB23D6C6B67DE6FC3419006CBF061617C3E07323AAF5BCD53476` |
| $\operatorname{HASH160}(P)$ | `BBC1E42A39D05A4CC61752D6963B7F69D09BB27B` |
| Checksum | `37FEFCD0` |
| Version byte, hash, and checksum (25 bytes) | `00BBC1E42A39D05A4CC61752D6963B7F69D09BB27B37FEFCD0` |
| Address (base 58) | `1J7mdg5rbQyUHENYdx39WVWK7fsLpEoXZy` |

Addresses come in a few different forms, as I mentioned earlier, but this is the canonical example. Different address types exist because Bitcoin has added new ways of locking up coins over the years, and each one got its own kind of address. I'm not going to go through all of them. I'll only cover the [ones that matter for the quantum threat](/posts/locking-scripts/).

One last thing: I've been saying things like "coins sent to an address" and "coins tied to $d$" this whole post without explaining what that actually means. Your wallet stores your keys, but there's no balance sitting at each address the way there is in a bank account. I'll get into how it actually works, and what the link between keys and bitcoins is, in my next post on [UTXOs](/posts/utxos/).
