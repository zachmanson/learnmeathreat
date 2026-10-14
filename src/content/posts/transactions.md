---
title: Transactions
date: 2026-09-27
tags: ["Bitcoin"]
excerpt: "What's actually inside a Bitcoin transaction, how it pays someone less than a whole UTXO, and why spending puts your public key out in the open."
slug: transactions
draft: false
---

There were a couple of loose ends I purposely left open when explaining [UTXOs](/posts/utxos/). I didn't point them out very clearly, but maybe you caught them anyway. First, if two UTXOs have the same amount and the same locking script, what tells them apart? Second, if you can only spend a UTXO in full, how do you pay someone less than what it's worth?

The answer to both questions is the transaction itself. Put simply, a transaction spends UTXOs and creates new ones. Every time bitcoin changes hands, a transaction is what did it. So we need to look at what's inside one.

## What is a transaction?

A transaction is often described as just a list of inputs and a list of outputs \cite{Ant17}. The inputs point to the UTXOs being spent and carry the data that unlocks them, and the outputs are the new UTXOs, each with an amount and a locking script. That's true in general, but I'd rather be more rigorous about it, so I'll define a transaction formally \cite{LLW15}.

:::definition
**Bitcoin transaction:** A Bitcoin transaction is a 4-tuple comprising\
a 32-bit version number (`nVersion`) that signals which set of rules the transaction follows,\
a list of inputs,\
a list of outputs, and\
a 32-bit lock time (`nLockTime`), the earliest time at which the network will accept the transaction.

Each output has the same form as a [UTXO](/posts/utxos/). Each input is a 5-tuple comprising\
a 256-bit transaction identifier (`txid`) of the earlier transaction that created the UTXO being spent;\
a 32-bit index (`vout`) saying which of that transaction's outputs is being spent;\
a variable-length unlocking script (`scriptSig`) that provides the data the UTXO's locking script needs;\
a 32-bit sequence number (`nSequence`), used for time locks (including turning `nLockTime` on) and to set flags for other transaction features; and\
a witness (`scriptWitness`), a variable-length list of variable-length byte strings that newer kinds of locking script use for unlocking data.
:::

For most of this post, `nVersion`, `nLockTime`, and `nSequence` won't matter. I included them so the definition is complete, and `nSequence` only comes up once, for replacing a transaction.

A transaction's outputs are numbered in order, starting from 0, and `vout` is that number. So an input names the UTXO it spends by the transaction that created it (`txid`) and its position among that transaction's outputs (`vout`).

In my opinion, this is easier to understand once you can see it, so let's look at a transaction. I could make up a toy example, but I think it's more interesting to use a real Bitcoin transaction. I went looking for one that's as plain as possible, and this one spends a single UTXO and creates two new ones. It was made on October 10, 2026, and its `txid` is

```
353131ef56a95bf556358b5e6b53c83953320d01a609d57abaf698143700cdf9
```

You can look it up yourself on [mempool.space](https://mempool.space/tx/353131ef56a95bf556358b5e6b53c83953320d01a609d57abaf698143700cdf9), a site that lets you look up any Bitcoin transaction. Its `nVersion` is 2 and its `nLockTime` is 0. Its one input is

| Field | Value |
|---|---|
| `txid` | [`b20b97b7…303b123e`](https://mempool.space/tx/b20b97b71a9e1ea83209335d9423bb85264fc2ad436c0ae9d89692e7303b123e) |
| `vout` | 1 |
| `scriptSig` | empty |
| `nSequence` | `0xfffffffd` |
| `scriptWitness` | a 71-byte signature and a 33-byte public key |

and its two outputs are

| `vout` | Amount (satoshis) | Address |
|---|---|---|
| 0 | 25,000,000 | `bc1qm7tqk9dzz8aqa99rd2ts5k2e6gdnllr4qvut65` |
| 1 | 73,254,153 | `bc1qkhgdhqe48fhf76pwzmfj6p2wlg58kx8lquucm3` |

I wrote each output's locking script as the [address](/posts/keys-and-addresses/) it locks to, since that's easier to read.

The input's `scriptSig` is empty because the UTXO it spends uses one of the newer kinds of locking script, which look for their unlocking data in the witness instead. Here that's a signature and the public key to check it with.

The input spends output 1 of an earlier transaction. That UTXO was worth 98,254,831 satoshis (0.98254831 bitcoin) and was locked to `bc1qkhgd…ucm3`. The input itself doesn't say how much it's spending \cite{Ant17}. A node looks the amount up in its [UTXO set](/posts/utxos/) using the `txid` and `vout`.

## Where does the `txid` come from?

So far the `txid` has just been a long string of hex digits that points to an earlier transaction. It's actually that transaction hashed twice with $\operatorname{SHA-256}$ \cite{LLW15}. A transaction's `txid` is
$$
\texttt{txid} = \operatorname{SHA-256}(\operatorname{SHA-256}(\operatorname{bytes}(\text{transaction without its witnesses}))),
$$
where $\operatorname{bytes}(x)$ is $x$ written out as bytes, field by field in the order of the definition. The witnesses are left out on purpose. The reason has to do with signatures, so I'll come back to it once we get to what gets signed.

:::note
Hashing twice with $\operatorname{SHA-256}$ comes up so often in Bitcoin that from now on I'll write it as
$$
\operatorname{SHA-256}^2(x) := \operatorname{SHA-256}(\operatorname{SHA-256}(x)).
$$
:::

:::note
If you hash a transaction yourself, you'll get the `txid` with its bytes in reverse order \cite{Ant17}. Bitcoin's original code read a hash's 32 bytes as a 256-bit number with the first byte as the lowest digit, then printed that number highest digit first. So the bytes come out backwards, and sites like mempool.space and wallets still print them that way.
:::

Since $\operatorname{SHA-256}$ is [collision resistant](/posts/hash-functions/), it's computationally infeasible to find two different transactions with the same `txid`. Two transactions can't be exactly the same either, since they'd be spending the same UTXOs, which is a double spend. So each `txid` points to exactly one transaction. This is the answer to the first question from the start. Two UTXOs can have the same amount of bitcoin and the same locking script, but they came out of different transactions, or from different positions among the outputs of the same transaction, so their `txid` and `vout` pairs are different.

## Spending less than an entire UTXO

Now for the second question. Let's say you have a UTXO worth 98,254,831 satoshis, and you want to pay someone 25,000,000 satoshis. We already know that UTXOs [must be spent in full](/posts/utxos/), so what happens in the transaction? The transaction's input consumes the entire UTXO, and the transaction splits it into two outputs. One, worth 25,000,000 satoshis, is locked to the person you're paying, and the other holds the rest and is locked back to you as *change*. This is the same as paying for a \$3 coffee with a \$10 bill: you get \$7 back in change, except here you split off the change yourself instead of needing a cashier to do it.

This is exactly what the example transaction above does. Output 0 is the payment of 25,000,000 satoshis to `bc1qm7tq…ut65`. Output 1 sends the remaining amount, 73,254,153 satoshis, back to `bc1qkhgd…ucm3`, which is the same address the UTXO consumed in the input was locked to. In other words, output 1 is the change.

:::note
Nothing in the transaction actually marks an output as change. It's easy to spot here, since the change went back to the same address as the UTXO it spent, but sending change back to the same address is considered bad practice. Most wallets send change to a brand new address (one the sender also controls), for the same privacy reason they [make a new address every time you ask to get paid](/posts/utxos/).
:::

This idea also works the other way. If none of your UTXOs alone is big enough to cover a payment, then a transaction can consume several UTXOs, one per input, so that their amounts are summed together.

## Fees are whatever's left over

If you have been checking my work up to now, you might have noticed that if you add up the outputs in the example transaction, you get 98,254,153 satoshis, which is 678 satoshis less than the 98,254,831 that went in. The difference is the *transaction fee*. It's a rule of the Bitcoin protocol (the set of rules that every node on the network follows) that whatever the outputs don't use up goes to whoever records the transaction. Here, that's where those 678 satoshis went.

The transaction has no field for the fee \cite{Ant17}. It's just whatever is left over when you subtract the outputs from the inputs. This means that if you forget the change output when building your own transaction by hand, the transaction isn't invalid. It just turns the whole difference into the fee. (Most people never do this, since their wallet handles it.) In the example above, if the transaction had left out output 1, its fee would have been 73,254,831 satoshis, which is about 0.73 bitcoin and a pretty expensive mistake. If the outputs add up to more than the inputs, the fee is negative, and every node rejects the transaction.

So how big should the fee be? Nothing in the protocol sets it, so you pick it yourself by choosing how much to leave over. Only so many transactions can be recorded at a time, so the ones that pay the most for the space they take up get recorded first. That means what really matters is the fee per byte of transaction, and when lots of people are trying to send transactions at once, you have to pay more per byte to get yours in quickly. In practice, your wallet looks at what recent transactions paid and picks a fee for you \cite{Ant17}.

:::note
You can also merge your UTXOs on purpose, by spending several of them in a transaction whose only output goes back to you. This is called consolidating. The usual reason is fees: every input makes a transaction bigger, and bigger transactions cost more to send, so people consolidate lots of small UTXOs while fees are low.
:::

## What actually gets signed?

When I discussed [digital signatures](/posts/digital-signatures/), I said that in Bitcoin, the message $m$ in
$$
\sigma \gets \texttt{Sign}_{sk}(m)
$$
is built from the transaction data. Now we are ready to understand what that actually means.

The obvious answer is that $m$ is the entire transaction itself, but this can't work. The signature is part of the transaction's input, so $m$ would have to contain the signature you're making from it. So the unlocking data (the `scriptSig` and the witness) is left out. For the kind of input in the example, $m$ is made of\
the transaction's `nVersion` and `nLockTime`;\
every input's `txid`, `vout`, and `nSequence`;\
every output; and\
the amount and locking script of the UTXO that this input spends.

These are written out as bytes in a fixed order \cite{LaWu16}. In Bitcoin, the hash function inside ECDSA's $\texttt{Sign}$ is $\operatorname{SHA-256}^2$, so what actually gets signed is technically $\operatorname{SHA-256}^2(m)$. Also, since different UTXOs can be locked to different keys, each input gets its own signature. The amount and locking script of the UTXO that each input spends vary input by input, so in a transaction with several inputs, each input's $m$ is different.

What matters here is that $m$ covers every input and output. If someone malicious sees your transaction and tries to change where the new UTXOs go or how much they are worth, $m$ changes and your signature $\sigma$ no longer verifies. The attacker would need a new valid signature under your key on a message you never signed. Nobody knows how to make one without the private key, even after seeing your signature on the original ([EUF-CMA](/posts/digital-signatures/)).

:::note
A signature doesn't have to cover all of that. The last byte of the example's 71-byte signature is `01`. It says which parts of the transaction the signature covers, and `01` means everything listed above. It also gets added to the end of $m$, so it's signed too \cite{Ant17}. Other values let a signature cover less, but they're rare and nothing in this blog uses them.
:::

## Why the witness exists

When I explained where the `txid` comes from, I said the witnesses are left out of it on purpose and that I'd come back to why. Now we have everything we need for it.

Bitcoin didn't always have a witness. Before 2017, all the unlocking data, signatures included, went into `scriptSig`, and the `txid` was the hash of the whole transaction. Remember that $m$ leaves the unlocking data out, so the signature doesn't cover itself. The `txid` did cover it, though. That means if someone could change a signature without breaking it, the `txid` would change too.

For ECDSA, it turns out there's a really simple way to do this \cite{DeWa14}. If $(r, s)$ is a valid signature, then so is $(r, n - s)$. Swapping $s$ for $n - s$ makes $\texttt{Vrfy}$ rebuild $-kG$ instead of $kG$, which is just $kG$ flipped across the $x$ axis. Flipping a point doesn't change its $x$-coordinate, so $\texttt{Vrfy}$ still gets back $r$ and the signature checks out. You don't need the private key for any of this, so anyone who sees your transaction being passed around the network could flip $s$ and pass on their copy instead.

So now there are two copies of your transaction going around. Both spend the same UTXOs and create the same outputs, so only one of them can be recorded (the other would be a double spend). Either way the person you're paying still gets paid, so why does it matter? If the changed copy is the one that gets recorded, your original `txid` never actually exists. If you'd already made another transaction spending one of its outputs, like your change, that transaction points to a `txid` that doesn't exist, so it's invalid.

This is called *transaction malleability* \cite{DeWa14}. To be fair, Bitcoin ran fine with it for years, since once a transaction is recorded its `txid` can't change anymore. It only causes trouble when you need to sign a transaction ahead of time that spends the outputs of another transaction that hasn't been recorded yet. For example, say two people want to put bitcoin into a UTXO that needs both of their signatures to spend. Before either of them sends anything, they'd want a refund transaction already signed, so that if one of them disappears, the other's bitcoin isn't stuck forever. That refund points at the first transaction's `txid`, so if that `txid` can change, the refund is useless \cite{ADM+15}.

:::note
In 2015, nodes started only passing on whichever of $s$ and $n - s$ is smaller, which shut this particular trick down \cite{Bit15}. There were other ways to change `scriptSig` without breaking it though, so malleability as a whole was still a problem.
:::

## The fight over the size limit

Malleability wasn't the only reason the witness was introduced. The other one was a limit on how many transactions can be recorded at a time.

Transactions get recorded in batches called *blocks*, about one every 10 minutes. In 2010, Satoshi Nakamoto quietly added a limit so that a block can hold at most 1 MB of transactions. Satoshi never said publicly why, but most people think it was to stop someone flooding the network with junk transactions \cite{Bie21}. For years this didn't matter, since blocks were nowhere near full. By 2015 that was starting to change. Remember from earlier that when only so many transactions fit, the ones paying the most per byte go first. So as blocks filled up, fees went up.

People who used Bitcoin split into two camps. One side wanted to raise the limit, so more transactions could fit and fees could stay low. That sounds like the obvious fix, so why would anyone be against it? The other side was worried about nodes. Every [node](/posts/utxos/) has to download, check, and store every transaction ever made, so bigger blocks make running one more expensive. At 1 MB every 10 minutes, that's up to about 52 GB of new data a year (144 blocks a day for 365 days). At 8 MB (one of the sizes people proposed), it's about 420 GB a year.

The reason that matters is that running your own node is how you check for yourself that the bitcoin you're receiving is real. Your node checks every transaction against the rules, so you don't have to take anyone's word for it. If only big companies can afford to run a node, everyone else has to ask one of theirs and trust whatever it says. If those companies ever accepted something that broke the rules, nobody else would be checking.

So why couldn't one side just raise the limit anyway? Every node checks everything that gets recorded against the rules in its own software, and rejects anything that breaks them. If some nodes raised the limit and the rest didn't, the first block over 1 MB would be accepted by one group and rejected by the other. From then on, the two groups would disagree about which transactions happened, and you'd basically have two Bitcoins. So raising the limit only works if nearly everyone switches at once, and the two camps couldn't agree. This argument is now called the *block size war*, and it went on from 2015 until 2017 \cite{Bie21}.

## SegWit

In December 2015, the developers of Bitcoin Core (the software most nodes run), who were mostly on the keep-the-limit side, proposed *Segregated Witness* (SegWit) \cite{LLW15}. The name pretty much says what it does. It moved the unlocking data for newer locking scripts out of `scriptSig` and into the witness, and left the witness out of the `txid`. Now everything that goes into the `txid` is covered by the signature, so nobody can change a transaction's `txid` without your private key, and malleability is fixed \cite{Ant17}.

:::note
Addresses starting with `bc1`, like the ones in the example, are for these newer locking scripts. Older addresses still put their unlocking data in `scriptSig`, and their inputs just get an empty witness.
:::

SegWit also let more transactions fit in a block without changing the 1 MB rule, at least as old software sees it. A node running old software is never even sent the witnesses, so to it, every block still looks like it's under 1 MB \cite{LLW15}. Since old nodes keep accepting the new blocks, SegWit didn't need everyone to upgrade at once.

The big-block side wasn't happy with this. SegWit gave a lot less extra room than they wanted, and it only helped once wallets actually moved to the new addresses. To a lot of them it felt like a cop-out.

Getting SegWit turned on took almost two years. It needed 95% of the people adding blocks to signal that they supported it \cite{WTM+15}. Signalling opened in November 2016, and for months they just didn't. Two things finally got it moving in 2017. In May, a group of companies and block producers agreed on *SegWit2x*, which was a compromise: turn on SegWit now, then raise the limit to 2 MB a few months later. Meanwhile, some users threatened to have their nodes reject any block that wasn't signalling for SegWit after August 1, 2017 \cite{Fry17}. Signalling picked up, and SegWit locked in on August 9 and went live on August 24, 2017, at block 481,824. The 2 MB half of SegWit2x was called off that November, and that's usually counted as the end of the block size war \cite{Bie21}.

:::note
Not everyone went along with it. On August 1, 2017, a group that wanted bigger blocks split off with 8 MB blocks and no SegWit. That's the two-Bitcoins situation from above, and the side that split off is a separate coin called Bitcoin Cash, which still exists today \cite{Bie21}.
:::

## The witness, byte by byte

In the definition I put each witness inside its input, since every input has exactly one, and that's how Bitcoin's own code stores it. However, when a transaction is actually written out as bytes (the $\operatorname{bytes}(x)$ from the `txid` equation), the witnesses all get moved to the end, one per input in the same order as the inputs, just before `nLockTime`. Two extra bytes, `00` and `01`, go right after `nVersion` to mark that the transaction has witnesses \cite{LoWu16}. If you take out those two bytes and the witnesses, what's left is exactly what gets hashed into the `txid`.

For the example transaction, the witness looks like this byte by byte.

| Bytes | Value |
|---|---|
| 1 | `02`, the number of items |
| 1 | `47`, the length of the next item (71 in hex) |
| 71 | the signature, ending in `01` |
| 1 | `21`, the length of the next item (33 in hex) |
| 33 | the public key `02c41d15…67ac` |

That's 107 bytes, and adding the two marker bytes gives 109, which is exactly the difference between the transaction's full size (222 bytes) and its size without the witnesses (113 bytes). If you look the transaction up on mempool.space, the 222 is what it lists as the size.

## Weight

So how does SegWit actually fit more into a block? It changes how a transaction's size gets counted. A transaction's *weight* is
$$
\text{weight} = 4 \times (\text{bytes without witnesses}) + (\text{witness bytes}),
$$
so a witness byte counts for a quarter of what any other byte does. A block can hold up to 4 million weight units. This sounds like an arbitrary number, but old nodes only ever see the bytes without witnesses, and at 4 weight units each, those can never add up to more than 1 MB. So old nodes never see a block over the old limit. Dividing weight by 4 and rounding up gives the size in *virtual bytes* \cite{LLW15}. For the example, counting the two marker bytes with the witness, the weight is
$$
4 \times 113 + 109 = 561,
$$
or 141 virtual bytes.

When I said fees are paid per byte, that was a simplification. They're really paid per virtual byte. The example paid 678 satoshis for 141 virtual bytes, which is about 4.8 satoshis per virtual byte.

You might be wondering why witness bytes are the ones that get the discount. Every node has to keep its [UTXO set](/posts/utxos/) around for as long as those UTXOs exist, but once a transaction has been checked, its witness never has to be looked at again to check new ones. So witness data costs nodes less, and it's priced lower to match \cite{Ant17}. This also means spending a UTXO (which is mostly witness data) gets cheaper compared to creating one, which nudges people toward shrinking the UTXO set instead of growing it. That was on purpose, since a smaller UTXO set makes running a node cheaper, which is the same thing the keep-the-limit side was worried about in the size war.

## Getting your transaction recorded

Once your wallet has built and signed a transaction, it has to broadcast it to everyone else in the network. There's no central server that sends it out to everyone, so instead your wallet hands it to the nodes it's connected to (called its *peers*), which hand it to their peers, and so on. Each node is only connected to a handful of others, but that's enough for a transaction to spread across the whole network.

:::note
If a peer sends a node a transaction it already has, the node just ignores it, so a transaction doesn't bounce around forever. Once basically every node has it, it stops spreading.
:::

When a node receives your transaction, it has to check it before passing it on to its peers. It checks that\
every input points to a UTXO that's in its [UTXO set](/posts/utxos/);\
every input's unlocking data satisfies the locking script of the UTXO it spends, which for the example means the public key hashes to the $\operatorname{HASH160}$ in the locking script and the signature verifies under that public key; and\
the outputs don't add up to more than the inputs.

There are also a bunch of smaller rules to check, like sizes, formats, and a minimum fee per virtual byte, but those three are the ones that matter here. If the transaction fails any of them, the node drops it and doesn't pass it on. If it passes, the node passes it on to its peers and holds onto it until it's recorded \cite{Ant17}.

:::definition
**Mempool:** A node's mempool is the set of transactions that the node has checked and accepted but that haven't been recorded yet.
:::

Every node has its own mempool, and they don't have to match, since a transaction can take a little while to reach every node.

So what happens if two transactions spend the same UTXO and neither has been recorded yet? Normally a node keeps whichever one it saw first and rejects the other as a double spend, but there's one exception. Remember that transactions paying the most per virtual byte get recorded first. Say you sent a transaction with a fee that was too low, and it's been sitting in mempools for hours. You can make a new transaction that spends the same UTXOs and pays a higher fee, both in total and per virtual byte, and nodes will swap your old one out for it. This is called *replace-by-fee* (RBF) \cite{Bit26}. Only someone who can unlock the same UTXOs can make a replacement, since it needs new signatures.

This is where the example's `nSequence` of `0xfffffffd` comes in. An input with an `nSequence` below `0xfffffffe` says the sender is fine with the transaction being replaced \cite{HaTo15}.

:::note
Since late 2024, Bitcoin Core accepts replacements whether the transaction was flagged or not, so the flag doesn't matter much anymore \cite{Bit24}.
:::

## Spending puts your public key out in the open

When I explained [hashing public keys](/posts/keys-and-addresses/), I said the hash hides your public key, at least until the coin is spent. Now we can see why that caveat is there. Look at the example's witness again. Next to the signature is the 33-byte public key `02c41d15…67ac`. It has to be there, since a node can't check a signature without the public key, and the locking script only holds its $\operatorname{HASH160}$.

So the moment you broadcast a transaction, your public key is sitting in mempools all over the network, and once the transaction is recorded, your public key is part of the record for good, where anyone can read it.

If you only ever use each key once, your public key only comes out when the UTXOs locked to it are being spent. The example didn't do that, though. Its change went back to `bc1qkhgd…ucm3`, the same address it was spending from, so the change UTXO was locked to a public key anyone could already see. That address has been used in over 28,000 transactions, with more than 100,000 bitcoin passing through it in total. After the first time anyone spent from it, every UTXO sent there was locked to a public key that was already public.

That's everything I wanted to cover about transactions. A transaction points at the UTXOs it spends by their `txid` and `vout`, and carries a signature for each input that covers every input and output, so nobody can change where the bitcoin goes. It splits that bitcoin into new UTXOs, with whatever's left over going to the fee. Spending a UTXO like the one in the example also puts the public key it's locked to out in the open. This whole post, I've treated a locking script as "whoever has the private key behind this address can spend these coins", since that's what the example's locking script checks. Locking scripts can ask for a lot more than that, so next I'm going into how they actually work.
