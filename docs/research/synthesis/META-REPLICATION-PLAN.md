# Meta Vibe-Fence — Replication Plan (DeepSeek Harness → Meta)

> Based on: DeepSeek Harness docs (architecture.md, cordis-primer.md, plugin anatomy) + deepseek-ai/deepseek-harness clone
> + Meta AI app design refs (ai.meta.com, Meta AI standalone app, Threads/Instagram glass language)
> + Existing vibe-fence scaffold (src/, docs/research/FINAL-v4, 186-source SOURCES.md)

## What "replicate" means

Build a **standalone Meta harness** — `npx @meta-ai/vibe-fence web` — that takes DeepSeek's architecture as a starting point:

| Layer | DeepSeek original | Meta replication |
|-------|-------------------|------------------|
| Plugin runtime | Cordis (`@deepseek-ai/cordis`) | Cordis vendored as-is (`$DSH_HOME/vendor/cordis` → `$META_HOME/vendor/cordis`); same service/event/effect model |
| Composition | profiles (web/headless/sdk) + bundles + `cordis.patch.yml` overlays | `@meta-ai/vibe-fence-base` bundle (Meta adapters instead of DeepSeek ones) + `meta-web`/`meta-headless` profiles |
| Model layer | `dsh-llm-deepseek` / `dsh-llm-pi-ai` | `meta-llm-spark` (Muse Spark via Meta Model API `POST /v1/responses`) + `meta-llm-wonder` escalation tier |
| Work surface | workspace = checkout dir; Web UI on `:3080` | **Web UI is the primary product** — workspace picker + approval modals are the whole non-tech UX ("add user profiles and a database" → shielded) |
| Safety seam | per-tool `approval` + sandbox policy plugins | vibe-fence guardrail packet as a **seam plugin** (10 zero-FP hard-blocks: SEC-01..PRV-09) on `tools/*` + `agent/request` |

Non-goals: do not re-implement Cordis itself; do not fork `dsh` wholesale — replicate the composition model with the smallest viable Meta-branded shell.

## DESIGN.md (Meta)

- **Palette:** Meta blue `#0066FF` (primary), `neutral #0A0A0F` (canvas), glass surfaces `rgba(255,255,255,0.08)` + blur, accent teal `#00D4AA` (success/pass), rose `#FF3366` (block/severity)
- **Type:** Inter (UI) + JetBrains Mono (code/logs), matching `ai.meta.com`
- **Shape:** `rounded: lg 16px, xl 24px` — pill buttons, card glass; `spacing: sm 8, md 16, lg 32`
- **Tokens map to:** existing Meta AI app — large hero, soft shadows, bottom approval bar (not inline prompts), single-field workspace picker, provider cards (Spark vs Wonder) mirroring `dsh` providers page (`apiKeyEnv` → Meta API key, provider id `meta-spark`/`meta-wonder`)

Full `DESIGN.md` + `tailwind.theme.json` export lives at repo root (generated next).

## PRODUCT.md

Covers positioning vs. DeepSeek harness, non-tech JTBD, scope (desktop Web UI v1; mobile/browser explicitly out — same guard as `docs/project/PRD.md`), privacy contract (Standard vs Contributor mode disclosure, mirroring `dsh` credential ref pattern `$DSH_HOME/.credentials.yaml` → `~/.meta-fence/.credentials.yaml`).

## Build order

1. `DESIGN.md` + `PRODUCT.md` + token export (this PR)
2. Shell profile + Cordis boot (thin wrapper, no DeepSeek fork) — `@meta-ai/cordis` + `@meta-ai/vibe-fence-base` bundle
3. Fence seam plugin (`@meta-ai/vibe-fence-guard`) wired to `agent/request` waterfall (`next()` short-circuit = block)
4. Web UI replica: workspace picker → credential card (Meta API key) → approval modal → session log, all on `:3100` (not `:3080`)
5. Visceral Delta demo harness: `web` vs `web` (unfenced vs fenced) split-screen, 5×4 rubric unchanged

## Decisions to confirm

- Provider story: reuse `dsh-llm-pi-ai` + Muse Spark endpoints, or Meta-native `meta-responses` protocol (stateless replay, encrypted chain — per stream 06 D-02)?
- Approval UX: dsh's inline `approval` plugin vs. vibe-fence's `fence look` Playwright→Spark verification — which is the non-tech gate?
- Profile surface: ship `web` only for judges, defer `headless`/`sdk` to post-hackathon
