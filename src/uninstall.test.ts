import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installClaudeAdapter } from "./adapters/claude";
import { captureInstallBaseline, recordInstallResult, runUninstall } from "./uninstall";

const scratch: string[] = [];
afterEach(() => { for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true }); });

test("uninstall preserves unchanged user hook entries when removing Fence from edited settings", () => {
  const root = mkdtempSync(join(tmpdir(), "vf-uninstall-hooks-")); scratch.push(root);
  mkdirSync(join(root, ".claude"));
  const path = join(root, ".claude/settings.json");
  writeFileSync(path, "{}\n");
  const baseline = captureInstallBaseline(root, [".claude/settings.json"]);
  installClaudeAdapter(root);
  recordInstallResult(root, baseline);
  const settings = JSON.parse(readFileSync(path, "utf8"));
  const ownEmpty = { matcher: "UserOwnedEmpty", hooks: [] };
  const ownHook = { matcher: "Bash", hooks: [{ type: "command", command: "echo user-hook" }] };
  settings.hooks.PreToolUse.push(ownEmpty, ownHook);
  writeFileSync(path, JSON.stringify(settings));
  runUninstall(root);
  const remaining = JSON.parse(readFileSync(path, "utf8"));
  expect(remaining.hooks.PreToolUse).toEqual([ownEmpty, ownHook]);
});
