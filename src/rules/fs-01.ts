/**
 * src/rules/fs-01.ts
 * FS-01 — Realpath boundary escape (S-09 block, ARGON-AUDIT-v2 §2.2).
 * Half 1 (primary, needs filePath + projectRoot): canonicalize the target
 * through the nearest existing ancestor (symlink-aware) and fail when it
 * lands outside the project root. Half 2: sensitive absolute targets
 * (/etc/passwd|shadow|sudoers, ssh host keys, /root) in LIVE shell commands
 * (toolName set) — docs mentioning them pass.
 * Primarily a gate rule: the tree walker only yields in-root files, so
 * tree scans carry it for completeness (symlinks are skipped, never followed).
 */

import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { SHELL_LIKE_TOOL_RE } from "./context.js";

export const FS01_ID = "FS-01" as const;
export const FS01_SEVERITY = "block" as const;

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
  id: typeof FS01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

const SENSITIVE_ABS_RE = /\/(?:private\/)?etc\/(?:passwd|shadow|sudoers|ssh\/)|\/root(?:\/|$)/;

function expandHome(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

/** Canonical target: realpath through the nearest existing ancestor + lexical rest. Null when unresolvable. */
export function canonicalize(projectRoot: string, target: string): string | null {
  let abs: string;
  try {
    abs = resolve(projectRoot, expandHome(target));
  } catch {
    return null;
  }
  let cur = abs;
  const rest: string[] = [];
  while (!existsSync(cur)) {
    const parent = dirname(cur);
    if (parent === cur) return null;
    rest.unshift(basename(cur));
    cur = parent;
  }
  try {
    return join(realpathSync(cur), ...rest);
  } catch {
    return null;
  }
}

export function check(ctx: CheckCtx): RuleVerdict {
  const content = `${ctx.content ?? ""} ${ctx.args ?? ""}`;

  // Half 1: path containment.
  if (ctx.filePath) {
    if (!ctx.projectRoot) {
      return { id: FS01_ID, verdict: "unknown", reason: "no project root — cannot verify containment (unknown≠pass)" };
    }
    let realRoot: string;
    try {
      realRoot = realpathSync(ctx.projectRoot);
    } catch {
      return { id: FS01_ID, verdict: "unknown", reason: "cannot resolve project root (unknown≠pass)" };
    }
    const canon = canonicalize(ctx.projectRoot, ctx.filePath);
    if (canon === null) {
      return { id: FS01_ID, verdict: "unknown", reason: "cannot resolve target path (unknown≠pass)" };
    }
    if (canon !== realRoot && !canon.startsWith(realRoot + sep)) {
      return {
        id: FS01_ID,
        verdict: "fail",
        reason: `path escapes project root — ${ctx.filePath} resolves outside the boundary (S-09 block)`,
        evidence: canon.slice(0, 200),
      };
    }
  }

  // Half 2: sensitive absolute targets in live shell commands only.
  if (ctx.toolName && SHELL_LIKE_TOOL_RE.test(ctx.toolName) && SENSITIVE_ABS_RE.test(content)) {
    const m = content.match(SENSITIVE_ABS_RE);
    return {
      id: FS01_ID,
      verdict: "fail",
      reason: `sensitive absolute target in shell command — ${m?.[0] ?? "blocked path"} is outside any project (S-09 block)`,
      evidence: m?.[0],
    };
  }

  if (!ctx.filePath && !content.trim()) {
    return { id: FS01_ID, verdict: "unknown", reason: "no path or content to inspect (unknown≠pass)" };
  }
  return { id: FS01_ID, verdict: "pass", reason: "path contained; no sensitive absolute target" };
}
