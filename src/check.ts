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

// Historical reports must not print bytes extracted from old files: those may
// contain secrets even if the current tree is clean. Rule reasons and evidence
// are written for the live tree and can quote source text, environment-variable
// names, script names or credential values, and they reach human output, JSON
// and the --explain prompt. Outgoing-history findings therefore carry a fixed,
// rule-specific explanation plus the path and commit (identifiers only).
const HISTORY_REASONS: Record<string, string> = {
  "BILL-01": "Possible unbounded billable loop in outgoing history — review the indicated commit locally before pushing.",
  "CMD-01": "Potentially destructive command in outgoing history — review the indicated commit locally before pushing.",
  "DB-01": "Potentially destructive database operation in outgoing history — review the indicated commit locally before pushing.",
  "GIT-01": "Potentially destructive Git command in outgoing history — review the indicated commit locally before pushing.",
  "NET-01": "Remote content may be piped into a shell in outgoing history — remove that step before pushing.",
  "PRV-09": "Possible personal or sensitive data in a fixture in outgoing history — review the indicated commit locally before pushing.",
  "SEC-01": "A public-prefix environment variable may expose a secret in outgoing history — move the secret server-side, rotate it, and remove it from the commit before pushing.",
  "SEC-02": "A credential path may be read in outgoing history — review the indicated commit locally before pushing.",
  "SEC-03": "A sensitive environment file or secret may exist in outgoing history — ignoring the file now does not remove it from existing commits; rotate the value and plan a history rewrite before publishing.",
  "SUP-01": "A package script in outgoing history may run a pipe-to-shell install payload — remove or replace it before pushing.",
};

/** Run the full REGISTRY over one file's content (shared by worktree, index, and push scans). */
function scanContent(rel: string, content: string, files: string[], projectRoot: string, isCommittedBlob = false): CheckFinding[] {
  const findings: CheckFinding[] = [];
  for (const id of Object.keys(REGISTRY).sort()) {
    // Containment is about the live filesystem, not a historical tree path;
    // resolving it via today's worktree can follow unrelated symlinks.
    if (isCommittedBlob && id === "FS-01") continue;
    const entry = REGISTRY[id];
    if (!entry) continue;
    const v = entry.check({ content, filePath: rel, projectRoot, fileList: files, isCommittedBlob });
    if (v.verdict !== "fail" && v.verdict !== "unknown") continue;
    const reason = isCommittedBlob
      ? v.verdict === "unknown"
        ? "Historical content could not be evaluated by this rule (unknown is not a pass) — inspect the indicated commit locally."
        : HISTORY_REASONS[id] ?? "Potential issue in outgoing history — inspect the indicated commit locally."
      : v.reason;
    const f: CheckFinding = { file: rel, ruleId: id, severity: entry.severity, verdict: v.verdict, reason };
    if (!isCommittedBlob && v.evidence) f.evidence = v.evidence;
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

interface TreeEntry {
  mode: string;
  type: string;
  sha: string;
  size: number | null;
}

/** Split items into chunks bounded by count and approximate argument bytes. */
function chunkBySize<T>(items: T[], count: number, sizeOf: (item: T) => number, byteBudget: number): T[][] {
  const chunks: T[][] = [];
  let current: T[] = [];
  let bytes = 0;
  for (const item of items) {
    const size = sizeOf(item);
    if (current.length > 0 && (current.length >= count || bytes + size > byteBudget)) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * Metadata for changed paths in one commit. One `ls-tree -l` per chunk instead
 * of one process per file: a 200-file push measured ~4s with per-file spawns.
 * Paths are literal pathspecs, so wildcard characters in names stay inert.
 */
function readTreeEntries(projectRoot: string, commit: string, rels: string[]): Map<string, TreeEntry> {
  const entries = new Map<string, TreeEntry>();
  const chunks = chunkBySize(rels, 100, (r) => Buffer.byteLength(r) + 16, 96 * 1024);
  for (const chunk of chunks) {
    const out = gitOut(projectRoot, ["ls-tree", "-l", "-z", commit, "--", ...chunk.map((r) => `:(literal)${r}`)], 64 * 1024 * 1024);
    if (out === null) continue;
    for (const record of out.toString("utf-8").split("\0")) {
      if (!record) continue;
      const tab = record.indexOf("\t");
      if (tab < 0) continue;
      // `ls-tree -l` right-aligns the size column, so fields are space-padded.
      const [mode, type, sha, sizeRaw] = record.slice(0, tab).trim().split(/\s+/);
      if (!mode || !type || !sha || sizeRaw === undefined) continue;
      entries.set(record.slice(tab + 1), { mode, type, sha, size: sizeRaw === "-" ? null : Number(sizeRaw) });
    }
  }
  return entries;
}

/**
 * Contents for many blobs via one `cat-file --batch` per size-bounded batch.
 * Returns sha → bytes; a requested sha is absent when Git could not read it.
 */
function readBlobContents(projectRoot: string, requests: Array<{ sha: string; size: number }>): Map<string, Buffer> {
  const contents = new Map<string, Buffer>();
  const budget = 8 * 1024 * 1024;
  const batches = chunkBySize(requests, 500, (r) => Math.min(r.size + 64, budget), budget);
  for (const batch of batches) {
    let out: Buffer;
    try {
      out = execFileSync("git", ["cat-file", "--batch"], {
        cwd: projectRoot,
        input: batch.map((r) => r.sha).join("\n") + "\n",
        stdio: ["pipe", "pipe", "ignore"],
        maxBuffer: budget + 1024 * 1024,
      }) as Buffer;
    } catch {
      continue; // unreadable batch → callers report "missing" for its blobs
    }
    let offset = 0;
    while (offset < out.length) {
      const headerEnd = out.indexOf(0x0a, offset);
      if (headerEnd < 0) break;
      const header = out.subarray(offset, headerEnd).toString("utf-8").split(" ");
      if (header.length === 2 && header[1] === "missing") {
        offset = headerEnd + 1; // absent object: leave it out of the map
        continue;
      }
      const size = Number(header[2]);
      const bodyStart = headerEnd + 1;
      if (header.length !== 3 || !Number.isSafeInteger(size) || size < 0 || bodyStart + size > out.length) break;
      // Only blob content is scannable; other object kinds are left out.
      if (header[1] === "blob") contents.set(header[0]!, out.subarray(bodyStart, bodyStart + size));
      offset = bodyStart + size + 1;
    }
  }
  return contents;
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

/** Scan changed blobs in every outgoing commit, including history of a new ref. */
export function runPushCheck(projectRoot: string, ranges: string[], opts: CheckOptions = {}): CheckReport {
  const maxFiles = opts.maxFiles ?? DEFAULT_MAX_FILES;
  const maxBytes = opts.maxBytesPerFile ?? DEFAULT_MAX_BYTES;
  const maxCommits = 5000;
  const findings: CheckFinding[] = [];
  let scanned = 0;
  let skipped = 0;
  const incomplete = (reason: string): void => {
    findings.push({ file: "<push>", ruleId: "PUSH-SCAN", severity: "block", verdict: "fail", reason });
  };
  if (!existsSync(projectRoot)) {
    incomplete("Cannot inspect outgoing commits: project directory is unavailable.");
    return summarize(0, 0, findings);
  }

  if (ranges.length > 0 && ranges.some((r) => !/^0+$/.test(r.split("..").at(-1) ?? ""))) {
    const shallow = gitOut(projectRoot, ["rev-parse", "--is-shallow-repository"], 1024);
    if (shallow === null || shallow.toString("utf-8").trim() !== "false") {
      incomplete("Cannot inspect complete outgoing history in a shallow or unavailable repository; fetch full history and retry.");
      return summarize(0, 0, findings);
    }
  }

  // A zero remote SHA denotes a new ref; its entire reachable history may be
  // new to the remote. A bare revision means exactly that commit (also roots).
  const commits = new Set<string>();
  for (const r of ranges) {
    const parts = r.split("..");
    if ((parts.length !== 1 && parts.length !== 2) || parts.some((p) => !p || !/^[A-Za-z0-9_.@{}\/^~:-]+$/.test(p))) {
      incomplete("Cannot inspect outgoing commits: invalid range.");
      continue;
    }
    const tip = parts[parts.length - 1]!;
    if (/^0+$/.test(tip)) continue; // deletion: no local history is sent
    const revision = parts.length === 1 || /^0+$/.test(parts[0]!) ? tip : r;
    const count = parts.length === 1 ? 1 : maxCommits + 1;
    const out = gitOut(projectRoot, ["rev-list", `--max-count=${count}`, "--end-of-options", revision], 1024 * 1024);
    if (out === null) {
      incomplete(`Cannot inspect outgoing commits for ${r}; check the Git range and repository history.${r === "@{u}..HEAD" ? " For a Git hook, rerun 'vibe-fence init' to update it; for a manual check, configure an upstream or provide an explicit range." : ""}`);
      continue;
    }
    const ids = out.toString("utf-8").split("\n").filter(Boolean);
    if (ids.length > maxCommits) {
      incomplete(`Outgoing history exceeds ${maxCommits} commits; inspection is incomplete.`);
      continue;
    }
    for (const id of ids) commits.add(id);
    if (commits.size > maxCommits) {
      incomplete(`Outgoing history exceeds ${maxCommits} commits across refs; inspection is incomplete.`);
      return summarize(scanned, skipped, findings);
    }
  }

  let examined = 0;
  for (const commit of commits) {
    // -m compares merge commits with each parent; --root covers root commits.
    const out = gitOut(projectRoot, ["diff-tree", "--root", "-m", "-r", "--no-commit-id", "--name-only", "--diff-filter=ACMRT", "-z", commit], 4 * 1024 * 1024);
    if (out === null) {
      incomplete(`Cannot list changed files for commit ${commit.slice(0, 12)}; inspection is incomplete.`);
      continue;
    }
    const names = [...new Set(out.toString("utf-8").split("\0").filter(Boolean))].sort();
    // Batch metadata and contents per chunk instead of spawning two Git
    // processes per file: a 200-file push measured ~4.1s that way.
    const remaining = maxFiles - examined;
    const overflow = names.length > remaining;
    const batch = overflow ? names.slice(0, Math.max(0, remaining)) : names;
    examined += batch.length;
    const shortSha = commit.slice(0, 12);
    const entries = readTreeEntries(projectRoot, commit, batch);
    const pending: Array<{ rel: string; entry: TreeEntry }> = [];
    const blocked = new Map<string, string>();
    for (const rel of batch) {
      const entry = entries.get(rel);
      if (!entry || !/^\d{6} (?:blob|commit) [0-9a-f]+$/.test(`${entry.mode} ${entry.type} ${entry.sha}`)) {
        skipped++;
        blocked.set(rel, `Cannot identify ${rel} in commit ${shortSha}; inspection is incomplete.`);
        continue;
      }
      if (entry.mode === "160000") {
        skipped++;
        blocked.set(rel, `Submodule ${rel} in commit ${shortSha} requires separate history inspection; inspection is incomplete.`);
        continue;
      }
      if (entry.type !== "blob") {
        skipped++;
        blocked.set(rel, `Cannot inspect ${rel} in commit ${shortSha}; unsupported Git object.`);
        continue;
      }
      if (shouldSkipBlob(rel)) { skipped++; continue; }
      if (entry.size === null || entry.size > maxBytes) {
        skipped++;
        blocked.set(rel, `Cannot read ${rel} in commit ${shortSha} (missing or over ${maxBytes} bytes); inspection is incomplete.`);
        continue;
      }
      pending.push({ rel, entry });
    }
    const contents = readBlobContents(projectRoot, pending.map((p) => ({ sha: p.entry.sha, size: p.entry.size ?? 0 })));
    for (const rel of batch) {
      const reason = blocked.get(rel);
      if (reason !== undefined) {
        incomplete(reason);
        continue;
      }
      const entry = entries.get(rel);
      if (!entry) continue;
      const blob = contents.get(entry.sha);
      if (!blob) {
        skipped++;
        incomplete(`Cannot read ${rel} in commit ${shortSha} (missing or over ${maxBytes} bytes); inspection is incomplete.`);
        continue;
      }
      const content = blob.toString("utf-8");
      if (content.length === 0) {
        // Even an empty .env was tracked in the historical commit. Other
        // rules' empty-content unknowns are noise, so retain only SEC-03.
        skipped++;
        const envFinding = scanContent(rel, content, names, projectRoot, true).filter((f) => f.ruleId === "SEC-03" && f.verdict === "fail");
        for (const finding of envFinding) finding.file = `${rel} (commit ${shortSha})`;
        findings.push(...envFinding);
        continue;
      }
      scanned++;
      const results = scanContent(rel, content, names, projectRoot, true);
      for (const finding of results) finding.file = `${rel} (commit ${shortSha})`;
      findings.push(...results);
    }
    if (overflow) {
      incomplete(`Outgoing changes exceed the ${maxFiles}-file scan limit; inspection is incomplete.`);
      return summarize(scanned, skipped + 1, findings);
    }
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
