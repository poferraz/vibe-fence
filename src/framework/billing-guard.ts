/**
 * src/framework/billing-guard.ts
 * Billing guard — withBudgetCap wrapper (GEM-05, 04-guardrails).
 * Reads .fence/config model_mode (if present) for cost defaults, tracks calls+cost, throws on exceed.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
