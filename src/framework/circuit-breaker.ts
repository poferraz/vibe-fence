/** Persistent two-failure circuit breaker. Workspace state is not a trust boundary. */
import { randomBytes } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { adapterPathsSafe } from "../adapters/safe-paths.js";
import { pushEntry } from "./queue.js";

export type BreakerState = "closed" | "open";
export interface CircuitState {
  version: 1;
  state: BreakerState;
  consecutiveFailures: number;
  threshold: number;
  openedAt: string | null;
  lastFailure: { taskId: string; reason: string; diagnosisPath: string | null } | null;
}
export interface FailureReport { taskId: string; reason: string; diagnosisPath?: string }
export interface QueueEntry { id: string; queuedAt: string; source: "circuit-breaker"; payload: FailureReport }
export const CIRCUIT_STATE_PATH = ".fence/state/circuit.json";
export const QUEUE_PATH = ".fence/queue.json";
export const DEFAULT_THRESHOLD = 2;

function defaultState(): CircuitState {
  return { version: 1, state: "closed", consecutiveFailures: 0, threshold: DEFAULT_THRESHOLD, openedAt: null, lastFailure: null };
}
function assertSafe(root: string): void {
  if (!adapterPathsSafe(root, [CIRCUIT_STATE_PATH, ".fence/state/circuit.lock", QUEUE_PATH, ".fence/verdicts"])) throw new Error("unsafe circuit state path");
}
export function loadCircuitState(root: string): CircuitState {
  assertSafe(root);
  const path = join(root, CIRCUIT_STATE_PATH);
  if (!existsSync(path)) return defaultState();
  const state = JSON.parse(readFileSync(path, "utf8")) as CircuitState;
  if (state.version !== 1 || !["closed", "open"].includes(state.state) || !Number.isSafeInteger(state.consecutiveFailures) || state.consecutiveFailures < 0 || !Number.isSafeInteger(state.threshold) || state.threshold < 1) throw new Error("invalid circuit state");
  return state;
}
function save(root: string, state: CircuitState): void {
  assertSafe(root);
  const path = join(root, CIRCUIT_STATE_PATH);
  const temp = join(root, ".fence", "state", `.circuit-${randomBytes(10).toString("hex")}`);
  try { writeFileSync(temp, JSON.stringify(state, null, 2) + "\n", { flag: "wx", mode: 0o600 }); renameSync(temp, path); }
  finally { try { unlinkSync(temp); } catch {} }
}
function withLock<T>(root: string, fn: () => T): T {
  assertSafe(root);
  const dir = join(root, ".fence", "state");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "circuit.lock");
  let fd: number | undefined;
  for (let i = 0; i < 40; i++) {
    try { fd = openSync(path, "wx", 0o600); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try { if (Date.now() - statSync(path).mtimeMs > 30_000) unlinkSync(path); } catch {}
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
  }
  if (fd === undefined) throw new Error("circuit state is busy");
  try { return fn(); }
  finally { closeSync(fd); try { unlinkSync(path); } catch {} }
}
export function recordSuccess(root: string, _taskId: string): CircuitState {
  return withLock(root, () => {
    const state = loadCircuitState(root);
    // Only an explicit reset closes an open circuit.
    if (state.state === "closed" && state.consecutiveFailures) { state.consecutiveFailures = 0; state.lastFailure = null; save(root, state); }
    return state;
  });
}
export function recordFailure(root: string, report: FailureReport): CircuitState {
  return withLock(root, () => {
    const state = loadCircuitState(root);
    if (state.state === "open") return state;
    state.consecutiveFailures = state.lastFailure?.taskId === report.taskId ? state.consecutiveFailures + 1 : 1;
    state.lastFailure = { taskId: report.taskId, reason: report.reason, diagnosisPath: report.diagnosisPath ?? null };
    if (shouldTrip(state)) { state.state = "open"; state.openedAt = new Date().toISOString(); }
    save(root, state);
    if (state.state === "open") {
      try {
        // A malformed or non-canonical queue is left untouched.
        const path = join(root, QUEUE_PATH);
        if (existsSync(path)) {
          const q = JSON.parse(readFileSync(path, "utf8"));
          if (q?.version !== 1 || !Array.isArray(q.entries)) return state;
        }
        pushEntry(root, { id: `cb-${report.taskId.slice(0, 16)}`, payloadHash: report.taskId, locked: true, createdAt: state.openedAt! });
      } catch { /* The open state still blocks; never replace user queue data. */ }
    }
    return state;
  });
}
export function assertCanMutate(root: string): void {
  if (loadCircuitState(root).state === "open") throw new Error("Circuit breaker open. Stop retrying and ask the user; run 'vibe-fence reset' after review.");
}
export function resetCircuit(root: string, _reason: string): CircuitState {
  return withLock(root, () => { const state = loadCircuitState(root); state.state = "closed"; state.consecutiveFailures = 0; state.openedAt = null; save(root, state); return state; });
}
export function shouldTrip(state: Pick<CircuitState, "state" | "consecutiveFailures" | "threshold">): boolean {
  return state.state === "closed" && state.consecutiveFailures >= state.threshold;
}
export const TOURNAMENT_NOTE = "S-12 Tournament Selection: K parallel → first green wins; breaker counts tournament as one attempt.";
