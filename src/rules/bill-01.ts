/**
 * src/rules/bill-01.ts
 * BILL-01 — Billable-loop guard (GEM-05, 04-guardrails).
 * Detects unbounded loops containing service/API calls without cap/limit/max.
 * Minimal real impl: regex heuristics over source text, not pure TODO.
 */

import { isProsePath, liveCode, stripStrings } from "./context.js";

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

/** Statement loops — for / while / forEach / for..of / for..in (windowed
 * proximity to the billable call, as before). */
const STMT_LOOP_RE = /\b(for\s*\(|while\s*\(|\.forEach\s*\(|for\s*\(\s*(?:let|const|var)\s+\w+\s+of\b|for\s*\(\s*(?:let|const|var)\s+\w+\s+in\b)/;
/** Callback loops — .map / setInterval. A bare same-file call elsewhere is
 * not iteration: these require the billable call on the SAME line, or a
 * one-off fetch next to a local .map warns (review finding).
 * Bare setTimeout is deliberately absent: a one-shot delayed call is a
 * debounce, not a loop (recursive polls surface via setInterval twins). */
const CALLBACK_LOOP_RE = /\.(?:map)\s*\(|setInterval\s*\(/;

/** Service/billable call hints — vendor names + generic API-call shapes */
const SERVICE_CALL_RE =
  /\b(fetch|axios|stripe|openai|supabase|twilio|resend|anthropic|bedrock|http\.request|request\(|sendEmail|sendSms|createCharge|api\s*\(|api\.|\.messages\.create|\.charges\.create|\.emails\.send)/i;

/** Cap/limit guard hints — cap, limit, max, throttle, budget, batchSize, slice(, take( */
const CAP_RE = /\b(cap|limit|max\b|maxCalls|maxCost|throttle|budget|batchSize|MAX_|LIMIT|capped|slice\s*\(|take\s*\()/i;
const RETRY_BOUND_RE = /\bif\s*\([^)]*(?:attempt|retr(?:y|ies)|count|calls)\w*[^)]*(?:[<>]=?|===?)\s*\d+[^)]*\)|\b(?:signal|controller)\.aborted\b/i;

function closingDelimiter(code: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    if (code[i] === open) depth++;
    else if (code[i] === close && --depth === 0) return i;
  }
  return -1;
}

/** Same-function timers only: a single delayed request is not polling. */
function recursivePoll(code: string): string | null {
  const declarations = /\b(?:async\s+)?function\s+([\w$]+)\s*\([^)]*\)\s*\{|\b(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>\s*\{/g;
  for (const match of code.matchAll(declarations)) {
    const name = match[1] ?? match[2];
    if (!name || match.index === undefined) continue;
    const start = match.index + match[0].length - 1;
    const end = closingDelimiter(code, start, "{", "}");
    if (end < 0) continue;
    const body = code.slice(start, end + 1);
    const escaped = name.replace(/[$]/g, "\\$");
    const reschedules = new RegExp(`\\bsetTimeout\\s*\\(\\s*(?:${escaped}\\b|(?:async\\s*)?\\(\\s*\\)\\s*=>\\s*\\{?\\s*${escaped}\\s*\\()`);
    if (reschedules.test(body) && SERVICE_CALL_RE.test(body) && !CAP_RE.test(body) && !RETRY_BOUND_RE.test(body)) return name;
  }
  return null;
}

/**
 * Heuristic: if content contains a loop that also contains a service call
 * and no cap token nearby, flag as fail.
 */
export function check(ctx: CheckCtx): RuleVerdict {
  const src = ctx.content;
  if (src == null || src.trim().length === 0) {
    return { id: BILL01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  const live = src.split("\n").map((line) => stripStrings(liveCode(line))).join("\n");
  if (!isProsePath(ctx.filePath)) {
    const poll = recursivePoll(live);
    if (poll) return { id: BILL01_ID, verdict: "fail", reason: "recursive timer repeatedly calls a service without a visible bound", evidence: poll };
    for (const match of live.matchAll(/\bsetInterval\s*\(/g)) {
      const start = match.index! + match[0].length - 1;
      const end = closingDelimiter(live, start, "(", ")");
      if (end < 0) continue;
      const call = live.slice(start, end + 1);
      if (SERVICE_CALL_RE.test(call) && !CAP_RE.test(call) && !RETRY_BOUND_RE.test(call)) return { id: BILL01_ID, verdict: "fail", reason: "repeating timer calls a service without a visible bound" };
    }
  }

  // Quick exit: no loop at all
  if (!STMT_LOOP_RE.test(src) && !CALLBACK_LOOP_RE.test(src)) {
    return { id: BILL01_ID, verdict: "pass", reason: "no loop detected" };
  }

  // Has service call somewhere?
  if (!SERVICE_CALL_RE.test(src)) {
    return { id: BILL01_ID, verdict: "pass", reason: "no billable service call in file" };
  }

  // If a cap token exists anywhere in file, treat as mitigated (conservative to reduce FP).
  // Prose files never execute loops — skip (docs describing loops are mentions).
  if (isProsePath(ctx.filePath)) {
    return { id: BILL01_ID, verdict: "pass", reason: "prose file — loops here do not execute" };
  }
  // Proximity scoping: the loop keyword and the service call must sit within
  // 5 lines of each other, with no cap token within 10 — a whole-file AND
  // flags any file that merely mentions loops and vendors (M4 refinement).
  // Analysis runs on live code with strings blanked: a loop inside a string
  // is a fixture assertion, not a loop.
  const lines = src.split("\n").map((l) => stripStrings(liveCode(l)));
  for (let loopIdx = 0; loopIdx < lines.length; loopIdx++) {
    const line = lines[loopIdx] ?? "";
    const isStmt = STMT_LOOP_RE.test(line);
    const isCallback = !isStmt && CALLBACK_LOOP_RE.test(line);
    if (!isStmt && !isCallback) continue;
    // Callback loops (.map/setInterval) must share the line with the
    // billable call — a one-off fetch next to a local .map is not a loop.
    if (isCallback && !SERVICE_CALL_RE.test(line)) continue;
    const near = lines.slice(Math.max(0, loopIdx - 5), loopIdx + 6);
    if (!near.some((l) => SERVICE_CALL_RE.test(l))) continue;
    const wider = lines.slice(Math.max(0, loopIdx - 10), loopIdx + 11);
    if (wider.some((l) => CAP_RE.test(l))) continue;
    // Loop + nearby service call, no nearby cap → fail (warn → queue entry)
    return {
      id: BILL01_ID,
      verdict: "fail",
      reason: "loop containing service call without cap/limit/max — unbounded billable loop",
      evidence: lines[loopIdx]?.trim().slice(0, 200),
    };
  }
  return { id: BILL01_ID, verdict: "pass", reason: "no unbounded service loop detected" };
}
