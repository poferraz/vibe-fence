/**
 * src/framework/git.test.ts — checkpoint + fence undo (Oct 29).
 * checkpoint snapshots tracked WIP as `checkpoint: [action]`; undo restores
 * HEAD without detaching, without force-push, without touching untracked files.
 * Run: bun test src/framework/git.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { checkpoint, fenceUndo, isDestructiveGitCommand, isWithinProjectRoot, CHECKPOINT_PREFIX } from "./git";

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function gitEnv(extra: Record<string, string> = {}): Record<string, string> {
  return { ...(process.env as Record<string, string>), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", ...extra };
}

function sh(cwd: string, cmd: string): string {
  return execSync(cmd, { cwd, env: gitEnv(), encoding: "utf-8" }).trim();
}

function makeRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "vf-git-"));
  created.push(root);
  sh(root, "git init -q .");
  sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -q --allow-empty -m init");
  return root;
}

function headSubject(root: string): string {
  return sh(root, "git log -1 --format=%s");
}

describe("checkpoint", () => {
  it("blocks a detected secret before git add writes its blob, unless explicitly allowed", () => {
    const root = makeRepo();
    const token = "sk_" + "live_" + "aB3cD4eF5gH6iJ7kL8mN9pQ2";
    writeFileSync(join(root, "secret.ts"), `const credential = "${token}";\n`);
    const blob = sh(root, "git hash-object secret.ts");
    const before = sh(root, "git rev-parse HEAD");
    expect(sh(root, `git cat-file -e ${blob} 2>/dev/null || echo absent`)).toBe("absent");
    const blocked = checkpoint({ action: "unsafe", projectRoot: root, includeUntracked: true });
    expect(blocked.committed).toBe(false);
    expect(blocked.message).toContain("secret");
    expect(sh(root, "git rev-parse HEAD")).toBe(before);
    expect(sh(root, `git cat-file -e ${blob} 2>/dev/null || echo absent`)).toBe("absent");
    expect(sh(root, "git diff --cached --name-only")).toBe("");
    expect(checkpoint({ action: "override", projectRoot: root, includeUntracked: true, allowSecretsInCheckpoint: true }).committed).toBe(true);
  });

  it("blocks a newly included environment file before staging it", () => {
    const root = makeRepo();
    sh(root, "git config --local core.excludesfile /dev/null");
    writeFileSync(join(root, ".env"), "PRIVATE_VALUE=local\n");
    const result = checkpoint({ action: "unsafe env", projectRoot: root, includeUntracked: true });
    expect(result.committed).toBe(false);
    expect(result.message).toContain(".env");
    expect(sh(root, "git diff --cached --name-only")).toBe("");
  });

  it("does not commit when a Git clean filter introduces a secret during staging", () => {
    const root = makeRepo();
    writeFileSync(join(root, "data.txt"), "safe before\n");
    sh(root, "git add data.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    writeFileSync(join(root, ".gitattributes"), "data.txt filter=inject\n");
    sh(root, "git add .gitattributes");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm attributes");
    const token = "sk_" + "live_" + "aB3cD4eF5gH6iJ7kL8mN9pQ2";
    const filter = join(root, "filter.cjs");
    writeFileSync(filter, `process.stdout.write(${JSON.stringify(token)});\n`);
    execFileSync("git", ["config", "--local", "filter.inject.clean", `node ${filter}`], { cwd: root, env: gitEnv() });
    writeFileSync(join(root, ".fenceignore"), "data.txt\n");
    writeFileSync(join(root, "data.txt"), "safe new work\n");
    const before = sh(root, "git rev-parse HEAD");
    const result = checkpoint({ action: "filtered", projectRoot: root });
    expect(result.committed).toBe(false);
    expect(result.message).toContain("staged");
    expect(sh(root, "git rev-parse HEAD")).toBe(before);
  });

  it("does not write a detected secret from the checkpoint label into a commit", () => {
    const root = makeRepo();
    writeFileSync(join(root, "work.txt"), "work\n");
    const token = "sk_" + "live_" + "aB3cD4eF5gH6iJ7kL8mN9pQ2";
    const before = sh(root, "git rev-parse HEAD");
    const result = checkpoint({ action: token, projectRoot: root, includeUntracked: true });
    expect(result.committed).toBe(false);
    expect(sh(root, "git rev-parse HEAD")).toBe(before);
    expect(sh(root, "git diff --cached --name-only")).toBe("");
  });

  it("commits tracked WIP with the checkpoint prefix", () => {
    const root = makeRepo();
    writeFileSync(join(root, "a.txt"), "v2\n", "utf-8");
    sh(root, "git add a.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    writeFileSync(join(root, "a.txt"), "v3\n", "utf-8");
    const r = checkpoint({ action: "before plan", projectRoot: root });
    expect(r.committed).toBe(true);
    expect(r.commitHash).toMatch(/^[0-9a-f]{40}$/);
    expect(headSubject(root)).toBe(`${CHECKPOINT_PREFIX} [before plan]`);
  });

  it("is a no-op (not an error) on a clean tree or outside a repo", () => {
    const root = makeRepo();
    expect(checkpoint({ action: "x", projectRoot: root }).committed).toBe(false);
    const plain = mkdtempSync(join(tmpdir(), "vf-plain-"));
    created.push(plain);
    const r = checkpoint({ action: "x", projectRoot: plain });
    expect(r.committed).toBe(false);
    expect(r.message).toContain("not a git repo");
  });

  it("leaves untracked files alone unless includeUntracked", () => {
    const root = makeRepo();
    writeFileSync(join(root, "notes.txt"), "wip\n", "utf-8");
    writeFileSync(join(root, "tracked.txt"), "v1\n", "utf-8");
    sh(root, "git add tracked.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    writeFileSync(join(root, "tracked.txt"), "v2\n", "utf-8");
    checkpoint({ action: "tracked only", projectRoot: root });
    expect(sh(root, "git status --porcelain")).toContain("?? notes.txt");
    const r2 = checkpoint({ action: "with untracked", projectRoot: root, includeUntracked: true });
    expect(r2.committed).toBe(true);
    expect(sh(root, "git status --porcelain")).not.toContain("?? notes.txt");
  });

  it("commits a contaminated checkpoint but warns loudly and records findings (D7)", () => {
    const root = makeRepo();
    mkdirSync(join(root, ".fence"), { recursive: true });
    writeFileSync(join(root, "a.txt"), "v1\n", "utf-8");
    sh(root, "git add a.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    writeFileSync(join(root, "a.txt"), "key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;\n", "utf-8");
    const warns: string[] = [];
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warns.push(args.join(" "));
    };
    try {
      const r = checkpoint({ action: "dirty wip", projectRoot: root, allowSecretsInCheckpoint: true });
      expect(r.committed).toBe(true); // explicit override retains the warning
    } finally {
      console.warn = origWarn;
    }
    expect(warns.some((w) => w.includes("blocking finding") && w.includes("NOT as clean"))).toBe(true);
    const events = readFileSync(join(root, ".fence", "events.ndjson"), "utf-8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l) as { type?: string; blockingFindings?: number });
    const cp = events.find((e) => e.type === "checkpoint");
    expect(cp?.blockingFindings).toBeGreaterThanOrEqual(1);
  });

  it("neutralizes shell metacharacters in the action label", () => {
    const root = makeRepo();
    writeFileSync(join(root, "a.txt"), "x\n", "utf-8");
    sh(root, "git add a.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    writeFileSync(join(root, "a.txt"), "y\n", "utf-8");
    const evil = join(root, "pwned");
    checkpoint({ action: `x" ; touch ${evil} #`, projectRoot: root });
    expect(existsSync(evil)).toBe(false);
    expect(headSubject(root)).toContain("checkpoint:");
  });
});

describe("fenceUndo", () => {
  it("resets an unpushed checkpoint without detaching HEAD", () => {
    const root = makeRepo();
    writeFileSync(join(root, "a.txt"), "v1\n", "utf-8");
    sh(root, "git add a.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    writeFileSync(join(root, "a.txt"), "v2\n", "utf-8");
    checkpoint({ action: "burst", projectRoot: root });
    const r = fenceUndo({ projectRoot: root });
    expect(headSubject(root)).toBe("base");
    expect(sh(root, "git symbolic-ref HEAD")).toBe("refs/heads/master");
    // reset --soft: work is preserved as staged changes, nothing lost
    expect(readFileSync(join(root, "a.txt"), "utf-8")).toBe("v2\n");
    expect(r.message).toContain("reset");
  });

  it("undoes multiple steps", () => {
    const root = makeRepo();
    writeFileSync(join(root, "a.txt"), "v0\n", "utf-8");
    sh(root, "git add a.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    for (const v of ["v1", "v2"]) {
      writeFileSync(join(root, "a.txt"), v + "\n", "utf-8");
      checkpoint({ action: `step ${v}`, projectRoot: root });
    }
    fenceUndo({ projectRoot: root, steps: 2 });
    expect(sh(root, "git log --oneline")).toContain("init");
    expect(headSubject(root)).not.toContain(CHECKPOINT_PREFIX);
  });

  it("reverts (never resets) a pushed checkpoint", () => {
    const root = makeRepo();
    const bare = mkdtempSync(join(tmpdir(), "vf-bare-"));
    created.push(bare);
    sh(bare, "git init -q --bare .");
    sh(root, `git remote add origin ${bare}`);
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false push -q -u origin master");
    writeFileSync(join(root, "a.txt"), "v1\n", "utf-8");
    checkpoint({ action: "pushed work", projectRoot: root, includeUntracked: true });
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false push -q origin master");
    const before = sh(root, "git rev-parse HEAD");
    fenceUndo({ projectRoot: root });
    // History grew (revert commit on top); the checkpoint commit still exists.
    expect(sh(root, `git merge-base --is-ancestor ${before} HEAD && echo yes`)).toBe("yes");
    expect(headSubject(root)).toContain("undo");
  });

  it("fails closed with no checkpoints, and never touches untracked files", () => {
    const root = makeRepo();
    expect(() => fenceUndo({ projectRoot: root })).toThrow(/no checkpoint/);
    writeFileSync(join(root, "keep.txt"), "precious\n", "utf-8");
    writeFileSync(join(root, "a.txt"), "v1\n", "utf-8");
    sh(root, "git add a.txt");
    sh(root, "git -c user.email=t@t -c user.name=t -c commit.gpgsign=false commit -qm base");
    writeFileSync(join(root, "a.txt"), "v2\n", "utf-8");
    checkpoint({ action: "one", projectRoot: root });
    fenceUndo({ projectRoot: root });
    expect(readFileSync(join(root, "keep.txt"), "utf-8")).toBe("precious\n");
    expect(sh(root, "git status --porcelain")).toContain("?? keep.txt");
  });
});

describe("isWithinProjectRoot", () => {
  it("accepts in-root paths and rejects symlink escapes", () => {
    const root = makeRepo();
    expect(isWithinProjectRoot(root, "src/ok.ts")).toBe(true);
    expect(isWithinProjectRoot(root, join(root, "src", "ok.ts"))).toBe(true);
    const outside = mkdtempSync(join(tmpdir(), "vf-git-out-"));
    created.push(outside);
    symlinkSync(outside, join(root, "escape"), "dir");
    expect(isWithinProjectRoot(root, "escape/evil.txt")).toBe(false);
    expect(isWithinProjectRoot(root, "../outside.txt")).toBe(false);
  });
});

describe("isDestructiveGitCommand", () => {
  it("flags hard resets, force pushes, and clobbering cleans", () => {
    expect(isDestructiveGitCommand("git reset --hard HEAD~1")).toBe(true);
    expect(isDestructiveGitCommand("git push --force origin main")).toBe(true);
    expect(isDestructiveGitCommand("git push -f origin main")).toBe(true);
    expect(isDestructiveGitCommand("git clean -fd")).toBe(true);
    expect(isDestructiveGitCommand("git status")).toBe(false);
    expect(isDestructiveGitCommand("git reset --soft HEAD~1")).toBe(false);
  });
});

it("distinguishes a failed checkpoint inspection from a clear scan", async () => {
  const { inspectCheckpointScan } = await import("./git");
  const clear = { filesScanned: 1, filesSkipped: 0, fails: 0, blocks: 0, unknowns: 0, findings: [] };
  expect(inspectCheckpointScan(".", () => clear)).toEqual({ status: "clear", blockingFindings: 0 });
  expect(inspectCheckpointScan(".", () => ({ ...clear, blocks: 1, findings: [{ file: "a", ruleId: "SEC-01", severity: "block", verdict: "fail" as const, reason: "x" }] }))).toEqual({ status: "blocked", blockingFindings: 1 });
  expect(inspectCheckpointScan(".", () => ({ ...clear, blocks: 1, findings: [{ file: "x", ruleId: "INDEX-SCAN", severity: "block", verdict: "fail" as const, reason: "x" }] }))).toEqual({ status: "incomplete", blockingFindings: null });
  expect(inspectCheckpointScan(".", () => { throw new Error("private sentinel"); })).toEqual({ status: "incomplete", blockingFindings: null });
});

it("does not append checkpoint events through an outside symlink", () => {
  const root = makeRepo(), outside = mkdtempSync(join(tmpdir(), "vf-checkpoint-outside-"));
  created.push(outside);
  mkdirSync(join(root, ".fence"));
  const sentinel = join(outside, "sentinel");
  writeFileSync(sentinel, "KEEP");
  symlinkSync(sentinel, join(root, ".fence/events.ndjson"));
  writeFileSync(join(root, "tracked.txt"), "synthetic\n");
  expect(checkpoint({ action: "test", projectRoot: root, includeUntracked: true }).committed).toBe(true);
  expect(readFileSync(sentinel, "utf8")).toBe("KEEP");
});
