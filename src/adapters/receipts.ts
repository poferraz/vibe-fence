/**
 * src/adapters/receipts.ts — fence-owned install receipts (decision 5).
 * Host config files keep only vendor-supported keys; fence metadata (model
 * routing, install time) lives in `.fence/adapters/<id>.json`. This module
 * writes receipts and scrubs legacy fence-managed `fence` keys out of host
 * files (recognized by the receipt marker — never touches user keys).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface AdapterReceipt {
  version: 1;
  adapter: string;
  model_mode: string;
  companion_model: string;
  architect_model: string;
  installedAt: string;
  receipt: string;
}

/** True when a host `fence` block is fence-managed (ours to scrub on sight). */
export function isFenceManagedBlock(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const receipt = (v as Record<string, unknown>).receipt;
  return typeof receipt === "string" && receipt.includes("vibe-fence");
}

/**
 * Remove a fence-managed legacy `fence` key from a parsed host config object.
 * Returns true when the object changed (caller decides whether to write back).
 * User-owned `fence` keys (no receipt marker) are never touched.
 */
export function scrubFenceKey(obj: Record<string, unknown>): boolean {
  if ("fence" in obj && isFenceManagedBlock(obj.fence)) {
    delete obj.fence;
    return true;
  }
  return false;
}

export function writeAdapterReceipt(
  projectRoot: string,
  adapter: string,
  fields: { model_mode: string; companion_model: string; architect_model: string; receipt: string },
): { path: string; changed: boolean } {
  const dir = join(projectRoot, ".fence", "adapters");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${adapter}.json`);
  let installedAt = new Date().toISOString();
  let prevStr: string | null = null;
  try {
    if (existsSync(p)) {
      prevStr = readFileSync(p, "utf-8");
      const prev = JSON.parse(prevStr) as Partial<AdapterReceipt>;
      if (typeof prev.installedAt === "string") installedAt = prev.installedAt;
    }
  } catch {
    // Corrupt receipt — fall through with a fresh timestamp.
  }
  const receipt: AdapterReceipt = { version: 1, adapter, ...fields, installedAt };
  const nextStr = JSON.stringify(receipt, null, 2);
  if (nextStr === prevStr) return { path: p, changed: false };
  writeFileSync(p, nextStr, "utf-8");
  return { path: p, changed: true };
}
