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
| Baseten | $100 + 2M TPM (select) | Not ready — claim via Discord/workshops |
| Modal | $100 (select offer) | Not ready — claim via Discord/workshops |

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

## Actions

- [ ] Verify $150 Meta credit in account; record balance + expiry.
- [x] Modal $30 confirmed in hand (Oct 26) — ring-fence for full-suite evals.
- [x] Eval runner v0 built (Oct 26): local metrics + pinned baseline + capped
      `--redteam` stub with base-URL switch (Fireworks default; Modal/Baseten
      via `--provider custom --base-url`). Keys from env only, never gated.
- [ ] Confirm Fireworks balance; claim $25 hackathon offer if separate.
- [ ] First paid red-team run: start on Fireworks (held credits),
      10 variants × 11 rules × ~300 tokens ≈ 33K output tokens — cents, not
      dollars. Record per-rule catch rates; fold misses into corpus (v2).
- [ ] Modal $30: bulk runs — repeat red-team 5× per rule + rubric-judged
      suites once model IDs verified; log spend per run.
- [ ] Claim Baseten $100 / Modal $100 select offers via Discord/office hours.
- [ ] Attend partner workshops (Oct 27–Nov 4) — claim codes + integration help.
- [ ] Add Fireworks base-URL switch for the open-weights local tier
      (Phase 2 task; keeps Meta API spend at ~zero for bulk work).
