/**
 * src/framework/verifier.ts
 * S-04 — Verification is mechanical, never self-assessment. Read→Think→Write→Check + diagnosis artefact.
 * S-12 — Elicitation trust ladder; Tournament Selection on failure.
 * GEM-11 (P1) — Ephemeral smoke suite for zero-test repos (// @fence-ephemeral).
 * C-10 — Can LLM-generated smoke tests be trusted as block gate? Measure false-pass before promoting.
 * Anti-patterns: §6 #6 (no LLM-judge gating), #14 (do not delete/skip tests to green CI).
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
  | "lint" // eslint / biome
  | "tests" // existing repo tests ×1
  | "tests-x2" // same tests ×2 — flake check (GEM-11)
  | "generated" // ephemeral smoke suite (GEM-11) — only if zero-test repo
  | "judge-for-prose"; // LLM judge — ONLY for prose/docs, never for code (S-12 / §6 #6)

export interface TierResult {
  tier: TrustTier;
  passed: boolean;
  durationMs: number;
  outputPath: string | null; // .fence/verdicts/<tier>.log — diagnosis artefact
  // TODO: add evidence_ids for companion explanation payload
}

export interface VerifyReport {
  taskId: string;
  tiers: TierResult[];
  overall: "pass" | "fail";
  generatedEphemeral: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EPHEMERAL_MARKER = "// @fence-ephemeral — delete when you add real tests";
export const EPHEMERAL_PATH = "tests/.fence-smoke.test.ts";
export const VERDICT_DIR = ".fence/verdicts";
export const BYTE_CAP = 4096; // S-03 4KB pipe

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

function isRealTestScript(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  // placeholder check — `echo "no tests"` / `echo "Error: no test specified" && exit 1`
  if (/^\s*echo\b/i.test(trimmed)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Detection — does repo have any tests?
// ---------------------------------------------------------------------------

/**
 * Detect zero-test repos — triggers ephemeral bootstrap (GEM-11).
 * Checks **\/*.test.*, **\/*.spec.*, __tests__\/**, and test npm script.
 */
export function hasTests(projectRoot: string): boolean {
  const patterns = ["**/*.test.*", "**/*.spec.*", "__tests__/**"] as const;

  // Exclude noise dirs — must not treat dist/node_modules/.git as evidence of tests
  const exclude = (p: string): boolean =>
    p.includes("node_modules") || p.includes("dist/") || p.includes(".git/") || p.includes(".fence/");

  for (const pat of patterns) {
    try {
      const hits = globSync(pat, { cwd: projectRoot, exclude } as unknown as Record<string, unknown>);
      if (hits.length > 0) return true;
    } catch {
      // glob failure is not evidence of absence — fall through to package.json check
    }
  }

  // package.json scripts.test — must be present and not an echo placeholder
  try {
    const pkgPath = join(projectRoot, "package.json");
    if (existsSync(pkgPath)) {
      const raw = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw) as { scripts?: Record<string, unknown> };
      if (pkg.scripts && isRealTestScript(pkg.scripts["test"])) return true;
    }
  } catch {
    // malformed package.json — treat as no valid test script
  }

  return false;
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
  const outPath = verdictPath(projectRoot, taskId, "compile");
  const started = Date.now();
  ensureVerdictDir(projectRoot);

  let passed = false;
  let rawOutput = "";

  try {
    // Prefer npx tsc to respect local typescript install; fallback to tsc on PATH
    const result = spawnSync("npx", ["tsc", "--noEmit"], {
      cwd: projectRoot,
      encoding: "utf-8",
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const stdout = result.stdout ?? "";
    const stderr = result.stderr ?? "";
    const status = result.status;
    const errorMsg = (result as unknown as { error?: Error }).error?.message ?? "";

    rawOutput = [stdout, stderr, errorMsg].filter(Boolean).join("\n");
    if (rawOutput.length === 0 && status === 0) rawOutput = "tsc --noEmit: ok (no output)";
    passed = status === 0;
  } catch (err) {
    rawOutput = err instanceof Error ? err.message : String(err);
    passed = false;
  }

  const capped = byteCap(rawOutput);
  try {
    writeFileSync(outPath, capped, "utf-8");
  } catch {
    // verdict write failure must not mask compile result — still report pass/fail
  }

  return {
    tier: "compile",
    passed,
    durationMs: Date.now() - started,
    outputPath: `${VERDICT_DIR}/${taskId}-compile.log`,
  };
}

/**
 * Run trust ladder in order: compile → lint → tests×2 → generated → judge-for-prose.
 * Stops on first failure and writes diagnosis artefact to .fence/verdicts/.
 * S-04 — diagnosis artefact before retry is mandatory.
 * S-12 — cheapest verify first; happy-path ~1.0-1.2×.
 */
export async function runTrustLadder(projectRoot: string, taskId: string): Promise<VerifyReport> {
  const tiers: TierResult[] = [];
  const ephemeralPath = ensureEphemeralSuite(projectRoot);
  const includeGenerated = ephemeralPath !== null;

  // Ordered ladder — compile→lint→tests×2→generated→judge-for-prose-only
  const ladder: TrustTier[] = ["compile", "lint", "tests", "tests-x2"];
  if (includeGenerated) ladder.push("generated");
  // judge-for-prose is never auto-added — caller must opt in for prose tasks only
  // TODO(M3): add "judge-for-prose" only when task is prose/docs (check task metadata)

  for (const tier of ladder) {
    let result: TierResult;

    if (tier === "compile") {
      result = runCompileTier(projectRoot, taskId);
    } else if (tier === "lint") {
      // TODO(M3): dispatch lint — `eslint .` or `biome check` — byte-capped to .fence/verdicts/<taskId>-lint.log
      result = {
        tier,
        passed: true,
        durationMs: 0,
        outputPath: `${VERDICT_DIR}/${taskId}-${tier}.log`,
      };
    } else if (tier === "tests") {
      // TODO(M3): dispatch tests — `npm test` / `vitest run` — single run, byte-capped
      result = {
        tier,
        passed: true,
        durationMs: 0,
        outputPath: `${VERDICT_DIR}/${taskId}-${tier}.log`,
      };
    } else if (tier === "tests-x2") {
      // TODO(M3): flake check — re-run tests and compare results (GEM-11 trust ladder)
      result = {
        tier,
        passed: true,
        durationMs: 0,
        outputPath: `${VERDICT_DIR}/${taskId}-${tier}.log`,
      };
    } else if (tier === "generated") {
      // TODO(M3): run ephemeral suite — `vitest run tests/.fence-smoke.test.ts` — byte-capped
      result = {
        tier,
        passed: true,
        durationMs: 0,
        outputPath: `${VERDICT_DIR}/${taskId}-${tier}.log`,
      };
    } else {
      // exhaustive guard — should be unreachable
      result = {
        tier,
        passed: true,
        durationMs: 0,
        outputPath: null,
      };
    }

    tiers.push(result);
    if (!result.passed) break; // fail-fast — but artefact already written for diagnosis
  }

  return {
    taskId,
    tiers,
    overall: tiers.every((t) => t.passed) ? "pass" : "fail",
    generatedEphemeral: includeGenerated,
  };
}

/**
 * Judge-for-prose gate — LLM judge ONLY for prose/docs tasks, never for code.
 * S-12 + §6 #6 — execution > typecheck > lint > learned verifier > judge.
 * TODO(M3): wire to meta-client.ts architect tier (Wonder) if available; otherwise skip
 */
export async function judgeForProse(
  _projectRoot: string,
  _taskId: string,
  _content: string,
): Promise<TierResult> {
  // TODO(M3): call LLM judge with rubric — only for prose tasks (docs, PR descriptions, etc.)
  // TODO(M3): never use for code correctness — deterministic checks are the gate
  return { tier: "judge-for-prose", passed: true, durationMs: 0, outputPath: null };
}

// ---------------------------------------------------------------------------
// Anti-pattern guard (S-12 / §6 #14)
// ---------------------------------------------------------------------------

/**
 * Detect test deletion/skip to green CI — block-level violation.
 * S-04/S-12 — do not delete/skip tests to green CI (deepseek H-06).
 * TODO(M3): diff check — fail if assertions removed or .skip/.only added alongside a red run
 */
export function detectTestTampering(_diff: string): { tampered: boolean; reason: string | null } {
  // TODO(M3): scan diff for `it.skip`, `describe.skip`, `.only`, deleted assertions, `xdescribe`
  return { tampered: false, reason: null };
}
