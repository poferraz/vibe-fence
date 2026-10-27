/**
 * src/rules/sec-01.test.ts — SEC-01 client-bundle secret hard-block.
 * Proof beat 1: a NEXT_PUBLIC_* secret is stopped; benign public vars pass.
 * Run: bun test src/rules/sec-01.test.ts
 */
import { describe, it, expect } from "bun:test";
import { check, SEC01_ID } from "./sec-01";
import { REGISTRY } from "./index";

describe("SEC-01", () => {
  it("is registered as a blocking rule", () => {
    expect(REGISTRY[SEC01_ID]).toBeDefined();
    expect(REGISTRY[SEC01_ID]?.severity).toBe("block");
  });

  it("fails on NEXT_PUBLIC_ service-role key (the demo leak)", () => {
    const v = check({ content: "const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;" });
    expect(v.id).toBe(SEC01_ID);
    expect(v.verdict).toBe("fail");
    expect(v.reason).toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("fails on VITE_ / PUBLIC_ / EXPO_PUBLIC_ secret pairings", () => {
    for (const name of ["VITE_STRIPE_SECRET", "PUBLIC_API_PRIVATE", "EXPO_PUBLIC_AUTH_SECRET"]) {
      expect(check({ content: `${name}=sk-live-abc` }).verdict).toBe("fail");
    }
  });

  it("passes on benign public vars without secret keywords", () => {
    for (const content of [
      "const url = process.env.NEXT_PUBLIC_API_URL;",
      "VITE_APP_NAME=myapp",
      "PUBLIC_SITE_TITLE=Docs",
    ]) {
      expect(check({ content }).verdict).toBe("pass");
    }
  });

  it("passes on placeholder values (template, not a leak)", () => {
    const v = check({ content: "NEXT_PUBLIC_SECRET=your-secret-here" });
    expect(v.verdict).toBe("pass");
  });

  it("passes in doc/template files (mention ≠ leak)", () => {
    const v = check({
      content: "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
      filePath: ".env.example",
    });
    expect(v.verdict).toBe("pass");
    const md = check({
      content: "never set NEXT_PUBLIC_SECRET in client code",
      filePath: "docs/guide.md",
    });
    expect(md.verdict).toBe("pass");
  });

  it("is unknown on empty content (unknown≠pass)", () => {
    expect(check({}).verdict).toBe("unknown");
  });

  it("passes when the pairing is quoted (fixture string, not a reference)", () => {
    const v = check({ content: 'const leak = "const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;";' });
    expect(v.verdict).toBe("pass");
  });

  it("passes in comments, fails in template interpolation (backticks act)", () => {
    expect(check({ content: "// never set NEXT_PUBLIC_SECRET in client code" }).verdict).toBe("pass");
    expect(check({ content: "# NEXT_PUBLIC_SECRET belongs server-side" }).verdict).toBe("pass");
    const v = check({ content: "const k = `${env.NEXT_PUBLIC_SECRET}`;" });
    expect(v.verdict).toBe("fail");
  });
});
