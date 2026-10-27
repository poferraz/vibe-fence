# Partner-credits leverage plan (hackathon build window)

Source: Meta invite email + waiver text ($150 Meta Model API for selected
participants); partner credits via select-participant offers / Discord
(Baseten $100, Modal $100, Fireworks $25). User already holds Fireworks
credits. Verify each balance before spending.

## Inventory (verify, then spend)

| Source | Amount | Status |
|---|---|---|
| Meta Model API | $150 | Not ready — verify in account |
| Modal | **$30 in hand** | Confirmed Oct 26 — the bulk-eval budget |
| Fireworks | User-held (amount TBC) + $25 offer | Confirm balance; Sinan Ozdemir workshop |
| Baseten | $100 + 2M TPM (select) | **Claimed Oct 27** — key issued, see endpoint note |
| Modal | $100 (select offer) | Not ready — claim via Discord/workshops |

## Baseten endpoint (claimed Oct 27 — select-participant offer)

- Base URL: `https://inference.baseten.co/v1` (OpenAI-compatible).
- Model: `meta-models/muse-spark-open-1026` — use EXACTLY this; the key
  works only with the hackathon model, and the public docs' shorter
  `meta-models/muse-spark-open` name will NOT work here.
- Key: one-time link (open once, copy immediately) → store ONLY in local
  `.env` as `BASETEN_API_KEY` (gitignored, never committed, never pasted).
- Redteam invocation: `bun run tools/eval.ts --redteam N --rule R --model
  meta-models/muse-spark-open-1026 --provider custom --base-url
  https://inference.baseten.co/v1 --api-key-env BASETEN_API_KEY --out
  tools/out/<date>-<rule>-<mode>.ndjson` (2M TPM dwarfs the capped
  N≤50 / ≤2000-token runs — no throttle risk).
- Muse Spark Open always reasons; for redteam only the payload lines
  matter (the harness strips numbering/fences already). Now available as
  the open-weights bulk endpoint alongside Fireworks — spend order is the
  human's call (see Actions).

## Allocation rule

Spend each credit where judges can see it, cheapest adequate tier always.

- **Meta Model API $150 → judged Meta surfaces only (25% criterion).**
  Spark companion live calls (demo + probe), ONE Wonder escalation beat
  (verifier-fail → architect review), Muse Image demo assets (~$0.01/img:
  logo, OG card, before/after visuals), SAM 3.1 spot-check. Never bulk
  evals here — Wonder output at $20/1M burns $150 in 7.5M tokens.
- **Fireworks (+Baseten/Modal) → volume.** Open-weights local-tier dev,
  FULL-SUITE evals (all 10 S-09 rules × TP/FP fixtures — the suite is the
  niche), 5×4 rubric runs, unsafe-action-rate measurement, adversarial
  bench, regression loops. This is the bulk-inference budget. Inference
  only — no training; tuning = thresholds/prompts/precision via evals.
- **$0 paths → CI and default.** Fixture mode in CI (no keys, no spend);
  deterministic fence needs no model. Paid calls only on explicit paths:
  probe (once), demo script, eval runner with cap flags.

## Guardrails (wire before Nov 1)

1. `billing-guard.ts` wired to real spend with per-run caps; eval runner
   refuses uncapped paid runs.
2. Wonder cap ≤5 calls/session already in `meta-client.ts` — keep, log
   every call to `.fence/` artefacts (model id + request id).
3. Probe-once policy: model-ID discovery is done (Spark live
   `resp_6adff4cb28da781ca979428b`); re-probe only for Wonder + tool-call
   support, one call each.
4. Never commit keys. `.env` is gitignored; CI stays fixture-only.

## Spend log format (ready — Phase 4a, no paid runs yet)

Every paid red-team run writes one NDJSON artefact:

```
bun run tools/eval.ts --redteam N --rule R --model M --out tools/out/<date>-<rule>-<mode>.ndjson
```

(`tools/out/` is gitignored — raw attack payloads must never land in the
tree, where they would trip the repo self-scan.)

- `redteam_attempt` lines: `{i, payload, gateBlocked, treeBlocked,
  treeUnknowns, caught}` — which real surface fired per variant
  (`caught = gateBlocked || treeBlocked`).
- One trailing `redteam_run` line: `{rule, mode, model, provider, n,
  evaluated, caught, rate, promptTokens, completionTokens, totalTokens,
  usd, at}` — token counts come from the provider `usage` block (null
  when the provider omits it); `usd` is always null in the artefact —
  fill it from the provider invoice (per-model rates change; never
  estimated).
- Benign mode (`--mode benign`) scores firings as false positives —
  the measured false-block rate, replacing the asserted one.

The spend log is the concatenation of per-run files. First paid runs
are human-owned (see Actions).

## Actions

- [ ] Verify $150 Meta credit in account; record balance + expiry.
- [x] Modal $30 confirmed in hand (Oct 26) — ring-fence for full-suite evals.
- [x] Eval runner v0 built (Oct 26): local metrics + pinned baseline + capped
      `--redteam` harness with base-URL switch (Fireworks default; Modal/Baseten
      via `--provider custom --base-url`). Keys from env only, never gated.
      Phase 4a: dual-surface eval (gate legs + `runCheck` tree scan),
      `--mode benign`, `--out` NDJSON artefacts (see Spend log format).
- [ ] Confirm Fireworks balance; claim $25 hackathon offer if separate.
- [x] First paid red-team run (Oct 27, Baseten — Fireworks key never
      materialized): 11 rules × attack/benign, N=6, --max-tokens 2000
      (reasoning model needs the headroom; 300 truncates to reasoning-only),
      model meta-models/muse-spark-open-1026. 25 calls ≈ 30K tokens, cents
      on $100 (usd per invoice, never estimated). Attack: 10/11 briefs
      refused (hard/soft) — no hostile signal except SEC-01 (5/6 caught);
      apparent misses triaged as intended passes (2 folded as s01-f6/f8
      TNs, 1 dropped as unverifiable bytes). Benign: 0/66 FP — measured
      false-block rate 0%, valid (real payloads, not refusals). Artefacts:
      tools/out/2026-10-27-baseten-*.ndjson (gitignored).
- [x] Modal $30: PROBED, then stopped (Oct 27) — endpoint live
      (meta-models/Muse-Spark-Open-816B-A42B, Bearer id.secret; smoke 1/1,
      ~$0.0045). 3-rule attack probe (SEC-02/NET-01/CMD-01, N=6): 16/17
      refused (same safety tuning as Baseten), 1 weak catch, ~2.4K tokens
      ≈ $0.01. Full matrix would buy ~nothing: hostile breadth moves to
      $0 hand-written fixtures. Credits intact ($30.00, usage $0.00);
      card untouched.
- [x] Baseten $100 + 2M TPM claimed Oct 27 (key issued; endpoint noted above).
- [ ] Claim Modal $100 select offer via Discord/office hours.
- [ ] Attend partner workshops (Oct 27–Nov 4) — claim codes + integration help.
- [ ] Add Fireworks base-URL switch for the open-weights local tier
      (Phase 2 task; keeps Meta API spend at ~zero for bulk work).
