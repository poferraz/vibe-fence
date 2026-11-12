#!/usr/bin/env node
/**
 * Project-local setup: one selected coding tool, offline checks and Git hooks.
 * The installer preserves existing settings and tests managed hook code locally.
 * A local self-test cannot prove the coding tool has loaded the hook.
 */
import { chmodSync, existsSync, lstatSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync, unlinkSync } from "node:fs";
import { basename, join, resolve, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { execSync, execFileSync } from "node:child_process";
import { installClaudeAdapter, buildAgentsFenceBlock } from "./adapters/claude.js";
import { installCursorAdapter } from "./adapters/cursor.js";
import { installCodexAdapter } from "./adapters/codex.js";
import { installOpenCodeAdapter } from "./adapters/opencode.js";
import { installAntigravityAdapter } from "./adapters/antigravity.js";
import { installHermesAdapter } from "./adapters/hermes.js";
import { installProjectRuntime } from "./framework/project-runtime.js";
import { packageVersion } from "./version.js";
import { getProtectionStatus, verifyAdapterHook, type HookProbe } from "./framework/status.js";
import { persistAttestation, FENCE_SYNC_TOKEN_ENV } from "./framework/integrity.js";
import { installGitHooks, inspectGitHooks, effectiveHooksDir, canonicalPath, commonHooksDir, hooksRepairCommand, hooksRepairNote } from "./framework/git-hooks.js";
import { adapterPathsSafe } from "./adapters/safe-paths.js";
import { captureInstallBaseline, recordInstallResult } from "./uninstall.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export interface InstallOptions {
  dryRun?: boolean;
  full?: boolean; // WebContainer file-only → native full
  adapters?: string[]; // One selected tool; [] or ["none"] installs Git checks only.
  noPackageScripts?: boolean;
}

export interface InstallReceipt {
  elapsedMs: number;
  mode: "native" | "webcontainer";
  filesWritten: string[];
  adaptersInstalled: string[];
  hookProbe: HookProbe | null;
}

export type AdapterInstaller = (projectRoot: string) => string[];

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

/** Project markers identify candidates; a global installation does not identify the current tool. */
export function detectAdapters(projectRoot: string): string[] {
  return DEFAULT_ADAPTER_IDS.filter(id => existsSync(join(projectRoot, `.${id}`)));
}

function selectAdapter(projectRoot: string, requested?: string[]): string[] {
  const candidates = [...new Set(requested ?? detectAdapters(projectRoot))];
  if (requested && (candidates.length === 0 || (candidates.length === 1 && candidates[0] === "none"))) return [];
  if (candidates.length !== 1 || !Object.hasOwn(ADAPTERS, candidates[0]!)) {
    const detail = candidates.length ? `Found: ${candidates.join(", ")}. ` : "";
    throw new Error(`${detail}Choose one coding tool with 'vibe-fence init --host=<tool>' (${DEFAULT_ADAPTER_IDS.join(", ")}), or --host=none for Git checks only. No project files were changed.`);
  }
  return candidates;
}

function addPackageScripts(projectRoot: string): boolean {
  const path = join(projectRoot, "package.json");
  if (!existsSync(path) || !adapterPathsSafe(projectRoot, ["package.json"])) return false;
  try {
    const pkg = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) return false;
    if (pkg.scripts !== undefined && (!pkg.scripts || typeof pkg.scripts !== "object" || Array.isArray(pkg.scripts))) return false;
    const scripts = { ...((pkg.scripts ?? {}) as Record<string, unknown>) };
    let changed = false;
    for (const command of ["check", "status", "undo"]) {
      const name = `fence:${command}`;
      if (!(name in scripts)) { scripts[name] = `node ./.fence/bin/vibe-fence.cjs ${command}`; changed = true; }
    }
    if (changed) { pkg.scripts = scripts; writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n", "utf8"); }
    return changed;
  } catch {
    console.warn("[vibe-fence] package.json could not be updated; existing contents were left alone.");
    return false;
  }
}

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
  'ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)',
  'if [ -z "$BIN" ] && [ -x "$ROOT/.fence/bin/vibe-fence" ]; then BIN="$ROOT/.fence/bin/vibe-fence"; fi',
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
// Safe project setup — .gitignore env coverage + tracked-env report
// ---------------------------------------------------------------------------

export const GITIGNORE_MARKER = "# vibe-fence";
/** Ignore entries the fence owns: fence state + local env files. `.env.example` is deliberately not covered. */
export const GITIGNORE_ENTRIES = [
  ".fence/.integrity.json",
  ".fence/uninstall.json",
  ".fence/runtime/",
  ".fence/bin/",
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
  const startMs = Date.now();
  const elapsed = () => Date.now() - startMs;
  const adapterIds = selectAdapter(projectRoot, opts.adapters);

  // Refuse an escaping managed root before probes or writes.
  const integrationPaths: Record<string, string[]> = {
    claude: ["CLAUDE.md", ".claude/settings.json", ".claude/hooks/fence-gate.sh", ".claude/hooks/fence-gate.cjs"],
    cursor: [".cursor/hooks.json", ".cursor/hooks/fence-gate.sh", ".cursor/hooks/fence-gate.cjs", ".cursor/rules/vibe-fence-router.mdc", ".cursor/skills"],
    codex: [".agents/memory/MEMORY.md", ".codex/hooks.json", ".codex/hooks/fence-gate.cjs", ".codex/config.json"],
    opencode: [".opencode/plugins/fence-guard.js", "opencode.json"],
    antigravity: [".agents/rules/antigravity.md"],
    hermes: [".hermes/config.json"],
  };
  const managedPaths = [
    ".fence/config.json", ".fence/app-profile.json", ".fence/state/dial.json", ".fence/hooks/postinstall-guard.sh", ".fence/.integrity.json", ".fence/uninstall.json", ".fence/events.ndjson", ".fence/rules", ".fence/runtime", ".fence/bin", ".fence/adapters",
    "AGENTS.md", ".agents/skills",
    ...adapterIds.flatMap(id => [`.fence/adapters/${id}.json`, ...integrationPaths[id]!]),
  ];
  const skillSource = join(hereDir(), "skills");
  if (existsSync(skillSource)) for (const name of readdirSync(skillSource)) managedPaths.push(`.agents/skills/${name}/SKILL.md`);
  for (const rel of managedPaths) {
    let current = resolve(projectRoot);
    for (const component of rel.split("/")) {
      current = join(current, component);
      try { if (lstatSync(current).isSymbolicLink()) throw new Error(`refusing managed symlink: ${rel}`); }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
    }
    assertWithinProjectRoot(projectRoot, current);
  }
  const uninstallBaseline = opts.dryRun ? null : captureInstallBaseline(projectRoot, [...managedPaths, ".gitignore", "package.json"]);

  // 1. WebContainer probe — GEM-02 P1
  const probe = probeRuntime(projectRoot, opts.dryRun);
  if (probe.runtime === "webcontainer" && !opts.full) {
    console.log("WebContainer detected — hooks unavailable. Using file-only mode (AGENTS.md + .fence/ rules).");
    console.log("Run 'npx vibe-fence init --full' on a local clone for hook enforcement.");
  }

  const filesWritten: string[] = [];
  const adaptersInstalled: string[] = [];
  let setupFailure: string | null = null;
  let runtimeAvailable = false;

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

  // Keep local settings while removing obsolete provider/model configuration.
  {
    const p = join(projectRoot, ".fence", "config.json");
    let existing: Record<string, unknown> = {};
    try { existing = JSON.parse(readFileSync(p, "utf8")); } catch {}
    const local = { ...existing };
    for (const key of ["model_mode", "companion", "architect", "provider", "models", "companion_model", "architect_model", "api_key", "api_base", "remote"]) delete local[key];
    const config = { ...local, version: 1, fence_version: packageVersion(), adapters: adapterIds };
    if (!opts.dryRun && JSON.stringify(config) !== JSON.stringify(existing)) {
      assertWithinProjectRoot(projectRoot, p);
      writeFileSync(p, JSON.stringify({ ...config, updatedAt: new Date().toISOString() }, null, 2) + "\n", "utf8");
      filesWritten.push(".fence/config.json");
    }
  }

  // Record runtime availability, without aspirational tier or rule counts.
  {
    const p = join(projectRoot, ".fence", "app-profile.json");
    let existing: Record<string, unknown> = {};
    try { existing = JSON.parse(readFileSync(p, "utf8")); } catch {}
    const profile = { ...existing };
    for (const key of ["tier", "profile", "block_counts", "_comment"]) delete profile[key];
    const next = { ...profile, version: 1, runtime: probe.runtime };
    if (!opts.dryRun && JSON.stringify(next) !== JSON.stringify(existing)) {
      assertWithinProjectRoot(projectRoot, p);
      writeFileSync(p, JSON.stringify({ ...next, updatedAt: new Date().toISOString() }, null, 2) + "\n", "utf8");
      filesWritten.push(".fence/app-profile.json");
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
  for (const id of adapterIds) {
    const fn = ADAPTERS[id];
    if (!fn) {
      console.warn(`[vibe-fence] unknown adapter "${id}" — skipping (known: ${DEFAULT_ADAPTER_IDS.join(", ")})`);
      continue;
    }
    try {
      if (!opts.dryRun) {
        const written = fn(projectRoot);
        filesWritten.push(...written);
      }
      if (opts.dryRun) adaptersInstalled.push(id);
    } catch {
      setupFailure = `The ${id} integration could not be installed safely.`;
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
        const relativeSkill = `.agents/skills/${entry}/SKILL.md`;
        if (existsSync(to)) {
          const previous = uninstallBaseline?.journal.files[relativeSkill];
          const current = readFileSync(to);
          const unchangedManaged = previous && !previous.preserve && previous.after === createHash("sha256").update(current).digest("hex");
          if (!unchangedManaged) continue; // Preserve customized or unrecognized skills.
          if (current.equals(readFileSync(from))) continue;
        }
        assertWithinProjectRoot(projectRoot, to);
        mkdirSync(toDir, { recursive: true });
        writeFileSync(to, readFileSync(from, "utf-8"), "utf-8");
        filesWritten.push(`.agents/skills/${entry}/SKILL.md`);
      }
    }
  }

  // Install the current bundled runtime before enabling managed hooks.
  if (!opts.dryRun) {
    const moduleDir = hereDir();
    const distDir = basename(moduleDir) === "dist" ? moduleDir : join(dirname(moduleDir), "dist");
    const runtime = installProjectRuntime(projectRoot, distDir, join(dirname(distDir), "package.json"));
    runtimeAvailable = runtime.status !== "unavailable";
    if (runtime.status === "unavailable") setupFailure = `The local runtime is unavailable. ${runtime.reason}`;
    if (!opts.noPackageScripts && addPackageScripts(projectRoot)) filesWritten.push("package.json");
  }

  // 9c. Git hooks — pre-commit/pre-push run `vibe-fence check` (Guarded tier).
  // Installs into the effective hooks dir Git will actually use. A
  // core.hooksPath outside this project is never written to (global side
  // effect); the exact project-local repair is reported and hooks stay
  // degraded. Global config is never changed. Existing hooks are chained.
  if (!opts.dryRun && runtimeAvailable) {
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
            `[vibe-fence] ACTION NEEDED — Git hooks were not installed by this run: the effective hooks directory is outside an allowed location or cannot be resolved safely (${info.effectiveDir}). ` +
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
  // The marker is a workflow guard, not an independent authentication boundary.
  if (!opts.dryRun && runtimeAvailable) {
    const previousMarker = process.env[FENCE_SYNC_TOKEN_ENV];
    try {
      process.env[FENCE_SYNC_TOKEN_ENV] = randomBytes(16).toString("hex");
      persistAttestation(projectRoot, adapterIds);
      filesWritten.push(".fence/.integrity.json");
    } catch { setupFailure ??= "The local integrity baseline could not be created safely."; }
    finally {
      if (previousMarker === undefined) delete process.env[FENCE_SYNC_TOKEN_ENV];
      else process.env[FENCE_SYNC_TOKEN_ENV] = previousMarker;
    }
  }

  // 12. Receipt + paved path — FINAL-v2 §7 rubric + 05 A-11/S-02
  const receipt: InstallReceipt = {
    elapsedMs: elapsed(),
    mode: probe.runtime === "webcontainer" && !opts.full ? "webcontainer" : "native",
    filesWritten,
    adaptersInstalled,
    hookProbe: !opts.dryRun && adapterIds[0] ? verifyAdapterHook(projectRoot, adapterIds[0]) : null,
  };

  if (!opts.dryRun) {
    const host = adapterIds[0];
    const labels: Record<string, string> = { claude: "Claude Code", cursor: "Cursor", codex: "Codex", opencode: "OpenCode", antigravity: "Antigravity", hermes: "Hermes" };
    const status = getProtectionStatus(projectRoot, host);
    const usableIntegration = !host || (["antigravity", "hermes"].includes(host) ? status.toolGate.state === "advisory" : status.toolGate.state === "configured-unverified");
    if (!usableIntegration) setupFailure ??= `The ${host} integration is ${status.toolGate.state}; existing user files were preserved.`;
    if (receipt.hookProbe?.supported && !receipt.hookProbe.verified) setupFailure ??= "The selected tool's local hook self-test failed.";
    if (setupFailure) {
      // An incomplete setup must remain removable without advertising a new installed adapter.
      if (host) {
        const rel = `.fence/adapters/${host}.json`;
        const before = uninstallBaseline?.current[rel]?.bytes;
        const path = join(projectRoot, rel);
        if (before) writeFileSync(path, before);
        else if (existsSync(path)) unlinkSync(path);
      }
      if (uninstallBaseline) recordInstallResult(projectRoot, uninstallBaseline);
      throw new Error(`Setup incomplete. ${setupFailure} Resolve the conflict and rerun init; no successful setup is claimed.`);
    }
    if (host) adaptersInstalled.push(host);
    console.log(`vibe-fence installed for ${host ? labels[host] : "Git"} — local checks, no account or API key.`);
    console.log(`Git checks: ${status.gitHooks.state === "configured-unverified" ? "installed before commits and pushes" : status.gitHooks.state}.`);
    if (receipt.hookProbe?.supported) console.log(`Local hook self-test: ${receipt.hookProbe.verified ? "passed" : "failed — run vibe-fence doctor for details"}.`);
    if (host && ["claude", "cursor", "codex", "opencode"].includes(host)) {
      console.log(`Restart ${labels[host]} and trust project hooks when prompted. Execution in the coding tool is not yet verified.`);
    } else if (host) {
      console.log("This tool receives guidance only; tool actions are not blocked by this integration.");
    }
    if (receipt.mode === "webcontainer") console.log("This environment supports guidance only; Git hooks are unavailable.");

    // Append install event to events.ndjson (append-only, GEM-08 artefact)
    try {
      const eventsPath = join(projectRoot, ".fence", "events.ndjson");
      appendFileSync(eventsPath, JSON.stringify({
        type: "install",
        at: new Date().toISOString(),
        mode: receipt.mode,
        adapters: receipt.adaptersInstalled,
        elapsedMs: receipt.elapsedMs,
      }) + "\n", "utf-8");
    } catch {}
    if (uninstallBaseline) {
      try { recordInstallResult(projectRoot, uninstallBaseline); }
      catch { console.warn("[vibe-fence] Could not save the uninstall record; remove managed files manually."); }
    }
  } else {
    console.log(`[dry-run] would install adapters: ${adapterIds.join(", ") || "none (Git only)"} — mode ${probe.runtime} — ${elapsed()}ms`);
  }

  // Surface timing budget — <3s (FINAL-v2 §7 rubric #1)
  if (receipt.elapsedMs > 3000) {
    console.warn(`[vibe-fence] install took ${receipt.elapsedMs}ms — exceeds 3s budget (FINAL-v2 §7 rubric)`);
  }

  return receipt;
}
