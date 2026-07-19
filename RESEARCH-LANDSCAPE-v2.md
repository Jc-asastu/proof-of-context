# Research Landscape v2 — Context Verification in Decentralized ML

**Survey date:** 2026-04-22
**Status:** Phase 2 complete — deep reads of 4 papers, obsessive arxiv scan, 9-protocol survey. Supersedes v1 (2026-04-21, Phase 1 preliminary). Paper v0.3 draft pending.

---

## TL;DR of v2 (what changed since v1)

**Verdict on the name "proof-of-context":** still clear. Obsessive arxiv scan found zero prior use as a named ML verification primitive.

**Verdict on the framing:** clear on DeFi-oracle-freshness analogy (no one has made this move); **MEDIUM risk** on the cross-phase-composability claim due to newly surfaced prior art:

> **PAL*M (arXiv 2601.16199, Chantasantitam/Caulfield/Duddu/Gunn/Asokan, Jan 2026)** — composes "proof of training" + "proof of inference" + "proof of session inference" in one framework with a "Chal" freshness mechanism. This is the closest prior art to the composable-primitive framing. It must be cited and distinguished preemptively in v0.3.

**Two other prior-art citations newly required:**
- CIV — Contextual Integrity Verification (arXiv 2508.09288, Aug 2025)
- TensorCommitments (arXiv 2602.12630, Feb 2026) — uses "proof-of-inference" terminology.

**Scaffold for v0.3 Related Work**, borrowed from the SoK:VFL taxonomy: their PoCD/PoT/PoA phase decomposition becomes the natural scaffold to extend. Proof-of-Context (PoC) enters as the fourth phase covering post-training inference lifecycle. Clean complementarity, zero terminological collision.

**What's genuinely novel in v0.2 and defended by Phase 2:**
1. The *term* `proof-of-context` (confirmed unclaimed)
2. The *cross-phase unification* (must distinguish from PAL*M's centralized-provider threat model)
3. The *DeFi oracle-freshness analogy* (genuinely novel in ML literature)
4. The *verification-primitive-layer* framing as composition over PoL/zkML/TEE
5. The *C4 mode* (prompt-cache/KV-cache staleness) — still no direct prior art

---

## Phase 2 deep-reads: what we actually know now

### A. Verifiable Dropout (arXiv 2512.22526, Lee/Jin/Lee/Ko, Yonsei, Dec 2025)

**Full PDF read. Key extracted details:**

- **Context payload:** `ctx = pack(model_id, step_t, batch_id_b, nonce, layer_ell)` → SHA256 hash → Ed25519 signature → dropout seed derivation. Verifier supplies fresh nonce.
- **ZK system:** RISC Zero zkVM (not Groth16/PLONK). Guest written in Rust, proves quantized input + seed → correct inverted dropout application.
- **Performance:** 10¹–10² seconds proving latency per layer (Fig. 4–5). 100% detection on seed/p/activation tampering (Table 1).
- **Scope — strictly training-only, dropout-only, post-hoc audit.** Paper NEVER mentions: inference, prompt-cache, cross-phase, freshness, staleness, oracle, composable primitive.
- **Their vocabulary:** "plausible deniability," "ambiguity surface," "integrity gap," "context binding," "context string." (Says "context string" but NOT "proof of context".)
- **Their future work:** probabilistic auditing, specialized tensor circuits, hardware proving. Not cross-phase, not freshness.

**Positioning implication:** they use the exact context-payload shape I want (`model_id, step, batch, nonce, layer`) but treat it as seed-binding, not as a first-class commitment. My extension: bind to *any computational claim* (not just dropout randomness) + add freshness semantics + compose across phases. Verifiable Dropout is a fragment-level instance of my primitive.

---

### B. TOPLOC (arXiv 2501.16007v2, Ong et al., Prime Intellect, ICML 2025)

**Full PDF read. Concrete numbers extracted:**

- **Thresholds (§5.2, single set for all tested models):**
  - bf16: `Texp=38, Tmean=10, Tmedian=8`
  - fp32: `Texp=8, Tmean=256, Tmedian=128`
- **FPR/FNR (Table 6, Llama-2-13B):** TOPLOC achieves 0% FPR, 0% FNR (both deterministic and non-deterministic). zkLLM: 100% FNR under non-determinism. SVIP: 3% FPR, 4.41% FNR.
- **Proof size:** 258 bytes per 32 tokens = 8.06 B/token amortized (1024× reduction vs. raw 8192 B/token hidden state).
- **Commit overhead:** 0.26 ms/token (vs. zkLLM 986 sec/token).
- **Attack matrix — detected:** different model (100%), altered system prompt (100%), precision downgrade bf16↔fp32 (100%).
- **Attack matrix — NOT detected (explicit):** speculative decoding (by design), FP8 vs. bf16 (margin too small), KV-cache compression (untested), subtle fine-tune gradients, last-layer spoofing via smaller model.
- **Named but not quantified:** "unstable prompt mining" attack vector (§6.3).
- **Security:** no formal theorem — only informal argument about bf16 algebraic stability of top-k large values.
- **Scope — inference-only, per-rollout.** Explicitly does NOT cover: training (future work), prompt-cache staleness, cross-phase binding.

**Positioning implication:** TOPLOC is production-grade activation-integrity for inference. It achieves what it claims at the layer it claims. But it is one axis of a primitive I propose to span three axes. The "unstable prompt mining" vector the authors flag is adjacent to the C4 (prompt-cache staleness) mode I name; freshness semantics would address it at the protocol layer where TOPLOC does not.

---

### C. SoK: Verifiable Federated Learning (ePrint 2025/2296, Bruschi/Esposito/Gagliardoni/Rizzini, Dec 2025)

**Full PDF read. Zero terminological collision, clear scaffold for v0.3.**

- **Taxonomy (novel, by PHASE):** PoCD (Proof of Committed Data), PoT (Proof of Training), PoA (Proof of Aggregation). NOT by cryptographic primitive family.
- **Terminology checks — ALL NEGATIVE:** "proof-of-context" — 0 hits. "context-binding" — 0 hits. "staleness verification" — 0 hits. "oracle freshness" — 0 hits. "cross-phase verification" — 0 hits. "prompt-cache integrity" — 0 hits. "context-window" — 0 hits.
- **Explicit scope exclusion (§1.1):** *"we do not address all those problems that arise at inference time, such as privacy of inference and model watermarking... Inference-time privacy and security are also very important, but orthogonal to our analysis."*
- **Staleness in SoK:** mentioned exactly twice, peripherally, for model-parallel pipelines (Ajanthan et al. 2505.01099). Not a verifiable property. Explicitly flagged as open cryptographic challenge.
- **Missing-unified-primitive hint (§7):** *"breakthroughs in three directions: collaborative aggregation proofs, proof-carrying updates that push integrity checks to the edge, and deployment on low-fee environments."*
- **Six FL systems studied in depth:** zkFL, zkFDL, zkPPFL, VPFL, Federify, VerifBFL.

**Positioning implication:** the SoK's PoCD/PoT/PoA phase decomposition is the ideal rhetorical scaffold. Proof-of-Context enters as the **fourth phase** covering post-training inference lifecycle. I can cite the SoK as the best-available scaffold and introduce my primitive as the natural extension into the phase they explicitly excluded.

---

### D. Bittensor Weight-Copier (Opentensor working paper, May 29 2024, 21pp)

**Full PDF read. Confirms staleness has been treated cryptoeconomically but never as a consumer-side freshness gate.**

- **Attack model:** lazy-copy, active-copy, consensus-copy. Pre-commit-reveal, copier pays nothing — can even BEAT honest validators by copying recent consensus.
- **Yuma penalty (emergent, not explicit):** consensus-clipping + bonds-EMA → dividend monotone non-decreasing in MSE(consensus, reported). Stale copier pays proportional to prediction error.
- **Commit-reveal (Algorithm 1):** BLAKE2(w, o) commit with fresh nonce o; reveal (w, o) signed. $(τ, ε)$-binding. Nonce mandatory.
- **Drand TLE:** NOT in May 2024 paper. Production v3+ evolution documented only in current docs.
- **Production parameters:** tempo = 360 blocks ≈ 1.2h (12s block time). commit_reveal_period default = 1 tempo. None of 30 subnets tested could push copier dividend below `1-τ` threshold → copying remains profitable at edges.
- **Terminology checks:** "proof-of-context", "context-binding", "freshness", "oracle", "inference-time" — zero hits anywhere in 21 pages. No DeFi/oracle analogies.
- **Framing:** staleness is used **OFFENSIVELY** (weapon against copiers), never defensively as freshness gate for inference consumers.

**Positioning implication:** Bittensor's mechanism is **producer-side** (hide signals between validators). Proof-of-context is **consumer-side** (freshness gate for downstream users of compute). Completely orthogonal axes. Open Problem #4 in Bittensor's own paper (single-round → infinite-horizon utility) is directly citable.

---

## Phase 2 arxiv scan — adjacencies found

### CRITICAL new citation (must distinguish in v0.3)

**PAL*M — Property Attestation for Large Generative Models (arXiv 2601.16199, Jan 2026)**

The closest prior art to the cross-phase composable-primitive framing.

- Uses "proof of training," "proof of inference," "proof of session inference" in ONE framework
- Has "Chal" freshness mechanism (challenge-response anti-replay)
- Threat model: **centralized** provider → regulator/customer (NOT decentralized ML marketplace)
- No DeFi oracle analogue
- Never uses "proof-of-context" term

**Distinguishing line for v0.3:**
> "PAL*M composes property attestations under a centralized-provider threat model with a challenge-response freshness device aimed at regulatory/compliance audit. Proof-of-context composes verification primitives under a decentralized-marketplace threat model with cryptographic temporal-validity semantics for model and cache state, aimed at contribution-time gating rather than post-hoc attestation."

### IMPORTANT new citations

- **CIV — Contextual Integrity Verification (arXiv 2508.09288, Gupta, Aug 2025):** per-token HMAC provenance labels + trust-lattice attention mask, against prompt injection. Uses "cryptographic proof of information-flow integrity." Inference-only, solo-author. **Distinguish:** CIV protects against within-context injection; PoC protects against stale-context substitution.

- **TensorCommitments (arXiv 2602.12630, Baser et al., Feb 2026):** tensor-native "proof-of-inference" with Merkle-style commitments, 0.97% overhead on LLaMA2. **Terminology adjacency** ("proof-of-inference" vs my "proof-of-context"). Inference-only, centralized. Cite as complementary primitive.

- **End-to-end verifiable AI pipelines (arXiv 2503.22573):** frames training+inference+unlearning as pipeline. Enumerates components without naming the binding primitive. Cite as taxonomy precursor — "we name what they enumerate."

- **ChainDrive-FL-VRA (Nature Sci Reports 2026):** ZKP + staleness-aware aggregation on permissioned ledger. FL-specific. Cite as training-half precedent.

- **LiteChain (arXiv 2503.04140):** staleness-aware aggregation + BFT consensus, same FL-only limitation.

### NOTED (cite for problem-exists claims)

- Securing RAG survey (arXiv 2604.08304) — mentions "provenance tracking" and "corpus freshness" as open problems
- Context Kubernetes (arXiv 2604.11623) — enterprise orchestration with "Freshness Manager" for fresh/stale/expired/conflicted states — governance framing, not crypto
- Right to History (arXiv 2602.20214) — verifiable agent-execution ledger, tangential
- DSperse (Feb 2026) — decentralized model slicing for scalable verifiable inference
- Can AI Solve the Blockchain Oracle Problem? (arXiv 2507.02125) — AI→oracles direction, opposite of my framing

### CLEAR white space confirmed

- Zero prior art on `proof-of-context` as named ML verification primitive
- Zero prior art on DeFi-oracle-freshness → ML analogue direction (reverse direction exists, not this one)
- Zero prior art on cryptographic freshness primitive for LLM state/cache
- Zero prior art on cross-phase training + inference + prompt-cache unification under decentralized threat model

---

## Phase 2 protocol survey — 9 protocols with verification stacks

| Protocol | Primitive | Verifies | Does NOT verify | Oracle framing | Maturity |
|---|---|---|---|---|---|
| **Ritual** | EZKL zkML / TEE / optional | per-call output hash | prompt freshness, KV-cache, session | Uses "oracle" vocabulary; NO freshness discipline | Infernet 8000+ nodes, L1 testnet |
| **Atoma** | TEE sampling consensus + slashing | output bytes match across N replicas | which prompt/context/cache was used | None | Sui mainnet |
| **Nillion** | MPC/NMC blind compute | privacy (honest-majority) | computation correctness vs known model | None | Mainnet, ML demo-stage |
| **io.net** | GPU PoW | hardware reality | any ML workload | None | Mainnet Solana DePIN |
| **Aethir** | Monitoring + reputation | SLA metrics | cryptographic integrity | None | Marketing-heavy mainnet |
| **Gensyn/Verde** | Refereed delegation + RepOps | ML program execution correctness | **explicitly:** cache, freshness, context, sampling | None | Testnet 2025 |
| **OpenGradient** | zkML / TEE / vanilla spectrum | per-request selectable | context freshness, cache, session integrity | Has "data nodes"; no cache/freshness primitive | Whitepaper Mar 2026 |
| **Prime Intellect** | TOPLOC + PCCL | inference activations (prompt+model+precision); comm fault-tolerance | sampling, training gradients, KV-cache | TOPLOC closest to context-binding (post-hoc) | INTELLECT-2 live |
| **Inference Labs** | zkML + EigenLayer restaking | committee signatures | same as Ritual | EigenLayer AVS trust root | AVS live |
| **Supra** | Threshold AI Oracles (BFT sigs) | quorum attestation | content | **cleanest "oracle semantics" match** | Paper published |
| **Hyperbolic** | Proof of Sampling (PoSP) | probabilistic spot-check | depth | None | Worth citing |

### Global answers

1. **No protocol unifies training + inference + cache.** Gensyn/Verde is closest (training + inference + fine-tuning) but explicitly excludes cache/freshness/context.
2. **DeFi-oracle analogies:** Only Ritual and Supra use "oracle" vocabulary. Both use it as *topology* label, not as *freshness discipline*. Neither imports Chainlink-style heartbeat/deviation/TWAP semantics.
3. **Closest to freshness-first-class:** TOPLOC — still post-hoc and per-rollout, but the only operational primitive treating context-binding as protocol concern.
4. **No protocol** defines a primitive binding `(prompt, KV-cache, model version, timestamp)` into a single verifiable object with freshness semantics.

---

## v0.3 paper diff specification

### Abstract (replace second sentence)

Original: *"...contributions, though, are largely treated as domain-specific algorithmic concerns..."*

Replace with acknowledgment of Phase 2 findings and PAL*M as closest prior art on composability:

> *"Concurrent and prior work — Verifiable Dropout (Lee et al. 2025) binds context strings to dropout randomness; TOPLOC (Ong et al. 2025) achieves 0% FPR/FNR inference-activation integrity with 258-byte proofs; PAL*M (Chantasantitam et al. 2026) composes attestations across training, inference, and session phases under a centralized-provider threat model; CIV (Gupta 2025) supplies per-token information-flow integrity against injection. These are fragment-level or differently-motivated instances of a composable primitive we name, ground in a decentralized-marketplace threat model, and analogize to the oracle-freshness tradition in DeFi."*

### §3 Related Work — restructure with four new subsections (after existing content)

- **3.1 Staleness-aware federated learning** (existing, keep)
- **3.2 Proof-of-learning and its robustness** (existing, keep)
- **3.3 Verifiable training and inference as a composite lifecycle** (existing, keep; add SoK:VFL phase taxonomy and End-to-end pipeline framework as precursor)
- **3.4 Context-binding in stochastic operations** (NEW — Verifiable Dropout)
- **3.5 Inference integrity via locality-sensitive hashing** (NEW — TOPLOC with concrete numbers)
- **3.6 Property attestation across phases** (NEW — PAL*M, distinguish preemptively)
- **3.7 Per-token contextual integrity** (NEW — CIV)
- **3.8 Staleness as cryptoeconomic offense** (NEW — Bittensor Commit-Reveal)
- **3.9 Oracle freshness in DeFi** (existing, keep)

### §4 The Gap — add one sentence acknowledging TOPLOC's attack-coverage

> *"Production inference-integrity systems such as TOPLOC achieve strong guarantees against model replacement, prompt modification, and precision downgrade (0% FPR/FNR in their empirical regime), yet their authors explicitly flag speculative decoding, KV-cache compression, and adversarial 'unstable prompt mining' as uncovered attack surfaces that lie within the context-verification frame we propose."*

### §6 Modes of Context Failure — no changes to C1–C4, but:

- Add note that C2 (data-shard desync) overlaps with Verifiable Dropout's threat model partially
- Add note that C4 (prompt-cache) includes the KV-cache compression and unstable-prompt-mining vectors TOPLOC does not cover

### §8 Research Program — Constraint (5) Compatibility: expand with composition map

Add a paragraph specifying how PoC composes with existing primitives:

> *"Concretely, proof-of-context extends (1) the context-payload shape used by Verifiable Dropout from seed-binding for a single stochastic operation to first-class commitment over per-computation state; (2) the activation-integrity primitive of TOPLOC from per-rollout hashing to temporally-indexed commitment with explicit freshness semantics; (3) the refereed-delegation primitive of Verde to accept freshness-bound challenges alongside math-correctness challenges; (4) the cryptoeconomic staleness treatment of Bittensor Commit-Reveal from producer-side hiding to consumer-side freshness gating."*

### §9 Conclusion — strengthen the "2026 ML = 2020 DeFi" claim with evidence

Reference the 9-protocol survey finding that no protocol currently binds `(prompt, KV-cache, model version, timestamp)` into a single freshness-bound verifiable object.

### References — add (minimum):

- PAL*M (arXiv 2601.16199)
- Verifiable Dropout (arXiv 2512.22526)
- TOPLOC (arXiv 2501.16007)
- Verde (arXiv 2502.19405)
- PCCL (arXiv 2505.14065)
- INTELLECT-2 (arXiv 2505.07291)
- CIV (arXiv 2508.09288)
- TensorCommitments (arXiv 2602.12630)
- End-to-end verifiable AI pipelines (arXiv 2503.22573)
- ChainDrive-FL-VRA (Nature Sci Reports 2026)
- LiteChain (arXiv 2503.04140)
- Securing RAG survey (arXiv 2604.08304)
- SoK: Verifiable FL (ePrint 2025/2296)
- Bittensor Weight-Copier (Opentensor May 2024)
- OpenGradient Whitepaper (March 2026)
- Supra Threshold AI Oracles

---

## Cold-outreach / interview positioning (updated from v1)

If a technical reviewer asks *"how is this different from Verifiable Dropout, TOPLOC, PAL*M, or CIV?"* the answer is:

> **"Verifiable Dropout binds context per-operation (dropout randomness specifically). TOPLOC hashes inference activations per-rollout, post-hoc. PAL*M composes attestations across phases but under a centralized-provider threat model with challenge-response anti-replay — not freshness semantics. CIV supplies per-token integrity against within-context injection. Bittensor penalizes producer-side consensus-copying cryptoeconomically, not consumer-side. What's not yet named or composed is a decentralized-marketplace verification-primitive layer that sits on top of PoL, zkML, TEE, and refereed delegation; binds training state, inference state, and KV-cache state into one temporally-indexed commitment; uses freshness semantics imported from DeFi oracle design (heartbeat / deviation / TWAP / multi-source quorum); and admits all prior constructions as fragment-level instances. The paper names that composition, analogizes it to DeFi, and sketches the construction constraints."**

---

## Construction sketch scaffold (Phase 3 preview)

With Phase 2 complete, the construction we scaffold in `Jc-asastu/proof-of-context-impl` should:

1. **Extend the context-payload shape** of Verifiable Dropout from `(model_id, step, batch, nonce, layer)` to `(model_id, step, batch, nonce, layer, cache_root, timestamp_round, freshness_threshold)` — the last three fields are the novel contribution.

2. **Compose with TOPLOC-style activation hashing** as an optional integrity annex — a PoC commitment SHOULD embed or reference a TOPLOC-compatible hash when one is available.

3. **Refuse rather than weight down** — the cryptoeconomic design should make stale contributions REJECTED (no reward), not WEIGHTED (partial reward), distinguishing PoC sharply from the staleness-aware FL tradition.

4. **Freshness semantics borrowed from DeFi:**
   - **Heartbeat:** every PoC commitment MUST carry a timestamp no older than `heartbeat_period` relative to the current canonical round.
   - **Deviation threshold:** a PoC commitment MAY be valid even if stale, provided the cache-state-distance from canonical is below a deviation threshold.
   - **Multi-source quorum:** critical context (e.g., model version) MUST be attested by a quorum of committee members, not a single worker.

5. **Cross-phase applicability:**
   - Training mode: freshness = gradient-against-current-global-weights
   - Inference mode: freshness = inference-against-current-committed-model-version
   - Cache mode (C4): freshness = cache-root-matches-committed-prompt-cache-tree

6. **Construction primitives to compose:**
   - Merkle tree for cache-root commitments
   - Drand beacon for timestamp_round (borrowed from Bittensor v3+)
   - Ed25519 for commitment signatures (borrowed from Verifiable Dropout)
   - RISC Zero zkVM for zero-knowledge mode (borrowed from Verifiable Dropout)
   - Optional TOPLOC-compatible activation hash for inference mode
   - Optional Verde-compatible refereed-delegation hook for dispute escalation

This scaffold will be encoded as Rust traits with `unimplemented!()` bodies in the crate, with the README and ARCHITECTURE.md referencing back to this landscape document for the prior art lineage.

---

## Phase 3 next actions

1. Write paper v0.3 incorporating the diff above (est. 2–3h)
2. Scaffold `Jc-asastu/proof-of-context-impl` Rust crate with traits, README, ROADMAP, ARCHITECTURE (est. 1.5h)
3. Commit + push — establish second timestamp after v0.2 + code
4. Update Opus site card and CV to reference v0.3

---

## Sources consulted (Phase 2)

### Primary papers read in full
- Verifiable Dropout — arXiv 2512.22526
- TOPLOC — arXiv 2501.16007v2
- SoK: Verifiable Federated Learning — ePrint 2025/2296
- Bittensor Weight-Copier — Opentensor May 2024

### Adjacencies scanned
- PAL*M — arXiv 2601.16199
- CIV — arXiv 2508.09288
- TensorCommitments — arXiv 2602.12630
- End-to-end verifiable AI pipelines — arXiv 2503.22573
- ChainDrive-FL-VRA — Nature Sci Reports 2026
- LiteChain — arXiv 2503.04140
- Securing RAG survey — arXiv 2604.08304
- DSperse — decentralizedinference.org Feb 2026
- Context Kubernetes — arXiv 2604.11623
- Right to History — arXiv 2602.20214

### Protocol docs consulted
- Infernet / Ritual (ritual.net, infernet-ml docs, Ritual Academy)
- Atoma (atoma.network, Linera×Atoma)
- Nillion (nillion.pub whitepaper, docs.nillion.com)
- io.net (docs.io.net/proof-of-work)
- Aethir (CoinMarketCap deep dive)
- Gensyn / Verde — arXiv 2502.19405 + docs.gensyn.ai
- OpenGradient — docs.opengradient.ai, opengradient.foundation/whitepaper
- Prime Intellect — PCCL (arXiv 2505.14065), INTELLECT-2 (arXiv 2505.07291)
- Inference Labs — EigenLayer blog
- Supra — Threshold AI Oracles whitepaper
- Bittensor — docs.learnbittensor.org (commit-reveal, Yuma, weight-copying)

---

*End of Phase 2. Phase 3 begins with paper v0.3 draft.*
