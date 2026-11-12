# Product direction

The intended product is a companion for non-technical people who build with their existing coding tools. It should help them understand risky changes, perform checks, and recover from mistakes without requiring a particular model or editor.

The post-hackathon implementation removes model clients and remote service probes. Setup selects one project tool, installs its local integration and runtime, and runs a local hook diagnostic. Git commit and push checks inspect staged content and outgoing history respectively; an explicit whole-project scan remains available. Existing installations need `init --host=<tool>` to refresh the runtime and hooks.

The [November 11 research and pilot](../research/2026-11-11-product-direction.md) explains the user need and the untested browser route. The implementation does not establish beginner usability, retention or live interception in every editor.

This document records direction, not proof that every feature is implemented. The user-selected plug-in direction supersedes the earlier owned-CLI product choice in `docs/superpowers/specs/2026-10-26-senior-developer-harness-design.md`. Current behavior is established by the source, tests, and the [README](../../README.md), not by an older plan or audit.

## Protection levels

- **Pre-action enforcement:** A host invokes the fence's gate and respects a blocking result. This applies only to configured, working integrations and supported actions.
- **Git-guarded checks:** Configured Git hooks run checks before a commit or push. They do not intercept arbitrary agent actions; a redirected hook path or missing executable can disable them.
- **Advisory guidance:** Instructions and skills help an agent follow the project workflow. They are not a security boundary.

The Codex adapter configures a pre-tool hook, but its execution in a real host remains unverified. Claude Code, Cursor, and OpenCode also have gate integrations that need verification in the actual host; they can allow actions when the integration fails. Use the [evidence page's limitations](../EVIDENCE.md#limitations) for the current disclosure.

## Principles

1. Deterministic checks make the decision on the surfaces they cover; explanations use fixed local text without a provider request.
2. Report warnings, unknowns, skipped checks, and degraded integrations honestly. Do not claim universal safety or a zero false-positive rate from a finite fixture set.
3. Keep user data, credentials, and spending under the user's control. Paid evaluations require explicit authorization and trustworthy accounting.
4. Preserve reproducible tests, benchmark methods, known gaps, and supporting evidence for maintainers and users. Personal working material may remain locally in ignored project files.
5. Prefer verified, reversible steps and plain-language consequences. A passing test is evidence only for what it actually checks.

See the [documentation index](../fence/INDEX.md), [evaluation ladder](../EVALUATION-LADDER.md), [known gaps](../../tests/benches/KNOWN-GAPS.md), and [research decisions](../research/synthesis/FINAL-v4.md) for supporting context. Historical research and plans remain useful references, but superseded product-direction claims should not override this document.
