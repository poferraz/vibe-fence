# Stream 05 — Companion UX: Teaching Dial & Turbo

- **Model:** deepseek-v4.1-flash
- **Provider:** Hermes desktop app via ollama-launch (`deepseek-v4.1-flash:1017-cloud`)
- **Date:** 2026-10-20
- **Stream:** 05 — Companion UX (Teaching Dial, Turbo, Issue Queue, Anti-patterns, Onboarding)
- **Access note:** all sources accessed 2026-10-20 via live web fetch unless marked otherwise.

---

## Thesis (read this first)

The three UX surfaces in this stream — teaching dial, turbo, issue queue — are usually treated as three settings on one "helpfulness" axis. The evidence says they are three *different safety problems* and should not share a control:

1. **The permission prompt is not a safety boundary.** Anthropic's own telemetry shows users approve **~93% of permission prompts**, and an independent 409,000-decision dataset shows humans miss **1 in 3** malicious agent commands — worst exactly on the categories a non-technical user is least equipped to judge (scope violations and credential exfiltration, 33–35% miss rate). More prompts do not buy more safety; they buy habituation. So turbo must be built on **containment + reversibility + batched review**, not on "ask me before everything."
2. **The teaching dial is a learning instrument, and its failure mode is giving answers.** The only large field experiment on this (n≈1,000, PNAS 2025) found that unfettered AI access improved practice performance by 48% but left students **17% worse than students who never had access** once the AI was removed. A guardrailed tutor that gave *hints instead of answers* removed that harm (+127% during practice, no post-removal penalty). `max` on the dial must therefore mean **hint-first**, not **explain-loudly**.
3. **The issue queue is a batching problem, not a listing problem.** A randomised trial (n=237) found that batching notifications three times a day improved attention, mood, productivity and perceived control and lowered stress — while *disabling* notifications produced anxiety and FoMO with few benefits. Findings should arrive in **cadence**, delivered as **finished fixes** (GitHub's Autofix data: 3×–12× faster remediation), never as a growing backlog the user must triage.

The rest of this file is the evidence for those three claims plus the concrete specs they imply (dial spec and turbo contract in the Implications section).

---

## 1. Teaching Dial (`max` → `medium` → `min` → `silent`)

### T-01 — The dial exists because explanation depth cannot be static

- **Claim:** Novices learn best from fully worked examples; the same support becomes *harmful* as competence grows (the expertise reversal effect). Any fixed verbosity — "always explain" or "never explain" — is wrong for a mixed user base, which is exactly the base vibe-fence targets (one store manager and one ex-developer may install the same harness).
- **Evidence:** Kalyuga et al., *The Expertise Reversal Effect* (2003) and the follow-up synthesis *Expertise reversal effect and its instructional implications* — https://link.springer.com/article/10.1007/s11251-009-9102-0; Sweller's cognitive-load account of worked examples — https://www.uky.edu/~gmswan3/544/Cognitive_Load_&_ID.pdf (accessed 2026-10-20).
- **Strength:** `proven` (replicated across STEM domains; the effect is one of the better-established findings in instructional psychology).
- **Fit for vibe-fence:** The dial is not a politeness setting, it is the mechanism that prevents expertise reversal. Corollary: the harness must never *lock* a user at `max`. It must offer step-down at natural boundaries (see T-07) and accept step-up at any time without friction.

### T-02 — Progressive disclosure is a *UI* principle; borrowing it for explanations requires one addition

- **Claim:** Progressive disclosure — show the few most important options first, defer the rest behind a request — is the canonical pattern for keeping complex tools learnable. Applied to explanations, the rule is: default view is the shortest form that enables the next action, with an always-available "tell me more" affordance.
- **Evidence:** Nielsen, *Progressive Disclosure*, NN/g, 3 Dec 2006 — https://www.nngroup.com/articles/progressive-disclosure/ (accessed 2026-10-20). Nielsen's formulation is about *features deferred to a secondary screen*, not about prose length, so the transfer needs the explicit affordance.
- **Strength:** `practiced` (two decades of industry consensus; not an experimental result).
- **Fit for vibe-fence:** Each dial level renders a *card*, and every card keeps an expand control. The harness must never strip the user's ability to ask "why" — it only changes what is shown unprompted. Practical rule: `max` = expanded card, `medium` = one-line why + expand, `min` = badge + expand, `silent` = log line, expandable in the log viewer.

### T-03 — The single most important dial finding: answer-giving teaches worse than hint-giving

- **Claim:** Unrestricted AI answers *raise* in-session performance and *lower* retained skill. A tutor constrained to give teacher-designed hints instead of answers preserved learning. This is the empirical basis for `max` meaning "more scaffolding," not "more answers."
- **Evidence:** Bastani, Bastani, Sungu, Ge, Kabakcı, Mariman, *Generative AI without guardrails can harm learning: Evidence from high school mathematics*, PNAS, published 2025-06-25 — https://www.pnas.org/doi/10.1073/pnas.2422633122 (accessed 2026-10-20). Field experiment, ~1,000 high-school students, two tutor designs vs control: **GPT Base +48%** during practice, **GPT Tutor +127%**; after access was withdrawn, **GPT Base students scored 17% below** students who never had access; the hint-based tutor largely eliminated the harm.
- **Strength:** `proven` in the studied domain; **`contested` for transfer to coding agents** — no equivalent experiment exists for code, and the outcome variable (math test scores) has no clean analogue. Treat direction as reliable, magnitude as unknown.
- **Fit for vibe-fence:** Hard rule for `max`: **the agent never explains a fix before the user has had one chance to react to the symptom.** Format: symptom → one question → (if no answer or wrong) explanation → fix. At `medium` the question is dropped and the explanation is one line. At `min`/`silent` no question, no explanation. Never make the question mandatory (blocking = nagging); it is an offer with a timeout.

### T-04 — Retrieval prompts (one per session, not one per decision)

- **Claim:** Effortful retrieval beats passive reading, but the benefit collapses if every interaction becomes a quiz. The usable form is a *rare* prompt at a moment of genuine novelty, not a per-change comprehension check.
- **Evidence:** Bastani et al. 2025 (GPT Tutor design uses hint escalation rather than explanation dumps) — https://www.pnas.org/doi/10.1073/pnas.2422633122; desirable-difficulties framing (Bjork) as synthesised in instructional-design literature — https://www.uky.edu/~gmswan3/544/Cognitive_Load_&_ID.pdf (accessed 2026-10-20).
- **Strength:** `proven` for retrieval practice generally; **`contested`** for the specific "one per session" dosage, which is my synthesis, not a measured result.
- **Fit for vibe-fence:** `max` gets a **retrieval budget: 1 question per session, only on a first-occurrence pattern** (first auth change, first dependency add, first deploy). Never repeat a question the user already answered correctly. Store answers in `.fence/state/learning.json` so the same concept is never quizzed twice.

### T-05 — The dial must be a vector, not a scalar

- **Claim:** Expertise reversal is domain-specific: the same person can be an expert in one area and a novice in another, so a single global dial level will simultaneously over-explain and under-explain. Per-domain competence tracking is the correct shape.
- **Evidence:** Expertise reversal is demonstrated per task domain, not as a global trait — Kalyuga et al. synthesis, https://link.springer.com/article/10.1007/s11251-009-9102-0 (accessed 2026-10-20). **No source tests a per-domain dial in a coding tool** — this is an inference, flagged as such.
- **Strength:** `proven` for the underlying effect; **`invent`** for the vector-dial design.
- **Fit for vibe-fence:** Dial state = map over a small fixed domain set, e.g. `{ui, state, data, auth, deps, deploy, tests}`. Default all `max`. Step a *domain* down (never the whole dial) after: (a) the user answers a retrieval prompt in that domain correctly, (b) three consecutive accepted changes in that domain with no reversal, or (c) explicit "I know this one." Step up automatically on any reversal/incident in that domain. A designer who knows CSS should not be lectured about flexbox but should still be taught what a row-level security policy is.

### T-06 — `silent` must silence pedagogy, not consequences

- **Claim:** Silence is a legitimate request, but conflating "stop teaching me" with "stop telling me what happened" is a safety regression. Users who mute teaching still need the consequence report; what they are opting out of is *concept transfer*, not *situational awareness*.
- **Evidence:** NIST's security-fatigue study recommends **limiting the number of security decisions** and **making the right action simple**, not hiding outcomes — https://www.nist.gov/news-events/news/2016/10/security-fatigue-can-cause-computer-users-feel-hopeless-and-act-recklessly (accessed 2026-10-20). The distinction between concept transfer and outcome reporting is my reading of that guidance.
- **Strength:** `practiced` / `invent` (the split is a design proposal, not a measured finding).
- **Fit for vibe-fence:** Define two independent channels. **Teaching channel** (concepts, analogies, questions) — fully mutable, `silent` = off. **Consequence channel** (what changed, what it touched, what it could break, how to undo) — always on, `silent` still gets a one-line-per-change digest. Never let `silent` suppress a gate or a rollback offer.

### T-07 — Teach at checkpoints, not mid-flow

- **Claim:** Interrupting work raises stress, frustration, time pressure and perceived effort even when it does *not* increase completion time — people compensate by working faster at a cost. Teaching delivered mid-flow therefore has a real cost that "it didn't slow me down" hides.
- **Evidence:** Mark, Gudith & Klocke, *The Cost of Interrupted Work: More Speed and Stress*, CHI 2008 — https://ics.uci.edu/~gmark/chi08-mark.pdf, DOI https://dl.acm.org/doi/10.1145/1357054.1357072 (accessed 2026-10-20). Finding: interrupted tasks were completed *faster* with no quality difference, but with significantly higher stress, frustration, time pressure and effort.
- **Strength:** `proven` (controlled experiment) — with the caveat that it studies office task interruption, not agent UX.
- **Fit for vibe-fence:** Teaching cards queue to a **checkpoint boundary** (task complete / tests green / user idle >N seconds), never to a mid-execution token stream. Replit's model is the precedent: each completed task creates a checkpoint, which is a natural place to both teach and roll back — https://docs.replit.com/learn/plan-vs-build-mode (accessed 2026-10-20). If a decision cannot wait for a checkpoint, it is a *gate* (turbo), not a *lesson*.

### T-08 — No shipping coding tool has a real teaching dial

- **Claim:** The closest things in production are autonomy controls (Claude Code permission modes, Replit plan/build toggle, v0 Design mode) — all of which change *what the agent does*, not *how much the user learns*. Teaching verbosity is not a first-class axis anywhere in the market.
- **Evidence:**
  - Claude Code exposes six permission modes (`default`/Manual, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`) — an autonomy dial with no teaching dimension — https://code.claude.com/docs/en/permission-modes (accessed 2026-10-20).
  - Replit exposes a **Plan toggle** (plan vs build) — https://docs.replit.com/features/agent/plan-mode and https://docs.replit.com/learn/plan-vs-build-mode (accessed 2026-10-20).
  - v0 exposes prompt → app, Code view with line comments, and Design mode — https://v0.app/docs/quickstart (accessed 2026-10-20).
- **Strength:** `practiced` (observed product documentation, October 2026).
- **Fit for vibe-fence:** This is the differentiation. Do not ship a seventh autonomy mode — ship the axis nobody has: **teaching depth as a separate, per-domain, persistent setting** that survives across agents. The competitive claim is defensible because it is structural, not a feature: competitors conflate "explain" with "ask permission," and the evidence says those are different problems with different failure modes (T-03 vs U-01).

---

## 2. Turbo Mode (autonomy vs safety)

### U-01 — Permission prompts are empirically a weak safety boundary

- **Claim:** The "human in the loop" review ritual does not reliably stop dangerous actions. Measured in two independent settings, approval prompts are accepted at ~93% and dangerous requests are missed about a third of the time.
- **Evidence:**
  - Anthropic engineering telemetry: **"users approved roughly 93% of permission prompts"** — *How we contain Claude across products*, 2026-05-25 — https://www.anthropic.com/engineering/how-we-contain-claude (accessed 2026-10-20).
  - Wauters' human-in-the-loop game: **40,000+ runs, 409,000 approve/deny decisions**, mean accuracy **66.3%** — players missed **1 in 3** threats; **32.9%** of sessions ended with a negative score; **7%** approved every single prompt — https://scalex.dev/blog/ai-agent-permissions-stats/ (accessed 2026-10-20), reported in The Register, 2026-08-06 — https://www.theregister.com/ai-and-ml/2026/08/06/humans-in-the-loop-miss-a-third-of-dangerous-ai-coding-agent-requests/5284236
- **Strength:** `proven` for the behavioural fact (large N, two independent sources); the game's threat prevalence (~34% of prompts) is far above real-world base rates and the author caveats it himself, so it is *directionally* reliable, not a field estimate.
- **Fit for vibe-fence:** Stop treating "asked the user" as a mitigation. Every gate must be justified by *why a human can decide it*, and anything a human demonstrably cannot decide must be handled by containment (U-05) or by the agent itself (Q-06). This single stance is the biggest architectural difference between vibe-fence and a permission-prompt wrapper.

### U-02 — The mechanism is habituation, and it is monotonic in prompt count

- **Claim:** Attention per prompt falls as prompt count rises. This is not user laziness; it is the documented failure of repeated interruption, and it is the same mechanism as security-warning habituation.
- **Evidence:** Anthropic: *"The more approvals a user sees, the less attention they pay to each, becoming over time much less diligent in their supervision"* — https://www.anthropic.com/engineering/how-we-contain-claude (accessed 2026-10-20). Parallel mechanism in security warnings: *From Warning to Wallpaper: Why the Brain Habituates to Security Warnings and What Can Be Done About It*, Journal of Management Information Systems, 2016 — https://www.tandfonline.com/doi/full/10.1080/07421222.2016.1243947 (accessed 2026-10-20; cited at title/abstract level).
- **Strength:** `proven` (vendor telemetry + peer-reviewed habituation literature).
- **Fit for vibe-fence:** Make prompt count a **budgeted resource**, like context tokens. Target: **≤3 gates per session** for a normal build; if the harness would exceed it, it must either batch the decisions into one review or defer them to the queue. Instrument approval rate and act on it (see U-08).

### U-03 — Humans are worst exactly where beginners are most exposed

- **Claim:** Approvers catch loud destruction and miss quiet scope violations. The miss rates rise monotonically with how much context the decision requires — which means the prompts that matter most for a non-technical user (is this file inside my project? is this my credential?) are the ones the prompt is least likely to stop.
- **Evidence:** Wauters per-category miss rates, n=409,000 decisions — https://scalex.dev/blog/ai-agent-permissions-stats/ (accessed 2026-10-20):

| Threat category | Example | Miss rate |
|---|---|---|
| Obviously destructive | `rm -rf /`, `chmod -R 777 /` | **11.7%** |
| Persistent mutation | crontab injection, git config hijack | **23.8%** |
| Exfiltration / code execution | curl to unknown API, typosquatted package | **33.4%** |
| Scope violation | `cat ~/.aws/credentials`, `cat ~/.kube/config` | **35.0%** |

- **Strength:** `proven` (within the dataset's limits — game, self-selected players, inflated threat rate).
- **Fit for vibe-fence — the rule this implies:** **Gate where the human is competent; contain where the human is not.** Concretely: a prompt is *permitted* only for decisions a non-technical user can evaluate from the prompt itself (cost, public visibility, deletion of their own content). Scope and exfiltration decisions are **never** prompts — they are enforced by the sandbox, because asking is theatre (U-01) and the answer is wrong a third of the time (U-03).

### U-04 — A prompt can display a different target than the one it writes to

- **Claim:** Confirmation dialogs can actively misrepresent the operation. In a disclosed class of bugs across six major assistants, a symlink made the dialog show a harmless in-repo path while the write resolved outside the workspace — and in several cases the agent's own reasoning recognised the true target while the prompt concealed it.
- **Evidence:** Wiz, *GhostApproval: a trust-boundary gap in AI coding assistants*, 2026-07-08 — https://www.wiz.io/blog/ghostapproval-a-trust-boundary-gap-in-ai-coding-assistants (accessed 2026-10-20). Affected: Amazon Q Developer (CVE-2026-12958, fixed 1.69.0), Cursor (CVE-2026-50549, fixed 3.0), Google Antigravity (fixed), Augment (in progress), Windsurf (in progress), Anthropic Claude Code (rejected as outside threat model). Framed as CWE-61 (symlink following) compounded with **CWE-451, UI misrepresentation of critical information**.
- **Strength:** `proven` (disclosed CVEs, vendor responses on record).
- **Fit for vibe-fence:** A gate is only a gate if it renders the **resolved, canonical target** — `realpath`, post-symlink, post-glob — plus the diff and the blast radius. If the harness cannot compute that, it must not show a confirm button at all. This also means turbo's "what will be touched" preview must be generated from the *resolved* operation, never from the user's or the agent's description of it.

### U-05 — Containment beats supervision, and the vendor with the most prompt data says so

- **Claim:** The robust way to cap blast radius is to constrain what the agent *can* do (sandbox, VM, filesystem boundary, egress control) rather than to supervise what it *does*. A tight perimeter is what licenses relaxing approvals — the two are a trade, not independent knobs.
- **Evidence:** Anthropic, *How we contain Claude across products*, 2026-05-25 — https://www.anthropic.com/engineering/how-we-contain-claude (accessed 2026-10-20): two approaches, human-in-the-loop supervision (found fallible, 93% acceptance) and containment; "any probabilistic defense has a non-zero miss rate"; Claude Code's reference devcontainer exists "precisely so that the agent can run unattended, without per-action approvals."
- **Strength:** `practiced` (vendor engineering consensus, corroborated by the failure data in U-01/U-03/U-04).
- **Fit for vibe-fence:** Turbo's safety claim must be **"we limited the blast radius,"** not **"we asked you."** Minimum viable fence perimeter for a beginner project: writes confined to the project root after `realpath`; no read of `~/.ssh`, `~/.aws`, `.env*` outside the project, keychains, or browser profiles; network egress allowlisted to the registries/deploy targets the project declares; no `sudo`; no crontab/launchd/git-config writes. Everything outside that perimeter is **blocked, not asked** — because the user cannot adjudicate it (U-03) and the prompt can lie (U-04).

### U-06 — The middle tier is now the industry default

- **Claim:** The market has converged on classifier-mediated autonomy as the default rather than binary ask-everything or YOLO. Two independent products shipped this as the *starting* mode, each with an explicit approval-fatigue rationale.
- **Evidence:**
  - Claude Code: `auto` is "the built-in starting permission mode for interactive terminal and VS Code sessions" (v2.1.283+); a classifier "reviews actions instead of you" — https://code.claude.com/docs/en/permission-modes (accessed 2026-10-20); design rationale and threat model — https://www.anthropic.com/engineering/claude-code-auto-mode (accessed 2026-10-20). Auto mode is two layers: an input-side prompt-injection probe, and an output-side transcript classifier (Sonnet 4.6) that is deliberately **reasoning-blind** — it sees only user messages and tool calls, with the model's own reasoning and tool outputs stripped.
  - Replit: background builds **wait for review by default**; "Automatically apply changes" is an explicit opt-in — https://docs.replit.com/features/agent/plan-mode (accessed 2026-10-20).
- **Strength:** `practiced` (shipping defaults, October 2026).
- **Fit for vibe-fence:** Adopt the shape, not the implementation: **default = agent works, human reviews the batch; auto-apply is opt-in per project.** Do not build a classifier-based gate for v1 — a classifier is a probabilistic defence with a non-zero miss rate (U-05), and vibe-fence cannot afford the evaluation burden. Deterministic containment + reversibility covers more for far less.

### U-07 — Reversibility is the actual safety net; teaching and undo cover different error classes

- **Claim:** Human error splits into *slips/lapses* (execution failures in learned procedures) and *mistakes* (wrong plan or wrong rule). Undo/checkpoints defend against slips; explanation and mental-model repair defend against mistakes. A companion that only does one is half a fence.
- **Evidence:** MIT 6.813 *Reading 4: Safety* — error taxonomy, undo design, and the point that undo itself must be reversible (redo) — https://web.mit.edu/6.813/www/sp18/classes/04-safety/ (accessed 2026-10-20). Replit: "Each completed task creates a checkpoint, so you can review changes and roll back if needed" — https://docs.replit.com/learn/plan-vs-build-mode (accessed 2026-10-20). v0: Design-mode edits "commit your edits back to your source code as a new chat version" — https://v0.app/docs/quickstart (accessed 2026-10-20).
- **Strength:** `proven` (HCI error taxonomy), `practiced` (checkpoint/version patterns).
- **Fit for vibe-fence:** For a non-technical user, mistakes dominate (they are doing novel tasks, not fluent procedures), so **teaching is the primary defence and undo is the backstop** — the inverse of the expert-tool assumption. Concretely: every agent batch opens with a checkpoint, every queue item carries a one-command revert, and the first thing onboarding teaches is "you can always go back" (O-04). Never let a checkpoint be optional in turbo.

### U-08 — Instrument approval rate; if it approaches 100%, turn the prompts off

- **Claim:** A user who approves everything has converted the gate into a keystroke. That is detectable, and the honest response is to stop pretending the gate works — switch to a mode whose safety does not depend on their attention.
- **Evidence:** 7% of players in the 409k-decision dataset approved every prompt — https://scalex.dev/blog/ai-agent-permissions-stats/; Anthropic's 93% acceptance and its explicit statement that attention decays with volume — https://www.anthropic.com/engineering/how-we-contain-claude (both accessed 2026-10-20). The *policy* (auto-switch on measured approval rate) is my proposal; no product ships it as far as I could find.
- **Strength:** `proven` for the phenomenon; **`invent`** for the adaptive policy.
- **Fit for vibe-fence — turbo's self-awareness rule:** Track a rolling approval rate over the last 20 gates. Above 90% → stop gating the categories that are merely *consequential* and move them to post-hoc review; tell the user once, plainly ("you've approved the last 20 without changes, so I'll stop asking and just show you the report — the sandbox still holds"). This is the one place where being *less* interactive is the safer design.

### U-09 — Autonomy tiers must key on target and reversibility, not on verb

- **Claim:** "Read is safe, write is dangerous" is the wrong axis. The most-missed malicious actions in the dataset were **reads** of credentials and config; the most reliably caught were loud **writes** (`rm -rf`). A verb-based tier system is inverted relative to actual risk.
- **Evidence:** Category table in U-03 — scope violations (reads of `~/.aws/credentials`, `~/.kube/config`) missed 35.0% vs obviously destructive writes missed 11.7% — https://scalex.dev/blog/ai-agent-permissions-stats/ (accessed 2026-10-20). Also the `npm run` blind spot: `npm run analyze` approved **64.7%** of the time because a familiar script name hides an arbitrary payload; the three `npm run *` items were missed **52.5%** vs **28.4%** for other exfiltration vectors.
- **Strength:** `proven` (within dataset limits).
- **Fit for vibe-fence:** Classify by **target × reversibility × session-coupling**:
  - *Target*: inside project root (after resolving symlinks) vs outside vs network vs credential store.
  - *Reversibility*: git-tracked write vs untracked state (installs, crontab, DNS, deploys).
  - *Session-coupling*: does this action's effect depend on a file the agent edited earlier in this session? If yes, the human cannot evaluate it from the prompt (`npm run *` is the canonical case) and it must not be a prompt at all — it must be contained or executed in a throwaway sandbox.

---

## 3. Issue Queue UX (`issue → solution → plan`)

### Q-01 — Ship fixes, not findings

- **Claim:** The bottleneck in remediation is not detection, it is repair. When the tool delivers a reviewable patch instead of an alert, time-to-fix collapses by roughly an order of magnitude on hard classes.
- **Evidence:** GitHub, *Found means fixed: Secure code more than three times faster with Copilot Autofix*, Aug 2024 — https://github.blog/news-insights/product-news/secure-code-more-than-three-times-faster-with-copilot-autofix/ (accessed 2026-10-20). Public-beta data, May–July 2024: median **28 min with Autofix vs 1.5 h manual (3×)**; XSS **22 min vs ~3 h (7×)**; SQL injection **18 min vs 3.7 h (12×)**. GitHub's own framing: "finding vulnerabilities isn't the problem. Fixing them is."
- **Strength:** `proven` (vendor-reported, large sample) — caveat: selection effects are likely, since Autofix-eligible alerts may be easier.
- **Fit for vibe-fence:** The queue *never* contains a bare finding. Every item must arrive as: **what changed / what it touches / the patch or the applied patch / how to undo / one action**. If the agent cannot produce the fix, the item is not queue material — it is a gate (if it must be decided now) or it is dropped with a counted note (Q-07).

### Q-02 — The artifact shape that works: patch + provenance + one review action

- **Claim:** The mature pattern bundles the fix with the evidence needed to trust it, and routes it through a draft/review object rather than a notification. This is what "issue → solution → plan" should look like in practice.
- **Evidence:**
  - Dependabot security PRs "contain everything you need to quickly and safely review and merge a proposed fix… release notes, changelog entries, and commit details" — https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-pull-requests (accessed 2026-10-20).
  - GitHub's two autofix modes: Copilot Autofix returns "a single suggested code change for one alert that you review and apply yourself"; **agentic autofix** investigates, generates and validates a fix, then "opens a **draft** pull request" — https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning (accessed 2026-10-20).
- **Strength:** `practiced` (shipping product behaviour at scale).
- **Fit for vibe-fence:** Queue item schema (keep it this small):
  ```json
  { "id": "f-014", "title": "Your API key is in the repo",
    "why": "anyone with the link can read it",
    "fix": "<patch | applied>", "evidence": ["path:line", "commit"],
    "blast": "1 file, no behaviour change", "undo": "fence undo f-014",
    "action": "keep | revert" }
  ```
  Four fields are mandatory (why / fix / blast / undo); an item missing any of them is a bug in the harness, not a task for the user.

### Q-03 — Triage needs ≤4 verbs, one keystroke each

- **Claim:** Professional issue trackers converge on a tiny verb set for incoming work — accept, decline, duplicate, snooze — each bound to a single key. Anything richer assumes a user with a mental model of workflow states; that is precisely what a non-technical vibe-coder lacks.
- **Evidence:** Linear Triage: review, then *accept* (`1`), *decline* (`2`), *mark as duplicate* (`3`), *snooze* (`H`); plus Triage Rules / Triage Intelligence for automated routing — https://linear.app/docs/triage (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Verbs for a beginner: **Fix it** (default, one click, applies the agent's patch), **Explain** (escalates to a teaching card), **Later** (snooze), **Never** (dismiss category permanently, with the count of what that silencing will hide). No statuses, no assignees, no priorities. Default selection is always "Fix it" — the queue's job is to be emptied, not managed.

### Q-04 — Batch, don't mute

- **Claim:** There is a measurable middle ground between interrupting constantly and switching off: predictable batching. Removing notifications entirely did **not** replicate the benefits and produced anxiety — so an "off" switch is not the right escape hatch for a queue.
- **Evidence:** Fitz, Kushlev, Jagannathan, Lewis, Paliwal & Ariely, *Batching smartphone notifications can improve well-being*, Computers in Human Behavior (2019), randomised field experiment n=237 — https://static1.squarespace.com/static/57a40c19414fb54f51f8095f/t/614a55faa7b89e25f4e48ad1/1632261627146/2019+Fitz+Batching.pdf (accessed 2026-10-20). Batching 3×/day vs control: more attentive, more productive, better mood, greater perceived control, lower stress, fewer interruptions. No-notification group: "reaped few of those benefits, but experienced higher levels of anxiety and fear of missing out."
- **Strength:** `proven` (RCT) — domain is smartphone notifications, transfer to agent findings is plausible but untested.
- **Fit for vibe-fence:** Queue cadence = **at natural stops, max 3 items, max 1 decision**. If the agent accumulates more, it resolves the mechanical ones itself and reports a count ("4 more fixed, no action needed"). Never offer "turn off findings" as the only relief; offer "quiet until tomorrow" (snooze with a return condition, Q-05).

### Q-05 — Snooze must have a return condition

- **Claim:** "Later" without a resurrection rule becomes "never," and the item is silently lost — the queue then teaches the user that ignoring works, which is the habituation failure (U-02) at the queue level.
- **Evidence:** Linear snooze hides the issue and returns it "at a time of your choosing, or when there's new activity on that issue: whichever comes first" — https://linear.app/docs/triage (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Snooze = `(time OR trigger)`. Triggers that resurrect: the user edits the affected file, the next deploy attempt, a new dependency touching the same package, or a test failure in the affected path. State lives in `.fence/state/queue.json` so it survives agent switches (the harness, not the agent, owns the queue).

### Q-06 — The queue must be self-clearing: only decisions reach the human

- **Claim:** If the agent can fix it, the user should never see it as a task. The queue's purpose is to present *irreversible or preference-bearing* choices — not to hand over work the agent already knows how to do. Merging "finding" and "task" is what turns a companion into a second job.
- **Evidence:** Synthesis of Q-01 (fixes collapse remediation time), Q-02 (draft-PR/autofix pattern), and U-01/U-03 (humans are bad at adjudicating technical safety questions). Precedent for automated clearing: GitHub agentic autofix assigns alerts to the agent end-to-end — https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning (accessed 2026-10-20).
- **Strength:** `invent` (design rule derived from `proven`/`practiced` inputs).
- **Fit for vibe-fence:** Three-way split for every finding: **auto-fixable → agent fixes, reports in digest** (no queue item); **preference-bearing → queue item with a default** (e.g. "pick a name for the table"); **irreversible/external → gate with containment** (U-05). Measure the ratio; a healthy fence resolves ≥80% of findings without asking.

### Q-07 — Never queue what the harness can verify itself

- **Claim:** Items that a deterministic check can settle (tests pass, lint clean, type-checks, secret-scanner hit) must be resolved by running the check, not by asking the user to adjudicate. Queuing verifiable items is the fastest way to train the user to ignore the queue.
- **Evidence:** Inference from Q-04 (batching benefits depend on signal density) and the security-fatigue guidance to **limit the number of decisions** a user faces — https://www.nist.gov/news-events/news/2016/10/security-fatigue-can-cause-computer-users-feel-hopeless-and-act-recklessly (accessed 2026-10-20). No direct study of agent queues; flagged `invent`.
- **Strength:** `invent`.
- **Fit for vibe-fence:** The queue writer must call a `resolvable(item)` check first: does a command, test, or diff exist that settles this? If yes, run it, record the outcome, and never surface it. Log the suppression so the synthesis can audit false suppression later.

---

## 4. Anti-patterns

### A-01 — Security fatigue is the default state, not the edge case

- **Claim:** A majority of ordinary users report security fatigue — weariness or reluctance to deal with security — and its behavioural signature is exactly the failure mode a nagging fence would produce: resignation, loss of control, avoiding decisions, picking the easiest option, acting impulsively, and abandoning the rules.
- **Evidence:** Stanton, Theofanos, Prettyman & Furman, *Security Fatigue*, IEEE IT Professional, 2016; NIST release 2016-10-06 — https://www.nist.gov/news-events/news/2016/10/security-fatigue-can-cause-computer-users-feel-hopeless-and-act-recklessly, paper record https://csrc.nist.gov/pubs/journal/2016/09/security-fatigue/final (accessed 2026-10-20). The study's own remedies: **limit the number of security decisions; make it simple to choose the right action; design for consistent decision making.**
- **Strength:** `proven` (qualitative interview study, deliberately broad sample).
- **Fit for vibe-fence:** Those three remedies are, almost verbatim, the design brief for this stream. Each one maps to a mechanism: limit decisions → turbo's gate budget; make the right action easy → "Fix it" as the default queue verb; consistent decisions → one dial + one contract across every agent, never per-agent behaviour. Cite this triad in the harness's own docs; it is the most quotable justification for the whole companion stance.

### A-02 — Repeated warnings become wallpaper

- **Claim:** Habituation to security warnings is a neurological and behavioural phenomenon, not a personality trait — repeated exposure reduces attention to the warning itself even as the underlying risk is unchanged. Volume, not wording, is the dominant variable.
- **Evidence:** Vance, Jenkins, Anderson, Bjornn & Kirwan, *From Warning to Wallpaper: Why the Brain Habituates to Security Warnings and What Can Be Done About It*, Journal of Management Information Systems 33(3), 2016 — https://www.tandfonline.com/doi/full/10.1080/07421222.2016.1243947 (accessed 2026-10-20; cited at title/abstract level — the full text is paywalled and I did not read it).
- **Strength:** `proven` for habituation; **`contested`** for the specific remedy set, which I did not verify.
- **Fit for vibe-fence:** Do not attempt to solve fatigue with better copy. The lever is **frequency and batching**, not phrasing. Any proposed feature that adds a surface (a new badge, a new toast, a new "heads up") must replace an existing one, not add to it.

### A-03 — Learned helplessness / cognitive offload is measurable in knowledge work

- **Claim:** Higher confidence in generative AI is associated with *less* critical thinking, not more: users report shifting from "doing the thinking" to "verifying the output," and verification is cheaper and shallower than generation. The companion that always decides for the user manufactures exactly this posture.
- **Evidence:** Lee, Sarkar, Tankelevitch, Drosos, Rintel, Banks & Wilson, *The Impact of Generative AI on Critical Thinking: Self-Reported Reductions in Cognitive Effort and Confidence Effects From a Survey of Knowledge Workers*, CHI 2025 — https://www.microsoft.com/en-us/research/wp-content/uploads/2025/01/lee_2025_ai_critical_thinking_survey.pdf (accessed 2026-10-20). The older human-factors framing of the same failure is Parasuraman & Riley's use / **misuse** / **disuse** / abuse taxonomy — over-trusting automation (misuse) and abandoning it (disuse) are both failures of the same calibration — https://journals.sagepub.com/doi/10.1518/001872097778543886; and automation-induced **complacency** is measurable in monitoring tasks — https://www.tandfonline.com/doi/abs/10.1207/s15327108ijap0301_1 (both accessed 2026-10-20; the latter cited at title/abstract level).
- **Strength:** `proven` as a self-report survey finding; **`contested`** on causation (confident users may simply have less to learn; self-report cannot separate the directions).
- **Fit for vibe-fence:** The dial is the countermeasure, and it needs one rule the survey implies: **at `max` and `medium`, the agent must ask for a judgment before supplying one, at least once per novel domain.** Do not measure the fence by "did the user accept the fix" — measure whether they can predict the next one.

### A-04 — One visible failure can cost the whole product

- **Claim:** People abandon an algorithmic advisor after seeing it err — even when they are told it outperforms human judgment on average. Trust in a companion is asymmetric: it is built slowly and destroyed by a single confidently-wrong call.
- **Evidence:** Dietvorst, Simmons & Massey, *Algorithm Aversion: People Erroneously Avoid Algorithms After Seeing Them Err*, Journal of Experimental Psychology: General, 2015 — https://pubmed.ncbi.nlm.nih.gov/25401381/ (accessed 2026-10-20).
- **Strength:** `proven` (series of controlled experiments).
- **Fit for vibe-fence:** Calibrate confidence per claim, not per product. A fence that says "I'm confident" about everything gets abandoned at the first miss; a fence that says "I *think* this is a leak — here's what I checked" survives it. Also: when the fence is wrong, own it in the digest (`"I flagged X; it was fine; I've tightened that rule"`). Repairing a visible error is the only thing that restores trust; silence does not.

### A-05 — "Helpful" has a dark-pattern shadow

- **Claim:** Persuasive design that serves the product rather than the user is a documented, taxonomised category — and a companion UI is unusually exposed to it, because every nudge can be framed as "for your safety."
- **Evidence:** Gray, Kou, Battles, Hoggatt & Toombs, *The Dark (Patterns) Side of UX Design*, CHI 2018 — https://classes.cs.uchicago.edu/archive/2020/fall/33231-1/readings/2018_Grayetal_CHI_DarkPatternsUXDesign (accessed 2026-10-20; cited at title/abstract level).
- **Strength:** `proven` (taxonomy), `practiced` (widely applied).
- **Fit for vibe-fence:** Three hard prohibitions: (1) **no confirmshaming** on "Skip"/"Later" — neutral labels only; (2) **no hidden off switch** for teaching, security findings, or the fence itself — `fence off` exists, is documented, and states exactly what protection is lost; (3) **no engagement metrics** in the product's success criteria — the fence is measured by incidents prevented and user comprehension, never by cards opened.

### A-06 — Explaining during flow costs stress even when it costs no time

- **Claim:** Mid-task interruptions do not necessarily slow work (people compensate), but they reliably raise stress, frustration, time pressure and perceived effort. A companion that "only takes a second" is still spending the user's composure.
- **Evidence:** Mark, Gudith & Klocke, CHI 2008 — https://ics.uci.edu/~gmark/chi08-mark.pdf (accessed 2026-10-20): interrupted tasks completed *faster* with no quality difference, with significantly higher stress, frustration, time pressure and effort.
- **Strength:** `proven` (controlled experiment; office-task context).
- **Fit for vibe-fence:** This is the empirical justification for checkpoint-batched teaching (T-07) and for the "≤3 gates/session" budget (U-02). Note the trap: a naive metric ("teaching didn't slow the build") would pass while the experience degrades — so do not measure time-to-completion alone.

### A-07 — Verbose teaching competes with the thing you are teaching about

- **Claim:** Explanation injected into the agent's context displaces task context; explanation injected into the chat displaces the user's attention. Both are finite. Volume is not free on either side.
- **Evidence:** No direct measurement for coding agents — this is an inference from context-budget findings (stream 02) and progressive-disclosure practice (T-02, https://www.nngroup.com/articles/progressive-disclosure/). Explicitly flagged as unverified.
- **Strength:** `contested`.
- **Fit for vibe-fence:** Cap teaching output as a **token budget, not a word count**: `max` ≤ 8% of the agent's context window per session, `medium` ≤ 3%, `min` ≤ 1%, `silent` 0%. Enforce it in the harness, not in the prompt — prompts get ignored, counters do not. If the budget is exhausted, teaching becomes queue items for the next session (it degrades into batching, which is where it belonged anyway).

---

## 5. Onboarding (the first five minutes)

### O-01 — One input surface, first artifact from the first prompt

- **Claim:** Every consumer-grade builder converges on the same opening: no setup, no configuration, no wizard — a single text box, and a working artifact from the first message. The onboarding is the product.
- **Evidence:** Bolt's quick start is "build your first app in one session, no code required… write your first prompt, add a database, test it, publish" — https://support.bolt.new/get-started/quickstart; v0's is "describe your idea in natural language → review the generated app → iterate" — https://v0.app/docs/quickstart; Lovable's is account → starter prompt → working site — https://docs.lovable.dev/introduction/getting-started (all accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** vibe-fence must add **zero** steps before first value. `npx vibe-fence init` should be the only command, it should finish in one run, and it must not ask the user to choose a dial level — default everything to `max`, learn from behaviour (T-05).

### O-02 — First build should be the smallest possible blast radius

- **Claim:** The strongest onboarding advice in the category is to make the first artifact deliberately small — no auth, no database — because "there is less to go wrong," and to add those later with a single prompt. That is a harness rule disguised as a prompt tip.
- **Evidence:** Lovable's quick start, verbatim: "Keeping your first version free of logins and databases means there is less to go wrong, and you can add both later with a single prompt" — https://docs.lovable.dev/introduction/getting-started (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** Encode it: the first generated plan must be **stateless and local** (no auth, no DB, no third-party API) unless the user explicitly asks. Gate the first secret/dependency/auth addition as a *teaching moment*, not a routine change — it is the first time the blast radius grows, and the ideal moment for the first `max` card.

### O-03 — Plan-before-build is the first teaching moment, and it should be one screen

- **Claim:** The plan card is where a beginner first sees the agent's model of their problem. It is the highest-leverage teaching surface in the whole product — and it works because it is reviewable once, not per-step.
- **Evidence:** Replit: Plan toggle → ordered task list → **Revise / Cancel / Build here / Build in background**; background tasks wait for review by default; each task creates a checkpoint — https://docs.replit.com/features/agent/plan-mode and https://docs.replit.com/learn/plan-vs-build-mode (accessed 2026-10-20).
- **Strength:** `practiced`.
- **Fit for vibe-fence:** The plan card carries the dial's first lesson: at `max`, each plan step gets a one-line "what this means" and one step gets a "why this order" note — never more than one, or the card stops being reviewable. The three actions are Replit's four collapsed to: **Looks right / Change something / Just build it**.

### O-04 — Teach undo in minute one, before teaching anything else

- **Claim:** "You can always go back" is the single belief that makes exploratory building safe for a non-technical user. It must be demonstrated, not asserted — a visible checkpoint list they can click is worth more than any explanation of version control.
- **Evidence:** Replit checkpoints per completed task with rollback — https://docs.replit.com/learn/plan-vs-build-mode; MIT 6.813 on undo/redo design and the requirement that undo be reversible — https://web.mit.edu/6.813/www/sp18/classes/04-safety/; v0 committing design edits "as a new chat version" — https://v0.app/docs/quickstart (all accessed 2026-10-20).
- **Strength:** `practiced` + `proven` (undo theory).
- **Fit for vibe-fence:** First-run card #1 is not about security, dependencies, or structure. It is: **"Anything I change can be undone. Here are your three restore points."** Security teaching comes after the user has seen a restore work once — otherwise every warning reads as "you might break it forever," which is the fear that produces both paralysis and reckless approval.

### O-05 — The fence must be invisible until it has something to say

- **Claim:** A harness that announces itself at install has already failed onboarding: it is a new thing to learn before any value. The correct first appearance is a **finding**, delivered after the first successful build, in the shape of a fix.
- **Evidence:** Inferred from O-01 (no setup in category leaders), Q-01 (fixes land; alerts do not), and A-04 (one bad first impression is expensive). No product does this with a "fence" concept — `invent`.
- **Strength:** `invent`.
- **Fit for vibe-fence:** Install prints exactly two lines: what was installed, and how to undo the install. No dial, no config, no tour. The first fence output is a digest item of the form *"I found one thing and already fixed it: your API key was in a file that gets shared. Here's what changed."*

### O-06 — First-run copy should set the contract, not sell the product

- **Claim:** The first message determines whether later silence reads as *trust* or as *neglect*. Stating the contract once ("I'll fix what I can and only ask when it's your call") makes the batching legible later.
- **Evidence:** No measured evidence for wording; this is a design proposal grounded in A-01 (limit decisions) and Q-04 (batching needs to be predictable). Flagged `contested`.
- **Strength:** `contested`.
- **Fit for vibe-fence:** One paragraph, no marketing: what it does silently, what it will ask about, how to change the teaching level, how to turn it off. Then stop talking until there is something to fix.

---

## 6. Gaps / unknowns (be honest about these)

1. **No peer-reviewed evaluation of a teaching-verbosity dial in a coding tool exists.** T-01–T-05 rest on instructional-psychology findings (math, physics, legal reasoning) plus product observation. The mechanism is well-established; the transfer is inferred.
2. **Bastani et al. is high-school mathematics**, not code. The direction (hint-first beats answer-first) is the most robust part; the magnitudes (+48%, +127%, −17%) should not be quoted as expected effects for vibe-fence.
3. **No vendor publishes plan-card or finding-card reading rates.** Replit, Lovable, v0 and Bolt document the mechanics but not whether users read them. Every claim about plan cards in O-03 is behavioural inference from product design, not measurement.
4. **The 409,000-decision permission dataset is a game**, with ~34% threat prevalence (vs. a real world that is far safer per-prompt), self-selected players, and artificial time pressure. The author states these caveats himself. Use it for *relative* miss rates (the ordering is the useful part), not absolute risk.
5. **The 93% approval figure is vendor telemetry** from Anthropic, reported in an engineering blog, not a peer-reviewed study; there is no published methodology or confidence interval.
6. **GitHub's Autofix multiples are vendor-reported and likely selection-biased** — alerts eligible for Autofix may be systematically easier than the manual baseline.
7. **Mark et al. 2008 is a lab study of office-task interruption, not agent UX.** Also note: the widely-cited "23 minutes to refocus" figure comes from a different study (Mark, Gonzalez & Harris, CHI 2005); I did **not** verify it here and deliberately did not use it. The 2008 finding I do cite is the stress/effort result, which is the more relevant one anyway.
8. **Fitz et al. studied phone notifications**, not agent findings. The batching result is strong (RCT) but the transfer to a code companion is untested.
9. **No data exists on whether "turbo" as a label is understood by non-technical users**, or whether it invites reckless use. The word may be actively harmful for the target audience — worth a 5-person usability test before committing to it in the UI.
10. **No data on optimal queue cadence** for a coding companion (per-task? per-session? daily digest?). Q-04 proposes "natural stops, ≤3 items" from notification research, not from agent research.
11. **A-07 (context cost of teaching) is unmeasured.** I could not find a study of explanation tokens degrading agent task performance; the budget numbers in the Implications are a designed constraint, not an empirical threshold.
12. **Adversarial gap:** I did not research prompt injection through the *teaching* channel — e.g. a malicious repo containing "instructions" that the agent paraphrases into a teaching card the user trusts. Given GhostApproval (U-04), that surface is worth a dedicated look in synthesis.

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| S-01 | Bastani et al., *Generative AI without guardrails can harm learning*, PNAS, 2025-06-25 — https://www.pnas.org/doi/10.1073/pnas.2422633122 | paper | 2026-10-20 |
| S-02 | Nielsen, *Progressive Disclosure*, NN/g, 2006-12-03 — https://www.nngroup.com/articles/progressive-disclosure/ | article | 2026-10-20 |
| S-03 | Kalyuga et al., *Expertise reversal effect and its instructional implications*, Instructional Science — https://link.springer.com/article/10.1007/s11251-009-9102-0 | paper | 2026-10-20 |
| S-04 | Sweller, cognitive load theory & instructional design (course PDF) — https://www.uky.edu/~gmswan3/544/Cognitive_Load_&_ID.pdf | paper (secondary) | 2026-10-20 |
| S-05 | Mark, Gudith & Klocke, *The Cost of Interrupted Work: More Speed and Stress*, CHI 2008 — https://ics.uci.edu/~gmark/chi08-mark.pdf · https://dl.acm.org/doi/10.1145/1357054.1357072 | paper | 2026-10-20 |
| S-06 | Fitz et al., *Batching smartphone notifications can improve well-being*, CHB 2019 — https://static1.squarespace.com/static/57a40c19414fb54f51f8095f/t/614a55faa7b89e25f4e48ad1/1632261627146/2019+Fitz+Batching.pdf | paper (RCT) | 2026-10-20 |
| S-07 | Stanton et al., *Security Fatigue*, IEEE IT Professional 2016 — https://www.nist.gov/news-events/news/2016/10/security-fatigue-can-cause-computer-users-feel-hopeless-and-act-recklessly · https://csrc.nist.gov/pubs/journal/2016/09/security-fatigue/final | paper + release | 2026-10-20 |
| S-08 | Vance et al., *From Warning to Wallpaper*, JMIS 2016 — https://www.tandfonline.com/doi/full/10.1080/07421222.2016.1243947 | paper (title-level) | 2026-10-20 |
| S-09 | Parasuraman & Riley, *Humans and Automation: Use, Misuse, Disuse, Abuse*, Human Factors 1997 — https://journals.sagepub.com/doi/10.1518/001872097778543886 | paper | 2026-10-20 |
| S-10 | Lee et al., *The Impact of Generative AI on Critical Thinking*, CHI 2025 — https://www.microsoft.com/en-us/research/wp-content/uploads/2025/01/lee_2025_ai_critical_thinking_survey.pdf | paper | 2026-10-20 |
| S-11 | Gray et al., *The Dark (Patterns) Side of UX Design*, CHI 2018 — https://classes.cs.uchicago.edu/archive/2020/fall/33231-1/readings/2018_Grayetal_CHI_DarkPatternsUXDesign | paper (title-level) | 2026-10-20 |
| S-12 | Dietvorst et al., *Algorithm Aversion*, JEP: General 2015 — https://pubmed.ncbi.nlm.nih.gov/25401381/ | paper | 2026-10-20 |
| S-13 | Anthropic, *How we contain Claude across products*, 2026-05-25 — https://www.anthropic.com/engineering/how-we-contain-claude | docs/blog | 2026-10-20 |
| S-14 | Anthropic, *How we built Claude Code auto mode*, 2026 — https://www.anthropic.com/engineering/claude-code-auto-mode | docs/blog | 2026-10-20 |
| S-15 | Claude Code, *Choose a permission mode* — https://code.claude.com/docs/en/permission-modes | docs | 2026-10-20 |
| S-16 | Wauters, *AI agent permissions: the stats*, 40k runs / 409k decisions — https://scalex.dev/blog/ai-agent-permissions-stats/ | dataset/blog | 2026-10-20 |
| S-17 | The Register, *Humans in the loop miss a third of dangerous AI coding agent requests*, 2026-08-06 — https://www.theregister.com/ai-and-ml/2026/08/06/humans-in-the-loop-miss-a-third-of-dangerous-ai-coding-agent-requests/5284236 | news | 2026-10-20 |
| S-18 | Wiz, *GhostApproval: a trust-boundary gap in AI coding assistants*, 2026-07-08 — https://www.wiz.io/blog/ghostapproval-a-trust-boundary-gap-in-ai-coding-assistants | security research | 2026-10-20 |
| S-19 | GitHub, *Found means fixed: … Copilot Autofix*, 2024-08 — https://github.blog/news-insights/product-news/secure-code-more-than-three-times-faster-with-copilot-autofix/ | vendor data | 2026-10-20 |
| S-20 | GitHub Docs, *About autofix for code scanning* (agentic vs Copilot autofix) — https://docs.github.com/en/code-security/concepts/code-scanning/autofix-for-code-scanning | docs | 2026-10-20 |
| S-21 | GitHub Docs, *Dependabot pull requests* — https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-pull-requests | docs | 2026-10-20 |
| S-22 | Replit Docs, *Plan Mode* — https://docs.replit.com/features/agent/plan-mode | docs | 2026-10-20 |
| S-23 | Replit Docs, *Plan vs. Build Mode* — https://docs.replit.com/learn/plan-vs-build-mode | docs | 2026-10-20 |
| S-24 | Lovable Docs, *Quick start* — https://docs.lovable.dev/introduction/getting-started | docs | 2026-10-20 |
| S-25 | Bolt Docs, *QuickStart guide* — https://support.bolt.new/get-started/quickstart | docs | 2026-10-20 |
| S-26 | v0 Docs, *Quickstart* — https://v0.app/docs/quickstart | docs | 2026-10-20 |
| S-27 | Linear Docs, *Triage* — https://linear.app/docs/triage | docs | 2026-10-20 |
| S-28 | MIT 6.813, *Reading 4: Safety* (error taxonomy, undo) — https://web.mit.edu/6.813/www/sp18/classes/04-safety/ | course reading | 2026-10-20 |
| S-29 | Developers Digest, *Approval Fatigue Is an Agent Security Bug*, updated 2026-07-11 — https://www.developersdigest.tech/blog/approval-fatigue-agent-security-bug | blog | 2026-10-20 |
| S-30 | Parasuraman, Molloy & Singh, *Performance Consequences of Automation-Induced "Complacency"*, Int. J. Aviation Psychology 1993 — https://www.tandfonline.com/doi/abs/10.1207/s15327108ijap0301_1 | paper (title-level) | 2026-10-20 |

---

## Implications for vibe-fence

### The dial spec (`max` → `silent`), as a vector over domains

| Level | What is injected | Trigger | Budget | Learning mechanism | Exit |
|---|---|---|---|---|---|
| `max` | Decision card: what changed · why · one concept (≤1 sentence + analogy) · **hint question before any answer** | First occurrence of a pattern in a domain; any reversal or incident | ≤120 words/decision; ≤3 concept cards/session; **1 retrieval question/session** | Hint-first escalation (S-01); retrieval practice (S-04) | Offer step-down at session end, never mid-flow |
| `medium` | One-line why, only for irreversible or first-time decisions | Irreversible/novel only | ≤25 words/decision; no concept cards | Faded worked example (S-03) | Offer step-down after 3 clean sessions |
| `min` | End-of-run digest: one line per notable change | Run end | ≤5 lines/run | Self-explanation by implication only — no prompts | Offer `silent` after 2 weeks of no expansions |
| `silent` | Nothing on the teaching channel | — | 0 tokens | None (respects expertise reversal in that domain, S-03) | Always available to step back up; never silently reset |

**Domain vector.** Dial state = `{ui, state, data, auth, deps, deploy, tests}` — each its own level. Step a *domain* down when the user answers a retrieval prompt correctly in it, accepts three changes in it without reversal, or says "I know this." Step it back **up** on any reversal, incident, or unanswered question. Rationale: expertise reversal is domain-specific (T-05).

**Two-channel rule.** Teaching channel (concepts, analogies, questions) is mutable to zero. Consequence channel (what changed, what it touched, how to undo) is **always on** — `silent` still gets the digest (T-06).

### The turbo contract — what turbo does and does not auto-approve

| Action class | Under turbo | Mechanism | Why (evidence) |
|---|---|---|---|
| Edit files inside project root (git-tracked) | **Auto** | checkpoint before batch, digest after | reversible (U-07) |
| Create files inside root | **Auto** | same | reversible |
| Delete files inside root | **Auto → trash**, not unlink | 7-day trash + undo command | reversible if staged (U-07) |
| Run tests / lint / typecheck / build | **Auto** | sandboxed | verifiable, no external effect (Q-07) |
| Install dependency **already in lockfile** | **Auto** | `--ignore-scripts` | bounded, repeatable |
| Add a **new** dependency | **Notify** (one line + exact `package.json` diff) | sandboxed install, `--ignore-scripts`, no network post-install | user cannot adjudicate, but can see cost/bloat (U-03) |
| `npm run *` / `make` / project scripts | **Never a prompt** — sandbox, network denied | effect depends on session-edited files | `npm run analyze` approved 64.7% of the time (U-09) |
| Read outside project root | **Blocked** (one-time explicit grant possible) | filesystem boundary | 35% miss rate on scope violations (U-03) |
| Read credential stores (`~/.ssh`, `~/.aws`, keychain, browser profiles) | **Blocked, no prompt** | hard deny | highest miss rate, worst blast radius (U-03/U-04) |
| Write outside project root (post-`realpath`) | **Blocked, no prompt** | hard deny | GhostApproval / CWE-451 (U-04) |
| Network egress to undeclared host | **Blocked**, reported | egress allowlist | exfiltration missed 33.4% (U-03) |
| Secret written into repo / `.env` committed | **Blocked + auto-fixed** | move to `.env`, add to `.gitignore` | the fix is known; asking wastes the one prompt (Q-01) |
| Delete or skip a failing test to make CI green | **Blocked + teach** | hard rule | classic agent shortcut; destroys the safety net |
| Deploy / publish | **Gate** — one question, **resolved target rendered** | show URL + what goes live | public + irreversible, and the user *can* judge this |
| Database migration | **Gate** | backup first, then migrate | irreversible, user-judgeable |
| Destructive git on a remote (`push --force`, branch delete) | **Gate** | list commits at risk | irreversible, user-judgeable |
| Enable a paid API / spend money | **Gate** | show expected cost | user-judgeable, irreversible |
| `sudo`, crontab/launchd, git-config writes | **Blocked** | hard deny | persistence, outside blast radius (U-03) |

**Turbo ≠ YOLO.** There is no flag that disables the perimeter. The only escape hatch is a documented devcontainers/VM mode (`fence dev --unbounded`) that announces itself on every run and refuses to operate on a path ending in a real user project. Justification: Anthropic's own conclusion that supervision is fallible but containment is not, and that a tight perimeter is what licenses unattended operation (S-13).

**The three-condition gate test.** A prompt is only *allowed* if it can show (1) the **resolved** target, (2) the **diff/blast radius**, and (3) a decision the user is competent to make. If any condition fails → contain, fix, or defer. This is the single rule that prevents vibe-fence from rebuilding approval fatigue with nicer copy (U-01, U-03, U-04).

### Numbered implications

1. **Copy — separate the two axes.** Teaching depth (per-domain, persisted in `.fence/state/dial.json`) and autonomy (per-project turbo) are orthogonal. A user can be `silent` + gated, or `max` + turbo. No competitor does this; it is the product's structural claim (T-08).
2. **Copy — hint-first at `max`.** The agent never explains a fix before the user has had one chance to react to the symptom (S-01). Format: symptom → one question (offer, non-blocking) → explanation → fix.
3. **Invent — the dial as a vector.** Per-domain levels with evidence-based step-down and incident-driven step-up (T-05). Ship the state file in v1 even if the UI only exposes a global shortcut; retrofitting per-domain state later is expensive.
4. **Copy — progressive disclosure cards.** Every level renders a card with an expand affordance; the dial changes what is shown *unprompted*, never what can be asked (T-02).
5. **Copy — checkpoint-batched teaching.** Teaching lands at task/test/idle boundaries, not mid-execution (T-07, S-05). Reuse the checkpoint object as the batching boundary; do not build a second scheduler.
6. **Invent — the two-channel split.** `silent` kills pedagogy, never consequences (T-06). Enforce in code: the consequence formatter has no dial lookup.
7. **Avoid — per-action permission prompts as the safety story.** 93% acceptance, 1-in-3 miss, worst where it matters most (U-01, U-03). If a reviewer asks "how does vibe-fence keep users safe?", the answer must begin with "sandbox," not "it asks."
8. **Copy — containment perimeter with `realpath` resolution.** Project root after symlink resolution; hard denies for credential stores and out-of-root writes; egress allowlist (U-04, U-05).
9. **Invent — the three-condition gate test** as a lint rule in the harness: any code path that renders a confirm dialog must pass it, or it must be converted to a block/fix/defer.
10. **Invent — gate budget + self-awareness.** ≤3 gates/session; rolling approval rate >90% over 20 gates auto-demotes consequential prompts to post-hoc review, announced once (U-02, U-08).
11. **Copy — batch review, auto-apply opt-in.** End-of-run diff summary is the default; "automatically apply" is a per-project opt-in (U-06, S-22).
12. **Copy — fix-not-finding queue items** with four mandatory fields (why / fix / blast / undo) and one action; no bare findings ever (Q-01, Q-02).
13. **Copy — four verbs, one keystroke, default = "Fix it"**: Fix it · Explain · Later · Never (Q-03, S-27).
14. **Invent — self-clearing queue.** `resolvable(item)` check before enqueue; target ≥80% of findings resolved without asking; log suppressions for audit (Q-06, Q-07).
15. **Copy — cadence, not mute.** ≤3 items and ≤1 decision per report at natural stops; snooze = `(time OR trigger)`; never offer "off" as the only relief (Q-04, Q-05, S-06).
16. **Invent — the fence is invisible until it has a fix.** Install prints two lines; first output is a completed fix, not a warning (O-05, Q-01).
17. **Copy — teach undo first.** First-run card is restore points, not security (O-04). Security teaching only lands after the user has seen one restore work.
18. **Copy — smallest first build.** First plan is stateless and local: no auth, no DB, no third-party API unless asked; the first secret/dependency/auth change is the first `max` teaching moment (O-02, S-24).
19. **Avoid — dark patterns in the companion voice.** No confirmshaming on Skip/Later; documented `fence off` that names what protection is lost; success measured by incidents prevented and user prediction accuracy, never by cards opened (A-05, S-11).
20. **Avoid — fixing fatigue with better copy.** The lever is frequency and batching; every new surface must replace one (A-01, A-02).
21. **Invent — confidence calibration + error repair.** Per-claim confidence, and a public "I was wrong about X" line in the next digest after a miss (A-04, S-12).
22. **Copy — the NIST triad as the design brief.** Limit decisions · make the right action easy · be consistent across agents (A-01, S-07). Put it at the top of the harness's own README; it is the cleanest one-line justification of the companion stance.
23. **Measure (Phase 2 demo instrumentation):** gate count per session, approval rate (rolling 20), findings resolved without asking, dial step-down/step-up events by domain, card expand rate, undo usage, and time-to-first-fix. Without the first three, the "less nagging, more safety" claim is unfalsifiable.
24. **Defer to synthesis:** whether the teaching dial should ship as a *visible* setting in v1 at all, or as an invisible competence tracker. The evidence supports the behaviour, not the UI — and a visible dial is one more thing a beginner must understand on day one (O-01), which is the tension the synthesis should resolve.
