# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Compare views: https://github.com/poferraz/vibe-fence/compare/

## [0.5.0] — 2026-11-11

### Changed

- One `init --host=<tool>` sets up the selected integration, local runtime, Git checks and a local diagnostic. Auto-detection uses the current project only and asks for one tool when ambiguous.
- Commit hooks inspect staged blobs only; push hooks inspect outgoing history only. Unrelated unstaged or untracked files no longer block those operations; explicit `check` still reviews the whole folder.
- Upgrades refresh unchanged managed guidance while preserving customized files. Incomplete setup reports failure and retains a removal record.

### Removed

- Meta model requests, model routing, provider preferences and keys, remote database probes, demo profiles, and paid evaluation connections. Local finding explanations and offline evaluation remain available.
- The required separate diagnostic step and four-editor fallback. Existing coding-tool trust or restart requirements still apply.

## [0.3.0] — 2026-11-03

### Added
- Node-based Claude Code, Cursor and Codex gate hooks, including a project-local launcher and nested-directory support without `jq`.
- `doctor`, `verify`, `dial`, `reset` and `uninstall` commands; local circuit-breaker and network-command budget reporting; optional local learning-card telemetry.
- `.fenceignore` patterns and explicit incomplete-scan exit codes. Checkpoints inspect for secrets before staging and again before committing.
- Rule checks for direct recursive timer polling and dangerous package-script bodies, plus regression and portable hook smoke tests.
- Cross-platform CI jobs, npm trusted-publishing release workflow, contributor templates, and source-tree visual documentation.
- Eval bench suites A–D + loop driver (`tools/loops/`): hostile (66 shapes) / benign (110, 0 FP) / scenario replay / offline explain rubric, with caps, dry-run, and provider profiles (fixture default; Baseten/Modal/Fireworks live paths refuse uncapped spend).
- Live-eval program Tasks 1–4a: per-surface attribution in `scoreVariant`, offline scenario runner (20 snapshots, 10 oracles), spend ledger + Baseten proposer + Modal sandbox backend, live episode loop + pilot runner.
- Codex stack: pre-tool hook/gate for Codex, `vibe-fence status` (+ `--host=codex|claude`), clean Spark explanations, git protection hardening (pre-push input, negation, worktree repair, containment), advisory `vibe-continuity` skill.
- Bounded push-history scan for `check --push` (new-ref full history, 512 KiB / 5,000-commit / 5,000-file caps, submodule fail-closed) with finding redaction (rule + path + commit only, incl. `--explain` prompts) and batched Git spawns.
- Claim inventory (`docs/research/CLAIMS.md`) + citation corrections; public evidence pages (`docs/EVIDENCE.md`, `EVALUATION-LADDER.md`, `MAINTAINER.md`, `docs/project/PRODUCT-DIRECTION.md`).
- `tools/meta-probe.ts --architect` (approved Wonder probe path) with append-only probe history + regression tests; `tools/meta-image.ts` (capped `muse-image-1.0` generation for demo assets).

### Changed in the local candidate
- Project-local runtime snapshots and managed hooks are exercised by an offline package and Git fixture; host execution remains unverified.
- Worktree and staged scan limits or unreadable eligible inputs produce an incomplete result. A check exits 1 for blocking findings and 2 for an incomplete scan without blocking findings.
- Local check output omits raw rule evidence, and optional explanations send fixed rule categories and severity. Same-user integrity records detect drift but are not a tamper-resistant trust boundary.
- NET-01 detects tested sudo flag and absolute-shell variants; it is not a complete shell parser.

### Fixed
- REHEARSAL T8 closed → 7/8 + T2 open: template-owned postinstall guard `exec`s `vibe-fence check` (exits propagate) and postinstall-time `AGENTS.md` tamper trips the S-06 drift block. T2 (plain-ASCII contradiction lint) stays open by design decision.
- `tools/eval.ts` scorer union: review-round-3 vocabulary (targetHit/targetBlocked/targetWarnOnly/blocked/warnOnly) + Task-1 finding arrays (gateFindings/treeFindings) — both have live consumers.
- README/SUBMIT zero-FP claims qualified to their fixture scope (110-case benign bench + held-out corpus); `severity-policy.json` call-out labeled aspirational in README.

## [0.2.1] — 2026-11-03

### Added
- Project-local runtime snapshots and a `status` command for inspecting configured protection and its verification limits.

### Fixed
- Worktree, staged, and push scans fail closed when eligible inputs cannot be scanned completely.
- Public findings omit raw rule evidence, and integrity checks report drift even when the workflow marker is set.
- Installer receipts measure each invocation, and configuration records the installed package version while preserving user settings.

## [0.2.0] — 2026-10-27

### Added
- Track for `v0.2.0` — publishable `package.json`, governance files, CI, README resume.
- `vibe-fence init --profile muse` preset (Claude adapter — demo-hero path; explicit `--adapters` overrides it).
- `vibe-fence check --staged` (scan staged blobs — pre-commit gate) and `vibe-fence check --push [<range>]` (scan outgoing commits — pre-push gate; default range from pre-push stdin, else `@{u}..HEAD`).
- Claude/Cursor PreToolUse gate hooks: managed `fence-gate.sh` scripts evaluate every tool call via `vibe-fence gate` (exit 2 blocks; missing binary/jq warns + allows — fail-open-with-warn mirroring the OpenCode plugin).
- `vibe-fence check --explain` / `gate --explain`: one budget-capped, goal-blind Muse Spark call per blocking report (task target + findings only; never file contents, tool args, or evidence); artefact + request ID land in `.fence/events.ndjson`. No key / API error → stderr note, exits unchanged.
- Redteam harness (`tools/eval.ts --redteam`; Phase 4a): every variant is evaluated through both real surfaces (`vibe-fence gate` write/shell/read legs + a `runCheck` tree scan of the probe materialized at a surface-appropriate path); `--mode benign` measures the false-block rate with a dedicated benign brief set; `--out FILE` writes a per-run NDJSON artefact (attempts + run record with provider token counts; `usd` always null — filled from invoices, never estimated); `--redteam`/`--max-tokens` validation is NaN-proof and usage errors exit 2 before any key/network touch.
- Demo fixture (`demo/`; Phase 4b): committed 2-file leak app (`leak-app/config.env` + `page.tsx`, clean at rest via the `your-token-here` placeholder) + `CUES.md` staging init → block → explain → checkpoint → undo, every beat verified with the packed CLI in scratch (init 40ms, SEC-01 block exit 1, no-key explain note, checkpoint warns + lands, undo soft-resets with work preserved, stash round-trip re-blocks). `config.env` (not `.env`) dodges global gitignores that would hide the leak from git.

### Fixed
- A historical `release.yml` ran tests and evals before publishing (L5). The current public candidate does not include that workflow; run and record the gates separately before any authorized release.
- `dist/` and the npm tarball no longer ship `*.test.ts` or `.gitkeep` (C9); test counts are unique-only going forward (was 237 run / 127 unique). Guarded by `tools/generate.test.ts`.
- `vibe-fence check` skips 0-byte files instead of reporting per-rule unknowns (L7) — repo self-scan drops from 45 unknowns to 0.
- Truth pass (C4/C8/C13/L9/L11/L13): README corrected (`muse-wonder-1.0`, `web`/Cordis/`encrypted` dropped or hedged, honest rule counts, npm 404 hedged, REHEARSAL refs 6/8 + 2 open); all 4 `SKILL.md` Usage blocks teach real subcommands only (enforced by `src/skills/skills.test.ts`); STATUS dates relabeled to Oct 26; REHEARSAL verdicts corrected to 6/8 + 2 open (T2/T8); 13 MB `.docx` blobs removed (`.md` retained); `severity-policy.json` labeled aspirational.
- Removed the `npx vibe-fence tour` receipt from install output (`tour` stays an unadvertised stub, exit 2).
- Corpus v2 (C5/L8): deduped the 4 verbatim unit-test overlaps with behavior-preserving payloads; fixed the "independently authored" note; added TOKEN-shaped positives + benign TOKEN must-pass cases with the `TOKEN` keyword extension to SEC-01; hardened `compareBaseline` with coverage floors (deleted positives/negatives fail `--check`) + unknown ceiling, with unknowns surfaced in the `--check` line. Baseline regenerated (26 TP / 23 TN, 1 unknown pinned, 0 misses).
- Committed the adversarial sweep as `tests/adversarial/sweep.test.ts` with fresh S-labels (C12 — was an unreproducible `/tmp` script with drifted T-numbers).
- Closed the staged-blob smuggle (L1): managed hooks now run the index-aware scan plus the worktree scan; the synthesis repro (staged leak + clean worktree) is a `proof-beats` regression that must block.
- `vibe-fence checkpoint` scans the staged snapshot and warns loudly (stderr + `blockingFindings` in `.fence/events.ndjson`) when an undo point holds blocks — checkpoints still always land (D7/L15).
- Gate audits local script bodies through interpreter invocations (C10): `bash ./evil.sh` (plus `sh`/`zsh`/`source`/`.`/flags) now blocks like `./evil.sh`; findings attribute the resolved script. `apply_patch`-family tool names (`apply_patch`, `edit_file`, `MultiEdit`, …) route into the write lens via token match (L3); substring lookalikes (`dispatch`, `credit`) still pass per C-01.
- Host configs keep vendor-supported keys only (L2/L14): the schema-invalid top-level `fence` block is gone (OpenCode `additionalProperties: false` verified live); fence metadata moved to `.fence/adapters/<id>.json`; legacy keys scrubbed, user keys never touched. Per-adapter conformance tests pin the allow-lists (R1).
- Re-attestation requires `FENCE_SYNC_TOKEN` (L4 — `persistAttestation` throws without it); `verifyAttestation` is wired into `vibe-fence check` (attested-file drift is an S-06 block; never-attested trees stay silent) (C7).
- The postinstall guard runs `vibe-fence check` (template-owned) instead of the `|| true` validate stub: exit codes propagate, missing binary warns loudly + exits 0 (never bricks install); legacy shims migrate, custom guards preserved (C7/T8).

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

[0.3.0]: https://github.com/poferraz/vibe-fence/compare/ce56fa1...HEAD
[0.2.1]: https://www.npmjs.com/package/vibe-fence/v/0.2.1
[0.2.0]: https://github.com/poferraz/vibe-fence/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/poferraz/vibe-fence/releases/tag/v0.1.0
