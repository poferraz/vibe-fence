---
name: vibe-teach
description: Use when surfacing a teaching moment, rendering a learning card, stepping the teaching dial, or explaining a guardrail decision to a non-technical user.
---

# vibe-teach — Teaching Dial & Learning Cards

> Sources: FINAL-v2 §4 M2/M3 (S-11) · 05 companion-ux A-01..A-05/D-01/D-02/D-04 · INDEPENDENT-GEMS GEMS-05/06 · 03 A-06 · S-04 · S-11.

## Install

Teaching is **orthogonal to autonomy** (S-11/05 D-01): the dial is a **scaffolding-fade** (`max→medium→min→silent`, Kalyuga expertise-reversal, Bastani PNAS 2025 n≈1,000), not a verbosity slider; turbo is the autonomy axis. Same API, two tiers: Muse Spark 1.3 (companion voice) → Muse Wonder 1.0 (plan/verify escalation) (S-06).

State: per-domain vector in `.fence/state/dial.json` behind one global knob (FINAL-v2 M2; 05 D-02/C-05a) + `.fence/state/learning.json` (answers to retrieval prompts) + optional P2 `teaching-budget.json` (Steyvers POMDP, 05 D-02). TTL+LRU eviction after 7 days (GEM-02 P2). Senior-Partner anti-sycophancy directive shipped in `AGENTS.md` template (FINAL-v2 M2).

```
.fence/state/dial.json        → { ui: "max", auth: "medium", deploy: "silent", … }
.fence/state/learning.json    → { "<domain:concept>": "<one-sentence answer>" }
.fence/learn/<topic>.md       → full teaching page (disk, not context)
```

At `max`: hint-first — symptom + one non-blocking question with timeout → escalate to explanation (05 D-01 deepseek reading). Minimax's fixed schema is the container; deepseek's hint-first is the inside-the-card policy.

Context budget: byte-cap shell outputs at 4 KB; teaching lives on disk (`.fence/learn/*.md`) with only a pointer in context; metadata-only skill exposure (S-03/S-04).

## Usage

```bash
fence dial max|medium|min|silent              # global knob (steps all domains together in v1)
fence dial --domain auth --level medium        # per-domain override (when vector UI ships)
fence learn --topic rls-101                    # write .fence/learn/<topic>.md
```

### Card schema — fixed at every level (05 A-03)

| Block | What it holds |
|-------|---------------|
| **What changed** | Concrete file/route/table touched |
| **Why** | Constraint or vulnerability prevented (one sentence) |
| **Your call** | Only at fork boundaries — A vs B with trade-off |
| **How we will know** | Verifier that gates `done` |

The dial changes **how many blocks are filled + whether a retrieval question is present**, not free-form prose length (05 A-03). Every card has an expand affordance (05 D-01 — *expand on disk*).

| Dial level | Card shape | Context injection |
|------------|-----------|-------------------|
| `max` | Full — all 4 blocks + hint-first question + vulnerability narrative | one-line question + concept link |
| `medium` | Collapsed — `What changed + Why` + expand | badge/pointer |
| `min` | Badge — `What changed` + expand | badge only |
| `silent` | Log line (expandable in log viewer) | nothing |

Example card (disk page `.fence/learn/rls-101.md`):

```markdown
## What changed
Enabled RLS on `public.profiles` + policy `USING (auth.uid() = user_id)`.

## Why
Without RLS any browser `SELECT *` returned every user's rows (04 A-02).

## Your call
— (no fork on this fix; auto-resolved, reported as count at natural stop)

## How we will know
`SELECT * FROM profiles` as anon → 0 rows; `fence validate` green.
```

Delivery only at checkpoint boundaries (task complete / tests green / idle) — never mid-task (S-11/05 A-05); batch-and-defer at natural stops ≤3 items, ≤1 decision per report (05 A-11). First output is a *completed fix*, not a warning (05 D-04).

## Verification

| Check | How |
|-------|-----|
| Card schema | `tools/validate.ts` asserts every `.fence/learn/*.md` carries the 4-block frontmatter; missing block → `warn` |
| Context budget | Byte-cap 4 KB per shell snippet; L1/L2/L3 progressive disclosure; teaching on disk, not in active window (S-03/S-04) |
| Mechanical gate | `Read→Think→Write→Check` + trust ladder `compile→lint→tests×2→generated-tests→judge-for-prose` (S-04); `fence validate` ≤400-token assertion |
| Transfer check | Can user fix a *similar* issue unassisted next time? (05 D-01 Phase 2 probe) |
| Instrument | `plan shown → expanded → revised → accepted` funnel; gate count/session + rolling approval rate (last 20) + card expand rate + undo usage (05 A-06) |
| Token budget | `context-budget.yml` caps for static/dynamic/history/headroom; image tokens billed against `history` headroom (GEM-02 P2) |

Lint skill text: no ungrounded `review your own work` without tool signal (FINAL-v2 M3/S-04; flag `review your.*work|check.*bugs` outside `verifier:` blocks).

## Anti-patterns

- **Do not conflate dial with verbosity** — verbosity is the wrong axis; structure + cognitive forcing beats length (05 A-03/Buçinca N=199; explanations alone can increase overreliance).
- **Do not lecture at `max` or mandate blocking quizzes** — hint-first with timeout; lecturing manufactures learned helplessness; blocking quizzes manufacture fatigue (05 D-01/05 A-06).
- **Do not inject verbose teaching into the active context window** — teaching lives on disk; displaces task context and degrades performance (S-03/S-04/05 A-04).
- **Do not interrupt mid-task** — Mark et al. CHI 2008: interruptions raise stress even when faster (05 A-05); queue to checkpoint/idle.
- **Do not anthropomorphize as teacher authority** — attentive + specific + warm, but *reports what it checked/did not check* rather than claiming teacher role (05 D-04/Qadir & Mumtaz).
- **Do not optimize for engagement** — no confirmshaming, no hidden off-switch, no `cards opened` metric; success = incidents prevented + prediction accuracy (05 A-06; FINAL-v2 S-10 ≤3 gates/session self-awareness).
- **Do not auto-fade without consent** — never reset silently; step down on explicit streak or user opt-in (S-11/05 D-02).
