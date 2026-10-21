# HTML Explorer Review — `docs/research/synthesis-explorer.html`

> **Scope:** HTML review only. Audited against both `docs/research/synthesis/FINAL.md` (cross-model Session 1, ~226 KB) and `docs/research/synthesis-independent/FINAL.md` (independent 6-contributor master blueprint). Explorer is 62 KB, 5 tabs, dated 2026-10-20. No v2 written.

---

## 1. Factual Accuracy vs Both FINAL.md Files

### Accurate — keep

| HTML claim | Verified in both FINALs |
|---|---|
| Declarative instruction files (`AGENTS.md`/`CLAUDE.md` are advisory, decay to 0% enforcement at high context) | S-01, S-06 in `synthesis/FINAL.md`; S-01, S-08 in `synthesis-independent/FINAL.md`. Correct. |
| Context budget ≤400 tokens / ~150 lines; “map, not manual” | S-01 / `synthesis/FINAL.md:19`; S-01 / `synthesis-independent/FINAL.md:26`. Correct. |
| Gloaguen et al. ETH Zurich, arXiv:2602.11988, −3% resolution / +23% cost for bloated context files | `synthesis/02-harness-influence.md:38`; `synthesis-independent/02-harness-influence.md:30`. HTML omits the −3% nuance (see Fixes). The citation itself is correct. |
| Intrinsic self-critique without tests is placebo / degrades reasoning (Huang et al., arXiv:2310.01798) | S-04 / `synthesis/FINAL.md:22`; S-05–S-06 in independent. HTML’s “ICLR 2024” venue tag is imprecise — source is arXiv preprint cited as ICLR-adjacent — but not material. |
| Turbo safety = containment + reversibility + batched review, not permission prompts; silent `checkpoint: [action]` + `npx vibe-fence undo` | S-10 / `synthesis/FINAL.md:28`; S-09–S-11 / independent. Correct. |
| Teaching dial `max → med → min → silent`, grounded in Sweller (1988) + Expertise Reversal (Kalyuga 2007) | S-11 / `synthesis/FINAL.md:29`; S-10 / independent. Correct. |
| Meta routing: Muse Spark 1.3 (companion) / Muse Wonder 1.0 (plan/verify escalation) / Muse Image ($0.01/image, demo polish) | S-13 / `synthesis/FINAL.md:31`; S-12 / independent. Correct. SAM stays out of critical path — both FINALs agree. |
| Progressive disclosure, `src/` editable → `dist/` disposable, `.fence/` single-owner state | S-02/S-03 / `synthesis/FINAL.md:20-21` and M1/M2 actions. Correct. |
| 6 research streams | Correct. |
| Footer paths `docs/research/synthesis/` and `docs/research/synthesis-independent/` | Correct. |

### Hallucinated or misrepresented — must fix before v2 references the HTML

| # | HTML text (location) | What the research actually says | Severity |
|---|---|---|---|
| **H-01** | **“95% Architecture Match” + “Zero Conflicting Blockers”** (header card + Duel tab verdict) | Neither FINAL.md quantifies consensus as 95%. `_CONSISTENCY.md` records 134→103 dedup, **10 contradictions** and **8 blind spots** — all resolved or flagged as contested/evals (`synthesis/FINAL.md:3`). “Zero conflicting blockers” overstates: there are 10 genuine divergences (hook surface, `AGENTS.md` value, ACI richness, `max` pedagogy, dial fade triggers, etc.) carried as C-01…C-10 contested risks. | **High** — headline banner fabricates a metric; readers will cite it. |
| **H-02** | **“18,000-student trial proving hint-first scaffolding doubles retention”** (Duel table, Stream 3 metric + session2 note) | Bastani et al., PNAS 2025 (2025-06-25) is **n≈1,000 high-school math students** (`synthesis/05-companion-ux.md:19, 166, 184`). Results are nuanced: GPT Base +48% during practice then **17% worse than controls after removal**; hint-first tutor +127% during practice with no post-removal penalty (`synthesis-independent/05-companion-ux.md:19, 59`). “Doubles retention” and “18,000 students” are invented. The transfer to coding is explicitly marked `contested` by both syntheses. | **High** — academic misattribution; must not be quoted externally. |
| **H-03** | **“Specialized model routing cuts latency by 65%”** (Stream 06 metric) | No 65% latency figure exists in either FINAL.md, any per-stream synthesis, or any contributor. The only “65%” in research is the **miss rate on `npm run *` hidden-payload commands** (Wauters dataset, `synthesis/05-companion-ux.md:148`; DeepSeek U-09). The claim is fabricated by conflating unrelated numbers. | **High** — invented benchmark. |
| **H-04** | **“32-subset combinatorial test proved out-of-sync rules cause up to 14% drops in code completion accuracy”** (Stream 05 metric) and **“combining linter + self-critique without hooks drops accuracy by 14%”** (Duel table) | The CCI factorial (2⁵=32 subsets, 118 configs, 32k+ evals — Minimax contribution, `synthesis/02-harness-influence.md:59`) proves the **all-in 5-component scaffold is beaten by a proper subset in every condition** with **Shapley values** showing planning as negative. “14% accuracy drop” never appears as a measured outcome. The `14%` that does exist in research is **reasoning-token bloat (+14% for GPT-5.1 mini, +22% for GPT-5.2)** when bloated context files are injected (`contributors/ollama-launch-minimax-m3.1-flash-2026-10-20/02-harness-influence.md:35`) — a cost/efficiency finding, not an accuracy finding — and a separate `14%` completion-time cut for code completion. HTML misattributes cost data as accuracy data and invents the linter+self-critique pairing. | **High** — fabricated quantitative finding. |
| **H-05** | **“Synthesis 2 (Independent Gemini 3.8 Flash Run)”** (hero subtitle + Duel column header) | `synthesis-independent/FINAL.md:3` synthesized **6 contributors**: `google-gemini-3.8-flash`, `google-gemini-4-argon`, `muse-spark`, `ollama-launch-deepseek-v4.1-flash`, `ollama-launch-minimax-m3.1-flash`, `openai-gpt-6`. Labeling the independent synthesis as a single-model Gemini run is factually wrong and understates replication diversity. | **Medium** — mislabels methodology; undermines “dual independent” claim in same page. |
| **H-06** | **“93% habituation: non-technical users suffer”** (Big Picture) + reused in Stream 04 metric as “software safety studies” | 93% acceptance is **Anthropic telemetry (May 2026) on all users**, plus Wauters 409k-decision dataset showing **~35% miss rate on scope/credential exfiltration** (`synthesis/05-companion-ux.md:24`). Scope is general developer behavior, not non-technical specifically. “Software safety studies” is vague and misattributes the source. Secondary error: `_CONSISTENCY.md` notes this is **thin replication** — carried quantitatively by deepseek + minimax only; muse-spark/gemini converged descriptively from older HCI lit (`synthesis/05-companion-ux.md:34`). HTML omits the thin-replication caveat. | **Medium** — misattribution + inflated generalization. |
| **H-07** | **Stream 02 metric: “0% accuracy gains across 1,000+ benchmarked coding tasks”** | Neither FINAL quantifies self-critique this way. Sources cited are Huang et al. degradations on GSM8K/CommonSenseQA (95.5%→89.0%, 75.8%→41.8%) and the qualitative finding that no general self-correction demo exists without tool signal. “1,000+ tasks” and “0% gains” are an unsourced paraphrase; close to directionally true but not a reported number. | **Medium** — unsourced quantification. |
| **H-08** | **“Under 150 lines” vs “≤400 tokens (tool commands + hard invariants + pointers)”** conflation in Roadmap M1 + Stream headers | Both FINALs anchor ≤400 tokens as the invariant; “≈100 lines” is an approximation subsuming per-stream 200-line variants (`synthesis/FINAL.md:19`). HTML alternates between “under 150 lines,” “under 150 lines / 400 tokens,” and “150 lines” without acknowledging the token-based assertion in `tools/validate.ts`. Not a hallucination but a drift that should be normalized. | **Low** — editorial inconsistency. |

### Not hallucinations — acceptable simplifications

- Ferrari/teenager metaphor, Bouncer/Time Machine/Adapter analogies: editorial framing for non-technical readers. Acceptable if flagged as analogy, not finding.
- “TrojanForge injection” mentioned only in M2 detail, not banner: correctly scoped to threat model.
- OWASP Top 10:2025 + LLM Top 10 2026 framing appears in Pillars/sidebar only implicitly; not misstated.

---

## 2. Interactive Sandboxes — What Encodes Real Research vs Invented UI

### Sandbox 1: Teaching Dial Simulator

**Real research scaffold underneath:**

- 4-tier structure `max → med → min → silent` is settled (S-11 / `synthesis/FINAL.md:29`; S-10 / independent). HTML’s labels map correctly: Max = Patient Coach / Med = Guide / Min = Co-Pilot / Silent = Invisible Guardian.
- One-question-per-turn constraint, plain-English analogies over jargon, and companion-as-teacher at `max` vs executor at `silent` are all in `synthesis/05-companion-ux.md` and `synthesis-independent/05-companion-ux.md`.
- Cognitive Load Theory + Expertise Reversal grounding, `per-domain vector in .fence/state/dial.json` under a global knob, and bounded presentation cards (`What changed · Why · Your call · How we’ll know`) are in both FINALs. HTML’s M3 card-preview concept aligns.

**Invented UI that must not be cited as research:**

- Response scripts (“front door on your house,” “Tailwind styling,” popup vs redirect) are **copywritten by the HTML author**, not from any contributor or synthesis.
- Badges “Tone: Explanatory & Pedagogical” and metrics “Cognitive Support: 100% | Hand-holding: High” / “Cognitive Support: 0%” are **invented scales** with no empirical cut-points. Both FINALs explicitly flag dial cut-points and gate budgets as **hypotheses with near-zero empirical anchors** (`synthesis/FINAL.md:112, C-04/C-05`; `synthesis/05-companion-ux.md:166`).
- “Interruptions: 0” at `max` contradicts the design: `max` is the most verbose tier; HTML’s metric inverts the actual tradeoff.

**Verdict:** The dial *structure* is real; the *response content and scoring* is demo fiction. Safe to reference the dial as a research outcome; unsafe to quote any simulated response or percentage as evidence.

### Sandbox 2: Teachable Turbo Action Gatekeeper

**Real research scaffold underneath:**

- Core thesis (deterministic hook decides, model explains; containment + reversibility beats permission prompts) is settled (S-10 / `synthesis/FINAL.md:28`; S-09 / independent). Both FINALs reject prompt-only safety at 93% acceptance / ~35% miss.
- All 7 verdict categories map to real threat classes documented in `04-guardrails.md`: safe edits / file creation / verified packages / typosquatting (slopsquat) / destructive DB / secret exfiltration / destructive git.
- PreToolUse hook as enforcement boundary, `checkpoint: [action]` + `npx vibe-fence undo`, credential hard-deny, project-root `realpath` boundary, and egress allowlist are all in S-10 / `synthesis/FINAL.md:28` and expanded Stream 04 M3 packet.

**Invented UI that must not be cited as research:**

- **Per-action dialog prose** (“registered 3 days ago, only 4 downloads,” specific `checkpoint: c9f1a02` hashes, “reacct-auth-core” as the chosen typosquat) is invented. Slopsquat coverage in research (`synthesis/04-guardrails.md:45, deepseek U-09/A-28`) names the *class* of attack and prescribes a pre-install allowlist gate, not a live package-age heuristic.
- **Deterministic allowlist vs heuristic distinction matters:** Research prescribes **deny-by-default on credential stores / out-of-root writes / egress** plus an **explicit allowlist file** escalating `warn→block` (minimax two-phase escalation, `synthesis/04-guardrails.md:53`). HTML implies the system can judge “millions of downloads / zero CVEs” automatically — a **non-deterministic classifier** that `synthesis/FINAL.md:126, C-06` explicitly marks contested and defers to Phase 2 behind a feature flag. HTML’s `safe_pkg` scenario silently ships the contested classifier as settled.
- **“Emergency DB Dump Created”** checkpoint claim: neither FINAL promises automatic DB dumps on `DROP TABLE`; the actual guarantee is **git checkpoint before multi-file edits** + **branch protection / deployment checks**. DB snapshots are not in the M1–M4 plan.
- **“Force-push rejected by bouncer”** is correct in principle, but HTML’s “hard-coded illegal action” phrasing overstates. Research defines it as an **app-profile severity rule** (`local` unconditional `block` at every tier, `synthesis/04-guardrails.md:85`) that can still be overridden in higher bands — not an immutable kernel refusal.

**Verdict:** The *tripwire taxonomy and containment philosophy* are faithfully modeled; the *per-action detection logic and recovery guarantees* are speculative UX. Do not reference the simulator’s verdicts as the security spec.

---

## 3. Phase 1 Roadmap (M1–M4) — What the HTML Gets Right and Wrong

HTML presents 4 “Week 1–4” cards with deliverables. Both FINALs (§4, “Actions Grouped by Milestone”) define M1–M4 as **scaffold sequencing**, not calendar weeks, with substantially different content:

| Milestone | HTML roadmap card | Actual FINAL §4 content | Assessment |
|---|---|---|---|
| **M1** — *The Core Engine & Universal Transpiler* | `vibe-fence.config.yaml` → transpiles to `.cursorrules` + `AGENTS.md` under 150 lines; “zero config drift” | **Project skeleton:** `src/` sole editable authority → `dist/` disposable via `tools/{generate,validate,install}.ts`; `docs/fence/INDEX.md` router + `description-agent` frontmatter; `.fence/` single-owner state tree (queue, dial, lessons, verdicts, budgets); **app-profile at init** `.fence/app-profile.json` (`local`/`shared`/`public`, 14→+15→+26 `block` tiers); **trusted-channel hardening** (hash attestation, overwrite refusal, Unicode scan, `<untrusted-content>` envelope, `tools/` outside agent write-scope). | **Mislabeled and incomplete.** File name `vibe-fence.config.yaml` does not exist in either FINAL (actual: `.fence/app-profile.json` + `src/framework/context-budget.yml` + `src/config/severity-policy.json`). “Transpiler” conflates M1 scaffolding with M4 adapter wiring. Misses 3 of 5 load-bearing M1 deliverables (app-profile, attestation, `docs/fence/`). “Week 1” timeline is invented. |
| **M2** — *The Bouncer: Client-Side Safety Hooks* | Pre-tool interceptors for terminal/file edits; “destructive commands stopped dead” | **Framework primitives:** `AGENTS.md` ≤400-token assertion in `tools/validate.ts`; `src/framework/context-budget.yml` (caps at 4 KB, metadata-only skills, ACID artefacts); `.fence/check` silent Reflexion circuit; hard step budget + Kanban WIP=1; Architect→Editor gate (` .fence/plans/` before edits); 2-strikes circuit-breaker; **per-runtime adapter profiles** (`src/adapters/{claude,codex,cursor,opencode,hermes}.yml`); byte-capped PageRank `vibe-map`; deterministic `severity-policy.json`. | **Severely narrowed.** HTML reduces M2 to “hooks + blocklist,” which is only one invention row of M2. Omits context budget, verification circuit, step/queue budgets, adapter profiles, and the CCI anti-stacking guard — the actual core of Phase 1 containment. |
| **M3** — *The Companion Persona & Teaching Dial* | 4-tier dial + Muse Spark **/ Argon** companion prompting | **Skill definitions:** Progressive-disclosure SKILL.md skills (`vibe-init`, `vibe-guard`, `vibe-plan`, `vibe-teach`); `vibe-guard` = executable rule records `.fence/rules/<id>.json` with 7-field schema + full guardrail packet (dual-layer secrets `gitleaks`+Push Protection, `NEXT_PUBLIC_` shape lint, Zod per-route + `pg $1`/ORM + `semgrep p/owasp-top-ten`/`p/react`, headers+CSP nonce Report-Only→enforce, `setSessionCookie()`/`verifyJWT({RS256})`/OAuth PKCE+state, RLS `USING (true)` linter, lockfile+SBOM/cooldown, privacy inventory); `vibe-plan` 2-option teachable fork; elicitation `1→verify→best-of-k≤5`; lessons/escalation/verifier inventions. | **Misplaced and misnamed.** Dial belongs in M2 (§4 M2, invented row on teaching dial as orthogonal axis); HTML puts it in M3. “Argon” is not a Muse model — correct is **Muse Wonder 1.0**; `Argon` was a contributor alias (`google-gemini-4-argon`) leaked into the roadmap. Omits the entire guardrail packet, which is the primary M3 scope per both FINALs. |
| **M4** — *Teachable Turbo & Magic Undo CLI* | `npx vibe-fence undo`; “1-second panic button” | **Adapters + installer:** Idempotent `npx vibe-fence init` (<3s, merge-never-clobber, receipt + tour, `fence doctor`/`fence validate`); Spark 1.3 via `POST /v1/responses` stateless encrypted replay + Wonder 1.0 swap; Muse Code reference adapter with trust-gated precedence + read-only `.git/.muse/.agents`; curated `PreToolUse`/`PreToolExecution` hook surface with FP budget and **band naming by guarantee** (`guarded→assisted→autonomous→open`; user-facing “Turbo” **forbidden** per `synthesis/FINAL.md:129, S-10`); `fence look` Playwright→Spark verification; canary-enforced hook proof + version-pinned SDK; Glimmer 30B end-to-end privacy literal; adversarial fence bench + before/after eval table + cost telemetry. | **Misplaced and incomplete.** Turbo+undo belong in M2 (S-10 inventions on gate-budget, `target×reversibility×sessionCoupling` classifier, `events.ndjson`); HTML delays them to M4. M4’s actual scope — per-runtime adapters, Model API client, hook proof, privacy literal, eval bench — is entirely absent. Violates the explicit `What Phase 1 Must NOT Do` item forbidding user-facing “Turbo” (`synthesis/FINAL.md:129`). |

**Cross-milestone pattern:** HTML’s roadmap is internally consistent as a *story* but externally inconsistent with both FINALs. It was authored to be readable, not traceable. Every HTML card omits its corresponding FINAL’s most load-bearing deliverables while introducing invented artefacts (`Week N`, `vibe-fence.config.yaml`, `Argon`, “magic undo in Week 4”) that will cause implementers to build against the wrong spec if cited.

**What the HTML roadmap does get right (carry these forward):**

- Ordering intuition: infrastructure before safety before teaching before polish — directionally correct even if the contents are shuffled.
- Emphasis on **≤150-line router** and **zero prompt-goodwill** safety — correctly centered.
- “Artifact-first, teach-after” install philosophy aligns with `synthesis/FINAL.md:97` M4 `fence tour` opt-in note.

---

## 4. What Should Carry Into v2 vs What Should Stay in the Explorer

### Carry into v2 (proven tone + structure)

- **5-tab information architecture** (Big Picture → Duel → 6 Streams → Sandboxes → Roadmap) as a non-technical entry-point pattern. The tab `switchTab` / `filterComparison` / `selectStream` mechanics are solid.
- **“Plain English” callouts** (`💡 Plain English: steel deadbolt vs sticky note`): effective teaching device; both syntheses prescribe “everyday metaphors, one question per turn” (`synthesis-independent/05-companion-ux.md:59`). Keep the pattern, correct the metaphors where they drift.
- **Comparison matrix** as a synthesis-comparison affordance. The 9-row table with `100% Match` / `Synthesis N Gem` badges is the right shape — just correct the row labels and remove fabricated metrics (see Fixes).
- **Pillar cards** (Bouncer / Time Machine / Teaching Dial / Universal Sync) as ELI5 anchors. Keep the 4-pillar framing; rename artifacts to match FINALs (see Fixes).
- **Empirical Fact callout box** in Stream cards. High-value pattern — replace invented facts with citation-linked ones.
- **Tailwind/Antigravity design system** and badge/tone conventions — reusable.

### Stay in the explorer — do not promote to v2 canon

- **Interactive simulators as evidence.** Both sandboxes are pedagogical theatre, not specifications. Promoting their per-action verdicts to “how vibe-fence behaves” would ship the contested classifier (C-06) as settled and misrepresent allowlist mechanics.
- **M1–M4 roadmap cards** as the milestone plan. Their contents diverge from both FINALs at every milestone. v2 must derive milestones from `synthesis/FINAL.md:59-106` §4, not from the explorer cards, and must not introduce calendar-week commitments neither FINAL makes.
- **Any absolute quantification in hero banners** (“95%,” “Zero,” “6”) without a cited source span. The 6-stream count is fine; the 95%/Zero pair is fabricated.
- **“Muse Spark / Argon”** copy. Argon is a contributor codename; Muse Spark / **Muse Wonder** is the product pair.
- **“Turbo” as a user-facing label** in buttons, cards, or install flags. Both FINALs mark this `avoid` / contested-thin and require guarantee-named bands (`guarded→assisted→autonomous→open`, `synthesis/FINAL.md:101, 129`; `synthesis/05-companion-ux.md:26, 92`).

### Neutral — author’s choice

- Ferrari metaphor: effective but optional; v2 may replace with a domain-closer analogy.
- “Non-Technical Edition” badge: marketing label, harmless if retained.
- Stream `st-btn` pill navigation: purely presentational.

---

## 5. Concrete Fixes Required Before v2 References the HTML

> Each fix lists **location**, **evidence grounding**, and **exact edit**. A v2 PR should link to this section so reviewers can verify provenance.

### P1 — Block v2 reference until fixed (factual integrity)

| # | Location | Fix | Source |
|---|---|---|---|
| **F-01** | Header card `95% Architecture Match` + `Zero Conflicting Blockers`; Duel verdict `100% Unanimous Core` | Replace with **sourced counts**: `134→103 dedup · 10 contradictions · 8 blind spots · 10 contested Qs (carry as evals)`. Add link to `_CONSISTENCY.md` §2–§4. Retain “core architecture settled” as qualitative summary only if qualified “with 10 contested risks carried as A/B evals.” | `synthesis/FINAL.md:3` + `_CONSISTENCY.md:1-10` + `synthesis/FINAL.md:37-51` C-01…C-10 |
| **F-02** | Duel row *Educational Field Evidence* + Stream 03 metric/session2 note | Strike `18,000-student` and “doubles retention.” Replace with: **“Bastani et al., PNAS 2025-06-25, n≈1,000 high-school math: GPT Base +48% during practice, −17% vs controls after removal; hint-first tutor +127% with no post-removal penalty. Transfer to coding is contested.”** Link DOI `10.1073/pnas.2422633122`. | `synthesis/05-companion-ux.md:19, 166, 184` + `synthesis-independent/05-companion-ux.md:59, 113` |
| **F-03** | Stream 06 metric `cuts latency by 65%` | **Delete.** No source. If a performance claim is needed, replace with the settled qualitative statement: “Depth > breadth; one deep Spark integration beats bolted-on SAM (rubric Impact 30% + Tooling 25%).” Add M4 canary-proof note instead. | `synthesis/06-meta-models.md:48-66, 123` + `synthesis-independent/06-meta-models.md:31` |
| **F-04** | Duel rows *Scaffold Interference* + Stream 05 metric `14% drops in code completion accuracy` | **Delete both 14% accuracy claims.** Replace with sourced text: **“CCI factorial (2⁵=32 subsets, 118 configs, 32k evals): all-in 5-component scaffold beaten by proper subset in every condition; Planning Shapley value negative. Added requirements inflate reasoning tokens +14–22% (Gloaguen ablation). Every addition must be A/B’d in isolation and combination (S-07).”** | `synthesis/02-harness-influence.md:59-60` + `contributors/ollama-launch-minimax-m3.1-flash-2026-10-20/02-harness-influence.md:35` + `synthesis/FINAL.md:25, 132` |
| **F-05** | Hero subtitle + Duel header `Synthesis 2 (Independent Gemini 3.8 Flash Run)` | Replace with **“Synthesis 2 (Independent — 6 contributors: gemini-3.8-flash, gemini-4-argon, muse-spark, deepseek-v4.1-flash, minimax-m3.1-flash, gpt-6)”** and link to `docs/research/INDEX.md`. | `synthesis-independent/FINAL.md:3` |
| **F-06** | Roadmap M1–M4 entire section (4 cards + `Week N` + `vibe-fence.config.yaml` + `Argon` + `Turbo` label) | **Do not patch — replace.** Derive new M1–M4 from `synthesis/FINAL.md:59-106` §4 with artifact paths: `.fence/app-profile.json`, `src/framework/context-budget.yml`, `src/config/severity-policy.json`, `tools/{generate,validate,install}.ts`, `src/adapters/*.yml`, `.fence/state/dial.json`, etc. Remove calendar weeks (neither FINAL commits to them). Remove `vibe-fence.config.yaml` (not in plan). Replace `Muse Spark / Argon` with **Muse Spark 1.3 / Muse Wonder 1.0**. Rename user-facing “Turbo” per S-10 (guarantee-named bands; internal “turbo” ok). Add explicit “must NOT” guardrail callout linking to `synthesis/FINAL.md:126-140` §6. | `synthesis/FINAL.md:59-106, 126-140` + `synthesis-independent/FINAL.md:64-142` |

### P2 — Fix or flag as caveated (misattribution / thin replication)

| # | Location | Fix | Source |
|---|---|---|---|
| **F-07** | Big Picture `93% habituation` + Stream 04 metric `93% on repeated dialogs in software safety studies` | Reframe as: **“~93% acceptance (Anthropic telemetry, May 2026) with ~35% miss on scope/credential exfiltration (Wauters 409k-decision dataset, 2026). Thin replication: carried quantitatively by deepseek + minimax only.”** Do not scope to “non-technical users.” Link to `synthesis/05-companion-ux.md:24, 34`. | `synthesis/05-companion-ux.md:24, 34` + `synthesis-independent/05-companion-ux.md:17, 77` |
| **F-08** | Stream 02 metric `0% accuracy gains across 1,000+ tasks` | Replace with sourced qualitative: **“Ungrounded intrinsic self-critique degrades accuracy (GSM8K 95.5%→89.0%, CommonSenseQA 75.8%→41.8%; Huang arXiv:2310.01798). Mechanical verification (Reflexion/CodeT) is mandatory; debate/MoA are net-negative on interactive path.”** Remove 1,000+ count unless a real source is cited. | `synthesis/02-harness-influence.md:25, 214` + `synthesis-independent/03-elicitation.md:18, 56` |
| **F-09** | Stream 01 metric `Cost increases by 23%` | Add the −3% qualifier: **“Gloaguen et al., arXiv:2602.11988, ETH Zurich — LLM-generated `AGENTS.md` on well-documented Python repos: −3% resolution, +23% token cost.”** Note **contested transfer**: unknown on JS/TS greenfield vibe-coder repos (`synthesis/FINAL.md:42, C-02`). | `synthesis/02-harness-influence.md:38` + `synthesis/FINAL.md:42` |
| **F-10** | Stream 03 metric `Hint-first coaching doubled retention` | Same fix as F-02; de-duplicate to one definition and cross-reference. | `synthesis/05-companion-ux.md:166` |
| **F-11** | Header `Dual Independent Syntheses` badge | Keep badge but add tooltip/footnote: “Independent synthesis = separate aggregation run over same 6 contributor streams, not a separate data collection.” Prevents reading “dual” as “two distinct studies.” | `docs/research/INDEX.md` + `00-meta/LOG.md` |
| **F-12** | Teaching Dial simulator metric row + Turbo gatekeeper recovery promises | Add **persistent disclaimer bar** to the Interactive Sandboxes tab: “Simulated responses and scores are illustrative UX, not the security spec. Enforcement is deterministic and defined in `docs/research/synthesis/04-guardrails.md` + `05-companion-ux.md`. DB snapshots, package-age heuristics, and per-action dialogs are not committed.” | `synthesis/04-guardrails.md:53, 85, 102` + `synthesis/05-companion-ux.md:141` + `synthesis/FINAL.md:126, C-06` |

### P3 — Polish (consistency / hygiene)

| # | Location | Fix |
|---|---|---|
| **F-13** | Token/line terminology drift (`≤400 tokens` vs `under 150 lines` vs `100 lines`) | Normalize to the FINAL-invariant phrasing: **`≤400 tokens (≈100 lines prose — per-stream 200-line variants subsumed)`** with `tools/validate.ts` as the assertion point. (`synthesis/FINAL.md:19`) |
| **F-14** | `vibe-fence.config.yaml` in M1 + `docs/fence/INDEX.md` omission | Align all config references to FINAL paths: `.fence/app-profile.json`, `src/framework/context-budget.yml`, `src/config/severity-policy.json`, `docs/fence/INDEX.md`. |
| **F-15** | Footer date `Completed on 2026-10-20` | Annotate as “Phase 0 synthesis date; explorer generated from FINALs dated 2026-10-20. Not a ship date.” Prevents misreading as launch. |
| **F-16** | Duel filter `All (9)` pill | Cross-check: HTML renders 9 rows (6×100% + 3×unique). Both FINALs carry `14 settled` + `10 contested` + `6 per-stream` syntheses — the “9” is an editorial curation, not a canonical count. Add footnote: “Curated comparison; see FINALs for full S-01…S-14 + C-01…C-10 tables.” |
| **F-17** | `Gloaguen et al. ETH Zurich` vs `ETH Zurich 2026` vs `arXiv:2602.11988` inconsistency | Standardize citation format across all 4 occurrences to **`Gloaguen et al., arXiv:2602.11988 (ETH Zurich/LogicStar.ai, Feb 2026)`** per `synthesis/02-harness-influence.md:38`. |

---

## Appendix: Audit Trail

- Files read in full: `docs/research/synthesis-explorer.html` (989 lines), `docs/research/synthesis/FINAL.md` (144 lines), `docs/research/synthesis-independent/FINAL.md` (176 lines).
- Spot-checked against: `docs/research/synthesis/_CONSISTENCY.md` (contradictions/dedup/blind spots), all 12 per-stream synthesis files (`01-harnesses.md` through `06-meta-models.md` in both `synthesis/` and `synthesis-independent/`), and contributor manifests (`muse-spark-2026-10-20`, `google-gemini-3.8-flash-2026-10-20`, `google-gemini-4-argon-2026-10-20`, `ollama-launch-{deepseek,minimax}-2026-10-20`, `openai-gpt-6-2026-10-20`).
- No files modified except this review. No v2 written per instructions.
- Explorer is high-quality communication work with serious research grounding — its errors are concentrated in **headline quantification and roadmap derivation**, the two places downstream readers are most likely to treat it as authoritative.

*Reviewer disposition: **Approve with 6 P1 fixes (F-01 through F-06) required before v2 citation.** Explorer may be shared as a reading companion with a disclaimer; it must not be linked as the milestone spec.*
