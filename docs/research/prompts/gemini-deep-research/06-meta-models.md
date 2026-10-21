# GEMINI DEEP RESEARCH PROMPT — 06/06 — Meta Models (Hackathon Integration)

> Copy everything below the line into Gemini Deep Research.

---

**Project:** vibe-fence — a harness submitted to the **Meta Global AI Developer Hackathon** (Oct 26–Nov 4, 2026, 10 days, $1M pool). Tracks: Indie (creativity + technical ambition, judged on "does it work") vs Startup (production readiness). Themes: *Build for Your World* (solve a real domain problem) / *Push the Frontier* (give machines new capabilities). vibe-fence is Indie track, *Build for Your World*: "make vibe-coding safe for everyone." Details: https://cerebralvalley.ai/e/meta-ai-developer-hackathon

**Available models for the hackathon:** Muse Spark series (flagship text), Muse Image, SAM 3.1 via Meta Model API + open-weights via Baseten/Modal/Fireworks (with credits) + Muse Code agentic coding agent. Research is Phase 0; scaffold is Phase 1; this is one of 6 parallel streams.

**Your task — Stream 06: How Should vibe-fence Integrate Meta's Models to Maximize Hackathon Scoring AND Real Product Value?**

Research each model and how it fits the harness:

**A) Muse Spark series (flagship text model):**
Capabilities, context window, tool-use / function-calling quality, strengths vs Claude/GPT/Gemini, API shape (Meta Model API — endpoint, auth, rate limits), known limits and failure modes. How could Spark act as the "companion voice" inside vibe-fence (explaining, teaching, narrating the safety net)?

**B) Muse Image:**
Capabilities, prompt patterns, strengths/limits, API shape. Where does image generation help a *coding harness*? (e.g. asset generation for scaffolded projects, UI mockups, onboarding illustrations) — and where is it a stretch?

**C) SAM 3.1 (Segment Anything):**
Capabilities, what it segments and how, API shape. Be honest: does segmentation help a code harness at all? If the fit is weak, say so and propose the minimal credible use that still scores hackathon points (e.g. screenshot → segment → code).

**D) Muse Code (agentic coding agent):**
What it does, how it compares to Codex/Claude Code, and how vibe-fence relates: vibe-fence is a *harness for any agent* — including Muse Code. Complementary, not competing. How to demo them together?

**E) Open-weights path:**
Baseten / Modal / Fireworks credits for self-hosted Meta open-weights models — relevant for offline or cost-sensitive harness features (local guard checks, pre-commit hooks that call a small model).

**F) Winning hackathon patterns:**
What wins Meta and general AI hackathons? Live workshop leverage, model-centric demo structure, eval storytelling, prior winners if findable. What do judges reward?

For **each model / integration point**, fill:

| Field | Capture |
|---|---|
| Model | Spark / Image / SAM 3.1 / Code / open-weights |
| Capability relevant to vibe-fence | What it can do for the harness |
| Companion role | How it acts as the "voice" or capability inside the fence |
| API surface | Endpoint, auth, limits — with URL + date accessed (if public) |
| Scoring leverage | How using it helps the hackathon submission specifically |
| Strength | `proven` / `practiced` / `contested` |

**Requirements:**
- Use official Meta sources (Meta AI docs, Model API docs, hackathon + partner pages: Baseten/Modal/Fireworks) plus community reports. Cite each capability with URL.
- Be honest about poor fit — if SAM 3.1 barely helps a code harness, say so and suggest the thinnest credible integration rather than inventing a use case.
- Propose a concrete integration plan: which model does what inside vibe-fence, what the live demo shows, and how it maps to judging criteria.
- End with **"Implications for vibe-fence"** — numbered, actionable, with integration priorities (what to build first for max scoring) and a one-paragraph demo narrative.

**Output shape:**
Header → Findings grouped by model (Spark / Image / SAM 3.1 / Code / Open-weights / Winning Patterns) → Gaps / unknowns → Sources table → Implications for vibe-fence (numbered, with integration plan + demo narrative).
