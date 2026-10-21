# Research Prompt — Stream 06: Meta Models (Hackathon Integration)

> **Hand this entire prompt to a model. It is self-contained.**

---

You are a research agent for **vibe-fence**, which will be submitted to the **Meta Global AI Developer Hackathon** (Oct 26–Nov 4, 2026, $1M pool).

## Hackathon Context

- **Tracks:** Indie (creativity + technical ambition) vs Startup (production readiness)
- **Themes:** *Build for Your World* (solve a real domain problem) / *Push the Frontier* (give machines new capabilities)
- **Models available:** **Muse Spark series**, **Muse Image**, **SAM 3.1** via Meta Model API + open-weights via Baseten/Modal/Fireworks + **Muse Code** agentic coding agent
- **vibe-fence angle:** Indie track, *Build for Your World* — "make vibe-coding safe for everyone"
- Details: https://cerebralvalley.ai/e/meta-ai-developer-hackathon

## Your Assignment — Stream 06: Meta Models Integration

Research **how vibe-fence should integrate Meta's models** to maximize both hackathon scoring and real product value:

- **Muse Spark series:** capabilities, context window, tool-use / function-calling, strengths vs Claude/GPT/Gemini, API shape (Meta Model API), known limits
- **Muse Image:** capabilities, prompt patterns, use inside a dev tool (e.g. asset generation, UI mockups)
- **SAM 3.1:** capabilities, where segmentation helps a coding harness (if at all — be honest about fit)
- **Muse Code:** what it does, how vibe-fence relates vs competes (complementary harness *for* any agent, including Muse Code)
- **Open-weights path:** Baseten/Modal/Fireworks credits for self-hosted Meta models — relevant for offline or cost-sensitive harness features
- **Winning hackathon patterns:** what wins Meta/AI hackathons — live workshops, model-centric demos, eval stories — cite prior winners if findable

For each model/integration point, capture:

| Field | What to capture |
|-------|-----------------|
| Model | Spark / Image / SAM 3.1 / Code / open-weights |
| Capability relevant to vibe-fence | What it can do for the harness |
| Companion role | How Spark (or others) acts as the "companion voice" inside the fence |
| API surface | Endpoint, auth, limits — with URL + date accessed |
| Scoring leverage | How using it helps the hackathon submission |
| Strength | `proven` / `practiced` / `contested` |

## Requirements

1. Use official Meta sources (Meta AI docs, Model API docs, hackathon partner pages) plus community reports. Cite each capability.
2. Be honest about poor fit — if SAM 3.1 doesn't help a code harness, say so and suggest the minimal credible use.
3. Propose a concrete integration plan: which model does what inside vibe-fence, and what the demo shows.
4. End with **Implications for vibe-fence** — numbered, actionable, with integration priorities.

## Where to Save

```
docs/research/contributors/<your-model-id>/06-meta-models.md
```

- `<your-model-id>` = `<provider>-<model>-<YYYY-MM-DD>` lowercase, hyphens only
- If that folder doesn't exist, create it and add `manifest.json`:

```json
{
  "model": "your-model-name",
  "provider": "how you were accessed",
  "date": "YYYY-MM-DD",
  "streams_completed": ["06"],
  "streams_skipped": [],
  "notes": ""
}
```

## Output Shape

```
- Model / Provider / Date / Stream header
- Findings grouped by model (Spark / Image / SAM 3.1 / Code / Winning Patterns)
- Gaps / unknowns
- Sources table
- Implications for vibe-fence (numbered, with integration plan)
```

Do not write to any other stream file. Do not edit files outside your contributor folder.
