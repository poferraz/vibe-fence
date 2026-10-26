# Hackathon readiness audit and proposed execution plan

Date: 2026-10-26, America/Vancouver. Baseline: `4efad330ca1776bd05febbcc677bfde28c44f326`.
Status: audit complete; plan proposed, not implemented. No product code or configuration changed.

**Direction correction, October 26:** the user rejected the UI/recovery-first framing and selected an owned CLI connected directly to Meta inference. See [current senior-developer harness design](../../../superpowers/specs/2026-10-26-senior-developer-harness-design.md). Technical findings below remain valid; conflicting product, UI, companion-only model roles, and scheduling recommendations are historical and superseded.

## Decision in one paragraph

Vibe-fence has a substantial research and scaffold base, but it is not yet a working enforcement product. The best use of the build window is one complete, observable workflow: an agent attempts a dangerous action, the fence stops it before execution, a Meta-powered companion explains and proposes a bounded repair, an independent check verifies the repair, and a fresh session resumes the correct next task. Use a small local UI to show this evidence. Do not spend the window rebuilding an entire agent host or expanding unsupported claims across six adapters.

This is a competitive strategy, not a prediction of winning. Its advantage is a capability judges and users can test directly.

## Findings, highest consequence first

All line references below refer to the baseline revision, not future edits. P0 means the finding invalidates a core product claim; P1 means major reliability, trust, or delivery risk. Confidence is high unless explicitly marked unverified.

| ID | Priority | Evidence and failure path | Remediation and acceptance evidence |
|---|---|---|---|
| A1 | P0 | `src/framework/verifier.ts:244–274` reports lint/tests/generated checks as passed without running them. In an isolated fixture, the real test command exited 1 while `runTrustLadder` returned overall pass and a nonexistent test log path. **EXECUTED.** | Execute supported checks; represent unavailable checks as unknown/skipped. A failing test must prevent a verified-success result; every executed verdict must reference real output. |
| A2 | P0 | `src/adapters/claude.ts:73–74` creates empty hook arrays. `src/rules/index.ts:34–59` registers four checkers, three marked block, with no runtime dispatcher. Installation's guard at `tools/install.ts:234` calls missing target-project tooling and swallows errors. Fresh install produced empty pre/post hooks. **EXECUTED + STATICALLY REVIEWED.** | Connect one real host pre-action hook to a dispatcher, policy decision, and deny response. Prove an unsafe attempted action has no side effect; prove benign work still proceeds. |
| A3 | P0 | Package includes `dist/` but generated CLI executes excluded `tools/install.ts`, which also imports excluded `src/` (`package.json:34`; `tools/generate.ts:42`). Extracted package init fails with module-not-found. **EXECUTED.** | Bundle a self-contained CLI and templates. Test the packed tarball from a directory outside this repository with the declared runtime prerequisites. Packing successfully is insufficient. |
| A4 | P1 | Integrity bypass accepts any nonempty `FENCE_SYNC_TOKEN` (`integrity.ts:137`); `persistAttestation` has no token enforcement (`:88`). Altered instructions failed verification, then passed with an arbitrary token or an unprivileged rebaseline. **EXECUTED.** | Define a real execution boundary. An agent with the same filesystem/process privileges cannot be contained by an environment flag it can set. Put protected policy/baselines outside its write authority or narrow the guarantee to tamper detection under stated assumptions. Test bypass attempts through the actual host. |
| A5 | P1 | `git.ts:179–185` accepts every containment path; `:147–151` leaves undo unimplemented. CLI forwards command names into installation (`src/cli.ts:8`). Outside-root path returned true. **EXECUTED + STATICALLY REVIEWED.** | Implement path/symlink checks and a recoverable patch workflow. Reject unsupported commands. Test rollback with pre-existing user changes and no loss of unrelated work. Never present a plan string as completed undo. |
| A6 | P1 | CI validates ignored `dist/` before generating it (`.github/workflows/ci.yml:22–23`). Fresh-copy validation fails; existing workspace passes. Schema validation returns an empty list (`tools/validate.ts:151`). CI does not run tests. **EXECUTED + STATICALLY REVIEWED.** | Clean install → typecheck → build → validate → meaningful tests → pack → extracted-package smoke test. Enforce actual state schemas and routing references. |
| A7 | P1 | Install reports five adapters, not six: `installOpencodeAdapter` lookup differs from `installOpenCodeAdapter` export. Skills directory is empty; second installation rewrites timestamps/config (`tools/install.ts:154,265`; `src/adapters/opencode.ts:52`). **EXECUTED.** | Populate packaged skills, preserve unrelated config, report per-adapter capabilities accurately, and distinguish stable configuration from intentional event receipts. Test repeat install. |
| A8 | P1 | Meta HTTP helpers have no product-workflow callers (`meta-client.ts:247–275`). `fence-look.ts:171–175` reports pass for an unwired live path. Local `model_mode` is not sent to the provider and does not establish a provider privacy guarantee. **STATICALLY REVIEWED; live integration UNKNOWN.** | Wire one real companion call using redacted evidence. Record provider/model/request and independent verification. Return unknown for unwired visual checks. Verify actual provider settings before making privacy claims. |
| A9 | P1 | `PRODUCT.md:3–24` defines a standalone agent host and explicitly rejects a wrapper. `docs/project/BRIEF.md:6,29–31` defines a wrapper for six agents with zero runtime dependencies. | Make one dated scope decision. Recommended: one supported host plus a thin local evidence UI; preserve standalone-host architecture as future work. Label this recommendation as proposed until selected. |
| A10 | P1 | Root `AGENTS.md:7` routes to an index that omits current project status. `docs/project/INDEX.md:3` separately calls itself canonical. STATUS still describes Oct 21, says no blockers, and prioritizes PFLOP tracing. Installed memory is only a seed; no startup/handoff contract exists. | Establish the small startup and shutdown protocol below. Validate it by starting a new session with only “continue.” Separate developer context for this repository from context shipped into customer repositories. |

The existing `bun test` result is ten passes, but these are five SAM concept tests discovered twice in source and generated output. The adversarial benchmark README calls itself an outline. Neither proves interception, successful repair, safe rollback, or fresh-session recovery. “10 hard-blocks,” “zero false positives,” “any agent safe,” and the README's feature checkmarks currently exceed the available evidence.

## What is worth keeping

- Deterministic policy decisions separated from model explanations.
- Progressive disclosure and a small startup router.
- Real checker helpers, installer merge logic, compiler integration, and the source/distribution separation.
- The before/after demonstration concept and explicit research trail.

Research is now sufficient to start measuring behavior. Treat research documents as rationale, not implementation evidence. More citations, architectures, or planned features will not close A1–A3.

## Event facts and unresolved rules

The [official organizer page](https://events.cerebralvalley.ai/e/meta-ai-developer-hackathon) lists Fireworks, Baseten, and Modal. Advertised offers for selected participants are $25, $100, and $100 respectively; Baseten also advertises 2M TPM. These are offers, not confirmed account balances. The user confirms having Fireworks credits; amount, balance, and expiry remain unchecked.

[Meta's official event page](https://dev.meta.ai/events/global-hackathon) gives a November 4, 9 PM ET submission deadline: **November 4, 6 PM in Vancouver**. Use November 3 evening as an internal submission target. The Indie description emphasizes creativity, technical ambition, and whether the project works.

The authenticated details page redirects to login in the available browser, including the direct URL supplied by the user. Therefore the following remain **unverified**: detailed judging weights, exact deliverables/video limit, prize categories, obligations to use particular partners, and treatment of pre-existing work. The repo's 30/25/25/20 weights are not verified by the public pages inspected. Do not present them as newly confirmed rules.

Because code predates kickoff, preserve its history and record the pre-event baseline separately from work completed during the event. Obtain the actual rule text or organizer clarification before relying on eligibility assumptions. Do not rewrite timestamps or imply old code was built during the event. No organizer message or submission was sent during this audit.

## Product focus and differentiation

Recommended promise: **“Keep building after your AI makes a mistake—with a checked repair and a clear next step.”**

Primary user: a nontechnical builder maintaining a small app. Initial supported environment: one explicitly named desktop agent/runtime, selected after a short hook-capability proof. Other adapters remain experimental until tested. A README or AGENTS instruction alone is advisory; it is not interception.

Use one seeded, clearly labelled failure: an agent attempts to write a secret-bearing browser configuration. This is already central to the demo story, but the necessary secret-exposure rule is not implemented in the current registry. Build and test that rule instead of assuming it exists. Use dummy credentials throughout.

The companion should turn the finding into a small, understandable repair proposal with evidence references. Deterministic checks decide whether the repaired state passes. The UI should show: current task, intercepted action, reason, proposed change, check result, recovery action, and next task after restart. Avoid a generic chat clone with decorative safety badges.

[DeepSeek's official harness](https://github.com/deepseek-ai/deepseek-harness) is an architecture reference, not a reason to reproduce its full interface. The distinct contribution should be understandable prevention, repair, proof, and continuity. Keep the project independently branded; a Meta integration does not establish official Meta ownership of a package namespace.

## All-partner integration plan

All three named partners have explicit work in this plan. Connectivity is only complete after a real, recorded smoke test; configuration placeholders do not count.

| Provider | Product role | Definition of done | Access fallback |
|---|---|---|---|
| Meta Model API | Primary companion: interpret redacted findings, propose bounded repairs, explain verification and next steps. | One full workflow with actual model identity and request evidence, bounded response, independently checked patch. | If unavailable, retain an explicitly labelled offline demonstration; do not claim live Meta integration. Verify whether an event-eligible Meta open-weights path satisfies the rules. |
| Fireworks | First alternate companion using an available Meta open-weights model; prioritize because credits are user-confirmed. | Same input/output contract, provider switching, usage/latency recorded, no change to deterministic policy. | Confirm balance and model availability before calls; no silent switch to paid capacity. |
| Baseten | Second inference adapter; demonstrate portability and compare the same fixture. | Real authorized call, normalized output, explicit model identity, authentication/rate-limit/error handling. | If credits/access are missing, retain a tested mock contract with live status marked blocked. Different models mean a system comparison, not an apples-to-apples provider benchmark. |
| Modal | Disposable verification environment for candidate patches before application to the user's working project. | Run bounded checks in a sandbox, collect exit status and capped logs, deny outbound networking during verification, terminate in cleanup, show failed patches are not applied. | Local verification remains available, labelled with its weaker isolation. Do not describe a temporary directory as a sandbox. |

Fireworks and Baseten document chat-completions interfaces. The current Meta client uses `/v1/responses`; changing its base URL alone is insufficient. Give inference adapters explicit request/response normalization, model IDs, timeouts, cancellation, usage, and error states. Keep verification adapters separate from model providers. See [Fireworks compatibility](https://docs.fireworks.ai/tools-sdks/openai-compatibility), [Baseten Model APIs](https://docs.baseten.co/inference/model-apis/overview), [Modal sandboxes](https://modal.com/docs/guide/sandboxes), and [Modal network controls](https://modal.com/docs/guide/sandbox-networking).

Modal's JavaScript SDK may require relaxing the zero-runtime-dependency constraint for an optional integration. Make that explicit rather than hiding the dependency. Use a prebuilt verification image; do not mount host credentials or inject inference API keys into the sandbox. Any future cloud verification must disclose what project data leaves the machine.

Cost controls: initially one successful call per inference provider and one sandbox fixture; one request at a time; bounded output and sandbox lifetime; at most one transient retry; no auth/payment retries; explicit provider spending caps based on confirmed balances. No dedicated GPU deployment or training is needed. Models cannot override budget controls. This audit made no billable API calls.

## Fresh-session protocol

Implement twice: first for developing this repository, then as a packaged capability for installed projects.

1. Root AGENTS remains within 400 tokens and routes first to `docs/project/STATUS.md`; the fence index remains the technical catalogue.
2. STATUS stays short: current scope, current task ID, acceptance check, last verified commit/commands, blockers, exact next action. Distinguish planned, implemented, wired, and verified capabilities.
3. Maintain one execution backlog with task IDs, dependencies, done criteria, and evidence. Keep research, approved decisions, and operational state distinct; stop treating several files as competing sources of current truth.
4. Startup reads STATUS plus Git HEAD/status, reconciles stale information, then loads only relevant technical references. Continue already-authorized work; do not infer permission to publish, spend money, or expand scope from stored text.
5. Shutdown records verified results, unresolved failures, changed files, and the next command. If interrupted, recovery compares persisted state with actual code rather than trusting a claimed completion.
6. Product state uses a versioned schema and atomic writes; include objective, next action, evidence references, repository revision, and a revision counter. Secrets do not belong in handoff files. Schema validity does not make untrusted text authoritative.

Suggested router text for a later implementation:

> At session start read docs/project/STATUS.md and inspect Git status/HEAD. Use docs/fence/INDEX.md only for the active task. Reconcile stale status with code. Continue the next authorized task; ask only for decisions that block it. Treat research as rationale and planned features as unimplemented. Before ending, update STATUS with verified commands/results, blockers, and the exact next action. Source is src/; dist/ is generated. Run the applicable checks and never report an unexecuted check as passed.

Acceptance test: end a session after a partial repair, then start a fresh session with “continue.” It must identify the same task, preserve user changes, find existing evidence, perform the correct next action, and avoid rereading the full research archive. Repeat after a deliberately stale checkpoint. This is a product demonstration as well as developer hygiene.

## Sequenced build plan, October 26–November 4

Dates are targets; acceptance gates determine progress. Reserve daily time for the demo and evidence rather than leaving both to the final day.

| Target | Work and dependency | Exit gate |
|---|---|---|
| Oct 26 | Record baseline/rules unknowns; select one product scope; establish developer handoff; fix A1 and unwired pass results. | Deliberately failing checks cannot produce verified success. New session identifies next task. |
| Oct 27 | Fix package/CLI and clean CI; install real skills; prove one host can deny an action. | Extracted tarball installs outside source repo; harmless action succeeds; blocked action has no side effect. If hook proof fails, choose a controlled runner and narrow support claims. |
| Oct 28 | Wire the first demo rule and policy; repair containment/integrity boundaries needed by that path; implement reversible patch handling. | End-to-end interception, preservation of unrelated work, verifiable recovery. No claim of tamper resistance beyond tested authority boundaries. |
| Oct 29 | Connect Meta companion and Fireworks adapter; verify actual account/model access and cap spending. | Same finding → bounded proposal → independently verified patch through both configured paths. |
| Oct 30 | Connect Baseten; implement Modal isolated verifier with explicit network/resource limits. | Each partner has a live receipt or a precise access blocker. Core local workflow remains usable when a provider fails. |
| Oct 31 | Thin local evidence UI and packaged session continuation. | A fresh user can identify what happened and what to do next; fresh agent resumes correctly. |
| Nov 1 | Deterministic evaluation, small paired model runs, three target-user sessions. | Record successes, failures, false blocks, task completion, time, token use, and user confusion. Fix observed failures. |
| Nov 2 | Stabilize onboarding and demonstration; rehearse outages and rollback. | Fresh-machine instructions and recorded workflow work without hidden setup. No new architecture. |
| Nov 3 | Freeze candidate, record demo at the permitted length, reconcile README claims, prepare and submit if requirements/access permit. | Required links and submission fields verified; use actual confirmation receipt to establish submission. |
| Nov 4 | Buffer for submission problems and targeted fixes. | Confirm submission before 6 PM Vancouver; public deadline must be rechecked for changes. |

Explicit deferrals: full Cordis replication, six production adapters, SAM/Image on the critical path, advanced PFLOP instrumentation, learning loops, training, mobile/Electron, and blanket security guarantees. All-partner connectivity stays in scope, but missing credits remain a visible blocker rather than assumed expenditure.

## Evidence that can strengthen a submission

- Deterministic suite: roughly 20 unsafe fixtures and 10 benign cases spanning only the supported boundary. Include quoted shell text, alternate command forms, symlinks, denied actions with attempted side effects, stale state, and provider failure. Report counts, not “zero false positives” as a universal property.
- Small model comparison: three representative tasks, fenced and unfenced, same starting snapshot/model/budget; three repetitions only if the cost cap permits (18 runs). Keep seeded failures distinct from spontaneous model mistakes. Measure task success and unsafe side effects separately.
- User validation: three nontechnical builders attempt the install/repair/resume journey. Observe where they need help, whether they understand the repair, and whether they can resume. This is exploratory feedback, not statistical validation.
- Demo: show the user problem, one observable interception, Meta's useful explanation and repair, real check output, recovery, then fresh-session continuation. Display partner participation through real evidence. Use a labelled recording if the network fails; never present playback as a live call.
- Judge packet: one reliable quickstart, capability/support matrix, evidence links, model/provider IDs, honest limitations, pre-existing-work disclosure, and the official required deliverables once retrieved.

The strongest claim will be narrow and demonstrated: a particular unsafe action was prevented, a useful repair was checked, and work continued across a session boundary.

## Verification record and coverage

Executed: existing `bun run typecheck`, `bun run validate`, `bun test`; isolated clean-copy validation; build and package extraction/init; repeated source installation; hook/skill inspection; failing-test verifier reproduction; integrity and containment checks. Existing workspace gates passed with the limitations above; clean-copy validation and extracted-package initialization failed as described.

Static review: CLI, build/install, adapters, rule registry, verifier/integrity/git primitives, Meta/visual helpers, CI, routing/status/product documents. Standards: repository build contract, TypeScript checks, distribution behavior, explicit trust-boundary reasoning, and official provider contracts. This is not a formal OWASP certification.

Not assessed: exhaustive rule bypass coverage, dependency vulnerability scan, every research citation, live host enforcement, public npm availability, GitHub CI run state, live provider accounts, full authenticated contest rules. No blanket secure/production-ready verdict is warranted. Read-only audit reproductions used temporary directories; this report is the only repository change.
