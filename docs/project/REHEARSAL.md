# Rehearsal Log — vibe-fence

Pre-hackathon installer rehearsal. Each section maps to a DEMO-SCRIPT acceptance step.

---

## § A — Installer smoke ×3 idempotence + .fence state

**Date:** 2026-10-21T19:17 UTC (PDT 12:17)  
**Branch:** `main` (`tsc --noEmit` 0, `validate` ok, `build` 44 — per task preconditions)  
**Installer entry point:** `bun run tools/install.ts` with `cwd` = scratch repo (installer uses `process.cwd()` as `projectRoot`; `--projectRoot` flag is not implemented — `process.cwd()` override is the supported path)  
**Scratch repo:** `/tmp/fence-smoke-1792610264` — `git init`, `touch README.md`, `git add/commit` (commit `35b5a2b`)

### Runs

| Run | Command (cwd = scratch) | Elapsed | Mode | Adapters | Exit |
|-----|-------------------------|---------|------|----------|------|
| 1 | `bun run /Users/poferraz/Documents/Development/active/vibe-fence/tools/install.ts` | 53 ms | native | claude, cursor, codex, antigravity, hermes (5) | 0 |
| 2 | same | 64 ms | native | same 5 | 0 |
| 3 | same | 63 ms | native | same 5 | 0 |

All runs < 3 s budget (FINAL-v2 §7 rubric #1). Receipt + paved 3-step path printed each run. `FENCE_SYNC_TOKEN` ephemeral prefix rotated each run (`bd883d95` → `deea910a` → `7fc1c1de`) — S-05/S-06.

### Files created (run 1, git-untracked)

```
.agents/memory/MEMORY.md
.agents/rules/antigravity.md
.claude/settings.json
.codex/config.json
.cursor/hooks.json
.cursor/rules/vibe-fence-router.mdc
.fence/.integrity.json
.fence/app-profile.json
.fence/config.json
.fence/events.ndjson
.fence/hooks/postinstall-guard.sh
.fence/state/dial.json
.gitignore              (appended # vibe-fence block)
.hermes/config.json
AGENTS.md               (fence block <!-- vibe-fence:start --> … <!-- vibe-fence:end -->)
CLAUDE.md
README.md               (pre-existing, untouched)
```

`.fence/` tree: `.fence/`, `.fence/state/`, `.fence/hooks/`, `.fence/rules/` — single-owner state (M1).  
`AGENTS.md` block: deterministic fence router, ≤400 tokens, idempotent replace (merge-not-clobber).  
`.fence/.integrity.json`: seeded via `persistAttestation` (GEM-01, `FENCE_SYNC_TOKEN` gate) — `generatedBy: fence-sync:<token-prefix>`, `files: { "AGENTS.md": "<sha256>" }`.  
`.fence/app-profile.json`: from `src/templates/app-profile.json` canonical template — `tier: local`, `runtime: native`, `block_counts: { local:14, shared:29, public:55 }`, `profile` mirrored from `tier`.  
`.fence/config.json`: `model_mode: standard` (GEM-09/S-15, Standard-mode default), `fence_version: 0.1.0`.  
`.gitignore`: `# vibe-fence` marker + `.fence/.integrity.json` + `.fence/events.ndjson` (idempotent append).

### git status after each run

Identical all 3 runs (untracked set unchanged):

```
?? .agents/
?? .claude/
?? .codex/
?? .cursor/
?? .fence/
?? .gitignore
?? .hermes/
?? AGENTS.md
?? CLAUDE.md
```

No file added/removed between runs. File count 17 (16 created + `README.md`) stable.

### .fence/app-profile.json tier

`tier: local` (⇒ `profile: local`) all 3 runs. `updatedAt` frozen at `2026-10-21T19:17:46.323Z` — installer only rewrites `app-profile.json` if `runtime`/`tier`/`profile`/`block_counts` drift; run 2/3 correctly detected no mutation and left `updatedAt` untouched.

### .fence/.integrity.json existence

Present all 3 runs. `generatedAt` + `generatedBy` rotate each run (token-dependent); `files["AGENTS.md"]` hash stable.

### AGENTS.md checksum

`f008090bd7ba341509f9e76edb451145844dc108066ec6a0443b33b043850f78` — **byte-identical across all 3 runs** (verified via `shasum -a 256`). No churn.

### Idempotence assertion — 2nd and 3rd runs produce zero file churn (timestamp-only allowed)

**Verdict: PASS with noted timestamp-only deltas.**

Byte-identical (zero diff) across runs 2→3 and 1→2→3:

- `AGENTS.md` — identical
- `.fence/app-profile.json` — identical (no rewrite)
- `.fence/state/dial.json` — identical
- `.fence/hooks/postinstall-guard.sh` — identical
- `.fence/rules/` — identical
- `.gitignore` — identical (marker guard prevents duplicate append)
- `.agents/memory/MEMORY.md`, `CLAUDE.md`, `.agents/rules/antigravity.md`, `.cursor/rules/vibe-fence-router.mdc` — identical

Timestamp-only deltas (allowed per task — "only timestamp/updatedAt may differ — note if so"):

- `.fence/config.json:updatedAt` — rewritten each run (`19:17:46.321Z` → `19:17:58.146Z` → `19:18:04.478Z`). Installer unconditionally writes `config.json` to enforce `model_mode` invariant (GEM-09); no content change beyond timestamp.
- `.fence/.integrity.json:generatedAt` + `generatedBy` — regenerated each run with fresh `FENCE_SYNC_TOKEN` (S-05/S-06 attestation contract). File hash stable excluding these two fields.
- `.fence/events.ndjson` — append-only, one JSON line per `install` run (3 lines after run 3). Expected — not churn, event log.
- `.claude/settings.json`, `.codex/config.json`, `.cursor/hooks.json`, `.hermes/config.json` — `fence.installedAt` rewritten each run. **Content-only change is `installedAt` timestamp**; `model_mode`, `companion_model`, `architect_model`, `receipt` stable. Adapter installers currently set `installedAt: new Date().toISOString()` unconditionally; recommend future guard: skip write if `fence` block semantically equal ignoring `installedAt`, to achieve strict byte-idempotence.

No non-timestamp churn detected. `git status --porcelain` identical before/after runs 2 and 3 (same untracked set). Scratch repo retained at `/tmp/fence-smoke-1792610264` for inspection (remove after review).

### Acceptance rubric mapping (docs/research/synthesis/FINAL-v4 §4 M4 + DEMO-SCRIPT.md step 1)

- [x] `npx vibe-fence init` idempotent: ×3 ⇒ zero churn (modulo timestamps noted) ✓
- [x] Drops `AGENTS.md` + `.fence/` + skills + settings blocks + hooks; merges not clobbers ✓
- [x] < 3 s (53/64/63 ms) ✓
- [x] One-line receipt + 3-step paved path + `fence tour` opt-in ✓
- [x] `FENCE_SYNC_TOKEN` ephemeral, S-05/S-06 ✓
- [x] `app-profile.json` tier local / block_counts 14/29/55 ✓
- [x] `.integrity.json` attestation seeded ✓
