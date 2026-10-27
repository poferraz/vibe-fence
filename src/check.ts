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
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import { REGISTRY } from "./rules/index.js";
import { verifyAttestation } from "./framework/integrity.js";

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

/** Run the full REGISTRY over one file's content (shared by worktree, index, and push scans). */
function scanContent(rel: string, content: string, files: string[], projectRoot: string): CheckFinding[] {
  const findings: CheckFinding[] = [];
  for (const id of Object.keys(REGISTRY).sort()) {
    const entry = REGISTRY[id];
    if (!entry) continue;
    const v = entry.check({ content, filePath: rel, projectRoot, fileList: files });
    if (v.verdict !== "fail" && v.verdict !== "unknown") continue;
    const f: CheckFinding = { file: rel, ruleId: id, severity: entry.severity, verdict: v.verdict, reason: v.reason };
    if (v.evidence) f.evidence = v.evidence;
    findings.push(f);
  }
  return findings;
}

function summarize(filesScanned: number, filesSkipped: number, findings: CheckFinding[]): CheckReport {
  const fails = findings.filter((f) => f.verdict === "fail").length;
  const blocks = findings.filter((f) => f.verdict === "fail" && f.severity === "block").length;
  const unknowns = findings.filter((f) => f.verdict === "unknown").length;
  return { filesScanned, filesSkipped, fails, blocks, unknowns, findings };
}

export function runCheck(projectRoot: string, opts: CheckOptions = {}): CheckReport {
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES;
  const maxBytes = opts.maxBytesPerFile ?? DEFAULT_MAX_BYTES;
  const findings: CheckFinding[] = [];

  if (!existsSync(projectRoot)) {
    return { filesScanned: 0, filesSkipped: 0, fails: 0, blocks: 0, unknowns: 0, findings };
  }

  const { files, skipped } = listFiles(projectRoot, maxFiles);
  for (const rel of files) {
    let content: string;
    try {
      const st = statSync(join(projectRoot, rel));
      if (st.size > maxBytes) continue;
      content = readFileSync(join(projectRoot, rel), "utf-8");
    } catch {
      continue;
    }
    findings.push(...scanContent(rel, content, files, projectRoot));
  }

  // C7: fence-owned integrity (S-06) is enforced here, not just at install.
  // Drift fails loud; unknown (never attested) stays silent — there is
  // nothing to verify against.
  try {
    const att = verifyAttestation(projectRoot);
    if (att.status === "fail") {
      findings.push({
        file: ".fence/.integrity.json",
        ruleId: "S-06",
        severity: "block",
        verdict: "fail",
        reason: att.message,
        evidence: att.mismatched.join(", "),
      });
    }
  } catch {
    // Attestation must never crash a tree scan; drift still reports above.
  }

  return summarize(files.length, skipped, findings);
}

// ---------------------------------------------------------------------------
// Index-aware scans (L1): staged blobs pre-commit, outgoing commits pre-push.
// Same REGISTRY loop as runCheck — only the content source differs.
// ---------------------------------------------------------------------------

function gitOut(projectRoot: string, args: string[], maxBuffer: number): Buffer | null {
  try {
    return execFileSync("git", args, {
      cwd: projectRoot,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer,
    }) as Buffer;
  } catch {
    return null;
  }
}

/** Content of one blob (`:0:path` for staged, `<rev>:path` for committed). Null when unreadable/oversize. */
function readBlob(projectRoot: string, revPath: string, maxBytes: number): string | null {
  const buf = gitOut(projectRoot, ["show", revPath], maxBytes + 1);
  if (!buf || buf.length > maxBytes) return null;
  return buf.toString("utf-8");
}

function shouldSkipBlob(rel: string): boolean {
  const lower = rel.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot === -1 ? "" : lower.slice(dot);
  return BINARY_EXTS.has(ext);
}

/**
 * Scan staged blobs — what the next commit would contain (pre-commit gate).
 * Closes the staged-blob smuggle (L1): stage a leak, clean the worktree, and
 * the worktree scan stays blind while this scan blocks. Non-repos and empty
 * stages yield an empty OK report (nothing staged = nothing to gate).
 */
export function runIndexCheck(projectRoot: string, opts: CheckOptions = {}): CheckReport {
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES;
  const maxBytes = opts.maxBytesPerFile ?? DEFAULT_MAX_BYTES;
  const findings: CheckFinding[] = [];
  if (!existsSync(projectRoot)) return summarize(0, 0, findings);
  const out = gitOut(projectRoot, ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMRT"], 4 * 1024 * 1024);
  if (!out) return summarize(0, 0, findings);
  const names = out.toString("utf-8").split("\0").filter(Boolean).sort();
  const capped = names.slice(0, maxFiles);
  let skipped = names.length - capped.length;
  let scanned = 0;
  for (const rel of capped) {
    if (shouldSkipBlob(rel)) {
      skipped++;
      continue;
    }
    // :0: = stage 0 (resolved); unmerged paths have no stage 0 → skip.
    const content = readBlob(projectRoot, `:0:${rel}`, maxBytes);
    if (content === null || content.length === 0) {
      skipped++;
      continue;
    }
    scanned++;
    findings.push(...scanContent(rel, content, capped, projectRoot));
  }
  return summarize(scanned, skipped, findings);
}

/**
 * Scan outgoing commits' blobs (pre-push gate). Each range is `<old>..<new>`
 * (a bare `<rev>` means that commit vs its parent). New refs (zero old) and
 * unresolvable bases fall back to scanning the tip tree — unknown base, scan
 * everything rather than nothing.
 */
export function runPushCheck(projectRoot: string, ranges: string[], opts: CheckOptions = {}): CheckReport {
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES;
  const maxBytes = opts.maxBytesPerFile ?? DEFAULT_MAX_BYTES;
  const findings: CheckFinding[] = [];
  if (!existsSync(projectRoot)) return summarize(0, 0, findings);
  const jobs: Array<{ base: string; tip: string }> = [];
  for (const r of ranges) {
    const parts = r.split("..");
    if (parts.length === 2 && parts[0] && parts[1]) jobs.push({ base: parts[0], tip: parts[1] });
    else if (parts.length === 1 && parts[0]) jobs.push({ base: `${parts[0]}^`, tip: parts[0] });
  }
  const paths = new Map<string, string>(); // rel → tip rev for blob reads
  for (const { base, tip } of jobs) {
    let names: string[] | null = null;
    if (/^0+$/.test(base)) {
      const out = gitOut(projectRoot, ["ls-tree", "-r", "--name-only", "-z", tip], 4 * 1024 * 1024);
      if (out) names = out.toString("utf-8").split("\0").filter(Boolean);
    } else {
      const out = gitOut(projectRoot, ["diff", "--name-only", "-z", base, tip], 4 * 1024 * 1024);
      if (out) {
        names = out.toString("utf-8").split("\0").filter(Boolean);
      } else {
        // Unresolvable base (no upstream, shallow, root bare rev) → tip tree.
        const whole = gitOut(projectRoot, ["ls-tree", "-r", "--name-only", "-z", tip], 4 * 1024 * 1024);
        if (whole) names = whole.toString("utf-8").split("\0").filter(Boolean);
      }
    }
    if (!names) continue;
    for (const rel of names) {
      if (!paths.has(rel)) paths.set(rel, tip);
    }
  }
  const capped = [...paths.keys()].sort().slice(0, maxFiles);
  let skipped = paths.size - capped.length;
  let scanned = 0;
  for (const rel of capped) {
    if (shouldSkipBlob(rel)) {
      skipped++;
      continue;
    }
    const content = readBlob(projectRoot, `${paths.get(rel)}:${rel}`, maxBytes);
    if (content === null || content.length === 0) {
      skipped++;
      continue;
    }
    scanned++;
    findings.push(...scanContent(rel, content, capped, projectRoot));
  }
  return summarize(scanned, skipped, findings);
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
