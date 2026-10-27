/**
 * src/rules/sec-01.ts
 * SEC-01 — Client-bundle secret hard-block (S-09 block, FINAL-v4 S-09).
 * `NEXT_PUBLIC_*` / `VITE_*` / `PUBLIC_*` / `EXPO_PUBLIC_*` values are baked
 * into browser JS — a secret under a public prefix is published, not stored.
 * Zero-FP design (04 A-01): fail only when a public prefix pairs with a
 * secret-shaped keyword (SECRET, SERVICE_ROLE, PRIVATE). A bare public var
 * (NEXT_PUBLIC_API_URL) is pass. Placeholder values, `.env.example`, and
 * markdown docs are suppressed (mention ≠ leak).
 * Severity: block. Rationale for skipping the warn-first two-phase
 * (severity-policy.json secrets_discipline): the keyword pairing is already
 * high-precision, and S-09 lists SEC-01 as a zero-FP hard-block (exit 1,
 * all tiers). Per-var allowlist arrives with `vibe-fence check` (Oct 29–30).
 */

import { isQuotedOrCommented } from "./context.js";

export const SEC01_ID = "SEC-01" as const;
export const SEC01_SEVERITY = "block" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  content?: string;
  toolName?: string;
  args?: string;
  // Compat with Bill01/Prv09/Net01/Sec02 CheckCtx union (index.ts CheckCtx)
  projectRoot?: string;
  filePath?: string;
  fileList?: string[];
}

export interface RuleVerdict {
  id: typeof SEC01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

// Public-prefix env names per framework: Next.js / Vite / Astro / Expo.
const PUBLIC_PREFIX_RE = /\b(?:NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_|PUBLIC_)([A-Z0-9_]+)/g;

// Secret-shaped keywords that must never sit under a public prefix.
const SECRET_KEYWORD_RE = /(?:SECRET|SERVICE_ROLE|PRIVATE)/;

// Placeholder values are docs/templates, not leaks.
const PLACEHOLDER_RE =
  /\b(?:your[-_ ]?(?:key|secret|token|value)|changeme|example|sample|dummy|placeholder|xxx+|test123|insert[-_ ]?here)\b/i;

// Files where a match is documentation, not a leak.
function isDocLike(filePath: string | undefined): boolean {
  if (!filePath) return false;
  return /(?:\.env\.example|\.example\.env|README(?:\..*)?|CHANGELOG(?:\..*)?|\.mdx?)$/i.test(filePath);
}

export function check(ctx: CheckCtx): RuleVerdict {
  const content = ctx.content ?? "";
  const args = ctx.args ?? "";
  const haystack = `${content} ${args}`;

  if (!haystack.trim()) {
    return { id: SEC01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  if (isDocLike(ctx.filePath)) {
    return { id: SEC01_ID, verdict: "pass", reason: "doc/template file — mention ≠ leak" };
  }

  PUBLIC_PREFIX_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PUBLIC_PREFIX_RE.exec(haystack)) !== null) {
    const suffix = m[1] ?? "";
    if (!SECRET_KEYWORD_RE.test(suffix)) continue;
    const varName = m[0];
    // Placeholder on the same line → template, not a leak.
    const lineStart = haystack.lastIndexOf("\n", m.index) + 1;
    const lineEnd = haystack.indexOf("\n", m.index + varName.length);
    const line = haystack.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (PLACEHOLDER_RE.test(line)) continue;
    // Quoted or commented on its line → mention (fixture/docs), not a reference.
    if (isQuotedOrCommented(line, m.index - lineStart)) continue;
    return {
      id: SEC01_ID,
      verdict: "fail",
      reason:
        `client-bundle secret hard-block: ${varName} — public-prefix env values ship in browser JS; ` +
        `move the secret server-side (Server Action / route handler) and keep only the public value client-side (S-09 block)`,
      evidence: line.trim().slice(0, 200),
    };
  }

  return { id: SEC01_ID, verdict: "pass", reason: "no public-prefix secret pairing detected" };
}
