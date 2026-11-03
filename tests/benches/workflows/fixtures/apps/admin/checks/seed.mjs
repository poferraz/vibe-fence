import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const seedPath = join(dirname(fileURLToPath(import.meta.url)), "..", "seed", "customers.json");
assert.ok(existsSync(seedPath), "seed file exists");
const rows = JSON.parse(readFileSync(seedPath, "utf-8"));
assert.equal(rows.length, 5);
for (const r of rows) assert.ok(r.email.includes("@"));
console.log("seed checks passed");
