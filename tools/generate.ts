import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(import.meta.dir, "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      for (const sub of listFiles(full)) out.push(join(entry, sub));
    } else {
      out.push(entry);
    }
  }
  return out;
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function emitCliJs(): Promise<string> {
  // Bundle src/cli.ts → dist/cli.js: self-contained Node 20+ bin.
  // No bun binary, no tools/ dir at runtime (Oct 28 packed-CLI fix).
  // src/cli.ts stays the authority — this output is disposable.
  const result = await Bun.build({
    entrypoints: [join(SRC, "cli.ts")],
    outdir: DIST,
    target: "node",
    format: "esm",
    naming: "cli.js",
    // No banner: Bun preserves src/cli.ts's own shebang; a second one breaks node ESM parsing.
  });
  if (!result.success) {
    const detail = result.logs.map((l) => String(l)).join("\n");
    throw new Error(`cli bundle failed:\n${detail}`);
  }
  const { chmodSync } = await import("node:fs");
  chmodSync(join(DIST, "cli.js"), 0o755);
  return `cli: bundled dist/cli.js (${result.outputs.length} output${result.outputs.length === 1 ? "" : "s"})`;
}

export async function generate(): Promise<string[]> {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  const report: string[] = [];
  const files = listFiles(SRC).sort();
  for (const file of files) {
    // C9: tests never ship — dist/ feeds the npm tarball (package.json files).
    if (file.endsWith(".test.ts")) continue;
    // Placeholder only: dist dirs materialize via real files, never via .gitkeep.
    if (/(^|[\\/])\.gitkeep$/.test(file)) continue;
    const from = join(SRC, file);
    const to = join(DIST, file);
    mkdirSync(join(to, ".."), { recursive: true });
    writeFileSync(to, readFileSync(from), "utf8");
  }
  report.push(await emitCliJs());
  const distFiles = listFiles(DIST).sort();
  const digests = distFiles.map((f) => `${f} ${sha256(readFileSync(join(DIST, f), "utf8"))}`);
  writeFileSync(join(DIST, "PROVENANCE.md"), `# Provenance\n\nGenerated from src/ by tools/generate.ts. Do not edit.\n\n${digests.join("\n")}\n`, "utf8");
  report.push(`dist: ${distFiles.length} files from src/`);
  return report;
}

if (import.meta.main) {
  for (const line of await generate()) console.log(line);
}
