# Maintainer checklist

Short, and only for people changing this repository. It is not an always-on
agent instruction file.

## Before proposing a change

- [ ] `src/` changed, `dist/` regenerated (`bun run build`); never edit `dist/`.
- [ ] A behaviour change starts with a failing test; note the red result.
- [ ] Run the gate in order: `bunx --no-install tsc --noEmit`, `bun run build`,
      `bun run validate`, `bun test`, `bun run eval`, `bun pm pack --dry-run`.
- [ ] Report skips and unknowns; an unknown is never a pass.
- [ ] If a rule changes, update its test, the hostile/benign fixture, and the
      corpus (new TN or TP needs review + baseline regeneration).
- [ ] If a claim changes, update `docs/research/CLAIMS.md` and the page that
      states it.
- [ ] If a suite changes, update `tests/evals/ladder.json` (a test enforces the
      required fields).
- [ ] Keep private working material out: `.fence/private/` is ignored and must
      never be published.
- [ ] Confirm relative links in the public documents resolve and their targets
      are included in the candidate commit; `bun run validate` checks on-disk
      links, while the release review must check tracked candidate contents.

## Phases

One reviewable phase per PR. Each phase records its baseline revision, results,
open risks and next action in `.fence/private/progress.md`. Do not merge or
publish without explicit authorization.

## Release (when authorized)

- [ ] Clean install from a fresh clone: run `bun install` and `bun run build`,
      save the checkout's absolute path, then run its `dist/cli.js init` in a
      scratch repo and verify `status`, `check`, and `undo`.
- [ ] `bun pm pack --dry-run`: expected files only, no `.fence/private/`, no
      tests in `dist/`.
- [ ] Before any authorized publication, run and record the full gate and
      review the package. `.github/workflows/release.yml` publishes on a matching
      version tag; configure it as an [npm trusted publisher](https://docs.npmjs.com/trusted-publishers/)
      with direct publishing enabled before using it. Test the workflow and
      review its result; merely adding the workflow does not publish a release.
- [ ] After publishing, verify `npx vibe-fence init` in a scratch repo and
      update the README install section.

## Known maintenance traps

- This machine can redirect Git hooks globally (`core.hooksPath`); `status`
  reports it, and tests isolate Git config. Never change global Git config.
- `bunx` may need `--no-install` in sandboxes.
- Host adapters can fail open by design; never describe them as enforcement.
- History scanning is bounded (512 KiB/file, 5,000 commits/files, submodules
  block). Findings show paths and commits, never historical file contents.

Checkpoint events include `scanStatus` (`clear`, `blocked`, or `incomplete`) and `blockingFindings`, which is null when inspection is incomplete. A checkpoint remains an undo point, not a security approval.


## Local-only product changes (November 11, 0.5.0)

Setup now takes one `--host=<tool>` and performs local diagnostics; it never chooses several editors from the user's home directory. Automatic Git checks inspect only staged blobs or outgoing history. Re-run setup to update an existing project's runtime and hook scripts.

The installed product has no model client, remote database probe, API-key configuration or paid evaluation commands. Historical research and evidence may describe removed features; they do not describe this build. Before publishing, run typecheck, build, validate, the full tests and offline evaluation, and rehearse the packed package in a disposable project. Confirm benign unrelated drafts do not block Git, staged and historical leaks still do, and no retired provider modules occur in the tarball.
