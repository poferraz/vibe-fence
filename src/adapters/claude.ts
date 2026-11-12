/**
 * src/adapters/claude.ts — Claude Code adapter (Anthropic)
 *
 * Runtime contract:
 * - Canonical policy file: AGENTS.md (repo root, ≤400 tokens router)
 * - Skill discovery: .agents/skills/<skill>/SKILL.md  +  CLAUDE.md (legacy compat)
 * - Settings: .claude/settings.json — real PreToolUse gate hook only (vendor
 *   keys only; fence metadata lives in `.fence/adapters/claude.json`).
 * - Memory: .agents/memory/MEMORY.md  (untrusted — never secrets, S-06/GEM-01 trust gate)
 *
 * Install is file-writing only — host instruction precedence (project-over-user,
 * deeper-over-shallower) does the rest. No plugin install required.
 */

import { adapterPathsSafe } from "./safe-paths.js";
import { chmodSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { scrubFenceKey, writeAdapterReceipt } from "./receipts";
import { GATE_HOOK_CONTENT_MARKER, GATE_HOOK_MARKER, GATE_HOOK_SCRIPT, GATE_HOOK_SCRIPT_NAME, LEGACY_GATE_HOOK_NAME, LEGACY_GATE_WRAPPER } from "./gate-hook";

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
    precedence: "project-over-user, deeper-over-shallower (host instruction precedence)",
  },
  hookSurface: {
    hooks: ["PreToolUse"],
    fpBudgetNotes: "PreToolUse gate hook, fail-open-with-warn (S-10/C-01); PostToolUse untouched.",
  },
  skillsDir: ".agents/skills",
};

// ---------------------------------------------------------------------------
// .claude/settings.json — real PreToolUse gate hook (vendor keys only)
// ---------------------------------------------------------------------------

export interface ClaudeSettings {
  permissions?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
  model?: string;
}

/**
 * PreToolUse entry per https://code.claude.com/docs/en/hooks — matcher runs
 * against `tool_name`, the command gets hook JSON on stdin, exit 2 blocks.
 */
export function buildClaudePreToolUseEntry(): { matcher: string; hooks: Array<{ type: string; command: string; args: string[] }> } {
  return {
    matcher: "Read|Write|Edit|MultiEdit|Bash",
    hooks: [{ type: "command", command: "node", args: [`\${CLAUDE_PROJECT_DIR}/.claude/hooks/${GATE_HOOK_SCRIPT_NAME}`] }],
  };
}

function isOurClaudeHook(hook: unknown): boolean {
  if (!hook || typeof hook !== "object") return false;
  const value = hook as Record<string, unknown>;
  return (typeof value.command === "string" && value.command.includes(GATE_HOOK_MARKER)) ||
    (value.command === "node" && Array.isArray(value.args) && value.args.some(arg => typeof arg === "string" && arg.includes(`.claude/hooks/${GATE_HOOK_MARKER}`)));
}

/**
 * Merge the managed PreToolUse entry into settings — user keys and hooks
 * preserved, our entry deduped by marker, legacy `fence` key scrubbed.
 * PostToolUse is never created (the old empty stubs were L14).
 */
export function mergeClaudeSettings(existing: Record<string, unknown> | null): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  scrubFenceKey(base);
  const hooksRaw = base["hooks"];
  const hooks: Record<string, unknown> =
    typeof hooksRaw === "object" && hooksRaw !== null && !Array.isArray(hooksRaw)
      ? { ...(hooksRaw as Record<string, unknown>) }
      : {};
  const prev = hooks["PreToolUse"];
  const list = Array.isArray(prev) ? prev.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object" || !Array.isArray((entry as Record<string, unknown>).hooks)) return [entry];
    const original = (entry as { hooks: unknown[] }).hooks;
    const remaining = original.filter(hook => !isOurClaudeHook(hook));
    if (remaining.length === original.length) return [entry];
    return remaining.length ? [{ ...entry, hooks: remaining }] : [];
  }) : [];
  list.push(buildClaudePreToolUseEntry());
  hooks["PreToolUse"] = list;
  base["hooks"] = hooks;
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
    "> 🛡️ vibe-fence guidance — checks depend on working hooks; findings and fixes stay local.",
    "> Check the behavior requested before calling a change done; report what ran and what could not be checked.",
    "> Git hooks check staged content before a commit and outgoing history before a push. Other files need a separate check.",
    "> Follow the installed host hook's result for supported actions. Guidance alone does not prevent actions.",
    "> Skills: .agents/skills/<skill>/SKILL.md — read the relevant skill when needed.",
    "> Privacy: Fence checks stay local; the coding tool retains its own privacy settings.",
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

const LEGACY_CLAUDE_POINTER = [
    "<!-- vibe-fence: CLAUDE.md compat — points to AGENTS.md canonical policy -->",
    "# CLAUDE.md — Fence Pointer",
    "",
    "Canonical policy: `AGENTS.md` (vibe-fence router, ≤400 tokens).",
    "Skills: `.agents/skills/<skill>/SKILL.md` (L1/L2/L3 progressive disclosure, S-02).",
    "Memory: `.agents/memory/MEMORY.md` — untrusted; never store secrets (S-06/GEM-01).",
    "",
].join("\n");

export function buildClaudeMd(): string {
  return [
    "<!-- vibe-fence:claude-import:start -->",
    "@AGENTS.md",
    "<!-- vibe-fence:claude-import:end -->",
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

export function installClaudeAdapter(projectRoot: string): string[] {
  if (!adapterPathsSafe(projectRoot, ["AGENTS.md", ".fence/adapters/claude.json", "CLAUDE.md", ".agents/skills", ".claude/settings.json", ".claude/hooks/fence-gate.sh", ".claude/hooks/fence-gate.cjs"])) { console.warn("[vibe-fence] Adapter contains a managed symlink; leaving it unchanged."); return []; }
  const nodeHook = join(projectRoot, ".claude", "hooks", GATE_HOOK_SCRIPT_NAME);
  if (existsSync(nodeHook) && !readFileSync(nodeHook, "utf8").includes(GATE_HOOK_CONTENT_MARKER)) { console.warn("[vibe-fence] Claude gate hook is user-managed; leaving the adapter unchanged."); return []; }
  const written: string[] = [];

  // 1. AGENTS.md — merge fence block
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. CLAUDE.md takes precedence over AGENTS.md, so import the shared guidance.
  // Replace only the exact former template; retain customized instructions.
  {
    const p = join(projectRoot, "CLAUDE.md");
    const existing = existsSync(p) ? readFileSync(p, "utf8") : null;
    let next = existing === null ? buildClaudeMd() : existing.replace(LEGACY_CLAUDE_POINTER, buildClaudeMd());
    if (!/^@(?:\.\/)?AGENTS\.md\r?$/m.test(next)) {
      next += `${next.endsWith("\n") ? "\n" : "\n\n"}${buildClaudeMd()}`;
    }
    if (next !== existing) { writeFileSync(p, next, "utf8"); written.push("CLAUDE.md"); }
  }

  // 3. .agents/skills/ — ensure dir exists (skills copied by installer)
  {
    const dir = join(projectRoot, ".agents", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); written.push(".agents/skills/"); }
  }

  // 4. .claude/settings.json — real PreToolUse gate hook (L14 was empty stubs).
  // Merge-only: user keys and hooks preserved; our entry deduped by marker.
  {
    const p = join(projectRoot, ".claude", "settings.json");
    let existing: Record<string, unknown> | null = null;
    let readable = true;
    if (existsSync(p)) {
      try {
        existing = JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown>;
      } catch {
        readable = false;
        console.warn(`[vibe-fence] .claude/settings.json is not valid JSON — leaving it alone.`);
      }
    }
    if (readable) {
      const merged = mergeClaudeSettings(existing);
      const nextStr = JSON.stringify(merged, null, 2) + "\n";
      const prevStr = existing ? JSON.stringify(existing, null, 2) + "\n" : null;
      if (nextStr !== prevStr) {
        mkdirSync(join(projectRoot, ".claude"), { recursive: true });
        writeFileSync(p, nextStr, "utf-8");
        written.push(".claude/settings.json");
      }
    }
  }

  // 5. Install the Node hook; migrate an existing managed shell hook in place.
  {
    const dir = join(projectRoot, ".claude", "hooks");
    const p = join(dir, GATE_HOOK_SCRIPT_NAME);
    const prev = existsSync(p) ? readFileSync(p, "utf-8") : null;
    if (prev !== null && !prev.includes(GATE_HOOK_CONTENT_MARKER)) {
      console.warn(`[vibe-fence] .claude/hooks/${GATE_HOOK_SCRIPT_NAME} exists and is not fence-managed — leaving it alone.`);
    } else {
      if (prev !== GATE_HOOK_SCRIPT) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(p, GATE_HOOK_SCRIPT, "utf-8");
        written.push(`.claude/hooks/${GATE_HOOK_SCRIPT_NAME}`);
      }
      chmodSync(p, 0o755);
    }
    const legacy = join(dir, LEGACY_GATE_HOOK_NAME);
    if (existsSync(legacy) && readFileSync(legacy, "utf8").includes(GATE_HOOK_CONTENT_MARKER) && readFileSync(legacy, "utf8") !== LEGACY_GATE_WRAPPER) {
      writeFileSync(legacy, LEGACY_GATE_WRAPPER, "utf8");
      written.push(`.claude/hooks/${LEGACY_GATE_HOOK_NAME}`);
    }
  }

  // 6. .fence/adapters/claude.json — install receipt (host file keeps vendor keys only)
  {
    const receipt = writeAdapterReceipt(projectRoot, "claude", {
      receipt: "vibe-fence Claude Code adapter installed — host execution not verified",
    });
    if (receipt.changed) written.push(receipt.path.replace(projectRoot + "/", ""));
  }

  return written;
}

// Keep default export for installer discovery
export default claudeAdapter;
