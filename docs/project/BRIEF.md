# Brief — vibe-fence

_Source: `docs/research/synthesis/FINAL-v4.md` (221 lines, 2026-10-21; supersedes v3→v2→FINAL — prior versions retained) + `docs/PLAN.md`._

## What we are building
`vibe-fence` — drop-in harness that makes any AI coding agent behave like a senior-dev companion for non-technical vibe-coders. One command (`npx vibe-fence init`) wraps Codex, OpenCode, Claude Code, Cursor, Hermes, Antigravity with deterministic guardrails, teaching dial, and mechanical verification. Built for the Meta Global AI Developer Hackathon (Oct 26–Nov 4, 2026).

## The pain
Non-technical vibe-coders ship real apps with AI agents but get no safety net: secrets leak into browser bundles (`NEXT_PUBLIC_SERVICE_ROLE_KEY`), RLS is missing, deps are unpinned, and agents hallucinate fixes without verification. Permission prompts are theatre (93% acceptance, ~35% miss on exfiltration). Existing harnesses are single-runtime or backend-coupled.

## Audience
- **Primary:** Non-technical vibe-coders building hobby/small-business apps with an AI coding agent — they should be informed the harness has their back, not forced to decide on security.
- **Secondary:** Hackathon judges (Indie track, 80% Impact+Tooling+Demo) — need a visceral before/after story, not a terminal recording.
- **Tertiary:** Any agent runtime team that can adopt the `AGENTS.md` wire format + hook surface.

## What good looks like
- `npx vibe-fence init` <3s, idempotent ×3 with zero churn, single-owner `.fence/` state tree.
- Every `block` has an executable check; secrets/RLS/deps/CSP/auth guardrails with `pass/fail/unknown/not-applicable` (unknown≠pass).
- `AGENTS.md` ≤400 tokens (enforced by `tools/validate.ts`); `src/` sole authority → `dist/` disposable via `tools/generate.ts`.
- 5-task × 4-rubric eval reports success *and* unsafe-action rate; releases gated on the latter.
- 3-minute Visceral Delta video: Unfenced Disaster → Intervention → Polish & Ship (see `docs/research/synthesis/DEMO-SCRIPT.md`).

## What to avoid
- Large narrative `AGENTS.md`; backend gateway as primary safety; "Turbo" in user-facing copy; greedily stacked scaffold; permission prompts as safety; LLM-judge gating for code; ungrounded self-critique (§6 14 anti-patterns).
- Shipping Contributor pricing by default; shipping secrets without allowlist; skipping tests to green CI.
- SAM on critical path; unverified cost/country specs; browser runtimes claimed as supported.

## Constraints
- **Stack:** Bun + TypeScript only, zero external runtime dependencies in production.
- **Portability:** Client-side hooks + settings blocks; `Muse Spark 1.3` via `POST /v1/responses` stateless replay + `Muse Wonder 1.0` escalation; Standard-mode privacy default (S-15).
- **Scope:** Desktop CLIs v1; WebContainer/mobile explicitly out of scope.
- **Privacy:** `model_mode: standard` by default; installer never suggests `--contributor-mode`; secrets never in `MEMORY.md`.

## References
- `docs/research/synthesis/FINAL-v4.md` — single source of truth (15 settled S-01..S-15 + S-06a/S-11a, 10 contested C-01..C-10+3, M1–M4 + 11 GEM patches, Deep-Read Vault 14 docs/4 clusters).
- `docs/project/PRD.md` — approved requirements; `docs/project/STATUS.md` — current phase.
- `docs/PLAN.md` + `docs/research/synthesis/DEMO-SCRIPT.md` — hackathon plan + Visceral Delta script (GEM-10 P0).
- `docs/research/synthesis/INDEPENDENT-GEMS.md`, `COMPARISON.md`, `_CONSISTENCY.md`, `HTML-REVIEW.md` — audit trail.

## Open questions
- C-01..C-10 carried as instrumented evals (hook surface, AGENTS.md value, ACI richness, pedagogy, dial visibility, classifier vs deterministic, etc. — see FINAL-v4 §3; now includes v4 Deep-Read routing/verifier/rollback evals).
- B-01..B-08 blind spots (no user study on actual pop, no FP/bypass budget, optimal rule/skill counts, etc. — see FINAL-v4 §5).
