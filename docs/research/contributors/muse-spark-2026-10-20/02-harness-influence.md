# Stream 02 — How Harness Design Causally Improves LLM Output

> **Model:** muse-spark · **Provider:** Meta via Hermes (ollama-launch) · **Date:** 2026-10-20 · **Stream:** 02 — Harness → Output Quality

---

## Findings

### 1. Instruction Hierarchy — System > Developer > User > Tool Output

- **Mechanism:** LLMs distinguish message roles via ChatML / special tokens learned during instruction tuning. A hierarchy — system prompts (highest privilege), developer/user prompts (medium), tool outputs (lowest) — teaches the model to ignore lower-privilege instructions when they conflict with higher ones. (Wallace et al., *The Instruction Hierarchy*, OpenAI, arXiv:2404.13208, Apr 2024)
- **Causal claim:** Training on the hierarchy "drastically increases robustness" to prompt injections and jailbreaks — including attack types *not seen during training* — with minimal capability degradation. IHEval follow-up (Wu et al., arXiv:2502.08745, Feb 2025) confirmed models trained this way follow higher-privilege constraints more reliably than baseline models.
- **Counter-claim:** Wen et al., *The Failure of Instruction Hierarchies in Large Language Models* (arXiv:2502.15851, Feb 2025) showed hierarchy adherence is still imperfect: stronger models follow it better, but adversarial suffixes and tool-output injections still break it in production. Hierarchy helps substantially but is not a solved defense.
- **Evidence:** Wallace et al. arXiv:2404.13208; IHEval arXiv:2502.08745; HiddenLayer deep-dive on control-token / role-learning mechanisms (hiddenlayer.com, 2026-05-26). Anthropic RL-trained Claude Opus 4.5 to 1% successful browser-based injection rate (anthropic.com/research, Sep 2025).
- **Strength:** `proven` — measured evals across multiple labs; `contested` on whether hierarchy alone is sufficient.
- **Transfer to vibe-fence:** Encode fence invariants (security, secrets, git hygiene) in the **highest-privilege** layer the runtime supports (system/developer prompt, not user prompt or AGENTS.md alone). Tool outputs must never be promoted to instruction status — mark them as untrusted data in the harness template.
- **Sources:** [1][2][3][4][5]

### 2. Prompt/File Structure — "Give a Map, Not a Manual"

- **Mechanism:** OpenAI's Codex harness uses a ~100-line `AGENTS.md` as a *table of contents* pointing into a structured `docs/` directory (design docs, plans, schema, constraints). Agents load the map first, then pull only the docs the current task needs — "progressive disclosure." Dedicated linters + CI validate coverage, cross-links, and freshness; a recurring "doc-gardening" agent fixes stale docs. (OpenAI, *Harness engineering: leveraging Codex in an agent-first world*, openai.com, 2026)
- **Causal claim:** A monolithic instruction file crowds out task context, creates "non-guidance" (everything marked important → nothing is), and rots instantly because no owner maintains it. The map pattern reduces initial context load while increasing findability, and mechanical verification prevents drift. The Codex experiment produced ~1.5k merged PRs and ~1M lines of agent-written code; the authors isolate docs architecture as a load-bearing factor, though not via an A/B.
- **Evidence:** OpenAI Codex harness post (openai.com/index/harness-engineering); NemoClaw's agentic-documentation architecture — frontmatter `description-agent` routing, layered content/routing/workflow/assurance, one-canonical-owner rule, measure-by-receipt pattern (docs.nvidia.com/nemoclaw, 2026).
- **Strength:** `practiced` — converged across Codex, Claude Code, Cursor, and NemoClaw; not yet RCT-proven.
- **Transfer to vibe-fence:** Fence-generated `AGENTS.md` must be short (map) + `docs/fence/` as the real record. Add YAML frontmatter per page (`description-agent` + triggers) so skills route deterministically. CI/lint guardrails that the map resolves and no doc is orphaned.
- **Sources:** [6][7][8]

### 3. AGENTS.md / CLAUDE.md as Persistent Memory (and Its Failure Modes)

- **Mechanism:** Claude Code loads `CLAUDE.md` (or `AGENTS.md` fallback) hierarchically — from filesystem root down to cwd, concatenated — plus `.claude/rules/` and skill-scoped instructions, into every session's context. Block-level HTML comments are stripped before injection (saves tokens). Path-scoped rules load conditionally. (code.claude.com/docs/en/memory, code.claude.com/docs/en/claude-md)
- **Causal claim:** Persistent memory eliminates re-explaining project conventions each session and reduces the "vague, high-level guidance" failure mode Anthropic identified. Anthropic's guidance: "The more specific and concise your instructions, the more consistently Claude follows them" — but they warn the same files become stale context if not maintained.
- **Practitioner note:** Moxie Docs field guide documents that stale instructions dominate coding-agent misbehavior: "it didn't know we moved that logic / deleted that pattern / config changed." Root cause is almost always stale retrieval, not model incapability. (moxiedocs.com/blog/context-engineering-for-coding-agents, 2026)
- **Strength:** `practiced` for benefit; `proven` that stale context causes confident wrong behavior.
- **Transfer to vibe-fence:** Fence must own `AGENTS.md` generation and keep it verifiably fresh via `vibe-fence validate` (check that referenced scripts, commands, and paths still exist). Never paste large bodies "to be safe" — make them queryable.
- **Sources:** [9][10][11]

### 4. One-Fact-One-Location (OCOL / One-Canonical-Owner)

- **Mechanism:** Each fact lives in exactly one authoritative layer: product behavior in code/schemas/tests, published explanation in one MDX/MD source, and every human/agent surface is *generated* from that source. Reusable facts link to their owner rather than being copied. Generated pages are disposable build output and are never hand-edited; moves preserve routes via redirects. (docs.nvidia.com/nemoclaw, 2026 — "Establish One Canonical Owner")
- **Causal claim:** Eliminates contradiction (two sources diverge → LLM picks the wrong one) and lets the harness mechanically detect staleness/missing coverage. NemoClaw pairs this with PR-gated parity tests and a doc-writer subagent that must emit a receipt (`docs-updated` / `no-docs-needed` / `blocked`) per PR.
- **Strength:** `practiced` — used in large docs-as-code shops (NemoClaw, Shopify-scale patterns); causal isolation is by reasoning more than by direct eval.
- **Transfer to vibe-fence:** `src/` is the one editable authority; `dist/` is disposable build output. Fence state facts (teaching level, pending queue items) live in `.fence/` with one canonical file each. AGENTS.md and skills never duplicate a rule — they reference the owner.
- **Sources:** [7]

### 5. Docs-as-Routing — Index + Metadata > Grep

- **Mechanism:** Instead of hoping an agent greps the right file, expose an explicit routing layer: a machine-readable index (navigation/route slugs + frontmatter keywords/intent), and per-page agent descriptions stating *when to select this page*. (NemoClaw "retrieval paths" contract; agent-doc-architecture routing/addressing patterns by IllegalCreed)
- **Causal claim:** Reduces wasted file reads and wrong-file retrievals; agents can identify the intended page for a task query without full-corpus scan. NemoClaw's contract defines measurable routing success: "a task query returns the intended page and variant."
- **Strength:** `practiced` — convergence across NemoClaw, Claude Code skills router, OpenCode plugin index.
- **Transfer to vibe-fence:** Ship `docs/fence/INDEX.md` (or `manifest.yml`) + per-skill frontmatter so the harness can route tasks to the right skill without loading everything.
- **Sources:** [7][12][13]

### 6. Context Engineering — Selective Loading vs. "Paste to Be Safe"

- **Mechanism:** Move from naive "pre-load all relevant context" (embedding retrieval + stuffing the window) to hybrid **"just-in-time" loading**: keep lightweight identifiers (paths, queries, links) in context and let the agent fetch full content via tools at runtime. Claude Code stores file paths + `glob`/`grep`; for large data it writes targeted queries and uses `head`/`tail` without loading full objects. (Anthropic, *Effective context engineering for AI agents*, anthropic.com/engineering, Sep 29 2025)
- **Causal claim:** Maximizes signal tokens per window, avoids the four context failure modes Anthropic names — **poisoning** (wrong early fact treated as truth), **distraction**, **confusion**, **clash** (contradictory context). The principle: "finding the *smallest possible* set of high-signal tokens that maximize likelihood of desired outcome." (Same source, emphasis theirs.)
- **Context-bloat cost (measured):** Cursor's 2026 efficiency push showed: trimming 66% of their system prompt, offloading low-frequency tool definitions (-60% tool-description tokens, 7,793→3,119), and removing always-on MCP bloat cut total token spend 7% with no quality drop. MCP-only savings: 46.9% tokens on sessions with an MCP tool. Preloading 10 MCP servers can cost more than the entire instruction file. (Cursor, *Improved token efficiency for longer agent runs*, cursor.com/blog/improved-token-efficiency, 2026; Moxie Docs field guide corroborates same shape.)
- **Strength:** `proven` for the cost/quality tradeoff of selective loading; `practiced` for the specific "keep identifiers, fetch on demand" tactic.
- **Transfer to vibe-fence:** Budget context explicitly (see §8). Never inject six "maybe relevant" docs. Keep index + pointers in static context; load pages dynamically. The harness should *teach* vibe-coders not to paste the whole repo into chat by giving them a better default.
- **Sources:** [14][15][16]

### 7. Context Window Budgeting — Headroom as a Design Constraint

- **Mechanism:** A 200k window already allocates ~10-40k to system prompt + tool defs, 1-8k to instruction files, and 20-100k+ to conversation history as tasks lengthen. What remains is reasoning headroom — "when this gets thin, quality drops before the agent errors out." (Moxie Docs, *Context Engineering for Coding Agents: A Field Guide*, 2026)
- **Causal claim:** Packing the window to ~90% makes agents slower, more expensive, and *worse* — the model must locate the relevant detail inside marginally relevant text. Moxie's anti-pattern: "pasting the entire docs/ folder, six files that might be related, a 600-line rules doc." Anthropic and Cursor both treat context as a *budget to spend*, not a buffer to fill.
- **Budgeting moves that worked at Cursor (measured):**
  - Trim system prompt to definitions-only; drop "DO NOT" lists the model already respects (−66% system prompt).
  - Static-context: keep only `read/grep/glob/shell/edit/ask_question`; offload `web_search`, `subagent`, `create_plan`, background monitors, etc. to dynamic loading (−60% tool-def tokens).
  - Compress file reads: line numbers every 10th line only (−1.6% cache-read tokens, no quality loss).
  - Cache stability: reserve prefix for immutable content; move variable setup to "phantom user message"; add GPT-5.6 explicit cache breakpoints (−20% cold cache misses).
- **Strength:** `proven` — Cursor A/B-tested with production traffic telemetry (token use, latency, tool-call errors, agent usage) before shipping; 7% total savings, zero quality loss.
- **Transfer to vibe-fence:** Define a fencing budget in `src/framework/context-budget.yml` (max tokens for static instructions vs dynamic retrieval vs history). Validate in `generate.ts`: error if static instructions exceed budget. Prefer dynamic retrieval by default.
- **Sources:** [15][16]

### 8. "Lost in the Middle" / Context Rot

- **Mechanism:** Liu et al. (2023) established the U-shaped attention curve: facts near the start/end of a long prompt are used reliably; facts in the middle are frequently ignored — even when correct — with 20+ absolute-point drops. Chroma (2025) replicated across 18 frontier models (GPT-4.1, Opus 4, Gemini 2.5): *every* model degraded 20-50% between ~10k and ~100k tokens, before the window filled. Related effects: attention dilution, instruction drift (system prompt directives fade as conversation lengthens), citation slip. (zeroentropy.dev/concepts/context-rot, 2026; Chroma 2025 via rahulkashyap.dev synthesis)
- **Causal claim:** Simply enlarging advertised context (100k→200k) does not fix positional bias. Information that is technically present is not necessarily attended to.
- **Strength:** `proven` — replicated by Liu et al. + Chroma + multiple follow-ups.
- **Transfer to vibe-fence:** Critical invariants (security, "never commit secrets", approval policy) must live at the *start* or *end* of context — not buried mid-prompt. Re-anchor them periodically in long runs (re-inject after compaction).
- **Sources:** [17][18]

### 9. Read → Think → Write → Check (and Verify Loops)

- **Mechanism:** Anthropic's *Building Effective AI Agents* (Dec 2024) argues most successful agentic systems use simple composable patterns — **augmented LLM → workflow → autonomous agent** — and that tool design should encourage efficient, self-contained behaviors. The canonical agent loop is Read (gather context) → Think (reason) → Write (act) → Check (verify). Codex's harness adds: write tools that "return token-efficient information and encourage efficient agent behaviors"; bloated/ambiguous tool sets are a common failure mode.
- **Causal claim:** Agents that self-verify without an external check stop prematurely (LangChain's "doom loop": writes code, re-reads it, declares done without running tests). Verification-as-another-agent (reviewer loop) closes the gap. OpenAI's Ralph-Wiggum loop (agent self-review + external agent reviews until all satisfied) is the operationalization. Principle: "done means *checked*, not *claimed*."
- **Strength:** `proven` for verification necessity (doom-loop cases are well documented); `practiced` for the specific 4-phase loop naming.
- **Transfer to vibe-fence:** Every fence task ends with a Check step wired to a *mechanical* validator (run tests/lints, verify invariant file exists), not a model self-assessment. Teachable moments live in Check failures.
- **Sources:** [19][6][20]

### 10. Adapter-Constrained Windows & Dynamic Tool Loading

- **Mechanism:** Different runtimes (Claude/OpenCode/Codex/Cursor/Hermes) have different effective windows, caching, and tool-loading semantics. Cursor now treats tools as *dynamic context*: keep high-frequency tools static, lazy-load the rest when needed. MCP tools moved to dynamic loading (46.9% token cut). Claude Code exposes auto-compaction (5-stage: budget reduction → snip → microcompact → collapse → auto-compact) plus structured note-taking (memory tool) to preserve state outside the window. (Cursor blog 2026; Anthropic Sep 2025; Claude Code docs)
- **Causal claim:** Static-context discipline + dynamic tooling yields measurable savings and prevents window saturation that triggers context-rot degradation.
- **Strength:** `proven` for dynamic tool loading (Cursor A/B); `practiced` for compaction patterns.
- **Transfer to vibe-fence:** `src/adapters/` encodes per-runtime constraints (window size, caching, which tools are static). Fence never assumes a generous window; it adapts.
- **Sources:** [14][15][16][21]

### 11. Post-Mortem: Archestra — Debug the Harness on Weak Models

- **Mechanism:** Archestra runs a nightly 26-task benchmark (real customer workflows: doc review, invoice/CV handling with hidden prompt injections, log triage with red herrings, cross-conversation memory, live facts) across ~10 models — grading deterministically via a `submit_result` channel with hidden ground truth (not LLM-judged). The team *deliberately* runs weaker/cheaper models because they surface harness bugs that strong models mask. (archestra.ai/blog/we-debug-our-ai-harness-on-weak-models-on-purpose, Jul 20 2026)
- **Causal claim:** Strong models hide product defects by compensating (extra tokens, retries). Weak-model failures exposed defects in file handling, sandbox tooling, provider schemas, and agent runtime. Fixing those made the harness work reliably for *all* models and reduced cost.
- **Strength:** `practiced` — single-company post-mortem, but detailed and mechanically grounded (repro harness in `ai-labs`).
- **Transfer to vibe-fence:** Adopt the same habit: add a nightly 10-20 task bench over realistic vibe-coder scenarios; evaluate on a cheap model (e.g. Spark-contributor) to expose fence bugs early, not just on the strongest model.
- **Sources:** [22]

### 12. Post-Mortem: Anthropic — Context Engineering as the Core Lever

- **Mechanism:** Anthropic's Sep 2025 context-engineering post systematizes what worked:
  - System prompts at the "right altitude" (neither brittle if/else logic nor vague generalities), organized into tagged sections.
  - Tools that are self-contained, robust to error, with minimal overlap.
  - "Just-in-time" agentic search over naive RAG for dynamic corpora.
  - **Compaction hygiene**: summarize near-limit history, preserve architectural decisions / unresolved bugs, discard redundant tool outputs; start with high recall then tune for precision.
  - **Structured note-taking / memory tool** for state outside the window.
  - Multi-agent architectures for long-horizon coherence (subagent with fresh window).
- **Causal claim:** Together these turn ad-hoc prompting into reproducible agent behavior. The post frames context engineering as the *successor* to prompt engineering for multi-turn agents.
- **Strength:** `practiced` — Anthropic's prescription from customer work; directional, not RCT.
- **Transfer to vibe-fence:** Encode Anthropic's altitude rule explicitly: each fence skill prompt must be specific enough to guide, generic enough to not shatter on edge cases. Provide tool contracts with examples + error shapes.
- **Sources:** [14]

### 13. Post-Mortem: Cursor — Stacking Small Optimizations

- **Mechanism:** Cursor's 2026 "Continually improving our agent harness" describes the harness as the layer that *customizes* the same model to its strengths. Lessons:
  - Models now choose context better than early guardrails did — Cursor *removed* guardrails (lint/type surfacing after every edit, file-read rewriting, per-turn tool-call caps) because they constrained increasingly capable models.
  - Static context shrinks as models improve; dynamic discovery grows.
  - Instrumentation must be both online (eval every change) and offline (production telemetry); small optimizations stack non-linearly.
  - ARC-AGI-3 case: harness changes alone (retained reasoning + compaction) lifted GPT-5.6 Sol from 13.3%→38.3% while reducing output tokens 6× — same model, different harness.
- **Strength:** `proven` for the ARC-AGI-3 harness swing; `practiced` for the broader "knock down guardrails as models improve" lesson.
- **Transfer to vibe-fence:** Version harness behavior by model capability — don't hard-code guardrails that will become liabilities. Ship telemetry hooks from day one.
- **Sources:** [15][23][6]

### 14. Post-Mortem: Codex — The 1M-Line Repository as Harness Artifact

- **Mechanism:** OpenAI built a production app *entirely* with Codex agents (openai.com/index/harness-engineering). Architecture:
  - `AGENTS.md` (~100 lines) = map; `docs/` = versioned system of record (plans, constraints, schemas).
  - Enforcement via invariants ("parse at the boundary") + generated validators, not micromanaged implementations.
  - Verification is agentic: reviewer agents + linters + doc-gardening run continuously.
  - Observability is native: local logs/metrics/telemetry are agent-legible; worktrees isolate each task's observability.
- **Causal claim:** The repository itself became the harness's memory — agents onboard by reading the repo. Claim: "giving Codex more context means organizing the *right* information, not overwhelming it."
- **Strength:** `practiced` — single-org case study at scale; no controlled comparison, but unusually well documented.
- **Transfer to vibe-fence:** Fence should make vibe-coded repos *legible* to agents in the same sense: opinionated structure that models can navigate without human narration.
- **Sources:** [6][8]

### 15. Failure Modes of Bad Harnesses — Taxonomy (10 modes, 4 starred for vibe-fence)

Synthesized from rahulkashyap.dev, harness-engineering.ai, and ZeroEntropy:

| Failure mode | What happens | Why a harness causes it | Fence relevance |
|---|---|---|---|
| **Infinite / doom loops** | Agent writes→re-reads→declares done without ever running tests; or A↔B ping-pong burns tokens. Real $47k LangChain incident over 11 days. | No hard iteration budget or external check; loop exit depends on model judgment. | ★ Fence must have loop guards (max iterations, duplicate-call detection) — invariants, not prompt wishes. |
| **Context overflow & rot** | Window fills; model degrades silently before crashing (20-50% accuracy drop 10k→100k). | Append-only history + preloaded docs; no compaction/pruning strategy. | ★ Budget context; compress history; re-anchor invariants. |
| **Prompt injection** | Tool result / file / web page smuggles an instruction; agent executes it (EchoLeak CVE-2025-32711, CVSS 9.3). | Tool outputs treated as instructions; no instruction hierarchy. | ★ Highest-severity fence concern — non-technical users won't detect injection. Enforce hierarchy. |
| **Over-constraining** | Too many rules → agent follows local pattern-matching, ignores novel task; teaching fatigue. | "1000-page manual" anti-pattern; `AGENTS.md` too long, too prescriptive. | ★ Keep fence prompts at right altitude; dial controls verbosity. |
| Hallucinated tool calls | Model invents tools/args; destructive edits on wrong path. | Bloated/overlapping tool sets; unclear contracts. | Minimal overlapping tools; clear schemas + examples. |
| Stale context | Agent cites deleted patterns, runs renamed scripts, uses old config. | AGENTS.md / RAG cache not refreshed; no freshness checks. | ★ `vibe-fence validate` + doc-gardening. |
| State degradation | Multi-step task diverges; earlier good state overwritten by later errors. | No checkpointing; no structured note-taking outside window. | Checkpoint before destructive steps; memory tool. |
| Schema / contract drift | Tool contracts silently change; agent fills wrong types. | No contract tests at harness edge. | Validate tool schemas in CI. |
| Cost blowout | Same tasks cost 6× more after "optimization" that added tools. | No cost telemetry; no budgeting. | Telemetry + budgets from day one. |
| Learned helplessness | User stops thinking; agent stops asking; bad output ships silently. | Turbo/queue removes friction but also removes judgment. | Gating by severity: block > warn > nudge. |

- **Strength of taxonomy:** `practiced` — recurring across independent incident reports; individual incidents (e.g. $47k loop) are single-case, not statistical.
- **Sources:** [17][18][20][24][25][26][27][28]

---

## Gaps / Unknowns

1. **No public RCT isolates harness components.** Most causal claims here are A/B at product scale (Cursor, Anthropic) or single-org case studies (Codex, Archestra, NemoClaw). Controlled ablations that turn *one* harness mechanism on/off in isolation are still rare — the ARC-AGI-3 13.3%→38.3% swing bundles multiple changes.
2. **Instruction hierarchy robustness over time.** Wallace et al. and subsequent IHEval show improvement, but Wen et al. and production incidents show hierarchy still breaks; the deployment answer is "hierarchy + content filtering + model hardening together," not hierarchy alone — exact interaction under-studied.
3. **Optimal AGENTS.md length and map depth.** Teams converge on ~100-300 lines for the map, but no measured optimum exists; too short loses discoverability, too long triggers over-constraining. Likely project-size-dependent.
4. **Compaction quality.** Anthropic notes compaction prompt tuning is sensitive (recall→precision); aggressive compaction loses subtle context whose importance appears later. No standard metric for compaction fidelity yet.
5. **Teaching-dial interaction with harness control.** Over-explaining vs. under-gating — at what verbosity does "helpful teaching" become the very bloat that triggers distraction/clash? No data.
6. **Cost vs. quality Pareto by skill.** Selective loading saves tokens globally, but per-skill savings (e.g. `vibe-guard` vs `vibe-plan`) are not yet quantified in any public synthesis.

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| 1 | Wallace et al., *The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions*, arXiv:2404.13208 (Apr 2024) | paper | 2026-10-20 |
| 2 | Wu et al., *IHEval: Evaluating Language Models on Following the Instruction Hierarchy*, arXiv:2502.08745 (Feb 2025) | paper | 2026-10-20 |
| 3 | Wen et al., *The Failure of Instruction Hierarchies in LLMs*, arXiv:2502.15851 (Feb 2025) | paper | 2026-10-20 |
| 4 | Yeung, *How LLMs Learn Roles, Follow Instructions, and Get Exploited* (HiddenLayer, 2026-05-26) — https://www.hiddenlayer.com/research/inside-the-prompt-how-llms-learn-roles-follow-instructions-and-get-exploited | blog | 2026-10-20 |
| 5 | Anthropic, *Prompt-injection defenses* incl. Claude Opus 4.5 (1% browser injection) — https://www.anthropic.com/research/prompt-injection-defenses | blog/research | 2026-10-20 |
| 6 | OpenAI, *Harness engineering: leveraging Codex in an agent-first world* — https://openai.com/index/harness-engineering/ | blog | 2026-10-20 |
| 7 | NVIDIA NemoClaw, *Engineer Documentation for AI Agents* — https://docs.nvidia.com/nemoclaw/user-guide/hermes/resources/engineer-agentic-documentation | docs | 2026-10-20 |
| 8 | Orchestra / Hugo Lu, *Agent Harness Engineering: Principles, Codex, and Research Survey* — https://www.getorchestra.io/guides/agent-harness-engineering | blog | 2026-10-20 |
| 9 | Claude Code, *How Claude remembers your project* — https://code.claude.com/docs/en/memory | docs | 2026-10-20 |
| 10 | Claude Code, *claude-md* / memory details — https://code.claude.com/docs/en/claude-md | docs | 2026-10-20 |
| 11 | Moxie Docs, *Context Engineering for Coding Agents: A Field Guide* — https://moxiedocs.com/blog/context-engineering-for-coding-agents | blog | 2026-10-20 |
| 12 | Moxie Docs, *AGENTS.md guide* — https://moxiedocs.com/learn/agents-md-guide | docs | 2026-10-20 |
| 13 | IllegalCreed, *agent-doc-architecture: routing + addressing* — https://github.com/IllegalCreed/agent-doc-architecture | repo | 2026-10-20 |
| 14 | Anthropic, *Effective context engineering for AI agents* — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (Sep 29 2025) | blog | 2026-10-20 |
| 15 | Cursor, *Improved token efficiency for longer agent runs* — https://cursor.com/blog/improved-token-efficiency | blog | 2026-10-20 |
| 16 | Cursor, *Continually improving our agent harness* — https://cursor.com/blog/continually-improving-agent-harness | blog | 2026-10-20 |
| 17 | Liu et al., *Lost in the Middle* (2023) + ZeroEntropy context-rot explainer — https://zeroentropy.dev/concepts/context-rot/ | paper + explainer | 2026-10-20 |
| 18 | Chroma, *Context rot* (2025) — 18 frontier models, 20-50% drop 10k→100k — via trychroma.com/research/context-rot | research | 2026-10-20 |
| 19 | Anthropic, *Building Effective AI Agents* — https://www.anthropic.com/engineering/building-effective-agents (Dec 2024) | blog | 2026-10-20 |
| 20 | Rahul Kashyap, *Harness Failure Modes: What Actually Breaks and How to Catch It* — https://rahulkashyap.dev/blog/harness-failure-modes.html | blog | 2026-10-20 |
| 21 | Dr. Sarah Chen, *The Complete Guide to Agent Harness* — https://harness-engineering.ai/blog/agent-harness-complete-guide/ | blog | 2026-10-20 |
| 22 | Archestra, *We Debug Our AI Harness on Weak Models on Purpose* — https://archestra.ai/blog/we-debug-our-ai-harness-on-weak-models-on-purpose (Jul 20 2026) | blog | 2026-10-20 |
| 23 | Claude Code, *Explore the context window* — https://code.claude.com/docs/en/context-window | docs | 2026-10-20 |
| 24 | OWASP LLM Top 10 2025 — Prompt Injection #1 — https://genai.owasp.org/llmrisk/llm01-prompt-injection/ | standard | 2026-10-20 |
| 25 | Anthropic, *Writing tools for AI agents — with AI agents* — https://www.anthropic.com/engineering/writing-tools-for-agents | blog | 2026-10-20 |
| 26 | Anthropic, *Trustworthy agents in practice* — https://www.anthropic.com/research/trustworthy-agents | research | 2026-10-20 |
| 27 | OpenAI, *Codex as a platform: build on the open agent harness* — https://developers.openai.com/blog/codex-as-a-platform | blog | 2026-10-20 |
| 28 | Archestra, *Skills aren't prompts. They can run code.* — https://archestra.ai/blog/skills-arent-prompts-they-can-run-code (Aug 2026) | blog | 2026-10-20 |

---

## Implications for vibe-fence

1. **[copy]** Ship `AGENTS.md` as a **~100-200 line map** + `docs/fence/` as the real record with per-page `description-agent` frontmatter and a machine-readable `INDEX.md` router. Never paste six "maybe relevant" docs — make them queryable via progressive disclosure. Lint that every map link resolves. *(§2, §5)*
2. **[copy]** Enforce **instruction hierarchy by runtime**: fence invariants (secrets, destructive ops, approval policy) go in the highest-privilege layer available (system/developer prompt where possible; AGENTS.md only as fallback). Treat every tool result, file read, and RAG hit as *untrusted data*, never as instructions. Pair with content filtering — hierarchy alone is insufficient. *(§1, §15)*
3. **[copy]** Adopt **one-fact-one-location**: `src/` is the one editable authority → `dist/` is disposable. State facts (teaching level, issue queue) live in single-owner files under `.fence/`. AGENTS.md and skills reference owners, never duplicate rules. Add PR-gated parity checks and a doc-gardening job. *(§4)*
4. **[copy]** Budget context explicitly in `src/framework/context-budget.yml` (caps for static instructions / dynamic retrieval / history / headroom). Validate in `generate.ts`: error if static instructions exceed budget or window headroom < ~20%. Prefer dynamic retrieval by default. *(§6, §7)*
5. **[copy]** Wire every fence task to **Read→Think→Write→Check** with *mechanical* Check (run tests/lints/validators, not model self-assessment). "Done" means checked. Reviewer-agent loop for non-trivial changes. Add loop guards (max iterations, duplicate-call detection) as hard limits, not prompt wishes. *(§9, §15)*
6. **[copy]** Place **critical invariants at context boundaries** (start/end), never mid-prompt, and re-anchor after compaction. Design compaction prompts for high recall first, then trim; never silently drop security constraints. *(§8)*
7. **[copy]** Make tools **self-contained, minimally overlapping, with explicit schemas and error shapes**; keep high-frequency tools static, lazy-load low-frequency ones (including expensive MCP). Static-context discipline is a cost and quality lever (Cursor: −60% tool-def tokens, −7% total cost). *(§7, §10, §12)*
8. **[copy]** Implement **`vibe-fence validate` + `.fence/freshness.json`** that checks: referenced scripts/paths still exist, no orphaned docs, route index resolves, tool schemas unchanged. Run on install and in CI. *(§3, §4)*
9. **[avoid]** The **"1000-page instruction manual"**: over-constraining AGENTS.md with every edge case creates non-guidance (everything important → nothing is) and instant bit-rot. Keep prompts at the "right altitude" — specific enough to guide, generic enough to survive change. *(§12, §15)*
10. **[avoid]** **Learned helplessness via un-gated turbo**: turbo/queue removes friction but can also remove judgment. Gate by severity — `block` (must fix, auto-halted), `warn` (queued, agent resolves, user informed), `nudge` (teaching surface only). *(§15)*
11. **[invent]** Per-runtime **adapter budget profiles** in `src/adapters/{claude,codex,cursor,opencode,hermes}.yml` encoding effective window, caching semantics, and which tools are static vs. dynamic — so the harness adapts rather than assuming a generous window. *(§10)*
12. **[invent]** **Weak-model nightly bench** — a 10-20 task suite of realistic vibe-coder scenarios (secrets in repo, vague prompt, drifted docs, injection payload) graded deterministically, run on a cheap model to surface fence bugs that strong models hide. Inspired by Archestra's 26-task harness bench. *(§11)*
13. **[invent]** **Telemetry-first harness**: emit spans for context composition (instruction/retrieval/tool/history tokens), tool-call error rate, loop length, and fix-vs-noise ratio. The Cursor lesson is that harness quality is tuned by *production telemetry over evals alone*. *(§13)*
14. **[invent]** **Teaching dial as context-budget dial**: `max→silent` should control not only verbosity but *how much* teaching text enters context per turn, so `max` does not itself cause the distraction/clash bloat it is meant to prevent. *(§7, §15)*

