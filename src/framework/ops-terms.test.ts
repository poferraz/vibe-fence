/**
 * src/framework/ops-terms.test.ts — ops glossary matcher (sidebar).
 * Tiered awareness without always-on cost: 111 one-liners on disk, ≤3
 * injected into --explain prompts only on deterministic match, zero
 * new lines otherwise. Matcher input is finding metadata (ruleId/file/
 * reason) — it cannot see evidence/content (no such field on the input
 * type), so goal-blindness holds by construction.
 * Run: bun test src/framework/ops-terms.test.ts
 */
import { describe, it, expect } from "bun:test";
import { loadTerms, matchTerms, MAX_TERMS, type Matchable } from "./ops-terms";
import { buildExplainPrompt, type ExplainFinding } from "./explain";

const F = (reason: string, ruleId = "BILL-01", file = "probe.ts"): Matchable => ({ ruleId, file, reason });

describe("ops glossary data", () => {
  it("loads 111 unique terms with bounded one-liners", () => {
    const terms = loadTerms();
    expect(terms).toHaveLength(111);
    const names = terms.map((t) => t.term);
    expect(new Set(names).size).toBe(111);
    for (const t of terms) {
      expect(t.term.length).toBeGreaterThan(0);
      expect(t.def.length).toBeGreaterThan(0);
      expect(t.def.length).toBeLessThanOrEqual(140); // ~35 tokens max per injection
    }
  });
});

describe("matchTerms (deterministic, metadata-only)", () => {
  it("matches case-insensitively on reason text", () => {
    const hits = matchTerms([F("circuit breakers tripped on checkout calls")]);
    expect(hits.map((h) => h.term)).toContain("Circuit Breakers");
  });

  it("short terms need word boundaries (no junk substrings)", () => {
    expect(matchTerms([F("William approved the deploy")]).map((h) => h.term)).not.toContain("IAM");
    expect(matchTerms([F("TLS handshake failed")]).map((h) => h.term)).toContain("TLS");
  });

  it("caps at MAX_TERMS in glossary order, deduped", () => {
    expect(MAX_TERMS).toBe(3);
    const findings = [
      F("timeouts with no retries and no exponential backoff on webhooks"),
      F("timeouts again plus missing idempotency on webhooks"),
    ];
    const hits = matchTerms(findings);
    expect(hits).toHaveLength(3);
    expect(hits.map((h) => h.term)).toEqual(["Timeouts", "Retries", "Exponential Backoff"]);
  });

  it("returns [] when nothing matches", () => {
    expect(matchTerms([F("client-bundle secret hard-block: NEXT_PUBLIC_X_SECRET", "SEC-01", "app/page.tsx")])).toEqual([]);
  });
});

describe("explain prompt wiring (L1 injection)", () => {
  const ctx = { kind: "check" as const, target: "/proj" };

  it("adds no lines when no term matches (zero-cost path)", () => {
    const failures: ExplainFinding[] = [
      { ruleId: "SEC-01", severity: "block", file: "app/page.tsx", reason: "client-bundle secret hard-block: NEXT_PUBLIC_X_SECRET" },
    ];
    const prompt = buildExplainPrompt(failures, ctx);
    expect(prompt).not.toContain("Context terms:");
  });

  it("appends ≤3 matched one-liners when terms hit", () => {
    const failures: ExplainFinding[] = [
      { ruleId: "BILL-01", severity: "block", file: "probe.ts", reason: "uncapped retries with no exponential backoff or idempotency key" },
    ];
    const prompt = buildExplainPrompt(failures, ctx);
    expect(prompt).toContain("Context terms:");
    expect(prompt).toContain("- Retries:");
    expect(prompt).toContain("- Exponential Backoff:");
    expect(prompt).toContain("- Idempotency:");
    expect(prompt).not.toContain("- Webhooks:");
  });
});
