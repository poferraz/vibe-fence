# Stream 01 — Existing harnesses

- **Model:** GPT-6 (`gpt-6`; the session identifies the model family, not a more specific backend revision)
- **Provider:** OpenAI via Codex desktop
- **Date:** 2026-10-20
- **Stream:** 01 — Existing harnesses
- **Contributor:** `openai-gpt-6-2026-10-20`
- **Method:** Web searches followed by primary documentation, upstream GitHub repositories, an engineering case study, and two research papers. This is a documentation survey, not an installation benchmark or penetration test. All source references resolve in the Sources table and were accessed on 2026-10-20.

## Findings

Evidence labels apply narrowly: **`practiced`** identifies documented implementations and practitioner workflows, without claiming measured benefits or equal adoption for every project; **`proven`** identifies a result reported by a paper/evaluation in its stated setting; **`contested`** identifies conflicting evidence, unvalidated transfer, or an explicitly marked inference. Beginner failure modes below are **`contested` inferences**, unless the source directly documents the failure. Install-friction judgments are estimates from the required steps, not timed observations.

The comparison distinguishes **instructions**, **executable workflow/checks**, **tool authorization**, and **execution isolation**. An instruction to avoid secrets is different from denying file access; denying a file tool is different from preventing a shell process from reading the same file. This distinction follows the documented control boundaries in Claude Code, Codex, OpenCode, and Cursor. None of their instruction formats alone establishes that generated applications satisfy OWASP guidance or have passed dependency and secret scans. [S03][S05][S09][S12][S14]

### 1. Portable instruction formats — AGENTS.md and Agent Skills

**Strength:** `practiced` for the formats; `contested` for universal behavioral equivalence.

| Field | Assessment |
|---|---|
| Install friction | Low for a root `AGENTS.md`; a skill adds a directory containing `SKILL.md`, with optional scripts, references, and assets. Hosts still need to discover or install it. [S01][S02] |
| Runtime coverage | Both are shared formats. Loading, precedence, supported metadata, and invocation differ by host; Claude explicitly adds extensions to the skill standard. [S02][S03][S10] |
| Safety behavior | These describe instructions/resources, not an OS security boundary. The skills specification marks `allowed-tools` experimental; do not interpret it as a portable deny policy. [S02][S05] |
| Scoping behavior | Can express test commands and procedures. There is no task state machine or mandatory checkpoint in the file format itself. [S01][S02] |
| Teaching behavior | Authors can include explanations and examples; neither format specifies a learner model or teaching-level control. [S01][S02] |
| Failure mode for a non-technical user | **Inference:** a successfully copied file may be mistaken for an active, enforced policy. A host may load it differently or ignore host-specific metadata. [S02][S03][S10] |

**Assessment:** Use these as distribution surfaces, then verify the host's behavior separately. [S02][S03][S10]

### 2. Claude Code — skills, hooks, sandbox, and output styles

**Strength:** `practiced`; no novice-safety outcome evaluation established here.

| Field | Assessment |
|---|---|
| Install friction | Low for a local `.claude/skills/<name>/SKILL.md`; plugin packaging supports sharing. Hooks and sandbox settings add configuration and executable dependencies. [S03][S04][S05] |
| Runtime coverage | Native Claude Code integration. Standard skill content can travel, but invocation controls, hook schemas, and subagent features require adapters. [S03][S04] |
| Safety behavior | `PreToolUse` can block a call; the shell sandbox enforces filesystem/network limits through the OS. The sandbox page says it is off by default and covers shell commands, while file tools, hooks, and MCP servers have different boundaries. Secret-read and environment handling need explicit attention; sandboxing is not an application vulnerability scan. [S04][S05] |
| Scoping behavior | Skills can encode staged procedures and verification. Hooks can enforce a specific operation gate. Neither implies that every task is automatically small or every acceptance criterion checked. [S03][S04] |
| Teaching behavior | Explanatory adds short explanations; Learning includes code for the human to write. Concise and Proactive affect communication/initiative. The output-style documentation explicitly separates those instructions from permission controls. [S06] |
| Failure mode for a non-technical user | **Inference:** enabling a shell sandbox can be mistaken for protection of every tool; Learning can leave coding work that a non-coder cannot finish. [S05][S06] |

**Assessment:** Strong reference for separate teaching and authorization controls. A vibe-fence adapter must inspect actual sandbox/tool coverage, not merely install a skill. [S04][S05][S06]

### 3. OpenCode — rules, plugins, and versioned permissions

**Strength:** `practiced`; compatibility across versions remains `contested` until tested.

| Field | Assessment |
|---|---|
| Install friction | `/init` creates or updates `AGENTS.md`. The V1 documentation supports local JavaScript/TypeScript plugins or npm packages in config; npm dependencies are installed at startup. [S07][S08] |
| Runtime coverage | OpenCode-specific hooks/configuration; `AGENTS.md` is portable content. V1 documents `CLAUDE.md` fallback behavior rather than identical loading of both files. [S07][S08] |
| Safety behavior | V2 has ordered `allow`/`deny`/`ask` rules; last matching rule wins. It uses `permissions`, `shell`, and `subagent`, unlike V1's names. Its docs explicitly say shell execution retains the host user's filesystem, process, and network authority. This is not an OS sandbox or an OWASP check. [S09] |
| Scoping behavior | Plugin lifecycle/tool events provide places to insert checks and record outcomes. Work decomposition still needs a procedure supplied by the harness. [S08] |
| Teaching behavior | Rules and plugins can customize behavior and notifications; no teaching dial was established in the inspected pages. [S07][S08] |
| Failure mode for a non-technical user | **Inference:** copying a V1 policy into V2, reversing rule order, or treating a shell allowlist as isolation produces misleading protection. [S09] |

**Assessment:** Detect runtime version first. The V1 plugin API inspected here must not be assumed to be the V2 plugin contract. [S08][S09]

### 4. Codex — AGENTS.md, skills/packs, and execution permissions

**Strength:** `practiced` for documented controls; `contested` for portable prompt-pack guarantees.

| Field | Assessment |
|---|---|
| Install friction | Low for `AGENTS.md` or repository `.agents/skills/`; the upstream skills catalog offers installation through `$skill-installer`. Deployment of permission settings is a separate step. [S10][S11][S60] |
| Runtime coverage | Codex CLI, IDE, and desktop-related surfaces support skills, but discovery and execution environments differ. The documented instruction chain includes `AGENTS.override.md` and a default aggregate limit of 32 KiB. [S10][S11][S12] |
| Safety behavior | Local Codex combines OS-enforced sandbox limits with an approval policy and network controls. Documentation distinguishes local and cloud execution and warns that policy examples are not automatically interchangeable. `AGENTS.md` is guidance, not the control that enforces these limits. [S10][S12] |
| Scoping behavior | A skill can supply planning/verification steps; instruction hierarchy scopes context. Neither is evidence of enforced task size or automatic dependency auditing. [S10][S11] |
| Teaching behavior | A skill can encode explanatory behavior. The inspected configuration pages do not establish a native maximum-to-silent teaching workflow. [S10][S11] |
| Failure mode for a non-technical user | **Inference:** overrides, truncation, or starting in a different directory can change loaded guidance; a prompt pack may be mistaken for a sandbox configuration. [S10][S12] |

**Assessment:** Install concise project guidance, then separately test allowed and denied operations in each execution environment. [S10][S12]

### 5. Cursor — Rules/MDC and runtime security

**Strength:** `practiced`.

| Field | Assessment |
|---|---|
| Install friction | Low: author `.cursor/rules/*.mdc` or `AGENTS.md`, or use settings. Current docs say plain `.md` files inside `.cursor/rules` are ignored. [S13] |
| Runtime coverage | Cursor-specific activation metadata; `AGENTS.md` offers a simpler shared entry point. Historical `.cursorrules` collections need migration checks. [S13][S51] |
| Safety behavior | Terminal and MCP approvals are separate from Rules. Cursor calls its run modes best-effort guardrails, not a hard security boundary. Workspace edits can be saved before review, and auto-reload can execute them. No secret/dependency scan follows merely from installing Rules. [S14] |
| Scoping behavior | Rules may activate always, by matching files, by agent selection, or manually. This scopes context, not the size or risk of a change. [S13] |
| Teaching behavior | Rules can set response preferences; no structured teaching dial was established in the inspected pages. [S13] |
| Failure mode for a non-technical user | **Inference:** wrong extensions or activation conditions silently omit expected guidance; approval habits cannot prevent code already executed by a watcher. [S13][S14] |

**Assessment:** Validate both file format and activation, and account for development-server execution after file writes. [S13][S14]

### 6. Roo Code — custom modes and orchestration

**Strength:** `practiced`.

| Field | Assessment |
|---|---|
| Install friction | Extension/provider setup, then UI configuration or YAML/JSON for modes; exported modes can package their rules. Fine-grained edit restrictions require additional configuration. [S15] |
| Runtime coverage | Roo modes and tool groups belong to Roo; portable YAML here means moving between Roo installations/projects, not arbitrary agent compatibility. [S15] |
| Safety behavior | Modes restrict tool groups and allowed edits. Auto-approve grants categories of action, including terminal and MCP access; Roo documents associated risks and separate outside-workspace options. These do not establish a general vulnerability scanner or process sandbox. [S15][S16] |
| Scoping behavior | Orchestrator mode can delegate through `new_task`, using mode-specific instructions. Task delegation and human confirmation are separate configurable behaviors. [S15][S16] |
| Teaching behavior | A mode's role and custom instructions can change explanations and interaction. No common graded teaching policy was established. [S15] |
| Failure mode for a non-technical user | **Inference:** approving mode switching/subtasks while assuming one mode's restrictions persist can create an inaccurate mental model of authority. [S15][S16] |

**Assessment:** Borrow explicit tool capability sets, with separate authorization for transitions between them. [S15][S16]

### 7. Continue — rules, IDE modes, and CLI permissions

**Strength:** `practiced`; CLI plan-mode isolation is `contested` because the documentation needs clarification.

| Field | Assessment |
|---|---|
| Install friction | Add `.continue/rules` after configuring Continue and a compatible model. IDE Agent/Plan availability depends on tool support. [S17][S64] |
| Runtime coverage | Continue IDE and CLI, with distinct documented behavior; model-provider choice does not make these policies applicable to other coding agents. [S18][S64] |
| Safety behavior | CLI tool permissions are `allow`, `ask`, or `exclude`; write tools and Bash default to `ask`. In headless mode, `ask` tools are excluded. `--auto` overrides permissions. This is useful authorization machinery, not evidence of complete secrets/dependency/OWASP enforcement. [S18] |
| Scoping behavior | IDE Plan mode is documented as read-only. The CLI page calls plan mode read-only yet its modes table includes Bash and says modes override flags/config. Do not certify CLI plan mode as filesystem isolation from this page alone. [S18][S64] |
| Teaching behavior | Rules can guide explanatory style; mode selection offers a planning conversation, not a verified teaching curriculum. [S17][S64] |
| Failure mode for a non-technical user | **Inference:** copying an interactive workflow into headless mode may remove necessary tools; using `--auto` to fix the problem can override carefully configured permissions. [S18] |

### 8. Windsurf/Cascade — now documented within Devin Desktop

**Strength:** `practiced`; migration behavior must be checked on the installed product.

| Field | Assessment |
|---|---|
| Install friction | Workspace rules/workflows are file-based. The inspected Windsurf URLs redirect to Devin documentation, which prefers `.devin/` paths and retains `.windsurf/` fallbacks. [S19][S20] |
| Runtime coverage | These pages describe Cascade, with explicit differences from Devin Local. They say Cascade memories and workflows do not carry over as equivalent features to Devin Local; migration to skills is advised. [S19][S20] |
| Safety behavior | Cascade pre-hooks can block actions with exit code 2; post-hooks cannot undo an action already performed. Rule text itself is guidance. A complete secret/dependency policy requires separately implemented checks. [S21] |
| Scoping behavior | Workflows encode step sequences but are manually invoked. Skills provide a different, dynamically invoked procedure mechanism. [S19][S20] |
| Teaching behavior | Rules can request explanations. Local auto-generated memories are not repository-shared teaching policy. [S19] |
| Failure mode for a non-technical user | **Inference:** changing the active agent or relying on machine-local memories can lose the intended workflow even though a familiar editor remains open. [S19][S20] |

**Assessment:** Identify the active agent, not only the editor brand. Use versioned, inspectable project files for durable policy. [S19][S20]

### 9. Hermes — skills and configurable security layers

**Strength:** `practiced`; autonomous skill quality is not independently validated here.

| Field | Assessment |
|---|---|
| Install friction | Hermes setup plus skills in `~/.hermes/skills/`, hub installation, or external skill directories. Skills follow the shared standard but need Hermes configuration. [S22] |
| Runtime coverage | Hermes-specific execution and approval settings; skill content has wider format compatibility. [S22][S23] |
| Safety behavior | Docs describe dangerous-command approval, file-write controls, container isolation, MCP credential filtering, and context scanning. Headless dangerous-action defaults are deny for several modes. These are distinct layers, not proof of complete attack coverage. [S23] |
| Scoping behavior | Skills supply procedures; the agent can create and modify skills. `skills.write_approval` can stage skill changes for review and is documented as off by default. [S22] |
| Teaching behavior | Skills can encode coaching. Agent learning/self-improvement changes its reusable instructions; that is not evidence that users learn or understand changes. [S22] |
| Failure mode for a non-technical user | **Inference:** automatically updated skills can persist a mistaken procedure; dangerous-command matching can be mistaken for full execution isolation. [S22][S23] |

**Assessment:** Treat learned guidance as reviewable state and verify which terminal backend provides isolation. [S22][S23]

### 10. Google Antigravity — rules, reviewed artifacts, permissions

**Strength:** `practiced`; cross-surface parity is not established.

| Field | Assessment |
|---|---|
| Install friction | Add `AGENTS.md`/`GEMINI.md` or `.agents/rules/*.md`, or use customization UI. Modular rules require valid `trigger` frontmatter; docs warn invalid values are silently discarded. [S24] |
| Runtime coverage | Rules documentation covers app, CLI, and IDE; permission/review pages identify narrower surfaces and platform-specific differences. Do not extrapolate app defaults to all surfaces. [S24][S25][S26] |
| Safety behavior | The app's macOS/Linux Default preset uses a terminal sandbox; Turbo disables it and permits broad access. Deny/Ask/Allow precedence differs from OpenCode's last-match rules. Windows uses a different permission system in the inspected docs. No application-security audit is implied by these settings. [S25][S09] |
| Scoping behavior | Planning mode produces task groups and implementation artifacts; Request review pauses for approval, while Always proceed bypasses review pauses. [S26] |
| Teaching behavior | Plans, walkthroughs, and reviewable artifacts expose decisions. This supports explanation, but no adaptive teaching outcome was demonstrated. [S26] |
| Failure mode for a non-technical user | **Inference:** selecting Turbo for speed can change authority and isolation, rather than just reduce narration. Invalid rule syntax can remove expected guidance. [S24][S25] |

**Assessment:** vibe-fence's turbo should have its own semantics and must not map blindly to a host's similarly named preset. [S25]

### 11. Gemini CLI — hierarchical context and a policy engine

**Strength:** `practiced`.

| Field | Assessment |
|---|---|
| Install friction | CLI setup plus `GEMINI.md`; modular imports and `/memory show`/reload help inspect context. Tool policies use separate TOML files. [S27][S29] |
| Runtime coverage | Gemini CLI-specific policy and sandbox configuration. Markdown content can be translated to another host, but policy rules are not a shared agent standard. [S27][S29] |
| Safety behavior | The policy engine can allow, deny, or ask about tool calls. Sandboxing adds execution restrictions and an explicit expansion request for operations needing additional access. Neither context files nor permission approval verifies dependency safety. [S27][S28] |
| Scoping behavior | Hierarchical files scope project guidance; policies gate tool execution. A small-task/checkpoint procedure needs additional instructions or orchestration. [S27][S29] |
| Teaching behavior | Context files can request explanations; `/memory show` makes loaded instruction content inspectable, which helps troubleshooting but is not a teaching dial. [S29] |
| Failure mode for a non-technical user | **Inference:** approving sandbox expansions without understanding the added access can erode the intended boundary. [S28] |

### 12. GitHub Copilot — custom instructions and cloud-agent firewall

**Strength:** `practiced`; support varies by Copilot surface.

| Field | Assessment |
|---|---|
| Install friction | Repository-wide `.github/copilot-instructions.md`, path-specific instruction files, or supported agent instruction files; product setup and organization policy remain separate. [S30] |
| Runtime coverage | Copilot surfaces support different instruction types. This is not a promise that a cloud-agent control also exists in every IDE or CLI surface. [S30][S31] |
| Safety behavior | Cloud-agent/code-review internet access has a default firewall and allowlists. The firewall documentation excludes MCP server processes and configured setup steps from its direct scope. Instruction files do not by themselves enforce secret or dependency scans. [S30][S31] |
| Scoping behavior | Paths can scope applicable instructions. The instruction mechanism does not itself guarantee small tasks or acceptance checkpoints. [S30] |
| Teaching behavior | Custom instructions can specify tone and level of explanation. No learning-effect evaluation was located for this mechanism. [S30] |
| Failure mode for a non-technical user | **Inference:** assuming a network firewall covers every connected process or that all Copilot surfaces load the same instructions overstates protection. [S30][S31] |

### 13. Cline — rules, Plan/Act, and approval categories

**Strength:** `practiced`.

| Field | Assessment |
|---|---|
| Install friction | Rules can be written in `.clinerules/` or `.cline/rules/` and toggled through the UI. Native modes and auto-approval settings add setup choices. [S32][S33][S34] |
| Runtime coverage | Rules documentation covers VS Code, Desktop, and CLI; the auto-approve page is explicitly an IDE feature. Avoid assuming identical controls across them. [S32][S34] |
| Safety behavior | Auto-approval evaluates categories of tool calls. The docs say the model marks commands with `requires_approval`; this is not a fixed allowlist. No general process sandbox or mandatory OWASP/dependency scan is established by these pages. [S34] |
| Scoping behavior | Plan mode can inspect and discuss but cannot modify files or execute commands; Act mode can implement. This is a documented tool boundary around planning. [S33] |
| Teaching behavior | Plan mode supports discussing architecture, tradeoffs, and edge cases. A nontechnical explanation still needs suitable instructions. [S33] |
| Failure mode for a non-technical user | **Inference:** “safe commands” may sound deterministic even though their classification is supplied by the model. [S34] |

**Assessment:** Borrow the visible plan/act distinction, while keeping machine-enforced permission checks independent of the acting model's risk label. [S33][S34]

### 14. Aider — conventions, automatic checks, and Git recovery

**Strength:** `practiced`.

| Field | Assessment |
|---|---|
| Install friction | Aider setup plus a conventions file loaded with `--read` or `.aider.conf.yml`. Project test commands require configuration. [S35][S37] |
| Runtime coverage | Aider's own editing/checking loop; convention text is reusable elsewhere, while automatic check/commit behavior is runtime-specific. [S35][S36][S37] |
| Safety behavior | Automatic linting and configured tests supply concrete feedback after edits; Git integration enables review and undo. These concern code quality and recovery, not a comprehensive secret/dependency policy or execution sandbox. [S36][S37] |
| Scoping behavior | File selection and a series of Git changes make work reviewable. The inspected pages do not prescribe a complete approval-gated decomposition workflow. [S35][S36] |
| Teaching behavior | Conventions can shape responses; lint/test feedback is technically actionable, but no novice-focused translation is established. [S35][S37] |
| Failure mode for a non-technical user | **Inference:** a clean lint run or an undoable commit can be mistaken for correctness or reversibility of external side effects. Misconfigured formatter exit codes can also confuse the repair loop, a documented caveat. [S36][S37] |

**Assessment:** Copy the check-result-to-repair loop and explicit recovery points, with a clear distinction between local recovery and external changes. [S36][S37]

### 15. LangGraph and Deep Agents — programmable workflow harnesses

**Strength:** `practiced`; beginner usability and safety require an application layer.

| Field | Assessment |
|---|---|
| Install friction | High relative to dropping a rule file: integrate a library, model/tools, graph or agent, persistence, and a UI/runner. Deep Agents provides more prebuilt agent capabilities. [S38][S39] |
| Runtime coverage | Frameworks for building an agent application; they do not automatically intercept an independently running Cursor/Codex session. This is an architectural inference from their integration model. [S38][S39] |
| Safety behavior | `interrupt()` can suspend execution for external approval with persisted state. Tool authorization and execution environment still have to be designed. A checkpoint is not a security scan or filesystem rollback. [S38] |
| Scoping behavior | Graph nodes, checkpoints, and resume operations supply explicit workflow control. Deep Agents offers filesystem context, subagents, and optional planning/skills. [S38][S39] |
| Teaching behavior | Developers must build explanations and approval presentation into the app. The underlying interruption payload can carry structured context for that UI. [S38] |
| Failure mode for a non-technical user | **Inference:** a badly placed approval can replay side effects. LangGraph explicitly warns that the interrupted node restarts and operations before the interrupt should be idempotent. [S38] |

**Assessment:** Copy durable state and resumable approvals as design patterns. Adopting the whole framework would be a separate architecture decision. [S38][S39]

### 16. Pydantic AI and Pydantic AI Harness

**Strength:** `practiced` for APIs; `contested` for model-reviewed safety effectiveness.

| Field | Assessment |
|---|---|
| Install friction | Python library integration (`pip install pydantic-ai`), model configuration, and tool implementation. The project also supplies a coder harness/CLI route; building a safe product still requires integration. [S61] |
| Runtime coverage | Multiple model providers through a Python API. This is provider portability, not automatic policy control over unrelated coding-agent runtimes. [S61] |
| Safety behavior | Deferred tools support explicit approval, including argument/context-dependent requests. The docs explicitly warn that client-submitted approval/history is not an authorization boundary: authentication and sensitive-action authorization must remain server-side. [S40] |
| Scoping behavior | Pending tool calls have IDs, arguments, metadata, and resumable results. Harness capabilities include planning and delegation, but the application must define task limits and acceptance checks. [S40][S61] |
| Teaching behavior | The application owns presentation; deferred-call metadata can support understandable questions. No measured nontechnical teaching outcome is established. [S40] |
| Failure mode for a non-technical user | **Inference:** an approval card can create false confidence if the backend trusts arbitrary client history. A second-model reviewer can reduce prompts but does not prove that risky calls are correctly classified. [S40][S41] |

**Assessment:** The Approval Reviewer documents a useful fallback: uncertainty, model failure, or insufficient review budget leaves the call for human review. Preserve that behavior if experimenting with automatic approval. [S41]

### 17. Archestra — gateway, policy engine, and enterprise runtime

**Strength:** `practiced` for documented integration; broad anti-injection guarantees remain `contested` without independent testing.

| Field | Assessment |
|---|---|
| Install friction | Docker quickstart, persisted services, credentials, and routing configuration; production options include Kubernetes. The quickstart mounts the Docker socket, a deployment choice requiring scrutiny. [S43] |
| Runtime coverage | LLM/MCP gateway integration for clients including Claude Code, Codex, and Cursor, plus an agent runtime. This is broader than a single editor's rule file. [S43] |
| Safety behavior | Current guardrail docs describe an external deterministic OpenAPPA policy engine, session restrictions, and per-call decisions. The feature is beta; its integration has licensing conditions. Protection of arbitrary direct local shell/file operations outside the gateway was not demonstrated. [S42][S43] |
| Scoping behavior | Runtime delegation and reusable skills exist; gateway policy governs allowed actions, not automatically the size of a coding task. [S42][S43] |
| Teaching behavior | The platform provides chat for nontechnical users, but that alone is not evidence of a coding-specific teaching dial or autonomous remediation queue. [S43] |
| Failure mode for a non-technical user | **Inference:** routing some tools through a gateway can be mistaken for coverage of all tools; operational and licensing complexity can undermine a one-command beginner experience. [S42][S43] |

**Assessment:** Copy policy evaluation outside the acting model and explicit provenance/state tracking. Do not present the gateway as universal local-process interception. [S42][S43]

### 18. Vercel AI SDK — tool loops and approval plumbing

**Strength:** `practiced`; safety depends on the application using it.

| Field | Assessment |
|---|---|
| Install friction | TypeScript/JavaScript integration with models, tools, and application state/UI, rather than an editor configuration drop. [S44] |
| Runtime coverage | SDK-built agent applications. No transparent adapter for every existing coding agent is established by this API. [S44] |
| Safety behavior | Current v7 docs use `toolApproval`; older `needsApproval` is deprecated. Tools with execution functions run automatically unless configured otherwise. Provider-executed tools are outside this local approval mechanism. [S44] |
| Scoping behavior | Multi-step tool execution and stop conditions support bounded loops. Manual approval is a request/response flow across calls, so the application must retain and validate the pending action. [S44] |
| Teaching behavior | The approval reason can be surfaced to a person; a teaching policy is application work. [S44] |
| Failure mode for a non-technical user | **Inference:** an approval UI may appear comprehensive while missing provider-executed tools. [S44] |

**Assessment:** Useful for a companion UI, but not a substitute for native runtime enforcement. Version-pin any API sketch. [S44]

### 19. Superpowers — composable development methodology

**Strength:** `practiced` for published workflow; reliability claims are not established by controlled evaluation here.

| Field | Assessment |
|---|---|
| Install friction | Marketplace/plugin installation for several hosts, other host-specific routes elsewhere. The README explicitly requires separate installation per harness. [S45] |
| Runtime coverage | Documents Claude Code, Codex, Cursor, OpenCode, Gemini, Hermes, Antigravity, and additional integrations. Supported installation paths are not evidence of identical execution semantics. [S45] |
| Safety behavior | Promotes testing, review, and disciplined workflow; the README does not establish a universal execution sandbox or mandatory secret/dependency scanner. [S45] |
| Scoping behavior | Clarify intent, approve a design, produce an implementation plan, execute tasks, review results. [S45] |
| Teaching behavior | Conversational design clarification and readable design chunks expose decisions; no formal teaching-level dial is documented in the README. [S45] |
| Failure mode for a non-technical user | **Inference:** procedural overhead can become a barrier for small tasks; host lifecycle differences can affect activation. The Hermes installation note specifically warns of losing bootstrap instructions after compaction. [S45] |

**Assessment:** Borrow explicit design/task/review artifacts; make ceremony proportional to the change. [S45]

### 20. GitHub Spec Kit — scaffolded processes and specifications

**Strength:** `practiced`; outcome improvements are not benchmarked here.

| Field | Assessment |
|---|---|
| Install friction | Python/uv plus Specify CLI and an agent integration. Current README shows `uv tool install specify-cli`, then `specify init ... --integration ...`; older command examples should not be assumed current. [S46] |
| Runtime coverage | Multiple supported agent integrations with different invocation syntax. [S46] |
| Safety behavior | Can encode quality gates and organizational standards, but a generated constitution is not an execution boundary or proof of a completed security scan. [S46] |
| Scoping behavior | Constitution, specification, plan, tasks, implementation, and convergence; separate bug-fixing and assessment entry points avoid requiring a full feature process for every change. [S46] |
| Teaching behavior | Documented outcomes and stepwise review give users something concrete to assess; interpreting architecture still requires help. [S46] |
| Failure mode for a non-technical user | **Inference:** approving plausible specifications or a “converged” result without checking acceptance evidence can institutionalize a wrong requirement. [S46] |

**Assessment:** Copy requirement-to-task traceability and separate workflows for small fixes. [S46]

### 21. BMad Method — guided planning and delivery

**Strength:** `practiced`; release maturity is explicitly qualified.

| Field | Assessment |
|---|---|
| Install friction | The inspected README distinguishes stable v6.12 (`npx bmad-method install`) from v7 preview-alpha skills/plugin installation. Setup has Node/Python/uv prerequisites depending on route. [S47] |
| Runtime coverage | Integrates through coding tools/skills and documented plugin routes; choose an explicit release line before generating files. [S47] |
| Safety behavior | Reviewed implementation and verification are part of the method. The README does not establish a universal process sandbox or always-on secret/dependency enforcement. [S47] |
| Scoping behavior | Small clear changes can go directly to build; complex work gets product, architecture, UX, and testing perspectives and durable context. [S47] |
| Teaching behavior | Guided collaboration/help offers procedural assistance. It is not evidence that novice users can independently judge technical tradeoffs. [S47] |
| Failure mode for a non-technical user | **Inference:** mixing preview and stable instructions can break installation or workflow expectations; overly elaborate planning can exceed the user's needs. [S47] |

**Assessment:** Copy proportional planning. The README's v7 ETA is already earlier than the access date while the page still says preview; treat the label as observed and release status as unresolved. [S47]

### 22. OpenSpec — change proposals and durable specifications

**Strength:** `practiced`.

| Field | Assessment |
|---|---|
| Install friction | Install the CLI, then `openspec init`; Node/npm and Homebrew routes are documented. Initialization prints invocation syntax for selected tools. [S48] |
| Runtime coverage | Multiple coding tools, with different slash-command or skill invocation forms. [S48] |
| Safety behavior | Reviewable plans/specifications constrain intended work; they do not constitute an execution sandbox or verify secrets/dependencies. [S48] |
| Scoping behavior | A change contains proposal, scenarios/specifications, design, and a task checklist. Explore/propose/apply/archive preserves intent through implementation. [S48] |
| Teaching behavior | Explore is a discussion-oriented entry point; requirements expressed as scenarios are reviewable without reading implementation code. [S48] |
| Failure mode for a non-technical user | **Inference:** a checked task list can be confused with demonstrated behavior. Differences between default and expanded command profiles can cause onboarding confusion. [S48] |

**Assessment:** Copy one bounded change folder and concrete user-visible scenarios. [S48]

### 23. GSD / GSD Core — phased delivery with persistent context

**Strength:** `practiced` for the workflow; performance marketing remains `contested`.

| Field | Assessment |
|---|---|
| Install friction | The old `gsd-build/get-shit-done` repository is archived and points to `open-gsd/gsd-core`. The current README shows `npx @opengsd/gsd-core@latest` with runtime and local/global selection. [S49][S50] |
| Runtime coverage | GSD Core lists multiple runtimes. It explicitly says the installer is required for compatibility and direct copying of agent/command files is inappropriate. [S50] |
| Safety behavior | Verify/fix phases provide process-level checking. The inspected README does not demonstrate host isolation or a mandatory secret/dependency scanner. [S50] |
| Scoping behavior | Discuss, plan, execute, verify, ship; fresh-context subagents and persistent state/context files support phases across sessions. [S50] |
| Teaching behavior | Discuss captures user decisions; tutorials guide the process. No graded learning policy is documented in the inspected README. [S50] |
| Failure mode for a non-technical user | **Inference:** stale tutorials can install a different generation of GSD; automated completion can be mistaken for independently verified correctness. [S49][S50] |

**Assessment:** Copy explicit phase state and generated adapters; do not repeat unverified claims that context rot is solved. [S50]

### 24. Rule and skill collections — useful material, heterogeneous guarantees

**Strength:** `practiced` for published artifacts; `contested` for efficacy, security, and smaller projects' adoption.

| Field | Assessment |
|---|---|
| Install friction | Ranges from selecting/copying a rule, to cloning shared instructions, to a skill installer or plugin. Inspect the individual artifact's dependencies and license. [S51][S53][S60][S62][S63] |
| Runtime coverage | `PatrickJS/awesome-cursorrules` targets Cursor MDC; `openai/skills` and `anthropics/skills` provide host-oriented examples; `khasky/awesome-agents-md` advertises shared rules with optional modules; `steipete/agent-scripts` combines instructions, skills, helpers, and hooks. [S51][S53][S60][S62][S63] |
| Safety behavior | Security-themed rule text is not equivalent to an active check. Some packs contain executable helpers/hooks, which require source review and integration testing. Anthropic explicitly labels its examples educational and warns behavior may differ from hosted capabilities. [S51][S53][S63] |
| Scoping behavior | Artifact-specific. A focused module can be loaded on demand; a large shared file can apply many unrelated rules. [S62][S63] |
| Teaching behavior | Artifact-specific; examples may be useful to authors without being beginner-facing interaction designs. [S53][S62] |
| Failure mode for a non-technical user | **Inference:** broad imports can conflict with project conventions or execute helpers with unexpected authority; catalog inclusion is not a security audit. [S51][S53][S63] |

**Maintenance note:** `steipete/agent-rules` is archived, and its README points to `agent-scripts`; do not describe the old collection as the active upstream. No popularity or independent quality claim is made for the smaller `awesome-agents-md` example. [S52][S62][S63]

### 25. Conventional scaffolders — create-next-app, Cookiecutter, Copier

**Strength:** `practiced` for generation/update mechanisms; `contested` for downstream agent-quality benefits.

| Field | Assessment |
|---|---|
| Install friction | `create-next-app` bootstraps a framework project; Cookiecutter needs a selected template; Copier adds template-version and answers tracking for updates. These are initialization mechanisms, not automatically ongoing agent wrappers. [S54][S55][S56] |
| Runtime coverage | Generated source/configuration can be used by different agents. Current create-next-app docs list `--agents-md` as enabled by default, so it also injects agent guidance. [S56] |
| Safety behavior | Templates can supply checks, but enforcement depends on what is generated and subsequently run. Cookiecutter hooks execute code and can stop generation; Copier updates may produce conflicts needing review. Neither guarantees application security. [S54][S55] |
| Scoping behavior | Scopes initialization or template updates. It does not decompose subsequent product work into approved tasks. [S54][S55][S56] |
| Teaching behavior | Prompts/configuration explain setup choices; a continued companion workflow must be added. [S55][S56] |
| Failure mode for a non-technical user | **Inference:** “generated successfully” may be read as “safe”; template updates can create conflicts the user cannot resolve. Existing generated agent guidance can also collide with a later harness install. [S55][S56] |

**Assessment:** Copy deterministic generation and upgrade provenance. Merge into existing guidance instead of overwriting it. [S55][S56]

### 26. Anthropic's long-running-agent reference harness

**Strength:** `practiced` engineering case study; not a comparative novice-safety evaluation. [S59]

| Field | Assessment |
|---|---|
| Install friction | Developer integration using a reference implementation around the Claude Agent SDK. [S59] |
| Runtime coverage | The case study uses Claude; portability is a proposed adaptation, not an evaluated result. [S59] |
| Safety behavior | Feature tests, browser verification, progress logs, and Git recovery address observed development failures. No general secret/dependency or least-privilege guarantee is demonstrated. [S59] |
| Scoping behavior | An initializer prepares the environment and feature list; later sessions work incrementally and leave progress artifacts. [S59] |
| Teaching behavior | The artifacts inform later agent sessions; a user-facing teaching dial is not part of the reported design. [S59] |
| Failure mode for a non-technical user | The authors observed premature completion and inadequate end-to-end checking. **Inference:** a progress file without trustworthy verification can preserve an incorrect success claim. [S59] |

**Assessment:** Copy durable progress plus evidence-backed completion; test transfer to other agents. [S59]

### 27. Comparative evidence — instruction files are not a universal quality upgrade

- **`proven` within the reported study; external generalization `contested`:** Lulla et al., arXiv:2601.20404v2 (2026-03-30), report 10 repositories and 124 pull requests, with a 28.64% lower median runtime and 16.58% lower output-token consumption associated with AGENTS.md, and comparable task-completion behavior. These are efficiency results, not novice-safety or vulnerability-reduction results. This survey checked the paper's abstract/version record, not a fresh reproduction. [S58]
- **`proven` within the reported study; external generalization `contested`:** Gloaguen et al., arXiv:2602.11988v3 (2026-09-29), report that context files do not generally improve task success and increase inference cost by over 20% on average across their evaluated settings. They distinguish useful nonstandard instructions from unhelpful repository overviews. This survey checked the abstract/version record; it does not establish that every context file is harmful. [S57]
- **`contested` synthesis:** The studies measure different outcomes/settings and do not justify a universal positive or negative effect. The existence of a rule format or successful installer is evidence of a mechanism, not evidence of reduced security incidents or better novice comprehension. vibe-fence should test a minimal rule set against no harness and against executable checks, using the same tasks/models. [S57][S58]

## Coverage gaps

1. **No hands-on install or bypass testing.** Commands above are observed installation routes, not commands executed during this run. Friction estimates, protection boundaries, and novice failure hypotheses need validation on clean machines and actual runtime versions.
2. **No complete market census.** This covers every family named in the assignment plus adjacent tools relevant to portability, scoping, or recovery. Kilo, Pi, Kimi, OpenHands, and other agents deserve additional native-adapter investigation; mention in a workflow pack's support list is not an audited adapter. [S45][S50]
3. **Nontechnical-user outcomes remain unmeasured here.** No controlled beginner study was located that compares these harnesses on comprehension, unsafe approvals, successful deployment, and recovery. The two papers included concern coding-agent efficiency/performance. [S57][S58]
4. **Security coverage is partial and configurable.** No basis was found in this survey for treating any instruction-file installation as universal OWASP, secrets, dependency, and least-privilege enforcement. Native tool boundaries, shell isolation, MCP, gateways, and provider-side tools have distinct coverage. [S05][S09][S12][S31][S44]
5. **Moving documentation, not pinned release snapshots.** URLs were accessed on the stated date; GitHub `main` and vendor docs can change. Notable observed drift: OpenCode V1/V2 schemas, Windsurf-to-Devin paths and active-agent differences, GSD's successor repository, archived agent-rules, AI SDK v7 approval API, and BMad's inconsistent preview/ETA wording. No exact tested package-version matrix is claimed. [S09][S19][S20][S44][S47][S49][S52]
6. **Continue CLI ambiguity.** The plan-mode description and Bash entry warrant source-code/runtime checking before using “read-only” as a hard guarantee. [S18]
7. **Commercial/enterprise dependencies not fully mapped.** Archestra's current guardrail integration has beta/licensing caveats. This survey did not compare every plan, hosted deployment, or managed-policy option. [S42]
8. **Absence of a documented teaching dial is not proof of absence.** Many tools are customizable; the survey did not inspect every marketplace plugin or enterprise configuration. The clearest native precedent found was Claude's output styles. [S06]
9. **Raw discovery notes.** Broad searches surfaced mirrors, older forks, and community recommendations. Technical conclusions above use primary sources. The old Codex `/security` URL now resolves to the application-scanning product; runtime controls were checked through its explicit Agent approvals & security link. A guessed Archestra quickstart path failed; installation facts come from the upstream README. These redirects/failures are not evidence that the capabilities are unavailable. [S12][S43]

## Sources

Each `[SNN]` citation links directly to its source. Access dates apply to every linked claim above. Repository/documentation pages are mutable; paper URLs pin the version inspected through the arXiv record.

| # | Source URL | Type | Accessed |
|---|---|---|---|
| S01 | [AGENTS.md format][S01] | docs | 2026-10-20 |
| S02 | [Agent Skills specification][S02] | docs | 2026-10-20 |
| S03 | [Claude Code skills][S03] | docs | 2026-10-20 |
| S04 | [Claude Code hooks][S04] | docs | 2026-10-20 |
| S05 | [Claude Code shell sandbox][S05] | docs | 2026-10-20 |
| S06 | [Claude Code output styles][S06] | docs | 2026-10-20 |
| S07 | [OpenCode rules (V1 documentation path)][S07] | docs | 2026-10-20 |
| S08 | [OpenCode plugins (V1 documentation path)][S08] | docs | 2026-10-20 |
| S09 | [OpenCode V2 permissions][S09] | docs | 2026-10-20 |
| S10 | [Codex AGENTS.md discovery][S10] | docs | 2026-10-20 |
| S11 | [Codex / ChatGPT skill authoring][S11] | docs | 2026-10-20 |
| S12 | [Codex agent approvals and security][S12] | docs | 2026-10-20 |
| S13 | [Cursor Rules / MDC][S13] | docs | 2026-10-20 |
| S14 | [Cursor agent security][S14] | docs | 2026-10-20 |
| S15 | [Roo Code custom modes][S15] | docs | 2026-10-20 |
| S16 | [Roo Code auto-approval][S16] | docs | 2026-10-20 |
| S17 | [Continue rules][S17] | docs | 2026-10-20 |
| S18 | [Continue CLI tool permissions][S18] | docs | 2026-10-20 |
| S19 | [Cascade memories and rules (Windsurf URL redirected here)][S19] | docs | 2026-10-20 |
| S20 | [Cascade workflows][S20] | docs | 2026-10-20 |
| S21 | [Cascade hooks][S21] | docs | 2026-10-20 |
| S22 | [Hermes skills system][S22] | docs | 2026-10-20 |
| S23 | [Hermes security][S23] | docs | 2026-10-20 |
| S24 | [Antigravity rules][S24] | docs | 2026-10-20 |
| S25 | [Antigravity permissions][S25] | docs | 2026-10-20 |
| S26 | [Antigravity artifact review][S26] | docs | 2026-10-20 |
| S27 | [Gemini CLI policy engine][S27] | docs | 2026-10-20 |
| S28 | [Gemini CLI sandboxing][S28] | docs | 2026-10-20 |
| S29 | [Gemini CLI GEMINI.md context][S29] | docs | 2026-10-20 |
| S30 | [GitHub Copilot custom instructions][S30] | docs | 2026-10-20 |
| S31 | [GitHub Copilot firewall and limitations][S31] | docs | 2026-10-20 |
| S32 | [Cline rules][S32] | docs | 2026-10-20 |
| S33 | [Cline Plan and Act][S33] | docs | 2026-10-20 |
| S34 | [Cline auto-approval][S34] | docs | 2026-10-20 |
| S35 | [Aider conventions][S35] | docs | 2026-10-20 |
| S36 | [Aider Git integration][S36] | docs | 2026-10-20 |
| S37 | [Aider linting and testing][S37] | docs | 2026-10-20 |
| S38 | [LangGraph interrupts and replay caveats][S38] | docs | 2026-10-20 |
| S39 | [Deep Agents overview][S39] | docs | 2026-10-20 |
| S40 | [Pydantic AI deferred tools and approval trust boundary][S40] | docs | 2026-10-20 |
| S41 | [Pydantic AI Harness Approval Reviewer][S41] | docs | 2026-10-20 |
| S42 | [Archestra guardrails / OpenAPPA][S42] | docs | 2026-10-20 |
| S43 | [Archestra upstream README / Docker quickstart][S43] | repo | 2026-10-20 |
| S44 | [AI SDK v7 tool calling and approval][S44] | docs | 2026-10-20 |
| S45 | [Superpowers upstream README][S45] | repo | 2026-10-20 |
| S46 | [Spec Kit upstream README][S46] | repo | 2026-10-20 |
| S47 | [BMad Method upstream README / release-line caveat][S47] | repo | 2026-10-20 |
| S48 | [OpenSpec upstream README][S48] | repo | 2026-10-20 |
| S49 | [Archived GSD repository and successor notice][S49] | repo | 2026-10-20 |
| S50 | [GSD Core upstream README][S50] | repo | 2026-10-20 |
| S51 | [Awesome Cursor Rules upstream collection][S51] | repo | 2026-10-20 |
| S52 | [Archived agent-rules and successor notice][S52] | repo | 2026-10-20 |
| S53 | [Anthropic skill examples and license/testing caveats][S53] | repo | 2026-10-20 |
| S54 | [Cookiecutter hooks][S54] | docs | 2026-10-20 |
| S55 | [Copier template updates and conflicts][S55] | docs | 2026-10-20 |
| S56 | [create-next-app options, including AGENTS.md][S56] | docs | 2026-10-20 |
| S57 | [Gloaguen et al. — Evaluating AGENTS.md, arXiv:2602.11988v3, 2026-09-29][S57] | paper | 2026-10-20 |
| S58 | [Lulla et al. — On the Impact of AGENTS.md, arXiv:2601.20404v2, 2026-03-30][S58] | paper | 2026-10-20 |
| S59 | [Anthropic — Effective harnesses for long-running agents, 2025-11-26][S59] | blog / engineering case study | 2026-10-20 |
| S60 | [OpenAI skills catalog README][S60] | repo | 2026-10-20 |
| S61 | [Pydantic AI overview and harness entry point][S61] | docs | 2026-10-20 |
| S62 | [Awesome AGENTS.md upstream README (example, adoption not assessed)][S62] | repo | 2026-10-20 |
| S63 | [Agent Scripts upstream README][S63] | repo | 2026-10-20 |
| S64 | [Continue IDE Agent/Plan quickstart][S64] | docs | 2026-10-20 |

[S01]: https://agents.md/
[S02]: https://agentskills.io/specification
[S03]: https://code.claude.com/docs/en/skills
[S04]: https://code.claude.com/docs/en/hooks
[S05]: https://code.claude.com/docs/en/sandboxing
[S06]: https://code.claude.com/docs/en/output-styles
[S07]: https://opencode.ai/docs/rules/
[S08]: https://opencode.ai/docs/plugins/
[S09]: https://opencode.ai/v2/docs/permissions
[S10]: https://learn.chatgpt.com/docs/agent-configuration/agents-md
[S11]: https://learn.chatgpt.com/docs/build-skills
[S12]: https://learn.chatgpt.com/docs/agent-approvals-security
[S13]: https://cursor.com/docs/rules
[S14]: https://cursor.com/docs/agent/security
[S15]: https://roocodeinc.github.io/Roo-Code/features/custom-modes/
[S16]: https://roocodeinc.github.io/Roo-Code/features/auto-approving-actions/
[S17]: https://docs.continue.dev/customize/rules
[S18]: https://docs.continue.dev/cli/tool-permissions
[S19]: https://docs.devin.ai/desktop/cascade/memories
[S20]: https://docs.devin.ai/desktop/cascade/workflows
[S21]: https://docs.devin.ai/desktop/cascade/hooks
[S22]: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/
[S23]: https://hermes-agent.nousresearch.com/docs/user-guide/security
[S24]: https://www.antigravity.google/docs/rules/
[S25]: https://www.antigravity.google/docs/permissions/
[S26]: https://antigravity.google/docs/artifact-review
[S27]: https://geminicli.com/docs/reference/policy-engine/
[S28]: https://geminicli.com/docs/cli/sandbox/
[S29]: https://geminicli.com/docs/cli/gemini-md/
[S30]: https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions
[S31]: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-the-firewall
[S32]: https://docs.cline.bot/customization/cline-rules
[S33]: https://docs.cline.bot/core-workflows/plan-and-act
[S34]: https://docs.cline.bot/features/auto-approve
[S35]: https://aider.chat/docs/usage/conventions.html
[S36]: https://aider.chat/docs/git.html
[S37]: https://aider.chat/docs/usage/lint-test.html
[S38]: https://docs.langchain.com/oss/python/langgraph/interrupts
[S39]: https://docs.langchain.com/oss/python/deepagents/overview
[S40]: https://pydantic.dev/docs/ai/tools-toolsets/deferred-tools/
[S41]: https://pydantic.dev/docs/ai/harness/approval-reviewer/
[S42]: https://archestra.ai/docs/agents/guardrails
[S43]: https://raw.githubusercontent.com/archestra-ai/archestra/main/README.md
[S44]: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
[S45]: https://raw.githubusercontent.com/obra/superpowers/main/README.md
[S46]: https://raw.githubusercontent.com/github/spec-kit/main/README.md
[S47]: https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/README.md
[S48]: https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/README.md
[S49]: https://github.com/gsd-build/get-shit-done
[S50]: https://raw.githubusercontent.com/open-gsd/gsd-core/main/README.md
[S51]: https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/README.md
[S52]: https://github.com/steipete/agent-rules
[S53]: https://raw.githubusercontent.com/anthropics/skills/main/README.md
[S54]: https://cookiecutter.readthedocs.io/en/stable/advanced/hooks.html
[S55]: https://copier.readthedocs.io/en/stable/updating/
[S56]: https://nextjs.org/docs/app/api-reference/cli/create-next-app
[S57]: https://arxiv.org/abs/2602.11988v3
[S58]: https://arxiv.org/abs/2601.20404v2
[S59]: https://www.anthropic.com/research/effective-harnesses-for-long-running-agents
[S60]: https://raw.githubusercontent.com/openai/skills/main/README.md
[S61]: https://pydantic.dev/docs/ai/overview/
[S62]: https://raw.githubusercontent.com/khasky/awesome-agents-md/main/README.md
[S63]: https://raw.githubusercontent.com/steipete/agent-scripts/main/README.md
[S64]: https://docs.continue.dev/ide-extensions/agent/quick-start

## Implications for vibe-fence

These are **`contested` design proposals** derived from the survey, not implemented features or measured benefits. “Copy” means adapt the pattern with appropriate licensing and validation.

1. **Copy — a small portable core, with generated runtime adapters.** Keep concise repository facts and reusable skills as the shared content. Generate host-native files only after identifying its loader, schema, and activation rules. Preserve existing user guidance and show an installation diff. Acceptance: a sample project loads the intended instructions in each supported host. [S02][S10][S13][S24]

2. **Invent — an explicit capability record for every adapter.** Record runtime/version, OS, active agent, instruction discovery, pre-action interception, shell isolation, network controls, MCP coverage, and available verification commands. Label each protection enforced, advisory, unavailable, or unverified. An unknown version should never inherit an untested safety claim. [S05][S09][S12][S19][S25]

3. **Avoid — advertising prompt text as security enforcement.** Convert objectively checkable requirements into executable validators and runtime policy. Secret scanning, dependency checks, and application authorization tests need explicit integration and recorded results. A blocked file-read tool must not be advertised as preventing equivalent shell access unless that boundary was tested. [S05][S09][S14][S34]

4. **Copy — inspectable loading and activation diagnostics.** Add an installer/doctor check that reports which instructions and skills load, where they came from, and whether conflicts or unsupported metadata exist. Test startup, directory changes, and context compaction. This directly addresses silent rule omissions and lifecycle differences. [S10][S13][S24][S29][S45]

5. **Invent — the structured remediation queue as the companion's main work surface.** Each item should hold evidence, user-visible impact, severity, proposed fix, bounded plan, action owner, state, verification result, and recovery limits. Let the agent repair routine issues and attach evidence before resolving them. This combines explicit pending-action state with concrete post-edit checks; it is not a claim that no competitor has an issue queue. [S38][S40][S37]

6. **Copy — explanations as a separate control from permissions.** Adapt the Explanatory-style pattern into maximum/medium/minimum/silent presentation levels. Keep required action information available at every level. For non-coders, avoid requiring unfinished human-written code as the default teaching mechanism. [S06]

7. **Invent — bounded turbo with unchanged safety boundaries.** Define turbo as permission to finish a specified set of routine tasks within cost/time/scope limits. It should not map to a host setting that disables isolation or overrides all tool rules. Show the expanded work scope, not a confusing bundle of authority changes. [S18][S25][S34]

8. **Copy — planning proportional to the change.** Use a short acceptance checklist for a small fix, a bounded change proposal for a feature, and deeper review for consequential architecture/data changes. Review user-visible outcomes, with the agent supplying the technical recommendation and rationale. [S46][S47][S48]

9. **Copy — persistent progress plus independently checkable completion.** Save task state and recoverable local changes across sessions. Require actual check results or demonstrated acceptance scenarios before marking an item done. Distinguish Git/file recovery from undoing a deployment, database mutation, or external message. [S36][S38][S59]

10. **Copy — durable, action-specific approvals.** Persist a pending action's identity and arguments, bind approval to that action, and invalidate it if the action materially changes. Put irreversible side effects after authorization and make retries safe. Keep backend authorization independent of client-submitted approval/history. [S38][S40]

11. **Avoid — incomplete interception claims.** Pre-action hooks, post-action checks, gateways, shell sandboxes, and provider-run tools must appear as separate coverage entries. A hook that notices a secret after transmission has not prevented transmission; a gateway cannot be assumed to cover a direct local tool. [S21][S31][S42][S44]

12. **Copy — deterministic scaffolding and respectful upgrades.** Borrow template provenance and update/conflict detection. Back up harness-owned generated files, preserve hand edits, and make uninstall remove only identified harness-owned material. Detect pre-existing generated AGENTS.md content before adding another authority source. [S55][S56]

13. **Avoid — importing every popular rule/skill pack wholesale.** Select minimal, relevant modules; inspect scripts, licenses, provenance, and release line; pin versions for reproducible evaluation. Catalog presence, repository stars, and confident README claims are not security or usefulness evidence. [S47][S51][S53][S60][S63]

14. **Invent — an evaluation that separates advice from enforcement and teaching.** Compare no harness, instructions only, instructions plus executable controls, and the same controls plus the companion UX on matched tasks/models. Measure task success, planted-secret exposure in harmless fixtures, unsafe-action attempts, false blocks, repair success, cost/latency, and novice comprehension. The conflicting AGENTS.md findings make ablation necessary; neither study establishes vibe-fence's intended safety benefit. [S57][S58]

15. **Invent — an honest staged portability promise for Phase 1.** Start with a small set of audited adapters; Codex and Claude Code are reasonable candidates because their documented boundaries are explicit. Add OpenCode with separate V1/V2 handling and test other hosts before promoting them from advisory support. Keep the planned “any agent” vision while publishing what is actually enforced today. This is a proposed implementation order, not a measured ranking. [S04][S05][S09][S12]

