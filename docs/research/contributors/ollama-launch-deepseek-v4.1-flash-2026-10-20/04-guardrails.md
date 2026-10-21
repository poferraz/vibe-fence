# Stream 04 — Developer Guardrails

- **Model:** deepseek-v4.1-flash
- **Provider:** Hermes desktop app via ollama-launch (`deepseek-v4.1-flash:1017-cloud`)
- **Date:** 2026-10-20
- **Stream:** 04 — Developer Guardrails (rights & wrongs a harness must enforce)

---

## Thesis: only deterministic rules may block

The obvious way to build a guardrail catalogue is a list of "best practices" with severities. That fails for a specific reason: **a rule that cannot be checked mechanically becomes an opinion, and an opinion rendered as a blocking dialog is exactly the approval fatigue that makes users click through** (stream 05, U-01/U-02). So this file is organised around one test applied to every rule:

> **Is there a command that returns a verdict?**
> - **Yes, and the consequence is irreversible → `block`** (the check runs before the action; failure stops it).
> - **Yes, and the consequence is reversible → `warn`** (fix now or in the next digest; a checkpoint exists).
> - **No → `nudge`** — and it is not a gate. It is either a teaching card or it is dropped.

That gives a catalogue of **26 rules** across the five categories, each with a real command, a severity derived from the rule above (not asserted), and a one-line explanation a store manager can follow. Where a widely-quoted rule fails the determinism test (e.g. "use semantic naming", "write clean code"), it is deliberately **not** in the catalogue — that is a teaching-channel item (stream 05, T-06), not a guardrail.

Two framing facts from the research anchor the priorities:

- **Secrets are the dominant beginner failure**, and the industry has moved from detection to prevention: GitHub's push protection blocks the push rather than alerting after the fact ([S-03]).
- **Most agent context files say nothing about security at all** — 14.8% of 2,303 files across 1,925 repositories ([S-12]). The guardrails vibe-fence writes are not competing with a crowded field; they are filling an absence.

---

## 1. Security (S-rules)

| ID | Rule (normative) | Failure if ignored | Auto-enforcement | Teach the user | Severity |
|---|---|---|---|---|---|
| **S-01** | No secret may exist in a tracked file. | A key in a public repo is compromised within minutes of indexing; bots scan GitHub continuously. | `gitleaks detect --no-git --redact` + `git ls-files` scan on every `fence check`; pre-commit hook. | "A key in the repo is a key on the internet. I moved it to `.env`, which stays on your machine." | **block** |
| **S-02** | `.env` must never be committed, and must be gitignored from the first commit. | Once committed, the value is in history forever — rotating is the only fix. | `git check-ignore -v .env` + `git log --all --oneline -- .env` (history check). | "This file holds your passwords. It can stay on your computer, just not in the project's shared history." | **block** |
| **S-03** | Client-exposed env prefixes must not carry secrets. | Anything prefixed `NEXT_PUBLIC_`/`VITE_` is inlined into the browser bundle; the secret is public even in a private repo. | `git grep -nE '(NEXT_PUBLIC|VITE|PUBLIC)_[A-Z_]*(KEY|SECRET|TOKEN|PASSWORD)'` | "Anything starting with `NEXT_PUBLIC_` gets shipped to the visitor's browser — so it can't be a secret." | **block** |
| **S-04** | Secrets are read from the environment, never hardcoded, never defaulted to a real value. | A hardcoded fallback silently ships a working credential. | Semgrep rule set for hardcoded-credential patterns + entropy check on added lines. | "The app should read the key from its settings, not carry a copy of it." | **block** |
| **S-05** | Dependency installs must not execute arbitrary post-install scripts by default. | `postinstall` is arbitrary code execution as the developer; it is a known supply-chain vector. | `npm ci --ignore-scripts` as the default in the fence's commands; surface a diff if a package requires scripts. | "Installing a package can run code on your machine. I install with that switched off unless the package needs it." | **block** (silent default) |
| **S-06** | No dependency with a known high/critical advisory may ship. | Known-vulnerable code in production is the most exploited class of bug. | `npm audit --omit=dev --audit-level=high` (fails non-zero) in CI and `fence check`. | "One of the building blocks you're using has a known hole. There's a newer version that fixes it — I can update it." | **block** on critical, **warn** on high |
| **S-07** | A new dependency must not be a typosquat of a popular package. | `cross-env` vs `crossenv`, `lodash` vs `1odash` — the payload is the install. | Compare added package names against the top-N registry list with edit distance ≤2 and homoglyph normalisation; require confirmation on match. | "This package name is one letter away from a popular one. That's a common way to trick people into installing malware." | **block** (with override) |
| **S-08** | Auth must use a maintained library and secure cookie defaults. | Hand-rolled session code is where beginners leak accounts. | Presence check for a known auth lib; lint for `SameSite=None` without `Secure`; require `HttpOnly` on session cookies. | "Logins are the part nobody should write from scratch — I'm using the standard library and checking the cookie settings." | **warn** |
| **S-09** | All user input that reaches a database must go through parameterised queries or an ORM. | String-concatenated SQL is OWASP A03 (Injection) — the classic breach. | Semgrep/CodeQL injection rules on changed files; flag template literals inside query calls. | "Text from a form can contain commands. Parameterised queries treat it as text, not code." | **block** on changed lines |
| **S-10** | Output rendered as HTML must be escaped or sanitised. | XSS: attacker script runs as your user. | Framework-aware lint (React escapes by default; flag `dangerouslySetInnerHTML`, `v-html`, `innerHTML` with non-constant input). | "If you paste raw HTML into the page, you're letting whoever wrote it run code in your visitors' browsers." | **warn** (block if input is user-controlled) |
| **S-11** | State-changing requests must not be executable cross-site. | CSRF: another site can make your logged-in user do things. | Check `SameSite=Lax|Strict` on session cookies; check that mutations are POST/PUT/DELETE, not GET. | "A cookie setting stops other websites from pretending to be your user." | **warn** |
| **S-12** | A Content-Security-Policy must exist in production and must not contain `unsafe-eval`. | Missing CSP turns any XSS into full compromise; `unsafe-eval` re-opens it. | Fetch the deployed headers and assert `content-security-policy` present; grep config for `unsafe-eval`. | "This is a allow-list for what the page is permitted to run. Without it, one bad script can do anything." | **warn** |
| **S-13** | No `eval`, no `new Function`, no shelling out with interpolated user input. | Direct code execution / command injection. | ESLint `no-eval`, `no-implied-eval`, `no-new-func`; Semgrep command-injection rules. | "Running text as code is how a small bug becomes a break-in." | **block** |
| **S-14** | Server-side fetches of user-supplied URLs must be allowlisted. | SSRF: your server becomes a proxy into your own network (OWASP A10). | Semgrep rule on `fetch(req.*url)` patterns; require an allowlist helper. | "If your server fetches any address a user types, someone can use it to reach things they shouldn't." | **warn** |
| **S-15** | Errors must not return stack traces or secrets to the client. | Verbose errors leak paths, versions, sometimes connection strings. | Check for `NODE_ENV=production` handling; grep for `res.send(err)` / `stack` in response paths. | "Detailed error messages are for you, not for visitors — they can reveal how your app is built." | **warn** |

### Why these fifteen and not the whole OWASP list

The OWASP Top 10:2021 categories map cleanly onto a beginner web app for **A01 (broken access control), A02 (cryptographic failures), A03 (injection), A05 (security misconfiguration), A06 (vulnerable components), A07 (auth failures)** — each has at least one rule above. **A04 (insecure design), A08 (integrity failures), A09 (logging/monitoring)** matter but are either judgement calls (A04) or produce no verdict a fence can compute for a solo project (A09 — a beginner app has no monitoring to speak of). **A10 (SSRF)** gets one rule because agent-generated code fetches user URLs surprisingly often.

That is a deliberate narrowing: a fence that tries to cover A04 and A09 will generate nudges it cannot enforce, which is the failure mode this whole file is built to avoid. Note it explicitly in the README rather than pretending to full coverage ([S-01]).

---

## 2. Git & GitHub hygiene (G-rules)

| ID | Rule | Failure if ignored | Auto-enforcement | Teach the user | Severity |
|---|---|---|---|---|---|
| **G-01** | The repo must be a git repo with an initial commit before the fence does anything. | No history means no undo — the fence's entire reversibility story collapses. | `git rev-parse --is-inside-work-tree`; `fence init` runs `git init` + first commit if absent. | "Git is your undo button. I set it up so every change can be rolled back." | **block** (self-healing) |
| **G-02** | `.gitignore` must exclude `.env*`, `node_modules/`, build output, and OS cruft, from commit one. | Committing `node_modules` or `.env` is unrecoverable-by-rotation. | Assert entries exist; `fence init` writes them. | "There are files that should never be shared — I keep them out of the project's history." | **block** |
| **G-03** | No force-push to a shared branch; no history rewrite without a backup ref. | Destroys other people's work and your own rollback. | Hook: refuse `push --force` when the branch tracks a remote; create `refs/backup/<ts>` before any rewrite. | "Rewriting history deletes the safety copy. I'll make a backup first if you really need it." | **block** |
| **G-04** | Commits must be small and single-purpose, with a message that says what changed. | One giant "update" commit makes rollback impossible and review meaningless. | `fence commit` stages by intent; warn when a diff exceeds N files or mixes lockfile + source. | "Small steps mean you can undo one thing instead of everything." | **warn** |
| **G-05** | No committing generated artefacts, build output, or editor state. | Repo bloat, merge noise, secrets in build output. | Path allowlist check on staged files. | "These files are rebuilt automatically — keeping them out keeps the project clean." | **warn** |
| **G-06** | CI must pin third-party actions to a commit SHA, not a tag. | Tags are mutable; a compromised action runs with your token. | Parse `.github/workflows/*.yml` for `uses: x@vN` without a 40-char SHA. | "Actions are code from other people. Pinning the exact version stops it changing under you." | **warn** |
| **G-07** | Workflow tokens must be least-privilege. | Default `GITHUB_TOKEN` permissions can write to the repo. | Assert a top-level `permissions:` block exists and is not `write-all`. | "The automation only gets the keys it needs, not the master key." | **warn** |
| **G-08** | Dependencies must be installed from a lockfile in CI. | `npm install` drifts; the deployed thing differs from what you tested. | Use `npm ci`; fail if lockfile and `package.json` disagree. | "This makes the finished app use exactly the versions that were tested." | **warn** |

---

## 3. Deploy (D-rules, Vercel-centric but generalisable)

| ID | Rule | Failure if ignored | Auto-enforcement | Teach the user | Severity |
|---|---|---|---|---|---|
| **D-01** | Production secrets live in the platform's environment settings, never in the repo or the build script. | Build-time injection of a committed secret is the same leak with extra steps. | `vercel env ls` (or equivalent) presence check per required key; assert no secrets in `vercel.json`/build scripts. | "The hosting platform keeps the keys; the project only knows their names." | **block** |
| **D-02** | Preview and Production must have separate values, and production-only keys must not exist in preview. | A preview deployment with prod keys is a public door to the real database. | Compare env var names across environments; flag keys present in Preview that are marked production-only. | "Test versions shouldn't be able to touch the real data." | **warn** |
| **D-03** | Preview deployments must be protected when the repo is public. | Anyone with the URL can use your preview, including its APIs. | Assert deployment protection (Vercel Authentication / password) is enabled. | "Test versions are for you, not the public — I've put a lock on them." | **warn** |
| **D-04** | The build must pass before deploy; no deploying a red build. | Shipping a broken build is the most visible beginner failure. | `fence check` runs install → typecheck → test → build in order; deploy command refuses on failure. | "I won't put anything live that doesn't build." | **block** |
| **D-05** | Production must be HTTPS-only with a valid certificate. | Mixed content and cookie failures; browsers warn users away. | Fetch `http://` → assert redirect; assert HSTS header present. | "The padlock means visitors' traffic is encrypted. I check it's on." | **warn** |
| **D-06** | Every deploy must have a rollback path (previous deployment or a tagged commit). | Without it, a bad deploy is an outage with no exit. | Record deployment id/commit at deploy time in `.fence/state/deploys.json`; `fence rollback` re-promotes the previous one. | "Every version you publish can be undone in one step." | **block** (no deploy without a recorded previous) |
| **D-07** | Database migrations must be backed up or reversible before running against production. | Irreversible schema change = data loss. | Require a backup command to have run in the same session; refuse `migrate` otherwise. | "Changing the database can't always be undone, so I take a copy first." | **block** |

---

## 4. Project hygiene (H-rules)

| ID | Rule | Failure if ignored | Auto-enforcement | Teach the user | Severity |
|---|---|---|---|---|---|
| **H-01** | One documented way to run the project (`npm run dev`), recorded in the repo. | The user (and the agent) cannot reproduce the app. | Assert `scripts.dev` exists; `fence init` adds it if missing. | "One command starts your app — it's written down so nobody has to guess." | **warn** |
| **H-02** | Source lives in a predictable place; no business logic in the entry file. | Agent edits land in the wrong file; everything becomes one 2,000-line file. | Heuristic file-size and fan-in check; flag entry files over N lines. | "Keeping code in named places means changes go where you expect." | **nudge** |
| **H-03** | Dependencies are pinned and unused ones removed. | Unpinned versions drift; unused packages enlarge the attack surface. | Lockfile present + `depcheck` for unused. | "Every package you keep is code you're trusting. I remove the ones you don't use." | **warn** |
| **H-04** | A README states what the app is, how to run it, and what it needs. | Handover and self-recovery both fail. | Check for README with three sections; `fence init` scaffolds it. | "A short README is how future-you remembers how this works." | **nudge** |
| **H-05** | Type checking and lint must pass. | Errors surface at runtime, in front of users. | `tsc --noEmit` / `eslint` in `fence check`. | "The checker catches mistakes before your visitors do." | **warn** |
| **H-06** | Tests must not be deleted or skipped to make CI pass. | Removing the check destroys the only evidence the app works. | Diff check: fail if test files lose assertions or gain `.skip`/`.only` alongside a red run. | "Deleting a failing test doesn't fix the bug — it just hides it. I won't do that." | **block** |

---

## 5. Data & privacy (P-rules)

| ID | Rule | Failure if ignored | Auto-enforcement | Teach the user | Severity |
|---|---|---|---|---|---|
| **P-01** | Collect the minimum personal data; every collected field must have a stated use. | Extra fields are liability with no benefit. | Schema review for fields matching PII patterns (email, phone, address, DOB, government id). | "Every piece of personal information you store is something you have to protect." | **nudge** |
| **P-02** | Analytics and third-party scripts must not load before consent where consent is required. | GDPR/ePrivacy exposure; also a privacy harm independent of law. | Detect analytics scripts in the entry HTML; assert they are gated behind a consent check. | "Tracking isn't allowed to start until the visitor says yes." | **warn** |
| **P-03** | A privacy policy must exist if personal data is collected. | Required in most jurisdictions; users can't exercise rights without it. | Route/page existence check when PII fields are detected. | "If you collect information about people, you have to say what you do with it." | **nudge** |
| **P-04** | PII must not be logged. | Logs are copied, shipped to third parties, and retained. | Grep for `console.log` with variables named like PII near a request handler. | "Logs get copied everywhere — personal details shouldn't be in them." | **warn** |
| **P-05** | Deletion must be possible: a user's data can be removed without a manual database edit. | "Right to erasure" is unmeetable, and mistakes are permanent. | Presence check for a documented delete path per user-owned table. | "People can ask you to delete their information — there should be a way to do it." | **nudge** |

---

## 5b. Rule → source map

Every rule above cites by `S-id`; each id resolves to a URL and an access date in the **Sources** table at the end of this file. The map is kept separate so the rule tables stay readable.

| Rule | Source(s) | Rule | Source(s) |
|---|---|---|---|
| S-01 | S-03 (secret scanning / push protection) | G-01 | S-11 (repo/CI practice) |
| S-02 | S-03 | G-02 | S-03 |
| S-03 | S-01 (OWASP A02/A05 misconfiguration), S-07 | G-03 | S-11 |
| S-04 | S-01 (A02), S-09 (LLM: insecure output handling) | G-04 | S-11 |
| S-05 | S-08 (npm), S-11 (supply chain) | G-05 | S-11 |
| S-06 | S-01 (A06), S-08 (`npm audit`) | G-06 | S-04 (Actions secure use) |
| S-07 | S-08, S-11 | G-07 | S-04 |
| S-08 | S-01 (A07), S-07 (cookie attributes) | G-08 | S-08, S-11 |
| S-09 | S-01 (A03), S-02 (ASVS injection controls) | D-01 | S-05 (Vercel env vars) |
| S-10 | S-01 (A03), S-10 (third-party/cookie context) | D-02 | S-06 (environments) |
| S-11 | S-07 (SameSite), S-02 | D-03 | S-06 |
| S-12 | S-02 (ASVS), S-01 (A05) | D-04 | S-11 |
| S-13 | S-01 (A03), S-02 | D-05 | S-02 (ASVS transport) |
| S-14 | S-01 (A10 SSRF) | D-06 | S-11 |
| S-15 | S-01 (A05), S-02 | D-07 | S-02 (ASVS data protection) |
| H-01 | S-11 | P-01 | S-13 (GDPR data minimisation) |
| H-02 | S-12 (context-file hygiene) | P-02 | S-13, S-10 (third-party cookies) |
| H-03 | S-08, S-11 | P-03 | S-13 |
| H-04 | S-12 | P-04 | S-13, S-02 |
| H-05 | S-02, S-11 | P-05 | S-13 |
| H-06 | S-11, S-02 | — | — |

---

## 6. Severity calibration — the rule behind the table

The severities above are not a taste judgement; they follow one decision procedure, and the harness should apply it automatically to rules added later:

```
deterministic_check_exists?
├── no  → nudge  (never a gate; teaching card or drop)
└── yes → irreversible_or_high_blast_radius?
          ├── yes → block   (run before the action; failure stops it)
          └── no  → warn    (fix now or in the next digest; checkpoint exists)
```

Three corollaries that matter more than the table itself:

1. **A block must be self-healing where possible.** `G-01`, `G-02` and `S-01` are blocks *because* the fence can fix them without asking (init git, write `.gitignore`, move the key to `.env`). A block the user has to resolve manually is a prompt, and prompts belong in turbo's gate budget (stream 05, U-02).
2. **Never block on a judgement call.** "Variable names should be descriptive" has no verdict; rendered as a blocking dialog it teaches the user to click through, which costs the credibility of `S-01` next to it.
3. **Escalate with evidence, not urgency.** A new `block` requires a demonstrated failure in the adversarial suite (stream 03, implication 13) — otherwise the rule set accretes and the fence becomes the thing users disable.

---

## 7. Teachable explanations: the writing constraint

Every rule needs one sentence a non-technical person can act on, and the sentence must answer **what happens to me**, not **what the rule is**. The pattern that works across all 26:

> **Consequence in the user's world → what the fence did → what (if anything) they must decide.**

Examples, taken from the table:
- `S-01`: "A key in the repo is a key on the internet. I moved it to `.env`, which stays on your machine." (no decision)
- `S-06`: "One of the building blocks has a known hole. There's a newer version that fixes it — I can update it." (one decision)
- `D-07`: "Changing the database can't always be undone, so I take a copy first." (no decision)

What to avoid: the word "vulnerability" without a consequence; CVE numbers in the main line (they belong in the expand view); and any sentence that begins "It is best practice to…". Those are all agent-facing, and this channel is user-facing (stream 01, H-12).

---

## 8. Implementation order (highest incident-prevention per unit of work)

| Order | Rules | Why first |
|---|---|---|
| 1 | `S-01`, `S-02`, `G-01`, `G-02` | Secrets + git init. The two failures that cannot be undone by editing code. All four are self-healing, so they ship as a single `fence init` pass |
| 2 | `D-04`, `D-06`, `H-05` | Build gate + rollback + typecheck. This is the "it works and can be undone" promise |
| 3 | `S-03`, `S-05`, `S-07`, `S-06` | The agent-specific supply-chain set: public env prefixes, install scripts, typosquats, advisories |
| 4 | `H-06`, `G-03` | Protect the verification loop and the history — the two things agents break when they're "helpful" |
| 5 | `S-08`–`S-15` | Auth, injection, XSS/CSRF, CSP, SSRF, error leakage. Higher skill to implement, lower frequency in beginner apps |
| 6 | `D-01`–`D-03`, `D-05`, `D-07` | Deploy environment separation and migration safety |
| 7 | `P-01`–`P-05` | Privacy. Mostly nudges; valuable for the demo narrative, lowest incident rate |

---

## 9. Gaps / unknowns

1. **No measured data on which guardrail failures actually occur in vibe-coded apps.** The priorities above are derived from vulnerability-class frequency in the broader web (OWASP), not from a corpus of beginner projects. That corpus does not appear to exist publicly.
2. **`S-07` (typosquat distance) has no authoritative threshold.** Edit distance ≤2 plus homoglyph normalisation is my heuristic; npm's own protections are partial and undocumented at this level of detail.
3. **`D-02`/`D-03` are Vercel-specific** in enforcement even though the rule generalises. Netlify/Cloudflare would need their own checks; I verified only Vercel's documentation.
4. **Privacy rules are jurisdiction-dependent.** I deliberately wrote GDPR-shaped rules without citing article numbers, because a solo project's obligations depend on scale and location, and a wrong citation is worse than a general rule. The official text is at https://gdpr-info.eu/ (accessed 2026-10-20) for anyone implementing the real check.
5. **`P-02` (consent gating) is not cleanly checkable** in the general case — script injection order is dynamic. Detection will have false positives; it is `warn` for that reason.
6. **No data on false-positive rates** for any of these checks on agent-written code, which is the population that matters. `gitleaks` and `npm audit` are tuned on human code.
7. **A11y is absent from this catalogue** — axe-core exists and is checkable (`H-05`-class), but accessibility was not in the prompt's five categories. It should probably be an `H` rule in the final set; flagging rather than smuggling it in.
8. **The catalogue does not cover infrastructure** (DNS, TLS config, CDN, WAF) — a beginner deploying to Vercel inherits most of it, and a beginner deploying to a VPS is outside this stream's scope.

---

## Sources

| # | Source | Type | Accessed |
|---|--------|------|----------|
| S-01 | OWASP Top 10:2021 — https://top10.owasp.org/2021/ | standard | 2026-10-20 |
| S-02 | OWASP ASVS — https://owasp.org/projects/asvs | standard | 2026-10-20 |
| S-03 | GitHub Docs, *Secret scanning* / push protection — https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning and https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enable-push-protection | docs | 2026-10-20 |
| S-04 | GitHub Docs, *Secure use reference* (Actions permissions) — https://docs.github.com/en/actions/reference/security/secure-use | docs | 2026-10-20 |
| S-05 | Vercel Docs, *Environment variables* — https://vercel.com/docs/environment-variables | docs | 2026-10-20 |
| S-06 | Vercel Docs, *Managing environment variables across environments* — https://vercel.com/docs/environment-variables/manage-across-environments | docs | 2026-10-20 |
| S-07 | MDN, *Set-Cookie* (SameSite, Secure, HttpOnly) — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie | docs | 2026-10-20 |
| S-08 | npm Docs, *npm-audit* — https://docs.npmjs.com/cli/v9/commands/npm-audit/ | docs | 2026-10-20 |
| S-09 | OWASP Top 10 for LLM Applications 2025 — https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/ | standard | 2026-10-20 |
| S-10 | MDN, *Third-party cookies* — https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies | docs | 2026-10-20 |
| S-11 | GitHub Docs, *Dependabot pull requests* (lockfile/CI hygiene context) — https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-pull-requests | docs | 2026-10-20 |
| S-12 | Chatlatanagulchai et al., *Agent READMEs*, arXiv:2511.12884 (security specified in 14.8% of context files) — https://arxiv.org/abs/2511.12884 | paper | 2026-10-20 |
| S-13 | GDPR full text (reference for P-rules) — https://gdpr-info.eu/ | primary text | 2026-10-20 |

---

## Implications for vibe-fence

1. **Ship the four self-healing blocks first** (`S-01`, `S-02`, `G-01`, `G-02`) inside `fence init`. They are the only rules that are both irreversible-if-missed and fixable without asking — the highest value per line of code in the whole product.
2. **Adopt the severity algorithm, not the table.** `no check → nudge; check + irreversible → block; check + reversible → warn`. Encode it as a function so new rules cannot be assigned severity by vibes.
3. **Every rule ships as a triple** `{rule, check command, teach sentence}` in one file, so the skill, the hook and the teaching card are generated from a single source of truth (stream 01, H-10).
4. **Never block on a judgement rule.** If it cannot return a verdict, it is a teaching card. Blocking opinions is how the fence loses the authority it needs for `S-01`.
5. **Prefer prevention to detection for secrets.** Push protection is the industry direction (S-03); the fence's pre-commit hook should be the local equivalent, and it must run before the first commit, not after.
6. **Make `.env` handling invisible.** The fence writes `.env.example`, adds `.env` to `.gitignore`, moves detected keys out, and prints one line. No options, no prompt (stream 05, O-05).
7. **Keep `npm ci --ignore-scripts` as the default install path** and surface a one-line diff when a package genuinely needs scripts (`S-05`). This is a silent default, not a gate — it never asks.
8. **Gate deploys on three things only:** build passes (`D-04`), a recorded previous deployment exists (`D-06`), and required env keys are present (`D-01`). Those are the user-judgeable, irreversible conditions where a prompt is legitimate (stream 05, "three-condition gate test").
9. **Treat "delete the failing test" as a first-class attack** on the fence's own evidence chain (`H-06`), and block it. It is the single most likely agent shortcut in a beginner project.
10. **Write the teach sentence before the check.** If the sentence cannot be written without jargon, the rule is not ready to ship — this is a useful forcing function and it keeps the user-facing channel honest (stream 01, H-12).
11. **Publish the coverage limits** (no A04/A09, no infra) in the README. Overstating coverage is the one failure mode that invalidates every other rule (stream 05, A-04).
12. **Instrument the checks:** count blocks/warns/nudges per session per rule. A rule that never fires is dead weight; a rule that always fires is mis-calibrated. Both should be visible in the demo metrics (stream 05, implication 23).
13. **Add accessibility as `H-07` before Phase 1 closes** (`npx axe` against the built page, `warn` severity). It is checkable, it matters for the "real domain problem" theme, and it is currently a hole in this catalogue.
14. **Defer to synthesis:** the exact severity split between `block` and `warn` for `S-06` (advisories). Critical-only blocking produces far fewer interruptions but lets "high" ship; the right answer depends on how the demo measures trust, and the evidence does not decide it.
