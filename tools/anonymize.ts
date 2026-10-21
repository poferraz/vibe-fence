/**
 * tools/anonymize.ts — Fixture anonymizer (GEM-06, PRV-09)
 * S-08/S-09 PRV-09: synthetic PII replacement preserving referential integrity.
 *
 * - Map email/name/phone → fake with stable hash (deterministic, repeatable).
 * - Read fixture paths (argv or default fixtures/**, seed/**, __mocks__/**).
 * - Write anonymized copy (in-place by default; --out for dry preview).
 * - Emit unknown if no check possible (never pass — S-14 unknown≠pass).
 *
 * References: INDEPENDENT-GEMS.md GEM-06 (fixture & seed hygiene), SOURCES §C,
 *             FINAL-v4 §4 M3, ECC-SIDEBAR.md §3.5, severity-policy.json.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnonymizeVerdictStatus = "pass" | "fail" | "unknown";

export interface AnonymizeVerdict {
  status: AnonymizeVerdictStatus;
  reason: string;
  filesScanned: number;
  filesAnonymized: number;
  replacements: number;
  details?: string[];
}

export interface AnonymizeOptions {
  /** If set, write anonymized output to this dir/file instead of in-place. */
  out?: string;
  /** Dry run — do not write, just report. */
  dryRun?: boolean;
  /** Verbose — print per-file mapping counts. */
  verbose?: boolean;
}

// ---------------------------------------------------------------------------
// PII patterns — deterministic, no ML heuristics
// ---------------------------------------------------------------------------

/** Email-shaped: local@domain.tld */
const EMAIL_RE = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;

/** Phone-shaped: +1-xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx-xxx-xxxx, 10-digit runs with separators. */
const PHONE_RE =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

/** Name heuristic: capitalized first+last adjacent to a known key (name, fullName, displayName, etc.) in JSON. */
const NAME_KEY_RE =
  /"(?:name|fullName|displayName|firstName|lastName|author|assignee|owner)"\s*:\s*"([^"]+)"/g;

// ---------------------------------------------------------------------------
// Stable fake generators — deterministic via sha256(value)
// ---------------------------------------------------------------------------

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function fakeEmail(original: string, map: Map<string, string>): string {
  if (map.has(original)) return map.get(original)!;
  const h = stableHash(`email:${original}`);
  const local = `user_${h.slice(0, 8)}`;
  const domain = `example-${h.slice(8, 12)}.test`;
  const fake = `${local}@${domain}`;
  map.set(original, fake);
  return fake;
}

function fakePhone(original: string, map: Map<string, string>): string {
  if (map.has(original)) return map.get(original)!;
  const h = stableHash(`phone:${original}`);
  // Deterministic fake: 555-xxx-xxxx (555 block reserved for fiction per NANP)
  const a = parseInt(h.slice(0, 3), 16) % 800 + 100;
  const b = parseInt(h.slice(3, 6), 16) % 800 + 100;
  const fake = `555-${String(a).padStart(3, "0")}-${String(b).padStart(3, "0")}-${h.slice(6, 10)}`.slice(0, 12 + 4);
  // Simpler: 555-xxx-xxxx with hash-derived suffix
  const simple = `555-${h.slice(0, 3).padStart(3, "0").slice(0, 3)}-${h.slice(3, 7)}`;
  void a; void b; void fake;
  map.set(original, simple);
  return simple;
}

function fakeName(original: string, map: Map<string, string>): string {
  if (map.has(original)) return map.get(original)!;
  const h = stableHash(`name:${original}`);
  const firstNames = ["Alex", "Jordan", "Casey", "Riley", "Morgan", "Avery", "Quinn", "Blake"];
  const lastNames = ["Rivera", "Chen", "Patel", "Kim", "Okafor", "Silva", "Andersson", "Nair"];
  const fi = parseInt(h.slice(0, 2), 16) % firstNames.length;
  const li = parseInt(h.slice(2, 4), 16) % lastNames.length;
  const fake = `${firstNames[fi]} ${lastNames[li]}_${h.slice(4, 8)}`;
  map.set(original, fake);
  return fake;
}

// ---------------------------------------------------------------------------
// File discovery — fixtures/**, seed/**, prisma/seed.*, *.fixture.*, __mocks__/**
// ---------------------------------------------------------------------------

const DEFAULT_GLOBS = [
  "fixtures",
  "tests/fixtures",
  "__fixtures__",
  "seed",
  "prisma",
  "__mocks__",
];

function discoverFiles(projectRoot: string, explicit: string[]): string[] {
  const roots = explicit.length > 0 ? explicit : DEFAULT_GLOBS;
  const out: string[] = [];
  for (const rel of roots) {
    const abs = join(projectRoot, rel);
    if (!existsSync(abs)) continue;
    const st = statSync(abs);
    if (st.isFile()) {
      out.push(abs);
    } else if (st.isDirectory()) {
      collectFiles(abs, out);
    }
  }
  // Also scan explicit file args that may be outside DEFAULT_GLOBS
  for (const rel of explicit) {
    const abs = resolve(projectRoot, rel);
    if (!DEFAULT_GLOBS.includes(rel) && existsSync(abs) && statSync(abs).isFile()) {
      if (!out.includes(abs)) out.push(abs);
    }
  }
  return out;
}

function collectFiles(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectFiles(full, out);
    } else if (isTextFile(full)) {
      out.push(full);
    }
  }
}

function isTextFile(p: string): boolean {
  const ext = extname(p).toLowerCase();
  return [".json", ".jsonc", ".yaml", ".yml", ".csv", ".ts", ".js", ".txt", ".md", ".sql"].includes(ext) || ext === "";
}

// ---------------------------------------------------------------------------
// Core — anonymize one file's text preserving referential integrity
// ---------------------------------------------------------------------------

export function anonymizeText(
  text: string,
  maps: { email: Map<string, string>; phone: Map<string, string>; name: Map<string, string> },
): { anonymized: string; count: number } {
  let count = 0;

  // 1. Emails — must run before phone (emails contain digit runs)
  let out = text.replace(EMAIL_RE, (m) => {
    // Skip obvious synthetic/placeholder emails
    if (m.includes("example.test") || m.includes("example.com") && m.startsWith("user_")) return m;
    count++;
    return fakeEmail(m, maps.email);
  });

  // 2. Phones
  out = out.replace(PHONE_RE, (m) => {
    // Skip synthetic 555 numbers already fake
    if (m.startsWith("555-")) return m;
    count++;
    return fakePhone(m, maps.phone);
  });

  // 3. Names — only when adjacent to name-like keys (avoids over-matching prose)
  out = out.replace(NAME_KEY_RE, (_full, nameVal: string) => {
    // Skip short or already-synthetic names
    if (nameVal.length < 3) return _full;
    if (/^(Alex|Jordan|Casey|Riley|Morgan|Avery|Quinn|Blake) /.test(nameVal) && nameVal.includes("_")) return _full;
    count++;
    const fake = fakeName(nameVal, maps.name);
    return _full.replace(nameVal, fake);
  });

  return { anonymized: out, count };
}

// ---------------------------------------------------------------------------
// Entry — anonymize fixture files
// ---------------------------------------------------------------------------

export function anonymizeFixtures(
  projectRoot: string,
  fixturePaths: string[],
  opts: AnonymizeOptions = {},
): AnonymizeVerdict {
  const files = discoverFiles(projectRoot, fixturePaths);

  if (files.length === 0) {
    return {
      status: "unknown",
      reason: "no fixture files found — no check possible (pass fixture paths or add fixtures/**)",
      filesScanned: 0,
      filesAnonymized: 0,
      replacements: 0,
    };
  }

  const maps = {
    email: new Map<string, string>(),
    phone: new Map<string, string>(),
    name: new Map<string, string>(),
  };

  let totalReplacements = 0;
  let filesAnonymized = 0;
  const details: string[] = [];

  for (const abs of files) {
    let text: string;
    try {
      text = readFileSync(abs, "utf-8");
    } catch (e) {
      details.push(`${relative(projectRoot, abs)}: read error — ${(e as Error).message}`);
      continue;
    }

    const { anonymized, count } = anonymizeText(text, maps);
    if (count === 0) continue;

    filesAnonymized++;
    totalReplacements += count;
    details.push(`${relative(projectRoot, abs)}: ${count} replacement(s)`);

    if (opts.dryRun) continue;

    const outPath = opts.out ? join(resolve(projectRoot, opts.out), relative(projectRoot, abs)) : abs;

    if (opts.out) mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, anonymized, "utf-8");
  }

  // Emit verdict: fail if PII was present (needs anonymization), pass if clean, never synthetic pass on missing
  if (totalReplacements > 0 && !opts.dryRun && !opts.out) {
    // In-place mode: we fixed it → report pass with details (fail was before, now anonymized)
    // Caller that wants blocking should run with --dryRun first and gate on unknown/fail
    return {
      status: "pass",
      reason: `anonymized ${totalReplacements} PII occurrence(s) across ${filesAnonymized} file(s)`,
      filesScanned: files.length,
      filesAnonymized,
      replacements: totalReplacements,
      details,
    };
  }

  if (totalReplacements > 0) {
    return {
      status: "fail",
      reason: `PII detected: ${totalReplacements} occurrence(s) across ${filesAnonymized} file(s) — run without --dryRun to anonymize or pass --out to preview`,
      filesScanned: files.length,
      filesAnonymized,
      replacements: totalReplacements,
      details,
    };
  }

  return {
    status: "pass",
    reason: "no PII patterns detected in fixture files",
    filesScanned: files.length,
    filesAnonymized: 0,
    replacements: 0,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dryRun") || args.includes("--dry-run");
  const verbose = args.includes("--verbose") || args.includes("-v");
  const outIdx = args.findIndex((a) => a === "--out");
  const out = outIdx !== -1 ? args[outIdx + 1] : undefined;
  const fixturePaths = args.filter((a) => !a.startsWith("-") && a !== out);

  const projectRoot = process.cwd();
  const verdict = anonymizeFixtures(projectRoot, fixturePaths, { out, dryRun, verbose });

  if (verbose || verdict.details?.length) {
    for (const d of verdict.details ?? []) console.log(`  ${d}`);
  }

  if (verdict.status === "unknown") {
    console.warn(`[anonymize] unknown: ${verdict.reason}`);
    // unknown → exit 0 but warn (S-14 unknown≠pass; caller gates on status, not exit code)
    console.log(JSON.stringify(verdict, null, 2));
    process.exit(0);
  }

  console.log(`[anonymize] ${verdict.status}: ${verdict.reason} (${verdict.filesScanned} file(s) scanned)`);
  if (verdict.status === "fail" && dryRun) process.exit(1);
}
