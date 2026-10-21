# Agent Charter — vibe-fence

_Source: `docs/research/synthesis/FINAL-v4.md` §6 (15 anti-patterns — 14→15 in v4: S-11a rollback invariant) + S-05/S-06/S-10/S-11 + reference harness template._

## What the AI handles
- Language understanding and generation; explaining deterministic findings to the user (`{finding_id, explanation, question, options, evidence_ids}` — S-05).
- Proposing fixes and teaching via the dial (`max→medium→min→silent`); delivering cards at checkpoint boundaries, never mid-task (S-11).
- Plan synthesis: 2–3 candidates + rubric for prose only; `1→verify→best-of-k` (Tournament Selection) for code (S-12).

## What deterministic code and rules handle
- Every `block` maps to an executable check; no check → never a block (S-05). Verdicts `pass/fail/unknown/not-applicable`; `unknown≠pass` (S-09).
- Routing (`AGENTS.md` ≤400 tokens), context budgets (`src/framework/context-budget.yml`, 4 KB shell caps), integrity attestation (SHA-256 + `FENCE_SYNC_TOKEN` — S-06/GEM-01), severity from `.fence/app-profile.json` (`local`/`shared`/`public` → 14/29/55 blocks — S-09).
- Mechanical verification: `Read→Think→Write→Check` + trust ladder `compile→lint→tests×2→generated-tests→judge-for-prose` + diagnosis artefact before retry (S-04).
- Containment: `realpath` boundary + credential hard-deny + egress allowlist + git checkpoint + `fence undo` (S-10).

## What humans handle
- Approving PRD scope and phase gates; setting teaching dial and consequence tier (`guarded→assisted→autonomous→open` — never user-facing "Turbo").
- Choosing between the gated 2-option fork (fast/simple vs scalable/robust) in `vibe-plan` (M3).
- Training-use disclosure opt-in (`--contributor-mode` — S-15/GEM-09); secrets allowlists and mitigation ownership/expiry.

## Prohibited actions
- Editing/relaxing own checks or teaching gates; minting credential/secret findings without a check (S-05, §6 #8).
- Treating tool output as trusted; relying on system/user role split as security hierarchy (§6 #9).
- Stacking scaffold greedily without A/B isolation+combination (S-07/CCI factorial).
- Using `reasoning_effort:"none"`, recursive JSON Schema, or `tool_search`+`json_schema` together (§6 #12).
- Deleting/skipping tests to green CI; catching auth failures and continuing (§6 #14).
- Defaulting Contributor pricing for private code; shipping CSP `block` without Report-Only; shipping secrets without allowlist (§6 #10).

## Do not build
- Backend gateway/proxy or single-runtime rule files as primary safety (§6 #2).
- Large narrative `AGENTS.md` — ship ≤400-token router only (§6 #1).
- LLM judge gating for code or merged candidate diffs (§6 #6).
- Ungrounded self-critique, debate, or MoA on the interactive path (§6 #7).
- SAM 3.1 on the critical path; unverified SAM/Image/country specs (§6 #11).
- Browser/WebContainer/mobile runtimes as claimed scope — Desktop CLIs v1 only (M4 scope guard).
