# Proof of Context

### A research program on attestation primitives for decentralized machine learning

**Author:** Juan Cruz Maisu · Buenos Aires, Argentina
[juancmaisu@outlook.com](mailto:juancmaisu@outlook.com) · [github.com/asastuai](https://github.com/asastuai)

---

## What is in this repository

This repository hosts the Proof of Context family of papers — a small body of work that proposes attestation-based verification primitives for decentralized machine learning settings, framed as a complement to (not a replacement for) cryptographic proof systems like zkML.

The family currently includes two papers and one wire-format specification:

### ◊ Proof-of-Context Wire Format v0.1 — working specification

Byte-level shape of a PoC attestation as it travels between protocol participants. Emerged from running the same primitive through four independent consumer surfaces and observing convergence. Promotes the convergence to a stable contract so independent integrators can interop without coordinating individually.

- **Specification:** [SPEC-WIRE-FORMAT-v0.1.md](SPEC-WIRE-FORMAT-v0.1.md)
- **Reference implementations:** Rust ([proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl)), JavaScript (BaseOracle, TrustLayer), TypeScript (Vigil, PayClaw).
- **Status:** v0.1 published 2026-04-30. All five reference implementations produce byte-identical canonical hashes and verify each other's signatures.

---

The family also includes two papers:

### Proof of Context (v0.6) — the framework paper

The original position paper. Names the gap in decentralized-ML protocols where computations are verified for correctness but not for *contextual freshness*: was the right model used, on the right input, against the right state, and was the result settled before that context drifted? Introduces four freshness dimensions (computational, model, input, settlement), the execution-context-root construction, and the triple-anchor timestamp. Maps the structural analogue to DeFi's oracle-freshness problem (2020-2024).

- **Paper (Markdown):** [paper/proof-of-context.md](paper/proof-of-context.md)
- **Paper (PDF):** [paper/proof-of-context.pdf](paper/proof-of-context.pdf)
- **Reference implementation (Phase 2):** [proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl) — Rust crate with real cryptography (SHA-256 Merkle, Ed25519, MockCommitter, MockSettlementGate, end-to-end integration tests).
- **Status:** v0.6, public-share-ready since April 2026.

### Proof of Context applied to Verifiable Inference (v0.1) — first applied paper

A specialization of the v0.6 framework to commercial inference-as-a-service. Proposes a receipt-based dispute layer over TEE-attested inference. The central finding is that v0.6's four freshness dimensions do not preserve symmetrically when specialized to inference — one collapses, one renames, one new dimension emerges — and the resulting four dimensions partition asymmetrically (1-vs-3) by detection mode in a way that is itself the central conceptual contribution.

- **Abstract:** [paper-poc-inference-v0.1-abstract.md](paper-poc-inference-v0.1-abstract.md)
- **Paper draft (working):** [paper-poc-inference-v0.1-pre1.md](paper-poc-inference-v0.1-pre1.md) — heart sections (§4 Four Dimensions, §5 Inference Receipt, §6 Threat Model) complete; surrounding sections forthcoming.
- **Outline:** [paper-poc-inference-v0.1-outline.md](paper-poc-inference-v0.1-outline.md)
- **Construction process:** [CASE-V0.7-EXTENSION.md](CASE-V0.7-EXTENSION.md) — complete record of the seven rounds of adversarial review that produced the heart sections.
- **Empirical companion (in private development):** cross-provider Qwen3 14B inference benchmark — local consumer-tier baseline complete (RTX 5070, 9 cells, methodology documented). Cloud sweep and full publication pending. Findings will be reported inline in §8 of the paper when the study is complete.
- **Companion crate (forthcoming):** Phase 3 of [proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl) will implement the InferenceReceipt module.
- **Status:** v0.1 working draft published 2026-04-27; remaining sections in active writing.

---

## How to read this work

If you want the full framework: read **v0.6** first ([paper/proof-of-context.md](paper/proof-of-context.md)). It is a complete position paper.

If you are interested in commercial inference attestation specifically: read the **v0.1 abstract** plus **§4-§6 of v0.1** ([paper-poc-inference-v0.1-pre1.md](paper-poc-inference-v0.1-pre1.md)). These three sections present the complete conceptual contribution. The surrounding sections (introduction, background, problem statement, implementation, empirical illustration, limitations, future work, conclusion) are scaffolded in the outline and will populate in subsequent revisions.

If you are curious about *how* a paper at this scope is built using AI-assisted adversarial review: read **CASE-V0.7-EXTENSION.md**. It documents the seven rounds of review, what each round caught, what was accepted vs pushed back on, and the self-check protocol (bidirectional mapping + outline-consistency + cardinality scan) that emerged from the process.

---

## Citation

Both papers are citable. For v0.6:

```bibtex
@misc{maisu2026proofofcontext,
  title={Proof-of-Context: The Missing Verification Layer in Decentralized ML Protocols},
  author={Maisu, Juan Cruz},
  year={2026},
  month={4},
  howpublished={Position paper, \url{https://github.com/asastuai/proof-of-context}},
  note={Version 0.6}
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

[CC BY 4.0](LICENSE) — free to reuse with attribution.

---

## Contact

Juan Cruz Maisu · [juancmaisu@outlook.com](mailto:juancmaisu@outlook.com) · [github.com/asastuai](https://github.com/asastuai) · [linkedin.com/in/juan-cruz-maisu-b4b610308](https://www.linkedin.com/in/juan-cruz-maisu-b4b610308/)

---

Juan Cruz Maisú ♥
