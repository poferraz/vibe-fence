# Synthesis — Stream 03: Elicitation & Synthesis Patterns

---

- **Stream:** 03 — Elicitation & Synthesis Patterns
- **Synthesized:** 2026-10-20
- **Contributors compared:** 5 — muse-spark-2026-10-20 (13 sources), google-gemini-3.8-flash-2026-10-20 (10 sources), google-gemini-4-argon-2026-10-20 (46+ sources, docx-converted), ollama-launch-deepseek-v4.1-flash-2026-10-20 (12 sources), ollama-launch-minimax-m3.1-flash-2026-10-20 (46 sources)

## 1. What the contributors agree on

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|----------------|---------------|-----------|-------------------------|
| A-01 | **Unconditional (ungrounded) self-critique degrades reasoning.** Asking a model to "review your own work and fix bugs" without new external evidence lowers accuracy on reasoning/code tasks (GPT-4 GSM8K 95.5%→89.0% after 2 rounds; GPT-3.5 CommonSenseQA 75.8%→41.8%). | Huang et al., arXiv:2310.01798 — reported consistently by all 5 contributors with identical Huang numbers | `unanimous` | **avoid** — forbid generic self-critique prompts; every critique must carry a tool signal or explicit rubric |
| A-02 | **Tool/test-grounded retry is the highest-ROI elicitation pattern.** Reflexion's agent → evaluator (run tests/lint/execute) → reflection → retry loop is the only pattern with large, replicated gains on code (HumanEval 80→91%; ALFWorld +22pp) that costs nothing on the happy path. | Shinn et al., arXiv:2303.11366 — cited by all 5 | `unanimous` | **copy** — silent `fence-check` circuit: run deterministic oracles after each write, feed verbatim failures back, retry once |
| A-03 | **Self-consistency requires discrete answers; it does not transfer to raw code.** Majority-vote over string outputs fails for programs (different correct implementations have different surface strings). | Wang et al., arXiv:2203.11171 — all 5 state the same limitation explicitly | `unanimous` | **avoid** for code generation; **copy** narrowly for discrete routing decisions (classification, file selection) |
| A-04 | **Multi-agent debate is not viable for interactive coding.** 3 agents × 3 rounds = 9× cost and 30s+ sequential latency; hosted users abandon it; cost-matched it loses to self-consistency. | Du et al., arXiv:2305.14325 + Smit et al., arXiv:2311.17371 and Huang arXiv:2310.01798 cost-matched ablation (GSM8K 83.0% debate vs 88.2% self-consistency at 9 responses) | `unanimous` | **avoid** on interactive path; at most offline/queued with synthesis |
| A-05 | **LLM-as-judge is usable for preference, unreliable for correctness, and carries position/verbosity/self-enhancement biases.** ~80–85% human agreement on preference; must swap positions, length-control, and log rubric. Must not gate code correctness. | Zheng et al., arXiv:2306.05685 — cited by all 5 | `unanimous` | **copy** narrowly as tie-breaker for phrasing/plan preference only; **avoid** as code-correctness oracle |
| A-06 | **Best-of-N sampling needs a verifier/filter to be valuable; sampling alone is insufficient.** Coverage gains (15.9%→56% on SWE-bench Lite at 250 samples) convert to performance only where a verifier filters; AlphaCode's contribution was filtering/clustering, not sampling per se. | Brown et al., arXiv:2407.21787 + Li et al., arXiv:2203.07814 — stated by deepseek, minimax, muse-spark, flash | `strong` (4/5 explicit; argon implies via Agentless/CRITIC) | **copy** — `1 sample → verify → on failure parallel best-of-4 → first pass wins`; build the verifier first |
| A-07 | **Elicitation must be silent-internal; never surface raw candidates or critique logs to the non-technical user.** Showing 5 candidates transfers selection work to the user — the anti-pattern the queue exists to prevent. | Muse-spark, flash, deepseek, minimax all converge on "show one clean answer + evidence line"; argon via harness design (ACID artifacts, no raw trace) | `strong` | **copy** — internally N samples, externally one answer + one evidence line ("3 of 4 passed") |
| A-08 | **MoA's headline gains are on preference benchmarks, not execution-based correctness.** AlpacaEval 2.0 65.1% vs 57.5% GPT-4o is real; no paper evaluates MoA on pass@k code benchmarks. | Wang et al., arXiv:2406.04692 — all 5 distinguish preference vs correctness | `strong` | **avoid** on interactive path; restrict to queued user-facing prose if at all |
| A-09 | **Best-of-N against an imperfect judge/reward model over-optimises and degrades true quality.** Selecting against a weak proxy finds the proxy's flaws; measured reward rises while true quality falls. | Gao et al., arXiv:2210.10760 — cited explicitly by deepseek, minimax; implied by muse-spark/flash via verifier hierarchy | `strong` | **avoid** — selector hierarchy `tests > types > lint > learned verifier > judge`; never gate patches with a judge |
| A-10 | **Compute-optimal allocation requires difficulty estimation; fixed-N is wasteful.** Test-time compute helps most near the competence boundary; easy tasks waste tokens, very hard tasks lack base knowledge. | Snell et al., arXiv:2408.03314 — cited by argon, muse-spark, deepseek, minimax | `strong` | **invent** — difficulty signal = risk tag (auth/payments/migration) × first-attempt failure; never pay >3× without a verifier |

## 2. Where they disagree

### D-01 — What is the core loop: Reflexion retry vs. "1 + conditional best-of-k" vs. always-sample?

- **Reading A (muse-spark, google-gemini-3.8-flash):** Reflexion-style "write → run `fence-check` → feed trace → 1 retry, 0 cost on happy path" is the default code loop. Best-of-N is secondary, for critical pure functions.
- **Reading B (deepseek, minimax):** Default is "1 sample → verify; on failure parallel best-of-k (k≤5) → first passing wins." The key empirical lever is *coverage + filter* (Brown et al. 15.9%→56%), not verbal reflection. Reflexion is real but its headline compares against GPT-4, not a same-model ablation, so its isolated gain is smaller than claimed.
- **Resolution:** Adopt **B as the loop, A as the retry detail inside it.** Minimax's correction to the Reflexion numbers is accurate and acknowledged by its own sibling audit table; deepseek/minimax give the only code-specific coverage curve. Reflexion describes the *failure path* of the loop (how to retry), while Brown/CodeT describe why sampling + filtering beats single-pass at all.
- **Why it matters:** If Phase 1 treats Reflexion as the whole strategy, it will serialise retries and miss the parallel-filtering gain. If it treats only best-of-k as the strategy, the retry prompt will lack the verbal-diagnosis step that ablation shows adds +8pp over blind retry.

### D-02 — Is the "ask 5 → critique → synthesize 1" recipe worth keeping?

- **Reading A (muse-spark):** Keep it, scoped to planning — single-call synthesis prompt with 2–4 diverse drafts + criterion rubric is a "core" pattern (rank 2, `practiced`).
- **Reading B (flash):** Keep only for user-visible `vibe-plan`; forbidden for code writing (output-window truncation, no execution check).
- **Reading C (deepseek, minimax):** The full pipeline (N → critique → synthesize) has no controlled code-specific evaluation; ~2N+1 calls; synthesis inherits judge biases and can produce an unvalidated hybrid patch. Avoid as default; at most hidden premium mode for plans.
- **Resolution:** **C.** Retain synthesis only for *plans* (steps, risks, order), never for patches. Minimax/deepseek's cost accounting (11 calls at N=5) and the "merging diffs creates unvalidated code" argument are unrefuted. Muse-spark's "single-call 5-way" still pays 2–3× tokens and has no isolated RCT; plan synthesis can use a light 2–3 candidate prompt without a separate critique stage.
- **Why it matters:** Shipping the full pipeline as the default inflates happy-path cost by 2–3× for no measured correctness gain and ships untested patch-synthesis behaviour.

### D-03 — How strongly should multi-agent debate be rejected?

- **Reading A (muse-spark, flash):** Avoid — expensive and latency-hostile; relegate to offline deliberation or security audit.
- **Reading B (deepseek, minimax):** Forbid more strongly — cost-matched, debate *underperforms* self-consistency (GSM8K 83.0% vs 88.2% at 9 responses); Smit et al. replication agrees; on reasoning models majority voting dominates MoA/debate/revision outright.
- **Resolution:** **B.** The matched-compute evidence (Huang §4, Smit) was not cited by muse-spark/flash and is load-bearing. The verdict is not "too slow" but "too slow and measurably worse than the cheaper alternative at equal budget."
- **Why it matters:** A weaker verdict invites re-adding debate later as a premium feature; the evidence says parallel sampling + vote strictly dominates it.

### D-04 — Is Self-Refine viable with rubric grounding?

- **Reading A (muse-spark):** Conditional — allow Self-Refine when critique can be grounded (linter rule, style guide, a11y checklist).
- **Reading B (flash, argon, deepseek, minimax):** Near-unanimous rejection: ungrounded Self-Refine gains are real only for style/fluency, zero for reasoning; even grounded it adds 3–7× sequential cost for contested benefit; the survey verdict is that no general-task self-correction with LLM feedback has been demonstrated except on tasks "exceptionally suited" to it.
- **Resolution:** **B with a narrow carve-out.** Treat "rubric-guided iteration" as Reflexion with a static oracle (lint/style-check), not as Self-Refine. No skill text may contain "review your own work" without an accompanying executable check.
- **Why it matters:** Labelling ungrounded self-critique as `practiced` risks a default code-refinement loop that prior work shows degrades accuracy.

### D-05 — Should the harness invent cross-session reflection memory (`.fence/state/lessons.json`)?

- **Reading A (deepseek, minimax, argon via harness ACID artifacts):** Yes — persisting reflections keyed by project/error signature is the cheapest compounding companion behaviour; argon generalizes to Git-backed filesystem artifacts and SWE-Replay trajectory reuse.
- **Reading B (muse-spark, flash):** Reflexion's memory is described as a 1–3 item episodic buffer within a session, capped to avoid context rot; no cross-session persistence is proposed.
- **Resolution:** **Adopt A with evaluation.** The idea has no controlled study isolating cross-session memory, but it costs ~0 marginal tokens, aligns with argon's harness pattern, and is the only proposal that gives the harness statefulness across cold starts.
- **Why it matters:** Without it the fence re-learns per-session; with it the fence needs a compaction/eviction policy and a false-positive guard (lesson poisoning).

### D-06 — What does MoA cost and where does it belong?

- **Reading A (muse-spark):** MoA is 7–10× tokens, too expensive for interactive work.
- **Reading B (flash):** MoA is 4–6×, restricted to offline scaffold generation.
- **Reading C (minimax):** Cost is workload-dependent — MoA-Lite is 2× more cost-effective than GPT-4 Turbo while still beating GPT-4o by 1.8pp; the paper's own budget analysis contradicts a fixed multiplier; moreover, reasoning-era reversals show majority voting dominates MoA.
- **Resolution:** **C refines A/B.** Cost is configuration-dependent; MoA-Lite at 2× exists. But the correctness gap remains — no execution benchmark — and the reasoning-model reversal (Wang et al., arXiv:2504.14047) is the binding constraint for the fence's model tier. Keep MoA out of the hot path regardless of budget config.
- **Why it matters:** Mis-stating cost as always 7–10× overstates the case and invites "fix it with a smaller config"; the correct argument is that even cheap MoA solves the wrong metric.

### D-07 — How should verifiers be treated: trusted filter vs. flawed proxy?

- **Reading A (flash, muse-spark):** Tests/lint as reliable oracles; best-of-N picks the passing candidate.
- **Reading B (minimax, deepseek, argon via Agentless):** Verifiers are a middle ground, not a gold standard — 11.3% flaky tests (Brown), <20% distinguishability without harness help (R2E-Gym), ~6% false-pass rate. Agentless addresses this with reproduction-test synthesis and regression filtering. Argon's broader point: delegate to symbolic/execution oracles but expect to harden them.
- **Resolution:** **B.** The 11.3% flakiness number appears only in minimax and is uncontested; A implicitly assumes a clean test suite that vibe-coded projects will not have. Phase 1 needs a verifier trust ladder (compile → lint → tests twice → generated tests) and should generate missing smoke tests before relying on selection.
- **Why it matters:** Selecting on a flaky or missing suite promotes bad patches with confidence.

## 3. Unique contributions

| Contributor | Unique contribution | Evidence | Adopt? |
|-------------|---------------------|----------|--------|
| muse-spark | Explicit cost/latency ranking of all 8 elicitation patterns cheapest→most expensive with strength tags and the Wu et al. inference-scaling law framing | Wu et al., arXiv:2408.00724; ranking table §Comparative Ranking | **Yes** — reuse as the elicitation budget reference |
| muse-spark | "Diversity-aware synthesis primitive" — de-duplicate near-identical drafts via embedding/AST similarity before synthesis, then synthesize with criterion prompt including project constraints | Inference from USC/MoA | **Yes**, but scope to plans; do not synthesis-merge patches |
| muse-spark | "Cost-gated elicitation" policy sketch: greedy if trivial, synthesis if planning, BoN+execute if risky pure function + tests, Reflexion always | Wu et al. / Snell et al. Pareto frontier | **Yes** — refined as `fence/escalate` with disagreement gating (minimax) |
| google-gemini-3.8-flash | "2-Option Teachable Fork" UX — synthesize into A=fast/simple vs B=scalable/robust human choice, single click, harness implements fully | Practitioner pattern (Anthropic Building Effective Agents) | **Yes** — but cap at one per run; preference-bearing queue item |
| google-gemini-3.8-flash | CodeT dual generation-execution verification for core modules — generate a minimal ephemeral test suite alongside the implementation and commit only on green | Chen et al., arXiv:2207.10397 (65.8% vs 47.0%, +18.8pp) | **Yes** — highest-leverage idea for test-less projects |
| google-gemini-4-argon | Full harness-engineering analysis beyond prompting: ACI ergonomics (100-line viewer, 50-cap search, lint-on-edit revert), Shadow Workspaces, Agentless Paradox vs. ReAct, Agentless hierarchical localization + diff-patch synthesis | Agentless arXiv:2407.01489; SWE-agent arXiv:2405.15793; Aider benchmarks | **Yes** — ACI guardrails are transferable to Phase 1 even though editing scaffolds are separate streams |
| google-gemini-4-argon | Context Rot / Compaction Theory / Progressive Disclosure — root instruction files must be routing tables (60–200 lines), not encyclopedias; Code Wiki routing beats RAG; naive LLM compaction elongates trajectories while Dynamic Context Pruning + structured payloads do not | Hong et al.; Tirmazi et al., arXiv:2608.01326; arXiv:2508.21433 | **Yes** — constrains `fence/check` trace injection and synthesis context windows |
| google-gemini-4-argon | Security-boundary finding: instruction hierarchy, CAI, and prompt-only rules do not constitute a security boundary; deterministic client hooks, tool-execute-before guards, and proxy gateways (OpenAPPA, LangGraph HITL) do | CVE-2025-61593/54136/59536/55284/39861; Archestra/OpenAPPA; PydanticAI ModelRetry; LangGraph interrupt | **Yes** — rules that are not commands must not be assumed enforced; reference for Phase 1 `rules → checks` design |
| google-gemini-4-argon | Heterogeneous synthesis principle: cross-family decorrelation (MoA, PoLL juries) and clean-slate Generator→Evaluator via disk files beat homogeneous debate; Judge diversity matters | MoA arXiv:2406.04692; PoLL arXiv:2404.18796; clean-slate Generator/Evaluator loop | **Yes** as architectural principle for evaluation, not for MoA-as-feature |
| google-gemini-4-argon | Deterministic tooling details — PydanticAI `@result_validator` with `ModelRetry`, Agentless AST skeleton search (4 candidate edit sets × 10 patches, Search/Replace diffs), Aider PageRank repo-maps | SWE-agent; Agentless; Aider; PydanticAI docs | **Yes** — adopt the Search/Replace diff + lint-revert guardrail and the reproduction-test filter |
| ollama-launch-deepseek-v4.1-flash | "Verification beats consensus" thesis with the verified/unverified domain split and selector binding constraint; over-optimisation argument against judge-gated patches | Gao et al., arXiv:2210.10760; Zheng arXiv:2306.05685 | **Yes** — governs the whole stream's selector hierarchy |
| ollama-launch-deepseek-v4.1-flash | "Generate the missing verifier" principle — if no tests exist, the fence's first job is to create one so sampling has a filter | CodeT + R2E-Gym framing | **Yes** — sequence ordering for Phase 1 |
| ollama-launch-deepseek-v4.1-flash | Internal-vs-visible contract: surface evidence ("3 variants passed") not candidates; one `choice`-type queue item per run for preferences | Design proposal building on stream 05 queue pattern | **Yes** |
| ollama-launch-minimax-m3.1-flash | Audit table correcting prior stream-03 siblings' numbers (Reflexion 67%→91% misattribution, Self-Refine ablation 6%/33%/61%, USC real gains +3–4pp not +10–15pp) | Paper re-reads vs sibling claims | **Yes** — corrections incorporated throughout this synthesis |
| ollama-launch-minimax-m3.1-flash | Adaptive-Consistency stop rule, disagreement-gated escalation, and the full cost-accounting (2N+1 calls for pipeline, budget reductions 3.3–7.9× at <0.1% accuracy cost) | Aggarwal arXiv:2305.11860; Wang arXiv:2604.26644; Seer Self-Consistency | **Yes** — primary cost control for Phase 1 |
| ollama-launch-minimax-m3.1-flash | SWE-bench Verified contamination warning (3× file-localization, 6× no-context memory effects) and metric hygiene (Pass@1 vs Pass@3, cost-of-pass, ECR@1) | arXiv:2512.10218; OAgents arXiv:2506.15741; ECR@1 arXiv:2512.01232 | **Yes** — Phase 1 eval design must adopt cost-of-pass and a private eval set |
| ollama-launch-minimax-m3.1-flash | Model-tier switch / reasoning floor — external scaling method rankings invert on reasoning models (majority vote dominates MoA/best-of-N/revision) | Wang et al., arXiv:2504.14047, 2505.20522 | **Yes** — flag for hackathon: determine whether Muse Spark is reasoning-optimized before locking elicitation design |
| ollama-launch-minimax-m3.1-flash | FrugalGPT / cascade / early-abstention pattern for small-model tiers (98% cost cut at equal performance; 175× judge-cost spread) | arXiv:2305.05176, 2502.09054, 2512.01232 | **Yes** — if the fence must work on modest wrapped models |

## 4. Gaps in the collective research

1. **No matched-cost study of "1 sample + agent loop" vs "k samples + agent loop."** Strong numbers are single-turn generation (AlphaCode) or sampling-with-test-filter (Monkeys, R2E-Gym); nobody measures the fence-shaped loop end-to-end at equal dollar cost. *Close with:* 10-task private eval set, same total token budget, A/B single-pass+agent vs fence (1→verify→k) on real vibe-coded repos.
2. **No controlled evaluation of the literal "ask 5, self-critique, synthesize 1" recipe on code.** E-26/E-28 are reasoned from components; magnitudes are proxies. Requires a registered experiment before any marketing claim.
3. **Verifier quality on vibe-coded projects is unmeasured.** Benchmark flakiness (11.3%, <20% distinguishability) is the *best* case — curated suites. Hobby projects with no tests and LLM-written suites will be worse; no paper measures that regime. Requires instrumenting `fence/verifier` on real user projects.
4. **Latency tolerance for non-technical users is unmeasured.** "Tens of seconds" is inference from builder patterns and notification literature, not a coding-agent user study. Requires a 5-user think-aloud on fence latency budgets.
5. **Difficulty estimation for compute-optimal allocation has no reliable cheap proxy.** Risk tags (auth/payments/migration) and sample-disagreement heuristics are proposals; no calibrated estimator exists for vibe-coded projects.
6. **The reasoning-model-era transfer is only partly answered.** Wang et al. (arXiv:2504.14047) favour simpler methods on math/LiveCodeBench, but not on Muse Spark-class models or on consumer coding tasks — directly relevant to Phase 1 model choice.
7. **Self-consistency on non-numeric discrete decisions (file routing, secret-vs-placeholder) is untested.** Plausible and widely proposed, but no paper applies it to code navigation; cost/benefit unknown.
8. **Patch synthesis (merging candidate diffs) is untested.** The prohibition is structural (unvalidated hybrid, flaky-suite compounding), not empirically measured.
9. **Whether "3 of 4 candidates passed" evidence lines build or erode trust is untested.** Design proposal with no user study.
10. **Single-call 5-way synthesis truncation on real code outputs is asserted (flash) but unmeasured.** Plausible mechanism; needs token-budget measurement on real diffs before being cited as fact.
11. **Whether the "reasoning floor" applies to the hackathon's model tier.** If Muse Spark is not reasoning-optimized, external revision cannot substitute for it (minimax E-24); if it is, complex scaling should be skipped. The model tier is unknown to this synthesis.

## 5. The consolidated answer

Multi-sample elicitation genuinely beats single-pass generation only when each extra pass brings new *verifying* information — an execution signal, a type/lint result, or a second candidate filtered by a test — and it loses or wastes tokens when it merely re-asks the same model for its opinion. The usable pattern for a companion that must feel fast is `1 sample → execute the cheapest check that could fail → on failure, parallel best-of-k (k≤5) filtered by that check, first pass wins`: it is parallel so latency stays ~one attempt, and it adds almost no cost on the happy path. Ungrounded self-critique, multi-agent debate, and full "ask 5 → critique → synthesize" pipelines all inflate cost and degrade accuracy at equal budgets; plan synthesis is the one exception, scoped to planning and scoped to prose. Every remaining rule follows from that: never gate a patch with an LLM judge, never merge candidate diffs into an untested hybrid, generate a missing smoke test before relying on selection, and instrument the harness for dollars and seconds per successful task rather than abstract accuracy.

## 6. Actions for Phase 1

### Copy (do this)

1. **Ship `.fence/check` as the silent Reflexion circuit** — after every agent write run `tsc`/`lint`/tests silently; if green commit with 0 added latency; if red inject the compact trace + "diagnose and fix" and retry once (cap 1–2, then queue as `issue → fix → plan`). [A-02] — hook: `on_write → fence:check → on_fail inject(trace) retry(1)`; cap and queue.
2. **Ship `1 sample → verify → conditional parallel best-of-k (k≤5) → first pass wins` as the default code loop** — do not eagerly sample; escalate only on first-attempt failure; parallelise so wall-clock ≈ 1 attempt. [A-06] — gate: `verify() || bestOf(k=4, parallel, selector=execution)`.
3. **Generate the missing verifier** — before relying on selection, have the harness create a smoke test / schema check / build gate (CodeT dual-execution pattern) so that sampling has something to filter against. [D-07] — `fence/verifier bootstrap: synthesize_tests → run_twice(flakiness_check) → keep`.
4. **Copy Agentless reproduction-test filtering and Aider/SWE-agent ACI guardrails** — Search/Replace diff format, lint-on-edit automatic revert, `find_file`/`search_file` capped at 50 hits, 100-line viewer window; discard candidates that fail syntax or regression suites. [argon unique] — diff format + `lint_revert: true` + `search_cap: 50`.
5. **Implement every guardrail as a command, not a principle** — "no secrets" → `gitleaks`, "no dev-deps in prod" → `npm audit --omit=dev`, "no `.env` in git" → `git ls-files` check; a rule that cannot run a command is not a rule. [A-02, minimax E-17] — rule manifest: `{ id, command, when: on_write|on_commit }`.
6. **Adopt adaptive stopping and disagreement-gated escalation as cost control** — stop sampling when first 3 agree; use sample disagreement as the free difficulty estimator; budget reductions of 3–7× at <0.1% accuracy cost. [A-10] — `stop_when: k_agree(3) || confidence_threshold`.
7. **Keep elicitation silent-internal; surface evidence not candidates** — one line ("4 attempts, 1 passed") + expand affordance; candidate lists stay in the log. [A-07] — UI contract: `evidence_line: "${k} candidates, ${pass} passed the checks"`.
8. **Reserve candidate display for genuine preference forks** — at most one `choice` item per run, 2–3 options, default preselected, triggered only by persistent sample disagreement. [deepseek E-18 / minimax E-34] — queue type `choice`, cap `max_per_run: 1`.

### Avoid (do not do this)

1. **Never ship ungrounded self-critique** — no skill text may say "review your own work" or "check for bugs" without an accompanying tool signal or written rubric; intrinsic correction degrades accuracy (CommonSenseQA 75.8%→41.8%). [A-01] — lint hook: block skill phrases matching `review your.*work|check.*bugs` without `verifier:`.
2. **Never gate a patch with an LLM judge** — execution > type-check > lint > learned verifier > judge; best-of-N against a weak proxy actively degrades true quality and judges carry position/verbosity/self-preference biases. [A-05, A-09] — policy: `patch_selector ∈ {execution, typecheck, lint}`.
3. **Never use string-level self-consistency for code** — variable-name and ordering divergence makes majority vote meaningless for source text. [A-03] — apply majority vote only to discrete classification/flag outputs.
4. **Never deploy multi-agent debate or MoA on the interactive path** — debate loses to self-consistency at equal budget (83.0% vs 88.2%) and is non-parallelizable; MoA's headline is a preference benchmark and it is dominated by majority vote on reasoning models. [A-04, A-08] — if deliberation is needed, use parallel sampling + vote.
5. **Never synthesize (merge) candidate patches** — merging diffs produces code no candidate validated and no test has seen; patches are selected, never blended. [D-02] — primitive: `pick_first_passing`, no `merge_candidates` for patches.
6. **Never surface raw critique logs, tool dumps, or candidate comparisons to the non-technical user** — it induces panic and transfers selection work. [A-07] — log stays on disk; user sees only the winning answer + evidence line.
7. **Never dump monolithic instruction files into context** — keep root `AGENTS.md`/`CLAUDE.md` to 60–200 lines as a routing table to `docs/index.md` and on-demand `SKILL.md`; naive compaction and RAG fragmentation cause Context Rot. [argon unique] — root file budget `≤200 lines`, routing not encyclopedia.

### Invent (we must build this, nobody has)

1. **`.fence/verifier` — the trust ladder** — ordered deterministic checks `(1) compile/typecheck → (2) lint → (3) tests run twice (flakiness detector) → (4) generated tests with dual execution agreement → (5) optional LLM judge for prose only`; each rung records its verdict so the user can see *how* something was verified. [A-05, A-09, D-07] — artefact `.fence/state/verdicts.json` per run.
2. **`.fence/escalate` — cost-gated elicitation driven by disagreement** — estimate difficulty from risk tag (auth/payments/migration/unknown-file) × sample disagreement, then route: greedy+verify → 3-candidate parallel+verify → best-of-5 → escalate to human; hard rule: never spend >3× without a verifier; happy-path budget ≈1.0–1.2×. [A-10, minimax E-30] — config key `elicitation.policy: { risk_tags, disagreement_threshold, max_multiplier: 3 }`.
3. **`.fence/lessons` — cross-session reflection memory** — persist Reflexion reflections keyed by `project + error_signature` in `.fence/state/lessons.json`; inject the relevant lesson into the next attempt; also implements SWE-Replay-style trajectory reuse at the project level. [D-05] — file `.fence/state/lessons.json` with eviction policy and false-positive guard.
4. **Model-tier switch in harness config** — because of the reasoning floor (majority vote dominates complex scaling on reasoning models, and external revision cannot substitute on non-reasoning ones), the elicitation strategy must depend on the wrapped model: reasoning model → parallel sampling + vote + execution verify; non-reasoning model → execution verify + re-sample (never refine) + consider small-model cascade. [minimax E-24] — config key `model.tier: reasoning | standard` read at startup.
5. **Cost-of-pass instrumentation for the demo** — build a 10-task private eval set from real user repos; report accuracy *and* dollars *and* seconds side-by-side for single-pass vs fence-enabled; report Pass@1 never Pass@3, plus ECR@1 per sub-step. [minimax E-23] — artefact `docs/research/eval/03-cost-of-pass.md`.

## 7. Open questions we could not resolve

- [ ] Does sample-disagreement gating match a learned difficulty predictor on vibe-coded projects, or does it merely proxy for model uncertainty on malformed prompts? — calibrate disagreement vs human-rated task difficulty on 20 tasks.
- [ ] What is the flakiness and false-pass rate of *LLM-generated* smoke tests on real hobby projects (not benchmarks)? — instrument `.fence/verifier` bootstrap on 10 real projects and measure retry variance.
- [ ] On which model tier does vibe-fence actually run — is Muse Spark reasoning-optimized? If not, what fraction of the fence-shaped gain is recoverable by elicitation vs requiring a model upgrade? — run a tier A/B on the private eval set before locking elicitation design.
- [ ] How much of the "generate the missing verifier" value survives when the verifier itself is LLM-written and unverified? — measure the CodeT bootstrap's lift vs a hand-written smoke test on the same tasks.
- [ ] Do users prefer seeing "3 of 4 candidates passed" vs a plain success message, and does it build or erode trust when a candidate fails? — 5-user think-aloud on evidence-line variants.
- [ ] What is the non-technical user's latency tolerance curve for background fence retries — seconds vs abandonment? — unmeasured; needs a timed-interaction study, not an inference from builder patterns.
- [ ] Can discrete-decision self-consistency (file routing, secret-vs-placeholder flags) be validated at all, or is its cost unjustified vs a single greedy classification? — pilot on 10 routing decisions with 3 samples + vote vs greedy.
- [ ] Is SWE-bench Verified contaminated enough to invalidate it as a fence baseline, and if so what should its private replacement cover? — replicate the no-context file-localization control on a private eval set.

## 8. Sources

| # | Source | Type | Accessed | From |
|---|--------|------|----------|------|
| 1 | Wang, Wei et al., Self-Consistency Improves Chain of Thought Reasoning, arXiv:2203.11171 | paper | 2026-10-20 | all 5 |
| 2 | Huang et al., Large Language Models Cannot Self-Correct Reasoning Yet, arXiv:2310.01798 | paper | 2026-10-20 | all 5 |
| 3 | Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning, arXiv:2303.11366 | paper | 2026-10-20 | all 5 |
| 4 | Wang et al., Mixture-of-Agents Enhances LLM Capabilities, arXiv:2406.04692 | paper | 2026-10-20 | all 5 |
| 5 | Du et al., Improving Factuality and Reasoning through Multiagent Debate, arXiv:2305.14325 | paper | 2026-10-20 | all 5 |
| 6 | Zheng et al., Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena, arXiv:2306.05685 | paper | 2026-10-20 | all 5 |
| 7 | Chen et al., Universal Self-Consistency for LLM Generation, arXiv:2311.17311 | paper | 2026-10-20 | all 5 |
| 8 | Brown et al., Large Language Monkeys: Scaling Inference Compute with Repeated Sampling, arXiv:2407.21787 | paper | 2026-10-20 | deepseek, minimax |
| 9 | Li et al., Competition-Level Code Generation with AlphaCode, arXiv:2203.07814 | paper | 2026-10-20 | muse-spark, flash, deepseek, minimax |
| 10 | Chen et al., CodeT: Code Generation with Generated Tests, arXiv:2207.10397 | paper | 2026-10-20 | muse-spark, flash, deepseek, minimax |
| 11 | Madaan et al., Self-Refine: Iterative Refinement with Self-Feedback, arXiv:2303.17651 | paper | 2026-10-20 | muse-spark, flash, argon, minimax |
| 12 | Chen et al., Teaching LLMs to Self-Debug, arXiv:2304.05128 | paper | 2026-10-20 | deepseek, minimax |
| 13 | Snell et al., Scaling LLM Test-Time Compute Optimally, arXiv:2408.03314 | paper | 2026-10-20 | muse-spark, argon, deepseek, minimax |
| 14 | Gao et al., Scaling Laws for Reward Model Overoptimization, arXiv:2210.10760 | paper | 2026-10-20 | deepseek, minimax |
| 15 | Zhang et al., Generative Verifiers: Reward Modeling as Next-Token Prediction, arXiv:2408.15240 | paper | 2026-10-20 | minimax |
| 16 | Bai et al., Constitutional AI: Harmlessness from AI Feedback, arXiv:2212.08073 | paper | 2026-10-20 | deepseek, minimax |
| 17 | Smit et al., Should we be going MAD? A Look at Multi-Agent Debate Strategies, arXiv:2311.17371 | paper | 2026-10-20 | deepseek, minimax |
| 18 | Kamoi et al., When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey, arXiv:2406.01297 | paper | 2026-10-20 | minimax |
| 19 | Wu et al., Inference Scaling Laws: An Empirical Analysis of Compute-Optimal Inference, arXiv:2408.00724 | paper | 2026-10-20 | muse-spark, minimax |
| 20 | FrugalGPT: How to Use LLMs While Reducing Cost, arXiv:2305.05176 | paper | 2026-10-20 | minimax |
| 21 | Xia et al., Agentless: Demystifying LLM-based Software Engineering Agents, arXiv:2407.01489 | paper | 2026-10-20 | argon |
| 22 | Yang et al., SWE-agent: Agent-Computer Interfaces, arXiv:2405.15793 | paper | 2026-10-20 | argon |
| 23 | Anthropic, Building Effective Agents, anthropic.com/research/building-effective-agents | industry research | 2026-10-20 | flash, minimax |
| 24 | R2E-Gym: Procedural Environments and Hybrid Verifiers, arXiv:2504.07164 | paper | 2026-10-20 | minimax |
| 25 | Wang et al., Rethinking Inference-Time Scaling: Efficiency Limits and Linguistic Signals, arXiv:2504.14047 | paper | 2026-10-20 | minimax |
| 26 | Aggarwal et al., Adaptive-Consistency for Efficient Reasoning and Coding, arXiv:2305.11860 | paper | 2026-10-20 | minimax |
| 27 | When to Vote, When to Rewrite: Disagreement-Guided Routing, arXiv:2604.26644 | paper | 2026-10-20 | minimax |
| 28 | OAgents: An Empirical Study of Building Effective Agents, arXiv:2506.15741 | paper | 2026-10-20 | minimax |
| 29 | Gou et al., CRITIC: Large Language Models Can Self-Correct with Tool, openreview.net | paper | 2026-10-20 | argon |
| 30 | Hong et al., Context Rot: How Increasing Input Tokens Impacts LLM Performance, trychroma.com | paper | 2026-10-20 | argon |
| 31 | Tirmazi et al., Context Compaction Theory, arXiv:2608.01326 | paper | 2026-10-20 | argon |
| 32 | Does SWE-Bench-Verified Test Agent Ability or Model Memory?, arXiv:2512.10218 | paper | 2026-10-20 | minimax |
| 33 | Cost-Saving LLM Cascades with Early Abstention, arXiv:2502.09054 | paper | 2026-10-20 | minimax |
| 34 | LLM-as-a-Judge for Scalable Test Coverage Evaluation, arXiv:2512.01232 | paper | 2026-10-20 | minimax |
| 35 | Thinking Longer, Not Larger: Scaling Test-Time Compute, arXiv:2503.23803 | paper | 2026-10-20 | minimax |
| 36 | SWE-Replay: Efficient Test-Time Scaling for SWE Agents, arXiv:2601.22129 | paper | 2026-10-20 | minimax |
| 37 | Sycophancy / Identity Bias in Multi-Agent Debate, arXiv:2509.23055 / arXiv:2510.07517 | paper | 2026-10-20 | argon |
| 38 | Verga et al., Replacing Judges with Juries (PoLL), arXiv:2404.18796 | paper | 2026-10-20 | argon |
| 39 | Chan et al., ChatEval: Multi-Agent Referee Team, arXiv:2308.07201 | paper | 2026-10-20 | argon |
| 40 | Liang et al., Encouraging Divergent Thinking through Multi-Agent Debate, arXiv:2305.19118 | paper | 2026-10-20 | argon |
