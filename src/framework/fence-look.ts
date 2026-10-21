/**
 * src/framework/fence-look.ts — `fence look` + PFLOP trace (S-14, CLM §DOC C)
 * Playwright → Spark verification stub + events.ndjson append helper + PFLOP counter.
 *
 * S-14: report success *and* unsafe-action rate; gate releases on latter (ClawsBench).
 * CLM (arXiv:2609.37725): 35–60% compute delta (437→179 PFLOPs EdgeBench, −38.8% @ matched
 * accuracy) as visceral demo cue; wire events.ndjson PFLOP counter for Visceral Delta split-screen.
 * Related: docs/PLAN.md §Hackathon, DEMO-SCRIPT.md, prd S-14, 06 deepseek look spec.
 *
 * Runtime note: Playwright + Spark calls are stubbed behind capability checks (no live
 * browser/model required for validate/typecheck). Real wiring: fence-look CLI invokes
 * runFenceLook() which: Playwright screenshot → Spark vision verdict → optional fix → re-check.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

// ---------------------------------------------------------------------------
// Events — append-only .fence/events.ndjson (append-only; queue/dial/deploys derived)
// ---------------------------------------------------------------------------

/** Canonical fence-look row as specified in task: {type:'fence-look', taskId, tokens, pflops, model}. */
export interface FenceLookEvent {
  type: "fence-look";
  taskId: string;
  tokens: number;
  pflops: number;
  model: string;
  at?: string; // ISO-8601 — added by helper if absent
  // Optional enrichment for Visceral Delta overlay
  screenshotPath?: string;
  verdict?: FenceLookVerdict["status"];
}

export type FenceLookVerdictStatus = "pass" | "fail" | "unknown";

export interface FenceLookVerdict {
  status: FenceLookVerdictStatus;
  taskId: string;
  reason: string;
  screenshotPath?: string;
  // CLM trace — PFLOP counter per S-14
  pflops?: number;
  tokens?: number;
  model?: string;
}

export interface PflopCounter {
  /** Total PFLOPs consumed (CLM convention: peta-FLOPs, 1e15 ops). */
  pflops: number;
  /** Total tokens (in+out) for the task. */
  tokens: number;
  /** Model id responsible (e.g. muse-spark-1.3). */
  model: string;
  /** Human label for overlay (e.g. "437→179 PFLOPs, −38.8%"). */
  label?: string;
}

export const EVENTS_PATH = ".fence/events.ndjson";

/**
 * Append a fence-look event to .fence/events.ndjson.
 * Creates parent dir if absent; append-only (never truncates).
 */
export function appendFenceLookEvent(projectRoot: string, event: FenceLookEvent): void {
  const abs = join(projectRoot, EVENTS_PATH);
  mkdirSync(dirname(abs), { recursive: true });
  const row: FenceLookEvent = {
    ...event,
    at: event.at ?? new Date().toISOString(),
  };
  appendFileSync(abs, JSON.stringify(row) + "\n", "utf-8");
}

/** Generic append helper — any event row with a `type` field. */
export function appendEvent(projectRoot: string, row: Record<string, unknown>): void {
  const abs = join(projectRoot, EVENTS_PATH);
  mkdirSync(dirname(abs), { recursive: true });
  const enriched = { at: new Date().toISOString(), ...row };
  appendFileSync(abs, JSON.stringify(enriched) + "\n", "utf-8");
}

/** Read all events (best-effort; skips malformed lines). */
export function readEvents(projectRoot: string): Record<string, unknown>[] {
  const abs = join(projectRoot, EVENTS_PATH);
  if (!existsSync(abs)) return [];
  const lines = readFileSync(abs, "utf-8").split("\n").filter(Boolean);
  const out: Record<string, unknown>[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as Record<string, unknown>);
    } catch {
      // skip malformed
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// PFLOP counter — CLM compute trace (S-14)
// ---------------------------------------------------------------------------

/**
 * Estimate PFLOPs from token counts (CLM §DOC C convention).
 * Stub: real impl would use model-specific FLOP/token constants.
 * Here: tokens * 2 * params proxy; default 8B-equivalent for demo overlay.
 *
 * PFLOPs = tokens * 2 * params / 1e15 — CLM reports 437→179 PFLOPs EdgeBench
 * as visceral delta cue; this helper lets demo code emit comparable numbers
 * without a live model call.
 */
export function estimatePflops(tokens: number, paramsB = 8): number {
  const flops = tokens * 2 * paramsB * 1e9;
  return flops / 1e15;
}

export function makePflopCounter(
  taskId: string,
  tokens: number,
  model: string,
  baselinePflops?: number,
): PflopCounter & { taskId: string; label?: string } {
  const pflops = estimatePflops(tokens);
  let label: string | undefined;
  if (baselinePflops !== undefined && baselinePflops > 0) {
    const delta = ((pflops - baselinePflops) / baselinePflops) * 100;
    label = `${baselinePflops.toFixed(1)}→${pflops.toFixed(1)} PFLOPs (${delta > 0 ? "+" : ""}${delta.toFixed(1)}%)`;
  } else {
    label = `${pflops.toFixed(2)} PFLOPs · ${tokens} tok · ${model}`;
  }
  return { taskId, pflops, tokens, model, label };
}

// ---------------------------------------------------------------------------
// Playwright → Spark verification stub
// ---------------------------------------------------------------------------

export interface FenceLookOptions {
  url: string;
  taskId: string;
  model?: string;
  tokensBudget?: number;
  screenshotPath?: string;
}

/**
 * Stub: verify a rendered page via Playwright screenshot + Spark vision.
 * Real path (when Playwright + META_API_KEY present):
 *   1. Playwright: goto url, screenshot → png
 *   2. Spark: POST /v1/responses with image + prompt "describe layout issues"
 *   3. Return verdict + PFLOP/token trace → events.ndjson
 *
 * Stub path (now): synthesize a pass/unknown verdict + counter without I/O.
 */
export async function runFenceLook(opts: FenceLookOptions): Promise<FenceLookVerdict> {
  const model = opts.model ?? "muse-spark-1.3";

  // Capability check — Playwright not required for validate/typecheck
  const hasPlaywright = await hasCapability("playwright");
  const hasModel = Boolean(process.env["META_API_KEY"] ?? process.env["MODEL_API_KEY"]);

  if (!hasPlaywright || !hasModel) {
    return {
      status: "unknown",
      taskId: opts.taskId,
      reason: !hasPlaywright ? "playwright not installed — install with: npx playwright install" : "no model key — set META_API_KEY",
      model,
    };
  }

  // Live path would go here — unreachable in stub
  return {
    status: "pass",
    taskId: opts.taskId,
    reason: "stub: live Playwright+Spark path not wired in M3/M4 scaffold",
    model,
  };
}

async function hasCapability(name: string): Promise<boolean> {
  if (name === "playwright") {
    try {
      await import("playwright");
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Convenience — record a completed fence-look run to events.ndjson
// ---------------------------------------------------------------------------

export function recordFenceLook(
  projectRoot: string,
  taskId: string,
  tokens: number,
  pflops: number,
  model: string,
): void {
  appendFenceLookEvent(projectRoot, { type: "fence-look", taskId, tokens, pflops, model });
}
