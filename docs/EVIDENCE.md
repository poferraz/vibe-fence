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
