/**
 * src/framework/byte-capped-pipeline.ts
 * S-03 — Context is a budget, not a buffer. Per-task retrieval is bounded.
 * 02 invent: vibe-map (PageRank over repo graph, ≤1k tokens) + 4KB pipe cap + last-5 pruning + ACID artefacts.
 * Caps are declared in src/framework/context-budget.yml (budgets.dynamic + pipe.byte_cap).
 * This module re-exports those caps and provides the PageRank note + helpers.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Re-export byte cap from context-budget.yml (single source of truth)
// ---------------------------------------------------------------------------

export const CONTEXT_BUDGET_PATH = "src/framework/context-budget.yml";

function readBudgetYml(projectRoot: string): string {
  const p = join(projectRoot, CONTEXT_BUDGET_PATH);
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf-8");
}

function parseYamlInt(yaml: string, keyLine: string, fallback: number): number {
  // minimal line-oriented parse — avoids new dep; real parse is tools/validate.ts responsibility
  for (const line of yaml.split("\n")) {
    if (line.includes(keyLine)) {
      const m = line.match(/:\s*(\d+)/);
      if (m) return Number(m[1]);
    }
  }
  return fallback;
}

export function getByteCap(projectRoot: string): number {
  const yml = readBudgetYml(projectRoot);
  return parseYamlInt(yml, "byte_cap", 4000);
}

export function getDynamicTokenCap(projectRoot: string): number {
  const yml = readBudgetYml(projectRoot);
  // line is "  dynamic: 4000        # ..."
  for (const line of yml.split("\n")) {
    const t = line.trim();
    if (t.startsWith("dynamic:")) {
      const m = t.match(/dynamic:\s*(\d+)/);
      if (m) return Number(m[1]);
    }
  }
  return 4000;
}

// ---------------------------------------------------------------------------
// Vibe-map ≤1k PageRank note (S-01/S-02/S-03)
// ---------------------------------------------------------------------------

/**
 * Vibe-map — PageRank over repo graph, capped at ≤1k tokens per task (S-03, 02 invent).
 *
 * Construction (M3 — this is the note, not the impl):
 * - Nodes = files/packages; edges = imports + co-modification.
 * - Rank by PageRank; take top-k until token budget (≤1k tokens) exhausted; remaining
 *   are L1 (name+description) only. Invariants at context boundaries per S-03.
 * - Per-task: map is scoped to task-relevant subgraph (e.g. plan artefact's file list).
 *
 * Reference cap: budgets.dynamic = 4000 tokens, vibe-map ≤ 1000 of that (25%).
 * Defined in src/framework/context-budget.yml — this file is the re-export/pointer per S-03.
 */
export const VIBE_MAP_NOTE =
  "PageRank vibe-map ≤1k tokens ⊆ budgets.dynamic (4000); invariants at boundaries; see context-budget.yml.";

// ---------------------------------------------------------------------------
// Byte-capped helpers
// ---------------------------------------------------------------------------

export const BYTE_CAP_DEFAULT = 4000;

export function capBytes(input: string, cap = BYTE_CAP_DEFAULT): { text: string; truncated: boolean } {
  const bytes = Buffer.byteLength(input, "utf-8");
  if (bytes <= cap) return { text: input, truncated: false };
  // slice by bytes without breaking utf-8 — use Buffer
  const buf = Buffer.from(input, "utf-8").subarray(0, cap);
  return { text: buf.toString("utf-8") + `\n[truncated ${bytes - cap} bytes]`, truncated: true };
}

export function capTokensApprox(text: string, capTokens: number): { text: string; truncated: boolean } {
  // ~4 chars/token heuristic matching tools/validate.ts estimateTokens
  const capChars = capTokens * 4;
  if (text.length <= capChars) return { text, truncated: false };
  return { text: text.slice(0, capChars) + `\n[truncated ~${Math.ceil((text.length - capChars) / 4)} tokens]`, truncated: true };
}
