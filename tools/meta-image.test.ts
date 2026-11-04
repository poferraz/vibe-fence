import { afterEach, expect, it } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const created: string[] = [];
afterEach(() => { for (const path of created.splice(0)) rmSync(path, { recursive: true, force: true }); });

function fixture(): { root: string; outside: string; preload: string } {
  const root = mkdtempSync(join(tmpdir(), "vf-image-test-"));
  const outside = mkdtempSync(join(tmpdir(), "vf-image-outside-"));
  created.push(root, outside);
  mkdirSync(join(root, "tools"));
  copyFileSync(join(import.meta.dir, "meta-image.ts"), join(root, "tools/meta-image.ts"));
  const preload = join(outside, "mock-fetch.ts");
  writeFileSync(preload, 'globalThis.fetch = async () => { console.error("FETCH_CALLED"); return new Response(JSON.stringify({data:[{b64_json:"c3ludGhldGlj"}]}), {status:200}); };');
  return { root, outside, preload };
}

function run(root: string, preload: string, out: string, extra: string[] = []) {
  return spawnSync(process.execPath, ["--preload", preload, join(root, "tools/meta-image.ts"), "--prompt", "synthetic", "--out", out, ...extra], {
    cwd: root, env: { ...process.env, MUSE_API_KEY: "synthetic", META_API_KEY: "" }, encoding: "utf8",
  });
}

it("rejects symlinked output paths and receipt destinations before any provider request", () => {
  for (const kind of ["directory", "file", "numbered", "receipt"]) {
    const { root, outside, preload } = fixture();
    const sentinel = join(outside, "sentinel");
    writeFileSync(sentinel, "KEEP");
    let out = "output/picture.webp";
    if (kind === "directory") symlinkSync(outside, join(root, "output"), "dir");
    else if (kind === "receipt") symlinkSync(outside, join(root, ".fence"), "dir");
    else {
      mkdirSync(join(root, "output"));
      symlinkSync(sentinel, join(root, kind === "file" ? "output/picture.webp" : "output/picture-2.webp"));
    }
    const result = run(root, preload, out, kind === "numbered" ? ["--n", "2"] : []);
    expect(result.status).toBe(2);
    expect(result.stdout + result.stderr).not.toContain("FETCH_CALLED");
    expect(readFileSync(sentinel, "utf8")).toBe("KEEP");
    if (kind === "receipt") expect(result.stdout + result.stderr).toContain(".fence");
  }
});

it("writes a synthetic image and receipt to regular in-project paths", () => {
  const { root, preload } = fixture();
  const result = run(root, preload, "output/picture.webp");
  expect(result.status).toBe(0);
  expect(readFileSync(join(root, "output/picture.webp"), "utf8")).toBe("synthetic");
  expect(JSON.parse(readFileSync(join(root, ".fence/meta-image.json"), "utf8")).written[0].path).toBe("output/picture.webp");
});

it("does not print provider error text that may echo private input", () => {
  const { root, preload } = fixture();
  writeFileSync(preload, 'globalThis.fetch = async () => new Response(JSON.stringify({error:"PRIVATE_PROVIDER_SENTINEL"}), {status:400});');
  const result = run(root, preload, "output/picture.webp");
  expect(result.status).toBe(2);
  expect(result.stdout + result.stderr).not.toContain("PRIVATE_PROVIDER_SENTINEL");
  expect(result.stdout).toContain("HTTP 400");
});
