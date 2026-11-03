/**
 * src/rules/db-01.test.ts — destructive SQL hard-block.
 * DROP/RLS-disable/TRUNCATE fail in migrations and exec sinks;
 * down migrations, docs, and data shapes pass.
 * Run: bun test src/rules/db-01.test.ts
 */
import { describe, it, expect } from "bun:test";
import { check } from "./db-01";

describe("DB-01", () => {
  it("fails destructive SQL in migration files", () => {
    expect(check({ content: "ALTER TABLE users DISABLE ROW LEVEL SECURITY;", filePath: "m/001.sql" }).verdict).toBe("fail");
    expect(check({ content: "DROP TABLE users;", filePath: "m/002.sql" }).verdict).toBe("fail");
    expect(check({ content: "TRUNCATE sessions;", filePath: "m/003.sql" }).verdict).toBe("fail");
    expect(check({ content: "DROP POLICY p ON t;", filePath: "m/004.sql" }).verdict).toBe("fail");
  });

  it("fails exec-sink SQL lines in source", () => {
    const v = check({ content: 'await db.query("DROP TABLE users");', filePath: "reset.ts" });
    expect(v.verdict).toBe("fail");
  });

  it("exempts down migrations, docs, and data shapes", () => {
    expect(check({ content: "DROP TABLE users;", filePath: "m/002.down.sql" }).verdict).toBe("pass");
    expect(check({ content: "DROP TABLE users;", filePath: "m/down/002.sql" }).verdict).toBe("pass");
    expect(check({ content: "never DROP TABLE in production", filePath: "guide.md" }).verdict).toBe("pass");
    expect(check({ content: 'assert(sql).toContain("DROP TABLE")', filePath: "mig.test.ts" }).verdict).toBe("pass");
  });

  it("is unknown on empty content", () => {
    expect(check({}).verdict).toBe("unknown");
  });
});
