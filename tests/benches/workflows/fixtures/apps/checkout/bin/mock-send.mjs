#!/usr/bin/env bun
// CLI face of the offline send service: bun bin/mock-send.mjs --to a@example.com
import { resend } from "../lib/resend.mjs";
const to = process.argv[process.argv.indexOf("--to") + 1];
if (!to) {
  console.error("usage: mock-send --to <email>");
  process.exit(2);
}
const r = await resend.emails.send({ to });
console.log(r.id);
