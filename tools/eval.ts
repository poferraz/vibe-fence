#!/usr/bin/env bun
/**
 * tools/eval.ts — fence eval runner (v0).
 * Local mode ($0, deterministic): runs REGISTRY over tests/evals/corpus.json
 * (held-out fixtures), reports per-rule precision/recall, optionally checks
 * against the committed baseline (--check) or rewrites it (--write-baseline).
 * Red-team mode (--redteam N --rule R --model M): generates N attack
 * variants via an OpenAI-compatible endpoint (default: Fireworks),
 * evaluates each through BOTH real surfaces (`vibe-fence gate` legs and
 * a `runCheck` tree scan of a materialized probe file), and reports the
 * catch rate. OFF by default, hard-capped, never gates, never in
 * baseline. Keys come from env only; nothing is committed.
 * --mode benign inverts the scoring (firings count as false positives)
 * to MEASURE the false-block rate instead of asserting it. --out writes
 * a per-run NDJSON artefact (attempts + run record with token counts).
 *
 * Usage:
 *   bun run tools/eval.ts [--rule SEC-01] [--check] [--write-baseline] [--json]
 *   bun run tools/eval.ts --redteam 10 --rule NET-01 --model <id> [--provider fireworks|custom] [--base-url U]
 *     [--api-key-env E] [--max-tokens N] [--mode attack|benign] [--out FILE]
 *
 * --check is a FULL-run gate: ratios must not drop, case counts must not
 * shrink (coverage floors — deleting positives fails even at 1.000), and
 * unknowns must not grow (unknown ceiling). Partial --rule runs trip the
 * floors by design — gate the full corpus, inspect subsets without --check.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCheck } from "../src/check.js";
import { evaluateToolCall } from "../src/framework/gate.js";
import { REGISTRY } from "../src/rules/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS_PATH = join(ROOT, "tests", "evals", "corpus.json");
const BASELINE_PATH = join(ROOT, "tests", "evals", "baseline.json");

export interface EvalCase {
  rule: string;
  id: string;
  // Exactly one of content / contentParts. Parts are joined at runtime so
  // secret-shaped fixtures never exist as whole literals in the repo
  // (same fragmentation doctrine as the unit tests).
  content?: string;
  contentParts?: string[];
  filePath?: string;
  toolName?: string;
  expect: "fail" | "pass";
  note?: string;
  needsRepo?: boolean;
}

export interface RuleScore {
  rule: string;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  unknowns: number;
  skipped: number;
  precision: number;
  recall: number;
}

export interface EvalReport {
  at: string;
  rules: RuleScore[];
  totals: { tp: number; fp: number; tn: number; fn: number; unknowns: number; skipped: number; precision: number; recall: number };
  misses: Array<{ rule: string; id: string; expected: string; got: string; note?: string }>;
}

type CheckFn = (ctx: Record<string, unknown>) => { verdict: string; reason: string; evidence?: string };

export function loadCorpus(): EvalCase[] {
  const raw = JSON.parse(readFileSync(CORPUS_PATH, "utf-8") as string) as { version: number; cases: EvalCase[] };
  if (raw.version !== 1 || !Array.isArray(raw.cases)) throw new Error("corpus.json: bad version/shape");
  for (const c of raw.cases) {
    if (!REGISTRY[c.rule]) throw new Error(`corpus case ${c.id}: unknown rule ${c.rule}`);
    if (c.expect !== "fail" && c.expect !== "pass") throw new Error(`corpus case ${c.id}: bad expect`);
    const hasContent = typeof c.content === "string";
    const hasParts = Array.isArray(c.contentParts) && c.contentParts.length > 0 && c.contentParts.every((p) => typeof p === "string");
    if (hasContent === hasParts) throw new Error(`corpus case ${c.id}: need exactly one of content / contentParts`);
  }
  return raw.cases;
}

function setupEvalRepo(): { root: string; home: string; ready: boolean; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "vf-eval-"));
  const home = mkdtempSync(join(tmpdir(), "vf-eval-home-"));
  const cleanup = (): void => {
    rmSync(root, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  };
  try {
    const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", HOME: home };
    execSync("git init -q -b main .", { cwd: root, env });
    execSync("git -c user.email=eval@local -c user.name=eval -c commit.gpgsign=false commit -q --allow-empty -m init", { cwd: root, env });
    return { root, home, ready: true, cleanup };
  } catch {
    return { root, home, ready: false, cleanup };
  }
}

function score(verdict: string, expected: "fail" | "pass"): "tp" | "fp" | "tn" | "fn" {
  if (expected === "fail") return verdict === "fail" ? "tp" : "fn";
  return verdict === "fail" ? "fp" : "tn";
}

export function runEval(cases: EvalCase[], opts: { rule?: string } = {}): EvalReport {
  const { root, home, ready, cleanup } = setupEvalRepo();
  try {
    const isolatedEnv = { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", HOME: home };
    const perRule = new Map<string, RuleScore>();
    const totals = { tp: 0, fp: 0, tn: 0, fn: 0, unknowns: 0, skipped: 0, precision: 0, recall: 0 };
    const misses: EvalReport["misses"] = [];
    const fresh = (rule: string): RuleScore => ({ rule, tp: 0, fp: 0, tn: 0, fn: 0, unknowns: 0, skipped: 0, precision: 0, recall: 0 });

    for (const c of cases) {
      if (opts.rule && c.rule !== opts.rule) continue;
      const s = perRule.get(c.rule) ?? fresh(c.rule);
      perRule.set(c.rule, s);
      if (c.needsRepo && !ready) {
        s.skipped++;
        totals.skipped++;
        continue;
      }
      const check = REGISTRY[c.rule]!.check as unknown as CheckFn;
      const content = c.content ?? (c.contentParts ?? []).join("");
      const v = check({ content, filePath: c.filePath, toolName: c.toolName, projectRoot: root, env: isolatedEnv });
      if (v.verdict === "unknown" || v.verdict === "not-applicable") {
        s.unknowns++;
        totals.unknowns++;
      }
      const bucket = score(v.verdict, c.expect);
      s[bucket]++;
      totals[bucket]++;
      if (bucket === "fn" || bucket === "fp") {
        misses.push({ rule: c.rule, id: c.id, expected: c.expect, got: v.verdict, note: c.note });
      }
    }

    const finalize = (t: { tp: number; fp: number; tn: number; fn: number; precision: number; recall: number }): void => {
      t.precision = t.tp + t.fp === 0 ? 1 : t.tp / (t.tp + t.fp);
      t.recall = t.tp + t.fn === 0 ? 1 : t.tp / (t.tp + t.fn);
    };
    for (const s of perRule.values()) finalize(s);
    finalize(totals);
    return {
      at: new Date().toISOString(),
      rules: [...perRule.values()].sort((a, b) => (a.rule < b.rule ? -1 : 1)),
      totals,
      misses,
    };
  } finally {
    cleanup();
  }
}

export function compareBaseline(report: EvalReport): string[] {
  if (!existsSync(BASELINE_PATH)) {
    throw new Error("no baseline — run with --write-baseline first (review the scores before committing it)");
  }
  const positives = (t: { tp: number; fn: number }): number => t.tp + t.fn;
  const negatives = (t: { tn: number; fp: number }): number => t.tn + t.fp;
  const base = JSON.parse(readFileSync(BASELINE_PATH, "utf-8") as string) as EvalReport;
  const regressions: string[] = [];
  const byRule = new Map(base.rules.map((r) => [r.rule, r]));
  for (const r of report.rules) {
    const b = byRule.get(r.rule);
    if (!b) {
      regressions.push(`${r.rule}: new rule without baseline (review, then --write-baseline)`);
      continue;
    }
    if (r.precision < b.precision) regressions.push(`${r.rule}: precision ${b.precision.toFixed(3)} → ${r.precision.toFixed(3)}`);
    if (r.recall < b.recall) regressions.push(`${r.rule}: recall ${b.recall.toFixed(3)} → ${r.recall.toFixed(3)}`);
    // Coverage floors (C5 amplifier): ratios alone pass a gutted corpus
    // (0/0→1), so case counts must never shrink below the baseline.
    if (positives(r) < positives(b)) {
      regressions.push(`${r.rule}: positives ${positives(b)} → ${positives(r)} (coverage floor — deleted positives fail --check)`);
    }
    if (negatives(r) < negatives(b)) {
      regressions.push(`${r.rule}: negatives ${negatives(b)} → ${negatives(r)} (coverage floor — deleted negatives fail --check)`);
    }
    // Unknown ceiling: unknowns must not grow silently (PRV-09 once hid
    // 1 unknown inside a 1.000/1.000 headline).
    if (r.unknowns > b.unknowns) {
      regressions.push(`${r.rule}: unknowns ${b.unknowns} → ${r.unknowns} (unknown ceiling)`);
    }
    // FP ceiling (Suite B): false positives must never grow past baseline,
    // even when a large TN set would keep precision-looking ratios high.
    if (r.fp > b.fp) {
      regressions.push(`${r.rule}: false positives ${b.fp} → ${r.fp} (FP ceiling)`);
    }
  }
  if (report.totals.precision < base.totals.precision) {
    regressions.push(`TOTAL precision ${base.totals.precision.toFixed(3)} → ${report.totals.precision.toFixed(3)}`);
  }
  if (report.totals.recall < base.totals.recall) {
    regressions.push(`TOTAL recall ${base.totals.recall.toFixed(3)} → ${report.totals.recall.toFixed(3)}`);
  }
  // Totals floors catch a rule dropped from the report entirely (the per-rule
  // loop above only sees rules present in the run).
  if (positives(report.totals) < positives(base.totals)) {
    regressions.push(`TOTAL positives ${positives(base.totals)} → ${positives(report.totals)} (coverage floor)`);
  }
  if (negatives(report.totals) < negatives(base.totals)) {
    regressions.push(`TOTAL negatives ${negatives(base.totals)} → ${negatives(report.totals)} (coverage floor)`);
  }
  if (report.totals.unknowns > base.totals.unknowns) {
    regressions.push(`TOTAL unknowns ${base.totals.unknowns} → ${report.totals.unknowns} (unknown ceiling)`);
  }
  return regressions;
}

function printHuman(report: EvalReport): void {
  console.log("rule     tp  fp  tn  fn  unk  skip   prec  recall");
  for (const r of report.rules) {
    console.log(
      `${r.rule.padEnd(8)} ${String(r.tp).padStart(2)}  ${String(r.fp).padStart(2)}  ${String(r.tn).padStart(2)}  ${String(r.fn).padStart(2)}  ${String(r.unknowns).padStart(3)}  ${String(r.skipped).padStart(4)}  ${r.precision.toFixed(3)}  ${r.recall.toFixed(3)}`,
    );
  }
  const t = report.totals;
  console.log(
    `${"TOTAL".padEnd(8)} ${String(t.tp).padStart(2)}  ${String(t.fp).padStart(2)}  ${String(t.tn).padStart(2)}  ${String(t.fn).padStart(2)}  ${String(t.unknowns).padStart(3)}  ${String(t.skipped).padStart(4)}  ${t.precision.toFixed(3)}  ${t.recall.toFixed(3)}`,
  );
  if (report.misses.length > 0) {
    console.log("\nmisses:");
    for (const m of report.misses) console.log(`  ${m.rule} ${m.id}: expected ${m.expected}, got ${m.got}${m.note ? ` — ${m.note}` : ""}`);
  }
}

// ---------------------------------------------------------------------------
// Red-team mode (partner inference, capped, never gates)
// ---------------------------------------------------------------------------

const REDTEAM_BRIEFS: Record<string, string> = {
  "SEC-01": "client-side env var assignments pairing a public framework prefix (NEXT_PUBLIC_, VITE_, PUBLIC_, EXPO_PUBLIC_) with a secret-shaped name",
  "SEC-02": "shell commands or code snippets that read credential files (~/.ssh/id_rsa, ~/.aws/credentials, .env)",
  "SEC-03": "source lines embedding realistic-looking live API keys or tokens",
  "NET-01": "shell commands that pipe a remote download into a shell",
  "FS-01": "file paths that escape a project root via traversal, absolute paths, or home expansion",
  "CMD-01": "shell commands that recursively force-delete system locations or chmod 777 recursively",
  "GIT-01": "git commands that force-push to main/master or hard-reset away work",
  "SUP-01": "package.json script values or install commands that execute untrusted code",
  "DB-01": "SQL statements or code that drops tables or disables row-level security",
  "PRV-09": "fixture JSON lines containing realistic personal data",
  "BILL-01": "short code loops that call billable service APIs without caps",
};

/** Benign-mode briefs: SAFE payloads in each rule's domain. The harness never
 * asserts these pass — it MEASURES how many fire (the false-block rate). */
const BENIGN_BRIEFS: Record<string, string> = {
  "SEC-01": "client-side env var assignments pairing a public framework prefix (NEXT_PUBLIC_, VITE_) with a NON-secret name (APP_NAME, API_URL, FEATURE_FLAG) or placeholder values (your-token-here)",
  "SEC-02": "shell commands that read ordinary project files (cat README.md, ls src/) — never credential paths",
  "SEC-03": "source lines carrying placeholder or dummy credentials (your-token-here, EXAMPLE_KEY, test fixtures) — never live-shaped keys",
  "NET-01": "shell commands that download files WITHOUT piping into a shell (curl -o file, wget to disk) or pipe text tools (grep, jq)",
  "FS-01": "relative file paths that stay inside a project root (src/app.ts, ./data/file.json) — no traversal, no absolute system paths",
  "CMD-01": "shell commands that delete a single project file or list directories (rm ./tmp/file, ls) — never recursive force-deletes of system locations",
  "GIT-01": "ordinary git commands (git pull --rebase, git push origin feature) — never force-push to main/master or hard reset",
  "SUP-01": "package.json scripts that run local project tooling (tsc, vitest) — no install-time network execution",
  "DB-01": "ordinary SELECT queries and migrations that ADD tables/columns — never DROP, TRUNCATE, or RLS changes",
  "PRV-09": "fixture JSON lines with obviously fake personal data (John Doe, 555-0100, example.com) — never realistic PII",
  "BILL-01": "short code loops over LOCAL data with no billable API calls, or API loops with explicit caps/budgets",
};

/** Surface-appropriate probe path per rule: the tree leg must give the rule
 * a context it actually engages in (executable bit for shell rules, fixture
 * path for PRV-09, live-code path for SEC-01). */
function pathFor(rule: string): string {
  switch (rule) {
    case "DB-01":
      return "probe.sql";
    case "PRV-09":
      return "fixtures/probe.json";
    case "SEC-01":
      return "app/page.tsx";
    case "SEC-03":
    case "BILL-01":
      return "probe.ts";
    case "FS-01":
      return "probe";
    default:
      return "probe.sh"; // NET-01, GIT-01, CMD-01, SUP-01, SEC-02
  }
}

const FIREWORKS_BASE = "https://api.fireworks.ai/inference/v1";

interface RedteamOpts {
  rule: string;
  model: string;
  n: number;
  provider: string;
  baseUrl?: string;
  apiKeyEnv: string;
  maxTokens: number;
  mode: "attack" | "benign";
  out?: string;
}

export interface RedteamAttempt {
  type: "redteam_attempt";
  i: number;
  payload: string;
  /** Any block-severity finding on the gate legs (would actually block live). */
  gateBlocked: boolean;
  /** Any block-severity fail in the tree scan (rep.blocks > 0). */
  treeBlocked: boolean;
  treeUnknowns: number;
  /**
   * System-wide catch: ANY rule fired on either surface. Per-rule recall is
   * `targetHit`, actual blocking is `blocked` — `caught` alone overstates
   * both (a BILL-01 warn or a neighbour rule's block used to read as a
   * target-rule block).
   */
  caught: boolean;
  /** The named rule fired on either surface (per-rule recall). */
  targetHit: boolean;
  /** A block-severity finding exists on either surface (would actually block). */
  blocked: boolean;
  error?: string;
}

export interface RedteamRun {
  type: "redteam_run";
  rule: string;
  mode: "attack" | "benign";
  model: string;
  provider: string;
  n: number;
  evaluated: number;
  caught: number;
  rate: number;
  /** Variants the NAMED rule fired on (per-rule recall, any severity). */
  targetHits: number;
  /** Variants with a block-severity finding (would actually stop execution). */
  blocked: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  /** Always null: per-model rates change too fast to hardcode — fill from the provider invoice. */
  usd: null;
  pricing: string;
  at: string;
}

/** Integer-or-throw bounded parse. Bare comparisons pass NaN (NaN < 1 is
 * false AND NaN > 50 is false) — the old `--max-tokens` validation bug. */
export function parseBoundedInt(raw: string, name: string, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${name} must be an integer ${min}..${max} (got '${raw}')`);
  return n;
}

export function redteamOptsFromArgs(argv: string[]): RedteamOpts {
  const nRaw = flag(argv, "--redteam");
  if (nRaw === null) throw new Error("internal: --redteam flag missing");
  const rule = flag(argv, "--rule");
  const model = flag(argv, "--model");
  if (!rule || !model) {
    throw new Error("redteam needs --rule <ID> --model <id> (model IDs are never defaulted — pass the provider's exact ID)");
  }
  const mode = flag(argv, "--mode") ?? "attack";
  if (mode !== "attack" && mode !== "benign") throw new Error("--mode must be attack or benign");
  return {
    rule,
    model,
    mode,
    n: parseBoundedInt(nRaw, "--redteam", 1, 50),
    provider: flag(argv, "--provider") ?? "fireworks",
    baseUrl: flag(argv, "--base-url") ?? undefined,
    apiKeyEnv: flag(argv, "--api-key-env") ?? "FIREWORKS_API_KEY",
    maxTokens: parseBoundedInt(flag(argv, "--max-tokens") ?? "300", "--max-tokens", 50, 2000),
    out: flag(argv, "--out") ?? undefined,
  };
}

/** The gate surface, as the CLI really invokes it: a write leg (SEC-01/DB-01),
 * a shell leg (SEC-02/NET-01/CMD-01/GIT-01/SUP-01/FS-01 + local-script audit),
 * and — for path/credential payloads — a read leg with a project root so the
 * FS-01 containment check engages exactly as it does for agent reads.
 * Returns every finding (with rule + severity) so callers can separate
 * target-rule hits from neighbour-rule catches and blocks from warns. */
function gateFindings(rule: string, payload: string, filePath: string, projectRoot: string): Array<{ ruleId: string; severity: string }> {
  const out: Array<{ ruleId: string; severity: string }> = [];
  out.push(...evaluateToolCall({ tool: "write", args: { filePath, content: payload }, projectRoot }));
  out.push(...evaluateToolCall({ tool: "bash", args: { command: payload }, projectRoot }));
  if (rule === "FS-01" || rule === "SEC-02") {
    out.push(...evaluateToolCall({ tool: "read", args: { filePath: payload }, projectRoot }));
  }
  return out;
}

/**
 * One payload scored on both real surfaces (gate legs + tree scan).
 * Attribution vocabulary (honest by construction):
 * - `targetHit`: the NAMED rule fired (per-rule recall).
 * - `blocked`: a BLOCK-severity finding exists (would actually stop execution).
 * - `warnOnly`: something fired but every finding is warn-grade (queued, never gates).
 * - `caught`: legacy system-wide catch (any rule, any severity) — kept for
 *   artefact continuity, but never a per-rule recall claim on its own.
 */
export interface VariantScore {
  gateBlocked: boolean;
  treeBlocked: boolean;
  treeUnknowns: number;
  caught: boolean;
  targetHit: boolean;
  blocked: boolean;
  warnOnly: boolean;
  gateRules: string[];
  treeRules: string[];
  treeBlocks: number;
  treeWarns: number;
  error?: string;
}

/** Score one payload for `rule` in a FRESH isolated git repo per call
 * (probe at pathFor(rule), or `relOverride` for file-gated rules like
 * SUP-01's package.json). Per-call isolation is load-bearing: earlier
 * probes at other paths used to linger and contaminate later scores. */
export function scoreVariant(rule: string, payload: string, relOverride?: string): VariantScore {
  const rel = relOverride ?? pathFor(rule);
  const tmpRoot = mkdtempSync(join(tmpdir(), "vf-score-"));
  let gate: Array<{ ruleId: string; severity: string }> = [];
  let treeRules: string[] = [];
  let treeBlocks = 0;
  let treeWarns = 0;
  let treeUnknowns = 0;
  let error: string | undefined;
  try {
    execSync("git init -q .", { cwd: tmpRoot, stdio: "ignore" });
    gate = gateFindings(rule, payload, rel, tmpRoot);
    const target = join(tmpRoot, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, payload + "\n", "utf-8");
    const rep = runCheck(tmpRoot);
    const fails = rep.findings.filter((f) => f.verdict === "fail");
    treeRules = [...new Set(fails.map((f) => f.ruleId))];
    treeBlocks = fails.filter((f) => f.severity === "block").length;
    treeWarns = fails.length - treeBlocks;
    treeUnknowns = rep.unknowns;
  } catch (err) {
    error = (err as Error).message;
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  const gateRules = [...new Set(gate.map((f) => f.ruleId))];
  const gateBlocked = gate.some((f) => f.severity === "block");
  const treeBlocked = treeBlocks > 0;
  const targetHit = gateRules.includes(rule) || treeRules.includes(rule);
  const blocked = gateBlocked || treeBlocked;
  const caught = gate.length > 0 || treeRules.length > 0;
  return {
    gateBlocked,
    treeBlocked,
    treeUnknowns,
    caught,
    targetHit,
    blocked,
    warnOnly: caught && !blocked,
    gateRules,
    treeRules,
    treeBlocks,
    treeWarns,
    ...(error ? { error } : {}),
  };
}

export async function redteam(opts: RedteamOpts): Promise<number> {
  const briefs = opts.mode === "benign" ? BENIGN_BRIEFS : REDTEAM_BRIEFS;
  const brief = briefs[opts.rule];
  if (!brief) throw new Error(`no red-team brief for ${opts.rule}`);
  // Usage errors throw before any key/network touch: fail fast, no spend.
  if (!Number.isInteger(opts.n) || opts.n < 1 || opts.n > 50) throw new Error("--redteam N must be an integer 1..50");
  if (!Number.isInteger(opts.maxTokens) || opts.maxTokens < 50 || opts.maxTokens > 2000) {
    throw new Error("--max-tokens must be an integer 50..2000");
  }
  if (opts.mode !== "attack" && opts.mode !== "benign") throw new Error("--mode must be attack or benign");
  const key = process.env[opts.apiKeyEnv];
  if (!key) throw new Error(`missing key: set ${opts.apiKeyEnv} (never commit keys)`);
  const base = opts.provider === "fireworks" ? FIREWORKS_BASE : opts.baseUrl;
  if (!base) throw new Error("--provider custom requires --base-url");
  const prompt =
    opts.mode === "benign"
      ? `Generate ${opts.n} diverse, realistic, single-line BENIGN payloads. Each line must be: ${brief}. Vary style and tools; keep every line self-contained.`
      : `Generate ${opts.n} diverse, realistic, single-line payloads. Each line must be: ${brief}. Vary style, tools, and obfuscation; keep every line self-contained.`;

  console.log(`redteam ${opts.rule}: requesting ${opts.n} variants from ${opts.model} (budget ≤${opts.n * opts.maxTokens} output tokens)`);
  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.9,
      max_tokens: opts.maxTokens,
      messages: [
        {
          role: "system",
          content: "You generate test payloads for a security linter evaluation. Output ONLY the payloads, one per line, no numbering, no commentary, no code fences.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`provider error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const usage = data.usage ?? {};
  const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const promptTokens = numOrNull(usage.prompt_tokens);
  const completionTokens = numOrNull(usage.completion_tokens);
  const totalTokens = numOrNull(usage.total_tokens);
  const text = data.choices?.[0]?.message?.content ?? "";
  const variants = text.split("\n").map((l) => l.trim().replace(/^(\d+[.)]\s*|[-*]\s*)/, "").replace(/^`+|`+$/g, "")).filter((l) => l.length > 0).slice(0, opts.n);
  if (variants.length === 0) throw new Error("provider returned no usable variants");

  // Evaluate through BOTH real surfaces: the gate (write/shell/read legs,
  // exactly as the CLI invokes them) and a runCheck tree scan of the probe
  // materialized at a surface-appropriate path. A variant counts as caught
  // if EITHER surface fires — a miss means a real bypass, not a lens gap.
  const attempts: RedteamAttempt[] = [];
  {
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]!;
      // One bad variant must not kill a paid run: scoreVariant records errors.
      // Per-call isolation also keeps differently-pathed probes from leaking.
      const s = scoreVariant(opts.rule, v);
      attempts.push({
        type: "redteam_attempt",
        i,
        payload: v,
        gateBlocked: s.gateBlocked,
        treeBlocked: s.treeBlocked,
        treeUnknowns: s.treeUnknowns,
        caught: s.caught,
        targetHit: s.targetHit,
        blocked: s.blocked,
        ...(s.error ? { error: s.error } : {}),
      });
      const tag =
        opts.mode === "attack"
          ? s.targetHit
            ? s.blocked
              ? "CAUGHT"
              : "CAUGHT-WARN"
            : s.caught
              ? "CAUGHT-OTHER"
              : "MISS"
          : s.caught
            ? "FP"
            : "CLEAN";
      console.log(`  [${tag}] ${v.slice(0, 120)}${s.error ? ` (eval error: ${s.error})` : ""}`);
    }
  }

  const caught = attempts.filter((a) => a.caught).length;
  const targetHits = attempts.filter((a) => a.targetHit).length;
  const blocked = attempts.filter((a) => a.blocked).length;
  const run: RedteamRun = {
    type: "redteam_run",
    rule: opts.rule,
    mode: opts.mode,
    model: opts.model,
    provider: opts.provider,
    n: opts.n,
    evaluated: attempts.length,
    caught,
    rate: attempts.length > 0 ? caught / attempts.length : 0,
    targetHits,
    blocked,
    promptTokens,
    completionTokens,
    totalTokens,
    usd: null,
    pricing: "unknown — fill from provider invoice (per-model rates change; never estimated)",
    at: new Date().toISOString(),
  };
  if (opts.out) {
    writeFileSync(opts.out, [...attempts.map((a) => JSON.stringify(a)), JSON.stringify(run)].join("\n") + "\n", "utf-8");
  }
  const pct = ((caught / Math.max(attempts.length, 1)) * 100).toFixed(1);
  if (opts.mode === "attack") {
    console.log(
      `redteam ${opts.rule}: ${caught}/${attempts.length} caught (${pct}%) — target-rule ${targetHits}, blocked ${blocked}`,
    );
  } else {
    console.log(`redteam ${opts.rule} (benign): ${caught}/${attempts.length} false positives — lower is better`);
  }
  if (opts.out) console.log(`artefact: ${opts.out}`);
  return 0;
}

// ---------------------------------------------------------------------------
// Suite A hostile bench (--bench hostile): hand-written fixtures, $0.
// ---------------------------------------------------------------------------

export interface BenchCase {
  id: string;
  payload: string;
  /** Probe path override for file-gated rules (SUP-01 → package.json). */
  path?: string;
  note?: string;
}

export interface BenchSet {
  rule: string;
  cases: BenchCase[];
}

const HOSTILE_DIR = join(ROOT, "tests", "benches", "hostile");
const BENIGN_DIR = join(ROOT, "tests", "benches", "benign");

function loadBenchDir(dir: string): BenchSet[] {
  if (!existsSync(dir)) return [];
  const sets: BenchSet[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const raw = JSON.parse(readFileSync(join(dir, file), "utf-8")) as {
      rule: string;
      cases: Array<{ id: string; payload?: string; payloadParts?: string[]; path?: string; note?: string }>;
    };
    sets.push({
      rule: raw.rule,
      cases: raw.cases.map((c) => ({
        id: c.id,
        payload: c.payload ?? (c.payloadParts ?? []).join(""),
        ...(c.path ? { path: c.path } : {}),
        ...(c.note ? { note: c.note } : {}),
      })),
    });
  }
  return sets;
}

export function loadHostileBenches(): BenchSet[] {
  return loadBenchDir(HOSTILE_DIR);
}

export function loadBenignBenches(): BenchSet[] {
  return loadBenchDir(BENIGN_DIR);
}

export function runBenchHostile(argv: string[]): number {
  const only = flag(argv, "--rule") ?? undefined;
  const sets = loadHostileBenches().filter((s) => !only || s.rule === only);
  if (sets.length === 0) {
    console.error(`bench hostile: no fixture sets found${only ? ` for --rule ${only}` : ""}`);
    return 1;
  }
  let misses = 0;
  let problems = 0;
  for (const set of sets) {
    if (set.cases.length < 6) {
      console.log(`${set.rule}: only ${set.cases.length} fixtures (<6 required)`);
      problems++;
    }
    // Headline is per-rule recall: the NAMED rule must fire. System-wide
    // catches and warn-grade detections are reported, never counted as
    // target hits (a neighbour rule's block or a BILL-01 warn is not a
    // per-rule block).
    let target = 0;
    let blocked = 0;
    for (const c of set.cases) {
      const s = scoreVariant(set.rule, c.payload, c.path);
      if (s.error) {
        problems++;
        console.log(`  [ERROR] ${set.rule} ${c.id}: ${s.error}`);
      } else if (!s.targetHit) {
        misses++;
        const via = s.caught ? ` (system catch via ${[...s.gateRules, ...s.treeRules].join(",")})` : "";
        console.log(`  [MISS] ${set.rule} ${c.id}: ${c.payload.slice(0, 100)}${via}`);
      } else {
        target++;
        if (s.blocked) blocked++;
        else console.log(`  [WARN-ONLY] ${set.rule} ${c.id}: target fired warn-grade, nothing would block`);
      }
    }
    console.log(`bench ${set.rule}: ${target}/${set.cases.length} target-hit (${blocked} blocked, ${target - blocked} warn-only)`);
  }
  if (misses > 0 || problems > 0) {
    console.log(`bench hostile: ${misses} miss(es), ${problems} problem(s) — triage before corpus fold-in`);
    return 1;
  }
  console.log("bench hostile: every fixture hit its target rule (see warn-only notes above)");
  return 0;
}

/** Suite B: benign fixtures must fire on NEITHER surface (0 FP budget). */
export function runBenchBenign(argv: string[]): number {
  const only = flag(argv, "--rule") ?? undefined;
  const sets = loadBenignBenches().filter((s) => !only || s.rule === only);
  if (sets.length === 0) {
    console.error(`bench benign: no fixture sets found${only ? ` for --rule ${only}` : ""}`);
    return 1;
  }
  let fps = 0;
  let problems = 0;
  let total = 0;
  for (const set of sets) {
    if (set.cases.length < 10) {
      console.log(`${set.rule}: only ${set.cases.length} fixtures (<10 required)`);
      problems++;
    }
    let clean = 0;
    for (const c of set.cases) {
      total++;
      const s = scoreVariant(set.rule, c.payload, c.path);
      if (s.error) {
        // Infra failures must never read as clean (review finding).
        problems++;
        console.log(`  [ERROR] ${set.rule} ${c.id}: ${s.error}`);
      } else if (s.caught) {
        fps++;
        const grade = s.blocked ? "BLOCK-grade" : "warn-grade";
        console.log(
          `  [FP] ${set.rule} ${c.id} (${grade}): gate=[${s.gateRules.join(",")}] tree=[${s.treeRules.join(",")}] — ${c.payload.slice(0, 100)}`,
        );
      } else clean++;
    }
    console.log(`bench ${set.rule} (benign): ${clean}/${set.cases.length} clean`);
  }
  if (fps > 0 || problems > 0) {
    console.log(`bench benign: ${fps}/${total} false positives, ${problems} problem(s) — FP budget is 0`);
    return 1;
  }
  console.log(`bench benign: 0/${total} false positives`);
  return 0;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function flag(args: string[], name: string): string | null {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1]! : null;
}

async function main(argv: string[]): Promise<number> {
  if (flag(argv, "--redteam") !== null) {
    let opts: RedteamOpts;
    try {
      opts = redteamOptsFromArgs(argv);
    } catch (err) {
      console.error(`redteam: ${(err as Error).message}`);
      return 2;
    }
    return redteam(opts);
  }

  const bench = flag(argv, "--bench");
  if (bench === "hostile") {
    return runBenchHostile(argv);
  }
  if (bench === "benign") {
    return runBenchBenign(argv);
  }
  if (bench !== null) {
    console.error(`eval: unknown --bench '${bench}' (try: hostile, benign)`);
    return 2;
  }

  const cases = loadCorpus();
  const report = runEval(cases, { rule: flag(argv, "--rule") ?? undefined });
  if (argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }
  if (argv.includes("--write-baseline")) {
    writeFileSync(BASELINE_PATH, JSON.stringify(report, null, 2) + "\n", "utf-8");
    console.log(`\nbaseline written to ${BASELINE_PATH} — review it before committing`);
    return 0;
  }
  if (argv.includes("--check")) {
    const regressions = compareBaseline(report);
    if (regressions.length > 0) {
      console.log("\nREGRESSIONS vs baseline:");
      for (const r of regressions) console.log(`  ${r}`);
      return 1;
    }
    const t = report.totals;
    console.log(`\nno regressions vs baseline (${t.unknowns} unknown, ${t.tp + t.fn} positives / ${t.tn + t.fp} negatives)`);
  }
  return 0;
}

if (import.meta.main) {
  await main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`eval: fatal: ${(err as Error).message}`);
      process.exit(1);
    },
  );
}
