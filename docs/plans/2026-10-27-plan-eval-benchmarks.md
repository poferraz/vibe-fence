# Plan: eval / test / benchmark loops (2026-10-27)

Branch: `eval/benchmark-loops` (long-lived until merged; per-unit commits
with Gates trailers). Charter for standing eval infrastructure that turns
real-life testing into rule upgrades.

## Goal

Build a standing eval/test/benchmark system for vibe-fence that converts
real-life testing into rule upgrades: hostile coverage the model providers
refuse to generate, benign false-block budgets, and demo-grade scenario
replay — with `$0` fixture runs locally and paid loop runs only against
available credits (Modal, Baseten, Fireworks later).

## Success Criteria

- Hostile breadth no longer depends on provider compliance: every one of
  the 11 rules has ≥6 hand-written attack fixtures caught at ≥95%, pinned
  in fixture mode so `bun run eval` stays the authority.
- Benign false-block rate is *measured and budgeted*, not asserted:
  per-rule FP budgets in the baseline check (a benign firing fails
  `--check` like a miss does).
- Real-life situations (leaked keys in commits, staged-blob smuggles,
  unsafe checkpoint/undo, the 5 demo beats) replay as automated pass/fail
  benchmarks with latency budgets, not just proof beats.
- Every paid loop is spend-capped (calls × tokens), env-gated,
  artefact-logged to `tools/out/` (gitignored), and foldable: each miss/FP
  ends as rule-fix + corpus case, never a shrug.
- Nothing paid runs by accident: `$0` by default; live loops require an
  explicit provider + key env + cap flags, and Modal loops respect the
  strict `$30`-credits rule.

## Approach

**Three suites, one substrate.** Extend `tools/eval.ts` (single eval
authority — briefs, dual-surface scoring, NDJSON artefacts already exist)
rather than adding a new tool. No loop runner exists today (loops were
shell-driven), so loop mechanics land as a small driver on top of the
existing CLI surface.

- **Suite A — Hostile fixtures (closes the refusal gap).** Hand-written
  attack payloads per rule, evaluated through the same dual surfaces (gate
  legs + `runCheck` tree scan) as red-team variants. Deterministic,
  committable, `$0`, runs in CI. Sources: corpus TP gaps, sweep S-cases,
  rule tests, session-observed provider-complied SEC-01 variants.
- **Suite B — Benign FP budgets (real-life benign traffic).** Expanded
  benign corpus (deploy scripts, docs, placeholders, public-name env vars,
  routine git) with expected-pass cases plus baseline floors: per-rule FP
  ceiling + unknown ceiling, mirroring the coverage floors already in
  `compareBaseline`.
- **Suite C — Scenario replay (real-life situations).** The `demo/CUES.md`
  5 beats + `SUBMIT.md` situations + proof-beats staged against the packed
  CLI in scratch repos, with timing budgets (init <3s per `REHEARSAL.md`)
  and exit-code assertions — upgrading one-shot proof beats into a
  repeatable bench.
- **Suite D — Explain grading (phase 2, credits-gated).** Rubric-scored
  `--explain` outputs (one-line fix present, no hallucinated terms,
  correct fix direction) judged by capped Spark/Wonder calls; offline
  rubric on mocked fetch until credits land.

**Loop mechanics.** A `tools/loops/` driver runs suite × provider
matrices: fixture mode by default; live mode per provider
(`--provider custom --base-url` Baseten/Modal, `--provider fireworks`
when its key exists), with explicit `--cap-calls`, `--cap-tokens`, and
`--cap-usd` flags enforced before the first network touch (fail fast,
exit 2 like existing usage errors). Runs are sequential by default
(rate-limit friendly), cancellable by killing the driver process (per-run
NDJSON is flushed per rule, so partial spend is never lost), and each loop
emits one summary artefact (caught/FP/unknowns per rule × surface,
tokens, $ from invoices only — never estimated).

**Promotion rules (how loops become upgrades).** Attack miss → triage
against the rule source: true gap = rule fix + corpus TP (must pass);
intended pass = corpus TN pinning the boundary. Benign FP → rule fix +
TN. Refusals and model prose are never corpus cases. Baseline regen is
reviewed before commit; corpus additions without a failing-then-passing
story don't land.

**Assumptions (reversible):** branch `eval/benchmark-loops`; this doc at
`docs/plans/2026-10-27-plan-eval-benchmarks.md`; Suites A–C core scope,
D phase 2.

## Steps

1. **Branch + plan doc.** This commit: charter + scoreboard template
   (results table: suite × rule × provider × date, catch/FP/tokens).
2. **Suite A fixtures.** ≥6 hostile fixtures per rule (66+) in
   `tests/benches/hostile/` + runner wiring into `tools/eval.ts`
   (`--bench hostile`), each asserted caught on ≥1 real surface; corpus
   TPs for true gaps, with rule fixes where a gap is real.
3. **Suite B budgets.** Benign set ≥10 per rule; per-rule FP ceilings +
   unknown ceiling in `compareBaseline`; `--check` fails on breach.
4. **Suite C replay.** `demo/CUES.md` beats as an automated scenario
   bench (packed CLI, scratch repos, timing budgets, exit codes);
   `demo/` untouched.
5. **Loop driver (fixture-first).** `tools/loops/` with cap flags,
   sequential provider rotation (Baseten → Modal → Fireworks), per-rule
   artefact flushing, `--dry-run` printing the exact call plan +
   worst-case token spend without network or keys.
6. **Live wiring (credits-gated).** Provider profiles in the driver
   (Baseten endpoint + `muse-spark-open-1026`; Modal endpoint +
   `Muse-Spark-Open-816B-A42B`, Bearer `<id>.<secret>`; Fireworks
   env-gated stub), refusal-rate reporting so refused loops *say* so.
7. **Promotion automation.** `--fold` drafting corpus case JSON from
   triaged misses/FPs (fragmented `contentParts`, reviewed first).
8. **Suite D grading (phase 2).** Rubric scorer over `--explain` outputs
   (mocked-fetch tests first; live judging caps + credits only).

## Validation Plan

- `bunx tsc --noEmit`, `bun run validate`, `bun run build` green per unit.
- `bun test` green incl. new bench tests; `--check` breach demo (flip a
  benign case to firing → exit 1) as negative control.
- Loop `--dry-run` prints capped plan; capped-out loop stops with exit 2
  and zero network beyond the cap.
- First live loop (credits confirmed): one rule × one provider smoke
  artefacts in `tools/out/`; dashboard $ checked before matrices.

## Risks

- Provider refusal is the dominant confounder (10/11 hostile briefs
  refused on both providers measured Oct 27): hostile breadth is
  hand-written; loop reports distinguish refused/compliant/evaluated.
- Spend governance: Modal strict $30-credits; Baseten carries volume
  ($100, 2M TPM); Fireworks stubbed until a key exists.
- Baseline churn: reviewed-diff discipline on every fold-in.
