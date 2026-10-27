/**
 * src/adapters/hermes.ts — Hermes Agent adapter
 * S-13 Muse routing: AGENTS.md canonical + Hermes skill system.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode default.
 *
 * Runtime contract (Hermes-specific):
 * - Canonical policy: AGENTS.md — Hermes reads natively.
 * - Skills: .agents/skills/<skill>/SKILL.md + ~/.hermes/skills/ global
 * - Config: .hermes/config.json is NEVER written (host keys only; fence
 *   metadata lives in `.fence/adapters/hermes.json`). Legacy keys scrubbed.
 * - Hooks: PreToolUse/PostToolUse — minimal FP budget (S-10/C-01).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";
import { scrubFenceKey, writeAdapterReceipt } from "./receipts";

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

// NOTE: no merge function — .hermes/config.json is never written. Legacy
// fence-managed keys are scrubbed by the installer (see below).

export function installHermesAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = opts.modelMode ?? "standard";

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

  // 3. .hermes/config.json — NEVER written (host keys only). Scrub legacy
  // fence-managed keys; never create the file, never touch user keys.
  {
    const p = join(projectRoot, ".hermes", "config.json");
    if (existsSync(p)) {
      try {
        const existing = JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown>;
        if (scrubFenceKey(existing)) {
          writeFileSync(p, JSON.stringify(existing, null, 2) + "\n", "utf-8");
          written.push(".hermes/config.json");
        }
      } catch {
        // Unparseable host config — leave it alone, never clobber.
      }
    }
    const receipt = writeAdapterReceipt(projectRoot, "hermes", {
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      receipt: "🛡️ vibe-fence active — Hermes adapter",
    });
    if (receipt.changed) written.push(receipt.path.replace(projectRoot + "/", ""));
  }

  void buildAgentsFenceBlock;
  return written;
}

export default hermesAdapter;
