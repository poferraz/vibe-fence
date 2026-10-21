/**
 * src/adapters/hermes.ts — Hermes Agent adapter
 * S-13 Muse routing: AGENTS.md canonical + Hermes skill system.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode default.
 *
 * Runtime contract (Hermes-specific):
 * - Canonical policy: AGENTS.md — Hermes reads natively.
 * - Skills: .agents/skills/<skill>/SKILL.md + ~/.hermes/skills/ global
 * - Config: .hermes/config.json — fence block merged (never clobber).
 * - Hooks: PreToolUse/PostToolUse — minimal FP budget (S-10/C-01).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";

export const hermesAdapter: Adapter = {
  name: "hermes",
  label: "Hermes Agent",
  runtime: "hermes",
  agentsMapping: {
    canonical: "AGENTS.md",
    runtimePaths: ["AGENTS.md", ".hermes/AGENTS.md", ".agents/skills"],
    precedence: "AGENTS.md canonical; .hermes/AGENTS.md project-local overrides",
  },
  hookSurface: {
    hooks: ["PreToolUse", "PostToolUse"],
    fpBudgetNotes: "Minimal — PreToolUse/PostToolUse; FP budget per S-10/C-01.",
  },
  skillsDir: ".agents/skills",
};

export interface HermesFenceBlock {
  version: 1;
  model_mode: "standard" | "contributor";
  companion_model: string;
  architect_model: string;
  installedAt: string;
  receipt: string;
}

export function mergeHermesConfig(
  existing: Record<string, unknown> | null,
  fenceBlock: HermesFenceBlock,
): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  base["fence"] = fenceBlock as unknown as Record<string, unknown>;
  return base;
}

export function installHermesAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = (opts.modelMode ?? "standard") as HermesFenceBlock["model_mode"];

  // 1. AGENTS.md — canonical router
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. .agents/skills/ dir
  {
    const dir = join(projectRoot, ".agents", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  }

  // 3. .hermes/config.json — merge fence block
  {
    const p = join(projectRoot, ".hermes", "config.json");
    const existing = existsSync(p) ? JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown> : null;
    const fenceBlock: HermesFenceBlock = {
      version: 1,
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      installedAt: new Date().toISOString(),
      receipt: "🛡️ vibe-fence active — Hermes adapter",
    };
    const merged = mergeHermesConfig(existing, fenceBlock);
    const nextStr = JSON.stringify(merged, null, 2) + "\n";
    const prevStr = existing ? JSON.stringify(existing, null, 2) + "\n" : null;
    if (nextStr !== prevStr) {
      mkdirSync(join(projectRoot, ".hermes"), { recursive: true });
      writeFileSync(p, nextStr, "utf-8");
      written.push(".hermes/config.json");
    }
  }

  void buildAgentsFenceBlock;
  return written;
}

export default hermesAdapter;
