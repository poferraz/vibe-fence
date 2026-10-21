/**
 * src/rules/index.ts
 * Registry mapping rule id → checker (M3 Task 10).
 * Import via `import { REGISTRY } from "./rules/index.js"` or individual checkers.
 */

export { check as checkBill01, BILL01_ID } from "./bill-01.js";
export { check as checkPrv09, PRV09_ID } from "./prv-09.js";
export { check as checkNet01, NET01_ID } from "./net-01.js";
export { check as checkSec02, SEC02_ID } from "./sec-02.js";

import { check as checkBill01 } from "./bill-01.js";
import { check as checkPrv09 } from "./prv-09.js";
import { check as checkNet01 } from "./net-01.js";
import { check as checkSec02 } from "./sec-02.js";
import type { CheckCtx as BillCtx } from "./bill-01.js";
import type { CheckCtx as PrvCtx } from "./prv-09.js";
import type { CheckCtx as NetCtx } from "./net-01.js";
import type { CheckCtx as Sec02Ctx } from "./sec-02.js";

export type Verdict = "pass" | "fail" | "unknown" | "not-applicable";

// Union of ctx shapes — all checkers accept { content?, filePath?, projectRoot?, fileList? }
export type CheckCtx = BillCtx & PrvCtx & NetCtx & Sec02Ctx;

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
};

export function getChecker(id: string): RuleEntry | undefined {
  return REGISTRY[id];
}

export function listRuleIds(): string[] {
  return Object.keys(REGISTRY);
}
