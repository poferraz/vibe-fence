#!/usr/bin/env node
// src/cli.ts — bin shim for `vibe-fence` (package.json bin: ./dist/cli.js)
// Delegates to tools/install.ts so `npx vibe-fence init` works after `bun run build`.
// Kept minimal: src/ is authority, dist/ is disposable (src→dist via tools/generate.ts).
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dir, "..");
const result = spawnSync("bun", [join(root, "tools", "install.ts"), ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status ?? 0);
