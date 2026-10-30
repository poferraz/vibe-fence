# Evaluation evidence

This page records what has been measured, on which revision, and what remains
unknown. It is deliberately narrow: a passing suite supports the specific claim
next to it, not a general claim that the tool is safe.

- **Revision:** `919e702` (`main`, 2026-10-30).
- **Environment:** macOS, Bun 1.3.14, Node ≥20. Fabricated fixtures only; no
  paid provider calls and no model-generated code executed.
- **Reproduce:** `bunx --no-install tsc --noEmit`, `bun run build`,
  `bun run validate`, `bun test`, `bun run eval` (run in that order).

## Gates

| Check | Result on `919e702` |
|---|---|
| TypeScript (`tsc --noEmit`) | 0 errors |
| Build (`tools/generate.ts`) | ok, 60 files in `dist/` |
| Validation (`tools/validate.ts`) | ok (AGENTS ≤400 tokens, SKILL budgets, schemas) |
| Test suite (`bun test`) | 317 pass, 0 fail, 39 files |
| Eval corpus (`bun run eval --check`) | 34 positive / 34 negative, 1 unknown, no regressions |
| Self-scan (`bun src/cli.ts check`) | exit 0, 0 block findings (one pre-existing BILL-01 warning in `src/rules/sec-02.ts`) |

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
| Corpus eval (`tests/evals/corpus.json`) | Per-rule precision/recall floors against a held-out corpus, with a pinned baseline and an unknown ceiling | General-world rates; the corpus is small and hand-built |

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
- **No live provider evidence.** The provider-facing evaluation path is not
  used here. No paid run, live model call, or model-generated code execution is
  part of this evidence.
- **Platforms.** Results above are from one macOS development machine; other
  platforms are untested.

## Reporting a problem

Use the security reporting path in `SECURITY.md`. Do not include real secrets in
a report; a fabricated reproducer is enough.
