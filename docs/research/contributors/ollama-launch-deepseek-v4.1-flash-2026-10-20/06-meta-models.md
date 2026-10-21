# Stream 06 — Meta Models (Hackathon Integration)

- **Model:** deepseek-v4.1-flash
- **Provider:** Hermes desktop app via ollama-launch (`deepseek-v4.1-flash:1017-cloud`)
- **Date:** 2026-10-20
- **Stream:** 06 — Meta Models: Muse Spark / Muse Image / SAM 3.1 / Muse Code for vibe-fence

---

## Thesis: use Meta's models for the companion, not for the agent

The tempting integration is "point the agent at Muse Spark and call it a Meta submission." That is the weakest possible use, for two reasons found in the sources:

1. **Muse Spark 1.2 is co-trained with Muse Code** — including "rejection sampled harness trajectories and recipe optimizations for goals, compaction, and subagents, alongside the integration of the Muse Code toolset to maximize harness compatibility" ([S-05]). A model tuned to one harness will not show its best numbers inside Claude Code or Cursor, so "drop-in for any agent" is an empirical claim vibe-fence would have to prove, not assume.
2. **The harness's own value is not model capability.** Streams 01–05 establish that vibe-fence's contribution is enforcement, verification, teaching and batching — the layers around the model. Swapping the model changes none of those.

The strong integration uses Meta models where they are uniquely good and where vibe-fence has no substitute:

| Job in vibe-fence | Model | Why this one |
|---|---|---|
| **Companion voice** — teaching cards, digests, "here's what I changed and why" | **Muse Spark 1.1 / 1.2** | 1M context with active compaction, native multimodal (image/audio/video/document in one call), strong tool use, price-efficient ([S-02], [S-03]) |
| **"Look at what you built"** — visual verification of a vibe-coded UI | **Muse Spark** (+ Playwright) | The documented pattern is literally open the page, read the pixels, fix what's wrong ([S-03]) |
| **Assets & mockups** — onboarding illustrations, placeholder imagery, a hero image the user asked for | **Muse Image** | Agentic image generation with search + code tools, self-refinement, joint planning with Spark ([S-04]) |
| **UI regression / PII masking** — the only credible SAM 3.1 role | **SAM 3.1** | Object multiplexing (16 objects/pass, 32 fps on one H100) makes before/after region comparison cheap ([S-06]) |
| **A runtime to wrap, and design patterns to copy** | **Muse Code** | Approval-gated `/plan`, `/grill`, and a replay-exact event log ([S-05]) |

That framing also survives judging: the Indie track is scored on "creativity, technical ambition, and whether it works" ([S-01]), and a live "the fence looked at the page it built and fixed it" demo is the most legible possible answer to all three.

---

## 1. The hackathon, as documented (not as assumed)

| Field | Fact | Source |
|---|---|---|
| Dates | Oct 26, 12:00 PM ET → Nov 4, 9:00 PM ET; kickoff livestream Oct 26, 9:00 AM ET | [S-01] |
| Submissions | Due Nov 4, 9:00 PM ET (the page header's "Nov 5, 2026 UTC" is the same instant) | [S-01] |
| Judging | Nov 4–8; closing ceremony Nov 9 with live finals | [S-01] |
| Format | Online, worldwide, free; **max 20,000 accepted applicants**, rolling review | [S-01] |
| Application deadline | Oct 25, 11:59 PM ET, or earlier if the cap fills | [S-01] |
| Prize pool | **$1,000,000** cash across two tracks | [S-01] |
| **Indie track** | Individuals and students. Judged on **creativity, technical ambition, and whether it works** | [S-01] |
| **Startup track** | Teams and founders. Judged on **technical execution and whether it holds up in production** | [S-01] |
| Themes | **Build for Your World** (bring models into your domain, solve a problem you know firsthand) / **Push the Frontier** (new machine capabilities, science, physical systems) | [S-01] |
| Compute partners | Baseten ($100 credits + 2M TPM rate limits for open-weights), Modal ($100 credits; endpoints, serverless GPUs, **sandboxes**), Fireworks ($25 credits + workshop) | [S-01] |

Three things follow that are worth acting on before the hackathon starts:

- **"Whether it works" is a judging criterion, so the demo must run live.** This favours the fence's deterministic checks (secret scan, build gate, rollback) over any elicitation pipeline whose benefit needs a chart to explain (stream 03).
- **"Technical ambition" rewards the containment work**, not the prompt work. A hook-based gate on three runtimes plus a sandbox is more ambitious — and more demonstrable — than a smarter AGENTS.md.
- **The 20,000-applicant cap is rolling.** Application timing is a risk independent of build quality; the plan should not assume acceptance until notification on Oct 26.

**What I could not verify:** the page does not publish the judging rubric weights, the per-track prize split, or prior winners. I found no write-ups from previous Meta hackathon winners in the sources I reached, so any "winning pattern" claim beyond the stated criteria would be invented. The criteria themselves are unusually specific ("whether it works"), which is enough to drive the demo design.

---

## 2. Muse Spark (1.0 → 1.2): the companion voice

### MS-01 — Capability profile: agentic, multimodal, 1M context with active compaction

- **Claim:** Muse Spark 1.1 is a multimodal reasoning model built for agentic tasks, with gains in tool use, computer use, coding and multimodal understanding. It actively manages a **1 million token** context — remembering actions, retrieving earlier work, and compacting while keeping the steps needed later. It is trained to orchestrate multi-agent systems: as the main agent it gathers context, plans, and delegates to parallel subagents; as a subagent it knows when to escalate.
- **Evidence:** *Introducing Muse Spark 1.1*, AI at Meta, 2026-07-09 — https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/ (accessed 2026-10-20).
- **Strength:** `practiced` (vendor claims with internal benchmarks; no independent replication found).
- **Fit for vibe-fence:** The companion voice needs exactly this shape: long-lived session memory (so the digest can reference what happened an hour ago), compaction (so teaching doesn't blow the budget — stream 05, A-07), and subagent delegation (so a verification subagent can run without polluting the main context — stream 02, M-10).

### MS-02 — It is explicitly trained to adapt to *diverse harnesses*

- **Claim:** Meta states the model was trained to "smoothly adapt to diverse harnesses and reliably handle complex multi-turn dynamics," and that it performs well with popular agentic coding setups supporting planning mode, goal conditioning, subagent delegation and context compaction. Demonstrated inside OpenCode: build a chat app, take automated screenshots, trace user-visible failures back to code, fix, validate.
- **Evidence:** https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/ (accessed 2026-10-20).
- **Strength:** `practiced` (vendor demonstration).
- **Fit for vibe-fence:** This is the sentence that legitimises the whole "wrap any agent" premise — but note the tension with MS-05: adaptivity is claimed for 1.1, while 1.2 was co-trained on one harness. Test the claim per runtime; do not put it in the pitch until measured.

### MS-03 — Multimodal inside the run: the "look at what you built" loop

- **Claim:** The documented developer pattern is a Playwright-wired agent that opens the page it just wrote, looks at the rendered pixels, and fixes what is wrong — the same self-check a front-end developer performs. Images are passed as message content parts (base64 data URL or public URL) alongside text.
- **Evidence:** Meta developer blog, *Build with Muse Spark*, 2026-07-08 — https://developer.meta.com/ai/resources/blog/build-with-muse-spark (accessed 2026-10-20), including the `image_url` content-part example and the browser-verified web design cookbook reference.
- **Strength:** `practiced` (runnable recipe).
- **Fit for vibe-fence:** This is the single best demo asset in the whole project. A non-technical user cannot read a diff, but they can see "the button is off the screen" and "it's fixed now." Make visual verification a first-class `fence check` mode (`fence look`), and let the teaching card say what the screenshot showed.

### MS-04 — 1.2 is a coding-focused update, co-trained with Muse Code

- **Claim:** Muse Spark 1.2 scales training compute on coding tasks with expanded environment diversity, improving code generation, complex debugging, codebase understanding and end-to-end workflows, while retaining general agent strength. It was co-trained with Muse Code using rejection-sampled harness trajectories and toolset integration "to maximize harness compatibility."
- **Evidence:** *Introducing Muse Code and Muse Spark 1.2*, Meta AI Research — https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Use 1.2 for code-facing work when running *inside Muse Code*; use 1.1 (or 1.2 with an eval) for the companion voice, where adaptation to a foreign harness matters more than benchmark peaks. Do not silently mix them — record which model produced which artefact in `.fence/state/`, because debugging a bad patch is impossible if the model id is unknown.

### MS-05 — The harness-compatibility risk, stated plainly

- **Claim:** Co-training with a specific harness is a performance claim *about that harness*. A model tuned on Muse Code's toolset and trajectory distribution has no guarantee of transferring that advantage to Claude Code, Cursor or OpenCode — and the vendor's own framing ties 1.2's gains to being "paired together" with Muse Code.
- **Evidence:** Co-training and "maximize harness compatibility" language — https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 (accessed 2026-10-20). The transfer risk is my inference, consistent with the general finding that harness design materially changes measured capability (stream 02, M-01).
- **Strength:** `contested` (inference, not measured).
- **Fit for vibe-fence:** If the pitch says "works with any agent," the eval must include the same task across at least two runtimes with the same model, reporting pass rate per runtime. Otherwise the claim is a demo-specific illusion — and the judges' "whether it works" criterion is exactly where that illusion gets tested.

### MS-06 — Price-efficiency is the stated positioning

- **Claim:** Meta positions Muse Spark as "one of the most price-efficient, high-intelligence models available for developers," with self-serve, pay-as-you-go access in public preview (US).
- **Evidence:** https://developer.meta.com/ai/resources/blog/build-with-muse-spark (accessed 2026-10-20). I could not retrieve the actual per-token prices (the docs host blocked automated fetches; see gaps).
- **Strength:** `practiced` (positioning claim); pricing `unverified`.
- **Fit for vibe-fence:** Price-efficiency is what makes the elicitation budget in stream 03 affordable (best-of-4 with verification). Put the *measured* cost per verified fix in the demo — it is a stronger claim than the vendor's adjective, and it is cheap to instrument.

---

## 3. Muse Image: assets, mockups, and the "website with images" trick

### MI-01 — It is an agentic image model, not a text-to-image endpoint

- **Claim:** Muse Image invokes **search and coding tools**, self-refines its generations (local edit, full regeneration, or a different tactic), and improves with test-time compute. It integrates with Muse Spark so the two share tools and plan jointly — enabling animated GIFs, websites with embedded images, and interactive visual games.
- **Evidence:** *Introducing Muse Image and Muse Video*, AI at Meta, 2026-07-07 — https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/ (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Two uses, one strong and one weak. **Strong:** when a user's app needs imagery (a hero, a product shot, a placeholder), the fence can generate it *and* wire it in, with the code tool producing the right dimensions/format — that is a visible end-to-end win for a non-technical user. **Weak:** generating UI mockups as a design step — the fence's job is to make the app work, not to art-direct it.

### MI-02 — Emergent self-refinement is evidence that "generate then check" generalises

- **Claim:** The self-refinement behaviour was not designed; it emerged during RL "simply because self-refinement produced better images and therefore higher reward." The model chooses between a local edit and a full regeneration depending on how wrong the draft is.
- **Evidence:** https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/ (accessed 2026-10-20).
- **Strength:** `practiced` (vendor ablation).
- **Fit for vibe-fence:** A useful parallel to cite in the pitch: the same loop the fence enforces (attempt → inspect → repair locally or restart) is what a frontier media model learned on its own. It supports the architectural bet in stream 03 (verify, then escalate).

---

## 4. SAM 3.1: honest fit assessment

### SA-01 — What it actually is

- **Claim:** SAM 3.1 is a drop-in replacement for SAM 3 — a unified model for detection, segmentation and tracking of objects in images and video using **text, exemplar and visual prompts**. Its 3.1 update adds object multiplexing: up to **16 objects in a single forward pass**, doubling throughput from **16 to 32 fps on a single H100**, enabling real-time tracking in crowded scenes on smaller hardware. Checkpoints, evaluation datasets and fine-tuning code are released; SAM 3D is a separate open suite for 3D object/human reconstruction.
- **Evidence:** *SAM 3.1: Faster and More Accessible Real-Time Video Detection and Tracking*, AI at Meta, 2026-03-27 — https://ai.meta.com/blog/segment-anything-model-3/ (accessed 2026-10-20).
- **Strength:** `proven` (release with checkpoints and benchmarks).
- **Fit for vibe-fence:** **Weak for code, real for UI.** A code harness has no segmentation problem. Do not force it into the core loop.

### SA-02 — The one credible use: visual regression on the user's app

- **Claim:** Because SAM 3.1 segments and tracks the *same* object across frames with text prompts ("the checkout button", "the product card"), it can compare a before/after pair of UI screenshots and report whether a given element moved, resized, disappeared, or was occluded — a check that pixel-diffing cannot express in language a beginner can act on.
- **Evidence:** Capability from [S-06]; the regression use is my proposal. No published study of SAM for UI regression testing was found.
- **Strength:** `invent` (capability `proven`, application untested).
- **Fit for vibe-fence:** Implement as `fence look --regions`: segment named UI elements in the pre-change and post-change screenshots, then report "the *Continue* button moved 240 px down and is now below the fold." That sentence is worth more to a non-technical user than any diff.

### SA-03 — Second credible use: mask before you send

- **Claim:** Screenshots of a beginner's app routinely contain personal data (their email in a header, a customer name in a table). Segmenting and masking those regions before the screenshot leaves the machine is a privacy control that doubles as a demo of responsible design.
- **Evidence:** Capability from [S-06]; the masking pipeline is my proposal. Privacy rationale is consistent with stream 04, `P-04`.
- **Strength:** `invent`.
- **Fit for vibe-fence:** Cheap to implement (segment → blur → send) and it directly answers a judge's likely question about sending screenshots to a model. It also makes the "we never ship your data" line concrete.

### SA-04 — What SAM 3.1 should *not* be used for

- **Claim:** Do not use segmentation to "understand the codebase", to parse screenshots of code, or as a general vision encoder for the companion. Muse Spark already accepts images natively (MS-03); routing them through a segmentation model first would add a hop, lose text in the image, and add latency for no measured gain.
- **Evidence:** Capability boundaries from [S-04] (Muse Image/Spark multimodal) and [S-06] (SAM's prompt types are object-centric). This is a negative recommendation, argued rather than measured.
- **Strength:** `invent`.
- **Fit for vibe-fence:** Keep SAM 3.1 in a single narrow module behind a flag, used by `fence look --regions` and the masking step. If it is not wired by demo day, cut it — a bolted-on model is worse for "technical ambition" than a focused one used well.

---

## 5. Muse Code: runtime target and design precedent

### MC-01 — It is a terminal coding agent with persistent background subagents

- **Claim:** Muse Code (beta) is a terminal coding agent powered by Muse Spark 1.2 that plans changes, writes code and validates results across large repositories. It runs "a simple agent loop plus a set of async background agents" that stay active for the whole session rather than being spawned per task, reducing redundant information gathering and the need for steering on long tasks.
- **Evidence:** https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Treat Muse Code as **another adapter target**, not a competitor. Its toolset and skill names are documented, so an adapter is tractable; and "the fence works inside Meta's own agent" is a strong hackathon narrative.

### MC-02 — Its runtime is the pattern vibe-fence should copy: an append-only event log

- **Claim:** Muse Code keeps "a local event log in which every model call, tool run, approval, and edit is appended," making the runtime replay-exact and restart-safe, so a crashed agent resumes precisely where it stopped.
- **Evidence:** https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 (accessed 2026-10-20).
- **Strength:** `practiced` (vendor design, no independent evaluation).
- **Fit for vibe-fence:** This validates `.fence/state/` as an **event log**, not a pile of JSON files. Adopt: one append-only `events.ndjson` with `{ts, kind, actor, payload}`, from which the queue, dial state, deploy history and audit trail are *derived*. It gives replay, restart-safety, and a free demo artefact ("here is every decision the fence made"), and it is the cheapest way to make the harness runtime-agnostic (stream 01, H-01).

### MC-03 — `/plan` and `/grill` are the teaching/turbo interaction, already shipped

- **Claim:** Muse Code ships default skills: `/plan` turns a task into an **approval-gated plan**, `/grill` stress-tests that plan until it holds up, and `/goal` works toward a specified objective.
- **Evidence:** https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** This is near-verbatim the plan-approval pattern recommended in stream 05 (O-03) and it is the strongest external validation of vibe-fence's core interaction. Two consequences: (a) ship a Muse Code adapter that *does not duplicate* `/plan` — it should add the guardrail layer, the dial and the digest on top; (b) cite `/grill` in the pitch as independent confirmation that plan stress-testing belongs in the loop.

### MC-04 — Long-horizon competence changes what the queue must handle

- **Claim:** The 1.2 pairing is demonstrated on long-horizon work — whole-repository generation, large end-to-end projects, and a GPU-kernel optimisation run over **1,000+ tool calls (up to 24 hours)**. Long runs mean many changes between human checkpoints.
- **Evidence:** https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** A 24-hour run makes "review the diff at the end" useless — the queue must be **checkpointed and summarised continuously**, and the fence must be able to roll back to an arbitrary checkpoint, not just "the last one" (stream 05, U-07; stream 04, `D-06`). This is a real design constraint that the short-demo version of vibe-fence would miss.

---

## 6. API surface (what I could verify)

| Fact | Detail | Source |
|---|---|---|
| Compatibility | Meta Model API is **self-serve and OpenAI SDK–compatible**; base URL `api.meta.ai/v1` | [S-03] |
| Auth | API key from the Model API dashboard (`dev.meta.ai`); public preview, **US only** at launch | [S-03] |
| Model ids | `muse-spark-1.1` (verified in a code sample); the blog refers to "Muse Spark 1-1" as the picker label in OpenCode | [S-03] |
| Threads | Responses API with `previous_response_id` carries the conversation; stateless Chat Completions also supported | [S-03] |
| Multimodal input | Image as a content part: base64 data URL or public URL, alongside text | [S-03] |
| Search grounding | Built in, called out as a first-class API feature | [S-03] |
| Existing integrations | OpenCode ships a built-in Meta provider (`/connect` → filter Meta → paste key → pick Muse Spark 1-1); "most agent CLIs are OpenAI-compatible" | [S-03] |
| Pricing | Not captured — the docs host refused automated fetches (403/429) | — |

**Note on the blocked docs:** `dev.meta.ai` returns 403 to the fetch service and 429 from the Wayback API at the time of writing. Everything above comes from the AI at Meta blog, the Meta AI Research blog and the developer blog, which are first-party and unblocked. Anything only in the API reference (rate limits, exact context per model version, SAM/Image endpoint schemas) is unverified in this file.

---

## 7. Open-weights path

### OW-01 — Partner credits make a "runs on your own hardware" story real

- **Claim:** Baseten offers $100 in credits and **2M TPM** rate limits to select participants for Meta open-weights models; Modal offers $100 in credits with endpoints, serverless GPUs, **sandboxes**, and training tooling; Fireworks offers $25 in credits plus a workshop.
- **Evidence:** https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md (accessed 2026-10-20).
- **Strength:** `practiced` (event terms).
- **Fit for vibe-fence:** Modal's **sandboxes** are the interesting line for this project, not the credits: the fence already needs a containment layer (stream 05, U-05), and "the fence executes untrusted agent actions inside a Modal sandbox" is a technical-ambition claim that is both real and demonstrable. Weights themselves matter less — vibe-fence's value is harness-side, and a self-hosted 100B-class model inside a beginner's laptop is not the demo.

---

## 8. Proposed integration plan (what runs where)

```
vibe-fence
├── adapters/            claude-code | cursor | copilot | gemini | opencode | codex | muse-code
├── policy/              rules (stream 04) → commands → verdicts
├── sandbox/             Modal sandbox (or local) — containment, not prompts
├── state/               events.ndjson  (append-only; queue/dial/deploys derived)
└── companion/           Muse Spark  ← the only model dependency in the core
    ├── teach(card)      teaching text at the dial level (stream 05)
    ├── digest(changes)  end-of-run summary
    ├── look(screenshot) visual verification (MS-03), SAM 3.1 for region diff/mask
    └── image(brief)     Muse Image for app assets (MI-01)
```

**Division of labour, stated as a rule:** the *fence* decides (deterministic policy), the *agent* acts (whatever runtime the user has), and *Muse Spark* explains. No model makes a security decision; no policy depends on a model's judgement. That is the architecture streams 02 and 05 converge on, and it is also the cleanest answer to a judge asking "what happens when the model is wrong?"

### The three-minute demo

1. **0:00 — Before.** A vibe-coded app with three real faults: a live API key in `src/config.ts`, no `.gitignore`, and a checkout button pushed off-screen on mobile. The fence is installed in one command.
2. **0:40 — The fence acts.** `fence init` fixes the key (moves to `.env`, rotates advice), writes `.gitignore`, commits a baseline. No prompts. The event log shows four entries.
3. **1:20 — Turbo.** The user says "add a discount field". The agent runs; the fence gates exactly one thing (a new dependency) with the resolved target and the diff, because that is the one decision the user can actually make.
4. **1:50 — Look.** `fence look` renders the page in Playwright, Muse Spark reads the screenshot and says, in plain language, "the checkout button is below the fold on a phone" — then fixes it and re-checks. SAM 3.1 names the region that moved.
5. **2:30 — Proof.** Queue shows one item: the dependency decision, already applied with a revert command. The digest lists what changed, what it touched, and how to undo. The eval table — same task, with and without the fence, per runtime — is the last slide.

That demo hits "creativity" (a companion that looks at your app), "technical ambition" (containment + hooks + event log across runtimes), and "whether it works" (it runs, live, and the checks are deterministic).

---

## 9. Gaps / unknowns

1. **Pricing and rate limits are unverified.** `dev.meta.ai` blocked automated retrieval (403/429); the developer blog confirms pay-as-you-go self-serve but not the numbers. Any cost claim in the pitch must be measured, not quoted.
2. **No independent evaluation of Muse Spark** — every benchmark cited here is vendor-reported (Terminal-Bench 2.1, DeepSWE 1.1, Meta Internal Coding Bench). Meta's own line is that 1.2 is "competitive with leading alternatives," not that it leads.
3. **The harness-transfer question is open** (MS-05). Co-training with Muse Code may make 1.2 underperform inside Claude Code or Cursor; nobody has published a cross-harness comparison for these models.
4. **Muse Code is beta** and its CLI docs were unreachable; I could not verify install commands, config format, or whether third-party hooks/plugins are supported — which determines whether a Muse Code adapter can *enforce* or only *advise*.
5. **SAM 3.1 for UI work is entirely my proposal.** No paper, blog, or product uses it for visual regression or PII masking; both are plausible from its documented capabilities and untested.
6. **Muse Image API surface is unverified** (endpoint names, sizes, latency, cost). The capability description comes from the launch blog only.
7. **No prior-winner analysis.** I could not find write-ups from earlier Meta hackathons; the "winning patterns" here are derived from the published judging criteria, not from observed winners.
8. **Track choice is a real strategic fork.** Indie is judged on creativity/ambition/working; Startup on production readiness. vibe-fence is a developer tool with a real product thesis, so it could plausibly enter either — but the demo, the metrics and the pitch differ substantially. This should be decided before build, not after.
9. **20,000-applicant cap + rolling review** means acceptance is not guaranteed; the plan's dependency on being accepted should have a fallback (build it anyway, ship it open-source, use the models via public preview).

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| S-01 | Cerebral Valley, *Meta Global AI Developer Hackathon* (event page, full terms/dates/tracks) — https://cerebralvalley.ai/e/meta-ai-developer-hackathon.md | event page | 2026-10-20 |
| S-02 | *Introducing Muse Spark 1.1*, AI at Meta, 2026-07-09 — https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/ | vendor blog | 2026-10-20 |
| S-03 | *Build with Muse Spark, now available on Meta Model API*, Meta developer blog, 2026-07-08 — https://developer.meta.com/ai/resources/blog/build-with-muse-spark | vendor blog (with code) | 2026-10-20 |
| S-04 | *Introducing Muse Image and Muse Video*, AI at Meta, 2026-07-07 — https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/ | vendor blog | 2026-10-20 |
| S-05 | *Introducing Muse Code and Muse Spark 1.2*, Meta AI Research — https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 | vendor blog | 2026-10-20 |
| S-06 | *SAM 3.1: Faster and More Accessible Real-Time Video Detection and Tracking*, AI at Meta, 2026-03-27 — https://ai.meta.com/blog/segment-anything-model-3/ | vendor blog | 2026-10-20 |
| S-07 | Meta Model API, *Models* (index; blocked at fetch time) — https://dev.meta.ai/docs/models | docs (unverified) | 2026-10-20 |
| S-08 | Meta Model API, *Coding agents* (referenced from S-03; blocked at fetch time) — https://dev.meta.ai/docs/coding-agents | docs (unverified) | 2026-10-20 |

---

## Implications for vibe-fence

1. **Use Muse Spark as the companion voice, not as "the agent."** Teaching cards, digests, visual explanations (`companion/` in the sketch above). The fence's decisions stay deterministic (MS-01, MS-03).
2. **Ship `fence look` — visual verification is the demo.** Playwright render → Spark reads pixels → plain-language finding → fix → re-check. It is the only feature in the product a non-technical judge can evaluate in five seconds (MS-03).
3. **Copy Muse Code's event log.** One append-only `events.ndjson`; derive queue, dial, deploys and audit from it. Replay-exact and restart-safe, and it is free demo evidence (MC-02).
4. **Do not duplicate `/plan` and `/grill` in the Muse Code adapter.** Add the guardrail layer, dial and digest on top; cite `/grill` as external validation that plan stress-testing belongs in the loop (MC-03).
5. **Design for long runs.** Checkpoint every task and allow rollback to any checkpoint, not just the last — 1,000+ tool-call runs make end-of-run review meaningless (MC-04).
6. **Use SAM 3.1 narrowly and say so.** `fence look --regions` for element-level regression ("the Continue button moved 240 px") and PII masking before a screenshot leaves the machine. Cut it if it isn't wired by demo day (SA-02, SA-03).
7. **Muse Image for app assets, not design direction.** When the user's app needs imagery, generate and wire it in; skip mockup art-direction (MI-01).
8. **Modal sandboxes are the technical-ambition card, not the credits.** Run the containment layer in a Modal sandbox and say "untrusted agent actions execute here" — that is a real, checkable claim (OW-01, stream 05 U-05).
9. **Measure cost per verified fix** instead of quoting "price-efficient." One number from your own instrumentation beats the vendor's adjective (MS-06).
10. **Run the cross-harness eval before claiming "works with any agent."** Same task, two runtimes, one model, pass rate per runtime. The judges' "whether it works" criterion is exactly where this gets tested (MS-05).
11. **Record the model id in every artefact** (`model: muse-spark-1.2`) so a bad patch is debuggable and the eval is reproducible (MS-04).
12. **Pick the track deliberately.** Indie rewards the visual companion demo; Startup would demand the eval table, reliability numbers and a deployment story. The same code can support either, but not the same three-minute pitch (S-01).
13. **Apply early.** 20,000-cap, rolling review, deadline Oct 25 11:59 PM ET. Nothing in the build depends on that, but the plan does.
14. **Have a fallback if not accepted:** build the fence anyway against Meta Model API public preview + open weights via Baseten/Modal, and ship it open-source. The research and the product do not require the hackathon slot (gaps §9).
15. **Defer to synthesis:** whether the companion should ever run on the *user's* agent model instead of Spark (e.g. Claude for Claude Code users), which would improve coherence but forfeit the Meta-model story. The evidence favours coherence; the hackathon favours Spark. That trade is a product decision, not a research finding.
