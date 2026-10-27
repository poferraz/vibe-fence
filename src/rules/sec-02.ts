/**
 * src/rules/sec-02.ts
 * SEC-02 — Credential-path hard-deny (S-09 block, FINAL-v4 S-09 + GEM-01).
 * Task 4 adversary: malicious skill exfiltrates ~/.ssh / .env / ~/.aws / .fence/.integrity.json.
 * Hard-deny (block) — never allow read/open/cat of credential paths outside fence-owned scope.
 */

export const SEC02_ID = "SEC-02" as const;
export const SEC02_SEVERITY = "block" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  content?: string;
  toolName?: string;
  args?: string;
  // Compat with Bill01/Prv09 CheckCtx union (index.ts CheckCtx = BillCtx & PrvCtx)
  projectRoot?: string;
  filePath?: string;
  fileList?: string[];
}

export interface RuleVerdict {
  id: typeof SEC02_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

// Credential path patterns — any match is sensitive
const CREDENTIAL_PATH_RES: Array<{ re: RegExp; label: string }> = [
  { re: /(?:~\/\.ssh(?:\/|$))|(?:\.ssh\/(?:id_[a-z]+|config|known_hosts|authorized_keys))/i, label: "~/.ssh" },
  { re: /~\/\.aws\/credentials\b/i, label: "~/.aws/credentials" },
  { re: /\.aws\/credentials\b/i, label: ".aws/credentials" },
  // .env variants: .env, .env.local, .env.production, etc. — but not .env.example (safe template)
  { re: /(?:^|[\s\"'=:])\.env(?:\.[a-zA-Z0-9_-]+)?\b/, label: ".env" },
  { re: /\.fence\/\.integrity\.json\b/, label: ".fence/.integrity.json" },
];

import { isExecutablePath, isProsePath, isQuotedAt, liveCode, stripStrings } from "./context.js";

// Read-like tools — only these trigger hard-deny (write/emit of credential content also covered via read→exfil).
// Covers display (cat/pagers), search (grep family), dump/encode (strings/xxd/od/base64),
// copy-out (cp/scp/sftp/rsync) and archive-out (tar/zip/7z) — all exfiltrate
// file bytes to the caller.
/** Archive exclusion operands are not reads: `tar --exclude=.env ...`
 * and `zip ... -x .env` never touch the excluded file. Strip before
 * credential-path classification (review finding). */
const EXCLUDE_OPERAND_RE = /--exclude(?:=[^\s]+|\s+[^\s]+)?|--exclude-from[=\s][^\s]+|(?:^|\s)-x\s+[^\s]+/g;
function stripExclusions(cmd: string): string {
  return cmd.replace(EXCLUDE_OPERAND_RE, " ");
}
const READ_LIKE_RE =
  /\b(read|open|cat|view|show|load|fetch|get|grep|rg|ag|ack|head|tail|less|more|strings|xxd|od|base64|cp|scp|sftp|rsync|tar|zip|7z)\b/i;

// Tree-scan mode (no toolName): prose mentions must pass, so a bare verb is
// not enough — require a read SINK. Code sink: read-call with a QUOTED
// credential path on the same line (exfil code; prose quotes no parens).
const READ_SINK_CALL_RE =
  /\b(?:readFileSync|readFile|createReadStream|openSync|fs\.open|open|read|load|cat|fetch|loadFile|readTextFile|Deno\.readTextFile)\s*\(/;
// Shell sink: read command + credential path, executable files only (docs
// showing the attack as an example pass at tree level; live execution is
// gated by toolName=bash through the gate).
const SHELL_READ_RE =
  /(?:^|[;&|]\s*|&&\s*)(?:sudo\s+)?(cat|less|more|head|tail|open|code|cursor|bat|grep|rg|ag|ack|strings|xxd|od|base64|cp|scp|sftp|rsync|tar|zip|7z)\s+[^\n]*$/;

function isCredentialPath(text: string): { hit: boolean; label?: string; match?: string; index?: number } {
  // .env.example is explicitly safe — strip before check to avoid FP
  // We still want .env matching to fire, so skip .env.example as evidence
  for (const { re, label } of CREDENTIAL_PATH_RES) {
    const m = text.match(re);
    if (!m) continue;
    // Suppress .env.example — allowlist template
    if (label === ".env" && /\.env\.example\b/.test(m[0] + text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 8))) {
      // Check full match is exactly .env.example
      if (/\.env\.example\b/.test(text.slice(m.index ?? 0, (m.index ?? 0) + 20))) {
        // Only skip if the matched segment is .env.example
        const snippet = text.slice(m.index ?? 0, (m.index ?? 0) + 20);
        if (/\.env\.example\b/.test(snippet)) continue;
      }
    }
    return { hit: true, label, match: m[0].trim().slice(0, 200), index: m.index ?? 0 };
  }
  return { hit: false };
}

export function check(ctx: CheckCtx): RuleVerdict {
  const content = ctx.content ?? "";
  const args = ctx.args ?? "";
  const haystack = stripExclusions(`${content} ${args}`);

  if (!haystack.trim()) {
    return { id: SEC02_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  // Gate mode (live tool call): args are action — path + read-like tool fails.
  if (ctx.toolName) {
    const cred = isCredentialPath(haystack);
    if (!cred.hit) {
      return { id: SEC02_ID, verdict: "pass", reason: "no credential path detected" };
    }
    if (!READ_LIKE_RE.test(ctx.toolName)) {
      return { id: SEC02_ID, verdict: "pass", reason: "credential path mentioned but not a read-like tool — pass (mention ≠ exfiltration)" };
    }
    return {
      id: SEC02_ID,
      verdict: "fail",
      reason: `credential-path hard-deny: ${cred.label} — blocked by SEC-02 (S-09 block, GEM-01)`,
      evidence: cred.match,
    };
  }

  // Tree mode: prose must pass — require a read SINK on the credential line.
  // Sink detection runs with strings blanked (a read call inside a string is
  // a fixture assertion, not a read); the path itself must stay quoted.
  if (isProsePath(ctx.filePath)) {
    return { id: SEC02_ID, verdict: "pass", reason: "prose file — mentions are not reads (execution is gated live)" };
  }
  for (const rawLine of content.split("\n")) {
    const line = stripExclusions(liveCode(rawLine));
    const cred = isCredentialPath(line);
    if (!cred.hit || cred.index === undefined) continue;
    const quoted = isQuotedAt(line, cred.index);
    // Code sink: read-call with a quoted credential path (exfil code).
    if (quoted && READ_SINK_CALL_RE.test(stripStrings(line))) {
      return {
        id: SEC02_ID,
        verdict: "fail",
        reason: `credential-path hard-deny: ${cred.label} read in code — blocked by SEC-02 (S-09 block, GEM-01)`,
        evidence: rawLine.trim().slice(0, 200),
      };
    }
    // Shell sink: read command + path, executable files only (docs showing
    // the attack pass here; live execution is gated through the gate).
    if (SHELL_READ_RE.test(line) && isExecutablePath(ctx.filePath)) {
      return {
        id: SEC02_ID,
        verdict: "fail",
        reason: `credential-path hard-deny: ${cred.label} read in shell — blocked by SEC-02 (S-09 block, GEM-01)`,
        evidence: rawLine.trim().slice(0, 200),
      };
    }
  }

  return { id: SEC02_ID, verdict: "pass", reason: "no credential-path read sink detected" };
}
