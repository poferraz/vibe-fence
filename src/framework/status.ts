import { constants, accessSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { isAbsolute, join, resolve } from "node:path";
import { buildCodexGateHook, CODEX_GATE_COMMAND, CODEX_GATE_FILE, CODEX_GATE_MATCHER } from "../adapters/codex-gate.js";
import { GATE_HOOK_MARKER, GATE_HOOK_SCRIPT, GATE_HOOK_SCRIPT_NAME } from "../adapters/gate-hook.js";
import { HOOK_MARKER, HOOK_NAMES, inspectGitHooks } from "./git-hooks.js";

const CLAUDE_MATCHER = "Read|Write|Edit|MultiEdit|Bash";

function executable(path: string): boolean {
  try { accessSync(path, constants.X_OK); return true; } catch { return false; }
}

function findExecutable(value: string): string | null {
  const paths = value.includes("/") ? [resolve(value)] : (process.env["PATH"] ?? "").split(":").filter(Boolean).map((p) => join(p, value));
  return paths.find(executable) ?? null;
}

export function getProtectionStatus(root: string, host: string) {
  const gate = findExecutable(process.env["FENCE_BIN"] || "vibe-fence");
  const node = findExecutable("node");
  const jq = findExecutable("jq");
  const isClaude = host === "claude" || host === "claude-code";
  let hooksPath: string | null = null;
  let projectRoot = root;
  try {
    projectRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const path = execFileSync("git", ["rev-parse", "--git-path", "hooks"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    hooksPath = isAbsolute(path) ? path : resolve(root, path);
  } catch {}
  const present = hooksPath !== null && HOOK_NAMES.every((name) => {
    const path = join(hooksPath!, name);
    try { return executable(path) && readFileSync(path, "utf8").includes(HOOK_MARKER); } catch { return false; }
  });
  const hooksDirExists = hooksPath !== null && existsSync(hooksPath);
  let hooksInspection: ReturnType<typeof inspectGitHooks> | null = null;
  try { hooksInspection = inspectGitHooks(projectRoot); } catch {}
  const hooksBlockedOutside = Boolean(hooksInspection?.blockedOutside);
  let configured = false;
  let configPresent = false;
  if (host === "codex") {
    const hooksJson = join(projectRoot, ".codex", "hooks.json");
    const scriptPath = join(projectRoot, ".codex", "hooks", CODEX_GATE_FILE);
    try {
      const config = JSON.parse(readFileSync(hooksJson, "utf8"));
      configPresent = true;
      configured = Array.isArray(config?.hooks?.PreToolUse) && config.hooks.PreToolUse.some((entry: { matcher?: unknown; hooks?: unknown[] }) =>
        entry?.matcher === CODEX_GATE_MATCHER && Array.isArray(entry.hooks) && entry.hooks.some((h: unknown) =>
          !!h && typeof h === "object" && (h as { type?: unknown }).type === "command" && (h as { command?: unknown }).command === CODEX_GATE_COMMAND));
      configured = configured && readFileSync(scriptPath, "utf8") === buildCodexGateHook();
    } catch {
      try { readFileSync(hooksJson, "utf8"); configPresent = true; } catch {}
      try { readFileSync(scriptPath, "utf8"); configPresent = true; } catch {}
    }
  }
  if (isClaude) {
    const settingsPath = join(projectRoot, ".claude", "settings.json");
    const scriptPath = join(projectRoot, ".claude", "hooks", GATE_HOOK_SCRIPT_NAME);
    try {
      const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
      configPresent = true;
      const entries = settings?.hooks?.PreToolUse;
      configured = Array.isArray(entries) && entries.some((entry: { matcher?: unknown; hooks?: unknown[] }) =>
        entry?.matcher === CLAUDE_MATCHER && Array.isArray(entry.hooks) && entry.hooks.some((h: unknown) =>
          !!h && typeof h === "object" && typeof (h as { command?: unknown }).command === "string" && ((h as { command: string }).command).includes(GATE_HOOK_MARKER)));
      configured = configured && readFileSync(scriptPath, "utf8") === GATE_HOOK_SCRIPT && executable(scriptPath);
    } catch {
      try { readFileSync(settingsPath, "utf8"); configPresent = true; } catch {}
      try { readFileSync(scriptPath, "utf8"); configPresent = true; } catch {}
    }
  }
  const supported = host === "codex" || isClaude;
  const broken = supported && !configured && configPresent;
  const ready = isClaude ? Boolean(gate && jq) : Boolean(gate && node);
  const toolState = !supported ? "unverified" : broken ? "degraded" : !configured ? "advisory" : ready ? "configured-unverified" : "degraded";
  const hostLabel = isClaude ? "Claude Code" : "Codex";
  return {
    host,
    toolGate: {
      state: toolState,
      next: !supported ? "Select a supported host with --host=codex or --host=claude to inspect its local configuration." :
        broken ? `${hostLabel} hook files are present but do not match the managed hook; repair or reinstall them, then verify in a real session.` :
        !configured ? `${hostLabel} guidance alone does not block tool calls; install the supported hook.` :
        !ready ? (isClaude ? "The hook is configured but its fence or jq executable is unavailable." : "The hook is configured but its fence or Node executable is unavailable.") :
        `Verify the hook in a real ${hostLabel} session; configuration alone is not proof of enforcement.`,
    },
    gitHooks: {
      state: !hooksPath ? "unavailable" : !present ? "inactive" : gate ? "configured-unverified" : "degraded",
      path: hooksPath,
      next: !hooksPath ? "This directory is not a Git repository." :
        hooksBlockedOutside ? `core.hooksPath points outside this project (${hooksPath}); fence hooks are not installed there. Run \`git config core.hooksPath .git/hooks\` from the project root, then re-run \`vibe-fence init\`.` :
        !hooksDirExists ? `The effective Git hook directory does not exist (${hooksPath}); run \`vibe-fence init\` to create the fence hooks, or fix core.hooksPath.` :
        !present ? "The effective Git hook directory does not contain both executable fence hooks." :
        !gate ? "Fence hooks are present, but the fence executable is unavailable." : "Verify hook execution with a safe test in a scratch repository.",
    },
    gateExecutable: gate,
    nodeExecutable: node,
    jqExecutable: jq,
  };
}
