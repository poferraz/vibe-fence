# Deep-Read: Vibe-Coding Prompting + Goal-Blind Research

> Sources: 4 vibe-coding PDFs + Arxiv2602 Cao/Jiang/Xu · Date: 2026-10-21 · For vibe-fence Phase 1 (S-11/S-12, BRIEF.md, elicitation/turbo naming)

---

## 1. TechniquesGuide — Zahwah Jameel (Medium, May 2025, 10pp)

**Thesis:** "Words are your code." Clear prompts (goal + style + constraints) → cleaner first draft, fewer credits/revisions. Single mega-prompt fails; vibe-coding is a conversation.

**Field evidence:** None rigorous — practitioner anecdotes. Contrasts vague ("make something cool" → random demo) vs precise ("minimal todo in soft pastels, oversized buttons" → focused SPA). Cites 3,000 micro-prompts for one AI-generated game.

**Best practices:**
- Name goal first + 2-3 visual/UX cues (colors, layout, button size) + tech stack.
- Story + constraints: user story, stack declaration, guardrails ("only touch frontend"), must-haves (a11y, perf, security).
- Bite-sized prompts: one feature at a time (homepage → grid → detail view).
- Iterate: Prompt→Code→Feedback→New Prompt; prompt-audit ("summarize requirements before coding"); persona/style cues (functional, docstrings).

**Vibe-fence implications:**
- S-12 (1→verify→best-of-k): Validates Tournament Selection over mega-prompts; bite-sized aligns with WIP=1 + step budget.
- S-11 dial (max→silent): TechniquesGuide is the raw material for `max` (explicit goal/style/constraint templates) that fades to silent.
- BRIEF.md non-technical UX: Teach plain-English prompting ("talk like to a dev friend"), not framework jargon; harness informs, doesn't quiz on security.
- Naming: Supports "Overview First" guardrail prompt → S-05 (model explains, deterministic fence decides); avoid internal "turbo" language user-facing.

---

## 2. PracticeGuide — Odendahl / Zed (Sep 2025, 4pp, Doodle-clone live session)

**Thesis:** Vibe-coding = using LLM without reading output code (caring how it works, not auditing lines). Power move is YAML DSL as intermediate layer between natural language and code — natural enough for non-programmers, formal enough to sandbox.

**Field evidence:** Single expert demo (45-min live build, 20+ yr engineer, parallel models as specialized tools). No controlled eval; "Sonnet roulette" failure anecdotes + learned skill framing.

**Best practices:**
- Parallel models as tools (not sequential prompt refinement).
- YAML DSL → tight sandbox control ("generate YAML, sure it does nothing harmful").
- Learn from failures; ask model to explain generated code/tutorials to learn Vault etc. without reading code.
- Engineering expertise guides without micromanaging; peek-at-code + re-prompt fixes.

**Vibe-fence implications:**
- S-06/S-11 containment: YAML-DSL = precedent for deterministic intermediate artifacts (compare `stack-contract.json` S-08, rule records `src/framework/verifier.ts`).
- S-11 dial: "Ask to explain" = `max` teaching card pattern (What changed·Why·Your call·How we'll know) without forcing code review.
- BRIEF.md: Non-technical users can reason about YAML ("add slots 10pm-10:45") — validates non-technical UX via constrained natural language, not code.
- Elicitation: Parallel-model pattern supports S-12 best-of-k (k≤5) but guide warns against greedy stacking (CCI factorial — S-07).

---

## 3. UltimateGuide — r/ClaudeAI (May 2025, 3pp, 717↑, 2500+ prompts exp.)

**Thesis:** Garbage-in-garbage-out at scale; production vibing needs Git, popular stack, Cursor Rules, budget-aware context, and mechanical gates — not just better prompts.

**Field evidence:** Practitioner corpus (2500+ prompts, personal + prod projects) + community corroboration (comments). No RCT; strongest claims: Git saves from destructive overwrites; popular stack (Next.js+Supabase+Tailwind+Vercel) leverages public training data; iterative Gemini-as-security-auditor loop.

**Best practices (18 rules, distilled):**
1. Vision → UI/UX first → design system (v0, 21st.dev).
2. Git/GitHub hygiene (commit per feature; rollback).
3. Popular stack; Cursor Rules + instructions folder (or Context7 MCP).
4. Detailed prompts via Gemini 2.5 Pro planner; break complex features into 3-5 steps.
5. Context: mention exact files; new chat when context bloats; recap.
6. Leverage existing components for consistency; "Common AI Mistakes" file.
7. Review with AI: Gemini security/performance audit → Claude fix loop until 100% ok.
8. Guardrail: "Do not change anything I did not ask for" (rule #17) — highly effective.
9. Circuit-breaker after 3 failures: list suspects + add logs.

**Vibe-fence implications:**
- S-12: Break-into-3-5 + 3-strike circuit-breaker → directly maps to S-04 (Read→Think→Write→Check + diagnosis artefact) + S-12's 2-attempt breaker → read-only consult.
- S-11 dial: `Common Mistakes` file + Cursor Rules = user-tunable rule-count dial (vector `.fence/state/dial.json` behind one global knob).
- BRIEF.md: Popular-stack prescription validates S-08 contract-pinned plan (Next.js App Router + @supabase/ssr + Tailwind); non-technical users shouldn't choose stack — harness defaults to proven combo.
- Naming: Rule #17 reframes "turbo" — user wants "guarded" guarantee ("only what I asked"), not autonomy brag.

---

## 4. PromptCollection — VibeCodex (Oct 2025, 4pp, skim — 10 prompts for Cursor/Windsurf/Bolt)

**Thesis:** 10 copy-paste prompts = fastest leverage; tool-specific rules but core structure transfers.

**Field evidence:** "Battle-tested" claim, no cited evals — marketing/community library (contributor submissions).

**Best practices (10 prompts):**
1. Guardrail — exact-changes-only, pause on conflict.
2. Overview First — plan + affected files + edge cases, wait for confirmation.
3. Feature Builder — break into steps, label, wait for go-ahead.
4. Mini Design System — reusable UI kit (ShadCN/Tailwind tokens).
5. Test Coverage — generate tests with edge cases.
6. Performance Debugger — Option A/B with trade-offs.
7. README Generator; 8. AI Style Guide; 9. Static Site Starter; 10. Prompt Optimizer (meta — AI rewrites your prompt).

**Vibe-fence implications:**
- S-12: #2 + #3 = elicitation primitive (1→verify→best-of-k); #10 = meta-prompting that S-12 reserves for prose (2-3 candidates + rubric), never for code merges.
- S-09/S-10: #1 is user-land version of hard-blocks — vibe-fence replaces with deterministic checks (model explains, fence decides).
- BRIEF.md: #4 + #9 validate "Plan UI first" for non-technical users — generate design system before logic.
- Naming: #6's "Option A/B" → BRIEF.md's gated 2-option fork (fast/simple vs scalable/robust) — one `choice` item/run.

---

## 5. Arxiv2602 — Cao/Jiang/Xu "Seeing the Goal, Missing the Truth" (Feb 2026, 30pp)

**Thesis:** Goal-blind prompts matter. Disclosing downstream use (return/EPS prediction) causes LLMs to bias intermediate measures (sentiment [-1,1], competition [-1,1]) toward the goal — purpose-conditioned cognition. Bias is human accountability failure, not model flaw.

**Field evidence:** Strong quasi-experiment on S&P 500 (2022-2024), GPT-4o-mini (cutoff 2023-10-01), two prompt twins differing by one sentence.
- Portfolio sorts: pre-cutoff long-short spread 1.552% (goal-aware) vs 1.069% (goal-blind), diff +0.483pp/mo p<0.05; post-cutoff diff → 0.030pp (n.s.).
- Fama-MacBeth: Diff×Pre-Cutoff +0.682*** (sentiment) / -0.188** (competition); Diff×Post → ~0 (p diff =0.046/0.055).
- OOS R²: Goal-aware×Post-Cutoff -0.058*** (returns) / -5.37*** (earnings growth) — goal-aware degrades OOS.

**Best practices (authors'):**
- Generate intermediate variables under goal-blind prompts (agnostic to downstream use).
- Strict OOS tests split at knowledge cutoff; treat LLM as measurement tool, not task agent.
- Constrain informational environment — implicit cues (history, framing) also leak goals.

**Vibe-fence implications:**
- **Critical for S-12 + BRIEF.md:** Vibe-fence's elicitation prompts must be goal-blind for intermediate artefacts (e.g., sentiment-like "assess file health" scores, competition-like "risk" scores) — never leak downstream eval (deploy, rubric) into measurement prompts. Add one-sentence guard to `src/skills/*/SKILL.md` templates.
- **S-11 dial:** Explaining downstream use to teach (`max`) risks purpose leakage — teach via "what changed/why" cards at checkpoint boundaries, not by disclosing eval criteria in measurement prompts.
- **Verifier/S-04:** Trust ladder `compile→lint→tests×2→generated-tests→judge-for-prose` must be goal-blind; ephemeral smoke tests on testless repos (S-06a/B-07, 11.3% flake) especially vulnerable.
- **Naming:** "Turbo"/autonomy framing itself is a goal cue — reinforces ban on user-facing "Turbo" (S-10/S-11) and guarantee bands `guarded→assisted→autonomous→open`.

---

## Cross-cutting takeaway

Vibe-coding canon converges: small, constrained, verified steps + explicit guardrails beat mega-prompts. Goal-blind research warns: even well-intentioned goal disclosure inflates in-sample fit at OOS cost. For vibe-fence, this means **(1)** keep measurement prompts blind, **(2)** teach via post-hoc cards not pre-hoc goal leakage, **(3)** enforce S-12 Tournament Selection mechanically, and **(4)** fade S-11 dial per-domain while preserving deterministic containment.
