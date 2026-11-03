# vibe-fence — Plan

> Drop-in harness that makes any AI coding agent behave like a senior-dev companion for non-technical vibe-coders.
> Hackathon: Meta Global AI Developer Hackathon — Oct 26–Nov 4, 2026 · $1M pool · Muse Spark / Muse Image / SAM 3.1

_Last updated: 2026-10-21 · Source of truth: `docs/research/SOURCES.md` (186 entries) + `docs/research/synthesis/FINAL-v4.md` (221 lines) (221 lines, 2026-10-21 — supersedes v3 → v2 → FINAL; prior versions retained)_

---

## 1. Vision

A non-technical person installs one thing. From then on, whatever agent they use (Codex, OpenCode, Kimi CLI, Hermes, Cursor, Antigravity…) is wrapped in a harness that:

- Enforces structure: file layout, naming, git hygiene, deploy conventions.
- Enforces safety: security defaults, secrets handling, dependency checks.
- Scopes work: decomposes into small tasks with approval points (teachable turbo exists).
- Companions the user: "we noticed X → here's the fix + plan" — queued as structured items the agent itself resolves, not raw issues dumped on the user.
- Teaches on a dial: maximum → medium → minimum → silent.

The user doesn't decide on security — they're informed the harness has their back.

---

## 2. Phases

### Phase 0 — Deep Research (Oct 20–25, pre-kickoff)  ← COMPLETE (2026-10-20: 6/6 streams, 226 KB, ~165 sources)

Evidence-backed research across 6 streams (see `docs/research/INDEX.md`). Every claim cited.
Runs distributed: each prompt in `docs/research/prompts/` is handed to a different model; each model writes to `docs/research/contributors/<model-id>/`.
Synthesis after all runs land in `docs/research/synthesis/`.

### Phase 1 — Scaffold vibe-fence → READ `docs/research/SOURCES.md` (186 entries) + `docs/research/synthesis/FINAL-v4.md``

FINAL-v4 (221 lines, 2026-10-21) is the single source of truth: 15 settled S-01…S-15 + S-06a/S-11a, 10 contested C-01…C-10+3 sub-rows, M1–M4 actions with file-level checklist + 11 GEM patches (P0/P1/P2), blind spots B-01…B-08, Deep-Read Vault Expansion (14 docs, 4 clusters), hackathon Visceral Delta script + 5×4 rubric. `FINAL-v3.md` → `FINAL-v2.md` → `FINAL.md` are superseded, not deleted.

M1 `git init` + `src/` sole authority (mirrors reference harness template) → M2 framework primitives (`src/framework/` + state files, teaching dial, turbo, queue, verifier, circuit-breaker) → M3 skills (`src/skills/` runtime-agnostic, `src/rules/` guardrail packets) → M4 adapters (`src/adapters/` Claude/OpenCode/Codex/Antigravity/Hermes + `tools/` deterministic build `generate.ts/validate.ts/install.ts` → `dist/` disposable). `docs/fence/` canonical map.

### Phase 2 — Hackathon Build (Oct 26–Nov 4)

- MVP: `npx vibe-fence init` → drops `AGENTS.md`, `.fence/` state, skills.
- Demo app: before/after of a vibe-coded project with/without the fence.
- One Meta model integrated as the companion voice (Muse Spark).
- Submit to Indie track — theme: *Build for Your World*.

### Phase 3 — Polish & Submit

- Evals, docs, landing snippet, video.

---

## 3. Phase 0 Result — Locked 2026-10-21 · FINAL-v4 supersedes FINAL-v3 → FINAL

Phase 0 synthesis is closed. **6 streams × 6 contributors → 6 per-stream syntheses → cross-stream audit → FINAL → dual-synthesis comparison → FINAL-v3 → Deep-Read Vault Expansion (14 docs/4 clusters) → FINAL-v4.**

| Stream | Contributors | Synthesis | Sources |
|--------|--------------|-----------|---------|
| 01 harnesses | 6/6 | `synthesis/01-harnesses.md` (147 lines) | 64–212 per contributor |
| 02 harness→quality | 5/6 (gpt-6 missing) | `synthesis/02-harness-influence.md` (259 lines) | 28–135 |
| 03 elicitation | 5/6 (gpt-6 missing) | `synthesis/03-elicitation.md` (203 lines) | 13–46 |
| 04 guardrails | 5/6 (argon missing) | `synthesis/04-guardrails.md` (345 lines) | 40–69 |
| 05 companion UX | 4/6 — thinnest (argon+gpt-6 missing) | `synthesis/05-companion-ux.md` (275 lines) | 25–96 |
| 06 Meta models | 5/6 (argon missing) | `synthesis/06-meta-models.md` (252 lines) | 25–47 |

**Cross-stream:** `_CONSISTENCY.md` (176 lines, 10 contradictions checked, 134→103 dedup, 8 blind spots) + `COMPARISON.md` (247 lines, primary vs independent structural audit) + `INDEPENDENT-GEMS.md` (291 lines, 11 patches) + `HTML-REVIEW.md` (175 lines, 8 hallucinations flagged, 17 fixes · 6 P1 applied to `synthesis-explorer.html`).
**Decisions locked:** `synthesis/FINAL-v4.md` (221 lines) — 15 settled S-01…S-15 + S-06a/S-11a, 10 contested C-01…C-10+3 sub-rows, M1–M4 file-level checklist with 11 GEM patches (P0/P1/P2), blind spots B-01…B-08, 14 anti-patterns + Deep-Read Vault Expansion (14 docs/4 clusters), hackathon Visceral Delta script + 5×4 eval rubric + traceability appendix. **Start Phase 1 from `FINAL-v4.md`.** `FINAL-v3.md` → `FINAL-v2.md` → `FINAL.md` superseded, not deleted.
**Companion:** `synthesis-explorer.html` (1008 lines) — stakeholder-facing interactive explorer (5 tabs, 2 sandboxes); P1 factual fixes applied, not a spec.


**Argon amendments (v3):** S-06a Ephemeral Verifier P0 + S-08 contract-pinned `stack-contract.json` + S-09 10 zero-FP hard-blocks + S-11 6-layer containment — resolving C-01 (FP budget: downgrade DEP-01/SH-01/ARCH-01 in `local`) + C-06 (guarantee bands `guarded→assisted→autonomous→open`). Re-sequenced build: D1–3 integrity+hard-blocks+anonymize+prv-09, D4–5 Spark/Wonder+verify-remote, D6–7 Tier-1 adapters+ablation, D8–10 bench+Visceral Delta+submit (Nov 4 3PM ET). Source: `ARGON-AUDIT-v2.md` (737 lines). Prior: v3 2026-10-20 superseded v2 (216 lines).

**v4 changelog (2026-10-21, 221 lines):** Deep-Read Vault Expansion (14 docs, 4 clusters) → FINAL-v4: S-01 retrieval-gated AGENTS.md + S-02 Anthropic Skills verbatim + S-03 Context Engineering + S-06 Claude-Leak 23-check audit + **S-06a ϑ=(c,q,m) failure manifesto + Δ_in∧Δ_ho≥0 dual gate (Self-Harness/RSI-Anything) + S-07 CCI factorial isolation+combination A/B (LilLog ADAS/AFlow) + S-11a rollback invariant — persistent/continual harness must ship privilege isolation + auditable rollback (Prime Agent RCON) + S-13 Meta-Harness searchable-harness program → GEM-03 (Pareto frontier)** + §6 14→15 rules; sibling passes: S-11 goal-blind (Arxiv2602/PracticeGuide), S-12 Verbalized Sampling + SEAL, S-08/B-09 Avengers-Pro + RSI verifier, S-14 CLM PFLOP trace.
