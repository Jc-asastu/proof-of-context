# Proof of Context

### A research program on attestation primitives for decentralized machine learning

**Author:** Juan Cruz Maisu · Buenos Aires, Argentina
[juancmaisu@outlook.com](mailto:juancmaisu@outlook.com) · [github.com/Jc-asastu](https://github.com/Jc-asastu)

---

## What is in this repository

This repository hosts the Proof of Context family of papers, a small body of work that proposes attestation-based verification primitives for decentralized machine learning settings, framed as a complement to (not a replacement for) cryptographic proof systems like zkML.

The family currently includes three papers and one wire-format specification:

### ◊ Proof-of-Context Wire Format v0.1: working specification

Byte-level shape of a PoC attestation as it travels between protocol participants. Emerged from running the same primitive through four independent consumer surfaces and observing convergence. Promotes the convergence to a stable contract so independent integrators can interop without coordinating individually.

- **Specification:** [SPEC-WIRE-FORMAT-v0.1.md](SPEC-WIRE-FORMAT-v0.1.md)
- **Backing-Age extension:** [SPEC-BACKING-AGE-v0.1.md](SPEC-BACKING-AGE-v0.1.md) — un-resettable source-age propagation for agent pipelines (`backing` field over the `_poc` block): RFC 9111 `Age` semantics transferred to agent context, with a normative privacy rule (full backing sets never cross trust boundaries; a single scalar aggregate does). Reference implementation in `proof-of-context-impl` (`src/backing.rs`, 15 tests + runnable laundering demo), first deployment in the engram-live agent-memory sidecar.
- **Reference implementations:** Rust ([proof-of-context-impl](https://github.com/Jc-asastu/proof-of-context-impl)), JavaScript (BaseOracle, TrustLayer), TypeScript (Vigil, PayClaw).
- **Status:** v0.1 published 2026-04-30. The four JavaScript and TypeScript implementations produce byte-identical canonical-JSON SHA-256 hashes and verify each other's signatures. The Rust crate uses a typed Merkle construction over the same fields, so its hashes differ by design (see the specification, §9). Backing-Age extension added 2026-07-22.

---

The papers:

### Proof of Context (v0.9.1): the framework paper

The original position paper. Names the gap in decentralized-ML protocols where computations are verified for correctness but not for *contextual freshness*: was the right model used, on the right input, against the right state, and was the result settled before that context drifted? Introduces four freshness dimensions (computational, model, input, settlement), the execution-context-root construction, and the triple-anchor timestamp. Maps the structural analogue to DeFi's oracle-freshness problem (2020-2024). As of v0.9 it also contains a formal model with a freshness-gated settlement soundness theorem and a multi-party corollary (§9), and a reference-implementation section reporting the v0.3 crate (§10) — gating model and input freshness against real canonical-state oracles (a witness-presented BaseOracle verifier for `f_i`, an M-of-N quorum model-lineage registry for `f_m`), a multi-party on-chain instantiation in an agent-to-agent dark pool (§10.5), and an evaluation with measured on-chain (120,799 CU/settle) and off-chain costs, test coverage, and cross-language convergence (§10.6).

- **Paper (Markdown):** [paper/proof-of-context.md](paper/proof-of-context.md)
- **Paper (PDF):** [paper/proof-of-context.pdf](paper/proof-of-context.pdf)
- **Reference implementation (Phase 2):** [proof-of-context-impl](https://github.com/Jc-asastu/proof-of-context-impl) — Rust crate with real cryptography (SHA-256 Merkle, Ed25519, MockCommitter, MockSettlementGate, end-to-end integration tests).
- **Status:** v0.9.1 (5 July 2026); position paper plus formal model (Theorem 1 + multi-party Corollary 1), and a reference-implementation section gating three of four freshness types against real oracles, with an on-chain dark-pool instantiation and a measured evaluation (§10.6).
### Freshness-Gated Settlement for Attested Inference (v0.2): first applied paper

*Attestations expire; settlement does not notice.*

A hardware attestation is a statement about a moment — DCAP collateral carries `issueDate` and `nextUpdate`, NVIDIA's attestation service bounds nonce bindings to twenty-four hours — and every party in the chain treats it as perishable except the one that pays against it. This paper makes the age of an attestation a settlement predicate, and gives the concrete attack that makes it necessary: **rent an attested GPU for one hour, keep the key and the quote, and sell months of attested capacity from cheaper hardware**, with every signature and every quote verifying correctly the whole time. Freshness turns the attestation from a one-time purchase into a recurring cost matched to the resource it attests.

The verdict is per-dimension — established, contradicted, or unestablished — and deliberately cannot be collapsed into a boolean, because collapsing it is how cheap capacity comes to look like expensive capacity.

- **Abstract:** [paper-poc-inference-v0.2-abstract.md](paper-poc-inference-v0.2-abstract.md)
- **Paper draft (working):** [paper-poc-inference-v0.2-pre1.md](paper-poc-inference-v0.2-pre1.md) — §2 (prior art), §4–§6 (revised), §7 (the contribution), §9, §10, §12 written; §1, §3, §8, §11 still scaffolded.
- **Prior-art scan:** [RESEARCH-LANDSCAPE-attested-inference.md](RESEARCH-LANDSCAPE-attested-inference.md) — fourteen entries verified against primary sources, including what is *occupied* and why the thesis rotated.
- **Superseded:** [paper-poc-inference-v0.1-pre1.md](paper-poc-inference-v0.1-pre1.md) (2026-04-27), kept unaltered as a dated artifact. v0.2 carries five corrections to it, marked in place rather than silently edited.
- **Construction process:** [CASE-V0.7-EXTENSION.md](CASE-V0.7-EXTENSION.md), the seven rounds of adversarial review behind the original heart sections.
- **Companion crate:** [proof-of-context-impl](https://github.com/Jc-asastu/proof-of-context-impl) — Real Intel TDX verification (offline, pure Rust) and NVIDIA EAT token verification, an inference receipt with per-dimension verdict, and tests against a **real** hardware quote and real collateral. Measured: 272-byte receipts, 11–13 µs to sign, 27–39 µs to verify.
- **Status:** v0.2 working draft, 2026-08-19.

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

If you are interested in commercial inference attestation specifically, please read the **v0.2 abstract** ([paper-poc-inference-v0.2-abstract.md](paper-poc-inference-v0.2-abstract.md)) and **§7** of the v0.2 draft ([paper-poc-inference-v0.2-pre1.md](paper-poc-inference-v0.2-pre1.md)), which holds the contribution. Sections still scaffolded are listed in the status line above.

If you are curious about *how* a paper at this scope is built using AI-assisted adversarial review, please read **CASE-V0.7-EXTENSION.md**. It documents the seven rounds of review, what each round caught, what was accepted vs pushed back on, and the self-check protocol (bidirectional mapping + outline-consistency + cardinality scan) that emerged from the process.

---

## Citation

The framework paper (v0.9.1) and the inference paper are citable. For the framework paper:

```bibtex
@misc{maisu2026proofofcontext,
  title={Proof-of-Context: The Missing Verification Layer in Decentralized ML Protocols},
  author={Maisu, Juan Cruz},
  year={2026},
  month={6},
  howpublished={Position paper, \url{https://github.com/Jc-asastu/proof-of-context}},
  note={Version 0.9.1; position paper with formal model (§9: soundness theorem + multi-party corollary), and reference implementation (§10) with real canonical-state oracles, an on-chain dark-pool instantiation (§10.5), and a measured evaluation (§10.6)}
}
```

For the inference paper (v0.1, superseded by the v0.2 working draft):

```bibtex
@misc{maisu2026pocinference,
  title={Proof of Context applied to Verifiable Inference: A Receipt-Based Dispute Layer over TEE-Attested Commercial Inference},
  author={Maisu, Juan Cruz},
  year={2026},
  month={4},
  howpublished={Working draft, \url{https://github.com/Jc-asastu/proof-of-context}},
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

- [proof-of-context-impl](https://github.com/Jc-asastu/proof-of-context-impl) — Rust reference implementation of the framework's primitives
- [SUR Protocol](https://github.com/Jc-asastu/sur-protocol) — Perpetual futures DEX with agent-native execution layer (12 contracts, 531 Foundry tests)
- [Dokimos](https://github.com/Jc-asastu/dokimos) — Attestation layer for AI agent memory: each memory carries the condition that would make it false, verdicts renew, facts persist. The applied counterpart of the agent-memory paper

---

## License

[CC BY 4.0](LICENSE), free to reuse with attribution.

---

## Contact

Juan Cruz Maisu · [juancmaisu@outlook.com](mailto:juancmaisu@outlook.com) · [github.com/Jc-asastu](https://github.com/Jc-asastu) · [linkedin.com/in/juan-cruz-maisu-b4b610308](https://www.linkedin.com/in/juan-cruz-maisu-b4b610308/)
