/**
 * src/rules/sec-03.test.ts — secret commit to git.
 * Live tokens (prefix + entropy, no dummy markers) fail; test keys,
 * doc examples, low-entropy placeholders, and ignored .env pass.
 * A tracked/committable .env fails via git's own verdict.
 * Run: bun test src/rules/sec-03.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { check, shannon } from "./sec-03";

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function gitEnv(): Record<string, string> {
  return { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
}

// Fragmented: the static tree scan must see pieces (else this file would fail
// its own rule), while the runtime value is a whole realistic token.
const LIVE_STRIPE = "sk_" + "live_9f8e7d6c5b4a3948271605f4e3d2c1b0a";
const LIVE_GITHUB = "ghp_" + "aB3dEf7hIj9kLmN0pQrStUvWxYz1234567890";
const LIVE_AWS = "AK" + "IAIOSFODNN7X4K9Q2Z";

describe("SEC-03", () => {
  it("fails on live secret tokens in source", () => {
    expect(shannon("9f8e7d6c5b4a3948271605f4e3d2c1b0a")).toBeGreaterThan(3.5);
    const v = check({ content: `const k = "${LIVE_STRIPE}";`, filePath: "app/pay.ts" });
    expect(v.verdict).toBe("fail");
    expect(v.evidence).not.toContain("9f8e7d6c5b4a3948271605f4e3d2c1b0a");
    expect(check({ content: `token=${LIVE_GITHUB}`, filePath: "sync.py" }).verdict).toBe("fail");
    expect(check({ content: `key = ${LIVE_AWS}`, filePath: "deploy.sh" }).verdict).toBe("fail");
    expect(check({ content: "-----BEGIN RSA PRIVATE " + "KEY-----\nxxx", filePath: "id_rsa" }).verdict).toBe("fail");
  });

  it("passes test keys, doc examples, and low-entropy placeholders", () => {
    expect(check({ content: 'const k = "sk_test_abc";', filePath: "app/pay.ts" }).verdict).toBe("pass");
    expect(check({ content: "sk-live-abc", filePath: "notes.md" }).verdict).toBe("pass");
    expect(check({ content: "key = AKIAIOSFODNN7EXAMPLE", filePath: "docs.md" }).verdict).toBe("pass");
    expect(check({ content: "ghp_xxxxxxxxxxxxxxxxxxxx", filePath: "guide.md" }).verdict).toBe("pass");
    expect(check({ content: "token = your-secret-here", filePath: "app.ts" }).verdict).toBe("pass");
  });

  it("fails on committable .env, passes ignored .env", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-sec03-"));
    created.push(root);
    const home = mkdtempSync(join(tmpdir(), "vf-home-"));
    created.push(home);
    const env = { ...gitEnv() };
    execSync("git init -q .", { cwd: root, env });
    writeFileSync(join(root, ".env"), "K=v\n", "utf-8");
    // Isolate HOME via explicit env (process.env mutation does not reach
    // children): the developer's global excludes may ignore .env, which
    // would (correctly) flip the verdict. The product honors all sources.
    const isolated = { ...env, HOME: home };
    expect(check({ content: "K=v", filePath: ".env", projectRoot: root, env: isolated }).verdict).toBe("fail");
    writeFileSync(join(root, ".gitignore"), ".env\n", "utf-8");
    expect(check({ content: "K=v", filePath: ".env", projectRoot: root, env: isolated }).verdict).toBe("pass");
    expect(check({ content: "K=", filePath: ".env.example", projectRoot: root, env: isolated }).verdict).toBe("pass");
  });

  it("fails on an already-tracked .env even when ignored, with a safe repair", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-sec03-tracked-"));
    created.push(root);
    const home = mkdtempSync(join(tmpdir(), "vf-home-"));
    created.push(home);
    const env = { ...gitEnv(), HOME: home };
    execSync("git init -q .", { cwd: root, env });
    writeFileSync(join(root, ".env"), "SECRET=tracked-value\n", "utf-8");
    execSync("git add .env", { cwd: root, env });
    execSync('git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm seed', { cwd: root, env });
    writeFileSync(join(root, ".gitignore"), ".env\n", "utf-8");
    const v = check({ content: "SECRET=tracked-value", filePath: ".env", projectRoot: root, env });
    expect(v.verdict).toBe("fail");
    expect(v.reason).toContain("tracked");
    expect(v.reason).toContain("git rm --cached");
    // Safe output: filename only, never the secret bytes.
    expect(v.evidence).toBe(".env");
    expect(v.reason).not.toContain("tracked-value");
    // .env.example stays unflagged even when tracked.
    writeFileSync(join(root, ".env.example"), "EXAMPLE=1\n", "utf-8");
    execSync("git add .env.example", { cwd: root, env });
    expect(check({ content: "EXAMPLE=1", filePath: ".env.example", projectRoot: root, env }).verdict).toBe("pass");
    // Untracking (index-only) clears the tracked verdict; ignored+untracked passes.
    execSync("git rm --cached -q .env", { cwd: root, env });
    expect(check({ content: "SECRET=tracked-value", filePath: ".env", projectRoot: root, env }).verdict).toBe("pass");
  });

  it("is unknown on empty content", () => {
    expect(check({}).verdict).toBe("unknown");
  });
});
