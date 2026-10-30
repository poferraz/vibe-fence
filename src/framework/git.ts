/**
 * src/framework/git.ts
 * S-10 — Turbo safety is containment+reversibility+batched review. Git checkpoint + fence undo.
 * S-04 — Diagnosis artefact before retry; checkpoint before multi-file edits.
 * Anti-patterns: §6 #5 (permission prompts are not safety — containment+checkpoints first).
 * Sources: 04 A-15 (checkpoint before multi-file edits; fence undo), 05 A-06/A-07 (gated turbo).
 */

import { execSync, execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { isAbsolute, join, sep } from "node:path";
import { runIndexCheck } from "../check.js";
import { canonicalPath } from "./git-hooks.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckpointOptions {
  action: string; // human-readable action label — becomes part of commit message
  projectRoot?: string;
  includeUntracked?: boolean; // default false — only stage tracked changes
}

export interface UndoOptions {
  projectRoot?: string;
  /** How many fence checkpoints to undo (default 1). */
  steps?: number;
}

export interface CheckpointResult {
  committed: boolean;
  commitHash: string | null;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Commit message prefix — machine-parseable for undo targeting. */
export const CHECKPOINT_PREFIX = "checkpoint:";

/** Fence undo spec — what it guarantees. */
export const UNDO_SPEC = `
fence undo — reversibility contract (S-10):
- Reverts last fence checkpoint commit(s) without detached HEAD.
- Uses 'git revert' or 'git reset --soft HEAD~N' depending on pushed state.
- Never force-pushes; never touches untracked files.
- Fails closed if no checkpoint commits found (not a silent no-op).
- Logs undo to .fence/events.ndjson for audit.
`.trim();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function git(cwd: string, cmd: string): string {
  return execSync(`git ${cmd}`, { cwd, encoding: "utf-8" }).trim();
}

/** Shell-free git invocation for anything carrying variables (no injection). */
function gitArgs(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8" }).trim();
}

function tryGitArgs(cwd: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

/** Fence actor identity — checkpoint/undo commits never depend on user gitconfig. */
const FENCE_IDENTITY = ["-c", "user.name=vibe-fence", "-c", "user.email=fence@local", "-c", "commit.gpgsign=false"];

function logEvent(projectRoot: string, event: Record<string, unknown>): void {
  try {
    appendFileSync(join(projectRoot, ".fence", "events.ndjson"), JSON.stringify({ at: new Date().toISOString(), ...event }) + "\n", "utf-8");
  } catch {
    // Best-effort: fixtures and foreign trees may lack .fence/
  }
}

function hasChanges(cwd: string): boolean {
  const out = git(cwd, "status --porcelain");
  return out.length > 0;
}

function isGitRepo(cwd: string): boolean {
  try {
    git(cwd, "rev-parse --is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Checkpoint — auto-commit before multi-file agent edits
// ---------------------------------------------------------------------------

/**
 * Create a checkpoint commit before multi-file agent edits.
 * S-10 — git checkpoint + fence undo; ≤3 gates/session.
 * Format: "checkpoint: [action]" — machine-parseable for targeted undo.
 *
 * Called by harness shell wrapper before Write/Edit bursts.
 * Idempotent in sense: if no changes, no commit (but not an error).
 */
export function checkpoint(opts: CheckpointOptions): CheckpointResult {
  const cwd = opts.projectRoot ?? process.cwd();

  if (!isGitRepo(cwd)) {
    return { committed: false, commitHash: null, message: "not a git repo — run `git init` first, then checkpoint" };
  }

  if (!hasChanges(cwd)) {
    return { committed: false, commitHash: null, message: "no changes — skipping checkpoint" };
  }

  const message = `${CHECKPOINT_PREFIX} [${opts.action}]`;
  // Tracked-only by default (untracked WIP stays out of the snapshot); -A only on request.
  // Both respect .gitignore.
  gitArgs(cwd, opts.includeUntracked ? ["add", "-A"] : ["add", "-u"]);
  // Nothing stageable (e.g. only-untracked tree in tracked-only mode) → no-op, not an error.
  if (tryGitArgs(cwd, ["diff", "--cached", "--quiet", "--"]) !== null) {
    return { committed: false, commitHash: null, message: "nothing to snapshot — no staged changes (untracked files need --include-untracked)" };
  }
  // D7: checkpoints deliberately capture WIP as-is (--no-verify below), so a
  // contaminated checkpoint would land silently. Scan the stage — which right
  // now holds exactly the checkpoint content — and warn LOUDLY when it holds
  // blocks. Never gate: an undo point must always land.
  let blockingFindings = 0;
  try {
    blockingFindings = runIndexCheck(cwd).blocks;
  } catch {
    blockingFindings = 0;
  }
  // --no-verify is deliberate: a checkpoint captures WIP as-is (it may hold a
  // leak the fence is about to fix). Enforcement runs at real commits + `check`.
  gitArgs(cwd, [...FENCE_IDENTITY, "commit", "-m", message, "--no-verify"]);
  const hash = git(cwd, "rev-parse HEAD");

  if (blockingFindings > 0) {
    console.warn(
      `vibe-fence: checkpoint ${hash.slice(0, 7)} holds ${blockingFindings} blocking finding(s) — ` +
        `committed as an undo point, NOT as clean. Fix before your real commit.`,
    );
  }

  logEvent(cwd, { type: "checkpoint", action: opts.action, hash, blockingFindings });

  return { committed: true, commitHash: hash, message };
}

// ---------------------------------------------------------------------------
// Undo — revert fence checkpoints without detached HEAD
// ---------------------------------------------------------------------------

/**
 * Undo last fence checkpoint(s).
 * S-10 — fence undo spec: clean revert without detached HEAD.
 *
 * Strategy:
 * - Find last N commits with CHECKPOINT_PREFIX in message (fail closed if none).
 * - Targets unpushed + contiguous at tip → `git reset --soft <parent-of-oldest>`
 *   (work preserved as staged changes; untracked files untouched).
 * - Otherwise (pushed, or interleaved with user commits) → `git revert
 *   --no-commit` each checkpoint oldest-first + one revert commit. Requires a
 *   clean worktree; aborts without changes on conflict.
 * - Never detaches HEAD; never force-pushes; never pushes at all.
 */
export function fenceUndo(opts: UndoOptions = {}): CheckpointResult {
  const cwd = opts.projectRoot ?? process.cwd();
  const steps = opts.steps ?? 1;

  if (!isGitRepo(cwd)) {
    throw new Error("not a git repo — cannot undo");
  }
  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error(`invalid steps "${steps}" — want a positive integer`);
  }

  // Newest-first checkpoint hashes (capped scan keeps this cheap on big repos).
  const log = tryGitArgs(cwd, ["log", "--format=%H", `--grep=^${CHECKPOINT_PREFIX}`, "-n", String(steps)]);
  const targets = (log ?? "").split("\n").map((h) => h.trim()).filter(Boolean);
  if (targets.length === 0) {
    throw new Error("no checkpoint commits found — nothing to undo");
  }
  if (targets.length < steps) {
    throw new Error(`only ${targets.length} checkpoint commit(s) found — asked for ${steps}; refusing partial undo`);
  }
  const oldest = targets[targets.length - 1]!;

  // Contiguous at tip? Walk down from HEAD while subjects carry the prefix.
  const tipSubjects = (tryGitArgs(cwd, ["log", "--format=%s", "-n", String(steps + 1)]) ?? "").split("\n");
  const contiguous = tipSubjects.slice(0, steps).every((s) => s.startsWith(CHECKPOINT_PREFIX));

  // Pushed? The oldest target reachable from upstream means history is public.
  const upstream = tryGitArgs(cwd, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  let pushed = false;
  if (upstream) {
    pushed = tryGitArgs(cwd, ["merge-base", "--is-ancestor", oldest, "@{u}", "--"]) !== null;
  }

  const parent = tryGitArgs(cwd, ["rev-parse", `${oldest}^`]);

  if (!pushed && contiguous && parent) {
    gitArgs(cwd, ["reset", "--soft", parent]);
    const head = git(cwd, "rev-parse HEAD");
    logEvent(cwd, { type: "undo", mode: "reset--soft", steps, hashes: targets });
    return { committed: false, commitHash: head, message: `undone ${steps} checkpoint(s) via reset --soft — work preserved as staged changes` };
  }

  // Revert path — needs a clean tree so a conflict can't strand half-applied state.
  if (hasChanges(cwd)) {
    throw new Error("uncommitted changes present — commit, stash, or checkpoint first, then undo");
  }
  try {
    for (const h of [...targets].reverse()) {
      gitArgs(cwd, ["revert", "--no-commit", h]);
    }
    gitArgs(cwd, [...FENCE_IDENTITY, "commit", "-m", `revert: fence undo (${steps} checkpoint${steps === 1 ? "" : "s"})`, "--no-verify"]);
  } catch (e) {
    tryGitArgs(cwd, ["revert", "--abort"]);
    throw new Error(`undo conflicted and was aborted without changes — resolve manually (${(e as Error).message})`);
  }
  const head = git(cwd, "rev-parse HEAD");
  logEvent(cwd, { type: "undo", mode: "revert", steps, hashes: targets });
  return { committed: true, commitHash: head, message: `undone ${steps} checkpoint(s) via revert commit ${head.slice(0, 7)}` };
}

// ---------------------------------------------------------------------------
// Safety — intercept destructive git ops (S-10 / 04 A-15)
// ---------------------------------------------------------------------------

/**
 * Check if a git command is destructive and should be intercepted.
 * S-10 — harness shell wrapper rejects `reset --hard` / `push --force`.
 * TODO: wire into PreToolUse hook for Bash tool — deny with block + actionable message
 */
export function isDestructiveGitCommand(command: string): boolean {
  const destructive = [
    /git\s+reset\s+--hard/,
    /git\s+push\s+--force/,
    /git\s+push\s+-f\b/,
    /git\s+clean\s+-f/,
    /git\s+branch\s+-D/,
  ];
  return destructive.some((re) => re.test(command));
}

/**
 * Project-root realpath containment check (S-10).
 * Ensures agent edits stay within project root — no traversal.
 * TODO: integrate with tool allowlist — deny Write/Edit outside realpath boundary
 */
export function isWithinProjectRoot(projectRoot: string, targetPath: string): boolean {
  try {
    const realRoot = canonicalPath(projectRoot);
    const absTarget = canonicalPath(isAbsolute(targetPath) ? targetPath : join(projectRoot, targetPath));
    return absTarget === realRoot || absTarget.startsWith(realRoot + sep);
  } catch {
    return false;
  }
}
