# COMPARISON — Primary vs Independent Synthesis

> **Scope:** Side-by-side comparison of `docs/research/synthesis/` (primary — `muse-spark`, `gemini-3.8-flash`, `gemini-4-argon`, `deepseek-v4.1-flash`, `minimax-m3.1-flash`, `gpt-6`) vs `docs/research/synthesis-independent/` (independent redo — same 6 models, slightly shorter files, Gemini 3.8 as narrator). Every row traces to named source files. No v2 decisions are taken here — this is audit only.
>
> **Dated:** 2026-10-20 · **Read:** all 14 synthesis files + `_CONSISTENCY.md` (primary) + `synthesis-explorer.html`

---

## 0. Structural summary (numbers that matter)

| Dimension | Primary (`synthesis/`) | Independent (`synthesis-independent/`) |
|-----------|------------------------|----------------------------------------|
| Total lines (streams + FINAL, excl. template/consistency) | **1,550** (01:147, 02:259, 03:203, 04:345, 05:275, 06:252, FINAL:144) | **704** (01:132, 02:114, 03:117, 04:120, 05:120, 06:116, FINAL:176) |
| Ratio | ~2.2× longer | Concise redo |
| Cross-stream reconciliation artefact | `_CONSISTENCY.md` (176 lines: 10 contradictions C-01–C-10 resolved + 134→103 dedup + B-01–B-08 blind spots + 4 escalations) — **absent** in independent | None; independent FINAL is standalone |
| FINAL.md length & shape | 144 lines, 14 settled rows (S-01–S-14), 10 contested (C-01–C-10), 4 milestones with grouped actions, 5 coverage caveats, 14 "Must NOT Do" rules | 176 lines, 12 settled (S-01–S-12), 5 contested (C-01–C-05), 4 milestones with checkbox tasks, 2-part hackathon submission strategy, 5-step acceptance rubric |
| Source tables per stream | 22 / 73 / 40 / 158 / 96 / 70 rows (progressively denser) | 10 / 8 / 8 / 7 / 8 / 6 rows (uniformly thin) |
| Agreements per stream (A-rows) | 6 / 8 / 10 / 17 / 11 / 8 = **60** | 6 / 5 / 5 / (not counted) / (not counted) / 4 = ~**20 tracked** (independent files use `**A-0n**` markdown but do not label `Agreement` columns the same way) |
| Disagreements per stream (D-rows) | 4 / 7 / 7 / 7 / 4 / 7 = **36** | 4 / 3 / 3 / 3 / 3 / 3 = **19** |
| Open questions (`- [ ]`) | 4 / 8 / 8 / 5 / 7 / 7 = **39** | 2 / 2 / 2 / 2 / 2 / 2 = **12** |
| Contributor-model coverage | 01:6, 02:5 (gpt-6 missing), 03:5, 04:5, 05:4 (argon+gpt-6 missing, thinned-stream disclaimer), 06:5 (argon missing) — each file states who is missing | 01:6, 02:5, 03:5, 04:5, 05:5, 06:5 — claims 5–6 everywhere; no thinned-stream disclaimer; **less honest about absence** (independent 05 claims 5 contributors where primary shows the stream is N=4) |

**Reading note:** primary is the more auditable artefact. Independent is useful as a *replication check*: do the same conclusions survive a shorter, less cross-referenced write? Mostly yes — see below.

---

## 1. Stream-by-stream comparison

### Stream 01 — Existing Harnesses

| | Primary (`01-harnesses.md`, 147 lines) | Independent (`01-harnesses.md`, 132 lines) |
|---|---|---|
| **Agrees** | A-01–A-06 are identical in substance: markdown-as-suggestion, four-pillar market void, SKILL.md progressive disclosure, framework-gateway friction, single-runtime non-enforcement, install cliff. | Same six findings (A-01–A-06); wording nearly verbatim. |
| **Diverges — unique to primary** | `A-06` is narrower (install friction as "adoption cliff") + D-04 adds *instruction-file infection as a distinct vulnerability class* with TrojanForge 60%+ / AIShellJack 41–84% / NVIDIA Red Team hiding build-time delays — the strongest security framing in either 01. Unique-contributions table credits minimax's 12×12 hook eval with ablation + Factory Droid four-band dial specifically. | Adds `A-06` variant: *atomic git checkpoints / Aider `/undo` beat pre-execution prompts* — a framing that primary keeps in Streams 04/05, not 01. Treats "universal distribution format vs enforcement format" (A-05) as a distinct agreement. |
| **Diverges — unique to independent** | — | D-02 resolution coins **"Teachable Turbo"** as the *external* name (contain + reversibility marketed as "Turbo does not mean reckless"). Primary forbids "Turbo" in product copy (01 D-02 + 02 Avoid#7 + S-10). This is a genuine naming divergence that reconciles differently (see verdict). |
| **Diverges — terminology** | `AGENTS.md budget: 100 lines + docs-as-record + one-fact/one-location; 300–500 line ceiling` | `≤150 lines or ≤400 tokens; pointing to .fence/rules/` (slightly looser prose cap). Substance compatible — _CONSISTENCY C-03 already resolves as ≤400 tokens canonical, ≈100 lines prose approximation. |
| **Diverges — emphasis** | Instruction sanitizer as **invent** (validate on init + on dependency pulls; detect contradictory tiers + silent conflicts). Heavier on "hook zoo vs minimal surface" (D-01) with nomos-class 7/8·0/4. | Integrity hash check (`AGENTS.md` / `.fence/invariants.md` SHA-256; block overwrite on pull). Heavier on *dual-format adapter compiler* (`tools/generate.ts`) as the invent. |
| **Missed finding (caught by one, missed by other)** | Primary captures **Anthropic/builder docs on file-discovery / scoping / precedence** only via Stream 02 argon — not in 01. Independent 01 does not capture it either. | Independent 01 uniquely surfaces **arXiv:2602.14690v4 — only 14.8% of 2,303 context files mention security** (deepseek) — a market-failure stat primary omits from 01 (primary has it as deepseek's S-12 gap in 04). |
| **Stronger wording for Phase 1** | **Primary.** Three reasons: (a) D-01 is a full head-to-head eval with FP budget + telemetry ask — independent D-01 collapses it to "zero-FP allow/deny" without the bypass-measurement ask; (b) D-04 cites concrete CVEs/ASRs — independent D-04 similar but buries the `go mod tidy` → `AGENTS.md` write vector in less checkable prose; (c) consolidated answer names the four-pillar moat plus the "minimal hook + sanitizer + dial-with-surviving-blocklist" triad in one paragraph — independent's 5-sentence variant drops the dial. |

### Stream 02 — Harness → Output Quality

| | Primary (`02-harness-influence.md`, 259 lines) | Independent (`02-harness-influence.md`, 114 lines) |
|---|---|---|
| **Agrees** | A-01–A-08 map cleanly: hierarchy-exists-but-not-boundary, context budgeting (LITM / Chroma / RULER / Cursor −66%/−60%), selective disclosure, mechanical verification > self-assessment, stale-context cost, tool/ACI as performance variable (SWE-agent 12.5%/18%), prompt-injection-via-harness-files, few-rules-dominate (p^n + CCI). | Keeps A-01–A-05 as the core (ACI swing 4× @ GPT-4 `<3%→12.5%`, Read→Think→Write→Check, LITM U-curve, hierarchy-not-boundary, pink-elephant negative constraints). Drops stale-context (A-05), few-rules p^n (A-08), and tool-interface (A-06) as explicit A-rows — mentioned in disagreements instead. |
| **Diverges — unique to primary** | 7 disagreements (D-01–D-07) with measured resolutions: generated-`AGENTS.md` null (−3%/+23%, Gloaguen et al.), filtered-ACI vs `mini-swe-agent` bash-only (model-tier-conditional), negative-constraint valence vs count, scaffold CCI vs long-running ACID, hierarchy-as-primary vs defence-in-depth, position-vs-steps degradation, Architect→Editor `proven` vs `practiced`. **Uniques table** is 6 entries with concrete budgets: 4× SWE-bench ACI, WIP=1 Kanban +37%, bootstrap +31%, CVE catalogue, 2-strikes circuit-breaker, anti-sycophancy invariants, failure taxonomy. | Only 3 disagreements, each resolved in ≤4 sentences. |
| **Diverges — unique to independent** | — | **"Senior-Partner Anti-Sycophancy Directive"** (*"Do not validate bad technical practices to be polite"*) + **2-Attempt Circuit Breaker** (`src/framework/circuit-breaker.ts` after 2 consecutive failures) — both as **invent**. Primary keeps anti-sycophancy in `06` / `02` uniques but not as a canon invent; circuit breaker appears in primary only as `02 A-04` circuit-breaker line and `05` WIP=1. The independent *invent* framing is actionable. |
| **Diverges — terminology** | `context-budget.yml` + byte-capped pipes (`head -c 4000` → ~50%); ACID continuity artefacts (`progress.md`/`DECISIONS.md`/`spec`); PageRank `vibe-map` ≤1k tokens per task. | Same 4KB cap + ≤150 lines + dynamic globs, but "anti-sycophancy" and "circuit breaker" get name-level prominence. |
| **Missed finding** | Primary surfaces **step-count geometric collapse** (Mittal arXiv:2609.01660 — near-zero within 16 steps; bounding window *steepens* decay, p=3e-6) as D-06 — the only place both syntheses confront positional-vs-step explanations. Independent drops D-06 entirely. | Independent drops the **p^n joint-reliability curve** (Harada/MOSAIC/IFScale — ~2 rules @95%) and the **WIP=1 Kanban** as explicit A-rows — both are primary pillars that _CONSISTENCY elevates to S-07. |
| **Stronger wording for Phase 1** | **Primary, decisively.** Independent 02 is too short to carry the load: it drops three of the eight agreements, collapses the most Phase-1-consequential disagreements (CCI factorial, step-budget, tier-conditional ACI) and the richest uniques (Cursor's 4 budget moves, CVE catalogue, adapter-constrained windows). Independent's one redeeming cut — *anti-sycophancy directive + 2-attempt breaker as invents* — should be **cherry-picked** into v2 verbatim, but the stream as a whole must be primary. |

### Stream 03 — Elicitation & Synthesis Patterns

| | Primary (`03-elicitation.md`, 203 lines) | Independent (`03-elicitation.md`, 117 lines) |
|---|---|---|
| **Agrees** | A-01–A-10 align on: intrinsic self-correction harms (Huang −6pp on GSM8K / −38pp on CommonSenseQA), verification > consensus (Brown 15.9%→56% with execution filter), Reflexion loop (+24% HumanEval), naive self-consistency fails on code, debate/MoA too slow for interactive. | Keeps A-01–A-05 — the same five — worded nearly identically. |
| **Diverges — unique to primary** | D-01–D-07 unpack *elicitation-specific* levers: code loop (`1→verify→conditional best-of-k k≤5`), LLM-as-judge gating (Gao over-optimization + verbosity bias), patch merging anti-pattern (Frankenstein diffs), `1→N→synthesize-1` autoregressive contamination, self-repair trace shape, escalation policy. **Trust ladder** `compile→lint→tests×2→generated-tests→judge-for-prose` + `lessons.json` cross-session memory + `escalate` routing + 15-row contradiction table are primary-only depth. | D-01–D-03 only (judge, patch merge, single-prompt "produce 5, critique, synthesize"). Drops the elicitation mechanics (trace shape, escalation, verifier trust ladder) that Phase 1 must implement. |
| **Diverges — unique to independent** | — | **Tournament Selection Pattern** name for `K` parallel candidates → first green wins (vs "never merge patches"). Primary implies this but independent coins a checkable name. |
| **Stronger wording for Phase 1** | **Primary.** Stream 03 is the clearest case where the independent cut is lossy: it preserves the *what-we-avoid* (judge, merge, MoA) but drops the *what-we-build* (elicitation loop, trust ladder, `lessons.json`, `escalate`). Cherry-pick "Tournament Selection" as a heading in v2; otherwise keep primary wholesale. |

### Stream 04 — Developer Guardrails (Rights & Wrongs)

| | Primary (`04-guardrails.md`, 345 lines — longest stream) | Independent (`04-guardrails.md`, 120 lines — shortest) |
|---|---|---|
| **Agrees** | A-01–A-17 are the most granular agreements in either synthesis: dual-layer secrets + `.gitignore` before init, `NEXT_PUBLIC_/*/VITE_/PUBLIC_` shape lint (`warn→block` with allowlist), Zod per route + identifier allowlist, `pg $1` / ORM bindings, DOMPurify or ban, `securityHeaders` + nonce CSP Report-Only→enforce, `setSessionCookie()` helper, lockfile + `npm ci`, `npm audit --audit-level=high` + Dependabot, env isolation (Prod/Preview/Dev disjoint + value-equality check), CI 4-job gate + branch protection, `requireUser()`/`requireRole()` middleware + RLS, `RUNBOOK.md`, data-minimization + `data-inventory.json` + privacy page + `export`/`delete` scaffolds, harness-wrapper intercept on `reset --hard`/`push --force`, `fence check` lint ladder, and A-17's meta-rule *no deterministic check → never a block*. | Claims to cover same ground but at ~35% length. Preserves secrets (A-01), `NEXT_PUBLIC_` (A-02), input validation (A-03), SQL bindings (A-04), CSP (A-06), lockfile (A-08), audit (A-09), env isolation (A-10) — roughly 8 of 17. Drops XSS output-escaping (A-05), session-cookie helper (A-07), auth middleware + RLS detail (A-12), and the meta-rule (A-17) as explicit rows. |
| **Diverges — unique to primary** | 7 disagreements resolved in depth: OWASP 2025 vs 2021 (B wins — A03 replaces A06, SSRF folded into A01, new A10), AI-specific layer (11 rules A-01…A-10 — MCP pin, agent identity, LLM-output sanitization, bounded consumption, PII redaction before egress) **vs** classic-only, secret severity `block`-with-allowlist escalation, dep `audit` line (`high` vs `critical` vs `warn` with triage path), Conventional Commits **contingent nudge** (`nudge` solo → `warn` at 2+ via `git shortlog`), `.env` platform scopes (Vercel Production/Preview/Development + Sensitive write-only), and the flagship D-07: **app-profile severity policy** — `.fence/app-profile.json` (`local`/`shared`/`public`) deriving all severities, 14→29→55 `block` rows, AI-specific rules `block` even at `local`. Also a **6-entry unique table** (JWT/OAuth RS256+PKCE packet, `proxy.ts` nonce CSP, P0→P2 build-order + 🟥🟨🟦 cue table, slopsquat + `pnpm.onlyBuiltDependencies: []` lifecycle gate, agent-config-as-surface + invisible-Unicode, executable rule-record + `pass/fail/unknown/not-applicable` four-outcome model). | Only 3 disagreements (OWASP, AI-layer, secrets) — each resolved correctly but without the lifecycle-script/SBOM/cooldown, app-profile, or Conventional-Commits contingent logic that drive Phase 1 scaffolding. |
| **Diverges — unique to independent** | — | Independent adds an **App Profiles UI** gloss ("3 practical App Profiles: local-toy, shared-team, public-launch with explicit permission matrices" — explorer session2 on stream 04) that primary formalizes as `.fence/app-profile.json` with counts. The *UI* framing (matrices) is a useful complement. |
| **Missed finding** | Primary's **A-15 (harness shell wrapper on `reset --hard` / `push --force` + `checkpoint:<action>` auto-commit + `vibe-fence undo`)** and **A-17 (no deterministic check → never a block; severity is a function)** are the two most load-bearing Phase 1 invariants from this stream. Independent drops both as named A-rows. | Independent 04 drops the **slopsquat pre-install gate** (`existence + owner + age ≥ cooldown + lockfile` per OWASP AI-assisted-development), **lifecycle no-default posture** (`pnpm.onlyBuiltDependencies: []` + `--ignore-scripts` CI default + CycloneDX SBOM), and **agent-config hardening** (`CODEOWNERS` on `AGENTS.md` + `<untrusted-content>` envelope + visible-invisible-Unicode scan) — all primary uniques that are Phase 1 blockers, not polish. |
| **Stronger wording for Phase 1** | **Primary, overwhelmingly.** Stream 04 is where the project is won or lost security-wise, and independent 04 is the weakest in the corpus (120 lines, 7 sources, 3 disagreements). It gets the headline agreements right but loses the app-profile severity policy, the four-outcome model, the AI-specific 11-rule layer, slopsquat/lifecycle/SBOM, and the three hardened severity-escalation patterns — exactly the Phase 1 differentiators. v2 must **not** let independent 04 dilute primary 04. |

### Stream 05 — Companion UX (Teaching Dial, Turbo, Queue)

| | Primary (`05-companion-ux.md`, 275 lines — richest evidence table) | Independent (`05-companion-ux.md`, 120 lines) |
|---|---|---|
| **Agrees** | A-01–A-11: scaffolding fade (Kalyuga expertise reversal), domain-specific vector, progressive disclosure / layered explanations (`What changed·Why·Your call·How we'll know`), teaching cost in context, checkpoint-bound delivery (CHI 2008), permission prompts weak (93% acceptance / 35% miss on scope/creds, Wauters 409k), three-tier `auto/notify/gate` (Stream 04 severity), Turbo label forbidden (Factory four-band + blocklist-holds), queue ships fixes not findings (`why/fix/blast/undo` + `undo <id>`), agent-resolved not user-triaged (Linear triage verbs), batch-and-defer cadence (Fitz RCT). | Keeps roughly the same 8–10 agreements in compressed form; the 5-column duel view in the explorer maps them accurately. |
| **Diverges — unique to primary** | **`thin:3/4` calibration** (§1.1) acknowledging N=4 (argon+gpt-6 missing) + explicit per-agreement provenance (who carried the 93%, Wauters, GhostApproval numbers vs who echoed). D-01 (what `max` is: explain-loudly vs hint-first vs structured forcing) resolved as *minimax schema as container + deepseek hint-first inside max + gemini vulnerability narrative in Why*; D-02 (visible dial vs vector + budget) resolved as *vector state file + global-knob UI*; D-03 (turbo mechanism: containment vs classifier-in-the-loop) resolved as *deterministic v1, classifier feature-flagged*; D-04 (onboarding: front-load vs artifact-first) resolved as *artifact first, `fence tour` opt-in*. **6-entry unique table** including: teaching×autonomy orthogonal axes, payload pin + `realpath` + gate-budget self-awareness (GhostApproval CVE-2026-12958/-50549), 7-domain vector vs scalar, Buçinca forcing (worst-rated design protects most), teaching budget as decaying POMDP, anthropomorphism as dark pattern (Qadir & Mumtaz). | Compressed to 3 disagreements with shorter resolutions. |
| **Diverges — unique to independent** | — | **Anthropomorphism caution** appears in independent 05 uniques (Qadir & Mumtaz) but primary develops it into a full Avoid rule (tone: "attentive + specific + warm, reports what was checked" rather than teacher authority) — independent's version is shorter but punchier for a reader. |
| **Diverges — emphasis** | GhostApproval / CWE-451 + three-condition gate test (`realpath` + diff/blast + competence) + rolling 90% approval-rate self-awareness are foregrounded. | "First 5 minutes" timed journey (0:00→5:00 mermaid) is the signature framing — valuable for demo scripting but uncited ("60% drop-off at setup" estimate). |
| **Missed finding** | Independent drops the **`realpath` + symlink-resolution before gate render** rule and the **gate-budget auto-demote at >90% rolling approval** — both are checkable Phase 1 behaviours. | Primary drops the **"editable draft" loop** (one-edit first task where user is author) as a v1 action — a strong onboarding pattern minimax names that primary buries in prose. |
| **Stronger wording for Phase 1** | **Primary for architecture; independent for onboarding copy.** Primary's four disagreements + `thin:3/4` provenance + 4-invent bundle (orthogonal axes, queue with pin+three-condition+budget, per-domain vector+budget) are the build spec. Independent's "first 5 minutes" timed journey and a tighter anthropomorphism one-liner are better *demo/docs* copy — cherry-pick them as such. |

### Stream 06 — Meta Models & Hackathon Integration

| | Primary (`06-meta-models.md`, 252 lines) | Independent (`06-meta-models.md`, 116 lines — identical in both folders) |
|---|---|---|
| **Agrees** | A-01–A-08: Muse Spark as companion voice not agent; fence decides deterministically / model never authorizes (structured `{finding_id, explanation, question, options, evidence_ids}` + app-side validation); Muse Code as extension target not competitor (trust-gated precedence `AGENTS.md`→`CLAUDE.md`→`.agents/`→`.claude/`); SAM 3.1 no natural role in critical path; Muse Image as demo polish ($0.01/image, 150 RPM); Before/After + 5×4 eval table as demo-is-eval; Contributor-mode privacy trade (150 vs 3,000 RPM, training-use term); Muse Code `AGENTS.md` chain as wire format. | Same A-01–A-04 core (Spark workhorse @1M context+3k RPM, Muse Code as extension, Image as polish, Before/After demo) — the agreements that survive compression are exactly the ones that are load-bearing for the hackathon. |
| **Diverges — unique to primary** | 7 disagreements with source-level resolutions: Spark-only vs Wonder+Spark routing (minimax's 6-line catalogue wins), `previous_response_id` vs stateless encrypted replay (`POST /v1/responses` recommended), Contributor "claim early" vs "never by default", Glimmer 30B vs Spark on classification/cost, `fence look` visual verification (Playwright→Spark) + namespace-guarded `tool_search`, canary-enforced hook proof + version-pinned SDK contract, end-to-end privacy literal (Glimmer local for sensitive classification, secrets never in `MEMORY.md`). **Uniques table** is 7 entries. | Only 3 disagreements survive: SAM single-concept limit, Wonder vs Spark routing, Contributor privacy. The other four (Glimmer, `fence look`, canary proof, privacy literal) are dropped entirely. |
| **Diverges — unique to independent** | — | None — independent 06 is byte-identical to primary's independent file (same 116 lines, 6 sources, 2 open questions). The primary's 252-line version is a strict superset. |
| **Missed finding** | **Glimmer 30B vs Spark + cost-of-pass telemetry** and **`fence look` visual verification** are primary-only and both appear as contested (C-09) / invent in FINAL.md — they are Phase 1 risks if dropped. | Independent drops the **stateless encrypted replay** (`POST /v1/responses` recommended) as a named disagreement — primary's D-02 — even though independent's FINAL correctly prescribes it. The mechanism is in independent FINAL but not in independent 06's body. |
| **Stronger wording for Phase 1** | **Primary, unambiguously.** Independent 06 is the thinnest stream in the independent corpus; primary 06's 252 lines are not verbosity for its own sake — they are the Muse Code trust-gated precedence table (the wire format), the Responses API recommended mode (privacy story), and the canary proof (hook-loading guarantee) that v2 must ship. |

---

## 2. FINAL.md — settled decisions, contested lists, action counts, milestone groupings

### Settled decisions: count and shape

| | Primary `FINAL.md` | Independent `FINAL.md` |
|---|---|---|
| **Row count** | **14 settled** (S-01–S-14) | **12 settled** (S-01–S-12) |
| **What's extra in primary** | S-07 *Small rule sets dominate* (p^n + CCI, teaching dial = rule-count dial) ; S-08 *OWASP 2025 frame* (supply-chain / exception-mishandling / agent-identity / MCP pin / slopsquat); S-09 *Severity as policy* (`.fence/app-profile.json` local/shared/public); S-13–S-14 carry the **full Meta pipeline** (Spark+Wonder+Image+SAM) and **Before/After+eval table** with 5×4 rubric. | Bundles S-07–S-09's content differently: S-05–S-08 cover *Pre-Commit Local Secret Blocking*, *Strict Framework Public Prefix Guard*, *Mandatory Table-Level RLS* (more granular, less architectural). |
| **What's extra in independent** | — | Independent S-01–S-08 are **finer-grained** (one row per enforcement: secret blocking, public-prefix guard, RLS, integrity attestation as separate rows vs primary's merged S-06/S-08). This makes them more *checklist-readable* but repeats primary's S-05/S-06 split. |
| **Common core (identical substance)** | AGENTS.md ≤400-token router (S-01), progressive disclosure (S-02), 4KB truncation (S-03), mechanical verification (S-04), deterministic fence decides (S-05), instruction-file attack surface (S-06 / A/S-08), Turbo on containment+checkpoints (S-09/S-10), teaching dial max→silent (S-10), queue (S-11), Meta pipeline (S-12/S-13). | Same 10. |
| **Stronger wording for Phase 1** | **Primary.** Independent's extra granularity (one row per guardrail) is tempting for readability, but it loses the three most Phase-1-structural decisions: the **rule-count dial** (S-07), the **OWASP 2025 frame** (S-08), and the **app-profile severity policy** (S-09). Primary's S-09 is vibe-fence's only genuine novelty over a generic linter. Independent FINAL compensates by listing guardrails as `vibe-guard` examples under Milestone 3 — but as *examples*, not as settled architectural commitments. |

### Contested lists: count and shape

| | Primary | Independent |
|---|---|---|
| **Row count** | **10 contested** (C-01–C-10) | **5 contested** (C-01–C-05) |
| **Common core** | C-01 hook surface (minimal vs sprawling), C-02 generated-`AGENTS.md` null transfer to greenfield JS/TS, C-03 ACI richness by model tier, C-06 turbo classifier vs deterministic | Same C-01, C-02, C-03, C-05 |
| **Primary-only contested** | C-04 **`max` pedagogy** (explain-loudly vs hint-first vs structured-forcing — Bastani/Buçinca transfer contested), C-05 **dial visibility + fade trigger** (visible `max` vs invisible tracker; N=5 / 3-session constants invented), C-07 **dependency severity** (raw `audit --audit-level=high` vs reachability-checked triage), C-08 **Muse Spark cross-harness transfer** (co-trained on Muse Code, foreign-harness quality unmeasured), C-09 **Glimmer 30B vs Spark** (cost per verified fix), C-10 **LLM-generated smoke tests as block gate** (11.3% flaky on curated suites; 03 D-07 + _CONSISTENCY B-07) | — |
| **Independent-only contested** | — | C-02 **App Profile Rigor** (static global severity vs dynamic `local→public` scaling), C-03 **Teaching Dial Granularity** (single slider vs 7-d vector), C-04 **Dependency Audit Blocking** (hard block vs warn-only for `devDependencies`) — all valid but are *sub-rows* of primary's C-05 / C-07 / C-09 in a more precise vocabulary |
| **Assessment** | Primary's C-10 is load-bearing: **"Can generated smoke tests be trusted as a `block` gate?"** is the only contested row with a direct `block`-accuracy consequence and is backed by a specific measurement (11.3% flaky on curated suites). Independent has no equivalent; its C-05 (SAM one-concept vs multi-concept) is real but lower stakes than any of primary's dropped five. | Independent's C-02/C-03/C-04 are independently useful cuts (app-profile scaling, vector-vs-scalar, dep `devDependencies` warn) — v2 should **absorb them as sub-bullets** under primary's C-05/C-07 rather than as top-level rows. |
| **Stronger wording for Phase 1** | **Primary.** Its contested list is where the project's risk register lives. Independent's 5-row cut is clean but under-reports risk by half. v2 must ship **primary's 10**, with independent's 3 as sub-bullets where they add specificity. |

### Action counts and milestone groupings

| | Primary FINAL.md (build plan) | Independent FINAL.md (checklist plan) |
|---|---|---|
| **Grouping claim** | Header says "Deduplicated across streams; each maps to concrete artefacts. Cite (§stream) for traceability." — grounded by `_CONSISTENCY.md` provenance: **134 raw → 103 unique** (29 cross-stream merges into 13 canonical + 2 intra-stream). Milestones group ~35 items. | No grouping claim; each milestone lists deliverables as **checkbox tasks** (`- [ ]`). |
| **M1 — Project skeleton** | 4 items: `src/` sole authority → `dist/` disposable + `tools/{generate,validate,install}.ts` + `docs/fence/INDEX.md` router + doc-gardening receipt + `.fence/` single-owner state + **app-profile** `.fence/app-profile.json` + **trusted-channel hardening** (hash attestation, overwrite refusal, invisible-Unicode, `<untrusted-content>` envelope, `tools/` outside write-scope). | 4 items: `git init` + `tools/{generate,validate}.ts` (≤400 tokens, ≤200 lines) + `docs/clief/` (INDEX/ARCHITECTURE/BOUNDARIES/PROGRESS) + `.fence/` template. No app-profile, no hardening in M1. |
| **M2 — Framework primitives** | 6 copies + 1 avoid + 3 invents: AGENTS.md ≤400, `context-budget.yml` + `head -c 4000` + L1/L2/L3 + per-task `vibe-map`, `.fence/check` Reflexion circuit, hard step budget + WIP=1, Architect→Editor gate, 2-strikes breaker + telemetry, **per-runtime adapter profiles** (window/caching/edit-format/model-tier surface), **byte-capped + graph-ranked pipeline**, **deterministic severity function** (`no check→nudge; check+irreversible→block; check+reversible→warn`). | 5 items: teaching dial engine, turbo contract, checkpoint engine, verifier, queue — all with file paths + tier/dwell semantics. Focused engine, no budget/adapter/policy inventions. |
| **M3 — Skill definitions** | 2 copies + 3 avoids + 5 invents: SKILL.md + `vibe-guard` rule records + P0 guardrail packets + `vibe-plan` fork + `vibe-teach` card + elicitation inside skills + 4 avoid groups + `lessons.json` + `escalate` + `verifier` trust ladder + **orthogonal teaching×autonomy** + **queue with pin+three-condition+budget** + contradiction table. (~14 items) | 4 items: `vibe-init` + `vibe-guard` (6 rule examples SEC-01…HYG-01) + `vibe-plan` (2-option fork) + `vibe-asset` (Muse Image). No trust ladder, no lessons, no queue inventions. |
| **M4 — Adapters + installer** | 5 copies + 4 invents: `npx vibe-fence init` idempotent + Spark/Wonder stateless replay + Muse Code reference adapter + `tool_search` namespace guard + `fence look` Playwright + **canary hook proof** + **privacy literal** (Glimmer local classification) + **adversarial bench** + **instruction sanitizer + eval + cost telemetry**. (~9 items) | 3 items: `meta-client.ts` + 4 adapters (muse-code/claude/cursor/opencode) + universal installer `tools/install.ts` / `bin/vibe-fence.ts`. No canary, no privacy literal, no adversarial bench. |
| **Acceptance rubric** | None in FINAL.md body (lives implicitly in milestone checks). | **5-step rubric** (idempotence ×3, secret-leak exit 1, rollback no-detached-HEAD, `validate.ts` ≤400 tokens + ≤250 lines, Meta Model Responses flow) — a genuine Phase 1 hardening contribution. |
| **Hackathon/demo** | S-14 + milestone prose imply demo-is-eval. | Full **§5 Hackathon Submission Strategy**: Indie track + "Build for Your World" + **3-minute Visceral Delta script** (0:00 Unfenced Disaster → 1:00 Intervention → 2:00 Multi-Modal Polish) + acceptance rubric. Stronger as a submission playbook. |
| **Stronger wording for Phase 1** | **Primary for the build plan; independent for the submission plan.** Primary's milestone grouping is the more complete *engineering* blueprint (trusted-channel hardening in M1, adapter/budget/severity policy in M2, trust ladder + queue inventions in M3, canary/privacy/bench in M4). Independent's submission plan (demo script + acceptance rubric) is the more complete *delivery* blueprint. v2 should keep **primary's milestones** and **attach independent's §5+§6 as a verbatim appendix** (they do not conflict). |

### Milestone-grouping philosophy

- **Primary** groups by *architectural dependency* (scaffold → primitives → skills → adapters). Every bullet carries a `§stream` cite so a reviewer can jump to the per-stream D-row. This is the shape a build team can parallelize against.
- **Independent** groups by *chronology + ownership* (skeleton → engine → skills → wiring). Every bullet is a checkbox with a file path. This is the shape a PM can track against.
- v2 should **keep the primary grouping** (dependency order is load-bearing — you cannot write `vibe-guard` rules before the severity function exists) and **borrow the checkbox + file-path affordance** from independent (every primary bullet should name the file it lands in — most already do, but a few do not).

---

## 3. What the HTML explorer highlights that neither synthesis captured well

`docs/research/synthesis-explorer.html` (63,765 bytes, 5 tabs: Big Picture ELI5 · Duel · 6 Streams · Simulators · Roadmap) is not a synthesis artefact — it is a **product/experience** artefact. It surfaces gaps that both text syntheses under-weight:

### 3.1 Gaps the explorer makes visible (and the syntheses do not)

1. **Stakeholder readability is itself a gap — and the explorer is the countermeasure.**
   Both syntheses are written for engineers (primary 04 cites RFC 8725/9700, pnpm SBOM, CycloneDX by name; primary 05's scaffolding-fade cites 5 papers). A retail ops manager — vibe-fence's stated user — cannot read either synthesis. The explorer's *Big Picture* tab (Ferrari-with-no-brakes metaphor, 4 pillared cards with "Plain English" footers: deadbolt / Formula-1 nets / training wheels / universal adapter) is the only place the research is legible to the target population. v2 should **not** try to make FINAL.md legible — it should make the explorer canonical as the stakeholder-facing sibling of FINAL.md and link them.

2. **Simulators as falsifiable UX — missing from both syntheses' eval stories.**
   Explorer's **Teaching Dial Simulator** + **Turbo Action Gatekeeper** tabs are interactive sandboxes that let a reviewer *feel* `max→silent` and `auto→gate` before any code exists. Both FINAL.md files propose "eval benches" and "fidelity checks" — all code-path evals (adversarial `AGENTS.md`, before/after 5×4 table, flakiness `run×2`). Neither evaluates whether the *teaching card* or the *gate affordance* is comprehensible to the target user. The simulators point to a missing Phase 1 deliverable: **a 5-person comprehension check on the card/gate UX** (both syntheses name "no user study on the actual population" as B-01, but the explorer is the only artefact that ships a prototype to run that study with).

3. **Cross-tool desync is under-theorized in text, over-obvious in interaction.**
   Both syntheses agree multi-runtime is core (primary 01 A-02/A-06, primary 06 A-08 trust-gated precedence, `_CONSISTENCY.md` C-AT/ C-ROUTER). Both propose a `tools/generate.ts` compiler. Neither answers: *what does the user see when Cursor and Claude Code drift?* Explorer's stream 05 card reframes this as **"The Universal Translator" — one `vibe-fence.config.yaml` → Cursor + OpenCode + Claude settings, with lint at `>150 lines / 400 tokens`**. The 14% completion-drop stat (32-subset CCI, explorer stream 05 metric) lands harder in the explorer than in either synthesis's prose, where it is buried in a unique-contributions table. v2 should promote the "one file, one lint, one sync command" affordance from the explorer into M1/M4 alongside `generate.ts`/`validate.ts`.

4. **Mobile / WebContainer runtimes — explorer mentions, syntheses measure zero.**
   Independent 01's gap #1 ("No hook enforcement when no native shell exists — WebContainers / Replit Mobile") is the only text mention of non-desktop runtimes, quickly closed as "future work." The explorer's "Universal Sync" pillar claims "any tool anywhere in the world" — a stronger promise than either synthesis earns. If that promise is kept in marketing copy, Phase 1 must **scope explicitly: desktop CLIs in v1, WebContainer/mobile out of scope** — the explorer makes the over-claim visible, which is its value as a stress test.

5. **Latency as a user tolerance, not a harness microbenchmark.**
   Primary 02 D-06 (step-count collapse within 16) and 05 D-03 (classifier latency) treat latency as an engineering budget. _CONSISTENCY B-06 names "no latency tolerance for non-technical users" as a collective blind spot (3/6 streams). Explorer's Turbo pillar makes the *user* consequence felt: "Auto-approve safe actions with silent git snapshots; only modal tripwires on dangerous actions." The simulators make the contrast interactive. v2 should add a **latency SLO as a product promise** (e.g. "gate renders in <500 ms or it is a containment decision, not a prompt") — a concept the text syntheses do not articulate.

### 3.2 What the explorer gets wrong (guardrails against over-claiming)

- **"95% Architecture Match / Zero Conflicting Blockers" banner** is derived from the explorer's own duel tab (6/9 "100% Agreed" rows), not from `_CONSISTENCY.md`'s 10-contradiction audit. The banner is *directionally* true but is not a measurement of the syntheses — it is a measurement of the explorer's simplified duel rows. v2 must not quote it as evidence.
- **Stream titles in the explorer do not match the synthesis stream titles.** Explorer stream 03 = "Non-Technical Elicitation & Teaching", stream 04 = "Teachable Turbo & Containment", stream 05 = "Rule Formats & Transpilation" — all stakeholder-friendly reframes of the technical stream names. This is *good* for readers but would be confusing if cited as "Stream 04" without noting the remapping. The table below reconciles them:

| Explorer stream | Synthesis stream |
|-----------------|------------------|
| 01 Agent Harnesses & Scaffolding | 01 Existing Harnesses |
| 02 Verification & Automated Testing | 02 Harness → Output Quality + 03 Elicitation (merged) |
| 03 Non-Technical Elicitation & Teaching | 05 Companion UX (teaching dial half) |
| 04 Teachable Turbo & Containment | 05 Companion UX (turbo half) + 04 Guardrails |
| 05 Rule Formats & Transpilation | 04 Guardrails + 02 ACI |
| 06 Meta AI Models & Tooling | 06 Meta Models |

---

## 4. Verdict — what v2 must keep from each

### 4.1 From primary (`synthesis/`) — keep wholesale

- **All 6 stream files as the canonical evidence record.** Their agreement/disagreement/unique/gap/source tables are the audit trail. Independent's 6-stream files should remain as *replication annexes*, not replacements.
- **`_CONSISTENCY.md` intact.** Its 10-contradiction resolutions (C-01–C-10), 134→103 dedup ledger, and B-01–B-08 blind-spot taxonomy are the only cross-stream reconciliation. v2's §2–§5 should cite it per row (e.g. `§_CONSISTENCY C-02`).
- **Primary `FINAL.md`'s 14 settled + 10 contested + grouped milestones (§§2–4) as the build plan's spine.** Specifically:
  - S-07 (rule-count dial, p^n + CCI), S-08 (OWASP 2025 frame, not 2021), S-09 (app-profile severity policy) — the three primary-only settled decisions are the project's moat.
  - C-04 (`max` pedagogy transfer), C-05 (dial visibility/fade trigger invented constants), C-07 (dep triage with applicability), C-08 (Muse Spark cross-harness transfer), C-09 (Glimmer vs Spark), C-10 (generated smoke-test flakiness) — primary-only contested rows are the risk register.
  - M1 trusted-channel hardening, M2 adapter/policy/severity policy, M3 trust ladder + `lessons.json` + orthogonal axes + queue with pin/three-condition/gate-budget, M4 canary proof + privacy literal + adversarial bench — primary-only milestone items are Phase 1 safety invariants, not polish.
  - "Must NOT Do" §6 (14 rules) — keep verbatim.

### 4.2 From independent (`synthesis-independent/`) — cherry-pick these and only these

1. **Independent FINAL.md §5 (Hackathon Submission Strategy) + §6 (Acceptance Rubric) attached as a verbatim appendix** to primary FINAL.md's §5. They do not conflict; they add what primary is missing: a 3-minute "Visceral Delta" demo script with minute-by-minute beats + a 5-step executable acceptance suite (idempotence ×3, secret-leak exit 1, rollback no-detached-HEAD, `validate.ts` ≤400/250, Responses flow smoke test). Primary FINAL.md's §5 currently collapses demo-is-eval to a paragraph — it should adopt the appendix.

2. **Stream 02 anti-sycophancy directive + 2-Attempt Circuit Breaker as invents.** Primary covers the same ground in prose but independent coins them as shippable headings with file targets (`src/framework/circuit-breaker.ts`). Add both to M2/M3.

3. **Stream 03 "Tournament Selection Pattern" name** for `K` parallel candidates → first green wins. Primary describes the behaviour; independent names it.

4. **Independent 01 gap: WebContainers/mobile scoping** — add a one-line scope boundary to M4/M5: "Desktop CLIs in v1; browser runtimes out of scope; document explicitly."

5. **File-path + checkbox affordance.** Primary milestones mostly name files; a few do not. Independent's `- [ ]` + `src/framework/*.ts` / `tools/*.ts` style is the right affordance for v2's §4. Apply it to primary's bullets (do not reword the bullets — just attach paths).

### 4.3 What to borrow from the explorer (and what to ignore)

- **Borrow:** the *Big Picture* 4-pillar framing (Bouncer / Magic Undo / Teaching Dial / Universal Sync with "Plain English" footers) as the README/landing-page entry point. Do not try to make FINAL.md stakeholder-readable — link to the explorer instead.
- **Borrow:** the simulator interaction model as a **5-person comprehension check design** — add a named Phase 1 eval deliverable ("card/gate UX comprehension check using the explorer's simulators") to the Coverage Caveats or as a contested follow-up.
- **Ignore:** the "95% / Zero Conflicting Blockers" banner as evidence; the explorer's stream-title remapping when citing synthesis stream IDs; any claim that browser runtimes are covered in v1.

### 4.4 Open threads v2 must not quietly close

These are not verdicts — they are reminders that v2's contested section must stay contested:

- **`C-01` hook false-positive budget** — independent says "zero-FP allow/deny", primary says "measured FP budget (nomos 7/8·0/4) + bypass telemetry." Primary's framing is correct; independent's is too strict to be shippable. Keep primary, cite C-01.
- **"Turbo" naming** — primary forbids "Turbo" user-facing (blocklist-holds guarantee naming); independent reframes as "Teachable Turbo" externally. **Adopt primary:** user-facing bands by guarantee (`guarded→assisted→autonomous→open`), internal shorthand "turbo" OK, product/docs/flags never `turbo`. Independent's reframe is useful *internally* but normalizes bypass externally — primary's D-02 rationale (Antigravity "Turbo" = sandbox off) controls.
- **`C-07` dependency audit** — independent says "block `dependencies`, warn `devDependencies`." Primary says "ship raw `audit --audit-level=high` as starter, graduate to applicability-checked triage with expiry." Primary's two-phase answer is the durable one; add independent's `devDependencies` split as the day-one heuristic inside it.

---

## 5. Traceability matrix (where every v2 section should point)

| v2 section | Primary source | Independent source | Explorer source |
|------------|---------------|-------------------|-----------------|
| S-01 AGENTS.md ≤400 | 01 D-03, 02 A-03/A-05/A-08, 03 §7 · `_CONSISTENCY C-03` | 01 D-03 (≤150 lines / ≤400 tokens map-not-manual) | Stream 01 metric (−3%/+23%) |
| S-02 progressive disclosure | 01 A-03, 02 A-03 | 01 A-03 (L1/L2/L3) | — |
| S-03 context budget 4KB | 02 A-02, 05 A-04 | 01 D-03 (4KB cap), 02 A-03 (LITM) | — |
| S-04 mechanical verification | 02 A-04, 03 A-02 | 02 A-02 (Reflexion + Agentless), 03 A-03 | Stream 02 solution (Reflexion/CodeT) |
| S-05 fence decides/never a block without a check | 02 A-07, 04 A-17, 06 A-02 | — | Pillar 1 (Bouncer) |
| S-06 instruction-file attack surface | 01 D-04, 02 A-07 | 01 D-04 (AIShellJack/TrojanForge), 02 A-04 (ReadSecBench 84%) | Pillar 1 + GO-03 TrojanForge |
| S-07 rule-count dial (p^n + CCI) | 02 A-08, 05 gaps | — | Stream 05 metric (32-subset, 14% drop) |
| S-08 OWASP 2025 + AI layer | 04 D-01/D-02, 04 S-16 | 04 D-01/D-02 (2025 + 11 AI rules) | — |
| S-09 app-profile severity (local/shared/public) | 04 D-07, 04 A-06, 04 D-06 | 04 D-07, app profiles (local-toy→public) | — |
| S-10 turbo (auto/notify/gate + FP budget + lint) | 05 A-06/A-07, 01 D-01/D-02, 02 D-04 · `_CONSISTENCY C-01/C-02` | 01 D-01/D-02 (Teachable Turbo), 05 | Pillar 2 (Magic Undo) + stream 04 tripwire |
| S-11 teaching dial (vector + card + timing) | 05 A-01/A-03/A-05, 02 D-04 | 05 (dial 4-tier) | Pillar 3 (Teaching Dial) + sim |
| S-12 elicitation `1→verify→best-of-k` | 03 A-01/A-02/A-06/A-08/A-09 | 03 A-02/A-03 (1-sample + tournament), 02 Circuit Breaker | — |
| S-13 Meta pipeline (Spark+Wonder+Image+SAM) | 06 A-01/A-04/A-05/A-08/D-01/D-02 | 06 A-01–A-04/D-01–D-03 | Stream 06 Dream Team |
| S-14 demo-is-eval + rubric | 06 A-06, 02 invent | Independent FINAL §5 (Visceral Delta) + §6 rubric | Big Picture + Roadmap |
| C-01 hook surface | 01 D-01 | 01 D-01 | — |
| C-02 AGENTS.md transfer | 02 D-01 | 02 D-01 (+ greenfield bench) | — |
| C-03 ACI tier | 02 D-02, 06 gaps | 02 D-02 | — |
| C-04 `max` pedagogy | 05 D-01 | 05 D-01 | Simulator |
| C-05 dial visibility/fade | 05 D-02, gaps | — | Simulator |
| C-06 classifier vs deterministic | 05 D-03 | 05 D-03 | — |
| C-07 dep triage | 04 D-04 | 04 D-04 (block/dev warn) | — |
| C-08 Spark×harness transfer | 06 Q | — | — |
| C-09 Glimmer vs Spark | 06 gaps | — | — |
| C-10 smoke-test flakiness | 03 D-07, 04 gaps, `_CONSISTENCY B-07` | — | — |
| Blind spots B-01–B-08 | `_CONSISTENCY §4` + per-stream gaps | Per-stream gaps (thinner) | — |

---

*Generated as a read-only comparison. No synthesis file was modified. Write v2 against primary as the spine, independent as the replication + appendix, explorer as the stakeholder-facing sibling.*
