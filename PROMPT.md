# vibe-fence — Research Runner

> **Paste this entire file into any model's chat, in any session, from the project root.**
> The model will figure out what to do and where to save — no prior context needed.

---

You are inside the project **vibe-fence** — a drop-in harness that wraps any AI coding agent (Codex, OpenCode, Cursor, Hermes, Antigravity, etc.) to make vibe-coding safe for non-technical people. Your working directory is the project root.

## Step 0 — Orient Yourself (do this first, no exceptions)

1. Read `docs/PLAN.md` — the overall vision + phases. Phase 0 is **research**, Phase 1 is **scaffold**.
2. Read `docs/research/INDEX.md` — the 6 streams defined for Phase 0.
3. Read `docs/research/prompts/README.md` — the runner instructions and naming convention.
4. Read `docs/research/00-meta/LOG.md` — what has already been done.

Do not skip this. You need the full picture before choosing what to research.

## Step 1 — Pick Your Stream

You have two options — respond to the user with which one you are doing:

- **A) User tells you a stream** (e.g. "do 03" or "do 03-elicitation") → do that one.
- **B) User says nothing / "pick one"** → pick the **lowest-numbered stream that has zero or fewest contributor files** in `docs/research/contributors/`. Check by listing that directory.

If the user asks you to do **all streams**, do them **one at a time**, completing and saving each before starting the next.

## Step 2 — Read Your Prompt

Open `docs/research/prompts/NN-<slug>.md` for the stream you picked. It contains your full assignment: scope table, citation rules, and exactly where to save.

That file is authoritative. Follow it precisely.

## Step 3 — Create Your Contributor Folder

If it doesn't already exist, create:

```
docs/research/contributors/<provider>-<model>-<YYYY-MM-DD>/
```

- `<provider>-<model>` is you — e.g. `kimi-k2`, `glm-4.7`, `muse-spark`, `gpt-5`, `claude-opus-4.6`
- Use lowercase + hyphens only. No spaces, no uppercase.
- If a folder for you already exists **on the same date**, reuse it. If it's a **different date**, create a new dated folder — never overwrite a prior day.

Inside it, ensure `manifest.json` exists and is accurate:

```json
{
  "model": "your-model-name",
  "provider": "how you were accessed",
  "date": "YYYY-MM-DD",
  "streams_completed": ["NN"],
  "streams_skipped": [],
  "notes": "anything notable"
}
```

If you do multiple streams in one session, update `streams_completed` as you finish each.

## Step 4 — Do the Research

- Search broadly (web, GitHub, ArXiv, official docs). Don't rely on a single source.
- Cite every non-obvious claim with URL or paper ID + date accessed.
- Tag each finding: `proven` (paper/eval) | `practiced` (widely used) | `contested`
- Be honest about gaps — if you couldn't find something, say so.
- End with numbered **Implications for vibe-fence** (copy / avoid / invent) — this is required.

Save to:

```
docs/research/contributors/<your-id>/NN-<slug>.md
```

Format: header (model/provider/date/stream) → findings → gaps → sources table → implications. See `contributors/_template/STREAM-TEMPLATE.md` for the shape.

## Step 5 — Log It

Append one line to `docs/research/00-meta/LOG.md`:

```
| YYYY-MM-DD | NN | <model-id> completed NN — <one-line summary> |
```

## Rules

- Never write outside your own `contributors/<your-id>/` folder.
- Never overwrite another contributor's files.
- Never edit `docs/PLAN.md`, `docs/research/INDEX.md`, or `docs/research/prompts/` — those are the contract.
- One stream = one file. Complete it fully before starting the next.
- A file with zero citations or zero implications is incomplete — don't stop early.
