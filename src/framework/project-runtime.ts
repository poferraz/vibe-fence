/** Project-local runtime snapshot. Workspace-writable: not a trust boundary. */
import { createHash, randomBytes } from "node:crypto";
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { canonicalPath } from "./git-hooks.js";

export type RuntimeInstallResult =
  | { status: "installed" | "unchanged"; launcherPath: string; version: string; digest: string }
  | { status: "unavailable"; reason: string };

const marker = "# vibe-fence managed project launcher";

function safePath(root: string, target: string): void {
  const base = canonicalPath(root);
  const abs = resolve(target);
  const rel = relative(resolve(root), abs);
  if (rel.startsWith(".." + sep) || rel === ".." || rel.startsWith(sep)) throw new Error("path escapes project");
  let current = resolve(root);
  for (const component of rel.split(sep).filter(Boolean)) {
    current = join(current, component);
    try { if (lstatSync(current).isSymbolicLink()) throw new Error("managed path is a symlink"); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
  }
  const resolved = canonicalPath(target);
  if (resolved !== base && !resolved.startsWith(base + sep)) throw new Error("path escapes project");
}

function digestTree(dist: string, manifest: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(manifest));
  const visit = (dir: string, prefix: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name), rel = `${prefix}/${name}`;
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error("runtime contains symlink");
      if (stat.isDirectory()) visit(path, rel);
      else if (stat.isFile()) { const data = readFileSync(path); hash.update(`${rel.length}:${rel}:${data.length}:`); hash.update(data); }
      else throw new Error("unsupported runtime entry");
    }
  };
  visit(dist, "dist");
  return hash.digest("hex");
}

export function installProjectRuntime(projectRoot: string, sourceDistDir: string, sourcePackageJson: string): RuntimeInstallResult {
  let stage: string | undefined;
  let temporaryLauncher: string | undefined;
  try {
    const packageData = JSON.parse(readFileSync(sourcePackageJson, "utf8")) as { version?: unknown };
    const version = packageData.version;
    if (typeof version !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(version) || version === "." || version === "..") throw new Error("invalid runtime version");
    for (const asset of ["cli.js", "config/ops-terms.json", "skills/vibe-guard/SKILL.md", "templates/postinstall-guard.sh"]) {
      if (!lstatSync(join(sourceDistDir, asset)).isFile()) throw new Error("required runtime asset unavailable");
    }
    const digest = digestTree(sourceDistDir, sourcePackageJson);
    const versions = join(projectRoot, ".fence", "runtime", "versions");
    const snapshot = join(versions, `${version}-${digest}`);
    const bin = join(projectRoot, ".fence", "bin");
    const launcherPath = join(bin, "vibe-fence");
    for (const path of [versions, snapshot, bin, launcherPath]) safePath(projectRoot, path);
    if (existsSync(launcherPath) && !readFileSync(launcherPath, "utf8").includes(marker)) throw new Error("unmanaged launcher exists");
    mkdirSync(versions, { recursive: true });
    mkdirSync(bin, { recursive: true });
    if (existsSync(snapshot)) {
      if (digestTree(join(snapshot, "dist"), join(snapshot, "package.json")) !== digest) throw new Error("conflicting runtime snapshot");
    } else {
      stage = join(versions, `.staging-${randomBytes(12).toString("hex")}`);
      mkdirSync(stage);
      cpSync(sourceDistDir, join(stage, "dist"), { recursive: true, errorOnExist: true });
      cpSync(sourcePackageJson, join(stage, "package.json"), { errorOnExist: true });
      if (digestTree(join(stage, "dist"), join(stage, "package.json")) !== digest) throw new Error("runtime copy verification failed");
      renameSync(stage, snapshot); stage = undefined;
    }
    const content = `#!/bin/sh\n${marker}\nHERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1\nexec node "$HERE/../runtime/versions/${version}-${digest}/dist/cli.js" "$@"\n`;
    if (existsSync(launcherPath) && readFileSync(launcherPath, "utf8") === content && (lstatSync(launcherPath).mode & 0o111)) return { status: "unchanged", launcherPath, version, digest };
    temporaryLauncher = join(bin, `.vibe-fence-${randomBytes(12).toString("hex")}`);
    writeFileSync(temporaryLauncher, content, { flag: "wx", mode: 0o755 });
    chmodSync(temporaryLauncher, 0o755);
    renameSync(temporaryLauncher, launcherPath); temporaryLauncher = undefined;
    return { status: "installed", launcherPath, version, digest };
  } catch {
    return { status: "unavailable", reason: "Runtime snapshot could not be installed safely; check the packaged assets and managed paths." };
  } finally {
    if (stage) rmSync(stage, { recursive: true, force: true });
    if (temporaryLauncher) rmSync(temporaryLauncher, { force: true });
  }
}
