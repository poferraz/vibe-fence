/**
 * tests/benches/hostile.test.ts — Suite A hostile bench (plan 2026-10-27).
 * Hand-written attack fixtures (tests/benches/hostile/<rule>.json) must be
 * caught on at least one real surface (gate legs or runCheck tree scan).
 * 100% of the curated set: a fixture that can't be caught is a rule gap
 * (fix the rule + add a corpus TP) or belongs in the benign set as a TN —
 * never tolerated here.
 * Run: bun test tests/benches/hostile.test.ts
 */
import { describe, it, expect } from "bun:test";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
      const tmpRoot = mkdtempSync(join(tmpdir(), "vf-bench-"));
      // SEC-03 probes git check-ignore: roots must be real repos (as corpus does).
      execSync("git init -q .", { cwd: tmpRoot, stdio: "ignore" });
      try {
        for (const c of b.cases) {
          const score = scoreVariant(b.rule, c.payload, tmpRoot, c.path);
          expect(score.caught, `${c.id}: ${c.payload.slice(0, 80)}`).toBe(true);
        }
      } finally {
        rmSync(tmpRoot, { recursive: true, force: true });
      }
    }, 30_000);
  }
});
