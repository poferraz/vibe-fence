/**
 * tools/validate.test.ts — skill lint unit tests (bench task 5).
 * Ungrounded self-critique phrases fail; tool-signal grounding passes.
 * Run: bun test tools/validate.test.ts
 */
import { describe, it, expect } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lintSkillText, validateDocLinks } from "./validate";

describe("validateSkills ungrounded-critique", () => {
  it("flags ungrounded self-review phrases (bench task 5)", () => {
    const problems = lintSkillText(
      "evil/SKILL.md",
      "---\nname: bad-critique\ndescription: Use when you need to review work\n---\nAfter writing, review your own work and decide if it is good.\n",
    );
    expect(problems.length).toBe(1);
    expect(problems[0]?.category).toBe("policy");
    expect(problems[0]?.message).toContain("Ungrounded self-critique");
  });

  it("passes grounded critique with a tool signal", () => {
    const problems = lintSkillText(
      "ok/SKILL.md",
      "---\nname: ok\ndescription: Use when done\n---\nAfter writing, review your own work against the trust ladder verifier output.\n",
    );
    expect(problems).toEqual([]);
  });
});

it("reports broken relative documentation links while allowing existing links and external URLs", () => {
  const root = mkdtempSync(join(tmpdir(), "vf-doc-links-"));
  try {
    mkdirSync(join(root, "docs"));
    writeFileSync(join(root, "README.md"), "[ok](docs/a.md#part) [missing](docs/missing.md) [web](https://example.invalid) [here](#section)\n");
    writeFileSync(join(root, "docs/a.md"), "# A\n");
    const problems = validateDocLinks(root, ["README.md"]);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain("docs/missing.md");
    writeFileSync(join(root, "docs/missing.md"), "# Found\n");
    expect(validateDocLinks(root, ["README.md"])).toEqual([]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
