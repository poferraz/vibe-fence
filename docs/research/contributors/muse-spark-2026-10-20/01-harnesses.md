# Stream 01 — Existing Harnesses Taxonomy

> **Model:** muse-spark · **Provider:** Muse Spark via Hermes Agent · **Date:** 2026-10-20 · **Stream:** 01 — Existing Harnesses
>
> Research question: *What exists, what each gets right/wrong for non-technical users?*
> Covers: Agent Skills spec, Claude Code, OpenCode, Cursor, Codex, Roo Code, Continue, Windsurf/Cascade, Archestra, LangGraph, Vercel AI SDK, Pydantic AI, Hermes Agent, AGENTS.md collections & scaffolding.

---

## 1. Agent Skills — The Open Standard

Agent Skills is an open format originated by Anthropic and now adopted widely: a folder with a required `SKILL.md` (YAML frontmatter `name` + `description` + markdown body) plus optional `scripts/`, `references/`, `assets/` directories [Source 1][Source 2].

**Progressive disclosure** is the core mechanism: at startup the harness loads ~50–100 tokens per skill (name + description); full instructions load only when the model decides the task matches [Source 2][Source 1]. This keeps large skill inventories cheap in context — a design vibe-fence should replicate. *Strength: practiced.*

The spec defines discovery paths `.agents/skills/` (cross-client), `.claude/skills/` (Claude-compatible), `.agents/skills` via multiple roots, and project/global scopes discovered by walking from CWD to repo root [Source 3][Source 14]. A skill marketplace exists at `skills.sh` and the spec has a reference SDK for harness authors [Source 1][Source 3].

| Field | Assessment |
|---|---|
| Install friction | Low for consumers — drop a folder or `git clone` into a discovery path; marketplace via `skills.sh` is one command. No build step. *practiced* |
| Runtime coverage | Multi-runtime by design — Claude Code, OpenCode, Codex, Hermes Agent all claim support. *practiced* |
| Safety | None built-in; skills are markdown instructions, not enforced guardrails. Safety depends on what the skill author writes. *contested* |
| Scoping | None enforced; skills can describe workflows but cannot gate execution. *practiced* |
| Teaching | Author-dependent — skills can embed explanatory text but the harness does not enforce a teaching dial. *practiced* |
| Failure for beginners | Silent non-triggering: if the `description` is poorly written the skill never activates and the user has no signal. Duplicate/conflicting skills compound silently. |

---

## 2. Claude Code

### 2a. Skills in Claude Code

Claude Code implements the Agent Skills spec natively plus proprietary extensions: `context: fork` (isolated sub-agent), `disable-model-invocation`, bundled hooks, and richer frontmatter fields [Source 3][Source 4]. Skills activate via the model's judgment on `description`; explicit user invocation exists via slash-like triggers but is not the primary path.

### 2b. Plugins, Hooks & Permissions

- **Plugins:** Claude Code plugins are JS modules with lifecycle hooks; a marketplace exists (`--discover` / plugin registry) [Source 15].
- **Hooks:** `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, etc., as shell commands, HTTP endpoints, or in-process JS functions with JSON I/O [Source 16]. Hooks can block tool calls — the only harness-level enforcement primitive for safety.
- **Permissions:** Tool allow/deny/ask configured per-skill and globally; applies to tool calls, not skill-load decisions [Source 4].

| Field | Assessment |
|---|---|
| Install friction | Medium — skills are folder drops; plugins install via marketplace or manual config. Hooks require shell/JS authoring. *practiced* |
| Runtime coverage | Single-runtime (Claude family + API via code execution tool). *proven* |
| Safety | Strongest among agent harnesses: permission-gated tools, PreToolUse blocks, enterprise SSO/RBAC via provisioning. But enforcement is opt-in config, not default. *practiced* |
| Scoping | Not out-of-box; achievable via hooks/skills that inject plan → approval patterns, but user must author them. *contested* |
| Teaching | Not built-in; skills can include teaching text. No dial concept. *practiced* |
| Failure for beginners | Permission prompts overwhelm; hooks misconfiguration silently breaks workflows; proprietary `context: fork` skills don't port — lock-in. |

---

## 3. OpenCode

OpenCode splits extensibility into two orthogonal systems [Source 3]:

- **Skills:** Same `SKILL.md` format, loaded from `.opencode/skills`, `~/.config/opencode/skills`, plus Claude- and agent-compatible paths. Model triggers via `skill` tool; per-skill `allow/deny/ask` permissions (finer than Claude Code's tool-level gates) [Source 3].
- **Plugins:** JS/TS modules from `.opencode/plugins/` or npm (auto-installed via Bun at startup) hooking `tool.execute.before`, `session.idle`, `experimental.session.compacting`, and able to register custom tools [Source 3][Source 8].

Ecosystem: ~40 community plugins (Helicone, Sentry, Firecrawl, Daytona sandboxing, auth bridges); no first-party skill marketplace — distribution via git/third parties like `skills.sh` [Source 3][Source 8].

| Field | Assessment |
|---|---|
| Install friction | Low for skills; medium for plugins (npm + Bun). Clean split praised in independent review: "declarative markdown for knowledge, real code for enforcement" [Source 3]. *practiced* |
| Runtime coverage | Single-runtime (OpenCode) but reads `.claude/skills` natively so Claude skills work unmodified (subset). *practiced* |
| Safety | Plugins can enforce safety (e.g., `.env` read blocker example in docs) but npm plugins are arbitrary code at startup — supply-chain risk [Source 3]. |
| Scoping | Via plugins/hooks; no batteries-included task decomposition. *practiced* |
| Teaching | Same as generic skills — author-dependent. *practiced* |
| Failure for beginners | Unknown frontmatter silently ignored (Claude extensions like `context: fork` do nothing); no skill versioning; plugins = arbitrary code with no sandbox. Config surface moves fast with breaking changes [Source 3]. |

---

## 4. Cursor — Rules / MDC

Cursor provides four rule scopes: Project (`.cursor/rules/*.mdc`), User (global), Team (dashboard-managed, Team/Enterprise), and `AGENTS.md` as a markdown fallback [Source 5]. Each `.mdc` carries frontmatter controlling inclusion:

| `alwaysApply` | `description` | `globs` | Behavior |
|---|---|---|---|
| `true` | — | — | Every chat session |
| `false` | — | pattern | When a matching file is in context |
| `false` | provided | omitted | Agent pulls in when it judges relevance |
| `false` | omitted | omitted | Only on `@mention` |

Rules prepend to model context at prompt level — persistent, reusable context across completions.

| Field | Assessment |
|---|---|
| Install friction | Low — create `.mdc` files or `AGENTS.md`. Team rules need dashboard. *practiced* |
| Runtime coverage | Single-runtime (Cursor editor). AGENTS.md fallback aids cross-harness portability. *practiced* |
| Safety | None enforced — rules are prompt instructions, not policy gates. No tool-permission layer comparable to Claude/OpenCode hooks. *practiced* |
| Scoping | Can encode workflow conventions but not enforce checkpoints; relies entirely on model compliance. *practiced* |
| Teaching | No built-in teaching behavior. *practiced* |
| Failure for beginners | `alwaysApply: true` rule bloat fills context with irrelevant instructions; `Apply Intelligently` depends on description quality (same silent-failure as skills). Plain `.md` in `.cursor/rules` is silently ignored (needs `.mdc` + frontmatter) [Source 5]. |

---

## 5. OpenAI Codex — AGENTS.md & Prompt Packs

### Prompt layer

Codex resolves instructions via a chained file discovery [Source 6]:

1. **Global:** `~/.codex/AGENTS.md` (or `.override.md`)
2. **Project:** walks from Git root down to CWD, one file per directory; `AGENTS.override.md` wins per directory; closer files appear later (override).
3. **Cap:** combined size limited by `project_doc_max_bytes` (32 KiB default) — overflow is silently truncated.

The official cookbook recommends an extended harness on top: `GOALS.md`, `PLANS.md`, `PROMPTS.md`, and a `harness/build/phase-*.md` directory, each phase capturing desired outcomes, acceptance criteria, and boundaries. The `codex --init` command can scaffold `AGENTS.md` from repo contents [Source 10].

### Codex app / cloud

Separate surfaces exist: local CLI, cloud-based code review, and ChatGPT integration, each with slightly different AGENTS.md handling.

| Field | Assessment |
|---|---|
| Install friction | Very low — single `AGENTS.md` file; `/init` scaffolds it. Extended harness (phase files) is manual. *practiced* |
| Runtime coverage | Single-runtime (Codex). AGENTS.md is increasingly cross-adopted (Cursor, agentic wrappers) but Codex-specific knobs (`project_doc_fallback_filenames`, byte cap) don't port. *practiced* |
| Safety | None enforced — pure prompt instructions. No permission/hook layer. *practiced* |
| Scoping | Cookbook pattern explicitly advocates small phase files to enable "human gating to manually review code quality" [Source 10] — but it is convention, not enforced. |
| Teaching | None built-in. *practiced* |
| Failure for beginners | 32 KiB cap silently drops instructions with no warning; nested override semantics confuse; phase-file harness requires discipline beginners lack. |

---

## 6. Roo Code

Roo Code (prev. Roo Cline) is a VS Code extension providing an autonomous coding agent with [Source 7]:

- **Modes:** built-in `Code`, `Architect`, `Ask` (Chat) modes plus unlimited user-defined custom modes (e.g., QA Engineer, Product Manager, Designer) each with own prompt + allowed tools + optional file-pattern restrictions.
- **Capabilities:** natural-language chat, file read/write, terminal commands, browser automation, OpenAI-compatible model routing.
- **Marketplace:** modes are shareable as JSON/packages.

| Field | Assessment |
|---|---|
| Install friction | Low — VS Code extension install. Mode marketplace requires manual config. *practiced* |
| Runtime coverage | Single-runtime (VS Code; no standalone CLI harness). *practiced* |
| Safety | Mode-level tool restrictions and file-pattern allowlists provide coarse safety scoping. No secrets scanning, dep checks, or OWASP enforcement. *practiced* |
| Scoping | Modes implicitly scope work (Architect plans → Code implements), but checkpoint/approval gating is not automated. *practiced* |
| Teaching | Mode personality can embed teaching tone, but no dial — fixed persona per mode. *practiced* |
| Failure for beginners | Mode proliferation confuses — beginners don't know which mode to pick; custom modes allow any prompt so malicious/misconfigured modes can over-permission tools; no guardrail against agent running destructive terminal commands beyond the mode's allowlist. |

---

## 7. Continue

Continue is an open-source coding agent (IDE extension for VS Code & JetBrains) with [Source 8][Source 17]:

- **Config:** `~/.continue/config.yaml` (local) + `.continuerc.json` (workspace overlay, `merge`/`overwrite`); legacy `config.json`/`config.ts` migration path.
- **Features:** Chat, autocomplete (tab), `config.yaml` model/tool/slash-command configuration, prompt files (replacing deprecated `slashCommands`), MCP-like tooling.
- **Scope:** Primarily a coding assistant, not a full harness framework — less opinionated than Roo/Archestra.

| Field | Assessment |
|---|---|
| Install friction | Low — extension install; config is YAML. Frequent config format churn (JSON → YAML migration) adds friction [Source 17]. *practiced* |
| Runtime coverage | Multi-IDE (VS Code + JetBrains) but single agent runtime (Continue). *practiced* |
| Safety | None enforced — no permission/blocking hooks, no secrets handling. *practiced* |
| Scoping | No built-in task decomposition or approval gates. *practiced* |
| Teaching | None. *practiced* |
| Failure for beginners | Config migration churn breaks setups silently; weak harness opinion means beginners get an unopinionated chat that can rewrite arbitrary files with no guardrails. |

---

## 8. Windsurf (Codeium) — Cascade & Rules

Cascade (inside Windsurf/Cascade Docs) offers [Source 9][Source 18]:

- **Dual modes:** Code (edits) vs Chat (Q&A); planning via Todo list continuously refined by a planning sub-agent.
- **Extensibility:** Memories & Rules (persistent instructions), MCP servers, Cascade Hooks (pre/post tool events).
- **Models:** SWE-1 family (SWE-1, SWE-1-mini, SWE-1-lite) plus third-party models; model-per-plan pricing.

| Field | Assessment |
|---|---|
| Install friction | Low — Windsurf editor handles install; Cascade Hooks require authoring. *practiced* |
| Runtime coverage | Single-runtime (Windsurf/Cascade); Windsurf was acquired by Cognition/Devin, adding execution-path uncertainty. *contested* |
| Safety | Hooks can block/augment but no default safety policy (secrets, deps, OWASP). *practiced* |
| Scoping | Built-in Todo/plan tracking with planning sub-agent is the strongest scoping primitive among IDE harnesses. Still prompt-level, not enforced gate. *practiced* |
| Teaching | Not explicit; planning commentary incidentally teaches. *practiced* |
| Failure for beginners | 40 tool-invocation limit per prompt (requires manual `continue` consuming extra credits); Auto-Continue burns credits opaquely [Source 9]. Acquisition uncertainty undermines trust for long-term harness investment. |

---

## 9. Archestra — Enterprise Harness

Archestra (`archestra-ai/archestra`, ~4.4k stars, AGPL-ish "Other" license) is the most comprehensive harness surveyed — an entire enterprise AI platform [Source 11]:

- **Gateways:** LLM gateway (any provider, cost limits, virtual keys, dynamic routing), MCP gateway (OAuth + On-Behalf-Of), A2A gateway.
- **Registry & Orchestrator:** private MCP registry, K8s operator with self-serve promotion.
- **Agent runtime:** scheduled/email/webhook triggers, sub-agent delegation, reusable skills, sandboxed code execution, K8s-native filesystem.
- **Guardrails:** deterministic tool-call guardrails + "Lethal Trifecta" protections (prompt injection, privilege escalation, data exfiltration), SSO/RBAC, per-env egress policies, cost limits.
- **Observability:** OpenTelemetry traces + Prometheus metrics + per-team cost tracking, first-class [Source 11].

| Field | Assessment |
|---|---|
| Install friction | High — `docker run` with Postgres, Docker socket, archestra platform stack; K8s operator for production. Massive TCO vs single-file harnesses. *practiced* |
| Runtime coverage | Multi-runtime gateway (points Claude Code/Codex/Cursor at one URL) — strongest runtime breadth, but via proxy, not drop-in file. *practiced* |
| Safety | Strongest in survey: deterministic guardrails, Lethal Trifecta, sandboxed execution, SSO/RBAC, egress policies. Closest to vibe-fence's safety ambition. *practiced* |
| Scoping | Orchestrator + gateway provides scoping but aimed at enterprise multi-agent flows, not individual vibe-coder projects. *practiced* |
| Teaching | None aimed at beginners; UX is chat portal for non-technical users but teaching dial absent. *practiced* |
| Failure for beginners | Overkill — Docker, Postgres, K8s, Slack/Teams integration are non-starters for a solo vibe-coder; AGPL/Other licensing limits self-hosting assumptions; operational complexity dwarfs the problem it solves for individuals. |

---

## 10. LangGraph & LangGraph Harness

LangGraph is a stateful orchestration framework for LLM agents (nodes/edges/checkpoints, persistent memory, human-in-the-loop interrupts) [Source 19]. The "harness" layer consists of:

- **LangGraph framework:** defines the graph; user authors nodes, stores, checkpointer.
- **Harness runtimes:** third-party wrappers that host LangGraph apps in sandboxed execution — e.g., `DigitalOcean Harness Runtime` which clones a repo at a pinned commit, installs `requirements.txt`/`pyproject.toml`, and starts `langgraph dev` against `langgraph.json`'s declared graph [Source 12].

`langgraph.json` declares `dependencies` + `graphs: {name: "path/to/file.py:variable"}` [Source 12].

| Field | Assessment |
|---|---|
| Install friction | High — must author a LangGraph app (Python, `langgraph.json`, graph compile), then deploy harness; not a drop-in harness. No `npm`/`npx` equivalent. *practiced* |
| Runtime coverage | Framework-agnostic (any model/provider via LangChain integrations), but the graph is the runtime — single-harness paradigm. *practiced* |
| Safety | None default — user-provided tools, no secrets/dep/OWASP enforcement. Sandbox isolation in hosted runtimes only. *practiced* |
| Scoping | Best-in-class scoping primitive: `interruptBefore`/`interruptAfter` + checkpointed resumption + human-in-the-loop approvals are first-class. Closest model for vibe-fence's approval-gate / turbo concept. *proven* — widely used in production LangGraph apps. |
| Teaching | None. *practiced* |
| Failure for beginners | Must learn LangGraph (state schema, reducers, checkpointer, graph authoring) — an expert framework with no beginner on-ramp; harness runtimes (DigitalOcean etc.) add deployment complexity (GitHub repo + pinned commit SHA, manifest) [Source 12]. |

---

## 11. Vercel AI SDK

Not a file-drop harness but a TypeScript SDK + platform for building agents [Source 13][Source 20][Source 21]:

- **Core:** `npm i ai`, provider-agnostic `generateText`/`generateObject`/`streamText`, `ToolLoopAgent` with `tool({ description, inputSchema, execute })`, AI Gateway (400+ models, one endpoint), AI Elements UI kit.
- **Durable agents:** `WorkflowAgent` (combines AI SDK agent loop with Workflow SDK `'use workflow'`/`'use step'` persisted execution, approval hooks, timers, idempotency keys, Vercel Sandbox + Drives) — survives timeouts, suspends on approval, recovers after deploy [Source 20].
- **Workflow patterns:** documented patterns for agent routing, human-in-the-loop, fan-out.

| Field | Assessment |
|---|---|
| Install friction | Low (SDK) for building agents; high (Workflow SDK, Vercel platform) for durable execution. Requires Vercel deployment for full durability. *practiced* |
| Runtime coverage | Multi-framework (Next.js, React, Svelte, Vue, Node.js) + provider-agnostic models via Gateway. *proven* — heavy production adoption. |
| Safety | Sandbox for tool execution; no OWASP/secrets/dep enforcement. Safety is author responsibility. *practiced* |
| Scoping | Durable execution + approval hooks provide explicit scoping primitive (suspend/resume on human approval) [Source 20]. *practiced* |
| Teaching | None. *practiced* |
| Failure for beginners | Durable-agent setup requires understanding Workflow SDK directives (`'use step'`), storage separation (history vs DB vs file storage), and Vercel platform coupling — not a beginner harness. Without Workflow SDK, no checkpoint/resume; beginners get a streaming LLM wrapper, not a harness. |

---

## 12. Pydantic AI

Type-safe Python agent framework (`pydantic-ai`) — agents with typed tools, structured output via Pydantic validation, multiple model provider adapters [Source 22]. Similar positioning to LangGraph/LangChain but lighter.

| Field | Assessment |
|---|---|
| Install friction | Medium — `pip install pydantic-ai`, write typed agent code. No harness scaffolder. *practiced* |
| Runtime coverage | Multi-model, single-framework (Python). *practiced* |
| Safety | Type safety narrows class of runtime errors; no security guardrails. *practiced* |
| Scoping | None out-of-box; user composes workflows manually. *practiced* |
| Teaching | None. *practiced* |
| Failure for beginners | Python-only, typing-heavy; requires agent-authoring skill; no deploy/runtime harness — building an agent, not constraining one. |

---

## 13. Hermes Agent

Nous Research's Hermes Agent is the reference for skill-driven, self-improving harnesses: built-in skill discovery (Agent Skills spec compatible), cron scheduler (natural-language automations), sub-agent delegation, 7 terminal backends (local / Docker / SSH / Singularity / Modal / Daytona / Vercel Sandbox), plugin catalog, memory/FTS5 session recall, skill self-improvement loop [Source 23][Source 24].

| Field | Assessment |
|---|---|
| Install friction | Medium — git clone + `hermes` CLI + config; heavier than file-drop but lighter than Archestra. *practiced* |
| Runtime coverage | Multi-runtime via adapters concept; currently Hermes-native but spec-aligned. *practiced* |
| Safety | Cron/scheduled skill execution + sandbox backends provide isolation primitives; no dedicated secrets/OWASP enforcement surfaced. *practiced* |
| Scoping | Queue/session state + sub-agent delegation provide scaffolding-friendly primitives; teaching/turbo not built-in. *practiced* |
| Teaching | Learning loop / memory model (Honcho dialectic) gestures toward adaptive UX — closest to vibe-fence's companion vision. *contested* — novel, unproven at scale. |
| Failure for beginners | Requires self-hosting decision (VPS/Modal/Daytona/serverless); model-agnostic flexibility becomes choice overload; Telegram/Discord/CLI surface split confuses single-project focus. |

---

## 14. AGENTS.md Collections & Scaffolding Tools

### AGENTS.md as lingua franca

- **Official spec:** `openai/agents.md` (used by 20k+ open-source projects [Source 25]) — a README-for-agents at repo root.
- **Awesome collections:**
  - `khasky/awesome-agents-md` (MIT, ~46 stars) — single shared `AGENTS.md` (~200 lines, 32 KiB CI-enforced) covering communication concision, smallest-correct-diff discipline, verification gate before "done", commit-proposal habit; on-demand modules under `rules/` (security, DB, caching, resilience, deploy, payments) listed in `rules/INDEX.md`; hooks in `hooks/` (SessionStart → inject core; PreToolUse/Stop → enforce); install as Claude Code / Codex plugin via `.claude-plugin/` [Source 26].
  - `tairov/awesome-agents.md` (MIT, archived, ~35 stars) — curated list of AGENTS.md examples, spec links, projects using it (FastMCP, openai-agents-python, etc.) [Source 25].
- **Scaffolding lineage:** `create-*` / cookiecutter / `agent-starter-pack` (GoogleCloudPlatform) provide templated project starts (e.g., `GEMINI.md` per-folder guidance [Source 27]), but none auto-enforces hygiene post-scaffold — they set initial files and disappear.

| Field | Assessment |
|---|---|
| Install friction | Very low — clone `AGENTS.md` or import as plugin (Claude/Codex plugin install) [Source 26]. *practiced* |
| Runtime coverage | Multi-runtime by intent (one file for Claude/Codex/Gemini/Cursor) — the thinnest cross-harness compatibility layer. *practiced* |
| Safety | `khasky`'s hooks can enforce rules (guard/verify), but most collections are pure markdown — prompt-level compliance only. *practiced* |
| Scoping | Core covers "last pass before done" + workflow procedure via `rules/workflow.md`; still unenforced convention. *practiced* |
| Teaching | None; rules are terse imperatives for the agent, not explanations for the human. *practiced* |
| Failure for beginners | AGENTS.md bloat exceeding Codex's 32 KiB truncation is common; rule-module triggers depend on human/model recognizing when to load them; scaffolding tools don't persist — hygiene degrades immediately after `create`. |

---

## 15. Google Antigravity

Codelabs/docs present Antigravity as an agentic development platform (IDE + verification-driven workflow) [Source 28]. Public detail is thin (2025 announcement, codelabs starter). Treated as emergent — no mature harness surface to evaluate.

| Field | Verdict |
|---|---|
| Install friction | Unknown — invite/docs gated. *contested* |
| Runtime coverage | Single platform (Google). *contested* |
| Safety/Scoping/Teaching | Verification-driven workflow implies scoping ambition but no public enforcement primitives to audit. *contested* |
| Failure for beginners | Platform uncertainty + thin public docs = adoption risk. |

---

## Coverage Gaps

1. **Quantitative evals absent.** No harness publishes head-to-head evals on task success rate, token cost, or beginner error rate. Comparisons above are qualitative/practiced, not proven — stream 02 should address this.
2. **Antigravity, Windsurf/SWE-1.** Both have thin public harness docs; assessments rely on docs/blog rather than primary specs.
3. **Cursor pricing/enterprise lock.** Team Dashboard rules were not hands-on verified (plan requirement).
4. **Hermes Agent hardening.** Security claims for sandbox backends were not independently tested — trusted from docs.
5. **Non-Western harnesses.** Kimi CLI, Kilo Code, Cline-adjacent forks, and Asian-market agent harnesses were not deeply covered; future sweep recommended.

---

## Sources

| # | Source URL | Type | Accessed |
|---|---|---|---|
| 1 | https://agentskills.io/home | Spec / docs | 2026-10-20 |
| 2 | https://agentskills.io/skill.md | Spec / docs | 2026-10-20 |
| 3 | https://tomrochette.com/agents/skills/opencode-skills-and-plugins/ | Independent review | 2026-10-20 |
| 4 | https://support.claude.com/en/articles/12512176-what-are-skills | Vendor docs | 2026-10-20 |
| 5 | https://cursor.com/docs/rules.md | Vendor docs | 2026-10-20 |
| 6 | https://learn.chatgpt.com/docs/agent-configuration/agents-md | Vendor docs (OpenAI) | 2026-10-20 |
| 7 | https://github.com/hodlen/Roo-Code | Repo + docs | 2026-10-20 |
| 8 | https://docs.continue.dev/ide-extensions/quick-start | Vendor docs | 2026-10-20 |
| 9 | https://docs.windsurf.com/windsurf/cascade/cascade | Vendor docs | 2026-10-20 |
| 10 | https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex | Cookbook / vendor docs | 2026-10-20 |
| 11 | https://github.com/archestra-ai/archestra | Repo / README | 2026-10-20 |
| 12 | https://docs.digitalocean.com/products/managed-agents/agent-harness-runtime/how-to/run-langgraph-agent/ | Harness docs | 2026-10-20 |
| 13 | https://vercel.com/ai-sdk | Vendor docs | 2026-10-20 |
| 14 | https://opencode.ai/docs/plugins/ | Vendor docs | 2026-10-20 |
| 15 | https://code.claude.com/docs/en/plugins/overview | Vendor docs | 2026-10-20 |
| 16 | https://code.claude.com/docs/en/Hooks | Vendor docs | 2026-10-20 |
| 17 | https://docs.continue.dev/customize/deep-dives/configuration | Vendor docs | 2026-10-20 |
| 18 | https://docs.windsurf.com/windsurf/cascade/hooks.md | Vendor docs | 2026-10-20 |
| 19 | https://docs.langchain.com/oss/python/langgraph/overview | Vendor docs | 2026-10-20 |
| 20 | https://vercel.com/kb/guide/durable-ai-agents | Vendor docs | 2026-10-20 |
| 21 | https://vercel.com/docs/ai-sdk | Vendor docs | 2026-10-20 |
| 22 | https://pydantic.dev/pydantic-ai | Vendor docs | 2026-10-20 |
| 23 | https://github.com/Scaffolde/hermes-agent | Repo | 2026-10-20 |
| 24 | https://hermes-agent.nousresearch.com/docs/developer-guide/architecture | Vendor docs | 2026-10-20 |
| 25 | https://github.com/tairov/awesome-agents.md | Curated list | 2026-10-20 |
| 26 | https://github.com/khasky/awesome-agents-md | Curated harness | 2026-10-20 |
| 27 | https://github.com/GoogleCloudPlatform/agent-starter-pack/blob/main/GEMINI.md | Scaffolder example | 2026-10-20 |
| 28 | https://aistudio.google.com/docs/antigravity-agent | Vendor docs (Google) | 2026-10-20 |

---

## Implications for vibe-fence

1. **Copy Agent Skills progressive disclosure.** Load only `name+description` at startup; full body on trigger. It keeps large inventories cheap and is the consensus standard. *Invent: enforce it strictly at 10 KB always-loaded budget (like khasky CI guard) so vibe-fence never bloats context.*
2. **Copy OpenCode's markdown ∩ code split.** Declarative `SKILL.md` for knowledge the model should follow; real `hooks/plugins` for behavior the harness must enforce. This is the cleanest scoping/safety boundary in the survey — vibe-fence should adopt it as `skills/` vs `adapters/hooks/`.
3. **Copy Claude Code's PreToolUse blocking hooks.** The only harness-level enforcement primitive that actually stops bad tool calls. Vibe-fence must provide a `PreToolUse`-equivalent interceptor per adapter — without it, safety is prompt-wishful.
4. **Avoid single-runtime lock-in.** Every prompt-level harness that wins adoption (AGENTS.md, Agent Skills) does so via multi-runtime portability. Vibe-fence must ship `src/skills/` as runtime-agnostic definitions and `src/adapters/` per-runtime wiring, generating to both `.agents/skills/` and `.claude/skills/` / `.opencode/skills/` paths.
5. **Avoid silent truncation and silent non-triggering.** Codex's 32 KiB cap drops instructions without warning; poorly-described skills never fire. Vibe-fence's generator must **fail the build** on byte-budget overflow and CI-check description quality — never silently degrade.
6. **Avoid `alwaysApply: true` bloat.** Cursor's footgun is stuffing every session with irrelevant rules. Vibe-fence's always-loaded core must stay under a budget; heavier modules load on-demand via explicit triggers.
7. **Avoid npm-as-plugin supply chain by default.** OpenCode plugins are arbitrary startup code. Vibe-fence's default experience must not require `npm install` of third-party plugins — prefer local hook scripts that the user can audit, with any npm bridges clearly marked risky.
8. **Avoid scaffold-and-disappear.** Every `create-*` scaffolder sets initial files and vanishes; hygiene decays. Vibe-fence must be persistent: state files (`.fence/`), continuous hooks, and verification gates that re-assert on every session.
9. **Invent portable safety enforcement.** No surveyed harness ships default secrets/OWASP/dep hygiene as enforced policy. This is vibe-fence's core differentiator: bundle `vibe-guard` as default-enabled hooks that block leaks (secrets in files/git, insecure deps, missing auth), not just advise.
10. **Invent a teaching dial.** Zero harnesses implement a dialed explanation layer. Copy Hermes's memory/companion ambition but make it explicit: teaching levels `max → med → min → silent`, with turbo gating (ask vs let-fly) surfaced in the harness, not buried in persona prompts. The structured `issue → fix → plan` queue (agent resolves, user observes) fills the gap Roo/Continue/Cascade leave blank.
11. **Invent scoping with enforced approval gates for beginners.** LangGraph's interrupt pattern and Vercel's approval hooks are expert-only; Codex's phase-file convention is discipline-only. Beginner-friendly vibe-fence should default to small phasic decomposition with explicit approval checkpoints — and a "teachable turbo" toggle — so scope discipline is the path of least resistance, not an advanced feature.
12. **Invent a one-command install.** The only friction level beginners tolerate is `npx vibe-fence init`. Copy AGENTS.md's proven friction (one file), add deterministic generation (`src → dist`) and multi-path fan-out so one command seeds every adapter/skill path the user might use.

