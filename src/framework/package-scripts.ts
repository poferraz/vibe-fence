/** Read package scripts without executing them. This is a bounded shell heuristic. */
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { adapterPathsSafe } from "../adapters/safe-paths.js";

function commands(input: string): string[][] {
  const result: string[][] = [], words: string[] = [];
  let word = "", quote = "", escaped = false;
  const endWord = () => { if (word) { words.push(word); word = ""; } };
  const endCommand = () => { endWord(); if (words.length) result.push(words.splice(0)); };
  for (const ch of input) {
    if (escaped) { word += ch; escaped = false; continue; }
    if (ch === "\\" && quote !== "'") { escaped = true; continue; }
    if (quote) { if (ch === quote) quote = ""; else word += ch; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === ";" || ch === "|" || ch === "&" || ch === "\n") { endCommand(); continue; }
    if (/\s/.test(ch)) { endWord(); continue; }
    word += ch;
  }
  endCommand();
  return result;
}
function invokedScripts(command: string): string[] {
  const found: string[] = [];
  const yarnBuiltins = new Set(["add", "remove", "install", "dlx", "exec", "node", "config", "workspace", "workspaces", "--version", "-v"]);
  for (const segment of commands(command)) {
    let i = 0;
    while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(segment[i] ?? "")) i++;
    const manager = (segment[i++] ?? "").replace(/\\/g, "/").split("/").at(-1)?.toLowerCase();
    let name: string | undefined;
    if (["npm", "pnpm", "bun"].includes(manager ?? "")) {
      if (["run", "run-script"].includes(segment[i] ?? "")) name = segment[i + 1];
    } else if (manager === "yarn") {
      name = segment[i] === "run" ? segment[i + 1] : segment[i];
      if (name && yarnBuiltins.has(name)) name = undefined;
    }
    if (name && /^[A-Za-z0-9_:.+-]+$/.test(name)) found.push(name);
  }
  return found;
}

export function packageScriptBodies(root: string, command: string): Array<{ name: string; body: string }> {
  const path = join(root, "package.json");
  try {
    if (!adapterPathsSafe(root, ["package.json"]) || statSync(path).size > 512 * 1024) return [];
    const scripts = JSON.parse(readFileSync(path, "utf8"))?.scripts;
    if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return [];
    const visited = new Set<string>();
    const bodies: Array<{ name: string; body: string }> = [];
    const visit = (name: string): void => {
      if (visited.has(name) || visited.size >= 32) return;
      visited.add(name);
      for (const key of [`pre${name}`, name, `post${name}`]) {
        if (!Object.hasOwn(scripts, key) || typeof scripts[key] !== "string") continue;
        const body = scripts[key].slice(0, 64 * 1024) as string;
        bodies.push({ name: key, body });
        for (const next of invokedScripts(body)) visit(next);
      }
    };
    for (const name of invokedScripts(command)) visit(name);
    return bodies;
  } catch { return []; }
}
