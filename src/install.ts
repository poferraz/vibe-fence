#!/usr/bin/env node
/**
 * src/install.ts — vibe-fence installer core (authority; tools/install.ts is a thin shim).
 * Moved from tools/ Oct 28 so the packed CLI (dist/cli.js bundle) ships zero
 * tools/ dependency and runs on plain Node 20+ with no bun binary.
 * M4 installer, FINAL-v2 §4 M4; S-02 progressive disclosure; S-15 Standard-mode
 * default (P0 ethics gate); S-13 dual-tier routing (GEM-08).
 * GEM-02 WebContainer probe + FENCE_SYNC_TOKEN + file-only fallback.
 * GEM-09 Standard-mode default literal: Contributor only via --contributor-mode + disclosure.
 *
 * Contract (FINAL-v2 §4 M4 + §7 rubric):
 * - Idempotent <3s: init ×3 ⇒ zero churn, identical git status.
 * - Merge-not-clobber: AGENTS.md fence block appended/replaced; existing content preserved.
 * - Receipt + paved path: one-line receipt + 3-step path printed; fence tour is opt-in.
 * - WebContainer probe: detect process.versions.webcontainer / /.webcontainer / hook installability.
 * - FENCE_SYNC_TOKEN: minted by installer only; never by the model (S-05).
 * - Scope guard: Desktop CLIs v1; WebContainer/mobile out of scope (documented fail-open).
 * - Node-compatible: no bun-only APIs (no import.meta.dir/main) — this file is bundled.
 */

import { chmodSync, existsSync, lstatSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync, unlinkSync } from "node:fs";
import { basename, join, resolve, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { execSync, execFileSync } from "node:child_process";
import { installClaudeAdapter, buildAgentsFenceBlock } from "./adapters/claude.js";
import { installCursorAdapter } from "./adapters/cursor.js";
import { installCodexAdapter } from "./adapters/codex.js";
import { installOpenCodeAdapter } from "./adapters/opencode.js";
import { installAntigravityAdapter } from "./adapters/antigravity.js";
import { installHermesAdapter } from "./adapters/hermes.js";
import { persistAttestation } from "./framework/integrity.js";
import { installGitHooks, inspectGitHooks, effectiveHooksDir, canonicalPath, commonHooksDir, hooksRepairCommand, hooksRepairNote } from "./framework/git-hooks.js";

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

export type AdapterInstaller = (projectRoot: string, opts: { modelMode?: string }) => string[];

// Explicit id → installer map. No name-mangling lookup: `capitalize("opencode")`
// produced installOpencodeAdapter ≠ installOpenCodeAdapter and silently skipped
// the OpenCode adapter (Oct 28 fix).
export const ADAPTERS: Record<string, AdapterInstaller> = {
  claude: installClaudeAdapter,
  cursor: installCursorAdapter,
  codex: installCodexAdapter,
  opencode: installOpenCodeAdapter,
  antigravity: installAntigravityAdapter,
  hermes: installHermesAdapter,
};

export const DEFAULT_ADAPTER_IDS = Object.keys(ADAPTERS);

/** Dir of this module: src/ in dev, dist/ in the packed bundle (skills/templates ship beside it). */
export function hereDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** Fence-specific markers of the pre-fix guard shims (generic `|| true` excluded — users write that too). */
export function isLegacyPostinstallGuard(content: string): boolean {
  return content.includes("tools/validate.ts") || content.includes("integrity.js");
}

/** Minimal guard when the template file is missing (degraded but correct: check, loud, graceful). */
const POSTINSTALL_GUARD_FALLBACK = [
  "#!/bin/sh",
  "# vibe-fence postinstall guard (managed fallback) — reinstall via `vibe-fence init`.",
  "set -e",
  'BIN=""',
  'if [ -n "$FENCE_BIN" ]; then case "$FENCE_BIN" in *"/"*) [ -x "$FENCE_BIN" ] && BIN="$FENCE_BIN" || true ;; *) BIN=$(command -v "$FENCE_BIN" || true) ;; esac; fi',
  'if [ -z "$BIN" ]; then BIN=$(command -v vibe-fence || true); fi',
  'if [ -n "$BIN" ]; then exec "$BIN" check; else echo "vibe-fence: postinstall guard skipped — binary not found." >&2; echo "vibe-fence: WARNING: install ran WITHOUT the fence; run \'vibe-fence check\' before building." >&2; exit 0; fi',
  "",
].join("\n");

/** Template-owned guard content (src/templates/postinstall-guard.sh ships beside this module). */
export function loadPostinstallGuard(): string {
  const override = process.env["VIBE_FENCE_TEMPLATES_DIR"];
  const p = join(override ?? hereDir(), "templates", "postinstall-guard.sh");
  try {
    if (existsSync(p)) return readFileSync(p, "utf-8");
  } catch {
    // Fall through to the inline fallback.
  }
  return POSTINSTALL_GUARD_FALLBACK;
}

// ---------------------------------------------------------------------------
// WebContainer probe — GEM-02 P1
// ---------------------------------------------------------------------------

export type RuntimeKind = "native" | "webcontainer";

export function probeRuntime(projectRoot: string, dryRun = false): { runtime: RuntimeKind; reason: string } {
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

  // Dry runs must not create a hooks directory or a probe file.
  if (dryRun) return { runtime: "native", reason: "hook writability not probed in dry run" };

  // 4. Hook installability — can we create a probe in the effective hooks dir?
  // Uses `git rev-parse --git-path hooks` so linked worktrees (`.git` is a
  // file) and project-local core.hooksPath resolve correctly. An outside-
  // project hooks dir (global redirect) is not probed or created here; the
  // Git-hook step reports it degraded instead of touching global state.
  try {
    if (existsSync(join(projectRoot, ".git"))) {
      const hooksDir = effectiveHooksDir(projectRoot);
      const info = hooksDir ? inspectGitHooks(projectRoot) : null;
      if (hooksDir && info && !info.blockedOutside) {
        mkdirSync(hooksDir, { recursive: true });
        const probe = join(hooksDir, `.fence-probe-${randomBytes(16).toString("hex")}`);
        writeFileSync(probe, "probe", { encoding: "utf-8", flag: "wx" });
        try { unlinkSync(probe); } catch {}
      }
    }
  } catch {
    return { runtime: "webcontainer", reason: "hook dir not writable" };
  }

  return { runtime: "native", reason: "native checks passed" };
}

// ---------------------------------------------------------------------------
// Containment — project-root realpath boundary (S-10)
// ---------------------------------------------------------------------------

/**
 * Containment through canonical paths. Both sides canonicalize via the
 * nearest existing ancestor, so a project opened through a symlinked path
 * (/var → /private/var on macOS) is inside itself, while a target that
 * escapes through a symlinked ancestor resolves outside and is denied.
 */
export function isWithinProjectRoot(projectRoot: string, target: string): boolean {
  try {
    const realRoot = canonicalPath(projectRoot);
    const realTarget = canonicalPath(target);
    return realTarget === realRoot || realTarget.startsWith(realRoot + sep);
  } catch {
    return false;
  }
}

function assertWithinProjectRoot(projectRoot: string, target: string): void {
  if (!isWithinProjectRoot(projectRoot, target)) {
    throw new Error(`containment violation — target outside project root or unresolvable: ${relative(projectRoot, target)} (S-10)`);
  }
}

// ---------------------------------------------------------------------------
// FENCE_SYNC_TOKEN — ephemeral, minted by installer (not by model per S-05)
// ---------------------------------------------------------------------------

function mintFenceSyncToken(): string {
  return randomBytes(16).toString("hex");
}

// ---------------------------------------------------------------------------
// Safe project setup — .gitignore env coverage + tracked-env report
// ---------------------------------------------------------------------------

export const GITIGNORE_MARKER = "# vibe-fence";
/** Ignore entries the fence owns: fence state + local env files. `.env.example` is deliberately not covered. */
export const GITIGNORE_ENTRIES = [
  ".fence/.integrity.json",
  ".fence/events.ndjson",
  ".env",
  ".env.local",
  ".env.*.local",
] as const;

/** Env-file basename? Mirrors SEC-03: `.env*` except `.env.example*`. */
function isSensitiveEnvPath(rel: string): boolean {
  const base = rel.replace(/\\/g, "/").split("/").pop() ?? "";
  if (/\.example(\.|$)/i.test(base)) return false;
  return /^\.env(\.|$)/i.test(base);
}

/**
 * Append the complete owned block last so it wins over earlier root-level
 * negations without attempting to emulate Git's pattern semantics. Existing
 * bytes are preserved and an unchanged trailing block is byte-idempotent.
 * Nested .gitignore files can override it; Git ignores do not untrack files.
 * The block does not ignore `.env.example` (user rules may still do so).
 */
export function ensureGitignore(projectRoot: string): string[] {
  const p = join(projectRoot, ".gitignore");
  // Git does not follow .gitignore symlinks, even when their target is inside
  // the project. Refuse them instead of claiming ineffective protection.
  try {
    if (lstatSync(p).isSymbolicLink()) throw new Error("containment violation — .gitignore is a symlink; Git will not read it");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  // Never follow a .gitignore symlink out of the project: reading is safe to
  // refuse, writing through it would modify a file outside the root.
  if (!isWithinProjectRoot(projectRoot, p)) {
    throw new Error(`containment violation — .gitignore resolves outside project root (S-10)`);
  }
  const existing = existsSync(p) ? readFileSync(p, "utf-8") : "";
  const block = [GITIGNORE_MARKER, ...GITIGNORE_ENTRIES].join("\n") + "\n";
  if (existing === block || existing.endsWith("\n" + block)) return [];
  const suffix = existing.endsWith("\n") || existing.length === 0 ? "" : "\n";
  writeFileSync(p, existing + suffix + block, "utf-8");
  return [".gitignore"];
}

/**
 * Tracked sensitive env files (filenames only — never contents). Ignore
 * rules do not untrack these; the caller warns with the safe repair.
 * Outside a repo or on git failure → [].
 */
export function trackedEnvFiles(projectRoot: string): string[] {
  try {
    const out = execFileSync("git", ["ls-files", "-z"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split("\0").filter(Boolean).filter(isSensitiveEnvPath).sort();
  } catch {
    return [];
  }
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
  const probe = probeRuntime(projectRoot, opts.dryRun);
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
    // Skip write when nothing changed — init ×3 must be zero-churn (FINAL-v2 §7).
    const unchanged = existing?.["model_mode"] === nextMode && existing?.["fence_version"] === "0.1.0" && existing?.["version"] === 1;
    if (!opts.dryRun && !unchanged) {
      const config = {
        version: 1,
        model_mode: nextMode,
        fence_version: "0.1.0",
        updatedAt: new Date().toISOString(),
      };
      assertWithinProjectRoot(projectRoot, p);
      writeFileSync(p, JSON.stringify(config, null, 2) + "\n", "utf-8");
      filesWritten.push(".fence/config.json");
    }
  }

  // 5. .fence/app-profile.json — copy canonical template + record runtime (Task 2 S-09, GEM-02)
  {
    const p = join(projectRoot, ".fence", "app-profile.json");
    const templatePath = join(hereDir(), "templates", "app-profile.json");
    const loadTemplate = (): Record<string, unknown> | null => {
      if (existsSync(templatePath)) {
        try { return JSON.parse(readFileSync(templatePath, "utf-8") as string) as Record<string, unknown>; } catch {}
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

  // 7. .fence/hooks/postinstall-guard.sh — postinstall re-scan (P0).
  // Template-owned (src/templates/postinstall-guard.sh): fresh installs copy
  // it; legacy shims (the `|| true` validate stub, the integrity.js stub) are
  // migrated; user-modified guards are never touched.
  {
    const p = join(projectRoot, ".fence", "hooks", "postinstall-guard.sh");
    if (!opts.dryRun) {
      const prev = existsSync(p) ? readFileSync(p, "utf-8") : null;
      const next = loadPostinstallGuard();
      if (prev !== null && prev !== next && !isLegacyPostinstallGuard(prev)) {
        console.warn(`[vibe-fence] .fence/hooks/postinstall-guard.sh exists and is not fence-managed — leaving it alone.`);
      } else {
        if (prev !== next) {
          writeFileSync(p, next, "utf-8");
          filesWritten.push(".fence/hooks/postinstall-guard.sh");
        }
        chmodSync(p, 0o755);
      }
    }
  }

  // 8. .gitignore — ensure fence + env patterns idempotently; preserve user
  // content and .env.example. Ignore rules do not untrack files or detect
  // every secret — tracked env files are reported separately below.
  if (!opts.dryRun) {
    try {
      filesWritten.push(...ensureGitignore(projectRoot));
    } catch (e) {
      console.warn(`[vibe-fence] .gitignore not updated: ${(e as Error).message}`);
    }
    const tracked = trackedEnvFiles(projectRoot);
    if (tracked.length > 0) {
      console.warn(
        `[vibe-fence] tracked env file(s) remain committable even when ignored: ${tracked.join(", ")}. ` +
          `Ignore rules do not untrack files. To keep the local copy but stop tracking: git rm --cached <file>, commit the removal, and rotate any exposed secret.`,
      );
    }
  }

  // 9. Adapter installs — explicit map (merge-not-clobber inside each adapter)
  const adapterIds = opts.adapters ?? DEFAULT_ADAPTER_IDS;
  for (const id of adapterIds) {
    const fn = ADAPTERS[id];
    if (!fn) {
      console.warn(`[vibe-fence] unknown adapter "${id}" — skipping (known: ${DEFAULT_ADAPTER_IDS.join(", ")})`);
      continue;
    }
    try {
      if (!opts.dryRun) {
        const written = fn(projectRoot, { modelMode });
        filesWritten.push(...written);
      }
      adaptersInstalled.push(id);
    } catch (e) {
      // Adapter optional — log but don't fail install (fail-open per GEM-07 spirit)
      console.warn(`[vibe-fence] adapter ${id} not installed: ${(e as Error).message}`);
    }
  }

  // 9b. Skills — copy SKILL.md set into .agents/skills/ (copy-if-missing: idempotent, never clobbers)
  {
    const skillsSrc = join(hereDir(), "skills");
    const skillsDst = join(projectRoot, ".agents", "skills");
    if (!opts.dryRun && existsSync(skillsSrc)) {
      mkdirSync(skillsDst, { recursive: true });
      for (const entry of readdirSync(skillsSrc)) {
        const from = join(skillsSrc, entry, "SKILL.md");
        if (!existsSync(from)) continue;
        const toDir = join(skillsDst, entry);
        const to = join(toDir, "SKILL.md");
        if (existsSync(to)) continue; // never clobber user/project skills
        assertWithinProjectRoot(projectRoot, to);
        mkdirSync(toDir, { recursive: true });
        writeFileSync(to, readFileSync(from, "utf-8"), "utf-8");
        filesWritten.push(`.agents/skills/${entry}/SKILL.md`);
      }
    }
  }

  // 9c. Git hooks — pre-commit/pre-push run `vibe-fence check` (Guarded tier).
  // Installs into the effective hooks dir Git will actually use. A
  // core.hooksPath outside this project is never written to (global side
  // effect); the exact project-local repair is reported and hooks stay
  // degraded. Global config is never changed. Existing hooks are chained.
  if (!opts.dryRun) {
    try {
      filesWritten.push(...installGitHooks(projectRoot));
      if (existsSync(join(projectRoot, ".git"))) {
        const info = inspectGitHooks(projectRoot);
        if (info.blockedOutside && info.effectiveDir) {
          let repair: string | null = null;
          if (info.configured) {
            try {
              const common = commonHooksDir(projectRoot);
              if (common && canonicalPath(common) === join(canonicalPath(dirname(common)), basename(common))) {
                repair = hooksRepairCommand(projectRoot);
              }
            } catch { /* no safe common directory to recommend */ }
          }
          const note = repair ? hooksRepairNote(projectRoot) : "";
          console.warn(
            `[vibe-fence] Git hooks NOT installed: the effective hooks directory is outside an allowed location or cannot be resolved safely (${info.effectiveDir}). ` +
              `Nothing was written there and Git config was not changed. ` +
              (repair ? `Review the directory and, if appropriate, run \`${repair}\` from the project root, then re-run \`vibe-fence init\`. ` :
                `Inspect the hooks directory and choose a safe location before re-running \`vibe-fence init\`. `) +
              (note ? `${note} ` : "") +
              `Verify Git protection before relying on it.`,
          );
        }
      }
    } catch (e) {
      console.warn(`[vibe-fence] git hooks not installed: ${(e as Error).message}`);
    }
  }

  // 10. Lightweight AGENTS.md fence block fallback if no adapter wrote it
  {
    const p = join(projectRoot, "AGENTS.md");
    if (!existsSync(p) && !opts.dryRun) {
      const block = buildAgentsFenceBlock();
      writeFileSync(p, block + "\n", "utf-8");
      filesWritten.push("AGENTS.md");
    }
  }

  // 11. Integrity attestation — SHA-256 of fence-owned files (GEM-01)
  // FENCE_SYNC_TOKEN is set — persist is allowed (not mintable by model, S-05)
  if (!opts.dryRun) {
    try {
      persistAttestation(projectRoot);
      filesWritten.push(".fence/.integrity.json");
    } catch { /* attestation best-effort at install time */ }
  }

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
    console.log(`🛡️  vibe-fence installed — ${receipt.mode} mode — ${receipt.adaptersInstalled.length} adapters — ${receipt.elapsedMs}ms`);
    console.log(`   Files: ${receipt.filesWritten.slice(0, 6).join(", ")}${receipt.filesWritten.length > 6 ? ` +${receipt.filesWritten.length - 6} more` : ""}`);
    console.log(`   Protection depends on your host and working hooks; installation alone does not verify enforcement.`);
    console.log("");
    console.log("Next steps:");
    console.log("  1. Run 'vibe-fence status --host=codex' for a configuration report.");
    console.log("  2. Review and trust applicable host hooks, then verify them in a safe project.");
    console.log("  3. Run 'vibe-fence check' and review the findings.");

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
    console.log(`[dry-run] would install adapters: ${adapterIds.join(", ")} — mode ${probe.runtime} — ${elapsed()}ms`);
  }

  // Surface timing budget — <3s (FINAL-v2 §7 rubric #1)
  if (receipt.elapsedMs > 3000) {
    console.warn(`[vibe-fence] install took ${receipt.elapsedMs}ms — exceeds 3s budget (FINAL-v2 §7 rubric)`);
  }

  return receipt;
}
