/**
 * src/rules/index.ts
 * Registry mapping rule id → checker (M3 Task 10).
 * Import via `import { REGISTRY } from "./rules/index.js"` or individual checkers.
 */

export { check as checkBill01, BILL01_ID } from "./bill-01.js";
export { check as checkPrv09, PRV09_ID } from "./prv-09.js";
export { check as checkNet01, NET01_ID } from "./net-01.js";
export { check as checkSec02, SEC02_ID } from "./sec-02.js";
export { check as checkSec01, SEC01_ID } from "./sec-01.js";
export { check as checkSec03, SEC03_ID } from "./sec-03.js";
export { check as checkFs01, FS01_ID } from "./fs-01.js";
export { check as checkCmd01, CMD01_ID } from "./cmd-01.js";
export { check as checkSup01, SUP01_ID } from "./sup-01.js";
export { check as checkGit01, GIT01_ID } from "./git-01.js";
export { check as checkDb01, DB01_ID } from "./db-01.js";

import { check as checkBill01 } from "./bill-01.js";
import { check as checkPrv09 } from "./prv-09.js";
import { check as checkNet01 } from "./net-01.js";
import { check as checkSec02 } from "./sec-02.js";
import { check as checkSec01 } from "./sec-01.js";
import { check as checkSec03 } from "./sec-03.js";
import { check as checkFs01 } from "./fs-01.js";
import { check as checkCmd01 } from "./cmd-01.js";
import { check as checkSup01 } from "./sup-01.js";
import { check as checkGit01 } from "./git-01.js";
import { check as checkDb01 } from "./db-01.js";
import type { CheckCtx as BillCtx } from "./bill-01.js";
import type { CheckCtx as PrvCtx } from "./prv-09.js";
import type { CheckCtx as NetCtx } from "./net-01.js";
import type { CheckCtx as Sec02Ctx } from "./sec-02.js";
import type { CheckCtx as Sec01Ctx } from "./sec-01.js";
import type { CheckCtx as Sec03Ctx } from "./sec-03.js";
import type { CheckCtx as Fs01Ctx } from "./fs-01.js";
import type { CheckCtx as Cmd01Ctx } from "./cmd-01.js";
import type { CheckCtx as Sup01Ctx } from "./sup-01.js";
import type { CheckCtx as Git01Ctx } from "./git-01.js";
import type { CheckCtx as Db01Ctx } from "./db-01.js";

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

// Union of ctx shapes — all checkers accept { content?, filePath?, projectRoot?, fileList? }
export type CheckCtx = BillCtx & PrvCtx & NetCtx & Sec02Ctx & Sec01Ctx & Sec03Ctx & Fs01Ctx & Cmd01Ctx & Sup01Ctx & Git01Ctx & Db01Ctx;

export interface RuleEntry {
  id: string;
  severity: string;
  description: string;
  check: (ctx: CheckCtx) => { id: string; verdict: Verdict; reason: string; evidence?: string };
}

/** Canonical registry — add new rules here and they become discoverable by tooling. */
export const REGISTRY: Record<string, RuleEntry> = {
  "BILL-01": {
    id: "BILL-01",
    severity: "warn",
    description: "Billable-loop guard — unbounded loop with service call and no cap/limit/max",
    check: checkBill01 as RuleEntry["check"],
  },
  "PRV-09": {
    id: "PRV-09",
    severity: "block",
    description: "Fixture hygiene — real PII/secrets in fixtures/test-data must be synthetic",
    check: checkPrv09 as RuleEntry["check"],
  },
  "NET-01": {
    id: "NET-01",
    severity: "block",
    description: "curl|sh pipe-to-shell hard-block — curl/wget piped to sh/bash/zsh (S-09)",
    check: checkNet01 as RuleEntry["check"],
  },
  "SEC-02": {
    id: "SEC-02",
    severity: "block",
    description: "Credential-path hard-deny — read/open/cat of ~/.ssh, ~/.aws/credentials, .env, .fence/.integrity.json (S-09 block, GEM-01)",
    check: checkSec02 as RuleEntry["check"],
  },
  "SEC-01": {
    id: "SEC-01",
    severity: "block",
    description: "Client-bundle secret hard-block — secret-shaped keyword under NEXT_PUBLIC_/VITE_/PUBLIC_/EXPO_PUBLIC_ (S-09 block)",
    check: checkSec01 as RuleEntry["check"],
  },
  "SEC-03": {
    id: "SEC-03",
    severity: "block",
    description: "Secret commit to git — live tokens (prefix + entropy + dummy allowlist) and committable .env (S-09 block)",
    check: checkSec03 as RuleEntry["check"],
  },
  "FS-01": {
    id: "FS-01",
    severity: "block",
    description: "Realpath boundary escape — target canonicalizes outside the project root (S-09 block)",
    check: checkFs01 as RuleEntry["check"],
  },
  "CMD-01": {
    id: "CMD-01",
    severity: "block",
    description: "Destructive wipe — rm -rf on / ~ $HOME /root .git, recursive chmod 777 (S-09 block)",
    check: checkCmd01 as RuleEntry["check"],
  },
  "SUP-01": {
    id: "SUP-01",
    severity: "block",
    description: "Supply-chain scripts — malicious package.json payloads; installs without --ignore-scripts (S-09 block)",
    check: checkSup01 as RuleEntry["check"],
  },
  "GIT-01": {
    id: "GIT-01",
    severity: "block",
    description: "Destructive git — force-push to main/master, reset --hard (S-09 block)",
    check: checkGit01 as RuleEntry["check"],
  },
  "DB-01": {
    id: "DB-01",
    severity: "block",
    description: "Destructive SQL — RLS disable, DROP TABLE/DATABASE/SCHEMA/POLICY, TRUNCATE (S-09 block)",
    check: checkDb01 as RuleEntry["check"],
  },
};

export function getChecker(id: string): RuleEntry | undefined {
  return REGISTRY[id];
}

export function listRuleIds(): string[] {
  return Object.keys(REGISTRY);
}
