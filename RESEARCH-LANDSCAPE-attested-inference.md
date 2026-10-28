# RESEARCH LANDSCAPE — Attested inference, effort binding, and what is actually unoccupied

**Date:** 2026-08-19
**Purpose:** Due-diligence scan before committing to a paper or a product angle for the attested inference marketplace. Every entry was verified against its primary source (arXiv abstract page, spec repository, or vendor documentation) on the date above.
**Verdict up front:** the field is far more occupied than it looked. Three of the four dimensions in PoC-Inference §4 have prior art, two have production implementations, and the "effort gap" framing now belongs to an IEEE S&P 2026 paper. One thing is genuinely unoccupied, and it happens to be the thing this research program has been about all along.

---

## 1. The occupied ground

### 1.1 Effort — *taken, S&P 2026*

**Hollow-LLM Attack: Computationally Trivial Weights in Zero-Knowledge Verification of LLM Inference.** Chen Gong, Beijie Liu, Mengyuan Li. arXiv:2607.28884, 30 Jul 2026. Comments field: *"Accepted to the 2026 IEEE Symposium on Security and Privacy (S&P 2026)."*

Formalizes the **effort gap**: ZK inference proves an output is consistent with executing a public architecture under committed private weights, but *"does not bind the effort expended to produce the output."* The attack embeds ghost weights whose algebraic structure collapses effective computation; proofs verify, the provider serves at small-model cost while overclaiming model size. Closing line: *"proof of correct inference is not proof of large-model execution and necessitate additional protections to bind correctness to verifiable computational work."*

**No defense is proposed.** The only mitigation circulating is more ZK (certifying structural properties such as weight-matrix sparsity).

**Consequence for us:** the *genus* — correctness does not bind resources — is now named, formalized and going to a top-tier venue. We cannot claim it. We can answer it.

### 1.2 Model substitution — *measured, and settled against output-only detection*

**Are You Getting What You Pay For? Auditing Model Substitution in LLM APIs.** Will Cai, Tianneng Shi, Xuandong Zhao, Dawn Song. arXiv:2504.04715, 7 Apr 2025 (rev. 29 Sep 2025).

Statistical tests on outputs are query-intensive and fail against subtle substitutions; log-probability methods are defeated by inference nondeterminism in production. Conclusion: **software-only methods are fundamentally unreliable**; they recommend TEEs.

**Consequence for us — this one helps.** PoC-Inference §4.1 asserts model substitution is "in principle detectable from response content" without empirical support, and §4.6 partitions 1-vs-3. This paper supplies the missing evidence *and* pushes the honest partition to **0-vs-4**: in practice not even the model dimension is output-observable. The §4 argument gets stronger and finally gets a citation. Rewrite required.

### 1.3 Model authenticity via enclave measurement — *solved, in papers and in production*

- **Optimistic TEE-Rollups (OTR).** arXiv:2512.20176, Dec 2025. Its **Proof of Efficient Attribution (PoEA)** binds execution to specific model weights through `MRENCLAVE` in a DCAP quote over hashed query/response plus a nonce, enforced on-chain as `∃(·,Ω)∈ℳ s.t. τ.MRENCLAVE∈Ω`. Explicitly defeats model-downgrade attacks.
- **Tinfoil** (commercial, deployed): `modelpack` builds an immutable `.mpk` of the weights (EROFS + dm-verity); the TEE verifies the model hash against the attestation and aborts on mismatch.
- **Laminator: Verifiable ML Property Cards using Hardware-assisted Attestations.** Vasisht Duddu, Oskari Järvinen, Lachlan J Gunn, N Asokan. arXiv:2406.17548, Jun 2024 (rev. Mar 2025). Attests training-data, training-process, model-behaviour and **inference** properties, including "binding of the output to the model and its corresponding input".

**Consequence for us:** `f_m` and much of `f_req` are prior art. Attesting inference with a TEE is not a contribution in 2026.

### 1.4 Canonical model commitments — *they exist now; §5.6 is out of date*

**OpenSSF Model Signing (OMS)** — spec repository `ossf/model-signing-spec`, "OMS version 1". A manifest lists every file in the bundle by cryptographic hash (SHA-256 default, BLAKE2b optional — a **flat list, not a Merkle tree**), distributed as a detached Sigstore bundle. Model Signing v1.0 launched through the OpenSSF AI/ML Working Group with NVIDIA and HiddenLayer; **Cohere signs all Command models hosted on Hugging Face.**

**Consequence for us — this is a correction, not a nuance.** PoC-Inference §5.6 states that no model creator publishes canonical commitments usable as reference and that "neither exists at the time of writing." That claim is now false as written. The defensible version: a signing *standard* exists with early adoption; it commits to *files at rest*, not to the *weights loaded into the serving process*; and there is no consultable registry a settlement gate can query. **Fix before any public revision.**

The upside is larger than the embarrassment: `QuorumModelOracle` can consume OMS bundles instead of requiring a registry that had to be invented. The defense Hollow-LLM asks for becomes implementable with pieces that ship today.

### 1.5 Billing — *four papers, all asking for what we built, none building it*

- **Token Inflation: How Dishonest Providers Can Overcharge for Large Language Model Usage.** Shahinul Hoque, Jinghuai Zhang, Jinyuan Sun, Fnu Suya. arXiv:2605.30040, 28 May 2026. Hidden reasoning usage inflatable by **1,469% on average without detection**; tokenization ambiguity alone allows **50.85%** over-reporting below detection thresholds — a $100 honest bill becomes ~$1,569. Names the **trust paradox**: audits must rely on provider-controlled evidence. Recommends *"trusted execution attestation, cryptographic proofs of inference, or third-party re-execution."* **Analysis only, no implementation.**
- **CoIn: Counting the Invisible Reasoning Tokens in Commercial Opaque LLM APIs** (arXiv:2505.13778) — third-party auditor, up to 94.7% detection of count inflation.
- **PALACE / Predictive Auditing of Hidden Tokens in LLM APIs** (arXiv:2508.00912) — user-side estimation of hidden reasoning tokens.
- **Invisible Tokens, Visible Bills** (arXiv:2505.18471).

**Consequence for us:** our 2026-08-19 measurement (64 tokens billed, 0 characters visible) is a **known, quantified phenomenon** — not a discovery. But every one of these is a statistical audit from outside, and every one names attested billing as the fix nobody has implemented. `billing_attestation` with reasoning disclosed separately is that implementation.

### 1.6 Capacity — *a software-only competitor exists, and it is good*

**Unprivileged Topology Certificates for Cloud GPU Attestation.** Faruk Alpay, Taylan Alpay. arXiv:2606.24934, 22 Jun 2026. CUDA probes measure per-SM latency maps and memory-hierarchy structure, committed into offline-verifiable certificates. Reported: median temporal jitter **0.09 cycles** over six-hour runs, **100.0% accuracy** distinguishing Blackwell dies by shape alone; identifies a unified V100 memory domain, a two-way H200 L2 split, and a B200 two-die NV-HBI package with a 30-cycle / 15.5 ns cross-die penalty; coarse geolocation against 169 RIPE Atlas probes placing a server within 44 km of its claimed datacentre while rejecting 11 decoy sites. Threat addressed: **GPU substitution enabling capacity or model bait-and-switch fraud**, with no privileged access and no vendor cooperation.

**Consequence for us — this is the hardest hit.** PoC-Inference §4.4 argues capacity is categorically attestation-required and that statistical approaches are "fragile to network jitter and provider-side caching." Here is a software-only method claiming near-perfect discrimination. The §4.4 argument must be narrowed, honestly:

- Their probes run **inside** the machine. That serves a *tenant* renting a GPU; the *end customer of an inference API* cannot run CUDA probes on someone else's node. Our setting is the second one.
- They do not address capacity **tier** substitution (e.g. confirming SM counts) explicitly.
- The two are composable rather than rival: a topology certificate produced *inside the TEE* would give a physically-grounded capacity claim carried by an attested receipt.

### 1.7 The broker role — *already sealed by someone else*

**The Proxy Knows Too Much: Sealing LLM API Routers with Attested TEEs (AEGIS).** Sipeng Xie, Qianhong Wu, Hengrun Lu, Ziliang Sun, Qi Wu, Bo Qin, Qin Wang. arXiv:2606.16358, 15 Jun 2026. An enclave-based API router: the untrusted host does auth, scheduling, accounting and management while the enclave handles plaintext passthrough, with remote attestation so clients can verify router integrity.

**Consequence for us:** "I broker but do not compute" has prior art. But AEGIS protects the *data path through the broker* and explicitly does not address model substitution, billing verification, or provider-level policy. It is complementary, not competing: AEGIS secures the channel, the receipt certifies the provider's execution.

### 1.8 Composite CPU+GPU attestation — *being standardized*

Active IETF RATS work: `draft-ietf-rats-multi-verifier` (a composite attester needs multiple verifiers — one from the CPU vendor, one from the GPU vendor), `draft-richardson-rats-composite-attesters`, `draft-poirier-rats-eat-da` (EAT profile for trustworthy device assignment), `draft-ffm-rats-cca-token` (Arm CCA). Google Cloud Attestation already emits IETF RATS EAT-formatted claims.

**Consequence for us:** the CPU-quote + GPU-token composition implemented on 2026-08-19 is the shape the standards bodies are converging on. Not novel — but mapping our receipt onto RATS vocabulary (Evidence / Attestation Result / Appraisal Policy) buys interoperability and credibility for free, and citing the drafts is cheaper than inventing terms.

### 1.9 Adjacent, worth citing, not threatening

- **VeriLLM** (arXiv:2509.24257, Sep 2025, rev. Jan 2026) — publicly verifiable decentralized inference by lightweight re-execution at ~1% of inference cost, exploiting the prefill/decode asymmetry. No TEE.
- **TeeRollup** (arXiv:2409.14647) — heterogeneous TEEs with a challenge mechanism for TEE unavailability; practical threat model where TEE integrity *and* availability may fail.
- **Trusted Compute Units** (arXiv:2504.15717) — composable framework unifying TEE and zkVM computations.
- **Jolt Atlas** (arXiv:2602.17452) and **zkLLM** (arXiv:2404.16109) — zkML state of the art for §2 background.
- **Sokolov**, arXiv:2608.00801 (1 Aug 2026) and arXiv:2608.03534 (4 Aug 2026) — IETF RATS composed with Action Evidence Packages: the hash of an outcome plus a fresh appraiser nonce folded into an attestation-key-signed quote, resolving **Attested / Contested (measurement swapped) / Expired (stale quote replayed)**; the second paper finds a challenge-nonce **freshness gap** in Project Veraison's TPM reference schemes. Self-described as *"a feasibility demonstration on emulated hardware, not a hardware-rooted guarantee."*

---

## 2. What is unoccupied

One thing, and it is the thing this program was already about.

**Attestations expire. No settlement system notices.**

The evidence that this is a real hole, not a wish:

1. **OTR — the closest and most complete competitor — omits it explicitly.** Its gap list includes: *"No mention of quote expiry windows, revocation lists, or how stale attestations are handled. DCAP quotes have finite validity periods."* OTR settles on-chain, in sub-second finality, against attestations whose lifecycle it does not model.
2. **Sokolov found the same class of bug in a reference implementation** — a challenge-nonce freshness gap in Project Veraison — and had to build the `Expired` verdict by hand. On emulated hardware.
3. **The vendors already treat freshness as first-class and the consumers do not.** NRAS holds nonce/device-certificate pairings with a 24-hour TTL; DCAP collateral carries `issueDate`/`nextUpdate` windows; CRLs expire. Every one of these is a clock that settlement logic currently ignores.
4. **Nobody arrives at this from the crypto side.** The whole field descends from proof systems, where a proof is timeless. Freshness-gated settlement is a discipline imported from DeFi oracles — which is precisely the analogy the PoC framework paper has been making since v0.6.

Secondary, still unoccupied:

- **Billing bound to attested evidence.** Four papers ask for it in their conclusions; none implements it. Ours does.
- **A verdict that is not a boolean.** Every system surveyed answers "attested / not attested." A two-tier market needs "which dimensions were established," and nobody has that shape.

---

## 3. What this means for the paper and the product

**The paper's angle has to rotate.** "Receipts for commercial inference" is 2024-2026 prior art (Laminator, PoEA, Tinfoil, AEGIS). "The effort gap" belongs to Hollow-LLM. What is ours is **freshness-gated settlement over attested inference**: the attestation is a perishable instrument, its age is a settlement predicate, and the receipt reports per-dimension coverage rather than a boolean. Implemented against a real hardware quote, mapped to RATS, and answering — with an actual defense — the protection Hollow-LLM asks for and does not provide.

**Corrections owed before anything is published:**
- §5.6 — canonical model commitments now exist (OMS/Sigstore; Cohere on Hugging Face). Rewrite to the file-level-vs-loaded-weights distinction and the missing *registry*, not the missing *standard*.
- §4.1 / §4.6 — cite Cai et al.; the honest partition is 0-vs-4 in current practice, not 1-vs-3. This strengthens the argument.
- §4.4 — narrow the capacity claim: topology certificates are a software-only counterexample, valid for a tenant inside the machine, not for the end customer of an API. Cite and distinguish.
- §5.2 / §5.7 — the epoch-scoped attestation and the measured costs (272 B, 11–13 µs sign, 27–39 µs verify) replace the current estimates.
- §9 — add: the receipt cannot distinguish an underdisclosing node from a cheating one (found by running it).

**For the product**, the same sentence is the differentiator: not "a marketplace with TEE" — there are several — but **the marketplace where payment fails when the attestation went stale**, which is the one property none of the surveyed systems check.

---

## 4. Verification status

All arXiv entries were confirmed against `arxiv.org/abs/<id>`: title, author list, submission date, and abstract read in full. The Hollow-LLM venue note was read from the paper's comments field. The OMS manifest structure was read from `ossf/model-signing-spec`. Cohere's Hugging Face signing and the Model Signing v1.0 launch come from vendor and OpenSSF announcements — **secondary sources, flagged as such**; confirm against a signed model artifact before either reaches a paper. The Alpay topology-certificate numbers are as reported in the abstract and have not been independently replicated.
