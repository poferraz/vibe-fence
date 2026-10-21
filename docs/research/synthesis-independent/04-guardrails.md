# Synthesis — Stream 04: Developer Guardrails (Independent Evaluation)

- **Stream:** 04 — Developer Guardrails (Rights & Wrongs)
- **Synthesized:** 2026-10-20
- **Contributors compared:** 5 independent runs:
  - `google-gemini-3.8-flash-2026-10-20` (10 sources, 18 guardrails)
  - `openai-gpt-6-2026-10-20` (59 sources, 48 guardrails)
  - `muse-spark-2026-10-20` (40 sources, 35 guardrails)
  - `ollama-launch-deepseek-v4.1-flash-2026-10-20` (13 sources, 26 guardrails)
  - `ollama-launch-minimax-m3.1-flash-2026-10-20` (88 sources, exhaustive policy)

---

## 1. What the Contributors Agree On

Across all 5 contributors, there is unanimous alignment on the core security hazards of AI-assisted web development:

| # | Agreed finding | Best evidence | Agreement | Decision for vibe-fence |
|---|---|---|:---:|:---:|
| **A-01** | **Credentials in client bundles (`NEXT_PUBLIC_` / `VITE_` leakage) is the #1 acute AI-introduced vulnerability.** Models routinely prefix private secrets (`SUPABASE_SERVICE_ROLE_KEY`, Stripe live keys) with public prefixes to bypass frontend permission errors. | `gemini-3.8-flash 04` + `gpt-6 04` (SEC-01) + `minimax 04` (confirmed across Copilot, Cursor, v0). | **Unanimous** | **`block`:** Hard static AST linter rejecting forbidden keywords (`SECRET`, `SERVICE_ROLE`, `PRIVATE`) paired with public framework prefixes. |
| **A-02** | **Row Level Security (RLS) bypass via `USING (true)` is the leading database vulnerability.** When models struggle with auth policies, they write permissive policies that expose entire database tables to the public internet. | `gemini-3.8-flash 04` (SEC-03) + `minimax 04` + `gpt-6 04` (SEC-13). | **Unanimous** | **`block`:** Migration linter rejecting table creation lacking `ENABLE ROW LEVEL SECURITY` or containing `FOR ALL USING (true)`. |
| **A-03** | **Pre-commit secret scanning must be local, deterministic, and air-gapped.** Relying on GitHub push protection is too late; once committed to git history, keys are compromised even if the commit is amended. | `gemini-3.8-flash 04` (Gitleaks pattern) + `gpt-6 04` (SEC-02 rotation requirement). | **Unanimous** | **`block`:** Pre-commit regex hook blocking high-entropy strings and known API key patterns before write. |
| **A-04** | **Severity must follow a strict mathematical contract: only deterministic + irreversible checks may `block`.** Probabilistic checks or style preferences must never halt a developer's flow. | `deepseek 04` (Severity algorithm) + `gpt-6 04` (Severity semantics) + `minimax 04`. | **Unanimous** | **Adopt:** `block` is reserved strictly for verifiable, irreversible security/data hazards. |
| **A-05** | **Pre-push build and typecheck verification (`npm run build` / `tsc --noEmit`) is non-negotiable.** Pushing code that breaks the production build destroys user trust and crashes serverless platforms like Vercel. | `gemini-3.8-flash 04` (DEP-01) + `muse-spark 04` + `gpt-6 04` (DEP-01). | **Unanimous** | **`block`:** Pre-push gate executing clean build verification. |

---

## 2. Where They Disagree

### D-01 — Static vs Intent-Driven Severity Policy (The App Profile)

- **Reading A (`minimax 04`):** Severity cannot be globally static. A beginner hacking on a local prototype (`localhost:3000`) should not be blocked by strict Content Security Policies (CSP), missing privacy policies, or cookie consent banners. Proposes `.fence/app-profile.json` with three profiles: `local` (starter), `shared` (preview URLs), and `public` (production with live users/payments).
- **Reading B (`gpt-6 04` & `gemini-3.8-flash 04`):** Proposes a universal static severity list (e.g. SEC-01 is always `block`, DEP-02 is always `warn`).
- **Independent Resolution:** **Adopt Minimax's App Profile Model.** Non-technical users building a weekend toy will uninstall a harness that demands production CSP nonces and GDPR data-export endpoints on day one.
  - At `local`: 12 core safety invariants block (secrets, RLS, client-side master keys, destructive git, build break).
  - At `shared`: +8 deploy and auth hygiene checks escalate to `block`.
  - At `public`: Full production readiness checklist blocks release.
- **Why it matters for Phase 1:** Determines the structure of `.fence/app-profile.json` and dynamic severity calculation in `src/framework/guardrails.ts`.

### D-02 — Dependency CVE Audits: Hard Block vs Applicability Triage

- **Reading A (`muse-spark 04` & `gemini-3.8-flash 04`):** Run `npm audit --audit-level=high` on pre-push and block if vulnerabilities exist.
- **Reading B (`gpt-6 04` & `minimax 04`):** Raw `npm audit` is notoriously noisy, reporting dev-dependency vulnerabilities in build tools that have zero runtime reachability in production web bundles. A hard block on raw audit results halts legitimate progress and induces developer bypasses.
- **Independent Resolution:** Cautious middle ground:
  - In development: `npm audit` reports are written to `.fence/queue.json` as `warn` items.
  - Production release gate: Blocks *only* if the vulnerable package is in `dependencies` (production runtime), while demoting `devDependencies` to a high-priority warning.
- **Why it matters for Phase 1:** Prevents `vibe-fence` from blocking a user because of a regex vulnerability in an obscure Markdown documentation parser.

### D-03 — Handling Leaked Credentials: Hard Block vs Automated Rotation

- **Reading A (`gpt-6 04`):** SEC-02 insists that once a secret is exposed, deleting the file does not fix the problem; the credential must be treated as permanently compromised and rotated via provider APIs before the block can be lifted.
- **Reading B (`gemini-3.8-flash 04` & `deepseek 04`):** Non-technical users cannot automate cloud credential rotation via CLI. Demanding automated rotation paralyzes a beginner.
- **Independent Resolution:** The harness blocks the commit immediately to prevent the secret from entering git history. If already committed locally, `npx vibe-fence undo` rolls back the commit. If pushed remotely, the harness displays an emergency red banner instructing the user in plain English: *"This password was published online. You must visit [Provider Dashboard] to click 'Generate New Key' and replace it."*
- **Why it matters for Phase 1:** Determines recovery flows in `src/framework/secrets.ts`.

---

## 3. Unique Contributions

| Contributor | Unique Finding / Breakthrough | Evidence | Adopt in Phase 1? |
|---|---|---|:---:|
| **`ollama-launch-minimax-m3.1-flash`** | **The Three-Tier App Profile (`local`/`shared`/`public`):** Scaled severity dynamically so local prototypes aren't harassed by enterprise compliance rules. | Architectural Design | **Yes:** Implement `.fence/app-profile.json`. |
| **`openai-gpt-6`** | **Executable Rule Records (`.fence/rules/<id>.json`):** Formalized guardrails as structured JSON objects with explicit `applicability`, `evidence_schema`, and `repair_workflow`. | RFC Schema Specification | **Yes:** Standardize guardrail definitions in `src/rules/`. |
| **`ollama-launch-deepseek-v4.1-flash`** | **The Deterministic Severity Axiom:** Formal rule: `No deterministic check → Nudge; Deterministic check + Reversible → Warn; Deterministic check + Irreversible → Block`. | Algorithmic Formulation | **Yes:** Code into severity assignment engine. |
| **`google-gemini-3.8-flash`** | **The Plain-English Companion Teaching Translations:** Provided one-line non-technical explanations for every security rule (e.g. *"We moved user login passes into a sealed digital vault"*). | Human-Centered UX | **Yes:** Embed directly into rule metadata. |
| **`muse-spark`** | **Supply Chain Script Poisoning Guard:** Explicit ban on unreviewed package `postinstall` lifecycle scripts that execute arbitrary shell code during `npm install`. | Supply Chain Security | **Yes:** Enforce `npm ci --ignore-scripts` where appropriate. |

---

## 4. Gaps in the Collective Research

1. **Remote Database Schema Drift:** Static analysis checks SQL migration files, but cannot detect when a user manually modifies Supabase/Neon tables in a web dashboard without RLS.
2. **Third-Party AI Micro-Billing Protection:** When an agent writes code integrating OpenAI or Replicate APIs, how does the harness prevent a runaway loop from racking up thousands of dollars in API bills?
3. **Automated Mockup Data Sanitization:** How does the harness prevent users from pasting real customer spreadsheets or live API dumps into test fixtures?

---

## 5. The Consolidated Answer

Developer guardrails must function as an objective engineering floor, not a philosophical debate. To protect non-technical vibe-coders without paralyzing them, `vibe-fence` establishes three operational tenets: (1) **The Deterministic Severity Contract**—only mechanical, irreversible security and data hazards (leaked secrets, client-side master keys, missing RLS, build breaks) may `block` execution; (2) **The Dynamic App Profile**—guardrail strictness scales across declared environments (`local` prototype → `shared` preview → `public` production); and (3) **The Plain-English Teaching Translation**—every violation is explained in a single reassuring sentence that teaches what was protected without technical jargon.

---

## 6. Actions for Phase 1

### Copy (Proven Patterns to Adopt)
1. **The Pre-Commit Secret Scanner:** Air-gapped regex patterns scanning staged changes for high-entropy strings, AWS keys, Stripe secret keys, and Supabase service roles. (`gemini-3.8-flash`, `gpt-6`)
2. **Framework Client-Prefix AST Check:** Reject any variable containing `SECRET`, `PRIVATE`, or `SERVICE_ROLE` prefixed with `NEXT_PUBLIC_`, `VITE_`, or `PUBLIC_`. (`gemini-3.8-flash`, `minimax`)
3. **Pre-Push Build Verification:** Execute `npm run build` and `tsc --noEmit`; block git push on compilation failure. (`gemini-3.8-flash`, `gpt-6`, `muse-spark`)

### Avoid (Anti-Patterns to Reject)
1. **Blocking on Style / Cosmetic Conventions:** Never block a solo developer on commit message formatting, lint spacing, or missing JSDoc comments. These are strictly `nudge`. (`deepseek`, `gpt-6`)
2. **Blocking on Raw devDependency CVEs:** Do not halt local development for low-severity vulnerabilities in build tooling. (`gpt-6`, `minimax`)
3. **Silent Failure ("Unknown = Pass"):** If a mandatory security check cannot run because a tool is missing, mark the status as `unknown` and warn; never treat missing scanners as a clean pass. (`gpt-6`)

### Invent (Novel Primitives to Build)
1. **The Dynamic App Profile (`.fence/app-profile.json`):** Initialize repos as `local` by default (minimal blocking gates); provide `npx vibe-fence promote shared` and `npx vibe-fence promote public` to scale guardrail rigor as the project matures. (`minimax`)
2. **The JSON Rule Record Schema (`src/rules/schema.json`):** Every rule implemented as a self-contained module containing its check script, remediation workflow, and plain-English companion copy. (`gpt-6`)
3. **The Environment Variable Mirror Hook:** Automatically appends newly added keys from `.env.local` to `.env.example` with blank dummy values. (`gemini-3.8-flash`)

---

## 7. Open Questions

- [ ] **Live Remote RLS Verification:** Can `vibe-fence` safely ping Supabase Management APIs to verify that remote production tables have RLS enabled before promoting to `public`?
- [ ] **False-Positive Allowlisting:** Where should rule exemptions be stored? Proposed: `.fence/allowlist.json` with cryptographically signed hashes.

---

## 8. Deduplicated Sources Table

| # | Source URL / Identifier | Type | Primary Contributor |
|---|---|---|---|
| 1 | [https://owasp.org/Top10/](https://owasp.org/Top10/) — OWASP Top 10 Web Application Security Risks | Security Standard | `gemini-3.8-flash`, `gpt-6` |
| 2 | [https://owasp.org/www-project-application-security-verification-standard/](https://owasp.org) — OWASP ASVS 5.0 | Security Standard | `gpt-6` |
| 3 | [https://github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) — Gitleaks Pattern Specifications | Open Source Tool | `gemini-3.8-flash`, `gpt-6` |
| 4 | [https://vercel.com/docs/security](https://vercel.com/docs/security) — Vercel Platform Security Overview | Official Docs | `gemini-3.8-flash`, `muse-spark` |
| 5 | [https://supabase.com/docs/guides/auth/row-level-security](https://supabase.com) — Supabase RLS Guidelines | Official Docs | `gemini-3.8-flash`, `minimax` |
| 6 | [https://12factor.net/config](https://12factor.net/config) — The Twelve-Factor App: Configuration | Architecture Standard | `gemini-3.8-flash`, `gpt-6` |
| 7 | [https://docs.github.com/en/code-security/secret-scanning](https://docs.github.com) — GitHub Secret Scanning Specs | Official Docs | `gpt-6`, `minimax` |
