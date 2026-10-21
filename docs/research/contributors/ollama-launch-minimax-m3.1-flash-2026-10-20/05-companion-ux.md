# Stream 05 — Companion UX: Teaching Dial, Turbo, Issue Queue, Onboarding

- **Model:** minimax-m3.1-flash
- **Provider:** ollama-launch (Hermes Agent)
- **Date:** 2026-10-20
- **Stream:** 05 — Companion UX (Teaching Dial, Turbo, Issue Queue, Anti-patterns, Onboarding)

---

## 0. Framing: the tension this stream has to resolve

vibe-fence's promise is a *companion* to a non-technical vibe-coder. Two claims in the brief are in direct
tension and the whole stream is really about where that tension breaks:

- "Teach without nagging" → the user wants explanations.
- "The user doesn't decide on security — they're informed the harness has their back" → the user does *not*
  want to decide on most things.

Research on AI assistance keeps finding that adding explanation **does not reliably reduce overreliance and
may increase it** [13], that over-advising drives disengagement [8], and that non-technical users systematically
misread AI output when they are given more of it rather than less [14]. The naive design — "teach more, be
verbose, show every reasoning step" — is not just annoying, it is *measurably harmful to correctness*.

So the dial cannot be a verbosity slider. It has to be a switch between **different cognitive modes**, and
the turbo contract cannot be a boolean. The rest of this file works out what those two contracts look like.

---

## 1. Teaching Dial (`max` → `medium` → `min` → `silent`)

### T-01 — The dial is a scaffolding fade, and the fade must be *earned*, not defaulted

- **Claim:** Instructional scaffolding — temporary support withdrawn as competence grows — is the established
  learning-science model for exactly this dial. A meta-analysis of 64 effect sizes across 18 studies found a
  large, statistically significant positive effect of scaffolding on learning outcomes in online higher
  education, with the metacognitive domain yielding a larger effect size than the affective and cognitive
  domains [17]. The canonical bike-seat metaphor is the same: hold on, alternate, then let go.
- **Evidence:** Doo, Bonk & Heo, "A Meta-Analysis of Scaffolding Effects in Online Learning in Higher Education,"
  *International Review of Research in Open and Distributed Learning* 21(3), 2020 — https://files.eric.ed.gov/fulltext/EJ1267049.pdf (accessed 2026-10-20)
- **Strength:** `proven` (meta-analytic)
- **Fit for vibe-fence:** The dial levels are fade stages. Critically, scaffolding research says the *fading
  schedule* is the active ingredient, not the support level. A user pinned at `max` forever is not taught, they
  are *carried*. The harness must therefore track a **fade signal** (see T-04) and propose the step down, rather
  than requiring the user to discover the dial. Default for a new project: `max`. Propose `medium` after N
  consecutive verified successes on the same class of task.

### T-02 — The dial must be per-task-class, not per-user

- **Claim:** Progressive disclosure improves learnability, efficiency and error rate **by splitting the option
  set correctly** — "you have to get the right split between initial and secondary features." There is no
  single "advanced" level; there are many, and each is populated by frequency-of-use and task analysis. The same
  page can have three disclosure levels, and tertiary levels exist for options that are "so specialized or rare."
- **Evidence:** Nielsen Norman Group, "Progressive Disclosure" (updated 2022-07-15) — https://www.nngroup.com/articles/progressive-disclosure/ (accessed 2026-10-20)
- **Strength:** `practiced` (long-standing UX guideline, empirically grounded but not a controlled trial)
- **Fit for vibe-fence:** A single global verbosity setting is the wrong shape. `max` for "installing a database"
  and `min` for "renaming a label" can coexist. The dial must be **per task-class**, and the harness should
  answer "how much does this user need explained *for this kind of task*" — not "how chatty is this user today."

### T-03 — Verbosity is the wrong axis. Use *structure* + *cognitive forcing*, not length.

- **Claim:** Two independent results converge on this. (a) Spatially structuring an LLM's explanation text into
  defined contextual components **reduced users' time-to-action and cognitive load** compared to unstructured
  explanations; always-on structured explanations increased acceptance of AI recommendations. (b) The
  "glanceable explanation" literature explicitly frames the problem as LLM *verbosity* making delivery hard on
  small surfaces — and the fix is spatial structure, not truncation. (c) Separately, Buçinca et al. found that
  adding explanations to AI decisions **does not appear to reduce overreliance, and some studies suggest it might
  even increase it**; what *did* work were cognitive forcing interventions that compel people to engage
  thoughtfully with the AI's output.
- **Evidence:** Wang et al., "Less or More: Towards Glanceable Explanations for LLM Recommendations Using
  Ultra-Small Devices," *IUI '25* — https://arxiv.org/html/2502.19410v1 (accessed 2026-10-20); Buçinca, Malaya &
  Gajos, "To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-assisted
  Decision-making," *PACM HCI* 5(CSCW1), N=199, DOI 10.1145/3449287 — https://arxiv.org/abs/2102.09692 (accessed
  2026-10-20); van Merriënboer & Sluijsmans, "Toward a Synthesis of Cognitive Load Theory, Four-Component
  Instructional Design, and Self-Directed Learning," *Educ. Psych. Review* — https://sluijsmans.net/wp-content/uploads/2019/01/EPR_2009_21_55-66.pdf (accessed 2026-10-20)
- **Strength:** `proven` for the cognitive-forcing half (N=199 controlled experiment); `practiced` for the
  structured-explanation half (user study, IUI '25)
- **Fit for vibe-fence:** **This is the single most important finding for the dial.** "max" should NOT mean
  "longer prose." It should mean:
  - structured blocks with a fixed schema (e.g. `What I'm doing` / `Why` / `What you can change` / `Risk`),
  - a **cognitive forcing** moment at decisions with real trade-offs — a forced choice between options with
    named trade-offs, rather than a paragraph asserting the agent already decided.
  - **Avoid:** a long narration of what the agent is doing. Claude Code's own docs note that the Concise style
    "leads with the result and leaves out preamble, narration, and recaps" [2] — narration is the single
    largest waste of a non-technical user's attention. The same effect appears in the instructional-design
    literature: van Merriënboer & Sluijsmans's synthesis of cognitive load theory and four-component
    instructional design makes the *self-directed* path work only when the learner performs the task, assesses
    their own performance, and selects future tasks — a narrated transcript of the agent's reasoning supports
    none of those three [6].
  - Caveat: Buçinca et al. found the designs that *most* reduced overreliance received the *least favorable*
    subjective ratings, and benefited participants higher in Need for Cognition more. **The intervention that
    actually protects correctness is the one users will like least.** vibe-fence must accept that trade and
    not tune the dial toward "users love it."

### T-04 — Silence and "when not to help" is a first-class design goal, not an absence of one

- **Claim:** Steyvers & Mayer formalize the "when to help" problem as a POMDP over the user's latent cognitive
  state, and show that **overly frequent or contextually redundant assistance causes users to disengage**,
  undermining the long-term benefit of AI assistance. Their adaptive strategy significantly outperforms both
  "always assist" and "never assist" baselines. Critically, the framework's cost of over-advising emerges
  *naturally* from disengagement rather than being hand-coded.
- **Evidence:** Steyvers & Mayer, "When not to help: planning for lasting human-AI collaboration," arXiv:2508.01837
  — https://www.arxiv.org/pdf/2508.01837 (accessed 2026-10-20)
- **Strength:** `proven` (formally specified + simulation-validated; not a field trial)
- **Fit for vibe-fence:** `silent` is not a verbosity setting — it is a *policy*. The harness needs a
  **teaching budget** analogous to Steyvers' utility: an explanation is issued when its expected value exceeds
  a cost that includes the risk of teaching the user to ignore explanations. Every teaching moment spends from
  a budget; a user who repeatedly dismisses explanations should have the budget automatically lowered, not
  manually. This is the mechanistic version of "the teaching dial fades."

### T-05 — The dial's "max" level must include *retrieval*, not just exposition

- **Claim:** Learners consume LLM scaffolding passively; the ICAP framework places that at the bottom of the
  engagement hierarchy. A within-subjects study (N=8) of interactive vs. static LLM scaffolding found that
  lightweight interaction (masked content the learner must actively reveal) increased perceived engagement and
  attentional focus and supported short-term learning. Separately, HypoCompass — where novice students act as
  the *teaching assistant* debugging LLM-generated code — improved students' pre-to-post debugging performance
  by 12% and cut completion time by 14%, by offloading code completion while keeping hypothesis construction
  with the human.
- **Evidence:** "Exploring Interactive LLM Scaffolding to Support Learning," arXiv:2603.07277 —
  https://arxiv.org/pdf/2603.07277 (accessed 2026-10-20); Qian et al., "How to Teach Programming in the AI
  Era? Using LLMs as a Teachable Agent for Debugging," arXiv:2310.05292v4, DOI 10.1145/3717057 —
  https://arxiv.org/html/2310.05292v4 (accessed 2026-10-20)
- **Strength:** `practiced` (both are controlled studies but small-N; the second is N=19 novices)
- **Fit for vibe-fence:** `max` should include a *small* teachable-agent move: at a decision with a real
  trade-off, the harness asks the user to pick (with the options named), then explains the consequence. Not at
  every step — that becomes homework. Claude Code's `Learning` output style is the shipping precedent for
  exactly this shape: it handles routine implementation itself, but at a piece with a real design decision it
  leaves a `TODO(human)` marker and hands over a scoped task with guidance, then waits [2].
  **Do not** copy this at full intensity for a non-technical user — the HipoCompass result is about *learners*,
  and vibe-fence's user may have no intent to become a developer.

### T-06 — The dial must not be the only control surface: output style is read at session start

- **Claim:** Claude Code ships four built-in output styles that are a direct precedent for a dial:
  **Proactive** (starts work right away, makes reasonable assumptions rather than asking about routine decisions),
  **Concise** (leads with the result, leaves out preamble/narration/recaps), **Explanatory** (adds short
  `Insight` blocks explaining the choices behind the code), and **Learning** (Explains + leaves pieces of code
  for you to write). Critically, Concise "still writes at full length" for anything the user asks about and
  **"anything you need in order to act safely" — error reports, failing test output, security warnings, and
  confirmations for destructive actions keep their complete content.** The style's instructions are sent with
  every request, and are read at session start (changing mid-session requires a new session).
- **Evidence:** Claude Code Docs, "Output styles" — https://code.claude.com/docs/en/output-styles (accessed 2026-10-20)
- **Strength:** `practiced` (shipping product behavior, not an evaluated intervention)
- **Fit for vibe-fence:** Two rules to copy directly:
  1. **Safety content is exempt from every dial level.** Warnings, destructive-action confirmations, failing
     test output, and secret exposure never get compressed. This is the clearest precedent for "the user is
     informed the harness has their back."
  2. The dial changes *how the agent works*, not just how it narrates. `Proactive` (assume, don't ask) is
     orthogonal to `Concise` (narrate less) — vibe-fence's dial should likewise be a single knob on
     *explanation*, and a separate knob on *autonomy*, with the turbo contract below owning the second.
  Also note the **read-at-start** behavior: vibe-fence should apply the dial to the whole session, not
  toggle mid-flight, or the agent's behavior becomes incoherent mid-task.

### T-07 — Expertise paradox: novices over-rely, experts under-rely. The dial must be auto-selected, and the auto-selection must be visible.

- **Claim:** A synthesis of automation psychology, human factors, HCI and philosophy of technology finds that
  learners exhibit **dual trust calibration failures** — automation bias (uncritical acceptance) and algorithm
  aversion (excessive rejection after errors) — with an **expertise paradox where novices overrely while experts
  underrely.** Anthropomorphic design enhances engagement but can distract from learning and foster harmful
  emotional attachment. The synthesis recommends **differentiated approaches**: AI tutoring for technical
  foundations where automation bias is manageable through proper scaffolding, but human facilitation for design,
  ethics and professional judgment.
- **Evidence:** Qadir & Mumtaz, "The Psychology of Learning from Machines: Anthropomorphic AI and the Paradox of
  Automation in Education," arXiv:2601.06172v1 — https://arxiv.org/html/2601.06172v1 (accessed 2026-10-20)
- **Strength:** `contested` (theoretical synthesis, explicitly not an intervention study)
- **Fit for vibe-fence:** Do **not** anthropomorphize. The "companion" framing in the brief risks the
  personhood-conferral problem: an agent that adopts the role of mentor/evaluator/authority is doing the one
  thing the literature warns against. A guardrail that works today: the harness names what it is ("I'm a
  harness, here's what I checked") rather than performing a human relationship. Pair with T-08.

### T-08 — The dial should be *personalized by cognitive style*, and more control = more inclusive

- **Claim:** Across 18 experiments (16 after two manipulation-check failures), AI products that followed a
  human-AI interaction guideline were "almost always more inclusive across diversity of problem-solving styles"
  than products that did not. Two results are directly actionable: **when an AI product had risk implications,
  four variables moved in tandem — participants' feelings of control, their (lack of) suspicion, their trust in
  the product, and their certainty while using the product** — and **the more control an AI product offered
  users, the more inclusive it was.** Problem-solving styles skewed differently by gender and age group.
- **Evidence:** Li et al., "Measuring User Experience Inclusivity in Human-AI Interaction via Five
  User Problem-Solving Styles," *ACM TOIS* — https://ar5iv.labs.arxiv.org/html/2108.00588 (accessed 2026-10-20);
  and the underlying guideline set: Amershi et al., "Guidelines for Human-AI Interaction," *CHI '19*, 18
  guidelines, DOI 10.1145/3290605.3300233 — https://dl.acm.org/doi/abs/10.1145/3290605.3300233 (accessed 2026-10-20)
- **Strength:** `proven` for the control→inclusivity relationship (16 controlled experiments); `practiced` for
  the 18-guideline set
- **Fit for vibe-fence:** **Perceived control is the load-bearing variable for the novice.** A non-technical user
  who feels out of control will disengage (T-04) and start rubber-stamping. This argues for:
  - always showing a **visible plan before execution** (the user can read the plan, which is control),
  - always offering **a manual override of the dial**,
  - the *feeling of control* being a tracked health metric, not a vibe.

### T-09 — Explanation timing is conditional on system reliability — pre when shaky, post when solid

- **Claim:** In a user study manipulating explanation timing (pre / post / both / none) against biased vs.
  unbiased AI performance: **pre-explanations were most valuable when the AI showed bias; post-explanations
  were more favorable when the system was bias-free; and showing both was effective regardless.** The authors
  attribute the negative evaluation of post-explanations under bias to **cognitive overload**. Their practical
  recommendation is to provide explanations before *and* after, with different content types in each position.
- **Evidence:** Chen, Liao & Sundar, "When to Explain? Exploring the Effects of Explanation Timing on User
  Perceptions and Trust in AI systems," *TAS '24*, DOI 10.1145/3686038.3686066 —
  https://dl.acm.org/doi/pdf/10.1145/3686038.3686066 (accessed 2026-10-20)
- **Strength:** `proven` (controlled user study with 2×2 manipulation; single domain — note transcription)
- **Fit for vibe-fence:** This is a **rule for the harness's own reliability, and it is uncomfortable.** The
  harness's teaching should be *front-loaded* exactly when the harness is least reliable:
  - When a task is high-uncertainty (novel stack, security-sensitive change, low test coverage): explain
    **before** acting — pre-explain the risk and the approach so the user can catch a wrong direction early.
  - When a task is routine and well-tested: explain **after** — result first, rationale on request.
  - When a task is destructive or irreversible: **both**, with different content — pre = what will happen and
    how to undo; post = what happened and what to watch.
  - Never compress a pre-explanation into a post-explanation. That is the overload case the study names.

### T-10 — "Explain everything" actively harms non-technical users

- **Claim:** "Why Johnny Can't Prompt" studied 16 non-AI-expert users designing prompts for an LLM-based tool.
  Participants explored prompt designs **opportunistically, not systematically**, and struggled in ways echoing
  end-user programming systems. The barriers were **expectations stemming from human-to-human instructional
  experiences, and a tendency to overgeneralize.** The authors explicitly call out implications for
  non-AI-expert-facing LLM-based tool design.
- **Evidence:** Zamfirescu-Pereira, Wong, Hartmann & Yang, "Why Johnny Can't Prompt: How Non-AI Experts Try (and
  Fail) to Design LLM Prompts," *CHI '23*, DOI 10.1145/3544548.3581388 —
  https://dl.acm.org/doi/fullHtml/10.1145/3544548.3581388 (accessed 2026-10-20)
- **Strength:** `proven` (controlled study, small N, qualitative depth)
- **Fit for vibe-fence:** The **overgeneralization** finding is the operational risk: a non-technical user who has
  been taught one idiom ("the harness handles it") will apply it to *everything*, including security. This argues
  the harness must be explicit about the *boundary* of what it handles, and must not let "turbo" imply "the
  harness has everything under control." Combine with T-09's pre/post rule.

---

## 2. Turbo Mode (autonomy vs. safety)

### U-01 — The shipping industry answer is a *classifier in the loop*, not a human in the loop

- **Claim:** Both major agent vendors have independently converged on the same architecture, and it is not
  "ask the human more often" — it is "ask a *second model* whether this specific action needs the human."
  - **Claude Code `auto` mode:** "In auto mode, a second model, the classifier, reviews actions instead of you."
    The mode runs "everything, with background safety checks" and is "best for long tasks, reducing prompt
    fatigue." A `permission` mode table now spans `default` (reads only) → `acceptEdits` → `plan` →
    `auto` → `dontAsk` → `bypassPermissions`. Crucially, **there is a list of actions no mode auto-approves,
    including in `bypassPermissions`** — e.g. `rm`/`rmdir` removals targeting a critical path, which "no allow
    rule or `PreToolUse` hook `'allow'` approves."
  - **OpenAI Codex at OpenAI:** for requests crossing the sandbox boundary they use **Auto-review mode**, where
    "Codex sends the planned action and recent context to the auto-approval subagent, which can automatically
    approve low-risk actions — or high-risk actions with sufficient level of user authorization — instead of
    interrupting the user." The stated principle: "productive inside a bounded environment, low-risk everyday
    actions should be frictionless, and higher-risk actions should stop for review."
  - **Cursor:** three run modes — **Auto-review** (default; runs allowlisted calls, sandboxes shell commands
    when it can, routes the rest through an **LLM classifier** that returns allow or block), **Allowlist**, and
    **Run Everything**. Cursor's own docs call the allowlist "best-effort, not a security boundary. Determined
    agents or prompt injection might bypass it."
- **Evidence:** Claude Code Docs, "Choose a permission mode" — https://code.claude.com/docs/en/permission-modes
  (accessed 2026-10-20); OpenAI, "Running Codex safely at OpenAI," 2026-05-08 —
  https://openai.com/index/running-codex-safely/ (accessed 2026-10-20); Cursor Docs, "LLM Safety and Controls" —
  https://cursor.com/docs/enterprise/llm-safety-and-controls (accessed 2026-10-20)
- **Strength:** `practiced` (all three shipping in production; the classifier approach is industry-standard)
- **Fit for vibe-fence:** **This is the core of the turbo contract.** Turbo is not "skip the human." Turbo is
  "replace the human with a classifier for the classes of action where a classifier is reliable, and keep the
  human for the classes where it isn't." vibe-fence's *unique* value-add over a generic agent is that it
  already knows which classes are which. And the "no mode auto-approves this" list is the template for
  vibe-fence's permanent deny list.

### U-02 — Friction must scale to blast radius, and the action list is a ladder, not a switch

- **Claim:** The standard destructive-action guidance is explicit: "the amount of friction should be proportional
  to how much damage the action can do and how hard it is to reverse." The prescribed ladder is **no
  confirmation → simple confirmation → explicit-consequence confirmation → type-to-confirm**, with each action
  placed on the rung its real risk earns. "A blanket 'Are you sure?' on every action trains users to click
  through without reading, so the one confirmation that actually mattered gets dismissed on autopilot." And:
  "For anything genuinely reversible, undo is almost always the better experience."
- **Evidence:** SaaSUI Design, "SaaS Destructive Actions & Confirmation UX Patterns" (2026) —
  https://www.saasui.design/blog/saas-destructive-actions-confirmation-ux-patterns (accessed 2026-10-20)
- **Strength:** `practiced` (UX pattern library, not a controlled study; illustrates with real shipped products)
- **Fit for vibe-fence:** A binary turbo on/off is the wrong shape — it *is* the blanket "Are you sure?" problem
  in reverse. The turbo contract must be **per-action-class** friction:
  - reversible, local, cheap (edit a file in the working tree) → no friction, undo via git
  - reversible but expensive (install deps, run the test suite) → notify
  - hard to reverse but recoverable (drop a DB, force-push) → confirm with *explicit consequence* text
  - irreversible or outward-facing (deploy to prod, publish, send, delete, spend money, push to a shared
    branch) → **type-to-confirm or explicit named-entity confirmation, always, even in turbo**
  Codex's per-command "rules so Codex does not treat every shell command as equally safe" is the same idea, and
  OpenAI's guidance — allowlist common benign commands, block or gate specific dangerous ones — is the
  implementation pattern to copy [23].

### U-03 — Turbo must still produce a *plan artifact*, and the plan is the control surface

- **Claim:** Every major agent now ships a plan-then-build mode as a first-class step, not an option:
  - Claude Code `plan` mode: "Claude reads files, runs shell commands to explore, and writes a plan, but does
    not edit your source"; the status bar shows `⏸ plan mode on`; best-practice guidance says "Separate research
    and planning from implementation to avoid solving the wrong problem. Letting Claude jump straight to coding
    can produce code that solves the wrong problem."
  - Replit Agent Plan mode: breaks complex projects into **ordered task lists**, explores approaches and weighs
    trade-offs, and the user reviews and refines the plan before Agent builds. The plan UI offers **"Accept
    tasks"** and **"Revise plan"** — an edit-the-draft interaction, not accept/reject.
  - Claude Code's best practices also say to give the agent a way to **verify its own work** — a test, a build, a
    screenshot — because "Claude stops when the work looks done. Without a check it can run, 'looks done' is
    the only signal available, and you become the verification loop."
- **Evidence:** Claude Code Docs, "Choose a permission mode" — https://code.claude.com/docs/en/permission-modes;
  "Common workflows" — https://code.claude.com/docs/en/common-workflows; "Best practices" —
  https://code.claude.com/docs/en/best-practices (accessed 2026-10-20); Replit Docs, "Replit Agent" —
  https://docs.replit.com/features/agent/overview (accessed 2026-10-20)
- **Strength:** `practiced`
- **Fit for vibe-fence:** Turbo mode still emits a plan artifact. For a non-technical user the plan must be
  **a checklist in plain language**, not a diff. Two required properties:
  1. **Editable draft, not accept/reject** (Replit's "Revise plan" precedent) — the user edits the plan, which
     is where perceived control (T-08) actually comes from.
  2. **A verification criterion per task** — the plan's acceptance criteria are what let the agent work
     unattended *and* let the harness honestly report "done." A task with no checkable criterion must be
     escalated to a human, because there is no signal that distinguishes "finished" from "gave up."

### U-04 — Checkpoints and rollback are the precondition for autonomy, not an extra

- **Claim:** Replit Agent "creates checkpoints as it works, so you can roll back to any previous state."
  Claude Code's guidance is that a deterministic gate (a Stop hook that runs a check and blocks the turn from
  ending until it passes) is what "let[s] an unattended run finish correctly without you." So both the
  *verification* signal and the *reversibility* signal are prerequisites for unattended operation.
- **Evidence:** Replit Docs, "Replit Agent" — https://docs.replit.com/features/agent/overview; Claude Code Docs,
  "Best practices" — https://code.claude.com/docs/en/best-practices (accessed 2026-10-20)
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Turbo requires a checkpoint per step and a one-command rollback.** Without them, turbo
  is a liability, because the user's only recourse against a runaway agent is "stop" — which does not undo
  damage. With them, turbo becomes safe enough for a non-technical user, and the "undo" affordance becomes the
  primary safety net for the class of actions that are reversible (U-02).

### U-04b — Two shipped presets settle the naming and the shape: Factory's risk bands, and the fact that "Turbo" reads as free

- **Claim:** Two independent, currently-shipping products answer the "what should the mode be called" question.
  1. **Factory Droid** ships an **Autonomy Level** with four bands — `off` / `low` / `medium` / `high` — where
     "Autonomy Level sets the highest-risk work Droid can run without pausing for approval," and a **built-in
     blocklist prevents certain destructive commands regardless of the chosen level.** The setting is
     `sessionDefaultSettings.autonomyLevel` (default `off`) [36][37].
  2. **Google Antigravity 2.0** ships a permission preset literally named **"Turbo"**, and its own docs table
     shows what it does: Sandbox **Disabled**, Terminal Commands **Allowed (unrestricted)**, File Access **Full
     filesystem**, MCP & Web **Allowed** [38]. The sandbox docs are blunter still — the "Turbo mode" row under
     Security Preset is **Always Proceed** + **Allow** for outside-of-folder file access, and "None of the presets
     turn the sandbox on" [39]. Community reviewers call it Antigravity's YOLO mode.
- **Evidence:** Factory Docs, "auto-run" — https://docs.factory.ai/cli/user-guides/auto-run.md; Factory Docs,
  "Settings" (droid-cli) — https://docs.factory.com/droid-cli/settings; Google Antigravity Docs, "Permissions" —
  https://antigravity.google/docs/permissions; Google Antigravity Docs, "Terminal sandbox" —
  https://www.antigravity.google/docs/sandbox (accessed 2026-10-20)
- **Strength:** `practiced` (shipping product behavior, read from vendor docs)
- **Fit for vibe-fence:** **Two decisions, and they point in opposite directions.**
  - **Adopt Factory's *shape*, not Antigravity's *label*.** A four-band risk ladder (`off`/`low`/`medium`/`high`)
    with a **blocklist that holds at every band** is the right structure — it is the same ladder as U-02's friction
    ladder, but expressed as *risk of the action* rather than *friction to approve it*, and it is already proven
    in a shipping product. Factory's default is `off`, which matches U-07's finding that experts want supervision.
  - **Do not ship the word "Turbo" as a user-facing mode name.** A mode named for speed reads as *free of cost*,
    and the thing behind the name is a *permission* change (sandbox off, full filesystem). For a non-technical
    user, "Turbo" signals "I chose to give up safety" — which is the opposite of what the harness is selling, and
    it invites the exact reflex (disable the safety layer) that U-01's false-positive finding shows is already the
    beginner's default failure mode. **Name the bands by what they *guarantee*, not by what they *feel* like**:
    e.g. `guarded` → `assisted` → `autonomous` → `open` — with the band name stating the *guarantee* (what is
    still blocked) rather than the *feeling*. Whatever the name, the band must display what is still gated
    (U-02's permanent never-auto-approve list), because "Turbo" promises a state the user cannot otherwise see.

### U-05 — Automation bias is not fixable by training or instructions

- **Claim:** Parasuraman & Manzey's integrated model concludes that **automation bias occurs in both naive and
  expert participants, cannot be prevented by training or instructions, and can affect decision making in
  individuals as well as in teams**; automation bias results in both omission and commission errors when the
  decision aid is imperfect. Automation complacency occurs under multiple-task load, when manual tasks compete
  with the automated task for the operator's attention, and is "found in both naive and expert participants and
  cannot be overcome with simple practice." A systematic review of 74 papers from 13,821 retrieved confirms
  automation bias is mediated by user factors including **cognitive style**, decision support systems and
  task-specific experience, as well as attitudinal factors such as **trust and confidence**.
- **Evidence:** Parasuraman & Manzey, "Complacency and Bias in Human Use of Automation: An Attentional
  Integration," *Human Factors* 52(3), 2010, DOI 10.1177/0018720810376055 —
  https://journals.sagepub.com/doi/10.1177/0018720810376055 (accessed 2026-10-20); Goddard, Roudsari & Wyatt,
  "Automation bias: a systematic review of frequency, effect mediators, and mitigators," *J Am Med Inform
  Assoc* 19(1), 2012, PMID 21685142 — https://pmc.ncbi.nlm.nih.gov/articles/PMC3240751/ (accessed 2026-10-20)
- **Strength:** `proven` (integrated model + systematic review of 74 studies)
- **Fit for vibe-fence:** **The most important negative finding in the whole stream.** It kills the design
  pattern "tell the user we have their back and they'll be fine," and it means the *architecture* must carry the
  safety, not the user's vigilance. Concretely: vibe-fence must never rely on the user noticing a bad action.
  It must (a) enforce deny-lists outside the model's reach, (b) use a classifier gate in place of the user for
  reversible actions, and (c) **require a real decision from the user for irreversible actions — including
  when the user is in a hurry, because hurry is exactly when omission errors happen.**

### U-06 — Turbo's cost is prompt fatigue, and the industry answer is batching, not more prompts

- **Claim:** Claude Code's `auto` mode is explicitly "best for long tasks, **reducing prompt fatigue**." The
  generalized problem — over-frequent or contextually redundant assistance causing disengagement — is documented
  in Steyvers & Mayer [8] and in the alert-fatigue literature (desensitization to critical warnings due to
  frequent exposure to non-essential ones).
- **Evidence:** Claude Code Docs, "Choose a permission mode" — https://code.claude.com/docs/en/permission-modes;
  Steyvers & Mayer, arXiv:2508.01837 — https://www.arxiv.org/pdf/2508.01837 (accessed 2026-10-20)
- **Strength:** `practiced` (vendor-design rationale) / `proven` (the disengagement mechanism)
- **Fit for vibe-fence:** Turbo must *reduce* interruptions, not merely move them. Batch low-urgency findings
  into a single end-of-task digest. Only genuinely time-sensitive or irreversible things interrupt. If a
  non-technical user is asked to approve 20 things, they will approve 20 things without reading — and the
  "informed" promise in the brief quietly becomes false.

### U-07 — Experienced developers use agents by *controlling* them — which is the opposite of turbo, and that is the finding

- **Claim:** In a mixed-methods study (13 field observations, 99 experienced developers), the authors conclude
  "professional developers do not vibe code. Instead, they carefully *control* the agents through planning and
  supervision." They value agent output for well-described, straightforward tasks but not complex tasks, they
  **plan before implementing and validate all agentic outputs**, and they generally enjoy using agents "as long
  as they are in control." The paper's framing: "as execution accelerates, the bottleneck in product development
  shifts toward judgment." Relatedly, a randomized trial found experienced open-source maintainers were slowed
  by 19% when allowed to use AI, and an agentic system deployed in an issue tracker saw only 8% of invocations
  result in complete success.
- **Evidence:** Huang et al., "Professional Software Developers Don't Vibe, They Control: AI Agent Use for
  Coding in 2025," arXiv:2512.14012v2 — https://arxiv.org/html/2512.14012v2 (accessed 2026-10-20)
- **Strength:** `proven` (mixed-methods field study + survey, n=112)
- **Fit for vibe-fence:** This is a **direct warning against designing turbo as the default**. Every population
  studied — professionals, students, professionals developers — wants *supervision*, and the desire increases
  with expertise. A non-technical user has the *least* ability to supervise, which means the harness must
  substitute for them. Concretely: **vibe-fence's baseline should be supervised-with-friction, and turbo should
  be an explicit, user-elected, *visible* state** — not the default, and never silent. Also: the 19% slowdown
  result and the 8% success rate argue that vibe-fence's verification layer (U-03) is not optional polish; it is
  the thing that makes the harness worth more than the raw agent it wraps.

---

## 3. Issue → Solution → Plan Queue UX

### Q-01 — The precedent is Linear's agent-driven triage, and it has a published hit rate

- **Claim:** Linear's agent system documents the exact loop vibe-fence wants: issues land in a Triage inbox;
  "Triage Intelligence uses agentic AI to analyze every new issue in triage against your existing issues to
  suggest properties like assignee and label, and to pro-actively surface likely related issues or duplicates";
  and critically, **the automation goes beyond suggestion** — Linear's own team reports that the workflow
  "resolves around 30% of our triage issues, most of them on the first pass with minimal human input." The
  described flow is: reconstruct the bug from the report → investigate the codebase → determine root cause →
  if confident, assign the agent and start a coding session → fix → open a PR. If the agent is not confident, it
  **stops and asks a human**. Linear's agent interaction contract is also explicit about *acknowledgment*: the
  agent "should respond immediately with a `thought` activity to acknowledge that the agent has started
  working. The first response must be sent within 10 seconds... or the agent will be shown as unresponsive,"
  and it should **set itself as the delegate** to make the agent's role in the issue explicit.
- **Evidence:** Linear, "Triage" — https://linear.app/docs/triage; Linear, "Interaction Best Practices" —
  https://linear.app/developers/agent-best-practices; Linear, "Introducing Linear Agent" (changelog, 2026-03-24) —
  https://linear.app/changelog/2026-03-24-introducing-linear-agent (accessed 2026-10-20)
- **Strength:** `practiced` (shipping product with a published internal hit rate)
- **Fit for vibe-fence:** This is the **direct precedent for "the agent itself resolves"** and it validates the
  brief's design: agent-as-assignee, agent-self-delegates, agent escalates only on low confidence. Three
  transferable details:
  1. **The confidence gate is the escalation rule.** Linear resolves ~30% on the first pass — meaning ~70% of
     items *do* need something else. vibe-fence should not promise "the agent resolves everything"; it should
     resolve what it can and **route the rest to the user with a plan already attached** — which is exactly the
     `issue → solution → plan` shape the brief asks for.
  2. **The acknowledgment-within-10-seconds rule.** For a non-technical user, a silent agent is an agent that
     looks broken. vibe-fence must emit an immediate "I'm on it" before the long build.
  3. **The agent declares itself the owner.** In vibe-fence, every queue item must visibly say *the agent is
     working on this*, not *a suggestion appeared in a list*.

### Q-02 — The queue should be a **state machine with an agent-owned state**, not a notification list

- **Claim:** Linear's model separates *triage state* (unowned, automation- or human-claimed) from *started*
  states (agent actively working) and *completed*/*canceled*. Their guidance: "If your agent is delegated by a
  human to work on an issue that is not in a `started`, `completed`, or `canceled` status type, move the issue
  to the first status in `started` when your agent begins work." When work is complete the agent emits a
  `response` activity; if it needs more from the user, it emits an **`elicitation`** or `error` activity.
- **Evidence:** Linear, "Interaction Best Practices" — https://linear.app/developers/agent-best-practices (accessed 2026-10-20)
- **Strength:** `practiced`
- **Fit for vibe-fence:** The queue's minimum viable state machine:
  `detected → triaged (agent proposed solution) → claimed (agent working) → resolved (verified) | escalated
  (needs human) | dismissed (not a problem)`.
  The key UI property: **at most one item should ever be in `claimed` at a time for a non-technical user.** A
  parallel queue of 5 in-flight items is a monitoring burden the user cannot discharge — and a monitoring burden
  the user is bad at is a place automation bias will set in. The `elicitation` state is the critical one: it
  means the agent needs a *decision*, and it should be the only thing the user is asked about.

### Q-03 — "Informed, not asked" is the hard part: the agent must present a *consequence*, not a question

- **Claim:** The UX literature on human-in-the-loop AI is converging on a rule that is almost the inverse of a
  confirmation dialog: the interface should **show the user what the AI is about to do before it does it, let them
  edit the AI's draft instead of accepting it whole, and make them confirm only irreversible actions** — with
  the amount of friction determined not by the *category* of the action but by **how bad the worst case is and how
  cheaply it can be undone.**
- **Evidence:** "Human-in-the-Loop UX: Designing AI Approvals" — https://ai-tldr.dev/learn/building-ai-apps/ai-ux-patterns/human-in-the-loop-ux/ (accessed 2026-10-20);
  cross-checked against the destructive-actions ladder in U-02 [10] and Replit's "Accept tasks / Revise plan"
  affordance [19]
- **Strength:** `practiced` (industry pattern synthesis; consistent with U-02 and U-03)
- **Fit for vibe-fence:** The brief says "the user doesn't decide on security — they're informed the harness has
  their back." The operational translation: **the harness decides, and it tells the user what it did and what
  it protected them from.** Format:
  > 🔒 *I blocked `rm -rf ./data` because it's a critical path. Say "force it" if you really mean it.*
  That is "informed." A modal "Allow this command? [Y/n]" is *asking* — and it converts the user into the
  security control, which U-05 says does not work. **The harness's protection must not depend on the user's
  vigilance, because vigilance is exactly what a non-technical user cannot supply under time pressure.**

### Q-04 — A queue item needs a *floor*, not just a structure

- **Claim:** Linear's Triage Intelligence does two things beyond routing: it **pro-actively surfaces likely
  related issues or duplicates** based on matching the issue's content against historical behavior in the
  workspace, and it sets properties from context. This is the coalescing behavior that keeps a queue from
  becoming a dump. Separately, the vibe-coding grey-literature review's design recommendation for tooling is to
  "incorporate lightweight verification processes and continuously remind users of the QA aspects (especially
  those with no formal software development experience) of the generated code."
- **Evidence:** Linear, "Triage" — https://linear.app/docs/triage (accessed 2026-10-20); "Vibe Coding in Practice:
  Motivations, Challenges, and a Future Outlook," arXiv:2510.00328 — https://arxiv.org/html/2510.00328 (accessed 2026-10-20)
- **Strength:** `practiced` (Linear) / `contested` (the grey-literature review is a GLR, not a controlled study)
- **Fit for vibe-fence:** Every queue item must carry: **what** (the issue, in plain language), **why it matters**
  (the consequence if ignored), **what the agent proposes to do** (the solution), **the plan** (steps + verification),
  and **what it will NOT do** (scope). If an item can't state its consequence in one sentence a non-technical
  person would care about, it doesn't belong in the queue.

---

## 4. Anti-patterns

### A-01 — Over-advising causes disengagement; this is measurable, not stylistic

- **Claim:** See T-04. "Overly frequent or contextually redundant assistance can cause users to disengage,
  undermining the long-term benefits of AI assistance." Their adaptive policy "significantly outperforms baseline
  policies in which assistance is always provided or never provided." The mechanism: alert fatigue
  desensitizes users to critical warnings, and disengagement makes them ignore even high-quality advice in
  exactly the unfamiliar situations where it would help. The same intrusion effect has been observed in
  code-completion agents specifically: developers "sometimes perceive the automatic suggestions as intrusive. As
  a result, they feel like their productivity decreased" — and the hypothesis under test is that the effect
  **splits by expertise**: experienced developers are frustrated by irrelevant automatic suggestions (which
  reduces their productivity), while novices *benefit* from them (which reduces the frustration of being stuck
  and raises their productivity) [15].
- **Evidence:** Steyvers & Mayer, arXiv:2508.01837 — https://www.arxiv.org/pdf/2508.01837 (accessed
  2026-10-20); Guglielmi, Arnoudova, Bavota, Oliveto & Scalabrino, "How do Copilot Suggestions Impact
  Developers' Frustration and Productivity?," arXiv:2504.06808 — https://arxiv.org/html/2504.06808 (accessed
  2026-10-20)
- **Strength:** `proven` for the disengagement mechanism (formally specified + simulated); `contested` for the
  expertise split (arXiv:2504.06808 is a *study-in-design* with stated hypotheses and a planned quasi-experiment
  of ≥32 developers, **not reported results** — treat it as a well-motivated prediction, not a finding)
- **Fit for vibe-fence:** **The teaching budget is a first-class runtime value, not a config.** A companion that
  teaches on every action trains the user to ignore the companion. Budget, decay, and explicit "do not teach
  this again" memory (per project, per task-class) should be in the state file.
  The expertise-split hypothesis, if it holds, is the *reason* the dial must be per task-class (T-02) and
  auto-selected rather than user-set: the same automatic suggestion that is noise to an experienced user is a
  unblocker for a novice. A single global verbosity setting cannot satisfy both. **It also predicts that a
  non-technical user, who is by definition at the novice end, will be *helped* by more automatic assistance —
  which is an argument against assuming that restraint is always the compassionate choice.**

### A-02 — Verbose teaching poisons the agent's own context window

- **Claim:** Claude Code's best-practices guide is blunt about the mechanism: "Claude's context window holds your
  entire conversation, including every message, every file Claude reads, and every command output. This can
  fill up fast... LLM performance degrades as context fills. When the context window is getting full, Claude may
  start 'forgetting' earlier instructions or making more mistakes. The context window is the most important
  resource to manage." The documented mitigation is a **status line tracking context usage** and a
  `/context` view, plus reducing token usage deliberately.
- **Evidence:** Claude Code Docs, "Best practices" — https://code.claude.com/docs/en/best-practices (accessed 2026-10-20)
- **Strength:** `practiced` (vendor-documented; the "lost in the middle" effect is separately established in
  Stream 02's territory)
- **Fit for vibe-fence:** **Teaching is not free — it is paid for in the harness's own working context.** Every
  `max`-dial explanation is a context tax on the very agent that must still finish the task correctly. This is
  an argument for the structured-explanation approach in T-03 (fixed schema, compact) and against free-form
  narration. The harness should measure its own context consumption as a first-class metric and, at high
  utilization, automatically step the dial down — **the dial should degrade under context pressure even if the
  user did not ask.**

### A-03 — Learned helplessness / over-reliance in the specific context of vibe coding

- **Claim:** The vibe-coding literature documents the specific mechanisms:
  - A controlled study of novices comparing AI-assisted vs. human pair programming found that despite **lower
    workload and higher performance** with GitHub Copilot, participants **learned comparably** and experienced
    **less positive, less arousing emotion** with the AI teammate than with a human. So the AI gives you the
    performance without the learning — which is exactly the outcome a teaching harness must counteract, and
    exactly what a *non*-teaching harness silently produces.
  - A one-day hackathon with 31 undergraduates (computing and non-computing) found vibe coding enabled rapid
    prototyping and cross-disciplinary collaboration, **but observed premature convergence in ideation, uneven
    code quality requiring rework, and limited engagement with core software engineering practices.** The
    authors conclude it works when "coupled with explicit scaffolds for divergent thinking, critical evaluation
    of AI outputs, and realistic expectations about production quality."
  - A systematic grey-literature review of vibe coding found prior work had **not** systematically examined it as
    a distinct practice, and notes educational studies showing students often adopt it without understanding it,
    risking poor learning outcomes, plus security research showing LLM-generated code frequently contains
    vulnerabilities, and practitioner reports of technical debt.
  - The "vibe coding before the trend" practitioner report (Fontys ICT, 107 student reflections across four
    experiments) documents the raw beginner experience: students "couldn't find where the application had been
    installed on their own computer. They opened projects in the wrong folder" — **the friction is not the
    concept, it is the filesystem.**
  - A formalization of vibe coding notes that developers asked to maintain or extend AI-generated code "often
    find it hard to understand, especially if they did not participate in the generation process," and that
    "the lack of comments, unusual naming conventions, or unconventional control flow can impede maintenance."
- **Evidence:** "Fast and Forgettable: A Controlled Study of Novices' Performance, Learning, Workload, and
  Emotion in AI-Assisted and Human Pair Programming Paradigms," arXiv:2604.18538, *ACM ICER 2026* —
  https://arxiv.org/html/2604.18538; "Can you feel the vibes? An exploration of novice programmer engagement
  with vibe coding," arXiv:2512.02750v1 — https://arxiv.org/html/2512.02750v1; "Vibe Coding in Practice:
  Motivations, Challenges, and a Future Outlook," arXiv:2510.00328 — https://arxiv.org/html/2510.00328;
  "Vibe coding before the trend," arXiv:2605.07751v1 (Fontys ICT practitioner report) —
  https://arxiv.org/html/2605.07751v1; Bamil, "Vibe Coding: Toward an AI-Native Paradigm for Semantic and
  Intent-Driven Programming," arXiv:2510.17842v1 — https://arxiv.org/html/2510.17842v1 (all accessed 2026-10-20)
- **Strength:** `proven` for the controlled study and the hackathon study; `contested` for the grey-literature
  review and the practitioner report
- **Fit for vibe-fence:** **The single most important anti-pattern for this product: shipping a companion that
  makes the user *feel* like a developer without making them *behave* like one.** The evidence says the
  performance arrives and the learning does not. So:
  - **A-03a:** The harness's teaching must target *evaluation*, not production. HypoCompass's result (T-05) is
    the model: offload generation, keep judgement.
  - **A-03b:** "Premature convergence in ideation" is a specific, fixable anti-pattern. A companion that
    immediately starts building the user's first idea teaches them to stop having ideas. The harness should
    **offer one divergent option before implementing** (and, at `max`, explain why one design might be better).
  - **A-03c:** **The unread-code problem is the durability problem.** If the user didn't participate in
    generation, they can't maintain it — and non-technical users *always* didn't participate. This is the
    strongest argument for the `Learning`/`TODO(human)` pattern (T-05) being part of `max`, and for the
    harness's teaching to be attached to *code the user will later own*.

### A-04 — Anthropomorphism as a dark pattern

- **Claim:** See T-07. Anthropomorphic design "enhances engagement, it can distract from learning and foster
  harmful emotional attachment," and the synthesis names a "personhood conferral problem" where AI agents
  "assume roles traditionally reserved for human educators — mentor, evaluator, emotional supporter, intellectual
  authority."
- **Evidence:** Qadir & Mumtaz, arXiv:2601.06172v1 — https://arxiv.org/html/2601.06172v1 (accessed 2026-10-20)
- **Strength:** `contested` (theoretical synthesis)
- **Fit for vibe-fence:** "Companion" is a product word, not a persona spec. The implementation rule: the agent
  may be **attentive, specific and warm in tone**, but it must never claim the epistemic or evaluative authority
  of a human teacher. It reports what it did, what it checked, and what it did *not* check. It does not evaluate
  the user's worth as a builder.

### A-05 — Dark patterns in helpfulness: the "always fix it myself" trap

- **Claim:** The tension is documented in the user-experience data: in a controlled study of 22 novices,
  participants with the AI teammate had **lower workload and higher performance** but **learned comparably** and
  reported **less positive emotion** with the AI than with a human partner [16]. A harness that always resolves
  the issue removes both the friction that produces learning *and* the satisfaction that produces continued
  engagement — the user's "learned helplessness" risk, with a measurable emotional cost. Amershi et al.'s
  guideline set includes "learn from user behavior" and "update and adapt cautiously" — i.e., adapt, but
  cautiously.
- **Evidence:** arXiv:2604.18538 — https://arxiv.org/html/2604.18538; Amershi et al., *CHI '19*,
  DOI 10.1145/3290605.3300233 — https://dl.acm.org/doi/abs/10.1145/3290605.3300233 (accessed 2026-10-20)
- **Strength:** `proven` (controlled study) / `practiced` (guideline set)
- **Fit for vibe-fence:** The harness must be able to *decline to act*. Specifically: when the user asks for
  something and the agent can just do it, the agent should ask "do you want to do this part?" at a bounded
  cadence — not every step (that is nagging) and not never (that is helplessness). And because the brief
  says the agent resolves its own queue, the agent must also be able to **dismiss** an item it decides is not
  worth the user's attention, with a one-line reason. A queue with no dismissal path becomes a permanent nag.

---

## 5. Onboarding (the first 5 minutes for someone who has never coded)

### O-01 — The best-documented beginner win is confidence, and it is cheap: one artifact in one session

- **Claim:** The Brazilian hackathon study (31 participants, 9 teams, one day) found that "the short format
  (9 hours) proved effective for **confidence-building among newcomers** while accommodating participants with
  limited availability," and concluded that vibe coding hackathons "can serve as valuable low-stakes learning
  environments when coupled with explicit scaffolds for divergent thinking, critical evaluation of AI outputs,
  and realistic expectations about production quality." The Fontys practitioner report records the concrete
  moment: a journalism student "had never worked with code before and the idea of an IDE felt daunting the
  first minutes" — then built a working learning tool in an hour and said "this really changes how I can study
  on this topic, fantastic!"
- **Evidence:** arXiv:2512.02750v1 — https://arxiv.org/html/2512.02750v1; arXiv:2605.07751v1 —
  https://arxiv.org/html/2605.07751v1 (accessed 2026-10-20)
- **Strength:** `practiced` (single-site observational study + practitioner report; not a controlled comparison)
- **Fit for vibe-fence:** **The first-5-minutes metric is "one working thing, built, running."** Not "one prompt
  submitted." The Fontys report says the hard part was *finding the project on their own computer* — so
  vibe-fence's first-run experience must be **zero filesystem orientation**: the harness creates the project,
  the harness opens it, the harness says "here's the app, here's the URL, click this button and it does the
  thing you asked for."

### O-02 — The competitive baseline: a working first version in ~10 minutes, then the hard 30%

- **Claim:** The shipped baselines are explicit. Lovable's documentation: "Build and publish your first app in
  about ten minutes"; "Create a free account with email, Google, GitHub, or Apple, and start building
  immediately." Its stated audience includes "people building on their own," with code ownership and
  "production-grade web applications... with real code, security, and enterprise governance." Replit Agent's
  positioning: "Describe what you want in everyday language. No code or technical knowledge required. Agent
  handles the rest, from planning to deployment" — and it explicitly says "Agent takes your ideas, helps you
  refine them, and then makes them real," i.e. refinement is part of the flow, not a separate phase. Replit also
  makes checkpoints and rollback a first-class, user-facing feature.
- **Evidence:** Lovable Docs, "Welcome to Lovable" — https://docs.lovable.dev/introduction/welcome; Replit Docs,
  "Replit Agent" — https://docs.replit.com/features/agent/overview (accessed 2026-10-20)
- **Strength:** `practiced` (vendor documentation = shipped behavior)
- **Fit for vibe-fence:** **vibe-fence is a wrapper, not a builder — it must not be slower than the builders it
  wraps.** If the wrapped agent takes 10 minutes to a working app, vibe-fence's overhead must be near-zero in
  that path. That is a hard architectural constraint on the harness: *teaching must not block the first
  artifact.* Concretely: the first run should produce the artifact **first** and teach **about the artifact
  afterwards** — the opposite of explaining the plan before the first build. This is also consistent with T-09's
  pre/post rule (pre-explain only when the task is unreliable; a first "make me a landing page" is reliable).

### O-03 — The plan is the onboarding, and it must be plain language

- **Claim:** Replit Agent's Plan mode produces "an ordered task list" the user can "review and refine," and the
  UI offers "Accept tasks" and "Revise plan." Lovable's onboarding model is conversation-first: "You describe
  what you want to build, Lovable generates a working application... backed by editable code." Both treat the
  *plan/description* as the user-facing surface, not the code.
- **Evidence:** Replit Docs, "Replit Agent" — https://docs.replit.com/features/agent/overview; Lovable Docs,
  "Welcome to Lovable" — https://docs.lovable.dev/introduction/welcome (accessed 2026-10-20)
- **Strength:** `practiced`
- **Fit for vibe-fence:** **A non-technical user should never be shown a diff, a stack trace, or a file tree
  unprompted.** The plan is the interface. vibe-fence's dialect for the plan is: numbered steps, each with a
  plain-language "what you'll see change" and a checkable "how we'll know it worked." This is also what makes
  the U-03 verification gate expressible to a non-technical user.

### O-04 — "Why Johnny Can't Prompt" says the prompt is the *hardest* part, and the harness must absorb it

- **Claim:** See T-10. Non-AI-experts exploring a design probe for prompt craft "explored prompt designs
  opportunistically, not systematically," and were blocked by expectations from human-to-human instruction and a
  tendency to overgeneralize. The paper's implications section explicitly targets "non-AI-expert-facing
  LLM-based tool design."
- **Evidence:** Zamfirescu-Pereira et al., *CHI '23* — https://dl.acm.org/doi/fullHtml/10.1145/3544548.3581388 (accessed 2026-10-20)
- **Strength:** `proven` (controlled study)
- **Fit for vibe-fence:** The non-technical user should be able to say *"I want a page where my kid can see
  their streak"* and have that work. The harness's job is to translate intent into the plan and the prompts —
  **the prompt is an implementation detail of the harness, not something the user is asked to write.** The
  overgeneralization risk (T-10) then argues that vibe-fence must *validate* intent before building, not after.

### O-05 — Onboarding should be an "editable draft" loop, not a wizard

- **Claim:** Replit's plan flow ("Accept tasks" / "Revise plan"), the harnesses' general pattern of
  letting the user edit a proposed draft rather than accept or reject a binary, and the finding that **the
  more control an AI product offered users, the more inclusive it was** (T-08) all point the same way.
- **Evidence:** Replit Docs, "Replit Agent" — https://docs.replit.com/features/agent/overview; Li et al.,
  "Measuring User Experience Inclusivity in Human-AI Interaction via Five User Problem-Solving Styles" —
  https://ar5iv.labs.arxiv.org/html/2108.00588 (accessed 2026-10-20)
- **Strength:** `practiced` (pattern) / `proven` (control→inclusivity)
- **Fit for vibe-fence:** The first session should be: describe → see a plain-language plan → **edit one thing**
  → watch it build → see the artifact → get one short explanation of one thing that just happened. The "edit
  one thing" step is the load-bearing one: it is the first moment the user learns they are the author, not the
  passenger. A wizard that cannot be edited teaches the opposite.

---

## 6. Gaps / Unknowns

- **No controlled study of a *teaching dial* itself.** Every finding about the dial is transferred from
  scaffolding research (T-01), progressive disclosure (T-02), and explanation research (T-03, T-09). Nobody
  has run an experiment on "four verbosity levels for an AI coding companion for non-technical users." The
  dial's specific cut-points are **design judgment, not evidence.** The one exception is the shipped Claude Code
  output-style set [2] and Replit's plan mode [19], which are the closest thing to an evaluated dial.
- **The glue of "max" teaching for *novices specifically* is thin.** The strongest teaching evidence
  (HypoCompass [20], interactive scaffolding [18]) is from *students in educational settings* who chose to be
  there. vibe-fence's user may be a store manager building a tool at 11pm, not a learner. There is no evidence
  that retrieval prompts and `TODO(human)` moves land well on someone with no intent to become a developer.
  **This is the biggest open risk in the stream.**
- **T-03's cognitive-forcing result has a known problem vibe-fence inherits.** Buçinca et al. found the
  designs that best reduced overreliance received the *worst* subjective ratings, and benefited people higher in
  Need for Cognition more [13]. For a non-technical user (low Need for Cognition), the most protective design
  is likely the one they will most want to turn off. vibe-fence needs a way to enforce the protective design
  *without* making the product feel hostile — unresolved, and it is a product/UX problem more than a research
  one.
- **The "30% of triage resolved on first pass" figure is Linear's own number about Linear's own codebase**,
  on bugs with a clear repro and a mature codebase [31]. A vibe-fence queue on a non-technical user's greenfield
  project will have a very different distribution. Do not treat 30% as a vibe-fence target.
- **No evidence on the *cost* of the classifier-in-the-loop approach for a small harness.** Claude Code, Codex and
  Cursor all run classifiers, but none publish the classifier's accuracy, its false-gate rate, or its latency
  budget. vibe-fence's auto-approval classifier is unproven territory; Cursor's own docs concede the allowlist is
  "best-effort, not a security boundary" [3].
- **No published UX study of vibe-fence's actual target user.** The closest are the hackathon study [25] and
  the Fontys practitioner report [26], both of which involve students. Paulo's actual user — a retail ops
  manager with a real deadline — is not represented in the literature.
- **The `arXiv:2510.00328` grey-literature review is a GLR, not a controlled study** — it documents what
  practitioners *report*, and is tagged `contested` accordingly. The Fontys report is explicitly a practitioner
  report with n=107 reflections but no control condition.
- **Multi-item parallelism is untested for novices.** The evidence in Q-02 (Linear) is from professional teams.
  There is no evidence about whether a non-technical user can track 3 concurrent in-flight agent tasks. vibe-fence
  should assume one.

---

## 7. Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| 1 | Nielsen Norman Group, "Progressive Disclosure" — https://www.nngroup.com/articles/progressive-disclosure/ | docs / UX research | 2026-10-20 |
| 2 | Claude Code Docs, "Output styles" — https://code.claude.com/docs/en/output-styles | docs | 2026-10-20 |
| 3 | Cursor Docs, "LLM Safety and Controls" — https://cursor.com/docs/enterprise/llm-safety-and-controls | docs | 2026-10-20 |
| 4 | Parasuraman & Manzey, "Complacency and Bias in Human Use of Automation," *Human Factors* 52(3), DOI 10.1177/0018720810376055 — https://journals.sagepub.com/doi/10.1177/0018720810376055 | paper | 2026-10-20 |
| 5 | Goddard, Roudsari & Wyatt, "Automation bias: a systematic review…," *JAMIA* 19(1), PMID 21685142 — https://pmc.ncbi.nlm.nih.gov/articles/PMC3240751/ | paper (systematic review, 74 studies) | 2026-10-20 |
| 6 | van Merriënboer & Sluijsmans, "Toward a Synthesis of Cognitive Load Theory…" *Educ Psych Rev* — https://sluijsmans.net/wp-content/uploads/2019/01/EPR_2009_21_55-66.pdf | paper (review) | 2026-10-20 |
| 7 | Claude Code Docs, "Choose a permission mode" — https://code.claude.com/docs/en/permission-modes | docs | 2026-10-20 |
| 8 | Steyvers & Mayer, "When not to help: planning for lasting human-AI collaboration," arXiv:2508.01837 — https://www.arxiv.org/pdf/2508.01837 | paper | 2026-10-20 |
| 9 | Qadir & Mumtaz, "The Psychology of Learning from Machines…," arXiv:2601.06172v1 — https://arxiv.org/html/2601.06172v1 | paper (synthesis) | 2026-10-20 |
| 10 | SaaSUI Design, "SaaS Destructive Actions & Confirmation UX Patterns" — https://www.saasui.design/blog/saas-destructive-actions-confirmation-ux-patterns | UX pattern library | 2026-10-20 |
| 11 | Claude Code Docs, "Best practices" — https://code.claude.com/docs/en/best-practices | docs | 2026-10-20 |
| 12 | Claude Code Docs, "Common workflows" — https://code.claude.com/docs/en/common-workflows | docs | 2026-10-20 |
| 13 | Buçinca, Malaya & Gajos, "To Trust or to Think: Cognitive Forcing Functions…," *PACM HCI* 5(CSCW1), N=199, DOI 10.1145/3449287 — https://arxiv.org/abs/2102.09692 | paper (controlled experiment) | 2026-10-20 |
| 14 | Zamfirescu-Pereira, Wong, Hartmann & Yang, "Why Johnny Can't Prompt," *CHI '23*, DOI 10.1145/3544548.3581388 — https://dl.acm.org/doi/fullHtml/10.1145/3544548.3581388 | paper | 2026-10-20 |
| 15 | Guglielmi, Arnoudova, Bavota, Oliveto & Scalabrino, "How do Copilot Suggestions Impact Developers' Frustration and Productivity?," arXiv:2504.06808 — https://arxiv.org/html/2504.06808 | paper (study-in-design) | 2026-10-20 |
| 16 | "Fast and Forgettable: A Controlled Study of Novices…," arXiv:2604.18538, *ACM ICER 2026* — https://arxiv.org/html/2604.18538 | paper (controlled, N=22) | 2026-10-20 |
| 17 | Doo, Bonk & Heo, "A Meta-Analysis of Scaffolding Effects in Online Learning in Higher Education," *IRRODL* 21(3) — https://files.eric.ed.gov/fulltext/EJ1267049.pdf | paper (meta-analysis, 64 ES) | 2026-10-20 |
| 18 | "Exploring Interactive LLM Scaffolding to Support Learning," arXiv:2603.07277 — https://arxiv.org/pdf/2603.07277 | paper (within-subjects, N=8) | 2026-10-20 |
| 19 | Replit Docs, "Replit Agent" — https://docs.replit.com/features/agent/overview | docs | 2026-10-20 |
| 20 | Qian et al., "How to Teach Programming in the AI Era? Using LLMs as a Teachable Agent for Debugging," arXiv:2310.05292v4, DOI 10.1145/3717057 — https://arxiv.org/html/2310.05292v4 | paper (N=19 novices) | 2026-10-20 |
| 21 | Chen, Liao & Sundar, "When to Explain?…," *TAS '24*, DOI 10.1145/3686038.3686066 — https://dl.acm.org/doi/pdf/10.1145/3686038.3686066 | paper (2×2 user study) | 2026-10-20 |
| 22 | Amershi et al., "Guidelines for Human-AI Interaction," *CHI '19*, DOI 10.1145/3290605.3300233 — https://dl.acm.org/doi/abs/10.1145/3290605.3300233 | paper (18 guidelines) | 2026-10-20 |
| 23 | OpenAI, "Running Codex safely at OpenAI," 2026-05-08 — https://openai.com/index/running-codex-safely/ | blog / engineering | 2026-10-20 |
| 24 | "Vibe Coding in Practice: Motivations, Challenges, and a Future Outlook," arXiv:2510.00328 — https://arxiv.org/html/2510.00328 | paper (grey-lit review) | 2026-10-20 |
| 25 | "Can you feel the vibes?: An exploration of novice programmer engagement with vibe coding," arXiv:2512.02750v1 — https://arxiv.org/html/2512.02750v1 | paper (observational, N=31) | 2026-10-20 |
| 26 | "Vibe coding before the trend" (Fontys ICT practitioner report), arXiv:2605.07751v1 — https://arxiv.org/html/2605.07751v1 | practitioner report (n=107 reflections) | 2026-10-20 |
| 27 | Bamil, "Vibe Coding: Toward an AI-Native Paradigm…," arXiv:2510.17842v1 — https://arxiv.org/html/2510.17842v1 | paper | 2026-10-20 |
| 28 | Linear, "Interaction Best Practices" — https://linear.app/developers/agent-best-practices | docs | 2026-10-20 |
| 29 | Linear, "Triage" — https://linear.app/docs/triage | docs | 2026-10-20 |
| 30 | Huang et al., "Professional Software Developers Don't Vibe, They Control," arXiv:2512.14012v2 — https://arxiv.org/html/2512.14012v2 | paper (13 obs. + N=99 survey) | 2026-10-20 |
| 31 | Linear, "Introducing Linear Agent" (changelog, 2026-03-24) — https://linear.app/changelog/2026-03-24-introducing-linear-agent | changelog / blog | 2026-10-20 |
| 32 | Lovable Docs, "Welcome to Lovable" — https://docs.lovable.dev/introduction/welcome | docs | 2026-10-20 |
| 33 | Li et al., "Measuring User Experience Inclusivity in Human-AI Interaction via Five User Problem-Solving Styles," *ACM TOIS* — https://ar5iv.labs.arxiv.org/html/2108.00588 | paper (16 experiments) | 2026-10-20 |
| 34 | Wang et al., "Less or More: Towards Glanceable Explanations for LLM Recommendations," *IUI '25*, DOI 10.1145/3708359.3712074 — https://arxiv.org/html/2502.19410v1 | paper (user study) | 2026-10-20 |
| 35 | "Human-in-the-Loop UX: Designing AI Approvals" — https://ai-tldr.dev/learn/building-ai-apps/ai-ux-patterns/human-in-the-loop-ux/ | UX pattern | 2026-10-20 |
| 36 | Factory Docs, "auto-run" (Droid Autonomy Level: off/low/medium/high, blocklist) — https://docs.factory.ai/cli/user-guides/auto-run.md | docs | 2026-10-20 |
| 37 | Factory Docs, "Settings" (droid-cli `sessionDefaultSettings.autonomyLevel`) — https://docs.factory.com/droid-cli/settings | docs | 2026-10-20 |
| 38 | Google Antigravity Docs, "Permissions" (Turbo preset table: sandbox off, unrestricted terminal, full filesystem) — https://antigravity.google/docs/permissions | docs | 2026-10-20 |
| 39 | Google Antigravity Docs, "Terminal sandbox" (Security Preset: Turbo mode = Always Proceed) — https://www.antigravity.google/docs/sandbox | docs | 2026-10-20 |

---

## 8. Implications for vibe-fence

### 8.1 Dial spec — `fence dial <max|medium|min|silent>`

**The dial is a schema, not a length.** Every level is the same fixed block structure; the dial changes how many
blocks are filled and whether the user must answer.

| Level | Output shape | Teaching behavior | Safety content |
|-------|--------------|-------------------|----------------|
| `max` | `What I'm doing` / `Why` (≤3 sentences) / `Your call` (2 named options + trade-offs) / `What I won't do` / `How we'll know it worked` | Teaches the *why* behind every non-mechanical decision; **forces a choice** at decisions with real trade-offs; at least one `TODO(human)`-style move per session (T-05) | Never compressed |
| `medium` | `What I'm doing` / `Why` (1 sentence) / `How we'll know it worked` | Teaches only decisions with transferable knowledge; no forced choice unless the decision is irreversible | Never compressed |
| `min` | `Done` + `How we'll know it worked` + one-line "why" on request | One-line summaries; rationale available on demand | Never compressed |
| `silent` | `Done` + `How we'll know it worked` | No teaching; **teaching budget still accrues nothing — the budget is not spent, so the next `max` moment is still affordable** | Never compressed |

**Rules attached to the spec:**

1. **Safety content is exempt from every level** (T-06, verbatim precedent from Claude Code's Concise style).
   Warnings, destructive-action confirmations, failing test output, and secret exposure are always full-length.
2. **The dial is per task-class, not per user** (T-02). `max` for "add a database", `min` for "rename a button."
3. **The dial never auto-fades upward.** Only downward, only proposed, only after a fade signal (below).
4. **The dial is read at session start** (T-06) — changing it mid-task does not apply until the next task, so
   behavior never becomes incoherent mid-build.
5. **The dial auto-degrades under context pressure** (A-02). When the harness's own context utilization crosses a
   threshold, step down one level regardless of user setting, and say so.
6. **The dial is not anthropomorphic** (T-07, A-04). The agent explains; it does not mentor from a position of
   authority.

**Fade signal (the auto-step-down trigger).** T-01 says the *fading schedule* is the active ingredient. Proposed
signal: after N consecutive tasks of the same class that (a) passed their verification criterion and (b) the user
accepted without opening the explanation → propose the step down. Do not step down if the user opened the
explanation, asked a follow-up question, or the task was edited substantially by the user.

**Teaching budget (the anti-fatigue mechanism).** T-04/A-01: every teaching moment costs budget; budget decays;
"don't teach me this again" is remembered per project and per task-class. A user who repeatedly dismisses
explanations gets the budget lowered automatically. This is the mechanism that makes `silent` a *policy* rather
than a setting.

**Context-bloat rule.** A-02: teaching is paid for in the harness's own context. The `max` schema is fixed-size
by design; free-form narration is forbidden at every level.

### 8.2 Turbo contract — `fence mode [guarded|assisted|autonomous|open]`

**Turbo is not "skip the human." Turbo is "replace the human with a classifier for the action classes where a
classifier is reliable."** All three major vendors converged on this independently (U-01): Claude Code's `auto`
mode, OpenAI Codex's Auto-review mode, Cursor's Auto-review run mode.

**The name matters, and this contract does not use the word "turbo" (U-04b).** A mode named for speed reads as
*free*, while the thing behind it is a *permission* change — and for a beginner that reads as "I turned off
safety," which is exactly the reflex U-01's false-positive finding shows they already have. Google Antigravity
2.0 ships a preset called "Turbo" whose own docs table reads: sandbox **Disabled**, terminal commands
**Allowed (unrestricted)**, file access **Full filesystem** [38][39]. **Do not copy that label.** Adopt
Factory Droid's *shape* instead — a four-band **Autonomy Level** (`off`/`low`/`medium`/`high`) with a blocklist
that holds at every band [36][37] — and name the bands by the **guarantee they give**, not the speed they feel
like:

| Band | Name | Meaning | Still gated |
|------|------|---------|-------------|
| 1 | `guarded` (default) | Every action above the trivial threshold asks. | Everything. |
| 2 | `assisted` | Classifier auto-approves reversible local actions; notifies after the fact. | Irreversible + outward-facing |
| 3 | `autonomous` | Classifier auto-approves reversible + verifiable actions; plan shown, not approved. | Irreversible + outward-facing |
| 4 | `open` | Maximum: reversible + verifiable + some network destinations auto-approved. | **The permanent list below, and nothing else** |

The band must be **visible at the moment of action** and must **display what is still blocked** — because
"Turbo" promises a state the user cannot otherwise see, which is precisely what makes it unsafe for someone who
cannot read a diff.

**What the higher bands DO auto-approve (classifier decides, user is notified after the fact):**
- Reversible, local, cheap actions: file edits in the working tree, `mkdir`/`mv`/`cp`, running the test suite.
  (Claude Code's `acceptEdits`; OpenAI's "common benign commands … allowed without approval".)
- Actions whose result is verifiable by an automated check.

**What NO band auto-approves — always gates (needs a real human decision):**
- **Irreversible or outward-facing actions:** deploy to production, publish, send, delete, spend money, force-push
  to a shared branch, anything that leaves the machine.
- **Critical-path removals:** `rm`/`rmdir` on a critical path. Precedent: Claude Code never auto-approves these
  "in any mode, including `bypassPermissions`," and no allow rule or hook can override it [7].
- **Secret / credential access**, and anything that reads a `.env`, keychain, or credential store.
- **Anything with a network destination not on the allowlist.** Precedent: OpenAI's managed network policy
  "requires approval for unfamiliar domains" [23].
- **Uninstalling, changing auth, changing permissions, anything touching the harness's own config** (a
  non-technical user must not be able to remove their own safety net with one Enter key).

**What no band does (even with gate approval):**
- Disables the verification gate. Every task still needs a checkable criterion (U-03) or it is escalated.
- Disables checkpoints/rollback. Every step gets a checkpoint; rollback is one command (U-04).
- Reduces the *teaching* floor. The mode affects autonomy, not the safety-exemption rule.
- Runs more than one item concurrently in the queue (Q-02). A non-technical user can track one.

**Friction ladder (per action, not per session)** — from U-02, applied per action class:
`no confirmation` (reversible+cheap) → `notify after` (reversible+expensive) → `confirm with explicit consequence`
(hard to reverse) → `type-to-confirm` (irreversible/outward-facing). **Never a blanket confirmation, and never a
blanket skip.** A blanket confirmation trains click-through; a blanket skip removes the only control the user
had.

**The "informed, not asked" format (Q-03).** When the harness declines an action on the user's behalf, it states
the consequence, not a question:
> 🔒 Blocked `rm -rf ./data` (critical path). Say **force it** to override.

**The mode must be explicit and visible.** U-07: every population studied — including experts — wants supervision.
The mode is a *user-elected, visibly-labelled state*, never a default, and never silently entered. When a higher
band is on, the harness says so on every action it takes without asking, so the user always knows which mode
produced the output. The default band is `guarded` — matching Factory's `off` default [37] and U-07's finding
that even experts want supervision.

### 8.3 Numbered implications (copy / avoid / invent)

1. **COPY — the classifier-in-the-loop turbo architecture (U-01).** Implement turbo as "auto-review mode":
   a second model classifies the planned action and returns allow/block; the human is asked only when the
   classifier is unsure or the action class is permanently gated. This is the shipping pattern at Claude Code,
   Codex and Cursor, and it is the only way turbo scales past a handful of prompts.
2. **COPY — the permanent never-auto-approve list (U-01, U-02).** Adopt Claude Code's shape: a list of actions
   that **no mode auto-approves and no allow-rule can override** — critical-path removals, credential access,
   outward-facing actions, anything leaving the machine. This list is vibe-fence's actual product.
3. **COPY — the fixed explanation schema and the safety exemption (T-03, T-06).** One block structure at every
   dial level; safety content never compressed. Verified against a shipping precedent rather than invented.
4. **COPY — the classifier-driven deny/allow split with "security controls" vs "steering" separation (Cursor
   [3]).** The harness must be able to *block* without the model's cooperation, and the model's guidance must
   be treated as advisory. A prompt-only guardrail is not a guardrail.
5. **COPY — the plan-as-interface with editable draft and per-step verification criteria (U-03, O-03).** Plain
   language, numbered, each step with "what you'll see change" and "how we'll know it worked". Model it on
   Replit's "Accept tasks / Revise plan" affordance, not a modal.
6. **COPY — the agent-declares-itself-owns-the-item pattern and the acknowledge-fast rule (Q-01).** Emit an
   immediate "I'm on it" (Linear's 10-second rule), and make it visible that the *agent* — not the user — is
   working the item. The queue's state machine is `detected → triaged → claimed → resolved | escalated | dismissed`.
7. **COPY — the confidence-gated escalation (Q-01).** The agent resolves what it can and escalates the rest with a
   plan already attached. Do not promise 100% resolution; Linear's own honest figure is ~30% on first pass [31].
8. **COPY — the "no blanket confirmation" friction ladder (U-02).** Place each action class on the rung its
   blast radius earns. If everything asks, the user stops reading; if nothing asks, the user has no control.
9. **AVOID — a verbosity slider (T-03, A-02).** Length is the wrong axis. Structured blocks reduce
   time-to-action and cognitive load; narration is pure cost. More importantly, explanations alone **do not reduce
   overreliance and may increase it** [13] — so a verbose harness can be *less* safe than a terse one.
10. **AVOID — the "tell the user we have their back and rely on their vigilance" design (U-05).** Automation bias
    "cannot be prevented by training or instructions" and occurs in naive *and* expert participants [4][5]. The
    architecture must carry the safety. A modal "Allow this command? [Y/n]" converts the user into the security
    control, which is precisely the role a non-technical user cannot discharge under time pressure.
11. **AVOID — the harness resolving everything, always (A-03, A-05).** The controlled evidence says AI gives
    novices the performance but not the learning, and that the AI teammate produces measurably *less positive*
    emotion than a human [16]. A companion that never lets the user touch anything is helplessness with a
    friendly voice. The agent must be able to decline to act, and to dismiss a queue item with a reason.
12. **AVOID — anthropomorphic companion framing as a persona spec (T-07, A-04).** No mentor/evaluator/authority
    posture. Warm and specific in tone; honest about what it checked and what it did not.
13. **AVOID — turbo as the default, or turbo as a silent state (U-07).** Experts with 20 years of experience
    "control" agents rather than delegate to them. Turbo must be elected, labelled, and visibly indicated on
    every unattended action.
14. **AVOID — the word "turbo" as a user-facing mode name (U-04b).** Antigravity's own docs show what the name
    hides: sandbox off, unrestricted terminal, full filesystem. For a non-technical user, a mode named for speed
    reads as *the removal of a cost*, when what actually changes is the *guarantee*. That is the same
    misreading that produces `--dangerously-skip-permissions`. Name the bands by what they **guarantee**
    (`guarded` / `assisted` / `autonomous` / `open`), show which actions remain gated in the band label itself,
    and keep the permanent never-auto-approve list visible in every band. The *concept* can still be called turbo
    in internal docs — but the string the user sees should not.
15. **AVOID — concurrent queue items (Q-02).** Assume the user can track exactly one in-flight item. This is
    judgment, not evidence, but the cost of being wrong is high and the cost of being conservative is low.
16. **INVENT — the teaching budget (T-04, A-01).** A per-project, decaying budget of teaching moments, with
    per-task-class suppression memory. The harness spends from it; the budget governs whether it explains at
    all, independent of the dial. No shipped product has this, and it is the direct implementation of Steyvers &
    Mayer's engagement model. This is the most defensible original contribution in the stream.
17. **INVENT — the reliability-conditional pre/post explanation rule (T-09).** The harness knows its own
    uncertainty. When uncertainty is high, pre-explain the approach and the risk so the user can catch a wrong
    direction early; when it is low, lead with the result and offer the rationale. Never compress a pre-explanation
    into a post-explanation. Rule is derived from a 2×2 controlled study and adapted; no product ships it.
18. **INVENT — the user-facing "protection log" (Q-03, U-02).** Every gated or blocked action is appended to a
    plain-language log: what I did, what I stopped, what it would have cost, how to override. This is the concrete
    form of "the user doesn't decide on security — they're informed the harness has their back," and it is
    auditable after the fact — which the alert-fatigue literature says matters, because desensitized users can't
    catch the live warning but can read the record.
19. **INVENT — the "one working thing" first-run contract (O-01, O-02).** Guarantee: within the first session the
    user has one artifact that runs, on a URL, with one button they clicked. The harness absorbs the prompt
    entirely (O-04) and the filesystem entirely (Fontys: the beginner's blocker was not the concept, it was
    finding the project on their own computer [26]). Teaching about the artifact comes *after* the artifact.
20. **INVENT — the divergent-option step before the first build (A-03b).** The hackathon study found "premature
    convergence in ideation." Before implementing the user's first idea, the harness offers one alternative and
    says in one line why. Cheap, and it is the specific antidote to the observed failure mode.
21. **INVENT — a "teach-back" verification for `max` on irreversible actions (T-05 + T-03).** Before the
    harness performs an irreversible action, it asks the user to state, in their own words, what will happen.
    This is the one place where the cognitive-forcing literature's most effective intervention [13] is worth its
    friction cost — because it is the only point where the user's answer changes the outcome. Everywhere else,
    the forcing would be nagging.
22. **MEASURE — four metrics that are not "user happiness" (A-05, U-05, T-08).** (a) *Perceived control*, which
    the inclusivity work shows is the variable that moves with trust, suspicion and certainty in tandem [33];
    (b) *Explanation dismissal rate* per task class, as the alert-fatigue early-warning signal [8]; (c) *Gate
    override rate* — the fraction of times the user approves a gated action, which reveals both over-blocking
    and blind approval; (d) *Time-to-first-verified-artifact*, the onboarding metric that matters [25][26]. If
    the harness is not measuring these, it cannot claim the teaching is working.
23. **BUILD — the reliability budget as a harness invariant.** Because automation bias produces both omission
    and commission errors when the decision aid is imperfect [4], and because vibe-fence's value is precisely
    that it is imperfect, the harness must report its own confidence on every claim it makes and must never state
    an outcome it did not verify. Claude Code's rule is the right one: **"Have Claude show evidence rather than
    asserting success"** — the test output, the command it ran and what it returned, or a screenshot [11].
