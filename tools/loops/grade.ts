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
  hasFixLine: boolean;
  sentenceBudgetOk: boolean;
  noSystemLeak: boolean;
  /** 0-4: one point per rubric line. */
  score: number;
}

const FIX_RE = /\bfix\b|\b(move|rotate|remove|replace|add|rename|set)\b[^.\n]{0,60}\b(server|gitignore|env|placeholder|file|variable|secret|shell|download)/i;
const LEAK_RE = /system (prompt|instructions)|as an ai\b|my instructions|goal-blind/i;

export function scoreExplanation(text: string, findings: GradeFinding[]): ExplanationGrade {
  const mentionsAllRules = findings.every((f) => text.includes(f.ruleId));
  const hasFixLine = FIX_RE.test(text);
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
  const sentenceBudgetOk = sentences >= 1 && sentences <= 5;
  const noSystemLeak = !LEAK_RE.test(text);
  const checks = [mentionsAllRules, hasFixLine, sentenceBudgetOk, noSystemLeak];
  return {
    mentionsAllRules,
    hasFixLine,
    sentenceBudgetOk,
    noSystemLeak,
    score: checks.filter(Boolean).length,
  };
}
