# Proof of Context applied to Agent Service Settlement

**Working title.** *Proof-of-Context applied to agent service settlement: the record-then-check enforcement primitive on EVM chains without Ed25519 precompile.*

**Author:** Juan Cruz Maisú · Buenos Aires, Argentina · `juancmaisu@outlook.com` · [github.com/asastuai](https://github.com/asastuai).

**Status:** v0.1 working abstract. Drafted 2026-04-30 alongside the v0.1 wire format spec and applied paper #2.

---

## Abstract

The Proof-of-Context framework (v0.6) named the gap between attestation-as-verification and attestation-as-settlement. Applied paper v0.1 (Inference) specialized the distinction to commercial inference-as-a-service. Applied paper #2 (Agent Economy Infrastructure) documented a wire-format convergence across four independent reference implementations.

This paper is the third in the family and the first that focuses narrowly on the settlement-gate primitive itself. The contribution is a design rationale made fully explicit: in a decentralized setting where the target chain (Base, Ethereum, any EVM L2) has no native Ed25519 precompile and pure-Solidity Ed25519 costs ~500k gas per verification, the operationally honest place to put a settlement gate is a **record-then-check** model. Signature verification stays off-chain, where it is cheap. An on-chain verifier contract records commitments submitted by approved operators and serves freshness queries to settlement contracts. The trust assumption moves from the cryptography to the operator allowlist gate, which is auditable and revocable.

We document the design choices, the threat model, and a reference implementation in PayClaw's `PoCVerifier.sol` (twelve Foundry tests passing, ~88k gas per `submitVerifiedCommitment`, ~11k gas per `isFresh` view query). We sketch the integration paths into three consumer surfaces: perpetual futures (SUR Protocol), agent-to-agent escrow (TrustLayer), and pay-per-query data settlement (BaseOracle, Vigil). We compare the hybrid model to two alternatives — naive on-chain Ed25519 verification at ~500k gas per verify, and off-chain-only enforcement with no on-chain integrity at all — and locate record-then-check at the operationally honest middle of that spectrum.

The paper does not propose new cryptography. It argues that the intermediate enforcement point is the right tradeoff when the underlying signature scheme has no native precompile on the target chain, and it makes the consequences of that choice — the operator allowlist as the trust surface, the absence of on-chain signature verification, the recovery model under operator compromise — fully explicit so integrators can adopt the gate with eyes open.

**Keywords:** proof-of-context · settlement gating · agent service settlement · Ed25519 · operator allowlist · record-then-check · gas efficiency · EVM precompile gap · perpetual futures · escrow

---

## One-sentence framing

> *PoC v0.6 said attestations should be economically perishable. This paper specifies how to enforce that on a chain without an Ed25519 precompile, and is honest about where the trust then has to go.*
