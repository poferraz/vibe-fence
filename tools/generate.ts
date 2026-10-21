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

export function generate(): string[] {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  const report: string[] = [];
  const files = listFiles(SRC).sort();
  for (const file of files) {
    const from = join(SRC, file);
    const to = join(DIST, file);
    mkdirSync(join(to, ".."), { recursive: true });
    writeFileSync(to, readFileSync(from), "utf8");
  }
  const distFiles = listFiles(DIST).sort();
  const digests = distFiles.map((f) => `${f} ${sha256(readFileSync(join(DIST, f), "utf8"))}`);
  writeFileSync(join(DIST, "PROVENANCE.md"), `# Provenance\n\nGenerated from src/ by tools/generate.ts. Do not edit.\n\n${digests.join("\n")}\n`, "utf8");
  report.push(`dist: ${distFiles.length} files from src/`);
  return report;
}

if (import.meta.main) {
  for (const line of generate()) console.log(line);
}
