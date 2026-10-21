# Appendix: ECC Learnings — Top 5 Steal-ables

> Pinned to [`FINAL-v4.md`](../synthesis/FINAL-v4.md) as appendix (updated 2026-10-21; prior `FINAL-v2.md` → `FINAL-v3.md` retained). Source: `affaan-m/ECC` 2.2.3 snapshot at `/tmp/ecc-analyze` (2026-10-20).

---

| # | What to steal | Why it matters | Where it lands | Precedent |
|---|---------------|----------------|----------------|-----------|
| **1** | **GateGuard fact‑forcing question taxonomy** — target‑class × change‑profile questions, not binary `block` | Makes every guardrail teachable; forced investigation is the safety intervention, not a warning | `src/config/severity-policy.json` routing + `src/skills/vibe-guard/SKILL.md` guard prompts | `gateguard-fact-force.js` + `design-notes.md#questions-from-the-change-profile` |
| **2** | **Per‑gate ablation harness** — `off / gate / minus‑target / placebo` 4‑arm eval with `expect/mustDeny/redundant` corpus | Only proof the fence earns its cost; answers C‑01 FP budget | `tests/fixtures/gateguard-like/{scenarios,run.ts}` + CI | `docker/gateguard-effectiveness/` + `evaluation.md` |
| **3** | **`.fence/` state‑tree hardening gate** — 6‑point real‑entry‑point verification (instruction‑as‑data, auth+confirmation for irreversible, traversal/symlink containment) | Closes instruction‑file + supply‑chain bypasses on every `.fence/` write | `src/framework/integrity.ts` + `verify-remote.ts` + `meta-client.ts` | `agent-security-hardening/SKILL.md` verification gate |
| **4** | **`hooks_enabled` / `hook_profile` explicit‑choice installer** — `minimal`/`standard`/`strict`, no silent default; hooks declare their profiles | Removes the #1 post‑demo question (“will this slow me down?”) | `tools/install.ts` + `src/adapters/*.json` or `.claude-plugin/plugin.json` | `.claude-plugin/plugin.json:userConfig` + `run-with-flags.js` |
| **5** | **`agentic‑engineering` loop discipline** — eval‑first + 15‑min decompositions + model routing + invariant‑focused review + cost ledger | Runbook that makes vibe‑fence trustworthy as infra, not just a product pitch | `docs/fence/INDEX.md` §Operations + `AGENTS.md` template + `docs/fence/OPERATIONS.md` | `agentic-engineering/SKILL.md` |

Full analysis in `../synthesis/ECC-SIDEBAR.md` §5 + `../synthesis/ECC-SECURITY-DEEPDIVE.md` §5. Keep knowledge — do not delete originals.
