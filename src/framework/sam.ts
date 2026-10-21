/**
 * src/framework/sam.ts — SAM 3.1 contract (GEM-07)
 * S-13/S-14 GEM-07: one-concept-per-request, geometry not semantics, out-of-critical-path fail-open.
 * S-15 Standard-mode privacy default; GEM-09 model_mode in artefacts.
 *
 * Contract:
 * - One concept per request — comma in concept ⇒ throw SAM_SINGLE_CONCEPT_VIOLATION (see sam-guard.test.ts).
 * - Returns geometry (boxes + masks), never semantic labels.
 * - Approved uses only (fail-open):
 *   (a) click-to-teach — user clicks element → Spark decides concept → SAM masks → Spark reasons over crop.
 *   (b) visual regression masking — segment user-clicked element → isolated visual diff for `fence look`.
 * - All SAM paths are fail-open — never block deploys or fence check.
 */

import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { loadFenceConfig } from "./meta-client";

// ---------------------------------------------------------------------------
// Error — comma guard (GEM-07)
// ---------------------------------------------------------------------------

export class SamSingleConceptViolation extends Error {
  readonly code = "SAM_SINGLE_CONCEPT_VIOLATION" as const;
  constructor(concept: string) {
    super(`SAM_SINGLE_CONCEPT_VIOLATION: concept must be a single concept — comma not allowed. Got: "${concept}"`);
    this.name = "SamSingleConceptViolation";
  }
}

/**
 * Guard — called before every SAM request. Throws on comma.
 * S-13/GEM-07: one concept per request; "navbar, sidebar" is not a valid SAM prompt.
 */
export function assertSingleConcept(concept: string): void {
  if (concept.includes(",")) {
    throw new SamSingleConceptViolation(concept);
  }
  const trimmed = concept.trim();
  if (trimmed.length === 0) {
    throw new SamSingleConceptViolation(concept);
  }
}

// ---------------------------------------------------------------------------
// Types — geometry only (never semantic labels)
// ---------------------------------------------------------------------------

export interface SamBox { x: number; y: number; w: number; h: number; }
export interface SamMask {
  box: SamBox;
  maskRle?: string; // RLE-encoded mask if available
}

export type SamTask = "click-to-teach" | "visual-regression-masking";

export interface SamRequest {
  imagePath: string;  // local path or URL
  concept: string;    // single concept — comma throws
  task: SamTask;
  projectRoot?: string;
  // Prompting hints (box + point) — click-to-teach derives these from user click
  boxPrompt?: SamBox;
  pointPrompt?: { x: number; y: number; label: 0 | 1 }[];
}

export interface SamResult {
  masks: SamMask[];
  boxes: SamBox[];
  concept: string;
  // GEM-09: artefact carries model_mode for audit
  task: SamTask;
  note: string; // "SAM returns geometry, not semantics (GEM-07/S-13)"
}

export interface SamArtefact {
  type: "sam:call";
  concept: string;
  task: SamTask;
  model_mode: string;
  numMasks: number;
  at: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Core — call SAM (fail-open; geometry only)
// ---------------------------------------------------------------------------

/**
 * Call SAM 3.1 — one concept per request, fail-open, geometry only.
 * Approved tasks only; any other caller is rejected.
 *
 * Fail-open: network/auth/model errors return empty masks + logged artefact — never throw
 * except for SAM_SINGLE_CONCEPT_VIOLATION (contract violation — fail fast).
 */
export async function callSam(req: SamRequest): Promise<SamResult> {
  // 1. Comma guard — contract violation, not a recoverable error
  assertSingleConcept(req.concept);

  // 2. Validate task — only approved out-of-critical-path uses
  if (req.task !== "click-to-teach" && req.task !== "visual-regression-masking") {
    throw new Error(`SAM task not approved — allowed: click-to-teach | visual-regression-masking. Got: ${req.task}`);
  }

  const projectRoot = req.projectRoot ?? process.cwd();
  const modelMode = (() => { try { return loadFenceConfig(projectRoot).model_mode; } catch { return "standard"; } })();

  // 3. Attempt SAM call (network path) — fail-open on any transport error
  const apiKey = process.env["MUSE_API_KEY"] ?? process.env["META_API_KEY"] ?? "";
  const base = process.env["META_API_BASE"] ?? "https://api.meta.ai";
  const concept = req.concept.trim();

  try {
    if (!apiKey) throw new Error("MUSE_API_KEY not set — SAM requires API key (S-13)");
    const res = await fetch(`${base}/v1/sam/segment`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: req.imagePath,
        prompt: concept,
        ...(req.boxPrompt ? { bbox: [req.boxPrompt.x, req.boxPrompt.y, req.boxPrompt.w, req.boxPrompt.h] } : {}),
        ...(req.pointPrompt ? { points: req.pointPrompt } : {}),
      }),
    });
    if (!res.ok) throw new Error(`SAM API ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = (await res.json()) as { masks?: SamMask[]; boxes?: SamBox[] };
    const result: SamResult = {
      masks: data.masks ?? [],
      boxes: data.boxes ?? [],
      concept,
      task: req.task,
      note: "SAM returns geometry, not semantics — coordinate masks only (GEM-07/S-13)",
    };
    appendSamArtefact(projectRoot, { type: "sam:call", concept, task: req.task, model_mode: modelMode, numMasks: result.masks.length, at: new Date().toISOString(), note: result.note });
    return result;
  } catch (e) {
    // Fail-open: return empty result + artefact with error note (never blocks)
    const msg = e instanceof Error ? e.message : String(e);
    // Re-throw comma guard — it is a contract violation
    if (e instanceof SamSingleConceptViolation) throw e;
    const empty: SamResult = { masks: [], boxes: [], concept, task: req.task, note: `SAM fail-open (no network/mock): ${msg}` };
    appendSamArtefact(projectRoot, { type: "sam:call", concept, task: req.task, model_mode: modelMode, numMasks: 0, at: new Date().toISOString(), note: empty.note });
    return empty;
  }
}

function appendSamArtefact(projectRoot: string, artefact: SamArtefact): void {
  const p = join(projectRoot, ".fence", "events.ndjson");
  try { appendFileSync(p, JSON.stringify(artefact) + "\n", "utf-8"); } catch { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// Click-to-teach flow (user click → box+point prompt)
// ---------------------------------------------------------------------------

/**
 * Click-to-teach: user clicks element in browser → Spark decides concept → SAM masks → Spark reasons.
 * This is the only interactive SAM flow. It is out-of-critical-path (fail-open).
 */
export async function clickToTeach(req: SamRequest & { click: { x: number; y: number } }): Promise<SamResult> {
  assertSingleConcept(req.concept);
  return callSam({
    ...req,
    task: "click-to-teach",
    pointPrompt: [{ x: req.click.x, y: req.click.y, label: 1 }],
  });
}
