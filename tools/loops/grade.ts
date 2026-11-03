/**
 * tools/loops/grade.ts — Suite D offline rubric for --explain outputs
 * (plan 2026-10-27, phase 2). Deterministic structural checks only:
 * every blocked rule mentioned, an actionable fix present, the 2-3
 * sentence budget kept, and no system-prompt leakage. Semantic judging
 * (is the fix *correct*?) needs a judge model and stays credits-gated.
 */

export interface GradeFinding {
  ruleId: string;
}

export interface ExplanationGrade {
  mentionsAllRules: boolean;
  /** Keyword heuristic (honest name): "fix" plus substance, not a semantic judgment. */
  hasFixKeyword: boolean;
  sentenceBudgetOk: boolean;
  noSystemLeak: boolean;
  /** 0-4: one point per rubric line. Coarse structural signal only. */
  score: number;
}

/** "fix" must carry substance after it — bare "need a fix." scores 0 here. */
const FIX_RE = /\bfix\b\s*:?[^.\n]{2,80}/i;
const LEAK_RE = /system (prompt|instructions)|as an ai\b|my instructions|goal-blind/i;

/** 2-3 sentences requested, 4 tolerated; 5+ rambles. */
const MAX_SENTENCES = 4;

export function scoreExplanation(text: string, findings: GradeFinding[]): ExplanationGrade {
  const mentionsAllRules = findings.every((f) => text.includes(f.ruleId));
  const hasFixKeyword = FIX_RE.test(text);
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
  const sentenceBudgetOk = sentences >= 1 && sentences <= MAX_SENTENCES;
  const noSystemLeak = !LEAK_RE.test(text);
  const checks = [mentionsAllRules, hasFixKeyword, sentenceBudgetOk, noSystemLeak];
  return {
    mentionsAllRules,
    hasFixKeyword,
    sentenceBudgetOk,
    noSystemLeak,
    score: checks.filter(Boolean).length,
  };
}
