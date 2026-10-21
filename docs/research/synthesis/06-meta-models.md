# Synthesis — Stream 06: Meta Models (Hackathon Integration)

- **Stream:** 06 — Meta Models (Hackathon) — How to integrate Muse Spark / Image / SAM 3.1 for scoring + product value
- **Synthesized:** 2026-10-20
- **Contributors compared:** 5 — `muse-spark-2026-10-20` (25 sources), `google-gemini-3.8-flash-2026-10-20` (7 sources), `ollama-launch-deepseek-v4.1-flash-2026-10-20` (8 sources), `ollama-launch-minimax-m3.1-flash-2026-10-20` (47 sources), `openai-gpt-6-2026-10-20` (29 sources) · Argon missing (no `06-meta-models.md` in that folder)

---

## 1. What the contributors agree on

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|----------------|---------------|-----------|-------------------------|
| A-01 | **Muse Spark is the companion voice, not the agent.** Every contributor converges on the same architecture: the *fence* decides (deterministic policy), the *agent* acts (any runtime), and *Muse Spark* explains — teaching dial, plan decomposition, queue drafting. | `muse-spark` (Spark 1.3 as "primary companion brain" + API wiring sketch), `minimax` (two-tier routing table + "fence decides, agent acts, Spark explains"), `deepseek` ("use Meta's models for the companion, not for the agent"), `gpt-6` (F03 — bounded explanation object tied to evidence IDs). Canonical: [dev.meta.ai/docs/models](https://dev.meta.ai/docs/models) (1,048,576-token context, multimodal input) — minimax S-1.1 / gpt-6 S-03. | `unanimous` | **copy** |
| A-02 | **The fence decides deterministically; the model never authorizes.** Deterministic guardrails (secret scan, dep audit, branch checks) must be model-independent. The model's explanation must never mint an authorization or flip a failed check to a pass. | `deepseek` ("No model makes a security decision; no policy depends on a model's judgement"), `gpt-6` (F02 — validated structured output still can carry wrong explanation; Proposed sequence step 1: "same operation must produce the same rule decision with the model absent"), `minimax` ("the harness's own value is not model capability — enforcement, verification, teaching, batching"). | `strong` (4/5 explicitly; gemini/muse-spark implicit in their wiring sketches) | **copy** |
| A-03 | **vibe-fence is complementary to Muse Code, not a competitor.** Muse Code is a harness+agent co-trained pair; vibe-fence is the portable policy/teaching layer that works *inside* Muse Code and across other agents. | `muse-spark` (Muse Code §: "We built vibe-fence *for* Muse Code (and every other agent)"), `deepseek` (MC-01–MC-03 — treat as adapter target, copy event log, don't duplicate `/plan`/`/grill`), `minimax` (§5.3 — Muse Code already sandboxes/approvals; vibe-fence differentiation is portability + teaching + detection). Source: [research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2](https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2) — deepseek S-05 / minimax S-27 / muse-spark. | `unanimous` | **copy** |
| A-04 | **SAM 3.1 has no natural role in a code harness's critical path.** All five state this plainly. It segments images/video into boxes+masks — it does not understand code, intent, or safety. Forcing it into the main loop is cargo-culting. | `muse-spark` ("SAM 3.1 has no natural role inside a code harness"), `gemini` ("Poor fit for code editing"), `deepseek` (SA-04 — "Do not use segmentation to understand the codebase"), `minimax` (§4.4 — "vibe-fence's core loop operates on files, git history, dependency manifests; SAM operates on photographs"), `gpt-6` (F07 — "Do not advertise segmentation as a privacy detector"). Source: [dev.meta.ai/docs/sam/overview](https://dev.meta.ai/docs/sam/overview) — minimax S-21 / gpt-6 S-13. | `unanimous` | **avoid** |
| A-05 | **Muse Image is demo polish / asset generation, not a core safety feature.** `$0.01/image`, generate-once-at-init for OG card / hero / before-after visuals. Useful, cheap, not on the critical path. | `muse-spark` (P2 — $0.01/image, demo polish amplifier), `deepseek` (MI-01 — strong for app assets, weak for UI mockup art-direction), `minimax` (T3 — `b64_json`+webp straight to disk, `enable_shell` code-layout generation). Source: [dev.meta.ai/docs/image-generation](https://dev.meta.ai/docs/image-generation) — minimax S-19 / gpt-6 S-12. | `unanimous` | **copy** |
| A-06 | **The demo is a Before/After with an eval table — the demo *is* the eval.** Same prompt, same agent, with vs without fence; scored on file hygiene, secrets, deploy correctness, structure. Small table (5 tasks × rubric) beats benchmark claims. | `muse-spark` ("Before/after as the eval story"), `gemini` ("Visceral 30-Second Delta"), `deepseek` (§8 demo + §10.5 eval table), `minimax` (§10.4 90-sec wire + §10.5 5×4 table), `gpt-6` (Proposed demo + 24-case evaluation). Criterion grounding: Impact 30% + Demo 25% — muse-spark + minimax waiver extraction. | `unanimous` | **copy** |
| A-07 | **Contributor mode is a privacy trade-off, not a free discount.** Contributor pricing ($0.10/$0.20 per 1M vs $1.25/$4.25) means "your prompts, code, files, context + responses may be used to train future Meta models." Using it silently for private code contradicts a safety product. | `minimax` (§1.4 — strongest statement, with 150 RPM vs 3,000 RPM limit), `gpt-6` (F04 — Standard not used for training, but not zero-retention), `deepseek` (gaps — notes unverified pricing, warns on transfer risk). Source: [dev.meta.ai/docs/pricing-rate-limits](https://dev.meta.ai/docs/pricing-rate-limits) — minimax S-3 / gpt-6 S-07. Muse-spark contributor omits the data cost — see D-03. | `strong` (3/5 explicitly; muse-spark & gemini mention pricing without the warning) | **copy** |
| A-08 | **Muse Code's `AGENTS.md` chain is vibe-fence's wire format.** Muse Code walks to `.git` boundary checking `AGENTS.md` → `CLAUDE.md` → `.agents/AGENTS.md` → `.claude/CLAUDE.md`, project-over-user, deeper-over-shallower. vibe-fence writes `AGENTS.md`; no plugin needed. | `minimax` (§5.2 — flagged as "single most decision-relevant finding in the stream," with 47 sources fetched live), `gpt-6` (F08–F09 — permissions + hooks layer, project trust). Source: [dev.meta.ai/docs/muse-code/configuration](https://dev.meta.ai/docs/muse-code/configuration) / [dev.meta.ai/docs/muse-code/permissions](https://dev.meta.ai/docs/muse-code/permissions) — minimax S-28/S-29. Muse-spark & deepseek describe Muse Code more shallowly; gemini omits entirely. | `strong` (2 deep + 3 shallow/omitted) | **copy** |

---

## 2. Where they disagree

### D-01 — One model or two? Spark-only vs Wonder + Spark routing

- **Reading A (muse-spark, gemini, deepseek, gpt-6):** Muse Spark is the companion — pick one Spark version (1.3 latest recommended) for all companion tasks. Wonder is not mentioned; `muse-spark` treats Spark as "Meta's frontier model."
- **Reading B (minimax):** Meta lists **six** hosted model lines. **Muse Wonder** (`muse-wonder-1.0`) is "Meta's most capable model, built for complex software engineering and long-horizon agentic work" — Meta's own coding-agent guides use Wonder for the main loop and Spark 1.3 for subagents. The right split is Wonder for plan/verify (hard, high-stakes) + Spark 1.3 for everyday classification/teaching/triage (high-volume, cost-sensitive), same base URL, model-ID swap. Source: [dev.meta.ai/docs/models](https://dev.meta.ai/docs/models) + [dev.meta.ai/docs/coding-agents](https://dev.meta.ai/docs/coding-agents) — minimax [1][15][16][25].
- **Resolution:** **Reading B is better grounded.** Minimax is the only contributor that fetched `dev.meta.ai/docs/models` live and found the six-line catalogue; the others relied on blog posts that predate Wonder or omitted it. Adopting B does not contradict A — it *extends* it: Spark remains the volume companion, Wonder is the escalation tier for the plan/verify gate where a wrong plan costs real user work.
- **Why it matters for Phase 1:** Determines `src/framework/intercept.ts` routing: single-model vs two-tier. Two-tier costs 3.2× on plan/verify calls but isolates the expensive model to one gate. Wiring is one model-ID change.

### D-02 — Responses API: `previous_response_id` vs stateless encrypted replay

- **Reading A (muse-spark, gemini):** Use `POST /v1/responses` with `previous_response_id` chaining for session state; stateful is the default.
- **Reading B (minimax, gpt-6):** Responses API offers two modes — **stateless encrypted reasoning replay** (marked *recommended*: "Nothing is stored server-side," reasoning travels as encrypted items) vs server-managed `previous_response_id`. For user-code paths, stateless is both Meta's recommendation and the better privacy story. Reserve `previous_response_id` for Muse Image multi-turn refine. Evidence: [dev.meta.ai/docs/protocols/responses](https://dev.meta.ai/docs/protocols/responses) — minimax [7]; choosing-API docs — gpt-6 S-08. Also: Responses API is the *only* endpoint that carries chain-of-thought across turns; Chat Completions alone loses it (gpt-6 F01).
- **Resolution:** **Reading B.** It cites the protocol docs directly; Reading A misreads the recommended mode. Implement stateless replay for companion calls.
- **Why it matters for Phase 1:** Affects every `POST /v1/responses` call in the harness, billing (cached-prefix preservation), and the privacy pitch ("nothing stored server-side").

### D-03 — Contributor mode: "claim it early" vs "never by default"

- **Reading A (muse-spark):** "Claim Contributor pricing early … $0.10 in / $0.20 out — dramatically cheaper … 12× cheaper — ideal for hackathon volume."
- **Reading B (minimax, gpt-6):** Contributor = "your content may be used to train future Meta models" — defined as prompts, code, files, context + responses. Bound to 150 RPM (vs 3,000 RPM Standard). For a product whose thesis is "your code is safe," defaulting to training-use is a contradiction. Use Standard for user code; offer Contributor as explicit opt-in for synthetic/demo content only. Sources: pricing + subscription docs — minimax [3][31], gpt-6 S-07.
- **Resolution:** **Reading B.** Reading A omits the data-use term entirely.
- **Why it matters for Phase 1:** Default config choice in `.fence/config.json`; demo hot path must be Standard (RPM constraint alone); submission must disclose the trade-off honestly.

### D-04 — SAM's minimal credible use: thin screenshot slice vs click-to-teach vs skip

- **Reading A (muse-spark):** 1-hour "screenshot element locator" — screenshot → SAM segments UI elements → Spark reasons over labeled regions. Or "skip entirely" — one deep Spark integration beats three shallow ones.
- **Reading B (gemini):** "Mockup-to-Layout Bridge" — SAM segments screenshot into `navbar`/`sidebar`/`hero_card`/`data_table` and hands structured topology to Spark.
- **Reading C (minimax + gpt-6):** Gemini's plan is not implementable as written: SAM takes **one concept per request** (`"bus, bicycle"` → zero matches) and returns **boxes+masks, never semantic names** — six regions need six calls. Vendor's intended order is Spark→SAM ("let Spark interpret the scene, decide what to segment, then hand the concept to SAM for masks"), not SAM→Spark. Honest minimal use: click-to-teach (user clicks element → box+point prompt → mask → Spark reasons) or skip. Sources: [dev.meta.ai/docs/sam/segmenting](https://dev.meta.ai/docs/sam/segmenting) — minimax [21][22][23]; gpt-6 S-13.
- **Resolution:** **Reading C.** It is the only one grounded in the prompted-API docs. A forces geometry into semantics; B ignores the one-concept limit and invents an endpoint (`/v1/cv/sam-3.1/segment`) not in the API reference. Adopt C's ordering and one-concept constraint.
- **Why it matters for Phase 1:** Prevents a broken SAM integration and a credibility hit with technical judges; determines whether SAM ships at all and how its prompt is constructed.

### D-05 — Muse Code's role: reference adapter vs one of many

- **Reading A (muse-spark):** Build the Muse Code adapter first as the reference adapter; show vibe-fence inside Muse Code's CLI live — judges recognize it.
- **Reading B (minimax):** Deeper: `AGENTS.md` *is* the adapter — writing the right files is sufficient for Muse Code to pick up the fence. But Muse Code already has approvals + Seatbelt/bubblewrap sandbox + read-only `.git/.muse/.agents` — vibe-fence cannot claim "we add sandboxing for Muse Code." Differentiation is *portability* + teaching + detection.
- **Resolution:** **Both true — synthesize as "Muse Code is the proof point; portability is the product."** Build the Muse Code adapter first (writes `AGENTS.md` + `.agents/memory/` + hooks), demo in Muse Code, but frame the win as "same policy, every runtime." Adopt minimax's honesty caveat.
- **Why it matters for Phase 1:** Adapter architecture (file-based vs plugin), pitch framing, and what not to claim under judge questioning.

### D-06 — Depth vs breadth on Meta tooling for the 25% Tooling score

- **Reading A (gemini):** High scoring leverage for SAM + Image breadth — multi-model orchestration where each model has a distinct job.
- **Reading B (muse-spark, minimax, deepseek, gpt-6):** Depth > breadth. Rubric clause is "went beyond a basic integration" / "surfaced unexpected capabilities." One deep, surprising Spark use (agentic harness that teaches) beats a shallow tour. Forced SAM breadth is the opposite of that.
- **Resolution:** **Reading B (majority + tighter rubric reading).** Still include Image (cheap breadth) and optionally Glimmer (named in waiver); keep SAM out of the critical path.
- **Why it matters for Phase 1:** Build priority — what gets the 90-second slot vs appendix vs README disclosure.

### D-07 — Which open-weights model actually fits the product

- **Reading A (muse-spark):** Muse Spark Open (816B/42B MoE) as the offline / cost-sensitive option for guardrails.
- **Reading B (minimax, gpt-6):** Spark Open is 8× B300 / ~2 TB VRAM (BF16) or 537 GB NVFP4 — not self-hostable by a hackathon team or novice. **Muse Glimmer 30B** (17–20 GB quantized, Apache-2.0, 128K context, Ollama/llama.cpp/vLLM/SGLang) is the only self-hostable path; waiver names Glimmer explicitly. Use Glimmer for local classification (secret?, which guardrail?, dial level?) while Spark stays on API. Sources: [dev.meta.ai/docs/muse-spark-open](https://dev.meta.ai/docs/muse-spark-open) / [dev.meta.ai/docs/muse-glimmer](https://dev.meta.ai/docs/muse-glimmer) — minimax [36][38][39], gpt-6 S-18/S-19.
- **Resolution:** **Reading B.** Hardware maths is decisive; Glimmer is also the only waiver-named open-weights model that is locally deployable.
- **Why it matters for Phase 1:** Local-companion architecture, what gets benchmarked offline, and which partner credits fund which tier.

---

## 3. Unique contributions

| Contributor | Unique contribution | Evidence | Adopt? |
|-------------|---------------------|----------|--------|
| **minimax** | **Meta ships six hosted model lines; Muse Wonder is top-end, Spark is cost/latency.** Entire Wonder findings (§2) — `muse-wonder-1.0` as main-loop model, Wonder Full as subscription-only, model-card quotes ("performance can vary with … the agent harness" + human-in-the-loop recommendation), benchmark caveat ("best-effort … may not be optimally tuned for proprietary models"). | [dev.meta.ai/docs/models](https://dev.meta.ai/docs/models), [dev.meta.ai/models/muse-wonder](https://dev.meta.ai/models/muse-wonder), model card PDF — minimax [1][25][26] | **Yes — P0** |
| **minimax** | **`tool_search` + flatten-the-schema constraints.** Recursive JSON Schema → HTTP 400; `tool_search` cannot co-occur with `json_schema` → HTTP 400; `tool_search` is Responses-API-only, one per request, namespace <10 functions; preserves cache prefix. Vibe-fence's large guardrail tool surface needs `tool_search`; issue queue must be flat. | [dev.meta.ai/docs/structured-output](https://dev.meta.ai/docs/structured-output), [dev.meta.ai/docs/tool-search](https://dev.meta.ai/docs/tool-search) — minimax [9][11] | **Yes — P0** |
| **minimax** | **`reasoning_effort: "none"` → HTTP 400; silent = don't call model.** `minimal`/`low`/`medium`/`high`/`xhigh`/`max` only; `max` unavailable on `*-contributor`. | [dev.meta.ai/docs/reasoning](https://dev.meta.ai/docs/reasoning) — minimax [12] | **Yes — P0** |
| **minimax** | **`AGENTS.md` chain with trust gate + `MEMORY.md` prompt-injection warning.** File precedence, project-over-user, deeper-over-shallower; memory read even untrusted vs skills/rules/hooks trust-gated. | [dev.meta.ai/docs/muse-code/configuration](https://dev.meta.ai/docs/muse-code/configuration), [dev.meta.ai/docs/muse-code/permissions](https://dev.meta.ai/docs/muse-code/permissions) — minimax [28][29] | **Yes — P0** |
| **minimax** | **Muse Code permissions/sandbox specifics.** Approval vs sandbox layers, staged compound-command review, read-only `.git/.muse/.agents`, network profiles, `muse init` vs fence collision, workflow engine missing on Apple Silicon, session messaging trust rule. | [dev.meta.ai/docs/muse-code/permissions](https://dev.meta.ai/docs/muse-code/permissions), workflows/session-messaging — minimax [28][30][32][33][34] | **Yes — P1** |
| **minimax** | **`computer` tool (Responses-API-only, Muse Wonder, OSWorld benchmark).** "Let it drive" — protocol not VM; harness owns env + safety. For "fix this" reproduction step. | [dev.meta.ai/docs/computer-use](https://dev.meta.ai/docs/computer-use) — minimax [17] | **Consider — P2** |
| **minimax** | **Pricing nuance: no long-context premium; `web_search` $2.50/1K; image search included; `b64_json` webp without CDN; per-team limits; background 600/min.** | [dev.meta.ai/docs/pricing-rate-limits](https://dev.meta.ai/docs/pricing-rate-limits) — minimax [3] | **Yes — P0** |
| **minimax** | **LlamaCon 2025 winner analysis (OrgLens/Compliance Wizards/CCTV Operator/Geo-ML) mapped to "long context → structured artifact" + "defined in simple language."** | [ai.meta.com/blog/llamacon-hackathon](https://ai.meta.com/blog/llamacon-hackathon/) — minimax S-42 | **Yes — P1** |
| **minimax** | **15-row contradiction table against both sibling files (SAM endpoint, Wonder omission, 32fps unverified, glimmer priority).** | minimax §7 | **Yes — keep as review aid** |
| **gpt-6** | **Validated-structured-output discipline + model-independent companion contract.** Bounded `{finding_id, explanation, question, options, evidence_ids}` with app-side semantic checks; model cannot grant permissions/findings. | gpt-6 F02 + Proposed sequence | **Yes — P0** |
| **gpt-6** | **Canary hook enforcement test + version-pinned SDK contract.** Malformed hooks warn but contribute no handlers; adapter must prove enforcement with harmless canary denial and pin binary/SDK/protocol versions. | gpt-6 F09–F10, S-16/S-17 | **Yes — P0 for Muse Code adapter** |
| **gpt-6** | **Fireworks preview expiry + offline as end-to-end condition.** Serverless is US-only preview through Oct 29 → not a November commitment; "offline" requires network-disabled test; don't equivote Spark Open ≠ Glimmer. | gpt-6 F11–F13, S-24 | **Yes — P1** |
| **gpt-6** | **24-case evaluation design across hazard/benign/ambiguous/failure.** 8 hazards + 8 benign + 4 ambiguous + 4 infra failures; measure incorrect allows, unnecessary blocks, explanation factuality, disposition latency/cost; include prompt-injection-like content. | gpt-6 Proposed evaluation | **Yes — adopt as eval spec** |
| **deepseek** | **`fence look` visual verification as the signature demo.** Playwright render → Spark reads pixels → plain-language "button is below the fold" → fix → re-check. Only feature a non-technical judge evaluates in 5 seconds. | deepseek MS-03, Implications 2 | **Yes — P1** |
| **deepseek** | **Co-training transfer risk for Spark 1.2.** Harness-tuned model may underperform in foreign harnesses; cross-runtime eval required before claiming "works with any agent." | deepseek MS-05, S-05 | **Yes — required if claiming portability** |
| **deepseek** | **Append-only `events.ndjson` as canonical state.** Every model call, tool run, approval, edit appended; queue/dial/deploys derived — replay-exact, restart-safe, free demo artefact. | deepseek MC-02 | **Yes — P1** |
| **deepseek** | **Modal sandboxes as the technical-ambition card.** | deepseek OW-01 | **Yes — P1** |
| **muse-spark** | **Contributor-mode pricing table + image generation anchored composition.** $1.25/$0.15/$4.25 vs $0.10/$0.002/$0.20; Contributor at 150 RPM; Spark 1.3 "Recommended for new work" + `reasoning_effort: "max"` support. | muse-spark Spark § + pricing table, [dev.meta.ai/docs/pricing-rate-limits](https://dev.meta.ai/docs/pricing-rate-limits) | **Yes — but with minimax/gpt-6 privacy caveat** |
| **muse-spark** | **Pass/fail gate framing + submission front-load advice.** Theme fit + "really uses Meta tools" before weighted scoring; front-load README with theme sentence, Spark depth, demo link. | muse-spark §10.6–10.9 | **Yes — P0 for submission** |
| **gemini** | **`vibe-mockup` narrative + `vibe-asset` into `public/images/`.** Non-technical "make my dashboard look like this screenshot" workflow. | gemini SAM 3.1 + Image § | **Partial — SAM part replaced by minimax-corrected one-concept click-to-teach; asset part kept** |
| **gemini** | **Before/After visceral framing with concrete failure (Supabase key into `NEXT_PUBLIC_`, terminal hell).** | gemini Winning Patterns §1 | **Yes — reuse for demo script** |

---

## 4. Gaps in the collective research

1. **No live API calls were made.** All five contributors worked from docs/blogs; none exercised `api.meta.ai` with a key. Rate limits, error shapes (recursive schema 400, `reasoning_effort: "none"` 400, `tool_search` + schema 400, SAM 17-object 400), pricing, and throughput are documentation-derived. Close with one keyed smoke test before committing the harness's request shapes — especially the flat schema + `tool_search` sequencing and stateless replay.
2. **Official Rules still unpublished (due before Oct 26).** Submission form fields, whether a code repo is required, demo video length, Official Rules packaging, and live-finals format are unknown. All advice on video length ("under 3 min"), repo requirement, and "passing the gate" is third-party or inference. Re-read Rules on arrival and re-check the form.
3. **Geographic restriction country list is unverified.** Policy page JS table was unreadable to four contributors; specific blocked countries (Pakistan/Ethiopia/Venezuela/Iraq/Cambodia + Image in India) come from Reconscribe snippet only — minimax flagged. Phase 1 needs a direct policy-page read before publishing any availability claim; Glimmer path is the universal fallback.
4. **No independent Spark vs current Claude/GPT/Gemini comparison.** Vendor-reported benchmarks (Muse Wonder vs Claude Fable 5.1 / GPT-6 Astra / Claude Opus 5.5) are "best-effort … may not be optimally tuned for proprietary models" per the model card. Don't quote as competitive superiority; routing (Wonder for hard tasks, Spark for volume) is the correct use.
5. **Cross-harness transfer of `muse-spark-1.2` (harness co-trained) is unmeasured.** Deepseek's hypothesis that co-training degrades foreign-harness performance has no published eval. If Phase 1 claims "any agent," run same task across ≥2 runtimes, same model, pass rate per runtime — before the pitch.
6. **Muse Glimmer offline cost/quality is unmeasured.** Quantized VRAM (17–20 GB), latency, and explanation quality at `low`/`medium`/`high` on real quantization builds were not benchmarked. Gpt-6 correctly notes: don't treat Spark Open (816B) and Glimmer (30B) as interchangeable; test Glimmer with networking disabled on the target device.
7. **Partner credit redemption mechanics unverified.** $150 Model API + $100 Baseten (2M TPM) + $100 Modal + $25 Fireworks = $375 total is from the event page, but Modal's normal-credit exclusion and Fireworks preview expiry (Oct 29, US-only) mean the special-offer terms must be confirmed after acceptance. Budget at paid Model API rates until grants appear in-dash.
8. **Muse Code docs incomplete on SDK/slash-commands.** Sibling claims about `/grill`, `/goal`, and a "TypeScript MSP over stdio SDK" could not be confirmed from official pages; documented commands are `/`, `/help`, `/keymap`, `/new`, `/clear`, `/name`, `/resume`, `/fork`, `/stop`, `/models`, `/effort`, `/theme`, `/subagents`, `/tasks`, `/workflows`, `/login`. Workflows missing on Apple Silicon macOS is documented. Verify on the demo machine in week 1.
9. **No measured novice benefit for Image/SAM workflows.** Image briefs and SAM click-to-teach have no UI-domain evaluation. Don't promise "better product" from media models — promise "optional visual requirement support" and evaluate separately.
10. **SAM throughput + Muse Image pixel cap remain unverified.** "32 fps on H100" and "up to 1600 px" from muse-spark appear nowhere in official Model API docs (minimax gaps 1–2). The only confirmed SAM limits are one-concept-per-request and 16 prompted objects.

---

## 5. The consolidated answer

Muse Spark 1.3 is the companion brain for teaching, classification and queue drafting via `POST /v1/responses` in stateless encrypted-replay mode — but the plan-and-verify gate belongs on Muse Wonder, Meta's most capable coding model, a one-line model-ID swap on the same base URL. Deterministic code owns every security decision; Spark's structured output is bounded to `{finding_id, explanation, question, options, evidence_ids}` and validated app-side, never authorizing anything. The `AGENTS.md` chain *is* the Muse Code wire format (project-over-user, deeper-over-shallower, trust-gated), so the reference adapter is file-writing, not a plugin — portability across Claude Code/Codex/Cursor/OpenCode is the honest differentiator since Muse Code already sandboxes and approves. SAM 3.1 is honest-as-geometry only (one concept per request, boxes+masks never semantic labels) and stays out of the critical path; its only credible use is click-to-teach or a redacted figure, with Spark choosing the concept. Muse Image at $0.01/image writes `b64_json`+webp OG cards straight to disk; Standard pricing (not Contributor by default) keeps private code out of training data. The demo is the eval — same task with vs without the fence, scored on structure, secrets, git hygiene and deploy — recorded on day 8–9.

---

## 6. Actions for Phase 1

### Copy (do this)

1. **Wire Spark 1.3 via `POST /v1/responses` (stateless encrypted replay) + Wonder escalation tier on same base URL** — muse-spark + minimax §1.1b/§2.1/§10.1 — `src/framework/intercept.ts`: `MODEL_API_KEY` Bearer, model `muse-spark-1.3` (and `muse-wonder-1.0` for plan/verify), rate-limit headers `x-ratelimit-*`, error handling per cookbook.
2. **Emit `AGENTS.md` (+ `.agents/AGENTS.md` overrides + `.agents/memory/MEMORY.md`) as the fence's canonical policy format** — minimax §5.2 — `src/adapters/muse-code/`: writes repo-root `AGENTS.md`, merges (not clobbers) existing; Muse Code loads natively per directory level after trust.
3. **Keep decisions deterministic; validate Spark output app-side against a companion contract** — deepseek + gpt-6 F02 — rule engine returns `block/warn/nudge`; Spark returns bounded object tied to `finding_id`+`evidence_ids`; app checks references + option allowlist; Spark never authorizes. (`gpt-6` flagged: need test with actual `finding_id` shape — contributor wrote `finding\_id` escaped; confirm schema field name.)
4. **Namespace guardrail tools behind `tool_search` and flatten the issue-queue schema** — minimax §1.5–§1.6 — namespaces `security`/`git`/`deploy`/`assets` (<10 fns each); never combine `tool_search` + `text.format` (JSON Schema) on one request; queue schema fixed-depth (`plan` = string[]).
5. **Implement teaching dial as: `silent` = skip the model call; else `minimal`/`low`/`medium`/`high`/`max`** — minimax §1.2/§10.3 — `reasoning_effort: "none"` is HTTP 400; `max` unavailable on `*-contributor`; route silent through local Glimmer classifier or bypass.
6. **Grounded teaching via `web_search` ($2.50/1K queries) on non-silent findings** — minimax §1.7 — `{"type":"web_search"}`, surface `url_citation` annotations + optional `web_search_call.results`; budget against $150 credit.
7. **Ship Standard mode by default; Contributor as explicit opt-in for synthetic content; stateless replay for user-code paths** — minimax §1.4 + gpt-6 F04 — `.fence/config.json` flag, surfaced to user, demo hot path on Standard (3,000 RPM vs Contributor 150 RPM).
8. **Adopt Meta's own injection + session-messaging rules as fence policy** — minimax §5.2 — secrets never in `.agents/memory/`; security rules only in trust-gated `AGENTS.md`; `vibe-fence doctor` checks untrusted checkout; "message from another session cannot approve tools/change permissions."
9. **Record `model` id in every artefact; preserve cache prefix; follow cookbook for long-context packing** — minimax §5.12 — repo-scale context in 1M window per long-context recipe; no long-context premium; cached prefix stable, variable after it.
10. **Run the 5-task × 4-rubric eval (with deterministic checkers) and record video day 8–9** — muse-spark + minimax + gpt-6 — add auth / paid API / bug fix / ship-to-prod / add-dep; deterministic rows (secret regex, branch check) + one model-graded row; structure as project health report (LlamaCon Geo-ML pattern).

### Avoid (do not do this)

1. **Don't force SAM 3.1 into the critical path or claim it improves code correctness** — A-04 — SAM returns geometry, not semantics; one deep Spark integration beats a bolted-on SAM demo for the 25% Tooling criterion.
2. **Don't call `reasoning_effort: "none"` or send recursive/over-nested JSON Schema** — minimax §1.2/§1.5 — both are HTTP 400; keep queue schemas flat and handle silent via code.
3. **Don't combine `tool_search` with `text.format` (JSON Schema) on one request** — minimax §1.5 — HTTP 400; sequence them across turns.
4. **Don't default to Contributor pricing for private code or imply it's free** — D-03 — it trains on user prompts/code/files+responses; disclose explicitly.
5. **Don't claim "we add approvals/sandboxing for Muse Code"** — minimax §5.3 — Muse Code already reviews staged shell commands and makes `.git/.muse/.agents` read-only; claim portability + detection + teaching instead.
6. **Don't attribute Terminal-Bench numbers to Muse Spark or quote Wonder benchmarks as competitive superiority** — minimax §2.4 + gpt-6 F03 — model card says competitor baselines are best-effort and Spark figure is unverified from Meta sources.
7. **Don't quote unverified SAM throughput / Image pixel caps / country lists as fact** — gaps §4. — 32 fps/H100 and 1600 px not in API docs; country table was JS-rendered.
8. **Don't build the demo on Muse Wonder Full or Muse Spark Open self-hosted** — minimax §2.2 — Wonder Full is subscription-only (Power/Maximum Usage, not on Model API); Spark Open needs 8×B300/2 TB VRAM; Glimmer is the local model.
9. **Don't treat Fireworks serverless preview as a November commitment or Spark Open ≡ Glimmer** — gpt-6 F11/F13 — preview through Oct 29, US-only; hardware footprints differ by orders of magnitude.

### Invent (we must build this, nobody has)

1. **The portable guardrail harness itself** — `npx vibe-fence init` writes `AGENTS.md` + `.fence/` + per-directory overrides that work across Muse Code/Claude Code/Codex/Cursor/OpenCode — adapter work is harness-protocol, not model plumbing, since the API is OpenAI-/Anthropic-compatible with a base-URL swap.
2. **The teaching-dial companion contract** — model-independent `{finding_id, explanation, question, options, evidence_ids}` validated app-side, with `silent=skip-call` routing, `web_search`-grounded citations, and an explicit "model cannot grant permission" invariant from the fence — tested with network-disabled Glimmer fallback.
3. **Click-to-teach SAM audit (if SAM ships)** — Spark interprets scene → decides concept → SAM returns mask(s) one concept at a time → Spark reasons over masked crop + 1M repo context — triggered by user click → box+point prompt, $0.0025/screenshot, not in critical path.
4. **`fence look` visual verification gate** — Playwright render → stateless Spark reads pixels → plain-language finding ("checkout button below fold on phone") → fix → re-check — the only feature a non-technical judge evaluates in seconds, and the strongest Indie-track differentiator.
5. **Canary-enforced hook adapter + version-pinned SDK contract** — on install, harmless canary denial proves hooks actually loaded (malformed hooks warn without handler); binary/SDK/protocol versions recorded; resume/cancellation/denial proven before "protected run" is claimed.
6. **End-to-end privacy claim made literal** — sensitive classification on Glimmer 30B local (no API call), Standard + stateless replay for user-code API paths, secrets never in `MEMORY.md`, PII-masked crops before any screenshot API call — testable by "code never leaves the machine" on the classified path.

---

## 7. Open questions we could not resolve

- [ ] **Does Muse Spark quality transfer across foreign harnesses?** Muse Spark 1.2 was co-trained on Muse Code — does it degrade in Claude Code/Cursor? — Same task × ≥2 runtimes, one model, pass rate per runtime, controlled harness.
- [ ] **What are the Official Rules' packaging requirements?** Repo required? Video length? Prior-work eligibility? Pre-event build window? — Re-read Rules + check submission form the day they appear.
- [ ] **What is the true geographic availability of Model API?** Which countries block Muse Image vs full API? — Direct read of [dev.meta.ai/legal/geographic-use-policy](https://dev.meta.ai/legal/geographic-use-policy) country table (JS-rendered) + test from affected region.
- [ ] **Can `tool_search` + large guardrail surface sustain 1M-context teaching without blowing token budget?** How many deferred namespaces before cache-prefix savings vanish? — Measure tokens/turn with/without `tool_search` on a real repo-scale prompt.
- [ ] **Does Glimmer 30B quantized match Spark 1.3 on the classification tasks that gate silent/model vs local?** — Benchmark the same 24-case eval (gpt-6 §6) on Glimmer vs Spark 1.3; report per-quantization accuracy + latency.
- [ ] **What is the real cost per verified fix under the actual harness's request shapes?** — Instrument every `/v1/responses` call (input/cached/output + `web_search` + Image) for the 5-task eval; publish measured $/task at Standard pricing.
- [ ] **Should the companion ever run on the user's own agent model (e.g. Claude for Claude Code) instead of Spark?** Coherence vs Meta-tooling story trade — A/B: same fence, companion = user's model vs Spark, scored on correction acceptance + teaching quality + judge preference.

---

## 8. Sources

| # | Source | Type | Accessed | From |
|---|--------|------|----------|------|
| 1 | [Meta Model API — Models](https://dev.meta.ai/docs/models) | docs | 2026-10-20 | minimax, muse-spark, deepseek, gpt-6 |
| 2 | [Meta Model API — Overview](https://dev.meta.ai/docs/overview) | docs | 2026-10-20 | minimax, muse-spark, deepseek, gpt-6 |
| 3 | [Meta Model API — Pricing and rate limits](https://dev.meta.ai/docs/pricing-rate-limits) | docs | 2026-10-20 | minimax, muse-spark, deepseek, gpt-6 |
| 4 | [Meta Global AI Developer Hackathon — event page](https://dev.meta.ai/events/global-hackathon) | official event | 2026-10-20 | minimax, muse-spark, deepseek, gpt-6, gemini |
| 5 | [Meta Global AI Developer Hackathon — Cerebral Valley listing](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) | official event | 2026-10-20 | minimax, gpt-6, gemini |
| 6 | [Hackathon Application & Event Waiver](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver) | event waiver | 2026-10-20 | minimax |
| 7 | [Meta Model API — Responses API](https://dev.meta.ai/docs/protocols/responses) | docs | 2026-10-20 | minimax, gpt-6 |
| 8 | [Meta Model API — Tool calling](https://dev.meta.ai/docs/tool-calling) | docs | 2026-10-20 | minimax |
| 9 | [Meta Model API — Structured output](https://dev.meta.ai/docs/structured-output) | docs | 2026-10-20 | minimax, gpt-6 |
| 10 | [Meta Model API — Search grounding](https://dev.meta.ai/docs/search-grounding) | docs | 2026-10-20 | minimax |
| 11 | [Meta Model API — Tool search](https://dev.meta.ai/docs/tool-search) | docs | 2026-10-20 | minimax |
| 12 | [Meta Model API — Reasoning](https://dev.meta.ai/docs/reasoning) | docs | 2026-10-20 | minimax, gpt-6 |
| 13 | [Meta Model API — Prompt caching](https://dev.meta.ai/docs/prompt-caching) | docs | 2026-10-20 | minimax |
| 14 | [Meta Model API — Quickstart](https://dev.meta.ai/docs/quickstart) | docs | 2026-10-20 | minimax |
| 15 | [Use Model API with coding agents](https://dev.meta.ai/docs/coding-agents) | docs | 2026-10-20 | minimax |
| 16 | [Agent frameworks](https://dev.meta.ai/docs/agent-frameworks) | docs | 2026-10-20 | minimax |
| 17 | [Build a computer-use agent](https://dev.meta.ai/docs/computer-use) | docs | 2026-10-20 | minimax |
| 18 | [Meta Model API — Cookbook](https://dev.meta.ai/docs/cookbook) | docs | 2026-10-20 | minimax |
| 19 | [Image generation with Muse Image](https://dev.meta.ai/docs/image-generation) | docs | 2026-10-20 | minimax, muse-spark, gpt-6 |
| 20 | [Muse Image — model page](https://dev.meta.ai/models/muse-image) | model page | 2026-10-20 | minimax, muse-spark, gpt-6 |
| 21 | [Segmentation with SAM (overview)](https://dev.meta.ai/docs/sam/overview) | docs | 2026-10-20 | minimax |
| 22 | [Segmenting with prompts — SAM 3.1](https://dev.meta.ai/docs/sam/segmenting) | docs | 2026-10-20 | minimax |
| 23 | [Media segmentation](https://dev.meta.ai/docs/media-segmentation) | docs | 2026-10-20 | minimax, gpt-6 |
| 24 | [SAM 3.1 — model page](https://dev.meta.ai/models/sam-3-1) | model page | 2026-10-20 | minimax, muse-spark |
| 25 | [Muse Wonder — model page](https://dev.meta.ai/models/muse-wonder) | model page | 2026-10-20 | minimax |
| 26 | [Muse Wonder Model Card (PDF)](https://research.meta.ai/static/muse-wonder-model-card) | model card | 2026-10-20 | minimax |
| 27 | [Muse Code — overview](https://dev.meta.ai/docs/muse-code) | docs | 2026-10-20 | minimax, gpt-6 |
| 28 | [Muse Code — Permissions and safety](https://dev.meta.ai/docs/muse-code/permissions) | docs | 2026-10-20 | minimax, gpt-6 |
| 29 | [Muse Code — Configuration and context](https://dev.meta.ai/docs/muse-code/configuration) | docs | 2026-10-20 | minimax |
| 30 | [Muse Code — Extending and automating](https://dev.meta.ai/docs/muse-code/extending) | docs | 2026-10-20 | minimax, gpt-6 |
| 31 | [Muse Code — Subscriptions](https://dev.meta.ai/docs/muse-code/subscriptions) | docs | 2026-10-20 | minimax |
| 32 | [Muse Code — Run multi-agent workflows](https://dev.meta.ai/docs/muse-code/workflows) | docs | 2026-10-20 | minimax |
| 33 | [Muse Code — Session messaging](https://dev.meta.ai/docs/muse-code/session-messaging) | docs | 2026-10-20 | minimax |
| 34 | [Muse Code — Working with the agent (interactive)](https://dev.meta.ai/docs/muse-code/interactive) | docs | 2026-10-20 | minimax |
| 35 | [Muse Code — product page](https://dev.meta.ai/products/muse-code) | product page | 2026-10-20 | minimax, muse-spark |
| 36 | [Muse Spark Open — overview](https://dev.meta.ai/docs/muse-spark-open) | docs | 2026-10-20 | minimax, gpt-6 |
| 37 | [Run inference — Muse Spark Open](https://dev.meta.ai/docs/muse-spark-open/deploy) | docs | 2026-10-20 | minimax, gpt-6 |
| 38 | [Muse Glimmer — overview](https://dev.meta.ai/docs/muse-glimmer) | docs | 2026-10-20 | minimax, gpt-6 |
| 39 | [Run inference — Muse Glimmer](https://dev.meta.ai/docs/muse-glimmer/deploy) | docs | 2026-10-20 | minimax |
| 40 | [Open-weight models](https://dev.meta.ai/docs/open-weight-models) | docs | 2026-10-20 | minimax |
| 41 | [Model Designation and Geographic Use Policy](https://dev.meta.ai/legal/geographic-use-policy) | policy | 2026-10-20 | minimax |
| 42 | [Meet the winners of our first-ever LlamaCon Hackathon](https://ai.meta.com/blog/llamacon-hackathon/) | official recap | 2026-10-20 | minimax, gpt-6 |
| 43 | [Meta Global AI Developer Hackathon 2026: $1M Prizes, Rules, Dates — ReconScribe](https://reconscribe.com/meta-global-ai-developer-hackathon-2026/) | third-party analysis | 2026-10-20 | minimax |
| 44 | [Meta Opens Its $1M Hackathon — AImagazine](https://aimagazine.blog/meta-opens-its-1m-global-ai-developer-hackathon-20000-seats-150-api-credits-each-and-applications-close-october-25/) | press | 2026-10-20 | minimax |
| 45 | [Hackathons 2026: Online Contests Worldwide — ReconScribe](https://reconscribe.com/hackathons/) | third-party guide | 2026-10-20 | minimax |
| 46 | [Meta Connect 2026 recap — Developers blog](https://developers.meta.com/blog/meta-connect-recap/) | vendor blog | 2026-10-20 | minimax, muse-spark |
| 47 | [Meta Global AI Developer Hackathon: $1M Prizes, Eligibility, 12 Winning Ideas — GenAI Magazine](https://thegenaimagazine.com/meta-global-ai-developer-hackathon-ideas-prizes) | third-party analysis | 2026-10-20 | minimax |
| 48 | [Introducing Muse Spark 1.1 — AI at Meta](https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/) | vendor blog | 2026-10-20 | muse-spark |
| 49 | [Build with Muse Spark — Meta developer blog](https://dev.meta.ai/resources/blog/build-with-muse-spark) | vendor blog | 2026-10-20 | muse-spark, deepseek |
| 50 | [Build with Muse Image — Meta developer blog](https://dev.meta.ai/resources/blog/build-with-muse-Image) | vendor blog | 2026-10-20 | muse-spark |
| 51 | [SAM 3.1: Faster and More Accessible — AI at Meta](https://ai.meta.com/blog/segment-anything-model-3/) | vendor blog | 2026-10-20 | muse-spark, deepseek |
| 52 | [Introducing Muse Code and Muse Spark 1.2 — Research blog](https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2) | vendor blog | 2026-10-20 | muse-spark, deepseek |
| 53 | [Muse Code: New plans and features (Oct 2026)](https://dev.meta.ai/resources/blog/muse-code-new-plans-and-features) | vendor blog | 2026-10-20 | muse-spark |
| 54 | [Introducing Muse Image and Muse Video — AI at Meta](https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/) | vendor blog | 2026-10-20 | muse-spark, deepseek |
| 55 | [Noze.it — Muse Spark Open analysis](https://www.noze.it/en/insights/muse-spark-open-meta-open-weights/) | third-party analysis | 2026-10-20 | muse-spark |
| 56 | [Meta Model Library — Baseten](https://www.baseten.co/library/publisher/meta-ai/) | partner page | 2026-10-20 | muse-spark |
| 57 | [OrcaRouter — Muse API pricing deep dive](https://www.orcarouter.ai/blog/muse-api) | third-party analysis | 2026-10-20 | muse-spark |
| 58 | [Introducing Muse Spark 1.3 — Research blog](https://research.meta.ai/blog/introducing-muse-spark-1-3) | vendor blog | 2026-09-02 | gpt-6 |
| 59 | [Muse Spark 1.3 evaluation methodology (PDF)](https://research.meta.ai/static/muse-spark-1-3-multimodal-evaluation-methodology) | eval PDF | 2026-10-20 | gpt-6 |
| 60 | [Choosing an API — Meta Model API](https://dev.meta.ai/docs/protocols) | docs | 2026-10-20 | gpt-6 |
| 61 | [Structured-output cookbook](https://dev.meta.ai/docs/cookbook/structured-output) | docs / example | 2026-10-20 | gpt-6 |
| 62 | [Muse Code Python SDK README](https://github.com/meta-models/muse-code-sdk/blob/main/python/clients/sdk-py/README.md) | official repo | 2026-10-20 | gpt-6 |
| 63 | [Muse Spark Open on Baseten](https://www.baseten.co/library/muse-spark-open/) | partner docs | 2026-10-20 | gpt-6 |
| 64 | [Muse Spark Open on Modal — changelog](https://modal.com/changelog/muse-spark-open-now-available) | partner changelog | 2026-10-15 | gpt-6 |
| 65 | [Modal Endpoints](https://modal.com/docs/guide/endpoints) | partner docs | 2026-10-20 | gpt-6 |
| 66 | [Modal Shared Endpoints](https://modal.com/docs/guide/shared-endpoints) | partner docs | 2026-10-20 | gpt-6 |
| 67 | [Muse Spark Open on Fireworks](https://fireworks.ai/models/fireworks/muse-spark-open) | partner docs | 2026-10-14 | gpt-6 |
| 68 | [Fireworks serverless quickstart](https://docs.fireworks.ai/getting-started/quickstart) | partner docs | 2026-10-20 | gpt-6 |
| 69 | [Hugging Face — What is Muse Spark Open?](https://huggingface.co/blog/apiextensions/what-is-muse-spark-open) | partner docs | 2026-10-20 | muse-spark |
| 70 | [Muse Spark 1.3 — model page](https://dev.meta.ai/models/muse-spark) | model page | 2026-10-20 | gpt-6 |

> Note: one upstream formatting artifact — gpt-6's finding object uses `finding\_id` with an escaped underscore in the markdown source. The intended schema field is `finding_id`. Confirm literal field names from gpt-6 S-09/S-10 before wiring.
