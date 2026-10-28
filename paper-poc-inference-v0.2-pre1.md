---
title: "Freshness-Gated Settlement for Attested Inference"
subtitle: "Attestations expire; settlement does not notice"
designation: "PoC-Inference v0.2 — first applied paper of the Proof of Context family"
author: "Juan Cruz Maisu"
affiliation: "Independent · Buenos Aires, Argentina"
contact: "juancmaisu@outlook.com · github.com/Jc-asastu"
draft_version: "v0.2-pre1 (thesis rotated; §2 written; §4-§6 revised against verified prior art; §7 new)"
date_started: "2026-04-25"
supersedes: "paper-poc-inference-v0.1-pre1.md — 'A receipt-based dispute layer over TEE-attested commercial inference' (2026-04-27)"
abstract_file: "paper-poc-inference-v0.2-abstract.md"
outline_file: "paper-poc-inference-v0.1-outline.md"
case_file: "CASE-V0.7-EXTENSION.md"
landscape_file: "RESEARCH-LANDSCAPE-attested-inference.md"
companion_crate: "github.com/Jc-asastu/proof-of-context-impl (Phase 3b landed: real TDX + NVIDIA EAT verification, --features tee-tdx,tee-nvidia)"
companion_data: "Measured against a real TDX quote and real collateral, and against a local inference server; numbers inline in §5.7 and §7.6"
status: "Working draft. Thesis rotated to freshness-gated settlement. §2 (prior art) written. §4-§6 revised. §7 (attestation lifecycle) new. §1, §3, §8-§11 still forthcoming."
---

# Reading guide

This document is **PoC-Inference v0.2, draft pre-1**, and it revises v0.1 rather than extending it.

**What changed and why.** v0.1 (2026-04-27) argued for a receipt-based dispute layer over TEE-attested inference. A due-diligence scan conducted 2026-08-19 — recorded in full in [`RESEARCH-LANDSCAPE-attested-inference.md`](RESEARCH-LANDSCAPE-attested-inference.md), with every entry verified against its primary source — established that most of that ground is occupied. Binding an execution to a specific model through enclave measurement is done, in papers and in shipped products. Composing CPU and GPU evidence is being standardized at the IETF. The observation that correctness proofs do not bind expended effort now belongs to a paper accepted at IEEE S&P 2026. Attesting inference with a TEE is not a contribution in 2026.

One thing is not occupied, and it is the thing this research program has been about since v0.6 of the framework paper: **an attestation is a perishable instrument, and no settlement system treats it as one.** v0.2 is built on that.

Three factual corrections to v0.1 are carried here and marked in place, because a superseded claim left standing is worse than one never made: canonical model commitments now exist (§5.6), model substitution is *not* reliably detectable from output even in principle-with-reference (§4.1, §4.6), and capacity has a software-only counterexample that v0.1's framing did not anticipate (§4.4).

For the impatient reader: the [abstract](paper-poc-inference-v0.2-abstract.md) states the thesis; §2 places it against verified prior art; §7 is the new contribution and the reason this draft exists. §4-§6 remain the framework's spine, revised.

For the technically curious reader: the intellectual process by which the original heart sections were constructed — seven rounds of adversarial review — is documented in [`CASE-V0.7-EXTENSION.md`](CASE-V0.7-EXTENSION.md).

---

# §1 · Introduction — *forthcoming*

> Thesis (per outline §1): Commercial inference is sold by trust, not by verification, and the customer's epistemic position is structurally weaker than the provider's — but the gap is repairable with a receipt format and a dispute layer that costs orders of magnitude less than cryptographic proof.
>
> Five paragraphs scaffolded in [`paper-poc-inference-v0.1-outline.md`](paper-poc-inference-v0.1-outline.md). Will be written in the next revision pass with audience calibration to high-stakes, regulated, aggregator, and on-chain-protocol customer segments rather than universal applicability framing.

---

# §2 · Background and Prior Art

This section is written adversarially against our own contribution. Each subsection names work that occupies ground this paper might otherwise have claimed, states plainly what it settles, and identifies only what it leaves open. A reader should finish §2 able to reconstruct why §7 is the contribution and the rest is context.

## 2.1 Cryptographic proof of inference, and the boundary it does not cross

Zero-knowledge machine learning proves that an output is consistent with executing a declared architecture under committed weights. The cost has fallen substantially — zkLLM (Sun et al., arXiv:2404.16109) and subsequent lookup-centric systems such as Jolt Atlas (arXiv:2602.17452) improve constants by large factors — and remains, for transformer-scale models, minutes to hours per inference against milliseconds for the alternatives.

The more interesting limit is not cost. **Gong, Liu and Li (arXiv:2607.28884, accepted to IEEE S&P 2026)** formalize what they call the *effort gap*: a correctness proof *"does not bind the effort expended to produce the output."* Their Hollow-LLM attack retains the declared architecture and parameter count while embedding ghost weights whose algebraic structure collapses effective computation. The proofs verify. The provider serves at small-model cost while charging for a large model, with no quality loss under the same verification circuit. Their closing sentence asks for *"additional protections to bind correctness to verifiable computational work"* and supplies none; the only mitigation circulating is to extend the proof to certify structural properties of the weight matrices, which is more of the expensive thing.

We take the effort gap as established and as belonging to its authors. What we observe is that it is one instance of a broader pattern — a proof of what was computed says nothing about *what resources produced it* — and that the pattern's other instances (which hardware, which billed work) are answerable by attestation at a cost the proof route cannot approach.

## 2.2 Model substitution: settled empirically, against output-based detection

**Cai, Shi, Zhao and Song (arXiv:2504.04715)** audit model substitution in commercial LLM APIs and evaluate the software-only detection routes directly. Statistical tests over outputs are query-intensive and fail against subtle substitutions; log-probability methods are defeated by the inference nondeterminism of production serving. Their conclusion is that software-only methods are fundamentally unreliable, and their recommendation is trusted execution.

This is the strongest available evidence for a claim v0.1 of this paper made without support, and it is stronger than the version v0.1 made — see the correction in §4.1.

## 2.3 Binding execution to a model: done, in research and in production

The construction that ties a served response to specific weights through enclave measurement exists in several forms.

**Optimistic TEE-Rollups (arXiv:2512.20176)** proposes *Proof of Efficient Attribution*: a DCAP quote over hashed query and response plus a nonce, carrying the `MRENCLAVE` of the enclave binary loaded with the target weights, enforced by an on-chain membership check against a registry of admissible measurements. It is embedded in a three-tier architecture — TEE attestation for sub-second provisional finality, an optimistic challenge layer with interactive bisection, and stochastic spot-checks escalating to a full ZK proof with probability ≈0.01 — and it reports $0.07 per query against roughly $45 for the ZKML route, at 0.8 s versus 1200 s for a 7B model.

**Laminator (Duddu, Järvinen, Gunn and Asokan, arXiv:2406.17548)** attests ML property cards with hardware assistance, covering training data, training process, model behaviour and inference properties, the last including the binding of an output to its model and input.

**Tinfoil**, commercially deployed, builds an immutable model image (EROFS with dm-verity) whose hash the TEE checks against the attestation, aborting on mismatch.

Between them, model authenticity and output-to-model binding are solved problems. This paper claims neither.

## 2.4 Canonical model commitments: newly available, not yet a registry

**OpenSSF Model Signing (OMS)**, developed through the OpenSSF AI/ML working group with NVIDIA and HiddenLayer, specifies a manifest listing every file of a model by cryptographic hash — SHA-256 by default, BLAKE2b optional, a flat list rather than a Merkle tree — distributed as a detached Sigstore bundle. Adoption has begun: Cohere signs its Command models on Hugging Face.

This changes what §5.6 of v0.1 could honestly claim, and the correction is recorded there. It also changes what is buildable: a defense against the Hollow-LLM attack requires comparing the weights an enclave actually loaded against a canonical reference, and until recently no such reference was published by anyone. The remaining gap is narrower and more tractable than the one v0.1 described — signatures commit to *files at rest*, not to the tensors resident in a serving process, and no consultable registry exists that a settlement gate can query at decision time.

## 2.5 Composite attestation: converging at the IETF

Attesting a confidential GPU workload requires evidence from two vendors, and the standards work is active: `draft-ietf-rats-multi-verifier` addresses a composite attester needing one verifier from the CPU vendor and another from the GPU vendor; `draft-poirier-rats-eat-da` profiles EAT for trustworthy device assignment; `draft-ffm-rats-cca-token` covers Arm's CCA token. Google Cloud Attestation already emits claims in IETF RATS EAT format.

Our implementation composes an Intel TDX quote with an NVIDIA EAT token bound to the same signing key. That shape is the one the standards are converging on, which is a reason to adopt their vocabulary rather than a reason to claim novelty. §7 maps our verdict onto RATS terms.

## 2.6 The freshness of attestations: where everyone stops

Three observations, which together are the opening this paper takes.

First, **the vendors treat attestations as time-bounded and say so**. Intel's DCAP collateral carries `issueDate` and `nextUpdate` fields and revocation lists with their own validity windows; NVIDIA's remote attestation service retains nonce-to-device-certificate bindings for twenty-four hours specifically to bound replay. Expiry is not an edge case anyone has to invent; it is in the artifacts.

Second, **the systems that settle against attestations do not model it**. Optimistic TEE-Rollups — the most complete design in this space, with an implementation and measured costs — has no treatment of quote expiry windows, revocation lists, or stale-attestation handling anywhere in its architecture, while settling on-chain in under a second on the strength of those quotes.

Third, **when someone did look, they found a gap of exactly this kind**. Sokolov (arXiv:2608.00801; arXiv:2608.03534) composes IETF RATS appraisal with action evidence packages, folding an outcome hash and a fresh appraiser nonce into an attestation-key-signed quote, and resolves three outcomes: attested for a good fresh quote, contested when the measurement is swapped, expired when a stale quote is replayed. Building that third verdict required finding and closing a challenge-nonce freshness gap in Project Veraison's TPM reference schemes. The work is self-described as a feasibility demonstration on emulated hardware rather than a hardware-rooted guarantee.

The reason the gap persists is, we think, disciplinary. Verification of machine learning descends from proof systems, and a proof is timeless: it is as valid a year later as the second it was produced. An attestation is not, and neither is the state it attests. The discipline for reasoning about adversarial staleness was developed somewhere else entirely — in the oracle infrastructure of decentralized finance, where a price that was true four blocks ago is a liability — and the framework this paper specializes was written to import it.

## 2.7 Adjacent work

**VeriLLM (arXiv:2509.24257)** achieves public verifiability for decentralized inference by lightweight re-execution at roughly 1% of inference cost, exploiting the asymmetry between prefill and autoregressive decoding, without a TEE. **TeeRollup (arXiv:2409.14647)** builds a rollup on heterogeneous TEEs under a threat model where TEE integrity *and* availability may fail, with a challenge mechanism for unavailability. **Trusted Compute Units (arXiv:2504.15717)** unifies TEE and zkVM computations under one composable interface. **AEGIS (arXiv:2606.16358)** seals an LLM API router inside an enclave so a client can attest the intermediary that holds its plaintext — the broker role secured on the data path, explicitly not addressing model substitution, billing, or provider policy, and therefore complementary to what a receipt certifies about the provider.

**Unprivileged Topology Certificates (arXiv:2606.24934)** deserves separate mention because it contradicts a claim v0.1 made. It fingerprints cloud GPUs by software alone — per-SM latency maps, memory-hierarchy structure, coarse geolocation — reporting 100% accuracy distinguishing Blackwell dies and median temporal jitter of 0.09 cycles over six-hour runs, with no privileged access and no vendor cooperation, explicitly targeting capacity and model bait-and-switch fraud. The correction it forces is in §4.4.

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

Detection mode: **output-observable in principle, unreliable in practice** — and the practice is now measured.

> **Correction (v0.2).** v0.1 held that a customer or third-party auditor "can in principle detect model substitution by inspecting responses and comparing tokens against a reference," conditional only on a trusted reference existing. That framing was too generous to output-based detection, and it was made without empirical support. Cai, Shi, Zhao and Song (arXiv:2504.04715) evaluated the routes directly: statistical tests over outputs are query-intensive and fail against subtle substitutions, and log-probability methods are defeated by the inference nondeterminism inherent to production serving. Their finding is that software-only detection is *fundamentally unreliable*, and their recommendation is trusted execution.
>
> The correction cuts in our favour, which is a reason to be careful with it rather than pleased about it. v0.1 partitioned the four dimensions 1-vs-3 by detection mode and treated the asymmetry as the central finding. With the evidence in, the honest partition in current practice is **0-vs-4**: not one of the four cheating modalities is reliably detectable from response content. §4.6 is restated accordingly.

Detection therefore requires a reference *and* a channel that does not run through the provider's outputs. Even granting a trusted reference — either a public registry of model commitments, an independently-verified provider, or a held-out baseline — comparison against sampled tokens inherits every nondeterminism the Cai et al. results document. Receipt requirement: a cryptographic commitment to the model weights at request time, produced by the provider's TEE and signed under its attested key, included in the response receipt as `model_attestation`.

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

We name capacity attestation as the fourth dimension for inference. Its definition: the inference call ran on the hardware tier (GPU SKU, driver version, instance configuration) the provider attested to. Its cheating modality: silent hardware downgrade — provider claims premium hardware, charges premium price, runs cheaper hardware, returns correct content. Its detection mode: **attestation-required from the position of an API customer** — content is not a function of hardware tier when the model is held constant, so no inspection of the response recovers the tier. Statistical analysis across many calls yields indirect evidence at best (latency distributions inconsistent with the claimed tier), needs far more data than a single-call verification, and is fragile to network jitter and provider-side caching.

> **Correction (v0.2).** v0.1 stated the attestation requirement categorically. It is not categorical, and the counterexample is published: Alpay and Alpay (arXiv:2606.24934) fingerprint cloud GPUs by software alone, using CUDA probes over per-SM latency maps and memory-hierarchy structure, and report 100% accuracy distinguishing Blackwell dies with median temporal jitter of 0.09 cycles over six-hour runs, plus coarse geolocation against RIPE Atlas probes. They target precisely this fraud — capacity and model bait-and-switch — with no privileged access and no vendor cooperation.
>
> The claim survives in narrowed form, and the narrowing is the interesting part. Their probes execute **inside the machine under test**. That serves a *tenant* who has rented a GPU and wants to know what they got. It does not serve the *customer of an inference API*, who cannot execute CUDA on the provider's node and receives only tokens. The two settings are different, and this paper addresses the second.
>
> The methods also compose better than they compete. A topology certificate produced *inside the enclave* and carried by an attested receipt would give a capacity claim grounded in physical measurement rather than in a vendor's word about its own SKU — hardening the dimension against exactly the failure mode §6.2 names, a vendor whose attestation says what the vendor wants. We record that as future work in §10 rather than claiming it here.

Receipt requirement: a TEE quote claiming GPU SKU and driver version, separately attested from the model commitment. Concretely, this is a hardware attestation issued by the provider's confidential-computing infrastructure (Intel SGX, NVIDIA Confidential Computing, AMD SEV-SNP) and included in the receipt as `hardware_attestation`. The trust root reduces to the TEE attestation chain, which we discuss in §6.

The reason this dimension matters operationally is that a correctness proof is silent about it. zkML systems prove the computation was performed correctly given the inputs and the model; they do not prove it was performed on the hardware the customer paid for. A zk-proof produced on an A10 is indistinguishable from one produced on an H100 when the computation yields the same result.

This is the same structure Gong, Liu and Li name as the **effort gap** (arXiv:2607.28884): a correctness proof does not bind the resources expended to produce the output. They demonstrate it along the weights axis — ghost weights that satisfy the verification circuit while collapsing effective computation — and we observe it along the hardware axis. Their formalization is the general statement and is theirs; what follows from it here is that the axis a proof cannot see is exactly the axis attestation can, at a cost the proof route cannot approach. Their paper asks for protections binding correctness to verifiable computational work and offers none; §7.5 gives one that is buildable today, and says why it was not buildable eighteen months ago.

## 4.5 Request integrity (`f_req`) — rename of v0.6's `f_i`

The fourth v0.6 dimension was input freshness — the property that the input to a computation was new at the time of execution, not a stale-cached artifact. In a training context this is meaningful because data freshness affects model behavior, and the temporal axis is operationally relevant.

In inference, the analogous property is not temporal. The operationally-relevant question is whether the user's input was delivered to the model as the user submitted it, without upstream transformation. This includes: prompt sanitization (the provider edits or re-templates the prompt before forwarding to the model), system-prompt injection (the provider prepends instructions the user did not author), retrieval substitution (the provider replaces or augments the user-supplied context with material the user did not request), and tokenizer-mediated transformations (the provider applies a tokenizer that materially differs from the canonical one for the model).

These are integrity violations of the request, not freshness violations of the input. We therefore rename this dimension *request integrity* (`f_req`) rather than carrying the inaccurate "freshness" label. We deliberately avoid the alternative name "channel integrity" because in cryptographic literature *channel integrity* refers to transport-layer security (TLS), which is a distinct concern.

Detection mode: **attestation-required**. A transformed input produces different output, but only the provider knows what the original input was. From response content alone, the customer cannot distinguish "input was transformed upstream" from "model was substituted", "quantization was changed", or "any other source of output difference". The detection requires a receipt field that commits to a canonical hash of the input the model actually received: the customer computes `hash(prompt_submitted)` themselves, compares against the receipt's `input_attestation`, and the comparison either matches (request integrity preserved) or does not (request was transformed). The canonicalization rule must be specified explicitly to make this comparison meaningful; we address the specification in §5.

Receipt requirement: hash of canonical input, included as `input_attestation`.

## 4.6 The partition, restated

| Dimension | Origin | Detection from response content | Cheating modality |
|---|---|---|---|
| Model (`f_m`) | refinement of v0.6 `f_m` | In principle yes; **unreliable in practice** (arXiv:2504.04715) | Model substitution |
| Settlement (`f_s`) | refinement of v0.6 `f_s` | **No** | Token billing asymmetry |
| Request integrity (`f_req`) | rename of v0.6 `f_i` | **No** | Upstream input transformation |
| Capacity (`f_cap`) | new — no v0.6 origin | **No**, from the customer's position (arXiv:2606.24934 from the tenant's) | Hardware tier downgrade |

> **Correction (v0.2).** v0.1 called the 1-vs-3 partition "the central conceptual contribution of this paper." Two things changed. Empirically, the partition is **0-vs-4** in current practice: with output-based model-substitution detection measured and found unreliable, no cheating modality here is reliably detectable from response content. And structurally, the categorization is no longer a contribution to claim — the surrounding literature reached the same operating conclusion independently and from four directions (§2.2 for models, §2.1 for effort, the billing-audit line for tokens, §2.7 for capacity), each arriving at attestation as the answer.

What survives from v0.1's §4, and is worth keeping, is the decomposition itself: four *separately attestable* dimensions with distinct cheating modalities and distinct receipt fields, none reducible to another. That decomposition is what makes a per-dimension verdict possible (§7.3), and a per-dimension verdict is what a market with heterogeneous supply actually needs. The lower bound stands and is now unanimous: any framework addressing these modalities includes an attestation layer.

The open question the literature does not answer — and §7 does — is what happens when that attestation layer is *stale*.

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
    pub request_id: Hash32,
    pub timestamp_anchor: TripleAnchor,
    pub output_attestation: Hash32,
    pub public_key: [u8; 32],      // also the handle to the key epoch's attestation
    pub signature: [u8; 64],

    // -------- dimension-implementing fields --------
    pub model_attestation: Hash32,         // implements f_m
    pub input_attestation: Hash32,         // implements f_req
    pub billing_attestation: TokenCounts,  // implements f_s
}

pub struct TripleAnchor {
    pub block_height: u64,
    pub tee_timestamp: u128,
    pub drand_round: u64,
}

pub struct TokenCounts {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub reasoning_tokens: u32,  // separately disclosed for reasoning models
    pub billed_tokens: u32,     // what the customer is charged for
}
```

> **Correction (v0.2).** v0.1 carried a `hardware_attestation: TeeQuote` field inside the receipt and sized the whole artifact at "roughly 512-1024 bytes depending on the size of the TEE quote (which dominates)." Building it showed the estimate to be impossible: the TDX quote in our test vector is **5,006 bytes on its own**, before an NVIDIA EAT bundle. Attaching that to every response means kilobytes of *identical* bytes on every call for as long as the node's key lives.
>
> The field is therefore gone, and `f_cap` is implemented differently: hardware evidence is verified **once per key epoch**, yielding an `AttestedIdentity`, and the receipt carries only the `public_key` that evidence bound. A verifier fetches the evidence once and validates an unbounded number of receipts against it. The guarantee is unchanged — the quote commits to the key, the key signs the receipts — and the per-response cost drops to one Ed25519 signature. §7 develops the consequence that makes this more than an optimization: an epoch has a lifetime, and a lifetime can expire.
>
> A second reason emerged from the same build. Quote bytes carry trailing padding outside every length-delimited field the parser reads, so two different byte strings verify to one identical report. Any scheme identifying an attestation by hashing its raw bytes therefore admits unbounded identifiers for one attestation. Identity belongs on the key the attestation bound, which is what the revised design does.

The struct is 272 bytes of fixed-width fields. The receipt is intended to be returned as an HTTP response header (`X-Inference-Receipt`) for non-streaming endpoints and as a final SSE event for streaming endpoints, with the epoch's attestation bundle fetched separately and cached. In both cases it is optional from the customer's perspective: a customer that does not request or parse it pays no cost.

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

The `model_attestation` field commits to a Merkle root over the model weights the provider's TEE saw at request time. A customer collecting receipts from a single provider can verify whether that root is invariant across calls (consistent serving) and detect substitution (root changes silently).

> **Correction (v0.2).** v0.1 stated that "no canonical Merkle root for that model is currently published by any model creator," that extending from consistency to correctness would require either commitment standards adopted by model creators or a public registry of canonical attestations, and that "neither exists at the time of writing." The first half of that is no longer true.
>
> **OpenSSF Model Signing (OMS)** — developed through the OpenSSF AI/ML working group with NVIDIA and HiddenLayer — specifies exactly such a commitment standard: a manifest listing every file of a model by cryptographic hash, distributed as a detached Sigstore bundle. Adoption has started; Cohere signs its Command models on Hugging Face. A claim that the standard does not exist would not survive a reviewer with a search engine, and it should not.

The gap is narrower than v0.1 described, and stating it precisely is what makes it actionable. Two things separate a signed model artifact from a canonical reference a settlement gate can use:

**Files at rest are not tensors in memory.** An OMS manifest commits to the files a publisher released. What a receipt needs to compare against is what the serving process actually loaded — after format conversion, quantization, sharding, and whatever the runtime did on the way. A provider can serve a truthfully-signed artifact and still load something else, and a provider serving honestly may produce a root that differs from the file hashes for entirely legitimate reasons. Bridging that requires the enclave to commit to its loaded weights in a form derivable from the signed manifest, which is an engineering requirement on serving runtimes, not on publishers.

**A signature is not a registry.** Verification at settlement time needs a lookup — "is this the canonical root for the model named in this receipt, as of now?" — answerable without contacting the party being audited. Signatures distributed alongside model files do not provide that. Our companion implementation takes the deliberately conservative route here: an M-of-N quorum of registered publishers signing a canonical model lineage, so that adopting a lineage requires agreement among distinct parties rather than trust in one. OMS bundles are the natural input to such a quorum rather than a replacement for it.

Until both hold, the receipt's contribution to the model dimension is bounded but real: it makes silent substitution by a single provider observable, while leaving absolute model identity to the infrastructure now under construction. §7.5 shows why closing this specific gap is worth more than it looks — it is what turns the receipt into a defense against the effort gap rather than only a record of it.

## 5.7 Storage and overhead

The performance cost of receipts is small relative to inference itself, and v0.2 replaces v0.1's estimates with measurements.

> **Correction (v0.2).** v0.1 estimated 5–15 ms to sign and 3–8 ms to verify, "single-digit milliseconds." The measured figures are two to three orders of magnitude lower. The qualitative claim — the overhead is in the noise — held; the numbers did not, and estimates presented in a paper get quoted as if measured.

Measured on the reference implementation (release build, mean of 2,000 iterations, AMD Ryzen 7 9800X3D), against a real inference server:

| Quantity | Measured |
|---|---|
| Receipt, on the wire | **272 bytes** (fixed-width struct) |
| Receipt, naive JSON encoding | 1,106 bytes |
| Sign (provider side) | **11–13 µs** |
| Verify (customer side, all dimensions) | **27–39 µs** |
| Combined overhead against a 1.0 s inference | **0.004 %** |

Two notes on method. The JSON figure is an artifact worth naming: `serde_json` renders a byte array as a list of decimal integers, so a JSON measurement varies with the *values* of the bytes rather than the structure of the receipt — a size test written against JSON measures its own fixture. And the verification figure covers the per-response path only; the per-epoch attestation verification (DCAP chain plus EAT token) is amortized across every receipt in the epoch and is measured separately in §7.6.

Storage on the customer side is linear in call count: at 272 bytes, a deployment making a million calls a day accumulates 272 MB a day of receipts, and one epoch's attestation bundle regardless of volume.

For calibration against the alternative: the cheapest cryptographic route to a comparable per-response guarantee is reported at $0.07 per query and 0.8 s of added latency in a TEE-plus-optimistic design (arXiv:2512.20176), and at roughly $45 and 1,200 s for the pure ZKML route on a 7B model. The receipt occupies a different order of magnitude, and buys a strictly weaker guarantee — conditional on the attestation chain, as §6 insists.

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

# §7 · Attestation Lifecycle and Freshness-Gated Settlement

This is the contribution. Everything before it is setting.

## 7.1 An attestation is a statement about a moment

The artifacts say so themselves. Intel's DCAP collateral — the TCB information, the QE identity, the certificate revocation lists a verifier needs — carries `issueDate` and `nextUpdate` fields, and the CRLs have their own validity windows; verification against collateral outside its window fails, as it should. NVIDIA's remote attestation service retains the binding between a challenge nonce and a device certificate hash for twenty-four hours, explicitly to bound replay. Hardware is reprovisioned, firmware is patched, TCB levels are revoked, and a platform that was known-good in March is on an advisory list in August.

Every party in the chain treats the attestation as perishable except the one that pays against it.

## 7.2 The rent-once attack

Make it concrete. An operator wants to sell inference at the price of an H100 tier without owning an H100.

They rent one for an hour. Inside the confidential VM, they generate a signing key and obtain a CPU quote and a GPU attestation token that both commit to it — honestly, correctly, with genuine hardware, passing every check any verifier in §2 performs. They copy out the key and the two attestation artifacts. They return the rented machine.

Then they serve from an A10 they own, signing every response with that key. The signature verifies. The quote verifies, against Intel's chain, with a valid TCB status. The GPU token verifies against the vendor's published keys, claims `HOPPER H100`, and answers a nonce derived from precisely this key. Every dimension a receipt reports comes back established. Nothing in the architectures surveyed in §2 flags anything, because nothing in them asks how old the evidence is.

The economics are the point. At roughly $2.50 per GPU-hour for attested capacity, the attack costs one hour of honest rent and then sells months of dishonest capacity. It is not exotic, it requires no compromise of any TEE, no side channel, no vendor collusion — only patience and a copy operation. And a marketplace, which is what this paper is ultimately about, is precisely the venue that makes it worth doing at scale.

The defense is not cryptographic. It is temporal, and it is cheap.

## 7.3 The key epoch

A node's signing key has a lifetime, and the attestation that binds it defines that lifetime rather than merely preceding it. We formalize the artifact a verifier holds:

> **Attested identity.** `A = (pk, img, gpu, t_att, Δ_max)`, where `pk` is the Ed25519 verifying key both attestations commit to, `img` is the label of the CPU TD image matched against the known-good registry, `gpu` is the hardware model **pinned** by the verification policy (absent if the policy merely reported it), `t_att` is the wall-clock instant of attestation, and `Δ_max` is the age budget the relying party grants it.
>
> **Attestation freshness.** `fresh_att(A, now) := t_att ≤ now ∧ (now − t_att) ≤ Δ_max`.

Both quotes must commit to the same `pk` — `report_data[0..32]` on the Intel side, the 32-byte challenge nonce on the NVIDIA side, both equal to `SHA-256(domain ‖ pk)` — which is what makes one identity out of two vendors' evidence, and what makes a quote lifted from another machine useless: it commits to a key the thief does not hold.

Against the rent-once attack, `Δ_max` is the whole defense, and its effect is economic rather than cryptographic. Setting `Δ_max` to one hour forces the operator to hold attested hardware continuously in order to keep selling attested capacity. **Freshness converts the attestation from a one-time purchase into a recurring cost equal to the cost of the resource being attested.** That is the sentence this paper exists to say. An attestation that never expires is a claim about hardware someone used to have.

## 7.4 The verdict, and why it is not a boolean

A settlement gate consuming a receipt `R` and an identity `A` at time `now` returns, per dimension, one of three outcomes:

- **Established** — the dimension's claim was checked and holds.
- **Contradicted** — the claim was checked and fails. Evidence of cheating or of a broken node.
- **Unestablished** — the receipt cannot speak to it, with the missing ingredient named.

`Capacity` is established only when `fresh_att(A, now)` holds, `A.pk` equals the receipt's signing key, `img` is present, and `gpu` is pinned. A stale attestation yields **contradicted**, not unestablished: the node made a hardware claim and the evidence for it has expired, which is different from never having made one. A best-effort node with no attestation yields **unestablished**: it claimed nothing and broke nothing.

The distinction is load-bearing for a market with heterogeneous supply, and it is the reason the interface offers no `is_valid()`. A helper like that would be used, and using it would collapse a three-state verdict across four dimensions into one bit — which is exactly how cheap capacity comes to look like expensive capacity. The temptation is removed from the API rather than documented in a footnote.

In IETF RATS vocabulary (RFC 9334): the quote and token are **Evidence**, the measurement registry and claim policy and `Δ_max` together are the **Appraisal Policy**, the per-dimension verdict is the **Attestation Result**, and the settlement gate is the **Relying Party**. We adopt the terms rather than coining our own; the composition of CPU-vendor and GPU-vendor verifiers our implementation performs is the shape `draft-ietf-rats-multi-verifier` describes.

## 7.5 A defense for the effort gap, buildable now

Gong, Liu and Li close their attack by asking for protections that bind correctness to verifiable computational work. Here is one, assembled from parts that exist.

The Hollow-LLM attack works because a ZK circuit proves consistency with *some* committed private weights, and ghost weights are weights. Every step of the attack survives verification because nothing in the protocol compares the committed weights against an external notion of which weights were supposed to be there.

An attested receipt closes that comparison in two moves. The enclave's measurement registry (§7.3's `img`) fixes *what software* holds the signing key, so the `model_attestation` in a receipt is produced by a known serving binary rather than by an adversary's convenience. And the `model_attestation` itself is checked not for self-consistency but against a **canonical lineage adopted by an M-of-N quorum of registered publishers** — so ghost weights, being different weights, produce a root off the lineage and are rejected before settlement rather than proven correct.

Two honest boundaries. If the *publisher* of the canonical lineage is the one who hollowed the model, no registry helps; that is a supply-chain compromise, not a serving-time substitution, and it wants a different mechanism. And the quorum's guarantee is exactly the honesty of M distinct publishers, which is an assumption we state rather than remove.

What makes this newly buildable is §2.4: eighteen months ago there was no published commitment over any commercial model's weights to compare against. There is now a standard and the beginning of adoption. The registry piece — a lookup answerable at settlement time without contacting the audited party — is what remains, and it is a coordination problem rather than a research one.

## 7.6 Reference implementation

The companion crate implements the above behind two feature flags, with the default build unchanged for consumers who want the types and none of the dependencies.

**CPU (`--features tee-tdx`).** Intel TDX quote verification through `dcap-qvl` in pure Rust, offline: collateral is supplied by the caller, so verification performs no I/O at settlement time. The gate enforces platform TCB status with a strict default — `UpToDate` only, and `Revoked` cannot be whitelisted through configuration — and matches `MRTD` plus optionally-pinned `RTMR0..3` against a known-good registry. **An empty registry rejects every quote**; a verifier that accepts any measurement retains the cryptography and discards its meaning.

**GPU (`--features tee-nvidia`).** NVIDIA EAT (RFC 9711) token verification: ECDSA over P-384 with SHA-384 against the issuer's published keys, then a claim policy over `secboot`, `dbgstat`, `measres`, the driver and VBIOS RIM signature-verification claims, and `hwmodel` pinning. ES384 is fixed by construction rather than read from the token header — the issuer's JWKS publishes `kty`, `crv`, `kid` and `x5c` but **no `alg`**, so algorithm agility here would reintroduce the classic JWT confusion hole, `alg: none` included. Missing claims fail closed: an issuer that does not state secure-boot status has not stated that secure boot is on.

**Measurements against real hardware evidence.** The suite verifies a genuine Intel TDX quote against genuine collateral — not a quote this implementation generated, which would prove only that its encoder and decoder agree. Tests cover the accepting path under the strict TCB default, refusal of a cryptographically perfect quote whose measurement is unregistered, refusal under a TCB policy that excludes the platform's status, refusal outside the collateral's validity window, and refusal of the key binding for a key the quote never committed to. Per-response costs are in §5.7; the per-epoch attestation verification is amortized across every receipt the epoch covers.

**The seam we did not paper over.** The vendored quote was produced by another party's machine for another party's key, so the *successful* key binding — a node's own quote committing to its own key — is the one step no test here can exercise. It requires a rented confidential VM. Every test that could be run without one was run; the test that could not is named in the file rather than simulated. A comparable recent effort (arXiv:2608.00801) states the same boundary in the other direction, being a feasibility demonstration on emulated hardware; the difference is which half is real.

## 7.7 What this does not close

The attestation binds a key to a measured image running on attested hardware. It does not prove that any particular token was produced by the GPU inside that image. The registry narrows the gap — if the only registered image is the published serving binary, then the only software that can reach the key is that binary — but narrowing depends on what the registered image can be made to do, which is an argument about the image and not about this construction. An operator whose measured image is a bare signing service attests honestly and computes wherever it likes.

We state this as loudly as the capability, because it is the boundary a reader is most likely to assume away.

---

# §8 · Empirical Illustration — *forthcoming, depends on cross-provider benchmark sweep*

> Thesis (per outline §8): A cross-provider benchmark of Qwen3 14B illustrates the operator's epistemic problem: today's price-per-token figure does not specify what was actually being served, and customers cannot detect substitution from outside.
>
> Status: A companion benchmark study (in private development) has the local consumer-tier baseline complete (RTX 5070, 9 cells, methodology documented). The cloud sweep across at least one provider is required before §8 is written. Findings will be reported inline when the study is complete. Seven paragraphs scaffolded.

---

# §9 · Limitations

Six, stated plainly. The first two are inherited, the next three were found by building and running the thing, and the last is about this paper rather than the construction.

**The trust root is the vendor attestation chain.** Everything here is conditional on Intel and NVIDIA signing honestly and on their platforms resisting the side-channel classes that periodically break them (§6.2, §6.5). We do not remove that dependency; we localize it.

**The signing-oracle gap is narrowed, not closed** (§7.7). The construction proves which key, in which image, on which hardware — not which tokens.

**The receipt cannot distinguish under-disclosure from cheating.** Running the receipt path against a real serving runtime surfaced this. A reasoning model generated 64 tokens of which zero were visible to the customer, and the runtime reported a single aggregate count with no reasoning/response split available through its API. A node integrating receipts naively therefore files reasoning as completion tokens, the customer's own count contradicts the receipt, and the verifier reports a settlement failure — correctly, in that the numbers disagree, and misleadingly, in that nothing dishonest occurred. Distinguishing the two requires per-channel token disclosure from the serving runtime, which we name as an ecosystem requirement in §10 alongside the model registry. Attempting to recover the split externally is biased: re-tokenizing the reasoning text through the same model returned 76 tokens against 64 actually generated, because the re-submission carries the chat template's own tokens.

**The successful key-binding path is untested against hardware we control** (§7.6). One rented confidential VM closes it.

**Coverage is Intel TDX plus NVIDIA CC.** AMD SEV-SNP is absent, which excludes the largest hyperscaler confidential-GPU SKU — Azure's NCCads H100 v5 runs on EPYC Genoa, not on TDX, a fact worth stating because at least one secondary source claims otherwise. The verifier interface accommodates an SEV-SNP adapter; nobody has written it.

**Review discipline.** The heart sections carry seven rounds of adversarial review from v0.1. The material new in v0.2 — §2, §7, and the corrections — has had one author and one pass. The prior-art scan behind §2 was verified entry by entry against primary sources and is reproducible from `RESEARCH-LANDSCAPE-attested-inference.md`, but a scan that finds what it went looking for is a known failure mode, and independent replication of the "unoccupied" claim in §2.6 is welcome and specifically invited.

---

# §10 · Future Work

**Close the hardware seam.** One rented confidential VM, a node requesting a quote over its own key, and §7.6's named gap disappears. This is procurement, not research, and it is the next thing we do.

**A queryable canonical-model registry.** Model signing exists (§2.4); a lookup a settlement gate can perform at decision time, without contacting the party being audited, does not. Our quorum construction is the conservative shape — M of N registered publishers agreeing on a lineage — and consuming OMS bundles as its input is the obvious bridge. This is coordination work, and whoever operates a marketplace is the natural party to do it, since they are the one who needs the answer.

**Per-channel token disclosure from serving runtimes.** §9's third limitation is not fixable inside the receipt. Runtimes that separate reasoning from response in their usage reporting would make honest billing disclosure possible; runtimes that do not, make it impossible to distinguish an honest node from a dishonest one. This is a small ask of a small number of projects, and it is worth making directly.

**Topology certificates inside the enclave.** Alpay and Alpay's software-only GPU fingerprinting (§2.7) grounds a capacity claim in physical measurement rather than in a vendor's assertion about its own SKU. Executed inside the TD and carried by an attested receipt, it would harden `f_cap` against the failure mode §6.2 names — a vendor attesting what it prefers. The composition is straightforward and unbuilt.

**Calibrating `Δ_max`.** §7.3 argues that the age budget converts attestation into a recurring cost matched to the attested resource. What the budget should actually be is an empirical question with an economic answer: too tight and honest nodes churn attestations for nothing, too loose and the rent-once attack becomes profitable again. The tradeoff is quantifiable given rental prices and re-attestation latency, and we have not quantified it.

**AMD SEV-SNP.** An adapter behind the existing verifier interface, which would bring Azure's confidential GPU SKU into scope.

**Dispute mechanics.** Unchanged from v0.1: the receipt is evidence, and what a customer does with evidence — smart-contract escrow, contractual enforcement, third-party arbitration — remains deliberately out of scope. §7's settlement predicate is the hook such a mechanism would attach to.

---

# §11 · Conclusion — *forthcoming*

> Three hundred words scaffolded. Summary of the framework specialization, position in the design landscape between zkML and pure trust-the-provider, and pointer to what the work needs next from the ecosystem (independent replication, model-creator commitment standards, real-provider validation).

---

# §12 · References

Assembled under the standing anti-hallucination rule (see [`CASE-V0.7-EXTENSION.md`](CASE-V0.7-EXTENSION.md) §7): every entry below marked **[V]** was opened at its primary source on 2026-08-19 and checked for identifier, title, author list and date before being written here. Entries marked **[U]** are carried over from v0.1 and have **not** been re-verified in this pass; they must be checked before any public revision, and no claim in v0.2 rests on them.

**[V]** Gong, C., Liu, B., Li, M. *Hollow-LLM Attack: Computationally Trivial Weights in Zero-Knowledge Verification of LLM Inference.* arXiv:2607.28884, 30 Jul 2026. Comments field: accepted to IEEE S&P 2026.

**[V]** Cai, W., Shi, T., Zhao, X., Song, D. *Are You Getting What You Pay For? Auditing Model Substitution in LLM APIs.* arXiv:2504.04715, 7 Apr 2025 (rev. 29 Sep 2025).

**[V]** Duddu, V., Järvinen, O., Gunn, L. J., Asokan, N. *Laminator: Verifiable ML Property Cards using Hardware-assisted Attestations.* arXiv:2406.17548, 25 Jun 2024 (rev. 5 Mar 2025).

**[V]** Chan, A., Ding, A., Chen, F., Wu, A., Zhang, B. *Optimistic TEE-Rollups: A Hybrid Architecture for Scalable and Verifiable Generative AI Inference on Blockchain.* arXiv:2512.20176, 23 Dec 2025.

**[V]** Hoque, S., Zhang, J., Sun, J., Suya, F. *Token Inflation: How Dishonest Providers Can Overcharge for Large Language Model Usage.* arXiv:2605.30040, 28 May 2026.

**[V]** Alpay, F., Alpay, T. *Unprivileged Topology Certificates for Cloud GPU Attestation.* arXiv:2606.24934, 22 Jun 2026.

**[V]** Xie, S., Wu, Q., Lu, H., Sun, Z., Wu, Q., Qin, B., Wang, Q. *The Proxy Knows Too Much: Sealing LLM API Routers with Attested TEEs.* arXiv:2606.16358, 15 Jun 2026.

**[V]** Sokolov, A. *Hardware-rooted attestation for AI-agent evidence: composing IETF RATS with action evidence packages.* arXiv:2608.00801, 1 Aug 2026.

**[V]** Sokolov, A. *A Challenge-Nonce Freshness Gap in Project Veraison's TPM Reference Schemes, Found by Appraising Application-Layer Action Evidence End-to-End.* arXiv:2608.03534, 4 Aug 2026.

**[V]** Wang, K., Zhao, Z., Song, X., Li, Z., Xia, L., Tong, C., Shi, B., Qu, W., Yang, E., Ai, L. *VeriLLM: A Lightweight Framework for Publicly Verifiable Decentralized Inference.* arXiv:2509.24257, 29 Sep 2025 (rev. 22 Jan 2026).

**[V]** Wen, X., Feng, Q., Lyu, H., Niu, J., Zhang, Y., Feng, C. *TeeRollup: Efficient Rollup Design Using Heterogeneous TEE.* arXiv:2409.14647, 23 Sep 2024.

**[V]** Castillo, F., Heiss, J., Werner, S., Tai, S. *Trusted Compute Units: A Framework for Chained Verifiable Computations.* arXiv:2504.15717, 22 Apr 2025.

**[V]** Sun, H., et al. *zkLLM: Zero Knowledge Proofs for Large Language Models.* arXiv:2404.16109.

**[V]** Zhu, J., Yin, H., Deng, P., Almeida, A., Zhou, S. *Confidential Computing on NVIDIA Hopper GPUs: A Performance Benchmark Study.* arXiv:2409.03992, 6 Sep 2024 (rev. 5 Nov 2024).

**[V]** OpenSSF AI/ML Working Group. *OpenSSF Model Signing (OMS) Specification*, `github.com/ossf/model-signing-spec`, version 1.

**[V]** IETF RATS Working Group. RFC 9334, *Remote ATtestation procedureS (RATS) Architecture*; `draft-ietf-rats-multi-verifier`; `draft-poirier-rats-eat-da`.

**[U]** Ong, J., et al. *TOPLOC.* arXiv:2501.16007 — cited in v0.1 for the attention-implementation and precision-mode attack vectors. **Not re-verified.**

**[U]** *Verifiable Dropout.* arXiv:2512.22526 — cited in v0.1's §2 scaffold. **Not re-verified.**

**[U]** SgxPectre; ÆPIC Leak — side-channel disclosures named in §6.2. **Citations not yet assembled.**

**[V]** Maisu, J. C. *Proof-of-Context: The Missing Verification Layer in Decentralized ML Protocols*, v0.9.1 (self-citation, framework paper).

**[V]** Maisu, J. C. *Proof of Context applied to Verifiable Inference*, v0.1-pre1, 27 Apr 2026 (self-citation, superseded by this document).

---

## Version, status, and review history

This is **PoC-Inference v0.2, working draft pre-1**, revised 2026-08-19. It supersedes v0.1-pre1 (2026-04-27), which remains in the repository unaltered as a dated artifact.

**What v0.2 changed.** The thesis rotated from "a receipt-based dispute layer" to **freshness-gated settlement**, after a prior-art scan established that receipts over TEE-attested inference are occupied ground and that attestation lifecycle is not (§2, and `RESEARCH-LANDSCAPE-attested-inference.md` for the full scan). §2 was written from nothing. §7 is new and is the contribution. Five corrections were applied in place and marked as corrections rather than silently edited: §4.1 and §4.6 (the partition is 0-vs-4, with evidence), §4.4 (capacity has a software-only counterexample from the tenant's position), §5.2 and §5.7 (attestation is epoch-scoped, not per-receipt; estimates replaced by measurements), §5.6 (canonical model commitments now exist). §9 and §10 were written. §12 now separates verified from unverified references.

**What v0.2 still owes.** §1, §3, §8 and §11 remain scaffolded in the v0.1 outline. §8's empirical section is the largest gap: the measurements in §5.7 and §7.6 are ours and reproducible, but a cross-provider study of real commercial endpoints has not been run.

---

### Superseded status of v0.1

Below this line, the v0.1 record is preserved for provenance.

This was **PoC-Inference v0.1, working draft pre-1**. Published 2026-04-27.

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
