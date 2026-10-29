/**
 * src/install.test.ts — installer postinstall-guard behavior (C7/T8).
 * Fresh installs get the template-owned `vibe-fence check` guard (no
 * `|| true`, executable); legacy shims migrate; user-modified guards stay.
 * Run: bun test src/install.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { spawnSync, execSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install, loadPostinstallGuard, ensureGitignore, trackedEnvFiles, isWithinProjectRoot, GITIGNORE_ENTRIES } from "./install";

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function makeProject(): string {
  // Resolved like getcwd(): install() containment compares realpaths, and
  // macOS TMPDIR (/var → /private/var) is symlink-borne.
  const root = realpathSync(mkdtempSync(join(tmpdir(), "vf-install-")));
  created.push(root);
  return root;
}

/** Pre-fix inline shim (tools/validate.ts || true swallows everything). */
const LEGACY_INLINE_SHIM = [
  "#!/bin/sh",
  "# vibe-fence postinstall guard — GEM-01 P0",
  "# Runs integrity check so `npm install` cannot silently plant a malicious AGENTS.md.",
  "set -e",
  'bun run --cwd "$(dirname "$0")/../.." --silent tools/validate.ts 2>/dev/null || true',
  "",
].join("\n");

/** Pre-fix template shim (requires ./src/framework/integrity.js — broken when packed). */
const LEGACY_TEMPLATE_SHIM = [
  "#!/bin/sh",
  "# vibe-fence postinstall guard (GEM-01 P0) — runs integrity check on npm install",
  'node -e "require(\'./src/framework/integrity.js\').postinstallGuard()" 2>&1',
  "",
].join("\n");

describe("install postinstall guard", () => {
  it("fresh installs get the check-based guard, executable, no || true", async () => {
    const root = makeProject();
    await install(root, { adapters: [] });
    const p = join(root, ".fence", "hooks", "postinstall-guard.sh");
    const content = readFileSync(p, "utf-8");
    expect(content).toBe(loadPostinstallGuard());
    expect(content).toContain('exec "$BIN" check');
    // The old swallow-everything stub is gone (`|| true` survives only on
    // `command -v` probes, where set -e demands it).
    expect(content).not.toContain("tools/validate.ts");
    expect(content).not.toContain("2>/dev/null || true");
    expect((statSync(p).mode & 0o100) !== 0).toBe(true);
  });

  it("migrates legacy shims, preserves user-modified guards", async () => {
    for (const legacy of [LEGACY_INLINE_SHIM, LEGACY_TEMPLATE_SHIM]) {
      const root = makeProject();
      const dir = join(root, ".fence", "hooks");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "postinstall-guard.sh"), legacy, "utf-8");
      await install(root, { adapters: [] });
      expect(readFileSync(join(dir, "postinstall-guard.sh"), "utf-8")).toBe(loadPostinstallGuard());
    }
    const custom = makeProject();
    const cdir = join(custom, ".fence", "hooks");
    mkdirSync(cdir, { recursive: true });
    writeFileSync(join(cdir, "postinstall-guard.sh"), "#!/bin/sh\necho mine\n", "utf-8");
    await install(custom, { adapters: [] });
    expect(readFileSync(join(cdir, "postinstall-guard.sh"), "utf-8")).toBe("#!/bin/sh\necho mine\n");
  });
});

describe("postinstall guard execution", () => {
  function writeGuard(root: string, content: string): string {
    const p = join(root, "guard.sh");
    writeFileSync(p, content, "utf-8");
    chmodSync(p, 0o755);
    return p;
  }

  function runGuard(p: string, env: Record<string, string>): { exit: number; stderr: string } {
    // Absolute shell: the child PATH is deliberately emptied below.
    const r = spawnSync("/bin/sh", [p], { env: { ...process.env, ...env }, encoding: "utf-8" });
    return { exit: r.status ?? 1, stderr: String(r.stderr ?? "") };
  }

  it("template: propagates gate verdicts; stale FENCE_BIN falls through to loud skip", () => {
    const root = makeProject();
    const guard = writeGuard(root, loadPostinstallGuard());
    // Empty PATH + stale FENCE_BIN → loud exit 0 (never bricks install).
    const empty = makeProject();
    const r = runGuard(guard, { FENCE_BIN: "/nonexistent", PATH: empty });
    expect(r.exit).toBe(0);
    expect(r.stderr).toContain("WARNING");
    // Present binary: exit code propagates.
    const bins = makeProject();
    writeFileSync(join(bins, "vibe-fence"), "#!/bin/sh\nexit 1\n", "utf-8");
    chmodSync(join(bins, "vibe-fence"), 0o755);
    expect(runGuard(guard, { PATH: bins }).exit).toBe(1);
  });

  it("ensures env ignore patterns idempotently, preserves user content and .env.example", async () => {
    const root = makeProject();
    execSync("git init -q .", { cwd: root, env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" } as Record<string, string> });
    writeFileSync(join(root, ".gitignore"), "# user header\nnode_modules/\n", "utf-8");
    writeFileSync(join(root, ".env"), "SECRET=1\n", "utf-8");
    writeFileSync(join(root, ".env.example"), "EXAMPLE=1\n", "utf-8");
    const added = ensureGitignore(root);
    expect(added).toEqual([".gitignore"]);
    const after = readFileSync(join(root, ".gitignore"), "utf-8");
    expect(after).toContain("# user header");
    for (const e of GITIGNORE_ENTRIES) expect(after).toContain(e);
    // Idempotent: second call changes nothing.
    expect(ensureGitignore(root)).toEqual([]);
    expect(readFileSync(join(root, ".gitignore"), "utf-8")).toBe(after);
    // Git honors it: .env ignored, .env.example not.
    const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", HOME: root } as Record<string, string>;
    expect(() => execSync("git check-ignore -q .env", { cwd: root, env })).not.toThrow();
    expect(() => execSync("git check-ignore -q .env.example", { cwd: root, env })).toThrow();
    // Full install stays idempotent for .gitignore.
    await install(root, { adapters: [] });
    expect(readFileSync(join(root, ".gitignore"), "utf-8")).toBe(after);
  });

  it("re-covers .env when a later negation unignores it (last match wins)", () => {
    const root = makeProject();
    const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" } as Record<string, string>;
    execSync("git init -q .", { cwd: root, env });
    writeFileSync(join(root, ".gitignore"), ".env\n!.env\n", "utf-8");
    writeFileSync(join(root, ".env"), "SECRET=1\n", "utf-8");
    // Before: Git itself says not ignored (negation wins).
    expect(() => execSync("git check-ignore --no-index -q .env", { cwd: root, env })).toThrow();
    expect(ensureGitignore(root)).toEqual([".gitignore"]);
    // After: fence entry is last, so Git ignores it again; run stays idempotent.
    expect(() => execSync("git check-ignore --no-index -q .env", { cwd: root, env })).not.toThrow();
    expect(ensureGitignore(root)).toEqual([]);
    const content = readFileSync(join(root, ".gitignore"), "utf-8");
    expect(content.trim().endsWith(".env.*.local") || content).toBeTruthy();
    expect(content.lastIndexOf("\n.env\n")).toBeGreaterThan(content.indexOf("!.env"));
  });

  it("refuses to follow a .gitignore symlink outside the project", async () => {
    const root = makeProject();
    const outsideDir = makeProject();
    const outsideFile = join(outsideDir, "outside-ignore");
    writeFileSync(outsideFile, "outside-original\n", "utf-8");
    symlinkSync(outsideFile, join(root, ".gitignore"));
    expect(() => ensureGitignore(root)).toThrow(/outside|containment/);
    expect(readFileSync(outsideFile, "utf-8")).toBe("outside-original\n");
    // Through install(): warned, outside untouched, install still completes.
    const warns: string[] = [];
    const origWarn = console.warn;
    console.warn = (...a: unknown[]) => { warns.push(a.join(" ")); };
    try {
      await install(root, { adapters: [] });
    } finally {
      console.warn = origWarn;
    }
    expect(warns.join("\n")).toContain(".gitignore");
    expect(readFileSync(outsideFile, "utf-8")).toBe("outside-original\n");
    // A symlink staying inside the project is legitimate and works.
    const root2 = makeProject();
    const realIgnore = join(root2, "real-ignore");
    writeFileSync(realIgnore, "# mine\n", "utf-8");
    symlinkSync(realIgnore, join(root2, ".gitignore"));
    expect(ensureGitignore(root2)).toEqual([".gitignore"]);
    expect(readFileSync(realIgnore, "utf-8")).toContain(".env");
  });

  it("reports already-tracked env files by name only, never contents", async () => {
    const root = makeProject();
    const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" } as Record<string, string>;
    execSync("git init -q .", { cwd: root, env });
    writeFileSync(join(root, ".env"), "SUPER_SECRET_VALUE_123\n", "utf-8");
    writeFileSync(join(root, ".env.example"), "EXAMPLE=1\n", "utf-8");
    execSync("git add .env .env.example", { cwd: root, env });
    execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm seed', { cwd: root, env });
    expect(trackedEnvFiles(root)).toEqual([".env"]);
    const warns: string[] = [];
    const origWarn = console.warn;
    console.warn = (...a: unknown[]) => { warns.push(a.join(" ")); };
    try {
      await install(root, { adapters: [] });
    } finally {
      console.warn = origWarn;
    }
    const joined = warns.join("\n");
    expect(joined).toContain(".env");
    expect(joined).toContain("git rm --cached");
    expect(joined).not.toContain("SUPER_SECRET_VALUE_123");
  });

  it("installs through a symlinked project path and rejects escapes", async () => {
    const real = makeProject();
    const aliasParent = makeProject();
    const alias = join(aliasParent, "proj-link");
    symlinkSync(real, alias, "dir");
    // Legitimate symlinked root (/var → /private/var style): install succeeds.
    await install(alias, { adapters: [] });
    expect(existsSync(join(real, ".fence", "config.json"))).toBe(true);
    expect(isWithinProjectRoot(alias, join(alias, ".fence", "config.json"))).toBe(true);
    // Genuine escape through a symlinked child is outside.
    const outside = makeProject();
    symlinkSync(outside, join(real, "escape"), "dir");
    expect(isWithinProjectRoot(real, join(real, "escape", "evil.txt"))).toBe(false);
    expect(isWithinProjectRoot(real, join(real, "src", "ok.ts"))).toBe(true);
  });

  it("fallback: same contract when the template is missing", () => {
    const saved = process.env["VIBE_FENCE_TEMPLATES_DIR"];
    process.env["VIBE_FENCE_TEMPLATES_DIR"] = makeProject(); // empty dir → template missing
    let fallback: string;
    try {
      fallback = loadPostinstallGuard();
    } finally {
      if (saved === undefined) delete process.env["VIBE_FENCE_TEMPLATES_DIR"];
      else process.env["VIBE_FENCE_TEMPLATES_DIR"] = saved;
    }
    expect(fallback).toContain("managed fallback");
    const root = makeProject();
    const guard = writeGuard(root, fallback);
    const empty = makeProject();
    const r = runGuard(guard, { FENCE_BIN: "/nonexistent", PATH: empty });
    expect(r.exit).toBe(0);
    expect(r.stderr).toContain("WARNING");
  });
});
