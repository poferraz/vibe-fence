import { lstatSync } from "node:fs";
import { join, resolve } from "node:path";

/** Refuse managed symlinks, including dangling links. The project root itself may be an alias. */
export function adapterPathsSafe(root: string, paths: readonly string[]): boolean {
  for (const path of paths) {
    let current = resolve(root);
    for (const part of path.split("/")) {
      current = join(current, part);
      try { if (lstatSync(current).isSymbolicLink()) return false; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") return false; }
    }
  }
  return true;
}
