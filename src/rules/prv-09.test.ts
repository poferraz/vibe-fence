/**
 * src/rules/prv-09.test.ts — fixture hygiene scope + precision.
 * Fails only inside fixture scope; author emails and version numbers
 * elsewhere are not fixture PII.
 * Run: bun test src/rules/prv-09.test.ts
 */
import { describe, it, expect } from "bun:test";
import { check } from "./prv-09";

describe("PRV-09", () => {
  it("fails on real-looking PII inside fixtures", () => {
    const v = check({ content: '{"email": "jane.doe@gmail.com"}', filePath: "tests/fixtures/users.json" });
    expect(v.verdict).toBe("fail");
    const phone = check({ content: "call 555-123-4567", filePath: "seed/data.sql" });
    expect(phone.verdict).toBe("fail");
  });

  it("fails on private keys even when marked synthetic", () => {
    const v = check({
      content: "example fixture\n-----BEGIN RSA PRIVATE " + "KEY-----\nxxx",
      filePath: "tests/fixtures/key.pem",
    });
    expect(v.verdict).toBe("fail");
  });

  it("passes synthetic-marked fixtures", () => {
    const v = check({ content: '{"email": "user@example.com", "note": "SYNTHETIC"}', filePath: "tests/fixtures/users.json" });
    expect(v.verdict).toBe("pass");
  });

  it("is not-applicable outside fixture scope", () => {
    expect(check({ content: '{"author": "poferraz@me.com"}', filePath: "package.json" }).verdict).toBe("not-applicable");
    expect(check({ content: "contact poferraz@me.com", filePath: "CITATION.cff" }).verdict).toBe("not-applicable");
    // A repo merely containing fixtures elsewhere does not widen scope.
    expect(
      check({ content: '{"author": "poferraz@me.com"}', filePath: "package.json", fileList: ["tests/fixtures/a.json"] }).verdict,
    ).toBe("not-applicable");
  });

  it("does not mistake bare digit runs for phones", () => {
    expect(check({ content: "build .2422633122 done", filePath: "tests/fixtures/v.txt" }).verdict).toBe("pass");
    expect(check({ content: "id 2422633122", filePath: "tests/fixtures/v.txt" }).verdict).toBe("pass");
  });

  it("is unknown on missing content, not-applicable on empty", () => {
    expect(check({}).verdict).toBe("unknown");
    expect(check({ content: "  ", filePath: "tests/fixtures/e.json" }).verdict).toBe("not-applicable");
  });
});
