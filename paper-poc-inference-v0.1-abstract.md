# Proof of Context applied to Verifiable Inference

## A receipt-based dispute layer over TEE-attested commercial inference (PoC-Inference v0.1)

**Author:** Juan Cruz Maisu — Buenos Aires, Argentina · [github.com/Jc-asastu](https://github.com/Jc-asastu)
**Status:** working draft, target v0.1 publication
**Length target:** ~7,000-8,000 words
**Companion artifact:** [`proof-of-context-impl`](https://github.com/Jc-asastu/proof-of-context-impl) crate, Phase 3

---

## Abstract

Commercial inference-as-a-service generates billions in revenue annually, yet customers have no first-party mechanism to verify that the model, hardware, or computation they paid for matches what was delivered. The receipts customers receive — token counts, model names, latency figures, billing line items — are self-reports issued by the same party that benefits from any discrepancy.

This paper specializes the **Proof of Context** framework (Maisu, 2026) to the inference setting and proposes a receipt-based dispute layer that sits on top of TEE-attested commercial inference. Its central, falsifiable claim: *for the marginal customer choosing between commercial providers, a receipt-based dispute mechanism is orders of magnitude cheaper than cryptographic proof of inference, and sufficient to resolve the cheating modalities that empirically occur in commercial deployments — provided the underlying TEE attestation chain is intact*.

We find that the four freshness dimensions of v0.6 specialize asymmetrically to inference. One collapses: computational freshness reduces to model freshness along the model-content axis, because at greedy or low-temperature decoding the same model weights produce the same output content regardless of hardware tier — leaving capacity substitution (a different axis entirely) requiring a new dimension to capture it. One renames: input freshness is more accurately request integrity, a non-temporal property of the input channel. One emerges: capacity attestation, the hardware-tier claim that is observable only via attestation, not via output. The result is four dimensions for inference, partitioning asymmetrically by detection mode — only model freshness is even potentially output-observable (and that observability is itself conditional on canonical-reference infrastructure that does not yet exist), while the remaining three (settlement freshness, request integrity, capacity attestation) are strictly attestation-required. This 1-vs-3 partition is itself the central conceptual contribution.

The technical contribution is a concrete `InferenceReceipt` construction extending the v0.6 execution-context root, paired with a Rust reference implementation in the `proof-of-context-impl` crate (Phase 3). Empirical cost data from a cross-provider Qwen3 14B benchmark illustrates the operationally underspecified nature of today's price-per-token figure when the model variant, hardware tier, and request handling are not separately attested.

We are explicit about scope and dependencies. The receipt format detects **consistency** (same model served across calls by the same provider) cheaply; detecting **correctness** (the model is in fact what was named) requires either model-creator-published commitment standards or a public registry of canonical attestations — neither of which exists today, and which we name as required ecosystem infrastructure. The framework's trust root is the underlying TEE attestation chain. Cryptographic completeness (zkML's domain), full dispute-system design, and direct empirical evidence of cheating modalities are out of scope and named as such.

---

## Keywords

decentralized machine learning · inference attestation · trusted execution environment · economic verification · receipt-based dispute · operator infrastructure · Qwen · GPU cloud benchmarks
