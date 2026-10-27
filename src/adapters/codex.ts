/**
 * src/adapters/codex.ts — Codex CLI adapter (OpenAI)
 * S-13 Muse routing: AGENTS.md canonical + .agents/memory/ trust gate.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode default (no Contributor).
 *
 * Runtime contract (Codex-specific):
 * - Canonical policy: AGENTS.md (repo root) — Codex reads natively per Codex docs.
 * - Memory: .agents/memory/MEMORY.md  — Codex memory file; untrusted (S-06/GEM-01).
 * - Config: .codex/config.json or ~/.codex/config — merge fence block (never clobber).
 * - Skills: .agents/skills/<skill>/SKILL.md — shared with Claude/Cursor adapters.
 *
 * Security: .agents/memory/ never stores secrets; trust-gated AGENTS.md is sole authority (GEM-01).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";

export const codexAdapter: Adapter = {
  name: "codex",
  label: "Codex CLI/IDE",
  runtime: "codex",
  agentsMapping: {
    canonical: "AGENTS.md",
    runtimePaths: ["AGENTS.md", ".codex/AGENTS.md", ".agents/memory/MEMORY.md"],
    precedence: "AGENTS.md canonical; .agents/memory/MEMORY.md is untrusted memory (S-06)",
  },
  hookSurface: {
    hooks: ["PreToolUse", "PostToolUse"],
    fpBudgetNotes: "Minimal — FP budget per S-10/C-01; lifecycle boundary hooks only.",
  },
  skillsDir: ".agents/skills",
};

export interface CodexFenceBlock {
  version: 1;
  model_mode: "standard" | "contributor";
  companion_model: string;
  architect_model: string;
  installedAt: string;
  receipt: string;
}

export function mergeCodexConfig(
  existing: Record<string, unknown> | null,
  fenceBlock: CodexFenceBlock,
): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  base["fence"] = fenceBlock as unknown as Record<string, unknown>;
  return base;
}

export function installCodexAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = (opts.modelMode ?? "standard") as CodexFenceBlock["model_mode"];

  // 1. AGENTS.md — canonical router
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. .agents/memory/MEMORY.md — ensure exists with trust-gate warning (never secrets)
  {
    const dir = join(projectRoot, ".agents", "memory");
    mkdirSync(dir, { recursive: true });
    const p = join(dir, "MEMORY.md");
    if (!existsSync(p)) {
      const content = [
        "<!-- vibe-fence: Codex memory — untrusted. Never store secrets/tokens here (S-06/GEM-01). -->",
        "# MEMORY.md — Session Memory (untrusted)",
        "",
        "This file is session memory for Codex. It is not a trust boundary.",
        "Canonical policy: AGENTS.md. This file must never contain secrets, tokens, or credentials.",
        "",
      ].join("\n");
      writeFileSync(p, content, "utf-8");
      written.push(".agents/memory/MEMORY.md");
    }
  }

  // 3. .agents/skills/ dir
  {
    const dir = join(projectRoot, ".agents", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  }

  // 4. .codex/config.json — merge fence block
  {
    const p = join(projectRoot, ".codex", "config.json");
    const existing = existsSync(p) ? JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown> : null;
    const prevInstalledAt = (existing?.["fence"] as { installedAt?: unknown } | undefined)?.installedAt;
    const fenceBlock: CodexFenceBlock = {
      version: 1,
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      // Preserve first-install timestamp — init ×3 must be zero-churn (FINAL-v2 §7).
      installedAt: typeof prevInstalledAt === "string" ? prevInstalledAt : new Date().toISOString(),
      receipt: "🛡️ vibe-fence active — Codex adapter",
    };
    const merged = mergeCodexConfig(existing, fenceBlock);
    const nextStr = JSON.stringify(merged, null, 2) + "\n";
    const prevStr = existing ? JSON.stringify(existing, null, 2) + "\n" : null;
    if (nextStr !== prevStr) {
      mkdirSync(join(projectRoot, ".codex"), { recursive: true });
      writeFileSync(p, nextStr, "utf-8");
      written.push(".codex/config.json");
    }
  }

  void buildAgentsFenceBlock;
  return written;
}

export default codexAdapter;
