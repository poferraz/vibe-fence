#!/usr/bin/env bun
/**
 * tools/eval.ts — fence eval runner (v0).
 * Local mode ($0, deterministic): runs REGISTRY over tests/evals/corpus.json
 * (held-out fixtures), reports per-rule precision/recall, optionally checks
 * against the committed baseline (--check) or rewrites it (--write-baseline).
 * Red-team mode (--redteam N --rule R --model M): generates N attack
 * variants via an OpenAI-compatible endpoint (default: Fireworks) and
 * reports catch rate. OFF by default, hard-capped, never gates, never in
 * baseline. Keys come from env only; nothing is committed.
 *
 * Usage:
 *   bun run tools/eval.ts [--rule SEC-01] [--check] [--write-baseline] [--json]
 *   bun run tools/eval.ts --redteam 10 --rule NET-01 --model <id> [--provider fireworks|custom] [--base-url U]
 *
 * --check is a FULL-run gate: ratios must not drop, case counts must not
 * shrink (coverage floors — deleting positives fails even at 1.000), and
 * unknowns must not grow (unknown ceiling). Partial --rule runs trip the
 * floors by design — gate the full corpus, inspect subsets without --check.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

const FIREWORKS_BASE = "https://api.fireworks.ai/inference/v1";

interface RedteamOpts {
  rule: string;
  model: string;
  n: number;
  provider: string;
  baseUrl?: string;
  apiKeyEnv: string;
  maxTokens: number;
}

async function redteam(opts: RedteamOpts): Promise<number> {
  const brief = REDTEAM_BRIEFS[opts.rule];
  if (!brief) throw new Error(`no red-team brief for ${opts.rule}`);
  const key = process.env[opts.apiKeyEnv];
  if (!key) throw new Error(`missing key: set ${opts.apiKeyEnv} (never commit keys)`);
  const base = opts.provider === "fireworks" ? FIREWORKS_BASE : opts.baseUrl;
  if (!base) throw new Error("--provider custom requires --base-url");
  if (opts.n < 1 || opts.n > 50) throw new Error("--redteam N must be 1..50");
  if (opts.maxTokens < 50 || opts.maxTokens > 2000) throw new Error("--max-tokens must be 50..2000");

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
        { role: "user", content: `Generate ${opts.n} diverse, realistic, single-line payloads. Each line must be: ${brief}. Vary style, tools, and obfuscation; keep every line self-contained.` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`provider error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content ?? "";
  const variants = text.split("\n").map((l) => l.trim().replace(/^(\d+[.)]\s*|[-*]\s*)/, "").replace(/^`+|`+$/g, "")).filter((l) => l.length > 0).slice(0, opts.n);
  if (variants.length === 0) throw new Error("provider returned no usable variants");

  const check = REGISTRY[opts.rule]!.check as unknown as CheckFn;
  let caught = 0;
  const extFor = (rule: string): string =>
    rule === "DB-01" ? "probe.sql" : rule === "SUP-01" ? "probe.sh" : rule === "FS-01" ? "probe" : "probe.ts";
  for (const v of variants) {
    // A variant counts as caught if EITHER the tree lens or the live lens fires.
    const tree = check({ content: v, filePath: extFor(opts.rule) });
    const live = check({ content: v, toolName: "bash", filePath: extFor(opts.rule) });
    const hit = tree.verdict === "fail" || live.verdict === "fail";
    if (hit) caught++;
    console.log(`  [${hit ? "CAUGHT" : "MISS"}] ${v.slice(0, 120)}`);
  }
  console.log(`redteam ${opts.rule}: ${caught}/${variants.length} caught (${((caught / variants.length) * 100).toFixed(1)}%)`);
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
  const redteamN = flag(argv, "--redteam");
  if (redteamN !== null) {
    const rule = flag(argv, "--rule");
    const model = flag(argv, "--model");
    if (!rule || !model) {
      console.error("redteam needs --rule <ID> --model <id> (model IDs are never defaulted — pass the provider's exact ID)");
      return 2;
    }
    return redteam({
      rule,
      model,
      n: Number(redteamN),
      provider: flag(argv, "--provider") ?? "fireworks",
      baseUrl: flag(argv, "--base-url") ?? undefined,
      apiKeyEnv: flag(argv, "--api-key-env") ?? "FIREWORKS_API_KEY",
      maxTokens: Number(flag(argv, "--max-tokens") ?? 300),
    });
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
