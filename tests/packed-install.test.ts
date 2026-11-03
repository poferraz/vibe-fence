import { expect, it } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

it("offline npm exec leaves a working Git gate for later processes", () => {
  const base = mkdtempSync(join(tmpdir(), "vf packed "));
  const project = join(base, "project");
  const repo = resolve(import.meta.dir, "..");
  const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", FENCE_BIN: "", MUSE_API_KEY: "", META_API_KEY: "", npm_config_cache: join(base, "npm-cache") };
  try {
    execFileSync("mkdir", [project]);
    const filename = execFileSync("npm", ["pack", "--offline", "--pack-destination", base, "--silent"], { cwd: repo, env, encoding: "utf8" }).trim();
    expect(filename.endsWith(".tgz")).toBe(true);
    execFileSync("git", ["init", "-q"], { cwd: project, env });
    execFileSync("npm", ["exec", "--offline", "--yes", `--package=${join(base, filename)}`, "--", "vibe-fence", "init", "--adapters=none"], { cwd: project, env, stdio: "pipe" });
    const launcher = join(project, ".fence/bin/vibe-fence");
    expect(readFileSync(launcher, "utf8")).toContain("vibe-fence managed project launcher");
    writeFileSync(join(project, "leak.ts"), `const NEXT_PUBLIC_${"SECRET"} = "PRIVATE_SENTINEL";\n`);
    execFileSync("git", ["add", "leak.ts"], { cwd: project, env });
    const commitArgs = ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "test"];
    const blocked = spawnSync("git", commitArgs, { cwd: project, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0);
    expect(blocked.stdout + blocked.stderr).toContain("SEC-01");
    expect(blocked.stdout + blocked.stderr).not.toContain("PRIVATE_SENTINEL");
    writeFileSync(join(project, "leak.ts"), "export const safe = true;\n");
    execFileSync("git", ["add", "leak.ts"], { cwd: project, env });
    const clean = spawnSync("git", commitArgs, { cwd: project, env, encoding: "utf8" });
    expect(clean.status).toBe(0);
    writeFileSync(join(project, "oversized.ts"), "a".repeat(512 * 1024 + 1) + "\nPRIVATE_SENTINEL\n");
    execFileSync("git", ["add", "oversized.ts"], { cwd: project, env });
    writeFileSync(join(project, "oversized.ts"), "export const clean = true;\n");
    const incomplete = spawnSync("git", commitArgs, { cwd: project, env, encoding: "utf8" });
    expect(incomplete.status).not.toBe(0);
    expect(incomplete.stdout + incomplete.stderr).toContain("INCOMPLETE");
    expect(incomplete.stdout + incomplete.stderr).not.toContain("PRIVATE_SENTINEL");
  } finally { rmSync(base, { recursive: true, force: true }); }
}, 30000);
