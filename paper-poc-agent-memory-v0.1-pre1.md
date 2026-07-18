# Proof of Context applied to Agent Memory

**Working draft, pre-1.** Heart sections are drafted first, per the applied-paper construction protocol: §4 (Specialization) drafted 2026-07-18; §5 (Read-Time Gate), §6 (Failure Model), §7 (Reference Instantiation) follow. Surrounding sections (§1, §2, §3, §8, §9) follow the outline at `paper-poc-agent-memory-v0.1-outline.md`. The introduction and conclusion in that outline are written in author voice; the heart sections below are in standard academic register per the paper's hybrid mode. Related-work positioning is grounded in `RESEARCH-LANDSCAPE-memory.md` (two independent 8-agent scans, 2026-07-17).

**Author:** Juan Cruz Maisú · Buenos Aires · `juancmaisu@outlook.com` · [github.com/Jc-asastu](https://github.com/Jc-asastu).

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

*(next drafting pass)*

## §6. Failure model

*(next drafting pass)*

## §7. Reference instantiation

*(next drafting pass)*

---

Juan Cruz Maisú ♥
