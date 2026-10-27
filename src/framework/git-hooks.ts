/**
 * src/framework/git-hooks.ts — Guarded tier git hooks (Oct 29).
 * init installs managed pre-commit/pre-push hooks that run `vibe-fence check`.
 * Binary resolution: $FENCE_BIN wins, else `vibe-fence` on PATH, else loud
 * skip (never block when the tool itself is missing). A failing check blocks
 * before any chained user hook runs. Existing user hooks are moved aside to
 * `<hook>.pre-fence` and chained via exec (stdin inherited — pre-push safe),
 * never clobbered. Re-run is byte-idempotent.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

export const HOOK_NAMES = ["pre-commit", "pre-push"] as const;
export type HookName = (typeof HOOK_NAMES)[number];

export const HOOK_MARKER = "# vibe-fence managed hook";
const BACKUP_SUFFIX = ".pre-fence";

export function buildHookScript(hookName: HookName): string {
  return [
    "#!/bin/sh",
    `${HOOK_MARKER} (${hookName}) — safe to delete; reinstall via \`vibe-fence init\`.`,
    `# Runs the fence check, then chains the pre-existing user hook if one was present.`,
    `HOOK_NAME="${hookName}"`,
    `GIT_DIR="$(git rev-parse --git-dir 2>/dev/null || echo .git)"`,
    "run_check() {",
    '  if [ -n "$FENCE_BIN" ]; then',
    '    "$FENCE_BIN" check',
    "    return $?",
    "  fi",
    "  if command -v vibe-fence >/dev/null 2>&1; then",
    "    vibe-fence check",
    "    return $?",
    "  fi",
    '  echo "vibe-fence: binary not found (install vibe-fence or set FENCE_BIN) — skipping check." >&2',
    "  return 0",
    "}",
    `run_check || { echo "vibe-fence: $HOOK_NAME blocked — fix findings or run 'vibe-fence check'." >&2; exit 1; }`,
    'CHAINED="$GIT_DIR/hooks/$HOOK_NAME.pre-fence"',
    'if [ -x "$CHAINED" ]; then',
    '  exec "$CHAINED" "$@"',
    "fi",
    "exit 0",
    "",
  ].join("\n");
}

/**
 * A global or repo core.hooksPath redirects git away from .git/hooks,
 * silently disabling anything installed there. Returns the configured path
 * (caller must warn) or null when the default applies.
 */
export function configuredHooksPath(projectRoot: string): string | null {
  try {
    const out = execSync("git config --get core.hooksPath", {
      cwd: projectRoot,
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
 * Install managed hooks into <projectRoot>/.git/hooks.
 * Returns repo-relative paths actually written. No .git → []. Never throws
 * away user content: an unmanaged existing hook is moved to .pre-fence, and
 * if that backup already exists the hook is left untouched.
 */
export function installGitHooks(projectRoot: string): string[] {
  const gitDir = join(projectRoot, ".git");
  if (!existsSync(gitDir)) return [];
  const hooksDir = join(gitDir, "hooks");
  mkdirSync(hooksDir, { recursive: true });

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
      written.push(`.git/hooks/${name}`);
    } else {
      // Ensure executability even when bytes are unchanged (cheap, no churn).
      try { chmodSync(target, 0o755); } catch {}
    }
  }
  return written;
}
