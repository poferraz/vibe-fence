# Stream 03 — Elicitation & Synthesis Patterns

- **Model:** minimax-m3.1-flash
- **Provider:** ollama-launch (Hermes Agent)
- **Date:** 2026-10-20
- **Stream:** 03 — Elicitation & Synthesis Patterns (multi-sample, critique, debate, MoA, synthesis, cost/latency)
- **Sources:** 46 (42 arXiv papers / peer-reviewed, 1 industry research page, 3 arXiv preprints on vibe coding + agent efficiency)

---

## 0. Thesis: the hypothesis is half right, and the half that is wrong is the expensive half

vibe-fence's design hypothesis — *"ask 5, self-critique, synthesize 1" internally, show the user one clean answer* — is
**right about the wrapper and wrong about the middle**. The evidence splits cleanly:

1. **The wrapper is right.** Every robust pattern in the literature is a *selector* over candidates, and the selector
   is the load-bearing part. Where an automatic verifier exists, sampling + filtering converts directly into
   correctness [4]. Where none exists, majority voting and reward models "plateau beyond several hundred samples and
   fail to fully scale with the sample budget" [4]. Consensus is not correctness.
2. **The middle is wrong.** The "self-critique" step is the weak link, and the failure is *specifically* in the
   ungrounded case. Huang et al. show that intrinsic self-correction **degrades** reasoning accuracy, and that the
   mechanism is that the model flips correct answers to incorrect ones, not that it merely fails to help [9]. The
   independent 2024 survey reaches the same conclusion from the other direction: "no prior work demonstrates successful
   self-correction with feedback from prompted LLMs, except for studies in tasks that are exceptionally suited for
   self-correction" [10].
3. **The expensive half is exactly the part with no measured gain.** Cost-matched, multi-agent debate is *worse* than
   plain majority voting [9], and on reasoning models "simple majority voting consistently outperforms sophisticated
   sequential revision and mixture-of-agents frameworks" [46]. MoA's headline +7.6pp is on a *preference* benchmark
   (AlpacaEval 2.0), not a correctness benchmark [20].

**The one hard number that decides the product:** on SWE-bench Lite, one sample solves 15.9% of issues; 250 samples
solve 56% [4]. That is a 3.5× gain — but it costs 250× the tokens and is a batch job. A harness cannot spend it
eagerly. It can spend it *reactively*: sample 1, verify, and only on failure fan out to a small parallel set.

**Cost-corrected rule for vibe-fence:** spend the extra compute on **execution**, not on **opinion**. A coding harness
has the cheapest verifier in software (the test suite), and a non-technical user has the least patience for latency.
So: **1 sample + verify → on failure, small parallel best-of-k + verify → on failure again, escalate to a human** —
and use judges, debate, and MoA only on *unverifiable* decisions (naming, structure, prose the user will read), where
they are cheap relative to the alternative of asking the user.

### Corrections to the two existing stream-03 contributions

Both sibling files contain a claim this stream can refute from primary sources, and one number that is misattributed:

| Sibling claim | Correction |
|---|---|
| "Reflexion lifts HumanEval pass@1 from **67%** to 91%" (google-gemini-3.8-flash) | The paper compares **91% vs GPT-4's 80%** [12]. The 67% figure is not the Reflexion baseline. The *gain* is 80→91 against a GPT-4 baseline, not 67→91. |
| "Reflexion … 80% → 91%" (muse-spark) | Correct, but the framing "reported" hides that the baseline is a *different model* (GPT-4), not the same model without reflexion. So it is not a clean ablation. |
| "Multi-agent debate: +~5–10pp GSM8K/MMLU" (both) | True at Du et al.'s settings [17], but **cost-matched against self-consistency it loses**: 9 responses → debate 83.0% vs self-consistency 88.2% on GSM8K [9]. The gain is a *selection* effect, not a *debate* effect. |
| "MoA = 7–10× tokens" (muse-spark) | Paper's own budget analysis finds MoA implementations "comparable to GPT-4 Turbo while being 2× more cost-effective" [20]. The multiplier is workload-dependent; "MoA-Lite" (fewer layers) still beat GPT-4o by 1.8pp. |
| "Self-Refine +~20% absolute, gains real" (muse-spark, tagged `practiced`) | The self-refine authors' own ablation isolates the cause: 33% of *failed* cases were bad feedback and 61% were an inappropriate suggested fix; only **6%** were the refiner mis-implementing good feedback [11]. And on Vicuna-13B it "struggles significantly with the refinement process" [11]. This is a `contested` result, not `practiced`. |
| "Universal Self-Consistency: ~+10–15pp over greedy on HumanEval/MBPP" (muse-spark) | USC's actual code-generation numbers are much smaller and on SQL/Python-notebook benchmarks: BIRD-SQL 42.4% greedy → 45.5% USC (+3.1pp); ARCADE 26.0% → 30.1% (+4.1pp) [3]. It *matches* execution-based voting, it does not exceed it. |

---

## 1. Multi-sample patterns

### E-01 — Self-consistency: real, large, and *not* applicable to raw code

- **Claim:** Sampling a diverse set of reasoning paths and taking the most consistent final answer improves accuracy
  substantially over greedy chain-of-thought. The mechanism is variance reduction: a problem that admits many routes
  tends to funnel to one answer across independent samples, so the mode is more reliable than any single draw.
- **Evidence:** Wang, Wei, Schuurmans, Le, Chi, Narang, Chowdhery & Zhou, "Self-Consistency Improves Chain of Thought
  Reasoning in Language Models," arXiv:2203.11171 — https://arxiv.org/abs/2203.11171 (accessed 2026-10-20).
  Reported deltas over greedy CoT: **GSM8K +17.9%, SVAMP +11.0%, AQuA +12.2%, StrategyQA +6.4%, ARC-challenge
  +3.9%** [1].
- **Strength:** `proven` for closed-form-answer reasoning. **`contested`** as a *general* answer-improvement pattern, per
  E-03: cost-matched against multi-agent debate it loses [9], and on reasoning models plain majority voting beats more
  elaborate schemes [46].
- **Fit for vibe-fence:** **Narrow, silent-internal.** Use only where the answer is genuinely discrete and the
  *selection rule* is well-defined: "which of these 3 schemas", "is this string a secret or a placeholder", "does this
  error match a known signature". Do **not** majority-vote code strings — different correct programs have different
  surface text, and execution-based clustering is the correct substitute [3]. Note the size caveat: the headline
  deltas are from PaLM-540B-era models; on a modern small model the absolute gain will be smaller.

### E-02 — Adaptive sampling: you do not have to pay for the full budget

- **Claim:** A fixed sample budget is wasteful. A lightweight stopping criterion that samples until the answer
  distribution is confident achieves most of the accuracy at a fraction of the samples.
- **Evidence:** Aggarwal, Madaan, et al., "Let's Sample Step by Step: Adaptive-Consistency for Efficient Reasoning and
  Coding with LLMs," arXiv:2305.11860 — https://arxiv.org/abs/2305.11860 (accessed 2026-10-20). Across 17 reasoning
  and code-generation datasets and three LLMs, Adaptive-Consistency "reduces sample budget by up to 7.9 times with an
  average accuracy drop of less than 0.1%"; the average budget reduction is **3.3×** at a **0.04%** accuracy cost
  [2]. Note the caveat for code: the paper's code experiments follow CodeT's protocol with **100 samples for
  HumanEval and MBPP** and 1000 for CodeContests [2] — the absolute budgets are large; the *saving* is what transfers.
- **Strength:** `proven` (17 datasets, 3 models, controlled comparison).
- **Fit for vibe-fence:** **Copy the stopping rule, not the budget.** A confidence-threshold stop ("if the first 3
  samples agree, stop; if they disagree, keep going up to k=5") is a cheap, model-agnostic win. It converts a fixed 5×
  cost into a *variable* cost that is ~1× on easy tasks. This is the mechanism that makes "ask 5" affordable.

### E-03 — Universal self-consistency: LLM-as-selector works, but it only *matches* execution, it does not beat it

- **Claim:** Self-consistency normally requires exact-match answer extraction, so it does not apply to free-form output.
  Universal Self-Consistency (USC) removes that requirement by having the LLM pick the most consistent candidate from a
  set. It **matches** standard self-consistency on math, and **matches execution-based voting on code** — without
  needing execution results.
- **Evidence:** Chen, Aksitov, Alon, Ren, Xiao, Cheng, Choi, Weng, Liu, Yang & Chen, "Universal Self-Consistency for
  Large Language Model Generation," arXiv:2311.17311 — https://arxiv.org/abs/2311.17311 (accessed 2026-10-20).
  Measured (gpt-3.5-turbo): BIRD-SQL execution accuracy **42.4% greedy → 45.5% USC**, versus 45.6% for
  execution-based self-consistency (SC-Exec) and 48.8% valid-efficiency for USC vs 48.1% SC-Exec; ARCADE **26.0% →
  30.1% USC** vs 29.8–30.3% SC-Exec [3]. On GSM8K with PaLM 2-L: 85.7% greedy → 90.2% USC vs 90.4% SC [3].
- **Strength:** `proven` that the *selector* works; `contested` as a substitute for execution. The headline framing
  ("matches execution-based voting") is the honest one, and it is the ceiling: **USC ≈ execution, never > it.**
- **Fit for vibe-fence:** **Useful, but only as a fallback.** In a vibe-coded project with no test suite, execution is
  unavailable — USC is then the best available selector. But the gap is small, and the moment a test exists, prefer
  execution. **The number to remember: ~+3 to +4pp over greedy, not +15pp.**

### E-04 — Repeated sampling + verifier: the largest code-specific measured gain, and its price

- **Claim:** Coverage — the fraction of problems solved by *any* sample — scales log-linearly with sample count over
  four orders of magnitude, and in domains with automatic verifiers that coverage converts directly into performance.
- **Evidence:** Brown, Juravsky, Ehrlich, Clark, Le, Ré & Mirhoseini, "Large Language Monkeys: Scaling Inference Compute
  with Repeated Sampling," arXiv:2407.21787 — https://arxiv.org/abs/2407.21787 (accessed 2026-10-20). SWE-bench Lite
  with DeepSeek-Coder-V2-Instruct: **15.9% (1 sample) → 56% (250 samples)**, exceeding the single-sample SOTA of 43%
  [4]. The same paper finds that on MATH and GSM8K, "coverage is maximized with a smaller model and more samples"
  at fixed FLOPs, while on CodeContests the larger model wins — the optimal model size is task-dependent [4].
- **Strength:** `proven` (multiple tasks, multiple models, four orders of magnitude).
- **Cost:** This is the crux. 250 samples is 250× the generation cost. The paper's own dollar analysis is the one to
  quote: DeepSeek-Coder-V2-Instruct is "over 10x cheaper" per call than the GPT/Claude models it beats on aggregate
  outcome, and repeated sampling "provides a cheaper alternative" to a single stronger-model attempt [4]. So the 15.9→56
  gain is *also* a cost win — but only at batch scale.
- **Fit for vibe-fence:** **Core pattern, but only in a reactive shape.** Ship `1 sample → verify → on failure, 3–4
  parallel samples → verify → first pass wins`. Expected cost on the happy path ≈ 1.0–1.2×; on the failure path ≈ 4–5×.
  Never sample 250 eagerly. The deeper lesson from this paper: **a harness that can verify is worth more than one that
  can sample** — the verifier is what converts tokens into correctness.

### E-05 — Verifiers are not trustworthy enough to lean on blindly

- **Claim:** In real software tasks, automatic verification is a *middle ground*, not a gold standard. Test suites give
  false positives and false negatives at material rates, which caps how much sampling can actually buy.
- **Evidence:** Brown et al. (arXiv:2407.21787) — https://arxiv.org/abs/2407.21787 (accessed 2026-10-20): **11.3% of
  SWE-bench Lite problems have flaky test suites** that "occasionally classify even the dataset's ground-truth issue
  solutions as incorrect" [4]. On CodeContests, of 122 test problems with Python3 solutions, **35 have "correct"
  solutions that fail the corresponding tests** [4]. Independently, R2E-Gym finds that for most problems **"less than
  20% of tests provide discriminative signal"** — most generated tests either fail to reproduce the bug or fail to pass
  the ground-truth patch (arXiv:2504.07164, https://arxiv.org/abs/2504.07164, accessed 2026-10-20) [23].
- **Strength:** `proven` (measured across three independent research efforts).
- **Fit for vibe-fence:** **Critical design constraint.** The fence cannot trust "tests pass" as a sufficient condition.
  Mitigations that follow directly: (a) treat a green test run as *necessary but not sufficient* — pair it with type-check
  and lint; (b) run the test suite **twice** to detect flakiness before declaring a candidate the winner; (c) when
  several candidates pass, prefer the one that passes the *most* tests, not the first that passes; (d) record a
  `flaky: true` flag in the fence state so the user's "it broke again" complaint has a known cause. This is a
  *differentiated* finding — neither sibling file mentions verifier flakiness at all, and both recommend BoN/Reflexion
  with an execution oracle as if the oracle were sound.

### E-06 — Best-of-N with a learned verifier beats Best-of-N with a judge

- **Claim:** The quality of a Best-of-N selector, not the number of candidates, is the binding constraint. A verifier
  trained for the task beats both a discriminative reward model and an off-the-shelf LLM-as-a-judge by a wide margin.
- **Evidence:** Zhang et al., "Generative Verifiers: Reward Modeling as Next-Token Prediction," arXiv:2408.15240 —
  https://arxiv.org/abs/2408.15240 (accessed 2026-10-20). GenRM best-of-N results vs the LLM-as-a-Judge baseline:
  **algorithmic tasks 5% → 45.3%**; **GSM8K 73% → 93.4%**; easy-to-hard generalization **MATH 28% → 44.6%**;
  **MMLU abstract algebra 37.9% → 53.5%** [7]. On MMLU mathematics, GenRM-CoT over a discriminative reward model:
  elementary math 80.1% → 91.1%, high-school math 52.2% → 76.1%, college math 47.6% → 56.1%, abstract algebra
  37.9% → 53.5% [7].
- **Strength:** `proven` (controlled, same candidates, only the verifier varies).
- **Cost:** The catch — GenRM requires **training** a verifier on task-specific data. A vibe-fence shipping to arbitrary
  user projects cannot train per-project verifiers in Phase 1.
- **Fit for vibe-fence:** **Do not build this in Phase 1; do design for it.** The actionable transfer is the *shape*:
  a verifier that *reasons about the artifact* (GenRM-CoT) beats a classifier that only scores it. A deterministic
  checker (`tsc --noEmit`, `eslint`, `pytest`) is the free analogue: it *reasons about the code's behaviour*, not about its
  surface form. LLM-as-a-judge is the degenerate case — it reasons about neither. **Selector ranking for vibe-fence:
  execution > types > lint > learned verifier > LLM judge.**

### E-07 — Best-of-N against a weak proxy actively degrades quality

- **Claim:** Optimizing hard against an imperfect proxy — a reward model or a judge — finds the proxy's flaws.
  Measured reward keeps rising while true quality peaks and then **declines**. More selection against a bad proxy is
  not neutral; it is harmful.
- **Evidence:** Gao, Schulman & Hilton, "Scaling Laws for Reward Model Overoptimization," arXiv:2210.10760 —
  https://arxiv.org/abs/2210.10760 (accessed 2026-10-20). The paper studies both RL optimization and **best-of-n
  sampling** against a proxy reward model and finds the relationship follows a distinct functional form, with the
  coefficients scaling smoothly with reward-model parameter count — i.e. over-optimization is a *systematic, predictive*
  effect, not noise [8].
- **Strength:** `proven` (scaling laws, multiple proxy types, synthetic setup with a "gold" model standing in for humans).
- **Fit for vibe-fence:** **This is the strongest single argument against "best-of-10, pick with a judge" for code.** A
  judge that prefers longer, more defensive-looking patches will systematically select the bloated patch the user
  cannot review. Concretely: **never let a judge gate a patch.** Use judges for prose the user will read; use execution
  for code that will ship. And if a judge *must* be involved, cap the number of candidates it sees (see E-10) so the
  harness cannot run long enough to over-optimize the proxy.

### E-08 — CodeT: generate the tests too, and use dual execution agreement

- **Claim:** The bottleneck in Best-of-N code generation is not the number of candidates, it is the *selector* — and
  you can manufacture a selector by having the same model generate the test cases, then running candidates against
  them and using **dual execution agreement** (consistency with the generated tests *and* agreement with other
  candidate programs).
- **Evidence:** Chen, Zhang, Nguyen, Zan, Lin, Lou & Chen, "CodeT: Code Generation with Generated Tests,"
  arXiv:2207.10397 — https://arxiv.org/abs/2207.10397 (accessed 2026-10-20). CodeT reaches **65.8% pass@1 on
  HumanEval**, "an absolute improvement of **18.8%** over the code-davinci-002 model," and >20% absolute over the
  previous state of the art, across HumanEval, MBPP, APPS and CodeContests with five models of varying size [5]. The
  companion system, AlphaCode, reached an average top-54.3% ranking on Codeforces competitions with >5,000
  participants, and its authors name "an extensive… filtering" pipeline as one of three critical components
  (arXiv:2203.07814, https://arxiv.org/abs/2203.07814, accessed 2026-10-20) [6].
- **Strength:** `proven` (four benchmarks, five models, consistent gains).
- **Cost:** CodeT is *expensive*: N candidates + M generated tests + execution, and AlphaCode-scale filtering used
  ~10⁶ samples. The 18.8pp headline is not a 2× cost; it is a many-× cost.
- **Fit for vibe-fence:** **Copy the mechanism, not the scale.** "Ask the model to also write the test" is cheap and
  high-value for a vibe-coded project that has no tests — it manufactures the verifier the fence otherwise lacks, which
  is the single most valuable thing a fence can do for a non-technical user. Then run the *dual* agreement check
  (agreement across candidates + agreement with the generated tests) rather than a naive pass/fail, because E-05 shows
  single-test pass/fail is noisy. **A fence that generates the project's first test suite is arguably more valuable than
  a fence that samples more.**

### E-09 — Code generation is where execution-grounded selection genuinely pays, and where the literature agrees

- **Claim:** The strongest code-generation results in the literature all share one ingredient: an execution signal used
  to *filter* rather than a model used to *judge*.
- **Evidence:** CodeT [5] (arXiv:2207.10397, https://arxiv.org/abs/2207.10397); AlphaCode [6] (arXiv:2203.07814,
  https://arxiv.org/abs/2203.07814); Large Language Monkeys [4] (arXiv:2407.21787, https://arxiv.org/abs/2407.21787) —
  all accessed 2026-10-20. The common structure: *coverage from sampling, converted by a filter*.
- **Strength:** `proven` (three independent lines).
- **Fit for vibe-fence:** This is the summary of the multi-sample section. **The fence's job is to be the filter.**

### E-10 — Test-time compute: allocate by difficulty, not by a fixed multiplier

- **Claim:** The effectiveness of a test-time-compute strategy depends critically on the difficulty of the prompt. A
  *compute-optimal* policy that allocates compute per-prompt beats a fixed best-of-N baseline by more than 4× in
  compute. And on FLOPs-matched comparisons, a smaller model with test-time compute can beat a ~14× larger model on
  problems where the smaller model has non-trivial success rate.
- **Evidence:** Snell, Lee, Xu & Kumar, "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model
  Parameters," arXiv:2408.03314 — https://arxiv.org/abs/2408.03314 (accessed 2026-10-20): "the effectiveness of
  different approaches to scaling test-time compute critically varies depending on the difficulty of the prompt," and
  the compute-optimal strategy "improve[s] the efficiency of test-time compute scaling by more than 4× compared to a
  best-of-N baseline" [21]. Complementing it, Wu et al., "Inference Scaling Laws," arXiv:2408.00724 —
  https://arxiv.org/abs/2408.00724 (accessed 2026-10-20) show "smaller models combined with advanced inference
  algorithms offer Pareto-optimal trade-offs in cost and performance," with Llemma-7B plus tree search "consistently
  outperforms the Llemma-34B model across all tested inference strategies on the MATH benchmark" [22].
- **Strength:** `proven` (mechanism + scaling analysis; the difficulty *estimator* is the hard unsolved part).
- **Cost:** The compute-optimal policy is strictly cheaper than best-of-N at equal or better accuracy — 4× less compute.
  This is the rare pattern that is *cheaper and better*.
- **Fit for vibe-fence:** **Adopt the policy shape.** The harness needs a difficulty signal before spending tokens.
  Cheap proxies: did attempt 1 fail? does the task touch auth / payments / data migration? is the file unfamiliar or
  large? **Escalate compute on (risk × first-failure), never uniformly.** And for a modest model, this is a double win:
  the evidence says a 7B model with tree search beats a 34B model without — which is exactly the "harness must work on
  modest models" constraint in the brief.

---

## 2. Critique and refinement

### E-11 — The key negative result: unaided self-critique *degrades* correct answers

- **Claim:** Intrinsic self-correction — the model reviewing and revising its own output with no external signal —
  reduces reasoning accuracy. The mechanism is specific and damaging: the model **changes correct answers to incorrect
  ones**, not merely failing to fix incorrect ones.
- **Evidence:** Huang, Chen, Mishra, Zheng, Yu, Song & Zhou, "Large Language Models Cannot Self-Correct Reasoning Yet,"
  arXiv:2310.01798 — https://arxiv.org/abs/2310.01798 (accessed 2026-10-20). Measured (Table 3, intrinsic
  self-correction): GPT-3.5 GSM8K **75.9% → 75.1% (round 1) → 74.7% (round 2)**; CommonSenseQA **75.8% → 38.1% →
  41.8%**; HotpotQA **26.0% → 25.0% → 25.0%**. GPT-4: GSM8K **95.5% → 91.5% → 89.0%**; HotpotQA **49.0% → 49.0%
  → 43.0%**. GPT-4-Turbo: GSM8K 91.5% → 88.0% → 90.0%. **Llama-2: GSM8K 62.0% → 43.5% → 36.5%**; CommonSenseQA
  64.0% → 37.5% → 36.5% [9]. The paper attributes the failure to prompt design: the self-correction prompt "might even
  bias the model away from producing an optimal response to the initial prompt, resulting in a performance drop" [9].
  It further shows the reported gains of prior work came from *oracle labels* — with a ground-truth correctness label,
  GPT-3.5 GSM8K rises 75.9% → 84.3% [9].
- **Strength:** `proven` (the negative result). Two independent confirmations: the 2024 critical survey [10] and the
  2025 agent-framework study [39].
- **Cost:** 3 calls (round 1) or 5 calls (round 2) for a *negative or zero* return [9].
- **Fit for vibe-fence:** **This kills the naive "ask 5, self-critique, synthesize 1" idea as literally stated.** The
  critique step must be replaced by an *oracle* step. Concretely, vibe-fence's pipeline is "sample → **execute** →
  keep what runs", not "sample → **ask the model to critique** → synthesize". Three specific prohibitions:
  (a) no skill text may say "review your own work" as a quality step; (b) the "synthesize" step must consume
  *executed* candidates, not opinions about them; (c) if a human-readable critique is wanted, it must be generated
  *from* the execution result (e.g. "3 of 5 candidates failed the type check") rather than *instead of* it.

### E-12 — The second negative result: multi-agent debate loses to plain majority voting at equal cost

- **Claim:** Multi-agent debate is often reported as a win, but the comparison was unfair. Cost-matched against
  self-consistency with the same number of responses, debate is **worse**, and its apparent benefit is a *selection*
  effect (having more candidates) rather than a *debate* effect.
- **Evidence:** Du, Li, Torralba, Tenenbaum & Mordatch, "Improving Factuality and Reasoning in Language Models through
  Multiagent Debate," arXiv:2305.14325 — https://arxiv.org/abs/2305.14325 (accessed 2026-10-20) — the original result:
  multiple model instances propose and debate over multiple rounds to arrive at a common final answer, which
  "significantly enhances mathematical and strategic reasoning across a number of tasks" and "improves the factual
  validity of generated content, reducing fallacious answers and hallucinations" [17]. And Huang et al.
  (arXiv:2310.01798) — https://arxiv.org/abs/2310.01798 (accessed 2026-10-20). Table 7
  on the **full** GSM8K test set with gpt-3.5-turbo-0301, using Du et al.'s exact debate prompt with 3 agents and 2
  rounds:

  | # responses | Method | GSM8K |
  |---|---|---|
  | 1 | Standard prompting | 76.7 |
  | 3 | Self-consistency | 82.5 |
  | 6 | Multi-agent debate (round 1) | 83.2 |
  | 6 | **Self-consistency** | **85.3** |
  | 9 | Multi-agent debate (round 2) | 83.0 |
  | 9 | **Self-consistency** | **88.2** |

  The paper's conclusion: "for self-consistency with an equivalent number of responses, multi-agent debate
  significantly underperforms simple self-consistency using majority voting," and "it is more appropriate to perceive it
  as a means to achieve 'consistency'… The observed improvement is evidently not attributed to 'self-correction', but
  rather to 'self-consistency'" [9]. The paper's summary-of-issues table lists "Multi-Agent Debate (Du et al., 2023) —
  Unfair comparison to self-consistency" as a headline methodological finding [9]. An independent replication agrees:
  Smit et al., "Should we be going MAD?," arXiv:2311.17371 — https://arxiv.org/abs/2311.17371 (accessed 2026-10-20)
  finds "multi-agent debating systems, in their current form, do not reliably outperform other proposed prompting
  strategies, such as self-consistency and ensembling using multiple reasoning paths," though Multi-Persona debate does
  better after hyperparameter tuning [18].
- **Strength:** `proven` that the *reported gain is misattributed*; `contested` on whether well-tuned debate can be
  competitive (both papers say the protocols are hyperparameter-sensitive and hard to optimize).
- **Cost:** Debate is the most expensive pattern per unit of gain — 3 agents × 2 rounds = 9 sequential-ish calls, and
  unlike parallel sampling it **cannot** be fully parallelized across rounds, so latency compounds.
- **Fit for vibe-fence:** **Avoid multi-agent debate.** This is a stronger claim than the sibling files make (both rate
  it "avoid for real-time, maybe offline"), and the reason is not cost alone — at equal cost it is *worse than simply
  sampling and voting*. If a "society of minds" feel is wanted, implement it as **parallel sampling + vote**, which
  delivers the same selection effect at 1/3 the latency and is parallelizable. The 2026 MAD survey (arXiv:2607.26212,
  https://arxiv.org/abs/2607.26212, accessed 2026-10-20) reinforces this by finding the field has "implicitly converged on
  a narrow design pattern… adopted by convention rather than systematic comparison," making cross-study claims about
  debate unreliable [19].

### E-13 — Reflexion works, but only because of the environment, and the headline is a cross-model comparison

- **Claim:** An agent that acts, receives external feedback, writes a verbal reflection into episodic memory, and retries
  performs substantially better than a baseline agent. The gain comes from the *loop with a signal*, not from the
  reflection prose.
- **Evidence:** Shinn, Cassano, Berman, Gopinath, Narasimhan & Yao, "Reflexion: Language Agents with Verbal Reinforcement
  Learning," arXiv:2303.11366 — https://arxiv.org/abs/2303.11366 (accessed 2026-10-20). "Reflexion achieves a 91%
  pass@1 accuracy on the HumanEval coding benchmark, surpassing the previous state-of-the-art GPT-4 that achieves 80%"
  [12]. The framework "is flexible enough to incorporate various types (scalar values or free-form language) and
  sources (external or internally simulated) of feedback signals" [12].
- **Strength:** `proven` *conditional on external feedback*. Huang et al. classify Reflexion among the methods that used
  oracle labels in their original evaluation and show the gains vanish without them [9]; the 2024 survey likewise
  concludes self-correction "works well in tasks that can use reliable external feedback" [10].
- **Cost:** 1× on the happy path; 2× on a failure (one retry). The memory of past reflections is free and persists.
- **Fit for vibe-fence:** **Silent-internal, and the highest-value pattern for code — with one important caveat the
  sibling files miss.** The "91% vs 80%" comparison is against a *different model* (GPT-4), not against the same model
  without Reflexion, so it is not a clean ablation of the pattern. The fence should measure its own ablation
  (same model, with and without the retry loop) rather than inherit the paper's delta. **Also: persist the reflection
  across sessions.** A fence that remembers "this project's tests fail when the DB schema changes" is demonstrating
  companion behaviour at near-zero marginal cost.

### E-14 — Self-Refine's own ablation says the *feedback*, not the refinement, is what works

- **Claim:** Self-Refine (generate → self-feedback → refine, k=3) claims ~20% absolute average improvement over
  single-pass generation. The paper's own failure analysis localizes the cause: **the feedback is the fragile part**,
  and the model is fragile with it.
- **Evidence:** Madaan, Gupta, Rafailov, Bordes, Singh & Li, "Self-Refine: Iterative Refinement with Self-Feedback,"
  arXiv:2303.17651 — https://arxiv.org/abs/2303.17651 (accessed 2026-10-20). The headline: "improving by ~20% absolute
  on average in task performance" over 7 tasks with GPT-3.5/ChatGPT/GPT-4, and "In code-generation tasks, Self-Refine
  improves the initial generation by up to absolute 13%" with Codex [11]. **But:** of the *unsuccessful* cases, **33%
  were feedback inaccurately pinpointing the error's location, 61% were feedback suggesting an inappropriate fix, and
  only 6% were the refiner mis-implementing good feedback** [11]. On **Vicuna-13B**, "while Vicuna-13B is capable of
  generating initial outputs, it struggles significantly with the refinement process" — it "either repeated the same
  output or generated a hallucinated conversation" [11]. Generic feedback ("Improve the efficiency of the code") scores
  worse than no feedback at all on several tasks [11]. Gains concentrate in early iterations: Code Optimization 22.0 →
  28.8 over three iterations with diminishing returns [11].
- **Strength:** `contested` — the authors' numbers are real for their tasks, but Huang et al. [9] and the 2024 survey
  [10] both find this effect does not survive a fair comparison, and the paper's own ablation shows the mechanism is
  fragile.
- **Cost:** 1 + 2k calls (k=3 → 7 calls). Sequential.
- **Fit for vibe-fence:** **Never ship ungrounded Self-Refine.** If a critique step is used, the critique must come from
  a *grounded, specific* signal — a lint rule, a failing test name, a type error — and the critique prompt must carry
  that signal, not the model's opinion. This is exactly the distinction the Gemini sibling file draws, and the
  33%/61%/6% breakdown is the mechanism that makes it convincing. The Vicuna-13B result is a direct warning for a
  harness that must work on modest models: **if the model cannot reliably produce the critique in the required format,
  the pattern is not just useless, it is noise.** The paper's own positive control for a modest model is the right
  model for a weak one: do not refine, re-sample.

### E-15 — The survey verdict, and the conditions under which self-correction does work

- **Claim:** A critical survey of the self-correction literature concludes: (1) no prior work demonstrates successful
  self-correction with feedback from *prompted* LLMs in general tasks, except for tasks exceptionally suited to it;
  (2) self-correction works well where **reliable external feedback** is available; (3) large-scale fine-tuning
  enables self-correction; (4) the bottleneck is *feedback generation*.
- **Evidence:** Kamoi, Feng, Huang, et al., "When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey of
  Self-Correction of LLMs," arXiv:2406.01297 — https://arxiv.org/abs/2406.01297 (accessed 2026-10-20). The survey
  categorizes research questions, notes that "prior studies often do not define their research questions in detail and
  involve impractical frameworks or unfair evaluations that over-evaluate self-correction," and provides a checklist
  for designing fair experiments [10]. It also identifies tasks "exceptionally favorable for self-correction (e.g.,
  responses are decomposable)" [10].
- **Strength:** `proven` (survey of the field, with a methodology checklist).
- **Fit for vibe-fence:** **This is the governing theorem for the stream.** Three design rules follow:
  (a) *Feedback source* is the design variable, not the pattern name. Name the pattern by its feedback source:
  `check-feedback`, `test-feedback`, `user-feedback`, `no-feedback`. "Self-critique" is not a category.
  (b) If a harness pattern has no external feedback, assume it does not work. That kills ungrounded self-critique,
  role-played reviewers with no commands, and LLM-judge-on-code in one stroke.
  (c) Decomposability is a real exception. Tasks where the output splits into independently checkable parts *can*
  benefit from self-critique — so the fence should structure its outputs to be decomposable (one file, one function,
  one rule per check).

### E-16 — Self-Debugging: "rubber-duck debugging" without human feedback is a *different* mechanism, and it is real

- **Claim:** A model can debug its own code using *execution results it can observe* — running the program and reading
  the output — without a human telling it what is wrong. This is not the "review your code" pattern; the model
  investigates the artefact.
- **Evidence:** Chen, Lin, Schärli & Zhou, "Teaching Large Language Models to Self-Debug," arXiv:2304.05128 —
  https://arxiv.org/abs/2304.05128 (accessed 2026-10-20). The paper demonstrates "that Self-Debugging can teach the
  large language model to perform rubber duck debugging; i.e., without any human feedback on the code correctness or
  error messages, the model is able to identify its mistakes by investigating the execution results and explaining the
  generated code in natural language," achieving state of the art on Spider (text-to-SQL), TransCoder and MBPP; on
  Spider, "where there are no unit tests to verify the correctness of predictions, Self-Debugging with code explanation
  consistently improves the baseline by 2-3%" [13].
- **Strength:** `proven` for code with an executable observation channel; `contested` for reasoning without one.
- **Cost:** Roughly 2–3× (generate, execute, explain, regenerate) — but it can *replace* a failing test-suite run in
  projects that have no tests, and it is far cheaper than a 250-sample sweep.
- **Fit for vibe-fence:** **This is the pattern for the "no tests yet" project**, and it is the answer to "what does
  the fence do before the project has tests?" It needs only that the code can be *run*. Concretely: execute the module,
  capture stdout/stderr/exceptions, feed them back with "investigate this output and explain the failure", regenerate
  once. Note the crucial difference from ungrounded self-critique: **the model is handed an observation, not an
  opinion.** The +2–3% on Spider (no unit tests available) is the honest expected size of this gain.

### E-17 — Constitutional critique: the criteria do the work, and checkable criteria are better than model-scored ones

- **Claim:** Critique against an explicit written constitution is the one form of critique that is both cheap and
  reproducible. The model applies the criteria; it does not invent them.
- **Evidence:** Bai et al., "Constitutional AI: Harmlessness from AI Feedback," arXiv:2212.08073 —
  https://arxiv.org/abs/2212.08073 (accessed 2026-10-20). The method "enlists the help of [AI systems] to supervise
  other AIs," with "the only human oversight … provided through a list of rules or principles," using self-critiques and
  revisions in the supervised phase and AI-feedback RL (RLAIF) in the RL phase, with "chain-of-thought style reasoning
  to improve the human-judged performance and transparency of AI decisions" [14]. The same critique-with-rules pattern
  underpins rubric-based judging in the LLM-as-a-judge literature [15] [16].
- **Strength:** `proven` as a *training* method; `practiced` as an inference-time prompt pattern. **Contested** in the
  specific form "constitution at inference time beats no constitution" — the survey [10] and Huang et al. [9] show
  prompt-only critique without an external signal is unreliable, and a constitution is still a *model-scored* signal
  unless each rule is mechanically checkable.
- **Fit for vibe-fence:** **Make each guardrail a command, not a principle.** This is the concrete form the deepseek
  sibling file argues for and it is right. The difference between a working and a failing constitutional critique is
  whether the rule can be *checked by a program*: "no secrets committed" → `gitleaks detect`; "no dev deps in prod" →
  `npm audit --omit=dev`; "no `.env` in git" → `git ls-files | grep -c '^\.env'`; "accessibility" → `axe`. **A
  constitution that maps to a command needs no model call at all** — it is a static check, runs in milliseconds, and
  cannot be fooled by verbosity bias or position bias. The model is consulted only for the residue the commands cannot
  classify. This is also the cheapest possible quality gate: it is a *linter*, not an *LLM*.

### E-18 — LLM-as-a-judge: ~80% human agreement, three documented biases, and a narrow legal use

- **Claim:** A strong LLM judge agrees with human preferences on over 80% of comparisons — roughly the same agreement
  humans reach with each other. But judges carry **position bias**, **verbosity bias**, and **self-enhancement bias**,
  plus limited reasoning ability.
- **Evidence:** Zheng, Chiang, Sheng, Zhuang, Wu, Zhuang, Lin, Li, Li, Xing, Zhang, Gonzalez & Stoica, "Judging
  LLM-as-a-Judge with MT-Bench and Chatbot Arena," arXiv:2306.05685 — https://arxiv.org/abs/2306.05685 (accessed
  2026-10-20). "we verify the agreement between LLM judges and human preferences … strong LLM judges like GPT-4 can
  match both controlled and crowdsourced human preferences well, achieving over 80% agreement, the same level of
  agreement between humans," based on 3K controlled expert votes and 3K crowdsourced votes [15]. On position bias: when
  two answers swap positions, "the GPT-4 judgement flips, favoring Vicuna's answer" [15]. On verbosity bias: the
  "repetitive list" attack (expand a 5-item answer to 10 items, first 5 rephrased) fools all judged models, though
  GPT-4 "defends significantly better than others" [15]. The 2024 survey (arXiv:2411.15594,
  https://arxiv.org/abs/2411.15594, accessed 2026-10-20) catalogues the reliability strategies and biases and notes
  "ensuring the reliability of LLM-as-a-Judge systems remains a significant challenge requiring careful design and
  standardization" [16]. Separately, a production study of LLM-as-judge for test-coverage evaluation (arXiv:2512.01232,
  https://arxiv.org/abs/2512.01232, accessed 2026-10-20) found that **smaller models can beat larger ones**: GPT-4o mini
  attained the best accuracy (6.07 MAAE) and 96.6% first-attempt completion at **$1.01 per 1K evaluations — a 78× cost
  reduction vs GPT-5 with high reasoning** — while total cost across configurations spanned **175× ($0.45–$78.96 per
  1K)** [37].
- **Strength:** `proven` for human-preference ranking with a strong judge; `contested` for factual or code correctness.
- **Cost:** One extra LLM call per judgment; a tournament over N candidates is O(N log N) judgments, or N for a
  single-pick. The 78× cost spread in [37] is the reason to pin a *small* judge model rather than a frontier one —
  and to note that "reasoning effort" behaves differently across model families: GPT-5 improved with more reasoning while
  **open-weight models degraded across all dimensions as reasoning increased** [37].
- **Fit for vibe-fence:** **Use for prose, never for patches.** Legal uses: ranking two plan phrasings, choosing a
  variable name, picking between two generated explanations. Mandatory mitigations if used: swap positions and average;
  length-control; ≤2 candidates (position bias is the failure mode that scales with candidate count); a written rubric;
  log the decision. Never as the correctness oracle for code — execution beats judging there [5] [7] [4]. And per E-07,
  never run a long judge tournament over many candidates, or you will over-optimize the proxy.

### E-19 — A cheap judge can be better than an expensive one, and "more reasoning" is not always better

- **Claim:** Judge cost and judge quality are not monotonically linked. A small fast model can be more accurate *and*
  100× cheaper than a frontier model at high reasoning effort, and for open-weight models, raising reasoning effort makes
  things worse on every axis.
- **Evidence:** "LLM-as-a-Judge for Scalable Test Coverage Evaluation: Accuracy, Operational Reliability, and Cost,"
  arXiv:2512.01232 — https://arxiv.org/abs/2512.01232 (accessed 2026-10-20). Across 20 model configurations and 500
  evaluations: "smaller models can outperform larger ones: GPT-4o Mini attains the best accuracy (6.07 MAAE), high
  reliability (96.6% ECR@1), and low cost ($1.01 per 1K), yielding a 78x cost reduction vs. GPT-5 (high reasoning)
  while improving accuracy. Reasoning effort is model-family dependent: GPT-5 benefits from increased reasoning …
  whereas open-weight models degrade across all dimensions as reasoning increases. Overall, cost spans 175x
  ($0.45–$78.96 per 1K)" [37]. The paper introduces the **Evaluation Completion Rate (ECR@1)** metric for
  first-attempt reliability, "revealing reliability from 85.4% to 100.0% with material cost implications via retries"
  [37].
- **Strength:** `practiced` — one domain (Gherkin acceptance-test evaluation), 20 configurations, 5 runs each.
- **Fit for vibe-fence:** **Two concrete rules.** (a) Pin a *small* judge model for internal selection tasks. The judge
  is a cost centre, not a product feature. (b) Track **ECR@1 — first-attempt completion rate** for every harness
  sub-step, because a 90% first-attempt rate with retries is materially more expensive than it looks, and a 70% rate
  with retries can be worse than no retry at all. Neither sibling file raises reliability/retries as a cost axis; both
  model cost as a pure token multiplier.

---

## 3. Multi-agent patterns

### E-20 — Mixture-of-Agents: a preference-benchmark win, not a correctness win

- **Claim:** A layered architecture where each layer's agents see all prior-layer outputs, and a final layer
  aggregates, reaches state of the art on **AlpacaEval 2.0, MT-Bench and FLASK** — surpassing GPT-4o. Every one of
  those benchmarks measures *preference* or *quality rating*, not correctness.
- **Evidence:** Wang, Athiwaratkun, Zhang & Zou, "Mixture-of-Agents Enhances Large Language Model Capabilities,"
  arXiv:2406.04692 — https://arxiv.org/abs/2406.04692 (accessed 2026-10-20). "our MoA using only open-source LLMs is
  the leader of AlpacaEval 2.0 by a substantial gap, achieving a score of 65.1% compared to 57.5% by GPT-4 Omni" —
  a **+7.6pp** margin, and **+8.2%** over the previous top model [20]. The paper's own budget analysis: "several
  implementations of MoA can deliver performance comparable to GPT-4 Turbo while being **2× more cost-effective**"
  [20]. A lighter **MoA-Lite** (fewer layers) still beats GPT-4o by **+1.8pp** (57.5% → 59.3%) [20]. The paper also
  reports that on MT-Bench "improvements over individual models … are relatively incremental" [20]. On diversity: the
  aggregation mechanism is "sharing the outputs from the previous layer" and the aggregator consumes all proposer
  outputs [20].
- **Strength:** `proven` for preference benchmarks; **`contested`** for code correctness (not evaluated on any
  execution-based benchmark in the paper). The two sibling files both report the 65.1-vs-57.5 number; neither notes
  that the paper's own MT-Bench result is "relatively incremental" or that the 2× cost-effective configuration exists.
- **Cost:** The canonical configuration (2 layers × 3 proposers + aggregator) is ~7 calls; the paper's budget analysis
  shows the *effective* multiplier depends on the configuration, with the best configuration at **2× more
  cost-effective** than the frontier baseline [20].
- **Fit for vibe-fence:** **Restricted to user-facing prose, and only if the model tier justifies it.** The +7.6pp is
  on the exact axis that matters for a *teaching card* or a *plan narrative* — prose a human reads. It is not evidence
  for anything in the patch path. And note the 2025 finding in E-24: on reasoning models, "simple majority voting
  consistently outperforms … mixture-of-agents frameworks" [46] — so if the underlying model is a reasoning model,
  MoA is likely the *wrong* aggregation. **Do not put MoA in the interactive path.**

### E-21 — Model cascades and early abstention: the cheapest quality-per-dollar lever, and the right shape for a weak model

- **Claim:** For a harness that must work on modest models and cannot afford frontier prices, routing is strictly
  better than one-model-fits-all. A cascade sends easy queries to a small model and escalates hard ones to a large
  one, and allowing the *small* model to abstain early (rather than always running the expensive model) cuts both cost
  and latency.
- **Evidence:** Chen, Romero, Yao, Madaan, Deshpande, Kalyan, Upadhyay, Xiong, Matar, Sanketi, Xue & Zhou, "FrugalGPT:
  How to Use Large Language Models While Reducing Cost and Improving Performance," arXiv:2305.05176 —
  https://arxiv.org/abs/2305.05176 (accessed 2026-10-20). The paper reviews prompt adaptation, LLM approximation and
  LLM cascade strategies and reports that "FrugalGPT can match the performance of the best individual LLM (e.g.
  GPT-4) with up to **98% cost reduction** or improve the accuracy over GPT-4 by **4%** with the same cost" [25].
  Complementing it, "Cost-Saving LLM Cascades with Early Abstention," arXiv:2502.09054 —
  https://arxiv.org/abs/2502.09054 (accessed 2026-10-20): allowing earlier (smaller) models in a cascade to abstain
  anticipates the expensive model's abstention decision, "reduc[es] overall test loss by 2.2% on average across six
  benchmarks (GSM8K, MedMCQA, MMLU, TriviaQA, TruthfulQA…)" while reducing inference cost and latency [26].
- **Strength:** `proven` for the cost/accuracy trade-off (FrugalGPT, multiple LLM tiers, published API pricing);
  `practiced` for early abstention (six benchmarks, one paper).
- **Cost:** The payoff is *negative* cost growth — 98% cost reduction at equal best-model performance [25]. The
  mechanism: the cheap model is right often enough that the expensive model is rarely needed.
- **Fit for vibe-fence:** **This is the right shape for a harness that must work on modest models.** Concretely:
  - **Task routing by risk, not by difficulty alone.** A rename goes to the small model; anything touching auth,
    payments, or data migration goes to the frontier model *and* gets execution verification.
  - **Abstention maps onto the companion's escalation contract.** The harness's "I need your input on this" queue
    item *is* early abstention — the cheap model declines, the expensive one (or the human) answers. That is a 2023
    research finding [26] wearing a UX costume, and it makes the escalation queue cost-justified rather than a nicety.
  - **The 98% figure is the ceiling, not the plan.** Realistically the fence should route the ~80% of tasks that are
    low-risk to a cheap model and reserve the expensive one for the rest, and never use a cheap model as the *sole*
    judge of code [9] [18].

### E-22 — Role-played reviewers: theatre unless each role runs a different check

- **Claim:** "Security reviewer / performance reviewer / accessibility reviewer" personas add value only when each
  persona runs a *different verifiable check*. Otherwise they are one model producing three opinions with correlated
  errors.
- **Evidence:** This is an inference, and it is flagged as such — I found no direct study of role-played code review. It
  follows from three measured results: intrinsic self-correction without external signal degrades accuracy [9]; the
  survey finds no successful self-correction with LLM-generated feedback in general tasks [10]; and debate under
  matched compute does not reliably beat sampling [18]. A 2026 survey of 141 multi-agent-debate studies finds the field
  has converged by convention rather than comparison, with roughly a dozen interacting design decisions per
  configuration, making cross-study comparison unreliable (arXiv:2607.26212,
  https://arxiv.org/abs/2607.26212, accessed 2026-10-20) [19].
- **Strength:** `contested` / inference. No direct paper.
- **Fit for vibe-fence:** **Implement roles as commands, not voices.** `fence audit security` runs the secret scanner and
  dependency audit; `fence audit a11y` runs the axe check. **If a role cannot run a command, delete the role.** This is
  also the cheapest way to make a "reviewer" cheap: a shell command is milliseconds and free.

### E-23 — The 2025 agent-framework studies: what is actually load-bearing in an agent

- **Claim:** Controlled ablations of agent components find that many architecturally-elegant components are
  **redundant**, and that the gains attributed to architecture are frequently gains from evaluation-protocol
  differences or from having more candidates.
- **Evidence:** Zhu et al., "OAgents: An Empirical Study of Building Effective Agents," arXiv:2506.15741 —
  https://arxiv.org/abs/2506.15741 (accessed 2026-10-20). The study's framing is the finding: "current agent research
  practices lack standardization and scientific rigor, making it hard to conduct fair comparisons between methods," and
  "the lack of a standard evaluation protocol makes previous works, even open-sourced ones, non-reproducible, with
  significant variance between random runs" [39]. It identifies planning, memory and tool use as key components, and
  its own Pass@1 vs Pass@3 table shows how much a metric choice alone moves the number: GAIA average **66.67% at
  Pass@1** vs **73.93% at Pass@3** for the same system [39]. Complementing it, "Efficient Agents: Building Effective
  Agents While Reducing Cost," arXiv:2508.02694 — https://arxiv.org/abs/2508.02694 (accessed 2026-10-20): "Efficient
  Agents retains **96.7%** of the performance of OWL … while reducing operational costs from **$0.398 to $0.228**,
  resulting in a **28.4%** improvement in cost-of-pass," using the **cost-of-pass** metric (dollars per successful
  task) [40].
- **Strength:** `proven` (systematic controlled ablations, two papers, GAIA + BrowseComp).
- **Cost:** This is the paper that makes cost a first-class metric rather than a token multiplier.
- **Fit for vibe-fence:** **Adopt cost-of-pass as the harness's own metric.** Not accuracy, not tokens — *dollars per
  successful task*, and (for a user-facing product) *seconds per successful task*. Two direct consequences:
  (a) **any harness pattern that raises accuracy but raises cost-of-pass is a net loss** — this is the exact test to
  apply to every pattern in this document, and it is the test the sibling files never apply;
  (b) **report Pass@1, never Pass@3** in the hackathon demo, or the number will be inflated by the very multi-sample
  mechanism being evaluated. A demo that shows "73.93% at Pass@3" for a system that gets 66.67% at Pass@1 is
  simultaneously overselling the product and hiding its actual elicitation cost.

### E-24 — The reasoning-model-era reversal: complex scaling loses to plain majority voting

- **Claim:** On *reasoning-optimized* models, elaborate inference-time scaling — sequential revision, MoA, best-of-N —
  yields diminishing returns, and **simple majority voting consistently outperforms** them. And a *reasoning floor*
  exists: general-purpose models cannot reach a reasoning-optimized model's accuracy **no matter how much inference
  compute is spent**.
- **Evidence:** Wang, Zhu, Saad-Falcon, Athiwaratkun, Wu, Wang, Song, Zhang & Dhingra, "Rethinking Inference-Time
  Scaling: Efficiency Limits and Linguistic Signals," arXiv:2504.14047 — https://arxiv.org/abs/2504.14047 (accessed
  2026-10-20). The paper "identify[ies] a fundamental limit to this compute-equivalence, the 'reasoning floor', a
  performance plateau that non-reasoning models cannot escape, no matter how much inference compute is spent," and
  "general-purpose models fail to match the accuracy of reasoning-optimized models even with an order of magnitude more
  inference compute" [46]. On method complexity: "the complexity of the scaling method often yields diminishing returns;
  **simple majority voting consistently outperforms sophisticated sequential revision and mixture-of-agents
  frameworks**" [46], and in the results section, "majority voting consistently demonstrates superior performance …
  it outperforms more complex inference-time scaling approaches such as mixture-of-agents, best-of-N, sequential
  revisions and combined parallel sequential" [46]. Even at N=256 samples, general models "fail to bridge the
  performance gap" [46]. A bonus, directly useful finding: a **"Linguistic Signal of Correctness"** — correct responses
  are significantly more concise and have lower density of hedging and thinking markers — usable as a
  "zero-compute proxy for response quality" [46]. Two supporting papers: "Scaling over Scaling," arXiv:2505.20522
  (https://arxiv.org/abs/2505.20522, accessed 2026-10-20) derives saturation points for parallel and sequential
  scaling, showing both "converge to a unified mathematical structure in their upper bounds" [44]; and "When to Vote,
  When to Rewrite," arXiv:2604.26644 (https://arxiv.org/abs/2604.26644, accessed 2026-10-20), finds that **output
  disagreement is a strong proxy for instance difficulty**, and routes instances to lightweight resolution / majority
  voting / rewriting accordingly, "improves accuracy by 3%-7% while reducing sampling cost compared to existing
  approaches" [45].
- **Strength:** `proven` (four tasks including LiveCodeBench; multiple models; both reasoning and non-reasoning).
  This is the single most important finding for a harness shipping in 2026, because it is the *only* one that tests
  against reasoning models.
- **Fit for vibe-fence:** **This is a direct, costed contradiction of the "richer elicitation" thesis on modern
  models.** Three design consequences:
  (a) **Prefer parallel sampling + vote over critique + synthesize.** The elaborate pipelines in the sibling files
  (synthesis prompts, MoA, debate) are *specifically* the thing this paper finds to be dominated by majority voting on
  reasoning models.
  (b) **The "reasoning floor" is a hard constraint on which model vibe-fence should wrap.** The paper's implication
  is blunt: if the wrapped model is not reasoning-optimized, external search will not rescue it. For a harness whose
  value proposition is "safe vibe-coding for non-technical people," the model choice may matter *more* than the harness's
  elicitation logic. **This should be an explicit open question for the hackathon: does Muse Spark behave as a
  reasoning-optimized model?** If it does, majority voting is the pattern. If it does not, the harness cannot manufacture
  reasoning the model lacks, and should invest in execution-grounded verification instead.
  (c) **Adopt disagreement-based routing.** It is the cheapest possible difficulty estimator and it is measured:
  3–7% accuracy improvement *and* reduced sampling cost [45]. The fence can estimate "how hard is this?" from how much
  its own samples disagree — for free, from samples it already has.

### E-25 — The reasoning-model era also breaks the "more thinking is better" intuition

- **Claim:** For large reasoning models, added inference effort has a **counterintuitive non-monotonic** relationship
  with problem difficulty: effort rises with complexity up to a point, then *falls* despite budget remaining — and
  reasoning models can be *worse* than standard models at low complexity under equal compute.
- **Evidence:** Sun et al., "The Illusion of Thinking: Understanding the Strengths and Limitations of Reasoning Models
  via the Lens of Problem Complexity," arXiv:2506.06941 — https://arxiv.org/abs/2506.06941 (accessed 2026-10-20).
  "frontier LRMs face a complete accuracy collapse beyond certain complexities"; they "exhibit a counterintuitive scaling
  limit: their reasoning effort increases with problem complexity up to a point, then declines despite having an adequate
  token budget"; and comparing LRMs to standard LLMs "under equivalent inference compute, we identify three performance
  regimes: (1) low-complexity tasks where standard models surprisingly outperform LRMs, (2) medium-complexity tasks
  where additional thinking in LRMs demonstrates advantage, and (3) high-complexity tasks where both models experience
  complete collapse" [42]. In failure cases, "models completely fail to find correct solutions and fixate on early
  incorrect attempts which leads to wasting the remaining inference token budget" [42].
- **Strength:** `proven` (controllable puzzle environments that isolate complexity while holding logical structure fixed);
  `contested` as generalization to real code, since the benchmarks are puzzles, not repositories.
- **Fit for vibe-fence:** **Escalate on complexity, but do not escalate on a failed attempt alone.** The regime-1 finding
  says a reasoning model can be *worse* than a cheap non-reasoning model on simple tasks — so a harness that reflexively
  "thinks harder" on every failure is paying for a regression on easy items. The failure mode to avoid is the
  fixate-and-burn pattern: a model that has locked onto a wrong hypothesis and spends the remaining budget on it. A fence
  that caps retries at 1–2 and escalates to a human is *protecting* the user from that collapse, not being stingy. This
  connects directly to the companion-UX stream's anti-pattern work: the harness's job is to stop the burning.

---

## 4. Synthesis: "produce 5, critique each, synthesize one"

### E-26 — There is no clean paper for this recipe, and the pieces that *are* measured point in different directions

- **Claim:** "Generate 5 candidates, critique each, synthesize one" is a **prompt-engineering recipe**, not a published
  method with a controlled evaluation. Its two halves have independent and conflicting evidence: the *generate-many* half
  is well-supported [1] [4] [2], and the *LLM-critique-then-synthesize* half is supported only when the critique is
  grounded [9] [10] [16] [13].
- **Evidence:** The synthesis step's closest academic proxy is Universal Self-Consistency [3] (arXiv:2311.17311,
  https://arxiv.org/abs/2311.17311, accessed 2026-10-20), which has the LLM pick the most consistent candidate — and
  which *matches* execution-based voting rather than exceeding it (BIRD-SQL 45.5% USC vs 45.6% SC-Exec; ARCADE 30.1%
  USC vs 29.8–30.3% SC-Exec) [3]. The self-consistency half is Wang et al. [1]. The critique half is contradicted by
  Huang et al. [9] and the survey [10], and constrained by the judge-bias literature [15] [16] [37]. For the
  *practitioner* framing of the same pattern — workflows vs agents, and the explicit advice to "add complexity only when
  it demonstrably improves outcomes" — see Anthropic, "Building effective agents"
  (https://www.anthropic.com/research/building-effective-agents, accessed 2026-10-20), which distinguishes
  prompt-chaining, routing, parallelization (sectioning and voting), orchestrator-workers, and the
  **evaluator-optimizer** workflow, and states of the latter: "particularly effective when we have clear evaluation
  criteria, and when iterative refinement provides measurable value" [43]. Note also that the same source's "Parallelization
  → Voting" example is explicitly code: "Reviewing a piece of code for vulnerabilities, where several different prompts
  review and flag the code if they find a problem" [43].
- **Strength:** `practiced` for the prompt-level recipe; `contested` for its magnitude; `proven` for the two halves
  *separately*, with the critique half conditional on grounding.
- **Cost:** Single-call form ("in one turn, produce 5 then synthesize") ≈ 2–3× output tokens, 1× latency but a longer
  answer; staged form (5 parallel calls → 1 critic → 1 synth) ≈ 7 model calls with growing context. The Gemini sibling
  file's observation that a single-prompt 5-way synthesis of *code* exhausts the output-token window and yields truncated
  code is a plausible mechanism but was not measured in any paper I could find — **flagged as unverified**.
- **Fit for vibe-fence:** **Keep the recipe; change the middle step.** The winning version is
  *"generate 3–5 candidates → **run them** → synthesize from the ones that ran"*. That is the only form where every
  component is independently supported. A pure-LLM synthesis of 5 unexecuted candidates is the naive design the
  evidence warns about. And per E-23, in the demo, report the honest number: the same system at Pass@1 and its
  cost-of-pass.

### E-27 — Where synthesis is safe, and where it is dangerous

- **Claim:** Synthesis (merging) and selection (picking) are different operations with different risk profiles.
  Selecting a validated candidate is safe; merging unvalidated ones manufactures a third thing that was never tested.
- **Evidence:** Structural inference from the measured literature, and flagged as such. The measured facts it rests on:
  gains come from *filtering* (coverage → verified success) not from blending [4] [5] [6]; merging inherits the judge's
  biases [15] [16] [37]; over-optimizing a proxy degrades true quality [8]; and ungrounded critique degrades correct
  answers [9]. I found **no paper that evaluates merging multiple code patches** — this specific claim is untested, and
  I flag it as such rather than dressing it as a finding.
- **Strength:** `contested` — argued from mechanism, not measured.
- **Fit for vibe-fence:** **Synthesize plans; select patches.** Merging three candidate *plan outlines* into one is safe
  because the next step is executed and checked. Merging three candidate *diffs* produces a diff that no candidate
  validated and no test has seen — and given E-05's flaky-test rates, it is very likely to fail in a way the fence
  cannot diagnose. **Patches are selected, never merged.** This is a clean, defensible product rule that falls straight
  out of the evidence.

### E-28 — The cost of the full pipeline: 2N+1 calls, and only the first stage is evidence-backed

- **Claim:** "Ask 5, self-critique, synthesize 1" is three patterns stacked: multi-sample (N×) → critique (N× or 1×) →
  synthesis (1× over N). That is roughly **2N+1 model calls** with growing context per call, i.e. ~11 calls at N=5.
  The measured evidence supports the first stage when a verifier filters it [4] [2]; the second and third stages have
  **no code-specific controlled evidence**, and the one controlled comparison that exists (Huang et al.'s Table 7) shows
  the multi-call variants losing to plain voting at equal call count [9].
- **Evidence:** Cost structure derived from the measured sample budgets and call counts in the cited papers: Wang et al.
  use 40 samples [1]; Adaptive-Consistency uses CodeT's protocol of 100 samples for HumanEval/MBPP and 1000 for
  CodeContests [2]; CodeT is N candidates + M tests + execution [5]; Huang et al. count calls explicitly in their tables
  ("# calls" columns: 1, 3, 5, 6, 9) [9]. No paper evaluates the combined pipeline end-to-end — **this is a stated
  gap, not a finding**.
- **Strength:** `contested` — reasoned from measured components, not measured as a whole.
- **Fit for vibe-fence:** **Do not ship the pipeline as a default.** Ship `1 sample + verify → conditional best-of-4` and
  treat "5 → critique → synthesize" as a premium mode for *planning* only, behind a setting the user never sees.

---

## 5. Cost, latency, and the small-model question

### E-29 — Cost-of-pass is the right metric, and it inverts several common rankings

- **Claim:** Ranking elicitation patterns by accuracy-per-token is misleading. The right metric for an agentic harness
  is **cost-of-pass** — dollars per *successful* task — and secondary to it, **time-to-first-useful-output**. A pattern
  that raises accuracy but raises cost-of-pass is a net loss for a product.
- **Evidence:** "Efficient Agents," arXiv:2508.02694 (https://arxiv.org/abs/2508.02694, accessed 2026-10-20) adopts
  "the cost-of-pass metric" to compare LLM backbone selection, agent framework design, and test-time scaling and
  ensemble strategies, and reports the headline efficiency result: 96.7% of OWL's performance at $0.228 vs $0.398,
  a 28.4% cost-of-pass improvement [40]. The related OAgents study [39] documents that the same system scores 66.67% at
  Pass@1 and 73.93% at Pass@3 [39] — i.e. a 7.3pp "improvement" that is purely a metric choice.
- **Strength:** `proven` as a method; `practiced` for adoption (it is now a standard agent-benchmark metric).
- **Fit for vibe-fence:** **Instrument the harness with cost-of-pass from day one.** Concretely: log tokens, wall-clock
  seconds, and pass/fail per task for every harness sub-step, and expose a single number — "cost per successful task" —
  as the demo's headline metric. A demo that shows "one prompt, five candidates, +18.8pp" without the token count is
  a demo that will not survive a technical judge. **Also track ECR@1** per sub-step [37] because retries silently
  multiply cost.

### E-30 — Parallel fan-out hides latency but not cost — and cost is what a non-technical user ultimately pays

- **Claim:** Running N candidates in parallel makes wall-clock latency ≈ 1 sample, but total token cost is still N×.
  Any claim of "5× latency for a 2% gain" is a *cost* claim dressed as a latency claim.
- **Evidence:** Anthropic's "Building effective agents" (https://www.anthropic.com/research/building-effective-agents,
  accessed 2026-10-20) frames parallelization as the *speed* pattern — "Sectioning: Breaking a task into independent
  subtasks run in parallel" and "Voting: Running the same task multiple times to get diverse outputs" — and frames
  evaluator-optimizer as the *iteration* pattern that adds latency [43]. The measured cost side: MoA's best
  configuration is "2× more cost-effective" than the frontier baseline but still 2× the tokens [20]; the LLM-judge cost
  spread across configurations is **175×** [37]; repeated sampling is N× generation plus verifier cost [4]. The
  latency/parallelism machinery is standard in LLM serving systems — Sarathi-Serve, "Taming Throughput-Latency Tradeoff
  in LLM Inference with Sarathi-Serve," arXiv:2403.02310 (https://arxiv.org/abs/2403.02310, accessed 2026-10-20), which
  "introduces chunked-prefills which splits a prefill request into near equal sized chunks and creates stall-free
  schedules" [47]; and SpecInfer, "Accelerating Generative Large Language Model Serving with Tree-based Speculative
  Inference and Verification," arXiv:2305.09781 (https://arxiv.org/abs/2305.09781, accessed 2026-10-20), which
  "significantly reduces the end-to-end latency and computational requirement for serving generative LLMs" [48] —
  parallel fan-out is an infrastructure fact, not a research
  result, and I cite these only to note that the mechanism is well understood. Separately, SeerSC (arXiv:2511.09345,
  https://arxiv.org/abs/2511.09345, accessed 2026-10-20) shows the *combination* works: using fast System-1 to
  estimate answer entropy, then scaling System-2 in parallel, achieves "up to a 47% reduction in token consumption and a
  43% reduction in inference latency without significant performance loss" [36].
- **Strength:** `proven` for the parallelism/latency mechanism; `practiced` for the cost accounting; `proven` for the
  combined entropy-gated version.
- **Fit for vibe-fence:** **Two rules.** (a) Always fan out in parallel; never serialize N samples. Wall-clock should
  stay ≈ 1 attempt + 1 verification. (b) Since cost is N×, **gate the fan-out on a cheap signal** — the harness's own
  first-attempt failure, or a disagreement/entropy estimate (E-24) [36] [45]. This is the difference between "ask 5,
  always" and "ask 1, escalate to 5 when the evidence says it is hard", and the second is both cheaper and better
  (compute-optimal routing [21], disagreement routing [45], adaptive stopping [2]).

### E-31 — Does the gain transfer to code, and does it hold for small models?

- **Claim:** Two of the three questions that matter most for vibe-fence are only partially answered by the literature,
  and the honest answers are uncomfortable.
- **Evidence — transfer to code:**
  - **Supported:** CodeT (HumanEval 65.8% pass@1, +18.8pp absolute over code-davinci-002) [5]; AlphaCode (top-54.3%
    on Codeforces) [6]; Large Language Monkeys (SWE-bench Lite 15.9% → 56%) [4]; Adaptive-Consistency (17 reasoning
    **and code generation** datasets) [2]; R2E-Gym (51% on SWE-bench Verified, 34.4% pass@1 for a 32B model) [23];
    ThinkCoder (arXiv:2502.17442, https://arxiv.org/abs/2502.17442, accessed 2026-10-20) "improves Pass@1 by 3.0%
    over MapCoder with just 6.4% of the computation cost" [24]; "Thinking Longer, Not Larger" (arXiv:2503.23803,
    https://arxiv.org/abs/2503.23803, accessed 2026-10-20) on scaling test-time compute for SE agents [28].
  - **Not supported / contradicted:** the *critique* half of the pipeline (E-11) [9] [10]; multi-agent debate at equal
    cost (E-12) [9] [18]; MoA on any execution-based benchmark (E-20) [20]; and the *synthesis* half specifically for
    code (E-26) — no controlled evaluation found.
  - **Contaminated:** SWE-bench Verified may measure training recall rather than ability — "Despite both benchmarks
    involving popular open-source Python projects, models performed 3 times better on SWE-Bench-Verified. They were also
    6 times better at finding edited files, without any additional context about the projects themselves" (arXiv:2512.10218,
    https://arxiv.org/abs/2512.10218, accessed 2026-10-20) [41].
- **Evidence — small models:**
  - **Reasoning floor (hard limit):** non-reasoning models cannot reach reasoning-optimized accuracy "even with an order
    of magnitude more inference compute" (E-24) [46].
  - **Self-Refine fails on weak models:** Vicuna-13B "struggles significantly with the refinement process," repeating
    the same output or hallucinating a conversation (E-14) [11].
  - **Intrinsic self-correction is far worse on weak models:** Llama-2 GSM8K **62.0% → 43.5% → 36.5%** under
    self-correction (E-11) [9]. The degradation is much larger than for GPT-4.
  - **But small models can be amplified:** Llemma-7B + tree search > Llemma-34B greedy on MATH [22]; Llama-3-8B +
    more samples > Llama-3-70B at fixed FLOPs on MiniF2F/GSM8K/MATH [4]; R2E-Gym's 32B model reached 34.4% pass@1
    on SWE-bench Verified [23]; a production judge study found GPT-4o mini beat GPT-5-high at 1/78 the cost [37].
  - **Open-weight models degrade with more reasoning effort** [37] — relevant if the harness offers a reasoning dial.
- **Strength:** `proven` for each individual claim above; the *aggregate* verdict is `contested`.
- **Fit for vibe-fence:** **The harness must not depend on a strong model to make its critique work.** Concretely:
  - for a **strong/reasoning model** (Muse Spark?): plain parallel sampling + vote, plus execution-grounded verification
    [46] [4] [21];
  - for a **weak model**: execution-grounded verification only, and **re-sample rather than refine** (Self-Refine's
    Vicuna-13B failure is the direct evidence) [11];
  - for **both**: never let the model judge the model's code [9] [18] [7].
  And because SWE-bench Verified is partly memory [41], **do not use it as vibe-fence's own benchmark** — build a
  small private eval set from the user's own project instead. This matters for the hackathon: an eval on SWE-bench
  Verified would be a contested number, whereas a "before/after on 10 of our own tasks" demo is defensible.

### E-32 — Modern, code-specific test-time scaling: replaying and routing beat naive re-sampling

- **Claim:** The 2025–2026 literature has moved on from "sample N and vote" to *reusing* prior trajectories and
  *routing* compute, because naive re-sampling from scratch is wasteful.
- **Evidence:** "SWE-Replay: Efficient Test-Time Scaling for Software Engineering Agents," arXiv:2601.22129
  (https://arxiv.org/abs/2601.22129, accessed 2026-10-20): "SWE-Replay … consistently outperforms naive scaling,
  **reducing costs by up to 17.4%** while maintaining or even improving performance" on SWE-Bench Verified [34].
  "EGSS: Entropy-guided Stepwise Scaling for Reliable Software Engineering," arXiv:2602.05242
  (https://arxiv.org/abs/2602.05242, accessed 2026-10-20): "EGSS consistently boosts performance by 5-10% across all
  evaluated models," raising Kimi-K2-Instruct from 63.2% to 72.2% and GLM-4.6 from 65.8% to 74.6% on
  SWE-Bench-Verified, "and reduces inference-time token" cost [35]. "Before the Rollout Ends," arXiv:2609.31995
  (https://arxiv.org/abs/2609.31995, accessed 2026-10-20): Contextual Early Reward "improves RM@8 over the strongest
  baseline by 4.2 percentage points on Nemotron 3 Ultra and 2.0 pp on Qwen 3.6 27B; on Nemotron, it takes only
  **15.3% of the tokens** to match the best baseline performance" [38]. A boundary-condition paper worth knowing:
  "Valid Stopping in Adaptive Generator-Verifier Loops," arXiv:2610.06432 (https://arxiv.org/abs/2610.06432, accessed
  2026-10-20) — as a generator searches adaptively against a cheap proxy verifier, "false acceptances may accumulate.
  Proposals can pass the proxy but fail under the costlier ground-truth check," and it gives conformal procedures for
  controlling the false-discovery rate of accepted proposals [27].
- **Strength:** `proven` (SWE-bench Verified, multiple models, cost and quality both measured).
- **Fit for vibe-fence:** **Three adoptable pieces.** (a) **Replay**: keep failed trajectories and branch from the
  informative step instead of re-running from scratch — the fence's retry should resume from the last good state, not
  restart [34]. This is a natural fit for a harness that already keeps a project state directory.
  (b) **Entropy/stepwise routing**: escalate *per step* based on uncertainty, not per task [35]. (c) **A verifier
  hierarchy**: treat the cheap check as a *proxy* and the expensive check as ground truth, and control the false-accept
  rate rather than assuming the cheap check is sound [27] — which pairs exactly with E-05's flakiness data.

### E-33 — What the vibe-coding literature already knows that the harness must not contradict

- **Claim:** The problem statement for vibe-fence is not hypothetical, and the field's own diagnosis points to
  *verification*, not *better prompts*.
- **Evidence:** "Position: Vibe Coding Needs Vibe Reasoning: Improving Vibe Coding with Formal Verification,"
  arXiv:2511.00202 (https://arxiv.org/abs/2511.00202, accessed 2026-10-20): developers report "the accumulation of
  technical debt, security issues, and code churn to achieve satisfactory results," and the authors argue this results
  "from LLMs' inability to reconcile accumulating human-imposed constraints during vibe coding, with developers
  inadvertently failing to resolve contradictions because LLMs prioritize user commands over code consistency." Their
  proposed remedy is a side-car that "autoformalizes specifications, validates against targets, delivers **actionable**
  feedback to the LLM**, and allows intuitive developer influence" [29]. On the security side, SecureVibe (arXiv:2609.38606,
  https://arxiv.org/abs/2609.38606, accessed 2026-10-20) finds that when solutions are functionally correct but insecure,
  "the insecure agent is less than half as likely to conduct effective planning and testing for the hidden security risks
  behind the functional requirements," and reports +6.9pp security pass@1 on BaxBench and +11.5pp on SusVibes from
  training on "verifiable execution feedback" [30]. On the user side, "Exploring Student-AI Interactions in Vibe Coding,"
  arXiv:2507.22614 (https://arxiv.org/abs/2507.22614, accessed 2026-10-20) finds that "the majority of student
  interactions with Replit were to test or debug the prototype and only rarely did students visit code" [31]; and "Vibe
  coding before the trend," arXiv:2605.07751 (https://arxiv.org/abs/2605.07751, accessed 2026-10-20) reports across
  four student cohorts that "non-technical students showed the strongest appreciation for the accessibility these tools
  provide" [32]. The structural reading is sharper still: "Vibe Coding, Interface Flattening" (arXiv:2512.24939,
  https://arxiv.org/abs/2512.24939, accessed 2026-10-20) argues that vibe coding is best understood as *interface
  flattening* — "previously distinct modalities (GUI, CLI, and API) appear to converge into a single conversational
  surface, even as the underlying chain of translation from intention to machinic effect lengthens and thickens," which
  "relocate[s] control and meaning-making power to model and protocol providers" and "obscures responsibility" [33].
- **Strength:** `practiced` / `position` for [29]; `proven` for the SecureVibe measurement [30]; `practiced` for the
  ethnography [31] [32]; `position` for [33].
- **Fit for vibe-fence:** **Three validations of the whole thesis.** (a) The vibe-coding failure mode is *constraint
  reconciliation* — a verification problem, not a generation problem. The fence's job is to hold the constraints, which
  means the fence needs a machine-checkable statement of them. (b) The "insecure agent is less than half as likely to
  conduct effective planning and testing" result is the strongest available argument that **the harness, not the model,
  must supply the testing** — the model's own self-directed testing is unreliable exactly where it matters most
  (security). (c) The user finding — non-technical students *interact to test and debug, and rarely read code* — means
  the fence's verification must be **automatic and invisible** (hence "silent-internal"), because a non-technical user
  will not read the diff and cannot adjudicate candidates. This is independent support for the internal-vs-visible
  decision below. (d) The interface-flattening reading [33] adds a *product* obligation: if the conversational surface
  hides an ever-thickening translation chain, the fence's value is precisely that it is the place where that chain
  becomes *inspectable* — the checks, the failures and the escalations are the re-thickening made visible to a user who
  otherwise cannot see it. The fence is not just a safety layer; it is the **accountability surface** that interface
  flattening removes. That is a stronger product story than "we catch bugs," and it is the story the hackathon should
  tell.

---

## 6. Internal vs visible: which patterns the user should ever see

### E-34 — Run the elicitation silently; surface the evidence, not the candidates

- **Claim:** Showing five candidates transfers the selection problem to the user — the exact thing a companion harness
  exists to prevent. What preserves trust without transferring work is showing *why* the answer won.
- **Evidence:** This is a design proposal grounded in two measured facts. First, the user-side finding: vibe-coding users
  "interact to test or debug the prototype and only rarely did students visit code" [31], and non-technical users are
  the ones who most value the tool's accessibility [32] — they cannot adjudicate code candidates. Second, the
  execution-grounded pattern's own shape: a verified candidate is not a *choice*, it is a *result* [4] [5] [12]. And a
  third, from the agent-UX literature: Anthropic's principles include "Prioritize transparency by explicitly showing
  the agent's planning steps" (https://www.anthropic.com/research/building-effective-agents, accessed 2026-10-20) [43]
  — *planning steps*, not candidate alternatives. Contrast with "Findings: the illusion of thinking" [42]: exposing raw
  reasoning traces to a non-technical user is actively harmful.
- **Strength:** `practiced` / `invent` — the design proposal is mine; the grounding facts are cited.
- **Fit for vibe-fence:** **Internally: sample, execute, select. Externally: one answer, one line of evidence, one
  expand affordance.** The candidate list belongs in the log, never in the chat. Concretely, the fence's user-facing
  line should be a *count*, not a menu: "I tried 4 approaches; 1 passed the tests." That teaches the user the fence's
  value (verification is real) without asking them to verify it.

### E-35 — The one legal exception: expose alternatives when the choice is a preference, not a fact

- **Claim:** When two options are both correct — two layouts, two names, two phrasings — silently picking one is
  overreach. The user's taste is the missing signal, and no amount of sampling supplies it.
- **Evidence:** Inference, and flagged as such. It follows from E-04's asymmetry: in domains without verifiers,
  selection methods "plateau beyond several hundred samples and fail to fully scale with the sample budget" [4] — i.e.
  compute cannot resolve a preference question, because there is no ground truth to compute against. It also follows
  from the same literature's bias catalogue: a judge ranking two options is measuring the judge's biases [15] [16]
  [37] as much as the user's preference. And from the "when to vote, when to rewrite" observation that *disagreement*
  signals difficulty [45] — here, disagreement signals that the answer is preference-bearing, not fact-bearing.
- **Strength:** `invent` — a design proposal, not a measured result.
- **Fit for vibe-fence:** **One `choice` item per run, 2–3 options, a default preselected, and it must be a genuine
  preference fork** (naming, wording, layout, library choice) — never a correctness fork. The deepseek sibling file
  reaches the same conclusion from the same reasoning; the refinement here is that a choice item should be *triggered by
  the fence detecting persistent disagreement across its own samples*, which makes it free rather than an extra call.

---

## 7. Comparative ranking — value per unit of cost for vibe-fence

Ranked by **expected gain per unit of cost and user friction**, not raw benchmark delta. "Verifier" column is the
decisive one: a pattern's value is bounded by the quality of the signal that selects among its candidates.

| Rank | Pattern | Best-measured gain | Cost | Selector | Strength | Verdict for vibe-fence |
|:--:|---|---|---|---|:--:|---|
| **1** | **Deterministic check → retry once on failure** (Reflexion-shaped) | 91% pass@1 vs GPT-4's 80% on HumanEval (cross-model, not a clean ablation) | 1.0× happy path, ~1.4× amortized | execution | `proven` conditional | **SILENT-INTERNAL CORE.** `tsc`/lint/test → feed verbatim error → 1 retry → escalate. Never expose the trace. |
| **2** | **1 sample + verify → conditional best-of-k** (k≤5, parallel) | SWE-bench Lite 15.9% → 56% at 250 samples; small-k portion ≈ log-linear | 1.0–1.2× typical, 4–5× on failure | execution | `proven` | **SILENT-INTERNAL CORE.** First passing candidate wins. Parallel, so latency ≈ 1 attempt. |
| **3** | **Generate the missing test suite** (CodeT-shaped) | CodeT 65.8% pass@1 on HumanEval, +18.8pp absolute over code-davinci-002 | ~2–3× (candidates + tests + execution) | dual execution agreement | `proven` | **SILENT-INTERNAL, HIGHEST LEVERAGE.** A vibe-coded project has no tests; manufacturing the verifier is worth more than more samples. |
| **4** | **Rubric mapped to a command** (constitutional, checkable) | no accuracy delta; the rule runs without a model call | ~0× (a shell command) | deterministic | `practiced` | **SILENT-INTERNAL, CHEAPEST.** "No secrets" → `gitleaks`. Any rule that can't run a command shouldn't exist as a rule. |
| **5** | **Adaptive stopping / disagreement-gated escalation** | 3.3–7.9× sample-budget reduction at <0.1% accuracy cost; +3–7% accuracy at *reduced* sampling cost | **reduces** cost | n/a (controls the others) | `proven` | **SILENT-INTERNAL ENABLER.** This is what makes every other pattern affordable. Ship first. |
| **6** | **Self-consistency on discrete decisions** | GSM8K +17.9%, SVAMP +11.0% (PaLM-540B) | 3–40× | majority vote | `proven` (narrow) | **NARROW.** Only where the answer is a short discrete string. Never for code text. |
| **7** | **USC (LLM-as-selector) where no execution exists** | BIRD-SQL +3.1pp, ARCADE +4.1pp over greedy; *matches* execution voting | 2–3× | LLM consistency | `proven` (matches, not beats) | **CONDITIONAL.** The fallback selector for test-less projects. Modest gains — say so. |
| **8** | **LLM-as-judge for prose** | >80% human agreement; 3 documented biases | 1 call/judgment, 175× spread across models | human preference | `proven` (for preference) | **SILENT-INTERNAL, NARROW.** ≤2 candidates, swap-and-average, small judge model, prose only. **Never a patch gate.** |
| **9** | **Reflexion-style reflection persisted across sessions** | (part of #1's gain) | ~0 marginal | execution + memory | `practiced` | **SILENT-INTERNAL, COMPOUNDING.** Store lessons per project/error signature. |
| **10** | **MoA / layered aggregation** | AlpacaEval 2.0 65.1% vs 57.5% (+7.6pp) — *preference only*; 2× cost-effective config | 2–7× | aggregator | `proven` (preference) / `contested` (correctness) | **QUEUE ONLY.** Teaching-card prose. **Not** on a reasoning model — majority voting dominates there. |
| **11** | **Ungrounded self-critique / Self-Refine** | claimed ~+20% avg; measured **−0.8pp to −25.5pp** without ground truth; Llama-2 −25.5pp | 3–7×, sequential | model's own opinion | `contested` / actively harmful | **FORBID.** No skill text may say "review your own work". |
| **12** | **Multi-agent debate** | Du et al. +5–10pp at their settings; **83.0% vs 88.2%** vs self-consistency at 9 responses | 9 calls, non-parallelizable | majority vote | `contested` / dominated | **AVOID.** Implement as parallel sampling + vote if you want the selection effect. |
| **13** | **Full "5 → critique → synthesize" pipeline** | no code-specific controlled measurement exists | ~2N+1 calls (≈11 at N=5) | mixed | `contested` | **AVOID as default.** Planning only, behind a hidden premium mode. |

**Cost ordering, cheapest first:** deterministic checks (≈0×) → adaptive stopping (reduces cost) → 1-sample+verify
(1.0–1.2×) → execution-based best-of-k (4–5× on failure only) → LLM judge (1 call) → USC (2–3×) → Self-Refine
(3–7×, sequential) → debate (9 calls, non-parallel) → MoA (2–7×, layered).

**The ranking's single most important inversion vs both sibling files:** multi-agent debate is not merely "expensive,
so avoid" — it is **dominated at equal cost by plain majority voting** [9] [18] [46]. And the single most important
inversion vs the naive "richer elicitation" thesis: on reasoning models, **plain majority voting beats MoA, best-of-N and
sequential revision** [46]. The harness should get its quality from *the verifier*, not from *the architecture*.

---

## 8. Gaps / unknowns

1. **No study evaluates elicitation patterns on a coding agent with tools, end-to-end, at matched dollar cost.** Every
   strong number is either single-turn code generation (CodeT [5], AlphaCode [6]) or agentic sampling with a test filter
   (Monkeys [4], R2E-Gym [23]). Nobody has measured "1 sample + agent loop" vs "4 samples + agent loop" at equal cost.
2. **The "ask 5, self-critique, synthesize 1" recipe has no controlled evaluation of its own.** I found no paper
   measuring the full pipeline against single-pass on a code task. E-26 and E-28 are reasoned from components, and I
   label them as such rather than claiming measured magnitudes.
3. **Whether the gains transfer to reasoning models is only partly answered.** E-24 [46] is the best evidence and it
   favours *simpler* methods, but it was measured on math/AIME/GPQA/LiveCodeBench with specific model families, not on
   the Muse Spark class of model, and not on non-technical users' projects.
4. **The "reasoning floor" has a direct product implication nobody has costed:** if the wrapped model is not
   reasoning-optimized, external search cannot substitute for it. The interaction between "which model vibe-fence wraps"
   and "how much elicitation it does" is unstudied for consumer harnesses.
5. **Verifier quality in real vibe-coded projects is unknown.** The 11.3% flaky-test rate [4] and <20% distinguishability
   [23] are measured on curated benchmarks. A hobby project with no tests, a homomorphic dev server, and an
   LLM-written test suite will have *worse* verifier quality, and no paper measures that.
6. **Latency tolerance for non-technical users is unmeasured.** The "seconds per successful task" framing is my
   proposal; there is no user study of agentic-coding latency tolerance. I did not find one and I am not going to
   fabricate its existence.
7. **Patch synthesis is untested in the literature.** My prohibition (E-27) is argued from mechanism, not measured.
8. **The single-call 5-way synthesis truncating code outputs** (claimed by the Gemini sibling file) is a plausible
   mechanism but I found no measurement. Flagged as unverified.
9. **Whether surfacing "3 of 4 candidates passed" builds or erodes user trust is untested.** E-34's evidence-display
   proposal is a design inference.
10. **SWE-bench Verified is partly a memory benchmark** [41]. Any harness comparison using it — including the ones
    cited here — inherits that contamination. vibe-fence needs its own eval set on the user's real project.

---

## 9. Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| 1 | Wang, Wei, Schuurmans, Le, Chi, Narang, Chowdhery & Zhou, "Self-Consistency Improves Chain of Thought Reasoning in Language Models," arXiv:2203.11171 — https://arxiv.org/abs/2203.11171 | paper (ICLR 2023) | 2026-10-20 |
| 2 | Aggarwal, Madaan et al., "Let's Sample Step by Step: Adaptive-Consistency for Efficient Reasoning and Coding with LLMs," arXiv:2305.11860 — https://arxiv.org/abs/2305.11860 | paper | 2026-10-20 |
| 3 | Chen, Aksitov, Alon, Ren, Xiao, Cheng, Choi, Weng, Liu, Yang & Chen, "Universal Self-Consistency for Large Language Model Generation," arXiv:2311.17311 — https://arxiv.org/abs/2311.17311 | paper (ICML 2024) | 2026-10-20 |
| 4 | Brown, Juravsky, Ehrlich, Clark, Le, Ré & Mirhoseini, "Large Language Monkeys: Scaling Inference Compute with Repeated Sampling," arXiv:2407.21787 — https://arxiv.org/abs/2407.21787 | paper | 2026-10-20 |
| 5 | Chen, Zhang, Nguyen, Zan, Lin, Lou & Chen, "CodeT: Code Generation with Generated Tests," arXiv:2207.10397 — https://arxiv.org/abs/2207.10397 | paper (ICLR 2023) | 2026-10-20 |
| 6 | Li, Yu, Tian, Wang, Wu, Wang & Yang, "Competition-Level Code Generation with AlphaCode," arXiv:2203.07814 — https://arxiv.org/abs/2203.07814 | paper (Science 2022) | 2026-10-20 |
| 7 | Zhang et al., "Generative Verifiers: Reward Modeling as Next-Token Prediction," arXiv:2408.15240 — https://arxiv.org/abs/2408.15240 | paper (TMLR 2025) | 2026-10-20 |
| 8 | Gao, Schulman & Hilton, "Scaling Laws for Reward Model Overoptimization," arXiv:2210.10760 — https://arxiv.org/abs/2210.10760 | paper (ICLR 2023) | 2026-10-20 |
| 9 | Huang, Chen, Mishra, Zheng, Yu, Song & Zhou, "Large Language Models Cannot Self-Correct Reasoning Yet," arXiv:2310.01798 — https://arxiv.org/abs/2310.01798 | paper (ICLR 2024) | 2026-10-20 |
| 10 | Kamoi, Feng, Huang et al., "When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey of Self-Correction of LLMs," arXiv:2406.01297 — https://arxiv.org/abs/2406.01297 | paper (survey) | 2026-10-20 |
| 11 | Madaan, Gupta, Rafailov, Bordes, Singh & Li, "Self-Refine: Iterative Refinement with Self-Feedback," arXiv:2303.17651 — https://arxiv.org/abs/2303.17651 | paper (NeurIPS 2023) | 2026-10-20 |
| 12 | Shinn, Cassano, Berman, Gopinath, Narasimhan & Yao, "Reflexion: Language Agents with Verbal Reinforcement Learning," arXiv:2303.11366 — https://arxiv.org/abs/2303.11366 | paper (NeurIPS 2023) | 2026-10-20 |
| 13 | Chen, Lin, Schärli & Zhou, "Teaching Large Language Models to Self-Debug," arXiv:2304.05128 — https://arxiv.org/abs/2304.05128 | paper (ICLR 2024) | 2026-10-20 |
| 14 | Bai et al., "Constitutional AI: Harmlessness from AI Feedback," arXiv:2212.08073 — https://arxiv.org/abs/2212.08073 | paper | 2026-10-20 |
| 15 | Zheng, Chiang, Sheng, Zhuang, Wu, Zhuang, Lin, Li, Li, Xing, Zhang, Gonzalez & Stoica, "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena," arXiv:2306.05685 — https://arxiv.org/abs/2306.05685 | paper (NeurIPS 2023) | 2026-10-20 |
| 16 | Gu, Liu, Wang et al., "A Survey on LLM-as-a-Judge," arXiv:2411.15594 — https://arxiv.org/abs/2411.15594 | paper (survey) | 2026-10-20 |
| 17 | Du, Li, Torralba, Tenenbaum & Mordatch, "Improving Factuality and Reasoning in Language Models through Multiagent Debate," arXiv:2305.14325 — https://arxiv.org/abs/2305.14325 | paper (ICML 2024) | 2026-10-20 |
| 18 | Smit et al., "Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs," arXiv:2311.17371 — https://arxiv.org/abs/2311.17371 | paper | 2026-10-20 |
| 19 | "Multi-Agent Debate Strategies: Survey, Taxonomy, and Challenges," arXiv:2607.26212 — https://arxiv.org/abs/2607.26212 | paper (survey, 141 studies) | 2026-10-20 |
| 20 | Wang, Athiwaratkun, Zhang & Zou, "Mixture-of-Agents Enhances Large Language Model Capabilities," arXiv:2406.04692 — https://arxiv.org/abs/2406.04692 | paper | 2026-10-20 |
| 21 | Snell, Lee, Xu & Kumar, "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters," arXiv:2408.03314 — https://arxiv.org/abs/2408.03314 | paper | 2026-10-20 |
| 22 | Wu, Wang, Zhuang et al., "Inference Scaling Laws: An Empirical Analysis of Compute-Optimal Inference," arXiv:2408.00724 — https://arxiv.org/abs/2408.00724 | paper | 2026-10-20 |
| 23 | "R2E-Gym: Procedural Environments and Hybrid Verifiers for Scaling Open-Weights SWE Agents," arXiv:2504.07164 — https://arxiv.org/abs/2504.07164 | paper | 2026-10-20 |
| 24 | "Thinking Before Running! Efficient Code Generation with Thorough Exploration and Optimal Refinement (ThinkCoder)," arXiv:2502.17442 — https://arxiv.org/abs/2502.17442 | paper | 2026-10-20 |
| 25 | Chen, Romero, Yao, Madaan, Deshpande, Kalyan, Upadhyay, Xiong, Matar, Sanketi, Xue & Zhou, "FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance," arXiv:2305.05176 — https://arxiv.org/abs/2305.05176 | paper | 2026-10-20 |
| 26 | "Cost-Saving LLM Cascades with Early Abstention," arXiv:2502.09054 — https://arxiv.org/abs/2502.09054 | paper | 2026-10-20 |
| 27 | "Valid Stopping in Adaptive Generator-Verifier Loops," arXiv:2610.06432 — https://arxiv.org/abs/2610.06432 | paper | 2026-10-20 |
| 28 | "Thinking Longer, Not Larger: Enhancing Software Engineering Agents via Scaling Test-Time Compute," arXiv:2503.23803 — https://arxiv.org/abs/2503.23803 | paper | 2026-10-20 |
| 29 | "Position: Vibe Coding Needs Vibe Reasoning: Improving Vibe Coding with Formal Verification," arXiv:2511.00202 — https://arxiv.org/abs/2511.00202 | position paper | 2026-10-20 |
| 30 | "SecureVibe: Making Vibe Coding More Secure," arXiv:2609.38606 — https://arxiv.org/abs/2609.38606 | paper | 2026-10-20 |
| 31 | "Exploring Student-AI Interactions in Vibe Coding," arXiv:2507.22614 — https://arxiv.org/abs/2507.22614 | paper (ethnography) | 2026-10-20 |
| 32 | "Vibe coding before the trend," arXiv:2605.07751 — https://arxiv.org/abs/2605.07751 | paper (practitioner report) | 2026-10-20 |
| 33 | "Vibe Coding, Interface Flattening," arXiv:2512.24939 — https://arxiv.org/abs/2512.24939 | paper | 2026-10-20 |
| 34 | "SWE-Replay: Efficient Test-Time Scaling for Software Engineering Agents," arXiv:2601.22129 — https://arxiv.org/abs/2601.22129 | paper | 2026-10-20 |
| 35 | "EGSS: Entropy-guided Stepwise Scaling for Reliable Software Engineering," arXiv:2602.05242 — https://arxiv.org/abs/2602.05242 | paper | 2026-10-20 |
| 36 | "Seer Self-Consistency: Advance Budget Estimation for Adaptive Test-Time Scaling," arXiv:2511.09345 — https://arxiv.org/abs/2511.09345 | paper | 2026-10-20 |
| 37 | "LLM-as-a-Judge for Scalable Test Coverage Evaluation: Accuracy, Operational Reliability, and Cost," arXiv:2512.01232 — https://arxiv.org/abs/2512.01232 | paper | 2026-10-20 |
| 38 | "Before the Rollout Ends: Early Terminal Reward Prediction for Long-horizon Coding Agents," arXiv:2609.31995 — https://arxiv.org/abs/2609.31995 | paper | 2026-10-20 |
| 39 | Zhu et al., "OAgents: An Empirical Study of Building Effective Agents," arXiv:2506.15741 — https://arxiv.org/abs/2506.15741 | paper | 2026-10-20 |
| 40 | "Efficient Agents: Building Effective Agents While Reducing Cost," arXiv:2508.02694 — https://arxiv.org/abs/2508.02694 | paper | 2026-10-20 |
| 41 | "Does SWE-Bench-Verified Test Agent Ability or Model Memory?," arXiv:2512.10218 — https://arxiv.org/abs/2512.10218 | paper | 2026-10-20 |
| 42 | Sun et al., "The Illusion of Thinking: Understanding the Strengths and Limitations of Reasoning Models via the Lens of Problem Complexity," arXiv:2506.06941 — https://arxiv.org/abs/2506.06941 | paper | 2026-10-20 |
| 43 | Anthropic, "Building effective agents" — https://www.anthropic.com/research/building-effective-agents | industry research | 2026-10-20 |
| 44 | "Scaling over Scaling: Exploring Test-Time Scaling Plateau in Large Reasoning Models," arXiv:2505.20522 — https://arxiv.org/abs/2505.20522 | paper | 2026-10-20 |
| 45 | "When to Vote, When to Rewrite: Disagreement-Guided Strategy Routing for Test-Time Scaling," arXiv:2604.26644 — https://arxiv.org/abs/2604.26644 | paper | 2026-10-20 |
| 46 | Wang, Zhu, Saad-Falcon, Athiwaratkun, Wu, Wang, Song, Zhang & Dhingra, "Rethinking Inference-Time Scaling: Efficiency Limits and Linguistic Signals," arXiv:2504.14047 — https://arxiv.org/abs/2504.14047 | paper | 2026-10-20 |
| 47 | Agrawal et al., "Taming Throughput-Latency Tradeoff in LLM Inference with Sarathi-Serve," arXiv:2403.02310 — https://arxiv.org/abs/2403.02310 | paper (systems) | 2026-10-20 |
| 48 | Miao et al., "SpecInfer: Accelerating Generative Large Language Model Serving with Tree-based Speculative Inference and Verification," arXiv:2305.09781 — https://arxiv.org/abs/2305.09781 | paper (systems) | 2026-10-20 |

---

## 10. Implications for vibe-fence

**Copy — the harness's quality comes from the verifier, not the architecture**

1. **Ship `1 sample → verify → conditional best-of-k (k≤5, parallel) → first pass wins` as the core loop.** This is the
   only pattern with a large, code-specific, measured gain (SWE-bench Lite 15.9% → 56% [4]) and it is parallel, so
   wall-clock stays ≈ one attempt. Do not sample eagerly; escalate only on failure. [E-04, E-30]
2. **Make the fence a *filter*, and ship a first-class way to create the filter.** A vibe-coded project has no tests.
   "Ask the model to also write the test" (CodeT [5]) plus dual execution agreement is the highest-leverage thing the
   harness can do — worth more than any number of extra samples. A fence that can verify beats a fence that can sample.
   [E-05, E-08, E-09]
3. **Adopt adaptive stopping and disagreement-gated escalation as the cost control.** Budget reductions of 3.3–7.9× at
   <0.1% accuracy cost [2], and +3–7% accuracy at *reduced* sampling cost via disagreement routing [45]. The harness's
   own sample disagreement is a free difficulty estimator. [E-02, E-24, E-30]
4. **Implement every guardrail as a command, not a principle.** "No secrets" → `gitleaks`; "no dev deps in prod" →
   `npm audit --omit=dev`; "no `.env` in git" → `git ls-files`. A rule that cannot run a command is not a rule — it is
   a model call, and model calls are slow, expensive and biased. The model is consulted only for the residue. [E-17]
5. **Retries should replay, not restart.** Branch from the last informative step of a failed trajectory (SWE-Replay:
   up to 17.4% cost reduction at equal-or-better performance [34]) and cap escalation at 1–2 attempts, then escalate to
   a human. The cap protects the user from the fixate-and-burn failure mode documented in [42]. [E-25, E-32]
6. **Instrument cost-of-pass from day one.** Dollars (and seconds) per *successful* task, not accuracy and not tokens
   [40]. Track ECR@1 per sub-step because retries silently multiply cost [37]. Report Pass@1, never Pass@3 — the same
   system scores 66.67% vs 73.93% depending on the metric [39]. [E-23, E-29]

**Avoid — the patterns the evidence says do not work**

7. **Never ship unaided self-critique ("review your own code and fix bugs").** Intrinsic self-correction *degrades*
   reasoning: GPT-3.5 GSM8K 75.9% → 74.7%, CommonSenseQA 75.8% → 41.8%, and **Llama-2 62.0% → 36.5%** [9]. The
   survey verdict is that no prior work shows successful self-correction with LLM-generated feedback in general tasks
   [10]. No skill text may contain the phrase. Every critique must carry a tool signal or a written rubric. [E-11, E-14, E-15]
8. **Never let an LLM judge gate a patch.** Selector ranking: execution > type-check > lint > learned verifier > LLM
   judge. Best-of-N against a weak proxy actively degrades true quality [8]; judges carry position, verbosity and
   self-enhancement bias [15]; and the 175× cost spread across judge configurations [37] means the "best" judge is
   usually a bad economic decision. If a judge is used: ≤2 candidates, swap-and-average, length-control, small judge
   model, prose only, advisory only. [E-06, E-07, E-18, E-19]
9. **Drop multi-agent debate.** At equal response count it *loses* to plain majority voting (GSM8K 83.0% debate vs 88.2%
   self-consistency at 9 responses) [9], independent replication agrees [18], and on reasoning models majority voting
   beats MoA/best-of-N/sequential revision outright [46]. If you want the selection effect, implement parallel sampling +
   vote — same benefit, a third of the latency, parallelizable. [E-12, E-24]
10. **Do not put MoA in the interactive path, and skip it entirely on a reasoning model.** Its +7.6pp is on AlpacaEval
    (preference), not correctness [20]; its own MT-Bench result is "relatively incremental" [20]; and it is one of the
    methods majority voting dominates [46]. Reserve layered aggregation for queued, user-facing prose (teaching cards,
    plan narratives) and only if the model tier justifies it. [E-20, E-24]
11. **Synthesize plans; select patches.** Merging candidate diffs produces code no candidate validated and no test has
    seen, in a world where 11.3% of test suites are flaky [4]. Patches are picked, never blended. [E-05, E-27]
12. **Do not use SWE-bench Verified as vibe-fence's benchmark.** Models are 3× better at localizing files on
    SWE-Bench-Verified than on comparable benchmarks, and 6× better without any project context — indicating the
    benchmark partly measures training recall [41]. Build a private eval set from real user projects and report
    cost-of-pass on it. [E-31, E-23]

**Invent — product primitives the papers imply but do not ship**

13. **`.fence/check` — the silent verification circuit.** Intercept every write: run the cheapest deterministic oracles
    (types → lint → tests) silently; if green, commit with **zero** added latency; if red, inject the compact error
    trace plus one instruction, retry **once** in parallel; hard circuit-breaker at 1–2 retries → queue as a structured
    `issue → fix → plan` item the agent resolves itself, surfaced as one friendly notice. Never show the raw trace.
    This is the highest-value primitive in the document. [E-13, E-32, E-34]
14. **`.fence/verifier` — the verifier stack with a trust ladder.** Not one check but an ordered ladder: (1) does it
    compile/typecheck, (2) does lint pass, (3) do tests pass **twice** (flakiness detector — 11.3% of suites are flaky
    [4]), (4) do generated tests agree across candidates (dual execution agreement [5]), (5) only then, an optional
    LLM judge for prose. Each rung records its verdict, so the user can see *how* something was verified. [E-05, E-08, E-18]
15. **`.fence/escalate` — cost-gated elicitation, driven by disagreement rather than a fixed N.** Encode the
    compute-optimal policy: estimate difficulty from the harness's own sample disagreement [45] and the risk tag
    (auth / payments / data migration / unknown file), then choose: greedy+verify (trivial) → 3-candidate parallel + verify
    (planning) → best-of-5 + verify (risky pure function with tests) → escalate to human (failed twice). Hard rule:
    **never spend >3× tokens without a verifier**; on a happy path the whole budget stays ≈1.0–1.2×. [E-04, E-10, E-22, E-29, E-30]
16. **`.fence/lessons` — persist reflections across sessions.** Store failed attempts keyed by project + error
    signature in `.fence/state/lessons.json` and inject the relevant lesson into the next attempt. This is the cheapest
    visible form of companion behaviour and it compounds; it also implements SWE-Replay-style trajectory reuse
    at the project level. [E-13, E-32]
17. **A "one line of evidence" user contract.** Never show candidates; show a count — "4 attempts, 1 passed the tests" —
    plus one expand affordance for the curious. Reserve candidate display for genuine preference forks (naming, layout,
    wording), at most one per run, 2–3 options, default preselected, triggered by persistent sample disagreement so it
    costs nothing extra. [E-34, E-35]
18. **A model-tier switch in the harness config.** Because of the reasoning floor [46], the harness's elicitation
    strategy must depend on the wrapped model: **reasoning model** → parallel sampling + vote + execution verify;
    **non-reasoning model** → execution verify + **re-sample** (never refine — Self-Refine collapses on weak models
    [11]) + consider a small-model cascade for cheap subtasks (FrugalGPT [25], early-abstention cascades [26], and
    the 78× judge-cost spread [37] all point the same way). This is the one place where "which model does vibe-fence
    wrap" is a *harness architecture* question, not a procurement question. **Flag for the hackathon: determine whether
    Muse Spark is reasoning-optimized before locking the elicitation design.** [E-01, E-14, E-24, E-31]
19. **Instrument for the demo's headline number: "cost per successful task."** Build a 10-task private eval set (real
    tasks, real repos), run single-pass vs fence-enabled, and report accuracy **and** dollars **and** seconds side by
    side. The OAgents Pass@1-vs-Pass@3 gap [39] is the cautionary tale: a number without its cost and its metric
    definition is a marketing claim, and a technical judge will say so. [E-23, E-29]
