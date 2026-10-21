# Synthesis — Stream 01: Existing Harnesses

- **Stream:** 01 — Existing Harnesses
- **Synthesized:** 2026-10-20
- **Contributors compared:** 6 — `muse-spark-2026-10-20` (28 sources), `google-gemini-3.8-flash-2026-10-20` (68 URLs), `google-gemini-4-argon-2026-10-20` (~212 URLs, docx converted), `ollama-launch-deepseek-v4.1-flash-2026-10-20` (57 URLs), `ollama-launch-minimax-m3.1-flash-2026-10-20` (105 URLs, 88 sources claimed), `openai-gpt-6-2026-10-20` (64 URLs, 64 sources)

---

## 1. What the contributors agree on

All 6 contributors converge on a small set of structural facts about the harness landscape. These are the most load-bearing inputs to Phase 1.

| # | Agreed finding | Best evidence | Agreement | Decision |
|---|----------------|---------------|-----------|----------|
| A-01 | **Declarative markdown rules are suggestions, not boundaries.** CLAUDE.md / AGENTS.md / .cursorrules are non-binding user-role instructions the agent may ignore when context is long or rules conflict. | minimax 01 (CSA note: indirect prompt injection via AGENTS.md across all major harnesses; ReadSecBench 84% ASR; 93% of reviewers missed it) + argon 01 (models arbitrarily ignore constraints beyond 300–500 lines or when tiers contradict) | unanimous | **copy** — vibe-fence must pair markdown with deterministic enforcement (hooks / settings blocks) |
| A-02 | **No existing harness covers the full trio for non-technical users: zero-friction install + cross-runtime portability + enforced guardrails + adaptive teaching.** Each harness optimizes for one axis. | gemini-3.8-flash 01 (three-tier gap framing) + muse-spark 01 (15 harnesses × 6 fields, all miss ≥1 axis) + gpt-6 01 (26 families, none combine all four) | unanimous | **invent** — the four-pillar combo is vibe-fence's positioning (PROMPT.md promise) |
| A-03 | **Agent Skills (SKILL.md) progressive disclosure is the right context primitive.** Load name+description (~50–100 tokens) at startup; full body on match. Keeps large skill inventories cheap. | muse-spark 01 (Agent Skills open standard + discovery paths + marketplace) + argon 01 + gpt-6 01 (all describe progressive disclosure) | strong | **copy** — use SKILL.md pattern for vibe-fence skills (INDEX routing, selective load) |
| A-04 | **Framework/gateway harnesses (LangGraph, Archestra, Pydantic AI, HumanLayer) offer real enforcement but demand backend setup and coding skill.** Non-technical users cannot adopt them. | argon 01 (state-machine interrupts, schema/retry, MCP proxy) + gemini-3.8-flash 01 (framework tier characterization) + gpt-6 01 (heavyweight developer infra) | unanimous | **avoid** inventing a backend-gateway; adapt the *pattern* to client-side hooks/settings |
| A-05 | **Single-runtime editor rules (Cursor MDC, .cursorrules, Windsurf/Antigravity presets) do not enforce safety at runtime.** | muse-spark 01 + gemini-3.8-flash 01 + gpt-6 01 (all: Cursor rules are prompt injections, hallucinations of compliance under long context) | unanimous | **avoid** — do not ship single-runtime rule files as the primary safety layer |
| A-06 | **Install friction is the adoption cliff for harnesses.** Marketplace one-liners and `npx init` beat manual file drops; plugin marketplaces (Claude Code plugins, skills.sh) lower friction. | muse-spark 01 (Agent Skills marketplace, OpenCode/Codex install paths) + gpt-6 01 (26 families install comparison) | strong | **copy** — `npx vibe-fence init` as single-command install; publish to skills.sh / plugin registries |

---

## 2. Where they disagree

### D-01 — Are hooks/permission gates effective, or mostly theater?

- **Reading A (minimax 01):** Most hooks are weak — a head-to-head eval of 12 hooks × 12 actions showed 6 of 12 hooks stopped *none* of 8 risky actions when prompts were skipped, and with no hook Claude Code's own prompts already stopped 7/8 risky (but wrongly blocked 3/4 ordinary actions). The best hook (nomos) reached 7/8 with 0/4 false positives. Conclusion: permission prompts are load-bearing, hooks are weaker than marketed, and false positives on ordinary work push users to `--dangerously-skip-permissions`.
- **Reading B (argon 01 + muse-spark 01):** Hooks/settings blocks are the correct deterministic layer (gateway 31ms p95; targeted 4KB cap cuts tokens ~50%). Lifecycle hooks (`PreToolUse`, `SessionStart`) are the non-bypassable boundary.
- **Resolution:** Both are compatible: hooks *are* the right pattern, but most *implementations* are weak. For vibe-fence: ship the smallest hook surface with measured false-positive budget (nomos-class), not a large hook zoo. **Unresolved:** the exact false-positive rate users tolerate before bypassing — needs an eval.
- **Why it matters for Phase 1:** Determines hook scope (minimal curated set vs broad toolkit) and whether we add telemetry on bypass-reasons.

### D-02 — Is a "turbo" mode safe to name/ship?

- **Reading A (minimax 01):** Factory Droid already ships a named autonomy dial (Off/Low/Medium/High risk bands, blocklist surviving `--skip-permissions-unsafe`, `bash -c` wrapper resistance) and Antigravity 2.0 has a preset literally named "Turbo" that disables sandbox + grants full filesystem. So calling the feature "turbo" normalizes bypass.
- **Reading B (muse-spark 01 + deepseek 01):** Three-tier auto/notify/gate or YOLO is standard framing; users expect it.
- **Resolution:** Adopt minimax's warning: ship a **dial** (not a bypass button) with a blocklist that survives highest autonomy, and **never name the bypass level "turbo"** in product copy/docs. Internal shorthand is fine; user-facing label must signal the blocklist. Overlaps with stream 05.
- **Why it matters for Phase 1:** Affects settings schema names, docs, and CLI flags.

### D-03 — Does AGENTS.md help or hurt in practice?

- **Reading A (argon 01):** ETH Zurich eval found AGENTS.md net-negative when bloated or contradictory — hurts more than no file; cap 300–500 lines.
- **Reading B (muse-spark 01):** Codex "1M-line repo as harness memory" argues AGENTS.md is beneficial when paired with routing/INDEX discipline.
- **Resolution:** Both true: file presence alone helps small; unbounded growth hurts. Vibe-fence adopts the **map-not-manual** rule (OpenAI Codex: ~100 lines AGENTS.md + docs-as-record) + enforced one-fact/one-location. Unresolved: optimal map depth — needs measurement.
- **Why it matters for Phase 1:** Sets AGENTS.md size budget and linter rule.

### D-04 — Instruction files as an attack surface — mainstream or edge case?

- **Reading A (minimax 01, deepest):** Instruction files are an attack surface today, not a future concern — CSA note across all harnesses, AIShellJack 41–84%, Cursor auto-approval 83.4%, NVIDIA Red Team hiding sleep delays via build-time AGENTS.md, TrojanForge >60% poisoning. No existing harness defends.
- **Reading B (other 5 contributors):** Mentioned or missed entirely.
- **Resolution:** Accept minimax's assessment (specific CVEs + evals, not folklore). For vibe-fence: sanitize/validate AGENTS.md on init and on dependency pulls; treat instruction-file ingestion as untrusted input. This connects to stream 04's `HARNESS_AS_ATTACK_SURFACE`.
- **Why it matters for Phase 1:** Adds a validation step to `vibe-fence init` and to any template-update flow.

---

## 3. Unique contributions

| Contributor | Unique contribution | Evidence | Adopt? |
|-------------|---------------------|----------|--------|
| minimax-m3.1-flash | Instruction-file injection as primary vulnerability class (ReadSecBench, AIShellJack, TrojanForge) | 88 sources, specific ASR numbers | **yes** — instruction sanitizer |
| minimax-m3.1-flash | Head-to-head hook eval (12×12) with prompt-skip ablation — `proven` measurement | awesome-claude-code-hooks eval 2026-10-10 | **yes** — use nomos-class baseline |
| minimax-m3.1-flash | Factory Droid four-band dial + blocklist surviving unsafe skip + bash-c wrapping defense | Factory docs | **yes** — settings schema |
| argon-4-argon | Two-paradigm split: declarative vs programmatic gateway — and the user illusion ("writing a rule = enforcing a boundary") | Architectural taxonomy + user-equivalence finding | **yes** — docs/positioning |
| argon-4-argon | 4KB command-output cap → ~50% token reduction + gateway 31ms p95 | Argon engineering metrics | **yes** — context budget |
| gpt-6 | 26-family taxonomy with consistent 6-field rubric across editor, framework, scaffolder, and packager tiers | 64 sources, nine gaps | **yes** — reference catalog |
| gemini-3.8-flash | Three-tier landscape framing (editor skills / framework gateways / context scaffolders) with the four-pillar gap statement | Comparative analysis | **yes** — positioning |
| deepseek-v4.1-flash | Harness-as-attack-surface framing with install-friction vs safety tradeoff analysis | DeepSeek contributor | **yes** — install UX constraint |

---

## 4. Gaps in the collective research

1. **No quantitative head-to-head harness evals beyond the single 12×12 hook test.** No RCT comparing harness vs no-harness on matched tasks. Needed: a small vibe-fence eval suite (before/after on realistic non-technical prompts).
2. **Non-Western / non-English harnesses not covered.** Potentially different design patterns missed.
3. **Thin public docs for Antigravity/Windsurf SWE-1 and Hermes Agent.** Speculative coverage; likely underestimates their guardrail surface.
4. **No measurement of optimal AGENTS.md / SKILL.md length or routing depth.** The 100-line vs 300–500 line boundary is anecdotal.
5. **No user study of what non-technical users actually do when blocked.** We infer bypass from false-positive rates; real UX research needed (stream 05 overlap).

---

## 5. The consolidated answer

Today's harnesses split into two disconnected worlds — lightweight markdown rules that feel like enforcement but are unenforced suggestions, and heavyweight gateway/state-machine frameworks that enforce but require backend setup no vibe-coder will adopt — with no existing tool combining zero-friction install, multi-runtime enforcement, and adaptive teaching. The credible enforcement path is client-side hooks and settings blocks (not a proxy), using the SKILL.md progressive-disclosure pattern and a ~100-line AGENTS.md budget, but only if we sanitize instruction files as untrusted input and keep the hook surface small and measured (most hooks are theater). Ship `npx vibe-fence init` as the single entry point and a named autonomy dial whose blocklist survives the highest level; do not name the bypass "turbo."

---

## 6. Actions for Phase 1

### Copy (do this)
1. **Ship `npx vibe-fence init` as the single install** — A-06 — one command that drops AGENTS.md, SKILL.md skills, settings blocks, and hook wiring; publish to skills.sh + plugin registries.
2. **Use SKILL.md progressive disclosure for all skills** — A-03 — name+description at startup, full body on match; discovery via `.agents/skills/` + `.claude/skills/`.
3. **Enforce a minimal hook surface (not a hook zoo)** — D-01 — `PreToolUse` / `PreToolExecution` gate on scoped actions, measured against a false-positive budget (nomos-class 7/8 / 0/4 baseline).
4. **Client-side settings block that survives highest autonomy** — D-02 + Factory pattern — blocklist persists even when user escalates the dial; `bash -c` wrapper resistance.
5. **100-line AGENTS.md + docs-as-record + one-fact/one-location** — D-03 + muse-spark 01 — routing INDEX discipline; linter enforces the budget.

### Avoid (do not do this)
1. **Do not ship single-runtime rule files as primary safety** — A-05 — Cursor MDC / .windsurfrules alone; multi-runtime is required.
2. **Do not build a backend gateway/proxy for enforcement** — A-04 — no Archestra-style MCP proxy for a drop-in harness; the pattern is borrowed as client hooks.
3. **Do not name the bypass level "turbo" in user-facing copy** — D-02 — Antigravity's "Turbo" is a full bypass; naming normalizes it.
4. **Do not let AGENTS.md / SKILL.md grow unbounded** — D-03 — 300–500 line ceiling is where models start ignoring constraints.

### Invent (we must build this, nobody has)
1. **Instruction-file sanitizer and update guard** — D-04 (minimax) — validate AGENTS.md/SKILL.md on init and on template pulls as untrusted input; detect contradictory tiers and silent conflicts.
2. **Four-pillar bundle: install + multi-runtime + enforced guardrails + adaptive teaching** — A-02 — no existing harness ships this; it is vibe-fence's moat and must be validated with a before/after eval (gap #1).
3. **Hook telemetry + bypass-reason capture** — D-01 — measure what users bypass and why; close the gap on "optimal map depth" with data.

---

## 7. Open questions we could not resolve

- [ ] What false-positive rate on ordinary actions drives beginners to bypass? — Run a small A/B on hook strictness with non-technical users; measure bypass rate.
- [ ] What is the optimal AGENTS.md / SKILL.md size budget in practice? — Ablate 50 vs 100 vs 200 vs 500 lines on matched task suites.
- [ ] Do non-Western harnesses (or LLM-coding cultures outside the English web) encode different enforcement patterns we should adopt? — Targeted search in Chinese/Japanese harness ecosystems.
- [ ] How much does hook latency (31ms proxy vs local) matter at vibe-coder task lengths? — Benchmark actual task durations, not harness microbenchmarks.

---

## 8. Sources

Union of contributors' cited sources, deduplicated (representative sample — full lists in contributor files).

| # | Source | Type | Accessed | From |
|---|--------|------|----------|------|
| 1 | Claude Code — CLI, hooks, settings, plugins | docs | 2026-10-20 | muse-spark |
| 2 | Agent Skills open spec + progressive disclosure | spec/docs | 2026-10-20 | muse-spark, argon |
| 3 | OpenCode skills & plugins | docs/repo | 2026-10-20 | muse-spark |
| 4 | Cursor MDC rules — frontmatter + globs | docs | 2026-10-20 | muse-spark, gemini-3.8-flash, gpt-6 |
| 5 | Codex AGENTS.md + phase harness + 1M-line repo | eng-blog/docs | 2026-10-20 | muse-spark |
| 6 | Roo Code modes | docs | 2026-10-20 | muse-spark |
| 7 | Continue — open-source AI coding harness | docs | 2026-10-20 | muse-spark |
| 8 | Windsurf/Cascade — rules + Cascade | docs | 2026-10-20 | muse-spark |
| 9 | Archestra — enterprise harness | docs | 2026-10-20 | muse-spark, gpt-6 |
| 10 | LangGraph — stateful harness runtime | docs | 2026-10-20 | muse-spark |
| 11 | Vercel AI SDK — WorkflowAgent durability | docs | 2026-10-20 | muse-spark |
| 12 | Pydantic AI — schema/retry validation | docs | 2026-10-20 | muse-spark |
| 13 | Hermes Agent — skills + MCP | docs | 2026-10-20 | muse-spark |
| 14 | AGENTS.md collections (khasky/awesome-agents-md, tairov, Repomix/code2prompt) | github | 2026-10-20 | muse-spark, gpt-6 |
| 15 | ReadSecBench / CSA note — instruction-file injection ASR | eval/paper | 2026-10-20 | minimax |
| 16 | AIShellJack — shell-level injection | eval | 2026-10-20 | minimax |
| 17 | TrojanForge — poisoning >60% / backdoor >90% | paper | 2026-10-20 | minimax |
| 18 | Head-to-head hook eval 12×12 (zhuyansen/awesome-claude-code-hooks) | eval | 2026-10-10 | minimax |
| 19 | Factory Droid — four-band autonomy dial + blocklist | docs | 2026-10-20 | minimax |
| 20 | Antigravity 2.0 Turbo preset (full bypass) | product docs | 2026-10-20 | minimax |
| 21 | skills.sh marketplace + Antigravity adapter | marketplace/docs | 2026-10-20 | muse-spark |
| 22 | PatrickJS/awesome-cursorrules | github | 2026-10-20 | gemini-3.8-flash |

> Full per-contributor source tables (64–136 URLs each) remain in `docs/research/contributors/*/01-harnesses.md`. The row above preserves the highest-leverage citations for downstream Phase 1 decisions.
