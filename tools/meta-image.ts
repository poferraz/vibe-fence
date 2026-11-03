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
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const BASE = process.env["META_API_BASE"] ?? "https://api.meta.ai";
const MODEL = process.env["MUSE_MODEL_IMAGE"] ?? "muse-image-1.0";
const KEY = process.env["MUSE_API_KEY"] ?? process.env["META_API_KEY"] ?? "";

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
if (!Number.isInteger(n) || n < 1 || n > 4) fail(2, `--n must be an integer 1..4 (got '${nRaw}')`);
if (!KEY) fail(3, "no key configured — no call made. Put MUSE_API_KEY in .env (see .env.example).");

const outPath = resolve(ROOT, outRaw as string);
if (!outPath.startsWith(ROOT + "/")) fail(2, "--out must stay inside the repo");

const body: Record<string, unknown> = { model: MODEL, prompt, n };
if (size) body["size"] = size;

let res: Response;
try {
  res = await fetch(`${BASE}/v1/images/generations`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
} catch (err) {
  fail(2, `network error: ${(err as Error).message.slice(0, 200)}`);
}
const data = (await res!.json().catch(() => ({}))) as Record<string, unknown>;
if (!res!.ok) {
  const msg = typeof data["error"] === "string" ? data["error"] : JSON.stringify(data).slice(0, 300);
  fail(2, `API error (HTTP ${res!.status}): ${msg}`);
}

type Img = { b64_json?: string; url?: string };
const items: Img[] = Array.isArray(data["data"]) ? (data["data"] as Img[]) : [];
if (items.length === 0) fail(2, `unexpected response shape (keys: ${Object.keys(data).join(",") || "none"})`);

const ext = extname(outPath) || ".png";
const stem = outPath.slice(0, outPath.length - ext.length);
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
    fail(2, `image ${i} has neither b64_json nor url (keys: ${Object.keys(it).join(",") || "none"})`);
  }
  const p = items.length === 1 ? outPath : `${stem}-${i + 1}${ext}`;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, bytes!);
  written.push({ path: p.slice(ROOT.length + 1), bytes: bytes!.length });
}

mkdirSync(join(ROOT, ".fence"), { recursive: true });
writeFileSync(
  join(ROOT, ".fence", "meta-image.json"),
  JSON.stringify({ at: new Date().toISOString(), endpoint: `${BASE}/v1/images/generations`, model: MODEL, n: items.length, size: size ?? null, written }, null, 2) + "\n",
  "utf-8",
);
for (const w of written) console.log(`meta-image: wrote ${w.path} (${w.bytes} bytes)`);
console.log("meta-image: recorded to .fence/meta-image.json");
