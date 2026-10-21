# Stream 01: Existing Harnesses — Research Report

- **Model:** Gemini 3.8 Flash
- **Provider:** Google DeepMind (Antigravity)
- **Date:** 2026-10-20
- **Stream:** 01 — Existing Harnesses

---

## Executive Summary

An AI coding "harness" is any system that constrains, guides, instruments, or scaffolds an LLM's autonomy when reading, writing, and executing code in a repository. 

Today's landscape divides into three distinct tiers:
1. **Agent Skills & Editor Rules** (Cursor, Claude Code, OpenCode, Roo Code, Continue, Windsurf, Aider): Simple markdown instructions, glob-routed context files, and tool/permission configurations. Highly accessible, but almost completely lack active runtime safety enforcement, automatic task decomposition, or pedagogical explanations.
2. **Framework & Gateway Harnesses** (LangGraph, Pydantic AI, Archestra, Vercel AI SDK, HumanLayer, Promptfoo): Heavyweight developer infrastructure offering durable human-in-the-loop (HITL) pause/resume, sandboxed MCP proxies, schema validation, and red-teaming. Extremely powerful, but require significant coding experience and backend setup.
3. **Context Scaffolders & Packagers** (Repomix, code2prompt, Aider Tree-sitter maps): Utilities that compress repository topologies into token-efficient, LLM-parseable formats, stripping secrets and focusing context.

**Core Gap for Non-Technical Vibe-Coders:** Not a single existing harness combines zero-friction installation (`npx init`), cross-runtime portability (working across Cursor, Claude Code, Codex, and OpenCode simultaneously), automated safety guardrails (blocking unencrypted secrets or dangerous shell commands before execution), and an adaptive companion UX (teaching on a dial rather than dumping raw linter/git errors).

---

## Findings

---

### 1. Cursor Rules (`.cursorrules` & `.cursor/rules/*.mdc`)

* **Category:** Agent Skills / Editor Rules
* **Claim:** Cursor has evolved from a monolithic single-file instruction format (`.cursorrules`) into a modular multi-file format (`.cursor/rules/*.mdc`) supporting YAML frontmatter for glob-matching and dynamic agent invocation.
* **Evidence:** [Cursor Documentation](https://cursor.com), [morphllm.com](https://morphllm.com), [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Low. Manual file placement or GUI creation in `.cursor/rules/*.mdc`. Zero package installation needed. |
| **Runtime coverage** | Single-runtime (strictly Cursor IDE Composer and Chat). |
| **Safety behavior** | None enforced at runtime. Rules are plain text system prompt injections; models frequently hallucinate compliance or ignore negative constraints under long context. |
| **Scoping behavior** | None native. The agent attempts full solutions unless prompted specifically to plan. No built-in task checkpointing. |
| **Teaching behavior** | Purely execution-oriented. Only explains if explicitly prompted to act as a tutor. |
| **Failure mode for non-technical user** | Context bloat or rule disregard: when rules contradict each other or exceed token budgets, the agent produces broken code; non-technical users cannot debug why the agent ignored instructions. |

---

### 2. Claude Code (`CLAUDE.md`, `.claude/skills/`, Hooks)

* **Category:** Agent Skills / CLI Agent Harness
* **Claim:** Anthropic's Claude Code standardizes project onboarding via `CLAUDE.md` and provides an open, three-tier progressive disclosure skill standard (`SKILL.md`) with bash scripts, reference docs, and pre-execution authorization hooks.
* **Evidence:** [Anthropic Claude Code Guide](https://claude.com), [Anthropic Skills Standard](https://github.com/anthropics/skills) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Low to moderate. Requires `claude` CLI install (`npm install -g @anthropic-ai/claude-code`). `CLAUDE.md` is a single root markdown drop; `.claude/skills/` requires directory structuring. |
| **Runtime coverage** | Native to Claude Code, though `CLAUDE.md` and `SKILL.md` are increasingly adopted by third-party harnesses (e.g. Antigravity, OpenCode). |
| **Safety behavior** | Moderate to high. Built-in interactive confirmation for terminal shell execution and file edits; supports `disable-model-invocation: true` in skill frontmatter to prevent autonomous execution of risky workflows. |
| **Scoping behavior** | Good. Encourages Plan Mode / exploration before writing code; can run subagents. However, human must approve or prompt planning steps. |
| **Teaching behavior** | Terse CLI output by default. Geared toward professional software engineers rather than explaining software concepts to beginners. |
| **Failure mode for non-technical user** | Shell command paralysis: prompt asking "Execute `rm -rf dist && npm run build`? [y/N]" terrifies beginners who do not understand what commands do or how to recover if something fails. |

---

### 3. OpenCode CLI & Plugins (`AGENTS.md`, Community Plugins)

* **Category:** Agent Skills / Open-Source TUI Harness
* **Claim:** OpenCode provides a multi-model terminal/IDE coding harness that reads `AGENTS.md`, offers custom agent personas (`opencode agent create`), and supports dynamic community plugins (`oh-my-opencode`, `opencode-skillful`, `opencode-mem`).
* **Evidence:** [OpenCode AI](https://opencode.ai), [OpenCode GitHub](https://github.com/opencode-ai/opencode) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Moderate. Requires CLI tool installation, API key configuration, and optional plugin setup. |
| **Runtime coverage** | Multi-model (OpenAI, Anthropic, Ollama, local models) with TUI, Web UI, and IDE extensions (VS Code, Cursor). |
| **Safety behavior** | Basic tool permissions (read/edit/run approval), but lacks proactive semantic security checks (e.g. scanning for leaked `.env` keys before git commit). |
| **Scoping behavior** | Supports specialized agent personas (e.g., dedicated `plan` agent without write tools), but requires user to manually switch modes or write complex agent routing configurations. |
| **Teaching behavior** | Minimal. Output is terminal-focused logging of diffs and tool executions. |
| **Failure mode for non-technical user** | Setup and terminal friction: users without shell literacy get stuck configuring environments, API keys, or handling merge conflicts. |

---

### 4. Cross-Agent Standard: `AGENTS.md` (OpenAI / AAIF / Cross-Industry)

* **Category:** Universal Instruction Harness
* **Claim:** `AGENTS.md` is an emerging vendor-neutral specification (supported by OpenAI Codex, Cursor, Gemini CLI, Claude Code, and Aider) acting as a `README.md` for agents, defining commands, code styles, and boundary constraints.
* **Evidence:** [agents.md specification](https://agents.md), [GitHub Blog on Agent Instructions](https://github.blog) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Zero. Single plaintext `AGENTS.md` file at repository root or subdirectories. |
| **Runtime coverage** | Universal / Multi-runtime (OpenAI Codex, Copilot, Cursor, Windsurf, Claude Code, OpenCode). |
| **Safety behavior** | Advisory only. "Never touch /secrets" in an `AGENTS.md` is an instruction to the LLM, not a hard deterministic sandbox block. |
| **Scoping behavior** | Purely informational. Can instruct agents to write tests first, but cannot programmatically enforce a multi-step approval gate. |
| **Teaching behavior** | None native. Depends completely on agent behavior. |
| **Failure mode for non-technical user** | False sense of security: non-technical users assume writing "do not introduce security vulnerabilities" protects their app, whereas models regularly bypass natural-language boundaries. |

---

### 5. Roo Code / Roo Cline (`.roomodes`, Tool Groups, `.roo/rules/`)

* **Category:** Editor Agent Harness / Permission-Gated Custom Modes
* **Claim:** Roo Code extends VS Code autonomous agents by allowing project-level `.roomodes` definitions that enforce strict least-privilege tool access (e.g. granting only `read` + `browser`, blocking `command` or `edit`).
* **Evidence:** [Roo Code Documentation](https://github.com/RooVetGit/Roo-Cline) (Accessed 2026-10-20).
* **Strength:** `proven` (hard-coded tool gating in client)

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Low inside VS Code. Creating `.roomodes` or `.roo/rules/` requires JSON and Markdown editing. |
| **Runtime coverage** | Single-runtime (VS Code / Roo Code extension only). |
| **Safety behavior** | High structural safety at the tool level. An agent in `architect` or `ask` mode physically lacks the write or shell execution tools, preventing accidental code modification. |
| **Scoping behavior** | Good. Custom modes allow strict separation between planning/architecture phases and execution phases. |
| **Teaching behavior** | Medium. UI displays step-by-step tool invocations and reasoning chains, but does not adapt vocabulary to beginner vs advanced users. |
| **Failure mode for non-technical user** | Mode confusion: beginners get trapped when the agent refuses to fix a bug because it is in a read-only mode, with no clear automated ladder to approve the edit. |

---

### 6. Continue (`~/.continue/config.yaml`, `.continue/rules/*.md`)

* **Category:** Open-Source IDE Extension Harness
* **Claim:** Continue provides modular assistant configuration across VS Code and JetBrains, migrating from legacy JSON to `.continue/rules/*.md` for automatic context injection across Chat, Edit, and Agent modes.
* **Evidence:** [Continue.dev Documentation](https://continue.dev) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Low to moderate. VS Code/JetBrains extension + YAML configuration files. |
| **Runtime coverage** | Multi-IDE (VS Code, JetBrains), multi-provider (Ollama, Anthropic, OpenAI, Mistral). |
| **Safety behavior** | Basic prompt instructions. No automated secret scanning or destructive command sandbox. |
| **Scoping behavior** | Minimal. User drives prompts manually. |
| **Teaching behavior** | Purely assistant/co-pilot oriented. |
| **Failure mode for non-technical user** | Fragile YAML configuration errors and model setup barriers (local model quantization, Ollama connection failures). |

---

### 7. Windsurf & Cascade (`.windsurfrules`, `.windsurf/rules/*.md`)

* **Category:** AI-Native IDE Harness
* **Claim:** Windsurf's Cascade agent utilizes persistent workspace rules (`.windsurfrules` and `.windsurf/rules/`) combined with deep IDE state awareness (linter errors, terminal output, file tracking).
* **Evidence:** [Codeium Windsurf Docs](https://codeium.com/windsurf) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Requires adopting a dedicated IDE fork (Windsurf). Rules files are standard markdown. |
| **Runtime coverage** | Single-runtime (Windsurf IDE). |
| **Safety behavior** | Prompts for terminal execution permission; incorporates active linter errors to prevent syntax breakage. Lacks domain security policies. |
| **Scoping behavior** | Cascade maintains an internal multi-step action plan, showing "Thinking" and planned changes before editing. |
| **Teaching behavior** | Good visual feedback in IDE pane, but explanations are technical and concise. |
| **Failure mode for non-technical user** | Vendor lock-in and IDE migration barrier: user must switch away from their existing editor; when Cascade hits terminal errors, beginners lack understanding of underlying build tools. |

---

### 8. Aider (`--architect`, Tree-sitter Repo-Map, `CONVENTIONS.md`)

* **Category:** CLI Pair Programming Harness
* **Claim:** Aider pioneers two critical harness techniques: (1) Architect Mode, which separates reasoning/planning (high-intelligence model) from code formatting/editing (fast editor model), and (2) Tree-sitter AST repository mapping, which feeds concise structural signatures without token bloat.
* **Evidence:** [Aider.chat](https://aider.chat), [Aider Repo Map](https://aider.chat/docs/repomap.html) (Accessed 2026-10-20).
* **Strength:** `proven` (benchmark-measured on SWE-bench and Aider benchmarks)

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Moderate. Requires Python `pip install aider-chat` or `pipx`, plus API keys in environment. |
| **Runtime coverage** | Standalone CLI; interfaces with git repositories regardless of editor. |
| **Safety behavior** | Automatic git commits after every change with clean commit messages, enabling instant rollback (`/undo`). |
| **Scoping behavior** | High in `--architect` mode: prompts the user to review the architect's design before applying diffs. |
| **Teaching behavior** | Minimal. Focuses on rapid, high-density terminal pair programming. |
| **Failure mode for non-technical user** | High CLI barrier: non-technical users struggle with terminal git concepts, merging conflicts, and configuring Python virtual environments. |

---

### 9. Archestra (`archestra-ai/archestra`)

* **Category:** Enterprise Gateway & MCP Harness
* **Claim:** Archestra serves as a centralized gateway between AI coding agents (Claude Code, Cursor, OpenCode) and company infrastructure, enforcing runtime security, MCP sandboxing, tool routing, and identity tracking.
* **Evidence:** [Archestra GitHub](https://github.com/archestra-ai/archestra), [archestra.ai](https://archestra.ai) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Very high. Deployed via Docker/Tilt (`tilt up`) or Kubernetes Helm charts. Designed for DevOps/Platform engineers. |
| **Runtime coverage** | Cross-agent (Claude Code, Cursor, Codex CLI, OpenClaw via standard proxy endpoints). |
| **Safety behavior** | Exceptional enterprise security: sandboxed MCP tool execution, OIDC/SAML authentication, runtime credential isolation, OpenTelemetry audit traces. |
| **Scoping behavior** | Enforced at the policy/gateway level rather than conversational decomposition. |
| **Teaching behavior** | None. Pure infrastructure proxy. |
| **Failure mode for non-technical user** | Complete mismatch: completely unusable by an individual non-technical vibe-coder due to DevOps prerequisites. |

---

### 10. LangGraph (Human-in-the-Loop & Durable State)

* **Category:** Agent Orchestration Framework
* **Claim:** LangGraph provides stateful multi-agent graph execution with persistent checkpoints (SQLite/PostgreSQL) and explicit human-in-the-loop interrupts (`interrupt_before`, `interrupt_after`) to inspect and modify state before code execution.
* **Evidence:** [LangChain LangGraph Docs](https://langchain-ai.github.io/langgraph/) (Accessed 2026-10-20).
* **Strength:** `proven` (widely benchmarked stateful graph architecture)

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | High. Python/TypeScript library; requires building custom agent pipelines from scratch. |
| **Runtime coverage** | Custom framework level; not an out-of-the-box user harness for existing coding agents. |
| **Safety behavior** | Deterministic gating: execution pauses hard before tool execution nodes until external approval resumes state. |
| **Scoping behavior** | Graph nodes naturally decompose tasks into sequential subgraphs with review gates. |
| **Teaching behavior** | Dependent on custom implementation. |
| **Failure mode for non-technical user** | Developer SDK: vibe-coders cannot build or configure custom LangGraph graphs. |

---

### 11. Pydantic AI (Type-Safe Schema Guardrails)

* **Category:** Python Agent Framework
* **Claim:** Pydantic AI enforces type-safe model boundaries by leveraging Pydantic schemas for tool inputs and structured outputs, providing automatic model retries on validation failure and strict runtime constraints.
* **Evidence:** [Pydantic AI Documentation](https://ai.pydantic.dev) (Accessed 2026-10-20).
* **Strength:** `proven` (formal schema validation mechanics)

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Python library (`pip install pydantic-ai`). |
| **Runtime coverage** | Developer framework for custom agents. |
| **Safety behavior** | Strong input/output sanitization: prevents malformed tool arguments or invalid payload injections before execution. |
| **Scoping behavior** | Controlled via structured output schemas. |
| **Teaching behavior** | None. Code-level framework. |
| **Failure mode for non-technical user** | Not a drop-in tool for consumer coding assistants. |

---

### 12. Vercel AI SDK & Workflow SDK (Durable HITL Approvals)

* **Category:** Full-Stack Agent Framework & UI Harness
* **Claim:** Vercel AI SDK implements native `needsApproval` / `toolApproval` primitives, coupled with durable serverless workflows that suspend execution during human review without timing out, resuming upon web or UI action.
* **Evidence:** [Vercel AI SDK Docs](https://ai-sdk.dev), [Vercel Workflows](https://workflow-sdk.dev) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Moderate for Next.js web developers; high for non-developers. |
| **Runtime coverage** | Web and Node.js applications; powers bespoke full-stack vibe-coding tools like v0. |
| **Safety behavior** | Tool execution interception: sensitive tools require explicit client-side confirmation before firing. |
| **Scoping behavior** | `ToolLoopAgent` allows bounded iterations and approval gates. |
| **Teaching behavior** | Enables generative UI widgets in chat to explain approval requests visually. |
| **Failure mode for non-technical user** | Requires maintaining a full-stack Next.js web application harness. |

---

### 13. Runtime Human Gating & Security Testing: HumanLayer & Promptfoo

* **Category:** Agent Security & Approval Harnesses
* **Claim:** HumanLayer provides approval gating over Slack/Email as a tool (`human_as_tool`), while Promptfoo provides pre-deployment red-teaming and automated adaptive runtime guardrails against prompt injection and excessive agency.
* **Evidence:** [HumanLayer](https://humanlayer.dev), [Promptfoo](https://promptfoo.dev) (Accessed 2026-10-20).
* **Strength:** `proven` (adversarial red-teaming benchmarks)

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Moderate. CLI tools and SDK packages (`npx promptfoo`, `pip install humanlayer`). |
| **Runtime coverage** | Multi-agent integration via API/SDK. |
| **Safety behavior** | Industry-standard: automated vulnerability scans (OWASP LLM Top 10) and physical out-of-band human authorization for high-risk actions. |
| **Scoping behavior** | HumanLayer gates individual risky functions; Promptfoo validates compliance against evaluation suites. |
| **Teaching behavior** | Detailed security vulnerability diagnostic reports. |
| **Failure mode for non-technical user** | Overwhelming security jargon: reports cite "CWE-79", "SSRRF", and "Indirect Prompt Injection" without beginner-friendly explanations or automated one-click remediation. |

---

### 14. Context Packagers & Scaffolders: Repomix & code2prompt

* **Category:** Context Engineering Tools
* **Claim:** CLI tools like Repomix (`npx repomix`) and code2prompt consolidate multi-file repository architectures into structured XML/Markdown formats, automatically respecting `.gitignore` and stripping sensitive files before passing context to LLMs.
* **Evidence:** [Repomix](https://repomix.com), [code2prompt](https://code2prompt.dev) (Accessed 2026-10-20).
* **Strength:** `practiced`

#### Attribute Breakdown

| Field | Analysis |
|---|---|
| **Install friction** | Zero to minimal (`npx repomix` runs instantly with no permanent installation). |
| **Runtime coverage** | Universal (generates text/XML files usable in any web chat or local agent). |
| **Safety behavior** | Built-in secret detection patterns and automatic `.gitignore` exclusion prevents accidental pasting of `.env` files into web models. |
| **Scoping behavior** | Focuses solely on context aggregation; does not govern agent task planning. |
| **Teaching behavior** | None. Pure context packing utility. |
| **Failure mode for non-technical user** | Manual copy-pasting loop: user must manually run command, copy output, paste to chat, and manually copy code back to files. |

---

## Comparative Matrix

| Harness | Zero-Friction Install (`npx`) | Multi-Runtime Coverage | Deterministic Safety Guardrails | Multi-Step Task Scoping | Pedagogical Teaching Dial | Beginner Friendly? |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Cursor (.mdc)** | ❌ (IDE GUI) | ❌ (Cursor only) | ❌ (Advisory prompts) | ❌ | ❌ | ⚠️ Moderate |
| **Claude Code** | ❌ (`npm -g`) | ⚠️ (Claude only) | ⚠️ (CLI prompt) | ⚠️ (Subagents) | ❌ (Terse CLI) | ⚠️ Moderate |
| **OpenCode** | ❌ (CLI install) | ⚠️ (OpenCode only) | ❌ (Advisory prompts) | ⚠️ (Agent personas)| ❌ | ❌ Low |
| **AGENTS.md** | ⚠️ (File copy) | ✅ (Universal) | ❌ (Advisory prompts) | ❌ | ❌ | ⚠️ Moderate |
| **Roo Code** | ❌ (VS Code) | ❌ (Roo only) | ✅ (Tool group locks) | ⚠️ (Custom modes) | ❌ | ⚠️ Moderate |
| **Aider** | ❌ (Python pip) | ⚠️ (CLI only) | ⚠️ (Auto-git undo) | ✅ (Architect mode)| ❌ | ❌ Low |
| **Archestra** | ❌ (Docker/K8s) | ✅ (Gateway proxy) | ✅ (MCP sandbox) | ❌ | ❌ | ❌ Enterprise only |
| **LangGraph** | ❌ (Code library)| ❌ (Custom code) | ✅ (HITL interrupts) | ✅ (Graph DAG) | ❌ | ❌ Devs only |
| **Repomix** | ✅ (`npx repomix`)| ✅ (Universal) | ⚠️ (Secret strip) | ❌ | ❌ | ⚠️ Moderate |
| **vibe-fence (Target)** | **✅ (`npx init`)** | **✅ (All major agents)**| **✅ (Enforced defaults)**| **✅ (Teachable turbo)**| **✅ (Max→Silent dial)**| **✅ High** |

---

## Coverage Gaps

1. **Deterministic Enforcement in Markdown-Only Harnesses:** There is currently no cross-agent standard that mechanically intercepts shell commands or file writes without custom IDE or proxy middleware. All `.cursorrules`, `.windsurfrules`, and `AGENTS.md` mechanisms rely on the LLM "choosing" to comply with natural language instructions.
2. **Empirical Benchmarks on Scaffolding vs Quality:** While Aider provides measurable benchmarks for its Tree-sitter repo map and Architect Mode, most community rule collections (e.g. `cursor.directory`, `awesome-cursorrules`) have zero empirical eval data comparing code pass rates with vs without rules.
3. **Beginner-Centric Companionship:** Existing tools assume the user understands git branches, terminal exit codes, package managers, and port conflicts. No mainstream harness provides a translation layer that converts raw errors into structured, queued options with friendly explanations.

---

## Sources

| # | Source URL / Repository | Type | Accessed |
|---|---|---|---|
| 1 | [https://cursor.com](https://cursor.com) | Official Docs | 2026-10-20 |
| 2 | [https://github.com/PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | GitHub Repo | 2026-10-20 |
| 3 | [https://cursor.directory](https://cursor.directory) | Web Directory | 2026-10-20 |
| 4 | [https://claude.com](https://claude.com) | Official Docs | 2026-10-20 |
| 5 | [https://github.com/anthropics/skills](https://github.com/anthropics/skills) | GitHub Repo | 2026-10-20 |
| 6 | [https://opencode.ai](https://opencode.ai) | Official Docs | 2026-10-20 |
| 7 | [https://github.com/opencode-ai/opencode](https://github.com/opencode-ai/opencode) | GitHub Repo | 2026-10-20 |
| 8 | [https://agents.md](https://agents.md) | Specification Docs | 2026-10-20 |
| 9 | [https://github.blog/ai-and-ml/generative-ai/](https://github.blog) | Technical Blog | 2026-10-20 |
| 10 | [https://github.com/RooVetGit/Roo-Cline](https://github.com/RooVetGit/Roo-Cline) | GitHub Repo | 2026-10-20 |
| 11 | [https://continue.dev](https://continue.dev) | Official Docs | 2026-10-20 |
| 12 | [https://codeium.com/windsurf](https://codeium.com/windsurf) | Official Docs | 2026-10-20 |
| 13 | [https://aider.chat](https://aider.chat) | Official Docs | 2026-10-20 |
| 14 | [https://github.com/archestra-ai/archestra](https://github.com/archestra-ai/archestra) | GitHub Repo | 2026-10-20 |
| 15 | [https://langchain-ai.github.io/langgraph/](https://langchain-ai.github.io/langgraph/) | Official Docs | 2026-10-20 |
| 16 | [https://ai.pydantic.dev](https://ai.pydantic.dev) | Official Docs | 2026-10-20 |
| 17 | [https://ai-sdk.dev](https://ai-sdk.dev) | Official Docs | 2026-10-20 |
| 18 | [https://workflow-sdk.dev](https://workflow-sdk.dev) | Official Docs | 2026-10-20 |
| 19 | [https://humanlayer.dev](https://humanlayer.dev) | Official Docs | 2026-10-20 |
| 20 | [https://promptfoo.dev](https://promptfoo.dev) | Official Docs | 2026-10-20 |
| 21 | [https://repomix.com](https://repomix.com) | Official Docs | 2026-10-20 |
| 22 | [https://code2prompt.dev](https://code2prompt.dev) | Official Docs | 2026-10-20 |

---

## Implications for vibe-fence

### 1. What to COPY

1. **Aider's Git Checkpoint Rollback Pattern:** Aider's technique of committing before and after every agent action is the single most effective safety net for non-technical users. *Copy:* vibe-fence must automatically initialize git (if absent) and create deterministic atomic checkpoints (`checkpoint: [action]`) before any multi-file edit or shell command, enabling zero-friction undo.
2. **Claude Code's Three-Tier Progressive Disclosure:** Do not bloat system prompts with hundreds of lines of instructions. *Copy:* Provide a lightweight root router (`AGENTS.md` / `CLAUDE.md`) that points agents to on-demand skill documentation in `.fence/skills/` only when relevant.
3. **Repomix's Secret Exclusion & Zero-Install Pattern:** *Copy:* Single-command execution via `npx vibe-fence init`, packaging project state and auto-excluding `.env`, private keys, and build artifacts from agent visibility.
4. **Roo Code's Distinct Persona / Mode Separation:** *Copy:* Enforce clear operational separation between a "Plan/Architect" phase (read-only, exploratory) and an "Act/Execute" phase.

### 2. What to AVOID

1. **Avoid Monolithic Instruction Files (`.cursorrules` antipattern):** Stating 50 rules in a single 600-line markdown file leads to instruction drift, high token costs, and random rule violations. Keep rules modular, scoped, and succinct.
2. **Avoid Heavyweight Infrastructure Prereqs (Archestra / LangGraph traps):** Requiring Docker, Kubernetes, Python environments, or backend proxy servers completely alienates vibe-coders. vibe-fence must be a zero-dependency npm drop-in that runs purely in the user's repository.
3. **Avoid Raw Technical Error Dumps:** Never show raw stack traces, linter outputs, or git rebase errors directly to the user. A harness for vibe-coders must intercept these and queue them as agent-solvable tasks.
4. **Avoid Passive Advisory Guardrails:** Writing "Please do not expose API keys" in a prompt does not prevent an LLM from writing an API key to a client-side component. Security must be enforced structurally (e.g. pre-commit git hooks, automated `.env` file shielding).

### 3. What to INVENT

1. **The Universal Multi-Runtime Adapter Engine:** Instead of forcing the user to pick an IDE, `vibe-fence init` should generate deterministic, synchronized configurations for all major runtimes simultaneously:
   - Root `AGENTS.md` (OpenAI Codex, OpenCode, general)
   - `CLAUDE.md` + `.claude/skills/` (Claude Code)
   - `.cursor/rules/*.mdc` (Cursor)
   - `.windsurf/rules/` (Windsurf)
   - Built from a single canonical source of truth in `.fence/`.
2. **The Companion "Teaching Dial" (Max → Med → Min → Silent):** An explicit configuration dial (`fence.config.json: { "teaching_level": "max" }`) that controls how the harness instructs the agent to talk to the user. At `max`, the agent explains *why* it chose a library or pattern; at `silent`, it executes with minimal distraction.
3. **Structured "Issue → Plan → Fix" Queue:** When the harness detects a problem (missing test, exposed key, broken build), it does not interrupt the user with panic. It queues a structured item in `.fence/queue.json` that the agent itself reads, prioritizes, and resolves at the next checkpoint.
4. **"Teachable Turbo" Approval Gate:** A simple, high-leverage UI/CLI interaction pattern: rather than approving 20 individual file edits, the harness presents a 3-bullet plain English summary of intended actions, letting non-technical vibe-coders safely hit "Approve" with confidence.
