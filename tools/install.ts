#!/usr/bin/env bun
/**
 * tools/install.ts — thin shim over src/install.ts (authority).
 * Preserves `bun run tools/install.ts` for dev + package.json "deploy".
 * The packed CLI (dist/cli.js) never touches this file.
 */
export * from "../src/install.js";
import { install, CONTRIBUTOR_DISCLOSURE, type InstallOptions } from "../src/install.js";

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opts: InstallOptions = {
    dryRun: args.includes("--dry-run"),
    contributorMode: args.includes("--contributor-mode"),
    full: args.includes("--full"),
  };
  if (opts.contributorMode) {
    console.log(CONTRIBUTOR_DISCLOSURE);
  }
  const receipt = await install(process.cwd(), opts);
  if (!opts.dryRun) {
    console.log(`\nFENCE_SYNC_TOKEN: ${receipt.fenceSyncTokenPrefix}… (ephemeral, minted by installer — S-05/S-06)`);
  }
}
