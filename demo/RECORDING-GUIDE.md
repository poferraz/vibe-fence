# Record a three-minute manual-scan demo

This walkthrough uses a disposable repository and a fabricated variable name. It demonstrates a local scan and Git hook; it does **not** demonstrate a coding host intercepting a tool call. It uses the checked-out source build, not a published npm version. Record from the reviewed candidate only; the current checkout contains uncommitted work.

Before recording, use Node 20+, Git, and Bun. From the vibe-fence checkout, build and save the source path:

```sh
bun run build
VF_SOURCE="$PWD"
```

Create a new scratch project. The hooks-path setting applies only to this disposable repository, the commit identity applies only to the shown commands, and the example contains no credential:

```sh
VF_DEMO="$(mktemp -d /tmp/vibe-fence-demo.XXXXXX)"
cd "$VF_DEMO"
git init -q
git config --local core.hooksPath .git/hooks
node "$VF_SOURCE/dist/cli.js" init --adapters=codex
./.fence/bin/vibe-fence status --host=codex
```

The status should say `configured-unverified`: configuration exists, but a real Codex session has not been demonstrated. Explain that hook failures can allow an action with a warning. If the installer reports a degraded runtime or hook, stop and resolve that before recording.

Create and stage the fabricated finding:

```sh
printf '%s\n' 'const key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;' > example.ts
git add example.ts
./.fence/bin/vibe-fence check --staged
```

Expected: `SEC-01`, `example.ts:1`, a static `Fix:` instruction, `BLOCKED`, and exit 1. This is a **manual staged scan**, not a host interception. To show the Git hook, attempt this local commit with a synthetic identity:

```sh
git -c user.name='Demo User' -c user.email='demo@example.invalid' -c commit.gpgsign=false commit -m 'Demo change'
```

The commit should be blocked. If it succeeds or says the check was skipped, stop: do not present this take as automatic protection.

If you separately decide to authorize a real, potentially billable Meta API request, make sure `MUSE_API_KEY` is set outside the recording and the key itself is never displayed. With the same synthetic file still staged, run this command **once**:

```sh
MUSE_MODEL_COMPANION=muse-spark-1.3 ./.fence/bin/vibe-fence check --staged --explain
```

The check still exits 1 for the finding. The optional request sends the fixed rule category and severity, requests no stored response, limits generated output to 512 tokens, and times out locally after 15 seconds. A timeout does not guarantee the provider will not bill a dispatched request. Review the explanation before using it; it is advisory. If the request fails, show the failure honestly or use the no-live-call narration. Do not paste a key into the recording or run this command without deciding to incur any charge.

Replace the example with benign content, stage it, and rerun:

```sh
printf '%s\n' 'export const message = "hello";' > example.ts
git add example.ts
./.fence/bin/vibe-fence check --staged
git -c user.name='Demo User' -c user.email='demo@example.invalid' -c commit.gpgsign=false commit -m 'Demo change'
./.fence/bin/vibe-fence check --push --all
```

Expected: the staged scan says `OK`, the commit succeeds, and the bounded all-ref history scan reports its result. Git history and scan boundaries remain limited; a clean report is not proof that the project is safe. A checkpoint is an undo point and can contain sensitive work, so it is not needed in this demonstration.

## Show the already-recorded Muse response

A real Muse Spark 1.3 response to a synthetic SEC-01 finding is saved locally. To show it without another model request, run:

```sh
cat "$VF_SOURCE/.fence/private/muse-demo-display.txt"
```

Label it **recorded response to a synthetic finding**. The earlier call exercised the explanation function directly; it did not demonstrate an agent host or a live `--explain` command during this recording. A summary and request settings are in [evaluation evidence](../docs/EVIDENCE.md); the private artifact is not part of the public package. Review the text before showing it. If the file is missing, use the no-live-response narration rather than fabricating a result.

## Suggested narration and timing

- **0:00–0:20:** State the user's problem. Identify the pre-event scaffold and the post-kickoff work using the reviewed [provenance draft](../docs/BUILD-PROVENANCE.md).
- **0:20–0:45:** Show the local installation and status. Say "configured, host execution unverified."
- **0:45–1:35:** Show the synthetic staged check and blocked local commit. Describe exactly what happened; the host interception was not tested.
- **1:35–2:10:** Explain that Muse Spark can provide an opt-in advisory explanation. Show the labeled, previously recorded synthetic response if desired; do not present it as a live call or a real host interception.
- **2:10–2:40:** Show the benign correction, successful staged scan, and local commit.
- **2:40–3:00:** Show the reviewed public repository and attribution once available. State that checks are bounded and are not a sandbox.

Use large text, readable contrast, captions, and a stable 16:9 crop. Hide personal paths and all keys. The model request sends fixed rule categories and severity; it is optional and does not change the deterministic decision. Local reports can show project-relative filenames. Before sharing the recording, verify its duration, sound, captions, and links. Do not describe a local draft as a submitted entry.

## Optional narration to rehearse

> When I use a coding agent, I want help noticing risky changes before I commit them. Vibe-fence is a local companion that checks selected patterns; it is not a sandbox and cannot guarantee that a project is safe.
>
> I built on an existing scaffold. The rule engine, Git checks, optional explanation path, and subsequent hardening include work done after the event kickoff. The provenance page separates the earlier foundation from the later work.
>
> Here I install the built tool into a disposable project. Status says the Codex configuration is present, but it is unverified in a real host session. This demo uses a manual check and Git, so I am not claiming an agent hook intercepted anything.
>
> I stage an example containing a fabricated public environment-variable reference. The staged check flags SEC-01. When I try the local commit, the Git hook checks the staged content and blocks this example.
>
> Vibe-fence can optionally ask Meta's Muse Spark to explain a finding. The model does not decide whether a check blocks. This explanation is a real response to a synthetic finding recorded earlier; it is not a live call during this take.
>
> I replace the example with benign code, stage it, and check again. This time the check is clear and the commit succeeds. These are bounded checks on selected patterns: excluded files, unknown results, unavailable hooks, and unverified hosts still require attention.
>
> The repository and provenance describe what was built and what has actually been tested.

Speak naturally; timing depends on delivery. Verify the finished recording stays within the portal's actual limit.
