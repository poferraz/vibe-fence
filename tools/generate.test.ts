/**
 * tools/generate.test.ts — dist/ cleanliness guard (C9).
 * The npm tarball ships dist/ (package.json files), so tests and .gitkeep
 * placeholders must never land there. Regenerates dist/ from src/, then
 * asserts on the result — hermetic, no build-order dependency.
 * Run: bun test tools/generate.test.ts
 */
import { describe, it, expect } from "bun:test";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { generate } from "./generate";

const DIST = resolve(import.meta.dir, "..", "dist");

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

describe("generate (src → dist)", () => {
  it("ships no *.test.ts or .gitkeep into dist/ (tarball guard)", async () => {
    await generate();
    expect(existsSync(DIST)).toBe(true);
    const files = listFiles(DIST).sort();
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((f) => f.endsWith(".test.ts"))).toEqual([]);
    expect(files.filter((f) => /(^|[\\/])\.gitkeep$/.test(f))).toEqual([]);
    // The packed bin still ships alongside the sources.
    expect(files).toContain("cli.js");
  }, 60_000);
});
