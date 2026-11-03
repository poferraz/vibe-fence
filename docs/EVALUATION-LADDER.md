# $0 evaluation ladder

The retained deterministic suites, what each one is allowed to claim, who acts
on it, and what happens when it fails. The authoritative copy is
`tests/evals/ladder.json`; `tests/evals/ladder.test.ts` fails if a suite is
added without a claim, audience, failure decision, assumptions or blind spots.

Two rules:

1. **One decision per run.** A result either blocks a change or is explicitly
   marked as informational. Nothing is "green" without saying what it decided.
2. **Never combine suites.** Detection, warnings, prevention, refusal and task
   completion are different measurements. There is no single "caught" number.

## Retained suites

| Suite | Claim | Audience | Failure decision | Main blind spot |
|---|---|---|---|---|
| A — hostile (`tests/benches/hostile.test.ts`) | 11 rule benches, ≥6 labelled attack shapes each; every shape caught on a real surface; cold control uncaught | maintainer | Miss → `KNOWN-GAPS.md` entry or rule fix; never relabel as benign | Only listed shapes are measured; no host enforcement shown |
| B — benign (`tests/benches/benign.test.ts`) | 11 benches, ≥10 legitimate shapes each, zero fires, no scorer error | user | A fire is a false-positive defect → rule fix or recorded exception | Fits the fixture set; a different legit shape may still block |
| C — scenario (`tests/benches/scenario.test.ts`) | install → block → offline explain → checkpoint → undo through the packed CLI, correct exits, `init` < 3 s | user | Failure = user path not ready | No real host session; timing is machine-specific |
| D — explanation rubric (`tools/loops/grade.test.ts`) | Coarse 0–4 structural score for explanation text, offline | reviewer | Rubric regression only; says nothing about live quality | Cannot judge correctness or tone; no model call |
| E — corpus (`tests/evals/corpus.json`, `bun run eval`) | Per-rule precision/recall floors vs a pinned baseline, unknown ceiling, no lost TNs | maintainer | Regression or lost TN fails; new TN needs review + baseline update | Small hand-built corpus; not a general-world rate |
| F — sweep (`tests/adversarial/sweep.test.ts`) | Labelled scenarios S1–S8b behave as recorded, including no CLI bypass surface | maintainer | Any label regression blocks | One fixed payload per label; no refusal behaviour |
| G — proof beats (`tests/proof-beats.test.ts`) | Five user-facing beats: leak stopped, harmful blocked + benign allowed, real verdict, undo restores, real hook blocks | user | A failing beat means a user-facing claim is false | Does not prove host trust or execution; one platform |

## Explicitly skipped (not on the shipped tree)

| Item | Why skipped | Decision |
|---|---|---|
| Stateful fake transport (actor → mirror → evidence → oracle) | Code exists only on the local-only `eval/live-loops-local` branch; isolation boundary not proven | Stays skipped; no model-generated code is executed |
| Provider and ledger fakes | Private-branch code; no paid authorization | Stays skipped; no dispatch without a durable bound and explicit approval |

## Deliberately not added

| Control | Why not |
|---|---|
| Mistaken production deploy | No deterministic, independently checkable outcome without a real host/sandbox; a simulated deploy would measure the simulation |
| Prompt-injection resistance | Model behaviour is not deterministic; a fixture cannot decide pass/fail independently of a live model |
| Approval-scope confusion | Depends on host approval UX and user response; no deterministic fixture exists |

## Running the ladder

```
bunx --no-install tsc --noEmit
bun run build
bun run validate
bun test
bun run eval
bun run validate   # optional: re-check docs budgets after edits
```

`bun test` covers A–D, F, G and the manifest check; `bun run eval` covers E.
Report skipped and unknown results separately — an unknown is never a pass.

## Last recorded results

All retained suites passed on this branch (2026-10-30): 323 tests, 0 failures,
eval 34 positive / 34 negative with one unknown. The revision in each manifest
entry is the one that result applies to; a later change must update it.
