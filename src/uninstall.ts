/** Conservative install journal and removal of unchanged managed files. */
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { adapterPathsSafe } from "./adapters/safe-paths.js";
import { isMuseGateCommand } from "./adapters/muse.js";
import { HOOK_MARKER, HOOK_NAMES, inspectGitHooks } from "./framework/git-hooks.js";

const JOURNAL = ".fence/uninstall.json";
interface Snapshot { before: string | null; mode?: number; after: string | null; preserve?: boolean }
interface Journal { version: 1; files: Record<string, Snapshot>; existingDirs: string[]; createdDirs?: string[] }
interface Capture { journal: Journal; current: Record<string, { bytes: Buffer | null; mode?: number }>; paths: Set<string>; dirsBefore: Set<string> }

function digest(bytes: Buffer | null): string | null { return bytes === null ? null : createHash("sha256").update(bytes).digest("hex"); }
function mayContainCredentials(bytes: Buffer): boolean {
  const text = bytes.toString("utf8");
  return /(?:password|passwd|api[_-]?key|token|secret|credential|authorization|private[_-]?key)[\w-]*["']?\s*[:=]\s*["']?[^"'\s,}]{4,}/i.test(text) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk_live_|sk-ant-|ghp_|github_pat_|npm_|AKIA)/i.test(text);
}
function validPath(root: string, path: string): boolean {
  const target = resolve(root, path), rel = relative(resolve(root), target);
  return !!rel && !isAbsolute(rel) && rel !== ".." && !rel.startsWith(".." + sep) && adapterPathsSafe(root, [rel.split(sep).join("/")]);
}
function readFile(root: string, path: string): { bytes: Buffer | null; mode?: number } {
  try {
    if (!validPath(root, path)) return { bytes: null };
    const file = join(root, path), stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) return { bytes: null };
    return { bytes: readFileSync(file), mode: stat.mode & 0o777 };
  } catch { return { bytes: null }; }
}
function walk(root: string, rel: string, files: Set<string>, dirs: Set<string>): void {
  if (!validPath(root, rel)) return;
  let names: string[];
  try { if (!lstatSync(join(root, rel)).isDirectory()) return; names = readdirSync(join(root, rel)); } catch { return; }
  dirs.add(rel);
  for (const name of names) {
    const child = `${rel}/${name}`;
    if (child === JOURNAL || !validPath(root, child)) continue;
    try {
      const stat = lstatSync(join(root, child));
      if (stat.isDirectory()) walk(root, child, files, dirs);
      else if (stat.isFile()) files.add(child);
    } catch {}
  }
}
function loadJournal(root: string): Journal | null {
  try {
    if (!validPath(root, JOURNAL)) return null;
    const data = JSON.parse(readFileSync(join(root, JOURNAL), "utf8")) as Journal;
    return data?.version === 1 && data.files && typeof data.files === "object" && Array.isArray(data.existingDirs) ? data : null;
  } catch { return null; }
}

/** Called before install changes; the journal contains only changed file snapshots. */
export function captureInstallBaseline(root: string, candidates: string[]): Capture {
  const previous = loadJournal(root);
  if (existsSync(join(root, JOURNAL)) && !previous) throw new Error("unmanaged or invalid uninstall journal; leaving it unchanged");
  const dirs = new Set<string>();
  const paths = new Set(candidates.filter(p => p !== JOURNAL));
  for (const path of paths) {
      try { if (validPath(root, path) && lstatSync(join(root, path)).isDirectory()) dirs.add(path.split(sep).join("/")); } catch {}
      let dir = dirname(path);
      while (dir !== "." && dir !== "") {
        if (validPath(root, dir) && existsSync(join(root, dir))) dirs.add(dir.split(sep).join("/"));
        dir = dirname(dir);
      }
  }
  walk(root, ".fence", paths, dirs);
  if (previous) {
    for (const path of Object.keys(previous.files)) paths.add(path);
  }
  const journal = previous ?? { version: 1, files: {}, existingDirs: [...dirs] };
  const current: Capture["current"] = {};
  for (const path of paths) current[path] = readFile(root, path);
  return { journal, current, paths, dirsBefore: dirs };
}

export function recordInstallResult(root: string, capture: Capture): void {
  const dirs = new Set<string>();
  walk(root, ".fence", capture.paths, dirs);
  for (const path of capture.paths) {
    let dir = path;
    while (dir !== "." && dir !== "") {
      try { if (validPath(root, dir) && lstatSync(join(root, dir)).isDirectory()) dirs.add(dir.split(sep).join("/")); } catch {}
      dir = dirname(dir);
    }
  }
  capture.journal.createdDirs = [...new Set([...(capture.journal.createdDirs ?? []), ...[...dirs].filter(dir => !capture.dirsBefore.has(dir))])];
  for (const path of capture.paths) {
    const before = capture.current[path] ?? { bytes: null };
    const after = readFile(root, path);
    const previous = capture.journal.files[path];
    const beforeHash = digest(before.bytes), afterHash = digest(after.bytes);
    if (previous) {
      if (previous.after !== beforeHash) previous.preserve = true;
      previous.after = afterHash;
    } else if (beforeHash !== afterHash) {
      // Avoid duplicating large files or likely credential-bearing settings.
      const preserve = !!before.bytes && (before.bytes.length > 256 * 1024 || mayContainCredentials(before.bytes));
      capture.journal.files[path] = {
        before: before.bytes === null || preserve ? null : before.bytes.toString("base64"),
        mode: before.mode,
        after: afterHash,
        ...(preserve ? { preserve: true } : {}),
      };
    }
  }
  if (!validPath(root, JOURNAL)) throw new Error("unsafe uninstall journal path");
  mkdirSync(join(root, ".fence"), { recursive: true });
  writeFileSync(join(root, JOURNAL), JSON.stringify(capture.journal, null, 2) + "\n", { mode: 0o600 });
}

function removeManagedEntries(path: string, bytes: Buffer): Buffer | null {
  const text = bytes.toString("utf8");
  if (path === "AGENTS.md") {
    const next = text.replace(/\n?<!-- vibe-fence:start -->[\s\S]*?<!-- vibe-fence:end -->\n?/g, "\n");
    return Buffer.from(next);
  }
  if (path === ".gitignore") {
    return Buffer.from(text.replace(/(?:^|\n)# vibe-fence\n(?:\.fence\/(?:\.integrity\.json|uninstall\.json|runtime\/|bin\/|events\.ndjson)\n|\.env(?:\.local|\.\*\.local)?\n)+/g, "\n"));
  }
  if (![".claude/settings.json", ".cursor/hooks.json", ".codex/hooks.json", ".muse/hooks.json", "package.json"].includes(path)) return null;
  try {
    const data = JSON.parse(text) as Record<string, any>;
    if (path === "package.json") {
      if (data.scripts && typeof data.scripts === "object") for (const cmd of ["check", "status", "undo"]) {
        if (data.scripts[`fence:${cmd}`] === `node ./.fence/bin/vibe-fence.cjs ${cmd}`) delete data.scripts[`fence:${cmd}`];
      }
    } else if (data.hooks && typeof data.hooks === "object") {
      const key = path === ".cursor/hooks.json" ? "preToolUse" : "PreToolUse";
      if (Array.isArray(data.hooks[key])) {
        const managed = (hook: any) => path === ".muse/hooks.json"
          ? isMuseGateCommand(hook?.command)
          : [hook?.command, ...(Array.isArray(hook?.args) ? hook.args : [])].some((command: unknown) => typeof command === "string" && /(?:^|[\\/])fence-gate\.(?:sh|cjs)(?:["']|\s|$)/.test(command));
        data.hooks[key] = data.hooks[key].flatMap((entry: any) => {
          if (Array.isArray(entry?.hooks)) {
            const remaining = entry.hooks.filter((hook: unknown) => !managed(hook));
            if (remaining.length === entry.hooks.length) return [entry];
            return remaining.length ? [{ ...entry, hooks: remaining }] : [];
          }
          return managed(entry) ? [] : [entry];
        });
        if (data.hooks[key].length === 0) delete data.hooks[key];
      }
      if (Object.keys(data.hooks).length === 0) delete data.hooks;
    }
    return Buffer.from(JSON.stringify(data, null, 2) + "\n");
  } catch { return null; }
}

/** Never remove unknown or modified files; report anything that needs review. */
export function runUninstall(root: string, opts: { dryRun?: boolean } = {}): { removed: string[]; preserved: string[] } {
  const removed: string[] = [], preserved: string[] = [], dirs = new Set<string>();
  const journal = loadJournal(root);
  if (!journal) return { removed, preserved: ["No safe uninstall record was found; existing files were left unchanged."] };
  const existingFenceFiles = new Set<string>();
  walk(root, ".fence", existingFenceFiles, new Set<string>());
  for (const file of existingFenceFiles) if (!Object.hasOwn(journal.files, file)) preserved.push(file);
  for (const dir of journal.createdDirs ?? []) dirs.add(dir);
  const rememberDirs = (path: string) => { let d = dirname(path); while (d !== "." && d !== "") { dirs.add(d.split(sep).join("/")); d = dirname(d); } };
  for (const [path, snapshot] of Object.entries(journal.files)) {
    if (!validPath(root, path) || !snapshot || typeof snapshot !== "object") { preserved.push(path); continue; }
    const current = readFile(root, path);
    if (current.bytes === null) continue;
    const unchanged = digest(current.bytes) === snapshot.after && !snapshot.preserve;
    let replacement: Buffer | null = null;
    if (unchanged && snapshot.before !== null && typeof snapshot.before === "string") replacement = Buffer.from(snapshot.before, "base64");
    else if (!unchanged) replacement = removeManagedEntries(path, current.bytes);
    if (!unchanged && replacement === null) { preserved.push(path); continue; }
    removed.push(path);
    rememberDirs(path);
    if (!opts.dryRun) {
      if (replacement === null) unlinkSync(join(root, path));
      else writeFileSync(join(root, path), replacement, { mode: snapshot.mode ?? 0o600 });
    }
  }
  const hooks = inspectGitHooks(root);
  if (hooks.effectiveDir && !hooks.blockedOutside) {
    for (const name of HOOK_NAMES) {
      const path = join(hooks.effectiveDir, name), backup = path + ".pre-fence";
      try {
        if (lstatSync(path).isSymbolicLink() || !readFileSync(path, "utf8").includes(HOOK_MARKER)) continue;
        if (existsSync(backup) && lstatSync(backup).isSymbolicLink()) { preserved.push(backup); continue; }
        removed.push(path);
        if (!opts.dryRun) { unlinkSync(path); if (existsSync(backup)) renameSync(backup, path); }
      } catch {}
    }
  }
  rememberDirs(JOURNAL);
  if (!opts.dryRun) {
    unlinkSync(join(root, JOURNAL));
    for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
      if (journal.existingDirs.includes(dir) || !validPath(root, dir)) continue;
      try { rmdirSync(join(root, dir)); } catch {}
    }
  }
  return { removed, preserved };
}
