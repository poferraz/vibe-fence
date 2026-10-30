# Maintainer checklist

Short, and only for people changing this repository. It is not an always-on
agent instruction file.

## Before proposing a change

- [ ] `src/` changed, `dist/` regenerated (`bun run build`); never edit `dist/`.
- [ ] A behaviour change starts with a failing test; note the red result.
- [ ] Run the gate in order: `bunx --no-install tsc --noEmit`, `bun run build`,
      `bun run validate`, `bun test`, `bun run eval`.
- [ ] Report skips and unknowns; an unknown is never a pass.
- [ ] If a rule changes, update its test, the hostile/benign fixture, and the
      corpus (new TN or TP needs review + baseline regeneration).
- [ ] If a claim changes, update `docs/research/CLAIMS.md` and the page that
      states it.
- [ ] If a suite changes, update `tests/evals/ladder.json` (a test enforces the
      required fields).
- [ ] Keep private working material out: `.fence/private/` is ignored and must
      never be published.

## Phases

One reviewable phase per PR. Each phase records its baseline revision, results,
open risks and next action in `.fence/private/progress.md`. Do not merge or
publish without explicit authorization.

## Release (when authorized)

- [ ] Clean install from a fresh clone: `bun install`, `bun run build`,
      `node dist/cli.js init` in a scratch repo, then `status`, `check`, `undo`.
- [ ] `bun pm pack --dry-run`: expected files only, no `.fence/private/`, no
      tests in `dist/`.
- [ ] Publish only with a tag and `NPM_TOKEN`; the release workflow runs the
      gates first.
- [ ] After publishing, verify `npx vibe-fence init` in a scratch repo and
      update the README install section.

## Known maintenance traps

- This machine can redirect Git hooks globally (`core.hooksPath`); `status`
  reports it, and tests isolate Git config. Never change global Git config.
- `bunx` may need `--no-install` in sandboxes.
- Host adapters can fail open by design; never describe them as enforcement.
- History scanning is bounded (512 KiB/file, 5,000 commits/files, submodules
  block). Findings show paths and commits, never historical file contents.
