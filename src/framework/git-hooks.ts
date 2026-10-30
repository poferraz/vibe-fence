/**
 * src/framework/git-hooks.ts — Guarded tier git hooks (Oct 29).
 * init installs managed pre-commit/pre-push hooks that run the index-aware
 * check (`check --staged` / `check --push`) plus the worktree `check`.
 * Binary resolution: $FENCE_BIN wins, else `vibe-fence` on PATH, else loud
 * skip (never block when the tool itself is missing). A failing check blocks
 * before any chained user hook runs. Existing user hooks are moved aside to
 * `<hook>.pre-fence` and chained via exec (stdin inherited — pre-push safe),
 * never clobbered. Re-run is byte-idempotent.
 */

import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync, renameSync, chmodSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";

export const HOOK_NAMES = ["pre-commit", "pre-push"] as const;
export type HookName = (typeof HOOK_NAMES)[number];

export const HOOK_MARKER = "# vibe-fence managed hook";
const BACKUP_SUFFIX = ".pre-fence";

export function buildHookScript(hookName: HookName): string {
  // Index-aware: pre-commit gates staged blobs (closes the L1 smuggle), pre-push
  // gates outgoing commits (stdin ranges parsed CLI-side); the worktree scan
  // runs after as defense in depth. Fail fast on the first failing scan.
  // Pre-push: Git sends ref updates on stdin. Buffer them once so both the
  // fence check and any chained pre-existing hook receive the same input —
  // consuming stdin in the fence check must not starve the chained hook.
  const indexScan = hookName === "pre-push" ? "check --push --hook-input" : "check --staged";
  const isPush = hookName === "pre-push";
  return [
    "#!/bin/sh",
    `${HOOK_MARKER} (${hookName}) — safe to delete; reinstall via \`vibe-fence init\`.`,
    `# Runs the fence check (staged/outgoing + worktree), then chains the pre-existing user hook if one was present.`,
    `HOOK_NAME="${hookName}"`,
    `HOOKS_DIR="$(git rev-parse --git-path hooks 2>/dev/null || echo .git/hooks)"`,
    ...(isPush
      ? [`TMP_STDIN="$(mktemp)"`, `cat > "$TMP_STDIN"`]
      : []),
    "run_check() {",
    '  if [ -n "$FENCE_BIN" ]; then',
    '    BIN="$FENCE_BIN"',
    "  elif command -v vibe-fence >/dev/null 2>&1; then",
    '    BIN="vibe-fence"',
    "  else",
    '    echo "vibe-fence: binary not found (install vibe-fence or set FENCE_BIN) — skipping check." >&2',
    "    return 0",
    "  fi",
    `  "$BIN" ${indexScan} && "$BIN" check`,
    "}",
    isPush
      ? `run_check < "$TMP_STDIN" || { echo "vibe-fence: $HOOK_NAME blocked — fix findings or run 'vibe-fence check'." >&2; rm -f "$TMP_STDIN"; exit 1; }`
      : `run_check || { echo "vibe-fence: $HOOK_NAME blocked — fix findings or run 'vibe-fence check'." >&2; exit 1; }`,
    'CHAINED="$HOOKS_DIR/$HOOK_NAME.pre-fence"',
    'if [ -x "$CHAINED" ]; then',
    ...(isPush
      ? ['  "$CHAINED" "$@" < "$TMP_STDIN"', "  CHAIN_EXIT=$?", '  rm -f "$TMP_STDIN"', "  exit $CHAIN_EXIT"]
      : ['  exec "$CHAINED" "$@"']),
    "fi",
    ...(isPush ? ['rm -f "$TMP_STDIN"'] : []),
    "exit 0",
    "",
  ].join("\n");
}

/**
 * A global or repo core.hooksPath redirects git away from .git/hooks,
 * silently disabling anything installed there. Returns the configured path
 * (caller must warn) or null when the default applies.
 */
export function configuredHooksPath(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): string | null {
  try {
    const out = execFileSync("git", ["config", "--get", "core.hooksPath"], {
      cwd: projectRoot,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * Canonical path through the nearest existing ancestor. Legitimate symlinked
 * roots (/var → /private/var on macOS) resolve through the symlink; a target
 * that escapes through a symlinked ancestor resolves outside the root.
 */
export function canonicalPath(p: string): string {
  const abs = resolve(p);
  let cur = abs;
  const rest: string[] = [];
  for (;;) {
    try {
      // lstat sees dangling symlinks: realpath then rejects them rather than
      // treating the link as a missing in-project path.
      lstatSync(cur);
      return join(realpathSync(cur), ...rest);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      // A dangling symlink itself exists even though realpath returned ENOENT.
      try { lstatSync(cur); } catch (statErr) {
        if ((statErr as NodeJS.ErrnoException).code !== "ENOENT") throw statErr;
        const parent = dirname(cur);
        if (parent === cur) throw err;
        rest.unshift(basename(cur));
        cur = parent;
        continue;
      }
      throw err;
    }
  }
}

function isInside(parentCanonical: string, childCanonical: string): boolean {
  return childCanonical === parentCanonical || childCanonical.startsWith(parentCanonical + sep);
}

/** Effective hooks directory Git will actually use, or null outside a repo. */
export function effectiveHooksDir(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): string | null {
  try {
    const out = execFileSync("git", ["rev-parse", "--git-path", "hooks"], {
      cwd: projectRoot,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!out) return null;
    return isAbsolute(out) ? out : resolve(projectRoot, out);
  } catch {
    return null;
  }
}

export interface GitHooksInspection {
  configured: string | null;
  effectiveDir: string | null;
  /** Effective dir is inside the project worktree (only meaningful when configured). */
  insideProject: boolean;
  /** True when a configured hooksPath points outside the project — installing there would be a global side effect. */
  blockedOutside: boolean;
  exists: boolean;
}

/**
 * Inspect where Git will look for hooks and whether the fence may safely
 * install there. Never changes global config. A linked worktree shares the
 * common hooks dir — with no redirect that is still repo-internal.
 */
function gitPath(projectRoot: string, args: string[], env: Record<string, string>): string | null {
  try {
    return execFileSync("git", args, { cwd: projectRoot, env, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

/** True in a linked worktree (`.git` is a file; git dir differs from common dir). */
export function isLinkedWorktree(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): boolean {
  const gitDir = gitPath(projectRoot, ["rev-parse", "--git-dir"], env);
  const common = gitPath(projectRoot, ["rev-parse", "--git-common-dir"], env);
  if (!gitDir || !common) return false;
  const a = canonicalPath(isAbsolute(gitDir) ? gitDir : resolve(projectRoot, gitDir));
  const b = canonicalPath(isAbsolute(common) ? common : resolve(projectRoot, common));
  return a !== b;
}

/** Hooks directory of the common (shared) repository — where default hooks live. */
export function commonHooksDir(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): string | null {
  const common = gitPath(projectRoot, ["rev-parse", "--git-common-dir"], env);
  if (!common) return null;
  const abs = isAbsolute(common) ? common : resolve(projectRoot, common);
  return join(abs, "hooks");
}

/**
 * Repair to the common hooks directory by absolute path. Repo-local config
 * is shared with linked worktrees even when run from the main checkout.
 */
export function hooksRepairCommand(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): string {
  const common = commonHooksDir(projectRoot, env);
  if (!common) throw new Error("cannot determine common Git hooks directory");
  const absolute = join(canonicalPath(dirname(common)), basename(common));
  return `git config --local core.hooksPath '${absolute.replace(/'/g, "'\\''")}'`;
}

export function hooksRepairNote(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): string {
  return "Repo-local Git config is shared by all worktrees of this repository, so this change affects the whole repository.";
}

export function inspectGitHooks(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): GitHooksInspection {
  const configured = configuredHooksPath(projectRoot, env);
  const effectiveDir = effectiveHooksDir(projectRoot, env);
  if (!effectiveDir) {
    return { configured, effectiveDir: null, insideProject: false, blockedOutside: false, exists: false };
  }
  const exists = existsSync(effectiveDir);
  let inside = false;
  try {
    const effective = canonicalPath(effectiveDir);
    inside = isInside(canonicalPath(projectRoot), effective);
    const common = commonHooksDir(projectRoot, env);
    if (common && effective === canonicalPath(common) &&
        isInside(canonicalPath(dirname(common)), effective)) inside = true;
  } catch {
    // An unsafe or unresolvable symlink is never a safe install destination.
  }
  return { configured, effectiveDir, insideProject: inside, blockedOutside: !inside, exists };
}

/**
 * Install managed hooks into the effective hooks directory Git will actually
 * use (`git rev-parse --git-path hooks`). Handles linked worktrees (`.git` is
 * a file; hooks live in the common dir) and project-local `core.hooksPath`.
 * If `core.hooksPath` points outside this project (e.g. a global setting),
 * installs nothing and returns [] — writing there would be a global side
 * effect. The caller reports the repair; global config is never changed.
 * Returns display paths actually written (`.git/hooks/<name>` for the default
 * location). No repo → []. Never clobbers: an unmanaged existing hook is
 * moved to `.pre-fence`, and if that backup already exists the hook is left
 * untouched. Re-run is byte-idempotent.
 */
export function installGitHooks(projectRoot: string, env: Record<string, string> = process.env as Record<string, string>): string[] {
  if (!existsSync(join(projectRoot, ".git"))) return [];
  const info = inspectGitHooks(projectRoot, env);
  if (!info.effectiveDir || info.blockedOutside) return [];
  const hooksDir = info.effectiveDir;
  mkdirSync(hooksDir, { recursive: true });

  // A managed hook symlink must not make writeFileSync/chmodSync touch its
  // destination; dangling backup links must not be clobbered by renameSync.
  for (const name of HOOK_NAMES) {
    for (const path of [join(hooksDir, name), join(hooksDir, name) + BACKUP_SUFFIX]) {
      try {
        if (lstatSync(path).isSymbolicLink()) throw new Error(`refusing symlinked Git hook: ${path}`);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    }
  }

  const written: string[] = [];
  for (const name of HOOK_NAMES) {
    const target = join(hooksDir, name);
    const backup = target + BACKUP_SUFFIX;
    if (existsSync(target)) {
      const current = readFileSync(target, "utf-8");
      if (!current.includes(HOOK_MARKER)) {
        // Unmanaged user hook — move aside unless a backup already guards content.
        if (existsSync(backup)) {
          continue; // never overwrite an existing backup; leave user's hook alone
        }
        renameSync(target, backup);
      }
    }
    const next = buildHookScript(name);
    const prev = existsSync(target) ? readFileSync(target, "utf-8") : null;
    if (prev !== next) {
      writeFileSync(target, next, "utf-8");
      chmodSync(target, 0o755);
      written.push(displayHookPath(projectRoot, hooksDir, name));
    } else {
      // Ensure executability even when bytes are unchanged (cheap, no churn).
      try { chmodSync(target, 0o755); } catch {}
    }
  }
  return written;
}

function displayHookPath(projectRoot: string, hooksDir: string, name: HookName): string {
  // Default location (including worktree common dir) reads as .git/hooks.
  if (canonicalPath(hooksDir).endsWith(`${sep}.git${sep}hooks`)) return `.git/hooks/${name}`;
  const rel = relative(projectRoot, join(hooksDir, name));
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) return rel;
  return join(hooksDir, name);
}
