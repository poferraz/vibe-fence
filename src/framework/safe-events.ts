import { closeSync, constants, lstatSync, openSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Append only to the project's existing, non-symlinked event directory and file. */
export function appendProjectEvent(projectRoot: string, value: string): void {
  const directory = join(projectRoot, ".fence");
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("unsafe event directory");
  const path = join(directory, "events.ndjson");
  const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_NOFOLLOW, 0o600);
  try { writeFileSync(fd, value, "utf8"); } finally { closeSync(fd); }
}
