# Updated audit + locked goal — vibe-fence v2

Date: 2026-10-26 (America/Vancouver). Baseline HEAD: `4efad33`.
Supersedes: product-direction parts of `2026-10-26-hackathon-readiness.md` and
`docs/superpowers/specs/2026-10-26-senior-developer-harness-design.md` (owned-CLI choice).
Technical findings A1–A10 in the readiness audit remain valid and were re-verified.

## Goal (one sentence)

vibe-fence is a free, plug-and-play senior developer that installs into whatever
coding tool a vibe-coder already uses: it turns their plain request into a
senior-dev plan, physically stops the famous accidents before they land, refuses
to say "done" until real checks pass, and keeps a safety snapshot so anything can
be undone — with Meta models as its brain and its demo driver, but no user ever
forced to switch tools or models.

Plain model: the fence is the locks; the model is the driver. Locks work no
matter who drives. Meta-exclusive was rejected (forces users to switch models);
Meta does real product work instead (see below).

## Locked decisions (user, 2026-10-26)

| Question | Decision |
|---|---|
| Product shape | Plug-and-play for ANY coding tool, tiered honestly: **Enforced** (blocking plugin/hook where the host supports it — OpenCode is demo hero), **Guarded** (`vibe-fence check` + git pre-commit/pre-push hooks — works in every git-based tool), **Advisory** (AGENTS.md/skills briefing elsewhere). One check engine powers all tiers. |
| Meta's role | Merged: (1) fence's brain — Muse Spark via Meta Model API writes the senior-dev plan + one-sentence block explanations when a key is present (graceful fallback to user's own model); (2) demo coding driver is a Meta model; (3) Muse Code builds the fence itself, on the record (access TBC). Fence core is deterministic code, needs no model. |
| API key | User has a Meta Model API key, ready to test. Day-1: one real call, record which model IDs answer. Never print/store the key in repo. |
| Demo | Small shop — customer accounts + orders. One feature ("add customer accounts") built live on a prepared skeleton, recorded (retakes allowed). Simplest possible tech, chosen by builders, not a user decision. |
| Proof beats (all 4, non-negotiable) | ① Master-password leak stopped (SEC-01 `NEXT_PUBLIC_*` secret — NOT yet implemented). ② Private files / dangerous commands off-limits (SEC-02, NET-01 exist as checkers, unwired). ③ "Done" = really checked: verifier must execute tests/build; show one on-camera failure sent back for repair (kills fake-pass A1). ④ Undo snapshot (checkpoint) + unsafe commit/push stopped (git hooks). Everything else is cut until these are real. |
| Distribution | Staged: GitHub all week → npm publish Nov 3 ONLY after the uploaded tarball is test-installed on a clean machine/dir without bun. Name `vibe-fence` was 404 on npm (2026-10-26). |
| Partners (Fireworks/Baseten/Modal) | Fuel for building only (credits power dev + eval runs). NO product integrations. Product talks to Meta only. Mention partners honestly under "built with". |
| Builder time | Solo, a few hours/day. Plan budgets user hours; recording session Nov 1–2. |
| Explanations | Every block: one plain sentence (what almost went wrong) + the fix. Optional teach-me mode only if proof beats are stable. |
| No UI | Confirmed. Terminal product. |

## Verified findings (merged P0 list)

1. **A1 Fake pass** — `src/framework/verifier.ts:244–274` returns `passed: true`
   for lint/tests/tests-x2/generated without executing anything. Failing test ⇒
   overall pass reproduced by prior session; re-read and confirmed this session.
2. **A2 No enforcement** — `src/adapters/claude.ts:73–74` writes empty
   `PreToolUse: []`/`PostToolUse: []`; `src/rules/index.ts` REGISTRY (4 rules:
   NET-01, SEC-02, BILL-01, PRV-09) imported by nobody. SEC-01/SEC-03/FS-01/
   CMD-01/SUP-01/GIT-01/DB-01 of the claimed "10 hard-blocks" do not exist.
3. **A3 Package broken** — `bun pm pack --dry-run`: 51 files, no `tools/`;
   `dist/cli.js` spawns `bun tools/install.ts` (excluded + requires bun).
   `npm view vibe-fence` → 404.
4. **A4 Integrity** — arbitrary non-empty `FENCE_SYNC_TOKEN` accepted;
   installed `postinstall-guard.sh` is `validate.ts || true` (never blocks),
   weaker than `src/templates/postinstall-guard.sh`.
5. **A5 Stubs** — `src/framework/git.ts:179` `isWithinProjectRoot()` always
   `true`; `fenceUndo()` returns TODO string; checkpoint/undo called by nobody;
   CLI forwards any arg (incl. `tour`) into install (`src/cli.ts`).
6. **A6 CI red** — `.github/workflows/ci.yml` runs validate before build;
   `dist/` gitignored ⇒ clean checkout fails. Confirmed via `gh run list`
   (main CI failing at validate, 2026-10-26). No test step in CI.
7. **A7 Installer** — OpenCode silently skipped: `tools/install.ts:264` looks up
   `installOpencodeAdapter`, export is `installOpenCodeAdapter`
   (`src/adapters/opencode.ts:52`). Receipt says 5 adapters, README claims 6.
   `.agents/skills/` created empty — skills never copied. `updatedAt`/
   `installedAt` churn each run (timestamp-only non-idempotence).
8. **A8 Meta unwired** — `src/framework/meta-client.ts` (companion/architect)
   has no product callers; `sam.ts`/`fence-look.ts` are stubs; model IDs
   `muse-spark-1.3`/`muse-wonder-1.0` unverified against live API.
9. **Docs drift (new)** — STATUS + senior-developer-harness design record the
   superseded owned-CLI direction. Must be reconciled first or fresh sessions
   resurrect the wrong product.
10. **Claims inflation** — README ✅ for demo (placeholder), Meta tooling,
    10 hard-blocks, 14/29/55 block counts (numbers in JSON, not rules);
    REHEARSAL "8/8" over its own PARTIAL verdicts (Tasks 2, 8).

Working & keep: installer merge-not-clobber + idempotence, rule kernel
(unknown ≠ pass), integrity SHA-256 + invisible-Unicode scan, research base
(FINAL-v4, 186 sources), tsc/validate/build green locally, `bun test` 10 pass
(5 SAM tests × src+dist only — proves nothing end-to-end).

## Event facts (verified 2026-10-26 via dev.meta.ai/events/global-hackathon)

- Indie track judged on creativity, technical ambition, whether it works.
  (README's 30/25/25/20 weights are NOT on the public page — unverified.)
- Framing: build with Muse Spark series, Muse Image, SAM 3.1 via Meta Model
  API; Meta open weights; Muse Code. Pure "Meta only drove the demo" was
  judged insufficient risk — hence Meta-as-brain above.
- Submission deadline Nov 4, 9 PM ET = 6 PM Vancouver. Internal target: Nov 3 eve.
- Partners listed: Fireworks, Baseten, Modal (credit offers ≠ confirmed balances).
- UNVERIFIED (login-walled at cerebralvalley.ai/e/meta-ai-developer-hackathon/details,
  fetched twice, returns "Loading…"): detailed judging, pre-existing-work rule,
  submission deliverables/video limits. Repo largely predates Oct 26 kickoff —
  disclosure wording depends on this. USER TASK DAY-1: paste those sections.

## Week plan (acceptance-gated)

| Dates | Work | Exit gate |
|---|---|---|
| Oct 27 | Docs-drift fix (this file is authority); fix A1 fake-pass; CI order build→validate + add tests; first real Meta API call recorded | Failing test cannot pass; model IDs known; CI green on clean checkout |
| Oct 28 | Self-contained Node CLI in dist (no bun, no tools/), real subcommand dispatch (unknown commands fail clearly); copy skills on install; fix OpenCode name bug | Packed tarball installs + `init` works in clean dir without bun |
| Oct 29–30 | Enforced tier: OpenCode plugin (`tool.execute.before`) blocking on new SEC-01 + SEC-02 + NET-01; Guarded tier: `vibe-fence check` + pre-commit/pre-push hooks running same engine; wire git.ts checkpoint/undo as subcommands | 4 proof beats pass as automated tests; benign actions proceed |
| Oct 31 | Meta brain: Spark senior-brief + one-sentence explanations (recorded fixture fallback for stage); shop demo skeleton ready | Full demo run end-to-end once |
| Nov 1–2 | Rehearse + record live one-feature build; teach-me only if beats stable; Fireworks credits power eval repetitions (fuel only) | Submittable take exists by Nov 2 night |
| Nov 3 | npm publish after clean-machine tarball test; README honesty pass (every ✅ true; pre-existing-work disclosure per pasted rules); submit | Submission confirmed |
| Nov 4 | Buffer only. No new features after Nov 2. | — |

Explicitly deferred: web UI (:3100), SAM/fence-look, SAM/Image, Modal-in-product,
provider switching in product, Cordis replication, 6-adapter polish, verify-remote,
billing-guard wiring, more rules beyond demo beats, more research.

## Remaining unknowns (facts to establish, not preferences)

1. Cerebral Valley authenticated rules (user pastes Day-1).
2. Muse Code access actually granted to user? (Shrink process claim if not.)
3. OpenCode ↔ Meta Model API compatibility: `opencode` not installed on this
   machine; `~/.config/opencode/opencode.jsonc` has no Meta provider. Demo
   driver depends on this; fence's own Spark call does not. Fallback driver:
   Hermes/DeepSeek Harness pointed at Meta models (user's build environment).
4. Which Meta model IDs support tool-calling via the API (test, don't assume;
   existing `/v1/responses` client may not fit OpenCode's expected protocol).

## Session continuity (for every fresh session)

Start: read `docs/project/STATUS.md` → this file → inspect `git status`/HEAD.
Report capabilities as proposed / implemented / wired / verified separately.
End: update STATUS with verified commands/results, blockers, exact next action.
`src/` is authority, `dist/` generated; AGENTS.md ≤400 tokens; never report an
unexecuted check as passed.
