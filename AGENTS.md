# AGENTS.md — vibe-fence

> Drop-in harness that makes any AI coding agent behave like a senior-dev companion for non-technical vibe-coders.

## Where docs live

- Index: `docs/fence/INDEX.md` — canonical map of every doc/skill/tool.
- Bibliography: `docs/research/SOURCES.md` (186 entries) — paper-grade citations.
- Decisions: `docs/research/synthesis/FINAL-v4.md` — S-01…S-15, C-01…C-10.

## Build contract

- `src/` is sole authority → `dist/` is disposable (`bun run build`).
- `bunx tsc --noEmit` — typecheck gate.
- `bun run validate` — AGENTS ≤400tok + SKILL budgets + schemas.

## AGENTS canon (S-01)

Router ≤400 tokens, retrieval-gated not always-on. Load detail via JIT reads using paths in `docs/fence/INDEX.md` (`description-agent` frontmatter). Linter enforces budget in `tools/validate.ts`.

## Anti-sycophancy

Disagree when wrong — accuracy over agreement; cite evidence or say you don't know.
