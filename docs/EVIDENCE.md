# Current local-only implementation (0.5.0)

The post-hackathon build removes model requests and remote database connections. Explanations use local fixed text. One `init --host=<tool>` installs the selected integration, local runtime and Git hooks, then performs the available local hook diagnostic. Unknown or ambiguous project detection asks for a tool before writing files. Diagnostics do not prove that a coding tool loaded its hook.

Managed commits scan staged blobs only; pushes scan outgoing history only. Explicit `check` still scans the working project. Regression tests cover unrelated unsafe drafts remaining uncommitted, staged leaks with a cleaned worktree, and leaked-then-removed content in outgoing history.

The records below describe earlier candidates, removed features and historical versions. They are retained as provenance, not claims about the new runtime. November 11 verification is recorded immediately below.

## 0.5.0 release candidate

The isolated public release candidate is based on main `08e5099` and retains the shared v0.4.0 secret-detection, relative-path and uninstall hardening while removing Muse and remote-service integrations. A frozen-lockfile install, typecheck, build and validation passed. The fresh full run on macOS with Node 26.13.0 passed **474 tests**, with **four optional PostgreSQL-dependent skips and zero failures**, across 49 files. Offline evaluation passed with **40 true positives, 37 true negatives, zero false positives/negatives, and one unknown**. All 71 earlier corpus cases retained their outcomes; six added cases exercise the restored security behavior. These finite fixtures do not establish a general detection rate.

Generated CLI SHA-256: `aa7b5ea22293e67963599c8bc62090625f449d4751cd858d624e8985210333f2`. Earlier November 11 results below describe the preceding working build, not this release candidate. GitHub release checks and npm publication are tracked separately; the local run does not establish live editor interception or every platform.

## November 11 working-tree verification

On the uncommitted working tree based on `5189213`, typecheck, source build, validation and the full suite passed: **466 tests passed, four PostgreSQL-dependent skips, zero failures**, across 47 files. The offline evaluation had 36 true positives, 35 true negatives, zero false positives or false negatives, and one unknown, with no regression against the recorded baseline. This is finite fixture evidence, not a general detection rate or a tested public release. The generated Node CLI SHA-256 was `41c9c07927fca5d1f831283989ccd780d5fe2885943d95cdc50bcd8d8ecb3d3d`.

A separate offline npm tarball was unpacked into a temporary directory and run using Node 26.12.0, with fetch and Node network APIs replaced by denying functions inherited by child processes. In a disposable Git project with spaces in its path, one `init --host=codex` installed only Codex, passed the local script diagnostic, and produced a passing integrity baseline. A benign staged change committed with both unsafe unstaged and untracked drafts present. A staged synthetic unsafe blob was rejected even after its working file was cleaned. The corrected commit and a push to a local bare repository succeeded. Uninstall removed the managed Git hook and preserved unrelated drafts. No real key was used; no network attempt was observed, and retired model/probe modules were absent from the tarball.

Upgrade tests preserve custom settings, refresh only unchanged journal-managed skills, reject unusable selected integrations or runtimes without claiming success, and keep unused editor paths out of the selected integrity scope. Native Claude instruction imports are tested locally; documented hook formats were checked separately. None of these checks establishes that Codex, Claude Code, Cursor or OpenCode loaded the hook in an actual editor session. The normal host restart/trust step remains, and platform coverage here is one macOS machine. No npm publication or remote CI run is implied.

# Evaluation evidence

## Muse Code and Meta model rehearsal

A synthetic before-and-after rehearsal on a 0.4.0 working candidate used Muse Code 1.4.14 with Muse Spark 1.3. Before the Muse hook was installed, a requested edit added a fictional public-secret-shaped reference. After installation and a fresh trusted session, the hook blocked that same edit and the file remained unchanged. No real credential was used. A separate opt-in Spark explanation of a synthetic finding was also exercised.

These observations cover a particular host, tool, and input. They do not establish coverage of every host action or unsafe input. Project trust and a fresh session are required for Muse to load its hook.

## Verification

The earlier 0.4.0 working candidate passed typecheck, build, validation, evaluation, package inspection, and 505 tests, with four PostgreSQL-dependent cases skipped. The evaluation uses a small synthetic corpus; its results are not general-world detection rates. The repository configures cross-platform checks; see [GitHub Actions](https://github.com/poferraz/vibe-fence/actions/workflows/ci.yml).

Reproduce the local gates with:

```sh
bun install --frozen-lockfile
bunx --no-install tsc --noEmit
bun run build
bun run validate
bun test
bun run eval
bun pm pack --dry-run
```

The [reviewer guide](REVIEW.md) explains how to exercise the source-built CLI and Muse hook in a disposable project. The [evaluation ladder](EVALUATION-LADDER.md) describes what the retained fixture suites do and do not show.

## Limits

- Checks recognize bounded patterns; a clean result is not a security guarantee, and the tool is not a sandbox.
- Host enforcement depends on the host loading and invoking the configured hook. Some integrations may warn and allow an action when the gate is unavailable; Git hooks can be bypassed.
- The Muse find/replace path inspects affected lines and widens inspection when an edit can alter multiline delimiters. If the existing file cannot be inspected safely, it blocks that edit rather than reporting it clean.
- The optional Meta explanation is advisory. The local rule makes the block decision, and its separate request uses fixed finding categories and severity rather than source contents, filenames, or raw tool arguments.
- [Build provenance](BUILD-PROVENANCE.md) distinguishes earlier work from hackathon work. It does not determine event eligibility.

Report sensitive vulnerabilities through [the security policy](../SECURITY.md), using a fabricated reproducer rather than real secrets.
