/**
 * src/rules/net-01.ts
 * NET-01 — curl|sh hard-block (S-09, FINAL-v4 S-09 hard-block 10-rule tiered policy, ARGON-AUDIT-v2 §2.2).
 * Detects curl/wget piped to shell (curl|sh, wget|bash, etc.) in docs/README/tool-output contexts.
 * Closes Wauters npm-run bypass + nomos chmod miss surface — network pipe-to-shell is hard-block.
 */

export const NET01_ID = "NET-01" as const;
export const NET01_SEVERITY = "block" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  projectRoot?: string;
  filePath?: string;
  content?: string;
  fileList?: string[];
}

export interface RuleVerdict {
  id: typeof NET01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

/** curl piped to shell — e.g. curl ... | sh, curl ... | bash, curl ... | zsh (with/without spaces) */
const CURL_PIPE_RE = /curl\s.*\|\s*(sh|bash|zsh)\b/i;
/** wget variant — e.g. wget ... | sh */
const WGET_PIPE_RE = /wget\s.*\|\s*(sh|bash|zsh)\b/i;
/** Compact form without args — e.g. curl|sh, wget|bash (no space between command and pipe) */
const COMPACT_PIPE_RE = /(?:curl|wget)\s*\|\s*(?:sh|bash|zsh)\b/i;

function findEvidence(src: string): string | undefined {
  for (const line of src.split("\n")) {
    if (CURL_PIPE_RE.test(line) || WGET_PIPE_RE.test(line) || COMPACT_PIPE_RE.test(line)) {
      return line.trim().slice(0, 200);
    }
  }
  return undefined;
}

export function check(ctx: CheckCtx): RuleVerdict {
  const src = ctx.content;

  // Empty/missing content = pass (not unknown) per NET-01 contract
  if (src == null || src.trim().length === 0) {
    return { id: NET01_ID, verdict: "pass", reason: "no content — no curl|sh pipe detected" };
  }

  if (CURL_PIPE_RE.test(src) || WGET_PIPE_RE.test(src) || COMPACT_PIPE_RE.test(src)) {
    return {
      id: NET01_ID,
      verdict: "fail",
      reason: "curl/wget piped to shell (curl|sh / wget|bash) — piped remote execution is hard-blocked (S-09)",
      evidence: findEvidence(src),
    };
  }

  return { id: NET01_ID, verdict: "pass", reason: "no curl|sh / wget pipe-to-shell pattern detected" };
}
