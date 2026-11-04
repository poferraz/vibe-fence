import { expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { installClaudeAdapter } from "../src/adapters/claude";
import { installCursorAdapter } from "../src/adapters/cursor";
import { installCodexAdapter } from "../src/adapters/codex";

it("runs the Node gates from a nested project path with spaces", () => {
  const root = mkdtempSync(join(tmpdir(), "vibe fence portable "));
  try {
    const nested = join(root, "nested folder");
    mkdirSync(nested, { recursive: true });
    mkdirSync(join(root, ".fence"), { recursive: true });
    writeFileSync(join(root, ".fence/config.json"), "{}");
    installClaudeAdapter(root);
    installCursorAdapter(root);
    installCodexAdapter(root);
    const config = JSON.parse(readFileSync(join(root, ".codex/hooks.json"), "utf8"));
    const codexCommand = config.hooks.PreToolUse[0].hooks[0].command as string;
    const env = { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../dist/cli.js") };
    for (const host of ["claude", "cursor", "codex"]) {
      const invoke = (command: string) => {
        const opts = { cwd: nested, encoding: "utf8" as const, env,
          input: JSON.stringify({ cwd: nested, tool_name: "Bash", tool_input: { command } }) };
        return host === "codex"
          ? spawnSync(codexCommand, { ...opts, shell: true })
          : spawnSync("node", [join(root, `.${host}/hooks/fence-gate.cjs`)], opts);
      };
      const allowed = invoke("echo hello");
      expect(allowed.status).toBe(0);
      if (host === "cursor") expect(JSON.parse(allowed.stdout)).toEqual({ permission: "allow" });
      const blocked = invoke("rm -rf /");
      expect(blocked.status).toBe(2);
      expect(blocked.stderr).toContain("CMD-01");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
