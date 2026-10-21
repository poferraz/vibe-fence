# RECONCILE.md — M1–M4 Scaffold Reconciliation

_Date: 2026-10-20 · Reconciler pass · Source: `docs/research/synthesis/FINAL-v4 (Deep-Read Vault Expansion, 221 lines, 2026-10-21).md` §4 M1–M4 + §7 + GEMS→files map (l.122)_

## Scope

Verify every file in FINAL-v4 (Deep-Read Vault Expansion, 221 lines, 2026-10-21) §4 M1–M4 GEMS→files map exists on disk; create only missing `docs/project/` gaps + `DEMO-SCRIPT.md` (GEM-10); run `tsc --noEmit` + `tools/validate.ts`; verify `.gitignore`; update `STATUS.md`. Do not overwrite skill/framework/adapters owned by parallel agents.

## 1. Gaps — GEMS→files map (FINAL-v4 (Deep-Read Vault Expansion, 221 lines, 2026-10-21) l.122) vs disk

| # | GEMS→files entry | Expected path(s) | On disk? | Owner | Note |
|---|-----------------|-----------------|----------|-------|------|
| 1 | integrity (P0, M1) | `src/framework/integrity.ts` | ✅ | M1 agent | SHA-256 + FENCE_SYNC_TOKEN + postinstall guard |
| 2 | WebContainer (P1, M1) | `tools/install.ts` | ✅ **landed post-snapshot — M4** | M4 | Probe `process.versions.webcontainer` + `runtime` in app-profile — verified (M4 install.ts 15K) |
| 3 | eviction (P2, M2) | `.fence/state/*.json` + `context-budget.yml` | ⚠️ partial | M2 parallel | `context-budget.yml` ✅, `.fence/state/*.json` ⏳ (owned by `npx vibe-fence init`, not src — will be created at install time) |
| 4 | portability (P1, M2) | `src/adapters/*.yml` | ❌ **missing (`.ts` ok)** | M2/M4 parallel | `types.ts` + 6 `.ts` adapters ✅; 5 `.yml` profiles pending (GEM-03 — consider merging into `types.ts` adapter config vs separate YAML) |
| 5 | remote RLS (P1, M3) | `src/framework/verify-remote.ts` | ❌ **missing** | M3 parallel | `pg_policies` introspection; `unknown` on offline |
| 6 | BILL-01 (P1, M3) | `src/rules/bill-01.ts` | ❌ **missing** | M3 parallel | No `src/rules/` dir on disk |
| 7 | PRV-09 (P1, M3) | `src/rules/prv-09.ts` + `tools/anonymize.ts` | ❌ **missing** | M3 parallel | Fixture anonymizer both files absent |
| 8 | SAM (P1, M4) | `src/framework/sam.ts` | ✅ **landed post-snapshot — M4** | M4 | Contract + `SAM_SINGLE_CONCEPT_VIOLATION` — verified (sam.ts 7K + sam-guard 5/5 pass) |
| 9 | Wonder routing (P1, M4) + Standard-mode default (P0, M4) | `src/framework/meta-client.ts` | ✅ **landed post-snapshot — M4** | M4 | `POST /v1/responses` + dual-tier + pricing caps + Standard default — verified (meta-client.ts 12K) |
| 10 | Visceral Delta (P0, M4) | `docs/PLAN.md` §Hackathon + `docs/research/synthesis/DEMO-SCRIPT.md` | ✅ (this pass) | Reconciler | `PLAN.md` had Hackathon §3 already; `DEMO-SCRIPT.md` **created this pass** |
| 11 | verifier (P1, M2/M3) | `src/framework/verifier.ts` | ✅ | M2 parallel | Ephemeral `// @fence-ephemeral` + trust ladder |

**Additional scaffold gaps (outside GEMS map but in M1–M4 checklists):**

| Path | Expected | On disk? | Note |
|------|----------|----------|------|
| `AGENTS.md` (≤400 tokens) | M1/M2 router | ❌ **missing** | Must be generated via `tools/generate.ts` + asserted in `validate.ts` |
| `.fence/app-profile.json` | S-09 tiers 14/29/55 | ❌ | Created by `npx vibe-fence init` (M4) |
| `.fence/.integrity.json` + `.fence/hooks/postinstall-guard.sh` | GEM-01 P0 | ❌ | Attestation store + guard |
| `src/framework/billing-guard.ts` | GEM-05 P2 | ❌ | `withBudgetCap({maxCalls,maxCostUsd})` |
| `src/schemas/` | JSON schemas | ⚠️ empty dir | Expected schema files for rules/config |
| `src/templates/` | scaffolds | ⚠️ empty dir | Expected per GEM-05/P0 |
| `tests/` | fixtures/bench | ❌ | Adversarial bench (M4) |

_Existing scaffold verified present: `src/adapters/types.ts`, `src/config/severity-policy.json`, `src/framework/{integrity,context-budget.yml,circuit-breaker,verifier,dial,git}.ts`, `src/skills/{vibe-init,vibe-guard,vibe-plan,vibe-teach}/SKILL.md`, `tools/{generate,validate}.ts`, `docs/project/{INDEX,PRD}.md`._

## 2. Fixes applied this pass (non-destructive)

| Fix | File | Action |
|-----|------|--------|
| Docs gap: AGENT-CHARTER | `docs/project/AGENT-CHARTER.md` | **Created** from `FINAL-v4 (Deep-Read Vault Expansion, 221 lines, 2026-10-21).md` §6 + S-05/S-06/S-10/S-11 + project template (was absent; no overwrite) |
| Docs gap: BRIEF | `docs/project/BRIEF.md` | **Created** from `FINAL-v4 (Deep-Read Vault Expansion, 221 lines, 2026-10-21).md` + `PLAN.md` + project template (was absent; no overwrite) |
| GEM-10 P0: Visceral Delta | `docs/research/synthesis/DEMO-SCRIPT.md` | **Created** — standalone 0:00→3:00 script + production checklist + 5-step rubric + 5×4 eval table extracted from FINAL-v4 (Deep-Read Vault Expansion, 221 lines, 2026-10-21) §7 + `INDEPENDENT-GEMS.md` GEM-10 (GEMS→files map required deliverable) |
| Build parity | `dist/` | Generated via `bun run tools/generate.ts` → 18 files + `PROVENANCE.md` (needed for `validate.ts`) |

_Not touched (parallel-agent owned): `src/skills/*`, `src/framework/*`, `src/adapters/*`, `src/config/*`, `tools/*.ts` — reconciler only created missing docs + ran checks._

## 3. Verification results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ pass (exit 0, tsc 7.0.2) |
| `bun run tools/generate.ts` | ✅ `dist: 18 files from src/` |
| `bun run tools/validate.ts` | ✅ `validate: ok` (after generate); note: `node` path is `bun`-only (`import.meta.dir`) — run via `bun` |
| `.gitignore` covers `dist/` | ✅ `dist/` |
| `.gitignore` covers `.fence/` | ✅ `.fence/` |
| `.gitignore` covers `bun.lock` | ✅ `bun.lock` + `bun.lockb` |
| `git status` | `main` no commits yet; all files untracked (expected pre-init) |

## 4. Remaining work (for parallel agents / next reconciler pass)

- Land `tools/install.ts` with WebContainer probe (GEM-02).
- Land `src/adapters/*.yml` ×5 (GEM-03).
- Land `.fence/` state tree (`app-profile.json`, `.integrity.json`, `state/dial.json`) and `AGENTS.md` router.
- Land `src/framework/{verify-remote,billing-guard,sam,meta-client}.ts` + `src/rules/*` + `tools/anonymize.ts` (GEMS P0/P1).
- Re-run this reconciler to close gaps; `tsc --noEmit` must stay green after.

---
_Reconciler: non-destructive pass — only `docs/project/` gaps + `DEMO-SCRIPT.md` created; all other missing files reported, not fabricated._
