/**
 * src/framework/integrity.ts
 * S-06 — Workspace-local drift detection; not an independent trust boundary.
 *   FINAL-v2 §2 S-06 + GEM-01 (P0): SHA-256 attestation for AGENTS.md / .fence/invariants.md
 *   with a workspace-local attestation and postinstall guard reference.
 * Anti-patterns: §6 #8 (agent must not relax own checks), #9 (tool output as untrusted on init).
 * Sources: AIShellJack arXiv:2601.17548v1 (41-84% ASR), TrojanForge >60% poisoning,
 *   NVIDIA AI Red Team Go-dep vector, CSA Research Note 2026 (84% injection, 93% miss rate).
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync, writeFileSync, lstatSync, constants, openSync, closeSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Persisted attestation record — .fence/.integrity.json (git-ignored, hash only). */
export interface IntegrityRecord {
  version: 1;
  generatedAt: string; // ISO-8601
  generatedBy: string; // "fence init" | "fence sync" + FENCE_SYNC_TOKEN hash prefix
  files: Record<string, string>; // relative path → hex SHA-256
}

/** Result of a verification pass. */
export type IntegrityVerdict =
  | { status: "pass" }
  | { status: "fail"; mismatched: string[]; message: string }
  | { status: "unknown"; reason: string }; // e.g. no attestation file yet

// ---------------------------------------------------------------------------
// Constants — fence-owned files covered by attestation
// ---------------------------------------------------------------------------

/** Files whose integrity is attested. Relative to project root. */
export const FENCE_OWNED_FILES: readonly string[] = [
  "AGENTS.md",
  ".fence/invariants.md",
  // TODO: add .fence/queue.json schema hash when queue stabilizes (M2)
  // TODO: add .agents/skills/**/SKILL.md hashes if skills become fence-owned (M3)
] as const;

/** A workflow marker, not authentication or a security boundary. */
export const FENCE_SYNC_TOKEN_ENV = "FENCE_SYNC_TOKEN";

/** Attestation store path (git-ignored). */
export const INTEGRITY_STORE = ".fence/.integrity.json";

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Compute hex SHA-256 of file content.
 * S-06 — hash attestation primitive; deterministic, auditable.
 */
export function sha256Hex(content: string | Buffer): string {
  // TODO: handle binary files if fence-owned set expands beyond markdown
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Compute attestation map for all fence-owned files present on disk.
 * Returns { path → hash } for files that exist; skips missing with warning.
 */
export function computeAttestation(projectRoot: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of FENCE_OWNED_FILES) {
    const abs = join(projectRoot, rel);
    if (!existsSync(abs)) {
      // TODO: emit nudge — missing fence-owned file is not a block, but log it
      continue;
    }
    const content = readFileSync(abs);
    out[rel] = sha256Hex(content);
  }
  return out;
}

/**
 * Persist attestation to .fence/.integrity.json.
 * Called by `vibe-fence init`, which mints FENCE_SYNC_TOKEN first.
 * The marker is a workflow guard, not authentication: the same user or agent
 * can modify this record or set the marker.
 */
export function persistAttestation(projectRoot: string): void {
  if (!process.env[FENCE_SYNC_TOKEN_ENV]) {
    throw new Error(`refusing to (re-)attest without ${FENCE_SYNC_TOKEN_ENV} workflow marker; run init`);
  }
  // TODO: write atomically (tmp + rename) to avoid torn reads during concurrent fence validate
  const files = computeAttestation(projectRoot);
  const record: IntegrityRecord = {
    version: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: process.env[FENCE_SYNC_TOKEN_ENV]
      ? `fence-sync:${process.env[FENCE_SYNC_TOKEN_ENV]!.slice(0, 8)}`
      : "fence-init",
    files,
  };
  const fencePath = join(projectRoot, ".fence");
  if (lstatSync(fencePath).isSymbolicLink()) throw new Error("refusing symlinked integrity directory");
  const storePath = join(projectRoot, INTEGRITY_STORE);
  try { if (lstatSync(storePath).isSymbolicLink()) throw new Error("refusing symlinked integrity store"); }
  catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
  const fd = openSync(storePath, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW, 0o600);
  try { writeFileSync(fd, JSON.stringify(record, null, 2) + "\n", "utf-8"); }
  finally { closeSync(fd); }
  // TODO: ensure .fence/.integrity.json is git-ignored (validate in tools/validate.ts)
}

/**
 * Verify current files against persisted attestation.
 * Called by `vibe-fence check` (drift becomes an S-06 block finding) and
 * therefore by every managed pre-commit hook invocation.
 *
 * Mismatches always fail. The record and verifier are writable by the same
 * user, so this detects local drift but cannot resist a determined writer.
 */
export function verifyAttestation(projectRoot: string): IntegrityVerdict {
  const storePath = join(projectRoot, INTEGRITY_STORE);
  if (!existsSync(storePath)) {
    // TODO: decide — should `fence validate` auto-create attestation on unknown?
    return { status: "unknown", reason: "no attestation store — run 'npx vibe-fence init'" };
  }

  let record: IntegrityRecord;
  let current: Record<string, string>;
  try {
    record = JSON.parse(readFileSync(storePath, "utf-8"));
    if (!record || record.version !== 1 || !record.files || typeof record.files !== "object" || Array.isArray(record.files) || Object.keys(record.files).length === 0 ||
      Object.entries(record.files).some(([path, hash]) => !FENCE_OWNED_FILES.includes(path) || typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash))) {
      return { status: "unknown", reason: "invalid attestation record" };
    }
    current = computeAttestation(projectRoot);
  } catch { return { status: "unknown", reason: "cannot read attestation record or files" }; }
  const mismatched: string[] = [];

  for (const [rel, expectedHash] of Object.entries(record.files)) {
    const actual = current[rel];
    if (actual === undefined) {
      mismatched.push(rel);
    } else if (actual !== expectedHash) {
      mismatched.push(rel);
    }
  }

  if (mismatched.length === 0) return { status: "pass" };

  return {
    status: "fail",
    mismatched,
    message:
      `Attested instruction file changed — inspect it, including staged or untracked edits (git diff and git diff --cached).\n` +
      `Mismatched: ${mismatched.join(", ")}`,
  };
}

/**
 * Postinstall guard reference (GEM-01).
 * .fence/hooks/postinstall-guard.sh invokes this check so that
 * `npm install` / `go mod tidy` cannot silently plant a malicious AGENTS.md
 * before the agent ever runs. See tools/install.ts wiring.
 *
 * TODO: implement .fence/hooks/postinstall-guard.sh shell wrapper:
 *   #!/bin/sh
 *   node -e "require('./src/framework/integrity.js').postinstallGuard()"
 *   # exit 1 + message on fail, exit 0 on pass/unknown
 */
export function postinstallGuard(projectRoot: string = process.cwd()): void {
  const verdict = verifyAttestation(projectRoot);
  if (verdict.status === "fail") {
    // TODO: print to stderr with actionable next step; ensure npm prepare does not swallow exit code
    console.error(`[vibe-fence] integrity check failed: ${verdict.message}`);
    process.exit(1);
  }
  // TODO: on unknown (first install) — optionally auto-seed attestation if AGENTS.md was just created by init
}

// ---------------------------------------------------------------------------
// Invisible-Unicode scan (S-06 companion)
// ---------------------------------------------------------------------------

/**
 * Scan content for invisible Unicode (zero-width, bidi override, homoglyph-adjacent).
 * S-06 — reject contradictory tiers and invisible-Unicode in AGENTS.md/SKILL.md.
 * TODO: implement scan — regex for [\u200B-\u200D\uFEFF\u202A-\u202E\u2060-\u206F]
 * TODO: integrate into verifyAttestation pre-check — fail before hash compare if invisible chars found
 */
const INVISIBLE_RE = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2060-\u206F]/g;

export function scanInvisibleUnicode(content: string): { clean: boolean; findings: string[] } {
  const findings: string[] = [];
  let match: RegExpExecArray | null;
  // Reset lastIndex in case of reuse (global regex state)
  INVISIBLE_RE.lastIndex = 0;
  while ((match = INVISIBLE_RE.exec(content)) !== null) {
    const ch = match[0];
    const offset = match.index;
    const cp = ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
    findings.push(`U+${cp} at offset ${offset}`);
  }
  return { clean: findings.length === 0, findings };
}
