# Submit checklist — Cerebral Valley portal (fields pasted by user, Oct 26)

Portal: https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit
Deadline: Nov 4, 9PM ET. One track only; Representative submits.

## Fields (status as of Oct 26)

- [ ] **Team Name*** (user decision — solo; suggest `vibe-fence`)
- [x] **Team Members** — poferraz / Paulo Ferraz (solo, fits Indie ≤4)
- [ ] **Track*** — Indie developer track (locked; form selection at submit)
- [ ] **Problem statement*** — Build for Your World (locked; form selection)
- [ ] **Most Viral X post link** (optional, free lottery ticket — bonus pool
      includes most-viral/community awards up to $50k aggregate; post + link it)
- [x] **Project Description*** — drafted Oct 26 from truth-passed README Impact + 4 proof beats (see draft below; finalize after Phase 3a lands)
- [x] **Public GitHub Repository*** — https://github.com/poferraz/vibe-fence
- [ ] **3-Minute Demo Video*** (YouTube link — HARD requirement; unlisted is
      fine; record Nov 2–3 per DEMO-SCRIPT.md Visceral Delta)
- [ ] **Use of Meta products*** — Spark live + Wonder escalation + Muse Image
      assets + SAM spot-check + Muse Code built-with story (must be TRUE by
      Nov 3 — each claim needs a live call or artefact behind it)
- [x] **Why Meta's models are important*** — drafted Oct 26 from the probe artefact + `--explain` wiring (see draft below; actionable one-line fixes per finding — strengthen with Wonder escalation if 3b lands)
- [ ] **Feedback on Meta products** — honest notes from probe + build
      (model IDs, latency, docs gaps)
- [ ] **Feedback on partner tech** — requires REAL usage; run evals/bulk on
      Fireworks (held), claim + touch Baseten/Modal so this isn't blank
- [x] **Promo consent** — understood: Meta/CV may publish/promote materials

## Prep before Nov 3

1. Team name decision (1 min, user).
2. YouTube channel ready for unlisted upload.
3. X account ready for Most Viral post (draft thread during video edit).
4. Keep every Meta-surface claim honest: no unwired item in the form answers.

## Project description draft (Oct 26 — finalize after Phase 3a)

vibe-fence is a one-command safety harness for non-technical vibe-coders:
`npx vibe-fence init` wraps any AI coding agent in a deterministic fence —
10 zero-false-positive hard-blocks (leaked browser secrets, credential-path
reads, pipe-to-shell, destructive git/DB/filesystem commands) enforced at
write and commit time, with git checkpoint/undo as the safety net. The
fence decides; Meta's Muse Spark explains each block with a one-line fix.
Proven end to end by 4 green proof beats (leak stopped, private files
off-limits, done-means-checked, unsafe commit blocked + undo).

Draft notes (do not submit verbatim before checking): `npx` path requires
the human-owned `v0.2.0` npm publish; Spark-explains requires Phase 3a
(`--explain`) on this branch. Add a Wonder-escalation line only if the
human-approved Phase 3b probe succeeds.

## Why-Meta draft (Oct 26 — from the probe artefact + `--explain` wiring)

vibe-fence splits safety into two jobs: the deterministic fence decides
(11 local rules, zero false positives), and Meta's Muse models explain.
Every block the fence raises can be narrated by Muse Spark with a one-line
fix — `vibe-fence check --explain` makes one budget-capped, goal-blind
`POST /v1/responses` call per blocking report (task target + findings only;
never file contents or tool args), verified live against the Model API on
Oct 26 (probe artefact: `muse-spark-1.3`, stateless replay, per-request
artefact in `.fence/events.ndjson`). Without Muse, the fence is correct but
mute for its non-technical users; Spark is the voice that teaches the fix.
Planned, not claimed: Wonder escalation on verifier failure (gated on a
human-approved probe) and an offline open-weights tier.
