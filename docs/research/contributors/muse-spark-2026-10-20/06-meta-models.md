# Stream 06 — Meta Models for Hackathon Integration

> **Model:** muse-spark · **Provider:** Meta via Hermes (ollama-launch) · **Date:** 2026-10-20 · **Stream:** 06

---

## 1. Muse Spark Series — The Companion Brain

### Capabilities (all versions share this foundation)

Muse Spark is Meta's frontier multimodal reasoning + agentic model family, served exclusively through the **Meta Model API** (`https://api.meta.ai/v1`) [ai.meta.com, Oct 2026]. Key specs:

| Property | Value |
|---|---|
| **Context window** | **1,048,576 tokens** (1 M) — all versions |
| **Input modalities** | Text, image, video, audio, PDF |
| **Output** | Text (with structured output + reasoning) |
| **Tool use** | Parallel tool calling, streamed tool-call arguments, reasoning carries across turns; zero-shot generalization to new MCP servers/custom skills |
| **Built-in tools** | `web_search` (live cited search, no retrieval stack needed), `image_generation` |
| **API compatibility** | Drop-in OpenAI-compatible (Chat Completions + Responses API) and Anthropic Messages format |
| **Compaction** | Active context management — remembers actions, compacts to keep critical steps |

**Versions:**

| Version | Tag | Notes |
|---|---|---|
| Spark 1.1 | `muse-spark-1.1` | Multimodal reasoning flagship; Standard mode only |
| Spark 1.2 | `muse-spark-1.2` | Coding-optimized update over 1.1; multi-file refactors, long debugging |
| Spark 1.3 | `muse-spark-1.3` | Latest, "Recommended for new work"; frontier reasoning + agentic workflows; supports `reasoning_effort: "max"` |

> Spark 1.3 is explicitly marked "Recommended for new work" on dev.meta.ai [dev.meta.ai/docs/models, accessed 2026-10-20].

### Companion Role for vibe-fence

Spark is the **primary companion voice** — the harness's brain. Concrete roles:

- **Plan generation & critique:** Decompose user intent into `AGENTS.md`-scoped tasks; critique plans (grill-style) before execution.
- **Teaching dial:** Generate explanations at max/med/min/silent levels grounded in the actual codebase (not generic advice), leveraging the 1 M context to hold the whole project.
- **Issue queue intelligence:** Classify findings as block/warn/nudge, draft `issue → solution → plan` entries that the underlying agent (Codex, Claude, etc.) resolves autonomously.
- **Computer-use / visual-to-code:** Screenshot → code artifact generation (inspect a vibe-coded app's screenshot, propose fixes) — Spark 1.1+ perception strength.

**Strength:** `practiced` — Spark's 1 M context, parallel tool calling, and agentic training are documented and broadly reported; frontend/visual-to-code quality described as top-tier. Benchmark claims should be verified against independent evals.

### API Surface

| Field | Value |
|---|---|
| **Base URL** | `https://api.meta.ai/v1` |
| **Auth** | Bearer token (`MODEL_API_KEY` from dev.meta.ai) |
| **Endpoints** | `POST /v1/chat/completions` (stateless), `POST /v1/responses` (stateful via `previous_response_id` + built-in tools), `POST /v1/responses` background |
| **Model IDs** | `muse-spark-1.1`, `muse-spark-1.2`, `muse-spark-1.3`, plus `-contributor` variants |
| **Pricing (Standard)** | $1.25 / 1 M input, $0.15 / 1 M cached input, $4.25 / 1 M output |
| **Pricing (Contributor)** | $0.10 / 1 M input, $0.002 / 1 M cached, $0.20 / 1 M output — dramatically cheaper |
| **Rate limits (Standard)** | 3,000 RPM / 4,000,000 TPM per team |
| **Rate limits (Contributor)** | 150 RPM / 3,000,000 TPM per team |
| **SDK** | OpenAI SDK (set `base_url`), Anthropic SDK via Messages format; `pip install -e .` style agentic SDKs work |

Sources: [dev.meta.ai/docs/pricing-rate-limits](https://dev.meta.ai/docs/pricing-rate-limits), [dev.meta.ai/docs/models](https://dev.meta.ai/docs/models), [dev.meta.ai/docs/overview](https://dev.meta.ai/docs/overview.md) — all accessed 2026-10-20.

### Scoring Leverage (25% — Use of Meta AI Tooling)

- Spark is the **highest-leverage single integration**: judges' "beyond basic integration" and "unexpected capabilities" criteria are satisfied by agentic harness use (not a simple chatbot wrapper). Use Spark as the reasoning agent *inside* a dev tool — that is the unexpected surface.
- **Contributor mode** (`muse-spark-1.3-contributor` at $0.10/$0.20 per 1 M) is ~12× cheaper — ideal for hackathon volume; mention it explicitly in the submission to signal cost-awareness.
- Pair with `web_search` built-in tool to ground guardrail explanations in live docs (OWASP, framework docs) with citations — a differentiator vs generic advice.

---

## 2. Muse Image — The Asset Generator

### Capabilities

| Property | Value |
|---|---|
| **Model ID** | `muse-image-1.0` |
| **Input** | Text prompt + optional reference images (interleaved) |
| **Output** | Image (base64 or signed URL), up to 1600 px |
| **Modes** | Generate (text→image), Edit (image + instruction → edited image), Compose (multi-image → single scene), Refine (conversational multi-turn) |
| **Reasoning** | Agentic: searches web for visual references, runs code to build layouts before rendering; thinks/plans before drawing |
| **Special** | Anchored composition (consistent character/style across a series), precise instruction scoping (changes only what was asked) |
| **Pricing** | **$0.01 / image** |
| **Rate limit** | 150 RPM per team |
| **Endpoints** | `POST /v1/images/generations`, `POST /v1/images/edits` (OpenAI-compatible single-shot); or `POST /v1/responses` conversational |

Source: [dev.meta.ai/resources/blog/build-with-muse-Image](https://dev.meta.ai/resources/blog/build-with-muse-Image), [dev.meta.ai/docs/image-generation](https://dev.meta.ai/docs/image-generation), pricing page — accessed 2026-10-20.

### Companion Role for vibe-fence

Secondary but real. Not core to safety/scoping/teaching, but valuable for:

- **Onboarding visuals:** Generate a project hero image / OG card from `AGENTS.md` description.
- **Before/after demo assets:** Auto-generate "fenced vs unfenced" comparison visuals for the landing page and video.
- **UI mockup generation:** For the demo app itself (the intentionally-bad vibe-coded project), generate a target mockup that the harness then helps the user achieve.
- **Teaching illustrations:** At `max` teaching level, generate a diagram explaining e.g. "what a secrets leak looks like" — memorable, shareable.

**Strength:** `practiced` — generation quality and reasoning-driven edits documented; anchored composition is distinctive.

### Scoring Leverage

- Low direct weight, but **demo polish amplifier** (25% Demo criterion rewards a working, impressive presentation; custom visuals signal craft).
- Using Muse Image *agentic* (web-grounded references, code-built layouts) rather than plain prompt→image demonstrates deeper use of Meta tooling.
- Cost is negligible ($0.01/image) — generate liberally for docs/video.

---

## 3. SAM 3.1 — The Honest Assessment

### Capabilities

SAM 3.1 is Meta's leading **perception** model for detection, segmentation, and tracking — not a language or reasoning model.

| Property | Value |
|---|---|
| **Model ID** | `sam-3.1` |
| **Input** | Text prompt (short noun phrase like "yellow school bus") + image (MP4/MOV video: H.264/H.265/MPEG-4) |
| **Output** | Boxes + pixel-precise masks per match; video tracking with identity preserved |
| **Key feature** | Zero-shot open-vocabulary detection; **object multiplexing** — up to 16 objects in one forward pass (32 fps on H100, 2× over SAM 3) |
| **Prompt modality (API)** | Text concepts only; visual prompts (boxes/points) are research-model only |
| **Base URL / Auth** | Same as Spark/Image (`api.meta.ai/v1`, Bearer token) |
| **Pricing** | **$2.50 / 1,000 images** or **$0.20 / 1,000 video frames** |
| **Rate limit** | 3,000 RPM per team |

Sources: [dev.meta.ai/models/sam-3-1](https://dev.meta.ai/models/sam-3-1), [ai.meta.com/blog/segment-anything-model-3/](https://ai.meta.com/blog/segment-anything-model-3/), [dev.meta.ai/docs/sam/overview](https://dev.meta.ai/docs/sam/overview) — accessed 2026-10-20.

### Companion Role — Poor Fit, Stated Plainly

**SAM 3.1 has no natural role inside a code harness.** It detects/segments visual objects; vibe-fence operates on files, git, dependencies, and teaching text. There is no "segment the codebase" metaphor that survives scrutiny — judges with vision backgrounds will penalize a forced integration.

**Strength:** `proven` for segmentation itself; `contested` (effectively negative) for relevance to vibe-fence.

### Minimal Credible Use (to clear the "used Meta tooling" bar without harm)

If the hackathon rubric's "Use of Meta AI Tooling" check is interpreted as breadth, include SAM 3.1 via one of these thin, honest integrations — each takes < 1 hour:

1. **Screenshot element locator (best option):** Screenshot the running demo app → SAM 3.1 segments UI elements (buttons, forms) → Spark reasons over the labeled regions to suggest accessibility or layout fixes. Narrative: *"Spark sees the app, SAM outlines what it sees."* This pairs Spark perception + SAM segmentation as Meta intends [dev.meta.ai/docs/sam/segmenting recommends Spark→SAM pipeline].
2. **Demo video analysis:** Feed the demo video to SAM 3.1 for object tracking; display as a "behind the scenes" visualization of what the app *could* do with video input — framed as future-work, not core feature.
3. **Skip it entirely:** The rubric weights "creativity beyond basic integration" — one deep Spark integration beats three shallow ones. Document the deliberate non-use as engineering judgment.

**Recommendation:** Option 1 (thin slice) if breadth helps scoring; otherwise skip and state why in the submission notes.

### Scoring Leverage

- Minimal on its own. SAM's value is **supporting evidence** that the team evaluated the full Meta stack.
- A gratuitous SAM integration that doesn't serve the product narrative will hurt Demo and Impact scores more than it helps Tooling.

---

## 4. Muse Code — Relationship to vibe-fence

### What Muse Code Is

Muse Code is a **terminal coding agent** powered by Muse Spark 1.2+, co-trained with its harness for tight tool-use. Distinctive mechanics:

- **Agent loop + persistent background subagents** (not per-task spawn) — reduces latency on multi-step work.
- **Fan-out:** One big job → parallel subagents each in an **isolated git worktree** (no file collisions).
- **Event log:** Every model call, tool run, approval, edit appended — replay-exact, restart-safe.
- **Bundled skills:** `/plan` (approval-gated plan), `/grill` (stress-test plan), `/goal` (goal tracking to merge).
- **New (Oct 2026):** Inter-session messaging (Unix socket), Workflows (`ultra` effort → coordinated team), Rewind (double-`Esc`), SDK (TypeScript, MSP over stdio).
- **Availability:** Pay-as-you-go or subscription; works with any Muse Spark 1.2+ version. Runs on the same Meta Model API billing.

Sources: [dev.meta.ai/resources/blog/build-with-muse-code](https://dev.meta.ai/resources/blog/build-with-muse-code), [research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2](https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2), [dev.meta.ai/resources/blog/muse-code-new-plans-and-features](https://dev.meta.ai/resources/blog/muse-code-new-plans-and-features), [dev.meta.ai/products/muse-code](https://dev.meta.ai/products/muse-code) — all accessed 2026-10-20.

### How vibe-fence Relates vs Competes

**Complementary, not competitive.** This is the critical positioning:

| Dimension | Muse Code | vibe-fence |
|---|---|---|
| What it is | An *agent* (does the coding) | A *harness* (wraps any agent, makes it safe/teachable) |
| Runtime | One specific CLI | Runtime-agnostic: `src/adapters/` for Claude/OpenCode/Codex/Antigravity/Hermes/**Muse Code** |
| Value | Executes long-horizon engineering | Enforces structure/safety/tutoring that the agent itself doesn't |
| Training | Co-trained with Muse harness → best Spark tool-use | Defines project conventions (file layout, secrets, deploy) at the repo level |

**Positioning for judges:** "We built vibe-fence *for* Muse Code (and every other agent). Install vibe-fence in a Muse Code project and `/plan` now produces fence-aware plans; guardrails catch what the agent misses. Muse Code proved the harness pattern — we generalized it."

**Strength:** `practiced` — Muse Code's fan-out, event log, and co-training claims are documented on official Meta blogs; independent evals of long-horizon performance are still emerging.

### Scoring Leverage

- **Narrative leverage:** Framing vibe-fence as "the harness for Muse Code" aligns with Meta's own story (they shipped an agent + harness together). Judges funded that story — a generalization of it scores well on Impact and Technical Depth.
- **Demo leverage:** Show vibe-fence running *inside* Muse Code (one terminal pane) — zero extra setup for Meta's own agent users. If time allows, show a second adapter (e.g. Claude) to prove runtime-agnosticism.
- **Build the Muse Code adapter first** (M4 in PLAN.md) — it is the reference adapter and the one judges will recognize.

---

## 5. Open-Weights Path — Baseten / Modal / Fireworks

### What Is Available

Meta's open-weights family is distinct from the hosted Model API:

| Model family | License | Hosts |
|---|---|---|
| **Muse Glimmer** (30 B) | Apache 2.0 | Announced Aug 2026 — truly permissive |
| **Muse Spark Open** (weights released Oct 15, 2026) | **Muse Model License** (limited commercial terms: "Built with Muse Spark Open" attribution required; >$20 M revenue as model-as-a-service requires separate agreement with Meta) | Hugging Face (approval-gated), Baseten, Fireworks AI, Groq, Modal, Nebius, OpenRouter, Together AI, SageMaker, GCP Model Garden, Microsoft Foundry |
| **SAM 3.1 open-weight** | Apache 2.0 | — |
| DINOv3, AudioGen, Llama lineage | Various (Llama custom community license, etc.) | — |

**Muse Spark Open specifics:** BF16 + NVFP4 weights; runs on SGLang, vLLM, TensorRT-LLM, Hugging Face Transformers, llama.cpp, Unsloth; MLX on 2× Apple M5 Ultra. Hosted access via Baseten/Fireworks/Modal credited for hackathon participants ($150 API credits per the hackathon page).

Sources: [research.meta.ai/blog/muse-spark-open](https://research.meta.ai/blog/muse-spark-open), [baseten.co/library/publisher/meta-ai](https://www.baseten.co/library/publisher/meta-ai/), [noze.it Muse Spark Open analysis](https://www.noze.it/en/insights/muse-spark-open-meta-open-weights/), AI at Meta X announcement 2026-10-15 — accessed 2026-10-20.

### Companion Role for vibe-fence

**Not primary during the hackathon — strategic for the post-hackathon product.**

Credible hackathon uses:

- **Cost-sensitive offline guardrail:** A local Llama/Glimmer model could run secret-scanning or dependency checks without API calls (privacy story: "your code never leaves your machine"). Mention as roadmap, demo only if time surplus.
- **Fine-tuned teaching model:** Fine-tune a small Llama/Glimmer on "explain this guardrail violation at max/med/min/silent" — the distillation path Meta explicitly supports (TorchTitan, distillation guidance). Again, roadmap; not hackathon-critical.

**Strength:** `practiced` for Llama/Glimmer self-hosting patterns; `contested` for whether a small model matches Spark's teaching quality — benchmark before committing.

### Scoring Leverage

- Low for the hackathon demo (judges evaluate the hosted Model API path). Mention open-weights as "where this goes next" in the closing slide to score Production Readiness / Startup-track-adjacent maturity without derailing the Indie narrative.
- **Do** claim the Baseten/Modal/Fireworks credits — they are part of the hackathon package and useful for load testing outside the Model API rate limits.

---

## 6. Winning Hackathon Patterns — What Wins Meta/AI Hackathons

### Judging Criteria (Meta Global AI Developer Hackathon, per waiver + event page)

| Criterion | Weight | What judges score |
|---|---|---|
| **Impact** | **30%** | Who benefits, how much it matters, real-world potential, fit to theme (*Build for Your World* or *Push the Frontier*) |
| **Use of Meta AI Tooling** | **25%** | Creativity beyond basic integration, unexpected capability surfaces |
| **Demo** | **25%** | Working live demo + quality of demo video |
| **Technical Depth & Execution** | **20%** | Engineering soundness, thoughtful refinement, craft |
| **Indie track lens** | — | Creativity, technical ambition, whether it works |
| **Pass/fail gate** | — | Must fit a theme and *really use* the required Meta tools — projects failing this are never scored (per hackathon analysis [reconscribe.com]) |

Sources: [dev.meta.ai/events/global-hackathon](https://dev.meta.ai/events/global-hackathon), [reconscribe.com/meta-global-ai-developer-hackathon-2026](https://reconscribe.com/meta-global-ai-developer-hackathon-2026/), [aimagazine.blog coverage](https://aimagazine.blog/meta-opens-its-1m-global-ai-developer-hackathon-20000-seats-150-api-credits-each-and-applications-close-october-25/) — accessed 2026-10-20.

### What Wins (synthesized from hackathon literature + Meta's structure)

1. **Build for the weights.** Map every feature to a weighted criterion before writing code. Impact (30%) is the largest — the problem statement ("vibe-coding is unsafe for non-technical builders") must be crisp and human-centered. Tooling (25%) rewards depth over breadth.

2. **Depth > breadth on Meta tooling.** One deep, surprising use of Spark (agentic harness that teaches) beats a shallow tour of Spark + Image + SAM. The "beyond basic integration" language explicitly penalizes chatbot wrappers. See also: PayPal/Meta VR Start precedent — projects failing the "really uses required tools" gate are never scored.

3. **Live demo + video are 25%.** Plan the video *before* building (per [reconscribe.com/hackathons](https://reconscribe.com/hackathons/) — judges meet the project mostly through the video). Before/after structure is ideal: show the same prompt producing an unsafe mess without the fence vs a safe, well-structured project with it. Repeatable, not a single golden run.

4. **Workshops & live interaction.** Meta's 2026 hackathon includes live workshops — use them to validate the integration narrative with mentors and to surface bugs early. Projects that iterate with organizers historically place higher.

5. **Eval story > claims.** Compare outputs with/without the harness on the same tasks (file structure, secrets handling, dependency hygiene). Even a small table (N=5 tasks, scored by a rubric) beats "it works" assertions. This is the Startup-track-adjacent rigor that separates winners in Indie.

6. **Ship + attribution.** Hosted Muse Spark (Model API) is the scored path; open-weights is the "what's next" slide. Include "Built with Muse Spark" attribution proactively — Spark Open's license requires it anyway and signals good citizenship to judges.

**Strength:** `practiced` — criteria weights are from the official waiver/event page; general patterns are synthesized from multi-hackathon retrospectives (not a single RCT).

---

## 7. Integration Plan for vibe-fence

### Priority Stack

| Priority | Model | Role | Effort | Demo |
|---|---|---|---|---|
| **P0 — Must** | **Muse Spark 1.3** | Companion brain: plan decomposition, guardrail classification, teaching explanations, issue-queue drafting. Called from `src/framework/` and `src/skills/vibe-*` via Model API (`/v1/responses` with `previous_response_id` for session state, `web_search` for grounded explanations). | Medium — prompt engineering + API wiring | Live: show the fence intercepting an unsafe vibe-coded request, Spark generating the fix + teaching note |
| **P1 — Should** | **Muse Code** | Reference agent + first adapter (`src/adapters/muse-code/`). Prove runtime-agnosticism by showing vibe-fence inside Muse Code's own CLI. | Low — adapter is config/prompt, not model training | Live: one pane running `muse` + vibe-fence, second pane showing file diff |
| **P2 — Should** | **Muse Image** | Demo polish: OG card, before/after visuals, optional teaching diagrams. Called once at `init` + for docs. | Low — a few `images/generations` calls | Video/poster: generated assets attributed to Muse Image |
| **P3 — Maybe** | **SAM 3.1** | Thin screenshot segmentation slice: SAM outlines UI elements in a screenshot → Spark reasons over them. 1-hour integration, framed as honest exploration. | Low — single `responses` call on `sam-3.1` | Optional 20-second segment in video; omit if time-constrained |
| **P4 — Roadmap** | **Open-weights (Llama/Glimmer)** | Offline guardrail + fine-tuned teaching model. Mention in closing slide as "where this goes next: your code never leaves your machine." | None during hackathon | Slide only |

### API Wiring Sketch

```
User prompt
  → vibe-fence intercept (src/framework/intercept.ts)
    → Muse Spark 1.3 via POST /v1/responses
       - input: user intent + codebase snapshot (≤ 1 M tokens)
       - tools: web_search (grounded teaching), image_generation (optional diagram)
       - output: { plan, guardrail_findings, teaching_note, issue_queue_entries }
    → (optional) SAM 3.1 via POST /v1/responses (model: sam-3.1)
       - input: app screenshot + text concept
       - output: boxes/masks → fed back to Spark for reasoning
    → Agent executes plan (Muse Code, Claude, Codex, etc.)
  → Demo app: before/after file tree, git log, deployed URL
```

Use **Contributor mode** (`muse-spark-1.3-contributor`) for volume; Standard for the live demo where latency matters most.

### Demo Narrative (90 seconds)

> *"Meet vibe-fence — the harness that makes any coding agent safe for non-technical builders. Watch: we give the same prompt to an agent without the fence — it works, but it leaks a secret, skips tests, and deploys to the wrong branch. Now with the fence: Muse Spark — Meta's 1-million-token agentic model — steps in. It plans the work, catches three guardrail violations, queues fixes the agent resolves itself, and teaches the user why in plain language. Same prompt, safe project, git history intact. Muse Code ran the build; Muse Image made the visuals; Spark made it wise. One install, any agent, every time."*

Closing slide: *"Hosted on Meta Model API today; open-weights offline guard locally tomorrow — your code never has to leave your machine."*

---

## 8. Gaps & Unknowns

1. **Spark benchmark recency:** Headline "frontier-level reasoning" claims for 1.3 are launch-day; independent evals (HELM, LiveBench, SWE-bench) for 1.3 not yet published at time of writing. Verify before quoting figures.
2. **Contributor mode eligibility:** Pricing page lists Contributor pricing but not the full eligibility/approval flow beyond "apply on dev.meta.ai." Confirm access before relying on $0.10/$0.20 rates for the demo budget.
3. **Muse Code SDK maturity:** SDK is "developer preview" (TypeScript/MSP over stdio). Breaking changes possible during the hackathon window — pin versions and test the adapter early.
4. **SAM 3.1 video costs:** $0.20/1,000 frames is cheap, but frame extraction + upload bandwidth for a long demo video may dominate cost/time — measure before committing to video segmentation.
5. **Hackathon live-finals format:** Not specified on the event page — prepare for both a 3-minute pitch and a 10-minute live debug session.

---

## 9. Sources

| # | Source | URL | Date Accessed |
|---|--------|-----|---------------|
| 1 | Introducing Muse Spark 1.1 — AI at Meta (blog) | https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/ | 2026-10-20 |
| 2 | Build with Muse Spark — Meta Model API (blog) | https://dev.meta.ai/resources/blog/build-with-muse-spark | 2026-10-20 |
| 3 | Models — Meta Model API (docs) | https://dev.meta.ai/docs/models | 2026-10-20 |
| 4 | Overview — Get started with Meta Model API and Muse Code (docs) | https://dev.meta.ai/docs/overview | 2026-10-20 |
| 5 | Pricing and rate limits — Meta Model API (docs) | https://dev.meta.ai/docs/pricing-rate-limits | 2026-10-20 |
| 6 | Build with Muse Image — Meta Model API (blog) | https://dev.meta.ai/resources/blog/build-with-muse-Image | 2026-10-20 |
| 7 | Introducing Muse Image and Muse Video — AI at Meta (blog) | https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/ | 2026-10-20 |
| 8 | Image generation with Muse Image (docs) | https://dev.meta.ai/docs/image-generation | 2026-10-20 |
| 9 | SAM 3.1 product page — Meta Model API | https://dev.meta.ai/models/sam-3-1 | 2026-10-20 |
| 10 | SAM 3.1: Faster and More Accessible — AI at Meta (blog) | https://ai.meta.com/blog/segment-anything-model-3/ | 2026-10-20 |
| 11 | Segmentation with SAM — Meta Model API (docs) | https://dev.meta.ai/docs/sam/overview | 2026-10-20 |
| 12 | Segmenting with prompts — SAM 3.1 (docs) | https://dev.meta.ai/docs/sam/segmenting | 2026-10-20 |
| 13 | Meet Muse Spark 1.2 and Muse Code — Meta Model API (blog) | https://dev.meta.ai/resources/blog/build-with-muse-code | 2026-10-20 |
| 14 | Introducing Muse Code and Muse Spark 1.2 — Research blog | https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 | 2026-10-20 |
| 15 | Muse Code: New plans and features (Oct 2026) | https://dev.meta.ai/resources/blog/muse-code-new-plans-and-features | 2026-10-20 |
| 16 | Muse Code product page | https://dev.meta.ai/products/muse-code | 2026-10-20 |
| 17 | Meta Connect 2026 recap — Developers blog | https://developers.meta.com/blog/meta-connect-recap/ | 2026-10-20 |
| 18 | Meta Global AI Developer Hackathon — event page | https://dev.meta.ai/events/global-hackathon | 2026-10-20 |
| 19 | Meta Global AI Developer Hackathon — criteria analysis | https://reconscribe.com/meta-global-ai-developer-hackathon-2026/ | 2026-10-20 |
| 20 | Muse Spark Open — Research blog | https://research.meta.ai/blog/muse-spark-open | 2026-10-20 |
| 21 | What Is Muse Spark Open — Hugging Face blog | https://huggingface.co/blog/apiextensions/what-is-muse-spark-open | 2026-10-20 |
| 22 | Muse Spark Open — analysis (Noze.it) | https://www.noze.it/en/insights/muse-spark-open-meta-open-weights/ | 2026-10-20 |
| 23 | Meta Model Library — Baseten | https://www.baseten.co/library/publisher/meta-ai/ | 2026-10-20 |
| 24 | Hackathons 2026 — judging advice | https://reconscribe.com/hackathons/ | 2026-10-20 |
| 25 | Muse API pricing deep dive — OrcaRouter | https://www.orcarouter.ai/blog/muse-api | 2026-10-20 |

---

## 10. Implications for vibe-fence

1. **Copy — Make Spark the companion, not a feature.** Integrate `muse-spark-1.3` as the reasoning core via `POST /v1/responses` with `previous_response_id` session state. Every guardrail explanation, plan decomposition, and teaching note flows through Spark — this is the "beyond basic integration" judges reward (25% of score). Use the same OpenAI-compatible client the harness already depends on.

2. **Copy — Claim Contributor pricing early.** Apply for `muse-spark-1.3-contributor` access now ($0.10 in / $0.20 out per 1 M vs $1.25/$4.25 Standard). At hackathon volume, this is a 10–12× cost saving and a credible "cost-sensitive design" bullet in the submission.

3. **Copy — Build the Muse Code adapter first.** `src/adapters/muse-code/` is the reference adapter. Positioning vibe-fence as "the harness for Muse Code (and every other agent)" aligns with Meta's own agent+harness narrative and gives judges a familiar live demo surface. Test `muse` + vibe-fence fan-out interaction early — co-trained tool-use is the moat.

4. **Copy — Use `web_search` for grounded teaching.** Enable the built-in `{"type":"web_search"}` tool on Spark calls so explanations cite live sources (OWASP, framework docs). Cited answers differentiate "teaches correctly" from "hallucinates confidently" — and map to the Impact/Technical Depth criteria.

5. **Copy — Generate demo assets with Muse Image, not stock.** Use `muse-image-1.0` (`$0.01/image`) for the OG card, before/after visuals, and optional teaching diagrams. The Images API is OpenAI-compatible — wiring is trivial. This signals breadth of Meta tooling use without complicating the core product.

6. **Avoid — Don't force SAM 3.1 into the critical path.** SAM 3.1 segments images/video; it does not understand code, intent, or safety. A contrived "segment the codebase" integration will read as cargo-culting and hurt Demo/Impact scores. Either include the honest 1-hour thin slice (screenshot → SAM masks → Spark reasoning) or skip it and document the deliberate non-use as engineering judgment — both beat a fake centerpiece.

7. **Avoid — Don't pitch open-weights as the hackathon demo.** Llama/Glimmer/Muse Spark Open self-hosting is the post-hackathon roadmap, not the scored submission. Judges evaluate the hosted Model API. Mention Baseten/Modal/Fireworks credits and the "your code never leaves your machine" future in the closing slide only — don't split build time.

8. **Invent — Before/after as the eval story.** The demo *is* the eval: same prompts, same agent, with vs without the fence, scored on file hygiene, secrets, deploy correctness, and structure. A small table (5 tasks × rubric) beats any benchmark claim and directly serves the 30% Impact + 25% Demo weights. Record the video before the final build — judges meet the project through it.

9. **Invent — Ship for both judging layers.** The event has a pass/fail gate ("really uses Meta tools" + theme fit) *before* weighted scoring. Front-load the submission README with: theme sentence, Spark integration depth (agentic harness, not chatbot), and live demo link — so the gate check passes in 30 seconds and the weighted read starts strong.

