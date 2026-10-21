---
name: vibe-guard
description: Use when configuring guardrails, adding a rule to .fence/rules/, scanning for secrets/auth/CSP/RLS/billing/privacy violations, or hardening a vibe-coded project before deploy.
---

# vibe-guard — Guardrail Rule Records & Check Packet

> Sources: FINAL-v2 §4 M3 (S-08/S-09, 04 M3, GEMS-05 BILL-01/GEMS-06 PRV-09) · 04 A-01..A-06 · 04 guardrails synthesis · S-04/S-05 · OWASP Top 10:2025.

## Install

Rules live under `.fence/rules/<id>.json`; each rule is a **record validated app-side** (S-05 — deterministic fence decides; model explains). Every `block` maps to an executable check — no check → never a block (S-08).

### Rule record schema — 7 fields (FINAL-v2 M3)

```jsonc
{
  "id": "sec-secrets-01",          // 1. stable rule id
  "applicability": "on_write",      // 2. when: on_write | on_commit | on_push | on_promote
  "severity": "block",              // 3. derived from .fence/app-profile.json local/shared/public (S-09)
  "source": "04 A-01 / OWASP A07",  // 4. provenance (FINAL-v2 §2 S-08 frame)
  "check_adapter": "gitleaks",      // 5. executable check name (tools/generate.ts wiring)
  "affected_action": "commit",      // 6. action gated (commit | push | deploy | build)
  "evidence_schema": {               // 7. fields the finding must carry
    "type": "object",
    "required": ["file", "line", "pattern"],
    "properties": { "file": { "type": "string" }, "line": { "type": "integer" }, "pattern": { "type": "string" } }
  },
  "repair_workflow": ".fence/repairs/sec-secrets-01.md"
}
```

Verdicts per finding: `pass|fail|unknown|not-applicable` (FINAL-v2 M3 `pass/fail/unknown/not-applicable`); mitigations carry `evidence+scope+owner+expiry`; `unknown ≠ pass` (S-14).

Severity is policy from `.fence/app-profile.json` (`local 14 / shared 29 / public 55 blocks`, S-09); `devDependencies` → `warn` heuristic; CSP Report-Only first (S-09).

### Guardrail packet — every category has a command (S-08; 04 D-01..D-08)

| Category | Check (blocking unless noted) | S-#/rule |
|----------|-------------------------------|----------|
| **Secrets** | Dual-layer `gitleaks detect --no-banner` (pre-commit) + GitHub Push Protection (push) — `warn→block` after allowlist (S-09) · `.env` untracked scan (`git ls-files` includes `.env` → `block`) · `NEXT_PUBLIC_*` / `VITE_*` / `PUBLIC_*` shape lint — public env must not contain `SECRET|KEY|TOKEN` patterns (04 M3 guardrail packet) | 04 A-01 · S-08 |
| **Client shape** | `NEXT_PUBLIC_` / `VITE_` / `PUBLIC_` lint: flag `SERVICE_ROLE_KEY|service_role|sk_live` in public namespaces → `block` | 04 M3 |
| **Input** | Zod per-route schema + `pg $1` / ORM parameterization + `semgrep p/owasp-top-ten` on write | 04 M3 · OWASP A03 |
| **Headers/CSP** | `headers()` check (HSTS, XFO, X-CTO) + CSP nonce — Report-Only first, then `enforce` (never `block` on first deploy) (S-09) | 04 M3 |
| **Auth** | `setSessionCookie()` audit + `verifyJWT({RS256})` / `JWT_SECRET` presence + PKCE `code_verifier` + `state` anti-CSRF on OAuth (04 M3) | 04 M3 |
| **DB / RLS** | `USING (true)` linter on `*.sql` + remote `pg_policies` introspection on `promote public` (`unknown` offline — GEM-04) | 04 M3 · GEM-04 |
| **Supply chain** | `lockfile` parity + `npm ci` + `onlyBuiltDependencies` allowlist (empty default) + `npm audit --omit=dev` (block `dependencies`, warn `devDependencies`) + SBOM/cooldown on `add-dep` | 04 M3 |
| **BILL-01 billing loop** | Loops (`for`/`while`/`forEach`/`Promise.all`) over `openai.*.create`/`replicate.run`/`*.chat.completions.create` without `maxBudget|maxCostUsd|maxTokens` + missing `try/catch` → `warn@local / block@shared,public` (GEMS-05 P1) | BILL-01 |
| **PRV-09 fixture hygiene** | `tests/fixtures/**`, `seed/**`, `*.fixture.*`, `__mocks__/**` scanned for ≥3 distinct email-shaped strings, phone patterns, high-entropy secret-like strings → `block` at all tiers; repair: `npx vibe-fence anonymize fixtures/<file>` (GEM-06) | PRV-09 |
| **Privacy** | Inventory → `/privacy` completeness + export/delete + consent gate (04 M3) | 04 M3 |

Instruction files (`AGENTS.md`, `SKILL.md`) are untrusted on init and on dependency pulls — validate + SHA-256 hash-attest (S-06/GEM-01).

## Usage

```bash
fence guard add --id sec-secrets-01 --check gitleaks --severity block
fence guard check --all                         # run all rules → verdicts.ndjson
fence guard check --rule BILL-01                # single-category gate
fence guard allowlist --rule sec-secrets-01 --pattern "example.com" --reason "docs" --expiry 2026-12-01
fence verify-remote --check rls                 # remote RLS introspection (GEM-04)
npx vibe-fence anonymize fixtures/seed.json     # PRV-09 synthetic replacement
```

Guard output is `{finding_id, explanation, question, options, evidence_ids}` validated app-side (FINAL-v2 §1 P1).

## Verification

| Check | How |
|-------|-----|
| `block` maps to executable | `tools/validate.ts` asserts every `severity: block` rule has a `check_adapter` binary/config reachable |
| Secrets dual-layer | `gitleaks` pre-commit + Push Protection push; seeded fixture (`AWS AKIA…`) must `block` (FINAL-v2 M4 bench #2) |
| `NEXT_PUBLIC_` lint | Fixture with `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` → `block` |
| RLS | `USING (true)` in `*.sql` → `fail`; `fence verify-remote` queries `pg_policies` on `promote public` |
| BILL-01 | `while(true){ openai.chat.completions.create()}` without budget cap → `warn@local / block@shared` |
| PRV-09 | `fixtures/users.json` with 3+ emails → `block`; `fence anonymize` preserves referential integrity |
| Supply chain | Missing `package-lock.json` parity or `npm audit high` in `dependencies` → `block` |
| Mechanical gate | `Read→Think→Write→Check` + trust ladder `compile→lint→tests×2→generated-tests→judge-for-prose` (S-04); diagnosis artefact before retry; 2-attempt circuit breaker |
| Adversarial bench | 8–12 tasks (poisoned `AGENTS.md`, README payload, malicious skill, user-asks-bypass) → `block` rate + false-block rate |

Lint `SKILL.md` text for ungrounded self-critique (`review your own work` without tool signal forbidden — FINAL-v2 M3; S-04).

## Anti-patterns

- **Do not stack rules greedily** — p^n joint reliability (~2@95%, ~5@80%); every rule A/B'd in isolation *and* combination (S-07/CCI).
- **Do not use permission prompts as safety** — 93% accept, ~35% miss on scope/exfiltration; containment + deterministic checks first (FINAL-v2 S-10).
- **Do not let the agent relax its own checks** — checks in `tools/` outside write-scope; `FENCE_SYNC_TOKEN` gate (FINAL-v2 §6 #8/S-06).
- **Do not default secrets/CSP to `block` without allowlist/Report-Only** — secrets `warn→block` after allowlist; CSP Report-Only first (S-09).
- **Do not treat unverified LLM smoke tests as a `block` gate** — `trust ladder` + `run×2` flake check default (FINAL-v2 C-10/GEM-11).
- **Do not ship ungrounded self-critique, debate, or MoA on the interactive path** — net-negative at equal budget (FINAL-v2 §6 #7/S-12).
- **Do not allow comma-separated multi-concept SAM strings** — `SAM("navbar, sidebar")` → `SAM_SINGLE_CONCEPT_VIOLATION` (GEM-07).
- **Do not combine `tool_search`+`json_schema`** — HTTP 400 (FINAL-v2 §6 #12).
