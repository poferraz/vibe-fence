# Demo cues — init → block → explain → checkpoint → undo

2-file leak app (`leak-app/`) + beats for the 3-minute video
([DEMO-SCRIPT.md](../research/synthesis/DEMO-SCRIPT.md)) and live demos.
Every beat below is verified by an automated proof beat or gate — the cues
only stage them for camera.

**Binary:** `npx vibe-fence` below means the published path (human-owned
`v0.2.0` publish). Before publish, substitute the packed CLI from this repo:
`node <repo>/dist/cli.js` (rebuild with `bun run build` first).

**Never run `init` inside this repo** — it writes `.fence/` + adapter configs
into the target tree. Always copy the fixture to scratch first (step 0).

## 0. Stage (off camera)

```sh
cp -r demo/leak-app /tmp/vf-demo && cd /tmp/vf-demo
git init -q && git add -A && git commit -qm base
```

Committed state is clean on purpose: `config.env` carries
`NEXT_PUBLIC_API_TOKEN=your-token-here` (placeholder → the fence passes it),
and `page.tsx` reads only the benign `NEXT_PUBLIC_APP_NAME`. The repo
self-scan stays green with the fixture committed (R2).

The file is deliberately named `config.env`, not `.env`: global gitignores
almost universally hide the `.env` basename (this machine's included), which
would make the leak invisible to `git add` and the checkpoint beats. The
fence reads the pairing, not the filename, so the block beat is identical.

## 1. Init (on camera, timer visible — must read <3s)

```sh
npx vibe-fence init
```

Expect the receipt line. (Pre-publish: `node <repo>/dist/cli.js init`.)

## 2. Activate the leak (on camera)

```sh
openssl rand -hex 12   # 24 hex chars — copy the output
```

Replace `your-token-here` in `config.env` with the pasted hex. Any
non-placeholder value fires; hex looks live on camera. Nothing
secret-shaped is ever committed — the key exists only in `/tmp/vf-demo`.

## 3. Block (on camera)

```sh
npx vibe-fence check; echo "exit=$?"
```

Expect `FAIL SEC-01` (client-bundle secret hard-block), exit 1.
Proof beat ① covers this shape (leak stopped, tree scan + live gate agree).

## 4. Explain (on camera)

```sh
npx vibe-fence check --explain
```

With `MUSE_API_KEY`: one budget-capped Muse Spark call narrates the block
with a one-line fix; request ID lands in `.fence/events.ndjson`.
Without a key: stderr note, exits unchanged — say so on camera, keep going.

## 5. Checkpoint (on camera)

```sh
npx vibe-fence checkpoint --action "leaky WIP"
```

Expect: the checkpoint LANDS (checkpoints never gate — D7) with a loud
stderr warn + `blockingFindings` in `.fence/events.ndjson`: the undo point
holds blocks. Show `git log --oneline` (the `checkpoint:` commit).

## 6. Fix (on camera)

Restore `your-token-here` in `config.env`, then:

```sh
npx vibe-fence check; echo "exit=$?"
npx vibe-fence checkpoint --action "fix: token back to placeholder"
```

Expect `OK`, exit 0, clean checkpoint.

## 7. Undo — full circle (on camera)

```sh
npx vibe-fence undo --steps 1
git log --oneline | head -3 && git status --short
```

Expect: HEAD rolls back to the leaky checkpoint with the fix preserved in
the worktree and no detached HEAD (rubric #3). Then prove the fence tracks
the worktree faithfully in both directions:

```sh
git stash -q && npx vibe-fence check; echo "exit=$?"
git stash pop -q && npx vibe-fence check; echo "exit=$?"
```

Expect: stashed (leaky) → `FAIL SEC-01`, exit 1 — rollback works, and the
fence still catches it; popped (fixed) → `OK`, exit 0. End of beats.

## Cleanup

```sh
rm -rf /tmp/vf-demo
```

## Beat ↔ proof map

| Cue beat | Automated cover |
|----------|-----------------|
| 3 block | proof beat ① + `runCheck`/`evaluateToolCall` agreement |
| 4 explain | `src/framework/explain.test.ts` (mocked fetch; live key is human-owned) |
| 5 checkpoint warns, still lands | `src/framework/git.test.ts` checkpoint cases (D7/L15) |
| 7 undo integrity | `src/framework/git.test.ts` pushed-revert + contiguous cases |
