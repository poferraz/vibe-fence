# ECC Sidebar — What vibefence Learns (and Doesn't) from affaan-m/ECC

> **Scope:** Side analysis for Phase 1. Primary source of truth remains
> [`FINAL-v2.md`](./FINAL-v2.md). This note compares ECC (read 2026-10-20 from
> `/tmp/ecc-analyze`) to vibe-fence Phase 1 (`docs/PLAN.md`, `FINAL-v2.md` §4,
> `docs/clief/INDEX.md`, `package.json`). Every factual claim cites a file
> checked on disk; no live GitHub API fetch was performed (star/fork counts
> below are repo self-description).

---

## 1. What ECC Is

**ECC (Everything Claude Code / affaan-m/ECC)** is a **harness-native agent OS** —
not a framework, not a template, not a prompt library. Its own `README.md:132–144`,
`AGENTS.md:1–3`, and `CLAUDE.md:5–8` describe it as a *coordinated engineering
system* installed once into the agent harness so that every downstream prompt
inherits `plan → test → implement → review → verify → remember → improve`
without re-prompting.

### Scale (from files on disk, 2026-10-20)

| Artifact | Count | Evidence |
|----------|-------|----------|
| Agents | **71** | `agents/` dir (71 files); `AGENTS.md:3`, `README.md:144`, `.claude-plugin/plugin.json:\"description\"` |
| Skills | **311** | `skills/` dir (311 entries); `plugin.json` + `README.md:149` |
| Commands (legacy shims) | **97** | `commands/` dir (97 files); `AGENTS.md:175–180` notes `skills/` is canonical, `commands/` is legacy compatibility |
| Plugin version | **2.2.3** | `VERSION`, `package.json`, `.claude-plugin/plugin.json:version` |
| License | MIT | `README.md:106` + `LICENSE` |

Self-reported popularity (from `README.md` badges, not verified live):
~277k stars / 277k forks equivalent is **not** verifiable from local files —
the repo's own `README.md:48–52` only shows badge images. Treat any star-count
headline as marketing, not audit.

### 7 harnesses

ECC advertises 7 harness targets in `README.md:142–143` and the install matrix
`README.md:~360ff`:

1. **Claude Code** — primary, native `ecc@ecc` plugin via
   `/plugin marketplace add` + `hooks/hooks.json` auto-loaded by Claude Code
   2.1+ (`README.md` *Claude Code details* §).
2. **Codex** — native `codex plugin marketplace add affaan-m/ECC` /
   `codex plugin add ecc@ecc` + deprecated `scripts/sync-ecc-to-codex.sh` legacy
   path.
3. **Qoder** — `.qoder-plugin/` native plugin (`qoder plugins validate/install`).
4. **Cursor** — project-local `.cursor/` adapter (`install.sh --target cursor`).
5. **OpenCode** — `npm run build:opencode` then `install.sh --target opencode`.
6. **Kimi Code** — `./.kimi-code` managed project files + explicit
   `model/provider/auth not configured` disclaimer.
7. **Muse Spark / plus Gemini, Zed, Antigravity, Qwen, Hermes, OpenClaw,
   CodeBuddy, JoyCode, Copilot** — the docs enumerate >7 with the caveat
   *\"capability-limited adapters\"* and point to `docs/MANUAL-ADAPTATION-GUIDE.md`
   for any harness without a native target.

> **Honest note for the brief:** \"7 harnesses\" is a generous cut. Primary
> is Claude Code; native Codex + Qoder are real plugins; the rest are
> *adapters/install-scripts with documented parity gaps* (see
> `README.md` *Platform Support* and `.qoder-plugin/README.md` boundary notes).
> vibe-fence's own M1 `src/adapters/{claude,codex,cursor,opencode,hermes}.yml`
> per-runtime profiles (FINAL-v2 §4 M2) is the same strategy — claim only what
> is tested.

### Control-pane substrate

What makes ECC an \"OS\" rather than a prompt pack is the persistent substrate
under the agents:

* **Hooks runtime** — `hooks/hooks.json` (285 lines) registers ~25 hook
  entries across 8 lifecycle points:
  `PreToolUse`, `UserPromptSubmit`, `PreCompact`, `SessionStart`, `PostToolUse`,
  `PostToolUseFailure`, `Stop`, `SessionEnd` (enumerated in
  `hooks/hooks.metadata.json:entries`). Controlled dispatch via
  `scripts/hooks/run-with-flags.js` + `pre-bash-dispatcher.js` /
  `posttooluse-dispatcher.js` / `lifecycle-hook-bootstrap.js`.
* **Hook profiles** — `.claude-plugin/plugin.json:userConfig` exposes
  `hooks_enabled` (bool, default `true`) + `hook_profile` (`minimal` /
  `standard` / `strict`, default `standard`). Every hook invocation is invoked
  as `run-with-flags.js <id> scripts/hooks/<name>.js minimal,standard,strict`
  so a single hook declares which profiles it participates in.
* **Install lifecycle** — versioned `manifests/install-*.json` + per-target
  `install.sh` / `install.ps1` + `scripts/ecc.js {list-installed,doctor,repair,
  uninstall}` collision/update/repair/uninstall matrix with ownership manifests.
* **Worktree / orch-* layers (reported, not audited on disk)** — `AGENTS.md`
  and `README.md` reference worktree and `orch-*` orchestration layers for
  multi-agent coordination; these were **not** re-verified beyond the docs
  inventory for this sidebar. If cited externally, verify against
  `worktrees/` or `ecc2/` on a fresh checkout.
* **MCP + rules + memory** — `mcp-configs/` (14 MCP definitions, only
  `chrome-devtools` enabled by default per `docs/MCP-CONNECTOR-POLICY.md`),
  `rules/{common, <lang>}/`, session memory / continuous-learning hooks
  (`observe-runner.js`, `evaluate-session.js`, `cost-tracker.js`).

### Philosophy line (verbatim from `README.md:138–140`)

> *Optimize the context window. Persist everything else.*

This is the same load-bearing thesis as vibe-fence FINAL-v2 S-03
(*context is a budget, not a buffer* + progressive disclosure), arrived at
independently.

---

## 2. What ECC Does That vibe-fence Should Learn

Five concrete patterns are worth stealing/adapting. Each cites the ECC file
where the pattern lives.

### 2.1 GateGuard fact-forcing gates — *not* yes/no permission prompts

**File:** `scripts/hooks/gateguard-fact-force.js:1–10` (header comment) +
`hooks/hooks.metadata.json:\"pre:edit-write:gateguard-fact-force\"`

ECC's signature guardrail innovation is GateGuard. Its design doc states:

> *Forces Claude to investigate before editing files or running commands.*
> *Instead of asking \"are you sure?\" (which LLMs always answer \"yes\"),*
> *this hook demands concrete facts: importers, public API, data schemas.*
> *The act of investigation creates awareness that self-evaluation never did.*

Mechanics (from `hooks.metadata.json:47`):

* Fires on **first** `Edit|Write|MultiEdit|NotebookEdit` of each file —
  denies with **questions chosen by target class** (and by what the change
  touches), not generic warnings.
* Passes if: same turn already `grep`-named the file, comment/whitespace-only
  edit, same-turn sibling of a new file already gated, or sensitive-target
  bypass rules.
* Sensitive targets (secrets, keys, auth/payment, migrations, CI workflows,
  hard-linked files) are **always gated**, even in subagents.

**Why it matters for vibe-fence:** FINAL-v2 S-05 already says *deterministic
fence decides; model explains* and S-10 says *permission prompts are theatre
(93% acceptance, ~35% miss)*. GateGuard is the strongest concrete
instantiation of that thesis we have seen. The question-id taxonomy +
`relevantQuestions` / `condensedQuestionPhrase` / hint system is ahead of
vibe-fence's current generic `check → block/warn/nudge` policy.

**What to steal:** The *fact-forcing question taxonomy* keyed to
`target class × change profile` (see `docs/gateguard/design-notes.md#questions-from-the-change-profile`
referenced from `docs/gateguard/evaluation.md`), not just a binary block.

### 2.2 GateGuard effectiveness harness — `docker/gateguard-effectiveness/`

**Files:** `docker/gateguard-effectiveness/README.md` +
`docker/gateguard-effectiveness/{run.js,run-intent.js,…}` +
`docs/gateguard/question-effectiveness.md` + `docs/gateguard/evaluation.md`

ECC ships a **development-only evaluation harness** that *measures whether
GateGuard's questions change outcomes*, not just whether they fire:

* `run.js` — one-shot autonomous sessions over `scenarios/` where the deciding
  fact hides in-repo; treated as cost baseline (turns/tokens/wall-time), not
  effect.
* `run-intent.js` — multi-turn sessions over `scenarios-intent/` where the
  deciding fact exists only in simulated-user hidden intent, so an agent that
  doesn't ask can only guess. Arms: `off` / `gate` / `minus-target` / `placebo`
  / `main`. Reports per scenario hole categories, anti-placebo controls,
  decoy-overlay grader validation, `evidence.json` fingerprinting.
* `docs/gateguard/evaluation.md` — per-step `expect` / `mustDeny` /
  `redundant` / `relevantQuestions` corpus with deterministic metrics:
  must-deny bypasses (=0 required), redundant denials, irrelevant questions
  asked, warranted-not-asked, denial token cost, hook latency (fresh + warm).

**Why it matters:** vibe-fence FINAL-v2 S-14 + §7 define a 5-task × 4-rubric
equality + adversarial bench, but has no equivalent of the *per-gate
question-effectiveness* harness that ties a specific guardrail question to a
trapped scenario and measures placebo vs minus-target ablation. This is the
gold standard for \"does the fence earn its cost?\"

**What to steal:** The *arm/ablation pattern* (`off / gate / minus-target /
placebo`) and the per-step `expect/mustDeny/redundant` taxonomy for any
vibe-fence guardrail that denies.

### 2.3 `agentic-engineering` skill

**File:** `skills/agentic-engineering/SKILL.md`

A compact operating loop for AI-led engineering that vibe-fence's M3
skills can mirror without re-inventing:

* **Eval-first loop:** define capability eval + regression eval → baseline →
  implement → re-run → delta.
* **15-minute unit rule:** each unit independently verifiable, single dominant
  risk, clear done condition.
* **Model routing:** Haiku = classification/boilerplate/narrow edits;
  Sonnet = implementation/refactor; Opus = architecture/root-cause/multi-file
  invariants. (Maps to vibe-fence `MUSE_MODEL_COMPANION` vs `MUSE_MODEL_ARCHITECT`
  dual-tier routing in FINAL-v2 M4, but more explicit per-task.)
* **Review focus for AI code:** invariants, edge cases, error boundaries,
  security/auth assumptions, hidden coupling, rollout risk — explicitly
  *not* style when format/lint already enforces style.
* **Cost discipline:** track per-task model / tokens / retries / wall-clock /
  success-failure; escalate tier only on clear reasoning gap.

This is a better articulation of FINAL-v2 S-04
(`Read→Think→Write→Check` + tournament selection + 2-attempt circuit breaker)
for the *human operator* who supervises it.

### 2.4 `agent-security-hardening` skill — map trust boundaries

**File:** `skills/agent-security-hardening/SKILL.md` (177 lines)

A deployment-grade hardening guide for any agent framework that touches
filesystem / network / memory / tool actions. Structure:

1. **Map trust boundaries** — every `source → parser → validator → side effect`
   triple, with authorizing identity/scope, validator immediately before effect,
   max I/O size, audit evidence, interruption recovery.
2. **Validate identifiers/env/URLs** — 64-char allowlisted agent IDs, argv
   `end-of-options` separation, no credential-bearing redirects, per-hop DNS
   rebinding check, HTTPS + cert verification before attaching secrets.
3. **Contain filesystem** — no absolute/traversal, Windows-reserved names
   (`CON`, `NUL`, `COM1`…), trailing dot/space and `:` ADS syntax blocked,
   `resolve()` + `is_relative_to()` containment, symlink-race open-via-handle.
4. **Protect temp/creds** — `0o600`/`0o700`, private runtime dir over shared
   tmp, atomic names, `finally` cleanup with redacted error record, secrets
   never in args/logs/traces/model-context.
5. **Bound tool output** — byte limit + truncation marker + content hash +
   typed failure with tool/boundary/reason.
6. **Verification gate** — 6 end-to-end proofs through the *real* entry point
   (not mocks): prompt-injection-as-data, irreversible-action auth+confirmation,
   cross-tenant ID rejection, traversal/symlink containment, forced-failure
   temp hygiene, oversized/malformed output bounding.

**Why it matters:** FINAL-v2 S-06 (instruction-file attack surface +
`FENCE_SYNC_TOKEN` + `.fence/hooks/postinstall-guard.sh`), S-08 (OWASP
Top 10 2025 + LLM Top 10 2026 + BILL-01/PRV-09), S-10 (project-root `realpath`
+ credential hard-deny + egress allowlist + `fence undo` + git checkpoint)
already align philosophically. ECC's skill is the *checklist with code
sketches and test predicates* that vibe-fence can adopt verbatim for its own
`.fence/` state tree and adapter hardening. In particular, the *Windows-reserved
name + ADS* and *DNS-rebinding per-hop* checks are gaps in vibe-fence's current
scope line (Desktop CLIs v1).

### 2.5 Multi-harness plugin manifests with `hooks_enabled` / `hook_profile`

**Files:** `.claude-plugin/plugin.json` + `hooks/hooks.json` +
`.opencode/opencode.json` + `manifests/install-*.json`

ECC demonstrates how to ship one skill/agent corpus to many runtimes without
forking:

* **Claude Code** — native marketplace `ecc@ecc` with `userConfig`
  `hooks_enabled` + `hook_profile` declaratively in `plugin.json`; hooks
  auto-loaded from `hooks/hooks.json` without user `settings.json` edits.
* **OpenCode** — `.opencode/opencode.json` with `instructions` list
  (AGENTS.md + per-skill SKILL.md entries), `agent.build` / `agent.planner`
  tool caps, `skills.paths: [\"../skills\"]`, `plugin: [\"./plugins\"]`.
* **Manifest components** — `manifests/install-components.json` splits the
  repo into `baseline:rules|agents|commands|hooks|platform|workflow` +
  `lang:typescript` composable components selectable via
  `install.sh --profile {minimal,core,full} --without baseline:hooks`.

**Why it matters:** vibe-fence's M1→M4 plan (`src/` sole authority →
`tools/{generate,validate,install}.ts` → `dist/` disposable, plus
`src/adapters/{claude,codex,cursor,opencode,hermes}.yml` per-runtime profiles
and `tools/install.ts` WebContainer probe) is structurally the same — but
ECC has already solved the *user-facing opt-in* (`--enable-hooks` vs
`--no-hooks` with explicit choice required, no silent default) and the
*plugin-config-declared hook profile* pattern. Steal the explicit-choice
installer.

---

## 3. What vibe-fence Does That ECC Does NOT

ECC is a **professional engineering OS for developers who already ship software**.
vibe-fence is a **senior-dev companion for non-technical vibe-coders who haven't
learned to be developers yet**. That difference flips several design choices:

### 3.1 Non-technical focus + teaching on a dial

* **ECC:** Assumes the operator understands software engineering. Its agents
  (`planner`, `tdd-guide`, `security-reviewer`, `mle-reviewer`, …) and 311
  skills are vocabulary for practitioners. Teaching is implicit (code review,
  plan artefacts, learn-skill extraction), not a first-class product surface.
* **vibe-fence:** `docs/PLAN.md:1` — *\"makes any AI coding agent behave like
  a senior-dev companion for non-technical vibe-coders\"* with an **orthogonal
  teaching dial** `max → medium → min → silent` as a per-domain vector
  `.fence/state/dial.json` behind one global knob + fixed-schema card
  `What changed · Why · Your call · How we'll know` with expand on disk
  (FINAL-v2 S-11). Plus the **Senior-Partner Anti-Sycophancy Directive**
  (\"Do not validate bad technical practices to be polite\"). ECC has no
  equivalent pedagogy product; its guidance *is* the teaching.

### 3.2 Turbo / containment for vibe-coders

* **ECC:** GateGuard + governance-capture + hookify + cost-tracker. Gating is
  about **engineering correctness** (missing importers, wrong schema, secrets
  in config). Reversibility is implicit in git + plan-canvas.
* **vibe-fence:** FINAL-v2 S-10 — turbo safety as
  **containment × reversibility × session-coupling × gate budget**: project-root
  `realpath` boundary + credential hard-deny + egress allowlist + git checkpoint
  + `fence undo` + ≤3 gates/session + rolling 90% → demote. Bands named by
  *guarantee* (`guarded → assisted → autonomous → open`), \"Turbo\" label
  forbidden user-facing (S-10, `_CONSISTENCY.md` C-06, `HTML-REVIEW.md` F-06).
  This is a *safety product for people who will bypass warnings* (93% permission
  acceptance), not just a correctness gate.

### 3.3 Meta AI hackathon integration

* **ECC:** No Meta AI integration. No hackathon narrative.
* **vibe-fence:** **Meta Global AI Developer Hackathon — Oct 26–Nov 4, 2026,
  $1M pool, Indie track *Build for Your World*** (`docs/PLAN.md` header) with
  **Muse Spark 1.3** companion voice (`POST /v1/responses` stateless encrypted
  replay; Muse Wonder 1.0 escalation tier; ≤5 Wonder calls/session unless
  `--wonder`; Image $0.01/image for logo/demo polish; **Standard pricing default
  — `GEM-09` P0 ethics gate, `--contributor-mode` never suggested in README/demo**;
  SAM 3.1 out of critical path, one concept/request, click-to-teach only;
  explicit `MUSE_MODEL_COMPANION` / `MUSE_MODEL_ARCHITECT` dual-tier routing
  table). Plus Glimmer 30B local for sensitive classification + Visceral Delta
  3-minute demo script (unfenced disaster → `npx vibe-fence init` →
  polish & ship) + 5×4 eval rubric (FINAL-v2 §7–§8). Entirely absent from ECC.

### 3.4 Billable-service guard (BILL-01)

* **ECC:** No explicit guard against agents racking up paid-API / cloud-billing
  charges — a top failure mode for non-technical users' first backend.
* **vibe-fence:** FINAL-v2 S-08 + M3 — **BILL-01** `withBudgetCap({maxCalls,
  maxCostUsd})` wrapper + `.fence/templates/` scaffold for paid-service
  call sites. Carried from `_CONSISTENCY.md` B-02 and `INDEPENDENT-GEMS.md`
  GEM-05. This is a vibe-coder-specific safety class ECC doesn't need.

### 3.5 PII fixture hygiene (PRV-09) + anonymizer

* **ECC:** Handles secrets-scanning broadly (AgentShield, `gitleaks` push
  protection, `secrets-config-key` GateGuard scenario), but no explicit
  **fixture anonymization** pipeline.
* **vibe-fence:** FINAL-v2 S-08 + M3 — **PRV-09** `tools/anonymize.ts`
  synthetic-PII replacement preserving referential integrity for fixtures,
  paired with RLS `USING (true)` linter + remote `pg_policies` introspection
  on `promote public` + `privacy inventory → /privacy` + export/delete +
  consent gate. GEM-06; privacy inventory is a product requirement, not just
  a scan.

### 3.6 Other vibe-fence-only bets

* **Queue as agent's backlog, not user's inbox** — `.fence/queue.json` with
  agent-as-assignee, payload pin (hash+lock), three-condition gate
  (`realpath` + diff/blast + competence test), rolling 90% → demote to
  post-hoc. ECC has `plan-canvas-pending` but not a WIP=1 Kanban queue with
  blast-radius heuristics.
* **Tournament selection + 2-attempt circuit breaker** — `1 sample → cheapest
  verify → best-of-k (k≤5)` + `2 consecutive failures → read-only consultation`
  (FINAL-v2 S-12 + S-04). ECC's evaluation pattern is `plan → test → implement
  → review` with freshness, not explicit pass@k tournament + breaker.
* **WebContainer/file-only fallback** — `tools/install.ts` probe for
  WebContainer/Bolt/Lovable/StackBlitz that prints file-only fence when hooks
  can't install. ECC supports many CLIs but treats browser runtimes as out of
  scope without a fallback copy path.

---

## 4. Honest Competitive Comparison

| Dimension | **ECC 2.2.3** | **vibe-fence Phase 1** | Verdict |
|-----------|---------------|------------------------|---------|
| **Install** | `npx ecc-universal@2.2.3 setup` guided wizard + per-harness `install.sh --target {claude,codex,cursor,opencode,gemini,zed,antigravity,qwen,hermes,…}` + native marketplace plugins (Claude `ecc@ecc`, Codex, Qoder) + `doctor/repair/uninstall` lifecycle with ownership manifests. Explicit `--enable-hooks` / `--no-hooks` choice. | `npx vibe-fence init` — single idempotent command, <3s, merge-not-clobber, `fence validate` / `fence sync` / `fence undo` / `fence tour` / `fence look`. `tools/{generate,validate,install}.ts` `src→dist` determinism. `AGENTS.md` ≤400 tokens. | ECC has a mature multi-profile installer; vibe-fence is betting on **one command that cannot fail** for non-technical users. Different maturity stages; parity is not the goal. |
| **Audience** | Professional engineers & teams who ship. 71 agents / 311 skills / 97 commands as vocabulary. `AGENTS.md` 222 lines of engineering doctrine (immutability, TDD 80% coverage, repo patterns). | Non-technical vibe-coders on their first/early project. `AGENTS.md` ≤400-token router, docs in `docs/fence/INDEX.md` with `description-agent` frontmatter, skills discoverable under `.agents/skills/` + `.claude/skills/`. Teaching dial, not skill catalog. | Completely different user. ECC *raises the ceiling*; vibe-fence *raises the floor*. |
| **Guardrails** | GateGuard fact-forcing gates (target-class × change-profile question taxonomy) + `config-protection` + `governance-capture` + `mcp-health-check` + AgentShield scanning + `pre-bash-dispatcher` quality/push checks + OWASP-aligned `security-review` skill. Severity is per-rule, not profiled. | Deterministic fence (`block` always has an executable check; no check → never block) + `severity-policy.json` (`no check→nudge; check+irreversible→block; check+reversible→warn; unknown≠pass`) + `.fence/app-profile.json` (`local/shared/public` → 14/29/55 blocks) + dual-layer secrets (`gitleaks` + Push Protection, `warn→block` after allowlist) + `NEXT_PUBLIC_` shape lint + Zod + `pg $1` + `semgrep` + headers/CSP + RLS linter + BILL-01/PRV-09. GateGuard taxonomy not yet adopted. | **ECC wins on gate sophistication** (fact-forcing taxonomy + `gateguard-effectiveness` proof). **vibe-fence wins on policy architecture** (declared `app-profile` → severity derivation + billable-service + fixture hygiene). Ideal fence steals ECC's question taxonomy into FINAL-v2's severity policy. |
| **Teaching** | Implicit — code-review, planning, learn-skill extraction, doc-updater. No sycophancy guard, no fade dial. | **First-class product:** scaffolding-fade dial (`max→medium→min→silent`, per-domain vector behind one knob) + Senior-Partner Anti-Sycophancy Directive + fixed-schema card (`What changed · Why · Your call · How we'll know`) + checkpoint-boundary delivery + 7-day TTL+LRU lesson eviction + `.fence/learn/*.md` on disk. | vibe-fence is alone here. ECC contributors would benefit from it; vibe-coders *need* it. |
| **Adapters** | Harness-native plugins + install-script adapters + manual adaptation guide. Claude Code is first-class; others are \"capability-limited\" with documented parity gaps. `.claude-plugin/plugin.json` (`hooks_enabled`/`hook_profile`) + `.opencode/opencode.json` patterns are the reference. | `src/adapters/*.yml` per-runtime profiles (window/caching/edit-format/model-tier-conditional) + `tools/install.ts` WebContainer probe + `Muse Mode` stateless replay + trust-gated `AGENTS.md` precedence + `fence doctor` untrusted-checkout guard. Desktop CLIs v1; browser out of scope. | Structurally convergent (both: `src` authority → adapter projection → disposable `dist`). ECC has shipping breadth; vibe-fence has a cleaner **single-source adapter build** via `tools/generate.ts`. |
| **Verification** | `plan → test → implement → review → verify → remember → improve` with TDD (tests before code, 80% coverage), code-reviewer + build-error-resolver + e2e-runner agents, `posttooluse-dispatcher` observe hooks, `stop:format-typecheck` batch format+typecheck, session persistence + compaction. | `Read→Think→Write→Check` + trust ladder (`compile→lint→tests×2→generated-tests→judge-for-prose`) + **Tournament Selection** (`K parallel → first green wins`) + **2-Attempt Circuit Breaker** (`src/framework/circuit-breaker.ts` → `read-only consultation` + `.fence/queue.json`) + `.fence/check` silent Reflexion circuit + `byte-capped-pipeline` (4KB caps, PageRank `vibe-map` ≤1k tok, last-5 prunes) + `verifier.ts` ephemeral `// @fence-ephemeral` smoke suite for testless repos. | ECC is a **heavier, team-grade verification ladder**; vibe-fence is a **lighter, cost-capped loop built for flaky hobby repos** (trust ladder + `run×2` flake check explicitly handles B-07). Complementary, not competing. |
| **Eval** | `docker/gateguard-effectiveness/{run.js, run-intent.js}` with 4-arm ablation (`off/gate/minus-target/placebo`), per-step `expect/mustDeny/redundant/relevantQuestions` corpus, `evidence.json` fingerprinting, decoy-overlay grader validation. Gold standard for *does this gate earn its cost?* | 5-task × 4-rubric eval (`auth`, paid API, bug fix, ship-to-prod, add-dep × structure/secrets/git/deploy) + adversarial fence bench (poisoned `AGENTS.md`, README payload, malicious skill, user-asks-bypass) + false-block rate + seeded fixtures + Visceral Delta before/after demo split-screen. No per-gate ablation harness yet. | **ECC's eval harness is ahead** — vibe-fence should adopt its arm/taxonomy pattern. vibe-fence's Visceral Delta is ahead as a *product* demo. Both are needed. |

### Bottom line of the table

ECC is a **mature OS for teams** that have outgrown raw Claude Code.
vibe-fence is a **purpose-built companion for beginners** that have never had
an OS at all. Their Venn overlap is real (hooks, verification, safety), but
their jobs-to-be-done differ enough that \"which is better\" is the wrong
question. The right question is: *what should vibe-fence copy before demo day?*

---

## 5. Concrete Phase 1 Takeaways — Top 5 Things to Steal/Adapt

Ordered by risk-adjusted value for **Phase 1+ through hackathon demo** (Nov 4,
2026). Each names the destination file and the precedent.

### #1 — Steal GateGuard's fact-forcing question taxonomy (for `vibe-guard`)

* **What:** Don't just `block/warn/nudge` with a generic message. For the first
  write to each file, deny with **2–4 specific questions** keyed to the
  *target class × change profile* (importers, public API, data schema, existing
  tests, secret surface, external contracts — the `GATEGUARD_*` question IDs).
  The `local-callers` vs `importers` routing rule (file-local helper vs
  exported function body) is especially relevant for JS/TS monorepos.
* **Destination:** `src/config/severity-policy.json` question routing +
  `src/skills/vibe-guard/SKILL.md` guard prompts. Keep vibe-fence's severity
  policy as the decision layer; GateGuard's taxonomy is the *message* layer.
* **Precedent:** `scripts/hooks/gateguard-fact-force.js` +
  `hooks/hooks.metadata.json:pre:edit-write:gateguard-fact-force` +
  `docs/gateguard/design-notes.md#questions-from-the-change-profile`.
* **Why now:** This makes the guardrail *teachable* — the agent's forced
  investigation is the lesson. Strong fit for the teaching dial.

### #2 — Add a per-gate ablation harness (`off / gate / minus-target / placebo`)

* **What:** For every guardrail that denies, add 2–4 trapped scenarios (like
  ECC's `scenarios/` — `importers-date-shape`, `secrets-config-key`, etc.) and
  run `off` vs `gate` vs `minus-target` vs `placebo` arms. This is the only
  credible answer to \"does the fence earn its cost?\" and to the **FP budget**
  concern in FINAL-v2 C-01.
* **Destination:** `tests/fixtures/gateguard-like/{scenarios,run.ts}` + CI job.
  Not load-bearing for M4 demo, but M4.5 for credibility with judges.
* **Precedent:** `docker/gateguard-effectiveness/run.js` + `run-intent.js` +
  `docs/gateguard/evaluation.md` (`expect/mustDeny/redundant/relevantQuestions`
  + decoy-overlay grader validation + `evidence.json` fingerprinting).
* **Why now:** FINAL-v2 S-14 already gates M4 on eval + adversarial bench;
  adding the ablation arms turns \"we block secrets\" into a measured claim.

### #3 — Harden the `.fence/` state tree with the `agent-security-hardening` verification gate

* **What:** Apply ECC's 6-point real-entry-point verification to every
  `.fence/` write and every adapter boundary:
  1) untrusted instruction stays data, 2) irreversible action needs
  auth+confirmation, 3) cross-workspace IDs rejected, 4) traversal/symlink
  containment, 5) forced-failure leaves no credential-bearing temp/log,
  6) oversized tool output returns bounded error. In particular adopt:
  Windows-reserved names + ADS (`:`), DNS-rebinding per-hop checks, `0o600`/
  `0o700` + `finally`-cleanup guarantees, argv `end-of-options` separation.
* **Destination:** `src/framework/integrity.ts` + `src/framework/verify-remote.ts`
  + `tools/install.ts` + `src/framework/meta-client.ts` (for Muse
  credential transport).
* **Precedent:** `skills/agent-security-hardening/SKILL.md` (§1–§5 + verification
  gate §Verification Gate 1–6).
* **Why now:** FINAL-v2 M1 already has `GEM-01` integrity attestation +
  `FENCE_SYNC_TOKEN` + `postinstall-guard.sh`; this extends it from install-time
  to every write. Required for the adversarial bench (`poisoned AGENTS.md`,
  malicious skill) to pass credibly.

### #4 — Adopt `hooks_enabled` / `hook_profile` plugin-config pattern (explicit-choice installer)

* **What:** Make `npx vibe-fence init` require an explicit hook posture
  decision (like ECC requiring `--enable-hooks` vs `--no-hooks` — no silent
  default). Expose it declaratively: `hooks_enabled` (bool) +
  `hook_profile` (`minimal`/`standard`/`strict`) in `.fence/config.json`
  (or in the Claude `settings.json` block that `init` writes), and have each
  M2 hook declare which profiles it participates in. Ship `minimal` as
  \"you asked for it\" (FINAL-v2 C-01, S-10: *most hooks are theater*).
* **Destination:** `tools/install.ts` + `tools/validate.ts` +
  `src/adapters/claude.json` (or `.claude-plugin/plugin.json` if vibe-fence
  ships a Claude plugin) + `src/config/severity-policy.json`.
* **Precedent:** `.claude-plugin/plugin.json:userConfig` (`hooks_enabled`,
  `hook_profile`) + `hooks/hooks.json:run-with-flags.js <id> … minimal,standard,strict`
  + `README.md:Advanced Install Options → --enable-hooks / --no-hooks`.
* **Why now:** Removes the #1 post-demo question — \"will this slow my agent
  down / deny me?\" — with a credible, shippable answer.

### #5 — Copy the `agentic-engineering` loop discipline into operator docs

* **What:** Add a short operational contract for whoever runs the harness:
  eval-first (capability eval + regression eval → baseline → implement →
  re-run → delta), 15-minute decompositions, Haiku/Sonnet/Opus-equivalent
  model routing (mapping to `muse-spark-1.3` companion → `muse-wonder-1.0`
  escalation), review focus on invariants/edge-cases/error-boundaries/
  auth-assumptions/hidden-coupling (not style), per-task cost ledger
  (model/tokens/retries/wall-clock/success).
* **Destination:** `docs/fence/INDEX.md` §Operations + `AGENTS.md` template
  (alongside the Anti-Sycophancy Directive) + a new `docs/fence/OPERATIONS.md`.
* **Precedent:** `skills/agentic-engineering/SKILL.md` (eval-first loop,
  15-min units, model routing, review focus, cost discipline).
* **Why now:** Gives judges and early adopters a **runbook** for trusting
  vibe-fence as infrastructure, not just a product pitch. Directly supports
  FINAL-v2's cost-of-pass telemetry (S-14, §7 rubric).

---

## Sources Read (local disk, 2026-10-20)

* `/tmp/ecc-analyze/AGENTS.md` — 222 lines, 71-agent catalog + workflow policy.
* `/tmp/ecc-analyze/CLAUDE.md` — 88 lines, plugin architecture + test harness.
* `/tmp/ecc-analyze/README.md` (lines 1–150 + 130–650 sampled) — product
  thesis, install matrix, 7-harness claim, architecture patterns.
* `/tmp/ecc-analyze/hooks/hooks.json` — 285 lines, ~25 hook registrations
  across 8 lifecycle points.
* `/tmp/ecc-analyze/hooks/hooks.metadata.json` — 156 lines, canonical hook
  descriptions including GateGuard + dispatcher provenance.
* `/tmp/ecc-analyze/skills/agent-security-hardening/SKILL.md` — 177 lines,
  trust-boundary hardening with verification gate.
* `/tmp/ecc-analyze/skills/agentic-engineering/SKILL.md` — eval-first loop,
  decomposition, model routing, cost discipline.
* `/tmp/ecc-analyze/.claude-plugin/plugin.json` — `hooks_enabled` /
  `hook_profile` userConfig pattern.
* `/tmp/ecc-analyze/.opencode/opencode.json` — instructions, agents, plugin.
* `/tmp/ecc-analyze/docker/gateguard-effectiveness/README.md` +
  `docs/gateguard/question-effectiveness.md` +
  `docs/gateguard/evaluation.md` — effectiveness harness + corpus metrics.
* `/Users/poferraz/Documents/Development/active/vibe-fence/docs/PLAN.md` +
  `docs/research/synthesis/FINAL-v2.md` (§1–§8) +
  `docs/clief/INDEX.md` + `package.json` — vibe-fence Phase 1 scope.

*Not re-read for this sidebar (already locked in FINAL-v2):*
`docs/research/synthesis/{01-harnesses,02-harness-influence,…}.md`,
`_CONSISTENCY.md`, `COMPARISON.md`, `INDEPENDENT-GEMS.md` — cited via FINAL-v2.

---

*Prepared: 2026-10-20 · ECC 2.2.3 snapshot @ `/tmp/ecc-analyze` vs vibe-fence
0.1.0 Phase 1 (`FINAL-v2.md` locked). Next review after M2 primitives land.*
