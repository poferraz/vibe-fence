# Vibe Fence — Product Requirements

> `vibe-fence` is a standalone **Meta harness** — a DeepSeek-harness-class agent host rebuilt in Meta's Web UI language — that makes any model safely useful for non-technical builders.

## Positioning

Not a plugin inside DeepSeek's `dsh`. Not a Claude/Codex wrapper. A first-class harness you launch as:

```sh
npx @meta-ai/vibe-fence web   # → http://127.0.0.1:3100
npx @meta-ai/vibe-fence web --no-open
```

It owns its composition (Cordis-style plugin tree, profiles/bundles, `cordis.patch.yml` overlays), its model routing (Muse Spark as companion, Muse Wonder as escalation), and its product language (Meta blue glass, bottom approval bar, single-field workspace picker). DeepSeek harness is the **architecture reference** — everything-is-a-plugin, typed events with reversible effects, spatiotemporal composability (`_A Programming Paradigm for Spatiotemporal Composability_`).

## Audience & JTBD

**Primary — non-technical vibe-coder.** Ships an idea ("add user profiles and a database") by chatting with an agent. Cannot judge whether the agent introduced a secret leak, a missing RLS policy, an unpinned dependency, or a hallucinated plan. Wants the harness to be invisible when things are safe and unmistakable when they aren't.

**Job:** "When I ask the agent to build something, it does the right thing — and if it can't, it asks once, clearly, with the blast radius in front of me."

## Web UI — the product (reference: DeepSeek `dsh web` + Meta AI app)

The Web UI is the product, not an accessory. CLI is for boot; the browser is for decisions.

### Launch
`npx @meta-ai/vibe-fence web` prints the URL and — on a local launch — opens the browser (mirrors `dsh web`). SSH only prints the URL. The `dsh` process's cwd is the default filesystem root.

### Workspace
Add/select a workspace (the project directory `dsh` was launched from). No workspace selected → input is disabled. One field + folder icon (single click to add, one to select).

### Models
Settings → Models. Two Meta providers: `meta-spark` (default, `muse-spark-1.3`) and `meta-wonder` (escalation, `muse-wonder-1.3`), both via `POST /v1/responses` (stateless encrypted replay, not `previous_response_id` — stream 06 D-02). Inputs accept a typed key **or** an env fallback (`META_SPARK_API_KEY` / `META_WONDER_API_KEY`). Keys are write-only, stored in `~/.meta-fence/.credentials.yaml` as a credential ref (mirrors `dsh`'s `$DSH_HOME/.credentials.yaml` + descriptor pattern), with env-detection hints (green = env present, yellow = missing). A **Custom Model API** card exists for gateways/company proxies (provider id + base URL + protocol selector: `openai-completions`/`openai-responses`/`anthropic-messages`) — same grammar as `dsh`'s third-party provider cards.

Model defaults live in the profile's `cordis.patch.yml`; probing an endpoint for available models is one click and never auto-saves.

### Session
The agent reads/edits workspace files, runs commands, and maintains a plan. Every fact the model must be able to reconstruct is an append-only `SessionEvent` — same contract as `dsh` (`core/session`). If an approval policy marks an operation sensitive, the Web UI asks first (bottom approval bar, not inline shell prompt — theatre rate 93% → real block on the seam).

### Plugin surface
`src/rules/*` + `src/framework/*` ship as **one Fence seam plugin** (`@meta-ai/vibe-fence-guard`) that registers on `agent/request` via `ctx.waterfall` — `return` without `next()` = block, mutate+delegate = annotate. Seams are `Service Definition → Provider → Consumer` triples (filesystem + subprocess providers share one execution world, so a remote sandbox swap moves Bash/PTY/LSP together — same guarantee as `dsh`). All `ctx.effect()` / `ctx.on()` registrations unwind on unload. Profile dump: `vibe-fence --profile web --dump-config`.

## Scope

- **In (Desktop Web UI v1):** `web` profile only; bundled base (`model adapters, tool registry, session log, guardrail packet`) + web app on `:3100`. Desktop/Electron explicitly out (same guard as `docs/project/PRD.md`).
- **Out:** Mobile, browser WebWorker preview, `headless`/`sdk`/`acp` profiles — documented as not shipped, not claimed (matching `dsh`'s `sdk-minimal` exception pattern where explicitness beats auto-inheritance).

## Privacy

Standard mode is the product (`Standard-mandatory` — 06 A-07). `meta-spark`/`meta-wonder` calls run stateless replay; nothing stored server-side. No `reasoning_effort: "none"` (HTTP 400). Contributor mode, if ever offered, is an explicit, separately disclosed opt-in with training-use language — never the default for user workspace files. Mirrors `dsh`'s write-only key discipline.

## Success

A judge who has never coded can run the harness, pick a workspace, paste an API key, survive a malicious prompt that would exfiltrate a secret in the unprotected baseline, and ship a deployed URL — without touching a terminal after boot. That delta is the Visceral Demo (FINAL-v4 §7, `docs/research/synthesis/DEMO-SCRIPT.md`).

## References

- Architecture reference: `deepseek-ai/deepseek-harness` (MIT) — `docs/architecture.md`, `docs/cordis-primer.md`, `vendor/cordis` (spatiotemporal composability)
- Design tokens: [`DESIGN.md`](../DESIGN.md) + `tailwind.theme.json` (export of the same file)
- Source of truth: `docs/research/synthesis/FINAL-v4.md` (221 lines) + `docs/research/SOURCES.md` (186 entries A–H)
- Hackathon: Meta Global AI Developer Hackathon — Oct 26 → Nov 4, 2026 · `Muse Spark / Muse Image / SAM 3.1` · `POST /v1/responses`
