# Outline — PoC-Inference v0.1

> **Use:** working outline. Each section has thesis statement, paragraph topics, target word count, and connection notes. Writing the actual paper from this outline becomes paragraph-level work, not structural-design work.

> **Reading order for review:** start with §1, §4, §5 — those carry the central claims. §2-§3 set up. §6-§7 ground the construction. §8-§9-§10-§11 close honestly.

> **Total target:** ~7,000-8,000 words (excluding references)

---

## §1 · Introduction (~600 words)

**Thesis statement:** Commercial inference is sold by trust, not by verification, and the customer's epistemic position is structurally weaker than the provider's — but the gap is repairable with a receipt format and a dispute layer that costs orders of magnitude less than cryptographic proof.

**Paragraph topics:**
1. The scale of commercial inference (hard numbers: market size, providers, model proliferation). Why this is no longer a curiosity but a structural commercial dependency.
2. The asymmetry of information at the API boundary: what the customer sees (response, billing line, latency) vs what they need to verify (model used, hardware tier, input handling, settlement honesty).
3. The two existing approaches in the literature: zero-knowledge inference proofs (cryptographic completeness, high cost) and pure trust-the-provider (low cost, no recourse). Both are extremes; neither is what most operators need.
4. The position this paper takes: the middle is occupied by **receipts + disputes**, modeled on the v0.6 Proof of Context framework, specialized for inference.
5. Roadmap of the paper.

**Connections:** sets up §2 (which surveys the two extremes), §4 (which derives the receipt structure), §6 (which makes the trust assumptions explicit).

---

## §2 · Background and Prior Art (~800 words)

**Thesis statement:** Inference verification sits between two well-developed but operationally awkward extremes — cryptographic proof systems on one side, TEE attestation chains on the other — and existing work has mostly contributed to one of those extremes rather than to the operator-facing middle.

**Paragraph topics:**
1. **Cryptographic proof of inference (zkML)** — EZKL, Giza, Lagrange's DeepProve. What they provide (computational completeness over claimed program). What they cost (orders of magnitude latency, model architecture restrictions). When they are appropriate (high-stakes regulated settings, public goods).
2. **TEE-based inference attestation** — Intel SGX, NVIDIA Confidential Computing, AMD SEV-SNP. What they provide (hardware-rooted statements about what code ran in a sealed enclave). What they assume (vendor honesty, no side-channel leak, no firmware compromise). What they don't address (whether the receipt format on top of the attestation is meaningful to operators).
3. **Locality-based verification** — TOPLOC (Prime Intellect, arXiv:2501.16007). What it provides (probabilistic verification of LLM inference via locality-sensitive hashing). Where it sits in the design space (low-cost verification with weaker formal guarantees).
4. **Verifiable Dropout** (arXiv:2512.22526) — context-binding precedent that this paper builds on for the input-handling discussion.
5. **The PoC v0.6 framework** — brief summary of what v0.6 contributed (four freshness dimensions, execution-context root, triple-anchor construction). Pointer to the original paper for deeper reading. Note that v0.6 was framed for distributed ML training and marketplace-grade attestation; v0.1 of this applied paper specializes that framework to a different setting.
6. **What is missing from the literature** — operator-facing primitives that compose with TEE attestation to produce receipts customers can dispute economically. This paper fills that specific gap.

**Connections:** §3 sets up the inference-specific problem. §4 derives the framework specialization. §6 names the TEE assumption explicitly.

---

## §3 · The Inference Setting (~600 words)

**Thesis statement:** Inference, considered as a commercial transaction, has four observable cheating modalities that recur across providers and that the existing receipt format (token count + model name) cannot detect.

**Paragraph topics:**
1. **Model substitution under load** — the documented practice of providers serving a smaller / quantized variant when overloaded, billed at the larger model's price. Cite specific reported cases where verifiable.
2. **Hardware tier downgrade** — the analogous case where a request claimed to run on premium hardware is silently routed to a cheaper tier. Visible only via output distribution differences.
3. **Input transformation upstream** — sanitization, system-prompt injection, retrieval substitution. Each may be benign (safety, optimization) but is invisible to the customer asking "what did you actually feed the model".
4. **Token count and billing asymmetry** — the cases where billed tokens exceed produced tokens, or where reasoning tokens are billed differently from output tokens without being declared.
5. The common structure of these four: in each, the provider knows what happened, the customer doesn't, and the existing receipt does not let the customer find out. This is the economic asymmetry the paper addresses.

**Connections:** §4 maps these four modalities onto the freshness dimensions. §5 is where the receipt structure exposes them.

---

## §4 · Four Dimensions for Inference: an asymmetric specialization (~1,200 words) — *the heart of the paper*

**Thesis statement:** v0.6's four freshness dimensions do not preserve under specialization to inference. Two collapse — computational freshness reduces to model freshness, and input freshness is better described as request integrity, a non-temporal property — and two emerge to take their place: request integrity (the rename) and capacity attestation (a genuinely new dimension covering hardware-tier claims that are not detectable from output). The four dimensions for inference partition into two categories the v0.6 framework did not need to distinguish: output-observable versus attestation-required. This partition is the paper's central conceptual contribution.

**Paragraph topics:**

1. **Recap of v0.6's four dimensions** in their original training-oriented framing (one paragraph, briefly, with pointer to v0.6 for full treatment).

2. **Specialization 1 — model freshness (`f_m`).** What it means in inference: the inference call used the exact model weights / version / quantization the customer requested, not a substitute. Why this is a clean refinement of v0.6's notion. Detection: output-observable (a substituted model produces different tokens). Receipt requirement: cryptographic commitment to model weights at request time, signed by the provider's TEE.

3. **Specialization 2 — settlement freshness (`f_s`).** What it means in inference: the token-billing record matches the actual computation done. Refinement, not relabel: the v0.6 settlement framing assumed chain settlement; here we adapt to API billing settlement, structurally analogous but operationally different. Detection: attestation-required (the customer cannot infer billing correctness from response content alone). Receipt requirement: provider-signed token count + reasoning-token disclosure.

4. **Collapse — computational freshness (`f_c`) reduces to model freshness in inference, but only in its semantic dimension.** Important distinction: at greedy / low-temperature decoding with the same quantization, the same model weights produce the same tokens across hardware tiers. Floating-point indeterminism between, e.g., H100 and A10 typically does not flip top-1 sampled tokens. So if a provider claims H100 and silently runs A10 *with the same model weights*, the **content** the customer receives is correct. The **capacity** is wrong (latency, throughput, batching profiles differ). The semantic collapse `f_c → f_m` therefore holds for *model substitution*, but a separate dimension is required for *capacity substitution*. (This sets up paragraph 5.)

5. **Emergence — capacity attestation as a fourth dimension.** What it covers: the inference call ran on the hardware tier (GPU SKU, driver version, instance configuration) the customer paid for. Detection: **attestation-only** — the customer cannot reliably observe hardware tier from output content; capacity manifests in latency and throughput characteristics that require statistical analysis across many calls to detect indirectly. The reason this dimension matters: customers paying H100 prices for a downgraded A10 receive correct responses but their downstream pipelines (latency-sensitive UI, concurrency-bound batch jobs) silently degrade. This is cheating that the existing receipt format (model name + token count) cannot expose. Receipt requirement: TEE quote claiming GPU SKU + driver version, separately attested from the model commitment.

6. **Specialization — input freshness (`f_i`) renamed to request integrity.** Argument: v0.6's `f_i` was about no-stale-cache (temporal property). In inference, the operationally-relevant property is "was the user's input delivered to the model as-submitted, not transformed by upstream sanitization, system-prompt injection, or retrieval substitution". This is integrity, not temporal freshness. Honest renaming: we call it `f_req` (request integrity) — *not* "channel integrity", which in cryptographic literature refers to transport-layer security (TLS). Detection: output-influenced (transformed input produces different output, but only the provider knows the original).

7. **The 1-vs-3 partition: one output-observable (conditional), three attestation-required.** Summary table:

   | Dimension | Detection mode | Cheating modality detected |
   |---|---|---|
   | Model freshness (`f_m`) | Output-observable (conditional on canonical reference) | Model substitution |
   | Request integrity (`f_req`) | Attestation-required | Upstream input transformation |
   | Settlement freshness (`f_s`) | Attestation-required | Token billing asymmetry |
   | Capacity attestation (`f_cap`) | Attestation-required | Hardware tier downgrade |

   The categorization itself is a contribution: it makes explicit that three of the four cheating modalities cannot be detected by content inspection at any level of analytical sophistication, and that the fourth (model substitution) is detectable in principle only with canonical-reference infrastructure that does not currently exist. Any verification framework that omits an attestation layer is therefore structurally blind to three of the four dimensions and effectively-blind to the fourth in current practice.

8. **Why the asymmetric specialization strengthens the paper.** Three reasons. First, asymmetry honestly named is more useful than symmetry artificially preserved — operators reading the paper need to know what they can and cannot detect from output alone. Second, the collapse + rename + emergence pattern is a result: v0.6's framework was over-symmetric for inference in some respects (`f_c → f_m`), needed renaming in others (`f_i → f_req`), and was incomplete in the capacity dimension. v0.1 measures all three. Third, the 1-vs-3 partition is the strongest single argument for the receipt format: three of the four dimensions cannot be addressed without an attestation layer, and the fourth cannot be addressed in current practice without infrastructure that does not yet exist.

**Connections:** §5 turns the four dimensions into a concrete receipt structure. §6 makes the TEE trust root explicit. §9 names what this framework does NOT cover.

---

## §5 · The Inference Receipt (~1,200 words)

**Thesis statement:** A small (under 1 KB) cryptographically-signed receipt structure, attached to every inference response, is sufficient to expose the four dimensions of cheating identified in §4 — provided the receipt is parsed and verified by the customer (or a third-party auditor) against expected values.

**Paragraph topics:**
1. **Design goals** — small, parseable, signed, separable from response payload (so passive customers can ignore it, active customers can dispute on it). Constraints: must compose with TEE attestation, must support replay-defense, must allow third-party verification without provider cooperation post-hoc.

2. **The `InferenceReceipt` struct** — full Rust type definition with field-by-field commentary, organized by what each field implements. (Code block + paragraph explaining each field.)

   **Fields that implement the four dimensions of §4:**
   - `model_attestation: bytes` — Merkle root over model weights, signed by provider TEE → implements `f_m` (model freshness)
   - `input_attestation: bytes` — hash of canonical input (prompt + context window, with canonicalization rule specified per polish flag) → implements `f_req` (request integrity)
   - `billing_attestation: TokenCounts` — structured token breakdown signed by provider, where `TokenCounts { prompt_tokens, completion_tokens, reasoning_tokens, billed_tokens }` exposes the per-call billing record → implements `f_s` (settlement freshness)
   - `hardware_attestation: bytes` — TEE quote claiming GPU SKU + driver version → implements `f_cap` (capacity attestation)

   **Cross-cutting fields (not dimension-specific):**
   - `request_id: bytes32` — unique per call, prevents receipt-to-receipt confusion across the customer's request log
   - `output_attestation: bytes` — hash of returned tokens; binds the receipt to the specific response so a single receipt cannot be reused across different responses (a provider cannot emit response `R` to customer A and response `R'` to customer B both bearing the same signed receipt). This is response-binding, not a dimension of cheating in itself.
   - `timestamp_anchor: (u64, u64, u64)` — `(block_height, tee_clock, drand_round)` triple, prevents replay across sessions and pre-dating attacks (anti-replay + freshness-gating cross-cutting concern).
   - `provider_signature: bytes` — Ed25519 over a canonical serialization of all preceding fields; provides authentication of the entire receipt as having been issued by the holder of the provider's signing key (the key itself is bound to the TEE quote chain in §6).

   **Self-check on this struct** (per the round-4 process improvement on bidirectional mapping): every dimension in §4 has at least one field that implements it; every field is either dimension-implementing or cross-cutting with a named concern. No orphans in either direction.

3. **Field-by-field motivation** — each field maps to one of the four dimensions identified in §4 (only two of which — `f_m` and `f_s` — are genuinely freshness-typed; `f_req` is integrity-typed and `f_cap` is hardware-attestation-typed) or to the cross-cutting concerns (anti-replay, response-binding, authentication).

4. **What the customer does with a receipt.** Verification flow: customer (or auditor) takes the receipt + the response, recomputes the hashes, verifies the signature, checks the model attestation matches the model the customer requested. If any check fails → dispute. The dispute mechanism itself is out of scope (legal / commercial layer) but the technical evidence is sufficient to ground it.

5. **Anti-replay and freshness gating.** The triple-anchor timestamp makes receipts non-replayable across sessions. A receipt cannot be reused for a different request because `request_id` and `input_attestation` would not match. The Drand round prevents pre-dating.

6. **Receipts detect consistency, not correctness — and what that distinction requires.** Important scope clarification: a receipt's `model_attestation` field commits to a specific Merkle root over model weights. It lets a vigilant customer detect whether a single provider serves the *same* model across calls (root invariant across receipts → consistent serving; root changes silently → substitution). It does NOT, by itself, let the customer verify that the served model is in fact "Qwen3 14B Instruct FP16" rather than a same-named but different artifact, because there is no canonical reference root for "Qwen3 14B Instruct FP16" published against which the customer can compare. Cross-provider comparison of attestation roots requires one of: (a) commitment standards adopted by model creators (Hugging Face / Alibaba / etc. publishing canonical Merkle roots over their weight files), or (b) a trusted public registry that maintains canonical attestations. Neither exists today. The receipt format is a *necessary* piece of the verification ecosystem; the public-attestation infrastructure is a *separate necessary* piece that does not yet exist. We name this gap explicitly in §10 (future work).

7. **Storage and overhead.** Receipt size: ~512-1024 bytes. Signing overhead: ~5-15 ms per request. Verification overhead: ~3-8 ms. Storage cost: O(N) where N is number of API calls; trivially within reach for any commercial deployment.

8. **Open design question — dispute resolution mechanism.** The paper explicitly does not specify how the dispute is resolved (legal contract enforcement, on-chain escrow, third-party arbitration). Different commercial settings will pick different mechanisms. The receipt format is invariant under all of them.

**Connections:** §6 makes TEE assumptions explicit. §7 implements this in Rust. §8 shows why it matters.

---

## §6 · Threat Model and Trust Assumptions (~800 words)

**Thesis statement:** The receipt-based dispute layer is sound under one explicit, named assumption: that the underlying TEE attestation chain is honest. We name this assumption rather than burying it, and discuss what falls if it falls.

**Paragraph topics:**
1. **What the receipt protects against.** The four dimensions of §4: model substitution, settlement asymmetry, input transformation, and hardware tier downgrade. Each is detectable by a vigilant customer with a parsed receipt — though as §4.1 notes, model substitution detection is detectable as consistency-only in current practice, pending the canonical-reference infrastructure named in §10.

2. **What the receipt does NOT protect against.** A colluding TEE vendor (e.g., Intel issues a forged attestation). A side-channel leak in the TEE itself. A complete provider takeover where the provider's signing key is the attacker. These are out of scope and named.

3. **The TEE chain as the trust root.** Explicit acknowledgment: the receipt format is built on top of TEE attestation, and the receipt's trustworthiness reduces to the TEE attestation's trustworthiness plus the receipt format's correctness. We are not contributing a new trust root; we are contributing a receipt format that composes with an existing trust root.

4. **Honesty in framing** — why this paper does not call itself "verifiable inference without trust assumptions". The trust assumption is real and structural. We name it because hiding it would be the kind of overclaim the v0.6 paper explicitly disclaimed and because operators reading this paper will spot it immediately.

5. **What changes if the TEE assumption fails.** Cascading failure: receipt signature still valid, but receipt content (model attestation, hardware claim) becomes unverifiable. The dispute layer becomes useless against a sophisticated attacker who controls the TEE. For this attacker class, only zero-knowledge proof of inference works.

6. **Layered defense framing.** Receipts + TEE attestation = defense against opportunistic provider cheating. Add zk-inference proofs on top = defense against TEE-level compromise. The two are not competitors; they are layers.

7. **Operational implications.** A customer adopting this framework needs to (a) accept the TEE attestation chain of their chosen provider as trust root, (b) parse and verify receipts on every call (or sample), (c) have a dispute mechanism in place. The first is a one-time decision; the others are ongoing operational discipline.

**Connections:** §7 implements this with mock TEE quotes (real TEE integration is platform-specific and out of scope). §9 names this as a structural limitation.

---

## §7 · Reference Implementation (~800 words)

**Thesis statement:** The `proof-of-context-impl` crate, Phase 3, is a Rust reference implementation of the receipt format with mocked TEE attestation, end-to-end integration tests for the four dimensions, and benchmarked overhead measurements.

**Paragraph topics:**
1. **Module layout.** Brief description of the new modules added in Phase 3 (`inference.rs`, `attester.rs`, `customer.rs`, `tee_quote.rs`) and how they compose with the existing Phase 2 modules (`commit.rs`, `settle.rs`).

2. **Real cryptography.** Ed25519 signing, SHA-256 Merkle over canonical serialization. Same primitives as Phase 2 — receipt construction reuses the existing crypto helpers, no new primitives introduced.

3. **Mocked TEE quote.** Honest disclosure: real TEE quote parsing requires Intel SGX SDK or NVIDIA CC SDK, both platform-specific and out of scope for a research crate. The crate provides a `MockTeeQuote` that has the same interface as a real quote would, allowing integration tests to flow through end-to-end. Production users would substitute a real TEE quote parser.

4. **Integration tests for each dimension.** Four test suites, each validating that the receipt format detects the corresponding cheating modality:
   - `test_model_freshness_violation` — same `request_id`, different model attestation → rejected
   - `test_settlement_freshness_violation` — billed tokens > attested tokens → rejected
   - `test_request_integrity_violation` — input hash mismatch → rejected
   - `test_capacity_attestation_violation` — declared GPU SKU does not match TEE quote → rejected

   **Honest scope of these tests.** They validate the *verification path* against constructed mock failures. They do not, by themselves, demonstrate that the framework would catch real-world cheating: the mocks present perfectly-shaped failures that the verifier's logic rejects. End-to-end validation against a real cooperating inference provider — willing to expose receipt-emission instrumentation, including occasional injected violations as a test fixture — is future work and is named as such in §10.

5. **Benchmark measurements.** Receipt construction time, verification time, storage size — measured on a developer-class machine, included as a regression baseline. Numbers are modest (single-digit milliseconds, sub-KB storage) and consistent with the design claim in §5.

6. **What this is NOT.** Not a deployment-grade library. The `MockTeeQuote` is the tell. Not a full dispute system. Not a benchmark of zk-inference systems. The crate is a reference implementation that shows the framework can be implemented correctly; production adoption would require platform-specific TEE integration and a chosen dispute mechanism.

7. **Reproducibility.** Public repository, MIT-licensed, semantic version 0.3.0. Test suite passes with `cargo test`. Numbers in §7's benchmark paragraph are reproducible by anyone running `cargo bench`.

**Connections:** §5 is the spec, §7 is the implementation. §9 names what the implementation does not cover.

---

## §8 · Empirical Illustration (~800 words)

**Thesis statement:** A cross-provider benchmark of Qwen3 14B on consumer-tier and cloud-tier hardware illustrates the operator's epistemic problem: today, the price-per-token figure customers compare across providers does not specify what was actually being served, and customers cannot detect substitution from outside.

**Paragraph topics:**
1. **What was measured.** Methodology summary, pointer to the companion benchmark repository for full details. Key parameters: Qwen3 14B INT4 (Q4_K_M GGUF) on local RTX 5070, FP16/INT4 on cloud providers (Lambda, Runpod, AWS — populated as cloud sweep completes). Workloads: short / medium / long. Concurrency: 1 / 4 / 16.

2. **Cost-per-million-tokens table.** Real numbers from the benchmark CSVs. (Will populate as cloud sweep completes — the local data alone shows the consumer-tier baseline at ~$0.24/M tokens amortized.)

3. **What the data illustrates.** Cost variance across providers exists, is non-trivial, and is presented to customers as a single price-per-token number that does not specify model variant, hardware tier, or request handling. Two providers may post the same headline price for "Qwen 14B" without specifying which quantization, which GPU SKU, or what (if any) input pre-processing is applied.

4. **What the data does NOT prove.** Important calibration: the benchmark measures cost variance; it does not measure cheating. We cannot conclude from cost variance alone that any specific provider is silently substituting. The data is consistent with both honest competition (different providers offering different operational trade-offs at different prices) and with hidden substitution; the customer cannot distinguish from outside.

5. **Operationally underspecified, not operationally meaningless.** The honest framing: today's price-per-token comparison gives the customer real information (price for nominal model) but incomplete information (what is actually served). A customer comparing $0.50/M-tok vs $0.80/M-tok for "Qwen3 14B" is making a meaningful choice along the price axis while accepting opacity on every other axis. The receipt format does not eliminate the price axis; it adds the others as separately attestable, so the customer can choose with full information.

6. **The natural experiment that would prove cheating, and why it is out of scope here.** Same prompt, same temperature seed, two providers, twenty runs each, KL-divergence on token distributions, controlled for declared quantization and intra-provider variability baseline. That is a separate empirical paper, methodologically demanding, and is named in §10 as future work.

7. **Why the illustration still matters.** Even without direct proof of cheating, the cost-variance data establishes that price comparison across providers gives the customer only one of the four dimensions §4 identifies. The other three (model variant, hardware tier, request handling) are absent from the comparison. That is sufficient motivation for adding a receipt layer that exposes them.

7. **Replication.** Methodology and key data points will be reported inline in §8 when the companion benchmark study reaches publication-grade completeness. The companion study is in private development at the time of this draft.

**Connections:** §3 gave the cheating modalities; §8 illustrates the cost asymmetry that makes them exploitable. §10 names the divergence experiment as future work.

---

## §9 · Limitations (~500 words)

**Thesis statement:** This paper is a framework specialization, a construction sketch, and a reference implementation under one named trust assumption. It is not a complete dispute system and not a cryptographic primitive.

**Paragraph topics:**
1. **TEE-as-trust-root.** Already named in §6. Restated as a top-line limitation.
2. **No empirical proof of cheating.** §8 is illustrative; the divergence experiment that would prove cheating is future work.
3. **Mocked TEE quote in the reference implementation.** §7 disclosed; restated.
4. **Single-author study, single iteration of review (this paper).** Independent replication and adversarial review are welcomed and necessary.
5. **Dispute mechanism out of scope.** The receipt is a technical artifact; the legal / commercial / on-chain layer that resolves the dispute is left unspecified.
6. **Scale not measured.** The framework is described at the level of a single inference call. How a high-volume commercial deployment manages receipt storage, sampling, and dispute aggregation is open.

---

## §10 · Future Work (~400 words)

**Thesis statement:** Three concrete open problems naturally extend this paper: empirical demonstration of cheating, dispute-mechanism specification, and aggregate-receipt protocols for high-volume deployments.

**Paragraph topics:**
1. **Cross-provider divergence experiment.** Methodologically rigorous design (50 prompts × 2 providers × 20 runs each, KL divergence over token distributions, controlled for declared quantization, baselined against intra-provider variability). 4-7 days of focused work; deferred to a separate paper to avoid weakening this one.
2. **Model attestation infrastructure.** The receipt format (§5) detects consistency at low cost but cannot detect correctness without a canonical reference attestation for each model variant. This requires either (a) commitment standards adopted by model creators — e.g., Hugging Face publishing canonical Merkle roots over the canonical serialization of each weight file; or (b) a trusted public registry of canonical attestations maintained as a public good. Neither exists today. Specifying the standard, building the registry, or coordinating model-creator adoption is ecosystem work that the framework requires but cannot itself produce.
3. **Dispute mechanism design.** Compare on-chain escrow, traditional contract enforcement, and third-party arbitration. Each has a different cost profile and different signaling effects on the provider market.
4. **Aggregate receipts for sampled verification.** A high-volume customer cannot verify every receipt; they sample. What is the right sampling strategy, and how does the framework support aggregate-receipt protocols that maintain economic integrity at low verification overhead.
5. **End-to-end validation against real providers.** Coordinate with at least one cooperating inference provider willing to expose receipt-emission instrumentation, including controlled injected violations as test fixtures. This validates the framework against the real-world failure surface, not only against the constructed mock failures used in §7.
6. **Production TEE integration.** Replace the `MockTeeQuote` in the reference crate with real Intel SGX and NVIDIA CC parsers. This is engineering work, not research, but is necessary for any production adoption.

---

## §11 · Conclusion (~300 words)

**Thesis statement:** Inference-as-a-service does not need cryptographic completeness to be operationally trustworthy; it needs receipts, a dispute layer, and explicit naming of what is and is not being attested. The Proof of Context framework specializes asymmetrically to this setting, with one collapse (`f_c → f_m` along the model-content axis), one rename (`f_i → f_req`), and one new dimension required (`f_cap`, capacity attestation). The result is a four-dimensional structure that partitions 1-vs-3 by detection mode: one dimension output-observable conditionally on canonical-reference infrastructure that does not yet exist, three strictly attestation-required.

**Paragraph topics:**
1. Summary of contribution: framework specialization (four dimensions, with one collapse, one rename, and one new dimension required, all three declared as findings; the 1-vs-3 detection-mode partition declared as the central conceptual contribution), receipt construction, reference implementation, illustrative empirical grounding.
2. Where this sits in the landscape: between zkML's full cryptographic verification and pure trust-the-provider, occupying the receipt-and-dispute middle that operators actually need.
3. What is needed next: the three items in §10, plus independent replication of the framework and the implementation.

---

## §12 · References

To be assembled with anti-hallucination discipline (per Bible.md). Every reference verified against arxiv ID + abstract before inclusion. Same reference-audit pass that v0.6 underwent post-incident.

**Reference categories the paper will need:**
- PoC v0.6 paper (self-citation, well-defined)
- TOPLOC (arXiv:2501.16007)
- Verifiable Dropout (arXiv:2512.22526)
- EZKL, Giza, Lagrange DeepProve (zkML representatives)
- TEE primary sources (Intel SGX whitepaper, NVIDIA CC whitepaper, AMD SEV-SNP whitepaper)
- Drand specifications (for the timestamp anchor)
- Any documented cases of inference-provider model substitution (industry sources, with care — verifiable cases only)

---

## Writing-order recommendation

For drafting efficiency:
1. §4 first (the heart — if it doesn't work, nothing works)
2. §5 second (the construction follows from §4)
3. §6 third (the trust assumption frames everything)
4. §3 fourth (the problem statement, now informed by the solution)
5. §1 fifth (introduction is easier once the body is real)
6. §2, §7, §8 in parallel (independent of each other)
7. §9, §10, §11 last (close honestly)

§12 (references) is built incrementally as each section cites — never batch at the end.

---

*Outline complete. Ready for §4 to be written.*
