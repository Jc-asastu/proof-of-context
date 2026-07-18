# Proof of Context applied to Agent Memory

**Working title.** *Proof-of-Context applied to agent memory: persisted context, renewable attestations, and the read-time freshness gate.*

**Author:** Juan Cruz Maisú · Buenos Aires · `juancmaisu@outlook.com` · [github.com/asastuai](https://github.com/asastuai).

**Status:** v0.1 working abstract, drafted 2026-07-17. Outline follows in `paper-poc-agent-memory-v0.1-outline.md`.

---

## Abstract

Position paper Proof-of-Context named a verification gap in decentralized ML protocols.

It decomposed that gap into four freshness types. `f_c` computational. `f_m` model. `f_i` input. `f_s` settlement.

Two applied directions followed. Commercial inference-as-a-service. The agent economy infrastructure layer. Both specialize the same question: *a computation can be correct and still not be worth settling on.*

This paper specializes the framework in a third direction.

Agent memory.

Every persistent memory system an agent carries today, vector stores, session summaries, markdown knowledge files, observation databases, is a snapshot store. It verifies nothing at read time. A memory is written once and decays in silence. The agent discovers the decay only when it acts on a stale memory and the action fails.

i argue this is not a new problem. It is the position paper's gap, verbatim, on a different surface.

**Memory is persisted context.** A memory entry is a claim about world state, derived from sources, at a moment. Reading a memory is settling on it. A memory store without renewal semantics commits every failure mode the position paper names, by construction:

- `f_i` violation. The sources the memory derives from have moved. The fact was true. It no longer describes the world.
- `f_m` violation. The world-version the memory was written against has been superseded. The codebase migrated. The project pivoted.
- `f_c` violation. The observation was saved late. What landed in the store is already a reconstruction.
- `f_s` violation. The memory was verified once, long ago. The read arrives outside any defensible verification window.

The central construction this paper proposes is the separation the DeFi oracle layer discovered years ago, imported into memory:

**the fact persists. the attestation renews.**

A living memory is not one that never expires. It is one whose validity is a *renewable attestation* evaluated at read time. A read returns the fact plus a verdict. Still valid. Protected within a grace window. Expired, re-verify before acting. Facts are never destroyed by staleness. They are demoted from *load-bearing* to *unverified* until re-attestation against current sources.

The construction requires zero new primitives. The reference crate's prospective-only renewal policy (`WindowedRenewal`, verdicts `StillValid` / `ProtectedByProspectiveOnly` / `ExpiredRequireRecommit`) transfers to memory unchanged: the memory's source set is the context root, source drift is the root bump, the read is the settlement, re-verification is the recommit. i demonstrate the transfer with a reference instantiation over a production observation store (Engram).

The instantiation is deliberately self-referential. The memory system that stores this research program's own history runs the program's primitive on itself. Each memory carries its own proof of freshness. That is the dogfooding argument: nobody needs to be convinced that memory freshness matters when the memory serving them the paper is wearing the verdict.

The paper makes four contributions:

1. The identification of agent memory as persisted context, and the mapping of the four freshness types onto the memory lifecycle (write lag, source drift, world-version distance, verification window).
2. The fact/attestation separation as the resolution of the freshness-versus-permanence tension: renewable validity over immutable facts.
3. The read-time gate semantics: graceful degradation of recall (serve / serve-flagged / re-verify) in place of the settlement gate's binary refusal, with heartbeat and verify-on-read as the two renewal schedules.
4. A reference instantiation reusing the existing renewal primitive over a production memory store, with the self-referential deployment as its evaluation.

The paper does not claim novelty for TTLs, cache invalidation, or staleness detection in retrieval systems. It claims that treating memory validity as a *cryptographically attestable, renewable verdict* rather than a passive timestamp is the same primitive the settlement papers specify, and that the convergence across markets, computation, and memory is evidence the primitive is general.

The three instantiations now span: the theory (position paper), the market (the A2A dark pool `f_i` gate, §10.5), the mind (this paper).

**Keywords:** proof-of-context · agent memory · freshness · renewable attestation · read-time gating · staleness · context drift · living memory

---

## One-sentence framing

> *The position paper said attestations should be economically perishable.*
> *Agent memory is the surface where every attestation is already perishing and nothing measures it.*
> *This paper puts the verdict on the read path: the fact persists, the attestation renews.*

---

Juan Cruz Maisú ♥
