# Stream 04: Developer Guardrails (Rights & Wrongs) — Muse Spark

> **Model:** muse-spark · **Provider:** Meta via Hermes (ollama-launch) · **Date:** 2026-10-20 · **Stream:** 04
> **Strength tags:** `proven` = paper/eval or spec-backed · `practiced` = widely adopted & documented · `contested` = debated / context-dependent

---

## How to read this document

For **each guardrail** you get:

| Field | Meaning |
|---|---|
| **Rule** | One-line normative "do / don't" |
| **Why** | Concrete failure when ignored |
| **Severity** | `block` = must not ship without · `warn` = fix soon · `nudge` = nice-to-have |
| **Enforcement** | How the harness enforces it (scaffold default, lint rule, pre-commit hook, CI check, runtime guard) |
| **Teach** | One line a non-technical user can understand |
| **Source** | Authoritative URL + accessed date |

Severity is from the **harness** perspective (what it blocks the agent from doing), not a generic risk rating.

---

## 1 · Security

The OWASP Top 10:2025 puts **Broken Access Control (A01)** back at #1 (3.7% of tested apps affected across 40 CWEs) and promotes **Security Misconfiguration (A02)** from #5 to #2 — misconfiguration now hits 3.0% of apps. **Supply-Chain Failures (A03)** is newly elevated to #3, matching this document's structure.

### 1.1 Broken Access Control & Auth (OWASP A01, A07)

#### S-01 · Enforce server-side authorization on every protected route/API

- **Why:** An unauthenticated `fetch('/api/admin/users')` returning data is the #1 web-app risk; client-only checks are bypassable.
- **Severity:** `block`
- **Enforcement:** Scaffold middleware (`auth.ts` / Next.js `proxy.ts` / `middleware.ts`) that defaults to deny; CI check: every `route.ts` / API handler must import the auth guard or be listed in an explicit `publicRoutes` allowlist; failing the check blocks `vercel --prod`.
- **Teach:** "Every page that needs a login must actually check for it on the server — not just hide the button."
- **Source:** OWASP Top 10:2025 A01 — Broken Access Control — https://top10.owasp.org/2025/ — accessed 2026-10-20 · OWASP ASVS 4.0 §4 Access Control (`practiced`).

#### S-02 · Never accept JWT `alg: none`; validate `exp`, `aud`, `iss`; prefer RS256 over HS256

- **Why:** `none`-algorithm bypass, algorithm-confusion (HS256 vs RS256 key confusion), and never-expiring tokens are classic JWT breakages that give full account takeover.
- **Severity:** `block`
- **Enforcement:** Scaffold helper `verifyJWT(token, { algorithms: ['RS256'], audience, issuer })` that allowlists algs; ESLint rule flags `jwt.verify` without `algorithms` option; no `none` in allowlist.
- **Teach:** "A login ticket must be signed with a strong key, have an expiry, and say who it's for — otherwise anyone can forge one."
- **Source:** OWASP JWT Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html — accessed 2026-10-20 (`proven`).

#### S-03 · OAuth/PKCE: validate `state`, whitelist `redirect_uri`, never expose client secret in frontend

- **Why:** Missing `state` enables CSRF login; open redirect_uri lets attackers steal authorization codes; leaked client secret compromises the whole IdP integration.
- **Severity:** `block`
- **Enforcement:** Scaffold OAuth helper that generates cryptographically random `state` + PKCE `code_verifier`; rejects mismatched callbacks; `redirect_uri` is env-configured and allowlisted; ESLint `no-restricted-syntax` bans `client_secret` in `app/` client components.
- **Teach:** "When you log in with Google, the app must double-check the reply really came from Google and not an impostor."
- **Source:** OWASP Authentication Cheat Sheet + OAuth 2.0 Security BCP (RFC 6819 / RFC 8252 PKCE) — https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html — accessed 2026-10-20 (`proven`); Clerk auth-security guide — https://clerk.com/articles/authentication-security-in-web-applications — accessed 2026-10-20.

#### S-04 · Session cookies: `HttpOnly` + `Secure` + `SameSite=Lax` (or Strict), regenerate on login, invalidate server-side on logout

- **Why:** Missing flags allow cookie theft via XSS or network sniffing; fixation and stale sessions enable hijack.
- **Severity:** `block`
- **Enforcement:** Scaffold `setSessionCookie()` that sets all three flags; framework default (NextAuth/Auth.js already does this); CI header audit or `next.config.js` `headers()` + cookie-setter lint.
- **Teach:** "Your login cookie is locked so other sites and scripts can't steal it — and it changes every time you log in."
- **Source:** OWASP Session Management Cheat Sheet (via OWASP Top 10 A07 references) — https://top10.owasp.org/2025/ — accessed 2026-10-20 · OWASP Node.js Cheat Sheet § Server Security — https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html — accessed 2026-10-20.

### 1.2 Injection — Parameterize, Never Concatenate (OWASP A05)

#### S-05 · All DB queries must be parameterized / prepared statements; never string-concatenate user input into SQL

- **Why:** `SELECT * FROM users WHERE id = '${input}'` with `1' OR '1'='1` dumps the whole table.
- **Severity:** `block`
- **Enforcement:** Scaffold uses an ORM / query builder (Prisma, Drizzle, `pg` parameterized `$1`) that makes raw concatenation awkward; ESLint `no-restricted-syntax` or Semgrep rule `javascript.lang.security.audit.sqli` flags template-literal SQL containing `${}`; CI DB integration tests include injection probes.
- **Teach:** "We never paste what you typed directly into a database question — we put it in a safe envelope first."
- **Source:** OWASP SQL Injection Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html — accessed 2026-10-20 (`proven`); OWASP Query Parameterization Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html — accessed 2026-10-20.

#### S-06 · Validate and allowlist any user input that becomes table/column names, sort keys, or file paths

- **Why:** Prepared statements don't cover identifiers or paths — `?sort=${userInput}` or `readFile(userInput)` enables injection/traversal.
- **Severity:** `block`
- **Enforcement:** Utility `assertAllowed(value, ALLOWED_COLUMNS)` pattern; Semgrep rule for `orderBy` / `fs.readFile` with tainted input; runtime guard throws on mismatch; teachable queue item auto-created by harness when it sees dynamic identifiers.
- **Teach:** "If your app lets people sort or pick a file, we only allow choices from a pre-approved list."
- **Source:** OWASP Injection Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html — accessed 2026-10-20.

#### S-07 · Validate all input on the server with a schema (e.g., Zod); client validation is UX, not security

- **Why:** Client-side `required` / regex is bypassed by `curl`; missing server validation allows type confusion, oversized payloads, SSRF.
- **Severity:** `block`
- **Enforcement:** Scaffold: Zod (or Valibot) schema per route, called before handler logic; ESLint/knip check that every POST/PUT/PATCH handler imports a schema validator; `body-parser` limits set.
- **Teach:** "The server double-checks everything — the form checks are just for convenience, not security."
- **Source:** OWASP Input Validation Cheat Sheet (referenced via OWASP ASVS 5.1) — https://top10.owasp.org/2025/ — accessed 2026-10-20 (`practiced`).

### 1.3 XSS & CSRF (OWASP A01/A02 via frontend)

#### S-08 · Never render unsanitized user HTML; use framework auto-escaping; sanitize rich HTML with DOMPurify; escape in correct context

- **Why:** `<div>{userBio}</div>` is safe in React/Next.js (auto-escaped) but `dangerouslySetInnerHTML` with user content executes arbitrary JS.
- **Severity:** `block`
- **Enforcement:** ESLint `react/no-danger` (warn/error) except allowlisted files that pipe through `DOMPurify.sanitize()` (server via `jsdom`); for non-React contexts follow OWASP XSS Prevention per-output context table. Pre-commit grep for `dangerouslySetInnerHTML` without sanitize.
- **Teach:** "If someone writes a bio with sneaky code in it, we scrub it clean before showing it to anyone."
- **Source:** OWASP XSS Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html — accessed 2026-10-20 (`proven`); OWASP Node.js Cheat Sheet § output escaping — https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html — accessed 2026-10-20.

#### S-09 · Set a strict Content-Security-Policy (no `unsafe-inline`/`unsafe-eval`); use nonces or hashes for required inline scripts

- **Why:** CSP is the browser's last line against XSS — it blocks injected scripts even when escaping fails.
- **Severity:** `warn` (v0: `warn`, v1: `block`)
- **Enforcement:** `next.config.ts` `headers()` for static CSP + `proxy.ts` (Next.js 15.5+) / `middleware.ts` for per-request nonce generation (`crypto.randomUUID()` → base64); `script-src 'self' 'nonce-…'`; progressive: start `Content-Security-Policy-Report-Only` then enforce.
- **Teach:** "We give the browser a guest list — only scripts from places we approve are allowed to run."
- **Source:** Vercel CSP docs — https://vercel.com/docs/cdn-security/security-headers — accessed 2026-10-20; Next.js CSP guide — https://nextjs.org/docs/app/guides/content-security-policy — accessed 2026-10-20; MDN CSP — https://developer.mozilla.org/docs/Web/HTTP/CSP — accessed 2026-10-20 (`proven`).

#### S-10 · Enable baseline security headers (HSTS, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy)

- **Why:** Without them: clickjacking, MIME-sniffing, referrer leakage, and HTTP downgrade are all possible even with correct app code.
- **Severity:** `warn`
- **Enforcement:** `next.config.ts` `headers()` template applied to `/(.*)` — see implementation packet in table; CI header check in build (e.g., `security-headers` check via `curl -I` or dependency `next-safe`).
- **Teach:** "Extra locks on every page — we tell browsers to always use HTTPS and never let others frame your site."
- **Source:** Vercel production checklist § Security — https://vercel.com/docs/production-checklist.md — accessed 2026-10-20; Next.js security-headers guides — https://nextjs.org/docs/app/guides/content-security-policy — accessed 2026-10-20.

> **Scaffold packet (copy-ready):**
> ```ts
> // next.config.ts
> const securityHeaders = [
>   { key: 'X-Content-Type-Options', value: 'nosniff' },
>   { key: 'X-Frame-Options', value: 'DENY' }, // or CSP frame-ancestors 'none'
>   { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
>   { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
>   { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
>   { key: 'X-DNS-Prefetch-Control', value: 'on' },
> ];
> // CSP: set dynamically via proxy.ts / middleware.ts with per-request nonce (see S-09)
> ```

#### S-11 · All state-changing requests must carry a CSRF token (synchronizer pattern for cookie-auth) or use SameSite + custom header for API-only auth

- **Why:** An attacker site can silently POST to `yoursite.com/api/delete-account` using the victim's cookie if no CSRF defense exists.
- **Severity:** `block` (cookie-auth apps) · `warn` (token-header APIs, where custom header + CORS already helps)
- **Enforcement:** Scaffold CSRF middleware (Next.js: `nextjs-csrf` or custom double-submit cookie) that issues per-session token and validates on POST/PUT/PATCH/DELETE; framework default if available; linter warns on cookie-auth mutation handlers without CSRF check.
- **Teach:** "Changing something (delete, buy, update) needs a secret handshake — so another site can't trick your browser into doing it."
- **Source:** OWASP CSRF Prevention Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html — accessed 2026-10-20 (`proven`).

### 1.4 Secrets Handling (OWASP A02/A04)

#### S-12 · Never commit `.env`, keys, tokens, or certs — ever; use `.gitignore` + `.env.example` before first commit

- **Why:** A leaked secret in git history is public forever; even private repos leak via forks, clones, and copy-paste.
- **Severity:** `block`
- **Enforcement:** Scaffold `.gitignore` includes `.env`, `.env.*`, `*.pem`, `*.key` before first commit; ships `.env.example` with placeholder values; `gitleaks` pre-commit hook; GitHub Push Protection enabled; CI fails if `.env` is tracked (`git ls-files | grep -q "^\.env$"` → fail).
- **Teach:** "Keys live in a locked drawer (environment variables), never in the notebook (your code) — so sharing your code doesn't share your passwords."
- **Source:** OWASP DevSecOps — Secrets Management — https://owasp.github.io/DevSecOpsGuideline/2-Process/2-2-Develop/2-2-1-Pre-commit/2-2-1-2-Secrets-Management/ — accessed 2026-10-20; GitHub Push Protection docs (via Gitleaks project) — https://github.com/gitleaks/gitleaks — accessed 2026-10-20 (`practiced`).

#### S-13 · Pre-commit secret scanning (gitleaks) + GitHub Push Protection both enabled

- **Why:** One layer misses patterns; defense-in-depth catches what the other doesn't.
- **Severity:** `block` (new projects) · `warn` (existing)
- **Enforcement:** `.pre-commit-config.yaml` with `gitleaks` hook; harness `install` command runs `pre-commit install`; docs tell user to enable Push Protection in GitHub Settings → Code security.
- **Teach:** "Two different guards check every save — one on your computer, one on GitHub — so a secret can't slip out."
- **Source:** Gitleaks — https://github.com/gitleaks/gitleaks — accessed 2026-10-20; OWASP DevSecOps Secrets guideline — https://owasp.github.io/DevSecOpsGuideline/2-Process/2-2-Develop/2-2-1-Pre-commit/2-2-1-2-Secrets-Management/ — accessed 2026-10-20.

#### S-14 · If a secret was committed: rotate first, then untrack, then scrub history — in that order

- **Why:** Scrubbing history without rotating leaves the key valid in every clone/fork/cache; rotate is the only real fix.
- **Severity:** `block` (when detected)
- **Enforcement:** Harness incident checklist (auto-opened structured issue): 1) rotate/revoke, 2) `git rm --cached` + `.gitignore`, 3) BFG/`git filter-repo` scrub + force-push note; user is walked through step 1 with provider-specific instructions.
- **Teach:** "If a key leaked, we get you a new key first — erasing the old one from history comes after."
- **Source:** GitHub secret-scanning remediation guidance (via Gitleaks docs) — https://github.com/gitleaks/gitleaks — accessed 2026-10-20.

### 1.5 Dependency & Supply-Chain Security (OWASP A03/A06)

#### S-15 · Commit the lockfile; install in CI with `npm ci` / `pnpm --frozen-lockfile`; never `npm install` in CI

- **Why:** Without a lockfile each install can pull different transitive versions — including a just-compromised one; `npm install` silently mutates the lockfile in CI.
- **Severity:** `block`
- **Enforcement:** Scaffold commits `package-lock.json` / `pnpm-lock.yaml`; CI script uses `npm ci`; lint: CI workflow must not contain bare `npm install` (grep check); `.gitignore` must NOT ignore lockfiles.
- **Teach:** "We freeze your ingredients list so every build uses exactly the same safe versions."
- **Source:** npm audit / lockfile best practices — https://safeguard.sh/resources/blog/best-practices-for-npm-lockfile-security-2026 — accessed 2026-10-20; Frontend Checklist — dependency audit — https://frontendchecklist.io/rules/security/dependency-audit — accessed 2026-10-20 (`practiced`).

#### S-16 · Automated vuln scanning in CI (`npm audit` / `pnpm audit` + Dependabot or Renovate + OSV/Socket for supply-chain signals)

- **Why:** CVEs are published daily; without continuous scanning a clean install goes stale.
- **Severity:** `block` for `critical`/`high` fixable CVEs · `warn` for `moderate`
- **Enforcement:** CI job `npm audit --audit-level=high` (fails build on high+); Dependabot config `.github/dependabot.yml` (weekly npm grouping) or `renovate.json`; optional Socket/GitHub Advanced Security code scanning for install-script/behavioral signals; `npm audit signatures` where available.
- **Teach:** "We automatically check your ingredients for recalls every week — high-risk ones block the release."
- **Source:** GitHub Dependabot docs — https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates — accessed 2026-10-20; Frontend Checklist — https://frontendchecklist.io/rules/security/dependency-audit — accessed 2026-10-20; Safeguard lockfile security — https://safeguard.sh/resources/blog/best-practices-for-npm-lockfile-security-2026 — accessed 2026-10-20.

#### S-17 · Pin exact versions for security-sensitive deps; review `postinstall` scripts and lockfile diffs in PRs

- **Why:** Semver ranges + install scripts are the compromise vector (recent npm supply-chain attacks used `postinstall` to exfiltrate); large lockfile diffs hide injected deps.
- **Severity:** `warn`
- **Enforcement:** `.npmrc` `save-exact=true` (or pnpm equivalent) for selected packages; CI `lockfile-lint --validate-https --validate-integrity`; PR template reminds reviewer to inspect lockfile diff; `npm audit signatures` in CI.
- **Teach:** "We lock the really important parts to an exact version and flag anything suspicious in updates."
- **Source:** CISA npm supply-chain guidance (Sept 2025) via — https://blog.cyberdesserts.com/npm-security-vulnerabilities/ — accessed 2026-10-20; Safeguard — https://safeguard.sh/resources/blog/best-practices-for-npm-lockfile-security-2026 — accessed 2026-10-20 (`contested` on auto-pin strictness — Renovate vs exact pin is debated).

#### S-18 · Remove unused/duplicated deps (`depcheck`, `npm dedupe`); prefer fewer deps

- **Why:** Every extra dependency is attack surface and bundle weight; unused deps still get audited and still have CVEs.
- **Severity:** `nudge` (becomes `warn` if dep has known CVE)
- **Enforcement:** Periodic `depcheck` CI job (non-blocking) + harness queue item when a new dep is added that is never imported (knip); docs advise minimal-dependency mindset.
- **Teach:** "If we're not using it, we remove it — fewer parts means fewer things that can break."
- **Source:** NSF study on npm best-practice adherence — https://par.nsf.gov/servlets/purl/10398646 — accessed 2026-10-20 (`practiced`).

### 1.6 Data-layer & Transport

#### S-19 · DB access uses a least-privilege connection (app role ≠ owner/superuser); no direct client→DB; row-level security where applicable

- **Why:** Superuser DB creds in the app mean any injection or leak grants full DB control; client-side DB SDK keys can be extracted.
- **Severity:** `block`
- **Enforcement:** Scaffold: env var is the app-role connection string, never the admin DSN; docs show Supabase/Neon/Vercel Postgres least-privilege setup; ESLint bans direct `SUPABASE_SERVICE_ROLE` / `DATABASE_URL_ADMIN` in client bundles; RLS policies required for multi-tenant tables.
- **Teach:** "The app gets a key that can only do what it needs — not the master key to everything."
- **Source:** OWASP Top 10:2025 A01 — Broken Access Control (DB access control variant) — https://top10.owasp.org/2025/ — accessed 2026-10-20.

#### S-20 · All traffic over HTTPS; HSTS with `includeSubDomains`; no mixed content; reject plain HTTP

- **Why:** Plain HTTP leaks cookies, tokens, and PII on the wire.
- **Severity:** `block`
- **Enforcement:** Vercel enforces HTTPS by default + auto-provisions certificates; `next.config.ts` adds HSTS header (see S-10 packet); scaffold warns if user adds custom HTTP-only domain config.
- **Teach:** "Every connection is encrypted — like sending a sealed letter instead of a postcard."
- **Source:** Vercel production checklist — https://vercel.com/docs/production-checklist.md — accessed 2026-10-20; MDN HSTS — https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security — accessed 2026-10-20.

---

## 2 · Git & GitHub Hygiene

### 2.1 Repository bootstrap

#### G-01 · Create `.gitignore` before the first commit (`.env`, build artifacts, OS/editor noise)

- **Why:** Adding `.gitignore` after files are already tracked does NOT untrack them (`git rm --cached` required). Secrets and `node_modules` committed on day one live in history forever.
- **Severity:** `block`
- **Enforcement:** Harness `init` writes `.gitignore` (template: `.env`/`.env.*`, `!.env.example`, `node_modules`, `dist`, `.next`, `.vercel`, `.DS_Store`, `Thumbs.db`, IDE dirs) before `git init`/`git add`; CI `git check-ignore --no-index .env.example` sanity negative.
- **Teach:** "We set up the ignore list before anything is saved — so secrets and clutter never accidentally get shared."
- **Source:** GitHub .gitignore best practices — https://github.com/Kubomu/Best-Practices-for-Version-Control-GIT/blob/main/security-best-practices.md — accessed 2026-10-20; Git gitignore docs (via community) — https://github.com/kajisho5/ffmpeg-skill/blob/008333aaf6722083392eb6bd8bd67b59884a2a26/.claude/skills/git-hygiene/SKILL.md — accessed 2026-10-20.

#### G-02 · Use a global `core.excludesFile` for per-developer scratch files

- **Why:** Personal temp files don't belong in the project's `.gitignore` — they pollute PRs.
- **Severity:** `nudge`
- **Enforcement:** Harness docs suggest `git config --global core.excludesFile ~/.gitignore_global`; not enforced in repo.
- **Teach:** "Your personal doodles stay on your machine — they don't clutter the shared project."
- **Source:** Git config docs (via GitHub hygiene guide) — https://github.com/Kubomu/Best-Practices-for-Version-Control-GIT/blob/main/security-best-practices.md — accessed 2026-10-20.

### 2.2 Branching & commits

#### G-03 · `main` is always deployable; all work on short-lived feature branches (`feat/`, `fix/`, `chore/`); no long-lived divergence

- **Why:** Long branches rot and merge painfully; for solo dev `main` as source-of-truth keeps deploys simple and matches Vercel's production-branch model.
- **Severity:** `warn`
- **Enforcement:** Scaffold docs + starter `CONTRIBUTING.md`; CI can warn if a feature branch is >14 days old (`git log --since`); Vercel production branch = `main` by default; for solo dev GitHub Flow (or trunk-based with direct-to-main + CI) is recommended — Git Flow is overkill.
- **Teach:** "One main road that's always safe to drive; side paths merge back quickly."
- **Source:** Git Workflow Guide (solo → team) — https://articles.usulnet.com/articles/git-workflow-guide — accessed 2026-10-20; Solo-dev GitHub guide — https://zenn.dev/nawa_10half/articles/solo-dev-git-github-minimal-guide?locale=en — accessed 2026-10-20 (`practiced`).

#### G-04 · Atomic commits, Conventional Commits (`feat:`, `fix:`, `chore:`…); never force-push shared branches

- **Why:** `fix stuff` commits break `git blame`, `git revert`, changelog generation, and semantic-release; force-push on `main` can lose work.
- **Severity:** `warn` (block `force-push to main` via branch protection)
- **Enforcement:** `commitlint` + Husky pre-commit on `commit-msg`; PR template reminds; GitHub branch protection: require PR, disallow force-push on `main`; if force-push needed on feature branch, require `--force-with-lease`.
- **Teach:** "Each save has a clear label — so we can undo one piece without undoing everything."
- **Source:** Conventional Commits — https://www.conventionalcommits.org/ — accessed 2026-10-20 (via Git Commit Standards — https://www.jarredbaker.com/developer-hub/styling-guides/git-standards — accessed 2026-10-20); GitHub branch protection docs (referenced ibid.) (`practiced`).

#### G-05 · Sign important commits/tags where feasible; review diffs before committing

- **Why:** Verifies author identity; prevents accidental commit of debug code/credentials.
- **Severity:** `nudge` (solo hobby) · `warn` (production/collab)
- **Enforcement:** Docs recommend GPG/SSH signing (`git config commit.gpgsign true`); Husky reminder is overkill for v0 — nudge only.
- **Teach:** "Signing is like a wax seal — it proves who really wrote it."
- **Source:** GitHub security hygiene summary — https://github.com/Kubomu/Best-Practices-for-Version-Control-GIT/blob/main/security-best-practices.md — accessed 2026-10-20.

### 2.3 Pull-request & CI basics

#### G-06 · Even solo: open a PR for non-trivial changes so CI runs visibly; enable branch protection (require status checks)

Note: CI is especially valuable for solo dev — no reviewer exists, so automated tests are the only safety net.

- **Why:** Direct-to-`main` bypasses checks; an always-passing CI on every push is the solo-dev substitute for code review.
- **Severity:** `warn`
- **Enforcement:** GitHub branch protection: require `build`, `lint`, `test` checks pass before merge; harness CI template does this out of the box; solo dev may choose auto-merge for trivial chores but protection stays on.
- **Teach:** "Every change gets a quick safety test — your robot teammate checking your work."
- **Source:** Git Workflow Guide — https://dev.to/armorbreak/git-workflows-from-solo-to-team-2026-57lb — accessed 2026-10-20; Solo-dev GitHub CI hygiene — https://zenn.dev/nawa_10half/articles/solo-dev-git-github-minimal-guide?locale=en — accessed 2026-10-20.

#### G-07 · CI runs on every push and PR: `lint` + `typecheck` + `test` + `build`; Deployment Checks gate production (Vercel)

- **Why:** Without CI, broken builds ship; without gating, broken previews promote to prod.
- **Severity:** `warn` → `block` when Vercel Deployment Checks are configured (production hold until checks pass)
- **Enforcement:** GitHub Actions workflow (`.github/workflows/ci.yml`): `npm run lint && npm run typecheck && npm test && npm run build`; Vercel Deployment Checks set to require GitHub Checks — Vercel holds promotion until they pass; Force Promote is available but surfaced as a conscious override.
- **Teach:** "Before anything goes live, the computer builds it and runs the tests — only green means go."
- **Source:** Vercel Deployment Checks — https://vercel.com/docs/deployment-checks — accessed 2026-10-20; Vercel production checklist — https://vercel.com/docs/production-checklist.md — accessed 2026-10-20.

#### G-08 · Keep PRs small, titled clearly, with a description of what changed and why

- **Why:** A 2,000-line PR with no description is unreviewable and unrevertable.
- **Severity:** `nudge`
- **Enforcement:** PR template (`.github/pull_request_template.md`) with checkboxes (linked issue, screenshots for UI, no secrets, build passes); size nudge via `size:` label bot.
- **Teach:** "Small packages are easier to check — we keep changes bite-sized and labeled."
- **Source:** Git Commit Standards / PR hygiene — https://www.jarredbaker.com/developer-hub/styling-guides/git-standards — accessed 2026-10-20 (`practiced`).

---

## 3 · Deploy (Vercel-centric, generalizable)

### 3.1 Environments & env vars

#### D-01 · Env vars are scoped per environment (Production / Preview / Development); never reuse prod secrets in preview

- **Why:** A preview build logging an error can expose prod keys; preview environments are often publicly accessible.
- **Severity:** `block`
- **Enforcement:** Vercel dashboard distinguishes Production/Preview/Development scopes; harness `init` creates separate env entries and docs the flow; CI `vercel env pull --environment=production` sanity check ensures separation; scaffold warns on same-value reuse.
- **Teach:** "Your live keys stay only with the live site — test copies use test keys."
- **Source:** Vercel Environment Variables — https://vercel.com/docs/environment-variables — accessed 2026-10-20; Vercel manage-across-environments — https://vercel.com/docs/environment-variables/manage-across-environments — accessed 2026-10-20.

#### D-02 · Env var changes require a new deployment; sensitive values use `Sensitive` type

- **Why:** Updating a var without redeploying leaves the old deployment serving with stale config; sensitive vars must be write-only in the dashboard.
- **Severity:** `warn`
- **Enforcement:** Vercel already enforces this (new deploy required; Sensitive = write-only after save); harness shows a reminder banner when env vars are edited.
- **Teach:** "Changing a key doesn't fix the site already running — we need to redeploy so it picks up the new one."
- **Source:** Vercel Environment Variables — https://vercel.com/docs/environment-variables — accessed 2026-10-20.

#### D-03 · Preview deployments for every branch/PR; never develop against production data from a preview

- **Why:** Preview → prod data coupling risks data corruption and PII leakage; preview should be isolated.
- **Severity:** `warn`
- **Enforcement:** Vercel auto-creates preview deployments per branch by default; harness notes that preview env vars should point to staging DB; CI can flag if preview build resolves prod DB host.
- **Teach:** "Try it in the sandbox first — the sandbox has pretend data, not your real users' data."
- **Source:** Vercel Environments — https://vercel.com/docs/deployments/environments — accessed 2026-10-20; Vercel Deployments — https://vercel.com/docs/deployments — accessed 2026-10-20.

### 3.2 Build & release discipline

#### D-04 · Builds must pass locally before pushing; failed builds never promote; use Deployment Checks as a production hold

- **Why:** A broken build promoted to prod is a self-inflicted outage.
- **Severity:** `block`
- **Enforcement:** Local `npm run build` pre-push hook (optional); GitHub Actions build check; Vercel Deployment Checks hold production alias assignment until checks pass — Force Promote is logged and surfaced.
- **Teach:** "We build it first to make sure it compiles — only then do we put it in front of users."
- **Source:** Vercel Deployment Checks — https://vercel.com/docs/deployment-checks — accessed 2026-10-20.

#### D-05 · Know how to roll back: `vercel rollback` + promote a prior preview deployment; keep incident response basics in writing

- **Why:** Without a known rollback path, every incident becomes a scramble.
- **Severity:** `warn`
- **Enforcement:** Harness `RUNBOOK.md` template with `vercel rollback <id>` / `vercel promote <url>` commands; Vercel dashboard rollback documented; harness teaches rollback via structured fix queue if deploy fails post-promote.
- **Teach:** "If something goes wrong after going live, we have a one-button undo."
- **Source:** Vercel — Rolling back a production deployment — https://vercel.com/docs/deployments/rollback-production-deployment — accessed 2026-10-20; Promote-to-production guide — https://vercel.com/docs/deployments/promote-preview-to-production — accessed 2026-10-20; Production checklist § Operational excellence — https://vercel.com/docs/production-checklist.md — accessed 2026-10-20.

#### D-06 · Production checklist before first real launch: CSP, WAF/security headers, Deployment Protection, custom domain + SSL, error monitoring

- **Why:** Shipping without these is shipping a prototype to production with missing guardrails.
- **Severity:** `warn` (checklist is `block` for "public launch" milestone)
- **Enforcement:** Harness `preflight` command (or `validate.ts`) walks the checklist and reports; Vercel production checklist as canonical reference; each item is a `warn` that becomes `block` when user opts into "public launch" turbo mode.
- **Teach:** "A launch checklist — like a pilot's — so we don't take off with the door open."
- **Source:** Vercel production checklist — https://vercel.com/docs/production-checklist.md — accessed 2026-10-20.

#### D-07 · Use a production domain with auto-HTTPS; understand preview URL generation; optional Preview Deployment Suffix for isolation

- **Why:** Default `*.vercel.app` URLs are fine for dev but a production launch needs a real domain with valid certs and predictable URLs; unprotected previews can be scraped.
- **Severity:** `nudge` (becomes `warn` at launch)
- **Enforcement:** Vercel auto-provisions Let's Encrypt certs; domain guide in scaffold docs; optional Deployment Protection (password/Vercel auth) for previews via Vercel settings.
- **Teach:** "Your site gets a real address with a padlock — and previews stay private until you share them."
- **Source:** Vercel Domains / Deployment Protection — https://vercel.com/docs/production-checklist.md — accessed 2026-10-20; Vercel Deployments generated URLs — https://vercel.com/docs/deployments — accessed 2026-10-20.

---

## 4 · Project Hygiene

#### H-01 · Kebab-case file & folder names; one concern per file; `src/` as single authority; framework-idiomatic placement

- **Why:** Inconsistent naming breaks imports on case-sensitive Linux/CI even when it works on macOS; scattered files make agent navigation unreliable.
- **Severity:** `warn`
- **Enforcement:** ESLint `unicorn/filename-case` (kebab-case) — auto-fixable; scaffold `src/` layout (`src/app`, `src/components`, `src/lib`, `src/server`); harness `validate.ts` flags non-kebab top-level paths; docs explain `src` as the only editable authority (mirrors `clief-notes-method`).
- **Teach:** "Same naming everywhere — so files work on every computer, not just yours."
- **Source:** Project structure conventions (Next.js `src/` layout) — https://nextjs.org/docs/app/api-reference/config/next-config-js — accessed 2026-10-20 (generalized) (`practiced`).

#### H-02 · `README.md` answers: what it is, how to run it, how to deploy — minimum viable docs; `AGENTS.md` for agent harness rules

- **Why:** A repo with no README is unnavigable by humans and agents; missing run instructions cause repeated LLM hallucinations about setup.
- **Severity:** `warn`
- **Enforcement:** Scaffold ships `README.md` template + `AGENTS.md` (harness instructions); CI check: `README.md` must contain `## Getting Started` or equivalent (`grep` in validate); agent bootstrap reads `AGENTS.md` before acting.
- **Teach:** "A front-door sign so anyone (including the AI) knows how to start your project."
- **Source:** GitHub README best practices (community norm) — https://www.jarredbaker.com/developer-hub/styling-guides/git-standards — accessed 2026-10-20 (`practiced`).

#### H-03 · Pin dependency versions; commit lockfile (see S-15); prefer minimal deps — each one is liability

- **Why:** Duplicate of S-15/S-17 but from hygiene lens: version drift + dep bloat causes flaky builds and "works on my machine."
- **Severity:** `warn`
- **Enforcement:** Same as S-15/S-17; hygiene-facing nudge auto-created when `package.json` adds a dep without a clear import.
- **Teach:** "We keep your parts list short and exact — so builds are predictable."
- **Source:** See S-15 sources (`practiced`).

#### H-04 · Auto-formatting & linting on by default (Prettier + ESLint + typecheck); CI enforces, editor integrates

- **Why:** Without formatting/linting, PRs mix style noise with real changes; type errors ship to prod and crash at runtime.
- **Severity:** `warn`
- **Enforcement:** Scaffold: `eslint.config.js` + `.prettierrc` + `tsconfig.json` strict; Husky pre-commit runs `lint-staged` (fix); CI re-runs lint/typecheck and fails on error; VS Code settings committed.
- **Teach:** "The editor tidies your code as you type — and the safety check double-checks before it's shared."
- **Source:** Frontend engineering conventions — widely documented; Next.js ESLint defaults — https://nextjs.org/docs/app/api-reference/config/eslint — accessed 2026-10-20 (`practiced`).

#### H-05 · Issue / task tracking hygiene: one tracked issue per scope of work; link commits/PRs to issues

- **Why:** Without linked issues, scoping and revert reasoning is lost; "vibe-coded" projects accumulate untracked half-features.
- **Severity:** `nudge`
- **Enforcement:** Scaffold PR template references `Closes #…`; harness structured-issue queue (`We noticed X → fix + plan`) auto-creates linked issues the agent resolves itself — user isn't dumped raw tickets. CI reminder bot for PRs with no linked issue (non-blocking).
- **Teach:** "Each job gets its own ticket — so we always know what's done and what's left."
- **Source:** GitHub issue/PR linking docs — https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue — accessed 2026-10-20 (generalized).

#### H-06 · Don't commit generated artifacts (`dist/`, `.next`, `build/`, coverage); `dist` is disposable and rebuilt

- **Why:** Generated files in git cause merge conflicts and stale builds; source-of-truth principle (see vibe-fence Phase 1 plan: `src` → `dist` via `tools/generate.ts`).
- **Severity:** `warn`
- **Enforcement:** `.gitignore` includes `dist/`, `.next/`, `build/`, `coverage/`; CI fails if `dist/` is tracked; harness build docs emphasize `dist` is regenerated.
- **Teach:** "We don't save the printout — only the original. The copy is reprinted whenever needed."
- **Source:** Vibe-fence Phase 1 plan — `docs/PLAN.md` (Phase 1: `dist/` disposable) — accessed 2026-10-20; `docs/research/INDEX.md` M2 scope — https://nextjs.org/docs/app/building-your-application/deploying — accessed 2026-10-20 (`practiced`).

---

## 5 · Data & Privacy

Privacy applies even to small apps: if any visitor is in the EU/EEA/UK, the **GDPR and ePrivacy Directive** apply — there is no small-business exemption. California's CCPA/CPRA adds parallel consent/opt-out duties.

#### P-01 · Collect only what you need (data minimization); define a retention period and delete after

- **Why:** Over-collection multiplies breach impact and GDPR risk; indefinite retention violates purpose limitation.
- **Severity:** `warn` (becomes `block` if sensitive PII: health, children, financial)
- **Enforcement:** Scaffold data model review checklist; docs prompt: "what data do you really need?"; cron/job spec for retention sweep (`deleted_at`); harness queue flags fields like `ssn`, `date_of_birth` (exact types) and suggests alternatives.
- **Teach:** "Ask for the least you need — and set an expiry so old data doesn't linger forever."
- **Source:** EDPB — Data protection basics (GDPR principles: necessity, proportionality, storage limitation) — https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en — accessed 2026-10-20; ICO — Data protection by design & default — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/ — accessed 2026-10-20 (`proven`).

#### P-02 · Classify and protect PII: encrypt at rest where supported; never log PII; never return full PII in API responses by default

- **Why:** Logs and API payloads leak PII via copy-paste, CDNs, and error trackers; unencrypted DBs expose data on backup theft.
- **Severity:** `block` for sensitive PII · `warn` for basic contact PII
- **Enforcement:** Scaffold env `DATABASE_ENCRYPTION_AT_REST=true` where provider supports it; ESLint/log-shield: flag `console.log(req.body)` patterns containing PII fields; API response sanitizer helper `publicUser(user)` that strips sensitive fields; DB column-level encryption for high-sensitivity fields.
- **Teach:** "Names and emails are private — we blur them in logs and only show what's needed."
- **Source:** EDPB — Secure personal data (GDPR Art. 32 measures) — https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en — accessed 2026-10-20; GDPR Art. 32 via — https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en — accessed 2026-10-20.

#### P-03 · Every site that may get EU visitors needs a privacy policy stating: what is collected, why, lawful basis, retention, rights, contact/DPA info

- **Why:** GDPR Art. 13/14 transparency obligation; missing notice is a direct violation regardless of other compliance.
- **Severity:** `warn` → `block` at public launch
- **Enforcement:** Scaffold ships `/privacy` page template (sections pre-filled, user completes specifics); harness `preflight` flags missing privacy route before public launch; links in footer by default.
- **Teach:** "A plain-English page that says what you collect, why, and how people can ask you to delete it."
- **Source:** GDPR transparency overview — https://entreprendre.service-public.gouv.fr/vosdroits/F24270?lang=en — accessed 2026-10-20 (GDPR Art. 13/14 principles); EDPB basics — https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en — accessed 2026-10-20 (`proven`).

#### P-04 · Honor data-subject rights: access, rectification, erasure (right to be forgotten), portability; wire the affordance before you need it

- **Why:** GDPR rights are not optional features to add later under a complaint deadline — they must be operable.
- **Severity:** `warn` (any PII) · `block` (sensitive PII)
- **Enforcement:** Scaffold admin/export/delete helpers (`GET /api/me/export`, `DELETE /api/me`), documented in README; privacy policy explains how to exercise rights (contact + process); harness queue reminds after any table holding PII is added.
- **Teach:** "If someone asks what you have on them — or to delete it — you can do it in one click."
- **Source:** GDPR Chapter III (Rights of the data subject) via — https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en — accessed 2026-10-20; — https://entreprendre.service-public.gouv.fr/vosdroits/F24270?lang=en — accessed 2026-10-20.

#### P-05 · Analytics & tracking require prior opt-in consent (not opt-out); block non-essential cookies before consent; honor withdrawal

- **Why:** Google Analytics, Meta Pixel, and any non-essential tracker set on page-load without consent violates ePrivacy + GDPR; enforcement has moved to fines and Google's Consent Mode v2 gate.
- **Severity:** `block` for shipping analytics without a CMP gate · `warn` for missing withdrawal affordance
- **Enforcement:** Scaffold: no analytics script by default; if user adds GA/Meta, harness injects a Consent Management Platform (CMP) that blocks tags until `Accept`; banner has equal Accept/Reject, per-category toggle, persistent Preferences link, timestamped consent record; Google Consent Mode v2 signals wired if using Google tags; default to privacy-preserving alternatives (Plausible, PostHog self-hosted) noted in docs.
- **Teach:** "We ask permission before tracking — and people can change their mind anytime."
- **Source:** GDPR cookie consent guide — https://www.uniconsent.com/gdpr — accessed 2026-10-20; Consent Management for small business — https://secureprivacy.ai/blog/consent-management-platform-for-small-business — accessed 2026-10-20; Cookie consent deep-dive — https://gdprwise.eu/en/kennisbank/verplichtingen/cookies-consent-guide/ — accessed 2026-10-20; Cookie compliance (ePrivacy) — https://www.pitch.law/knowledge-base/cookie-compliance-and-consent-management — accessed 2026-10-20; Google Consent Mode v2 (via Secure Privacy) — https://secureprivacy.ai/blog/consent-management-platform-for-small-business — accessed 2026-10-20 (`proven`).

#### P-06 · Use HTTPS everywhere and apply data-protection-by-design defaults (collect less, keep less, log less)

- **Why:** Transport without TLS leaks everything; permissive defaults (collect everything, log everything, keep forever) are the root cause of most small-app privacy incidents.
- **Severity:** `warn`
- **Enforcement:** HTTPS via Vercel + HSTS (S-10/D-07); scaffold defaults: `logLevel` excludes bodies, sampling, no PII in error reports (Sentry scrub rules preconfigured); data model lint suggests narrower field types.
- **Teach:** "Everything private stays encrypted and we keep as little as possible — less to lose if something goes wrong."
- **Source:** EDPB secure personal data — https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en — accessed 2026-10-20; ICO data protection by design & default — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/ — accessed 2026-10-20.

---

## 6 · Severity calibration & ordering

| Severity | Meaning for the harness | UX cue |
|---|---|---|
| `block` | Agent cannot ship/promote without fixing; CI fails or `vibe-guard` refuses | 🟥 "We can't go live until this is fixed — here's the one-click fix + why" |
| `warn` | Ships, but harness queues a tracked issue and nags at increasing frequency; Launch gates turn `warn→block` at milestone | 🟨 "Should fix soon — queued for you, we'll handle it" |
| `nudge` | Silently queued, surfaced in the next low-friction teaching moment; never breaks flow | 🟦 "Nice to know — when you have a minute…" |

**Order to implement (P0 → P2):**

| Priority | Rules | Rationale |
|---|---|---|
| **P0 — Day 1 (scaffold)** | S-12, S-13, S-15, S-07, S-05, G-01, D-01, S-04 | No-secrets, no-injection, input validated, lockfile, cookie flags |
| **P0.5 — Before first deploy** | S-08, S-09/S-10, S-11, S-01/S-02, S-19, D-04, G-06/G-07, H-04, H-06 | XSS/CSP/headers, CSRF, auth/RBAC, least-privilege DB, CI + builds |
| **P1 — Before real users** | S-16, D-05/D-06, P-01→P-03, P-05, H-02, G-03/G-04 | Continuous scanning, rollback/runbook, privacy basics, docs, git hygiene |
| **P2 — Hardening** | S-17, S-18, S-20, P-04/P-06, H-03/H-05, G-02/G-05/G-08 | Pinning hygiene, rights affordances, polish |

---

## 7 · Gaps / unknowns

1. **Client-side DB SDKs (Supabase client, Firebase)** — Least-privilege via RLS is the right answer, but vibe-coders will paste service-role keys into `NEXT_PUBLIC_` vars; harness should lint `NEXT_PUBLIC_` for key-shaped values (high false-positive risk — needs tuning).
2. **File upload security** — MIME + extension validation, virus scanning, and storage ACLs weren't fully scoped; common vibe-app vector (user uploads avatar → RCE via polyglot). Needs a follow-on rule.
3. **Rate limiting / abuse** — Auth endpoints without rate limiting enable credential stuffing; Vercel Firewall rate-limit rules cover this but need explicit onboarding. Not in this stream's scope.
4. **SSRF specifics** — Now merged into OWASP A01:2025; fetch-to-user-provided-URL needs allowlist; harness should provide a safe-fetch wrapper.
5. **PII detection in LLM prompts** — If the app sends user data to an LLM, that is a processing activity under GDPR; consent + data-flow transparency needed. Cross-cuts with Meta model integration (Stream 06).
6. **Pre-commit UX on non-technical machines** — `pre-commit` + `gitleaks` install friction on Windows/Hermes-managed profiles; may need a Node-only alternative (`husky` + `gitleaks` binary bundling).
7. **Tightening threshold** — When exactly does the harness escalate `warn→block`? Proposed: on user-declared "public launch" intent; needs UX design (Stream 05).

---

## 8 · Sources

| # | Source | URL | Accessed | Strength | Covers |
|---|---|---|---|---|---|
| 1 | OWASP Top 10:2025 | https://top10.owasp.org/2025/ | 2026-10-20 | `proven` | S-01, S-07, S-19 |
| 2 | OWASP XSS Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html | 2026-10-20 | `proven` | S-08 |
| 3 | OWASP Injection Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html | 2026-10-20 | `proven` | S-05, S-06 |
| 4 | OWASP SQL Injection Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html | 2026-10-20 | `proven` | S-05 |
| 5 | OWASP Query Parameterization Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html | 2026-10-20 | `proven` | S-05 |
| 6 | OWASP CSRF Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html | 2026-10-20 | `proven` | S-11 |
| 7 | OWASP JWT Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html | 2026-10-20 | `proven` | S-02 |
| 8 | OWASP Node.js Security Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html | 2026-10-20 | `proven` | S-04, S-08 |
| 9 | OWASP Session Management (via Top 10 A07) | via https://top10.owasp.org/2025/ | 2026-10-20 | `proven` | S-04 |
| 10 | OWASP DevSecOps — Secrets Management | https://owasp.github.io/DevSecOpsGuideline/2-Process/2-2-Develop/2-2-1-Pre-commit/2-2-1-2-Secrets-Management/ | 2026-10-20 | `practiced` | S-12, S-13 |
| 11 | Gitleaks | https://github.com/gitleaks/gitleaks | 2026-10-20 | `practiced` | S-13 |
| 12 | Vercel — Environment Variables | https://vercel.com/docs/environment-variables | 2026-10-20 | `proven` | D-01, D-02 |
| 13 | Vercel — Manage env vars across environments | https://vercel.com/docs/environment-variables/manage-across-environments | 2026-10-20 | `proven` | D-01 |
| 14 | Vercel — Environments | https://vercel.com/docs/deployments/environments | 2026-10-20 | `proven` | D-03 |
| 15 | Vercel — Deployment Checks | https://vercel.com/docs/deployment-checks | 2026-10-20 | `proven` | G-07, D-04 |
| 16 | Vercel — Production checklist | https://vercel.com/docs/production-checklist.md | 2026-10-20 | `proven` | D-06, D-07, S-10, S-20 |
| 17 | Vercel — Rollback / Promote | https://vercel.com/docs/deployments/rollback-production-deployment · https://vercel.com/docs/deployments/promote-preview-to-production | 2026-10-20 | `proven` | D-05 |
| 18 | Vercel — CSP / Security Headers | https://vercel.com/docs/cdn-security/security-headers | 2026-10-20 | `proven` | S-09, S-10 |
| 19 | Next.js — CSP guide | https://nextjs.org/docs/app/guides/content-security-policy | 2026-10-20 | `proven` | S-09 |
| 20 | Clerk — Auth security guide | https://clerk.com/articles/authentication-security-in-web-applications | 2026-10-20 | `practiced` | S-02, S-03, S-04 |
| 21 | GitHub — Best practices for version control (security) | https://github.com/Kubomu/Best-Practices-for-Version-Control-GIT/blob/main/security-best-practices.md | 2026-10-20 | `practiced` | G-01, G-02 |
| 22 | Git hygiene — ffmpeg-skill (tracked-file trap) | https://github.com/kajisho5/ffmpeg-skill/blob/008333aaf6722083392eb6bd8bd67b59884a2a26/.claude/skills/git-hygiene/SKILL.md | 2026-10-20 | `practiced` | G-01, S-12 |
| 23 | Git Workflow Guide (solo → team) | https://articles.usulnet.com/articles/git-workflow-guide | 2026-10-20 | `practiced` | G-03, G-06 |
| 24 | Solo-dev GitHub minimal guide | https://zenn.dev/nawa_10half/articles/solo-dev-git-github-minimal-guide?locale=en | 2026-10-20 | `practiced` | G-03, G-06 |
| 25 | Git Commit Standards (Conventional Commits) | https://www.jarredbaker.com/developer-hub/styling-guides/git-standards | 2026-10-20 | `practiced` | G-04, G-08, H-02 |
| 26 | NPM lockfile security best practices | https://safeguard.sh/resources/blog/best-practices-for-npm-lockfile-security-2026 | 2026-10-20 | `practiced` | S-15, S-16, S-17 |
| 27 | Frontend Checklist — dependency audit | https://frontendchecklist.io/rules/security/dependency-audit | 2026-10-20 | `practiced` | S-15, S-16 |
| 28 | NPM supply-chain risks & fixes | https://blog.cyberdesserts.com/npm-security-vulnerabilities/ | 2026-10-20 | `practiced` | S-17 |
| 29 | Dependabot docs | https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates | 2026-10-20 | `proven` | S-16 |
| 30 | NSF — npm best-practice adherence study | https://par.nsf.gov/servlets/purl/10398646 | 2026-10-20 | `proven` | S-15, S-18 |
| 31 | EDPB — Data protection basics | https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en | 2026-10-20 | `proven` | P-01, P-03, P-04 |
| 32 | EDPB — Secure personal data | https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en | 2026-10-20 | `proven` | P-01, P-02, P-06 |
| 33 | ICO — Data protection by design & default | https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/ | 2026-10-20 | `proven` | P-01, P-06 |
| 34 | GDPR obligations overview (FR) | https://entreprendre.service-public.gouv.fr/vosdroits/F24270?lang=en | 2026-10-20 | `proven` | P-03, P-04 |
| 35 | UniConsent — GDPR compliance guide | https://www.uniconsent.com/gdpr | 2026-10-20 | `practiced` | P-05 |
| 36 | Secure Privacy — CMP for small business | https://secureprivacy.ai/blog/consent-management-platform-for-small-business | 2026-10-20 | `practiced` | P-05 |
| 37 | GDPRwise — Cookies & consent | https://gdprwise.eu/en/kennisbank/verplichtingen/cookies-consent-guide/ | 2026-10-20 | `practiced` | P-05 |
| 38 | Pitch Law — Cookie compliance & consent | https://www.pitch.law/knowledge-base/cookie-compliance-and-consent-management | 2026-10-20 | `practiced` | P-05 |
| 39 | StackNotice — Next.js security headers 2026 | https://stacknotice.com/blog/nextjs-security-headers-guide-2026 | 2026-10-20 | `practiced` | S-10 |
| 40 | mdn — CSP | https://developer.mozilla.org/docs/Web/HTTP/CSP | 2026-10-20 | `proven` | S-09 |

---

## 9 · Implications for vibe-fence

> The user should not have to *decide* on security — the harness enforces it and narrates what's happening. Every implication below is ordered by build priority.

1. **Copy P0 scaffold defaults verbatim:** Before first commit, `vibe-fence init` writes a correct `.gitignore` (S-12/G-01), `.env.example` placeholder pattern, committed lockfile, `npm ci` in CI, Zod validation wrapper per route (S-07), parameterized-query ORM helper (S-05), and cookie setter with `HttpOnly/Secure/SameSite` (S-04). Skipping this is shipping known-broken.
2. **Copy the security-header packet as code, not docs:** `next.config.ts` static headers (S-10) + Next.js 15.5+ `proxy.ts` per-request CSP nonce (S-09) ship in the template — not as a checklist item. Target an A+ on securityheaders.com out of the box.
3. **Ship `gitleaks` + GitHub Push Protection as the twin enforcement for secrets:** `husky` + `lint-staged` + `gitleaks` pre-commit hook (S-13) plus a first-run prompt to enable GitHub Push Protection. A single missing `.env` from `.gitignore` is `block`.
4. **Automate dependency hygiene completely:** Weekly grouped Dependabot (or Renovate) PRs, `npm audit --audit-level=high` failing CI, `lockfile-lint` for integrity, and install-script review nudge (S-15→S-18). The non-technical user never decides to update deps — the harness queues and auto-merges safe patches where CI is green.
5. **Avoid "warn-only" for auth, injection, secrets, and access control:** For these four, `warn` means "silently vulnerable." They must be `block` (or `warn→block` at first deploy). Vague "be careful with SQL" is not a guardrail — parameterized queries + server-side Zod + CSRF token are.
6. **Invent the severity escalation:** `warn→block` transition tied to an explicit user intent ("Preview-only" vs "Public launch") — the harness asks once where the app is going, then tightens gates accordingly. This is vibe-fence's novel contribution over generic linters (see Gaps §7).
7. **Copy Vercel's Deployment Checks as the harness's "last gate":** Configure required GitHub Checks before promoting to production (G-07/D-04); surface `vercel rollback` / `vercel promote` in `RUNBOOK.md` (D-05) and as a structured "deploy failed → auto-fix plan" queue item the agent resolves.
8. **Copy GDPR's data-minimization defaults — collect less, keep less, log less:** Scaffold privacy page + consent-mode-2 CMP wiring (P-05) + PII scrub in logs; PII-laden fields trigger auto-queued remediation. "No analytics by default" is the correct default for vibe-coders (analytics requires explicit opt-in through the CMP).
9. **Invent the `NEXT_PUBLIC_` key-shape lint:** A vibe-fence-specific ESLint rule that flags `NEXT_PUBLIC_*` values matching `sk_`, `AKIA`, `ghp_`, private-key headers, etc. No standard linter does this today — high false positives, so start as `warn` with a suppression comment.
10. **Avoid over-strictness on Git hygiene for solo hobby:** Conventional Commits and PR hygiene (G-04/G-08) are `warn`/`nudge`, not `block` — a solo hobby app with `WIP` commits is not a security incident. Enforce them harder only when collab is detected (2+ contributors).
11. **Scope the next rule set before polish:** File-upload safety, rate-limiting, SSRF allowlist wrapper, and LLM prompt-injection boundaries (Gaps) are the highest-leverage additions after this doc is implemented.
12. **Wire teaching to severity:** `block` items get a "why it broke + one-click fix" message at the user's dial level (max/medium/min); `nudge` items batch into a weekly digest — never break flow. See Stream 05 (Companion UX) for enforcement of fatigue/bloat budgets.

