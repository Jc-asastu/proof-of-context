# Proof of Context applied to the Agent Economy Infrastructure

**Working title.** *Proof-of-Context applied to the agent economy infrastructure: a multi-producer wire-format study with five reference implementations.*

**Author:** Juan Cruz Maisú · Buenos Aires · `juancmaisu@outlook.com` · [github.com/Jc-asastu](https://github.com/Jc-asastu).

**Status:** v0.1 working abstract, drafted 2026-04-30. Paper drafting follows.

---

## Abstract

Position paper Proof-of-Context v0.6 named a verification gap in decentralized ML protocols.

It decomposed that gap into four freshness types. `f_c` computational. `f_m` model. `f_i` input. `f_s` settlement.

A first applied paper specialized the decomposition to commercial inference-as-a-service. It showed the four dimensions partition asymmetrically, 1-vs-3, under a centralized-provider threat model.

This paper specializes the framework in a different direction.

The agent economy infrastructure layer.

Agents pay each other for data. Defer to each other for trust. Compose each other's outputs into settlement.

None of the primitives covering that surface make their attestations economically perishable. Not x402. Not MCP. Not agent reputation registries. Not agent wallets. Not agent-native data oracles.

i argue this. And empirically demonstrate it.

The four freshness types specialize cleanly to this layer. Running the same primitive through four independent consumer surfaces produces a convergent on-wire format. i promote that format here as a working specification.

The convergence is the central conceptual contribution.

Independent integrators arrive at the same fields. The same canonical signing message. The same Ed25519-over-SHA-256-canonical-JSON construction. Without coordinating. Because the underlying problem space is convergent.

i document this empirically across five reference implementations:

- a pay-per-query data layer (BaseOracle, JavaScript)
- a multi-type reputation layer (TrustLayer, JavaScript, emitting `f_c` / `f_m` / `f_s`)
- a DeFi intelligence layer (Vigil, TypeScript, emitting `f_i` with per-feed horizons)
- an agent wallet SDK (PayClaw, TypeScript, consuming attestations as release condition)
- a Rust reference crate for the primitive itself (proof-of-context-impl)

All five produce byte-identical canonical hashes. All five verify each other's signatures. The wire format is published as a versioned working specification.

The paper makes four contributions:

1. The specialization of the four freshness types to the agent economy infrastructure layer, identifying which type applies to which surface.
2. The wire format itself, with verification protocol and rejection-code semantics.
3. The threat model under a decentralized-marketplace adversary, including the SDK-side enforcement mode used by agent wallets that verify but do not produce attestations.
4. Empirical observations from running the primitive across the five implementations, including the per-surface freshness-horizon calibrations and the absence of types that the position paper reserves but which the agent economy layer does not naturally exercise.

The paper does not claim a new cryptographic primitive. It claims that the existing primitive, specialized correctly, converges on a single wire format across heterogeneous consumer surfaces. That convergence is itself the protocol-level interoperability artifact the agent economy needs.

**Keywords:** proof-of-context · agent economy · attestation · settlement gating · wire format · interoperability · Ed25519 · x402 · MCP

---

## One-sentence framing

> *PoC v0.6 said attestations should be economically perishable.*
> *Four agent-economy reference implementations all built the same `_poc` block independently.*
> *This paper documents what that block is, why it converged, and what it does not yet cover.*

---

Juan Cruz Maisú ♥
