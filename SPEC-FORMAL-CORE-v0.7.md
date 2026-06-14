# SPEC — Formal Core for Proof-of-Context v0.7

**Status:** design spec, pending author review. No paper prose written yet.
**Author:** Juan Cruz Maisú
**Purpose:** Define exactly what v0.7 of the flagship position paper (`paper/proof-of-context.md`) adds, so the additions can be reviewed *before* drafting.

> ⚠ **Naming note (RESOLVED — keep as-is):** the repo has `CASE-V0.7-EXTENSION.md`, documenting the seven-round review of the **inference** paper's heart sections; its "V0.7" is unrelated to this flagship v0.6→v0.7 bump. Renaming was considered and **rejected**: it is referenced in 7 files (README ×3, the inference draft's `case_file:` frontmatter + 3 in-text citations, and the agent-economy / agent-service-settlement outlines), so renaming ripples into papers out of scope for this task. The flagship v0.7 lives in `paper/proof-of-context.md` and introduces no colliding filename — the collision is latent but harmless. Revisit only if those other drafts are edited anyway.

---

## 0. Decision recap (locked)

- **Vehicle:** research credibility → realistic funding (grants + arXiv presence), not a product/VC raise yet.
- **Move:** fold a *minimal formal core* into the existing position paper as **v0.7**, instead of a separate construction paper.
- **Why folded, not separate:** at this scope (~4–6 pages new), a standalone paper would be 60–70% copy-paste of v0.6 (intro, background, related work, threat model) = salami-slicing, which hurts an unknown solo author. Nothing is on arXiv yet, so the *first* arXiv impression must be the single strongest artifact. v0.6 §7 already frames the construction as "the central open research question the framing invites" — delivering it as v0.7 closes that question in one arc. A standalone construction paper is reserved for Phase 3/4, when the construction grows enough (real TEE backend, f_m/f_i oracle, SUR deployment data) to justify repeating context.

---

## 1. Scope of v0.7

**In scope (the minimal slice):**
1. One new section: **Formal Model and Soundness** (definitions + one security definition + theorems).
2. One new section: **Reference Implementation** (empirical grounding from the `proof-of-context` crate v0.2).
3. Abstract/framing shift: "position paper" → "position paper that also gives a first formal model, a soundness theorem for the enforced subset, and a running reference implementation."
4. Revision note `v0.7` + collateral fixes (see §7).

**Explicitly OUT of scope (YAGNI — do NOT write these into v0.7):**
- A full construction of the f_m / f_i canonical-state oracle (Phase 3).
- A TEE-backend (TDX/H100 quote parsing) construction or eval (Phase 3b).
- Formal proof of execution-context-root *sufficiency* (v0.6 §8 already flags this as open; stays open).
- Liveness, incentive-compatibility, or game-theoretic equilibrium claims.
- Any number that is not measured from the running crate or cited from a primary source.

---

## 2. Placement in the paper

Current v0.6 outline: §1 Intro · §2 Background · §3 Related Work · §4 Gap · §5 DeFi Analogy · §6 Four Freshness Types · §7 Construction Constraints · §8 Execution-Context Root · §9 Empirical Calibration · §10 Author Background · §11 Conclusion · Appendix A.

**v0.7 insertion:**
- New **§9 "Formal Model and Soundness"**, placed *after* §8 (it references the execution-context root defined there).
- New **§10 "Reference Implementation"** (empirical), after the new §9.
- Current §9 Empirical Calibration → renumber to **§11**; §10 Author Background → **§12**; §11 Conclusion → **§13**.
- Abstract gains 2 sentences (model + theorem + impl).
- Contributions list in §1 gains one item: *"a first formal model and a soundness theorem for the enforced freshness subset, with a running reference implementation."*

*(Renumbering is mechanical; alternatively keep numbers and append §9-Formal as §8.5/§8.6 — author's call. Recommend clean renumber.)*

---

## 3. The formal model (anchored to code)

Notation and definitions mirror the crate exactly so the paper and code cannot drift. Code anchors are `file:symbol`.

### 3.1 Execution-context root
*(anchor: `src/context.rs::ExecutionContextRoot::merkle_root`)*

Let `H = SHA-256`. The execution-context root commits to ten components in fixed canonical order:

```
R = H( weights_hash[32] ‖ tokenizer_hash[32] ‖ system_prompt_hash[32]
     ‖ enc(sampling)[20] ‖ runtime_version[32]
     ‖ attn_id[1] ‖ precision[1] ‖ enc(inference_config)[68]
     ‖ input_manifest_root[32] ‖ kv_flag[1] (‖ kv_cache_root[32])? )
```

where `enc(sampling) = temperature(f32 LE) ‖ top_k(u32 LE) ‖ top_p(f32 LE) ‖ seed(u64 LE)` (20 B) and `enc(inference_config) = max_tokens(u32 LE) ‖ stop_sequences_root[32] ‖ penalty_params_root[32]` (68 B). Canonical preimage length: **251 B** (kv-cache absent) or **283 B** (present). `attn_id` and `precision` are the TOPLOC-attributed attack-surface vectors (Ong et al., arXiv:2501.16007), present in the root by design.

### 3.2 Triple anchor
*(anchor: `src/anchor.rs::TripleAnchor`)*

`A = (h, τ, ρ)`: block height `h` (u64), TEE timestamp `τ` (u128 ns), Drand round `ρ` (u64). Per-axis skew `skew(A, A') = (|h−h'|, |τ−τ'|, |ρ−ρ'|)`. Divergence predicate `diverges(A, A', θ) := |h−h'| > θ.block_skew ∨ |τ−τ'|/10⁹ > θ.tee_skew_secs ∨ |ρ−ρ'| > θ.drand_skew`.

### 3.3 Commitment
*(anchors: `src/commitment.rs::FreshnessCommitment`, `src/mock.rs::MockCommitter::commit`)*

`C = (R, A, y, σ, pk, att)` where `y` = output hash (32 B), `σ = Ed25519.Sign_sk(d)`, `d = H(R ‖ h(8 LE) ‖ τ(16 LE) ‖ ρ(8 LE) ‖ y)` (96-B signing preimage), `pk` = 32-B Ed25519 verifying key, `att` = attestation chain (vendor + payload). Fixed cryptographic material per commitment: **192 B** + attestation chain.

### 3.4 Freshness thresholds
*(anchor: `src/freshness.rs::FreshnessThresholds::default_base_mainnet`)*

`θ = (block_skew=2, tee_skew_secs=5, drand_skew=1; max_fc_blocks=30, max_fm_epochs=1, max_fi_blocks=15, max_fs_blocks=300)`. Skew triple is from v0.6 §9 (empirically justified).

### 3.5 The four freshness predicates
Define over a commitment `C`, a settlement-time anchor `now`, and thresholds `θ`:

- **fresh_c(C, now, θ)** — computational/recency: `¬ diverges(A, now, θ)` *(three-clock consistency, the enforced proxy)* **and** `now.h − A.h ≤ max_fc_blocks` *(commit-recency horizon)*.
- **fresh_s(C, now, θ)** — settlement window: `now.h − A.h ≤ max_fs_blocks`.
- **fresh_m(C, now, θ)** — model: `epoch_dist(R.weights, canon_model_root(now)) ≤ max_fm_epochs`. **Requires a canonical-model oracle.**
- **fresh_i(C, now, θ)** — input: `lag(R.input_manifest, canon_input_state(now)) ≤ max_fi_blocks`. **Requires a canonical-input oracle.**

### 3.6 Settlement gate
*(anchors: `src/settle.rs::SettlementGate`, `src/mock.rs::MockSettlementGate::verify_and_settle`)*

`G(C, now, θ) = Clear` iff `Verify(C) ∧ fresh_c ∧ fresh_m ∧ fresh_i ∧ fresh_s`; otherwise `Rejected(S)` where `S` ⊆ {c, m, i, s} are the violated types. `Verify(C)` = Ed25519 signature check over `d` + attestation-chain validity.

---

## 4. Honest statement of what v0.2 enforces (load-bearing for credibility)

A strict audit of `MockSettlementGate::verify_and_settle` (`src/mock.rs:137–184`) shows the gate currently enforces:

1. **`Verify(C)`** — Ed25519 + (mock) attestation. ✅
2. **Three-clock consistency** via `diverges(A, now, θ)` → attributed to `Computational` (the code itself notes this is a coarse attribution and a finer per-axis split is future work, `src/mock.rs:155–157`). ✅
3. **`fresh_s`** via `now.h − A.h ≤ max_fs_blocks`. ✅

It does **not** yet use `max_fc_blocks` (the f_c *horizon*, distinct from the consistency skew), `max_fm_epochs`, or `max_fi_blocks`. So the truly enforced settlement predicates today are **{three-clock consistency, fresh_s}** — `f_m` and `f_i` are *defined and committed-to in the root* but their gating is deferred to the Phase-3 oracle.

**Framing options for the paper (author picks one):**
- **(a) Strict (recommended):** "v0.7 proves soundness for the enforced subset {anchor-consistency, f_s}; f_c-as-horizon, f_m, f_i are specified and committed but their gating is future work pending the canonical-state oracle." Maximum honesty; a sharp reviewer who greps `max_fc_blocks` finds it unused and we have already said so.
- **(b) Looser but defensible:** "v0.7 enforces f_c (via anchor consistency) and f_s; f_m/f_i deferred." Cleaner narrative, but invites the "max_fc_blocks is unused" objection.

**Optional ~5-line code change that makes (b) fully honest:** wire `max_fc_blocks` into the gate as a distinct f_c horizon check (separate from the consistency skew). Small, high-value, would let the paper claim three genuinely-enforced predicates. **Flagged, not done — needs your go (scope expansion).**

---

## 5. Security definition and theorems

### 5.1 Definition — Freshness-Gated Settlement Soundness (FGSS)
A PPT adversary 𝒜 (malicious worker/prover) is given public parameters and a settlement-time anchor `now`, and outputs a commitment `C`. 𝒜 **wins** if `G(C, now, θ) = Clear` while the *true* execution context that produced `y` is stale relative to `now` — i.e., the real commit-time anchor `A_real` satisfies `diverges(A_real, now, θ)`, or (for the extended gate) the real model/input state exceeds the `f_m`/`f_i` horizon. The scheme is **FGSS-sound** if `Pr[𝒜 wins] ≤ negl(λ)`.

### 5.2 Assumptions
- **(H1)** `H = SHA-256` is collision-resistant.
- **(H2)** Ed25519 is EUF-CMA.
- **(H3)** Valid TEE attestation chain: `Verify` accepts `pk` only from an enclave whose measurement is known-good and which faithfully reports the triple anchor at commit time.
- **(H4)** Honest canonical-state oracle supplying `canon_model_root(now)` and `canon_input_state(now)` (only needed for f_m / f_i).

### 5.3 Theorem 1 (provable now; matches running code)
Under **(H1)–(H3)**, the v0.2 gate is FGSS-sound for the enforced predicate set **{three-clock consistency, fresh_s}**: if `G(C, now, θ) = Clear`, then except with probability negligible in λ, `A` (the committed anchor) is the true commit-time anchor and satisfies `¬diverges(A, now, θ) ∧ now.h − A.h ≤ max_fs_blocks`.

**Proof structure (3 steps, to be written in full):**
1. **Binding (H1):** `R` binds the ten context components; `d` binds `(R, A, y)`. No PPT 𝒜 finds a second preimage/collision except w/ negl. prob.
2. **Authentication (H2+H3):** a valid `σ` under `pk` proves an honest enclave signed `d`; by H3 the enclave reported the real clocks, so `A = A_real`. 𝒜 cannot bind a fresh `A` to a computation run against a stale clock.
3. **Gating:** given `A = A_real` and a `Clear`, the gate's explicit checks force `¬diverges(A, now, θ)` and `now.h − A.h ≤ max_fs_blocks`. ∎

### 5.4 Theorem 2 (the extension; conditional, states the target)
Under **(H1)–(H4)** and the Phase-3 gate that additionally checks `fresh_m` and `fresh_i` against the canonical-state oracle, FGSS-soundness extends to all four freshness types. Without **(H4)**, the f_m/f_i guarantees reduce to the freshness of the oracle itself — **the DeFi oracle-freshness assumption of §5, now appearing as an explicit formal dependency rather than an analogy.**

### 5.5 The honest boundary (the credibility-earning part — keep it prominent)
The theorems make precise that PoC soundness = **(standard crypto: H1+H2) + (TEE attestation: H3) + (oracle freshness: H4)**. It *localizes trust*. Two boundaries stated plainly:
- Drop **H3** → Theorem 1 fails exactly where v0.6 §9 already admits it does: a compromised enclave echoes the external clocks. The triple-anchor is *not* the last line of defense against enclave compromise; the attestation chain is.
- Drop **H4** → f_m/f_i are only as fresh as the oracle. This is not a flaw to hide; it is the paper's thesis (import DeFi's oracle-freshness discipline) shown to be load-bearing in the formal model.

---

## 6. Reference-implementation section (empirical — measured, not asserted)

Reports from the `proof-of-context` crate **v0.2** (MIT OR Apache-2.0, pure Rust, `#![forbid(unsafe_code)]`; deps `sha2`, `ed25519-dalek`, `serde`, `thiserror`, `hex`):

- **Test suite:** `cargo test` → **33 passed, 0 failed** on default features (verified 2026-06-11). Live Drand/Base-RPC anchor tests are `#[ignore]`-gated network tests, excluded from that count.
- **Root scope is enforced:** `smoke.rs` confirms `merkle_root` changes when sampling-seed, KV-cache presence, **attention-impl**, or **precision-mode** change — i.e., the TOPLOC-attributed vectors are in-scope and detected.
- **Rejection paths fire:** `integration.rs` demonstrates a 5-round Drand divergence → `Rejected(Computational)`, a 500-block gap (> max_fs=300) → `Rejected(Settlement)`, and signature/output tampering → `InvalidSignature`.
- **Costs (sizes computed above; throughput to be micro-benched during drafting):** 251-B canonical context-root preimage (one SHA-256), 96-B signing preimage, 192 B fixed commitment material + attestation chain; one Ed25519 sign at commit, one verify at settle.
- **Honest scope line (per §4):** the v0.2 gate enforces `Verify` + three-clock consistency + `fresh_s`; `f_m`/`f_i` gating is deferred to the Phase-3 canonical-state oracle.

**To measure during drafting (no fabricated numbers):** exact serialized commitment bytes (serde); sign/verify/merkle-root throughput via a small `criterion` bench or a timed loop; record the toolchain + machine in a footnote.

---

## 7. Collateral fixes (do alongside v0.7)

1. **`proof-of-context-impl/src/lib.rs:10–13`** — doc-comment says *"Status: scaffold. All primitive implementations are `unimplemented!()` stubs."* This is **stale** (v0.2 implements them; 33 tests pass). Fix before the paper cites the crate — a reviewer who opens `lib.rs` sees a contradiction. Update to reflect Phase-2-landed status.
2. **`README.md`** — add a "How to read" line + BibTeX entry for v0.7; note the crate is v0.2 with primitives implemented.
3. **`CITATION.cff`** — bump to v0.7.
4. **Naming collision** — see top-of-file warning re `CASE-V0.7-EXTENSION.md`.

---

## 8. Open questions for the author (decide before drafting)

1. **§4 framing:** strict (a) or looser (b)? (Recommend **a**.)
2. **Optional code change:** wire `max_fc_blocks` into the gate so f_c is a genuinely-enforced horizon (makes (b) honest, lets Theorem 1 cover 3 predicates)? **Yes / no / later.**
3. **Renumber** §9–§11 cleanly, or append as §8.x? (Recommend clean renumber.)
4. **Theorem ambition:** is the modest Theorem 1 (soundness for the enforced subset) the right altitude, or do you want me to also attempt a *completeness* direction (honest workers are never wrongly rejected) — which is harder and may not hold given the tight ±2-block consistency check? (Recommend: Theorem 1 only for v0.7; note completeness as open.)
5. **arXiv category + endorsement:** target `cs.CR` (primary) + `cs.LG`/`cs.DC` (cross-list)? You already have `OUTREACH-ARXIV-ENDORSEMENT.md` staged — confirm the endorsement path is real before we treat arXiv as the destination.

---

## 9. Self-review (spec author pass)
- **Placeholders:** none — every number is computed from code or marked "to measure".
- **Consistency:** definitions match `context.rs` / `commitment.rs` / `freshness.rs` / `mock.rs` field-by-field; Theorem 1 claims only what `mock.rs` enforces.
- **Scope:** single focused addition (model + theorem + impl section); construction-of-oracle and TEE-backend explicitly deferred.
- **Ambiguity:** the f_c-vs-consistency distinction is the one real ambiguity in the code; §4 surfaces it explicitly rather than papering over it.

---

*Spec ends. No paper prose to be written until the author approves §1–§8.*
