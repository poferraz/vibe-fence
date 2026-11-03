/**
 * src/framework/queue.ts
 * Flat .fence/queue.json schema — WIP=1 Kanban + breaker triage.
 * Companion UX: queue is the read-only holding area when breaker trips (S-04).
 * Invent note: flat schema with payloadHash pin; M3 adds three-condition gate (S-04/05/06).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

// ---------------------------------------------------------------------------
// Schema — .fence/queue.json (canonical flat schema)
// ---------------------------------------------------------------------------

export const QUEUE_VERSION = 1 as const;
export const QUEUE_PATH = ".fence/queue.json";

export interface QueueEntry {
  id: string;
  payloadHash: string; // sha256 of payload for pin/lock auditing
  locked: boolean; // M3 three-condition gate — locked until verified
  createdAt: string; // ISO-8601
}

export interface QueueFile {
  version: typeof QUEUE_VERSION;
  entries: QueueEntry[];
}

function defaultQueue(): QueueFile {
  return { version: QUEUE_VERSION, entries: [] };
}

function ensureDir(projectRoot: string, filePath: string): void {
  const dir = dirname(join(projectRoot, filePath));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function loadQueue(projectRoot: string): QueueFile {
  const p = join(projectRoot, QUEUE_PATH);
  if (!existsSync(p)) return defaultQueue();
  const raw = JSON.parse(readFileSync(p, "utf-8")) as QueueFile;
  if (raw.version !== QUEUE_VERSION) return defaultQueue();
  return raw;
}

function saveQueue(projectRoot: string, q: QueueFile): void {
  ensureDir(projectRoot, QUEUE_PATH);
  const p = join(projectRoot, QUEUE_PATH);
  writeFileSync(p, JSON.stringify(q, null, 2) + "\n", "utf-8");
}

export function pushEntry(projectRoot: string, entry: QueueEntry): QueueFile {
  const q = loadQueue(projectRoot);
  q.entries.push(entry);
  saveQueue(projectRoot, q);
  // TODO(M3): event wiring — emit {type:"queue:push", id:entry.id, at} to .fence/events.ndjson
  return q;
}

export function nextEntry(projectRoot: string): QueueEntry | null {
  const q = loadQueue(projectRoot);
  return q.entries[0] ?? null;
}

// ---------------------------------------------------------------------------
// Rolling-window 90% helper note — queue pressure signal
// ---------------------------------------------------------------------------

/**
 * Rolling-window 90% helper note (M2 stub — M3 wires to events.ndjson).
 *
 * When queue depth exceeds 90% of its configured cap over a rolling window,
 * companion surfaces a capacity warning ("queue at 9/10 — consider resolving
 * triaged items before new task"). Prevents silent queue starvation in
 * long WIP=1 streaks.
 *
 * Spec: window = last N pushes (default 10); threshold = 0.9 * cap (default cap 10).
 * M3 will implement isQueuePressured() reading .fence/events.ndjson counts.
 */
export const ROLLING_WINDOW_NOTE =
  "M3: isQueuePressured(window=10, cap=10, threshold=0.9) — warn when rolling depth > 90% cap.";
