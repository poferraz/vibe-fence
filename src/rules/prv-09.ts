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
  // phone-like E.164 / US
  { re: /\b\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, label: "phone-like" },
];

/** Synthetic / safe fixture markers — if present, suppress PII match */
const SYNTHETIC_RE = /\b(example\.com|test\.com|@example|FAKE|SYNTHETIC|fixture|mock|dummy|placeholder|safe-for-commit)\b/i;

function isFixturePath(filePath: string | undefined, fileList: string[] | undefined): boolean {
  if (filePath && FIXTURE_PATH_RE.test(filePath)) return true;
  if (fileList && fileList.some((p) => FIXTURE_PATH_RE.test(p))) return true;
  // Without path evidence we still inspect content but mark narrowly;
  // caller can pass fileList for repo-wide "not-applicable" optimization.
  return false;
}

export function check(ctx: CheckCtx): RuleVerdict {
  const src = ctx.content;

  // Missing content → unknown (preserve S-05 invariant)
  if (src == null) {
    return { id: PRV09_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  const hasFixtureScope =
    isFixturePath(ctx.filePath, ctx.fileList) ||
    // Also treat explicit non-empty content that looks fixture-ish as in-scope
    FIXTURE_PATH_RE.test(src);

  // Heuristic: if caller passed fileList and none are fixture paths and no fixture marker in src,
  // treat as not-applicable rather than pass (helps CI four-outcome reporting).
  if (ctx.fileList && ctx.fileList.length > 0 && !hasFixtureScope && src.trim().length > 0) {
    // But still allow single-file check without fileList to proceed — don't force unknown
    // Only emit not-applicable when repo-level fileList is authoritative
    if (ctx.filePath == null) {
      return { id: PRV09_ID, verdict: "not-applicable", reason: "no fixture files in repo" };
    }
  }

  if (src.trim().length === 0) {
    return { id: PRV09_ID, verdict: "not-applicable", reason: "empty fixture / no fixtures" };
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
