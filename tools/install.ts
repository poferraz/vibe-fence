#!/usr/bin/env bun
/** Development entry point; share the packaged CLI's setup argument handling. */
export * from "../src/install.js";

if (import.meta.main) {
  process.argv.splice(2, 0, "init");
  await import("../src/cli.js");
}
