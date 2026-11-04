import { afterEach, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FENCE_SYNC_TOKEN_ENV, persistAttestation, verifyAttestation } from "./integrity";
import { runCheck, exitCodeForReport, formatHuman } from "../check";

const root = mkdtempSync(join(tmpdir(), "vf-integrity-"));
const original = process.env[FENCE_SYNC_TOKEN_ENV];
afterEach(() => { if (original === undefined) delete process.env[FENCE_SYNC_TOKEN_ENV]; else process.env[FENCE_SYNC_TOKEN_ENV] = original; rmSync(root, { recursive: true, force: true }); });

it("does not let an arbitrary token conceal drift and reports corrupt records", () => {
  mkdirSync(join(root, ".fence"));
  writeFileSync(join(root, "AGENTS.md"), "original");
  process.env[FENCE_SYNC_TOKEN_ENV] = "synthetic-token";
  persistAttestation(root);
  expect(verifyAttestation(root).status).toBe("pass");
  writeFileSync(join(root, "AGENTS.md"), "changed");
  expect(verifyAttestation(root).status).toBe("fail");
  delete process.env[FENCE_SYNC_TOKEN_ENV];
  expect(verifyAttestation(root).status).toBe("fail");
  writeFileSync(join(root, ".fence/.integrity.json"), JSON.stringify({ version: 1, files: {} }));
  expect(verifyAttestation(root).status).toBe("unknown");
  writeFileSync(join(root, ".fence/.integrity.json"), "invalid");
  const report = runCheck(root);
  expect(exitCodeForReport(report)).toBe(1);
  expect(formatHuman(report)).toContain("outside the managed block");
});

it("refuses to write an attestation through a symlink", () => {
  const { symlinkSync } = require("node:fs");
  const project = mkdtempSync(join(tmpdir(), "vf-integrity-symlink-"));
  const outside = mkdtempSync(join(tmpdir(), "vf-integrity-outside-"));
  const prior = process.env[FENCE_SYNC_TOKEN_ENV];
  try {
    mkdirSync(join(project, ".fence"));
    const sentinel = join(outside, "sentinel");
    writeFileSync(sentinel, "KEEP");
    symlinkSync(sentinel, join(project, ".fence/.integrity.json"));
    process.env[FENCE_SYNC_TOKEN_ENV] = "synthetic";
    expect(() => persistAttestation(project)).toThrow();
    expect(require("node:fs").readFileSync(sentinel, "utf8")).toBe("KEEP");
  } finally { if (prior === undefined) delete process.env[FENCE_SYNC_TOKEN_ENV]; else process.env[FENCE_SYNC_TOKEN_ENV] = prior; rmSync(project, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});
