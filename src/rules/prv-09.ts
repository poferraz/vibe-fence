/**
 * src/rules/prv-09.ts
 * PRV-09 — Fixture hygiene / PII & secrets in fixtures (GEM-06, 04-guardrails).
 * Detects real-looking PII/secrets committed as test fixtures.
 * If no fixtures found → not-applicable. If offline/no content → unknown (never pass).
 */

export const PRV09_ID = "PRV-09" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  projectRoot?: string;
  filePath?: string;
  content?: string;
  /** Optional explicit file list to classify fixture scope */
  fileList?: string[];
}

export interface RuleVerdict {
  id: typeof PRV09_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

// ---------------------------------------------------------------------------
// Heuristics
// ---------------------------------------------------------------------------

/** Fixture file hints */
const FIXTURE_PATH_RE = /(?:fixtures?|__fixtures__|seed|mocks?|test-data|sample-data)\//i;

/** Real PII / secret patterns that should not appear in fixtures */
const PII_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, label: "email" },
  // SSN-like (US) — 123-45-6789
  { re: /\b\d{3}-\d{2}-\d{4}\b/, label: "ssn-like" },
  // API key-ish prefixes
  { re: /\b(sk_(live|test)_[A-Za-z0-9]{8,}|ghp_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{12,})\b/, label: "api-key" },
  // AWS secret-ish / private key
  { re: /-----BEGIN (?:RSA )?PRIVATE KEY-----/, label: "private-key" },
  // 16-digit card-like (with spaces/dashes)
  { re: /\b(?:\d[ -]*?){13,19}\b/, label: "card-like (weak signal — verify)" },
  // phone-like E.164 / US — separators (or +country + separators) required:
  // bare 10-digit runs are version numbers and hardware IDs, not phones.
  { re: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/, label: "phone-like" },
];

/** Synthetic / safe fixture markers — if present, suppress PII match */
const SYNTHETIC_RE = /\b(example\.com|test\.com|@example|FAKE|SYNTHETIC|fixture|mock|dummy|placeholder|safe-for-commit)\b/i;

function hasScope(ctx: CheckCtx, src: string): boolean {
  // A file's own path decides (a repo merely CONTAINING fixtures elsewhere
  // must not put package.json in scope; content that merely NAMES fixtures —
  // like this rule's own test file — must not self-trigger either).
  // Path-less direct calls fall back to the repo list, then content markers.
  if (ctx.filePath) return FIXTURE_PATH_RE.test(ctx.filePath);
  if (ctx.fileList?.some((p) => FIXTURE_PATH_RE.test(p))) return true;
  return FIXTURE_PATH_RE.test(src);
}

export function check(ctx: CheckCtx): RuleVerdict {
  const src = ctx.content;

  // Missing content → unknown (preserve S-05 invariant)
  if (src == null) {
    return { id: PRV09_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  if (src.trim().length === 0) {
    return { id: PRV09_ID, verdict: "not-applicable", reason: "empty fixture / no fixtures" };
  }

  // Scope gate: outside fixtures this rule cannot speak (author emails in
  // package.json and version numbers in docs are not fixture PII).
  if (!hasScope(ctx, src)) {
    return { id: PRV09_ID, verdict: "not-applicable", reason: "not a fixture file" };
  }

  // Synthetic marker suppresses findings (real anonymizer output, GEM-06)
  if (SYNTHETIC_RE.test(src)) {
    // Still scan but downgrade: if synthetic marker present, assume anonymized
    // Only flag private-key / raw api-key even when marked synthetic (never safe)
    const critical = PII_PATTERNS.filter((p) => p.label === "private-key" || p.label === "api-key");
    for (const { re, label } of critical) {
      const m = src.match(re);
      if (m) {
        return {
          id: PRV09_ID,
          verdict: "fail",
          reason: `fixture contains ${label} — never safe even as example`,
          evidence: m[0].slice(0, 120),
        };
      }
    }
    return { id: PRV09_ID, verdict: "pass", reason: "fixture marked synthetic/example — PII assumed anonymized" };
  }

  for (const { re, label } of PII_PATTERNS) {
    // Skip weak card-like unless strong context — reduce FP on numeric fixtures
    if (label.startsWith("card-like")) continue;
    const m = src.match(re);
    if (m) {
      return {
        id: PRV09_ID,
        verdict: "fail",
        reason: `fixture contains real-looking ${label} — replace with synthetic PII (see tools/anonymize.ts GEM-06)`,
        evidence: m[0].slice(0, 120),
      };
    }
  }

  return { id: PRV09_ID, verdict: "pass", reason: "no real PII/secrets detected in fixture" };
}
