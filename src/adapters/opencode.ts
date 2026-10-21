/**
 * src/adapters/opencode.ts — OpenCode adapter
 * S-13 Muse routing via AGENTS.md; S-14 eval harness; S-15 privacy default.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode literal.
 *
 * Runtime contract (OpenCode-specific):
 * - Canonical policy: AGENTS.md (repo root) — OpenCode reads natively.
 * - Config: opencode.json / .opencode/ — merge fence block there.
 * - Hooks: OpenCode plugin hooks (PreToolUse/PreToolExecution) — minimal FP budget (S-10/C-01).
 * - Skills: ~/.config/opencode/skills/ (global) + .agents/skills/ (project)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";

export const openCodeAdapter: Adapter = {
  name: "opencode",
  label: "OpenCode",
  runtime: "opencode",
  agentsMapping: {
    canonical: "AGENTS.md",
    runtimePaths: ["AGENTS.md", "opencode.json", ".opencode/config.json"],
    precedence: "AGENTS.md canonical; opencode.json for runtime config + fence block",
  },
  hookSurface: {
    hooks: ["PreToolUse", "PreToolExecution"],
    fpBudgetNotes: "Minimal — PreToolUse/PreToolExecution only; lifecycle boundary per S-10/C-01.",
  },
  skillsDir: ".agents/skills",
};

export interface OpenCodeFenceBlock {
  version: 1;
  model_mode: "standard" | "contributor";
  companion_model: string;
  architect_model: string;
  installedAt: string;
  receipt: string;
}

export function mergeOpenCodeConfig(
  existing: Record<string, unknown> | null,
  fenceBlock: OpenCodeFenceBlock,
): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  base["fence"] = fenceBlock as unknown as Record<string, unknown>;
  return base;
}

export function installOpenCodeAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = (opts.modelMode ?? "standard") as OpenCodeFenceBlock["model_mode"];

  // 1. AGENTS.md — canonical router
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. opencode.json — merge fence block (or .opencode/config.json fallback)
  {
    const candidates = [join(projectRoot, "opencode.json"), join(projectRoot, ".opencode", "config.json")];
    const p = candidates[0]!;
    const existing = existsSync(p) ? JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown> : null;
    const fenceBlock: OpenCodeFenceBlock = {
      version: 1,
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      installedAt: new Date().toISOString(),
      receipt: "🛡️ vibe-fence active — OpenCode adapter",
    };
    const merged = mergeOpenCodeConfig(existing, fenceBlock);
    const nextStr = JSON.stringify(merged, null, 2) + "\n";
    const prevStr = existing ? JSON.stringify(existing, null, 2) + "\n" : null;
    if (nextStr !== prevStr) {
      mkdirSync(join(projectRoot, ".opencode"), { recursive: true });
      // Prefer existing location if it existed; otherwise write opencode.json at root
      const target = existing ? p : candidates[0]!;
      writeFileSync(target, nextStr, "utf-8");
      written.push(target.replace(projectRoot + "/", ""));
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

export default openCodeAdapter;
