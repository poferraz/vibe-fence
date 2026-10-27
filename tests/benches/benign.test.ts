/**
 * tests/benches/benign.test.ts — Suite B benign bench (plan 2026-10-27).
 * Real-life benign fixtures (tests/benches/benign/<rule>.json) must fire
 * on NEITHER surface: the false-block budget is 0. A firing here is a
 * rule FP (fix the rule) or an over-hot fixture (cool it) — triaged,
 * never tolerated.
 * Run: bun test tests/benches/benign.test.ts
 */
import { describe, it, expect } from "bun:test";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadBenignBenches, scoreVariant } from "../../tools/eval";

const benches = loadBenignBenches();

describe("benign bench fixtures", () => {
  it("covers all 11 rules with >=10 fixtures each", () => {
    expect(benches).toHaveLength(11);
    for (const b of benches) {
      expect(b.cases.length).toBeGreaterThanOrEqual(10);
    }
  });

  for (const b of benches) {
    it(`${b.rule}: zero false positives on both surfaces`, () => {
      const tmpRoot = mkdtempSync(join(tmpdir(), "vf-bench-"));
      // SEC-03 probes git check-ignore: roots must be real repos (as corpus does).
      execSync("git init -q .", { cwd: tmpRoot, stdio: "ignore" });
      try {
        for (const c of b.cases) {
          const score = scoreVariant(b.rule, c.payload, tmpRoot, c.path);
          expect(score.caught, `${c.id} fired (gate=${score.gateBlocked} tree=${score.treeBlocked}): ${c.payload.slice(0, 80)}`).toBe(false);
        }
      } finally {
        rmSync(tmpRoot, { recursive: true, force: true });
      }
    }, 30_000);
  }
});
