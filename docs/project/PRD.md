---
schema: vibe-fence-prd/1
status: approved
approvedDigest: pending-m1-lock
approver: user
approvedAt: "2026-10-20T00:00:00Z"
source: docs/research/synthesis/FINAL-v4.md  # 221 lines 2026-10-21; supersedes v3→v2→FINAL (all retained)
---

# Product Requirements Document: vibe-fence

## Overview

Drop-in harness that makes any AI coding agent behave like a senior-dev companion for non-technical vibe-coders. Wraps Codex, OpenCode, Cursor, Hermes, Antigravity, etc. with deterministic guardrails, progressive disclosure, and mechanical verification.

**Research provenance:** 6 streams × 6 contributors · ~165 sources · 15 settled decisions S-01..S-15 · 10 contested C-01..C-10+3 sub-rows · M1–M4 milestone plan · 11 GEM patches (P0/P1/P2) — all locked in `docs/research/synthesis/FINAL-v4.md` (221 lines, 2026-10-21; Deep-Read Vault Expansion 14 docs/4 clusters; supersedes v3→v2→FINAL — prior versions retained).

## Requirements & Scope

6 research streams map to 4 implementation milestones (M1–M4):

| Stream | Question | Milestone |
|--------|----------|-----------|
| 01 Existing harnesses | What exists, what each gets right/wrong for non-technical users? | M1 skeleton, M4 adapters |
| 02 Harness → output quality | How scaffolding causally improves LLM output (context budgeting, verification)? | M2 framework primitives |
| 03 Elicitation & synthesis | Which sampling/critique patterns beat single-pass (best-of-k, Tournament Selection)? | M2 verifier + M3 skills |
| 04 Developer guardrails | Objective rights/wrongs: OWASP, secrets, deps, auth, RLS, privacy? | M3 guardrail packets |
| 05 Companion UX | Teaching dial (max→silent) + turbo + issue-queue UX? | M2 dial/queue + M3 teaching |
| 06 Meta models (hackathon) | Muse Spark / Image / SAM 3.1 integration for scoring + product value? | M4 adapters + demo |

### M1 — Project Skeleton (no upstream deps; unblocks all)

`src/` sole editable authority → `dist/` disposable; `tools/{generate,validate,install}.ts` enforce parity + budget + freshness; `docs/project/INDEX.md` router; `.fence/` single-owner state tree; `.fence/app-profile.json`; integrity attestation; WebContainer probe.

### M2 — Framework Primitives (needs M1)

`AGENTS.md` ≤400-token assertion; `src/framework/context-budget.yml`; silent Reflexion circuit + Tournament Selection + 2-Attempt Circuit Breaker; step budget + WIP=1 + telemetry; Architect→Editor gate; `src/adapters/{claude,codex,cursor,opencode,hermes}.yml`; byte-capped pipeline; `src/config/severity-policy.json`; teaching dial `.fence/state/dial.json`; `src/framework/verifier.ts` ephemeral smoke suite.

### M3 — Skill Definitions (needs M1/M2)

Progressive-disclosure `SKILL.md`; `vibe-guard` rule records + severity `pass/fail/unknown/not-applicable`; full guardrail packet (secrets, CSP, auth, RLS, deps, privacy); `vibe-plan` 2-option fork + `vibe-teach` card; elicitation `1→verify→best-of-k`; remote RLS verification; fixture anonymizer; billing guard; lessons/escalation/queue.

### M4 — Adapters + Installer (needs M1–M3)

`npx vibe-fence init` idempotent <3s; Spark 1.3 via `POST /v1/responses` + Wonder 1.0 escalation + Standard-mode default; Codex/Claude/Codex/Hermes reference adapters; hook surface with FP budget; `fence look` + `events.ndjson`; adversarial bench + seeded fixtures; SAM contract; Visceral Delta demo + 5×4 rubric.

## Quality & Constraints

- Bun + TypeScript only (zero external runtime dependencies in production).
- `src/` is sole editable authority; `dist/` disposable and deterministically generated.
- `AGENTS.md` ≤400 tokens (S-01); token budget enforced by `tools/validate.ts`.
- Mechanical verification gates "done" (S-04); deterministic fence decides, model explains (S-05).
- No `reasoning_effort:"none"`, no recursive JSON Schema, no `tool_search`+`json_schema` together (S-06 §6 rule 12).
- S-01..S-15 settled; C-01..C-10+3 carried as instrumented evals, not hard-coded.
- 15 anti-patterns in `FINAL-v4.md` §6 are non-negotiable (14→15 in v4: new rule 15 rollback invariant S-11a).

## Traceability

| PRD section | Source |
|-------------|--------|
| All milestones | `FINAL-v4.md` §4 M1–M4 |
| S-01..S-15 (+S-06a/S-11a) | `FINAL-v4.md` §2 |
| C-01..C-10+3 | `FINAL-v4.md` §3 |
| GEM patches | `FINAL-v4.md` §4 + `INDEPENDENT-GEMS.md` |
| Blind spots B-01..B-08 | `FINAL-v4.md` §5 |
| Anti-patterns | `FINAL-v4.md` §6 (15 rules) |
| Demo + rubric | `FINAL-v4.md` §7 |
