/**
 * src/adapters/cursor.ts — Cursor adapter
 *
 * Runtime contract (Cursor-specific):
 * - Rules: .cursor/rules/<rule>.mdc  (Cursor Rules, MDC frontmatter)
 * - Hooks: .cursor/hooks.json — real `preToolUse` gate hook (lowercase event
 *   names per the hooks.json schema; fence metadata lives in
 *   `.fence/adapters/cursor.json`).
 * - Canonical policy still AGENTS.md — Cursor reads it natively; rules are mirrors.
 *
 * Install: file-writing only; Cursor picks up .cursor/rules/ automatically.
 * Hooks FP budget minimal per S-10/C-01.
 */

import { adapterPathsSafe } from "./safe-paths.js";
import { chmodSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { AGENTS_FENCE_BLOCK_START, AGENTS_FENCE_BLOCK_END, buildAgentsFenceBlock, mergeAgentsMd } from "./claude";
import { scrubFenceKey, writeAdapterReceipt } from "./receipts";
import { GATE_HOOK_CONTENT_MARKER, GATE_HOOK_MARKER, GATE_HOOK_SCRIPT, GATE_HOOK_SCRIPT_NAME, LEGACY_GATE_HOOK_NAME, LEGACY_GATE_WRAPPER } from "./gate-hook";

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
    hooks: ["preToolUse"],
    fpBudgetNotes: "preToolUse gate hook, fail-open-with-warn (S-10/C-01).",
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
    description: "vibe-fence router — local checks and plain-language fixes.",
    body: [
      "# vibe-fence Router (Cursor)",
      "",
      "> Canonical: AGENTS.md (≤400 tokens). This file is a Cursor-native mirror.",
      "> Skills: .agents/skills/<skill>/SKILL.md — L1/L2/L3 progressive disclosure (S-02).",
      "> Verify the requested behavior; report which checks ran and what remains untested.",
      "> Git hooks inspect staged content or outgoing history. Guidance alone does not prevent actions.",
      "> Privacy: Fence checks stay local; the coding tool retains its own privacy settings.",
      "",
    ].join("\n"),
  });
}

// ---------------------------------------------------------------------------
// .cursor/hooks.json — real preToolUse gate hook (vendor keys only)
// Schema (verified Oct 26 — no official schema URL; Cursor forum threads +
// https://ntorres.dev/blog/cursor-hooks-json-guide, consistent):
// `{version: 1, hooks: {preToolUse: [{command, matcher?, failClosed?}]}}` —
// lowercase event names, exit 2 denies, failClosed defaults false.
// ---------------------------------------------------------------------------

export interface CursorPreToolUseEntry {
  command: string;
  failClosed: boolean;
}

export function buildCursorPreToolUseEntry(): CursorPreToolUseEntry {
  return { command: `node .cursor/hooks/${GATE_HOOK_SCRIPT_NAME}`, failClosed: false };
}

function isOurCursorEntry(entry: unknown): boolean {
  if (typeof entry !== "object" || entry === null) return false;
  const command = (entry as Record<string, unknown>).command;
  return typeof command === "string" && command.includes(GATE_HOOK_MARKER);
}

export function mergeCursorHooks(existing: Record<string, unknown> | null): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  scrubFenceKey(base);
  if (base["version"] === undefined) base["version"] = 1;
  const hooksRaw = base["hooks"];
  if (Array.isArray(hooksRaw)) {
    // Legacy shape (our old versions wrote `hooks: []`): an empty array is
    // safe to replace; a non-empty one is user data in a schema-invalid
    // shape — leave it untouched rather than destroy it.
    if (hooksRaw.length > 0) return base;
    base["hooks"] = { preToolUse: [buildCursorPreToolUseEntry()] };
    return base;
  }
  const hooks: Record<string, unknown> =
    typeof hooksRaw === "object" && hooksRaw !== null ? { ...(hooksRaw as Record<string, unknown>) } : {};
  const prev = hooks["preToolUse"];
  const list = Array.isArray(prev) ? prev.filter((e) => !isOurCursorEntry(e)) : [];
  list.push(buildCursorPreToolUseEntry());
  hooks["preToolUse"] = list;
  base["hooks"] = hooks;
  return base;
}

// ---------------------------------------------------------------------------
// Filesystem install
// ---------------------------------------------------------------------------

export function installCursorAdapter(projectRoot: string): string[] {
  if (!adapterPathsSafe(projectRoot, ["AGENTS.md", ".fence/adapters/cursor.json", ".cursor/rules/vibe-fence-router.mdc", ".cursor/hooks.json", ".cursor/hooks/fence-gate.sh", ".cursor/hooks/fence-gate.cjs", ".cursor/skills"])) { console.warn("[vibe-fence] Adapter contains a managed symlink; leaving it unchanged."); return []; }
  const nodeHook = join(projectRoot, ".cursor", "hooks", GATE_HOOK_SCRIPT_NAME);
  if (existsSync(nodeHook) && !readFileSync(nodeHook, "utf8").includes(GATE_HOOK_CONTENT_MARKER)) { console.warn("[vibe-fence] Cursor gate hook is user-managed; leaving the adapter unchanged."); return []; }
  const written: string[] = [];

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

  // 3. .cursor/hooks.json — real preToolUse gate hook (L14 was `hooks: []`).
  // Merge-only: user keys and hooks preserved; our entry deduped by marker.
  {
    const p = join(projectRoot, ".cursor", "hooks.json");
    let existing: Record<string, unknown> | null = null;
    let readable = true;
    if (existsSync(p)) {
      try {
        existing = JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown>;
      } catch {
        readable = false;
        console.warn(`[vibe-fence] .cursor/hooks.json is not valid JSON — leaving it alone.`);
      }
    }
    if (readable) {
      const merged = mergeCursorHooks(existing);
      const nextStr = JSON.stringify(merged, null, 2) + "\n";
      const prevStr = existing ? JSON.stringify(existing, null, 2) + "\n" : null;
      if (nextStr !== prevStr) {
        mkdirSync(join(projectRoot, ".cursor"), { recursive: true });
        writeFileSync(p, nextStr, "utf-8");
        written.push(".cursor/hooks.json");
      }
    }
  }

  // 4. .cursor/skills/ dir
  {
    const dir = join(projectRoot, ".cursor", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  }

  // 5. Install the Node hook; migrate an existing managed shell hook in place.
  {
    const dir = join(projectRoot, ".cursor", "hooks");
    const p = join(dir, GATE_HOOK_SCRIPT_NAME);
    const prev = existsSync(p) ? readFileSync(p, "utf-8") : null;
    if (prev !== null && !prev.includes(GATE_HOOK_CONTENT_MARKER)) {
      console.warn(`[vibe-fence] .cursor/hooks/${GATE_HOOK_SCRIPT_NAME} exists and is not fence-managed — leaving it alone.`);
    } else {
      if (prev !== GATE_HOOK_SCRIPT) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(p, GATE_HOOK_SCRIPT, "utf-8");
        written.push(`.cursor/hooks/${GATE_HOOK_SCRIPT_NAME}`);
      }
      chmodSync(p, 0o755);
    }
    const legacy = join(dir, LEGACY_GATE_HOOK_NAME);
    if (existsSync(legacy) && readFileSync(legacy, "utf8").includes(GATE_HOOK_CONTENT_MARKER) && readFileSync(legacy, "utf8") !== LEGACY_GATE_WRAPPER) {
      writeFileSync(legacy, LEGACY_GATE_WRAPPER, "utf8");
      written.push(`.cursor/hooks/${LEGACY_GATE_HOOK_NAME}`);
    }
  }

  // 6. .fence/adapters/cursor.json — install receipt (host file keeps vendor keys only)
  {
    const receipt = writeAdapterReceipt(projectRoot, "cursor", {
      receipt: "vibe-fence Cursor adapter installed — host execution not verified",
    });
    if (receipt.changed) written.push(receipt.path.replace(projectRoot + "/", ""));
  }

  void readdirSync;
  return written;
}

export default cursorAdapter;
