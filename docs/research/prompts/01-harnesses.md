# Research Prompt — Stream 01: Existing Harnesses

> **Hand this entire prompt to a model. It is self-contained.**

---

You are a research agent for the project **vibe-fence** — a drop-in harness that wraps any AI coding agent (Codex, OpenCode, Cursor, Hermes, Antigravity, etc.) to make vibe-coding safe for non-technical people.

## Your Assignment — Stream 01: Existing Harnesses

Research every meaningful "harness" that shapes how an LLM writes code inside a project:

- **Agent skills/plugins:** Claude Code skills, OpenCode plugins, Codex `AGENTS.md` / prompt packs, Cursor Rules / `.cursorrules` / MDC, Roo Code, Continue, Windsurf/Cascade configs
- **Framework harnesses:** LangGraph, pydantic-ai, Archestra, Vercel AI SDK patterns, popular `AGENTS.md` collections on GitHub
- **Scaffolding tools:** scaffolders that inject conventions (e.g. `create-*`, cookiecutter-style for AI agents)

For each harness you find, record:

| Field | What to capture |
|-------|-----------------|
| Install friction | One command? Manual file drops? Per-runtime quirks? |
| Runtime coverage | Which agents does it support? Single-runtime vs multi-runtime? |
| Safety behavior | Does it enforce secrets handling, dep checks, OWASP, least-privilege? |
| Scoping behavior | Does it decompose work into small tasks with checkpoints? |
| Teaching behavior | Does it explain decisions or just execute? |
| Failure mode for non-technical user | What goes wrong when a beginner uses it? |

## Requirements

1. **Search broadly** — GitHub, docs sites, blog posts, GitHub Awesome lists. Don't rely on a single source.
2. **Cite everything** — every harness gets at least one URL. No uncited claims.
3. **Tag evidence strength** per finding: `proven` (measured/evaluated) | `practiced` (widely used, anecdotal) | `contested`
4. **Be honest about gaps** — if you couldn't find something, say so. Don't invent.
5. **End with "Implications for vibe-fence"** — numbered, actionable — what should vibe-fence copy, avoid, or invent given what you found.

## Where to Save

Save your output to:

```
docs/research/contributors/<your-model-id>/01-harnesses.md
```

- `<your-model-id>` = `<provider>-<model>-<YYYY-MM-DD>` lowercase, hyphens only (e.g. `kimi-k2-2026-10-21`)
- If that folder doesn't exist, create it and add a `manifest.json` alongside your files:

```json
{
  "model": "your-model-name",
  "provider": "how you were accessed",
  "date": "YYYY-MM-DD",
  "streams_completed": ["01"],
  "streams_skipped": [],
  "notes": "anything notable about this run"
}
```

## Output Shape (your .md must have these sections)

```
- Model / Provider / Date / Stream header
- Findings (one subsection per harness or harness family)
- Coverage gaps (what you couldn't find)
- Sources table (#, Source URL, Type, Accessed date)
- Implications for vibe-fence (numbered list)
```

Do not write to any other stream file. Do not edit files outside your contributor folder.
