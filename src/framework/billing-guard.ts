/** Bounded local count of observed network commands; this does not measure spending. */

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { adapterPathsSafe } from "../adapters/safe-paths.js";

function loadFenceConfig(projectRoot: string): Record<string, unknown> | null {
  for (const name of [".fence/config", ".fence/config.json", ".fence/app-profile.json"]) {
    const p = join(projectRoot, name);
    if (!existsSync(p)) continue;
    try {
      const raw = readFileSync(p, "utf-8").trim();
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore malformed fence config — treat as absent
    }
  }
  return null;
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
