import { describe, expect, test } from "bun:test";
import { mergeProbeHistory } from "./meta-probe";

const rec = (model: string) => ({ at: "t", endpoint: "e", model, ok: false });

describe("meta-probe history merge (append-only)", () => {
  test("fresh file starts a one-entry history", () => {
    expect(mergeProbeHistory(null, rec("m"))).toEqual([rec("m")]);
  });
  test("legacy single-record file is preserved, new record appended", () => {
    const prev = JSON.stringify(rec("old"));
    expect(mergeProbeHistory(prev, rec("new"))).toEqual([rec("old"), rec("new")]);
  });
  test("existing history array is extended, never replaced", () => {
    const prev = JSON.stringify({ probes: [rec("a"), rec("b")] });
    expect(mergeProbeHistory(prev, rec("c"))).toEqual([rec("a"), rec("b"), rec("c")]);
  });
  test("corrupt prior text starts fresh rather than throwing", () => {
    expect(mergeProbeHistory("{nope", rec("m"))).toEqual([rec("m")]);
  });
});
