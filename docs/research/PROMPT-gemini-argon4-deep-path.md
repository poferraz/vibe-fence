# Deep Research Prompt — Gemini Argon 4: The Most Successful Path for vibe-fence

> **Paste this entire file into Gemini Argon 4 Deep Research (choose "Deep Research" mode).**
> Estimated runtime: 40–60 minutes. Produces a Phase 1 execution + hackathon win strategy.
> If Argon asks for clarification, paste the *Project Context* block below.

---

## Your Role

You are an external principal researcher hired to audit **6 weeks of accumulated Phase 0 research** and answer one question:

**"Given everything we have learned, what is the single most successful path to win the hackathon and ship a defensible product?"**

You have no loyalty to prior synthesis. You are expected to overturn our conclusions if the evidence warrants it. Cite every finding to a file + line you actually read. Hallucinated sources (guessed URLs, invented benchmarks) are a fail — we will verify. All Phase 0 work lives at the paths listed below; start by reading what is at those paths, not the web.

---

## Project Context (paste this if Argon asks "what is vibe-fence?")

- **Product:** `vibe-fence` — drop-in harness (`npx vibe-fence init`) that wraps any AI coding agent (Codex, OpenCode, Kimi CLI, Hermes, Cursor, Antigravity) to make it safe for **non-technical vibe-coders** who have never shipped software.
- **Audience:** Non-technical creators on their first/early project. They do not read stack traces; they leak `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to the browser; they approve 93% of permission prompts blindly.
- **Core promise:** *You type `npx vibe-fence init`. The harness enforces structure/safety/scope, and teaches on a dial (`max→medium→min→silent`). You do not decide security — you are informed the harness has your back.*
- **Hackathon:** **Meta Global AI Developer Hackathon — Oct 26–Nov 4, 2026, $1M pool, Indie track `Build for Your World`**, judged on Impact 30% + Tooling 25% + Demo 25% + Depth 20%. Required models: **Muse Spark 1.3** (companion voice via `POST /v1/responses` stateless encrypted replay), **Muse Wonder 1.0** (plan/verify escalation tier, ≤5 calls/session unless `--wonder`), **Muse Image** ($0.01/image, demo polish), SAM 3.1 out of critical path.
- **Scaffold status:** Phase 0 locked. `src/` is sole editable authority → `dist/` disposable (`src→dist` parity via `fence validate/sync`). M1–M4 file-level checklist in `FINAL-v2.md` §4 + 11 GEM patches (P0/P1/P2) + gap ledger (see status below). `src/skills/{vibe-init,vibe-guard,vibe-plan,vibe-teach}/SKILL.md`, `src/framework/{integrity,context-budget.yml,circuit-breaker,verifier,dial,git}.ts`, `src/config/severity-policy.json`, `tools/{generate,validate,install}.ts` landed; remaining: `src/rules/{bill-01,prv-09}.ts`, `src/framework/{verify-remote,billing-guard}.ts`, `tools/anonymize.ts`, adapter `.yml` portability configs.
- **Thesis in FINAL-v2 §1:** (1) deterministic fence decides / model explains, (2) small budgeted surfaces win, (3) mechanical verification gates "done", (4) containment+reversibility = turbo safety, (5) teaching and autonomy are orthogonal axes.

---

## Data Pack — What to read first (before the web)

Phase 0 produced **all of the below** (14 MB, ~165 sources, ~226 KB synthesis). Read them in this order; every bullet is a file you will be judged on citing correctly:

**1. Planning / lock-in (what Phase 1 must execute):**
- `docs/PLAN.md` — 3 phases, Phase 0 locked 2026-10-20, appendices, Top 5 steal-ables.
- `docs/research/INDEX.md` — 6 stream definitions + Phase 1 M1–M4 dependency table.
- `docs/clief/INDEX.md` — canonical map (identity, folder structure `docs/clief/`+`src/`+`tools/`+`tests/`+`dist/`, routing table).
- `docs/clief/STATUS.md` — current build status (what's landed vs gaps).
- `docs/clief/RECONCILE.md` — GEMS→files map vs disk, 8 remaining gaps.

**2. Locked handoff (the contract):**
- `docs/research/synthesis/FINAL-v2.md` (216 lines) — **the contract.** 15 settled S-01..S-15, 10 contested C-01..C-10+3 sub-rows, M1–M4 file-level checklist + 11 GEM patches (P0/P1/P2), 8 blind spots B-01..B-08, 14 anti-patterns (Must NOT), hackathon Visceral Delta 0:00→3:00 script + 5×4 eval rubric + 5-step suite, traceability appendix. `FINAL.md` (144 lines) is superseded — read it only to spot what v2 changed.

**3. Per-stream evidence (every claim cites one of these):**
- `docs/research/synthesis/01-harnesses.md` (147 lines, 6/6) + `02-harness-influence.md` (259) + `03-elicitation.md` (203) + `04-guardrails.md` (345) + `05-companion-ux.md` (275) + `06-meta-models.md` (252) — each with A-rows (agreements), D-rows (disagreements), Uniques, Gaps, Consolidated Answer, Actions.
- `docs/research/synthesis/synthesis-independent/01..06-*.md + FINAL.md` — independent replication synthesis (shorter, same sources). Read to find what primary filtered out.
- `docs/research/contributors/*/01..06-*.md` (31 files) — raw multi-model reads (6 contributors × 6 streams: `muse-spark`, `gemini-3.8-flash`, `gemini-4-argon` (3 docx→md), `deepseek-v4.1-flash`, `minimax-m3.1-flash`, `gpt-6`).

**4. Cross-stream audit + companion (how we caught our own errors):**
- `docs/research/synthesis/_CONSISTENCY.md` (176 lines) — 10 contradictions checked (2 dismissed, 8 resolved, 1 flagged genuine C-05 turbo), 134→103 dedup (11 clusters), 8 blind spots (B-01 no user study strongest).
- `docs/research/synthesis/COMPARISON.md` (247 lines) — primary vs independent structural audit, 6 stream verdicts, explorer's 5 uncaptured gaps, traceability matrix.
- `docs/research/synthesis/INDEPENDENT-GEMS.md` (291 lines) — 11 patches harvested from independent (hash attestation, WebContainer probe, remote RLS, BILL-01/PRV-09, Wonder/SAM/ethics, ephemeral verifier).
- `docs/research/synthesis/synthesis-explorer.html` (1008 lines, P1 fixes applied) — stakeholder explorer (5 tabs, 2 sandboxes: Teaching Dial + Turbo gatekeeper). Companion, not spec. Read with `HTML-REVIEW.md`.

**5. Appendices (sidebar research pinned to FINAL-v2):**
- `docs/research/synthesis/ECC-SIDEBAR.md` (503 lines) — `affaan-m/ECC` 2.2.3 vs vibe-fence: 7-harness comparison, 5 steal-ables.
- `docs/research/synthesis/ECC-SECURITY-DEEPDIVE.md` (363 lines) — GateGuard fact-forcing internals, trust-boundary hardening, adapter compliance scorecard.
- `docs/clief/APPENDIX-ECC.md` — one-page Top 5 steal-ables pocket card (GateGuard taxonomy, per-gate ablation, state-tree hardening, hooks_enabled/profile, agentic-engineering loop).

**6. Interactive explorer + review:**
- `docs/research/synthesis/HTML-REVIEW.md` (175 lines) — 8 hallucinations corrected (H-01 95%/Zero banner, H-02 18k→n≈1,000 Bastani, H-03 65% latency invented, H-04 14% accuracy misattribution — real 14% is reasoning-token bloat, H-05 single-model mislabel, H-06 93% scope, H-07 1,000+ tasks unsourced, H-08 token drift) + sandbox/roadmap critique + 17 fixes (6 P1 applied).

---

## What to research (the open web)

Your Phase 0 relied on **transfer inference** — SWE-bench Python + higher-ed RCTs (Bastani PNAS 2025-06-25 n≈1,000 math +48%/−17% vs +127% hint-first; Sweller/Kalyuga scaffolding-fade) transferred to vibe-coder JS/TS greenfield. That is the #1 risk (FINAL-v2 §5 + _CONSISTENCY B-01). Your job is to **ground-verify and then chart the winning path**.

### Research Question 1 — Elicaibility: Does vibe-fence's elicitation thesis survive contact with code?

Paulo's hypothesis was "ask 5, self-critique, synthesize 1 beats ask 1." Phase 0 rejected it for code — settled on `1→verify→conditional best-of-k` + Tournament Selection + ephemeral verifier bootstrap for testless repos, with `1→N→synthesize-1` reserved for plans. Deep-dive: find every paper, eval, and field study that tests this on **greenfield Next.js/Tailwind/Supabase** (not SWE-bench issue-repair) with non-technical prompters. Which sub-pattern of the thesis (best-of-N, judge, debate, self-refine, MoA, postinstall guard, synthesis-for-plans) has any real greenfield evidence? Where is the evidence zero?

### Research Question 2 — Guardrail economics: Which blocks are worth their FP budget?

Phase 0 locked 14 `block` + `warn→block` after allowlist + `.fence/app-profile.json` `local/shared/public` (14/29/55 blocks) but never measured **false-positive/bypass budget** (FINAL-v2 C-01 + B-02: the load-bearing unknown). Deep-dive: surface every hook-zoo evaluation (the `nomos 7/8+0/4` claim, Codex gate studies), gate-experience studies (Anders 14.8% mentions-secret, Wauters 409k decisions), and teaching-verbosity↔correctness interactions (B-05). Which `block` rows need an explicit human eval before shipping — and which are safe to lock as settled?

### Research Question 3 — Turbo as product: deterministic containment vs classifier, and the naming trap

Phase 0 flagged turbo classifier vs deterministic containment as the **only genuine divergence** (FINAL-v2 C-06 + _CONSISTENCY C-05). Deep-dive: trace every deployed turbo (Antigravity `Turbo` = sandbox off, Codex `approval:never`, factory Turbo, Claude "approve everything" flags) — which containment mechanism (realpath boundary + credential hard-deny + egress allowlist + git checkpoint + `fence undo` + ≤3 gates/session) has a portable precedent, and which vendor classifier (Cursor concedes best-effort, none publish p/r) could actually be borrowed? Resolve the naming: bands by guarantee (`guarded→assisted→autonomous→open`) vs "Turbo" label.

### Research Question 4 — Demo that wins: Visceral Delta vs evaluator rubric vs adversary bench

Phase 0 left two demo artefacts: the **Visceral Delta 0:00→3:00 video** (unfenced disaster → live `npx vibe-fence init` intervention → polish & ship, 80% of judging) and the **5×4 eval rubric** (`auth`/`paid API`/`bug fix`/`ship-to-prod`/`add-dep` × structure/secrets/git/deploy) + adversarial fence bench + 5-step acceptance suite (idempotent init ×3, secret-leak exit 1, rollback integrity, token budget ≤400, Responses flow smoke). Deep-dive: map every hackathon winning demo (Cerebral Valley 2024–2026, any Meta-track winner, any Indie track winner) to this split — what video structure + eval artefacts actually moved Indie judges? Which rubric rows do judges skim vs litigate?

### Research Question 5 — The most successful build order (with the ECC check)

Phase 0's M1→M4 is opinionated; ECC (7-harness plugin, `hooks_enabled`/`hook_profile`, `harness-adapter-compliance.js` honest scorecard, `build-pi-core.js` offline profile) offers a mature counter-pattern. Deep-dive: cross-reference FINAL-v2 M1–M4 + Top 5 steal-ables (GateGuard taxonomy, per-gate ablation `off/gate/minus-target/placebo`, state-tree hardening gate, explicit-choice installer, agentic-engineering loop) against **shipped competitor builds** (ECC 2.2.3, Bolt/StackBlitz WebContainer probes, Replit Agent `npx` flows). Where does FINAL-v2's M1→M4 misorder work, miss a dependency, or front-load too little/much for a 10-day build? Produce a re-sequenced, day-by-day plan.

### Research Question 6 — What would make us wrong (and how we'd know early)?

Phase 0's blind spots (B-01 no user study on vibe-coder pop. · B-04 supply-chain injection at build time · B-07 testless-repo verifier quality 11.3% flaky on curated → worse on hobby) could each sink vibe-fence. Deep-dive: for each settled S-01..S-15, construct its strongest falsifier — the study, repo, or 10-user greenfield bench that would most efficiently falsify it. Prioritize by *cheapest-to-run × most-lethal-if-true*.

---

## How to run it (instructions for the researcher — i.e., you)

1. **Ingest the data pack first.** Skim PLAN.md → FINAL-v2.md → synthesis/01..06 + _CONSISTENCY.md. Without this you will duplicate or contradict settled work.
2. **Then hit the web.** For each RQ, search GitHub issues/PRs/discussions, arXiv papers, engineering blogs (Vercel, Supabase, OpenAI Codex, Anthropic harness, StackBlitz WebContainers), hackathon post-mortems, and app-store reviews of vibe tools — not just blog summaries. Prefer primary sources, dated evidence, and replicated findings.
3. **Every finding cites a file you read OR a URL you fetched.** No uncited claims. No "studies show" without a DOI or commit hash.
4. **Flag replication failure explicitly.** If a FINAL-v2 "settled" claim does not replicate (e.g., the 65% latency / 14% accuracy hallucinations already caught in HTML-REVIEW.md H-03/H-04), mark it as overturned with the conflicting evidence and the line in FINAL-v2 it replaces.
5. **Respect the guardrails.** `AGENTS.md` ≤400-token router (not essay), `src/` sole authority → `dist/` disposable, `.fence/` single-owner tree — these are architectural invariants, not negotiable style. Do not propose "just use cursor rules" or "ship a proxy gateway."
6. **Stop before writing code.** This is a research pass, not an implementation pass. Deliver the strategy; code comes next.

---

## Output format (exactly this — no extra sections, no omitted sections)

### Title block
```
# Argon 4 Deep Dive — The Most Successful Path for vibe-fence
Date: <today>
Model: Gemini Argon 4 — Deep Research
Input corpus: FINAL-v2.md (216 lines) + 6 per-stream syntheses + 31 contributor files + _CONSISTENCY/COMPARISON/GEMS/HTML-REVIEW + ECC sidebars (2) + synthesis-explorer.html — all paths above
Verdict on FINAL-v2: <1 sentence — stands / stands with amendments / overturns key claim (name it)>
```

### §1 Executive Verdict — The Most Successful Path (≤300 words)
One path, not three options. Name the hackathon-winning wedge (the one demo beat no competitor can replicate), the engineering wedge (the one guardrail + eval artefact that carries credibility), and the narrative wedge (why this wins Indie `Build for Your World`). End with the single riskiest assumption and its day-2 falsifier.

### §2 Findings by Research Question (§2.1–§2.6)
One subsection per RQ above. Each opens with **1-sentence answer**, then a table:

| # | Finding | Evidence (file line or URL + accessed date) | Confidence | Implication for plan |
|---|---------|---------------------------------------------|------------|----------------------|
| F-01 | ... | `docs/research/synthesis/02-...md:38` OR `https://arxiv.org/abs/2405... accessed 2026-10-20` | `settled` / `strong` / `thin` | Keep / Amend / Drop + file to edit |

Close each RQ with: **"Amendments to FINAL-v2:"** (bullet list of exact lines in FINAL-v2 that must change, with replacement language — or "None") and **"New blind spot, if any:"** (one sentence or "None").

### §3 The Re-sequenced Build Order (day-by-day, Oct 26–Nov 4)
A 10-day calendar with owners, dependencies, and **what ships each day that is demoable that night**. Mark P0/P1/P2, `src/framework/*` file boundaries, and which contested C-01..C-10+3 sub-rows each day resolves. Must account for Meta Muse Spark/Wonder/Image wiring, SAM contract, Standard-mode P0 ethics gate, and the `npx vibe-fence init <3s` installer. If you disagree with FINAL-v2's M1→M4, show the diff explicitly.

### §4 The Demo & Submission Package (what judges see)
One-page Visceral Delta shot list (camera, voiceover, on-screen text, timing to the second), the 5×4 rubric as a linkable appendix, the 5-step acceptance suite pass/fail output, and the one artifact per rubric cell. Name the single take that must be re-recorded if it flubs.

### §5 Falsifier Suite — What Would Make Us Wrong
Table per settled S-01..S-15: strongest falsifier, cheapest greenfield bench that tests it, abort condition (what number kills the claim), and what plan change the falsifier triggers. Sorted by *cheapest × most lethal*.

### §6 Amendments to FINAL-v2 (PR-ready)
A numbered patch list in the exact format `docs/PLAN.md` and `docs/research/INDEX.md` expect — each patch states file, section, old text → new text. "No amendments" is allowed only if §5 is empty.

### §7 Sources (audit provenance)
Every URL and every cited `docs/...` path in one deduped table. No uncited row may appear in §2–§5.

---

## Hard constraints

- **Do not propose a gateway/proxy harness** (FINAL-v2 Must NOT #2) or a single-runtime rule-file primary safety path — client-side hooks + settings blocks + `src→dist` determinism are invariants.
- **Do not re-introduce hallucinated benchmarks** already caught in HTML-REVIEW.md (H-01 95%/Zero, H-02 18k→n≈1,000, H-03 65% latency, H-04 14% accuracy, H-05 single-model, H-06 93% scope, H-07 1,000+ tasks, H-08 token drift) without a fresh primary source that survives verification.
- **Do not quote `synthesis-explorer.html` sandboxes as spec** — Teaching Dial/Turbo simulators are illustrative UX (per HTML-REVIEW.md §2), not fence behaviour.
- **Do not ship Contributor-mode training by default** — Standard-mode default is a P0 ethics gate (FINAL-v2 S-15 / Must NOT #10); `--contributor-mode` is explicit opt-in only with disclosure.

Good hunting.
