# Synthesis — Stream 02: Harness → Output Quality (Independent Evaluation)

- **Stream:** 02 — Harness → Output Quality
- **Synthesized:** 2026-10-20
- **Contributors compared:** 5 independent runs:
  - `google-gemini-3.8-flash-2026-10-20` (10 sources)
  - `google-gemini-4-argon-2026-10-20` (46 sources / docx converted)
  - `muse-spark-2026-10-20` (28 sources)
  - `ollama-launch-deepseek-v4.1-flash-2026-10-20` (15 sources)
  - `ollama-launch-minimax-m3.1-flash-2026-10-20` (32 sources)

---

## 1. What the Contributors Agree On

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|---|---|:---:|:---:|
| **A-01** | **The Agent-Computer Interface (ACI) causes massive swings in benchmark success (far exceeding prompt tweaks).** Replacing raw bash with constrained, windowed ACI tools and line-level diffing delivers a 4x leap in benchmark resolution on the exact same model weights. | `gemini-3.8-flash 02` & `argon 02` (Princeton SWE-agent, NeurIPS 2024 / arXiv:2405.15793: GPT-4 jumps from <3% to 12.5% on SWE-bench purely via ACI design). | **Unanimous** | **Copy:** Never expose raw unconstrained shell; wrap tool outputs in structured, paged ACI commands. |
| **A-02** | **Mechanical verification gates (Read→Think→Write→Check) dominate ungrounded self-assessment.** Code generation must be gated by executable test/linter runs; models cannot reliably assess their own correctness without compiler feedback. | `minimax 02` (Agentless 32% resolution at $0.70) + `gemini-3.8-flash 02` (Reflexion: +24% HumanEval pass@1) + `deepseek 02`. | **Unanimous** | **Copy:** Implement `.fence/check` as an automated, mandatory post-write verification gate. |
| **A-03** | **Context is a scarce budget, not a free dumping ground ("Lost in the Middle").** Attention across long contexts forms a U-shaped curve; instructions buried in the middle 60% of prompts suffer severe retrieval degradation. | `gemini-3.8-flash 02` & `muse-spark 02` (Liu et al., TACL 2024 / arXiv:2307.03172) + `argon 02` (4KB output caps cut token waste by ~50%). | **Unanimous** | **Copy:** Keep `AGENTS.md` ≤ 150 lines, truncate shell stdout to 4KB, and inject rules dynamically via globs. |
| **A-04** | **Prompting alone cannot enforce instruction hierarchy under adversarial or edge conditions.** System instructions can be eroded by lower-tier inputs (untrusted web fetches, third-party code) unless enforced by client-side filters. | `gemini-3.8-flash 02` (Wallace et al., OpenAI arXiv:2404.13208) + `minimax 02` (ReadSecBench 84% injection rate). | **Strong** | **Copy:** Declare explicit hierarchy in `AGENTS.md` and back with deterministic pre-execution checks. |
| **A-05** | **Negative constraints ("Do Not X") trigger attention anchoring ("The Pink Elephant Effect").** Models violate negative prohibitions significantly more often than affirmative target states. | `gemini-3.8-flash 02` (empirical attention literature) + `muse-spark 02` + `argon 02`. | **Strong** | **Avoid:** Never write negative bans without immediate affirmative replacement patterns. |

---

## 2. Where They Disagree

### D-01 — Does `AGENTS.md` Actually Improve Coding Success, or Is It Placebo?

- **Reading A (`minimax 02`):** Cites the first controlled empirical benchmark of `AGENTS.md` (Gloaguen et al., ETH Zurich, arXiv:2602.11988, Feb 2026): on 138 real-world tasks, LLM-generated context files caused **−3% resolution rate** and **+20–23% inference cost**, while developer-written files yielded a marginal +4%. Furthermore, repo overviews failed to reduce steps before touching target files.
- **Reading B (`muse-spark 02` & `argon 02`):** Advocates the OpenAI Codex "give a map, not a manual" pattern, arguing that repository indexes are essential for multi-file navigation.
- **Independent Resolution:** The contradiction is explained by the **Ablation Finding in Gloaguen et al.**: when existing repo documentation (`docs/`, `README.md`) was stripped, context files *improved performance by +2.7% and beat human docs*. In well-documented enterprise Python repos, `AGENTS.md` is redundant noise; in **greenfield, undocumented vibe-coder repositories (the target user)**, an index is vital! However, the file must be **minimal, tool-focused, and strictly non-narrative**.
- **Why it matters for Phase 1:** `vibe-fence` must not auto-generate large essay-style repository overviews. It must generate a concise (≤400 tokens) operational routing manifest.

### D-02 — Combinatorial Scaffold Interference: All-In vs Minimalist Subsets

- **Reading A (`minimax 02`):** Cites full-factorial evaluations over all $2^5 = 32$ combinations of 5 scaffolding components (Planning, Tool Use, Memory, Structured Reasoning, Self-Reflection). In **every single condition tested**, the All-In five-component scaffold was beaten by a proper subset (e.g. Tool Use alone beat All-In by 32% on HotpotQA; Planning had a negative Shapley value). Stacking scaffolding greedily degrades performance.
- **Reading B (`muse-spark 02` & `argon 02`):** Recommends adding full planning gates, memory reflection buffers, and multi-step verification into a comprehensive harness architecture.
- **Independent Resolution:** `minimax 02` presents rigorous mathematical proof against "kitchen-sink" harness design. More scaffolding is not better. In Phase 1, `vibe-fence` must **isolate tool execution and verification** (which capture 70% of total scaffold value) and treat extensive planning and cross-session reflection as conditional, opt-in tools rather than mandatory nested loops.
- **Why it matters for Phase 1:** Protects `vibe-fence` from architecting an over-engineered, slow multi-agent runtime.

### D-03 — Architect-Editor Decoupling: Always Separate or Dynamic Escalation?

- **Reading A (`gemini-3.8-flash 02` & `argon 02`):** Separating the high-reasoning "Architect" from the fast "Editor" (Aider `--architect` pattern) consistently outperforms single-pass execution by eliminating premature file modifications.
- **Reading B (`minimax 02` & `deepseek 02`):** Forced planning before trivial edits introduces unnecessary latency and step costs, often irritating non-technical users on minor 1-line CSS fixes.
- **Independent Resolution:** Implement **Task-Gated Architecture Separation**: minor edits (< 2 files touched, styling) run directly through the fast execution loop; tasks tagged as architectural or multi-file automatically trigger the `.fence/plans/` gate.
- **Why it matters for Phase 1:** Defines the execution routing logic in `src/framework/executor.ts`.

---

## 3. Unique Contributions

| Contributor | Unique Finding / Breakthrough | Evidence | Adopt in Phase 1? |
|---|---|---|:---:|
| **`ollama-launch-minimax-m3.1-flash`** | **Factorial Scaffolding Ablation & CCI Proof:** Proved that greedy stacking of scaffolding components suffers from submodularity violations and sign-flipping; Tool Use captures 70% of value. | Factorial 32-subset eval (HotpotQA / GSM8K) | **Yes:** Keep harness primitives unbundled, lean, and independently A/B tested. |
| **`google-gemini-4-argon`** | **Stratified 4-Level Engineering Topology:** Mapped prompt engineering (Turn) → context engineering (Session) → harness engineering (System loop) → intent engineering (Ecosystem). | Framework Synthesis 2026 | **Yes:** Adopt as mental model in `docs/clief/ARCHITECTURE.md`. |
| **`google-gemini-3.8-flash`** | **Anti-Sycophancy Invariants & Objective Grounding:** Showed how RLHF alignment trains models to agree with non-technical users' dangerous ideas, requiring a protective tech-lead persona. | Anthropic & DeepMind Sycophancy evals | **Yes:** Inject explicit non-sycophantic tech-lead instructions into `AGENTS.md`. |
| **`muse-spark`** | **Doc Gardening Receipts:** Defined verifiable metadata tags (`docs-updated`, `no-docs-needed`, `blocked`) to enforce documentation hygiene across PRs without model hallucination. | Engineering Best Practices | **Yes:** Adopt in `tools/validate.ts`. |
| **`ollama-launch-deepseek-v4.1-flash`** | **Agentless vs Agentic Benchmark Comparison:** Showed that minimalist verification-centric approaches (Agentless 32% at $0.70) beat complex autonomous loops on cost/pass-rate Pareto frontiers. | SWE-bench leaderboard analysis | **Yes:** Prioritize deterministic verification over complex autonomous agent swarms. |

---

## 4. Gaps in the Collective Research

1. **Context Decay Under Mixed Multimodal Prompts:** No contributor evaluated the attention degradation curve when text instructions are mixed with image mockups or screenshots in the same context window.
2. **Dynamic Context Eviction in Long Multi-Day Sessions:** When a vibe-coder works on a project over 5 days, how should stale context be purged from `.fence/state.json` without causing cross-session amnesia?
3. **Cross-Model Prompt Portability:** How do ACI command formatting gains measured on GPT-4/Claude 3.5 transfer to smaller open-weights models (e.g. 8B–14B models on local devices)?

---

## 5. The Consolidated Answer

Harness design governs model output quality through causal levers that dwarf marginal prompt wording changes. However, empirical research from 2024–2026 demonstrates that **more scaffolding is not inherently better**: greedy stacking of planning, memory, and reflection layers leads to Combinatorial Scaffold Interference (CCI), where complex scaffolds perform worse than simple tool execution. Furthermore, `AGENTS.md` files only provide marginal gains when kept minimal, and actively degrade performance when bloated with narrative overviews. For `vibe-fence`, the winning causal blueprint consists of: (1) a minimal, token-budgeted operational router (≤400 tokens); (2) structured ACI tools that cap command outputs at 4KB; (3) an objective, non-sycophantic senior-developer persona; and (4) a mechanical **Read→Think→Write→Check** loop that gates task completion on executable verification rather than LLM self-assessment.

---

## 6. Actions for Phase 1

### Copy (Proven Patterns to Adopt)
1. **SWE-agent ACI Command Truncation:** Cap all shell stdout/stderr paged into the agent context at 4,000 bytes, pruning compiler flags and ANSI escape codes. (`gemini-3.8-flash`, `argon`)
2. **Reflexion Execution Verification (`.fence/check`):** Run linter and tests immediately after edits; silently feed failure traces back into context for a single automated repair attempt. (`gemini-3.8-flash`, `deepseek`)
3. **Task-Specific Dynamic Routing:** Keep the root router small; load specific guidelines only when matching files or tasks are active. (`argon`, `minimax`)

### Avoid (Anti-Patterns to Reject)
1. **The Kitchen-Sink Scaffold Stack:** Never activate all five scaffolding layers (deep planning, multi-agent debate, cross-session memory, reflection, tool use) on routine tasks. Tool use + verification captures 70% of all measured gain. (`minimax`)
2. **LLM-Generated Narrative Overviews:** Never auto-generate a 300-line narrative description of the codebase into `AGENTS.md`. It increases token costs by 23% and makes tasks harder for the model. (`minimax`, `argon`)
3. **Self-Assessment Gates:** Never ask the model "Did you complete the task correctly?" without feeding it an executable exit code. (`gemini-3.8-flash`, `deepseek`)

### Invent (Novel Primitives to Build)
1. **The Context Budget Linter (`tools/validate.ts`):** A strict pre-commit test asserting that `AGENTS.md` does not exceed 400 tokens and individual rule files do not exceed 200 lines. (`argon`, `minimax`)
2. **The Senior-Partner Anti-Sycophancy Directive:** Injected prompt invariant instructing the model: *"You are an experienced, protective tech-lead companion. Do not validate bad technical practices to be polite. Push back with safe alternatives whenever an approach introduces security, data loss, or build risks."* (`gemini-3.8-flash`)
3. **The 2-Attempt Circuit Breaker (`src/framework/circuit-breaker.ts`):** Automatically freezes agent writes after 2 consecutive test/lint failures, preventing runaway token burnout and apology loops. (`gemini-3.8-flash`, `muse-spark`)

---

## 7. Open Questions

- [ ] **Empirical Replication on Greenfield Vibe Repos:** Replicate the Gloaguen et al. AGENTbench protocol specifically on starter Next.js/Tailwind repos to measure exact token/accuracy trade-offs for non-technical users.
- [ ] **Optimal Truncation Window:** Is 4,000 bytes universally optimal, or should TypeScript errors be paged differently from Python tracebacks?

---

## 8. Deduplicated Sources Table

| # | Source URL / Paper ID | Type | Primary Contributor |
|---|---|---|---|
| 1 | [arXiv:2405.15793](https://arxiv.org/abs/2405.15793) — Yang et al., *SWE-agent: Agent-Computer Interfaces* (NeurIPS 2024) | Academic Paper | `gemini-3.8-flash`, `argon`, `deepseek` |
| 2 | [arXiv:2602.11988](https://arxiv.org/html/2602.11988v1) — Gloaguen et al., *Evaluating AGENTS.md* (ETH Zurich 2026) | Academic Paper | `minimax`, `argon` |
| 3 | [arXiv:2307.03172](https://arxiv.org/abs/2307.03172) — Liu et al., *Lost in the Middle* (TACL 2024) | Academic Paper | `gemini-3.8-flash`, `muse-spark` |
| 4 | [arXiv:2303.11366](https://arxiv.org/abs/2303.11366) — Shinn et al., *Reflexion: Language Agents* (NeurIPS 2023) | Academic Paper | `gemini-3.8-flash`, `deepseek` |
| 5 | [arXiv:2404.13208](https://arxiv.org/abs/2404.13208) — Wallace et al., *The Instruction Hierarchy* (OpenAI 2024) | Academic Paper | `gemini-3.8-flash`, `argon` |
| 6 | [https://anthropic.com/research/building-effective-agents](https://anthropic.com) — Anthropic Engineering, *Building Effective Agents* | Research Blog | `gemini-3.8-flash`, `muse-spark` |
| 7 | [https://openai.com/index/harness-engineering/](https://openai.com) — OpenAI Codex, *Harness Engineering* | Technical Blog | `minimax`, `argon` |
| 8 | [arXiv:2407.01489](https://arxiv.org/abs/2407.01489) — Xia et al., *Agentless: Demystifying LLM-based Software Engineering* | Academic Paper | `deepseek`, `argon` |
