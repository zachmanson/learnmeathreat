---
title: Asymmetric and Symmetric Cryptography
date: 2026-08-21
tags: ["Cryptography"]
excerpt: "The difference between sharing one secret key and using a public/private key pair, and why Bitcoin relies on the latter."
slug: asymmetric-and-symmetric-cryptography
draft: false
---

Before we can talk about how quantum computers threaten Bitcoin and other cryptocurrencies, we first need to understand what's actually being threatened at a fundamental level. This first post is the "cryptography 101" you need before reading the rest of this blog.

## The problem Bitcoin needs cryptography to solve

Let's say you want to send someone some bitcoin. You need to prove that you're allowed to spend this bitcoin over the internet, to a large group of strangers, without a bank in the middle ensuring integrity and vouching for you. On top of this, you need to do this without exposing the secret that authorizes you to spend it, in a way that would let anyone who saw it spend your money too.
Whatever message you send to authorize yourself as the rightful person to spend your money needs to survive an adversary that sees literally anything and everything you ever send.

## Symmetric cryptography

The obvious and maybe naive first idea is to use a shared secret. You and the network agree on some password ahead of time, and when you want to spend your money, you show the password to the network, and in return they let you spend your money. However, there is a huge problem with this method: you can't trust everyone else. Once you reveal your password to everyone in the network, anyone can use it to spend your money by pretending to be you. Now you are broke.

So, the shared password idea doesn't work. But, the underlying instinct is correct. The key mistake here was that you shared your secret with everyone else. What if instead of revealing this secret to everyone to authorize yourself, you use your secret to jumble up a message into garbage that can only be de-garbagified by those you trust to share your secret with. This way, anyone eavesdropping only receives the garbage, and can't pretend to be you and steal your money.

This is the core idea with encryption: using a secret *key* to scramble up a message that can only be unscrambled back into the original message using the key again.

:::note
In the context of cryptography, we refer to these 'secrets' as **keys**. The key itself can be anything that we want, like a hexadecimal string, a random integer, an image, a byte array, etc.
:::

There's actually a name for this kind of encryption: it's called symmetric cryptography. To make this more precise, because "scrambling" is doing a lot of hand-waving right now, I'm going to follow Katz and Lindell's definition \cite{KaLi14}.

:::definition
**Symmetric Encryption:** A symmetric encryption scheme over a message space $\mathcal{M} \subseteq \{0, 1\}^*$ is a 3-tuple of probabilistic polynomial-time algorithms comprising
1. A key-generation algorithm $\texttt{Gen}$ that outputs a key $k \gets \texttt{Gen}\left(1^\kappa\right)$ given a security parameter $\kappa$ according to some probability distribution over the key space $K$.
2. An encryption algorithm $\texttt{Enc}$ that computes a ciphertext $c \gets \texttt{Enc}_k (m)$ given a key and a plaintext message $m \in \mathcal{M}$.
3. A decryption algorithm $\texttt{Dec}$ that computes the message $m := \texttt{Dec}_k(c)$ given the key and ciphertext.
:::

\label{def-symmetric-encryption}

:::note
The security parameter $\kappa$ is technically an input to $\texttt{Gen}$ and really just guarantees that the key is at least $\kappa$ bits long. It's not that important for this post but I decided to keep it in for rigour's sake.
:::

It is required that for every $k$ output by $\texttt{Gen}(1^\kappa)$, and for every $m \in \mathcal{M}$,

$$
\texttt{Dec}_k\left(\texttt{Enc}_k\left(m\right)\right) = m.
$$

So does this actually fix the problem we started with? With the first password idea, the secret itself was transmitted to everyone else in the network, for any eavesdropper to see and use. With symmetric encryption, only $c$ is ever revealed to everyone else, and $k$ only needs to be revealed to the sender and recipient. An eavesdropper only sees $c$, which reads as garbage. However, notice that both the sender and recipient need to know what $k$ is for this to work. Is that feasible in a network where you don't trust anyone? Odds are that you will be sending many of these kinds of authorization messages to many different people in the network. You could use a different $k$ for each, but how does $k$ get sent to the recipient? If this were your friend standing in the room with you, you could simply write down $k$ and hand it to them. However, you and basically everyone in the Bitcoin network have never met, and never will. Every single bit you could possibly send over the network to reveal $k$ can and will be intercepted by an adversary. We are back at stage one. This is its own area of research, called *key distribution*, but it's not what this post or this blog is about. Is there a way for two people who do not trust each other and have never met to agree on a shared secret without revealing the secret itself?

## Asymmetric cryptography

It turns out, it is possible for two people who do not trust each other to agree on this shared secret without revealing the secret itself. However, it requires a trick that seems painfully obvious once you actually see it. We need to utilize a *trapdoor function*: a function that's easy to compute in one direction given some input, but extremely hard to reverse. As a physical analogy, think of squeezing toothpaste out of the tube. Squeezing it out is trivial, but getting it back into the tube is exceptionally difficult.

In the cryptographic sense, instead of generating one key that both the sender and recipient both somehow need to already have, you generate two separate keys that are mathematically linked. One of them, the **public key**, you are free to share with anyone, and the other, the **private key**, you keep to yourself. The clever part here is that anyone with knowledge of your public key can use it to encrypt your message in a way that the only way to decrypt it is with your private key. This is called asymmetric cryptography (or public key cryptography).

Following Katz and Lindell again \cite{KaLi14}, I am going to make this more precise.

:::definition
**Asymmetric Encryption:** An asymmetric encryption scheme is a 3-tuple of probabilistic polynomial-time algorithms comprising
1. A key-generation algorithm $\texttt{Gen}$ that outputs a pair of keys $(pk, sk) \gets \texttt{Gen}(1^\kappa)$ given a security parameter $\kappa$, with $pk$ being the public key and $sk$ being the secret key.
2. An encryption algorithm $\texttt{Enc}$ that computes a ciphertext $c \gets \texttt{Enc}_{pk}(m)$ given the public key and a plaintext message $m \in \mathcal{M}$.
3. A decryption algorithm $\texttt{Dec}$ that computes the message $m := \texttt{Dec}_{sk}(c)$ given the private key and the ciphertext.
:::

\label{def-asymmetric-encryption}

It is required that for every $(pk, sk)$ output by $\texttt{Gen}(1^\kappa)$ and for every message $m$,

$$
\texttt{Dec}_{sk}\left(\texttt{Enc}_{pk}\left(m\right)\right) = m.
$$

The shape is basically identical to the symmetric case, with the only difference being that $\texttt{Gen}$ now outputs two keys instead of one, and $\texttt{Enc}$ and $\texttt{Dec}$ use separate keys. $\texttt{Enc}$ needs to make use of a trapdoor function because $pk$ has to be computable from $sk$, but going the other way around, i.e., computing $sk$ from $pk$, needs to be computationally hard.
Next we will explore exactly what kind of mathematical operations allow us to do this, and why exactly we can trust that these encryption schemes are secure in the first place.

## What makes these keys hard to break?

I'm not going to walk you through how any specific encryption scheme works step by step. What I want to get across is that whichever asymmetric encryption scheme you look at, its security ultimately comes down to the "hardness" of a few specific, named computational problems. Before we can even say what these computational problems are, I am first going to be more precise about what "hard" means in this context instead of waving it around without meaning. First, I need to quickly discuss a mathematical object called a group \cite{KaLi14}.

:::definition
**Group:**  A group is a set $\mathbb{G}$ along with a binary operation $\circ$ satisfying
1. **Closure:** For all $g, h \in \mathbb{G}, g \circ h \in \mathbb{G}$.
2. **Identity:** There exists an identity $e \in \mathbb{G}$ such that for all $g \in \mathbb{G}$, $e \circ g = g = g \circ e$.
3. **Inverse:** For all $g \in \mathbb{G}$, there exists $h \in \mathbb{G}$ such that $g \circ h = e = h \circ g$.
4. **Associativity:** For all $g_1, g_2, g_3 \in \mathbb{G}, (g_1 \circ g_2) \circ g_3 = g_1 \circ (g_2 \circ g_3)$.
:::

\label{def-group}

I promise this isn't about to turn into a full abstract algebra lesson. We just need one more definition before I can get into what these hard problems are.

:::definition
**Cyclic Group:** A group $\mathbb{G}$ is cyclic if there exists an element $g \in \mathbb{G}$, called a generator, such that every element $h \in \mathbb{G}$ can be written as $h = g^x$ for some integer $x$.
:::

\label{def-cyclic-group}

The important part to point out is that computing $g^x$ given both $g$ and $x$ is fast, even for very large values of $x$. There's a method called *repeated squaring* that allows us to compute $g^x$ in at most $\log(x)$ computational steps. Going backwards however, is very difficult, and you can actually see why with a tiny example. Consider $g = 2$ and $x \in \{0, 1, \dots, 9\}$. Let's look at the group $g$ generates (mod 11).

| $x$ | $2^x \bmod 11$ |
|:---:|:---:|
| 0 | 1 |
| 1 | 2 |
| 2 | 4 |
| 3 | 8 |
| 4 | 5 |
| 5 | 10 |
| 6 | 9 |
| 7 | 7 |
| 8 | 3 |
| 9 | 6 |

:::note
For prime $p$, the set of non-zero integers $\{1, 2, \dots, p - 1\}$ under multiplication modulo $p$ always forms a cyclic group of order (size) $p - 1$, meaning there exists $g$ such that $\{g^0, g^1, \dots, g^{p-2}\}$ produces every element in the set \cite{KaLi14}.
:::

If we look at the right column, it looks essentially random. The numbers don't follow an obvious pattern or cycle in some obvious order. If I handed you the number 3 and asked you "which power of 2 gives you this, mod 11", your best move is to just check every number yourself. There is no structure to exploit or any shortcut to get you to the answer faster. Now imagine instead of having 10 entries in this table, we had more entries than there are atoms in the observable universe. You could combine all of the Earth's computational power together and you still wouldn't find the answer in your lifetime (or anyone else's lifetime for that matter). This is one of the key computational problems that underlies asymmetric cryptography.

:::definition
**Discrete Logarithm Problem (DLP):** Given a cyclic group $\mathbb{G}$ of order $n$ with generator $g$, and given $h \in \mathbb{G}$, find the integer $x \in \{0, 1, \dots, n - 1\}$ such that

$$
g^x = h.
$$
:::

\label{def-dlp}

The discrete-logarithm assumption is just the claim that no efficient algorithm can solve this, for the right choice of group (some cyclic groups are trivial). This is the exact assumption Diffie-Hellman key exchange is built on. It's also one of two (three if you want to be really technical) computational problems that underpin the cryptography used in Bitcoin and other cryptocurrencies today. Luckily, the other computational problem is much easier to understand and is simpler to state.

:::definition
**Integer Factorization Problem:** Given a semiprime $N$, find primes $p_1, p_2 > 1$ such that

$$
N = p_1 p_2.
$$
:::

\label{def-integer-factorization}

Much simpler, but the same idea holds. Multiplying two large prime numbers together is fast, and a computer can do this instantly, no matter how large they are. But, hand someone $N$ and tell them to factor it into $p_1$ and $p_2$, there's no shortcut for them to exploit and they are stuck testing candidates again. This is why $p_1$ and $p_2$ need to be prime in the first place, because if $N$ had many factors we could easily shrink the problem down as we found more factors. Nobody has ever found an efficient algorithm to solve this problem either, which is why we still rely on it for encryption today. This is the assumption RSA is built on.

Every trapdoor function that you will run into in practice more than likely relies on one of these two problems for its cryptographic hardness. However, there's one thing to note here: 'hard' just means that the best known attacks take an infeasible amount of time to work (like on the order of the time until the end of the universe), and exactly how infeasible these attacks are scales with the order of the group or number of bits required to represent the primes. For groups like the example above, the best-known attacks can actually solve these problems in sub-exponential times \cite{KaLi14}, meaning that they are still slower than an efficient (polynomial time) algorithm, but faster than brute force. As a consequence, the order of the group or the size of the primes used for the keys must be large enough to outpace these algorithms. Therefore, we end up with keys of around 2048 bits. For something like Bitcoin, which needs to store and generate a large number of these keys, this size adds up fast and turns into a real bottleneck.

The obvious question to raise from here is: is there some other group we can plug into the DLP that survives these sub-exponential attacks, meaning that we don't need to store such large keys to be safe? Turns out yes, but it's built out of a very different kind of math that we need to introduce first.

## Elliptic curves

There is a special class of groups that allow us to sidestep this large key issue, while remaining just as secure. These groups rely on elliptic curves \cite{KaLi14}.

:::definition
**Elliptic Curve:** An elliptic curve is the set of points $(x, y)$ satisfying

$$
y^2 = x^3 + Ax + B \pmod{p}
$$

for fixed constants $A, B$ and prime $p$, with $A$ and $B$ satisfying

$$
4A^3 + 27B^2 \neq 0 \pmod{p}
$$
:::

\label{def-elliptic-curve-group}

:::note
The constraint on $A$ and $B$ ensures that the curve has no repeated roots and doesn't cross itself at some point.
:::

The group corresponding to the elliptic curve that we care about is the set of points $(x, y)$ satisfying the above equation, together with one special point, the *point at infinity*, $\mathcal{O}$, which doesn't correspond to any $(x, y)$ pair, but is added purely so that the group satisfies the identity and inverse requirements. Put more formally,

$$
\mathbb{E}(\mathbb{Z}_p) := \{(x, y) \mid x, y \in \mathbb{Z}_p \text{ and } y^2 = x^3 + Ax + B \bmod p\} \cup \{\mathcal{O}\}
$$

for $\mathbb{Z}_p = \{0, 1, \dots, p - 1\}$. Recall that groups require a binary operation along with the set (\ref{def-group}). The binary operation here is called point addition, and it's precisely why we care about using elliptic curves for encryption in the first place. To add two points, $P_1$ and $P_2$, we do the following operations:

1. Draw a straight line connecting $P_1$ and $P_2$.
2. Find the point where this straight line intersects the elliptic curve.
3. $P_3$ is obtained by reflecting this intersection point along the $x$ axis.

Here's what that looks like on an actual curve.

::figure[A visual representation of adding two points on an elliptic curve.]{src="/images/ec-point-addition.svg"}

\label{fig-ec-point-addition}

:::note
If we wish to add $P_1$ with itself, denoted $2P_1$, we first draw the line at $P_1$ that is tangent to the curve, then we find the intersection of this tangent line with the curve and then reflect along the x-axis.
:::

This is a nice visual example of how adding points on an elliptic curve works, but your computer isn't literally going to draw out a curve and connect points like this. In fact, the points in the elliptic curve group $\mathbb{E}(\mathbb{Z}_p)$ do not form a continuous curve at all, and instead look like a handful of scattered points with no continuous shape. It needs to be done with nothing but arithmetic. To show how that looks, let's do an example small enough to check by hand. Take the curve

$$
y^2 = x^3 + 3x + 3 \pmod{7}
$$

with the points

$$
\mathbb{E}(\mathbb{Z}_7) = \{\mathcal{O}, (1, 0), (3, 2), (3, 5), (4, 3), (4, 4)\}.
$$

::figure[A scatter plot of the elements of $\mathbb{E}(\mathbb{Z}_7$).]{src="/images/plot-points.svg"}

Note that I have silently skipped a step here to show how exactly we get these points from the elliptic curve equation. For each $x$ from 0 to 6, compute $f(x) := x^3+3x+3 \bmod 7$, then ask if $f(x)$ has a square root mod 7. If $f(x)=0$, you get one point, $(x,0)$. If it has a square root $y$, you get two points, $(x,y)$ and $(x,-y \bmod 7)$. If it has no square root, that $x$ isn't on the curve at all. Take $x=3$: $f(3)=39\equiv4\pmod7$, and 4 has square roots 2 and 5 mod 7, giving $(3,2)$ and $(3,5)$, exactly what's in the set above. Same check across all 7 values of $x$ gives you the whole curve.

Let's add two of these points together anyway, $P_1 = (1, 0)$ and $P_2 = (4, 3)$, using the exact same rules as before, except algebraically.

The line through both points has slope

$$
\lambda = \frac{y_2 - y_1}{x_2 - x_1}
$$

or

$$
\lambda = (3 - 0)(4 - 1)^{-1} \equiv (3)(5) \equiv 1 \pmod{7}.
$$

In general, the equation of this line is written as

$$
y = \lambda(x - x_1) + y_1 = \lambda x + \underbrace{y_1 - \lambda x_1}_{b} = \lambda x + b.
$$

Substituting this into the general cubic curve equation $y^2 = x^3 + Ax + B$, we get

$$ 
(\lambda x + b)^2 = x^3 + Ax + B \implies x^3 - \lambda^2x^2 + (A - 2\lambda b)x + (B - b^2) = 0. 
$$

By Vieta's formula, any cubic of the form $x^3 + a_2x^2 + a_1x + a_0 = 0$ has roots that sum to $-a_2$, so here they sum to $-(-\lambda^2) = \lambda^2$, or in other words

$$ 
x_1 + x_2 + x_3 = \lambda^2 \implies x_3 = \lambda^2 - x_1 - x_2 \implies x_3 = 1 - 1 - 4 = -4 \equiv 3 \pmod{7}.
$$

Plugging into the equation of the line above, and flipping the sign to reflect along the $x$-axis, we get

$$ 
y_3 = \lambda(x_1 - x_3) - y_1 = 1(1 - 3) - 0 = -2 \equiv 5 \pmod{7}.
$$

So $P_1 + P_2 = (3, 5)$, which is one of the six points already in $\mathbb{E}(\mathbb{Z}_7)$. In fact, similar to how multiplication mod a prime before had a generator $g$, where $g^0, g^1, g^2, \dots$ gives all elements of the group, elliptic curves also have the same idea, just with addition. There is some point $G$ on the curve such that repeatedly adding $G$ to itself, $G$, $2G$, $3G$, \dots, gives all of the elements of the group in the same way. We call $G$ a generator too.

In practice, $G$ isn't chosen to generate all elements of the group, and instead only generates a large subgroup of prime order, as an efficient attack exists for non-prime order groups \cite{KaLi14}. Now to tie everything back together. Say that I hand you a point $G$ on an elliptic curve, and another point $P$, such that

$$
P = dG
$$

for some integer $d$. In other words, $G$ was added to itself $d$ times to produce $P$. Could you tell what $d$ is from this information? No, or at least nobody knows how to do it efficiently.

:::definition
**Elliptic Curve Discrete Logarithm Problem (ECDLP):** Given a generator $G$ on an elliptic curve, and a point $P = dG$, determine $d$.
:::

\label{def-ecdlp}

This is the same as the DLP from before (\ref{def-dlp}), except in a different form. We have used a group built out of addition on an elliptic curve, rather than one built out of numbers mod a prime. The benefit of this new problem is that no known sub-exponential attack exists to solve it \cite{KaLi14}. Therefore, we get the same security as before except with much smaller (256-bit) keys.

Why doesn't the same sub-exponential attack that works on the DLP work for the ECDLP? Broadly, numbers mod a prime are still integers underneath it all, and integers can be factored. This has nothing to do with the group operation itself, but it's still something that an attacker can use for solving the DLP, and is exactly what these sub-exponential attacks rely on \cite{KaLi14}. When we first introduced groups, the group operation was multiplication. Factoring is really just multiplication in reverse, so even if the multiplication is done mod a prime, there's something small to grasp on to and develop an (albeit still inefficient) attack. The coordinates of points on an elliptic curve are integers too. However, nobody has found a way to connect these integers to the elliptic curve group operation in the same way that factoring connects to multiplying integers mod a prime. This doesn't mean that such a connection can never be found, but so far nobody has.

If you are curious, the specific elliptic curve Bitcoin uses is called $\texttt{secp256k1}$, with the equation

$$ 
y^2 = x^3 + 7 \pmod{p} 
$$

where $p$ is the specific 256-bit prime \cite{Ant17},

$$
p = 2^{256} - 2^{32} - 2^{9} - 2^{8} - 2^{7} - 2^{6} - 2^{4} - 1,
$$

which was specifically chosen because it can be computed very quickly using only addition and bit shifts.

The reason we trust any of this is that nobody has found a fast way to solve a small handful of specific problems, despite decades of people trying. There are a couple more concepts to cover before we actually talk about Bitcoin, but this is the math holding all of it up. It's also the math a quantum computer breaks, which we'll get to later.
