---
name: vibe-plan
description: Use when drafting an implementation plan, choosing an architecture, or asking the agent to plan before mutating files — presents a gated 2-option fork via architect→editor gate.
---

# vibe-plan — Gated Teachable-Fork Planning

> Sources: FINAL-v2 §4 M2/M3 (S-11/S-12, C-05a) · 03 elicitation A-06/A-09/D-02 · 05 companion-ux A-03/A-06/A-09/D-01/D-04 · INDEPENDENT-GEMS GEMS-05/06.

## Install

`vibe-plan` is the **architect→editor gate** (FINAL-v2 M2): no mutations until a plan artefact `.fence/plans/<id>.md` exists. It is a gated 2-option fork with one `choice` item per run (FINAL-v2 M3; 03 A-06).

The 2-option fork renders as a **teachable fork** (05 A-03 fixed-schema card; 03 D-02 forking UX): fast/simple (A) vs scalable/robust (B), each with trade-offs, default preselected, single-click to proceed (S-11; 05 A-03/A-06).

Artifact contract (FINAL-v2 M2 `Architect→Editor`):

```
.fence/plans/<id>.md  — title, context, 2-option fork (A/B + trade-offs), risk,
                        rollout steps, verifier, teaching note (What changed·Why·Your call·How we'll know)
.fence/state/dial.json — updated on accept (per-domain vector behind global knob, S-11/C-05a)
```

Teachable axis orthogonal to autonomy (FINAL-v2 S-05/S-11): dial is scaffolding fade (`max→medium→min→silent`) stored as a per-domain vector in `.fence/state/dial.json` even if v1 UI shows one global knob (S-11/C-05a). Turbo = consequence×reversibility×session-coupling gate (FINAL-v2 S-10) — not conflated with the plan fork.

## Usage

```bash
vibe-fence checkpoint --action "before plan"   # snapshot WIP before drafting
# ... agent writes .fence/plans/<id>.md, then stops for the fork choice ...
vibe-fence check                                # confirm the tree is clean before mutating
```

Agent-side: on a plan request the agent writes `.fence/plans/<id>.md` and **stops mutating** until the user submits `choice` (gated fork — one choice/run, FINAL-v2 M3). Elicitation inside: `1 sample → cheapest verify → on failure parallel best-of-k (k≤5) → first pass wins`; tournament selection (S-12/S-04). Prose-only synthesis: 2–3 candidates + rubric allowed (03 D-02) — never merge code diffs (03 D-02/A-09).

Plan selection surfaces as a card (05 A-03/A-09 — `What changed · Why · Your call · How we'll know`):

| Field | Content |
|-------|---------|
| What changed | Files/tables/routes the plan will touch |
| Why | Constraint that forced the trade-off |
| Your call | A vs B (one-sentence trade-off each), default marked |
| How we'll know | Check that will gate `done` (`compile→lint→tests×2→generated-tests` — S-04) |

Delivery: `.fence/learn/*.md` on disk; pointer/badging only in context (05 A-03/A-04). Never mid-task — only at checkpoint boundary (S-11/05 A-05).

Example plan stub:

```markdown
---
title: Add user profiles + RLS
risk: auth/payments → disagreement-gated escalation
verifier: tsc → lint → tests×2 → generated-tests
---
## Option A — ship fast
Single `profiles` table, client-side fetch, RLS `USING (auth.uid() = user_id)`.
Trade-off: no pagination, no audit — fastest to demo.

## Option B — scale for growth
Normalized `profiles`/`profile_history`, server action, RLS + policy tests.
Trade-off: two migrations, longer review — survives `shared→public`.
```

Muse tiering: `companion` (Muse Spark 1.3) by default; swap to `architect` (Muse Wonder 1.0) for multi-file plan synthesis — cap ≤5 Wonder calls/session, record `model` in artefacts (S-13/GEM-08).

## Verification

| Check | How |
|-------|-----|
| Gate enforces | No file write before `.fence/plans/<id>.md` exists; CI asserts artefact precedes mutation timestamp |
| One choice/run | Second concurrent `choice` item → enqueue as `warn` (FINAL-v2 M3 `max_per_run: 1`) — see M2 queue WIP=1 |
| Mechanical gate | Plan verifier runs `compile→lint→tests×2`; diagnosis artefact before retry (S-04); 2-attempt circuit breaker → read-only consultation |
| Teaching dial | Accepting a fork steps per-domain vector in `.fence/state/dial.json` (TTL+LRU eviction, GEM-02 P2); global knob in `.fence/state/dial.json` |
| Skill lint | No ungrounded `review your own work` without tool signal; `AGENTS.md` ≤400 tokens (M2 `tools/validate.ts`) |

## Anti-patterns

- **Do not auto-generate a large narrative spec** — ≤400-token router, progressive disclosure (FINAL-v2 S-01/C-02/05 A-04). Root doc is a map, not an encyclopedia.
- **Do not stack plans greedily** — WIP=1 Kanban, hard step budget (M2); CCI factorial — all-in beaten by proper subset every condition (S-07).
- **Do not gate code correctness with an LLM judge** — execution > typecheck > lint > learned verifier > judge (S-12/03 A-05/A-09); judge only for prose.
- **Do not merge candidate diffs** — pick `first passing`, never blend patches (03 A-09/D-02).
- **Do not run debate/MoA on the interactive planning path** — net-negative at equal budget; synthesis scoped to plans-only prose (S-12/03 A-04/A-08).
- **Do not conflate teaching with autonomy** — dial is rule-count fade; turbo is containment×reversibility×coupling — orthogonal axes (05 D-01/S-11).
- **Do not use "Turbo" in user-facing copy** — band by guarantee (`guarded→assisted→autonomous→open`), not by speed (FINAL-v2 S-10).
