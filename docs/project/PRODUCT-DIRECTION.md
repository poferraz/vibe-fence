# Product direction

The intended product is a companion for non-technical people who build with their existing coding tools. It should help them understand risky changes, perform checks, and recover from mistakes without requiring a particular model or editor.

This document records direction, not proof that every feature is implemented. The user-selected plug-in direction supersedes the earlier owned-CLI product choice in `docs/superpowers/specs/2026-10-26-senior-developer-harness-design.md`. Current behavior is established by the source, tests, and the [README](../../README.md), not by an older plan or audit.

## Protection levels

- **Pre-action enforcement:** A host invokes the fence's gate and respects a blocking result. This applies only to configured, working integrations and supported actions.
- **Git-guarded checks:** Configured Git hooks run checks before a commit or push. They do not intercept arbitrary agent actions; a redirected hook path or missing executable can disable them.
- **Advisory guidance:** Instructions and skills help an agent follow the project workflow. They are not a security boundary.

The current Codex adapter installs guidance and metadata but does not itself install a pre-tool interceptor. Claude Code, Cursor, and OpenCode have gate integrations that need verification in the actual host; they can allow actions when the integration fails. Use the [README's integration summary](../../README.md#what-is-and-is-not-enforced) for the current disclosure.

## Principles

1. Deterministic checks make the decision on the surfaces they cover; model-generated explanations are optional and advisory.
2. Report warnings, unknowns, skipped checks, and degraded integrations honestly. Do not claim universal safety or a zero false-positive rate from a finite fixture set.
3. Keep user data, credentials, and spending under the user's control. Paid evaluations require explicit authorization and trustworthy accounting.
4. Preserve reproducible tests, benchmark methods, known gaps, and supporting evidence for maintainers and users. Personal working material may remain locally in ignored project files.
5. Prefer verified, reversible steps and plain-language consequences. A passing test is evidence only for what it actually checks.

See the [project index](INDEX.md), [benchmark scoreboard](BENCH-SCOREBOARD.md), [known gaps](../../tests/benches/KNOWN-GAPS.md), and [research decisions](../research/synthesis/FINAL-v4.md) for supporting context. Historical research and plans remain useful references, but superseded product-direction claims should not override this document.
