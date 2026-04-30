# Paper outline — Proof of Context applied to Agent Economy Infrastructure (v0.1)

**Working title.** *Proof-of-Context applied to the agent economy infrastructure: a multi-producer wire-format study with five reference implementations.*

**Status:** outline drafted 2026-04-30. Heart sections (§4 Specialization, §5 Wire Format, §6 Threat Model, §7 Empirical Observations) to be written first per the v0.1-inference paper construction protocol.

---

## §1 — Introduction

*(authorial register: visual architecture, first-person, the introduction speaks in my voice. The heart sections that follow speak in standard academic register.)*

PoC v0.6 named a gap.

Attestation-as-verification is what existing primitives provide. Proof-of-learning. zkML. TEE attestations. Refereed delegation. Activation hashing. They all answer the same question: *did the computation happen correctly?*

Attestation-as-settlement is the gap.

It answers a different question. *Is the computation still worth settling on now?*

The agent economy is where that question becomes urgent.

Agents pay each other for data. Defer to each other for trust. Compose each other's outputs into settlement events. None of the primitives covering that surface bind freshness to payment. x402 lets agents pay. MCP lets agents tool. Reputation registries let agents accumulate history. Agent wallets let agents spend. Data oracles let agents read.

None of them make attestations perishable.

i argue the gap PoC v0.6 named is the same gap that opens here, specialized to a different surface.

i argue further that running the same primitive through four independent consumer surfaces converges on a single wire format. The convergence happens because the underlying problem space is convergent. i document the convergence empirically and promote the result as a working specification.

That is the paper.

The heart sections (§4 through §7) speak in standard academic register. They specify the format. They calibrate the horizons. They model the threat. They report the empirical observations.

This introduction speaks in mine.

## §2 — Background

- PoC v0.6 framework (one paragraph reminder).
- PoC v0.1-Inference applied paper: the precedent for specialization.
- The agent economy infrastructure landscape:
  - x402 / HTTP 402 (Coinbase).
  - MCP (Anthropic).
  - Agent wallets and policy engines.
  - Agent-native data oracles (Pyth, Chainlink, plus emerging agent-paid feeds).
  - Reputation registries (incomplete, fragmented).
- What none of these provide today: cryptographic freshness binding gating settlement.

## §3 — Related work

- Position-paper PoC v0.6 §3 (Related Work) is reused with this addition: agent-economy-specific antecedents.
- Specifically:
  - x402 spec and where freshness is silent.
  - MCP tool result semantics and the absence of attestation primitives.
  - Property-attestation literature (PAL\*M) and why the centralized-provider threat model does not transfer.
  - Reputation-registry attempts (Theoriq, Olas) and how they relate to but do not provide a freshness primitive.

## §4 — Specialization: which freshness types apply where

**Heart section.**

- For each layer of the agent economy infrastructure, identify which of (`f_c`, `f_m`, `f_i`, `f_s`) is the load-bearing dimension.
- Tabulate: data oracle (`f_i`), agent test harness (`f_m`), uptime monitor (`f_c`), payment escrow (`f_s`), reputation aggregator (multi-type).
- Argue why `f_i` dominates by traffic volume in the agent economy (data calls are the hottest path).
- Argue why a single producer can be multi-type (TrustLayer case), and why this falsifies any "one type per protocol" reading of v0.6.
- Boundary discussion: what types DO NOT apply here that did in inference (none, but verify carefully).

## §5 — The wire format

**Heart section.** Reproduce and motivate `SPEC-WIRE-FORMAT-v0.1.md` here as the formal specification embedded in the paper.

- The `_poc` block (required and optional fields).
- Canonical hashing rules.
- The signing message (and the deliberate exclusion of the anchors block from it).
- The four freshness types as enum.
- The triple-anchor block and the meaning of null entries.
- Verification protocol (10 ordered checks).
- Open questions deferred to v0.2.

## §6 — Threat model

**Heart section.** Adversaries the wire format defends against, and adversaries it does not.

- Defended:
  - Stale-context settlement (the central claim).
  - Tampered payload after attestation.
  - Wrong-operator substitution (when `expectedPublicKey` is pinned).
- Out of scope at this layer:
  - Operator dishonesty about the underlying data source. The `scope_disclaimer` field acknowledges this explicitly.
  - Compromised TEE (paper §7.6 / §9 already covered this; the wire format inherits the limitation).
  - Cross-chain replay across different `source_id`s without further coordination.
- The SDK-side enforcement mode (PayClaw): a consumer wallet that verifies attestations off-chain and refuses payment without ever submitting on-chain enforcement. Honest scope and limitations.

## §7 — Empirical observations from the reference implementations

**Heart section.** What we learned from running the primitive through five implementations.

- Convergence facts:
  - Same field set across BaseOracle, TrustLayer, Vigil, PayClaw, proof-of-context-impl.
  - Byte-identical canonical hashes for the same input across JavaScript, TypeScript, Rust.
  - Cross-language signature verification works without changes.
- Per-surface freshness horizon calibrations (table):
  - BaseOracle: 30s (price), 60s (trending), 15s (whale alerts), 600s (contract verify).
  - Vigil: 30s (oracle health, MEV, sandwich), 60s (liquidation, IL).
  - TrustLayer: 60s (sentinel), 3600s (skill scan), 86400s (verified skill, escrow).
- Triple-anchor real-fetch results (live tests against drand.cloudflare.com and mainnet.base.org).
- Test count: 43 PoC integration tests passing across the four agent-economy repos plus the Rust reference impl.

## §8 — Limitations

- No formal cryptoeconomic proof yet that PoC reduces extraction value vs no-PoC. (Same gap acknowledged in defensive answers from prior outreach prep.)
- TEE attestation chain is scaffolded but not real. Phase 3b of `proof-of-context-impl`.
- No external integrators yet. Distribution gap acknowledged.
- Production traffic at the operator level is zero on all five reference implementations.

## §9 — Future work

- v0.2 of the wire format (multi-sig, BLS aggregation, real `attestation_chain` field, cross-chain anchors, receipts).
- On-chain `IPoCVerifier` Solidity contract for PayClaw-style consumers that want enforcement at the wallet release point.
- Cross-protocol reputation portability (agent reputation built on TrustLayer carrying to other marketplaces).
- Empirical study: run the wire format through a real adversarial setting and measure observed slashing rates.

## §10 — Conclusion

*(authorial register: visual architecture, first-person.)*

The wire format already holds.

i did not invent it. i ran the primitive through four independent consumer surfaces and watched the format emerge. The convergence is not author craft. The convergence is the underlying problem space telling four implementations the same answer.

What this paper does is name what already happened.

It documents the contract. It publishes the spec. It puts a version number on the agreement so independent integrators can adopt it without coordinating.

The agent economy needs interoperability infrastructure that does not yet exist as a stable contract. This paper is one offering of that contract. It is small. It will not solve everything. It is the format that emerged when i tried.

If you are integrating, the spec lives at `SPEC-WIRE-FORMAT-v0.1.md`. The verification protocol is ten ordered checks. The rejection codes are structured. The reference implementations are five repositories. All five produce byte-identical canonical hashes.

Adopt the format and the convergence widens.

That is the contribution.

---

Juan Cruz Maisú ♥

---

## Companion artifacts to cite inline

- Position paper: PoC v0.6.
- First applied paper: PoC v0.1 Inference.
- Wire format spec: `SPEC-WIRE-FORMAT-v0.1.md`.
- Reference implementations: 5 GitHub repos.
- Aletheia umbrella: `github.com/asastuai/aletheia`.

## What to write first

Following the v0.1-inference paper construction protocol:
1. Heart section §4 (Specialization).
2. Heart section §5 (Wire Format) — largely a reformatting of the spec.
3. Heart section §6 (Threat Model).
4. Heart section §7 (Empirical Observations).
5. Once heart sections are complete and self-consistent, scaffold §1, §2, §3, §8, §9, §10.

The construction record will be tracked in `CASE-V0.7-EXTENSION.md`-style file when drafting begins.
