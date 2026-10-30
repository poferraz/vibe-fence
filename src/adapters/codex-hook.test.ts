import { afterEach, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { installCodexAdapter } from "./codex";

const projects: string[] = [];
afterEach(() => {
  for (const project of projects.splice(0)) rmSync(project, { recursive: true, force: true });
});

function project(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "vf-codex-hook-")));
  projects.push(root);
  return root;
}

describe("Codex pre-tool integration", () => {
  it("installs a hook which blocks a dangerous Bash call and permits a safe one", () => {
    const root = project();
    installCodexAdapter(root);
    const config = JSON.parse(readFileSync(join(root, ".codex/hooks.json"), "utf8"));
    expect(config.hooks.PreToolUse).toHaveLength(1);
    expect(config.hooks.PreToolUse[0].matcher).toBe("^(Bash|apply_patch)$");
    const script = join(root, ".codex/hooks/fence-gate.cjs");
    expect(existsSync(script)).toBe(true);
    const invoke = (command: string) => spawnSync("node", [script], {
      cwd: root,
      input: JSON.stringify({ hook_event_name: "PreToolUse", cwd: root, tool_name: "Bash", tool_input: { command } }),
      encoding: "utf8",
      env: { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../../dist/cli.js") },
    });
    const blocked = invoke("rm -rf /");
    expect(blocked.status).toBe(2);
    expect(blocked.stderr).toContain("CMD-01");
    expect(invoke("echo hello").status).toBe(0);
  });

  it("preserves existing hooks and does not duplicate the fence hook", () => {
    const root = project();
    mkdirSync(join(root, ".codex"), { recursive: true });
    const path = join(root, ".codex/hooks.json");
    writeFileSync(path, JSON.stringify({ description: "mine", hooks: { PreToolUse: [{ matcher: "Read", hooks: [{ type: "command", command: "my-hook" }] }], Stop: [{ hooks: [] }] } }));
    installCodexAdapter(root);
    const once = readFileSync(path, "utf8");
    installCodexAdapter(root);
    expect(readFileSync(path, "utf8")).toBe(once);
    const config = JSON.parse(once);
    expect(config.description).toBe("mine");
    expect(config.hooks.PreToolUse).toHaveLength(2);
    expect(config.hooks.PreToolUse[0].hooks[0].command).toBe("my-hook");
    expect(config.hooks.Stop).toEqual([{ hooks: [] }]);
  });

  it("warns that a missing gate leaves an action unchecked", () => {
    const root = project();
    installCodexAdapter(root);
    const result = spawnSync("node", [join(root, ".codex/hooks/fence-gate.cjs")], {
      cwd: root,
      input: JSON.stringify({ hook_event_name: "PreToolUse", cwd: root, tool_name: "Bash", tool_input: { command: "echo hello" } }),
      encoding: "utf8",
      env: { ...process.env, FENCE_BIN: join(root, "missing") },
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).systemMessage).toContain("not checked");
  });

  it("blocks a public-secret write proposed through apply_patch", () => {
    const root = project();
    installCodexAdapter(root);
    const result = spawnSync("node", [join(root, ".codex/hooks/fence-gate.cjs")], {
      cwd: root,
      input: JSON.stringify({ hook_event_name: "PreToolUse", cwd: root, tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Add File: config.ts\n+const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n*** End Patch" } }),
      encoding: "utf8",
      env: { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../../dist/cli.js") },
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("SEC-01");
  });

  it("leaves invalid hook configuration and user-managed scripts untouched", () => {
    const root = project();
    mkdirSync(join(root, ".codex/hooks"), { recursive: true });
    const config = join(root, ".codex/hooks.json");
    const script = join(root, ".codex/hooks/fence-gate.cjs");
    writeFileSync(config, "not json");
    writeFileSync(script, "user-owned script");
    installCodexAdapter(root);
    expect(readFileSync(config, "utf8")).toBe("not json");
    expect(readFileSync(script, "utf8")).toBe("user-owned script");
  });

  it("does not write hook files through an outside-project symlink", () => {
    const root = project();
    const outside = project();
    symlinkSync(outside, join(root, ".codex"));
    installCodexAdapter(root);
    expect(existsSync(join(outside, "hooks.json"))).toBe(false);
    expect(existsSync(join(outside, "hooks"))).toBe(false);
  });
});
