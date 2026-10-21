# GEMINI DEEP RESEARCH PROMPT — 04/06 — Developer Guardrails (Rights & Wrongs)

> Copy everything below the line into Gemini Deep Research.

---

**Project:** vibe-fence — a drop-in harness that protects non-technical vibe-coders from shipping broken or insecure code. Users should not have to *decide* on security — the harness enforces correctness and explains what's happening. Think guardrails with levels: block / warn / nudge. Research is Phase 0; scaffold is Phase 1; this is one of 6 parallel streams.

**Your task — Stream 04: The Objective Rights & Wrongs a Web-App Harness Must Enforce.**

Research the concrete rules a harness should enforce for modern web apps (React/Vite/TS/Tailwind + Vercel deploy is the primary stack, but generalize where possible). Cover all five categories:

**A) Security:**
OWASP Top 10 (current), secrets handling (env vs committed keys, .env hygiene, secret scanning), dependency vulnerability scanning (npm audit, Dependabot, Socket), auth defaults (sessions vs JWT, OAuth pitfalls, password handling), input validation, XSS / CSRF / CSP, SQL/NoSQL injection, least-privilege DB access, CORS.

**B) Git & GitHub hygiene:**
Branching strategy for solo/small-team, commit conventions (conventional commits value), PR hygiene, CI minimum (what checks must run), .gitignore correctness, never committing .env / keys / dist secrets.

**C) Deploy (Vercel-centric but generalizable):**
Env vars per environment (preview vs production), build checks that must pass before deploy, rollback strategy, domain + HTTPS, web-app production checklist (what's required before going live).

**D) Project hygiene:**
File/folder naming conventions, where code lives (src/ vs root sprawl), documentation minimums (README, env template), task/issue tracking hygiene, dependency pinning vs floating, dead-code / bloat prevention.

**E) Data & privacy:**
PII handling basics, GDPR-lite for small apps, analytics consent, data retention.

For **each guardrail**, fill:

| Field | Capture |
|---|---|
| Rule | One-line normative statement |
| Why it matters | Concrete failure if ignored |
| How to auto-enforce | Lint rule, pre-commit hook, CI check, scaffold default, runtime guard — be specific |
| What to teach the user | One-line explanation a non-technical person can understand |
| Severity | `block` (must not ship without) / `warn` (fix soon) / `nudge` (nice-to-have) |
| Source | OWASP, Vercel docs, GitHub docs, MDN, etc. — URL + date accessed |

**Requirements:**
- Prefer authoritative sources (OWASP, MDN, Vercel/GitHub docs, CIS benchmarks). Cite each rule.
- Every rule needs severity + enforcement mechanism — vague "be careful" is not a guardrail.
- Cover all five categories. If you go deep on one, explicitly note which others were shallow.
- End with **"Implications for vibe-fence"** — numbered, actionable: which rules to block/warn/nudge and in what implementation order.

**Output shape:**
Header → Findings grouped by category (Security / Git / Deploy / Hygiene / Privacy) → per-rule table or subsections with severity + enforcement → Gaps / unknowns → Sources table → Implications for vibe-fence (numbered, with priority order).
