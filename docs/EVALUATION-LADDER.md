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

The November 11 simplification replaces the retired remote-explanation suite
with local CLI coverage. The changed claims below passed the November 11 uncommitted working-tree
verification. The base revision is not an exact release candidate; see the
[current evidence record](EVIDENCE.md) for results and remaining limits.

| Suite | Claim | Audience | Failure decision | Main blind spot |
|---|---|---|---|---|
| L — local CLI (`src/cli.test.ts`) | One-tool init; fixed repair text without a network request or API key, including the legacy `--explain` flag | user | Do not claim simple, local-only setup until it passes | No real editor activation or beginner usability evidence |
| P — packaged runtime (`tests/packed-install.test.ts`) | Offline tarball installs a project runtime; staged leaks and oversized files block, clean commits pass | maintainer | Packaged Git journey is not ready | No real editor execution or broad platform/upgrade evidence |
| A — hostile (`tests/benches/hostile.test.ts`) | 11 rule benches, ≥6 labelled attack shapes each; every shape caught on a real surface; cold control uncaught | maintainer | Miss → `KNOWN-GAPS.md` entry or rule fix; never relabel as benign | Only listed shapes are measured; no host enforcement shown |
| B — benign (`tests/benches/benign.test.ts`) | 11 benches, ≥10 legitimate shapes each, zero fires, no scorer error | user | A fire is a false-positive defect → rule fix or recorded exception | Fits the fixture set; a different legit shape may still block |
| C — scenario (`tests/benches/scenario.test.ts`) | One-tool setup → block with fixed local repair → checkpoint → undo through the packed CLI; correct exits, `init` < 3 s | user | Failure = user path not ready | No real host session; timing is machine-specific |
| D — explanation rubric (`tools/loops/grade.test.ts`) | Coarse 0–4 structural score for explanation text, offline | reviewer | Rubric regression only; says nothing about live quality | Cannot judge correctness or tone; no model call |
| E — corpus (`tests/evals/corpus.json`, `bun run eval`) | Per-rule precision/recall floors vs a pinned baseline, unknown ceiling, no lost TNs | maintainer | Regression or lost TN fails; new TN needs review + baseline update | Small hand-built corpus; not a general-world rate |
| F — sweep (`tests/adversarial/sweep.test.ts`) | Labelled scenarios S1–S8b behave as recorded, including no CLI bypass surface | maintainer | Any label regression blocks | One fixed payload per label; no refusal behaviour |
| G — proof beats (`tests/proof-beats.test.ts`) | Leak stopped, harmful blocked + benign allowed, real verdict, checkpoint history reversed with working edits preserved, unsafe staged blob blocked | user | A failing beat means a user-facing claim is false | No host trust or execution; one platform; undo does not restore prior file contents |
| H — workflows (`tests/benches/workflows.test.ts`) | Recorded workflow snapshots replay offline with their documented pass/fail outcomes | reviewer | Fix a replay mismatch before relying on this evidence | Replay is not a live model; PostgreSQL-dependent episodes skip when unavailable |

The former M suite (`src/framework/explain.test.ts`) covered mocked remote
provider requests. It is retired with the model integration. Its previous
result remains under `retired` in the manifest for provenance, not as evidence
for the local-only product.

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

`bun test` covers L, P, A–D, F–H and the manifest check; `bun run eval` covers E.
Report skipped and unknown results separately — an unknown is never a pass.

## Historical recorded results

The October 30 record reported 323 tests, no failures, and 34 positive / 34
negative corpus cases with one unknown. Later historical per-suite results are
recorded in the manifest at their stated revisions and dates. These precede
the November 11 simplification. The subsequent working-tree run passed 466 tests
with four PostgreSQL-dependent skips and no failures; the offline corpus had
36 positives, 35 negatives and one unknown with no regression. See
[current evaluation evidence](EVIDENCE.md) for the candidate and limits.

The 0.5.0 release candidate subsequently passed 474 tests with four optional PostgreSQL skips and no failures; the expanded corpus passed 40 positives, 37 negatives and one unknown. See the versioned release-candidate section in `EVIDENCE.md`.
