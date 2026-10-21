# Plan → Scaffold (M1–M4) → Harness

> **For Hermes:** Use `subagent-driven-development` to implement task-by-task (fresh `delegate_task` per task, spec review then quality review).

**Goal:** Close every M1–M4 gap in `FINAL-v4.md` §4 + GEMS→files map so `npx vibe-fence init` is shippable and `docs/research/SOURCES.md` is the paper-grade bibliography. 39 checklist rows across 4 milestones, 11 GEMS + S-06a/S-11a + Vault deep-reads wired.

**Source of truth:** `docs/research/synthesis/FINAL-v4.md` (221 lines, 2026-10-21; `docs/research/SOURCES.md` 186 entries A–H) + `docs/project/RECONCILE.md` (GEMS→files vs disk) + `docs/research/SOURCES.md` (Argon 737 + ECC 866 + Vault 48KB).

**Tech stack:** Bun + TypeScript strict (`bunx tsc --noEmit` gates every task) — no new runtime deps.

**Branch:** `main` (pre-completion, no commits yet). **Merge gate:** user approval after `bun run validate` green + manual `npx vibe-fence init` dry-run in a scratch repo.

---

## Execution order (Argon 8-day re-sequence; see FINAL-v4 §4 footer)

D1–3: M1 skeleton + P0 hardening → D4–5: M2 primitives + plan/verify tier → D6–7: M3 skills + M3 packets → D8–10: M4 adapters + bench + Visceral Delta + submit.

---

## M1 — Project Skeleton (no upstream deps except FINAL-v4)

### Task 1 — Wire `AGENTS.md` + `docs/fence/INDEX.md` routers (S-01, S-03 L1/L2)

**Objective:** AGENTS ≤400tok router exists on disk; `docs/fence/INDEX.md` is the doc index the router points at.

**Files:**
- Create: `AGENTS.md` (repo root — thin router, ≤400 tok, points to `docs/fence/INDEX.md` + `docs/research/SOURCES.md`)
- Create: `docs/fence/INDEX.md` (inventory of `docs/fence/*.md` + `docs/research/*` + per-page `description-agent` frontmatter)
- Verify: `tools/validate.ts` already asserts AGENTS ≤400 tok; `bun run validate` must green.

**Steps:**
1. Write `AGENTS.md` — 40–60 lines: project one-liner + "docs live at" pointer + build contract (`src→dist`, `bunx tsc`) + S-01 canon + anti-sycophancy one-liner.
2. Write `docs/fence/INDEX.md` — table of `AGENTS.md`, `docs/PLAN.md`, `docs/research/SOURCES.md`, `src/framework/*.ts`, `src/skills/*/SKILL.md`, `tools/*` + short "why" per row; L1 disclosure contract.
3. `bun run validate` — no token-budget trip.

### Task 2 — `.fence/` skeleton + `app-profile.json` template (S-09)

**Objective:** `.fence/app-profile.json` exists as a commitable template (`local/shared/public` → 14/29/55 blocks) + `.gitignore` covers `.fence/.integrity.json`.

**Files:**
- Create: `src/templates/app-profile.json` (canonical template — installer copies to `.fence/app-profile.json`)
- Modify: `tools/install.ts` — ensure it copies template on init; records `runtime: native|webcontainer` (GEM-02)
- Verify: `bunx tsc --noEmit` + `bun run validate`

### Task 3 — Integrity attestation lock-down (S-06 + GEM-01 P0)

**Objective:** `src/framework/integrity.ts` has no TODOs for the P0 path; `.fence/hooks/postinstall-guard.sh` template exists on disk.

**Files:**
- Patch: `src/framework/integrity.ts` — implement `verifyAttestation` hash compare (no token bypass), `scanInvisibleUnicode` (regex `[\u200B-\u200D\uFEFF\u202A-\u202E\u2060-\u206F]`), atomic-write helper reference
- Create: `src/templates/postinstall-guard.sh` (installed to `.fence/hooks/postinstall-guard.sh` by `tools/install.ts`; calls `postinstallGuard()`)

### Task 4 — WebContainer probe + file-only fallback already in `tools/install.ts` (GEM-02) — verify-only

No new file; `tools/install.ts` (360 lines) already probes `process.versions.webcontainer` + `runtime` in `app-profile.json`. Task = smoke-test.

---

## M2 — Framework Primitives (needs M1 `.fence/` + `context-budget.yml`)

### Task 5 — Remove TODO drift in `context-budget.yml` + validate wiring

**Objective:** Every budget bucket has an owner and a test; no stale TODO that implies missing code.

**Files:**
- Patch: `src/framework/context-budget.yml` — keep buckets/telemetry as spec; convert "TODO:" lines that are doc-only into "Spec:" comments (caps are spec, not drift).
- Verify: `tools/validate.ts` already reads it for AGENTS cap — keep.

### Task 6 — Adapter runtime profiles (`src/adapters/*.yml` → `types.ts` as authority)

**Objective:** 5 runtime profiles exist as data; `types.ts` stays the single source of truth (GEM-03 — adapters are code, not prompts).

**Files:**
- Create: `src/adapters/claude.yml`, `cursor.yml`, `opencode.yml`, `hermes.yml`, `antigravity.yml` — each: `window`, `skillsDir`, `hookSurface`, `modelHint` (frontier vs weak conditional surface per C-03)
- Patch: `src/adapters/types.ts` — add `loadAdapterProfile()` helper to read YML into `Adapter` (or keep inline and YML as reference; either is acceptable — decision: inline remains authority, YML is override).

### Task 7 — Verifier trust ladder — close Stub gaps (S-04, S-06a, GEM-11)

**Objective:** `src/framework/verifier.ts` is no longer a stub for the `compile` + `hasTests` path; the rest stays spec'd with typed TODOs.

**Files:**
- Patch: `src/framework/verifier.ts` (203 lines) — implement `hasTests(projectRoot)` (glob `**/*.test.*` + package.json scripts), `runTrustLadder` dispatch for `compile` tier (spawn `tsc --noEmit`, cap 4KB), write diagnosis artefact to `.fence/verdicts/`; keep `generated` + `judge-for-prose` as guarded TODOs with `// TODO(M2):` tag.

### Task 8 — Circuit-breaker + dial stubs — close or document (S-11, §6 #7)

**Objective:** `circuit-breaker.ts` + `dial.ts` have bounded TODOs with owners; no floating "TODO: implement".

**Files:**
- Patch: `src/framework/circuit-breaker.ts`, `src/framework/dial.ts` — convert broad TODOs to tagged `TODO(M2)` with scope; implement one concrete helper each (e.g., `circuit-breaker.ts::shouldTrip()` rule; `dial.ts::getEffectiveLevel(domain)`); leave event wiring for M3/M4.

### Task 9 — Queue + byte-capped pipeline stubs (if thin)

**Files:**
- Create if absent: `src/framework/queue.ts` — minimal queue contract (`.fence/queue.json` flat schema, `pushEntry`, `nextEntry`, rolling-window check per §5 invent).
- Create if absent: `src/framework/byte-capped-pipeline.ts` — `vibe-map` ≤1k PageRank helper + 4KB pipe note (references `context-budget.yml`).

---

## M3 — Skills + Guardrail Packets (needs M1/M2 primitives + `severity-policy.json`)

### Task 10 — Rule package scaffold (S-08/S-09 + SOURCES §C)

**Objective:** `src/rules/` exists with one real rule and one stub so `tools/validate.ts` can assert presence.

**Files:**
- Create: `src/rules/bill-01.ts` (BILL-01 billable-loop guard — GEM-05, see `04-guardrails.md`)
- Create: `src/rules/prv-09.ts` (fixture hygiene — GEM-06)
- Create: `src/rules/index.ts` — re-export registry

### Task 11 — Verify-remote + billing-guard (GEM-04, GEM-05)

**Files:**
- Create: `src/framework/verify-remote.ts` — `pg_policies` introspection on `promote public`; `unknown` on offline (never `pass`), per S-11/S-14.
- Create: `src/framework/billing-guard.ts` — `withBudgetCap({maxCalls,maxCostUsd})` wrapper reading `.fence/templates/` scaffold.

### Task 12 — Anonymizer (GEM-06, PRV-09)

**File:** `tools/anonymize.ts` — synthetic PII replacement preserving referential integrity; `Unknown→Warn` if no check.

### Task 13 — Skill lint tightening (S-02/S-08, C-02)

**Files:**
- Patch: `tools/validate.ts` — add skill-text lint: reject ungrounded "review your own work" without tool signal (§6 #7); enforce L1 ≤1024ch + L2 ≤5K words per SKILL spec (currently 250-line proxy — keep but note).

---

## M4 — Adapters + Installer + Bench + Demo (needs M1–M3 ship-ready)

### Task 14 — Installer idempotence harness (already in `tools/install.ts`)

**Objective:** Verify `npx vibe-fence init` ×3 has zero churn; `bin` entry in `package.json` ships it.

**Files:**
- Patch: `package.json` — ensure `bin: { "vibe-fence": "tools/install.ts" }` (or `dist/cli.js` if compiled)
- Create: `scripts/smoke-init.sh` — idempotence probe (init ×3, git status check)

### Task 15 — `fence look` + PFLOP trace (S-14, CLM §DOC C)

**Files:**
- Create: `src/framework/fence-look.ts` — Playwright→Spark verification stub + `events.ndjson` append + PFLOP counter interface (35–60% compute delta cue for S-14 split-screen)
- Create: `src/templates/events.ndjson` template / `tools/log-event.ts` helper if needed

### Task 16 — Wire SOURCES across project docs (already done — verify-only)

`docs/research/SOURCES.md` (523 lines, 186 entries) is already the dedicated bibliography; `FINAL-v4` provenance points at 186; `INDEX.md` + `PLAN.md` + `README.md` + `LOG.md` co-reference it. Task = verify `grep SOURCES.md docs/**/*` hits the 4 pointers + `docs/research/SOURCES.md` exists.

### Task 17 — Adversarial bench stub (P2 — deferrable but record)

**Files:**
- Create: `tests/adversarial/README.md` — 8-task outline (poisoned AGENTS.md, README payload, malicious skill, user-asks-bypass per §4 M4) with `## Repro` stubs; NOT full bench yet.

### Task 18 — SAM + Visceral Delta already landed — verify-only

`src/framework/sam.ts` + `sam-guard.test.ts` + `docs/research/synthesis/DEMO-SCRIPT.md` already on disk. Task = `bun run validate` green.

---

## Verification per task

Every task ends with `bunx tsc --noEmit` + `bun run validate` + `bun run build` (dist parity). Full-task verification: `npx vibe-fence init` dry-run in `/tmp/fence-smoke-*` + 5×4 rubric in `docs/research/synthesis/FINAL-v4.md` §7.

## Merge gate

Stop at branch tip after `validate` + `build` green and smoke-init in scratch repo. **Do not push/merge** until user runs manual `npx vibe-fence init` in a real repo and approves Visceral Delta outline vs FINAL-v4 §7.
