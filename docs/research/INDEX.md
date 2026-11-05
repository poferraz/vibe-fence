# Research Index — vibe-fence Phase 0

> Phase 0 = Deep Research. Every claim cited. Runs are distributed across models.
> What is actually supported, decided, or still unverified: `CLAIMS.md`.

## How to Run

See `prompts/README.md` for the full runner instructions.

```
prompts/           → 6 runner prompts (hand these to models)
contributors/      → one subfolder per model run (<provider>-<model>-<YYYY-MM-DD>)
synthesis/         → you synthesize here after all runs (per-stream + FINAL.md)
00-meta/           → log of what happened when
```

## Streams — Locked 2026-10-21 (synthesis) · Active entry point is `synthesis/FINAL-v4.md` (public decision summary)

| # | Stream | Question | Prompt |
|---|--------|----------|--------|
| 01 | Existing harnesses | What exists, what each gets right/wrong for non-technical users? | `prompts/01-harnesses.md` |
| 02 | Harness → output quality | How does scaffolding causally improve LLM output? | `prompts/02-harness-influence.md` |
| 03 | Elicitation & synthesis | Which internal patterns (multi-sample, critique, synthesis) genuinely beat single-pass? | `prompts/03-elicitation.md` |
| 04 | Developer guardrails | What are the objective rights & wrongs the harness must enforce? | `prompts/04-guardrails.md` |
| 05 | Companion UX | Teaching dial (max→silent) + turbo mode + issue-queue UX | `prompts/05-companion-ux.md` |
| 06 | Meta models (hackathon) | How to integrate Muse Spark / Image / SAM 3.1 for scoring + product value | `prompts/06-meta-models.md` |

Each prompt is self-contained: it tells the model what to research, how to cite, and exactly where to save (`contributors/<model-id>/NN-*.md` + `manifest.json`).

### What synthesis produced

Per-stream: `synthesis/01..06-*.md` (147/259/203/345/275/252 lines). Cross-stream: **FINAL-v4.md is the single source of truth** (public decision summary, 2026-10-21) — 15 settled S-01…S-15, 10 contested C-01…C-10+3 sub-rows, B-01…B-08, anti-patterns, and traceability. `FINAL-v3.md`/`FINAL.md` superseded, not deleted. Audits: `_CONSISTENCY.md` (134→103 dedup, C-01…C-10) · `COMPARISON.md` (primary vs independent) · `INDEPENDENT-GEMS.md` (11 patches) · `HTML-REVIEW.md` (8 hallucinations, 6 P1 fixes applied to `synthesis-explorer.html`). Start Phase 1 from `FINAL-v4.md`.

---

### Deep-Reads — Vault Expansion (2026-10-21 → FINAL-v4)

14 docs in 4 clusters synthesized into FINAL-v4; per-report files:

| Report | Cluster | Docs | Key FINAL-v4 deltas |
|--------|---------|------|---------------------|
| `synthesis/deepread-agents-prompting.md` | agents-prompting | 6 (Meta-Harness, Seven-Layers, Claude-Leak, Context-Engineering, Skills, SEAL) | S-01 retrieval-gated AGENTS.md, S-02 Skills L1/L2, S-03 context-engineering, S-06 23-check hardening, S-12 SEAL |
| `synthesis/deepread-harness-cluster.md` | harness-cluster | 3 (LilLog, Self-Harness 2606.09498, CLM 2609.37725) | S-06a ϑ=(c,q,m)+Δ_in∧Δ_ho, S-07 CCI factorial, S-14 PFLOP trace |
| `synthesis/deepread-research-cluster.md` | research-cluster | 5 (ContextFiles-Eval, Verbal-Sampling, Avengers-Pro, RSI-Anything 2610.13912, Prime-Agent 2608.23552) | S-01 ContextFiles-Eval, S-12 VS, S-08 Avengers-Pro routing, S-11a rollback invariant |
| `synthesis/deepread-vibe-coding.md` | vibe-coding | 4 + Arxiv2602 goal-blind | S-11 goal-blind scaffolding, S-11 Teaching Dial, S-04 circuit-breaker |

---

## Stream Details

### 01 — Existing Harnesses
Scope: Claude Code skills, OpenCode plugins, Codex prompts, Cursor rules/MDC, Roo Code, Continue, Archestra, LangGraph/pydantic-ai harnesses, Vercel AI SDK patterns, popular `AGENTS.md` / `.cursorrules` collections. For each: install friction, runtime coverage, safety/scoping/teaching behavior, failure mode for beginners.

### 02 — Harness → Output Quality
Prompt/file structure, context engineering (selective loading, Read→Think→Write→Check, budgeting vs bloat), harness post-mortems (Archestra, Anthropic). Deliverable: causal levers vibe-fence should pull.

### 03 — Elicitation & Synthesis
The initial hypothesis — "ask 5, self-critique, synthesize 1" vs "ask 1" — grounded in papers: self-consistency, best-of-N, LLM-as-judge, debate, self-refine, MoA. Cost/latency tradeoffs. Which patterns the harness runs silently.

### 04 — Developer Guardrails
Security (OWASP, secrets, deps, auth), git/GitHub hygiene, Vercel deploy, project hygiene, data/privacy. Each rule: severity (block/warn/nudge) + enforcement + teachable explanation.

### 05 — Companion UX: Teaching Dial & Turbo
Teaching levels max→med→min→silent, turbo mode (when to gate vs let fly), structured `issue → solution → plan` queue the agent resolves itself, anti-patterns (fatigue, bloat, helplessness), onboarding for first-timers.

### 06 — Meta Models for the Hackathon
Muse Spark / Image / SAM 3.1 capabilities + API shape, Muse Code relationship, open-weights path, winning hackathon patterns. Concrete integration plan for vibe-fence.

---

## Project decisions

The public [synthesis](synthesis/FINAL-v4.md) records the settled and contested research decisions. Detailed milestone and submission planning is retained privately.

---

## Cross-cutting Requirements (enforced by every prompt)

- Cite every non-obvious claim (URL or paper ID + date accessed)
- Tag strength: `proven` (paper/eval) | `practiced` (widely used) | `contested`
- Each contributor file ends with: **Implications for vibe-fence** (numbered: copy / avoid / invent)
