/**
 * tests/benches/scenario.test.ts — Suite C scenario replay (plan 2026-10-27).
 * The demo/CUES.md beats (init → block → explain → checkpoint → undo)
 * replayed against the PACKED CLI (node dist/cli.js) in a scratch repo,
 * with exit-code assertions and the init <3s budget (REHEARSAL rubric).
 * --explain runs key-scrubbed: no live calls, ever.
 * Run: bun test tests/benches/scenario.test.ts
 */
import { describe, it, expect, afterAll } from "bun:test";
import { execFileSync, execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { generate } from "../../tools/generate";

const ROOT = resolve(import.meta.dir, "..", "..");
const DIST_CLI = join(ROOT, "dist", "cli.js");
const FIXTURE = join(ROOT, "demo", "leak-app");

/** Scrubbed model keys: this bench must never make live calls. */
const NO_KEYS = { MUSE_API_KEY: "", META_API_KEY: "" };

const created: string[] = [];
afterAll(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function gitEnv(): Record<string, string> {
  return { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
}

function sh(cwd: string, cmd: string): string {
  return execSync(cmd, { cwd, env: gitEnv(), encoding: "utf-8" }).trim();
}

function fence(cwd: string, args: string[]): { stdout: string; stderr: string; exit: number; ms: number } {
  const started = Date.now();
  try {
    const stdout = execFileSync("node", [DIST_CLI, ...args], {
      cwd,
      encoding: "utf-8",
      env: { ...process.env, ...NO_KEYS, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { stdout, stderr: "", exit: 0, ms: Date.now() - started };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return { stdout: String(err.stdout ?? ""), stderr: String(err.stderr ?? ""), exit: err.status ?? 1, ms: Date.now() - started };
  }
}

describe("scenario replay (demo beats, packed CLI)", () => {
  it("init → block → explain → checkpoint → undo, exit codes + budgets", async () => {
    await generate(); // hermetic dist, like tools/generate.test.ts
    const root = mkdtempSync(join(tmpdir(), "vf-scenario-"));
    created.push(root);
    cpSync(FIXTURE, root, { recursive: true });
    sh(root, "git init -q .");
    sh(root, "git add -A");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");

    // Beat 1: init inside the budget.
    const init = fence(root, ["init"]);
    expect(init.exit).toBe(0);
    expect(init.ms, "init must stay under the 3s rubric budget").toBeLessThan(3000);
    expect(init.stdout + init.stderr).toContain("vibe-fence active");

    // Beat 2-3: activate the leak, expect the SEC-01 block.
    const cfg = join(root, "config.env");
    const hex = randomBytes(12).toString("hex");
    writeFileSync(cfg, readFileSync(cfg, "utf-8").replace("your-token-here", hex), "utf-8");
    const blocked = fence(root, ["check"]);
    expect(blocked.exit).toBe(1);
    expect(blocked.stdout).toContain("FAIL SEC-01");

    // Beat 4: explain without a key degrades to a note, exits unchanged.
    const explained = fence(root, ["check", "--explain"]);
    expect(explained.exit).toBe(1);
    expect(explained.stdout).toContain("FAIL SEC-01");
    expect(explained.stderr).toMatch(/explain/i);

    // Beat 5: leaky checkpoint warns but still lands (D7).
    const cpLeaky = fence(root, ["checkpoint", "--action", "leaky WIP"]);
    expect(cpLeaky.exit).toBe(0);
    const leakyHead = sh(root, "git rev-parse HEAD");
    expect(sh(root, "git log --oneline -1")).toContain("checkpoint");
    const events = readFileSync(join(root, ".fence", "events.ndjson"), "utf-8");
    expect(events).toContain("blockingFindings");

    // Beat 6: fix, clean check, clean checkpoint.
    writeFileSync(cfg, readFileSync(cfg, "utf-8").replace(hex, "your-token-here"), "utf-8");
    const clean = fence(root, ["check"]);
    expect(clean.exit).toBe(0);
    expect(fence(root, ["checkpoint", "--action", "fix: placeholder restored"]).exit).toBe(0);

    // Beat 7: undo rolls back to the leaky checkpoint, work preserved.
    expect(fence(root, ["undo", "--steps", "1"]).exit).toBe(0);
    expect(sh(root, "git rev-parse HEAD")).toBe(leakyHead);
    sh(root, "git stash -q");
    expect(fence(root, ["check"]).exit).toBe(1); // stashed fix → leak visible again
    sh(root, "git stash pop -q");
    expect(fence(root, ["check"]).exit).toBe(0); // popped fix → clean
  }, 180_000);
});
