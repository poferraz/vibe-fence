# Synthesis — Stream 06: Meta Models & Hackathon Integration (Independent Evaluation)

- **Stream:** 06 — Meta Models (Hackathon Integration)
- **Synthesized:** 2026-10-20
- **Contributors compared:** 5 independent runs:
  - `google-gemini-3.8-flash-2026-10-20` (7 sources)
  - `ollama-launch-minimax-m3.1-flash-2026-10-20` (43 sources)
  - `openai-gpt-6-2026-10-20` (25 sources)
  - `ollama-launch-deepseek-v4.1-flash-2026-10-20` (8 sources)
  - `muse-spark-2026-10-20` (25 sources)

---

## 1. What the Contributors Agree On

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|---|---|:---:|:---:|
| **A-01** | **Muse Spark 1.3 is the primary companion workhorse for everyday teaching, planning, and triage.** 1M context window, native tool use, and 3,000 RPM / 4M TPM on the Meta Model API make it ideal for low-latency loop execution. | `minimax 06` + `muse-spark 06` + `gemini-3.8-flash 06` (all cite 1M context & Meta Model API). | **Unanimous** | **Adopt:** Use `muse-spark-1.3` as the default companion model. |
| **A-02** | **Muse Code is an extension target for vibe-fence, not a competitor.** Muse Code natively reads `AGENTS.md`, `CLAUDE.md`, `.agents/skills/`, and project hooks. `vibe-fence` serves as its companion and safety harness. | `minimax 06` (documented first-class extension surface) + `gemini-3.8-flash 06` (complementary harness framing) + `deepseek 06`. | **Unanimous** | **Adopt:** Implement reference adapter targeting Muse Code alongside Cursor and Claude Code. |
| **A-03** | **Muse Image provides immediate multi-modal demo polish at negligible cost ($0.01/image).** Auto-generating missing landing page assets and app icons directly into `public/images/` solves a real vibe-coder pain point. | `gemini-3.8-flash 06` (vibe-asset skill) + `minimax 06` (150 RPM rate limit) + `deepseek 06`. | **Unanimous** | **Adopt:** Wire `vibe-asset` to generate brand graphics during project scaffolding. |
| **A-04** | **The winning hackathon pattern is an empirical Before/After live demo, not theoretical slides.** Comparing the same non-technical user prompt with vs without the fence exposes the dramatic safety gap. | `gemini-3.8-flash 06` + `minimax 06` (3-minute demo script) + `muse-spark 06` (Cerebral Valley judging rubric: Impact 30%, Tooling 25%, Demo 25%, Depth 20%). | **Unanimous** | **Adopt:** Anchor submission on a side-by-side video demo. |

---

## 2. Where They Disagree

### D-01 — SAM 3.1: Viable Mockup Parser or Dangerous Technical Hallucination?

- **Reading A (`gemini-3.8-flash 06`):** Proposes using SAM 3.1 as a "Mockup-to-Layout Bridge", segmenting user screenshots into `navbar`, `sidebar`, and `cards` in a single pass to structure frontend components.
- **Reading B (`minimax 06` & `deepseek 06`):** **Directly refutes Reading A using live API documentation.** SAM 3.1 accepts **one single concept per request** (e.g. `"button"`) and returns coordinate masks—it does *not* accept multi-concept strings (passing `"navbar, sidebar"` returns 0 matches) and does *not* return semantic component names. A single-call semantic UI parser using SAM 3.1 is impossible under the current API.
- **Independent Resolution:** `minimax 06` is empirically correct. We must **not** claim SAM 3.1 does multi-component semantic layout parsing.
  - *Viable Minimal Fit:* Use SAM 3.1 strictly for **interactive click-to-teach UI inspection** or **visual regression masking** (e.g., segmenting a user-clicked UI element to generate an isolated visual diff).
  - *Keep out of critical path:* Do not make SAM 3.1 a blocking dependency for generating code.
- **Why it matters for Phase 1:** Protects the team from building a broken feature that fails live during hackathon judging.

### D-02 — Model Tier Routing: Muse Spark 1.3 vs Muse Wonder 1.0

- **Reading A (`gemini-3.8-flash 06` & `muse-spark 06`):** Assumed Muse Spark 1.3 is the sole frontier model from Meta.
- **Reading B (`minimax 06`):** Identified **Muse Wonder 1.0** (`muse-wonder-1.0`), Meta’s true top-end reasoning and coding flagship ($4 input / $20 output per 1M). Spark is the fast workhorse; Wonder is the architectural heavyweight. Both share identical endpoints and request schemas.
- **Independent Resolution:** Implement **Dual-Tier Model Routing on the Meta Model API**:
  - `muse-spark-1.3`: The high-volume companion engine (teaching dial, issue queue, git commit summaries, everyday lint fixes).
  - `muse-wonder-1.0`: The escalation tier (initial project planning in `vibe-plan` and complex multi-file architectural refactoring).
- **Why it matters for Phase 1:** Provides instant capability upgrades on complex tasks with a simple model-ID switch on the same API key.

### D-03 — Contributor Mode vs Standard Pricing: The Privacy Contradiction

- **Reading A (`muse-spark 06`):** Highlights Contributor Mode as an incredible 12.5x discount ($0.10 input / $0.20 output per 1M).
- **Reading B (`minimax 06`):** Warns that Contributor Mode grants Meta the right to train on all uploaded code, files, and prompts. For `vibe-fence`—whose entire brand promise is "making vibe-coding safe"—shipping user code to a training dataset contradicts the product's core security thesis.
- **Independent Resolution:** Default to **Standard Mode** ($1.25 / $4.25 per 1M), which guarantees privacy. Support Contributor Mode strictly as an explicit, opt-in cost-saving toggle (`--contributor-mode`) with clear disclosure.
- **Why it matters for Phase 1:** Preserves alignment between product ethics and marketing messaging.

---

## 3. Unique Contributions

| Contributor | Unique Finding / Breakthrough | Evidence | Adopt in Phase 1? |
|---|---|---|:---:|
| **`ollama-launch-minimax-m3.1-flash`** | **Muse Wonder Discovery & SAM 3.1 Single-Concept Limit:** Identified the 6-model lineup (`muse-wonder-1.0`) and corrected sibling errors regarding SAM 3.1 API input constraints. | Live `dev.meta.ai` Docs 2026 | **Yes:** Fundamental correction adopted in architecture. |
| **`ollama-launch-minimax-m3.1-flash`** | **Stateless Encrypted Reasoning Replay (`POST /v1/responses`):** Documented that Meta's recommended multi-turn mode stores *nothing* server-side, replaying encrypted chain-of-thought tokens. | Meta Responses API Spec | **Yes:** Adopt for private session handling. |
| **`google-gemini-3.8-flash`** | **Multi-Modal Companion Storyline:** Framed the hackathon narrative around Muse Spark (companion voice) + Muse Image (visual polish) + Muse Code (runtime harness). | Hackathon Strategy | **Yes:** Core narrative structure for the Indie Track. |
| **`ollama-launch-deepseek-v4.1-flash`** | **Click-to-Teach UI Inspection:** Formulated a realistic visual workflow where a user clicks a broken UI element in the browser, triggering an automated targeted fix. | HCI Workflow Design | **Yes:** Incorporate into demo script. |

---

## 4. Gaps in the Collective Research

1. **Meta Model API Concurrency Limits During Hackathon Peak:** During previous hackathons, API endpoints experienced heavy traffic spikes. We need local fallback tests (e.g. Ollama or Fireworks) ready if the primary Meta API suffers temporary degraded performance.
2. **Real Latency of Muse Wonder on 500k-Token Repositories:** While the 1M token window is documented, real-world time-to-first-token (TTFT) on large codebases was not benchmarked by any contributor.
3. **Muse Code Public Binary Distribution:** Exact installer flags and offline compatibility for `muse-code` remain unverified outside of Meta's documentation portal.

---

## 5. The Consolidated Answer

Meta's model ecosystem provides an extraordinary, native foundation for `vibe-fence` at the Meta Global AI Developer Hackathon. By utilizing **Muse Spark 1.3** as the everyday companion voice and **Muse Wonder 1.0** as the architectural planning tier on the unified Meta Model API, `vibe-fence` captures state-of-the-art reasoning with 1M token context windows at zero long-context cost penalty. Furthermore, incorporating **Muse Image** provides instant, visually striking multi-modal utility (auto-generating UI graphics for vibe-coders), while **Muse Code** serves as the primary supported coding agent. Crucially, research dispels myths regarding SAM 3.1: it is not a semantic multi-component layout parser, and must be restricted to targeted visual element inspection. The hackathon-winning strategy centers on a **3-minute side-by-side live demonstration** proving how `vibe-fence` transforms an unfenced, vulnerable agent into a safe, production-ready engineering companion.

---

## 6. Actions for Phase 1

### Copy (Proven Patterns to Adopt)
1. **The Dual-Model Meta Router:** Configure `src/framework/meta-client.ts` to route everyday linter/teaching tasks to `muse-spark-1.3` and complex planning gates to `muse-wonder-1.0`. (`minimax`)
2. **Stateless Reasoning Replay (`POST /v1/responses`):** Resend conversation history using encrypted reasoning items so no project code is retained server-side by default. (`minimax`)
3. **Muse Image Web Asset Generator (`vibe-asset`):** Automatically generate PNG/SVG icons and hero banners into `public/images/` when scaffolding new applications. (`gemini-3.8-flash`, `deepseek`)

### Avoid (Anti-Patterns to Reject)
1. **The SAM 3.1 Multi-Concept Hallucination:** Never attempt to pass comma-separated UI components to SAM 3.1; query single concepts or use point coordinates. (`minimax`)
2. **Passing `reasoning_effort: "none"`:** The Meta Model API returns HTTP 400 if `none` is passed; implement the `silent` dial mode by bypassing the LLM call entirely. (`minimax`)
3. **Defaulting to Contributor Mode Training:** Do not expose user code to model training without explicit, opt-in consent. (`minimax`)

### Invent (Novel Primitives to Build)
1. **The Native Muse Code Adapter (`src/adapters/muse-code.ts`):** Drop-in configuration injecting `.agents/AGENTS.md` and lifecycle hooks into Meta's official coding CLI. (`minimax`, `gemini-3.8-flash`)
2. **The 3-Minute Hackathon Demo Script:** A locked, reproducible sequence:
   - *Minute 1:* Unfenced agent leaks `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` and crashes build.
   - *Minute 2:* `npx vibe-fence init` runs live in 3 seconds; blocks the secret leak, takes an automated checkpoint.
   - *Minute 3:* Muse Spark explains the fix on the Teaching Dial; Muse Image generates a logo; app deploys cleanly to Vercel. (`gemini-3.8-flash`, `minimax`)

---

## 7. Open Questions

- [ ] **Modal / Baseten Credit Setup:** Validate whether the hackathon provides serverless GPU credits for running Muse Spark Open locally as an alternative to the cloud API.
- [ ] **Offline Demo Caching:** Record pre-cached responses for the live demo video to safeguard against network latency during final judging.

---

## 8. Deduplicated Sources Table

| # | Source URL | Type | Primary Contributor |
|---|---|---|---|
| 1 | [https://dev.meta.ai/docs/models](https://dev.meta.ai) — Meta Model API Catalog & Specifications | Official Docs | `minimax` |
| 2 | [https://dev.meta.ai/docs/protocols/responses](https://dev.meta.ai) — Meta Responses API & Reasoning Protocol | Official Docs | `minimax` |
| 3 | [https://dev.meta.ai/docs/pricing-rate-limits](https://dev.meta.ai) — Meta Model Pricing & Rate Limits | Official Docs | `minimax` |
| 4 | [https://cerebralvalley.ai/e/meta-ai-developer-hackathon](https://cerebralvalley.ai) — Official Hackathon Guidelines | Event Page | `gemini-3.8-flash`, `muse-spark` |
| 5 | [https://ai.meta.com/research/publications/segment-anything/](https://ai.meta.com) — Segment Anything Research Portal | Research Publication | `gemini-3.8-flash`, `deepseek` |
| 6 | [https://dev.meta.ai/docs/overview](https://dev.meta.ai) — Meta Superintelligence Labs Developer Guide | Official Docs | `minimax`, `gpt-6` |
