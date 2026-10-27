/**
 * src/adapters/opencode-plugin.test.ts — Enforced tier plugin (Oct 30).
 * The generated fence-guard.js is imported and driven like OpenCode drives
 * it: FenceGuard() → hooks["tool.execute.before"](input, output).
 * Exit 1 from the gate binary throws; exit 0 or missing binary allows.
 * Run: bun test src/adapters/opencode-plugin.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildFenceGuardPlugin, installOpenCodeAdapter, OPENCODE_PLUGIN_NAME, OPENCODE_PLUGIN_MARKER } from "./opencode";

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function writeStub(dir: string, name: string, body: string): string {
  const p = join(dir, name);
  writeFileSync(p, `#!/bin/sh\n${body}\n`, "utf-8");
  chmodSync(p, 0o755);
  return p;
}

type Hook = (input: unknown, output: unknown) => Promise<void>;

async function loadHook(pluginPath: string): Promise<Hook> {
  const mod = (await import(pathToFileURL(pluginPath).href)) as {
    FenceGuard: () => Promise<Record<string, Hook>>;
  };
  expect(typeof mod.FenceGuard).toBe("function");
  const hooks = await mod.FenceGuard();
  expect(typeof hooks["tool.execute.before"]).toBe("function");
  return hooks["tool.execute.before"] as Hook;
}

describe("fence-guard plugin", () => {
  it("throws with the rule reason when the gate exits 1", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vf-plugin-"));
    created.push(dir);
    const plugin = join(dir, OPENCODE_PLUGIN_NAME);
    writeFileSync(plugin, buildFenceGuardPlugin(), "utf-8");
    const deny = writeStub(dir, "deny.sh", 'echo "SEC-01 [block] client-bundle secret"; exit 1');
    const hook = await loadHook(plugin);
    const prev = process.env.FENCE_BIN;
    process.env.FENCE_BIN = deny;
    try {
      let err: Error | null = null;
      try {
        await hook({ tool: "write" }, { args: { filePath: "a.tsx", content: "x" } });
      } catch (e) {
        err = e as Error;
      }
      expect(err).not.toBeNull();
      expect(err?.message).toContain("vibe-fence blocked write");
      expect(err?.message).toContain("SEC-01");
    } finally {
      if (prev === undefined) delete process.env.FENCE_BIN;
      else process.env.FENCE_BIN = prev;
    }
  });

  it("allows when the gate exits 0, and when the binary is missing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vf-plugin-"));
    created.push(dir);
    const plugin = join(dir, OPENCODE_PLUGIN_NAME);
    writeFileSync(plugin, buildFenceGuardPlugin(), "utf-8");
    const allow = writeStub(dir, "allow.sh", "exit 0");
    const hook = await loadHook(plugin);
    const prev = process.env.FENCE_BIN;
    try {
      process.env.FENCE_BIN = allow;
      await hook({ tool: "read" }, { args: { filePath: "src/index.ts" } });
      process.env.FENCE_BIN = join(dir, "does-not-exist");
      await hook({ tool: "read" }, { args: { filePath: "src/index.ts" } });
    } finally {
      if (prev === undefined) delete process.env.FENCE_BIN;
      else process.env.FENCE_BIN = prev;
    }
  });

  it("adapter installs the plugin idempotently and never clobbers unmanaged files", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-oc-"));
    created.push(root);
    const written = installOpenCodeAdapter(root, {});
    expect(written).toContain(`.opencode/plugins/${OPENCODE_PLUGIN_NAME}`);
    const p = join(root, ".opencode", "plugins", OPENCODE_PLUGIN_NAME);
    const before = readFileSync(p, "utf-8");
    expect(before).toContain(OPENCODE_PLUGIN_MARKER);
    expect(before).toContain("tool.execute.before");
    const again = installOpenCodeAdapter(root, {});
    expect(again.filter((f) => f.includes(OPENCODE_PLUGIN_NAME))).toEqual([]);
    expect(readFileSync(p, "utf-8")).toBe(before);
    // Unmanaged occupant wins.
    const other = mkdtempSync(join(tmpdir(), "vf-oc2-"));
    created.push(other);
    mkdirSync(join(other, ".opencode", "plugins"), { recursive: true });
    writeFileSync(join(other, ".opencode", "plugins", OPENCODE_PLUGIN_NAME), "// user's own plugin\n", "utf-8");
    installOpenCodeAdapter(other, {});
    expect(readFileSync(join(other, ".opencode", "plugins", OPENCODE_PLUGIN_NAME), "utf-8")).toBe("// user's own plugin\n");
  });
});
