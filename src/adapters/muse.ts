/** Project-local Muse Code PreToolUse hook. */
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { adapterPathsSafe } from "./safe-paths.js";
import { mergeAgentsMd } from "./claude.js";
import { buildGateHook, GATE_HOOK_CONTENT_MARKER, GATE_HOOK_SCRIPT_NAME } from "./gate-hook.js";
import { writeAdapterReceipt } from "./receipts.js";

const COMMAND_PREFIX = `node -e "/* vibe-fence:muse */require(Buffer.from('`;
const COMMAND_SUFFIX = `','base64').toString('utf8'))"`;

function canonicalProjectRoot(projectRoot: string): string {
  try { return realpathSync(projectRoot); } catch { return resolve(projectRoot); }
}

/** Bind the hook to its installed project, even when a tool's cwd is nested. */
export function buildMuseGateCommand(projectRoot: string): string {
  const script = join(canonicalProjectRoot(projectRoot), ".muse", "hooks", GATE_HOOK_SCRIPT_NAME);
  return COMMAND_PREFIX + Buffer.from(script).toString("base64") + COMMAND_SUFFIX;
}

export function isMuseGateCommand(value: unknown): boolean {
  if (typeof value !== "string" || !value.startsWith(COMMAND_PREFIX) || !value.endsWith(COMMAND_SUFFIX)) return false;
  return /^[A-Za-z0-9+/=]+$/.test(value.slice(COMMAND_PREFIX.length, -COMMAND_SUFFIX.length));
}

export function buildMuseGateHook(projectRoot: string): string {
  return buildGateHook(false, canonicalProjectRoot(projectRoot));
}

export function installMuseAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const paths = ["AGENTS.md", ".fence/adapters/muse.json", ".muse/hooks.json", ".muse/hooks/fence-gate.cjs"];
  if (!adapterPathsSafe(projectRoot, paths)) {
    console.warn("[vibe-fence] Muse configuration contains a managed symlink; leaving it unchanged.");
    return [];
  }
  const configPath = join(projectRoot, ".muse/hooks.json");
  const scriptPath = join(projectRoot, ".muse/hooks", GATE_HOOK_SCRIPT_NAME);
  const previousScript = existsSync(scriptPath) ? readFileSync(scriptPath, "utf8") : null;
  if (previousScript !== null && !previousScript.includes(GATE_HOOK_CONTENT_MARKER)) {
    console.warn("[vibe-fence] Muse gate hook is user-managed; leaving it unchanged.");
    return [];
  }

  let config: string;
  try {
    const raw = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid hooks config");
    const hooks = raw.hooks ?? {};
    if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) throw new Error("invalid hooks object");
    const existing = hooks.PreToolUse ?? [];
    if (!Array.isArray(existing)) throw new Error("invalid PreToolUse hooks");
    const withoutOurs = existing.flatMap((entry: unknown) => {
      if (!entry || typeof entry !== "object" || !Array.isArray((entry as { hooks?: unknown }).hooks)) return [entry];
      const group = entry as { hooks: unknown[] };
      const remaining = group.hooks.filter((hook: unknown) => !hook || typeof hook !== "object" || !isMuseGateCommand((hook as { command?: unknown }).command));
      if (remaining.length === group.hooks.length) return [entry];
      return remaining.length ? [{ ...group, hooks: remaining }] : [];
    });
    // An omitted matcher covers Muse's native names, including write_file.
    const next = { ...raw, hooks: { ...hooks, PreToolUse: [
      ...withoutOurs,
      { hooks: [{ type: "command", command: buildMuseGateCommand(projectRoot), timeout: 15 }] },
    ] } };
    config = JSON.stringify(next, null, 2) + "\n";
  } catch {
    console.warn("[vibe-fence] Muse hooks configuration is invalid; leaving it unchanged.");
    return [];
  }

  const written: string[] = [];
  const agentsPath = join(projectRoot, "AGENTS.md");
  const agents = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : null;
  const nextAgents = mergeAgentsMd(agents);
  if (agents !== nextAgents) { writeFileSync(agentsPath, nextAgents, "utf8"); written.push("AGENTS.md"); }
  mkdirSync(join(projectRoot, ".muse/hooks"), { recursive: true });
  const script = buildMuseGateHook(projectRoot);
  if (previousScript !== script) { writeFileSync(scriptPath, script, "utf8"); written.push(".muse/hooks/fence-gate.cjs"); }
  chmodSync(scriptPath, 0o755);
  if (!existsSync(configPath) || readFileSync(configPath, "utf8") !== config) {
    writeFileSync(configPath, config, "utf8"); written.push(".muse/hooks.json");
  }
  const receipt = writeAdapterReceipt(projectRoot, "muse", {
    model_mode: opts.modelMode ?? "standard",
    companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
    architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
    receipt: "vibe-fence Muse Code adapter installed — project trust and host execution not verified",
  });
  if (receipt.changed) written.push(".fence/adapters/muse.json");
  return written;
}
