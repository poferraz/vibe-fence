/**
 * src/install.test.ts — installer postinstall-guard behavior (C7/T8).
 * Fresh installs get the template-owned `vibe-fence check` guard (no
 * `|| true`, executable); legacy shims migrate; user-modified guards stay.
 * Run: bun test src/install.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { spawnSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { verifyAttestation } from "./framework/integrity";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install, loadPostinstallGuard, ensureGitignore, trackedEnvFiles, isWithinProjectRoot, GITIGNORE_ENTRIES } from "./install";
import { runUninstall } from "./uninstall";

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

describe("install version and timing", () => {
  it("detects project hosts and adds non-destructive cross-platform npm scripts", async () => {
    const root = makeProject();
    mkdirSync(join(root, ".cursor"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "example", scripts: { "fence:undo": "my-undo" } }));
    const receipt = await install(root);
    expect(receipt.adaptersInstalled).toEqual(["cursor"]);
    const config = JSON.parse(readFileSync(join(root, ".fence/config.json"), "utf8"));
    expect(config.adapters).toEqual(["cursor"]);
    const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;
    expect(scripts["fence:check"]).toBe("node ./.fence/bin/vibe-fence.cjs check");
    expect(scripts["fence:status"]).toBe("node ./.fence/bin/vibe-fence.cjs status");
    expect(scripts["fence:undo"]).toBe("my-undo");
  });

  it("asks for one host before writing when no project tool is detected", async () => {
    const root = makeProject();
    await expect(install(root)).rejects.toThrow(/--host/);
    expect(existsSync(join(root, ".fence"))).toBe(false);
    expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
  });

  it("asks for one host before writing when project tools are ambiguous", async () => {
    const root = makeProject();
    mkdirSync(join(root, ".codex"));
    mkdirSync(join(root, ".cursor"));
    await expect(install(root)).rejects.toThrow(/--host/);
    expect(existsSync(join(root, ".fence"))).toBe(false);
  });

  it("rejects multiple or unknown explicit hosts before changing the project", async () => {
    for (const adapters of [["claude", "cursor"], ["unknown"]]) {
      const root = makeProject();
      await expect(install(root, { adapters })).rejects.toThrow();
      expect(existsSync(join(root, ".fence"))).toBe(false);
    }
  });

  it("installs only the selected tool and runs its local self-test in the same command", async () => {
    const root = makeProject();
    const output: string[] = [];
    const saved = console.log;
    console.log = (...args: unknown[]) => { output.push(args.join(" ")); };
    try {
      const receipt = await install(root, { adapters: ["cursor"] });
      expect(receipt.adaptersInstalled).toEqual(["cursor"]);
      expect(receipt.hookProbe?.verified).toBe(true);
      expect(output.join("\n")).toContain("Cursor");
      expect(output.join("\n")).not.toContain("--host=codex");
      expect(output.join("\n")).not.toContain("Next steps:");
      expect(existsSync(join(root, ".claude"))).toBe(false);
      expect(existsSync(join(root, ".codex"))).toBe(false);
      const receiptText = readFileSync(join(root, ".fence/adapters/cursor.json"), "utf8");
      expect(receiptText).not.toMatch(/model_mode|companion_model|architect_model|muse-/);
      const config = JSON.parse(readFileSync(join(root, ".fence/config.json"), "utf8"));
      expect(config.model_mode).toBeUndefined();
      expect(JSON.parse(readFileSync(join(root, ".fence/app-profile.json"), "utf8")).block_counts).toBeUndefined();
    } finally { console.log = saved; }
  });

  it("measures an install from its own start, even after a long process delay", async () => {
    const root = makeProject();
    const now = Date.now;
    try {
      // Simulate a process that has been running for a minute since import.
      Date.now = () => now() + 60_000;
      const receipt = await install(root, { adapters: [] });
      expect(receipt.elapsedMs).toBeLessThan(3_000);
    } finally {
      Date.now = now;
    }
  });

  it("uses the installed package version for new configurations", async () => {
    const root = makeProject();
    const packageVersion = (JSON.parse(readFileSync(join(import.meta.dir, "..", "package.json"), "utf8")) as { version: string }).version;
    await install(root, { adapters: [] });
    const config = JSON.parse(readFileSync(join(root, ".fence", "config.json"), "utf8"));
    expect(config.fence_version).toBe(packageVersion);
  });

  it("upgrades an old config without losing user settings and remains idempotent", async () => {
    const root = makeProject();
    const packageVersion = (JSON.parse(readFileSync(join(import.meta.dir, "..", "package.json"), "utf8")) as { version: string }).version;
    const configPath = join(root, ".fence", "config.json");
    mkdirSync(join(root, ".fence"), { recursive: true });
    writeFileSync(configPath, JSON.stringify({ version: 1, fence_version: "0.1.0", model_mode: "contributor", companion: { enabled: false }, provider: { api_key: "legacy" }, custom: { keep: true } }));
    const receipt = await install(root, { adapters: [] });
    const updated = readFileSync(configPath, "utf8");
    const config = JSON.parse(updated);
    expect(config.fence_version).toBe(packageVersion);
    expect(config.model_mode).toBeUndefined();
    expect(config.companion).toBeUndefined();
    expect(config.provider).toBeUndefined();
    expect(config.custom).toEqual({ keep: true });
    await install(root, { adapters: [] });
    expect(readFileSync(configPath, "utf8")).toBe(updated);
  });
});

describe("uninstall", () => {
  it("restores original project files and Git hooks after an init round trip", async () => {
    const root = makeProject();
    execSync("git init -q .", { cwd: root, env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" } });
    execSync("git config --local core.hooksPath .git/hooks", { cwd: root });
    const originals: Record<string, string> = {
      "AGENTS.md": "My own instructions.\n",
      ".gitignore": "node_modules/\n",
      "package.json": '{ "name": "project", "scripts": { "start": "node app.js" } }\n',
      ".claude/settings.json": '{ "model": "mine" }\n',
      ".git/hooks/pre-commit": "#!/bin/sh\necho mine\n",
    };
    mkdirSync(join(root, ".claude"));
    for (const [path, content] of Object.entries(originals)) writeFileSync(join(root, path), content);
    await install(root, { adapters: ["claude"] });
    runUninstall(root, { dryRun: true });
    expect(existsSync(join(root, ".fence/config.json"))).toBe(true);
    runUninstall(root);
    for (const [path, content] of Object.entries(originals)) expect(readFileSync(join(root, path), "utf8")).toBe(content);
    expect(existsSync(join(root, ".fence"))).toBe(false);
    expect(existsSync(join(root, ".claude/hooks/fence-gate.cjs"))).toBe(false);
    expect(existsSync(join(root, ".agents"))).toBe(false);
  });

  it("preserves edits made after installation and unknown files inside .fence", async () => {
    const root = makeProject();
    writeFileSync(join(root, "AGENTS.md"), "Original.\n");
    await install(root, { adapters: ["claude"] });
    writeFileSync(join(root, "AGENTS.md"), readFileSync(join(root, "AGENTS.md"), "utf8") + "My later edit.\n");
    const configPath = join(root, ".claude/settings.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    config.model = "my-new-model";
    writeFileSync(configPath, JSON.stringify(config));
    writeFileSync(join(root, ".fence/user-note.txt"), "keep this");
    const removal = runUninstall(root);
    expect(readFileSync(join(root, "AGENTS.md"), "utf8")).toContain("My later edit.");
    expect(readFileSync(join(root, "AGENTS.md"), "utf8")).not.toContain("vibe-fence:start");
    expect(JSON.parse(readFileSync(configPath, "utf8")).model).toBe("my-new-model");
    expect(JSON.stringify(JSON.parse(readFileSync(configPath, "utf8"))).includes("fence-gate")).toBe(false);
    expect(readFileSync(join(root, ".fence/user-note.txt"), "utf8")).toBe("keep this");
    expect(removal.preserved).toContain(".fence/user-note.txt");
  });

  it("does not duplicate credential-bearing host settings into the uninstall journal", async () => {
    const root = makeProject();
    mkdirSync(join(root, ".claude"));
    writeFileSync(join(root, ".claude/settings.json"), JSON.stringify({ env: { API_TOKEN: "PRIVATE_CREDENTIAL_SENTINEL" } }));
    await install(root, { adapters: ["claude"] });
    const journal = JSON.parse(readFileSync(join(root, ".fence/uninstall.json"), "utf8"));
    const prior = journal.files[".claude/settings.json"]?.before;
    expect(prior === null || !Buffer.from(prior, "base64").toString("utf8").includes("PRIVATE_CREDENTIAL_SENTINEL")).toBe(true);
    runUninstall(root);
    expect(JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8")).env.API_TOKEN).toBe("PRIVATE_CREDENTIAL_SENTINEL");
  });
});

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

  it("covers specific negations of wildcard env files and re-covers later rules", () => {
    const root = makeProject();
    const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" } as Record<string, string>;
    execSync("git init -q .", { cwd: root, env });
    const original = "# user header\r\n.env.*.local\r\n!.env.production.local";
    writeFileSync(join(root, ".gitignore"), original);
    expect(ensureGitignore(root)).toEqual([".gitignore"]);
    const first = readFileSync(join(root, ".gitignore"), "utf8");
    expect(first.startsWith(original + "\n")).toBe(true);
    for (const path of [".env", ".env.local", ".env.production.local", ".env.test.local"]) {
      expect(() => execSync(`git check-ignore --no-index -q ${path}`, { cwd: root, env })).not.toThrow();
    }
    expect(() => execSync("git check-ignore --no-index -q .env.example", { cwd: root, env })).toThrow();
    expect(ensureGitignore(root)).toEqual([]);
    expect(readFileSync(join(root, ".gitignore"), "utf8")).toBe(first);

    writeFileSync(join(root, ".gitignore"), first + "!.env.production.local\n");
    expect(() => execSync("git check-ignore --no-index -q .env.production.local", { cwd: root, env })).toThrow();
    expect(ensureGitignore(root)).toEqual([".gitignore"]);
    expect(() => execSync("git check-ignore --no-index -q .env.production.local", { cwd: root, env })).not.toThrow();
    expect(ensureGitignore(root)).toEqual([]);
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
    // Git does not read .gitignore symlinks even when their targets are inside
    // the project. Do not claim coverage or mutate the target in that case.
    const root2 = makeProject();
    const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" } as Record<string, string>;
    execSync("git init -q .", { cwd: root2, env });
    const realIgnore = join(root2, "real-ignore");
    writeFileSync(realIgnore, "# mine\n", "utf-8");
    symlinkSync(realIgnore, join(root2, ".gitignore"));
    expect(() => ensureGitignore(root2)).toThrow(/symlink/i);
    expect(readFileSync(realIgnore, "utf-8")).toBe("# mine\n");
    expect(() => execSync("git check-ignore --no-index -q .env", { cwd: root2, env, stdio: "ignore" })).toThrow();
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

describe("project-local runtime installation", () => {
  it("installs a launcher and refuses an outside .fence symlink before writing", async () => {
    const root = makeProject();
    await install(root, { adapters: [] });
    expect(existsSync(join(root, ".fence", "bin", "vibe-fence"))).toBe(true);
    const linked = makeProject(), outside = makeProject();
    writeFileSync(join(outside, "sentinel"), "unchanged");
    symlinkSync(outside, join(linked, ".fence"));
    await expect(install(linked, { adapters: [] })).rejects.toThrow();
    expect(readFileSync(join(outside, "sentinel"), "utf8")).toBe("unchanged");
    expect(existsSync(join(outside, "config.json"))).toBe(false);
  });
});

it("never overwrites an outside file through an integrity-store symlink", async () => {
  const root = makeProject(), outside = makeProject();
  mkdirSync(join(root, ".fence"), { recursive: true });
  const sentinel = join(outside, "sentinel");
  writeFileSync(sentinel, "KEEP");
  symlinkSync(sentinel, join(root, ".fence/.integrity.json"));
  await expect(install(root, { adapters: [] })).rejects.toThrow();
  expect(readFileSync(sentinel, "utf8")).toBe("KEEP");
});


it("refuses managed-file symlinks before modifying external files", async () => {
  for (const rel of ["AGENTS.md", ".fence/app-profile.json", ".fence/hooks/postinstall-guard.sh", ".fence/events.ndjson", ".claude/settings.json", ".cursor/hooks.json", ".opencode/plugins/fence-guard.js", ".hermes/config.json"]) {
    const root = makeProject(), outside = makeProject();
    const target = join(root, rel), sentinel = join(outside, "sentinel");
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(sentinel, '{"runtime":"other"}');
    symlinkSync(sentinel, target);
    const host = rel.startsWith(".claude") ? "claude" : rel.startsWith(".cursor") ? "cursor" : rel.startsWith(".opencode") ? "opencode" : rel.startsWith(".hermes") ? "hermes" : "none";
    await expect(install(root, { adapters: [host] })).rejects.toThrow(/symlink/);
    expect(readFileSync(sentinel, "utf8")).toBe('{"runtime":"other"}');
  }
});

it("refuses dangling managed symlinks without creating their targets", async () => {
  for (const rel of [".fence/.integrity.json", ".fence/app-profile.json", ".fence/hooks/postinstall-guard.sh", ".fence/events.ndjson", "AGENTS.md"]) {
    const root = makeProject(), outside = makeProject();
    const target = join(root, rel), missing = join(outside, "missing");
    mkdirSync(join(target, ".."), { recursive: true });
    symlinkSync(missing, target);
    await expect(install(root, { adapters: [] })).rejects.toThrow();
    expect(existsSync(missing)).toBe(false);
  }
});

describe("setup completion", () => {
  it("does not call an unavailable selected integration installed", async () => {
    const root = makeProject();
    mkdirSync(join(root, ".opencode/plugins"), { recursive: true });
    const plugin = join(root, ".opencode/plugins/fence-guard.js");
    writeFileSync(plugin, "// user-owned plugin, keep me\n");
    const logs: string[] = [], saved = console.log;
    console.log = (...args: unknown[]) => { logs.push(args.join(" ")); };
    try {
      await expect(install(root, { adapters: ["opencode"] })).rejects.toThrow(/incomplete/i);
      expect(logs.join("\n")).not.toContain("installed for OpenCode");
      expect(readFileSync(plugin, "utf8")).toBe("// user-owned plugin, keep me\n");
      expect(existsSync(join(root, ".fence/uninstall.json"))).toBe(true);
      runUninstall(root);
      expect(readFileSync(plugin, "utf8")).toBe("// user-owned plugin, keep me\n");
    } finally { console.log = saved; }
  });

  it("keeps an existing launcher and reports incomplete when runtime installation fails", async () => {
    const root = makeProject();
    await install(root, { adapters: [] });
    const launcher = join(root, ".fence/bin/vibe-fence");
    writeFileSync(launcher, "#!/bin/sh\n# user-owned launcher\nexit 0\n");
    const logs: string[] = [], saved = console.log;
    console.log = (...args: unknown[]) => { logs.push(args.join(" ")); };
    try {
      await expect(install(root, { adapters: [] })).rejects.toThrow(/incomplete/i);
      expect(logs.join("\n")).not.toContain("installed for Git");
      expect(readFileSync(launcher, "utf8")).toContain("user-owned launcher");
      expect(existsSync(join(root, ".fence/uninstall.json"))).toBe(true);
    } finally { console.log = saved; }
  });

  it("ignores an unrelated tool's settings symlink", async () => {
    const root = makeProject(), outside = makeProject();
    const target = join(outside, "cursor-hooks");
    writeFileSync(target, "user-owned cursor settings");
    mkdirSync(join(root, ".cursor"));
    symlinkSync(target, join(root, ".cursor/hooks.json"));
    const receipt = await install(root, { adapters: ["codex"] });
    expect(receipt.adaptersInstalled).toEqual(["codex"]);
    expect(verifyAttestation(root).status).toBe("pass");
    expect(readFileSync(target, "utf8")).toBe("user-owned cursor settings");
  });

  it("refreshes unchanged installed skills but retains a user's edits", async () => {
    const root = makeProject();
    await install(root, { adapters: [] });
    const old = "---\nname: vibe-init\ndescription: Old installed skill\n---\nRun --profile=muse to connect Meta.\n";
    const rel = ".agents/skills/vibe-init/SKILL.md";
    const file = join(root, rel);
    writeFileSync(file, old);
    const journalPath = join(root, ".fence/uninstall.json");
    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    journal.files[rel].after = createHash("sha256").update(old).digest("hex");
    writeFileSync(journalPath, JSON.stringify(journal));
    const customRel = ".agents/skills/vibe-guard/SKILL.md";
    const custom = readFileSync(join(root, customRel), "utf8") + "\nUser's own instructions.\n";
    writeFileSync(join(root, customRel), custom);
    await install(root, { adapters: [] });
    expect(readFileSync(file, "utf8")).toBe(readFileSync(join(import.meta.dir, "skills/vibe-init/SKILL.md"), "utf8"));
    expect(readFileSync(join(root, customRel), "utf8")).toBe(custom);
  });
});

it("reports incomplete when the common integrity baseline cannot be created safely", async () => {
  const root = makeProject(), outside = makeProject();
  mkdirSync(join(root, ".fence"));
  const sentinel = join(outside, "invariants");
  writeFileSync(sentinel, "user-owned policy");
  symlinkSync(sentinel, join(root, ".fence/invariants.md"));
  await expect(install(root, { adapters: [] })).rejects.toThrow(/incomplete/i);
  expect(readFileSync(sentinel, "utf8")).toBe("user-owned policy");
  expect(existsSync(join(root, ".fence/uninstall.json"))).toBe(true);
});
