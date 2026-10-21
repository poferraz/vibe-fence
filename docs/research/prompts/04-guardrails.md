# Research Prompt — Stream 04: Developer Guardrails

> **Hand this entire prompt to a model. It is self-contained.**

---

You are a research agent for **vibe-fence** — a drop-in harness that protects non-technical vibe-coders from shipping broken or insecure code. The user should not have to *decide* on security — the harness enforces correctness and explains what's happening.

## Your Assignment — Stream 04: Developer Guardrails (Rights & Wrongs)

Research the **objective rules** a web-app harness must enforce. Non-technical users won't know to ask for these:

- **Security:** OWASP Top 10, secrets handling (env vs committed keys), dependency vuln scanning, auth defaults (sessions, JWT, OAuth pitfalls), input validation, XSS/CSRF, least-privilege DB access
- **Git & GitHub hygiene:** branching strategy for solo dev, commit conventions, PR hygiene, CI basics, .gitignore correctness, never committing `.env`
- **Deploy (Vercel-centric but generalizable):** env vars per environment, preview vs prod, build checks, rollback, domain + HTTPS, web-app production checklist
- **Project hygiene:** file/folder naming conventions, where code lives, documentation minimums, task/issue tracking hygiene, dependency pinning
- **Data & privacy:** PII handling, GDPR-lite for small apps, analytics consent

For each guardrail, capture:

| Field | What to capture |
|-------|-----------------|
| Rule | One-line normative statement |
| Why it matters | Concrete failure if ignored |
| How to auto-enforce | Lint, pre-commit, CI check, scaffold default, runtime guard |
| What to teach the user | One-line explanation a non-technical person can understand |
| Severity | `block` (must not ship without) / `warn` (fix soon) / `nudge` (nice-to-have) |
| Source | OWASP, Vercel docs, GitHub docs, etc. — URL + date accessed |

## Requirements

1. Prefer authoritative sources (OWASP, MDN, Vercel/GitHub docs, CIS benchmarks). Cite each rule.
2. Every rule must have a severity and an enforcement mechanism — vague "be careful" is not a guardrail.
3. Cover all five categories above. If you go deep on one, note which others were shallow.
4. End with **Implications for vibe-fence** — numbered, actionable (which rules to block/warn/nudge, in what order to implement).

## Where to Save

```
docs/research/contributors/<your-model-id>/04-guardrails.md
```

- `<your-model-id>` = `<provider>-<model>-<YYYY-MM-DD>` lowercase, hyphens only
- If that folder doesn't exist, create it and add `manifest.json`:

```json
{
  "model": "your-model-name",
  "provider": "how you were accessed",
  "date": "YYYY-MM-DD",
  "streams_completed": ["04"],
  "streams_skipped": [],
  "notes": ""
}
```

## Output Shape

```
- Model / Provider / Date / Stream header
- Findings grouped by category (Security / Git / Deploy / Hygiene / Privacy)
- Per-rule table or subsections with severity + enforcement
- Gaps / unknowns
- Sources table
- Implications for vibe-fence (numbered)
```

Do not write to any other stream file. Do not edit files outside your contributor folder.
