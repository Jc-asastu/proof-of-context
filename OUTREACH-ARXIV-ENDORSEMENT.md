# arXiv endorsement outreach — template

This file is a working template for the cold-email request to a researcher who can endorse the Proof-of-Context paper for arXiv submission to cs.CY (Computers and Society).

The template fields in `{braces}` are author-fillable. The body is calibrated for a single, specific reader, not a mass-mail. Each send is hand-tuned for one recipient.

---

## Subject line

> **arXiv endorsement request — Proof-of-Context: a settlement-gating verification primitive for decentralized ML**

Short, descriptive, names the paper. The endorsement-request part is what arXiv expects in the subject so the recipient knows the email's scope without opening it.

---

## Body template

```
Hi {first name},

I am Juan Cruz Maisú, an independent researcher based in Buenos Aires
working on verification primitives for decentralized machine learning
and the agent economy.

I am writing to request your endorsement for an arXiv submission to
the cs.CY archive. arXiv requires a first-time submitter to be
endorsed by an existing author in the relevant subject area, and your
work on {specific reader's research area — fill in} is the closest
adjacent intersection I have found to the paper's contribution.

The paper, Proof of Context: The Missing Verification Layer in
Decentralized ML Protocols (v0.6), names a gap between
attestation-as-verification (which existing primitives — proof-of-
learning, zkML, TEE attestations — provide) and attestation-as-
settlement (which they do not). It argues this gap is the structural
analogue, in ML protocols, of the oracle-freshness problem that
accounted for documented value loss across DeFi from 2020 to 2024.

The paper is published as a position paper on GitHub (link below)
and has been implemented across five reference repositories: a
Rust crate with the typed primitive, two JavaScript pay-per-query
data layers (BaseOracle, TrustLayer), a TypeScript DeFi intelligence
service (Vigil), and a TypeScript agent wallet SDK with a Solidity
on-chain verifier (PayClaw). The four JavaScript and TypeScript
implementations produce byte-identical canonical-JSON SHA-256
hashes against shared test vectors and verify each other's
signatures, providing empirical grounding for the framework's
central claims.

I am attaching the paper as PDF and the canonical Markdown
source. Materials and code:

  Paper:           https://github.com/Jc-asastu/proof-of-context
  Wire format:     https://github.com/Jc-asastu/proof-of-context/blob/main/SPEC-WIRE-FORMAT-v0.1.md
  Reference impl:  https://github.com/Jc-asastu/proof-of-context-impl

If you are willing to endorse, the arXiv endorsement code I would
need to enter is:
  KXNZRT

The endorsement does not commit you to anything beyond a one-time
click. arXiv does not ask you to vouch for the paper's correctness;
the endorsement is a check that the submitter is a serious researcher
operating in the field. If your reading of the abstract and a brief
skim of §1 is enough to confirm that, the click closes the loop.

I understand that endorsement requests are common and your time is
finite. If this is not a fit, no reply is needed. If you have
questions about the paper before deciding, I am happy to answer them
on whatever channel works for you.

With appreciation for your time,

Juan Cruz Maisú
juancmaisu@outlook.com
github.com/Jc-asastu
linkedin.com/in/juan-cruz-maisu-b4b610308
```

---

## Recipient candidates (research-adjacency check)

For each candidate, the question to verify before sending is: *does this person have a publication in cs.CY (or a closely-adjacent archive) within the past two to three years that touches on attestation, verification, decentralized ML, oracle freshness, or settlement-gating?*

If yes, they are eligible to endorse cs.CY submissions. If no, the endorsement will not register.

Candidates (initially identified, to be re-verified before sending):

1. **Mohamed Mabrok** — context: identified in earlier session notes as an arXiv endorser candidate. Verify current cs.CY publication history before composing the message.
2. *Open* — second candidate to be identified after re-reading the v0.6 reference list and looking for authors of cited works active on cs.CY.
3. *Open* — third candidate as backup.

The protocol is to send to one candidate at a time, wait three to five business days for response, then move to the next if no reply. Sending to multiple candidates in parallel is poor form on arXiv's side (the endorsement is a one-shot check; repeated requests look spam-shaped).

---

## What to attach

- `paper/proof-of-context.pdf` — the PDF for offline reading.
- A link to the GitHub paper for in-browser reading.
- Optionally, a one-paragraph cover note specific to the recipient if a public-record connection (a paper of theirs you cite, a conversation you had, a shared collaborator) makes the introduction warmer.

---

## What NOT to do

- Send to multiple candidates in parallel.
- Use a generic mass-mail template that does not mention specific work of the recipient.
- Pressure with follow-ups before five business days have passed.
- Treat a non-response as personal rejection. Researchers receive many such emails; non-response is the most common outcome and is not a signal about the paper.

---

## Tracking

Once a send happens, log:

- Date sent
- Recipient
- Specific paper or work of theirs cited in the message
- Date of any reply
- Outcome (endorsement / decline / no reply)

The tracking lives privately. After three sends with no endorsement, the protocol advances to a different distribution path (PhilArchive, conference workshop submission, direct circulation through research labs already engaged).

---

## Author note

The template is conservative on purpose. arXiv endorsement is not the highest-leverage publication move; it is a low-friction step that should be done correctly, not aggressively. The paper's authority comes from the implementations, the wire format, and the body of work — not from arXiv inclusion. Endorsement is one channel among several.

---

Juan Cruz Maisú ♥
