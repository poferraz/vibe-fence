/**
 * src/rules/context.ts — shared mention-vs-payload machinery (zero-FP core).
 * A fence that flags its own docs discussing attacks cannot demo. Doctrine:
 * - Live tool calls (toolName set by gate): strict, arg content is action.
 * - Tree scans (no toolName): rules fire only on ACTIONABLE patterns —
 *   references outside strings/comments (SEC-01), read sinks with
 *   credential paths (SEC-02), executable files or exec-sink lines for
 *   shell-shaped payloads (NET-01/CMD-01/GIT-01), package.json scripts
 *   values (SUP-01), .sql / sink SQL lines (DB-01).
 */

const EXECUTABLE_EXTS = new Set([".sh", ".bash", ".zsh", ".mk", ".mak"]);

/** True when the path itself executes: shell scripts, makefiles, Dockerfiles, git hooks, CI workflows. */
export function isExecutablePath(filePath: string | undefined): boolean {
  if (!filePath) return false;
  const lower = filePath.toLowerCase().replace(/\\/g, "/");
  const base = lower.split("/").pop() ?? "";
  if (base === "makefile" || base === "dockerfile" || base.endsWith(".dockerfile")) return true;
  const dot = base.lastIndexOf(".");
  if (dot !== -1 && EXECUTABLE_EXTS.has(base.slice(dot))) return true;
  const slashed = `/${lower}`;
  if (slashed.includes("/.git/hooks/") || slashed.includes("/.github/workflows/")) return true;
  return false;
}

/** Code sites that execute their string arguments (taint-lite sink list). */
export const EXEC_SINK_RE =
  /\b(exec|execSync|execFile|execFileSync|spawn|spawnSync|system|popen|shell_exec|passthru|child_process|Bun\.spawn|Deno\.run)\b/;

/**
 * Lines that pass strings to an exec sink. Detection runs on live code with
 * string contents blanked (a sink call *inside* a string is a test fixture,
 * not a sink); the ORIGINAL lines are returned so payload patterns — which
 * live in the arguments — still match.
 */
export function sinkLines(content: string): string[] {
  return content.split("\n").filter((line) => {
    const live = liveCode(line);
    if (!live.trim()) return false;
    return EXEC_SINK_RE.test(stripStrings(live));
  });
}

const PROSE_EXTS = new Set([".md", ".mdx", ".markdown", ".txt", ".rst", ".textile", ".html", ".htm"]);

/**
 * True for prose/documentation paths. In tree scans, sink-line analysis is
 * skipped for prose: long doc lines discussing an attack ("tool.execute"
 * + "curl|sh") are mentions, and actual execution is gated live.
 */
export function isProsePath(filePath: string | undefined): boolean {
  if (!filePath) return false;
  const base = filePath.toLowerCase().replace(/\\/g, "/").split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot === -1) return false;
  return PROSE_EXTS.has(base.slice(dot));
}

/** Tool-name classes shared by the gate and path/command rules. */
export const READ_LIKE_TOOL_RE = /^(read|view|open|cat|show|load)$/i;
export const WRITE_LIKE_TOOL_RE = /^(write|edit|create|apply|patch|multiedit)$/i;
export const SHELL_LIKE_TOOL_RE = /^(bash|shell|sh|exec|run|command)$/i;

function isOpenerBoundary(line: string, i: number): boolean {
  return i === 0 || /[\s;{[(=,]/.test(line[i - 1] ?? "");
}

/**
 * Live code on one line: block comments (slash-star … star-slash, same-line or
 * unterminated), block-continuation lines, and // # trailing comments removed;
 * strings preserved. Quote-aware throughout.
 */
export function liveCode(line: string): string {
  // Block-continuation line (` * ...`) with no closer: pure comment.
  if (/^\s*\*(?!\/)/.test(line) && !line.includes("*/")) return "";
  let out = "";
  let quote: string | null = null;
  let i = 0;
  const n = line.length;
  while (i < n) {
    const c = line[i]!;
    if (quote) {
      out += c;
      if (c === "\\" && i + 1 < n) {
        out += line[i + 1];
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      if (end === -1) break; // runs past EOL
      i = end + 2;
      continue;
    }
    // Stray closer (block opened on an earlier line): drop everything before it.
    if (c === "*" && line[i + 1] === "/" && /^\s*\*/.test(line)) {
      out = "";
      i += 2;
      continue;
    }
    if (c === "/" && line[i + 1] === "/" && isOpenerBoundary(line, i)) break;
    if (c === "#" && isOpenerBoundary(line, i)) break;
    out += c;
    i++;
  }
  return out;
}

/** Line with '…'/"…" literal contents blanked (escapes honored; backticks kept — they act). */
export function stripStrings(line: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (quote) {
      if (c === "\\") {
        i++;
      } else if (c === quote) {
        quote = null;
      }
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    out += c;
  }
  return out;
}

/** True when the char at `index` sits inside a '…'/"…" literal (escapes honored). */
export function isQuotedAt(line: string, index: number): boolean {
  let quote: string | null = null;
  for (let i = 0; i < index && i < line.length; i++) {
    const c = line[i]!;
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === "'" || c === '"') {
      quote = c;
    }
  }
  return quote !== null;
}

/**
 * True when the char at `index` sits inside a '…'/"…" literal or any comment
 * (//, #, slash-star blocks, block continuations) on its line — a mention,
 * not an action. Backticks deliberately do NOT count: in shell they execute,
 * in JS they interpolate. Multi-line template literals stay a blind spot.
 */
export function isQuotedOrCommented(line: string, index: number): boolean {
  if (/^\s*\*(?!\/)/.test(line) && !line.includes("*/")) return true;
  let quote: string | null = null;
  let i = 0;
  while (i < index && i < line.length) {
    const c = line[i]!;
    if (quote) {
      if (c === "\\") {
        i++;
      } else if (c === quote) {
        quote = null;
      }
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      i++;
      continue;
    }
    if (c === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      if (end === -1 || end >= index) return true;
      i = end + 2;
      continue;
    }
    if (c === "/" && line[i + 1] === "/" && isOpenerBoundary(line, i)) return true;
    if (c === "#" && isOpenerBoundary(line, i)) return true;
    i++;
  }
  return quote !== null;
}
