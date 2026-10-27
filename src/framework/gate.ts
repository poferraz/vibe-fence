/**
 * src/framework/gate.ts — Enforced tier tool-call gate (Oct 30).
 * One tool call ({tool, args}) → block findings. Same rule engine as
 * `vibe-fence check`, scoped to the live call. Mapping: FS-01 on any path
 * arg; SEC-01 + DB-01 on writes; SEC-02 on reads; SEC-02 + NET-01 + CMD-01
 * + GIT-01 + SUP-01 + FS-01 on shell. (SEC-03/PRV-09/BILL-01 are tree-time
 * rules and stay out of the live path.)
 * Unknown tools pass (FP budget C-01); tree scans + git hooks backstop.
 * Content over the cap is truncated (documented fail-open past 64KB on a
 * single call; full-file `check` covers the rest).
 */

import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { check as checkSec01, SEC01_ID, SEC01_SEVERITY } from "../rules/sec-01.js";
import { check as checkSec02, SEC02_ID, SEC02_SEVERITY } from "../rules/sec-02.js";
import { check as checkNet01, NET01_ID, NET01_SEVERITY } from "../rules/net-01.js";
import { check as checkFs01, FS01_ID, FS01_SEVERITY } from "../rules/fs-01.js";
import { check as checkCmd01, CMD01_ID, CMD01_SEVERITY } from "../rules/cmd-01.js";
import { check as checkGit01, GIT01_ID, GIT01_SEVERITY } from "../rules/git-01.js";
import { check as checkSup01, SUP01_ID, SUP01_SEVERITY } from "../rules/sup-01.js";
import { check as checkDb01, DB01_ID, DB01_SEVERITY } from "../rules/db-01.js";
import { READ_LIKE_TOOL_RE as READ_LIKE, WRITE_LIKE_TOOL_RE as WRITE_LIKE, SHELL_LIKE_TOOL_RE as SHELL_LIKE } from "../rules/context.js";

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  /** Project root for containment/branch resolution (CLI defaults to cwd). */
  projectRoot?: string;
}

export interface GateFinding {
  ruleId: string;
  severity: string;
  reason: string;
  evidence?: string;
}

const MAX_CONTENT = 64 * 1024;

function stringsOf(value: unknown, out: string[], depth: number): void {
  if (out.join(" ").length > MAX_CONTENT || depth > 6) return;
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) stringsOf(v, out, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) stringsOf(v, out, depth + 1);
  }
}

function joinedStrings(args: Record<string, unknown>): string {
  const out: string[] = [];
  stringsOf(args, out, 0);
  const joined = out.join("\n");
  return joined.length > MAX_CONTENT ? joined.slice(0, MAX_CONTENT) : joined;
}

function firstString(args: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = args[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function shellVerb(command: string): string {
  const first = command.trim().split(/\s+/, 1)[0] ?? "";
  const slash = first.lastIndexOf("/");
  return slash === -1 ? first : first.slice(slash + 1);
}

/**
 * When bash executes a LOCAL script, audit the script body too — otherwise a
 * payload laundered through a committed file bypasses command-text rules.
 * PATH commands, missing files, and oversize/binary files are skipped
 * (audited at commit time by `check` instead).
 */
function localScriptBody(command: string, projectRoot: string | undefined): string | null {
  if (!projectRoot) return null;
  const first = command.trim().split(/\s+/, 1)[0] ?? "";
  if (!first || !first.includes("/")) return null; // bare word → PATH command, not a file
  if (first.includes("\0")) return null;
  const abs = resolve(projectRoot, first);
  try {
    const st = statSync(abs);
    if (!st.isFile() || st.size > MAX_CONTENT) return null;
    return readFileSync(abs, "utf-8");
  } catch {
    return null;
  }
}

export function evaluateToolCall(call: ToolCall): GateFinding[] {
  const tool = (call.tool ?? "").trim();
  const args = call.args ?? {};
  const projectRoot = call.projectRoot;
  const findings: GateFinding[] = [];
  const push = (ruleId: string, severity: string, v: { verdict: string; reason: string; evidence?: string }): void => {
    if (v.verdict !== "fail") return;
    const f: GateFinding = { ruleId, severity, reason: v.reason };
    if (v.evidence) f.evidence = v.evidence;
    findings.push(f);
  };
  const filePath = firstString(args, ["filePath", "file_path", "path", "file"]);

  // Every tool with a path arg is containment-checked (FS-01 needs the root;
  // without it the rule honestly reports unknown, which never blocks).
  if (filePath && projectRoot) {
    push(FS01_ID, FS01_SEVERITY, checkFs01({ filePath, projectRoot }));
  }

  if (WRITE_LIKE.test(tool)) {
    const content = joinedStrings(args);
    push(SEC01_ID, SEC01_SEVERITY, checkSec01({ content, filePath, projectRoot }));
    push(DB01_ID, DB01_SEVERITY, checkDb01({ content, filePath, projectRoot }));
    return findings;
  }

  if (READ_LIKE.test(tool)) {
    const content = `${filePath ?? ""}\n${joinedStrings(args)}`;
    push(SEC02_ID, SEC02_SEVERITY, checkSec02({ content, toolName: tool, projectRoot }));
    return findings;
  }

  if (SHELL_LIKE.test(tool)) {
    const command = firstString(args, ["command", "cmd", "script", "input"]) ?? joinedStrings(args);
    if (command.trim().length === 0) return findings;
    push(SEC02_ID, SEC02_SEVERITY, checkSec02({ content: command, toolName: shellVerb(command), args: command, projectRoot }));
    push(NET01_ID, NET01_SEVERITY, checkNet01({ content: command, toolName: tool, projectRoot }));
    push(CMD01_ID, CMD01_SEVERITY, checkCmd01({ content: command, toolName: tool, projectRoot }));
    push(GIT01_ID, GIT01_SEVERITY, checkGit01({ content: command, toolName: tool, projectRoot }));
    push(SUP01_ID, SUP01_SEVERITY, checkSup01({ content: command, toolName: tool, projectRoot }));
    push(FS01_ID, FS01_SEVERITY, checkFs01({ content: command, toolName: tool, projectRoot }));
    // Local script execution: audit the body, same rules, attributed to the file.
    const body = localScriptBody(command, projectRoot);
    if (body) {
      const first = command.trim().split(/\s+/, 1)[0] ?? "";
      const f = (ruleId: string, severity: string, v: { verdict: string; reason: string; evidence?: string }): void => {
        if (v.verdict !== "fail") return;
        // Re-attribute: the payload is in the script, not the command line.
        push(ruleId, severity, { verdict: v.verdict, reason: `${v.reason} [in ${first}]`, evidence: v.evidence });
      };
      f(SEC02_ID, SEC02_SEVERITY, checkSec02({ content: body, toolName: "bash", projectRoot }));
      f(NET01_ID, NET01_SEVERITY, checkNet01({ content: body, toolName: "bash", projectRoot }));
      f(CMD01_ID, CMD01_SEVERITY, checkCmd01({ content: body, toolName: "bash", projectRoot }));
      f(GIT01_ID, GIT01_SEVERITY, checkGit01({ content: body, toolName: "bash", projectRoot }));
      f(SUP01_ID, SUP01_SEVERITY, checkSup01({ content: body, toolName: "bash", projectRoot }));
    }
    return findings;
  }

  return findings;
}
