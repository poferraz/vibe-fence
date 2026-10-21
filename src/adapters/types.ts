export type AdapterRuntime =
  | "claude-code"
  | "codex"
  | "cursor"
  | "opencode"
  | "hermes"
  | "antigravity";

export type HookKind = "PreToolUse" | "PostToolUse" | "PreToolExecution" | "PostToolExecution";

export interface HookSurface {
  hooks: HookKind[];
  fpBudgetNotes?: string;
}

export interface AgentsMapping {
  canonical: string;
  runtimePaths: string[];
  precedence?: string;
}

export interface Adapter {
  name: AdapterRuntime;
  label: string;
  runtime: string;
  agentsMapping: AgentsMapping;
  hookSurface: HookSurface;
  skillsDir: string;
}

export const ADAPTERS: Adapter[] = [
  {
    name: "claude-code",
    label: "Claude Code",
    runtime: "claude-code",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md", ".agents/AGENTS.md", "MEMORY.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.claude/skills",
  },
  {
    name: "codex",
    label: "Codex CLI/IDE",
    runtime: "codex",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md", ".codex/AGENTS.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.agents/skills",
  },
  {
    name: "cursor",
    label: "Cursor",
    runtime: "cursor",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: [".cursor/rules", ".cursorrules"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.cursor/skills",
  },
  {
    name: "opencode",
    label: "OpenCode",
    runtime: "opencode",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md"] },
    hookSurface: { hooks: ["PreToolUse", "PreToolExecution"] },
    skillsDir: "~/.config/opencode/skills",
  },
  {
    name: "hermes",
    label: "Hermes Agent",
    runtime: "hermes",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: ["AGENTS.md", ".hermes/AGENTS.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.hermes/skills",
  },
  {
    name: "antigravity",
    label: "Antigravity",
    runtime: "antigravity",
    agentsMapping: { canonical: "AGENTS.md", runtimePaths: [".agents/rules/antigravity.md"] },
    hookSurface: { hooks: ["PreToolUse", "PostToolUse"] },
    skillsDir: "~/.gemini/antigravity/skills",
  },
];

export function getAdapter(name: AdapterRuntime): Adapter | undefined {
  return ADAPTERS.find((a) => a.name === name);
}
