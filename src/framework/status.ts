import { buildFenceGuardPlugin } from "../adapters/opencode.js";
import { constants, accessSync, existsSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { buildCodexGateHook, CODEX_GATE_COMMAND, CODEX_GATE_FILE, CODEX_GATE_MATCHER } from "../adapters/codex-gate.js";
import { GATE_HOOK_MARKER, GATE_HOOK_SCRIPT, GATE_HOOK_SCRIPT_NAME } from "../adapters/gate-hook.js";
import { HOOK_MARKER, HOOK_NAMES, inspectGitHooks, hooksRepairCommand, hooksRepairNote, commonHooksDir, canonicalPath } from "./git-hooks.js";

const CLAUDE_MATCHER = "Read|Write|Edit|MultiEdit|Bash";

function executable(path: string): boolean {
  try { accessSync(path, constants.X_OK); return statSync(path).isFile(); } catch { return false; }
}

function findExecutable(value: string): string | null {
  const paths = value.includes("/") ? [resolve(value)] : (process.env["PATH"] ?? "").split(":").filter(Boolean).map((p) => join(p, value));
  return paths.find(executable) ?? null;
}

const ADAPTER_IDS = ["antigravity", "claude", "codex", "cursor", "hermes", "opencode"] as const;

export function getProtectionStatus(root: string, host?: string) {
  const node = findExecutable("node");
  const jq = findExecutable("jq");
  let hooksPath: string | null = null;
  let projectRoot = root;
  let gitRootResolved = false;
  try {
    projectRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    gitRootResolved = true;
    const path = execFileSync("git", ["rev-parse", "--git-path", "hooks"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    hooksPath = isAbsolute(path) ? path : resolve(root, path);
  } catch {}
  const installedHosts = ADAPTER_IDS.filter(id => {
    try {
      const receipt = JSON.parse(readFileSync(join(projectRoot, ".fence", "adapters", `${id}.json`), "utf8"));
      return receipt?.version === 1 && receipt.adapter === id && typeof receipt.receipt === "string" && receipt.receipt.includes("vibe-fence");
    } catch { return false; }
  });
  const autoDetected = !host && installedHosts.length === 1;
  host = host || (autoDetected ? installedHosts[0]! : "unknown");
  const isClaude = host === "claude" || host === "claude-code";
  const gate = (process.env["FENCE_BIN"] ? findExecutable(process.env["FENCE_BIN"]!) : null) || findExecutable(join(projectRoot, ".fence/bin/vibe-fence")) || findExecutable("vibe-fence");
  const present = hooksPath !== null && HOOK_NAMES.every((name) => {
    const path = join(hooksPath!, name);
    try { return executable(path) && readFileSync(path, "utf8").includes(HOOK_MARKER); } catch { return false; }
  });
  const hooksDirExists = hooksPath !== null && existsSync(hooksPath);
  let hooksInspection: ReturnType<typeof inspectGitHooks> | null = null;
  try { hooksInspection = inspectGitHooks(projectRoot); } catch {}
  const hooksBlockedOutside = Boolean(hooksInspection?.blockedOutside);
  let safeCommonRepair = false;
  if (hooksBlockedOutside && hooksInspection?.configured) {
    try {
      const common = commonHooksDir(projectRoot);
      safeCommonRepair = Boolean(common && canonicalPath(common) === join(canonicalPath(dirname(common)), basename(common)));
    } catch {}
  }
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
  if (host === "cursor") {
    const config = join(projectRoot, ".cursor/hooks.json");
    const script = join(projectRoot, ".cursor/hooks", GATE_HOOK_SCRIPT_NAME);
    try {
      const data = JSON.parse(readFileSync(config, "utf8")); configPresent = true;
      configured = Array.isArray(data?.hooks?.preToolUse) && data.hooks.preToolUse.some((entry: { command?: unknown }) => entry?.command === `.cursor/hooks/${GATE_HOOK_SCRIPT_NAME}`) && readFileSync(script, "utf8") === GATE_HOOK_SCRIPT && executable(script);
    } catch { configPresent = existsSync(config) || existsSync(script); }
  }
  if (host === "opencode") {
    const script = join(projectRoot, ".opencode/plugins/fence-guard.js");
    configPresent = existsSync(script);
    try { configured = readFileSync(script, "utf8") === buildFenceGuardPlugin(); } catch {}
  }
  const supported = host === "codex" || isClaude || host === "cursor" || host === "opencode";
  const advisoryHost = host === "antigravity" || host === "hermes";
  const advisoryReady = advisoryHost && installedHosts.some(id => id === host) && existsSync(join(projectRoot, "AGENTS.md")) &&
    existsSync(join(projectRoot, ".agents", "skills")) && (host !== "antigravity" || existsSync(join(projectRoot, ".agents", "rules", "antigravity.md")));
  const broken = supported && !configured && configPresent;
  const codexWithoutGit = host === "codex" && configured && !gitRootResolved;
  const shellHook = isClaude || host === "cursor";
  const ready = Boolean(gate && node && (!shellHook || jq));
  const gitReady = Boolean(gate && (gate !== join(projectRoot, ".fence/bin/vibe-fence") || node));
  const toolState = advisoryHost ? advisoryReady ? "advisory" : "unverified" : !supported ? "unverified" : broken || codexWithoutGit ? "degraded" : !configured ? "advisory" : ready ? "configured-unverified" : "degraded";
  const hostLabel = isClaude ? "Claude Code" : host === "cursor" ? "Cursor" : host === "opencode" ? "OpenCode" : "Codex";
  return {
    host,
    installedHosts,
    autoDetected,
    toolGate: {
      state: toolState,
      next: advisoryHost ? advisoryReady ? "This adapter provides guidance only and does not block tool calls. Use Git hooks and run './.fence/bin/vibe-fence check'." : "Advisory guidance or its install receipt is missing; run 'vibe-fence init' for this host." :
        !supported ? installedHosts.length > 1 && host === "unknown" ? `Installed adapters: ${installedHosts.join(", ")}. Select one with --host=<name> to inspect its local configuration.` : "Select a supported host with --host=codex, --host=claude, --host=cursor, --host=opencode, --host=antigravity, or --host=hermes to inspect its local configuration." :
        broken ? `${hostLabel} hook files are present but do not match the managed hook; repair or reinstall them, then verify in a real session.` :
        codexWithoutGit ? "The Codex hook needs Git and a Git repository to locate the project; initialize Git and verify the hook in a real session." :
        !configured ? `${hostLabel} guidance alone does not block tool calls; install the supported hook.` :
        !ready ? (shellHook ? "The hook is configured but its fence or jq executable is unavailable." : "The hook is configured but its fence or Node executable is unavailable.") :
        `Verify the hook in a real ${hostLabel} session; configuration alone is not proof of enforcement.`,
    },
    gitHooks: {
      state: !hooksPath ? "unavailable" : !present ? "inactive" : gitReady ? "configured-unverified" : "degraded",
      path: hooksPath,
      next: !hooksPath ? "This directory is not a Git repository." :
        hooksBlockedOutside ?
          `${hooksInspection?.configured ? `The configured Git hooks directory (${hooksPath}) is outside this project or cannot be resolved safely` : `The default Git hooks directory (${hooksPath}) contains an unsafe or unresolvable symlink`}; the installer will not write there. ` +
          (present ? "Fence hooks appear present, but their execution is unverified. " : "Fence hooks were not detected there. ") +
          (safeCommonRepair ? `To use the common hooks directory, run \`${hooksRepairCommand(projectRoot)}\`, then re-run \`vibe-fence init\`. ${hooksRepairNote(projectRoot)}` : "Inspect the hooks directory and choose a safe location before re-running `vibe-fence init`.") :
        !hooksDirExists ? `The effective Git hook directory does not exist (${hooksPath}); run \`vibe-fence init\` to create the fence hooks, or fix core.hooksPath.` :
        !present ? "The effective Git hook directory does not contain both executable fence hooks." :
        !gitReady ? "Fence hooks are present, but the fence executable or its required Node runtime is unavailable." : "Verify hook execution with a safe test in a scratch repository.",
    },
    gateExecutable: gate,
    nodeExecutable: node,
    jqExecutable: jq,
  };
}
