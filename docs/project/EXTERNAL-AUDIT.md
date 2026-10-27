# External audit plan — independent multi-model review

## Purpose

Get 4 independent, unbiased audits of vibe-fence before submission:
what is good, what is broken, GitHub hygiene, hackathon compliance,
tests/evals quality, partner-environment usage, hackathon-work boundary
clarity, and winning potential.

## Models (one session each, no cross-talk)

1. Gemini Argon 4 Medium
2. GPT 6 Astra High
3. Muse Wonder Max
4. GLM 5.3 Max

## Rules of engagement

- Paste the EXACT same prompt below to all four, each in a fresh session.
- Auditors get the PUBLIC repo only: https://github.com/poferraz/vibe-fence
  No keys, no `.env`, no private context. They must say what they could
  and could not verify.
- Collect the 4 reports as files (e.g. `docs/project/audits/<model>-<date>.md`).
- Then run the synthesis step. A finding cited by 2+ models is a fact;
  a lone finding is a lead to verify, not a verdict.

## The prompt (verbatim — paste as-is)

```text
You are an independent, adversarial auditor AND a hackathon judge. You have
no prior context on this project and no loyalty to it. Be harsh, specific,
and evidence-backed. Accuracy over kindness. Never invent facts: every
claim must cite a file path with line numbers, a URL, or a command you ran.
Say plainly what you could not verify.

PROJECT: vibe-fence — "One command makes any AI coding agent safe."
Repo (public, clone or browse it): https://github.com/poferraz/vibe-fence
Claimed status: working CLI (init/check/gate/checkpoint/undo), 11 guardrail
rules, 236 tests, eval runner + 45-case held-out corpus with pinned baseline
(bun run eval, gated in CI), 4 proof beats green, demo video NOT YET
recorded. Red-team mode exists as a capped, key-from-env stub (--redteam)
not yet run on partner hardware.

HACKATHON FACTS (Meta Global AI Developer Hackathon, Cerebral Valley):
- Build window Oct 26 – Nov 4 2026; submit by Nov 4 9PM ET; Indie track,
  "Build for Your World" problem statement; solo entrant.
- Judging criteria: Impact 30%, Use of Meta AI Tooling 25%, Demo 25%,
  Technical Depth & Execution 20%. Indie lens: creativity, technical
  ambition, whether it works.
- Meta stack in scope: Muse Spark, Muse Wonder, Muse Image, SAM 3.1 via
  Meta Model API, Meta open-weights models, Muse Code.
- Partners: Baseten ($100 + 2M TPM select offer), Modal ($100 select offer;
  entrant ALSO holds $30 Modal credit in hand), Fireworks ($25 select offer;
  entrant holds separate Fireworks credits, amount TBC). $150 Meta Model API
  credit pending. Free user tier credit excluded from judging spend claims.
- Submission requires: team name, track, problem statement, project
  description, public GitHub repo, 3-MINUTE YouTube demo video, written
  "use of Meta products", written "why Meta's models are important",
  feedback on Meta products and on partner tech, promo consent.
- Originality clause: submission must be the entrant's original work;
  prior work they own is allowed but the hackathon-start boundary must be
  CLEAR. Repo history starts ~Oct 21 (scaffold + research), BEFORE the Oct 26
  kickoff. The entrant claims the boundary IS marked: an annotated tag
  `hackathon-start` plus a HACKATHON.md disclosure file. VERIFY: does the
  tag exist and resolve to a sane commit (git show hackathon-start)? Does
  HACKATHON.md match the actual history (spot-check dates/files before vs
  after the tag)? Is the disclosure adequate for a judge?

DO THIS:
1. Clone/browse the repo. Start at README.md, docs/project/STATUS.md,
   docs/project/SUBMIT.md, docs/project/CREDITS-PLAN.md, then drill into
   src/, tools/, tests/, .github/workflows/.
2. If your environment allows, run: bun install, bunx tsc --noEmit,
   bun run build, bun run validate, bun test, bun run eval. Report
   exactly what ran, what passed/failed, and timings. If you cannot run
   code, audit statically and SAY SO.
3. READ the tests — do not count them. Are assertions meaningful? Do the
   4 proof beats (tests/proof-beats.test.ts) prove real behavior? Is the
   adversarial bench (tests/adversarial/README.md) honest? What critical
   paths are untested? Would YOU trust a demo on this suite?
4. Assess partner-environment usage for tests/evals (WEIGHT THIS HIGHLY):
   read docs/project/CREDITS-PLAN.md, then RUN bun run tools/eval.ts and
   inspect tools/eval.ts + tests/evals/corpus.json + tests/evals/baseline.json.
   Judge: is the corpus genuinely held-out from the unit tests (spot-check
   overlap)? Is the baseline policy sound (pinned, CI-gated, review-before-
   commit)? Is the capped --redteam stub (env keys, base-URL switch,
   token caps, never-gates) adequate to run attack-generation on
   Modal/Fireworks/Baseten hardware — what is missing? Propose a CONCRETE
   eval plan: which suites run where, on which models, roughly how many
   tokens/$, what numbers it would produce for judges.
5. Judge Meta integration depth: is Meta load-bearing or decorative?
   Any verified live calls (look for recorded request IDs)? Are model IDs
   real? Could the "why Meta's models are important" submission answer be
   written honestly from this repo TODAY?
6. GitHub hygiene: README honest vs code reality? CI green and meaningful?
   LICENSE present? .gitignore correct (no secrets/keys in history —
   check)? Commit history clear? Repo presentation (description, topics)?
7. Submission readiness, field by field from the list above: ready / gap /
   blocked, with the missing artifact named.
8. Winning potential: as an Indie judge, would this place? Why / why not?

OUTPUT (use this exact structure):
# Audit — <MODEL NAME> — <DATE>
## Scores (/10, one line of justification each)
| Dimension | Score | Why |
| Idea & goal focus | | |
| Correctness & completeness | | |
| Tests & evals quality | | |
| Partner-env usage for tests/eval | | |
| Meta integration depth | | |
| GitHub hygiene | | |
| Hackathon compliance | | |
| Demo/video readiness | | |
| Winning potential | | |
## Top 5 strengths (with file:line evidence)
## Top 10 issues (ranked; each: severity P0/P1/P2, file:line, one-line fix, effort S/M/L)
## Compliance checklist (each submit field: READY/GAP/BLOCKED + evidence)
## Proposed eval plan on partner credits (concrete: suites × models × ~cost × expected numbers)
## Verdict (3 sentences max: place or not, the single biggest reason, the single highest-ROI fix)
## Could not verify (list everything you could not check and why)
```

## Synthesis step

After collecting all 4 reports, run this (one session, any strong model):

```text
You are synthesizing 4 independent audit reports of the same repo
(<paste all four>). Rules: a finding cited by 2+ reports is CONFIRMED;
a lone finding is UNCONFIRMED (keep it, flagged). Do not invent new
findings. Output: (1) score table per model + median, (2) confirmed
strengths (top 5), (3) confirmed issues ranked with severity consensus,
(4) unconfirmed leads worth checking, (5) disagreements between auditors
with your call, (6) final prioritized fix list (max 10, with effort),
(7) one-paragraph win assessment.
```

## Timeline suggestion

- Day 0: paste prompt to all 4 models in parallel.
- Day 1: collect reports into `docs/project/audits/`.
- Day 1: run synthesis; convert confirmed P0/P1s into build tasks.
