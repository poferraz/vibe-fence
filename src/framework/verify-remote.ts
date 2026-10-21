/**
 * src/framework/verify-remote.ts
 * Remote RLS verification via pg_policies introspection (GEM-04, S-11/S-14).
 * Introspects pg_policies on promotion to public; unknown on offline/ERR, never pass.
 * Uses `pg` if available; degrades gracefully otherwise.
 */

export type RemoteVerdict = "pass" | "fail" | "unknown";

export interface VerifyRemoteResult {
  verdict: RemoteVerdict;
  reason: string;
  details?: Array<{ table: string; policy: string; permissive: string; roles: string[] }>;
  errorCode?: string;
}

export interface VerifyRemoteOptions {
  /** Postgres connection string; falls back to DATABASE_URL / SUPABASE_DB_URL env */
  connectionString?: string;
  /** Timeout ms for the query (default 5000) */
  timeoutMs?: number;
}

function resolveConnectionString(explicit?: string): string | null {
  if (explicit) return explicit;
  const env = process.env as Record<string, string | undefined>;
  return env["DATABASE_URL"] ?? env["SUPABASE_DB_URL"] ?? env["POSTGRES_URL"] ?? null;
}

/**
 * Query pg_policies and classify. Never returns "pass" when offline or on error.
 * - pass: every public table has RLS enabled and no permissive USING(true) policy
 * - fail: at least one table lacks RLS or has USING(true) permissive policy
 * - unknown: offline, missing pg driver, missing connection string, timeout, or query error
 */
export async function verifyRemote(opts: VerifyRemoteOptions = {}): Promise<VerifyRemoteResult> {
  const connStr = resolveConnectionString(opts.connectionString);
  if (!connStr) {
    return {
      verdict: "unknown",
      reason: "no DATABASE_URL / SUPABASE_DB_URL — offline or not configured (unknown≠pass)",
      errorCode: "ERR_NO_CONNECTION_STRING",
    };
  }

  const timeoutMs = opts.timeoutMs ?? 5000;

  // Dynamic import so repo works without pg installed (unknown, not crash)
  let pg: { Client: new (config: { connectionString: string }) => { connect(): Promise<void>; query(s: string): Promise<{ rows: unknown[] }>; end(): Promise<void> } };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pg = await import("pg" as string) as any;
  } catch {
    return {
      verdict: "unknown",
      reason: "pg driver not installed — run `bun add pg` for remote verification (unknown≠pass)",
      errorCode: "ERR_NO_PG_DRIVER",
    };
  }

  const client = new pg.Client({ connectionString: connStr });

  // Guard timeout — must resolve to unknown, never hang
  const timeoutPromise = new Promise<VerifyRemoteResult>((resolve) =>
    setTimeout(
      () => resolve({ verdict: "unknown", reason: `pg_policies query timed out after ${timeoutMs}ms (unknown≠pass)`, errorCode: "ERR_TIMEOUT" }),
      timeoutMs,
    ),
  );

  const work = (async (): Promise<VerifyRemoteResult> => {
    try {
      await client.connect();

      // RLS status per table + permissive policies with USING(true)
      // Two queries: one for tables without RLS, one for permissive policies
      const rlsQuery = `
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND rowsecurity = false
      `;
      const policyQuery = `
        SELECT polname, schemaname, tablename, permissive, roles::text, qual::text, with_check::text
        FROM pg_policies
        WHERE schemaname = 'public'
      `;

      const [rlsRes, polRes] = await Promise.all([client.query(rlsQuery), client.query(policyQuery)]);

      const noRls = rlsRes.rows as Array<{ schemaname: string; tablename: string }>;
      const policies = polRes.rows as Array<{
        polname: string;
        schemaname: string;
        tablename: string;
        permissive: string;
        roles: string;
        qual: string | null;
        with_check: string | null;
      }>;

      // Permissive USING(true) — the classic agent self-fix
      const permissiveTrue = policies.filter((p) => {
        const qual = (p.qual ?? "").trim().toLowerCase();
        const withCheck = (p.with_check ?? "").trim().toLowerCase();
        return qual === "true" || qual === "(true)" || withCheck === "true" || withCheck === "(true)";
      });

      if (noRls.length === 0 && permissiveTrue.length === 0) {
        return {
          verdict: "pass",
          reason: "all public tables have RLS enabled and no USING(true) permissive policy",
          details: policies.map((p) => ({ table: p.tablename, policy: p.polname, permissive: p.permissive, roles: [p.roles] })),
        };
      }

      const reasons: string[] = [];
      if (noRls.length > 0) reasons.push(`RLS disabled on: ${noRls.map((r) => r.tablename).join(", ")}`);
      if (permissiveTrue.length > 0) reasons.push(`permissive USING(true) on: ${permissiveTrue.map((p) => `${p.tablename}.${p.polname}`).join(", ")}`);

      return {
        verdict: "fail",
        reason: reasons.join("; "),
        details: [...permissiveTrue.map((p) => ({ table: p.tablename, policy: p.polname, permissive: p.permissive, roles: [p.roles] }))],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Offline / auth / network → unknown, never pass (S-05 invariant)
      return { verdict: "unknown", reason: `pg_policies introspection failed: ${msg} (unknown≠pass)`, errorCode: "ERR_QUERY" };
    } finally {
      try {
        await client.end();
      } catch {
        // ignore close error
      }
    }
  })();

  return Promise.race([work, timeoutPromise]);
}
