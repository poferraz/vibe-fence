# GEMINI DEEP RESEARCH PROMPT — 02/06 — How Harness Design Improves LLM Output

> Copy everything below the line into Gemini Deep Research.

---

**Project:** vibe-fence — a drop-in harness that wraps any AI coding agent to make vibe-coding safe for non-technical people. Non-technical users type vague prompts; the harness must compensate via files, prompts, and structure injected into whatever agent they use. Research is Phase 0; scaffold is Phase 1; this is one of 6 parallel streams.

**Your task — Stream 02: How Harness Design Causally Improves What the LLM Produces.**

Research the causal mechanisms by which scaffolding changes LLM behavior. Cover:

**A) Prompt / file structure effects:**
Instruction hierarchy (system vs developer vs user vs tool prompts), persistent file memory (AGENTS.md / SKILL.md / .cursorrules / MDC), one-fact-one-location, docs-as-routing (INDEX.md routing pattern), and any measured effects of file scaffolding vs pure chat history.

**B) Context engineering:**
Selective / lazy loading, Read→Think→Write→Check loops, adapter-constrained context windows, context budgeting vs bloat, token-window management techniques — what actually moves the needle on output quality vs folklore?

**C) Harness post-mortems:**
Archestra, Anthropic's harnesses (Claude Code internals where public), Codex / Cursor engineering blogs, any published evals or ablations on harness vs no-harness.

**D) Failure modes of bad harnesses:**
Over-constraining, stale context, prompt-injection surface introduced by the harness itself, learned helplessness, context-window pollution — how can a harness make things worse?

For **each mechanism**, fill:

| Field | Capture |
|---|---|
| Mechanism | What the harness does (e.g. "injects a routing INDEX.md") |
| Causal claim | How it changes LLM behavior (e.g. "reduces wasted file reads") |
| Evidence | Paper, eval, engineering blog, or measured anecdote — with URL/ID |
| Strength | `proven` / `practiced` / `contested` |
| Transfer to vibe-fence | Should we use it? How? |

**Requirements:**
- Prefer primary sources: ArXiv, Anthropic/OpenAI/Meta engineering blogs, published evals/ablations. Distinguish measured results from folklore.
- If a claim is contested, present both sides.
- Cite every causal claim with URL or paper ID.
- End with **"Implications for vibe-fence"** — numbered, actionable (copy / avoid / invent). Rank levers by impact.

**Output shape:**
Header → Findings (one subsection per mechanism) → Gaps / unknowns → Sources table → Implications for vibe-fence (numbered).
