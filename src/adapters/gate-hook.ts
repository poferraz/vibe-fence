/**
 * src/adapters/gate-hook.ts — managed PreToolUse/preToolUse hook script.
 * Shared by the Claude (`.claude/hooks/fence-gate.sh`) and Cursor
 * (`.cursor/hooks/fence-gate.sh`) adapters. Installed executable by init;
 * registered in the host config with a fail-open-with-warn contract that
 * mirrors the OpenCode plugin: gate exit 1 → hook exit 2 (block), anything
 * else warns on stderr and allows. POSIX sh (dash-clean), jq for JSON.
 */
export const GATE_HOOK_SCRIPT_NAME = "fence-gate.sh";

/** Matches hook entries managed by us (dedup key on re-install). */
export const GATE_HOOK_MARKER = "fence-gate.sh";

export const GATE_HOOK_SCRIPT = `#!/bin/sh
# vibe-fence managed gate hook — safe to delete; reinstall via \`vibe-fence init\`.
# PreToolUse/preToolUse: evaluates the tool call with \`vibe-fence gate\`.
# Exit 2 blocks the call; anything else allows it. Missing binary/jq warns on
# stderr and allows (fail open — degrades, never bricks the agent session).
# Field names differ by host (Claude: tool_name/tool_input; Cursor: tool name
# + input under varying keys) — try each in turn.
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // .tool // .toolName // empty' 2>/dev/null)
if [ -z "$TOOL" ]; then
  echo "[vibe-fence] hook input unreadable (jq missing?) — allowing." >&2
  exit 0
fi
ARGS=$(printf '%s' "$INPUT" | jq -c '.tool_input // .input // .toolInput // {}' 2>/dev/null)
if [ -z "$ARGS" ]; then
  echo "[vibe-fence] hook args unreadable — allowing $TOOL." >&2
  exit 0
fi
if [ -n "$FENCE_BIN" ]; then
  BIN="$FENCE_BIN"
elif command -v vibe-fence >/dev/null 2>&1; then
  BIN="vibe-fence"
else
  echo "[vibe-fence] binary not found (install vibe-fence or set FENCE_BIN) — allowing $TOOL." >&2
  exit 0
fi
OUT=$("$BIN" gate --tool "$TOOL" --args "$ARGS" 2>&1)
CODE=$?
if [ "$CODE" -eq 1 ]; then
  echo "vibe-fence blocked $TOOL: $OUT" >&2
  exit 2
fi
if [ "$CODE" -ne 0 ]; then
  echo "[vibe-fence] gate error (exit $CODE: $OUT) — allowing $TOOL." >&2
fi
exit 0
`;
