/**
 * src/framework/verifier.ts
 * S-04 — Verification is mechanical, never self-assessment. Read→Think→Write→Check + diagnosis artefact.
 * S-12 — Elicitation trust ladder; Tournament Selection on failure.
 * GEM-11 (P1) — Ephemeral smoke suite for zero-test repos (// @fence-ephemeral).
 * C-10 — Can LLM-generated smoke tests be trusted as block gate? Measure false-pass before promoting.
 * Anti-patterns: §6 #6 (no LLM-judge gating), #14 (do not delete/skip tests to green CI).
 *
 * A1 (fixed 2026-10-27): every tier EXECUTES its check for real and writes the
 * byte-capped output to .fence/verdicts/<taskId>-<tier>.log. A check that cannot
 * run (no command configured, tool missing) reports "unknown" — never a pass.
 * overall is "pass" only when every tier ran and passed; any failure is "fail";
 * otherwise any unknown makes the whole report "unknown".
 */

import { existsSync, writeFileSync, readFileSync, mkdirSync, globSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Trust ladder tiers — ordered cheapest→most expensive (S-04/S-12). */
export type TrustTier =
  | "compile" // tsc --noEmit — cheapest, always
  | "lint" // project lint script (eslint / biome / …)
  | "tests" // existing repo tests ×1
  | "tests-x2" // same tests ×2 — flake check (GEM-11)
  | "build" // project build script
  | "generated" // ephemeral smoke suite (GEM-11) — only if zero-test repo
  | "judge-for-prose"; // LLM judge — ONLY for prose/docs, never for code (S-12 / §6 #6)

/** pass = ran and succeeded · fail = ran and did not · unknown = could not run. */
export type TierStatus = "pass" | "fail" | "unknown";

export interface TierResult {
  tier: TrustTier;
  status: TierStatus;
  /** Kept for compatibility: true only when status === "pass". */
  passed: boolean;
  durationMs: number;
  outputPath: string | null; // .fence/verdicts/<taskId>-<tier>.log — diagnosis artefact
  /** Why the tier is unknown/failed, in plain words. */
  reason?: string;
  /** The exact command executed (absent when the tier could not run). */
  command?: string;
}

export interface VerifyReport {
  taskId: string;
  tiers: TierResult[];
  overall: "pass" | "fail" | "unknown";
  generatedEphemeral: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EPHEMERAL_MARKER = "// @fence-ephemeral — delete when you add real tests";
export const EPHEMERAL_PATH = "tests/.fence-smoke.test.ts";
export const VERDICT_DIR = ".fence/verdicts";
export const BYTE_CAP = 4096; // S-03 4KB pipe

const TIER_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Helpers — byte cap + artefact writer
// ---------------------------------------------------------------------------

function byteCap(text: string, cap = BYTE_CAP): string {
  if (text.length <= cap) return text;
  return text.slice(0, cap) + `\n[...truncated to ${cap}B — see full log with --verbose]`;
}

function ensureVerdictDir(projectRoot: string): string {
  const dir = join(projectRoot, VERDICT_DIR);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function verdictPath(projectRoot: string, taskId: string, tier: TrustTier): string {
  return join(projectRoot, VERDICT_DIR, `${taskId}-${tier}.log`);
}

/** Write the diagnosis artefact (byte-capped). Returns .fence/verdicts/… path or null. */
function writeVerdict(projectRoot: string, taskId: string, tier: TrustTier, text: string): string | null {
  try {
    ensureVerdictDir(projectRoot);
    writeFileSync(verdictPath(projectRoot, taskId, tier), byteCap(text), "utf-8");
    return `${VERDICT_DIR}/${taskId}-${tier}.log`;
  } catch {
    return null; // verdict write failure must not mask the check result itself
  }
}

function tierResult(
  projectRoot: string,
  taskId: string,
  tier: TrustTier,
  status: TierStatus,
  started: number,
  artefactText: string,
  extra: { reason?: string; command?: string } = {},
): TierResult {
  return {
    tier,
    status,
    passed: status === "pass",
    durationMs: Date.now() - started,
    outputPath: writeVerdict(projectRoot, taskId, tier, artefactText),
    ...(extra.reason ? { reason: extra.reason } : {}),
    ...(extra.command ? { command: extra.command } : {}),
  };
}

function unknownTier(
  projectRoot: string,
  taskId: string,
  tier: TrustTier,
  started: number,
  reason: string,
): TierResult {
  return tierResult(projectRoot, taskId, tier, "unknown", started,
    `UNKNOWN: ${reason}\ncommand: (not executed)\n`, { reason });
}

function isRealTestScript(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  // placeholder check — `echo "no tests"` / `echo "Error: no test specified" && exit 1`
  if (/^\s*echo\b/i.test(trimmed)) return false;
  return true;
}

function readPackageScripts(projectRoot: string): Record<string, unknown> {
  try {
    const pkgPath = join(projectRoot, "package.json");
    if (!existsSync(pkgPath)) return {};
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { scripts?: Record<string, unknown> };
    return pkg.scripts ?? {};
  } catch {
    return {}; // malformed package.json — no runnable scripts
  }
}

// ---------------------------------------------------------------------------
// Command execution — the only way a tier may earn "pass"
// ---------------------------------------------------------------------------

interface ExecOutcome {
  status: TierStatus;
  reason?: string;
  output: string;
}

/** Run a project-defined script string through the shell, capturing capped evidence. */
function runShellCommand(command: string, projectRoot: string): ExecOutcome {
  const result = spawnSync(command, {
    shell: true,
    cwd: projectRoot,
    encoding: "utf-8",
    timeout: TIER_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });
  const output = [result.stdout ?? "", result.stderr ?? ""].filter(Boolean).join("\n");
  const err = (result as unknown as { error?: Error & { code?: string } }).error;
  if (err) {
    if (err.code === "ETIMEDOUT") {
      return { status: "fail", reason: `timed out after ${TIER_TIMEOUT_MS}ms`, output };
    }
    if (err.code === "ENOENT") {
      return { status: "unknown", reason: `command could not start: ${err.message}`, output };
    }
    return { status: "unknown", reason: `command could not run: ${err.message}`, output };
  }
  if (result.status === 0) return { status: "pass", output };
  if (result.status === null) {
    return { status: "fail", reason: `terminated by signal ${result.signal ?? "unknown"}`, output };
  }
  return { status: "fail", reason: `exit code ${result.status}`, output };
}

/** Run a package.json script tier (lint/tests/build) or report why it cannot run. */
function runScriptTier(
  projectRoot: string,
  taskId: string,
  tier: TrustTier,
  scriptName: string,
): TierResult {
  const started = Date.now();
  const scripts = readPackageScripts(projectRoot);
  const script = scripts[scriptName];
  if (!isRealTestScript(script)) {
    return unknownTier(projectRoot, taskId, tier, started,
      `no "${scriptName}" command configured in package.json — nothing was run, so this check cannot pass`);
  }
  const command = (script as string).trim();
  const outcome = runShellCommand(command, projectRoot);
  const header = `$ ${command}\nverdict: ${outcome.status}${outcome.reason ? ` (${outcome.reason})` : ""}\n`;
  return tierResult(projectRoot, taskId, tier, outcome.status, started,
    header + outcome.output, { command, ...(outcome.reason ? { reason: outcome.reason } : {}) });
}

// ---------------------------------------------------------------------------
// Detection — does repo have any tests?
// ---------------------------------------------------------------------------

/**
 * Detect zero-test repos — triggers ephemeral bootstrap (GEM-11).
 * Checks **\/*.test.*, **\/*.spec.*, __tests__\/**, and test npm script.
 * Our own generated smoke file never counts as evidence of real tests.
 */
export function hasTests(projectRoot: string): boolean {
  const patterns = ["**/*.test.*", "**/*.spec.*", "__tests__/**"] as const;

  // Exclude noise dirs — must not treat dist/node_modules/.git as evidence of tests
  const exclude = (p: string): boolean =>
    p.includes("node_modules") || p.includes("dist/") || p.includes(".git/") || p.includes(".fence/");

  for (const pat of patterns) {
    try {
      const hits = globSync(pat, { cwd: projectRoot, exclude } as unknown as Record<string, unknown>);
      if (hits.some((h) => h !== EPHEMERAL_PATH && !h.endsWith(`/${EPHEMERAL_PATH}`))) return true;
    } catch {
      // glob failure is not evidence of absence — fall through to package.json check
    }
  }

  // package.json scripts.test — must be present and not an echo placeholder
  const scripts = readPackageScripts(projectRoot);
  return isRealTestScript(scripts["test"]);
}

// ---------------------------------------------------------------------------
// Ephemeral smoke suite generation (GEM-11)
// ---------------------------------------------------------------------------

/**
 * Generate ephemeral smoke suite for testless repos.
 * Templated checks: compile (tsc --noEmit), render (default export mounts), build (next build exit 0).
 * Marked with EPHEMERAL_MARKER so `fence validate` knows to exclude from coverage gates.
 * Wire into .fence/verifier trust ladder as "generated" tier (CodeT dual-execution).
 */
export function generateEphemeralSuite(projectRoot: string): string {
  void projectRoot;
  const content = `/**
 * ${EPHEMERAL_MARKER}
 * Auto-generated by vibe-fence verifier (GEM-11) for zero-test repos.
 * Trust ladder tier: generated-tests (CodeT dual-execution).
 * Open question (C-10): false-positive rate on vibe-coder bench — measure before promoting to block.
 */
import { describe, it, expect } from \"vitest\"; // TODO(M3): detect test runner — vitest/jest/bun:test
// TODO(M3): detect framework — next.js / vite / astro — and template accordingly
// TODO(M3): add compile check — tsc --noEmit via execSync wrapper with byte cap (S-03 4KB pipe)
// TODO(M3): add render check — does default export mount? (React.createElement + smoke render)
// TODO(M3): add build check — next build exit 0 (or vite build / astro build)

describe(\"fence ephemeral smoke\", () => {
  it(\"project compiles (tsc --noEmit)\", async () => {
    // TODO(M3): run tsc --noEmit and assert exit 0 — byte-capped output
  });

  it(\"default export renders\", async () => {
    // TODO(M3): import default export from src entry and assert it mounts without throw
  });

  it(\"project builds\", async () => {
    // TODO(M3): run build command and assert exit 0
  });
});
`;
  return content;
}

/**
 * Ensure ephemeral suite exists if needed. Returns path if created, null otherwise.
 */
export function ensureEphemeralSuite(projectRoot: string): string | null {
  if (hasTests(projectRoot)) return null;
  const absPath = join(projectRoot, EPHEMERAL_PATH);
  if (existsSync(absPath)) return null; // TODO(M3): don't overwrite user-edited version — diff marker first
  const content = generateEphemeralSuite(projectRoot);
  mkdirSync(join(projectRoot, "tests"), { recursive: true });
  writeFileSync(absPath, content, "utf-8");
  // TODO(M3): log to events.ndjson — ephemeral suite generated
  return EPHEMERAL_PATH;
}

// ---------------------------------------------------------------------------
// Trust ladder execution
// ---------------------------------------------------------------------------

function runCompileTier(projectRoot: string, taskId: string): TierResult {
  const started = Date.now();
  if (!existsSync(join(projectRoot, "tsconfig.json"))) {
    return unknownTier(projectRoot, taskId, "compile", started,
      "no tsconfig.json — this project has nothing for the TypeScript checker to run on");
  }
  // Prefer the project's own TypeScript; never download one silently via npx.
  const localTsc = join(projectRoot, "node_modules", ".bin", "tsc");
  let command: string | null = null;
  let args: string[] = ["--noEmit"];
  if (existsSync(localTsc)) {
    command = localTsc;
  } else {
    const probe = spawnSync("tsc", ["--version"], { encoding: "utf-8", timeout: 15_000 });
    if (!probe.error && probe.status === 0) command = "tsc";
  }
  if (command === null) {
    return unknownTier(projectRoot, taskId, "compile", started,
      "TypeScript is not installed for this project (no node_modules/.bin/tsc, no tsc on PATH) — install typescript, then re-run");
  }
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf-8",
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  const label = `${command} --noEmit`;
  const err = (result as unknown as { error?: Error }).error;
  if (err) {
    return tierResult(projectRoot, taskId, "compile", "unknown", started,
      `$ ${label}\nUNKNOWN: compiler could not run: ${err.message}\n`,
      { reason: `compiler could not run: ${err.message}`, command: label });
  }
  const output = [result.stdout ?? "", result.stderr ?? ""].filter(Boolean).join("\n")
    || (result.status === 0 ? "tsc --noEmit: ok (no output)" : "");
  const status: TierStatus = result.status === 0 ? "pass" : "fail";
  return tierResult(projectRoot, taskId, "compile", status, started,
    `$ ${label}\nverdict: ${status}${result.status !== 0 && result.status !== null ? ` (exit code ${result.status})` : ""}\n${output}`,
    { command: label, ...(status === "fail" ? { reason: `exit code ${result.status}` } : {}) });
}

function runTestsTier(projectRoot: string, taskId: string, tier: "tests" | "tests-x2", hadTests: boolean): TierResult {
  const scripts = readPackageScripts(projectRoot);
  if (isRealTestScript(scripts["test"])) {
    return runScriptTier(projectRoot, taskId, tier, "test");
  }
  if (!hadTests) {
    const started = Date.now();
    return unknownTier(projectRoot, taskId, tier, started,
      "no test command configured and no test files found — nothing was run, so this check cannot pass");
  }
  // Test files exist but no script: run them with bun test, for real.
  const started = Date.now();
  const result = spawnSync("bun", ["test"], {
    cwd: projectRoot,
    encoding: "utf-8",
    timeout: TIER_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });
  const err = (result as unknown as { error?: Error & { code?: string } }).error;
  if (err) {
    const reason = err.code === "ENOENT"
      ? "bun is not available to run the test files — configure a \"test\" command in package.json instead"
      : `test runner could not run: ${err.message}`;
    return tierResult(projectRoot, taskId, tier, "unknown", started,
      `$ bun test\nUNKNOWN: ${reason}\n`, { reason, command: "bun test" });
  }
  const output = [result.stdout ?? "", result.stderr ?? ""].filter(Boolean).join("\n");
  const status: TierStatus = result.status === 0 ? "pass" : "fail";
  return tierResult(projectRoot, taskId, tier, status, started,
    `$ bun test\nverdict: ${status}${result.status !== 0 && result.status !== null ? ` (exit code ${result.status})` : ""}\n${output}`,
    { command: "bun test", ...(status === "fail" ? { reason: `exit code ${result.status}` } : {}) });
}

/**
 * Run trust ladder in order: compile → lint → tests×2 → build → generated.
 * A real failure stops the ladder (diagnosis artefact first, S-04); an unknown
 * tier does not — later checks still run so their evidence is on record.
 * overall is "pass" only when every tier ran and passed.
 */
export async function runTrustLadder(projectRoot: string, taskId: string): Promise<VerifyReport> {
  const tiers: TierResult[] = [];
  const hadTests = hasTests(projectRoot);
  const ephemeralPath = ensureEphemeralSuite(projectRoot);
  const includeGenerated = ephemeralPath !== null;

  const ladder: TrustTier[] = ["compile", "lint", "tests", "tests-x2", "build"];
  if (includeGenerated) ladder.push("generated");
  // judge-for-prose is never auto-added — caller must opt in for prose tasks only

  for (const tier of ladder) {
    let result: TierResult;
    if (tier === "compile") {
      result = runCompileTier(projectRoot, taskId);
    } else if (tier === "lint") {
      result = runScriptTier(projectRoot, taskId, "lint", "lint");
    } else if (tier === "tests" || tier === "tests-x2") {
      result = runTestsTier(projectRoot, taskId, tier, hadTests);
    } else if (tier === "build") {
      result = runScriptTier(projectRoot, taskId, "build", "build");
    } else {
      // generated: the ephemeral suite is an unconfigured template (its checks are
      // TODO stubs, C-10 unmeasured) — it must never stand in for real tests.
      const started = Date.now();
      result = unknownTier(projectRoot, taskId, "generated", started,
        `ephemeral suite at ${EPHEMERAL_PATH} is a template, not a real check (C-10) — add real tests; this tier cannot pass a project`);
    }

    tiers.push(result);
    if (result.status === "fail") break; // fail-fast — artefact already written for diagnosis
  }

  const overall: VerifyReport["overall"] = tiers.some((t) => t.status === "fail")
    ? "fail"
    : tiers.some((t) => t.status === "unknown")
      ? "unknown"
      : "pass";

  return {
    taskId,
    tiers,
    overall,
    generatedEphemeral: includeGenerated,
  };
}

/**
 * Judge-for-prose gate — LLM judge ONLY for prose/docs tasks, never for code.
 * S-12 + §6 #6 — execution > typecheck > lint > learned verifier > judge.
 * Not wired to any model yet: reports unknown, never an unearned pass.
 */
export async function judgeForProse(
  _projectRoot: string,
  _taskId: string,
  _content: string,
): Promise<TierResult> {
  return {
    tier: "judge-for-prose",
    status: "unknown",
    passed: false,
    durationMs: 0,
    outputPath: null,
    reason: "prose judge is not wired to a model yet — no judgement was made, so this cannot pass",
  };
}

// ---------------------------------------------------------------------------
// Anti-pattern guard (S-12 / §6 #14)
// ---------------------------------------------------------------------------

const SKIP_OR_ONLY_RE = /(?:describe|it|test)\.(?:skip|only)\s*\(|\bx(?:describe|it|test)\s*\(/;

/**
 * Detect test deletion/skip to green CI — block-level violation.
 * S-04/S-12 — do not delete/skip tests to green CI (deepseek H-06).
 * Flags skip/only markers added by the diff and net-removed expect() assertions.
 */
export function detectTestTampering(diff: string): { tampered: boolean; reason: string | null } {
  let addedExpect = 0;
  let removedExpect = 0;
  for (const line of diff.split("\n")) {
    const isAdded = line.startsWith("+") && !line.startsWith("+++");
    const isRemoved = line.startsWith("-") && !line.startsWith("---");
    if (isAdded) {
      if (SKIP_OR_ONLY_RE.test(line)) {
        return { tampered: true, reason: `diff adds a skipped/focused test: ${line.trim().slice(0, 120)}` };
      }
      if (line.includes("expect(")) addedExpect++;
    } else if (isRemoved) {
      if (line.includes("expect(")) removedExpect++;
    }
  }
  if (removedExpect > addedExpect) {
    return {
      tampered: true,
      reason: `diff removes ${removedExpect} expect() assertion(s) and adds only ${addedExpect} — deleting assertions to go green is blocked (S-12)`,
    };
  }
  return { tampered: false, reason: null };
}
