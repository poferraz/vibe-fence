# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Compare views: https://github.com/poferraz/vibe-fence/compare/

## [Unreleased]

### Added
- Track for `v0.2.0` — publishable `package.json`, governance files, CI, README resume.
- `vibe-fence init --profile muse` preset (Claude adapter — demo-hero path; explicit `--adapters` overrides it).
- `vibe-fence check --staged` (scan staged blobs — pre-commit gate) and `vibe-fence check --push [<range>]` (scan outgoing commits — pre-push gate; default range from pre-push stdin, else `@{u}..HEAD`).

### Fixed
- `release.yml` now runs `bun test` + `bun run eval` before `npm publish` (L5) — a tagged release can no longer ship with red tests or eval regressions.
- `dist/` and the npm tarball no longer ship `*.test.ts` or `.gitkeep` (C9); test counts are unique-only going forward (was 237 run / 127 unique). Guarded by `tools/generate.test.ts`.
- `vibe-fence check` skips 0-byte files instead of reporting per-rule unknowns (L7) — repo self-scan drops from 45 unknowns to 0.
- Truth pass (C4/C8/C13/L9/L11/L13): README corrected (`muse-wonder-1.0`, `web`/Cordis/`encrypted` dropped or hedged, honest rule counts, npm 404 hedged, REHEARSAL refs 6/8 + 2 open); all 4 `SKILL.md` Usage blocks teach real subcommands only (enforced by `src/skills/skills.test.ts`); STATUS dates relabeled to Oct 26; REHEARSAL verdicts corrected to 6/8 + 2 open (T2/T8); 13 MB `.docx` blobs removed (`.md` retained); `severity-policy.json` labeled aspirational.
- Removed the `npx vibe-fence tour` receipt from install output (`tour` stays an unadvertised stub, exit 2).
- Corpus v2 (C5/L8): deduped the 4 verbatim unit-test overlaps with behavior-preserving payloads; fixed the "independently authored" note; added TOKEN-shaped positives + benign TOKEN must-pass cases with the `TOKEN` keyword extension to SEC-01; hardened `compareBaseline` with coverage floors (deleted positives/negatives fail `--check`) + unknown ceiling, with unknowns surfaced in the `--check` line. Baseline regenerated (26 TP / 23 TN, 1 unknown pinned, 0 misses).
- Committed the adversarial sweep as `tests/adversarial/sweep.test.ts` with fresh S-labels (C12 — was an unreproducible `/tmp` script with drifted T-numbers).
- Closed the staged-blob smuggle (L1): managed hooks now run the index-aware scan plus the worktree scan; the synthesis repro (staged leak + clean worktree) is a `proof-beats` regression that must block.
- `vibe-fence checkpoint` scans the staged snapshot and warns loudly (stderr + `blockingFindings` in `.fence/events.ndjson`) when an undo point holds blocks — checkpoints still always land (D7/L15).
- Gate audits local script bodies through interpreter invocations (C10): `bash ./evil.sh` (plus `sh`/`zsh`/`source`/`.`/flags) now blocks like `./evil.sh`; findings attribute the resolved script. `apply_patch`-family tool names (`apply_patch`, `edit_file`, `MultiEdit`, …) route into the write lens via token match (L3); substring lookalikes (`dispatch`, `credit`) still pass per C-01.

## [0.1.0] — 2026-10-21

First public scaffold — M1–M4 land on `main`.

### Added
- `src/` sole-authority layout: `adapters/types.ts`, `config/severity-policy.json`, `framework/{integrity,context-budget.yml,circuit-breaker,verifier,dial,git}.ts`, `skills/{vibe-init,vibe-guard,vibe-plan,vibe-teach}/SKILL.md`
- `tools/{generate,validate,install}.ts` — deterministic `src→dist` build, `AGENTS.md` ≤400-token gate
- `src/rules/{bill-01,prv-09,net-01,sec-02}` + `src/framework/{verify-remote,billing-guard}.ts` — S-09 10 zero-FP hard-blocks
- `src/templates/app-profile.json` (local 14 / shared 29 / public 55 blocks)
- Adversary bench 8/8 content checks verified (`docs/project/REHEARSAL.md` §A+§B)
- `DESIGN.md` + `PRODUCT.md` + `tailwind.theme.json` / `tokens.json` — Meta glass-on-charcoal harness language

### Research
- Phase 0 locked: `docs/research/synthesis/FINAL-v4.md` (221 lines, 15 settled S-01…S-15+ S-06a/S-11a, 10 contested C-01…C-10+3) + `SOURCES.md` (186 entries) + deep-read vault (14 docs, 4 clusters)

[Unreleased]: https://github.com/poferraz/vibe-fence/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/poferraz/vibe-fence/releases/tag/v0.1.0
