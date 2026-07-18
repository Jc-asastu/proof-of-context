# Research Landscape — Proof-of-Context applied to Agent Memory

**Scope:** prior-art scan for `paper-poc-agent-memory-v0.1` (agent memory validity as a renewable, cryptographically attestable verdict evaluated at read time).
**Method:** two independent 8-agent scans (2026-07-17), same 5 neighborhoods (temporal KGs, agentic-memory frameworks, RAG staleness, systems validity classics, direct claim-occupation check), each: 5 finders + 3 adversarial verifiers against primary sources. Run A: 41 raw → 35 deduped → 21 threatening → verified PAM, MemLineage, ContextNest (main-thread). Run B: 39 raw → 36 deduped → 20 threatening → verified tdcommons, MemGuard, PAM. PAM verified **twice independently** with converging verdicts.
**Date basis:** searches prioritized Feb–Jul 2026 (post-cutoff window).

---

## Verdict

**The claim is unoccupied.** No prior work found combines the five axes:

- (a) immutable fact / renewable attestation separation
- (b) per-entry binding to a canonical hash of the entry's *own source set*, bumped by source drift
- (c) read = settlement returning a graded verdict (still-valid / drifted-in-grace / expired-reverify), never hard-fail
- (d) renewal schedules imported from DeFi oracle design (heartbeat + verify-on-read + deviation threshold)
- (e) per-entry, per-renewal-event signed attestations (attributable, auditable re-verification)

Every near neighbor holds at most a *static* fragment of (b) or (e) — write-once hashes and one-shot signatures — and none has renewal, grace windows, or read-time freshness verdicts. Two of the three closest papers explicitly defer temporal validity to future work or lack the concept entirely.

**Urgency signal:** the three closest works are all from the last three months (PAM May 2026, MemLineage May 2026, ContextNest Jul 2026). The neighborhood is converging on "cryptography + agent memory" fast; the renewable-validity axis is the open seam. Timestamped priority matters here.

---

## Tier 1 — adversarially verified, must draw explicit lines in §3

### 1. Portable Agent Memory (PAM) — arXiv:2605.11032 (Ravindran, Microsoft, May 2026)
Transfer/portability protocol: memory exported as a BLAKE3 content-addressed Merkle-DAG, one Ed25519 signature by the operator over the whole artifact, verified **once** at rehydration with halt-on-first-failure.
**Verified not occupied:** no verdict states, no grace window, no renewal, no source-set binding (hashes are over each entry's own content, DAG parents link memories to memories, not to external sources). §6.2 lists "temporal validity windows" as **unimplemented future work**.
**Line to draw:** PAM proves an entry hasn't been tampered with *since export*; we prove an entry's grounding in the world is *still current at read time*. Their future-work section names our territory and leaves it open — strongest available "gap acknowledged, unfilled" citation.

### 2. MemLineage — arXiv:2605.14421 (May 2026)
Closest cryptographic antecedent. Per-entry SHA-256 source hash (`hsrc`) + write-time Ed25519 signature + inclusion proofs in an append-only log, checked at retrieval.
**Verified not occupied:** `hsrc` is computed **once at write and never re-evaluated** ("no mechanism for detecting source drift or refreshing hsrc"); read-time check is a deterministic replay of the write-time signature; failures **hard-drop** the entry; term-by-term search confirms zero occurrences of heartbeat / renewal / grace / expiry / deviation threshold; no DeFi oracle citation. Its trust labels (0–3) classify *lineage*, not temporal validity.
**Line to draw:** MemLineage answers "was this legitimately written by a trusted source" (provenance/forgery). We answer "is this still true relative to a source that may have changed since" (currency/renewal). Same cryptographic vocabulary, orthogonal question.

### 3. ContextNest — arXiv:2607.02116 (Jul 2026)
Governance layer beneath retrieval: typed Markdown vaults, SHA-256 hash-chained version histories, graph checkpoints, audit traces enabling **point-in-time reconstruction** of which knowledge versions informed an output.
**Verified main-thread against the primary abstract (2026-07-17):** no read-time verdicts, no valid/drifted/expired states, no renewal, no signatures. Framing is post-hoc auditability, not runtime validity.
⚠️ **Provenance note:** one finder's fetch hallucinated valid/drifted/expired verdicts and Ed25519 into this paper; a second finder caught it. Cite ContextNest only from the primary source. (The incident is itself a nice anecdote for the paper's thesis: an unverified memory of a source drifted from the source.)
**Line to draw:** reconstruction tells you what was current *when consumed*, after the fact; our gate tells the agent what is current *at the moment of the read*, before it acts.

### 4. Agent Preference Memory Integrity Verification System — Google/tdcommons defensive publication (2026)
`tdcommons.org/dpubs_series/10741/` — **the closest conceptual match found by either run** (Run B only; Run A missed it entirely — an argument for multi-run scans).
Preference entries with cryptographic provenance signatures + interaction-context hashes; confidence **decays over time and is re-verified** via a "multi-source corroboration ladder"; signed checkpoints, targeted rollback; graceful degradation to non-personalized output instead of hard-fail.
**Verified not occupied (abstract-level):** re-verification is triggered by *agent behavior* and an anomaly graph, not by a recomputed hash of the entry's own declared source set; verdict space is binary (personalized / non-personalized), no grace-window taxonomy; no oracle-style renewal cadence; no named signature scheme.
**Line to draw:** they re-verify *confidence in a preference against subsequent behavior*; we re-verify *a validity verdict against a recomputed source-set hash*, on an oracle-derived schedule, with a three-state settlement result at every read.
⚠️ **The one residual uncertainty in the whole scan:** the full PDF returns HTTP 403 on every retrieval path tried; the verdict rests on the (unusually detailed) abstract. A source-hash mechanism could hide in the disclosure body. **Top action item: retrieve the full PDF via authenticated access and re-verify before submission.**

### 5. MemGuard (ac12644, GitHub, 2026)
Sidecar validation layer beside Mem0/Zep/Letta: source-linked re-fetch, temporal decay curves, LLM drift detection, 0–100 trust score with flag/quarantine thresholds, and a structured verdict object at query time via MCP (fact + outcome + drift flag, non-hard-fail) — genuine partial overlap on (c), cite honestly.
**Verified not occupied (against source code, not README):** the only cryptography in the codebase is SHA-256 hash-chaining of the audit *log* (`src/utils/crypto.py`); zero asymmetric signatures, no per-entry source-set hash, no drift-bumped root, no grace window; renewal is Celery cron sweeps + priority queue, not oracle semantics. Term sweep of the README for Ed25519/Merkle/heartbeat/oracle/deviation/grace/attestation: zero occurrences.
**Line to draw:** MemGuard *scores trustworthiness* via re-fetch and LLM drift detection, logging events in a tamper-evident (not signer-attributable) chain; we *cryptographically bind a validity verdict* to a hashed, signed source set with oracle-style renewal.

---

## Tier 2 — adjacent, distinguish in Related Work

| Work | What it is | Why it doesn't occupy | Line |
|---|---|---|---|
| Origin-bound authority (arXiv:2606.24322, Jun 2026) | Machine-checked non-malleable binding of memory to origin, anti-poisoning | Write-time admission control; no renewal or read-time currency | Non-malleability of origin vs renewability of validity |
| Atlan KB freshness scoring (blog, 2026) | Freshness metadata scoring (`last_verified`, staleness thresholds); **explicitly draws the DeFi oracle heartbeat analogy** | Metadata + alerting only; no attestation, no signatures, no per-entry proof | The analogy is in the air industry-side; we formalize it as a cryptographic primitive. "Freshness scoring without attestation" |
| OpenAI "Dreaming V3" / Claude "Auto Dream" (products, 2026) | Background LLM re-curation: rewrite/delete stale memories (OpenAI: 9.4%→75.1% time-sensitive accuracy) | LLM-judgment batch curation at write/consolidation; no crypto, no read-time verdict, mutates the fact itself | Strongest industry contrast: they **rewrite facts**; we **renew attestations** over immutable facts. Complementary, not competing |
| Zep/Graphiti (arXiv:2501.13956) + TOKI (2606.06240) + MemStrata (2606.26511) | Bi-temporal KGs: valid_at/invalid_at, edge invalidation on **contradiction**, supersession rules | No cryptography, no source binding; invalidation triggered by contradiction *between memories* | Their trigger is internal contradiction; ours is drift *between a memory and its attested external sources* |
| Mnemom Integrity Protocol (product, 2026) | Hash-chained + Ed25519-signed checkpoints over agent *reasoning traces*; graded verdicts (clear/review/violation), never hard-fail | Object is behavior integrity, not memory-fact currency; no renewal schedule | Verdict-not-hard-fail semantics on a different object |
| witness-memory-chain (npm, 2026) | Per-entry Ed25519 + hash-linked chain + OpenTimestamps anchoring: proof memories were accumulated chronologically | Chain-of-custody authenticity; append-only past-facing proof, no validity renewal | Proves the memory's *history* is genuine, not that its *content* is current |
| SMSR (2606.12703), OWASP Agent Memory Guard, MemMark (2605.25002) | Poisoning defense / integrity baselines / authorship watermarking | Security-against-adversary framing; no temporal validity | Our §6 point exactly: their adversary is an attacker, ours is entropy |
| Composable Attestation (2603.02451) | Incremental re-attestation algebra for AI supply-chain components | Static 0/1 verification of system components, not memory facts | Adjacent algebra, different object |
| Vouch Protocol (spec, 2026) | Agent identity credentials; marketing mentions heartbeat-renewed session trust ("untrusted until renewed") | Spec only documents identity attestation; renewal machinery unconfirmed/aspirational; object is sessions, not memories | Closest use of "renewal" language; identity ≠ knowledge |
| ai-memory-mcp (alphaonedev, GitHub, 2026) | MCP memory server shipping the literal words "Ed25519 attestation": signed audit chain, `attest_level` (claimed/self_signed/agent_attested), TTL leases + heartbeat for multi-agent federation | Signs WHO wrote a memory (authorship provenance); TTL/heartbeat is recency- and coordination-based, never tied to the entry's source set; no drift detection, no verdict taxonomy | The artifact most likely to be cited against us on (e): it signs authorship, we sign a renewable *freshness verdict* bound to a source hash |
| Attestation-proxy pattern (mem0 blog, VeritasChain VCP, EU-AI-Act tooling, 2026) | Proxy signs a hash of the retrieved memory set *at read time* (SHA-256 + RSA/Ed25519), appends to tamper-evident audit log (~22ms/read) | Attests the retrieval *event* for compliance, not the content's continued validity; write-once record, no renewal, no verdict | Structurally closest to read=settlement, epistemically opposite: attests *access* ("this was read"), not *currency* ("this is still valid") |
| OCSP / OCSP stapling (RFC 6960) | CA-signed short-validity attestations of a certificate's status, refreshed and checked near connection time | Single-issuer, essentially binary verdict over one immutable cert; no multi-source drift, no root recomputation | **Adopt as ancestor, not competitor**: the real-world proof that fact/attestation separation with renewable signed verdicts works at scale — absent from memory systems |

---

## Tier 3 — background citations

- **STALE benchmark + CUPMem (arXiv:2605.06527):** best model detects invalidated memories only **55.2%** of the time → empirical motivation that LLM judgment alone cannot carry freshness; a protocol-level verdict is needed. Use in §1/§2.
- **Surveys:** Mnemonic Sovereignty (2604.16548), Evidence Tracing/Provenance (2606.04990), Always-On Agents (2606.30306), SSGM (2603.11768) — problem-space framing for §2.
- **"Don't Ask the LLM to Track Freshness" (2606.01435):** deterministic-over-LLM freshness resolution — supports our design instinct, mechanism is version-marker argmax only.
- **TierMem (2602.17913):** provenance = traceability-to-raw-log, not validity.
- **Systems classics (§3 lineage paragraph):** Gray/Cheriton leases, TTL semantics, cache invalidation, OCSP/certificate revocation — the pre-agent ancestry of "validity as a renewable grant"; cite as lineage, not competition.
- **Oracle AI Agent Memory 26.6 "Memory With Receipts" (product):** typed records + audit framing; page 403'd during scan, snippets show no crypto renewal. Re-fetch if it grows teeth.

## Unresolved / watch list

- **tdcommons full PDF (top priority):** HTTP 403 on every retrieval path; verdict rests on abstract only. Retrieve via authenticated/institutional access and re-verify axis (b) absence before submission.
- **Mnemom** and the **mem0 "attestation proxy" blog** (SHA-256 + RSA signing of retrieved memory sets, ~22ms): details pieced from snippets, not fully verified against primary sources. Verify before citing specifics.
- Medium-threat candidates across both runs carry finder-level distinction notes but no adversarial verification pass; none showed renewal semantics in any snippet. Run B additions worth a full-text pass before citing: MemLineage (done in Run A), ContextNest (done in Run A), Eywa (arXiv:2605.30771 — closest on axis (a): immutable Evidence vs derived Beliefs, write-time only), ElephantAgent (arXiv:2607.01919 — read-time digest check but for tamper-continuity against a ledger, not source drift).

---

## Implications for the paper

1. **§3 structure falls out of the tiers above:** tdcommons, MemLineage, PAM, ContextNest, MemGuard get named subsections; the rest get the table treatment.
2. **Sharpen the abstract's claim wording:** the defensible novelty is the *conjunction* (a)–(e) and specifically the renewal state machine on the read path. Static crypto-provenance (b/e fragments) is now crowded; do not let the abstract read as claiming "signed memories" alone.
3. **PAM §6.2 is the money citation:** a Microsoft paper explicitly naming temporal validity as unbuilt future work, two months before ours.
4. **STALE's 55.2% is the motivation number** for "the model cannot introspect its way to freshness; the substrate must carry the verdict."
5. **The Atlan post proves convergent pressure** on the DeFi-analogy framing. Publish before the analogy gets formalized by someone else — the same clock that ran on the position paper runs here.
6. **Add the hallucinated-ContextNest incident** to §6 (failure model) as a live example of confident stale/false recall: a system that trusted one unverified fetch would have shipped a wrong Related Work section.

---

Juan Cruz Maisú ♥
