/**
 * src/rules/net-01.ts
 * NET-01 — curl|sh hard-block (S-09, FINAL-v4 S-09 hard-block 10-rule tiered policy, ARGON-AUDIT-v2 §2.2).
 * Detects curl/wget piped to shell (curl|sh, wget|bash, etc.) in docs/README/tool-output contexts.
 * Closes Wauters npm-run bypass + nomos chmod miss surface — network pipe-to-shell is hard-block.
 */

import { isExecutablePath, isProsePath, sinkLines } from "./context.js";

export const NET01_ID = "NET-01" as const;
export const NET01_SEVERITY = "block" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  projectRoot?: string;
  filePath?: string;
  content?: string;
  fileList?: string[];
  toolName?: string;
  args?: string;
}

export interface RuleVerdict {
  id: typeof NET01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

/** curl piped to shell — e.g. curl ... | sh, curl ... | bash, curl ... | zsh (with/without spaces; optional sudo) */
const CURL_PIPE_RE = /curl\s.*\|\s*(?:sudo\s+)?(sh|bash|zsh)\b/i;
/** wget variant — e.g. wget ... | sh */
const WGET_PIPE_RE = /wget\s.*\|\s*(?:sudo\s+)?(sh|bash|zsh)\b/i;
/** Compact form without args — e.g. curl|sh, wget|bash (no space between command and pipe) */
const COMPACT_PIPE_RE = /(?:curl|wget)\s*\|\s*(?:sudo\s+)?(?:sh|bash|zsh)\b/i;

function findEvidence(src: string): string | undefined {
  for (const line of src.split("\n")) {
    if (CURL_PIPE_RE.test(line) || WGET_PIPE_RE.test(line) || COMPACT_PIPE_RE.test(line)) {
      return line.trim().slice(0, 200);
    }
  }
  return undefined;
}

/** Execution sinks that re-arm detection inside quoted text:
 * node -e "exec('curl|sh')" executes the payload despite the quotes. */
const EXEC_SINK_RE = /\b(?:node\s+-e|python3?\s+-c|sh\s+-c|bash\s+-c|exec\s*\(|eval\s*\(|spawn\s*\()/;

/** Shared pipe-to-shell detector (also used by SUP-01's scripts scan).
 * Raw-text by contract: package.json scripts ARE quoted strings, so
 * callers in shell context must strip literals first (see below). */
export function hasPipeToShell(src: string): boolean {
  return CURL_PIPE_RE.test(src) || WGET_PIPE_RE.test(src) || COMPACT_PIPE_RE.test(src);
}

/** Drop single/double-quoted spans and #-comments so instructional text
 * ("do not run curl X | sh") and comments don't read as pipelines.
 * Token separators survive: curl "https://x/i" | sh still matches. */
export function stripShellLiterals(src: string): string {
  return src
    .split("\n")
    .map((line) => {
      let out = "";
      let quote: string | null = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]!;
        if (quote) {
          if (ch === quote) {
            quote = null;
            out += " ";
          }
          continue;
        }
        if (ch === "'" || ch === '"') {
          quote = ch;
          continue;
        }
        if (ch === "#") break;
        out += ch;
      }
      return out;
    })
    .join("\n");
}

function hasPipe(src: string): boolean {
  return hasPipeToShell(src);
}

export function check(ctx: CheckCtx): RuleVerdict {
  const src = ctx.content;

  if (src == null || src.trim().length === 0) {
    return { id: NET01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  // Quoted spans and comments are not pipelines ("do not run curl X |
  // sh" must pass) — strip before matching, except where an execution
  // sink makes the quoted text the payload (exec("curl|sh") still fires).
  const code = stripShellLiterals(src);
  const reArmed = EXEC_SINK_RE.test(src);

  // Gate mode (live tool call): arg content is action — any match fails.
  if (ctx.toolName) {
    if (hasPipe(code) || (reArmed && hasPipe(src))) {
      return {
        id: NET01_ID,
        verdict: "fail",
        reason: "curl/wget piped to shell (curl|sh / wget|bash) — piped remote execution is hard-blocked (S-09)",
        evidence: findEvidence(code),
      };
    }
    return { id: NET01_ID, verdict: "pass", reason: "no curl|sh / wget pipe-to-shell pattern detected" };
  }

  // Tree mode: docs discussing the attack must pass — fire only where the
  // payload would execute: executable files, or exec-sink lines in code.
  // Prose skips sink analysis entirely (execution is gated live).
  const scopes: string[] = isExecutablePath(ctx.filePath) ? [code] : [];
  // Exec-sink lines stay raw: inside exec("...") the quoted text IS the payload.
  if (!isProsePath(ctx.filePath)) scopes.push(...sinkLines(src));
  for (const scope of scopes) {
    if (hasPipe(scope)) {
      return {
        id: NET01_ID,
        verdict: "fail",
        reason: "curl/wget piped to shell (curl|sh / wget|bash) — piped remote execution is hard-blocked (S-09)",
        evidence: findEvidence(scope),
      };
    }
  }

  return { id: NET01_ID, verdict: "pass", reason: "no executable curl|sh / wget pipe-to-shell pattern detected" };
}
