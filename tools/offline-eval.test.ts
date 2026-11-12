import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

test("the evaluation command rejects removed provider options instead of silently using them", () => {
  const result = spawnSync(process.execPath, [join(import.meta.dir, "eval.ts"), "--provider=custom", "--base-url=http://127.0.0.1:9"], { encoding: "utf8" });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("offline only");
});

test("the loop command rejects the paid pilot path even when supplied old budgets", () => {
  const result = spawnSync(process.execPath, [join(import.meta.dir, "loops/run.ts"), "--pilot", "--budget-baseten=0", "--budget-modal=0", "--dry-run"], { encoding: "utf8" });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("offline only");
});
