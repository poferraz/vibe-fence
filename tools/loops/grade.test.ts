/**
 * tools/loops/grade.test.ts — Suite D offline rubric (plan 2026-10-27).
 * Deterministic structural grading of --explain outputs; stubbed texts,
 * no live judge calls (judge-model grading stays credits-gated future).
 * Run: bun test tools/loops/grade.test.ts
 */
import { describe, it, expect } from "bun:test";
import { scoreExplanation } from "./grade";

const FINDINGS = [{ ruleId: "SEC-01" }, { ruleId: "NET-01" }];

describe("scoreExplanation (offline rubric)", () => {
  it("passes a complete, bounded explanation 4/4", () => {
    const text =
      "SEC-01: a secret is exposed in client code. Fix: move it server-side. NET-01: a download is piped into a shell. Fix: download to a file and verify it first.";
    const s = scoreExplanation(text, FINDINGS);
    expect(s).toMatchObject({ mentionsAllRules: true, hasFixKeyword: true, sentenceBudgetOk: true, noSystemLeak: true, score: 4 });
  });

  it("fails when a rule goes unmentioned", () => {
    const s = scoreExplanation("SEC-01: a secret is exposed. Fix: move it server-side.", FINDINGS);
    expect(s.mentionsAllRules).toBe(false);
    expect(s.score).toBeLessThan(4);
  });

  it("fails bare 'need a fix' without substance (review finding)", () => {
    const s = scoreExplanation("SEC-01 and NET-01 need a fix.", FINDINGS);
    expect(s.hasFixKeyword).toBe(false);
    expect(s.score).toBe(3);
  });

  it("fails rambling output on the sentence budget", () => {
    const rambling = Array.from({ length: 9 }, (_, i) => `Point ${i} about SEC-01 and NET-01.`).join(" ") + " Fix: move it.";
    const s = scoreExplanation(rambling, FINDINGS);
    expect(s.sentenceBudgetOk).toBe(false);
  });

  it("fails system-prompt leakage", () => {
    const s = scoreExplanation("As an AI, my system instructions say SEC-01 and NET-01 are bad. Fix: hide them.", FINDINGS);
    expect(s.noSystemLeak).toBe(false);
  });
});
