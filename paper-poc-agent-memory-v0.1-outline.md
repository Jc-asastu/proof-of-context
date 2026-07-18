# Paper outline — Proof of Context applied to Agent Memory (v0.1)

**Working title.** *Proof-of-Context applied to agent memory: persisted context, renewable attestations, and the read-time freshness gate.*

**Status:** outline drafted 2026-07-17. Heart sections (§4 Specialization, §5 Read-Time Gate, §6 Failure Model, §7 Reference Instantiation) to be written first, per the applied-paper construction protocol.

---

## §1 — Introduction

*(authorial register: visual architecture, first-person, the introduction speaks in my voice. The heart sections that follow speak in standard academic register.)*

Why is memory anything at all?

Because it is alive while it happens. A memory is context that survived its moment. The moment passes. The context persists. That persistence is the entire value of memory and the entire danger of it.

Every agent memory system built today is a snapshot store.

Vector stores. Session summaries. Observation databases. Knowledge files. They all share one architecture: write once, trust forever. Nothing on the read path asks whether the world the memory describes still exists.

The position paper named this gap for computation. *A computation can be correct and still not be worth settling on.* The dark pool instantiation named it for markets. A quote against stale context is economically toxic.

Memory is the third surface. And it is the purest one.

A memory is nothing *but* context. There is no computation to verify underneath it. Strip the freshness question away from a memory and there is no residual correctness question left. Memory validity *is* contextual validity.

i argue the resolution is the one DeFi found and the settlement papers formalized.

The fact persists. The attestation renews.

A living memory is not one that never expires. Nothing that never expires is alive. A living memory is one whose validity is re-attested on a schedule, and whose reads carry the verdict.

That is the paper.

The heart sections (§4 through §7) speak in standard academic register. They map the types. They specify the gate. They model the failures. They report the instantiation.

This introduction speaks in mine.

## §2 — Background

- PoC position paper framework (one paragraph reminder: four types, settlement gate `G`, renewal semantics).
- The two prior applied directions: inference-as-a-service, agent economy infrastructure. This paper is the third specialization; the pattern of specialization is by now the program's method.
- The agent memory landscape 2026:
  - Vector / embedding stores (write-once, similarity recall, no validity dimension).
  - Agentic memory frameworks (MemGPT/Letta lineage, session summaries, observation logs).
  - Temporal knowledge graphs (Zep/Graphiti lineage: bi-temporal edges, invalidation on contradiction — the closest prior art, see §3).
  - File-based agent memory (CLAUDE.md-style instruction files, markdown knowledge bases).
- What none of these provide: an *attestable, renewable* validity verdict on the read path. At best a `created_at` timestamp the reader is free to ignore. At worst nothing.

## §3 — Related work

- Position-paper §3 reused, with memory-specific antecedents added:
  - Temporal knowledge graphs and bi-temporal modeling (valid-time vs transaction-time; Zep/Graphiti edge invalidation). Closest antecedent. Difference: invalidation there is triggered by *contradiction between memories*; here by *drift between the memory and its attested sources*, carried as a cryptographic commitment.
  - Cache invalidation and TTL literature. Difference: TTL is a passive timer with no re-attestation semantics and no source binding; expiry destroys or evicts. Here nothing is evicted; validity is demoted and renewable.
  - RAG staleness / retrieval-corpus versioning. Difference: corpus versioning tracks the store globally; the primitive here binds *each entry* to *its own source set* with a per-entry root.
  - Staleness-aware FL (the position paper's original antecedent) as the weighting-vs-gating precedent.
- The honest scoping: TTLs, invalidation, and temporal KGs are prior art for *detecting* staleness. The claim here is narrower and different: staleness as a *renewable attestation* with DeFi-imported schedule semantics (heartbeat, deviation, verify-on-read), reusing the settlement primitive unchanged.

## §4 — Specialization: the four types on the memory lifecycle

**Heart section.**

The mapping, entry lifecycle from left to right:

| Type | Settlement papers | Agent memory |
|------|-------------------|--------------|
| `f_c` | compute→commit lag | **write lag**: observation→save gap. A memory saved late is already a reconstruction, not a record. Bounded by save-at-occurrence discipline (the analogue of commit-at-completion: `f_c ≡ 0` when saving is part of the event loop). |
| `f_i` | input-world staleness | **source drift**: the files, URLs, code, conversations the memory derives from have changed since attestation. The axis with highest practical weight, exactly as in the agent-economy paper. |
| `f_m` | model-version distance | **world-version distance**: root bumps of the *project* the memory belongs to. Repo migrated, API replaced, project pivoted. Version-epoch distance, not wall time. |
| `f_s` | commit→settle window | **verification window**: last-verified→read gap. The read is the settlement. `max_fs` is the maximum age of a verification a read may rely on unflagged. |

- Per-type horizons are per-memory-*type*, not global: a preference memory (`user`) tolerates months; a codebase-state memory tolerates one commit. The thresholds struct transfers; the presets change.
- The context root specializes to a **source-set root**: canonical hash over the memory's declared sources (paths + content hashes, URLs + fetch digests, conversation ids). Any source affecting validity that is not in the root is the trivial evasion vector of position-paper §8, verbatim.

## §5 — The read-time gate

**Heart section.**

- The settlement gate refuses payment. The memory gate must not refuse recall: a hard-failing read makes memory useless. The gate's output moves from binary to the renewal verdict, and the verdict travels *with* the fact:
  - `StillValid` → serve, load-bearing.
  - `ProtectedByProspectiveOnly` → serve, flagged: sources bumped but within the grace window. The agent may act, and knows the ground shifted.
  - `ExpiredRequireRecommit` → serve as *unverified*, re-attestation required before the memory may bear load again. Recommit = re-verify the fact against current sources, producing a new attestation over the same fact (or a revision of it).
- Two renewal schedules, imported from oracle design:
  - **Heartbeat**: background re-attestation of the hot core on a cadence. Defines the "living nucleus": the subset of memory whose attestations are kept continuously warm.
  - **Verify-on-read**: lazy re-attestation triggered by the read itself, for the long tail. The cost argument: the tail is only paid for when touched.
  - Deviation threshold as the third lever: a source may drift *within a bound* without demoting the attestation (whitespace-only file change, timestamp-only page change).
- The fact/attestation separation stated formally: the store is append-only over facts; staleness mutates only the attestation layer. Nothing true is ever deleted for being old. This resolves "fresh forever" without contradiction: permanence of record, renewability of validity.

## §6 — Failure model

**Heart section.**

- The adversary here is mostly not economic; it is entropy. Drift is the default state of the world. The model must be honest about that difference from the settlement papers.
- Failure taxonomy (each mapped to its `f` type):
  - **Silent decay** (`f_i`/`f_m`): the baseline failure every snapshot store commits today. Acting on a memory whose sources moved. The agent-memory analogue of the stale-oracle exploit, self-inflicted.
  - **Late write** (`f_c`): the observation is reconstructed at save time; the store is faithful to the reconstruction, not the event.
  - **Confident stale recall** (`f_s`): verification exists but is old; the read treats it as current. The verdict's whole purpose is making this state visible.
  - **Poisoned renewal**: an attacker (or a buggy re-verifier) re-attests a false fact. Renewal amplifies trust; a bad renewal launders staleness into freshness. Mitigation: renewal attestations are signed, attributable, and auditable; the attestation chain is append-only history.
  - **Root under-scoping**: sources omitted from the source-set root never trigger demotion (§8 evasion, self-inflicted variant).
- What the primitive does NOT protect against, stated plainly per program discipline: a memory that was *wrong at write time* is fresh and false; freshness is not truth. The gate verifies contextual validity, not correctness of the original observation. That is the same boundary the position paper draws between `G` and the underlying compute proof.

## §7 — Reference instantiation

**Heart section.**

- Zero new primitives, one thin mapping layer. Direct reuse from `proof-of-context-impl`:
  - `WindowedRenewal` / `Renewal` trait: the verdict engine, unchanged.
  - Source-set root as `context_root`; fact hash as `output_hash`; verification event as the anchor; source drift as the canonical-root bump; read as settlement.
  - Per-memory-type `FreshnessThresholds` presets.
- Testbed: the Engram observation store running under this program (`juan-brain` project). The self-referential deployment:
  - The store that holds this research program's own history carries per-entry attestations.
  - The heartbeat covers the hot core (active projects); verify-on-read covers the archive.
  - Evaluation: measured drift rates per memory type over the store's real history (how fast do `project` memories actually rot vs `preference` memories), cost per re-attestation, fraction of reads served `StillValid` vs demoted.
- Reported as the dark pool was in §10.5 of the position paper: an engineering realization demonstrating the gate composes into a live read path, not a benchmark claim.

## §8 — What this paper does not claim

- Not a new cryptographic primitive. The primitive is the position paper's; this is its third specialization.
- Not a novelty claim over TTL, invalidation, or temporal KGs (§3 draws the lines).
- Not a truth oracle. Fresh ≠ true (§6).
- Not a memory *architecture* (how to store, embed, retrieve). Only the validity layer over whatever architecture exists.

## §9 — Conclusion: the arc

The program now instantiates on three surfaces.

The theory. The market. The mind.

Same skeleton in all three: a fact, a renewable attestation, a verdict at the moment of use. In the dark pool the witness attests price. In the compute papers it attests context of execution. In memory it attests knowledge.

Memory was always the purest case. It is context with nothing else underneath.

---

Juan Cruz Maisú ♥
