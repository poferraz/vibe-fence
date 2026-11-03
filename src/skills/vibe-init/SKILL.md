---
name: vibe-init
description: Use when initializing vibe-fence in a project or explaining installation and protection status.
---

# vibe-init — initialize a project

Run the built CLI's `init` command from the project being protected, not from the vibe-fence source checkout. It creates project-local configuration, selected adapter files and, where possible, Git hooks and a local runtime. Existing user files and hooks require care; the installer refuses managed symlinks and avoids writing to unsafe Git hook locations.

After installation, run `./.fence/bin/vibe-fence status --host=codex` (or `claude`, `cursor`, `opencode`) and `./.fence/bin/vibe-fence check`. Configuration is not proof that a host loaded or trusted a hook. Git hooks may be bypassed, and missing dependencies can cause a warning and an unchecked action. `--profile=muse` selects the Claude adapter; it does not establish a Muse Code integration.

The postinstall guard is installed as a file; do not claim it is automatically wired into package scripts. Inspect the output and verify the chosen host in a disposable project. The local integrity baseline detects drift but is writable by the same user or agent as the project; an environment variable is not authentication.

Do not claim a teaching card, CI matrix, provider call, universal protection, or secret scanning tool ran merely because installation completed. Consult the actual output and project tests, and report unverified behavior as unverified.
