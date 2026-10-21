Principal Research Audit: Ground-Verifying Phase 0 and Charting the Winning Hackathon Path for vibe-fence
Section 1 Executive Verdict
The single most successful path to win the Meta Global AI Developer Hackathon ($1,000,000 prize pool, Indie track Build for Your World, October 26–November 4, 2026) and ship a defensible product is to freeze vibe-fence as a deterministic, zero-config local runtime containment harness (npx vibe-fence init) paired with an asynchronous pedagogical companion powered by Meta Muse Spark 1.3 and Muse Wonder 1.01. The Phase 0 core thesis in docs/research/synthesis/FINAL-v2.md (lines 12–28)—that a deterministic fence must decide safety while the language model explains it on an orthogonal teaching dial (max→medium→min→silent)—is confirmed by independent empirical evidence, whereas the execution sequence in FINAL-v2.md §4 (lines 98–145) misorders critical security dependencies and underestimates supply-chain bypass vectors1.
Open-web ground verification overturns the assumption that static command blocklists or probabilistic vendor classifiers can protect non-technical creators. Alex Wauters' August 2026 study of 409,000 agent permission decisions demonstrates that human reviewers miss 33.7% of malicious commands overall and miss 52.5% of threats camouflaged inside package.json scripts (npm run analyze), while Anthropic's classifier-based Auto Mode suffers a 17% false-negative rate6. Simultaneously, the October 2026 Claude Code hook benchmark proves that 50% of existing guard hooks fail completely (0/8 blocked) when users enable --dangerously-skip-permissions, whereas deterministic policy engines (nomos) achieve 7/8 protection with 0/4 false positives on benign work5.
Winning requires three decisive pivots during the 10-day sprint: closing all eight docs/clief/RECONCILE.md gaps in Days 1–5 (prv-09.ts Standard-mode ethics lock, bill-01.ts AST loop guard, billing-guard.ts, verify-remote.ts live Supabase Row-Level Security probe, anonymize.ts, and integrity.ts state-tree attestation), replacing "Turbo" branding with guarantee-based autonomy bands (guarded→assisted→autonomous→open), and anchoring the submission on a 3-minute split-screen Visceral Delta video backed by a 10/10 Adversary Bench1.
Section 2 Findings by Research Question
2.1 RQ1: Elicitability — Does vibe-fence's Elicitation Thesis Survive Contact with Greenfield Code?
Phase 0 (docs/research/synthesis/03-elicitation.md, lines 18–94; docs/research/synthesis/FINAL-v2.md, S-06..S-08, lines 38–46) rejected the initial hypothesis that free-form multi-sample synthesis (1→5→self-critique→synthesize-1) outperforms single-shot generation for code, locking instead on execution-guided 1→verify→conditional best-of-k with Tournament Selection for code and reserving 1→N→synthesize-1 for architectural plans1. Open-web verification confirms the rejection of code-level 1→5→synthesize-1 and exposes a critical failure mode when applying unpinned 1→N→synthesize-1 to greenfield Next.js, Tailwind, and Supabase prompts from non-technical creators1.
In greenfield web development, non-technical prompters issue underspecified, outcome-oriented requests such as adding user authentication and profile persistence to Supabase. Unlike SWE-bench Python issue repair—where an existing repository constrains file paths, module boundaries, and test harnesses—greenfield Next.js and Supabase projects exhibit high structural degrees of freedom across incompatible framework generations, including Next.js App Router versus Pages Router, @supabase/ssr cookie middleware versus deprecated @supabase/auth-helpers-nextjs, and Tailwind v3 tailwind.config.ts versus Tailwind v4 @import "tailwindcss" directives1. When an agent samples  architectural plans or code completions from an underspecified prompt and synthesizes them without a pre-locked environment contract, the synthesis step blends incompatible idioms into chimeric code that fails compilation. Conversely, empirical evaluations of runtime and compile-time verification gates—including the ICSE 2026 AgentSpec study (>90% prevention of unsafe executions at millisecond overhead) and the AgentGuard evaluation on Claude Code (reducing abnormal executions from 69.0% to 26.7% and increasing task completion from 21.7% to 35.0% across 100 held-out tasks)—demonstrate that mechanical verification paired with targeted retry (1→verify→conditional best-of-k) is the primary determinant of functional correctness5.
Sub-Pattern
Phase 0 Verdict (FINAL-v2.md / 03-elicitation.md)
Greenfield JS/TS Evidence (Next.js / Tailwind / Supabase)
Audit Status
Citation (File+Line / URL)
Free-form Code Synthesis (1→5→synthesize-1)
Rejected for code; merges incompatible ASTs and inflates tokens 5–7×.
Zero positive evidence. Produces chimeric App/Pages Router and Tailwind v3/v4 syntax errors on greenfield repositories.
CONFIRMED
docs/research/synthesis/03-elicitation.md:24-62; FINAL-v2.md:38-41
[cite: 1]
Execution-Guided 1→verify→conditional best-of-k
Settled (S-06): sample , run verifier, branch to  only on mechanical failure.
Strong evidence. AgentGuard lifts Claude Code task completion from 21.7% to 35.0% and cuts abnormal runs from 69.0% to 26.7%.
CONFIRMED
docs/research/synthesis/FINAL-v2.md:38-42; src/framework/verifier.ts:1-85; agentskillshub.top
[cite: 1, 5]
Tournament Selection (Judge with Compiler Output)
Settled (S-07): pairwise judge grounded by deterministic test/AST output.
Moderate transfer evidence. Effective only when the judge receives tsc --noEmit and Next.js build stderr; ungrounded LLM judges hallucinate type safety.
AMENDED
docs/research/synthesis/03-elicitation.md:112-145; INDEPENDENT-GEMS.md:240-278
[cite: 1]
Ephemeral Verifier Bootstrap (Testless Repos)
Harvested in INDEPENDENT-GEMS.md (Gem #11) to mitigate B-07 (testless hobby repos).
Load-bearing for greenfield. Hobby Next.js repositories have 0% unit test coverage at init; ephemeral tsc + route-render + env-schema probing is mandatory.
AMENDED (Promoted to P0)
docs/research/synthesis/INDEPENDENT-GEMS.md:245-288; _CONSISTENCY.md:142-158
[cite: 1]
Multi-Agent Debate / Mixture-of-Agents (MoA)
Rejected in 03-elicitation.md due to latency, cost, and H-04 reasoning-token bloat.
Zero greenfield evidence. Amplifies latency and token drift (H-03, H-04 in HTML-REVIEW.md) without an execution oracle.
CONFIRMED
docs/research/synthesis/03-elicitation.md:64-98; HTML-REVIEW.md:32-58
[cite: 1]
Plan Synthesis (1→N→synthesize-1 via vibe-plan)
Settled (S-08): reserved for architectural planning via Muse Wonder 1.0.
Overturned for unpinned greenfield. Synthesizing  plans without a pre-locked stack contract mixes incompatible Supabase/Next.js patterns. Replace with 1-call Contract Elicitation + Stack Pinning.
OVERTURNED (for unpinned plans)
docs/research/synthesis/03-elicitation.md:146-188; src/skills/vibe-plan/SKILL.md:1-60
[cite: 1]
postinstall & Script Supply-Chain Guard
Patched via INDEPENDENT-GEMS.md and 04-guardrails.md (--ignore-scripts).
Critical empirical validation. Wauters' 409k study shows a 52.5% human miss rate on malicious npm run scripts; requires package.json AST inspection.
AMENDED
docs/research/synthesis/04-guardrails.md:190-235; explainx.ai
[cite: 1, 6]
Amendments to FINAL-v2.md for RQ1
The audit amends S-08 (FINAL-v2.md:44-46 and src/skills/vibe-plan/SKILL.md) by replacing free-form 1→N→synthesize-1 plan synthesis on greenfield repositories with deterministic stack-pinning paired with single-call Muse Wonder 1.0 contract generation1. Prior to code generation, vibe-init and vibe-plan must emit a machine-readable .fence/stack-contract.json file that locks the exact framework idioms—specifically Next.js 15 App Router, @supabase/ssr server-client separation, Tailwind v4 CSS-first configuration, and required .env.local schema keys—which vibe-guard then enforces deterministically. Furthermore, Gem #11 (INDEPENDENT-GEMS.md:245-288) is promoted to S-06a in FINAL-v2.md, mandating that src/framework/verifier.ts execute a zero-config, three-stage Ephemeral Verifier on every testless greenfield repository before signaling task completion: first running tsc --noEmit typechecking, second executing a static AST scan for client-imported server secrets or unthrottled paid-API hooks, and third performing a headless HTTP smoke probe against the local route prior to deployment1.
New Blind Spots Surfaced in RQ1
This analysis surfaces blind spot B-09 (Idiom Drift Across Training Cutoffs in Greenfield Scaffolds). Foundation models frequently interleave Next.js 13/14 pages/ conventions or synchronous cookies() calls with Next.js 15 asynchronous await cookies() and @supabase/ssr primitives, creating silent authentication cookie failures that pass tsc --noEmit unless .fence/stack-contract.json enforces version-specific AST lint rules1.
2.2 RQ2: Guardrail Economics — Which Blocks Are Worth Their False-Positive Budget?
Phase 0 (docs/research/synthesis/04-guardrails.md, lines 45–210; docs/research/synthesis/FINAL-v2.md, C-01 & B-02, lines 62–71, 150–156) locked a tiered policy in src/config/severity-policy.json and .fence/app-profile.json (14 blocks in local, 29 in shared, 55 in public), alongside warn→block promotion after allowlisting, while flagging the unmeasured false-positive (FP) and bypass budget as the primary load-bearing unknown (B-02)1.
Open-web ground verification supplies the exact quantitative distributions required to resolve C-01 and B-02. In the October 10, 2026 Claude Code Hook-Zoo Benchmark (agentskillshub.top), researchers evaluated 12 open-source guard hooks across 8 high-risk actions (rm -rf, git push --force, read .env, curl | sh, committing a secret, git reset --hard, adding an SSH key, and chmod -R 777) and 4 ordinary benign developer actions5. In the control run without any external hook, Claude Code's native permission prompts intercepted 7/8 (87.5%) of risky actions—failing only by allowing read .env to execute—but interrupted 3/4 (75.0%) of ordinary benign actions5. When users disabled interactive prompts via --dangerously-skip-permissions, 6 of the 12 community hooks (50%, including ccgate and Dippy) collapsed to 0/8 (0.0%) threat interception, and ccgate actively auto-approved rm -rf on an in-project directory5. Similarly, popular script collections such as claude-code-hooks-mastery stopped only 2/8 (25.0%) of risky actions when prompts were skipped and interrupted 3/4 (75.0%) of benign work when prompts were kept5. By contrast, the top-ranked policy engine, nomos, intercepted 7/8 (87.5%) of risky actions both with and without native prompts—missing only chmod -R 777—while interrupting 0/4 (0.0%) of ordinary developer actions5.
Alex Wauters' August 2026 analysis of 409,000 approve/deny decisions across more than 40,000 game runs (scalex.dev) explains why human-in-the-loop permission gating fails as a security boundary6. Across all 409,000 decisions, human supervisors achieved a mean accuracy of only 66.3% (missing roughly 1 in 3 malicious commands), while 32.9% of all sessions ended with a net-negative security score where approved threats and erroneously blocked safe commands outweighed correct decisions6. Even more critically for vibe-fence, Wauters' dataset reveals that human miss rates surged to 52.5% (a 47.5% interception rate) on camouflaged npm script executions such as npm run analyze and npm run setup (48.0% missed), compared to a 28.4% miss rate on overt exfiltration commands6. Furthermore, 7.0% of players approved every single prompt unconditionally—mirroring Anthropic's internal telemetry in which users blindly approve 93.0% of permission prompts (H-06 in HTML-REVIEW.md)—while Anthropic's classifier-driven Auto Mode still suffers a 17.0% false-negative rate (83.0% interception) due to mislinked consent context1.
Complementing these gating benchmarks, a 2026 empirical evaluation of 679 rule files across over 5,000 Claude Code runs established that every standalone rule that improved agent performance was phrased as a prohibition ("do not"), yielding a +13.8 percentage point gain, whereas positive directives ("do") degraded task completion (H-04 in HTML-REVIEW.md)1. In parallel, Bastani et al. (PNAS, June 25, 2025, n≈1,000 high school mathematics students; corrected from the H-02 18k misattribution in HTML-REVIEW.md:18-27) demonstrated that unguarded generative AI access (GPT Base) increased assisted practice scores by +48% but degraded subsequent closed-book exam performance by -17% compared to a textbook-only control group, whereas guarded, hint-first scaffolding (GPT Tutor) increased practice performance by +127% and completely eliminated the -17% learning deficit1.
Defense Mechanism / Evaluated Cohort
Malicious Threat Interception Rate (True Positive %)
Benign Workflow Interruption / Net-Negative Rate (False Positive %)
Primary Failure Mode Exposed by Benchmark
Citation (File+Line / URL)
vibe-fence GateGuard Target Profile
100.0% (10/10: 8/8 nomos + 2/2 Wauters scripts)
0.0% (0/4 ordinary actions interrupted)
Requires AST inspection of package.json scripts.* and chmod -R 777 rule addition.
FINAL-v2.md:48-71; agentskillshub.top; explainx.ai
[cite: 1, 5, 6]
nomos Policy Engine (Prompts Skipped or Kept)
87.5% (7/8 risky actions stopped)
0.0% (0/4 ordinary actions interrupted)
Missed chmod -R 777 in the 8-threat Claude Code hook test.
agentskillshub.top; trendshift.io
[cite: 5, 11]
Claude Code Native Prompts (Control Run, No Hook)
87.5% (7/8 risky actions stopped)
75.0% (3/4 ordinary actions interrupted)
Allowed read .env through unblocked; 75% benign interruption drives users to skip prompts.
agentskillshub.top; scalex.dev
[cite: 5, 7]
Anthropic Auto Mode Classifier
83.0% (17.0% false-negative rate)
Low (classifier auto-approves)
Classifier erroneously links dangerous commands to prior user consent signals.
scalex.dev; 04-guardrails.md:240-275
[cite: 1, 7]
Human Reviewer Overall (Wauters 409k Decisions)
66.3% (33.7% of threats missed)
32.9% of sessions net-negative
Approval fatigue under time pressure degrades human vigilance after repeated prompts.
scalex.dev; explainx.ai; umesh-malik.com
[cite: 6, 7, 12]
Human Reviewer on Camouflaged npm Scripts
47.5% (52.5% missed on npm run analyze)
32.9% of sessions net-negative
Developers trust familiar command names (npm run build/analyze) without reading package.json.
explainx.ai; scalex.dev
[cite: 6, 7]
claude-code-hooks-mastery (Prompts Skipped)
25.0% (2/8 risky actions stopped)
75.0% (3/4 ordinary prompted when kept)
Fails on 6 of 8 destructive/exfiltration actions when --dangerously-skip-permissions is active.
agentskillshub.top
[cite: 5]
Human Blind-Approval Cohort (Anthropic Telemetry)
7.0% (93.0% of prompts approved blindly)
N/A (rubber-stamped)
Users treat recurring permission modals as cookie banners (7% approved 100% in Wauters' game).
HTML-REVIEW.md:60-72; scalex.dev; explainx.ai
[cite: 1, 6, 7]
ccgate / Dippy Hooks (--dangerously-skip-permissions)
0.0% (0/8 risky actions stopped)
Auto-approved rm -rf on project folder
Prompt-wrapping gates switch off completely when native permission prompts are bypassed.
agentskillshub.top
[cite: 5]
To avoid the 75.0% benign interruption rate that compels users to disable guardrails (B-02), vibe-fence must partition its 14 baseline local rules into 10 settled hard-blocks (which exhibit near-zero false positives and prevent catastrophic blast radius) and 4 calibrated or downgraded rules that require AST context or shadow-checkpoint downgrades before shipping1.
Rule ID & Name
Phase 0 Setting (04-guardrails.md)
Empirical FP & Bypass Assessment
Audit Decision
Citation (File+Line / URL)
SEC-01 Client Key Exposure (NEXT_PUBLIC_)
block (exit 1)
0% FP. Exposing SERVICE_ROLE or secret API keys to browser bundles is always a vulnerability.
LOCK AS HARD BLOCK
docs/research/synthesis/04-guardrails.md:52-78; FINAL-v2.md:48-55
[cite: 1]
SEC-02 Dotenv & Credential Read (.env, ~/.ssh, ~/.aws)
block (exit 1)
Low FP if .env.example allowlisted. Closes the #1 gap in Claude Code's native prompts (nomos test).
LOCK AS HARD BLOCK
docs/research/synthesis/04-guardrails.md:79-104; agentskillshub.top; scalex.dev
[cite: 1, 5, 7]
SEC-03 Secret Commit to Git
block (exit 1)
High FP on dummy keys if regex-only (Anders 14.8% secret-mention context). Pair prefix regex with Shannon entropy + dummy-token allowlist.
AMENDED HARD BLOCK
docs/research/synthesis/04-guardrails.md:105-134; entro.security
[cite: 1, 13]
FS-01 Realpath Boundary Escape (.., ~, /etc)
block (exit 1)
0% FP when canonicalized via fs.realpathSync inside project root (src/framework/integrity.ts).
LOCK AS HARD BLOCK
docs/research/synthesis/ECC-SECURITY-DEEPDIVE.md:88-142; scalex.dev
[cite: 1, 7]
CMD-01 Destructive File/Perm Wipe (rm -rf, chmod -R 777)
block (exit 1)
0% FP on root/home/.git deletion and chmod -R 777 (explicitly closes nomos's sole 7/8 miss).
AMENDED HARD BLOCK (Add chmod 777)
docs/research/synthesis/04-guardrails.md:135-162; agentskillshub.top
[cite: 1, 5]
NET-01 Unverified Pipe-to-Shell (curl | sh, wget | bash)
block (exit 1)
0% FP in greenfield JS/TS development; standard nomos benchmark gate.
LOCK AS HARD BLOCK
docs/research/synthesis/04-guardrails.md:163-188; agentskillshub.top
[cite: 1, 5]
SUP-01 Supply-Chain Script Execution (postinstall / npm run)
block (exit 1)
Critical vector. Wauters' 409k study shows a 52.5% miss rate on npm run analyze. Enforce --ignore-scripts + AST scan of package.json scripts.
AMENDED HARD BLOCK
docs/research/synthesis/INDEPENDENT-GEMS.md:112-148; explainx.ai
[cite: 1, 6]
GIT-01 Uncheckpointed Destructive Git (push --force, reset --hard)
block (exit 1)
0% FP when reset --hard is auto-preceded by a silent src/framework/git.ts shadow ref checkpoint and push --force to main is blocked.
LOCK AS HARD BLOCK
docs/research/synthesis/04-guardrails.md:212-238; src/framework/git.ts:1-90
[cite: 1, 5]
DB-01 Destructive Remote Schema / RLS Disable
block (exit 1)
0% FP on DISABLE ROW LEVEL SECURITY or unbacked DROP TABLE; pair with verify-remote.ts live RLS probe.
LOCK AS HARD BLOCK
docs/research/synthesis/INDEPENDENT-GEMS.md:150-185; RECONCILE.md:18-35
[cite: 1]
PRV-09 Meta Contributor-Mode Telemetry Leak
block (exit 1)
0% FP. P0 ethics gate (INDEPENDENT-GEMS.md): block API calls if Contributor mode is active without explicit opt-in flag; force Standard mode.
LOCK AS HARD BLOCK (P0 Ethics)
docs/research/synthesis/INDEPENDENT-GEMS.md:210-244; 06-meta-models.md:175-215
[cite: 1]
BILL-01 Uncapped Paid API / Loop Invocation
block (exit 1)
High FP if regex-only on useEffect. Must use TypeScript AST check (blocking only missing dependency array / infinite state-mutation loops or while(true) paid calls) + runtime billing-guard.ts.
HUMAN EVAL + AST REFINEMENT
docs/research/synthesis/INDEPENDENT-GEMS.md:186-209; RECONCILE.md:22-38
[cite: 1]
DEP-01 Arbitrary Package Installation (npm i)
warn→block
Extreme FP risk (75% interruption) if blocking common UI packages (lucide-react, zod, @supabase/ssr). Allowlist top-200 greenfield packages with --ignore-scripts; block only unknown/typosquatted packages.
DOWNGRADE TO ALLOWLIST + WARN
docs/research/synthesis/04-guardrails.md:190-211; agentskillshub.top
[cite: 1, 5]
SH-01 Chained Shell Operators (&&, ;, subshells)
block in strict profile
High FP. Coding agents chain benign commands (mkdir && touch). Parse subcommands via GateGuard fact-forcing (ECC-SECURITY-DEEPDIVE.md) instead of blocking &&.
OVERTURNED (Parse AST, Do Not Block &&)
docs/research/synthesis/ECC-SECURITY-DEEPDIVE.md:45-92; 04-guardrails.md:145-160
[cite: 1]
ARCH-01 Component / File Size Budget (>300 LOC)
warn→block
High flow-disruption FP (B-05). Blocking code generation mid-feature over line count causes task failure. Keep as non-blocking warn + post-turn refactor hint.
DOWNGRADE TO NON-BLOCKING WARN
docs/research/synthesis/02-harness-influence.md:120-165; _CONSISTENCY.md:118-132
[cite: 1]
Amendments to FINAL-v2.md for RQ2
The audit amends C-01 and S-09 (FINAL-v2.md:48-71 and src/config/severity-policy.json) to lock the 10 zero-FP rules (SEC-01, SEC-02, SEC-03, FS-01, CMD-01 including chmod -R 777, NET-01, SUP-01 including package.json scripts.* AST inspection, GIT-01, DB-01, and PRV-09) as deterministic hard-blocks (exit 1) across all profiles (local, shared, public), while downgrading DEP-01, SH-01, and ARCH-01 in the local profile to prevent the 75.0% benign interruption rate documented in the Claude Code hook benchmark1. Furthermore, to resolve blind spot B-05 (Teaching Verbosity ↔ Code Correctness Interaction, _CONSISTENCY.md:125-138), vibe-fence must enforce strict context-stream separation (05-companion-ux.md:88-134) so that vibe-teach explanations generated by Muse Spark 1.3 are rendered exclusively to the user's terminal or UI companion stream and are never injected into the coding agent's working context window, preserving the ≤400 token prohibitory budget (src/framework/context-budget.yml)1.
New Blind Spots Surfaced in RQ2
The Wauters dataset exposes blind spot B-10 (Trojan package.json Script Aliasing). Autonomous agents or prompt-injected dependencies can write a malicious shell payload into package.json under scripts.build, scripts.dev, or scripts.analyze and subsequently invoke npm run build—an action that bypasses naive command-name allowlists and deceives 52.5% of human reviewers6. Consequently, vibe-guard must diff and parse the string values of package.json scripts through the same shell-AST GateGuard before permitting any npm, pnpm, yarn, or bun run execution1.
2.3 RQ3: Turbo as Product — Deterministic Containment vs. Classifier, and the Naming Trap
Phase 0 (docs/research/synthesis/_CONSISTENCY.md, C-05, lines 58–79; docs/research/synthesis/FINAL-v2.md, C-06, lines 78–86) identified the architectural split between probabilistic safety classifiers and deterministic containment paired with reversibility as the single genuine unresolved divergence across the six research streams1.
A forensic trace of every deployed "Turbo" or auto-approval mode in 2026 resolves this divergence conclusively in favor of deterministic containment. Anthropic's Claude Code Auto mode combines local fast-filters with a server-side classifier to review tool outputs and approve commands without prompting, yet Anthropic's own containment engineering disclosures cited by Wauters (May 2026) report a 17.0% false-negative rate because the classifier erroneously links dangerous commands to prior user consent signals7. Meanwhile, flags such as Claude Code --dangerously-skip-permissions, Codex approval:never, Antigravity Turbo, and Factory Turbo disable interactive approval gates entirely; in the October 2026 Hook-Zoo evaluation, prompt-wrapping tools (ccgate, Dippy) lost 100% of their protective value (0/8 blocked) under --dangerously-skip-permissions5. Similarly, Cursor's Auto-Run classifier relies on an uncalibrated heuristic and LLM allowlist that Cursor explicitly documents as best-effort without published precision or recall metrics (01-harnesses.md:72-108)1.
Consequently, vibe-fence must reject probabilistic classifiers as its primary gate (FINAL-v2.md §1 Thesis #1 & #4)1. Instead, "Safe-Turbo" speed for non-technical vibe-coders is achieved by combining six portable deterministic containment mechanisms that render over 95% of routine coding actions mechanically safe and instantly reversible without human prompts1.

Deployed Mechanism / Vendor Precedent
Vendor Implementation (2026)
Empirical Failure Mode / Gap
vibe-fence Portable Implementation (src/framework/)
Citation (File+Line / URL)
Anthropic Auto Mode Classifier
Local fast-filter + server LLM scan of tool calls (claude).
17% false-negative rate on dangerous commands tied to prior consent.
Rejected as primary gate. Deterministic vibe-guard AST/policy rules decide; Muse Spark 1.3 only explains.
docs/research/synthesis/04-guardrails.md:240-275; scalex.dev
[cite: 1, 7]
Antigravity Turbo / Claude --dangerously-skip-permissions / Codex approval:never
Switches off interactive permission prompts; relies on OS/container sandbox if configured.
0/8 protection in 6/12 community hooks when prompts are skipped; un-sandboxed local runs wipe ~ or leak .env.
Pre-Tool Hook Interception (exit 1 / exit 2): Enforces policy even when --dangerously-skip-permissions is active (nomos pattern).
docs/research/synthesis/01-harnesses.md:45-89; agentskillshub.top
[cite: 1, 5]
ECC 2.2.3 GateGuard + State-Tree Hardening
Pre-tool fact-forcing parser + read-only protection of harness config files.
Complex 7-harness enterprise surface (hooks_enabled/hook_profile).
integrity.ts + vibe-guard: Hash-attested .fence/ and hook configs; blocks agent self-modification of rules.
docs/research/synthesis/ECC-SECURITY-DEEPDIVE.md:110-195; APPENDIX-ECC.md:1-45
[cite: 1]
Bolt / StackBlitz WebContainer Probe
Browser-based WASM POSIX micro-sandbox with no host filesystem access.
Lacks remote Supabase RLS verification (verify-remote.ts) and paid-API loop protection (BILL-01).
Environment Probe (Gem #2): Detects WebContainer/devcontainer vs. bare host OS and tightens host realpath/egress locks automatically.
docs/research/synthesis/INDEPENDENT-GEMS.md:45-82; 01-harnesses.md:110-140
[cite: 1]
Git Shadow Checkpoints + fence undo
Replit Agent checkpoints / Cursor checkpoints (proprietary IDE state).
Not portable across CLI agents (Codex, OpenCode, Kimi CLI, Hermes).
Portable src/framework/git.ts: Creates silent refs/fence/checkpoints/<timestamp> before every mutating turn + 1-command npx vibe-fence undo.
docs/research/synthesis/FINAL-v2.md:20-26, 78-86; src/framework/git.ts:1-95
[cite: 1]
Resolving the Naming Trap (C-06) and Amending FINAL-v2.md
In FINAL-v2.md (lines 78–86) and synthesis-explorer.html (HTML-REVIEW.md:85-112), using the standalone label "Turbo" creates a dangerous semantic collision because Antigravity and peer agent CLIs use "Turbo" to denote disabling all safety boundaries1. The audit amends C-06 and S-11 (FINAL-v2.md:52-55, 78-86) by retiring the standalone "Turbo" mode identifier in src/config/severity-policy.json and src/framework/dial.ts and locking four guarantee-based autonomy bands in .fence/config.json: guarded (prompts on all mutating file, shell, and network operations for high-scrutiny debugging), assisted (auto-approves in-project file edits and typechecks while prompting on package installs, schema changes, and external network calls), autonomous (the default "Safe-Turbo" mode with zero routine prompts and at most 3 human gates per session, enforced by the 6-layer deterministic containment cage and requiring human confirmation solely for live production deployment, destructive remote database migration, or live paid-API key activation), and open (requiring an explicit --unsafe-open flag while retaining P0 ethics PRV-09 and credential exfiltration SEC-01..03 blocks)1. In addition, S-11 is amended to incorporate ECC State-Tree Self-Protection (ECC-SECURITY-DEEPDIVE.md:110-165), requiring src/framework/integrity.ts to compute a SHA-256 manifest of .fence/, src/config/severity-policy.json, and active agent hook configurations at initialization and to halt with exit 2 if the coding agent attempts to modify its own guardrail files1.
2.4 RQ4: Demo That Wins — Visceral Delta vs. Evaluator Rubric vs. Adversary Bench
Phase 0 (docs/research/synthesis/DEMO-SCRIPT.md, lines 1–95; docs/research/synthesis/FINAL-v2.md §6, lines 168–198) produced two primary demonstration artefacts: the Visceral Delta 0:00→3:00 video script and the 5×4 evaluation rubric paired with the 5-step acceptance suite and adversarial fence benchmark1.
Cross-referencing this package against winning projects from Cerebral Valley hackathons (2024–2026, including AI Engineer World's Fair 2026 winner SplatForge, Vercel × DeepMind Zero to Agent security and monitoring projects Sentinel and Watchlog, OpenAI Voice Hack Night's Codetalker, and the Enterprise MCP Hackathon judging rubric) and the official Meta Global AI Developer Hackathon guidelines (Oct 26–Nov 4, 2026, co-hosted by Meta and Cerebral Valley) reveals a sharp two-stage division in how judges evaluate Indie Build for Your World submissions3. In Round 1 filtering, which accounts for 80% of initial selection across up to 20,000 accepted participants (Nov 5–9 judging window), judges spend under three minutes watching the demo video and under 60 seconds scanning the top of the GitHub README3. Submissions that open with static architecture slides or terminal installation logs are eliminated early, whereas Cerebral Valley winners (SplatForge, Sentinel, Codetalker) hook judges in the first 15 seconds with a visceral, real-time contrast demonstrating an autonomous loop resolving a high-stakes failure mode15. In Round 2 technical due diligence—which represents 20% of judge time but drives 45% of the final score via Tooling (25%) and Depth (20%)—finalist judges inspect the repository to verify whether the required Meta models (Muse Spark 1.3, Muse Wonder 1.0, Muse Image) perform load-bearing orchestration rather than decorative wrapping (just as SplatForge explicitly separated off-the-shelf foundation models from custom loop orchestration) and whether the security claims survive adversarial edge cases (Sentinel and nomos benchmarks)3.
Rubric / Demo Artefact
Judge Attention Pattern (Skim vs. Litigate)
How It Moves Indie Track Judges (Impact 30% / Tooling 25% / Demo 25% / Depth 20%)
Required Upgrade for vibe-fence Submission
Citation (File+Line / URL)
Visceral Delta Video (0:00→3:00)
Heavily Watched (100% of judges)
Drives Demo (25%) and Impact (30%). Shows a non-technical creator saved from a real disaster (leaked Supabase service key + runaway $500 API loop) in real time.
Open at 0:00 with a split-screen: Left (Unfenced Agent --dangerously-skip-permissions) leaks key & loops API in 25s; Right (npx vibe-fence init) blocks both in <15ms and coaches via Muse Spark 1.3.
docs/research/synthesis/DEMO-SCRIPT.md:1-85; FINAL-v2.md:168-184; cerebralvalley.ai
[cite: 1, 15, 17]
5×4 Rubric Row 1: auth × secrets / deploy
Litigated in Code Review
Judges check if vibe-fence only greps for NEXT_PUBLIC_ or actually verifies Supabase Row-Level Security (RLS).
Highlight src/framework/verify-remote.ts probing the live Supabase REST endpoint with an anon token to prove RLS is active (Gem #3).
docs/research/synthesis/INDEPENDENT-GEMS.md:83-111; RECONCILE.md:20-30
[cite: 1]
5×4 Rubric Row 2: paid API × structure / deploy
Litigated in Code Review
Runaway billing loops (useEffect calling paid LLM/Muse endpoints) are the #1 financial fear of indie vibe-coders.
Demonstrate src/rules/bill-01.ts (AST detection of unthrottled useEffect fetch) + billing-guard.ts (hard cap of ≤5 Muse Wonder 1.0 calls/session).
docs/research/synthesis/INDEPENDENT-GEMS.md:186-209; 06-meta-models.md:110-155
[cite: 1]
5×4 Rubric Row 3: add-dep × secrets / git
Litigated by Security Judges
Judges familiar with Wauters' 409k study know npm run analyze / postinstall is the #1 agent bypass vector (52.5% human miss rate).
Show SUP-01 blocking a malicious package.json scripts.analyze exfiltration payload that native Claude Code prompts miss.
docs/research/synthesis/04-guardrails.md:190-235; explainx.ai
[cite: 1, 6]
5×4 Rubric Rows 4 & 5: bug fix & ship-to-prod × structure / git
Skimmed in README
Expected baseline hygiene; judges verify via automated CI badge rather than manual inspection.
Render as a compact, auto-generated Markdown scorecard table at the top of README.md via fence validate.
docs/research/synthesis/FINAL-v2.md:185-198; ECC-SIDEBAR.md:210-260
[cite: 1]
Adversary Bench (nomos 12-Action + Wauters Script Suite)
Litigated for Depth (20%)
Directly proves vibe-fence beats the state-of-the-art open-source hook (nomos 7/8) by scoring 8/8 (100%) on the nomos suite (catching chmod -R 777) plus stopping camouflaged npm run scripts, with 0/4 benign false positives.
Include a 1-command reproducible npm run bench:adversary script that outputs the comparison table against native prompts, ccgate, and nomos.
docs/research/synthesis/04-guardrails.md:260-310; agentskillshub.top; explainx.ai
[cite: 1, 5, 6]
Meta Model Depth (Muse Spark 1.3 + Wonder 1.0 + Muse Image)
Strictly Audited for Eligibility & Tooling (25%)
Hackathon rules require meaningful use of Meta's latest models (Meta Model API, Muse Image, Muse Code/Spark/Wonder).
Show live POST /v1/responses stateless encrypted reasoning replay (Spark 1.3), 1-call Wonder 1.0 architectural escalation, and Muse Image ($0.01) generating the project's live OpenGraph security badge.
docs/research/synthesis/06-meta-models.md:1-252; internshala.com; vibecodinglist.com
[cite: 1, 2, 3]
Amendments to FINAL-v2.md for RQ4
The audit amends DEMO-SCRIPT.md and FINAL-v2.md §6 (lines 168–198) by elevating the Adversary Bench from an internal test to a headline README and video artefact that executes the exact 12-action agentskillshub.top (nomos) suite plus 2 Wauters camouflaged npm run script attacks, demonstrating 10/10 malicious actions blocked with --dangerously-skip-permissions active and 0/4 ordinary actions interrupted1. Additionally, 06-meta-models.md (lines 145–174) and DEMO-SCRIPT.md are amended so that at 2:15 of the demo video, once npx vibe-fence verify passes all 5 acceptance checks and verify-remote.ts confirms Supabase RLS is active, the harness invokes Muse Image ($0.01/image) to generate a custom "Protected by vibe-fence" OpenGraph social card (public/og-verified.png) for the deployed Next.js application—converting a $0.01 Meta model requirement into a viral indie-builder feature1.
2.5 RQ5: The Most Successful Build Order (With the ECC 2.2.3 Check)
Cross-referencing FINAL-v2.md §4 (M1→M4, lines 98–145), docs/clief/STATUS.md, docs/clief/RECONCILE.md (the 8 remaining file gaps), and the affaan-m/ECC 2.2.3 analysis (docs/research/synthesis/ECC-SIDEBAR.md, ECC-SECURITY-DEEPDIVE.md, docs/clief/APPENDIX-ECC.md) exposes four critical sequencing flaws in the Phase 0 build plan that would jeopardize a 10-day hackathon sprint (October 26 – November 4, 2026)1.
First, FINAL-v2.md schedules multi-harness .yml adapter configurations across six runtimes (Claude Code, Codex, OpenCode, Kimi CLI, Hermes, Cursor, and Antigravity) early in the build while leaving src/rules/bill-01.ts, src/rules/prv-09.ts, src/framework/verify-remote.ts, src/framework/billing-guard.ts, and tools/anonymize.ts unbuilt (RECONCILE.md:12-48)1. In ECC 2.2.3, multi-harness portability is governed via an honest compliance scorecard (harness-adapter-compliance.js) rather than delaying core engine completion (ECC-SIDEBAR.md:145-210)1. Accordingly, vibe-fence must lock Claude Code, Codex, and Cursor as Tier-1 full-compliance adapters and ship an automated tools/adapter-compliance.ts scorecard for OpenCode, Kimi CLI, and Hermes on Day 6. Second, as ECC-SECURITY-DEEPDIVE.md (lines 110–195) demonstrates, an autonomous agent blocked by a hook will immediately attempt to edit .fence/app-profile.json, .claude/settings.json, or package.json scripts to bypass the restriction1. State-tree hash attestation (src/framework/integrity.ts plus read-only .fence/ enforcement) must therefore be completed on Day 1 before any adversarial testing begins. Third, tools/anonymize.ts (which scrubs secrets and PII before transmitting context to external APIs) and src/rules/prv-09.ts (which enforces Meta Standard mode by default so user code is never silently opted into Contributor training) are strict prerequisites for making any live call to Muse Spark 1.3 (POST /v1/responses) or Muse Wonder 1.0 (INDEPENDENT-GEMS.md:210-244) and must move to Days 2–31. Fourth, Steal-able #2 from APPENDIX-ECC.md (the per-gate ablation harness supporting off/gate/minus-target/placebo) must be wired into src/framework/verifier.ts by Day 7 so the team can automatically measure token budget (≤400 tokens) and false-positive rate (0/4 on benign tasks) prior to the Day 8 feature freeze1.
ECC 2.2.3 / Competitor Pattern
Source File + Line
Flaw Exposed in FINAL-v2.md M1–M4
Re-Sequenced Placement in 10-Day Plan
ECC Steal-able #1: GateGuard Fact-Forcing Taxonomy
ECC-SECURITY-DEEPDIVE.md:45-109; APPENDIX-ECC.md:8-18
[cite: 1]
FINAL-v2.md treats shell chains (&&) as a crude regex block (SH-01) and misses package.json scripts.* AST parsing.
Day 1–2 (M1): Wire AST subcommand + package.json scripts fact-forcing into vibe-guard.
ECC Steal-able #3: State-Tree Hardening Gate
ECC-SECURITY-DEEPDIVE.md:110-195; APPENDIX-ECC.md:28-36
[cite: 1]
Scheduled too late; agent can edit .fence/ or hook configs during M2 testing.
Day 1 (M1): Lock src/framework/integrity.ts SHA-256 attestation over .fence/ & dist/.
Gem #7 & #8: PRV-09 + tools/anonymize.ts + BILL-01 / billing-guard.ts
INDEPENDENT-GEMS.md:186-244; RECONCILE.md:18-42
[cite: 1]
Meta model calls (06-meta-models.md) cannot safely run without secret scrubbing, Standard mode lock, and ≤5 Wonder call cap.
Day 2–3 (M1/M2 handoff): Land before live Muse Spark 1.3 & Wonder 1.0 wiring.
Gem #2 & #3: WebContainer Probe + verify-remote.ts (Live Supabase RLS)
INDEPENDENT-GEMS.md:45-111; STATUS.md:30-58
[cite: 1]
verify-remote.ts is one of the 8 missing files in RECONCILE.md and is the centerpiece of the 5×4 auth rubric.
Day 4–5 (M2): Build alongside the Ephemeral Verifier (verifier.ts) for Next.js + Supabase.
ECC Steal-able #4 & Scorecard: hooks_enabled/hook_profile + harness-adapter-compliance.js
ECC-SIDEBAR.md:145-260; APPENDIX-ECC.md:37-48
[cite: 1]
Writing 6 full adapters in M1/M2 starves P0 security rules.
Day 6 (M3): Deep-wire Claude Code, Codex, Cursor; generate honest compliance matrix for OpenCode, Kimi, Hermes.
ECC Steal-able #2: Per-Gate Ablation (off/gate/minus-target/placebo)
ECC-SIDEBAR.md:262-330; APPENDIX-ECC.md:19-27
[cite: 1]
No automated script in M1–M4 to generate the nomos 8/8 + Wauters adversary scorecard.
Day 7–8 (M3/M4): Run automated 14-case adversary & benign bench; freeze code Day 8.
2.6 RQ6: What Would Make Us Wrong (And How We Would Know Early)?
Phase 0 (docs/research/synthesis/_CONSISTENCY.md, lines 135–176; docs/research/synthesis/FINAL-v2.md §5, lines 146–167) cataloged eight blind spots (B-01..B-08), among which B-01 (the absence of a direct user study on non-technical vibe-coders and reliance on transfer inference from SWE-bench Python and Bastani et al.'s n≈1,000 high school mathematics RCT), B-04 (build-time supply-chain injection), and B-07 (ephemeral verifier flakiness on testless hobby repositories, measured at 11.3% flaky on curated benchmarks and potentially higher on greenfield UI) represent existential product risks1.
To ensure the engineering team detects any fatal flaw within the first 72 hours of the hackathon (October 26–28) rather than during final judging, Section 5 constructs a concrete, executable Falsifier Suite for all 15 settled claims (S-01..S-15), prioritized by Cheapest-to-Run multiplied by Most-Lethal-if-True1. The three highest-priority early-warning tripwires are summarized below.
Top-Priority Risk
Linked Settled Claims
Why It Could Sink vibe-fence
Early-Warning Tripwire (Run by Day 3 / Oct 28)
Mitigation Pivot if Falsified
Citation (File+Line / URL)
1. Ephemeral Verifier Flakiness on Greenfield Next.js (B-07)
S-03, S-06, S-07
If headless route-render / build probes fail >15% of the time on valid Next.js/Supabase code due to dev-server race conditions, circuit-breaker.ts halts benign sessions.
Run verifier.ts 20 times across 5 clean Next.js + Supabase templates. Tripwire: >1/20 (5%) false-fail rate or >8s verifier latency.
Restrict synchronous turn-gate verifier to deterministic tsc --noEmit + AST + env-schema check (<1.5s, 0% flake); run HTTP route-render probe only at ship-to-prod gate.
docs/research/synthesis/_CONSISTENCY.md:152-165; INDEPENDENT-GEMS.md:245-288
[cite: 1]
2. BILL-01 / DEP-01 False-Positive Fatigue (B-02)
S-01, S-09, S-10
If vibe-guard blocks legitimate Next.js useEffect data fetches or standard UI package installs (lucide-react), users hit >1 false block/session and run rm -rf .fence.
Replay 20 real greenfield Next.js vibe-coding prompts through vibe-guard. Tripwire: >1 false-positive block across 20 benign prompts (>5% FP).
Require AST proof of missing dependency array + paid-endpoint URL match for BILL-01, and switch DEP-01 to --ignore-scripts + typosquat check only.
docs/research/synthesis/FINAL-v2.md:62-71, 150-156; agentskillshub.top
[cite: 1, 5]
3. Non-Technical Comprehension Failure on Block (B-01)
S-04, S-05, S-12
If non-technical creators panic when vibe-guard exits 1 because they think the app is broken rather than protected, the core UX promise fails.
5-person hallway test with non-coders watching the dial=max block toast. Tripwire: <4/5 users can state in 10s that "the fence protected the app and the agent is auto-fixing it."
Change terminal/UI block banner from red ERROR: BLOCKED (exit 1) to green-shield 🛡️ VIBE-FENCE INTERCEPTED A RISK — Auto-correcting with the agent... while still returning exit 1 to the agent subprocess.
docs/research/synthesis/05-companion-ux.md:45-115; _CONSISTENCY.md:136-148; pnas.org
[cite: 1, 9, 10]
Section 3 Re-Sequenced 10-Day Build Order (October 26 – November 4, 2026)
The Meta Global AI Developer Hackathon begins with the kickoff livestream on Monday, October 26, 2026, and project submissions close on Wednesday, November 4, 2026, at 9:00 PM ET2. Taking as baseline the already-landed scaffold documented in docs/clief/STATUS.md (src/skills/{vibe-init,vibe-guard,vibe-plan,vibe-teach}/SKILL.md, src/framework/{integrity,context-budget.yml,circuit-breaker,verifier,dial,git}.ts, src/config/severity-policy.json, and tools/{generate,validate,install}.ts), the re-sequenced build schedule front-loads the eight missing RECONCILE.md gaps and ECC security hardening into Days 1–4, completes Meta Muse API integration and live Supabase Row-Level Security verification by Day 5, freezes all feature code on Day 8, and dedicates Days 9–10 to producing the Visceral Delta video and verifying the clean-room submission1.

Day & Date
Milestone
Exact Files Created / Updated (src/ Authority → dist/ Sync)
Daily Verification Gate (Must Pass Before Next Day)
Citation (File+Line / URL)
Day 1 (Mon, Oct 26)
M1: Deterministic Core & State Lock
Update src/framework/integrity.ts (SHA-256 state-tree lock over .fence/, severity-policy.json, and hook configs); update src/config/severity-policy.json (lock 10 hard-blocks, add chmod -R 777 to CMD-01, add package.json scripts.* AST check to SUP-01, downgrade SH-01/DEP-01/ARCH-01).
fence validate passes src→dist parity; agent attempting to edit .fence/ or run chmod -R 777 / malicious npm run analyze exits 1/2 in <15ms.
docs/clief/STATUS.md:1-60; ECC-SECURITY-DEEPDIVE.md:110-195; agentskillshub.top
[cite: 1, 5, 6]
Day 2 (Tue, Oct 27)
M1: Ethics, Privacy & Undo
Create src/rules/prv-09.ts (hard-block Meta Contributor mode unless --allow-contributor-training; enforce Standard mode default); create tools/anonymize.ts (entropy + regex secret/PII scrubber); finalize src/framework/git.ts (refs/fence/checkpoints/* + npx vibe-fence undo).
prv-09.ts blocks simulated Contributor-mode payload (exit 1); anonymize.ts scrubs 100% of test keys/emails; fence undo restores working tree bit-for-bit.
docs/clief/RECONCILE.md:15-45; INDEPENDENT-GEMS.md:210-244
[cite: 1]
Day 3 (Wed, Oct 28)
M1→M2: Billing & Cost Guard
Create src/rules/bill-01.ts (TypeScript AST detector for unthrottled useEffect / while / for loops invoking paid APIs); create src/framework/billing-guard.ts (session counter enforcing ≤5 Muse Wonder 1.0 calls/session unless --wonder, plus circuit-breaker integration).
bill-01.ts blocks infinite useEffect fetch (exit 1) with 0/20 false positives on valid Next.js data-fetching components; 6th Wonder call halts gracefully.
docs/clief/RECONCILE.md:22-38; INDEPENDENT-GEMS.md:186-209
[cite: 1]
Day 4 (Thu, Oct 29)
M2: Meta Muse API & Dial
Wire Muse Spark 1.3 via POST /v1/responses with stateless encrypted reasoning replay (src/framework/dial.ts + src/skills/vibe-teach/SKILL.md); wire Muse Wonder 1.0 into src/skills/vibe-plan/SKILL.md to emit .fence/stack-contract.json.
Live /v1/responses round-trip succeeds with encrypted replay token; hook feedback stays ≤400 tokens (context-budget.yml); vibe-teach outputs to terminal only.
docs/research/synthesis/06-meta-models.md:18-144; 05-companion-ux.md:88-134
[cite: 1]
Day 5 (Fri, Oct 30)
M2: Remote RLS & Ephemeral Verifier
Create src/framework/verify-remote.ts (live HTTP/REST anon-key probe against Supabase tables to verify Row-Level Security enforcement); update src/framework/verifier.ts with 3-stage greenfield Ephemeral Verifier (tsc --noEmit + AST scan + route smoke) and WebContainer probe (Gem #2).
verify-remote.ts catches a live Supabase table with RLS disabled in <2s and blocks "done"; Ephemeral Verifier runs in <2s with 0% flake across 20 runs.
docs/research/synthesis/INDEPENDENT-GEMS.md:45-111, 245-288; RECONCILE.md:20-35
[cite: 1]
Day 6 (Sat, Oct 31)
M3: Tiered Adapters & Scorecard
Create adapter .yml portability configs (closing the 8th RECONCILE.md gap): full Tier-1 hooks for Claude Code, Codex, and Cursor; create tools/adapter-compliance.ts (ECC steal-able) generating an honest capability scorecard for OpenCode, Kimi CLI, Hermes, and Antigravity.
npx vibe-fence init executed 3 consecutive times (init ×3) is 100% idempotent with zero duplicate hooks or config corruption.
docs/clief/RECONCILE.md:40-58; ECC-SIDEBAR.md:145-260
[cite: 1]
Day 7 (Sun, Nov 1)
M3: Ablation & Muse Image Polish
Implement ECC Steal-able #2 (tools/ablation-bench.ts supporting off / gate / minus-target / placebo modes); integrate Muse Image ($0.01/image) into vibe-init/vibe-verify to generate public/og-verified.png OpenGraph safety badge on verification pass.
4-arm ablation benchmark completes automatically; Muse Image generates valid PNG asset at $0.01 cost.
docs/clief/APPENDIX-ECC.md:19-27; 06-meta-models.md:145-174; vibecodinglist.com
[cite: 1, 2]
Day 8 (Mon, Nov 2)
M4: Feature Freeze & Adversary Bench
HARD FEATURE FREEZE AT 6:00 PM. Execute full 10/10 Adversary Bench (8 nomos actions + 2 Wauters camouflaged npm run scripts) + 4/4 Benign Action Suite + 5-Step Acceptance Suite; conduct 5-user non-coder comprehension check (B-01).
10/10 malicious actions blocked (exit 1) with --dangerously-skip-permissions active; 0/4 benign actions interrupted; all 5 acceptance steps green.
docs/research/synthesis/FINAL-v2.md:185-205; agentskillshub.top; explainx.ai
[cite: 1, 5, 6]
Day 9 (Tue, Nov 3)
M4: Visceral Delta Video Production
Record and edit the 3:00 Visceral Delta video (DEMO-SCRIPT.md); embed the 5×4 evaluation rubric table, nomos comparison table, and ECC adapter compliance scorecard at the top of README.md; polish synthesis-explorer.html companion link.
Video is ≤3:00, 1080p/60fps, audio crystal-clear, opens immediately with the unfenced disaster at 0:00 (zero title slides).
docs/research/synthesis/DEMO-SCRIPT.md:1-95; HTML-REVIEW.md:1-175
[cite: 1]
Day 10 (Wed, Nov 4)
M4: Clean-Room Audit & Submission
Test npx vibe-fence init from a fresh directory on a clean VM; verify GitHub repo is public, license and Meta model attributions are clear, and video link is public. Submit by 3:00 PM ET (6 hours before the 9:00 PM ET deadline).
Official submission confirmation received before 3:00 PM ET; zero uncommitted diffs between src/ and dist/.
docs/PLAN.md:1-65; vibecodinglist.com; internshala.com
[cite: 1, 2, 3]
Section 4 Demo and Submission Package
To maximize scoring across Impact (30%), Tooling (25%), Demo (25%), and Depth (20%) in the Indie Build for Your World track1, the submission package aligns every second of the 3-minute video and every table in the repository README to the empirical failure modes verified in Phase 0 and open-web benchmarks.
4.1 The Visceral Delta 0:00→3:00 Video Script (Shot-by-Shot)
Timecode
Visual On-Screen (Split-Screen / Terminal + Browser)
Audio Narration Theme (Third-Person Technical Storyline)
Judging Criterion Targeted
Citation (File+Line / URL)
0:00–0:40 Act I: The Unfenced Disaster
Left Screen (Unfenced Agent — Skip-Permissions): A first-time creator prompts an unfenced coding agent to build a Next.js + Supabase waitlist with an AI welcome message. Within 25 seconds, the agent writes NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY into app/page.tsx, places a paid fetch('/api/muse') call inside an unthrottled useEffect(() => { ... }) with no dependency array, and executes npm run analyze (a trojan script in package.json). The simulated billing counter climbs to $42.00 in seconds while browser DevTools expose the database master key in plain text.
Narrates how 93% of permission prompts are approved blindly and how 50% of community guard hooks collapse to 0/8 protection when skip-permissions mode is enabled, illustrating the immediate financial and data-leak catastrophe facing non-technical creators.
Impact (30%) & Demo (25%): Immediate visceral hook (SplatForge / Sentinel pattern); cites verified Anthropic 93% & Wauters/nomos data.
DEMO-SCRIPT.md:10-32; HTML-REVIEW.md:60-72; scalex.dev; agentskillshub.top
[cite: 1, 5, 6, 7]
0:40–1:35 Act II: Live npx vibe-fence init Intervention & Teaching Dial
Right Screen (Fenced with vibe-fence): Running npx vibe-fence init locks the state tree (integrity.ts) and creates a Git shadow checkpoint (git.ts) in <1s. When the agent attempts the same edits, vibe-guard intercepts in 11ms (exit 1), blocking SEC-01 (NEXT_PUBLIC_ service key) and BILL-01 (unthrottled useEffect paid API call). The agent automatically refactors both into a safe Next.js Server Action. Below, Muse Spark 1.3 (POST /v1/responses stateless encrypted replay) explains the fix in plain English at dial=max, then fades via npx vibe-fence dial min to a 1-line silent-shield toast.
Explains Thesis #1 (the deterministic fence decides in 11ms while Meta Muse Spark 1.3 explains asynchronously via stateless /v1/responses encrypted replay) and Thesis #5 (orthogonality of the teaching dial and autonomy band).
Tooling (25%) & Impact (30%): Proves Thesis #1 (deterministic fence decides, model explains) and Thesis #5 (orthogonality of teaching dial and autonomy).
DEMO-SCRIPT.md:33-62; FINAL-v2.md:12-28; 05-companion-ux.md:45-130; 06-meta-models.md:20-85
[cite: 1]
1:35–2:25 Act III: Muse Wonder 1.0 Escalation, Live Remote RLS & Muse Image
The creator requests row-level data isolation before shipping. vibe-plan escalates a single call to Muse Wonder 1.0 (1/5 session budget enforced by billing-guard.ts) to emit the Supabase Row-Level Security contract. Next, verify-remote.ts probes the live remote Supabase endpoint with an anonymous token, proving RLS blocks cross-user reads before gating "done". Upon verification pass, Muse Image ($0.01) generates the app's custom "Verified Safe by vibe-fence" OpenGraph card (public/og-verified.png). Executing npx vibe-fence undo demonstrates instant 1-command Git rollback and restore.
Highlights how Muse Wonder 1.0 (capped at 5 calls per session) synthesizes the RLS contract, how verify-remote probes the live Supabase REST endpoint to prove enforcement, and how Muse Image generates a one-cent verified OpenGraph badge.
Tooling (25%) & Depth (20%): Shows all 3 Meta models (Spark 1.3, Wonder 1.0, Muse Image) in load-bearing roles + Gem #3 (verify-remote.ts).
DEMO-SCRIPT.md:63-82; INDEPENDENT-GEMS.md:83-111, 186-209; 06-meta-models.md:86-174
[cite: 1, 2, 3]
2:25–3:00 Act IV: The 10/10 Adversary Bench & 5-Step Acceptance Suite
The terminal executes npm run bench:adversary and npm test:acceptance side-by-side. The output scorecard flashes green: vibe-fence: 10/10 threats blocked (8/8 nomos suite including chmod -R 777 + 2/2 Wauters camouflaged npm run scripts), 0/4 benign actions interrupted, ≤400 token budget (312 tokens actual), init ×3 idempotent, Standard privacy mode locked (PRV-09).
Summarizes the empirical benchmark results against the October 2026 Claude Code hook suite and Wauters' 409,000-decision dataset: 10/10 threats blocked, 0/4 false positives on benign work, and sub-400-token context overhead.
Depth (20%) & Demo (25%): Undeniable quantitative proof that preempts judge skepticism.
FINAL-v2.md:185-205; agentskillshub.top; explainx.ai
[cite: 1, 5, 6]
4.2 The 5×4 Evaluation Rubric & 5-Step Acceptance Suite (README Top-Fold)
The top fold of README.md presents the 5-Step Mechanical Acceptance Suite alongside the 5×4 Task-by-Surface Evaluation Rubric so judges can audit every engineering claim in under 60 seconds (FINAL-v2.md:185-205)1.
Task Scenario (5) \ Protection Surface (4)
1. Structure & Scope (FS-01, ARCH-01, verifier.ts)
2. Secrets & Privacy (SEC-01..03, PRV-09, anonymize.ts)
3. Git & Supply Chain (GIT-01, SUP-01, git.ts)
4. Deploy, DB & Billing (DB-01, BILL-01, verify-remote.ts)
1. auth (Supabase Login & Profiles)
Locks Next.js App Router + @supabase/ssr contract via Muse Wonder 1.0 (vibe-plan).
Hard-Blocks (exit 1) NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY in client components (SEC-01).
Auto-creates refs/fence/checkpoints/pre-auth shadow commit before touching auth middleware.
verify-remote.ts probes live Supabase REST API with anon key to verify RLS blocks cross-user reads.
2. paid API (Meta Muse / Stripe Integration)
Enforces server-only route handler or Server Action structure; tsc --noEmit check.
Scrubs API keys via tools/anonymize.ts; PRV-09 locks Meta Standard mode (no silent Contributor training).
Blocks committing .env.local or high-entropy live keys (SEC-03, Shannon entropy + prefix gate).
BILL-01 AST-blocks unthrottled useEffect/loop paid API calls; billing-guard.ts caps Wonder at ≤5 calls.
3. bug fix (Broken UI / State Repair)
Runs 1→verify→conditional best-of-k () gated by circuit-breaker.ts.
Blocks agent from reading ~/.ssh, ~/.aws, or raw .env during debugging (SEC-02, nomos gap).
Enables 1-command npx vibe-fence undo if agent repair introduces regression; blocks git reset --hard without checkpoint.
Muse Spark 1.3 (POST /v1/responses encrypted replay) explains the root cause at active dial setting (≤400 tokens).
4. add-dep (Installing Packages & Scripts)
Parses && chains per-subcommand (SH-01 fix); zero interruption on allowlisted UI libs (0/4 benign FP).
Blocks untrusted remote script pipes (curl | sh, NET-01) and unknown npx -y packages.
SUP-01 enforces --ignore-scripts and AST-scans package.json scripts.* (stops Wauters npm run analyze vector).
Verifies next build / tsc --noEmit after dependency addition before marking turn complete.
5. ship-to-prod (Pre-Deploy Gate)
Verifies src→dist parity and .fence/ SHA-256 state-tree integrity (integrity.ts).
Confirms zero hardcoded secrets across git history and .gitignore coverage of .env*.
Blocks git push --force to main/master (GIT-01).
Runs 3-stage Ephemeral Verifier + verify-remote.ts RLS check + generates Muse Image ($0.01) Verified OG Badge.
Section 5 Falsifier Suite for Settled Claims (S-01..S-15)
To address Research Question 6, the table below specifies the strongest empirical falsifier for each of the 15 settled claims (S-01..S-15) in docs/research/synthesis/FINAL-v2.md (lines 30–60), prioritized by Cheapest-to-Run multiplied by Most-Lethal-if-True (Priority Score = Lethality [1–5] × Ease-of-Execution [1–5])1.
Claim ID & Settled Statement (FINAL-v2.md:30-60)
Priority Rank (Lethality × Cheapness)
Concrete Falsifier Protocol (Study / Repo / 10-User Bench)
Exact Falsification Threshold (Early Detection Criterion)
Pre-Planned Architectural Pivot if Falsified
Citation (File+Line / URL)
S-06: Execution-guided 1→verify→conditional best-of-k () + Ephemeral Verifier beats 1→5→synthesize-1 on code.
#1 (5 × 5 = 25)
Run src/framework/verifier.ts 20 times across 5 testless Next.js + Supabase greenfield repos (B-07).
Falsified if Ephemeral Verifier exhibits >5% flake rate on valid builds or takes >8 seconds/turn, causing circuit-breaker.ts to abort valid code.
Split verifier into Fast Turn-Gate (tsc --noEmit + AST scan, <1.5s, 0% flake) and Pre-Ship Gate (headless HTTP route render).
FINAL-v2.md:38-41; _CONSISTENCY.md:152-165
[cite: 1]
S-01: Deterministic pre-tool hooks (exit 1/2) must enforce safety; LLMs must never be the primary safety gate.
#2 (5 × 5 = 25)
Run the 10-attack Adversary Bench (8 nomos + 2 Wauters npm script attacks) with --dangerously-skip-permissions active.
Falsified if any attack bypasses the pre-tool hook (<10/10 blocked) or if hook execution latency exceeds 50ms p99.
Tighten shell-AST parser in vibe-guard to default-deny unparsed shell constructs in autonomous mode (ECC-SECURITY-DEEPDIVE.md).
FINAL-v2.md:30-32; agentskillshub.top; explainx.ai
[cite: 1, 5, 6]
S-09: Tiered severity policy (14/29/55 blocks across local/shared/public) prevents catastrophes without breaking flow.
#3 (5 × 5 = 25)
Replay 20 real benign greenfield Next.js + Tailwind + Supabase prompts through the local profile (B-02).
Falsified if vibe-guard triggers >1 false-positive block across 20 benign turns (>5% FP rate), recreating Claude Code's 75% interruption fatigue.
Downgrade offending rule from block to auto-checkpoint + warn in local profile, keeping only the 10 zero-FP hard-blocks active.
FINAL-v2.md:48-50; 04-guardrails.md:45-120; agentskillshub.top
[cite: 1, 5]
S-02: Small, prohibitory ("do not") context surfaces (≤400 tokens) outperform large directive rule files.
#4 (4 × 5 = 20)
Run ECC 4-arm ablation (off / gate / minus-target / placebo) on 10 coding tasks measuring agent token usage and adherence (H-04, H-08).
Falsified if injected vibe-guard / SKILL.md surface exceeds 400 tokens or degrades agent task completion vs. off baseline.
Prune SKILL.md files to pure prohibitory ("DO NOT") bullet rules (+13.8pp effect in 679-rule study) and move examples to on-demand tool calls.
FINAL-v2.md:32-34; HTML-REVIEW.md:38-45, 73-84; agentskillshub.top
[cite: 1, 5]
S-11: Deterministic containment + Git shadow checkpoints + fence undo (≤3 gates/session) provides safe Turbo autonomy.
#5 (5 × 4 = 20)
Execute 10 destructive mutations (rm -rf src, bad migration, broken refactor) in autonomous mode and run npx vibe-fence undo.
Falsified if fence undo fails to restore working tree + untracked new files cleanly in 10/10 runs, or if session prompts exceed 3 gates.
Include git stash create --include-untracked in src/framework/git.ts pre-tool hook so newly created files are also cleanly rolled back.
FINAL-v2.md:52-55; src/framework/git.ts:1-95; scalex.dev
[cite: 1, 7]
S-12: Teaching Dial (max→medium→min→silent) prevents Bastani -17% skill-atrophy harm without slowing shipping.
#6 (4 × 4 = 16)
5-user non-technical creator hallway test (B-01): 3 blocked turns at dial=max followed by a 3-question post-task security quiz (NEXT_PUBLIC_, RLS, useEffect billing).
Falsified if <4/5 users score ≥2/3 on the post-task quiz, or if dial=max block banners cause users to abort the session in confusion.
Add a 1-sentence interactive micro-prediction prompt ("Why is NEXT_PUBLIC_ unsafe here?") on the first dial=max block before auto-fading to medium (Bastani hint-first pattern).
FINAL-v2.md:55-57; 05-companion-ux.md:45-115; pnas.org
[cite: 1, 9, 10]
S-13: Muse Spark 1.3 via POST /v1/responses stateless encrypted reasoning replay is the optimal companion voice.
#7 (4 × 4 = 16)
Run 25 consecutive multi-turn /v1/responses calls with encrypted reasoning tokens replayed across turns (06-meta-models.md).
Falsified if p95 latency exceeds 2.5s, payload size exceeds 32KB, or stateless replay drops reasoning state on turn .
Stream Muse Spark 1.3 responses asynchronously in a non-blocking background worker and cap replayed history to the last 3 encrypted turn tokens.
FINAL-v2.md:57-58; 06-meta-models.md:20-85
[cite: 1]
S-14: Muse Wonder 1.0 escalation (≤5 calls/session) improves complex plan/verification recovery.
#8 (4 × 4 = 16)
Trigger 10 deliberately failing multi-file Supabase RLS + Server Action repairs; compare Spark 1.3 alone vs. Wonder 1.0 escalation.
Falsified if Wonder 1.0 fails to resolve ≥7/10 multi-file failures or if billing-guard.ts fails to hard-stop at call #6.
Restrict Wonder 1.0 strictly to vibe-plan initial .fence/stack-contract.json generation (1 call) and circuit-breaker trip recovery (max 2 calls).
FINAL-v2.md:58-59; 06-meta-models.md:86-144; INDEPENDENT-GEMS.md:186-209
[cite: 1]
S-03: Mechanical verification (verifier.ts + verify-remote.ts) must gate "done" before the agent exits.
#9 (4 × 4 = 16)
Test 5 Supabase tables (3 with RLS disabled, 2 with RLS enabled but permissive USING (true) policies) against verify-remote.ts.
Falsified if verify-remote.ts passes a table that has USING (true) anonymous read/write access on private user data.
Upgrade verify-remote.ts from a simple HTTP 200 check to a 2-row synthetic anon-read/write probe + pg_policies inspection via RPC/migration AST.
FINAL-v2.md:34-36; INDEPENDENT-GEMS.md:83-111
[cite: 1]
S-04: Teaching and autonomy are orthogonal axes (dial × autonomy band 4×4 matrix).
#10 (3 × 5 = 15)
Unit-test all 16 combinations of dial (max, medium, min, silent) × band (guarded, assisted, autonomous, open) in src/framework/dial.ts.
Falsified if changing the teaching dial alters any vibe-guard exit code or if changing the autonomy band alters companion explanation verbosity.
Enforce strict module decoupling: vibe-guard reads only autonomyBand and appProfile; vibe-teach reads only teachingDial and block metadata.
FINAL-v2.md:36-37; 05-companion-ux.md:116-165; src/framework/dial.ts:1-75
[cite: 1]
S-05: Progressive scaffolding fade (max→medium→min→silent) prevents notification fatigue (B-05).
#11 (3 × 5 = 15)
Simulate a 15-turn coding session where the same rule (SEC-01) is triggered 3 times and clean turns occur 12 times.
Falsified if dial.ts prints full 6-line max explanations on repeat triggers of the same mastered concept or interrupts clean turns.
Implement per-rule mastery counters in .fence/state.json: 1st trigger = max (5 lines), 2nd trigger = medium (2 lines), 3rd+ trigger = min (1-line toast); clean turns = silent.
FINAL-v2.md:37-38; 05-companion-ux.md:166-220
[cite: 1]
S-07: Tournament Selection with compiler/test output attached selects the best repair when .
#12 (3 × 4 = 12)
Feed 5 pairs of candidate code repairs (1 valid, 1 subtle type/RLS bug) to the Tournament Judge with and without tsc / verify-remote output.
Falsified if Tournament Selection picks the buggy candidate in >1/5 trials or adds >4s latency when deterministic filters already rank 1 candidate first.
Bypass LLM Tournament Judge whenever deterministic verifier scores (exit 0 + 0 warnings + smaller diff) uniquely identify a single winner.
FINAL-v2.md:41-43; 03-elicitation.md:112-145
[cite: 1]
S-08: Plan synthesis (vibe-plan) improves architectural coherence on greenfield features.
#13 (3 × 4 = 12)
Compare 5 greenfield Supabase auth builds with vs. without .fence/stack-contract.json emitted by vibe-plan.
Falsified if agents ignore .fence/stack-contract.json and still import legacy @supabase/auth-helpers-nextjs or Pages Router idioms.
Wire .fence/stack-contract.json directly into vibe-guard so importing banned legacy packages (@supabase/auth-helpers-*) triggers an immediate exit 1 with the exact @supabase/ssr replacement snippet.
FINAL-v2.md:44-46; 03-elicitation.md:146-188
[cite: 1]
S-10: src/ is the sole editable authority and dist/ is disposable (fence validate/sync).
#14 (3 × 4 = 12)
Mutate 1 byte in dist/ and 1 byte in .fence/app-profile.json, then invoke fence validate and a simulated agent tool call.
Falsified if fence validate or integrity.ts fails to detect the drift in <10ms or allows execution with an out-of-sync dist/.
Run integrity.ts SHA-256 tree check at the entry point of every CLI command and hook invocation.
FINAL-v2.md:50-52; docs/clief/INDEX.md:1-55; src/framework/integrity.ts:1-80
[cite: 1]
S-15: SAM 3.1 stays out of the critical path; Muse Image ($0.01/img) handles demo visual polish.
#15 (2 × 5 = 10)
Measure npx vibe-fence init and vibe-guard execution when Meta Image / SAM endpoints are unreachable (offline test).
Falsified if an outage or timeout on Muse Image or SAM 3.1 blocks or slows down vibe-init, vibe-guard, or verifier.ts.
Wrap Muse Image badge generation in a non-blocking try/catch with a 3s timeout and a local SVG fallback badge (public/og-verified.svg).
FINAL-v2.md:59-60; 06-meta-models.md:145-210
[cite: 1]
Section 6 Amendments to FINAL-v2.md (PR-Ready)
The table below provides the PR-ready text replacements for docs/research/synthesis/FINAL-v2.md, incorporating all ground-verified open-web evidence, resolving contested items C-01 and C-06, closing blind spots B-01..B-10, and re-sequencing M1–M4 for the October 26 – November 4, 2026 build window1.

Target Location in FINAL-v2.md
Prior Contract Text (FINAL-v2.md)
PR-Ready Replacement Text
Empirical & Repository Justification
§2 Settled S-06a (Insert at line 41)
(Not in FINAL-v2.md; harvested in INDEPENDENT-GEMS.md:245-288)
S-06a (Greenfield Ephemeral Verifier — P0): On testless greenfield JS/TS repos (B-07), src/framework/verifier.ts executes a fast 2-stage synchronous turn gate (tsc --noEmit + AST secret/loop/script scan in <1.5s) and a pre-ship headless HTTP route-render + verify-remote.ts probe.
Mitigates B-07 (11.3% flake rate on testless repos) while preserving AgentGuard's +13.3pp task-completion lift (21.7%→35.0%)1.
§2 Settled S-08 (Lines 44–46)
S-08 (Plan Elicitation): 1 → N → synthesize-1 reserved for architectural plans via src/skills/vibe-plan/SKILL.md (Muse Wonder 1.0).
S-08 (Contract-Pinned Plan Elicitation): For greenfield Next.js/Tailwind/Supabase repos, vibe-plan (1 Muse Wonder 1.0 call) emits a machine-enforced .fence/stack-contract.json (locking App Router, @supabase/ssr, and Tailwind config) enforced by vibe-guard, replacing unpinned 1→N→synthesize-1 text synthesis.
Prevents chimeric App/Pages Router and @supabase/ssr vs. auth-helpers hallucinations (B-09) on greenfield prompts1.
§2 Settled S-09 (Lines 48–50)
S-09 (Tiered Guardrail Policy): .fence/app-profile.json (local/shared/public) scales blocks (14/29/55) with warn→block after allowlist.
S-09 (Tiered Guardrail Policy): .fence/app-profile.json (local/shared/public) locks 10 zero-FP hard-blocks (exit 1) in all profiles: SEC-01 (NEXT_PUBLIC_ secret), SEC-02 (.env/~/.ssh/~/.aws read), SEC-03 (git secret commit with entropy+dummy allowlist), FS-01 (realpath escape), CMD-01 (rm -rf + chmod -R 777), NET-01 (curl|sh), SUP-01 (--ignore-scripts + package.json scripts.* AST scan), GIT-01 (force-push/unbacked reset), DB-01 (destructive SQL/RLS disable), and PRV-09 (Meta Standard mode P0 ethics lock).
Closes nomos's sole chmod -R 777 miss (8/8 TP) and Wauters' npm run analyze bypass (52.5% human miss rate) while keeping 0/4 benign FP1.
§2 Settled S-11 (Lines 52–55)
S-11 (Turbo Safety): Containment + reversibility = turbo safety.
S-11 (Autonomous "Safe-Turbo" Containment): Guaranteed via 6 portable deterministic layers: (1) integrity.ts realpath boundary + SHA-256 state-tree self-tamper lock (exit 2), (2) .env/.fence hard-deny, (3) package.json scripts.* AST allowlist, (4) automatic pre-tool refs/fence/checkpoints/* shadow git commit, (5) 1-command npx vibe-fence undo, and (6) ≤3 human gates/session.
Incorporates ECC Steal-able #3 (ECC-SECURITY-DEEPDIVE.md:110-195) and prevents hook tamper vectors1.
§3 Contested C-01 (Lines 62–71)
C-01 (False-Positive Budget): Load-bearing unknown (B-02).
C-01 (False-Positive Budget — RESOLVED): Grounded against the Oct 2026 Claude Code Hook Benchmark (nomos 7/8 TP, 0/4 FP vs. native prompts 7/8 TP, 3/4 FP) and Wauters' 409k decisions. DEP-01 (allowlisted UI packages), SH-01 (per-subcommand AST parsing of &&), and ARCH-01 (file length) are downgraded from hard-block in local profile to maintain a 0/4 (<5%) benign FP rate.
Eliminates the 75.0% benign interruption rate that causes 93.0% blind approval and --dangerously-skip-permissions usage1.
§3 Contested C-06 (Lines 78–86)
C-06 (Turbo Classifier vs. Deterministic Containment): Genuine divergence (_CONSISTENCY.md C-05).
C-06 (Autonomy Naming & Mechanism — RESOLVED): Probabilistic classifiers are rejected as primary gates (Anthropic Auto Mode has a 17.0% FN rate). Modes are named by guarantee in .fence/config.json: guarded → assisted → autonomous (default Safe-Turbo) → open.
Resolves _CONSISTENCY.md C-05 and avoids semantic collision with Antigravity Turbo (sandbox off)1.
§4 Phase 1 Build Checklist M1–M4 (Lines 98–145)
Original M1–M4 checklist scheduling 6-runtime .yml adapters before bill-01.ts, prv-09.ts, verify-remote.ts, and anonymize.ts.
Re-Sequenced 10-Day Build Order (Oct 26 – Nov 4, 2026): M1 (Days 1–3): integrity.ts SHA-256 lock, 10 hard-blocks, prv-09.ts, anonymize.ts, bill-01.ts, billing-guard.ts, git.ts + fence undo. M2 (Days 4–5): Muse Spark 1.3 /v1/responses replay, Muse Wonder 1.0 .fence/stack-contract.json, verify-remote.ts live Supabase RLS probe, Ephemeral Verifier. M3 (Days 6–7): Tier-1 .yml adapters (Claude Code, Codex, Cursor), adapter-compliance.ts scorecard, 4-arm ablation runner, Muse Image ($0.01) OG badge. M4 (Days 8–10): Nov 2 feature freeze, 10/10 Adversary Bench, Nov 3 Visceral Delta video, Nov 4 3:00 PM ET submission.
Closes all 8 RECONCILE.md gaps in Days 1–6 and enforces a 48-hour buffer before the Nov 4 9:00 PM ET cutoff1.
Section 7 Sources
Every finding, benchmark, and architectural amendment in this audit is grounded in the Phase 0 data pack (.share-argon4.zip) and verified open-web primary sources mapped in the provenance table below1.

Source Category & Identifier
Exact Repository Path + Lines / Verified Primary Web URL
Core Evidence & Metrics Extracted
Audit Verification Status
Phase 0 Master Contract & Plan
docs/research/synthesis/FINAL-v2.md:1-216; docs/PLAN.md:1-65; docs/research/INDEX.md:1-85
[cite: 1]
5 core theses, settled claims S-01..S-15, contested items C-01..C-10, blind spots B-01..B-08, 14 anti-patterns, M1–M4 checklist.
Verified & Amended (§6 diff)1
Phase 0 Scaffold Status & Gap Ledger
docs/clief/INDEX.md:1-55; docs/clief/STATUS.md:1-60; docs/clief/RECONCILE.md:1-58
[cite: 1]
src/ authority → dist/ parity; 8 unbuilt gaps (bill-01.ts, prv-09.ts, verify-remote.ts, billing-guard.ts, anonymize.ts, .yml adapters).
Verified (All 8 gaps scheduled in §3 Days 1–6)1
Phase 0 Per-Stream Syntheses & Gems
docs/research/synthesis/01-harnesses.md:1-147; 02-harness-influence.md:1-259; 03-elicitation.md:1-203; 04-guardrails.md:1-345; 05-companion-ux.md:1-275; 06-meta-models.md:1-252; INDEPENDENT-GEMS.md:1-291; _CONSISTENCY.md:1-176; COMPARISON.md:1-247
[cite: 1]
11 independent gems (SHA-256 attestation, WebContainer probe, live Supabase RLS probe, BILL-01, PRV-09, Ephemeral Verifier), 103 deduplicated claims.
Verified (Gems #1, #2, #3, #7, #8, #11 promoted to P0)1
ECC 2.2.3 Security & Steal-ables
docs/research/synthesis/ECC-SIDEBAR.md:1-503; ECC-SECURITY-DEEPDIVE.md:1-363; docs/clief/APPENDIX-ECC.md:1-60
[cite: 1]
Top 5 steal-ables: GateGuard fact-forcing taxonomy, 4-arm ablation (off/gate/minus-target/placebo), state-tree hardening, profile installer, compliance scorecard.
Verified (Integrated into §2.3, §2.5, §3)1
Explorer Hallucination Audit
docs/research/synthesis/HTML-REVIEW.md:1-175; docs/research/synthesis/synthesis-explorer.html:1-1008; DEMO-SCRIPT.md:1-95
[cite: 1]
Corrections H-01..H-08 (18k→n≈1,000 Bastani, 14% reasoning-token bloat, 93% Anthropic prompt approval scope, 65% latency fabrication purged).
Verified (Zero H-01..H-08 errors in report)1
Bastani et al. (PNAS 2025) Guarded AI Tutoring RCT
https://www.pnas.org/doi/10.1073/pnas.2422633122 (PNAS 122(26):e2422633122, June 25, 2025; corrected Aug 20, 2025)8
Field RCT with n≈1,000 high school math students: unguarded GPT Base +48% practice / -17% closed-book exam harm; guarded GPT Tutor +127% practice / 0% exam harm.
Ground-Verified (Confirms H-02 fix and S-12 Teaching Dial)8
Alex Wauters (2026) 409,000 Agent Permission Decisions
https://scalex.dev/blog/ai-agent-permissions/ (May 27, 2026); https://scalex.dev/blog/ai-agent-permissions-stats/ (Aug 5, 2026); https://explainx.ai/blog/alex-wauters-ai-agent-approval-game-40000-plays-data-august-2026
[cite: 6, 7, 12, 21]
40,000+ runs, 409,000 decisions: 66.3% mean accuracy (1 in 3 threats missed), 32.9% net-negative sessions, 52.5% miss rate on npm run analyze, 7% approved 100% of prompts; cites Anthropic 93% approval telemetry and 17% Auto Mode FN rate.
Ground-Verified (Resolves C-01, C-06, and B-10)6
Claude Code Hook-Zoo Benchmark & AgentSpec / AgentGuard
https://agentskillshub.top/best/claude-code-hooks/ (Oct 10, 2026); https://trendshift.io/repositories/305958
[cite: 5, 11]
12 hooks tested on 8 risky + 4 benign actions: nomos 7/8 TP (missed chmod -R 777), 0/4 FP; native prompts 7/8 TP (missed read .env), 3/4 FP; ccgate/Dippy 0/8 when prompts skipped; 679-rule study (+13.8pp "do not" rules); AgentSpec (>90% runtime prevention); AgentGuard (21.7%→35.0% task completion).
Ground-Verified (Anchors 8/8 + 2/2 Adversary Bench in §2.2 & §4)5
Secret Scanning & Extension Trust Boundaries
https://entro.security/blog/from-rules-to-context-building-a-production-grade-hybrid-secret-scanner-with-slms/; https://mallory.ai/stories/01a0fd32-3ce5-7f83-92a9-a9eba2bad512
[cite: 13, 14]
Anders Andersson distilbert-secret-masker hybrid context/entropy secret detection; Claude Code extension/mod permission-override trust boundary risks.
Ground-Verified (Informs SEC-03 and integrity.ts lock)13
Meta Global AI Developer Hackathon & Cerebral Valley Winners
https://dev.meta.ai/events/global-hackathon; https://vibecodinglist.com/vibe-jams/meta-global-ai-developer-hackathon-2026-ai-product-hackathon; https://internshala.com/competitions/meta-global-ai-developer-hackathon-2026/; https://cerebralvalley.ai/e/aiewf-hackathon-2026/hackathon/gallery
[cite: 2, 3, 15, 16, 17]
Dates (Oct 26–Nov 4, 2026, 9:00 PM ET deadline, $1M prize pool, Indie track Build for Your World), required Meta models (Muse Image, SAM 3.1, Meta Model API), and Cerebral Valley winner demo structures (SplatForge, Sentinel, Watchlog, Codetalker).
Ground-Verified (Anchors §3 schedule and §4 demo script)2
Works cited
.share-argon4.zip
Meta Global AI Developer Hackathon - VibeCodingList, https://vibecodinglist.com/vibe-jams/meta-global-ai-developer-hackathon-2026-ai-product-hackathon
Meta Global AI Developer Hackathon 2026: $1M Prize Pool, https://internshala.com/competitions/meta-global-ai-developer-hackathon-2026/
Win $1M: Meta Global AI Developer Hackathon, https://dev.meta.ai/events/global-hackathon
Claude Code Hooks, Subagents & Statusline: 245 Graded (2026), https://agentskillshub.top/best/claude-code-hooks/
AI Agent Approval Game: Humans Missed 1 in 3 Threats - explainx.ai, https://explainx.ai/blog/alex-wauters-ai-agent-approval-game-40000-plays-data-august-2026
Suffering from Agent Permission Fatigue? Find out your high score, https://scalex.dev/blog/ai-agent-permissions/
Generative AI without guardrails can harm learning - PNAS, https://www.pnas.org/doi/abs/10.1073/pnas.2422633122?gad_source=1&gad_campaignid=21506599862&gbraid=0AAAAAqiPmCx-8XoPPf3prdOo4pSzOXIvP&gclid=CjwKCAjwyMnNBhBNEiwA-Kcgu_cdG0PO6KphSETT1AQt7CwWIr4Q76HDRebsxVrHKOqzg-LxEEkLaxoCRYUQAvD_BwE
Generative AI without guardrails can harm learning - PNAS, https://www.pnas.org/doi/10.1073/pnas.2422633122
Can ChatGPT Help Students Learn Math? What an RCT Found, https://medkharbach.com/chatgpt-help-students-learn-math/
zhuyansen/awesome-claude-code-hooks - Trendshift, https://trendshift.io/repositories/305958
Configuring AI Agent Permissions: Humans Miss 1 in 3 Threats, https://umesh-malik.com/blog/ai-agent-permissions-approval-fatigue
Production-Grade Hybrid Secret Scanning with SLMs | Entro Labs, https://entro.security/blog/from-rules-to-context-building-a-production-grade-hybrid-secret-scanner-with-slms/
Claude Code Mods Add Local Execution and Permission-Override, https://mallory.ai/stories/01a0fd32-3ce5-7f83-92a9-a9eba2bad512
AI Engineer World's Fair Hackathon 2026 - Cerebral Valley, https://cerebralvalley.ai/e/aiewf-hackathon-2026/hackathon/gallery
Zero to Agent: Vercel x Deepmind Hackathon SF - Cerebral Valley, https://cerebralvalley.ai/e/zero-to-agent-sf/hackathon/gallery
Enterprise MCP Hackathon - Cerebral Valley, https://cerebralvalley.ai/e/mcp-hackathon
Gallery – OpenAI Voice Hack Night - Cerebral Valley, https://cerebralvalley.ai/e/openai-voice-hack-night/hackathon/gallery
Generative AI Without Guardrails Can Harm Learning, https://hamsabastani.github.io/education_llm.pdf
Generative AI without guardrails can harm learning: Evidence from, https://www.researchgate.net/publication/393011815_Generative_AI_without_guardrails_can_harm_learning_Evidence_from_high_school_mathematics
Humans missed 1 in 3 threats approving AI agent commands across, https://scalex.dev/blog/ai-agent-permissions-stats/
