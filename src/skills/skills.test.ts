/**
 * src/skills/skills.test.ts — installed docs teach only real subcommands (C8).
 * Every `fence <cmd>` / `vibe-fence <cmd>` in SKILL.md code spans and fenced
 * blocks must dispatch in src/cli.ts. Text-based: cli.ts self-dispatches on
 * import, so the real subcommand set is derived by parsing its source.
 * Run: bun test src/skills/skills.test.ts
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SKILLS_DIR = import.meta.dir;
const CLI_PATH = resolve(SKILLS_DIR, "..", "cli.ts");

/** Subcommands that work (exit 0/1 with real behavior). `tour` is a stub — never taught. */
const REAL_SUBCOMMANDS = new Set(["init", "check", "checkpoint", "undo", "gate"]);

// Taught invocation at the start of a fenced-block line (`$` prompt optional).
const BLOCK_CMD_RE = /^\s*(?:\$\s*)?(?:npx\s+)?(?:vibe-)?fence\s+([\w-]+)/;
// Command-shaped reference inside inline code.
const INLINE_CMD_RE = /(?:npx\s+)?(?:vibe-)?fence\s+([\w-]+)/g;
const FENCED_RE = /```(?:\w+)?\n(.*?)```/gs;
const INLINE_CODE_RE = /`([^`\n]+)`/g;
// `if (cmd === "init")` branches in cli.ts source.
const CLI_BRANCH_RE = /cmd === "([a-z][a-z0-9-]*)"/g;

function skillFiles(): string[] {
  return readdirSync(SKILLS_DIR)
    .map((entry) => join(SKILLS_DIR, entry, "SKILL.md"))
    .filter((p) => existsSync(p))
    .sort();
}

function taughtCommands(skillPath: string): Array<{ cmd: string; where: string }> {
  const text = readFileSync(skillPath, "utf-8");
  const out: Array<{ cmd: string; where: string }> = [];
  for (const m of text.matchAll(FENCED_RE)) {
    const body = m[1] ?? "";
    for (const line of body.split("\n")) {
      const hit = BLOCK_CMD_RE.exec(line);
      if (hit?.[1]) out.push({ cmd: hit[1], where: line.trim().slice(0, 80) });
    }
  }
  const noFences = text.replace(FENCED_RE, "");
  for (const m of noFences.matchAll(INLINE_CODE_RE)) {
    const span = m[1] ?? "";
    for (const hit of span.matchAll(INLINE_CMD_RE)) {
      if (hit[1]) out.push({ cmd: hit[1], where: span.slice(0, 80) });
    }
  }
  return out;
}

describe("skills teach only real subcommands", () => {
  it("every documented skill command dispatches in cli.ts", () => {
    const files = skillFiles();
    expect(files.length).toBeGreaterThan(0);
    const phantoms: string[] = [];
    for (const f of files) {
      for (const t of taughtCommands(f)) {
        if (!REAL_SUBCOMMANDS.has(t.cmd)) {
          phantoms.push(`${f.split("/").slice(-2).join("/")}: '${t.cmd}' in \`${t.where}\``);
        }
      }
    }
    expect(phantoms).toEqual([]);
  });

  it("the allowed set matches cli.ts dispatch branches (no drift)", () => {
    const cli = readFileSync(CLI_PATH, "utf-8");
    const branched = new Set<string>();
    for (const m of cli.matchAll(CLI_BRANCH_RE)) {
      if (m[1]) branched.add(m[1]);
    }
    for (const cmd of REAL_SUBCOMMANDS) {
      expect(branched.has(cmd)).toBe(true);
    }
  });
});
