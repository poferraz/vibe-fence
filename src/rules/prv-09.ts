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
  // 16-digit card-like (with spaces/dashes) — gated by Luhn below: random
  // digit runs are weak, a Luhn-valid number is a real card shape.
  { re: /\b(?:\d[ -]*?){13,19}\b/, label: "card-like" },
  // phone-like E.164 / US — separators (or +country + separators) required:
  // bare 10-digit runs are version numbers and hardware IDs, not phones.
  { re: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/, label: "phone-like" },
  // International 4+6 grouping (e.g. UK +44 7700 900461).
  { re: /\+\d{1,3}[-.\s]\d{4}[-.\s]\d{6}\b/, label: "phone-intl" },
];

/** Card context: the line must talk about cards for a digit run to count. */
const CARD_CONTEXT_RE = /\b(card|pan|cvc|cvv|ccnum|cc_num|cardnumber|card_number|expir)/i;

/** Luhn checksum: separates real card numbers from coincidental digit runs. */
function luhnValid(candidate: string): boolean {
  const d = candidate.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = d.charCodeAt(d.length - 1 - i) - 48;
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

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
    // Card-like digit runs fire only when Luhn-valid AND beside card
    // context (a 13-digit timestamp can be Luhn-valid by chance).
    if (label.startsWith("card-like")) {
      const hit = src.split("\n").find((line) => {
        if (!CARD_CONTEXT_RE.test(line)) return false;
        const candidates = line.match(new RegExp(re.source, "g")) ?? [];
        return candidates.some((c) => luhnValid(c));
      });
      if (!hit) continue;
      return {
        id: PRV09_ID,
        verdict: "fail",
        reason: "fixture contains a Luhn-valid card number — replace with synthetic PII (see tools/anonymize.ts GEM-06)",
        evidence: hit.trim().slice(0, 120),
      };
    }
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
