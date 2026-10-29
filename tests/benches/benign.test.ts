/**
 * tests/benches/benign.test.ts — Suite B benign bench (plan 2026-10-27).
 * Real-life benign fixtures (tests/benches/benign/<rule>.json) must fire
 * on NEITHER surface: the false-block budget is 0. A firing here is a
 * rule FP (fix the rule) or an over-hot fixture (cool it) — triaged,
 * never tolerated.
 * Run: bun test tests/benches/benign.test.ts
 */
import { describe, it, expect } from "bun:test";
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
      for (const c of b.cases) {
        const score = scoreVariant(b.rule, c.payload, c.path);
        expect(score.error, `${c.id} errored (errors must never read as clean): ${score.error}`).toBeUndefined();
        expect(score.caught, `${c.id} fired (gate=${score.gateBlocked} tree=${score.treeBlocked}): ${c.payload.slice(0, 80)}`).toBe(false);
      }
    }, 60_000);
  }
});
