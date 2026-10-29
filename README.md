# vibe-fence

vibe-fence is an experimental safety harness for people who build software with coding agents. It adds project instructions, checks for selected risky patterns, and integrations for some agent and Git workflows. Its rule engine is deterministic; an optional model can explain findings.

**Status:** This is a work in progress. It does not make every agent or project safe. Coverage depends on the host, the action, the configured hooks, and the checks that actually run. Check the limitations below before relying on it.

## What it does

- `init` installs project guidance, skills, adapter files, and Git hooks where supported. Existing host configuration and hooks require review during installation.
- `check` scans supported files and reports findings. Blocking findings return a nonzero exit; warnings and unknowns are reported separately.
- `check --staged` scans staged Git blobs; `check --push` scans outgoing commits.
- `gate` evaluates a supported tool call before execution when a host integration invokes it. Some adapters install hooks or plugins; others only add guidance.
- `checkpoint` and `undo` provide Git-based recovery operations. Inspect their output and the project state before relying on a checkpoint.

The [rule registry](src/rules/index.ts), [gate](src/framework/gate.ts), and [check implementation](src/check.ts) describe the actual boundaries. They cover selected patterns, not every unsafe action or vulnerability.

## What is and is not enforced

| Integration | Current implementation | Limitations |
|---|---|---|
| Claude Code and Cursor | Installer configures a pre-tool gate script. `status --host=claude` reports its configuration state. | These hooks allow the action with a warning if their parser or fence executable is unavailable or the gate errors. The installed script was exercised with host-format input locally; a real host session still needs end-to-end verification in your environment. |
| OpenCode | Installer creates a plugin that invokes the gate. | It can allow actions if the gate is unavailable. Verify the plugin is loaded in your environment. |
| Codex | Installer adds guidance and a project-local pre-tool hook for Bash and `apply_patch` when it can safely merge the configuration. | Codex must trust and load the hook; this implementation has not yet been verified in a real session. Other tool paths may not be covered, and hook failures can allow the action. |
| Hermes and Antigravity | Installer writes guidance and adapter metadata. | Do not assume pre-tool enforcement from adapter metadata alone. |
| Git | Installer installs pre-commit and pre-push hooks into the directory Git will actually use (`git rev-parse --git-path hooks`), chaining existing hooks; `status` reports the effective directory. `init` also ensures `.env`, `.env.local`, `.env.*.local` ignores (leaving `.env.example` trackable) and warns by filename if a sensitive env file is already tracked. | If `core.hooksPath` points outside the project, the installer writes nothing there, never changes global Git config, and reports the project-local repair (`.git/hooks`, or the shared common hooks directory in a linked worktree) while hooks stay inactive. Ignore rules do not untrack files. Git hooks do not stop arbitrary tool calls before execution. |

The gate passes unknown tools and only examines a bounded portion of a tool call. Some rules are tree-time checks rather than pre-execution gates; `BILL-01` is a warning, not a spend limit. A clean report is not proof that a project is safe. See [known benchmark gaps](tests/benches/KNOWN-GAPS.md).

## Try it from source

Requirements: Git, [Bun](https://bun.sh/) for development/building, and Node.js 20 or newer to run the bundled CLI. The source path works independently of npm release status.

```sh
git clone https://github.com/poferraz/vibe-fence.git
cd vibe-fence
bun install --frozen-lockfile
bun run build
node dist/cli.js --help
```

To inspect a project, use the built CLI from that project's directory:

```sh
cd /path/to/your/project
node /path/to/vibe-fence/dist/cli.js init --dry-run
node /path/to/vibe-fence/dist/cli.js init
node /path/to/vibe-fence/dist/cli.js status --host=claude
node /path/to/vibe-fence/dist/cli.js status --host=codex
node /path/to/vibe-fence/dist/cli.js check
```

`init` changes files in the project; the dry run previews its intent. For Codex, review and trust the configured hook in the host before testing it. `status` reports configuration, not proof that a host has trusted or executed it. Read any warnings, especially warnings about `core.hooksPath`, and verify the integration in your own environment. If Git uses a redirected hook path, hooks installed in `.git/hooks` may not run.

## Evidence and limitations

The repository contains [unit and integration tests](tests/proof-beats.test.ts), a [deterministic rule corpus](tests/evals/corpus.json), [benchmark fixtures](tests/benches/), a [scoreboard](docs/project/BENCH-SCOREBOARD.md), and an explicit [known-gaps list](tests/benches/KNOWN-GAPS.md). These exercises establish behavior for the cases and surfaces tested. They do not establish a universal false-positive rate or real-world safety rate.

An exploratory live-evaluation pilot produced invalid task verdicts because the actor and scorer used different workspace trees. That pilot does not establish task completion or product effectiveness. The evaluation infrastructure and its accounting need further independent verification before another paid run.

To reproduce the local checks without paid APIs:

```sh
bunx --no-install tsc --noEmit
bun run build
bun run validate
bun test
bun run eval
```

Report skipped tests, unknown results, and the revision used alongside any results. Paid red-team and live-evaluation commands require separate authorization and are not part of this verification sequence.

## Project direction

The product is intended to work with a person's existing coding tools and to distinguish enforced, Git-guarded, and advisory coverage honestly. See [product direction](docs/project/PRODUCT-DIRECTION.md) and the [project index](docs/project/INDEX.md). The source in `src/` is authoritative; `dist/` is generated by `bun run build`.

The explanation option can call an external model when configured; the deterministic checks do not require a model. See [explanation handling](src/framework/explain.ts) before using it, and review provider data-handling terms for your environment.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and [SECURITY.md](SECURITY.md) for reporting security issues. License: [MIT](LICENSE).
