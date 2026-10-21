# Stream 03 — Elicitation & Synthesis Patterns

- **Model:** muse-spark (Muse Spark)
- **Provider:** Meta via Hermes (ollama-launch)
- **Date:** 2026-10-20
- **Stream:** 03 — Elicitation & Synthesis Patterns
- **Contributor dir:** `muse-spark-2026-10-20`

> Research question: which internal elicitation patterns genuinely beat single-pass generation, and when are they worth the cost for a non-technical vibe-coder harness?

---

## 1. Self-Consistency (Wang et al.)

- **Pattern:** Sample K diverse CoT reasoning paths at T>0 and take the majority-answer vote (marginalize over reasoning paths).
- **Paper:** Wang et al., *Self-Consistency Improves Chain of Thought Reasoning in Language Models*, **arXiv:2203.11171** (ICLR 2023). Accessed 2026-10-20.
- **Task types where it helps:** Arithmetic / symbolic reasoning with a single discrete answer (GSM8K, SVAMP, AQuA, StrategyQA, ARC). Tasks where many reasoning traces converge on one short answer string.
- **Measured gain:**

  | Benchmark | Model | Greedy CoT → Self-consistency |
  |-----------|-------|-------------------------------|
  | GSM8K | PaLM-540B | 56.5% → 74.4% (+17.9pp) |
  | SVAMP | PaLM-540B | +11.0pp |
  | AQuA | PaLM-540B | +12.2pp |
  | StrategyQA | PaLM-540B | +6.4pp |
  | ARC-challenge | PaLM-540B | +3.9pp |

  Gains hold across LaMDA-137B and GPT-3 (code-davinci-002) with similar deltas. Authors sample 40 paths for headline numbers; 5–10 already captures most of the gain (see Cost).

- **Cost:** N× tokens/latency. Canonical K=40. Diminishing returns are steep: Wang et al. Fig 4 shows ~70% of the total gain at K=5 and ~85% at K=10. Wu et al. (arXiv:2408.00724) formalize this as an inference-scaling law — doubling K past ~10 yields log-linear rather than linear accuracy growth. For an LLM API, K=5 at temperature 0.7 costs ~5× input+output; parallel fan-out hides latency but not cost. String-extraction step is free.
- **Strength:** `proven` — large, replicated effect on reasoning benchmarks. Mechanism is well-understood (variance reduction over stochastic decoding).
- **Fit for vibe-fence:** **Conditional / internal — narrow scope.** Useful only where the harness can extract a *discrete* answer (classification, routing, selecting among 2–4 named plans, validating a yes/no guardrail). **Not** useful for open-ended code generation — different correct programs have different surface strings, so majority-vote on raw code fails (Chen et al. make this explicit in Universal Self-Consistency, arXiv:2311.17311). Copy the *idea* (sample several routings and vote), not the literal code-vote.

---

## 2. Best-of-N (BoN) / Reward-Model Reranking

- **Pattern:** Sample N candidates, score each with a verifier / reward model / execution test, return the top-scoring candidate. Pass@N ceiling; BoN realizes a fraction determined by verifier quality.
- **Paper:**

  - Stiennon et al., *Learning to Summarize from Human Feedback* (NeurIPS 2020 / arXiv:2009.01325) — canonical BoN for summarization.
  - Beeching et al., HuggingFace *Best-of-N jailbreak/reward-model analysis* and Snell et al., *Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Parameters* (**arXiv:2408.03314**, Aug 2024) — scaling curves.
  - Wu et al., *Inference Scaling Laws* (**arXiv:2408.00724**, Aug 2024) — systematic Pareto frontier across greedy / majority-vote / BoN / weighted-vote / tree search.

  Accessed 2026-10-20.

- **Task types where it helps:** Tasks with a cheap, reliable verifier: math with answer check, code with unit tests, summarization with reward model, tool-use where success is observable. Snell et al. and Wu et al. both show BoN dominates majority vote when a verifier exists and N is modest.
- **Measured gain:**

  - Wu et al.: on MATH, Llemma-7B + BoN (N=~32) outperforms Llemma-34B greedy — smaller model + BoN Pareto-dominates larger model alone.
  - Snell et al.: BoN beats majority vote at equal N on MATH when using a process reward model; verifier-less weighting underperforms.
  - General shape: pass@1 → BoN(N=8) typically +8–15pp on MATH/GSM8K-style tasks; gain saturates ~N=16–32 (log scaling).
  - Stiennon et al.: human preference win-rate for summaries climbs ~+10pp from N=1→N=8, then flattens.

- **Cost:** N× generation + verifier cost. N=4–8 is the sweet spot; N>32 rarely justified. Latency can be hidden with parallel calls. Dominant cost is tokens, not verifier time (except heavy code execution).
- **Strength:** `proven` for verifiable tasks; `contested` when verifier is itself an LLM (see LLM-as-judge) — weak verifiers cause reward hacking and can *hurt*.
- **Fit for vibe-fence:** **Silent-internal for verifiable sub-tasks.** Best-of-4 with a deterministic check (tests pass, linter clean, types OK) is high-value. Avoid BoN where the judge is just the same LLM re-prompted without grounding — it becomes expensive noise.

---

## 3. Self-Refine (Madaan et al.)

- **Pattern:** Single model loops as generator → self-critic → refiner, iteratively (typically 2–3 rounds), no external tools. Feedback and refinement prompts are distinct.
- **Paper:** Madaan et al., *Self-Refine: Iterative Refinement with Self-Feedback*, **arXiv:2303.17651** (NeurIPS 2023). Accessed 2026-10-20.
- **Task types where it helps:** Open-ended generation where "better" is stylistic or partially self-evaluable: dialogue, code readability, constrained generation, sentiment reversal. Authors test 7 tasks.
- **Measured gain (reported, with caveats):**

  | Task | Δ vs single-pass (author-reported) |
  |------|-------------------------------------|
  | Code optimization | ~+15% win-rate (GPT-3.5) |
  | Dialogue response | ~+20% human preference |
  | Math reasoning | +~10% (GPT-4), smaller on GPT-3.5 |

  Average claimed: ~20% absolute improvement across tasks. Gains concentrate in iteration 1; iteration 2+ helps marginally (Madaan Fig. 2: iteration 1 captures ~70–80% of total gain).

- **Cost:** (1 + 2×iterations) calls: generate + feedback + refine per loop. For 2 iterations ≈ 5× token overhead. Latency is sequential (feedback depends on prior output).
- **Strength:** `practiced` / `contested`. Widely cited and reproduced informally, but Huang et al. (arXiv:2310.01798, below) directly contest the core claim for reasoning tasks: without external feedback, self-critique *degrades* accuracy. Self-Refine's gains appear real for style/fluency tasks and modest for code/ reasoning once you control for answer leakage in prompts. Treat math/code gains as `contested`.
- **Fit for vibe-fence:** **Conditional — only with a rubric.** Allow Self-Refine when the critique can be *grounded* (linter rule, style guide, a11y checklist pasted into the feedback prompt). **Avoid free-form "critique your code"** — it wastes tokens and, per Huang et al., often makes the answer worse.

---

## 4. Reflexion (Shinn et al.)

- **Pattern:** Agent acts in an environment (compiler, tests, search, game), receives *external* feedback (stack trace, test failure), writes a verbal self-reflection into episodic memory, and retries. Reflection is linguistic, not weight update.
- **Paper:** Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning*, **arXiv:2303.11366** (NeurIPS 2023). Accessed 2026-10-20.
- **Task types where it helps:** Any task with an *environment* that returns actionable feedback: code generation with execution, sequential decision-making (ALFWorld), question-answering with retrieval (HotPotQA).
- **Measured gain:**

  | Benchmark | Baseline (GPT-4 ReAct) → Reflexion |
  |-----------|--------------------------------------|
  | HumanEval pass@1 | 80% → 91% (reported) |
  | ALFWorld success | 30% → 54% |
  | HotPotQA | +~10pp over ReAct |

  Contrast with Huang et al. (arXiv:2310.01798): intrinsic self-correction (no external signal) *hurts* GSM8K/CommonSenseQA and degrades correct answers. Reflexion's gain comes from the external signal, not the verbal loop per se.

- **Cost:** 1× base + 1 retry only on failure. Expected overhead = failure_rate × retry_cost. For code tasks with ~30–40% initial failure, that is ~1.3–1.5× average. Verbal memory grows with retries; cap at 2–3 reflections.
- **Strength:** `proven` *conditional on external feedback existing*. Unproven (and actively disproven) without it.
- **Fit for vibe-fence:** **Silent-internal — highest value pattern for code.** This is the canonical "fence" behavior: run lint/type/tests/sandbox after the agent writes, feed failures back verbatim, retry once. Never expose the reflection trace to a non-technical user; surface only the fixed result or a queued issue.

---

## 5. LLM-as-Judge (Zheng et al.)

- **Pattern:** Use a strong LLM (typically GPT-4-class) as an evaluator to rank, score, or pick among candidates. Used inside BoN, debate, and MoA as the selector.
- **Paper:** Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, **arXiv:2306.05685** (NeurIPS 2023). Also: AlpacaEval (Li et al., arXiv:2312.10297), and Bai et al. *Constitutional AI* (arXiv:2212.08073) for critique-mode judging. Accessed 2026-10-20.
- **Task types where it helps:** Pairwise preference (which of two answers is better), open-ended QA, summarization, instruction-following. Strong judges reach ~80–85% agreement with humans on MT-Bench — *near human-human agreement*.
- **Measured gain:** Not a direct accuracy gain; enables other patterns (reranking win-rate +10–15% vs random pick in AlpacaFarm). Judge quality is the ceiling.
- **Known biases (Zheng et al., §3):**

  - Position bias (prefers first or second depending on model) — mitigated by swapping order and averaging.
  - Verbosity bias (longer = better) — length-controlled win-rates (AlpacaEval LC) drop 5–15pp vs raw.
  - Self-enhancement bias (prefers its own style/family) — GPT-4 judge favors GPT-4 outputs.
  - Limited reasoning/math verification — judge is unreliable for code correctness without execution.

- **Cost:** 1 extra LLM call per pair judged; pairwise tournament is O(N log N) or O(N) for single-pick. Cheaper than generation.
- **Strength:** `proven` for preference ranking with strong judges; `contested` for factual/code correctness — execution beats judging.
- **Fit for vibe-fence:** **Silent-internal with guardrails.** Fine as a tie-breaker between two valid plans or two phrasings where correctness is not at stake. **Never use LLM-as-judge as the sole correctness oracle for code** — prefer `run it`. If used, always: swap positions and average, use length-controlled scoring, and log the rubric.

---

## 6. Multi-Agent Debate (Du et al.)

- **Pattern:** 2–4 identical (or diverse) agents propose answers, then debate for R rounds, critiquing and revising until convergence or vote. "Society of minds."
- **Paper:** Du et al., *Improving Factuality and Reasoning in Language Models through Multiagent Debate*, **arXiv:2305.14325** (ICML 2024 workshop → journal). Smit et al., *LLM Debate Evaluations* and Liang et al., *Encouraging Divergent Thinking in LLM through Multi-Agent Debate* (arXiv:2305.19118, 2024) — complementary results. Accessed 2026-10-20.
- **Task types where it helps:** Factuality / hallucination reduction, strategic reasoning (MMLU, GSM8K, chess puzzles in Du et al.), tasks where diverse initial biases cancel.
- **Measured gain:**

  | Setting | Reported gain |
  |---------|---------------|
  | MMLU | +~5–8pp over single-agent (Du et al., GPT-3.5 class) |
  | GSM8K | +~7–10pp |
  | Biographies factuality (Du et al.) | Factual errors ↓ substantially (manual eval) |
  | Liang et al. diverse-role debate | Divergent-thinking tasks +12% vs single-agent |

  Note: gains measured on GPT-3.5/4-class without modern inference-time reasoning models. On today's reasoning models (o1/o3/R1 class) the marginal gain of external debate is smaller and not well-quantified — `contested` forward-looking.

- **Cost:** N_agents × R_rounds calls. Typical 3 agents × 3 rounds = 9× tokens, sequential dependencies add latency (debate cannot be fully parallelized). Token cost dominates; Liang et al. report ~6–10× vs single-pass.
- **Strength:** `proven` for factuality/accuracy lifts in the tested regime; `contested` on cost-effectiveness and on modern reasoning models.
- **Fit for vibe-fence:** **Avoid as default; reserve for high-stakes deliberation.** A 9× cost / multi-round-latency pattern is hostile to a non-technical user's flow. Consider only for explicit "should we do X or Y?" architectural forks where the harness can run debate *offline* (in queue) and present a one-paragraph synthesis.

---

## 7. Mixture-of-Agents — MoA (Wang et al.)

- **Pattern:** Layered architecture: each layer has multiple diverse agents; every agent in layer L sees *all* outputs from layer L-1 as auxiliary context and produces its own response; final layer aggregated by an aggregator model. Collaboration via full context sharing, not structured debate.
- **Paper:** Wang et al., *Mixture-of-Agents Enhances Large Language Model Capabilities*, **arXiv:2406.04692** (Jun 2024). Accessed 2026-10-20.
- **Task types where it helps:** General instruction-following, open-ended reasoning, summarization, code explanation. MoA is a *general* quality boost rather than task-specific.
- **Measured gain:**

  | Benchmark | GPT-4 Omni → MoA (open-source-only stack) |
  |-----------|---------------------------------------------|
  | AlpacaEval 2.0 LC win-rate | 57.5% → 65.1% (+7.6pp) |
  | MT-Bench | Surpasses GPT-4 Omni |
  | FLASK (fine-grained skills) | Consistent gains |

  Key finding: diversity matters — mixing model families (e.g., GPT-4 + Claude + Llama) outperforms same-family ensembles. Best config in paper: 2 layers × 3 proposers + 1 aggregator.

- **Cost:** Roughly (proposers × layers) + aggregator ≈ 7–10× tokens for canonical config. Input tokens blow up in later layers (they ingest all prior outputs). Latency: layers are sequential; proposers within a layer parallelize.
- **Strength:** `proven` for quality gains on open-ended benchmarks; `practiced` — now used in Together AI / inference-provider offerings.
- **Fit for vibe-fence:** **Avoid for inline coding; consider for offline synthesis.** MoA is the most expensive verified pattern per quality point. A vibe-fence cannot afford 7× on every edit. Candidate use: nightly/queued synthesis of plan docs, release notes, or post-batch refactoring summary — tasks where latency is hidden and quality matters.

---

## 8. Synthesis Prompt — "Ask 5, Critique, Synthesize 1"

- **Pattern:** The harness prompt itself elicits breadth then convergence: *generate 5 candidates → critique each against explicit criteria → synthesize one best answer*. Single call (or 1+N+1 calls if staged). This is a prompt-engineering pattern rather than a formal paper, but it has paper-adjacent support.
- **Paper / source:**

  - No single canonical arXiv — practitioner pattern. Best academic proxies:
    - Wang et al., MoA (arXiv:2406.04692) — formalizes why aggregating diverse proposals beats single-shot.
    - Chen et al., *Universal Self-Consistency* (arXiv:2311.17311) — LLM-as-aggregator without string matching, directly validates the "generate N then pick/synthesize with LLM" step for code and open-ended tasks.
    - Self-Refine (arXiv:2303.17651) and Huang (arXiv:2310.01798) — critique step only helps *with criteria*; unguided critique hurts.
  - Practitioner evidence: Anthropic "Building Effective Agents" patterns; OpenAI cookbook compound prompting; tested in Gemini Flash / Claude evaluations.

  Accessed 2026-10-20.

- **Task types where it helps:** Tasks where the answer space is wide but synthesizable: architecture proposals, API designs, UX copy options, refactoring strategies, naming. Also good for *de-biasing* a greedy single answer (avoids premature commitment).
- **Measured gain:** No isolated RCT for "ask 5 → critique → synthesize 1" as a single prompt — `contested` magnitude. Proxy estimates:

  - USC (arXiv:2311.17311): LLM-aggregated selection over 8 code candidates matches *execution-based* voting without execution — ~+10–15pp over greedy on HumanEval/MBPP subsets.
  - MoA aggregator stage: aggregator adds +3–5pp over best single proposer.
  - Practitioner A/Bs (uncontrolled): win-rate +8–12% on preference tasks when using explicit criteria.

  The critique sub-step adds value only if criteria are concrete (rubric, constraints, tests). Without criteria, expect 0 to negative (Huang).

- **Cost:**

  - Single-call version ("in one turn, produce 5 then synthesize"): ~2–3× tokens vs single answer, 1× latency (output is longer). Simplest to deploy.
  - Staged version (5 parallel calls → 1 critic call → 1 synth call): ~7× tokens, 2× latency (generation parallelizes, synthesis waits).
  - Recommended: single-call for routine use; staged only for high-value planning.

- **Strength:** `practiced` — widely used in production prompts; `contested` for magnitude — no clean isolated paper measures exactly this recipe.
- **Fit for vibe-fence:** **Silent-internal — this is Paulo's hypothesis, and it is worth keeping, scoped.** This pattern is the harness's secret weapon *if* two conditions hold: (1) candidates are genuinely diverse (temperature 0.7–0.9 or role-diverse instructions), and (2) synthesis is criterion-grounded (rubric, constraints, or execution signal — not "pick the best vibes"). Without both, it is just verbose single-pass with extra cost.

---

## Comparative Ranking — Value for vibe-fence

Ranked by **expected quality gain per unit cost and user friction**, not raw benchmark delta. Vibe-fence serves non-technical users who will not tolerate 5× latency for 2% gain, and who must never see internal reasoning traces.

| Rank | Pattern | Gain (representative) | Cost (tokens) | Strength | Verdict |
|:----:|---------|-----------------------|---------------|:--------:|---------|
| **1** | **Reflexion (tool-grounded retry)** | +11pp HumanEval (80→91); +24pp ALFWorld | 1.0× happy-path, ~1.4× avg (retry only on fail) | `proven` | **Silent-internal CORE** — run lint/type/tests → feed failures back → 1 retry. Zero cost when tests pass. |
| **2** | **Synthesis prompt (ask 5 → critique → synthesize 1)** | Proxy +8–15pp on open-ended tasks (USC/MoA aggregator) | 2–3× single-call | `practiced` | **Silent-internal CORE for planning** — diverse drafts + criterion-grounded synthesis. Keep single-call; require diversity + rubric. |
| **3** | **Best-of-N with verifier** | +8–15pp MATH/pass@1 where verifier exists; 7B+BoN > 34B greedy | 4–8× (parallel) + verifier | `proven` (with verifier) | **Silent-internal conditional** — BoN-4 with deterministic oracle (tests/lint/types). Never BoN with LLM-judge as sole verifier. |
| **4** | **Self-consistency** | +17.9pp GSM8K, +11pp SVAMP (PaLM-540B, K=40) | 5–40×; ~85% of gain at K=10 | `proven` | **Narrow conditional** — only for discrete routing/classification sub-tasks where majority vote is valid. Not for raw code. |
| **5** | **LLM-as-judge** | ~80% human agreement; enables BoN reranking +10pp | 1× per judgment | `proven` for preference | **Tie-breaker only** — use for phrasing/plan preference; swap positions, length-control, never as code-correctness oracle. |
| **6** | **MoA** | +7.6pp AlpacaEval 2.0 LC vs GPT-4o (65.1 vs 57.5) | 7–10× | `proven` | **Avoid inline; queue only** — too expensive for interactive edits. Candidate for offline docs/synthesis. |
| **7** | **Multi-agent debate** | +5–10pp GSM8K/MMLU, factuality ↓ | 6–10× sequential | `proven`/`contested` | **Avoid** — latency-hostile; gains erode on reasoning models. Offline deliberation only. |
| **8** | **Self-Refine (ungrounded)** | Claimed +20% avg; Huang shows 0 to negative on reasoning | 5× (sequential) | `contested` | **Avoid ungrounded** — free-form self-critique hurts reasoning. Only with explicit rubric + external signal (then it's Reflexion). |

Cost/latency ordering (cheapest first): Reflexion (amortized) < Synthesis single-call < LLM-as-judge < Self-consistency (K=5) < BoN-4 < Self-Refine (sequential) < Debate < MoA. See Wu et al. (arXiv:2408.00724) for formal Pareto frontiers; small-model + smart inference beats large-model greedy at equal compute.

---

## Gaps & Unknowns

1. **Reasoning-model era transfer.** Most cited gains were measured on pre-reasoning models (GPT-3.5/4, PaLM). Whether external self-consistency / debate / MoA still help on top of o1/o3/R1-style internal test-time compute is under-studied; Snell et al. and early 2025 replication threads suggest diminishing marginal returns. Vibe-fence should re-benchmark with its actual model.
2. **Diversity calibration.** Synthesis and BoN gains assume *diverse* samples. Temperature and prompt-diversity tuning for code tasks is under-documented; too-low T yields near-duplicates (no gain), too-high T yields nonsense (hurts).
3. **Stopping rules for retry loops.** Reflexion's "retry once on failure" is safe; unbounded retry risks loops and cost explosion. Optimal escalation threshold for non-technical users (when to queue vs ask) has no paper — it's a UX decision.
4. **Synthesis coherence on multi-file diffs.** USC and MoA aggregate single texts well; synthesizing conflicting multi-file patches is harder and can introduce merge conflicts — no paper evaluates this directly.
5. **LLM-as-judge reliability drift.** Judge quality tracks the judge model's capability; GPT-4-class is ~80% human-aligned today, but bias profiles shift with each model release. Requires periodic recalibration.

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| 1 | Wang et al., *Self-Consistency Improves Chain of Thought Reasoning*, arXiv:2203.11171 (ICLR 2023) — https://arxiv.org/abs/2203.11171 | paper | 2026-10-20 |
| 2 | Madaan et al., *Self-Refine: Iterative Refinement with Self-Feedback*, arXiv:2303.17651 (NeurIPS 2023) — https://arxiv.org/abs/2303.17651 | paper | 2026-10-20 |
| 3 | Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning*, arXiv:2303.11366 (NeurIPS 2023) — https://arxiv.org/abs/2303.11366 | paper | 2026-10-20 |
| 4 | Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, arXiv:2306.05685 (NeurIPS 2023) — https://arxiv.org/abs/2306.05685 | paper | 2026-10-20 |
| 5 | Du et al., *Improving Factuality and Reasoning in Language Models through Multiagent Debate*, arXiv:2305.14325 (ICML 2024) — https://arxiv.org/abs/2305.14325 | paper | 2026-10-20 |
| 6 | Wang et al., *Mixture-of-Agents Enhances Large Language Model Capabilities*, arXiv:2406.04692 — https://arxiv.org/abs/2406.04692 | paper | 2026-10-20 |
| 7 | Chen et al., *Universal Self-Consistency for Large Language Model Generation*, arXiv:2311.17311 — https://arxiv.org/abs/2311.17311 | paper | 2026-10-20 |
| 8 | Chen et al., *CodeT: Code Generation with Generated Tests*, arXiv:2207.10397 — https://arxiv.org/abs/2207.10397 | paper | 2026-10-20 |
| 9 | Huang et al., *Large Language Models Cannot Self-Correct Reasoning Yet*, arXiv:2310.01798 (ICLR 2024) — https://arxiv.org/abs/2310.01798 | paper | 2026-10-20 |
| 10 | Snell et al., *Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Parameters*, arXiv:2408.03314 — https://arxiv.org/abs/2408.03314 | paper | 2026-10-20 |
| 11 | Wu et al., *Inference Scaling Laws: An Empirical Analysis of Compute-Optimal Inference*, arXiv:2408.00724 — https://arxiv.org/abs/2408.00724 | paper | 2026-10-20 |
| 12 | Li et al., *Competition-Level Code Generation with AlphaCode*, arXiv:2203.07814 (Science 2022) — https://arxiv.org/abs/2203.07814 | paper | 2026-10-20 |
| 13 | Stiennon et al., *Learning to Summarize from Human Feedback*, arXiv:2009.01325 — https://arxiv.org/abs/2009.01325 | paper | 2026-10-20 |

---

## Implications for vibe-fence

**Copy:**

1. **Copy Reflexion's tool-grounded retry as the default code loop.** After every agent write, run the cheapest deterministic oracles available (types, lint, unit tests in sandbox). On failure, feed the verbatim error + one-sentence instruction back and retry exactly once. This is the only elicitation pattern that is `proven`, cheap on the happy path (1.0×), and directly maps to vibe-fence's safety promise.
2. **Copy "ask 5 → critique → synthesize 1" for planning, not coding.** When the user requests a feature or the harness creates a plan file, use a single-call synthesis prompt with 2–4 diverse drafts and a criterion rubric (constraints, trade-offs, risks). This de-biases premature commitment and is cheap enough to run synchronously.
3. **Copy Best-of-N with execution for risky code.** For pure functions, parsers, and API handlers where tests can be generated or already exist, run BoN-4 in parallel, execute, and keep the first passing candidate. Parallelism hides latency; execution is the oracle.

**Avoid:**

4. **Avoid ungrounded self-critique ("review your code and fix bugs").** Per Huang et al. (arXiv:2310.01798), intrinsic self-correction without external feedback degrades reasoning. Never inject generic critique prompts; every critique must carry a tool signal or explicit checklist.
5. **Avoid multi-agent debate and MoA on the interactive path.** Their 6–10× cost and sequential latency violate the vibe-coder attention budget. If retained, run them as queued/offline jobs and present only the synthesis.
6. **Avoid LLM-as-judge as a code-correctness judge.** Execution > judging for code. If LLM judging is used (e.g., plan preference), enforce anti-bias controls: swap positions and average, length-control, log rubric, and treat result as advisory.

**Invent:**

7. **Invent the "silent Reflexion circuit" (`.fence/check`).** A harness wrapper that intercepts every commit: pass 1 = agent writes; harness runs `fence-check` (lint/type/test) silently; if green, commit immediately (0 latency added); if red, inject the compact error trace + "diagnose and fix" and retry once; hard circuit-breaker at 1 retry → queue as a structured `issue → fix → plan` item for the agent to resolve, surfaced to the user as a single friendly notice. This turns a research pattern into a product primitive.
8. **Invent a diversity-aware synthesis primitive.** Do not hardcode K=5. The harness should: sample at T=0.7–0.9 with role-diverse prompts, de-duplicate near-identical drafts (embedding or AST similarity), then synthesize with a criterion prompt that includes project constraints. Log the rubric and the winner's rationale for auditability. This is not in any paper — it operationalizes USC/MoA insights for cost control.
9. **Invent cost-gated elicitation (inference-scaling policy).** Encode Wu et al. / Snell et al. Pareto insights: the harness picks elicitation strength by (a) task stakes (one-line edit vs scaffold) and (b) verifier availability. Rule: greedy if trivial + no verifier; synthesis (2–3×) if planning; BoN+execute (4×) if risky pure function + tests exist; Reflexion retry (1.4× amortized) always for code writes. Never pay >3× without a verifier.
10. **Invent escalate-don't-loop.** After one failed Reflexion retry, stop looping and escalate to the structured queue — do not burn tokens retrying. The queue item should carry the error, the attempted fix, and a bounded next plan. This respects the user's attention while preserving the fix attempt for audit.

