# Proof of Context applied to the Agent Economy Infrastructure

**Working draft, pre-1.** Heart sections (§4 Specialization, §5 The wire format, §6 Threat model, §7 Empirical observations) drafted 2026-05-01. Surrounding sections (§1, §2, §3, §8, §9, §10) follow the outline at `paper-poc-agent-economy-v0.1-outline.md`. The introduction and conclusion in that outline are written in author voice; the heart sections below are in standard academic register per the paper's hybrid mode.

**Author:** Juan Cruz Maisú · Buenos Aires · `juancmaisu@outlook.com` · [github.com/asastuai](https://github.com/asastuai).

---

## §4. Specialization: which freshness types apply where

The Proof-of-Context framework decomposes attestation freshness into four types, originally introduced in v0.6 §6: `f_c` (computational), `f_m` (model), `f_i` (input), and `f_s` (settlement). The first applied paper (v0.1 Inference) showed that under a centralized-provider threat model these four types partition asymmetrically (1-vs-3) by detection mode, with one dimension collapsing into another. The asymmetry was itself the central conceptual contribution of that paper.

This paper specializes the framework to a different surface: the agent economy infrastructure layer. We argue that on this surface the four types remain distinct, that each maps cleanly to a specific class of consumer endpoint, and that a single producer can legitimately emit multiple types within the same protocol — a property the framework permits but which had not previously been exercised in a deployed system.

### 4.1 Per-surface mapping

The agent economy infrastructure layer comprises four broad classes of endpoint, each with a distinct load-bearing freshness dimension.

**Data oracles emit `f_i`.** A pay-per-query data oracle, such as a market-data feed serving agents over the x402 protocol, returns content (a price, an aggregate, a derived signal) whose temporal validity is bounded by the freshness of its inputs. The model used to compute the response is essentially fixed (a polling cadence plus light aggregation); the worker does not delay submission; the settlement window is governed by the payment rail. The only dimension that varies meaningfully across responses is `f_i`. Two reference implementations confirm this empirically: BaseOracle (eleven paid endpoints) and Vigil (six paid endpoints) emit only `f_i`-typed attestations.

**Agent test harnesses emit `f_m`.** A QA-style harness that evaluates an agent's behavior against a target API or model produces an attestation whose validity depends on the model version under test. The harness's verdict is bound to a specific model checkpoint. If the underlying model is updated between test time and consumption time, the verdict no longer applies. This is `f_m` in its purest form. The TrustLayer reference implementation's QABot service emits `f_m`-typed attestations on its three test endpoints.

**Uptime monitors emit `f_c`.** A service that pings registered endpoints and produces SLA reports binds its claims to the timestamp of the most recent successful ping. The signal is the elapsed time between observation and submission. TrustLayer's Sentinel service emits `f_c`-typed attestations on its SLA reports.

**Payment escrows emit `f_s`.** An escrow contract that releases funds based on conditional fulfillment binds its release window to the original deposit transaction. The relevant freshness is the time-to-clearance from commit to release. TrustLayer's Escrow service emits `f_s`-typed attestations whose horizon equals the user-supplied deadline of the escrow.

**Reputation aggregators consume across types.** A reputation registry that scores agents on the basis of their commitment history must consume all four types and aggregate them under a unified scoring function. This is the only surface on which all four types appear simultaneously. TrustLayer's overall reputation aggregation pipeline reads commitments emitted by ClawScan, QABot, Sentinel, and Escrow — types `f_c`, `f_m`, `f_c`, and `f_s` respectively — and folds them into per-agent scores.

### 4.2 The dominance of `f_i` by traffic volume

The four types are not equally trafficked.

In the reference implementations, `f_i`-typed attestations dominate by request volume. Two of the four agent-economy producers (BaseOracle, Vigil) emit only `f_i`. The third (TrustLayer) emits all three of the non-`f_s` types but with the highest per-unit traffic on its monitoring endpoints (`f_c`-typed). The fourth (PayClaw) is a verifier that consumes attestations rather than producing them, and the consumed attestations are predominantly `f_i` from the data layer.

We do not measure traffic in this paper because no reference implementation has reached production scale. The conclusion that `f_i` dominates is structural rather than empirical: data calls are by construction the hottest path in any agent flow that involves payment for information, and data calls are the natural surface of `f_i`. We expect the structural claim to be confirmed by traffic measurements once any of the implementations clears the production-volume threshold.

### 4.3 Multi-type producers do not violate the framework

The TrustLayer case demonstrates that a single producer can legitimately emit multiple types. ClawScan emits `f_c`. QABot emits `f_m`. Sentinel emits `f_c`. Escrow emits `f_s`. All four services share the same operator, the same signing key, the same `source_id` namespace, and the same on-wire format. Only the `freshness_type` field varies per endpoint.

This is not a violation of the v0.6 framework. Section 6 of v0.6 introduces the four types as an enum on individual attestations, not as a partition of producers. A producer is permitted to emit attestations of different types as long as each individual attestation carries the correct type. The TrustLayer implementation exercises this permission concretely.

The implication for protocol designers is that the type partition is a property of the *attestation*, not of the *protocol*. A protocol that decomposes its functionality into endpoints with distinct freshness semantics — as TrustLayer does, separating skill scanning from agent testing from uptime monitoring from escrow — produces a multi-type attestation stream by construction. A protocol that does not so decompose produces a single-type stream. Both are first-class.

### 4.4 Boundary discussion: types that do not apply

The v0.6 framework reserves four freshness dimensions. The agent economy infrastructure layer exercises all four. We considered whether the surface might require additional types beyond the framework's reservation, and we found none.

We also considered whether any of the four types might be inapplicable on this surface, in the way the inference setting collapsed `f_c` into `f_m`. We found that all four remain distinct on the agent economy layer, because the four classes of endpoint we identify (data, test, monitor, escrow) each pin one type as the load-bearing dimension while leaving the others meaningful but secondary. This contrasts with the inference setting, where `f_c` (computational delay) and `f_m` (model snapshot) tend to move together because both are functions of when the model was last updated.

We conclude that the v0.6 four-type decomposition is well-shaped for the agent economy infrastructure layer with no additions or collapses required.

---

## §5. The wire format

The on-wire shape of a Proof-of-Context attestation, as produced and consumed by all five reference implementations, is specified at `SPEC-WIRE-FORMAT-v0.1.md` in this repository. We summarize the specification here at the level of detail required for the threat model in §6 and the empirical observations in §7. The full specification is normative.

### 5.1 The `_poc` block

Every attested message contains a top-level field named `_poc` whose value is an object with the following required fields:

| Field | Type | Description |
|---|---|---|
| `version` | string | Spec version. `"0.1"` for this paper. |
| `freshness_type` | enum string | One of `"f_c"`, `"f_m"`, `"f_i"`, `"f_s"`. |
| `source_id` | string | Stable identifier for the issuer, in `<service>:<instance>` form. |
| `endpoint` | string | The protocol endpoint that produced the attested payload. |
| `timestamp` | RFC 3339 string | UTC moment of signing. |
| `freshness_horizon_seconds` | integer | Maximum age the issuer asserts. |
| `payload_hash` | hex string (64) | SHA-256 of the canonical-JSON serialization of the message excluding `_poc`. |
| `signature` | hex string (128) or null | Ed25519 signature over the canonical signing message of §5.3. |
| `public_key` | hex string (64) or null | Issuer's Ed25519 public key. |

A null signature/public-key pair is permitted only when the issuer has no signing key configured (development mode). Such attestations are informational; consumers must treat them as equivalent to no PoC block for any settlement-gating purpose.

Two optional but recommended fields complete the block:

| Field | Type | Description |
|---|---|---|
| `anchors` | object | Triple-anchor block (§5.5). |
| `scope_disclaimer` | string | Free-form note about what the attestation does *not* cover. |

### 5.2 Canonical hashing

The `payload_hash` is computed over the canonical JSON of the message with the `_poc` field removed. Canonicalization rules:

1. Recursively sort object keys lexicographically (UTF-8 byte order).
2. Serialize using `JSON.stringify` semantics: no extra whitespace, double-quoted strings, RFC 8259 escape sequences.
3. Compute SHA-256 over the UTF-8 bytes of the resulting string.
4. Encode as lowercase hex.

All five reference implementations produce byte-identical hashes for the same input under these rules. The empirical confirmation of cross-language equivalence is reported in §7.

### 5.3 The signing message

The Ed25519 signature is computed over the UTF-8 bytes of the canonical JSON of:

```
{
  "endpoint": <string>,
  "freshness_horizon_seconds": <integer>,
  "freshness_type": <type code>,
  "payload_hash": <hex string>,
  "source_id": <issuer id>,
  "timestamp": <timestamp>
}
```

Keys are sorted lexicographically. The signing message *intentionally excludes* the `anchors` block. Triple-anchor values may differ between issuance and verification due to caches, retries, and partial fetches. Including them in the signing surface would invalidate every replay-with-cached-anchor scenario without protocol benefit. The exclusion is explicit and documented.

### 5.4 Freshness types

The `freshness_type` field carries one of four enum codes corresponding to the v0.6 §6 decomposition: `f_c`, `f_m`, `f_i`, `f_s`. A single attestation declares one type. A multi-type producer (§4.3) emits separate attestations from different endpoints, each typed appropriately. Consumers are required to verify that the declared type matches the consumer's expectation before relying on the attestation.

### 5.5 The triple-anchor block

The `anchors` object commits the attestation to three independent clocks per v0.6 §7.6:

| Field | Type | Source |
|---|---|---|
| `server_timestamp` | RFC 3339 string | Issuer's local wall clock at signing. Always present. |
| `block_height` | integer or null | Latest block height from the settlement chain at signing time. |
| `drand_round` | integer or null | Latest Drand mainnet round at signing time. |

A `null` value means "no claim made about this clock," not "the clock said zero." Consumers must treat divergence checks as best-effort over the non-null subset.

### 5.6 Verification protocol

A verifier performs ten ordered checks. The first failure determines the rejection reason; subsequent checks are not evaluated. The full ordered list is specified in `SPEC-WIRE-FORMAT-v0.1.md` §7. Rejection codes are structured strings (`stale`, `payload_hash_mismatch`, `signature_invalid`, `operator_mismatch`, `missing_poc_block`, `no_signature`) so that callers can distinguish failure modes programmatically.

### 5.7 Open questions deferred to v0.2

The v0.1 specification intentionally defers four extensions to a future revision:

- Multi-signature attestations from a quorum of issuers.
- BLS-style signature aggregation for high-volume settings.
- A real `attestation_chain` field carrying TDX quote and H100 attestation report when the issuer runs inside trusted hardware.
- Cross-chain anchors (multiple `block_height` entries when the issuer commits to more than one chain).

These are flagged as open questions rather than as gaps. The current specification stabilizes the core fields and the verification protocol; later revisions extend the format without breaking v0.1 verifiers.

---

## §6. Threat model

The v0.6 framework specifies the attestation primitive at the abstraction layer. The wire format specified in §5 is a concrete instantiation. This section enumerates the adversaries the wire format defends against, the adversaries it does not, and the boundary case of a consumer-only enforcement mode.

### 6.1 Adversaries the wire format defends against

**A1. Stale-context settlement.** An adversary controlling a producer whose local clock or cache lags behind the global state, intentionally or accidentally, attempts to bind a payment to inputs that no longer reflect protocol-relevant reality. The wire format defends through the `freshness_horizon_seconds` field: a verifier rejects an attestation whose age (as measured against the verifier's local clock) exceeds the declared horizon. This is the central claim of the framework and the primary defended adversary.

**A2. Payload tampering after attestation.** An adversary intercepts an attested response in transit and modifies the payload before delivery to the consumer. The wire format defends through `payload_hash`: the hash binds the attested payload to the specific bytes that were signed. A modified payload produces a hash mismatch on verification, and the verifier rejects with `payload_hash_mismatch`.

**A3. Wrong-operator substitution.** An adversary attempts to substitute their own attestation for a target operator's attestation, exploiting the consumer's failure to pin operator identity. The wire format defends through `expectedPublicKey` enforcement at the verifier: a consumer that pins the operator's public key rejects attestations signed by any other key with `operator_mismatch`. The defense is opt-in; consumers that omit pinning accept any signature, which is correct behavior in early-deployment scenarios where operator allowlists are not yet curated.

**A4. Replay across freshness horizons.** An adversary captures a previously-valid attestation and replays it after its horizon has expired. The wire format defends through the timestamp + horizon mechanism described under A1. The replay attack is structurally indistinguishable from the stale-context attack and is rejected by the same mechanism.

### 6.2 Adversaries out of scope at this layer

**A5. Operator dishonesty about underlying data.** An attestation issued by an operator vouches for the operator's signature over the response. It does not vouch for the truthfulness of the response. An operator that knowingly signs a price quote at an arbitrary value, distinct from the upstream source's price, produces a cryptographically valid attestation of a substantively false claim. The wire format does not defend against this. The `scope_disclaimer` field in every reference implementation states this explicitly: *"Operator vouches for freshness at timestamp of signing. Upstream source honesty is not attested."*

Defense against operator dishonesty lives at a higher protocol layer (reputation aggregation across operators, multi-source quorum, on-chain dispute resolution) and is properly the subject of separate specifications.

**A6. Compromised TEE.** An attestation signed inside a compromised Trusted Execution Environment can claim arbitrary timestamps, including timestamps consistent with the external block_height and drand_round components of the triple-anchor. The framework's v0.6 §7.6 acknowledges this limitation explicitly: the triple-anchor defends against accidental skew under the assumption of a valid TEE attestation chain, not against a TEE that produces arbitrary signed claims. The wire format inherits this limitation. Defense against TEE compromise requires the attestation chain composition with TDX or equivalent quote verification, currently scaffolded in `proof-of-context-impl` but not real until Phase 3b.

**A7. Cross-chain replay across distinct `source_id` namespaces.** An attestation issued by operator `A:default` on chain X can in principle be presented to a consumer expecting attestations from operator `A:default` on chain Y, if both chains share the operator key and the consumer does not pin chain provenance. The wire format does not include a chain identifier in the signing message. Defense against cross-chain replay requires either pinning chain provenance at the consumer or extending the wire format in v0.2 to include a chain identifier in the signing surface.

**A8. Denial-of-service via attestation flooding.** An adversary submits high-volume attestations to exhaust verifier resources. The wire format does not defend against this. Defense lives at the network and infrastructure layers (rate limiting, payment gating).

### 6.3 The SDK-side enforcement mode

A consumer wallet such as PayClaw verifies attestations off-chain in its SDK and refuses payment without ever submitting on-chain enforcement. This mode has distinct properties worth specifying.

The off-chain verification mode is *not* a degraded form of on-chain enforcement. It is a different point on the spectrum, with different threat model implications.

**What it provides.** The wallet's user can be confident that the wallet will not pay for stale, tampered, or wrong-operator data. The verification happens before any transaction is submitted to the chain. The wallet's user retains the canonical authority over what their funds settle.

**What it does not provide.** No on-chain claim is recorded. A third-party observer of the chain cannot tell that the wallet refused a stale attestation. The refusal is private to the wallet's local state and is not visible to other parties.

**When this mode is sufficient.** When the wallet is the canonical enforcement point — when the only party the user trusts to refuse stale-data settlement is their own wallet — the off-chain mode is the correct default. The trust assumption is that the wallet's SDK is correct and not compromised. This trust is the same trust the user already places in their wallet for transaction signing.

**When this mode is insufficient.** When multiple parties downstream of the wallet (settlement contracts, dispute-resolution systems, reputation aggregators) need to know that the wallet's verification took place, off-chain verification leaves them blind. For these cases, the on-chain hybrid mode (the subject of applied paper #3, "Agent Service Settlement") is the correct enforcement point. The two modes are complementary, not competing.

### 6.4 Threat-model summary

The wire format defends against four classes of adversary (A1–A4) and explicitly acknowledges four classes of out-of-scope adversary (A5–A8). The boundary between the two is determined by what a single attestation can carry. An attestation can carry signed claims about its own timestamp, the bytes of its payload, and the identity of its issuer. It cannot carry claims about the truthfulness of upstream sources, the integrity of the issuer's hardware, or the absence of cross-chain replay vectors that span outside the signed message.

The honest framing is that this is a settlement-gating primitive, not a truth oracle. Composability with other primitives is required to address the out-of-scope adversaries; the wire format does not pretend to address them alone.

---

## §7. Empirical observations from the reference implementations

This section reports the empirical outcomes of running the wire format through five reference implementations across four languages.

### 7.1 The five implementations

| Implementation | Language | Role | LOC of PoC code |
|---|---|---|---|
| BaseOracle | JavaScript (ESM) | Producer of `f_i` | ~230 |
| TrustLayer | JavaScript (ESM) | Producer of `f_c` / `f_m` / `f_s` | ~230 |
| Vigil | TypeScript | Producer of `f_i` | ~240 |
| PayClaw SDK | TypeScript | Consumer / verifier | ~220 |
| `proof-of-context-impl` | Rust | Reference primitive | ~600 (includes types) |

The four agent-economy implementations were authored after the Rust reference crate. The crate served as the canonical reference for type names, freshness semantics, and the canonical-hash construction. The four downstream implementations were written without copying code from each other or from the reference crate; they were written from the same author's reading of the reference crate's published API and the wire format specification.

### 7.2 Convergence facts

We observe three concrete convergence facts across the five implementations.

**F1. Field set identity across the JS/TS implementations.** Every JavaScript and TypeScript implementation (BaseOracle, TrustLayer, Vigil, PayClaw SDK) produces an `_poc` block with the same field names, the same field types, and the same nesting structure. No implementation introduced a field absent from the others. No implementation omitted a required field defined by the others. The Rust reference crate is the typed reference for the same conceptual fields and is structurally consistent with the JS/TS shape, though it operates on typed Rust structs rather than emitting JSON on the wire. Verified by direct comparison of implementation source code.

**F2. Byte-identical canonical hashes across the four JS/TS implementations.** A single test payload, run through the canonical-hashing function in each of BaseOracle, TrustLayer, Vigil, and the PayClaw SDK, produces the same SHA-256 hex digest. The equivalence is empirically validated by three test vectors (`test-vectors/v0.1.json` in the spec repository) that each implementation tests against in its own suite. The Rust reference crate uses a typed Merkle construction rather than canonical JSON; its hashes are therefore not byte-identical to the JS/TS hashes by design, and it is not in scope for the JS/TS test vectors. The Rust crate's role is the typed-architecture reference; the JS/TS implementations are the on-wire reference.

**F3. Cross-language signature verification across the JS/TS implementations.** A signature produced by BaseOracle (JavaScript) over a test payload verifies under PayClaw's TypeScript verifier. The reverse also holds. The construction (canonical JSON, sorted keys, no whitespace, SHA-256 hash, Ed25519 signature) is identical across the four JS/TS implementations and produces interoperable signatures without any compatibility shims. Cross-language verification with the Rust reference crate is not part of the empirical chain because the Rust crate signs over its typed Merkle root rather than over a canonical-JSON hash; an interop layer between the two schemes is open work and is identified in §9.

The three convergence facts together support a calibrated version of the central conceptual claim. We observe that four independent *surfaces* of the same primitive, implemented by the same author working from the published specification, converge on the same wire format. This demonstrates intra-author consistency under shared constraints. It does not, by itself, demonstrate that the wire format is structurally tight enough that any independent author would converge on the same shape; that stronger claim requires implementations by parties with no shared internal model of the spec. The replication experiment that would close that gap is identified in §9.

We are explicit about this distinction because the strength of the claim governs the appropriate use of the wire format. Intra-author consistency is sufficient to publish the format as a stable contract for adoption by new integrators (the contract holds; integrators can build against it). Independent-author convergence would be required to claim that the format's shape is *necessary* rather than *one specific way of doing it*. The current paper supports the former and explicitly defers the latter.

### 7.3 Per-surface freshness horizon calibrations

The freshness horizons assigned to each endpoint are not normative properties of the framework. They are empirical calibrations chosen by the operator on the basis of the upstream data's volatility and the consumer's tolerance for staleness.

We report the horizons used in the reference implementations as a starting reference for protocol designers.

**BaseOracle (data oracle):**

| Endpoint | Horizon (seconds) | Justification |
|---|---|---|
| `/api/v1/prices` | 30 | Token prices on Base move per-block; 30s spans roughly 15 blocks. |
| `/api/v1/prices/batch` | 30 | Same as single price. |
| `/api/v1/trending` | 60 | Trending lists update on a ~minute cadence upstream. |
| `/api/v1/whale-alerts` | 15 | High-frequency event feed; staleness sensitivity is high. |
| `/api/v1/token-analysis` | 60 | Composite signal; underlying data updates on ~minute cadence. |
| `/api/v1/gas` | 30 | Gas oracles update per-block. |
| `/api/v1/portfolio` | 60 | Wallet balances change at user-action cadence. |
| `/api/v1/wallet-profile` | 120 | Profile aggregations stable on minute-plus cadence. |
| `/api/v1/ohlcv` | 60 | Candle data updates per-interval. |
| `/api/v1/contract-verify` | 600 | Contract verification status is effectively static. |
| `/api/v1/route` | 30 | Routing depends on volatile pool state. |

**Vigil (DeFi intelligence):**

| Endpoint | Horizon (seconds) | Justification |
|---|---|---|
| Oracle health | 30 | Block-cadence staleness sensitivity. |
| Liquidation cascade | 60 | Cascade simulations expensive to recompute; minute-cadence acceptable. |
| MEV exposure | 30 | Pool state changes per-block. |
| Sandwich activity | 30 | Same. |
| IL risk | 60 | Volatility-derived signal updates more slowly. |

**TrustLayer (reputation services):**

| Endpoint | Horizon (seconds) | Justification |
|---|---|---|
| Sentinel SLA report | 60 | Pings every 60s; horizon equals the ping cadence. |
| Skill scan (quick) | 3,600 | Skill content is static; rescan unnecessary within an hour. |
| Verified skill (deep) | 86,400 | Verified status durable for a day. |
| Escrow create | `deadline_hours * 3600` | Horizon equals the user-supplied deadline. |
| Escrow dispute | 86,400 | Dispute records durable for a day. |

The horizons are chosen on the basis of the upstream data's volatility and the consumer's tolerance for staleness. They are not normative; protocol designers integrating the wire format into their own consumers should calibrate horizons against their own threat models.

### 7.4 Triple-anchor real-fetch results

The triple-anchor block specifies three independent clocks: server timestamp, block height, and Drand round. The reference Rust crate (`proof-of-context-impl`) implements live-fetch clients for the second and third clocks under a feature flag (`--features real-anchors`) that produces a `RealAnchorBuilder` composing the three.

Live tests against `https://drand.cloudflare.com` and `https://mainnet.base.org` confirm that:

- Drand round retrieval succeeds with median round-trip time of approximately 150 ms from a residential South American client.
- Base mainnet `eth_blockNumber` returns the current block height in well under one second from the same client.
- The triple-anchor composed from these returns is internally consistent (the three timestamps agree to within their respective measurement uncertainties).

The four agent-economy implementations include opt-in triple-anchor wiring under a `POC_ENABLE_TRIPLE_ANCHOR` environment variable. When the variable is unset (the default), the `block_height` and `drand_round` fields remain null and the attestation falls back to the server timestamp as the only binding clock. When the variable is set, the agent-economy implementations populate the fields by calling the same Cloudflare and Base RPC endpoints as the Rust reference crate.

### 7.5 Test coverage

The four agent-economy implementations together include 43 PoC integration tests, distributed across the implementations as follows:

| Implementation | PoC tests | Coverage |
|---|---|---|
| BaseOracle | 13 | 8 PoC primitive + 5 endpoint smoke |
| TrustLayer | 13 | 8 multi-type PoC + 5 endpoint smoke |
| Vigil | 7 | PoC primitive + scope_disclaimer specifics |
| PayClaw SDK | 10 | All verifier failure paths + roundtrip |

The Rust reference crate adds further unit, integration, and `--ignored` live-fetch tests (the live-fetch tests are gated behind the `real-anchors` feature flag). Pre-existing test suites in SUR Protocol (531 Foundry tests) and PayClaw EVM contracts (12 PoCVerifier Foundry tests, plus the original 24 wallet-policy tests) bring the stack-wide test count substantially higher, though those tests are not specific to PoC integration.

The 43 PoC integration tests are the relevant figure for the convergence claim of §7.2: they exercise the wire format end-to-end across the four agent-economy implementations.

### 7.6 Negative observations

We report two negative observations to round out the empirical picture.

**No production traffic.** None of the five reference implementations has reached production-volume usage at the time of this draft. The convergence facts are confirmed by tests and by direct source-code comparison. Performance characteristics under real load (signing throughput, verification latency at scale, cache effectiveness) are not yet measured.

**No external integrators.** No party outside the author has integrated the wire format. Convergence across one author's implementations is suggestive but does not establish that independent authors would converge on the same shape. We discuss this gap and the experiment that would close it in §9.

---

