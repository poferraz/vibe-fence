#!/usr/bin/env bun
/**
 * tools/eval.ts — fence eval runner (v0).
 * Local mode ($0, deterministic): runs REGISTRY over tests/evals/corpus.json
 * (held-out fixtures), reports per-rule precision/recall, optionally checks
 * against the committed baseline (--check) or rewrites it (--write-baseline).
 * No model, API key or external service is used.
 * Usage: bun run tools/eval.ts [--rule SEC-01] [--check] [--write-baseline] [--json]
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

function setupEvalRepo(): { root: string; home: string; gitconfig: string; ready: boolean; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "vf-eval-"));
  const home = mkdtempSync(join(tmpdir(), "vf-eval-home-"));
  const gitconfig = join(home, ".gitconfig");
  const cleanup = (): void => {
    rmSync(root, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  };
  try {
    writeFileSync(gitconfig, "", "utf-8");
    const env = { ...process.env, GIT_CONFIG_GLOBAL: gitconfig, GIT_CONFIG_SYSTEM: gitconfig, HOME: home };
    execSync("git init -q -b main .", { cwd: root, env });
    execSync("git -c user.email=eval@local -c user.name=eval -c commit.gpgsign=false commit -q --allow-empty -m init", { cwd: root, env });
    return { root, home, gitconfig, ready: true, cleanup };
  } catch {
    return { root, home, gitconfig, ready: false, cleanup };
  }
}

function score(verdict: string, expected: "fail" | "pass"): "tp" | "fp" | "tn" | "fn" {
  if (expected === "fail") return verdict === "fail" ? "tp" : "fn";
  return verdict === "fail" ? "fp" : "tn";
}

export function runEval(cases: EvalCase[], opts: { rule?: string } = {}): EvalReport {
  const { root, home, gitconfig, ready, cleanup } = setupEvalRepo();
  try {
    const isolatedEnv = { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: gitconfig, GIT_CONFIG_SYSTEM: gitconfig, HOME: home };
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

/** The gate surface, as the CLI really invokes it: a write leg (SEC-01/DB-01),
 * a shell leg (SEC-02/NET-01/CMD-01/GIT-01/SUP-01/FS-01 + local-script audit),
 * and — for path/credential payloads — a read leg with a project root so the
 * FS-01 containment check engages exactly as it does for agent reads.
 * Returns every firing (any severity, warns included) so attribution stays
 * per-rule: a block by an unrelated rule is system prevention, not coverage
 * for the named rule. */
function gateFindingsFor(rule: string, payload: string, filePath: string, projectRoot: string): GateSurfaceFinding[] {
  const out: GateSurfaceFinding[] = [];
  for (const call of [
    { tool: "write", args: { filePath, content: payload }, projectRoot },
    { tool: "bash", args: { command: payload }, projectRoot },
  ] as const) {
    for (const f of evaluateToolCall(call)) out.push({ rule: f.ruleId, severity: f.severity });
  }
  if (rule === "FS-01" || rule === "SEC-02") {
    for (const f of evaluateToolCall({ tool: "read", args: { filePath: payload }, projectRoot })) {
      out.push({ rule: f.ruleId, severity: f.severity });
    }
  }
  return out;
}

/** Per-surface attribution for one scored payload. Gate findings are always
 * fired checks (any severity); tree findings keep their verdict so unknowns
 * stay distinguishable from fails per rule. */
export interface GateSurfaceFinding {
  rule: string;
  severity: string;
}

export interface TreeSurfaceFinding {
  rule: string;
  severity: string;
  verdict: "fail" | "unknown";
}

/**
 * One payload scored on both real surfaces (gate legs + tree scan).
 * Attribution vocabulary (honest by construction):
 * - `targetHit`: the NAMED rule fired (per-rule recall).
 * - `targetBlocked` / `targetWarnOnly`: severity of the NAMED rule itself.
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
  targetBlocked: boolean;
  targetWarnOnly: boolean;
  blocked: boolean;
  warnOnly: boolean;
  gateRules: string[];
  treeRules: string[];
  treeBlocks: number;
  treeWarns: number;
  gateFindings: GateSurfaceFinding[];
  treeFindings: TreeSurfaceFinding[];
  error?: string;
}

/** Score one payload for `rule` in a FRESH isolated git repo per call
 * (probe at pathFor(rule), or `relOverride` for file-gated rules like
 * SUP-01's package.json). Per-call isolation is load-bearing: earlier
 * probes at other paths used to linger and contaminate later scores. */
export function scoreVariant(rule: string, payload: string, relOverride?: string): VariantScore {
  const rel = relOverride ?? pathFor(rule);
  const tmpRoot = mkdtempSync(join(tmpdir(), "vf-score-"));
  let gateFindings: GateSurfaceFinding[] = [];
  let treeFindings: TreeSurfaceFinding[] = [];
  let treeRules: string[] = [];
  let treeBlocks = 0;
  let treeWarns = 0;
  let treeUnknowns = 0;
  let targetTreeBlocked = false;
  let error: string | undefined;
  try {
    execSync("git init -q .", { cwd: tmpRoot, stdio: "ignore" });
    gateFindings = gateFindingsFor(rule, payload, rel, tmpRoot);
    const target = join(tmpRoot, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, payload + "\n", "utf-8");
    const rep = runCheck(tmpRoot);
    const fails = rep.findings.filter((f) => f.verdict === "fail");
    treeRules = [...new Set(fails.map((f) => f.ruleId))];
    treeBlocks = fails.filter((f) => f.severity === "block").length;
    treeWarns = fails.length - treeBlocks;
    targetTreeBlocked = fails.some((f) => f.ruleId === rule && f.severity === "block");
    treeUnknowns = rep.unknowns;
    treeFindings = rep.findings.map((f) => ({ rule: f.ruleId, severity: f.severity, verdict: f.verdict }));
  } catch (err) {
    error = (err as Error).message;
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  const gateRules = [...new Set(gateFindings.map((f) => f.rule))];
  const gateBlocked = gateFindings.some((f) => f.severity === "block");
  const treeBlocked = treeBlocks > 0;
  const targetHit = gateRules.includes(rule) || treeRules.includes(rule);
  const targetBlocked = gateFindings.some((f) => f.rule === rule && f.severity === "block") || targetTreeBlocked;
  const targetWarnOnly = targetHit && !targetBlocked;
  const blocked = gateBlocked || treeBlocked;
  const caught = gateFindings.length > 0 || treeRules.length > 0;
  return {
    gateBlocked,
    treeBlocked,
    treeUnknowns,
    caught,
    targetHit,
    targetBlocked,
    targetWarnOnly,
    blocked,
    warnOnly: caught && !blocked,
    gateRules,
    treeRules,
    treeBlocks,
    treeWarns,
    gateFindings,
    treeFindings,
    ...(error ? { error } : {}),
  };
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
    let targetBlocked = 0;
    let systemBlocked = 0;
    for (const c of set.cases) {
      const s = scoreVariant(set.rule, c.payload, c.path);
      if (s.error) {
        problems++;
        console.log(`  [ERROR] ${set.rule} ${c.id}: ${s.error}`);
      } else if (!s.targetHit) {
        if (s.blocked) systemBlocked++;
        misses++;
        const via = s.caught ? ` (system catch via ${[...s.gateRules, ...s.treeRules].join(",")})` : "";
        console.log(`  [MISS] ${set.rule} ${c.id}: ${c.payload.slice(0, 100)}${via}`);
      } else {
        target++;
        if (s.blocked) systemBlocked++;
        if (s.targetBlocked) targetBlocked++;
        else console.log(`  [WARN-ONLY] ${set.rule} ${c.id}: target fired warn-grade${s.blocked ? "; another rule blocks" : ", nothing would block"}`);
      }
    }
    console.log(`bench ${set.rule}: ${target}/${set.cases.length} target-hit (${targetBlocked} target-blocked, ${target - targetBlocked} target-warn-only, ${systemBlocked} system-blocked)`);
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
  const allowed = new Set(["--rule", "--check", "--write-baseline", "--json", "--bench"]);
  for (const arg of argv.filter(value => value.startsWith("--"))) {
    if (!allowed.has(arg.split("=", 1)[0]!)) {
      console.error(`eval: offline only: unsupported option ${arg.split("=", 1)[0]}`);
      return 2;
    }
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
