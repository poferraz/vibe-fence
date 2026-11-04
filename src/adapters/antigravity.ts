/**
 * src/adapters/antigravity.ts — Antigravity adapter
 * S-13 Muse routing: AGENTS.md canonical + .agents/ overrides.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode default.
 *
 * Runtime contract (Antigravity-specific):
 * - Overrides: .agents/rules/antigravity.md  — per-runtime overrides (Antigravity reads .agents/)
 * - Canonical policy: AGENTS.md canonical; antigravity.md extends/overrides for Antigravity runtime.
 * - Skills: .agents/skills/<skill>/SKILL.md — shared discovery (S-02)
 * - This adapter installs guidance only; it does not install a pre-action hook.
 */

import { adapterPathsSafe } from "./safe-paths.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { writeAdapterReceipt } from "./receipts.js";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";

export const antigravityAdapter: Adapter = {
  name: "antigravity",
  label: "Antigravity",
  runtime: "antigravity",
  agentsMapping: {
    canonical: "AGENTS.md",
    runtimePaths: [".agents/rules/antigravity.md", "AGENTS.md"],
    precedence: "AGENTS.md canonical; .agents/rules/antigravity.md overrides for Antigravity runtime",
  },
  hookSurface: {
    hooks: ["PreToolUse", "PostToolUse"],
    fpBudgetNotes: "Minimal — .agents/ overrides only; FP budget per S-10/C-01.",
  },
  skillsDir: ".agents/skills",
};

export interface AntigravityFenceBlock {
  version: 1;
  model_mode: "standard" | "contributor";
  companion_model: string;
  architect_model: string;
  installedAt: string;
  receipt: string;
}

export function buildAntigravityOverrides(): string {
  return [
    "<!-- vibe-fence: Antigravity overrides — extends AGENTS.md canonical policy -->",
    "# Antigravity — Fence Overrides",
    "",
    "> Canonical: AGENTS.md (≤400 tokens router). This file holds Antigravity-specific overrides only.",
    "> Do not duplicate AGENTS.md — add only what Antigravity needs beyond the canonical policy.",
    "",
    "## Overrides",
    "",
    "- Protection: advisory guidance only; no pre-action tool hook is installed. Use Git hooks and manual checks.",
    "- Skills: .agents/skills/<skill>/SKILL.md — L1/L2/L3 progressive disclosure (S-02).",
    "- Privacy: Standard mode is the default; review provider terms before sending data.",
    "",
  ].join("\n");
}

/** Exact pre-advisory template; customized guidance must never be overwritten. */
const LEGACY_ANTIGRAVITY_OVERRIDES = [
  "<!-- vibe-fence: Antigravity overrides — extends AGENTS.md canonical policy -->",
  "# Antigravity — Fence Overrides",
  "",
  "> Canonical: AGENTS.md (≤400 tokens router). This file holds Antigravity-specific overrides only.",
  "> Do not duplicate AGENTS.md — add only what Antigravity needs beyond the canonical policy.",
  "",
  "## Overrides",
  "",
  "- Hooks: PreToolUse/PostToolUse via .agents/ — minimal surface (S-10/C-01).",
  "- Skills: .agents/skills/<skill>/SKILL.md — L1/L2/L3 progressive disclosure (S-02).",
  "- Privacy: Standard mode — code never trains Meta (S-15/GEM-09).",
  "",
].join("\n");

export function installAntigravityAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  if (!adapterPathsSafe(projectRoot, ["AGENTS.md", ".fence/adapters/antigravity.json", ".agents/skills", ".agents/rules/antigravity.md"])) { console.warn("[vibe-fence] Adapter contains a managed symlink; leaving it unchanged."); return []; }
  const written: string[] = [];

  // 1. AGENTS.md — canonical router
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. .agents/rules/antigravity.md — Antigravity overrides
  {
    const dir = join(projectRoot, ".agents", "rules");
    mkdirSync(dir, { recursive: true });
    const p = join(dir, "antigravity.md");
    if (!existsSync(p) || readFileSync(p, "utf8") === LEGACY_ANTIGRAVITY_OVERRIDES) {
      writeFileSync(p, buildAntigravityOverrides(), "utf-8");
      written.push(".agents/rules/antigravity.md");
    }
  }

  // 3. .agents/skills/ dir
  {
    const dir = join(projectRoot, ".agents", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  }

  const receipt = writeAdapterReceipt(projectRoot, "antigravity", {
    model_mode: opts.modelMode ?? "standard",
    companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
    architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
    receipt: "vibe-fence Antigravity adapter installed — advisory guidance only",
  });
  if (receipt.changed) written.push(receipt.path.replace(projectRoot + "/", ""));

  void buildAgentsFenceBlock;
  return written;
}

export default antigravityAdapter;
