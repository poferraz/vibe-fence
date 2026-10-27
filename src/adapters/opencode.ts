/**
 * src/adapters/opencode.ts — OpenCode adapter
 * S-13 Muse routing via AGENTS.md; S-14 eval harness; S-15 privacy default.
 * GEM-08 dual-tier routing; GEM-09 Standard-mode literal.
 *
 * Runtime contract (OpenCode-specific):
 * - Canonical policy: AGENTS.md (repo root) — OpenCode reads natively.
 * - Config: opencode.json is NEVER written — the vendor schema forbids extra
 *   keys (additionalProperties false, no `fence`); fence metadata lives in
 *   `.fence/adapters/opencode.json`. Legacy fence-managed keys are scrubbed.
 * - Hooks: .opencode/plugins/fence-guard.js (tool.execute.before) — minimal FP budget (S-10/C-01).
 * - Skills: ~/.config/opencode/skills/ (global) + .agents/skills/ (project)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";
import { scrubFenceKey, writeAdapterReceipt } from "./receipts";

export const openCodeAdapter: Adapter = {
  name: "opencode",
  label: "OpenCode",
  runtime: "opencode",
  agentsMapping: {
    canonical: "AGENTS.md",
    runtimePaths: ["AGENTS.md", "opencode.json", ".opencode/config.json"],
    precedence: "AGENTS.md canonical; opencode.json untouched (vendor schema forbids extra keys)",
  },
  hookSurface: {
    hooks: ["PreToolUse", "PreToolExecution"],
    fpBudgetNotes: "Minimal — PreToolUse/PreToolExecution only; lifecycle boundary per S-10/C-01.",
  },
  skillsDir: ".agents/skills",
};

export const OPENCODE_PLUGIN_NAME = "fence-guard.js";
export const OPENCODE_PLUGIN_MARKER = "vibe-fence managed plugin";

/**
 * Dependency-free OpenCode plugin (runs in OpenCode's Bun runtime).
 * Subscribes to `tool.execute.before` (stable plugin API per opencode.ai/docs/plugins)
 * and evaluates every tool call through `vibe-fence gate` — the same engine as
 * `vibe-fence check`, so the Enforced tier can never drift from Guarded.
 * Exit 1 blocks (throw); missing binary or usage error warns + allows, so a
 * broken install degrades to Guarded instead of bricking the session.
 */
export function buildFenceGuardPlugin(): string {
  return [
    "// vibe-fence managed plugin — safe to delete; reinstall via `vibe-fence init`.",
    "// Enforced tier: every tool call is evaluated by `vibe-fence gate` (SEC-01/SEC-02/NET-01).",
    'import { execFileSync } from "node:child_process";',
    "",
    "export const FenceGuard = async ({ directory, worktree } = {}) => {",
    '  const root = directory || worktree || null;',
    "  return {",
    '    "tool.execute.before": async (input, output) => {',
    '      const tool = input?.tool ?? input?.call?.name ?? "unknown";',
    "      const args = output?.args ?? input?.call?.input ?? {};",
    "      let serialized;",
    "      try {",
    "        serialized = JSON.stringify(args);",
    "      } catch {",
    "        console.warn(`[vibe-fence] unserializable args for ${tool} — allowing.`);",
    "        return;",
    "      }",
    '      const bin = process.env.FENCE_BIN || "vibe-fence";',
    '      const gateArgs = ["gate", "--tool", String(tool), "--args", serialized];',
    "      if (root) gateArgs.push(\"--root\", String(root));",
    "      try {",
    "        execFileSync(bin, gateArgs, {",
    '          encoding: "utf-8",',
    '          stdio: ["ignore", "pipe", "pipe"],',
    "        });",
    "      } catch (e) {",
    "        if (e?.status === 1) {",
    '          const reason = String(e?.stdout || "").trim() || "blocked by fence policy";',
    "          throw new Error(`vibe-fence blocked ${tool}: ${reason}`);",
    "        }",
    '        console.warn(`[vibe-fence] gate unavailable (${e?.message ?? e}) — allowing ${tool}.`);',
    "      }",
    "    },",
    "  };",
    "};",
    "",
  ].join("\n");
}

export function installOpenCodeAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = opts.modelMode ?? "standard";

  // 1. AGENTS.md — canonical router
  {
    const p = join(projectRoot, "AGENTS.md");
    const existing = existsSync(p) ? readFileSync(p, "utf-8") : null;
    const next = mergeAgentsMd(existing);
    if (next !== existing) { writeFileSync(p, next, "utf-8"); written.push("AGENTS.md"); }
  }

  // 2. opencode.json — NEVER written (L2: additionalProperties false, no `fence`
  // key). Scrub legacy fence-managed keys; never create the file, never touch
  // user keys. (The old `.opencode/config.json` fallback was dead — prior
  // versions always wrote root opencode.json — so only root is scrubbed.)
  {
    const p = join(projectRoot, "opencode.json");
    if (existsSync(p)) {
      try {
        const existing = JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown>;
        if (scrubFenceKey(existing)) {
          writeFileSync(p, JSON.stringify(existing, null, 2) + "\n", "utf-8");
          written.push("opencode.json");
        }
      } catch {
        // Unparseable host config — leave it alone, never clobber.
      }
    }
    const receipt = writeAdapterReceipt(projectRoot, "opencode", {
      model_mode: modelMode,
      companion_model: process.env["MUSE_MODEL_COMPANION"] ?? "muse-spark-1.3",
      architect_model: process.env["MUSE_MODEL_ARCHITECT"] ?? "muse-wonder-1.0",
      receipt: "🛡️ vibe-fence active — OpenCode adapter",
    });
    if (receipt.changed) written.push(receipt.path.replace(projectRoot + "/", ""));
  }

  // 3. .agents/skills/ dir
  {
    const dir = join(projectRoot, ".agents", "skills");
    if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  }

  // 4. .opencode/plugins/fence-guard.js — Enforced tier (tool.execute.before → vibe-fence gate)
  {
    const dir = join(projectRoot, ".opencode", "plugins");
    const p = join(dir, OPENCODE_PLUGIN_NAME);
    const next = buildFenceGuardPlugin();
    const prev = existsSync(p) ? readFileSync(p, "utf-8") : null;
    if (prev !== null && !prev.includes(OPENCODE_PLUGIN_MARKER)) {
      console.warn(`[vibe-fence] ${".opencode/plugins/" + OPENCODE_PLUGIN_NAME} exists and is not fence-managed — leaving it alone.`);
    } else if (prev !== next) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(p, next, "utf-8");
      written.push(`.opencode/plugins/${OPENCODE_PLUGIN_NAME}`);
    }
  }

  void buildAgentsFenceBlock;
  return written;
}

export default openCodeAdapter;
