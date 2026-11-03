import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Read the manifest beside src/ in development or dist/ in a packaged runtime. */
export function packageVersion(): string {
  try {
    const manifest = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8")) as { version?: unknown };
    if (typeof manifest.version === "string" && manifest.version) return manifest.version;
  } catch {
    // A missing or invalid manifest must not stop the CLI from starting.
  }
  return "0.0.0-dev";
}
