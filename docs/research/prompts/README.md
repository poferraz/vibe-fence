# Phase 0 Research — How to Run It

> You will run 6 independent research prompts (one per stream) across multiple models.
> Every model writes to its own folder. You synthesize afterwards.

## Folder Layout

```
docs/research/
├── INDEX.md                  # stream definitions (6 streams)
├── PLAN.md                   # overall vibe-fence plan
├── prompts/                  # the 6 runner prompts (hand these to models)
│   ├── 01-harnesses.md
│   ├── 02-harness-influence.md
│   ├── 03-elicitation.md
│   ├── 04-guardrails.md
│   ├── 05-companion-ux.md
│   ├── 06-meta-models.md
│   └── README.md             # how to run them
├── contributors/             # one subfolder per model run
│   ├── _template/            # copy this to create a new contributor folder
│   ├── <model-id>/           # e.g. kimi-k2, glm-4.7, gpt-5, claude-opus-4.6, muse-spark
│   │   ├── manifest.json     # who, when, what was covered
│   │   ├── 01-harnesses.md
│   │   ├── 02-harness-influence.md
│   │   ├── 03-elicitation.md
│   │   ├── 04-guardrails.md
│   │   ├── 05-companion-ux.md
│   │   └── 06-meta-models.md
│   └── _template/
└── synthesis/                # you (Paulo + Hermes) write here after all runs
    ├── 01-harnesses.md
    ├── ...
    └── FINAL.md
```

## Naming Convention for Contributors

Folder name = `<provider>-<model>-<YYYY-MM-DD>` — lowercase, hyphens only.

Examples:
- `kimi-k2-2026-10-20`
- `glm-4.7-2026-10-21`
- `muse-spark-2026-10-21`
- `gpt-5-2026-10-21`
- `claude-opus-4.6-2026-10-21`

If the same model runs again on a different day, it gets a new dated folder. Never overwrite.

## manifest.json (required in every contributor folder)

```json
{
  "model": "kimi-k2",
  "provider": "Moonshot via OpenRouter",
  "date": "2026-10-20",
  "streams_completed": ["01", "02", "03", "04", "05", "06"],
  "streams_skipped": [],
  "notes": "Ran all 6. Stream 03 used ArXiv heavily."
}
```

## How to Run (for Paulo)

### Option A — Sequential (one model at a time)
1. Copy `_template/` to `contributors/<model-id>/`
2. Paste the prompt from `prompts/<stream>.md` into the model's chat
3. When it finishes, verify the output landed in `contributors/<model-id>/<stream>.md`
4. Repeat for next stream / next model

### Option B — Parallel (multiple terminal tabs / agents)
- Each agent gets a different `prompts/<stream>.md` + writes to the same `contributors/<model-id>/` folder
- Agents must not write to each other's files (one stream = one file)
- Use a different `<model-id>` per agent identity (e.g. one runs Kimi, another runs GLM)

### After All Runs
- Open `synthesis/` and synthesize per-stream (compare all contributors' takes on the same stream)
- File conflicts are expected and valuable — synthesis resolves them

## Output Contract (every stream file must follow this)

Each `NN-*.md` must have:

1. **Header** — model name, date, stream name
2. **Sources** — every non-obvious claim cited (URL or paper ID with date accessed)
3. **Evidence strength** — tag each finding as `proven` (paper/eval) | `practiced` (widely used) | `contested`
4. **Implications for vibe-fence** — numbered, actionable (what to copy / avoid / invent)
5. Raw notes stay in the file — synthesis will trim, not the contributor

A stream file with zero citations or zero implications is incomplete.
