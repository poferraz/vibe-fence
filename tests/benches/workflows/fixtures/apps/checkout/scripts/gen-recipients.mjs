// Deterministic recipient list generator (setup-side).
// Usage: bun scripts/gen-recipients.mjs <count> <out>
import { writeFileSync } from "node:fs";
const count = Number(process.argv[2] ?? "200");
const out = process.argv[3] ?? "recipients.json";
const list = [];
for (let i = 1; i <= count; i++) {
  list.push({ id: `r-${i}`, email: `user${i}@example.com`, name: `Example User ${i}` });
}
writeFileSync(out, JSON.stringify(list, null, 1) + "\n");
console.log(`recipients: ${count} -> ${out}`);
