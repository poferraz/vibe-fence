import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateToolCall } from "./gate";

const scratch: string[] = [];
afterEach(() => { for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function project() {
  const base = mkdtempSync(join(tmpdir(), "vf-gate-paths-")); scratch.push(base);
  const root = join(base, "project"), nested = join(root, "src"), outside = join(base, "outside");
  for (const dir of [root, nested, outside]) mkdirSync(dir, { recursive: true });
  return { root, nested, outside };
}

test("relative edit paths resolve from the tool cwd, preserving allowed project files", () => {
  const { root, nested } = project();
  writeFileSync(join(root, "notes.md"), "Keep this draft.\n");
  const findings = evaluateToolCall({ tool: "edit", args: { filePath: "../notes.md", content: "Updated draft." }, projectRoot: root, workingDirectory: nested });
  expect(findings).toEqual([]);
});

test("relative paths from an outside cwd cannot be mistaken for project files", () => {
  const { root, outside } = project();
  const findings = evaluateToolCall({ tool: "write", args: { filePath: "notes.md", content: "Outside." }, projectRoot: root, workingDirectory: outside });
  expect(findings.map(f => f.ruleId)).toContain("FS-01");
});

test("recognized compound read-tool names use the credential rule's read semantics", () => {
  const findings = evaluateToolCall({ tool: "read_file", args: { path: ".env" } });
  expect(findings.map(f => f.ruleId)).toContain("SEC-02");
  expect(evaluateToolCall({ tool: "read_file", args: { path: ".env.example" } })).toEqual([]);
});
