/** Local protection status and append-only diagnostic events. */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { adapterPathsSafe } from "../adapters/safe-paths.js";
import { appendProjectEvent } from "./safe-events.js";

export const EVENTS_PATH = ".fence/events.ndjson";

/** Never imply live host enforcement from local configuration alone. */
export function formatStatusHeader(toolState: string, integrityState: string): string {
  const label = integrityState === "fail" || toolState === "degraded" ? "ACTION NEEDED" : "REVIEW PROTECTION";
  return `╭─ VIBE-FENCE STATUS · ${label} ─`;
}

/** Generic append helper — any event row with a `type` field. */
export function appendEvent(projectRoot: string, row: Record<string, unknown>): void {
  const abs = join(projectRoot, EVENTS_PATH);
  if (!adapterPathsSafe(projectRoot, [EVENTS_PATH])) throw new Error("unsafe event path");
  mkdirSync(dirname(abs), { recursive: true });
  const enriched = { at: new Date().toISOString(), ...row };
  appendProjectEvent(projectRoot, JSON.stringify(enriched) + "\n");
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
