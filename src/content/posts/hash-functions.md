---
title: Hash Functions
date: 2026-08-22
tags: ["Cryptography"]
excerpt: "What a hash function actually does, and why being hard to reverse is the whole point."
slug: hash-functions
draft: false
---

Next, we need to understand what a hash function is, as this is an integral part underlying Bitcoin mining, block integrity, storing transactions, addresses, and more. We are going to pin down what exactly these functions are, why they are useful, and what makes them "secure".

## Motivation

Bitcoin's entire model relies on everyone being able to check things for themselves: every transaction, block, and update to the ledger, without trusting the person sending them this information. The dumb way to do this is to pass around the actual data every time someone needs to check it, and compare it against your own copy. That technically works, but it falls apart once the data gets large. If verifying something means downloading the entire thing from every peer who mentions it, the network hits a real bottleneck fast.

The smarter way is to stop comparing the data itself and instead compare it with something smaller that represents the data instead. If we had a way to take any-sized data and produce a short fixed-size bitstring that is uniquely tied to the data, we could just compare these two bitstrings. If the bitstrings match, the underlying data must too, and importantly, the data itself never had to be sent. This only works if these bitstrings are unique to the data, and if you can't easily guess one without already knowing the data. This is exactly what a hash function is meant to do.

## Hash functions

Hash functions are simply functions that take inputs of any length and give a fixed-length output, where finding two inputs with the same output is meant to be computationally infeasible.

:::definition
**Hash function:** The $\ell$-bit hash of a bitstring of arbitrary size is the uniformly distributed mapping  \cite{GGF17}
$$
\operatorname{hash} : \{0, 1\}^* \to \{0, 1\}^\ell : s \mapsto \operatorname{hash}(s).
$$
:::

\label{def-hash-function}

The hash functions that are used in cryptography/security are a special class of hash functions, *cryptographic hash functions*, that must satisfy additional properties.

:::definition
**Cryptographic hash function:** A cryptographic hash function is a hash function satisfying:
1. Preimage resistance: Given an output $h$, it is computationally infeasible to find an input $m$ such that $\operatorname{hash}(m) = h$.
2. Second-preimage resistance: Given an input $m_1$, it is computationally infeasible to find an $m_2 \neq m_1$ such that $\operatorname{hash}(m_1) = \operatorname{hash}(m_2)$.
3. Collision resistance: It is computationally infeasible to find any pair of inputs $m_1 \neq m_2$, with $\operatorname{hash}(m_1) = \operatorname{hash}(m_2).$
:::

\label{def-cryptographic-hash-function}

:::note
"Computationally infeasible" does not mean impossible. Given enough time, you could always try each input one-by-one until you get lucky and find a preimage, second-preimage, or collision. What I mean is that there is no method or trick that can speed up this process, and as such you will be stuck checking inputs for so long that it stops mattering, like longer than the average lifespan of a human, for example. 
:::

It's worth noting that, although this is not a fourth property that must be satisfied, for preimage, second-preimage, and collision resistance to work, the outputs of a hash function need to be unpredictable. What this means is that if you change a single bit of the input, the output should come out completely different, with no obvious structure. If changing the input slightly only nudged the output a little, an attacker could use this information to guide their search for a preimage or collision rather than searching blindly.

Of these properties, collision resistance is the strongest notion of security. If you can find a second-preimage, you get a collision for free. Since hash functions more often than not take a larger input and map it to a smaller output, then by the pigeonhole principle, there must be outputs for which multiple inputs map to it. This is fine, as long as finding those multiple inputs is computationally infeasible. Now suppose you had a tool that breaks preimage resistance. It takes an output $h$ and gives you back an input $m$ such that $\operatorname{hash}(m) = h$. You could pick your own input, $m_1$, compute its hash, $h = \operatorname{hash}(m_1)$, and then feed $h$ into the machine to get $m_2$ such that $\operatorname{hash}(m_2) = h$. With high probability, $m_1 \neq m_2$. In other words, your preimage-breaking tool is now also a second-preimage-breaking tool. With the same logic, if no second-preimage attack exists, then no preimage attack exists, else you could build one with the same trick. To summarize, collision resistance gives you second-preimage resistance, and second-preimage resistance gives you preimage resistance. However, this chain does not work the other way, as this trick relied on picking the input first, which a second-preimage or preimage attacker doesn't have the liberty of.

## The birthday bound

We have established what collision resistance is, and how it's the strongest notion of security for a hash function, and it turns out there is a nice mathematical bound on exactly how many inputs an attacker needs to check before one of these collisions is found.

For an $\ell$-bit hash function, there are $2^\ell$ possible outputs. If an attacker is hunting for a preimage, they are stuck with checking candidate inputs one at a time against the target output. However, finding a collision is different, because the attacker is no longer tied to just one target. The attacker needs any two inputs, out of however many they try, to evaluate to the same output. This is exactly the *birthday problem*, which states: given $q$ people in a room, what are the odds that two of them share the same birthday? Of course we are talking about collisions here and not birthdays, but because these problems are essentially the same, and because the birthday problem is infamous, we call the generic collision-finding attack the birthday attack. For a hash function with $2^\ell$ possible outputs, after hashing $q$ inputs, the probability that *none* of them collide is roughly

$$
\prod_{i=1}^{q-1} \left(1 - \frac{i}{2^\ell}\right) \approx \exp\left(-\frac{q^2}{2^{\ell+1}}\right).
$$

I am not going to prove this to you, because this is not a lesson on combinatorics. This is a well-known bound for a well-known problem. The interesting part comes when we start checking some numbers using this bound. For $q = 2^{\ell/2}$, the probability of *no* collision is approximately $e^{-1/2} \approx 0.6$. In other words, the attacker has close to a 40% shot at finding a collision after checking only $2^{\ell/2}$ inputs. That's quadratically fewer than required when finding a preimage. 

In fact, this is the whole reason why hash function outputs are twice as long as whatever collision security you actually want. For example, 128-bit collision security needs a 256-bit hash.

## Hash functions that broke

Everything so far has been very abstract. We have discussed what hash functions are, the properties they must satisfy to be used in cryptography, and what it means to break them. It turns out, there are two very famous examples of hash functions being broken in the past, so I want to quickly go over them, what broke, and what was at risk from these hash functions being broken.

1. **MD5:** A 128-bit hash function designed in 1991. For over a decade, this hash function was believed to be collision resistant, until 2004 when two researchers, Wang and Yu, announced a method for finding these collisions, later published in full as \cite{WaYu05}. The idea was that instead of guessing inputs at random, they picked two inputs with a very specific and deliberately chosen difference between them. Wang and Yu traced how that difference evolved through MD5 internally, and found that this difference had cancelled itself out at the end, resulting in two different inputs that produced the same output: a collision. This was possible because MD5's internal "mixing" of the inputs was already known to be weaker than intended, and Wang and Yu used this knowledge to develop their method for finding collisions. Their method was generalized into an algorithm, and today MD5 collisions can be found in under a minute on a standard home PC. At the time, MD5 was commonly used in digital signatures (an application of hash functions used to prove your identity; I will discuss more in the next post), forcing a slow migration away from MD5 signatures in the following years. 
2. **SHA-1:** A 160-bit hash function introduced in 1995. Wang, Yin, and Yu \cite{WYY05} showed that the same kind of approach could find SHA-1 collisions in under $2^{69}$ operations, which is far fewer than the roughly $2^{80}$ required by a generic birthday attack. This doesn't sound like a big deal at first glance ($2^{69}$ has 21 digits after all), but it proved that SHA-1 was weaker against collisions than the security level of its output length was supposed to guarantee. That alone was enough for NIST to officially deprecate SHA-1 in 2011, even though nobody had actually produced a collision at that point. That changed in 2017, when researchers at Google and CWI Amsterdam \cite{SBK+17} finally produced a collision and shared two PDF files that shared the exact same SHA-1 hash. In the aftermath, browsers and websites stopped trusting SHA-1, and it was dropped as a security standard from that point. 

For what it's worth, Bitcoin doesn't use either of these hash functions. Instead, it leans on two different functions: SHA-256 and RIPEMD-160, each for different purposes that we will get into later. Hash functions give you a sort of "fingerprint": a way to prove data hasn't been tampered with. However, on their own, hash functions do not give you a way to prove *who sent the data*. This is the exact gap that digital signatures fill, and it's what I will cover in my next post, which will be the last on the cryptography we need to understand before delving into the whole point of this blog. 