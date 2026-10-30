# vibe-fence

vibe-fence is an experimental safety harness for people who build software with coding agents. It adds project instructions, checks for selected risky patterns, and integrations for some agent and Git workflows. Its rule engine is deterministic; an optional model can explain findings.

**Status:** This is a work in progress. It does not make every agent or project safe. Coverage depends on the host, the action, the configured hooks, and the checks that actually run. Check the limitations below before relying on it.

## What it does

- `init` installs project guidance, skills, adapter files, and Git hooks where supported. Existing host configuration and hooks require review during installation.
- `check` scans supported files and reports findings. Blocking findings return a nonzero exit; warnings and unknowns are reported separately.
- `check --staged` scans staged Git blobs; `check --push` scans outgoing commits.
- `gate` evaluates a supported tool call before execution when a host integration invokes it. Some adapters install hooks or plugins; others only add guidance.
- `checkpoint` and `undo` provide Git-based recovery operations. Inspect their output and the project state before relying on a checkpoint.
- `vibe-continuity` is an advisory skill for resuming a project or preparing a handoff. It compares the handoff with the current Git state and distinguishes recorded evidence from unknowns when followed by an agent.

The [rule registry](src/rules/index.ts), [gate](src/framework/gate.ts), and [check implementation](src/check.ts) describe the actual boundaries. They cover selected patterns, not every unsafe action or vulnerability.

`check --push` examines changed files in outgoing commits, including older versions later fixed or deleted. For a new remote ref it inspects all reachable history, including commits that might already exist on the remote, so existing findings can block a new branch. A shallow repository, unreadable history, scanned files over 512 KiB, or a scan exceeding 5,000 commits or 5,000 changed-file entries blocks the push with an incomplete-scan finding; fetch complete history or review the reported limit before proceeding. Binary extensions are skipped and reported in the count. These checks cover selected patterns and do not prove history is secret-free.

Because an old commit can contain a secret that the current tree no longer has, history findings name the rule, path and short commit but never repeat file contents, matched values or rule evidence. That applies to human output, `--json` and the `--explain` prompt: an explanation request sends only the rule, path, commit and a fixed description. Inspect the named commit locally for details. Scans run in batches (one Git process per chunk of files), so a few hundred changed files stay well under a second.

Submodule history is not scanned: a changed submodule blocks the push as incomplete and needs separate inspection. Historical file paths are not checked for live filesystem containment because the current worktree can differ from the committed tree; live path checks still apply to supported tool calls.

After upgrading the CLI, run `vibe-fence init` again in each project to update its managed Git hooks while preserving existing chained hooks. Older pre-push hooks lack the hook-input marker and can block an already-up-to-date push when no upstream is configured; the check fails closed rather than assuming an empty manual input means a safe push.

## What is and is not enforced

| Integration | Current implementation | Limitations |
|---|---|---|
| Claude Code and Cursor | Installer configures a pre-tool gate script. `status --host=claude` reports its configuration state. | These hooks allow the action with a warning if their parser or fence executable is unavailable or the gate errors. The installed script was exercised with host-format input locally; a real host session still needs end-to-end verification in your environment. |
| OpenCode | Installer creates a plugin that invokes the gate. | It can allow actions if the gate is unavailable. Verify the plugin is loaded in your environment. |
| Codex | Installer adds guidance and a project-local pre-tool hook for Bash and `apply_patch` when it can safely merge the configuration. | Codex must trust and load the hook; this implementation has not yet been verified in a real session. Other tool paths may not be covered, and hook failures can allow the action. |
| Hermes and Antigravity | Installer writes guidance and adapter metadata. | Do not assume pre-tool enforcement from adapter metadata alone. |
| Git | Installer installs pre-commit and pre-push hooks into an allowed effective Git hooks directory, chaining existing hooks; `status` reports the effective directory. `init` appends a root `.gitignore` block for `.env`, `.env.local`, `.env.*.local`, and fence state, and warns by filename if a sensitive env file is already tracked. | The fence block overrides earlier root-level exceptions; nested `.gitignore` files can override it, and ignore rules do not untrack files. An unsafe outside hooks redirect is left untouched and reported with repair guidance. Common Git hooks and repo-local configuration can be shared across worktrees. Git hooks do not stop arbitrary tool calls before execution. |

The gate passes unknown tools and only examines a bounded portion of a tool call. Some rules are tree-time checks rather than pre-execution gates; `BILL-01` is a warning, not a spend limit. A clean report is not proof that a project is safe. See [known benchmark gaps](tests/benches/KNOWN-GAPS.md).

Installer path checks are not atomic against concurrent filesystem changes. Some existing installer writes outside the Git hook and `.gitignore` paths do not yet have complete symlink containment; review an untrusted project tree before running `init`.

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

To resume work, ask an agent that supports the installed skill to use `vibe-continuity`, or ask it to read `.agents/skills/vibe-continuity/SKILL.md` directly. The skill is advisory; host discovery and compliance have not been verified across all tools. No handoff is created automatically: choose where to keep one and check whether that path is tracked or ignored before saving private information. Keep credentials and raw secrets out of it. Your host's configured model may process content the agent reads; the workflow does not initiate an additional provider call. You can provide a brief summary in chat instead of having the agent read a handoff.

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
