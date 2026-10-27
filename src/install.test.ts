/**
 * src/install.test.ts — installer postinstall-guard behavior (C7/T8).
 * Fresh installs get the template-owned `vibe-fence check` guard (no
 * `|| true`, executable); legacy shims migrate; user-modified guards stay.
 * Run: bun test src/install.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install, loadPostinstallGuard } from "./install";

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
