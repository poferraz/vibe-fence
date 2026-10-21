# Stream 02 — Harness → Output Quality

- **Model:** deepseek-v4.1-flash
- **Provider:** Hermes desktop app via ollama-launch (`deepseek-v4.1-flash:1017-cloud`)
- **Date:** 2026-10-20
- **Stream:** 02 — How harness design causally improves LLM output

---

## Thesis: the levers are not where the marketing is

Ranked by measured effect, the harness mechanisms available to vibe-fence look like this:

| Rank | Lever | Measured effect | Strength |
|---|---|---|---|
| 1 | **Tool / interface design (ACI)** | SOTA jumps from interface changes alone — 12.5% pass@1 on SWE-bench, 87.7% on HumanEvalFix at release | `proven` |
| 2 | **Verification loop** (execute → read error → revise) | A simple localize→repair→validate pipeline hit **32.00%** on SWE-bench Lite at **$0.70**, beating complex agents | `proven` |
| 3 | **Context selection / budget** | Position and volume degrade performance non-uniformly across 18 models; middle-of-context is worst | `proven` (direction), unmeasured (magnitude at harness level) |
| 4 | **Instruction hierarchy** | Models treat system and user text at equal priority by default; training to prioritise cuts injection success drastically | `proven` at model level |
| 5 | **Procedural instructions encoding non-standard practice** | Reliably *followed* by agents — the one context-file content type that works | `proven` |
| 6 | **Repository overview prose** ("here's what this repo is") | **No general improvement in task success, +20% inference cost** | `proven` — and it contradicts common practice |
| 7 | **Over-constraining / instruction bloat** | Contested; costs tokens, may crowd out task context | `contested` |

The headline finding for this project is #6. The largest rigorous evaluation of `AGENTS.md`-style context files finds that **providing them does not generally improve task success rates while increasing inference cost by over 20%**, across multiple LLMs, multiple coding agents, and both LLM-generated and developer-committed files. What *does* get followed is instruction content that specifies non-standard practice ([S-01]).

That reframes vibe-fence's job. A fence cannot win by writing a better README for the agent. It wins by (a) changing the interface the agent works through, (b) forcing a verification step, and (c) encoding the handful of *non-standard* practices (secrets never in the repo, no `npm run` with network, deploy is gated) that the agent would otherwise get wrong — short, procedural, checkable. Everything else is context cost with no measured return.

---

## 1. Interface design (the biggest measured lever)

### M-01 — The agent-computer interface is a first-class performance variable

- **Claim:** How the agent's tools present the repository — file viewer window size, edit commands, search output format, guardrails against destructive edits — changes task success substantially. The authors argue LM agents are "a new category of end users" who need interfaces designed for them, and demonstrate it.
- **Evidence:** Yang, Jimenez, Wettig, Lieret, Yao, Narasimhan & Press, *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering*, arXiv:2405.15793 (v1 2024-05-06, v3 2024-11-11) — https://arxiv.org/abs/2405.15793 (accessed 2026-10-20). Reported: **12.5% pass@1 on SWE-bench** and **87.7% on HumanEvalFix**, "far exceeding the previous state-of-the-art achieved with non-interactive LMs."
- **Strength:** `proven` (benchmark results, ablations over interface choices).
- **Fit for vibe-fence:** The harness should own the agent's *verbs*, not just its instructions. Concretely: provide a small set of project-aware commands (`fence run`, `fence check`, `fence diff`, `fence undo`) that produce compact, structured output, and prefer them over raw shell in the skill text. Interface design is also the cheapest lever for a harness that cannot retrain anything.

### M-02 — Tool descriptions and outputs are prompt engineering, and Anthropic treats them that way

- **Claim:** Tool names, descriptions, schemas and return formats are a design surface with documented practices: consolidate tools, return high-signal responses, paginate, use meaningful names, and evaluate tool use with held-out tasks rather than intuition.
- **Evidence:** Anthropic Engineering, *Writing effective tools for AI agents — using AI agents* — https://www.anthropic.com/engineering/writing-tools-for-agents (accessed 2026-10-20).
- **Strength:** `practiced` (vendor guidance, illustrated with worked examples; no controlled evaluation published).
- **Fit for vibe-fence:** Every guardrail should expose **one** tool with a predictable shape rather than five narrow ones, and return the *verdict plus the fix*, not a wall of scanner output. This is also how the fence keeps its own footprint small (stream 01, H-13).

### M-03 — A simple pipeline can beat a complex agent

- **Claim:** An agentless three-phase pipeline — localisation, repair, patch validation — achieved the highest performance among open-source software agents on SWE-bench Lite (**32.00%**, 96 correct fixes) at **$0.70**, beating materially more complex agent architectures. The authors' question is the right one for a harness: "Do we really have to employ complex autonomous software agents?"
- **Evidence:** Xia, Deng, Dunn & Zhang, *Agentless: Demystifying LLM-based Software Engineering Agents*, arXiv:2407.01489v2 — https://arxiv.org/abs/2407.01489 (accessed 2026-10-20).
- **Strength:** `proven` (benchmark) — caveat: SWE-bench Lite is a filtered subset and the result is from 2024-era models; the *structural* lesson (validation beats autonomy) has held up better than the number.
- **Fit for vibe-fence:** Bias the harness toward **structured pipelines over open-ended autonomy**: localise → propose → verify → report. A non-technical user benefits more from a boring pipeline that always validates than from an agent that explores. It also makes the teaching dial tractable, because every step has a name (stream 05, O-03).

---

## 2. Verification loops (the second lever, and the one that fits a fence)

### M-04 — Execution feedback is worth more than self-critique

- **Claim:** Letting the model run the code, read the failure, and revise beats asking it to review its own reasoning. The measured gains from execution-grounded loops (self-debugging, reflexion) are real; the gains from intrinsic self-correction on reasoning tasks are not (see stream 03 for the negative result).
- **Evidence:** Chen et al., *Teaching Large Language Models to Self-Debug*, arXiv:2304.05128 — https://arxiv.org/abs/2304.05128; Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning*, arXiv:2303.11366 — https://arxiv.org/abs/2303.11366; Huang et al., *Large Language Models Cannot Self-Correct Reasoning Yet*, arXiv:2310.01798 — https://arxiv.org/abs/2310.01798 (all accessed 2026-10-20 by ID).
- **Strength:** `proven` (multiple papers, consistent direction).
- **Fit for vibe-fence:** Every guardrail rule should end in an **executable check**, and the fence should never ask the agent to "review your work" without a command that produces a verdict. This is the mechanism by which the fence converts prose into behaviour (M-07).

### M-05 — Validation is what makes the cheap pipeline competitive

- **Claim:** In Agentless, the third phase — patch validation — is not a formality; it is what lets a simple pipeline compete with agents that can iterate freely. Validation converts a one-shot guess into a filtered candidate.
- **Evidence:** arXiv:2407.01489 — https://arxiv.org/abs/2407.01489 (accessed 2026-10-20).
- **Strength:** `proven`.
- **Fit for vibe-fence:** Make `fence check` **mandatory before any queue item closes** and before any "done" claim reaches the user. A fence that reports success without running the check is worse than no fence, because it manufactures false confidence (stream 05, A-04).

### M-06 — Read → Think → Write → Check is a loop, not a slogan

- **Claim:** The useful form of the loop is: read the *minimum* relevant context, state the plan in one line, write the change, then run a check that can fail. Harnesses that skip the check stage produce plausible diffs with no evidence; harnesses that skip the read stage produce edits against a hallucinated codebase.
- **Evidence:** Composite of M-01/M-04/M-05 plus Anthropic's context-engineering guidance on just-in-time retrieval — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (accessed 2026-10-20).
- **Strength:** `practiced` (widely converged practice; the specific 4-stage framing is folk, not measured).
- **Fit for vibe-fence:** Encode the four stages as **skill steps with artefacts** (`plan.md`, `diff`, `check.log`) so the harness can verify that each happened. Verification of process, not just of output, is what a harness can actually enforce across runtimes.

---

## 3. Context selection and budget (real, but smaller than the folklore)

### M-07 — Position matters: the middle is the worst place for a rule

- **Claim:** Performance on retrieval-style tasks is highest when the relevant information is at the start or end of the context and degrades significantly when it sits in the middle — even for models explicitly built for long context.
- **Evidence:** Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni & Liang, *Lost in the Middle: How Language Models Use Long Contexts*, TACL 2023, arXiv:2307.03172v3 — https://arxiv.org/abs/2307.03172 (accessed 2026-10-20).
- **Strength:** `proven` (two tasks, many models, replicated widely).
- **Fit for vibe-fence:** Put the **hard rules** (never commit `.env`, never `npm run` with network, deploy is gated) at the **top** of whatever the adapter injects, and keep them few enough that they cannot drift into the middle. This is a direct argument against the "long policy document" design.

### M-08 — "Context rot": degradation is non-uniform, and distractors are the damage

- **Claim:** Across 18 frontier models, reliability degrades as input length grows even on trivial tasks; the degradation is worse with plausible distractors, worse when the query is semantically distant from the answer, and oddly *better* on shuffled haystacks than on coherent narrative ones — i.e. coherent prose can actively distract.
- **Evidence:** Chroma, *Context Rot: How Increasing Input Tokens Impacts LLM Performance* (2025), summarised at https://academy.dair.ai/papers/context-rot (accessed 2026-10-20; primary report: research.trychroma.com/context-rot).
- **Strength:** `practiced` (vendor research, 18 models, reproducible harness) — not peer-reviewed.
- **Fit for vibe-fence:** This is the strongest available argument that **coherent repository prose is a liability**: a well-written overview is exactly the kind of narrative that distracts. Prefer short imperatives and tables over paragraphs; prefer retrieval on demand over pre-loading.

### M-09 — The measured cost of context files: no gain, +20% tokens

- **Claim:** Context files do not generally raise task success rates, and they increase inference cost by **over 20% on average**. This holds across LLMs, across coding agents, and for both LLM-generated and developer-committed files. Instructions inside them *are* well followed; repository overviews — the most recommended content — are not helpful.
- **Evidence:** Gloaguen, Mündler-Sasahara, Müller, Raychev & Vechev (ETH Zurich / LogicStar.ai), *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*, arXiv:2602.11988v3 — https://arxiv.org/html/2602.11988v3 (accessed 2026-10-20).
- **Strength:** `proven` (the first rigorous evaluation; two complementary settings: SWE-bench with LLM-generated files, and a novel collection of issues from repos with developer-committed files).
- **Fit for vibe-fence:** Read this as a design constraint, not a refutation. The paper's own conclusion is that context files are useful **for specifying non-standard coding practices** — which is precisely what a fence is. So: keep the file short, procedural, and limited to practices the agent would not otherwise follow. Cut overviews entirely. Budget the file at a few hundred tokens, not a few thousand.

### M-10 — "Docs as routing" is just-in-time retrieval wearing a different hat

- **Claim:** A small index that tells the agent where to look (rather than embedding everything) is the harness-level version of retrieval: it defers loading until the agent has a reason to read a file. The mechanism is sound; the harness-level benefit is unmeasured.
- **Evidence:** Anthropic's context-engineering guidance recommends just-in-time retrieval, compaction, and sub-agents over pre-loading everything — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents; the "one fact, one location" pattern is practitioner doctrine, not an experimental result (accessed 2026-10-20).
- **Strength:** `practiced` (vendor guidance) / `contested` (no harness-level measurement).
- **Fit for vibe-fence:** Ship `docs/clief/` as a **routing index** (the plan already specifies this pattern): one line per subsystem with a path, no content. It costs ~100 tokens and replaces a repository overview that costs thousands and measurably doesn't help (M-09).

---

## 4. Instruction hierarchy and the injection surface

### M-11 — Models do not natively privilege system over user text

- **Claim:** A core vulnerability behind prompt injection is that LLMs treat system prompts, user text and third-party content at the same priority. An explicit hierarchy plus training to follow it "drastically" increases robustness to injection — including attack types not seen in training — with minimal degradation on standard capabilities.
- **Evidence:** Wallace, Xiao, Leike, Weng, Heidecke & Beutel (OpenAI), *The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions*, arXiv:2404.13208 — https://arxiv.org/abs/2404.13208 (accessed 2026-10-20).
- **Strength:** `proven` (training intervention, measured robustness).
- **Fit for vibe-fence:** Do not rely on "the system prompt says never" for any security property. Hierarchy helps, but it is model-side and probabilistic; the fence's hard rules must be enforced by a hook or sandbox (stream 01, H-13; stream 05, U-05). Use hierarchy language in the skill text as defence-in-depth, not as the mechanism.

### M-12 — The context file is an attack surface, not just a configuration

- **Claim:** Indirect prompt injection — instructions carried in retrieved content (a file, a web page, a repo) that hijack the agent — is a demonstrated, general class of attack, not a hypothetical. A harness that injects third-party or generated text into context increases the surface.
- **Evidence:** Greshake et al., *Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection*, arXiv:2302.12173 — https://arxiv.org/abs/2302.12173 (accessed 2026-10-20).
- **Strength:** `proven`.
- **Fit for vibe-fence:** Three rules: (1) never let the fence's generated policy text be derived from repository content without review — a malicious repo can seed instructions that the fence then *relays with authority*; (2) strip HTML comments and fenced "instructions" from files the fence summarises; (3) the teaching card must never be a channel for repo-authored text, or the user will be taught by the attacker (see stream 05, gaps §12).

### M-13 — Stale context is worse than no context

- **Claim:** Because context files are loaded each session and evolve by "frequent, small additions" ([S-14]), they drift: they describe commands that no longer exist, packages that were removed, and structures that were reorganised. The agent then confidently follows a stale map.
- **Evidence:** Files "evolve like configuration code through frequent, small additions" — arXiv:2511.12884 — https://arxiv.org/abs/2511.12884 (accessed 2026-10-20). The staleness consequence is inference, not a measured result.
- **Strength:** `practiced` (evolution measured; harm inferred).
- **Fit for vibe-fence:** The fence must **own regeneration**: `fence sync` rewrites the generated section from the actual tree and package manifests, and marks hand-written sections as such. Never append to a generated block — regenerate it. A stale fence is worse than none because it is trusted.

---

## 5. Failure modes of bad harnesses

### M-14 — Over-constraining produces compliance theatre

- **Claim:** When instructions multiply, agents follow them superficially — producing code that satisfies the letter (a `try/except` around everything, a test that asserts nothing) while missing the point. The measured form of this in the literature is that agents follow instructions well ([S-01]) even when the instructions are unhelpful ([S-01] again): compliance is not correctness.
- **Evidence:** Instruction-following vs task success divergence in arXiv:2602.11988v3 — https://arxiv.org/html/2602.11988v3 (accessed 2026-10-20); the "compliance theatre" framing is my synthesis.
- **Strength:** `contested` (the divergence is measured; the mechanism is inferred).
- **Fit for vibe-fence:** Every rule needs a **check that can fail**, or it is decoration. If a rule cannot be checked, it belongs in the teaching channel (the user learns it) rather than the instruction channel (the agent pretends to obey it).

### M-15 — Learned helplessness is a harness output, not a user flaw

- **Claim:** Users who delegate generation to AI and shift to verification report less critical thinking and lower cognitive effort. A harness that removes every decision produces a user who cannot evaluate the result — which then makes the harness's checks unfalsifiable by the person relying on them.
- **Evidence:** Lee et al., CHI 2025 — https://www.microsoft.com/en-us/research/wp-content/uploads/2025/01/lee_2025_ai_critical_thinking_survey.pdf (accessed 2026-10-20). Full treatment in stream 05, A-03.
- **Strength:** `proven` (self-report) / `contested` (causation).
- **Fit for vibe-fence:** Keep at least one decision per session in the user's hands, chosen for being *learnable* rather than merely consequential (naming, structure, which page gets the feature). This is also the dial's job (stream 05, T-04).

### M-16 — Long harness text competes with the task for the same attention budget

- **Claim:** Adding harness text does not add capacity; it consumes the same context the task needs. The measurable version is the +20% cost with no gain (M-09) and the position/degradation results (M-07, M-08). The unmeasurable version is the user's attention, which the teaching channel spends (stream 05, A-07).
- **Evidence:** arXiv:2602.11988v3; arXiv:2307.03172; Chroma context rot — all above.
- **Strength:** `proven` for tokens and cost; `contested` for downstream quality harm at harness scale.
- **Fit for vibe-fence:** Set a hard budget in the build: the always-on injected policy must fit in **≤400 tokens per runtime**, with everything else loaded on demand via skills. Assert it in `validate.ts` so the budget cannot silently drift.

---

## 6. Gaps / unknowns

1. **The AGENTS.md evaluation measures task success on SWE-bench-style issues**, not beginner projects or greenfield apps. Its null result is the best evidence available and it may not transfer to vibe-fence's actual use case — where the file's job is to *prevent* classes of action, not to help solve a ticket.
2. **No study measures a hook-based guardrail's effect on real user outcomes.** Everything in M-04–M-06 is benchmark-level; the harness-level effect on a non-technical user's shipped app is unmeasured.
3. **"Context rot" is vendor research** (Chroma), not peer-reviewed, though it is unusually well-instrumented (18 models, open harness).
4. **I could not find a controlled comparison of harness *architectures*** (single prompt vs skills vs sub-agents vs hooks) on the same model and task set. The industry's claims about progressive disclosure are untested at this level.
5. **The Agentless result is from SWE-bench Lite with 2024-era models.** The structural lesson is durable; the 32.00% should not be quoted as current.
6. **Prompt-injection defences for coding agents specifically** are immature in the literature; Greshake establishes the class of attack, not a mitigation that survives an adversarial repo.
7. **No data on the marginal value of a second context file** (root + path-scoped). The nested-precedence mechanism is documented; its effect on output quality is not.
8. **Teaching text has never been measured as a context cost** inside an agent harness — the 8%/3%/1% budgets proposed in stream 05 are designed constraints, not findings.

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| S-01 | Gloaguen et al., *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*, arXiv:2602.11988v3 — https://arxiv.org/html/2602.11988v3 | paper | 2026-10-20 |
| S-02 | Yang et al., *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering*, arXiv:2405.15793 — https://arxiv.org/abs/2405.15793 | paper | 2026-10-20 |
| S-03 | Xia et al., *Agentless: Demystifying LLM-based Software Engineering Agents*, arXiv:2407.01489 — https://arxiv.org/abs/2407.01489 | paper | 2026-10-20 |
| S-04 | Liu et al., *Lost in the Middle: How Language Models Use Long Contexts*, TACL 2023, arXiv:2307.03172 — https://arxiv.org/abs/2307.03172 | paper | 2026-10-20 |
| S-05 | Wallace et al., *The Instruction Hierarchy*, arXiv:2404.13208 — https://arxiv.org/abs/2404.13208 | paper | 2026-10-20 |
| S-06 | Greshake et al., *Not what you've signed up for* (indirect prompt injection), arXiv:2302.12173 — https://arxiv.org/abs/2302.12173 | paper | 2026-10-20 |
| S-07 | Chen et al., *Teaching Large Language Models to Self-Debug*, arXiv:2304.05128 — https://arxiv.org/abs/2304.05128 | paper | 2026-10-20 (by ID) |
| S-08 | Shinn et al., *Reflexion*, arXiv:2303.11366 — https://arxiv.org/abs/2303.11366 | paper | 2026-10-20 (by ID) |
| S-09 | Huang et al., *Large Language Models Cannot Self-Correct Reasoning Yet*, arXiv:2310.01798 — https://arxiv.org/abs/2310.01798 | paper | 2026-10-20 |
| S-10 | Anthropic, *Effective context engineering for AI agents* — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | blog | 2026-10-20 |
| S-11 | Anthropic, *Writing effective tools for AI agents* — https://www.anthropic.com/engineering/writing-tools-for-agents | blog | 2026-10-20 |
| S-12 | Chroma, *Context Rot* (summary) — https://academy.dair.ai/papers/context-rot | research report | 2026-10-20 |
| S-13 | Lee et al., *The Impact of Generative AI on Critical Thinking*, CHI 2025 — https://www.microsoft.com/en-us/research/wp-content/uploads/2025/01/lee_2025_ai_critical_thinking_survey.pdf | paper | 2026-10-20 |
| S-14 | Chatlatanagulchai et al., *Agent READMEs*, arXiv:2511.12884 — https://arxiv.org/abs/2511.12884 | paper | 2026-10-20 |
| S-15 | Claude Code, *Hooks reference* — https://code.claude.com/docs/en/hooks | docs | 2026-10-20 |

---

## Implications for vibe-fence

1. **Copy — interface over instructions.** Ship `fence run/check/diff/undo` as the agent's verbs with compact structured output; the ACI result (S-02) is the largest measured lever available to a harness that cannot retrain a model.
2. **Avoid — repository overviews in the context file.** Measured unhelpful, and the most expensive content by token count (S-01, M-09). Use `docs/clief/` as a routing index instead (M-10).
3. **Copy — procedural, non-standard practice only.** The one content type that both is followed and helps: secrets never in the repo, no network from `npm run`, deploy gated, tests not deleted. Everything else moves to skills or the teaching channel.
4. **Set and enforce a token budget:** always-on policy ≤400 tokens per runtime, asserted in `tools/validate.ts`. This is the single cheapest defence against harness bloat (M-16).
5. **Copy — hard rules at the top.** Position matters (S-04) and coherent prose distracts (S-05/context rot). Order: prohibitions → commands → structure. Never a narrative.
6. **Copy — verification before every claim of success.** `fence check` gates queue-item closure and any "done" message (M-04, M-05). A fence that reports success without evidence is worse than nothing.
7. **Copy — localise → propose → verify → report.** Prefer the boring pipeline to open-ended autonomy (S-03); it is cheaper, it is teachable step-by-step, and it gives the dial named steps (stream 05, O-03).
8. **Avoid — self-critique as a verification mechanism.** External checks only (S-09). "Review your own work" is a prompt, not a test.
9. **Copy — instruction hierarchy as defence-in-depth, never as the mechanism.** Hard rules belong in hooks/sandbox (S-05, S-15; stream 01 H-13, stream 05 U-05).
10. **Avoid — relaying repo content with authority.** Strip instruction-shaped content before it reaches a teaching card; a malicious repo must not be able to author the lesson (S-06, M-12).
11. **Invent — regenerate, never append.** `fence sync` rewrites generated blocks from the real tree/manifests; hand-written blocks are marked. Stale context is a silent failure mode (M-13).
12. **Invent — one checkable artefact per rule.** Every guardrail ships with a command that can fail; rules that cannot be checked are demoted to teaching. This is the operational answer to "compliance is not correctness" (M-14).
13. **Copy — sub-agents for isolation, not for intelligence.** Use them to keep the main context clean (research in a sub-agent, verdict returned), consistent with Anthropic's compaction guidance (S-10) — not to run a multi-agent committee (stream 03 will argue that costs more than it returns).
14. **Avoid — path-scoped files until the root file is provably working.** Nested precedence is unmeasured (gaps §7); start with one file and a routing index.
15. **Measure the fence's own effect, on beginner projects.** The literature measures SWE-bench tickets; vibe-fence's claim is about preventing classes of action in greenfield apps. Build a 10-task adversarial suite (secret in repo, `npm run` with network, delete failing test, force push) and report pass/fail per runtime — that is the eval story the hackathon needs (see stream 06).
16. **Defer to synthesis:** whether `AGENTS.md` should be generated at all for runtimes where a hook-based adapter exists. The null result (S-01) makes "skills + hooks only" a defensible architecture, and it would be a genuinely contrarian position worth testing in Phase 1.
