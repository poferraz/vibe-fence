/**
 * src/check.ts — `vibe-fence check` engine (Guarded tier, Oct 29–30).
 * Runs REGISTRY over a project tree. Any BLOCK fail → exit 1.
 * Deterministic: sorted files, stable rule order, no model calls.
 * Exit contract: 1 iff any finding has verdict "fail" with severity "block".
 * Warn-grade fails queue (shown as WARN) but never gate. Unknowns are
 * reported (unknown≠pass for verdicts) but do not fail the run;
 * a future --strict flag will promote them. not-applicable is dropped.
 */

import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { REGISTRY } from "./rules/index.js";

export interface CheckFinding {
  file: string;
  ruleId: string;
  severity: string;
  verdict: "fail" | "unknown";
  reason: string;
  evidence?: string;
}

export interface CheckReport {
  filesScanned: number;
  filesSkipped: number;
  fails: number;
  /** Fails with severity "block" — the only ones that gate (exit 1). Warn fails queue, never gate. */
  blocks: number;
  unknowns: number;
  findings: CheckFinding[];
}

export interface CheckOptions {
  maxFiles?: number;
  maxBytesPerFile?: number;
}

const SKIP_DIRS = new Set([".git", "node_modules", ".fence", "dist"]);
const BINARY_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".pdf",
  ".zip", ".tar", ".gz", ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".mov",
]);

export const DEFAULT_MAX_FILES = 5000;
export const DEFAULT_MAX_BYTES = 512 * 1024;

function listFiles(root: string, maxFiles: number): { files: string[]; skipped: number } {
  const files: string[] = [];
  let skipped = 0;
  const walk = (dir: string): void => {
    if (files.length + skipped >= maxFiles) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      // Never follow symlinks: a link can point outside the root, and the
      // scanner must not read out-of-root bytes. Following happens at tool
      // time, where the FS-01 gate blocks escapes.
      if (lstatSync(full).isSymbolicLink()) {
        skipped++;
        continue;
      }
      const st = statSync(full);
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full);
        continue;
      }
      const rel = relative(root, full);
      const lower = rel.toLowerCase();
      const dot = lower.lastIndexOf(".");
      const ext = dot === -1 ? "" : lower.slice(dot);
      // L7: 0-byte files carry no signal — every rule would report unknown
      // (5 .gitkeeps × 9 rules = 45 unknowns of pure noise). Skip, don't scan.
      if (BINARY_EXTS.has(ext) || st.size === 0 || st.size > DEFAULT_MAX_BYTES) {
        skipped++;
        continue;
      }
      files.push(rel);
      if (files.length + skipped >= maxFiles) return;
    }
  };
  walk(root);
  return { files: files.sort(), skipped };
}

export function runCheck(projectRoot: string, opts: CheckOptions = {}): CheckReport {
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES;
  const maxBytes = opts.maxBytesPerFile ?? DEFAULT_MAX_BYTES;
  const findings: CheckFinding[] = [];
  let unknowns = 0;

  if (!existsSync(projectRoot)) {
    return { filesScanned: 0, filesSkipped: 0, fails: 0, blocks: 0, unknowns: 0, findings };
  }

  const { files, skipped } = listFiles(projectRoot, maxFiles);
  const ruleIds = Object.keys(REGISTRY).sort();
  for (const rel of files) {
    let content: string;
    try {
      const st = statSync(join(projectRoot, rel));
      if (st.size > maxBytes) continue;
      content = readFileSync(join(projectRoot, rel), "utf-8");
    } catch {
      continue;
    }
    for (const id of ruleIds) {
      const entry = REGISTRY[id];
      if (!entry) continue;
      const v = entry.check({ content, filePath: rel, projectRoot, fileList: files });
      if (v.verdict === "fail") {
        const f: CheckFinding = { file: rel, ruleId: id, severity: entry.severity, verdict: "fail", reason: v.reason };
        if (v.evidence) f.evidence = v.evidence;
        findings.push(f);
      } else if (v.verdict === "unknown") {
        unknowns++;
        const f: CheckFinding = { file: rel, ruleId: id, severity: entry.severity, verdict: "unknown", reason: v.reason };
        if (v.evidence) f.evidence = v.evidence;
        findings.push(f);
      }
    }
  }

  const fails = findings.filter((f) => f.verdict === "fail").length;
  const blocks = findings.filter((f) => f.verdict === "fail" && f.severity === "block").length;
  return { filesScanned: files.length, filesSkipped: skipped, fails, blocks, unknowns, findings };
}

export function exitCodeForReport(report: CheckReport): 0 | 1 {
  return report.blocks > 0 ? 1 : 0;
}

export function formatHuman(report: CheckReport): string {
  const lines: string[] = [];
  for (const f of report.findings.filter((x) => x.verdict === "fail" && x.severity === "block")) {
    lines.push(`FAIL ${f.ruleId} [${f.severity}] ${f.file}`);
    lines.push(`  ${f.reason}`);
    if (f.evidence) lines.push(`  evidence: ${f.evidence}`);
  }
  for (const f of report.findings.filter((x) => x.verdict === "fail" && x.severity !== "block")) {
    lines.push(`WARN ${f.ruleId} [${f.severity}] ${f.file}`);
    lines.push(`  ${f.reason}`);
    if (f.evidence) lines.push(`  evidence: ${f.evidence}`);
  }
  const unknownCount = report.unknowns;
  if (unknownCount > 0) {
    lines.push(`(${unknownCount} unknown — inspect manually; unknown≠pass)`);
  }
  lines.push(
    `check: ${report.filesScanned} files, ${report.fails} fail (${report.blocks} block), ${unknownCount} unknown, ${report.filesSkipped} skipped → ${report.blocks > 0 ? "BLOCKED" : "OK"}`,
  );
  return lines.join("\n");
}
