#!/bin/sh
# vibe-fence postinstall guard (managed) — safe to delete; reinstall via `vibe-fence init`.
# Re-scan the tree after `npm install` so a dependency cannot silently plant a
# malicious AGENTS.md/SKILL.md before the agent ever runs. Wire it from your
# package.json (`"prepare": ".fence/hooks/postinstall-guard.sh"`) or run manually.
# Graceful when the binary is absent (never bricks install), loud always (L6).
# A set-but-broken FENCE_BIN falls through to PATH, then to the loud skip.
# NOTE: no bare `&&` as a statement — under `set -e` a false `&&` list exits.
set -e
BIN=""
if [ -n "$FENCE_BIN" ]; then
  case "$FENCE_BIN" in
    *"/"*) [ -x "$FENCE_BIN" ] && BIN="$FENCE_BIN" || true ;;
    *) BIN=$(command -v "$FENCE_BIN" || true) ;;
  esac
fi
if [ -z "$BIN" ]; then
  BIN=$(command -v vibe-fence || true)
fi
if [ -n "$BIN" ]; then
  exec "$BIN" check
else
  echo "vibe-fence: postinstall guard skipped — binary not found (install vibe-fence or set FENCE_BIN)." >&2
  echo "vibe-fence: WARNING: install ran WITHOUT the fence; run 'vibe-fence check' before building." >&2
  exit 0
fi
