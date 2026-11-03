import { expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GATE_HOOK_SCRIPT } from "./gate-hook";

it("uses the local gate and keeps tool input out of argv and output", () => {
  const root = mkdtempSync(join(tmpdir(), "vf-shell-hook-"));
  try {
    mkdirSync(join(root, ".fence/bin"), { recursive: true });
    writeFileSync(join(root, ".fence/bin/vibe-fence"), '#!/bin/sh\ncase "$*" in *PRIVATE_SENTINEL*) exit 9;; esac\ncat >/dev/null\necho "SEC-01 PRIVATE_SENTINEL"\nexit 1\n', { mode: 0o755 });
    const script = join(root, "hook.sh");
    writeFileSync(script, GATE_HOOK_SCRIPT, { mode: 0o755 });
    const r = spawnSync("/bin/sh", [script], { cwd: root, encoding: "utf8", env: { ...process.env, FENCE_BIN: join(root, "missing"), CLAUDE_PROJECT_DIR: root }, input: JSON.stringify({ tool_name: "Write", tool_input: { content: "PRIVATE_SENTINEL" } }) });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("SEC-01");
    expect(r.stdout + r.stderr).not.toContain("PRIVATE_SENTINEL");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

it("postinstall guard finds the project runtime from its installed location", async () => {
  const { readFileSync } = await import("node:fs");
  const root = mkdtempSync(join(tmpdir(), "vf-postinstall-"));
  try {
    mkdirSync(join(root, ".fence/bin"), { recursive: true });
    mkdirSync(join(root, ".fence/hooks"), { recursive: true });
    writeFileSync(join(root, ".fence/bin/vibe-fence"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
    const guard = join(root, ".fence/hooks/postinstall-guard.sh");
    writeFileSync(guard, readFileSync(join(import.meta.dir, "../templates/postinstall-guard.sh")), { mode: 0o755 });
    const r = spawnSync("/bin/sh", [guard], { cwd: root, env: { ...process.env, FENCE_BIN: "" }, encoding: "utf8" });
    expect(r.status).toBe(1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
