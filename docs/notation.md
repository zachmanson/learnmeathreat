# Notation

Symbol conventions for every post on the site. `/revisepost` checks drafts against this file.

## The rule

- **Global symbols** (the table below) have exactly one meaning across the whole series. Never reuse one for something else, in any post.
- **Local symbols** are dummy variables scoped to one equation, definition, or worked example (a product index $i$, a table column $x$, Vieta's formula coefficients). Reuse them freely, as long as they don't shadow a global symbol in the same post.
- When a new symbol becomes load-bearing (it's going to show up in later posts), add it here before it goes into a second post.
- Where there's a choice, match Bitcoin's own specs (SEC 2, BIP 340) and Katz–Lindell, since those are what readers will open next.

## Global symbols

| Symbol | Meaning | Introduced in |
|---|---|---|
| $m$ | Message (plaintext, or the thing being hashed/signed) | asymmetric-and-symmetric-cryptography |
| $c$ | Ciphertext | asymmetric-and-symmetric-cryptography |
| $\kappa$ | Security parameter, as in $\texttt{Gen}(1^\kappa)$ | asymmetric-and-symmetric-cryptography |
| $pk$, $sk$ | Public key, secret (private) key, in generic scheme definitions | asymmetric-and-symmetric-cryptography |
| $\mathbb{G}$ | A generic group | asymmetric-and-symmetric-cryptography |
| $g$ | Generator of a multiplicative group (lowercase = multiplicative) | asymmetric-and-symmetric-cryptography |
| $N$ | Semiprime to be factored, $N = p_1 p_2$ | asymmetric-and-symmetric-cryptography |
| $p_1, p_2$ | The prime factors of $N$ | asymmetric-and-symmetric-cryptography |
| $p$ | Prime modulus / the prime defining the curve's field $\mathbb{Z}_p$ | asymmetric-and-symmetric-cryptography |
| $\mathbb{Z}_p$ | $\{0, 1, \dots, p - 1\}$; $\mathbb{Z}_p^*$ excludes 0 | asymmetric-and-symmetric-cryptography |
| $A, B$ | Elliptic curve constants in $y^2 = x^3 + Ax + B$ | asymmetric-and-symmetric-cryptography |
| $\mathbb{E}(\mathbb{Z}_p)$ | Elliptic curve group over $\mathbb{Z}_p$ | asymmetric-and-symmetric-cryptography |
| $\mathcal{O}$ | Point at infinity (identity of the curve group) | asymmetric-and-symmetric-cryptography |
| $G$ | Generator point of the curve group (uppercase = additive) | asymmetric-and-symmetric-cryptography |
| $n$ | Order of the group / of $G$ | asymmetric-and-symmetric-cryptography |
| $d$ | Private key (an integer) | asymmetric-and-symmetric-cryptography |
| $P$ | Public key, $P = dG$ | asymmetric-and-symmetric-cryptography |
| $\lambda$ | Slope of the line in point addition | asymmetric-and-symmetric-cryptography |
| $\operatorname{hash}$ | A hash function | hash-functions |
| $\ell$ | Hash output length in bits (an $\ell$-bit hash has $2^\ell$ outputs) | hash-functions |
| $q$ | Number of tries/queries an attacker makes (birthday bound; later Grover) | hash-functions |
| $\operatorname{SHA-256}^2$ | $\operatorname{SHA-256}$ applied twice, $\operatorname{SHA-256}(\operatorname{SHA-256}(x))$ | transactions |
| $\sigma$ | A signature | digital-signatures |
| $k$ | Signing nonce | digital-signatures |
| $(r, s)$ | The two parts of an ECDSA/Schnorr signature | digital-signatures |
| $F$ | ECDSA's point-to-integer map, $(x, y) \mapsto x \bmod n$ | digital-signatures |
| $I$ | Schnorr's one-time point, $I = kG$ | digital-signatures |

## Reserved for later

| Symbol | Planned meaning |
|---|---|
| $t$ | Timestamp (Bitcoin) |

## Known exceptions

- $k$ is also the symmetric key in the symmetric encryption definition (Katz–Lindell's notation). It's confined to that section and never comes back, so it stays.
- Quantum computing papers use $n$ for the number of qubits. $n$ is taken, so pick a different letter when the quantum posts start.
