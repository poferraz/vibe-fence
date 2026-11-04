# Submission draft: Vibe-fence

Use this as source material for the submission form. Add the final video URL and verified public revision before submitting.

## Title and tagline

**Vibe-fence** — a safety net that helps first-time builders understand risky AI coding actions before they land.

## The problem

AI coding agents let people build things before they have learned security fundamentals. A beginner can ask an agent to make a payment key available in a page, approve the edit, and have no reason to recognize the exposure. Vibe-fence aims to turn selected high-risk moments into an interruption and a teachable explanation.

## What it does

Vibe-fence installs a local pre-tool hook for Muse Code and supported coding agents, plus Git checks. When a supported action matches a rule, it can block the action and provide a plain-language next step. The demo uses a synthetic, secret-shaped environment variable; it contains no actual credential. Before installation, Muse makes the requested change. After installation and a fresh trusted session, the same request is blocked and the page remains unchanged.

The scanner is pattern-based and bounded. Some integrations warn and allow an action if their gate is unavailable; Git hooks can be bypassed. A clean result does not prove the project is secure.

## How Meta's model fits

The live workflow pairs **Muse Code running Muse Spark 1.3** with Vibe-fence's local checks. Muse interprets the builder's request and attempts the edit; Vibe-fence's deterministic pre-tool gate inspects the supported call and returns a block plus a repair instruction; Muse can then explain that result in context. This separates the language model's helpful interaction from the repeatable local safety decision.

Vibe-fence also has an independent, opt-in `--explain` path that calls **Muse Spark** for a short explanation of fixed finding categories. That request excludes source contents, filenames and raw tool arguments; the user's coding agent handles its own context separately. The block does not depend on the explanation succeeding. See [explain.ts](../src/framework/explain.ts), [meta-client.ts](../src/framework/meta-client.ts), the [Muse adapter](../src/adapters/muse.ts), and [evidence](../docs/EVIDENCE.md).

We do not claim that an open-weight model is deployed, that SAM or Wonder powers the demonstrated workflow, or that the model independently makes the enforcement decision.

## What was built when

Before the event, I had a personal scaffold with research, adapter scaffolds, Git helpers and preliminary rules. After the reported October 26 kickoff, I expanded the checks and Git scanning and added the optional Muse Spark explanation; subsequent work added hardening and evaluation. On November 4 I fixed a secret-rule false negative, built the native Muse Code hook and its tests, and prepared the synthetic before-and-after demo. [The provenance matrix](../docs/BUILD-PROVENANCE.md) breaks down dates and evidence; whether the October 26 work qualifies is for the organizers to decide.

## Evidence and judge test

The public repository includes the rule implementation, adapter and tests. Local verification and its limits are recorded in [EVIDENCE.md](../docs/EVIDENCE.md). To reproduce, use a disposable Git project, install with `npx --yes vibe-fence@0.4.0 init --profile=muse` once that version is published, start a new trusted Muse session, and exercise a synthetic action. The [recording guide](MUSE-RECORDING-GUIDE.md) contains the exact prompt and expected before-and-after results.

- Repository: https://github.com/poferraz/vibe-fence
- Verified revision: **[fill in after publication]**
- Video: **[paste the playable link]**
