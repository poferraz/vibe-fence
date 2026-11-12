#!/usr/bin/env bun
/** Offline fixture suites and print-only corpus drafts; no provider or sandbox connections. */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runBenchBenign, runBenchHostile } from "../eval.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export type SuiteId = "hostile" | "benign" | "scenario" | "workflows";
export interface LoopOpts { suites: SuiteId[]; dryRun: boolean; fold?: string }
const SUITES: SuiteId[] = ["hostile", "benign", "scenario", "workflows"];

export function parseLoopArgs(argv: string[]): LoopOpts {
  const opts: LoopOpts = { suites: ["hostile", "benign", "scenario"], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dry-run") { opts.dryRun = true; continue; }
    const [name, inline] = arg.split("=", 2);
    if (name !== "--suites" && name !== "--fold") throw new Error(`offline only: unsupported option ${name}`);
    const value = inline ?? argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`${name} needs a value`);
    if (name === "--fold") { opts.fold = value; continue; }
    const suites = value.split(",").map(x => x.trim()) as SuiteId[];
    if (!suites.length || suites.some(suite => !SUITES.includes(suite))) throw new Error("unknown suite (choose hostile, benign, scenario, workflows)");
    opts.suites = suites;
  }
  return opts;
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

function runFixtureSuites(opts: LoopOpts): number {
  let rc = 0;
  if (opts.suites.includes("hostile")) rc = runBenchHostile([]) || rc;
  if (opts.suites.includes("benign")) rc = runBenchBenign([]) || rc;
  if (opts.suites.includes("scenario")) {
    try {
      execFileSync(process.execPath, ["test", "tests/benches/scenario.test.ts"], { cwd: ROOT, stdio: "inherit" });
    } catch {
      rc = 1;
    }
  }
  if (opts.suites.includes("workflows")) {
    try {
      execFileSync(process.execPath, ["test", "tests/benches/workflows.test.ts"], { cwd: ROOT, stdio: "inherit" });
    } catch {
      rc = 1;
    }
  }
  return rc;
}

export async function main(argv: string[]): Promise<number> {
  let opts: LoopOpts;
  try { opts = parseLoopArgs(argv); }
  catch (error) { console.error(`loops: ${(error as Error).message}`); return 2; }
  if (opts.fold) {
    if (!existsSync(opts.fold)) { console.error("loops: fold input not found"); return 2; }
    console.log(JSON.stringify(foldDrafts(readFileSync(opts.fold, "utf8")), null, 2));
    console.error("Drafts only: review and re-fragment before adding to the corpus.");
    return 0;
  }
  console.log(`loops: offline suites [${opts.suites.join(", ")}]${opts.dryRun ? " (dry run)" : ""}`);
  return opts.dryRun ? 0 : runFixtureSuites(opts);
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
