#!/usr/bin/env node
// src/cli.ts — vibe-fence command entry (authority; bundled to dist/cli.js by tools/generate.ts).
// Self-contained: no bun binary, no tools/ dir at runtime. Runs on Node 20+.
// Subcommands: init | check | checkpoint | undo | gate | --help | --version.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { install, CONTRIBUTOR_DISCLOSURE, DEFAULT_ADAPTER_IDS, hereDir } from "./install.js";
import { runCheck, runIndexCheck, runPushCheck, exitCodeForReport, formatHuman } from "./check.js";
import { checkpoint, fenceUndo } from "./framework/git.js";
import { evaluateToolCall } from "./framework/gate.js";

function version(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(hereDir(), "..", "package.json"), "utf-8") as string) as {
      version?: string;
    };
    if (pkg.version) return pkg.version;
  } catch {}
  return "0.0.0-dev";
}

function help(): string {
  return [
    "vibe-fence — one command makes any AI coding agent safe.",
    "",
    "Usage:",
    "  vibe-fence init [--dry-run] [--contributor-mode] [--full] [--adapters=a,b]",
    "  vibe-fence check [--json] [--staged] [--push [<range>]]",
    "  vibe-fence checkpoint --action <label> [--include-untracked]",
    "  vibe-fence undo [--steps N]",
    "  vibe-fence gate --tool <name> --args '<json>' [--root <dir>]",
    "  vibe-fence --help | --version",
    "",
    "Commands:",
    "  init    Install the fence into the current project (AGENTS.md + .fence/ + skills + adapters)",
    "  check   Run the rule engine over the working tree (exit 1 on any fail)",
    "  checkpoint  Snapshot tracked WIP as a checkpoint commit (safe undo point)",
    "  undo    Revert the last checkpoint(s) — never detaches, never force-pushes",
    "  gate    Evaluate one tool call (Enforced tier plugins; exit 1 blocks)",
    "",
    "Options (init):",
    "  --dry-run            Print what would change; write nothing",
    "  --contributor-mode   Opt in to Contributor model mode (training disclosure applies)",
    "  --full               Force native mode even on WebContainer-like runtimes",
    `  --adapters=<list>    Subset of: ${DEFAULT_ADAPTER_IDS.join(", ")} (default: all)`,
    "  --profile=muse        Preset: Claude adapter (demo-hero path; overridden by --adapters)",
    "",
    "Options (check):",
    "  --staged             Scan staged blobs (what the next commit contains)",
    "  --push [<range>]     Scan outgoing commits (<old>..<new>; default: pre-push stdin, else @{u}..HEAD)",
    "  --json               Emit the report as JSON",
    "",
    "More: https://github.com/poferraz/vibe-fence",
  ].join("\n");
}

/**
 * Pre-push ranges without hook-script logic: the managed pre-push hook pipes
 * git's `<local ref> <local sha> <remote ref> <remote sha>` lines on stdin,
 * which we parse here. Malformed lines are ignored; empty stdin (manual run,
 * TTY) falls back to outgoing-vs-upstream. Ref deletions carry no blobs.
 */
/** Explicit `--push` ranges: `<old>..<new>` or a bare `<rev>` (dots are legal inside rev names, so split first). */
function isValidPushRange(r: string): boolean {
  const parts = r.split("..");
  if (parts.length < 1 || parts.length > 2) return false;
  return parts.every((p) => p.length > 0 && /^[A-Za-z0-9_.@{}\/^~:-]+$/.test(p));
}

function pushRangesFromStdinOrDefault(): string[] {
  let stdin = "";
  if (!process.stdin.isTTY) {
    try {
      stdin = readFileSync(0, "utf-8");
    } catch {
      stdin = "";
    }
  }
  const ranges: string[] = [];
  for (const line of stdin.split("\n")) {
    const parts = line.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    if (parts.length !== 4) continue;
    const localSha = parts[1] ?? "";
    const remoteSha = parts[3] ?? "";
    if (!localSha || !remoteSha) continue;
    if (/^0+$/.test(localSha)) continue;
    ranges.push(`${remoteSha}..${localSha}`);
  }
  return ranges.length > 0 ? ranges : ["@{u}..HEAD"];
}

export async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(help());
    return 0;
  }
  if (cmd === "--version" || cmd === "-V" || cmd === "-v") {
    console.log(`vibe-fence ${version()}`);
    return 0;
  }
  if (cmd === "init") {
    const contributorMode = rest.includes("--contributor-mode");
    if (contributorMode) console.log(CONTRIBUTOR_DISCLOSURE);
    const adaptersArg = rest.find((a) => a.startsWith("--adapters="));
    const profileArg = rest.find((a) => a.startsWith("--profile="));
    const profileFlag = rest.indexOf("--profile");
    const profile = profileArg
      ? profileArg.slice("--profile=".length)
      : profileFlag !== -1 && rest[profileFlag + 1] && !rest[profileFlag + 1]!.startsWith("--")
        ? rest[profileFlag + 1]!
        : null;
    if (profile !== null && profile !== "muse") {
      console.error(`vibe-fence: unknown --profile '${profile}' (known: muse).`);
      return 2;
    }
    // Explicit --adapters wins; --profile muse is a preset for the demo-hero path.
    const adapters = adaptersArg
      ? adaptersArg.slice("--adapters=".length).split(",").map((s) => s.trim()).filter(Boolean)
      : profile === "muse"
        ? ["claude"]
        : undefined;
    await install(process.cwd(), {
      dryRun: rest.includes("--dry-run"),
      contributorMode,
      full: rest.includes("--full"),
      adapters,
    });
    return 0;
  }
  if (cmd === "check") {
    const json = rest.includes("--json");
    const staged = rest.includes("--staged");
    const pushIdx = rest.findIndex((a) => a === "--push" || a.startsWith("--push="));
    if (staged && pushIdx !== -1) {
      console.error("vibe-fence: check takes at most one of --staged / --push.");
      return 2;
    }
    let report;
    if (staged) {
      report = runIndexCheck(process.cwd());
    } else if (pushIdx !== -1) {
      const arg = rest[pushIdx]!;
      let range: string | null = null;
      if (arg.startsWith("--push=")) {
        range = arg.slice("--push=".length);
      } else if (rest[pushIdx + 1] && !rest[pushIdx + 1]!.startsWith("--")) {
        range = rest[pushIdx + 1]!;
      }
      if (range !== null && !isValidPushRange(range)) {
        console.error(`vibe-fence: bad --push range '${range}' (want <old>..<new> or <rev>).`);
        return 2;
      }
      report = runPushCheck(process.cwd(), range ? [range] : pushRangesFromStdinOrDefault());
    } else {
      report = runCheck(process.cwd());
    }
    if (json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatHuman(report));
    }
    return exitCodeForReport(report);
  }
  if (cmd === "checkpoint") {
    const actionArg = rest.find((a) => a.startsWith("--action="));
    const actionFlag = rest.indexOf("--action");
    const action = actionArg
      ? actionArg.slice("--action=".length)
      : actionFlag !== -1 && rest[actionFlag + 1]
        ? rest[actionFlag + 1]!
        : null;
    if (!action) {
      console.error("vibe-fence: checkpoint needs --action <label> (e.g. --action \"before plan\").");
      return 2;
    }
    const r = checkpoint({ action, projectRoot: process.cwd(), includeUntracked: rest.includes("--include-untracked") });
    console.log(r.committed ? `checkpoint ${r.commitHash?.slice(0, 7)} — ${r.message}` : r.message);
    const benignNoop = r.message.startsWith("no changes") || r.message.startsWith("nothing to snapshot");
    return r.committed || benignNoop ? 0 : 2;
  }
  if (cmd === "undo") {
    const stepsArg = rest.find((a) => a.startsWith("--steps="));
    const stepsFlag = rest.indexOf("--steps");
    const raw = stepsArg ? stepsArg.slice("--steps=".length) : stepsFlag !== -1 ? rest[stepsFlag + 1] : undefined;
    const steps = raw === undefined ? 1 : Number(raw);
    try {
      const r = fenceUndo({ projectRoot: process.cwd(), steps });
      console.log(r.message);
      return 0;
    } catch (e) {
      console.error(`vibe-fence: undo failed: ${(e as Error).message}`);
      return 1;
    }
  }
  if (cmd === "gate") {
    const flag = (name: string): string | null => {
      const eq = rest.find((a) => a.startsWith(`${name}=`));
      if (eq) return eq.slice(name.length + 1);
      const i = rest.indexOf(name);
      return i !== -1 && rest[i + 1] ? rest[i + 1]! : null;
    };
    const tool = flag("--tool");
    const rawArgs = flag("--args");
    if (!tool || rawArgs === null) {
      console.error("vibe-fence: gate needs --tool <name> --args '<json>'.");
      return 2;
    }
    const projectRoot = flag("--root") ?? process.cwd();
    let args: unknown;
    try {
      args = JSON.parse(rawArgs);
    } catch {
      console.error("vibe-fence: gate --args is not valid JSON.");
      return 2;
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      console.error("vibe-fence: gate --args must be a JSON object.");
      return 2;
    }
    const findings = evaluateToolCall({ tool, args: args as Record<string, unknown>, projectRoot });
    if (findings.length === 0) return 0;
    for (const f of findings) console.log(`${f.ruleId} [${f.severity}] ${f.reason}`);
    return 1;
  }
  if (cmd === "tour") {
    console.error("vibe-fence: 'tour' is not implemented — nothing advertises it; try `vibe-fence init` (or `--help`).");
    return 2;
  }
  if (cmd === undefined) {
    console.error("vibe-fence: missing subcommand — try `vibe-fence init` (or `--help`).");
    return 2;
  }
  console.error(`vibe-fence: unknown subcommand '${cmd}' — try \`vibe-fence init\` (or \`--help\`).`);
  return 2;
}

// Bin entry — always dispatches (this module ships only as the bundled dist/cli.js).
await main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(`vibe-fence: fatal: ${(err as Error).message}`);
    process.exit(1);
  },
);
