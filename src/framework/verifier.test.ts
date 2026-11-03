/**
 * src/framework/verifier.test.ts — A1 regression: verifier must execute, never fake-pass.
 * A fixture whose test command exits 1 CANNOT produce overall pass.
 * A check that cannot run is "unknown" and also blocks overall pass.
 * Run: bun test src/framework/verifier.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTrustLadder, judgeForProse, detectTestTampering, BYTE_CAP } from "./verifier";

const REPO_ROOT = join(import.meta.dir, "..", "..");
const created: string[] = [];

function makeProject(opts: {
  scripts?: Record<string, string>;
  withTs?: boolean;
  linkTsc?: boolean;
}): string {
  const root = mkdtempSync(join(tmpdir(), "vf-verifier-"));
  created.push(root);
  const pkg: Record<string, unknown> = { name: "fixture", version: "0.0.0", type: "module" };
  if (opts.scripts) pkg["scripts"] = opts.scripts;
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  if (opts.withTs) {
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { strict: true, target: "ESNext", module: "ESNext", moduleResolution: "bundler", noEmit: true },
        include: ["index.ts"],
      }) + "\n",
      "utf-8",
    );
    writeFileSync(join(root, "index.ts"), "export const x: number = 1;\n", "utf-8");
  }
  if (opts.linkTsc) {
    mkdirSync(join(root, "node_modules", ".bin"), { recursive: true });
    symlinkSync(join(REPO_ROOT, "node_modules", "typescript"), join(root, "node_modules", "typescript"), "dir");
    symlinkSync(join(root, "node_modules", "typescript", "bin", "tsc"), join(root, "node_modules", ".bin", "tsc"), "file");
  }
  return root;
}

const FULL_SCRIPTS = {
  lint: 'node -e "process.exit(0)"',
  test: 'node -e "console.log(\'tests ok\')"',
  build: 'node -e "process.exit(0)"',
};

afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop() as string;
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("verifier trust ladder — A1 (executes for real, unknown never passes)", () => {
  it("a test command exiting 1 CANNOT produce overall pass", async () => {
    const root = makeProject({
      withTs: true,
      scripts: { ...FULL_SCRIPTS, test: 'node -e "console.error(\'boom: failing test\'); process.exit(1)"' },
    });
    const report = await runTrustLadder(root, "failcase");
    expect(report.overall).toBe("fail");
    const tests = report.tiers.find((t) => t.tier === "tests");
    expect(tests?.status).toBe("fail");
    expect(tests?.passed).toBe(false);
    const logPath = join(root, ".fence", "verdicts", "failcase-tests.log");
    expect(existsSync(logPath)).toBe(true);
    expect(readFileSync(logPath, "utf-8")).toContain("boom: failing test");
  }, 120_000);

  it("a project whose checks all really pass earns overall pass, with a log per tier", async () => {
    const root = makeProject({ withTs: true, linkTsc: true, scripts: { ...FULL_SCRIPTS } });
    const report = await runTrustLadder(root, "passcase");
    expect(report.overall).toBe("pass");
    expect(report.tiers.length).toBeGreaterThanOrEqual(5);
    for (const tier of report.tiers) {
      expect(tier.status).toBe("pass");
      expect(tier.passed).toBe(true);
      expect(tier.outputPath).not.toBeNull();
      expect(existsSync(join(root, tier.outputPath as string))).toBe(true);
    }
  }, 120_000);

  it("a missing lint command is unknown — and unknown blocks overall pass", async () => {
    const root = makeProject({
      withTs: true,
      linkTsc: true,
      scripts: { test: FULL_SCRIPTS.test, build: FULL_SCRIPTS.build },
    });
    const report = await runTrustLadder(root, "nolint");
    const lint = report.tiers.find((t) => t.tier === "lint");
    expect(lint?.status).toBe("unknown");
    expect(lint?.passed).toBe(false);
    expect(report.overall).toBe("unknown");
    const logPath = join(root, ".fence", "verdicts", "nolint-lint.log");
    expect(existsSync(logPath)).toBe(true);
    expect(readFileSync(logPath, "utf-8")).toContain("UNKNOWN");
  }, 120_000);

  it("verdict output is byte-capped even when a check is very chatty", async () => {
    const root = makeProject({
      withTs: true,
      linkTsc: true,
      scripts: { ...FULL_SCRIPTS, test: 'node -e "console.log(\'x\'.repeat(20000))"' },
    });
    const report = await runTrustLadder(root, "chatty");
    expect(report.overall).toBe("pass");
    const log = readFileSync(join(root, ".fence", "verdicts", "chatty-tests.log"), "utf-8");
    expect(log.length).toBeLessThanOrEqual(BYTE_CAP + 128);
    expect(log).toContain("truncated");
  }, 120_000);

  it("judge-for-prose never reports a pass it did not earn", async () => {
    const result = await judgeForProse("/nonexistent", "prose", "hello");
    expect(result.passed).toBe(false);
    expect(result.status).toBe("unknown");
  });

  it("detectTestTampering flags added skips and removed assertions only", () => {
    const skipped = detectTestTampering("+++ b/a.test.ts\n+  it.skip(\"x\", () => {});\n");
    expect(skipped.tampered).toBe(true);
    const removed = detectTestTampering("--- a/a.test.ts\n-  expect(a).toBe(1);\n+++ b/a.test.ts\n+  const a = 1;\n");
    expect(removed.tampered).toBe(true);
    const clean = detectTestTampering("--- a/a.ts\n-const a = 1;\n+++ b/a.ts\n+const a = 2;\n");
    expect(clean.tampered).toBe(false);
  });
});
