import { expect, it } from "bun:test";
import { verifyRemote } from "./verify-remote";

it("queries the documented policyname field and labels the limited result", async () => {
  const result = await verifyRemote({
    connectionString: "postgres://example.invalid/test",
    clientFactory: () => ({
      async connect() {},
      async query(sql: string) {
        if (sql.includes("pg_policies") && !/\bpolicyname\b/.test(sql)) throw new Error("missing policyname");
        return { rows: [] };
      },
      async end() {},
    }),
  });
  expect(result.verdict).toBe("pass");
  expect(result.reason).toContain("not a complete authorization audit");
});

it("does not expose connection details when the database rejects the probe", async () => {
  const result = await verifyRemote({
    connectionString: "postgres://example.invalid/test",
    clientFactory: () => ({
      async connect() { throw new Error("PRIVATE_CONNECTION_SENTINEL"); },
      async query() { return { rows: [] }; },
      async end() {},
    }),
  });
  expect(result.verdict).toBe("unknown");
  expect(JSON.stringify(result)).not.toContain("PRIVATE_CONNECTION_SENTINEL");
});
