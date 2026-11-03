/**
 * src/rules/db-01.ts
 * DB-01 — Destructive remote schema / RLS disable (S-09 block, ARGON-AUDIT-v2 §2.2).
 * Fails DISABLE ROW LEVEL SECURITY, DROP POLICY, DROP TABLE/DATABASE/SCHEMA,
 * and TRUNCATE where they would execute: .sql migration files (down
 * migrations exempt — destroying on rollback is their job) and exec-sink
 * SQL lines in source (db.query("DROP TABLE …")). Docs and tests pass.
 */

import { isProsePath, liveCode, sinkLines, stripStrings } from "./context.js";

export const DB01_ID = "DB-01" as const;
export const DB01_SEVERITY = "block" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  content?: string;
  toolName?: string;
  args?: string;
  projectRoot?: string;
  filePath?: string;
  fileList?: string[];
}

export interface RuleVerdict {
  id: typeof DB01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

const DESTRUCTIVE_SQL: Array<{ re: RegExp; label: string }> = [
  { re: /\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i, label: "DISABLE ROW LEVEL SECURITY" },
  { re: /\bDROP\s+POLICY\b/i, label: "DROP POLICY" },
  { re: /\bDROP\s+(?:TABLE|DATABASE|SCHEMA)\b/i, label: "DROP TABLE/DATABASE/SCHEMA" },
  { re: /\bTRUNCATE\b/i, label: "TRUNCATE" },
];

/** Call sites that execute SQL strings (plus the generic exec sinks). */
const SQL_SINK_RE = /\b(?:query|execute|raw)\s*\(|\bsql\s*`/;

function sqlSinkLines(content: string): string[] {
  // Detection on live code with strings blanked (a sink call inside a string
  // is a fixture, not a sink); originals returned so SQL still matches.
  return content.split("\n").filter((line) => {
    const live = liveCode(line);
    if (!live.trim()) return false;
    return SQL_SINK_RE.test(stripStrings(live));
  });
}

/** Down migrations destroy by design — exempt by path. */
function isDownMigration(filePath: string | undefined): boolean {
  if (!filePath) return false;
  const p = filePath.replace(/\\/g, "/").toLowerCase();
  return /(?:^|\/)down\.sql$|\/down\//.test(p) || /\.down\.sql$/.test(p);
}

function isSqlFile(filePath: string | undefined): boolean {
  return !!filePath && filePath.toLowerCase().endsWith(".sql");
}

export function check(ctx: CheckCtx): RuleVerdict {
  const src = `${ctx.content ?? ""} ${ctx.args ?? ""}`;
  if (!src.trim()) {
    return { id: DB01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }
  if (isDownMigration(ctx.filePath)) {
    return { id: DB01_ID, verdict: "pass", reason: "down migration — destruction is its job" };
  }

  const scopes: string[] = isSqlFile(ctx.filePath) ? [src] : [];
  if (!isProsePath(ctx.filePath)) scopes.push(...sinkLines(src), ...sqlSinkLines(src));
  for (const scope of scopes) {
    for (const rawLine of scope.split("\n")) {
      const line = rawLine;
      for (const { re, label } of DESTRUCTIVE_SQL) {
        if (re.test(line)) {
          return {
            id: DB01_ID,
            verdict: "fail",
            reason: `${label} destroys data or access control — checkpoint first, then run explicitly (S-09 block)`,
            evidence: line.trim().slice(0, 200),
          };
        }
      }
    }
  }

  return { id: DB01_ID, verdict: "pass", reason: "no destructive SQL detected" };
}
