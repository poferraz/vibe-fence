import { afterEach, describe, expect, it } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { getProtectionStatus } from "./status";
import { HOOK_MARKER } from "./git-hooks";

const created: string[] = [];
const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
afterEach(() => { for (const path of created.splice(0)) rmSync(path, { recursive: true, force: true }); });

function makeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "vf-status-hooks-"));
  created.push(root);
  execFileSync("git", ["init", "-q", root], { env });
  return root;
}

function statusFor(root: string): ReturnType<typeof getProtectionStatus>["gitHooks"] {
  const code = `import {getProtectionStatus} from ${JSON.stringify(new URL("./status.ts", import.meta.url).pathname)}; console.log(JSON.stringify(getProtectionStatus(process.cwd(), "none").gitHooks));`;
  return JSON.parse(execFileSync("bun", ["-e", code], { cwd: root, env, encoding: "utf8" }));
}

describe("Git hook status safety", () => {
  it("does not describe an unsafe default hooks symlink as a configured redirect", () => {
    const root = makeRepo();
    const outside = mkdtempSync(join(tmpdir(), "vf-status-outside-"));
    created.push(outside);
    const hooks = join(root, ".git", "hooks");
    rmSync(hooks, { recursive: true });
    symlinkSync(outside, hooks, "dir");
    const status = statusFor(root);
    expect(status.state).toBe("inactive");
    expect(status.next).not.toContain("core.hooksPath points outside");
    expect(status.next).toContain("symlink");
  });

  it("reports existing external fence hooks without claiming they were not installed", () => {
    const root = makeRepo();
    const outside = mkdtempSync(join(tmpdir(), "vf-status-outside-"));
    created.push(outside);
    for (const name of ["pre-commit", "pre-push"]) {
      const path = join(outside, name);
      writeFileSync(path, `#!/bin/sh\n${HOOK_MARKER}\nexit 0\n`);
      chmodSync(path, 0o755);
    }
    execFileSync("git", ["config", "--local", "core.hooksPath", outside], { cwd: root, env });
    const status = statusFor(root);
    expect(status.state).not.toBe("inactive");
    expect(status.next).not.toContain("fence hooks are not installed there");
    expect(status.next).toContain("present");
    expect(status.next).toContain("unverified");
  });
});

it("reports Cursor and OpenCode as configured but unverified with a local launcher", async () => {
  const { mkdirSync, realpathSync } = await import("node:fs");
  const { installCursorAdapter } = await import("../adapters/cursor");
  const { installOpenCodeAdapter } = await import("../adapters/opencode");
  const root = makeRepo();
  mkdirSync(join(root, ".fence/bin"), { recursive: true });
  const local = join(root, ".fence/bin/vibe-fence");
  writeFileSync(local, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  installCursorAdapter(root);
  installOpenCodeAdapter(root);
  const previous = process.env.FENCE_BIN;
  process.env.FENCE_BIN = join(root, "missing");
  try {
    for (const host of ["cursor", "opencode"]) {
      const result = getProtectionStatus(root, host);
      expect(result.gateExecutable).toBe(realpathSync(local));
      expect(result.toolGate.state).toBe("configured-unverified");
    }
  } finally { if (previous === undefined) delete process.env.FENCE_BIN; else process.env.FENCE_BIN = previous; }
});

it("reports a configured Codex hook outside a Git repository", async () => {
  const { mkdirSync } = await import("node:fs");
  const { installCodexAdapter } = await import("../adapters/codex");
  const root = mkdtempSync(join(tmpdir(), "vf-status-no-git-"));
  created.push(root);
  installCodexAdapter(root);
  mkdirSync(join(root, ".fence/bin"), { recursive: true });
  writeFileSync(join(root, ".fence/bin/vibe-fence"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  const status = getProtectionStatus(root, "codex");
  expect(status.toolGate.state).toBe("configured-unverified");
  expect(status.toolGate.next).toContain("real Codex session");
});

it("reports local Git hooks degraded when Node is missing", async () => {
  const { mkdirSync } = await import("node:fs");
  const { installGitHooks } = await import("./git-hooks");
  const root = makeRepo(), bins = mkdtempSync(join(tmpdir(), "vf-status-path-"));
  created.push(bins);
  symlinkSync(execFileSync("which", ["git"], { encoding: "utf8" }).trim(), join(bins, "git"));
  mkdirSync(join(root, ".fence/bin"), { recursive: true });
  writeFileSync(join(root, ".fence/bin/vibe-fence"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  installGitHooks(root, env);
  const code = `import {getProtectionStatus} from ${JSON.stringify(new URL("./status.ts", import.meta.url).pathname)}; console.log(JSON.stringify(getProtectionStatus(process.cwd(), "codex")));`;
  const result = JSON.parse(execFileSync(process.execPath, ["-e", code], { cwd: root, encoding: "utf8", env: { ...env, FENCE_BIN: "", PATH: bins } }));
  expect(result.gitHooks.state).toBe("degraded");
  expect(result.gitHooks.next).toContain("Node");
});
