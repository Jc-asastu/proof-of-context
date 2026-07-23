# SPEC — Backing-Age Extension v0.1 (DRAFT — not committed, pending Juan's go)

**Date:** 2026-07-22
**Extends:** SPEC-WIRE-FORMAT-v0.1 (`_poc` block) · PoC framework paper v0.9.1 · poc-agent-memory pre1
**Status:** design draft. Engineering artifact, **no theorem claims** — see Lineage.

---

## 0. One-sentence pitch

HTTP solved staleness laundering in 1997 with the `Age` header (RFC 9111 §4.2.3: age is the *sum of residence times along the path from origin* — intermediate caches never reset it). Agent pipelines forgot it: every LLM derivation stamps its output "now," laundering the age of the sources it derived from. This extension makes the clock un-resettable for agent context.

## 1. Intent (Phase 0 block)

- **Qué es:** un campo `backing` en el bloque `_poc` + una regla de propagación: todo output de pipeline hereda la unión de los backings de sus inputs, con `attested_at` original — nunca se resetea en derivación.
- **Para quién:** operadores de pipelines de agentes (empezando por nosotros: engram-live, PoC-impl) que hoy eligen entre re-verificar todo o comerse incidentes de contexto stale.
- **Por qué ahora:** la ola 2026 de agentic attestation (Forough et al. listan "compound attestation for multi-hop agent chains" como open challenge); PoC ya tiene el wire format y la instanciación agent-memory (pre1, 07-18) donde esto encaja como pieza faltante.
- **Done de este ciclo:** (1) spec del campo + regla, (2) módulo `backing.rs` en proof-of-context-impl con tests, (3) demo que muestra el lavado y su fix (extensión de `memory_freshness.rs`), (4) dogfood engram-live: el warning de prosa "memory is 96 days old" reemplazado por metadato `backing` real.
- **Kill criteria:** si al construirlo resulta que el metadato no cambia ninguna decisión en el dogfood (el gate con backing decide igual que sin él), es plomería sin cliente → se documenta y se para.

## 2. Design

### 2.1 The `backing` field (`_poc` block extension)

```json
"_poc": {
  ...existing v0.1 fields...,
  "backing": [
    {
      "source_id": "sha256:...",      // canonical id of the source context (file path hash, feed id, obs id)
      "attested_at": "2026-04-16T19:09:29Z",  // when the source was last validated against ground truth — NEVER the derivation time
      "class": "repo-structure"        // freshness class (string, open vocabulary)
    }
  ]
}
```

`age(entry, t) = t − attested_at` — computed by the consumer at *its* evaluation time (settlement age), never stored precomputed. Mirrors RFC 9111 `current_age = corrected_initial_age + resident_time`, simplified: absolute `attested_at` beats relative ages across untrusted hops (no clock-residence bookkeeping; needs loosely-synced clocks — same assumption PoC's triple-anchor already makes, and the triple-anchor can bound clock skew disputes).

### 2.2 Propagation rule (the whole point)

```
backing(output) = ⋃ backing(input_i)   for all inputs consumed to produce output
```

- **Union, never replace.** A summary of a stale doc carries the stale doc's entry.
- **Never reset.** `attested_at` only advances by *re-validation against the source* (a new attestation event), never by derivation.
- **Dedup** by `source_id`, keeping the **oldest** `attested_at` when duplicates conflict (conservative).
- An LLM/tool stage adds NO backing entry for itself — stages are transparent, exactly like caches in RFC 9111. A stage adds an entry only if it consulted a *new source* (tool call that read a file, fetched a price).

### 2.3 Gate (consumer side)

`gate(output, policy, t)`: for each backing entry, compare `age(entry, t)` against `policy.max_age[class]` (raw v0.1: per-class max-age numbers; measured survival curves are explicitly **v2, optional** — utility does not depend on them). Verdict: `FRESH` / `STALE(entries)` → act / targeted re-verify (only stale entries!) / refuse. Targeted re-verify is the economic win: today's alternative is re-verify-everything or nothing.

### 2.4 What v0.1 does NOT do (honest scope)

- **No integrity:** `backing` is honest-metadata plumbing, unsigned in v0.1. A malicious stage can strip/forge entries. Signing backing chains (compound attestation proper) = v0.2+, where PoC's existing Ed25519 attestation machinery is the natural substrate. State this loudly in the README.
- **No derived windows:** `max_age` per class is operator-chosen in v0.1. We killed the theorem that would derive them; we do not pretend otherwise.
- **No semantic invalidation:** age ≠ falsity (exp. 001 lesson: source drift is a proxy). The gate prices *age*, the operator prices *risk*.

## 2.5 Privacy (first-class constraint — raised by J., 2026-07-22)

The backing set is a provenance trace. Sent raw across a trust boundary it leaks: (a) which sources the agent consulted (hashed `source_id` is still linkable across outputs → membership/correlation inference on your corpus/memory), (b) activity timing (`attested_at` fingerprints when you touch/validate things), (c) data categories (`class` reveals *that* you hold e.g. medical context even if content never travels). This violates data minimization and purpose limitation if unaddressed. HTTP never had this problem because `Age` is a scalar; the backing *set* is our enrichment — and it stays home.

**Rules (normative):**

1. **Trust-domain scoping, default-deny.** Full backing sets exist and propagate ONLY within the emitting trust domain (your pipeline, your memory, your gates). They MUST NOT cross a trust boundary (A2A, third-party MCP, published artifacts) unless explicitly configured.
2. **Boundary emission = minimal aggregate.** What crosses by default is `max_age` — a single scalar (age of the oldest backing entry; the conservative bound, which is all a downstream gate needs). Optionally `{coarse_class: max_age}` if the receiver gates per class. This is, deliberately, RFC 9111's Age header again: the privacy-preserving degenerate form.
3. **Pairwise pseudonymous ids** when a set must cross: `source_id = HMAC(per-relationship key, source)` — unlinkable across distinct receivers (DAA-style pairwise pseudonyms).
4. **Timestamp coarsening at boundaries:** round `attested_at` to hour/day granularity. Useful windows are hours/days; second-precision only serves fingerprinting.
5. **Class generalization at boundaries:** coarse vocabulary ("personal", "market-data") or no class → receiver falls back to a conservative global window.
6. **Imputability via selective disclosure, not broadcast.** The full audit trace stays in the emitter's logs; under dispute, reveal the specific entries in question (PoC's receipt/dispute pattern), never the graph by default.

**Honest cost:** at boundaries the receiver loses per-source targeted re-verification (knows only "oldest is X") and rich audit stays emitter-side. Privacy and imputability genuinely tension; the resolution is private-by-default + selective disclosure — not pretending the tension away. Intra-domain (the dogfood case, B4, and ~most of the utility) has zero privacy cost because nothing leaves.

**v0.1 build impact:** `BackingSet` gets `to_boundary() -> BoundaryAge` (the aggregate form); the MCP/A2A proposal (utility #4) proposes the *aggregate* field, never the raw set.

## 3. Lineage (cite, don't claim)

RFC 9111 §4.2.3 Age semantics (the direct ancestor — this is its transfer to agent context) · event-time/watermarks (Dataflow 2015, Flink) · TOCTOU in LLM agent chains (arXiv 2508.17155) · Copilot 2004 window-of-vulnerability · PoC framework v0.9.1 (freshness dimensions, triple-anchor) · Forough et al. arXiv 2605.03213 (the open challenge this partially addresses, minimally, without TEEs). Novelty claim: **none beyond the transfer + working artifact.** The delta over RFC 9111: HTTP tracks one origin per response; agent context is a *DAG fan-in* (union of backings), and the consumer gates per-class. That is engineering, and it is enough.

## 4. Build plan (pending go)

| Phase | Deliverable | Where |
|---|---|---|
| B1 | This spec, reviewed by Juan | proof-of-context (canonical: Desktop\active\proof-of-context) |
| B2 | `backing.rs`: `BackingEntry`, `BackingSet` (union/dedup/oldest-wins), `gate()` + property tests (union associative-commutative-idempotent; propagation never decreases any age; dedup keeps oldest) | proof-of-context-impl (Desktop\active\proof-of-context-impl) |
| B3 | Demo: extend `memory_freshness.rs` — show the laundering (summary stamped now, backed by April source) caught by the gate; without backing, silently passes | examples/ |
| B4 | Dogfood: engram-live emits/consumes `backing` on session summaries; replace prose staleness warning with metadata verdict | engram-live sidecar |
| B5 | README section + wire-format changelog; TS mirror in clients/ if B4 lands well | both repos |

Sequence: B1 → B2 → B3 (one PR-shaped unit), then B4 as its own unit. No commits/pushes until Juan asks (local-first rule).
