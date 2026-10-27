/**
 * src/adapters/codex.ts — Codex CLI adapter (OpenAI)
 * S-13 Muse routing: AGENTS.md canonical + .agents/memory/ trust gate.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode default (no Contributor).
 *
 * Runtime contract (Codex-specific):
 * - Canonical policy: AGENTS.md (repo root) — Codex reads natively per Codex docs.
 * - Memory: .agents/memory/MEMORY.md  — Codex memory file; untrusted (S-06/GEM-01).
 * - Config: .codex/config.json is NEVER written (host keys only; fence
 *   metadata lives in `.fence/adapters/codex.json`). Legacy keys scrubbed.
 * - Skills: .agents/skills/<skill>/SKILL.md — shared with Claude/Cursor adapters.
 *
 * Security: .agents/memory/ never stores secrets; trust-gated AGENTS.md is sole authority (GEM-01).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";
import { scrubFenceKey, writeAdapterReceipt } from "./receipts";

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

// NOTE: no merge function — .codex/config.json is never written. Legacy
// fence-managed keys are scrubbed by the installer (see below).

export function installCodexAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = opts.modelMode ?? "standard";

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

  // 4. .codex/config.json — NEVER written (host keys only). Scrub legacy
  // fence-managed keys; never create the file, never touch user keys.
  {
    const p = join(projectRoot, ".codex", "config.json");
    if (existsSync(p)) {
      try {
        const existing = JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown>;
        if (scrubFenceKey(existing)) {
          writeFileSync(p, JSON.stringify(existing, null, 2) + "\n", "utf-8");
          written.push(".codex/config.json");
        }
      } catch {
        // Unparseable host config — leave it alone, never clobber.
      }
    }
    const receipt = writeAdapterReceipt(projectRoot, "codex", {
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      receipt: "🛡️ vibe-fence active — Codex adapter",
    });
    if (receipt.changed) written.push(receipt.path.replace(projectRoot + "/", ""));
  }

  void buildAgentsFenceBlock;
  return written;
}

export default codexAdapter;
