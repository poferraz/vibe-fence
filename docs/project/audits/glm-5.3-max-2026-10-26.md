# Audit — GLM 5.3 (ollama-cloud/glm-5.3) — 2026-10-26

Audit method: I audited the working checkout in place (it is the repo at HEAD `d51b002`, matching GitHub `main`). **Everything ran, nothing was static-only**: `bun install` (4ms, cached), `bunx tsc --noEmit` (1.4s, 0 errors), `bun run build` (75 files + `dist/cli.js`), `bun run validate` (ok), `bun test` (**237 pass / 0 fail, 754 expect() calls, 26.3s**), `bun run eval` (**24 TP / 21 TN / 0 FN / 0 FP / 1 unknown, no regressions vs pinned baseline, 0.35s**). GitHub state verified via API: public repo created 2026-10-26T16:44Z, 14 CI runs, push run on `d51b002` concluded `success`, Dependabot active (2 open PRs). Note: I am auditor #4 in the repo's own `docs/project/EXTERNAL-AUDIT.md:16-20` plan.

## Scores (/10, one line of justification each)

| Dimension | Score | Why |
|---|---|---|
| Idea & goal focus | 8 | Sharp, real JTBD (non-technical vibe-coders shipping vulns), honest product boundary in `PRODUCT.md`/`README.md:179` |
| Correctness & completeness | 7 | All six gates green locally + CI on the exact claimed numbers, but `npx vibe-fence init` fails (npm 404), `web` subcommand advertised but absent from `src/cli.ts` |
| Tests & evals quality | 7 | Proof beats are genuine e2e (real `git commit` through an installed hook, `tests/proof-beats.test.ts:106-121`), but corpus is 45 fixtures and the 9/9 adversarial sweep cites a `/tmp` script not in the repo |
| Partner-env usage for tests/eval | 4 | Capped redteam stub is well-designed (`tools/eval.ts:220-267`) but **zero paid runs have been executed** — CREDITS-PLAN.md:55-59 all unchecked; results would be stdout-only, unpersisted |
| Meta integration depth | 3 | Exactly **one** verified live call ever (probe, `resp_6adff4cb28da781ca979428b`); `companionCall`/`architectCall`/`callSam` are called by **no product path** — grep across `src/` finds callers only in `tools/meta-probe.ts:51` and a test |
| GitHub hygiene | 8 | Secrets clean in tree+history, `.env` properly ignored, MIT, topics, CI meaningful, dependabot; dings: dead npm badge, 13MB of `.docx` blobs, README overclaims |
| Hackathon compliance | 9 | Boundary handling is exemplary — annotated tag resolves cleanly, HACKATHON.md matches verifiable history, dates all consistent |
| Demo/video readiness | 3 | No video (admitted), **no before/after demo app in the repo**, and the headline install path is broken for a judge who types `npx vibe-fence init` |
| Winning potential | 5 | Best-in-class execution story, but 50% of judging weight (Demo 25% + Meta 25%) is currently unproven with 9 days left |

## Top 5 strengths (with file:line evidence)

1. **The proof beats prove real behavior, not mocks.** Beat 4b installs real git hooks, writes a `FENCE_BIN` wrapper to the actual `src/cli.ts`, and asserts a leaky commit throws while a clean commit lands (`tests/proof-beats.test.ts:106-121`); beat 3 runs a genuinely failing test fixture through `runTrustLadder` and asserts the verdict fails with the log containing `boom: failing test` (`tests/proof-beats.test.ts:76-91`). I would trust a live demo on this suite.
2. **Hackathon boundary is verifiable and honest.** `git show hackathon-start` → annotated tag at `44beb58` (2026-10-26 10:05 -07); pre-tag commits run `056e49c` (Oct 21, FINAL-v4 research) through `411c7ca`; post-tag work (public repo, CI, enforcement, eval runner) is all Oct 26; GitHub repo creation timestamp (2026-10-26T16:44Z) corroborates. `HACKATHON.md:13-19` discloses exactly what the prior work was. This is the cleanest start-boundary handling I've seen.
3. **Self-critical status discipline.** `docs/project/STATUS.md:6` openly records its own audit findings A1–A10 ("fake verification pass, empty hooks, broken packed CLI, stub containment/undo, red CI, unwired Meta") and then fixes them with red→green test evidence; `STATUS.md:16-20` labels uncommitted work honestly. `SUBMIT.md:18-20` explicitly warns its own Meta claims "must be TRUE by Nov 3".
4. **The rule engine is genuinely engineered, not regex theater.** Zero-FP doctrine with mention-vs-payload suppression (`src/rules/sec-01.ts:1-18`, quoted/commented/prose suppression), live realpath containment for FS-01, entropy+allowlist for SEC-03, down-migration exemption for DB-01 (`tests/evals/corpus.json:51`), `unknown ≠ pass` as a hard invariant (`src/config/severity-policy.json`). The self-scan dogfooding (repo's own tree passes, STATUS.md:17) is a strong signal.
5. **Eval harness architecture is submission-grade even at v0.** Local mode is deterministic and isolated (tmp git repo + nulled gitconfig, `tools/eval.ts:76-91`), baseline is pinned and CI-gated with review-before-commit (`tools/eval.ts:307-320`, `.github/workflows/ci.yml:25`), and redteam is fail-safe: capped N≤50, keys from env only, never gates, never touches baseline (`tools/eval.ts:225-228`). Fragmented secret fixtures (`corpus.json:18-19`) keep live-shaped keys out of the repo.

## Top 10 issues (ranked; severity, location, one-line fix, effort)

1. **P0 — No demo video and no demo app** (25% of judging). `SUBMIT.md:16-17` unchecked; the "Unfenced Disaster" before/after fixture repo does not exist anywhere in the tree; only the script exists (`docs/research/synthesis/DEMO-SCRIPT.md`). Fix: build the fenced/unfenced fixture pair as a committed `demo/` dir and record the 3-min video this week, not D8–9. Effort: **M**.
2. **P0 — Meta is decorative, not load-bearing** (25% of judging). No runtime path in `check`/`gate`/`verifier`/`cli` calls `companionCall`/`architectCall` (grep: only `tools/meta-probe.ts:51`); SAM's only caller is its own helper (`src/framework/sam.ts:164`). Fix: wire one Spark explain-beat into `gate` block output (the fence decides, Spark explains — this is the product's own S-05 doctrine, `meta-client.ts:157`) and one Wonder escalation on verifier-fail. Effort: **M**.
3. **P1 — `npx vibe-fence init` fails today**: package not on npm (registry.npmjs.org/vibe-fence → 404), so `README.md:14-17`'s headline command and its npm badge are dead for any judge who tries it. Fix: `bun pm pack` already passes in CI — publish, or change the headline to the source-run command. Effort: **S**.
4. **P1 — README overclaims vs code.** "stateless **encrypted** replay" (`README.md:54` — no encryption anywhere in `meta-client.ts`); `muse-wonder-1.3` (`README.md:55`) vs code default `muse-wonder-1.0` (`src/framework/meta-client.ts:25`) — one is wrong, neither is live-verified; `npx vibe-fence web → :3100` (`README.md:96,179`) — no `web` subcommand in `src/cli.ts:22-48`; "5×4 rubric + unsafe-action rate" presented as reporting (`README.md:109-119`) — no runner exists. Fix: make each claim true or delete it before a judge reads it. Effort: **S**.
5. **P1 — Partner credits untouched, so the partner-feedback field will be blank.** CREDITS-PLAN.md:55-59: every paid-run action unchecked; redteam never executed on any provider. Fix: run Suite B/C below — total cost under $10. Effort: **S**.
6. **P1 — Redteam results are unpersistable.** `tools/eval.ts:263-265` prints CAUGHT/MISS to stdout only; no `--json` in redteam mode, no artifact file — numbers can't be cited, diffed, or shown to judges. Fix: write `.fence/redteam-<timestamp>.json` with rule/model/variants/verdicts. Effort: **S**.
7. **P2 — The 9/9 adversarial sweep is not reproducible from the repo.** `tests/adversarial/README.md:181` cites `/tmp/fence-adversarial-sweep.ts` — a throwaway. The README is honest that the bench is an outline, but the headline "9/9" has no committed runner. Fix: commit the sweep as `tests/adversarial/sweep.test.ts`. Effort: **S**.
8. **P2 — Corpus is small and slightly leaky.** 45 cases = 2–3 TP per rule; `corpus.json:7` (`EXPO_PUBLIC_AUTH_SECRET`) duplicates `src/rules/sec-01.test.ts:24`; `corpus.json:41` (`force-with-lease`) duplicates `src/rules/git-01.test.ts:46` — contradicting corpus.json:3's "independently authored" note. Also baseline.json:71-79 hides 1 `unknown` inside the 1.000/1.000 headline. Fix: expand to ~10 TP + 10 FP per rule, dedupe against unit fixtures, surface unknowns in the totals line. Effort: **M**.
9. **P2 — 13MB of `.docx` research blobs committed** (`docs/research/contributors/*` includes a 4.9MB file). Judges cloning the repo pull 11MB of `.git` + 13MB of docs bloat; a security tool's repo should be lean. Fix: `git rm` + link externally (they're duplicated as `.md` beside them). Effort: **S**.
10. **P2 — Commit-identity inconsistency and a stale CLI stub.** Two author identities (`poferraz@me.com` ×21, noreply ×4); `src/cli.ts:144-146` ships a `tour` command that exits 2 with "lands Oct 30"; one dirty file in the tree (`docs/project/EXTERNAL-AUDIT.md`, this audit). Fix: unify git identity, delete the `tour` stub before freeze. Effort: **S**.

## Compliance checklist (each submit field: READY/GAP/BLOCKED + evidence)

| Field | Status | Evidence |
|---|---|---|
| Team name | **GAP** | Decision pending (`SUBMIT.md:8`) — 1-minute fix |
| Team members | **READY** | Solo, fits Indie ≤4 (`SUBMIT.md:9`) |
| Track / Problem statement | **READY** | Locked; form selections at submit (`SUBMIT.md:10-11`) |
| Most Viral X post (optional) | **GAP** | Not posted (`SUBMIT.md:12-13`) — free lottery ticket, do it |
| Project description | **GAP** | Draft scheduled Nov 3 (`SUBMIT.md:14`) — README Impact section is 80% of the raw material |
| Public GitHub repo | **READY** | Verified public, 25 commits, CI green on HEAD (`api.github.com` actions: conclusion `success`) |
| 3-min YouTube demo video | **BLOCKED** | Not recorded (`SUBMIT.md:16-17`); blocker: no demo app exists in repo (Issue 1) |
| Use of Meta products | **GAP** | One live probe call (gitignored artifact `.fence/meta-probe.json`); no product surface calls any Meta model (Issue 2); SUBMIT.md:18-20 itself flags this |
| Why Meta's models are important | **GAP** | Cannot honestly be written today — no Spark plan card a user acted on, no Wonder escalation that changed an outcome (`SUBMIT.md:21-23`) |
| Feedback on Meta products | **GAP (thin)** | Probe notes only: model-ID discovery, one latency point (`STATUS.md:11`) |
| Feedback on partner tech | **BLOCKED** | Requires real usage; zero partner runs so far (`CREDITS-PLAN.md:55-59`) |
| Promo consent | **READY** | Understood (`SUBMIT.md:28`) |
| Originality / start boundary | **READY** | Tag + disclosure verified against actual history — exemplary |

## Proposed eval plan on partner credits (concrete: suites × models × ~cost × expected numbers)

- **Suite A — corpus expansion, $0, ~2h (do first).** Author ~15 new fixtures per rule (10 TP + 5 FP) → 165 new cases → ~210 total. Produces: per-rule precision/recall table on 11 rules (today's 1.000/1.000 on 45 cases will not survive 210; that's the point — a judge trusts a table with misses in it more than a perfect one).
- **Suite B — redteam generation, Fireworks (held credits), open-weights models, <$5.** `bun run tools/eval.ts --redteam 30 --rule R --model <id>` × 11 rules × 4 seeds = 1,320 attack variants ≈ 66K output tokens at ~50–200 tok each → cents per run on open-weights pricing; repeat ×5 ≈ <$5. Produces the headline judge number: **per-rule catch rate over generated attacks** (e.g., "NET-01: 148/150 caught; the 2 misses were folded into corpus v2").
- **Suite C — benign generation (FP side), Modal $30, <$1.** Same shape, 30 benign lines per rule on 1–2 open-weights models. Produces: **"0/330 false blocks"** — the zero-FP doctrine finally has measured evidence.
- **Suite D — 5×4 rubric + unsafe-action rate, Modal/Fireworks, <$5.** 5 tasks × 4 rubric dims, model-judged with ~1K-token verdicts; run fenced vs unfenced. Produces the demo-adjacent number: **"unsafe-action rate: unfenced 5/5 leaked vs fenced 0/5."** (This is the table `README.md:111-119` currently only pretends to report.)
- **Meta Model API $150 — judged surfaces only, <$10 total.** ~10 Spark explain-beats inside the demo (`companionCall` after gate blocks — in/out ≈ <$0.50 at `meta-client.ts:28` pricing), ONE Wonder escalation on verifier-fail, Muse Image assets for the video (~$0.01/img), one SAM 3.1 spot-check. Log every request ID to `.fence/events.ndjson` (already implemented, `meta-client.ts:283-290`) and cite IDs in the "Use of Meta" answer. Document the unspent balance honestly — for a safety tool, "we capped spend" is a feature.
- **Log per-run spend** in `CREDITS-PLAN.md` — currently the plan has checkboxes, not receipts.

## Verdict (3 sentences max)

Not a placer today, but genuinely salvageable in the 9 remaining days — the deterministic fence, test suite, and compliance hygiene are top-decile for an Indie solo entry, while 50% of the judging weight (Demo 25% + Meta 25%) rests on artifacts that don't exist yet. The single biggest reason: the fence works without Meta, so today Meta is a badge on the README rather than the brain of the product, and a judge will notice. Highest-ROI fix: wire one real Spark explain-beat into `gate`'s block output, publish to npm so the video's `npx vibe-fence init` actually runs, then record the demo — those three moves convert two empty judging columns into scored ones.

## Could not verify

- **Meta Model API reality**: whether `muse-spark-1.3` / `muse-wonder-1.0` / `muse-wonder-1.3` are valid model IDs, and whether `https://api.meta.ai/v1/responses` and `/v1/sam/segment` are real endpoints — no API key in my audit environment and I refused to spend the entrant's credits. The sole live-call evidence (`.fence/meta-probe.json`, request `resp_6adff4cb28da781ca979428b`) is **gitignored**, so judges can't see it either — the entrant must surface it in the submission.
- **The 9/9 adversarial sweep** — the script lived in `/tmp` and is not in the repo (`tests/adversarial/README.md:181`).
- **Partner credit balances** (Baseten $100+2M TPM, Modal $30/$100, Fireworks amounts) — claims in `CREDITS-PLAN.md` only; no receipts.
- **`bun pm pack` tarball correctness** — CI ran it successfully on HEAD (Actions API), but I did not execute a pack/install-from-tarball locally.
- **Cerebral Valley portal rules** (judging/pre-existing-work/submission text) — login-walled, per `STATUS.md:9`; I judged against the facts provided in the prompt.
- **Demo-day runtime behavior of adapters I can't run** (Cursor, Antigravity, Hermes, Codex) — only the OpenCode plugin path has an executing test (`src/adapters/opencode-plugin.test.ts`); the others are file-wiring installs, which is a known 5/6 gap in e2e coverage.
- **`npx vibe-fence init` "43ms" claim** (`README.md:16`) — REHEARSAL.md §A records 53/64/63ms for the older 5-adapter installer; the 43ms figure is unverified and slightly optimistic.