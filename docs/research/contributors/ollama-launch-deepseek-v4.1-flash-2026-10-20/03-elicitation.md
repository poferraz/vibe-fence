# Stream 03 — Elicitation & Synthesis Patterns

- **Model:** deepseek-v4.1-flash
- **Provider:** Hermes desktop app via ollama-launch (`deepseek-v4.1-flash:1017-cloud`)
- **Date:** 2026-10-20
- **Stream:** 03 — Elicitation & Synthesis (multi-sample, critique, debate, MoA, cost/latency)

---

## Thesis: in code, verification beats consensus

The hypothesis under test — "ask 5, self-critique, synthesize 1" versus "ask 1" — is **right in form and wrong in selector**. The evidence converges on a sharper rule:

1. **Where an automatic verifier exists, sampling pays enormously.** Repeated sampling on SWE-bench Lite raises the fraction of issues solved from **15.9% with one sample to 56% with 250 samples**, beating the single-sample state of the art (43%) — and the gain comes from *coverage*, then filtering with tests ([S-01]).
2. **Where no verifier exists, the same sampling plateaus.** The same paper finds that "in domains without automatic verifiers, common methods for picking from a sample collection (majority voting and reward models) plateau beyond several hundred samples and fail to fully scale with the sample budget" ([S-01]). Consensus is not correctness.
3. **Judges are usable raters and poor selectors.** Strong judges reach **>80% agreement** with human preference — but carry documented **position, verbosity and self-enhancement biases** and limited reasoning ([S-05]). Selecting a patch by judge preference is selecting for the biases.

For vibe-fence this collapses into one design principle: **spend the extra compute on execution, not on opinion.** A coding harness has the cheapest verifier in software — the test suite — and a non-technical user has the least patience for latency. So the harness should default to **1 sample + verify**, escalate to **N samples + verify** only when the first attempt fails, and use judges/debate/MoA only on the *unverifiable* decisions (naming, structure, copy), where they are cheap relative to the alternative (asking the user).

---

## 1. Multi-sample patterns

### P-01 — Self-consistency: the original result, and why it does not transfer cleanly to code

- **Claim:** Sampling multiple reasoning paths and taking the majority answer improves arithmetic and commonsense reasoning substantially over greedy decoding. The mechanism is that diverse reasoning paths converge on the correct answer more often than any single path.
- **Evidence:** Wang, Wei, Schuurmans, Le, Chi, Narang, Chowdhery & Zhou, *Self-Consistency Improves Chain of Thought Reasoning in Language Models*, arXiv:2203.11171v4 — https://arxiv.org/abs/2203.11171v4 (accessed 2026-10-20).
- **Strength:** `proven` for closed-form-answer reasoning tasks; **`contested`** for open-ended generation, because "majority" is undefined when answers are programs.
- **Fit for vibe-fence:** Use self-consistency on **decisions with discrete answers** — "which of these three schemas", "is this a secret or a placeholder", "which file owns this logic" — not on code. For code, functional equivalence makes string-majority meaningless; tests replace it (P-02).

### P-02 — Repeated sampling + verifier is the only pattern with a large, code-specific measured gain

- **Claim:** Coverage (the fraction of problems solved by *any* sample) scales log-linearly with the number of samples across four orders of magnitude, and in domains with automatic verification those coverage gains translate directly into performance.
- **Evidence:** Brown, Juravsky, Ehrlich, Clark, Le, Ré & Mirhoseini, *Large Language Monkeys: Scaling Inference Compute with Repeated Sampling*, arXiv:2407.21787v3 — https://arxiv.org/html/2407.21787v3 (accessed 2026-10-20). SWE-bench Lite: **15.9% (1 sample) → 56% (250 samples)** with DeepSeek-Coder-V2-Instruct; single-sample SOTA at the time **43%**.
- **Strength:** `proven` (multiple tasks/models, four orders of magnitude).
- **Fit for vibe-fence:** This is the pattern to build. But note the cost curve: 250 samples is a batch job, not an interactive feature. For a companion, the usable version is **best-of-k with k ≤ 5 and a hard stop on first pass**: sample 1, verify; if it fails, sample 3–4 more in parallel, verify each, keep the first that passes. Expected cost for tasks the model usually solves: ~1.1×.

### P-03 — Filtering is the mechanism, not sampling alone

- **Claim:** Massive sampling only works when paired with a filter that can reject wrong candidates. AlphaCode's contribution was not "sample a million programs" but the **filtering and clustering** step that reduced a huge candidate pool to a small submitted set.
- **Evidence:** Li et al., *Competition-Level Code Generation with AlphaCode*, arXiv:2203.07814 — https://arxiv.org/abs/2203.07814 (accessed 2026-10-20 by ID); the general principle is restated in [S-01].
- **Strength:** `proven`.
- **Fit for vibe-fence:** Never ship sampling without a filter. If the project has no tests, the fence's first job is to **create one** (a smoke test, a schema check, a build) so that sampling has something to filter against. That is a more valuable use of harness effort than any critique loop.

### P-04 — Best-of-N with a weak selector over-optimises the selector

- **Claim:** When candidates are ranked by an imperfect proxy (reward model or judge), optimisation pressure finds the proxy's flaws: measured reward rises while true quality peaks and then declines. More selection against a bad proxy is actively harmful.
- **Evidence:** Gao, Schulman & Hilton, *Scaling Laws for Reward Model Overoptimization*, arXiv:2210.10760 — https://arxiv.org/abs/2210.10760 (accessed 2026-10-20).
- **Strength:** `proven` (scaling laws, multiple proxy types).
- **Fit for vibe-fence:** This is the strongest argument against "best-of-10, pick with a judge" for code. A judge that prefers longer, more defensive-looking patches will select exactly the bloated patch the user cannot review. Prefer **binary verifiers** (tests, type-checks, lint) over graded judges for anything that ships.

---

## 2. Critique and refinement

### P-05 — Intrinsic self-correction does not work; feedback-grounded correction does

- **Claim:** Asking a model to review and fix its own reasoning without external feedback does not reliably improve — and often degrades — reasoning performance. Correction works when it is grounded in an external signal (execution, a test failure, a compiler error, a retrieved fact).
- **Evidence:** Huang, Chen, Mishra, Zheng, Yu, Song & Zhou, *Large Language Models Cannot Self-Correct Reasoning Yet*, arXiv:2310.01798 — https://arxiv.org/abs/2310.01798; positive results only with execution feedback in Chen et al., *Teaching LLMs to Self-Debug*, arXiv:2304.05128 — https://arxiv.org/abs/2304.05128 (both accessed 2026-10-20).
- **Strength:** `proven` (the negative result is well replicated; the positive result requires external feedback).
- **Fit for vibe-fence:** The harness must never present "I reviewed my own work" as a quality step. `fence check` exists precisely so that the critique stage has an input that is not the model's opinion.

### P-06 — Reflexion: verbal memory helps when the loop has a signal

- **Claim:** An agent that stores post-failure reflections and retries performs better on subsequent attempts — the gain comes from the loop (attempt → failure → reflection → retry), not from the reflection text alone.
- **Evidence:** Shinn, Cassano, Gopinath, Narasimhan & Yao, *Reflexion: Language Agents with Verbal Reinforcement Learning*, arXiv:2303.11366 — https://arxiv.org/abs/2303.11366 (accessed 2026-10-20 by ID).
- **Strength:** `proven` (benchmarked on coding and decision tasks) — `contested` on how much transfers across model generations.
- **Fit for vibe-fence:** Persist the reflection in `.fence/state/lessons.json` **across sessions**, not just within a retry loop. A fence that remembers "this project's tests fail when X" is demonstrating the companion behaviour the product promises, at near-zero cost.

### P-07 — LLM-as-judge: good agreement, documented biases, wrong tool for patch selection

- **Claim:** Strong LLM judges match human preferences at **over 80% agreement** — roughly human–human agreement — but exhibit **position bias** (prefers the first/last), **verbosity bias** (prefers longer), and **self-enhancement bias** (prefers its own family's output), plus limited reasoning.
- **Evidence:** Zheng, Chiang, Sheng, Zhuang, Wu, Zhuang, Lin, Li, Li, Xing, Zhang, Gonzalez & Stoica, *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, arXiv:2306.05685v4 — https://arxiv.org/abs/2306.05685 (accessed 2026-10-20).
- **Strength:** `proven` (large human-preference corpus).
- **Fit for vibe-fence:** Use a judge only where the output is **prose the user will read** (explanation quality, plan clarity, naming candidates), with a rubric, blinded order, and ≤2 candidates. Never as the gate for a patch. For patches, `tests > types > lint > judge`, always.

### P-08 — Constitutional critique is cheap and useful *if* the constitution is checkable

- **Claim:** Critique against an explicit list of written criteria outperforms open-ended "improve this". The criteria do the work; the model only applies them. Criteria that can be mechanically checked are strictly better, because they can be applied without a model call at all.
- **Evidence:** The critique-against-rubric pattern is standard in the judge literature (rubric-based grading in [S-05]); the checkable-criteria preference is my extrapolation from [P-05]'s finding that feedback must be external.
- **Strength:** `practiced` / inference.
- **Fit for vibe-fence:** Turn each guardrail into a **rubric line that maps to a command** (secret scan → `gitleaks`, dep policy → `npm audit --omit=dev`, env hygiene → a `.env` git check). The "constitution" is then the rule set, and the model is only consulted for the residue.

---

## 3. Multi-agent patterns

### P-09 — Debate improves factuality and reasoning, at a cost that rarely survives contact with interactive use

- **Claim:** Multiple model instances proposing and debating over rounds significantly improves mathematical and strategic reasoning on several benchmarks. Later work questions whether debate beats a well-tuned self-consistency baseline once compute is matched.
- **Evidence:** Du, Li, Torralba, Tenenbaum & Mordatch, *Improving Factuality and Reasoning in Language Models through Multiagent Debate*, arXiv:2305.14325 — https://arxiv.org/abs/2305.14325 (accessed 2026-10-20). Contested follow-up: Smit et al., *Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs* (2023/2024) argues debate often fails to beat simpler baselines under matched compute — https://arxiv.org/abs/2311.17371 (cited at title/abstract level).
- **Strength:** `contested`.
- **Fit for vibe-fence:** **Avoid for code.** Two agents arguing about a patch is 3–6× the cost to reach an agreement that a test could have settled in 200 ms. The one defensible use is a *single* adversarial reviewer with a fixed checklist, run once, on plans (not patches).

### P-10 — Mixture-of-Agents wins on preference benchmarks, not correctness

- **Claim:** Layered aggregation across models reaches state of the art on **AlpacaEval 2.0 (65.1% vs 57.5% for GPT-4o)**, MT-Bench and FLASK. Every one of those is a *preference* or *quality-rating* benchmark, not a correctness benchmark.
- **Evidence:** Wang, Wang, Athiwaratkun, Zhang & Zou, *Mixture-of-Agents Enhances Large Language Model Capabilities*, arXiv:2406.04692 — https://arxiv.org/abs/2406.04692 (accessed 2026-10-20).
- **Strength:** `proven` for preference benchmarks; **`contested`** for code correctness (not evaluated on execution-based benchmarks in the paper).
- **Fit for vibe-fence:** Use MoA-shaped aggregation only for **user-facing prose** — the explanation on a teaching card, the digest summary, the plan narrative. That is exactly the preference-benchmark regime, and it is where a single sample is weakest. Never for the patch.

### P-11 — Role-played reviewers are theatre unless each role has a different check

- **Claim:** "Security reviewer / performance reviewer / accessibility reviewer" personas add value only when each persona runs a different *verifiable* check. Without that, they are the same model producing three opinions, with correlated errors.
- **Evidence:** Inference from P-05 (self-critique without external signal does not help) and P-09 (debate contested under matched compute). No direct study of role-played code review found.
- **Strength:** `contested` / inference.
- **Fit for vibe-fence:** Implement roles as **commands, not voices**: `fence audit security` runs the secret scanner + dep audit; `fence audit a11y` runs the axe check. If a role cannot run a command, drop the role.

---

## 4. Synthesis ("5 candidates → critique → synthesize 1")

### P-12 — Synthesis helps prose and plans; it can destroy patches

- **Claim:** Merging several candidates into one is a *generation* act guided by preference, so it inherits the judge's biases (P-04, P-07). For prose and plans, merging recovers the best parts of each; for a patch, merging two plausible diffs produces a third diff that no candidate ever validated.
- **Evidence:** No direct study of patch synthesis found. The bias and over-optimisation results ([S-04], [S-05]) plus the verification result (P-02: gains come from *filtering*, not blending) make the risk structural.
- **Strength:** `contested` (reasoned, not measured).
- **Fit for vibe-fence:** Allowed: synthesize 3 candidate **plans** (steps, risks, order) into one, then validate by executing step 1. Forbidden: synthesize patches. Patches are **selected, never merged** — pick the first that passes.

### P-13 — The "ask 5, critique, synthesize" pipeline is 3 patterns stacked, and the costs multiply

- **Claim:** The full pipeline is multi-sample (N×) → critique (N× or 1× over all) → synthesis (1× over N) — roughly **2N+1** model calls with growing context per call. The measured evidence supports the first stage only when a verifier filters it; the second and third stages have no code-specific evidence.
- **Evidence:** Cost structure from [S-01] (sampling scaling) and [S-05] (judge cost/benefit); no paper evaluates the combined pipeline end-to-end.
- **Strength:** `contested`.
- **Fit for vibe-fence:** Do not ship the pipeline as a default. Ship **1 + verify + conditional best-of-4**, and treat "5→critique→synthesize" as a premium mode for *planning* only, behind a setting the user never sees.

---

## 5. Cost and latency (the constraint that decides everything)

### P-14 — For an interactive companion, latency dominates the value calculus

- **Claim:** A non-technical user waiting on a build has a patience budget measured in tens of seconds. A 5× token increase is not 5× cost — it is 5× *time to first useful output*, which is the thing that determines whether the tool feels like a companion or a slot machine.
- **Evidence:** No direct user-study of agent latency tolerance found. The structural argument rests on the notification/interruption literature (stream 05, S-05) and the product pattern that every consumer builder optimises first-token latency (stream 05, O-01). Flagged as inference.
- **Strength:** `contested` / inference.
- **Fit for vibe-fence:** Budget: **first attempt ≤1 sample**, verification in-band; escalate only on failure and only in parallel (so wall-clock ≈ 1 attempt + 1 verification). Never serialize 5 samples for a feature the user is watching.

### P-15 — Compute-optimal allocation depends on difficulty, so the harness must estimate difficulty first

- **Claim:** Test-time compute helps most where the model is *near* the boundary of competence; for easy tasks extra compute is wasted and for very hard tasks it is insufficient. Optimal allocation therefore requires a difficulty estimate, not a fixed N.
- **Evidence:** Snell, Lee, Xu & Kumar, *Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters*, arXiv:2408.03314 — https://arxiv.org/abs/2408.03314 (accessed 2026-10-20).
- **Strength:** `proven` (mechanism and scaling analysis) — the difficulty estimator itself is the hard part.
- **Fit for vibe-fence:** Use cheap proxies for difficulty: does the task touch auth/payments/data migration? did the first attempt fail? is the file large or unfamiliar? Escalate compute on **risk × first-failure**, never uniformly.

### P-16 — Verified vs unverified domains need different selectors

- **Claim:** In verifiable domains, coverage gains from sampling convert directly into performance; in unverifiable domains, majority voting and reward models plateau and fail to scale with budget. The selector, not the sampler, is the binding constraint.
- **Evidence:** [S-01], explicit in the abstract.
- **Strength:** `proven`.
- **Fit for vibe-fence:** Two-tier policy: **verifiable** (code, config, schema) → sample-and-test; **unverifiable** (naming, copy, structure) → single sample plus at most one judge, and prefer *asking the user* over spending compute to guess their taste.

---

## 6. Internal vs visible

### P-17 — Run elicitation silently; surface the evidence, not the candidates

- **Claim:** Showing five candidate answers transfers the selection problem to the user — the exact anti-pattern the queue exists to prevent. What preserves trust without transferring work is showing *why* the answer won: "3 of 3 variants passed the tests", "I tried 4 approaches; 1 met the constraints".
- **Evidence:** Transfer-of-work anti-pattern is established in stream 05 (Q-01–Q-06: fix-not-finding, self-clearing queue); the "show the evidence" formulation is a design proposal.
- **Strength:** `practiced` / `invent`.
- **Fit for vibe-fence:** Internally: N samples, verify, select. Externally: one answer, one line of evidence, one expand affordance. The candidate list belongs in the log, never in the chat.

### P-18 — The one exception: expose alternatives when the choice is a preference, not a fact

- **Claim:** When two options are both correct (two layouts, two names, two copy variants), silently picking one is overreach — the user's taste is the missing signal, and no amount of sampling supplies it. This is the single case where showing candidates is right.
- **Evidence:** Inference from P-16 (unverifiable domain) and stream 05's "preference-bearing" queue class.
- **Strength:** `invent`.
- **Fit for vibe-fence:** Queue item type `choice`: 2–3 options, rendered, with a default preselected. Cap at one such item per run (stream 05, Q-04) or it becomes a design review the user did not ask for.

---

## 7. Comparative ranking

| Rank | Pattern | Helps most on | Measured gain | Cost | Verdict for vibe-fence |
|---|---|---|---|---|---|
| 1 | **Best-of-k + executable verifier** | Code, config, schema | 15.9% → 56% coverage at 250 samples; near-linear in k at small k | k× tokens, parallel | **Core.** Default escalation on first failure, k≤5 |
| 2 | **Attempt → failure → reflection → retry (Reflexion), persisted** | Recurring project errors | Positive on coding/decision benchmarks | ~2–3× on failures only | **Build.** Store in `.fence/state/lessons.json` |
| 3 | **Self-consistency on discrete decisions** | "Which schema / is this a secret / which file" | Large on arithmetic reasoning; untested for this use | 3–5× on that decision only | **Use narrowly**, where answers are discrete |
| 4 | **Rubric critique mapped to commands** | Guardrails | No number; mechanism supported by P-05 | ~1× (or 0 when the check is local) | **Build.** Rule = command + one-line rubric |
| 5 | **LLM-as-judge** | Prose the user reads | >80% human agreement, with 3 biases | 1–2× | **Constrain** to prose, blinded, ≤2 candidates |
| 6 | **MoA / layered aggregation** | User-facing explanation quality | 65.1% vs 57.5% AlpacaEval | 4–8× | **Premium only** for teaching-card prose |
| 7 | **Debate** | Factual disputes | Contested under matched compute | 3–6× | **Avoid for code** |
| 8 | **5→critique→synthesize (full pipeline)** | Plans | None code-specific | ~2N+1 calls | **Avoid as default**; plans only |
| 9 | **Role-played reviewers** | Cross-cutting audits | None without distinct checks | N× | **Convert to commands or drop** |

---

## 8. Gaps / unknowns

1. **No study evaluates elicitation patterns on a *coding agent with tools* end-to-end.** All the strong numbers are either single-turn code generation (AlphaCode) or agentic sampling with a test filter (LLM Monkeys); nobody has measured "1 sample + agent loop" vs "4 samples + agent loop" at equal dollar cost.
2. **Debate's contested status is unresolved.** The original results are real; the matched-compute critiques are also real; the field has not settled it, and I did not read the follow-up in full.
3. **No cost-normalised comparison of MoA vs a single stronger model** on any execution-based benchmark. AlpacaEval is preference-only.
4. **Latency tolerance for agentic coding is unmeasured.** My "tens of seconds" claim is inference, not a study.
5. **Difficulty estimation** — the input to Snell-style optimal allocation — has no reliable cheap proxy for a vibe-coded project; the risk heuristics proposed in P-15 are guesses.
6. **Self-consistency on non-numeric discrete decisions** (classification, file selection) is plausible and untested; I found no paper applying it to code navigation.
7. **No evidence on whether users prefer seeing "3/3 variants passed" over a plain success message.** The evidence-display proposal in P-17 is untested.
8. **Patch synthesis is untested in the literature** — my prohibition (P-12) is argued from mechanism, not measured.

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| S-01 | Brown et al., *Large Language Monkeys: Scaling Inference Compute with Repeated Sampling*, arXiv:2407.21787v3 — https://arxiv.org/html/2407.21787v3 | paper | 2026-10-20 |
| S-02 | Wang et al., *Self-Consistency Improves Chain of Thought Reasoning*, arXiv:2203.11171v4 — https://arxiv.org/abs/2203.11171v4 | paper | 2026-10-20 |
| S-03 | Li et al., *Competition-Level Code Generation with AlphaCode*, arXiv:2203.07814 — https://arxiv.org/abs/2203.07814 | paper | 2026-10-20 (by ID) |
| S-04 | Gao, Schulman & Hilton, *Scaling Laws for Reward Model Overoptimization*, arXiv:2210.10760 — https://arxiv.org/abs/2210.10760 | paper | 2026-10-20 |
| S-05 | Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, arXiv:2306.05685v4 — https://arxiv.org/abs/2306.05685 | paper | 2026-10-20 |
| S-06 | Huang et al., *Large Language Models Cannot Self-Correct Reasoning Yet*, arXiv:2310.01798 — https://arxiv.org/abs/2310.01798 | paper | 2026-10-20 |
| S-07 | Chen et al., *Teaching LLMs to Self-Debug*, arXiv:2304.05128 — https://arxiv.org/abs/2304.05128 | paper | 2026-10-20 |
| S-08 | Shinn et al., *Reflexion*, arXiv:2303.11366 — https://arxiv.org/abs/2303.11366 | paper | 2026-10-20 |
| S-09 | Du et al., *Improving Factuality and Reasoning through Multiagent Debate*, arXiv:2305.14325 — https://arxiv.org/abs/2305.14325 | paper | 2026-10-20 |
| S-10 | Smit et al., *Should we be going MAD?* (debate critique), arXiv:2311.17371 — https://arxiv.org/abs/2311.17371 | paper (title-level) | 2026-10-20 |
| S-11 | Wang et al., *Mixture-of-Agents Enhances LLM Capabilities*, arXiv:2406.04692 — https://arxiv.org/abs/2406.04692 | paper | 2026-10-20 |
| S-12 | Snell et al., *Scaling LLM Test-Time Compute Optimally*, arXiv:2408.03314 — https://arxiv.org/abs/2408.03314 | paper | 2026-10-20 |

---

## Implications for vibe-fence

1. **Core loop = 1 sample + verify, escalate on failure.** Best-of-k with k≤5, parallel, first-passing wins. The only pattern with a large code-specific measured gain is sampling *plus a filter* (P-02, P-03).
2. **Build the verifier before building the sampler.** If the project has no test, `fence check` should create a smoke test (build + one critical path) so that sampling has a filter. A harness that can verify is worth more than one that can sample.
3. **Never select a patch with a judge.** Rank selectors: tests > type-check > lint > judge. Judges carry position/verbosity/self/self-enhancement bias and best-of-N against a weak proxy demonstrably degrades true quality (P-04, P-07).
4. **Persist reflections across sessions** in `.fence/state/lessons.json`, keyed by project and error signature (P-06). This is the cheapest visible form of "companion" behaviour and it compounds.
5. **Run elicitation silently; show evidence, not candidates** (P-17). One line: "4 attempts, 1 passed the tests." Candidate lists live in the log.
6. **Reserve candidate display for preference-bearing choices** — one `choice` item per run, max 3 options, default preselected (P-18).
7. **Use MoA-style aggregation only for teaching-card prose**, where preference is the metric (P-10, P-15). Never in the patch path.
8. **Convert "roles" into commands**: `fence audit security|deps|a11y` run real tools; drop any role that cannot (P-11).
9. **Cap the whole elicitation budget at ~1.2× tokens on the happy path**, and let it rise only on failure or high-risk tasks (auth, payments, migrations). Instrument actual token spend per run so the cap is enforceable (P-13, P-14).
10. **Difficulty signal = risk tags × first-attempt failure**, not a fixed N (P-15). This is the crude but workable version of compute-optimal allocation.
11. **Synthesize plans, select patches** (P-12). Merging diffs produces unvalidated code; merging plan steps is safe because the next step is executed and checked.
12. **Forbid "review your own work" as a quality step** in any skill text; the phrase teaches the model to perform confidence (P-05).
13. **A/B the claim in the demo:** same task, single-pass vs best-of-4-with-tests, report tokens/latency/pass-rate side by side. This is the eval story for stream 06 and it is cheap to run on 10 tasks.
14. **Defer to synthesis:** whether the fence should ever run multi-model elicitation (MoA) given the hackathon's single-model context (Muse Spark). The evidence says preference gains exist but the cost is 4–8×, and a demo that is 6× slower during a live judging session is a net negative.
