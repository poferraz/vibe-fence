# 06 — Meta model integration and hackathon fit

- **Model:** gpt-6
- **Provider:** OpenAI via Codex desktop
- **Date:** 2026-10-20
- **Stream:** 06 — Meta Models
- **Status:** Complete research contribution; proposed integrations have not been implemented or benchmarked.
- **Selection:** Stream 06 had the fewest contributor files at selection. Streams 01 and 04 were already completed in this contributor folder.

## Findings

### Evidence and interpretation

All linked sources below were accessed **2026-10-20**. Source IDs resolve to URLs in the sources table and reference definitions. `practiced` identifies documented implementation or actual event practice, not independent proof of reliability or widespread adoption of newly released features. `proven` is restricted to a reported evaluation under its stated conditions; it does not mean universal superiority. `contested` marks anecdotes, uncertain portability, and our proposed design or scoring inference. No model requests, installations, account registrations, credit redemptions, or deployments were performed.

**Recommendation — `contested`, design inference:** make Muse Spark the companion that turns checked evidence into understandable questions and explanations. Keep authorization, rule evaluation, and execution outside that model. Add a Muse Code adapter after capability checks. Use Muse Image only for an optional visual brief; defer SAM unless a user-selected image workflow actually needs object masks. The API, structured-output, hook, and approval surfaces supporting this design are documented; its user benefit still requires evaluation. [S03][S09][S14][S16]

### 1. Muse Spark: a plausible companion, with explicit data and API choices

| Model | Relevant capability | Companion role | API surface — endpoint, auth, limits, evidence | Scoring leverage — inference | Strength |
|---|---|---|---|---|---|
| Muse Spark 1.3 | Text, image, video, audio and PDF inputs; text output; tool use. Published context window: 1,048,576 tokens. [S03][S29] | Proposed default for intent questions, plain-language explanations of scanner findings, and bounded change summaries. | `muse-spark-1.3`; `https://api.meta.ai/v1/responses`, alternatively Chat Completions or Messages; bearer API key. Standard limit: 3,000 RPM / 4M TPM per team. [S03][S07][S08], accessed 2026-10-20. | Demonstrate a visible, necessary Meta contribution: a novice understands the blocked change and selects a valid next action. | `practiced` API; `contested` proposed role and score benefit. |
| Muse Spark 1.2 / 1.1 | Earlier hosted Spark versions remain listed; avoid inferring identical quality from a shared interface. [S03][S29] | Explicit alternative in a reproducible evaluation, or configured fallback if tested. Do not silently substitute and label it 1.3. | `muse-spark-1.2`, `muse-spark-1.1`; same base URL and bearer auth; 3,000 RPM / 4M TPM each. [S03][S07], accessed 2026-10-20. | Demonstrate version-aware portability only if useful; extra model names alone do not establish quality. | `practiced` availability documentation; `contested` equivalence/fallback quality. |
| Muse Spark 1.3 / 1.2 Contributor variants | Discounted variants permit Meta to use submitted prompts, code, files, context and responses for training. [S07] | Optional choice for public or synthetic projects after a clear data-use decision. Inappropriate as an invisible cost optimization for private work. | Model IDs end in `-contributor`; same API and bearer auth; 150 RPM / 3M TPM. [S07], accessed 2026-10-20. | A transparent privacy choice supports the product story; choosing it does not itself increase a published judging score. | `practiced` published terms distinction; `contested` UX recommendation. |

**F01 — Protocol compatibility is useful but not feature parity. `practiced`.** Meta documents Responses, Chat Completions and Messages. Responses supports reasoning continuity, search grounding and tool search; Chat Completions does not preserve reasoning across turns for external keys and lacks those search surfaces. Messages uses the base host `https://api.meta.ai`, while OpenAI-style clients use `https://api.meta.ai/v1`. Treat API format and supported features as adapter capabilities, rather than assuming changing a base URL preserves behavior. [S08]

**F02 — Structured output can stabilize the interface, not certify the meaning. `practiced` capability; `contested` design.** Meta documents schema-constrained decoding and a typed parsing example. Proposed companion output is a bounded object such as `{finding_id, explanation, question, options, evidence_ids}`. Application code checks references and permitted option IDs against the actual finding. A conforming JSON object can still contain an incorrect explanation; it must never mint an authorization or convert a failed scanner result to a pass. [S09][S10]

**F03 — The comparison with Claude, GPT and Gemini is narrower than a leaderboard slogan. `proven` only for publisher-reported benchmark results; `contested` transfer.** Meta's 1.3 benchmark page compares Spark 1.3 at max reasoning with Spark 1.2, GPT-5.6 Sol and Claude Opus 5. The displayed results vary by task rather than showing one universal winner. Its methodology combines its own runs, official leaderboards and provider-reported results, and explicitly says competing models may not have their best tuning. Some evaluation versions also differ. [S04][S06]

The usable advantage for this project is a documented combination of long context, multimodal inputs and compatible tool interfaces. Meta also says 1.3 was trained to ask for clarification, preserve constraints and seek help on long tasks. Those are vendor claims, not a measured result about novice requirements elicitation. [S03][S05] This pass did **not** establish a matched, current Spark 1.3 versus Gemini comparison for this harness, or a superiority claim over current Claude/GPT releases. Do not turn the older named comparison into a claim about all current competing models.

Community reports also disagree: one author describes a good Spark 1.2 experience in OpenCode, while another describes poor Spark 1.3 implementation and review behavior. These are first-person observations without a controlled task set, reliable cost normalization, or reproducible setup. They justify testing our workflow, not averaging anecdotes into a quality score. **Strength: `contested`.** [S27][S28]

**F04 — Cost and privacy belong in the same decision. `practiced` published pricing.** Standard Spark prices are $1.25/M input, $0.15/M cached input and $4.25/M output tokens. Contributor prices are $0.10, $0.002 and $0.20 respectively. Standard content is not used for training; that statement alone is not a zero-retention guarantee. Limits are shared per team, so generating more keys does not create independent quotas. [S07]

**Proposed budget illustration — `contested`, arithmetic rather than a measurement:** 100 uncached companion turns, each with 3,000 input and 500 output tokens, cost approximately **$0.5875 Standard** or **$0.04 Contributor** at the listed rates. This excludes retries, additional reasoning/output tokens, tools, agent work and hosting. Bound requests and output, record actual usage, and put a session budget in the product. Cache savings must follow observed usage, not assumed cache hits.

### 2. Muse Image: optional visual requirements support

| Model | Relevant capability | Companion role | API surface — endpoint, auth, limits, evidence | Scoring leverage — inference | Strength |
|---|---|---|---|---|---|
| Muse Image 1.0 | Text/image generation and editing; conversational refinement and reference-based composition. [S11][S12] | Optional early visual brief: show two proposed directions and record the user's choice as a design constraint. | `muse-image-1.0`; `POST /v1/images/generations`, `/v1/images/edits`, or conversational Responses on `api.meta.ai`; bearer `MODEL_API_KEY`. 150 RPM; $0.01/generated image. [S03][S07][S12], accessed 2026-10-20. | Makes a novice's aesthetic intent visible if the project is visual. It adds little to a terminal-only safety demonstration. | `practiced` documented capability; `contested` user benefit. |

**F05 — Scope a visual brief as a proposal. `contested`, design inference.** An original prompt pattern for evaluation: “Create a concept image for a volunteer signup page. Show the page hierarchy and a calm, high-contrast style. Use fictional names and no real customer data. This is an illustrative concept, not a screenshot of a completed app.” A refinement could change only the grouping of signup choices while preserving the selected palette. Reference-based and iterative editing are documented; perfect preservation of all other pixels is not established by this research. [S11]

**F06 — Control hidden image-workflow behavior. `practiced` API; `contested` default proposal.** The guide says image generation can perform web/image search and run code internally; intermediate lookups are not exposed as separate tool calls. Request fields can disable those tools and adjust refinement. The image-endpoint response currently reports an opaque background. Thus an “offline” or transparent asset workflow cannot be inferred from the model name or a prompt. [S12]

For a bounded concept preview, propose disabling unnecessary retrieval, limiting variants, and using synthetic references. Store the approved visual brief separately from generated assets. Render approval text and real risk counts with ordinary UI components so generated imagery cannot become the evidence for a security decision. These are proposed product constraints, not demonstrated gains.

### 3. SAM 3.1: geometry is a narrow fit

| Model | Relevant capability | Companion role | API surface — endpoint, auth, limits, evidence | Scoring leverage — inference | Strength |
|---|---|---|---|---|---|
| SAM 3.1 | Text-, box- or point-prompted segmentation of objects in images/video; boxes and masks, with video tracking. [S13] | Optional user-selected object cutout or selected-region explanation during visual requirements work. | `sam-3.1`; `POST https://api.meta.ai/v1/responses`, with Files for relevant media inputs; bearer key. 3,000 RPM, no TPM quota; image segmentation $2.50/1,000 images, video $0.20/1,000 frames. [S03][S07][S13], accessed 2026-10-20. | A useful media workflow could show technical ambition; adding it to a code-safety demo without such a workflow dilutes the story. | `practiced` documented interface; `contested` devtool fit. |

**F07 — Do not advertise segmentation as a privacy detector. `practiced` scope, `contested` recommendation.** Meta distinguishes SAM geometry from the scene interpretation supplied by a VLM. It recommends short concrete noun phrases rather than arbitrary explanatory requests. [S13] A mask for “person” or a selected button does not establish detection of secrets, private text, account identifiers, or all sensitive pixels. No retrieved evaluation validates SAM 3.1 as a comprehensive screenshot redactor.

A credible optional experiment is: the user selects an already permitted example image, identifies an object, previews the mask and accepts a cutout for their design brief. Evaluate mask quality on that domain. Sending an unredacted screenshot to a hosted segmenter and then blurring it would already have transmitted the screenshot; a privacy-preserving mode must address transmission before the API call. This is a data-flow inference, not a claim that SAM provides such a mode.

### 4. Muse Code: integrate with the executor that already exists

| Model / integration | Relevant capability | Companion role | API surface — endpoint, auth, limits, evidence | Scoring leverage — inference | Strength |
|---|---|---|---|---|---|
| Muse Code with a selected Spark model | Terminal/CI agent, native permissions, sandbox, project context, hooks and MCP. [S14][S15][S16] | Agent adapter: pass an approved task to the executor; map events into clear progress and explanations; preserve native controls. | CLI `muse` / `muse exec`; programmatic `muse serve` with MSP and SDKs. Browser sign-in or API key; headless docs specify `META_API_KEY`. API and subscription limits are different products. [S14][S17], accessed 2026-10-20. | Demonstrates an agent-independent harness wrapping a real Meta executor rather than replacing it. | `practiced` interfaces; `contested` end-to-end enforcement coverage. |

**F08 — Preserve native enforcement and add observable policy. `practiced`.** Muse Code documents distinct approval and OS sandbox layers, refusal to run if the sandbox cannot enforce its boundary, and permission inheritance for child agents. Its unrestricted profile disables both layers. These are documented semantics, not a bypass assessment conducted here. [S15] A vibe-fence adapter should inspect effective permissions, advertise the protection actually available, and reject a claimed protected run when a mandatory boundary is absent.

**F09 — Hooks are promising, but missing hooks must be detected. `practiced` documentation.** Muse Code exposes lifecycle hooks including `PreToolUse`, `PermissionRequest`, `PreLLMCall` and post-operation events. Project hooks require project trust; managed hooks have a separate administrator-controlled source. Malformed project or managed hook files can contribute no handlers while producing a warning. [S16] Proposed adapter preflight therefore validates loaded handlers and exercises a harmless canary denial before declaring a policy enforced. A warning buried in startup output is insufficient evidence.

**F10 — SDK versions and event coverage need a contract test. `contested`.** The overview calls MSP stable/versioned, while the Python README calls its SDK a developer preview with experimental surfaces. The README describes streamed outcomes, resumable sessions and approval handlers. These statements can coexist at different layers, but do not justify treating every SDK method as frozen. Pin and record the binary/SDK/protocol versions and prove resume, cancellation and denial behavior against them. [S14][S17]

Proposed division of labor: the coding agent edits/tests; deterministic rules decide whether an intercepted operation is permitted; the companion explains the result; the user supplies missing intent or specific authority. A model's claim that a task is safe is not evidence that an external operation was prevented. Native SDK tool-approval requests are one interception surface; verify coverage of shell children, direct writes and external connectors before claiming comprehensive control.

### 5. Open weights: separate portability, hosting cost and offline operation

| Model / integration | Relevant capability | Companion role | API surface — endpoint, auth, limits, evidence | Scoring leverage — inference | Strength |
|---|---|---|---|---|---|
| Muse Spark Open, self-hosted | 816B total / 42B active MoE; multimodal input, text output; 1,048,576 context. BF16 weights about 1.65 TB; NVFP4 about 537 GB. [S18] | Organization-controlled inference for the same explanation interface; excessive as a default novice laptop requirement. | Runtime-specific endpoint and local authentication; no Meta Model API key for self-hosted inference. Meta documents 8-GPU BF16 or 4-GPU Blackwell NVFP4 serving and extra cache/runtime memory. Muse Model License/AUP apply. [S18], accessed 2026-10-20. | Makes infrastructure choice credible if demonstrated on provisioned hardware. Open weights alone do not prove offline usability. | `practiced` documented distribution; `contested` deployment fit. |
| Muse Spark Open on Baseten | Hosted inference with text/image/video/audio listed. [S20] | Fast hosted alternative without provisioning local GPUs. | Base `https://inference.baseten.co/v1`; Chat Completions; model `meta-models/muse-spark-open`; `BASETEN_API_KEY`. $1.25/$0.15/$4.25 per M input/cached/output. Event offer: 2M TPM and $100 credits to selected participants. [S20][S02], accessed 2026-10-20. | Demonstrate provider portability after testing the same contract; credit access is conditional. | `practiced` catalog/offer; `contested` parity. |
| Muse Spark Open on Modal | Announced on Shared Endpoints with per-token billing. [S21] | Alternative hosted adapter; dedicated capacity only if a real requirement emerges. | Dashboard supplies endpoint/model; `/v1/chat/completions`, Responses or Messages. Bearer proxy token combines ID and secret. Limits are model-specific concurrency shared within a workspace; rates shown in dashboard. [S22][S23], accessed 2026-10-20. | Supports a portability demonstration; use a captured rate card instead of inventing a universal price. | `practiced` documented service; `contested` workload performance. |
| Muse Spark Open on Fireworks | Serverless catalog lists function calling and image input. [S24] | Conditional hosted option, with a deadline-related availability check. | Base `https://api.fireworks.ai/inference/v1`; Chat Completions; bearer API key; model `accounts/fireworks/models/muse-spark-open`. Listed token prices match Baseten. Serverless is a limited US-only preview through October 29, 2026; account quota not verified. [S24][S25], accessed 2026-10-20. | Useful only if availability through final judging is confirmed; a current preview is not a November service commitment. | `practiced` dated offering; `contested` continued availability. |
| Muse Glimmer, self-hosted | 30B dense text/image model, 128K default context, Apache 2.0 weights; documented local runtimes. [S19] | More plausible optional local companion candidate; benchmark on the actual device and quantization. | Runtime-specific local endpoint/auth; no hosted Model API endpoint. Limits depend on model configuration, memory and serving runtime. No latency or device-capacity measurement was made here. [S19], accessed 2026-10-20. | Could support a credible offline explanation mode, if tested with network access disabled. | `practiced` model distribution; `contested` proposed offline quality. |

**F11 — Provider catalogs expose different contracts. `practiced`; `contested` parity.** Baseten lists four input modalities, while the inspected Fireworks entry describes text and image. Fireworks also has inconsistent fine-tuning wording: narrative text mentions a training route while its functionality table says not supported. Do not promise training or audio/video parity from these pages. [S20][S24] The adapter needs tested modality, tool, schema, context and quota flags.

**F12 — Credits do not remove the need for a cost model. `practiced`.** The event advertises $100 Modal and $25 Fireworks offers for selected participants, alongside Baseten's offer. [S02] Modal's Shared Endpoints documentation separately excludes normal plan-included credits from that product. The event may provide a special offer; this pass could not establish its redemption mechanics or scope. [S23] Budget at paid rates until an account actually shows an applicable grant.

**F13 — Offline is an end-to-end condition. `contested`, architectural inference.** A locally hosted model can avoid hosted inference, but remote tools, package retrieval, telemetry or external services still make a workflow network-dependent. Proposed labels are precise: “local rules available,” “local explanations available,” and “external action requires connection.” Test with networking disabled. Do not promise that the full Spark Open checkpoint runs on ordinary consumer hardware merely because only 42B parameters are active. The hardware footprint is set by all weights plus runtime state. [S18][S19]

### 6. Winning patterns and a concrete integration plan

**F14 — Current judging language supports a working, understandable safety workflow. `practiced` event facts; `contested` positioning.** The official page separates the indie track's creativity, technical ambition and working result from the startup track's execution and production readiness. The themes are “Build for Your World” and “Push the Frontier.” [S01] A reasonable positioning is a novice taking a real idea through a risky change with understandable assistance and demonstrable enforcement. Choose the track based on the team's actual status and final rules, not the promise that one is easier to win.

**F15 — Prior winners support domain-specific demonstrations, not a winning formula. `practiced` historical examples.** Meta's May 2025 recap names OrgLens first for organizational expert finding, Compliance Wizards second for transaction analysis, and Geo-ML for best Llama API use. The latter converted long geology reports into a structured representation and visual model; the recap links demos and code. [S26] The proposed lesson is to show one necessary model contribution, concrete artifacts, and an end-to-end result. This is an inference from selected examples with no losing-project comparison, not causal evidence about judging.

**F16 — Workshop plans are published; detailed deliverable rules are still a gap. `practiced`.** The event is October 26–November 4; submissions are due November 4 at 9 PM ET, workshops/office hours run October 27–November 4, and finals are scheduled November 9. The site says Official Rules will be published before the event starts. [S01] The host also advertises a Fireworks workshop. [S02] Do not infer a mandatory video length, permitted pre-existing-code policy, rubric weights or a required count of Meta models. A three-minute walkthrough below is our suggested internal rehearsal, not an official submission requirement.

**Proposed implementation sequence — all `contested`, design to evaluate, not code already built:**

1. **Freeze the safety contract.** Define finding IDs, evidence references, action scope, policy version, user decision and execution result. The same operation must produce the same rule decision with the model absent.
2. **Build one companion interaction.** Send a minimized, secret-filtered finding and known project context to Spark 1.3 Standard. Request a bounded explanation and a choice among application-provided actions. Validate the response; fall back to an authored explanation on failure.
3. **Connect one executor.** Wrap Muse Code's supported events/approval surface, preserve native sandboxing, and test that a denied action leaves the intended target unchanged. Keep the internal adapter contract portable to the other agents researched in Stream 01.
4. **Use a real decision.** Example fixture: a user asks for a contact form and the draft introduces a credential into browser code. Detect the synthetic credential locally, explain the consequence, let the user choose a server-side approach, and verify the revised build. Use only dummy secrets and a controlled fixture.
5. **Show the difference between local and external consequences.** Permit ordinary reversible edits within the accepted task. Bind any publish action to its exact target and reviewed artifact. Show the native tool result and the harness event, not a fabricated success animation.
6. **Make failure behavior observable.** Exercise an API timeout, malformed/unavailable response, missing hook and unsupported agent. Rule decisions stay active; rich explanations degrade to plain text. A missing mandatory enforcement hook stops the protected run rather than being described as protection.
7. **Add optional media only after the core works.** Image concepts may help record a visual requirement. SAM needs a genuine object-selection workflow and a domain-specific quality check. Neither is required for the central safety claim.
8. **Recheck event terms when published.** Record the allowed build window, prior-work disclosure, submission assets, licensing obligations, team eligibility and grant terms. Research now is not evidence that all pre-event implementation will be eligible.

**Proposed demonstration — `contested`:** spend approximately 30 seconds on the novice's intent, 45 on a caught risky change and Spark's explanation, 45 on the user's meaningful choice and corrected result, and 60 on an independent enforcement check, outage case and evidence log. Present model/provider/version and whether each event was live or replayed. This allocation is an editable rehearsal plan.

**Proposed evaluation — `contested`:** assemble 24 predeclared cases: eight known hazards, eight benign actions, four ambiguous intents and four infrastructure failures. Include secrets, destructive operations, deployment targets and prompt-injection-like text in untrusted project content. Compare deterministic rules plus static explanations against the same rules plus Spark; only then add an alternative model/provider. Repeat nondeterministic runs and report raw denominators.

Measure incorrect allows, unnecessary blocks, explanation factuality against evidence, correct interpretation of a user's choice, clarification turns, latency and actual cost. For a small consenting novice study, measure whether people can state the consequence and choose the intended outcome; do not equate “clicked approve” with understanding. Publish failures and the exact agent/model/configuration. Passing these cases would be bounded evidence, not a universal claim that vibe coding is safe.

## Gaps and limitations

1. **Final event contract:** official rules were promised before October 26 but not available in the inspected pages. Prior-code eligibility, video length, final scoring weights and deliverable requirements remain unresolved. [S01][S02]
2. **Live access:** no API key, grant, model call, CLI install or partner account was exercised. Documentation availability is not proof of this team's access.
3. **Comparative quality:** no matched novice-safety evaluation against current Claude, GPT or Gemini was found or run. Vendor benchmark settings and community anecdotes do not fill that gap. [S04][S06][S27][S28]
4. **Privacy terms:** the Standard/Contributor training distinction is clear; retention, regional processing and all partner data-use terms were not exhaustively reviewed. No zero-retention claim is made. [S07]
5. **Adapter coverage:** SDK preview/stability wording, hook-load failures and action coverage need version-specific testing. No bypass assessment was performed. [S14][S16][S17]
6. **Partner continuity and grants:** Fireworks' preview date precedes the deadline; Modal's normal-credit policy does not settle the special hackathon offer; exact account quotas are unknown. [S23][S24]
7. **Local hardware:** no target-device memory, speed, quantization or offline test. Spark Open and Glimmer must not be treated as interchangeable installation sizes. [S18][S19]
8. **Media evidence:** no measured novice benefit for image briefs, no UI-domain segmentation evaluation, and no basis to market SAM as complete redaction. [S12][S13]
9. **Rules versus predictions:** the proposed architecture, demo timing, test counts and scoring leverage are original recommendations. They are not official judging rules, shipped capabilities or proven safety results.

## Sources

| # | Source | Type | Publication / scope | Accessed |
|---|---|---|---|---|
| S01 | [Meta Global AI Developer Hackathon](https://dev.meta.ai/events/global-hackathon) | official event | Current; final rules not yet published | 2026-10-20 |
| S02 | [Hackathon host and partner offers](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) | official event | October–November 2026 schedule | 2026-10-20 |
| S03 | [Meta Model API overview](https://dev.meta.ai/docs/overview) | docs | Current | 2026-10-20 |
| S04 | [Muse Spark 1.3 model page](https://dev.meta.ai/models/muse-spark) | model / vendor evaluation | Current | 2026-10-20 |
| S05 | [Introducing Muse Spark 1.3](https://research.meta.ai/blog/introducing-muse-spark-1-3) | vendor research | 2026-09-02 | 2026-10-20 |
| S06 | [Muse Spark 1.3 evaluation methodology](https://research.meta.ai/static/muse-spark-1-3-multimodal-evaluation-methodology) | evaluation PDF | 4 pages; publisher evaluation | 2026-10-20 |
| S07 | [Pricing and rate limits](https://dev.meta.ai/docs/pricing-rate-limits) | docs | Snapshot; not a quote or account entitlement | 2026-10-20 |
| S08 | [Choosing an API](https://dev.meta.ai/docs/protocols) | docs | Current | 2026-10-20 |
| S09 | [Structured output](https://dev.meta.ai/docs/structured-output) | docs | Current | 2026-10-20 |
| S10 | [Structured-output cookbook](https://dev.meta.ai/docs/cookbook/structured-output) | docs / example | Current | 2026-10-20 |
| S11 | [Muse Image model page](https://dev.meta.ai/models/muse-image) | docs | Current | 2026-10-20 |
| S12 | [Image generation guide](https://dev.meta.ai/docs/image-generation) | docs | Current | 2026-10-20 |
| S13 | [Media segmentation](https://dev.meta.ai/docs/media-segmentation) | docs | SAM 3.1 API | 2026-10-20 |
| S14 | [Muse Code overview](https://dev.meta.ai/docs/muse-code) | docs | Current | 2026-10-20 |
| S15 | [Muse Code permissions and safety](https://dev.meta.ai/docs/muse-code/permissions) | docs | Current | 2026-10-20 |
| S16 | [Muse Code extending and automating](https://dev.meta.ai/docs/muse-code/extending) | docs | Current | 2026-10-20 |
| S17 | [Muse Code Python SDK README](https://github.com/meta-models/muse-code-sdk/blob/main/python/clients/sdk-py/README.md) | official repo | Developer preview; mutable main | 2026-10-20 |
| S18 | [Muse Spark Open overview](https://dev.meta.ai/docs/muse-spark-open) | docs | Current | 2026-10-20 |
| S19 | [Muse Glimmer overview](https://dev.meta.ai/docs/muse-glimmer) | docs | Current | 2026-10-20 |
| S20 | [Muse Spark Open on Baseten](https://www.baseten.co/library/muse-spark-open/) | partner model docs | Current | 2026-10-20 |
| S21 | [Muse Spark Open on Modal](https://modal.com/changelog/muse-spark-open-now-available) | partner changelog | 2026-10-15 | 2026-10-20 |
| S22 | [Modal Endpoints](https://modal.com/docs/guide/endpoints) | partner docs | Current | 2026-10-20 |
| S23 | [Modal Shared Endpoints](https://modal.com/docs/guide/shared-endpoints) | partner docs | Current | 2026-10-20 |
| S24 | [Muse Spark Open on Fireworks](https://fireworks.ai/models/fireworks/muse-spark-open) | partner model docs | Created 2026-10-14; preview through 2026-10-29 | 2026-10-20 |
| S25 | [Fireworks serverless quickstart](https://docs.fireworks.ai/getting-started/quickstart) | partner docs | Current | 2026-10-20 |
| S26 | [LlamaCon Hackathon winners](https://ai.meta.com/blog/llamacon-hackathon/) | official recap | 2025-05-13 | 2026-10-20 |
| S27 | [Positive Spark 1.2 OpenCode experience](https://www.reddit.com/r/opencode/comments/1vhk4d0/muse_spark_12_is_awesome/) | first-person community report | Page says two months ago; anecdotal | 2026-10-20 |
| S28 | [Negative Spark 1.3 OpenCode experience](https://www.reddit.com/r/opencode/comments/1wh9l72/i_lost_faith_in_artificial_analysis_muse_spark_13/) | first-person community report | Page says one month ago; anecdotal | 2026-10-20 |
| S29 | [Models and supported modalities](https://dev.meta.ai/docs/models) | docs | Current | 2026-10-20 |

[S01]: https://dev.meta.ai/events/global-hackathon
[S02]: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
[S03]: https://dev.meta.ai/docs/overview
[S04]: https://dev.meta.ai/models/muse-spark
[S05]: https://research.meta.ai/blog/introducing-muse-spark-1-3
[S06]: https://research.meta.ai/static/muse-spark-1-3-multimodal-evaluation-methodology
[S07]: https://dev.meta.ai/docs/pricing-rate-limits
[S08]: https://dev.meta.ai/docs/protocols
[S09]: https://dev.meta.ai/docs/structured-output
[S10]: https://dev.meta.ai/docs/cookbook/structured-output
[S11]: https://dev.meta.ai/models/muse-image
[S12]: https://dev.meta.ai/docs/image-generation
[S13]: https://dev.meta.ai/docs/media-segmentation
[S14]: https://dev.meta.ai/docs/muse-code
[S15]: https://dev.meta.ai/docs/muse-code/permissions
[S16]: https://dev.meta.ai/docs/muse-code/extending
[S17]: https://github.com/meta-models/muse-code-sdk/blob/main/python/clients/sdk-py/README.md
[S18]: https://dev.meta.ai/docs/muse-spark-open
[S19]: https://dev.meta.ai/docs/muse-glimmer
[S20]: https://www.baseten.co/library/muse-spark-open/
[S21]: https://modal.com/changelog/muse-spark-open-now-available
[S22]: https://modal.com/docs/guide/endpoints
[S23]: https://modal.com/docs/guide/shared-endpoints
[S24]: https://fireworks.ai/models/fireworks/muse-spark-open
[S25]: https://docs.fireworks.ai/getting-started/quickstart
[S26]: https://ai.meta.com/blog/llamacon-hackathon/
[S27]: https://www.reddit.com/r/opencode/comments/1vhk4d0/muse_spark_12_is_awesome/
[S28]: https://www.reddit.com/r/opencode/comments/1wh9l72/i_lost_faith_in_artificial_analysis_muse_spark_13/
[S29]: https://dev.meta.ai/docs/models

## Implications for vibe-fence

1. **Copy — `practiced` surface / `contested` design:** use Spark's structured output for explanations tied to existing evidence IDs; validate semantics and keep the decision in application code. [S09][S10]
2. **Copy — `practiced`:** support the documented Responses and Messages formats deliberately; capability-test Chat Completions rather than promising identical reasoning continuity. [S08]
3. **Avoid — `contested` recommendation:** do not silently use Contributor mode for private repositories. Make the training-use tradeoff explicit and keep it separate from token-cost savings. [S07]
4. **Invent — `contested`:** define a model-independent companion contract that cannot grant permissions, invent findings or erase a failed check.
5. **Copy — `practiced` controls / `contested` adapter:** preserve Muse Code permissions and sandboxing; verify hook loading before labeling a run protected. [S15][S16]
6. **Avoid — `contested`:** do not advertise every action as intercepted until a pinned adapter proves its actual coverage, including resume and failure paths. [S14][S17]
7. **Invent — `contested`:** pair a novice-visible explanation with an auditable operation result and artifact identity; test understanding rather than approval frequency.
8. **Avoid — `contested`:** keep Muse Image and SAM out of the mandatory path until they solve a demonstrated visual requirement. Geometry and concept imagery must not become safety evidence. [S12][S13]
9. **Copy — `practiced` options / `contested` selection:** expose hosted provider choice honestly, including quotas, data destinations and preview end dates. Do not equate hosted open weights with offline operation. [S18][S20][S23][S24]
10. **Invent — `contested`:** offer a separately tested local-companion profile, with specific hardware and network-off evidence; begin evaluation with Glimmer rather than promising Spark Open on any laptop. [S18][S19]
11. **Avoid — `contested`:** do not interpret promotional credits, historic winners or vendor benchmarks as a production budget, a winning formula or proof of safety. [S02][S06][S26]
12. **Invent — `contested`:** submit a reproducible demonstration with benign, risky, ambiguous and failure cases, and recheck the final rules before fixing the submission format. [S01]

