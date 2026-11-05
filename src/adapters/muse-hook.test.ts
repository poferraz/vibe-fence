import { afterEach, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { buildMuseGateCommand, buildMuseGateHook, installMuseAdapter } from "./muse";

const projects: string[] = [];
afterEach(() => { for (const project of projects.splice(0)) rmSync(project, { recursive: true, force: true }); });

function project(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "vf-muse-hook-")));
  projects.push(root);
  return root;
}

describe("Muse Code pre-tool integration", () => {
  it("binds the same hook through a project path alias", () => {
    const root = project();
    const alias = `${root}-alias`;
    symlinkSync(root, alias, "dir");
    projects.push(alias);
    expect(buildMuseGateCommand(alias)).toBe(buildMuseGateCommand(root));
    expect(buildMuseGateHook(alias)).toBe(buildMuseGateHook(root));
  });

  it("blocks a risky write_file call and permits a safe write", () => {
    const root = project();
    installMuseAdapter(root);
    const script = join(root, ".muse/hooks/fence-gate.cjs");
    expect(existsSync(script)).toBe(true);
    const config = JSON.parse(readFileSync(join(root, ".muse/hooks.json"), "utf8"));
    expect(config.hooks.PreToolUse).toHaveLength(1);
    const invoke = (content: string) => spawnSync("node", [script], {
      cwd: root,
      input: JSON.stringify({ hook_event_name: "PreToolUse", cwd: root, tool_name: "write_file", tool_input: { path: "billing.ts", content } }),
      encoding: "utf8",
      env: { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../../dist/cli.js") },
    });
    const blocked = invoke("const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;");
    expect(blocked.status).toBe(2);
    expect(blocked.stderr).toContain("SEC-01");
    expect(invoke("export const message = 'hello';").status).toBe(0);
  });

  it("preserves existing hooks and stays idempotent", () => {
    const root = project();
    mkdirSync(join(root, ".muse"), { recursive: true });
    const path = join(root, ".muse/hooks.json");
    writeFileSync(path, JSON.stringify({ description: "mine", hooks: { PreToolUse: [{ matcher: "Read", hooks: [{ type: "command", command: "my-hook" }] }, { matcher: "Write", hooks: [] }], Stop: [{ hooks: [] }] } }));
    installMuseAdapter(root);
    const once = readFileSync(path, "utf8");
    installMuseAdapter(root);
    expect(readFileSync(path, "utf8")).toBe(once);
    const config = JSON.parse(once);
    expect(config.description).toBe("mine");
    expect(config.hooks.PreToolUse).toHaveLength(3);
    expect(config.hooks.PreToolUse[0].hooks[0].command).toBe("my-hook");
    expect(config.hooks.PreToolUse[1]).toEqual({ matcher: "Write", hooks: [] });
    expect(config.hooks.Stop).toEqual([{ hooks: [] }]);
  });

  it("does not execute a nested project's substitute hook or runtime", () => {
    const root = project();
    installMuseAdapter(root);
    const nested = join(root, "nested");
    const marker = join(root, "nested-code-executed");
    mkdirSync(join(nested, ".muse/hooks"), { recursive: true });
    writeFileSync(join(nested, ".muse/hooks/fence-gate.cjs"), `require('fs').writeFileSync(${JSON.stringify(marker)},'ran')`);
    const config = JSON.parse(readFileSync(join(root, ".muse/hooks.json"), "utf8"));
    const command = config.hooks.PreToolUse[0].hooks[0].command as string;
    const event = JSON.stringify({ cwd: nested, tool_name: "write_file", tool_input: { path: "billing.ts", content: "const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;" } });
    const direct = spawnSync(command, { shell: true, cwd: nested, input: event, encoding: "utf8", env: { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../../dist/cli.js") } });
    expect(existsSync(marker)).toBe(false);
    expect(direct.status).toBe(2);

    mkdirSync(join(root, ".fence/bin"), { recursive: true });
    const trusted = join(root, ".fence/bin/vibe-fence.cjs");
    writeFileSync(trusted, "#!/usr/bin/env node\nconsole.log('SEC-01'); process.exit(1);\n");
    chmodSync(trusted, 0o755);
    mkdirSync(join(nested, ".fence/bin"), { recursive: true });
    writeFileSync(join(nested, ".fence/config.json"), "{}");
    const substitute = join(nested, ".fence/bin/vibe-fence.cjs");
    writeFileSync(substitute, `#!/usr/bin/env node\nrequire('fs').writeFileSync(${JSON.stringify(marker)},'ran');\n`);
    chmodSync(substitute, 0o755);
    const env = { ...process.env, FENCE_BIN: "" };
    const runtime = spawnSync(command, { shell: true, cwd: nested, input: event, encoding: "utf8", env });
    expect(existsSync(marker)).toBe(false);
    expect(runtime.status).toBe(2);
  });

  it("uses the reported nested cwd when the hook starts from the project root", () => {
    const root = project();
    const nested = join(root, "nested");
    mkdirSync(nested);
    installMuseAdapter(root);
    writeFileSync(join(root, "billing.ts"), 'const note = "marker";\n');
    writeFileSync(join(nested, "billing.ts"), 'const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY; // marker\n');
    const script = join(root, ".muse/hooks/fence-gate.cjs");
    const result = spawnSync("node", [script], {
      cwd: root,
      input: JSON.stringify({ cwd: nested, tool_name: "edit_file", tool_input: { path: "billing.ts", find: "marker", replace: "updated" } }),
      encoding: "utf8",
      env: { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../../dist/cli.js") },
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("SEC-01");
  });

  it("blocks a reported Muse cwd outside the installed project", () => {
    const root = project();
    const outside = project();
    installMuseAdapter(root);
    const script = join(root, ".muse/hooks/fence-gate.cjs");
    const result = spawnSync("node", [script], {
      cwd: root,
      input: JSON.stringify({ cwd: outside, tool_name: "write_file", tool_input: { path: "safe.ts", content: "export const safe = true;" } }),
      encoding: "utf8",
      env: { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../../dist/cli.js") },
    });
    expect(result.status).toBe(2);
  });

  it("resolves a relative runtime override before using the reported nested cwd", () => {
    const root = project();
    const nested = join(root, "nested");
    mkdirSync(nested);
    installMuseAdapter(root);
    const script = join(root, ".muse/hooks/fence-gate.cjs");
    const override = relative(root, resolve(import.meta.dir, "../../dist/cli.js"));
    const result = spawnSync("node", [script], {
      cwd: root,
      input: JSON.stringify({ cwd: nested, tool_name: "write_file", tool_input: { path: "billing.ts", content: "const k = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;" } }),
      encoding: "utf8",
      env: { ...process.env, FENCE_BIN: override },
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("SEC-01");
  });

  it("refreshes the bound hook after moving a project with spaces and quotes", () => {
    const root = project();
    installMuseAdapter(root);
    const moved = `${root} with 'quotes'`;
    renameSync(root, moved);
    projects.push(moved);
    installMuseAdapter(moved);
    const config = JSON.parse(readFileSync(join(moved, ".muse/hooks.json"), "utf8"));
    expect(config.hooks.PreToolUse).toHaveLength(1);
    const command = config.hooks.PreToolUse[0].hooks[0].command as string;
    const event = JSON.stringify({ cwd: moved, tool_name: "write_file", tool_input: { path: "billing.ts", content: "const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;" } });
    const result = spawnSync(command, { shell: true, cwd: moved, input: event, encoding: "utf8", env: { ...process.env, FENCE_BIN: resolve(import.meta.dir, "../../dist/cli.js") } });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("SEC-01");
  });

  it("does not overwrite invalid or symlinked project hooks", () => {
    const root = project();
    mkdirSync(join(root, ".muse"), { recursive: true });
    const config = join(root, ".muse/hooks.json");
    writeFileSync(config, "not json");
    installMuseAdapter(root);
    expect(readFileSync(config, "utf8")).toBe("not json");
    expect(existsSync(join(root, ".muse/hooks/fence-gate.cjs"))).toBe(false);

    const other = project();
    const outside = project();
    symlinkSync(outside, join(other, ".muse"));
    installMuseAdapter(other);
    expect(existsSync(join(outside, "hooks.json"))).toBe(false);
  });
});
