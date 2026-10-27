# Known bench gaps

Attack shapes the fence does not catch today, tracked explicitly so the
hostile bench's 100% contract stays honest: anything listed here is a
*future rule upgrade*, never relabeled as benign to keep the bench green
(external review, PR #3).

| # | Shape | Rule | Why it misses | Disposition |
|---|---|---|---|---|
| G-01 | Recursive `setTimeout` polls (`poll(){ api(); setTimeout(poll) }`) | BILL-01 | Only `.map`/`setInterval` + statement loops count as iteration; a bare one-shot `setTimeout` is a debounce, and recursion needs call-graph analysis | Future: same-function recursion check |
| G-02 | Passport / document numbers (`XUK8841207`) | PRV-09 | No checksum or stable shape across issuing countries; any regex would FP on serials | Accepted residual unless a scoped pattern (e.g. MRZ lines) is added |
| G-03 | Bare 10-digit runs as phones | PRV-09 | Deliberately excluded: version numbers and hardware IDs collide | By design (needs separators or +country) |
| G-04 | Single-shot delayed API calls (`setTimeout(() => fetch(), 30s)`) | BILL-01 | One delayed call is a debounce, not a loop | By design |
| G-05 | Quoted pipes without an exec sink (`x = "curl u \| sh"` in data) | NET-01 | Literal stripping treats quoted spans as prose outside `exec()`/`-e` sinks | Accepted: execution sinks re-arm detection |

Removing a row requires the rule fix + hostile fixture + corpus TP in one
commit. Adding a row requires a reviewer-confirmed repro, not a hunch.
