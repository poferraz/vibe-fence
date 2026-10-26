---
description-agent: "Canonical map — every doc/skill/tool reachable via this index. L1: name + description at startup; L2: summary on match; L3: full body on explicit request."
---

# docs/fence/INDEX.md — Canonical Map

> L1 disclosure: this page emits metadata only (name + one-line Why). Load L2/L3 via linked file reads — never preload all skills.

| Doc | Path | Why |
|-----|------|-----|
| Current product direction | `docs/superpowers/specs/2026-10-26-senior-developer-harness-design.md` | User-selected owned CLI + Meta senior-developer harness; read before feature planning; detailed design proposed |
| Current work and handoff | `docs/project/STATUS.md` | Start here for audit findings, current decision, and next action |
| AGENTS router | `AGENTS.md` | ≤400tok entry point; retrieval-gated S-01 |
| Plan | `docs/PLAN.md` | Phases M1–M4 + hackathon scope |
| Locked decisions | `docs/research/synthesis/FINAL-v4.md` | S-01…S-15, C-01…C-10, GEM patches |
| Bibliography | `docs/research/SOURCES.md` | 186 entries A–H, paper-grade |
| Research index | `docs/research/INDEX.md` | 6 streams + prompts + contributors |
| Fence map | `docs/fence/INDEX.md` | This file — canonical inventory |
| Context budget | `src/framework/context-budget.yml` | S-03 caps: static/dynamic/history/headroom + 4KB pipe |
| Integrity | `src/framework/integrity.ts` | S-06 SHA-256 attestation + unicode scan |
| Verifier | `src/framework/verifier.ts` | S-04 trust ladder + S-06a ephemeral gate |
| Circuit breaker | `src/framework/circuit-breaker.ts` | S-04 2-attempt → read-only |
| Teaching dial | `src/framework/dial.ts` | S-11 max→silent, goal-blind |
| Git helpers | `src/framework/git.ts` | Checkpoint + undo |
| SAM guard | `src/framework/sam.ts` | SAM contract, geometry not semantics |
| Meta client | `src/framework/meta-client.ts` | Spark/Wonder routing S-13 |
| vibe-init | `src/skills/vibe-init/SKILL.md` | Scaffolding + init |
| vibe-guard | `src/skills/vibe-guard/SKILL.md` | Guardrail enforcement S-09 |
| vibe-plan | `src/skills/vibe-plan/SKILL.md` | Contract-pinned planning S-08 |
| vibe-teach | `src/skills/vibe-teach/SKILL.md` | Teaching dial companion S-11 |
| Generator | `tools/generate.ts` | src→dist copy + PROVENANCE |
| Validator | `tools/validate.ts` | AGENTS ≤400tok + SKILL + schema gates |
| Installer | `tools/install.ts` | npx vibe-fence init + WebContainer probe |
| Charter | `docs/project/AGENT-CHARTER.md` | Agent behavioral charter |
| ECC appendix | `docs/project/APPENDIX-ECC.md` | ECC deep-dive |

## L1 disclosure note (S-02/S-03)

Each skill exposes L1 frontmatter (`name` + `description` ≤1024 chars) at session start. L2 body ≤5K words loads on keyword/intent match. L3 refs load only on explicit request. Log L3 loads to `.fence/state/budgets.json`.
