# Cross-Stream Consistency Report — Phase 0 Synthesis Audit

- **Written:** 2026-10-20
- **Auditor:** cross-stream validation (all 6 synthesis files read)
- **Inputs:** `01-harnesses.md` (6 contributors) · `02-harness-influence.md` (5) · `03-elicitation.md` (5) · `04-guardrails.md` (5) · `05-companion-ux.md` (4) · `06-meta-models.md` (5) — total 1549 lines
- **Constraint:** None of the 6 synthesis files was modified. `FINAL.md` was not written.

---

## 1. How to read this report

- §2 is the **contradictions table** — every candidate contradiction was traced to the sentence level and given one of three verdicts: `resolved` (streams compatible once disambiguated), `flagged` (genuine divergence needing a decision or experiment), `no contradiction` (different domains, not comparable).
- §3 is the **deduplication ledger** — every action in §6 of all 6 files was enumerated (134 raw), grouped into canonical deliverables, and counted.
- §4 collects **collective blind spots** — gaps named in ≥2 streams or absent everywhere when they should have been present.
- §5 is **what escalates to FINAL.md** — the subset of §2–§4 that changes a build decision or introduces measurable risk.

---

## 2. Contradictions table

| # | Claim A (stream) | Claim B (stream) | Verdict | Resolution / carry |
|---|-------------------|-------------------|---------|---------------------|
| C-01 | **Hooks are weak/theater:** 6 of 12 hooks stopped 0/8 risky actions; prompts alone did the work; false positives on ordinary tasks push users to `--dangerously-skip-permissions`. (01 D-01 Reading A — minimax 12×12 eval) | **Hooks are load-bearing:** `PreToolUse`/`SessionStart` lifecycle hooks + settings blocks (31 ms p95, 4 KB cap → ~50% token cut) are the correct deterministic enforcement layer. (01 D-01 Reading B — argon + muse-spark; 02 throughout — `hooks/sandbox/gateway` as complement to hierarchy) | **Resolved — compatible.** The 01 synthesis already resolves this: *pattern right, most implementations weak*. 02 never claims every hook works; it claims hierarchy alone is insufficient and *some* structural enforcement is required. Both prescribe the same remedy: ship the smallest curated hook surface with a measured false-positive budget (nomos-class 7/8 · 0/4), not a hook zoo, plus bypass-reason telemetry. | **Escalate to FINAL.md** as settled (not contested): `Enforce via minimal curated hooks — most implementations are weak, so scope is the product decision` (S-05/S-10 in FINAL.md already capture this). Unresolved sub-question — exact FP rate users tolerate before bypass — stays in contested/evals. |
| C-02 | **Internal critique hurts:** ungrounded self-critique degrades accuracy (GSM8K 95.5%→89.0%; CommonSenseQA 75.8%→41.8% — Huang arXiv:2310.01798); near-unanimous rejection of Self-Refine on the interactive path; no general-task self-correction with LLM feedback demonstrated except on exceptionally suited tasks. (03 A-01 + D-04; 02 A-04 — Reflexion requires execution grounding) | **Teaching dial needs internal critique:** `max` includes retrieval prompts ("why did we reject empty strings?"), scaffolding-fade pedagogy, and reflection moments directed at the user. (05 D-01 Readings A–C; 05 A-01 scaffolding fade) | **No contradiction — different agents of critique.** 03 forbids the *model* critiquing *its own* output without a tool signal or rubric ("review your own work and fix bugs"). 05 proposes the *harness* prompting the *user* to retrieve/explain a decision the harness already made deterministically. The surface phrasing is similar; the mechanism is disjoint. The narrow caveat where they touch — `max` must not be allowed to inject "review your own work" into SKILL.md skill text for code generation — is already enforced by 03 Avoid #1: lint skill text for ungrounded self-critique phrases. 05's own Avoid #6 forbids lecture-only/max-quiz mandates, consistent with avoiding harm. | **Escalate** the lint rule: *Skill text must never contain ungrounded self-critique prompts; the teaching dial's retrieval prompt targets the user and must carry an accompanying executable check on the code path.* No product contradiction. |
| C-03 | **`AGENTS.md` budget numbers differ:** 01 prescribes ~100 lines + docs-as-record + one-fact/one-location (also notes 300–500 line ceiling where models ignore constraints). | 02 prescribes ≤400 tokens (~100–200 lines depending on density) containing only tool commands + hard invariants + router; linter asserts budget. 03 independently prescribes 60–200 line routing table (not an encyclopedia) and forbids monolithic instruction dumps. | **Resolved — compatible; needs a single canonical number.** All three prescribe the same direction (minimal router, heavy content behind progressive disclosure) and compatible magnitudes (100 lines ≈ 350–450 tokens at typical prose density). The discrepancy is editorial, not empirical. | **Escalate to FINAL.md** as one settled rule: `AGENTS.md ≤400 tokens` (the strictest, also checkable in `tools/validate.ts`), with 100 lines as the prose-line approximation for reviewer ergonomics. Treat any §6 line mentioning 200 lines as subsumed. |
| C-04 | **Generated `AGENTS.md` is net-negative:** first rigorous eval (Gloaguen et al. arXiv:2602.11988, n=138 AGENTbench + 300 SWE-bench Lite) — LLM-generated context files −3% resolution / +23% cost; developer-written +4%; stronger generator not better. (02 D-01, the measured finding) | **Map-not-manual is beneficial:** Codex 1.5K PRs / 1M lines cited as proof that a disciplined `AGENTS.md` + docs-as-record helps; muse-spark's one-canonical-owner + PR-gated parity pattern. (01 D-03 — muse-spark side) | **Resolved — compatible; both already resolve this way.** 02's resolution explicitly adopts the measured null as default and reframes the product as a *minimal routing file* (≤400 tokens) + dynamic PageRank map (≤1k tokens, per-task refresh), not an auto-generated overview. 01's resolution is "map-not-manual ~100 lines + one-fact/one-location" — same position. | **Escalate** the measured null: *Do not ship auto-generation of a large narrative AGENTS.md; if generated at all, generate minimally and A/B it; ship the ranked map as the dynamic complement.* Leave the JS/TS greenfield transfer question (02's open question) in contested. |
| C-05 | **Turbo = deterministic containment:** project-root boundary (`realpath`), credential hard-deny, egress allowlist, git checkpoint + `fence undo`; gate allowed only with resolved target + diff/blast + competent decision; ≤3 gates/session. (05 A-06/A-07, 01 D-02 Factory four-band dial with blocklist surviving highest autonomy, 02 Avoid un-gated turbo) | **Turbo = classifier-in-the-loop:** vendors converged on classifier-in-the-loop (Claude Code Sonnet 4.6 transcript classifier, Cursor/Codex); turbo = replace human with classifier for reliably classifiable action classes; never blanket confirm/skip. (05 D-03 Reading C — minimax) — plus 04's lifecycle-stage severity model that also shifts what turbo means at `local`/`shared`/`public` | **Flagged — genuine divergence on Phase 1 mechanism.** The deterministic-containment position is *checkable and shippable*; the classifier-in-the-loop position has no published precision/recall (Cursor concedes best-effort; 05 gap #6 explicitly flags this as absent) and 02's CCI factorial warns that stacking components without isolation+combination A/B produces sign-flipping interference. | **Escalate to FINAL.md** as a Phase 1 decision + contested eval: *Deterministic containment for v1; classifier behind a feature flag in Phase 2, measured against the same gate-budget + findings-without-asking metric.* FINAL.md's S-10/C-06 already adopt this split — validated. |
| C-06 | **Turbo label forbidden:** never name the bypass level "Turbo" in user-facing copy/docs/flags; it normalizes bypass. Factory Droid ships four-band dial + blocklist surviving `--skip-permissions-unsafe`; Antigravity's "Turbo" (sandbox off + full filesystem) is the cautionary example. (01 D-02, 02 Avoid #7) | **Turbo as a marketed feature:** gemini (05) proposes "Teachable Turbo" as an `AGENTS.md` contract; 05's 30 hits show the label is central to several contributors' framing. | **Resolved — 01's reasoning is unrefuted.** 01 cites shipped products where "turbo" already means full bypass; 05's own gap #4 notes no usability data exists for label wording on non-technical users. | **Escalate** as settled: *User-facing bands named by guarantee (`guarded→assisted→autonomous→open` or equivalent); internal shorthand "turbo" acceptable, public label forbidden.* |
| C-07 | **Tool surface: filtered ACI helps (4× SWE-bench via bounded viewers/caps; weak models need it).** (02 D-02 Reading A — gemini/deepseek/argon) | **Thin bash suffices for frontier (mini-swe-agent: ~100 lines bash-only >74% SWE-bench Verified; frontier models don't need rich ACI).** (02 D-02 Reading B — minimax) | **Resolved — 02 already resolves as model-tier-conditional.** Frontier → thin bash + 2–3 fence verbs; weak → richer filtered interface (Archestra weak-model failures cluster exactly where filtering helps); re-validate as models improve. 04's deterministic checks (gitleaks, npm audit, CSP scanners) are not "agent ACI" — they are hook-executed CLI commands, not agent-selectable tools, so they do not conflict with a thin agent surface. | **Escalate** the adapter implication: per-runtime `adapters/{runtime}.yml` must encode both window format *and* tool-surface policy by model tier; 04's scanners live in `tools/` outside agent tool-calling scope. |
| C-08 | **Elicitation for code: `1 → verify → conditional parallel best-of-k (k≤5) → first pass wins`; sampling + filtering beats Reflexion alone.** (03 D-01 Reading B — deepseek/minimax) | **Code loop as Reflexion retry: write → `fence-check` → feed trace → 1 retry (0 cost on happy path).** (03 D-01 Reading A — muse-spark/flash; 02 A-04 Reflexion 67%→91%) | **Resolved — 03 already resolves as loop + failure detail.** Minimax's correction to Reflexion's isolated gain is unrefuted; Brown's coverage curve (15.9%→56% at 250 samples) is the code-specific lever. Synthesis: the *loop* is `1 → verify → parallel filter`; the *retry prompt shape* inside the failure path is Reflexion's verbal diagnosis (adds +8 pp over blind retry). | No escalation needed beyond 03's synthesized wording; FINAL.md S-12 carries it. |
| C-09 | **Plan synthesis: 2–4 diverse drafts + criterion synthesis prompt is a practiced planning pattern (rank 2).** (03 D-02 Reading A — muse-spark) | **Synthesis for patches is unvalidated (≈2N+1 calls for N=5), inherits judge biases, can produce an unvalidated hybrid patch; no controlled code evaluation.** (03 D-02 Reading C — deepseek/minimax) — 06 independently wires plan/verify to a single Wonder model call (one-shot, no synthesis) on the same API. | **Resolved — scope the tool to plans only.** 03's resolution restricts synthesis to *plans* (steps/risks/order), light 2–3 candidates without a separate critique stage, never patches; the "merging diffs creates unvalidated code" (03 Avoid #5) and judge-over-optimisation (03 A-05/A-09) arguments are unrefuted. 06's single-Wonder plan/verify is compatible as the per-candidate generator — two-tier routing (Spark for volume, Wonder for plan/verify) and 2–3-candidate synthesis are different cost points for the same stage. | **Escalate** the scoped rule: *Plan synthesis at most 2–3 candidates with a criterion prompt; no critique stage; never for patches.* Add Wonder tier note: Wonder is the per-candidate generator, synthesis is the optional combiner — measure cost/quality trade in the bench. |
| C-10 | **Instruction hierarchy is the primary safety mechanism:** invariants in highest-privilege layer (system/developer prompt); tool outputs treated as untrusted data. (02 D-05 Reading A — muse-spark/flash) | **Hierarchy is not a security boundary:** *Control Illusion* (Geng et al.), indirection bypasses (Rehberger), over-refusal tax, ClawsBench 23% unsafe-action leakage; primary enforcement must be deterministic hooks/sandbox/container + identity-bound routing. (02 D-05 Reading B — minimax/deepseek/argon; 02 A-01) | **Resolved — defence-in-depth framing.** Both 02 syntheses resolve as: hierarchy helps (TensorTrust 32.8%→95.9% with minimal capability loss) but is never the mechanism; deterministic gates are the mechanism. | Already in FINAL.md S-05; no further escalation. |

**Two additional candidate contradictions that were checked and dismissed:**

- *02 says scaffolding helps safety vs. 02 minimax says stacking makes things worse:* both readings live in the same synthesis (02 D-04) and are explicitly reconciled — Argon's long-horizon generator→evaluator ACID pattern is valuable at long horizons, but each addition must be A/B'd in isolation *and* combination (CCI sign-flipping). No cross-stream contradiction; single synthesis already carries both.
- *04 OWASP 2021 vs. 2025:* not a cross-stream contradiction — it is 04's *internal* D-01, where minimax+gpt-6's 2025-anchored position is already declared the winner on checkable primary-source grounds. FINAL.md S-08 adopts 2025.

---

## 3. Deduplication ledger

### 3.1 Raw count

Every numbered item in `## 6. Actions for Phase 1 → ### Copy / Avoid / Invent` was enumerated:

| Stream | Copy | Avoid | Invent | Subtotal |
|--------|:----:|:-----:|:------:|:--------:|
| 01 harnesses | 5 | 4 | 3 | **12** |
| 02 harness→quality | 12 | 9 | 7 | **28** |
| 03 elicitation | 8 | 7 | 5 | **20** |
| 04 guardrails | 13 | 10 | 8 | **31** |
| 05 companion UX | 8 | 7 | 3 | **18** |
| 06 meta-models | 10 | 9 | 6 | **25** |
| **Total** | **56** | **46** | **32** | **134** |

For `Avoid` the count is normative load equivalent to `Copy` — each `Avoid` proposes a check or a deliberate omission (e.g., "never gate a patch with a judge" implies a `patch_selector ∈ {execution, typecheck, lint}` policy).

### 3.2 Canonical deliverables after merging

Cross-stream duplicates were grouped when ≥2 streams proposed the same concrete artefact, file, schema, CLI flag, or gate with the same enforcement semantics. Within-group items are listed so reviewers can audit the merge; the canonical form (rightmost column) subsumes them.

| Canonical ID | Streams involved | Raw items | Canonical deliverable (what FINAL.md should list once) |
|--------------|------------------|-----------|--------------------------------------------------------|
| **C-ROUTER** | 01-C5 · 02-C1 · 03-Avoid#7 | 3 | `AGENTS.md` ≤400 tokens — tool commands + invariants + pointers only; `docs/fence/INDEX.md` router + `description-agent` frontmatter; linter `tools/validate.ts` fails build if exceeded. |
| **C-LOC** | 01-C5 sub · 02-C3 | 2 | One-fact-one-location: `src/` sole editable authority → `dist/` disposable → `.fence/` single-owner state; AGENTS.md + skills reference owners, never duplicate; PR-gated parity checks + doc-gardening receipt. |
| **C-SKILL** | 01-C2 · 02-C4 sub | 2 | SKILL.md progressive disclosure for every harness skill (L1/L2/L3); discovery `.agents/skills/` + `.claude/skills/`; published to skills.sh/registries. |
| **C-HOOK** | 01-C3 · 02-C2 sub · 05-A6 sub | 3 | Minimal curated hook surface — `PreToolUse`/`PreToolExecution` on scoped actions; measured FP budget (nomos-class 7/8 · 0/4); no hook zoo; bypass-reason telemetry. |
| **G-ATTACK** | 01-I1 · 02-I1 · 04-I5 · 04-I6 · 06-I5 | 5 | Harness-as-attack-surface hardening — instruction-file sanitizer + trusted/untrusted separation + hash attestation (`fence validate`) + invisible-Unicode scan + same-session overwrite refusal + <untrusted-content> envelope + MCP pin + canary hook proof. Single deliverable in scaffold + install. |
| **G-CMD** | 02-C5 · 03-C1 · 03-C5 · 04-C11 · 04-C12 · 04-C13 | 6 | Every guardrail ships as an executable command (not prose): `Read→Think→Write→Check`; `fence check` silent Reflexion circuit; `no checkable artefact → not a rule`; per-mitigations `pass/fail/unknown/not-applicable` + expiry. Single severity/rule-record system. |
| **G-CTX** | 02-C4 · 02-I5 · 01-D01 4KB · 05-A4 sub | 4 | Context budget system — `context-budget.yml` caps (static/dynamic/history/headroom); byte-cap shell outputs 4 KB (`head -c 4000`); metadata-only skill exposure; graph-ranked `vibe-map` ≤1k tokens per task; last-5 observation pruning. |
| **G-BENCH** | 02-I2 · 02-I3 · 03-I5 · 04-I7 · 06-C10 | 5 | Canonical eval bench — adversarial fence bench (poisoned AGENTS.md, README payload, malicious skill, user-asks-to-bypass grading on unsafe-action rate) + 5-task × 4-rubric demo eval + capability-vs-safety double scoreboard + cost-of-pass telemetry. One bench spec, three facets; not three benches. |
| **G-VERIFIER** | 03-C3 · 03-I1 | 2 | `fence/verifier` trust ladder — `compile → lint → tests×2 (flake check) → generated smoke tests (CodeT dual-execution) → judge-for-prose only`; artefact `.fence/state/verdicts.json`. *(Intra-stream duplicate.)* |
| **G-CRED** | 04-C2 · 04-I2 | 2 | `NEXT_PUBLIC_*` / `VITE_*` / `PUBLIC_*` secret-shape lint — custom check covering inlined browser-bundle leakage; `warn` with allowlist → `block` after allowlist exists. *(Intra-stream duplicate.)* |
| **G-DIAL** | 02-I7 · 05-I3 | 2 | Teaching dial as vector + budget — per-domain vector `.fence/state/dial.json` + `learning.json` + teaching-budget governance; v1 UI may expose one global knob. |
| **G-TIER** | 02-I4 · 03-I4 | 2 | Model-tier-conditional adapter — per-runtime `adapters/{claude,codex,cursor,opencode,hermes}.yml` encoding window/caching/edit-format plus model-tier-conditional tool surface (thin bash for frontier, richer for weak); re-validate as models improve. |
| **G-TURBO-LABEL** | 01-Avoid#3 · 05-Avoid#5 | 2 | Never name the bypass level "Turbo" in product copy/docs/flags; bands named by guarantee. *(Same prohibition, two streams.)* |

**Arithmetic:** 13 canonical clusters collapsing 42 raw items into 13 entries = 29 duplicates removed on cross-stream grounds; plus 2 intra-stream self-duplicates (G-VERIFIER, G-CRED) already counted in the 42 = **31 total raw items merged into 13 entries**.

**Note on why some heavily overlapping items were *not* merged:** `npx vibe-fence init` single-command install (01-C1) vs. "zero-install one-prompt first artifact in <10 min" (05-C6) vs. "portable harness itself across 5 runtimes" (06-I1) appear to overlap but prescribe distinct scopes: the installer, the onboarding funnel, and the adapter system respectively. They are complementary layers of the same experience, not interchangeable artefacts — treat as 3 deliverables. Likewise "hard step budget" (02-C12) and "WIP=1 Kanban" (02-C12) are coupled but independently checkable gates; not merged.

### 3.3 Deduplicated count

| Measure | Value |
|---------|------:|
| **Raw enumerated actions** (6 streams × §6) | **134** |
| Cross-stream duplicates merged (11 clusters, excluding intra-stream) | −29 |
| Intra-stream self-duplicates merged | −2 |
| **Unique deliverables** (canonical + remaining singles) | **103** |
| Of which are `Copy` obligations | 39 |
| Of which are `Avoid` obligations (active `don't` + check-forbidden patterns) | 42 |
| Of which are `Invent` obligations (no prior art, must be built) | 22 |

Per-category breakdown after dedup is structural: `Avoid` outnumbers `Copy` because streams 02–04 invest heavily in "do not stack / do not synthesize / do not judge-gate" negatives that each map to a concrete check (linter, selector allowlist, combination A/B gate), not merely to absent behaviour.

> Practical implication for FINAL.md: do *not* list 134 bullets. List **103** grouped by milestone (FINAL.md already does this, and its §4 currently enumerates ~35 grouped items — it intentionally groups further from 103 to milestone-sized commits). This report's 103 is the audit trail count; FINAL.md's milestone grouping is the build plan.

---

## 4. Collective blind spots (gaps that appear in ≥2 streams)

Ordered by how many streams name the gap or leave its absence conspicuous. Each row notes which streams flag it and which stream, if any, *closes* it with a concrete action.

| # | Blind spot | Named as gap in | Closed with an action by | Why it is collective |
|---|------------|-----------------|--------------------------|----------------------|
| **B-01** | **No user study on the actual product population exists.** Fresh JS/TS greenfield, non-technical, deadline-having users building with an AI agent for the first time — no contributor measured them. Every "non-technical user" claim is transferred from SWE-bench Python issue-resolution, higher-ed RCTs (Bastani/PNAS), vendor docs (Lovable/Builder "10-minute" baselines), or a student hackathon (N=31 Brazil, Fontys n=107 reflections). | 01#5, 02#1, 03#4, 05#3, 06 implicit (no live users) — **5/6 streams** | No stream; 02 & 03 propose a 10–20-task private eval on vibe-coded repos but none is built yet. | Entire Phase 0 is transfer inference. Every `proven` about AGENTS.md harm, rule-count ceilings (p^n), scaffolding CCI, elicitation gains, and onboarding cadence must be treated as hypotheses until re-measured on the target bench. This is the report's single strongest finding. |
| **B-02** | **No measured false-positive / bypass budget.** What FP rate on ordinary actions drives beginners to `approve all` / `--dangerously-skip-permissions`? What is a tolerable blocks/session before fatigue invalidates the fence? 01's 12×12 hook eval (6/12 hooks stopped 0/8 risky) quantifies *hook* quality but not *user* tolerance; vendors publish no rates. | 01#5, 02#5, 04#4, 05#6 — **4/6** | 01-I3 proposes *hook telemetry + bypass-reason capture* to measure it, but no stream proposes an actual user-tolerance experiment. | Without this number, "minimal hook surface" (C-HOOK) and "never block on Conventional Commits" (04) have no quantitative operating point — the most consequential Phase 1 UX parameter is unknown. |
| **B-03** | **Optimal always-on rule / AGENTS.md / SKILL count is unmeasured.** The p^n model (Harada/MOSAIC/IFScale: ~2 rules at 95% joint reliability) is generic ManyIFEval keyword constraints, not fence-specific invariants; the 100-line vs 400-token vs 300–500-line boundaries are anecdotal / single-source; no per-skill or per-rule Pareto of fence rules vs task success vs cost exists. | 01#1, 01#4, 02#2, 02#5, 04 implicit (no rule-count experiment), 05#7 — **4/6 explicitly** | 02-I7 + 03-I1 propose factorial-over-rule-counts experiments, but none funded/run. | Directly governs C-ROUTER's budget and C-G-CMD's severity ladder — the two most load-bearing Phase 1 files. FINAL.md's S-07 cites the p^n table; it must be flagged as generic until re-measured. |
| **B-04** | **Supply-chain injection at build time has no deployed countermeasure in coding harnesses.** NVIDIA AI Red Team pattern (Go lib writes `AGENTS.md` during `go mod tidy` before any agent runs) collapses the code/data boundary; lifecycle-script `postinstall` risk, SBOM/cooldown, and cross-compilation validation are proposed but nothing is measured. | 02#6, 04 (invent slopsquat gate) — **1 explicit gap + 1 inventing stream** | 04 invents the gate (`npm ls` vs manifest diff, `postinstall` empty-allowlist, SBOM) but no stream supplies FP/FN rates for hallucinated-package detection on agent-written manifests. | Only gap that is also a shipped attack vector documented by a vendor red team rather than a hypothetical — absence in 4 of 6 streams (01, 03, 05, 06) signals under-weighting. |
| **B-05** | **Teaching-verbosity ↔ task-correctness interaction is unmeasured.** Does injecting teaching tokens degrade the agent's own pass rate on the task (context bloat vs instruction quality)? At what verbosity does teaching become the clash bloat it is meant to prevent? Proposed budgets (`max`≤8%/`medium`≤3%, deepseek A-07) are invented constants; the only relevant evaluation (CCI factorial) suggests capable-model skill+scaffold combos can hurt. | 02#4, 05#1, 05#7 — **3/6** | 02-I7 proposes *teaching-dial × guardrail factorial* but unrun. | Governs the central product thesis ("fence teaches while it protects") — if there is a scaffolding ceiling (CCI negative Shapley for Planning), the teaching and safety layers can be adversarial at realistic lengths. Must be measured as a two-factor experiment before launch copy claims compound benefit. |
| **B-06** | **Latency tolerance for non-technical users is unmeasured.** "Tens of seconds" inferred from builder patterns + notification literature (Fitz batching 3×/day RCT); no coding-agent user study. Applies equally to elicitation retries (03), queue gate dwell (05 3s/5s), and `fence verify` duration. | 03#4, 05#5 implicit, 06 implicit (no timing) — **3/6** | No stream proposes a timed-interaction study except 03#4 (5-user think-aloud) as future work. | Determines whether `1→verify→parallel best-of-k`'s "latency stays ~one attempt" promise is acceptable at real task lengths, and whether 2-strikes circuit-breaker waits are tolerated. |
| **B-07** | **Verifier quality on actual hobby projects is unmeasured.** Reported 11.3% flaky / <20% distinguishability / ~6% false-pass is the *best case* (curated SWE-bench suites); LLM-written smoke-test quality on testless hobby projects will be worse and is unmeasured; the "generate the missing verifier" strategy's lift is therefore unvalidated. | 03#3, 04#4, 05 thin-stream meta-gap — **3/6** | 03-I1 + 03-C3 propose generating smoke tests *and* flakiness-checking them (run×2) as the mitigation, but no stream measures the false-pass rate of such generated tests on real low-coverage repos. | Sits on the critical path of G-CMD and every `block` — a flaky verifier makes a good patch fail or (worse) a bad patch pass with confidence. Private bench must instrument verifier precision/recall per rung. |
| **B-08** | **Vendor classifier accuracy for turbo is unpublished and therefore cannot be borrowed.** Claude Code/Codex/Cursor each run a classifier-in-the-loop; none publish precision/recall/latency; Cursor concedes its allowlist is best-effort. 05's D-03 is the only place a classifier-based turbo is proposed, and 05 itself flags it as unmeasured. | 05#6 — **1 explicit gap, but 0 streams supply data** | 05 proposes deterministic containment as the compensating v1; 06's `tool_search` classifier routing is an orthogonal use. | The gap's absence from 01/02/04 is itself diagnostic — those streams treat "classifier" as a safety-adjacent term without engaging with the missing measurement. The report treats this as a collective blind spot because *no* stream provides numbers that its own turbo proposal would need. |

**Gaps that are single-stream artefacts and do not escalate as collective:**

- 01 gaps #2–#3 (non-Western harnesses, Antigravity/Hermes thin docs) — low severity for Phase 1; noted in coverage caveats.
- 04 gaps #1/#2/#6/#8–#9 (file-upload/SSRF/VC-bound privacy/rate-limiting) — domain gaps for M3+ hardening, not cross-stream blind spots; FINAL.md correctly parks them per-milestone.
- 06 gaps #2–#4/#7–#8/#10 (Official Rules unpublished, credit mechanics, geography, SAM pixel caps) — event/meta gaps, not product-architecture gaps.

---

## 5. What escalates to FINAL.md

Only items that change a build decision or introduce measurable risk. Wording is offered as patch language for `FINAL.md`, not as instructions to rewrite existing prose.

### 5.1 Add/strengthen in Settled Decisions

1. **State the single AGENTS.md budget as `≤400 tokens`**, noting `≈100 lines` as the human-readable approximation. Today FINAL.md S-01 and the canonical-row C-ROUTER are aligned, but several action bullets in per-stream files still cite 200 lines — FINAL.md should be explicit that its S-01 subsumes them.

2. **Add the hook-quality caveat to S-10** (turbo safety): the minimal curated hook surface is load-bearing *because* most hooks are theater — "minimal" is not aesthetic preference but a FP-budget requirement. One sentence suffices; the contradiction resolution C-01 is the rationale.

3. **Record the lint rule from C-02** in §6 "What Phase 1 Must NOT Do" or alongside S-12: skill text may not contain ungrounded self-critique phrasing ("review your own work", "check for bugs") unless accompanied by a tool signal or rubric. This is a checkable guardrail on the elicitation layer that no stream currently ships as a concrete check.

### 5.2 Contested / risks that FINAL.md must carry (or already carries correctly)

FINAL.md's §3 `C-01 … C-09` already covers 7 of the 10 flagged items well. Two need strengthening and one is missing:

- **Strengthen C-01/C-06 together:** add a line to C-06 that the classifier path is blocked specifically because *no* vendor publishes precision/recall — cite 05 gap #6 explicitly. Current C-06 says "vendors use classifiers … none publish precision/recall" (it does) — verified present in FINAL.md's C-06 note — **no change needed.** Mark as confirmed.

- **Strengthen C-03 (turbo naming):** Confirm FINAL.md S-10 already says `guarded→assisted→autonomous→open` — **confirmed present.** No change needed.

- **Add one row to §3 for verifier quality on hobby projects (B-07).** No contested row currently covers the "flaky test on hobby projects" risk; it is the only collective blind spot with a direct `block`-accuracy consequence. Suggested row: `| C-10 | Can LLM-generated smoke tests on testless hobby repos be trusted as a block gate, or do they false-pass? 11.3% flaky on curated suites; worse regime unmeasured. | 03 D-07, 04#4, 05 meta | Ship trust ladder with run×2 flake check (03-I1) as default; measure false-pass on the private bench before promoting generated tests to block. |`

### 5.3 Actions count note for FINAL.md's §4 preamble

FINAL.md §4 says "Deduplicated across streams…" — this report grounds that claim: **134 raw → 103 unique** (31 items merged into 13 canonical deliverables). If FINAL.md wishes to cite a number, 103 is the audit count; its milestone grouping (~35 grouped items) is the build plan. No edit to FINAL.md required unless it wishes to add the provenance footnote.

### 5.4 Method-level gap that FINAL.md's Coverage Caveats already carry but undersell

B-01 (no study on the actual population) is correctly noted as FINAL.md's cross-stream note ("No contributor validated harness components on non-technical greenfield JS/TS") — **confirmed present.** Consider promoting its language from "Phase 2 must report fence-on-vibe-coder-repos as primary" to "Phase 1 must build the private vibe-coder bench before any benchmark-derived claim is published" — i.e., treat the bench as a Phase 1 deliverable, not Phase 2 telemetry. This is a wording-strength suggestion, not a contradiction.

---

## 6. Audit log

- All 6 files read and line-counted (total 1549 lines, no truncation except 04/05 via spillover which were fully reconstituted and verified).
- Contradiction candidates sourced from: (i) the two examples in the task prompt, (ii) every `## 2. Where they disagree` section (4 + 7 + 7 + 7 + 4 + 7 = 36 disagree blocks), (iii) keyword cross-search for `blocklist`, `turbo`, `AGENTS.md`, `hook`, `self-critique / review your own work`, `hierarchy`.
- Deduplication sourced from full §6 enumeration (134 items) with title extraction (`^\d+\.\s*\*\*…`) and manual cluster judgement on artefact equivalence.
- Blind spots sourced from every `## 4. Gaps` section (5 + 7 + 11 + 8 + 9 + 10 = 50 gaps) grouped by keyword overlap.
- No synthesis file was modified; no `FINAL.md` was written. This report is the only file created.

---

## 7. Sources (audit provenance)

Primary sources are the 6 synthesis files themselves; per-stream primary citations are not re-duplicated here. Each resolution above cites the stream and disagreement ID so a reader can jump to the per-stream reasoning.

- `docs/research/synthesis/01-harnesses.md` — 01 D-01…D-04, A-01…A-06
- `docs/research/synthesis/02-harness-influence.md` — 02 A-01…A-08, D-01…D-07
- `docs/research/synthesis/03-elicitation.md` — 03 A-01…A-10, D-01…D-07
- `docs/research/synthesis/04-guardrails.md` — 04 A-01…A-17, D-01…D-07
- `docs/research/synthesis/05-companion-ux.md` — 05 A-01…A-06, D-01…D-04 (thinned stream; 4/6 contributors)
- `docs/research/synthesis/06-meta-models.md` — 06 A-01…A-08, D-01…D-07
- `docs/research/synthesis/FINAL.md` — not modified; cited for confirmation that several escalations are already present.
