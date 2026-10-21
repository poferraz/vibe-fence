# FINAL v2 — Locked Phase 0 → Phase 1 Handoff

> **Date:** 2026-10-20 (+ Argon audit 2026-10-20 v2) · **Status:** Locked, auditable. Supersedes `FINAL-v2.md` which superseded `FINAL.md`.
> **Provenance:** 6 research streams (01 harnesses · 02 harness→quality · 03 elicitation · 04 guardrails · 05 companion UX · 06 meta models) · 6 contributors (`muse-spark`, `gemini-3.8-flash`, `gemini-4-argon`, `deepseek-v4.1-flash`, `minimax-m3.1-flash`, `gpt-6`) · ~165 sources · ~226 KB · 2 independent synthesis tracks (primary `synthesis/` + replication `synthesis-independent/`) · cross-stream audit `_CONSISTENCY.md` (134→103 dedup · 10 contradictions C-01–C-10 · 8 blind spots B-01–B-08) · reviewed by `COMPARISON.md` (structural audit), `INDEPENDENT-GEMS.md` (11 patches), `HTML-REVIEW.md` (17 fixes F-01–F-17, explorer not spec).
> **Invariants:** No per-stream file was modified. Explorer is a companion, not a spec.

---

## 1. Executive Summary — What Phase 0 Proved

A portable, client-side harness captures nearly all measured benefit from LLM scaffolding without the failure modes of existing harnesses. Five principles are settled (Sources: `FINAL.md` §1 · `_CONSISTENCY.md` §2 C-01–C-10 · `COMPARISON.md` §2 · `HTML-REVIEW.md` §1 — all hallucination corrections applied):

1. **Deterministic fence decides; model explains.** Every `block` maps to an executable check; model output is `{finding_id, explanation, question, options, evidence_ids}` validated app-side. Permission prompts alone are theatre (93% acceptance, ~35% miss on scope/exfiltration).
2. **Small, budgeted surfaces win.** `AGENTS.md` ≤400 tokens router + L1/L2/L3 progressive disclosure + 4 KB shell caps + byte-capped context budgets. Rule-count joint reliability decays as p^n (~2 rules @95%, ~5 @80%); stacking scaffold greedily loses to proper subsets (CCI factorial).
3. **Mechanical verification gates "done."** `Read→Think→Write→Check`; trust ladder `compile→lint→tests×2→generated-tests→judge-for-prose`; diagnosis artefact before retry. Ungrounded self-critique, debate/MoA on the interactive path, and LLM-judge gating are net-negative at equal budget.
4. **Containment + reversibility = turbo safety.** Project-root `realpath` boundary + credential hard-deny + egress allowlist + git checkpoint + `fence undo` + ≤3 gates/session with resolved target/diff/blast/competence test. Not prompts, not a classifier in v1.
5. **Teaching and autonomy are orthogonal.** Scaffolding-fade dial (`max→medium→min→silent`, per-domain vector in `.fence/state/dial.json` behind one global knob) is a rule-count dial; turbo is a consequence×reversibility×session-coupling gate. Same API, two tiers: Muse Spark 1.3 (companion) → Muse Wonder 1.0 (plan/verify escalation); Image is cheap demo polish; SAM stays out of the critical path (one concept/request, geometry not semantics).

---

## 2. Settled Decisions — Phase 1 Treats as Closed (S-01..S-15)

Each row is primary `FINAL.md` §2 verbatim, enriched where `COMPARISON.md` or `INDEPENDENT-GEMS.md` warrants. Cite `§_CONSISTENCY C-##` per verdict.

| # | Decision (primary verbatim) | Enrichment / verdict | Sources |
|---|------------------------------|----------------------|---------|
| S-01 | `AGENTS.md`/`CLAUDE.md` ≤400-token map/router only (≈100 lines prose — subsumes per-stream 200-line variants). Full docs in `docs/fence/INDEX.md` + per-page `description-agent` frontmatter. One-fact-one-location: `src/` editable → `dist/` disposable → `.fence/` single-owner state. Linter enforces budget. | **Canon = tokens, not lines.** `COMPARISON.md` verdict: independent's ≤150-line variant is subsumed; `_CONSISTENCY.md` C-03 resolves as `≤400 tokens` canonical, `≈100 lines` prose approximation, checkable in `tools/validate.ts`. **HTML drift:** normalize all "under 150 lines" to this token phrasing. [GEMS §3 checkbox affordance] | 01 D-03, 02 A-03/A-05/A-08, 03 #7 · `_CONSISTENCY C-03` · `COMPARISON.md §1.01, §3 F-08/F-13` · `INDEPENDENT-GEMS.md GEM-02` |
| S-02 | Progressive disclosure is the context primitive: name+description at startup, full body on match. Skills under `.agents/skills/` + `.claude/skills/`. | Unchanged. Keep as spine; cherry-pick file-path affordance: attach `src/skills/<skill>/SKILL.md` to each M3 item. | 01 A-03, 02 A-03 |
| S-03 | Context is a budget, not a buffer. Hard caps in `src/framework/context-budget.yml`; byte-cap shell outputs at 4 KB; metadata-only skill exposure; keep invariants at context boundaries; re-anchor after compaction. | Unchanged. GEMS P2 note: image tokens bill against `history` headroom. | 02 A-02, 05 A-04 · `INDEPENDENT-GEMS.md GEM-02` |
| S-04 | Verification is mechanical, never self-assessment. `Read→Think→Write→Check`; executable validators gate "done"; diagnosis artefact before retry. | Unchanged. Name the pattern: **Tournament Selection** (K parallel → first green wins) per `COMPARISON.md §1.03`. Add **2-Attempt Circuit Breaker** `src/framework/circuit-breaker.ts` after 2 consecutive failures (independent Stream 02 cherry-pick). | 02 A-04, 03 A-02 · `COMPARISON.md §4.2` · `INDEPENDENT-GEMS.md GEM-11` |
| S-05 | Deterministic fence decides; model explains. Every `block` has a command returning a verdict; no deterministic check → never a block. Model output validated app-side. Secret/privilege/credential path never mintable by model. | Unchanged. | 02 A-07, 04 A-17, 06 A-02 |
| S-06 | Instruction files are an attack surface. `AGENTS.md`/SKILL.md treated as untrusted on init and on dependency pulls; validate, hash-attest (`fence validate`), reject contradictory tiers and invisible-Unicode. | **Hash-enforced, not advisory.** GEM-01 patch: SHA-256 attestation `src/framework/integrity.ts` + `.fence/.integrity.json` + `FENCE_SYNC_TOKEN` gate + `.fence/hooks/postinstall-guard.sh` for `go mod tidy`/`npm install` vector (AIShellJack/TrojanForge/NVIDIA Red Team). | 01 D-04, 02 A-07 · `INDEPENDENT-GEMS.md GEM-01` · `COMPARISON.md §1.01` |
| S-06a | **Greenfield Ephemeral Verifier — P0.** On testless greenfield JS/TS repos (B-07), `src/framework/verifier.ts` executes a fast 2-stage synchronous turn gate (`tsc --noEmit` + AST secret/loop/script scan in <1.5s) and a pre-ship headless HTTP route-render + `verify-remote.ts` probe. | **P0 for greenfield.** Mitigates B-07 (11.3% flake on testless repos) while preserving AgentGuard's +13.3pp task-completion lift (21.7%→35.0%). | `INDEPENDENT-GEMS.md GEM-11` · `ARGON-AUDIT-v2.md §2.1` · `_CONSISTENCY B-07` |
| S-07 | Small rule sets dominate. p^n joint reliability: ~2 rules at 95%, ~3 at 90%, ~5 at 80%. Teaching dial is a rule-count dial. Never stack greedily — CCI factorial: all-in 5-component beaten by proper subset every condition. | **Load-bearing p^n quote corrected.** `COMPARISON.md` + `HTML-REVIEW.md` correction: the CCI stat is *all-in beaten by proper subset in every condition with negative Shapley for planning*; the spurious "14% accuracy drop" from the explorer is deleted (real 14% is reasoning-token bloat). Every addition A/B'd in isolation *and* combination. | 02 A-08, 05 gaps · `_CONSISTENCY C-03` · `COMPARISON.md §1.05` · `HTML-REVIEW.md H-04` |
| S-08 | **Contract-Pinned Plan Elicitation:** For greenfield Next.js/Tailwind/Supabase repos, `vibe-plan` (1 Muse Wonder 1.0 call) emits a machine-enforced `.fence/stack-contract.json` (locking App Router, @supabase/ssr, Tailwind config) enforced by `vibe-guard`, replacing unpinned 1→N→synthesize-1 text synthesis. | **Prevents chimeric App/Pages Router + @supabase/ssr vs auth-helpers hallucinations (B-09, new).** BILL-01/PRV-09 still into M3 packet. | 04 D-01/D-02 · `INDEPENDENT-GEMS.md GEMS-05/06` · `ARGON-AUDIT-v2.md §2.1` |
| S-09 | **Tiered Guardrail Policy — 10 zero-FP hard-blocks (exit 1) in all profiles:** SEC-01 (`NEXT_PUBLIC_` secret), SEC-02 (`.env`/`~/.ssh`/`~/.aws` read), SEC-03 (git secret commit with entropy+dummy allowlist), FS-01 (realpath escape), CMD-01 (`rm -rf` + `chmod -R 777`), NET-01 (`curl|sh`), SUP-01 (`--ignore-scripts` + `package.json scripts.*` AST scan), GIT-01 (force-push/unbacked reset), DB-01 (destructive SQL/RLS disable), PRV-09 (Meta Standard mode P0 ethics lock). | **Closes nomos's sole `chmod -R 777` miss (8/8 TP) + Wauters npm-run bypass (52.5% miss) while keeping 0/4 benign FP.** App Profiles UI still canon gloss; `devDependencies` warn heuristic day-one. | 04 D-07/A-06/D-06 · `ARGON-AUDIT-v2.md §2.2` · `COMPARISON.md §1.04` |
| S-10 | Turbo safety is containment+reversibility+batched review, not prompts. Three-tier `auto/notify/gate` keyed to consequence×reversibility×session-coupling; project-root `realpath` + credential hard-deny + egress allowlist + git checkpoint + `fence undo`. ≤3 gates/session. `minimal` is not aesthetic — most hooks are theater, FP budget defines surface (`_CONSISTENCY C-01`). Lint skill text for ungrounded self-critique (`_CONSISTENCY C-02`). | **Turbo label forbidden user-facing.** Bands named by guarantee (`guarded→assisted→autonomous→open`); internal "turbo" OK. Independent's "Teachable Turbo" reframe is internal-only. **Glimmer local** classification path added (P2). | 05 A-06/A-07, 01 D-01/D-02, 02 D-04 · `_CONSISTENCY C-01/C-02/C-05/C-06` · `COMPARISON.md §4.4` |
| S-11 | **Autonomous "Safe-Turbo" Containment — 6 portable deterministic layers:** (1) `integrity.ts` realpath boundary + SHA-256 state-tree self-tamper lock (exit 2), (2) `.env`/`.fence` hard-deny, (3) `package.json scripts.*` AST allowlist, (4) automatic pre-tool `refs/fence/checkpoints/*` shadow git commit, (5) 1-command `npx vibe-fence undo`, (6) ≤3 human gates/session. | **Incorporates ECC Steal-able #3 (`ECC-SECURITY-DEEPDIVE.md:110–195`) + prevents hook tamper vectors.** Anti-sycophancy directive still to `AGENTS.md` template. | 05 A-01/A-03/A-05, 02 D-04 · `ARGON-AUDIT-v2.md §2.3` · `COMPARISON.md §4.2` |
| S-12 | Elicitation: `1 sample → cheapest verify → on failure parallel best-of-k (k≤5) → first pass wins`. Happy-path ~1.0–1.2×. Ungrounded self-critique, debate, MoA-on-interactive, best-of-N vs judge, patch-merging are net-negative at equal budget. | Unchanged; named **Tournament Selection**. Add **ephemeral verifier bootstrap** `src/framework/verifier.ts` for testless repos (`// @fence-ephemeral` smoke suite + trust ladder) per GEM-11. | 03 A-01/A-02/A-06/A-08/A-09 · `COMPARISON.md §1.03` · `INDEPENDENT-GEMS.md GEM-11` |
| S-13 | Muse Spark 1.3 via `POST /v1/responses` stateless encrypted replay is companion voice; Muse Wonder 1.0 is plan/verify escalation tier. Image $0.01/image for OG/demo. SAM (one concept/request, geometry not semantics) stays out of critical path; if shipped, click-to-teach. Muse Code `AGENTS.md` chain is wire format; reference adapter is file-writing. | **Dual-tier routing explicit.** GEM-08: `MUSE_MODEL_COMPANION` (default `muse-spark-1.3`) / `MUSE_MODEL_ARCHITECT` (default `muse-wonder-1.0`), same Bearer base URL, ≤5 Wonder calls/session unless `--wonder`; record `model` in artefacts. GEM-07: SAM contract + `SAM_SINGLE_CONCEPT_VIOLATION` comma-guard test. | 06 A-01/A-04/A-05/A-08/D-01/D-02 · `INDEPENDENT-GEMS.md GEMS-07/08` |
| S-14 | Before/after + eval table is the demo. 5 tasks (`auth`, paid API, bug fix, ship-to-prod, add-dep) × rubric (structure/secrets/git/deploy) with deterministic + one model-graded row. Report success *and* unsafe-action rate; gate releases on latter. | Unchanged; now paired with Hackathon appendix (§8 Visceral Delta script) — demo-is-eval + theatre. | 06 A-06, 02 invent · `INDEPENDENT-GEMS.md GEM-10` · `COMPARISON.md §4.2` |
| S-15 | **🆕 Standard-mode privacy default.** Standard pricing is default for all user-code paths; Contributor discount is explicit `--contributor-mode` opt-in with displayed training-use disclosure. Secrets never in `MEMORY.md`; PII-masked crops; Standard+stateless for user-code, Glimmer 30B local for sensitive classification. | **P0 ethics gate.** GEM-09 patch: installer never suggests `--contributor-mode` in README/quickstart/demo; `.fence/config.json` `model_mode` persisted; README quickstart uses Standard. | `INDEPENDENT-GEMS.md GEM-09` · `COMPARISON.md §4.1` |

---

## 3. Contested — Phase 1 Carries as Risks / Evals

10 primary `C-01..C-10` verbatim; 3 independent sub-bullets integrated as sub-rows (not new top-level IDs). Do not hard-code; instrument and A/B. (Source: `FINAL.md` §3 · `_CONSISTENCY.md` §5.2 · `COMPARISON.md` §2 · `INDEPENDENT-GEMS.md` §5)

| # | Question | Readings | Phase 1 carry |
|---|----------|----------|---------------|
| C-01 | **False-Positive Budget — RESOLVED:** Oct 2026 hook-zoo (nomos 7/8 TP, 0/4 FP vs native 7/8 TP, 3/4 FP) + Wauters 409k decisions. DEP-01/SH-01/ARCH-01 downgraded from hard-block in `local` to maintain 0/4 (<5%) benign FP. | 01 D-01 · `ARGON-AUDIT-v2.md §2.2` | Ship 10 zero-FP hard-blocks (S-09); DEP-01 → allowlisted UI packages, SH-01 → per-subcommand AST parse of `&&`, ARCH-01 → non-blocking warn in `local`. |
| C-02 | Generated `AGENTS.md` value. ETH Zurich −3%/+23% on well-documented Python vs helpful on undocumented — transfers to greenfield JS/TS (target pop.)? | 02 D-01 | Do not auto-generate large `AGENTS.md`. Ship minimal router + PageRank map (≤1k tokens, per-task). Replicate Agentbench on JS/TS greenfield bench. |
| C-03 | ACI richness by model tier. Rich filtered tools (4× SWE-bench) vs `mini-swe-agent` 100-line bash-only >74% on frontier. | 02 D-02, 06 gaps | Per-runtime adapter profiles with model-tier-conditional surface (thin bash for frontier, richer for weak). Re-validate as models improve. |
| C-04 | `max` pedagogy: explain-loudly vs hint-first vs structured-forcing. Bastani/Buçinca transfer contested. | 05 D-01 | Minimax schema as container + deepseek hint-first inside `max`; one forced choice at trade-off decisions. Transfer check: can user fix similar issue unassisted? *Note: HTML's "18,000-student / doubles retention" is corrected — Bastani PNAS 2025-06-25 is n≈1,000 math, +48%/−17% vs +127% hint-first.* |
| C-05 | Dial visibility + fade trigger. Visible `max` default vs invisible tracker; "N=5 verified fixes" / "3 clean sessions" invented constants. | 05 D-02, gaps | State file as vector; one global knob UI. Auto-degrade opt-in flag (`--budgeted-teaching`), not default. Sweep gate budgets 1→5 in eval. |
| ↳ C-05a | *Sub-bullet — Teaching Dial Granularity (independent C-03).* Single global slider vs 7-domain vector. | 05 D-02 (ind.) | Already S-11's resolution: single knob UI over vector store (`deepseek 05`). No new experiment. |
| C-06 | **Autonomy Naming & Mechanism — RESOLVED:** Probabilistic classifiers rejected (Anthropic Auto Mode 17% FN). Modes named by guarantee in `.fence/config.json`: `guarded → assisted → autonomous` (default Safe-Turbo) `→ open`. | 05 D-03 · `ARGON-AUDIT-v2.md §2.3` · `_CONSISTENCY C-05` | Deterministic containment (S-11) is gate; classifier feature-flagged P2 vs gate-budget+findings-without-asking. Avoids Antigravity Turbo collision. |
| ↳ C-06a | *Sub-bullet — App Profile Rigor (independent C-02).* Static global severity vs dynamic `local→public` scaling. | 04 D-07 (ind.) | Primary S-09 *is* the dynamic answer (`minimax 04`); static variant rejected. Track as resolved sub-question under C-06's broader mechanism debate. |
| C-07 | Dependency severity: raw `npm audit --audit-level=high` block vs reachability-checked mitigations. | 04 D-04 | Raw audit as CI block (starter); document escalation to applicability-checked triage with expiry/invalidation on dep changes. |
| ↳ C-07a | *Sub-bullet — devDep Warn (independent C-04).* Block `dependencies`, warn `devDependencies`. | 04 D-04 (ind.) | Adopt as day-one heuristic inside D-07a's two-phase answer: `dependencies` → `block`, `devDependencies` → `warn` until triage pipeline lands. |
| C-08 | Muse Spark cross-harness transfer. Co-trained on Muse Code; foreign-harness quality unmeasured. | 06 open Q | Same task × ≥2 runtimes, one model, pass rate per runtime before claiming "any agent." (GEM-03 prompt-portability gate includes this.) |
| C-09 | Glimmer 30B local vs Spark 1.3 on classification; real $/verified fix under actual request shapes. | 06 gaps | Benchmark 24-case eval Glimmer vs Spark 30B; instrument $/task at Standard pricing. |
| C-10 | Can LLM-generated smoke tests on testless hobby repos be trusted as block gate, or do they false-pass? 11.3% flaky on curated suites; worse unmeasured. | 03 D-07, 04 gaps, `_CONSISTENCY B-07` | Trust ladder + `run×2` flake check (GEM-11) as default; measure false-pass on private vibe-coder bench before promoting generated tests to `block`. |

---

## 4. Actions by Milestone — Grouped by Architectural Dependency (re-sequenced per ARGON-AUDIT-v2.md §6)

Primary `FINAL.md` §4 is the spine (`COMPARISON.md §2` verdict: keep primary wholesale) + Argon re-sequence (M1 D1–3: integrity+hard-blocks/prv-09/anonymize/bill-01/billing-guard/git undo; M2 D4–5: Spark/ Wonder+`stack-contract.json`/verify-remote+verifier; M3 D6–7: Tier-1 adapters+compliance+ablation+Muse Image; M4 D8–10: freeze+Adversary Bench+Visceral Delta+submit). Each bullet carries file + dependency note. Five independent cherry-picks + 11 GEMs integrated where flagged. Cite per item.

### M1 — Project Skeleton (`git init`, `src/`, `tools/`, `docs/fence/`, `dist/` wiring) — *no upstream deps; unblocks all*

- [x] `src/` sole editable authority → `dist/` disposable; `tools/{generate,validate,install}.ts` enforce `src→dist` parity + context budget + freshness (`fence validate` / `fence sync`). One-fact-one-location. (§01, §02 S-01/S-14)
- [x] `docs/fence/INDEX.md` router + per-page `description-agent` frontmatter; PR-gated parity + `docs-updated`/`no-docs-needed`/`blocked` receipt. (§02 muse-spark)
- [x] `.fence/` single-owner state tree; queue, dial, lessons, verdicts, budgets owned by harness. (§02 S-03, §05 Q-01)
- [x] `.fence/app-profile.json` (`local`/`shared`/`public` → 14/+15/+26 `block` tiers). Unblocks M3 severity mappings. (§04 S-09)
- [x] Trusted-channel hardening — integrity attestation (SHA-256), same-session `AGENTS.md` overwrite refusal, invisible-Unicode scan, `<untrusted-content>` envelope, `tools/` outside agent write-scope. (§01 D-04, §02 S-06)
- [x] **`src/framework/integrity.ts` + `.fence/.integrity.json` + `.fence/hooks/postinstall-guard.sh`** — GEM-01 hash attestation + `FENCE_SYNC_TOKEN` gate. **P0.** (*GEM-01*)
- [x] **WebContainer probe in `tools/install.ts`** — detect `process.versions.webcontainer`/`/.webcontainer`/hook installability; on hit print file-only fallback + `runtime` in `app-profile.json`. (*GEM-02 · cherry-pick #4 · `COMPARISON.md §4.2`*)
- [x] Doc-gardening receipt + `fence validate` ≤400-token assertion `tools/validate.ts`. Add checkbox+path affordance to all M1–M4 bullets. (*cherry-pick #5*)

### M2 — Framework Primitives (teaching dial, turbo, queue, state files) — *needs M1 state tree + budget*

- [x] `AGENTS.md` ≤400 tokens assertion in `tools/validate.ts`; error if exceeded. Cross-validates 6 streams. (S-01) + **Anti-sycophancy directive** in template. (*cherry-pick #1*)
- [x] `src/framework/context-budget.yml` — caps for static/dynamic/history/headroom; MCP as code APIs; metadata-only L1/L2/L3; `head -c 4000`. (S-03/S-08) + **image-token headroom note**. (*GEM-02 P2*)
- [x] `.fence/check` silent Reflexion circuit: every write → `tsc`/lint/tests; green→commit, red→compact trace + "diagnose and fix" + one retry → queue. (03 A-02) + **Tournament Selection** naming + **2-Attempt Circuit Breaker** `src/framework/circuit-breaker.ts` → read-only consultation + `.fence/queue.json`. (*cherry-picks #2/#3*)
- [x] Hard step budget (well before 16) + WIP=1 Kanban (02 D-06) + per-task telemetry (instruction/retrieval/tool/history, loop length). (S-03) — never stack greedily; A/B isolation+combination (CCI).
- [x] Architect→Editor gate: plan artefact `.fence/plans/` before mutations. (02 D-07)
- [x] `src/adapters/{claude,codex,cursor,opencode,hermes}.yml` per-runtime profiles — window/caching/edit-format/model-tier-conditional surface. (C-03) + **prompt-portability gate** eval (Spark/Glimmer/foreign harness). (*GEM-03*)
- [x] `src/framework/byte-capped-pipeline` — per-task PageRank `vibe-map` ≤1k tokens + 4KB caps + last-5 pruning + ACID artefacts. (02 invent)
- [x] `src/config/severity-policy.json` deterministic function `no check→nudge; check+irreversible→block; check+reversible→warn`; `unknown≠pass`. (04 S-11/S-14)
- [x] Teaching dial orthogonal axis — vector `.fence/state/dial.json` + `learning.json` underneath; one global knob UI. (05 S-11) + **state eviction TTL+LRU** 7-day prune (§4). (*GEM-02*)
- [x] **`src/framework/verifier.ts` ephemeral smoke suite** `tests/.fence-smoke.test.ts` for zero-test repos; trust ladder `compile→lint→tests×2→generated-tests→judge-for-prose`. (*GEM-11*)

### M3 — Skill Definitions (`vibe-init`, `vibe-guard`, `vibe-plan`, `vibe-teach`) — *needs M1/M2 primitives + severity policy*

- [x] Progressive-disclosure `SKILL.md` everywhere; discovery `.agents/skills/`+`.claude/skills/`; publish to registries. Lint skill text forbidding ungrounded "review your own work" without tool signal. (S-02/S-08, C-02)
- [x] `vibe-guard` rule records `.fence/rules/<id>.json` `{id, applicability, severity, source, check_adapter, affected_action, evidence_schema, repair_workflow}` + `pass/fail/unknown/not-applicable`; mitigations with evidence+scope+owner+expiry. (04 gpt-6)
- [x] Guardrail packet: dual-layer secrets (`gitleaks` + Push Protection, `warn→block`), `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` shape lint, Zod per-route + `pg $1`/ORM + `semgrep p/owasp-top-ten`, headers+CSP nonce Report-Only→enforce, `setSessionCookie()`/`verifyJWT({RS256})`/PKCE+state, RLS `USING (true)` linter, lockfile+`npm ci`+ empty `onlyBuiltDependencies` allowlist + SBOM/cooldown, privacy inventory→`/privacy`+export/delete+consent gate. (04 M3) + **BILL-01** billable-loop guard + **PRV-09** fixture hygiene. (*GEMS-05/06*)
- [x] `vibe-plan` gated 2-option fork (fast/simple vs scalable/robust), 1 `choice` item/run; `vibe-teach` card `What changed·Why·Your call·How we'll know` with expand on disk. (03, 05)
- [x] Elicitation inside skills: `1→verify→best-of-k` for code; plan synthesis 2–3 candidates + rubric for prose only; every critique carries tool signal. (S-12)
- [x] **Remote RLS verification** `src/framework/verify-remote.ts` — `pg_policies` introspection on `promote public`; `unknown` on offline (never `pass`). (*GEM-04*)
- [x] **Fixture anonymizer** `tools/anonymize.ts` — synthetic PII replacement preserving referential integrity. (*GEM-06*)
- [x] **Billing guard** `src/framework/billing-guard.ts` (P2) `withBudgetCap({maxCalls, maxCostUsd})` wrapper + `.fence/templates/` scaffold. (*GEM-05*)
- [x] `.fence/state/lessons.json` cross-session reflection (eviction+poisoning guard); `.fence/escalate` risk×disagreement routing (≤3× without verifier); `.fence/verifier` trust ladder. + 15-row contradiction table + 10-mode failure taxonomy as `docs/research/` reference. (03 invent, 06 S-16) — *stay out of top-level synthesis; linked here.*
- [x] Queue agent-as-assignee with payload pin (hash+lock) + three-condition gate (`realpath`+diff/blast+competence) + rolling 90%→demote to post-hoc; 15-row contradiction table as living reference. (05 invent)

### M4 — Adapters + Installer (`npx vibe-fence init` + per-runtime wiring) — *needs M1–M3 ship-ready*

- [x] `npx vibe-fence init` idempotent single-command install: drops `AGENTS.md`, `.fence/`, skills, settings blocks, hooks; merges not clobbers; <3s; one-line/file receipt + paved 3-step path; `fence tour` opt-in; artifact-first, teach-after. (S-02, 05 A-09/Q-01)
- [x] Wire Spark 1.3 via `POST /v1/responses` stateless encrypted replay (not `previous_response_id`); Wonder 1.0 swap on same `MODEL_API_KEY` Bearer; `silent`=skip model call (`reasoning_effort:"none"` is 400). (06 S-13/D-02/D-05) + **dual-tier routing table** + pricing caps. (*GEM-08*) + **Standard-mode default** ethics gate. (*GEM-09 P0*)
- [x] Muse Code reference: `AGENTS.md`+`.agents/AGENTS.md`+`MEMORY.md`; trust-gated precedence + read-only `.git/.muse/.agents`; `fence doctor` untrusted-checkout guard. (06 S-14)
- [x] Namespaced `tool_search` guardrail tools; flat queue schema; never `tool_search`+`json_schema` together. (06 minimax)
- [x] Curated `PreToolUse`/`PreToolExecution` hook surface with FP budget; bands by guarantee (user-facing "Turbo" forbidden). (01 D-01/D-02, 05 S-10)
- [x] `fence look` Playwright→Spark verification + append-only `events.ndjson`. (06 deepseek)
- [x] Canary hook proof + version-pinned SDK (malformed-hooks warn without handler; resume/cancellation/denial proven). (06 inv) + Glimmer 30B privacy literal (secrets never in `MEMORY.md`, PII-masked crops, testable "code never leaves machine" on classified path). (06 inv)
- [x] Adversarial fence bench (8–12 tasks: poisoned `AGENTS.md`, README payload, malicious skill, user-asks-bypass) + seeded fixture suite + false-block rate. (02/04) + instruction-file sanitizer + before/after eval + cost-of-pass telemetry. (01 D-04, 03)
- [x] **SAM contract** `src/framework/sam.ts` + `sam-guard.test.ts` `SAM_SINGLE_CONCEPT_VIOLATION`. (*GEM-07*)
- [x] Scope line: **Desktop CLIs v1; WebContainer/mobile out of scope — document explicitly.** (*cherry-pick #4 cont.*)
- [x] **Scope guard:** Desktop CLIs v1; WebContainer/mobile explicitly out of scope (see M1 probe note). Browser runtimes not claimed. (*GEM-02*)

**Re-sequenced 10-day build (Argon §3, Oct 26→Nov 4):** M1 D1–3: `integrity.ts` lock + 10 hard-blocks + `prv-09.ts`/`anonymize.ts`/`bill-01.ts`/`billing-guard.ts`/`git.ts`; M2 D4–5: Spark `/v1/responses` + Wonder `stack-contract.json` + `verify-remote.ts` + Ephemeral Verifier; M3 D6–7: Tier-1 adapters + `adapter-compliance.ts` + ablation + Muse Image OG badge; M4 D8–10: freeze+Adversary Bench (10/10 incl. `chmod -R 777`)+Visceral Delta×submit. See `ARGON-AUDIT-v2.md` §3 + `RECONCILE.md` remaining 8 gaps.

**GEMS→files map:** integrity `src/framework/integrity.ts` (P0, M1) · WebContainer `tools/install.ts` (P1, M1) · eviction `.fence/state/*.json`+`context-budget.yml` (P2, M2) · portability `src/adapters/*.yml` (P1, M2) · remote RLS `src/framework/verify-remote.ts` (P1, M3) · BILL-01 `src/rules/bill-01.ts` (P1, M3) · PRV-09 `src/rules/prv-09.ts`+`tools/anonymize.ts` (P1, M3) · SAM `src/framework/sam.ts` (P1, M4) · Wonder routing `src/framework/meta-client.ts` (P1, M4) · Standard-mode default same file (P0, M4) · Visceral Delta `docs/PLAN.md` §Hackathon + `docs/research/synthesis/DEMO-SCRIPT.md` (P0, M4) · verifier `src/framework/verifier.ts` (P1, M2/M3).

---

## 5. Coverage Caveats — Which Streams Are Thin

| Stream | Contributors | Thin area | How to compensate |
|--------|-------------|-----------|-------------------|
| 01 harnesses | 6/6 strong | Non-Western harnesses absent; Antigravity/Hermes docs speculative; optimal `AGENTS.md` length unmeasured. | Phase 1 eval on hook zoo; JP/CN scan if time. |
| 02 harness→quality | 5/6 — **gpt-6 missing** | No RCT on vibe-coder pop.; hierarchy degradation curve unmeasured; compaction fidelity no standard. | Replicate ETH Zurich protocol on JS/TS greenfield bench with/without fence. |
| 03 elicitation | 5/6 | No matched-cost agent+sampling study; verifier quality on hobby projects unmeasured; model-tier switch unverified. | Private 10-task eval set with $/s/Pass@1; gate Muse Spark tier before locking elicitation. |
| 04 guardrails | 5/6 | File-upload/SSRF/PII-in-prompt lack shippable packets; no FP/FN on agent-written code; fatigue budget unmeasured. | Framework-detection adapter; adversarial fixture corpus; measure blocks/session before disable. |
| 05 companion UX | **4/6 thinnest** — argon+gpt-6 absent | `thin:3/4` rows weaker than `strong`; dial cut-points, gate budgets, queue cadence, "Turbo" label have near-zero empirical anchors. | Treat as hypotheses; 5-person label test; transfer check; instrument card expand/dismiss. |
| 06 meta models | 5/6 — argon missing | No live API calls; Official Rules unpublished; geography/credit/image caps unverified; Glimmer quality unbenchmarked; cross-harness transfer unmeasured. | One keyed smoke test before commit; re-read Rules on arrival; benchmark Glimmer vs Spark. |

**Cross-stream note:** No contributor validated harness components on non-technical greenfield JS/TS. Every "proven" is SWE-bench Python or higher-ed RCTs transferred. Phase 1's primary evidence must be fence-on-vibe-coder-repos, not secondary. (Sources: `_CONSISTENCY.md` §4 B-01–B-08 · `COMPARISON.md` §1 Structural summary · `HTML-REVIEW.md` §2 sandbox audit)

**Blind-spot index:** B-01 no user study on actual pop. (5/6 streams) · B-02 no FP/bypass budget · B-03 optimal rule/skill counts unmeasured · B-04 supply-chain injection at build time (NVIDIA Red Team, only 04 invents gate) · B-05 teaching↔correctness interaction unmeasured (CCI clash) · B-06 latency tolerance unmeasured · B-07 verifier quality on hobby projects (11.3% flaky on curated → worse on hobby) · B-08 vendor classifier precision/recall unpublished.

---

## 6. What Phase 1 Must NOT Do — 14 Rules

1. Do not auto-generate a large narrative `AGENTS.md` — −3%/+23% cost; ship ≤400-token router. (S-01/C-02 · `HTML-REVIEW.md F-09`)
2. Do not ship a backend gateway/proxy or single-runtime rule files as primary safety — client-side hooks + settings blocks are the portable path. (01 A-04/A-05)
3. Do not use "Turbo" in user-facing copy/docs/flags — it normalizes bypass; name bands by guarantee. (S-10 · `_CONSISTENCY C-06` · `HTML-REVIEW.md F-06`)
4. Do not stack scaffold greedily — every addition A/B'd isolation *and* combination; respect CCI cliff. (S-07)
5. Do not treat permission prompts as safety — 93% acceptance / 35% miss; containment+checkpoints first. (S-10, 05 A-06)
6. Do not gate a patch with an LLM judge or merge candidate diffs — execution > typecheck > lint > learned verifier > judge. (S-12)
7. Do not ship ungrounded "review your own work" self-critique, debate, or MoA on interactive path — all degrade at equal budget. Also lint skill text for it. (S-12, `_CONSISTENCY C-02`)
8. Do not let the agent edit/relax its own checks or teaching gate on outcomes — checks in `tools/` outside write-scope; model explains, checker decides. (04 S-11, 06 A-02)
9. Do not rely on system/user role split as security hierarchy — it fails under indirection; treat tool output as untrusted. (02 D-05)
10. Do not default Contributor pricing for private code, ship secrets without allowlist, or ship CSP `block` without Report-Only. (S-15/S-09, 06 D-03 · `INDEPENDENT-GEMS.md GEM-09`)
11. Do not force SAM 3.1 into critical path or quote unverified SAM/Image/country specs — all cost demo credibility. (06 A-04 · `INDEPENDENT-GEMS.md GEM-07` · `HTML-REVIEW.md F-06`)
12. Do not use `reasoning_effort:"none"`, recursive/over-nested JSON Schema, or combine `tool_search`+`json_schema` — all HTTP 400. (06 D-02)
13. Do not treat preview URLs as access control or preview-isolated state as prod-safe — distinct cred planes + value-equality check. (04 S-10/S-14)
14. Do not delete/skip tests to green CI or catch auth failures and continue — both `block` attacks on evidence chain. (04 invent)

---

## 7. Hackathon Appendix — Visceral Delta Demo Script + 5×4 Rubric

*Source: `synthesis-independent/FINAL.md` §5–§6 · `INDEPENDENT-GEMS.md GEM-10` · `COMPARISON.md §2` — attached as verbatim appendix per `COMPARISON.md §4.2`. Primary's eval is the credibility layer underneath; independent's script is the Impact+Demo story. Explorer roadmap rejected as spec (`HTML-REVIEW.md` §3: invents `vibe-fence.config.yaml`, calendar weeks, "Argon" codename).*

### Visceral Delta — 3-Minute Video (80% of judging: Impact 30% + Tooling 25% + Demo 25%)

| Minute | Beat | What's on screen |
|--------|------|------------------|
| **0:00–1:00 — Unfenced Disaster** | Non-technical prompt "add user profiles and a database" to raw agent — no fence. | `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in browser bundle (build output / Sources panel) · missing RLS (`SELECT *` leaks all rows) · unhandled promise crash · raw stack trace. No architecture narration. |
| **1:00–2:00 — The Intervention** | `npx vibe-fence init` live (3s timer). | Receipt: `🛡️ vibe-fence active. Checkpoints enabled. Secrets shielded.` Same prompt re-run → interception banner, git checkpoint logged, Muse Spark 3-bullet plan, **2-Option Teachable Fork** click. |
| **2:00–3:00 — Polish & Ship** | Multi-modal finish. | Muse Image logo → `public/images/` (file appears) · Teachable Turbo silent Reflexion badges · Vercel deploy URL · live app in browser. End card: before/after split-screen. |

Linked in video description + README; rubric is one click away, not in the video. Record day 8–9 per M4 with pre-cached fallback takes for network failure.

### Acceptance Rubric — 5-Step Automated Suite (gates M4 complete)

1. **Idempotence:** `npx vibe-fence init` ×3 in existing repo → zero file churn, identical `git status`.
2. **Secret-leak intercept:** agent committing AWS secret / `NEXT_PUBLIC_SERVICE_ROLE` → hard `block`, exit 1.
3. **Rollback integrity:** `npx vibe-fence undo` → clean revert without detached HEAD.
4. **Token budget:** `tools/validate.ts` asserts `AGENTS.md` ≤400 tokens and no skill >250 lines.
5. **Meta Model Responses flow:** `src/framework/meta-client.ts` stateless encrypted replay `POST /v1/responses` with `muse-spark-1.3` succeeds.

### 5 Tasks × 4-Rubric Eval Table (deterministic rows + one model-graded row)

| Task / Rubric | Structure | Secrets | Git | Deploy |
|---------------|-----------|---------|-----|--------|
| `auth` | scaffold + routes exist | `NEXT_PUBLIC_` lint | checkpoint + no-detached-HEAD | headers/CSP present |
| `paid API` | BILL-01 guard present | no key in bundle | — | rate-limit/config present |
| `bug fix` | verifier ladder green | — | `undo` works | fix shipped |
| `ship-to-prod` | build gate | Report-Only→enforce trace | rollback test | live URL + env isolation |
| `add-dep` | lockfile parity + SBOM | `onlyBuiltDependencies` | — | cooldown check |

Report **success *and* unsafe-action rate** per task; gate releases on the latter (ClawsBench: capability and safety uncorrelated).

---

## 8. Traceability — Where Every v2 Row Points

| v2 section | Primary | Cross-stream audit | Replication | Companion |
|------------|---------|-------------------|-------------|-----------|
| Header / scope | `FINAL.md:3` | `_CONSISTENCY.md §2–§5` (134→103, C-01–C-10, B-01–B-08) | `COMPARISON.md §0` replication honesty note; `synthesis-independent/FINAL.md:3` 6 contributors | `HTML-REVIEW.md §1–§4` companion not spec |
| §1 Executive Summary | `FINAL.md §1` | `_CONSISTENCY.md C-01–C-10` resolved | `COMPARISON.md §2` common core | `HTML-REVIEW.md` H-01–H-08 corrected (no 95%/Zero/18k/65%/14% hallucinations) |
| §2 S-01..S-15 | `FINAL.md §2` S-01..S-14 verbatim | `_CONSISTENCY.md §2` per-S verdict + §5.1 escalations | `COMPARISON.md §1–§2` per-stream verdicts + S-09 moat note + `§4.1–§4.4` keep/cherry-pick | `HTML-REVIEW.md §1, F-08–F-13` token-norm, badge fixes |
| §3 C-01..C-10 + sub-rows | `FINAL.md §3` C-01..C-10 | `_CONSISTENCY.md §2, §5.2` B-07→C-10 addition | `COMPARISON.md §2` independent C-02–C-04 as sub-rows, not tops | `HTML-REVIEW.md` F-02/F-09 greenfield caveat |
| §4 M1..M4 actions | `FINAL.md §4` M1..M4 spine | `_CONSISTENCY.md §3` 103 dedup ledger + canonical IDs | `COMPARISON.md §2` milestone philosophy + `§4.1 keep / §4.2 cherry-pick` + `§3.3` desync probe + `§4 Traceability matrix` | `HTML-REVIEW.md §3` roadmap rejected + `§5 F-06` replace, F-13–F-17 hygiene |
| §5 Coverage Caveats | `FINAL.md §5` caveats + caveats note | `_CONSISTENCY.md §4` B-01..B-08 taxonomy | `COMPARISON.md §1` per-stream coverage + thinned-stream disclaimer honesty | `HTML-REVIEW.md §2` simulators as comprehension-check prototype |
| §6 Must NOT Do | `FINAL.md §6` 14 rules verbatim | `_CONSISTENCY.md C-02` lint rule + `C-06` naming verdict | `COMPARISON.md §4.1` keep verbatim (confirmed) | `HTML-REVIEW.md §4` F-06 Turbo ban |
| §7 Hackathon | `FINAL.md S-14` eval table | `_CONSISTENCY.md §3` G-BENCH canonical bench | `synthesis-independent/FINAL.md §5–§6` + `COMPARISON.md §4.2` appendix + `INDEPENDENT-GEMS.md GEM-10` Visceral Delta | `HTML-REVIEW.md §2–§3` demo-is-eval + rubric, roadmap not spec |
| §8 Traceability | — | — | `COMPARISON.md §5` full v2 traceability matrix (expanded) | `HTML-REVIEW.md §5` 17 fixes mapped to FINAL per fix |

*Sources (audit provenance): `01-harnesses.md` through `06-meta-models.md` in both `synthesis/` and `synthesis-independent/` · `_CONSISTENCY.md` · `COMPARISON.md` · `INDEPENDENT-GEMS.md` · `HTML-REVIEW.md` · `docs/PLAN.md` · `docs/research/INDEX.md`. No per-stream file modified. Line count: this file.*

---

*Written: 2026-10-20 v3 — Argon amendments (S-06a/S-08/S-09/S-11/C-01/C-06 + 10-day re-sequence) applied from `ARGON-AUDIT-v2.md` §6. Locked; further amendments require PR tracing to Argon lines. Prior: v2 2026-10-20 (15→16 settled with S-06a). Supersedes v2 which superseded FINAL.*
