/**
 * src/framework/git-hooks.test.ts — Guarded tier git hooks (Oct 29).
 * init installs pre-commit/pre-push running `vibe-fence check`; existing
 * user hooks are chained, never clobbered; re-run is zero-churn.
 * Run: bun test src/framework/git-hooks.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { installGitHooks, configuredHooksPath, HOOK_NAMES, HOOK_MARKER } from "./git-hooks";

// Isolate fixtures from the developer's own gitconfig (e.g. a global
// core.hooksPath would silently redirect hooks away from .git/hooks).
function gitEnv(extra: Record<string, string> = {}): Record<string, string> {
  return {
    ...(process.env as Record<string, string>),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    ...extra,
  };
}

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function gitAvailable(): boolean {
  try {
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function makeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "vf-hooks-"));
  created.push(root);
  execSync("git init -q .", { cwd: root, env: gitEnv() });
  execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -q --allow-empty -m init', {
    cwd: root,
    env: gitEnv(),
  });
  return root;
}

function writeStub(dir: string, name: string, exitCode: number): string {
  const p = join(dir, name);
  writeFileSync(p, `#!/bin/sh\nexit ${exitCode}\n`, "utf-8");
  chmodSync(p, 0o755);
  return p;
}

describe("git-hooks", () => {
  it("installs managed pre-commit + pre-push, executable, idempotent bytes", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const written = installGitHooks(root);
    expect(written.sort()).toEqual([".git/hooks/pre-commit", ".git/hooks/pre-push"]);
    const before: Record<string, string> = {};
    for (const name of HOOK_NAMES) {
      const p = join(root, ".git", "hooks", name);
      expect(existsSync(p)).toBe(true);
      expect(statSync(p).mode & 0o111).toBeTruthy();
      before[name] = readFileSync(p, "utf-8");
      expect(before[name]).toContain(HOOK_MARKER);
    }
    // Re-run: zero churn.
    installGitHooks(root);
    for (const name of HOOK_NAMES) {
      expect(readFileSync(join(root, ".git", "hooks", name), "utf-8")).toBe(before[name]);
    }
  });

  it("chains (never clobbers) an existing user hook", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const userHook = join(root, ".git", "hooks", "pre-commit");
    mkdirSync(join(root, ".git", "hooks"), { recursive: true });
    writeFileSync(userHook, `#!/bin/sh\necho user-hook-ran\n`, "utf-8");
    chmodSync(userHook, 0o755);
    installGitHooks(root);
    const backup = join(root, ".git", "hooks", "pre-commit.pre-fence");
    expect(existsSync(backup)).toBe(true);
    expect(readFileSync(backup, "utf-8")).toContain("user-hook-ran");
    // Fence passes → chained original runs.
    const allow = writeStub(root, "allow.sh", 0);
    const out = execFileSync(userHook, [], { cwd: root, env: gitEnv({ FENCE_BIN: allow }) });
    expect(String(out)).toContain("user-hook-ran");
  });

  it("blocks the commit when check fails, before the chained hook", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const userHook = join(root, ".git", "hooks", "pre-commit");
    mkdirSync(join(root, ".git", "hooks"), { recursive: true });
    writeFileSync(userHook, `#!/bin/sh\necho user-hook-ran\n`, "utf-8");
    chmodSync(userHook, 0o755);
    installGitHooks(root);
    const deny = writeStub(root, "deny.sh", 1);
    let code = 0;
    let output = "";
    try {
      output = String(execFileSync(userHook, [], { cwd: root, env: gitEnv({ FENCE_BIN: deny }) }));
    } catch (e) {
      code = (e as { status?: number }).status ?? -1;
      output = String((e as { stdout?: unknown }).stdout ?? "") + String((e as { stderr?: unknown }).stderr ?? "");
    }
    expect(code).toBe(1);
    expect(output).not.toContain("user-hook-ran");
    expect(output).toContain("blocked");
  });

  it("pre-commit runs staged + worktree scans; pre-push runs push + worktree scans", () => {
    if (!gitAvailable()) return;
    const cases = [
      ["pre-commit", "check --staged"],
      ["pre-push", "check --push"],
    ] as const;
    for (const [hook, first] of cases) {
      const root = makeRepo();
      installGitHooks(root);
      const log = join(root, "calls.log");
      const recorder = join(root, "rec.sh");
      writeFileSync(recorder, `#!/bin/sh\necho "$@" >> "${log}"\nexit 0\n`, "utf-8");
      chmodSync(recorder, 0o755);
      execFileSync(join(root, ".git", "hooks", hook), [], { cwd: root, env: gitEnv({ FENCE_BIN: recorder }) });
      expect(readFileSync(log, "utf-8").trim().split("\n")).toEqual([first, "check"]);
    }
  });

  it("is a no-op without .git", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-nohook-"));
    created.push(root);
    expect(installGitHooks(root)).toEqual([]);
  });

  it("detects a core.hooksPath redirect (shadowed .git/hooks)", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    // Null branch depends on ambient machine config — not asserted here.
    execSync("git config core.hooksPath /tmp/elsewhere", { cwd: root, env: gitEnv() });
    expect(configuredHooksPath(root)).toBe("/tmp/elsewhere");
  });

  it("end-to-end: failing check blocks git commit, passing check allows it", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    installGitHooks(root);
    writeFileSync(join(root, "a.txt"), "hi\n", "utf-8");
    execSync("git add a.txt", { cwd: root });
    const deny = writeStub(root, "deny.sh", 1);
    expect(() =>
      execSync("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm try", {
        cwd: root,
        env: gitEnv({ FENCE_BIN: deny }),
      }),
    ).toThrow();
    const allow = writeStub(root, "allow.sh", 0);
    execSync("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm try", {
      cwd: root,
      env: gitEnv({ FENCE_BIN: allow }),
    });
    expect(String(execSync("git log --oneline", { cwd: root }))).toContain("try");
  });
});
