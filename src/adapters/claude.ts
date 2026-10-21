/**
 * src/adapters/claude.ts — Claude Code adapter (Anthropic)
 * S-13 Muse routing: canonical AGENTS.md + precedence; S-15 privacy default (standard).
 * GEM-08 dual-tier companion/architect; GEM-09 Standard-mode literal; GEM-07 SAM out-of-critical-path.
 *
 * Runtime contract:
 * - Canonical policy file: AGENTS.md (repo root, ≤400 tokens router)
 * - Skill discovery: .agents/skills/<skill>/SKILL.md  +  CLAUDE.md (legacy compat)
 * - Settings: .claude/settings.json  (permissions, hooks, model routing)
 * - Memory: .agents/memory/MEMORY.md  (untrusted — never secrets, S-06/GEM-01 trust gate)
 *
 * Install is file-writing only — Muse native trust chain (project-over-user,
 * deeper-over-shallower) does the rest. No plugin install required.
 * S-14 eval: structure/secrets/git/deploy rows gated by deterministic checks; model only explains.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";

// ---------------------------------------------------------------------------
// Adapter descriptor (re-export for registry)
// ---------------------------------------------------------------------------

export const claudeAdapter: Adapter = {
  name: "claude-code",
  label: "Claude Code",
  runtime: "claude-code",
  agentsMapping: {
    canonical: "AGENTS.md",
    runtimePaths: ["AGENTS.md", ".agents/AGENTS.md", "CLAUDE.md", ".agents/memory/MEMORY.md"],
    precedence: "project-over-user, deeper-over-shallower (Muse native trust chain)",
  },
  hookSurface: {
    hooks: ["PreToolUse", "PostToolUse"],
    fpBudgetNotes: "Minimal PreToolUse/PostToolUse only — FP budget defines surface (S-10/C-01).",
  },
  skillsDir: ".agents/skills",
};

// ---------------------------------------------------------------------------
// .claude/settings.json — permissions + hooks + model routing block
// ---------------------------------------------------------------------------

export interface ClaudeSettings {
  permissions?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
  model?: string;
  // fence-managed block — inside .claude/settings.json
  fence?: ClaudeFenceBlock;
}

export interface ClaudeFenceBlock {
  version: 1;
  model_mode: "standard" | "contributor"; // S-15/GEM-09 — default standard
  companion_model: string;  // GEM-08 MUSE_MODEL_COMPANION
  architect_model: string;  // GEM-08 MUSE_MODEL_ARCHITECT
  installedAt: string;
  receipt: string;
}

/** Merge fence block into existing .claude/settings.json — never clobber user keys. */
export function mergeClaudeSettings(
  existing: Record<string, unknown> | null,
  fenceBlock: ClaudeFenceBlock,
): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  base["fence"] = fenceBlock;
  // Merge hooks: fence hooks under fence-managed key; user hooks untouched
  if (!base["hooks"]) base["hooks"] = {};
  const hooks = base["hooks"] as Record<string, unknown>;
  // PreToolUse/PostToolUse — deterministic checks; FP budget minimal (S-10/C-01)
  if (!hooks["PreToolUse"]) hooks["PreToolUse"] = [];
  if (!hooks["PostToolUse"]) hooks["PostToolUse"] = [];
  return base;
}

// ---------------------------------------------------------------------------
// AGENTS.md + .agents/skills/ + CLAUDE.md + .claude/settings.json mapping
// ---------------------------------------------------------------------------

/** Fence router block appended to AGENTS.md — ≤400 tokens, idempotent. */
export const AGENTS_FENCE_BLOCK_START = "<!-- vibe-fence:start -->";
export const AGENTS_FENCE_BLOCK_END = "<!-- vibe-fence:end -->";

export function buildAgentsFenceBlock(): string {
  return [
    AGENTS_FENCE_BLOCK_START,
    "> 🛡️ vibe-fence active — deterministic fence decides; model explains (S-05).",
    "> Skills: .agents/skills/<skill>/SKILL.md — L1 name+description at startup, L2/L3 on match.",
    "> Verification: Read→Think→Write→Check + trust ladder compile→lint→tests×2→generated.",
    "> Containment: project-root realpath + git checkpoint + fence undo (≤3 gates/session).",
    "> Privacy: Standard mode — code never trains Meta (GEM-09/S-15). See .fence/config.json.",
    AGENTS_FENCE_BLOCK_END,
  ].join("\n");
}

/**
 * Merge fence block into AGENTS.md — append if missing, replace if present (idempotent).
 * Never clobbers user content outside the fence block.
 */
export function mergeAgentsMd(existing: string | null): string {
  const block = buildAgentsFenceBlock();
  if (!existing || existing.trim().length === 0) return block + "\n";
  if (existing.includes(AGENTS_FENCE_BLOCK_START)) {
    const re = new RegExp(
      escapeRegExp(AGENTS_FENCE_BLOCK_START) + ".*?" + escapeRegExp(AGENTS_FENCE_BLOCK_END),
      "s",
    );
    return existing.replace(re, block);
  }
  return existing.trimEnd() + "\n\n" + block + "\n";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// CLAUDE.md — legacy compat pointer (Anthropic)
// ---------------------------------------------------------------------------

export function buildClaudeMd(): string {
  return [
    "<!-- vibe-fence: CLAUDE.md compat — points to AGENTS.md canonical policy -->",
    "# CLAUDE.md — Fence Pointer",
    "",
    "Canonical policy: `AGENTS.md` (vibe-fence router, ≤400 tokens).",
    "Skills: `.agents/skills/<skill>/SKILL.md` (L1/L2/L3 progressive disclosure, S-02).",
    "Memory: `.agents/memory/MEMORY.md` — untrusted; never store secrets (S-06/GEM-01).",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// .agents/skills/ — skill symlink/pointer manifest
// ---------------------------------------------------------------------------

export function buildSkillsManifest(skillNames: string[]): string {
  return skillNames.map((n) => `- ${n}: .agents/skills/${n}/SKILL.md`).join("\n");
}

// ---------------------------------------------------------------------------
// Filesystem install (called by tools/install.ts)
// ---------------------------------------------------------------------------

export function installClaudeAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = (opts.modelMode ?? "standard") as ClaudeFenceBlock["model_mode"];

  // 1. AGENTS.md — merge fence block
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. CLAUDE.md — compat pointer (only if not user-managed with real content)
  {
    const p = join(projectRoot, "CLAUDE.md");
    if (!existsSync(p)) { writeFileSync(p, buildClaudeMd(), "utf-8"); written.push("CLAUDE.md"); }
  }

  // 3. .agents/skills/ — ensure dir exists (skills copied by installer)
  {
    const dir = join(projectRoot, ".agents", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); written.push(".agents/skills/"); }
  }

  // 4. .claude/settings.json — merge fence block (never clobber)
  {
    const p = join(projectRoot, ".claude", "settings.json");
    const existing = existsSync(p) ? JSON.parse(readFileSync(p, "utf-8") as string) as unknown as Record<string, unknown> : null;
    const fenceBlock: ClaudeFenceBlock = {
      version: 1,
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      installedAt: new Date().toISOString(),
      receipt: "🛡️ vibe-fence active — Claude Code adapter",
    };
    const merged = mergeClaudeSettings(existing, fenceBlock);
    const nextStr = JSON.stringify(merged, null, 2) + "\n";
    const prevStr = existing ? JSON.stringify(existing, null, 2) + "\n" : null;
    if (nextStr !== prevStr) {
      mkdirSync(join(projectRoot, ".claude"), { recursive: true });
      writeFileSync(p, nextStr, "utf-8");
      written.push(".claude/settings.json");
    }
  }

  return written;
}

// Keep default export for installer discovery
export default claudeAdapter;
