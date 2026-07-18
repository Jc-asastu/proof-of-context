# Proof of Context applied to Agent Memory

**Working draft, pre-1 — complete.** Heart sections (§4–§7) drafted first per the applied-paper construction protocol; frame sections (§2, §3, §8, §9) and the introduction (§1, author voice, written last) complete the draft as of 2026-07-18. Hybrid register: §1 and §9 speak in author voice; §2–§8 in standard academic register. Positioning grounded in `RESEARCH-LANDSCAPE-memory.md`; measurement artifacts in `measurements/`. Surrounding sections (§1, §2, §3, §8, §9) follow the outline at `paper-poc-agent-memory-v0.1-outline.md`. The introduction and conclusion in that outline are written in author voice; the heart sections below are in standard academic register per the paper's hybrid mode. Related-work positioning is grounded in `RESEARCH-LANDSCAPE-memory.md` (two independent 8-agent scans, 2026-07-17).

**Author:** Juan Cruz Maisú · Buenos Aires · `juancmaisu@outlook.com` · [github.com/Jc-asastu](https://github.com/Jc-asastu).

---

## §1. Introduction

*(authorial register: the introduction speaks in my voice. The heart sections that follow speak in standard academic register.)*

Why is memory anything at all?

Because it is alive while it happens. A memory is context that survived its moment. The moment passes. The context persists.

That persistence is the entire value of memory. And the entire danger of it.

Every agent memory system built today is a snapshot store. Vector stores. Observation databases. Session summaries. Knowledge files. Different architectures, one shared contract: write once, trust forever. Nothing on the read path asks whether the world the memory describes still exists.

The position paper named this gap for computation. *A computation can be correct and still not be worth settling on.* The dark pool named it for markets. A quote against stale context is economically toxic.

Memory is the third surface. And it is the purest one.

A memory is nothing *but* context. There is no computation underneath to verify. Strip the freshness question away from a memory and there is no residual correctness question left. Memory validity *is* contextual validity. The framework does not have to be bent to fit this surface. This surface is what the framework was always describing.

i argue the resolution is the one DeFi found and the settlement papers formalized.

The fact persists. The attestation renews.

A living memory is not one that never expires. Nothing that never expires is alive. A living memory is one whose validity is a renewable attestation, evaluated at the moment of use, and whose reads carry the verdict.

i also measured the gap. Not on a benchmark. On the store that holds this research program's own history — the sessions that produced the position paper, the dark pool, and this paper. Within one hundred days, 55% of its declared source references had silently decayed. The store told nobody. It had no way to say it. That number is §7; the machinery that would have said it is §5; what it costs is microseconds.

That is the paper.

The heart sections (§4 through §7) speak in standard academic register. They map the four freshness types onto the memory lifecycle. They specify the read-time gate. They model the failures — including the one the machinery itself introduces. They report the instantiation and the measurement.

This introduction speaks in mine.

---

## §2. Background

**The framework.** The Proof-of-Context position paper names a verification gap in decentralized ML protocols: existing primitives (proof-of-learning, zkML, TEE attestation, refereed delegation) answer *was the computation performed correctly*, and none answers *is it still valid to settle on*. The framework decomposes that second question into four freshness types — `f_c` computational, `f_m` model, `f_i` input, `f_s` settlement — enforced by a settlement gate `G` over signed commitments to an execution-context root, with renewal semantics (prospective-only root bumps, settlement windows) governing in-flight commitments when the canonical context moves. A reference implementation ships the objects and the gate; an on-chain instantiation (an agent-to-agent dark pool) demonstrates the gate composing into a live settlement path.

**The method of the applied papers.** Two prior papers specialize the framework to a surface and report what the specialization reveals: v0.1-Inference found the four types partition asymmetrically (1-vs-3) under a centralized-provider threat model; v0.1-Agent-Economy found each type maps to a distinct infrastructure endpoint class and that four independent integrations converge on one wire format. Specialization-then-report is by now the program's method, and this paper is its third application. Each surface so far has yielded one structural result the framework did not predict but accommodates; on this surface it is the cost asymmetry of §4.2 and the renewable/write-final partition of §4.4.

**The surface: agent memory in 2026.** Persistent memory has become a standard component of deployed agents, in four broad architectural families: vector and embedding stores (write-once entries under similarity recall); agentic memory frameworks in the MemGPT/Letta lineage, with managed products (Mem0, Zep) adding consolidation, decay-based ranking, and background curation; temporal knowledge graphs (Graphiti), which carry bi-temporal validity intervals per fact edge and close them on contradiction; and file-based instruction memory (CLAUDE.md-style), read whole into context. Orthogonally to architecture, a security literature has formed around the write path — poisoning, injection, provenance — surveyed in §3.

**What none of these provide.** Across all four families, an entry's validity at the moment of use is either undefined (vector stores, file memory), a passive timestamp the reader is free to ignore (TTL fields, `valid_until` columns), a ranking signal (decay), or a write-time judgment (contradiction-triggered interval closure, curation rewrites). In no deployed system is validity an *attestable, renewable verdict evaluated on the read path*. The field's own surveys name the gap: staleness detection and evidence-aware verification of memory are flagged as open problems, and the empirical record (STALE benchmark: best-model detection of invalidated memories at 55.2%) establishes that model judgment alone does not close it. The measurement of §7.3 adds the missing quantitative half: in a production store, the majority of declared source references decay within a single quarter, silently.

---

## §3. Related work

Positioning is grounded in a two-run adversarially-verified prior-art scan (method and full matrix in the companion document `RESEARCH-LANDSCAPE-memory.md`). The composite claim — renewable, source-bound, cryptographically attestable validity verdicts at read time — is unoccupied; every constituent axis has a near neighbor. This section draws the lines, nearest first.

### 3.1 Nearest neighbors, verified against primary sources

**Preference-memory integrity verification (defensive publication, 2026).** The closest conceptual match: preference entries carry cryptographic provenance signatures, confidence values *decay over time and are re-verified*, checkpoints are signed, and failure degrades gracefully to non-personalized output. The distinction: its renewal is triggered by *subsequent agent behavior* against an anomaly graph — it re-verifies confidence in a preference against how the user acts — where this construction re-verifies a validity verdict against *a recomputed hash of the entry's own declared source set*, on an oracle-derived schedule, with a three-state settlement result at every read rather than a binary personalize/don't gate. (Full-disclosure text was not retrievable at scan time; the assessment rests on the published abstract, and the residual uncertainty is carried openly in §8.)

**Portable Agent Memory (2026).** The closest cryptographic machinery: BLAKE3 content-addressed Merkle-DAG over memory entries, Ed25519 root signature, verification at rehydration. The distinction is the object of proof: PAM proves a memory artifact was not corrupted *in transit* — one signature over the whole bundle, checked once at import, halt-on-first-failure — while this construction proves an entry's grounding has not drifted *over time*, per entry, at every read, with graded degradation. PAM's own future-work section lists "temporal validity windows" as unbuilt, naming this paper's territory and leaving it open.

**MemLineage (2026).** The closest cryptographic antecedent on the write path: per-entry source hashes and Ed25519 signatures with transparency-log inclusion proofs, checked at retrieval. The check, however, is a deterministic *replay of the write-time signature* — the source hash is computed once and never re-evaluated against the live source, verification failure hard-drops the entry, and no renewal, grace, or expiry concept appears. MemLineage answers *was this legitimately written* (provenance, forgery); this paper answers *is this still true relative to a source that may have changed since* (currency, renewal). Same cryptographic vocabulary, orthogonal question.

**ContextNest (2026).** Hash-chained version histories over context artifacts with point-in-time reconstruction: the audit answer to *what was current when it was consumed*, after the fact. The gate answers *what is current at the moment of the read*, before the agent acts. Ledger versus verdict.

**MemGuard (2026).** The closest industry sidecar, and the system with genuine partial overlap on the verdict axis: it returns a structured trust verdict alongside the fact at query time, degrades rather than deletes, and re-checks sources on a schedule. Everything cryptographic is absent (verified against its source: the only primitive is SHA-256 chaining of the audit log — no signatures, no per-entry source root, no grace semantics), so its verdicts are unattributable scores rather than attestations: trustworthiness estimation, not validity settlement.

### 3.2 Adjacent systems, one line each

Bi-temporal knowledge graphs (Zep/Graphiti) close a fact's validity interval when a *contradicting memory* arrives — write-time, intra-store, uncryptographic; our trigger is drift between the entry and its *external* attested sources, at read time. Background-curation products (memory "dreaming") rewrite or delete stale facts in place — repairing the present by destroying the past; recommit semantics (§5.3) renew attestations over immutable facts. Write-time origin-binding and lineage enforcement (TMA-NM and kin) authenticate *who may write and whence*, the complementary layer under adversarial poisoning — this paper's adversary is entropy (§6), and the joint deployment is the obvious composition. Read-time attestation proxies (compliance tooling) sign *what was retrieved and by whom* — access attestation, not currency. Authorship-signing memory servers attest *who wrote* an entry; the verdict here attests whether what was written *still holds*. Ranking-decay features age everything by recency; verdict-aware ranking (§5.4) ages only what the world has evidenced moving past. Verifiable-credential status lists revoke issuer-driven identity claims; the object here is a memory fact and the verdict is drift-driven.

### 3.3 Ancestry, claimed as such

Three mechanisms are adopted as lineage rather than distinguished as competition, because their maturity in adjacent domains is evidence *for* the transplant: the **lease** (renewal-before-expiry as the price of trusting cached state, 1989); **OCSP stapling** (a short-lived signed validity attestation over an immutable underlying object, refreshed near read time — the fact/attestation separation, deployed at internet scale); and the **oracle heartbeat/deviation pair** (the renewal schedule, hardened in production DeFi, and the position paper's original analogical source). Each solves this paper's problem-shape in its own domain; none has been carried to agent memory; the surveys confirming that absence are cited in §2. The contribution claimed is the transplant and its consequences on the memory surface — the class-partitioned horizons, the renewable/write-final split, the read-as-settlement semantics — not the levers themselves.

---

## §4. Specialization: the four types on the memory lifecycle

The Proof-of-Context framework decomposes attestation freshness into four types, introduced in the position paper §6: `f_c` (computational), `f_m` (model), `f_i` (input), and `f_s` (settlement). The first applied paper (v0.1 Inference) showed the four types partition asymmetrically under a centralized-provider threat model. The second (v0.1 Agent Economy) showed each type maps to a distinct class of infrastructure endpoint, with `f_i` structurally dominant by traffic.

This paper specializes the framework to agent memory. The specialization differs from the previous two in one structural respect: on the prior surfaces, the object under attestation was a *computation* (a gradient, an inference, a data response), and context was the environment the computation depended on. A memory entry has no computation underneath. It is persisted context and nothing else. Strip the freshness question away from a memory and no residual correctness question remains; memory validity *is* contextual validity. The four types therefore do not attach to a computation's environment — they attach to the lifecycle of the entry itself.

### 4.1 The object under attestation

A memory entry is modeled as a triple:

- **the fact** — the persisted content. Immutable: staleness never mutates or deletes it. A revision produces a new fact; the store is append-only over facts.
- **the source set** — the declared collection of external referents the fact derives from and depends on: files (path + content hash), URLs (address + fetch digest), conversation or event identifiers, and other memory entries (by fact hash). The source set is committed as a canonical root (§4.3).
- **the attestation** — a signed commitment binding the fact hash, the source-set root, and the verification anchor (when the binding was last checked). This is the renewable component: re-verification produces a new attestation over the same fact; the fact's validity status at any moment is a function of its most recent attestation, never of the fact itself.

The mapping to the settlement primitive is direct. The source-set root occupies the position of the execution-context root; the fact hash occupies the position of the output hash; the verification event occupies the position of the commit; and **the read occupies the position of the settlement**. A read is the moment the protocol decides whether the entry is still worth relying on — exactly the question the settlement gate decides for a computation, transposed from "still worth paying for" to "still worth acting on."

### 4.2 Per-type mapping

**`f_c` — write lag.** The gap between when an observation occurred and when it was persisted. On the compute surfaces, `f_c` measures a worker sitting on a result; on the memory surface it measures an agent reconstructing an event after the fact. A memory saved at the end of a long session is not a record of the event; it is a record of the agent's later reconstruction of the event, with whatever loss and confabulation the delay introduced. The structural resolution is the same one the reference implementation adopts for computation (commit-at-completion): a save-at-occurrence discipline, in which persisting is part of the event loop rather than a deferred batch, makes `f_c ≡ 0` by construction. Where discipline fails, `f_c` is carried as an honesty field — the entry records both the event time and the write time, and a large gap is grounds for down-weighting at read.

**`f_i` — source drift.** The distance between the source set as attested and the source set as it exists now. A memory whose config file has been edited, whose referenced URL now serves different content, or whose underlying code has been refactored is `f_i`-stale: the fact was true, and no longer describes the world. This is the axis with the highest practical weight, consistent with its position on both prior surfaces, because it is the axis on which the baseline architecture fails silently — no snapshot store detects it, and the empirical literature confirms that model judgment alone cannot compensate (the best model in the STALE benchmark identifies invalidated memories 55.2% of the time, barely above chance for a binary decision). `f_i` is measured by recomputation: rehash the current source set and compare against the committed root. It is the only type whose measurement requires touching the world.

**`f_m` — world-version distance.** The number of epochal transitions of the *project or domain* the memory belongs to since attestation. `f_m` is distinct from `f_i`: source drift is a change in the content of a declared referent; world-version distance is a change in the referent space itself. A repository migration, an API deprecation, a project pivot — after such a transition, a memory's sources may be unchanged in content yet the memory is stale because the namespace it describes has been superseded. The limiting case makes the distinction sharp: a source that has ceased to exist is not `f_i`-drifted (there is nothing to rehash against); it is evidence of an `f_m` event. Measured in epoch distance against a domain lineage — the number of declared world-version bumps between attestation and read — exactly as model freshness is measured in root bumps on the compute surfaces, and not in wall time.

**`f_s` — verification window.** The gap between the entry's most recent verification and the present read. Because the read occupies the settlement position, `f_s` is the universal gate: every read exercises it, whatever the state of the other three types. An entry whose sources are unchanged but whose last verification is older than the applicable window is not served as load-bearing; the verification itself has gone stale, and the read's verdict says so. `max_f_s` is the maximum age of a verification a read may rely on without flagging — the direct analogue of the settlement window, and the parameter that heartbeat scheduling (§5) exists to keep satisfied for the store's hot core.

The asymmetry of this surface, in the tradition of the inference paper's 1-vs-3 partition: **`f_s` is universal but content-blind; `f_i` is load-bearing but costly.** Every read decides `f_s` for free (a clock comparison). Deciding `f_i` requires touching the world. The renewal schedules of §5 are precisely the machinery for spending the costly check where it matters, while the cheap check gates everything.

### 4.3 The source-set root

The source-set root is the canonical commitment over the entry's declared sources. The reference construction: each source contributes a pair `(identifier, content-hash)`; pairs are sorted by identifier; each is serialized with a length-prefixed encoding; the root is the SHA-256 over the concatenation. The construction is deliberately identical in shape to the execution-context root of the position paper §8, and it inherits that section's load-bearing warning verbatim: **any referent affecting the fact's validity that is omitted from the source set is a trivial evasion vector.** An entry that declares one config file but silently depends on three is unverifiable on the axis that matters, while presenting as verified. Under-scoping the root is the memory-side analogue of leaving the attention implementation out of the execution context — the committed surface must cover the sensitive surface.

Three scoping rules follow. First, sources are declared at write time by the writer, and the declaration is itself part of what re-verification audits: a re-verifier that discovers an undeclared dependency widens the source set in the renewed attestation. Second, memory-to-memory dependencies enter the root by fact hash, so that a revision of an upstream memory bumps the roots of its dependents — drift propagates through derivation chains rather than stopping at the first hop. Third, a **deviation threshold** bounds which recomputed differences count as drift: a source whose canonical content-hash is unchanged under normalization (whitespace, timestamps, serialization order) has not drifted, and per-source-type normalizers are part of the threshold specification. Without this bound, the gate rejects too many honest entries — the memory-side instance of the position paper's constraint 4, that binary schemes reject honest workers and graceful degradation per type is a required primitive.

### 4.4 Horizons are per memory class, not global

The threshold structure transfers from the reference implementation — one struct carrying a horizon per type — but its calibration does not. On the compute surfaces, thresholds are set per deployment (one preset for a mainnet, one for a testnet). On the memory surface, a single global preset is wrong by construction, because entries of different classes age at rates separated by orders of magnitude. A user-preference memory and a codebase-state memory are both memory entries; one tolerates an `f_s` window of months, the other of days or a single upstream commit.

The specialization is therefore **per-class threshold presets**: the store's memory taxonomy (preference, project state, codebase state, external reference, event record) carries a threshold preset per class, and an entry's class selects its preset at attestation time. Representative shapes, stated as design targets for the instantiation of §7 rather than as calibrated values:

| Class | `f_i` sensitivity | `f_s` window (order) | Dominant staleness mode |
|---|---|---|---|
| preference / identity | low — sources rarely drift | months | superseded by explicit revision (`f_m`-like) |
| project state | high | days | source drift + project epochs |
| codebase state | highest — one commit can invalidate | hours–days | source drift (`f_i`) |
| external reference (URL, doc) | high, but deviation-threshold-heavy | days–weeks | content drift under stable address |
| event record | none — the past does not drift | unbounded for `f_i`; `f_c` at write is the only live axis | write lag only |

The event-record row states a boundary result: a memory of *what happened* (as opposed to *what is*) has an empty live source set once written — the past cannot drift — so its validity is decided entirely at write time (`f_c`) and its attestation never requires renewal. The taxonomy thus partitions the store into a renewable region and a write-final region, and the renewal machinery of §5 applies only to the former. Empirical calibration of the per-class horizons — measuring actual drift rates per class over a production store's history — is the evaluation task of §7, occupying the position the triple-anchor calibration (§11) occupies in the position paper.

The anchor itself also relaxes on this surface, and the relaxation should be stated honestly rather than imported unexamined: the compute surfaces anchor commitments to three adversarially-independent clocks because settlement is adversarial and a worker profits from lying about time. A memory store's re-verifier is typically the same principal as its reader; the threat is entropy and self-deception, not a counterparty (§6 develops this). The anchor accordingly reduces to a wall-clock timestamp plus per-source revision identifiers, and the triple-anchor slash machinery does not transfer. What does transfer undiminished is attributability: attestations remain signed, so that *which verifier vouched, when, against which root* remains auditable — the property §6 identifies as the defense against renewal laundering.

### 4.5 Boundary discussion: the decomposition survives, with one collapse and one exclusion

Following the method of the prior applied papers, we ask whether the surface requires types beyond the framework's four, and whether any of the four collapses.

**No new type is required.** The candidate that most appears to demand one — an entry that was wrong at the moment of writing — is excluded deliberately: wrongness-at-write is a correctness failure, not a freshness failure, and the gate attests contextual validity, not truth (§6 states this boundary as the program's discipline requires). The framework's reservation holds.

**One near-collapse is real and should be named.** `f_c` and `f_s` both measure gaps on the attestation timeline (observation→write and verification→read respectively), and under a save-at-occurrence discipline with verify-at-write, the two coincide at entry creation. They separate strictly afterward: `f_c` is fixed once at write and never changes; `f_s` is recomputed at every read against a moving clock. The collapse is momentary, not structural — but an implementation that conflates the two fields at creation time will silently lose the write-lag honesty record, so the schema must carry them separately even where their initial values are equal.

**`f_m` does not collapse into `f_i`,** for the reason given in §4.2: content drift and namespace supersession are measured by different mechanisms (rehash versus lineage distance), fail in different directions (a vanished source breaks the rehash entirely), and demand different renewal responses (re-verify versus re-derive). The two prior applied surfaces reached the same conclusion for their own versions of this pair, which is itself weak evidence that the distinction is a property of the framework rather than of any one surface.

We conclude the four-type decomposition is well-shaped for agent memory with no additions, one documented momentary coincidence (`f_c`/`f_s` at creation), and one boundary exclusion (correctness-at-write), and that the surface exhibits the same single-axis dominance (`f_i` by cost and consequence, `f_s` by universality) that the prior specializations found in their own forms.

---

## §5. The read-time gate

The settlement gate of the position paper is a refusal machine: a commitment that fails a predicate is not paid. That semantics cannot transfer to memory unmodified. A memory store that refuses recall is not a safer memory store; it is a lobotomized one, and its operator will route around it. The gate on this surface must never make the fact unavailable. What it withholds is not the fact but the fact's *standing*.

### 5.1 The verdict

A read takes an entry and the present moment and returns a pair: the fact, and a verdict over the entry's most recent attestation. The verdict is a function of four inputs — the attestation, the current canonical state of the source space (recomputed root and/or lineage position, per the type being decided), the read clock, and the threshold preset selected by the entry's class (§4.4). It takes one of three values, inherited unchanged from the reference implementation's renewal policy:

- **`StillValid`.** The attested root matches the current canonical root and the verification window is open. The fact is served load-bearing: the agent may act on it without qualification.
- **`ProtectedByProspectiveOnly`** — on this surface, *drifted-in-grace*. The source space has moved since attestation, but the verification window is still open. The fact is served with the flag: the agent may act, and knows the ground has shifted. The grace window inherits its purpose from prospective-only semantics on the compute surface: there, it protects in-flight workers from retroactive invalidation; here, it protects the read path from thrash — a store whose every upstream edit instantly demotes every dependent entry serves flags on every read and trains its consumer to ignore them. Drift within the window is information, not an alarm.
- **`ExpiredRequireRecommit`.** The source space has moved and the window has closed, or the verification itself has outlived `max_f_s`. The fact is still served — nothing is withheld — but as *unverified*: the verdict states that no current attestation supports it, and re-verification is required before it may bear load again.

The three-state space is a deliberate departure from the two nearest prior systems, both of which hard-fail: the portable-memory protocol halts rehydration on first verification failure, and the lineage-enforcement system drops entries whose write-time signature fails to replay. Both semantics are correct for their objects (transport integrity, provenance) and wrong for currency: a stale memory is not a corrupt memory, and treating the two identically either destroys usable knowledge or forces the operator to disable the check.

### 5.2 Renewal schedules

Section 4.2 established the surface's cost asymmetry: `f_s` is decided free at every read, `f_i` requires touching the world. The renewal machinery is the policy for spending the costly check. It is imported from oracle design, where the identical asymmetry (every consumer read is cheap; every feed update is costly) produced a settled two-lever structure over years of production hardening:

**Heartbeat.** A background process re-verifies a designated subset of the store — the *hot core* — on a cadence chosen so that no hot entry's verification age approaches `max_f_s`. Membership in the hot core is a policy over class, access recency, and load-bearing frequency: the entries the agent is currently acting on, kept continuously warm. This is the component that makes the memory *live* rather than merely auditable — the store's validity layer is maintained ahead of the reads that depend on it, and a hot read almost always lands `StillValid`.

**Verify-on-read.** The long tail is not heartbeated. A tail read that lands `ExpiredRequireRecommit` triggers re-verification at that moment, lazily; the cost of the tail is paid only when the tail is touched, and an entry never read again never costs another verification. The first read after a long dormancy is served unverified and repaired; the second read is served verified.

**Deviation threshold.** The third lever bounds what counts as drift at all (§4.3): recomputed differences that survive per-source-type normalization are drift; differences that normalize away are not. This is the lever that keeps the other two honest — without it, heartbeats burn verification budget re-attesting entries whose sources changed only cosmetically, and verify-on-read demotes entries over whitespace.

The lineage of this structure is worth stating plainly, because it strengthens rather than weakens the claim. Renewal-before-expiry is the lease, thirty-five years old. A short-lived signed validity attestation over an immutable underlying object, refreshed near read time, is certificate stapling. A feed that updates on deviation-or-heartbeat, whichever first, is the production oracle pattern. Each of these is proven at scale in its own domain; none has been transplanted to agent memory, and the surveys of that field name the gap explicitly. The paper's §5 contribution is the transplant, not the levers.

### 5.3 Recommit semantics

Re-verification of an expired or drifted entry has three possible outcomes, and the append-only discipline of §4.1 governs all of them:

1. **Sources unchanged** (expiry was pure `f_s`): a renewed attestation is issued over the same fact and the same root. The fact's standing returns to load-bearing; nothing else changes.
2. **Sources drifted, fact revisable**: the re-verifier derives the fact's successor from the current sources and writes it as a *new* entry, attested against the recomputed root, carrying a derivation link to its predecessor. The predecessor is not deleted; it is closed — its final attestation marks it superseded, and it remains readable as history ("what the store believed, and until when, and why it stopped").
3. **Sources drifted, fact not re-derivable** (referents vanished, domain superseded — the `f_m` outcome): the entry is closed without a successor. It remains readable as history; no current attestation supports it, and none ever will.

Outcome 2 is where the fact/attestation separation earns its keep, and where this design departs most sharply from the strongest industry alternative. Background-curation systems that detect staleness respond by *rewriting the memory in place* — mutating or deleting the stale fact. That repairs the store's present at the cost of its past: the system can no longer answer what it believed at a given time, cannot audit how a belief evolved, and a faulty curator destroys knowledge irreversibly. Under recommit semantics the fact is immutable, revision is append, and every attestation ever issued survives in the entry's attestation history. The store's present is a view (latest attestation per chain); the store's past is the chain itself.

### 5.4 The gate composes with retrieval; it does not replace it

The gate is a validity layer, not a memory architecture (§8 restates this as a non-claim). Retrieval — embedding, ranking, search — decides which entries are *relevant*; the gate decides, of the retrieved entries, which are *current*. The two compose in either order, with one integration worth naming: a retrieval layer may use the verdict as a ranking signal (demote expired entries rather than merely flagging them), which recovers the behavior of recency-decay ranking systems as a degenerate case — decay ranking is verdict-blind demotion by age; verdict-aware ranking is demotion by *evidenced* staleness. The former ages everything; the latter ages only what the world has actually moved past.

---

## §6. Failure model

The settlement papers model an economic adversary: a counterparty who profits from settling stale work. This surface has, in its common deployment, no counterparty. The store, the re-verifier, and the reader are typically one principal, and nobody profits when the agent acts on a dead config path. The adversary here is entropy: drift is not an attack on the system but the default behavior of the world, and the model must be honest about that difference — importing the settlement papers' adversarial machinery wholesale would be theater (§4.4 already discharged the triple-anchor on these grounds). What survives the change of adversary is the *structure* of failure, which maps onto the four types exactly.

### 6.1 Failure taxonomy

**F1. Silent decay** (`f_i`, `f_m`) — the baseline failure, and the one every snapshot store in deployment commits today. An agent acts on a memory whose sources have moved: the deploy region that migrated, the API that was deprecated, the file that was refactored. Structurally this is the stale-oracle exploit of the position paper §5 — a true value from the wrong moment — with the attacker deleted and the loss self-inflicted. It is the failure the entire construction exists to make *visible*: the gate does not prevent the world from moving; it prevents the store from concealing that it has.

**F2. Late write** (`f_c`). The entry records a reconstruction rather than an observation. This failure is complete at write time and no renewal repairs it — re-verifying a confabulated memory against its declared sources re-attests the confabulation. The defense is structural (save-at-occurrence, §4.2) plus the honesty field: a reader can see the observation-to-write gap and weigh the entry accordingly.

**F3. Confident stale recall** (`f_s`). A verification exists, is old, and is treated as current. This is the failure mode of *checked* systems, as F1 is the failure mode of unchecked ones: the presence of a past verification launders staleness into apparent validity ("it was checked" decays into "it is correct"). The verdict's entire purpose is to make verification age a first-class output of every read rather than a buried timestamp.

**F4. Poisoned renewal.** The failure mode the renewal machinery itself introduces, and therefore the one this section must own rather than deflect: a faulty or compromised re-verifier issues a fresh attestation over a false fact, or against an under-scoped root. Renewal amplifies trust; a bad renewal is worse than no renewal, because it resets the very signal (`f_s`) that would have prompted scrutiny. The mitigations are the properties §4.4 retained when it discharged the rest of the adversarial machinery: attestations are signed and attributable, so every renewal names its verifier; attestation history is append-only, so a laundering event is permanently in the record and a bad verifier's entire output is enumerable after discovery. Attributability does not prevent the poisoned renewal — it makes it auditable and revocable-in-bulk, which is the same settlement the certificate-revocation lineage reached for the same problem.

**F5. Root under-scoping** (§4.3). Sources omitted from the declaration never trigger demotion; the entry presents as verified on a surface narrower than its true dependency set. This is the self-inflicted variant of the position paper's §8 evasion vector, and it is bounded the same way: the committed surface must cover the sensitive surface, and re-verification audits the declaration itself, widening the set when it finds undeclared dependencies.

### 6.2 What the gate does not protect against

Stated plainly, per the program's discipline:

**Freshness is not truth.** An entry wrong at the moment of writing is fresh and false, and every verdict it ever receives will be `StillValid` so long as its (correctly hashed, faithfully unchanged) sources stand. The gate attests that a fact's declared grounding has not moved — not that the fact was ever a sound reading of that grounding. This is the same boundary the position paper draws between the settlement gate and the underlying compute proof: `G` composes with a correctness primitive, it does not supply one.

**The verdict binds the read, not the reader.** The gate hands the agent a flagged or unverified fact; nothing forces the agent to weigh the flag. A model that confabulates over a demoted memory fails downstream of the gate. The claim is that the substrate carries the verdict — the empirical record (§4.2's 55.2%) shows the model cannot be relied on to *generate* the verdict, and no claim is made that it can be forced to *heed* it.

**Adversarial poisoning at write time is out of scope.** A hostile writer injecting false memories through legitimate channels is the subject of the origin-binding and lineage-enforcement literature surveyed in §3, which addresses *who may write* and *whence*. This construction addresses *whether what was written still holds*. The two are complementary layers over the same store, and the composition — origin-bound writes under renewable read-time validity — is the obvious joint deployment; this paper claims only the second layer.

### 6.3 An incident from this paper's own construction

The failure model is not hypothetical, and the construction of this paper supplied its own exhibit. During the prior-art scan (§3; method in the companion landscape document), an automated survey agent reported that a governance-layer system shipped three-state read verdicts and Ed25519 signatures — a finding that, had it held, would have occupied the core of this paper's claim. The report was confident, specific, and false: adversarial re-verification against the primary source found no such mechanisms, and a second independent scan confirmed their absence. The erroneous finding was an unverified memory of a source, drifting from the source, presented with full confidence — F1 and F3 in a single artifact, caught precisely by the discipline this paper proposes making mechanical: re-verification against the declared source before the memory was permitted to bear load. The Related Work section of this paper exists in its current form because a renewal gate, applied manually, caught a stale attestation before settlement.

## §7. Reference instantiation and measurement

Following the program's discipline, this section reports what is implemented and measured, and states plainly what is designed but not yet wired. Three results are reported: the mapping onto the reference crate (implemented, tested), a drift measurement over a production observation store (measured, with method caveats), and the deployment design over that store (specified; instrumentation pending).

### 7.1 The mapping requires zero new primitives

The verdict engine of §5 is the reference crate's renewal policy, reused unchanged. The mapping, implemented as a worked example in the reference implementation repository (`examples/memory_freshness.rs`):

| Memory concept (§4–§5) | Crate object |
|---|---|
| source-set root | `context_root` of the commitment |
| fact hash | `output_hash` |
| verification event | commit anchor |
| source drift | canonical-root bump |
| read | settlement / renewal evaluation |
| re-verification | recommit |
| verdict | `RenewalOutcome` (`StillValid` / `ProtectedByProspectiveOnly` / `ExpiredRequireRecommit`) |

The example constructs a memory entry over a two-source set, attests it with a real Ed25519 signature, and exercises the full verdict cycle: unchanged sources yield `StillValid`; an edited source within the window yields the grace verdict; past the window, `ExpiredRequireRecommit`; recommitting against the current sources (a §5.3 outcome-2 revision) returns the renewed entry to `StillValid`. That the commitment type accepted a non-ML domain without modification — the source-set root simply occupies the context-root position — is itself evidence for the position paper's venue-neutrality claim. Costs carry over from the position paper's §10.4 unchanged, since the objects are the same: ~0.2 µs per root hash, ~11.5 µs per commitment, ~25 µs per verification. At those figures a full re-attestation sweep of the store measured below prices in well under a millisecond of cryptographic work; renewal cost on this surface is dominated entirely by *fetching the sources*, never by the attestation itself — consistent with §4.2's placement of the entire cost burden on `f_i`.

### 7.2 The testbed store

The measurement target is a production Engram observation store: the persistent memory of the working sessions that produced this research program, including this paper. At measurement time (2026-07-18) it held **751 observations** spanning **100 days** (median age 39 days, P90 93 days), typed by the store's own taxonomy (discovery, decision, architecture, session summary, bugfix, config, preference, among others). The self-referential choice is deliberate, per the outline's dogfooding argument, and it has a methodological consequence worth stating: the store was written under no anticipation of this measurement — its authors (human and model) recorded file paths as informal prose convention, not as a declared source set — so the store is an unbiased specimen of exactly the baseline architecture §4.1 describes: facts persisted, sources named informally, nothing committed, nothing renewed.

### 7.3 Drift measurement: the majority of source references decayed within 100 days

**Method.** Every observation's content was scanned for declared absolute file paths (the store's prose convention for naming affected artifacts). Each declared path was resolved against the live filesystem: a missing path is scored as a *vanished* referent (the `f_m`-style limiting case of §4.2); an existing path whose modification time postdates the observation is scored as *drifted* (an `f_i`-style event); an existing path unmodified since the observation is *stable*. 68 observations declared 107 distinct paths.

**Result.** Of the 107 declared paths, **26 (24%) had vanished and 33 (31%) had drifted — 55% of all declared source references were stale** at measurement time, in a store whose oldest entry is one hundred days old. At the observation level, 42 of the 68 path-bearing observations (62%) carried at least one vanished or drifted reference. Per-class rates order as §4.4's taxonomy predicts — state-describing classes decay fastest: architecture 78% stale (n=9 path-bearing), session summaries 71% (n=14), decisions 70% (n=10), against discovery notes at 47% (n=17). The class-level sample sizes are small and the ordering is reported as consistent-with rather than confirmatory; the aggregate 55%/62% figures are the load-bearing numbers.

**What the measurement's own limits demonstrate.** The method's caveats are not incidental — each one is the absence of a primitive this paper proposes, encountered as a measurement obstacle:

- *Modification time is a proxy, and both leaky and coarse.* A path's mtime can move on a cosmetically-normalized edit (over-counting) and content can be reverted after a touch (over-counting again), while a moved-and-renamed file scores as vanished rather than drifted. The honest instrument would be **rehashing against a committed source-set root** — which does not exist, because the store never committed one. The measurement is coarse precisely because the primitive is missing.
- *No deviation threshold exists to apply.* Some fraction of the 31% "drifted" is normalization-invisible churn; without per-source normalizers (§4.3) there is no principled way to subtract it. The gate's third lever is missing from the measurement for the same reason it is missing from the store.
- *Path extraction is inference, not declaration.* The scan reconstructs an approximate source set from prose — exactly the under-scoping failure F5 warns about, here committed by the measurement itself out of necessity. Declared source sets would make the measurement exact and the scan unnecessary.

The circularity is the finding: **a store built without the primitive cannot even be audited for staleness except approximately.** The 55% figure is best read not as a precise drift rate but as a lower-bound demonstration that silent decay (F1) is the majority condition of a production agent-memory store within a single quarter — and that measuring it precisely requires the very commitment structure whose absence caused it.

**Cost of the sweep.** The full measurement — 751 observations scanned, 107 paths resolved — completes in seconds on commodity hardware, dominated by filesystem stat calls. A heartbeat re-verifying the store's entire path-bearing subset is therefore affordable at any plausible cadence, empirically confirming the §5.2 cost model on this store's scale.

### 7.4 Deployment design and what is not yet claimed

The wiring of the full gate onto the store follows §5 directly: a thin layer that (i) extends the write path with a declared source set and an attestation over its canonical root, (ii) runs a heartbeat over the hot core — under the measured age distribution, a "touched within the median age" policy covers half the store — and (iii) intercepts reads to evaluate and attach the verdict, with verify-on-read repair for the tail. Per-class horizon presets would be seeded from the measured per-class rates and refined as the attestation history accumulates.

What this section deliberately does not claim: the layer is designed, not deployed; the fraction-of-reads-served-`StillValid` metric — the gate's true operating characteristic — requires read-path instrumentation that does not yet exist; and the per-class drift rates above are one store, one quarter, one operator. These are engineering measurements establishing that the failure the paper names is the majority condition of a real store and that the proposed machinery is affordable against it — not a comparative evaluation. The measurement script and the raw summary are published as companion artifacts (`measurements/measure-drift.mjs`, `measurements/agent-memory-drift-2026-07-18.json`).

---

## §8. What this paper does not claim

Stated as a section rather than scattered as hedges, per the program's discipline.

**Not a new cryptographic primitive.** The objects, the verdict engine, and the gate are the position paper's, reused unchanged (§7.1 reports the reuse as a result). The claim is the specialization: the mapping of §4, the read-time semantics of §5, the failure model of §6, and the measurement of §7.

**Not a novelty claim over staleness detection.** TTLs, cache invalidation, decay ranking, bi-temporal knowledge graphs, and freshness-aware retrieval all detect or bound staleness in their own senses; §3 draws the lines. The claim is narrower and specific: validity as a *renewable, source-bound, signed verdict on the read path* — and the composition of those properties, which §3's scan found unoccupied.

**Not a truth oracle.** Freshness is not truth (§6.2). An entry wrong at write time is fresh and false forever, and the gate will say so on no axis. The gate composes with correctness disciplines; it does not supply one.

**Not a memory architecture.** Nothing here stores, embeds, retrieves, or ranks. The construction is a validity layer over whatever architecture exists, composing with retrieval rather than replacing it (§5.4).

**Not a defense against a hostile writer.** Write-path poisoning is the subject of the origin-binding literature, the complementary layer (§6.2). The adversary modeled here is entropy.

**Not a calibrated deployment.** One store, one quarter, one operator, coarse instruments — §7.3's caveats are load-bearing and its headline figure is a lower-bound demonstration, not a rate. The read-path operating characteristic is unmeasured because the instrumentation does not yet exist (§7.4).

**One open verification debt, carried honestly.** The closest prior-art neighbor was assessed from its published abstract because the full disclosure text was not retrievable at scan time (§3.1). The assessment is stable under everything the abstract states; a mechanism buried in the unretrieved body could narrow the distinction, and the citation will be re-verified against the full text before any submission of record.

---

## §9. Conclusion: the arc

*(author voice)*

The program now instantiates on three surfaces.

The theory. The market. The mind.

Same skeleton every time: a fact, a renewable attestation, a verdict at the moment of use. In the dark pool the witness attests price. In the compute papers it attests the context of execution. Here it attests knowledge.

Memory turned out to be the purest case. There is no computation underneath to verify. Strip the freshness question away and nothing is left — memory validity *is* contextual validity. The framework did not have to be bent to fit this surface; the surface is what the framework was always describing.

And this time the gap measured itself. The store that holds this program's own history — the sessions that produced the position paper, the dark pool, this paper — turned out to be 55% decayed at the reference level within a hundred days. Silently. It told nobody, because it had no way to say it. That is the entire argument in one number: the substrate must carry the verdict, because the world moves and the store, as built today, does not notice.

A memory that never expires is not alive. A memory whose validity is renewed, and whose reads say so, is.

The fact persists. The attestation renews.

---

Juan Cruz Maisú ♥
