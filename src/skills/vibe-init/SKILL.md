---
name: vibe-init
description: Use when installing vibe-fence into a new or existing repo, running npx vibe-fence init, onboarding a vibe-coder, or bootstrapping any fenced project.
---

# vibe-init — One-Command Harness Install

> Sources: FINAL-v2 §4 M4 (S-02, 05 A-09/Q-01) · 01 A-03/A-05 · 05 A-09 · 05 A-11 · INDEPENDENT-GEMS GEM-01/GEM-02/GEM-09 · S-06 · S-15.

## Install

`npx vibe-fence init` is the only entry point (S-02 — progressive disclosure; S-15 — Standard-mode privacy default). It:

- **Detects runtime** — probe `process.versions.webcontainer`, `/.webcontainer` sentinel, `git` availability, hook installability before touching disk (GEM-02 S-02 P1). On WebContainer hit: print `WebContainer detected — hooks unavailable. Using file-only mode` and record `runtime: "webcontainer" | "native"` in `.fence/app-profile.json` (FINAL-v2 M1).
- **Is idempotent** — ×3 invocations → zero file churn, identical `git status` (FINAL-v2 §7 rubric #1). Merges, never clobbers `AGENTS.md` or `docs/fence/INDEX.md`; appends fence block only.
- **Inspects the repo** — checks existing `.gitignore`, tracked env files, and hook configuration before writing. Rule checks (SEC-01/SEC-03 and friends) run via `vibe-fence check`, not at init scan time.
- **Sets up `.gitignore` safely** — idempotently ensures `.env`, `.env.local`, `.env.*.local`, `.fence/.integrity.json`, `.fence/events.ndjson` while preserving user lines and leaving `.env.example` trackable. Ignore rules do not untrack files or detect every secret: if a sensitive env file is already tracked, init warns by filename only (never contents) with `git rm --cached <file>` as the next step, and SEC-03 blocks it at check/commit time (04 A-01).
- **Installs Git hooks where Git will run them** — resolves `git rev-parse --git-path hooks` (handles linked worktrees and project-local `core.hooksPath`), chains existing hooks via `.pre-fence`, and never writes to an outside-project hooks directory or changes global Git config; an outside redirect is reported degraded with the exact project-local repair (`.git/hooks` in a normal checkout; the shared common hooks directory by absolute path in a linked worktree, with the shared-repo effect disclosed) and hooks stay inactive until then.
- **Deploys `.fence/`** — single-owner state tree (FINAL-v2 M1 S-01): `app-profile.json` (`local`/`shared`/`public`), `.integrity.json` (SHA-256 attestation, GEM-01 P0), `hooks/postinstall-guard.sh`, `config.json` (`model_mode: standard` by default — S-15/GEM-09), `state/dial.json` seed.

### What is written (and what is not)

| Written | Never overwritten |
|---------|-------------------|
| `.fence/**` (created if missing; merged if present) | User `src/**`, `package.json` scripts, existing `AGENTS.md` body |
| `AGENTS.md` fence block (≤400-token router appended) | Any file outside project `realpath` |
| `.gitignore` additions (append-only with `# vibe-fence` marker) | Contributor-mode flag — installer MUST NOT add `--contributor-mode` (GEM-09 P0) |
| `.fence/hooks/postinstall-guard.sh` + `prepare` hook | — |

Integrity: on init compute SHA-256 of every fence-owned file → `.fence/.integrity.json`; set `FENCE_SYNC_TOKEN` only via `tools/generate.ts` (GEM-01). Containment: all writes confined to `realpath(resolved_target)` inside project root; hard-deny on credential stores (FINAL-v2 S-06/S-10).

## Usage

```bash
npx vibe-fence init                          # standard (default)
npx vibe-fence init --full                   # native clone after WebContainer file-only mode
npx vibe-fence init --contributor-mode       # explicit opt-in — prints training-use disclosure (GEM-09)
npx vibe-fence init --dry-run                # preview without writing
npx vibe-fence init --profile muse           # preset: Claude adapter (demo-hero path)
```

Paved 3-step path printed after install (05 A-11/S-02): `keep building → you'll see a card → approve and the agent handles it`. No tour step — the 3-second receipt below is the whole install UX (05 D-04 artifact-first).

**3-second receipt** (FINAL-v2 §7 Visceral Delta; 05 A-06):

```
🛡️ vibe-fence active. Checkpoints enabled. Secrets shielded.
  AGENTS.md  router (≤400 tokens)
  .fence/    state + rules + integrity
  .gitignore locked (.env, .fence/.integrity.json)
  mode       standard (no training on your code)
  runtime    native | webcontainer (file-only)
─────────────────────────────────────────────
 keep building → you'll see a card → approve & the agent fixes it
```

On failure, receipt names the file and the fix (`AGENTS.md already fenced — skipped`).

## Verification

| Check | How | Gating |
|-------|-----|--------|
| Idempotence | `npx vibe-fence init` ×3 → `git status` identical | FINAL-v2 §7 #1 |
| Token budget | `tools/validate.ts` asserts `AGENTS.md` ≤400 tokens; no skill >250 lines | FINAL-v2 §7 #4 |
| Integrity | install seeds SHA-256 attestation in `.fence/.integrity.json` (`src/framework/integrity.ts`); `FENCE_SYNC_TOKEN` gate | GEM-01 |
| Gitignore lock | `.env` not in `git ls-files`; `.fence/.integrity.json` not tracked | 04 A-01 |
| Receipt | One-line-per-file meaning + timing (`<3s`) printed | M4 paved path |
| WebContainer fallback | CI matrix job inside WebContainer — file-only mode asserted | GEM-02 |

`vibe-fence check` is the post-init validator — run it after install to confirm the tree is clean.

## Anti-patterns

- **Do not auto-generate a large narrative `AGENTS.md`** — −3%/+23% cost; ship ≤400-token router (FINAL-v2 §6 #1/S-01). Enforce with `.fence/templates/CLAUDE-EXAMPLE-ARCHITECTURE.md` reference, not inline prose (S-01/C-02).
- **Do not ship a backend gateway** — client-side hooks + settings blocks are the portable path (FINAL-v2 §6 #2).
- **Do not stack scaffold greedily** — every addition A/B'd in isolation *and* combination; p^n joint reliability decays (S-07).
- **Do not treat preview URLs as access control** — distinct cred planes + value-equality check (S-10).
- **Do not suggest `--contributor-mode` in README/quickstart/demo** — Standard pricing is the default; contributor requires explicit disclosure (S-15/GEM-09 P0).
- **Do not overwrite user files without confirmation** — `init` is append/merge-only; destructive overwrite = block (05 A-11).
