import { constants, accessSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { isAbsolute, join, resolve } from "node:path";
import { buildCodexGateHook, CODEX_GATE_COMMAND, CODEX_GATE_FILE, CODEX_GATE_MATCHER } from "../adapters/codex-gate.js";
import { HOOK_MARKER, HOOK_NAMES } from "./git-hooks.js";

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
  const broken = host === "codex" && !configured && configPresent;
  const toolState = host !== "codex" ? "unverified" : broken ? "degraded" : !configured ? "advisory" : gate && node ? "configured-unverified" : "degraded";
  return {
    host,
    toolGate: {
      state: toolState,
      next: host !== "codex" ? "Select a host with --host=codex to inspect its local configuration." :
        broken ? "Codex hook files are present but do not match the managed hook; repair or reinstall them, then review trust in Codex." :
        !configured ? "Codex guidance alone does not block tool calls; install and trust a supported hook." :
        !gate || !node ? "The hook is configured but its fence or Node executable is unavailable." :
        "Review and trust the hook in Codex, then verify it in a real session; configuration alone is not proof of enforcement.",
    },
    gitHooks: {
      state: !hooksPath ? "unavailable" : !present ? "inactive" : gate ? "configured-unverified" : "degraded",
      path: hooksPath,
      next: !hooksPath ? "This directory is not a Git repository." : !present ? "The effective Git hook directory does not contain both executable fence hooks." :
        !gate ? "Fence hooks are present, but the fence executable is unavailable." : "Verify hook execution with a safe test in a scratch repository.",
    },
    gateExecutable: gate,
    nodeExecutable: node,
  };
}
