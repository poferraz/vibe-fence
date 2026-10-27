# vibe-fence — One command makes any AI coding agent safe.

> **Indie track · Build for Your World — Meta Global AI Developer Hackathon (Oct 26–Nov 4, 2026)**
> A Meta harness for non-technical builders: every agent you use is wrapped in a fence that ships structure, safety, and a teaching companion — without you deciding on security.

[![CI](https://github.com/poferraz/vibe-fence/actions/workflows/ci.yml/badge.svg)](https://github.com/poferraz/vibe-fence/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/vibe-fence?label=npm)](https://www.npmjs.com/package/vibe-fence)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Meta%20Global%20AI%20Hackathon-Indie%20%E2%80%94%20Build%20for%20Your%20World-0066FF)](https://www.cerebralvalley.ai/e/meta-ai-developer-hackathon)
[![Muse Spark](https://img.shields.io/badge/Muse%20Spark-via%20Meta%20Model%20API-0066FF)](#use-of-meta-ai-tooling--muse-spark--muse-image--sam-31--meta-model-api--open-weights--muse-code-25)

**One command:**

```sh
npx vibe-fence init
# 🛡️ vibe-fence active — native mode — 6 adapters — 43ms
```

> Until `v0.2.0` is published to npm (human-owned step), `npx vibe-fence` 404s — run from source instead: `git clone https://github.com/poferraz/vibe-fence.git && cd vibe-fence && bun install && bun run build`, then `node dist/cli.js init`.

The fence drops `AGENTS.md` + `.fence/` state + skills + adapter wiring. Every later agent turn is read→think→write→check: the deterministic fence decides, the model explains.

---

## Where judges find what — criterion alignment

| Criterion | Weight | Where in this repo | Status |
|-----------|--------|--------------------|--------|
| **Impact — Real-world potential** | **30%** | [Impact](#impact--real-world-potential-30) · `PRODUCT.md` JTBD + before/after | ✅ |
| **Use of Meta AI Tooling — Muse Spark · Muse Image · SAM 3.1 · Meta Model API · Muse Code** | **25%** | [Meta Tooling](#use-of-meta-ai-tooling--muse-spark--muse-image--sam-31--meta-model-api--open-weights--muse-code-25) · `src/framework/meta-client.ts` + `sam.ts` | ✅ |
| **Demo — Working, impressive, holds up live** | **25%** | [Demo](#demo--working-impressive-holds-up-live-25) · `docs/research/synthesis/DEMO-SCRIPT.md` · CI badge (green = holds up) | ✅ scaffold · 🎬 video lands D8–9 |
| **Technical Depth and Execution — Sound, refined, crafted** | **20%** | [Technical Depth](#technical-depth-and-execution--sound-refined-crafted-20) · `REHEARSAL.md` 6/8 + 2 open · 5×4 rubric + unsafe-action rate | ✅ |

Indie lens: *creativity, technical ambition, whether it works* — see [Demo](#demo--working-impressive-holds-up-live-25) (whether it works) + [Impact](#impact--real-world-potential-30) (creativity — new product surface) + [Technical Depth](#technical-depth-and-execution--sound-refined-crafted-20) (ambition — deterministic rule engine + proof beats).

---

## Impact — Real-world potential (30%)

**Who benefits:** The non-technical vibe-coder who ships "add user profiles and a database" by chatting with an agent — and cannot judge whether that agent leaked a `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` into the browser bundle, skipped RLS, pinned an untrusted action at `main`, or hallucinated a plan.

**How much it matters:** Those failures are not "bugs" — they are shipped vulnerabilities. `gitleaks` + push protection alone miss shape-based env leaks and credential-path reads (`~/.ssh`, `~/.aws`) plus supply-chain `postinstall` plants. vibe-fence closes them as **10 zero-FP hard-blocks (S-09, exit 1, all tiers)** — the fence blocks, the agent teaches the fix.

**Could become something people use:** One command, 3 s, 6 adapters (Claude, Cursor, Codex, OpenCode, Antigravity, Hermes). `src/` is sole authority → `dist/` is disposable (`bun run build`). `AGENTS.md` router is retrieval-gated (≤400 tokens, not always-on — S-01). WebContainer path exists for StackBlitz/CodeSandbox parity (GEM-02). This is not a demo — it is installable now.

**Fits the problem statement:** *Build for Your World* — bring Meta's models into a world you know firsthand (retail ops, vibe-coding safety). The harness is the product: it makes every builder in every domain safer. Theme source: two hackathon themes — *Build for Your World* vs *Push the Frontier* (software, robotics, manufacturing, energy, materials).

---

## Use of Meta AI Tooling — Muse Spark · Muse Image · SAM 3.1 · Meta Model API · Open-weights · Muse Code (25%)

Beyond a basic integration — each model powers a distinct fence surface:

| Model / tool | Feature | Call |
|--------------|---------|------|
| **Muse Spark** (companion) | Safety reasoning — the fence's voice, goal-blind (S-11), one-line fix + plan | `POST /v1/responses` stateless replay, `muse-spark-1.3` (`src/framework/meta-client.ts`) |
| **Muse Wonder** (escalation) | Architect review — dual-tier routing (GEM-08), `companion → Wonder` on verifier fail | Same endpoint, `muse-wonder-1.0`, `FENCE_SYNC_TOKEN`-gated |
| **Muse Image** | Generated UI assets in demo — Muse Image logo → `public/images/` per `DEMO-SCRIPT.md` 2:00→3:00 | Meta Model API image generation |
| **SAM 3.1** | Visual guardrails — screenshot diff / fence-look Playwright spot-check (S-14 PFLOP trace) | `src/framework/sam.ts` + `sam-guard.test.ts` |
| **Meta open-weights** | Offline `local` tier (14 blocks vs 29 shared / 55 public) — `app-profile.json` tier guard | Local inference path, no Model API key required |
| **Muse Code** | Built-with story — the harness is itself built using the agent it secures | Agentic coding agent — harness development |

All Model API calls run stateless replay (never `previous_response_id`) — see stream 06 (Meta models) synthesis + `docs/research/synthesis/ARGON-AUDIT-v2.md` D-02. The prompt is goal-blind (S-11) — the model never sees the fence's success criterion, only the task + verifier artefact.

---

## Demo — Working, impressive, holds up live (25%)

> Demo video lands in the D8–9 window per `DEMO-SCRIPT.md` — placeholder below updates on that commit.

[![Demo — placeholder](https://img.shields.io/badge/demo-video%20lands%20D8--9-00D4AA)](#)

**What the demo proves (Visceral Delta — 0:00→3:00, no architecture narration):**

- **0:00→1:00 Unfenced Disaster** — `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in browser bundle (Sources panel), missing RLS (`SELECT *` leaks rows), unhandled crash.
- **1:00→2:00 The Intervention** — `npx vibe-fence init` live with wall-clock timer (<3 s), secret flagged `block`, `checkpoint:` commit in `git log --oneline`, Muse Spark plan + 2-option teachable fork, FENCE_SYNC_TOKEN rotation.
- **2:00→3:00 Polish & Ship** — Muse Image logo appears in `public/images/`, Reflexion green checks, live deploy URL.

**Run it live — under 2 minutes, no secrets needed (fixture mode):**

```sh
git clone https://github.com/poferraz/vibe-fence.git && cd vibe-fence
bun install && bun run build
# Try in a scratch repo (idempotent — run ×3, zero churn):
/tmp/fence-try && git init && bun run /path/to/vibe-fence/tools/install.ts
# Or after npm publish:
npx vibe-fence init
```

Full script + production checklist + acceptance rubric: [`docs/research/synthesis/DEMO-SCRIPT.md`](docs/research/synthesis/DEMO-SCRIPT.md) (GEM-10 P0).

CI is the "holds up live" proof: every push runs `tsc --noEmit` + `build` + `validate` + `bun test` + `bun run eval` + `npm pack` — badge must be green.

---

## Technical Depth and Execution — Sound, refined, crafted (20%)

**Architecture:** Deterministic rule engine (`src/rules/`, 11 rules) + self-contained CLI (`src/cli.ts` → `dist/cli.js`) + 6 host adapters (`src/adapters/`). No backend, no always-on daemon — checks run at write/commit time via the CLI, git hooks, and host plugins. A web surface is deferred: no `vibe-fence web` command ships; the replication notes in `docs/research/synthesis/META-REPLICATION-PLAN.md` are a design reference, not shipped behavior.

**Soundness gates:**

- `AGENTS.md` ≤400 tok router, retrieval-gated (S-01), JIT via `docs/fence/INDEX.md`
- 10 zero-FP hard-blocks (S-09) — SEC-01/02/03, FS-01, CMD-01, **NET-01 `curl|sh`**, SUP-01, GIT-01, DB-01, PRV-09 — plus BILL-01 (warn) — `src/rules/` + `src/config/severity-policy.json`
- `FENCE_OWNED_FILES` integrity attestation + `FENCE_SYNC_TOKEN` ephemeral gate (`src/framework/integrity.ts`, S-05/S-06) + `postinstall-guard.sh`
- `fence undo` rollback invariant (S-11a) + privilege isolation — `src/framework/git.ts:CHECKPOINT_PREFIX` / `UNDO_SPEC`
- Verifier trust ladder (S-06a) — `compile` + `hasTests` implemented, `generated`/`judge-for-prose` spec'd with gated TODOs
- Deterministic build: `src/` sole authority → `dist/` + `dist/cli.js` bin (`tools/generate.ts` + `PROVENANCE.md`)

**Adversary-validated:** 6/8 content checks PASS in `docs/project/REHEARSAL.md` (§A installer ×3 idempotence — 53/64/63 ms, §B bench 1–3, §C 4–8 with NET-01 + SEC-02 fixes `ed8a25a`/`020e864`); T2 (contradiction lint) + T8 (postinstall shim) open, tracked in REHEARSAL.

**Evals — 5×4 rubric + unsafe-action rate** (FINAL-v4 §7):

| Task / Rubric | Structure | Secrets | Git | Deploy |
|---------------|-----------|---------|-----|--------|
| `auth` | scaffold + routes | `NEXT_PUBLIC_` lint | checkpoint + no-detached-HEAD | headers/CSP |
| `paid API` | BILL-01 guard | no key in bundle | — | rate-limit present |
| `bug fix` | verifier ladder | — | `undo` works | fix shipped |
| `ship-to-prod` | build gate | Report-Only→enforce | rollback test | live URL |
| `add-dep` | lockfile + SBOM | `onlyBuiltDependencies` | — | cooldown check |

Report **success and unsafe-action rate** per task; gate releases on the latter (ClawsBench — capability ≠ safety).

---

## How it works — 30 seconds

1. `npx vibe-fence init` seeds `.fence/` + `AGENTS.md` fence block + adapter configs.
2. You build — the fence watches writes (integrity + rules + context budget).
3. A card appears when the fence finds something to harden — approve and the agent fixes it in your repo.

## How it forks when you don't know

```
prompt              fence (deterministic)          agent (model)
  │                        │                          │
  ├── "add profiles" ──→  structure lint              │
  │                    ──→  secret lint (NEXT_PUBLIC)──→ "move to server action"
  │                    ──→  checkpoint commit ────────→  plan card (2 options)
  │                                               click → scaffolds routes + RLS
```

## Before / After — Visceral Delta

| Unfenced | Fenced |
|----------|--------|
| `NEXT_PUBLIC_SERVICE_ROLE_KEY` in bundle | Blocked — moved to Server Action, env.example only |
| `SELECT *` leaks rows (no RLS) | RLS policy + migration + test |
| Crash on save (no verifier) | Verifier `compile` fails → agent fixes → green |

## Quickstart

```sh
# In your project repo (after npm publish; until then use the source path below):
npx vibe-fence init

# From source (works today):
git clone https://github.com/poferraz/vibe-fence.git && cd vibe-fence
bun install && bun run build && bun run validate

# Verify:
bunx tsc --noEmit   # 0 errors
bun run validate    # AGENTS ≤400 tok, SKILL budgets, schemas
```

## Architecture

```
src/
  adapters/      — Claude, Cursor, Codex, OpenCode, Antigravity, Hermes (types.ts is authority, .yml are profiles)
  framework/     — integrity, verifier, meta-client (Muse Spark/Wonder via POST /v1/responses), sam, git (checkpoint/undo), queue, dial, billing-guard, fence-look
  rules/         — 11 rules: 10 block (S-09) — sec-01/02/03, net-01, fs-01, cmd-01, sup-01, git-01, db-01, prv-09 — + bill-01 (warn)
  skills/        — vibe-init / vibe-guard / vibe-plan / vibe-teach (Anthropic Skills spec)
  config/        — severity-policy.json (tiered local/shared/public)
  templates/     — app-profile.json (14/29/55 blocks), postinstall-guard.sh
tools/           — generate.ts (src→dist), validate.ts, install.ts (npx init), anonymize.ts
docs/
  research/      — FINAL-v4.md (source of truth, 186 sources) + per-stream synthesis + Argon audit
  project/       — STATUS, RECONCILE, REHEARSAL (6/8 + 2 open)
```

Product boundary (what is explicitly deferred): Electron desktop, mobile — see `PRODUCT.md`. Web UI replica is deferred (no `vibe-fence web` command ships) — design notes in `docs/research/synthesis/META-REPLICATION-PLAN.md`.

## Roadmap — Oct 26 → Nov 4 (Meta Global AI Developer Hackathon build window)

| Dates | Scope |
|-------|-------|
| Oct 26 | **Public repo + CI live** ← you are here |
| Oct 27–28 | PFLOP trace + remaining hard-blocks, fence-look wiring |
| Oct 29–30 | Muse Spark/Wonder live + verify-remote |
| Oct 31–Nov 1 | Before/after demo app + 5×4 evals |
| Nov 2–3 | Demo video (Visceral Delta) + landing snippet |
| Nov 4 | Submit (deadline 9PM ET) · [Event page](https://www.cerebralvalley.ai/e/meta-ai-developer-hackathon/details) → Judging Nov 4–8 → Closing Nov 9 |

Releases: `v0.1.0` (this — scaffold landed) → `v0.2.0` (CI + governance) → `v0.3.0` (Meta tooling live) → `v1.0.0` freeze Nov 4.

## Contributing

See `CONTRIBUTING.md` — `bun install`, make changes only in `src/`/`tools/`, verify with `typecheck` + `build` + `validate` before PR. Security issues → `SECURITY.md` (private reporting, not public issues).

## License

MIT — see `LICENSE`.

## Research

Phase 0 deep research (Oct 20–25, 6 streams × 5–6 contributors, ~165 sources) → `docs/research/SOURCES.md` (186 entries) → `FINAL-v4.md` (locked 2026-10-21). Prior versions retained (`FINAL-v3.md` → `FINAL-v2.md` → `FINAL.md`). Synthesis explorer: [`docs/research/synthesis-explorer.html`](docs/research/synthesis-explorer.html).
