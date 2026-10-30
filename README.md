# vibe-fence

A safety companion for people who build software with AI coding agents.

It checks selected dangerous patterns **before** they happen where your tool allows it, catches leaks in what you are about to commit or push, and explains a block in plain language. It is a fence, not a sandbox: it does not make an agent safe, and a clean report is not proof that a project is safe.

> Experimental. Rule coverage is selective and listed below. See [known gaps](tests/benches/KNOWN-GAPS.md) and the [evidence page](docs/EVIDENCE.md).

## Install

The npm package is not published yet. From a clone:

```sh
bun install
bun run build
node dist/cli.js init
```

`init` adds a project `AGENTS.md` router, a `.fence/` state directory, the skills, and the adapters for supported hosts. It installs Git `pre-commit` and `pre-push` hooks when it can find an allowed hooks directory, and prints what it did. Re-run `init` after upgrading to refresh the managed hooks.

## Use

```sh
vibe-fence init                 # set up this project
vibe-fence check                # scan the working tree; exit 1 on a blocking finding
vibe-fence check --staged       # scan what the next commit would contain
vibe-fence check --push         # scan outgoing history before pushing
vibe-fence check --explain      # add a plain-language explanation (needs MUSE_API_KEY)
vibe-fence status               # what is actually configured, per host
vibe-fence checkpoint --action "before refactor"
vibe-fence undo --steps 1
```

`gate --tool <name> --args '<json>'` evaluates one tool call; hosts call it through their hook. `check --json` is machine-readable. Exit codes: 0 clean, 1 blocked, 2 usage error.

### What a block looks like

```
FAIL SEC-01 [block] app/page.tsx
  client-bundle secret hard-block: NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY — public-prefix env values ship in browser JS; …
check: 12 files, 1 fail (1 block), 0 unknown, 0 skipped → BLOCKED
```

Fix the finding, then run `vibe-fence check` again. If a secret is already in history, rotate it first — removing it from the latest commit does not remove it from earlier ones.

## What is and is not enforced

| Host | What is installed | Honest limit |
|---|---|---|
| Claude Code, Cursor | Pre-tool gate script | Allows the action with a warning if the script or fence executable is unavailable; a real session is not verified |
| OpenCode | Gate plugin | Can allow actions when the gate is unavailable; verify it is loaded |
| Codex | Project-local pre-tool hook for Bash and `apply_patch` when config merges safely | Codex must trust the hook; not verified in a real session; other tool paths may be uncovered |
| Hermes, Antigravity | Guidance and adapter metadata | Do not assume pre-tool enforcement |
| Git | `pre-commit` / `pre-push` hooks, chained with existing hooks | Needs an allowed hooks directory; a redirected hooks path is reported, not changed; hooks do not stop arbitrary tool calls |

The gate passes unknown tools and only examines a bounded part of a call. Some rules are tree-time checks rather than pre-execution gates. `BILL-01` warns; it is not a spend limit.

## Rules (11)

`SEC-01` public-prefix secrets · `SEC-02` credential-path reads · `SEC-03` env files and live tokens · `NET-01` pipe-to-shell · `FS-01` path containment · `CMD-01` destructive commands · `SUP-01` install-script payloads · `GIT-01` force-push and hard reset · `DB-01` destructive SQL · `BILL-01` unbounded paid loops (warn) · `PRV-09` personal data in fixtures.

Severity depends on the app profile (local / shared / public). Rule behaviour, not this list, is the authority: see [`src/rules/`](src/rules/) and its tests.

## Evidence and limits

- [Evidence page](docs/EVIDENCE.md): revision, the five gate commands and their results, what each suite supports, and the limits.
- [Evaluation ladder](docs/EVALUATION-LADDER.md): each retained suite's claim, audience, failure decision and blind spots.
- [Known gaps](tests/benches/KNOWN-GAPS.md): attack shapes not caught, with a disposition.
- [Claim inventory](docs/research/CLAIMS.md): which statements are supported, project decisions, or still unverified.

**Not verified today:** real host sessions for any agent, end-to-end `npx` install (package unpublished), Windows, and any live model behaviour. macOS with Bun is what the results were produced on.

## Roadmap

1. Verify one real host session end-to-end and publish what it does and does not block.
2. Keep each public claim linked to a reproducible check and a revision.
3. Publish to npm once a clean install from the registry is verified.

## Security

Report a vulnerability using the process in [SECURITY.md](SECURITY.md). Use fabricated values in a reproducer; never send a real secret.

## Development

`src/` is the only editable source; `dist/` is generated. The full gate — `bunx --no-install tsc --noEmit`, `bun run build`, `bun run validate`, `bun test`, `bun run eval` — must pass before a change is proposed. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/MAINTAINER.md](docs/MAINTAINER.md).

MIT. Experimental; no warranty.
