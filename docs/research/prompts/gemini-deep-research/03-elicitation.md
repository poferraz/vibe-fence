# GEMINI DEEP RESEARCH PROMPT — 03/06 — Elicitation & Synthesis Patterns

> Copy everything below the line into Gemini Deep Research.

---

**Project:** vibe-fence — a drop-in harness for non-technical vibe-coders. Core design hypothesis: instead of asking the LLM once, the harness internally runs richer elicitation (multi-sample, self-critique, synthesis) and shows the user a single clean answer. The harness absorbs the cost/complexity; the user sees one good result. Research is Phase 0; scaffold is Phase 1; this is one of 6 parallel streams.

**Your task — Stream 03: Which Elicitation & Synthesis Patterns Genuinely Beat Single-Pass?**

Research which interaction patterns improve LLM answer quality, when, and at what cost:

**A) Multi-sample patterns:**
self-consistency (Wang et al. 2022), best-of-N / majority vote, pass@k — where sampling + voting helps vs wastes tokens.

**B) Critique & refinement:**
self-refine (Madaan et al.), reflexion (Shinn et al.), LLM-as-judge / LLM-as-a-jury, constitutional critique / self-correction — when does asking the model to critique itself help vs hallucinate?

**C) Multi-agent patterns:**
multi-agent debate (Du et al. 2023), mixture-of-agents / MoA (Wang et al. 2024), role-played reviewers, mixture-of-thought — do "multiple personas arguing" actually outperform?

**D) Synthesis prompts:**
The pattern "produce N candidates → critique each → synthesize one final" — when does this beat single-pass? What N is enough? Is structured synthesis different from just re-asking?

**E) Cost / latency tradeoffs:**
Token overhead, latency, diminishing returns, task-type dependence (reasoning vs creative vs factual vs code). Which gains are worth 2×, 5× tokens?

**F) Internal vs visible:**
Which patterns should a harness run *silently* (user sees one answer) vs expose to the user as a deliberation trace?

For **each pattern**, fill:

| Field | Capture |
|---|---|
| Pattern | Name + 1-line description |
| Paper / source | ArXiv ID or URL + date accessed |
| Task types where it helps | e.g. reasoning, planning, creative, factual, code |
| Measured gain | Reported metric delta (accuracy, win-rate, etc.) |
| Cost | Tokens / latency overhead |
| Strength | `proven` / `practiced` / `contested` |
| Fit for vibe-fence | Silent-internal? User-visible? Conditional? Skip? |

**Requirements:**
- At least half your patterns must cite an ArXiv paper or peer-reviewed source — blog folklore alone is insufficient.
- Be critical: note where gains are small, task-specific, or contested. Don't hype every pattern.
- Vibe-fence serves non-technical users who won't tolerate 5× latency for 2% gain — rank patterns by *value* (gain per cost), not just gain.
- Cite everything with paper ID or URL + date. Tag strength honestly.
- End with **"Implications for vibe-fence"** — numbered, actionable, including a ranked shortlist of which patterns vibe-fence should use internally and which to skip.

**Output shape:**
Header → Findings (one subsection per pattern) → Comparative ranking (which patterns win, when) → Gaps / unknowns → Sources table → Implications for vibe-fence (numbered, ranked).
