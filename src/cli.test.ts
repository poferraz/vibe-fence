/**
 * src/cli.test.ts — black-box CLI dispatch tests.
 * cli.ts self-dispatches on import (bundled-bin entry), so tests spawn it
 * via the current runtime instead of importing it.
 * Run: bun test src/cli.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "cli.ts");

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function runCli(args: string[], opts: { cwd?: string; input?: string; env?: Record<string, string> } = {}): { stdout: string; stderr: string; exit: number } {
  const cwd = opts.cwd ?? mkdtempSync(join(tmpdir(), "vf-cli-"));
  if (!opts.cwd) created.push(cwd);
  try {
    const stdout = execFileSync(process.execPath, [CLI_PATH, ...args], {
      cwd,
      input: opts.input,
      encoding: "utf-8",
      env: { ...process.env, ...opts.env },
      stdio: [opts.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
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

/** Scrubbed model keys: --explain tests must never make live calls, even on dev machines with keys set. */
const NO_KEYS = { MUSE_API_KEY: "", META_API_KEY: "" };

function gitEnv(): Record<string, string> {
  return { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
}

/** Fixture repo: clean base commit + leaky tip commit. Returns { root, base, tip }. */
function makePushRepo(): { root: string; base: string; tip: string } {
  const root = mkdtempSync(join(tmpdir(), "vf-push-"));
  created.push(root);
  const sh = (cmd: string): string => execSync(cmd, { cwd: root, env: gitEnv(), encoding: "utf-8" }).trim();
  sh("git init -q .");
  sh("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -q --allow-empty -m init");
  writeFileSync(join(root, "ok.ts"), "export const x = 1;\n", "utf-8");
  sh("git add -A");
  sh("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
  const base = sh("git rev-parse HEAD");
  writeFileSync(join(root, "leak.tsx"), "const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n", "utf-8");
  sh("git add -A");
  sh("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm leaky");
  const tip = sh("git rev-parse HEAD");
  return { root, base, tip };
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

describe("cli check --push/--staged", () => {
  it("--push reads pre-push stdin (real hook protocol) and blocks leaky ranges", () => {
    const { root, base, tip } = makePushRepo();
    const input = `refs/heads/main ${tip} refs/heads/main ${base}\n`;
    const r = runCli(["check", "--push"], { cwd: root, input });
    expect(r.exit).toBe(1);
    expect(r.stdout).toContain("SEC-01");
  });

  it("--push with an explicit range scans without stdin", () => {
    const { root } = makePushRepo();
    const r = runCli(["check", "--push", "HEAD~1..HEAD"], { cwd: root });
    expect(r.exit).toBe(1);
    expect(r.stdout).toContain("SEC-01");
    const clean = runCli(["check", "--push", "HEAD~1"], { cwd: root });
    expect(clean.exit).toBe(0);
  });

  it("--push rejects malformed explicit ranges", () => {
    const { root } = makePushRepo();
    const r = runCli(["check", "--push", "a..b..c"], { cwd: root });
    expect(r.exit).toBe(2);
    expect(r.stderr).toContain("bad --push range");
  });

  it("--staged and --push are mutually exclusive", () => {
    const r = runCli(["check", "--staged", "--push"]);
    expect(r.exit).toBe(2);
    expect(r.stderr).toContain("at most one");
  });
});

describe("cli --explain (no live calls — keys scrubbed)", () => {
  function makeProject(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), "vf-exp-"));
    created.push(root);
    for (const [rel, content] of Object.entries(files)) writeFileSync(join(root, rel), content, "utf-8");
    return root;
  }

  it("check --explain without a key notes and keeps the block exit", () => {
    const root = makeProject({ "a.ts": "const k = process.env.NEXT_PUBLIC_X_SECRET;\n" });
    const r = runCli(["check", "--explain"], { cwd: root, env: NO_KEYS });
    expect(r.exit).toBe(1);
    expect(r.stderr).toContain("--explain needs MUSE_API_KEY");
  });

  it("check --explain on a clean tree is a silent no-op", () => {
    const root = makeProject({ "a.ts": "export const x = 1;\n" });
    const r = runCli(["check", "--explain"], { cwd: root, env: NO_KEYS });
    expect(r.exit).toBe(0);
    expect(r.stderr).toBe("");
  });

  it("gate --explain without a key notes and keeps the block exit", () => {
    const root = makeProject({ "a.ts": "export const x = 1;\n" });
    const r = runCli(
      ["gate", "--tool", "write", "--args", JSON.stringify({ filePath: "a.ts", content: "const k = process.env.NEXT_PUBLIC_X_SECRET;" }), "--explain"],
      { cwd: root, env: NO_KEYS },
    );
    expect(r.exit).toBe(1);
    expect(r.stdout).toContain("SEC-01");
    expect(r.stderr).toContain("--explain needs MUSE_API_KEY");
  });

  it("gate --explain on an allowed call is a silent no-op", () => {
    const root = makeProject({ "a.ts": "export const x = 1;\n" });
    const r = runCli(["gate", "--tool", "write", "--args", JSON.stringify({ filePath: "a.ts", content: "export const x = 1;" }), "--explain"], {
      cwd: root,
      env: NO_KEYS,
    });
    expect(r.exit).toBe(0);
    expect(r.stderr).toBe("");
  });

  it("--help documents --explain", () => {
    const r = runCli(["--help"]);
    expect(r.stdout).toContain("--explain");
  });
});
