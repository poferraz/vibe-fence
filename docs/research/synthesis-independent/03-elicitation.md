# Synthesis — Stream 03: Elicitation & Synthesis Patterns (Independent Evaluation)

- **Stream:** 03 — Elicitation & Synthesis Patterns
- **Synthesized:** 2026-10-20
- **Contributors compared:** 5 independent runs:
  - `google-gemini-3.8-flash-2026-10-20` (10 sources)
  - `google-gemini-4-argon-2026-10-20` (28 sources / docx converted)
  - `muse-spark-2026-10-20` (13 sources)
  - `ollama-launch-deepseek-v4.1-flash-2026-10-20` (12 sources)
  - `ollama-launch-minimax-m3.1-flash-2026-10-20` (28 sources)

---

## 1. What the Contributors Agree On

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|---|---|:---:|:---:|
| **A-01** | **Intrinsic self-correction without external ground-truth feedback actively degrades reasoning accuracy.** Asking an LLM "Are you sure? Critique and refine your output" induces wavering, flips correct solutions to incorrect ones, and multiplies inference cost 3x–5x. | `argon 03` & `gemini-3.8-flash 03` (Huang et al., Google DeepMind / ICLR 2024 / arXiv:2310.01798: GPT-4 GSM8K accuracy drops 95.5% → 91.5% → 89.0%; GPT-3.5 CommonSenseQA drops 75.8% → 38.1%). | **Unanimous** | **Avoid:** Forbid ungrounded self-critique loops in prompts. |
| **A-02** | **In software engineering, verification beats consensus ("Spend compute on execution, not opinion").** Repeated sampling yields massive gains *only* when paired with deterministic execution filters (compiler, linters, unit tests). | `deepseek 03` (Brown et al., *Large Language Monkeys*, arXiv:2407.21787: SWE-bench Lite jumps from 15.9% to 56% with execution filters, but plateaus without them) + `gemini-3.8-flash 03` (CodeT: +18.8%). | **Unanimous** | **Copy:** Default to 1-sample; escalate to sampling only when filtered by an automated test/build verifier. |
| **A-03** | **Environmental feedback loops (Reflexion) provide the highest ROI in agent engineering.** Feeding execution tracebacks into a structured diagnostic step before retry reliably eliminates bugs without human intervention. | `gemini-3.8-flash 03` & `argon 03` (Shinn et al., NeurIPS 2023 / arXiv:2303.11366: HumanEval pass@1 jumps from 67% to 91%). | **Unanimous** | **Copy:** Implement the silent Reflexion circuit in `.fence/check`. |
| **A-04** | **Naive Self-Consistency (string majority voting) fails on source code.** Syntactic variations (identifier names, whitespace, comment placement) destroy string equality even across functionally identical programs. | `gemini-3.8-flash 03` & `deepseek 03` (Wang et al. ICLR 2023 transfers to discrete choices, not program text). | **Unanimous** | **Avoid:** Do not use string majority voting on code diffs; use test execution output clustering instead. |
| **A-05** | **Multi-agent debate and heavy MoA loops are too slow and expensive for interactive vibe-coding.** Latency penalties of 15–45 seconds and 4x–8x token costs cause beginner abandonment. | `gemini-3.8-flash 03` + `deepseek 03` + `minimax 03` (Du et al., ICML 2024 debate latency overhead). | **Strong** | **Avoid:** Reject multi-agent debate for real-time coding; reserve MoA strictly for offline plan synthesis. |

---

## 2. Where They Disagree

### D-01 — LLM-as-a-Judge for Code Selection: Valuable Grader or Biased Trap?

- **Reading A (`muse-spark 03`):** LLM-as-a-Judge (Zheng et al., MT-Bench) provides an effective qualitative scoring layer (>80% human agreement) to rank competing candidate implementations when no tests exist.
- **Reading B (`deepseek 03` & `minimax 03`):** Cites Gao, Schulman & Hilton (arXiv:2210.10760, *Scaling Laws for Reward Model Overoptimization*): selecting code via an LLM judge over-optimizes for the judge's documented biases (verbosity bias, defensive boilerplate, and self-enhancement bias). A judge prefers long, complex code over clean, simple solutions.
- **Independent Resolution:** Never use an LLM judge as the selector for code that ships to disk. For code, use **binary mechanical verifiers** (typecheck, lint, unit tests). Reserve LLM judges strictly for **evaluating natural-language plans and user-facing copy** where deterministic compilers do not exist.
- **Why it matters for Phase 1:** Dictates how `vibe-plan` and `vibe-guard` select winning candidates.

### D-02 — Can Multiple Candidate Patches Be Synthesized or Merged?

- **Reading A (`muse-spark 03`):** Recommends taking 3 candidate patches from diverse models and prompting a synthesizer to merge the best elements into a single optimal patch.
- **Reading B (`minimax 03` & `argon 03`):** Patch merging is an anti-pattern. Synthesizing disparate diffs produces uncompilable Frankenstein code with mismatched variable scopes and git conflict artifacts.
- **Independent Resolution:** `minimax 03` is correct. **Never attempt to merge multiple candidate code patches.** Instead, adopt the **Tournament Selection Pattern**: generate $K$ complete, self-contained candidates in parallel, run the verification test suite on all $K$, and select the *first fully green candidate*.
- **Why it matters for Phase 1:** Prevents `src/framework/synthesis.ts` from attempting brittle git diff merging.

### D-03 — Single-Prompt "Produce 5, Critique, Synthesize 1" for Planning

- **Reading A (`gemini-3.8-flash 03`):** Single-prompt multi-option synthesis works well for architectural planning because exploring 2–3 options in one turn prevents premature commitment without latency penalties.
- **Reading B (`argon 03`):** Single-prompt generation of 5 candidates suffers from autoregressive context contamination (Candidate 2 is biased by Candidate 1, collapsing diversity) and output token exhaustion.
- **Independent Resolution:** Reconciled by **capping at 2 options with fixed schema**: do not ask for 5 open-ended designs. In `vibe-plan`, ask for exactly two contrasting approaches: (1) Fast & Lightweight vs (2) Robust & Scalable, evaluated against a 3-point rubric in under 300 tokens total.
- **Why it matters for Phase 1:** Defines the exact prompt template for `vibe-plan`.

---

## 3. Unique Contributions

| Contributor | Unique Finding / Breakthrough | Evidence | Adopt in Phase 1? |
|---|---|---|:---:|
| **`ollama-launch-deepseek-v4.1-flash`** | **The "Inference Scaling via Verification" Principle:** Proved that scaling inference compute only works when coupled with mechanical filters (*Large Language Monkeys*, arXiv:2407.21787); without verifiers, sampling gains collapse. | arXiv:2407.21787v3 | **Yes:** Core architectural tenet of `vibe-fence`. |
| **`google-gemini-4-argon`** | **Quantitative Degradation of Intrinsic Self-Correction:** Documented precise accuracy drop curves across GSM8K, CommonSenseQA, and HotpotQA (-6.5% to -37.7% drop when models critique themselves). | Huang et al. (ICLR 2024 / arXiv:2310.01798) | **Yes:** Explicitly prohibit ungrounded self-critique in harness rules. |
| **`google-gemini-3.8-flash`** | **CodeT Dual Generation-Execution Verification:** Analyzed Chen et al. (ICLR 2023) showing +18.8% pass@1 gain when models generate accompanying unit tests to verify candidates. | Chen et al., ICLR 2023 / arXiv:2207.10397 | **Yes:** Wire automated test scaffolding for critical business logic. |
| **`ollama-launch-minimax-m3.1-flash`** | **Reward Model Over-Optimization in Code:** Demonstrated why LLM judges pick bloated code over clean code when selecting candidate patches. | Gao et al., arXiv:2210.10760 | **Yes:** Restrict judges to natural-language prose evaluation. |
| **`muse-spark`** | **Mixture-of-Agents Context Layering:** Explored layered draft ensembling for offline documentation synthesis. | Wang et al., Together AI 2024 | **Yes:** Use for offline scaffold compilation in `tools/generate.ts`. |

---

## 4. Gaps in the Collective Research

1. **Synthesis on Incomplete/Broken Test Suites:** All empirical papers assume a working unit test suite exists. In greenfield vibe-coder projects, test suites are usually completely absent. How does `vibe-fence` verify candidates when the user repo has zero tests? (Answer: it must generate an ephemeral smoke/build test first).
2. **Inference Latency on Low-Cost Reasoning Models:** As native test-time reasoning models (OpenAI o1/o3, Gemini Flash Thinking) enter the market, does external multi-sample scaffolding become redundant?
3. **Multi-Model Disagreement Resolution:** When two different models produce mutually exclusive correct code styles (e.g. functional vs class-based), how should the harness choose without confusing the user?

---

## 5. The Consolidated Answer

In software engineering, **verification beats consensus**: spending inference compute on opinion (multi-agent debate, LLM judges, ungrounded self-critique) is an expensive anti-pattern that often degrades code quality, whereas spending compute on **execution-grounded filtering** (running tests, linters, and typecheckers) scales accuracy log-linearly. Paulo's hypothesis ("ask 5, self-critique, synthesize 1") is valid only when applied to **high-level planning** (exploring 2 contrasting architectural options in a single prompt) and when candidate code solutions are filtered through **deterministic execution tests** rather than conversational critique. For `vibe-fence`, the optimal elicitation architecture is: **1 sample on the happy path (~1.0x cost); if verification fails, escalate to parallel Best-of-3 candidates filtered by executable tests, keeping the first passing result.**

---

## 6. Actions for Phase 1

### Copy (Proven Patterns to Adopt)
1. **The Reflexion Diagnostic Loop (`.fence/check`):** Run `tsc --noEmit` and tests after every write. If green, commit immediately; if red, inject the concise traceback and allow exactly one self-correction attempt. (`gemini-3.8-flash`, `argon`)
2. **First-Pass-Wins Escalation:** On test failure, trigger parallel sampling ($K \le 3$) and terminate the batch the moment the first candidate passes the test suite. (`deepseek`)
3. **Single-Prompt 2-Option Teachable Fork (`vibe-plan`):** Explore two distinct implementation options (Fast vs Scalable) with a pros/cons rubric inside a single planning turn. (`gemini-3.8-flash`, `muse-spark`)

### Avoid (Anti-Patterns to Reject)
1. **Ungrounded "Critique Your Code" Prompts:** Never ask the model to review or critique its own code without providing a terminal stdout/stderr signal. (`argon`, `gemini-3.8-flash`)
2. **LLM Judges for Code Selection:** Never use an LLM-as-a-Judge to pick code diffs; it over-optimizes for verbosity and defensive bloat. (`deepseek`, `minimax`)
3. **Patch-Merging / Synthesizing Conflicting Diffs:** Never try to stitch two different code patches together; pick one complete working candidate. (`minimax`)
4. **Multi-Agent Debate on Real-Time Tasks:** Reject multi-turn debate loops that add 30+ seconds of latency to user interactions. (`gemini-3.8-flash`, `deepseek`)

### Invent (Novel Primitives to Build)
1. **The Ephemeral Verifier Bootstrap (`src/framework/verifier.ts`):** If a user project has no test suite, `vibe-fence` automatically generates an ephemeral smoke test (does the component mount, does `next build` succeed) so that sampling has a deterministic gate. (`deepseek`, `gemini-3.8-flash`)
2. **The 2-Option Teachable Fork Card:** In companion mode, present the user with an ultra-simple choice:
   - *Option A (Fast prototype):* Client-side state.
   - *Option B (Production ready):* Persistent database.
   User picks A or B with one click; the agent executes the verified path. (`gemini-3.8-flash`, `muse-spark`)

---

## 7. Open Questions

- [ ] **Ephemeral Test Generation Reliability:** How often do LLM-generated unit tests contain false-positive syntax errors that reject actually correct code?
- [ ] **Cost-Capped Escalation:** Under what conditions should `vibe-fence` refuse to spawn 3 parallel samples to protect the user's API credit budget?

---

## 8. Deduplicated Sources Table

| # | Source URL / Paper ID | Type | Primary Contributor |
|---|---|---|---|
| 1 | [arXiv:2310.01798](https://arxiv.org/abs/2310.01798) — Huang et al., *Large Language Models Cannot Self-Correct Reasoning Yet* (ICLR 2024) | Academic Paper | `gemini-3.8-flash`, `argon` |
| 2 | [arXiv:2407.21787v3](https://arxiv.org/html/2407.21787v3) — Brown et al., *Large Language Monkeys: Scaling Inference Compute* | Academic Paper | `deepseek` |
| 3 | [arXiv:2303.11366](https://arxiv.org/abs/2303.11366) — Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning* (NeurIPS 2023) | Academic Paper | `gemini-3.8-flash`, `argon` |
| 4 | [arXiv:2207.10397](https://arxiv.org/abs/2207.10397) — Chen et al., *CodeT: Code Generation with Generated Tests* (ICLR 2023) | Academic Paper | `gemini-3.8-flash` |
| 5 | [arXiv:2210.10760](https://arxiv.org/abs/2210.10760) — Gao et al., *Scaling Laws for Reward Model Overoptimization* | Academic Paper | `deepseek`, `minimax` |
| 6 | [arXiv:2203.11171](https://arxiv.org/abs/2203.11171) — Wang et al., *Self-Consistency Improves Chain of Thought Reasoning* (ICLR 2023) | Academic Paper | `gemini-3.8-flash`, `deepseek` |
| 7 | [arXiv:2406.04692](https://arxiv.org/abs/2406.04692) — Wang et al., *Mixture-of-Agents Enhances Large Language Model Capabilities* (Together AI 2024) | Academic Paper | `gemini-3.8-flash`, `muse-spark` |
| 8 | [arXiv:2305.14325](https://arxiv.org/abs/2305.14325) — Du et al., *Improving Factuality and Reasoning through Multiagent Debate* (ICML 2024) | Academic Paper | `gemini-3.8-flash`, `muse-spark` |
