/**
 * src/rules/sec-03.ts
 * SEC-03 — Secret commit to git (S-09 block, ARGON-AUDIT-v2 §2.2).
 * Two halves: (1) live secret tokens (prefix regex + Shannon entropy +
 * dummy-token allowlist) in committed source — strings INCLUDED, because
 * tokens live in strings; (2) `.env*` files that git would actually commit
 * (git check-ignore probe; ignored .env correctly passes).
 * Dummy/test keys, doc examples, and low-entropy placeholders pass.
 */

import { execFileSync } from "node:child_process";

export const SEC03_ID = "SEC-03" as const;
export const SEC03_SEVERITY = "block" as const;

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

export interface CheckCtx {
  content?: string;
  toolName?: string;
  args?: string;
  projectRoot?: string;
  filePath?: string;
  fileList?: string[];
  /** Env for the git probe (default process.env). Explicit — mutating process.env does not reach children reliably. */
  env?: Record<string, string>;
}

export interface RuleVerdict {
  id: typeof SEC03_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

// Live-prefix token shapes. Test variants (sk_test_, rk_test_) are allowlisted below, never here.
const TOKEN_RES: Array<{ re: RegExp; label: string; entropyOf: "suffix" | "whole" | "fixed" }> = [
  { re: /\bsk_live_[A-Za-z0-9]{8,}\b/, label: "Stripe live key", entropyOf: "suffix" },
  { re: /\bsk-ant-[A-Za-z0-9-]{8,}\b/, label: "Anthropic key", entropyOf: "suffix" },
  { re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{8,}\b/, label: "GitHub token", entropyOf: "suffix" },
  { re: /\bgithub_pat_[A-Za-z0-9_]{8,}\b/, label: "GitHub PAT", entropyOf: "suffix" },
  { re: /\bAKIA[0-9A-Z]{16}\b/, label: "AWS access key", entropyOf: "fixed" },
  { re: /\bxox[bpras]-[A-Za-z0-9-]{8,}(?![A-Za-z0-9_-])/, label: "Slack token", entropyOf: "suffix" },
  { re: /\bglpat-[A-Za-z0-9-]{8,}\b/, label: "GitLab PAT", entropyOf: "suffix" },
  { re: /\bnpm_[A-Za-z0-9]{12,}\b/, label: "npm token", entropyOf: "suffix" },
  { re: /\bAIza[0-9A-Za-z_-]{35,}(?![0-9A-Za-z_-])/, label: "Google API key", entropyOf: "fixed" },
  { re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: "private key", entropyOf: "fixed" },
];

// Test/dummy markers — anywhere in the token or its line downgrades to pass.
const DUMMY_RE = /(?:sk_test|rk_test|test|dummy|example|fake|sample|changeme|your[-_ ]?(?:key|secret|token)|placeholder|x{3,}|0{6,})/i;

/** Shannon entropy in bits/char. Random base62 ≥20 chars ≈ 5+; words ≈ 2–3. */
export function shannon(s: string): number {
  if (s.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1);
  let h = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

export const ENTROPY_THRESHOLD = 3.5;

function tokenSuffix(match: string): string {
  const i = Math.max(match.indexOf("_"), match.indexOf("-"));
  return i === -1 ? match : match.slice(i + 1);
}

function isEnvFile(filePath: string | undefined): boolean {
  if (!filePath) return false;
  const base = filePath.replace(/\\/g, "/").split("/").pop() ?? "";
  if (/\.example(\.|$)/i.test(base)) return false;
  return /^\.env(\.|$)/i.test(base);
}

/**
 * Would git commit this path? exit 0 ignored → false; exit 1 → true;
 * any other failure (no repo, bad path) → false (nothing committable).
 */
function wouldCommit(projectRoot: string, filePath: string, env: Record<string, string>): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", "--", filePath], { cwd: projectRoot, env, stdio: ["ignore", "ignore", "ignore"] });
    return false;
  } catch (e) {
    return (e as { status?: number }).status === 1;
  }
}

export function check(ctx: CheckCtx): RuleVerdict {
  // Half 2: committable .env — decided by git, not by content.
  if (isEnvFile(ctx.filePath)) {
    const env = ctx.env ?? (process.env as Record<string, string>);
    if (ctx.projectRoot && wouldCommit(ctx.projectRoot, ctx.filePath as string, env)) {
      return {
        id: SEC03_ID,
        verdict: "fail",
        reason: "secret file would be committed — add it to .gitignore (S-09 block)",
        evidence: ctx.filePath,
      };
    }
    return { id: SEC03_ID, verdict: "pass", reason: ".env correctly ignored (or no repo context)" };
  }

  const content = ctx.content ?? "";
  if (!content.trim()) {
    return { id: SEC03_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }

  // Half 1: live tokens in source.
  for (const line of content.split("\n")) {
    for (const { re, label, entropyOf } of TOKEN_RES) {
      // Fresh regex per line (global-free patterns, but be safe against lastIndex).
      const rx = new RegExp(re.source, re.flags);
      const m = rx.exec(line);
      if (!m) continue;
      const token = m[0];
      if (DUMMY_RE.test(token) || DUMMY_RE.test(line)) continue;
      if (entropyOf !== "fixed") {
        const suffix = tokenSuffix(token);
        if (suffix.length < 8 || shannon(suffix) < ENTROPY_THRESHOLD) continue;
      }
      return {
        id: SEC03_ID,
        verdict: "fail",
        reason: `${label} in committed source — rotate it, move it out of the repo (S-09 block)`,
        evidence: `${label}: ${token.slice(0, 12)}…(redacted)`,
      };
    }
  }

  return { id: SEC03_ID, verdict: "pass", reason: "no live secret tokens detected" };
}
