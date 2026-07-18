# Proof of Context

### A research program on attestation primitives for decentralized machine learning

**Author:** Juan Cruz Maisu · Buenos Aires, Argentina
[juancmaisu@outlook.com](mailto:juancmaisu@outlook.com) · [github.com/asastuai](https://github.com/asastuai)

---

## What is in this repository

This repository hosts the Proof of Context family of papers, a small body of work that proposes attestation-based verification primitives for decentralized machine learning settings, framed as a complement to (not a replacement for) cryptographic proof systems like zkML.

The family currently includes two papers and one wire-format specification:

### ◊ Proof-of-Context Wire Format v0.1: working specification

Byte-level shape of a PoC attestation as it travels between protocol participants. Emerged from running the same primitive through four independent consumer surfaces and observing convergence. Promotes the convergence to a stable contract so independent integrators can interop without coordinating individually.

- **Specification:** [SPEC-WIRE-FORMAT-v0.1.md](SPEC-WIRE-FORMAT-v0.1.md)
- **Reference implementations:** Rust ([proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl)), JavaScript (BaseOracle, TrustLayer), TypeScript (Vigil, PayClaw).
- **Status:** v0.1 published 2026-04-30. All five reference implementations produce byte-identical canonical hashes and verify each other's signatures.

---

The family also includes three papers:

### Proof of Context (v0.9.1): the framework paper

The original position paper. Names the gap in decentralized-ML protocols where computations are verified for correctness but not for *contextual freshness*: was the right model used, on the right input, against the right state, and was the result settled before that context drifted? Introduces four freshness dimensions (computational, model, input, settlement), the execution-context-root construction, and the triple-anchor timestamp. Maps the structural analogue to DeFi's oracle-freshness problem (2020-2024). As of v0.9 it also contains a formal model with a freshness-gated settlement soundness theorem and a multi-party corollary (§9), and a reference-implementation section reporting the v0.3 crate (§10) — gating model and input freshness against real canonical-state oracles (a witness-presented BaseOracle verifier for `f_i`, an M-of-N quorum model-lineage registry for `f_m`), a multi-party on-chain instantiation in an agent-to-agent dark pool (§10.5), and an evaluation with measured on-chain (120,799 CU/settle) and off-chain costs, test coverage, and cross-language convergence (§10.6).

- **Paper (Markdown):** [paper/proof-of-context.md](paper/proof-of-context.md)
- **Paper (PDF):** [paper/proof-of-context.pdf](paper/proof-of-context.pdf)
- **Reference implementation (Phase 2):** [proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl) — Rust crate with real cryptography (SHA-256 Merkle, Ed25519, MockCommitter, MockSettlementGate, end-to-end integration tests).
- **Status:** v0.9.1 (5 July 2026); position paper plus formal model (Theorem 1 + multi-party Corollary 1), and a reference-implementation section gating three of four freshness types against real oracles, with an on-chain dark-pool instantiation and a measured evaluation (§10.6). Public-share-ready.

### Proof of Context applied to Verifiable Inference (v0.1): first applied paper

A specialization of the v0.6 framework to commercial inference-as-a-service. Proposes a receipt-based dispute layer over TEE-attested inference. The central finding is that v0.6's four freshness dimensions do not preserve symmetrically when specialized to inference (one collapses, one renames, one new dimension emerges), and the resulting four dimensions partition asymmetrically (1-vs-3) by detection mode in a way that is itself the central conceptual contribution.

- **Abstract:** [paper-poc-inference-v0.1-abstract.md](paper-poc-inference-v0.1-abstract.md)
- **Paper draft (working):** [paper-poc-inference-v0.1-pre1.md](paper-poc-inference-v0.1-pre1.md) — heart sections (§4 Four Dimensions, §5 Inference Receipt, §6 Threat Model) complete; surrounding sections forthcoming.
- **Outline:** [paper-poc-inference-v0.1-outline.md](paper-poc-inference-v0.1-outline.md)
- **Construction process:** [CASE-V0.7-EXTENSION.md](CASE-V0.7-EXTENSION.md), complete record of the seven rounds of adversarial review that produced the heart sections.
- **Empirical companion (in private development):** cross-provider Qwen3 14B inference benchmark. Local consumer-tier baseline complete (RTX 5070, 9 cells, methodology documented). Cloud sweep and full publication pending. Findings will be reported inline in §8 of the paper when the study is complete.
- **Companion crate (forthcoming):** Phase 3 of [proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl) will implement the InferenceReceipt module.
- **Status:** v0.1 working draft published 2026-04-27; remaining sections in active writing.

### Proof of Context applied to Agent Memory (v0.1): third applied paper

A specialization of the framework to agent memory, argued as the purest surface: a memory entry is persisted context with no computation underneath, so memory validity *is* contextual validity. The central construction separates the immutable fact from a renewable attestation over its declared source set, and moves the verdict to the read path: reads return the fact plus a three-state settlement result (still-valid / drifted-in-grace / expired-reverify), never a hard failure, under renewal schedules imported from oracle design (heartbeat over the hot core, verify-on-read over the tail, deviation thresholds). The empirical section measures a production observation store — the store holding this research program's own history — and finds 55% of declared source references silently decayed within one hundred days, with the measurement's own coarseness demonstrating the missing primitive.

- **Abstract:** [paper-poc-agent-memory-v0.1-abstract.md](paper-poc-agent-memory-v0.1-abstract.md)
- **Paper draft (working):** [paper-poc-agent-memory-v0.1-pre1.md](paper-poc-agent-memory-v0.1-pre1.md) — all sections drafted (§1–§9); consistency and citation passes pending.
- **Outline:** [paper-poc-agent-memory-v0.1-outline.md](paper-poc-agent-memory-v0.1-outline.md)
- **Prior-art landscape:** [RESEARCH-LANDSCAPE-memory.md](RESEARCH-LANDSCAPE-memory.md) — two independent adversarially-verified scans; composite claim unoccupied, seven distinction lines drawn.
- **Measurement artifacts:** [measurements/](measurements/) — drift-measurement script and raw summary (2026-07-18).
- **Reference mapping:** `examples/memory_freshness.rs` in [proof-of-context-impl](https://github.com/Jc-asastu/proof-of-context-impl) — the verdict cycle over a real Ed25519-signed commitment, zero new primitives.
- **Status:** v0.1 pre-1 complete 2026-07-18; pre-submission verification debts listed in §8 of the draft.

---

## How to read this work

If you want the full framework, please read **v0.9.1** first ([paper/proof-of-context.md](paper/proof-of-context.md)). It is a complete position paper; §9 adds the formal model, soundness theorem, and multi-party corollary, and §10 reports the reference implementation (real canonical-state oracles, an on-chain dark-pool instantiation in §10.5, and a measured evaluation in §10.6).

If you are interested in commercial inference attestation specifically, please read the **v0.1 abstract** plus **§4-§6 of v0.1** ([paper-poc-inference-v0.1-pre1.md](paper-poc-inference-v0.1-pre1.md)). These three sections present the complete conceptual contribution. The surrounding sections (introduction, background, problem statement, implementation, empirical illustration, limitations, future work, conclusion) are scaffolded in the outline and will populate in subsequent revisions.

If you are curious about *how* a paper at this scope is built using AI-assisted adversarial review, please read **CASE-V0.7-EXTENSION.md**. It documents the seven rounds of review, what each round caught, what was accepted vs pushed back on, and the self-check protocol (bidirectional mapping + outline-consistency + cardinality scan) that emerged from the process.

---

## Citation

Both papers are citable. For v0.6:

```bibtex
@misc{maisu2026proofofcontext,
  title={Proof-of-Context: The Missing Verification Layer in Decentralized ML Protocols},
  author={Maisu, Juan Cruz},
  year={2026},
  month={6},
  howpublished={Position paper, \url{https://github.com/asastuai/proof-of-context}},
  note={Version 0.9.1; position paper with formal model (§9: soundness theorem + multi-party corollary), and reference implementation (§10) with real canonical-state oracles, an on-chain dark-pool instantiation (§10.5), and a measured evaluation (§10.6)}
}
```

For v0.1 applied:

```bibtex
@misc{maisu2026pocinference,
  title={Proof of Context applied to Verifiable Inference: A Receipt-Based Dispute Layer over TEE-Attested Commercial Inference},
  author={Maisu, Juan Cruz},
  year={2026},
  month={4},
  howpublished={Working draft, \url{https://github.com/asastuai/proof-of-context}},
  note={PoC-Inference v0.1, draft pre-1; heart sections complete}
}
```

---

## Status of the program

This is independent research, conducted by a single author from Buenos Aires, in collaboration with AI tools (Claude Opus, Anthropic) used as adversarial reviewers and writing partners.

※ The methodology of that collaboration is itself part of the public artifact. See [CASE-V0.7-EXTENSION.md](CASE-V0.7-EXTENSION.md) for the working record.

Issues, corrections, replication reports, and co-authorship inquiries are welcome via GitHub Issues or direct contact.

---

## Related work (from the author)

- [proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl) — Rust reference implementation of the framework's primitives
- [Hermetic Computing (kybalion)](https://github.com/asastuai/kybalion) — Rust framework formalizing the Seven Hermetic Principles as computational primitives
- [intent-cipher](https://crates.io/crates/intent-cipher) — Research crate exploring intent-keyed stream ciphers (published v0.2 after public v0.1 reframe)
- [SUR Protocol](https://github.com/asastuai/sur-protocol) — Perpetual futures DEX with agent-native execution layer (12 contracts, 531 Foundry tests)
- [Opus narrative](https://asastuai.github.io/opus/) — Six-week human-AI research collaboration documentation

---

## License

[CC BY 4.0](LICENSE), free to reuse with attribution.

---

## Contact

Juan Cruz Maisu · [juancmaisu@outlook.com](mailto:juancmaisu@outlook.com) · [github.com/asastuai](https://github.com/asastuai) · [linkedin.com/in/juan-cruz-maisu-b4b610308](https://www.linkedin.com/in/juan-cruz-maisu-b4b610308/)

---

Juan Cruz Maisú ♥
