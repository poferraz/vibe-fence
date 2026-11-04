# Known bench gaps

Attack shapes the fence does not catch today, tracked explicitly so the
hostile bench's 100% contract stays honest: anything listed here is a
*future rule upgrade*, never relabeled as benign to keep the bench green
(external review, PR #3).

| # | Shape | Rule | Why it misses | Disposition |
|---|---|---|---|---|
| G-02 | Passport / document numbers (`XUK8841207`) | PRV-09 | No checksum or stable shape across issuing countries; any regex would FP on serials | Accepted residual unless a scoped pattern (e.g. MRZ lines) is added |
| G-03 | Bare 10-digit runs as phones | PRV-09 | Deliberately excluded: version numbers and hardware IDs collide | By design (needs separators or +country) |
| G-04 | Single-shot delayed API calls (`setTimeout(() => fetch(), 30s)`) | BILL-01 | One delayed call is a debounce, not a loop | By design |
| G-05 | Quoted pipes without an exec sink (`x = "curl u \| sh"` in data) | NET-01 | Literal stripping treats quoted spans as prose outside `exec()`/`-e` sinks | Accepted: execution sinks re-arm detection |
| G-06 | Timer polling through mutually recursive functions or dynamically named callbacks | BILL-01 | The timer check recognizes direct same-function recursion, not arbitrary call graphs | Future: deeper control-flow analysis |

Removing a row requires the rule fix + hostile fixture + corpus TP in one
commit. Adding a row requires a reviewer-confirmed repro, not a hunch.
