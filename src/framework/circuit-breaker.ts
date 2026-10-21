/**
 * src/framework/circuit-breaker.ts
 * S-04 — Verification is mechanical, never self-assessment. Tournament Selection + 2-Attempt Breaker.
 *   FINAL-v2 §2 S-04 + cherry-pick #3 (independent Stream 02): after 2 consecutive failures,
 *   trip to read-only consultation + queue push.
 * S-12 — Elicitation on failure: parallel best-of-k (k≤5) → first pass wins; diagnosis artefact before retry.
 * Anti-patterns: §6 #6 (no LLM-judge gating), #7 (no ungrounded self-critique / debate / MoA on interactive path).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BreakerState = "closed" | "open"; // closed = normal; open = read-only + queue

export interface CircuitState {
  version: 1;
  state: BreakerState;
  consecutiveFailures: number;
  threshold: number; // default 2 per S-04 spec
  openedAt: string | null; // ISO-8601 when tripped
  lastFailure: {
    taskId: string;
    reason: string;
    diagnosisPath: string | null; // .fence/verdicts/<task>.json — required before retry per S-04
  } | null;
}

export interface FailureReport {
  taskId: string;
  reason: string;
  diagnosisPath?: string;
  // TODO: add evidence_ids from verifier (compile/lint/test output) for audit trail
}

export interface QueueEntry {
  id: string;
  queuedAt: string;
  source: "circuit-breaker";
  payload: FailureReport;
  // TODO: align with .fence/queue.json canonical schema (M2 queue spec)
  // TODO: add payload pin (hash+lock) per M3 three-condition gate
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CIRCUIT_STATE_PATH = ".fence/state/circuit.json";
export const QUEUE_PATH = ".fence/queue.json";
export const DEFAULT_THRESHOLD = 2; // S-04 — 2-attempt breaker

// ---------------------------------------------------------------------------
// State I/O
// ---------------------------------------------------------------------------

function defaultState(): CircuitState {
  return {
    version: 1,
    state: "closed",
    consecutiveFailures: 0,
    threshold: DEFAULT_THRESHOLD,
    openedAt: null,
    lastFailure: null,
  };
}

export function loadCircuitState(projectRoot: string): CircuitState {
  const p = join(projectRoot, CIRCUIT_STATE_PATH);
  if (!existsSync(p)) return defaultState();
  // TODO: validate schema version — migrate if version mismatches
  return JSON.parse(readFileSync(p, "utf-8")) as CircuitState;
}

function saveCircuitState(projectRoot: string, state: CircuitState): void {
  const p = join(projectRoot, CIRCUIT_STATE_PATH);
  // TODO: atomic write (tmp + rename); ensure .fence/state/ exists
  writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Core transitions
// ---------------------------------------------------------------------------

/**
 * Record a successful task — resets consecutive failure count.
 * S-04 — green → commit path; breaker stays closed.
 */
export function recordSuccess(projectRoot: string, _taskId: string): CircuitState {
  const state = loadCircuitState(projectRoot);
  state.consecutiveFailures = 0;
  state.lastFailure = null;
  // If breaker was open and we got a success (e.g. manual queue resolution), close it
  // TODO: decide — should open→closed require explicit `fence circuit reset` instead of auto-close?
  if (state.state === "open") {
    state.state = "closed";
    state.openedAt = null;
  }
  saveCircuitState(projectRoot, state);
  return state;
}

/**
 * Record a failure. On threshold reached, trip breaker → read-only + queue push.
 * S-04 — red → compact trace + "diagnose and fix" + one retry → queue.
 * S-12 — diagnosis artefact before retry is mandatory.
 */
export function recordFailure(projectRoot: string, report: FailureReport): CircuitState {
  const state = loadCircuitState(projectRoot);
  state.consecutiveFailures += 1;
  state.lastFailure = {
    taskId: report.taskId,
    reason: report.reason,
    diagnosisPath: report.diagnosisPath ?? null,
  };

  // TODO: enforce diagnosis artefact exists before accepting failure report
  // if (!report.diagnosisPath || !existsSync(join(projectRoot, report.diagnosisPath))) {
  //   throw new Error("S-04: diagnosis artefact required before retry — write .fence/verdicts/<task>.json");
  // }

  if (state.consecutiveFailures >= state.threshold && state.state === "closed") {
    state.state = "open";
    state.openedAt = new Date().toISOString();
    pushToQueue(projectRoot, report);
    // TODO: emit event to .fence/events.ndjson — breaker tripped
    // TODO: notify companion — "circuit open: 2 failures, now read-only. Queue has 1 item."
  }

  saveCircuitState(projectRoot, state);
  return state;
}

/**
 * Check if agent is allowed to mutate. When open, only read-only consultation.
 * S-04/S-10 — containment boundary; agent explains but does not write.
 */
export function assertCanMutate(projectRoot: string): void {
  const state = loadCircuitState(projectRoot);
  if (state.state === "open") {
    // TODO: integrate with PreToolUse hook — deny Write/Edit/Bash(mutate) with actionable message
    throw new Error(
      `circuit breaker open — read-only mode (failures: ${state.consecutiveFailures}/${state.threshold}). ` +
        `Resolve queued items or run 'npx vibe-fence circuit reset' after diagnosis. ` +
        `See ${CIRCUIT_STATE_PATH}`,
    );
  }
}

/**
 * Manual reset — operator has diagnosed and wants to retry.
 * TODO: require --reason flag for audit trail; log to events.ndjson
 */
export function resetCircuit(projectRoot: string, _reason: string): CircuitState {
  const state = loadCircuitState(projectRoot);
  state.state = "closed";
  state.consecutiveFailures = 0;
  state.openedAt = null;
  // TODO: do not clear lastFailure — keep for post-mortem until queue item resolved
  saveCircuitState(projectRoot, state);
  return state;
}

// ---------------------------------------------------------------------------
// Queue push (read-only + queue contract)
// ---------------------------------------------------------------------------

function pushToQueue(projectRoot: string, report: FailureReport): void {
  const queuePath = join(projectRoot, QUEUE_PATH);
  let queue: QueueEntry[] = [];
  if (existsSync(queuePath)) {
    queue = JSON.parse(readFileSync(queuePath, "utf-8")) as QueueEntry[];
  }
  const entry: QueueEntry = {
    id: `cb-${Date.now()}`,
    queuedAt: new Date().toISOString(),
    source: "circuit-breaker",
    payload: report,
  };
  queue.push(entry);
  // TODO: validate queue entry against canonical .fence/queue.json schema
  // TODO: ensure .fence/queue.json is not writable by agent (write-scope check in tools/validate.ts)
  writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Tournament Selection note (S-04/S-12)
// ---------------------------------------------------------------------------

/**
 * Tournament Selection — K parallel candidates → first green wins.
 * S-12 — elicitation: 1 sample → cheapest verify → on failure parallel best-of-k (k≤5).
 * This breaker wraps that loop: if all k fail, that's one logical failure (not k).
 * TODO: wire verifier.ts trust ladder as the "cheapest verify" per S-12
 * TODO: cap k≤5 and enforce happy-path ~1.0-1.2× budget (single sample usually wins)
 */
export const TOURNAMENT_NOTE = "S-12 Tournament Selection: K parallel → first green wins; breaker counts tournament as one attempt.";
