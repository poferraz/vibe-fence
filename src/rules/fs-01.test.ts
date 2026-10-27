/**
 * src/rules/fs-01.test.ts — realpath boundary escape.
 * Containment through symlinks and ..; sensitive absolutes in live shell.
 * Run: bun test src/rules/fs-01.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { check } from "./fs-01";

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "vf-fs01-"));
  created.push(root);
  mkdirSync(join(root, "sub"), { recursive: true });
  writeFileSync(join(root, "sub", "in.txt"), "x\n", "utf-8");
  return root;
}

describe("FS-01", () => {
  it("passes contained paths, including nested nonexistent ones", () => {
    const root = makeRoot();
    expect(check({ filePath: "sub/in.txt", projectRoot: root }).verdict).toBe("pass");
    expect(check({ filePath: "sub/new/deep.txt", projectRoot: root }).verdict).toBe("pass");
    expect(check({ filePath: join(root, "sub", "in.txt"), projectRoot: root }).verdict).toBe("pass");
  });

  it("fails .. escapes, absolute outsiders, and home paths", () => {
    const root = makeRoot();
    expect(check({ filePath: "../outside.txt", projectRoot: root }).verdict).toBe("fail");
    expect(check({ filePath: "sub/../../outside.txt", projectRoot: root }).verdict).toBe("fail");
    expect(check({ filePath: "/etc/passwd", projectRoot: root }).verdict).toBe("fail");
    expect(check({ filePath: "~/.ssh/id_rsa", projectRoot: root }).verdict).toBe("fail");
  });

  it("sees through symlinks pointing outside", () => {
    const root = makeRoot();
    const outside = mkdtempSync(join(tmpdir(), "vf-fs01-out-"));
    created.push(outside);
    writeFileSync(join(outside, "secret.txt"), "s\n", "utf-8");
    symlinkSync(join(outside, "secret.txt"), join(root, "link.txt"), "file");
    symlinkSync(join(root, "sub", "in.txt"), join(root, "oklink.txt"), "file");
    expect(check({ filePath: "link.txt", projectRoot: root }).verdict).toBe("fail");
    expect(check({ filePath: "oklink.txt", projectRoot: root }).verdict).toBe("pass");
  });

  it("fails sensitive absolute targets in live shell, passes them in docs", () => {
    const root = makeRoot();
    expect(check({ content: "cat /etc/passwd", toolName: "bash" }).verdict).toBe("fail");
    expect(check({ content: "cat /etc/passwd", filePath: "guide.md", projectRoot: root }).verdict).toBe("pass");
  });

  it("is unknown without a root or without anything to inspect", () => {
    expect(check({ filePath: "a.txt" }).verdict).toBe("unknown");
    expect(check({}).verdict).toBe("unknown");
  });
});
