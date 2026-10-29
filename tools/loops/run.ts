#!/usr/bin/env bun
/**
 * tools/loops/run.ts — eval loop driver (plan 2026-10-27, units 5-6).
 * Fixture mode by default ($0): hostile/benign/scenario suites in-process.
 * Live mode (Baseten/Modal/Fireworks) runs redteam matrices as capped
 * child invocations of tools/eval.ts — caps are enforced BEFORE any
 * network touch (plan errors exit 2), artefacts flush per rule to
 * tools/out/ (gitignored), refusals are counted and reported honestly.
 *
 * Usage:
 *   bun run tools/loops/run.ts [--dry-run]
 *   bun run tools/loops/run.ts --suites hostile,benign,scenario
 *   bun run tools/loops/run.ts --providers baseten,modal --cap-calls 22 --cap-tokens 264000
 *
 * Keys come from env only (.env via bun auto-load). Modal's Bearer is the
 * composed `<id>.<secret>` (MODAL_PROXY_TOKEN_ID/SECRET), built in-process
 * and never printed. Fireworks needs FIREWORKS_API_KEY + FIREWORKS_MODEL.
 */
import { execFileSync, execSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runBenchBenign, runBenchHostile } from "../eval.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT_DIR = join(ROOT, "tools", "out");

export const ALL_RULES = [
  "SEC-01", "SEC-02", "SEC-03", "NET-01", "FS-01", "CMD-01",
  "GIT-01", "SUP-01", "DB-01", "PRV-09", "BILL-01",
] as const;

export type ProviderId = "fixture" | "baseten" | "modal" | "fireworks";
export type SuiteId = "hostile" | "benign" | "scenario";

export interface LoopOpts {
  suites: SuiteId[];
  providers: ProviderId[];
  rules: string[];
  modes: Array<"attack" | "benign">;
  n: number;
  maxTokens: number;
  capCalls?: number;
  capTokens?: number;
  capUsd?: number;
  dryRun: boolean;
}

interface Profile {
  model?: string;
  baseUrl?: string;
  apiKeyEnv?: string;
  /** USD per 1M completion tokens; null = unenforceable (rates unknown). */
  completionRatePerMTok: number | null;
}

export const PROFILES: Record<Exclude<ProviderId, "fixture">, Profile> = {
  baseten: {
    model: "meta-models/muse-spark-open-1026",
    baseUrl: "https://inference.baseten.co/v1",
    apiKeyEnv: "BASETEN_API_KEY",
    completionRatePerMTok: null,
  },
  modal: {
    model: "meta-models/Muse-Spark-Open-816B-A42B",
    baseUrl: "https://poferraz13--ep-vibe-fence-server.us-west.modal.direct/v1",
    apiKeyEnv: "MODAL_REDTEAM_KEY", // composed <id>.<secret> in-process
    completionRatePerMTok: 4.25,
  },
  fireworks: {
    model: undefined, // FIREWORKS_MODEL env (never defaulted)
    apiKeyEnv: "FIREWORKS_API_KEY",
    completionRatePerMTok: null,
  },
};

function flag(args: string[], name: string): string | null {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1]! : null;
}

function csv<T extends string>(raw: string | null, allowed: readonly T[], what: string): T[] {
  if (raw === null) return [...allowed.slice(0, 1)] as T[];
  const out = raw.split(",").map((s) => s.trim()).filter(Boolean) as T[];
  for (const v of out) {
    if (!allowed.includes(v)) throw new Error(`unknown ${what} '${v}' (allowed: ${allowed.join(", ")})`);
  }
  return out;
}

export function parseLoopArgs(argv: string[]): LoopOpts {
  const suites = csv<SuiteId>(flag(argv, "--suites"), ["hostile", "benign", "scenario"], "suite");
  if (flag(argv, "--suites") === null) suites.push("benign", "scenario");
  const providers = csv<ProviderId>(flag(argv, "--providers"), ["fixture", "baseten", "modal", "fireworks"], "provider");
  const rulesRaw = flag(argv, "--rules");
  const rules = rulesRaw ? rulesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [...ALL_RULES];
  for (const r of rules) {
    if (!(ALL_RULES as readonly string[]).includes(r)) throw new Error(`unknown rule '${r}'`);
  }
  const modesRaw = flag(argv, "--modes");
  const modes = (modesRaw ? modesRaw.split(",").map((s) => s.trim()) : ["attack", "benign"]) as LoopOpts["modes"];
  for (const m of modes) {
    if (m !== "attack" && m !== "benign") throw new Error(`unknown mode '${m}'`);
  }
  const int = (name: string, dflt: number): number => {
    const raw = flag(argv, name);
    if (raw === null) return dflt;
    const v = Number(raw);
    if (!Number.isInteger(v) || v < 1) throw new Error(`${name} must be a positive integer`);
    return v;
  };
  const capCalls = flag(argv, "--cap-calls") === null ? undefined : int("--cap-calls", 0);
  const capTokens = flag(argv, "--cap-tokens") === null ? undefined : int("--cap-tokens", 0);
  const capUsdRaw = flag(argv, "--cap-usd");
  if (capUsdRaw !== null && (!Number.isFinite(Number(capUsdRaw)) || Number(capUsdRaw) < 0)) {
    throw new Error("--cap-usd must be a finite number >= 0");
  }
  return {
    suites,
    providers,
    rules,
    modes,
    n: int("--n", 6),
    maxTokens: int("--max-tokens", 2000),
    ...(capCalls === undefined ? {} : { capCalls }),
    ...(capTokens === undefined ? {} : { capTokens }),
    ...(capUsdRaw === null ? {} : { capUsd: Number(capUsdRaw) }),
    dryRun: argv.includes("--dry-run"),
  };
}

export interface LoopPlan {
  apiCalls: number;
  worstTokens: number;
  /** Worst-case completion-only USD where rates are known; null if any selected live provider lacks rates. */
  worstUsd: number | null;
  error?: string;
}

export interface LoopPlanInput {
  providers: ProviderId[];
  rules: readonly string[];
  modes: readonly ("attack" | "benign")[];
  n: number;
  maxTokens: number;
  capCalls?: number;
  capTokens?: number;
  capUsd?: number;
}

/** Live loops must name their spend ceiling up front (review finding):
 * uncapped live runs and unenforceable dollar caps refuse pre-network. */
export function liveCapsError(opts: LoopPlanInput): string | undefined {
  const live = opts.providers.filter((p): p is Exclude<ProviderId, "fixture"> => p !== "fixture");
  if (live.length === 0) return undefined;
  const missing: string[] = [];
  if (opts.capCalls === undefined) missing.push("--cap-calls");
  if (opts.capTokens === undefined) missing.push("--cap-tokens");
  if (missing.length > 0) {
    return `live providers [${live.join(",")}] require explicit ${missing.join(" and ")} (refusing uncapped spend before any network touch)`;
  }
  if (opts.capUsd !== undefined) {
    const unpriced = live.filter((p) => PROFILES[p].completionRatePerMTok === null);
    if (unpriced.length > 0) {
      return `--cap-usd is unenforceable for: ${unpriced.join(", ")} (rates unknown) — drop the flag or drop the provider`;
    }
  }
  return undefined;
}

export function loopPlan(opts: LoopPlanInput): LoopPlan {
  const live = opts.providers.filter((p): p is Exclude<ProviderId, "fixture"> => p !== "fixture");
  const apiCalls = live.length * opts.rules.length * opts.modes.length;
  const worstTokens = apiCalls * opts.n * opts.maxTokens;
  let worstUsd: number | null = 0;
  for (const p of live) {
    const rate = PROFILES[p].completionRatePerMTok;
    if (rate === null) {
      worstUsd = null;
      break;
    }
    worstUsd = (worstUsd ?? 0) + opts.rules.length * opts.modes.length * opts.n * opts.maxTokens * (rate / 1_000_000);
  }
  if (live.length === 0) worstUsd = 0;
  const errors: string[] = [];
  const capsError = liveCapsError(opts);
  if (capsError) errors.push(capsError);
  if (opts.capCalls !== undefined && apiCalls > opts.capCalls) {
    errors.push(`plan needs ${apiCalls} API calls > --cap-calls ${opts.capCalls} (refusing before any network touch)`);
  }
  if (opts.capTokens !== undefined && worstTokens > opts.capTokens) {
    errors.push(`plan worst-case ${worstTokens} output tokens > --cap-tokens ${opts.capTokens} (refusing before any network touch)`);
  }
  if (opts.capUsd !== undefined && worstUsd !== null && worstUsd > opts.capUsd) {
    errors.push(`plan worst-case $${worstUsd.toFixed(2)} > --cap-usd ${opts.capUsd} (refusing before any network touch)`);
  }
  return { apiCalls, worstTokens, worstUsd, ...(errors.length ? { error: errors.join("; ") } : {}) };
}

/** Hard + soft refusal shapes (labeled heuristic — providers phrase
 * defensive pivots many ways; tune against real artefacts, never hide). */
export const REFUSAL_RES: RegExp[] = [
  /^I (can't|can’t|understand|can help)/i,
  /^If (you|you're|you’d)/i,
  /^For security/i,
  /^Describing /i,
  /^How to /i,
  /^Let me know/i,
  /^Would you like/i,
  /^\*\*(Detection|Safe|Safer|Defensive|Mitigation)/,
  /^(Helping|Guidance|Safe,|Common patterns|Best practices|Reviewing|Explaining|Creating benign)/i,
];

export function countRefusals(payloads: string[]): number {
  return payloads.filter((p) => REFUSAL_RES.some((re) => re.test(p))).length;
}

/** Split a payload so no whole secret literal survives in any part.
 * Drafts are for human triage — re-fragment before committing. */
export function fragmentPayload(payload: string): string[] {
  if (payload.length < 24) return [payload];
  const third = Math.ceil(payload.length / 3);
  return [payload.slice(0, third), payload.slice(third, third * 2), payload.slice(third * 2)];
}

interface FoldAttempt {
  type: string;
  payload?: string;
  caught?: boolean;
  targetHit?: boolean;
}

/** Unit 7: draft corpus cases from an artefact (print-only, never writes
 * the corpus). Attack rows the TARGET rule missed → fail-expect drafts
 * (a system catch by a neighbour rule still means the target has a gap);
 * benign rows anything fired on → pass-expect drafts. Everything needs
 * human triage + re-fragmentation review. */
export function foldDrafts(ndjson: string): Array<Record<string, unknown>> {
  const rows = ndjson.split("\n").filter(Boolean).map((l) => JSON.parse(l) as FoldAttempt & { type: string; rule?: string; mode?: string });
  const run = rows.find((r) => r.type === "redteam_run");
  if (!run?.rule) return [];
  const mode = run.mode ?? "attack";
  const drafts: Array<Record<string, unknown>> = [];
  let n = 0;
  for (const r of rows) {
    if (r.type !== "redteam_attempt" || !r.payload) continue;
    // Older artefacts predate targetHit: fall back to system-wide caught.
    const missedTarget = r.targetHit === undefined ? r.caught === false : r.targetHit === false;
    const interesting = mode === "attack" ? missedTarget : r.caught === true;
    if (!interesting) continue;
    n++;
    drafts.push({
      rule: run.rule,
      id: `DRAFT-${n}`,
      contentParts: fragmentPayload(r.payload),
      expect: mode === "attack" ? "fail" : "pass",
      note: `DRAFT from ${mode} artefact — TRIAGE REQUIRED (true gap vs intended pass; re-fragment before commit)`,
    });
  }
  return drafts;
}

function providerReady(p: Exclude<ProviderId, "fixture">): { ready: boolean; note: string; env: Record<string, string> } {
  if (p === "modal") {
    const id = process.env["MODAL_PROXY_TOKEN_ID"];
    const secret = process.env["MODAL_PROXY_TOKEN_SECRET"];
    if (!id || !secret) return { ready: false, note: "MODAL_PROXY_TOKEN_ID/SECRET unset", env: {} };
    return { ready: true, note: "composed bearer (never printed)", env: { MODAL_REDTEAM_KEY: `${id}.${secret}` } };
  }
  if (p === "fireworks") {
    if (!process.env["FIREWORKS_API_KEY"]) return { ready: false, note: "FIREWORKS_API_KEY unset", env: {} };
    if (!process.env["FIREWORKS_MODEL"]) return { ready: false, note: "FIREWORKS_MODEL unset (model IDs are never defaulted)", env: {} };
    return { ready: true, note: "env key + model", env: {} };
  }
  const keyEnv = PROFILES[p].apiKeyEnv!;
  if (!process.env[keyEnv]) return { ready: false, note: `${keyEnv} unset`, env: {} };
  return { ready: true, note: "env key", env: {} };
}

function runFixtureSuites(opts: LoopOpts): number {
  let rc = 0;
  if (opts.suites.includes("hostile")) rc = runBenchHostile([]) || rc;
  if (opts.suites.includes("benign")) rc = runBenchBenign([]) || rc;
  if (opts.suites.includes("scenario")) {
    try {
      execSync("bun test tests/benches/scenario.test.ts", { cwd: ROOT, stdio: "inherit" });
    } catch {
      rc = 1;
    }
  }
  return rc;
}

function runLiveProvider(p: Exclude<ProviderId, "fixture">, opts: LoopOpts, summaryPath: string): number {
  const profile = PROFILES[p];
  const { ready, note, env } = providerReady(p);
  if (!ready) {
    console.log(`loops ${p}: not configured (${note}) — skipped`);
    return 0;
  }
  const model = p === "fireworks" ? process.env["FIREWORKS_MODEL"]! : profile.model!;
  let failures = 0;
  for (const rule of opts.rules) {
    for (const mode of opts.modes) {
      const date = new Date().toISOString().slice(0, 10);
      const out = join(OUT_DIR, `${date}-${p}-${rule}-${mode}.ndjson`);
      const args = [
        "run", "tools/eval.ts", "--redteam", String(opts.n), "--rule", rule,
        "--model", model, "--max-tokens", String(opts.maxTokens),
        "--mode", mode, "--out", out,
      ];
      if (p === "fireworks") args.push("--provider", "fireworks");
      else args.push("--provider", "custom", "--base-url", profile.baseUrl!, "--api-key-env", profile.apiKeyEnv!);
      let rc = 0;
      try {
        execFileSync("bun", args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: "inherit" });
      } catch {
        rc = 1;
        failures++;
      }
      let refused: number | null = null;
      let total: number | null = null;
      if (existsSync(out)) {
        const attempts = readFileSync(out, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { type: string; payload?: string });
        const payloads = attempts.filter((a) => a.type === "redteam_attempt").map((a) => a.payload ?? "");
        total = payloads.length;
        refused = countRefusals(payloads);
      }
      appendFileSync(summaryPath, JSON.stringify({ provider: p, rule, mode, artefact: out, rc, refused, total, at: new Date().toISOString() }) + "\n", "utf-8");
      console.log(`loops ${p} ${rule} (${mode}): rc=${rc}${refused !== null ? ` refused~${refused}/${total}` : ""} → ${out}`);
    }
  }
  return failures > 0 ? 1 : 0;
}

async function main(argv: string[]): Promise<number> {
  let opts: LoopOpts;
  try {
    opts = parseLoopArgs(argv);
  } catch (err) {
    console.error(`loops: ${(err as Error).message}`);
    return 2;
  }
  const foldPath = flag(argv, "--fold");
  if (foldPath !== null) {
    if (!existsSync(foldPath)) {
      console.error(`loops: --fold artefact not found: ${foldPath}`);
      return 2;
    }
    const drafts = foldDrafts(readFileSync(foldPath, "utf-8"));
    console.log(JSON.stringify(drafts, null, 2));
    console.error(`loops: ${drafts.length} draft case(s) — triage + re-fragment before committing (print-only, corpus untouched)`);
    return 0;
  }
  const plan = loopPlan(opts);
  console.log(
    `loops plan: providers=[${opts.providers.join(",")}] rules=${opts.rules.length} modes=[${opts.modes.join(",")}] ` +
      `apiCalls=${plan.apiCalls} worstTokens=${plan.worstTokens}${plan.worstUsd !== null ? ` worstUsd~$${plan.worstUsd.toFixed(2)}` : " worstUsd=n/a (rates unknown)"}`,
  );
  if (plan.error) {
    console.error(`loops: ${plan.error}`);
    return 2;
  }
  if (opts.dryRun) {
    console.log("loops: dry run — no suites, no network, no keys touched");
    return 0;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const summaryPath = join(OUT_DIR, `loop-${new Date().toISOString().slice(0, 10)}.summary.ndjson`);
  let rc = 0;
  if (opts.providers.includes("fixture")) rc = runFixtureSuites(opts) || rc;
  for (const p of opts.providers.filter((x): x is Exclude<ProviderId, "fixture"> => x !== "fixture")) {
    rc = runLiveProvider(p, opts, summaryPath) || rc;
  }
  console.log(`loops: summary → ${summaryPath} (copy the row into docs/project/BENCH-SCOREBOARD.md)`);
  return rc;
}

if (import.meta.main) {
  await main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`loops: fatal: ${(err as Error).message}`);
      process.exit(1);
    },
  );
}
