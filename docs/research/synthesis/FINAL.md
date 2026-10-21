# FINAL — Cross-Stream Synthesis for Phase 1

> **Read this first.** 6 streams · ~226 KB · ~165 sources · 2026-10-20. Per-stream syntheses in `docs/research/synthesis/0{1..6}-*.md`. Cross-stream audit in `_CONSISTENCY.md` (134→103 dedup, 10 contradictions, 8 blind spots). Do not modify the 6 per-stream files.

---

## 1. Executive Summary — What Phase 0 Proved

Phase 0 proved that a portable, client-side harness can capture nearly all measured benefit from LLM scaffolding without the failure modes of existing harnesses: a **minimal always-on router (≤400 tokens)** + selective disclosure, **deterministic pre-execution checks** (not prompt prose), **mechanical verify-before-done**, and **bounded context/step budgets** are settled and load-bearing; bloated `AGENTS.md` files, stacked scaffold components, ungrounded self-critique, multi-agent debate, and prompt-only guardrails are measured net-negative and must not ship. The safety story must be structural — filesystem containment + credential hard-deny + git checkpoint before every fix — not permission prompts (93% acceptance, ~35% miss on exfiltration/scope). Teaching and autonomy are orthogonal axes: a per-domain scaffolding-fade dial and a consequence-keyed turbo budget. Muse Spark 1.3 is the companion voice (everyday teaching/triage) with Muse Wonder 1.0 as the plan/verify escalation tier on the same API; Image is cheap demo polish, SAM stays out of the critical path. The demo *is* the eval: 5 tasks × rubric, same prompt with vs without fence.

---

## 2. Settled Decisions — Phase 1 Can Treat as Closed

These hold across ≥3 contributors with independent replication. Build on them without re-debating.

| # | Decision | Source streams |
|---|----------|----------------|
| S-01 | `AGENTS.md`/`CLAUDE.md` is a ≤400-token map/router only (`≈100 lines` prose approximation — S-01 subsumes per-stream 200-line variants). Full docs live in `docs/fence/INDEX.md` + per-page `description-agent` frontmatter. One-fact-one-location: `src/` editable → `dist/` disposable → `.fence/` single-owner state. Linter enforces budget. | 01 D-03, 02 A-03/A-05/A-08, 03 #7 · `CONSISTENCY C-03` |
| S-02 | Progressive disclosure is the context primitive: name+description at startup, full body on match. Skills under `.agents/skills/` + `.claude/skills/`. | 01 A-03, 02 A-03 |
| S-03 | Context is a budget, not a buffer. Hard caps in `src/framework/context-budget.yml`; byte-cap shell outputs at 4 KB; metadata-only skill exposure; keep invariants at context boundaries; re-anchor after compaction. | 02 A-02, 05 A-04 |
| S-04 | Verification is mechanical, never self-assessment. `Read→Think→Write→Check`; executable validators gate "done"; diagnosis artefact before retry. | 02 A-04, 03 A-02 |
| S-05 | Deterministic fence decides; model explains. Every `block` has a command that returns a verdict; no deterministic check → never a block. Model output is `{finding_id, explanation, question, options, evidence_ids}` validated app-side. Secret/privilege/credential path never mintable by model. | 02 A-07, 04 A-17, 06 A-02 |
| S-06 | Instruction files are an attack surface. `AGENTS.md`/SKILL.md treated as untrusted on init and on dependency pulls; validate, hash-attest (`fence validate`), reject contradictory tiers and invisible-Unicode. | 01 D-04, 02 A-07 |
| S-07 | Small rule sets dominate. p^n joint reliability: ~2 rules at 95%, ~3 at 90%, ~5 at 80%. Teaching dial is a rule-count dial. Never stack scaffold greedily — CCI factorial: all-in 5-component beaten by proper subset in every condition. | 02 A-08, 05 gaps |
| S-08 | OWASP Top 10:2025 (not 2021) + LLM Top 10 2026 are the guardrail frame. Supply-chain, exception-mishandling, and agent-identity rules (MCP pin, slopsquat, LLM-output sanitization, least-agency identity, PII redaction) are non-optional. | 04 D-01/D-02, 04 S-16 unique |
| S-09 | Severity is a policy derived from declared intent. `.fence/app-profile.json` (`local`/`shared`/`public`) derives every rule's `block/warn/nudge`; AI-specific rules are `block` even at `local`. CSP ships Report-Only first; secrets lint ships `warn→block` after allowlist. | 04 D-07, 04 A-06, 04 D-06 |
| S-10 | Turbo safety is containment + reversibility + batched review, not prompts. Three-tier `auto/notify/gate` keyed to consequence×reversibility×session-coupling; project-root `realpath` boundary + credential hard-deny + egress allowlist + git checkpoint + `fence undo`. ≤3 gates/session; gate requires resolved target + diff/blast + competent decision. `minimal` is not aesthetic — most hooks are theater, so FP budget defines surface (§_CONSISTENCY C-01). Lint skill text for ungrounded self-critique phrases (\"review your own work\" without tool signal — §_CONSISTENCY C-02). | 05 A-06/A-07/Q-04, 01 D-01/D-02, 02 D-04 |
| S-11 | Teaching dial is scaffolding fade (`max→medium→min→silent`), per-domain vector stored as `.fence/state/dial.json` even if v1 UI shows one global knob. Fixed-schema card (`What changed · Why · Your call · How we'll know`) with expand; teaching lives on disk (`.fence/learn/*.md`), pointer only in context; delivered at checkpoint boundaries, never mid-task. | 05 A-01/A-03/A-05, 02 D-04 |
| S-12 | Elicitation: `1 sample → cheapest verify → on failure parallel best-of-k (k≤5) → first pass wins`. Happy-path ~1.0–1.2×. Ungrounded self-critique, debate, MoA-on-interactive, best-of-N against a judge, and patch-merging are net-negative at equal budget. | 03 A-01/A-02/A-06/A-08/A-09 |
| S-13 | Muse Spark 1.3 via `POST /v1/responses` stateless encrypted replay is the companion voice; Muse Wonder 1.0 is the plan/verify escalation tier. Image at $0.01/image for OG/demo assets. SAM (one concept/request, geometry not semantics) stays out of critical path; if shipped, click-to-teach only. Muse Code's `AGENTS.md` chain is the wire format; reference adapter is file-writing. | 06 A-01/A-04/A-05/A-08/D-01/D-02 |
| S-14 | Before/after + eval table is the demo. 5 tasks (`auth`, paid API, bug fix, ship-to-prod, add-dep) × rubric (structure/secrets/git/deploy) with deterministic rows + one model-graded row. Report success *and* unsafe-action rate; gate releases on the latter. | 06 A-06, 02 invent #2–3 |

---

## 3. Contested — Phase 1 Must Carry as Risks/Evals

Unresolved or thinly replicated. Do not hard-code; instrument and A/B.

| # | Question | Readings | Phase 1 carry |
|---|----------|----------|---------------|
| C-01 | Hook surface: how many, which hooks, what false-positive budget before bypass? nomos-class 7/8+0/4 vs "hooks are weak" vs lifecycle hooks as boundary. | 01 D-01 | Ship minimal `PreToolUse`/`PreToolExecution` set; instrument bypass-reason; A/B hook strictness; budget tracked. |
| C-02 | Generated `AGENTS.md` value. ETH Zurich null/negative (−3%/+23% cost) on well-documented Python repos vs helpful on undocumented repos — does null transfer to greenfield JS/TS vibe-coder repos (the target population)? | 02 D-01 | Do not auto-generate large `AGENTS.md`. Ship minimal router + PageRank map (≤1k tokens, per-task). Replicate Agentbench protocol on JS/TS greenfield bench. |
| C-03 | ACI richness by model tier. Rich filtered tools (4× SWE-bench) vs `mini-swe-agent` 100-line bash-only >74% on frontier. Same fence, different tier? | 02 D-02, 06 gaps | Per-runtime adapter profiles with model-tier-conditional surface (thin bash for frontier, richer for weak). Re-validate as models improve. |
| C-04 | `max` pedagogy: explain-loudly vs hint-first vs structured-forcing. Bastani/Buçinca transfer to coding is `contested`. | 05 D-01 | Minimax schema as container + deepseek hint-first inside `max` block; one forced choice only at trade-off decisions. Transfer check: can user fix similar issue unassisted? |
| C-05 | Dial visibility + fade trigger. Visible `max` default vs invisible tracker; "N=5 verified fixes" / "3 clean sessions" are invented constants. | 05 D-02, 05 gaps | Ship state file as vector architecture; expose single global knob. Auto-degrade as opt-in flag (`--budgeted-teaching`), not default. Sweep gate budgets 1→5 in eval. |
| C-06 | Turbo classifier vs deterministic. Vendors use classifiers; none publish precision/recall; Cursor concedes best-effort. | 05 D-03, 05 gaps | Deterministic containment for v1. Classifier behind feature flag in Phase 2, measured against gate-budget + findings-without-asking. |
| C-07 | Dependency severity: raw `npm audit --audit-level=high` block vs reachability-checked mitigation records. | 04 D-04 | Ship raw audit as CI block (starter gate); document escalation to applicability-checked triage with expiry/invalidation on dep changes. |
| C-08 | Muse Spark cross-harness transfer. Co-trained on Muse Code; foreign-harness quality unmeasured. | 06 open Q | Same task × ≥2 runtimes, one model, pass rate per runtime before claiming "any agent." |
| C-09 | Glimmer 30B local vs Spark 1.3 on classification tasks; real cost per verified fix under actual request shapes. | 06 gaps | Benchmark 24-case eval on Glimmer vs Spark; instrument $/task at Standard pricing. |
| C-10 | Can LLM-generated smoke tests on testless hobby repos be trusted as a block gate, or do they false-pass? 11.3% flaky on curated suites; worse regime unmeasured. | 03 D-07, 04 gaps, _CONSISTENCY B-07 | Ship trust ladder with `run×2` flake check (03-I1) as default; measure false-pass on the private vibe-coder bench before promoting generated tests to `block`. |

---

## 4. Actions Grouped by Milestone

Deduplicated across streams; each maps to concrete artefacts. Cite (§stream) for traceability.

### M1 — Project skeleton (`git init`, `src/`, `tools/`, `docs/clief/`, `dist/` wiring)

- **Copy:** `src/` is sole editable authority → `dist/` disposable; `tools/{generate,validate,install}.ts` enforce `src→dist` parity + context budget + freshness (`fence validate` / `fence sync`). One-fact-one-location. (§01, §02 S-01/S-14)
- **Copy:** `docs/fence/INDEX.md` machine-readable router + per-page `description-agent` frontmatter; PR-gated parity checks + doc-gardening receipt (`docs-updated`/`no-docs-needed`/`blocked`). (§02 unique muse-spark)
- **Copy:** `.fence/` single-owner state tree; queue, dial, lessons, verdicts, budgets owned by harness, not agent. (§02 S-03, §05 Q-01)
- **Invent:** App-profile at init — `.fence/app-profile.json` (`local`/`shared`/`public`) deriving all severities; 14 unconditional `block` at `local` (AI-specific + `NEXT_PUBLIC_` + lifecycle + lockfile), +15 at `shared`, +26 at `public`. (§04 D-07/S-09)
- **Invent:** Trusted-channel hardening in scaffold — integrity attestation (hash) of fence-owned files, same-session `AGENTS.md` overwrite refusal, invisible-Unicode scan, `<untrusted-content>` envelope for fetched content, `tools/` outside agent write-scope. (§01 D-04, §02 S-06, §04 unique minimax)

### M2 — Framework primitives (teaching dial, turbo, queue, state files)

- **Copy:** `AGENTS.md` ≤400 tokens (tool commands + hard invariants + pointers); assert in `tools/validate.ts`; error if exceeded. Cross-validates 6 streams. (S-01)
- **Copy:** Context budget `src/framework/context-budget.yml` — caps for static/dynamic/history/headroom; MCP as code APIs; metadata-only skills (L1/L2/L3); byte caps `head -c 4000`. (S-03/S-08)
- **Copy:** `.fence/check` silent Reflexion circuit: after every write run `tsc`/lint/tests; green→commit, red→inject compact trace + "diagnose and fix" + one retry, then queue. (§03 A-02, §01 unique argon)
- **Copy:** Hard step budget per task (well before 16 steps); sequential WIP=1 Kanban (`not_started→active→passing/blocked`); decompose long tasks. (§02 D-06)
- **Copy:** Gate-before-edits — Architect→Editor: plan artefact in `.fence/plans/` before file mutations. (§02 D-07)
- **Copy:** 2-strikes circuit-breaker → read-only consultation mode + `.fence/queue.json`; per-task telemetry (instruction/retrieval/tool/history, loop length). (§02 A-04, §02 D-06)
- **Avoid:** Stacking scaffold greedily; every addition A/B'd in isolation *and* combination. (§02 D-04/A-08 CCI)
- **Invent:** Per-runtime adapter profiles `src/adapters/{claude,codex,cursor,opencode,hermes}.yml` — window, caching, edit format, static-vs-dynamic tool policy, model-tier-conditional surface. (S-03, C-03)
- **Invent:** Byte-capped + graph-ranked context pipeline — per-task PageRank `vibe-map` (≤1k tokens) + 4 KB caps + last-5 pruning + ACID artefacts (`progress.md`/`DECISIONS.md`/`spec`). (§02 invent)
- **Invent:** Deterministic severity function `src/config/severity-policy.json` — `no check→nudge; check+irreversible→block; check+reversible→warn`; `unknown ≠ pass`. (§04 S-11/S-14)

### M3 — Skill definitions (`vibe-init`, `vibe-guard`, `vibe-plan`, `vibe-teach`)

- **Copy:** All skills use SKILL.md progressive disclosure; discovery via `.agents/skills/` + `.claude/skills/`. Publish to skills.sh/registries. (S-02/S-08, §01 A-06) — lint skill text to forbid ungrounded "review your own work" phrasing unless accompanied by a tool signal (C-02).
- **Copy:** `vibe-guard` = executable rule records `.fence/rules/<id>.json` `{id, applicability, severity, source, check_adapter, affected_action, evidence_schema, repair_workflow}` with `pass/fail/unknown/not-applicable`; mitigations carry evidence+scope+owner+expiry. (§04 unique gpt-6)
- **Copy:** Ship priority guardrails with copy-ready packets: dual-layer secrets (gitleaks pre-commit + Push Protection, `warn→block` after allowlist), `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` shape lint, Zod per-route + `pg $1`/ORM + `semgrep p/owasp-top-ten`/`p/react`, headers+CSP nonce middleware (Report-Only→enforce), `setSessionCookie()`/`verifyJWT({RS256})`/OAuth PKCE+state, RLS policy linter rejecting `USING (true)`, lockfile+`npm ci`+ lifecycle-script empty allowlist + SBOM/cooldown, privacy inventory→`/privacy`+`/api/me/{export,delete}`+ consent gate. (§04 M3 expanded)
- **Copy:** `vibe-plan` gated 2-option teachable fork (fast/simple vs scalable/robust) — cap 1 `choice` queue item per run; `vibe-teach` structured card `What changed·Why·Your call·How we'll know` with expand, teaching on disk + pointer to window. (§03, §05)
- **Copy:** Elicitation inside skills: `1→verify→conditional best-of-k` for code; plan synthesis (2–3 candidates + rubric) scoped to planning prose only; every critique carries tool signal. (S-12)
- **Avoid:** Prose-as-guardrail; agent relaxing its own checks; blocking solo dev on Conventional Commits/PR mandates; CSP/secrets without allowlists; collecting before consent. (§04 M3 Avoid)
- **Avoid:** Prompt-only safety, system/user hierarchy as primary safety, negative-constraint bloat, raw shell without caps on weak tiers, unbounded retry loops. (§02 Avoid)
- **Avoid:** Ungrounded "review your own work"; LLM judge gating correctness; string-vote on code; debate/MoA on interactive path; merging candidate patches; surfacing raw logs. (§03 Avoid)
- **Invent:** `.fence/state/lessons.json` cross-session reflection memory keyed by `project+error_signature` with eviction + poisoning guard; `.fence/escalate` difficulty-gated `risk_tag × disagreement` routing (never >3× without verifier); `.fence/verifier` trust ladder `compile→lint→tests×2→generated-tests→judge-for-prose`. (§03 invent)
- **Invent:** Teaching dial as decoupled orthogonal axis — dial controls learning, turbo controls autonomy; one global knob stepping all domains together in v1, vector `.fence/state/dial.json` + `.fence/state/learning.json` underneath. (§05 D-02/S-11)
- **Invent:** Agent-as-assignee queue with payload pin (hash+lock) + three-condition gate test (`realpath` target + diff/blast + competence) + gate-budget self-awareness (rolling 90%→demote to post-hoc); agent owns work, user approves. (§05 invent)
- **Invent:** 15-row contradiction table + failure-mode taxonomy (10 modes) as living `docs/research/` reference for implementers. (§02 unique muse-spark, §06 S-16)

### M4 — Adapters + installer (`npx vibe-fence init` + per-runtime wiring)

- **Copy:** `npx vibe-fence init` idempotent single-command install: drops `AGENTS.md`, `.fence/`, skills, settings blocks, hooks; merges (never clobbers); `<3s`; prints one-line-per-file receipt + paved 3-step path; `fence tour` opt-in; artifact-first, teach-after. (S-02, §05 A-09/Q-01)
- **Copy:** Wire Spark 1.3 via `POST /v1/responses` stateless encrypted replay (not `previous_response_id`); Wonder 1.0 swap for plan/verify on same `MODEL_API_KEY` Bearer base URL; `silent`=skip model call (routing through Glimmer classifier or bypass — `reasoning_effort: "none"` is 400). (§06 S-13/D-02/D-05)
- **Copy:** Muse Code adapter is reference: writes `AGENTS.md` + `.agents/AGENTS.md` overrides + `.agents/memory/MEMORY.md`; honours trust-gated precedence (project-over-user, deeper-over-shallower) + read-only `.git/.muse/.agents`; `fence doctor` checks untrusted checkout. (§06 A-08 S-14)
- **Copy:** Namespace guardrail tools for `tool_search`; flatten queue schema (no recursive JSON Schema); never combine `tool_search`+`json_schema` on one request. (§06 unique minimax)
- **Copy:** Minimal curated hook surface `PreToolUse`/`PreToolExecution` with measured false-positive budget; blocklist-hold naming by guarantee (e.g. `guarded→assisted→autonomous→open`), internal "turbo" okay, user-facing "Turbo" forbidden. (§01 D-01/D-02, §05 A-08/S-10)
- **Copy:** `fence look` visual verification (Playwright→Spark) as signature non-technical demo; append-only `events.ndjson` as canonical state. (§06 unique deepseek)
- **Invent:** Canary-enforced hook proof + version-pinned SDK contract — on install, harmless canary denial proves hooks loaded (malformed hooks warn without handler); binary/SDK/protocol pinned; resume/cancellation/denial proven. (§06 inventions)
- **Invent:** End-to-end privacy literal — Glimmer 30B local for sensitive classification (no API call), Standard+stateless for user-code paths, secrets never in `MEMORY.md`, PII-masked crops; testable "code never leaves machine" on classified path. (§06 inventions)
- **Invent:** Adversarial fence bench — 8–12 tasks measuring the fence's own attack surface (poisoned `AGENTS.md` in dep, README skip-fence payload, malicious skill, user-asks-to-bypass); plus seeded fixture suite validating guardrails + false-block rate. (§02 invent, §04 inventions)
- **Invent:** Instruction-file sanitizer + before/after eval table + cost-of-pass telemetry (gate count, rolling approval, findings-without-asking, undo usage, $/task at Standard). (§01 D-04, §03 invent)

---

## 5. Coverage Caveats — Which Streams/Models Are Thin

| Stream | Contributors | Thin area | How to compensate |
|--------|-------------|-----------|-------------------|
| 01 harnesses | 6/6 (strongest) | Non-Western harnesses absent; Antigravity/Hermes docs speculative; optimal `AGENTS.md` length unmeasured. | Phase 1 eval on hook zoo; JP/CN harness scan if time. |
| 02 harness→quality | 5/6 — **gpt-6 missing** | No RCT on vibe-coder population; hierarchy degradation curve unmeasured; compaction fidelity no standard. | Replicate ETH Zurich protocol on JS/TS greenfield bench with/without fence. |
| 03 elicitation | 5/6 | No matched-cost "agent+sampling" study; verifier quality on hobby projects unmeasured; model-tier switch unverified. | Private 10-task eval set with cost-of-pass ($ + s + Pass@1); determine Muse Spark tier before locking elicitation. |
| 04 guardrails | 5/6 | File-upload + SSRF + PII-in-prompt lack shippable enforcement packets; no false-pos/neg rates on agent-written code; fatigue budget unmeasured. | Framework-detection adapter; adversarial fixture corpus; measure blocks/session before disable. |
| 05 companion UX | **4/6 — thinnest** | argon + gpt-6 absent (education primary sources + WCAG + inference-cost gaps). `thin:3/4` rows are weaker than `strong` in full streams; dial cut-points, gate budgets, queue cadence, "Turbo" label all have near-zero empirical anchors. | Treat `thin:3/4` as hypotheses; 5-person label test; transfer check (fix similar issue unassisted); instrument card expand/dismiss. |
| 06 Meta models | 5/6 — argon missing | No live API calls; Official Rules unpublished; geography/credit/image caps unverified; Glimmer quality un-benchmarked; cross-harness Spark transfer unmeasured. | One keyed smoke test before commit; re-read Rules on arrival; benchmark Glimmer vs Spark 1.3. |

**Cross-stream note:** No contributor validated harness components on non-technical greenfield JS/TS. Every "proven" is SWE-bench Python or higher-ed RCTs transferred. Phase 2 must report fence-on-vibe-coder-repos as primary, not secondary, evidence.

---

## 6. What Phase 1 Must NOT Do

1. Do not auto-generate a large narrative `AGENTS.md` — measured −3%/+23% cost; ship ≤400-token router. (S-01/C-02)
2. Do not ship a backend gateway/proxy or single-runtime rule files as primary safety — client-side hooks + settings blocks are the portable path. (§01 A-04/A-05)
3. Do not name the bypass level "Turbo" in user-facing copy, docs, or flags — it normalizes bypass; name bands by guarantee. (S-10)
4. Do not stack scaffold components greedily — every addition must be A/B'd in isolation *and* combination; respect the CCI cliff. (S-07)
5. Do not treat permission prompts as the safety story — raw-prompt safety is theatre at 93% acceptance/35% miss; containment + checkpoints come first. (S-10, §05 A-06)
6. Do not gate a patch with an LLM judge or merge candidate diffs into an unvalidated hybrid — execution > typecheck > lint > learned verifier > judge. (S-12)
7. Do not ship ungrounded "review your own work" self-critique, multi-agent debate, or MoA on the interactive path — all degrade at equal budget. (S-12)
8. Do not let the agent edit/relax its own checks or the teaching level gate block outcomes — checks live in `tools/` outside agent write-scope; model explains, checker decides. (§04 S-11, §06 A-02)
9. Do not rely on the system/user role split as a security hierarchy — it fails under indirection and societal framings; treat tool output as untrusted. (§02 D-05)
10. Do not default Contributor pricing for private code, ship secrets without an allowlist, or ship CSP `block` without Report-Only — all are over-blocking or silent-training-data traps. (S-09, §06 D-03)
11. Do not force SAM 3.1 into the critical path or quote unverified SAM throughput / Image pixel-cap / country-list specs — all cost demo credibility. (§06 A-04/S-14)
12. Do not use `reasoning_effort: "none"`, recursive/over-nested JSON Schema, or combine `tool_search` + `json_schema` on one request — all are HTTP 400. (§06 D-02/S-13)
13. Do not treat preview URLs as access control or preview-isolated state as prod-safe — distinct cred planes + value-equality check required. (§04 S-10/S-14)
14. Do not delete/skip tests to green CI or catch auth failures and continue — both are `block` attacks on the evidence chain. (§04 invent)

---

*Source streams: `01-harnesses.md` · `02-harness-influence.md` · `03-elicitation.md` · `04-guardrails.md` · `05-companion-ux.md` · `06-meta-models.md` · `_CONSISTENCY.md` (10 contradictions, 134→103 dedup) · `docs/PLAN.md` · `docs/research/INDEX.md`.*
