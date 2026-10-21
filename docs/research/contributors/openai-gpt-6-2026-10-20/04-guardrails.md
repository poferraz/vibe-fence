# Stream 04 — Developer guardrails

- **Model:** GPT-6 (`gpt-6`; session-reported model family, exact backend revision not exposed)
- **Provider:** OpenAI via Codex desktop
- **Date:** 2026-10-20
- **Stream:** 04 — Developer guardrails
- **Contributor:** `openai-gpt-6-2026-10-20`
- **Selection:** At selection time, streams 01–06 had 3, 2, 2, 1, 1, 1 contributor files respectively. Stream 04 was the lowest-numbered stream tied for fewest contributions; this run adds an independent contribution.
- **Method:** Primary-source documentation research across OWASP, IETF, Git/GitHub, framework/database/package-manager documentation, Vercel, and official privacy authorities. No application was deployed, security scanner run against a project, or control bypass tested during this research.

## Findings

### How to interpret this policy

**Current baseline — `practiced`:** OWASP Top 10:2025 is an awareness document; ASVS 5.0.0 supplies versioned, testable requirements. OWASP explicitly discourages claims of complete Top 10 coverage by a tool. Use the risk list to organize work and ASVS requirements to specify checks; the catalog below is neither a full ASVS audit nor a compliance certification. [S01][S02][S03]

**Evidence:** `practiced` labels a documented mechanism or established recommendation, not a measured reduction in incidents. `contested` marks a context-dependent workflow preference or this report's proposed design. No comparative evaluation establishes that this particular 48-rule policy improves novice outcomes, so no rule is labeled `proven`. All **auto-enforcement designs, severity mappings, thresholds and teaching text are proposals**, even where their underlying control is established.

**Applicability:** Assess rules against the app's actual features and deployment environment. A static public site does not need JWTs, a database, or an OAuth flow merely to satisfy this list. An inapplicable rule should have a recorded reason. For an applicable mandatory rule, missing evidence or an unavailable scanner is **unknown**, not a pass. Security-positive and security-negative fixtures should both pass the intended policy.

**Severity semantics — `contested` product policy:**

| Severity | Proposed behavior |
|---|---|
| `block` | Prevent the affected unsafe action or production release until the finding is fixed or a technically justified, independently reviewable mitigation is verified. Preserve safe local development and remediation. |
| `warn` | Create an owned remediation item with evidence, priority and a due date; continue work that does not depend on resolving it. |
| `nudge` | Apply an inexpensive convention when useful; do not interrupt the user or hold a release for personal style preferences. |

A block should identify the action it controls: writing a secret into a public artifact, sharing a preview, merging, applying a migration, or promoting production. The agent should repair routine technical problems itself. Business intent and legal applicability may still need an accountable person; a prompt cannot invent those facts.

### Security

#### SEC-01 — Keep secrets out of source and browser output

- **Rule:** Never put real credentials in tracked files, client bundles, public assets, or diagnostic output.
- **Why it matters:** An environment-variable name does not make its value private: Next.js public-prefixed values can be embedded in browser JavaScript.
- **How to auto-enforce:** Scaffold server-only secret access; scan staged content and build artifacts; add CI and host push protection where supported. Use fake fixtures and redact scanner evidence. Pattern scanning cannot recognize every secret.
- **What to teach:** “A browser download is public, even when its contents began in an environment variable.”
- **Severity:** `block` — Any detected real credential exposure; public configuration without credentials is allowed.
- **Source / strength:** [S04][S05][S06] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-02 — Treat an exposed credential as compromised

- **Rule:** Revoke or rotate a leaked credential and verify replacement before resolving the incident.
- **Why it matters:** Deleting the file or rewriting a commit does not revoke a credential that somebody already copied.
- **How to auto-enforce:** Open a remediation item with affected services; use supported provider rotation APIs under scoped authority; verify old-key rejection and new-key operation. Otherwise hold resolution for the account owner. Never print either key.
- **What to teach:** “We replace the leaked key; deleting its old location cannot make it secret again.”
- **Severity:** `block` — Active exposure or an incident incorrectly marked resolved.
- **Source / strength:** [S04][S33] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-03 — Gate known vulnerable dependencies with documented triage

- **Rule:** Scan the resolved dependency graph and block unmitigated applicable high/critical vulnerabilities or known malicious packages.
- **Why it matters:** Dependency changes can introduce known vulnerabilities; automated fixes may change dependency ranges and break the app.
- **How to auto-enforce:** Run a whole-graph audit in CI and on a schedule, plus PR dependency review where available. Store advisory IDs, affected versions, environment, reachability evidence and expiring mitigations. Treat scanner failure as unknown. Test updates; never blindly apply audit fix --force.
- **What to teach:** “We check the libraries your app actually installs, then verify that their fixes still work.”
- **Severity:** `block` — Applicable high/critical or malicious findings; lower-risk findings enter a warn queue. Exact threshold is proposed policy.
- **Source / strength:** [S07][S08] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-04 — Use established authentication and password handling

- **Rule:** Use maintained authentication components; protect privileged accounts and sensitive account changes.
- **Why it matters:** Plaintext or fast-hashed passwords expose accounts after a database leak; weak recovery or privileged access can defeat otherwise sound login.
- **How to auto-enforce:** Select a reviewed auth integration; when passwords are stored, verify adaptive salted hashing such as Argon2id with current parameters. Test recovery and reauthentication. Enforce MFA for privileged production access as the proposed default.
- **What to teach:** “Signing in, recovering an account, and administering the app all need protection.”
- **Severity:** `block` — Apps with accounts or privileged administration; no requirement to add accounts to a public static site.
- **Source / strength:** [S09][S10] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-05 — Authorize every protected operation on the server

- **Rule:** Deny access unless the authenticated caller is permitted to perform this action on this object and tenant.
- **Why it matters:** A hidden button or an unpredictable record ID does not prevent unauthorized requests.
- **How to auto-enforce:** Centralize authorization; exercise a route/action matrix with anonymous, owner, other-user, other-tenant and administrator fixtures. Test reads and writes, including server actions and background entry points. Reject omitted ownership checks.
- **What to teach:** “Being signed in does not give someone permission to open another person's records.”
- **Severity:** `block` — Protected resources or actions; intentional public access must be explicitly represented.
- **Source / strength:** [S11] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-06 — Protect session cookies and session lifecycle

- **Rule:** Use secure session transport, appropriate cookie attributes, rotation, expiration and effective logout.
- **Why it matters:** A readable or leaked session token can let someone act as the user; HttpOnly does not stop injected scripts from making authenticated requests.
- **How to auto-enforce:** For browser sessions, assert Secure and HttpOnly with a compatible SameSite policy; inspect cookie scope. Test renewal after login/privilege changes, expiry and invalidation. Prefer the provider's session design over a homemade persistent-token scheme.
- **What to teach:** “Your login pass must expire, stay protected, and stop working when you sign out.”
- **Severity:** `block` — Authenticated production browser sessions.
- **Source / strength:** [S12] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-07 — Verify tokens, not merely decode them

- **Rule:** Validate JWT signatures, allowed algorithms, issuer, audience, expiration and required token-profile claims.
- **Why it matters:** Readable claims are not proof of authenticity; a token intended for another service can be misused.
- **How to auto-enforce:** Configure trusted algorithms and keys in a maintained verifier. Add negative tests for wrong issuer/audience/key, expired tokens and token-type confusion; implement the chosen revocation/session policy. Do not place confidential data in merely signed tokens.
- **What to teach:** “Reading a token tells us what it says; verification tells us whether to trust it.”
- **Severity:** `block` — JWT-consuming endpoints; JWT is optional, not a mandated architecture.
- **Source / strength:** [S13][S24] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-08 — Use a current OAuth/OIDC flow

- **Rule:** Use authorization-code flows with PKCE where applicable, exact approved redirects, and transaction-bound request validation.
- **Why it matters:** Loose redirects, code interception or mixed-up login responses can compromise accounts.
- **How to auto-enforce:** Use provider libraries and explicit redirect allowlists. Require PKCE for public clients, default to it for confidential clients, and validate state/nonce as required by the chosen flow. Reject password-grant and insecure legacy flow templates.
- **What to teach:** “The identity provider's reply must belong to the login you started.”
- **Severity:** `block` — OAuth/OIDC integrations; implementation follows the provider and RFC profile.
- **Source / strength:** [S14] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-09 — Validate requests and business constraints server-side

- **Rule:** Validate types, bounds, allowed fields and cross-field business rules before acting.
- **Why it matters:** A browser form can be bypassed; a syntactically valid price or ownership field can still be unauthorized.
- **How to auto-enforce:** Generate server schemas and reject unexpected writable fields. Add boundary and invariant tests, such as negative quantities, oversize input and impossible date ranges. Check authorization separately; validation does not replace query parameterization.
- **What to teach:** “The server checks both whether an answer has the right shape and whether it makes sense.”
- **Severity:** `block` — Externally supplied data that changes state or accesses protected resources.
- **Source / strength:** [S15] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-10 — Keep untrusted data out of executable query syntax

- **Rule:** Use parameterized database queries and safe argument APIs instead of concatenating untrusted executable text.
- **Why it matters:** String-built queries or commands can execute an attacker's instructions.
- **How to auto-enforce:** Use ORM/query binding; flag raw query and process-execution sinks with static analysis. Allowlist identifiers that cannot be parameterized. Exercise suspicious inputs in isolated tests; review necessary raw SQL rather than banning all raw SQL.
- **What to teach:** “User input should be treated as data, never as instructions for the database or shell.”
- **Severity:** `block` — Confirmed unsafe data-to-query or data-to-command paths.
- **Source / strength:** [S16][S02] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-11 — Preserve output escaping and sanitize intentional rich content

- **Rule:** Use context-aware output encoding and reviewed sanitization before inserting untrusted HTML.
- **Why it matters:** Framework escape hatches can turn saved content into code running in another user's browser.
- **How to auto-enforce:** Lint dangerous rendering sinks; test stored and reflected payloads in a browser. Restrict URL schemes and sanitize supported rich HTML. Treat CSP as an additional layer, not a substitute for fixing unsafe rendering.
- **What to teach:** “Comments and profile text must stay text instead of becoming code.”
- **Severity:** `block` — Untrusted content reaching an executable browser context.
- **Source / strength:** [S17] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-12 — Protect cookie-authenticated mutations against CSRF

- **Rule:** Use the framework's CSRF protection or an equivalent validated design; do not mutate state on GET.
- **Why it matters:** A hostile site can trigger requests that carry the victim's cookies; SameSite alone is insufficient in many designs.
- **How to auto-enforce:** Test cross-origin submissions, invalid/missing tokens, Origin/Fetch Metadata handling and login/logout behavior. Use synchronizer tokens or the framework's supported equivalent; choose a compatible SameSite policy.
- **What to teach:** “Another website must not be able to make changes through your logged-in account.”
- **Severity:** `block` — Endpoints with ambient browser credentials and relevant mutation risk.
- **Source / strength:** [S18] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-13 — Configure CORS narrowly for credentialed endpoints

- **Rule:** Permit only intended cross-origin browser clients, while retaining ordinary authentication and authorization.
- **Why it matters:** Reflecting arbitrary origins can expose credentialed responses; CORS does not authenticate non-browser clients.
- **How to auto-enforce:** Test allowed and hostile origins, preflight and credential settings. Reject arbitrary origin reflection; use explicit origins for credentialed responses. Public unauthenticated resources may deliberately permit any origin.
- **What to teach:** “We control which websites may read private responses; we still verify who makes each request.”
- **Severity:** `block` — Unsafe cross-origin access to sensitive responses.
- **Source / strength:** [S19][S11] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-14 — Use minimal database privileges and test tenant isolation

- **Rule:** Use separate application and migration roles; enforce row/tenant restrictions with the actual production role.
- **Why it matters:** An administrative role can bypass intended protections. PostgreSQL owners and BYPASSRLS roles may bypass row security.
- **How to auto-enforce:** Inspect grants and connection-role properties; isolate environments. Where RLS is part of the design, test SELECT/INSERT/UPDATE/DELETE across two tenants with the actual application role, not an administrator. Test other data stores' equivalent authorization.
- **What to teach:** “The app should have only the database access it needs, and one customer must not see another's data.”
- **Severity:** `block` — Production database access; RLS is one enforcement option, not a universal requirement.
- **Source / strength:** [S20][S21] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-15 — Constrain server-side fetching of user-provided URLs

- **Rule:** Validate destinations and constrain network access before fetching attacker-influenced URLs.
- **Why it matters:** A URL-fetching feature can reach private infrastructure or cloud metadata services.
- **How to auto-enforce:** Prefer explicit destinations; validate schemes, resolved IPv4/IPv6 addresses and ports; deny private/loopback/link-local targets when not intended. Disable redirects or validate every hop; use egress controls and fixtures for redirect/rebinding cases.
- **What to teach:** “A pasted link must not give strangers a way into the app's private network.”
- **Severity:** `block` — Server-side URL fetching where destinations can be influenced by users.
- **Source / strength:** [S22] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-16 — Treat uploads as untrusted content

- **Rule:** Authorize upload/download access, limit file types and sizes, and store uploads outside executable application paths.
- **Why it matters:** A misleading extension or MIME header can carry executable or malicious content; public storage can expose private files.
- **How to auto-enforce:** Validate extension and content, generate storage names, cap sizes and decompression, and enforce per-object access. Use scanning or content reconstruction where appropriate; test traversal and unauthorized retrieval. Do not regard MIME checks alone as sufficient.
- **What to teach:** “Uploaded files cannot choose where they run or who can read them.”
- **Severity:** `block` — Apps accepting uploads; stronger scanning depends on supported file types.
- **Source / strength:** [S23] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-17 — Bound abuse and resource consumption

- **Rule:** Apply server-side limits to authentication attempts, expensive endpoints, payloads, retries and paid service use.
- **Why it matters:** An automated client can exhaust capacity or create large bills; a UI limit does not constrain direct calls.
- **How to auto-enforce:** Use shared, atomic rate/quota storage across instances; set timeouts and size limits; return appropriate throttling responses. Test concurrent requests and retry loops. Define account/project cost ceilings for paid APIs.
- **What to teach:** “A runaway script should not be able to empty your budget or lock everyone out.”
- **Severity:** `block` — Unbounded public access to materially costly or security-sensitive operations; specific ceilings are workload-dependent.
- **Source / strength:** [S24][S09] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-18 — Authenticate webhooks and make effects idempotent

- **Rule:** Verify provider signatures using the documented payload format and prevent duplicate side effects.
- **Why it matters:** Forged events can grant access or alter payments; retries can apply the same change repeatedly.
- **How to auto-enforce:** Use the provider verifier on raw bytes; enforce signed timestamps when that protocol supplies them. Deduplicate durable event processing and test invalid, duplicate and out-of-order deliveries. Do not invent a timestamp guarantee for providers that do not sign one.
- **What to teach:** “A webhook must come from the real service, and a retry must not charge or update twice.”
- **Severity:** `block` — Webhook endpoints that affect protected state.
- **Source / strength:** [S25] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-19 — Fail safely on exceptions and partial operations

- **Rule:** Do not grant access on verification failure, leak internals, or leave critical multi-step writes half applied.
- **Why it matters:** Timeouts and swallowed errors can bypass checks, expose diagnostics or corrupt state.
- **How to auto-enforce:** Test database/auth-provider failures and malformed responses. Use generic public errors with private correlation IDs; use transactions or an explicit recovery protocol for related changes. Do not catch an authorization failure and continue with default success.
- **What to teach:** “When something breaks, the app should stop the risky action and keep your data consistent.”
- **Severity:** `block` — Security decisions and critical state changes.
- **Source / strength:** [S27][S28] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-20 — Record security events without recording secrets

- **Rule:** Capture useful authentication, authorization and sensitive-change events while excluding credentials and unnecessary personal data.
- **Why it matters:** Missing events hide incidents; excessive logs create another sensitive-data store.
- **How to auto-enforce:** Use structured event schemas and redaction; test with synthetic secrets. Restrict log access and retention; verify delivery of important alerts. Mask before export and avoid including raw request bodies by default.
- **What to teach:** “We keep enough history to investigate a problem without copying your users' private information.”
- **Severity:** `block` — Secret leakage in logs; missing routine monitoring is warn, with higher-risk audit needs assessed separately.
- **Source / strength:** [S26] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-21 — Prevent shared caches from mixing private responses

- **Rule:** Set cache policy intentionally for personalized responses and separate per-user server-side cache entries.
- **Why it matters:** A shared cache can serve one user's private content to another user.
- **How to auto-enforce:** Assert private or no-store as appropriate; test sequential requests by two users against a production-like CDN. Review server cache keys and invalidation separately from HTTP headers. Public content may remain cacheable.
- **What to teach:** “A speed-up must never show your account page to somebody else.”
- **Severity:** `block` — Personalized or sensitive responses exposed through shared caches.
- **Source / strength:** [S29] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### SEC-22 — Identify the feature's assets and misuse cases

- **Rule:** Record valuable data, trust boundaries, privileged actions and a few concrete abuse cases before consequential features ship.
- **Why it matters:** A checklist cannot discover every business-logic flaw or decide who should be allowed to do what.
- **How to auto-enforce:** Generate a short feature risk record from routes and data flows; require explicit authorization and misuse scenarios for sensitive features. Let the agent propose controls; escalate unresolved business-policy choices instead of guessing.
- **What to teach:** “We identify what could be harmed, then make checks for those specific failures.”
- **Severity:** `warn` — Escalate a concrete unsafe behavior to its applicable block rule; the document itself is not proof of safety.
- **Source / strength:** [S02][S03] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

### Git & GitHub

#### GIT-01 — Exclude local secrets and verify the tracked file set

- **Rule:** Ignore real .env files, local credentials and sensitive dumps; permit only sanitized configuration examples.
- **Why it matters:** Git ignores untracked files; adding a path to .gitignore does not remove a file already tracked.
- **How to auto-enforce:** Scaffold ignore patterns with a deliberate .env.example exception; inspect git ls-files and staged content in CI. Test ignore behavior on fixtures. If a secret was committed, invoke SEC-02 rather than treating untracking as remediation.
- **What to teach:** “The ignore list keeps future files out; it cannot erase a secret already shared.”
- **Severity:** `block` — Tracked runtime secret files or sensitive dumps, including forced additions.
- **Source / strength:** [S30][S04][S05] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### GIT-02 — Keep solo development simple and recoverable

- **Rule:** Prefer one main branch and short-lived branches for bounded changes; avoid unnecessary release-branch machinery.
- **Why it matters:** Isolated changes are easier to inspect and revert; a particular branching style is not itself a security boundary.
- **How to auto-enforce:** Create a descriptive branch for consequential work and preserve a known-good commit. Check for unrelated changes before committing. Use rulesets to prevent accidental force-push/deletion where available, while allowing a simpler documented solo workflow.
- **What to teach:** “A small branch keeps unfinished work separate and makes a change easier to undo.”
- **Severity:** `warn` — Missing recoverability or unclear release history; branch naming/style is only a nudge.
- **Source / strength:** [S31][S32] · accessed 2026-10-20 · `contested` (implementation and severity are proposed).

#### GIT-03 — Require trustworthy checks for the intended revision

- **Rule:** Gate the release branch or deployment on required checks from a trusted producer for the revision being released.
- **Why it matters:** A stale or spoofed green status can approve code that was never tested. GitHub accepts skipped/neutral statuses in some required-check semantics.
- **How to auto-enforce:** Configure required status producers and prevent routine bypass. Add a final policy job that checks expected jobs actually ran, verifies their results and records the commit. Keep check-policy changes reviewable. If host features are unavailable, gate the deployment credential instead.
- **What to teach:** “We verify this exact version, not an older version that happened to pass.”
- **Severity:** `block` — Production release with missing, stale, untrusted or skipped mandatory evidence.
- **Source / strength:** [S32][S33] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### GIT-04 — Make each change reviewable

- **Rule:** Keep a PR/change record focused and explain the behavior, verification, data changes and recovery implications.
- **Why it matters:** A large unexplained diff makes unintended work and risky changes harder to spot.
- **How to auto-enforce:** Populate a PR template from the actual diff and check results; link relevant issues. Warn on unrelated file groups, unexplained migrations or missing acceptance evidence. Do not force a nonexistent second human reviewer for every solo change.
- **What to teach:** “The change record tells you what will behave differently and how we checked it.”
- **Severity:** `warn` — Documentation or scope problems; a failed required check still blocks under GIT-03.
- **Source / strength:** [S31][S48] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### GIT-05 — Separate untrusted CI execution from privileged jobs

- **Rule:** Run untrusted code without deployment secrets or broad write authority; pin external actions to reviewed full commit SHAs.
- **Why it matters:** Privileged pull_request_target/workflow_run jobs can compromise the repository if they execute attacker-controlled code.
- **How to auto-enforce:** Lint workflow permissions, triggers, checkout refs and shell interpolation. Pass untrusted text as data, not embedded script. Use minimal job permissions and isolated release jobs; verify action provenance and automate reviewed SHA updates. Scan workflow changes as policy changes.
- **What to teach:** “Tests for outside contributions should not receive the keys to publish your app.”
- **Severity:** `block` — Untrusted execution with secrets/write authority, or an unreviewed mutable release action.
- **Source / strength:** [S33][S34] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### GIT-06 — Write descriptive commits; automate format only when useful

- **Rule:** Use small meaningful commits; adopt Conventional Commits only if release tooling or project policy benefits.
- **Why it matters:** Readable history helps investigation and rollback; a message prefix does not establish correctness.
- **How to auto-enforce:** Generate a description from the diff; optionally run commitlint for a chosen convention. Do not block a security fix solely because its message lacks a preferred prefix.
- **What to teach:** “A commit message should explain the change so your future self can find it.”
- **Severity:** `nudge` — Formatting and convention choices; never presented as a security requirement.
- **Source / strength:** [S31][S35] · accessed 2026-10-20 · `contested` (implementation and severity are proposed).

### Deploy

#### DEP-01 — Separate environments and validate their configuration

- **Rule:** Use distinct development, preview and production credentials/data, with an explicit environment schema.
- **Why it matters:** Preview code with production credentials can mutate real data. Vercel environment changes apply to new deployments, not existing ones.
- **How to auto-enforce:** Validate required names and types without printing values; compare nonsecret resource identifiers across environments. Deploy after configuration changes and verify the intended environment. Use secret-specific provider settings when available; public prefixes remain public.
- **What to teach:** “Testing should use test accounts and test data; changing a setting may require a new deployment.”
- **Severity:** `block` — Production credentials in an untrusted/test environment, or missing required production configuration.
- **Source / strength:** [S20][S36][S05] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### DEP-02 — Protect previews and avoid real customer data

- **Rule:** Restrict nonpublic preview URLs and use synthetic or appropriately de-identified fixtures.
- **Why it matters:** A hard-to-guess preview URL is not access control; experimental code can expose copied production records.
- **How to auto-enforce:** Inspect deployment protection settings and probe every relevant URL without credentials. Verify preview database identities and seeded fixtures. Check plan/scope support: Vercel's standard protection does not make the public production domain private. Product authentication remains separate.
- **What to teach:** “A preview is a test site, but it still needs a lock when it contains private material.”
- **Severity:** `block` — Sensitive data or functionality reachable through an unprotected preview.
- **Source / strength:** [S37][S20][S51] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### DEP-03 — Build and verify the production configuration

- **Rule:** Require a production build plus explicit type, lint/security and relevant behavior checks before release.
- **Why it matters:** A development server can work while production configuration, routing or type checks fail; disabling build errors hides failures.
- **How to auto-enforce:** Discover real project scripts, run clean installation and production build, then smoke-test critical user journeys. Reject silently disabled mandatory checks. For Next.js, inspect ignoreBuildErrors and any alternate build tsconfig. Do not assume one build command runs every quality check.
- **What to teach:** “We test the version users will receive, including its real build settings.”
- **Severity:** `block` — Failed or absent mandatory release checks; cosmetic lint preferences remain nudges.
- **Source / strength:** [S39][S40][S45] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### DEP-04 — Gate promotion separately from building

- **Rule:** Allow production traffic only after the expected release checks actually execute and pass.
- **Why it matters:** A successful build is not proof of passing external checks. Vercel native script checks can be skipped when their script is absent.
- **How to auto-enforce:** Configure Deployment Checks or an equivalent controlled release path. Validate required scripts, producer/revision binding and explicit results. Include a harmless failing fixture to prove promotion is blocked; prevent bypass through a second ungated deployment path.
- **What to teach:** “Building a release and opening it to users are two separate steps.”
- **Severity:** `block` — Promotion without complete required evidence; skipped is not an acceptable substitute for a mandatory check.
- **Source / strength:** [S38][S32] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### DEP-05 — Verify HTTPS and the actual production domain

- **Rule:** Serve sensitive production traffic only over valid HTTPS and verify expected domain routing.
- **Why it matters:** Wrong DNS, incomplete certificate issuance or mixed-content endpoints can break access or expose traffic.
- **How to auto-enforce:** Probe DNS, certificate validity/hostname, HTTPS responses and HTTP redirects. Verify OAuth callbacks and application origin settings. Vercel attempts automatic certificates after domain setup, but issuance still depends on successful validation.
- **What to teach:** “Your public address must reach the right app over an encrypted connection.”
- **Severity:** `block` — Invalid TLS or insecure sensitive production transport.
- **Source / strength:** [S42][S12] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### DEP-06 — Plan code recovery and data recovery separately

- **Rule:** Before stateful or destructive releases, establish a compatible rollback/roll-forward path and a tested data backup.
- **Why it matters:** Vercel rollback restores an earlier build and does not pick up newer environment settings; it cannot be treated as undoing database or external effects.
- **How to auto-enforce:** Record the known-good deployment and configuration revision. Rehearse migrations on isolated data, test old/new app compatibility, and verify restoration to an isolated target. Prefer compatible additive transitions; require an explicit recovery plan before destructive schema/data changes. Use commands for the installed migration-tool version.
- **What to teach:** “Restoring yesterday's app does not automatically restore yesterday's data.”
- **Severity:** `block` — Destructive/stateful release without credible recovery; never auto-restore over current production writes.
- **Source / strength:** [S41][S43][S44] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### DEP-07 — Observe the release and keep an incident path

- **Rule:** Monitor deployed health, errors and critical journeys, with an actionable owner and recovery record.
- **Why it matters:** A deployment can finish successfully while users encounter failed login, failed writes or unavailable dependencies.
- **How to auto-enforce:** Run synthetic post-release checks with test identities; configure error/availability alerts and verify their delivery. Store deployment ID and recovery instructions in the issue queue. Do not run destructive smoke tests against customer records.
- **What to teach:** “A green deploy icon is only the start; we check that people can still use the app.”
- **Severity:** `warn` — Missing routine monitoring; observed critical journey failure blocks completion of that release.
- **Source / strength:** [S39][S26][S41] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

### Project hygiene

#### HYG-01 — Follow the framework and the existing project layout

- **Rule:** Use one documented layout and naming style, preserving framework-required file conventions.
- **Why it matters:** Inconsistent organization makes work harder to navigate; arbitrary folder rules can also fight the framework. Next.js, for example, makes src optional.
- **How to auto-enforce:** Detect the framework before generating files; check imports and routing conventions. Apply formatter/naming rules to touched files. Warn about duplicate authorities or unexplained entry points; avoid a mass restructure just to fit the harness.
- **What to teach:** “Files should be easy to find without forcing your app into somebody else's preferred layout.”
- **Severity:** `nudge` — Style choices; an actual broken route/import is a correctness failure under DEP-03.
- **Source / strength:** [S46] · accessed 2026-10-20 · `contested` (implementation and severity are proposed).

#### HYG-02 — Keep a runnable minimum README

- **Rule:** Document purpose, local setup, required configuration names, checks, deployment and recovery.
- **Why it matters:** A project that only its current agent can run is difficult to maintain or recover.
- **How to auto-enforce:** Generate instructions from package scripts and environment schema; verify commands in a clean disposable environment. Keep sample values fake and link longer operational details rather than duplicating them.
- **What to teach:** “A new person or a fresh agent should be able to start and check the app from its instructions.”
- **Severity:** `warn` — Missing or stale operational documentation.
- **Source / strength:** [S47][S39] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### HYG-03 — Make dependency installation reproducible

- **Rule:** Commit the appropriate lockfile and use a pinned, compatible runtime/package-manager toolchain with frozen installation in CI.
- **Why it matters:** An unlocked or mismatched install can test one dependency graph and ship another. A lockfile does not prove packages are safe.
- **How to auto-enforce:** For npm, run npm ci and fail on manifest/lock mismatch; use the installed manager's equivalent elsewhere. Validate the selected lockfile and build image/toolchain. Update through reviewed changes; do not confuse reproducibility with permanently freezing security updates.
- **What to teach:** “Everyone should build from the same recipe, and updates should be deliberate.”
- **Severity:** `block` — Release install drift or a missing required lockfile; package ranges can remain when the lockfile fixes resolution.
- **Source / strength:** [S45][S49] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### HYG-04 — Review new dependencies and maintain them

- **Rule:** Verify package provenance, necessity, install scripts and license fit; keep an update and vulnerability-check cadence.
- **Why it matters:** A typo, compromised package or install script can run unwanted code; the absence of known advisories is not a trust guarantee.
- **How to auto-enforce:** Inspect newly added packages and lock changes; run installation/build in an isolated environment without production secrets. Restrict lifecycle scripts where compatible, explicitly configuring required exceptions. Schedule updates and whole-graph scans; evaluate license obligations separately.
- **What to teach:** “A new library brings someone else's code into your project, including during installation.”
- **Severity:** `warn` — Unreviewed additions or overdue maintenance; known dangerous findings escalate to SEC-03/GIT-05.
- **Source / strength:** [S49][S07] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### HYG-05 — Link work to evidence before marking it complete

- **Rule:** Track consequential changes with a bounded acceptance condition, implementation reference and verification result.
- **Why it matters:** Closing an issue on merge does not prove the reported user problem is fixed.
- **How to auto-enforce:** Use local structured tasks or GitHub issues; link the change, test result and deployment when relevant. Deduplicate items and reopen failed acceptance checks. Keep source-code merge, release and user-visible verification as distinct states.
- **What to teach:** “Done means the promised behavior was checked, not merely that a checkbox was ticked.”
- **Severity:** `warn` — Missing acceptance evidence; failed required acceptance blocks release through DEP-03.
- **Source / strength:** [S48] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

### Data & privacy

#### PRV-01 — Identify applicable privacy obligations before selecting a policy

- **Rule:** Record the operator, intended users, data categories, purposes, processors and relevant jurisdictions.
- **Why it matters:** There is no general GDPR-lite exemption for small apps; applicability depends on activities and territorial scope. Canadian obligations also differ by activity and province.
- **How to auto-enforce:** Scaffold a short data inventory and flag sensitive/children's/high-risk uses for qualified review. Require explicit applicability notes rather than inferring jurisdiction solely from hosting location or the developer's address.
- **What to teach:** “Small apps still handle real people's data; the applicable rules depend on what the app does and whom it serves.”
- **Severity:** `warn` — Missing applicability assessment; unresolved high-risk processing should not launch under a guessed policy.
- **Source / strength:** [S50][S58] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### PRV-02 — Collect only needed data for a defined lawful purpose

- **Rule:** Define purpose and lawful basis before collecting personal data; minimize fields and default visibility.
- **Why it matters:** Unnecessary data increases exposure; consent is one lawful basis, not the automatic answer for every purpose.
- **How to auto-enforce:** Associate fields/events with a purpose and retention category; flag unexplained new collection. Default profiles/data to restricted access and use synthetic development fixtures. The harness can check completeness, but cannot automatically decide that a legal basis is valid.
- **What to teach:** “If the app does not need a piece of personal information, it should not ask for it.”
- **Severity:** `block` — Personal-data collection without a defined purpose/basis or with demonstrably unnecessary sensitive fields.
- **Source / strength:** [S51][S52] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### PRV-03 — Explain actual processing at collection time

- **Rule:** Provide a clear, accurate privacy notice and contact path that match the real data flows.
- **Why it matters:** A generic copied notice may omit processors, purposes, retention or rights and mislead users.
- **How to auto-enforce:** Generate a draft from the data inventory; compare forms, analytics and integrations with that inventory. Verify links and contact details before enabling collection. Have the operator validate factual/legal statements; do not invent a company address, vendor promise or compliance badge.
- **What to teach:** “People should know what you collect, why, how long it stays, and how to contact you.”
- **Severity:** `block` — Missing materially required notice for the applicable processing.
- **Source / strength:** [S53] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### PRV-04 — Enforce retention instead of retaining everything forever

- **Rule:** Assign retention rules to databases, uploads, logs and backups, including justified exceptions.
- **Why it matters:** Forgotten copies outlive their purpose and increase exposure; universal immediate deletion can also conflict with valid retention duties.
- **How to auto-enforce:** Schedule expiry/deletion jobs and test them on fixtures. Report expired records, failed jobs and backup expiry. Track legal holds explicitly and prevent restored backups from silently reviving previously deleted records.
- **What to teach:** “Old personal information should not stay around just because nobody remembered to remove it.”
- **Severity:** `warn` — Missing/untested retention; an identified unlawful retention or active exposure needs stronger remediation.
- **Source / strength:** [S51][S58] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### PRV-05 — Make applicable data rights operational

- **Rule:** Provide a verified way to handle access, correction, erasure, objection and portability requests where applicable.
- **Why it matters:** A promised delete/export function can fail or disclose another person's records if identity and scope are not checked.
- **How to auto-enforce:** Test requests with two distinct users; verify the requester proportionately and apply per-system deletion/export rules. Track deadlines, exceptions and completion evidence. A documented assisted process can suffice; a fully automated account page is not universally required.
- **What to teach:** “People need a working way to access or correct their information and request deletion when the rules allow it.”
- **Severity:** `block` — No workable path for applicable rights; do not assume every right applies identically to every legal basis.
- **Source / strength:** [S54] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### PRV-06 — Assess processors and transfers before sending personal data

- **Rule:** Review hosting, analytics, support and AI recipients, their processing terms and any applicable international-transfer mechanism.
- **Why it matters:** Adding an API can disclose data to another organization or jurisdiction; a region dropdown alone does not settle the obligations.
- **How to auto-enforce:** Maintain a vendor/data-flow inventory and required agreement references. Keep unknown integrations off for real personal data; use minimized synthetic inputs for development. Check logs and AI prompts for unintended exports. Contract/legal adequacy remains a human assessment.
- **What to teach:** “Connecting another service can share your users' data with another company.”
- **Severity:** `block` — Unassessed personal-data transfers or missing required processor arrangements.
- **Source / strength:** [S55][S56][S51] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### PRV-07 — Gate analytics according to purpose and jurisdiction

- **Rule:** Do not activate optional tracking until the applicable consent or valid exception conditions are met.
- **Why it matters:** A banner that loads trackers first does not enforce a choice. Current UK PECR guidance includes a conditional statistical-purpose exception with a free, simple objection mechanism.
- **How to auto-enforce:** Inventory tags, cookies and storage/network activity; test fresh, rejected, accepted and withdrawn states. Disable unknown optional trackers by default. Document exact exception conditions and regional policy. Do not treat cookieless, first-party or analytics as automatic exemptions everywhere.
- **What to teach:** “Your choice must actually control tracking; the rules depend on what the tracking does and where they apply.”
- **Severity:** `block` — Tracking enabled without the required permission or documented applicable exception.
- **Source / strength:** [S57][S52] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

#### PRV-08 — Prepare a breach-response procedure with accountable ownership

- **Rule:** Document containment, assessment, evidence preservation and jurisdiction-specific notification responsibilities.
- **Why it matters:** A team can lose time or notify incorrectly after an incident. EDPB guidance distinguishes documenting breaches, regulator notification subject to risk, and individual notification for high risk.
- **How to auto-enforce:** Generate an incident template with owner and awareness timeline; test secret rotation, service isolation and contact routes. Surface applicable deadlines, including GDPR's conditional 72-hour regulator-notification rule. Do not automatically notify regulators or affected people without an accountable decision.
- **What to teach:** “If personal data is exposed, we need a clear response and a person responsible for acting promptly.”
- **Severity:** `warn` — Missing preparedness; an active breach is an immediate incident, not an ordinary backlog item.
- **Source / strength:** [S59][S04] · accessed 2026-10-20 · `practiced` (implementation and severity are proposed).

### Risk coverage map

This maps subjects to OWASP Top 10:2025 headings; it does **not** claim complete coverage or equivalence to ASVS verification. The mapping is a `contested` synthesis of the controls above. [S01][S02][S03]

| OWASP 2025 risk | Relevant proposed rules |
|---|---|
| A01 Broken Access Control | SEC-05, SEC-14, SEC-15, SEC-21 |
| A02 Security Misconfiguration | SEC-06, SEC-13, DEP-01 through DEP-05 |
| A03 Software Supply Chain Failures | SEC-03, GIT-05, HYG-03, HYG-04 |
| A04 Cryptographic Failures | SEC-01, SEC-04, SEC-06, SEC-07, DEP-05 |
| A05 Injection | SEC-09, SEC-10, SEC-11 |
| A06 Insecure Design | SEC-09, SEC-17, SEC-22, PRV-02 |
| A07 Authentication Failures | SEC-04, SEC-06, SEC-07, SEC-08 |
| A08 Software or Data Integrity Failures | SEC-18, GIT-03, GIT-05, HYG-03 |
| A09 Security Logging and Alerting Failures | SEC-20, DEP-07, PRV-08 |
| A10 Mishandling of Exceptional Conditions | SEC-19, DEP-06 |

## Gaps / unknowns

1. **Unvalidated implementations.** These are proposed adapters/checks, not installed controls. Static rules and scanners will have false positives and false negatives; negative fixtures and version-specific integration tests are still required. A model writing both a fix and its only test is not independent assurance.
2. **Coverage is intentionally asymmetric.** Security has 22 rules, Git 6, Deploy 7, Hygiene 5, and Privacy 8. Infrastructure hardening/CIS benchmarks, mobile clients, Kubernetes, payment-card scope, accessibility law, and sector-specific health/financial requirements were not deeply researched. Add profiles when those technologies or risks actually exist.
3. **Feature and plan dependence.** GitHub security/protection features and Vercel deployment protection have repository/plan/scope conditions. Detect available controls and label unsupported enforcement honestly; a generated config file alone does not establish that the host applies it. [S06][S07][S32][S37]
4. **No universal legal preset.** The privacy section uses EU official guidance, UK ICO guidance, and a Canadian applicability pointer. It is not a complete jurisdiction survey. “GDPR-lite” is not a general small-business exemption; current UK analytics exceptions must not be exported to other jurisdictions without checking their rules. [S50][S57][S58]
5. **Legal source access limitation.** Both attempted EUR-Lex HTML routes returned a JavaScript/robot-verification page. No statutory text was inferred from that page; substantive privacy claims rely on the cited Commission/EDPB/ICO/OPC guidance. High-risk use cases and uncertain legal bases still need qualified assessment.
6. **Version drift matters.** The inspected Vercel docs describe skipped checks when scripts are absent and environment values that do not update old deployments. The old Prisma migration-workflow URL redirected to a new migration model. Generate checks against installed versions instead of copying remembered commands. [S36][S38][S44]
7. **Risk decisions cannot all be automated.** A scanner cannot determine every business authorization rule, whether a package vulnerability is reachable, whether consent is legally valid, or whether a destructive migration's recovery window is acceptable. Record the decision, evidence and owner rather than fabricating a pass. [S03][S11][S52][S54]
8. **No fixed incident or usability benefit measured.** Severity thresholds, warning deadlines, rule ordering and queue wording are research proposals. This run did not measure approval fatigue, scan latency, prevented incidents or novice comprehension. A production claim needs evaluation rather than the size of this catalog.

## Sources

All sources were accessed **2026-10-20**. Links point to primary documentation, standards, or official regulatory guidance. Documents and plan availability can change; references describe the pages inspected, not a guaranteed future runtime contract.

| # | Source URL | Type | Accessed |
|---|---|---|---|
| S01 | [OWASP Top 10:2025][S01] | standard / awareness | 2026-10-20 |
| S02 | [OWASP ASVS 5.0.0 and versioned requirement identifiers][S02] | standard | 2026-10-20 |
| S03 | [OWASP: establishing an application security program; coverage limits][S03] | guidance | 2026-10-20 |
| S04 | [OWASP Secrets Management][S04] | guidance | 2026-10-20 |
| S05 | [Next.js environment variables and browser bundles][S05] | docs | 2026-10-20 |
| S06 | [GitHub push protection][S06] | docs | 2026-10-20 |
| S07 | [GitHub dependency review][S07] | docs | 2026-10-20 |
| S08 | [npm audit v11][S08] | docs | 2026-10-20 |
| S09 | [OWASP Authentication][S09] | guidance | 2026-10-20 |
| S10 | [OWASP Password Storage][S10] | guidance | 2026-10-20 |
| S11 | [OWASP Authorization][S11] | guidance | 2026-10-20 |
| S12 | [OWASP Session Management][S12] | guidance | 2026-10-20 |
| S13 | [RFC 8725: JSON Web Token Best Current Practices][S13] | IETF BCP | 2026-10-20 |
| S14 | [RFC 9700: Best Current Practice for OAuth 2.0 Security][S14] | IETF BCP | 2026-10-20 |
| S15 | [OWASP Input Validation][S15] | guidance | 2026-10-20 |
| S16 | [OWASP SQL Injection Prevention][S16] | guidance | 2026-10-20 |
| S17 | [OWASP Cross Site Scripting Prevention][S17] | guidance | 2026-10-20 |
| S18 | [OWASP Cross-Site Request Forgery Prevention][S18] | guidance | 2026-10-20 |
| S19 | [MDN CORS][S19] | docs | 2026-10-20 |
| S20 | [OWASP Database Security][S20] | guidance | 2026-10-20 |
| S21 | [PostgreSQL row security policies][S21] | docs | 2026-10-20 |
| S22 | [OWASP Server-Side Request Forgery Prevention][S22] | guidance | 2026-10-20 |
| S23 | [OWASP File Upload][S23] | guidance | 2026-10-20 |
| S24 | [OWASP REST Security][S24] | guidance | 2026-10-20 |
| S25 | [OWASP Webhook Security][S25] | guidance | 2026-10-20 |
| S26 | [OWASP Logging][S26] | guidance | 2026-10-20 |
| S27 | [OWASP A10:2025 — Mishandling of Exceptional Conditions][S27] | standard / awareness | 2026-10-20 |
| S28 | [OWASP Error Handling][S28] | guidance | 2026-10-20 |
| S29 | [MDN Cache-Control][S29] | docs | 2026-10-20 |
| S30 | [Git gitignore manual][S30] | docs | 2026-10-20 |
| S31 | [GitHub flow][S31] | docs | 2026-10-20 |
| S32 | [GitHub protected branches and status-check semantics][S32] | docs | 2026-10-20 |
| S33 | [GitHub Actions secure use][S33] | docs | 2026-10-20 |
| S34 | [GitHub: securely using pull_request_target][S34] | docs | 2026-10-20 |
| S35 | [Conventional Commits 1.0.0][S35] | specification | 2026-10-20 |
| S36 | [Vercel environment variables][S36] | docs | 2026-10-20 |
| S37 | [Vercel Deployment Protection][S37] | docs | 2026-10-20 |
| S38 | [Vercel Deployment Checks][S38] | docs | 2026-10-20 |
| S39 | [Next.js production checklist][S39] | docs | 2026-10-20 |
| S40 | [Next.js TypeScript build configuration][S40] | docs | 2026-10-20 |
| S41 | [Vercel Instant Rollback][S41] | docs | 2026-10-20 |
| S42 | [Vercel SSL certificates][S42] | docs | 2026-10-20 |
| S43 | [PostgreSQL Backup and Restore][S43] | docs | 2026-10-20 |
| S44 | [Prisma editing a migration (redirect from older workflow documentation)][S44] | docs | 2026-10-20 |
| S45 | [npm ci v11][S45] | docs | 2026-10-20 |
| S46 | [Next.js project structure][S46] | docs | 2026-10-20 |
| S47 | [GitHub repository README guidance][S47] | docs | 2026-10-20 |
| S48 | [GitHub linking pull requests to issues][S48] | docs | 2026-10-20 |
| S49 | [OWASP NPM Security][S49] | guidance | 2026-10-20 |
| S50 | [European Commission: application of GDPR, including SMEs][S50] | official guidance | 2026-10-20 |
| S51 | [European Commission: principles of personal-data processing][S51] | official guidance | 2026-10-20 |
| S52 | [European Commission: legal grounds for processing][S52] | official guidance | 2026-10-20 |
| S53 | [European Commission: information duties and other obligations][S53] | official guidance | 2026-10-20 |
| S54 | [EDPB: respect individuals' rights][S54] | regulator guidance | 2026-10-20 |
| S55 | [EDPB: controller and processor responsibilities][S55] | regulator guidance | 2026-10-20 |
| S56 | [EDPB: international data transfers][S56] | regulator guidance | 2026-10-20 |
| S57 | [ICO: storage/access exceptions, including statistical purposes][S57] | regulator guidance | 2026-10-20 |
| S58 | [OPC Canada: PIPEDA fair information principles][S58] | regulator guidance | 2026-10-20 |
| S59 | [EDPB: personal-data breaches][S59] | regulator guidance | 2026-10-20 |

[S01]: https://top10.owasp.org/2025/
[S02]: https://asvs.owasp.org/
[S03]: https://top10.owasp.org/2025/0x03_2025-Establishing_a_Modern_Application_Security_Program/
[S04]: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
[S05]: https://nextjs.org/docs/app/guides/environment-variables
[S06]: https://docs.github.com/en/code-security/concepts/secret-security/push-protection
[S07]: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review
[S08]: https://docs.npmjs.com/cli/v11/commands/npm-audit/
[S09]: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
[S10]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
[S11]: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
[S12]: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
[S13]: https://www.rfc-editor.org/rfc/rfc8725.html
[S14]: https://www.rfc-editor.org/rfc/rfc9700.html
[S15]: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
[S16]: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
[S17]: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
[S18]: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
[S19]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
[S20]: https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html
[S21]: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
[S22]: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
[S23]: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
[S24]: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
[S25]: https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html
[S26]: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
[S27]: https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/
[S28]: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
[S29]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
[S30]: https://git-scm.com/docs/gitignore
[S31]: https://docs.github.com/en/get-started/using-github/github-flow
[S32]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
[S33]: https://docs.github.com/en/actions/reference/security/secure-use
[S34]: https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target
[S35]: https://www.conventionalcommits.org/en/v1.0.0/
[S36]: https://vercel.com/docs/environment-variables
[S37]: https://vercel.com/docs/deployment-protection
[S38]: https://vercel.com/docs/deployment-checks
[S39]: https://nextjs.org/docs/app/guides/production-checklist
[S40]: https://nextjs.org/docs/app/api-reference/config/typescript
[S41]: https://vercel.com/docs/instant-rollback
[S42]: https://vercel.com/docs/domains/working-with-ssl
[S43]: https://www.postgresql.org/docs/current/backup.html
[S44]: https://www.prisma.io/docs/orm/migrations/editing-a-migration
[S45]: https://docs.npmjs.com/cli/v11/commands/npm-ci/
[S46]: https://nextjs.org/docs/app/getting-started/project-structure
[S47]: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
[S48]: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue
[S49]: https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html
[S50]: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/application-gdpr_en
[S51]: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en
[S52]: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en
[S53]: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en
[S54]: https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en
[S55]: https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en
[S56]: https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en
[S57]: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/
[S58]: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda-compliance-help/pipeda_brief/
[S59]: https://www.edpb.europa.eu/sme/assess-the-risks/data-breaches_en

## Implications for vibe-fence

The following are numbered **`contested` design recommendations**. “Copy” means adapt an established pattern; none is implemented by this contribution.

1. **Invent — an executable rule record before generating prose.** Give every rule an ID, applicability predicate, default severity, source/version, check adapter, affected action, evidence schema and repair workflow. Store `pass`, `fail`, `unknown` and `not-applicable` separately. Keep policy evidence bound to the relevant commit, configuration and environment. This follows ASVS's versioned-requirement approach while adding the harness-specific execution contract. [S02]

2. **Copy — start with deterministic release blockers.** First implement secret/credential exposure checks, tracked-secret-file detection, locked installation, configured dependency auditing, explicit build/type/security checks, and verification that those checks actually ran (SEC-01–03, GIT-01/03, HYG-03, DEP-03/04). These provide inspectable results. They must be presented as baseline controls, not total security coverage. [S03][S06][S07][S30][S38][S45]

3. **Copy — install secure feature templates next.** Add reviewed auth/session/authorization, parameterized data access, validation, safe rendering and CSRF patterns with hostile-user tests (SEC-04–14). Activate them according to detected features. Require cross-user and cross-tenant negative tests before claims about private data isolation. [S09][S11][S15][S17][S18][S21]

4. **Invent — a release gate that the acting agent cannot quietly weaken.** Keep mandatory policy and the publishing credential behind a separate authorization boundary. Treat edits to workflows, test exclusion, ignore lists and deployment-check settings as changes to the protection itself. Verify all release paths, including manual CLI publishing. The exact boundary needs host-specific implementation and adversarial testing. [S32][S33][S34][S38]

5. **Copy — model deployment and data recovery as distinct plans.** Implement environment isolation, preview access tests, TLS checks and a verified deployment identity; add migration rehearsal and isolated restoration before destructive changes (DEP-01–06). Tell the user which effects a rollback cannot undo. Do not automatically erase new production data while attempting recovery. [S20][S37][S41][S42][S43][S44]

6. **Invent — make finding resolution evidence-driven.** A queued item should contain its rule, concrete impact, sanitized evidence, proposed fix, bounded plan, owner, affected release and verification result. The agent fixes routine issues and reruns the relevant check. Merge, deploy and accepted behavior are separate states; do not resolve an issue merely because a linked PR closed it. [S26][S48]

7. **Avoid — making the beginner adjudicate technical security.** Explain the consequence and the automatic fix, rather than asking whether passwords should be hashed or private endpoints authorized. Ask for business facts only where needed: who should have access, what data is needed, or which operator owns the service. Escalate genuinely unresolved legal or business-policy decisions with a concrete recommendation. [S10][S11][S50][S52]

8. **Copy — keep workflow preferences low severity.** Adopt existing framework layout; use short branches and readable commits; make Conventional Commits optional unless actual tooling depends on them. Apply cosmetic improvements without repeatedly interrupting the user. Preserve production blockers for demonstrated correctness, exposure and required evidence failures. [S31][S35][S46]

9. **Invent — an explicit mitigation and expiry mechanism.** Findings may be inapplicable or mitigated, but the agent must attach evidence, scope, an owner and expiry/recheck conditions. Do not let a dismissed advisory, disabled scanner or generic “accept risk” click become a permanent green result. Changes in dependencies or deployment should invalidate stale decisions. [S07][S08]

10. **Copy — minimize data before adding a consent interface.** Ship synthetic fixtures, restricted defaults, a purpose/vendor inventory, clear notices and tested retention/rights procedures. Add tracking only with an applicable policy that demonstrably controls its actual execution. A cookie banner is not a privacy program, and a small app is not automatically exempt. [S50][S51][S53][S54][S57]

11. **Avoid — treating the model as the enforcement authority.** Let the model explain and repair; let deterministic policy, access controls, tests and trusted host integrations decide what actually passed or was permitted. An LLM's confident “safe” label is not equivalent to a verified signature, authorization check or successful test execution. [S11][S13][S38]

12. **Invent — verify the guardrails themselves with harmless adversarial fixtures.** Include seeded fake secrets, missing CI scripts, skipped jobs, disabled checks, wrong-environment identifiers, cross-user requests, reflected origins, replayed events, public private-data caches, and pre-consent network calls. Test valid cases too, to measure false blocking. Record runtime/version, latency and user comprehension alongside prevented failures. [S11][S19][S25][S29][S38][S57]

13. **Copy — schedule ongoing checks and prepare incident ownership.** Re-scan resolved dependencies, observe production errors, exercise recovery and retention procedures, and track expiring exceptions. Keep an incident path for exposed credentials and personal-data breaches. Repeated no-change scans should stay quiet; meaningful findings should enter the remediation queue. [S08][S26][S43][S59]

14. **Invent — keep teaching level and turbo independent of the safety gate.** Reuse the one-line “What to teach” text at low verbosity, with detailed evidence available on demand. Turbo may finish more routine remediation inside an agreed scope; it must not disable secret scanning, expand database authority, skip release checks or activate unknown tracking. This is a product proposal to evaluate, not an outcome demonstrated by the sources. [S04][S20][S38][S57]

