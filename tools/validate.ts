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

// --- Skill lint (S-02/S-08, FINAL-v4 \u00a76 rule 7 + S-02 L1 contract) ---

const UNGROUNDED_PHRASES: RegExp[] = [
  /review your own work/i,
  /critique yoursel/i, // matches critique yourself / critique yourselves
  /review your work/i,
  /critique your work/i,
  /self-critique/i,
  /self-reflect/i,
];

// A SKILL.md has a tool signal if it mentions an executable check / tool
// that grounds the critique (e.g. "run tsc", "check with", "tool signal",
// "verifier", "lint", "test", "validate", "diagnosis artefact").
const TOOL_SIGNAL_RE =
  /\b(tool signal|run\s+\S+|check with|verifier|diagnosis artefact|executable check|trust ladder)\b/i;

function lintSkillText(skillPath: string, content: string): Problem[] {
  const problems: Problem[] = [];
  for (const re of UNGROUNDED_PHRASES) {
    if (re.test(content)) {
      // Allow if the same file contains a tool signal that grounds the critique
      if (!TOOL_SIGNAL_RE.test(content)) {
        problems.push({
          file: skillPath,
          message: `Ungrounded self-critique phrase matched ${re} without tool signal (FINAL-v4 \u00a76 rule 7 \u2014 add an executable check reference or remove the phrase)`,
          category: "policy",
        });
        break; // one report per file is enough
      }
    }
  }
  return problems;
}

function parseFrontmatterDescription(content: string): string | null {
  // L1 frontmatter is YAML between leading --- fences
  if (!content.startsWith("---")) return null;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return null;
  const fm = content.slice(0, end);
  // Extract description field (may be quoted or unquoted, single-line per spec)
  const m = fm.match(/^description:\s*(.+)$/m);
  if (!m) return null;
  let raw = m[1].trim();
  // Strip surrounding quotes if present
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1);
  }
  return raw;
}

function lintSkillDescription(skillPath: string, content: string): Problem[] {
  const desc = parseFrontmatterDescription(content);
  if (desc === null) {
    return [{ file: skillPath, message: "SKILL.md missing L1 frontmatter description (S-02: name + description required)", category: "spec" }];
  }
  if (desc.length === 0) {
    return [{ file: skillPath, message: "SKILL.md L1 description is empty (S-02: describe WHAT + WHEN + trigger phrases)", category: "spec" }];
  }
  if (desc.length > 1024) {
    return [{ file: skillPath, message: `SKILL.md L1 description exceeds 1024 chars: ${desc.length} (S-02 L1 routing contract)`, category: "spec" }];
  }
  return [];
}

function scanSkillFiles(root: string): string[] {
  // Find all SKILL.md under src/skills (source of truth) + dist/skills (generated)
  const out: string[] = [];
  const candidates = [join(root, "src", "skills"), join(root, "dist", "skills")];
  for (const base of candidates) {
    if (!existsSync(base)) continue;
    for (const entry of listFiles(base)) {
      if (entry.endsWith("SKILL.md")) out.push(join(base, entry));
    }
  }
  return out;
}

export function validateSkills(): Problem[] {
  const problems: Problem[] = [];
  for (const skillPath of scanSkillFiles(ROOT)) {
    const content = readFileSync(skillPath, "utf8");
    problems.push(...lintSkillText(skillPath, content));
    problems.push(...lintSkillDescription(skillPath, content));
  }
  return problems;
}

export function validateSchemas(): Problem[] {
  return [];
}

if (import.meta.main) {
  const problems = [...validateDist(), ...validateSkills(), ...validateSchemas()];
  if (problems.length === 0) {
    console.log("validate: ok");
  } else {
    for (const p of problems) console.log(`[${p.category}] ${p.file}: ${p.message}`);
    process.exit(1);
  }
}
