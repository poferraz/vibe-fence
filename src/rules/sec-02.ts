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

// Read-like tools — only these trigger hard-deny (write/emit of credential content also covered via read→exfil)
const READ_LIKE_RE = /\b(read|open|cat|view|show|load|fetch|get)\b/i;

function isCredentialPath(text: string): { hit: boolean; label?: string; match?: string } {
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
    return { hit: true, label, match: m[0].trim().slice(0, 200) };
  }
  return { hit: false };
}

function isReadLike(toolName: string | undefined, content: string, args: string | undefined): boolean {
  if (toolName) return READ_LIKE_RE.test(toolName);
  // No toolName — infer from content/args containing read verbs
  const haystack = `${content ?? ""} ${args ?? ""}`;
  return READ_LIKE_RE.test(haystack);
}

export function check(ctx: CheckCtx): RuleVerdict {
  const content = ctx.content ?? "";
  const args = ctx.args ?? "";
  const haystack = `${content} ${args}`;

  if (!haystack.trim()) {
    return { id: SEC02_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  // Fast path: no credential path mentioned → pass
  // Need to handle .env.example suppression: if only .env.example, treat as pass
  const cred = isCredentialPath(haystack);
  if (!cred.hit) {
    return { id: SEC02_ID, verdict: "pass", reason: "no credential path detected" };
  }

  // Credential path present — require read-like tool to fail (per spec: fail when credential-path regex matches and tool is read-like)
  if (!isReadLike(ctx.toolName, content, args)) {
    return { id: SEC02_ID, verdict: "pass", reason: "credential path mentioned but not a read-like tool — pass (mention ≠ exfiltration)" };
  }

  return {
    id: SEC02_ID,
    verdict: "fail",
    reason: `credential-path hard-deny: ${cred.label} — blocked by SEC-02 (S-09 block, GEM-01)`,
    evidence: cred.match,
  };
}
