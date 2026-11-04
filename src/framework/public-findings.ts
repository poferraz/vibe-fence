export const SUMMARIES: Record<string, string> = {
  "SEC-01": "A secret may be exposed to client code.",
  "SEC-02": "A credential file may be accessed.",
  "SEC-03": "A sensitive environment file may be exposed.",
  "NET-01": "Remote content may be executed by a shell.",
  "SUP-01": "A package script may execute remote content.",
  "CMD-01": "A command may be destructive.",
  "DB-01": "A database operation may be destructive.",
  "GIT-01": "A Git operation may be destructive.",
  "FS-01": "A file operation may escape the project.",
  "BILL-01": "An operation may incur unbounded cost.",
  "PRV-09": "Sensitive data may be exposed.",
  "S-06": "An attested instruction file has changed.",
  "WORKTREE-SCAN": "A worktree scan was incomplete.",
  "INDEX-SCAN": "A staged scan was incomplete.",
  "PUSH-SCAN": "A history scan was incomplete.",
};


export function publicSummary(id: string): string {
  return Object.hasOwn(SUMMARIES, id) ? SUMMARIES[id]! : "A potential issue needs review.";
}

export type ScanReasonCode = "max-files" | "max-bytes" | "max-commits" | "unreadable" | "unmerged" | "not-git" | "missing-root" | "shallow" | "submodule" | "missing-upstream" | "invalid-range" | "integrity-corrupt";

const INTEGRITY_RECOVERY = "Fix: Review staged or untracked changes too (use git diff and git diff --cached). Restore unintended edits. Before re-running 'vibe-fence init', move any edits you want to keep outside the managed block in AGENTS.md; init replaces that block.";

const REMEDIATIONS: Record<string, string> = {
  "SEC-01": "Fix: Move the secret to a server-only variable and rotate it if it was shared or committed.",
  "SEC-02": "Fix: Remove the credential-file access and use an approved secret provider instead.",
  "SEC-03": "Fix: Remove the credential from tracked code, store it securely, and rotate it if exposed.",
  "NET-01": "Fix: Download and inspect remote scripts before running them.",
  "SUP-01": "Fix: Audit or remove unsafe package scripts before running an install.",
  "CMD-01": "Fix: Review the destructive command and restrict it to the intended target.",
  "DB-01": "Fix: Review the database operation and use a tested migration or backup plan.",
  "GIT-01": "Fix: Review the Git operation and use a non-destructive alternative.",
  "FS-01": "Fix: Keep file operations within the project directory.",
  "BILL-01": "Fix: Add a limit to the potentially billable operation.",
  "PRV-09": "Fix: Replace sensitive fixture data with synthetic examples.",
  "S-06": INTEGRITY_RECOVERY,
};

const PUSH_REMEDIATIONS: Partial<Record<ScanReasonCode, string>> = {
  "max-files": "Fix: Review smaller explicit ranges and, where practical, split the push into smaller updates. The automatic pre-push hook will still block an oversized push.",
  "max-bytes": "Fix: Review the historical file and plan any necessary history changes. The automatic pre-push hook will still block while that oversized blob is in the pushed history.",
  "max-commits": "Fix: Review smaller explicit ranges and, where practical, split the push into smaller updates. The automatic pre-push hook will still block an oversized push.",
  "submodule": "Fix: Inspect the submodule separately. The automatic pre-push hook will still block a push containing this unsupported submodule change; review your workflow before proceeding.",
};

const SCAN_REASONS: Record<ScanReasonCode, { reason: string; remediation: string }> = {
  "max-files": { reason: "The scan exceeded its file limit.", remediation: "Fix: Reduce the number of eligible files and retry, or review the remaining files manually." },
  "max-bytes": { reason: "An eligible file exceeded the scan's size limit.", remediation: "Fix: Review the large file manually and reduce its size before retrying." },
  "max-commits": { reason: "The history scan exceeded its commit limit.", remediation: "Fix: Scan smaller explicit commit ranges and review each range before pushing." },
  "unreadable": { reason: "An eligible input could not be read or inspected.", remediation: "Fix: Check file access and repository health, then retry the scan." },
  "unmerged": { reason: "The staged scan found an unresolved merge.", remediation: "Fix: Resolve and stage the conflicted files, then retry." },
  "not-git": { reason: "Git could not inspect this repository.", remediation: "Fix: Run the command in an accessible Git repository." },
  "missing-root": { reason: "The project directory is unavailable.", remediation: "Fix: Run the command from an accessible project directory." },
  "shallow": { reason: "A shallow repository does not contain the full history needed for this scan.", remediation: "Fix: Fetch the complete history and retry." },
  "submodule": { reason: "A submodule requires a separate scan.", remediation: "Fix: Inspect the submodule and its history separately before pushing." },
  "missing-upstream": { reason: "This branch has no upstream tracking reference for the history scan.", remediation: "Fix: Configure an upstream, pass an explicit <base>..<head> range, or run './.fence/bin/vibe-fence check --push --all' to scan all local refs." },
  "invalid-range": { reason: "Git could not resolve the requested history range.", remediation: "Fix: Check the revisions or provide a valid <base>..<head> range." },
  "integrity-corrupt": { reason: "The integrity baseline is missing, unreadable, or invalid.", remediation: INTEGRITY_RECOVERY },
};

export function publicRemediation(id: string): string | undefined {
  return Object.hasOwn(REMEDIATIONS, id) ? REMEDIATIONS[id] : undefined;
}

export function publicScanInfo(code: unknown, ruleId?: string): { reason: string; remediation: string } | undefined {
  if (typeof code !== "string" || !Object.hasOwn(SCAN_REASONS, code)) return undefined;
  const info = SCAN_REASONS[code as ScanReasonCode];
  const pushRemediation = ruleId === "PUSH-SCAN" ? PUSH_REMEDIATIONS[code as ScanReasonCode] : undefined;
  return pushRemediation ? { ...info, remediation: pushRemediation } : info;
}

export function safeLocation(path: string): string {
  return path.replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, "?");
}
