# GEMINI DEEP RESEARCH PROMPT — 01/06 — Existing Harnesses

> Copy everything below the line into Gemini Deep Research.

---

**Project:** vibe-fence — a drop-in harness that wraps any AI coding agent (Claude Code, Codex, Cursor, OpenCode, Kimi CLI, Windsurf, Antigravity, Hermes, etc.) to make vibe-coding safe for non-technical people. Think: `npx vibe-fence init` drops guardrails (AGENTS.md / SKILL.md / .fence/ state + skill wiring) into whatever tool the user already uses. Research is Phase 0; scaffold is Phase 1; this is one of 6 parallel streams.

**Your task — Stream 01: Existing Harnesses — taxonomy of everything that shapes how an LLM writes code inside a project.**

Research broadly and produce a structured report covering:

**A) Agent skills / plugins / rule systems:**
Claude Code skills, OpenCode plugins, Codex AGENTS.md / prompt packs, Cursor Rules / .cursorrules / MDC (Model Context), Roo Code modes, Continue config, Windsurf/Cascade configs, Codeium/Cursor/Windsurf rule collections, and any popular GitHub Awesome lists or dotfile collections for AGENTS.md / .cursorrules.

**B) Framework / scaffold harnesses:**
LangGraph, pydantic-ai, Archestra, Vercel AI SDK conventions, create-* scaffolders, cookiecutter-style generators for AI agent projects — anything that injects conventions into a codebase.

For **each harness or harness family**, fill:

| Field | Capture |
|---|---|
| Install friction | One command? Manual file drops? Per-runtime quirks? |
| Runtime coverage | Which agents does it support? Single vs multi-runtime? |
| Safety behavior | Secrets handling, dep checks, least-privilege, eval gates? |
| Scoping behavior | Does it decompose work into small tasks with checkpoints? |
| Teaching behavior | Does it explain decisions or just execute? |
| Failure mode for non-technical user | What goes wrong when a beginner uses it? |

**Requirements:**
- Search GitHub, docs sites, engineering blogs, Awesome lists — don't rely on one source.
- Cite every harness with at least one URL. Every non-obvious claim needs a source.
- Tag each finding: `proven` (measured/evaluated) / `practiced` (widely used, anecdotal) / `contested`.
- Call out gaps — what you couldn't find, what's undocumented.
- End with **"Implications for vibe-fence"** — a numbered list of what vibe-fence should COPY, AVOID, or INVENT given what you found. This is the most important section — make it actionable and specific.

**Output shape:**
Header → Findings (one subsection per harness/family) → Coverage gaps → Sources table (#, Source URL, Type, Accessed) → Implications for vibe-fence (numbered, copy/avoid/invent).
