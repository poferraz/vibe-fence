# Synthesis — Stream 02: Harness → Output Quality

- **Stream:** 02 — Harness → Output Quality
- **Synthesized:** 2026-10-20
- **Contributors compared:** 5 (list with source counts)
  - `muse-spark-2026-10-20` — 28 sources
  - `google-gemini-3.8-flash-2026-10-20` — 10 sources
  - `google-gemini-4-argon-2026-10-20` — ~135+ sources (docx + md; same author, counted once)
  - `ollama-launch-deepseek-v4.1-flash-2026-10-20` — 15 sources
  - `ollama-launch-minimax-m3.1-flash-2026-10-20` — 46 sources
  - `openai-gpt-6-2026-10-20` — **missing** (no `02-*` file; only `01-harnesses.md` present)

---

## 1. What the contributors agree on

> Claims where ≥3 contributors independently landed on the same conclusion, with the best citation for each.
> These become the "settled" inputs to Phase 1.

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|----------------|---------------|-----------|------------------------|
| A-01 | **Instruction hierarchy exists and helps with injection, but is not a security boundary.** Training to prioritise system > user > tool output cuts injection success (TensorTrust 32.8%→95.9%) with minimal capability loss, yet indirection bypasses, control-illusion failures, and the over-refusal tax remain. Text tier alone is insufficient. | Wallace et al., arXiv:2404.13208 (all 5 cite); Geng et al., arXiv:2502.15851 / *Control Illusion* (minimax, muse-spark via Wen et al.); Rehberger indirection bypass (argon) | `unanimous` (5/5) | **copy** as defence-in-depth + **invent** structural enforcement (hooks/sandbox/gateway) — never hierarchy alone |
| A-02 | **Context budgeting is mandatory; position and volume degrade attention.** U-shaped "lost in the middle" curve, Chroma's 18-model 20–50% drop (10k→100k), RULER/NoLiMa effective-window collapse, and Cursor's measured −66% system-prompt / −60% tool-def / −7% total-token savings all converge: treat context as a budget, not a buffer. | Liu et al., arXiv:2307.03172 (all 5); Chroma *Context Rot* 2025 (muse-spark, deepseek, minimax, argon); Cursor *Improved token efficiency* Sep 2026 (muse-spark, minimax, argon); RULER arXiv:2404.06654 (minimax, argon) | `unanimous` (5/5) | **copy** — hard token budget for always-on instructions; keep critical invariants at context boundaries; re-anchor after compaction |
| A-03 | **Selective / progressive disclosure beats monolithic instruction files.** Short map + scoped rules + on-demand skill bodies (Anthropic L1/L2/L3, Cursor `.cursor/rules/*.mdc` globs, OpenAI Codex 88 nested AGENTS.md) reduces wasted reads and tool-selection error. RAG-MCP tripled tool-selection accuracy (13.6%→43.1%); dynamic loading is load-bearing. | Anthropic *Effective context engineering* Sep 2025; Anthropic *Agent Skills* overview (L1/L2/L3); Gan & Sun arXiv:2505.03275 RAG-MCP; Anthropic *Code execution with MCP* 150k→2k tokens (−98.7%) | `unanimous` (5/5) | **copy** — `AGENTS.md` as ≤400-token map/router (one line per subsystem, no prose); rules scoped by globs; skills metadata-only until triggered; MCP as code APIs |
| A-04 | **Verification must be mechanical, not self-assessment.** Execution-grounded feedback (Reflexion 67%→91% HumanEval; Agentless 32% @ $0.70) beats self-critique (Huang et al. negative result). Loop guards, mandatory `fence check`, and intermediate-artifact validation (Spec Kit +0.15/5, 99.7% pass rate) are required. "Done means checked." | Shinn et al. arXiv:2303.11366; Xia et al. arXiv:2407.01489 Agentless; Chen et al. arXiv:2304.05128 Self-Debug; Huang et al. arXiv:2310.01798 negative result (deepseek, minimax); Spec Kit arXiv:2604.05278 (minimax) | `unanimous` (5/5) | **copy** — Read→Think→Write→Check with executable validators; check gates queue closure; diagnosis artefact before retry; never "review your own work" |
| A-05 | **Stale context is worse than no context; over-constraining creates compliance theatre.** Context files evolve by frequent small additions (arXiv:2511.12884); a drifted file feeds "confident lies." Too many rules cause superficial compliance (instruction-following diverges from task success; +20% cost with no gain in the ETH Zurich study). | Gloaguen et al. arXiv:2602.11988 (deepseek, minimax); Chatlatanagulchai et al. arXiv:2511.12884; Cursor *Shadow Workspace* parser-drift post-mortem (argon); Cursed-instructions p^n model (minimax) | `unanimous` (5/5) | **copy** — `fence sync` regenerates generated blocks from tree/manifests; `fence validate` checks freshness + orphaned docs; rule-count cap |
| A-06 | **Tool/interface design is a first-class performance variable.** SWE-agent ACI (12.5% SWE-bench, 18% on Lite vs 11% raw shell) and bounded viewers/search caps drive large benchmark swings; tool names/schemas/return shapes are prompt engineering. | Yang et al. arXiv:2405.15793 SWE-agent (all 4 substantive contributors); Aider *Repository map* PageRank; Anthropic *Writing tools for agents* | `strong` (4/5; muse-spark covers via NemoClaw/routing) | **copy** — project-aware verbs (`fence run/check/diff/undo`) with compact structured output; bounded file viewer (100 lines), search cap (50), 4 kB shell caps |
| A-07 | **Prompt injection via the harness's own files is a demonstrated attack class with high success rates.** Repository files loaded as instructions enable indirect prompt injection; harness files are the vector. Mitigations require deterministic controls, not more prose. | AIShellJack 41–84% ASR, 83.4% Cursor auto-approve (minimax); ReadSecBench up to 85% exfiltration (minimax); CVE catalogue (argon: CVE-2025-61593/54795/55284 etc.); OWASP AST01 malicious skills (minimax, argon) | `strong` (3/5 explicitly measured; 5/5 acknowledge as risk) | **invent** — integrity attestation + trusted/untrusted data separation; pre-execution skill review + tiered runtime gating (see §8) |
| A-08 | **A few well-chosen guardrails dominate; every rule consumes joint reliability.** ManyIFEval / MOSAIC / IFScale: P(all)≈p^n — GPT-4o 85%→15%, Claude-3.5 90%→44% at 10 constraints; ~97.5% per-rule compliance affords only ~2 rules at 95% joint reliability. CCI factorial: all-in 5-component scaffold beaten by a proper subset in every condition (32% on HotpotQA@8B, 79% on GSM8K). | Harada et al. ICLR 2025 *Curse of Instructions* + MOSAIC arXiv:2601.18554 + IFScale (minimax); Liu arXiv:2605.05716 *Cross-Component Interference* (minimax) | `strong` (3/5 make quantitative; 5/5 converge on "few rules") | **copy** — cap always-on rules at ~3–5; A/B each addition in isolation *and* combination; teaching dial = rule-count dial |

---

## 2. Where they disagree

### D-01 — Are generated `AGENTS.md` files net-positive?

- **Reading A (muse-spark, argon):** `AGENTS.md` as a ~100-line map + `docs/` system of record with `description-agent` frontmatter, linters, and doc-gardening is `practiced` and load-bearing — Codex 1.5k PRs / 1M lines cited as existence proof.
- **Reading B (deepseek, minimax — measured):** First rigorous eval (Gloaguen et al., arXiv:2602.11988, n=138 AGENTbench + 300 SWE-bench Lite): LLM-generated context files **−3% resolution / +23% cost** on AGENTbench (−2% on SWE-bench Lite); developer-written only +4%; 100% of generated files contained overviews but did not speed file discovery; stronger generators did not produce better files. When repo docs are removed, generated files then help (+2.7%) — folklore comes from undocumented repos.
- **Resolution:** Adopt Reading B. Treat the measured null/negative as the default. A generated overview is not the product; a minimal routing file is. **Unresolved sub-question:** does the null transfer to greenfield beginner repos (vibe-fence's population) vs Python SWE-bench? Needs a bench on vibe-coder repos.
- **Why it matters for Phase 1:** Do not ship auto-generation of a large narrative `AGENTS.md`. Ship a ≤400-token invariant+router file + dynamic ranked map (Aider-style PageRank, ≤1k tokens, refreshed per task). A/B before/after on real projects.

### D-02 — Filtered ACI tools vs thin bash-only interface

- **Reading A (gemini-3.8-flash, deepseek, argon):** Provide pre-filtered, project-aware tools (`fence-lint`, `fence-test`, windowed viewer, capped search) — 4× SWE-bench gain is interface-driven; raw shell floods attention with ANSI/compiler noise.
- **Reading B (minimax §4, citing SWE-agent → mini-swe-agent):** Same Princeton/Stanford lab now ships `mini-swe-agent`: **~100 lines of Python, bash only, no tool-calling**, scoring >74% on SWE-bench Verified vs 12.3% for the rich ACI in 2024. Conclusion: "a lot of this is not needed at all" as models improved.
- **Resolution:** **Model-tier-conditional.** Frontier models → thin bash + 2–3 fence verbs. Cheap/weak models → richer filtered interface (Archestra's weak-model failures clustered in file handling/sandbox/provider schemas — exactly where filtering helps). Same fence, different adapter profiles; re-validate as models improve.
- **Why it matters for Phase 1:** Per-runtime adapters must encode not just window size but tool-surface policy by model tier. Avoid hard-coding a rich ACI that becomes a liability on frontier models (token cost, tool-selection error).

### D-03 — What makes negative constraints fail: valence or count?

- **Reading A (gemini-3.8-flash):** "Pink elephant" anchoring — negative phrasing activates the forbidden token; fix is affirmative framing with explicit targets.
- **Reading B (minimax §6 + muse-spark §4):** Measured driver is **count**, not valence: p^n decay is the binding constraint. Cursor's −66% system-prompt trim removed prohibition lists but the gain is better explained by fewer rules. Affirmative framing helps but does not repeal p^n.
- **Resolution:** Both partially true; quantify matters. Prefer positive definitions (Cursor measured across families) but the budget lever is **number of always-on rules**, not wording alone.
- **Why it matters for Phase 1:** Counting rules in `fence validate` is load-bearing; rewriting "DO NOT" → "DO" is hygiene. Do the former first.

### D-04 — Does scaffolding help safety? Can you stack components?

- **Reading A (argon — long-running harness literature):** Decomposed Planner→Generator→Evaluator (clean-slate, zero shared context) + ACID continuity artifacts + browser/Playwright sensors + shadow workspaces yields +31% feature / +37% task completion; multi-model cross-review is the maturity path.
- **Reading B (minimax §2, §7):** Factorial CCI: all-in scaffold beaten by proper subset in every condition; Planning Shapley value negative; 90% of interference violations are sign-flipping (greedy add-one-at-a-time unreliable). ClawsBench: success and safety uncorrelated; highest-success model tied for highest unsafe-action rate (23%); scaffolding added +39–63 pp capability but safety rules still leaked secrets and allowed 90% injection compliance; domain-skills+meta-prompt ceiling for capable models.
- **Resolution:** Compose sparingly. Argon's multi-session machinery is valuable for long horizons, but minimax's measurement warns that each addition must be A/B'd in isolation *and* combination. Safety does not come from meta-prompt rules; it comes from structural controls (permissions/validators/gates). Report capability *and* unsafe-action rate together.
- **Why it matters for Phase 1:** Phase 1 primitives (teaching dial, turbo, queue, skill definitions) must be introduced incrementally with a safety scoreboard — not as a stacked "all-in" harness.

### D-05 — Is instruction hierarchy the primary safety mechanism?

- **Reading A (muse-spark, gemini-3.8-flash):** Encode invariants in highest-privilege layer (system/developer prompt); treat tool outputs as untrusted data — hierarchy is the primary lever.
- **Reading B (minimax §5, deepseek §4, argon):** *Control Illusion* (Geng et al.): "the system/user split fails to establish a reliable hierarchy"; societal framings (authority/expertise) beat role labels. Wallace et al. gains come with over-refusal tax and indirection bypasses (Rehberger). Deepseek: hierarchy is model-side probabilistic; hard rules need hooks/sandbox. ClawsBench: prompt safety rules still leaked.
- **Resolution:** Hierarchy as defence-in-depth only. Primary enforcement is deterministic: hooks, sandbox, container isolation, identity-bound MCP routing.
- **Why it matters for Phase 1:** Adapter design must not rely on a runtime's "system prompt" existing; M1 scaffold (`src/`, `tools/`, `dist/`) must include hook/sandbox enforcement, not just prompt templates.

### D-06 — What causes long-context degradation: position or steps?

- **Reading A (muse-spark, gemini-3.8-flash, argon, deepseek):** Positional — U-shaped "lost in the middle" + context-rot distractor/shuffled-haystack effects; fix is re-anchoring invariants at start/end.
- **Reading B (minimax §10, citing Mittal arXiv:2609.01660):** Step-count geometric collapse — every model (frontier included) fell near-perfect→near-zero within 16 steps on agentic task; bounding the window *steepened* decay (logit −0.69 vs −0.44, p=3e-6), contradicting the LITM explanation. Sequential scaling hits a context ceiling; parallel scaling has a verification gap.
- **Resolution:** Both mechanisms are measured on different tasks; for vibe-fence's agentic loop, **step count is the binding constraint**. Positional mitigation still helps for single-prompt retrieval, but the task loop needs a hard step budget with checkpoints well before 16 steps.
- **Why it matters for Phase 1:** Queue/task decomposition (WIP=1 Kanban) and per-task step budgets are architectural, not tuning.

### D-07 — Architect→Editor split: proven or practiced?

- **Reading A (gemini-3.8-flash):** `proven` — Aider Architect Mode + Anthropic Orchestrator-Worker pattern; SOTA on multi-file benchmarks.
- **Reading B (minimax §13):** `practiced` — downgraded because numbers come from vendor benchmark with no isolation of the architect stage; Aider's own doc reports it but without ablation.
- **Resolution:** Treat as `practiced` with strong directional support; A/B in vibe-fence's own bench (strong planner + cheap editor is a cost win regardless).
- **Why it matters for Phase 1:** M3 skill specs should include a plan-artifact gate before edits, but validate it rather than assume it.

---

## 3. Unique contributions

> What each contributor found that the others missed. Keep this — it is why we ran multiple models.

| Contributor | Unique contribution | Evidence | Adopt? |
|-------------|---------------------|----------|--------|
| **muse-spark** | **One-fact-one-location + docs-as-routing index** — each fact lives in one owner; `AGENTS.md` is a map into `docs/fence/` with frontmatter `description-agent` routing; one-canonical-owner with PR-gated parity tests + doc-gardening receipts. Plus the only **10-mode harness failure taxonomy** (infinite loops, context overflow/rot, prompt injection, over-constraining, hallucinated tool calls, stale context, state degradation, schema drift, cost blowout, learned helplessness). | NVIDIA NemoClaw docs (2026); OpenAI Codex harness post; rahulkashyap.dev; harness-engineering.ai; ZeroEntropy | **Yes** — foundation for `src/` authority / `dist/` disposable + `.fence/` single-owner state + INDEX router + failure-mode hardening |
| **muse-spark** | **Cursor's 4 measured budget moves as a checklist** — trim system prompt to definitions-only (−66%), offload low-freq tools to dynamic (−60% tool-def tokens), compress file reads (line numbers every 10th line), cache-stability tricks (phantom user message, GPT-5.6 breakpoints) — with production A/B (7% total savings, 46.9% on MCP sessions, zero quality loss). | Cursor *Improved token efficiency* 2026; Moxie Docs field guide | **Yes** — concrete `context-budget.yml` + `generate.ts` validation thresholds |
| **muse-spark** | **Adapter-constrained windows & dynamic tool loading as a design primitive** — runtimes (Claude/OpenCode/Codex/Cursor/Hermes) differ in window, caching, compaction (5-stage auto-compact, memory tool, multi-agent fresh windows). Cursor moved MCP to dynamic loading. | Cursor blog 2026; Anthropic Sep 2025; Claude Code docs | **Yes** — `src/adapters/{claude,codex,cursor,opencode,hermes}.yml` budget profiles |
| **gemini-3.8-flash** | **Negative-constraint / pink-elephant framing + anti-sycophancy invariants + explicit loop circuit-breaker** — affirmative pattern prescription (not just "don't"), Senior Partner persona to counter RLHF sycophancy (Perez/Wei), and a 2-strikes circuit-breaker (`fence/queue.json` + read-only mode). | Anthropic system-prompt guidelines; Perez et al. arXiv:2212.09251; Wei et al.; Archestra/SWE-bench apology-loop post-mortems | **Yes** — rewrite every rule as affirmative target; add anti-sycophancy invariant; wire 2-failure circuit-breaker |
| **gemini-4-argon** | **Full topology of file discovery / scoping / precedence** across Claude Code / Cursor / Codex / Roo / OpenCode / Copilot — including the critical finding that `CLAUDE.md` is delivered as *user message* with a "may ignore" reminder and that all levels concatenate (no override except `CLAUDE.local.md`), so invariants cannot live there alone. Plus **byte-capped output pipes** (`head -c 4000` → ~50% token cut), **ACID continuity artefacts** (progress/decisions/spec), **WIP=1 Kanban** (+37%) and **Bootstrap Contract** (+31%), and the **CVE catalogue** tying injection to sandbox gaps. | Agent Harness Taxonomy docs; Austin Serb Codex byte-cap benchmarks; Anthropic long-running harness; CVE-2025-61593/54795/55284/54136 etc. | **Yes** — precedence table in adapter specs; byte caps by default; multi-session state files; CVE-driven sandbox requirements |
| **gemini-4-argon** | **Adversarial generator-evaluator (GAN-inspired) + runtime self-healing** — clean-slate per invocation, Playwright MCP visual verification, anti-slop rubrics driving creative divergence (Terminal Noir case), PydanticAI `ModelRetry` with `EXPLAIN`, Cursor shadow workspaces with snapshot+rebase. Plus **HITL failure modes** in LangGraph (5 modes: non-idempotent replay, semantic poisoning, edit loops, batch double-execution, dangling tool calls). | Anthropic harness-design-long-running-apps; BRUTALWAV/Mnemo cases; Cursor Shadow Workspace; PydanticAI docs; LangGraph HITL | **Yes** — evaluator in separate process with browser sensor; LangGraph hardening for any HITL paths |
| **deepseek** | **Ranked lever table by measured effect + the headline reframing** — "the fence cannot win by writing a better README" — explicitly quoting the ETH Zurich null result as the organizing insight: only **procedural, non-standard-practice** content in context files helps; overviews cost +20% with no gain. Plus the **per-runtime token budget proposal** (≤400 tokens always-on, asserted in `validate.ts`). | Gloaguen et al. arXiv:2602.11988; Agentless arXiv:2407.01489; Wallace/Greshake/Lee et al. | **Yes** — the sharpest statement of the null result and the 400-token budget rule |
| **deepseek** | **Explicit "one checkable artefact per rule" principle + hook-based enforcement** — every guardrail ships with a command that can fail; if it cannot be checked, it belongs in teaching, not instructions. Hierarchy as defence-in-depth, never as mechanism. | S-09/S-15; S-01 divergence (compliance ≠ correctness); S-03 localise→propose→verify | **Yes** — operationalises the copy/avoid/invent split |
| **minimax-m3.1-flash** | **Cross-component interference (CCI) factorial** — 2⁵=32 subsets, 118 configs, 32k+ evals: all-in scaffold beaten by proper subset in every setting; Planning Shapley negative; tool-use 70% of value; 90% sign-flipping violations. Plus **instruction-count p^n model** (ManyIFEval/MOSAIC/IFScale) with production budget table (~2 rules at 95% reliability with 97.5% per-rule p). | Liu arXiv:2605.05716; Harada ICLR 2025; Purpura et al. arXiv:2601.18554; IFScale arXiv:2507.11538 | **Yes** — governs rule count and component-addition discipline |
| **minimax-m3.1-flash** | **Measured injection defence + measured failure of the obvious defence** — AIShellJack 41–84% ASR, ReadSecBench 0% human detection + 85% exfiltration, ClawSentry hard-block+reviewer+evidence agent 39.55%→2.61% ASR at −0.73 pp task cost, vs "Safety Skill + AGENTS.md" text-only defence 25/60→18/60 (and *cost* task success) and Claude Guardrails no better than nothing; 42.1% of attacks succeeded while task still passed. | Liu et al. arXiv:2509.22040/2605.25871; Kao et al. arXiv:2603.11862; Wang et al. arXiv:2608.21101 ClawSentry; Jin et al. arXiv:2605.12015 SkillSafetyBench | **Yes** — directly portable to fence trust model |
| **minimax-m3.1-flash** | **Step-count collapse + tool-schema bloat + benchmark decay** — geometric law (collapse within 16 steps, window tightening worsens it), RAG-MCP 43.1% vs 13.6% tool selection, RULER/NoLiMa/OP-RAG effective-window results, and OpenAI's SWE-bench Verified→Pro retraction (~30% broken tasks) as warning that score without stated harness is incomparable. | Mittal arXiv:2609.01660; Gan & Sun arXiv:2505.03275; Hsieh et al. arXiv:2404.06654; Modarressi et al. arXiv:2502.05167; OpenAI *Separating signal from noise* Jul 2026 | **Yes** — step budgets, retrieval, and eval hygiene |

---

## 4. Gaps in the collective research

1. **No public RCT isolates harness components on vibe-coder's actual population (non-technical, greenfield, JS/TS).** All strong measurements are on SWE-bench (Python issue-resolution) or QA tasks (HotpotQA/GSM8K) or mock productivity suites. Beginner-task null from the ETH Zurich study may not transfer; the optimal fence rule count `p` for fence-specific rules is unmeasured. **Close by:** build a 10–20 task adversarial bench of realistic vibe-coder scenarios (secret committed, `npm run` with network, vague prompt, drifted docs, injection payload, force-push) with deterministic out-of-band grading, run with/without the fence, report task success *and* unsafe-action rate — not just success.
2. **Hierarchy robustness vs context length and vs societal framings is unmeasured.** *Control Illusion* tests conflict resolution; nobody has published the hierarchy-adherence degradation curve at 100k+ tokens. Per minimax §5, authority/expertise framings beat role labels — but the interaction is unquantified. **Close by:** conflict battery at 10k/50k/100k+ with both role and authority framings; measure joint reliability per §6.
3. **No standard for compaction fidelity or "read but do not obey" channel.** Compaction has a communication-complexity floor (Tirmazi et al. 2026) and LLM summaries elongate trajectories; no fidelity metric exists. No harness ships a structural trusted/untrusted data separation for repo-resident files — the field notes the gap but has no design. **Close by:** fence-owned integrity attestation + untrusted-data channel with deterministic marking; measure compaction fidelity on set-membership tasks.
4. **Teaching-dial ↔ safety-dial interaction is unmeasured.** All "max→silent" proposals are extrapolation; at what verbosity does teaching text itself become the distraction/clash bloat it is meant to prevent? ClawsBench scaffolding ceiling suggests capable-model combos can hurt; nobody has measured teaching+gating together. **Close by:** factorial over dial levels × guardrail strictness on the same bench.
5. **Cost/quality Pareto by skill and by model tier is unmeasured.** Selective-loading savings are global (Cursor 7%); per-skill savings (vibe-init vs vibe-guard) are unknown. Stronger-generator ≠ better context file, and open-weight <$1/run clears ~90% of Archestra's bench vs $20–30 frontier — but the curve per skill is unmapped. **Close by:** per-skill token accounting in telemetry; model-tier-conditional adapter profiles re-validated as models improve.
6. **Supply-chain injection at build time has no deployed countermeasure in coding harnesses.** NVIDIA AI Red Team pattern (Go library writes `AGENTS.md` during `go mod tidy`, before any agent runs) collapses the code/data boundary; the fence is the layer that could add hashing/attestation and cross-compilation validation, but nothing measured exists. **Close by:** `fence validate` hash + post-install-modification flag + "same-session modification" refusal, evaluated on an adversarial bench.
7. **Benchmark decay undermines cross-report comparison.** SWE-bench Verified replaced, then SWE-bench Pro ~30% broken per OpenAI audit (Jul 2026); harness-specific scores without stated harness are incomparable. **Close by:** always report harness alongside score; write tasks as behavioural specs, not implementation tests; use multi-reviewer + investigator-agent pipeline.

---

## 5. The consolidated answer

Harness design is the dominant lever on LLM output — not because it makes the model smarter, but because it sets the floor that prevents unreliable generation from compounding into shipped defects — yet the literature proves its returns are sharply bounded: a few structural choices (mechanical verification before any "done," a small set of checkable always-on invariants enforced outside the prompt, and selective/progressive disclosure with hard context and step budgets) capture nearly all measured benefit, while the folk staples of large generated `AGENTS.md` overviews, stacked scaffolding, and prose safety rules are measured as net-negative or ineffective and actively increase cost, injection surface, and failure rate. Every strong study converges on the same ceiling: instruction hierarchy helps but leaks, long windows are not long attention, and more rules or more scaffold components reliably make outcomes worse (p^n joint reliability and the all-in-scaffold factorial both show proper subsets beating the stack), so vibe-fence must win by building a minimal, integrity-attested, adapter-aware, budgeted harness whose safety is structural — not by writing a better README for the agent.

---

## 6. Actions for Phase 1

### Copy (do this)

1. **Ship a minimal always-on router** — `AGENTS.md`/`CLAUDE.md` ≤400 tokens (muse-spark ~100–200 lines; deepseek/minimax ≤400 tokens) containing only tool commands and hard invariants; `docs/fence/INDEX.md` as machine-readable router (link, category, one-line summary) with per-page `description-agent` frontmatter. Assert budget in `tools/validate.ts`; error if exceeded. — *A-03, A-08, D-01, arXiv:2602.11988, Cursor A/B*
2. **Enforce instruction hierarchy as defence-in-depth but never as the mechanism** — highest-privilege layer where runtime supports it + authority/expertise phrasing; treat every tool result/file read/RAG hit as untrusted data; pair with deterministic pre-execution guardrails, path locks (canonical case-normalised), sandbox/container isolation. — *A-01, arXiv:2404.13208, CVE catalogue, OWASP AST01*
3. **One-fact-one-location** — `src/` is the one editable authority → `dist/` disposable build output; state facts (teaching level, queue items) in single-owner files under `.fence/`; AGENTS.md and skills reference owners, never duplicate. Add PR-gated parity checks + doc-gardening job (`docs-updated` / `no-docs-needed` / `blocked` receipt). — *muse-spark §4, NemoClaw, OpenAI Codex harness*
4. **Budget context explicitly** — `src/framework/context-budget.yml` caps for static instructions / dynamic retrieval / history / headroom; validate in `generate.ts`; keep high-frequency tools static, lazy-load the rest (MCP as code APIs: 150k→2k tokens); metadata-only skill exposure (L1/L2/L3 split); byte-cap shell outputs at 4 kB (`head -c 4000` / `tail -c 4000` → ~50% cut). — *A-02, Cursor 66%/60%/7%, RAG-MCP 43.1% vs 13.6%*
5. **Read→Think→Write→Check with mechanical Check** — every fence task ends with an executable validator (tests/lints/typecheck/fence invariants); "done" means checked; reviewer-agent loop for non-trivial changes; require short diagnosis artefact in `.fence/` before each retry; validate intermediate artefacts (does plan reference files that exist? does diff touch only intended paths?). — *A-04, Shinn Reflexion 67%→91%, Agentless, Spec Kit*
6. **Place critical invariants at context boundaries and re-anchor after compaction** — never mid-prompt; preserve architectural decisions/unresolved bugs, discard redundant tool outputs; prefer deterministic pruning (retain last 5 observations) over LLM prose summaries (which elongate trajectories); respect compaction's information-theoretic floor. — *A-02, A-05, arXiv:2608.01326*
7. **Self-contained, minimally overlapping tools with explicit schemas and error shapes** — consolidate workflow tools (`get_customer_context` pattern); separate errors from empty results (`isError: true` with remediation); fix Grep-style silent-failure traps. — *Anthropic Writing tools for agents; MCP spec*
8. **Validate freshness** — `vibe-fence validate` + `.fence/freshness.json` checks: referenced scripts/paths still exist, no orphaned docs, route index resolves, tool schemas unchanged, generated blocks regenerated from tree/manifests not appended. Run on install and in CI. — *A-05, muse-spark §3/§4*
9. **Per-runtime adapter budget profiles** — `src/adapters/{claude,codex,cursor,opencode,hermes}.yml` encoding effective window, caching semantics, edit format (patch vs string replacement), and static-vs-dynamic tool policy — with model-tier-conditional tool surface (thin bash for frontier, richer filtered interface for weak). — *A-06, Cursor per-model tool formatting, Archestra weak-model debugger, D-02*
10. **Gate any plan before edits** — Architect→Editor split: force plan artifact in `.fence/plans/` and approval before file modifications; strong planner + cheap editor is the cost-effective pairing. — *D-07, Aider benchmark*
11. **Affinity-free safety design** — never rely on "Safety Skill + AGENTS.md" prose (measured 25/60→18/60 with task-success cost; Claude Guardrails no better than nothing); use pre-execution skill-package review (FSPR) + tiered runtime gating (deterministic rules → semantic reviewer → read-only evidence agent) with hard-block (warning mode 24.56% vs 8.47% hard-block ASR). Gate releases on unsafe-action rate, not task success. — *ClawSentry ASR 39.55%→2.61% at −0.73 pp cost, SkillSafetyBench*
12. **Hard step budget per fence task** — cap well before 16 steps; checkpoint via WIP=1 Kanban state machine (`not_started`→`active`→`passing`/`blocked`); decompose long tasks rather than run longer; a smaller window is not a fix. — *D-06, Mittal geometric law, Anthropic WIP=1 +37%, General AgentBench*

### Avoid (do not do this)

1. **The "1,000-page manual"** — bloated `AGENTS.md` (500+ lines, linter configs, OpenAPI dumps, reactive hotfixes) causes non-guidance, whole-file attention dilution, and prompt-injection bloat; keep prompts at "right altitude." — *argon, muse-spark §15, arXiv:2602.11988*
2. **Auto-generating a large `AGENTS.md` from the repo** — measured net-negative on well-documented repos (−3% / +23% cost); stronger generators not better. If generated at all, generate minimally and A/B it. — *D-01, Gloaguen et al.*
3. **Monolithic always-on rule sets** — p^n decay affords ~2 rules at 95% reliability (97.5% per-rule); ~3 at 90%; ~5 at 80%. Push the rest behind progressive disclosure; teaching dial must be a rule-count dial. — *A-08, Harada/MOSAIC/IFScale*
4. **Stacking harness components greedily** — all-in 5-component beaten by proper subset in every condition; Planning Shapley negative; 90% sign-flipping violations make add-one-and-measure unreliable. A/B in isolation *and* combination. — *Liu CCI arXiv:2605.05716*
5. **Relying on system/user role split as primary safety** — "fails to establish a reliable hierarchy" (Geng et al.); indirection bypasses exist; over-refusal tax is real. — *D-05, Rehberger, Wallace over-refusal*
6. **Raw shell for routine tasks on weak-model tiers without caps** — unbounded `cat`/`grep` dumps, unfiltered test logs, and JSON-escaped code strings cause hallucination and window saturation. Use bounded viewers/search and byte caps; reserve bash-only thin surface for frontier tier. — *A-06, A-02*
7. **Un-gated turbo / unbounded self-correction loops** — unbounded retries produce apology loops and learned helplessness; gate by severity: `block` (auto-halted) > `warn` (queued, agent resolves, user informed) > `nudge` (teaching only); 2-strikes circuit-breaker → read-only consultation mode + `.fence/queue.json`. — *muse-spark §15, gemini-3.8 loop breaker, minimax §12*
8. **Bigger summariser models** — measured negligible gain (Cursor A/B shelved it); log shelved ideas. — *muse-spark §13, minimax §15*
9. **Long sessions that scale linearly** — context ceiling + verification gap: sequential scaling degrades past modest turns, lines-of-code negatively correlates with features completed; parallel self-selection is the bottleneck. Decompose; verify mechanically. — *General AgentBench arXiv:2602.18998, Anthropic telemetry*

### Invent (we must build this, nobody has)

1. **Trusted-channel harness** — a "read but do not obey" mechanism for repo-resident docs + integrity attestation of fence-owned files (`hash` + `fence validate` flagging post-install modification or same-session `AGENTS.md` overwrites) + rule-count cap enforcement. The injection surface is the fence's own value proposition; if it cannot measurably reduce ASR, it increases risk. — *A-07, minimax §8/§9, argon CSA/nvidia, OWASP AST01*
2. **Adversarial fence bench** — 8–12 tasks that measure the fence's *own* attack surface: poisoned `AGENTS.md` in vendored dependency, README instructing to skip the fence, malicious skill package, "user asks to bypass" prompt. Grade on unsafe-action rate. — *A-07, minimax §9, argon CVEs*
3. **Capability-vs-safety double scoreboard** — every fence eval reports task success *and* unsafe-action rate together (ClawsBench: uncorrelated; 42.1% attacks succeeded while task passed). Success-only optimisation is adversarial to the product promise. — *minimax §7/§9*
4. **Model-tier-conditional adapter profiles** — rich filtered interface for weak models vs thin bash for frontier, re-validated as models improve; per-model edit format (patch vs string replacement) baked into adapters. — *D-02, minimax §4/§16, Cursor*
5. **Byte-capped + graph-ranked context pipeline** — `vibe-map` step emitting ≤1k-token PageRank-ranked symbol map refreshed per task (not a static overview that goes stale or gets poisoned) + 4 kB shell-output caps + last-5-observation pruning with ACID continuity artefacts (`progress.md` / `DECISIONS.md` / `spec`/`test-plan`/`plan`). — *argon, minimax §18, muse-spark, Anthropic +31%/+37%*
6. **Per-task step-budget + context-anxiety detector** — fence notices hedging/refusal ("too big") and proactively splits the task; checkpoints via Kanban state machine; telemetry spans for composition (instruction/retrieval/tool/history), loop length, fix-vs-noise. — *D-06, minimax §10/§15, muss-spark telemetry*
7. **Teaching-dial as context-budget dial + one-shot repo bench** — `max→silent` controls how much teaching text enters context (so `max` doesn't cause its own bloat) and the fence tells the user which documentation tier they're in (undocumented → context files help; well-documented → minimal) via a 10-task with/without-fence run on *their* repo. — *muse-spark §7/§15, minimax §14, deepseek M-16*

---

## 7. Open questions we could not resolve

- [ ] **Does the AGENTS.md null transfer to beginner JS/TS greenfield repos?** Gloaguen et al. is Python-centric; authors note training-data prevalence may nullify the effect; niche JS/TS/toolchain is untested — and the folklore-helpful condition (undocumented repo) may *be* vibe-fence's population. *Experiment:* replicate Agentbench protocol on a JS/TS greenfield bench with/without fence-generated files.
- [ ] **What is the optimal always-on rule count for fence-specific invariants?** p^n predicts a cliff but `p` for fence rules (not ManyIFEval keyword constraints) is unmeasured; no Pareto frontier of rule count vs success vs cost exists for a real project. *Experiment:* factorial over rule counts (0–10) on adversarial fence bench.
- [ ] **Can a fence's teaching layer and safety layer coexist without hitting the scaffolding ceiling?** ClawsBench found domain-skills+meta-prompt not always beating either alone for capable models; no study measures teaching+gating interaction. *Experiment:* factorial teaching-dial × guardrail-strictness.
- [ ] **How does instruction-hierarchy adherence degrade with context length?** Unmeasured; *Control Illusion* tests conflict resolution, not long-horizon. Given geometric step-collapse, the right axis is steps, not tokens. *Experiment:* conflict battery at 10k/50k/100k+ tokens and at 4/8/16/32 steps.
- [ ] **What is the remediation cost of a false-positive hard block for a non-technical user?** ClawSentry cuts ASR sharply but reports task-success delta, not developer-time cost; a false-positive wall is a product failure for vibe-coders. *Experiment:* measure time-to-resolution and abandonment after blocks in user study.
- [ ] **What is the cost/quality Pareto per skill and per model tier?** Global savings known (Cursor 7%; RAG-MCP 43% accuracy); per-skill `vibe-init`/`vibe-guard`/`vibe-plan` savings unknown; cross-model transfer of ACI is contested (mini-swe-agent). *Experiment:* per-skill token accounting + model-tier adapter A/B.
- [ ] **Can compaction fidelity be measured, and LLM-summary vs deterministic-pruning chosen per phase?** Communication-complexity floor proven but no standard metric; prose summaries elongate trajectories. *Experiment:* set-membership fidelity tasks before/after compaction strategies.
- [ ] **When should path-scoped (nested) rules be used vs avoided?** Mechanism exists (88 nested AGENTS.md in OpenAI monorepo; `.claude/rules` globs) but no study measures marginal value of a second context file. *Experiment:* nested vs single-file router on monorepo tasks.

---

## 8. Sources

> Union of the contributors' sources, deduplicated. Cite the contributor whose file listed it.

| # | Source | Type | Accessed | From |
|---|--------|------|----------|------|
| 1 | Wallace et al., *The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions*, arXiv:2404.13208 | paper | 2026-10-20 | all 5 |
| 2 | Wu et al., *IHEval: Evaluating Language Models on Following the Instruction Hierarchy*, arXiv:2502.08745 | paper | 2026-10-20 | muse-spark |
| 3 | Wen et al. / Geng et al., *The Failure of Instruction Hierarchies in LLMs* / *Control Illusion*, arXiv:2502.15851 | paper | 2026-10-20 | muse-spark, minimax |
| 4 | Yeung, *How LLMs Learn Roles, Follow Instructions, and Get Exploited* (HiddenLayer, 2026-05-26) | blog | 2026-10-20 | muse-spark |
| 5 | Anthropic, Prompt-injection defenses incl. Claude Opus 4.5 (1% browser injection) | blog/research | 2026-10-20 | muse-spark |
| 6 | OpenAI, *Harness engineering: leveraging Codex in an agent-first world* (openai.com/index/harness-engineering) | blog | 2026-10-20 | muse-spark, minimax, argon |
| 7 | NVIDIA NemoClaw, *Engineer Documentation for AI Agents* (docs.nvidia.com/nemoclaw) | docs | 2026-10-20 | muse-spark |
| 8 | Orchestra / Hugo Lu, *Agent Harness Engineering: Principles, Codex, and Research Survey* | blog | 2026-10-20 | muse-spark |
| 9 | Claude Code, *How Claude remembers your project* + *claude-md* + *context window* (code.claude.com) | docs | 2026-10-20 | muse-spark, argon |
| 10 | Moxie Docs, *Context Engineering for Coding Agents: A Field Guide* + *AGENTS.md guide* (moxiedocs.com) | blog/docs | 2026-10-20 | muse-spark |
| 11 | IllegalCreed, *agent-doc-architecture: routing + addressing* (github.com) | repo | 2026-10-20 | muse-spark |
| 12 | Anthropic, *Effective context engineering for AI agents* (Sep 29 2025) | blog | 2026-10-20 | muse-spark, minimax, deepseek, argon |
| 13 | Cursor, *Improved token efficiency for longer agent runs* + *Continually improving our agent harness* (cursor.com/blog, 2026) | blog | 2026-10-20 | muse-spark, minimax, argon |
| 14 | Anthropic, *Building Effective AI Agents* (Dec 2024) | blog | 2026-10-20 | muse-spark, gemini-3.8 |
| 15 | Rahul Kashyap, *Harness Failure Modes: What Actually Breaks and How to Catch It* (rahulkashyap.dev) | blog | 2026-10-20 | muse-spark |
| 16 | Dr. Sarah Chen, *The Complete Guide to Agent Harness* (harness-engineering.ai) | blog | 2026-10-20 | muse-spark |
| 17 | Archestra, *We Debug Our AI Harness on Weak Models on Purpose* (Jul 20 2026) + *Skills aren't prompts. They can run code.* (Aug 2026) | blog | 2026-10-20 | muse-spark, gemini-3.8, minimax, argon |
| 18 | OWASP LLM Top 10 2025 — Prompt Injection #1 (genai.owasp.org) | standard | 2026-10-20 | muse-spark |
| 19 | Anthropic, *Writing tools for AI agents — with AI agents* + *Trustworthy agents in practice* + *Writing effective tools for agents* | blog/research | 2026-10-20 | muse-spark, deepseek, minimax, argon |
| 20 | OpenAI, *Codex as a platform: build on the open agent harness* (developers.openai.com/blog/codex-as-a-platform) | blog | 2026-10-20 | muse-spark |
| 21 | Yang et al., *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering*, arXiv:2405.15793 | paper | 2026-10-20 | gemini-3.8, deepseek, minimax, argon |
| 22 | Liu et al., *Lost in the Middle: How Language Models Use Long Contexts*, arXiv:2307.03172 | paper | 2026-10-20 | gemini-3.8, deepseek, minimax, argon |
| 23 | Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning*, arXiv:2303.11366 | paper | 2026-10-20 | gemini-3.8, deepseek, minimax |
| 24 | *Tests as Prompt: A Test-Driven-Development Benchmark for LLM Code Generation*, arXiv:2402.14812 | paper | 2026-10-20 | gemini-3.8 |
| 25 | Perez et al., *Discovering Language Model Behaviors with Model-Written Evaluations*, arXiv:2212.09251 | paper | 2026-10-20 | gemini-3.8 |
| 26 | Wei et al., *Simple Synthetic Data Reduces Sycophancy in Large Language Models* (Google DeepMind, 2023) | paper | 2026-10-20 | gemini-3.8 |
| 27 | Aider, *Architect Mode Benchmark* + *Separating code reasoning and editing* (aider.chat, Sep 2024) | benchmark/blog | 2026-10-20 | gemini-3.8, minimax |
| 28 | Archestra AI Agent Harness Post-Mortems (github.com/archestra-ai/archestra) | repo | 2026-10-20 | gemini-3.8 |
| 29 | Xia et al., *Agentless: Demystifying LLM-based Software Engineering Agents*, arXiv:2407.01489 | paper | 2026-10-20 | deepseek, minimax, argon |
| 30 | Chen et al., *Teaching Large Language Models to Self-Debug*, arXiv:2304.05128 | paper | 2026-10-20 | deepseek, minimax |
| 31 | Huang et al., *Large Language Models Cannot Self-Correct Reasoning Yet*, arXiv:2310.01798 | paper | 2026-10-20 | deepseek, minimax |
| 32 | Chroma, *Context Rot: How Increasing Input Tokens Impacts LLM Performance* (Jul 2025) | research | 2026-10-20 | deepseek, minimax, argon |
| 33 | Lee et al., *The Impact of Generative AI on Critical Thinking*, CHI 2025 (Microsoft) | paper | 2026-10-20 | deepseek, minimax |
| 34 | Chatlatanagulchai et al., *Agent READMEs*, arXiv:2511.12884 | paper | 2026-10-20 | deepseek, minimax |
| 35 | Claude Code, *Hooks reference* (code.claude.com/docs/en/hooks) | docs | 2026-10-20 | deepseek |
| 36 | Gloaguen et al., *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*, arXiv:2602.11988 (ETH Zurich / LogicStar.ai) | paper | 2026-10-20 | deepseek, minimax |
| 37 | Liu, *More Is Not Always Better: Cross-Component Interference in LLM Agent Scaffolding*, arXiv:2605.05716 (Amazon) | paper | 2026-10-20 | minimax |
| 38 | Li et al., *ClawsBench: Evaluating Capability and Safety of LLM Productivity Agents in Simulated Workspaces*, arXiv:2604.05172 | paper | 2026-10-20 | minimax |
| 39 | Jin et al., *SkillSafetyBench: Evaluating Agent Safety under Skill-Facing Attack Surfaces*, arXiv:2605.12015 | paper | 2026-10-20 | minimax |
| 40 | Wang et al., *ClawSentry: A Progressive Multi-Tier Security Monitor*, arXiv:2608.21101 | paper | 2026-10-20 | minimax |
| 41 | Harada et al., *Curse of Instructions: Large Language Models Cannot Follow Multiple Instructions at Once*, ICLR 2025 | paper | 2026-10-20 | minimax |
| 42 | Purpura et al. (Capital One), *MOSAIC: Deconstructing Instruction-Following*, arXiv:2601.18554 | paper | 2026-10-20 | minimax |
| 43 | Modarressi et al., *How Many Instructions Can LLMs Follow at Once?* (IFScale), arXiv:2507.11538 | paper | 2026-10-20 | minimax |
| 44 | Anthropic, *Code execution with MCP: Building more efficient agents* | blog | 2026-10-20 | minimax |
| 45 | Hsieh et al., *RULER: What's the Real Context Size of Your Long-Context Language Models?*, arXiv:2404.06654 | paper | 2026-10-20 | minimax, argon |
| 46 | Modarressi et al., *NoLiMa: Long-Context Evaluation Beyond Literal Matching*, arXiv:2502.05167 | paper | 2026-10-20 | minimax |
| 47 | Gan & Sun, *RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation*, arXiv:2505.03275 | paper | 2026-10-20 | minimax |
| 48 | OpenAI, *Separating signal from noise in coding evaluations* (Jul 8 2026) | research post | 2026-10-20 | minimax, argon |
| 49 | Liu et al., *Your AI, My Shell: Demystifying Prompt Injection Attacks on Agentic AI Coding Editors* (AIShellJack), arXiv:2509.22040 | paper | 2026-10-20 | minimax, argon |
| 50 | Kao et al., *You Told Me to Do It: Measuring Instructional Text-induced Private Data Leakage in LLM Agents* (ReadSecBench), arXiv:2603.11862 | paper | 2026-10-20 | minimax |
| 51 | NVIDIA AI Red Team, *Mitigating Indirect AGENTS.md Injection Attacks in Agentic Environments* (Apr 20 2026) | blog | 2026-10-20 | minimax, argon |
| 52 | Cloud Security Alliance, *README Injection: Repository Files Hijacking AI Coding Assistants* (Mar 17 2026) | research note | 2026-10-20 | minimax |
| 53 | OWASP, *AST01: Malicious Skills* (Agentic Skills Top 10) (owasp.org) | standard | 2026-10-20 | minimax |
| 54 | Anthropic, *Agent Skills* overview (L1/L2/L3 progressive disclosure) (platform.claude.com) | docs | 2026-10-20 | minimax, argon |
| 55 | Aider, *Repository map* — PageRank, `--map-tokens` (aider.chat/docs/repomap.html) | docs | 2026-10-20 | minimax, deepseek, argon |
| 56 | Li et al., *Benchmark Test-Time Scaling of General LLM Agents*, arXiv:2602.18998 | paper | 2026-10-20 | minimax |
| 57 | *Spec Kit Agents: Context-Grounded Agentic Workflows*, arXiv:2604.05278 | paper | 2026-10-20 | minimax |
| 58 | Mittal, *How Fast Do Agents Rot? An Empirical Study of Long-Horizon Degradation*, arXiv:2609.01660 | paper | 2026-10-20 | minimax |
| 59 | Cui, *Tests as Prompt* (WebApp1K), arXiv:2505.09027 | paper | 2026-10-20 | minimax |
| 60 | Hong/Troynikov/Huber (Chroma), *Context Rot* (trychroma.com/research/context-rot) | research | 2026-10-20 | minimax, argon |
| 61 | Yu et al., *In Defense of RAG in the Era of Long-Context Language Models*, arXiv:2409.01666 | paper | 2026-10-20 | minimax |
| 62 | Maloyan et al., *Prompt Injection Attacks on Agentic Coding Assistants: A Systematic Analysis*, arXiv:2601.17548 (SoK over 78 studies) | paper | 2026-10-20 | minimax, argon |
| 63 | Cursor, *Shadow Workspace* + *Specs* (LSP diagnostics, speculative decoding) | blog | 2026-10-20 | argon |
| 64 | Rombaut, *Inside the Scaffold: A Source-Code Taxonomy of Coding Agent Architectures*, arXiv:2604.03515 (2026) | paper | 2026-10-20 | argon |
| 65 | Tirmazi et al., *Context Compaction Theory*, arXiv:2608.01326 (2026) | paper | 2026-10-20 | argon |
| 66 | Classifier Context Rot, arXiv:2605.12366 (MonitorBench, 100K→800K tokens) | paper | 2026-10-20 | argon |
| 67 | Shakir et al., *Agentless Paradox* review — SWE-bench Verified 5%→75% analysis | review | 2026-10-20 | argon |
| 68 | Agent-Computer Observation Interface (AOI), arXiv:2606.29472 | paper | 2026-10-20 | argon |
| 69 | Simple Observation Masking Is as Efficient as LLM Summarization, arXiv:2508.21433 | paper | 2026-10-20 | argon |
| 70 | PydanticAI / Vibes SDK — Type-Safe Dependency Injection, `ModelRetry` + `EXPLAIN` validator | docs | 2026-10-20 | argon |
| 71 | LangGraph / Deep Agents HITL — `interrupt()` / `Command(resume=...)` / `HumanInTheLoopMiddleware` (5 failure modes) | docs | 2026-10-20 | argon |
| 72 | Anthropic, *Harness design for long-running apps* (anthropic.com/research/harness-design-long-running-apps) — BRUTALWAV/Mnemo Generator-Evaluator cases | research | 2026-10-20 | argon |
| 73 | AGENTS.md / CLAUDE.md hierarchy docs; Cursor Rules / Skills / Commands (cursor.com/docs); OpenAI Codex AGENTS.md spec (agents.md); Roo Code Custom Modes (.roomodes); OpenCode plugins/docs | docs/spec | 2026-10-20 | argon |

> **Note on gpt-6:** `openai-gpt-6-2026-10-20` has no `02-*` file; treat as missing for stream 02 (coverage 5/6 streams per INDEX.md note: "gpt-6 missing").

