<!-- Converted from 03-LLM Coding Agent Patterns.docx on 2026-10-20 via zip/w:t extraction -->

Elicitation and Synthesis Architectures Beyond Single-Pass Generation in LLM Coding and Agent Harnesses

The prevailing assumption in early generative software engineering held that scaling inference-time compute—whether by prompting a model to iteratively critique its own output, spawning multi-agent debate panels, or granting an autonomous agent an unconstrained bash shell—reliably outperforms a single-pass generation. Empirical evaluations across program synthesis, repository-level issue resolution, and long-horizon application harnesses refute this naive hypothesis1. Multi-pass elicitation and synthesis patterns genuinely beat single-pass execution only when each additional inference pass introduces new, orthogonal information: either an external deterministic verification signal (compiler diagnostics, unit test execution, symbolic validation, or live DOM inspection), a structural compression of the search space (hierarchical AST localization or PageRank repository mapping), or uncorrelated model diversity (cross-architecture ensembling and clean-slate adversarial evaluation)1. Conversely, when multi-pass loops rely purely on a single model's internal representations to critique, debate, or summarize its own prior context without external grounding, performance systematically stagnates or degrades due to intrinsic self-correction blindness, sycophantic consensus collapse, reward hacking, and context rot3.

The Intrinsic Self-Correction Fallacy Versus Grounded Extrinsic Loops

The foundational dividing line separating effective multi-pass patterns from counterproductive token expenditure is the presence of an external ground-truth oracle or deterministic environment signal during the feedback loop3. When a language model is prompted to review, critique, and refine its own initial output using solely its internal parametric knowledge—a regime defined by Huang et al. (2023, arXiv:2310.01798) as intrinsic self-correction—the model fails to improve on objective deductive tasks and frequently corrupts initially valid solutions3.

Mechanics of Intrinsic Self-Correction Failure

The failure of ungrounded iterative refinement stems from a fundamental asymmetry: if a language model already possesses the internal discrimination capacity to recognize a logical flaw in its initial generation within the same prompt distribution, its decoding policy would generally have avoided the error on the first pass11. When forced by a critique prompt (&quot;Review your previous answer and find problems with your answer&quot;) to re-evaluate an output without new external evidence, the model interprets the instruction as an implicit prior that the initial answer is wrong, inducing wavering and self-doubt3. Empirical measurements by Huang et al. demonstrate that across GSM8K, CommonSenseQA, and HotpotQA, ungrounded self-correction consistently lowers accuracy while multiplying inference cost three-fold after one correction round (3 model calls) and five-fold after two correction rounds (5 model calls)3. Specifically, GPT-4 accuracy on GSM8K drops from a single-pass baseline of 95.5% to 91.5% in Round 1 and 89.0% in Round 2 (-6.5 percentage points), while CommonSenseQA falls from 82.0% to 79.5% in Round 1 and 80.0% in Round 2, and HotpotQA holds at 49.0% in Round 1 before dropping to 43.0% in Round 23. GPT-3.5 exhibits even sharper vulnerability to critique-induced wavering, declining on GSM8K from 75.9% (1 call) to 75.1% (Round 1) and 74.7% (Round 2), collapsing on CommonSenseQA from 75.8% to 38.1% in Round 1 and 41.8% in Round 2, and slipping on HotpotQA from 26.0% to 25.0% across both rounds3. Even when feedback prompts are carefully softened to ask whether the answer is correct before requesting changes (&quot;Verify whether your answer is correct, and provide an explanation&quot;), GPT-3.5 still degrades from 75.9% to 75.4%–75.5% in Round 1 and 74.4%–75.4% in Round 2 on GSM8K3.

This pathology extends directly to automated planning and constraint satisfaction. Valmeekam et al. (2023, arXiv:2310.08118) and Stechly et al. (2023, arXiv:2310.12397) demonstrate that iterative self-critiquing loops on Blocksworld planning and Graph Coloring fail to yield genuine improvement, regardless of whether the self-feedback is binary or detailed13. Similarly, Madaan et al. (2023, arXiv:2303.17651) show that the Self-Refine architecture—which cycles between a FEEDBACK module and a REFINE module using a single frozen LLM—produces negligible gains on mathematical deduction (GSM8K) and fails entirely on smaller models such as Vicuna-13B that cannot generate accurate critiques15. Where Self-Refine does beat single-pass generation is in multi-constraint stylistic, creative, sentiment transfer, acronym generation, dialogue, or code-readability tasks, where the initial prompt under-specifies secondary preferences and the critique step acts as a sequential rubric check rather than a logical error detector15. Furthermore, as Huang et al. note, many early claims of intrinsic self-correction were methodological artifacts caused either by comparing a deliberately weak initial prompt against a detailed refinement prompt, or by leaking ground-truth oracle labels into the stopping criterion so the loop halted only when a correct answer was randomly sampled3.



Elicitation Pattern &amp; Study

Verification Signal Type

Target Benchmark / Domain

Base / Single-Pass Performance

Multi-Pass Performance (Round 1 / Round 2 or Final)

Compute Multiplier / Cost Impact

Primary Mechanism of Outcome

Intrinsic Self-Correction (Huang et al., arXiv:2310.01798)3

None (Internal LLM self-critique only)

GSM8K / CommonSenseQA / HotpotQA (GPT-4)

95.5% / 82.0% / 49.0%

R1: 91.5% / 79.5% / 49.0%; R2: 89.0% / 80.0% / 43.0%

(R1) to  (R2) LLM calls

Model converts valid answers to flawed ones under critique pressure3

Intrinsic Self-Correction (Huang et al., arXiv:2310.01798)3

None (Internal LLM self-critique only)

GSM8K / CommonSenseQA / HotpotQA (GPT-3.5)

75.9% / 75.8% / 26.0%

R1: 75.1% / 38.1% / 25.0%; R2: 74.7% / 41.8% / 25.0%

(R1) to  (R2) LLM calls

Severe sycophantic wavering when challenged by critique prompt3

Self-Refine (Madaan et al., arXiv:2303.17651)15

Internal rubric-guided feedback

7 tasks (Dialogue, Code Readability, PIE, GSM8K)

Base GPT-3.5 / GPT-4 single-shot

Significant gains on preference/style; ~0% on GSM8K

– iterations

Decomposes multi-objective stylistic constraints; bounded by critique accuracy15

CRITIC (Gou et al., 2023)12

External Python interpreter &amp; search tools

Program-of-Thought (PoT) math &amp; QA

Erroneous initial PoT samples

32.2% overall error reduction (57.4% output, 35.3% syntax)

Multi-turn tool execution

Catches runtime/syntax and extreme-value errors; weak (26.7%) on pure logic flaws17

Reflexion (Shinn et al., arXiv:2303.11366)6

Self-generated unit tests &amp; environment heuristics

HumanEval (Py / Rust), MBPP Rust, LeetCode Hard, ALFWorld

80.1% (Py), 60% (Rust), 71% (MBPP), 7.5% (LC), ~75% (ALF)

91.0% (Py), 68% (Rust), 75% (MBPP), 15% (LC), 97.0% (130/134 ALF)

2–12 episodic trials (memory capped at 1–3)

Amplifies sparse binary execution failures into natural-language &quot;semantic gradients&quot;6

LLM+P / PDDL Synthesis (arXiv:2305.14909; TIC arXiv:2503.18971)19

External PDDL Validator (VAL) &amp; Fast Downward Solver

Household &amp; Logistics Planning Domains

48% / 33% (LLM backprompted by VAL)

95% / 100% (LLM PDDL model + Fast Downward)

Up to 8 VAL feedback turns + solver run

Offloads combinatorial search to sound symbolic solver while LLM translates domain19

Verbal Reinforcement Learning and Symbolic Offloading

The narrative reverses completely when the elicitation loop incorporates an external verification oracle. In the CRITIC framework (Gou et al., 2023), coupling an LLM with a Python interpreter and search engine reduces initial Program-of-Thought errors in non-oracle settings by 32.2% overall17. Error taxonomy analysis reveals why: whereas intrinsic logic errors (such as misinterpreting a problem condition, accounting for 77.4% of initial errors) are corrected only 26.7% of the time, errors that trigger concrete external signals—such as unreasonable numerical outputs (16.8% of initial errors) and syntax or runtime exceptions (5.8% of initial errors)—are corrected at rates of 57.4% and 35.3%, respectively17.

Shinn et al. (2023, arXiv:2303.11366) formalize this principle in Reflexion, which parameterizes an agent's policy as , keeping the LLM weights frozen while updating a bounded episodic memory buffer (, restricted to the 1 to 3 most recent reflections to prevent context bloat)6. Reflexion decouples three roles: an Actor () that generates code or environment actions, an Evaluator () that executes the trajectory against deterministic checks (running self-generated unit tests in coding or loop/step-count heuristics in ALFWorld), and a Self-Reflection model () that ingests the trajectory  and scalar failure signal  to emit a concrete natural-language diagnosis 6. Because  translates a sparse binary failure into a specific causal hypothesis (a &quot;semantic gradient&quot;), Reflexion achieves 91.0% pass@1 on HumanEval Python (surpassing raw GPT-4 at 80.1%, a +10.9 percentage point improvement), raises HumanEval Rust from 60% to 68%, lifts MBPP Rust from 71% to 75%, doubles LeetCode Hard from 7.5% to 15%, improves HotpotQA by +20%, and solves 130 of 134 ALFWorld tasks (97.0%, a +22% absolute gain over ReAct, which stalls at trial 6–7 with a persistent 22% hallucination rate)6. Ablation studies on HumanEval Rust and HotpotQA confirm that neither episodic trace replay (LAST_ATTEMPT) nor blind retry (NONE) suffices on its own; without the explicit causal diagnosis step () grounded in test execution, Rust performance collapses back to the single-pass baseline, and adding verbal reflection atop episodic memory contributes +8% absolute accuracy6.

Even with external validators, however, asking an LLM to directly generate multi-step plans via natural-language backprompting remains inferior to symbolic offloading (the LLM-Modulo paradigm)19. When GPT-4 is used as a direct planner in Household and Logistics domains and iteratively backprompted up to 8 times with natural-language translations of PDDL validator (VAL) errors, it achieves only 48% and 33% success, frequently getting trapped in repetitive loops or introducing contradictory state predicates19. Conversely, when the multi-pass loop is used to have GPT-4 construct and repair a formal PDDL domain model (over 400 literals across 41 actions) based on validator feedback, and the actual plan search is delegated to a sound classical planner (Fast Downward) or logical reasoner (TIC), task success jumps to 95%–100%19. In software engineering harnesses, this translates to a core architectural rule: use the LLM to synthesize declarative specifications, AST queries, or executable test scripts, and delegate state verification and combinatorial search to deterministic runtimes.

Ensembling, Multi-Agent Debate, and Heterogeneous Synthesis

When deterministic execution environments are unavailable or incomplete—such as during architectural planning, specification drafting, or open-ended code review—harnesses rely on multi-sample elicitation and multi-agent synthesis. Evaluating which of these patterns genuinely beats a single pass requires examining how sample correlation, model capacity, and inter-agent conformity govern ensemble gains.

The Diminishing Returns of Naive Self-Consistency in Frontier Models

Classical Self-Consistency (SC), introduced by Wang et al. (2022, arXiv:2203.11171), samples  independent trajectories from a temperature-scaled decoder and selects the plurality answer, yielding substantial gains over greedy decoding on earlier model generations (+10.6% on GSM8K, +14.4% on SVAMP, +24% on MultiArith, and +4% to +5% on ARC and CommonsenseQA)25. However, recent studies on modern frontier models (2025–2026) demonstrate that unweighted intra-model majority voting has largely lost its edge26. Because post-training alignment and deliberative reinforcement learning have dramatically reduced stochastic output variance, modern models exhibit high intra-model consistency (Fleiss' ) even at low effort settings27. Evaluating Gemini 2.5 models on HotpotQA and MATH-500 (arXiv:2511.00751) shows that scaling from 1 to 20 sampled paths yields only a +0.4% accuracy gain on HotpotQA and +1.6% across 15–20 samples on MATH-500 (where single-pass accuracy already sits at 98%), while token expenditure scales linearly by  to 26. When a model's systematic bias aligns across samples, majority voting merely reinforces the shared misconception at  the cost30.

For homogeneous sampling to beat single-pass economically in modern harnesses, three structural modifications are required: dynamic stopping, confidence-weighted aggregation, and diversity-forced free-form selection26. First, Adaptive-Consistency (Aggarwal et al., 2023) halts sample generation dynamically as soon as empirical vote convergence exceeds a statistical threshold, cutting sample consumption by up to  with less than 0.1% accuracy loss26. Second, rather than treating every sampled trajectory as an equal vote, Confidence-Informed Self-Consistency (CISC, arXiv:2502.06233) weights each response  by a normalized confidence score32. Evaluating length-normalized sequence probability , verbalized confidence (binary or 0–100), and  (Kadavath et al., 2022, which appends a binary verification prompt  and reads the token probability of 1 while reusing the cached KV prefix  without reprocessing) demonstrates that 8-sample CISC surpasses 30-sample standard SC on MATH with Gemma2-9B (a  compute reduction)32. Across all evaluated models and benchmarks at a 10-sample budget, normalized  CISC cuts compute cost by 46% (matching 18.6 standard SC samples) while improving accuracy by +1.1%32. Third, because standard SC cannot aggregate non-discrete outputs like source code or architectural prose, Universal Self-Consistency (USC, Chen et al., 2023, arXiv:2311.17311) concatenates  candidate generations and prompts the LLM to select the candidate with the highest semantic consensus, matching execution-based AlphaCode-style voting on code generation without requiring a runtime sandbox, and improving GovReport summarization and TruthfulQA33. Because USC match ratios degrade when scaling from 8 to 16 candidates due to cross-sample context length limits36, NeurIPS 2025 work introduces Self-Certainty—estimating quality directly from the output token probability distribution during Best-of- generation without an external reward model or concatenation pass37. Complementarily, DIVERSEPROMPTING (DIV-SE and IDIV-SE) explicitly prompts the model to formulate distinct problem-solving paradigms before sampling, raising GPT-4 accuracy over zero-shot prompts and SC by +16.52 percentage points on AQUA-RAT, +29.6 pp on Blocksworld planning, and +82.5 pp on Graph Coloring34.

Multi-Agent Debate: Degeneration-of-Thought Versus Sycophancy Collapse

Multi-Agent Debate (MAD) attempts to overcome single-pass blind spots by having multiple agent instances critique each other's proposals across iterative rounds. Du et al. (2023, arXiv:2305.14325) showed that multi-instance consensus debate improves six-number arithmetic evaluation, GSM8K math, Stockfish pawn-score optimality in 14-move chess, MMLU, and historical computer-scientist biography generation—where hallucinated dates and institutions vary across instances and are pruned during cross-examination because peers disagree on uncertain facts38. Similarly, Liang et al. (2023/2024, arXiv:2305.19118) demonstrated that single-agent reflection suffers from Degeneration-of-Thought (DoT): once an LLM commits to an intuitive literal interpretation, subsequent self-reflections repeat the same flawed premise with low candidate diversity41. By pitting an Affirmative Debater against a Negative Debater under a Judge (operating in Discriminative mode to halt early or Extractive mode at the turn limit), Liang et al.'s MAD framework enabled GPT-3.5-Turbo to outperform standalone GPT-4 on Common MT lexical ambiguity (COMET 82.0 vs. 82.0, BLEURT 70.9 vs. 70.1, Human score 3.78 vs. 3.41), cutting ambiguity bias from 29.0% to 24.8% and more than doubling candidate diversity () from 19.3 to 49.741.

Despite these targeted wins on ambiguity resolution, controlled ablation studies reveal that unconstrained Multi-Agent Debate frequently fails to beat simple majority voting (Self-Consistency) at equal compute budgets, and often degrades performance3. This failure is driven by four coupled mechanisms: sycophantic conformity collapse, argument polarization, negative debater scaling, and judge ingroup bias10. First, RLHF-tuned models exhibit strong intrinsic sycophancy—prioritizing conversational harmony over objective correctness10. Multi-agent analyses (arXiv:2510.07517; arXiv:2509.23055) quantify this via the Identity Bias Coefficient (IBC), Disagreement Collapse Rate (DCR), and Sycophancy Score (SS, ranging from 0 for independent deduction to 100 for complete echoing): in 18 out of 20 evaluated MAD configurations, positive IBC values prove that peer conformity vastly outweighs self-bias, causing agents with a valid minority solution in Round 0 to capitulate to a flawed majority in Round 1 unless peer responses are anonymized10. Second, while Du et al. noted that prompts must encourage agents to be &quot;stubborn&quot; to prevent premature agreement40, Liang et al.'s discrete opposition sweep across four disagreement levels shows that enforcing maximum &quot;tit-for-tat&quot; disagreement (Level 3) induces argument polarization: agents optimize for rhetorical victory rather than truth, degrading accuracy compared to moderate disagreement (Level 2)41. Formal parameterization of persona sycophancy (, where  is an obstinate &quot;troublemaker&quot; and  is a compliant &quot;peacemaker&quot;) confirms that homogeneous high- or low- ensembles fail unless carefully balanced10. Third, adding more debaters into a shared context window increases peer conformity pressure and context noise; on Common MT, scaling from 2 debaters (COMET 84.4, Human 3.69) to 3 debaters (COMET 83.1, Human 3.58) and 4 debaters (COMET 82.9, Human 3.49) monotonically degrades quality, and forcing debate to continue past the first round when a valid translation is already reached actively harms accuracy41. Fourth, when heterogeneous models are used as debaters, an LLM judge exhibits systematic ingroup preference toward the debater that shares its own underlying model architecture41.

Heterogeneous Synthesis: Mixture-of-Agents (MoA) and Jury Panels (PoLL)

Whereas homogeneous multi-agent debate suffers from correlated blind spots and sycophantic collapse, heterogeneous model synthesis genuinely and substantially beats single-pass frontier models. Together AI's Mixture-of-Agents (MoA, Wang et al., 2024, arXiv:2406.04692) exploits the empirical finding that LLMs generate higher-quality outputs when presented with auxiliary reference responses from diverse model families, even when some reference models are individually weaker7. Arranged in a feed-forward layered topology (6 open-source proposer models across 3 layers, culminating in an Aggregator model such as Qwen1.5-110B-Chat or GPT-4o guided by an &quot;Aggregate-and-Synthesize&quot; prompt), MoA achieves a 65.1% length-controlled (LC) win rate on AlpacaEval 2.0 using exclusively open-source models—surpassing GPT-4 Omni (57.5%) by +7.6 percentage points—and achieves top performance on MT-Bench and FLASK across correctness, factuality, completeness, and metacognition (with only a minor trade-off in conciseness due to slightly longer syntheses)7. Even a 2-layer MoA-Lite configuration reaches 59.3% on AlpacaEval 2.0 (+1.8% over GPT-4o) while delivering  the cost-effectiveness of GPT-4 Turbo7. Crucially, ablations comparing the MoA aggregator against an LLM Ranker (using Qwen1.5-110B-Chat to select the best single proposer output) prove that MoA wins by performing genuine cross-candidate synthesis rather than cherry-picking, and that heterogeneous model diversity within each layer consistently beats homogeneous multi-sampling7.

This exact principle of cross-family decorrelation transforms evaluation and review harnesses through multi-model juries and role-differentiated panels49. Using a single large model (such as GPT-4 Turbo) as an evaluator introduces high prompt-perturbation variance and self-preference bias that scales linearly with the model's self-recognition capability49. In Replacing Judges with Juries (Verga et al., 2024, arXiv:2404.18796), replacing a single GPT-4 Turbo judge ($10 input / $30 output per 1M tokens) with a Panel of LLM Evaluators (PoLL) composed of three small models drawn from disjoint model families (command-r, gpt-3.5-turbo, and claude-3-haiku, costing $1.25 input / $4.25 output combined) achieves the highest Cohen's , Kendall's , and Pearson correlation with human judgments across six KILT single-hop/multi-hop QA datasets and Bamboogle at less than one-seventh the inference cost49. Furthermore, PoLL evaluations show that pointwise scoring flips only ~9% of the time under distractor and ordering perturbations, whereas pairwise preference comparisons flip ~35% of the time52. Complementarily, when evaluating open-ended dialogue and text generation (FairEval and Topical-Chat across naturalness, coherence, engagingness, and groundedness), ChatEval (Chan et al., 2023, arXiv:2308.07201) demonstrates that assigning explicit orthogonal evaluation personas (General Public, Critic, News Author, Psychologist, Scientist) under One-By-One or Simultaneous-Talk communication strategies increases human agreement (Spearman , Kendall , and accuracy peaking at 62.5% with 3 to 4 roles) over single-agent G-Eval, though scaling to 5 roles reintroduces accuracy degradation50.



Compute-Optimal Test-Time Scaling and Selective Control

Rather than applying a static multi-pass topology to every prompt, compute-optimal harnesses dynamically route inference compute based on model-relative problem difficulty and intermediate process verification9. Snell et al. (2024, arXiv:2408.03314) formalize this by partitioning tasks into five difficulty quantiles (Bins 1–5, calibrated via 2,048 oracle rollouts or learned difficulty predictors) and comparing parallel independent sampling (Best-of-N weighted), step-level Process Reward Model (PRM) Beam Search (), Lookahead Search (, which incurs  sample cost), and sequential iterative Revisions (fine-tuned on incorrect-to-correct trajectory chains)9.



Difficulty Regime / Task Profile

Optimal Test-Time Compute Strategy

Suboptimal / Degrading Strategy

Empirical Efficiency &amp; Accuracy Outcome (Snell et al., arXiv:2408.03314 &amp; Agentic TTS, arXiv:2506.12928)

Easy Prompts (Bins 1–2) (High base pass@1; initial draft nearly valid)9

Sequential Revisions or low-budget Best-of-

[cite: 31, 55]

High-budget PRM Beam Search or Lookahead Search

[cite: 9, 55]

Sequential revisions efficiently polish minor errors; high-budget PRM Beam Search degrades accuracy below baseline by exploiting PRM flaws (generating degenerate 1–2 step answers or repetitive tail steps)9.

Medium-to-Hard Prompts (Bins 3–4) (Multi-step deduction where initial direction often errs)9

PRM-Guided Beam Search () + Hybrid Parallel/Sequential Revision

[cite: 9, 31, 55]

Unweighted Majority Vote or pure sequential revision31

PRM prunes flawed intermediate prefixes early; difficulty-conditioned routing matches or beats Best-of- with up to  less compute (e.g., budget 16 vs. 64 for search; budget 64 vs. 256 for revision)9.

Extreme Prompts (Bin 5) / High Inference Load ()

[cite: 9, 55]

Pretraining Parameter Scaling ( larger base model)9

Any test-time search or revision over a small model9

All test-time search methods stall near 0% gain on Bin 5; test-time compute and pretraining FLOPs are not 1-to-1 exchangeable when base knowledge is absent9.

Multi-Step Agent Trajectories (Tool-calling &amp; environment loops)56

Step-wise BoN / Beam Search () + Score-Triggered Reflection () + List-wise Merging

[cite: 57]

Unconditional step-by-step reflection at every turn57

Reflecting only when step verifier score falls below threshold prevents over-correction; delegating bounded choices to a typed-decision controller (REFLEX with Jev) retains 95% success with 72.7% fewer frontier LLM calls56.

Three foundational engineering principles emerge from these test-time scaling evaluations9. The first is verifier over-optimization (reward hacking) on easy tasks: when a strong step-level optimizer like Beam Search or Lookahead Search is applied with a large generation budget to an easy problem (Bins 1–2), test accuracy actively falls as compute increases9. The search algorithm exploits out-of-distribution quirks in the Process Reward Model, selecting adversarial trajectories such as overly truncated 1–2 step assertions or low-information repetitive steps appended to the end of a derivation9. Lookahead Search consistently underperforms at equal generation budgets because simulating -step rollouts consumes  samples while amplifying PRM exploitation9. Conversely, on medium-hard problems (Bins 3–4), combining parallel exploration with sequential revisions and PRM beam guidance achieves a  generation budget reduction (matching  Best-of- at budget 16 for search, and matching  at budget 64 for revision)9.

The second principle is selective score-gated revision and control in agent loops. Extending test-time scaling to multi-step language agents (arXiv:2506.12928) confirms that reflecting at every agent step (Step-based Reflection) wastes tokens and destabilizes valid trajectories57. Instead, scoring each intermediate step with a verifier and triggering revision only when the step score drops below a calibrated threshold (Score-based Reflection, tested across  frequent,  moderate, and  selective thresholds), combined with list-wise result merging across diversified multi-agent rollouts, yields superior agent task completion57. Similarly, in REFLEX with Jev (Wu and Lim, 2026), delegating bounded control choices inside a frozen agent loop to a lightweight model (Jev) that outputs typed decisions—invoking the frontier LLM only when confidence is low or free-form text generation is required—preserves 95% task success while cutting frontier model calls by 72.7%56.

The third principle is meta-optimizing exploration policies via offline replay worlds (Dream-RSI)58. In long-horizon algorithmic discovery, an agent explores numerous dead-end branches, tests hypotheses, and allocates parallel workers, with failed trajectories ordinarily discarded as log exhaust58. Dream-RSI converts the accumulated discovery tree into an offline Replay Simulator (EXPLORE -&gt; RECORD -&gt; REPLAY -&gt; IMPROVE THE EXPLORATION POLICY -&gt; REDEPLOY -&gt; EXPAND THE WORLD -&gt; REPEAT), allowing candidate exploration policies to evaluate alternative branching depths, parallelization choices, and stopping criteria inside the recorded world without re-paying for underlying coding-agent executions—achieving substantial efficiency gains such as discovering a Lasso solver with Gemini-3.1 Pro in 317 discovery-agent calls58.

Coding Agent Architectures: The Agentless Paradox, ACI Ergonomics, and Harness Engineering

In repository-level software engineering, the naive multi-pass baseline is an unconstrained ReAct loop (Yao et al., 2023) where an LLM alternates between generating thoughts and executing raw Linux shell commands until it invokes finish or hits MAX_ITERATIONS59. While the core agentic loop requires only ~18 lines of orchestration code60, source-code taxonomy analysis of 13 open-source coding agents (Inside the Scaffold, Rombaut, 2026, arXiv:2604.03515) across 12 architectural dimensions and systematic failure reviews (Shakir et al., 2026) reveal that unconstrained open-loop agents suffer from six pervasive failure modes: hallucination, context overflow, test overfitting, over-engineering, inter-agent communication errors, and security boundary violations61.



The Agentless Paradox: Fixed Hierarchical Pipelines Versus Open-Loop Tool Roaming

One of the most consequential findings in automated software engineering is the Agentless Paradox (Xia et al., 2024, arXiv:2407.01489; Shakir et al., 2026): a deterministic, fixed-pipeline workflow without autonomous tool-selection loops matches or outperforms complex autonomous agents on SWE-bench Lite at a fraction of the token cost, resolving 27.33% to 32.00% (96/300 issues) and prompting OpenAI to adopt Agentless as the standard evaluation harness for GPT-4o and the o1 model family2.

Agentless beats both single-pass prompting and open-loop autonomous agents by decomposing issue resolution into three strictly bounded elicitation and synthesis phases: hierarchical localization, diff-based patch repair, and reproduction test filtering2. Rather than letting an agent burn dozens of turns running arbitrary grep or find commands, the localization phase progressively narrows the search space in three deterministic passes: first, file-level localization (achieving 69.7% accuracy) combines a repository directory tree prompt with text-embedding-3-small cosine similarity retrieval after filtering out irrelevant folders; second, element-level localization (achieving 52.0% accuracy) converts each suspicious file into a condensed AST skeleton format containing only class and function signatures with implementation bodies stripped, enabling the LLM to identify relevant symbols without overflowing the context window; third, line-level localization (achieving 35.3% accuracy) presents the full code of the selected elements and samples 4 candidate edit location sets constructed with -line context windows2. In the repair phase, instead of regenerating entire files (which inflates token costs and risks accidental deletions on large modules) or using brittle JSON function-calling schemas, Agentless synthesizes patches in a lightweight Search/Replace diff format, sampling 40 candidate patches per issue (4 edit location sets  10 patches per set, combining greedy decoding with temperature sampling)2. Finally, in the validation phase, because repository test suites only check existing regression behavior, Agentless prompts the LLM to synthesize standalone reproduction tests from the issue description, filtering for tests that replicate the bug on the unpatched repository (successfully reproducing 213 of 300 SWE-bench Lite bugs, with 94 verifying ground-truth patches)2. Candidate patches that fail syntax checks or existing regression suites are discarded, and the remaining patches are ranked via the generated reproduction tests to select a single submission2.

This structural compression paradigm is independently validated by Aider and Moatless Tools. In Aider's core architecture, the LLM is given zero callable tools; instead, the scaffold constructs a Repository Map by parsing the codebase's Abstract Syntax Tree (via tree-sitter) and running a PageRank graph optimization over the call graph to extract the most frequently referenced class, method, and function signatures alongside their defining lines62. Furthermore, Aider's benchmarks on 133 Python and 225 polyglot Exercism tasks across C++, Go, Java, JavaScript, Python, and Rust prove that plain-text Markdown edit formats (whole file replacement for small files or ORIGINAL/UPDATED diff blocks for larger files) significantly outperform OpenAI JSON function-calling APIs (whole-func), which frequently mangle string escaping and degrade code quality69. When edits are applied, Aider automatically runs linters and unit tests, feeding back only the first 50 lines of test errors to trigger a targeted second pass69. Similarly, Moatless Tools pairs constrained AST search with bounded edit verification to achieve a 39% solve rate on SWE-bench with Claude 3.5 Sonnet at 2.7 resolved instances per dollar71.

Agent-Computer Interface (ACI) Ergonomics and Shadow Workspaces

When tasks require open-ended exploration across unfamiliar environments where a fixed three-step pipeline is insufficient, the decisive factor is the Agent-Computer Interface (ACI) (Yang et al., 2024, SWE-agent, arXiv:2405.15793)1. Holding the base model (GPT-4 Turbo) and benchmark (300 SWE-bench Lite tasks, with a $4 per-instance inference budget) strictly constant, replacing a standard human Linux shell (Shell-only, 11.00% resolved) with SWE-agent's LM-tailored ACI jumps resolution to 18.00% (54/300)—a 64% relative increase (+7.0 percentage points)—and resolves 12.47% (286/2,294) on the full SWE-bench suite (a  improvement over RAG baselines) alongside an 88.3% pass@1 rate on HumanEvalFix1.

Ablation experiments on SWE-agent isolate four specific interface mechanisms that drive this 64% relative improvement over raw shell access1. First, SWE-agent replaces unconstrained grep and find with find_file, search_file, and search_dir, which return summarized matches capped at 50 results and prompt the agent to narrow its query if more than 50 hits occur1. On SWE-bench Lite, this summarized 50-cap search resolves 18.00%, whereas an interactive iterative search interface that allows the agent to page through search hits drops resolution to 12.00%—performing worse than having no search tool at all (15.70%) because the model wastes turns exhaustively paging through matches1. Second, instead of dumping entire files into context, the open command displays a bounded 100-line viewer window with prepended line numbers, total line count, and omitted line counts above and below, navigated via scroll_down, scroll_up, and goto1; removing this 100-line window and showing full files reduces SWE-bench Lite resolution by ~5 percentage points74. Third, the edit command replaces start_line to end_line and immediately executes a syntax and lint guardrail; if a lint error is introduced, the proposed edit is automatically discarded and the agent receives concise before/after error feedback1. Removing this lint-on-edit guardrail costs 3 percentage points on SWE-bench Lite74. Fourth, SWE-agent's context processor collapses older observations outside the 5 most recent turns and strips intermediate malformed-command error traces once a valid command is issued, while modern production tools like Claude Code (as of 2026) enforce unambiguous parameter names (user_id rather than user), hold secondary tools out of context until fetched via ToolSearch, and return explicit isError: true / is_error signals that distinguish rejected regex patterns from empty search results1. In general CLI agents like OpenAI Codex and Claude Code, where arbitrary test or build commands can dump megabytes of minified single-line output (rendering line limits like head -n 20 unsafe), enforcing byte-capped command output (COMMAND 2&gt;&amp;1 | head -c 4000 or tail -c 4000) in AGENTS.md cuts average token consumption by roughly 50% across comparable coding tasks while preventing context degradation78.



In interactive IDE harnesses like Cursor, providing immediate compiler and linter feedback without disrupting the human developer requires a Shadow Workspace alongside Snapshot + Rebase buffer management79. Simply cloning an in-memory VS Code TextModel (modelService.createModel) and waiting 2,000 ms for markerService.read fails the independence requirement: the shared Language Server Protocol (LSP) instance sees both files, polluting go-to-references and triggering duplicate-declaration errors in package-scoped languages like Go and Rust79. Cursor resolves this by spawning a hidden background Electron window pointing to the workspace so the AI agent can apply edits, inspect LSP diagnostics, and iterate in isolation, while Fast Apply uses a fine-tuned speculative decoding model (llama-70b-ft-spec on Fireworks) to stream full-file rewrites at 79. Complementing action-side ACIs, the Agent-Computer Observation Interface (AOI, arXiv:2606.29472) decouples perception from action in dynamic computer-use (CU) agents by inserting sub-millisecond change gates ahead of  CLIP-ViT-B/16 visual keyframe capture ( on GPU) and on-demand Whisper large-v3 audio transcription, enabling models to solve temporal UI tasks on DynaCU-Bench without degrading static task performance84.

Long-Running Harnesses: Clean-Slate Adversarial Loops and WIP=1 Gating

When tasks span hours or multiple sessions—such as building a full application from scratch or modernizing a legacy COBOL repository—even the best single-session ReAct loop collapses due to context anxiety, overreach, and premature completion claims85. As synthesized across Anthropic's Harness Design for Long-Running Apps, OpenAI's Harness Engineering, and HarnessDev (arXiv:2609.01437), a production harness is not a prompt; it is a deterministic runtime comprising five subsystems—Instructions, Scope, State, Verification, and Lifecycle—where every component encodes an assumption about what the model cannot reliably do on its own86.

Multi-session harness evaluations establish five structural patterns that compound across long-horizon workflows5. First, enforcing a dedicated bootstrap initialization phase yields 31% higher feature completion across multi-session runs86. Mixing environment setup (installing dependencies, configuring test runners, scaffolding task trackers) with feature implementation causes agents to write unverified code before a test harness exists; consequently, the first session must execute only initialization under a Bootstrap Contract requiring that make setup succeeds, at least one example test passes, and a task breakdown file exists before any feature code is written86. Second, enforcing Kanban  scope gating yields 37% higher task completion86. Because an agent's attention capacity  divided across  concurrent tasks gives each task only  attention, the volume of code written in a single pass is negatively correlated with completed features86. Controlling scope via a deterministic four-state machine (not_started -&gt; active -&gt; passing | blocked, where transitioning to passing requires a zero-exit verification command and is irreversible) prevents overreach86.

Third, production harnesses replace volatile chat history with ACID state persistence via Git-backed filesystem artifacts86: Atomicity (one git commit per logical operation), Consistency (all tests and linters pass before commit), Isolation (separate progress files or git worktrees per concurrent agent, such as OpenCode's zero-friction git worktree plugins), and Durability via continuity files such as claude-progress.md, DECISIONS.md (recording why option B was chosen over option A), OpenAI Codex's pilot_execplan.md and pilot_reporting_overview.md for legacy COBOL/JCL modernization, or OpenCode's specification-driven artifact chain (chg--spec.md  chg--test-plan.md  chg--plan.md  chg--pm-notes.yaml, gated prior to implementation by an adversarial @readiness-reviewer via /check-readiness)85.

Fourth, Anthropic's long-running harness and its open-source replications (Mnemo and compound-agent) employ a GAN-inspired clean-slate Planner  Generator  Evaluator loop5. Each agent runs as a separate CLI process with zero shared conversation history, communicating exclusively through disk files (spec.md, eval-report.md) so the Evaluator judges output against the specification in a fresh context without inheriting the Generator's reasoning trace or suffering context anxiety5. Crucially, the Evaluator does not merely read static source code: it executes a deterministic build gate (npm run build), uses Playwright MCP to browse the live application, click elements, and resize viewports, and grades the output against four explicit criteria (Design quality, Originality, Craft, Functionality) while penalizing generic AI design clichés such as purple gradients over white cards or default Inter fonts5. Running 12 continuous Generator  Evaluator iterations (where creative leaps such as pivoting to an amber-on-black &quot;Terminal Noir&quot; aesthetic emerge at Iteration 4) or compound-agent's 20-hour autonomous loop (combining per-task Spec  Plan  TDD  parallel 4-model review across Claude Sonnet, Claude Opus, Gemini, and Codex  5 full-codebase polish loops) produces complex software such as a full browser-based Digital Audio Workstation (BRUTALWAV with AudioWorklet DSP and SharedArrayBuffer transport) with zero lines of manual code5. Fifth, harnesses optimize the cost-intelligence frontier via hybrid model and mode routing: Claude Code's /model opusplan uses Opus with extended thinking for planning and multi-file synthesis before switching (Shift+Tab) to Sonnet for execution91, while Roo Code's Orchestrator (Boomerang) Mode restricts the orchestrator to editing mode configuration files (.roomodes, custom_modes.yaml) and delegates subtasks via new_task to specialized modes (Architect Mode restricted via fileRegex: \.(md|mdx)$ to Markdown files, read-only Ask Mode, or Code/Debug modes), each bound to its own Sticky Model96.

Context Engineering, Compaction Theory, and Progressive Disclosure

Multi-pass and long-running harnesses fail if the context window feeding each LLM invocation becomes polluted. Karpathy defines context engineering as the session-level discipline of filling the context window with the exact minimal information required for the next step—nested inside system-level harness engineering (&quot;Agent = Model + Harness&quot;) and superseding message-level prompt engineering99.

Context Rot, Distractor Amplification, and Compaction Limits

Chroma's empirical investigation of Context Rot (Hong et al., 2025) across 18 frontier models (including GPT-4.1, Claude 4, and Gemini 2.5 across 8 input lengths and 11 needle positions) proves that LLM accuracy degrades continuously as input length grows, long before reaching the nominal context window limit8. While vendors cite near-perfect scores on standard Needle-in-a-Haystack (NIAH) tests that rely on exact lexical matching, testing non-lexical semantic associations (NoLiMa, where the model must infer latent connections between differently phrased needles and queries) reveals steep degradation as context scales, particularly when needle-question cosine similarity is low8. Furthermore, inserting even a single topically related distractor—the exact artifact returned by imprecise top- embedding retrieval—significantly reduces accuracy relative to a needle-only baseline, and adding four distractors compounds the degradation across all models8. Under distractor load and growing context, model families fail differently: Claude models tend to abstain or refuse (with Claude Opus 4 refusing 2.89% of tasks starting above 2,500 words), whereas GPT models confidently hallucinate wrong answers102. Counterintuitively, across all 18 evaluated models, logically coherent haystacks (preserving natural essay or paper flow) perform consistently worse than randomly shuffled sentences of the exact same corpus, indicating that local narrative continuity traps attention away from buried facts8.

This degradation directly compromises multi-pass safety and oversight in Classifier Context Rot (arXiv:2605.12366)105. When an LLM monitor evaluates long agent transcripts (up to 800K tokens on MonitorBench) for subtly misaligned or dangerous actions, padding the transcript with 500K benign tokens before and 100K benign tokens after the dangerous action causes a non-deliberative monitor's detection rate to collapse to 5%, with needles positioned in the middle of the 800K transcript proving hardest to detect105. Three elicitation patterns restore monitor reliability: enabling extended deliberation (e.g., Opus 4.6 with extended thinking, which resists padding degradation), incremental sub-transcript monitoring after every action (which ensures the misaligned action is evaluated when it sits at the very end of the context window and gives stochastic monitors multiple sampling opportunities), and injecting periodic alignment reminders into the transcript105.

When an agent session approaches the context ceiling, harnesses rely on context compaction. However, Context Compaction Theory (Tirmazi et al., 2026, arXiv:2608.01326)—which formalizes compaction via one-way communication complexity and evaluates Opus 4.8 against Anthropic's compaction endpoint on set membership queries—proves a hard information-theoretic lower bound on how much an agent's state can be compressed without irreversible loss of decision-critical facts106. Moreover, empirical agent evaluations (arXiv:2508.21433) show that naive LLM-generated context summaries (llm-Summary) act as a reinforcing signal that induces trajectory elongation: the summarized progress report encourages the agent to keep taking extra steps, erasing the efficiency gained by bounding the context window109. Consequently, superior harnesses pair custom compaction hooks (such as OpenCode's experimental.session.compacting hook, which replaces generic summarization with a structured state payload tracking only the active task, modified files, agent blockers, and immediate next steps) with Dynamic Context Pruning plugins that strip obsolete tool outputs in place110.

Progressive Disclosure and Docs-as-Routing

Because linear context growth  per turn induces super-linear  cumulative session cost and triggers Context Rot8, stuffing comprehensive style guides, API schemas, or domain playbooks into a single root instruction file (CLAUDE.md, AGENTS.md, or .cursorrules) is an anti-pattern112. In fact, Claude Code explicitly wraps CLAUDE.md in a system reminder instructing the model to ignore sections it deems irrelevant to the current task, and concatenates user (~/.claude/CLAUDE.md), project (.claude/CLAUDE.md), and directory files without override precedence—meaning contradictory rules across files are resolved arbitrarily by the model (with CLAUDE.local.md guaranteed to append last only within the same directory)112.

To beat single-pass context dumping, production harnesses implement Progressive Disclosure and Docs-as-Routing across four distinct memory layers: Working Memory (), Episodic Memory (), Semantic Memory (), and Procedural Memory ()101. At the root layer, high-performing engineering teams restrict CLAUDE.md or AGENTS.md to 60–200 lines (never exceeding 300 lines, with at most 15 non-negotiable hard constraints placed at the very top or bottom of the file to avoid middle-context loss, and never auto-generating bloated files via /init without manual pruning)86. As OpenAI's harness engineering guidelines emphasize, the root instruction file must answer &quot;where do I look?&quot; (routing logic), not &quot;what do I know?&quot; (encyclopedic knowledge), covering only the WHAT (tech stack, directory map), WHY (architectural intent), and HOW (exact build, test, and lint commands that cannot be guessed, while delegating code formatting to deterministic linters)89. Under the Linux Foundation's Agentic AI Foundation specification for AGENTS.md, large monorepos scope instructions via nested directory files where the closest AGENTS.md to the edited file takes precedence (for example, OpenAI's main repository contains 88 nested AGENTS.md files, and Codex supports AGENTS.override.md)119.

At the semantic knowledge layer, for repository documentation up to ~200 files, a deterministic Code Wiki / Index File routing architecture (docs/index.md kept to 60–120 lines, paired with 10–30 line per-directory index.md files, docs/troubleshooting.md error-signature tables, docs/decisions/ ADRs, docs/runbooks/, cross-cutting @tag: tokens, and web-facing llms.txt / llms-full.txt endpoints) consistently outperforms embedding-based vector RAG116. Instead of retrieving noisy, fragmented chunks that trigger Distractor Amplification, the agent reads docs/index.md first and fetches pre-compiled synthesis pages whose claims cite exact source lines (File.go#L42-L60) and explicitly mark ambiguity (TODO-VERIFY, CONTRADICTION)102.

At the procedural layer, modern harnesses strictly separate passive behavioral constraints (Rules) from multi-step procedural workflows (Skills) and manual prompt shortcuts (Commands)112. Rules in .claude/rules/ or .cursor/rules/*.mdc use YAML frontmatter (alwaysApply, globs / paths: [&quot;src/api/**/*.ts&quot;], and description) so file-specific conventions load only when matching files enter context113. Conversely, Skills (standardized via agentskills.io as folders containing a SKILL.md plus scripts, git submodules, and templates) use three-stage progressive loading: Discovery (the agent sees only skill names and short descriptions at session start), Activation (SKILL.md loads only when invoked or matched to the task), and Expansion (supporting templates and reference scripts stay outside the context window until requested)125. Autonomous systems like Nous Research's Hermes Agent close the episodic-to-procedural loop via Automated Skill Creation: after solving a complex problem, the agent writes a reusable SKILL.md document into ~/.hermes/ (alongside Claude Code's organic ~/.claude/projects/&lt;project&gt;/memory/MEMORY.md entrypoint, which loads the first 200 lines per session) so subsequent runs execute the verified procedure without re-discovery113.



Harness Configuration Layer

Primary Mechanism &amp; Scope

Context Window Footprint

Failure Mode / Operational Caveat

Root Instruction File (CLAUDE.md, AGENTS.md, .windsurfrules, .github/copilot-instructions.md)115

Global repo map, exact build/test commands, top  guardrails + routing links86

Loaded into every session (keep – lines)89

Delivered as user/context message with no strict compliance guarantee; conflicting rules in concatenated CLAUDE.md files resolve arbitrarily112.

Scoped Rules (.cursor/rules/*.mdc, .claude/rules/*.md, .github/instructions/*.instructions.md)113

Declarative domain standards gated by YAML globs/paths or agent description

[cite: 113, 126]

Loaded conditionally when matching files or topics are active126

Parser regressions across IDE versions (e.g., Cursor v2.2–2.3 ignoring documented folder RULE.md in favor of flat .mdc files); multi-tool drift requires compilers like rulesync or nymor134.

Routing Catalogs (docs/index.md, per-dir index.md, llms.txt)116

60–120 line routing table mapping tasks/errors to ADRs, runbooks, and cited code116

~1–2K tokens at task start; fetches targeted synthesis on demand122

Unchecked LLM doc generation creates a feedback loop of &quot;confident lies&quot; if CI gates do not verify links and commands112.

Procedural Skills (SKILL.md / agentskills.io, Cursor/Claude/Codex/Hermes Skills)125

Multi-step &quot;how-to&quot; procedures, reference submodules, and helper scripts125

Zero body cost at startup (name/description only); loads progressively on demand125

Because skills activate only when the agent judges them relevant, hard security constraints placed in skills may never be read114.

Security Boundaries, Instruction Hierarchy, and Deterministic Runtime Enforcement

A critical misconception in agent design is treating prompt-level instruction hierarchies, training-time Constitutional AI, or multi-pass LLM monitors as hard security boundaries. In Constitutional AI (CAI, Bai et al., 2022, arXiv:2212.08073), Anthropic demonstrated that two-stage training—supervised fine-tuning on explicit principle-guided Critique -&gt; Revision pairs (SL-CAI) followed by reinforcement learning from AI feedback (RL-CAI / RLAIF)—reduces harmful outputs and eliminates evasive stonewalling without human harm labels, with critiqued revisions outperforming direct uncritiqued revisions137. However, applying CAI and Direct Preference Optimization (DPO-CAI) to smaller models reveals an alignment tax: while Attack Success Rate (ASR) on the HeX-PHI red-teaming benchmark falls from 71% to 42% (a 40.8% relative reduction), helpfulness drops by 9.8% (MT-Bench 6.05  5.46) and models can suffer repetition collapse if synthetic Stage-1 revisions are not filtered139. Similarly, in The Instruction Hierarchy (Wallace et al., 2024, arXiv:2404.13208), OpenAI trained models via context synthesis (compositional aligned instructions) and context ignorance (ignoring conflicting lower-privilege directives) to enforce a privilege ordering of System Message  User Message  Tool Outputs / Third-Party Content141. On benchmark evaluations with GPT-3.5 Turbo, this training raised TensorTrust system-prompt extraction robustness from 32.8% to 95.9%, improved held-out ChatGPT jailbreak resistance from 37.4% to 71.2%, and increased direct/indirect prompt injection robustness by up to 63%141.

Despite these gains, relying on model weights to enforce privilege boundaries fails in production coding agents for two fundamental reasons: over-refusal regressions on benign boundary tasks and vulnerability to adaptive indirection exploits143. First, teaching the model to refuse lower-privilege instructions that resemble overrides degrades compliance on legitimate boundary requests—dropping compliance from 85.2% to 75.0% on System Message Probing Questions and from 83.1% to 60.4% on benign Jailbreakchat Allowed Prompts143. Second, red-teaming by Johann Rehberger (Embrace The Red) demonstrated that gpt-4o-mini's instruction hierarchy is bypassed via multi-step indirection (defining a lookup table and dereferencing entries to hijack system identity and extract secret codes)145, while adaptive attacks like DataFlip achieve a 91% attack success rate with 0% detection against key-value defenses, and adaptive multi-round attackers tested across 20,000+ attacks prove that security boundaries must be enforced in application code rather than by the model144. In coding agents that read untrusted repositories, build logs, and documentation, indirect prompt injections have repeatedly escalated into Remote Code Execution (RCE) and data exfiltration vulnerabilities: Cursor suffered CVE-2025-61593 (where indirect prompt injection modifies .cursor/cli.json on case-insensitive filesystems to achieve full RCE), CVE-2025-54136, and data exfiltration via rendered Mermaid diagrams146; Claude Code suffered CVE-2025-59536 (pre-trust execution), CVE-2025-54795 (command injection, CVSS 8.7), CVE-2025-55284 (data exfiltration via DNS queries), CVE-2026-39861 (symlink traversal via prompt injection), and Auto Mode indirect prompt injection bypasses147; and Windsurf suffered CVE-2026-30615 (zero-click prompt injection)147.

Because LLM instruction priority is probabilistic rather than a trust boundary115, patterns that genuinely beat single-pass execution must enforce validation, permissions, and human-in-the-loop (HITL) gating inside deterministic application code and runtime middleware. At the structured output and tool-execution layer, PydanticAI (and its TypeScript counterpart Vibes) injects typed runtime dependencies (RunContext[Deps]) into tools and @agent.result_validator coroutines152. When an agent synthesizes a SQL query or structured payload, the validator executes a deterministic check against the live dependency—such as running await ctx.deps.execute(f'EXPLAIN {result.sql_query}') or verifying minimum source counts—and raises ModelRetry('Invalid query: ...') on failure, automatically feeding the exact exception traceback back to the model for a grounded retry153.

At the workflow orchestration layer, LangGraph replaces rigid node-boundary pauses (interrupt_before) with resumable in-node/in-tool exceptions via interrupt(value, response_schema=...) and HumanInTheLoopMiddleware, backed by a persistent checkpointer (AsyncPostgresSaver) and PatchToolCallsMiddleware (which repairs message history if a run is cancelled mid-tool-call)156. Using when predicates on InterruptOnConfig, the harness auto-approves low-risk tool arguments while raising a typed ToolApprovalRequest interrupt on sensitive actions158. In per_call mode, LangGraph validates the human's Command(resume=...) decision (approve, edit, reject, or respond, where reject must be used to deny side-effecting tools because respond returns a synthetic tool output that the model interprets as a successful execution) against the tool's Pydantic schema before saving state, ensuring that edited arguments cannot switch tools or violate type contracts158.

Finally, at the client and enterprise gateway layer, non-negotiable security rules must reside in client-enforced settings.json, lifecycle hooks, or external policy proxies111. In OpenCode, TypeScript plugins register deterministic tool.execute.before hooks that inspect input.tool and output.args.filePath to block reads of .env secrets before execution111, while Google's Antigravity CLI (agy) enforces zero-trust strict and request-review tool-permission modes outside the model prompt162. At the enterprise infrastructure layer, Archestra and its Rust-based guardrail engine OpenAPPA interpose a deterministic proxy between coding agents (Claude Code, Codex, Cursor) and downstream Model Context Protocol (MCP) servers at 31 ms p95 latency161. By combining Lethal-Trifecta guardrails (blocking tool calls that simultaneously access private data, process untrusted external input, and possess external network egress) with Microsoft Entra On-Behalf-Of (OBO) and ID-JAG token exchange, the gateway ensures every MCP tool call executes under the initiating human user's identity rather than an over-privileged shared service account161.

Synthesis and Architectural Recommendations

Evaluating the empirical evidence across inference-time scaling, program synthesis, and production agent scaffolds yields a clear decision matrix for engineering leaders and harness architects:



Pattern Category

Genuinely Beats Single-Pass (High ROI)

Fails or Degrades vs. Single-Pass (Negative ROI)

Optimal Engineering Implementation

Self-Correction &amp; Refinement

Tool/Test-Grounded Reflection (Reflexion, CRITIC, PydanticAI ModelRetry, Agentless reproduction test filtering)2

Intrinsic Self-Correction (ungrounded &quot;review and fix your answer&quot; loops on logic, math, or planning)3

Never run a reflection pass unless a compiler, linter, unit test, EXPLAIN query, PDDL validator, or Playwright DOM check injects a concrete error delta3.

Sampling &amp; Ensembling

Confidence-Weighted SC (CISC ), Adaptive-Consistency, and Diversity-Forced Sampling (DIV-SE)

[cite: 26, 32, 34]

High-Sample Unweighted Self-Consistency () on frontier models where base accuracy is high26

Cap parallel samples at , weight votes by normalized  prefix-cached logprobs, and halt early on convergence26.

Multi-Agent Synthesis &amp; Evaluation

Heterogeneous Mixture-of-Agents (MoA), Cross-Family Juries (PoLL), and Clean-Slate Generator  Evaluator Loops

[cite: 5, 7, 49]

Homogeneous Multi-Agent Debate (MAD) with  debaters or uncalibrated opposition levels4

Eliminate conversational debate between identical models; instead, synthesize outputs across disjoint model families (MoA/PoLL) or isolate Generator and Evaluator in separate processes communicating only via disk files5.

Codebase Localization &amp; Editing

Hierarchical AST Skeletons (Agentless), PageRank RepoMaps (Aider), ACI 100-Line Viewers, and Lint-on-Edit Revert Guards

[cite: 1, 2, 65, 68]

Raw Bash Shell Roaming, Full-File Context Dumps, Iterative Paging Search, and JSON Function-Call Code Edits

[cite: 1, 69, 74]

Pre-filter via repo tree + AST call-graph PageRank; cap search output at 50 hits and shell output at 4,000 bytes (head/tail -c 4000); use Search/Replace diff blocks with automatic lint-revert on syntax errors1.

Long-Horizon &amp; Security Harnesses

Dedicated Init Phase,  Pass-State Gating, Docs-as-Routing (docs/index.md), and Deterministic Gateways (OpenAPPA/LangGraph)

[cite: 86, 123, 158, 163]

Monolithic CLAUDE.md Dumps ( lines), Naive LLM Compaction Summaries, and Prompt-Only Security Rules

[cite: 109, 113, 115, 145]

Keep root AGENTS.md/CLAUDE.md under 60–200 lines as a routing table to docs/index.md and on-demand SKILL.md files; enforce Bootstrap Contracts,  commits, and client-side tool/MCP hooks86.

Ultimately, the progression from prompt engineering to context engineering and harness engineering demonstrates that multi-pass language model systems succeed not by giving models more freedom to converse with themselves, but by embedding them inside tighter, deterministically verified feedback loops86. Every additional inference pass must be justified by either a reduction in problem entropy via AST and symbolic tooling, an injection of empirical reality from an execution sandbox, or genuine epistemic decorrelation across distinct model architectures and clean-slate contexts1.

Works cited

SWE-agent: Agent-Computer Interfaces Enable Automated Software, https://www.alphaxiv.org/abs/2405.15793

Agentless: Demystifying LLM-based Software Engineering Agents, https://www.alphaxiv.org/abs/2407.01489

Large Language Models Cannot Self-Correct Reasoning Yet - arXiv, https://arxiv.org/html/2310.01798v1

Understanding Failure Modes in Multi-Agent Debate - arXiv, https://arxiv.org/html/2509.05396v2

I replicated Anthropic's Generator-Evaluator harness to build a, https://www.reddit.com/r/Anthropic/comments/1tf73al/i_replicated_anthropics_generatorevaluator/

Reflexion: Language Agents with Verbal Reinforcement Learning, https://agent-atlas.blackarcindustrial.com/papers/reflexion-language-agents-with-verbal-reinforcement-learning/

Mixture-of-Agents Enhances Large Language Model Capabilities, https://arxiv.org/html/2406.04692v1

Context Rot: How Increasing Input Tokens Impacts LLM Performance, https://www.trychroma.com/research/context-rot

Scaling LLM Test-Time Compute Optimally can be More Effective, https://arxiv.org/html/2408.03314v1

How Sycophancy Shapes Multi-Agent Debate - arXiv, https://arxiv.org/pdf/2509.23055

Large Language Models Cannot Self-Correct Reasoning Yet, https://www.alphaxiv.org/abs/2310.01798

[PDF] Large Language Models Cannot Self-Correct Reasoning Yet, https://www.semanticscholar.org/paper/Large-Language-Models-Cannot-Self-Correct-Reasoning-Huang-Chen/6d4bacb69923e1e94fb4de468b939ce6db32fb51

Can Large Language Models Really Improve by Self-critiquing Their, https://huggingface.co/papers/2310.08118

How Does Generative AI Behave? - Zenn, https://zenn.dev/mumihatsu/articles/44153b820d84ec?locale=en

Self-Refine: A Game-Changing LLM Iterative Refinem - U深搜, https://unifuncs.com/s/QVUq9RoW

LLMs Lack Intrinsic Self-Correction in Reasoning - Emergent Mind, https://www.emergentmind.com/papers/2310.01798

CRITIC: Large Language Models Can Self-Correct with Tool, https://openreview.net/forum?id=Sx038qxjek

Reflexion: Language Agents with Verbal Reinforcement Learning, https://arxiv.org/html/2303.11366

arXiv:2305.14909v2 [cs.AI] 2 Nov 2023, https://arxiv.org/pdf/2305.14909

Leveraging Pre-trained Large Language Models to Construct ... - arXiv, https://arxiv.org/html/2305.14909v2

LLMs as Planning Formalizers: A Survey for Leveraging Large, https://arxiv.org/pdf/2503.18971?

Reflexion Language Agents with Verbal Reinforcement Learning.md, https://github.com/XingYu-Zhong/LLMsStudy/blob/master/%E8%AE%BA%E6%96%87%E8%A7%A3%E8%AF%BB/%E5%A4%A7%E6%A8%A1%E5%9E%8B/Reflexion%20Language%20Agents%20with%20Verbal%20Reinforcement%20Learning.md

[NeurIPS 2023] Reflexion: Language Agents with Verbal ... - GitHub, https://github.com/noahshinn/reflexion

Can Large Language Models Really Improve by Self-critiquing Their, https://www.semanticscholar.org/paper/Can-Large-Language-Models-Really-Improve-by-Their-Valmeekam-Marquez/e879f54b2b5760bbb6d010977ddcedfb62452b38

(PDF) Self-Consistency Improves Chain of Thought Reasoning in, https://www.researchgate.net/publication/359390115_Self-Consistency_Improves_Chain_of_Thought_Reasoning_in_Language_Models

Diminishing Returns and Rising Costs in Modern LLMs - arXiv, https://arxiv.org/pdf/2511.00751

The Impact of LLM Self-Consistency and Reasoning Effort on ... - arXiv, https://arxiv.org/pdf/2604.26954

Diminishing Returns and Rising Costs in Modern LLMs - arXiv, https://arxiv.org/html/2511.00751v2

Reevaluating Self-Consistency Scaling in Multi-Agent Systems - arXiv, https://arxiv.org/html/2511.00751v1

Self-Consistency (SC) - Agentic Design, https://agentic-design.ai/patterns/reasoning-techniques/self-consistency

Scaling-LLM-Test-Time-Compute-Optimally-can-be-More-Effective, https://github.com/adikal25/Scaling-LLM-Test-Time-Compute-Optimally-can-be-More-Effective-than-Scaling-Model-Parameters

Confidence Improves Self-Consistency in LLMs - arXiv, https://arxiv.org/html/2502.06233v2

Universal Self-Consistency for Large Language Model Generation, https://www.alphaxiv.org/abs/2311.17311

arXiv:2310.07088v2 [cs.CL] 23 Feb 2024 - Besmira Nushi, https://besmiranushi.com/docs/diversity_of_thought_llms_2023.pdf

Universal Self-Consistency - Learn Prompting, https://learnprompting.org/docs/advanced/ensembling/universal_self_consistency

arXiv:2311.17311v1 [cs.CL] 29 Nov 2023, https://arxiv.org/pdf/2311.17311

Scalable Best-of-N Selection for Large Language Models via Self, https://proceedings.neurips.cc/paper_files/paper/2025/file/1c7eff166a8e345f664f0faa8f4e4d2e-Paper-Conference.pdf

Improving Factuality and Reasoning in Language Models through, https://ar5iv.labs.arxiv.org/html/2305.14325

arXiv:2305.14325v1 [cs.CL] 23 May 2023, https://arxiv.org/pdf/2305.14325

(PDF) Improving Factuality and Reasoning in Language Models, https://www.researchgate.net/publication/370981457_Improving_Factuality_and_Reasoning_in_Language_Models_through_Multiagent_Debate

Encouraging Divergent Thinking in Large Language Models through, https://www.chapterpal.com/s/6ndots1u/encouraging-divergent-thinking-in-large-language-models-through-multi-agent-debate

Encouraging Divergent Thinking in Large Language Models through, https://arxiv.org/html/2305.19118v4

Anonymization for Bias-Reduced Multi-Agent Reasoning - arXiv, https://arxiv.org/html/2510.07517v3

How Sycophancy Shapes Multi-Agent Debate - arXiv, https://arxiv.org/html/2509.23055v1

Measuring and Mitigating Identity Bias in Multi-Agent Debate via, https://arxiv.org/html/2510.07517v1

Encouraging Divergent Thinking in Large Language Models through, https://arxiv.org/abs/2305.19118

Mixture-of-Agents Enhances Large Language Model Capabilities, https://www.alphaxiv.org/abs/2406.04692

Mixture-of-Agents Enhances Large Language Model Capabilities, https://www.researchgate.net/publication/381294672_Mixture-of-Agents_Enhances_Large_Language_Model_Capabilities

arXiv:2404.18796v2 [cs.CL] 1 May 2024, https://arxiv.org/pdf/2404.18796

arXiv:2308.07201v1 [cs.CL] 14 Aug 2023, https://arxiv.org/pdf/2308.07201

Evaluating LLM Generations with a Panel of Diverse Models, https://www.semanticscholar.org/paper/Replacing-Judges-with-Juries%3A-Evaluating-LLM-with-a-Verga-Hofst%C3%A4tter/1a9d2a8093d2886b27e5854c1f20d873f02edfb0

Weak judges, strong panel: an ensemble approach to LLM eval, https://orq.ai/blog/llm-juries-in-practice

Replacing LLM Judge with Juries: Example | by Sulbha Jain | Medium, https://sulbhajain.medium.com/replacing-llm-judge-with-juries-example-97bb63d4a376

ChatEval: Towards Better LLM-based Evaluators through Multi, https://www.alphaxiv.org/abs/2308.07201

Scaling LLM Test-Time Compute Optimally can be More Effective, https://www.alphaxiv.org/abs/2408.03314

GitHub - js-lee-AI/awesome-llm-agent-papers: A curated, https://github.com/js-lee-AI/awesome-llm-agent-papers

Scaling Test-time Compute for LLM Agents - arXiv, https://arxiv.org/html/2506.12928v1

Agentless: Demystifying LLM-based Software Engineering Agents, https://www.facebook.com/groups/MontrealAI/posts/1923289734799516/

Agent-Computer Interfaces Enable Automated Software Engineering, https://neurips.cc/virtual/2024/poster/93753

Understanding the Architecture of Coding Agents - arXiv, https://arxiv.org/html/2608.10934v1

Demystifying LLM-Based Software Engineering Agents: A Review of, https://journal.duc.edu.iq/index.php/djst/article/download/828/620

Inside the Scaffold: A Source-Code Taxonomy of Coding Agent, https://arxiv.org/html/2604.03515v2

Agentless: Demystifying LLM-based Software Engineering Agents, https://huggingface.co/papers/2407.01489

Agentless :Demystifying LLM-based Software Engineering Agents, https://arxiv.org/html/2407.01489v2

Repository map - Aider, https://aider.chat/docs/repomap.html

I agree that many AI coding tools have rushed to adopt naive RAG, https://news.ycombinator.com/item?id=41002519

Context Compaction Theory - arXiv, https://arxiv.org/html/2608.01326v1

Theory of Code Space: Do Code Agents Understand ... - arXiv, https://arxiv.org/html/2603.00601v3

GPT code editing benchmarks | aider, https://aider.chat/docs/benchmarks.html

Aider LLM Leaderboards, https://aider.chat/docs/leaderboards/

GitHub - aorwall/moatless-tools, https://github.com/aorwall/moatless-tools

moatless - PyPI, https://pypi.org/project/moatless/

Agent-Computer Interfaces Enable Automated Software Engineering, https://images.examples.com/wp-content/uploads/2026/08/SWE-AI-Agent-for-Software-Engineering.pdf

agent-computer interface — The Library - AI Research Center, https://airesearchcenter.org/term/agent-computer-interface

SWE-agent, End to End: The Interface Behind 12.5% - YouTube, https://www.youtube.com/watch?v=SVfF6VVmLjo

SWE-agent — Deep Dive &amp; Build-Your-Own Guide - DEV Community, https://dev.to/truongpx396/swe-agent-deep-dive-build-your-own-guide-ade

Writing effective tools for AI agents—using AI agents - Anthropic, https://www.anthropic.com/engineering/writing-tools-for-agents

AGENTS.md patterns for context engineering in coding ... - GitHub, https://github.com/Austin1serb/agents-md

Iterating with shadow workspaces - Cursor, https://cursor.com/blog/shadow-workspace

️ Cursor (Anysphere) - AI Engineer Interview Questions - GitHub, https://github.com/ombharatiya/AI-Engineer-Interview-Questions/blob/main/14-company-interview-questions/cursor-anysphere.md

How Cursor built Fast Apply using the Speculative Decoding API, https://fireworks.ai/case-study/cursor

Designing high-performance agentic systems (an architectural case, https://medium.com/@khayyam.h/designing-high-performance-agentic-systems-an-architectural-case-study-of-the-cursor-agent-ab624e4a0a64

Cursor: The Team and Vision Behind the AI Coding Tool - Medium, https://medium.com/@elekchen/cursor-another-illustration-of-simplicity-and-purity-2d565372e884

Agent-Computer Observation Interfaces Enable Dynamic ... - arXiv, https://arxiv.org/pdf/2606.29472

openai-cookbook/examples/codex/code_modernization.md at main, https://github.com/openai/openai-cookbook/blob/main/examples/codex/code_modernization.md

Harness Engineering — Quick Actionable Guide - DEV Community, https://dev.to/truongpx396/harness-engineering-quick-actionable-guide-2b93

I replicated Anthropic's Generator-Evaluator harness to build a, https://www.reddit.com/r/ClaudeAI/comments/1tf76wp/i_replicated_anthropics_generatorevaluator/

What is harness engineering? - Clifton Cunningham, https://cliftonc.nl/blog/what-is-harness-engineering/

From Sequential to Parallel: Building a Claude Code Harness, https://levelup.gitconnected.com/from-sequential-to-parallel-building-a-claude-code-harness-0a65ce89738a

HarnessDev: Can LLMs Create and Evolve Their Own Agent ... - arXiv, https://arxiv.org/html/2609.01437v1

claude-code-ultimate-guide/CLAUDE.md at main - GitHub, https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/CLAUDE.md

opencode-agents-and-commands-guide.md - GitHub, https://github.com/juliusz-cwiakalski/agentic-delivery-os/blob/main/doc/guides/opencode-agents-and-commands-guide.md

opencode-plugin · GitHub Topics, https://github.com/topics/opencode-plugin

GitHub - Nathandela/long-running-harness, https://github.com/Nathandela/long-running-harness

Harness design for long-running apps - Anthropic, https://www.anthropic.com/research/harness-design-long-running-apps

Customizing Modes | Roo Code Documentation - GitHub Pages, https://roocodeinc.github.io/Roo-Code/features/custom-modes/

[ENHANCEMENT] Move global custom_modes.yaml to ... - GitHub, https://github.com/RooCodeInc/Roo-Code/issues/10750

Roo Code: Comprehensive Knowledge Base, https://git.pratiknarola.com/nikhilmundra/RooPrompts/src/commit/eb26f4c714063a546294eaa322071741500cdc95/roo.md

Context engineering frames prompt engineering within system level, https://www.researchgate.net/publication/415345455_Context_engineering_frames_prompt_engineering_within_system_level_orchestration_for_large_language_model_applications

Prompt vs Context vs Harness Engineering: Key Differences - Atlan, https://atlan.com/know/harness-engineering-vs-prompt-engineering/

Context Engineering: From Prompts to Corporate Multi-Agent, https://www.alphaxiv.org/abs/2603.09619

Context Rot: Why LLMs Degrade as Context Grows (+ Fixes), https://upsolve.ai/blog/context-rot

Papers Explained 445: Context Rot - Ritvik Rastogi, https://ritvik19.medium.com/papers-explained-443-context-rot-4bbd72d77631

Context Rot: How Increasing Input Tokens Impacts LLM Performance, https://www.reddit.com/r/LocalLLaMA/comments/1m4fs2t/context_rot_how_increasing_input_tokens_impacts/

Classifier Context Rot: Monitor Performance Degrades with ... - arXiv, https://arxiv.org/html/2605.12366v1

[2608.01326] Context Compaction Theory - arXiv, https://arxiv.org/abs/2608.01326

Memory compaction for agents has an information-theoretic floor, https://news.ycombinator.com/item?id=49513338

Weekly AI Wrap | August 10 to 16, 2026: Scaffolding, Scrutiny, https://www.nextmoca.com/blog/weekly-ai-wrap-aug-10-16-2026/

Simple Observation Masking Is as Efficient as LLM Summarization, https://arxiv.org/html/2508.21433v1

GitHub - awesome-opencode/awesome-opencode: A curated list of, https://github.com/awesome-opencode/awesome-opencode

Plugins - OpenCode, https://opencode.ai/docs/plugins/

The Complete Guide to CLAUDE.md — Make Claude Code Truly, https://medium.com/@n913239/the-complete-guide-to-claude-md-make-claude-code-truly-understand-your-project-d9d026b808f1

The Ultimate Guide to CLAUDE.md in 2026 - Buildcamp, https://www.buildcamp.io/guides/the-ultimate-guide-to-claudemd

How to distinguish between Cursor's Rules and Skills - note, https://note.com/kitokitoworld/n/n352e455ae70b?hl=en

CLAUDE.md Hierarchy, Scoping, and Modular Organisation, https://claudecertificationguide.com/learn/3-claude-code-config/3-1-claude-md-hierarchy

AI-Readable Documentation Templates [2026] - Kunal Ganglani, https://www.kunalganglani.com/blog/documentation-ai-tools-use

What Is CLAUDE.md? A Guide for API Documentation Teams, https://readme.com/blog/what-is-claude-md

Teaching Claude Code How You Work: CLAUDE.md in Practice, https://dev.to/gunnargrosch/teaching-claude-code-how-you-work-claudemd-in-practice-21d9

Best AGENTS.md Examples for Codex, Cursor, and AI Coding, https://promptessor.com/blog/best-agentsmd-examples-for-codex-cursor-and-ai-coding-agents-in-2026

AGENTS.md, https://agents.md/

AGENTS.md SPEC for OpenAI Codex - GitHub Gist, https://gist.github.com/dpaluy/cc42d59243b0999c1b3f9cf60dfd3be6

What Is the LLM Knowledge Base Index File? How Agents Navigate, https://www.mindstudio.ai/blog/llm-knowledge-base-index-file-no-vector-search

Code Wiki: LLM-Maintained Documentation for Your Codebase, https://medium.com/@dipakkrdas/code-wiki-llm-maintained-documentation-for-your-codebase-fc54f94bef6d

Docs for agents | Nimbus, https://nimbus-docs.com/ai/docs-for-agents/

Cursor Rules, Skills, and Commands, Oh My! When to Use Each, https://www.ibuildwith.ai/blog/cursor-rules-skills-and-commands-oh-my-when-to-use-each/

Rules | Cursor Docs, https://cursor.com/docs/rules

How do you organize your Cursor rules? - Reddit, https://www.reddit.com/r/cursor/comments/1q9wxk2/how_do_you_organize_your_cursor_rules/

Building-applications-and-agents-with-OpenAI-codex - GitHub, https://github.com/PacktPublishing/Building-applications-and-agents-with-OpenAI-codex/blob/main/AGENTS.md

Hermes Agent — Open-Source AI Agent with Persistent Memory, https://www.hermes-agent.org/

Context Engineering | Product Map AI, https://app.productmap.io/topic/context-engineering~9790eb70-f1dd-44f9-9098-7746d7f0cce3

Windsurf Rules - AI Coding Rules, https://aicodingrules.com/rules/windsurf

Support for different types of custom instructions - GitHub Docs, https://docs.github.com/en/copilot/reference/custom-instructions-support

Mastering Code Reviews with GitHub Copilot: The Definitive Guide, https://dev.to/pwd9000/mastering-code-reviews-with-github-copilot-the-definitive-guide-3nfp

Project Rules: Documented RULE.md folder format not working, only, https://forum.cursor.com/t/project-rules-documented-rule-md-folder-format-not-working-only-undocumented-mdc-format-works/145907

rulesync/skills/rulesync/SKILL.md at main · dyoshikawa/rulesync, https://github.com/dyoshikawa/rulesync/blob/main/skills/rulesync/SKILL.md

Nymor — one command to sync AI agent rules across Claude, https://www.reddit.com/r/GithubCopilot/comments/1unbvo0/nymor_one_command_to_sync_ai_agent_rules_across/

Constitutional AI: Harmlessness from AI Feedback - Rudrite Research, https://research.rudrite.com/constitutional-ai

Constitutional AI: Harmlessness from AI Feedback - arXiv, https://arxiv.org/html/2212.08073v1

Collapse-Resistant Constitutional AI for Small Language Models, https://cs224r.stanford.edu/projects/pdfs/Xue%20Zhang%20submission_416334596/cs224r_final__1_.pdf

Constitution or Collapse? Exploring Constitutional AI with Llama 3-8B, https://arxiv.org/html/2504.04918v1

The Instruction Hierarchy: Training LLMs to Prioritize ... - Clio AI Labs, https://www.clioapp.ai/research/instruction-hierarchy

The Instruction Hierarchy: Training LLMs to Prioritize Privileged, https://arxiv.org/html/2404.13208v1

The Instruction Hierarchy: Training LLMs to Prioritize Privileged, https://www.alphaxiv.org/abs/2404.13208

The Instruction Hierarchy: Training LLMs to Prioritize Privileged, https://www.semanticscholar.org/paper/The-Instruction-Hierarchy%3A-Training-LLMs-to-Wallace-Xiao/f18e5a844c37e5342f8f3d409c74c1a9c91d1f8f

Breaking Instruction Hierarchy in OpenAI's gpt-4o-mini, https://embracethered.com/blog/posts/2024/chatgpt-gpt-4o-mini-instruction-hierarchie-bypasses/

CVE-2025-61593 Detail - NVD, https://nvd.nist.gov/vuln/detail/CVE-2025-61593

Claude Code as an Attack Vector When Your AI Developer Tool Is, https://www.softwareseni.com/claude-code-as-an-attack-vector-when-your-ai-developer-tool-is-the-entry-point/

Embrace The Red · Embrace The Red, https://embracethered.com/blog/

Understanding Prompt Injection Risks in Claude Code - TrueFoundry, https://www.truefoundry.com/blog/claude-code-prompt-injection

CVE-2026-39861: Anthropic Claude Code RCE Vulnerability, https://www.sentinelone.com/vulnerability-database/cve-2026-39861/

When the Safety Classifier Fails: Prompt Injection Defeats Claude, https://labs.cloudsecurityalliance.org/research/csa-research-note-claude-code-automode-prompt-injection-2026/

Documentation for pydantic-ai - GitHubのGist, https://gist.github.com/szeyu/e7c92f16ea721ba9ffbe472a127006f1

Pydantic AI でエージェントを作ってみる - Zenn, https://zenn.dev/finatext/articles/pydantic-ai-introduction

Introduction - Vibes Agent SDK, https://personal-b3af1c31.mintlify.app/introduction

PydanticAI vs OpenAI Agents SDK, https://agents-lib.com/compare/pydanticai-vs-openai-agents-sdk

LangGraph Human-in-the-Loop: Interrupt Patterns in Python - turion.ai, https://turion.ai/blog/langgraph-human-in-the-loop-interrupt-tutorial/

interrupt | langgraph - LangChain Reference, https://reference.langchain.com/python/langgraph/types/interrupt

HumanInTheLoopMiddleware - LangChain Reference, https://reference.langchain.com/python/langchain/agents/middleware/human_in_the_loop/HumanInTheLoopMiddleware

Human-in-the-loop - Docs by LangChain, https://docs.langchain.com/oss/python/deepagents/human-in-the-loop

Human-in-the-loop - Docs by LangChain, https://docs.langchain.com/oss/python/langchain/human-in-the-loop

archestra-ai/archestra: Enterprise AI Platform with guardrails, MCP, https://github.com/archestra-ai/archestra

Hands-on with Antigravity CLI - Google Codelabs, https://codelabs.developers.google.com/antigravity-cli-hands-on

Archestra - GitHub, https://github.com/archestra-ai

Open-source infrastructure for enterprise AI | Archestra, https://archestra.ai/

archestra-ai/examples - GitHub, https://github.com/archestra-ai/examples