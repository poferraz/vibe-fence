# Record the Muse Code before-and-after demo

The story: a beginner asks Muse Code to put a secret-shaped environment variable into a checkout page. Without Vibe-fence, Muse makes the requested edit. After Vibe-fence is installed and Muse is restarted, the same request is blocked and Muse can explain what to do instead.

This is a **scripted, synthetic reenactment**. The variable name is fictional and no actual key is placed in the project. The `$100` card is an illustration of a possible cost, not a real bill or an observed breach. The guard catches selected patterns; it is not a sandbox and cannot guarantee safety.

## People and equipment

- You can play both the beginner and narrator. A friend can play the beginner if that makes the story feel more natural; no actor or customer claim is needed.
- Use one Mac, a microphone or headset, and a quiet room. Muse Code, Git, Node 20.6+ and npm should be installed.
- Use your existing Meta login or API key. Sign in or set up the key **before** recording; never show or paste a real credential on screen.
- The demo launcher uses Muse Spark 1.3 and contributor mode off. It disables Muse's shell tool for this synthetic rehearsal so the comparison exercises its file editor. It explicitly trusts only the disposable demo workspace for each launch.

## 1. Prepare the disposable app, off camera

1. Open Terminal. Go to the reviewed Vibe-fence source checkout and save its location:

   ```sh
   cd /path/to/the/reviewed/vibe-fence-checkout
   VF_REPO="$PWD"
   ```

2. Create the fictional checkout project. This command creates a **new temporary directory**, initializes Git there, and makes a baseline commit containing only a tiny demo page:

   ```sh
   VF_DEMO=$(sh "$VF_REPO/demo/muse-demo/setup.sh" | tail -1)
   cd "$VF_DEMO"
   ```

3. If Muse is already signed in, launch it with `sh "$VF_REPO/demo/muse-demo/launch.sh"`. Otherwise, set `VF_KEYS` to the absolute path of your existing `.env` file **off camera**, then launch it with `sh "$VF_REPO/demo/muse-demo/launch.sh" "$VF_KEYS"`. The launcher passes the key through the process environment, without printing it or saving it to the demo project. Node's `--env-file` needs Node 20.6 or newer. Do not type `env`, `cat .env`, or paste the key.
4. Confirm Muse responds. Exit with `/exit` and confirm the exit. The project starts without Vibe-fence installed. If you already rehearsed the protected half, make a **new** demo project with step 2 for a clean take.
5. Open this guide and the public repository in separate windows. Optionally open `demo/muse-demo/simulated-charge.svg` in Preview. The large label says it is a simulation; do not crop that label away.
6. Increase terminal text size, hide personal tabs and notifications, and keep only the demo project, this guide and the repository visible. Test your microphone.

## 2. The exact message for both attempts

Copy this message once before recording. Paste it into Muse for **both** attempts; the wording stays the same. It contains a variable name, not a real key.

```text
This is a simulation with no real key. Please add this exact line above the export in app/page.tsx: const paymentKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY; // example payment route
Use a file editing tool, not the shell. If blocked, do not retry; explain why.
```

This exact message was rehearsed with Muse Code 1.4.14 and Muse Spark 1.3: the unprotected session edited the page; a fresh trusted session after installation received a SEC-01 block and left the page unchanged. Model output and timing can vary. If Muse refuses the first request on its own, say so honestly or retry a fresh take; never stage a fake block or claim a real leak.

## 3. Screen-recording steps on a Mac

1. Press **Shift–Command–5**. In **Options**, choose your microphone and a save location you can find. Choose **Record Entire Screen** or select a recording area that includes the whole terminal and the simulation label.
2. Start recording. Count to two, then begin speaking. Keep the terminal large enough that the file name and result can be read.
3. The beginner performs the actions in the shot list below; the narrator can be the same person speaking naturally. Pause while Muse is thinking. You can trim pauses later, but do not replace the real result with a staged one.
4. Stop using the screen-recording control in the menu bar. Open the recording, check sound and legibility, and trim the start, end and long waiting periods. Keep it under three minutes.

## 4. Shot list and words to say

| Time | What the beginner does and what the viewer sees | Suggested words |
|---|---|---|
| 0:00–0:15 | Show the title and the terminal in the disposable demo folder. | “I am building a small checkout with an AI coding assistant. I do not really know which parts are safe to put in a browser.” |
| 0:15–0:45 | Run `sh "$VF_REPO/demo/muse-demo/launch.sh" "$VF_KEYS"` or omit `"$VF_KEYS"` when using an existing login. Paste the exact message above. Approve the synthetic edit if Muse asks. After Muse finishes, type `/exit`, confirm, and run `cat app/page.tsx`. The risky reference should be visible. | “I ask Muse Code to put my payment variable on the page. In this unprotected take, it makes the edit. This is a fictional variable and contains no real key.” |
| 0:45–1:00 | Briefly show the clearly labelled simulation card, then the Vibe-fence repository. | “If a real secret were exposed, someone could misuse it. This $100 amount is only an illustration. I found Vibe-fence and want a second check.” |
| 1:00–1:25 | Back in the disposable project, run `git restore -- app/page.tsx` to reset the demo page. Install Vibe-fence with the verified command below, then run `node ./.fence/bin/vibe-fence.cjs doctor --host=muse`. | “I reset the fictional example and install Vibe-fence into this project. It configures a Muse Code hook and reports what still needs verification.” |
| 1:25–2:05 | Start a **new** Muse session with the same launcher. Paste the **same** message. Show the SEC-01 block and Muse's explanation. | “I make the same request again. This time Vibe-fence stops the file edit before it happens and tells Muse why. Muse explains that a real secret belongs on the server, not in a browser-visible variable.” |
| 2:05–2:30 | Exit Muse and run `cat app/page.tsx`. The original page should still be there without the risky line. | “The requested edit did not land. Vibe-fence made the deterministic decision locally; Muse helps me understand the warning.” |
| 2:30–2:55 | Show the README's hackathon scope and evidence links. | “I started with an earlier personal scaffold. After the reported kickoff I expanded the checks, and on November 4 I built this Muse Code integration and its tests. These checks are bounded; they do not catch every risk.” |

Speak at your normal pace. Leave the model's visible work on screen; trim waiting, not evidence. Check the recording's actual duration before upload.

## 5. Installation command for the take

Use the **published, verified** package once the new release is available:

```sh
npx --yes vibe-fence@0.4.0 init --profile=muse
node ./.fence/bin/vibe-fence.cjs doctor --host=muse
```

Until that version is published and verified, use the built source candidate instead:

```sh
node "$VF_REPO/dist/cli.js" init --profile=muse
node ./.fence/bin/vibe-fence.cjs doctor --host=muse
```

The source command installs the same project-local runtime from the reviewed candidate. Do not claim an npm version is available until the registry confirms it. If the doctor says `degraded`, a hook warning appears, or the edit succeeds after installation, stop the take and troubleshoot rather than describing it as blocked.

## 6. After recording

1. Watch the whole video. Verify the first edit, the actual block, the unchanged page, the fictional `$100` label, sound, captions, and no visible secrets.
2. Upload it to the video host required by the submission form. Open the link in a private browser window to verify a judge can play it.
3. In the Cerebral Valley form, use the public repository URL, the final verified candidate commit, the video link, and the project description. Explicitly separate the pre-event scaffold from the hackathon work.
4. Submit before November 4, 9:00 p.m. Eastern / 6:00 p.m. Vancouver time, and verify the portal shows the submitted state.
