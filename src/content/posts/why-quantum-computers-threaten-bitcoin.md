---
title: Why Quantum Computers Threaten Bitcoin
date: 2026-09-03
tags: ["Quantum Algorithms"]
excerpt: "Quantum computers can factor the huge numbers that keep Bitcoin public keys secret, once they are big enough to run the algorithm behind it."
slug: why-quantum-computers-threaten-bitcoin
draft: false
---

I'll be honest, the first time someone told me "quantum computers will break Bitcoin" I assumed it was the same kind of headline that shows up every few years claiming the internet is about to collapse. Turns out there's real math behind this one, and it's worth walking through slowly, because almost every explanation online skips the part that actually matters.

## What Bitcoin's Public Keys Are Protecting

Every Bitcoin address is tied to a public/private key pair built on elliptic curve cryptography. The relationship looks like this:

$$
Q = dP
$$

Here $P$ is a fixed point on the curve (public, known to everyone), $d$ is your private key (a huge random number, secret), and $Q$ is your public key, which anyone can see on the blockchain. Computing $Q$ from $d$ is fast. Going backward, finding $d$ when you only know $Q$, is the hard part, and it's the entire reason your coins are safe. This is called the elliptic curve discrete logarithm problem, and on a classical computer, the best known attacks take longer than the age of the universe for keys this size.

## Where Shor's Algorithm Breaks the Assumption

A classical computer has to brute-force its way through that discrete logarithm problem. A large enough quantum computer doesn't. Peter Shor showed in 1994 that both integer factoring and the discrete logarithm problem can be solved in polynomial time on a quantum computer, instead of the exponential time a classical computer needs. Roughly, the classical difficulty scales like $O(2^n)$ in the key size $n$, while Shor's algorithm scales like $O(n^3)$. That gap is the whole threat model in one line: the lock stops getting exponentially harder to pick as keys get bigger, once you have the right kind of computer holding the lockpick.

None of this works today. Running Shor's algorithm on keys the size Bitcoin uses needs millions of stable, error-corrected qubits, and current quantum hardware is nowhere close. But "not today" and "never" are very different claims, and the rest of this series is about figuring out honestly which one is closer to true.

Here's a toy sketch of the period-finding step that makes Shor's algorithm work, just to make it concrete rather than abstract:

```python
def find_period(a, N):
    # classical stand-in for the quantum period-finding subroutine
    r = 1
    while pow(a, r, N) != 1:
        r += 1
    return r
```

That's obviously not how you'd actually run this on a quantum computer, but it's the same idea Shor's algorithm speeds up exponentially: find the period of a function, then use it to recover the factor.
