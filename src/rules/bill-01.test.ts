/**
 * src/rules/bill-01.test.ts — unbounded billable loop (warn-grade queue).
 * Loop + nearby service call with no nearby cap fails; distant, capped,
 * prose, and quoted shapes pass.
 * Run: bun test src/rules/bill-01.test.ts
 */
import { describe, it, expect } from "bun:test";
import { check } from "./bill-01";

describe("BILL-01", () => {
  it("fails on adjacent loop + service call without cap", () => {
    const v = check({ content: "for (const job of queue) {\n  await fetch(job.url);\n}\n", filePath: "worker.ts" });
    expect(v.verdict).toBe("fail");
  });

  it("passes capped, distant, and loop-free shapes", () => {
    expect(check({ content: "for (const j of q.slice(0, 10)) {\n  await fetch(j.u);\n}\n", filePath: "w.ts" }).verdict).toBe("pass");
    const far = "for (const a of b) {\n  console.log(a);\n}\n" + "\n".repeat(12) + "await fetch(url);\n";
    expect(check({ content: far, filePath: "w.ts" }).verdict).toBe("pass");
    expect(check({ content: "await fetch(url);\n", filePath: "w.ts" }).verdict).toBe("pass");
  });

  it("passes prose and quoted fixture loops", () => {
    expect(check({ content: "for (a)+(b); the fetch judgement is separate", filePath: "doc.md" }).verdict).toBe("pass");
    expect(
      check({ content: '"worker.ts": "for (const job of queue) {\\n  await fetch(job.url);\\n}\\n",', filePath: "t.test.ts" })
        .verdict,
    ).toBe("pass");
  });

  it("is unknown on empty content", () => {
    expect(check({}).verdict).toBe("unknown");
  });
});
