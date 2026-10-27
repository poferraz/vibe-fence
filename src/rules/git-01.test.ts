/**
 * src/rules/git-01.test.ts — destructive git hard-block.
 * Force-push to main/master (or undeterminable refs) and reset --hard fail;
 * force-with-lease, explicit feature refs, and docs pass.
 * Run: bun test src/rules/git-01.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { check } from "./git-01";

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function gitEnv(): Record<string, string> {
  return { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
}

function makeRepo(branch = "master"): string {
  const root = mkdtempSync(join(tmpdir(), "vf-git01-"));
  created.push(root);
  const env = gitEnv();
  execSync(`git init -q -b ${branch} .`, { cwd: root, env });
  execSync("git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -q --allow-empty -m init", { cwd: root, env });
  return root;
}

describe("GIT-01", () => {
  it("fails force-push to main/master in live shell", () => {
    for (const cmd of ["git push --force origin main", "git push -f origin master", "sudo git push --force", "git push origin +main"]) {
      expect(check({ content: cmd, toolName: "bash" }).verdict, cmd).toBe("fail");
    }
  });

  it("fails reset --hard with checkpoint guidance", () => {
    const v = check({ content: "git reset --hard HEAD~1", toolName: "bash" });
    expect(v.verdict).toBe("fail");
    expect(v.reason).toContain("checkpoint");
  });

  it("passes the blessed flows", () => {
    expect(check({ content: "git push --force-with-lease origin main", toolName: "bash" }).verdict).toBe("pass");
    expect(check({ content: "git push --force origin feat/x", toolName: "bash" }).verdict).toBe("pass");
    expect(check({ content: "git push origin main", toolName: "bash" }).verdict).toBe("pass");
    expect(check({ content: "git reset --soft HEAD~1", toolName: "bash" }).verdict).toBe("pass");
  });

  it("resolves bare push -f against the live branch", () => {
    const onMain = makeRepo("main");
    expect(check({ content: "git push -f", toolName: "bash", projectRoot: onMain }).verdict).toBe("fail");
    const onFeat = makeRepo("feat");
    expect(check({ content: "git push -f", toolName: "bash", projectRoot: onFeat }).verdict).toBe("pass");
    // No root to resolve against → fail closed.
    expect(check({ content: "git push -f", toolName: "bash" }).verdict).toBe("fail");
  });

  it("fires in scripts, passes in docs and non-shell tools", () => {
    expect(check({ content: "git push --force origin main\n", filePath: "deploy.sh" }).verdict).toBe("fail");
    expect(check({ content: "never git push --force origin main", filePath: "guide.md" }).verdict).toBe("pass");
    expect(check({ content: "git push --force origin main", toolName: "write" }).verdict).toBe("pass");
  });

  it("is unknown on empty content", () => {
    expect(check({}).verdict).toBe("unknown");
  });
});
