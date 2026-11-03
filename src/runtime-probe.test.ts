import { describe, expect, it } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install, probeRuntime } from "./install.js";

describe("runtime hook probe", () => {
  it("preserves an existing probe symlink and its outside target", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-probe-root-"));
    const outside = mkdtempSync(join(tmpdir(), "vf-probe-outside-"));
    const oldGlobal = process.env.GIT_CONFIG_GLOBAL;
    const oldSystem = process.env.GIT_CONFIG_SYSTEM;
    process.env.GIT_CONFIG_GLOBAL = "/dev/null";
    process.env.GIT_CONFIG_SYSTEM = "/dev/null";
    try {
      execFileSync("git", ["init", "-q", root]);
      const target = join(outside, "user-file");
      const probe = join(root, ".git", "hooks", ".fence-probe");
      writeFileSync(target, "preserve me\n");
      symlinkSync(target, probe);
      expect(probeRuntime(root).runtime).toBe("native");
      expect(readFileSync(target, "utf8")).toBe("preserve me\n");
      expect(existsSync(probe)).toBe(true);
    } finally {
      if (oldGlobal === undefined) delete process.env.GIT_CONFIG_GLOBAL; else process.env.GIT_CONFIG_GLOBAL = oldGlobal;
      if (oldSystem === undefined) delete process.env.GIT_CONFIG_SYSTEM; else process.env.GIT_CONFIG_SYSTEM = oldSystem;
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("does not create the hook directory during a dry run", async () => {
    const root = mkdtempSync(join(tmpdir(), "vf-probe-dry-"));
    const oldGlobal = process.env.GIT_CONFIG_GLOBAL;
    const oldSystem = process.env.GIT_CONFIG_SYSTEM;
    process.env.GIT_CONFIG_GLOBAL = "/dev/null";
    process.env.GIT_CONFIG_SYSTEM = "/dev/null";
    try {
      execFileSync("git", ["init", "-q", root]);
      const hooks = join(root, ".git", "hooks");
      rmSync(hooks, { recursive: true, force: true });
      await install(root, { dryRun: true, adapters: [] });
      expect(existsSync(hooks)).toBe(false);
    } finally {
      if (oldGlobal === undefined) delete process.env.GIT_CONFIG_GLOBAL; else process.env.GIT_CONFIG_GLOBAL = oldGlobal;
      if (oldSystem === undefined) delete process.env.GIT_CONFIG_SYSTEM; else process.env.GIT_CONFIG_SYSTEM = oldSystem;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
