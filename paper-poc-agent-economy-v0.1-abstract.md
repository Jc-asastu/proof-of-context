# Proof of Context applied to the Agent Economy Infrastructure

**Working title.** *Proof-of-Context applied to the agent economy infrastructure: a multi-producer wire-format study with five reference implementations.*

**Author:** Juan Cruz Maisú · Buenos Aires, Argentina · `juancmaisu@outlook.com` · [github.com/asastuai](https://github.com/asastuai).

**Status:** v0.1 working abstract, drafted 2026-04-30. Paper drafting follows.

---

## Abstract

Position-paper Proof-of-Context (v0.6) named a verification gap in decentralized ML protocols and decomposed it into four freshness types (`f_c` computational, `f_m` model, `f_i` input, `f_s` settlement). A first applied paper (v0.1, Verifiable Inference) specialized that decomposition to commercial inference-as-a-service and showed the four dimensions partition asymmetrically (1-vs-3) under a centralized-provider threat model.

This paper specializes the framework in a different direction: the agent economy infrastructure layer. Agents pay each other for data, defer to each other for trust, and compose each other's outputs into settlement. None of the existing primitives covering that surface (x402 / HTTP 402, MCP, agent reputation registries, agent wallets, agent-native data oracles) make their attestations economically perishable. We argue, and empirically demonstrate, that the four freshness types specialize cleanly to this layer, and that running the same primitive through four independent consumer surfaces produces a convergent on-wire format we promote here as a working specification.

The convergence is the central conceptual contribution. Independent integrators arrive at the same fields, the same canonical signing message, the same Ed25519-over-SHA-256-canonical-JSON construction, without coordinating, because the underlying problem space is convergent. We document this empirically across five reference implementations: a pay-per-query data layer (BaseOracle, JavaScript), a multi-type reputation layer (TrustLayer, JavaScript, emitting `f_c` / `f_m` / `f_s`), a DeFi intelligence layer (Vigil, TypeScript, emitting `f_i` with per-feed horizons), an agent wallet SDK (PayClaw, TypeScript, consuming attestations as release condition), and a Rust reference crate for the primitive itself (proof-of-context-impl). All five produce byte-identical canonical hashes and verify each other's signatures; the wire format is published as a versioned working specification.

The paper makes four contributions: (1) the specialization of the four freshness types to the agent economy infrastructure layer, identifying which type applies to which surface; (2) the wire format itself, with verification protocol and rejection-code semantics; (3) the threat model under a decentralized-marketplace adversary, including the SDK-side enforcement mode used by agent wallets that verify but do not produce attestations; (4) empirical observations from running the primitive across the five implementations, including the per-surface freshness-horizon calibrations and the absence of types that the position paper reserves but which the agent economy layer does not naturally exercise.

The paper does not claim a new cryptographic primitive. It claims that the existing primitive, specialized correctly, *converges on a single wire format* across heterogeneous consumer surfaces, and that this convergence is itself the protocol-level interoperability artifact the agent economy needs.

**Keywords:** proof-of-context · agent economy · attestation · settlement gating · wire format · interoperability · Ed25519 · x402 · MCP

---

## One-sentence framing

> *PoC v0.6 said attestations should be economically perishable. The four agent-economy reference implementations all built the same `_poc` block independently. This paper documents what that block is, why it converged, and what it does not yet cover.*
