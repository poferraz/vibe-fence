---
name: vibe-guard
description: Use when interpreting vibe-fence checks or reviewing project guardrails before a change or release.
---

# vibe-guard — understand and check the available safeguards

Run `./.fence/bin/vibe-fence check` from the installed project. Use `check --staged` for staged Git content and `check --push` for outgoing history. Exit 1 means a blocking finding; exit 2 means an incomplete scan or invalid command; inspect the project-relative location locally. Unknown results are not passes. These checks are bounded and exclude some inputs; they do not prove the project safe.

The shipped registry has 11 deterministic rules. The live tool gate applies only a subset to recognized tool calls; other rules run in scans. Host hook configuration does not prove a host loaded or enforced it. Run `./.fence/bin/vibe-fence status --host=codex` (or `claude`, `cursor`, `opencode`) and verify the selected host separately. Missing hooks or executables can cause fail-open behavior with a warning.

Local human and JSON reports use fixed summaries and project-relative paths; a filename itself may be sensitive. Do not paste secret values into logs. If a credential may have leaked, stop sharing it and follow the provider's rotation or revocation procedure; removing a file does not erase Git history.

Explanations are fixed local text and require no model or connection. A passing check applies only to the content it inspected. Git hooks inspect staged content or outgoing history, not unrelated worktree files.

Gitleaks, semgrep, CSP, RLS, dependency auditing, profile-dependent severity, and remote policy checks are **not** established by this skill or the default check. Use separately installed tools and verify their results when those checks are needed. Never claim they ran solely because a configuration or recommendation exists.

The local SHA-256 attestation detects drift against a workspace-local baseline. A user or agent able to edit the workspace can also change the verifier or re-attest files; the token is not an independent security boundary. Review unexpected changes and restore or re-attest deliberately.
