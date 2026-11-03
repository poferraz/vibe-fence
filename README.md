# vibe-fence

vibe-fence adds local checks to coding-agent workflows and Git projects. It looks for selected risky patterns in project files, staged changes, outgoing Git history, and supported agent tool calls. It can help catch mistakes, but it is not a sandbox and cannot guarantee a project is safe.

## Get started

You need Node.js 20 or newer, Git, and Bun to build this source checkout. Run the installer in the project you want to check, not in the vibe-fence checkout:

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

Replace `codex` with `claude`, `cursor`, or `opencode` for the host you use. The installer also provides Antigravity and Hermes configurations with different capabilities; see their adapter source before relying on them. The `--profile=muse` preset selects the Claude adapter; it does not install a Muse Code integration.

The installer copies a runtime into the target project so its managed hooks can find vibe-fence after the original command exits. Run `init` again to update it. An explicit `FENCE_BIN` override takes precedence. The runtime and its local integrity records can be changed by anyone who can write the project; they are not an independent security boundary.

## Check a synthetic example

In a **disposable project**, put this line in `example.ts`:

```ts
const k = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
```

Run `./.fence/bin/vibe-fence check`. The example contains no real credential. The checker should report an SEC-01 finding; remove the line and run it again. Local reports can include project-relative paths, so review them before sharing.

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

`checkpoint` and `undo` are available for local recovery; see `--help`. A checkpoint may commit sensitive work-in-progress into local Git history, even if that content is removed later. Inspect changes before creating one.

## What the integrations mean

`configured-unverified` in `status` means configuration exists; it does **not** mean the host has loaded it or blocked an action. Git hooks depend on Git's effective hooks directory and can be bypassed. Some host hooks warn and allow an action if the fence is unavailable. Verify the integration in a disposable project before relying on it, and consult [the evidence and limitations](docs/EVIDENCE.md) for what has actually been tested.

Optional `--explain` requests use Meta Muse Spark when configured with `MUSE_API_KEY`. Requests contain fixed rule categories and severity, not source contents, filenames, raw tool arguments, or dynamic rule reasons. The model's response is advisory and does not change a check's decision. Network use is opt-in and may incur provider charges.

## Develop and verify

`src/` is the source of truth; generate `dist/` with the build. For the repository gate, run in this order:

```sh
bunx --no-install tsc --noEmit
bun run build
bun run validate
bun test
bun run eval
```

The [maintainer checklist](docs/MAINTAINER.md) describes release checks. The [documentation index](docs/fence/INDEX.md), [evidence](docs/EVIDENCE.md) provide implementation details and verification limits. Registry publication is not established by this checkout; use the source instructions above until a release is verified.

## License

[MIT](LICENSE).

## Build provenance

[What predates the event and what was built during it](docs/BUILD-PROVENANCE.md).
