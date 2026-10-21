/**
 * src/adapters/antigravity.ts — Antigravity adapter
 * S-13 Muse routing: AGENTS.md canonical + .agents/ overrides.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode default.
 *
 * Runtime contract (Antigravity-specific):
 * - Overrides: .agents/rules/antigravity.md  — per-runtime overrides (Antigravity reads .agents/)
 * - Canonical policy: AGENTS.md canonical; antigravity.md extends/overrides for Antigravity runtime.
 * - Skills: .agents/skills/<skill>/SKILL.md — shared discovery (S-02)
 * - Hooks: PreToolUse/PostToolUse — minimal FP budget (S-10/C-01)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
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
    "- Hooks: PreToolUse/PostToolUse via .agents/ — minimal surface (S-10/C-01).",
    "- Skills: .agents/skills/<skill>/SKILL.md — L1/L2/L3 progressive disclosure (S-02).",
    "- Privacy: Standard mode — code never trains Meta (S-15/GEM-09).",
    "",
  ].join("\n");
}

export function installAntigravityAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  void opts;

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
    if (!existsSync(p)) {
      writeFileSync(p, buildAntigravityOverrides(), "utf-8");
      written.push(".agents/rules/antigravity.md");
    }
  }

  // 3. .agents/skills/ dir
  {
    const dir = join(projectRoot, ".agents", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  }

  void buildAgentsFenceBlock;
  return written;
}

export default antigravityAdapter;
