# Stream 05 — Companion UX: Teaching Dial & Turbo

- **Model:** muse-spark
- **Provider:** Meta via Hermes (ollama-launch)
- **Date:** 2026-10-20
- **Stream:** 05 — Companion UX (Teaching Dial, Turbo, Issue Queue, Anti-patterns, Onboarding)

---

## 1. Teaching Dial (max → medium → min → silent)

### Finding T-01 — Scaffolding / fading is the canonical model for the dial

- **Claim:** Instructional scaffolding — provide heavy structure early, then systematically withdraw it as competence grows — is the established learning-science framework for exactly what the teaching dial does. The dial's four levels map to stages of scaffolding fade.
- **Evidence:** Reiser & Tabak, "Scaffolding" in *Cambridge Handbook of the Learning Sciences* (2014, updated ed.) defines scaffolding as temporary supports that are faded as learners internalize skills. PEA framework (diagnosis → support → fade) formalizes the lifecycle. NSW CSES review of cognitive load theory (2017) synthesizes fading worked examples → completion problems → independent practice as the validated progression. — URLs: `cambridge.org/core/books/abs/.../scaffolding` and `education.nsw.gov.au/.../2017-cognitive-load-theory.pdf` (accessed 2026-10-20)
- **Strength:** `proven` — meta-analytic support across STEM domains; scaffolding effect sizes d≈0.4–0.7 in Hattie syntheses.
- **Fit for vibe-fence:** The dial IS scaffolding fade formalized. `max` = full worked-example (code + concept + rationale). `medium` = completion scaffolding (key decisions + "why this matters"). `min` = self-explanation prompts (one-liners that nudge reflection, not lectures). `silent` = autonomous performance. Transition rule: default newcomers to `max`; auto-suggest lowering after N consecutive successful verifications (see T-06).

### Finding T-02 — Worked examples → expertise reversal demands the dial exist at all

- **Claim:** Novices learn best from fully worked examples; experts learn best when those examples are REMOVED (expertise reversal effect). A fixed explanation verbosity harms one group or the other. Any static "explain everything" or "explain nothing" design is wrong for a heterogeneous user base.
- **Evidence:** Kalyuga et al. (2003) demonstrated expertise reversal in ISI; Sweller et al. *Cognitive Architecture and Instructional Design* (1998) and Sweller 2010 update formalize worked-example → problem-solving fade. Pearson Learning Design Principles summary (c. 2016) explicitly recommends: "Provide scaffolding and support so they can succeed... then fade." Bjork & Bjork (2011) "Creating Desirable Difficulties" distinguishes learning vs. performance — extra explanation can inflate perceived performance while reducing long-term learning for non-novices. — Sources: `pearson.com/.../Pearson-Learning-Design-Principles...pdf`, `bjorklab.psych.ucla.edu/.../EBjork_RBjork_2011.pdf` (accessed 2026-10-20)
- **Strength:** `proven`
- **Fit for vibe-fence:** **Dial level mapping:** `max` = worked example (show code + concept + analogy for every decision). `medium/min` = faded scaffolding (show only the decision that carries transferable knowledge). `silent` = no instructional overhead (respects expertise reversal). The harness must NEVER force max on users who have demonstrated competence — it should offer to step down.

### Finding T-03 — Desirable difficulties: the dial must not eliminate all struggle

- **Claim:** Some difficulty improves retention. Spaced, interleaved, and effortful retrieval beats passive re-reading. An AI companion that explains everything before the user ever struggles produces fluent comprehension but poor retention (the "illusion of knowing").
- **Evidence:** Bjork (1994) coined "desirable difficulties"; Roediger & Karpicke (2006) retrieval practice; BjorkLab UCLA summary (2011). Applied to AI tools: Bastani et al. (2024) "Generative AI Can Harm Learning" — students with GPT-4 access during practice performed *worse* on subsequent unassisted tests. — `bjorklab.psych.ucla.edu/...desirable difficulties...` and `arxiv.org` Generative AI Can Harm Learning (accessed 2026-10-20)
- **Strength:** `proven`
- **Fit for vibe-fence:** At `max` and `medium`, teaching moments should include **retrieval prompts** ("we added input validation — why do you think we rejected empty strings before saving?") rather than only declarative explanations. At `min`/`silent`, omit them — the user has signaled they want throughput over pedagogy. Dial-aware prompt template: max = "explain + quiz", medium = "one-line why", min = "one-liner only on novel patterns", silent = "no teaching injection."

### Finding T-04 — Progressive disclosure (UX) and layered explanations (AI-XAI)

- **Claim:** Good product UX hides complexity in layers; good AI explanations are similarly layered. Both fields converge: show the minimum that enables the next action; offer "tell me more" affordances rather than dumping everything.
- **Evidence:** Nielsen Norman Group progressive disclosure guidelines (ongoing; `nngroup.com/articles/progressive-disclosure`); XAI "layered explanation" pattern in Abdul et al. (2018) COGAM; Vercel v0 prompting guide (2025-12-15, `vercel.com/blog/how-to-prompt-v0`) demonstrates the inverse — structured inputs (product surface + context of use + constraints) produce better outputs than freeform chat, implying the harness should similarly structure what it shows back. — accessed 2026-10-20
- **Strength:** `practiced` (industry consensus; XAI empirical support is `contested` on whether layered explanations actually improve trust calibration)
- **Fit for vibe-fence:** **Dial mapping:** `max` = expanded card (what + why + concept link + "learn more" doc link). `medium` = collapsed card (what + one-line why; expand on demand). `min` = timeline badge/emoji annotation only. `silent` = log entry only. Each level must support opt-in "show me more" — never trap a user at a lower verbosity when they want to learn in the moment.

### Finding T-05 — Trust calibration: over-explaining erodes trust; under-explaining breeds mistrust

- **Claim:** Explanations must calibrate appropriate reliance. Too much explanation signals uncertainty ("why is it justifying so much?"); too little hides reasoning that would catch errors. Both miscalibrate trust.
- **Evidence:** Sanneman & Shah (2023) "Trust, distrust, and appropriate reliance in (X)AI" (`arxiv.org/html/2312.02034`), Jacovi et al. (2021) "Formalizing Trust in AI"; OUP JAMIA 2025 review "Calibrating appropriate trust and reliance in AI" (`academic.oup.com/jamia/article/33/8/1554`). — accessed 2026-10-20
- **Strength:** `proven` in lab studies; `contested` in field deployment (context-dependent)
- **Fit for vibe-fence:** Dial-aware trust signal: at `max`, include confidence ("I'm confident here because X tests pass"); at `medium/min`, only surface confidence when LOW ("heads up: I inferred this from naming — double-check"). Silent omits calibration entirely — appropriate only when the user has explicitly opted out of oversight.

### Finding T-06 — How other companions tier explanations: precedent is ad hoc, not principled

- **Claim:** Replit Agent, Cursor, Claude Code, and Lovable/Bolt/v0 do not implement a formal teaching dial. They vary explanation depth implicitly (plan mode vs. execution; toggleable verbosity; scaffolding that fades only via user prompt sophistication). This confirms the gap vibe-fence fills.
- **Evidence:**
  - Replit Agent has "Plan mode" (agent plans → user reviews before file changes) vs. normal execution; plus task plan cards with success criteria/out-of-scope/steps reviewed via `docs.replit.com/learn/build-with-agent` (accessed 2026-10-20). No per-user verbosity control.
  - Claude Code has permission modes `default → acceptEdits → plan → auto → dontAsk → bypassPermissions` (`code.claude.com/docs/en/permission-modes`); `auto` delegates to a classifier subagent. This is an *autonomy* dial, not a *teaching* dial — explanations and permissions are conflated.
  - Cursor has Ask / Edit / Agent + YOLO/Auto-review; Auto-review (Cursor 3.6, May 29 2026) adds allowlist → sandbox → classifier pipeline (`cursor.com/docs/agent/security/run-modes` + `cursor.com/changelog/auto-review`). See T-06 variant: no teaching tier.
  - Lovable/Bolt/v0 vary by user sophistication implicitly: Lovable plans before building ("Chat Mode guides feature development through conversational planning" — `lovable.dev/guides/lovable-vs-bolt-vs-v0`), Bolt exposes raw diffs for code-comfortable users. Onboarding is single-path, not leveled. — all accessed 2026-10-20
- **Strength:** `practiced` (observed product behavior)
- **Fit for vibe-fence:** Invent: vibe-fence is first to decouple **teaching verbosity** (max→silent) from **autonomy** (turbo gating). Competitors conflate them; we separate them into orthogonal axes. Teaching dial = "how much you learn"; turbo = "how often you approve." A user can be `silent` + gated, or `max` + turbo.

---

## 2. Turbo Mode (autonomy vs. safety)

### Finding U-01 — Three-tier approval (auto / notify / gate) is the consensus pattern

- **Claim:** The robust pattern across production agent literature is not a binary auto vs. ask-everything, but three tiers keyed to consequence × reversibility, not action type.
- **Evidence:** MenuAgentic "Approval & Confirmation UX" playbook (2026) proposes: Auto (reversible, low blast radius) → Notify (reversible, consequential, one-click undo) → Gate (irreversible / high blast radius, explicit approval). BetterClaw guardrails essay (2026-06-11, `betterclaw.io/blog/ai-agent-human-approval-guardrails`) codifies: "The boundary between auto-approve and wait for human IS the entire engineering problem." Alitajer (July 2026, `alitajer.com/blog/agentic-ux-patterns`) catalogs 55 agentic UX patterns organized into tiers: Tier 2 = reversible work in bounded space; Tier 3 = consequential external action. Anthropic's Claude Code permission modes instantiate this as product. — all accessed 2026-10-20
- **Strength:** `practiced` (convergent across independent sources)
- **Fit for vibe-fence:** Adopt the three-tier model as the turbo contract's foundation. Map tiers to vibe-fence enforcement levels (block/warn/nudge from Stream 04). See turbo contract in Implications.

### Finding U-02 — Cursor & Claude Code prove binary extremes fail; middle tier wins

- **Claim:** "YOLO / Run Everything" and "ask on every tool call" both produce abandonment. Real practitioners want longer uninterrupted runs with a probabilistic filter + sandbox, not a security guarantee.
- **Evidence:** Cursor community post (Oct 2026, `dev.to/dzhuneyt/cursor-auto-review-vs-yolo-picking-the-middle-safety-tier-1d2b`): "The sane default is not 'ask always' or 'ask never.' It is a middle tier configured once and revisited." Cursor 3.6 Auto-review default and Claude Code auto mode (Mar 24 2026) both moved the default away from extremes. Cursor docs explicitly: classifier is "non-deterministic and not a security boundary." The sane posture is convenience filter + sandbox, not compliance gate. — accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Turbo rule:** turbo is the middle tier (auto-review), not YOLO. YOLO (`bypassPermissions` equivalent) must be explicitly impossible to enable accidentally — require `fence turbo --yolo --i-understand` with a visible warning. Day-to-day turbo = tiered approval with payload pinning (Finding U-05). Beginners should never encounter YOLO; it is hidden behind a config flag.

### Finding U-03 — Dry-run / plan preview is the most effective turbo companion

- **Claim:** Showing the plan before acting — and letting the user approve the plan once rather than each step — preserves both speed and oversight. It converts N approvals into 1.
- **Evidence:** Claude Code plan mode (research phase where agent explores a codebase before changing it; `code.claude.com/docs/en/permission-modes`); Replit Agent Plan mode with Review Now banner and expanded plan showing success criteria/out-of-scope/steps (`docs.replit.com/learn/build-with-agent`); Manolachi "How to Build a Dry-Run Mode for an AI Agent" (`mariusmanolachi.com/..., 2026) — "Scope chooses the boundary. Dry-run makes the intended effect reviewable." Moai Team "AI Agent UX Patterns for Production" (`moaiteam.com/blog/ai-agent-ux-patterns`). Agentic UX checklist (Alitajer) lists "plan preview before bulk changes" as core pattern. — accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Turbo rule:** when turbo is ON, the harness auto-generates a plan artifact (`.fence/plans/<task>.md`) and auto-approves it after a brief dwell (e.g., 3s countdown with abort affordance) unless the plan touches a gated tier (security, deploy, destructive git). For gated items, plan still requires explicit approval even in turbo. This gives "press enter and go" feel while preserving safety.

### Finding U-04 — Gated critical actions: "turbo but not for X" is the expected mental model

- **Claim:** Users accept "turbo everywhere except..." — they expect security, money, and deploy to always gate. The category that must never be auto-approved is consistent across sources.
- **Evidence:** MenuAgentic tier model singles out "money movement, external email, deletes, production deploys" as Gate-tier. BetterClaw uses refund authorization as canonical example. Alitajer Tier 3 = "sending messages, changing customer records, publishing, booking." Cursor docs: even in Auto-review, certain filesystem/network actions route to classifier or prompt. Lovable's mandatory pre-publish security scan (can't deploy without passing) is the vibe-coding analog. — all accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Turbo contract (never auto-approves):** secrets handling, auth changes, dependency additions with CVEs, database migrations in production, git push to main, any deploy, file deletion, and external network/email. See full contract in Implications. This matches the "turbo but not for security/deploy" promise in the plan brief.

### Finding U-05 — Payload pinning: approve the bytes that will run

- **Claim:** The most common HITL bug is re-planning between approval and execution — the user approves one payload; a different payload runs. This silently voids oversight.
- **Evidence:** MenuAgentic playbook Step 2: "Pin the approved payload, or you are confirming a different action than the one that runs." Proposes hashing payload at interrupt, verifying hash at execution, treating drift as hard failure. — `menuagentic.com/playbooks/agent-ux-and-human-interaction/approval-and-confirmation-ux` (accessed 2026-10-20)
- **Strength:** `practiced` (production incident pattern)
- **Fit for vibe-fence:** **Turbo rule:** any gated plan that the user approves is frozen (hash written to `.fence/queue/<id>.lock`). If the agent's queue resolver re-derives a different plan, it must re-queue for approval, not silently proceed. Especially important because the queue is "agent resolves itself" — without pinning, self-resolution reintroduces autonomy bypass.

### Finding U-06 — Batch & defer to fight decision fatigue

- **Claim:** Ten sequential approvals become reflexive clicks. Aggregating homogeneous decisions and deferring interrupts to natural breakpoints preserves meaningful oversight.
- **Evidence:** MenuAgentic Step 3: "Batch and defer to fight decision fatigue." Alitajer patterns: batched approvals for homogeneous low-stakes actions. Replit Agent's task-based workflow ("breaks requests into discrete chunks you can review and approve before anything merges" — `stackbuiltai.com/replit-agent-4-review-2026`, 2026-03-21) is a batching strategy. — accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Turbo rule:** queue batches related low-risk fixes (e.g., 12 lint/style issues → one approval). Security/deploy items are NEVER batched with non-security items — they get isolated cards. Queue coalescing runs before surfacing to user.

---

## 3. Issue → Solution → Plan Queue UX

### Finding Q-01 — The queue must be structured (issue→solution→plan), not a notification dump

- **Claim:** Raw issue lists overwhelm non-technical users. The pattern that works is: each finding is a structured item containing the problem, the proposed fix, and the executable plan — so the user (and agent) can reason about one item at a time.
- **Evidence:** Linear's issue model (title + priority + project + status + assignee; `linear.app/docs`) and GitHub Issues with templates show that structure enables triage. Claude Code's plan-file pattern (`.fence/plans/*.md` analog: Claude writes a plan artifact for review before acting) shows agents can be plan-producers, not just executors. Replit Agent's "task plan is ready for review" banner with expanded success criteria / out-of-scope / steps is the closest non-technical analog (`docs.replit.com/learn/build-with-agent`). — all accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Queue shape (proposed schema):**
  ```yaml
  # .fence/queue/<id>.yaml
  issue: "API key found in committed file src/config.ts"
  severity: block   # block | warn | nudge
  solution: "Move to .env + .env.example, rotate key, add git-secrets hook"
  plan: ".fence/plans/<id>.md"  # executable steps the agent will take
  status: queued | approved | in_progress | done | dismissed
  auto_resolvable: true   # agent can resolve once approved; user never triages
  teaching_note: { max: "long explanation...", medium: "one-liner...", min: "badge" }
  ```
  The user sees cards, not logs. The agent is the assignee.

### Finding Q-02 — Agent as assignee: "the agent itself resolves" needs explicit UX

- **Claim:** Assigning queue items to the agent (not the human) is a novel UX contract. It must be made legible or users will assume they need to act.
- **Evidence:** Alitajer's pattern "Action attribution and disclosure" — mark who produced content/actions (agent, human, system). Replit Agent's framing: "You are the coach... Agent is the quarterback" (`docs.replit.com/learn/build-with-agent`) — explicitly models agent autonomy with human strategy. BetterClaw's "which specific actions need approval" framing assumes agent as default actor with human as approver. No existing product fully implements "agent triages and resolves its own findings queue" — vibe-fence invents this, but these precedents make it legible. — accessed 2026-10-20
- **Strength:** `contested` — novel composition; individual pieces are `practiced`
- **Fit for vibe-fence:** **Queue UX rule:** each card shows "Agent will fix this when you approve" (or "Agent fixed this automatically" for nudge-tier). Dismiss is explicit. The queue is pull-based (agent resolves on next invocation) with an optional `fence fix --all-warn` bulk command. The mental model to teach (at max/medium): "the fence found chores; approve them and the agent does them."

### Finding Q-03 — Queue coalescing and priority ordering prevent queue bloat

- **Claim:** Without deduplication and priority sorting, the queue grows without bound and becomes another fatigue source. Linear/GitHub both invest heavily in deduplication, priority, and project grouping for this reason.
- **Evidence:** Linear priority levels (Urgent/High/Medium/Low) + project grouping; GitHub issue templates + labels. Replit Agent "breaks requests into discrete chunks you can review and approve before anything merges" — chunk count is bounded per turn, not open-ended. — accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Queue rules:** (1) Deduplicate on rule ID + file fingerprint (re-scanning the same file doesn't create a new card). (2) Order by severity (block → warn → nudge), then by file centrality. (3) Cap visible queue to 8 items; overflow goes to "and N more — run `fence queue`." (4) Auto-close cards that become irrelevant (fix applied manually, file deleted).

### Finding Q-04 — Checkpoints + rollback give the queue a safety net

- **Claim:** Auto-fixes are only acceptable if rollback is one click. Replit's checkpoint system (full project snapshot including DB + AI context; rollback is non-destructive preview → instant restore) is the gold standard for non-technical undo.
- **Evidence:** `docs.replit.com/features/version-control/checkpoints-and-rollbacks`: checkpoints capture files + AI context + environment + database; rollbacks are safe, predictable, one-click. StackBuilt AI review (2026-03-21): rollbacks called out as key safety feature for vibe-coders. Git auto-commit before queue resolution is the minimal equivalent. — accessed 2026-10-20
- **Strength:** `practiced` (Replit validated at scale)
- **Fit for vibe-fence:** **Queue rule:** before the agent executes any queued plan, create a fence checkpoint (`git stash` or `git commit --fence-checkpoint` + `.fence/state` snapshot). Surface "Undo last fix" in queue UI. Without undo, users will never trust auto-resolution.

---

## 4. Anti-patterns

### Finding A-01 — Notification / confirmation fatigue → blind approval

- **Claim:** The most documented failure mode of "helpful" agents is confirmation fatigue: users stop reading prompts and reflexively approve, which is worse than no confirmation at all. Any design that asks too often about low-consequence actions manufactures this.
- **Evidence:** MenuAgentic: "A confirmation dialog is only oversight if a human meaningfully evaluates what they approve. Most deployed approval flows do not clear that bar." BetterClaw: "Fully supervised agents are safe and useless... you added a middleman between the human and the task." Cursor community post documents "stack dozens of approval prompts" → teams either babysit or abandon agents. — all accessed 2026-10-20
- **Strength:** `proven` (lab + field convergent; classic HCI finding since Smetters & Grinter 2002 on warning fatigue)
- **Fit for vibe-fence:** **Avoid:** confirm-before-any-write. **Dial/turbo implication:** `max` teaching ≠ `max` interruption. Max teaches verbosely but still auto-approves nudge-tier queue items. Interruption frequency is governed by turbo tier (severity-gated), not dial level. Orthogonal axes prevent "max = naggy" misconception.

### Finding A-02 — Context bloat: verbose teaching poisons the agent's own window

- **Claim:** Teaching verbosity consumes context that the agent needs to do the actual task. Anthropic's best-practices guide for Claude Code names context window as the #1 resource to manage: "performance degrades as it fills... the most important resource to manage."
- **Evidence:** `code.claude.com/docs/en/best-practices` (accessed 2026-10-20): "Claude's context window holds entire conversation... a single debugging session might consume tens of thousands of tokens... Claude may start forgetting earlier instructions." This generalizes: every token spent on teaching is a token not spent on task state. — accessed 2026-10-20
- **Strength:** `proven` (Anthropic internal + user reports; generalizable LLM property)
- **Fit for vibe-fence:** **Dial implication:** teaching content must be stored in `.fence/learn/<topic>.md` (on-disk, out-of-window) with only a pointer injected into active context. At `max`, inject full note; at `medium/min`, inject one-liner + file pointer; at `silent`, inject nothing. The queue's `teaching_note` is keyed by dial level for this reason — harness loads only the level-appropriate note.

### Finding A-03 — Learned helplessness / overreliance / automation bias

- **Claim:** Over-eager assistance produces users who stop thinking — "learned helplessness." AI-specific variants: automation bias (over-trust in AI outputs), AI overreliance eroding skill.
- **Evidence:** Bastani et al. (2024) "Generative AI Can Harm Learning" field experiment with GPT-4 tutoring; multiple 2025-2026 arXiv surveys on "AI overreliance in higher education" (`arxiv.org/html/2506.13845`), "Anthropomorphic AI and the Paradox of Automation" (`arxiv.org/html/2601.06172`), and IRIS automation-bias retrospective (2025). All converge: when AI does the work, human skill atrophies unless the design actively requires engagement. — accessed 2026-10-20
- **Strength:** `proven` for tutoring contexts; `practiced` concern for coding companions
- **Fit for vibe-fence:** **Dial implication:** `max` must include transfer checks ("can you explain back why we did X?") for key concepts, not just lectures — lecture-only produces passivity. Turbo must NOT auto-approve learning opportunities (e.g., first time a security pattern appears, force a teaching moment even in turbo). The spec's **transfer threshold** (e.g., "seen X concept 3 times? step down dial for X") prevents perpetual scaffolding. Also: never auto-dismiss queue items; approval always requires an explicit user gesture (even if bulk).

### Finding A-04 — Dark patterns in "helpfulness": hidden data collection, scare tactics, soft coercion

- **Claim:** A companion that "has your back" can slide into dark patterns: silently collecting data to personalize, using scare language ("CRITICAL vulnerability!") to push approvals, or nagging until the user complies.
- **Evidence:** Alitajer anti-patterns section (July 2026): "dark patterns in helpfulness" includes hiding assumptions, asking for more access than needed, showing activity without direction. General dark-pattern taxonomies (Brignull) classify nagging and confirmshaming. The harness's positioning — "the user doesn't decide on security — they're informed the harness has their back" — must avoid paternalistic framing that removes agency. — accessed 2026-10-20
- **Strength:** `practiced` (industry-recognized ethical risk)
- **Fit for vibe-fence:** **Avoid:** scary language for nudge-tier items; silent data exfiltration; infinite "are you sure you want to dismiss?" loops. **Instead:** plain severity language ("we'll handle this" vs. "you should look at this"), one-click dismiss with optional "don't ask again for this rule" (recorded in `.fence/config.yaml`), and an explicit privacy statement: queue state is local-only, nothing leaves the repo.

### Finding A-05 — "Be helpful" without a metric is not a finding — measurability requirement

- **Claim:** Vague helpfulness goals produce untestable designs. Each dial/turbo behavior must have an observable outcome.
- **Evidence:** Meta-evaluative: Alitajer's anti-patterns-and-metrics section proposes measuring delegation success (task completion without intervention) and correction rate. Replit Agent evaluation leans on time-to-deployed-app (12 min for habit tracker — `stackbuiltai.com/replit-agent-4-review-2026`). Vibe-fence evaluation should analogously instrument. — accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** Each dial level has a logging contract (what was taught, what was skipped) so Phase 2 evals can compare retention/throughput tradeoffs. See dial spec logging rows.

---

## 5. Onboarding (first 5 minutes for someone who has never coded)

### Finding O-01 — The non-coder funnel: one prompt → running preview → one guided fix

- **Claim:** Lovable, Bolt, and v0 converge on a zero-install, one-prompt-to-preview funnel. The critical onboarding moment is the first visible result (working UI), not an explanation of how the tool works.
- **Evidence:** TechPoint Africa hands-on review (2025-08-29, `techpoint.africa/guide/lovable-vs-bolt-vs-v0-review/`): "None of the tools require downloads, and onboarding is quick and easy. They all offer chat-based prompting [and] support file uploads and Figma integration." Bolt's intro page (`support.bolt.new/get-started/intro-bolt`): "Type your idea into the chat, click Build now, and Bolt transforms your idea into a working product... Nothing to install: Bolt runs in your browser." Lovable guide (`lovable.dev/guides/lovable-vs-bolt-vs-v0`): "Turn descriptions into full-stack applications that you can edit visually through Visual Edits or with code." Vercel v0's 30-40% faster generation with structured prompts (`vercel.com/blog/how-to-prompt-v0`) shows guided input improves outcomes. — all accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Onboarding (`max` default):** `npx vibe-fence init` must produce a visible win within 60 seconds: scan → show 2–3 easy findings as cards ("we noticed X → here's the fix") → user approves one → agent fixes → green check. This is the "first 5 minutes" proof that the fence is a companion, not homework. The empty-state UI should show a friendly placeholder when no issues exist ("all clear — keep building").

### Finding O-02 — Guided vs. open-ended onboarding: non-coders need a paved path

- **Claim:** Non-coders fail in blank-canvas onboarding ("what do I do?") and thrive with a guided tour / next-step prompt. Replit Agent, Lovable, and v0 differ on this axis.
- **Evidence:** Replit Agent's five habits (be specific, plan the work, add context, review and test, use checkpoints) are onboarding guidance baked into docs (`docs.replit.com/learn/build-with-agent`). Lovable's Chat Mode "guides feature development through conversational planning" (structured planning before building). Bolt's approach is more open-ended but adds "Build now" as a clear CTA. Lovable's mandatory pre-publish security scan (`lovable.dev/guides/lovable-vs-bolt-vs-v0` comparison table) bakes safety into the funnel rather than explaining it. — all accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** **Onboarding design:** after `init`, vibe-fence prints a 3-step paved path: "1) Keep building as you normally do — the fence watches. 2) When it finds something, you'll see a card. 3) Approve it and the agent handles it." At `max`, include a 30-second interactive tour (`fence tour`) that triggers one mock finding + fix to teach the card UX. At lower dials, skip the tour. This maps to T-01 scaffolding: heavy guidance on day 0, fade to ambient.

### Finding O-03 — Install friction is the funnel killer for non-coders

- **Claim:** Every extra step before value halves conversion. For non-coders, install is not "npm install" — it's permissions anxiety, terminal fear, and trust ("is this safe to run?"). One-command install with immediate visible effect is table stakes.
- **Evidence:** Stream 01 will cover harness install friction in depth; cross-reference: harnesses requiring manual file copying or multi-step setup (Cursor rules, OpenCode plugins) see lower adoption among non-coders than zero-install browser tools (Bolt, Lovable, v0) which dominate "no download required" messaging. Replit Agent's "nothing to install" and "browser-based" positioning is explicitly non-coder-targeted. The PLAN.md promise is `npx vibe-fence init` → drops `AGENTS.md`, `.fence/` state, skills — a single command with visible artifacts the user can verify. — accessed 2026-10-20
- **Strength:** `practiced` (industry consensus; no single paper)
- **Fit for vibe-fence:** **Onboarding rule:** `init` must be idempotent and non-destructive (never overwrite user files without explicit confirmation; write only to `.fence/` + append to `AGENTS.md`). First run prints what was created and what each file does in one line each — no README dump. Dial level is set during init via a friendly prompt: "How much explaining do you want? → Lots / Some / Just highlights / None — you can change this anytime with `fence dial <level>`."

### Finding O-04 — Visual + conversational editing as non-coder enablers

- **Claim:** Lovable's differentiator is Visual Edits (point-and-click changes without credits) alongside Chat Mode; v0 and Bolt are more code-first. For non-coders, visual affordances lower the floor more than chat alone.
- **Evidence:** `lovable.dev/guides/lovable-vs-bolt-vs-v0` feature table: "Visual Editor: Lovable = Point-and-click (no credits) | Bolt = No | v0 = No." Same page: "Marketing managers can adjust button colors and text while developers handle complex functionality — both teams work in the same project." `major.build/blog/lovable-vs-bolt` (2026) summary: Lovable = design-first for non-coders, Bolt = code-first for developers. — accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** Vibe-fence itself is not a visual editor, but its **queue UX can have visual polish**: cards with color-coded severity (red/orange/gray), one-click approve/dismiss, progress indicator during agent resolution, green done state. This mirrors the visual affordances non-coders expect from Lovable. Dial level affects card verbosity, not card presence — even `silent` users see cards, just with minimal text. See dial spec.

### Finding O-05 — Onboarding telemetry: measure "time to first approved fix," not installs

- **Claim:** The onboarding success metric is activation (user approved and saw a fix land), not installation. This aligns with activation metrics in SaaS onboarding generally.
- **Evidence:** Replit Agent review benchmarks "12 minutes from plain-English description to deployed app" as the headline result — outcome-gated, not install-gated. Alitajer anti-patterns section warns against measuring delegation by "least human involvement" and proposes "right amount of initiative for the situation" as the yardstick. — accessed 2026-10-20
- **Strength:** `practiced`
- **Fit for vibe-fence:** Instrument onboarding funnel: `init` → first scan → first card shown → first approval → first fix verified. Drop-off point diagnoses onboarding failure (did they never see a card? never approve? approve but fix failed verification?). Log dial level alongside to test hypothesis that `max` onboarding has higher activation for true beginners but higher drop-off for returners.

---

## 6. Synthesis Helpers

### Gaps / Unknowns

1. **Dial transition trigger:** No empirical data on when to suggest stepping down the dial. Options: N consecutive green verifications, user-explicit, time-based, or mastery quiz. The scaffold fading literature recommends fading when the learner demonstrates independent performance, but exact thresholds are domain-specific. Vibe-fence should A/B test "auto-suggest after 5 consecutive verified fixes" vs. "ask at end of session" in Phase 2 evals.
2. **Turbo dwell time:** How long should the auto-approve countdown be for non-gated plans in turbo? No precedent beyond "brief dwell with abort affordance." Propose 3–5s; validate that users can actually read + abort in that window.
3. **Multi-user teams:** All queue/teaching research assumed single user. How dial/turbo behave when two people share a `.fence/` state is undefined. Defer to per-developer `fence dial` (personal) vs. per-repo `fence turbo` (shared) split.
4. **Accessibility of card UX:** Visual-heavy queue cards (color-coded severity) must meet WCAG contrast and non-color indicators. No existing vibe-coding queue UX has been audited for screen-reader/VoiceOver use with non-coder audiences.
5. **Silent mode safety:** Whether `silent` users should still receive block-tier teaching (forced explanation for security) is a policy decision. This spec requires it (turbo contract: security always teaches one line even in silent — see Implications) but teams may want a "truly silent" escape hatch for CI.
6. **Learning retention measurement:** No standard exists for measuring whether vibe-coders *learned* from harness explanations. Candidate proxies: can user fix a similar issue unassisted next time (transfer test)? Phase 2 evals should include a simple transfer task.

---

## 7. Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| 1 | Reiser & Tabak — Scaffolding, Cambridge Handbook of the Learning Sciences (2014+) — cambridge.org | paper/chapter | 2026-10-20 |
| 2 | NSW CSES — Cognitive Load Theory: Research that teachers really need to understand (2017) — education.nsw.gov.au (PDF) | gov review | 2026-10-20 |
| 3 | Pearson — Learning Design Principles: Desirable Difficulty & Scaffolding (c.2016) — pearson.com (PDF) | industry research | 2026-10-20 |
| 4 | Bjork & Bjork — Creating Desirable Difficulties to Enhance Learning (2011) — bjorklab.psych.ucla.edu | paper | 2026-10-20 |
| 5 | Bastani et al. — Generative AI Can Harm Learning (2024) — Wharton/UPenn field experiment | paper | 2026-10-20 |
| 6 | Kalyuga et al. / Sweller — Expertise Reversal Effect (2003; Sweller 2010) — sciencedirect / springer | paper | 2026-10-20 |
| 7 | docs.replit.com/learn/build-with-agent — Build with Agent: Five Habits | docs | 2026-10-20 |
| 8 | docs.replit.com/features/version-control/checkpoints-and-rollbacks — Checkpoints & Rollbacks | docs | 2026-10-20 |
| 9 | stackbuiltai.com/replit-agent-4-review-2026 — Replit Agent 4 Review (2026-03-21) | blog/review | 2026-10-20 |
| 10 | TechPoint Africa — Lovable vs Bolt vs v0 honest review (2025-08-29) — techpoint.africa | blog/review | 2026-10-20 |
| 11 | lovable.dev/guides/lovable-vs-bolt-vs-v0 — Comparison (2026) | docs | 2026-10-20 |
| 12 | major.build/blog/lovable-vs-bolt — AI App Builder Comparison (2026) | blog | 2026-10-20 |
| 13 | vercel.com/blog/how-to-prompt-v0 — How to Prompt v0 (2025-12-15) | blog/docs | 2026-10-20 |
| 14 | support.bolt.new/get-started/intro-bolt — Intro to Bolt | docs | 2026-10-20 |
| 15 | code.claude.com/docs/en/best-practices — Best Practices for Claude Code | docs | 2026-10-20 |
| 16 | code.claude.com/docs/en/permission-modes — Choose a Permission Mode | docs | 2026-10-20 |
| 17 | cursor.com/docs/agent/security/run-modes — Run Modes | docs | 2026-10-20 |
| 18 | cursor.fan/tutorial/HowTo/cursor-agent-mode-masterclass — Cursor Agent & YOLO Guide | blog | 2026-10-20 |
| 19 | dev.to/dzhuneyt — Cursor Auto-review vs YOLO: Picking the Middle Safety Tier (Oct 2026) | blog | 2026-10-20 |
| 20 | mariusmanolachi.com/blog/how-to-build-a-dry-run-mode-for-an-ai-agent | blog | 2026-10-20 |
| 21 | menuagentic.com/playbooks/agent-ux-and-human-interaction/approval-and-confirmation-ux — Approval & Confirmation UX | playbook | 2026-10-20 |
| 22 | betterclaw.io/blog/ai-agent-human-approval-guardrails — AI Agent Guardrails (2026-06-11) | blog | 2026-10-20 |
| 23 | alitajer.com/blog/agentic-ux-patterns — Agentic UX Patterns (2026-07-20) | blog/guide | 2026-10-20 |
| 24 | Sanneman & Shah (2023) — Trust, distrust, and appropriate reliance in (X)AI — arxiv 2312.02034 | paper | 2026-10-20 |
| 25 | aiscanner.dev / matthewswong.com / moaiteam.com / agentscamp.com — Human-in-the-Loop, Agentic UX surveys | blog | 2026-10-20 |

---

## 8. Implications for vibe-fence

> Numbered, actionable. Each maps to a dial level or turbo rule.

### 8.1 Proposed Dial Spec — `fence dial <level>`

| Aspect | `max` | `medium` | `min` | `silent` |
|--------|-------|----------|-------|----------|
| **Who it serves** | First-timer / true beginner | Learner with some reps | Returning builder | Power user / CI |
| **Card verbosity** | Expanded card: what happened, why it matters, concept link, doc link, retrieval prompt | Collapsed card: what + one-line why; expand on demand | Badge: one-liner only on novel or high-severity patterns; else emoji + file hint | Log entry only (no in-conversation teaching; `.fence/learn/` still written) |
| **Teaching injection** | Full note + analogy + "try to explain back" prompt injected into agent context | One-line why + file pointer | File pointer only; agent does not elaborate | No injection |
| **Context budget** | Full note in-window (worth the cost for novices) | One-liner in-window + disk pointer | Pointer only | None |
| **Security override** | — | — | — | **Even silent shows one-line for `block`-tier (auth/secrets/deploy). No silent security.** |
| **Fading trigger** | After 5 consecutive verified fixes of same rule, suggest `medium`: "You're nailing input validation — want shorter explanations?" | After 5 more, suggest `min` | Stable; suggest `silent` only on explicit request or N=20 | Stable; `fence dial` is always user-controlled — suggestion is opt-in |
| **Storage** | `.fence/learn/<topic>.md` written for every teaching moment; dial controls what is *shown*, not what is *saved* | same | same | same |
| **Logging key** | `taught:max:rule_id` | `taught:medium:rule_id` | `taught:min:rule_id` | `taught:silent:rule_id` (none shown) |
| **CLI** | `fence dial max` (default on `init` for new users) | `fence dial medium` | `fence dial min` | `fence dial silent` |
| **Config** | `.fence/config.yaml → teaching: max | medium | min | silent` (per-user override in `~/.fence/config.yaml` possible; repo value is default) | | | |

**Design principles behind the spec:**
- Dial and turbo are orthogonal axes (T-06, A-01). Dial = learning; turbo = interruption. Never couple them.
- Storage ≠ display — even `silent` writes learn files so the user can read later or step back up (A-02).
- Security always teaches one line (A-04 exception is not an escape hatch; CI can set `fence dial silent --allow-silent-security` only with explicit env flag).
- Desirable difficulty (T-03): `max` includes retrieval prompts; lower levels omit them. The harness is not just a lecturer.
- Expertise reversal (T-02) is the reason `min`/`silent` exist at all — they are not "advanced settings," they are learning-science requirements.

### 8.2 Turbo Contract — `fence turbo [on|off]`

```yaml
# What turbo DOES
- Auto-approves nudge-tier plans (style, naming, hygiene) after 3s dwell with abort.
- Auto-approves warn-tier plans after 5s dwell with abort, batched where homogeneous.
- Generates plan artifact for every approval (reviewable in .fence/plans/).
- Creates checkpoint before executing (rollback = one command: fence undo).
- Coalesces queue (dedupe + batch) before surfacing.
- Pins payload hash at approval time (U-05); re-queues on drift.

# What turbo DOES NOT auto-approve (always gates, even in turbo)
- Security: secrets, auth changes, dependency additions with known CVEs, OWASP block-tier.
- Deploy: any production deploy, env var changes, domain/DNS, publishing.
- Destructive: file deletion, git push to main, database migrations on prod, force-push, rm -rf.
- Irreversible external: external email/network, money, customer-record mutation.
- First-seen learning moments: first occurrence of a novel rule_id per user (one forced teaching card).

# What turbo NEVER does (even with gate approval)
- YOLO (bypassPermissions equivalent) — requires separate explicit opt-in:
  fence turbo --yolo --i-understand
  with banner warning and 5s confirmation. Hidden from --help; documented only in advanced docs.
```

**Turbo interaction with dial:**

| Dial \ Turbo | Turbo OFF (default) | Turbo ON |
|--------------|---------------------|----------|
| `max` | Every card is expanded and requires explicit approve (teaching moment). Good for learning. | Nudge auto-after-dwell; warn/medium+security still require approve. User sees expanded teaching but with fewer clicks. |
| `medium` | Collapsed cards, explicit approve per severity | Same auto rules; cards are collapsed so turbo feels "quiet but safe." |
| `min` | Badges, explicit approve for warn/block | Auto for nudge+warn; only block interrupts. Feels fast. |
| `silent` | Log-only; explicit approve for warn/block (silent still logs nudge as done) | Auto for nudge+warn; only block interrupts with one-liner. Fastest safe mode. |

### 8.3 Numbered Implications (copy / avoid / invent)

1. **Invent: four-level teaching dial (max→medium→min→silent) as scaffolding fade — first principled teaching dial in vibe-coding tools.** No existing harness tiers explanations pedagogically (T-06). Vibe-fence's dial is grounded in scaffolding + cognitive load + expertise reversal (T-01/T-02) and orthogonal to turbo. *Copy* the language of fading; *invent* the product.
2. **Copy: three-tier approval (auto/notify/gate) keyed to consequence × reversibility, not action type (U-01/U-04).** This IS the turbo contract's backbone. Map directly to Stream 04 severity levels: `nudge→auto`, `warn→notify`, `block→gate`.
3. **Copy: plan preview / dry-run as turbo's core interaction (U-03).** Adopt Claude Code + Replit Agent plan-file pattern: every turbo auto-approval still produces a reviewable plan artifact with abort window. Convert N clicks into 1 plan review.
4. **Copy: Replit-style checkpoint + one-click rollback for every queue auto-fix (Q-04).** Auto-fixes without undo destroy trust. Implement via `git commit --fence-checkpoint` before queue execution; expose `fence undo`.
5. **Copy: Lovable/Bolt zero-install, one-prompt-to-preview funnel for onboarding (O-01–O-03).** `npx vibe-fence init` → scan → 1 mock finding card → approve → fixed → green check in <60s. Paved 3-step path printed after init; `fence tour` for max users.
6. **Copy: color-coded, structured queue cards (Q-01/Q-03) with coalescing.** Cards, not logs. Deduplicate by rule+file, cap visible to 8, overflow via `fence queue`, priority-sorted block→warn→nudge.
7. **Copy: payload pinning for every gated approval (U-05).** Hash the approved plan; re-queue on drift. Without this, "agent resolves itself" becomes "agent bypasses approval by re-planning."
8. **Copy: batch & defer for decision fatigue (U-06).** Homogeneous low-risk items batched into one card; security never batched with non-security.
9. **Avoid: conflating teaching verbosity with interruption frequency (A-01).** `max` ≠ naggy. Max teaches verbosely but turbo tier (not dial) governs interruption. Keep axes orthogonal or max users will disable the fence.
10. **Avoid: verbose teaching in the agent's context window (A-02).** Teach via `.fence/learn/*.md` on disk; inject only the level-appropriate pointer/one-liner. At scale, teaching bloat degrades task performance (Claude Code best-practices warning).
11. **Avoid: learned helplessness via lecture-only teaching (A-03).** At `max`, use retrieval prompts ("why do you think...?") not just explanations; first-seen rule always forces a card even in turbo; never auto-dismiss — approval is always an explicit gesture.
12. **Avoid: dark patterns — scare language, nag loops, silent data collection (A-04).** Plain severity language; one-click dismiss with "don't ask again for this rule" persisted in config; local-only queue state.
13. **Invent: agent-as-assignee queue UX (Q-02).** Structured `issue→solution→plan` YAML with `auto_resolvable` flag and dial-keyed `teaching_note`. No existing tool implements "findings queue the agent itself resolves" with user-as-approver (not triager). Pair with Alitajer's action-attribution pattern (mark agent vs. human actions in history).
14. **Invent: dial auto-suggest (fading trigger) based on verification streak.** After 5 consecutive verified fixes of same rule, suggest stepping down with a concrete reason ("You're nailing X — want shorter explanations? Changes via `fence dial <level>`"). Learner-controlled, never automatic.
15. **Measure onboarding as "time to first approved fix," instrument full funnel, and include transfer check (O-05 + gaps).** Log `init → first card → first approval → first verified fix` with dial level. In evals, add a transfer task: can the user fix a similar issue unassisted?
