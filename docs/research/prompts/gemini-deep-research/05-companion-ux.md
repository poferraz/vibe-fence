# GEMINI DEEP RESEARCH PROMPT — 05/06 — Companion UX: Teaching Dial & Turbo

> Copy everything below the line into Gemini Deep Research.

---

**Project:** vibe-fence — a drop-in harness that acts as a *companion* to non-technical vibe-coders. It must teach without nagging and let users go fast when they want, while keeping an invisible safety net. Two key UX concepts: a **teaching dial** (max → medium → min → silent) and a **turbo mode** (press enter and go). Research is Phase 0; scaffold is Phase 1; this is one of 6 parallel streams.

**Your task — Stream 05: How to Design the Teaching & Pacing Layer of an AI Companion.**

Research how to make an AI companion that teaches, paces, and gets out of the way:

**A) Teaching dial:**
`max` (explain every decision + underlying concept) → `medium` (key decisions only) → `min` (one-line summaries) → `silent` (no teaching, just build). How do other companions/tools tier explanations? What does learning science say about progressive disclosure, scaffolding, and fading? When does teaching help vs overwhelm?

**B) Turbo mode:**
Users love pressing enter and going. How do tools balance autonomy vs safety? Patterns to evaluate: dry-run previews, auto-approve with undo, gated critical actions (security/deploy always gated even in turbo), "turbo but not for X", trust calibration — what works, what annoys, what causes accidents?

**C) Issue queue UX:**
vibe-fence stores findings as structured `issue → solution → plan` items the *agent itself* resolves — the user doesn't triage a bug list, the agent does. What queue/task UX translates to non-technical users? Precedents: GitHub issues, Codex tasks, Claude Code plan mode, Linear, Replit Agent checkpoints — what's the minimal queue UX that a non-coder can tolerate?

**D) Anti-patterns:**
Notification fatigue, context bloat from verbose teaching, learned helplessness (user stops thinking because the companion does everything), dark patterns in "helpfulness" (over-confirmation, fake choices).

**E) Onboarding:**
How does the first 5 minutes feel for someone who has never coded? Teardowns of Replit Agent, Lovable, Bolt.new, v0, Claude Code onboarding — what makes a non-technical user feel safe vs lost in the first session?

For **each area**, fill:

| Field | Capture |
|---|---|
| Pattern / precedent | What existing tool or research demonstrates this |
| User type it serves | Beginner / intermediate / power user |
| Evidence | URL, paper, or documented UX study + date accessed |
| Strength | `proven` / `practiced` / `contested` |
| Fit for vibe-fence | How we'd adapt it (dial level, turbo rule, queue shape) |

**Requirements:**
- Search product UX teardowns, learning-science literature (progressive disclosure, scaffolding/fading, worked examples), and AI companion design writing. Cite each pattern with URL or paper ID.
- Every finding must map to a dial level or turbo rule — abstract "be helpful" is not a finding.
- End with **"Implications for vibe-fence"** — numbered, actionable, including a proposed dial spec (what each level does) and a turbo contract (what turbo auto-approves vs always gates).

**Output shape:**
Header → Findings grouped by area (Teaching Dial / Turbo / Issue Queue / Anti-patterns / Onboarding) → Gaps / unknowns → Sources table → Implications for vibe-fence (numbered, with dial spec + turbo contract).
