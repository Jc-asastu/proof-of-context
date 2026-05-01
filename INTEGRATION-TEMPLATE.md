# Integration Template

A checklist for protocols that want to consume proof-of-context commitments and gate settlement on freshness. Use this as the working document during integration.

The template assumes you already understand the wire format (`SPEC-WIRE-FORMAT-v0.1.md`) and have access to one of the four reference verifiers (BaseOracle, TrustLayer, Vigil, PayClaw).

---

## 1. What is the integration shape

Pick one before you start. The rest of the checklist branches.

- [ ] **Producer-only** — your protocol generates PoC commitments others verify. (Examples: oracle, intelligence service, model inference endpoint.)
- [ ] **Consumer-only** — your protocol verifies commitments others produced before settling. (Examples: payment rail, on-chain policy gate, auction settlement.)
- [ ] **Both** — your protocol produces commitments for downstream consumers and verifies upstream commitments before its own settlement. (Examples: orchestrators, multi-hop agent flows.)

---

## 2. Producer integrations

If your protocol generates commitments:

- [ ] Pick the freshness type (`f_c`, `f_m`, `f_i`, `f_s`) and document why you chose it. Honest scope is part of the artifact.
- [ ] Configure `POC_SIGNING_KEY` (Ed25519, 32 bytes hex) as an environment variable. Never commit it.
- [ ] Configure `POC_SOURCE_ID` so consumers can pin you. Convention: `<protocol>:<role>` (e.g. `vigil:default`).
- [ ] Decide your `freshness_horizon_seconds` per endpoint. This is the strongest per-endpoint claim you make. Do not pick numbers you cannot defend.
- [ ] Wrap every signed response with the `_poc` block as specified in the wire format.
- [ ] Expose `/api/v1/poc/public-key` (or equivalent) so consumers can fetch the operator key.
- [ ] Run the cross-language test vectors against your `canonicalHash`. If your hashes do not match, your wire format has drifted from the spec and consumers in other languages will fail to verify.
- [ ] Decide whether to enable the triple anchor (`POC_ENABLE_TRIPLE_ANCHOR`). Recommended in production, optional locally.
- [ ] Document in your README what your `_poc` block proves and, more importantly, what it does **not** prove (upstream source honesty, model correctness, etc).

Acceptance test: a third party can fetch one of your endpoints, extract the `_poc` block, and verify it against your published key using the JS/TS reference verifier without modifying the verifier code.

---

## 3. Consumer integrations

If your protocol verifies commitments before settling:

- [ ] Decide where verification runs: SDK-side (off-chain, before submitting a tx), on-chain (Solidity policy hook), or both.
- [ ] If SDK-side: import the reference verifier from PayClaw (`verifyPocCommitment`) or one of the other reference SDKs.
- [ ] Pin the operator's public key (`expectedPublicKey`). Do not accept signatures from operators you have not vouched for.
- [ ] Override `maxAgeSeconds` if your settlement window is tighter than the operator's declared horizon. Do not loosen it past the operator's horizon — that defeats the primitive.
- [ ] Decide your behavior on each failure reason. Distinct cases need distinct handling:
  - `missing_poc_block` — operator did not attest at all.
  - `no_signature` — operator did not configure a key, only acceptable in dev.
  - `stale: age=…s` — past horizon. Refuse settlement, retry fresh fetch.
  - `payload_hash_mismatch` — payload was tampered after signing. Hard reject, alert.
  - `signature_invalid` — wrong key or forgery. Hard reject, alert.
  - `operator_mismatch` — wrong operator. Hard reject, possibly your config is stale.
- [ ] If on-chain: deploy `PoCVerifier` (record-then-check model from PayClaw) and configure your policy contract to query `isFresh(commitmentHash)` before settlement.
- [ ] Decide who is allowed to call `submitVerifiedCommitment` on your verifier. This is the trust anchor of the on-chain side.

Acceptance test: an unsigned response, a stale response, a tampered response, a signed-by-wrong-operator response all get rejected with their distinct reasons. A fresh, signed, untampered response gets accepted.

---

## 4. On-chain settlement gating

If you are wiring PoC into a smart-contract settlement flow:

- [ ] Read `payclaw/packages/contracts-evm/src/PoCVerifier.sol` and `PolicyRegistry.sol` end-to-end. They are the reference for the record-then-check pattern (off-chain Ed25519 verify, on-chain freshness check, no EVM Ed25519 precompile required).
- [ ] Decide whether PoC enforcement is mandatory protocol-wide or opt-in per account. PayClaw is opt-in (`setPocRequired` per wallet). Most protocols should start opt-in.
- [ ] Wire your settlement function through a PoC-aware variant (`checkTransactionWithPoC` in PayClaw) that takes a `bytes32 commitmentHash` parameter and returns a structured reason on failure.
- [ ] Test the rejection paths: zero hash with PoC required, stale hash, unknown hash. If any of these settle, your gate is open.
- [ ] Test the no-op path: PoC not required → behavior identical to pre-PoC.

Acceptance test: 51-test → 61-test parity across PayClaw before and after wiring. If your existing test suite breaks when you turn PoC off, your wiring is wrong.

---

## 5. Operational checklist

- [ ] Key rotation procedure documented. PoC commitments signed under the old key remain verifiable under their original public key, but new commitments must rotate.
- [ ] Monitoring on signing latency. If signing takes longer than your freshness horizon, you have a self-inflicted staleness bug.
- [ ] Monitoring on verification rejection rates per reason. A spike in `stale` is a different incident than a spike in `signature_invalid`.
- [ ] Disclosure of cross-language hash equality. State which implementations you have verified your wire format against.

---

## 6. Honest disclosure section for your README

Copy and adapt:

> This protocol uses proof-of-context to gate settlement on freshness. The operator vouches that the data was fresh at the timestamp of signing. The primitive does **not** attest to upstream source correctness, model output quality, or any property beyond the ones listed in `SPEC-WIRE-FORMAT-v0.1.md`. Consumers must pin the operator key and decide their own acceptance horizon.

If you cannot write this paragraph honestly, your integration is over-claiming.

---

## 7. Where to ask

- Wire format questions: open an issue on `proof-of-context`.
- Reference implementation bugs: open an issue on the relevant repo (`baseoracle`, `trustlayer`, `vigil`, `payclaw`, `proof-of-context-impl`).
- Position paper questions: see the paper PDF on the `proof-of-context` repo.
