# Deep-Read: Agents, Prompting, Harness & Security → vibe-fence Implications

> Sources: Meta-Harness (2026-04-09, arXiv:2603.28052) · Seven Layers Framework (MarkTechPost 2025-08-04) · Claude Code Leak Guide (2026-04-01, Eduba) · Anthropic Context Engineering (2025-09-29) · Anthropic Skills Guide (2026-03-01) · SEAL Self-Adapting LMs (arXiv:2506.10943, MIT). Read via `read_file` on 2026-0x-xx.

## 1 — Meta-Harness: End-to-End Optimization of Model Harnesses (Stanford/KRAFTON/MIT)

**Thesis:** LLM system performance depends as much on the *harness* (code that stores/retrieves/presents context) as on weights — a 6× benchmark gap from harness alone. Hand-designed harnesses and existing text optimizers (OPRO, TextGrad, GEPA, AlphaEvolve) fail because they compress feedback to scalar scores or short summaries (0.002–0.026 MTok/iter), discarding the causal chain from a retrieval decision to a downstream failure many steps later.

**Method — Agentic proposer + filesystem of full history:** Loop: (1) coding agent (Claude Code + Opus-4.6 + minimal domain skill) reads a *filesystem* of all prior candidates' source, scores, and execution traces via grep/cat (median 82 files/iter, 20+ candidates referenced, up to 10 MTok diagnostic footprint); (2) evaluate on search set; (3) append. No parent-selection rule, no fixed scaffold — proposer decides what to inspect and whether to do local edit vs. full rewrite. Harnesses are single-file Python programs (100–1000 LOC). Code-space search biases toward coherent algorithms.

**Metrics (3 domains, ~60 harnesses / 20 iters per run):**

| Domain | Result vs. baseline |
|---|---|
| Online text classification (9 OOD datasets: SciCite, FiNER-139, Banking77, etc.) | +7.7 pts over SOTA ACE; 4× fewer context tokens; matches next-best optimizer's final accuracy (after 60 proposals) in just 4 evals. Pareto frontier trades accuracy vs. ctx cost. |
| Retrieval-augmented math (200 IMO-level: IMO-AnswerBench/ProofBench + ArXivMath) | Single discovered harness: +4.7 pts avg across 5 held-out LLMs; 535K-problem corpus; 4-route BM25 router (combinatorics/geometry/number theory/default). |
| Agentic coding TerminalBench-2 (89 tasks) | Discovered harness ranks #1 among all Claude Haiku 4.5 agents, surpassing Terminus-KIRA (37.6%) / Claude Code / Goose. Winning change: 80-line *environment bootstrap* — snapshot of OS, langs, pkg managers before first LLM turn, saving 3–5 wasted exploration turns. |

**Search trajectory lesson (Appendix A):** 6 consecutive regressions from prompt/completion-flow edits → proposer pivots to purely additive, safe modification (env snapshot). Causal reasoning over failures requires full-history access; compressed feedback cannot support it.

**vibe-fence takeaways (GEM-03 / S-01 / S-03 / S-06):**
- *Adapter portability (GEM-03):* Treat adapters/harnesses as first-class optimizable programs, not hand-tuned prompts. Invest in a searchable harness interface + Pareto evaluation on a hard search set.
- *Context budget (S-01/S-03):* The 4× token saving came from *better* retrieval (draft→verification, label-primed coverage + query-anchored contrastive pairs, TF-IDF), not brute-force context stuffing. Design vibe-fence adapters to optimize accuracy-per-token.
- *Teaching dial:* Discovered draft-verification harness is a natural teaching pattern — draft prediction, then targeted challenger examples to verify/revise. Mirrors curriculum design.
- *Security (S-06):* Harness logging must be queryable (JSON, hierarchical, grep-friendly) and sandboxed — full trace storage magnifies exfiltration risk.

## 2 — Seven Essential Layers for Building Real-World AI Agents (2025)

**Thesis:** Production agents require a 7-layer full stack — prompt engineering alone is insufficient. All layers must integrate to sense, plan, act, learn, and scale.

**Layers:** 1) Experience (human interface, intent capture) · 2) Discovery (web search/RAG/sensors, context-aware retrieval) · 3) Agent Composition (goals, roles, sub-agents, ethical boundaries) · 4) Reasoning & Planning (decision/planning engine) · 5) Tool & API (safe action-taking) · 6) Memory & Feedback (short/long-term memory, learning from feedback) · 7) Infrastructure (orchestration, scale, observability, compliance).

**vibe-fence takeaways:**
- Map vibe-fence adapter system explicitly to layers 3–6: composition (adapter roles), reasoning (planning), tools (guardrail APIs), memory (teaching state). Use the stack as an audit checklist — missing layers explain fragility.
- Layer 2 (Discovery) ↔ GEM-03: adapter portability hinges on how discovery/retrieval is packaged.

## 3 — Claude Code Source Leak Guide (2026-04-01, Jake Van Clief / Eduba)

**What leaked:** v2.1.88 npm package included `.map` → 1,900 files / 512K LOC TypeScript covering CLI, tool registry (40+ tools), slash commands, system prompts, permission architecture, multi-agent orchestration, context/compaction, 44 unreleased feature flags (BUDDY/KAIROS/ULTRAPLAN/dream system/undercover mode/coordinator). No model weights/backend/safety/customer data. Axios trojan + typosquatting supply-chain attack window 2026-03-31 00:21–03:29 UTC (axios 1.14.1/0.30.4, plain-crypto-js).

**Architecture signals (attack surface S-06):**
- 23 numbered bash security checks (`tools/BashTool/bashSecurity.ts`): zsh builtins, unicode/IFS null-byte, HackerOne findings.
- Permission system + native client attestation (Zig-level hash DRM for API calls, `constants/system.ts:59-95`).
- Compaction failures: 1,279 sessions with 50+ consecutive compaction failures → 250K wasted API calls/day (`services/compact/autoCompact.ts`).
- Anti-distillation: fake tool injection (`services/api/claude.ts:301-313`); frustration regex (`utils/userPromptKeywords.ts`).

**vibe-fence takeaways (S-06):**
- Audit vibe-fence for the same classes: prompt injection via tool output, zsh/unicode/IFS bypasses, secret leakage in traces, dependency typosquatting.
- Treat skills/adapters as executable code — enforce permission checks + input validation before any tool/MCP call.
- Monitor compaction/loop health; cap retries to avoid cost blowup.

## 4 — Effective Context Engineering for AI Agents (Anthropic, 2025-09-29)

**Thesis:** Context engineering is the successor to prompt engineering: curating the *smallest high-signal token set* that maximizes desired behavior across turns. Context = finite resource with diminishing returns; *context rot* (needle-in-haystack degradation from n² attention) affects all models.

**Method:**
- System prompt at "right altitude" — specific yet flexible; structured with XML/Markdown sections.
- Tool design: minimal viable set, self-contained, non-overlapping; descriptive params; token-efficient returns. Bloated toolsets → ambiguous selection.
- Examples: few diverse canonical examples > laundry list of edge cases.
- JIT retrieval: lightweight identifiers (paths/queries/links) + tools (grep/glob/Bash) to load on demand; metadata (naming, hierarchy, timestamps) as signal. Hybrid: CLAUDE.md up front + JIT exploration.
- Long-horizon (3 techniques): *compaction* (summarize near-limit history, keep decisions/bugs, drop tool outputs; tune for recall→precision; tool-result clearing), *structured note-taking* (NOTES.md/memory tool outside window; Pokémon agent demo), *sub-agents* (parallel exploration, 1–2K token summaries back to lead).

**vibe-fence takeaways (S-01/S-03):**
- Context budget is literal: every adapter token depletes attention. Measure tokens in / tokens out; optimize via JIT + progressive disclosure.
- Adopt the three-tier disclosure pattern (frontmatter → body → linked files) for adapters to keep hot context lean.
- Long-horizon teaching sessions need compaction + note-taking; otherwise context pollution degrades instruction following.

## 5 — Complete Guide to Building Skills for Claude (Anthropic, 2026-03-01)

**Thesis:** A *skill* = folder (SKILL.md + optional scripts/references/assets) that teaches Claude repeatable workflows. Skills are the knowledge layer atop MCP (connectivity); portable across Claude.ai/Code/API (open standard, Agent Skills).

**Format (S-02):**
- Progressive disclosure: L1 YAML frontmatter (always in system prompt — name + description ≤1024 chars with trigger phrases) · L2 SKILL.md body (loaded when relevant) · L3 linked files (discovered as needed). Name: kebab-case, no `claude`/`anthropic` prefix, forbidden chars `< >`. Allowed-tools, license, metadata optional.
- Body: Markdown with explicit steps, validation gates, examples, troubleshooting; keep ≤5K words, delegate detail to `references/`.

**Patterns:** sequential orchestration · multi-MCP coordination · iterative refinement · context-aware tool selection · domain intelligence. Testing: triggering (should/shouldn't trigger) · functional · performance (tool calls, tokens, failures).

**vibe-fence takeaways (S-02 adapter portability):**
- Adopt SKILL.md structure verbatim for vibe-fence adapters — it is becoming the portable standard. Enforce description quality (WHAT + WHEN + trigger phrases) or skills won't load.
- Package teaching workflows as Category 1 (document/asset) + Category 2 (workflow automation) skills; use `allowed-tools` to bound blast radius (guardrail economics).

## 6 — SEAL: Self-Adapting Language Models (ArXiv 2506.10943, MIT)

**Thesis:** LLMs can *self-adapt* by generating their own finetuning data + optimization directives ("self-edits") and applying LoRA SFT updates. Outer RL loop (ReST-EM: filtered behavior cloning on positively-rewarded edits) trains the model to produce effective self-edits; reward = downstream performance of the *updated* model.

**Instantiations & metrics:**
- *Knowledge incorporation (Qwen2.5-7B, SQuAD no-context):* RL-trained synthetic implications lift accuracy 32.7% (base) → 47.0% (SEAL), beating GPT-4.1 synthetic data (46.3%) and passage-only finetune (33.5%). CPT (n=200) similar gains (43.8%). 2 ReST-EM iterations suffice.
- *Few-shot ARC (Llama-3.2-1B):* SEAL-learned augmentation+L/R config reaches 72.5% success vs. 20% (self-edit w/o RL) / 0% (ICL), approaching oracle TTT (100%).
- Costs: ~30–45s per self-edit eval; catastrophic forgetting across sequential edits; context-dependent evaluation (needs paired QA).

**vibe-fence takeaways (GEM-03 / teaching dial):**
- Self-editing is a principled adapter-tuning loop: generate synthetic training signal → LoRA update → reward on held-out task. Use it to *learn* how to teach — RL on which rewrites/augmentations actually improve student performance.
- Validates that rewrite quality matters more than raw passage memorization — directly informs vibe-fence's prompt packaging strategy.
- Guardrails: forgetting and staleness of RL triples require on-policy sampling; don't cache edits across model versions.

## Cross-Cutting Synthesis for vibe-fence

| vibe-fence concern | Unified prescription |
|---|---|
| GEM-03 Adapter portability | Standardize on SKILL.md (S-02) + harness interface (Meta-Harness). Adapters are code, not prompts — searchable, versioned, Pareto-evaluated. SEAL shows synthetic-data quality beats scale; small adapters can beat large-model outputs when RL-tuned. |
| S-01/S-03 Context budget | Treat context as attention budget: JIT retrieval + draft→verification + label-primed coverage. Meta-Harness 4× token saving + Anthropic context rot analysis both point to *retrieval design* as the lever. Gate context growth via compaction/note-taking/sub-agents for long sessions. |
| S-02 Skills format | Implement Anthropic's 3-level progressive disclosure literally; description field is the routing contract (WHAT+WHEN+triggers). Add `allowed-tools`/`compatibility` to bound execution. |
| S-06 Attack surface | Adopt Claude Code's 23 checks as baseline: permission system, null-byte/unicode/builtin defenses, dependency pinning, compaction loop caps, trace sanitization. Skills are executable — sandbox them. |
| Teaching dial | Draft→verification and SEAL's implication-rewriting are ready-made pedagogy patterns: generate → verify against challengers → consolidate into notes. |

## Source Locations (vault)

`AI-Research/Agents/Agents-Meta-Harness.pdf` · `Agents-Frameworks-SevenLayersGuide.pdf` · `Agents/Agents-Security-ClaudeCodeLeakGuide.pdf` · `Prompting/Prompting-ContextEngineering-AnthropicGuide.pdf` · `Prompting/Prompting-Claude-SkillsGuide.pdf` · `Research/Research-Unknown-Arxiv2506Paper.pdf` (SEAL).

---
*Written to `/tmp/deepread-agents-prompting.md` for vibe-fence GEM-03 / S-01–S-03 / S-06 — ~120 lines.*
