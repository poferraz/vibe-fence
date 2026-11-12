---
name: vibe-init
description: Use when setting up vibe-fence in a project or explaining which checks are available.
---

# Set up this coding tool

Run `vibe-fence init --host=<tool>` in the project, selecting one of `codex`, `claude`, `cursor`, `opencode`, `antigravity`, or `hermes`. Use `--host=none` for Git checks alone. Omit the flag only when exactly one tool is configured in the project. Preserve existing instructions and hooks.

Setup installs the local runtime, Git checks where available, and only the selected integration. It performs a local hook diagnostic automatically. The receipt distinguishes a passed diagnostic from actual editor execution; a failed diagnostic needs repair. Antigravity and Hermes provide guidance only.

Follow the host's project trust or restart requirement. Installing files cannot bypass host trust. There is no required model, API key, provider account, or separate doctor step. Optional `doctor` can rerun diagnostics.

Commits check staged content; pushes check outgoing history. Unrelated drafts are left for an explicit `check`. Git hooks can be bypassed or become unavailable; say when an action was unchecked. The local integrity baseline detects drift but is writable by the same user or agent.
