/**
 * src/rules/sup-01.ts
 * SUP-01 — Supply-chain script execution (S-09 block, ARGON-AUDIT-v2 §2.2).
 * Half A: package.json scripts.* values are audited for unambiguous-malicious
 * payloads (pipe-to-shell, curl|wget exfiltration, reverse shells) — the
 * Wauters `npm run <innocent-name>` vector. Lifecycle scripts with ordinary
 * network downloads (esbuild-style prebuilds) pass: payload shape, not the
 * mere presence of a downloader, is the signal.
 * Half B (live shell only): bare installs without --ignore-scripts fail with
 * guidance — the teachable moment, not a dead end.
 */

import { SHELL_LIKE_TOOL_RE } from "./context.js";
import { hasPipeToShell } from "./net-01.js";

export const SUP01_ID = "SUP-01" as const;
export const SUP01_SEVERITY = "block" as const;

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
  id: typeof SUP01_ID;
  verdict: Verdict;
  reason: string;
  evidence?: string;
}

// curl|wget used to SEND data out (vs downloading a prebuild).
const EXFIL_RE = /\b(?:curl|wget)\b[^\n]*?(?:-d\b|--data(?:-binary)?\b|-F\b|--form\b|-T\b|--upload-file\b|-X\s*POST\b)/i;
// Classic reverse shells.
const REVSHELL_RE = /\bnc(?:at)?\b[^\n]*?\s-e\b|bash\s+-i\b[^\n]*?>&|\/dev\/tcp\//i;

function scriptPayload(script: string): string | null {
  if (hasPipeToShell(script)) return "pipe-to-shell payload";
  if (EXFIL_RE.test(script)) return "upload/exfiltration payload";
  if (REVSHELL_RE.test(script)) return "reverse-shell payload";
  return null;
}

function isPackageJson(filePath: string | undefined): boolean {
  if (!filePath) return false;
  return filePath.replace(/\\/g, "/").split("/").pop()?.toLowerCase() === "package.json";
}

const INSTALL_VERB_RE = /(?:^|[;&|]\s*|&&\s*)(?:sudo\s+)?(?:npm|bun|pnpm|yarn)\s+(?:install|i|ci|add|up)(?![\w-])/;
const YARN_BARE_RE = /(?:^|[;&|]\s*|&&\s*)(?:sudo\s+)?yarn\s*(?=$|[;&|]|\|\||&&)/;

function isInstall(content: string): string | null {
  const m = content.match(INSTALL_VERB_RE) ?? content.match(YARN_BARE_RE);
  return m ? m[0].trim().slice(0, 120) : null;
}

export function check(ctx: CheckCtx): RuleVerdict {
  const content = `${ctx.content ?? ""} ${ctx.args ?? ""}`;

  // Half A: package.json scripts audit (file-gated; docs quoting manifests pass).
  if (isPackageJson(ctx.filePath)) {
    if (!content.trim()) {
      return { id: SUP01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(ctx.content ?? "");
    } catch {
      return { id: SUP01_ID, verdict: "unknown", reason: "package.json does not parse (unknown≠pass)" };
    }
    const scripts = (parsed as { scripts?: unknown })?.scripts;
    if (!scripts || typeof scripts !== "object") {
      return { id: SUP01_ID, verdict: "pass", reason: "no scripts to audit" };
    }
    for (const [name, cmd] of Object.entries(scripts as Record<string, unknown>)) {
      if (typeof cmd !== "string") continue;
      const payload = scriptPayload(cmd);
      if (payload) {
        return {
          id: SUP01_ID,
          verdict: "fail",
          reason: `package.json script "${name}" carries a ${payload} — ` +
            `audit or remove it before install/run (S-09 block; Wauters vector)`,
          evidence: `${name}: ${cmd.slice(0, 160)}`,
        };
      }
    }
    return { id: SUP01_ID, verdict: "pass", reason: "package.json scripts clean" };
  }

  // Half B: live installs without --ignore-scripts (live shell only).
  if (ctx.toolName && SHELL_LIKE_TOOL_RE.test(ctx.toolName)) {
    if (!content.trim()) {
      return { id: SUP01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
    }
    const installHit = isInstall(content);
    if (installHit && !content.includes("--ignore-scripts")) {
      return {
        id: SUP01_ID,
        verdict: "fail",
        reason: "install without --ignore-scripts runs postinstall code blind — re-run flagged, or audit new deps first (S-09 block)",
        evidence: installHit,
      };
    }
    return { id: SUP01_ID, verdict: "pass", reason: "no unflagged install detected" };
  }

  if (!content.trim()) {
    return { id: SUP01_ID, verdict: "unknown", reason: "no content to inspect (unknown≠pass)" };
  }
  return { id: SUP01_ID, verdict: "pass", reason: "not a package manifest or live install" };
}
