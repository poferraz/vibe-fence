# Research Prompt — Stream 05: Companion UX (Teaching Dial & Turbo)

> **Hand this entire prompt to a model. It is self-contained.**

---

You are a research agent for **vibe-fence** — a drop-in harness that acts as a *companion* to non-technical vibe-coders. It must teach without nagging and let users go fast when they want to, while keeping the safety net.

## Your Assignment — Stream 05: Companion UX — Teaching Dial & Turbo

Research **how to design the teaching and pacing layer** of an AI companion:

- **Teaching dial:** `max` (explain every decision + concept) → `medium` (key decisions only) → `min` (one-line summaries) → `silent` (no teaching, just build). How do other companions/tools tier explanations? What does learning-science say about progressive disclosure?
- **Turbo mode:** users love pressing enter and going. How do tools balance autonomy vs safety? Patterns: dry-run previews, auto-approve with undo, gated critical actions, "turbo but not for security/deploy" — what works? What annoys?
- **Issue queue UX:** vibe-fence stores findings as structured `issue → solution → plan` items the *agent itself* resolves (user doesn't triage). Prior art: GitHub issues, Codex tasks, Claude Code plan mode, Linear — what queue/task UX translates to non-technical users?
- **Anti-patterns:** notification fatigue, context bloat from verbose teaching, learned helplessness (user stops thinking), dark patterns in "helpfulness"
- **Onboarding:** how does the first 5 minutes feel for someone who has never coded? Examples from Replit Agent, Lovable, Bolt, v0, Claude Code onboarding

For each area, capture:

| Field | What to capture |
|-------|-----------------|
| Pattern / precedent | What existing tool or research demonstrates this |
| User type it serves | Beginner / intermediate / power user |
| Evidence | URL, paper, or documented UX study — with date accessed |
| Strength | `proven` / `practiced` / `contested` |
| Fit for vibe-fence | How we'd adapt it (dial level, turbo rule, queue shape) |

## Requirements

1. Search product UX teardowns, learning-science literature, and AI companion design writing. Cite each pattern.
2. Every finding must map to a dial level or turbo rule — abstract "be helpful" is not a finding.
3. End with **Implications for vibe-fence** — numbered, actionable, including a proposed dial spec and turbo contract (what turbo does and doesn't auto-approve).

## Where to Save

```
docs/research/contributors/<your-model-id>/05-companion-ux.md
```

- `<your-model-id>` = `<provider>-<model>-<YYYY-MM-DD>` lowercase, hyphens only
- If that folder doesn't exist, create it and add `manifest.json`:

```json
{
  "model": "your-model-name",
  "provider": "how you were accessed",
  "date": "YYYY-MM-DD",
  "streams_completed": ["05"],
  "streams_skipped": [],
  "notes": ""
}
```

## Output Shape

```
- Model / Provider / Date / Stream header
- Findings grouped by area (Teaching Dial / Turbo / Issue Queue / Anti-patterns / Onboarding)
- Gaps / unknowns
- Sources table
- Implications for vibe-fence (numbered, with dial spec + turbo contract)
```

Do not write to any other stream file. Do not edit files outside your contributor folder.
