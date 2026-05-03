# Case for PoC-Inference v0.1 — first applied paper of Proof of Context

> **Authors and roles:** Three-party collaboration with two LLM instances of distinct cognitive temperament. **Juan Cruz Maisú** (independent researcher, Buenos Aires) brought the conceptual frame, arbitrated between proposed paths, and decided what entered each revision. The two LLMs, both Claude, played asymmetric roles: **Claude Code** (in-build instance) operated more analytically and constructively, advancing structure and proposing next moves; **Claude Classic** (separate instance) operated more intuitively and adversarially, pressing on premises and surfacing glamour traps. Reading the document as if Classic alone produced the critiques misses the structure. Two LLM minds with different temperaments iterated, with a human author choosing between them and reformulating when neither was right.
>
> **Audience:** future readers auditing why and how this paper was written.
>
> **Status:** v3 of the case, post Classic round 3. Original case + round-1 attacks + round-2 pushes + round-3 corrections accepted. This document is the working record.
>
> **Companion files:** [`paper-poc-inference-v0.1-abstract.md`](paper-poc-inference-v0.1-abstract.md), [`paper-poc-inference-v0.1-outline.md`](paper-poc-inference-v0.1-outline.md)

---

## 0 · Document version log

- **v1 (initial):** original proposal, branded as PoC v0.7 extension. Attacked by Classic round 1.
- **v1.5 (post Classic round 1):** thesis reformulated, three-dimensions collapse acknowledged, branding shifted toward PoC-Inference v0.1, divergence experiment proposed as upgrade, audience expansion proposed for landscape risk.
- **v2 (post Classic round 2):** three additional pushes accepted — family-of-papers language removed, divergence experiment moved to future work, audience expansion replaced with technical-durability framing.
- **v3 (this document, post Classic round 3):** five further corrections accepted — taxonomy expanded from three to four dimensions (capacity attestation emerges as new dimension; the `f_c → f_m` collapse holds for model substitution but not for hardware substitution); receipt scope clarified as consistency-detection not correctness-detection; "channel integrity" renamed to "request integrity" to avoid TLS-naming conflict; "operationally meaningless" softened to "operationally underspecified" in empirical framing; integration tests honestly disclosed as verifying the verification path against constructed mocks, not framework against real cheating; model-attestation infrastructure named as required ecosystem work in §10 future work.

---

## 1 · Strategic context

### 1.1 Why now

Three converging signals:

1. **PoC v0.6 has shipped and stabilized.** Paper public, crate Phase 2 with real cryptography, framework has held under independent review (Classic + own audit, post v0.3 reference-incident).
2. **A directly-relevant empirical study is in execution.** The Qwen3 14B cloud benchmark produces real cost / latency / throughput data across hardware tiers — exactly the empirical grounding a verifiable-inference paper needs.
3. **Multiple labs in the candidate's job-application landscape have stated theses around verifiable inference** (0G Labs, Hyperbolic, with sufficient verified activity as of 2026-04-24). The paper's relevance does not depend on any single lab surviving the writing window — see §6 risk register.

### 1.2 Alternatives explicitly considered and rejected

- **Camino 1 — Inference economics framework (5-7 days).** Position paper on operator-side cost framing. Faster, but doesn't compound the PoC body of work.
- **Camino 2 — Operator decision framework: self-host vs cloud (4-6 days).** Forward-Deployed-style decision tree. Closer to a blog post than a paper.
- **Camino 4 — Cost-of-inference as utilization function (4-5 days).** Spreadsheet + short paper. Incremental.

The case for the chosen path: PoC compounds. Each properly-scoped extension makes the previous work more valuable. A v0.1 applied paper attaches the candidate's name to a *primitive* in a domain that multiple target labs care about.

### 1.3 What this is NOT

- **Not a complete production system.** Reference-grade crate, not deployment-grade.
- **Not a novel cryptographic primitive.** Framework + construction sketch using established crypto (Merkle, Ed25519, TEE attestations, Drand).
- **Not a benchmark of zkML systems.** zkML occupies a different region of the design space.
- **Not a claim of completeness.** v0.1 names its own gaps explicitly.
- **Not a declaration of a paper family.** This document and the paper deliberately do not commit to PoC-Training, PoC-AgentExecution, or any other future applied papers. The architecture leaves room for them; the prose does not announce them. (Round 2 correction.)

---

## 2 · Conceptual proposal

### 2.1 Tesis central — falsifiable form

*"For the marginal customer choosing between commercial inference providers, the cost of a receipt-based dispute mechanism is orders of magnitude lower than full cryptographic proof of inference, and sufficient to resolve the cheating modalities that empirically occur in commercial deployments — provided the underlying TEE attestation chain is intact."*

This is attackable on three concrete axes:

- **TEE-gap sufficiency:** the cheating that actually occurs may depend on TEE attestation gaps that receipt-disputes cannot resolve.
- **Cost ratio:** zkML may not be orders of magnitude more expensive in the relevant regime (e.g., for small models, or for sampled verification).
- **Cheating prevalence:** the cheating modalities the paper enumerates may not occur at meaningful scale, in which case the dispute layer is solving a non-problem.

Each axis is a real, testable line of argument that the paper invites and engages with explicitly.

### 2.2 Specialization to inference — asymmetric: one collapse, one rename, one new dimension required (declared as finding)

When the four freshness types of v0.6 are specialized to inference-as-a-service, the framework does not preserve symmetrically. Two of v0.6's dimensions collapse or relabel; two new dimensions emerge:

| Dimension | v0.6 origin | Definition in inference | Detection mode |
|---|---|---|---|
| **Model freshness (`f_m`)** | refinement of v0.6 `f_m` | The inference call used the exact model weights / version / quantization claimed | Output-observable |
| **Settlement freshness (`f_s`)** | refinement of v0.6 `f_s` | The token-billing record matches the actual computation done | Attestation-required |
| **Request integrity (`f_req`)** | rename of v0.6 `f_i` | The user's input was delivered to the model as-submitted, no upstream transformation | Attestation-required |
| **Capacity attestation (`f_cap`)** | NEW — no v0.6 origin | The inference call ran on the hardware tier (GPU SKU, driver) claimed | **Attestation-only** |

**The collapse in detail:** v0.6's `f_c` (computational freshness) reduces to `f_m` in inference *for model substitution*: at greedy / low-temperature decoding with the same quantization, hardware-level FP indeterminism does not flip top-1 sampled tokens. Same model weights → same output content → no separate observable dimension for "did the compute claimed actually run". But this collapse holds *only* for the model-content axis. For the **capacity** axis — did the computation run on the hardware tier the customer paid for — output content is silent: a customer receiving correct responses from a silently-downgraded GPU sees no semantic difference, only a capacity difference (latency, throughput, batching) that requires statistical analysis across many calls to detect indirectly. The capacity dimension is therefore **attestation-only**, the only one of the four with this property, and it cannot be addressed by any output-verification approach.

**The renaming in detail:** v0.6's `f_i` (input freshness) was a temporal property — was the input new at time of computation, not a stale cache. In inference, the operationally-relevant property is request integrity (input as-submitted, no upstream transformation), which is non-temporal. Calling it "freshness" would be inaccurate; calling it "channel integrity" conflicts with TLS-land usage. We rename it to `f_req` (request integrity).

**The 1-vs-3 partition:** the four dimensions split asymmetrically — only model freshness (`f_m`) is even potentially output-observable, and that observability is conditional on canonical-reference infrastructure that does not currently exist. The remaining three (`f_s`, `f_req`, `f_cap`) are strictly attestation-required: no observation of response content can detect their cheating modalities, regardless of analytical sophistication, in the absence of a receipt. This partition is the paper's central conceptual contribution — three of the four cheating modalities cannot be detected by content inspection at any level of sophistication, period. Any framework that omits an attestation layer is structurally blind to three of the four dimensions and effectively-blind to the fourth in current practice. This is the strongest single argument for receipts.

This is presented in the paper as a finding — the v0.6 framework was over-symmetric for inference in some respects (`f_c → f_m`) and incomplete in others (no capacity dimension). v0.1 measures both. The four-dimension structure reappears not by artificial preservation but because the inference domain genuinely has four dimensions, distinct from v0.6's.

### 2.3 Construction: the InferenceReceipt

A small (~512-1024 byte) signed receipt structure attached to every inference response, exposing the four dimensions:

```
InferenceReceipt {
    request_id:           bytes32,
    model_attestation:    Merkle root over model weights, signed by provider TEE,
    input_attestation:    hash of canonical input (prompt + context window),
    output_attestation:   hash of returned tokens,
    hardware_attestation: TEE quote claiming GPU SKU + driver version,
    timestamp_anchor:     (block_height, tee_clock, drand_round),
    provider_signature:   Ed25519 over the above,
}
```

Receipt is small, parseable, signed, and separable from the response payload. The dispute mechanism that *acts* on the receipt is left out of scope (§9 in the paper outline).

### 2.4 Honest naming of what this does and does not give

**It gives:** a vocabulary for naming inference-attestation gaps (the four dimensions and their 1-vs-3 detection-mode partition); a concrete receipt structure that operators can implement; a separation of what the customer is paying for from what the customer is implicitly trusting; cheap *consistency* checking (the same provider serves the same model across calls).

**It does not give:** cryptographic proof of inference correctness (zkML's domain); guarantees against TEE compromise (TEE chain is the trust root); defense against TEE-vendor + provider collusion (out of scope, named explicitly); zero-overhead attestation (~5-15 ms per request, documented honestly); **cross-provider correctness verification of model identity** (the receipt detects consistency, not correctness — verifying that "the model called Qwen3 14B" is in fact Qwen3 14B requires either model-creator-published commitment standards or a public registry of canonical attestations, neither of which exists today; named as required ecosystem infrastructure in §10 future work).

---

## 3 · Empirical grounding

### 3.1 Role of the benchmark study (honestly illustrative)

The Qwen3 14B cloud benchmark provides cost / throughput / latency data across consumer-tier (RTX 5070) and cloud-tier (Lambda, Runpod, AWS — populating) hardware. In the paper, this data plays an **explicitly illustrative** role: it shows that today, the price-per-token figure customers compare across providers does not specify what was actually being served, making meaningful price comparison impossible without an attestation layer.

The benchmark does not prove cheating. It illustrates the customer's epistemic position. (Round 2 correction.)

### 3.2 What the empirical section will and will not claim

**Will claim:**
- Real measured throughput, latency, and cost across providers and hardware tiers
- The variance is large enough that an attestation layer's overhead (~5-15 ms / call) is justified
- Operator decisions today are made on materially incomplete information

**Will NOT claim:**
- That any specific cloud provider is being dishonest (no accusation without evidence)
- That the data proves the framework's value (the framework stands on its own logical ground)
- That measured numbers generalize beyond the specific configuration tested

### 3.3 The cross-provider divergence experiment is future work, not part of this paper

The methodologically-rigorous experiment that *would* demonstrate cheating directly — same prompt × multiple providers × multiple runs × token-level distribution comparison via KL divergence, controlled for declared quantization and intra-provider variability — requires 4-7 days of focused work and is named in the paper as future work. (Round 2 correction.)

Including a methodologically weaker version in this paper would be worse than not including it — a poorly-controlled negative result is not informative ("we couldn't detect it") and a poorly-controlled positive result is suspicious ("did they control for X"). No middle ground.

---

## 4 · Reference implementation (Crate Phase 3)

Same as v1: extends `proof-of-context-impl` with `inference.rs`, `attester.rs`, `customer.rs`, `tee_quote.rs` (mocked), integration test suites for each freshness dimension violation, benches for receipt overhead. Modules added are additive — Phase 2 users do not break.

What stays unchanged: Ed25519 signing, SHA-256 Merkle, MockCommitter / MockSettlementGate. Phase 3 reuses these.

What is mocked vs real: real cryptography throughout; mocked TEE quote (real TEE parsing requires platform-specific SDKs out of scope for a research crate). Module docs and paper §7 name the boundary explicitly.

---

## 5 · Timeline and milestones (revised to 25 days)

### 5.1 Top-line: 25 days, hard cap (extended from 21 per Classic round 1 push 3)

The hard cap is 25 days. If at day 22 the paper is not in publishable shape, the project is paused and what exists ships as `v0.1-draft` with explicit `WIP` status. No infinite extensions.

### 5.2 Milestones

| Day | Milestone | Deliverable |
|---|---|---|
| 1-2 | Outline + abstract approved by both reviewers ✅ | this document, abstract, outline files committed |
| 3-5 | Cloud benchmark sweep complete (Runpod + Lambda) | `qwen-cloud-benchmark/results/` populated |
| 6-9 | Paper draft v0.1-pre1 (sections §4, §5, §6 first per outline) | `paper-poc-inference-v0.1-pre1.md`, ~6000 words |
| 10-15 | Crate Phase 3 scaffold + InferenceReceipt + integration tests + benches | `proof-of-context-impl` PR ready for review |
| 16-19 | Reviewer round (Classic + Juan) — paper + crate | Issues filed, fixes applied |
| 20-22 | Revisions + final tighten + reference audit | `paper-poc-inference-v0.1.md` final |
| 23-24 | Publish (paper + crate v0.3.0) | GitHub release, public announcement |
| 25 | Buffer | for surprises that always happen |

### 5.3 Parallel pipelines (not paused)

- **0G + Nillion job applications** go in week 1 regardless. Cover letters drafted, just need PDF regeneration and submission.
- **SUR sales pipeline** continues on existing track.
- **If a job offer or SUR buyer materializes during the 25 days,** paper pauses mid-work and resumes when commitment stabilizes. Durable work, no value lost by delay.

---

## 6 · Risk register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Scope creep — v0.1 grows | Medium | Medium-high | Hard 25-day cap; weekly checkpoint at days 5, 10, 15, 20 |
| Cloud benchmark sweep blocked on accounts/payment | Medium | Low (paper can ship with local data + clear caveat) | Document the gap honestly |
| Classic disagrees with the core thesis | Low (after 2 rounds) | High | Already engaged. If a third round of fundamental disagreement emerges, halt. |
| Hallucinated references slip in | Low (Bible.md rule active) | Very high | Same audit pass as v0.3.1 fix |
| Crate Phase 3 hits unforeseen Rust friction | Medium | Medium | Phase 3 timeline now 6 days (10-15) with margin per Classic round 1 push 3 |
| TEE quote mocking criticized as hand-waving | Medium | Low | Pre-empted in §6 of paper outline + §4 of this case |
| Income pressure forces premature pause | Medium | Low (paper resumes later, no work lost) | Already accepted in §5.3 |
| Job offer arrives mid-project, attention split | Medium | Medium | Ship paper at whatever state, mark explicitly, prioritize offer |
| **Target landscape shifts during writing window** (round 2 addition) | Medium | **Mitigated by technical durability, not audience expansion.** A technically strong paper for engineers building inference systems remains relevant if a specific target lab pivots, freezes hiring, or closes. The paper is written for a single audience (technical engineers in this domain) and the durability comes from the content's correctness, not from hedging across multiple audience surfaces. (Round 2 correction.) | Confirmed 2026-04-24: 0G + Nillion + Hyperbolic verified active. Day-25 state not guaranteed. Mitigation = write well. |

---

## 7 · References policy and prior art

Same anti-hallucination commitment from v0.6: every reference verified against arxiv ID + abstract before inclusion. The reviewer round explicitly includes a reference-audit pass. Categories the paper will need are listed in the outline §12.

---

## 8 · Decision criteria — closed across three rounds of review

**Round 1 questions** (answered by Classic round 2):

1. **Is the core thesis defensible?** Yes, in round-2 reformulation. Three concrete attack axes named.
2. **Is the specialization a refinement or relabeling?** Mixed; presented as findings.
3. **Is the timeline honest?** Cap extended to 25 days; Phase 3 walked through realistically.

**Round 2 pushes** (resolved):

1. Family-of-papers language removed.
2. Divergence experiment moved to future work.
3. Audience expansion replaced with technical durability.

**Round 3 corrections** (this version, post Classic round 3):

1. **Taxonomy expanded from three to four dimensions.** The `f_c → f_m` collapse holds for model substitution but not for hardware/capacity substitution. Capacity attestation emerges as a fourth, attestation-only dimension. Output-observable / attestation-required partition is now the central contribution. §2.2 rewritten.
2. **Receipt scope clarified.** The receipt detects *consistency* (same provider serves same model across calls) cheaply; detecting *correctness* (the model is in fact what was named) requires model-attestation infrastructure that does not exist today. Both clarified in §2.4 and §10.
3. **"Channel integrity" renamed to "request integrity"** to avoid TLS-naming conflict.
4. **"Operationally meaningless" softened to "operationally underspecified"** in §8 of the paper outline. Customer's price comparison is information-incomplete, not information-empty.
5. **Integration tests honestly framed.** §7 acknowledges that the test suites validate the verification path against constructed mock failures, not the framework against real-world cheating. End-to-end validation against a cooperating provider named as future work.

If a fourth round of Classic review surfaces only polish (naming, sentence rephrasings), the proposal proceeds to writing. Genuine new structural pushes will be addressed; the standard is "would a careful technical reviewer of the published paper raise this", not "could this sentence be slightly better".

---

## 9 · What success looks like

Success at day 25:
- `paper-poc-inference-v0.1.md` shipped on `github.com/asastuai/proof-of-context`, ~7000-8000 words
- `proof-of-context-impl` crate at version 0.3.0 on crates.io with the inference module
- Empirical section grounded in real cloud benchmark data with all sources cited
- Reference audit clean (no hallucinated citations)
- Hyperbolic / 0G / Nillion / future cover letters can lead with the new artifact

Failure at day 25:
- Paper at draft state → ship as `v0.1-draft` with WIP status, do not pretend it is more than it is
- Crate not releasable → keep work-in-progress, do not push to crates.io
- Empirical section missing cloud data → ship with local-only data and explicit "cloud sweep pending future revision" note

In neither case is this wasted work. The paper draft seeds future revision; the crate work advances the codebase. Discipline: do not pretend to a quality level the work does not have.

---

*End of case v2. Outline and abstract are the next-level documents. Ready to start writing §4 (the heart) per the outline.*
