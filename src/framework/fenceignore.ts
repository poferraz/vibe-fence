/** Project-local exclusions for bounded scans; these do not modify Git ignore rules. */
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { adapterPathsSafe } from "../adapters/safe-paths.js";

interface Pattern { negated: boolean; regex: RegExp }
const BUILTIN = ["*.lock", "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "*.min.js", "*.map"];

function compile(raw: string): Pattern {
  const negated = raw.startsWith("!");
  let glob = negated ? raw.slice(1) : raw;
  const anchored = glob.startsWith("/");
  glob = glob.replace(/^\/+/, "").replace(/\/+$/, "");
  const hasSlash = glob.includes("/");
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === "*") {
      if (glob[i + 1] === "*") { i++; if (glob[i + 1] === "/") { i++; out += "(?:.*/)?"; } else out += ".*"; }
      else out += "[^/]*";
    } else if (c === "?") out += "[^/]";
    else out += c.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  }
  return { negated, regex: new RegExp(`${anchored || hasSlash ? "^" : "(?:^|/)"}${out}(?:/|$)`) };
}

export function loadFenceIgnore(root: string): { ignores(path: string): boolean; unreadable: boolean } {
  let unreadable = false;
  const patterns = BUILTIN.map(compile);
  const path = join(root, ".fenceignore");
  try {
    if (!adapterPathsSafe(root, [".fenceignore"])) throw new Error("unsafe ignore file");
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.size > 128 * 1024) throw new Error("invalid ignore file");
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const value = line.trim();
      if (value && !value.startsWith("#") && value !== "!") patterns.push(compile(value));
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") unreadable = true; }
  return {
    unreadable,
    ignores(path: string): boolean {
      const normalized = path.replace(/\\/g, "/");
      const base = normalized.split("/").at(-1) ?? "";
      // A custom ignore must not hide tracked credential files.
      if (/^\.env(?:\.|$)/i.test(base) && !/\.example(?:\.|$)/i.test(base)) return false;
      let ignored = false;
      for (const pattern of patterns) if (pattern.regex.test(normalized)) ignored = !pattern.negated;
      return ignored;
    },
  };
}
