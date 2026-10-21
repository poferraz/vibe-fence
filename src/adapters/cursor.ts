/**
 * src/adapters/cursor.ts — Cursor adapter
 * S-13 Muse routing (Cursor consumes AGENTS.md); S-15 privacy default.
 * GEM-08 dual-tier routing via .cursor env; GEM-09 Standard-mode default.
 *
 * Runtime contract (Cursor-specific):
 * - Rules: .cursor/rules/<rule>.mdc  (Cursor Rules, MDC frontmatter)
 * - Hooks: .cursor/hooks.json  (PreToolUse/PostToolUse lifecycle)
 * - Canonical policy still AGENTS.md — Cursor reads it natively; rules are mirrors.
 *
 * Install: file-writing only; Cursor picks up .cursor/rules/ automatically.
 * Hooks FP budget minimal per S-10/C-01.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { AGENTS_FENCE_BLOCK_START, AGENTS_FENCE_BLOCK_END, buildAgentsFenceBlock, mergeAgentsMd } from "./claude";

export const cursorAdapter: Adapter = {
  name: "cursor",
  label: "Cursor",
  runtime: "cursor",
  agentsMapping: {
    canonical: "AGENTS.md",
    runtimePaths: [".cursor/rules", ".cursorrules", "AGENTS.md"],
    precedence: "AGENTS.md canonical; .cursor/rules/*.mdc as Cursor-native mirrors",
  },
  hookSurface: {
    hooks: ["PreToolUse", "PostToolUse"],
    fpBudgetNotes: "Minimal hooks — Cursor .cursor/hooks.json; FP budget per S-10/C-01.",
  },
  skillsDir: ".cursor/skills",
};

// Also re-export block markers for installer use
export { AGENTS_FENCE_BLOCK_START, AGENTS_FENCE_BLOCK_END };

// ---------------------------------------------------------------------------
// .cursor/rules/*.mdc — Cursor Rules format (MDC with frontmatter)
// ---------------------------------------------------------------------------

export interface CursorRuleMdc {
  filename: string; // e.g. "vibe-fence-router.mdc"
  frontmatter: Record<string, string | boolean>;
  body: string;
}

export function buildCursorRuleMdc(rule: { id: string; description: string; body: string }): CursorRuleMdc {
  return {
    filename: `${rule.id}.mdc`,
    frontmatter: {
      description: rule.description,
      globs: "",
      alwaysApply: false,
    },
    body: rule.body,
  };
}

export function serializeMdc(mdc: CursorRuleMdc): string {
  const fm = Object.entries(mdc.frontmatter).map(([k, v]) => `${k}: ${typeof v === "string" ? `"${v}"` : v}`).join("\n");
  return `---\n${fm}\n---\n\n${mdc.body}\n`;
}

/** Fence router rule — mirrors AGENTS.md router for Cursor's Rules engine. */
export function buildFenceRouterMdc(): CursorRuleMdc {
  return buildCursorRuleMdc({
    id: "vibe-fence-router",
    description: "vibe-fence router — deterministic fence decides; model explains (S-05).",
    body: [
      "# vibe-fence Router (Cursor)",
      "",
      "> Canonical: AGENTS.md (≤400 tokens). This file is a Cursor-native mirror.",
      "> Skills: .agents/skills/<skill>/SKILL.md — L1/L2/L3 progressive disclosure (S-02).",
      "> Verification: Read→Think→Write→Check; trust ladder compile→lint→tests×2.",
      "> Privacy: Standard mode — code never trains Meta (S-15/GEM-09).",
      "",
    ].join("\n"),
  });
}

// ---------------------------------------------------------------------------
// .cursor/hooks.json — lifecycle hooks (PreToolUse/PostToolUse)
// ---------------------------------------------------------------------------

export interface CursorFenceHooksBlock {
  version: 1;
  model_mode: "standard" | "contributor";
  companion_model: string;
  architect_model: string;
  installedAt: string;
  hooks: string[]; // hook ids managed by fence
}

export function mergeCursorHooks(
  existing: Record<string, unknown> | null,
  fenceBlock: CursorFenceHooksBlock,
): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  base["fence"] = fenceBlock as unknown as Record<string, unknown>;
  // Ensure fence hooks present without clobbering user hooks
  const hooks = (base["hooks"] as unknown[] | undefined) ?? [];
  base["hooks"] = hooks;
  return base;
}

// ---------------------------------------------------------------------------
// Filesystem install
// ---------------------------------------------------------------------------

export function installCursorAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = (opts.modelMode ?? "standard") as CursorFenceHooksBlock["model_mode"];

  // 1. AGENTS.md — canonical router (shared with Claude adapter)
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. .cursor/rules/vibe-fence-router.mdc
  {
    const dir = join(projectRoot, ".cursor", "rules");
    mkdirSync(dir, { recursive: true });
    const mdc = buildFenceRouterMdc();
    const p = join(dir, mdc.filename);
    const next = serializeMdc(mdc);
    const prev = existsSync(p) ? readFileSync(p, "utf-8") : null;
    if (prev !== next) { writeFileSync(p, next, "utf-8"); written.push(`.cursor/rules/${mdc.filename}`); }
  }

  // 3. .cursor/hooks.json — merge fence block
  {
    const p = join(projectRoot, ".cursor", "hooks.json");
    const existing = existsSync(p) ? JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown> : null;
    const fenceBlock: CursorFenceHooksBlock = {
      version: 1,
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      installedAt: new Date().toISOString(),
      hooks: ["PreToolUse", "PostToolUse"],
    };
    const merged = mergeCursorHooks(existing, fenceBlock);
    const nextStr = JSON.stringify(merged, null, 2) + "\n";
    const prevStr = existing ? JSON.stringify(existing, null, 2) + "\n" : null;
    if (nextStr !== prevStr) { writeFileSync(p, nextStr, "utf-8"); written.push(".cursor/hooks.json"); }
  }

  // 4. .cursor/skills/ dir
  {
    const dir = join(projectRoot, ".cursor", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  }

  void readdirSync;
  return written;
}

export default cursorAdapter;
