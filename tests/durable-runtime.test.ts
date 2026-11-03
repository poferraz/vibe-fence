import { expect, it } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

it("a fresh process blocks a staged leak through the installed project runtime", () => {
  const root = mkdtempSync(join(tmpdir(), "vf durable "));
  const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", FENCE_BIN: "", MUSE_API_KEY: "", META_API_KEY: "" };
  try {
    execFileSync("git", ["init", "-q"], { cwd: root, env });
    execFileSync("node", [resolve(import.meta.dir, "../dist/cli.js"), "init", "--adapters=none"], { cwd: root, env, stdio: "pipe" });
    writeFileSync(join(root, "leak.ts"), "const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n");
    execFileSync("git", ["add", "leak.ts"], { cwd: root, env });
    const commit = spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "test"], { cwd: root, env, encoding: "utf8" });
    expect(commit.status).not.toBe(0);
    expect(commit.stdout + commit.stderr).toContain("SEC-01");
    writeFileSync(join(root, "leak.ts"), "export const safe = true;\n");
    execFileSync("git", ["add", "leak.ts"], { cwd: root, env });
    const clean = spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "test"], { cwd: root, env, encoding: "utf8" });
    expect(clean.status).toBe(0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
