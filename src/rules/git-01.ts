/**
 * src/rules/git-01.ts
 * GIT-01 — Uncheckpointed destructive git (S-09 block, ARGON-AUDIT-v2 §2.2).
 * Fails `git push --force` to main/master (or to an undeterminable ref) and
 * any agent-issued `git reset --hard` (safe alternative: checkpoint first).
 * `--force-with-lease` and explicit feature-branch targets pass — those are
 * the blessed flows, and flagging them would train bypass (ARGON rebase-flow
 * warning). Executable contexts only: live shell, scripts, hooks, workflows,
 * exec-sink lines.
 */

import { execFileSync } from "node:child_process";
import { SHELL_LIKE_TOOL_RE, isExecutablePath, isProsePath, sinkLines } from "./context.js";

export const GIT01_ID = "GIT-01" as const;
export const GIT01_SEVERITY = "block" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  content?: string;
  toolName?: string;
  args?: string;
  projectRoot?: string;
  filePath?: string;
  fileList?: string[];
}

export interface RuleVerdict {
  id: typeof GIT01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

function currentBranch(projectRoot: string): string | null {
  try {
    const out = execFileSync("git", ["branch", "--show-current"], {
      cwd: projectRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

interface PushAnalysis {
  isForcePush: boolean;
  /** Destination refs (empty when the command names none). */
  targets: string[];
}

/** Parse one `git push` segment. Returns null when it is not a push at all. */
function analyzePush(segment: string): PushAnalysis | null {
  const m = segment.match(/^\s*(?:sudo\s+)?git\s+push\b(.*)$/);
  if (!m) return null;
  const rest = (m[1] ?? "").trim();
  if (!rest) return { isForcePush: false, targets: [] };
  const tokens = rest.split(/\s+/).filter(Boolean);
  let bareForce = false;
  const positionals: string[] = [];
  for (const t of tokens) {
    if (t.startsWith("--")) {
      // Bare --force forces; --force-with-lease/--force-if-includes are the safe variants.
      if (/^--force(?![\w-])/.test(t)) bareForce = true;
      continue;
    }
    if (/^-[^-]/.test(t)) {
      if (/^-[a-zA-Z]*f[a-zA-Z]*$/.test(t)) bareForce = true; // -f (possibly bundled: -fu)
      continue;
    }
    positionals.push(t);
  }
  // git push [<remote>] [<refspec>...]: a lone positional is the remote.
  const refspecs = positionals.length >= 2 ? positionals.slice(1) : [];
  const targets: string[] = [];
  let plusForced = false;
  for (const r of refspecs) {
    if (r.startsWith("+")) plusForced = true;
    const dst = r.replace(/^\+/, "").split(":").pop() ?? "";
    if (dst && !dst.startsWith("-")) targets.push(dst);
  }
  return { isForcePush: bareForce || plusForced, targets };
}

function isResetHard(segment: string): boolean {
  return /^\s*(?:sudo\s+)?git\s+reset\s+--hard\b/.test(segment);
}

export function check(ctx: CheckCtx): RuleVerdict {
  const src = `${ctx.content ?? ""} ${ctx.args ?? ""}`;
  if (!src.trim()) {
    return { id: GIT01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  const liveShell = !!ctx.toolName && SHELL_LIKE_TOOL_RE.test(ctx.toolName);
  if (ctx.toolName && !liveShell) {
    return { id: GIT01_ID, verdict: "pass", reason: "not a shell invocation" };
  }
  const scopes: string[] = liveShell || isExecutablePath(ctx.filePath) ? [src] : [];
  if (!liveShell && !isProsePath(ctx.filePath)) scopes.push(...sinkLines(src));
  // Tree scan of a non-executable file with no sink lines: nothing actionable.
  if (scopes.length === 0) {
    return { id: GIT01_ID, verdict: "pass", reason: "no executable git context" };
  }

  for (const scope of scopes) {
    for (const line of scope.split("\n")) {
      for (const segment of line.split(/&&|\|\||[;|]/)) {
        if (isResetHard(segment)) {
          return {
            id: GIT01_ID,
            verdict: "fail",
            reason: "git reset --hard discards work — checkpoint first (`vibe-fence checkpoint --action ...`) (S-09 block)",
            evidence: segment.trim().slice(0, 200),
          };
        }
        const push = analyzePush(segment);
        if (!push || !push.isForcePush) continue;
        if (push.targets.some((t) => t === "main" || t === "master")) {
          return {
            id: GIT01_ID,
            verdict: "fail",
            reason: "git push --force to main/master rewrites public history (S-09 block)",
            evidence: segment.trim().slice(0, 200),
          };
        }
        if (push.targets.length > 0) continue; // explicit non-main ref: blessed rebase flow
        // No ref info: resolve the live branch when we can, else fail closed.
        if (liveShell && ctx.projectRoot) {
          const branch = currentBranch(ctx.projectRoot);
          if (branch && branch !== "main" && branch !== "master") continue;
        }
        return {
          id: GIT01_ID,
          verdict: "fail",
          reason: "git push --force with undeterminable target — name the branch explicitly (S-09 block)",
          evidence: segment.trim().slice(0, 200),
        };
      }
    }
  }

  return { id: GIT01_ID, verdict: "pass", reason: "no destructive git operation detected" };
}
