/**
 * src/cli.test.ts — black-box CLI dispatch tests.
 * cli.ts self-dispatches on import (bundled-bin entry), so tests spawn it
 * via the current runtime instead of importing it.
 * Run: bun test src/cli.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "cli.ts");

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function runCli(args: string[]): { stdout: string; stderr: string; exit: number } {
  const cwd = mkdtempSync(join(tmpdir(), "vf-cli-"));
  created.push(cwd);
  try {
    const stdout = execFileSync(process.execPath, [CLI_PATH, ...args], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { stdout, stderr: "", exit: 0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: String(err.stdout ?? ""),
      stderr: String(err.stderr ?? ""),
      exit: err.status ?? 1,
    };
  }
}

describe("cli --profile", () => {
  it("--profile muse selects the Claude adapter preset", () => {
    const r = runCli(["init", "--profile", "muse", "--dry-run"]);
    expect(r.exit).toBe(0);
    expect(r.stdout).toContain("would install adapters: claude");
  });

  it("--profile=muse equals form works", () => {
    const r = runCli(["init", "--profile=muse", "--dry-run"]);
    expect(r.exit).toBe(0);
    expect(r.stdout).toContain("would install adapters: claude");
  });

  it("explicit --adapters overrides --profile", () => {
    const r = runCli(["init", "--adapters=cursor", "--profile", "muse", "--dry-run"]);
    expect(r.exit).toBe(0);
    expect(r.stdout).toContain("would install adapters: cursor");
  });

  it("unknown --profile fails closed", () => {
    const r = runCli(["init", "--profile", "nope", "--dry-run"]);
    expect(r.exit).toBe(2);
    expect(r.stderr).toContain("unknown --profile");
  });

  it("tour stays an unadvertised stub (exit 2)", () => {
    const r = runCli(["tour"]);
    expect(r.exit).toBe(2);
    expect(r.stderr).toContain("not implemented");
  });

  it("--help documents --profile", () => {
    const r = runCli(["--help"]);
    expect(r.exit).toBe(0);
    expect(r.stdout).toContain("--profile=muse");
  });
});
