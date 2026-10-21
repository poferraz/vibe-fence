# Research Prompt — Stream 02: Harness → Output Quality

> **Hand this entire prompt to a model. It is self-contained.**

---

You are a research agent for **vibe-fence** — a drop-in harness that wraps any AI coding agent to make vibe-coding safe for non-technical people. The harness works by injecting files, prompts, and structure into whatever agent the user already uses.

## Your Assignment — Stream 02: How Harness Design Causally Improves LLM Output

Non-technical users type vague prompts. The harness must compensate. Research **how** specific harness mechanisms improve what the LLM produces:

- **Prompt/file structure effects:** instruction hierarchy, system vs developer vs user prompts, `AGENTS.md` / `SKILL.md` / `.cursorrules` as persistent memory, one-fact-one-location, docs-as-routing
- **Context engineering:** selective loading, Read→Think→Write→Check loops, adapter-constrained context windows, context budgeting vs bloat
- **Harness post-mortems:** Archestra, Anthropic's harness work, Claude Code / Codex / Cursor engineering blogs — what did they learn about harness influence?
- **Failure modes of bad harnesses:** over-constraining, stale context, prompt injection surface, learned helplessness

For each mechanism, capture:

| Field | What to capture |
|-------|-----------------|
| Mechanism | What the harness does (e.g. "injects a routing INDEX.md") |
| Causal claim | How it changes LLM behavior (e.g. "reduces wasted file reads by X") |
| Evidence | Paper, eval, engineering blog, or measured anecdote — with URL/ID |
| Strength | `proven` / `practiced` / `contested` |
| Transfer to vibe-fence | Should we use it? How? |

## Requirements

1. Search ArXiv, Anthropic/OpenAI/Meta engineering blogs, and practitioner reports. Prefer primary sources.
2. Cite every causal claim. Distinguish measured results from folklore.
3. If a claim is contested, present both sides.
4. End with **Implications for vibe-fence** — numbered, actionable (copy / avoid / invent).

## Where to Save

```
docs/research/contributors/<your-model-id>/02-harness-influence.md
```

- `<your-model-id>` = `<provider>-<model>-<YYYY-MM-DD>` lowercase, hyphens only
- If that folder doesn't exist, create it and add `manifest.json`:

```json
{
  "model": "your-model-name",
  "provider": "how you were accessed",
  "date": "YYYY-MM-DD",
  "streams_completed": ["02"],
  "streams_skipped": [],
  "notes": ""
}
```

## Output Shape

```
- Model / Provider / Date / Stream header
- Findings (one subsection per mechanism)
- Gaps / unknowns
- Sources table
- Implications for vibe-fence (numbered)
```

Do not write to any other stream file. Do not edit files outside your contributor folder.
