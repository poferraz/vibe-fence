# Research Prompt — Stream 03: Elicitation & Synthesis Patterns

> **Hand this entire prompt to a model. It is self-contained.**

---

You are a research agent for **vibe-fence** — a drop-in harness for non-technical vibe-coders. One design idea: instead of asking the LLM once, the harness internally runs richer elicitation (multi-sample, self-critique, synthesis) and shows the user a single clean answer.

## Your Assignment — Stream 03: Elicitation & Synthesis Patterns

Research **which interaction patterns genuinely yield better LLM answers** and when each is worth its cost:

- **Multi-sample patterns:** self-consistency (Wang et al.), best-of-N, majority vote
- **Critique & refinement:** self-refine, reflexion, LLM-as-judge, constitutional critique
- **Multi-agent patterns:** debate (Du et al.), mixture-of-agents (MoA), role-played reviewers
- **Synthesis prompts:** "produce 5 candidates, critique each, synthesize one final" — when does this beat single-pass?
- **Cost/latency tradeoffs:** token overhead, latency, diminishing returns, task-type dependence
- **Internal vs visible:** which patterns should the harness run silently (user sees one answer) vs expose to the user?

For each pattern, capture:

| Field | What to capture |
|-------|-----------------|
| Pattern | Name + 1-line description |
| Paper / source | ArXiv ID or URL, with date accessed |
| Task types where it helps | e.g. reasoning, planning, creative, factual |
| Measured gain | Reported metric delta (accuracy, win-rate, etc.) |
| Cost | Tokens / latency overhead |
| Strength | `proven` / `practiced` / `contested` |
| Fit for vibe-fence | Silent-internal? User-visible? Conditional? |

## Requirements

1. **Ground in papers** — at least half your patterns must cite an ArXiv paper or peer-reviewed source. Blog folklore alone is insufficient.
2. **Be critical** — note where gains are small, task-specific, or contested. Don't hype every pattern.
3. **Cost awareness** — vibe-fence serves non-technical users who won't tolerate 5× latency for a 2% gain. Rank patterns by value.
4. Cite everything. End with **Implications for vibe-fence** — numbered, actionable.

## Where to Save

```
docs/research/contributors/<your-model-id>/03-elicitation.md
```

- `<your-model-id>` = `<provider>-<model>-<YYYY-MM-DD>` lowercase, hyphens only
- If that folder doesn't exist, create it and add `manifest.json`:

```json
{
  "model": "your-model-name",
  "provider": "how you were accessed",
  "date": "YYYY-MM-DD",
  "streams_completed": ["03"],
  "streams_skipped": [],
  "notes": ""
}
```

## Output Shape

```
- Model / Provider / Date / Stream header
- Findings (one subsection per pattern)
- Comparative ranking (which patterns win, when)
- Gaps / unknowns
- Sources table
- Implications for vibe-fence (numbered)
```

Do not write to any other stream file. Do not edit files outside your contributor folder.
