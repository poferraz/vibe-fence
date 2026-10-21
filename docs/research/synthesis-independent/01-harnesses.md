# Synthesis — Stream 01: Existing Harnesses (Independent Evaluation)

- **Stream:** 01 — Existing Harnesses
- **Synthesized:** 2026-10-20
- **Contributors compared:** 6 independent runs:
  - `google-gemini-3.8-flash-2026-10-20` (22 sources)
  - `google-gemini-4-argon-2026-10-20` (52 sources / docx converted)
  - `muse-spark-2026-10-20` (28 sources)
  - `ollama-launch-deepseek-v4.1-flash-2026-10-20` (24 sources)
  - `ollama-launch-minimax-m3.1-flash-2026-10-20` (88 sources)
  - `openai-gpt-6-2026-10-20` (59 sources)

---

## 1. What the Contributors Agree On

Across all six independent contributor models, six structural conclusions reached strong or unanimous consensus:

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|---|---|:---:|:---:|
| **A-01** | **Markdown instruction files are non-binding suggestions, not hard security boundaries.** All agents treat `AGENTS.md`, `CLAUDE.md`, and `.cursorrules` as user-prompt text; models regularly hallucinate compliance or ignore negative constraints under long context or conflicting tiers. | `minimax 01` (CSA Research Note: 84% injection success; 93% of human reviewers miss attacks in context files) + `argon 01` (models arbitrarily drop constraints >300 lines) + `deepseek 01` (T1 advisory tier cannot stop an agent). | **Unanimous** | **Copy & Constrain:** Pair declarative markdown with deterministic pre-execution hooks and settings allow/deny lists. |
| **A-02** | **The market has a total void for non-technical users.** No existing harness combines single-command zero-friction install (`npx init`), cross-runtime compatibility, deterministic security guardrails, and an adaptive teaching companion. | `gemini-3.8-flash 01` (3-tier matrix showing zero crossover) + `muse-spark 01` (15 harness families all fail ≥1 axis) + `gpt-6 01` (26 families survey). | **Unanimous** | **Invent:** This four-pillar synthesis is `vibe-fence`'s core market positioning. |
| **A-03** | **Progressive disclosure (Anthropic SKILL.md standard) is the correct context primitive.** Always-on rule dumping bloats context; loading metadata (~50–100 tokens) at startup and injecting procedural bodies only on task match optimizes token budgets. | `muse-spark 01` (Agent Skills standard) + `argon 01` (60–200 line root limit) + `deepseek 01` (T2 rules). | **Strong** | **Copy:** Implement `src/skills/` using the 3-tier progressive disclosure `SKILL.md` pattern. |
| **A-04** | **Heavyweight framework gateways (LangGraph, Archestra, Pydantic AI) have real enforcement but catastrophic adoption friction for beginners.** They require Docker, Kubernetes, Python environments, or custom backend proxies. | `gemini-3.8-flash 01` (DevOps barrier) + `argon 01` (LangGraph state machine / Archestra proxy) + `gpt-6 01`. | **Unanimous** | **Avoid:** Do not build a backend proxy service; adapt deterministic enforcement to client-side pre-commit hooks and ACI command wrappers. |
| **A-05** | **`AGENTS.md` is the universal distribution format, but the wrong enforcement format.** Over 20 agents support `AGENTS.md`, making it the sole cross-runtime standard, but it lacks execution-prevention mechanics. | `deepseek 01` (H-03: ~60k repos adopt AGENTS.md, but 0% have enforcement) + `minimax 01` (Copilot changelog June 2026 adds AGENTS.md). | **Unanimous** | **Copy:** Use `AGENTS.md` as the universal portable router, but back it with client hooks. |
| **A-06** | **Atomic git checkpoints with instant rollback beat pre-execution confirmation prompts for routine edits.** Aider's technique of committing before and after every action eliminates anxiety without stalling velocity. | `gemini-3.8-flash 01` + `argon 01` + `muse-spark 01` (all cite Aider `/undo` and automated commits). | **Strong** | **Copy:** Implement `vibe-checkpoint` (`checkpoint: [action]`) and `npx vibe-fence undo`. |

---

## 2. Where They Disagree

### D-01 — Are Lifecycle Hooks Genuinely Secure, or a False Comfort?

- **Reading A (`minimax 01`):** Hooks are often security theater. A controlled evaluation of 12 hooks × 12 actions showed that 6 of 12 hooks stopped *none* of 8 risky actions when prompts were bypassed, and Claude Code’s built-in prompts already blocked 7/8 risky actions (while wrongly blocking 3/4 legitimate tasks). Furthermore, high false-positive rates actively train users to run `--dangerously-skip-permissions`.
- **Reading B (`argon 01` & `deepseek 01`):** Hooks (`PreToolUse`, `SessionStart` in `.claude/settings.json`, `.cursor/hooks.json`) are the *only* programmatic layer capable of denying execution before disk modification, achieving sub-35ms p95 latency.
- **Independent Resolution:** Hooks are structurally necessary, but only when restricted to a **deterministic, zero-false-positive allow/deny budget** (e.g., blocking regex patterns on known secret keys or preventing writes outside the project root). Hooks must never attempt complex fuzzy semantic classification that creates annoying false positives.
- **Why it matters for Phase 1:** Determines whether `src/adapters/` deploys a minimal, razor-sharp hook set or a sprawling, heuristic hook architecture.

### D-02 — The Legitimacy and Naming of "Turbo Mode"

- **Reading A (`minimax 01`):** Naming an autonomy feature "Turbo" is dangerous. It normalizes bypassing security (e.g. Antigravity 2.0's "Turbo" disables the sandbox; users treat it as a speed button). Factory Droid's approach uses strict "Risk Bands" where critical security invariants survive even the highest autonomy settings.
- **Reading B (`muse-spark 01` & `gemini-3.8-flash 01`):** "Turbo Mode" is the exact vocabulary vibe-coders expect. Non-technical users reject slow, confirmation-heavy harnesses.
- **Independent Resolution:** Internally, implement containment and reversibility (Risk Bands); externally, call the feature **"Teachable Turbo"**—explicitly marketing that *Turbo does not mean reckless*: it auto-approves safe code edits while hard-pausing on database migrations, production deploys, and credential exposure.
- **Why it matters for Phase 1:** Directly dictates the CLI schema in `.fence/config.json` (`turbo_mode: true`) and the boundaries defined in `src/framework/turbo.ts`.

### D-03 — Is `AGENTS.md` Inherently Beneficial or Actively Harmful?

- **Reading A (`argon 01`):** Cites an ETH Zurich study finding that `AGENTS.md` is net-negative when bloated, contradictory, or auto-generated, increasing token costs by +20% with zero accuracy improvement.
- **Reading B (`muse-spark 01` & `minimax 01`):** `AGENTS.md` is the only universally adopted onboarding map across 20+ vendors; without it, agents burn context exploring directory trees.
- **Independent Resolution:** Reconciled by the **"Map, Not Manual" Principle**: `AGENTS.md` must be capped at ≤150 lines (or ≤400 tokens), functioning solely as an index pointing to modular rules in `.fence/rules/`. It must never contain inline procedural tutorials or full API documentation.
- **Why it matters for Phase 1:** Requires adding a deterministic size and token linter to `tools/validate.ts` that fails builds if `AGENTS.md` exceeds budget.

### D-04 — Instruction Files as an Active Attack Vector (Indirect Prompt Injection)

- **Reading A (`minimax 01`):** Deeply documents real-world attacks: AIShellJack (41–84% success), TrojanForge (>60% repository poisoning), and NVIDIA AI Red Team's discovery of Go dependencies silently writing malicious `AGENTS.md` files to hide malware from code review.
- **Reading B (`other contributors`):** Treated `AGENTS.md` primarily as an instruction file, overlooking build-time poisoning.
- **Independent Resolution:** `minimax 01` surfaces a critical vulnerability that `vibe-fence` must address. `vibe-fence init` must establish an **integrity hash check**: fence-owned files (`AGENTS.md`, `.fence/invariants.md`) must be hashed; if an external script or package attempts to overwrite them, the harness blocks the change.
- **Why it matters for Phase 1:** Demands an attestation/integrity check inside `tools/validate.ts` and `src/framework/integrity.ts`.

---

## 3. Unique Contributions

| Contributor | Unique Finding / Breakthrough | Evidence | Adopt in Phase 1? |
|---|---|---|:---:|
| **`ollama-launch-deepseek-v4.1-flash`** | **The 3-Tier Enforceability Model & Empirical Context Study:** Discovered arXiv:2602.14690v4 showing that across 2,303 context files in 1,925 repos, only **14.8% mention security**, proving the market completely fails to protect users. | arXiv:2602.14690v4 | **Yes:** Adopt the T1 (Context) / T2 (Rules) / T3 (Hooks) framework in `docs/clief/`. |
| **`ollama-launch-minimax-m3.1-flash`** | **Instruction-File Poisoning & False-Positive Hook Eval:** Detailed analysis of TrojanForge, AIShellJack (83.4% Cursor auto-approval attack rate), and empirical testing of 12 hooks showing high false-positive bypass rates. | CSA Research Note 2026; TrojanForge 2026 | **Yes:** Implement file integrity hashing and minimal-surface hooks. |
| **`google-gemini-4-argon`** | **Detailed Tool-Output Token Tax:** Quantified that capping command output at 4,000 bytes cuts token overhead by ~50%; identified Claude Code's memory concatenation behavior. | Anthropic Claude Code Docs 2026 | **Yes:** Add 4KB output truncation to all harness tool wrappers. |
| **`google-gemini-3.8-flash`** | **Comparative Matrix across 6 User-Centric Axes:** Evaluated 14 harnesses across install friction, multi-runtime coverage, deterministic safety, task scoping, teaching dial, and beginner failure modes. | Comparative Survey 2026 | **Yes:** Use as foundational architecture positioning. |
| **`openai-gpt-6`** | **26-Family Taxonomy & RFC Policy Schemas:** Formulated formal JSON schemas for rule enforcement and adapter lifecycle hooks (`PreToolUse`, `SessionStart`). | RFC Policy Specs | **Yes:** Adopt for adapter interface typing in `src/adapters/types.ts`. |
| **`muse-spark`** | **Agent Skills Open Standard & Directory Layout:** Mapped discovery paths for `.agents/skills/` and `.claude/skills/` with YAML metadata frontmatter. | Agent Skills Standard | **Yes:** Standardize `src/skills/` to compile to both directories. |

---

## 4. Gaps in the Collective Research

1. **Native Mobile & WebContainer Runtimes:** No contributor measured harness behavior inside browser-based WebContainers (StackBlitz / Bolt.new) or mobile coding environments (Replit Mobile). How does `vibe-fence` enforce hooks when no native OS shell exists?
2. **Dynamic Cross-Agent Context Synchronization:** When a user switches between Cursor, Claude Code, and OpenCode on the same repo in the same afternoon, how do their respective memory caches (`MEMORY.md`, `.cursor/rules/`, `settings.json`) stay synchronized without drift?
3. **Deterministic Token-Cap Benchmarks on Greenfield JS:** While Argon and DeepSeek cited Python repository studies, the exact failure curve of context files on small Next.js / TypeScript starter repos was estimated rather than benchmarked.

---

## 5. The Consolidated Answer

A safe coding harness for non-technical users cannot be built out of text files alone. While `AGENTS.md` and `SKILL.md` are the indispensable cross-runtime distribution formats, empirical research proves that declarative markdown rules are treated as advisory suggestions that models ignore under load, and that instruction files themselves represent a serious emerging attack surface (>80% injection success in auto-approval modes). To protect non-technical vibe-coders, `vibe-fence` must deploy a **three-tier architecture**: (1) a lean, progressive-disclosure router (`AGENTS.md` ≤ 150 lines); (2) deterministic pre-execution client hooks (`PreToolUse`) enforcing zero secrets, 4KB command output caps, and project-root containment; and (3) an autonomous checkpoint engine that creates atomic git snapshots before every change, enabling single-command rollback without cognitive overhead.

---

## 6. Actions for Phase 1

### Copy (Proven Patterns to Adopt)
1. **The 3-Tier Progressive Disclosure SKILL.md Pattern:** Name and description in frontmatter (~50 tokens), full body loaded on demand, supporting scripts isolated in `scripts/`. (`muse-spark`, `gemini-3.8-flash`)
2. **Aider's Atomic Git Checkpoint Engine:** Execute `git commit -m "checkpoint: [action]"` immediately before multi-file edits or shell commands, paired with `npx vibe-fence undo`. (`gemini-3.8-flash`, `argon`)
3. **4,000-Byte Command Output Capping:** Intercept terminal outputs from linters, test runners, and builds; truncate at 4KB to save 50% token overhead and eliminate "Lost in the Middle" attention degradation. (`argon`)

### Avoid (Anti-Patterns to Reject)
1. **Monolithic Instruction Dumping:** Never generate a 500+ line `AGENTS.md` or `.cursorrules`. It causes instruction drift and increases token costs by +20% with zero accuracy gain. (`argon`, `deepseek`)
2. **Text-Only Security "Fences":** Never claim an app is secure merely because `AGENTS.md` says "do not write vulnerabilities". (`deepseek`, `minimax`)
3. **Heavyweight Infrastructure Prerequisites:** Do not require Docker, Tilt, or Kubernetes proxies (Archestra pattern). `vibe-fence` must run via `npx` in pure userland. (`gemini-3.8-flash`)

### Invent (Novel Primitives to Build)
1. **The Dual-Format Adapter Compiler (`tools/generate.ts`):** Single canonical skill/rule definitions in `src/skills/` and `src/rules/` that deterministically compile to:
   - Root `AGENTS.md` (OpenAI Codex, OpenCode, general)
   - `.claude/skills/` + `CLAUDE.md` (Claude Code)
   - `.cursor/rules/*.mdc` (Cursor)
   - `.windsurf/rules/` (Windsurf)
2. **The File Integrity Attestation Guard (`src/framework/integrity.ts`):** Cryptographic SHA-256 hash tracking of `.fence/invariants.md` and `AGENTS.md` to prevent indirect prompt-injection poisoning from untrusted dependencies. (`minimax`)
3. **Teachable Turbo Contract with Gated Risk Bands:** Auto-approving safe code edits under checkpointing while hard-pausing on irreversible actions (database drops, production deploys, billable services). (`gemini-3.8-flash`, `minimax`)

---

## 7. Open Questions

- [ ] **Acceptable False-Positive Threshold:** What percentage of false-positive blocks will a vibe-coder tolerate before permanently disabling the harness? (Target: < 2% via strict allowlists).
- [ ] **Cross-Platform Hook Latency:** Does executing pre-commit hooks introduce noticeable lag on Windows NTFS compared to macOS APFS?

---

## 8. Deduplicated Sources Table

| # | Source URL / Identifier | Type | Primary Contributor |
|---|---|---|---|
| 1 | [https://agents.md](https://agents.md) — Open AGENTS.md Standard | Specification | `gemini-3.8-flash`, `deepseek`, `minimax` |
| 2 | [arXiv:2602.14690v4](https://arxiv.org/html/2602.14690v4) — *Configuring Agentic AI Coding Tools: An Exploratory Study* | Academic Paper | `deepseek` |
| 3 | [Cloud Security Alliance Research Note (2026)](https://labs.cloudsecurityalliance.org) — *Indirect Prompt Injection in Coding Agents* | Security Report | `minimax` |
| 4 | [https://code.claude.com/docs/en/overview](https://code.claude.com) — Anthropic Claude Code Architecture | Official Docs | `argon`, `gemini-3.8-flash`, `muse-spark` |
| 5 | [https://cursor.com](https://cursor.com) — Cursor Rules & MDC Documentation | Official Docs | `gemini-3.8-flash`, `muse-spark` |
| 6 | [https://aider.chat](https://aider.chat) — Aider AI Pair Programming Architecture | Official Docs | `gemini-3.8-flash`, `argon` |
| 7 | [arXiv:2601.17548v1](https://arxiv.org/html/2601.17548v1) — *AIShellJack: Prompt Injection Attacks on AI Coding Agents* | Academic Paper | `minimax` |
| 8 | [https://developer.nvidia.com/blog/mitigating-indirect-agents-md-injection-attacks/](https://developer.nvidia.com) — NVIDIA AI Red Team Report | Security Advisory | `minimax` |
| 9 | [https://github.com/archestra-ai/archestra](https://github.com/archestra-ai/archestra) — Archestra Enterprise Gateway | GitHub Repo | `gemini-3.8-flash`, `argon` |
| 10 | [https://github.com/anthropics/skills](https://github.com/anthropics/skills) — Agent Skills Specification | Standard Spec | `muse-spark`, `gemini-3.8-flash` |
