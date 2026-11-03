/**
 * src/framework/explain.test.ts — --explain contract tests (Phase 3a).
 * All Model API traffic is mocked fetch — no live calls, in CI or locally.
 * Run: bun test src/framework/explain.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildExplainPrompt, explainBlocking, type ExplainFinding } from "./explain";
import { withBudgetCap, BudgetExceededError } from "./billing-guard";

const created: string[] = [];
const ORIG_FETCH = globalThis.fetch;
const ORIG_KEYS = { MUSE_API_KEY: process.env["MUSE_API_KEY"], META_API_KEY: process.env["META_API_KEY"] };
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
  globalThis.fetch = ORIG_FETCH;
  for (const [k, v] of Object.entries(ORIG_KEYS)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  delete process.env["MUSE_MODEL_COMPANION"];
});

function makeProject(withFenceDir = true): string {
  const root = mkdtempSync(join(tmpdir(), "vf-explain-"));
  created.push(root);
  if (withFenceDir) mkdirSync(join(root, ".fence"), { recursive: true });
  return root;
}

const FAILURES: ExplainFinding[] = [
  { ruleId: "SEC-01", severity: "block", file: "app/page.tsx", reason: "client-bundle secret hard-block: NEXT_PUBLIC_X_SECRET" },
];

function mockFetch(handler: (url: string, init: RequestInit | undefined) => Response): { calls: Array<{ url: string; init: RequestInit | undefined }> } {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init);
  }) as typeof fetch;
  return { calls };
}

function okResponse(text: string, id: string): Response {
  return new Response(JSON.stringify({ output_text: text, id }), { status: 200 });
}

describe("buildExplainPrompt (S-05/S-11 goal-blind)", () => {
  it("excludes untrusted metadata from the prompt", () => {
    const prompt = buildExplainPrompt([{ ruleId: "SEC-01", severity: "block", file: "PATH_SENTINEL", reason: "SECRET_SENTINEL" }, { ruleId: "UNKNOWN_SENTINEL", severity: "SEVERITY_SENTINEL", file: "x", reason: "y" }], { kind: "gate", target: "TOOL_SENTINEL" });
    expect(prompt).toContain("SEC-01");
    for (const value of ["PATH_SENTINEL", "SECRET_SENTINEL", "UNKNOWN_SENTINEL", "SEVERITY_SENTINEL", "TOOL_SENTINEL"]) expect(prompt).not.toContain(value);
  });
});

describe("explainBlocking contract (mocked fetch)", () => {
  it("skips without calling fetch when there is nothing to explain", async () => {
    process.env["MUSE_API_KEY"] = "test-key";
    const { calls } = mockFetch(() => okResponse("x", "req_1"));
    const out = await explainBlocking([], { kind: "check", target: "/proj" }, { projectRoot: makeProject() });
    expect(out).toEqual({ status: "skipped", code: "empty", reason: "nothing to explain" });
    expect(calls).toHaveLength(0);
  });

  it("skips without calling fetch when no key is set", async () => {
    delete process.env["MUSE_API_KEY"];
    delete process.env["META_API_KEY"];
    const { calls } = mockFetch(() => okResponse("x", "req_1"));
    const out = await explainBlocking(FAILURES, { kind: "check", target: "/proj" }, { projectRoot: makeProject() });
    expect(out.status).toBe("skipped");
    if (out.status === "skipped") expect(out.code).toBe("no-key");
    expect(calls).toHaveLength(0);
  });

  it("makes exactly one stateless Spark call and logs the artefact", async () => {
    process.env["MUSE_API_KEY"] = "test-key";
    const root = makeProject();
    const { calls } = mockFetch(() => okResponse("Move the secret server-side.", "req_abc"));
    const out = await explainBlocking(FAILURES, { kind: "gate", target: "write" }, { projectRoot: root });
    expect(out).toEqual({ status: "explained", text: "Move the secret server-side.", requestId: "req_abc", model: "muse-spark-1.3" });
    expect(calls).toHaveLength(1);
    const body = JSON.parse(String(calls[0]!.init?.body)) as Record<string, unknown>;
    expect(body["model"]).toBe("muse-spark-1.3");
    expect(body["input"]).toBe(buildExplainPrompt(FAILURES, { kind: "gate", target: "write" }));
    expect("previous_response_id" in body).toBe(false);
    const headers = calls[0]!.init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-key");
    const events = readFileSync(join(root, ".fence", "events.ndjson"), "utf-8");
    expect(events).toContain('"type":"meta:responses"');
    expect(events).toContain('"requestId":"req_abc"');
    expect(events).toContain('"model":"muse-spark-1.3"');
  });

  it("extracts message text from the real Responses output shape", async () => {
    process.env["MUSE_API_KEY"] = "test-key";
    const root = makeProject();
    mockFetch(() => new Response(JSON.stringify({
      id: "resp_real",
      output: [
        { type: "reasoning", id: "rs_1", summary: [], status: "completed" },
        { type: "message", id: "msg_1", role: "assistant", status: "completed", content: [{ type: "output_text", text: "Move the key server-side.", annotations: [] }] },
      ],
    }), { status: 200 }));
    const out = await explainBlocking(FAILURES, { kind: "gate", target: "write" }, { projectRoot: root });
    expect(out).toEqual({ status: "explained", text: "Move the key server-side.", requestId: "resp_real", model: "muse-spark-1.3" });
  });

  it("fails open on API errors (skipped, never throws)", async () => {
    process.env["MUSE_API_KEY"] = "test-key";
    const { calls } = mockFetch(() => new Response("boom", { status: 500 }));
    const out = await explainBlocking(FAILURES, { kind: "check", target: "/proj" }, { projectRoot: makeProject() });
    expect(out.status).toBe("skipped");
    if (out.status === "skipped") {
      expect(out.code).toBe("error");
      expect(out.reason).toContain("500");
    }
    expect(calls).toHaveLength(1);
  });

  it("the one-call budget cap trips on a second call (mechanism proof)", async () => {
    const callOnce = withBudgetCap({ maxCalls: 1 }, async () => "ok");
    await expect(callOnce()).resolves.toBe("ok");
    await expect(callOnce()).rejects.toBeInstanceOf(BudgetExceededError);
  });
});

it("keeps private sentinels out of the request and provider error", async () => {
  process.env.MUSE_API_KEY = "test-key";
  const { calls } = mockFetch(() => new Response("PROVIDER_SECRET_SENTINEL", { status: 500, statusText: "PROVIDER_SECRET_SENTINEL" }));
  const findings = [{ ruleId: "SEC-01", severity: "block", file: "PATH_SENTINEL", reason: "REASON_SENTINEL" }];
  const outcome = await explainBlocking(findings, { kind: "gate", target: "TOOL_SENTINEL" }, { projectRoot: makeProject() });
  const body = String(calls[0]?.init?.body);
  for (const value of ["PATH_SENTINEL", "REASON_SENTINEL", "TOOL_SENTINEL"]) expect(body).not.toContain(value);
  expect(JSON.stringify(outcome)).not.toContain("PROVIDER_SECRET_SENTINEL");
});

it("discloses the model request before sending it", async () => {
  process.env.MUSE_API_KEY = "test-key";
  const original = console.error;
  const messages: string[] = [];
  console.error = (...args: unknown[]) => { messages.push(args.join(" ")); };
  try {
    let disclosedBeforeRequest = false;
    mockFetch(() => { disclosedBeforeRequest = messages.join(" ").includes("rule categories"); return okResponse("Review this.", "req_1"); });
    await explainBlocking(FAILURES, { kind: "check", target: "private" }, { projectRoot: makeProject() });
    expect(disclosedBeforeRequest).toBe(true);
  } finally { console.error = original; }
});

it("bounds model request size and output tokens without storing a response", async () => {
  process.env.MUSE_API_KEY = "test-key";
  const { calls } = mockFetch(() => okResponse("Move the secret server-side.", "req_safe"));
  const many = Array.from({ length: 2000 }, () => FAILURES[0]!);
  const result = await explainBlocking(many, { kind: "check", target: "private" }, { projectRoot: makeProject() });
  const body = JSON.parse(String(calls[0]!.init?.body));
  expect(result.status).toBe("explained");
  expect(body.max_output_tokens).toBe(512);
  expect(body.store).toBe(false);
  expect(body.input.length).toBeLessThan(3000);
});

it("rejects malformed, overlong, or terminal-control model responses", async () => {
  process.env.MUSE_API_KEY = "test-key";
  for (const text of ["", "x".repeat(5000), "\u001b]0;SENTINEL\u0007", "safe\rSENTINEL"]) {
    mockFetch(() => okResponse(text, "req_safe"));
    const result = await explainBlocking(FAILURES, { kind: "check", target: "private" }, { projectRoot: makeProject() });
    expect(result.status).toBe("skipped");
    expect(JSON.stringify(result)).not.toContain("SENTINEL");
  }
});

it("stops waiting for a stalled model request", async () => {
  process.env.MUSE_API_KEY = "test-key";
  let signal: AbortSignal | null | undefined;
  globalThis.fetch = ((_url: unknown, init?: RequestInit) => { signal = init?.signal; return new Promise<Response>(() => {}); }) as typeof fetch;
  const result = await explainBlocking(FAILURES, { kind: "check", target: "private" }, { projectRoot: makeProject(), timeoutMs: 20 });
  expect(result.status).toBe("skipped");
  expect(signal?.aborted).toBe(true);
}, 1000);

it("does not append model event metadata through an outside symlink", async () => {
  const { symlinkSync, writeFileSync } = await import("node:fs");
  process.env.MUSE_API_KEY = "test-key";
  const root = makeProject(), outside = makeProject(false);
  const sentinel = join(outside, "sentinel");
  writeFileSync(sentinel, "KEEP");
  symlinkSync(sentinel, join(root, ".fence/events.ndjson"));
  mockFetch(() => okResponse("Move it server-side.", "req_safe"));
  const result = await explainBlocking(FAILURES, { kind: "check", target: "private" }, { projectRoot: root });
  expect(result.status).toBe("explained");
  expect(readFileSync(sentinel, "utf8")).toBe("KEEP");
});

it("requests minimal reasoning and reports valid token usage without leaking raw fields", async () => {
  process.env.MUSE_API_KEY = "test-key";
  const { calls } = mockFetch(() => new Response(JSON.stringify({ id: "req_safe", output_text: "Keep the value server-side.", usage: { input_tokens: 120, output_tokens: 80, private: "USAGE_SENTINEL" } }), { status: 200 }));
  const result = await explainBlocking(FAILURES, { kind: "check", target: "private" }, { projectRoot: makeProject() });
  const body = JSON.parse(String(calls[0]!.init?.body));
  expect(body.reasoning).toEqual({ effort: "minimal" });
  expect(result.status).toBe("explained");
  if (result.status === "explained") expect(result.usage).toEqual({ inputTokens: 120, outputTokens: 80 });
  expect(JSON.stringify(result)).not.toContain("USAGE_SENTINEL");
});
