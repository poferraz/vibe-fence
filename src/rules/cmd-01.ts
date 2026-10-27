/**
 * src/rules/cmd-01.ts
 * CMD-01 — Destructive file/perm wipe (S-09 block, ARGON-AUDIT-v2 §2.2).
 * Fails `rm -rf` on / ~ $HOME /root .git (and bare `..`), plus any
 * recursive `chmod 777` — the pair that closes nomos's sole miss.
 * Executable contexts only (live shell, scripts, hooks, workflows,
 * exec-sink lines): docs and `rm -rf dist/` pass.
 */

import { SHELL_LIKE_TOOL_RE, isExecutablePath, isProsePath, sinkLines } from "./context.js";

export const CMD01_ID = "CMD-01" as const;
export const CMD01_SEVERITY = "block" as const;

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
  id: typeof CMD01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

const FORBIDDEN_RM_BARE = new Set(["/", "~", "$HOME", "/root", ".git", "./.git", ".."]);

function isRmWipe(segment: string): string | null {
  const m = segment.match(/^\s*(?:sudo\s+)?rm\s+(.*)$/);
  if (!m) return null;
  const rest = m[1] ?? "";
  const tokens = rest.split(/\s+/).filter(Boolean);
  const flags = tokens.filter((t) => t.startsWith("-")).join(" ");
  const longR = /--recursive\b/.test(flags);
  const longF = /--force\b/.test(flags);
  const shortCluster = tokens.filter((t) => /^-[^-]/.test(t)).join("");
  const hasR = longR || /[rR]/.test(shortCluster);
  const hasF = longF || /f/.test(shortCluster);
  if (!hasR || !hasF) return null;
  for (const t of tokens) {
    if (t.startsWith("-")) continue;
    const norm = t.replace(/^["']|["']$/g, "").replace(/\$\{HOME\}/g, "$HOME").replace(/\/{2,}/g, "/");
    const bare = norm.replace(/\/+$/, "") || "/";
    if (FORBIDDEN_RM_BARE.has(bare)) return t;
    if (bare.endsWith("/*") && FORBIDDEN_RM_BARE.has(bare.slice(0, -2) || "/")) return t;
  }
  return null;
}

function isChmod777(segment: string): boolean {
  const m = segment.match(/^\s*(?:sudo\s+)?chmod\s+(.*)$/);
  if (!m) return false;
  const rest = m[1] ?? "";
  const recursive = /(?:^|\s)(?:-R|--recursive)(?:\s|$)/.test(` ${rest} `) || /(?:^|\s)-[a-zA-Z]*R[a-zA-Z]*(?:\s|$)/.test(` ${rest} `);
  return recursive && /\b777\b/.test(rest);
}

function scanScope(scope: string): { verdict: "fail"; reason: string; evidence: string } | null {
  for (const line of scope.split("\n")) {
    for (const segment of line.split(/&&|\|\||[;|]/)) {
      const rmHit = isRmWipe(segment);
      if (rmHit) {
        return {
          verdict: "fail",
          reason: `recursive force-delete of ${rmHit} — wiping root/home/.git is never routine (S-09 block)`,
          evidence: segment.trim().slice(0, 200),
        };
      }
      if (isChmod777(segment)) {
        return {
          verdict: "fail",
          reason: "recursive chmod 777 — world-writable tree is never routine (S-09 block)",
          evidence: segment.trim().slice(0, 200),
        };
      }
    }
  }
  return null;
}

export function check(ctx: CheckCtx): RuleVerdict {
  const src = `${ctx.content ?? ""} ${ctx.args ?? ""}`;
  if (!src.trim()) {
    return { id: CMD01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  // Gate mode (live shell): the command is action.
  if (ctx.toolName && SHELL_LIKE_TOOL_RE.test(ctx.toolName)) {
    const hit = scanScope(src);
    if (hit) return { id: CMD01_ID, ...hit };
    return { id: CMD01_ID, verdict: "pass", reason: "no destructive wipe pattern detected" };
  }
  if (ctx.toolName) {
    return { id: CMD01_ID, verdict: "pass", reason: "not a shell invocation" };
  }

  // Tree mode: executable files and exec-sink lines in code only.
  const scopes: string[] = isExecutablePath(ctx.filePath) ? [src] : [];
  if (!isProsePath(ctx.filePath)) scopes.push(...sinkLines(src));
  for (const scope of scopes) {
    const hit = scanScope(scope);
    if (hit) return { id: CMD01_ID, ...hit };
  }
  return { id: CMD01_ID, verdict: "pass", reason: "no executable destructive wipe pattern detected" };
}
