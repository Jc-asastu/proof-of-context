# Paper outline — Proof of Context applied to Agent Service Settlement (v0.1)

**Working title.** *Proof-of-Context applied to agent service settlement: the record-then-check enforcement primitive on EVM chains without Ed25519 precompile.*

**Status:** outline drafted 2026-04-30. Heart sections (§4 Settlement-gate primitive, §5 Hybrid design rationale, §6 Threat model, §7 Empirical observations) to be written first per the v0.1-Inference paper construction protocol.

---

## §1 — Introduction

- The settlement gate is the load-bearing primitive of the PoC framework. Why this paper exists alongside the panoramic Agent Economy paper.
- The EVM constraint: no native Ed25519 precompile (RIP-7212 added secp256r1, not ed25519). Pure-Solidity Ed25519 costs ~500k gas per verify. This single fact determines the design space.
- Three enforcement points exist on the spectrum from "free but no on-chain integrity" to "expensive but fully verifiable":
  1. Off-chain only (SDK side, ~negligible cost, no on-chain claim).
  2. **Record-then-check** (this paper's recommendation, ~88k gas per submit, ~11k gas per check).
  3. On-chain Ed25519 (full integrity, ~500k gas per verify, prohibitive at scale).
- Preview the central claim: in production agent-economy settings on EVM L2, the record-then-check model is the operationally honest tradeoff.

## §2 — Background

- PoC v0.6 §3.6 distinction recap (one paragraph).
- The settlement-gating semantic: clear-time freshness predicate.
- Existing settlement mechanisms in DeFi:
  - TWAPs and price-deviation thresholds (Uniswap V3 oracles).
  - Circuit breakers (Chainlink monitor contracts).
  - Heartbeat checks in lending protocols.
  - Why none of these specialize to agent attestation: they bind to oracle freshness only, not to multi-typed commitment freshness over execution context.
- Why the PoC framework needs a settlement gate distinct from these: typed `_poc` commitments include `f_c`, `f_m`, `f_i`, `f_s` independently, and the gate enforces all four against per-protocol horizons.

## §3 — Related work

- Existing on-chain identity-attestation registries (Verifiable Credentials, EAS) and how they differ from a settlement gate.
- On-chain Ed25519 verification attempts: jbaylina/ed25519-sol (~500k gas), libsecp256r1 + RIP-7212 (different curve), Solana-based settlement (different VM, no relevance to EVM constraint).
- Operator-allowlist patterns in Optimism / Arbitrum sequencer architecture as conceptual antecedent for the trust surface used here.
- Bittensor's commit-reveal as cryptoeconomic precedent for staleness, but on a different chain and with different semantics.

## §4 — The settlement-gate primitive

**Heart section.**

Formal definition. Inputs: commitment hash, anchors triple, freshness horizon, verifier identity. Output: cleared / refused with structured rejection code.

Three enforcement modes, with concrete gas + trust analysis:

**4.1 Off-chain only (SDK enforcement).**
- Reference: PayClaw's `verifyPocCommitment` and `requireValidPoc` SDK functions.
- Cost: zero on-chain. Some CPU off-chain (~ms per verify).
- Trust: agent's wallet refuses to submit. No on-chain integrity. A buggy or compromised agent can bypass.
- When sufficient: contexts where the wallet is the only enforcement point and the wallet is trusted.

**4.2 Record-then-check on-chain (hybrid).**
- Reference: PayClaw's `PoCVerifier.sol` (Phase 7a of this work).
- Two operations:
  - `submitVerifiedCommitment(hash, horizon)` — only callable by approved operator. ~88k gas.
  - `isFresh(hash) → bool` view — used by settlement contracts. ~11k gas.
- Trust assumption: operator allowlist (owner-controlled `approveOperator` / `revokeOperator`).
- When sufficient: the SDK has already verified the Ed25519 signature; the chain only needs to know that a verified commitment exists and is within horizon at clear-time.

**4.3 Naive Ed25519 on-chain (fully verified).**
- Reference: pure-Solidity Ed25519 implementations (e.g. jbaylina/ed25519).
- Single operation: `submitAndVerify(commitment, signature)` — ~500k gas estimated.
- Trust: cryptography only. No operator allowlist needed.
- When sufficient: contexts where (a) the Ed25519 cost is acceptable per submission, and (b) operator-side trust cannot be enforced via allowlist.

The paper argues 4.2 is the right default for agent-economy settlement on EVM L2.

## §5 — Hybrid design rationale

**Heart section.**

Why record-then-check is the operationally honest middle of the spectrum.

- **Cost calculus.** Per-trade cost on Base at typical gas prices: 4.1 ≈ $0.00, 4.2 ≈ $0.001-$0.005, 4.3 ≈ $0.05-$0.20. The 50–200x cost difference between 4.2 and 4.3 is the central economic claim.
- **Trust calculus.** The trust assumption that records-then-check shifts: from "cryptography alone is sufficient" to "approved operator allowlist plus revocation is sufficient". This shift is acceptable when the operator set is auditable and revocation is fast.
- **Integration cost.** A new consumer protocol (perp DEX, escrow, AMM with attested data) integrates 4.2 by adding a single `IPoCVerifier` view call before settlement. ~10 lines of Solidity.
- **Composability.** Multiple consumers can share one `PoCVerifier` deployment. The verifier becomes infrastructure for the chain, not per-protocol.
- **Recovery surface.** Under operator compromise (rogue submission of garbage hashes), `revokeOperator` clears the operator's submission privileges immediately. Existing commitments from the rogue operator remain queryable but are tagged with the operator address; downstream consumers can refuse.

## §6 — Threat model

**Heart section.**

Adversaries the gate defends against.

- **Rational EV-maximizing agent.** Submits stale-context orders to extract from honest counterparties. Defended: settlement gate refuses to clear if commitment aged past horizon.
- **Tampered payload after attestation.** Defended: payload hash binding makes tampering detectable off-chain before submission, and the recorded hash on-chain is the authoritative reference.
- **Wrong-operator substitution.** Defended: operator allowlist gate. Submission by an unapproved address reverts.

Adversaries the gate does NOT defend against.

- **Rogue approved operator.** A compromised approved operator can submit garbage hashes. Mitigation: revocation. Detection: monitoring for unusual submission patterns. The paper documents this as the residual risk and recommends operator-set diversity.
- **Operator collusion.** Multiple approved operators colluding to submit consistent garbage. Mitigation outside the gate's scope: TrustLayer-style reputation aggregation across operators.
- **Off-chain Ed25519 verification bypass.** A buggy SDK that submits hashes without first verifying Ed25519 signatures. Mitigation: formal SDK verification, audited reference implementation in `proof-of-context-impl`, integration tests.
- **Compromised TEE producing garbage attestations.** Out of scope. Documented in PoC v0.6 §7.6 / §9 and inherited by this gate.
- **Chain-level censorship.** A submitter whose transactions are censored at the sequencer cannot record. Mitigation: alternative sequencers, fallback to off-chain enforcement during outages.

## §7 — Empirical observations

**Heart section.**

Reference implementation: PayClaw's `PoCVerifier.sol` (this work, Phase 7a).

- 12 Foundry tests covering: owner setup, operator approval/revocation, submission gating, horizon validation (zero/excessive rejected), double-submit rejection, fresh-until-horizon-then-stale behavior, full record retrieval, unknown-hash query.
- Gas measurements (from `forge test --gas-report`):
  - `submitVerifiedCommitment`: ~88k gas.
  - `isFresh` (view): ~11k gas effective when called from a settlement contract.
  - `approveOperator`: ~37k gas (one-time per operator).
  - `revokeOperator`: ~17k gas.
- Scalability: 1000 commitments per second per operator at Base's current 2-second block time, bounded by sequencer throughput rather than the verifier itself.
- Integration sketch with three consumer surfaces:
  - **SUR Protocol (perp DEX).** `OrderSettlement.settleBatch()` adds a single `IPoCVerifier(verifier).isFresh(commitmentHash)` call; reverts if false. Estimated marginal cost: 11k gas per trade. Acceptable.
  - **TrustLayer (escrow).** Escrow release adds the same view call before transferring. Stale escrow attestations cannot release, even if the underlying agreement was honored.
  - **BaseOracle / Vigil (data settlement).** Optional consumer-side enforcement: a paying agent's wallet (PayClaw) can pin a `PoCVerifier` and refuse to submit USDC transfer if `isFresh` returns false. SDK-side gating, on-chain integrity for high-stakes settlements.

## §8 — Composition examples (extended)

- The verifier as **shared infrastructure for an L2**: one deployment serves N consumer protocols. Cost amortizes.
- **Multiple verifiers** for different operator sets. Each consumer protocol selects its trust set.
- **Verifier composition with off-chain enforcement**: the SDK still verifies Ed25519 (because the on-chain verifier cannot); the on-chain verifier records the result. Two layers of enforcement, neither sufficient alone.
- **Optional layer 4.3 (naive Ed25519) for high-stakes contexts**. A future extension: `submitAndVerify(commitment, signature)` overload on `PoCVerifier` that also does the Ed25519 check on-chain. Used when ~500k gas per submission is acceptable (e.g., billion-dollar settlement events).

## §9 — Limitations

- The trust surface moves from cryptography to the operator allowlist. Auditable and revocable, but not zero-trust.
- The verifier contract is single-owner today (`PoCVerifier.owner` is `immutable`). Multi-owner / governance is future work.
- No on-chain `attestation_chain` field yet (Phase 4 of the wire format spec).
- No formal proof of incentive-compatibility under the operator-allowlist trust model. The intuition is that operator revocation is fast enough to deter rational misbehavior, but this is not yet formally proved.
- Identity churn at the operator layer (a rogue operator quitting, registering a new identity, repeating) is not yet modeled. Defense surface lives at TrustLayer's reputation layer, not at the verifier.

## §10 — Future work

- **`IPoCVerifier`-aware policy hooks.** PayClaw's `PolicyRegistry` integrating the verifier as a release condition (Phase 7b).
- **BLS aggregation** for high-volume settings: a single signature represents N attestations. Reduces per-attestation cost when settlement events are batched.
- **On-chain `attestation_chain` field.** Carries TDX quote + H100 attestation report from Phase 3b of `proof-of-context-impl` once that work lands.
- **Cross-chain settlement gates.** A verifier on chain A consulted by a settlement contract on chain B via a bridge.
- **Empirical study under adversarial conditions.** Run the verifier in a controlled setting with simulated rogue operators and measure observed slashing / revocation latencies.

## §11 — Conclusion

The settlement gate is the load-bearing primitive of the PoC framework, and on EVM chains without an Ed25519 precompile its honest enforcement point is the record-then-check hybrid. The paper documents the rationale, the threat model, and the gas calculus that make this the right default. Integrators who adopt the model adopt the operator allowlist as the trust surface, and the paper makes that consequence fully explicit.

---

## Companion artifacts to cite inline

- Position paper: PoC v0.6.
- Wire format spec: `SPEC-WIRE-FORMAT-v0.1.md`.
- Applied paper #2 (Agent Economy Infrastructure): the panoramic counterpart.
- Applied paper #1 (Verifiable Inference): the inference-side counterpart.
- Reference implementation: `PoCVerifier.sol` in `payclaw/packages/contracts-evm/src/`.
- Foundry test suite: `payclaw/packages/contracts-evm/test/PoCVerifier.t.sol`.

## What to write first

Following the v0.1-Inference paper construction protocol:
1. Heart section §4 (settlement-gate primitive, three enforcement modes).
2. Heart section §5 (hybrid design rationale).
3. Heart section §6 (threat model — adversaries defended vs. not).
4. Heart section §7 (empirical observations from `PoCVerifier.sol`).
5. Once heart sections are complete and self-consistent, scaffold §1, §2, §3, §8, §9, §10, §11.

Construction record will be tracked in `CASE-V0.7-EXTENSION`-style file when drafting begins.
