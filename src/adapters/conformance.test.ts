/**
 * src/adapters/conformance.test.ts — host-config schema conformance (R1).
 * Host files keep only vendor-supported keys; fence metadata lives in
 * `.fence/adapters/<id>.json`. Allow-lists cite vendor sources verified live
 * on Oct 26 (see comments). Legacy fence-managed `fence` keys are scrubbed;
 * user-owned keys are never touched.
 * Run: bun test src/adapters/conformance.test.ts
 */
import { describe, it, expect, afterEach } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installOpenCodeAdapter } from "./opencode";
import { installClaudeAdapter } from "./claude";
import { installCursorAdapter } from "./cursor";
import { installCodexAdapter } from "./codex";
import { installHermesAdapter } from "./hermes";
import { installAntigravityAdapter } from "./antigravity";
import { GATE_HOOK_SCRIPT } from "./gate-hook";

/** Top-level opencode.json keys — https://opencode.ai/config.json (additionalProperties: false; no `fence`). */
const OPENCODE_ALLOW_LIST = new Set([
  "$schema", "agent", "agents", "attachment", "autoshare", "autoupdate", "command", "commands",
  "compaction", "default_agent", "disabled_providers", "enabled_providers", "enterprise", "experimental",
  "formatter", "instructions", "layout", "logLevel", "lsp", "mcp", "media", "mode", "model", "permission",
  "permissions", "plugin", "plugins", "policies", "provider", "providers", "reference", "references",
  "server", "share", "shell", "skills", "small_model", "snapshot", "snapshots", "subagent_depth",
  "tool_output", "tools", "update", "username", "warming", "watcher", "websearch", "worktree",
]);

/** Top-level .cursor/hooks.json keys — Cursor forum threads + https://ntorres.dev/blog/cursor-hooks-json-guide. */
const CURSOR_ALLOW_LIST = new Set(["version", "hooks"]);

const created: string[] = [];
afterEach(() => {
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
});

function makeProject(): string {
  const root = mkdtempSync(join(tmpdir(), "vf-conform-"));
  created.push(root);
  return root;
}

function writeJson(root: string, rel: string, obj: unknown): void {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

function readJson(root: string, rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, rel), "utf-8") as string) as Record<string, unknown>;
}

/** A legacy fence-managed block as written by pre-fix installers. */
function legacyFenceBlock(adapter: string): Record<string, unknown> {
  return {
    version: 1,
    model_mode: "standard",
    companion_model: "muse-spark-1.3",
    architect_model: "muse-wonder-1.0",
    installedAt: "2026-10-26T00:00:00.000Z",
    receipt: `🛡️ vibe-fence active — ${adapter} adapter`,
  };
}

function isExecutable(p: string): boolean {
  return (statSync(p).mode & 0o100) !== 0;
}

describe("opencode conformance (L2)", () => {
  it("never creates opencode.json; receipt carries the metadata", () => {
    const root = makeProject();
    installOpenCodeAdapter(root);
    expect(existsSync(join(root, "opencode.json"))).toBe(false);
    const receipt = readJson(root, ".fence/adapters/opencode.json");
    expect(receipt).toMatchObject({ version: 1, adapter: "opencode", model_mode: "standard" });
    // The integration itself is intact: AGENTS.md + the gate plugin.
    expect(existsSync(join(root, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(root, ".opencode", "plugins", "fence-guard.js"))).toBe(true);
  });

  it("scrubs legacy fence keys; result contains only allow-listed keys", () => {
    const root = makeProject();
    writeJson(root, "opencode.json", {
      model: "gpt-5",
      permissions: { edit: "ask" },
      small_model: "gpt-5-mini",
      fence: legacyFenceBlock("OpenCode"),
    });
    installOpenCodeAdapter(root);
    const next = readJson(root, "opencode.json");
    expect("fence" in next).toBe(false);
    expect(next["model"]).toBe("gpt-5");
    expect(next).toMatchObject({ permissions: { edit: "ask" }, small_model: "gpt-5-mini" });
    for (const key of Object.keys(next)) {
      expect(OPENCODE_ALLOW_LIST.has(key)).toBe(true);
    }
  });

  it("preserves user-owned `fence` keys (no receipt marker)", () => {
    const root = makeProject();
    writeJson(root, "opencode.json", { model: "gpt-5", fence: { note: "mine, not the harness's" } });
    installOpenCodeAdapter(root);
    expect(readJson(root, "opencode.json")).toMatchObject({ fence: { note: "mine, not the harness's" } });
  });
});

describe("claude conformance (L14)", () => {
  it("writes a real PreToolUse entry, no fence key, no invented keys", () => {
    const root = makeProject();
    installClaudeAdapter(root);
    const settings = readJson(root, ".claude/settings.json");
    expect("fence" in settings).toBe(false);
    expect("PostToolUse" in ((settings["hooks"] as Record<string, unknown>) ?? {})).toBe(false);
    expect(settings["hooks"]).toEqual({
      PreToolUse: [
        {
          matcher: "Read|Write|Edit|MultiEdit|Bash",
          hooks: [{ type: "command", command: "${CLAUDE_PROJECT_DIR}/.claude/hooks/fence-gate.sh" }],
        },
      ],
    });
    const script = join(root, ".claude", "hooks", "fence-gate.sh");
    expect(readFileSync(script, "utf-8")).toBe(GATE_HOOK_SCRIPT);
    expect(isExecutable(script)).toBe(true);
    expect(readJson(root, ".fence/adapters/claude.json")).toMatchObject({ adapter: "claude", model_mode: "standard" });
  });

  it("merges without clobbering: user keys/hooks preserved, ours deduped, legacy scrubbed", () => {
    const root = makeProject();
    writeJson(root, ".claude/settings.json", {
      model: "sonnet",
      permissions: { allow: ["Read"] },
      fence: legacyFenceBlock("Claude Code"),
      hooks: {
        PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "/mine.sh" }] }],
        PostToolUse: [{ matcher: "Edit", hooks: [] }],
      },
    });
    installClaudeAdapter(root);
    installClaudeAdapter(root); // re-run: no duplicate entry (zero-churn)
    const settings = readJson(root, ".claude/settings.json");
    expect("fence" in settings).toBe(false);
    expect(settings["model"]).toBe("sonnet");
    expect(settings["permissions"]).toEqual({ allow: ["Read"] });
    const hooks = settings["hooks"] as Record<string, unknown>;
    expect(hooks["PostToolUse"]).toEqual([{ matcher: "Edit", hooks: [] }]);
    const pre = hooks["PreToolUse"] as unknown[];
    expect(pre).toHaveLength(2); // user's entry + exactly one of ours
    expect(pre[0]).toMatchObject({ matcher: "Bash" });
  });

  it("leaves corrupt settings.json alone instead of crashing install", () => {
    const root = makeProject();
    mkdirSync(join(root, ".claude"), { recursive: true });
    writeFileSync(join(root, ".claude", "settings.json"), "{oops", "utf-8");
    installClaudeAdapter(root);
    expect(readFileSync(join(root, ".claude", "settings.json"), "utf-8")).toBe("{oops");
    expect(existsSync(join(root, ".fence", "adapters", "claude.json"))).toBe(true);
  });
});

describe("cursor conformance (L14)", () => {
  it("writes schema-valid hooks.json with a real preToolUse entry", () => {
    const root = makeProject();
    installCursorAdapter(root);
    const hooksJson = readJson(root, ".cursor/hooks.json");
    for (const key of Object.keys(hooksJson)) {
      expect(CURSOR_ALLOW_LIST.has(key)).toBe(true);
    }
    expect(hooksJson).toEqual({
      version: 1,
      hooks: { preToolUse: [{ command: ".cursor/hooks/fence-gate.sh", failClosed: false }] },
    });
    const script = join(root, ".cursor", "hooks", "fence-gate.sh");
    expect(readFileSync(script, "utf-8")).toBe(GATE_HOOK_SCRIPT);
    expect(isExecutable(script)).toBe(true);
    expect(readJson(root, ".fence/adapters/cursor.json")).toMatchObject({ adapter: "cursor" });
  });

  it("replaces the legacy empty-hooks shape and scrubs the fence key", () => {
    const root = makeProject();
    writeJson(root, ".cursor/hooks.json", { fence: legacyFenceBlock("Cursor"), hooks: [] });
    installCursorAdapter(root);
    installCursorAdapter(root);
    const hooksJson = readJson(root, ".cursor/hooks.json");
    expect("fence" in hooksJson).toBe(false);
    const hooks = hooksJson["hooks"] as Record<string, unknown>;
    expect(hooks["preToolUse"]).toHaveLength(1);
  });

  it("preserves user hooks and never duplicates ours", () => {
    const root = makeProject();
    writeJson(root, ".cursor/hooks.json", {
      version: 1,
      hooks: {
        preToolUse: [{ command: ".cursor/hooks/mine.sh" }],
        afterFileEdit: [{ command: ".cursor/hooks/format.sh" }],
      },
    });
    installCursorAdapter(root);
    installCursorAdapter(root);
    const hooks = (readJson(root, ".cursor/hooks.json")["hooks"] as Record<string, unknown>);
    expect(hooks["afterFileEdit"]).toEqual([{ command: ".cursor/hooks/format.sh" }]);
    expect(hooks["preToolUse"]).toHaveLength(2);
  });
});

describe("codex/hermes/antigravity conformance", () => {
  it("codex: never creates host config; scrubs legacy keys; receipt carries metadata", () => {
    const root = makeProject();
    installCodexAdapter(root);
    expect(existsSync(join(root, ".codex", "config.json"))).toBe(false);
    expect(readJson(root, ".fence/adapters/codex.json")).toMatchObject({ adapter: "codex" });

    const legacy = makeProject();
    writeJson(legacy, ".codex/config.json", { theme: "dark", fence: legacyFenceBlock("Codex") });
    installCodexAdapter(legacy);
    expect(readJson(legacy, ".codex/config.json")).toEqual({ theme: "dark" });
  });

  it("hermes: never creates host config; scrubs legacy keys; receipt carries metadata", () => {
    const root = makeProject();
    installHermesAdapter(root);
    expect(existsSync(join(root, ".hermes", "config.json"))).toBe(false);
    expect(readJson(root, ".fence/adapters/hermes.json")).toMatchObject({ adapter: "hermes" });

    const legacy = makeProject();
    writeJson(legacy, ".hermes/config.json", { retries: 3, fence: legacyFenceBlock("Hermes") });
    installHermesAdapter(legacy);
    expect(readJson(legacy, ".hermes/config.json")).toEqual({ retries: 3 });
  });

  it("antigravity: writes no host JSON config at all", () => {
    const root = makeProject();
    installAntigravityAdapter(root);
    expect(existsSync(join(root, ".agents", "rules", "antigravity.md"))).toBe(true);
    expect(existsSync(join(root, ".fence"))).toBe(false);
    const found: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) walk(p);
        else if (entry.endsWith(".json")) found.push(p);
      }
    };
    walk(root);
    expect(found).toEqual([]);
  });
});
