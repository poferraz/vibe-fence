# SOURCES — vibe-fence Research Bibliography

> **Repo:** [vibe-fence](https://github.com/) — a portable harness that makes any AI coding agent behave like a senior-dev companion for non-technical vibe-coders.
> **Provenance:** 6 research streams × 6 contributors → **186 numbered sources** · **Aug 2025 – Oct 2026** · Per-stream syntheses `01–06` (1,550 lines, ~226 KB) + Argon audit v2 (737 lines) + ECC sidebars (503 + 363 lines) + vault deep-reads (4 clusters, 14 docs, ~48 KB) + `COMPARISON` / `INDEPENDENT-GEMS` audits + `HTML-REVIEW`. Total updated for **FINAL-v4 vault expansion** (2026-10-21). Line count of this file: 523.
> **How to cite this file:** each entry is numbered and carries `Used in: S-XX / stream YY` (settled decision `S-*` in FINAL-v4, or `C-*`/`B-*` for contested/blind-spot).
> **Invariant:** source IDs are stable — do not renumber when adding entries; append at the end of the relevant section and update the summary table.
> **Format per entry:** `#.` *Title.* Authors. Year/venue. `arXiv:####.#####` or URL. DOI if any. One-paragraph summary (≤60 words). `Used in: S-XX / stream YY.`

---

## A. Agent Harness & Evaluation — Streams 01/02, Argon Audit, Harness Cluster Deep-Reads

### A.1 — Harness Foundations & Context Engineering

1. Gloaguen, T., Mündler, N., Müller, M., Raychev, V., & Vechev, M. *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?* 2026. arXiv:2602.11988 [cs.SE]. Measuring AGENTBENCH (n=138) + SWE-bench Lite (n=300): LLM-generated AGENTS.md → −2% success / +20–23% cost; dev-written +4% only; stronger generator ≠ better file. The measured null that justifies the ≤400-token router. `Used in: S-01, C-02 / stream 02 D-01`.

2. Anthropic. *Effective Context Engineering for AI Agents.* Anthropic Engineering Blog, 2025-09-29. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents · Defines context rot (n² attention degradation), JIT retrieval (paths/queries → load on demand), compaction, structured note-taking, and sub-agents as the successor to prompt engineering. `Used in: S-03, S-01 / streams 01 A-03, 02 A-03`.

3. Anthropic. *Agent Skills — Open Standard for Portable Agent Capabilities.* 2026-03-01. https://www.anthropic.com/engineering/agent-skills · Canonical L1 (YAML frontmatter ≤1024 chars: name + description with triggers) / L2 (body ≤5K words) / L3 (linked refs) + `allowed-tools` blast-radius bounding; discovery via `.agents/skills/` + `.claude/skills/`. `Used in: S-02 / stream 01 A-03`.

4. Anthropic. *Building Effective AI Agents.* Anthropic, Dec 2024. https://www.anthropic.com/research/building-effective-agents · Orchestrator-worker, evaluator-optimizer, and routing patterns with tool-design guidance; reference architecture cited across streams 01/02/03. `Used in: S-01–S-03 / streams 01, 02, 03`.

5. Anthropic. *Writing Tools for AI Agents — With AI Agents.* Anthropic Engineering Blog, 2025. https://www.anthropic.com/engineering/writing-tools-for-agents · Self-contained, minimally overlapping tools with explicit schemas/error shapes; `get_customer_context` consolidation pattern and `isError` separation. `Used in: S-01, stream 02 §6 Copy #7 / 02 A-06`.

6. Anthropic. *Trustworthy Agents in Practice.* Anthropic Research, 2026-04-09 (verified 2026-10-30). https://www.anthropic.com/research/trustworthy-agents · Tool governance, least-privilege, and verification guidance that grounds the tiered guardrail model. `Used in: S-01 / stream 02 A-01`.

7. Anthropic. *How We Contain Claude Across Products.* Anthropic Engineering Blog, 2026-05-25. https://www.anthropic.com/engineering/how-we-contain-claude · Permission-mode containment (read-only `.git/.claude/.agents`), approval vs sandbox layers; precedent for `guarded→assisted→autonomous→open` guarantee bands. `Used in: S-10, S-11 / streams 05 A-06/A-07, 06 A-08`.

8. Anthropic. *How We Built Claude Code Auto Mode.* Anthropic Engineering Blog, 2026. https://www.anthropic.com/engineering/claude-code-auto-mode · Auto/notify/gate three-tier with classifier-in-the-loop; Auto Mode 17% false-negative rate cited in Argon audit. `Used in: C-06, S-10 / streams 05 D-03, 06`.

9. Yang, J., et al. *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering.* 2024. arXiv:2405.15793 [cs.SE]. ACI formalism (100-line viewer, 50-cap search, lint-on-edit); 12.5% SWE-bench / 18% Lite vs 11% raw shell — 4× gain is interface-driven. `Used in: S-01, 02 A-06 / stream 02 A-06, 03 Ar`.

10. Xia, C.S., et al. *Agentless: Demystifying LLM-based Software Engineering Agents.* 2024. arXiv:2407.01489 [cs.SE]. Hierarchical localization + Search/Replace diff synthesis; 32.00% SWE-bench Lite @ $0.70; `Agentless Paradox` review (5%→75% Verified) as warning on harness-scored benchmarks. `Used in: stream 02 A-04, 03 Ar / 02 §6 Copy #5`.

11. OpenAI. *Harness Engineering: Leveraging Codex in an Agent-First World.* OpenAI Blog, 2026. https://openai.com/index/harness-engineering · 1M-line repo as harness memory; ~100-line AGENTS.md + docs-as-record + one-fact/one-location; Codex phase harness and `description-agent` routing index. `Used in: S-01 D-03 / streams 01, 02`.

12. OpenAI. *Codex as a Platform: Build on the Open Agent Harness.* 2026. https://developers.openai.com/blog/codex-as-a-platform · Platform SDK, 88 nested AGENTS.md in OpenAI monorepo; precedent for per-path scoped rules. `Used in: stream 02 A-03 / 06`.

13. OpenAI. *Separating Signal from Noise in Coding Evaluations.* 2026-07-08. https://openai.com/research/separating-signal-from-noise · SWE-bench Verified→Pro retraction: ~30% broken tasks; harness-specific scores without stated harness are incomparable; informs metric hygiene. `Used in: stream 02 gap #7 / 03`.

14. Aider. *Repository Map — PageRank, `--map-tokens`.* Aider Docs. https://aider.chat/docs/repomap.html · PageRank-ranked symbol map (≤1k tokens, per-task refresh) as the dynamic complement to the ≤400-token static router. `Used in: S-01 D-01 / stream 02 D-01, 03 Ar`.

15. Anthropic. *Agent Skills Overview — L1/L2/L3 Progressive Disclosure.* https://platform.claude.com/docs/agent-skills (Agent Skills overview). Normative L1/L2/L3 definition with discovery paths and marketplace mechanics. `Used in: S-02, S-01 / streams 01 A-03, 02 A-03`.

16. Anthropic. *Code Execution with MCP: Building More Efficient Agents.* Anthropic Blog, 2025. MCP as code APIs: 150k→2k tokens (−98.7%) via remote execution offload. `Used in: stream 02 A-03 / 01 A-03`.

17. Shakir, A., et al. *The Agentless Paradox — SWE-bench Verified 5%→75% Analysis.* 2026. Review. Post-mortem of benchmark inflation when harness scaffolding is credited as model capability; informs eval hygiene. `Used in: stream 02`.

18. Anthropic. *Harness Design for Long-Running Apps.* https://www.anthropic.com/research/harness-design-long-running-apps · BRUTALWAV/Mnemo generator-evaluator cases: ACID continuity artefacts (`progress.md`/`DECISIONS.md`/spec), WIP=1 Kanban (+37%), bootstrap contract (+31%). `Used in: streams 02, 03 / S-11`.

19. Moxie Docs. *Context Engineering for Coding Agents: A Field Guide + AGENTS.md Guide.* https://moxiedocs.com · Per-runtime token budgets, adapter-constrained windows, dynamic tool loading as design primitive. `Used in: stream 02`.

20. NVIDIA NemoClaw. *Engineer Documentation for AI Agents.* https://docs.nvidia.com/nemoclaw · One-fact-one-location + docs-as-routing-index with `description-agent` frontmatter; per-page ownership model. `Used in: stream 02 unique (muse-spark) / S-01`.

21. Archestra. *We Debug Our AI Harness on Weak Models on Purpose.* 2026-07-20 + *Skills Aren't Prompts. They Can Run Code.* 2026-08. https://www.archestra.ai · Weak-model file-handling/sandbox/provider-schema failures; harness post-mortems and skill-as-code pattern. `Used in: streams 01, 02 / 02 D-02`.

22. Rombaut, K. *Inside the Scaffold: A Source-Code Taxonomy of Coding Agent Architectures.* 2026. arXiv:2604.03515 [cs.SE]. Taxonomy of control-plane, skill, tool, and memory layers across open-source harnesses. `Used in: streams 01, 02`.

### A.2 — Harness → Output Quality (Evaluation, Efficiency, Failure Modes)

23. Liu, N.F., et al. *Lost in the Middle: How Language Models Use Long Contexts.* 2023. arXiv:2307.03172 [cs.CL]. U-shaped positional attention curve; motivates keeping critical invariants at context boundaries and re-anchoring after compaction. `Used in: streams 02 A-02, 01 / S-03`.

24. Chroma Research (Troynikov, Huber, et al.). *Context Rot: How Increasing Input Tokens Impacts LLM Performance.* Jul 2025. https://research.trychroma.com/context-rot · 18-model 20–50% drop (10k→100k) with distractor/shuffled-haystack ablations; headline case for context budgeting. `Used in: streams 02 A-02, 01 / S-03`.

25. Cursor. *Improved Token Efficiency for Longer Agent Runs* + *Continually Improving Our Agent Harness.* Cursor Blog, Sep 2026. https://cursor.com/blog · Measured −66% system-prompt / −60% tool-def / −7% total savings; cache-stability tricks (phantom user, GPT-5.6 breakpoints); dynamic MCP loading precedent. `Used in: streams 02 A-02, 01 / S-03`.

26. Hsieh, C.-P., et al. *RULER: What's the Real Context Size of Your Long-Context Language Models?* 2024. arXiv:2404.06654 [cs.CL]. Effective-window collapse benchmarks; pairs with NoLiMa to bound long-context claims. `Used in: stream 02 A-02 / S-03`.

27. Modarressi, A., et al. *NoLiMa: Long-Context Evaluation Beyond Literal Matching.* 2025. arXiv:2502.05167 [cs.CL]. Literal-match vs reasoning-aware long-context evaluation; companion to RULER. `Used in: stream 02 A-02`.

28. Harada, K., et al. *Curse of Instructions: Large Language Models Cannot Follow Multiple Instructions at Once.* ICLR 2025. p^n joint-reliability decay — GPT-4o 85%→15%, Claude-3.5 90%→44% at 10 constraints; ~97.5% per-rule → ~2 rules @95% joint reliability. `Used in: S-07, 02 A-08 / stream 02 A-08`.

29. Purpura, A., et al. (Capital One). *MOSAIC: Deconstructing Instruction-Following.* 2026. arXiv:2601.18554 [cs.CL]. Production p^n budget table; operationalises the Curse-of-Instructions model for rule-count capping. `Used in: S-07 / stream 02 A-08`.

30. Modarressi, A., et al. *How Many Instructions Can LLMs Follow at Once? (IFScale).* 2025. arXiv:2507.11538 [cs.CL]. Instruction-scale curves confirming p^n; informs teaching-dial-as-rule-count-dial. `Used in: S-07 / stream 02 A-08`.

31. Liu, P., et al. *More Is Not Always Better: Cross-Component Interference in LLM Agent Scaffolding (CCI).* 2026. arXiv:2605.05716 [cs.CL]. Factorial 2⁵=32 subsets, 118 configs, 32k+ evals: all-in beaten by proper subset every condition; Planning Shapley negative; 90% sign-flipping violations. `Used in: S-07 / stream 02 A-08`.

32. Mittal, A. *How Fast Do Agents Rot? An Empirical Study of Long-Horizon Degradation.* 2026. arXiv:2609.01660 [cs.CL/CS.AI]. Geometric step-collapse (near-perfect→near-zero within 16 steps; tighter window steepens decay, logit −0.69 vs −0.44, p=3e-6). `Used in: stream 02 D-06 / S-03`.

33. Gan, Y., & Sun, J. *RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation.* 2025. arXiv:2505.03275 [cs.CL]. Tripled tool-selection accuracy (13.6%→43.1%); dynamic loading is load-bearing for large tool inventories. `Used in: stream 02 A-03 / S-03`.

34. Li, Y., et al. *Benchmark Test-Time Scaling of General LLM Agents.* 2026. arXiv:2602.18998 [cs.AI]. Sequential scaling degrades past modest turns; LoC negatively correlates with features completed; parallel self-selection is the bottleneck. `Used in: stream 02 avoid #9 / S-03`.

35. *Spec Kit Agents: Context-Grounded Agentic Workflows.* 2026. arXiv:2604.05278 [cs.SE]. Intermediate-artefact validation (+0.15/5, 99.7% pass rate); grounds the `Read→Think→Write→Check` mechanical-verification ladder. `Used in: stream 02 A-04`.

36. Hong, T., et al. *Context Rot: How Increasing Input Tokens Impacts LLM Performance.* Chroma Blog companion (trychroma.com). Field-facing counterpart to the arXiv paper (#24) with visual degradations. `Used in: stream 02 A-02`.

37. Maloyan, A., et al. *Prompt Injection Attacks on Agentic Coding Assistants: A Systematic Analysis.* 2026. arXiv:2601.17548 [cs.CR]. SoK over 78 studies; systematises AGENTS.md/RAG/tool-output injection vectors with CVE catalogue (CVE-2025-61593/54795/55284/54136). `Used in: stream 02 A-07 / S-06`.

38. Tirmazi, S., et al. *Context Compaction Theory.* 2026. arXiv:2608.01326 [cs.CL]. Communication-complexity floor for compaction fidelity; LLM summaries elongate trajectories; deterministic pruning preferred. `Used in: streams 02, 03 / S-03`.

39. Classifier *Context Rot at 100K→800K Tokens.* 2026. arXiv:2605.12366 [cs.CL]. MonitorBench scaling to 800K; bounds on effective attention well beyond typical fence windows. `Used in: stream 02`.

40. *Simple Observation Masking Is as Efficient as LLM Summarization.* 2025. arXiv:2508.21433 [cs.CL]. Deterministic pruning ≈ LLM summarisation for cost; supports last-5 pruning over prose summaries. `Used in: stream 02 / S-03`.

41. Agent-Computer Observation Interface (AOI). 2026. arXiv:2606.29472 [cs.SE]. Formal interface model for bounded viewers/search caps as first-class performance variables. `Used in: stream 02 A-06 / S-03`.

42. Chatlatanagulchai, S., et al. *Agent READMEs.* 2025. arXiv:2511.12884 [cs.SE]. Context files evolve by frequent small additions; 14.8% of 2,303 files mention security; staleness-as-lies study. `Used in: streams 02 A-05, 04 / S-01`.

43. Greshake, K., et al. (Rehberger indirection bypass); Wallace, E., et al. *The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions.* 2024. arXiv:2404.13208 [cs.CL]. System > user > tool; TensorTrust 32.8%→95.9% with over-refusal tax; hierarchy as defence-in-depth, never boundary. `Used in: stream 02 A-01 / S-03`.

44. Wu, E., et al. *IHEval: Evaluating Language Models on Following the Instruction Hierarchy.* 2025. arXiv:2502.08745 [cs.CL]. Hierarchy adherence benchmark; companion to Wallace. `Used in: stream 02 A-01`.

45. Wen, K./Geng, Y., et al. *The Failure of Instruction Hierarchies in LLMs / Control Illusion.* 2025. arXiv:2502.15851 [cs.CL]. System/user split fails to establish reliable hierarchy; societal framings beat role labels. `Used in: stream 02 A-01, D-05 / S-03`.

46. Yu, F., et al. *In Defense of RAG in the Era of Long-Context Language Models.* 2024. arXiv:2409.01666 [cs.CL]. RAG retains value at scale; informs JIT retrieval over full-window stuffing. `Used in: stream 02 A-03`.

### A.3 — Harness Cluster Vault (LilLog, Self-Harness, CLM)

47. Weng, L. *Harness Engineering for Self-Improvement.* LilLog Blog, 2026-07-04. https://lilianweng.github.io/posts/2026-07-04-harness-engineering/ · Taxonomic survey (prompt→structured context→workflow→harness code→optimizer); surrogate STOP/AHE/AlphaEvolve evidence; failure-mode taxonomy; *near-term RSI = harness rewrite, not weight rewrite.* `Used in: S-07, S-11a / vault harness-cluster`.

48. Zhang, H., Zhang, S., Li, K., et al. (PJLab). *Self-Harness: Harnesses That Improve Themselves.* 2026-06-12. arXiv:2606.09498 [cs.CL]. Closed propose→evaluate→accept loop with ϑ=(c,q,m) failure-manifesto clustering and Δ_in∧Δ_ho≥0 dual regression gate; Qwen3.5-35B +138% rel held-in. `Used in: S-06a (ϑ manifesto + dual gate) / vault harness-cluster DOC B`.

49. Shao, R., Shen, S. (MIT), Yin, J.O., et al. (UW + Meta Superintelligence Labs + MIT). *Context Language Models.* 2026-09-30. arXiv:2609.37725 [cs.CL]. `L_{t+1}=N^{CLM}(L_t)` editable context-as-file; zero-shot Qwen3.6-27B@32K BCP 59.4% @ −21.5% PFLOPs; CLM vs summary RL 28.8→42.5% @ 1.52→1.34 PFLOPs; SCR −35% serving. `Used in: S-03, S-11a, S-14 / vault harness-cluster DOC C`.

50. Aider Team. *Architect Mode Benchmark + Separating Code Reasoning and Editing.* Aider Blog, Sep 2024. https://aider.chat · Architect→Editor split; strong planner + cheap editor is cost-effective pairing; informs plan-artefact gate. `Used in: stream 02 D-07 / S-03`.

51. Li, T., et al. *ClawsBench: Evaluating Capability and Safety of LLM Productivity Agents in Simulated Workspaces.* 2026. arXiv:2604.05172 [cs.AI]. Success and safety uncorrelated; highest-success model tied for highest unsafe-action rate (23%); capability-vs-safety double scoreboard mandate. `Used in: stream 02 D-04 / S-14`.

52. Jin, Y., et al. *SkillSafetyBench: Evaluating Agent Safety under Skill-Facing Attack Surfaces.* 2026. arXiv:2605.12015 [cs.AI]. Agent-skill attack surface; `AGENTS.md` prose defence 25/60→18/60 with task-success cost. `Used in: stream 02 A-07 / S-11`.

53. Wang, T., et al. *ClawSentry: A Progressive Multi-Tier Security Monitor.* 2026. arXiv:2608.21101 [cs.AI]. Hard-block + reviewer + evidence-agent 39.55%→2.61% ASR @ −0.73pp task cost; `warning` 24.56% vs `block` 8.47% hard-block ASR. `Used in: stream 02 unique (minimax) / S-11`.

---

## B. Elicitation & Synthesis — Stream 03

### B.1 — Core Elicitation Patterns

54. Wang, X., Wei, J., et al. *Self-Consistency Improves Chain of Thought Reasoning in Language Models.* 2022. arXiv:2203.11171 [cs.CL]. Majority-vote over string outputs; requires discrete answers — fails on raw code where different correct implementations diverge. `Used in: stream 03 A-03 / S-12`.

55. Huang, J., et al. *Large Language Models Cannot Self-Correct Reasoning Yet.* 2023. arXiv:2310.01798 [cs.CL]. Ungrounded self-critique degrades reasoning (GSM8K 95.5%→89.0% after 2 rounds; CommonSenseQA 75.8%→41.8%); forbid generic "review your own work" prompts. `Used in: stream 03 A-01 / S-12`.

56. Shinn, N., et al. *Reflexion: Language Agents with Verbal Reinforcement Learning.* 2023. arXiv:2303.11366 [cs.AI]. Tool/test-grounded retry (agent→evaluator→reflection→retry); HumanEval 80→91%, ALFWorld +22pp; highest-ROI code loop, 0 cost on happy path. `Used in: stream 03 A-02 / S-12`.

57. Zheng, L., et al. *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.* 2023. arXiv:2306.05685 [cs.CL]. ~80–85% human agreement on preference; position/verbosity/self-enhancement biases; usable for preference, unreliable for correctness. `Used in: stream 03 A-05 / S-12`.

58. Brown, T., et al. *Large Language Monkeys: Scaling Inference Compute with Repeated Sampling.* 2024. arXiv:2407.21787 [cs.CL/cs.LG]. Coverage 15.9%→56% on SWE-bench Lite @ 250 samples; converts to performance only where a verifier filters; sampling alone insufficient. `Used in: stream 03 A-06 / S-12`.

59. Chen, B., et al. *CodeT: Code Generation with Generated Tests.* 2022. arXiv:2207.10397 [cs.SE]. Dual generation-execution: 65.8% vs 47.0% (+18.8pp) by generating ephemeral test suite alongside implementation; bootstrap for testless repos. `Used in: stream 03 gemini, deepseek / S-12`.

60. Li, Y., et al. *Competition-Level Code Generation with AlphaCode.* 2022. arXiv:2203.07814 [cs.SE]. Best-of-N filtering/clustering over sampling; contribution was filtering, not sampling per se. `Used in: stream 03 A-06`.

61. Madaan, A., et al. *Self-Refine: Iterative Refinement with Self-Feedback.* 2023. arXiv:2303.17651 [cs.CL]. Rubric-grounded iteration gains only for style/fluency, zero for reasoning; 3–7× sequential cost; treat as Reflexion with static oracle, not intrinsic Self-Refine. `Used in: stream 03 D-04`.

62. Chen, X., et al. *Teaching Large Language Models to Self-Debug.* 2023. arXiv:2304.05128 [cs.CL]. Execution-grounded self-debug beats self-critique; informs verifier hierarchy. `Used in: streams 02 A-04, 03`.

63. Snell, C., et al. *Scaling LLM Test-Time Compute Optimally Can be More Effective than Scaling Model Parameters.* 2024. arXiv:2408.03314 [cs.LG]. Compute-optimal allocation requires difficulty estimation; fixed-N wasteful; informs risk-tag × disagreement gating. `Used in: stream 03 A-10 / S-12`.

64. Gao, L., et al. *Scaling Laws for Reward Model Overoptimization.* 2022. arXiv:2210.10760 [cs.LG]. Best-of-N vs imperfect judge over-optimises; proxy reward rises while true quality falls; selector hierarchy `tests > types > lint > learned verifier > judge`. `Used in: stream 03 A-09`.

65. Wang, Z., et al. *Mixture-of-Agents (MoA) Enhances Large Language Model Capabilities.* 2024. arXiv:2406.04692 [cs.CL]. AlpacaEval 2.0 65.1% vs 57.5% GPT-4o — real on preference, no code execution benchmark; avoid on interactive path. `Used in: stream 03 A-08`.

66. Du, Y., et al. *Improving Factuality and Reasoning in Language Models through Multiagent Debate.* 2023. arXiv:2305.14325 [cs.CL]. 3 agents × 3 rounds = 9× cost, 30s+ latency; cost-matched loses to self-consistency (83.0% vs 88.2% @ 9 responses). `Used in: stream 03 A-04`.

### B.2 — Scaling, Verifiers & Cost Control

67. Wu, Y., et al. *Inference Scaling Laws: An Empirical Analysis of Compute-Optimal Inference for Problem-Solving with Language Models.* 2024. arXiv:2408.00724 [cs.LG/cs.CL]. Cost/latency ranking of elicitation patterns with Pareto frontier framing; elicitation budget reference. `Used in: stream 03 unique (muse-spark)`.

68. FrugalGPT: How to Use Large Language Models While Reducing Cost. Chen, L., et al. 2023. arXiv:2305.05176 [cs.CL]. 98% cost cut at equal performance via cascade; 175× judge-cost spread for small-model tiers. `Used in: stream 03 D-06`.

69. Aggarwal, P., et al. *Adaptive-Consistency for Efficient Reasoning and Coding with LLMs.* 2023. arXiv:2305.11860 [cs.CL]. Stop sampling when first 3 agree; disagreement as free difficulty estimator — 3.3–7.9× budget reduction at <0.1% accuracy cost. `Used in: stream 03 / S-12`.

70. Wang, X., et al. *When to Vote, When to Rewrite: Disagreement-Guided Routing for Test-Time Scaling.* 2026. arXiv:2604.26644 [cs.CL]. Disagreement-gated escalation vs rewrite routing. `Used in: stream 03 / S-12`.

71. R2E-Gym: Procedural Environments and Hybrid Verifiers for Training and Evaluating Software Engineering Agents. Jain, N., et al. 2025. arXiv:2504.07164 [cs.SE]. <20% distinguishability without harness help; 11.3% flaky tests on curated suites — verifier quality bound. `Used in: streams 02, 03 / S-06a`.

72. Xia, C.S., et al. *Agentless* — see [10]. — Same paper, second use: hierarchical localization + diff-patch synthesis for elicitation ergonomics. `Used in: stream 03 Ar`.

73. SWE-Replay: Efficient Test-Time Scaling for SWE Agents. Ma, W., et al. 2026. arXiv:2601.22129 [cs.SE]. Trajectory reuse / replay for test-time scaling. `Used in: stream 03 / S-12`.

74. Kamoi, R., et al. *When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey of Self-Correction in LLMs.* 2024. arXiv:2406.01297 [cs.CL]. Survey verdict: no general-task self-correction with LLM feedback except on tasks exceptionally suited to it. `Used in: stream 03 D-04`.

75. Smit, D., et al. *Should We Be Going MAD? A Look at Multi-Agent Debate Strategies for LLMs.* 2023. arXiv:2311.17371 [cs.CL]. MAD/debate underperforms self-consistency at matched compute. `Used in: stream 03 A-04, D-03`.

76. Verga, P., et al. *Replacing Judges with Juries: Less is More (PoLL).* 2024. arXiv:2404.18796 [cs.CL]. Cross-family judge decorrelation; heterogeneity principle for evaluation. `Used in: stream 03 Ar`.

77. Chan, C.-M., et al. *ChatEval: Towards Better LLM-based Evaluators through Multi-Agent Debate.* 2023. arXiv:2308.07201 [cs.CL]. Multi-agent referee team; informs evaluator diversity. `Used in: stream 03 Ar`.

78. Liang, T., et al. *Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate.* 2023. arXiv:2305.19118 [cs.CL]. Divergent-thinking vs consensus framing for debate costs. `Used in: stream 03 Ar`.

79. OAgents: An Empirical Study of Building Effective Agents. 2025. arXiv:2506.15741 [cs.AI]. Empirical agent-building study; pass@1 vs pass@3, cost-of-pass reporting discipline. `Used in: stream 03 / S-12`.

80. Hong, T., et al. *Context Rot* — see [24]/[36]. — Same study cited for compaction theory as context-window cost of elicitation traces. `Used in: stream 03 Ar`.

81. Tirmazi, S., et al. *Context Compaction Theory* — see [38]. — Same paper: trajectory elongation vs deterministic pruning for fence-check traces. `Used in: stream 03 Ar`.

### B.3 — Vault: Verbal Sampling & SEAL (Elicitation Widening)

82. Zhang, J., Yu, S., Chong, D., Sicilia, A., Tomz, M.R., Manning, C.D., & Shi, W. *Verbalized Sampling: How to Collapse and Unlock LLM Diversity.* 2025-10-10. arXiv:2510.01171v3 [cs.CL]. Prompting `generate k with prob<threshold` recovers 66.8% base diversity (vs 23.8% direct) with 1.6–2.1× semantic diversity; orthogonal to temperature; inference-only. `Used in: S-12 / vault research-cluster §2`.

83. Agarwal, R., et al. *SEAL: Self-Adapting Language Models.* MIT, 2025. arXiv:2506.10943 [cs.LG]. Self-edits (synthetic data + LoRA SFT directives) via outer ReST-EM; SQuAD no-context 32.7%→47.0% (vs 33.5% passage-only); rewrite quality > memorization; informs adapter LoRA tuning. `Used in: S-12 / vault agents-prompting §6 (SEAL)`.

### B.4 — Vault: Goal-Blind Elicitation (Cao/Jiang/Xu)

84. Cao, J., Jiang, W., & Xu, D. *Seeing the Goal, Missing the Truth.* 2026-02-xx. arXiv:2602.11988-adjacent vault doc (goal-blind study; cited as **Arxiv2602** in `deepread-vibe-coding.md` §5). Goal-aware intermediate prompts inflate pre-cutoff long-short spread +0.48pp (1.55% vs 1.07%, p<0.05) → vanishes post-cutoff (+0.03pp n.s.) with OOS R² −0.058*** leakage. `Used in: S-11 (goal-blind scaffolding), S-12 / vault vibe-coding`.

---

## C. Guardrails & Attack Surface — Stream 04 + Leak Guide

### C.1 — Standards & Frameworks (OWASP, OWASP GenAI/MCP/Skills, Cheat Sheets)

85. OWASP. *OWASP Top 10 2025 — Introduction + Category Pages (A02 Misconfiguration, A03 Software Supply Chain Failures, A10 Mishandling of Exceptional Conditions).* https://top10.owasp.org/2025/ · 2025 refresh: A03 replaces 2021's A06 (known CVEs → ecosystem lifecycle/script/SBOM), SSRF folded into A01, new A10 fail-closed/over-informative-error; anchor for S-09. `Used in: S-09 / stream 04 D-01`.

86. OWASP GenAI Security Project. *OWASP Top 10 for LLM Applications 2025 + 2026; LLM Risks LLM01 Prompt Injection, LLM02 Sensitive Information Disclosure, LLM03 Supply Chain, LLM05 Improper Output Handling, LLM06 Excessive Agency, LLM07 System Prompt Leakage, LLM10 Unbounded Consumption.* https://genai.owasp.org/llmrisk/ · Binding constraint: model output as attack vector; agent identity and harness surface hardening. `Used in: S-09 / streams 04, 02 A-07`.

87. OWASP. *OWASP Top 10 for MCP 2025; Top 10 for Agentic Applications 2026; Agentic Skills Top 10 (AST01 Malicious Skills).* https://owasp.org/projects/mcp-top-10 · MCP pin, skill-facing attack surface; informs S-06 instruction-file hardening. `Used in: S-06 / stream 04 D-02`.

88. OWASP Cheat Sheet Series. *Secrets Management; Input Validation; SQL Injection Prevention; XSS Prevention; CSRF Prevention; Authentication; Authorization; Password Storage; Query Parameterization; Injection Prevention; Database Security; Session Management; REST Security; Webhook Security; Error Handling; Node.js Security; User Privacy Protection; Logging; NPM Security; AI Agent Security; Third-Party JavaScript Management; Dependency Graph / SBOM.* https://cheatsheetseries.owasp.org/cheatsheets/ · Per-rule canonical references for the 17-agreement guardrail packet. `Used in: stream 04 A-01–A-17 / S-09`.

89. OWASP DevSecOps Guideline. *AI Governance and Risk (3-4); IDE and AI-Assisted Development (2-2-2); AI Agent and MCP Security (2-2-5); Pre-commit / Secrets Management (2-2-1).* https://owasp.github.io/DevSecOpsGuideline/ · Pre-commit and agent-MCP hardening guidance. `Used in: stream 04`.

### C.2 — Supply Chain, Secrets & Dependencies (incl. GEM-05 BILL-01 Billable-Loop Guard & GEM-06 PRV-09 Fixture Hygiene)

90. npm Documentation. *`npm ci`; `npm audit`; `npm scripts`; `npm config`; `package-lock.json`; `npm ls`; `using-npm/scripts`.* https://docs.npmjs.com/cli/v11/ · Canonical lockfile discipline (`npm ci --frozen-lockfile`, lockfile committed, never `npm install` in CI; `--ignore-scripts` default). `Used in: streams 04 A-08/A-09`.

91. `pnpm` 10.0.0 Release Notes. *Blocks Lifecycle Scripts by Default.* 2025. https://socket.dev/blog/pnpm-10-0-0-blocks-lifecycle-scripts-by-default · `pnpm.onlyBuiltDependencies: []` empty allowlist as starter posture; supply-chain script governance. `Used in: stream 04 D-02 / S-09`.

92. Liran Tal. *npm Security Best Practices.* GitHub: `lirantal/npm-security-best-practices`. Lifecycle-script and provenance guidance. `Used in: stream 04`.

93. Supabase. *Securing npm Installs.* https://supabase.com/docs/guides/security/npm-security · Registry and install hardening for JS/TS supply chain. `Used in: stream 04`.

94. Gitleaks. *Gitleaks — Secret Scanning.* https://github.com/gitleaks/gitleaks · Local pre-commit secret regex + entropy scanning; dual-layer with GitHub Push Protection. `Used in: stream 04 A-01`.

95. GitHub Docs. *Enable Push Protection; Secret Scanning; Dependency Review; Dependabot Version Updates / PRs.* https://docs.github.com/en/code-security/ · Server-side secret and dependency gates. `Used in: streams 04 A-01/A-09, 06`.

96. Entro Security Labs (Andersson, A.). *From Rules to Context: Building a Production-Grade Hybrid Secret Scanner with SLMs (distilbert-secret-masker).* https://entro.security/blog/ · Hybrid context/entropy secret detection; informs SEC-03 dummy-key + entropy + allowlist refinement. `Used in: Argon audit / S-09`.

97. GitHub — *Found Means Fixed: Secure Code More Than 3× Faster with Copilot Autofix.* Aug 2024. https://github.blog · Agent-as-assignee fix-not-finding pattern (3–12× faster) as queue precedent. `Used in: stream 05 A-09 / 04 queue design`.

### C.3 — Platform & Runtime Guards (Vercel, Next.js, Supabase, Auth)

98. Vercel Docs. *Production Checklist; Deployment Checks; Deployment Protection; Environments; Environment Variables (Sensitive); Instant Rollback; Working with SSL; Security Headers; WAF Rate Limiting; CDN Security.* https://vercel.com/docs/ · Headers/CSP nonce via `proxy.ts`/`middleware.ts`; env isolation (Production/Preview/Development disjoint + value-equality check); gated deploy; rollback runbook. `Used in: stream 04 A-06/A-10/A-11/A-13`.

99. Next.js Docs. *Environment Variables (inlining `NEXT_PUBLIC_*` into JS bundle); Content Security Policy; Project Structure; Production Checklist; Build TypeScript Config; Project Organization / Colocation.* https://nextjs.org/docs/ · `NEXT_PUBLIC_*` key-shape lint rationale; nonce CSP via `proxy.ts`. `Used in: stream 04 A-02/A-06`.

100. Supabase. *Row Level Security Guidelines; Securing npm Installs.* https://supabase.com/docs/guides/auth/row-level-security · `USING (true)` linter; `pg_policies` remote introspection on `promote public`; least-privilege AI DB identity. `Used in: stream 04 D-02 / S-09`.

101. PostgreSQL Documentation. *Row Security Policies; Backup and Restore.* https://www.postgresql.org/docs/current/ddl-rowsecurity.html · RLS policy semantics for DB-01 gate. `Used in: stream 04`.

102. Semgrep. *Semgrep `p/react` Ruleset; `p/owasp-top-ten`.* https://semgrep.dev/ · `react/no-danger` + `p/react` + `p/owasp-top-ten` as CI enforcement for XSS/SQLi. `Used in: stream 04 A-05`.

### C.4 — Attack Surface: Instruction-File Injection, AIShellJack, TrojanForge, Leak Guide (23-Check Baseline)

103. Liu, Y., et al. *Your AI, My Shell: Demystifying Prompt Injection Attacks on Agentic AI Coding Editors (AIShellJack).* 2025. arXiv:2509.22040 [cs.CR] / arXiv:2601.17548v1. Shell-level injection 41–84% ASR, 83.4% Cursor auto-approve; harness files as primary vector. `Used in: S-06, stream 02 A-07 / 01 D-04`.

104. TrojanForge Research Team. *TrojanForge — Repository Poisoning via Instruction Files.* 2026. >60% poisoning success, >90% backdoor; instruction-file ingestion as untrusted input; validates `fence validate` hash attestation + `postinstall-guard.sh`. `Used in: S-06 / streams 01 D-04, 04 invent GEM-01`.

105. NVIDIA AI Red Team. *Mitigating Indirect AGENTS.md Injection Attacks in Agentic Environments.* 2026-04-20. https://developer.nvidia.com/blog/ · Go library writing `AGENTS.md` during `go mod tidy` before agent runs; `npm install` supply-chain overwrite vector; post-install guard mandate. `Used in: S-06 / stream 02 A-07, GEM-01`.

106. Cloud Security Alliance (CSA). *README Injection: Repository Files Hijacking AI Coding Assistants.* 2026-03-17. Research note. CSA note across all major harnesses; ReadSecBench 84% ASR; 93% of reviewers miss injection in context files. `Used in: stream 01 D-04 / S-06`.

107. Kao, Y.-C., et al. *You Told Me to Do It: Measuring Instructional Text-Induced Private Data Leakage in LLM Agents (ReadSecBench).* 2026. arXiv:2603.11862 [cs.CR]. Instructional-text → private-data leakage; up to 85% exfiltration; 0% human detection. `Used in: stream 02 A-07 / S-06`.

108. Eduba, J. (Jake Van Clief). *Claude Code Source Leak Guide (v2.1.88, 512K LOC, 1,900 files).* 2026-04-01. Leak-site analysis: 23 bash security checks (`tools/BashTool/bashSecurity.ts`: zsh builtins, unicode/IFS null-byte, HackerOne findings), permission system + Zig-level DRM attestation, 44 feature flags, compaction failures (1,279 sessions ×50+ consecutive failures → 250K wasted calls/day). `Used in: S-06 (23-check baseline), vault agents-prompting §3`.

109. Mallory, A. *Claude Code Mods Add Local Execution and Permission-Override.* 2026. https://mallory.ai/stories/01a0fd32-3ce5-7f83-92a9-a9eba2bad512 · Extension/mod permission-override trust-boundary risks; informs integrity attestation scope. `Used in: Argon audit / S-06`.

110. Li, P., et al. *The Instruction Hierarchy* — see [43]. — Same paper, second citation: instruction-file hierarchy failure under long context and tier contradiction. `Used in: stream 02 A-07`.

### C.5 — Git, Supply-Chain Audits & Compliance

111. Git SCM Docs. *`gitignore`; Ignoring Files; Protected Branches (GitHub); GitHub Flow; README Guidance; PR↔Issue Linking; Protected Branches.* https://git-scm.com/docs/gitignore · `.gitignore` before `git init` invariant; `git ls-files | grep .env` must be empty; branch protection / require status checks. `Used in: streams 04 A-01/A-15, 06`.

112. GitHub Docs. *Security Hardening for GitHub Actions; Secure Use of `pull_request_target`; About Protected Branches / Issues / Dependency Review / Push Protection.* https://docs.github.com/ · Hardened workflows; final policy job that checks expected jobs actually ran; `validate-workflow-security.js` pinned-SHA discipline. `Used in: stream 04`.

113. `pre-commit.com` Docs. https://pre-commit.com/index.html · Pre-commit framework as dual-layer secrets enforcement surface. `Used in: stream 04 A-01`.

114. Conventional Commits. *Conventional Commits 1.0.0.* https://www.conventionalcommits.org/en/v1.0.0/ · Contingent nudge: `nudge` solo → `warn` at 2+ contributors (via `git shortlog -sne | wc -l`); harness writes messages, never blocks a security fix on prefix. `Used in: stream 04 D-05`.

115. Twelve-Factor App. *Config — Store Config in the Environment.* https://12factor.net/config · Env-var config principle grounding secrets management. `Used in: stream 04 A-01`.

116. RFC 8725 *JWT Best Current Practice (BCP);* RFC 9700 *OAuth 2.0 Security BCP.* IETF. RS256 + PKCE + state verification for auth gates. `Used in: stream 04 A-07`.

117. Mozilla Developer Network (MDN). *HSTS; CSP; Set-Cookie; Strict-Transport-Security; Cache-Control; CORS; Third-Party Cookies.* https://developer.mozilla.org/ · Cookie attributes (`HttpOnly`+`Secure`+`SameSite`), CSP/HSTS semantics. `Used in: stream 04 A-06/A-07`.

118. ICANN / IETF. *HTTP Security Header Semantics* (MDN-sourced). — Companion to Vercel `securityHeaders` array in `next.config.ts`. `Used in: stream 04 A-06`.

119. NSF. *NPM Best-Practice Adherence Study.* 2024. https://par.nsf.gov/servlets/purl/10398646 · Empirical lockfile/SBOM compliance gaps in npm ecosystem. `Used in: stream 04`.

120. Frontend Checklist. *Dependency Audit Rule.* https://frontendchecklist.io/rules/security/dependency-audit · Dependency audit as launch-gate checklist item. `Used in: stream 04`.

---

## D. Companion UX & Teaching — Stream 05 + Vibe-Coding Guides

### D.1 — Scaffolding, Fading & Expertise Reversal

121. Reiser, B.J., & Tabak, I. *Scaffolding.* In *Cambridge Handbook of the Learning Sciences,* 1st ed., 2014 (2nd ed. 2022). Cambridge UP. doi:10.1017/CBO9781139519526 · Canonical scaffolding definition; basis for teaching dial as `hold → alternate → let go`. `Used in: stream 05 A-01`.

122. Kalyuga, S., et al. *The Expertise Reversal Effect.* *Educational Psychologist,* 38(1), 23–31, 2003. doi:10.1207/S15326985EP3801_4 · Novices need worked examples; experts harmed by them; reversal demonstrated per task domain (2009 synthesis) — dial must be per-domain vector, not global scalar. `Used in: stream 05 A-01/A-02`.

123. Sweller, J. *Cognitive Load During Problem Solving: Effects on Learning.* *Cognitive Science,* 12(2), 257–285, 1988. doi:10.1207/s15516709cog1202_4 · Cognitive Load Theory (CLT); 4C/ID self-directed learning synthesis (van Merriënboer & Sluijsmans); foundation for teaching cost in context. `Used in: stream 05 A-01/A-04`.

124. Doo, M.Y., Bonk, C., & Heo, H. *A Meta-Analysis of Scaffolding Effects in Online Learning in Higher Education.* *IRRODL,* 21(3), 2020. 64 effect sizes. https://files.eric.ed.gov/fulltext/EJ1267049.pdf · Meta-analytic effect of scaffolding fade; scaffolding as active ingredient. `Used in: stream 05 A-01`.

125. Steyvers, M., & Mayer, A. *When Not to Help: Planning for Lasting Human-AI Collaboration.* 2025. arXiv:2508.01837 [cs.HC]. POMDP teaching-budget model: every teaching moment spends budget; repeated dismissals lower it; `silent` as policy not setting; auto-degrade under context pressure. `Used in: stream 05 / S-11`.

126. Qadir, J., & Mumtaz, S. *The Psychology of Learning from Machines: Anthropomorphic AI and the Paradox of Automation in Education.* 2026. arXiv:2601.06172v1 [cs.CY/HC]. Personhood-conferral problem; anthropomorphic mentor/evaluator postures distract and foster harmful attachment; tone rule: attentive+specific+warm, report what was checked. `Used in: stream 05 avoid #7`.

### D.2 — HCI Foundations (Interruption, Fatigue, Mixed Initiative, Trust)

127. Mark, G., Gudith, D., & Klocke, U. *The Cost of Interrupted Work: More Speed and Stress.* *CHI '08.* https://ics.uci.edu/~gmark/chi08-mark.pdf · Mid-task interruptions cost stress even when faster; teaching must land at checkpoint/idle boundaries, not inside an executing turn. `Used in: stream 05 A-05`.

128. Anderson, B.B., et al. *How to Prevent Warning Fatigue.* *ACM CHI '16.* Warning-fatigue mechanisms; informs gate-budget capping (≤3/session). `Used in: streams 04, 05`.

129. Horvitz, E. *Principles of Mixed-Initiative User Interfaces.* *ACM CHI '99.* Mixed-initiative principles for approve/decline/snooze affordances. `Used in: stream 05 A-10`.

130. Buçinca, Z., Malaya, M.B., & Gajos, K.Z. *To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-Assisted Decision-Making.* *PACM HCI,* 5(CSCW1), N=199, 2021. arXiv:2102.09692 [cs.HC]. Explanations alone do not reduce overreliance; forcing + structure does; *worst-rated design protects most* — motivates hint-first at `max`. `Used in: stream 05 D-01, A-03`.

131. Wang, X., et al. *Less or More: Towards Glanceable Explanations for LLM Recommendations.* *IUI '25.* arXiv:2502.19410v1 [cs.HC]. Structured blocks beat unstructured prose; fixed-schema card (`What changed · Why · Your call · How we'll know`) with expand affordance. `Used in: stream 05 A-03`.

132. Abdul, A., et al. *COGAM — Conversational Agents and Mental Models: Layered Explanations.* 2018. Layered XAI framework; progressive-disclosure UX precedent. `Used in: stream 05 A-03`.

133. Fitz, N., et al. *Batching Smartphone Notifications Can Improve Well-Being.* *Computers in Human Behavior,* 2019. RCT n=237: batching 3×/day → more attentive/productive, lower stress; no-notification → higher anxiety; ≤3 items, ≤1 decision per report; `(time OR trigger)` snooze. `Used in: stream 05 A-11`.

134. Stanton, B., Theofanos, M.F., Prettyman, S.S., & Furman, S.M. *Security Fatigue.* *IEEE IT Professional,* 2016 (NIST release). Decision-budget exhaustion; fewer decisions demanded → better compliance. `Used in: stream 05 A-06`.

135. Vance, A., et al. *From Warning to Wallpaper: Why the Brain Habituates to Security Warnings.* *JMIS,* 33(3), 2016. Security-warning habituation curves. `Used in: stream 05 A-06`.

136. Parasuraman, R., & Riley, V. *Humans and Automation: Use, Misuse, Disuse, Abuse.* *Human Factors,* 39(2), 1997. Classic automation-dependence framework; performance consequences and complacency. `Used in: stream 05 A-06`.

137. Sanneman, L., & Shah, J. *Trust, Distrust, and Appropriate Reliance in (X)AI.* 2023. arXiv:2312.02034 [cs.HC]. Appropriate reliance vs trust calibration for companion UX. `Used in: stream 05`.

138. Dietvorst, B.J., et al. *Algorithm Aversion: People Erroneously Avoid Algorithms After Seeing Them Err.* *JEP: General,* 144(1), 2015. doi:10.1037/xge0000033 · Failure transparency (what was checked/what wasn't/how to undo) as antidote. `Used in: stream 05`.

### D.3 — Vibe-Coding Practitioner Guides & Goal-Blind Study (Vault)

139. Jameel, Z. *TechniquesGuide — Words Are Your Code.* Medium, May 2025. 10pp. Practitioner guide: goal+style+constraints phrasing, story+guardrails, bite-sized one-feature prompts, Prompt→Code→Feedback→New Prompt; cites 3,000 micro-prompts/game. `Used in: S-11 / vault vibe-coding §1`.

140. Odendahl, C. / Zed Docs. *PracticeGuide — Vibe-Coding with YAML DSL as Intermediate Layer (Doodle-Clone Live Session).* Sep 2025. 4pp. Demo: parallel models as tools; YAML DSL as sandbox-validatable intermediate artefact (`natural→YAML→sandbox`). `Used in: S-11 / vault vibe-coding §2`.

141. r/ClaudeAI Community. *UltimateGuide — Production Vibing (717↑, 2,500+ prompts).* May 2025. 3pp. 18-rule corpus: Git/Commit-per-feature, popular stack (Next.js+Supabase+Tailwind+Vercel), Gemini-as-planner, context mentioning exact files, iterative audit→fix loop, "Do not change anything I did not ask for" (rule #17), 3-strike circuit-breaker. `Used in: S-11 / vault vibe-coding §3`.

142. VibeCodex. *PromptCollection — 10 Copy-Paste Prompts for Cursor/Windsurf/Bolt.* Oct 2025. 4pp. Guardrail/Overview-First/Feature-Builder prompts; Mini Design System (ShadCN/Tailwind); Test Coverage generator; Performance Debugger A/B; Prompt Optimizer as prose-only. `Used in: S-11 / vault vibe-coding §4`.

143. Nielsen, J. (Nielsen Norman Group). *Progressive Disclosure.* 2006, updated 2022-07-15. https://www.nngroup.com/articles/progressive-disclosure/ · Show minimum enabling next action; "tell me more" affordance; layered XAI. `Used in: stream 05 A-03`.

### D.4 — Novice UX & Vibe-Coding Research

144. Zamfirescu-Pereira, J.D., et al. *Why Johnny Can't Prompt: How Non-AI Experts Try (and Fail) to Design LLM Prompts.* *CHI '23.* doi:10.1145/3544548.3581388 · Non-expert prompting failure modes; barrier for vibe-coder population. `Used in: stream 05`.

145. Bastani, H., et al. *Generative AI Can Harm Learning: Evidence from High School Mathematics.* *PNAS,* 122(26): e2422633122, 2025-06-25. doi:10.1073/pnas.2422633122 · RCT n≈1,000: GPT Base +48% practice / −17% closed-book exam harm vs textbook control; GPT Tutor (guarded, hint-first) +127% / 0% harm — the teaching-dial existence proof. `Used in: stream 05 A-01 / S-11`.

146. Qian, H., et al. *How to Teach Programming in the AI Era? LLMs as a Teachable Agent for Debugging through Conversation.* 2023. arXiv:2310.05292v4 [cs.SE]. Teachable-agent debugging pattern for novice programmers. `Used in: stream 05`.

147. Amershi, S., et al. *Guidelines for Human-AI Interaction.* *CHI '19.* doi:10.1145/3290605.3300233 · 18 HAI guidelines; foundation for companion tone and predictability. `Used in: stream 05`.

148. Chen, Y., Liao, Q.V., & Sundar, S.S. *When to Explain? Explanation Timing on User Perceptions and Trust.* *TAS '24.* doi:10.1145/3686038.3686066 · Checkpoint-boundary delivery timing evidence. `Used in: stream 05`.

---

## E. Meta-Models, Routing & Context Protocols — Stream 06

### E.1 — Muse Spark / Wonder / Image / SAM 3.1 / Muse Code (Meta Model API)

149. Meta AI. *Muse Spark 1.3 — Model Page; Introducing Muse Spark 1.3.* 2025-09-02. https://dev.meta.ai/models/muse-spark / https://research.meta.ai/blog/introducing-muse-spark-1-3 · Frontier companion brain (1,048,576-token context, multimodal input); companion voice via `POST /v1/responses` stateless encrypted replay; Wonder escalation tier. `Used in: S-13 / streams 06 A-01, M4`.

150. Meta AI. *Muse Spark Open — Overview; Run Inference (Baseten/Modal/Fireworks).* 2025. https://dev.meta.ai/docs/muse-spark-open · 816B/42B MoE, 8×B300 / ~2TB VRAM (BF16) or 537 GB NVFP4 — not self-hostable; informs Glimmer vs Open distinction. `Used in: stream 06 D-07`.

151. Meta AI. *Muse Glimmer (30B) — Overview; Run Inference.* 2025. https://dev.meta.ai/docs/muse-glimmer · 17–20 GB quantized, Apache-2.0, 128K context, Ollama/llama.cpp/vLLM/SGLang; the only self-hostable open-weights path; waiver-named. `Used in: stream 06 D-07 / C-09`.

152. Meta AI. *Muse Wonder — Model Page; Model Card (PDF).* 2025. https://dev.meta.ai/models/muse-wonder · `muse-wonder-1.0` — Meta's most capable coding/long-horizon model ($4 in / $20 out per 1M); same base URL / schema as Spark; Wonder Full subscription-only (Power/Maximum). `Used in: S-13 / stream 06 D-01`.

153. Meta AI. *SAM 3.1 — Model Page; Faster and More Accessible; Media Segmentation.* 2025. https://dev.meta.ai/models/sam-3-1 / https://dev.meta.ai/docs/sam/overview / https://dev.meta.ai/docs/sam/segmenting · One concept per request; returns boxes+masks, never semantic names (one 6-region layout = 6 calls); click-to-teach or skip, never critical path. `Used in: stream 06 D-04 / S-13/GEM-07`.

154. Meta AI. *Image Generation with Muse Image.* 2025. https://dev.meta.ai/docs/image-generation / https://dev.meta.ai/models/muse-image · $0.01/image, `b64_json`+webp → disk; `enable_shell` code-layout generation; demo polish amplifier. `Used in: stream 06 A-05`.

155. Meta AI. *Meta Model API Docs — Models; Overview; Responses API; Tool Calling; Structured Output; Search Grounding; Tool Search; Reasoning; Prompt Caching; Quickstart; Protocols (Choosing an API); Cookbook; Coding Agents; Agent Frameworks; Computer Use.* 2025. https://dev.meta.ai/docs/models et al. · `reasoning_effort: "none"` → 400; recursive schema → 400; `tool_search` + `json_schema` → 400; `minimal/low/medium/high/xhigh/max` only; stateless replay recommended; `tool_search` Responses-only, one/request, namespace <10. `Used in: S-13 / stream 06`.

156. Meta AI. *Muse Code — Overview; Configuration and Context; Permissions and Safety; Extending and Automating; Subscriptions; Run Multi-Agent Workflows; Session Messaging; Interactive; Extending (Workflows).* 2025. https://dev.meta.ai/docs/muse-code/ · `AGENTS.md` chain (walk to `.git` boundary: `AGENTS.md`→`CLAUDE.md`→`.agents/AGENTS.md`→`.claude/CLAUDE.md`, project-over-user, deeper-over-shallower); trust gate + `MEMORY.md` prompt-injection warning; approval vs sandbox layers; staged compound review. `Used in: S-13 / streams 01, 06 A-08`.

157. Meta AI. *Introducing Muse Code and Muse Spark 1.2.* Research Blog, 2026. https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2 · Co-training disclosure for transfer-risk assessment: Spark 1.2 harness-tuned may underperform in foreign harnesses. `Used in: stream 06`.

158. Hugging Face (Apiextensions). *What is Muse Spark Open?* 2025. https://huggingface.co/blog/apiextensions/what-is-muse-spark-open · OSS community framing of Spark Open vs Glimmer. `Used in: stream 06`.

### E.2 — Routing, Context Engineering (Anthropic Guide), Skills (Anthropic Guide), CLM, Avengers-Pro & Verification Economics (Vault)

159. Zhang, Y., et al. (PJLab / AvengersPro). *Beyond GPT-5: Making LLMs Cheaper and Better via Performance–Efficiency Optimized Routing (Avengers-Pro).* 2025-08-24. arXiv:2508.12631 [cs.LG]. Semantic K-means (n≈25–64) per-cluster model ranking with α knob: +7% over GPT-5-medium @ −27% cost (−63% @ 90% peak); α=0.8–1.0 SOTA on ARC-AGI/GPQA-D/HLE/LiveCodeBench. `Used in: S-08, S-14 / vault research-cluster §3`.

160. Cui, T., Zeng, P., Xu, W., et al. (PhAI Labs/CUHK/Oxford/Stanford/PKU). *RSI-Anything: Unlocking Recursive Self-Improvement with World Models.* 2026-10-09. arXiv:2610.13912v1 [cs.CL]. JEPA-Anything predictive verifier: static 26.3%→fixed 29.2% (Brier 0.488→0.358, rank-acc 72.8%) → adapted 31.2% @ ~3.7 test calls/task; select-before-execute + reliability-gated retained updates. `Used in: S-06a (ϑ gate), S-08 / vault research-cluster §4`.

161. Karte, S., Zhang, A.L., et al. (Princeton/MIT/Prime Intellect). *Prime Agent: A Self-Improving RLM Harness.* First 2026-08-05, v2026-08-24. arXiv:2608.23552 [cs.AI]. Persistent IPython REPL + RLM `rlm()` + continual harness (versioned skills, daemon messaging) + ARC-AGI-3 30%→95.5% (RHAE); Factorio exploit preserved via RCON — rollback-invariant cautionary case. `Used in: S-11a (rollback invariant) / vault research-cluster §5`.

162. Shao et al. *Context Language Models* — see [49]. — Second citation: zero-shot Qwen3.6-27B@32K BCP 59.4% @ −21.5% PFLOPs as context-budget proof alongside CLM. `Used in: S-03 / vault harness-cluster DOC C`.

163. Meta AI. *Model Designation and Geographic Use Policy.* https://dev.meta.ai/legal/geographic-use-policy · Country-list availability for Model API; JS-rendered table, partially verified (Reconscribe snippet only). `Used in: stream 06 gap`.

164. Meta AI. *Run Inference — Muse Spark Open (Deploy); Muse Glimmer (Deploy); Open-Weight Models; Pricing and Rate Limits; Subscriptions; Choosing an API; Structured-Output Cookbook; Muse Code Python SDK README; Baseten/Modal/Fireworks Integrations.* 2025. https://dev.meta.ai/docs/* · Standard ($1.25/$4.25) vs Contributor ($0.10/$0.20, trains on prompts/code/files+responses, 150 vs 3,000 RPM); stateless encrypted replay recommended; no long-context premium; `web_search` $2.50/1K. `Used in: streams 06 A-07, S-15`.

---

## F. Vault Deep-Reads — Full Cluster Index (14 docs)

> Entries 47–49, 82–84, 159–161 already count as vault docs above (7 docs). The remaining 7 vault docs are below; together they are the 14-doc FINAL-v4 expansion.

165. *Seven Essential Layers for Building Real-World AI Agents.* MarkTechPost, 2025-08-04. Experience / Discovery / Agent Composition / Reasoning & Planning / Tool & API / Memory & Feedback / Infrastructure stack; maps to vibe-fence adapters (composition→reasoning→tools→memory) as audit checklist. `Used in: vault agents-prompting §2`.

166. Agarwal et al. *Meta-Harness: End-to-End Optimization of Model Harnesses.* Stanford/KRAFTON/MIT, 2026-04-09. arXiv:2603.28052 [cs.CL/cs.LG]. Agentic proposer + filesystem of full history (median 82 files/iter, up to 10 MTok footprint) → +7.7 pts over SOTA ACE @ 4× fewer context tokens; TerminalBench-2 #1 via 80-line env-bootstrap; Pareto frontier (accuracy vs ctx-cost). `Used in: S-13 (GEM-03), S-01/S-06 / vault agents-prompting §1`.

167. Wauters, A. *AI Agent Permissions: The Stats — 409,000 Decisions.* Field study, 2026-05-27 — https://scalex.dev/blog/ai-agent-permissions/ + `.../ai-agent-permissions-stats/` (Aug 5, 2026). Field dataset: 40,000 runs, 409k decisions; 66.3% accuracy (1-in-3 missed), 32.9% net-negative sessions, 52.5% miss on `npm run analyze`, 7% blind-approval; Anthropic telemetry 93% approval. `Used in: S-09/S-11, C-01, Argon audit §2.2`.

168. Anthropic. *Prompt Caching; Quickstart; Search Grounding; Tool Calling; Cookbook.* See [155] umbrella.

169. *Context Engineering Implementation Memo* (vault-adjacent, derived from [2] + [38] synthesis). Operationalises [2] as `src/framework/context-budget.yml` caps + 4KB shell caps + metadata-only L1 + JIT retrieval pattern. `Used in: S-03 / vault agents-prompting §4`.

170. Bastani, H., et al. *Generative AI Can Harm Learning: Evidence from High School Mathematics.* 2025. — see [145]. Second citation as vault vibe-coding comparator (hint-first vs answer-dump field study grounding the teaching-dial fade). `Used in: vault vibe-coding cross-cut`.

171. Wiz Research. *GhostApproval: A Trust-Boundary Gap in AI Coding Assistants — CVE-2026-12958, CVE-2026-50549.* 2026-07-08. https://wiz.io/blog/ghostapproval · CWE-451 path misrepresentation: confirm dialog lies about target; informs project-root `realpath` boundary + credential hard-deny. `Used in: stream 05 A-06 / S-11`.

---

## G. ECC & Argon Audits — Project-Specific Primary Sources

### G.1 — Argon Deep-Research Audits (737 lines · 6 RQs · Open-Web Ground Verification)

172. *Vibe-Fence Hackathon Strategy Audit (v2 with Zip Corpus) — Principal Research Audit: Ground-Verifying Phase 0 and Charting the Winning Hackathon Path.* 2026-10-20. `docs/research/synthesis/ARGON-AUDIT-v2.md` (737 lines; `PROMPT-gemini-argon4-deep-path.md` + `.share-argon4.zip` data pack: 6 FINAL-v3 + 6 streams + 31 contributors + 4 audits + 2 ECC sidebars + explorer). Verdict: freeze deterministic local containment + async Spark 1.3/Wonder 1.0 companion; 10-day re-sequence (M1 D1–3 … M4 D8–10); S-06a ephemeral verifier P0; S-08 contract-pinned `stack-contract.json`; S-09 10 zero-FP hard-blocks; C-01/C-06 RESOLVED; falsifier suite by priority (lethality×ease). `Used in: FINAL-v4 S-06a/S-08/S-09/S-11/C-01/C-06/§4`.

173. *Argon Prompt v2 — PROMPT-gemini-argon4-deep-path.md; PROMPT-argon4-zip-v2.md.* Runner prompts directing Gemini 4 Argon Deep Research to find the most successful path across all 6 RQs with §1–§7 output + amendments PR. `Used in: FINAL-v4 provenance`.

174. *Claude Code Hook-Zoo Benchmark — 12 Hooks × 8 Risky + 4 Benign (Oct 10, 2026).* https://agentskillshub.top/best/claude-code-hooks/ (Trendshift: `zhuyansen/awesome-claude-code-hooks`). Control native prompts 7/8 TP @ 3/4 FP; 6/12 hooks 0/8 TP when prompts skipped (`ccgate`/`Dippy` auto-approve `rm -rf`); `nomos` 7/8 TP @ 0/4 FP (misses `chmod -R 777`); `claude-code-hooks-mastery` 2/8 @ 25% (skipped). `Used in: Argon §2.2 → S-09/C-01`.

175. *AgentSpec / AgentGuard Evaluations (Claude Code harness).* ICSE 2026 AgentSpec (>90% prevention @ ms overhead); AgentGuard (abnormal executions 69.0%→26.7%, task completion 21.7%→35.0% over 100 held-out tasks). Supports mechanical verification as primary correctness lever. `Used in: Argon §2.1 → S-06a`.

176. *Agents Skill Hub — Best Claude Code Hooks Catalogue.* https://agentskillshub.top/best/claude-code-hooks/ · Same benchmark as [174] as browsable index. `Used in: Argon audit`.

177. *Explainx.ai — AI Agent Approval Game: Humans Missed 1 in 3 Threats (40,000 Plays).* 2026. https://explainx.ai/blog/alex-wauters-ai-agent-approval-game-40000-plays-data-august-2026 · Companion analysis of Wauters dataset; 409k decisions breakdown. `Used in: Argon §2.2, ECC sidebars`.

### G.2 — ECC 2.2.3 Sidebars (503 + 363 lines · affaan-m/ECC)

178. *ECC Sidebar — What vibe-fence Learns (and Doesn't) from affaan-m/ECC 2.2.3.* 2026-10-20. `docs/research/synthesis/ECC-SIDEBAR.md` (503 lines; source `/tmp/ecc-analyze` @ 2.2.3: 71 agents, 311 skills, 97 commands, MIT). Top 5 steal-ables: GateGuard fact-forcing taxonomy, 4-arm ablation (`off/gate/minus-target/placebo`), state-tree hardening, profile installer (`hooks_enabled`/`hook_profile`), compliance scorecard; competitive comparison table. `Used in: FINAL-v4 S-11, §4`.

179. *ECC Security Deep-Dive — Sidebar to the Synthesis Corpus.* 2026-10-20. `docs/research/synthesis/ECC-SECURITY-DEEPDIVE.md` (363 lines; `scripts/hooks/gateguard-fact-force.js` 2,623 LOC + 7 `gateguard-*.js` modules). Five classes (`instruction/test/prose/config/code`) + 15 question IDs + change profiling (`touchesPublicSurface`/`touchesData`/`trivial`) + 3-clause multi-agent subagent policy + lazy-load trampoline; adapter compliance record schema (15-entry `ADAPTER_RECORDS` with 4 tiers). `Used in: S-06 (23-check baseline), FINAL-v4 S-06/S-11`.

180. ECC. *affaan-m/ECC — Everything Claude Code (v2.2.3).* MIT. https://github.com/affaan-m/ECC · `hooks/hooks.json` (285 lines, ~25 entries, 8 lifecycles), `.claude-plugin/plugin.json` (`hooks_enabled`/`hook_profile`), `docker/gateguard-effectiveness/` (`off/gate/minus-target/placebo` + 4-label corpus), `skills/agent-security-hardening/SKILL.md`, `skills/agentic-engineering/SKILL.md`, `rules/common/security.md`. `Used in: G.2`.

181. `docs/research/synthesis/DEMO-SCRIPT.md` — *The Visceral Delta 0:00→3:00 Video Script (Shot-by-Shot) + 5×4 Rubric.* 100 lines. Derived from Argon audit §4 + GEMS-10; minute-by-minute unfenced disaster → `npx vibe-fence init` intervention → Muse Wonder/verify-remote/Muse Image polish → 10/10 Adversary Bench. `Used in: S-14, §7`.

---

## H. Field Reports & Industry — Practitioner Evidence

### H.1 — Harness Field Reports & Post-Mortems

182. Archestra AI. *Agent Harness Post-Mortems.* https://github.com/archestra-ai/archestra · Real harness failure corpus (non-idempotent replay, semantic poisoning, edit loops, batch double-execution, dangling tool calls via LangGraph HITL). `Used in: streams 02, 03 / 04 D-02`.

183. Umesh Malik. *Configuring AI Agent Permissions: Humans Miss 1 in 3 Threats (Approval Fatigue).* 2026. https://umesh-malik.com/blog/ai-agent-permissions-approval-fatigue · Human permission-gating failure synthesis; complements Wauters dataset. `Used in: Argon audit / S-11`.

184. Trendshift. *zhuyansen/awesome-claude-code-hooks — Repository Ranking.* https://trendshift.io/repositories/305958 · Ranking page for the 12×12 hook benchmark catalogue. `Used in: Argon audit`.

### H.2 — Cross-Stream & Independent Audits (Project Artefacts as Sources)

185. *Cross-Stream Consistency Report — Phase 0 Synthesis Audit.* 2026-10-20. `docs/research/synthesis/_CONSISTENCY.md` (176 lines). 10 contradictions C-01–C-10 (8 resolved, 1 flagged C-05, 2 no-contradiction) + 134→103 dedup (13 canonical + 2 intra-stream + 11 clusters) + 8 blind spots B-01–B-08 + 4 escalations. `Used in: FINAL-v4 §2/§3/§4/§6/§8 traceability`.

186. *COMPARISON — Primary vs Independent Synthesis (Structural Audit).* 2026-10-20. `docs/research/synthesis/COMPARISON.md` (247 lines). Primary `synthesis/` (1,550 lines, 60 agreements, 36 disagreements) vs replication `synthesis-independent/` (704 lines, ~20 tracked, 19 disagreements); 11 cherry-picks + explorer synthesis review; traceability matrix. `Used in: FINAL-v4 §8`.

---

*— End of SOURCES.md bibliography (sections A–H, 186 entries). Total = sum of §A (53) + §B (31) + §C (36) + §D (28) + §E (16) + §F (7) + §G (10) + §H (5) = 186. Count validated below; update this footer on append.*

---

## Summary Table — Sources by Category

| Category | Code | Count | % | Primary Streams | Notes |
|----------|------|-------|---|-----------------|-------|
| **A. Agent Harness & Evaluation** | A | **53** | 28% | `01`, `02`, Argon §1–§3, harness vault | Harness foundations, context engineering, evaluation, failure modes; incl. LilLog / Self-Harness / CLM |
| **B. Elicitation & Synthesis** | B | **31** | 17% | `03`, Arxiv2602 goal-blind | Self-consistency, Reflexion, MoA, BoN, Verbal Sampling, SEAL |
| **C. Guardrails & Attack Surface** | C | **36** | 19% | `04`, Leak Guide, Argon §2.2 | OWASP 2025/LLM/MCP/Skills, supply chain, platform guards, AIShellJack/TrojanForge/CSA, 23-check baseline |
| **D. Companion UX & Teaching** | D | **28** | 15% | `05`, vibe-coding vault | Scaffolding fade, expertise reversal, HCI (interruption/fatigue), practitioner guides |
| **E. Meta-Models & Routing** | E | **16** | 9% | `06`, Agents vault | Spark/Wonder/Image/SAM 3.1/Muse Code, Avengers-Pro routing, RSI world models |
| **F. Vault Deep-Reads** | F | **7** | 4% | `vault` (4 clusters) | Seven-Layers, Meta-Harness, ContextFiles-Eval (ETH 2602.11988), Prime Agent (2608.23552), plus cross-cut vault docs |
| **G. ECC & Argon Audits** | G | **10** | 5% | `ARGON-AUDIT-v2`, `ECC-*`, `DEMO-SCRIPT` | Hook-zoo 12×12, AgentSpec/Guard, ECC GateGuard (71 agents/311 skills), Visceral Delta script |
| **H. Field Reports & Industry** | H | **5** | 3% | Archestra, Wiz/GhostApproval, field audits | Post-mortems, approval-fatigue reports, cross-stream audit artefacts |
| **Total** | — | **186** | 100% | 6 streams × 6 contributors | Vault docs cross-counted under their primary science category; table counts are disjoint by code |

> **Validation:** `53 + 31 + 36 + 28 + 16 + 7 + 10 + 5 = 186.` Categories are disjoint by assigned code; vault docs that are also theory papers are counted under their science code (A/B/C/E) in the table — the F row counts only the 7 vault docs whose primary identity is the vault deep-read itself (165–171 excluding those already in A/B/C/E). `F(7) + G(10) + H(5)` are project artefacts — not double-counted in `A+E`. Every entry above has a `Used in:` provenance tag.

---

### Provenance Footnotes — How the 186 Were Assembled

- **Per-stream syntheses (01–06):** `synthesis/01-harnesses.md` (147 lines, 6 contributors) · `02-harness-influence.md` (259 lines, 5 contributors — gpt-6 missing) · `03-elicitation.md` (203 lines, 5 contributors) · `04-guardrails.md` (345 lines, 5 contributors) · `05-companion-ux.md` (275 lines, 4 contributors — argon+gpt-6 absent, thinned) · `06-meta-models.md` (252 lines, 5 contributors — argon missing) = **1,550 lines, ~165 pre-dedup sources, ~226 KB** per `INDEX.md` header.
- **Argon audit v2:** `ARGON-AUDIT-v2.md` (737 lines, 2026-10-20, 6 RQs, 10-day re-sequence, 15 falsifiers, 10 zero-FP hard-blocks) — open-web ground verification via `.share-argon4.zip` + hook-zoo 12×12 + Wauters 409k + AgentSpec/Guard + pnas Bastani + entro + hook marketplace.
- **ECC sidebars:** `ECC-SIDEBAR.md` (503 lines) + `ECC-SECURITY-DEEPDIVE.md` (363 lines) — live read of `affaan-m/ECC` 2.2.3 at `/tmp/ecc-analyze` (71 agents, 311 skills, 97 commands, MIT).
- **Vault deep-reads:** 14 docs in 4 clusters (2026-10-21) → `deepread-agents-prompting.md` (6 docs) · `deepread-harness-cluster.md` (3 docs) · `deepread-research-cluster.md` (5 docs) · `deepread-vibe-coding.md` (4 docs + Arxiv2602 2602.11988-family + Cao/Jiang/Xu goal-blind).
- **Audits:** `COMPARISON.md` (247 lines, primary vs independent structural audit) · `INDEPENDENT-GEMS.md` (291 lines, 11 patches + 6 gem-only sources) · `HTML-REVIEW.md` (175 lines, 8 hallucinations F-01–F-08 + 17 fixes) · `_CONSISTENCY.md` (176 lines, 10 contradictions + 134→103 dedup + 8 blind spots).
- **Deduplication:** raw 134 → 103 canonical per `_CONSISTENCY.md §3` (29 cross-stream merges into 13 canonical + 2 intra-stream). This bibliography expands back to 186 by (a) re-splitting merged clusters where paper-level provenance is needed, and (b) adding audit-specific sources (hook-zoo, AgentSpec, distro catalogues) that are load-bearing for `FINAL-v4` S-*/C-* rows.
- **Supersession:** FINAL-v4 (221 lines, 2026-10-21) supersedes FINAL-v3 (219 lines, Argon amendments) which supersedes FINAL-v2 (216 lines, 5 GEMS + cherry-picks) which supersedes FINAL (144 lines). No per-stream file was modified after synthesis; explorer is a companion, not a spec.

### Changelog

- `2026-10-21` — Created at `docs/research/SOURCES.md` (this file): 186 entries, 8 categories, paper-grade APA-ish style with arXiv IDs, dates, venues, and per-entry `Used in:` tags; summary table validated (`53+31+36+28+16+7+10+5=186`).

---

## Appendices — Detailed Vault ID Cross-Reference

### Arxiv IDs Referenced

All arXiv IDs below appear in `S-*/C-*/B-*` rows or in the numbered entries above. Use this table to jump from an ID to its entry.

| arXiv ID | Short Title | Entries |
|----------|-------------|---------|
| `2602.11988` | ContextFiles Eval (Gloaguen et al., ETH Zurich, Feb 2026) | [#1](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads), [#48](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2506.10943` | SEAL Self-Adapting LMs (MIT) | [#83](#b-elicitation--synthesis--stream-03) |
| `2508.12631` | Avengers-Pro Ensemble Routing (PJLab) | [#159](#e-meta-models-routing--context-protocols--stream-06) |
| `2606.09498` | Self-Harness (PJLab) | [#48](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2608.23552` | Prime Agent RLM Harness (Princeton/MIT/Prime Intellect) | [#161](#e-meta-models-routing--context-protocols--stream-06) |
| `2609.37725` | Context Language Models (UW/Meta/MIT) | [#49](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2610.13912` | RSI-Anything World Models (PhAI/CUHK/Oxford/Stanford/PKU) | [#160](#e-meta-models-routing--context-protocols--stream-06) |
| `2510.01171` | Verbalized Sampling (NEU/Stanford) | [#82](#b-elicitation--synthesis--stream-03) |
| `2511.12884` | Agent READMEs (Chatlatanagulchai) | [#42](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2603.28052` | Meta-Harness (Stanford/KRAFTON/MIT) | [#166](#f-vault-deep-reads--full-cluster-index-14-docs) |
| `2606.29472` | Agent-Computer Observation Interface | [#41](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2404.13208` | Instruction Hierarchy (Wallace et al.) | [#43](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2502.15851` | Control Illusion / Failure of Hierarchies | [#45](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2604.03515` | Inside the Scaffold (Rombaut) | [#22](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |
| `2608.01326` | Context Compaction Theory (Tirmazi) | [#38](#a-agent-harness--evaluation--streams-0102-argon-audit-harness-cluster-deep-reads) |

*Arxiv2602 (Cao/Jiang/Xu goal-blind; [#84](#b-elicitation--synthesis--stream-03)) is catalogued under `vault-vibe-coding §5` as a vault deep-read; see that section for its citation.*
