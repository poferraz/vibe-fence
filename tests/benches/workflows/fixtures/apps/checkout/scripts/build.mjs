// Offline static build: concatenate public/*.mjs into dist/bundle.js.
import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dist = join(root, "dist");
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist, { recursive: true });
const parts = [];
for (const f of readdirSync(join(root, "public")).filter((x) => x.endsWith(".mjs")).sort()) {
  parts.push(`// --- ${f} ---\n` + readFileSync(join(root, "public", f), "utf-8"));
}
writeFileSync(join(dist, "bundle.js"), parts.join("\n"));
console.log(`bundle: ${parts.length} file(s)`);
