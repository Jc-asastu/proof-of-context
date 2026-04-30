# Proof of Context applied to Agent Service Settlement

**Working title.** *Proof-of-Context applied to agent service settlement: the record-then-check enforcement primitive on EVM chains without Ed25519 precompile.*

**Author:** Juan Cruz Maisú · Buenos Aires · `juancmaisu@outlook.com` · [github.com/asastuai](https://github.com/asastuai).

**Status:** v0.1 working abstract. Drafted 2026-04-30 alongside the v0.1 wire format spec and applied paper #2.

---

## Abstract

The Proof-of-Context framework v0.6 named the gap between attestation-as-verification and attestation-as-settlement.

Applied paper v0.1 (Inference) specialized the distinction to commercial inference-as-a-service. Applied paper #2 (Agent Economy Infrastructure) documented a wire-format convergence across four independent reference implementations.

This paper is the third in the family. It is the first that focuses narrowly on the settlement-gate primitive itself.

The contribution is a design rationale made fully explicit.

In a decentralized setting where the target chain has no native Ed25519 precompile, and pure-Solidity Ed25519 costs ~500k gas per verify, the operationally honest place to put a settlement gate is a **record-then-check** model.

Signature verification stays off-chain. That is where it is cheap.

An on-chain verifier contract records commitments submitted by approved operators. It serves freshness queries to settlement contracts.

The trust assumption moves from the cryptography to the operator allowlist gate. Auditable. Revocable.

i document the design choices, the threat model, and a reference implementation in PayClaw's `PoCVerifier.sol`. Twelve Foundry tests passing. Roughly 88k gas per `submitVerifiedCommitment`. Roughly 11k gas per `isFresh` view query.

i sketch the integration paths into three consumer surfaces:

- perpetual futures (SUR Protocol)
- agent-to-agent escrow (TrustLayer)
- pay-per-query data settlement (BaseOracle, Vigil)

i compare the hybrid model to two alternatives.

Naive on-chain Ed25519 verification at ~500k gas per verify. Off-chain-only enforcement with no on-chain integrity at all.

Record-then-check sits at the operationally honest middle of that spectrum.

The paper does not propose new cryptography. It argues the intermediate enforcement point is the right tradeoff when the underlying signature scheme has no native precompile on the target chain. It makes the consequences of that choice fully explicit so integrators can adopt the gate with eyes open.

**Keywords:** proof-of-context · settlement gating · agent service settlement · Ed25519 · operator allowlist · record-then-check · gas efficiency · EVM precompile gap · perpetual futures · escrow

---

## One-sentence framing

> *PoC v0.6 said attestations should be economically perishable.*
> *This paper specifies how to enforce that on a chain without an Ed25519 precompile.*
> *And is honest about where the trust then has to go.*

---

Juan Cruz Maisú ♥
