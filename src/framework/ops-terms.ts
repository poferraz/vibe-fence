/**
 * src/framework/ops-terms.ts — ops glossary matcher (sidebar, L1 injection).
 * 111 ops terms live in src/config/ops-terms.json (shipped to dist/ by
 * generate.ts like severity-policy.json). The matcher scans finding
 * metadata ONLY (ruleId/file/reason — the same lines already sent to the
 * companion) and returns at most MAX_TERMS one-liners for the prompt.
 * Deterministic, zero LLM cost, no-match pays zero. Fail-open: unreadable
 * or invalid glossary degrades to [] and --explain works as before.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface OpsTerm {
  term: string;
  def: string;
}

/** Finding metadata the matcher may read — no evidence/content field exists. */
export interface Matchable {
  ruleId: string;
  file: string;
  reason: string;
}

/** Max one-liners per prompt (~35 tokens each → ~100 tokens worst case). */
export const MAX_TERMS = 3;

/** Terms shorter than this need word boundaries (else "iam" matches "William"). */
const BOUNDARY_LEN = 5;

function moduleDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function glossaryPaths(): string[] {
  const here = moduleDir();
  return [
    join(here, "config", "ops-terms.json"), // packed CLI: dist/cli.js bundle → dist/config/
    join(here, "..", "config", "ops-terms.json"), // dev/test: src/framework/ → src/config/
  ];
}

export function loadTerms(): OpsTerm[] {
  try {
    const path = glossaryPaths().find((p) => existsSync(p));
    if (!path) return [];
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as { terms?: unknown };
    if (!Array.isArray(parsed.terms)) return [];
    return parsed.terms.filter(
      (t): t is OpsTerm =>
        typeof (t as OpsTerm).term === "string" &&
        typeof (t as OpsTerm).def === "string" &&
        (t as OpsTerm).term.length > 0 &&
        (t as OpsTerm).def.length > 0,
    );
  } catch {
    return [];
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termMatches(needle: string, haystack: string): boolean {
  if (needle.length < BOUNDARY_LEN) {
    return new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(haystack);
  }
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/** Glossary-order scan over finding metadata; deduped, capped. Pure given terms. */
export function matchTerms(findings: Matchable[], terms: OpsTerm[] = loadTerms(), cap: number = MAX_TERMS): OpsTerm[] {
  const haystacks = findings.map((f) => `${f.ruleId} ${f.file} ${f.reason}`);
  const hits: OpsTerm[] = [];
  for (const term of terms) {
    if (hits.length >= cap) break;
    if (haystacks.some((h) => termMatches(term.term, h))) hits.push(term);
  }
  return hits;
}
