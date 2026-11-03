# Evaluation evidence

This page records what has been measured, on which revision, and what remains
unknown. It is deliberately narrow: a passing suite supports the specific claim
next to it, not a general claim that the tool is safe.

- **Revision:** working tree based on `5189213` (`release/final`); uncommitted source, tests, and documentation differ from that commit. A final committed candidate has not been tested.
- **Environment:** macOS, Bun 1.3.14, Node ≥20. Fabricated fixtures only; no
  paid provider calls and no model-generated code executed in this run.
- **Reproduce:** `bunx tsc --noEmit`, `bun run build`,
  `bun run validate`, `bun test`, `bun run eval` (run in that order).

## Gates

| Check | Historical result on `919e702` (not current candidate) |
|---|---|
| TypeScript (`tsc --noEmit`) | 0 errors |
| Build (`tools/generate.ts`) | ok, 60 files in `dist/` |
| Validation (`tools/validate.ts`) | ok (AGENTS ≤400 tokens, SKILL budgets, schemas) |
| Test suite (`bun test`) | 452 pass, 4 skip, 0 fail, 46 files (skips: W08 postgres-gated, documented) |
| Eval corpus (`bun run eval --check`) | 34 positive / 34 negative, 1 unknown, no regressions |
| Self-scan (`bun src/cli.ts check`) | exit 0, 0 block findings (one pre-existing BILL-01 warning in `src/rules/sec-02.ts`) |

On November 3 the uncommitted candidate based on `5189213` passed the ordered gate: typecheck, build (64 generated files), validate, 494 tests passed / 4 PostgreSQL-dependent skips / 0 failed, and eval (35 positive, 35 negative, one unknown, no baseline regression). These results describe a dirty working tree, not a committed public revision. The offline packed-install Git test passed. Two disposable manual-scan rehearsals blocked a fabricated finding and passed after it was removed; real-host execution remains unverified.

`unknown` means a rule could not decide from the available content. It is
counted separately and never treated as a pass.

## Suites and the claim each supports

The authoritative ladder — claim, audience, failure decision, assumptions and blind spots for every retained suite — is [EVALUATION-LADDER.md](EVALUATION-LADDER.md) with its machine-readable copy in `tests/evals/ladder.json`. Suites are never combined into one number.

| Suite | Claim it supports | What it does not show |
|---|---|---|
| A — hostile (`tests/benches/hostile.test.ts`) | 11 rule benches, each with at least 6 labelled attack shapes; every shape is caught on at least one real surface (gate or tree scan), and a cold control stays uncaught | That unlisted attack shapes are caught; that the host enforces the block |
| B — benign (`tests/benches/benign.test.ts`) | 11 rule benches, each with at least 10 legitimate shapes that must not fire (zero false positives) | That these are the only legitimate shapes users write |
| C — scenario (`tests/benches/scenario.test.ts`) | install → block → explain (offline) → checkpoint → undo runs end-to-end through the packed CLI with correct exit codes, and `init` stays under the 3 s budget | That a real host session behaves the same |
| D — explanation rubric (`tools/loops/grade.ts`) | Offline structural scoring of explanation text (coarse 0–4 signal) | Explanation quality in a live model call; no live call is made |
| M — bounded explanation (`src/framework/explain.test.ts`) | Mocked calls test category-only prompts, a request limit, timeout, and invalid-output handling | Provider behavior, explanation usefulness, or a dollar spending cap |
| Corpus eval (`tests/evals/corpus.json`) | Per-rule precision/recall floors against a held-out corpus, with a pinned baseline and an unknown ceiling | General-world rates; the corpus is small and hand-built |
| H — workflows (`tests/benches/workflows.test.ts`) | 20 recorded scenario snapshots replay offline (48 pass, 4 postgres-gated skips) | Live-model behaviour; skipped cases are stub-covered only |

Known misses are kept in `tests/benches/KNOWN-GAPS.md` (G-01…G-05) and are
never relabelled as benign to keep a suite green.

## Limitations

- **Detection, not prevention.** The scanner inspects content. It is not a
  sandbox and does not make an agent safe. Enforcement depends on the host:
  where a host cannot run a pre-action check, the tool says so and offers the
  Git-hook and `check` fallbacks.
- **Host execution is not verified.** Hook discovery, trust prompts and actual
  execution in Codex, Claude Code, Cursor, OpenCode and Hermes have not been
  confirmed end-to-end in a real session. Receipts say "installed — host
  execution not verified" for that reason.
- **History scanning is bounded.** `check --push` scans changed blobs in
  outgoing commits, but skips binary extensions, blocks on submodules and on
  any scan it cannot complete (512 KiB per file, 5,000 commits, 5,000 changed
  file entries). It reports what it inspected and refuses to call an incomplete
  scan clean. It is not a complete secret detector, and findings show paths and
  commits without repeating historical file contents.
- **Live provider evidence is not established by the gate above.** That run was
  $0 fixture-only: no paid call and no model-generated code execution. A separate
  recorded synthetic Spark request is described below. Earlier
  notes report the following calls, which have not been independently verified here: the Oct 26
  Spark probe (`muse-spark-1.3`, `resp_6adff4cb…`), two Oct 28 live
  `--explain` calls (`resp_6ae248a7…`, `resp_6ae248d7…`, in
  `.fence/events.ndjson`), the Nov 3 Wonder probe (`muse-wonder-1.0`,
  `resp_6ae93cf8…`), the Nov 3 Muse Image generation (`logo.webp` +
  `.fence/meta-image.json`), the Baseten redteam batch (~30K tokens, benign
  0/66 FP), and the Modal probe (~3.6K tokens) — see
  `docs/project/BENCH-SCOREBOARD.md`. Raw paid artefacts stay in gitignored
  `tools/out/` and `.fence/`; event rows alone contain request metadata, not response text, and do not independently prove provider success.
- **Platforms.** Results above are from one macOS development machine; other
  platforms are untested.

## Reporting a problem

Use the security reporting path in `SECURITY.md`. Do not include real secrets in
a report; a fabricated reproducer is enough.

## November 3 follow-up verification

After the earlier run above, the current dirty working tree passed the requested ordered gate again: typecheck, build (64 generated files), validate, 495 tests passed / 4 PostgreSQL-dependent skips / 0 failed, and eval (35 positive, 35 negative, one unknown; no baseline regression). The gate used offline or mocked model requests. `git diff --check` passed. These results do not establish behavior in an actual coding-agent host.

A later local implementation pass on the same uncommitted branch passed typecheck, build (65 generated files), validation, and the full suite: **509 passed, 4 PostgreSQL-dependent skips, 0 failed** across 52 files. The evaluation reported 35 true positives, 0 false positives, 35 true negatives, 0 false negatives, and one unknown, with no baseline regression. This was a dirty working tree; documentation was subsequently updated, and no final committed candidate was tested by this run. No live host interception or new paid provider call was made.

An offline `0.2.1` tarball from that source build contained the runtime, templates, skills, README and license, with no `.fence`, `.env`, or test files. In a fresh synthetic Git repository without Bun or a global `vibe-fence` on PATH, the packed installer created a working project-local runtime. The runtime reported version `0.2.1`, auto-detected the Codex configuration as unverified, identified a missing upstream, blocked a staged synthetic SEC-01 finding, and allowed a corrected commit. This was local package verification, not an npm publication or a live host session.

An isolated public-tree candidate based on `ce56fa1` was committed locally as `751521b0f5572dc1a3fb9ce88b698d4bdc9cc94f`. On that exact commit, a frozen-lockfile install and the ordered gate passed: **440 tests passed, 4 PostgreSQL-dependent skips, 0 failed**, with the same 35 TP, 35 TN, and one unknown in the synthetic evaluation. The smaller public tree has fewer tests than the working checkout. Subsequent review found and corrected a separate invalid-range error that echoed raw input; the current follow-up includes that correction. Neither candidate commit has been published.

A separate user-authorized direct Muse Spark request using a synthetic SEC-01 finding returned an explanation. The recorded response is stored locally in the private demo materials; it is not evidence of a host interception or a live response during a future recording. The successful request reported 64 input and 185 output tokens; estimated standard-rate cost was $0.000866 before adjustments. An earlier invalid-response request did not report usage, so total spend is unknown.

## Meta model integration and recorded synthetic example

The opt-in explanation path is implemented in [explain.ts](../src/framework/explain.ts) and [meta-client.ts](../src/framework/meta-client.ts). The deterministic checks decide whether to block; the model provides advisory text. The request is built from fixed rule categories and severities, without source contents, filenames, or tool arguments.

On November 3, a user-authorized direct call to the explanation function returned the following response to a synthetic SEC-01 finding. It was a real provider response, recorded separately from the offline test gate; it does not establish live host interception or automatic model use for every block.

| Field | Recorded value |
|---|---|
| Model | `muse-spark-1.3` |
| Finding sent | `SEC-01 [block]: A secret may be exposed to client code.` |
| Request settings | `store: false`, `max_output_tokens: 512`, `reasoning: { effort: "minimal" }` |
| Provider-reported usage | 64 input and 185 output tokens |
| Estimated cost of successful call | $0.000866 at the recorded standard rates, before adjustments; not an invoice |

Recorded response to the synthetic finding:

> We found 1 issue that needs attention before you go live — your app may be sharing a private password or key with visitors, which could let someone misuse your accounts or services.
>
> **Fix for SEC-01:** Move that secret key to the secure server side so it's never sent to the browser.

An earlier invalid response had no reported usage, so total spend is unknown.

[meta-probe.ts](../tools/meta-probe.ts) and [meta-image.ts](../tools/meta-image.ts) are development probes, distinct from the product's optional explanation path. The [evaluation ladder](EVALUATION-LADDER.md) and [benchmark scoreboard](project/BENCH-SCOREBOARD.md) distinguish offline fixtures from reported open-weight experiments. SAM is contract-tested and has no product caller. These records do not establish hackathon eligibility or organizer acceptance of the model integration.
