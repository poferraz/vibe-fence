import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install } from "../install";

const roots: string[] = [];
function project(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "vf-continuity-")));
  roots.push(root);
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("continuity skill installation", () => {
  it("installs the advisory skill without creating a project handoff or copying credentials", async () => {
    const root = project();
    writeFileSync(join(root, ".env"), "FABRICATED_CREDENTIAL=fixture-only\n");
    await install(root, { adapters: [] });
    const installed = join(root, ".agents/skills/vibe-continuity/SKILL.md");
    expect(existsSync(installed)).toBe(true);
    expect(readFileSync(installed, "utf8")).not.toContain("fixture-only");
    expect(existsSync(join(root, ".fence/continuity.md"))).toBe(false);
  });

  it("keeps a project's existing skill and handoff unchanged across repeated installs", async () => {
    const root = project();
    const skillDir = join(root, ".agents/skills/vibe-continuity");
    mkdirSync(skillDir, { recursive: true });
    const skill = join(skillDir, "SKILL.md");
    const handoffDir = join(root, ".fence/private");
    mkdirSync(handoffDir, { recursive: true });
    const handoff = join(handoffDir, "continuity.md");
    writeFileSync(skill, "user-owned skill\n");
    writeFileSync(handoff, "user-owned notes\n");
    await install(root, { adapters: [] });
    await install(root, { adapters: [] });
    expect(readFileSync(skill, "utf8")).toBe("user-owned skill\n");
    expect(readFileSync(handoff, "utf8")).toBe("user-owned notes\n");
  });
});
