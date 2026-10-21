# Stream 06 — Meta Models for the Hackathon Integration

- **Model:** MiniMax M3.1 Flash
- **Provider:** ollama-launch
- **Date:** 2026-10-20
- **Stream:** 06 — Meta Models (Hackathon Integration)
- **Target hackathon:** Meta Global AI Developer Hackathon — Oct 26–Nov 4, 2026 · $1,000,000 pool

> Every API fact below was fetched from the live Meta Model API docs on `dev.meta.ai` on 2026-10-20, not recalled. Where a claim could only be sourced from a third-party summary, it is marked and repeated in **Gaps**.

---

## 0. Executive Summary — the five things that change the plan

1. **There are now SIX Meta model lines, not four.** `dev.meta.ai/docs/models` lists **Muse Wonder** (`muse-wonder-1.0`), Muse Spark, Muse Image, Muse Voice Transcribe, SAM 3.1, and Muse Glimmer — plus Muse Spark Open. **Muse Wonder is Meta's most capable coding/agentic model** and is priced at $4/$20 per 1M. Both sibling contributor files (muse-spark, google-gemini-3.8-flash) never mention it. This changes the companion-voice decision [1][25].
2. **Muse Code loads `AGENTS.md`, `CLAUDE.md`, `.agents/AGENTS.md`, `.claude/CLAUDE.md`, project-local skills, rules and hooks from the workspace.** This is a *documented, first-class* extension surface — exactly what vibe-fence is. Neither sibling identified it. It converts "write a harness" from a bet into a documented contract [27][28][29].
3. **SAM 3.1 does NOT do what the Gemini sibling file claims.** The API accepts **one concept per request** and returns **boxes and masks — not semantic component names**. There is no multi-concept syntax; `"bus, bicycle"` returns zero matches. A screenshot cannot be segmented into `navbar`/`sidebar`/`hero_card` in one call. The "mockup-to-layout bridge" in the sibling file is not implementable as described [21][22].
4. **Contributor mode is a 12.5× price cut with a real data cost**: $0.10/$0.20 per 1M vs $1.25/$4.25 — and it means Meta trains on your prompts, code, files and responses. For a harness whose whole thesis is "your code is safe", shipping a non-technical user's source code into a training set is a product contradiction. This is the single most important nuance in this stream [3][2].
5. **The judging rubric is Impact 30% / Tooling 25% / Demo 25% / Technical Depth 20%**, and the waiver's named tools are "Muse Spark, Glimmer, SAM 3, and any other Meta AI products identified on the Event page." The event page adds Muse Wonder. Breadth is explicitly rewarded by the rubric wording, but a forced integration is not [4][6][43].

---

## 1. Findings — Muse Spark series

### 1.1 Muse Spark 1.3 is the cost/latency workhorse, not the top-end model

- **Claim:** Meta ships six hosted model lines. Muse Spark has three versions — 1.3 (`muse-spark-1.3`, "Recommended for new work"), 1.2, and 1.1 — all accepting text, image, video, audio and PDF input, returning text, with a **1,048,576-token context window**. Muse Wonder is a *separate, more capable* line. Meta's own guidance: "Muse Wonder and Muse Spark take the same requests on the same endpoints, so moving a workload between them is a model ID change." Use Wonder for "long-running, complex tasks where capability matters more than cost per token"; use Spark for "high-volume, latency-sensitive, or cost-sensitive work, such as sub-agent tasks, classification, and tight tool loops."
  - **Evidence:** https://dev.meta.ai/docs/models (accessed 2026-10-20); https://dev.meta.ai/docs/overview (accessed 2026-10-20)
  - **Strength:** `proven` (official docs, fetched directly)
  - **vibe-fence fit:** This sentence is the whole routing policy for the harness. Muse Wonder = the plan/teach/critique brain on hard tasks. Muse Spark 1.3 = the high-volume classifier/guardrail/teaching-dial engine. They are interchangeable on the same base URL, so the harness can route by difficulty with a one-line model-ID change. See Implication 1.

### 1.1b The Responses API is the only endpoint that carries chain-of-thought across turns — and the *recommended* mode is stateless

- **Claim:** "The Responses API is the only endpoint that carries the model's chain of thought between calls, which keeps tool loops accurate and performant." It offers two context modes: **stateless encrypted reasoning replay** (marked *recommended*) — "resend the conversation each turn. Reasoning travels as encrypted reasoning items. **Nothing is stored server-side**" — and **server-managed history**, where "the server stores each response and you continue from `previous_response_id`." Both preserve chain of thought; a plain `messages` array cannot. The `input` array carries typed items: `developer`/`system`/`user`/`assistant` messages, `reasoning` items, and `function_call` / `function_call_output` items. Chat Completions "is simpler" for single-shot or straightforward turns without reasoning continuity.
  - **Evidence:** https://dev.meta.ai/docs/protocols/responses (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** **This corrects both sibling files, which both specify `previous_response_id` for session state.** The docs say server-managed history is the *alternative*, and that the *recommended* mode stores **nothing server-side**. For a product whose pitch is "your code stays yours," stateless encrypted replay is the better default on both privacy and Meta's own recommendation — and it is the same mode the OpenCode/Codex configs in Meta's own guide use (`include: ["reasoning.encrypted_content"]`, replaying encrypted reasoning across turns). Use `previous_response_id` only for Muse Image's multi-turn refine flow, where the docs explicitly recommend it and where `store` defaults to `true`.

### 1.2 Context window, reasoning effort, and the `max` caveat

- **Claim:** `reasoning_effort` accepts `minimal`/`low`/`medium`/`high`/`xhigh`/`max`. **`"none"` returns HTTP 400** on both Muse Wonder and Muse Spark — reasoning cannot be fully disabled. `"max"` is supported by `muse-wonder-1.0` and `muse-spark-1.3` but **not** by `muse-spark-1.3-contributor`. Reasoning tokens count against `max_tokens`/`max_output_tokens` and are billed as output tokens.
  - **Evidence:** https://dev.meta.ai/docs/reasoning (accessed 2026-10-20); https://dev.meta.ai/docs/models (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** The teaching dial is a natural map onto reasoning effort — `max` for the deep explanation, `low` for the one-line nudge. But `none` is a 400, so "silent" mode must be implemented as *not calling the model at all* (or as a non-reasoning local path), not as `reasoning_effort: "none"`. See Implication 4.

### 1.3 Pricing and rate limits — verified, per-team, per-model

- **Claim:** Per **1M tokens**, Standard mode: Muse Spark 1.3/1.2/1.1 = $1.25 input / $0.15 cached / $4.25 output. Contributor mode (`muse-spark-1.3-contributor`, `muse-spark-1.2-contributor`) = $0.10 / $0.002 / $0.20. Muse Wonder = $4.00 / $0.20 / $20.00, Standard only on Model API. **No long-context premium** — same rate whether the 1M window is nearly empty or nearly full. `web_search` grounding adds **$2.50 per 1,000 search queries** on top of token cost (Muse Image's built-in search is *not* separately charged). Rate limits are **per team, not per API key**, and each model has its own budget: `muse-spark-1.3` 3,000 RPM / 4,000,000 TPM; `muse-spark-1.3-contributor` 150 RPM / 3,000,000 TPM; `muse-wonder-1.0` 3,000 RPM / 4,000,000 TPM; `sam-3.1` 3,000 RPM (no TPM); `muse-image-1.0` 150 RPM (no TPM). Background responses: 600 submissions/minute/team.
  - **Evidence:** https://dev.meta.ai/docs/pricing-rate-limits (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Three concrete implications. (a) The 1M window is effectively free of premium — vibe-fence can hold a whole repo in context without budgeting anxiety, which is the core of the "companion that knows your project" claim. (b) "No long-context premium" is a *quotable* line for the submission. (c) Contributor mode's 150 RPM is the binding constraint for a live demo — a 3,000 RPM Standard key can be rate-limited to 1/20th. Route the demo's hot path to Standard.

### 1.4 Contributor mode is a discount paid for with the user's source code

- **Claim:** "In Contributor mode, your content may be used to train future Meta models" — and "content" is defined explicitly as "the prompts, code, files, and context you send, plus the model responses you get back." Contributor mode exists **only** for Muse Spark 1.2/1.3 on Model API (not Muse Wonder, not Muse Image, not SAM, not Muse Voice Transcribe). Muse Code *subscriptions* default to Contributor mode.
  - **Evidence:** https://dev.meta.ai/docs/pricing-rate-limits (accessed 2026-10-20); https://dev.meta.ai/docs/muse-code/subscriptions (accessed 2026-10-20); https://dev.meta.ai/docs/models (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** **This is the most important finding in this stream for product honesty.** A harness whose pitch is "your code is safe, we catch your secret leaks" must not, by default, ship the user's source code into Meta's training set. The Muse Spark sibling file recommends claiming Contributor pricing "early" as a cost bullet with no mention of the data consequence. Recommendation: use Standard mode for anything containing user source; offer Contributor as an explicit, opt-in, clearly-labelled toggle for *synthetic* demo content only. See Implication 2.

### 1.5 Tool calling, structured output, and the constraint that actually matters

- **Claim:** The **Responses API** is the recommended path for tool calling and multi-turn agents: it preserves reasoning across tool turns and threads calls with `previous_response_id`. Developer-defined tools work on both Responses and Chat Completions. Two server-side built-in tools exist: `web_search` and `tool_search`. Structured output is set via `response_format` (Chat Completions) or `text.format` (Responses) with a JSON Schema — **decoding is constrained**, not post-processed. **Recursive schemas are unsupported → HTTP 400.** `tool_search` is **not combinable with structured output** (also HTTP 400), is **Responses-API-only** (not on Chat Completions), and only **one** `tool_search` per request.
  - **Evidence:** https://dev.meta.ai/docs/tool-calling (accessed 2026-10-20); https://dev.meta.ai/docs/structured-output (accessed 2026-10-20); https://dev.meta.ai/docs/tool-search (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** vibe-fence's guardrail findings and issue-queue entries are a *recursive* structure by nature (issue → solution → plan, where plan contains sub-tasks). A recursive JSON Schema would 400. **Flatten the issue queue to a fixed depth** — a `plan` array whose items are plain strings, not nested plan objects. Also: don't try to combine `tool_search` with a JSON Schema on the same request; run tool search first, then structured output on a follow-up turn. See Implication 3.

### 1.6 `tool_search` — the token-cost lever for a 1M-context harness

- **Claim:** By default every tool definition loads into context every turn and you pay for it each time. `tool_search` defers tool schemas: the tool's **name and description stay visible** from the start, only the parameter schema is withheld until the model loads it. Loaded tools are appended **at the end of the context**, preserving the cache prefix. Two modes: **hosted** (API searches and loads in the same response) and **client-executed** (the model emits a `tool_search_call` and your app performs the lookup). Deferred tools are grouped into **namespaces**; a namespace should be focused, with **fewer than 10 functions**.
  - **Evidence:** https://dev.meta.ai/docs/tool-search (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** vibe-fence will want a *large* tool surface (one tool per guardrail: secret scan, dep audit, git hygiene, deploy check, test run, image asset, SAM segment…). Loading all of them every turn is exactly the waste `tool_search` removes. **Namespace the guardrails by domain** (`security`, `git`, `deploy`, `assets`) with <10 functions each, and let the model pull only the namespace it needs. This is a genuine "unexpected capability" story for the 25% Tooling criterion — a documented Meta capability that most hackathon entrants will not use. See Implication 5.

### 1.7 Search grounding is a separate, metered line item

- **Claim:** Add `{"type": "web_search"}` to `tools` on a Responses request. The model decides whether to search. The response includes a `web_search_call` output item, `url_citation` annotations tying spans to source URLs, and optionally raw `results` via `include: ["web_search_call.results"]`. Cost is **$2.50 per 1,000 search queries** on top of token cost.
  - **Evidence:** https://dev.meta.ai/docs/search-grounding (accessed 2026-10-20); https://dev.meta.ai/docs/pricing-rate-limits (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** The teaching dial's credibility hinges on explanations being *correct*, not confident. Grounded citations for guardrail explanations (OWASP, framework docs) are the difference between "trust this rule" and "trust this model's opinion." Budget it explicitly: 1,000 search queries = $2.50, which is trivial against the $150 credit. See Implication 6.

### 1.8 Prompt caching and the "no long-context premium" combo

- **Claim:** Cached input is billed at the cached rate when part of the prompt matches a cached prefix; inspect `cached_tokens` in the response. There is **no long-context premium** — you pay the same rate whether the context is nearly empty or nearly full. Meta injects a small amount of steering context (system prompt and scaffolding) into every prompt; those injected tokens are **not billed** and are excluded from reported `usage`.
  - **Evidence:** https://dev.meta.ai/docs/pricing-rate-limits (accessed 2026-10-20); https://dev.meta.ai/docs/prompt-caching (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Combined with `tool_search`'s end-of-context appends, prompt caching makes a large-context harness affordable: keep a stable prefix (AGENTS.md + project rules + tool namespace descriptions) and let everything variable go after it. Note that `tool_search` explicitly preserves the cache prefix — that is the design intent.

---

## 2. Findings — Muse Wonder (missed by both siblings)

### 2.1 It is Meta's most capable coding model, and it is on Model API

- **Claim:** "Muse Wonder is Meta's most capable model, built for complex software engineering and long-horizon agentic work. It makes and verifies changes across many files in real repositories, and it plans, delegates to sub-agents, calls tools in parallel, and recovers from errors across many steps." 1,048,576-token context; text/image/video/audio/PDF in, text out; reasoning effort `"minimal"`–`"max"`; handles chat completion, image understanding, video and audio understanding, tool calling, structured output and search grounding. **In preview.** Meta's own coding-agent and agent-framework guides use `muse-wonder-1.0` for the main loop, and `muse-spark-1.3` where cost matters (e.g. subagents).
  - **Evidence:** https://dev.meta.ai/docs/models (accessed 2026-10-20); https://dev.meta.ai/docs/coding-agents (accessed 2026-10-20); https://dev.meta.ai/docs/agent-frameworks (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** If Muse Wonder is the best available model for "plan a multi-file change and verify it," then the *plan-and-verify* step of vibe-fence (the part that actually prevents a broken vibe-coded project) is exactly what it is for — and it is 3.2× the input price of Spark 1.3. The right architecture is **Wonder for the plan/verify/approve gate, Spark 1.3 for everything else.** Neither sibling file proposes a two-tier model split.

### 2.2 Muse Wonder Full exists but is Muse Code-subscription-only

- **Claim:** Two variants: `muse-wonder-1.0` (Model API pay-as-you-go, Standard mode only, and available in Muse Code on every plan) and **Muse Wonder Full** — "our most advanced model yet" — which is **not available on Model API at all**; it requires a Muse Code subscription on the Power Usage ($50/mo) or Maximum Usage ($200/mo) plans. Setting `reasoning_effort: "max"` on plain Muse Wonder does *not* select Full.
  - **Evidence:** https://dev.meta.ai/docs/models (accessed 2026-10-20); https://dev.meta.ai/models/muse-wonder (accessed 2026-10-20); https://dev.meta.ai/docs/muse-code/subscriptions (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Do not build the demo on Muse Wonder Full — it requires a paid subscription a judge may not have. Build on `muse-wonder-1.0` via Model API. But *do* mention Full in the roadmap slide: "the same harness, on Meta's most advanced model, available to Muse Code subscribers."

### 2.3 The model card is honest about limits — use its exact language

- **Claim:** Muse Wonder released **October 12, 2026**. The model card lists limitations including: "the model may still make errors in multi-step reasoning, particularly in novel scenarios not well represented in training data"; "Visual and spatial reasoning, especially 3D tasks, remains a known limitation"; "Performance can vary with quantization, serving configuration, prompts, tools, and **the agent harness**"; and "Performance may degrade on languages outside the strongly supported set." It recommends "implementing additional guardrails (such as human-in-the-loop confirmation for irreversible actions) when deploying the model in agentic contexts where it can take real-world actions."
  - **Evidence:** https://research.meta.ai/static/muse-wonder-model-card (accessed 2026-10-20); https://dev.meta.ai/models/muse-wonder (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Two things. First, "performance can vary with … the agent harness" is *Meta validating vibe-fence's entire thesis* — the harness is not decoration, it changes model behavior. Quote it. Second, Meta's own recommendation (human-in-the-loop for irreversible actions) is precisely vibe-fence's guardrail thesis, endorsed by the model vendor. This is a much stronger pitch than asserting it ourselves. See Implication 7.

### 2.4 The benchmark table includes competitors — a rare, quotable artifact

- **Claim:** The Muse Wonder page publishes a comparison table against **Claude Fable 5.1 (max), GPT-6 Astra (max), and Claude Opus 5.5 (max)** across coding benchmarks (Terminal-Bench 4.0-AA, DeepSWE 1.1, SWE-Marathon, ProgramBench), agentic-computer-use (OSWorld V2.1), and professional work. The model card states the methodology: results generated at `max` reasoning effort, compared at `max` reasoning effort, "for controlled internal coding comparisons, every model uses the same benchmark-specific harness," and "**Model refusals receive zero credit and remain in the denominator rather than being dropped.**"
  - **Evidence:** https://dev.meta.ai/models/muse-wonder (accessed 2026-10-20); https://research.meta.ai/static/muse-wonder-model-card (accessed 2026-10-20)
  - **Strength:** `contested` — these are vendor-reported and internally run for the competitor baselines; the card itself says competitor runs are "best-effort: prompts, tools, and runtime may not be optimally tuned for proprietary models." Treat as marketing-grade, not independent.
  - **vibe-fence fit:** **Do not put Muse Wonder's benchmark table in the submission as a competitive claim.** A judge who reads the model card's own caveat ("best-effort … may not be optimally tuned for proprietary models") will discount it and it will read as sloppy. Instead use it as a *routing* input: Wonder for hard multi-file work, Spark for volume. If you need a head-to-head number, run your own eval (§5.4).

---

## 3. Findings — Muse Image

### 3.1 API surface: two ways in, and the search is built in

- **Claim:** Model ID `muse-image-1.0`, text and image in, image out. Two surfaces: the **Responses API** for conversational multi-turn generation/editing, and the OpenAI-compatible **`/v1/images/generations`** and **`/v1/images/edits`** for one-shot calls. Generation modes: **Generate** (text→image), **Edit** (image + instruction, "changes only what you ask for while keeping the rest intact"), **Refine** (multi-turn, server-managed state via `previous_response_id`; you don't resend the image — the prior `image_generation_call.id` carries it), and **Compose** (multiple input images fused into one scene). The model is agentic: it "can search the web for visual references and current facts and run code to build layouts before it renders." Its built-in web/image search is **included in the per-image price** — and passing a `web_search` tool to Muse Image **returns an error** ("image models only support the `image_generation` tool"). On the images endpoints, control it via Meta-specific `extra_body` fields: `tool_enablement` (`enable_image_search`, `enable_web_search`, `enable_shell`) and `reasoning_strength`.
  - **Evidence:** https://dev.meta.ai/docs/image-generation (accessed 2026-10-20); https://dev.meta.ai/docs/models (accessed 2026-10-20); https://dev.meta.ai/models/muse-image (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** "Changes only what you ask for while keeping the rest intact" is a *precisely* the property an asset-generation tool needs inside a repo — it won't restyle the user's other files. And `reasoning_strength` gives the harness a dial. The `enable_shell` flag is the interesting one: Muse Image can **run code** while generating. A `vibe-asset` skill that asks Muse Image to build a layout with code and then render it is a genuinely non-obvious use of a Meta model.

### 3.2 Pricing, response shape, and streaming

- **Claim:** **$0.01 per generated image**, flat regardless of prompt length, `reasoning_strength`, or tools used. A request returning `n` images is billed for `n`. Images removed by safety filtering before return are **not** billed. Response: a `data` array whose first entry carries `b64_json`, `output_format` (e.g. `webp`), `background` (`opaque`), plus a `usage` object with token counts *for reference only* — image generation tokens are not part of token-based pricing. Streaming emits `image_generation.completed` (generations) or `image_edit.completed` (edits) SSE events. Error case worth knowing: `mask`, `input_fidelity` and `partial_images` params return `400` / `unsupported_parameter`.
  - **Evidence:** https://dev.meta.ai/docs/image-generation (accessed 2026-10-20); https://dev.meta.ai/docs/pricing-rate-limits (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** At $0.01/image with a 150 RPM limit, a demo can generate 100+ bespoke assets for a dollar. More importantly: **`b64_json` + `webp` output means the harness can write the asset straight to disk with no URL round-trip and no third-party CDN** — the asset never leaves the user's machine, which is on-brand for vibe-fence. The Muse Spark sibling file claimed "up to 1600 px" output; I could not verify a pixel cap in the official docs, so that claim is not repeated here (see Gaps).

---

## 4. Findings — SAM 3.1 (the honest fit assessment)

### 4.1 What SAM 3.1 actually is

- **Claim:** SAM 3.1 segments images and video from a short text prompt. Model ID `sam-3.1`, reached over `POST /v1/responses` on `https://api.meta.ai/v1` with the same Bearer key. Input: one `input_text` phrase + one media part (`input_image` or `input_video`; MP4/MOV, H.264/H.265/MPEG-4). Output: a **box and a pixel-accurate mask for every match**, streamed back in the `output_text` lane as a special-token grammar (`<0f>0<|box;x1=…;w=…;h=…|><|mask;…|>`), terminated by `response.completed`. Video tracks each object across frames with identity preserved. Zero-shot — no training data, fine-tuning or extra models. Zero matches is a valid outcome (empty `output_text`). The `@meta-sam/parser` library (`parseImageStream`, `decodeMaskToRaster`) turns the stream into typed records.
  - **Evidence:** https://dev.meta.ai/docs/sam/overview (accessed 2026-10-20); https://dev.meta.ai/docs/media-segmentation (accessed 2026-10-20); https://dev.meta.ai/models/sam-3-1 (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** This is a geometry model. It returns coordinates, not semantics. Everything downstream of that fact follows.

### 4.2 The hard constraint that breaks the sibling file's SAM plan

- **Claim:** From the official prompting guide: "**One concept per request**: there is no multi-concept syntax. Comma, semicolon, and plus lists (`"bus, bicycle"`) return zero matches; an `"and"`, a newline, or a second `input_text` part segments only one of the concepts. To segment several concepts, send one request each." Commands (`"segment the bus"`) and questions (`"where is the bus?"`) "are unreliable and often return nothing." A concept prompt and box/point prompts **cannot be combined** ("invalid prompt: object prompts cannot be combined with a phrase"). More than 16 prompted objects → `invalid prompt: 17 objects exceed this model's limit of 16`.
  - **Evidence:** https://dev.meta.ai/docs/sam/segmenting (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** **This is a direct, primary-source contradiction of the Gemini sibling file**, which proposes a `vibe-mockup` skill where "SAM 3.1 segments the screenshot into discrete UI regions (e.g. `navbar`, `sidebar`, `hero_card`, `data_table`)" and hands "structured visual topology" to Muse Spark. That is not how the API works:
    - There is no multi-concept request — a screenshot with six UI regions needs **six separate API calls** (or one call with up to 16 *box/point* prompts, which requires knowing the boxes in advance — the very thing you're trying to discover).
    - SAM returns **boxes and masks**, not names. `navbar` / `sidebar` / `hero_card` are *semantic labels* that SAM never emits. To get them you must either prompt for each concept by name ("navbar" as a text concept — fragile, since a nav bar is not a photographable object) or classify the returned geometry yourself with a VLM.
    - So the sibling's "mockup-to-layout bridge" is at best N× the API calls and at worst unimplementable as written.

### 4.3 The vendor's own recommended pairing is Spark→SAM, not SAM→Spark

- **Claim:** Meta's segmentation guide states: "For a caption, an answer about a scene, or coordinates as text, use a Muse Spark model (a VLM) through image understanding or video understanding. **The two pair well: let Muse Spark interpret a scene and decide what to segment, then hand the concept to SAM 3.1 for the masks.**" The guide's own "when to use it" list is: image editing (mask to remove/blur/replace), measurement and analytics (area, instance counts, region extraction from photos/scans/charts), and video tracking (highlight, redaction, effects). A separate note says if you already know where an object is — "from a user's click or an earlier box" — use box and point prompts instead.
  - **Evidence:** https://dev.meta.ai/docs/media-segmentation (accessed 2026-10-20); https://dev.meta.ai/docs/sam/segmenting (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Meta's intended direction is **Spark first** (interpret the scene, decide the concept), **SAM second** (produce masks for the concept Spark named). Any credible vibe-fence SAM integration must follow that order, or be a reversal of the vendor's design. And note the "from a user's click" affordance — that is the interesting one for a non-technical user.

### 4.4 The honest verdict on SAM 3.1 for a code harness

- **Claim (assessment, not vendor claim):** vibe-fence's core loop operates on files, git history, dependency manifests, and teaching text. SAM 3.1 operates on photographs, video frames, and charts. There is no "segment the codebase" operation, and the two sibling files' shared instinct — that SAM 3.1 is a *screenshot-to-layout* tool for frontend work — does not survive the one-concept-per-request and no-semantic-labels constraints. The "object multiplexing / 32fps on H100" claim in the Muse Spark sibling file is not in the official Model API docs I fetched; the API docs describe a **16-prompted-object limit**, and I found no throughput figure on any official page (see Gaps).
  - **Evidence:** https://dev.meta.ai/docs/sam/segmenting (accessed 2026-10-20); https://dev.meta.ai/docs/media-segmentation (accessed 2026-10-20); https://dev.meta.ai/docs/sam/overview (accessed 2026-10-20)
  - **Strength:** `contested` — the segmentation capability is `proven`; the relevance to vibe-fence is a judgement, and I hold it to be **low**.
  - **vibe-fence fit:** See §4.5 for the minimum credible use.

### 4.5 The minimal credible SAM use (and the two better ones)

- **Claim:** SAM 3.1 is billed per image and per video frame: **$2.50 per 1,000 images**, **$0.20 per 1,000 video frames** — same price streaming or not. Rate limit 3,000 RPM, no TPM. Meta's own product page frames the integration: "SAM 3.1 shares its envelope, keys, docs and billing with every other Meta model, so segmentation and video tracking drop smoothly into the pipeline you already have. **Reason and generate with Muse Spark, turn speech into text with Muse Voice Transcribe, and detect, segment and track objects with SAM 3.1, all through Meta Model API.**"
  - **Evidence:** https://dev.meta.ai/docs/pricing-rate-limits (accessed 2026-10-20); https://dev.meta.ai/models/sam-3-1 (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Here is the **minimal credible use**, stated plainly and honestly: **SAM 3.1 does not help a code harness. It helps a *screenshot* workflow inside one.** The one place it earns its keep in vibe-fence:

    > **"Click-to-teach" UI auditing.** A non-technical user is looking at their app and sees something wrong. They click the offending element. vibe-fence converts the click into a **box+point prompt** (the exact affordance Meta's guide calls out: "from a user's click or an earlier box"), SAM 3.1 returns the **pixel-precise mask** of that element, and Muse Spark — which understands images — is handed the masked crop plus a 1M-token view of the repo and asked: *what is this element, why is it broken, what's the minimal fix?* The mask is the thing SAM is actually good at: it converts a fuzzy "the thing over there" into exact geometry the model can reason about.

    This is honest because (a) it follows Meta's own documented ordering, (b) it uses SAM for the one thing SAM uniquely does — exact pixel geometry from a user-specified location — and (c) it is a *teaching* feature, not a correctness feature, which is precisely vibe-fence's domain. It does **not** improve code correctness, and the submission must not claim it does.

    **Two better uses, in priority order:**

    1. **Demonstrably better: don't use SAM at all in the critical path.** One deep, correct Spark integration beats three shallow ones, and the rubric rewards "unexpected capabilities" and "goes beyond a basic integration" — a forced SAM demo is the opposite of that. The Muse Spark sibling file reached the same conclusion; I concur, and §6 makes it concrete.
    2. **The breadth play, if the rubric demands it:** the click-to-teach audit above, shipped as a 20-second video beat. It is honest, it is cheap ($0.0025 per screenshot), and it is a real feature.
    3. **The one I would actually argue for in the submission:** a **documentation/diagram asset** use — SAM 3.1 masks an object in a screenshot to produce a redacted/annotated figure for a guide. But note: this is *documentation*, and Muse Image is the better tool there. So SAM's honest role stays small.

---

## 5. Findings — Muse Code, the API surface, and the open-weights path

### 5.1 Muse Code is the reference runtime, and it has a documented extension surface

- **Claim:** Muse Code is "a coding agent for the terminal and CI, built for Muse Spark." It "plans, edits, and runs commands to do tasks, with approvals and an OS sandbox on from the first run." Install: `curl -fsSL https://dev.meta.ai/install.sh | sh` → native `muse` binary. Interactive (`muse`) or headless (`muse exec "<prompt>"`). Default model is `muse-spark-1.2`; override with `--model` or `/models`. Reasoning effort: `none, minimal, low, medium, high (default), xhigh, max, ultra` via `--reasoning-effort` or `/effort`. **On first entry it asks whether to trust the workspace "which loads its skills, rules, and hooks."**
  - **Evidence:** https://dev.meta.ai/docs/muse-code (accessed 2026-10-20); https://dev.meta.ai/docs/muse-code/permissions (accessed 2026-10-20); https://dev.meta.ai/docs/muse-code/configuration (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Muse Code is the natural "reference adapter" for vibe-fence — but the interesting part is *why*, below.

### 5.2 ⭐ The key finding: Muse Code reads `AGENTS.md` — vibe-fence's file format is already a Muse Code contract

- **Claim:** "From your workspace root, Muse Code walks up to the nearest `.git` boundary. At each directory level, it checks **`AGENTS.md`, `CLAUDE.md`, `.agents/AGENTS.md`, then `.claude/CLAUDE.md`**; the first existing file in that order wins for that level." Precedence: "**Project rules win over user rules.** Among project files, the deeper file wins over a shallower one." "Project rules load only after you trust the workspace. On an untrusted checkout, Muse Code ignores project AGENTS.md and CLAUDE.md until you trust it." `muse init` writes a single `AGENTS.md` into the current directory (and "creates no other files"). Separately, project memory lives at `.agents/memory/MEMORY.md` (an index: one line per topic file) plus per-topic markdown files; at session start Muse Code injects the MEMORY.md index plus the paths of other files, up to 48 files.
  - **Evidence:** https://dev.meta.ai/docs/muse-code/configuration (accessed 2026-10-20); https://dev.meta.ai/docs/muse-code/permissions (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** **This is the single most decision-relevant finding in the stream.** vibe-fence's Phase-1 plan already centres on `AGENTS.md` and `.fence/`. Meta's own agent natively loads `AGENTS.md` from every directory level, with deeper files winning. That means:
    - vibe-fence does **not** need a custom Muse Code plugin or MCP shim to deliver its core value. Writing `AGENTS.md` (and `.agents/memory/`) is *sufficient* for Muse Code to pick up the fence's rules.
    - Per-directory scoping falls out for free: a fence rule at the repo root plus a stricter override in `src/` is exactly Muse Code's precedence model. vibe-fence can express "the fence is stricter in this folder" natively.
    - The Muse Code adapter drops from "a custom integration" to "write the right files" — a much better use of a 10-day build.
    - **And a safety caveat Meta itself raises:** "Muse Code reads committed project memory into the model's context **even in an untrusted workspace**. Skills, rules, and hooks differ: they load only after you trust it. **Treat a repo's MEMORY.md as a prompt-injection surface**, and review it on checkouts you don't control." vibe-fence should adopt and enforce exactly this rule for its own `.fence/` state files — an untrusted-checkout guardrail is a *trustworthy* differentiator, and it comes from the vendor's own threat model, not from us.

### 5.3 Muse Code's guardrails overlap vibe-fence's job — so vibe-fence must be *above* it, not beside it

- **Claim:** Muse Code has two independent control layers: **approval** (before a side-effecting tool call, checked against the approval policy) and **sandbox** (shell commands run inside an OS-enforced sandbox — Seatbelt on macOS, bubblewrap on Linux, a Windows sandbox with UAC). Permission profiles: **Ask me**, **Auto-review** (default — an automated reviewer judges eligible approvals, falls back to asking you), **Unrestricted** (`--yolo`), **Read-only**. Approval modes: `on-request` (default), `untrusted`, `never`. Compound shell commands are reviewed **stage by stage** — `wc -l report.log && echo cleaning && rm -rf report.log` passes stages 1–2 and holds at stage 3; if you reject, **nothing runs**. The sandbox grants write access to the workspace and a temp directory, keeps the rest read-only, and inside the writable workspace "**the `.git`, `.muse`, and `.agents` directories stay read-only, so the agent can't rewrite its own history, configuration, or memory.**" Network: `proxy-only` (default), `restricted`, `enabled`.
  - **Evidence:** https://dev.meta.ai/docs/muse-code/permissions (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** This is a *serious* overlap with vibe-fence's "enforces safety" claim, and honesty is required. Muse Code already: sandboxes execution, asks before risky actions, prevents the agent rewriting its own git history, and reviews shell stages. **vibe-fence cannot claim "we add approvals and sandboxing" for Muse Code — that would be false.** The defensible differentiation is the layer Meta explicitly does *not* provide:
    1. **Cross-runtime.** Muse Code's guardrails are Muse Code's. vibe-fence's are the same rules in Claude Code, Codex, Cursor, OpenCode — where the same protections largely do not exist. This is the honest, and much stronger, pitch: *"Meta's agent has great guardrails; a non-technical user's other agent doesn't. We make the guardrail portable."*
    2. **Teaching.** Muse Code holds the line; it doesn't explain why. vibe-fence's dial is the layer nobody has.
    3. **Detection, not just prevention.** Muse Code blocks a dangerous *command*. vibe-fence detects a *secret in a file the agent already wrote* — a different problem, not covered by command approval.
    4. **Portable project policy.** `AGENTS.md` + per-directory overrides is a policy format, not a Muse Code feature.

### 5.4 Muse Code's multi-agent, worktree, headless, and workflows — with one landmine

- **Claim:** A lead session spawns **subagents** for bounded tasks; an isolated child gets a **Muse Code-managed Git worktree** (requested per child, never silently falling back to the shared checkout). One agent tree can execute **8 agents at once by default** (configurable `agents.execution_capacity` 1–64; an unconfigured `ultra` root uses 64). Children can spawn grandchildren. **Workflows** coordinate parallel and staged agent work — "Use a workflow to review this service. Have separate agents inspect the API design, security boundaries, and test coverage. Verify the findings, then return one prioritized report." **But:** "Workflows require a build that includes the workflow script engine and access to the staged WorkflowTool rollout… **The current public aarch64-apple-darwin package does not include `workflow-script-engine-v8`, so workflows are unavailable in that Apple silicon macOS artifact.**" Headless `muse exec` returns exit 0 when the turn completes, 1 on failure/cancellation, 2 on usage error, 130/143 on signals — and "an agent can finish its turn (exit 0) and still report failing tests, so gate on your own test command, not on the exit code alone." On Linux CI the sandbox needs a working bubblewrap and a non-musl build.
  - **Evidence:** https://dev.meta.ai/docs/muse-code/extending (accessed 2026-10-20); https://dev.meta.ai/docs/muse-code/workflows (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** The "Have separate agents inspect the API design, **security boundaries**, and test coverage. Verify the findings, then return one prioritized report" workflow is *almost literally vibe-fence's issue queue* — parallel audit agents converging on one prioritized, verified report. That is a superb demo beat and a superb architecture precedent. **But check the build first:** on Apple Silicon macOS the public artifact has no workflow engine. Verify on the demo machine in week 1; if unavailable, drive the same fan-out through the API directly (vibe-fence spawns subagents itself via the Responses API) rather than depending on a build-gated feature.

### 5.5 Muse Code session messaging — a second Meta-native multi-agent bus

- **Claim:** "Session messaging lets independent live sessions exchange handoffs, review requests, and status updates." It has a separate peer-admission boundary: "Exact-profile peers can be admitted automatically; unverified or non-matching senders may trigger a prompt. **A message from another session cannot approve tools, grant consent, or change this session's permissions.**"
  - **Evidence:** https://dev.meta.ai/docs/muse-code/session-messaging (accessed 2026-10-20); https://dev.meta.ai/docs/muse-code/permissions (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** This is a documented Meta-native IPC channel between live agent sessions — a natural substrate for vibe-fence's **companion → agent handoff** ("here's the issue, here's the fix, go"). And the security property is a template vibe-fence should adopt: a message from another session must never be able to approve a tool or change permissions. That is a concrete, checkable guardrail rule for the harness.

### 5.6 The open-weights path: two models, two very different jobs

- **Claim:** Two open-weight releases. **Muse Spark Open** — **816B total, 42B active** parameters, sparse mixture of experts, multimodal, 1,048,576-token context; BF16 ≈ 1.65 TB (serves on 8× B300), NVFP4 ≈ 537 GB (single 4-GPU Blackwell node); budget ~2 TB VRAM for BF16; **Muse Model License**; trained on 100+ languages. Launch ecosystem: model catalogs (SageMaker AI, Google Cloud Model Garden, Microsoft Foundry), inference platforms (Baseten, Fireworks AI, Groq, Modal, Nebius, Together AI), tooling (Hugging Face, llama.cpp, MLX, TensorRT-LLM, SGLang, Unsloth, vLLM), silicon (AMD, Apple, Intel, NVIDIA), gateway (OpenRouter). **Muse Glimmer** — **30B dense** multimodal, **distilled from Muse Spark**, 128K default context (longer supported), **Apache License 2.0**; bf16 ≈ 60 GB / ~72 GB VRAM, published quantized builds 17–20 GB; runtimes vLLM, SGLang, llama.cpp, **Ollama**, ExecuTorch, Unsloth, LM Studio. Tool calling works via the chat template (ExecuTorch needs `--tool-parser atem` to convert native ATEM output into an OpenAI-compatible `tool_calls` array). Reasoning levels `low/medium/high/xhigh` via `chat_template_kwargs.reasoning_strength` (llama.cpp does **not** implement `reasoning_effort`).
  - **Evidence:** https://dev.meta.ai/docs/muse-spark-open (accessed 2026-10-20); https://dev.meta.ai/docs/muse-spark-open/deploy (accessed 2026-10-20); https://dev.meta.ai/docs/muse-glimmer (accessed 2026-10-20); https://dev.meta.ai/docs/muse-glimmer/deploy (accessed 2026-10-20); https://dev.meta.ai/docs/open-weight-models (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** **This is the answer to the harness's cost problem, and neither sibling file got it right.** Muse Spark Open at 816B is *not* self-hostable by a hobbyist or a hackathon team (8× B300, 2 TB VRAM) — the Muse Spark sibling file treated "Muse Spark Open" as a plausible local model; it is not. **Muse Glimmer 30B is the one that fits**: 17–20 GB quantized, Ollama/llama.cpp/vLLM/SGLang supported, Apache 2.0 (permissive, no attribution burden), and a built-in 128K context. The concrete credible use for vibe-fence: **run Muse Glimmer locally as the high-volume classifier** — "does this explanation need to be shown at max/med/min?", "is this diff a secret?", "which guardrail category?" — while Muse Spark 1.3 on the API does the expensive reasoning. At 17–20 GB quantized, a non-technical user's own machine (or a Modal/Baseten sandbox) can host it. **Your code never leaves the machine** becomes literally true for the sensitive path, and the "$150 credit" covers only the API path. Note also the sibling files' claim that Glimmer is "announced Aug 2026" — the official docs describe it as current and list Ollama, LM Studio, ExecuTorch and Unsloth as launch partners; I found no launch date on the official pages (see Gaps).

### 5.7 The hackathon's own partner credits point at the open-weights path

- **Claim:** The official event page names inference partners with specific credits: "**Baseten** is offering **$100** in credits and **2M TPM** rate limits to select participants to use Meta's open-weights models"; "**Modal** is offering **$100** in credits … through Endpoints in addition to their serverless GPUs, sandboxes, and tools for LLM training"; "**Fireworks** is offering **$25** in credits … along with a workshop from Sinan Ozdemer." Separately, "every selected participant gets **$150 in Meta Model API credits**."
  - **Evidence:** https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md (accessed 2026-10-20); https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver (accessed 2026-10-20); https://reconscribe.com/meta-global-ai-developer-hackathon-2026/ (accessed 2026-10-20)
  - **Strength:** `proven` (partner credits from the official event page; the $150 and waiver language corroborated by the waiver itself)
  - **vibe-fence fit:** $150 Model API + $100 Baseten + $100 Modal + $25 Fireworks = **$375 in total build credit**, and the partner credits are *specifically for the open-weights models*. Baseten's 2M TPM is a throughput number, not a token budget. The efficient plan: spend the Model API credit on the paths where quality matters (Spark 1.3 / Wonder plan-and-verify) and the partner credits on Glimmer self-hosted classification and load-testing. Note also the "workshop from Sinan Ozdemer" — an *eval-design* workshop leader, which is a signal about what the organizers value.

### 5.8 The API surface, precisely

- **Claim:** Base URL `https://api.meta.ai/v1`; Bearer token from the Model API dashboard, exported as `MODEL_API_KEY`. Endpoints: `POST /v1/responses` (Responses — recommended; stateful via `previous_response_id`, `store` defaults to `true`), `POST /v1/chat/completions`, `POST /v1/messages` (Anthropic Messages format, base `https://api.meta.ai`), `POST /v1/images/generations`, `POST /v1/images/edits`, `GET /v1/models` (returns API-hosted models, newest-first by `created`). Compatible with the **OpenAI SDK** and the **Anthropic SDK** — "drop-in compatible," so most stacks work with a base-URL and key change. Third-party agents: OpenAI-compatible agents connect to `/v1`; Anthropic-format agents (Claude Code) connect via the Messages API. Meta's own guide ships copy-paste configs for **OpenCode**, **Codex** and **Claude Code**, and separate paths for the Claude Agent SDK (Messages) and the OpenAI Codex app-server (Responses). On Model API, `muse-spark-1.3` is the default model in most examples; the agent-framework guide recommends `muse-wonder-1.0` for the main loop and `muse-spark-1.3` for subagents. Rate-limit headers `x-ratelimit-limit-tokens` / `x-ratelimit-remaining-tokens` / `x-ratelimit-limit-requests` / `x-ratelimit-remaining-requests` are returned on every successful token-based response.
  - **Evidence:** https://dev.meta.ai/docs/quickstart (accessed 2026-10-20); https://dev.meta.ai/docs/coding-agents (accessed 2026-10-20); https://dev.meta.ai/docs/agent-frameworks (accessed 2026-10-20); https://dev.meta.ai/docs/pricing-rate-limits (accessed 2026-10-20); https://dev.meta.ai/docs/models (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Because the API is OpenAI- and Anthropic-compatible, the harness's provider layer is a thin adapter: base URL + key + model ID. That is the cheapest possible integration and it means the **adapters** in vibe-fence's Phase-1 plan (M4) are about *harness protocol* (AGENTS.md, hooks, MCP), not about model plumbing. Get the model plumbing right once.

### 5.9 Geographic restrictions — a real deployment constraint for a "for everyone" product

- **Claim:** Model availability varies by country under the [Geographic Use Policy](https://dev.meta.ai/legal/geographic-use-policy). The policy page enumerates designated models: Muse Image, Muse Spark 1.1, 1.2, 1.3, Muse Voice Transcribe, SAM 3.1, Muse Wonder, Muse Wonder Full, and the Contributor Models. Third-party reporting (Reconscribe) states the Model API is blocked entirely in **Pakistan, Ethiopia, Venezuela, Iraq and Cambodia**, and that **Muse Image is additionally blocked in India**, while the hackathon itself remains open in those countries.
  - **Evidence:** https://dev.meta.ai/legal/geographic-use-policy (accessed 2026-10-20); https://reconscribe.com/meta-global-ai-developer-hackathon-2026/ (accessed 2026-10-20)
  - **Strength:** `practiced` — the policy page confirms the mechanism and lists the designated models, but **the specific country list is snippet-only from a third-party**; I could not read the country table off the policy page directly (it renders as a JS table). Treat the country list as unverified and check the policy page before publishing any availability claim.
  - **vibe-fence fit:** Two real consequences. (a) The **open-weights path is the universal path** — a self-hosted Glimmer works wherever the user's hardware does, with no country gate. That upgrades the Glimmer plan from "nice roadmap" to "the only genuinely worldwide deployment story." (b) If the demo is in a restricted country, the demo breaks. Build a **provider-fallback switch** and demo the API path from a compliant machine.

### 5.10 Muse Code subscriptions — pricing and Contributor default

- **Claim:** Four Muse Code plans: **Everyday Usage $5/mo** (Muse Spark, Muse Wonder, Muse Image; 10–50 prompts every 5 hours incl. image/video uploads; voice mode; web search), **High Usage $15/mo** (5×), **Power Usage $50/mo** (20× + Muse Wonder Full), **Maximum Usage $200/mo** (80×). "Muse Code subscriptions default to Contributor mode" and it can be turned off in settings. The subscription credential is for Muse Code only; other Model API keys are billed pay-as-you-go. Must be 18+ or the age of majority.
  - **Evidence:** https://dev.meta.ai/docs/muse-code/subscriptions (accessed 2026-10-20); https://dev.meta.ai/products/muse-code (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** The $5 Everyday plan is cheap enough to be a real "vibe-fence for Muse Code users" upsell. But note the default-Contributor behaviour: a Muse Code subscriber is training Meta by default unless they turn it off. For a *safety* product that is a bad default to inherit silently — vibe-fence's installer should detect and surface it.

---

### 5.11 Computer use — the one Meta capability that genuinely changes a UI-facing harness

- **Claim:** The `computer` tool is supported on the **Responses API only**. "The computer tool defines the action **protocol**, not an environment. There's no server-side virtual machine: Meta doesn't run a browser or desktop for you, and the model never touches a screen." The observe-act loop is: send task + initial screenshot → receive a `computer_call` output item carrying one or more actions → execute them in *your* environment → capture a fresh screenshot → return it as `computer_call_output` → repeat. The tool takes only a `type`; "There are no display-size or environment fields to configure."
  - **Evidence:** https://dev.meta.ai/docs/computer-use (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Muse Wonder is the model that drives it ("Give Muse Wonder, Meta's most capable model, a screen and let it drive"), and Muse Wonder's product page lists "advanced computer use" and "OSWorld V2.1 — agentic computer use" among its evaluated benchmarks. The vibe-fence use is concrete: **a non-technical user can point at their broken app and say "fix this," and an agent that can see and click can reproduce the bug before changing a line.** That is a genuinely different capability from a text agent, it is the "beyond a basic integration" beat the 25% Tooling criterion asks for, and it is *friction removal for the exact user vibe-fence targets*. Because you supply the environment, the driver and the safety, the harness owns the guardrails — which is the product. Cost caution: Wonder is $4/$20 per 1M and a computer-use loop is many turns; use it only for the "reproduce the user's reported bug" step, not for routine work.

### 5.12 The cookbook is a free, structured curriculum for the harness — use it as the build checklist

- **Claim:** Meta publishes a cookbook (also on GitHub at `meta-models/meta-model-cookbook`) with recipes organised as *API fundamentals* (chat-completions quickstart, streaming responses, tool and function calling, structured output, prompt caching, reasoning and thinking tokens, vision input, long context, error handling and retry, search grounding) and *agent patterns* (basic agent loop, interleaved reasoning and tool use, multi-turn context management). A dedicated *long context* recipe exists whose stated job is to "pack repo-scale context into a single context window" — exactly vibe-fence's use of the 1M window.
  - **Evidence:** https://dev.meta.ai/docs/cookbook (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Two concrete uses. First, the *long context* recipe is the reference implementation for the "fence sees the whole project" claim — copy its shape rather than reinventing repo packing. Second, the *error handling and retry* recipe ("back off with jitter and skip retries on client errors") is the correct pattern for the 429-handling the pricing page mandates, and is the same thing Meta documents for the `x-ratelimit-*` headers. Treat the cookbook as the harness's provider-layer test suite: each recipe is a fixture.

### 5.13 Muse Code's session UX — what the demo terminal will actually look like

- **Claim:** The interactive session is a terminal UI: "type a prompt to start a turn, watch the agent work, and steer it with slash commands." Slash commands are discovered with `/` (a command palette) and `/help` shows the full set; `/keymap` shows shortcuts. **Steering a running turn is a first-class interaction**: `Enter` injects text into the turn in progress ("The agent applies it on its next step"); `Alt+Enter` queues it for the next turn; `Esc` interrupts the current turn (it does not stop background terminals or subagents); `Esc` on an empty composer retracts the most recently queued instruction. Session management commands: `/new`, `/clear`, `/name`, `/resume`, `/resume --last`, `/fork`. Each run is "an append-only event log."
  - **Evidence:** https://dev.meta.ai/docs/muse-code/interactive (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Two things for the demo. First, `Enter`-to-steer means the *teaching dial* can be a live interaction: the harness shows an explanation mid-turn and the user can steer with a sentence — the "companion" claim becomes something you can watch, not a claim. Second, `/new` vs `/clear` differ only in scrollback, and "Neither changes on-disk memory or rules" — so the fence's `AGENTS.md` rules persist across sessions while the conversation resets, which is precisely the behaviour a harness wants (rules are durable, teaching is per-session). The append-only event log is also the natural substrate for vibe-fence's audit trail.

## 6. Findings — the hackathon: rubric, dates, and what actually wins

### 6.1 The rubric (from the waiver, not a blog)

- **Claim:** The Event Waiver states: "Hackathon Project submissions will be evaluated based on the following criteria: **Impact (30%)** — the real-world potential of the Project, who benefits, how much it matters, whether it could become something people use, and whether it fits one of the problem statements; **Use of Meta AI Tooling (25%)** — how creatively the team used Meta's AI tooling, whether they went beyond a basic integration, and whether they surfaced unexpected capabilities; **Technical Depth and Execution (20%)** …" and separately **Demo (25%)**. The waiver also states: "Participants build with Meta AI products, including **Muse Spark, Glimmer, SAM 3**, and any other Meta AI products identified on the Event page." The event page adds Muse Wonder to the lineup and names Muse Code. Track lenses: Indie = "creativity, technical ambition, and whether it works"; Startup = "technical execution and whether it holds up in production." Application-stage selection is separate: project idea and technical skill, **weighted equally**. Bonus prizes up to $50,000 (community vote / most viral). Prize split: Indie $400,000 (1st $150,000), Startup $550,000 (1st $250,000).
  - **Evidence:** https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver (accessed 2026-10-20); https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md (accessed 2026-10-20); https://dev.meta.ai/events/global-hackathon (accessed 2026-10-20); https://reconscribe.com/meta-global-ai-developer-hackathon-2026/ (accessed 2026-10-20); https://aimagazine.blog/meta-opens-its-1m-global-ai-developer-hackathon-20000-seats-150-api-credits-each-and-applications-close-october-25/ (accessed 2026-10-20)
  - **Strength:** `proven` for the weights and the waiver's tool list (waiver text fetched directly); `practiced` for the surrounding analysis.
  - **vibe-fence fit:** The waiver's named tools are "Muse Spark, Glimmer, SAM 3" — **Glimmer is named explicitly** and both siblings relegated it to a footnote. For an Indie project aiming at 30% Impact + 25% Tooling, the rubric rewards exactly the two-Model shape: **Muse Spark (hosted, hosted-by-Meta) + Muse Glimmer (open weights, on-device)**. That pairing is also the *honest* product story. Meanwhile "whether they went beyond a basic integration" is the clause that should kill a bolted-on SAM demo.

### 6.1b Meta's own framing of the hackathon, and the platform's GA status

- **Claim:** Meta's Connect 2026 recap frames the hackathon as "a global virtual hackathon. Build on Meta Model API, Muse Code or our open-weights models, with free Model API credits. Engineers and researchers from Meta Superintelligence Labs run hands-on technical workshops across the ten days. There are two tracks, one for indie developers and one for startup teams, and a $1M cash prize pool." It also states that **"Meta Model API is now generally available globally, with support and compliance for enterprise workloads through our first-party API and third-party partners,"** that **Muse Code is "now out of beta"** and available on Windows, and that **Muse Spark 1.3 is available through Oracle Cloud AI Platform, with availability on Google Cloud in private preview.** It positions Muse Glimmer as "an open-weights, 30B-parameter model designed to run on a single GPU or Mac Mini."
  - **Evidence:** https://developers.meta.com/blog/meta-connect-recap/ (accessed 2026-10-20)
  - **Strength:** `proven`
  - **vibe-fence fit:** Two usable facts. First, the recap's own Glimmer framing — **"designed to run on a single GPU or Mac Mini"** — is Meta's own confirmation of the on-device claim, which is the single strongest line for vibe-fence's privacy story: a non-technical user's Mac Mini can host the safety net. Second, "**workshops from Meta Superintelligence Labs**" tells you who the technical mentors are, which is where a judge-level question about a harness architecture would be best aimed.

### 6.2 Dates, format, and the two deadlines that matter

- **Claim:** Applications opened Oct 13, 9:00 AM ET; **applications close Oct 25, 11:59 PM ET** (or earlier if 20,000 places fill — rolling review, so effectively "as soon as your answers are ready"). Acceptance notifications by Oct 26, 9:00 AM ET. **Hackathon begins Oct 26** (kickoff livestream). **Live workshops Oct 27 – Nov 4** plus Discord office hours. **Submissions due Nov 4, 9:00 PM ET.** Judging Nov 4 – Nov 8. Closing ceremony + live finals + winners **Nov 9** (bonus prizes ~Nov 10). Format: **virtual only**, 10 days. Indie track: solo or teams of up to four; every teammate must apply and be accepted individually. Free to enter if selected. Not published as of the sources' dates: the full **Official Rules** (due before Oct 26 and must be accepted), the submission form fields, whether a code repo is required, and the live-finals format.
  - **Evidence:** https://dev.meta.ai/events/global-hackathon (accessed 2026-10-20); https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md (accessed 2026-10-20); https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver (accessed 2026-10-20); https://reconscribe.com/meta-global-ai-developer-hackathon-2026/ (accessed 2026-10-20); https://aimagazine.blog/meta-opens-its-1m-global-ai-developer-hackathon-20000-seats-150-api-credits-each-and-applications-close-october-25/ (accessed 2026-10-20)
  - **Strength:** `proven` (dates from the official event page and waiver)
  - **vibe-fence fit:** The **real deadline is Oct 25** — five days after this research — and the portal can close the moment 20,000 acceptances land. This stream's value is therefore mostly about the *build*, not the pitch: the integration plan in §8 must be executable in the 10 days from Oct 26. Also note the 10-day window is short enough that a plan requiring a self-hosted 816B model is dead on arrival; Glimmer 30B quantized is the only open-weights path that fits (and even that needs a partner credit).

### 6.3 What actually won a Meta hackathon before

- **Claim:** Meta's first-ever LlamaCon Hackathon (San Francisco, 2025): 238 developers from 600+ registrants, 24-hour build, $35K in cash, 44 submitted projects, two judging rounds to a top six. Challenge: "create a demonstrable project using the Llama API, Llama 4 Scout, or Llama 4 Maverick." Winners: **1st — OrgLens**, an AI-enabled expert-matching system that analysed Jira tasks, GitHub code and issues, internal documents and resumes into a knowledge graph, letting users search for experts and interact with a person's "digital twin" before reaching out; demo built with React, Tailwind and Django on the GitHub API + Llama API. **2nd — Compliance Wizards**, an AI transaction analyzer for fraud detection with email alerts and a voice assistant for reporting/acknowledgement, using Llama API multimodality to upload client documents and search relevant news. **3rd — Llama CCTV Operator**, which let operators define surveillance events "in simple language" and used Llama 4 multimodal image understanding to detect them "without requiring any model fine-tuning." **Best Llama API Usage — Geo-ML**, which used Llama 4 Maverick's long context to parse dense geology reports into 3D mineral-site models; a team also fine-tuned a Llama 4 Maverick using Meta's Synthetic Data Generation tool. Sponsors (Groq, Crew AI, Tavus, Lambda, Nebius, SambaNova) each provided credited usage, workshops, mentorship, judges and Discord support.
  - **Evidence:** https://ai.meta.com/blog/llamacon-hackathon/ (accessed 2026-10-20)
  - **Strength:** `proven` (Meta's own winners post, fetched directly)
  - **vibe-fence fit:** **Four patterns transfer directly, and they are not the ones the sibling files guessed:**
    1. **All four winners solved a real internal-work problem** — expert matching, compliance, CCTV monitoring, geology reports. None was a consumer chatbot. This is the "Build for Your World" theme made concrete, and it is the strongest predictor of the 30% Impact score. vibe-fence's "non-technical builders get a safe companion" is a real-work problem; it must be *shown* with a real person's real (sanitised) project, not a toy.
    2. **Long context was a winning technique, not a checkbox.** Geo-ML won *Best Llama API Usage* specifically by using the long context window to turn a pile of documents into a domain-specific structured output. The parallel for vibe-fence: the 1M window holds the whole repo, and the winning move is a *structured artifact* extracted from it (a project health report, a risk map) — not a chat answer.
    3. **"Defined in simple language" is the winning UX.** Llama CCTV Operator's whole pitch is "operators define events in simple language." That is *the same move* as vibe-fence's teaching dial: the non-technical user describes intent in their own words; the model translates. This is the strongest prior-art available for vibe-fence's core claim, and it should be cited in the submission.
    4. **Every winner shipped a real web app with a real frontend** (React/Tailwind/Django; videos on YouTube). The "does it hold up live" Demo criterion is won by a polished, obviously-working product, not by an agent transcript.
    5. **Open weights + fine-tuning was a strength, not a consolation prize** (the fine-tuned Maverick team was called out explicitly in the winners post). Glimmer fine-tuned on "explain this guardrail violation at max/med/min/silent" pairs is a legitimate, documented path.

### 6.4 Judging advice and the demo-video discipline

- **Claim:** Third-party guidance on this specific hackathon notes: "Include a working demo and a demo video, because the demo, live and on video, is a quarter of the score"; "The video length is not stated"; "Script and record your demo video a couple of days before the deadline, then use the time left for fixes"; "Judges meet the project mostly through the demo video, a short recording of it working, so plan the video before you build"; "Keep the demo video under three minutes, public, and free of any copyrighted music"; and on cost: "At Standard Muse Spark rates, 10 million input tokens and 2 million output tokens cost $12.50 plus $8.50, or $21, so check your usage daily and avoid repeating identical calls." Another source's read on what stands out: "Use several Meta models together… a project combining Muse Spark with Voice Transcribe, Image or SAM 3.1 shows off the platform far better than a text-only chatbot"; "Be agentic, not just chat — Muse Spark 1.3 is pitched for agentic workflows; show it taking actions"; "Show an open-weights or on-device angle with Muse Glimmer when privacy matters."
  - **Evidence:** https://reconscribe.com/meta-global-ai-developer-hackathon-2026/ (accessed 2026-10-20); https://reconscribe.com/hackathons/ (accessed 2026-10-20); https://thegenaimagazine.com/meta-global-ai-developer-hackathon-ideas-prizes (accessed 2026-10-20)
  - **Strength:** `practiced` — practitioner guidance, not RCT. The token-cost arithmetic is checkable and I verified it against the official pricing page (10M in × $1.25 = $12.50; 2M out × $4.25 = $8.50; total $21.00 — correct).
  - **vibe-fence fit:** Two things to steal literally. First, **"be agentic, not just chat"** — the demo must show Spark *taking actions* (writing the fence rule, blocking the commit, queuing the fix), not explaining. Second, **"show an open-weights or on-device angle with Muse Glimmer when privacy matters"** — privacy is precisely vibe-fence's domain, so the Glimmer angle is not a checkbox, it is the *narrative*. And the cost arithmetic is a real planning input: the $150 credit is roughly 7× the cost of that token volume, so a 10-day build has room — but a naive "re-send the whole repo every turn" habit would eat it. Cache the prefix.

---

## 7. Contradictions with the sibling contributor files

| # | Sibling claim | Verdict | Primary source |
|---|---|---|---|
| 1 | Gemini: "SAM 3.1 segments the screenshot into discrete UI regions (e.g. `navbar`, `sidebar`, `hero_card`)" and hands "structured visual topology" to Spark. Endpoint given as `/v1/cv/sam-3.1/segment`. | **Wrong on three counts.** SAM returns *boxes and masks*, never semantic names. There is **one concept per request** (`"bus, bicycle"` → zero matches). The endpoint is `POST /v1/responses` with `model: "sam-3.1"` — `/v1/cv/sam-3.1/segment` does not appear in the API reference or docs. | [21][22][23] |
| 2 | Gemini: "SAM 3.1 is an open-weight model from Meta" (fine) but lists its API under "Meta Model API vision endpoints" with high scoring leverage ("High if framed authentically"). | **Overrated.** The rubric clause is "went beyond a basic integration" and "surfaced unexpected capabilities." A forced SAM integration does neither. | [4][6][24] |
| 3 | Muse Spark sibling: SAM 3.1 supports "**object multiplexing** — up to 16 objects in one forward pass (32 fps on H100, 2× over SAM 3)". | **Partly wrong, partly unverifiable.** The 16-object limit is real but it applies to *prompted objects* (box/point prompts), not to multi-concept detection. The 32 fps / H100 / "2× over SAM 3" throughput figures do not appear on any official Model API page I fetched. | [22] |
| 4 | Muse Spark sibling: "Muse Spark is Meta's frontier multimodal reasoning + agentic model family" and treats it as the top model. | **Incomplete.** Muse Wonder is "Meta's most capable model" and Meta's own agent guides use it for the main loop. Spark is explicitly the cost/latency choice. | [1][15][16] |
| 5 | Muse Spark sibling: "Muse Code … is a terminal coding agent powered by Muse Spark 1.2+" with "fan-out … in an isolated git worktree" and bundled `/plan`, `/grill`, `/goal` skills. | **Partly unverifiable.** Worktree isolation is confirmed (per-child, Muse Code-managed). But `/plan`, `/grill`, `/goal` and the "MSP over stdio TypeScript SDK" are **not** on any official page I fetched; the documented feature set is subagents, workflows, session messaging, rewind, AGENTS.md/CLAUDE.md, skills/rules/hooks, permissions, headless `muse exec`. I could not confirm the slash-command set. | [27][30][32][33][34] |
| 6 | Muse Spark sibling: recommends claiming Contributor pricing "early" as a cost bullet. | **Incomplete and product-risky.** Contributor mode means "your content may be used to train future Meta models," and "content" includes the user's prompts, code, files and context. For a product whose pitch is code safety, this is a material caveat that must be disclosed, not a free 12.5× win. | [3] |
| 7 | Both siblings: Muse Glimmer described as ~30B Apache-2.0, relevant only as a "roadmap" item. | **Right about the facts, wrong about the priority.** Glimmer 30B at 17–20 GB quantized with Ollama/llama.cpp support is the *only* self-hostable Meta open-weights model, and the waiver names Glimmer explicitly. It is the privacy/offline path, and the rubric's "on-device" reading of the demo. | [6][38][39] |
| 8 | Gemini: "Muse Spark … scoring ~80% on Terminal-Bench". | **Unverifiable from Meta sources.** The Terminal-Bench 4.0-AA figure I found is for **Muse Wonder** on Meta's own page, and the model card flags competitor baselines as "best-effort." Do not attribute a Terminal-Bench number to Muse Spark. | [25][26] |
| 9 | Gemini: endpoint `https://api.meta.ai/v1/chat/completions` for the companion brain. | **Works but is the weaker path.** Meta's docs say the Responses API "is the recommended path for tool calling and multi-turn agents: it preserves reasoning across tool turns." | [7][8] |
| 10 | Both siblings: no mention of `tool_search`, `reasoning_effort: "none"` → HTTP 400, or the recursive-schema → HTTP 400 limit. | **Omissions that will break an implementation.** All three are documented constraints on the exact features vibe-fence needs (large tool surface, silent mode, nested issue-queue structure). | [9][11][12] |
| 11 | Both siblings: recommend `previous_response_id` for session state in the Responses API. | **Backwards.** The docs mark **stateless encrypted reasoning replay** as the *recommended* mode — "Nothing is stored server-side" — with `previous_response_id` as the server-managed *alternative*. Both siblings also missed that the Responses API is the **only** endpoint that carries chain of thought across turns. For a "your code stays yours" product, stateless is both the documented default and the better privacy story. | [7] |
| 12 | Both siblings: no mention of **Muse Code loads `AGENTS.md` / `CLAUDE.md` / `.agents/AGENTS.md` / `.claude/CLAUDE.md` per directory level**, with project-over-user and deeper-over-shallower precedence, loading only after workspace trust. | **The single most important omission.** vibe-fence's core file format is already a first-class Muse Code contract, so the "Muse Code adapter" reduces to writing files rather than building a plugin. Also carries a safety rule Meta states explicitly: treat a repo's `MEMORY.md` as a prompt-injection surface. | [29][28] |
| 13 | Both siblings: no mention of Muse Code's **approval + OS sandbox** layers, staged compound-command review, and the read-only `.git` / `.muse` / `.agents` guarantee. | **Material to positioning.** It means vibe-fence cannot claim "we add approvals and sandboxing for Muse Code" — that is false. The honest claim is portability across runtimes + the teaching/detection layer Meta doesn't provide. | [28] |
| 14 | Muse Spark sibling: Muse Code has "bundled skills: `/plan` (approval-gated plan), `/grill` (stress-test plan), `/goal`". | **Partly confirmed, partly not.** `/plan` appears in the official interactive docs; `/grill` and `/goal` do not appear on any official page I fetched. The documented command set is `/`, `/help`, `/keymap`, `/new`, `/clear`, `/name`, `/resume`, `/fork`, `/stop`, `/models`, `/effort`, `/theme`, `/subagents`, `/tasks`, `/workflows`, `/login`. | [34][29] |
| 15 | Both siblings: no mention of the `computer` tool (Responses API only) or Muse Wonder's computer-use benchmark line. | **A missed "beyond basic integration" beat.** A non-technical user who says "fix this" and watches an agent see and click their broken app is a materially different demo — and because Meta supplies only the action protocol, the harness owns the environment and the safety, which is the product. | [17][25] |

---

## 8. Gaps / unknowns (explicitly not asserted above)

1. **SAM 3.1 throughput.** No official Model API page states a frames-per-second, latency, or hardware figure. The "32 fps on H100, 2× over SAM 3" claim in the Muse Spark sibling file is **unverified** — I could not confirm it on any official page and do not repeat it. The only confirmed SAM limits are the 16-prompted-object cap and the 400-error list.
2. **Muse Image maximum output resolution.** The Muse Spark sibling file states "up to 1600 px." I found no pixel cap in the official image-generation or pricing docs. The documented response fields are `output_format` and `background`; I did not verify a resolution constraint either way.
3. **SAM 3.1 "visual prompts are research-model only."** The Muse Spark sibling file says box/point prompts are research-only and the API is text-concepts-only. **This is wrong** — the official segmenting guide documents box and point prompts as a first-class API input mode ("A request names what to segment in its `input_text` part in one of two ways, never both: a concept prompt… or box and point prompts"). The click-to-teach design in §4.5 depends on this. I could not determine whether *pixel-accurate* masks (as opposed to the box/point region) are available in the API — the API's masks come from the segmenter, and I did not find a statement that API callers can supply their own masks.
4. **Geographic country list is snippet-only.** The policy page confirms the mechanism and lists designated models, but the country table renders client-side and I could not read it. The specific blocked countries (Pakistan, Ethiopia, Venezuela, Iraq, Cambodia; plus Muse Image in India) come from Reconscribe and are **unverified against the policy text**.
5. **Exa backend rate limiting.** The keyless Exa extractor returned HTTP 429 on several requests during this run. I fell back to `curl` against the same canonical URLs on `dev.meta.ai` (which serves clean markdown at the `.md` variants) and to `web_search` snippets. **No claim in this file rests on a snippet alone** except the two flagged as `practiced`/snippet-only (the country list above, and the Reconscribe judging-advice quotes, whose substantive numbers I re-verified against the waiver and pricing page).
6. **Muse Code slash-command set.** I could not confirm `/grill` or `/goal` from official pages (the sibling file's claim). `/plan` *does* appear in the official interactive docs. The documented surfaces are: `/` (palette), `/help`, `/keymap`, `/new`, `/clear`, `/name`, `/resume`, `/resume --last`, `/fork`, `/stop`, `/models`, `/effort`, `/theme`, `/subagents`, `/tasks`, `/workflows`, `/login`. Treat any other command as unverified.
7. **Muse Code SDK.** The sibling file describes a "TypeScript, MSP over stdio" SDK in developer preview. I found MCP support in the extending docs (remote MCP servers, OAuth, `muse mcp login`) but did not find a first-party Muse Code SDK page. **Unverified.**
8. **Muse Glimmer release date.** The sibling file says "announced Aug 2026." The official Glimmer pages give no date. **Unverified.**
9. **Muse Wonder Full pricing/benchmarks on Model API.** Muse Wonder Full is not on Model API at all (Muse Code subscription only), and its benchmark row is vendor-reported against best-effort competitor baselines. Not usable as an independent comparison.
10. **Official Rules not yet published.** The submission form's field list, whether a code repo is required, the demo video length limit, and the live-finals format are all unknown until the Rules appear (due before Oct 26). The video-length guidance is third-party advice, not a rule.
11. **`muse init` vs `AGENTS.md` conflict.** `muse init` writes `AGENTS.md` and refuses to overwrite without `--force`. vibe-fence's installer writes `AGENTS.md` too — the two will collide if a user runs both. **Design note, not a documented constraint:** vibe-fence's installer should detect an existing `AGENTS.md` and merge rather than clobber, and should be the one that writes it.
12. **No live API call was made.** I could not exercise `api.meta.ai` (no key available in this environment), so every API fact here is documentation-derived, not execution-verified. Rate limits, error shapes and pricing are quoted from the official pricing and reference pages, not observed.

---

## 9. Sources

| # | Source | URL | Date Accessed |
|---|--------|-----|---------------|
| 1 | Models — Meta Model API (docs) | https://dev.meta.ai/docs/models | 2026-10-20 |
| 2 | Overview — Get started with Meta Model API and Muse Code (docs) | https://dev.meta.ai/docs/overview | 2026-10-20 |
| 3 | Pricing and rate limits — Meta Model API (docs) | https://dev.meta.ai/docs/pricing-rate-limits | 2026-10-20 |
| 4 | Win $1M: Meta Global AI Developer Hackathon (event page) | https://dev.meta.ai/events/global-hackathon | 2026-10-20 |
| 5 | Meta Global AI Developer Hackathon — official markdown listing | https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md | 2026-10-20 |
| 6 | Application and Event Overview and Event Waiver | https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver | 2026-10-20 |
| 7 | Responses API — Meta Model API (protocols) | https://dev.meta.ai/docs/protocols/responses | 2026-10-20 |
| 8 | Tool calling — Meta Model API (docs) | https://dev.meta.ai/docs/tool-calling | 2026-10-20 |
| 9 | Structured output — Meta Model API (docs) | https://dev.meta.ai/docs/structured-output | 2026-10-20 |
| 10 | Search grounding — Meta Model API (docs) | https://dev.meta.ai/docs/search-grounding | 2026-10-20 |
| 11 | Tool search — Meta Model API (docs) | https://dev.meta.ai/docs/tool-search | 2026-10-20 |
| 12 | Reasoning — Meta Model API (docs) | https://dev.meta.ai/docs/reasoning | 2026-10-20 |
| 13 | Prompt caching — Meta Model API (docs) | https://dev.meta.ai/docs/prompt-caching | 2026-10-20 |
| 14 | Quickstart — Meta Model API (docs) | https://dev.meta.ai/docs/quickstart | 2026-10-20 |
| 15 | Use Model API with coding agents (docs) | https://dev.meta.ai/docs/coding-agents | 2026-10-20 |
| 16 | Agent frameworks (docs) | https://dev.meta.ai/docs/agent-frameworks | 2026-10-20 |
| 17 | Build a computer-use agent (docs) | https://dev.meta.ai/docs/computer-use | 2026-10-20 |
| 18 | Cookbook — Meta Model API (docs) | https://dev.meta.ai/docs/cookbook | 2026-10-20 |
| 19 | Image generation with Muse Image (docs) | https://dev.meta.ai/docs/image-generation | 2026-10-20 |
| 20 | Muse Image — model page | https://dev.meta.ai/models/muse-image | 2026-10-20 |
| 21 | Segmentation with SAM — Meta Model API (docs) | https://dev.meta.ai/docs/sam/overview | 2026-10-20 |
| 22 | Segmenting with prompts — SAM 3.1 (docs) | https://dev.meta.ai/docs/sam/segmenting | 2026-10-20 |
| 23 | Media segmentation — Meta Model API (docs) | https://dev.meta.ai/docs/media-segmentation | 2026-10-20 |
| 24 | SAM 3.1 — model page | https://dev.meta.ai/models/sam-3-1 | 2026-10-20 |
| 25 | Muse Wonder — model page | https://dev.meta.ai/models/muse-wonder | 2026-10-20 |
| 26 | Muse Wonder Model Card (PDF) | https://research.meta.ai/static/muse-wonder-model-card | 2026-10-20 |
| 27 | Muse Code — overview (docs) | https://dev.meta.ai/docs/muse-code | 2026-10-20 |
| 28 | Permissions and safety — Muse Code (docs) | https://dev.meta.ai/docs/muse-code/permissions | 2026-10-20 |
| 29 | Configuration and context — Muse Code (docs) | https://dev.meta.ai/docs/muse-code/configuration | 2026-10-20 |
| 30 | Extending and automating — Muse Code (docs) | https://dev.meta.ai/docs/muse-code/extending | 2026-10-20 |
| 31 | Subscriptions — Muse Code (docs) | https://dev.meta.ai/docs/muse-code/subscriptions | 2026-10-20 |
| 32 | Run multi-agent workflows — Muse Code (docs) | https://dev.meta.ai/docs/muse-code/workflows | 2026-10-20 |
| 33 | Session messaging — Muse Code (docs) | https://dev.meta.ai/docs/muse-code/session-messaging | 2026-10-20 |
| 34 | Working with the agent — Muse Code (docs) | https://dev.meta.ai/docs/muse-code/interactive | 2026-10-20 |
| 35 | Muse Code — product page | https://dev.meta.ai/products/muse-code | 2026-10-20 |
| 36 | Muse Spark Open — open-weight overview (docs) | https://dev.meta.ai/docs/muse-spark-open | 2026-10-20 |
| 37 | Run inference — Muse Spark Open (docs) | https://dev.meta.ai/docs/muse-spark-open/deploy | 2026-10-20 |
| 38 | Muse Glimmer — open-weight overview (docs) | https://dev.meta.ai/docs/muse-glimmer | 2026-10-20 |
| 39 | Run inference — Muse Glimmer (docs) | https://dev.meta.ai/docs/muse-glimmer/deploy | 2026-10-20 |
| 40 | Open-weight models (docs) | https://dev.meta.ai/docs/open-weight-models | 2026-10-20 |
| 41 | Model Designation and Geographic Use Policy | https://dev.meta.ai/legal/geographic-use-policy | 2026-10-20 |
| 42 | Meet the winners of our first-ever LlamaCon Hackathon — AI at Meta | https://ai.meta.com/blog/llamacon-hackathon/ | 2026-10-20 |
| 43 | Meta AI Developer Hackathon 2026: $1M Prizes, Rules, Dates — ReconScribe | https://reconscribe.com/meta-global-ai-developer-hackathon-2026/ | 2026-10-20 |
| 44 | Meta Opens Its $1M Global AI Developer Hackathon — AImagazine | https://aimagazine.blog/meta-opens-its-1m-global-ai-developer-hackathon-20000-seats-150-api-credits-each-and-applications-close-october-25/ | 2026-10-20 |
| 45 | Hackathons 2026: Online Contests Worldwide — ReconScribe | https://reconscribe.com/hackathons/ | 2026-10-20 |
| 46 | Meta Connect 2026: The end-to-end recap — Meta for Developers | https://developers.meta.com/blog/meta-connect-recap/ | 2026-10-20 |
| 47 | Meta Global AI Developer Hackathon: $1M Prizes, Eligibility, 12 Winning Ideas — The GenAI Magazine | https://thegenaimagazine.com/meta-global-ai-developer-hackathon-ideas-prizes | 2026-10-20 |

---

## 10. Integration plan for vibe-fence (concrete)

### 10.1 Model routing — two Meta models, two jobs, one base URL

| Tier | Model | Job inside vibe-fence | Endpoint | Why this model |
|---|---|---|---|---|
| **T0 — Plan & verify** | `muse-wonder-1.0` | The `vibe-plan` gate: decompose the user's vague request into a scoped, file-level plan; then **verify** the agent's result against the plan. Also the "hard case" escalation (a task that fails Spark's first pass). | `POST /v1/responses` | Meta's most capable coding model; plans/delegates/verifies across files. 1M context. |
| **T1 — Everyday brain** | `muse-spark-1.3` | The companion voice: guardrail classification (block/warn/nudge), teaching-dial explanations, issue-queue drafting, secret-scan triage, dependency-check triage. | `POST /v1/responses` | Same endpoints, same request shape — a model-ID swap. 3.2× cheaper than Wonder, 3,000 RPM. |
| **T2 — Local classifier** | `muse-glimmer-30B` (self-hosted, Apache-2.0) | High-volume, low-latency, privacy-sensitive classification: "does this diff contain a secret?", "which guardrail category?", "does this explanation need the max dial?" — runs on the user's own machine or a Baseten/Modal sandbox. | local OpenAI-compatible server (Ollama / llama.cpp / vLLM / SGLang) | 17–20 GB quantized, 128K context, permissive licence, no country gate, no per-call cost, code never leaves the machine. |
| **T3 — Assets** | `muse-image-1.0` | `vibe-asset`: placeholder images, hero/OG card, favicon, teaching diagrams. | `POST /v1/images/generations` | $0.01/image, `b64_json`+webp straight to disk, agentic (searches, runs code, builds layouts), edits only what you ask for. |
| **T4 — Optional (Sprint 6+)** | `sam-3.1` | Click-to-teach UI audit only. | `POST /v1/responses` (`model: "sam-3.1"`) | Honest geometry, not semantics. $0.0025 per screenshot. **Not in the critical path.** |

### 10.2 The single most important implementation decision: `AGENTS.md` *is* the wire format

vibe-fence should emit, into any repo it installs into:

```
AGENTS.md                     # the fence's rules, at the repo root
.agents/AGENTS.md             # optional per-directory overrides (fence-native precedence)
.agents/memory/MEMORY.md       # durable project facts the agent should know (deploy steps, why a workaround exists)
.fence/config.json            # vibe-fence's own state: teaching dial, profile, queue
.fence/queue.json             # the issue → solution → plan queue
```

This works today, with no Meta-side code, because Muse Code loads `AGENTS.md` / `CLAUDE.md` / `.agents/AGENTS.md` / `.claude/CLAUDE.md` per directory level with project-over-user and deeper-over-shallower precedence. **vibe-fence is not a Muse Code plugin — it is a policy layer that Muse Code already knows how to read.** That is the cheapest, most robust, and most demo-legible integration available.

**But adopt Meta's own injection warning:** `MEMORY.md` is read even in untrusted workspaces, while skills/rules/hooks load only after trust. So vibe-fence must:
1. Never put secrets in `.agents/memory/` — treat it as a prompt-injection surface.
2. Write `AGENTS.md` rules, not memory, for anything security-critical, so they only load in a trusted workspace.
3. Surface a `vibe-fence doctor` check that flags "this repo's AGENTS.md is untrusted."

### 10.3 The API call shape (this is the code you will write)

```
User prompt
  → vibe-fence intercept (src/framework/intercept.ts)
    → T2 LOCAL: muse-glimmer-30B  → fast classification
        { needs_explanation: bool, guardrail_category: "security"|"git"|"deploy"|"hygiene",
          severity: "block"|"warn"|"nudge", dial_level: "max"|"med"|"min"|"silent" }
    → T1 API: muse-spark-1.3 via POST /v1/responses
        mode: STATELESS encrypted reasoning replay (recommended) — replay the
              `reasoning` items each turn; nothing stored server-side.
              Use previous_response_id ONLY for Muse Image multi-turn refine.
        tools: [ {type:"web_search"} ]  (only when severity != "silent")
        tools: [ {type:"namespace", name:"fence", tools:[ ...deferred guardrail tools... ]} ,
                 {type:"tool_search"} ]
        text.format: { type:"json_schema", schema: FLAT_SCHEMA }   ← not recursive
        output: { plan[], findings[], teaching_note, queue_entry }
    → T0 API (escalation only): muse-wonder-1.0 → plan/verify pass
    → T3 API: muse-image-1.0 (init + asset requests only) → write b64_json to public/
    → agent executes (Muse Code / Claude Code / Codex / Cursor / OpenCode)
    → post-run: vibe-fence scans the diff (T2 local) → queue entries → agent resolves them
```

**Three constraints that come straight from the docs and will bite if ignored:**
- `text.format` schema must be **flat** (no recursive issue→solution→plan nesting) or you get HTTP 400.
- `tool_search` **cannot** be combined with `json_schema` on the same request — run tool search first, structured output on a follow-up turn.
- `reasoning_effort: "none"` is a **400**. "Silent" mode = don't call the model (or use the local T2 classifier to decide), not `none`.
- The Responses API is the **only** endpoint that carries chain of thought across turns. Use the **stateless encrypted replay** mode (the documented recommendation, and the privacy-correct one) rather than `previous_response_id` for anything touching user code.

### 10.4 What the demo shows (90 seconds, mapped to the rubric)

| Beat | What happens | Model(s) | Rubric |
|---|---|---|---|
| 0:00–0:20 | **The problem, in a user's words.** A non-technical person asks an agent to "add login to my app." Nothing else on screen. | — | Impact 30% |
| 0:20–0:45 | **Without the fence:** the agent writes a secret to `NEXT_PUBLIC_`, creates no tests, commits to `main`. The diff is shown. | Muse Spark 1.3 as the agent | Demo 25% |
| 0:45–1:05 | **The fence intercepts.** Muse Spark 1.3 (T1) returns a structured finding via `text.format`: severity `block`, category `security`, plus a *teaching note* at the `med` dial. The harness blocks the commit, opens a git checkpoint, and queues the fix. | Muse Spark 1.3 | Tooling 25% |
| 1:05–1:25 | **The agent resolves it itself.** The queued fix is applied by the agent (Muse Code in the demo), tests are added, the commit lands on a branch. | Muse Code / Muse Spark 1.3 | Technical Depth 20% |
| 1:25–1:40 | **The "unexpected capability" beat.** Show the *same* guardrail set on a **local** Muse Glimmer 30B instance — the privacy claim made literal: the secret-scan that caught the leak never left the machine. | Muse Glimmer 30B (self-hosted) | Tooling 25% + Impact 30% |
| 1:40–1:50 | **The ground truth.** The one request that makes the harness worth something: *"I want to ship this to the public. Am I safe?"* Spark (T1) answers with `web_search`-grounded citations to real OWASP/framework docs, at the `max` dial. | Muse Spark 1.3 + web_search | Impact 30% + Demo 25% |
| *(optional 15s)* | **The "they see what I see" beat.** The user says *"fix this"* and points at the broken button. A `computer` tool loop (Responses API only) reproduces the bug before a line changes. | Muse Wonder + `computer` tool | Tooling 25% |
| 1:50–1:55 | **Closing.** "Hosted on Meta Model API today. Your code stays on your machine tomorrow." | — | — |

**The 1:25 beat is the one that wins.** It is a Meta capability (Glimmer, open weights, named in the waiver) used in a way a generic harness entry would never attempt, and it serves the "Build for Your World" theme *literally* — a non-technical person in a country where the Model API is unavailable, or with a source-code NDA, gets the safety net anyway.

**Do NOT put SAM 3.1 in the 90 seconds.** If you want breadth, put it in the *repo* as a 20-second appendix clip (click-to-teach UI audit, §4.5) and in the README as an honest "we evaluated SAM 3.1 and here's exactly where it fits" paragraph. That paragraph — naming the one-concept-per-request limit and the no-semantic-labels limit — will read as engineering judgment to a technical judge, which is worth more than the points a bolted-on demo could win.

### 10.5 The eval story (the "Impact + Technical Depth" spine)

The demo *is* the eval. Build a 5-task × 4-rubric table and run it with and without the fence, same agent, same prompts:

| Task | Structure | Secrets | Git hygiene | Deploy correctness |
|---|---|---|---|---|
| Add auth | | | | |
| Add a paid API | | | | |
| Fix a bug | | | | |
| Ship to prod | | | | |
| Add a dependency | | | | |

Judge it with Muse Spark as the rubric grader **plus** a deterministic checker (a real secret regex, a real branch check) — a deterministic metric makes the table credible in a way a model's opinion does not. This is the "Benchmarks and Evals" specialization the judges will look for, and it costs hours, not days.

### 10.6 Week-by-week build order (10 days, Oct 26 – Nov 4)

| Days | Deliverable | Model dependency |
|---|---|---|
| 1–2 | `npx vibe-fence init` → `AGENTS.md` + `.fence/` + Muse Code adapter. Prove Muse Code picks up the fence. | none (files only) |
| 2–3 | T1 client: `muse-spark-1.3` via `/v1/responses`, flat JSON schema, `text.format`. | Model API key |
| 3–4 | Guardrail rules + teaching dial (T1) + `web_search` grounding. | Model API key |
| 4–5 | T2 local: `muse-glimmer-30B` via Ollama on a 24 GB machine; secret-scan + severity classification. | Glimmer weights (~20 GB) |
| 5–6 | T0 `muse-wonder-1.0` plan/verify escalation path. | Model API key |
| 6–7 | Issue queue → agent resolves → git checkpoint flow. | none |
| 7–8 | Demo app (the "bad" vibe-coded project + the fenced version) + `vibe-asset` (T3) for the OG card. | Model API key |
| 8–9 | The 5-task eval table. **Record the demo video.** | — |
| 9–10 | README, submission form, buffer. Re-record the video if a fix landed. | — |

---

## 11. Implications for vibe-fence (numbered, with integration priorities)

**Priority legend:** 🔴 P0 = must-have, blocks the submission · 🟠 P1 = high-value, do if time · 🟡 P2 = only if the P0/P1 are done and solid · ⚪ P3 = roadmap slide only.

1. 🔴 **Adopt a two-model Meta architecture: Muse Wonder for plan-and-verify, Muse Spark 1.3 for everything else.** They take the same requests on the same endpoints — moving between them is a model-ID change — so the harness gets a capability dial for free. Wonder (Meta's most capable coding model, used by Meta's own agent guides for the main loop) earns its 3.2× price on the plan/verify gate, where a wrong plan costs the user real work; Spark 1.3 handles classification, teaching and triage at volume. Neither sibling contributor file proposed this split. [1][15][16][25]
2. 🔴 **Do not ship Contributor mode as the default, and disclose it if you offer it.** Contributor mode is $0.10/$0.20 per 1M — a 12.5× cut — but Meta's own wording is that your "prompts, code, files, and context," plus the responses, "may be used to train future Meta models." A harness that ships a user's source code into a training set as a *default* contradicts its own thesis. Use Standard for anything touching user code; offer Contributor as an explicit, clearly-labelled toggle for synthetic content only. Also: Contributor is 150 RPM vs 3,000 RPM — the demo's hot path should be Standard regardless. [3][2]
2b. 🔴 **Use the stateless encrypted-reasoning-replay mode, not `previous_response_id`, for anything touching user code.** The Responses API is the only endpoint that carries chain of thought across turns, and Meta marks stateless replay — "Nothing is stored server-side" — as the *recommended* mode, with `previous_response_id` as the server-managed alternative. Both sibling contributor files recommend `previous_response_id`; that is the less private of the two options and is not Meta's recommendation. Reserve `previous_response_id` for Muse Image's multi-turn refine flow, where the docs explicitly call for it. [7]
3. 🔴 **Flatten the issue-queue schema, and never combine `tool_search` with `text.format` on one request.** Recursive JSON Schemas return HTTP 400, and `tool_search` + `json_schema` also returns HTTP 400. The issue→solution→plan structure is naturally recursive — flatten it to a fixed depth. If you use tool search, run it on an earlier turn. [9][11]
4. 🔴 **Implement "silent" as *not calling the model*, not as `reasoning_effort: "none"`.** `"none"` returns HTTP 400 on both Muse Wonder and Muse Spark. Map the teaching dial onto `minimal`/`low`/`medium`/`high`/`max` (and note `"max"` is unavailable on `muse-spark-1.3-contributor`) — and for the silent mode, let the *local* Glimmer classifier decide, or skip the call. [12][1]
5. 🟠 **Namespace the guardrail tools and turn on `tool_search`.** vibe-fence wants a large tool surface (one tool per guardrail). Loading every definition every turn is exactly the cost `tool_search` removes, and it preserves the cache prefix when tools load. Keep each namespace under ~10 functions. This is a documented Meta capability that most hackathon entrants will not use — a clean, defensible "beyond a basic integration" story for the 25% Tooling criterion. [11]
6. 🟠 **Write the fence's `AGENTS.md` and let Muse Code read it natively.** Muse Code loads `AGENTS.md` / `CLAUDE.md` / `.agents/AGENTS.md` / `.claude/CLAUDE.md` per directory level, project-over-user and deeper-over-shallower. The Muse Code adapter becomes "emit the right files" instead of "build a plugin" — which is the difference between shipping a Muse Code integration in 10 days and not. Make `AGENTS.md` the canonical fence format across *all* adapters, and make `npx vibe-fence init` merge rather than clobber an existing `AGENTS.md` (Meta's `muse init` also writes one, and refuses to overwrite without `--force`). [29][27]
7. 🟠 **Adopt Meta's own prompt-injection rule for the fence's state files, and ship it as a feature.** Meta's docs say project `MEMORY.md` is read even in untrusted workspaces while skills/rules/hooks load only after trust, and explicitly say to "treat a repo's MEMORY.md as a prompt-injection surface." vibe-fence should put security-critical rules in `AGENTS.md` (trust-gated), keep `MEMORY.md` non-sensitive, and add a `vibe-fence doctor` check for untrusted checkouts. Also copy Meta's session-messaging rule: **a message from another session must never be able to approve a tool or change permissions** — that is a concrete, testable guardrail rule for the harness. [29][28][33]
8. 🟠 **Position vibe-fence as the *portable* guardrail layer, not "better approvals."** Muse Code already sandboxes execution, asks before risky actions, reviews compound shell commands stage by stage, and makes `.git`, `.muse` and `.agents` read-only to the agent. Claiming vibe-fence adds approvals/sandboxing *for Muse Code* would be false and a technical judge would catch it. The honest and stronger claim: Meta's agent has excellent guardrails; **the user's other agent does not.** vibe-fence makes the same policy portable across Claude Code, Codex, Cursor and OpenCode — and adds the layer Meta doesn't provide: *explanations* (teaching), *detection* (a secret in an already-written file, not a dangerous command), and portable *project policy*. [28]
9. 🟠 **Make Muse Glimmer the on-device safety net, not a footnote.** The Muse Spark Open 816B model needs 8× B300 / ~2 TB VRAM and is not self-hostable by a hackathon team; **Glimmer 30B is 17–20 GB quantized, Apache-2.0, with Ollama/llama.cpp/vLLM/SGLang support and a 128K context.** Use it for high-volume local classification (secret detection, severity, dial selection). Two payoffs: the "your code never leaves your machine" claim becomes literally true for the sensitive path, and the waiver names Glimmer explicitly. The $100 Baseten + $100 Modal + $25 Fireworks partner credits are *specifically for the open-weights models* — spend them here. [6][38][39][5]
10. 🟠 **Do the 5-task with/without eval table and put it in the submission.** Demo is 25% and judges mostly see the video; a small, deterministic-checked table (structure, secrets, git hygiene, deploy correctness) is the cheapest way to earn the 30% Impact and 20% Technical Depth points at once. Use a deterministic checker for the objective rows, and a model rubric grader only for the subjective one. **Record the video on day 8–9, not day 10.** [43][45]
11. 🟡 **Skip SAM 3.1 in the critical path — and say why in the README.** The primary source is unambiguous: SAM takes **one concept per request** and returns **boxes and masks, never semantic names**. A screenshot cannot be segmented into `navbar`/`sidebar`/`hero_card` in one call, and the endpoint is `POST /v1/responses` with `model: "sam-3.1"`. The honest statement — *"we evaluated SAM 3.1 and it returns geometry, not semantics; our one credible use is click-to-teach UI auditing"* — is stronger engineering judgment than a forced demo. If breadth is needed, ship click-to-teach (user clicks → box+point prompt → mask → Spark reasons) as a 20-second appendix clip at $0.0025 per screenshot. **Never claim SAM improves code correctness.** [21][22][23]
12. 🟡 **Follow Meta's documented ordering if you use SAM at all: Spark decides the concept, SAM produces the mask.** Meta's own segmentation guide says "let Muse Spark interpret a scene and decide what to segment, then hand the concept to SAM 3.1 for the masks." A vibe-fence pipeline that runs SAM first and asks Spark to interpret the output reverses the vendor's design and will look wrong to a judge who knows the docs. [23]
13. 🟡 **Use `web_search` for grounded teaching, and budget it explicitly.** $2.50 per 1,000 queries on top of token cost. A guardrail explanation with a live citation to OWASP/framework docs is the difference between "trust this rule" and "trust the model's opinion" — it is the single highest-leverage use of a built-in Meta tool for a *teaching* product. Muse Image's built-in search, by contrast, is included in its $0.01/image price. [10][3][19]
14. 🟡 **Lean on Meta's model-card language as endorsement.** The Muse Wonder model card says performance "can vary with quantization, serving configuration, prompts, tools, and **the agent harness**," and recommends "human-in-the-loop confirmation for irreversible actions" for agentic deployments. That is Meta validating vibe-fence's thesis and recommending vibe-fence's mechanism. Quote it in the README. Do **not** quote the benchmark table as a competitive claim — the same card says competitor baselines are "best-effort … may not be optimally tuned for proprietary models." [26]
15. 🟡 **Mirror the LlamaCon winners' shape: a real workflow problem, long context → a structured artifact, "defined in simple language."** All four 2025 winners solved an internal-work problem, and *Best Llama API Usage* (Geo-ML) won by using the long context to turn a pile of documents into a domain-specific structured output. vibe-fence's parallel: the 1M window holds the whole repo, and the artifact is a **project health report** (not a chat answer). And "Llama CCTV Operator" — operators define events in simple language — is direct prior art for the teaching dial; cite it. [42]
16. ⚪ **Add a provider-fallback switch and know the country list before you publish.** The Model API is geographically restricted and the hackathon's country set is broader than the API's; the open-weights path is the universal one. Verify the policy page yourself before making any availability claim (the specific country list available to me is third-party and unverified). [41][43]
17. ⚪ **Roadmap slide only: Muse Code workflows and session messaging as the multi-agent substrate.** A lead session spawning parallel audit agents over "API design, security boundaries, and test coverage" and returning "one prioritized report" is almost exactly vibe-fence's issue queue — a superb demo beat and a strong precedent. But **check the build first**: the public Apple-silicon macOS package does not include the workflow engine, so drive the same fan-out through the Responses API from vibe-fence itself if it is missing. [32][30]
18. ⚪ **Claim the credits, and claim the licence obligations.** $150 Model API + $100 Baseten (2M TPM) + $100 Modal + $25 Fireworks = $375 of build credit, and the partner credits are *for the open-weights models*. Muse Spark Open ships under the **Muse Model License** (attribution/terms obligations) whereas Glimmer is **Apache-2.0** — prefer Glimmer for anything you want to ship as a product, and check the Muse Model License before quoting Muse Spark Open in a commercial roadmap. [5][36][38]
19. ⚪ **Do not put Muse Wonder Full in the demo path.** It is not on Model API at all — it requires a Muse Code subscription on the $50/mo or $200/mo plans, and `reasoning_effort: "max"` on plain Muse Wonder does not select it. Mention it on the roadmap slide; build on `muse-wonder-1.0`. [1][25][31]
20. ⚪ **Re-read the Official Rules the moment they appear (due before Oct 26) and re-check the submission form.** As of the sources' dates, the submission field list, whether a repo is required, the demo video length, and the live-finals format are all unknown. The rubric weights and waiver tool list above are confirmed; the *packaging* requirements are not. [4][6][43]
