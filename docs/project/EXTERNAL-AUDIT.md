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
- Auditors run LOCALLY with full file access to the working tree (this
  machine). No cloning. They WILL see `.env` (live key) — the prompt
  orders them never to print/transmit it. They must say what they could
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
Repo: you are running ON the entrant's machine with full file access to the
working tree at /Users/poferraz/Documents/Development/active/vibe-fence.
Do NOT clone anything — audit this tree directly. (Public mirror for
reference only: https://github.com/poferraz/vibe-fence — the local tree
is authoritative and may be ahead of it.)
SECRECY: this tree contains a LIVE API key in .env (gitignored). Never
print, quote, or transmit any key material. Verify .gitignore/history
hygiene WITHOUT reproducing secrets.
Claimed status: working CLI (init/check/gate/checkpoint/undo), 11 guardrail
rules, 237 tests, eval runner + 45-case held-out corpus with pinned baseline
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
1. Explore the working tree directly. Start at README.md,
   docs/project/STATUS.md, docs/project/SUBMIT.md,
   docs/project/CREDITS-PLAN.md, then drill into src/, tools/, tests/,
   .github/workflows/.
2. Run, from the repo root: bun install, bunx tsc --noEmit,
   bun run build, bun run validate, bun test, bun run eval. Report
   exactly what ran, what passed/failed, and timings. If any command
   cannot run, SAY SO and audit that part statically.
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
6. GitHub hygiene: README honest vs code reality? CI config meaningful
   (and CI status green, if you have network — else SAY SO)? LICENSE
   present? .gitignore correct (no secrets/keys in history — check with
   git log / git show, WITHOUT printing any key material)? Commit history
   clear? Repo presentation (description, topics — web-only, note if
   unreachable)?
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

After collecting all 4 reports into `docs/project/audits/`, run the
prompt below in a fresh session with file access to this tree:

```text
You are synthesizing 4 independent audit reports of the same repo, and
grounding them against the actual tree. You have full file access to
/Users/poferraz/Documents/Development/active/vibe-fence. The reports are
at docs/project/audits/<model>-<date>.md (four files — read them all).

RULES:
- A finding cited by 2+ reports is CONFIRMED; a lone finding is
  UNCONFIRMED (keep it, flagged as a lead, never silently dropped).
- Do NOT invent new findings. Your only additions are VERIFICATION
  results: for every CONFIRMED issue and every auditor disagreement,
  spot-check the cited file:line/command against the tree and mark it
  VERIFIED (holds), REFUTED (wrong — say why), or UNCHECKABLE (say why).
  Check at least one cited claim per report even when reports agree.
- Severity consensus: take the median severity across citing reports;
  note any P0-vs-P2 splits explicitly.
- Costs/effort: keep the auditors' S/M/L labels; flag any you disagree
  with after seeing the code.
- Scores: reproduce each report's 9 dimension scores verbatim, then add
  the median column. Do not rescore.

OUTPUT (write it to docs/project/audits/SYNTHESIS-<today's date>.md
AND print it):
# Synthesis — 4-model audit — <DATE>
## Score table (per model + median; one-line note on widest spread)
## Confirmed strengths (top 5, with verification note each)
## Confirmed issues (ranked; each: severity consensus, cited-by,
   verification VERIFIED/REFUTED/UNCHECKABLE + evidence)
## Unconfirmed leads (each: source report, why worth checking, effort)
## Disagreements (each: the split, your call with tree evidence)
## Final fix list (max 10, prioritized, each: fix + effort S/M/L)
## Win assessment (one paragraph: place or not, why, highest-ROI fix)
## Reports used (filenames + dates)
```

## Timeline suggestion

- Day 0: paste prompt to all 4 models in parallel.
- Day 1: collect reports into `docs/project/audits/`.
- Day 1: run synthesis; convert confirmed P0/P1s into build tasks.
