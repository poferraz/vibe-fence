/** Project-local Codex hook; see https://learn.chatgpt.com/docs/hooks. */
export const CODEX_GATE_MARKER = "vibe-fence managed Codex hook";
export const CODEX_GATE_FILE = "fence-gate.cjs";
export const CODEX_GATE_COMMAND = 'node "$(git rev-parse --show-toplevel)/.codex/hooks/fence-gate.cjs"';
/** Codex matches this regex against the canonical tool name. */
export const CODEX_GATE_MATCHER = "^(Bash|apply_patch)$";

/** The generated hook runs in Node and never logs tool arguments. */
export function buildCodexGateHook(): string {
  return `// ${CODEX_GATE_MARKER} — reinstall with vibe-fence init.
const { readFileSync, accessSync, constants, statSync } = require("node:fs");
const { join, delimiter } = require("node:path");
const { spawnSync } = require("node:child_process");
function warn(message) {
  process.stdout.write(JSON.stringify({ systemMessage: "[vibe-fence] " + message }) + "\\n");
}
try {
  const event = JSON.parse(readFileSync(0, "utf8"));
  if (typeof event.tool_name !== "string" || !event.tool_input || typeof event.tool_input !== "object" || Array.isArray(event.tool_input)) {
    warn("Hook input is invalid; this action was not checked.");
    process.exit(0);
  }
  const root = event.cwd || process.cwd();
  const executable = (name) => {
    if (!name) return null;
    const paths = name.includes("/") ? [name] : (process.env.PATH || "").split(delimiter).map(p => join(p || ".", name));
    for (const p of paths) { try { accessSync(p, constants.X_OK); if (statSync(p).isFile()) return p; } catch {} }
    return null;
  };
  const override = executable(process.env.FENCE_BIN);
  if (process.env.FENCE_BIN && !override) process.stderr.write("[vibe-fence] FENCE_BIN unavailable; trying the project runtime.\\n");
  const bin = override || executable(join(root, ".fence/bin/vibe-fence")) || executable("vibe-fence");
  if (!bin) { warn("The gate is unavailable; this action was not checked."); process.exit(0); }
  const result = spawnSync(bin, ["gate", "--tool", event.tool_name, "--args-stdin", "--root", root], { input: JSON.stringify(event.tool_input), encoding: "utf8", timeout: 10000 });
  if (result.status === 1) {
    const ids = [...new Set((result.stdout || "").match(/\\b[A-Z]+-\\d{2}\\b/g) || [])];
    process.stderr.write("vibe-fence blocked this action" + (ids.length ? " (" + ids.join(", ") + ")" : "") + ".\\n");
    process.exit(2);
  }
  if (result.status !== 0) warn("The gate is unavailable; this action was not checked.");
} catch {
  warn("The hook could not check this action.");
}
`;
}
