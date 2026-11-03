# Maintainer verification

Source lives in `src/`; regenerate `dist/` using `bun run build`. Run `bunx --no-install tsc --noEmit`, `bun run build`, `bun run validate`, `bun test`, and `bun run eval` in that order. Inspect the package with `bun pm pack --dry-run`. Do not claim real-host verification from configuration or fixture tests.
