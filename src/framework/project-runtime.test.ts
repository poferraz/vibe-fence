import { afterEach, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { installProjectRuntime } from "./project-runtime";

const roots: string[] = [];
function temp(): string { const p = mkdtempSync(join(tmpdir(), "vf runtime ")); roots.push(p); return p; }
afterEach(() => { for (const p of roots.splice(0)) rmSync(p, { recursive: true, force: true }); });
const dist = resolve(import.meta.dir, "../../dist");
const manifest = resolve(import.meta.dir, "../../package.json");

it("installs an idempotent launcher with the packaged assets", () => {
  const root = temp();
  const result = installProjectRuntime(root, dist, manifest);
  expect(result.status).toBe("installed");
  if (result.status === "unavailable") throw new Error(result.reason);
  const before = readFileSync(result.launcherPath, "utf8");
  expect(execFileSync(result.launcherPath, ["--version"], { encoding: "utf8" })).toContain(result.version);
  expect(execFileSync("node", [join(root, ".fence/bin/vibe-fence.cjs"), "--version"], { encoding: "utf8" })).toContain(result.version);
  const snapshot = join(root, ".fence", "runtime", "versions", `${result.version}-${result.digest}`);
  expect(readFileSync(join(snapshot, "dist", "config", "ops-terms.json"), "utf8").length).toBeGreaterThan(0);
  expect(readFileSync(join(snapshot, "dist", "skills", "vibe-guard", "SKILL.md"), "utf8").length).toBeGreaterThan(0);
  expect(installProjectRuntime(root, dist, manifest).status).toBe("unchanged");
  expect(readFileSync(result.launcherPath, "utf8")).toBe(before);
});

it("refuses an external symlink and preserves an unmanaged launcher", () => {
  const root = temp(), outside = temp();
  writeFileSync(join(outside, "sentinel"), "keep");
  symlinkSync(outside, join(root, ".fence"));
  expect(installProjectRuntime(root, dist, manifest).status).toBe("unavailable");
  expect(readFileSync(join(outside, "sentinel"), "utf8")).toBe("keep");
  const root2 = temp();
  mkdirSync(join(root2, ".fence", "bin"), { recursive: true });
  writeFileSync(join(root2, ".fence", "bin", "vibe-fence"), "user launcher");
  expect(installProjectRuntime(root2, dist, manifest).status).toBe("unavailable");
  expect(readFileSync(join(root2, ".fence", "bin", "vibe-fence"), "utf8")).toBe("user launcher");
});

it("upgrades atomically and keeps the prior snapshot when a later source is invalid", async () => {
  const { cpSync, existsSync } = await import("node:fs");
  const root = temp(), source = temp();
  const first = installProjectRuntime(root, dist, manifest);
  expect(first.status).toBe("installed");
  if (first.status === "unavailable") throw new Error(first.reason);
  cpSync(dist, join(source, "dist"), { recursive: true });
  const pkg = JSON.parse(readFileSync(manifest, "utf8"));
  pkg.version = "99.0.0-test";
  writeFileSync(join(source, "package.json"), JSON.stringify(pkg));
  const upgraded = installProjectRuntime(root, join(source, "dist"), join(source, "package.json"));
  expect(upgraded.status).toBe("installed");
  expect(existsSync(join(root, ".fence/runtime/versions", `${first.version}-${first.digest}`, "dist/cli.js"))).toBe(true);
  const launcher = readFileSync(first.launcherPath, "utf8");
  pkg.version = "../escape";
  writeFileSync(join(source, "package.json"), JSON.stringify(pkg));
  expect(installProjectRuntime(root, join(source, "dist"), join(source, "package.json")).status).toBe("unavailable");
  expect(readFileSync(first.launcherPath, "utf8")).toBe(launcher);
});
