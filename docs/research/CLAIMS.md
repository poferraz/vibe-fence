# Claim inventory

What the project claims, where each claim comes from, and how much support it
actually has. Primary pages were fetched on 2026-10-30 where a link is given.

Status values:

- **supported** — reproducible in this repository (code + test) or confirmed on
  the primary page.
- **project decision** — chosen by this project; research informs it but does
  not establish it.
- **unverified** — plausible but not re-checked against a primary source in
  this pass.
- **corrected** — previously stated wrongly; fixed in this revision.

This is not a full bibliography audit. Eleven high-impact claims were checked;
the remaining `SOURCES.md` entries were not individually re-verified. Treat
uncited numbers in older synthesis documents as leads, not evidence.

| # | Claim | Where it appears | Primary source / code evidence | Status |
|---|---|---|---|---|
| 1 | Keep the `AGENTS.md` router at ≤400 tokens; retrieval-gated, not always-on | `AGENTS.md`, S-01, `tools/validate.ts` | arXiv:2602.11988v3 (12 Feb 2026, rev. 29 Sep 2026): context files do not generally improve task success while raising inference cost **over 20% on average**; repository overviews are not helpful; instructions are well followed. The paper does **not** establish a 400-token threshold | **project decision** (paper supports the direction, not the number) |
| 2 | "Environment variables are the only credential store" | `docs/research/synthesis/04-guardrails.md` A-01 | OWASP Secrets Management Cheat Sheet: centralized secret stores, cloud KMS/HSM, file and in-memory injection, dynamic credentials, rotation and least privilege. Env vars are one delivery mechanism with their own exposure surface | **corrected** |
| 3 | Rule-count joint reliability decays as p^n (~2 rules @95%, ~5 @80%) | `docs/research/synthesis/FINAL-v4.md` principle 2 | Arithmetic of an assumed-independent model. No measurement, and rule failures are plausibly correlated (one noisy pattern can trip several rules) | **corrected** to an illustrative model |
| 4 | Anthropic, *Trustworthy agents in practice*, dated 2025 | `docs/research/SOURCES.md` #6 | Page dated **2026-04-09** (verified 2026-10-30; page content and mirrored date metadata agree) | **corrected** |
| 5 | Tiered protection: enforced via host hooks, guarded via `check` + Git hooks, advisory via briefing files | `README.md`, `docs/project/PRODUCT-DIRECTION.md` | `src/adapters/*`, `src/framework/gate.ts`, `src/framework/git-hooks.ts`, `src/check.ts`. Host execution is **not** verified end-to-end; hooks can fail open (disclosed in the README table) | **supported as design; enforcement unverified per host** |
| 6 | Eleven safety rules ship, each with a test file | `src/rules/index.ts` | `REGISTRY` has 11 entries; every rule has a `*.test.ts`; scans run through one shared loop | **supported** |
| 7 | Hostile bench: 11 rule benches, ≥6 labelled attack shapes each, all caught on a real surface | `tests/benches/hostile.test.ts` | Test asserts 11 benches, ≥6 cases each, every case `caught`, and a cold control not caught | **supported** (for the listed shapes only) |
| 8 | Benign bench: ≥10 legitimate shapes per rule with zero false positives | `tests/benches/benign.test.ts` | Test asserts 11 benches, ≥10 cases each, no firing and no scorer error | **supported within the fixture set** |
| 9 | Held-out corpus: 34 positives / 34 negatives, 1 unknown, floors enforced | `tests/evals/corpus.json`, `baseline.json`, `tools/eval.ts` | `bun run eval --check` passes with coverage floors and an unknown ceiling; corpus is small and hand-built | **supported; not a general-world rate** |
| 10 | `--explain` is wired to Meta Spark and fails open without a key | `src/framework/explain.ts`, `explain.test.ts` | 7 contract tests with a mocked transport (prompt shape, one call, cap, error path); one live probe recorded 2026-10-26. No live call is part of any gate | **supported (mocked); one historical live probe** |
| 11 | Git hooks block a leaky commit and a leak-then-fix push | `src/framework/git-hooks.ts`, `tests/proof-beats.test.ts` | End-to-end tests plus a packed-CLI scratch run; hook execution depends on `core.hooksPath`, which is reported rather than silently changed | **supported on this machine** |
| 12 | Permission prompts are a weak boundary (93% acceptance; ~1-in-3 miss on 409,000 decisions) | `docs/research/synthesis/05-companion-ux.md` A-06 | Secondary summaries in the synthesis; primary sources were not re-fetched in this pass | **unverified** |
| 13 | Meta model IDs and routing (Spark 1.3 via `/v1/responses`) | `README.md`, `src/framework/meta-client.ts` | Live probe recorded 2026-10-26; provider docs not re-checked in this pass | **historical live evidence; provider docs unverified** |

## How to use this page

- A claim marked **project decision** is legitimate as a product choice; do not
  present it as a research result.
- A claim marked **unverified** must be checked before it justifies a feature,
  a public promise, or a paid run.
- Corrections here are also applied to the cited documents, keeping their
  citation IDs stable.

## Coverage

| Pass | Scope | Result |
|---|---|---|
| 2026-10-30 | 11 high-impact claims (rows 1–11) + provider/prompt rows flagged | 3 corrections (rows 2, 3, 4), 1 relabelled contract (row 1), 2 unverified (rows 12–13) |
| Not yet done | Remaining `SOURCES.md` entries (186 total) | Not individually re-verified; do not claim full coverage |
