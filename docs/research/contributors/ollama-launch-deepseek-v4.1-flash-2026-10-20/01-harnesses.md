# Stream 01 — Existing Harnesses

- **Model:** deepseek-v4.1-flash
- **Provider:** Hermes desktop app via ollama-launch (`deepseek-v4.1-flash:1017-cloud`)
- **Date:** 2026-10-20
- **Stream:** 01 — Existing Harnesses (agent skills/plugins, rule files, framework harnesses, scaffolders)

---

## Thesis

The market does not have "harnesses" in the singular. It has **three tiers of enforceability**, and almost everything shipped sits in the weakest tier:

| Tier | Surface | Can it *stop* the agent? | Who ships it |
|---|---|---|---|
| **T1 — Context files** | `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursorrules` | **No.** Advisory text injected into the prompt | Every tool, all of them |
| **T2 — Rules / skills / commands** | `.cursor/rules/*.mdc`, `SKILL.md`, Roo modes, `.clinerules`, Continue rules | **No.** Better-targeted text, sometimes lazily loaded | Most tools |
| **T3 — Hooks / plugins / MCP** | `.claude/settings.json` hooks, `.cursor/hooks.json`, `.github/hooks/*.json`, OpenCode plugins, MCP servers | **Yes.** Code runs at lifecycle events and can deny | Some tools, unevenly |

Two consequences follow, and they shape every implication in this file.

First, **a text harness is not a fence.** If vibe-fence ships only an `AGENTS.md` and a set of skills, it is a very good suggestion engine with a safety story it cannot keep. The enforcement has to come from T3 adapters where they exist, and from an out-of-band sandbox/CLI where they don't.

Second, **the empirical record says T1 is failing at exactly vibe-fence's core concern.** The first large-scale study of agent context files — 2,303 files across 1,925 repositories — found that developers write test procedures (75.9%), implementation details (70.8%) and architecture (68.1%) into these files, but mention **security in only 14.8%** and performance in 14.5%. The authors' own conclusion: context files make agents *functional* while providing "few guardrails to ensure that agent-written code is secure or performant" ([S-01]). vibe-fence's premise is that non-technical users cannot supply those guardrails themselves; the field's own data says nobody else is supplying them either.

---

## 1. The taxonomy: eight mechanisms, five tools

### H-01 — An academic taxonomy already exists, and it is the right skeleton

- **Claim:** Repository-level configuration of agentic coding tools resolves into eight mechanisms — **Context Files, Skills, Subagents, Commands, Rules, Settings, Hooks, MCP servers** — derived from the documented behaviour of Claude Code, GitHub Copilot, Cursor CLI, Gemini CLI and Codex CLI. Some mechanisms exist in all five tools; others are single-vendor.
- **Evidence:** *Configuring Agentic AI Coding Tools: An Exploratory Study*, arXiv:2602.14690v4 — https://arxiv.org/html/2602.14690v4 (accessed 2026-10-20).
- **Strength:** `proven` (systematic documentation study, explicit method).
- **Fit for vibe-fence:** Adopt this taxonomy verbatim in `src/adapters/` and in the project docs. It is the cheapest way to prove coverage claims ("supports 6 of 8 mechanisms across 5 runtimes") and it maps cleanly onto the T1/T2/T3 ladder above: Context Files + Rules = T1/T2; Skills + Commands + Subagents = T2; Hooks + Settings + MCP = T3.

### H-02 — Hook support is not universal, and the biggest CLI is missing it

- **Claim:** The enforcement tier is unevenly distributed. In the study's comparison table, hooks exist for Claude Code (`.claude/settings.json`), GitHub Copilot (`.github/hooks/*.json`), Cursor (`.cursor/hooks.json`) and Gemini CLI (`.gemini/settings.json`) — and are marked **not available** for Codex CLI at the time of checking.
- **Evidence:** Table 1 in arXiv:2602.14690v4 — https://arxiv.org/html/2602.14690v4 (accessed 2026-10-20).
- **Strength:** `practiced` (documentation snapshot; the study is honest that availability changes).
- **Fit for vibe-fence:** The adapter matrix must be **per-mechanism, not per-agent**. A runtime without hooks gets: text harness + sandbox wrapper + post-hoc review; it must not get a UI that claims gating. Publish the matrix; a fence that overstates coverage on one runtime loses the trust argument everywhere (see stream 05, A-04).

### H-03 — Multi-runtime coverage has converged on one file, not one framework

- **Claim:** The de facto interoperability layer is a Markdown file with a conventional name, not a plugin API. `AGENTS.md` is listed as supported by roughly twenty tools and vendors — OpenAI Codex, Jules, Factory, Aider, goose, OpenCode, Zed, Warp, VS Code, Amp, Cursor, RooCode, Gemini CLI, Kilo Code, Semgrep, GitHub Copilot's coding agent, Ona, Windsurf and Augment Code among them — and was developed collaboratively by Codex, Amp, Jules, Cursor and Factory.
- **Evidence:** https://agents.md/index (accessed 2026-10-20). A blog estimate puts adoption at ~60,000 repositories by April 2026 — https://agentmarketcap.ai/blog/2026/04/17/agents-md-60k-adoption-aaif-donation-standards-floor (accessed 2026-10-20; **unverified marketing estimate**, not peer-reviewed).
- **Strength:** `practiced` for the support list; `contested` for the adoption count.
- **Fit for vibe-fence:** `AGENTS.md` is the correct **distribution** format and the wrong **enforcement** format. Ship it as the portable core (it is the only thing that works on all runtimes on day one) and treat everything else as adapter-specific upgrades.

### H-04 — Nested context files exist, and precedence is vendor-defined

- **Claim:** Context files compose hierarchically, with more specific winning. Cursor documents root plus per-directory `AGENTS.md` ("instructions from nested AGENTS.md files are combined with parent directories, with more specific instructions taking precedence"); Claude Code uses `CLAUDE.md`; Codex uses `AGENTS.md` plus `AGENTS.override.md`.
- **Evidence:** https://cursor.com/docs/rules.md; https://agents.md/index; Table 1, arXiv:2602.14690v4 (all accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Put **global policy in the root file and project-specific policy in nested files**, and never split one rule across two levels — precedence bugs are invisible to the user and produce "the fence said X but the agent did Y." The fence's own state (dial, queue) must not live in context files at all; it belongs in `.fence/state/` (stream 05, Q-05).

---

## 2. Tier 1 — context files (`AGENTS.md`, `CLAUDE.md`, Copilot instructions)

### H-05 — What developers actually put in these files (and what they omit)

- **Claim:** The first large-scale empirical study of agent context files finds they are "complex, difficult-to-read artifacts that evolve like configuration code through frequent, small additions," not stable documentation. Content analysis across 16 instruction types shows a functional bias and a **security hole**.
- **Evidence:** Chatlatanagulchai et al., *Agent READMEs: An Empirical Study of Context Files for Agentic Coding*, arXiv:2511.12884v2 (submitted 2025-11-17, revised 2026-08-09) — https://arxiv.org/abs/2511.12884 (accessed 2026-10-20). Corpus: **2,303 context files from 1,925 repositories**. Top instruction types: test procedures **75.9%**, implementation details **70.8%**, architecture **68.1%**; security **14.8%**, performance **14.5%**.
- **Strength:** `proven` (large corpus, explicit method, MSR-style study).
- **Fit for vibe-fence:** This is the market gap in one table. Do not ship a generic "write good instructions" skill — ship the **non-functional** section that 85% of repositories never write: secrets handling, dependency policy, auth defaults, deploy gates. It is the differentiator *and* the thing the evidence says is missing.

### H-06 — There is no canonical structure for these files yet

- **Claim:** Across 466 open-source projects, AGENTS.md content varies wildly in form — descriptive, prescriptive, prohibitive, explanatory, conditional — and "there is no established content structure yet." The paper's stated opportunity is that these files are a natural laboratory for context engineering.
- **Evidence:** Mohsenimofidi, Galster, Treude & Baltes, *Context Engineering for AI Agents in Open-Source Software*, arXiv:2510.21413v4, MSR 2026 — https://arxiv.org/abs/2510.21413 (accessed 2026-10-20).
- **Strength:** `proven` (preliminary study, n=466).
- **Fit for vibe-fence:** Because there is no convention, **vibe-fence can set one** — a fixed, short section order (What this project is → How to run it → What must never happen → Where things live). Setting the convention is a defensible contribution; matching an existing convention is not possible, because there isn't one.

### H-07 — Install friction for T1 is zero, which is why it won

- **Claim:** A context file requires no install, no binary, no config schema — it is a file in a repository, and the tool picks it up automatically each session. That is the entire reason it spread across twenty tools while plugin APIs did not.
- **Evidence:** https://agents.md/index ("one AGENTS.md works across many agents"); Cursor: "Rules provide persistent, reusable context at the prompt level… included at the start of the model context" — https://cursor.com/docs/rules.md (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** `npx vibe-fence init` must produce a working T1 artifact in one run, with **no runtime selection prompt** — detect the runtimes present (`.claude/`, `.cursor/`, `.codex/`, `opencode.json`, `.github/`) and write all applicable files. Selection prompts are the onboarding tax the category leaders avoid (stream 05, O-01).

### H-08 — Copilot splits repository-wide from path-specific instructions

- **Claim:** GitHub's model is two-level: `copilot-instructions.md` in `.github/` applies to all requests in the repository; `NAME.instructions.md` files inside `.github/instructions/` apply only to matching paths.
- **Evidence:** https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Mirror it: one root policy file plus path-scoped files generated from the project map (e.g. `src/api/**` gets auth/validation rules, `src/ui/**` gets accessibility rules). Path scoping is the cheapest way to keep the always-loaded context small (stream 02).

---

## 3. Tier 2 — rules, skills, commands, modes

### H-09 — Cursor's rule system is the most developed T2 surface

- **Claim:** Cursor supports four rule types; project rules live in `.cursor/rules`, are version-controlled, and can bundle prompts and scripts. Rules are injected at the start of the model context, and importing third-party rules requires packaging them as a plugin with a `.cursor-plugin/marketplace.json`.
- **Evidence:** https://cursor.com/docs/rules.md (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Adopting `.cursor/rules` gains reach but **locks distribution behind Cursor's plugin marketplace** for sharing. Do not make the marketplace the primary channel; generate rules locally from the portable skill definitions so there is one source of truth (`src/skills/` → adapter output), which is exactly the `src → dist` build the plan already specifies.

### H-10 — Skills are the first serious attempt at *progressive* context

- **Claim:** Anthropic's Agent Skills package domain expertise as a directory (`SKILL.md` plus supporting docs and scripts) and are accessed **progressively** — the agent sees metadata first and pulls in the body and files only when relevant. The stated motivation is that general capability is not expertise: "skills package domain expertise and procedural knowledge for agents."
- **Evidence:** *Building agents with Skills: Equipping agents for specialized work* — https://claude.com/resources/articles/building-agents-with-skills-equipping-agents-for-specialized-work; SDK docs — https://code.claude.com/docs/en/agent-sdk/skills; mechanism breakdown (scripts/, references/ layout) in §6.2 of arXiv:2602.14690v4 (all accessed 2026-10-20).
- **Strength:** `practiced` (shipping product) — the *benefit* of progressive loading is asserted by the vendor and is `contested` in the literature (see stream 02).
- **Fit for vibe-fence:** This is the right container for vibe-fence's rules: one skill per guardrail family (`vibe-guard-secrets`, `vibe-guard-deps`, `vibe-plan`, `vibe-teach`) with the explanation, the check, and the fix script colocated. It also means the harness's teaching text is loaded only when relevant — which is the only way a `max` dial can be affordable (stream 05, A-07).

### H-11 — Modes are a UX harness, not a safety harness

- **Claim:** Roo Code's custom modes, Cline's rules plus workflows/commands, and Continue's rules all implement the same idea: swap a named bundle of instructions and tool permissions depending on what the user is doing (architect vs code vs debug). They change behaviour by *swapping prompts*, and none of them can deny an action.
- **Evidence:** Roo Code custom modes — https://roocodeinc.github.io/Roo-Code/features/custom-modes/; Cline rules — https://docs.cline.bot/customization/cline-rules and rules library — https://github.com/cline/clinerules; Continue rules — https://docs.continue.dev/customize/deep-dives/rules (all accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Borrow the *mode* concept for the teaching dial's presentation (a named posture the user can recognise: "we're planning" vs "we're building"), but never let a mode be the safety mechanism. Mode = prompt. Safety = hook or sandbox.

### H-12 — None of T1/T2 is user-facing

- **Claim:** Every one of these mechanisms is addressed to the agent. Nothing in the ecosystem produces a message *to the human* explaining what the agent did, why it matters, or what to do next. The entire layer is agent-facing, and the human's only interface is the agent's own narration.
- **Evidence:** Read the surfaces: Cursor rules "provide system-level instructions to Agent" — https://cursor.com/docs/rules.md; Copilot instructions "give Copilot additional context" — https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions; skills "package domain expertise… in a format agents can access" — https://claude.com/resources/articles/building-agents-with-skills-equipping-agents-for-specialized-work (all accessed 2026-10-20). The absence of a user-facing surface is an observation across all five, not a claim any single doc makes.
- **Strength:** `practiced` (structural observation).
- **Fit for vibe-fence:** This is the product thesis in one sentence: **everything in the market improves what the agent knows; nothing improves what the user understands.** vibe-fence's differentiator is the user-facing channel — the digest, the teaching card, the queue — not a better instruction file.

---

## 4. Tier 3 — hooks, plugins, MCP (the only tier that can deny)

### H-13 — Claude Code hooks are a real gate, including inside subagents

- **Claim:** Hooks fire at lifecycle points (`PreToolUse`, `PostToolUse`, and others), receive JSON on stdin, and can return a decision that blocks the tool call. They run in subagents too — when a subagent calls a tool, the same configured hooks fire and the input carries `agent_id`/`agent_type`. Handlers can be `command`, `prompt`, or experimental `agent` types; plugin hooks in `hooks/hooks.json` merge with user and project hooks; hooks can also be declared in **skill frontmatter**.
- **Evidence:** https://code.claude.com/docs/en/hooks (accessed 2026-10-20).
- **Strength:** `practiced` (documented behaviour).
- **Fit for vibe-fence:** This is the model for the whole adapter design: **policy as a hook, explanation as a skill, state in `.fence/`.** Declaring hooks in skill frontmatter is especially useful — it means the guardrail and its enforcement ship as one unit and are installed by copying a directory, not by editing a settings file the user will never open.

### H-14 — OpenCode plugins are code with lifecycle hooks, not text

- **Claim:** OpenCode plugins are JS/TS modules loaded from `.opencode/plugins/`, receiving project context (`project`, `directory`, `worktree`, `client`, and a Bun `$` shell) and returning hook implementations to intercept and modify behaviour.
- **Evidence:** https://opencode.ai/docs/plugins/ (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** OpenCode is the best second target after Claude Code: a plugin can implement the `.fence/` writer, the gate, and the digest without asking the user to edit config. It also means the *same* guardrail logic can be TypeScript in both adapters, shrinking the maintenance surface.

### H-15 — MCP is the wrong tier for guardrails (and the right one for evidence)

- **Claim:** MCP connects agents to external tools and data. It is excellent for giving the agent a verifier (run the tests, read the deploy status, query the secret scanner) and poor for blocking a filesystem write, because the policy still lives in the agent's compliance with the tool rather than in the runtime's ability to deny.
- **Evidence:** MCP is documented as a configuration mechanism across Claude, Codex, Cursor and Gemini in Table 1 of arXiv:2602.14690v4 — https://arxiv.org/html/2602.14690v4; Archestra positions itself as an "enterprise MCP platform with guardrails", i.e. policy *around* MCP servers — https://github.com/archestra-ai/archestra (both accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Use MCP for **verification and provenance** (`vibe-fence` exposes `check_secrets`, `run_tests`, `deploy_status`), not for enforcement. Enforcement stays in hooks/sandbox; MCP gives the agent the evidence it needs to fix things itself (stream 05, Q-01).

### H-16 — Framework harnesses are a different product category

- **Claim:** LangGraph, pydantic-ai, the Vercel AI SDK and Archestra are toolkits for **building** an agent. They give you graph orchestration, typed tool definitions, streaming, and (in Archestra's case) enterprise policy around MCP. They do not wrap a third-party coding agent the user already runs, and they cannot inject behaviour into Codex or Cursor.
- **Evidence:** LangGraph — https://github.com/langchain-ai/langgraph and https://docs.langchain.com/oss/python/langgraph/thinking-in-langgraph; pydantic-ai — https://pydantic.dev/docs/ai/overview/; Vercel AI SDK — https://vercel.com/docs/ai-sdk; Archestra — https://github.com/archestra-ai/archestra (all accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** **Avoid** building on these for the harness itself — vibe-fence must be runtime-agnostic and install into an existing project in one command; a framework dependency contradicts both. **Copy** one pattern: Archestra's separation of policy (central, declarative) from execution (per-tool) is the right shape for `.fence/policy.yml` + per-runtime adapters.

### H-17 — Scaffolders solve a different moment in time

- **Claim:** `create-*` scaffolders and cookiecutter-style templates decide project structure *at creation*. A harness must retrofit an existing project that a non-technical user has already vibe-coded, which is a strictly harder problem: unknown structure, no conventions, possibly no git.
- **Evidence:** The plan's own framing (`npx vibe-fence init` drops `AGENTS.md`, `.fence/` state and skills into an existing project) — `docs/PLAN.md`; the scaffolders' shape is visible in any `create-*` CLI and in the "ways to create a project" flows of the hosted builders — https://docs.lovable.dev/introduction/getting-started (accessed 2026-10-20).
- **Strength:** `practiced` / inference.
- **Fit for vibe-fence:** `init` must be **non-destructive and idempotent**: read the existing tree, write only additive files, never reorganise. Reorganising a beginner's project on first run is the single most likely way to lose them.

### H-18 — Awesome-lists are a distribution channel and a quality risk

- **Claim:** Curated `AGENTS.md` collections exist and are widely shared (e.g. `tairov/awesome-agents.md`, `Ischca/awesome-agents-md`, `khasky/awesome-agents-md`). They spread conventions fast and are unvetted by construction — a list of files that "work" is not evidence they work.
- **Evidence:** https://github.com/tairov/awesome-agents.md; https://github.com/Ischca/awesome-agents-md; https://github.com/khasky/awesome-agents-md (accessed 2026-10-20).
- **Strength:** `contested` (existence `practiced`; efficacy unmeasured).
- **Fit for vibe-fence:** Submit the *policy file format*, not a giant file. A 300-line "master AGENTS.md" is the archetype of context bloat (stream 02) and will be copied into projects where it conflicts with everything.

---

## 5. What each family actually does — the comparison the prompt asked for

| Family | Install friction | Runtime coverage | Safety behaviour | Scoping behaviour | Teaching behaviour | Failure mode for a non-technical user |
|---|---|---|---|---|---|---|
| **`AGENTS.md` / `CLAUDE.md` / `copilot-instructions.md`** | **None** — drop a file | ~20 tools | **Advisory only**; security present in 14.8% of files (S-01) | None | None (agent-facing) | User cannot tell whether it was read; nested precedence conflicts are invisible; silently truncated on long files |
| **`.cursor/rules` / `.mdc`** | Low — files, or plugin import via marketplace | Cursor only | Advisory | Globs/path scoping | None | Believes a rule is "enforced" when it is a suggestion; marketplace import adds a dependency |
| **Claude Skills (`SKILL.md`)** | Low — copy a directory | Claude Code / Agent SDK | Advisory (but can carry hook frontmatter → T3) | Procedural steps | Indirect — teaches the *agent*, not the user | Skill does not trigger because the description didn't match; user has no way to debug the trigger |
| **Roo modes / Cline rules / Continue rules** | Medium — edit config | Single tool each | Advisory + tool allowlists | Mode-level | None | Mode sprawl: user doesn't know which mode they're in, so behaviour seems random |
| **Hooks / plugins (Claude, Cursor, Copilot, Gemini, OpenCode)** | **High** — settings JSON or JS module | 4–5 tools; **not Codex** (S-02) | **Can deny** | Event-level | None | A blocking hook without a plain-language message reads as the tool being broken; a failing hook can wedge the session |
| **MCP servers** | High — auth, transport, config | Broad | Depends on the server | Tool-level | None | New tool surface to understand; auth failures are opaque |
| **Frameworks (LangGraph, pydantic-ai, AI SDK, Archestra)** | Very high — build an app | N/A (you build it) | Whatever you implement | Whatever you implement | Whatever you implement | Wrong category: requires engineering the user does not have |
| **Scaffolders** | Low | N/A | Convention by template | Template structure | None | Only works at project birth; useless on an existing vibe-coded repo |

---

## 6. Coverage gaps / what I could not establish

1. **No public comparative evaluation exists.** I found no study that measures the *behavioural* effect of any of these harness surfaces against a control (e.g. does a `PreToolUse` hook reduce secret leaks in practice?). Every effectiveness claim in this file is structural or vendor-asserted.
2. **Hook semantics differ in ways the docs don't make comparable.** Claude Code documents `PreToolUse`/`PostToolUse` with JSON decisions; Cursor and Copilot document hooks exist but I did not verify whether their hooks can *deny* a tool call or only observe it. The T3 column above therefore says "can deny" only where I read that explicitly (Claude Code).
3. **Codex hook support may have changed.** The "not available" cell is a snapshot from one study (S-02); Codex ships fast. Verify before building the adapter matrix.
4. **The ~60,000-repository AGENTS.md figure is a marketing blog**, not a measurement. The peer-reviewed-scale number is the 1,925-repository corpus in S-01.
5. **I did not evaluate Windsurf/Cascade or Antigravity in depth** — the prompt names them, but their configuration surfaces were not documented in the sources I could reach, and inventing them would be worse than omitting them. Antigravity appears in S-02's tool list only.
6. **No data on how often skills fail to trigger.** The "progressive disclosure means the skill loads only when relevant" claim implies a trigger mechanism with false negatives; nobody publishes the rate.
7. **Teaching behaviour is absent everywhere, so there is nothing to compare.** I could not find a single harness surface in any tool that is addressed to the human rather than the agent. That absence is the finding (H-12), not a gap.

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| S-01 | Chatlatanagulchai et al., *Agent READMEs: An Empirical Study of Context Files for Agentic Coding*, arXiv:2511.12884v2 — https://arxiv.org/abs/2511.12884 | paper (2,303 files / 1,925 repos) | 2026-10-20 |
| S-02 | *Configuring Agentic AI Coding Tools: An Exploratory Study*, arXiv:2602.14690v4 — https://arxiv.org/html/2602.14690v4 | paper (8 mechanisms, 5 tools) | 2026-10-20 |
| S-03 | Mohsenimofidi et al., *Context Engineering for AI Agents in Open-Source Software*, arXiv:2510.21413v4 (MSR 2026) — https://arxiv.org/abs/2510.21413 | paper (n=466) | 2026-10-20 |
| S-04 | AGENTS.md standard site — https://agents.md/index | docs | 2026-10-20 |
| S-05 | Cursor, *Rules* — https://cursor.com/docs/rules.md | docs | 2026-10-20 |
| S-06 | Claude Code, *Hooks reference* — https://code.claude.com/docs/en/hooks | docs | 2026-10-20 |
| S-07 | Anthropic, *Building agents with Skills* — https://claude.com/resources/articles/building-agents-with-skills-equipping-agents-for-specialized-work | article | 2026-10-20 |
| S-08 | Claude Code, *Agent SDK — skills* — https://code.claude.com/docs/en/agent-sdk/skills | docs | 2026-10-20 |
| S-09 | OpenCode, *Plugins* — https://opencode.ai/docs/plugins/ | docs | 2026-10-20 |
| S-10 | GitHub Docs, *Adding repository custom instructions for Copilot* — https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions | docs | 2026-10-20 |
| S-11 | Roo Code, *Customizing Modes* — https://roocodeinc.github.io/Roo-Code/features/custom-modes/ | docs | 2026-10-20 |
| S-12 | Cline, *Rules* — https://docs.cline.bot/customization/cline-rules | docs | 2026-10-20 |
| S-13 | Continue, *Rules* — https://docs.continue.dev/customize/deep-dives/rules | docs | 2026-10-20 |
| S-14 | LangGraph — https://github.com/langchain-ai/langgraph | repo | 2026-10-20 |
| S-15 | pydantic-ai — https://pydantic.dev/docs/ai/overview/ | docs | 2026-10-20 |
| S-16 | Vercel AI SDK — https://vercel.com/docs/ai-sdk | docs | 2026-10-20 |
| S-17 | Archestra — https://github.com/archestra-ai/archestra | repo | 2026-10-20 |
| S-18 | `tairov/awesome-agents.md` — https://github.com/tairov/awesome-agents.md | repo | 2026-10-20 |
| S-19 | `Ischca/awesome-agents-md` — https://github.com/Ischca/awesome-agents-md | repo | 2026-10-20 |
| S-20 | `khasky/awesome-agents-md` — https://github.com/khasky/awesome-agents-md | repo | 2026-10-20 |
| S-21 | AgentMarketCap, *AGENTS.md Hits 60,000 Repos* (blog estimate) — https://agentmarketcap.ai/blog/2026/04/17/agents-md-60k-adoption-aaif-donation-standards-floor | blog | 2026-10-20 |
| S-22 | Cline rules library — https://github.com/cline/clinerules | repo | 2026-10-20 |
| S-23 | Copilot hooks location, per Table 1 (S-02) — see S-02 | paper | 2026-10-20 |
| S-24 | Lovable, *Quick start* (project-creation flows) — https://docs.lovable.dev/introduction/getting-started | docs | 2026-10-20 |

---

## Implications for vibe-fence

1. **Copy — the eight-mechanism taxonomy as the adapter contract.** `src/adapters/<runtime>/` declares which of Context Files / Skills / Subagents / Commands / Rules / Settings / Hooks / MCP it can fill, and the capability matrix is generated from that, not hand-written (H-01).
2. **Copy — `AGENTS.md` as the portable core.** It is the only surface that works on ~20 tools with zero install. Everything else is a per-runtime upgrade (H-03, H-07).
3. **Avoid — claiming enforcement you don't have.** A runtime without hooks gets text + sandbox + post-hoc review, and the UI must say so. Overstating coverage on one runtime forfeits the trust argument on all of them (H-02, stream 05 A-04).
4. **Invent — the capability ladder in the product UI.** Three states the user can actually understand: *Advisory* (the agent was told), *Checked* (we verified after), *Gated* (it can't happen without you). Show it per rule; it is the honest version of a "safety badge."
5. **Copy — hooks where they exist, sandbox where they don't.** Claude Code, Cursor, Copilot and Gemini hooks for policy; the `vibe-fence` CLI/sandbox for runtimes like Codex that lack them (H-02, H-13).
6. **Copy — hooks declared in skill frontmatter.** Shipping guardrail + enforcement in one directory is the only install story a non-technical user can complete without editing JSON (H-13).
7. **Copy — OpenCode plugin as the second adapter.** TypeScript in both adapters means one implementation of the guardrail logic, two thin wiring layers (H-14).
8. **Copy — path-scoped rules.** Root policy plus `src/api/**` and `src/ui/**` scoped files, generated from the project map, to keep always-loaded context small (H-08, stream 02).
9. **Invent — the non-functional section as a product feature.** 85% of context files omit security entirely (H-05). Ship a fixed, short section order with the non-functional block pre-filled from the project's actual stack — that is both the gap and the demo.
10. **Copy — one skill per guardrail family**, with explanation + check + fix script colocated (H-10, stream 05 Q-01).
11. **Avoid — the plugin marketplace as the distribution channel.** Generate adapters locally from `src/skills/`; marketplace import adds a dependency and a review queue (H-09).
12. **Avoid — framework dependencies (LangGraph, pydantic-ai, AI SDK) in the harness itself.** Copy Archestra's policy/execution separation instead (H-16).
13. **Copy — non-destructive, idempotent `init`.** Additive files only; never reorganise an existing vibe-coded project on first run (H-17).
14. **Copy — MCP for verification, not enforcement.** Expose `check_secrets`, `run_tests`, `deploy_status` so the agent can fix its own findings (H-15, stream 05 Q-06).
15. **Avoid — the "master AGENTS.md" pattern.** Ship a format and a validator, not a 300-line file that will be pasted into projects where it conflicts (H-18, stream 02).
16. **Invent — the user-facing channel.** Nothing in the ecosystem speaks to the human (H-12). The digest, the teaching card and the queue are the product; the instruction file is plumbing.
17. **Set the convention** for context-file structure while no convention exists (H-06): *What this is → How to run it → What must never happen → Where things live*. Four headings, enforced by `vibe-fence validate`.
18. **Build the adapter matrix before the adapters.** Verify Codex hook support at implementation time (it may have shipped since S-02), then freeze the per-runtime coverage table — it determines what the demo can honestly claim.
19. **Measure one thing the field hasn't:** whether a Gated rule actually prevents the action, per runtime. A hook that returns allow for every call looks identical to a working fence from the outside; log verdicts and assert against a small adversarial suite.
20. **Defer to synthesis:** whether vibe-fence should ship its own thin agent (via a framework) for runtimes with no T3 surface, or require the user to have a hook-capable runtime. This is an architectural fork with real cost, and the evidence does not decide it.
