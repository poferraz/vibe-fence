import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compareBaseline, loadCorpus, runEval, type EvalCase } from "./eval.js";

describe("eval corpus", () => {
  test("loads and every case targets a registered rule with a valid expect", () => {
    const cases = loadCorpus();
    expect(cases.length).toBeGreaterThan(30);
    const ids = new Set(cases.map((c) => c.id));
    expect(ids.size).toBe(cases.length); // ids unique
    for (const c of cases) {
      expect(["fail", "pass"]).toContain(c.expect);
      const hasContent = typeof c.content === "string";
      const hasParts = Array.isArray(c.contentParts) && c.contentParts.length > 0;
      expect(hasContent !== hasParts).toBe(true); // exactly one of content / contentParts
    }
  });
});

describe("runEval scoring", () => {
  test("perfect mini-corpus scores 1.000/1.000 with no misses", () => {
    const cases: EvalCase[] = [
      { rule: "GIT-01", id: "t1", content: "git push -f origin main", toolName: "bash", expect: "fail" },
      { rule: "GIT-01", id: "f1", content: "git pull --rebase", toolName: "bash", expect: "pass" },
    ];
    const report = runEval(cases);
    expect(report.totals).toMatchObject({ tp: 1, fp: 0, tn: 1, fn: 0, precision: 1, recall: 1 });
    expect(report.misses).toEqual([]);
  });

  test("misses land in the misses list with rule + id", () => {
    const cases: EvalCase[] = [
      { rule: "GIT-01", id: "wrong-tp", content: "git pull --rebase", toolName: "bash", expect: "fail" }, // will be fn
      { rule: "GIT-01", id: "wrong-fp", content: "git push -f origin main", toolName: "bash", expect: "pass" }, // will be fp
    ];
    const report = runEval(cases);
    expect(report.totals).toMatchObject({ fn: 1, fp: 1 });
    expect(report.misses.map((m) => m.id).sort()).toEqual(["wrong-fp", "wrong-tp"]);
  });

  test("unknown verdicts count separately but still score against expect", () => {
    const cases: EvalCase[] = [
      // PRV-09 on package.json is out of scope -> not-applicable -> unknown + tn
      { rule: "PRV-09", id: "oos", content: "x", filePath: "package.json", expect: "pass" },
    ];
    const report = runEval(cases);
    expect(report.rules[0]).toMatchObject({ tn: 1, unknowns: 1 });
  });

  test("contentParts joins to the same verdict as whole content", () => {
    const whole: EvalCase[] = [{ rule: "GIT-01", id: "w", content: "git push -f origin main", toolName: "bash", expect: "fail" }];
    const parts: EvalCase[] = [{ rule: "GIT-01", id: "p", contentParts: ["git push ", "-f origin main"], toolName: "bash", expect: "fail" }];
    expect(runEval(whole).totals.tp).toBe(1);
    expect(runEval(parts).totals.tp).toBe(1);
  });

  test("--rule filters to one rule", () => {
    const report = runEval(loadCorpus(), { rule: "NET-01" });
    expect(report.rules.map((r) => r.rule)).toEqual(["NET-01"]);
  });
});

describe("compareBaseline", () => {
  test("perfect run matches committed (clean) baseline", () => {
    const report = runEval([
      { rule: "GIT-01", id: "t1", content: "git push -f origin main", toolName: "bash", expect: "fail" },
      { rule: "GIT-01", id: "f1", content: "git pull --rebase", toolName: "bash", expect: "pass" },
    ]);
    expect(compareBaseline(report)).toEqual([]);
  });

  test("flags a recall regression with the rule name", () => {
    const report = runEval([
      { rule: "GIT-01", id: "t1", content: "git pull --rebase", toolName: "bash", expect: "fail" }, // fn: recall 0
    ]);
    const out = compareBaseline(report);
    expect(out.some((l) => l.startsWith("GIT-01"))).toBe(true);
  });
});

describe("baseline artifact", () => {
  test("committed baseline exists and pins a clean run", () => {
    const base = JSON.parse(readFileSync(join(import.meta.dir, "..", "tests", "evals", "baseline.json"), "utf-8") as string) as {
      totals: { fp: number; fn: number };
    };
    expect(base.totals.fp).toBe(0);
    expect(base.totals.fn).toBe(0);
  });
});

// Full loop: corpus + runner must agree with the committed baseline.
describe("corpus/runner/baseline consistency", () => {
  test("current corpus shows no regressions vs committed baseline", () => {
    const report = runEval(loadCorpus());
    expect(compareBaseline(report)).toEqual([]);
  });
});
