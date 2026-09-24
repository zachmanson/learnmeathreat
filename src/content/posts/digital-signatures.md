---
title: Digital Signatures
date: 2026-08-23
tags: ["Cryptography"]
excerpt: "How you can prove you own a private key without ever revealing it, and why that's what actually authorizes a Bitcoin transaction."
slug: digital-signatures
draft: false
---

## The problem hashing doesn't solve

In the [last post](/posts/hash-functions/) I discussed hash functions, and how they can be used to prove that a piece of data hasn't been tampered with. However, on their own, hash functions tell you nothing about who sent the data, or whether they can be trusted.

Say you want to spend some bitcoin. You need to produce a message that says "move these coins that I own" in a way that anyone can check is legitimate, but that only you could have produced. Hashing the message alone doesn't do this, since anyone can hash a message. What you need is a way to tie the message to a private key that only you hold, i.e., a digital signature.

## Digital signatures

We are already familiar with \ref{def-asymmetric-encryption}: two keys, one public and one private, where anything encrypted with the public key can only be decrypted with the private key. Digital signatures use the same public/private key setup, so it's tempting to assume they are just encryption flipped around: decrypt with the private key to sign, encrypt with the public key to verify. This is a common misconception for people first learning about digital signatures \cite{KaLi14}. It doesn't hold in general, and most signature schemes (including the ones Bitcoin uses) don't have a decryption step to flip in the first place. In other words, signing needs its own definition, separate from encryption. Signing has to guarantee that anyone can verify the signature, but only you could have produced it.

Following Katz and Lindell again \cite{KaLi14}, let's define a digital signature formally.

:::definition
**Digital signature:** A digital signature scheme is a 3-tuple of probabilistic polynomial-time algorithms comprising
1. A key-generation algorithm $\texttt{Gen}(1^\kappa) \to (pk, sk)$ generating a public ($pk$) and private ($sk$) key pair from a security parameter $\kappa$.
2. A signing algorithm $\texttt{Sign}_{sk}(m) \to \sigma$ that outputs a signature $\sigma$ from a private key $sk$ and message $m$.
3. A deterministic verification algorithm $\texttt{Vrfy}_{pk}(m, \sigma) \to \{0, 1\}$ that verifies if $\sigma$ is a valid signature of $m$ under the public key $pk$, with an output of $1$ meaning valid and $0$ meaning invalid.
:::

\label{def-digital-signature}

:::note
Except with negligible probability (a chance so small it can be safely ignored), it must hold that
$$
\texttt{Vrfy}_{pk}\left(m, \texttt{Sign}_{sk}(m)\right) = 1
$$
for every (legal) message $m$.
:::

To use a signature scheme, the sender runs $\texttt{Gen}(1^\kappa)$ to obtain the public and private keys $(pk, sk)$. The sender is then free to publish $pk$ anywhere they wish. When the sender wants to authenticate a message $m$, they compute

$$
\sigma \gets \texttt{Sign}_{sk}(m)
$$

and then send $(m, \sigma)$ to the recipient.

:::note
Notice $m$ is publicly exposed, along with $\sigma$. This is different from encryption, where $m$ was a secret. This is on purpose, since a signature isn't hiding anything. Encryption and signatures have two different goals: encryption protects confidentiality, while signatures protect authenticity. The point is that anyone with $pk$, $\sigma$, and $m$ can verify the signature themselves. In this context, $m$ can be anything: a contract, a software update, a message, a vote, etc. For Bitcoin specifically, $m$ is built from the transaction data, which we will learn about in a later post.
:::

The recipient who knows $pk$ can then check whether

$$
\texttt{Vrfy}_{pk}(m, \sigma) \stackrel{?}{=} 1.
$$

This way, the receiver can verify that the sender sent $m$, and that $m$ has not been modified in transit.

## What does "secure" mean for signatures?

Up to this point we have (hopefully) gotten a good idea of what it means for something to be secure in the cryptographic sense. The \ref{def-integer-factorization}, the \ref{def-dlp}, and the \ref{def-ecdlp} underlie asymmetric encryption, and preimage and collision resistance (\ref{def-cryptographic-hash-function}) underlie hash functions. However, signatures are a little different. A signature scheme's security isn't just "an attacker can't compute $sk$ from $pk$". That is necessary, but it isn't sufficient.

Consider an adversary who has seen you sign a bunch of other messages, and now tries to forge your signature on a message you have never signed. The formal name for security against this attack is existential unforgeability under an adaptive chosen-message attack (EUF-CMA) \cite{KaLi14}.

:::note
"Adaptive chosen-message" here means the attacker gets to pick which messages you sign, and can base each choice on the signatures they have seen so far.
:::

Put simply, a digital signature scheme is EUF-CMA secure if no efficient attacker can produce a valid $(m, \sigma)$ pair on a message $m$ it was never given a signature for, even if it first gets to request signatures on any other messages of its choosing. Without this property, a digital signature doesn't prove authenticity, since someone could forge your signature on a message you never touched.

## ECDSA

Since the specific signature schemes that Bitcoin employs will be a key point in discussing how exactly quantum computers threaten Bitcoin's security, I think it's worth going into how these schemes work in some depth. Luckily, there are only two of interest, and the first that I will discuss is the Elliptic Curve Digital Signature Algorithm (ECDSA).

Bitcoin uses ECDSA over the secp256k1 curve that I introduced in the [asymmetric cryptography post](/posts/asymmetric-and-symmetric-cryptography/). Note that this isn't a Bitcoin-specific invention, but a general-use digital signature scheme that's been standardized by the National Institute of Standards and Technology (NIST) \cite{JMV01}. The curve itself isn't one of NIST's, though. It comes from a separate standard called SEC 2.

As a reminder of my earlier notation, recall that $\mathbb{E}(\mathbb{Z}_p)$ is the elliptic curve group, where $p$ is the 256-bit prime defining secp256k1's underlying field (with $\mathbb{Z}_p = \{0, 1, 2, \dots, p - 1\}$, and $\mathbb{Z}_p^*$ being the same set excluding 0), $G$ is the generator point, and $n$ is the order of $G$ (the size of the group $G$ generates).

Since ECDSA is a digital signature scheme, it fits into the $\texttt{Gen}$/$\texttt{Sign}$/$\texttt{Vrfy}$ template from \ref{def-digital-signature}. Here's what those three algorithms look like for ECDSA specifically:

ECDSA over secp256k1 is parameterized by the fixed curve $\mathbb{E}(\mathbb{Z}_p)$, generator $G$, order $n$, hash function 
$$\operatorname{hash} : \{0,1\}^* \to \mathbb{Z}_n,
$$ 
and 
$$
F: \mathbb{E}(\mathbb{Z}_p) \to \mathbb{Z}_n, \quad (x,y) \mapsto x \bmod n.
$$
These are fixed once for the whole scheme, not generated or received per key pair.

:::algorithm[$\texttt{Gen}$]
Input: None
Output: Key pair $(d, P) \in \mathbb{Z}_n^* \times \mathbb{E}(\mathbb{Z}_p)$
Procedure:
1. Choose a uniformly random private key $d \in \mathbb{Z}_n^*$.
2. $P \gets dG \in \mathbb{E}(\mathbb{Z}_p)$.
3. **return** $(d, P)$.
:::

:::algorithm[$\texttt{Sign}$]
Input: Private key $d \in \mathbb{Z}_n^*$, message $m \in \{0, 1\}^*$ 
Output: signature $\sigma = (r, s) \in \mathbb{Z}_n^* \times \mathbb{Z}_n^*$
Procedure:
1. Choose a uniformly random nonce $k \in \mathbb{Z}_n^*$.
2. $r \gets F(kG)$.
3. $s \gets k^{-1}(\operatorname{hash}(m) + dr) \bmod n$.
4. If $r = 0$ or $s = 0$, restart from step 1 with a fresh $k$.
5. **return** $(r, s)$.
:::

:::note
Nonce is usually read as "number only used once". Its job here is to hide $d$. Look at step 3 of $\texttt{Sign}$: if anyone ever learned $k$, they could rearrange it to get $d = r^{-1}(sk - \operatorname{hash}(m)) \bmod n$. So $k$ has to be secret, and it has to be different for every signature.
:::

Notice that $\texttt{Sign}$ never touches $m$ directly, only $\operatorname{hash}(m)$. This is where hash functions come back in. If an attacker could find two messages with $\operatorname{hash}(m_1) = \operatorname{hash}(m_2)$, a signature on $m_1$ would also be a valid signature on $m_2$. This is why the hash has to be collision resistant (\ref{def-cryptographic-hash-function}), and why MD5 signatures had to be phased out once MD5 collisions were found.

:::algorithm[$\texttt{Vrfy}$]
Input: public key $P \in \mathbb{E}(\mathbb{Z}_p)$, message $m \in \{0,1\}^*$, signature $\sigma = (r, s) \in \mathbb{Z}_n^* \times \mathbb{Z}_n^*$
Output: $b \in \{0, 1\}$
Procedure:
1. Compute $r' \gets F\left(\operatorname{hash}(m)s^{-1} \cdot G + rs^{-1} \cdot P\right)$.
2. If $r' = r$, $b \gets 1$, else $b \gets 0$.
3. **return** $b$.
:::

:::note
Here, $\cdot$ is scalar multiplication on the curve, not a dot product. $rs^{-1} \cdot P$ is the same operation as $dG$ or $kG$, just written explicitly.
:::

Why does this actually work? Let's start with answering: why does the signature verify? Let's substitute $P = dG$ into the reconstruction step in $\texttt{Vrfy}$.

$$
\operatorname{hash}(m)s^{-1} \cdot G + rs^{-1} \cdot P = s^{-1} (\operatorname{hash}(m) + rd) \cdot G.
$$

But, from the $\texttt{Sign}$ algorithm, 

$$
s = k^{-1}(\operatorname{hash}(m) + dr) \bmod n \implies \operatorname{hash}(m) + rd  = sk \bmod n.
$$

Substituting this in, we get

$$
s^{-1}(sk) \cdot G = kG.
$$

The mod $n$ can be dropped here because $G$ has order $n$, so $nG = \mathcal{O}$ and multiplying $G$ by any number only depends on that number mod $n$. Applying $F$ to both sides then gives $r' = F(kG) = r$, which is exactly the check in $\texttt{Vrfy}$.

We have reconstructed $kG$, the same point $r$ was computed from in the first place. Why can't this be forged? To produce a signature that passes this check without knowing $d$, the obvious route is to recover $d$ directly from $P = dG$. In other words, given $G$ and $P = dG$, determine $d$. Does this look familiar? This is exactly the \ref{def-ecdlp} that I described earlier. This is an informal argument though, not a proof, and I'll come back to why later.

I'll note that this only demonstrates security against an attacker who has just your public key, but EUF-CMA is stronger, and has to hold even if an attacker has seen any number of your real signatures. The intuition still holds here, because each signature uses a fresh value of $k$, so the attacker can't extract anything useful from your past signatures unless they get lucky enough to guess $k$ outright.

This is also why $k$ can never be reused. If you sign two different messages $m_1$ and $m_2$ with the same $k$, both signatures have the same $r$, and subtracting the two signing equations gives

$$
s_1 - s_2 = k^{-1}\left(\operatorname{hash}(m_1) - \operatorname{hash}(m_2)\right) \bmod n.
$$

Anyone can solve this for $k$, and then for $d$. Sony, for example, signed PlayStation 3 software using the same $k$ every time, and in 2010 their private key was recovered this way \cite{BMS10}. In 2013, a bug in Android's random number generator caused some Bitcoin wallets to reuse $k$, and coins were stolen \cite{BrHe19}.

## Schnorr Signatures

The second signature scheme of interest that Bitcoin employs is Schnorr signatures. The security of Schnorr signatures rests on the same ECDLP, but it gets there with a different construction. Once again, since Schnorr is a valid signature scheme it fits into the same $\texttt{Gen}$/$\texttt{Sign}$/$\texttt{Vrfy}$ template. However, since $\texttt{Gen}$ here is identical to the ECDSA case, I will focus only on $\texttt{Sign}$ and $\texttt{Vrfy}$, since this is where Schnorr diverges. 


:::algorithm[$\texttt{Sign}$]
Input: Private key $d \in \mathbb{Z}_n^*$, message $m \in \{0, 1\}^*$ 
Output: signature $\sigma = (r, s) \in \mathbb{Z}_n \times \mathbb{Z}_n$
Procedure:
1. Choose a uniformly random nonce $k \in \mathbb{Z}_n^*$.
2. $I \gets kG \in \mathbb{E}(\mathbb{Z}_p)$. 
3. $r \gets \operatorname{hash}(I, m)$.
4. $s \gets (rd + k) \bmod n$.
5. **return** $(r, s)$.
:::

:::note
Think of $I = kG$ as a one-time version of your public key, the same idea as $P = dG$, but built from the throwaway nonce $k$ instead of your permanent private key $d$. Hashing it with $m$ ties that one-time value to this specific message.
:::

:::algorithm[$\texttt{Vrfy}$]
Input: public key $P \in \mathbb{E}(\mathbb{Z}_p)$, message $m \in \{0,1\}^*$, signature $\sigma = (r, s) \in \mathbb{Z}_n \times \mathbb{Z}_n$
Output: $b \in \{0, 1\}$
Procedure:
1. $I' \gets sG - rP \in \mathbb{E}(\mathbb{Z}_p)$.
2. If $\operatorname{hash}(I', m) = r$, $b \gets 1$, else $b \gets 0$.
3. **return** $b$.
:::

Similar to ECDSA, Schnorr has the same idea with $\texttt{Vrfy}$: reconstruct something from the signature and public key, then check it matches. For example, substituting $P = dG$:

$$
sG - rP = (rd + k)G - rdG = kG = I.
$$

Thus $I^\prime$ reconstructs to the same point you started with, and therefore $\operatorname{hash}(I', m) = r$ and the verification passes. To fake this without knowing $d$, you would again either have to guess $k$ in advance or recover $d$ directly from $P = dG$, which is the same ECDLP problem as ECDSA. 

What's the point of having two different signature schemes? Isn't one sufficient? Both schemes reduce to the same hard problem: recovering $d$ from $P = dG$ is ECDLP either way.

However, there's one small step in the middle where they diverge, and it ends up mattering a lot. ECDSA sets $r \gets F(kG)$, which is just the x-coordinate. On the other hand, Schnorr sets $r \gets \operatorname{hash}(I, m)$. It runs $I$ through a hash first, and that's why one scheme can be provably secure while the other cannot. 

A proof of security basically works by imagining an attacker who could forge a signature, then showing that attacker could be turned into a machine that solves ECDLP, which is supposed to be impossible. The trick used to build that machine needs to catch the forger reusing the same $kG$ but ending up with two different values of $r$. If that ever happens, you can subtract the two signing equations, the nonce $k$ cancels out, and you're left holding $d$.

For Schnorr, a proof can actually force this to happen, because $r$ comes from a hash, and a hash is exactly the kind of thing a proof is allowed to just reassign (the proof treats the hash as a perfectly random function that it controls). The proof can run the forger twice with the same $I = kG$ and hand back a different $r$ the second time. So an attacker who could reliably forge signatures could be forced into producing exactly this situation, two valid responses to the same $kG$, which is enough to extract $d$ directly. That contradicts ECDLP being hard, so no such attacker can exist. Forging a Schnorr signature is provably as hard as solving ECDLP (as long as the hash behaves like that perfectly random function) \cite{PoSt00}.

ECDSA can't use this same argument. $r$ is just the $x$-coordinate of $kG$, which is fixed the moment $kG$ exists, so there's no way to force a second value of $r$ out of it. This doesn't mean ECDSA is unprovable in principle, just that this specific method doesn't work, and decades later, nobody's found a different one that works from ECDLP alone either.

So from a pure security standpoint, Schnorr wins, and it's older (1989 vs 1992 for ECDSA \cite{JMV01}). Given that, you'd expect Bitcoin to have used Schnorr from day one. It didn't, and the reason is historical. Schnorr patented his scheme \cite{Sch91} shortly after it was published in 1989 \cite{Sch90}. Around that time, NIST needed a standard digital signature algorithm but didn't want to license someone else's patent. So they went with DSA, which is widely seen as designed to get around Schnorr's patent (though Schnorr argued it didn't). ECDSA is DSA carried over to elliptic curves. The key change was swapping Schnorr's hashed $r$ for just the $x$-coordinate of $kG$, which also meant the proof technique above no longer works. The patent expired in 2008, shortly before Bitcoin launched, but by then ECDSA was already the standard, so that's what Bitcoin used. Schnorr signatures were not introduced into Bitcoin until 2021 \cite{WNR20}. 

The security proof was one reason Bitcoin eventually added Schnorr, but the bigger practical win was a useful property. Schnorr's signing equation

$$ 
s = (rd + k) \bmod n
$$

is linear in $d$ and $k$, meaning that different people's signing equations can be added together. For example, three people can work together to produce a single $(r, s)$ pair that looks exactly like a one-person signature (this takes a special protocol, not just adding three finished signatures). The analogous step for ECDSA has a $k^{-1}$ sitting in front of it, which breaks this property. This property turned out to be very useful for Bitcoin, and we'll get into exactly why in a later post.

## Wrapping up

That was all of the cryptography I had planned to cover. I hope it was useful, and that you now have some idea of what it means for something to be secure, the different ways we can use cryptography to share secrets or authenticate ourselves, and why we trust any of this in the first place. The main thing to remember from this post is that both signature schemes Bitcoin uses come down to the \ref{def-ecdlp}: recovering $d$ from $P = dG$. Next I'm going into Bitcoin itself and how it works.
