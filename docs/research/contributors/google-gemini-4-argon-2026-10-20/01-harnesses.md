<!-- Converted from 01-AI Coding Agent Harnesses Taxonomy.docx on 2026-10-20 via zip/w:t extraction -->

Taxonomy of AI Coding Harnesses, Rule Systems, and Agentic Guardrail Architectures

Executive Architectural Synthesis

The software engineering ecosystem has undergone a structural shift from inline code completion to autonomous, tool-executing coding agents such as Claude Code, OpenAI Codex CLI, Cursor, OpenCode, Windsurf, Google Antigravity CLI, and Nous Research's Hermes Agent1. Across these environments, how a large language model (LLM) writes, modifies, and validates code inside a repository is governed by a layered stack of harnesses—mechanisms that inject project context, restrict tool execution, decompose tasks, and validate outputs7.

For vibe-fence—a drop-in guardrail harness (npx vibe-fence init) designed to make autonomous coding safe for non-technical users across any runtime—analyzing existing harnesses reveals a fundamental architectural divide7. Currently, the ecosystem splits into two disconnected paradigms: Declarative Markdown &amp; Plugin Harnesses (Section A), which rely predominantly on soft prompt injection (CLAUDE.md, AGENTS.md, .cursor/rules/*.mdc, .windsurfrules, SKILL.md) with occasional client-side lifecycle hooks, and Programmatic Framework &amp; Gateway Harnesses (Section B), which enforce hard runtime invariants via state-machine interrupts (LangGraph), schema/retry validators (Pydantic AI), and network-level policy proxies (Archestra/OpenAPPA)4.

A critical second-order finding emerges from comparing official documentation against practitioner usage: non-technical users equate writing a rule in Markdown with enforcing a security boundary, whereas agent runtimes treat Markdown rules as non-binding user suggestions7. When an instruction file grows beyond 300 to 500 lines, or when two rules across directory tiers contradict one another, models arbitrarily ignore constraints7. Conversely, targeted context-engineering rules—such as capping command output at 4,000 bytes—cut token overhead by roughly 50%, while out-of-process gateway guardrails enforce policy at 31 ms p95 latency13. Consequently, a safe harness for non-technical users cannot merely drop static text files; it must pair progressive-disclosure Markdown instructions (AGENTS.md, SKILL.md) with deterministic client-enforced settings, pre-tool execution hooks, and stateful verification checkpoints7.



Findings: Section A — Agent Skills, Plugins, and Rule Systems

A.1 Claude Code (CLAUDE.md, .claude/rules/, SKILL.md, settings.json, and Hooks)

Claude Code (accessible via CLI, IDE extensions, and cloud surfaces at https://code.claude.com/docs/en/overview) governs agent behavior through a four-part separation of concerns: CLAUDE.md defines project rules, Skills (SKILL.md) define procedural workflows, Agents define subagent delegation targets, and settings.json alongside lifecycle hooks enforce deterministic client boundaries (practiced)1.

Memory and instructions operate across a three-tier directory hierarchy comprising user-level global preferences (~/.claude/CLAUDE.md), version-controlled project standards (./CLAUDE.md or ./.claude/CLAUDE.md), and package-specific subdirectory files (/packages/api/CLAUDE.md), supplemented by git-ignored personal overrides (CLAUDE.local.md) and auto-generated session notes (~/.claude/projects/&lt;project&gt;/memory/MEMORY.md, of which the first 200 lines load automatically) (proven)7. For cross-cutting concerns spanning multiple directories, .claude/rules/*.md files support YAML frontmatter with paths glob arrays (such as paths: [&quot;src/api/**/*.ts&quot;]) to load rules conditionally (practiced)7. Large files can also be modularized using the @path/to/file import directive—though community documentation frequently misstates this syntax as @import, which is not a valid keyword (proven)7.

The most consequential architectural nuance of CLAUDE.md is its compliance model. Anthropic's memory documentation explicitly states that all discovered CLAUDE.md files are concatenated into the context window rather than overriding one another, and are injected as a user message accompanied by a system reminder permitting Claude to ignore content it deems irrelevant to the task (proven)7. If a user-level rule and a project-level rule conflict, reading order does not guarantee precedence (except for CLAUDE.local.md appended after CLAUDE.md within the exact same directory); Claude may choose between conflicting rules arbitrarily (proven)7. Furthermore, practitioner consensus is sharply divided on /init: while introductory guides recommend running /init to auto-generate a starter CLAUDE.md (practiced)18, advanced engineering guides warn against /init because auto-generated noise inflates token latency and a single flawed line in CLAUDE.md compounds errors across every task (contested)16. High-performing teams restrict root CLAUDE.md files to 60–200 lines (and strictly under 300–500 lines), delegating deep context via progressive disclosure to agent_docs/ or SKILL.md files (practiced)16. For hard safety, rules must be moved out of CLAUDE.md into .claude/settings.json permission allow/deny lists or lifecycle hooks, which the client enforces regardless of model decisions (proven)7.



Field

Capture

Install friction

Low to Medium. /init generates a starter file in one command, or users manually drop CLAUDE.md, .claude/rules/*.md, and .claude/settings.json into the repo7. Requires restarting the session or running /memory / /context to verify loaded files7. (practiced)

Runtime coverage

Single-vendor engine across multiple surfaces (Terminal CLI, VS Code, JetBrains, web/cloud agents) sharing the same underlying Claude Code engine1. (proven)

Safety behavior

Soft via CLAUDE.md (&quot;never commit secrets&quot;, which has no compliance guarantee)7; hard and deterministic via settings.json tool/bash permission rules and pre/post lifecycle hooks enforced by the client7. (proven)

Scoping behavior

Supports hybrid /model opusplan (using Opus with extended thinking in /plan mode and Sonnet for execution)24. However, task decomposition is prompt-driven unless wired via custom /commands or SKILL.md workflows17. (practiced)

Teaching behavior

Execution-biased by default unless instructed in user/project CLAUDE.md to explain &quot;Why&quot; architectural decisions were made or show diffs before applying edits17. (practiced)

Failure mode for non-technical user

Rule bloat and silent non-compliance: A beginner dumps 500+ lines of rules or relies on /init without pruning; rules drift from code (&quot;confident lies&quot;), conflict across tiers, and the agent arbitrarily ignores safety prohibitions like &quot;do not touch production DB&quot; because they were placed in CLAUDE.md instead of settings.json7. (proven)

A.2 OpenCode (opencode.json, .opencode/plugins/, and Agentic Delivery OS)

OpenCode (https://opencode.ai/docs/plugins/, https://opencode.ai/docs/agents/, and https://github.com/awesome-opencode/awesome-opencode) is an open-source, model-agnostic coding agent spanning TUI, IDE, and GitHub Actions (anomalyco/opencode/github@latest, triggered via /opencode or /oc in issues and PRs) (proven)9. Unlike purely Markdown-driven harnesses, OpenCode provides a full TypeScript/JavaScript programmatic plugin runtime (proven)9.

Plugins live in .opencode/plugins/ (project-level) or ~/.config/opencode/plugins/ (global), or are declared as npm packages in opencode.json and automatically installed via Bun at startup into ~/.cache/opencode/node_modules/ (proven)9. All four configuration sources load sequentially (~/.config/opencode/opencode.json → ./opencode.json → ~/.config/opencode/plugins/ → ./.opencode/plugins/) and execute their hooks in sequence (proven)9. Each plugin function receives { project, client, $, directory, worktree } (where $ is Bun's shell API) and can subscribe to 10+ hook interfaces and 33+ system events (tool.execute.before, shell.env, session.created, session.diff, experimental.session.compacting, tui.prompt.append, tui.toast.show) (proven)9.

This programmatic surface has catalyzed a massive community ecosystem encompassing 1,334 public repositories under the opencode-plugin topic on GitHub (proven)29. Harnesses built on OpenCode include agentic-delivery-os (https://github.com/juliusz-cwiakalski/agentic-delivery-os), which enforces a 7-phase specification-driven engineering loop (/plan-change → /write-spec → /write-test-plan &amp; /write-plan gated by an adversarial @readiness-reviewer via /check-readiness → phased /run-plan → /review → /sync-docs → /commit &amp; /pr) (practiced)21. Other notable harnesses in awesome-opencode include open-plan-annotator (which intercepts plan mode to open a local browser UI where users strikethrough, comment on, or approve LLM plans like a Google Doc), OpenCode Swarm (a verification-gated multi-agent swarm with architect, review, test, and security agents), Oh My Opencode (providing background agents and a Claude Code compatibility layer), and Dynamic Context Pruning (practiced)26.



Field

Capture

Install friction

Low for npm plugins (auto-installed via Bun at startup from opencode.json); Medium for local .opencode/plugins/*.ts files requiring a package.json in the config folder for external dependencies9. (proven)

Runtime coverage

Multi-model / provider-agnostic (Anthropic, OpenAI, Gemini, local Ollama, Cursor Pro proxy) across TUI, VS Code, Android/Termux, and GitHub Actions9; plugins are specific to OpenCode, though compatibility bridges to Claude Code hooks exist26. (proven)

Safety behavior

High programmatic safety: Plugins intercept tool.execute.before to deterministically block reading .env or sensitive files, inject isolated shell.env variables, and gate merges on readiness/verification swarms9. (proven)

Scoping behavior

Exceptional when paired with workflow harnesses (agentic-delivery-os, GoopSpec, OpenCode Plan Manager, open-plan-annotator), which enforce spec → test-plan → implementation-plan readiness gates and phased execution loops stored in doc/changes/ and chg--pm-notes.yaml21. (practiced)

Teaching behavior

Configurable via custom agents (e.g., /opencode explain this issue) and interactive browser plan annotation (open-plan-annotator), plus TTS idle-session voice summaries25. (practiced)

Failure mode for non-technical user

Documentation opacity and workflow ceremony: Official plugin docs omit advanced config hook injection (requiring users to inspect TypeScript source types or rely on LLM-generated manuals that warn of hallucinations)28, while spec-driven harnesses like agentic-delivery-os require human review of formal interface specs (chg--spec.md) that non-technical users cannot audit21. (proven)

A.3 OpenAI Codex CLI, AGENTS.md Standard, and Prompt Packs

AGENTS.md (https://agents.md/, https://github.com/agentsmd/agents.md, and https://github.com/openai/codex/blob/main/docs/agents_md.md) has emerged as the primary open standard for repository-level coding agent instructions, amassing 25,000 GitHub stars and 1,900 forks under the stewardship of the Agentic AI Foundation (part of the Linux Foundation) (proven)4. Designed as a &quot;README for agents,&quot; it separates machine-oriented build, test, architecture, and security instructions from human contributor documentation (practiced)4.

Unlike CLAUDE.md, the AGENTS.md specification implemented by OpenAI Codex enforces a strict, deterministic directory precedence chain (proven)4. Codex walks from /, ~, and ~/.codex/ down through the repository root toward the current working directory, reading AGENTS.md and AGENTS.override.md files along the path (proven)10. Every file touched in a patch must obey all AGENTS.md files whose directory subtree encompasses that file, and more-deeply-nested AGENTS.md files deterministically override broader parent instructions when conflicts occur, while direct user chat prompts override all files (proven)4. OpenAI's own primary monorepo utilizes 88 nested AGENTS.md files to scope package-level behavior (proven)4. Crucially, the Codex AGENTS.md specification mandates that if an AGENTS.md file defines programmatic verification checks (linters, typechecks, test suites), the agent must run all of them and validate they pass after making changes—even for trivial documentation edits (proven)10.

In complex engineering workflows, AGENTS.md is paired with structured planning, prompt replay, and context-optimization harnesses (practiced)19. In the OpenAI Cookbook modernization harness (https://github.com/openai/openai-cookbook/blob/main/examples/codex/code_modernization.md), .agent/AGENTS.md directs Codex to maintain a living .agent/PLANS.md (ExecPlan) document containing system inventories, plain-language business scenarios, target specifications, test parity plans, a &quot;Surprises and discoveries&quot; log, and a &quot;Decision log&quot; (practiced)33. Similarly, OpenAI Agents SDK training harnesses (https://github.com/PacktPublishing/Building-applications-and-agents-with-OpenAI-codex/blob/main/AGENTS.md) combine AGENTS.md with reproducible prompt-pack.md sequences, BUILD-LOG.md verification tracking, and local SDK git submodules so local tests run deterministically without live API calls (practiced)34. Complementing these structural patterns, context-engineering harnesses such as Austin1serb/agents-md (https://github.com/Austin1serb/agents-md) demonstrate that instructing agents via AGENTS.md or .codex/config.toml (model_instructions_file) to cap command output by bytes (COMMAND 2&gt;&amp;1 | head -c 4000 or tail -c 4000) rather than lines (head -n 20, which fails when a single minified line floods the context window) reduces average Codex token consumption by roughly 50% across comparable coding tasks (proven)19.



Field

Capture

Install friction

Minimal. Drop plain-Markdown AGENTS.md or AGENTS.override.md in repo root or nested packages, or run /init in Codex CLI; global defaults can be wired in .codex/config.toml via model_instructions_file4. (proven)

Runtime coverage

Broadest native multi-runtime adoption: Natively read by OpenAI Codex, Cursor, OpenCode, Google Gemini CLI, GitHub Copilot Coding Agent, Cognition Devin, Factory, and UiPath Autopilot4. (proven)

Safety behavior

Advisory Markdown boundaries for secrets/auth/DB migrations (&quot;do not run destructive migrations without approval&quot;, &quot;never weaken validation to make a test pass&quot;) plus a strong system-prompt mandate in Codex to execute all listed programmatic verification commands post-edit10. (proven)

Scoping behavior

Static AGENTS.md does not decompose tasks on its own, but pairing .agent/AGENTS.md with .agent/PLANS.md (ExecPlans) or prompt-pack.md + BUILD-LOG.md enforces phased pilots, decision logging, and parity checkgates33. (practiced)

Teaching behavior

High when using the OpenAI Cookbook .agent/PLANS.md pattern, which explicitly mandates documenting plain-language business scenarios, data models, technical risks, and a &quot;Surprises and discoveries&quot; decision log readable by newcomers33. (practiced)

Failure mode for non-technical user

Absence of pre-seeded verification commands: A non-technical vibe-coder starting an empty or unconfigured repo has no test suite, typechecker, or linter wired into AGENTS.md, rendering Codex's mandatory post-patch verification loop vacuous and leaving destructive shell/DB commands unblocked at the OS layer10. (practiced)

A.4 Cursor Rules (.cursor/rules/*.mdc), Agent Skills (SKILL.md), and Commands

Cursor (https://cursor.com/docs/rules, https://cursor.com/docs/skills, and https://cursor.com/docs) structures agent guidance across three distinct primitives: Rules (declarative, persistent behavioral guardrails), Skills (procedural, multi-step &quot;how-to&quot; capabilities with reference files loaded dynamically on demand), and Commands (manual /-invoked prompt macros) (proven)8.

Modern Cursor project rules reside in .cursor/rules/ as .mdc (Model Context) files containing YAML frontmatter (description, globs, alwaysApply) followed by Markdown instructions (proven)8. The interaction of those three frontmatter keys creates four activation modes (proven)8. In Always Apply mode (alwaysApply: true), the rule is injected into every chat session while globs and description are ignored (proven)8. In Apply to Specific Files mode (alwaysApply: false with globs provided), the rule is auto-attached whenever a file matching the glob pattern (such as src/components/**/*.tsx) enters context (proven)8. In Apply Intelligently mode (alwaysApply: false with description provided and globs omitted), the agent reads the description field and dynamically pulls the rule in when relevant to the task (proven)8. Finally, in Apply Manually mode (alwaysApply: false with both description and globs omitted), the rule is included only when explicitly @-mentioned in chat (proven)8.

Crucial runtime mechanics govern Cursor's context loading: when a rule references another file via @migration-template.sql, the referenced file's contents are not inlined into the prompt; instead, the agent must invoke its file-reading tool when needed (proven)8. Similarly, Skills (SKILL.md directories, supported with /migrate-to-skills in Cursor 2.4+) expose only their name and description at session start, loading procedural steps progressively to conserve context budget (proven)12. However, placing strict safety constraints inside Skills or &quot;Apply Intelligently&quot; rules is dangerous because the agent may decide not to load them (practiced)12.

Furthermore, Cursor's rule format migration has suffered from severe version-mismatch regressions (proven)38. While plain .md files inside .cursor/rules/ are silently ignored (Cursor directs users wanting plain Markdown to use AGENTS.md)8, Cursor's official v2.2+ documentation instructed developers to create folder-based rules (.cursor/rules/&lt;rule-name&gt;/RULE.md)38. Across Cursor versions 2.2.20, 2.2.43, and 2.3.10, this documented RULE.md folder format failed to register in Cursor Settings or apply in chat sessions; only the flat .cursor/rules/*.mdc format and AGENTS.md actually worked (proven)38.



Field

Capture

Install friction

Medium-High due to format churn: legacy .cursorrules vs. flat .cursor/rules/*.mdc vs. broken-in-2.2/2.3 .cursor/rules/&lt;name&gt;/RULE.md folders vs. AGENTS.md8. Also supports /create-rule, /create-skill, and GitHub repo syncing35. (proven)

Runtime coverage

Single-vendor (Cursor Editor, Cursor CLI, Cursor Cloud Agents), though Cursor natively reads AGENTS.md and shares the emerging SKILL.md folder convention2. (proven)

Safety behavior

Prompt-level constraints in .mdc rules (e.g., &quot;never modify generated files in dist/&quot;, &quot;confirm before adding dependency packages&quot;, &quot;do not modify files outside requested scope&quot;)8, supplemented in Cursor Cloud/Enterprise by Hooks, Bugbot, and Security Agents2. (practiced)

Scoping behavior

Built-in Plan Mode and Subagents scope larger features, while SKILL.md files encode repeatable multi-step procedural workflows with conditional branching and scripts2. (practiced)

Teaching behavior

Configurable via rules/skills; Cursor also includes Code Tours and Agent Review to walk users through repository architecture and diffs2. (practiced)

Failure mode for non-technical user

Silent rule drop and UI/code integrity destruction: Beginners place plain .md files or documented RULE.md folders in .cursor/rules/ that Cursor silently ignores8, or put critical guardrails inside dynamically loaded Skills that fail to trigger12, leading to repeated out-of-scope UI and code integrity breakage40. (proven)

A.5 Roo Code Custom Modes (.roomodes, custom_modes.yaml, and .roorules)

Roo Code (https://roocodeinc.github.io/Roo-Code/features/custom-modes/ and https://github.com/RooCodeInc/Roo-Code-Docs) pioneered persona-and-permission mode partitioning inside VS Code-compatible editors (proven)41. Repository commit history in RooCodeInc/Roo-Code-Docs includes a sunset notice for a May 15 shutdown of Roo Code products, making its architectural patterns especially important for historical and migration analysis (proven)42.

Instead of giving a single generalist agent access to all tools at all times, Roo Code separates workflows into built-in and custom modes defined in project-level .roomodes (YAML preferred, or JSON) and global custom_modes.yaml (migrating from editor-specific globalStorage paths to cross-editor ~/.roo/modes.yaml alongside ~/.roo/rules/, ~/.roo/rules-{mode}/, and ~/.roo/skills/) (proven)41. Each mode binds a slug, name, roleDefinition (injected at the start of the system prompt), whenToUse, customInstructions, Sticky Model memory (remembering the last LLM used for that specific mode), and explicit Tool Group Permissions (read, edit, browser, command, mcp) (proven)41.

Crucially, the edit tool group accepts a tuple with a deterministic fileRegex restriction (proven)41. In built-in Architect Mode or a custom Documentation Writer Mode, edit is restricted to fileRegex: \.(md|mdx)$, making it impossible for the planning agent to modify application source code (proven)41. Similarly, Ask Mode restricts tools to read, browser, and mcp only (proven)43. Orchestrator (Boomerang) Mode restricts file edits to mode configuration files while using the new_task tool to delegate scoped subtasks to specialized modes (proven)43. Community harnesses such as sellisd/roomodes (https://github.com/sellisd/roomodes) and jezweb/roo-commander expand this into full Agile role simulations (Product Owner, Scrum Master, Tech Lead, Developer, QA) wired to Jira and GitHub via .roo/mcp.json (practiced)43.



Field

Capture

Install friction

Low via conversational creation (&quot;Ask Roo! Create a new mode called...&quot;) or GUI Modes tab; Medium for multi-mode Agile packs (./modes_installer.py --target /path) requiring .roomodes, .roorules-*, and .roo/mcp.json API tokens41. Historically hampered by global modes being trapped in editor-specific globalStorage directories44. (proven)

Runtime coverage

VS Code and VS Code forks (Cursor, Windsurf) via the Roo Code extension44. Product sunset notice recorded in official docs repo42. (proven)

Safety behavior

Strong mode-level least privilege: Step-by-step action approval UI (Approve/Reject buttons unless auto-approval is toggled) combined with hard tool-group exclusions (e.g., disabling command and edit in Ask/Review modes) and regex file-write jails (fileRegex)41. Cannot dynamically change permissions mid-turn45. (proven)

Scoping behavior

Native Orchestrator / Boomerang Mode decomposes multi-step projects into isolated child tasks (new_task) executed by role-specific modes (Architect → Code → Debug/QA) with automatic context preservation across switches43. (proven)

Teaching behavior

Dedicated Ask Mode (persona tuned for thorough explanations and diagrams with zero write/command risk) and Architect Mode (designs systems in Markdown before code is written)43. (proven)

Failure mode for non-technical user

Approval fatigue leading to &quot;Auto-Approve All&quot; disaster: Faced with constant step-by-step confirmation prompts in Code Mode, non-technical users enable auto-approval or stay in full-privilege Code Mode instead of switching to Ask/Architect Mode, bypassing the mode boundaries entirely43. (practiced)

A.6 Continue.dev Config (config.yaml and .continue/rules)

Continue.dev (https://docs.continue.dev/guides/understanding-configs, https://docs.continue.dev/cli/configuration, and https://docs.continue.dev/customize/rules) provides an open-source, schema-validated configuration harness across VS Code, JetBrains, and its terminal CLI (cn) (proven)48.

Configuration resolves in strict order: --config ./my-config.yaml passed at launch, the last-used saved configuration (switchable live via /config in the TUI), and the global default ~/.continue/config.yaml (proven)49. Project-level guardrails live in .continue/rules/ as version-controlled files alongside application code (proven)50. In headless or scriptable workflows, the cn CLI allows ephemeral rule and agent injection without mutating disk files via cn --rule ./rules/style.md, cn --rule &quot;Always use TypeScript strict mode&quot;, and cn --agent my-org/pr-reviewer (proven)49.



Field

Capture

Install friction

Medium. Requires understanding the config.yaml reference schema for models, context providers, and MCP servers, though .continue/rules and --rule CLI flags are simple to drop in49. (practiced)

Runtime coverage

Single-ecosystem (Continue VS Code/JetBrains extensions and Continue cn TUI/CLI), supporting any underlying LLM provider48. (proven)

Safety behavior

Local-first configuration storage on the user's machine; rules in .continue/rules act as prompt-level guardrails for security practices and organizational paved paths48. (practiced)

Scoping behavior

Relies on custom agent definitions (--agent) and user-directed chat/TUI sessions rather than an opinionated built-in phased planning state machine49. (practiced)

Teaching behavior

Dependent on the loaded agent prompt or rule files49. (practiced)

Failure mode for non-technical user

YAML schema complexity: Configuring models, context providers, and rules in config.yaml is built for engineers seeking granular control, overwhelming non-technical users who lack YAML and provider-wiring fluency48. (practiced)

A.7 Windsurf / Cascade (.windsurfrules) and GitHub Copilot (.github/copilot-instructions.md)

Windsurf (https://aicodingrules.com/rules/windsurf, https://www.dotwindsurfrules.com/)—the agentic IDE built on Codeium (now part of OpenAI)—and GitHub Copilot (https://docs.github.com/en/copilot/reference/custom-instructions-support, https://docs.github.com/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) use repository-committed Markdown instruction files to steer their respective agents (proven)3.

Windsurf's Cascade agent reads .windsurfrules from the workspace root as persistent project-level instructions covering framework conventions and architecture boundaries (practiced)3. GitHub Copilot supports a two-tier repository instruction model: .github/copilot-instructions.md for repository-wide standards applied to every Copilot interaction, and .github/instructions/*.instructions.md (such as code-review.instructions.md) for path-specific or task-specific instructions, alongside Copilot Spaces and model-specific agent routing (proven)54.



Field

Capture

Install friction

Very Low. Single file drop (.windsurfrules in root or .github/copilot-instructions.md)52. (proven)

Runtime coverage

Single-vendor per file format (.windsurfrules for Windsurf Cascade; .github/copilot-instructions.md for GitHub Copilot across VS Code, Visual Studio, and GitHub.com), though Copilot's coding agent also participates in the AGENTS.md ecosystem4. (proven)

Safety behavior

Purely advisory prompt-level instructions; no deterministic pre-execution tool blocking inside the Markdown file itself55. (proven)

Scoping behavior

Passive context injection; does not enforce task checkpoints unless combined with external agent workflows like microsoft/devsquad-copilot55. (practiced)

Teaching behavior

Configurable; Microsoft's &quot;Copilot Spaces&quot; pattern explicitly configures .github/copilot-instructions.md to act as a &quot;best-practices coach&quot; that explains documentation and standards55. (practiced)

Failure mode for non-technical user

Passive drift and monolithic file decay: Because .windsurfrules is a single monolithic file without native glob-activation or execution hooks, beginners paste contradictory framework snippets from community directories (dotwindsurfrules.com), degrading Cascade's output quality39. (practiced)

A.8 Emerging CLI Agent Harnesses: Google Antigravity CLI (agy), Nous Research Hermes Agent, and Kimi CLI

Newer terminal-native agents have introduced built-in permission tiers and self-evolving skill harnesses (proven)5. Google Antigravity CLI (agy, documented at https://antigravity.google/docs/cli/overview/, https://codelabs.developers.google.com/antigravity-cli-hands-on, and https://github.com/google-antigravity/antigravity-cli) serves as the lightweight terminal TUI surface of Google's Antigravity agentic platform (proven)5. Antigravity exposes a first-class Tool Permission harness via /config or /settings with three explicit trust postures: Request-Review (the default posture balancing velocity and host system safety), Autonomous (which grants full permission to execute commands and write files directly on the host machine without confirmation), and Strict (a zero-trust mode restricting the agent exclusively to read tools and requiring explicit user prompts for any non-read action) (proven)5. It also integrates with Google's agents-cli (https://google.github.io/agents-cli/guide/getting-started/), which installs portable skills across Antigravity CLI, Claude Code, and Codex (proven)64.

Complementing Antigravity's permission tiers, Nous Research's Hermes Agent (https://www.hermes-agent.org/, https://github.com/nousresearch/hermes-agent, and https://github.com/NousResearch/hermes-agent-self-evolution), released in February 2026, operates as an autonomous server and CLI agent accessible via terminal, Telegram, Discord, Slack, WhatsApp, and Signal (proven)6. Its defining harness innovation is Automated Skill Creation: when Hermes solves a hard problem, it autonomously authors a reusable skill document in ~/.hermes/skills/ adhering to the agentskills.io portable SKILL.md open standard (proven)6. Furthermore, hermes-agent-self-evolution uses DSPy + GEPA to evolutionarily optimize skills, prompts, and code (proven)61. For execution safety, Hermes supports container hardening (read-only root filesystem, dropped Linux capabilities, and PID limits) alongside local terminal and SSH backends (proven)6. Alongside Antigravity and Hermes, Kimi CLI appears in multi-agent quota tracking, token monitoring, and skill-bridging ecosystems alongside OpenCode, Claude Code, and Cursor (practiced)29, operating as a terminal coding agent whose project-level guardrails are bridged via multi-runtime AGENTS.md and skill syncers.



Field

Capture

Install friction

Low. Antigravity launches via agy with OAuth browser code paste and /config TUI menu5; Hermes installs in one zero-prerequisite command (curl -fsSL .../install.sh | bash which installs uv, Python 3.11, and Node.js, followed by hermes setup)6. (proven)

Runtime coverage

Antigravity CLI (agy) and Hermes Agent both adopt the cross-runtime SKILL.md (agentskills.io / agents-cli) open standard, enabling skills to move between Antigravity, Claude Code, Codex, OpenCode, and Hermes6. (proven)

Safety behavior

Antigravity provides built-in strict (read-only default + prompt on write/exec) and request-review modes5. Hermes provides container hardening (read-only root, dropped capabilities, PID limits) and zero telemetry, though its local terminal backend executes shell/patch commands directly on the host6. (proven)

Scoping behavior

Hermes spawns isolated Parallel Sub-Agents (each with its own conversation and terminal, collapsing multi-step pipelines into zero-context-cost RPC turns)6. Antigravity uses multi-step planning and shared agent harness orchestration5. (proven)

Teaching behavior

Hermes explicitly externalizes its learning by writing human-readable SKILL.md documents whenever it solves a novel problem6. (proven)

Failure mode for non-technical user

Unattended self-modification &amp; autonomous host execution: In Antigravity, toggling Autonomous mode gives the LLM unrestricted host shell execution during &quot;vibe coding&quot;5; in Hermes, an uncontainerized local agent can autonomously write and execute faulty scripts in ~/.hermes/skills/ or run unattended cron jobs that compound errors across messaging platforms6. (practiced)

A.9 Community Rule Collections, Awesome Lists, and Multi-Runtime Syncers (awesome-cursorrules, cursor.directory, rulesync, nymor, agentsync)

As agent rule formats fragmented across vendors, two secondary layers emerged: public rule directories (https://github.com/PatrickJS/awesome-cursorrules, https://cursor.directory/) and multi-runtime rule transpilers/syncers (https://github.com/dyoshikawa/rulesync, https://github.com/jpcaparas/rulesync, https://www.rulesync.dev/, https://github.com/x0c/agentsync, and nymor) (proven)66.

PatrickJS/awesome-cursorrules (41,000 stars, 3,500 forks) and cursor.directory (91,000+ members) serve as the primary discovery hubs for prompt rules (proven)66. Beyond framework templates, recent additions to awesome-cursorrules reveal what failure modes practitioners are actively fighting: Anti-Sycophancy Code Discipline (17 directives blocking hallucinated APIs, invented function signatures, false-confidence validation, and authority-driven softening), Anti-Over-Engineering (keeping edits strictly scoped to the user's prompt), ThumbGate (pre-tool gate rules), and PkgDiet MCP guardrails (dependency security checks) (practiced)66. However, ecosystem analysis by localskills.sh (https://localskills.sh/blog/cursor-directory-alternatives) exposes severe structural defects in public rule directories: copy-paste delivery with zero provenance or update path, widespread legacy .cursorrules format stagnation (requiring manual conversion to .mdc), absence of quality verification separating battle-tested production rules from unvetted snippets, and single-tool lock-in (proven)39.

To solve multi-tool drift, several transpilers have launched—including a notable three-way naming collision around rulesync (proven)68. The most comprehensive open-source compiler is dyoshikawa/rulesync (a Node.js CLI with 1,474 GitHub stars and 153 forks under the MIT license), which maintains a single .rulesync/ source of truth (rulesync.jsonc plus .rulesync/rules/*.md with frontmatter root: true, targets: [&quot;*&quot;], globs: [&quot;*&quot;]) and compiles configurations across 20+ coding tools including Claude Code, Cursor, GitHub Copilot, Cline, Roo Code, OpenCode, Gemini CLI, and Codex CLI (proven)69. Uniquely, dyoshikawa/rulesync synchronizes not only rules, but also ignore files, mcp servers, commands, subagents, skills, hooks, permissions, and checks, and provides rulesync import, one-shot rulesync convert --from cursor --to copilot,claudecode, remote skill fetching (rulesync fetch owner/repo), and CI drift verification (rulesync generate --check) (proven)69. Alongside it, jpcaparas/rulesync (a PHP/standalone PHAR CLI) compiles a single rulesync.md file into 8 targets (CLAUDE.md, .clinerules/project.md, .cursorrules, GEMINI.md, .github/copilot-instructions.md, .junie/guidelines.md, AGENTS.md, and .windsurfrules) with MD5 checksum overwrite protection (proven)68, whereas rulesync.dev (npx rulesync-cli pull) operates as a cloud dashboard and CLI for syncing versioned CLAUDE.md, .cursorrules, and ~/.claude/settings.json across 5 to 500 repositories via postinstall hooks (proven)70. Finally, nymor (npx nymor sync) and x0c/agentsync provide local compilation alternatives; nymor compiles .nymor/skills/ across 16 agents with zero network calls and adds a learn command that allows an agent to commit a newly taught rule as a versioned skill automatically (practiced)71.



Field

Capture

Install friction

Manual copy-paste for awesome-cursorrules / cursor.directory39; One-command CLI initialization (npx rulesync init + npx rulesync generate, or npx nymor sync) for multi-runtime transpilers72. (proven)

Runtime coverage

Maximum multi-runtime coverage: dyoshikawa/rulesync covers 20+ agents; nymor covers 16 agents; jpcaparas/rulesync covers 8 agents68. Feature parity is uneven across targets (e.g., Codex CLI commands are global-only in dyoshikawa/rulesync)69. (proven)

Safety behavior

Transpilers sync ignore files, MCP configs, permissions, and hooks (dyoshikawa/rulesync), plus MD5 overwrite protection (jpcaparas/rulesync) and CI sync checks (--check), but do not bundle opinionated default safety rules out of the box68. (proven)

Scoping behavior

None natively in the syncers; they are build-time compilers for whatever rules/skills the user authors72. (proven)

Teaching behavior

nymor's learn command captures interactive human corrections inside the agent and commits them as versioned skills72. (practiced)

Failure mode for non-technical user

Empty compiler syndrome &amp; lossy abstraction: Sync tools like rulesync solve distribution for teams that already know what rules to write, but give a non-technical beginner an empty .rulesync/ folder; additionally, importing vendor-specific rules flattens nuanced syntax across uneven target capabilities76. (proven)

Findings: Section B — Framework and Scaffold Harnesses

B.1 LangGraph and Deep Agents (interrupt(), Command(resume=...), HumanInTheLoopMiddleware)

LangGraph (https://docs.langchain.com/oss/python/langgraph/interrupts, https://reference.langchain.com/python/langgraph/types/interrupt, https://reference.langchain.com/python/langchain/agents/middleware/human_in_the_loop/HumanInTheLoopMiddleware, and https://docs.langchain.com/oss/python/deepagents/human-in-the-loop) provides the canonical programmatic state-machine harness for Human-in-the-Loop (HITL) execution gating (proven)11.

Rather than hoping an LLM obeys a prompt instruction to &quot;ask before running destructive commands,&quot; LangGraph halts execution at the Python/JS runtime layer using two primitives: interrupt(value, response_schema=...) and Command(resume=...) (proven)14. When a node, subagent, or tool calls interrupt(), LangGraph raises a special resumable exception that aborts the current step, serializes the entire graph state to a mandatory checkpointer (InMemorySaver for prototyping; AsyncPostgresSaver or MongoDBSaver for production) keyed by a conversation thread_id, and surfaces the Interrupt payload to the client UI (proven)14. Execution cannot proceed until the caller invokes the graph on the same thread_id with Command(resume=payload), which validates the human's decision against a Pydantic response_schema (proven)11.

In higher-level agent harnesses (HumanInTheLoopMiddleware and LangChain deepagents via create_deep_agent), developers pass an interrupt_on policy dictionary mapping tool names to allowed review actions (approve, edit, reject, respond) plus an optional when predicate function that inspects the ToolCallRequest arguments at runtime (such as auto-approving SELECT queries while interrupting on DROP or file deletions) (proven)11. If a run is cancelled mid-flight, PatchToolCallsMiddleware automatically repairs dangling tool-call message history so the LLM API does not throw a corrupt-conversation error (proven)78.

However, LangGraph's documentation exposes four subtle runtime hazards that frequently break implementations (proven)11. First, when resumed via Command(resume=...), LangGraph restarts the node from the very beginning of the node function (and re-runs earlier middleware listed before HumanInTheLoopMiddleware), meaning any side effects placed before interrupt() execute twice (proven)11. Second, using the respond decision type to deny a side-effecting tool injects a synthetic tool result that the LLM interprets as a successful execution; denials must strictly use reject (proven)78. Third, if a human reviewer edits tool arguments substantially during an interrupt, the LLM may re-evaluate its approach and execute the tool multiple times (proven)78. Fourth, in default &quot;batched&quot; interrupt mode, if a user submits multiple decisions at once and one decision fails schema validation, the valid tools execute immediately while their interrupts remain marked pending—re-submitting the batch executes those side-effecting tools a second time, which is why LangGraph is migrating &quot;per_call&quot; mode to be the default in its next major release (proven)11.



Field

Capture

Install friction

High for end users (requires Python 3.11+ for async ainvoke/astream HITL, wiring a persistent Checkpointer DB, thread_id tracking, and event-stream loop handling)11. (proven)

Runtime coverage

Framework-level (Python and JavaScript/TypeScript via LangGraph / deepagents), model-agnostic across any tool-calling LLM78. (proven)

Safety behavior

Gold-standard programmatic tool gating: HumanInTheLoopMiddleware + when argument predicates + Pydantic response_schema validation deterministically block high-risk tool calls before execution, while PatchToolCallsMiddleware prevents state corruption on cancellation11. (proven)

Scoping behavior

Explicit state graphs (StateGraph), subgraphs, and deepagents subagent delegation with persistent checkpoints after every superstep14. (proven)

Teaching behavior

Surfaces structured ToolApprovalRequest descriptions (description_prefix or custom callables) explaining the exact tool call and arguments awaiting human approval11. (proven)

Failure mode for non-technical user

UX latency distrust &amp; rejection semantics confusion: If an agent processes silently before hitting an interrupt, users assume it hung82; when prompted, a non-technical user who edits arguments too heavily or replies via respond instead of reject inadvertently causes the model to loop or hallucinate tool success78. (proven)

B.2 Pydantic AI and Vibes (Agent, RunContext[deps_type], @agent.result_validator, ModelRetry)

Pydantic AI (https://ai.pydantic.dev, https://gist.github.com/szeyu/e7c92f16ea721ba9ffbe472a127006f1, https://zenn.dev/finatext/articles/pydantic-ai-introduction) and its TypeScript port Vibes (https://personal-b3af1c31.mintlify.app/introduction, built atop the Vercel AI SDK) bring FastAPI-style static type safety, explicit dependency injection, and automated reflection loops to agent construction (proven)15.

Every Agent instance is generically parameterized by deps_type (a dataclass or type holding database connections, HTTP clients, or auth scopes passed at runtime via RunContext[MyDeps]) and result_type (a Pydantic BaseModel enforcing structured output schemas) (proven)15. Because deps_type is checked statically by mypy/pyright (or TypeScript in Vibes), a tool or system prompt that attempts to access an uninjected resource fails at compile/lint time before the agent ever runs (proven)83.

For output safety and correctness, Pydantic AI introduces the @agent.result_validator decorator paired with ModelRetry (proven)15. When the LLM produces a candidate output (for instance, a SQL query or code block), the result_validator function receives RunContext[Deps] and executes deterministic verification—such as running EXPLAIN &lt;sql_query&gt; against the live database connection in ctx.deps (proven)15. If the check throws an error or fails business invariants (such as len(result.sources) &lt; 2), raising ModelRetry(f'Invalid query: {e}') intercepts the response and automatically loops the exact validation traceback back to the LLM to self-correct (proven)15. For testing gates, TestModel, FunctionModel, MockModel, and agent.override(deps=...) allow full unit test suites to verify agent contracts deterministically without live LLM API calls or secret leakage (proven)83.



Field

Capture

Install friction

Medium (SDK library installed via pip install pydantic-ai or npm for Vibes; requires authoring Python/TS code rather than dropping a config file into an existing IDE agent)84. (proven)

Runtime coverage

Multi-provider Python (pydantic-ai) and TypeScript (Vibes via Vercel AI SDK) across OpenAI, Anthropic, Gemini, and local Ollama models83. (proven)

Safety behavior

Compile-time and post-generation deterministic gates: Explicit dependency injection (RunContext[deps_type]) isolates credentials/clients out of global scope; @agent.result_validator + ModelRetry gates outputs on dry-run execution (like EXPLAIN), and agent.override() + MockModel enforce offline test suites15. (proven)

Scoping behavior

Supports dependency-based multi-agent delegation (passing a specialist research_agent inside another agent's workflow) and explicit message_history turn management85. (proven)

Teaching behavior

Structured outputs (result_type) can mandate summary, confidence, and support_advice fields alongside action flags (block_card=True, risk=9), forcing the model to output structured rationale83. (proven)

Failure mode for non-technical user

Developer-only abstraction: Pydantic AI and Vibes are libraries for building agents in code, not drop-in wrappers for a non-technical user running Cursor or Claude Code15. (proven)

B.3 Archestra Platform and OpenAPPA (Enterprise Gateway, MCP Registry, and Deterministic Guardrails)

Archestra (https://archestra.ai/, https://github.com/archestra-ai/archestra, https://github.com/archestra-ai/OpenAPPA, https://registry.terraform.io/providers/archestra-ai/archestra/latest/docs) represents the network-and-proxy infrastructure harness model (proven)13. Licensed under AGPL-3.0 (4,400 GitHub stars, $13.5M funding, 31 ms p95 proxy overhead), Archestra interposes a unified control plane between coding agents (Claude Code, Codex, Cursor) and external models, MCP servers, and enterprise systems (proven)13. Alongside the platform, Archestra maintains OpenAPPA (1,600 stars, Rust, MIT license)—an engine for &quot;deterministic guardrails that don't break agents&quot; with Git-synced policy templates (openappa-config) and &quot;yell reporting&quot; enabled by default (proven)89.

Instead of trusting local files on a user's laptop that an agent could overwrite, Archestra points Claude Code, Codex, or Cursor at a single proxy URL (proven)13. This architecture enforces five hard security invariants across all agent traffic (proven)13. First, Lethal-Trifecta Deterministic Guardrails block prompt-injection data exfiltration by preventing untrusted external context, private data access, and external network egress from combining within a single tool trajectory (proven)13. Second, Identity-Bound MCP Execution (OAuth On-Behalf-Of) uses Microsoft Entra OBO, Okta, or Keycloak JWKS token exchange so MCP servers execute with the individual human user's identity and permissions rather than an over-privileged shared service account (proven)13. Third, Server-Side Secret Isolation &amp; Virtual Keys keep real provider API keys on the server while issuing scoped virtual tokens with per-user, per-team, and per-environment spend limits (proven)13. Fourth, a Curated MCP Registry &amp; Kubernetes Sandboxing layer provides 900+ evaluated MCP servers and executes autonomous agent workloads inside isolated Kubernetes-native sandboxes with strict egress policies (proven)13. Fifth, Infrastructure-as-Code Governance provisions security policies, MCP registries, and cost limits deterministically via the archestra-ai/archestra Terraform provider (proven)13.



Field

Capture

Install friction

Low for end-users once deployed (point Claude Code / Codex / Cursor at one proxy URL or use the built-in Slack/Teams/Web chat UI)13; High for solo self-hosting (requires Docker with  RAM, Tilt, or Kubernetes/Helm + Terraform)13. Also offers a lightweight skill (skillsllm.com/skill/archestra) for Claude Code and Codex CLI93. (proven)

Runtime coverage

Multi-runtime across Claude Code, OpenAI Codex, Cursor, n8n, Mastra, Pydantic AI, Vercel AI SDK, and GitHub Copilot CLI via LLM &amp; MCP proxy gateways13. (proven)

Safety behavior

Enterprise-grade out-of-process enforcement: Deterministic tool-call guardrails (OpenAPPA), Lethal-Trifecta blocking, OAuth On-Behalf-Of user-scoped MCP permissions, virtual API keys with hard budget caps, K8s sandboxes, and full OpenTelemetry/Prometheus audit traces13. (proven)

Scoping behavior

Supports A2A (Agent-to-Agent) triggers, sub-agent delegation, reusable skills, and environment-level isolation (dev vs. prod egress/cost rules)13. (proven)

Teaching behavior

Includes a dedicated chat interface and mini-app builder for non-technical users, plus session trace views with linked MCP tool calls and guardrail explanations (&quot;yell reporting&quot;)13. (proven)

Failure mode for non-technical user

Infrastructure operational barrier: A solo non-technical vibe-coder building a hobby project on a laptop cannot stand up a 6 GB Docker/Kubernetes/OIDC control plane just to keep Cursor or Claude Code from breaking their local app90. (proven)

B.4 Vercel AI SDK Templates, create-* Scaffolders, and Agent Project Generators

Application scaffolders—such as Vercel's AI SDK templates (https://vercel.com/templates/other/vercel-x-xai-chatbot, https://vercel.com/templates/other/nuxt-ai-chatbot) and community starters (https://github.com/picahq/ai-chatbot-template)—shape LLM code generation by pre-populating opinionated file trees and architectural patterns at repository creation time (practiced)95.

When a user clones a Vercel AI SDK template and runs npm i -g vercel followed by vercel env pull (which writes environment secrets to .env.local), the scaffold establishes Next.js App Router conventions, shadcn/ui + Tailwind CSS component structures, and typed tool-calling boilerplate (proven)96. Because coding agents heavily imitate adjacent files in the repository (&quot;in-context mimicry&quot;), a clean scaffold steers initial code generation effectively (practiced)16. However, scaffolders are one-shot bootstrap generators: unless they also drop an AGENTS.md, CLAUDE.md, or .cursor/rules/*.mdc file into the repository, they exert zero ongoing governance over an AI coding agent during subsequent vibe-coding turns (practiced)4.



Field

Capture

Install friction

Low (npm install + vercel env pull + npm run dev, or one-click Vercel deploy)96. (proven)

Runtime coverage

Agnostic to the coding agent editing the repo; the runtime code itself targets Next.js / Nuxt + Vercel AI SDK95. (proven)

Safety behavior

Delegates secrets to .env.local via vercel env pull96, but includes no agent-facing rules or hooks to prevent an AI coding assistant from reading .env.local or hardcoding keys in subsequent edits9. (practiced)

Scoping behavior

None after initial project bootstrap96. (proven)

Teaching behavior

Ships with example tool integrations (e.g., weather tool boilerplate) and README setup steps, but no interactive explanation during coding96. (proven)

Failure mode for non-technical user

Day-2 architectural collapse: The template works on initial deploy, but as soon as a non-technical user asks an unconstrained agent to &quot;add payments and a database,&quot; the agent violates Next.js App Router boundaries, leaks server secrets into client components, and breaks the build because no persistent agent rules were scaffolded32. (practiced)

Cross-Harness Taxonomy Matrix

The following table synthesizes the structural trade-offs across all 13 harness families evaluated in Sections A and B:

Harness Family

Primary Artifact(s)

Enforcement Layer

Multi-Runtime Support

Task Scoping / Checkpoints

Beginner Safety Posture

Evidence Tag

Claude Code

[cite: 7, 16, 22]

CLAUDE.md, .claude/rules/*.md, SKILL.md, settings.json

Soft (Markdown user message) + Hard (settings.json &amp; hooks)

Single-engine (CLI, IDE, Web)

/model opusplan + Skills

High only if settings.json &amp; hooks are pre-wired

proven

OpenCode

[cite: 9, 21, 26]

opencode.json, .opencode/plugins/*.ts

Hard (Bun TS event hooks: tool.execute.before)

Multi-model; OpenCode runtime (+ Claude bridge)

High via agentic-delivery-os &amp; open-plan-annotator

High via .env block plugins; high setup complexity

proven

Codex / AGENTS.md

[cite: 4, 10, 33]

AGENTS.md, AGENTS.override.md, .agent/PLANS.md

Soft (Markdown with strict nested override + mandatory test check)

Universal (Codex, Cursor, OpenCode, Gemini, Copilot, Devin)

High when paired with .agent/PLANS.md ExecPlans

Medium; requires pre-existing test scripts to trigger checks

proven

Cursor

[cite: 8, 20, 38]

.cursor/rules/*.mdc, SKILL.md, AGENTS.md

Soft (4-mode YAML frontmatter) + Cloud Hooks

Cursor IDE/CLI/Cloud (AGENTS.md &amp; SKILL.md portable)

Built-in Plan Mode + procedural SKILL.md

Fragile due to .mdc vs RULE.md version bugs

proven

Roo Code

[cite: 41, 42, 43]

.roomodes, ~/.roo/modes.yaml, .roorules

Hard mode tool-group locks + fileRegex edit jails

VS Code &amp; forks (Sunset notice in docs repo)

Native Orchestrator (Boomerang) mode delegation

High in Ask/Architect modes; fails if user enables Auto-Approve

proven

Continue.dev

[cite: 48, 49, 50]

~/.continue/config.yaml, .continue/rules/

Schema-validated YAML + Soft Markdown rules

Continue IDE &amp; cn CLI

Custom --agent flags

Low for beginners due to YAML config complexity

practiced

Windsurf &amp; Copilot

[cite: 52, 54, 59]

.windsurfrules, .github/copilot-instructions.md

Soft prompt injection

Windsurf Cascade / GitHub Copilot

Passive unless paired with Copilot Spaces / DevSquad

Vulnerable to monolithic file bloat and rule drift

practiced

Antigravity &amp; Hermes

[cite: 5, 6, 61]

/config permission modes; ~/.hermes/skills/SKILL.md

Hard (strict read-only mode in agy; container hardening in Hermes)

SKILL.md (agentskills.io / agents-cli) is cross-runtime

Parallel RPC sub-agents (Hermes)

High in agy strict mode; risky in Autonomous/host mode

proven

Syncers (rulesync, nymor)

[cite: 68, 72, 74]

.rulesync/, rulesync.md, .nymor/skills/

Build-time transpilation + --check CI gates

16 to 20+ agents from a single source of truth

Compiles commands, skills, and subagents

Solves multi-tool drift, but ships zero default guardrails

proven

LangGraph / DeepAgents

[cite: 11, 78, 79]

interrupt(), Command(resume=...), HumanInTheLoopMiddleware

Hard runtime exception + persistent Checkpointer

Python / JS agent framework

Graph nodes + per-superstep state checkpoints

Requires custom UI to hide respond vs reject footguns

proven

Pydantic AI / Vibes

[cite: 15, 83, 84]

Agent[deps_type, result_type], @agent.result_validator

Hard compile-time types + runtime ModelRetry loop

Python &amp; TypeScript (Vercel AI SDK)

Dependency-injected multi-agent handoffs

Developer SDK only; not an end-user CLI drop-in

proven

Archestra / OpenAPPA

[cite: 13, 89, 90]

LLM/MCP Proxy, OpenAPPA Rust guardrails, Terraform

Hard out-of-process proxy + OAuth OBO + K8s sandbox

Claude Code, Codex, Cursor, Copilot CLI

A2A gateway + sub-agent orchestration

Enterprise-grade safety, but too heavy for solo laptop setup

proven

Vercel AI SDK Templates

[cite: 95, 96, 97]

Next.js/Nuxt repo tree + vercel env pull (.env.local)

One-time directory convention bootstrap

Any agent editing the repo

None post-creation

Collapses on Day 2 without embedded AGENTS.md / rules

practiced

Coverage Gaps and Undocumented Surface Areas

Across official vendor documentation, open-source repositories, and community registries, four significant documentation and evaluation gaps persist. First, regarding Kimi CLI and Antigravity Local Rule Precedence, while Google Antigravity CLI (agy) documents its /config tool permission tiers (strict, request-review, autonomous) and agents-cli skill installation5, and Kimi CLI appears in multi-agent quota and plugin registries29, neither tool has publicly indexed specifications detailing how local nested markdown files conflict-resolve against global skills. Second, OpenCode Undocumented Config Hooks remain a hazard: as documented in joshuadavidthomas/opencode-plugins-manual (https://github.com/joshuadavidthomas/opencode-plugins-manual/blob/main/README.md), OpenCode's official plugin documentation omits how plugins dynamically inject commands, subagents, and MCP servers via config hooks, forcing developers to reverse-engineer TypeScript source types or rely on LLM-generated documentation that carries hallucination warnings (proven)28. Third, Cursor RULE.md vs. .mdc Documentation Desynchronization demonstrates that vendor docs can lag or contradict shipping binaries: Cursor's official documentation at cursor.com/docs/context/rules prescribed folder-based .cursor/rules/&lt;name&gt;/RULE.md files starting in v2.2, while the shipping Cursor binary (through v2.3.10) silently ignored RULE.md folders and only loaded flat .mdc files or AGENTS.md (proven)8. Fourth, there is a complete Absence of Empirical Benchmarks for Beginner Comprehension: while token reduction (~50% via 4,000-byte output caps in Austin1serb/agents-md)19 and proxy latency (31 ms p95 in Archestra)13 are quantitatively measured (proven), zero existing harnesses publish empirical measurements on non-technical user error rates, rollback recovery success, or comprehension of approval prompts.

Sources Table

#

Source URL

Type

Accessed

1

https://readme.com/blog/what-is-claude-md

[cite: 23]

Engineering Blog

October 20, 2026

2

https://claudecertificationguide.com/learn/3-claude-code-config/3-1-claude-md-hierarchy

[cite: 7]

Technical Guide

October 20, 2026

3

https://medium.com/@n913239/the-complete-guide-to-claude-md-make-claude-code-truly-understand-your-project-d9d026b808f1

[cite: 17]

Practitioner Guide

October 20, 2026

4

https://www.buildcamp.io/guides/the-ultimate-guide-to-claudemd

[cite: 16]

Technical Guide

October 20, 2026

5

https://dev.to/gunnargrosch/teaching-claude-code-how-you-work-claudemd-in-practice-21d9

[cite: 18]

Practitioner Guide

October 20, 2026

6

https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/CLAUDE.md

[cite: 24]

GitHub Repository

October 20, 2026

11

https://code.claude.com/docs/en/overview

[cite: 1]

Official Documentation

October 20, 2026

12

https://code.claude.com/docs/en/best-practices

[cite: 22]

Official Documentation

October 20, 2026

15

https://cursor.com/docs/rules

[cite: 8]

Official Documentation

October 20, 2026

17

https://www.ibuildwith.ai/blog/cursor-rules-skills-and-commands-oh-my-when-to-use-each/

[cite: 20]

Engineering Blog

October 20, 2026

19

https://note.com/kitokitoworld/n/n352e455ae70b?hl=en

[cite: 12]

Practitioner Guide

October 20, 2026

20

https://www.skillsdirectory.com/skills/aibot88-cursor-rules-writing

[cite: 36]

Skill Registry

October 20, 2026

21

https://www.reddit.com/r/cursor/comments/1q9wxk2/how_do_you_organize_your_cursor_rules/

[cite: 37]

Community Forum

October 20, 2026

22

https://cursor.com/docs/skills

[cite: 35]

Official Documentation

October 20, 2026

23

https://forum.cursor.com/t/project-rules-documented-rule-md-folder-format-not-working-only-undocumented-mdc-format-works/145907

[cite: 38]

Bug Report / Forum

October 20, 2026

24

https://forum.cursor.com/t/repeated-critical-ui-code-integrity-issues-caused-by-cursor-agent/158903

[cite: 40]

Bug Report / Forum

October 20, 2026

29

https://cursor.com/docs

[cite: 2]

Official Documentation

October 20, 2026

31

https://aicodingrules.com/rules/windsurf

[cite: 52]

Rule Directory

October 20, 2026

32

https://design.dev/guides/windsurf-rules/

[cite: 56]

Technical Guide

October 20, 2026

33

https://www.dotwindsurfrules.com/

[cite: 53]

Rule Directory

October 20, 2026

35

https://www.claudemdeditor.com/windsurfrules-guide

[cite: 3]

Technical Guide

October 20, 2026

37

https://github.com/juliusz-cwiakalski/agentic-delivery-os/blob/main/doc/guides/opencode-agents-and-commands-guide.md

[cite: 21]

GitHub Repository

October 20, 2026

38

https://opencode.ai/docs/github/

[cite: 25]

Official Documentation

October 20, 2026

39

https://github.com/awesome-opencode/awesome-opencode

[cite: 26]

GitHub Awesome List

October 20, 2026

40

https://github.com/topics/opencode-plugin

[cite: 29]

GitHub Topic Index

October 20, 2026

41

https://github.com/joshuadavidthomas/opencode-plugins-manual/blob/main/README.md

[cite: 28]

GitHub Repository

October 20, 2026

42

https://opencode.ai/docs/plugins/

[cite: 9]

Official Documentation

October 20, 2026

43

https://github.com/topics/opencode-agent

[cite: 27]

GitHub Topic Index

October 20, 2026

45

https://opencode.ai/docs/agents/

[cite: 98]

Official Documentation

October 20, 2026

48

https://roocodeinc.github.io/Roo-Code/features/custom-modes/

[cite: 41]

Official Documentation

October 20, 2026

50

https://github.com/sellisd/roomodes

[cite: 46]

GitHub Repository

October 20, 2026

52

https://github.com/RooCodeInc/Roo-Code-Docs

[cite: 42]

GitHub Repository

October 20, 2026

56

https://git.pratiknarola.com/nikhilmundra/RooPrompts/src/commit/eb26f4c714063a546294eaa322071741500cdc95/roo.md

[cite: 43]

Git Repository

October 20, 2026

58

https://github.com/RooCodeInc/Roo-Code/issues/10750

[cite: 44]

GitHub Issue

October 20, 2026

59

https://ai.rundatarun.io/ai-systems-architecture/custom-modes-quick-start

[cite: 45]

Engineering Blog

October 20, 2026

65

https://docs.continue.dev/guides/understanding-configs

[cite: 48]

Official Documentation

October 20, 2026

66

https://docs.continue.dev/cli/configuration

[cite: 49]

Official Documentation

October 20, 2026

67

https://docs.continue.dev/reference

[cite: 51]

Official Documentation

October 20, 2026

68

https://docs.continue.dev/customize/rules

[cite: 50]

Official Documentation

October 20, 2026

69

https://promptessor.com/blog/best-agentsmd-examples-for-codex-cursor-and-ai-coding-agents-in-2026

[cite: 32]

Engineering Blog

October 20, 2026

70

https://agents.md/

[cite: 4]

Official Specification

October 20, 2026

71

https://github.com/agentsmd/agents.md

[cite: 30]

GitHub Repository

October 20, 2026

72

https://gist.github.com/dpaluy/cc42d59243b0999c1b3f9cf60dfd3be6

[cite: 10]

System Prompt Spec

October 20, 2026

74

https://github.com/openai/codex/blob/main/docs/agents_md.md

[cite: 31]

Official Documentation

October 20, 2026

75

https://github.com/openai/openai-cookbook/blob/main/examples/codex/code_modernization.md

[cite: 33]

Official Cookbook

October 20, 2026

77

https://github.com/Austin1serb/agents-md

[cite: 19]

GitHub Repository

October 20, 2026

79

https://github.com/PacktPublishing/Building-applications-and-agents-with-OpenAI-codex/blob/main/AGENTS.md

[cite: 34]

GitHub Repository

October 20, 2026

83

https://learn.chatgpt.com/docs/agent-configuration/agents-md

[cite: 99]

Official Documentation

October 20, 2026

87

https://skillsllm.com/skill/archestra

[cite: 93]

Skill Registry

October 20, 2026

88

https://guardiansofthemachineage.com/vendors/archestraai

[cite: 87]

Vendor Analysis

October 20, 2026

89

https://github.com/archestra-ai/archestra

[cite: 13]

GitHub Repository

October 20, 2026

90

https://registry.terraform.io/providers/archestra-ai/archestra/latest/docs

[cite: 88]

Official Documentation

October 20, 2026

91

https://github.com/archestra-ai

[cite: 89]

GitHub Organization

October 20, 2026

92

https://archestra.ai/

[cite: 90]

Official Website

October 20, 2026

93

https://github.com/archestra-ai/examples

[cite: 92]

GitHub Repository

October 20, 2026

97

https://github.com/archestra-ai/archestra/releases

[cite: 91]

Release Changelog

October 20, 2026

106

https://turion.ai/blog/langgraph-human-in-the-loop-interrupt-tutorial/

[cite: 14]

Engineering Tutorial

October 20, 2026

107

https://reference.langchain.com/python/langgraph/types/interrupt

[cite: 77]

Official API Reference

October 20, 2026

108

https://reference.langchain.com/python/langchain/agents/middleware/human_in_the_loop/HumanInTheLoopMiddleware

[cite: 11]

Official API Reference

October 20, 2026

114

https://docs.langchain.com/oss/python/deepagents/human-in-the-loop

[cite: 78]

Official Documentation

October 20, 2026

117

https://docs.langchain.com/oss/python/langgraph/interrupts

[cite: 79]

Official Documentation

October 20, 2026

118

https://docs.langchain.com/oss/python/langchain/human-in-the-loop

[cite: 80]

Official Documentation

October 20, 2026

120

https://medium.com/data-science-collective/architecting-human-in-the-loop-agents-interrupts-persistence-and-state-management-in-langgraph-fa36c9663d6f

[cite: 82]

Engineering Blog

October 20, 2026

122

https://github.com/picahq/ai-chatbot-template

[cite: 95]

GitHub Repository

October 20, 2026

123

https://vercel.com/templates/other/vercel-x-xai-chatbot

[cite: 96]

Official Template

October 20, 2026

124

https://vercel.com/templates/other/nuxt-ai-chatbot

[cite: 97]

Official Template

October 20, 2026

126

https://github.com/PatrickJS/awesome-cursorrules

[cite: 66]

GitHub Awesome List

October 20, 2026

128

https://localskills.sh/blog/cursor-directory-alternatives

[cite: 39]

Ecosystem Analysis

October 20, 2026

132

https://cursor.directory/

[cite: 67]

Community Directory

October 20, 2026

134

https://github.com/PatrickJS/awesome-cursorrules/pulls

[cite: 73]

GitHub Pull Requests

October 20, 2026

145

https://codelabs.developers.google.com/antigravity-cli-hands-on

[cite: 5]

Official Codelab

October 20, 2026

146

https://antigravity.google/docs/cli/overview/

[cite: 62]

Official Documentation

October 20, 2026

148

https://google.github.io/agents-cli/guide/getting-started/

[cite: 64]

Official Documentation

October 20, 2026

151

https://github.com/google-antigravity/antigravity-cli

[cite: 100]

GitHub Repository

October 20, 2026

152

https://gist.github.com/szeyu/e7c92f16ea721ba9ffbe472a127006f1

[cite: 83]

Technical Reference

October 20, 2026

153

https://zenn.dev/finatext/articles/pydantic-ai-introduction

[cite: 15]

Engineering Blog

October 20, 2026

154

https://personal-b3af1c31.mintlify.app/introduction

[cite: 84]

Official Documentation

October 20, 2026

160

https://agents-lib.com/compare/pydanticai-vs-openai-agents-sdk

[cite: 85]

Framework Comparison

October 20, 2026

162

https://zenn.dev/kun432/scraps/83e7570920a802

[cite: 86]

Technical Notes

October 20, 2026

164

https://www.reddit.com/r/hermesagent/comments/1rt5syt/complete_hermes_agent_setup_guide/

[cite: 65]

Setup Guide

October 20, 2026

165

https://www.hermes-agent.org/

[cite: 6]

Official Website

October 20, 2026

167

https://github.com/nousresearch/hermes-agent

[cite: 101]

GitHub Repository

October 20, 2026

170

https://github.com/NousResearch/hermes-agent-self-evolution

[cite: 61]

GitHub Repository

October 20, 2026

171

https://github.com/dyoshikawa/rulesync/blob/main/skills/rulesync/SKILL.md

[cite: 74]

GitHub Repository

October 20, 2026

172

https://github.com/jpcaparas/rulesync

[cite: 68]

GitHub Repository

October 20, 2026

175

https://github.com/dyoshikawa/rulesync

[cite: 69]

GitHub Repository

October 20, 2026

179

https://www.rulesync.dev/

[cite: 70]

Official Website

October 20, 2026

180

https://dev.to/dyoshikawatech/rulesync-published-a-tool-to-unify-management-of-rules-for-claude-code-gemini-cli-and-cursor-390f

[cite: 75]

Engineering Blog

October 20, 2026

181

https://hysenlabs.com/projects/dyoshikawa-rulesync

[cite: 76]

Technical Review

October 20, 2026

183

https://github.com/x0c/agentsync

[cite: 71]

GitHub Repository

October 20, 2026

184

https://www.reddit.com/r/GithubCopilot/comments/1unbvo0/nymor_one_command_to_sync_ai_agent_rules_across/

[cite: 72]

Tool Showcase

October 20, 2026

190

https://dev.to/pwd9000/mastering-code-reviews-with-github-copilot-the-definitive-guide-3nfp

[cite: 58]

Practitioner Guide

October 20, 2026

192

https://docs.github.com/en/copilot/reference/custom-instructions-support

[cite: 54]

Official Documentation

October 20, 2026

196

https://docs.github.com/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot

[cite: 55]

Official Documentation

October 20, 2026

197

https://techcommunity.microsoft.com/blog/azuredevcommunityblog/turning-github-copilot-into-a-%E2%80%9Cbest-practices-coach%E2%80%9D-with-copilot-spaces--a-mark/4511567

[cite: 59]

Engineering Blog

October 20, 2026

Implications for vibe-fence

Based on the evidence across all 13 harness families, npx vibe-fence init must be architected around the following 15 concrete COPY, AVOID, and INVENT mandates:

What vibe-fence Should COPY

COPY AGENTS.md + SKILL.md (agentskills.io) as the Primary Canonical Output Targets: AGENTS.md is natively ingested by OpenAI Codex, Cursor, OpenCode, Gemini CLI, GitHub Copilot, and Devin, while SKILL.md folders are natively supported across Claude Code, Cursor 2.4+, Antigravity CLI (agents-cli), OpenCode, and Hermes Agent4. Emitting AGENTS.md at the root plus on-demand SKILL.md modules covers 80%+ of modern runtimes before writing a single vendor-specific adapter.

COPY dyoshikawa/rulesync's Multi-Surface Compiler Architecture (Not Just Markdown): Like dyoshikawa/rulesync, npx vibe-fence init must compile a single .fence/ source of truth into both soft instruction files (CLAUDE.md, AGENTS.md, .cursor/rules/*.mdc, .windsurfrules, .github/copilot-instructions.md) and hard runtime config surfaces (.claude/settings.json permissions/hooks, .opencode/plugins/fence-guard.ts, .cursorignore)7.

COPY OpenCode's tool.execute.before and Claude Code's settings.json Client-Side Secret &amp; Destructive Command Blocking: Never rely on CLAUDE.md or AGENTS.md alone to protect .env files or block destructive commands (rm -rf, DROP TABLE, git push --force), because CLAUDE.md is a user message with no compliance guarantee7. Automatically generate .claude/settings.json deny rules and .opencode/plugins/env-protection.js (tool.execute.before intercepting read/edit/bash on .env* and .fence/)7.

COPY Roo Code's Regex File-Write Jail (fileRegex) During Planning Turns: Replicate Roo Code Architect Mode's fileRegex: \.(md|mdx)$ restriction inside vibe-fence's planning skill/hook so that when an agent is in the scoping/planning phase, it can only mutate .fence/plan.md and is physically blocked from touching src/ until the user approves the plan41.

COPY Austin1serb/agents-md's 4,000-Byte Command Output Cap Rule: Bake COMMAND 2&gt;&amp;1 | head -c 4000 and tail -c 4000 directly into the core vibe-fence AGENTS.md/CLAUDE.md template. This single rule is proven to reduce agent token consumption by ~50% and prevents minified build/test logs from flooding the context window and causing the agent to forget safety rules16.

COPY OpenAI Cookbook's .agent/PLANS.md (ExecPlan) + Anti-Sycophancy Directives: Require the agent to maintain a living .fence/PLAN.md with plain-language business scenarios, a &quot;Decision Log,&quot; and a &quot;Surprises Log&quot;33, and embed the 17-point Anti-Sycophancy / Anti-Over-Engineering rules from awesome-cursorrules to stop the agent from inventing APIs or modifying files outside the requested scope40.

COPY Pydantic AI's @result_validator + ModelRetry Pattern via Pre-Commit / Post-Edit Hooks: Emulate ModelRetry in CLI/IDE agents by wiring a fast verification script (vibe-fence check) into Codex's mandatory post-patch check section10 and Claude/OpenCode post-tool hooks that runs typecheck/lint/dry-run validation and feeds structured errors back to the agent before presenting results to the user10.

What vibe-fence Should AVOID

AVOID Bloated Root Instruction Files (&gt;100–200 Lines): Anthropic and practitioner data confirm that root CLAUDE.md / AGENTS.md files over 300–500 lines cause models to ignore critical rules and inflate every turn's latency16. Keep vibe-fence's injected root AGENTS.md / CLAUDE.md under 80 lines of universal invariants, using progressive disclosure (SKILL.md and .fence/docs/) for task-specific procedures16.

AVOID Generating Cursor .cursor/rules/&lt;name&gt;/RULE.md Folders or Plain .md Files: Due to verified bugs across Cursor 2.2.x–2.3.x where documented RULE.md folders and plain .md files in .cursor/rules/ are completely ignored by the editor, vibe-fence must strictly emit flat .cursor/rules/vibe-fence-*.mdc files with valid description, globs, and alwaysApply YAML frontmatter8.

AVOID Placing Mandatory Security Constraints Inside Dynamically Loaded Skills: As demonstrated in Cursor and Claude Code skill analyses, SKILL.md files are loaded only when the agent judges their description relevant12. Never put security, secret-handling, or scope-boundary rules inside a SKILL.md; keep hard invariants in alwaysApply: true .mdc rules, root AGENTS.md, and deterministic client hooks7.

AVOID High-Frequency Step-by-Step Confirmation Prompts (&quot;Approval Fatigue&quot;): Roo Code and Antigravity CLI show that when users are bombarded with low-level file/command prompts, non-technical users immediately switch to &quot;Auto-Approve All&quot; / &quot;Autonomous Mode,&quot; destroying all safety guarantees5. Only interrupt the user on high-risk semantic thresholds (e.g., deleting files, adding new npm/pip dependencies, altering auth/payment logic, or running database migrations) akin to LangGraph's conditional when predicate11.

AVOID Heavy Container/Kubernetes Prerequisites for Local Vibe-Coding: Archestra's 6 GB Docker/Kubernetes stack is ideal for enterprise platform teams but is an instant adoption killer for a non-technical user running npx vibe-fence init on a personal laptop90. Keep vibe-fence zero-daemon and Node/npx-native.

What vibe-fence Should INVENT

INVENT a &quot;Pre-Wired Verification Harness&quot; for Zero-Test Vibe-Coded Repos: Codex's AGENTS.md specification forces the agent to run all listed programmatic checks after every edit—but non-technical vibe-coders rarely have tests or linters set up10. npx vibe-fence init should auto-detect the stack (e.g., Next.js, Vite, Python, Supabase) and inject a zero-config npx vibe-fence verify command into AGENTS.md / CLAUDE.md that performs AST syntax checking, secret-leak scanning (blocking hardcoded sk_live_ / API keys)23, broken-import detection, and dependency-hallucination checks (PkgDiet style)73 after every agent turn.

INVENT a &quot;Plain-English Blast-Radius Checkpoint&quot; (open-plan-annotator for Non-Coders): Non-technical users cannot audit formal engineering specs like agentic-delivery-os's chg--spec.md or raw git diffs21. vibe-fence should invent a .fence/checkpoint skill that forces the agent, before touching &gt;2 files or installing any package, to output a 3-item Plain-English Blast Radius Card: (1) What feature will change for the user, (2) Which existing features could break, and (3) A 1-command rollback (npx vibe-fence undo backed by automatic git worktree/stash snapshots prior to agent execution)14.

INVENT an Interactive &quot;Teach-on-Undo&quot; Rule Compiler (nymor learn + Hermes Skill Synthesis for Beginners): When a vibe-coder runs npx vibe-fence undo or tells the agent &quot;you broke the layout / stop doing that,&quot; vibe-fence should capture the reverted diff, synthesize a concise negative guardrail rule (e.g., &quot;Do not modify src/components/Navbar.tsx styling when editing backend routes&quot;)40, write it to .fence/learned-rules.md, and automatically re-transpile it across CLAUDE.md, AGENTS.md, and .cursor/rules/*.mdc—giving non-technical users Hermes-style self-evolving project memory without requiring them to write Markdown or YAML6.

Works cited

Overview - Claude Code Docs, https://code.claude.com/docs/en/overview

Cursor Docs — Agent, Rules, MCP, Skills &amp; CLI, https://cursor.com/docs

windsurfrules Guide: Configure Windsurf AI - ClaudeMDEditor, https://www.claudemdeditor.com/windsurfrules-guide

AGENTS.md, https://agents.md/

Hands-on with Antigravity CLI - Google Codelabs, https://codelabs.developers.google.com/antigravity-cli-hands-on

Hermes Agent — Open-Source AI Agent with Persistent Memory, https://www.hermes-agent.org/

CLAUDE.md Hierarchy, Scoping, and Modular Organisation, https://claudecertificationguide.com/learn/3-claude-code-config/3-1-claude-md-hierarchy

Rules | Cursor Docs, https://cursor.com/docs/rules

Plugins - OpenCode, https://opencode.ai/docs/plugins/

AGENTS.md SPEC for OpenAI Codex - GitHub Gist, https://gist.github.com/dpaluy/cc42d59243b0999c1b3f9cf60dfd3be6

HumanInTheLoopMiddleware - LangChain Reference, https://reference.langchain.com/python/langchain/agents/middleware/human_in_the_loop/HumanInTheLoopMiddleware

How to distinguish between Cursor's Rules and Skills - note, https://note.com/kitokitoworld/n/n352e455ae70b?hl=en

archestra-ai/archestra: Enterprise AI Platform with guardrails, MCP, https://github.com/archestra-ai/archestra

LangGraph Human-in-the-Loop: Interrupt Patterns in Python - turion.ai, https://turion.ai/blog/langgraph-human-in-the-loop-interrupt-tutorial/

Pydantic AI でエージェントを作ってみる - Zenn, https://zenn.dev/finatext/articles/pydantic-ai-introduction

The Ultimate Guide to CLAUDE.md in 2026 - Buildcamp, https://www.buildcamp.io/guides/the-ultimate-guide-to-claudemd

The Complete Guide to CLAUDE.md — Make Claude Code Truly, https://medium.com/@n913239/the-complete-guide-to-claude-md-make-claude-code-truly-understand-your-project-d9d026b808f1

Teaching Claude Code How You Work: CLAUDE.md in Practice, https://dev.to/gunnargrosch/teaching-claude-code-how-you-work-claudemd-in-practice-21d9

AGENTS.md patterns for context engineering in coding ... - GitHub, https://github.com/Austin1serb/agents-md

Cursor Rules, Skills, and Commands, Oh My! When to Use Each, https://www.ibuildwith.ai/blog/cursor-rules-skills-and-commands-oh-my-when-to-use-each/

opencode-agents-and-commands-guide.md - GitHub, https://github.com/juliusz-cwiakalski/agentic-delivery-os/blob/main/doc/guides/opencode-agents-and-commands-guide.md

Best practices for Claude Code, https://code.claude.com/docs/en/best-practices

What Is CLAUDE.md? A Guide for API Documentation Teams, https://readme.com/blog/what-is-claude-md

claude-code-ultimate-guide/CLAUDE.md at main - GitHub, https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/CLAUDE.md

GitHub - OpenCode, https://opencode.ai/docs/github/

GitHub - awesome-opencode/awesome-opencode: A curated list of, https://github.com/awesome-opencode/awesome-opencode

opencode-agent · GitHub Topics, https://github.com/topics/opencode-agent

opencode-plugins-manual/README.md at main - GitHub, https://github.com/joshuadavidthomas/opencode-plugins-manual/blob/main/README.md

opencode-plugin · GitHub Topics, https://github.com/topics/opencode-plugin

AGENTS.md — a simple, open format for guiding coding agents, https://github.com/agentsmd/agents.md

codex/docs/agents_md.md at main · openai/codex - GitHub, https://github.com/openai/codex/blob/main/docs/agents_md.md

Best AGENTS.md Examples for Codex, Cursor, and AI Coding, https://promptessor.com/blog/best-agentsmd-examples-for-codex-cursor-and-ai-coding-agents-in-2026

openai-cookbook/examples/codex/code_modernization.md at main, https://github.com/openai/openai-cookbook/blob/main/examples/codex/code_modernization.md

Building-applications-and-agents-with-OpenAI-codex - GitHub, https://github.com/PacktPublishing/Building-applications-and-agents-with-OpenAI-codex/blob/main/AGENTS.md

Agent Skills | Cursor Docs, https://cursor.com/docs/skills

Cursor Rules Writing (Grade A) - Claude Skill - Skills Directory, https://www.skillsdirectory.com/skills/aibot88-cursor-rules-writing

How do you organize your Cursor rules? - Reddit, https://www.reddit.com/r/cursor/comments/1q9wxk2/how_do_you_organize_your_cursor_rules/

Project Rules: Documented RULE.md folder format not working, only, https://forum.cursor.com/t/project-rules-documented-rule-md-folder-format-not-working-only-undocumented-mdc-format-works/145907

Best cursor.directory Alternatives: Rules and Skills, https://localskills.sh/blog/cursor-directory-alternatives

Repeated critical UI/code integrity issues caused by Cursor Agent, https://forum.cursor.com/t/repeated-critical-ui-code-integrity-issues-caused-by-cursor-agent/158903

Customizing Modes | Roo Code Documentation - GitHub Pages, https://roocodeinc.github.io/Roo-Code/features/custom-modes/

GitHub - RooCodeInc/Roo-Code-Docs: This is the documentation for, https://github.com/RooCodeInc/Roo-Code-Docs

Roo Code: Comprehensive Knowledge Base, https://git.pratiknarola.com/nikhilmundra/RooPrompts/src/commit/eb26f4c714063a546294eaa322071741500cdc95/roo.md

[ENHANCEMENT] Move global custom_modes.yaml to ... - GitHub, https://github.com/RooCodeInc/Roo-Code/issues/10750

Roo Code Custom Modes: Build a Specialized Agent Fast, https://ai.rundatarun.io/ai-systems-architecture/custom-modes-quick-start

custom modes for agile software development with roo code - GitHub, https://github.com/sellisd/roomodes

Overview of all the configs : r/RooCode - Reddit, https://www.reddit.com/r/RooCode/comments/1jw8kmf/overview_of_all_the_configs/

How to Understand Configuration | Continue Docs, https://docs.continue.dev/guides/understanding-configs

Configuration - Continue Docs, https://docs.continue.dev/cli/configuration

Rules | Continue Docs, https://docs.continue.dev/customize/rules

config.yaml Reference - Continue Docs, https://docs.continue.dev/reference

Windsurf Rules - AI Coding Rules, https://aicodingrules.com/rules/windsurf

.WindsurfRules, https://www.dotwindsurfrules.com/

Support for different types of custom instructions - GitHub Docs, https://docs.github.com/en/copilot/reference/custom-instructions-support

Adding repository custom instructions for GitHub Copilot, https://docs.github.com/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot

Windsurf Rules &amp; .windsurfrules Guide - Design.dev, https://design.dev/guides/windsurf-rules/

A Chef's Guide to Customizing GitHub Copilot - Ken Muse, https://www.kenmuse.com/blog/chefs-guide-to-customizing-github-copilot/

Mastering Code Reviews with GitHub Copilot: The Definitive Guide, https://dev.to/pwd9000/mastering-code-reviews-with-github-copilot-the-definitive-guide-3nfp

Turning GitHub Copilot into a “Best Practices Coach” with Copilot, https://techcommunity.microsoft.com/blog/azuredevcommunityblog/turning-github-copilot-into-a-%E2%80%9Cbest-practices-coach%E2%80%9D-with-copilot-spaces--a-mark/4511567

devsquad-copilot/.github/copilot-instructions.md at main · microsoft, https://github.com/microsoft/devsquad-copilot/blob/main/.github/copilot-instructions.md

GitHub - NousResearch/hermes-agent-self-evolution, https://github.com/NousResearch/hermes-agent-self-evolution

Antigravity CLI overview | Google Antigravity Docs, https://antigravity.google/docs/cli/overview/

Google Antigravity, https://antigravity.google/

Getting Started - agents-cli - Google, https://google.github.io/agents-cli/guide/getting-started/

Complete Hermes Agent Setup Guide : r/hermesagent - Reddit, https://www.reddit.com/r/hermesagent/comments/1rt5syt/complete_hermes_agent_setup_guide/

GitHub - PatrickJS/awesome-cursorrules: Configuration files that, https://github.com/PatrickJS/awesome-cursorrules

Cursor Directory - Plugins for Cursor, https://cursor.directory/

GitHub - jpcaparas/rulesync: Easily sync all of your favourite AI, https://github.com/jpcaparas/rulesync

GitHub - dyoshikawa/rulesync: A Utility CLI for AI Coding Agents, https://github.com/dyoshikawa/rulesync

RuleSync — Sync CLAUDE.md Across Repos, https://www.rulesync.dev/

GitHub - x0c/agentsync: Sync Claude Code and Cursor rules, skills, https://github.com/x0c/agentsync

Nymor — one command to sync AI agent rules across Claude, https://www.reddit.com/r/GithubCopilot/comments/1unbvo0/nymor_one_command_to_sync_ai_agent_rules_across/

Pull requests · PatrickJS/awesome-cursorrules - GitHub, https://github.com/PatrickJS/awesome-cursorrules/pulls

rulesync/skills/rulesync/SKILL.md at main · dyoshikawa/rulesync, https://github.com/dyoshikawa/rulesync/blob/main/skills/rulesync/SKILL.md

rulesync: Published a tool to unify management of rules for Claude, https://dev.to/dyoshikawatech/rulesync-published-a-tool-to-unify-management-of-rules-for-claude-code-gemini-cli-and-cursor-390f

Rulesync tutorial: install the AI rules CLI | Hysen Labs, https://hysenlabs.com/projects/dyoshikawa-rulesync

interrupt | langgraph - LangChain Reference, https://reference.langchain.com/python/langgraph/types/interrupt

Human-in-the-loop - Docs by LangChain, https://docs.langchain.com/oss/python/deepagents/human-in-the-loop

Interrupts - Docs by LangChain, https://docs.langchain.com/oss/python/langgraph/interrupts

Human-in-the-loop - Docs by LangChain, https://docs.langchain.com/oss/python/langchain/human-in-the-loop

Human-in-the-loop - Docs by LangChain, https://docs.langchain.com/oss/javascript/deepagents/human-in-the-loop

Human-in-the-Loop Agents: State &amp; Interrupts - Medium, https://medium.com/data-science-collective/architecting-human-in-the-loop-agents-interrupts-persistence-and-state-management-in-langgraph-fa36c9663d6f

Documentation for pydantic-ai - GitHubのGist, https://gist.github.com/szeyu/e7c92f16ea721ba9ffbe472a127006f1

Introduction - Vibes Agent SDK, https://personal-b3af1c31.mintlify.app/introduction

PydanticAI vs OpenAI Agents SDK, https://agents-lib.com/compare/pydanticai-vs-openai-agents-sdk

Pydanticのエージェントフレームワーク「PydanticAI」を試す - Zenn, https://zenn.dev/kun432/scraps/83e7570920a802

Archestra.AI - IT-Harvest Vendors, https://guardiansofthemachineage.com/vendors/archestraai

archestra Provider - Terraform Registry, https://registry.terraform.io/providers/archestra-ai/archestra/latest/docs

Archestra - GitHub, https://github.com/archestra-ai

Open-source infrastructure for enterprise AI | Archestra, https://archestra.ai/

Releases · archestra-ai/archestra - GitHub, https://github.com/archestra-ai/archestra/releases

archestra-ai/examples - GitHub, https://github.com/archestra-ai/examples

archestra - AI Agents on GitHub (4.4k ) - SkillsLLM, https://skillsllm.com/skill/archestra

Activity · archestra-ai/archestra - GitHub, https://github.com/archestra-ai/archestra/activity

A production-ready AI chatbot template built with Vercel AI ... - GitHub, https://github.com/picahq/ai-chatbot-template

Vercel x xAI Chatbot, https://vercel.com/templates/other/vercel-x-xai-chatbot

Nuxt AI Chatbot - Vercel, https://vercel.com/templates/other/nuxt-ai-chatbot

Agents - OpenCode, https://opencode.ai/docs/agents/

Custom instructions with AGENTS.md - ChatGPT Learn, https://learn.chatgpt.com/docs/agent-configuration/agents-md

Antigravity CLI brings the reasoning, execution, and ... - GitHub, https://github.com/google-antigravity/antigravity-cli

NousResearch/hermes-agent: The agent that grows with you - GitHub, https://github.com/nousresearch/hermes-agent