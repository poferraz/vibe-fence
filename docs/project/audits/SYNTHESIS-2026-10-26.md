# Synthesis — 5-model audit (7 reports) — 2026-10-26

**Counting convention:** v1+v2 pairs from the same model are re-runs of the same head (`d51b002`), not independent audits — so CONFIRMED requires 2+ *distinct models*. In practice this changed only one placement (adapter empty-hooks → lead, single-model). Every other confirmed finding has 2+ distinct models behind it. I invented no findings; my only additions are VERIFICATION marks from tree spot-checks I ran myself (code reads, greps, live `dist/cli.js` probes, one full hook-bypass reproduction in `/tmp`).

## Score table (per report + median)

| Dimension | gemini v1 | gemini v2 | glm v1 | glm v2 | gpt-6 | muse | kimi-k3 | **median** |
|---|---|---|---|---|---|---|---|---|
| Idea & goal focus | 9/10 | 9/10 | 8 | 8 | 7 | 7 | 8 | **8** |
| Correctness & completeness | 6.5/10 | 6/10 | 7 | 7 | 3 | 6 | 6 | **6** |
| Tests & evals quality | 7.5/10 | 7.5/10 | 7 | 7 | 5 | 6 | 8 | **7** |
| Partner-env usage for tests/eval | 4.5/10 | 4.5/10 | 4 | 4 | 1 | 3 | 3 | **4** |
| Meta integration depth | 2.5/10 | 2.5/10 | 3 | 3 | 2 | 3 | 3 | **3** |
| GitHub hygiene | 8/10 | 8/10 | 8 | 8 | 6 | 6 | 7 | **8** |
| Hackathon compliance | 6/10 | 6/10 | 9 | 9 | 6 | 5 | 6 | **6** |
| Demo/video readiness | 4/10 | 4/10 | 3 | 3 | 2 | 2 | 4 | **3** |
| Winning potential | 5.5/10 | 5.5/10 | 5 | 5 | 3 | 4 | 5 | **5** |

*Widest spread (tie, 4 pts): Correctness 3–7 (GPT's live bypass repros vs others' demo-path verification — see D1) and Hackathon compliance 5–9 (Muse scores portal fields, GLM scores the exemplary boundary — see D4). All 7 verdicts agree: does not place today.*

## Confirmed strengths (top 5, with verification note each)

1. **Proof beats prove real end-to-end behavior** (cited 7/7). Hook→CLI→engine commit block, real checkpoint→undo, real failing-fixture verifier run. **VERIFIED — I re-ran `bun test tests/proof-beats.test.ts`: 5/5 pass.**
2. **Hackathon boundary is exemplary and pushed** (7/7). Annotated tag `hackathon-start` → `44beb58`, disclosure matches history. **VERIFIED — `git show hackathon-start` confirms hash/date/message; Kimi's pre-tag spot-check (exactly 4 rules at `411c7ca`) corroborates the disclosure.**
3. **Checkpoint/undo is real git with injection discipline** (GPT, muse, gemini v1+v2). Shell-free `execFileSync`, tracked-only default, pushed→revert logic. **VERIFIED (static) — `src/framework/git.ts:60` shell-free call, `:129` deliberate `--no-verify`, `:198` revert path; live undo repro'd by GLM-v2 and Kimi.**
4. **Zero-FP mention-vs-payload engine; repo self-scans clean** (muse, gemini v1+v2, GLM v1+v2, kimi). **VERIFIED — I ran `node dist/cli.js check` on the repo: 236 files, 0 fail (0 block) → OK.**
5. **Mechanical verifier refuses fake passes (`unknown≠pass`) + byte-capped logs** (muse, gemini v1+v2, kimi). **VERIFIED (static) — `src/check.ts:112-117` counts unknowns separately from passes; `runTrustLadder` (`verifier.ts:376`) exists with real subprocess execution (though CLI-unreachable — see C7).**

## Confirmed issues (ranked)

**C1 — Meta is decorative, not load-bearing.** Consensus **P0** (6×P0; GPT P1 — split noted, substance identical). Cited-by: all 7. Only one recorded Spark probe (`resp_6adff4cb…`); `companionCall`/`architectCall`/`callSam` have zero product callers; SAM fail-open; `fence-look` live path stubbed; no Image artefacts. **VERIFIED** — grep over `src/ tools/ tests/`: `companionCall`/`architectCall` defined only (`meta-client.ts:247,261`), called nowhere; `runTrustLadder` called by tests only; `fence-look.ts:171` returns stub "pass"; `sam.ts` catch-all returns empty masks; no `public/images/`. Effort: M (5 reports) vs L (GPT's full repair-loop scope) — both right at different scopes, flagged.

**C2 — No demo video; script's dependencies don't exist.** Consensus **P0** (GPT P1 vs rest P0/BLOCKED — split noted). Cited-by: all 7. **VERIFIED** — no `.mp4` in tree; README badge "video lands D8–9" (`README:69`); `SUBMIT:16` unchecked; script needs Spark plan card + Image assets + deploy URL, none present. Effort M–L (scope-dependent).

**C3 — `npx vibe-fence init` is dead: npm 404.** Consensus **P1** (gemini-v2 + kimi P0 vs GPT/muse/GLM P1 — split noted; gemini-v1 explicitly couldn't verify). Cited-by: 6/7, 5 models. **VERIFIED** — live `npm view vibe-fence` → E404 just now; Kimi's failed-release-run detail UNCHECKABLE (auth-gated logs; Kimi flagged it as inference). Partial mitigation found: README:84 hedges ("Or after npm publish") but the headline (`README:15`) doesn't. Effort S.

**C4 — README overclaims vs code.** Consensus **P1** (gemini P0 ×2, GPT/muse/GLM P1, kimi P2). Cited-by: all 7. **VERIFIED claim-by-claim** — `muse-wonder-1.3` (README:55) vs code default `muse-wonder-1.0` (`meta-client.ts:25`); `npx vibe-fence web → :3100` (README:96) vs no `web` in `cli.ts:22-48`; "encrypted replay" (README:54,61) vs comment-only mention (`meta-client.ts:10`, no crypto code); line-169 "…+ 6 planned" stale vs 11 implemented rules. **Nuance: "10 zero-FP hard-blocks" is DEFENSIBLE — code has exactly 10 `block` + 1 `warn` (BILL-01, `index.ts:56-58`) — so that sub-point of muse#5/kimi#8 is PARTLY REFUTED as framed; the stale part is line-169's "4 named + 6 planned".** Effort S.

**C5 — Corpus is small and leaky; 1.000/1.000 baseline proves little.** Consensus **P1** (GPT/muse/kimi P1, GLM P2 ×2, gemini discusses without P-level). Cited-by: all 7 discuss. 45 cases; BILL-01 n=2; PRV-09 hides 1 unknown in the headline. **VERIFIED** — verbatim overlaps: `EXPO_PUBLIC_AUTH_SECRET` (`corpus.json:7` = `sec-01.test.ts:24`), `git push --force-with-lease…` (`corpus.json:41` ≈ `git-01.test.ts:46`), `K=v` (`corpus.json:20` = `sec-03.test.ts:56,61`), `git push -f origin main` (`corpus.json:39` = `git.test.ts:155`); `baseline.json` PRV-09 `unknowns:1` with 1.000/1.000. **Amplifier (GPT-only, VERIFIED): comparator checks ratios only (`eval.ts:148-171`) and 0/0→1 (`eval.ts:132-134`), so deleting all positives still passes.** Effort M (S for dedupe-only per kimi — flagged as scope split).

**C6 — Partner credits untouched; redteam stub never run and stdout-only.** Consensus **P1** (muse P0 vs rest P1; GLM-v2 P2 on persistence — splits noted). Cited-by: all 7. **VERIFIED** — `CREDITS-PLAN:55-62` paid runs all unchecked; redteam is attacks-only briefs, calls `REGISTRY.check` directly not `gate` (`eval.ts:253-260`), prints CAUGHT/MISS to stdout only (`:263-265`), no spend artefact; `--max-tokens banana` passes validation and serializes as `null` (`:228` NaN-comparison + `:296` — GPT's exact claim VERIFIED). Effort S (run) + S (persistence).

**C7 — Whole modules unreachable: verifier, integrity, anonymize; `|| true` postinstall; `tour` stub.** Consensus **P1**. Cited-by: 5 reports, 4 models (GPT, muse, gemini v1+v2, kimi). **VERIFIED** — `verifyAttestation`/`scanInvisibleUnicode`/`isDestructiveGitCommand`: zero non-test callers; `runTrustLadder`: tests only; no `verify`/`anonymize`/`web` in `cli.ts:51-153`; postinstall `…tools/validate.ts … || true` (`install.ts:263`); `tour` exits 2 (`cli.ts:144-146`) yet advertised (`install.ts:385`, `cli.ts:4`). Integrity's own comment claims hook invocation (`integrity.ts:106`) that doesn't exist. Effort M (wiring) / S (tour, postinstall).

**C8 — Installed docs teach phantom commands.** Consensus **P2 with P0–P2 split** (gemini P0 on SKILL.md; tour P1/P2; `--profile` P2). Cited-by: 6 reports, 4 models. **VERIFIED** — `SKILL.md` files (installed verbatim per `install.ts:308-324`) teach `fence guard/plan/dial/learn/validate/sync/tour/verify-remote` and `npx vibe-fence anonymize`, every one of which exits 2 (`cli.ts:152-153`); `grep --profile src/` = zero hits. Effort S.

**C9 — Test count inflated 237 vs 127; tarball ships tests.** Consensus **P0–P2 split, median P1** (gemini P0 ×2 vs GPT/muse P2). Cited-by: 4 reports, 3 models. **VERIFIED (mechanism)** — `generate.ts:51-57` copies all of `src/` incl. `*.test.ts` into `dist/`; `package.json:33-38` ships `dist/`; differential counts (237 vs 127) corroborated by 3 auditors' independent runs. Effort S.

**C10 — `bash ./evil.sh` / `sh` bypass live script-body audit.** Consensus **P2** (GPT P1 as one variant; gemini P2 ×2). Cited-by: 3 reports, 2 models. **VERIFIED live** — same payload: `./evil.sh` → `NET-01 [block]` exit 1; `bash ./evil.sh` → exit 0 (first token `bash` has no `/`, `gate.ts:83-96`). Effort S.

**C11 — Dead stubs presented as protection.** Consensus **P2** (muse P1 vs gemini P2 ×2). Cited-by: 3 reports, 2 models. **VERIFIED each** — `isWithinProjectRoot` returns `true` unconditionally (`git.ts:241-247`, self-marked "stub — TODO"); `buildTeachingCard` returns `"TODO"` fields (`dial.ts`); `pushToQueue` writes bare array vs `loadQueue` expecting `{version, entries}` (`circuit-breaker.ts:179-195` vs `queue.ts:42-49`); `fence-look` checks `META_API_KEY`/`MODEL_API_KEY` not `MUSE_API_KEY` (`fence-look.ts:160`). Effort S.

**C12 — "9/9" adversarial sweep not reproducible from repo.** Consensus **P2**. Cited-by: 4 reports, 3 models (GPT, GLM v1+v2, kimi). **VERIFIED** — cites `/tmp/fence-adversarial-sweep.ts` (`tests/adversarial/README.md:181`), absent from tree; **GPT's sharpest sub-point VERIFIED: sweep reuses T-numbers for different tasks** (outline T1 = invisible-Unicode injection, sweep T1 = grep exfil; outline T2 = instruction override, sweep T2 = NEXT_PUBLIC in `.env.local`). Effort S.

**C13 — STATUS.md narrates a fictional schedule.** Consensus **P2** (kimi P2; GPT no-P note). Cited-by: 2 reports, 2 models. **VERIFIED** — "Oct 27/28/29/30 (done, uncommitted)" labels (`STATUS:8-20`) vs all-Oct-26 commits/`d51b002`. Effort S.

## Unconfirmed leads (single-model; kept, with verification where I checked)

- **L1 — Staged-blob commit bypass (GPT#1, P1, M).** Stage leak → clean worktree → prohibited blob commits; hooks scan worktree only. **VERIFIED by my independent repro: control (leaky worktree) blocked exit 1; smuggled commit landed exit 0 with `key = EXPO_PUBLIC_AUTH_SECRET` in `HEAD:app.json`. Treat as confirmed for fixing.** Worth checking because it's the top-ranked enforcement hole and now doubly reproduced. (Side finding: this machine's global `core.hooksPath=/Users/poferraz/git-hooks` silently disables `.git/hooks` — the repo's own `STATUS:19` notes this; my repro neutralized it locally.)
- **L2 — OpenCode config violates published schema (GPT#3, P1, M).** Top-level `fence` key vs `additionalProperties:false`. **VERIFIED both halves** — `opencode.ts:48` writes it; live `opencode.ai/config.json` has top-level `additionalProperties:false` and no `fence` property. Claude/Cursor adapters use the same `fence`-key pattern. Fix before claiming the integration.
- **L3 — More gate bypasses: `apply_patch`, `psql -c`, 64 KiB padding (GPT#5, P1, L).** **Mostly VERIFIED** — `apply_patch` matches no tool regex (exact `^(write|edit|create|apply|patch|multiedit)$`, `context.ts:61-63`) and I confirmed exit 0 live with a secret-bearing patch; `psql` matches no lens (static); 64 KB truncation is real but DOCUMENTED fail-open (`gate.ts:9-10,39-60`). Worth checking: exact-match regexes silently pass `apply_patch`-style real tool names.
- **L4 — Integrity token theater (GPT#6 specifics, P1, L).** Any `FENCE_SYNC_TOKEN` passes; re-attestation needs no token. **VERIFIED** — `:137` passes on any set value; `:88` the token assertion is a TODO, unenforced. Fold into C7's fix.
- **L5 — Release workflow publishes without tests/evals (GPT hygiene note, no P). VERIFIED** — `release.yml` runs tsc + validate + build only. One-line fix, include with C3.
- **L6 — Missing-binary fail-open (GPT#2 mechanism, P1, M).** Hook prints "binary not found … skipping check", returns 0 (`git-hooks.ts:37-38`); OpenCode plugin warns + allows (`opencode.ts:95`). **VERIFIED.** Design tension (never brick vs never silently unprotected) — at minimum needs loud health reporting.
- **L7 — 45 self-check unknowns from 0-byte `.gitkeep`s (gemini-v2#6, P1, S). VERIFIED live** — repo self-check shows exactly `45 unknown` (5 files × 9 rules); `check.ts` has no empty-file skip. Cosmetic but noisy on every clean run.
- **L8 — SEC-01 TOKEN recall hole (kimi#5, P1, S). VERIFIED live** — `NEXT_PUBLIC_AUTH_TOKEN` → exit 0 while `NEXT_PUBLIC_API_SECRET_KEY` → exit 1 (keyword class is SECRET/SERVICE_ROLE/PRIVATE only). Corpus has no TOKEN-shaped positive, so recall 1.000 conceals it. Real detection gap, cheap fix.
- **L9 — REHEARSAL "8/8" vs ⚠️ PARTIAL rows (kimi#10 sub-point, P2, S). VERIFIED** — headline claims 8/8 while rows 2/3/4/6/7/8 read PARTIAL (`REHEARSAL:182-188,376-384`). Relabel.
- **L10 — Release-failure root cause = missing `NPM_TOKEN` (kimi#3 detail). UNCHECKABLE** — run logs auth-gated; Kimi correctly flagged it as inference. Don't assert it.
- **L11 — 13 MB `.docx` blobs (GLM#9, P2, S). VERIFIED** — 4.9/4.0/3.9/2.8 MB files under `docs/research/`, `.md` versions alongside. `git rm` + links.
- **L12 — Dual git identity 21/4 (GLM#10 sub-point, P2, S). VERIFIED** exactly (`poferraz@me.com` ×21, noreply ×4). Cosmetic.
- **L13 — Severity policy decorative JSON (muse#10, P2, M). VERIFIED** — `severity-policy.json:64` lists its own wiring as TODO; severities hard-coded in `index.ts`. Drive one rule from it or label aspirational.
- **L14 — Adapter empty hook arrays (gemini v1+v2 — same model, P1, S). VERIFIED** — Claude `PreToolUse: []` (`claude.ts:73-74`), Cursor `hooks: []`-or-existing (`cursor.ts:103-104`). Second auditor replication pending, but the code is unambiguous.
- **L15 — checkpoint `--no-verify` bypass framing (GPT#1 vs muse strength).** Existence VERIFIED (`git.ts:129`, rationale documented `STATUS:18`). Substance: checkpoints skip pre-commit by design; combined with L1, contaminated checkpoints land silently. See D7.

## Disagreements (split → call with tree evidence)

- **D1 — Correctness 3 (GPT) vs 6–7 (all others).** *Call: both right, different lenses.* Happy-path blocks verified by 4 auditors AND my repro (control commit blocked, exit 1; `./evil.sh` blocked). GPT's adversarial variants also verified (staged-blob smuggle exit 0 with leak in HEAD; `bash ./evil.sh` exit 0; `apply_patch` exit 0). The 6–7s describe the demo path; the 3 describes adversarial robustness. No rescore per rules.
- **D2 — Corpus "genuinely held-out" (gemini v1+v2) vs leaky (GLM, GPT, kimi, partly muse).** *Call: leaky side wins.* 4+ verbatim unit-test overlaps verified (C5). Gemini's distinct-payload examples may hold individually, but the blanket "held-out" claim is REFUTED; `corpus.json:3`'s "independently authored" note is inaccurate as written.
- **D3 — Adversarial README "honest" (muse, gemini, GLM) vs T-identity drift (GPT).** *Call: both true.* Header honestly says "P2 outline, not full harness" — but sweep T1/T2 reuse outline numbers for different tasks (verified, C12). Keep the honest framing, relabel the sweep tasks.
- **D4 — Compliance labels: Track/Problem READY (GPT/GLM/kimi/gemini-v2) vs GAP (muse); Why-Meta BLOCKED (muse/kimi/gemini) vs GAP (GPT/GLM).** *Call: pure labeling convention, zero substance split.* Prose locked (`SUBMIT:10-11`), portal unsubmitted; "why Meta matters" unwritable by all accounts (`SUBMIT:21-23`). Suggest READY/GAP split into prose-vs-portal.
- **D5 — 237 tests at face value (GLM, kimi) vs inflated (gemini, GPT, muse).** *Call: inflation side wins on mechanism* (C9 verified in `generate.ts`); GLM/kimi didn't contest it, they just didn't flag it. No contradiction to resolve beyond correcting the count to 127.
- **D6 — Modal $30 "confirmed in hand" (file + 4 models) vs "verify it's not ordinary Starter allowance" (GPT).** *Call: GPT's caution stands.* `CREDITS-PLAN:50` checks the box but misdates it "Oct 29" (future vs Oct-26 reality — supporting skepticism); UNCHECKABLE without account access. Don't claim as hackathon credit until verified.
- **D7 — checkpoint `--no-verify`: hole (GPT) vs documented safeguard (muse).** *Call: existence + rationale both verified; GPT's substance point stands* — by design it skips the only enforcement point, and with L1 a contaminated checkpoint commits silently. Fix in the C7/L1 pass, not as a revert of the rationale.
- **D8 — "10 hard-blocks" overclaim? (muse#5).** *Call: PARTLY REFUTED* — 10 `block` + 1 `warn` in code makes "10" defensible (C4 nuance). The genuinely stale text is line-169's "4 named + 6 planned".
- **D9 — Meta severity P0 (6 reports) vs P1 (GPT).** *Call: ranking artifact.* GPT ranked enforcement holes above it; all agree Meta is unwired and it decides 25% of the rubric. No action.

## Final fix list (max 10, prioritized)

1. **Publish to npm (or repoint hero CTA to source path); add `bun test` + eval to `release.yml`.** (S — C3, L5)
2. **Wire one real Spark explain-beat into `check`/`gate` block output + one Wonder escalation on verifier-fail; log request IDs to `.fence/` artefacts.** (M — C1; GPT's full repair-loop variant is L — do the M slice first)
3. **Build the 2-file leak-fixture demo app and record the 3-min video on verified beats only.** (M; L with Image beat — C2)
4. **README truth pass: wonder-1.0, drop/hedge `web :3100`/Cordis/`encrypted`, fix line-169 counts, hedge or fix npm badge.** (S — C4)
5. **Rewrite all 4 `SKILL.md` Usage blocks to real commands (`init/check/gate/checkpoint/undo`); remove `tour` receipt or ship `tour`; implement or cut `--profile muse`.** (S — C8)
6. **Make hooks index-aware: scan staged blobs pre-commit and new outgoing commits pre-push; add the smuggle repro as a regression test.** (M — L1; include checkpoint-path scan per D7)
7. **Exclude `*.test.ts` from `dist/` + tarball; correct counts to 127 unique; skip 0-byte files in `check`.** (S — C9, L7)
8. **Corpus v2: dedupe the 4+ overlaps, add TOKEN-shaped + hard cases (fix L8's keyword class), harden `compareBaseline` with count/coverage floors.** (M — C5, L8)
9. **Redteam `--out` NDJSON + spend logging + benign mode; then run the Fireworks/Modal suites and fold misses into corpus v2.** (S build + M run — C6)
10. **Gate hardening: audit script body through interpreter first-args (`sh/bash/zsh`); route `apply_patch`-style names into the write lens.** (S — C10, L3)

*Overflow (all S except verifier): `vibe-fence verify` + pre-push wiring (M); move OpenCode `fence` block under `.fence/` (S); enforce `FENCE_SYNC_TOKEN` on re-attestation (S); `git rm` the `.docx` blobs (S); relabel STATUS dates + REHEARSAL 8/8 (S).*

## Win assessment

**Does not place today — unanimous 7/7, and the tree backs them: the deterministic core genuinely blocks (verified live), but the two 25% columns (Meta tooling, demo) rest on an unwired client library and an unrecorded video, while the top enforcement hole (staged-blob smuggle, now doubly reproduced) and the dead `npx` hero path would both survive a 10-minute judge probe.** Highest-ROI fix is the consensus sequence: wire one Spark explain-beat into the already-working `gate` output, publish to npm, then record the locked script on verified beats — that single pass converts C1/C2/C3 from red to evidenced without inventing anything.

## Reports used (filenames + dates)

- `gemini-argon-4-medium-2026-10-26.md` — 2026-10-26 (v1; npm unverified)
- `gemini-argon-4-medium-2026-10-26-v2.md` — 2026-10-26 (v2 deep-dive; supersedes v1's gaps)
- `glm-5.3-max-2026-10-26.md` — 2026-10-26 (v1)
- `glm-5.3-max-2026-10-26-v2.md` — 2026-10-26 (v2 re-run; all v1 findings re-checked, stand)
- `gpt-6-codex-2026-10-26.md` — 2026-10-26
- `muse-wonder-max-2026-10-26.md` — 2026-10-26
- `kimi-k3-2026-10-26.md` — 2026-10-26 (added mid-synthesis per user request)
