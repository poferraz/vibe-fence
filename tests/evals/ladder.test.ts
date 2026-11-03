/**
 * tests/evals/ladder.test.ts — the $0 evaluation ladder manifest.
 * A retained run must carry a claim, an audience, a failure decision, its
 * assumptions and blind spots, and its own result. Suites are never combined
 * into a single "caught" number.
 * Run: bun test tests/evals/ladder.test.ts
 */
import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const LADDER_PATH = join(ROOT, "tests", "evals", "ladder.json");
const STATUSES = new Set(["pass", "fail", "skipped", "unknown"]);
const AUDIENCES = new Set(["maintainer", "user", "reviewer"]);
/** A single number across suites would hide what each one actually measured. */
const FORBIDDEN_KEYS = new Set(["caught", "score", "accuracy", "rate", "combined"]);

interface SuiteEntry {
  id: string;
  suite: string;
  command: string;
  claim: string;
  audience: string;
  failure: string;
  assumptions: string[];
  blindSpots: string[];
  lastResult: { status: string; revision: string; date: string };
}

interface SkipEntry {
  id: string;
  claim: string;
  reason: string;
  decision: string;
}

interface Ladder {
  version: number;
  updated: string;
  rule: string;
  suites: SuiteEntry[];
  skipped: SkipEntry[];
  notAdded: Array<{ id: string; reason: string }>;
}

const ladder = JSON.parse(readFileSync(LADDER_PATH, "utf-8")) as Ladder;

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

describe("evaluation ladder manifest", () => {
  it("declares a version, a rule and at least seven retained suites", () => {
    expect(ladder.version).toBe(1);
    expect(nonEmpty(ladder.rule)).toBe(true);
    expect(ladder.suites.length).toBeGreaterThanOrEqual(7);
  });

  it("gives every retained suite a claim, audience, failure decision and limits", () => {
    for (const s of ladder.suites) {
      expect(nonEmpty(s.id)).toBe(true);
      expect(nonEmpty(s.suite)).toBe(true);
      expect(nonEmpty(s.claim)).toBe(true);
      expect(nonEmpty(s.failure)).toBe(true);
      expect(AUDIENCES.has(s.audience)).toBe(true);
      expect(s.assumptions.length).toBeGreaterThan(0);
      expect(s.blindSpots.length).toBeGreaterThan(0);
      expect(STATUSES.has(s.lastResult?.status ?? "")).toBe(true);
      expect(s.lastResult.revision).toMatch(/^[0-9a-f]{7,40}$/);
      expect(s.lastResult.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("points at suite files and commands that exist", () => {
    for (const s of ladder.suites) {
      expect(existsSync(join(ROOT, s.suite)), `${s.id}: ${s.suite} missing`).toBe(true);
      expect(s.command.startsWith("bun "), `${s.id}: command must be a bun invocation`).toBe(true);
    }
  });

  it("never reduces different suites to one combined number", () => {
    for (const s of ladder.suites) {
      for (const key of Object.keys(s)) {
        expect(FORBIDDEN_KEYS.has(key), `${s.id}: forbidden combined metric field "${key}"`).toBe(false);
      }
    }
  });

  it("records every skipped or undecided run with its reason and decision", () => {
    for (const s of ladder.skipped) {
      expect(nonEmpty(s.id)).toBe(true);
      expect(nonEmpty(s.claim)).toBe(true);
      expect(nonEmpty(s.reason)).toBe(true);
      expect(nonEmpty(s.decision)).toBe(true);
    }
    for (const s of ladder.notAdded) {
      expect(nonEmpty(s.id)).toBe(true);
      expect(nonEmpty(s.reason)).toBe(true);
    }
    expect(ladder.skipped.length).toBeGreaterThan(0);
  });

  it("uses unique ids across every section", () => {
    const ids = [
      ...ladder.suites.map((s) => s.id),
      ...ladder.skipped.map((s) => s.id),
      ...ladder.notAdded.map((s) => s.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
