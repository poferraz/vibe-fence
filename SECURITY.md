# Security Policy

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Use GitHub's private vulnerability reporting: **Security → Report a vulnerability** on https://github.com/poferraz/vibe-fence, or open a draft security advisory. For sensitive matters you may also contact the maintainer via GitHub profile.

We aim to acknowledge reports within 48 hours and provide a fix or mitigation timeline within 7 days.

## Scope

In scope for this harness (what we treat as security, not just bugs):

- Secret exfiltration or leak (`NEXT_PUBLIC_*` / `VITE_*` shape lint bypass, `.env` inclusion in bundle)
- Credential-path access (`~/.ssh`, `~/.aws`, service-role keys) via skill or adapter bypass
- Sensitive fixture data and potentially unbounded billable loops in the patterns covered by PRV-09 and BILL-01; these rules do not establish authentication or RLS coverage
- Dependency supply-chain via `postinstall` planting malicious `AGENTS.md` / skills (GEM-01 integrity attestation)
- `curl|sh` / `wget|sh` pipe-to-shell execution (NET-01 hard-block bypass)

Out of scope: DoS via prompt length (that's a budget/lint issue, not security), social-engineering of the user outside the harness boundary.

## Disclosure

We follow coordinated disclosure with a 90-day embargo by default. Please do not disclose publicly until a fix is released or the embargo expires, whichever comes first.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.1+  | ✅ when released |
| ≤0.2.0  | ❌        |

## Hardening References

- `src/framework/integrity.ts` — workspace-local drift detection; the workflow marker is not an independent authentication boundary (S-06)
- `src/rules/` — bounded pattern checks (S-09); false positives and missed patterns remain possible
- `src/framework/git.ts` — checkpoint + `fence undo` rollback invariant (S-10/S-11a)
