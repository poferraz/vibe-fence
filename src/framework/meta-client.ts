/**
 * src/framework/meta-client.ts — Muse Spark 1.3 + Wonder 1.0 dual-tier client
 * S-13 Muse Spark 1.3 default; S-15 Standard-mode privacy default (P0 ethics gate).
 * GEM-08 dual-tier routing MUSE_MODEL_COMPANION/ARCHITECT; GEM-09 model_mode artefacts.
 * GEM-09 Standard-mode default: Contributor requires --contributor-mode + disclosure.
 *
 * Contract:
 * - Muse Spark 1.3 default tier (companion) — teaching, queue triage, fence look, lint summaries.
 * - Muse Wonder 1.0 escalation tier (architect) — vibe-plan, multi-file refactor, complexity:high queue.
 * - POST /v1/responses stateless replay (never previous_response_id) — encrypted replay mode.
 * - Standard-mode default P0: .fence/config.json model_mode="standard"; contributor only via --contributor-mode.
 * - Dual-tier routing: MUSE_MODEL_COMPANION (default muse-spark-1.3) / MUSE_MODEL_ARCHITECT (default muse-wonder-1.0).
 * - Caps: ≤5 Wonder calls/session unless --wonder flag forces architect tier.
 * - model_mode + model id recorded in every artefact (verdicts, events.ndjson, queue entries).
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Constants — model ids + pricing + caps
// ---------------------------------------------------------------------------

export const DEFAULT_COMPANION_MODEL = "muse-spark-1.3";
export const DEFAULT_ARCHITECT_MODEL = "muse-wonder-1.0";

export const PRICING = {
  companion: { inPerM: 1.25, outPerM: 4.25, label: "Spark 1.3 Standard" },
  architect: { inPerM: 4.00, outPerM: 20.0, label: "Wonder 1.0" },
} as const;

export type ModelTier = "companion" | "architect";
export type ModelMode = "standard" | "contributor";

export const META_API_BASE = process.env["META_API_BASE"] ?? "https://api.meta.ai";
export const RESPONSES_PATH = "/v1/responses";

export const MAX_WONDER_CALLS_DEFAULT = 5; // GEM-08 cap

// ---------------------------------------------------------------------------
// Config — .fence/config.json
// ---------------------------------------------------------------------------

export interface FenceConfig {
  version: 1;
  model_mode: ModelMode; // S-15/GEM-09 — default "standard"
  fence_version: string;
  updatedAt: string;
}

export const FENCE_CONFIG_PATH = ".fence/config.json";

export function defaultFenceConfig(): FenceConfig {
  return {
    version: 1,
    model_mode: "standard",
    fence_version: "0.1.0",
    updatedAt: new Date().toISOString(),
  };
}

export function loadFenceConfig(projectRoot: string): FenceConfig {
  const p = join(projectRoot, FENCE_CONFIG_PATH);
  if (!existsSync(p)) return defaultFenceConfig();
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as FenceConfig;
  } catch {
    return defaultFenceConfig();
  }
}

export function saveFenceConfig(projectRoot: string, config: FenceConfig): void {
  const p = join(projectRoot, FENCE_CONFIG_PATH);
  writeFileSync(p, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Model resolution — env + config + flag precedence
// ---------------------------------------------------------------------------

export interface ModelResolution {
  tier: ModelTier;
  model: string;
  model_mode: ModelMode;
  reason: string;
}

export function resolveModel(opts: {
  projectRoot?: string;
  tier?: ModelTier;        // explicit tier request
  forceWonder?: boolean;    // --wonder CLI flag
  wonderCallCount?: number; // calls this session
}): ModelResolution {
  const projectRoot = opts.projectRoot ?? process.cwd();
  const config = loadFenceConfig(projectRoot);
  const modelMode: ModelMode = config.model_mode;

  // --wonder forces architect
  if (opts.forceWonder) {
    return {
      tier: "architect",
      model: process.env["MUSE_MODEL_ARCHITECT"] ?? DEFAULT_ARCHITECT_MODEL,
      model_mode: modelMode,
      reason: "--wonder flag — forced architect tier",
    };
  }

  // Explicit tier routing
  if (opts.tier === "architect") {
    const count = opts.wonderCallCount ?? 0;
    if (count >= MAX_WONDER_CALLS_DEFAULT) {
      return {
        tier: "companion",
        model: process.env["MUSE_MODEL_COMPANION"] ?? DEFAULT_COMPANION_MODEL,
        model_mode: modelMode,
        reason: `Wonder cap ${MAX_WONDER_CALLS_DEFAULT} reached — fell back to companion`,
      };
    }
    return {
      tier: "architect",
      model: process.env["MUSE_MODEL_ARCHITECT"] ?? DEFAULT_ARCHITECT_MODEL,
      model_mode: modelMode,
      reason: "architect tier — plan/verify escalation (GEM-08)",
    };
  }

  // Default: companion
  return {
    tier: "companion",
    model: process.env["MUSE_MODEL_COMPANION"] ?? DEFAULT_COMPANION_MODEL,
    model_mode: modelMode,
    reason: "companion tier default — Spark 1.3 (S-13)",
  };
}

// ---------------------------------------------------------------------------
// Request — POST /v1/responses stateless replay
// ---------------------------------------------------------------------------

export interface ResponsesRequestInput {
  model: string;
  input: string | Array<{ role: string; content: string }>;
  reasoning_effort?: "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
  // Never previous_response_id — stateless replay only (GEM-08/S-13)
  // Never reasoning_effort:"none" — silent = skip call (GEM-09/S-13/S-15)
  // Never tool_search + json_schema together on one request (GEM-08)
  extra?: Record<string, unknown>;
}

export interface ResponsesCallArtefact {
  tier: ModelTier;
  model: string;
  model_mode: ModelMode;
  requestId?: string;
  at: string;
  // S-05: model never decides; this is explanation payload only
  note: "deterministic fence decides; model explains (S-05)";
}

/** Message text from a Responses payload: top-level output_text, else output[].content[] text parts. */
export function extractOutputText(data: { output_text?: unknown; output?: unknown }): string {
  if (typeof data.output_text === "string" && data.output_text.length > 0) return data.output_text;
  const parts: string[] = [];
  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (!item || typeof item !== "object") continue;
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (part && typeof part === "object" && (part as { type?: unknown }).type === "output_text" && typeof (part as { text?: unknown }).text === "string") {
          parts.push((part as { text: string }).text);
        }
      }
    }
  }
  return parts.join("\n");
}

export interface ResponsesResult {
  output: string;
  artefact: ResponsesCallArtefact;
  raw?: unknown;
}

/**
 * Stateless replay helper — every call is self-contained.
 * - Always POST /v1/responses (not previous_response_id replay).
 * - Always Bearer MUSE_API_KEY (same base URL for Spark + Wonder — one-line swap per GEM-08).
 * - silent ⇒ skip call entirely (reasoning_effort:"none" is 400 per GEM-09).
 */
export async function callResponses(
  input: ResponsesRequestInput,
  opts: {
    apiKey?: string;
    projectRoot?: string;
    tier?: ModelTier;
    silent?: boolean; // S-15/GEM-09 — silent = don't call model
    signal?: AbortSignal;
  } = {},
): Promise<ResponsesResult> {
  if (opts.silent) {
    const modelMode = loadFenceConfig(opts.projectRoot ?? process.cwd()).model_mode;
    return {
      output: "",
      artefact: {
        tier: opts.tier ?? "companion",
        model: input.model,
        model_mode: modelMode,
        at: new Date().toISOString(),
        note: "deterministic fence decides; model explains (S-05)",
      },
    };
  }

  const apiKey = opts.apiKey ?? process.env["MUSE_API_KEY"] ?? process.env["META_API_KEY"] ?? "";
  if (!apiKey) {
    throw new Error("MUSE_API_KEY (or META_API_KEY) is not set — cannot call Muse API (S-13). Run with --dry-run or set the key.");
  }

  const url = `${META_API_BASE}${RESPONSES_PATH}`;
  const body = {
    model: input.model,
    input: input.input,
    ...(input.reasoning_effort ? { reasoning_effort: input.reasoning_effort } : {}),
    ...(input.extra ?? {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text();
    // Rate-limit headers: record for telemetry x-ratelimit-* (GEM-08)
    throw new Error(`Muse API ${res.status} ${res.statusText}: ${text.slice(0, 1000)}`);
  }

  const data = (await res.json()) as { output_text?: string; id?: string; [k: string]: unknown };
  const output = extractOutputText(data);

  const modelMode = loadFenceConfig(opts.projectRoot ?? process.cwd()).model_mode;
  const artefact: ResponsesCallArtefact = {
    tier: opts.tier ?? "companion",
    model: input.model,
    model_mode: modelMode,
    requestId: data["id"] as string | undefined,
    at: new Date().toISOString(),
    note: "deterministic fence decides; model explains (S-05)",
  };

  return { output, artefact, raw: data };
}

// ---------------------------------------------------------------------------
// High-level: companion + architect dispatchers with cap + artefact logging
// ---------------------------------------------------------------------------

let _wonderCallCount = 0; // session-local

export async function companionCall(
  input: Omit<ResponsesRequestInput, "model"> & { model?: string },
  opts: { projectRoot?: string; apiKey?: string; silent?: boolean; reasoningEffort?: ResponsesRequestInput["reasoning_effort"] } = {},
): Promise<ResponsesResult> {
  const projectRoot = opts.projectRoot ?? process.cwd();
  const model = input.model ?? process.env["MUSE_MODEL_COMPANION"] ?? DEFAULT_COMPANION_MODEL;
  const result = await callResponses(
    { model, input: input.input, reasoning_effort: input.reasoning_effort ?? opts.reasoningEffort, extra: input.extra },
    { apiKey: opts.apiKey, projectRoot, tier: "companion", silent: opts.silent },
  );
  appendArtefact(projectRoot, result.artefact);
  return result;
}

export async function architectCall(
  input: Omit<ResponsesRequestInput, "model"> & { model?: string },
  opts: { projectRoot?: string; apiKey?: string; forceWonder?: boolean; reasoningEffort?: ResponsesRequestInput["reasoning_effort"] } = {},
): Promise<ResponsesResult> {
  const projectRoot = opts.projectRoot ?? process.cwd();
  if (!opts.forceWonder && _wonderCallCount >= MAX_WONDER_CALLS_DEFAULT) {
    throw new Error(`Wonder cap ${MAX_WONDER_CALLS_DEFAULT} reached — use --wonder to force (GEM-08)`);
  }
  const model = input.model ?? process.env["MUSE_MODEL_ARCHITECT"] ?? DEFAULT_ARCHITECT_MODEL;
  const result = await callResponses(
    { model, input: input.input, reasoning_effort: input.reasoning_effort ?? opts.reasoningEffort, extra: input.extra },
    { apiKey: opts.apiKey, projectRoot, tier: "architect" },
  );
  _wonderCallCount++;
  appendArtefact(projectRoot, result.artefact);
  return result;
}

// ---------------------------------------------------------------------------
// Artefact logging — every call records model + model_mode (GEM-09)
// ---------------------------------------------------------------------------

function appendArtefact(projectRoot: string, artefact: ResponsesCallArtefact): void {
  const p = join(projectRoot, ".fence", "events.ndjson");
  try {
    appendFileSync(p, JSON.stringify({ type: "meta:responses", ...artefact }) + "\n", "utf-8");
  } catch {
    // events file may not exist yet — non-fatal
  }
}

/** Reset session Wonder counter (for tests). */
export function resetWonderCount(): void { _wonderCallCount = 0; }
export function getWonderCount(): number { return _wonderCallCount; }

// ---------------------------------------------------------------------------
// Ethics gate — Contributor disclosure (GEM-09 P0)
// ---------------------------------------------------------------------------

export const CONTRIBUTOR_DISCLOSURE =
  "⚠️  Contributor Mode: code and prompts you send may be used to train Meta models. Use only for non-private projects. See https://dev.meta.ai/legal/model-api-terms";

export function requireContributorDisclosure(projectRoot: string, mode: ModelMode): void {
  if (mode === "contributor") {
    // Must have been explicitly opted-in via --contributor-mode; installer already printed disclosure
    const config = loadFenceConfig(projectRoot);
    if (config.model_mode !== "contributor") {
      throw new Error("Contributor mode requested but .fence/config.json is standard — re-run: npx vibe-fence init --contributor-mode");
    }
  }
}
