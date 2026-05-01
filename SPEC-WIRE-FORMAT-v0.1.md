# Proof-of-Context Wire Format v0.1

**Status:** working specification.
**Authors:** Juan Cruz Maisú (`juancmaisu@outlook.com`).
**License:** CC BY 4.0 (same as the position paper).

---

## 1. Purpose

This document specifies the on-wire shape of a Proof-of-Context (PoC) attestation as it travels between protocol participants: producer → consumer → settlement-gate. It is the byte-level equivalent of the conceptual primitive defined in the position paper at [github.com/asastuai/proof-of-context](https://github.com/asastuai/proof-of-context) (v0.6, 22 April 2026).

The format emerged from running the same primitive through four independent consumer surfaces — pay-per-query data, agent wallets, reputation aggregation, and DeFi risk feeds — and observing that the shape converged organically. This spec promotes that convergence to a stable contract so independent integrators can interop without coordinating individually.

The format is **transport-agnostic**. It can ride inside a JSON HTTP response, an MCP tool result, a CBOR-encoded protobuf, or any other carrier that preserves UTF-8 strings and standard JSON primitives.

---

## 2. The `_poc` block

Every PoC-attested message MUST contain a top-level field named `_poc` whose value is an object conforming to the schema below.

### 2.1 Required fields

```json
{
  "_poc": {
    "version": "0.1",
    "freshness_type": "f_i",
    "source_id": "issuer:identifier",
    "endpoint": "/api/path/that/produced/this",
    "timestamp": "2026-04-30T19:30:00.000Z",
    "freshness_horizon_seconds": 30,
    "payload_hash": "<64 hex chars: sha256 of canonical sibling fields>",
    "signature": "<128 hex chars: ed25519 signature> | null",
    "public_key": "<64 hex chars: ed25519 public key> | null"
  }
}
```

### 2.2 Optional but recommended fields

```json
{
  "_poc": {
    "anchors": {
      "server_timestamp": "2026-04-30T19:30:00.000Z",
      "block_height": 12345678,
      "drand_round": 7000000
    },
    "scope_disclaimer": "Operator vouches for freshness at timestamp of signing. <upstream-specific caveat>"
  }
}
```

### 2.3 Field semantics

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | string | yes | Spec version. MUST be `"0.1"` for this version. |
| `freshness_type` | enum string | yes | One of `"f_c"`, `"f_m"`, `"f_i"`, `"f_s"`. See §3. |
| `source_id` | string | yes | Stable identifier for the issuer (operator). Format `<service>:<instance>`, e.g. `"baseoracle:default"`. Consumers SHOULD pin known operator IDs. |
| `endpoint` | string | yes | The protocol endpoint or function path that produced the attested payload. Helps consumers route verification and pricing. |
| `timestamp` | RFC 3339 / ISO 8601 string | yes | UTC moment at which the issuer signed the attestation. Always equal to `anchors.server_timestamp` when both are present. |
| `freshness_horizon_seconds` | integer | yes | Maximum age, in seconds, at which the issuer asserts the attested payload is fresh. Consumer MAY enforce a tighter horizon. |
| `payload_hash` | hex string (64 chars) | yes | SHA-256 of the canonical-JSON serialization of the message **excluding** the `_poc` block. See §4. |
| `signature` | hex string (128 chars) or `null` | yes | Ed25519 signature over the canonical signing message of §5. `null` only when the issuer has no signing key configured (development mode). |
| `public_key` | hex string (64 chars) or `null` | yes | Issuer's Ed25519 public key. `null` only when `signature` is `null`. |
| `anchors` | object | recommended | The triple-anchor block. See §6. |
| `scope_disclaimer` | string | recommended | Free-form human-readable note about what the attestation does NOT cover (e.g. upstream sources, hardware attestation status). |

---

## 3. Freshness types

Aligned with paper §6. The four types decompose distinct failure modes; consumers SHOULD reason about them independently rather than collapsing them into a single notion of freshness.

| Code | Name | Meaning |
|---|---|---|
| `f_c` | computational | How long the issuer sat on the result before submitting. Most common for monitors, scanners, samplers. |
| `f_m` | model | Distance between the model version used and the canonical version at consumption time. Use for ML inference, agent test results. |
| `f_i` | input | Temporal validity of inputs the computation consumed (oracles, RAG, tool calls, prompt cache). Highest economic weight for agent inference and DeFi data. |
| `f_s` | settlement | Permitted window between commit and clear. Use for escrow, settlement gates, time-bound offers. |

A single attestation declares **one** type. A multi-type producer (e.g. TrustLayer) emits separate attestations from different endpoints, each typed appropriately.

---

## 4. Canonical hashing

The `payload_hash` is computed over the canonical JSON of the message **with the `_poc` field removed**. Canonicalization rules:

1. Recursively sort object keys lexicographically (UTF-8 byte order).
2. Serialize using `JSON.stringify` semantics: no extra whitespace, double-quoted strings, escape sequences as defined in RFC 8259.
3. Compute SHA-256 over the UTF-8 bytes of the resulting string.
4. Encode as lowercase hex.

Reference implementations:

- Rust: `proof-of-context-impl` crate, `commitment::canonical_hash`.
- JavaScript: `BaseOracle/src/utils/poc.js#canonicalHash`.
- TypeScript: `payclaw/packages/sdk/src/poc.ts#canonicalHash`.

All JS/TS implementations produce byte-identical output for the same input. (The Rust crate uses a typed Merkle scheme over the same fields rather than canonical JSON — see §9.)

---

## 5. Signing message

The Ed25519 signature is computed over the UTF-8 bytes of the canonical JSON of this object:

```json
{
  "endpoint": "<the endpoint string>",
  "freshness_horizon_seconds": <the integer>,
  "freshness_type": "<the type code>",
  "payload_hash": "<the hex string>",
  "source_id": "<the issuer id>",
  "timestamp": "<the timestamp>"
}
```

Note: keys are listed lexicographically per §4 step 1. The signing message intentionally **excludes** the `anchors` block. Triple-anchor values are advisory and may differ between issuance and verification (caches, retries, partial fetches). Including them in the signing surface would invalidate every replay-with-cached-anchor scenario without protocol benefit.

If the issuer has no signing key configured, the signature and public key fields are emitted as `null`. Such attestations are still useful for development and for unsigned audit trails, but consumers MUST treat them as informational only — equivalent to no PoC block at all for any settlement-gating purpose.

---

## 6. Triple-anchor block

The `anchors` object commits the attestation to three independent clocks, per paper §7 constraint 6:

| Field | Type | Source |
|---|---|---|
| `server_timestamp` | RFC 3339 string | Issuer's local wall clock at signing. Always present. |
| `block_height` | integer or `null` | Latest block height from the settlement chain (e.g. Base) at signing time. `null` if the issuer did not fetch one. |
| `drand_round` | integer or `null` | Latest Drand mainnet round at signing time. `null` if the issuer did not fetch one. |

A `null` value means "no claim made about this clock," not "the clock said zero." Consumers SHOULD treat divergence checks as best-effort over the non-null subset of the triple.

The triple-anchor's defensive purpose (paper §9) is to detect accidental skew or single-clock failure under the assumption of a valid TEE attestation chain. The format does NOT, by itself, prove the issuer was actually inside a TEE — that proof, when needed, is carried separately in an `attestation_chain` field reserved for v0.2.

---

## 7. Verification protocol

A verifier MUST perform the following checks in order. The first check that fails determines the failure reason; subsequent checks SHOULD NOT be evaluated.

1. **`_poc` block present.** Reject if absent.
2. **`version` is `"0.1"`.** Reject if a future or unknown version. Forward-compatible verifiers MAY accept higher versions if they understand them.
3. **Required fields present and well-typed.** Reject if any field violates §2.
4. **`signature` and `public_key` either both null or both non-null.** Reject if mismatched.
5. **If `signature` is null, reject** unless the verifier has explicitly opted into unsigned-mode.
6. **Re-compute `payload_hash`** from the message minus `_poc`. Reject on mismatch.
7. **Check age** = (verifier's current time) − `timestamp` ≤ min(`freshness_horizon_seconds`, verifier's local horizon). Reject if exceeded.
8. **Verify Ed25519 signature** over the canonical signing message of §5 using the declared `public_key`. Reject on signature failure.
9. **(Optional)** Pin `public_key` against an expected operator key. Reject on mismatch.
10. **(Optional)** Cross-check `anchors.block_height` and `anchors.drand_round` against the verifier's view of those clocks. Reject if divergence beyond the protocol-defined skew bound under the assumption of a valid attestation chain (paper §7.6).

Rejection reasons SHOULD be returned as structured codes (e.g. `"stale"`, `"payload_hash_mismatch"`, `"signature_invalid"`, `"operator_mismatch"`) rather than free-form strings, so callers can distinguish failure modes programmatically.

---

## 8. Example

A `BaseOracle` price response with a fully populated `_poc` block:

```json
{
  "token": "ETH",
  "price_usd": 2500.0,
  "volume_24h": 800000000,
  "_poc": {
    "version": "0.1",
    "freshness_type": "f_i",
    "source_id": "baseoracle:default",
    "endpoint": "/api/v1/prices",
    "timestamp": "2026-04-30T19:30:00.000Z",
    "freshness_horizon_seconds": 30,
    "payload_hash": "8c1f2a3b4d5e6f7081929394a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e",
    "signature": "5a4c3b2d1f9e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d",
    "public_key": "8a4c3b2d1f9e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b",
    "anchors": {
      "server_timestamp": "2026-04-30T19:30:00.000Z",
      "block_height": 22456789,
      "drand_round": 9123456
    },
    "scope_disclaimer": "Operator vouches for freshness at timestamp of signing. Upstream source honesty is not attested."
  }
}
```

---

## 9. Reference implementations

The wire format is implemented across these repositories:

| Repo | Language | Producer / Consumer | Hashing scheme | Path |
|---|---|---|---|---|
| [proof-of-context-impl](https://github.com/asastuai/proof-of-context-impl) | Rust | both | typed Merkle (over fields) | `src/commitment.rs`, `src/clients/` |
| [BaseOracle](https://github.com/asastuai/BaseOracle) | JavaScript | producer | canonical JSON + SHA-256 | `src/utils/poc.js`, `src/utils/poc-anchors.js` |
| [TrustLayer](https://github.com/asastuai/TrustLayer) | JavaScript | producer (multi-type) | canonical JSON + SHA-256 | `src/utils/poc.js`, `src/utils/poc-anchors.js` |
| [Vigil](https://github.com/asastuai/vigil) | TypeScript | producer | canonical JSON + SHA-256 | `packages/core/src/poc.ts`, `packages/core/src/poc-anchors.ts` |
| [PayClaw](https://github.com/asastuai/payclaw) | TypeScript | consumer (verifier) | canonical JSON + SHA-256 | `packages/sdk/src/poc.ts` |

The four JavaScript and TypeScript implementations produce byte-identical canonical-JSON SHA-256 hashes for the same payload and verify each other's signatures. Each one is tested against the authoritative test vectors at [`test-vectors/v0.1.json`](./test-vectors/v0.1.json) — three vectors covering the simple-flat, nested-with-array, and empty-object cases.

The Rust reference crate uses a typed Merkle construction over the same conceptual fields (`weights_hash`, `tokenizer_hash`, etc.) rather than canonical JSON. Its hashes are therefore not byte-identical to the JS/TS implementations by design; the Rust crate is the type-and-architecture reference, while the JS/TS implementations are the wire-format-on-the-network reference. A typed-Merkle test-vector set covering the Rust construction may be added later as `test-vectors/v0.1-rust.json` if the Rust scheme stabilizes for cross-implementation use.

---

## 10. Versioning

Future versions of this spec will be backwards-compatible at the verifier level: a v0.2 verifier MUST accept v0.1 attestations. New required fields are introduced through feature flags or version bumps; new optional fields can ride v0.1 without requiring a bump.

Deprecation policy: a field is deprecated only by being marked `deprecated: true` in the spec; it remains accepted by verifiers for at least one minor version transition.

---

## 11. Open questions

The following items are intentionally left under-specified in v0.1 and tracked as candidates for v0.2:

- **Multi-signature attestations.** A consortium of issuers signing the same payload (e.g. quorum-attested oracle).
- **Aggregated signatures.** BLS-style compression for high-volume settings.
- **TEE attestation chain field.** A real `attestation_chain` block carrying TDX quote + H100 attestation report, when the issuer runs inside trusted hardware. Currently scaffolded as `null` in the reference implementations.
- **Cross-chain anchors.** Multiple `block_height` entries when the issuer commits to more than one chain.
- **Receipts.** A receipt format wrapping a verified attestation with the verifier's own settlement decision, for downstream protocols that compose verifications.

---

## 12. Citation

```bibtex
@misc{maisu2026pocwireformat,
  title={Proof-of-Context Wire Format v0.1},
  author={Maisu, Juan Cruz},
  year={2026},
  howpublished={\url{https://github.com/asastuai/proof-of-context/blob/main/SPEC-WIRE-FORMAT-v0.1.md}},
  note={Working specification, derived from reference implementations across BaseOracle, TrustLayer, Vigil, PayClaw, and proof-of-context-impl}
}
```
