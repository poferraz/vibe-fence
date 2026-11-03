#!/usr/bin/env bun
/**
 * tools/meta-probe.ts — ONE minimal Meta Model API call. Nothing more.
 *
 * Purpose (Oct 27 gate): learn which model ID answers the live API and record
 * it. Makes exactly one request via src/framework/meta-client.ts (POST
 * /v1/responses). Never prints or stores the API key. Result is recorded to
 * .fence/meta-probe.json (gitignored). Run: bun run tools/meta-probe.ts
 * Wonder escalation probe (human-approved, one call): --architect
 *
 * Exit codes: 0 = API answered · 2 = API returned an error (recorded) ·
 * 3 = no key configured (no call made).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { architectCall, companionCall, META_API_BASE, RESPONSES_PATH, DEFAULT_ARCHITECT_MODEL, DEFAULT_COMPANION_MODEL } from "../src/framework/meta-client";

const ROOT = resolve(import.meta.dir, "..");
const wantArchitect = process.argv.includes("--architect");
const model = wantArchitect
  ? (process.env["MUSE_MODEL_ARCHITECT"] ?? DEFAULT_ARCHITECT_MODEL)
  : (process.env["MUSE_MODEL_COMPANION"] ?? DEFAULT_COMPANION_MODEL);
const hasKey = Boolean(process.env["MUSE_API_KEY"] ?? process.env["META_API_KEY"]);

interface ProbeRecord {
  at: string;
  endpoint: string;
  model: string;
  ok: boolean;
  requestId?: string;
  outputPreview?: string;
  error?: string;
}

/** Pure history merge (exported for tests): prior file text + new record. */
export function mergeProbeHistory(prevText: string | null, rec: ProbeRecord): ProbeRecord[] {
  let probes: ProbeRecord[] = [];
  if (prevText !== null) {
    try {
      const prev = JSON.parse(prevText) as { probes?: ProbeRecord[]; model?: string };
      if (Array.isArray(prev.probes)) probes = prev.probes;
      else if (typeof prev.model === "string") probes = [prev as ProbeRecord];
    } catch {
      // no usable prior record — start fresh
    }
  }
  probes.push(rec);
  return probes;
}

function record(rec: ProbeRecord): void {
  const dir = join(ROOT, ".fence");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, "meta-probe.json");
  // Append-only history: never overwrite earlier probe evidence (Nov 3 lesson).
  let prevText: string | null = null;
  try {
    prevText = readFileSync(p, "utf-8") as string;
  } catch {
    // no prior record — start fresh
  }
  writeFileSync(p, JSON.stringify({ probes: mergeProbeHistory(prevText, rec) }, null, 2) + "\n", "utf-8");
}

async function main(): Promise<void> {
const base: ProbeRecord = {
  at: new Date().toISOString(),
  endpoint: `${META_API_BASE}${RESPONSES_PATH}`,
  model,
  ok: false,
};

if (!hasKey) {
  record({ ...base, error: "no key configured (MUSE_API_KEY / META_API_KEY unset) — no call made" });
  console.log("meta-probe: no key configured — no call made. Put MUSE_API_KEY in .env (see .env.example).");
  process.exit(3);
}

try {
  const call = wantArchitect ? architectCall : companionCall;
  const result = await call(
    { model, input: "Reply with exactly one word: ok" },
    { projectRoot: ROOT },
  );
  record({
    ...base,
    ok: true,
    requestId: result.artefact.requestId,
    outputPreview: result.output.slice(0, 120),
  });
  console.log(`meta-probe: OK — model "${model}" answered. Recorded to .fence/meta-probe.json`);
} catch (err) {
  const message = (err instanceof Error ? err.message : String(err)).slice(0, 300);
  record({ ...base, error: message });
  console.log(`meta-probe: API error for model "${model}": ${message}`);
  console.log("Recorded to .fence/meta-probe.json — no retry made (one-call cap).");
  process.exit(2);
}
}

if (import.meta.main) await main();
