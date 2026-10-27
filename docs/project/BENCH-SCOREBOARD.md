# Bench scoreboard

Running results of eval/test/benchmark loops (branch `eval/benchmark-loops`).
Raw artefacts live in `tools/out/` (gitignored); this table is the
committed summary. `$` is filled from provider invoices only — never
estimated. Refused = provider declined the hostile brief (not a bench
result).

| Date | Suite | Provider | Model | Rules | Caught/FP | Refused | Tokens | $ | Notes |
|---|---|---|---|---|---|---|---|---|---|

## Reading the numbers

- **Caught** (attack): variants blocked on ≥1 real surface (gate legs or
  `runCheck` tree scan). **FP** (benign): benign variants that fired —
  must stay at budget (see `compareBaseline` ceilings).
- A loop of refusals reports `refused`, never a fake 0% catch rate.
- Every non-refused miss/FP is triaged before the next loop: true gap →
  rule fix + corpus case; intended pass → TN pinning the boundary.
