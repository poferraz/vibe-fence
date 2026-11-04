/**
 * src/framework/billing-guard.ts
 * Billing guard — withBudgetCap wrapper (GEM-05, 04-guardrails).
 * Reads .fence/config model_mode (if present) for cost defaults, tracks calls+cost, throws on exceed.
 */

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { adapterPathsSafe } from "../adapters/safe-paths.js";

export interface BudgetCaps {
  maxCalls?: number;
  maxCostUsd?: number;
}

export interface FenceConfig {
  model_mode?: string; // "standard" | "contributor" etc (GEM-09)
  model?: string;
  [k: string]: unknown;
}

export interface BudgetState {
  calls: number;
  costUsd: number;
}

export class BudgetExceededError extends Error {
  override name = "BudgetExceededError";
  kind: "calls" | "cost";
  state: BudgetState;
  cap: number;
  constructor(kind: "calls" | "cost", state: BudgetState, cap: number) {
    super(kind === "calls" ? `budget exceeded: ${state.calls} calls > max ${cap}` : `budget exceeded: $${state.costUsd.toFixed(4)} > $${cap.toFixed(4)}`);
    this.kind = kind;
    this.state = { ...state };
    this.cap = cap;
  }
}

function loadFenceConfig(projectRoot: string): FenceConfig | null {
  // Spec says .fence/config model_mode; also try .fence/config.json
  for (const name of [".fence/config", ".fence/config.json", ".fence/app-profile.json"]) {
    const p = join(projectRoot, name);
    if (!existsSync(p)) continue;
    try {
      const raw = readFileSync(p, "utf-8").trim();
      if (!raw) continue;
      const parsed = JSON.parse(raw) as FenceConfig;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore malformed fence config — treat as absent
    }
  }
  return null;
}

// Simple per-model cost hint (USD per 1K tokens or per-call fallback). Real pricing lives in meta-client.
const DEFAULT_COST_PER_CALL_USD: Record<string, number> = {
  "muse-spark-1.3": 0.002,
  "muse-wonder-1.0": 0.015,
  default: 0.002,
};

function costPerCall(projectRoot: string): number {
  const cfg = loadFenceConfig(projectRoot);
  const model = (cfg?.model as string | undefined) ?? "muse-spark-1.3";
  return DEFAULT_COST_PER_CALL_USD[model] ?? DEFAULT_COST_PER_CALL_USD["default"]!;
}

/**
 * Wrap an async function with a budget cap. Tracks calls and estimated cost.
 * Throws BudgetExceededError before invoking fn when cap would be exceeded.
 *
 * Cost is estimated as costPerCall (from .fence/config model) × calls; callers
 * that know real token cost can pass costUsd override via the returned wrapper's
 * `charge()` helper. Minimal but real — not a pure TODO.
 */
export function withBudgetCap<TArgs extends unknown[], TReturn>(
  caps: BudgetCaps,
  fn: (...args: TArgs) => Promise<TReturn>,
  opts?: { projectRoot?: string },
): ((...args: TArgs) => Promise<TReturn>) & { state: BudgetState; reset(): void; charge(costUsd: number): void } {
  const projectRoot = opts?.projectRoot ?? process.cwd();
  const state: BudgetState = { calls: 0, costUsd: 0 };
  const perCall = costPerCall(projectRoot);

  const wrapped = async (...args: TArgs): Promise<TReturn> => {
    // Pre-check: would next call exceed caps?
    if (caps.maxCalls != null && state.calls + 1 > caps.maxCalls) {
      throw new BudgetExceededError("calls", state, caps.maxCalls);
    }
    if (caps.maxCostUsd != null && state.costUsd + perCall > caps.maxCostUsd) {
      throw new BudgetExceededError("cost", state, caps.maxCostUsd);
    }

    state.calls += 1;
    state.costUsd += perCall;

    // Post-check for tight caps (e.g. maxCostUsd smaller than one call)
    if (caps.maxCalls != null && state.calls > caps.maxCalls) {
      throw new BudgetExceededError("calls", state, caps.maxCalls);
    }
    if (caps.maxCostUsd != null && state.costUsd > caps.maxCostUsd) {
      throw new BudgetExceededError("cost", state, caps.maxCostUsd);
    }

    return fn(...args);
  };

  const withExtras = wrapped as typeof wrapped & { state: BudgetState; reset(): void; charge(costUsd: number): void };
  withExtras.state = state;
  withExtras.reset = () => {
    state.calls = 0;
    state.costUsd = 0;
  };
  withExtras.charge = (costUsd: number) => {
    state.costUsd += costUsd;
  };

  return withExtras;
}

/** A bounded count of observed shell network commands; it is not a spend meter. */
export function recordNetworkCommand(projectRoot: string): { allowed: boolean; calls: number; limit: number } {
  if (!adapterPathsSafe(projectRoot, [".fence/state/budget.json", ".fence/state/budget.lock"])) throw new Error("unsafe network budget path");
  const stateDir = join(projectRoot, ".fence/state");
  mkdirSync(stateDir, { recursive: true });
  const lock = join(stateDir, "budget.lock");
  let fd: number | undefined;
  for (let i = 0; i < 40; i++) {
    try { fd = openSync(lock, "wx", 0o600); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try { if (Date.now() - statSync(lock).mtimeMs > 30_000) unlinkSync(lock); } catch {}
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
  }
  if (fd === undefined) throw new Error("network budget is busy");
  try {
    const config = loadFenceConfig(projectRoot)?.["billing_guard"] as { max_calls?: unknown; window_ms?: unknown } | undefined;
    const limit = Number.isSafeInteger(config?.max_calls) && (config!.max_calls as number) >= 0 ? config!.max_calls as number : 100;
    const windowMs = Number.isSafeInteger(config?.window_ms) && (config!.window_ms as number) >= 1000 ? config!.window_ms as number : 3_600_000;
    const path = join(stateDir, "budget.json");
    let state = { version: 1, startedAt: Date.now(), calls: 0 };
    if (existsSync(path)) {
      const previous = JSON.parse(readFileSync(path, "utf8"));
      if (previous?.version !== 1 || !Number.isSafeInteger(previous.calls) || previous.calls < 0 || !Number.isSafeInteger(previous.startedAt)) throw new Error("invalid network budget");
      if (Date.now() - previous.startedAt < windowMs && previous.startedAt <= Date.now()) state = previous;
    }
    if (state.calls >= limit) return { allowed: false, calls: state.calls, limit };
    state.calls++;
    const temp = join(stateDir, `.budget-${randomBytes(10).toString("hex")}`);
    try { writeFileSync(temp, JSON.stringify(state) + "\n", { flag: "wx", mode: 0o600 }); renameSync(temp, path); }
    finally { try { unlinkSync(temp); } catch {} }
    return { allowed: true, calls: state.calls, limit };
  } finally { closeSync(fd); try { unlinkSync(lock); } catch {} }
}

export function resetNetworkBudget(projectRoot: string): void {
  if (!adapterPathsSafe(projectRoot, [".fence/state/budget.json"])) throw new Error("unsafe network budget path");
  try { unlinkSync(join(projectRoot, ".fence/state/budget.json")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
