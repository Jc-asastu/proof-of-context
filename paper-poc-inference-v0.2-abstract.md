# Freshness-Gated Settlement for Attested Inference

## Attestations expire; settlement does not notice (PoC-Inference v0.2)

**Author:** Juan Cruz Maisu — Buenos Aires, Argentina · [github.com/Jc-asastu](https://github.com/Jc-asastu)
**Status:** working draft, target v0.2 publication
**Supersedes:** PoC-Inference v0.1, *A receipt-based dispute layer over TEE-attested commercial inference* (2026-04-27)
**Companion artifact:** [`proof-of-context-impl`](https://github.com/Jc-asastu/proof-of-context-impl), `--features tee-tdx,tee-nvidia`

---

## Abstract

A hardware attestation is a statement about a moment. The quote was produced at a point in time, against collateral with an expiry, under a certificate revocation list that will be reissued, answering a challenge whose validity the vendor bounds — Intel's DCAP collateral carries `issueDate` and `nextUpdate`; NVIDIA's remote attestation service holds nonce bindings for twenty-four hours. Every party in the chain treats the attestation as perishable except the one that pays for it.

This paper makes the age of an attestation a settlement predicate. We specialize the Proof of Context framework to commercial and decentralized inference, where the artifact being verified is not a computation but a claim about which model, which hardware, and which billed work produced a response — and where that claim is inherited, unexamined, from an attestation that may be arbitrarily old.

Our position is that the field has converged on binding attestations to executions while leaving their lifecycle unmodelled. Recent systems bind execution to a specific model through enclave measurement, compose CPU and GPU evidence, and settle on-chain in under a second; the most complete of them states plainly that quote expiry windows, revocation lists and stale-attestation handling are absent from its design. Independently, a freshness gap of exactly this kind was found in a reference implementation of the IETF RATS appraisal path. The gap is not incidental: verification descends from proof systems, where a proof is timeless, while freshness under adversarial staleness is a discipline developed elsewhere — in the oracle infrastructure of decentralized finance, from which we import it.

The contribution is threefold. First, a settlement gate whose predicates include the attestation's own age, alongside model, request-integrity, billing and capacity claims, with a per-dimension verdict — established, contradicted, or unestablished — rather than a boolean. The distinction is load-bearing: a marketplace serving both attested and best-effort supply needs a receipt that cannot be collapsed into "valid," because collapsing it is precisely how cheap capacity comes to look like expensive capacity. Second, we answer, with a defense, the protection that the Hollow-LLM attack asks for and does not supply: correctness proofs do not bind expended effort, and binding it requires committing the loaded weights to a canonical reference at execution time — a construction that has become implementable only recently, as model-signing standards moved from proposal to early adoption. Third, a reference implementation measured against a real TDX quote and real collateral rather than emulated hardware: 272-byte receipts, 11–13 µs to sign, 27–39 µs to verify, four orders of magnitude below the estimates the v0.1 draft carried and five below the cheapest cryptographic alternative.

We are explicit about what remains open. The attestation binds a key to a measured image; it does not prove that a particular token was produced by the hardware inside it, and no amount of receipt engineering closes that gap — only the registered image's own properties do. The receipt cannot distinguish a provider who under-discloses from one who cheats, a limitation we found by running the system against a real model rather than by reasoning about it. And the trust root remains the vendor attestation chain, which we do not attempt to remove.

---

## Keywords

attested inference · freshness-gated settlement · trusted execution environment · remote attestation lifecycle · verifiable inference · decentralized compute marketplace · IETF RATS · confidential GPU
