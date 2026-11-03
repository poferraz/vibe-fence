# vibe-fence

vibe-fence adds local checks to coding-agent workflows and Git projects. It looks for selected risky patterns in project files, staged changes, outgoing Git history, and supported agent tool calls. It can help catch mistakes, but it is not a sandbox and cannot guarantee a project is safe.

The [build provenance](docs/BUILD-PROVENANCE.md) separates the existing scaffold from later work.

## Get started

The November 3 audit found that the published `vibe-fence@0.2.0` package lacks the durable project runtime and can skip Git checks after `npx` exits. Avoid `npx vibe-fence@0.2.0`; use the source build below until a newer release is published and verified.

You need Node.js 20 or newer, Git, and Bun to build this source checkout. Claude Code and Cursor hooks also require `jq` on your PATH. Run the installer in the project you want to check, not in the vibe-fence checkout:

```sh
# In the vibe-fence source checkout
bun install
bun run build
FENCE_SOURCE="$PWD"

# In your project
cd /path/to/your/project
node "$FENCE_SOURCE/dist/cli.js" init --adapters=codex
./.fence/bin/vibe-fence status --host=codex
./.fence/bin/vibe-fence check
```

Replace `codex` with `claude`, `cursor`, or `opencode` for the host you use. The installer also provides Antigravity and Hermes configurations with different capabilities; see [host integration details](docs/project/PRODUCT-DIRECTION.md). The `--profile=muse` preset selects the Claude adapter; it does not install a Muse Code integration.

The installer copies a runtime into the target project so its managed hooks can find vibe-fence after the original command exits. Run `init` again to update it. An explicit `FENCE_BIN` override takes precedence. The runtime and its local integrity records can be changed by anyone who can write the project; they are not an independent security boundary.

## Check a synthetic example

In a **disposable project**, put this line in `example.ts`:

```ts
const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
```

Run `./.fence/bin/vibe-fence check`. The example contains no real credential. The checker should report an SEC-01 finding, its file and line, and a `Fix:` instruction to move the secret server-side. Remove the line and run the check again. Local reports can include project-relative paths, so review them before sharing.

## Commands

Run these from an initialized project:

```sh
./.fence/bin/vibe-fence status --host=codex
./.fence/bin/vibe-fence check
./.fence/bin/vibe-fence check --staged
./.fence/bin/vibe-fence check --push
./.fence/bin/vibe-fence check --json
./.fence/bin/vibe-fence --help
```

`check` exits with status 1 when it finds a blocking issue or cannot complete an eligible scan. An incomplete scan is not a clean result. Unknown rule results require review. Checks are bounded: unsupported inputs, excluded binaries, and other limitations mean a clear result is not proof that no issue exists.

`check --push` inspects outgoing history, including older versions of files. Shallow history, unreadable data, a changed submodule, and scan limits can make this check incomplete and block a push. A new remote ref may cause all reachable history to be inspected. Findings identify the rule, path, and commit without printing historical content.

`checkpoint` saves a local Git commit without running the usual commit hooks. It may commit sensitive work-in-progress into local Git history, even if that content is removed later. `undo` uses `git reset --soft` for unpushed checkpoints at the tip, leaving your edits staged; pushed or interleaved checkpoints use a revert instead. See `--help` and inspect changes before creating a checkpoint.

### If a secret was committed or exposed

1. Revoke or rotate the credential with its provider immediately.
2. Remove it from source and move any replacement to a Git-ignored, server-only location.
3. Before pushing, run `./.fence/bin/vibe-fence check --push --all` to inspect reachable local refs and the current HEAD within the scanner's limits.

Deleting a file or running `undo` does not erase a secret from existing Git history. The check cannot detect every credential; review affected history and follow your provider's incident guidance.

## What the integrations mean

`configured-unverified` in `status` means configuration exists; it does **not** mean the host has loaded it or blocked an action. Git hooks depend on Git's effective hooks directory and can be bypassed. Some host hooks warn and allow an action if the fence is unavailable. Verify the integration in a disposable project before relying on it, and consult [the evidence and limitations](docs/EVIDENCE.md) for what has actually been tested.

| State | Meaning |
|---|---|
| `configured-unverified` | Configuration is present, but execution has not been verified. |
| `advisory` | Guidance may be available, but it does not block tool calls. |
| `degraded` | A required hook, executable, or configuration is missing or changed. |
| `inactive` | The expected Git hooks are not active in the effective hooks directory. |
| `unverified` | There is not enough information to determine the host's protection. |

Optional `--explain` requests use Meta Muse Spark when configured with `MUSE_API_KEY`. Requests contain fixed rule categories and severity, not source contents, filenames, raw tool arguments, or dynamic rule reasons. The model's response is advisory and does not change a check's decision. Network use is opt-in and may incur provider charges.

## Remove vibe-fence

Back up any project-specific files in `.fence/` and review the following before removing anything; some files may also contain your own settings.

1. Run `git rev-parse --git-path hooks` to find the effective Git hooks directory. For `pre-commit` and `pre-push`, remove a script only after confirming it contains `# vibe-fence managed hook`. If a corresponding `.pre-fence` backup exists, restore that original hook under its normal name. Do not change a shared `core.hooksPath` without reviewing its effect on other worktrees.
2. Remove the managed entries from `.codex/hooks.json`, `.claude/settings.json`, and `.cursor/hooks.json` while preserving other entries. Remove the matching managed scripts `.codex/hooks/fence-gate.cjs`, `.claude/hooks/fence-gate.sh`, and `.cursor/hooks/fence-gate.sh`, and the managed `.opencode/plugins/fence-guard.js` after reviewing them.
3. Remove the fence-managed block from `AGENTS.md` and any copied fence skills or adapter guidance you no longer want. Preserve unrelated instructions and skills.
4. After backing up anything you need, remove the project-local `.fence/` directory. Review `.gitignore` separately; its environment-file protections may still be useful.

Removing the local runtime does not remove credentials from Git history or change previously shared data.

## Develop and verify

`src/` is the source of truth; generate `dist/` with the build. For the repository gate, run in this order:

```sh
bunx --no-install tsc --noEmit
bun run build
bun run validate
bun test
bun run eval
```

The [maintainer checklist](docs/MAINTAINER.md) describes release checks. The [documentation index](docs/fence/INDEX.md), [evidence](docs/EVIDENCE.md), and [build provenance](docs/BUILD-PROVENANCE.md) provide implementation details and verification limits. Registry publication is not established by this checkout; use the source instructions above until a release is verified.

## License

[MIT](LICENSE).
