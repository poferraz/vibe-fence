/** Node-based pre-tool hook shared by Claude Code, Cursor, and Codex. */
import { publicRemediation } from "../framework/public-findings.js";

export const GATE_HOOK_SCRIPT_NAME = "fence-gate.cjs";
export const GATE_HOOK_MARKER = "fence-gate";
export const GATE_HOOK_CONTENT_MARKER = "vibe-fence managed gate hook";
export const LEGACY_GATE_HOOK_NAME = "fence-gate.sh";
export const LEGACY_GATE_WRAPPER = `#!/bin/sh
# vibe-fence managed gate hook — compatibility wrapper.
exec node "$(dirname "$0")/fence-gate.cjs" "$@"
`;

/** Host hooks must not put tool arguments in process arguments or output. */
export function buildGateHook(codex = false): string {
  const marker = codex ? "vibe-fence managed Codex hook" : GATE_HOOK_CONTENT_MARKER;
  const remediations = Object.fromEntries(["SEC-01", "SEC-02", "SEC-03", "NET-01", "SUP-01", "CMD-01", "DB-01", "GIT-01", "FS-01", "BILL-01", "PRV-09"].map(id => [id, publicRemediation(id)]));
  return `// ${marker} — reinstall with vibe-fence init.
const { readFileSync, accessSync, constants, statSync, writeSync, existsSync } = require("node:fs");
const { join, delimiter, isAbsolute, extname, basename, dirname, resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const cursor = basename(dirname(__dirname)) === ".cursor";
function allow() { if (cursor) writeSync(1, JSON.stringify({ permission: "allow" }) + "\\n"); }
function warn(message) {
  const text = "[vibe-fence] " + message;
  if (${codex}) process.stdout.write(JSON.stringify({ systemMessage: text }) + "\\n");
  else { process.stderr.write(text + "\\n"); allow(); }
}
try {
  const event = JSON.parse(readFileSync(0, "utf8"));
  const tool = event && (event.tool_name || event.toolName || event.tool);
  const args = event && (event.tool_input || event.toolInput || event.toolArgs || event.input || (typeof event.command === "string" ? { command: event.command } : null));
  if (typeof tool !== "string" || !args || typeof args !== "object" || Array.isArray(args)) {
    warn("Hook input is invalid; this action was not checked.");
    process.exit(0);
  }
  const start = (typeof event.cwd === "string" && event.cwd) || process.env.CLAUDE_PROJECT_DIR || process.env.CURSOR_PROJECT_DIR || process.cwd();
  let root = resolve(start), probe = root;
  // Claude can keep the original hook path after entering another worktree.
  // Stop at that worktree's Git marker even if it has no local fence config.
  while (true) {
    if (existsSync(join(probe, ".fence", "config.json")) || existsSync(join(probe, ".git"))) { root = probe; break; }
    const parent = dirname(probe);
    if (parent === probe) break;
    probe = parent;
  }
  const executable = (name) => {
    if (!name) return null;
    const paths = isAbsolute(name) || name.includes("/") || name.includes("\\\\") ? [name] : (process.env.PATH || "").split(delimiter).map(p => join(p || ".", name));
    for (const p of paths) { try { accessSync(p, constants.X_OK); if (statSync(p).isFile()) return p; } catch {} }
    return null;
  };
  const override = executable(process.env.FENCE_BIN);
  if (process.env.FENCE_BIN && !override) process.stderr.write("[vibe-fence] FENCE_BIN unavailable; trying the project runtime.\\n");
  const bin = override || executable(join(root, ".fence/bin/vibe-fence.cjs")) || executable(join(root, ".fence/bin/vibe-fence")) || executable("vibe-fence");
  if (!bin) { warn("The gate is unavailable; this action was not checked."); process.exit(0); }
  const gateArgs = ["gate", "--tool", tool, "--args-stdin", "--root", root];
  const nodeScript = [".js", ".cjs", ".mjs"].includes(extname(bin).toLowerCase());
  const result = spawnSync(nodeScript ? process.execPath : bin, nodeScript ? [bin, ...gateArgs] : gateArgs, { input: JSON.stringify(args), encoding: "utf8", timeout: 10000 });
  if (result.status === 1) {
    const ids = [...new Set((result.stdout || "").match(/\\b[A-Z]+-\\d{2}\\b/g) || [])];
    if (/\\bCIRCUIT-OPEN\\b/.test(result.stdout || "")) process.stderr.write("vibe-fence circuit breaker is open. Stop retrying and ask the user; run vibe-fence reset after review.\\n");
    else if ((result.stdout || "").includes("Network command limit reached")) process.stderr.write("vibe-fence network command limit reached. Review the loop and run vibe-fence reset after review; this count does not measure cloud spend.\\n");
    else process.stderr.write("vibe-fence blocked this action" + (ids.length ? " (" + ids.join(", ") + ")" : "") + ".\\n");
    let level = "max";
    try { level = JSON.parse(readFileSync(join(root, ".fence/state/dial.json"), "utf8")).global; } catch {}
    if (ids.length && (level === "max" || level === "medium")) {
      const fixes = ${JSON.stringify(remediations)};
      const id = ids[0];
      process.stderr.write("Copy-paste this into your AI: vibe-fence blocked " + id + ". " + (fixes[id] || "Review and fix the issue.") + " Re-run vibe-fence check.\\n");
    }
    process.exit(2);
  }
  if (result.status !== 0) warn("The gate is unavailable; this action was not checked.");
  else allow();
} catch {
  warn("The hook could not check this action; it was not checked.");
}
`;
}

export const GATE_HOOK_SCRIPT = buildGateHook();
