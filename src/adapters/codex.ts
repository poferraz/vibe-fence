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

import { existsSync, lstatSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Adapter } from "./types";
import { buildAgentsFenceBlock, mergeAgentsMd } from "./claude";
import { scrubFenceKey, writeAdapterReceipt } from "./receipts";
import { buildCodexGateHook, CODEX_GATE_COMMAND, CODEX_GATE_FILE, CODEX_GATE_MARKER, CODEX_GATE_MATCHER } from "./codex-gate";

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
    hooks: ["PreToolUse"],
    fpBudgetNotes: "Bash and apply_patch only; project trust and host execution must be verified.",
  },
  skillsDir: ".agents/skills",
};

// NOTE: no merge function — .codex/config.json is never written. Legacy
// fence-managed keys are scrubbed by the installer (see below).

export function installCodexAdapter(projectRoot: string, opts: { modelMode?: string } = {}): string[] {
  const written: string[] = [];
  const modelMode = opts.modelMode ?? "standard";
  const codexDir = join(projectRoot, ".codex");
  const isSymlink = (path: string): boolean => {
    try { return lstatSync(path).isSymbolicLink(); } catch { return false; }
  };
  const unsafeCodexPath = [codexDir, join(codexDir, "hooks"), join(codexDir, "hooks.json"), join(codexDir, "hooks", CODEX_GATE_FILE), join(codexDir, "config.json")].some(isSymlink);
  if (unsafeCodexPath) console.warn("[vibe-fence] Codex configuration contains a symlink; leaving it unchanged.");

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

  // 4. Install a project-local PreToolUse hook without replacing user hooks.
  {
    const dir = join(projectRoot, ".codex");
    const hooksPath = join(dir, "hooks.json");
    const scriptPath = join(dir, "hooks", CODEX_GATE_FILE);
    const previousScript = !unsafeCodexPath && existsSync(scriptPath) ? readFileSync(scriptPath, "utf-8") : null;
    if (unsafeCodexPath) {
      // Never write through a symlinked host configuration path.
    } else if (previousScript !== null && !previousScript.includes(CODEX_GATE_MARKER)) {
      console.warn("[vibe-fence] Codex hook script is user-managed; leaving it unchanged.");
    } else {
      try {
        const raw = existsSync(hooksPath) ? JSON.parse(readFileSync(hooksPath, "utf-8")) : {};
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid hooks config");
        const hooks = raw.hooks ?? {};
        if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) throw new Error("invalid hooks object");
        const existing = hooks.PreToolUse ?? [];
        if (!Array.isArray(existing)) throw new Error("invalid PreToolUse hooks");
        const isOurs = (entry: unknown): boolean => {
          if (!entry || typeof entry !== "object") return false;
          const handlers = (entry as { hooks?: unknown }).hooks;
          return Array.isArray(handlers) && handlers.some((h: unknown) =>
            !!h && typeof h === "object" && (h as { command?: unknown }).command === CODEX_GATE_COMMAND);
        };
        const next = { ...raw, hooks: { ...hooks, PreToolUse: [
          ...existing.filter((entry: unknown) => !isOurs(entry)),
          { matcher: CODEX_GATE_MATCHER, hooks: [{ type: "command", command: CODEX_GATE_COMMAND, timeout: 15 }] },
        ] } };
        const config = JSON.stringify(next, null, 2) + "\n";
        const script = buildCodexGateHook();
        mkdirSync(join(dir, "hooks"), { recursive: true });
        if (previousScript !== script) { writeFileSync(scriptPath, script, "utf-8"); written.push(`.codex/hooks/${CODEX_GATE_FILE}`); }
        if (!existsSync(hooksPath) || readFileSync(hooksPath, "utf-8") !== config) {
          writeFileSync(hooksPath, config, "utf-8"); written.push(".codex/hooks.json");
        }
      } catch {
        console.warn("[vibe-fence] Codex hooks configuration is invalid; leaving it unchanged.");
      }
    }
  }

  // 5. .codex/config.json — NEVER written (host keys only). Scrub legacy
  // fence-managed keys; never create the file, never touch user keys.
  {
    const p = join(projectRoot, ".codex", "config.json");
    if (!unsafeCodexPath && existsSync(p)) {
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
      receipt: "vibe-fence Codex adapter installed — hook trust and execution not verified",
    });
    if (receipt.changed) written.push(receipt.path.replace(projectRoot + "/", ""));
  }

  void buildAgentsFenceBlock;
  return written;
}

export default codexAdapter;
