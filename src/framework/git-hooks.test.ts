/**
 * src/framework/git-hooks.test.ts — Guarded tier git hooks (Oct 29).
 * init installs pre-commit/pre-push running `vibe-fence check`; existing
 * user hooks are chained, never clobbered; re-run is zero-churn.
 * Run: bun test src/framework/git-hooks.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync, statSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { installGitHooks, configuredHooksPath, effectiveHooksDir, inspectGitHooks, canonicalPath, hooksRepairCommand, hooksRepairNote, isLinkedWorktree, HOOK_NAMES, HOOK_MARKER } from "./git-hooks";

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
    const written = installGitHooks(root, gitEnv());
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
    installGitHooks(root, gitEnv());
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
    installGitHooks(root, gitEnv());
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
    installGitHooks(root, gitEnv());
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
      installGitHooks(root, gitEnv());
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
    expect(installGitHooks(root, gitEnv())).toEqual([]);
  });

  it("detects a core.hooksPath redirect (shadowed .git/hooks)", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    // Null branch depends on ambient machine config — not asserted here.
    execSync("git config core.hooksPath /tmp/elsewhere", { cwd: root, env: gitEnv() });
    expect(configuredHooksPath(root, gitEnv())).toBe("/tmp/elsewhere");
  });

  it("installs into a project-local core.hooksPath directory, not .git/hooks", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const custom = join(root, "my-hooks");
    execSync(`git config core.hooksPath "${custom}"`, { cwd: root, env: gitEnv() });
    const written = installGitHooks(root, gitEnv());
    expect(written.sort()).toEqual(["my-hooks/pre-commit", "my-hooks/pre-push"]);
    expect(existsSync(join(custom, "pre-commit"))).toBe(true);
    expect(existsSync(join(custom, "pre-push"))).toBe(true);
    expect(readFileSync(join(custom, "pre-commit"), "utf-8")).toContain(HOOK_MARKER);
    // Not shadow-written to .git/hooks.
    expect(existsSync(join(root, ".git", "hooks", "pre-commit"))).toBe(false);
    expect(effectiveHooksDir(root, gitEnv())).toBe(custom);
    expect(inspectGitHooks(root, gitEnv()).blockedOutside).toBe(false);
    // The installed hook actually gates a commit from the effective location.
    execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -q --allow-empty -m base', { cwd: root, env: gitEnv() });
    writeFileSync(join(root, "b.txt"), "hi\n", "utf-8");
    execSync("git add b.txt", { cwd: root });
    const deny = writeStub(root, "deny.sh", 1);
    expect(() =>
      execSync("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm gated", {
        cwd: root,
        env: gitEnv({ FENCE_BIN: deny }),
      }),
    ).toThrow();
  });

  it("does not install into an outside-project core.hooksPath (global side effect)", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const outside = mkdtempSync(join(tmpdir(), "vf-outside-hooks-"));
    created.push(outside);
    const outsideHooks = join(outside, "hooks");
    execSync(`git config core.hooksPath "${outsideHooks}"`, { cwd: root, env: gitEnv() });
    const info = inspectGitHooks(root, gitEnv());
    expect(info.blockedOutside).toBe(true);
    expect(info.effectiveDir).toBe(outsideHooks);
    expect(installGitHooks(root, gitEnv())).toEqual([]);
    // Nothing written outside, and not shadow-written to .git/hooks either.
    expect(existsSync(join(outsideHooks, "pre-commit"))).toBe(false);
    expect(existsSync(join(root, ".git", "hooks", "pre-commit"))).toBe(false);
  });

  it("reports a nonexistent redirected path outside the project as blocked", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const missing = join(tmpdir(), "vf-missing-hooks-does-not-exist-xyz");
    execSync(`git config core.hooksPath "${missing}"`, { cwd: root, env: gitEnv() });
    expect(inspectGitHooks(root, gitEnv()).blockedOutside).toBe(true);
    expect(installGitHooks(root, gitEnv())).toEqual([]);
    expect(existsSync(missing)).toBe(false);
  });

  it("installs hooks for a linked worktree via the common hooks dir", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    writeFileSync(join(root, "a.txt"), "x\n", "utf-8");
    execSync("git add a.txt", { cwd: root, env: gitEnv() });
    execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base', { cwd: root, env: gitEnv() });
    const wt = join(root, "wt2");
    execSync(`git worktree add -q "${wt}"`, { cwd: root, env: gitEnv() });
    created.push(wt);
    // .git is a file in the worktree — the old installer threw ENOTDIR here.
    const written = installGitHooks(wt, gitEnv());
    expect(written.sort()).toEqual([".git/hooks/pre-commit", ".git/hooks/pre-push"]);
    const commonHooks = effectiveHooksDir(wt, gitEnv());
    expect(commonHooks).not.toBeNull();
    expect(existsSync(join(commonHooks!, "pre-commit"))).toBe(true);
    // Committing from the worktree is gated.
    writeFileSync(join(wt, "b.txt"), "hi\n", "utf-8");
    execSync("git add b.txt", { cwd: wt, env: gitEnv() });
    const deny = writeStub(root, "deny.sh", 1);
    expect(() =>
      execSync("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm gated", {
        cwd: wt,
        env: gitEnv({ FENCE_BIN: deny }),
      }),
    ).toThrow();
  });

  it("preserves an existing unmanaged hook in a custom hooks directory", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const custom = join(root, ".githooks");
    mkdirSync(custom, { recursive: true });
    writeFileSync(join(custom, "pre-commit"), "#!/bin/sh\necho kept\n", "utf-8");
    chmodSync(join(custom, "pre-commit"), 0o755);
    execSync(`git config core.hooksPath "${custom}"`, { cwd: root, env: gitEnv() });
    installGitHooks(root, gitEnv());
    expect(existsSync(join(custom, "pre-commit.pre-fence"))).toBe(true);
    expect(readFileSync(join(custom, "pre-commit.pre-fence"), "utf-8")).toContain("kept");
    expect(readFileSync(join(custom, "pre-commit"), "utf-8")).toContain(HOOK_MARKER);
  });

  it("canonicalPath resolves symlinked tmp roots and detects escapes", () => {
    const base = realpathSync(mkdtempSync(join(tmpdir(), "vf-canon-")));
    created.push(base);
    const outside = realpathSync(mkdtempSync(join(tmpdir(), "vf-canon-out-")));
    created.push(outside);
    // Legitimate: project opened via /var-style alias (same real dir).
    const alias = join(base, "alias");
    symlinkSync(base, alias, "dir");
    expect(canonicalPath(join(alias, "sub", "file.txt"))).toBe(join(base, "sub", "file.txt"));
    // Escape: a symlinked child pointing outside canonicalizes outside.
    symlinkSync(outside, join(base, "link-out"), "dir");
    expect(canonicalPath(join(base, "link-out", "evil.txt"))).toBe(join(outside, "evil.txt"));
  });

  it("end-to-end: pre-push blocks a leaky range and allows a clean one", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    installGitHooks(root, gitEnv());
    // Local bare remote so pre-push stdin carries real ranges (no network, no private data).
    const bare = mkdtempSync(join(tmpdir(), "vf-bare-"));
    created.push(bare);
    execSync("git init -q --bare .", { cwd: bare, env: gitEnv() });
    execSync(`git remote add origin "${bare}"`, { cwd: root, env: gitEnv() });
    writeFileSync(join(root, "ok.ts"), "export const x = 1;\n", "utf-8");
    execSync("git add -A", { cwd: root, env: gitEnv() });
    execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base', { cwd: root, env: gitEnv() });
    const allow = writeStub(root, "allow.sh", 0);
    execSync("git push -q origin HEAD", { cwd: root, env: gitEnv({ FENCE_BIN: allow }) });
    writeFileSync(join(root, "leak.ts"), "const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n", "utf-8");
    execSync("git add -A", { cwd: root, env: gitEnv() });
    execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm leaky --no-verify', { cwd: root, env: gitEnv() });
    const deny = writeStub(root, "deny.sh", 1);
    expect(() =>
      execSync("git push origin HEAD", { cwd: root, env: gitEnv({ FENCE_BIN: deny }) }),
    ).toThrow();
  });

  it("pre-push preserves ref-update stdin for both fence check and chained hook", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const userHook = join(root, ".git", "hooks", "pre-push");
    mkdirSync(join(root, ".git", "hooks"), { recursive: true });
    writeFileSync(userHook, `#!/bin/sh\ncat > "${join(root, "chained-stdin.txt")}"\n`, "utf-8");
    chmodSync(userHook, 0o755);
    installGitHooks(root, gitEnv());
    // Fence stub: record stdin only on the --push invocation.
    const recorder = join(root, "rec.sh");
    writeFileSync(recorder, `#!/bin/sh\nif [ "$2" = "--push" ]; then cat > "${join(root, "fence-stdin.txt")}"; fi\nexit 0\n`, "utf-8");
    chmodSync(recorder, 0o755);
    const refs = "refs/heads/main abc123 refs/heads/main def456\n";
    execFileSync(join(root, ".git", "hooks", "pre-push"), ["origin", "https://example.invalid/r.git"], {
      cwd: root,
      input: refs,
      env: gitEnv({ FENCE_BIN: recorder }),
    });
    expect(readFileSync(join(root, "fence-stdin.txt"), "utf-8")).toBe(refs);
    expect(readFileSync(join(root, "chained-stdin.txt"), "utf-8")).toBe(refs);
  });

  it("pre-push propagates the chained hook exit code", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    const userHook = join(root, ".git", "hooks", "pre-push");
    mkdirSync(join(root, ".git", "hooks"), { recursive: true });
    writeFileSync(userHook, "#!/bin/sh\nexit 3\n", "utf-8");
    chmodSync(userHook, 0o755);
    installGitHooks(root, gitEnv());
    const allow = writeStub(root, "allow.sh", 0);
    let code = 0;
    try {
      execFileSync(join(root, ".git", "hooks", "pre-push"), ["origin", "url"], {
        cwd: root,
        input: "refs/heads/main a refs/heads/main b\n",
        env: gitEnv({ FENCE_BIN: allow }),
      });
    } catch (e) {
      code = (e as { status?: number }).status ?? -1;
    }
    expect(code).toBe(3);
  });

  it("worktree repair points at the shared common hooks dir, not .git/hooks", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    writeFileSync(join(root, "a.txt"), "x\n", "utf-8");
    execSync("git add a.txt", { cwd: root, env: gitEnv() });
    execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base', { cwd: root, env: gitEnv() });
    const wt = join(root, "wt2");
    execSync(`git worktree add -q "${wt}"`, { cwd: root, env: gitEnv() });
    created.push(wt);
    const outside = mkdtempSync(join(tmpdir(), "vf-wt-outside-"));
    created.push(outside);
    execSync(`git config core.hooksPath "${join(outside, "hooks")}"`, { cwd: wt, env: gitEnv() });
    expect(isLinkedWorktree(wt, gitEnv())).toBe(true);
    expect(inspectGitHooks(wt, gitEnv()).blockedOutside).toBe(true);
    const repair = hooksRepairCommand(wt, gitEnv());
    expect(repair).toContain("--local");
    expect(repair).not.toContain(".git/hooks \"");
    expect(repair).toContain(join(realpathSync(root), ".git", "hooks"));
    expect(hooksRepairNote(wt, gitEnv())).toContain("shared");
    // Normal checkout keeps the relative form and no shared note.
    expect(hooksRepairCommand(root, gitEnv())).toBe("git config --local core.hooksPath .git/hooks");
    expect(hooksRepairNote(root, gitEnv())).toBe("");
    // Following the repair actually enables installation (into common hooks).
    execSync(repair, { cwd: wt, env: gitEnv() });
    const written = installGitHooks(wt, gitEnv());
    expect(written.sort()).toEqual([".git/hooks/pre-commit", ".git/hooks/pre-push"]);
  });

  it("end-to-end: failing check blocks git commit, passing check allows it", () => {
    if (!gitAvailable()) return;
    const root = makeRepo();
    installGitHooks(root, gitEnv());
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
