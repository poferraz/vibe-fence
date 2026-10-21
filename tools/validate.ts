import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

const TOKEN_BUDGET = 400;
const MAX_SKILL_LINES = 250;

export interface Problem {
  file: string;
  message: string;
  category: "spec" | "policy" | "host";
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.split("\n").length;
}

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

export function validateDist(): Problem[] {
  const problems: Problem[] = [];
  if (!existsSync(DIST)) {
    return [{ file: "dist", message: "dist/ does not exist; run tools/generate.ts", category: "spec" }];
  }
  for (const file of listFiles(DIST)) {
    const full = join(DIST, file);
    const text = readFileSync(full, "utf8");
    if (file === "AGENTS.md" || file.endsWith("/AGENTS.md")) {
      const tokens = estimateTokens(text);
      if (tokens > TOKEN_BUDGET) {
        problems.push({ file: full, message: `AGENTS.md token budget exceeded: ~${tokens} > ${TOKEN_BUDGET}`, category: "spec" });
      }
    }
    if (file.includes("skills/") && file.endsWith("SKILL.md")) {
      const lines = countLines(text);
      if (lines > MAX_SKILL_LINES) {
        problems.push({ file: full, message: `SKILL.md line count exceeded: ${lines} > ${MAX_SKILL_LINES}`, category: "spec" });
      }
    }
  }
  return problems;
}

export function validateSchemas(): Problem[] {
  return [];
}

if (import.meta.main) {
  const problems = [...validateDist(), ...validateSchemas()];
  if (problems.length === 0) {
    console.log("validate: ok");
  } else {
    for (const p of problems) console.log(`[${p.category}] ${p.file}: ${p.message}`);
    process.exit(1);
  }
}
