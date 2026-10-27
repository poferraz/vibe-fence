# Bench scoreboard

Running results of eval/test/benchmark loops (branch `eval/benchmark-loops`).
Raw artefacts live in `tools/out/` (gitignored); this table is the
committed summary. `$` is filled from provider invoices only — never
estimated. Refused = provider declined the hostile brief (not a bench
result).

| Date | Suite | Provider | Model | Rules | Caught/FP | Refused | Tokens | $ | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 2026-10-27 | redteam | Baseten | muse-spark-open-1026 | 11×2 | SEC-01 atk 5/6; benign 0/66 FP | 10/11 atk | ~30K | cents | Artefacts tools/out/2026-10-27-baseten-* (gitignored); misses → s01-f6/f8 |
| 2026-10-27 | redteam probe | Modal | Muse-Spark-Open-816B-A42B | 3×1 | 1/1 weak catch | 16/17 | ~3.6K | $0.01 | Paid attack STOPPED: refusal-bound, not budget-bound |
| 2026-10-27 | A hostile | fixture | — | 11 | 66/66 | — | 0 | $0 | Bench green after 6 rule upgrades (commit 7361b22) |
| 2026-10-27 | B benign | fixture | — | 11 | 0/110 FP | — | 0 | $0 | Sole FP adjudicated as SUP-01 Half-B contract |
| 2026-10-27 | C scenario | fixture (packed CLI) | — | beats 0-7 | pass 2.4s | — | 0 | $0 | tests/benches/scenario.test.ts |
| 2026-10-27 | driver smoke | Baseten | muse-spark-open-1026 | SEC-01 atk | 1/6 (prose variants) | ~0/6 | ~2K | cents | Via tools/loops/run.ts; model variance noted |

## Reading the numbers

- **Caught** (attack): variants blocked on ≥1 real surface (gate legs or
  `runCheck` tree scan). **FP** (benign): benign variants that fired —
  must stay at budget (see `compareBaseline` ceilings).
- A loop of refusals reports `refused`, never a fake 0% catch rate.
- Every non-refused miss/FP is triaged before the next loop: true gap →
  rule fix + corpus case; intended pass → TN pinning the boundary.
