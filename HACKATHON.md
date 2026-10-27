# Hackathon boundary — Meta Global AI Developer Hackathon

- Event: Meta Global AI Developer Hackathon (Cerebral Valley)
- Track: Indie developer · Problem statement: Build for Your World
- Entrant: Paulo Ferraz (solo)
- Build window: Oct 26 – Nov 4 2026 (submit by Nov 4 9PM ET)

## Where hackathon work starts

Tag: **`hackathon-start`** → `44beb58` (Oct 26 2026, 10:05 -07:00,
"fix: prepare for public — track bun.lock, ignore .hermes").

- Everything BEFORE the tag (Oct 21, `056e49c`…`411c7ca`) is prior work
  owned solely by the entrant: research corpus, FINAL-v4 synthesis,
  scaffold (installer, 6 adapters, 4 rules, rehearsal notes). No other
  person or entity holds rights to it.
- Everything FROM the tag forward is hackathon-window work: public repo
  + CI, goal lock, packed CLI, enforcement tiers, full 11-rule suite,
  eval runner, demo.

Review the hackathon diff with:

```bash
git log --oneline hackathon-start..HEAD   # hackathon work only
git log --oneline hackathon-start~1       # prior owned work
```

## Originality statement

This submission is the original work of the entrant. Third-party inputs
are limited to: Meta Model API + open-weights models (tooling), partner
inference credits (evals), public package registries under their licenses,
and AI coding assistants as implementation tools. No template, starter, or
third-party codebase was forked.

## Credits & partners

Inference spend is tracked in `docs/project/CREDITS-PLAN.md`. Nothing in
this repo required paid spend to build; partner credits fund eval runs only.
