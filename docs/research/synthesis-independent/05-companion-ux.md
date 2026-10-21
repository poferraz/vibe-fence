# Synthesis — Stream 05: Companion UX (Independent Evaluation)

- **Stream:** 05 — Companion UX (Teaching Dial & Turbo)
- **Synthesized:** 2026-10-20
- **Contributors compared:** 4 independent runs:
  - `google-gemini-3.8-flash-2026-10-20` (10 sources)
  - `ollama-launch-deepseek-v4.1-flash-2026-10-20` (30 sources)
  - `ollama-launch-minimax-m3.1-flash-2026-10-20` (35 sources)
  - `muse-spark-2026-10-20` (25 sources)

---

## 1. What the Contributors Agree On

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|---|---|:---:|:---:|
| **A-01** | **Permission prompts are not safety boundaries — they induce rapid habituation.** Users approve ~93% of permission prompts blindly, missing 1 in 3 out-of-scope or malicious commands (33–35% error rate). | `deepseek 05` (Anthropic telemetry + 409k decision dataset) + `gemini-3.8-flash 05` (Anderson et al., CHI 2016). | **Unanimous** | **Invent:** Rebuild Turbo around **containment + reversibility + atomic checkpoints**, not repetitive permission prompts. |
| **A-02** | **Static verbosity is an anti-pattern (The Expertise Reversal Effect).** Novices need worked examples to absorb cognitive load, but as competence develops, redundant explanations become a mental impediment. | `gemini-3.8-flash 05` & `deepseek 05` (Kalyuga et al., 2003 / Sweller CLT) + `minimax 05`. | **Unanimous** | **Copy:** Implement the 4-tier teaching dial (`max → med → min → silent`). |
| **A-03** | **Unrestricted answer-giving induces cognitive atrophy and learned helplessness.** Providing instant solutions without requiring user cognitive engagement degrades long-term capability. | `deepseek 05` (Bastani et al., PNAS 2025: Base AI students scored 17% *worse* post-removal; hint-first tutor removed harm) + `gemini-3.8-flash 05`. | **Strong** | **Copy:** At `max` dial, adopt a **hint-first / symptom-first** framing before spewing the code fix. |
| **A-04** | **Issue queues must be batched and agent-resolved, never dumped on the user.** Presenting an unprioritized backlog of 20 technical warnings causes alarm flooding and user paralysis. | `deepseek 05` (Batching notifications lowers stress; GitHub Autofix 3x–12x faster) + `gemini-3.8-flash 05` (`.fence/queue.json`). | **Unanimous** | **Copy:** Findings stored in `.fence/queue.json` as structured `issue → solution → plan` items that the agent resolves autonomously. |
| **A-05** | **The first 5 minutes must establish immediate safety and eliminate terminal anxiety.** Drop-off rates exceed 60% when non-technical users are greeted by blank terminal screens or raw stack traces. | `gemini-3.8-flash 05` & `muse-spark 05` (Lovable/Bolt/Replit onboarding teardown: zero-friction `npx init` in < 3s). | **Unanimous** | **Copy:** Implement the 5-minute onboarding protocol with an immediate safety receipt and 3-bullet plan gate. |

---

## 2. Where They Disagree

### D-01 — The Teaching Dial: Single Global Scalar vs Per-Domain Vector

- **Reading A (`deepseek 05`):** The dial must be a **vector**, not a single global number. Expertise reversal is domain-specific: a visual designer may be an expert in CSS (`ui: silent`) but a total novice in PostgreSQL (`data: max`). Forcing a global `max` lectures them on flexbox, while a global `silent` exposes them to SQL injection. State should be tracked per domain in `.fence/state/dial.json`.
- **Reading B (`minimax 05` & `gemini-3.8-flash 05`):** A vector with 7 knobs overwhelms non-technical users. Beginners need a single, dead-simple slider or toggle (`max`, `med`, `min`, `silent`).
- **Independent Resolution:** Both are right at different layers:
  - **User-Facing UI:** Expose a **single global knob** (`teaching_dial: "medium"`).
  - **Internal Engine Architecture:** Store the dial state as a **per-domain vector** in `.fence/state/dial.json` (`{ui: "min", auth: "max", data: "max", deploy: "med"}`). If the user turns the global knob, all domains shift in lockstep; but as the user demonstrates competence in a specific domain, the engine silently fades that domain independently.
- **Why it matters for Phase 1:** Directly informs the state schema in `src/framework/dial.ts`.

### D-02 — Teaching Content Placement: In-Context vs On-Disk

- **Reading A (`minimax 05`):** Inlining detailed educational prose into the active chat context window pollutes the prompt and causes "Lost in the Middle" attention degradation on the code. Proposes writing educational deep-dives to disk (`.fence/learn/<concept>.md`) and keeping only a 1-line pointer in chat context.
- **Reading B (`gemini-3.8-flash 05` & `muse-spark 05`):** Non-technical users do not open markdown files in their code editor; if teaching is relegated to hidden disk files, it will never be read.
- **Independent Resolution:** Implement **Progressive Disclosure Cards**:
  - The chat interface displays a concise 2-sentence summary with an expandable callout: `[💡 Why this matters (Click to expand)]`.
  - The expanded text is rendered on the client UI without bloating the model's upstream context window.
  - Deep-dive reference guides are saved to `.fence/learn/` for persistent review.
- **Why it matters for Phase 1:** Protects the active context budget while preserving accessible learning.

### D-03 — Turbo Approval Gating: Heuristic Classifier vs Deterministic Hard Tripwires

- **Reading A (`minimax 05`):** Recommends an AI classifier that dynamically assesses the "risk band" of every proposed command.
- **Reading B (`gemini-3.8-flash 05` & `deepseek 05`):** Heuristic AI risk classifiers suffer from false positives and edge-case hallucination. The boundary must be **deterministic**: a hard-coded tripwire list (database drops, remote pushes, paid API keys, 2 consecutive test failures) that pauses execution regardless of prompt framing.
- **Independent Resolution:** **Deterministic Hard Tripwires are mandatory for Phase 1.** Heuristic classifiers can be evaluated later as an advisory layer, but safety must not depend on an LLM deciding whether its own command is dangerous.
- **Why it matters for Phase 1:** Hard-codes the tripwire interceptor in `src/framework/turbo.ts`.

---

## 3. Unique Contributions

| Contributor | Unique Finding / Breakthrough | Evidence | Adopt in Phase 1? |
|---|---|---|:---:|
| **`ollama-launch-deepseek-v4.1-flash`** | **The PNAS 2025 AI-Tutor Field Study:** Proved that direct answer-giving caused students to score 17% *worse* than controls once AI was removed; hint-first tutoring preserved skill (+127% practice gain). | Bastani et al. (PNAS 2025) | **Yes:** Structure `max` teaching as symptom/hint-first rather than immediate answer dumps. |
| **`ollama-launch-deepseek-v4.1-flash`** | **Permission Prompt Failure Rate:** Quantified that users miss 33–35% of malicious commands due to habituation, proving that permission dialogs are not a safety net. | 409k decision dataset study | **Yes:** Core justification for the Teachable Turbo Contract. |
| **`google-gemini-3.8-flash`** | **Cognitive Scaffolding & Expertise Reversal Synthesis:** Grounded the 4-tier dial in Sweller's Cognitive Load Theory, proving why static verbosity causes cognitive overload for experienced builders. | Sweller 1988; Kalyuga 2003 | **Yes:** Theoretical anchor for companion pacing. |
| **`ollama-launch-minimax-m3.1-flash`** | **The 4-Part Structured Card Format:** Standardized companion cards into: `What changed · Why · Your call · How we'll know`. | UX Teardown | **Yes:** Adopt as standard output schema for companion responses. |
| **`muse-spark`** | **Interactive 5-Minute Onboarding Flow:** Mapped the beginner funnel from `npx init` receipt to first visual feature win. | Product Teardowns | **Yes:** Implement in `vibe-init`. |

---

## 4. Gaps in the Collective Research

1. **Voice / Audio Companion Dynamics:** Non-technical creators increasingly use voice interfaces (e.g. ChatGPT Advanced Voice, Replit mobile). How should the teaching dial modulate its pacing over speech channels?
2. **Quantified Attention Bounds for Non-Technical Users:** Exactly how many seconds will a non-technical user wait for a background verification check before clicking away or refreshing? (Estimated: < 10 seconds).
3. **Automated Competence Invalidation:** If a user hasn't touched a codebase in 6 months, should the teaching dial automatically step back up to `med` or `max`?

---

## 5. The Consolidated Answer

An AI coding companion cannot treat teaching, velocity, and safety as a single slider. They are three distinct ergonomic problems: (1) **Teaching is an instructional fading problem**—grounded in the *Expertise Reversal Effect* and PNAS 2025 tutor research, the teaching dial must step down from hint-first guidance (`max`) to status badges (`min`) as schemas form in long-term memory; (2) **Turbo is a containment and reversibility problem**—because humans approve ~93% of permission prompts blindly, security cannot rely on confirmation dialogs; routine actions must auto-approve alongside automated git checkpoints, reserving hard pauses strictly for irreversible tripwires; and (3) **The Issue Queue is a batching problem**—converting chaotic compiler errors into structured, agent-resolved tasks (`.fence/queue.json`) that are remediated in rhythm without panic.

---

## 6. Actions for Phase 1

### Copy (Proven Patterns to Adopt)
1. **The 4-Tier Teaching Dial (`.fence/config.json`):** `max` (symptom/hint + educational card), `med` (1-sentence summary, default), `min` (status badge), `silent` (pure execution). (`gemini-3.8-flash`, `deepseek`)
2. **The 4-Part Companion Card:** Output format: `What changed · Why · Your call · How we'll know`. (`minimax`)
3. **Instant Zero-Friction Init (`vibe-init`):** Single-command setup that inspects repo, initializes git, locks `.gitignore`, and returns a safety receipt in < 3 seconds. (`gemini-3.8-flash`, `muse-spark`)

### Avoid (Anti-Patterns to Reject)
1. **Confirmation Dialog Flooding:** Never prompt the user 15 times per session to approve file edits or test runs. It triggers warning habituation and blind clicking. (`deepseek`, `gemini-3.8-flash`)
2. **Direct Answer Dumping at `max`:** Never spew code fixes without highlighting the underlying symptom first; unguided answers cause learned helplessness and post-removal skill degradation. (`deepseek`)
3. **The "Clippy Trap" (Mid-Task Interruption):** Never interrupt a user mid-flow to offer unsolicited architectural advice. Save non-critical optimizations for the queue. (`gemini-3.8-flash`)

### Invent (Novel Primitives to Build)
1. **The Teachable Turbo Contract (`src/framework/turbo.ts`):** 
   - *Auto-Approved:* Local file edits, test runs, linting, package additions, and atomic git checkpoints.
   - *Hard Tripwires (Must Pause):* Dropping DB tables/columns, pushing to production `main`, billable API key integration, and 2 consecutive test failures. (`gemini-3.8-flash`, `deepseek`)
2. **The Vector State Dial (`.fence/state/dial.json`):** Tracks competence per domain (`ui`, `data`, `auth`, `deploy`) beneath a unified single-slider UI. (`deepseek`)
3. **The Agent-Owned Issue Queue (`.fence/queue.json`):** Structured backlog where findings are triaged and resolved by the agent itself, presenting reassuring companion updates rather than raw ticket lists. (`gemini-3.8-flash`, `minimax`)

---

## 7. Open Questions

- [ ] **Automated Dial Step-Down Heuristics:** Can `vibe-fence` safely fade a domain's teaching dial after 3 consecutive successful tasks without explicit user reconfiguration?
- [ ] **Visual Diff Translation:** Can the harness translate git diffs into human-readable visual summaries (e.g. "Added a blue submit button below the email input") instead of green/red unified diff syntax?

---

## 8. Deduplicated Sources Table

| # | Source URL / Paper ID | Type | Primary Contributor |
|---|---|---|---|
| 1 | [PNAS:10.1073/pnas.2422633122](https://www.pnas.org/doi/10.1073/pnas.2422633122) — Bastani et al., *Generative AI without guardrails can harm learning* (PNAS 2025) | Academic Paper | `deepseek` |
| 2 | Kalyuga et al. (2003) — *The Expertise Reversal Effect*. Educational Psychologist. | Academic Literature | `gemini-3.8-flash`, `deepseek` |
| 3 | Sweller, J. (1988) — *Cognitive load during problem solving*. Cognitive Science. | Academic Literature | `gemini-3.8-flash` |
| 4 | [ACM CHI 2016](https://doi.org/10.1145/2858036.2858348) — Anderson et al., *How to Prevent Warning Fatigue: A Longitudinal Study* | HCI Paper | `gemini-3.8-flash` |
| 5 | [https://nngroup.com/articles/progressive-disclosure/](https://nngroup.com) — Nielsen Norman Group, *Progressive Disclosure* | UX Guidelines | `deepseek`, `gemini-3.8-flash` |
| 6 | [https://lovable.dev](https://lovable.dev) — Lovable Onboarding & Spec UX Teardown | Product Review | `gemini-3.8-flash`, `muse-spark` |
| 7 | [https://bolt.new](https://bolt.new) — StackBlitz WebContainers & Bolt UX | Product Review | `gemini-3.8-flash` |
| 8 | [https://replit.com/agent](https://replit.com) — Replit Agent Product & Workflow Docs | Official Docs | `gemini-3.8-flash` |
