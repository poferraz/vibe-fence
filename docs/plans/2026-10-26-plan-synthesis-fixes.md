## Goal

Implement the synthesis fix list (`docs/project/audits/SYNTHESIS-2026-10-26.md`, fixes 1–10 plus overflow) so that: the repo stops making false claims, the reproduced enforcement holes are closed with regression tests, one real Meta beat is wired into the product path, and the remaining work is left in a state where the human-owned steps (npm publish, paid red-team runs, video recording) are the only things I cannot do.

Assumption (reversible): implement all 10 fixes in dependency order. Say the word and I will trim to a judge-facing minimum instead.

## Recommendations on the open questions (both resolved)

**Q(a) Redteam `--mode benign`: KEEP it.** It is ~30 lines (one brief set + flag + expect:pass scoring) and it produces the single most credible judge number in the eval story — a *measured* false-block rate to replace the current asserted one. Cutting it saves almost nothing and weakens fix #9's whole point. It ships inside Phase 4 as planned.

**Q(b) `verify` + Wonder: SPLIT — Spark first, Wonder fast-follow.** Rationale, grounded in the audits: `muse-wonder-1.0` has **zero** live verification (all 7 reports agree only Spark ever answered a call), and `runTrustLadder`'s user-repo semantics (what `taskId` means outside fixtures) is the least-specified surface in the plan. Wiring an unprobed model into the critical path risks a demo-day failure with no fallback. So: **Phase 3a** (this implementation) = Spark `--explain` only, which is sufficient for the video's Meta beat and the "why Meta matters" paragraph. **Phase 3b** (fast-follow, same branch or next) = one Wonder probe call to confirm the model ID exists → thin `vibe-fence verify` → Wonder-on-verify-fail. If the probe fails, 3b pauses without endangering anything already shipped.

## Success Criteria

- `bunx tsc --noEmit`, `bun run validate`, `bun run build`, `bun test`, `bun run eval` all green; `bun test` count is 127-unique-honest (no dist dupes) and docs say so.
- The smuggle repro from the synthesis (staged leak + cleaned worktree) is now **blocked**, committed as a regression test; `bash ./evil.sh` and `apply_patch` secret payloads are blocked at the gate.
- `vibe-fence check --explain` on a leaky tree performs one real Spark call and logs the request ID to `.fence/events.ndjson`; without `MUSE_API_KEY` it degrades to a stderr note and normal exit codes (never bricks).
- Every `fence …` / `vibe-fence …` command taught by installed `SKILL.md` files parses in `src/cli.ts` (enforced by a test); README claims match code; `npx` path either published (human) or honestly repointed.
- `release.yml` runs tests + eval before publish; tarball contains no `*.test.ts`.
- Git history shows one reviewable commit per phase-step on `feat/synthesis-fixes`, merged to `main` with CI green; CHANGELOG `[Unreleased]` + per-phase doc updates landed alongside the code, not after.

## Approach

Phase order follows dependencies: **truth first** → **enforcement** → **Meta (Spark)** → **evals + demo fixtures**, with **verify + Wonder as Phase 3b fast-follow**. Paid runs, publish, and video stay human-owned.

Key decisions (grounded in tree reads):

1. **Meta beat lives in the async CLI layer, not the engine.** `runCheck` (`src/check.ts:83`) and `evaluateToolCall` (`src/framework/gate.ts:98`) are synchronous; `companionCall` is async (`src/framework/meta-client.ts:247`). So: `--explain` flag on `check`/`gate` handled in `main()` (`src/cli.ts:51`, already async), wrapping `companionCall` in the existing `withBudgetCap` (`src/framework/billing-guard.ts:77`). Rejected: making the engine async (ripples through every rule caller, test, and the bundled CLI for no benefit).
2. **Wonder trigger = verifier failure, but only in 3b after a successful probe.** Per the recommendation above; 3a ships Spark-only and the video does not wait for Wonder.
3. **Index-aware hooks via new CLI modes, not hook-script logic.** `vibe-fence check --staged` (scan `git diff --cached` blobs through the existing `REGISTRY` loop — checkers already accept `{content, filePath, …}`, `src/rules/index.ts:44-45`) and `check --push <range>`; managed hook scripts call these plus the worktree scan. Rejected: shell-side blob plumbing (un-testable, duplicates the engine).
4. **FP doctrine preserved.** Unknown tools still pass (`gate.ts:8`, C-01); the `SECRET_KEYWORD_RE` extension (`sec-01.ts:44`) must keep the repo self-scan at 0 fails (now a merge gate with teeth — see Risk R2). Rejected: fail-closed unknowns.
5. **OpenCode/Claude/Cursor config: metadata moves under `.fence/`, host files keep only supported keys.** The top-level `fence` key is schema-invalid for OpenCode (verified live against `opencode.ai/config.json` during synthesis). Claude `PreToolUse` gets a real `vibe-fence gate` shell hook mirroring the OpenCode plugin's fail-open-with-warn semantics; Cursor likewise if its schema permits (verified at implementation time, else config-write + docs note).
6. **No new dependencies.** Everything reuses existing modules.

## Steps

**Phase 0 — Publish safety (S; unblocks honest release)**
- `release.yml`: insert `bun test` + `bun run eval` before `npm publish`.
- `tools/generate.ts`: exclude `*.test.ts` and `.gitkeep` in the `src/ → dist/` copy (`:51-57`); add a guard test asserting no test files under `dist/`; correct count claims (237→127 unique) in README/STATUS/adversarial README.
- `src/check.ts`: skip 0-byte files in `listFiles` (kills the 45 self-check unknowns).
- Docs alongside: CHANGELOG `[Unreleased]` → Fixed entries; STATUS dated entry.
- Human-owned: set `NPM_TOKEN` secret, re-run release (or keep CTA on the source path).

**Phase 1 — Truth pass (all S)**
- README: `muse-wonder-1.0`, drop/hedge `web :3100`/Cordis/`encrypted`, fix line-169 counts, fix/hedge npm badge.
- Rewrite all 4 `src/skills/*/SKILL.md` Usage blocks to real subcommands only; remove the `tour` receipt (`install.ts:385`) or ship a minimal `tour`; implement `--profile muse` as `--adapters=claude` + hero defaults (or cut the claim); add a test asserting every documented skill command dispatches in `cli.ts`.
- Relabel STATUS dates to actual Oct-26, REHEARSAL "8/8" → honest per-row verdicts; `git rm` the 13 MB `.docx` blobs (keep `.md`); label `severity-policy.json` aspirational (or drive one rule's severity from it — label unless trivial).
- Corpus v2 (first cut): dedupe the 4 verified overlaps, fix `corpus.json:3`'s note, add TOKEN-shaped positives **plus benign TOKEN cases** (docs mentioning tokens — must-pass, see R2); extend `SECRET_KEYWORD_RE`; harden `compareBaseline` with count/coverage floors and surface unknowns in the totals line.
- Adversarial bench: commit the sweep as `tests/adversarial/sweep.test.ts` with fresh T-labels, or downgrade "9/9" to the outline it is.
- Docs alongside: SUBMIT checkboxes that newly hold (description draft status); CHANGELOG entries.

**Phase 2 — Enforcement hardening (M + S)**
- Index-aware check: `runIndexCheck()` in `check.ts` (staged blobs + `--push` range) reusing the `REGISTRY` loop; wire into managed hook scripts; commit the synthesis smuggle repro as `proof-beats` regression (must now block); scan inside the checkpoint path (**timed validation** on this repo — see R3).
- Gate: resolve script body through interpreter first-args (`sh`/`bash`/`zsh`/`source`/`.` + first non-flag arg); route `apply_patch`-family names into the write lens; regression tests for each.
- Adapter config move per decision 5, **with per-adapter allowed-keys conformance tests** (see R1); enforce `FENCE_SYNC_TOKEN` on re-attestation (`integrity.ts:88` TODO) and wire `verifyAttestation` into `check`; replace the `|| true` postinstall shim with `vibe-fence check` (graceful when binary absent, loud always).
- Docs alongside: HACKATHON/STATUS entries; CHANGELOG.

**Phase 3a — Meta wiring, Spark (M)**
- `check`/`gate --explain`: after a blocking report, one `companionCall` (goal-blind prompt: task + findings only, per S-05/S-11) via `withBudgetCap`; artefact + request ID land in `.fence/events.ndjson` (already implemented, `meta-client.ts:283-290`). No key → stderr note, normal exits.
- Contract tests with mocked `fetch` (no live calls in CI); SUBMIT "why Meta matters" becomes writable from the artefacts — draft it.
- Docs alongside: README Meta section corrected to wired reality; CHANGELOG.

**Phase 3b — Verify + Wonder fast-follow (M; starts only after one successful Wonder probe)**
- Human-approved single Wonder probe call → record model ID reality. If it fails, 3b pauses; nothing else is affected.
- Thin `vibe-fence verify` wrapping `runTrustLadder` (+ pre-push hook option); `verify` failure triggers one `architectCall` under the existing ≤5 cap; same artefact discipline; mocked contract tests.

**Phase 4 — Evals + demo fixtures (S build; runs human-owned)**
- Redteam: `--out` NDJSON artefact, per-run spend/token logging, `--mode benign` (kept per recommendation), fix `--max-tokens` NaN validation; evaluate through both `runCheck` and `evaluateToolCall`.
- Demo fixture: committed 2-file leak app + script cues aligned to verified beats (init → block → explain → checkpoint → undo).
- Docs alongside: CREDITS-PLAN spend-log format ready; SUBMIT demo/video checkboxes → in-progress.
- Human-owned: Fireworks/Modal suites, corpus-v2 fold-in, video record + upload, portal submit.

## Validation Plan

- Every phase ends with: `bunx tsc --noEmit` → `bun run validate` → `bun run build` → `bun test` → `bun run eval` (the repo's own gates; Phase 0 additionally dry-runs `release.yml` steps except publish).
- New regression tests (colocated `*.test.ts`, repo convention): smuggle-blocked hook test, interpreter-arg gate tests, `apply_patch` write-lens test, dist-cleanliness guard, skill-command dispatch test, TOKEN recall + benign-TOKEN cases, baseline-floor tests (deleted-positives must now fail `--check`), per-adapter config conformance tests, meta-client mock-fetch contract tests.
- Black-box scratch checks (in `/tmp`, as in synthesis): leaky commit blocked / smuggle blocked / clean commit lands; `./evil.sh` vs `bash ./evil.sh` parity; packed `node dist/cli.js` smoke for every touched subcommand.
- **Risk-driven validations (new):** R1 — conformance tests assert generated host configs contain only allow-listed top-level keys (allow-lists cite vendor doc URLs in comments); R2 — repo self-scan 0-fail **plus** benign-TOKEN corpus cases must pass or the keyword change reverts; R3 — `time` worktree+index scan on this repo recorded in the commit body, budget <2 s on ~250 files, else implement staged-only fast path before merging Phase 2.
- **Highest-risk validation:** the `--explain` live call — proving a real request ID lands in `.fence/events.ndjson` requires one human-approved live call with `MUSE_API_KEY` (mock tests cover CI; the live beat is verified once by the human, then recorded for the video). Same one-call discipline gates Phase 3b's Wonder probe.
- Human acceptance per phase: Phase 1 = `grep` audit of claims; Phase 4 = recorded video matches the fixture beats.

## GitHub hygiene (built into execution, not after)

Grounded in this repo's actual conventions: Conventional-Commit subjects (`feat:`/`fix:`/`docs:`/`rehearsal:`), multi-line bodies with a `Gates:` trailer (see `d51b002`), `feat/*` branch names, Keep-a-Changelog `CHANGELOG.md`, semver tags (`v0.1.0` exists; `release.yml` triggers on `v*`).

- **Branch:** `feat/synthesis-fixes` off `main`. All work happens there; `main` stays green.
- **Commits — one per phase-step, never a mega-commit:**
  - `ci: gate release on tests + eval` (Phase 0)
  - `fix: exclude tests from dist and tarball; honest counts` (Phase 0)
  - `docs: README/SKILLs/STATUS truth pass` (Phase 1, possibly split `docs:` + `fix:` for skills)
  - `fix: corpus v2 dedupe + TOKEN recall + baseline floors` (Phase 1)
  - `feat: index-aware hook scanning (--staged, --push)` (Phase 2)
  - `fix: gate interpreter-arg + tool-name routing` (Phase 2)
  - `fix: adapter config schema conformance + attestation wiring` (Phase 2)
  - `feat: check/gate --explain via Spark companion` (Phase 3a)
  - `feat: redteam artefacts + benign mode` (Phase 4)
  - `docs: demo fixture + submit readiness` (Phase 4)
  - Each body ends with a `Gates:` trailer (`tsc 0, validate ok, build ok, N tests pass, eval clean`) matching `d51b002` style.
- **Merge:** push the branch, open a PR (CI must be green — it runs tsc/validate/build/test/pack), merge with **rebase-merge, no squash**, so the per-step commits survive as the reviewable record. (No squash = each fix stays bisectable.)
- **Tags:** no tag during the work. When the human approves publish-readiness after Phase 4, tag **`v0.2.0`** — minor, not patch (new backward-compatible features: `--explain`, `--staged`/`--push`, redteam artefacts) and not major (nothing breaking). Tagging `vX.Y.Z` triggers `release.yml` → npm publish with provenance. Never retag; a bad release gets `v0.2.1`.
- **Files updated alongside code (per-phase checklist, enforced before each commit):** CHANGELOG `[Unreleased]` (Added/Fixed), STATUS.md dated entry, SUBMIT.md checkboxes as they flip, CREDITS-PLAN.md spend log once paid runs happen, README counts/badges. `HACKATHON.md` needs no change (all work is post-`hackathon-start` by construction — verify with `git log hackathon-start..HEAD` at merge time).
- **PR description template:** what changed per commit, synthesis finding IDs closed (C1–C13/L1–L15), verification evidence (new tests + scratch repros), and the remaining human-owned items.

## Risks (all converted to mitigations above; residual notes only)

- **R1 schema drift:** residual risk is a vendor changing schemas after we ship. Covered by allow-list conformance tests + a standing pre-release checklist item ("re-verify generated configs against vendor docs"). Nothing further to do in this implementation.
- **R2 keyword FP:** residual risk is exotic real-world FPs beyond the corpus. Covered by the 0-fail self-scan gate + benign-TOKEN cases; redteam benign mode (Phase 4) provides ongoing measurement.
- **R3 hook perf:** residual risk is pathological repos (10k+ files). Existing file/byte caps bound it; the <2 s budget on this repo is the tripwire for a staged-only fast path.
- **Open questions:** None. The two trim options are resolved by recommendation above (benign kept, Wonder split to 3b) — override either in your reply and I will refold the plan.
