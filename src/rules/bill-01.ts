/**
 * src/rules/bill-01.ts
 * BILL-01 — Billable-loop guard (GEM-05, 04-guardrails).
 * Detects unbounded loops containing service/API calls without cap/limit/max.
 * Minimal real impl: regex heuristics over source text, not pure TODO.
 */

export const BILL01_ID = "BILL-01" as const;
export const BILL01_SEVERITY = "warn" as const; // escalates via app-profile; warn until measured

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  /** Absolute project root (unused in content-only check but kept for interface parity). */
  projectRoot?: string;
  /** File path being checked (for evidence). */
  filePath?: string;
  /** Source text to analyze. If omitted, check returns unknown. */
  content?: string;
}

export interface RuleVerdict {
  id: typeof BILL01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

/** Loop keywords — for / while / forEach / for..of / for..in */
const LOOP_RE = /\b(for\s*\(|while\s*\(|\.forEach\s*\(|for\s*\(\s*(?:let|const|var)\s+\w+\s+of\b|for\s*\(\s*(?:let|const|var)\s+\w+\s+in\b)/;

/** Service/billable call hints — fetch, axios, stripe, openai, supabase insert/select, http request */
const SERVICE_CALL_RE =
  /\b(fetch|axios|stripe|openai|supabase|http\.request|request\(|sendEmail|sendSms|createCharge|api\.)/i;

/** Cap/limit guard hints — cap, limit, max, throttle, budget, batchSize */
const CAP_RE = /\b(cap|limit|max\b|maxCalls|maxCost|throttle|budget|batchSize|MAX_|LIMIT|capped)/i;

/**
 * Heuristic: if content contains a loop that also contains a service call
 * and no cap token nearby, flag as fail.
 */
export function check(ctx: CheckCtx): RuleVerdict {
  const src = ctx.content;
  if (src == null || src.trim().length === 0) {
    return { id: BILL01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  // Quick exit: no loop at all
  if (!LOOP_RE.test(src)) {
    return { id: BILL01_ID, verdict: "pass", reason: "no loop detected" };
  }

  // Has service call somewhere?
  if (!SERVICE_CALL_RE.test(src)) {
    return { id: BILL01_ID, verdict: "pass", reason: "no billable service call in file" };
  }

  // If a cap token exists anywhere in file, treat as mitigated (conservative to reduce FP).
  // Real M4 refinement would do scope-aware analysis per-loop.
  if (CAP_RE.test(src)) {
    return { id: BILL01_ID, verdict: "pass", reason: "cap/limit token present — assume bounded" };
  }

  // Both loop + service call, no cap → fail (warn severity → queue entry)
  // Extract first evidence line
  const lines = src.split("\n");
  let evidence: string | undefined;
  for (const line of lines) {
    if (LOOP_RE.test(line) || SERVICE_CALL_RE.test(line)) {
      evidence = line.trim().slice(0, 200);
      break;
    }
  }

  return {
    id: BILL01_ID,
    verdict: "fail",
    reason: "loop containing service call without cap/limit/max — unbounded billable loop",
    evidence,
  };
}
