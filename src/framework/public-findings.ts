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

export function safeLocation(path: string): string {
  return path.replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, "?");
}
