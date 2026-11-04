#!/usr/bin/env node
// src/cli.ts — vibe-fence command entry (authority; bundled to dist/cli.js by tools/generate.ts).
// Self-contained: no bun binary, no tools/ dir at runtime. Runs on Node 20+.
// Subcommands: init | check | checkpoint | undo | gate | --help | --version.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { install, CONTRIBUTOR_DISCLOSURE, DEFAULT_ADAPTER_IDS, hereDir } from "./install.js";
import { publicImpact, publicRemediation, publicSummary } from "./framework/public-findings.js";
import { runCheck, runIndexCheck, runPushCheck, exitCodeForReport, formatHuman, publicReport } from "./check.js";
import { explainBlocking, type ExplainContext, type ExplainFinding } from "./framework/explain.js";
import { checkpoint, fenceUndo } from "./framework/git.js";
import { evaluateToolCall } from "./framework/gate.js";
import { getProtectionStatus, verifyAdapterHook } from "./framework/status.js";
import { verifyAttestation } from "./framework/integrity.js";
import { packageVersion } from "./version.js";
import { runUninstall } from "./uninstall.js";
import { adapterPathsSafe } from "./adapters/safe-paths.js";
import { resetCircuit } from "./framework/circuit-breaker.js";
import { buildTeachingCard, loadDialState, setGlobalLevel, type DialLevel } from "./framework/dial.js";
import { runTrustLadder } from "./framework/verifier.js";
import { verifyRemote } from "./framework/verify-remote.js";
import { resetNetworkBudget } from "./framework/billing-guard.js";
import { appendEvent, formatStatusHeader } from "./framework/fence-look.js";

function help(): string {
  return [
    "vibe-fence — checks and guardrails for coding-agent workflows.",
    "",
    "Usage:",
    "  vibe-fence init [--dry-run] [--contributor-mode] [--full] [--adapters=a,b]",
    "  vibe-fence check [--json] [--staged] [--push [<range>|--all]] [--max-bytes N] [--max-files N] [--explain]",
    "  vibe-fence checkpoint --action <label> [--include-untracked] [--allow-secrets-in-checkpoint]",
    "  vibe-fence undo [--steps N]",
    "  vibe-fence gate --tool <name> (--args '<json>' | --args-stdin) [--root <dir>] [--explain]",
    "  vibe-fence status [--host=codex|claude|cursor|opencode|antigravity|hermes] [--json]",
    "  vibe-fence doctor [--host=<name>] [--json]",
    "  vibe-fence uninstall [--dry-run]",
    "  vibe-fence reset",
    "  vibe-fence dial [max|medium|min|silent|status]",
    "  vibe-fence verify [--remote] [--json]",
    "  vibe-fence --help | --version",
    "",
    "Commands:",
    "  init    Install the fence into the current project (AGENTS.md + .fence/ + skills + adapters)",
    "  check   Run bounded checks (exit 1 for a policy block, 2 for an incomplete scan)",
    "  checkpoint  Save tracked WIP after a bounded secret pre-check",
    "  undo    Soft-reset unpushed tip checkpoints (edits stay staged), or revert other checkpoints",
    "  gate    Evaluate one tool call (Enforced tier plugins; exit 1 blocks)",
    "  status  Describe configured protection and its verification limits",
    "  doctor  Test installed hooks locally and report their verification limits",
    "  uninstall  Remove unchanged managed files and restore prior hooks",
    "  reset   Close the circuit breaker after reviewing the repeated failure",
    "",
    "Options (init):",
    "  --dry-run            Print what would change; write nothing",
    "  --contributor-mode   Record a contributor preference locally; check provider settings separately",
    "  --full               Force native mode even on WebContainer-like runtimes",
    `  --adapters=<list>    Subset of: ${DEFAULT_ADAPTER_IDS.join(", ")} (default: detected hosts)`,
    "  --host=<list>        Alias for --adapters",
    "  --no-package-scripts Do not add convenience npm scripts",
    "  --profile=muse        Preset: Claude adapter (demo-hero path; overridden by --adapters)",
    "",
    "Options (check):",
    "  --staged             Scan staged blobs (what the next commit contains)",
    "  --push [<range>]     Scan outgoing commits (<old>..<new>; default: pre-push stdin, else @{u}..HEAD)",
    "  --all                With --push, scan all local refs and the current HEAD",
    "  --json               Emit the report as JSON",
    "  --max-bytes N        Maximum bytes per scanned file",
    "  --max-files N        Maximum number of eligible files to scan",
    "  --explain            Ask Meta Muse Spark to explain blocking findings (needs MUSE_API_KEY; check + gate)",
    "",
    "More: https://github.com/poferraz/vibe-fence",
  ].join("\n");
}

/**
 * Pre-push ranges without hook-script logic: the managed pre-push hook pipes
 * git's `<local ref> <local sha> <remote ref> <remote sha>` lines on stdin,
 * which we parse here. Malformed lines fail closed; empty stdin (manual run,
 * TTY) falls back to outgoing-vs-upstream. Ref deletions carry no blobs.
 */
/** Explicit `--push` ranges: `<old>..<new>` or a bare `<rev>` (dots are legal inside rev names, so split first). */
function isValidPushRange(r: string): boolean {
  const parts = r.split("..");
  if (parts.length < 1 || parts.length > 2) return false;
  return parts.every((p) => p.length > 0 && /^[A-Za-z0-9_.@{}\/^~:-]+$/.test(p));
}

/**
 * --explain: one Spark call per blocking report (Phase 3a). Advisory only —
 * the caller's exit code never changes. With --json the text goes to stderr
 * so stdout stays parseable.
 */
async function printExplanation(failures: ExplainFinding[], ctx: ExplainContext, json: boolean): Promise<void> {
  const outcome = await explainBlocking(failures, ctx, { projectRoot: process.cwd() });
  if (outcome.status === "skipped") {
    if (outcome.code === "no-key") {
      console.error("vibe-fence: --explain needs MUSE_API_KEY — skipping AI explanation (findings above are complete).");
    } else if (outcome.code === "error") {
      console.error(`vibe-fence: --explain unavailable (${outcome.reason}) — findings above are complete.`);
    }
    return;
  }
  const text = `\n${outcome.model} explanation (request ${outcome.requestId ?? "n/a"}):\n${outcome.text}`;
  if (json) console.error(text);
  else console.log(text);
}

function pushRangesFromStdinOrDefault(hookInput: boolean): string[] {
  let stdin = "";
  if (!process.stdin.isTTY) {
    try {
      stdin = readFileSync(0, "utf-8");
    } catch {
      throw new Error("cannot read pre-push input; outgoing history was not inspected");
    }
  }
  const ranges: string[] = [];
  for (const line of stdin.split("\n")) {
    const parts = line.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    if (parts.length !== 4) throw new Error("malformed pre-push input; outgoing history was not inspected");
    const localSha = parts[1] ?? "";
    const remoteSha = parts[3] ?? "";
    if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(localSha) || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(remoteSha) || localSha.length !== remoteSha.length) {
      throw new Error("malformed pre-push input; outgoing history was not inspected");
    }
    if (/^0+$/.test(localSha)) continue;
    ranges.push(`${remoteSha}..${localSha}`);
  }
  return stdin.trim() || hookInput ? ranges : ["@{u}..HEAD"];
}

function recordLocalEvent(type: "check" | "status", fields: Record<string, number | string>): void {
  try {
    const root = process.cwd();
    const config = JSON.parse(readFileSync(join(root, ".fence/config.json"), "utf8"));
    if (config?.fence_look?.enabled === true) appendEvent(root, { type, ...fields });
  } catch { /* Optional local telemetry never changes the verdict. */ }
}

export async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  if (cmd && ["check", "status", "undo", "checkpoint"].includes(cmd) && !process.env["VIBE_FENCE_DELEGATED"]) {
    let root = process.cwd();
    try { root = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch {}
    const path = join(root, ".fence/bin/vibe-fence.cjs");
    try {
      if (adapterPathsSafe(root, [".fence/bin/vibe-fence.cjs"]) && readFileSync(path, "utf8").includes("vibe-fence managed project launcher")) {
        const result = spawnSync(process.execPath, [path, ...argv], { stdio: "inherit", env: { ...process.env, VIBE_FENCE_DELEGATED: "1" } });
        return result.status ?? 2;
      }
    } catch { /* No usable installed runtime: run this CLI directly. */ }
  }
  const hostArg = rest.find((arg) => arg.startsWith("--host=") || arg.startsWith("--adapters="));
  const hostFlag = rest.findIndex((arg) => arg === "--host" || arg === "--adapters");
  const hosts = (hostArg ? hostArg.slice(hostArg.indexOf("=") + 1) : hostFlag >= 0 ? rest[hostFlag + 1] : "")?.split(",").map(s => s.trim()).filter(Boolean) ?? [];
  if (cmd === "doctor") {
    const general = getProtectionStatus(process.cwd());
    const selected = hosts.length ? hosts : general.installedHosts;
    const reports = selected.map(host => ({ host, status: getProtectionStatus(process.cwd(), host), probe: verifyAdapterHook(process.cwd(), host) }));
    const integrity = verifyAttestation(process.cwd());
    const report = { hosts: reports, gitHooks: general.gitHooks, integrity };
    if (rest.includes("--json")) console.log(JSON.stringify(report, null, 2));
    else {
      if (!reports.length) console.log("No installed adapters found; run vibe-fence init.");
      for (const item of reports) console.log(`${item.host}: ${item.probe.detail} (${item.status.toolGate.state})`);
      console.log(`Git hooks: ${general.gitHooks.state}. ${general.gitHooks.next}`);
      console.log(`Local integrity: ${integrity.status}.`);
    }
    return reports.some(item => item.probe.supported && !item.probe.verified) || integrity.status === "fail" ? 1 : 0;
  }
  if (cmd === "status") {
    const host = hosts[0];
    if (hosts.length > 1) {
      const reports = hosts.map(id => getProtectionStatus(process.cwd(), id));
      if (rest.includes("--json")) console.log(JSON.stringify(reports, null, 2));
      else for (const report of reports) console.log(`${report.host}: ${report.toolGate.state} — ${report.toolGate.next}\nGit hooks: ${report.gitHooks.state} — ${report.gitHooks.next}`);
      return 0;
    }
    const report = getProtectionStatus(process.cwd(), host);
    recordLocalEvent("status", { toolState: report.toolGate.state, gitState: report.gitHooks.state });
    if (rest.includes("--json")) console.log(JSON.stringify(report, null, 2));
    else {
      const meanings: Record<string, string> = {
        "configured-unverified": "The hook is configured, but execution has not been verified.",
        advisory: "There is no verified tool-call block; any guidance is advisory.",
        degraded: "Some protection is configured, but a required part is missing or changed.",
        inactive: "The expected hooks are not active in this Git hooks directory.",
        unverified: "There is not enough information to verify protection for this host.",
        unavailable: "Git hook status is unavailable for this directory.",
      };
      console.log(formatStatusHeader(report.toolGate.state, report.integrity.status));
      console.log(`Host: ${report.host}${report.autoDetected ? ` (auto-detected from .fence/adapters/${report.host}.json)` : ""}`);
      console.log(`Pre-action protection: ${report.toolGate.state} — ${report.toolGate.next}`);
      console.log(`  ${meanings[report.toolGate.state] ?? "Review this protection state."}`);
      console.log(`Git hooks: ${report.gitHooks.state} — ${report.gitHooks.next}`);
      console.log(`  ${meanings[report.gitHooks.state] ?? "Review this protection state."}`);
      console.log(`Local integrity: ${report.integrity.status}`);
      if (report.gitHooks.path) console.log(`Git hook directory: ${report.gitHooks.path}`);
      console.log(`Fence executable: ${report.gateExecutable ?? "not found"}`);
    }
    return 0;
  }
  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(help());
    return 0;
  }
  if (cmd === "--version" || cmd === "-V" || cmd === "-v") {
    console.log(`vibe-fence ${packageVersion()}`);
    return 0;
  }
  if (cmd === "init") {
    const contributorMode = rest.includes("--contributor-mode");
    if (contributorMode) console.log(CONTRIBUTOR_DISCLOSURE);
    const adaptersArg = rest.find((a) => a.startsWith("--adapters=") || a.startsWith("--host="));
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
    const adapters = adaptersArg || hostFlag >= 0
      ? hosts
      : profile === "muse"
        ? ["claude"]
        : undefined;
    await install(process.cwd(), {
      dryRun: rest.includes("--dry-run"),
      contributorMode,
      full: rest.includes("--full"),
      noPackageScripts: rest.includes("--no-package-scripts"),
      adapters,
    });
    return 0;
  }
  if (cmd === "uninstall" || cmd === "remove") {
    const dryRun = rest.includes("--dry-run");
    const result = runUninstall(process.cwd(), { dryRun });
    console.log(`${dryRun ? "Would remove or restore" : "Removed or restored"} ${result.removed.length} managed items.`);
    for (const item of result.preserved) console.log(`Preserved for review: ${item}`);
    return result.preserved.length ? 1 : 0;
  }
  if (cmd === "reset") {
    if (!existsSync(join(process.cwd(), ".fence/config.json"))) { console.error("vibe-fence: no initialized project found."); return 2; }
    resetCircuit(process.cwd(), "user requested reset");
    resetNetworkBudget(process.cwd());
    console.log("Circuit breaker and network command budget reset. Review the previous failure before retrying.");
    return 0;
  }
  if (cmd === "dial") {
    if (!existsSync(join(process.cwd(), ".fence/config.json"))) { console.error("vibe-fence: no initialized project found."); return 2; }
    const level = rest[0] ?? "status";
    if (level === "status") { console.log(`Teaching dial: ${loadDialState(process.cwd()).global}`); return 0; }
    if (!["max", "medium", "min", "silent"].includes(level)) { console.error("vibe-fence: dial must be max, medium, min, silent, or status."); return 2; }
    setGlobalLevel(process.cwd(), level as DialLevel, "user selection");
    console.log(`Teaching dial set to ${level}.`);
    return 0;
  }
  if (cmd === "verify") {
    const root = process.cwd();
    if (!existsSync(join(root, ".fence/config.json"))) { console.error("vibe-fence: no initialized project found."); return 2; }
    if (!adapterPathsSafe(root, [".fence/verdicts", ...["compile", "lint", "tests", "tests-x2", "build"].map(tier => `.fence/verdicts/manual-${tier}.log`)])) { console.error("vibe-fence: unsafe verifier output path."); return 2; }
    const local = await runTrustLadder(root, "manual", { generateEphemeral: false });
    const remote = rest.includes("--remote") ? await verifyRemote() : undefined;
    if (rest.includes("--json")) console.log(JSON.stringify({ local, ...(remote ? { remote } : {}) }, null, 2));
    else {
      for (const tier of local.tiers) console.log(`${tier.tier}: ${tier.status}${tier.reason ? ` — ${tier.reason}` : ""}`);
      console.log(`Local verification: ${local.overall}.`);
      if (remote) console.log(`Remote RLS probe: ${remote.verdict} — ${remote.reason}`);
    }
    return local.overall === "fail" || remote?.verdict === "fail" ? 1 : local.overall === "unknown" || remote?.verdict === "unknown" ? 2 : 0;
  }
  if (cmd === "check") {
    const json = rest.includes("--json");
    const staged = rest.includes("--staged");
    const parseLimit = (name: string): number | undefined => {
      const equal = rest.find(arg => arg.startsWith(`${name}=`));
      const index = rest.indexOf(name);
      if (!equal && index < 0) return undefined;
      const raw = equal ? equal.slice(name.length + 1) : rest[index + 1];
      if (!raw || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1) throw new Error(`${name} needs a positive integer`);
      return Number(raw);
    };
    let maxBytesPerFile: number | undefined, maxFiles: number | undefined;
    try { maxBytesPerFile = parseLimit("--max-bytes"); maxFiles = parseLimit("--max-files"); }
    catch (error) { console.error(`vibe-fence: ${(error as Error).message}.`); return 2; }
    const options = { maxBytesPerFile, maxFiles };
    const pushIdx = rest.findIndex((a) => a === "--push" || a.startsWith("--push="));
    const all = rest.includes("--all");
    if (all && pushIdx === -1) {
      console.error("vibe-fence: --all requires --push.");
      return 2;
    }
    if (staged && pushIdx !== -1) {
      console.error("vibe-fence: check takes at most one of --staged / --push.");
      return 2;
    }
    let report;
    if (staged) {
      report = runIndexCheck(process.cwd(), options);
    } else if (pushIdx !== -1) {
      const arg = rest[pushIdx]!;
      let range: string | null = null;
      if (arg.startsWith("--push=")) {
        range = arg.slice("--push=".length);
      } else if (rest[pushIdx + 1] && !rest[pushIdx + 1]!.startsWith("--")) {
        range = rest[pushIdx + 1]!;
      }
      if (all && (range !== null || rest.includes("--hook-input"))) {
        console.error("vibe-fence: --all cannot be combined with a push range or hook input.");
        return 2;
      }
      if (range !== null && !isValidPushRange(range)) {
        console.error("vibe-fence: bad --push range (want <old>..<new> or <rev>).");
        return 2;
      }
      report = runPushCheck(process.cwd(), all ? ["--all"] : range ? [range] : pushRangesFromStdinOrDefault(rest.includes("--hook-input")), options);
    } else {
      report = runCheck(process.cwd(), options);
    }
    if (json) {
      console.log(JSON.stringify(publicReport(report), null, 2));
    } else {
      console.log(formatHuman(report, { projectRoot: process.cwd() }));
    }
    const exit = exitCodeForReport(report);
    recordLocalEvent("check", { filesScanned: report.filesScanned, blocks: report.blocks, unknowns: report.unknowns });
    // Explain all fails when the report blocks (each command follows its own exit contract).
    if (rest.includes("--explain") && report.blocks > 0) {
      const failures = report.findings
        .filter((f) => f.verdict === "fail")
        .map((f) => ({ ruleId: f.ruleId, severity: f.severity, file: f.file, reason: f.reason }));
      await printExplanation(failures, { kind: "check", target: process.cwd() }, json);
    }
    return exit;
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
    const r = checkpoint({ action, projectRoot: process.cwd(), includeUntracked: rest.includes("--include-untracked"), allowSecretsInCheckpoint: rest.includes("--allow-secrets-in-checkpoint") });
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
    if (rest.includes("--args-stdin") && flag("--args") !== null) {
      console.error("vibe-fence: gate takes only one of --args and --args-stdin.");
      return 2;
    }
    const rawArgs = rest.includes("--args-stdin") ? readFileSync(0, "utf-8") : flag("--args");
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
    for (const f of findings) {
      const summary = f.ruleId === "BILL-01" && f.reason.startsWith("Network command limit reached")
        ? "Network command limit reached; review the loop and run vibe-fence reset after review. This count does not measure cloud spend."
        : publicSummary(f.ruleId);
      console.log(`${f.ruleId} [${f.severity}] ${summary}`);
      try {
        const remediation = publicRemediation(f.ruleId);
        const card = buildTeachingCard(projectRoot, "general", { action: f.ruleId, diffSummary: summary, remediation, why: publicImpact(f.ruleId) });
        if (card) {
          console.log(`What changed: ${card.whatChanged}\nWhy: ${card.why}\nYour call: ${card.yourCall}\nHow we'll know: ${card.howWeWillKnow}`);
          console.log(`Copy-paste this into your AI: vibe-fence blocked ${f.ruleId}. ${remediation ?? "Review and fix the issue."} Re-run vibe-fence check.`);
        }
      } catch { /* Teaching is optional and never changes a gate verdict. */ }
    }
    if (rest.includes("--explain")) {
      const fileArg = (args as Record<string, unknown>)["filePath"];
      const file = typeof fileArg === "string" ? fileArg : `tool:${tool}`;
      await printExplanation(
        findings.map((f) => ({ ruleId: f.ruleId, severity: f.severity, file, reason: f.reason })),
        { kind: "gate", target: tool },
        false,
      );
    }
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
