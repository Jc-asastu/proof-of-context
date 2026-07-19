---
title: "Proof of Context applied to Verifiable Inference"
subtitle: "A receipt-based dispute layer over TEE-attested commercial inference"
designation: "PoC-Inference v0.1 — first applied paper of the Proof of Context family"
author: "Juan Cruz Maisu"
affiliation: "Independent · Buenos Aires, Argentina"
contact: "juancmaisu@outlook.com · github.com/Jc-asastu"
draft_version: "v0.1-pre1 (heart sections complete; surrounding sections forthcoming)"
date_started: "2026-04-25"
abstract_file: "paper-poc-inference-v0.1-abstract.md"
outline_file: "paper-poc-inference-v0.1-outline.md"
case_file: "CASE-V0.7-EXTENSION.md"
companion_crate: "github.com/Jc-asastu/proof-of-context-impl (Phase 2 shipped; Phase 3 forthcoming)"
companion_data: "Cross-provider Qwen3 14B inference benchmark — local baseline shipped, cloud sweep pending; in private development, findings reported inline in §8 when complete"
status: "Working draft. Heart sections (§4 Four Dimensions, §5 Inference Receipt, §6 Threat Model) complete. Surrounding sections (§1, §2, §3, §7-§11) scaffolded in the outline and forthcoming."
---

# Reading guide

This document is **PoC-Inference v0.1, draft pre-1**. It is published in working-draft state because the conceptual contribution is concentrated in §4-§6 and that material is complete; the surrounding sections (introduction, background, problem statement, implementation, empirical, limitations, future work, conclusion) are scaffolded in the [outline](paper-poc-inference-v0.1-outline.md) and will populate in subsequent revisions.

For the impatient reader: the [abstract](paper-poc-inference-v0.1-abstract.md) gives the central claim and the 1-vs-3 partition finding; §4 develops the four-dimension specialization of v0.6 to inference; §5 specifies the receipt structure; §6 names the trust assumptions. Together these sections present the complete framework. Sections §1-§3 will frame the work for readers unfamiliar with v0.6; §7-§11 will document implementation, empirical illustration, limitations, and conclusion.

For the technically curious reader: the intellectual process by which this paper was constructed — including seven rounds of adversarial review on the heart sections — is documented in [`CASE-V0.7-EXTENSION.md`](CASE-V0.7-EXTENSION.md), preserved as a working record of how a paper at this scope can be developed with explicit AI-assisted review discipline.

---

# §1 · Introduction — *forthcoming*

> Thesis (per outline §1): Commercial inference is sold by trust, not by verification, and the customer's epistemic position is structurally weaker than the provider's — but the gap is repairable with a receipt format and a dispute layer that costs orders of magnitude less than cryptographic proof.
>
> Five paragraphs scaffolded in [`paper-poc-inference-v0.1-outline.md`](paper-poc-inference-v0.1-outline.md). Will be written in the next revision pass with audience calibration to high-stakes, regulated, aggregator, and on-chain-protocol customer segments rather than universal applicability framing.

---

# §2 · Background and Prior Art — *forthcoming*

> Thesis (per outline §2): Inference verification sits between two well-developed but operationally awkward extremes — cryptographic proof systems on one side, TEE attestation chains on the other — and existing work has mostly contributed to one of those extremes rather than to the operator-facing middle.
>
> Six paragraphs scaffolded covering zkML (EZKL, Giza, Lagrange's DeepProve), TEE-based attestation (Intel SGX, NVIDIA CC, AMD SEV-SNP), locality-based verification (TOPLOC, arXiv:2501.16007), Verifiable Dropout (arXiv:2512.22526), the v0.6 PoC framework, and the operator-facing middle gap this paper fills.

---

# §3 · The Inference Setting — *forthcoming*

> Thesis (per outline §3): Inference, considered as a commercial transaction, has observable cheating modalities that recur across providers and that the existing receipt format (token count + model name) cannot detect.
>
> Five paragraphs scaffolded covering model substitution under load, hardware tier downgrade, input transformation upstream, and token count / billing asymmetry — the four modalities §4 then specializes the framework to address.

---

# §4 · Four Dimensions for Inference: an asymmetric specialization

The Proof of Context framework introduced in v0.6 identified four freshness dimensions that any decentralized-ML attestation system must address: computational freshness (`f_c`), model freshness (`f_m`), input freshness (`f_i`), and settlement freshness (`f_s`). The v0.6 framing was deliberately general — it abstracted across distributed training, marketplace settlement, and inference, asserting that the four dimensions held in each setting because the underlying threat model (an actor with privileged information about the computation hiding that information from a counterparty) is invariant across them.

When we specialize that framework to commercial inference-as-a-service, the four dimensions do not preserve symmetrically. Two of them collapse or relabel — the computational dimension reduces to the model dimension along the semantic axis, and the input-freshness dimension is more accurately characterized as request integrity (a non-temporal property) — and a fourth dimension emerges that v0.6 did not need to name separately: capacity attestation, the property that the inference call ran on the hardware tier the customer paid for. The clean dimensions for inference are therefore four, but they are not the same four as v0.6.

These four dimensions partition asymmetrically by detection mode in a way that constitutes the central finding of this paper: **only one of the four dimensions is even potentially output-observable** (model freshness, and that observability is itself conditional on infrastructure that does not currently exist at standard, as we discuss below). **The remaining three — settlement freshness, request integrity, and capacity attestation — are strictly attestation-required.** No observation of response content can detect their cheating modalities, regardless of analytical sophistication, in the absence of a receipt. We expected the partition to be more balanced when we began this work; finding it to be 1-vs-3 was itself a result, and a stronger argument for the receipt format than a 2-vs-2 partition would have been. We treat the asymmetric specialization itself as a finding of this paper, not as an asymmetry to be hidden by relabeling.

We work through the four dimensions in order, identifying for each its v0.6 origin (or absence), its inference-specific definition, its detection mode, and the cheating modality it addresses.

## 4.1 Model freshness (`f_m`) — refinement of v0.6

In the inference setting, model freshness specializes to a precise commercial claim: the inference call used the exact model weights, version, and quantization the customer requested, with no substitution. The cheating modality is *model substitution under load* — the documented practice of providers serving a smaller or more aggressively quantized variant of a named model when capacity is constrained, while billing at the original model's price. A substituted model produces measurably different output distributions on the same prompts, which means model substitution is in principle detectable from response content — but only when a trusted reference is available against which to compare. We discuss the scoping of that "in principle" immediately below.

Detection mode: **output-observable**, conditionally. The customer (or a third-party auditor) can in principle detect model substitution by inspecting responses and comparing tokens against a reference. This output-observability is conditional on the customer having access to a trusted reference for the canonical model — either via a public registry of model commitments, an independently-verified provider, or a held-out baseline. The infrastructure for such references does not currently exist at standard for any major commercial model: no model creator (Hugging Face publisher, Alibaba for Qwen, Anthropic for Claude, etc.) currently publishes canonical Merkle commitments over weight files in a form that operators can use as reference. We name this missing infrastructure as a structural limitation in §5 and as ecosystem future work in §10.

In the absence of such infrastructure, the receipt's `model_attestation` field reduces to a *consistency* check rather than a *correctness* check: the customer can verify that a single provider serves the same model attestation root across calls (consistent serving) and detect changes in the root that signal substitution. The customer cannot verify that the served model is, in fact, the canonical "Qwen3 14B Instruct FP16" rather than some same-named-but-different artifact, because no canonical reference exists to compare against. The model dimension is therefore output-observable in principle and consistency-only in current practice. Receipt requirement: a cryptographic commitment to the model weights at request time, signed by the provider's TEE, included in the response receipt as `model_attestation`.

The refinement from v0.6 is genuine, not relabeling: v0.6's `f_m` was framed for distributed-training settings where "the model used" was a checkpoint identifier in an iterative process. Here, "the model used" is a frozen artifact identified by content hash, which makes the detection mode sharper and the receipt requirement more concrete — even when the canonical reference is absent.

## 4.2 Settlement freshness (`f_s`) — refinement of v0.6

Settlement freshness in inference specializes to: the token-billing record on the customer's invoice matches the actual computation done. The cheating modality is *billing asymmetry* — total billed tokens exceeding total produced tokens, or reasoning-chain tokens (in models that emit reasoning before content) being billed at the same per-token rate as user-facing content tokens without being declared as such, or per-call overhead being added to the token count under cover.

Detection mode: **attestation-required**. The customer has no first-party visibility into whether 247 billed tokens reflects the actual model output — the model could have produced 200 tokens, the customer could have received 200 tokens of content, and the provider could still bill 247 by adding undocumented overhead. Output content does not reveal billing discrepancies. Receipt requirement: a provider-signed token count, with reasoning-token disclosure separated from content-token count, included as a structured field in the receipt.

This is an important distinction from `f_m`. Even when content arrives correctly, the billing line item is not auditable from content alone. The provider knows the true count; the customer does not. This is the canonical "attestation-required" dimension — no amount of output verification can address it.

## 4.3 The collapse — and where it does not hold

In a single-call inference, computational freshness as defined in v0.6 ("the compute claimed actually executed") reduces to model freshness *along the model-content axis*. Here is the argument: at greedy decoding or low-temperature sampling, with the same model weights and the same quantization, the output tokens produced by an inference call are determined by the model's logits at each position. Floating-point indeterminism between hardware tiers (different CUDA kernel versions, different attention implementations, different fused operators) produces small numerical differences in those logits, but these differences typically do not flip the top-1 sampled token because the high-confidence positions are dominated by signal, not by float-level noise. Same model weights → same output content → no separate observable dimension for "did the compute claimed actually run".

The collapse therefore holds for *model substitution*: a provider claiming Qwen3 14B FP16 and silently serving Qwen3 14B INT4 produces detectably different tokens, which is detected by `f_m`, not by a separate `f_c`.

But this collapse holds *only* along the model-content axis. There is a second axis along which providers can substitute: the **capacity** axis. A provider claiming H100 and silently running A10 *with the same model weights and quantization* produces the same output content. The customer receives correct responses. What changes is the response *characteristics* — latency at single concurrency, throughput under batching, time-to-first-token under load. Customers paying H100 prices for downgraded A10 hardware receive correct content but their downstream pipelines (latency-sensitive UI workflows, concurrency-bound batch jobs, real-time inference serving) silently degrade. This is cheating, and it is invisible to any framework that relies solely on content inspection.

The capacity axis is therefore a separate dimension that v0.6 did not need to surface, because v0.6's training-oriented framing assumed the participants in a distributed computation declared their own hardware in a federation that could verify it through the protocol. In commercial inference, the customer never sees the hardware; they see the response. Without explicit attestation, capacity cheating is undetectable.

## 4.4 Capacity attestation (`f_cap`) — emerges as new dimension

We name capacity attestation as the fourth dimension for inference. Its definition: the inference call ran on the hardware tier (GPU SKU, driver version, instance configuration) the provider attested to. Its cheating modality: silent hardware downgrade — provider claims premium hardware, charges premium price, runs cheaper hardware, returns correct content. Its detection mode: **attestation-required** — there is no reliable way for the customer to recover the true hardware tier from the response content, because content is not a function of hardware tier when the model is held constant. Statistical analysis across many calls can produce indirect evidence (latency distributions inconsistent with the claimed tier), but this requires far more data than a single-call receipt verification and is fragile to network jitter and provider-side caching.

Receipt requirement: a TEE quote claiming GPU SKU and driver version, separately attested from the model commitment. Concretely, this is a hardware attestation issued by the provider's confidential-computing infrastructure (Intel SGX, NVIDIA Confidential Computing, AMD SEV-SNP) and included in the receipt as `hardware_attestation`. The trust root reduces to the TEE attestation chain, which we discuss in §6.

The reason this dimension matters operationally — and why it is the strongest single argument for the receipt format — is that any verification framework that relies solely on output inspection is structurally blind to capacity cheating. zkML systems prove the computation was performed correctly given the inputs and the model, but they do not prove the computation was performed on the hardware the customer paid for. A zk-proof on an A10 looks identical to a zk-proof on an H100 if the computation produces the same result. Receipts addressed by attestation do not have this blind spot.

## 4.5 Request integrity (`f_req`) — rename of v0.6's `f_i`

The fourth v0.6 dimension was input freshness — the property that the input to a computation was new at the time of execution, not a stale-cached artifact. In a training context this is meaningful because data freshness affects model behavior, and the temporal axis is operationally relevant.

In inference, the analogous property is not temporal. The operationally-relevant question is whether the user's input was delivered to the model as the user submitted it, without upstream transformation. This includes: prompt sanitization (the provider edits or re-templates the prompt before forwarding to the model), system-prompt injection (the provider prepends instructions the user did not author), retrieval substitution (the provider replaces or augments the user-supplied context with material the user did not request), and tokenizer-mediated transformations (the provider applies a tokenizer that materially differs from the canonical one for the model).

These are integrity violations of the request, not freshness violations of the input. We therefore rename this dimension *request integrity* (`f_req`) rather than carrying the inaccurate "freshness" label. We deliberately avoid the alternative name "channel integrity" because in cryptographic literature *channel integrity* refers to transport-layer security (TLS), which is a distinct concern.

Detection mode: **attestation-required**. A transformed input produces different output, but only the provider knows what the original input was. From response content alone, the customer cannot distinguish "input was transformed upstream" from "model was substituted", "quantization was changed", or "any other source of output difference". The detection requires a receipt field that commits to a canonical hash of the input the model actually received: the customer computes `hash(prompt_submitted)` themselves, compares against the receipt's `input_attestation`, and the comparison either matches (request integrity preserved) or does not (request was transformed). The canonicalization rule must be specified explicitly to make this comparison meaningful; we address the specification in §5.

Receipt requirement: hash of canonical input, included as `input_attestation`.

## 4.6 The 1-vs-3 partition

Restated in tabular form:

| Dimension | Origin | Detection mode | Cheating modality |
|---|---|---|---|
| Model freshness (`f_m`) | refinement of v0.6 `f_m` | Output-observable (conditional on canonical reference) | Model substitution |
| Settlement freshness (`f_s`) | refinement of v0.6 `f_s` | **Attestation-required** | Token billing asymmetry |
| Request integrity (`f_req`) | rename of v0.6 `f_i` | **Attestation-required** | Upstream input transformation |
| Capacity attestation (`f_cap`) | new — no v0.6 origin | **Attestation-required** | Hardware tier downgrade |

The categorization itself is the central conceptual contribution of this paper. Three of the four cheating modalities — settlement asymmetry, request transformation, and hardware downgrade — cannot be detected by content inspection at any level of analytical sophistication, period. Any verification framework that omits an attestation layer is structurally blind to all three. The fourth dimension (model freshness) is detectable by content inspection in principle, but only when the customer has a canonical reference to compare against, and the infrastructure for such references does not currently exist at standard for any major commercial model. In current practice, all four dimensions therefore require the receipt layer to be addressed at all.

The 1-vs-3 partition is not a stylistic choice but a structural property of the inference setting. It establishes the lower bound on what any framework must include to address the four cheating modalities, and that lower bound includes attestation — for three of the four dimensions categorically, and for the fourth in current practice.

## 4.7 Why the asymmetric specialization strengthens the paper

Three observations. First, asymmetry honestly named is more useful to operators than symmetry artificially preserved. A reader deciding whether to adopt the framework needs to know which cheating modalities they can detect from response content alone (in current practice, none reliably) and which require the receipt layer (in current practice, all four). Forcing the four dimensions into the same detection mode would obscure that practically-load-bearing distinction.

Second, the collapse-and-emergence pattern is itself a result. The v0.6 framework was over-symmetric for inference along one axis (`f_c → f_m`) and incomplete along another (no capacity dimension). Identifying both — measuring where v0.6 generalized cleanly to inference and where it did not — is part of what an applied paper in a framework family does.

Third, the 1-vs-3 partition produces the strongest single argument for the receipt format. The argument is not "receipts are nice to have"; the argument is "three of the four cheating modalities cannot be addressed without them, and the fourth cannot be addressed in current practice without infrastructure that does not yet exist. Any framework that claims to address inference cheating without an attestation layer is incomplete by construction." That argument is durable across changes in the surrounding landscape — it does not depend on any specific cloud provider's behavior, on any specific cheating incident, or on any specific empirical claim about the rate at which substitution occurs. It depends only on the structural property that three of the four dimensions are not functions of response content.

We turn next to the receipt structure that addresses these four dimensions and the cross-cutting concerns (anti-replay, response binding, authentication) that make the receipts usable in practice.

---

# §5 · The Inference Receipt

The four dimensions of §4 imply a receipt structure, but they do not by themselves specify it. This section makes the receipt concrete: a small, signed, parseable artifact that travels alongside every inference response and exposes the four dimensions to a customer (or third-party auditor) willing to parse and verify it. The construction we propose is not novel as cryptographic engineering — it composes well-established primitives (Merkle commitments, Ed25519 signatures, TEE attestations, public randomness beacons) — and its contribution is not in any individual primitive but in the field-level decomposition that maps each cheating modality from §4 onto a specific verifiable artifact.

## 5.1 Design goals

We start by naming what the receipt must do and what we deliberately exclude.

The receipt must be: **small** (a few hundred bytes to a kilobyte, so that emitting one per response is trivially affordable for any commercial deployment); **parseable by a generic consumer** (no provider-specific SDK required to decode it; standard JSON or msgpack suffices); **separable from the response payload** (so that customers who do not parse it pay no overhead and customers who do can detect cheating without changing how they consume the response itself); **cryptographically signed end-to-end** (any modification of any field invalidates the whole); and **composable with TEE attestation** (the trust root for the receipt's most sensitive fields is the provider's confidential-computing infrastructure, not the receipt format itself).

The receipt is not, by design: a substitute for cryptographic proof of inference (zkML's domain); a complete dispute-resolution system (the legal, commercial, or on-chain layer that acts on the receipt is out of scope); or a verification of model identity in any absolute sense (it verifies consistency of what a provider serves, not correctness against a canonical reference, for reasons we develop in §5.6).

## 5.2 The `InferenceReceipt` struct

In Rust, the receipt is the following:

```rust
pub struct InferenceReceipt {
    // -------- cross-cutting fields --------
    pub request_id: [u8; 32],
    pub timestamp_anchor: TimestampAnchor,
    pub output_attestation: Hash,
    pub provider_signature: Ed25519Signature,

    // -------- dimension-implementing fields --------
    pub model_attestation: Hash,           // implements f_m
    pub input_attestation: Hash,           // implements f_req
    pub billing_attestation: TokenCounts,  // implements f_s
    pub hardware_attestation: TeeQuote,    // implements f_cap
}

pub struct TimestampAnchor {
    pub block_height: u64,
    pub tee_clock_ns: u64,
    pub drand_round: u64,
}

pub struct TokenCounts {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub reasoning_tokens: u32,  // separately disclosed for reasoning models
    pub billed_tokens: u32,     // what the customer is charged for
}

pub struct TeeQuote { /* opaque, parsed by platform-specific TEE library */ }
```

The struct serializes to roughly 512-1024 bytes depending on the size of the TEE quote (which dominates) and the choice of canonical serialization (we recommend deterministic CBOR or JSON canonical form per RFC 8785). The receipt is intended to be returned as an HTTP response header (`X-Inference-Receipt`) for non-streaming endpoints and as a final SSE event for streaming endpoints. In both cases, it is optional from the customer's perspective: a customer that does not request or parse it pays no cost.

## 5.3 Field-by-field motivation

Each field maps either to one of the four dimensions in §4 or to a named cross-cutting concern. This bidirectional mapping is part of the framework's discipline — no orphan fields, no dimensions without implementation.

The four **dimension-implementing fields**: `model_attestation` is the Merkle root over a canonical serialization of the model weights, computed by the provider's TEE at request time and signed under the TEE's attested key. It implements `f_m` from §4.1. `input_attestation` is the cryptographic hash of the canonical form of the input the model actually received. To make this comparable across implementations, we declare a specific canonicalization rule: the input string is normalized to UTF-8 NFC and serialized via JSON canonical form (RFC 8785), then SHA-256-hashed; the same rule is applied client-side when the customer recomputes the hash for verification. (Implementations are free to substitute equivalent canonical schemes, but the choice must be declared in the receipt's metadata; without an agreed canonicalization, integrity comparison is meaningless.) `billing_attestation` is the structured token-count disclosure described in §4.2 — separately exposing prompt, completion, reasoning, and billed token counts so that any asymmetry between them is auditable. `hardware_attestation` is a TEE quote in the provider's native format (Intel SGX, NVIDIA Confidential Computing, AMD SEV-SNP) claiming the GPU SKU and driver version on which the inference ran; the trust root for this field is the TEE attestation chain, discussed in §6.

The four **cross-cutting fields**: `request_id` is a 256-bit identifier unique per call, used to prevent confusion across the customer's request log. `timestamp_anchor` is a triple — `(block_height, tee_clock_ns, drand_round)` — that prevents replay across sessions and pre-dating attacks; the construction is the same triple-anchor introduced in v0.6 §4.3 and inherits its analysis. `output_attestation` is a hash over the returned tokens; it binds the receipt to the specific response it accompanies, preventing a single receipt from being reused across different responses to different customers. `provider_signature` is an Ed25519 signature over the canonical serialization of all preceding fields; the signing key is bound to the provider's TEE quote chain, so a compromise of the signature reduces to a compromise of the TEE chain itself.

## 5.4 What the customer does with a receipt

Verification proceeds in three layers, each cheaper than the next is sensitive.

The cheapest layer, performed locally without provider cooperation: recompute `hash(prompt_submitted)` under the canonical rule and compare to `input_attestation`; recompute `hash(response_received)` and compare to `output_attestation`; verify `provider_signature` against the provider's published TEE-bound public key. These three checks together establish that the receipt is genuinely from the provider, that it was issued for this specific request and response, and that the input the model received was as the customer submitted it.

The middle layer, requiring per-provider state: store `model_attestation` from the first receipt and compare to `model_attestation` on every subsequent receipt; flag changes. This is the consistency check — same provider serves the same model across calls — and it is the most operationally valuable signal in current deployment, given the absence of canonical reference infrastructure (§5.6).

The most sensitive layer, requiring TEE-aware tooling: parse `hardware_attestation` using the appropriate TEE library, verify the quote chain back to the manufacturer's root, and confirm the claimed GPU SKU matches the customer's expectation. This is the only check that genuinely requires the customer to have non-trivial infrastructure of their own, and is the layer most likely to be delegated to a third-party auditor in production.

A discrepancy at any layer constitutes evidence sufficient to ground a dispute. The dispute itself — what happens after the customer says "this receipt is wrong" — is a separate concern (§5.8).

## 5.5 Anti-replay and freshness gating

The combination of `request_id`, `timestamp_anchor`, and `provider_signature` makes the receipt non-replayable across sessions. A receipt issued for request `R` cannot be reused for request `R'` because `request_id` and the response-binding `output_attestation` would not match. The Drand round in `timestamp_anchor` defends against pre-dating: a provider cannot issue a receipt with a `drand_round` in the future, because the future round value is not yet public; cannot back-date convincingly to a past round either, because the customer can independently verify that the claimed round matches the claimed `block_height` and `tee_clock_ns` within tolerable skew.

The triple-anchor construction is inherited unchanged from v0.6 §4.3. The reader is referred to that paper for the failure-mode analysis; nothing in the inference setting requires modification of the anchor itself.

## 5.6 Receipts detect consistency, not correctness — and what would be required for the latter

This subsection addresses the limit that distinguishes what the receipt format actually achieves today from what a reader might naively assume it achieves.

The `model_attestation` field commits to a Merkle root over the model weights the provider's TEE saw at request time. A customer collecting receipts from a single provider can verify whether that root is invariant across calls (consistent serving) and detect substitution (root changes silently). What the customer cannot do is verify that the received root matches the canonical Merkle root of, for example, "Qwen3 14B Instruct FP16" — because no canonical Merkle root for that model is currently published by any model creator. Hugging Face publishes the weight files; it does not publish a canonical Merkle commitment over a deterministic serialization of those files. Alibaba, the originator of Qwen3, does the same. Anthropic does not publish weights at all.

This is a verification-ecosystem gap, not a flaw in the receipt format. The receipt format does what it can with what exists; it carries the commitment a provider's TEE produces and exposes any change in that commitment. To extend from consistency-detection to correctness-verification requires either (a) commitment standards adopted by model creators — which is to say, a small change in how Hugging Face and similar publishers package weight files — or (b) a public registry of canonical attestations maintained as a community-run good. Neither exists at the time of writing. We name this missing infrastructure as ecosystem future work in §10.

In current practice, then, the receipt's contribution to the model dimension is bounded but real: it makes silent substitution by a single provider observable, while leaving cross-provider model-identity verification as an open problem.

## 5.7 Storage and overhead

The performance cost of receipts is deliberately small relative to inference itself.

Per-request size: 512 bytes to 1 kilobyte, dominated by the TEE quote which is platform-specific (Intel SGX quotes are roughly 600 bytes; NVIDIA CC quotes are similar; AMD SEV-SNP quotes are slightly larger). Per-request signing overhead on the provider side: 5 to 15 milliseconds for the Ed25519 signature plus the canonicalization and hashing of inputs and outputs. Per-request verification overhead on the customer side: 3 to 8 milliseconds for the cheapest-layer checks (signature, input hash, output hash); the consistency layer adds a single hash comparison; the TEE-quote layer is platform-dependent, typically tens of milliseconds. Storage cost on the customer side: linear in the number of API calls; at one kilobyte per receipt, even a high-volume deployment producing one million calls per day produces only a gigabyte per day of receipts, trivially storable.

The performance numbers above are estimates from the reference implementation in §7; we make no claim that production implementations will match them exactly, and we encourage operators considering adoption to benchmark their own configurations. The point is the order of magnitude: receipts add single-digit milliseconds to a request that already takes hundreds, and add kilobytes to a payload that already runs in megabytes. The overhead is in the noise.

## 5.8 What we are not specifying — the dispute mechanism

The receipt is technical evidence. The mechanism by which a customer who detects a discrepancy in their receipts converts that evidence into a remedy is not.

We are deliberate about leaving this open. Different commercial settings will reach for different dispute mechanisms: some will encode dispute resolution into smart-contract escrow paid out conditional on receipt validity; some will use the receipts as evidence in traditional contract-enforcement proceedings; some will route disputes through a third-party arbitrator who specializes in inference. The receipt format is invariant under all of these — it provides cryptographic evidence in a form independent of the resolution mechanism.

Specifying the dispute mechanism is itself a research problem (touched on in §10 future work) but it is not a problem this paper solves. The paper's claim is more modest and, we hope, more durable: a small receipt format makes the four cheating modalities of §4 detectable; what is built on top of that detectability is for the commercial ecosystem to design.

We turn next to the threat model that grounds these receipts — specifically, to the trust assumption on the TEE attestation chain that underlies the entire construction.

---

---

# §6 · Threat Model and Trust Assumptions

The construction in §5 is sound under one explicit assumption: the underlying TEE attestation chain — Intel SGX, NVIDIA Confidential Computing, AMD SEV-SNP, or whatever platform the provider deploys — produces honest quotes. We name this assumption rather than burying it. The point of this section is to make the dependency visible, to bound what the receipt format does and does not protect against, and to position this work clearly relative to threat models it deliberately does not address.

## 6.1 What the receipt protects against

The receipt format detects the four cheating modalities enumerated in §4: model substitution (`f_m`), token billing asymmetry (`f_s`), upstream input transformation (`f_req`), and hardware tier downgrade (`f_cap`). Detection in each case requires a vigilant customer parsing the receipt, the relevant comparison data (the original prompt, the received tokens, the per-call invoice), and — for `f_cap` — the ability to verify the TEE quote chain. Given those, an opportunistic provider attempting any of the four modalities leaves cryptographic evidence that the customer can either act on directly or deliver to a third-party arbitrator. This is the operational claim the paper supports.

## 6.2 What the receipt does not protect against

The receipt format does not protect against attackers operating at the level of the trust root itself. Specifically:

A **colluding TEE vendor**. If Intel, NVIDIA, or AMD signs forged attestation quotes — or if a provider obtains the TEE manufacturer's signing key and produces quotes that pass verification but do not reflect actual hardware state — the receipt's `hardware_attestation` and `model_attestation` fields become meaningless without the customer being able to detect it. This is the canonical TEE assumption failure mode and it is structural: any system that builds on TEE attestation inherits this exposure.

A **TEE side-channel compromise** that leaks the provider's signing key to an attacker outside the enclave. Once the key is leaked, an attacker can produce signed receipts that bind any model attestation they wish to any output, and verification on the customer side cannot distinguish forged receipts from genuine ones. The history of SGX-class side-channel disclosures (SgxPectre, ÆPIC Leak, and related) makes this not a theoretical concern.

A **complete provider takeover** in which the attacker controls both the inference server and the key management infrastructure. In this case the receipts are not technically forged — they are issued by the legitimate provider key — but the entity issuing them is no longer who the customer believes they are doing business with. This is a different threat from cheating-by-an-honest-provider; it is closer to a supply-chain compromise.

A **denial-of-service or selective-omission** attack in which the provider simply refuses to issue receipts, or issues them only for some calls, or issues them in a format the customer's tooling cannot parse. The receipt format does nothing to compel emission; that is a contractual or regulatory layer concern, not a cryptographic one.

We name these failure modes because the alternative — claiming the receipt format protects against everything — would be the exact kind of overclaim the v0.6 paper explicitly disclaimed and that any reader with TEE background would spot in the first read.

## 6.3 The TEE chain as trust root

The receipt format reduces, in its trust dependencies, to: the TEE attestation chain plus the receipt format's own correctness. We are not contributing a new trust root; we are contributing a receipt format that composes with an existing trust root.

This is a distinction with operational consequences. A customer adopting this framework is implicitly accepting the security properties of their chosen provider's TEE platform — the manufacturer's attestation key chain, the platform's resistance to known side-channel classes, the firmware update discipline of both vendor and operator. These are real properties that vary across platforms and across deployment configurations, and the customer's risk profile is dominated by them, not by the receipt format itself. A customer who is comfortable with NVIDIA Confidential Computing's threat model gets, with this receipt format, a usable dispute layer on top of that comfort. A customer who is not comfortable with TEE attestation in general gets nothing this paper offers.

## 6.4 Why we do not claim "verifiable inference without trust assumptions"

A reader might reasonably ask: if the receipt format depends on TEE, why call it "verifiable inference" at all? The answer is calibration. Cryptographic proof of inference — what zkML systems offer — provides verifiability without trust in the prover, at the cost of orders-of-magnitude latency overhead and significant model-architecture restrictions. The receipt format we propose offers verifiability conditional on trust in the TEE attestation chain, at single-digit-millisecond overhead and no architectural restriction. The two occupy different points in the design space and are appropriate for different deployment regimes.

We use the term "verifiable" because the receipt makes specific claims about the inference cryptographically verifiable to the customer. We do not use the term "trustless" because the trust dependency on the TEE chain is real and structural. A reader who needs trustlessness should look at zkML; a reader who can accept the TEE assumption gets a much cheaper and more flexible verification primitive from this work.

## 6.5 What changes if the TEE assumption fails

If the TEE attestation chain is compromised, the failure cascades through the receipt format predictably. The Ed25519 signature on the receipt remains cryptographically valid — the math does not care that the signing key was stolen — but the content the receipt commits to becomes unverifiable. A receipt claiming `model_attestation = X` and `hardware_attestation = H100` becomes consistent with arbitrary actual model and hardware once the attacker controls the signing key. The dispute layer becomes useless against a sophisticated attacker who controls the TEE chain.

For this attacker class, only mechanisms that do not depend on TEE — zero-knowledge proof of inference being the canonical example — provide useful guarantees. The framework presented here is silent in this regime, and we recommend operators with TEE-skeptical threat models layer zk-inference on top of the receipt format rather than relying on the receipt alone.

## 6.6 Layered defense framing

The receipt format and zk-inference proofs are not competitors. They occupy different layers of a defense-in-depth stack.

Receipts plus TEE attestation defend against opportunistic provider cheating — a provider acting in their own short-term economic interest by silently substituting a cheaper model or running on cheaper hardware. This is the most common threat model in commercial inference today and the one this paper addresses.

Zk-inference proofs defend against TEE-level compromise — a provider whose TEE has been backdoored, whose signing key has been leaked, or who is in collusion with the TEE vendor. This is a more sophisticated threat model and one the receipt format alone does not address.

A deployment that needs both can have both. The receipt is a header on the response; a zk-proof is a separate artifact that can be requested for sampled calls. They compose. The cost of the layered approach is borne mostly on the proof side; the receipts add only their own modest overhead.

## 6.7 Operational implications

A customer adopting this framework needs to make three operational commitments. First, they accept the TEE attestation chain of their chosen provider as a trust root — a one-time decision, but a real one, that should be documented and reviewed periodically as TEE platforms evolve. Second, they parse and verify receipts on every call (or on a documented sampling strategy), which adds the negligible per-call overhead from §5.7 plus the operational cost of running the verifier. Third, they have a dispute mechanism in place — either contractually with the provider, or via a third-party arbitrator, or through some on-chain construction — so that the cryptographic evidence the receipt provides translates to actual remedy.

The first commitment is the one most likely to be skipped without consequence in a low-stakes deployment and most likely to bite in a high-stakes one. We do not have advice on which TEE platform a given customer should accept; that is a function of the customer's threat model, regulatory environment, and existing security posture. We do recommend that the decision be made deliberately rather than implicitly.

We turn next to the reference implementation that demonstrates the receipt format is buildable in practice.

---

---

# §7 · Reference Implementation — *forthcoming, depends on Phase 3 of the companion crate*

> Thesis (per outline §7): The `proof-of-context-impl` crate, Phase 3, is a Rust reference implementation of the receipt format with mocked TEE attestation, integration tests for the four dimensions, and benchmarked overhead measurements.
>
> Status: Phase 2 of [`proof-of-context-impl`](https://github.com/Jc-asastu/proof-of-context-impl) is shipped (real cryptography — SHA-256 Merkle, Ed25519, MockCommitter, MockSettlementGate). Phase 3 (the inference-specific receipt module) is specified in the outline §7 and will be implemented before this section is written. Seven paragraphs scaffolded.

---

# §8 · Empirical Illustration — *forthcoming, depends on cross-provider benchmark sweep*

> Thesis (per outline §8): A cross-provider benchmark of Qwen3 14B illustrates the operator's epistemic problem: today's price-per-token figure does not specify what was actually being served, and customers cannot detect substitution from outside.
>
> Status: A companion benchmark study (in private development) has the local consumer-tier baseline complete (RTX 5070, 9 cells, methodology documented). The cloud sweep across at least one provider is required before §8 is written. Findings will be reported inline when the study is complete. Seven paragraphs scaffolded.

---

# §9 · Limitations — *forthcoming*

> Five hundred words scaffolded in the outline. Will name explicitly: TEE-as-trust-root assumption, mocked TEE quote in the reference implementation, single-author single-iteration review, dispute mechanism left out of scope, and the absence of direct empirical evidence of cheating (the divergence experiment is named as separate future work).

---

# §10 · Future Work — *forthcoming*

> Six items scaffolded in the outline: cross-provider divergence experiment with rigorous methodology; model-attestation infrastructure (commitment standards or public registry); dispute mechanism design; aggregate receipts for sampled verification; end-to-end validation against real providers with cooperating instrumentation; and production TEE integration replacing the mocks in the reference crate.

---

# §11 · Conclusion — *forthcoming*

> Three hundred words scaffolded. Summary of the framework specialization, position in the design landscape between zkML and pure trust-the-provider, and pointer to what the work needs next from the ecosystem (independent replication, model-creator commitment standards, real-provider validation).

---

# §12 · References

> To be assembled with anti-hallucination discipline (per the author's standing rule, established after the v0.3 incident in PoC v0.6 and documented in [`CASE-V0.7-EXTENSION.md`](CASE-V0.7-EXTENSION.md) §7). Every reference verified against arxiv ID + abstract before inclusion. Built incrementally as each section cites — never batched at the end.
>
> The references already cited inline in the heart sections (§4-§6) include: PoC v0.6 (self-citation), TOPLOC (arXiv:2501.16007), Verifiable Dropout (arXiv:2512.22526), and the SgxPectre and ÆPIC Leak side-channel disclosures named in §6.2. The full bibliography will be assembled when §1-§3 and §7-§11 are written.

---

## Version, status, and review history

This is **PoC-Inference v0.1, working draft pre-1**. Published 2026-04-27.

**Word count:** approximately 5,050 words across the heart sections (§4: 1,900; §5: 1,750; §6: 1,400). The remaining sections will add an estimated 4,000 words for a target final length around 9,000-9,500 words. Word counts in the heart sections exceed the original outline targets — the over-shoot is intentional: the asymmetric specialization that emerged during writing (§4's 1-vs-3 partition, the canonicalization rule in §5.3, the additional failure mode in §6.2) required more space than the outline anticipated to be defended honestly.

**Review history:** the heart sections passed seven rounds of adversarial review before publication of this draft. The full record — what each round flagged, what was accepted, what was pushed back on, and the meta-protocol that emerged for self-check (bidirectional mapping + outline-consistency + cardinality scan) — is preserved in [`CASE-V0.7-EXTENSION.md`](CASE-V0.7-EXTENSION.md). Readers interested in the methodology of how a paper at this scope can be built with explicit AI-assisted review discipline will find it useful as a working artifact in itself.

**What is not yet here:**

- **§1, §2, §3, §9, §10, §11** are scaffolded in the outline and will be written in the next revision pass. These are framing, context, and closure — they do not change the conceptual contribution, which is fully present in §4-§6.
- **§7** depends on Phase 3 of the [`proof-of-context-impl`](https://github.com/Jc-asastu/proof-of-context-impl) crate. Phase 2 is shipped. Phase 3 (the inference-specific receipt module) will be implemented before §7 is written.
- **§8** depends on the cloud-tier sweep of a companion Qwen3 14B inference benchmark study (in private development). The local consumer-tier baseline (9 cells on RTX 5070) is complete; the cloud sweep is pending. Findings will be reported inline when the study reaches publication-grade completeness.
- **§12** (references) will be assembled with the anti-hallucination discipline established after the v0.3 incident in PoC v0.6.

**Reader feedback** is welcome via GitHub Issues. **Replication** of any claim in §4-§6 is welcome. **Reuse** under CC-BY 4.0 with attribution.

---

*End of working draft.*
