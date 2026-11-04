#!/usr/bin/env bun
/**
 * tools/meta-image.ts — capped Muse Image generation for demo assets.
 *
 * One OpenAI-compatible call per image batch: POST {META_API_BASE}/v1/images/generations
 * with model MUSE_MODEL_IMAGE (default muse-image-1.0). Same key as the text
 * API (MUSE_API_KEY / META_API_KEY, never printed or stored).
 *
 * Usage:
 *   bun run tools/meta-image.ts --prompt "..." --out demo/leak-app/public/images/logo.png [--n 1] [--size 1024x1024]
 *
 * Caps: --n 1..4 (default 1). n>1 writes <name>-1.<ext> … <name>-n.<ext>.
 * Note: the API returns WebP bytes — prefer a .webp --out path.
 * Records {model, requestId?, out, bytes, at} to .fence/meta-image.json (gitignored).
 *
 * Exit codes: 0 = written · 2 = API error (recorded, nothing written) ·
 * 3 = no key configured (no call made).
 */
import { closeSync, constants, lstatSync, mkdirSync, openSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";

const ROOT = realpathSync(resolve(import.meta.dir, ".."));
const BASE = process.env["META_API_BASE"] ?? "https://api.meta.ai";
const MODEL = process.env["MUSE_MODEL_IMAGE"] ?? "muse-image-1.0";
const KEY = process.env["MUSE_API_KEY"] ?? process.env["META_API_KEY"] ?? "";

/** Reject symlinks in managed paths, including dangling links and final files. */
function safeTarget(target: string): boolean {
  const rel = relative(ROOT, target);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return false;
  let current = ROOT;
  for (const component of rel.split(sep)) {
    current = join(current, component);
    try { if (lstatSync(current).isSymbolicLink()) return false; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") return false; }
  }
  return true;
}

function writeSafe(target: string, data: string | Buffer): void {
  if (!safeTarget(target)) throw new Error("unsafe output path");
  mkdirSync(dirname(target), { recursive: true });
  if (!safeTarget(target)) throw new Error("unsafe output path");
  const fd = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW, 0o666);
  try { writeFileSync(fd, data); } finally { closeSync(fd); }
}

function flag(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? (process.argv[i + 1] as string) : null;
}

function fail(code: number, msg: string): never {
  console.log(`meta-image: ${msg}`);
  process.exit(code);
}

const prompt = flag("--prompt");
const outRaw = flag("--out");
const nRaw = flag("--n") ?? "1";
const size = flag("--size") ?? undefined;
if (!prompt) fail(2, "missing --prompt \"...\" (usage error, no call made)");
if (!outRaw) fail(2, "missing --out <path> (usage error, no call made)");
const n = Number(nRaw);
if (!Number.isInteger(n) || n < 1 || n > 4) fail(2, "--n must be an integer 1..4");
if (!KEY) fail(3, "no key configured — no call made. Put MUSE_API_KEY in .env (see .env.example).");

const outPath = resolve(ROOT, outRaw as string);
const originalExt = extname(outPath);
const ext = originalExt || ".png";
const stem = originalExt ? outPath.slice(0, -originalExt.length) : outPath;
const outputPaths = Array.from({ length: n }, (_, i) => n === 1 ? outPath : `${stem}-${i + 1}${ext}`);
const receiptPath = join(ROOT, ".fence", "meta-image.json");
if (outputPaths.some(path => !safeTarget(path))) fail(2, "--out must stay inside the repo and not use symlinks; no call made");
if (!safeTarget(receiptPath)) fail(2, ".fence receipt path is unsafe; no call made");

const body: Record<string, unknown> = { model: MODEL, prompt, n };
if (size) body["size"] = size;

let res: Response;
try {
  res = await fetch(`${BASE}/v1/images/generations`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
} catch {
  fail(2, "network error; image request failed");
}
const data = (await res!.json().catch(() => ({}))) as Record<string, unknown>;
if (!res!.ok) {
  fail(2, `API error (HTTP ${res!.status})`);
}

type Img = { b64_json?: string; url?: string };
const items: Img[] = Array.isArray(data["data"]) ? (data["data"] as Img[]) : [];
if (items.length !== n) fail(2, "unexpected number of images in provider response");

const written: Array<{ path: string; bytes: number }> = [];
for (let i = 0; i < items.length; i++) {
  const it = items[i]!;
  let bytes: Buffer;
  if (typeof it.b64_json === "string" && it.b64_json.length > 0) {
    bytes = Buffer.from(it.b64_json, "base64");
  } else if (typeof it.url === "string" && it.url.length > 0) {
    const dl = await fetch(it.url);
    if (!dl.ok) fail(2, `image URL download failed (HTTP ${dl.status})`);
    bytes = Buffer.from(await dl.arrayBuffer());
  } else {
    fail(2, `image ${i + 1} has neither base64 data nor a URL`);
  }
  const p = outputPaths[i]!;
  try { writeSafe(p, bytes!); } catch { fail(2, "could not safely write image output"); }
  written.push({ path: p.slice(ROOT.length + 1), bytes: bytes!.length });
}

try {
  writeSafe(receiptPath, JSON.stringify({ at: new Date().toISOString(), endpoint: `${BASE}/v1/images/generations`, model: MODEL, n: items.length, size: size ?? null, written }, null, 2) + "\n");
} catch { fail(2, "could not safely write .fence receipt"); }
for (const w of written) console.log(`meta-image: wrote ${w.path} (${w.bytes} bytes)`);
console.log("meta-image: recorded to .fence/meta-image.json");
