/**
 * src/framework/git.ts
 * S-10 — Turbo safety is containment+reversibility+batched review. Git checkpoint + fence undo.
 * S-04 — Diagnosis artefact before retry; checkpoint before multi-file edits.
 * Anti-patterns: §6 #5 (permission prompts are not safety — containment+checkpoints first).
 * Sources: 04 A-15 (checkpoint before multi-file edits; fence undo), 05 A-06/A-07 (gated turbo).
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

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
    // TODO: decide — should checkpoint init a repo if none exists? Or nudge to run `git init`?
    return { committed: false, commitHash: null, message: "not a git repo — skipping checkpoint" };
  }

  if (!hasChanges(cwd)) {
    return { committed: false, commitHash: null, message: "no changes — skipping checkpoint" };
  }

  const message = `${CHECKPOINT_PREFIX} [${opts.action}]`;
  // TODO: stage only fence-relevant changes? Currently stages all tracked modifications.
  // TODO: consider `git stash push -m "checkpoint: [action]" --keep-index` alternative for uncommitted WIP
  // TODO: set author as fence actor — `git -c user.name="vibe-fence" -c user.email="fence@local"` ?

  git(cwd, "add -A"); // TODO: respect .gitignore; consider -u vs -A per includeUntracked flag
  git(cwd, `commit -m "${message.replace(/"/g, '\\"')}" --no-verify`);
  const hash = git(cwd, "rev-parse HEAD");

  // TODO: log to .fence/events.ndjson — { type: "checkpoint", action, hash, at }
  // TODO: enforce ≤3 gates/session budget — check .fence/state/gates.json before committing

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
 * - Find last N commits with CHECKPOINT_PREFIX in message.
 * - If not pushed (no upstream or ahead of upstream) → `git reset --soft HEAD~N`.
 * - If pushed → `git revert --no-commit HEAD~N..HEAD` + commit (no force-push).
 * - Never detaches HEAD; never force-pushes.
 */
export function fenceUndo(opts: UndoOptions = {}): CheckpointResult {
  const cwd = opts.projectRoot ?? process.cwd();
  const steps = opts.steps ?? 1;

  if (!isGitRepo(cwd)) {
    throw new Error("not a git repo — cannot undo");
  }

  // Find checkpoint commits
  const log = git(cwd, `log --oneline --grep="^${CHECKPOINT_PREFIX}" -n ${steps}`);
  if (!log) {
    // TODO: emit actionable error — "no checkpoint commits found — nothing to undo"
    throw new Error("no checkpoint commits found — nothing to undo");
  }

  const hashes = log.split("\n").map((l) => l.split(" ")[0]!);
  void hashes;

  // TODO: detect pushed vs unpushed:
  //   const upstream = git(cwd, "rev-parse --abbrev-ref --symbolic-full-name @{u}" 2>/dev/null || "");
  //   if pushed → revert; else → reset --soft
  // TODO: implement actual undo — currently stub
  // TODO: log undo to .fence/events.ndjson — { type: "undo", steps, hashes, at }

  // Placeholder — real impl needs push detection + revert/reset branching
  return { committed: false, commitHash: null, message: "TODO: implement fence undo — see spec above" };
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
  // TODO: use fs.realpathSync for symlink-aware containment
  // TODO: handle Windows paths if needed
  void projectRoot;
  void targetPath;
  void existsSync;
  return true; // stub — TODO: implement realpath containment
}
