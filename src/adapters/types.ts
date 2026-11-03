/**
 * src/adapters/types.ts — Adapter registry (canonical authority per GEM-03).
 *
 * Inline ADAPTERS array is the single source of truth; per-runtime YML files
 * in src/adapters/*.yml are REFERENCE overrides (tooling/inspection only).
 * YML mirrors: window, skillsDir, hookSurface, modelHint (C-03 frontier-conditional
 * surface). Spec: FINAL-v4 S-02 (Skills), S-03 (Context budget), S-13 (Muse routing).
 *
 * See also: src/framework/context-budget.yml (budget buckets scaled per adapter window).
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type AdapterRuntime =
  | "claude-code"
  | "codex"
  | "cursor"
  | "opencode"
  | "hermes"
  | "antigravity";

export type HookKind =
  | "PreToolUse"
  | "PostToolUse"
  | "PreToolExecution"
  | "PostToolExecution"
  | "preToolUse"
  | "postToolUse"; // lowercase: Cursor hooks.json event names (verified Oct 26)

export interface HookSurface {
  hooks: HookKind[];
  fpBudgetNotes?: string;
}

export interface AgentsMapping {
  canonical: string;
  runtimePaths: string[];
  precedence?: string;
}

/**
 * Window profile — context window tokens for S-03 budget scaling.
 * Adapters override the global total_tokens in context-budget.yml per-runtime.
 */
export interface AdapterWindow {
  total_tokens: number;
  note?: string;
}

/**
 * C-03 frontier-conditional surface hint.
 * Frontier models (Claude/GPT-5/Gemini) use thin bash-only surface;
 * weaker/open-weight models use richer filtered tools (4× SWE-bench lift).
 */
export interface ModelHint {
  tier: "frontier" | "weak";
  surface: "thin" | "rich";
  description?: string;
  fallback?: string;
}

export interface Adapter {
  name: AdapterRuntime;
  label: string;
  runtime: string;
  agentsMapping: AgentsMapping;
  hookSurface: HookSurface;
  skillsDir: string;
  /** Optional window override (S-03); present in YML profiles, absent in inline authority. */
  window?: AdapterWindow;
  /** Optional C-03 model-tier hint (frontier-conditional surface). */
  modelHint?: ModelHint;
}

export const ADAPTERS: Adapter[] = [
  {
    name: "claude-code",
    label: "Claude Code",
    runtime: "claude-code",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md", ".agents/AGENTS.md", "MEMORY.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.claude/skills",
  },
  {
    name: "codex",
    label: "Codex CLI/IDE",
    runtime: "codex",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md", ".codex/AGENTS.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.agents/skills",
  },
  {
    name: "cursor",
    label: "Cursor",
    runtime: "cursor",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: [".cursor/rules", ".cursorrules"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.cursor/skills",
  },
  {
    name: "opencode",
    label: "OpenCode",
    runtime: "opencode",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md"] },
    hookSurface: { hooks: ["PreToolUse", "PreToolExecution"] },
    skillsDir: "~/.config/opencode/skills",
  },
  {
    name: "hermes",
    label: "Hermes Agent",
    runtime: "hermes",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md", ".hermes/AGENTS.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.hermes/skills",
  },
  {
    name: "antigravity",
    label: "Antigravity",
    runtime: "antigravity",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: [".agents/rules/antigravity.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.gemini/antigravity/skills",
  },
];

export function getAdapter(name: AdapterRuntime): Adapter | undefined {
  return ADAPTERS.find((a) => a.name === name);
}

// ---------------------------------------------------------------------------
// loadAdapterProfile — optional YML override reader (GEM-03, Task 6)
// ---------------------------------------------------------------------------

/**
 * Minimal YAML parser for the adapter profile shape (no runtime deps).
 * Handles only the subset used in src/adapters/*.yml: scalars, nested maps,
 * and simple string arrays (indented `- ` items). Not a general YAML parser.
 */
function parseSimpleYaml(text: string): Record<string, unknown> {
  const lines = text.split("\n");
  const root: Record<string, unknown> = {};
  // stack of { indent, obj, key for pending array }
  type Frame = { indent: number; obj: Record<string, unknown>; arrayKey?: string; arrayIndent?: number };
  const stack: Frame[] = [{ indent: -1, obj: root }];

  function currentFrame(): Frame {
    return stack[stack.length - 1]!;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const indent = raw.length - raw.trimStart().length;

    // Pop frames that are no longer parent (strictly greater indent stays)
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }

    // Array item: "- value" or "- key: value"
    if (trimmed.startsWith("- ")) {
      const frame = currentFrame();
      if (frame.arrayKey) {
        const arr = frame.obj[frame.arrayKey] as unknown[];
        arr.push(trimmed.slice(2).trim());
      }
      continue;
    }

    // Key with value or key with nested block
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const valPart = trimmed.slice(colonIdx + 1).trim();

    if (valPart === "") {
      // Nested block — could be map or array; peek next non-empty line
      let isArray = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nt = lines[j]!.trim();
        if (nt === "" || nt.startsWith("#")) continue;
        if (nt.startsWith("- ")) isArray = true;
        break;
      }
      if (isArray) {
        currentFrame().obj[key] = [];
        // push frame with arrayKey so "- " lines know where to go
        stack.push({ indent, obj: currentFrame().obj, arrayKey: key });
      } else {
        const child: Record<string, unknown> = {};
        currentFrame().obj[key] = child;
        stack.push({ indent, obj: child });
      }
    } else {
      // Scalar value — strip quotes, parse numbers
      let val: unknown = valPart.replace(/^["']|["']$/g, "");
      if (/^-?\d+$/.test(val as string)) val = Number(val);
      currentFrame().obj[key] = val;
    }
  }
  return root;
}

/**
 * Load an adapter profile from its YML file (REFERENCE override).
 *
 * Inline `ADAPTERS` in this file remains the canonical authority (GEM-03);
 * YML is optional data for tooling/inspection and may extend the adapter
 * with `window` and `modelHint` fields. Returns `undefined` if the YML
 * file does not exist; callers should fall back to `getAdapter()`.
 *
 * @param name - Adapter runtime id (filename stem; e.g. "claude" → claude.yml).
 * @param baseDir - Directory containing the YML files (defaults to this file's dir).
 *
 * @example
 * ```ts
 * const profile = loadAdapterProfile("claude");
 * const adapter = profile ?? getAdapter("claude-code");
 * ```
 */
export function loadAdapterProfile(
  name: string,
  baseDir?: string,
): Adapter | undefined {
  const dir =
    baseDir ??
    (() => {
      try {
        return dirname(fileURLToPath(import.meta.url));
      } catch {
        return "src/adapters";
      }
    })();
  const file = join(dir, `${name}.yml`);
  if (!existsSync(file)) return undefined;
  try {
    const text = readFileSync(file, "utf8");
    const data = parseSimpleYaml(text) as unknown as Adapter;
    // Minimal validation: must have at least `name` and `runtime`
    if (!data.name || !data.runtime) return undefined;
    return data;
  } catch {
    return undefined;
  }
}
