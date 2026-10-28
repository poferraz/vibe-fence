# vibe-fence Index

This is the canonical map for this project. Read this file first on every new task.

Current direction: [product direction](PRODUCT-DIRECTION.md). The user selected a plug-in harness for existing coding tools, with enforced, Git-guarded, and advisory coverage described honestly. This supersedes the older owned-CLI product choice. Read the [README](../../README.md) for current capability and limitations; [STATUS](STATUS.md) contains historical handoffs.

## Identity

`vibe-fence` — An experimental harness for non-technical builders using coding agents, with deterministic checks and host-specific integrations. Enforcement depends on the host and configuration.

## Folder Structure

- `docs/project/` — canonical project map, status, and PRD (this directory).
- `docs/research/` — Phase 0 research: 6 streams, synthesis, and `FINAL-v4.md` (single source of truth; 221 lines, 2026-10-21; supersedes `FINAL-v3.md` → `FINAL-v2.md` → `FINAL.md` — prior versions retained).
- `src/` — sole editable authority (adapters, framework, schemas, skills, templates, config). `dist/` is disposable.
- `tools/` — deterministic build, validate, and install tooling (TypeScript + Bun).
- `tests/` — unit tests and behavioral fixture testbeds.
- `dist/` — disposable, deterministically generated output from `src/` via `tools/generate.ts`.

## Routing Table

| Task | Go to | Read |
|------|-------|------|
| Product direction and protection levels | `docs/project/PRODUCT-DIRECTION.md` | Current direction and scope of each protection level |
| Historical status | `docs/project/STATUS.md` | Earlier milestones and handoffs; current private work may be indexed locally |
| Requirements & scope | `docs/project/PRD.md` | Approved requirements (streams → milestones) |
| Research source of truth | `docs/research/synthesis/FINAL-v4.md` (221 lines, 2026-10-21) | S-01..S-15 + S-06a/S-11a, C-01..C-10+3, M1–M4 checklist, GEM patches |
| M1 — Project skeleton | `src/`, `tools/`, `docs/project/` | `FINAL-v4.md` §4 M1; `docs/project/INDEX.md` + `STATUS.md` wiring |
| M2 — Framework primitives | `src/framework/`, `src/config/` | `FINAL-v4.md` §4 M2: context budget, circuit breaker, verifier, dial |
| M3 — Skill definitions | `src/skills/`, `src/schemas/` | `FINAL-v4.md` §4 M3: `vibe-init`, `vibe-guard`, `vibe-plan`, `vibe-teach` |
| M4 — Adapters + installer | `src/adapters/`, `tools/` | `FINAL-v4.md` §4 M4: `npx vibe-fence init`, runtime wiring, SAM |
| Deep-Reads (vault) | `docs/research/synthesis/deepread-*.md` | 4 reports: agents-prompting (6 docs), harness-cluster (3), research-cluster (5), vibe-coding (4+goal-blind) — see `research/INDEX.md` |
| Tooling & deployment | `tools/` | `tools/generate.ts`, `tools/validate.ts`, `tools/install.ts` |
| Testing & verification | `tests/` | `tests/` |

## Rules

- One fact, one location: `src/` is the only source of truth; `docs/project/` is the only project map.
- `FINAL-v4.md` records research decisions and context; the current product direction and verified source behavior take precedence where earlier product plans were superseded.
- Load only the context the current task needs.
- Update `docs/project/STATUS.md` at meaningful milestones.
- `src/` → `dist/` parity enforced by `tools/validate.ts`; never edit `dist/` directly.
