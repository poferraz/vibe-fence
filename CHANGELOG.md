# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Compare views: https://github.com/poferraz/vibe-fence/compare/

## [Unreleased]

### Added
- Track for `v0.2.0` — publishable `package.json`, governance files, CI, README resume.

### Fixed
- `release.yml` now runs `bun test` + `bun run eval` before `npm publish` (L5) — a tagged release can no longer ship with red tests or eval regressions.
- `dist/` and the npm tarball no longer ship `*.test.ts` or `.gitkeep` (C9); test counts are unique-only going forward (was 237 run / 127 unique). Guarded by `tools/generate.test.ts`.
- `vibe-fence check` skips 0-byte files instead of reporting per-rule unknowns (L7) — repo self-scan drops from 45 unknowns to 0.

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
