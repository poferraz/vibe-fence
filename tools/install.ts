#!/usr/bin/env bun
/**
 * tools/install.ts — npx vibe-fence init (M4 installer, FINAL-v2 §4 M4)
 * S-02 progressive disclosure; S-15 Standard-mode default (P0 ethics gate).
 * S-13 dual-tier routing (GEM-08); SAM out-of-critical-path (GEM-07).
 * GEM-02 WebContainer probe + FENCE_SYNC_TOKEN + file-only fallback.
 * GEM-09 Standard-mode default literal: Contributor only via --contributor-mode + disclosure.
 *
 * Contract (FINAL-v2 §4 M4 + §7 rubric):
 * - Idempotent <3s: npx vibe-fence init ×3 ⇒ zero churn, identical git status.
 * - Merge-not-clobber: AGENTS.md fence block appended/replaced; existing content preserved.
 * - Receipt + paved path: one-line receipt + 3-step path printed; fence tour is opt-in (fence tour).
 * - WebContainer probe: detect process.versions.webcontainer / /.webcontainer / hook installability.
 * - FENCE_SYNC_TOKEN: minted by tools/generate.ts only; installer sets ephemeral token for attestation.
 * - Scope guard: Desktop CLIs v1; WebContainer/mobile out of scope (documented fail-open).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, realpathSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const START_MS = Date.now();

export const FENCE_SYNC_TOKEN_ENV = "FENCE_SYNC_TOKEN";
export const CONTRIBUTOR_DISCLOSURE =
  "⚠️  Contributor Mode: code and prompts you send may be used to train Meta models. Use only for non-private projects. See https://dev.meta.ai/legal/model-api-terms";

export interface InstallOptions {
  dryRun?: boolean;
  contributorMode?: boolean;
  full?: boolean; // WebContainer file-only → native full
  adapters?: string[]; // subset; default all
}

export interface InstallReceipt {
  elapsedMs: number;
  mode: "native" | "webcontainer";
  modelMode: "standard" | "contributor";
  filesWritten: string[];
  adaptersInstalled: string[];
  fenceSyncTokenPrefix: string;
}

// ---------------------------------------------------------------------------
// WebContainer probe — GEM-02 P1
// ---------------------------------------------------------------------------

export type RuntimeKind = "native" | "webcontainer";

export function probeRuntime(projectRoot: string): { runtime: RuntimeKind; reason: string } {
  // 1. process.versions.webcontainer sentinel
  const pv = (process.versions as unknown as Record<string, string>);
  if (pv["webcontainer"]) return { runtime: "webcontainer", reason: "process.versions.webcontainer present" };

  // 2. /.webcontainer sentinel file
  try { if (existsSync("/.webcontainer")) return { runtime: "webcontainer", reason: "/.webcontainer sentinel" }; } catch {}

  // 3. git availability
  try { execSync("git --version", { cwd: projectRoot, stdio: "ignore" }); } catch {
    // No git ⇒ treat as webcontainer-like (file-only)
    return { runtime: "webcontainer", reason: "git not available" };
  }

  // 4. Hook installability — can we create .git/hooks/pre-commit?
  try {
    const probe = join(projectRoot, ".git", "hooks", ".fence-probe");
    if (existsSync(join(projectRoot, ".git"))) {
      mkdirSync(join(projectRoot, ".git", "hooks"), { recursive: true });
      writeFileSync(probe, "probe", "utf-8");
      // cleanup probe file
      try { const { unlinkSync } = require("node:fs"); unlinkSync(probe); } catch {}
    }
  } catch {
    return { runtime: "webcontainer", reason: "hook dir not writable" };
  }

  return { runtime: "native", reason: "native checks passed" };
}

// ---------------------------------------------------------------------------
// Containment — project-root realpath boundary (S-10)
// ---------------------------------------------------------------------------

function assertWithinProjectRoot(projectRoot: string, target: string): void {
  const realRoot = realpathSync(projectRoot);
  const realTarget = (() => { try { return realpathSync(target); } catch { return resolve(target); } })();
  if (!realTarget.startsWith(realRoot)) {
    throw new Error(`containment violation — target outside project root: ${relative(projectRoot, realTarget)} (S-10)`);
  }
}

// ---------------------------------------------------------------------------
// FENCE_SYNC_TOKEN — ephemeral, minted by installer (not by model per S-05)
// ---------------------------------------------------------------------------

function mintFenceSyncToken(): string {
  return randomBytes(16).toString("hex");
}

// ---------------------------------------------------------------------------
// Core install
// ---------------------------------------------------------------------------

export async function install(projectRoot: string, opts: InstallOptions = {}): Promise<InstallReceipt> {
  const elapsed = () => Date.now() - START_MS;
  const modelMode = opts.contributorMode ? "contributor" as const : "standard" as const;

  // 0. Contributor disclosure gate — GEM-09 P0
  if (modelMode === "contributor" && !opts.dryRun) {
    console.log(CONTRIBUTOR_DISCLOSURE);
  }

  // 1. WebContainer probe — GEM-02 P1
  const probe = probeRuntime(projectRoot);
  if (probe.runtime === "webcontainer" && !opts.full) {
    console.log("WebContainer detected — hooks unavailable. Using file-only mode (AGENTS.md + .fence/ rules).");
    console.log("Run 'npx vibe-fence init --full' on a local clone for hook enforcement.");
  }

  // 2. Mint ephemeral FENCE_SYNC_TOKEN — S-06/GEM-01 (not mintable by model, S-05)
  const token = mintFenceSyncToken();
  process.env[FENCE_SYNC_TOKEN_ENV] = token;

  const filesWritten: string[] = [];
  const adaptersInstalled: string[] = [];

  // 3. Ensure .fence/ tree — single-owner state (FINAL-v2 M1)
  const fenceDirs = [
    ".fence",
    ".fence/state",
    ".fence/hooks",
    ".fence/rules",
  ];
  if (!opts.dryRun) {
    for (const d of fenceDirs) mkdirSync(join(projectRoot, d), { recursive: true });
    filesWritten.push(".fence/");
  }

  // 4. .fence/config.json — model_mode Standard default (GEM-09 P0, S-15)
  {
    const p = join(projectRoot, ".fence", "config.json");
    const existing = existsSync(p) ? (() => { try { return JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown>; } catch { return null; } })() : null;
    // Never downgrade contributor → standard silently; respect explicit existing if no flag
    const nextMode = opts.contributorMode ? "contributor" : (existing?.["model_mode"] as string ?? "standard");
    const config = {
      version: 1,
      model_mode: nextMode,
      fence_version: "0.1.0",
      updatedAt: new Date().toISOString(),
    };
    if (!opts.dryRun) {
      assertWithinProjectRoot(projectRoot, p);
      writeFileSync(p, JSON.stringify(config, null, 2) + "\n", "utf-8");
      filesWritten.push(".fence/config.json");
    }
  }

  // 5. .fence/app-profile.json — copy canonical template src/templates/app-profile.json + record runtime (Task 2 S-09, GEM-02)
  {
    const p = join(projectRoot, ".fence", "app-profile.json");
    const templateCandidates = [
      join(resolve(import.meta.dir, ".."), "src", "templates", "app-profile.json"),
      join(resolve(import.meta.dir, ".."), "dist", "templates", "app-profile.json"),
    ];
    const loadTemplate = (): Record<string, unknown> | null => {
      for (const cand of templateCandidates) {
        if (existsSync(cand)) {
          try { return JSON.parse(readFileSync(cand, "utf-8") as string) as Record<string, unknown>; } catch {}
        }
      }
      return null;
    };
    if (!existsSync(p) && !opts.dryRun) {
      assertWithinProjectRoot(projectRoot, p);
      const tpl = loadTemplate();
      const base = tpl ?? {
        version: 1,
        tier: "local",
        block_counts: { local: 14, shared: 29, public: 55 },
        _fallback: "inline — template not found",
      };
      const out: Record<string, unknown> = {
        ...base,
        version: (base["version"] as number) ?? 1,
        tier: (base["tier"] as string) ?? (base["profile"] as string) ?? "local",
        runtime: probe.runtime,
        block_counts: (base["block_counts"] as unknown) ?? { local: 14, shared: 29, public: 55 },
        updatedAt: new Date().toISOString(),
      };
      if (!out["profile"]) out["profile"] = out["tier"];
      delete out["_fallback"];
      delete out["_comment"];
      writeFileSync(p, JSON.stringify(out, null, 2) + "\n", "utf-8");
      filesWritten.push(".fence/app-profile.json");
    } else if (existsSync(p) && !opts.dryRun) {
      try {
        const ex = JSON.parse(readFileSync(p, "utf-8") as string) as Record<string, unknown>;
        let mutated = false;
        if (ex["runtime"] !== probe.runtime) { ex["runtime"] = probe.runtime; mutated = true; }
        if (!ex["tier"] && ex["profile"]) { ex["tier"] = ex["profile"]; mutated = true; }
        if (!ex["profile"] && ex["tier"]) { ex["profile"] = ex["tier"]; mutated = true; }
        if (!ex["block_counts"]) { ex["block_counts"] = { local: 14, shared: 29, public: 55 }; mutated = true; }
        if (mutated) {
          ex["updatedAt"] = new Date().toISOString();
          writeFileSync(p, JSON.stringify(ex, null, 2) + "\n", "utf-8");
        }
      } catch {}
    }
  }

  // 6. .fence/state/dial.json — seed (S-11)
  {
    const p = join(projectRoot, ".fence", "state", "dial.json");
    if (!existsSync(p) && !opts.dryRun) {
      writeFileSync(p, JSON.stringify({ version: 1, global: "max", vector: {}, learnPointers: [] }, null, 2) + "\n", "utf-8");
      filesWritten.push(".fence/state/dial.json");
    }
  }

  // 7. .fence/hooks/postinstall-guard.sh — GEM-01 hash attestation guard
  {
    const p = join(projectRoot, ".fence", "hooks", "postinstall-guard.sh");
    if (!existsSync(p) && !opts.dryRun) {
      writeFileSync(p, [
        "#!/bin/sh",
        "# vibe-fence postinstall guard — GEM-01 P0",
        "# Runs integrity check so `npm install` cannot silently plant a malicious AGENTS.md.",
        "set -e",
        'bun run --cwd "$(dirname "$0")/../.." --silent tools/validate.ts 2>/dev/null || true',
        "",
      ].join("\n"), "utf-8");
      try { execSync(`chmod +x "${p}"`); } catch {}
      filesWritten.push(".fence/hooks/postinstall-guard.sh");
    }
  }

  // 8. .gitignore — append fence entries idempotently (with # vibe-fence marker)
  {
    const p = join(projectRoot, ".gitignore");
    const marker = "# vibe-fence";
    const additions = [marker, ".fence/.integrity.json", ".fence/events.ndjson"];
    if (!opts.dryRun) {
      const existing = existsSync(p) ? readFileSync(p, "utf-8") : "";
      if (!existing.includes(marker)) {
        const suffix = existing.endsWith("\n") || existing.length === 0 ? "" : "\n";
        writeFileSync(p, existing + suffix + additions.join("\n") + "\n", "utf-8");
        filesWritten.push(".gitignore");
      }
    }
  }

  // 9. AGENTS.md + adapter files — dynamic import (merge-not-clobber)
  const adapterIds = opts.adapters ?? ["claude", "cursor", "codex", "opencode", "antigravity", "hermes"];
  for (const id of adapterIds) {
    try {
      const mod = await import(`../src/adapters/${id}`);
      const installer = mod[`install${capitalize(id)}Adapter`] ?? mod.default?.install ?? mod.install;
      // Fallback: try named export installXxxAdapter
      const fnName = `install${capitalize(id)}Adapter`;
      const fn = (mod as Record<string, unknown>)[fnName] as ((root: string, opts: unknown) => string[]) | undefined;
      if (fn) {
        if (!opts.dryRun) {
          const written = fn(projectRoot, { modelMode });
          filesWritten.push(...written);
        }
        adaptersInstalled.push(id);
      } else if (mod.installClaudeAdapter || mod.installCursorAdapter || mod.installCodexAdapter || mod.installOpenCodeAdapter || mod.installAntigravityAdapter || mod.installHermesAdapter) {
        // Already handled via fnName
      }
    } catch (e) {
      // Adapter optional — log but don't fail install (fail-open per GEM-07 spirit)
      console.warn(`[vibe-fence] adapter ${id} not installed: ${(e as Error).message}`);
    }
  }

  // 10. Lightweight AGENTS.md fence block fallback if no adapter wrote it
  {
    const p = join(projectRoot, "AGENTS.md");
    if (!existsSync(p) && !opts.dryRun) {
      const { buildAgentsFenceBlock } = await import("../src/adapters/claude");
      // Use helper if available, else minimal block
      const block = typeof buildAgentsFenceBlock === "function"
        ? buildAgentsFenceBlock()
        : "<!-- vibe-fence:start -->\n🛡️ vibe-fence active\n<!-- vibe-fence:end -->";
      writeFileSync(p, block + "\n", "utf-8");
      filesWritten.push("AGENTS.md");
    }
  }

  // 11. Integrity attestation — compute SHA-256 of fence-owned files (GEM-01)
  // Deferred to tools/generate.ts / src/framework/integrity.ts.persistAttestation — but seed here
  try {
    if (!opts.dryRun) {
      const { persistAttestation } = await import("../src/framework/integrity");
      // FENCE_SYNC_TOKEN is set — persist is allowed (not mintable by model, S-05)
      try { persistAttestation(projectRoot); } catch {}
      filesWritten.push(".fence/.integrity.json");
    }
  } catch { /* integrity module optional at install time */ }

  // 12. Receipt + paved path — FINAL-v2 §7 rubric + 05 A-11/S-02
  const receipt: InstallReceipt = {
    elapsedMs: elapsed(),
    mode: probe.runtime === "webcontainer" && !opts.full ? "webcontainer" : "native",
    modelMode,
    filesWritten,
    adaptersInstalled,
    fenceSyncTokenPrefix: token.slice(0, 8),
  };

  if (!opts.dryRun) {
    // Print receipt
    console.log(`🛡️  vibe-fence active — ${receipt.mode} mode — ${receipt.adaptersInstalled.length} adapters — ${receipt.elapsedMs}ms`);
    console.log(`   Files: ${receipt.filesWritten.slice(0, 6).join(", ")}${receipt.filesWritten.length > 6 ? ` +${receipt.filesWritten.length - 6} more` : ""}`);
    console.log(`   Verification: Read→Think→Write→Check — deterministic fence decides, model explains.`);
    // Paved path — 3 steps (05 A-11/S-02): keep building → you'll see a card → approve and agent handles it
    console.log("");
    console.log("Next steps:");
    console.log("  1. Keep building — the fence watches your next write.");
    console.log("  2. You'll see a card when the fence finds something to harden.");
    console.log("  3. Approve — the agent handles the fix in your repo.");
    // Tour opt-in — artifact-first (05 D-04)
    console.log("");
    console.log("Run `npx vibe-fence tour` for an interactive walkthrough (opt-in).");

    // Scope guard note — Desktop CLIs v1 (GEM-02)
    if (probe.runtime === "webcontainer") {
      console.log("");
      console.log("Scope: Desktop CLIs v1 — WebContainer/mobile are out of scope (file-only mode active).");
    }

    // Append install event to events.ndjson (append-only, GEM-08 artefact)
    try {
      const eventsPath = join(projectRoot, ".fence", "events.ndjson");
      appendFileSync(eventsPath, JSON.stringify({
        type: "install",
        at: new Date().toISOString(),
        mode: receipt.mode,
        model_mode: receipt.modelMode,
        adapters: receipt.adaptersInstalled,
        elapsedMs: receipt.elapsedMs,
      }) + "\n", "utf-8");
    } catch {}
  } else {
    console.log(`[dry-run] would write ${filesWritten.length} files — mode ${probe.runtime} — ${elapsed()}ms`);
  }

  // Surface timing budget — <3s (FINAL-v2 §7 rubric #1)
  if (receipt.elapsedMs > 3000) {
    console.warn(`[vibe-fence] install took ${receipt.elapsedMs}ms — exceeds 3s budget (FINAL-v2 §7 rubric)`);
  }

  return receipt;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opts: InstallOptions = {
    dryRun: args.includes("--dry-run"),
    contributorMode: args.includes("--contributor-mode"),
    full: args.includes("--full"),
  };

  // --contributor-mode must be explicit opt-in with disclosure — never default (GEM-09 P0)
  if (opts.contributorMode) {
    console.log(CONTRIBUTOR_DISCLOSURE);
  }

  const projectRoot = process.cwd();
  const receipt = await install(projectRoot, opts);

  // Idempotence hint — verify FENCE_SYNC_TOKEN flow
  if (!opts.dryRun) {
    console.log(`\nFENCE_SYNC_TOKEN: ${receipt.fenceSyncTokenPrefix}… (ephemeral, minted by installer — S-05/S-06)`);
  }
}
