/** Project-local Codex hook; see https://learn.chatgpt.com/docs/hooks. */
import { buildGateHook } from "./gate-hook.js";

export const CODEX_GATE_MARKER = "vibe-fence managed Codex hook";
export const CODEX_GATE_FILE = "fence-gate.cjs";
export const LEGACY_CODEX_GATE_COMMAND = 'node "$(git rev-parse --show-toplevel)/.codex/hooks/fence-gate.cjs"';
// Codex runs commands from the session cwd, which can be nested. This uses only
// Node and double-quoted shell syntax understood by both POSIX shells and cmd.
export const CODEX_GATE_COMMAND = `node -e "let p=process.cwd(),d=require('path'),f=require('fs'),h='.codex/hooks/fence-gate.cjs';while(!f.existsSync(d.join(p,h))&&d.dirname(p)!==p)p=d.dirname(p);require(d.join(p,h))"`;
/** Codex matches this regex against the canonical tool name. */
export const CODEX_GATE_MATCHER = "^(Bash|apply_patch)$";

export function buildCodexGateHook(): string {
  return buildGateHook(true);
}
