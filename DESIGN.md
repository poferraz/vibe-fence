---
version: alpha
name: Meta AI — Vibe Fence
description: Glass-on-charcoal Meta harness — the DeepSeek harness architecture reborn in Meta's Web UI language.
colors:
  primary: "#0066FF"
  on-primary: "#FFFFFF"
  secondary: "#8B8FA3"
  tertiary: "#00D4AA"
  on-tertiary: "#0A0A0F"
  neutral: "#0A0A0F"
  neutral-soft: "#14141F"
  surface: "rgba(255,255,255,0.08)"
  surface-strong: "rgba(255,255,255,0.12)"
  border-subtle: "rgba(255,255,255,0.10)"
  danger: "#FF3366"
  on-danger: "#FFFFFF"
  warning: "#FFAA00"
  on-warning: "#0A0A0F"
  success: "#00D4AA"
  on-success: "#0A0A0F"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h3:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.35
  body-md:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: 600
    letterSpacing: "0.08em"
    lineHeight: 1.2
  code:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.5
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 14px
  button-primary-hover:
    backgroundColor: "#0052CC"
    textColor: "{colors.on-primary}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 12px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    rounded: "{rounded.full}"
    padding: 12px
  card-glass:
    backgroundColor: "{colors.surface}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: 20px
  card-solid:
    backgroundColor: "{colors.neutral-soft}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: 24px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px
  approval-bar:
    backgroundColor: "{colors.neutral-soft}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: 16px
  badge-pass:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-success}"
    rounded: "{rounded.full}"
    padding: 6px
  badge-block:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    rounded: "{rounded.full}"
    padding: 6px
  tab-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 8px
  provider-card:
    backgroundColor: "{colors.surface}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: 16px
  nav-item-active:
    backgroundColor: "{colors.surface-strong}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 10px
---

## Overview

Meta glass on charcoal. The DeepSeek harness's everything-is-a-plugin architecture translated into Meta AI's Web UI language: large hero, soft glass surfaces with backdrop-blur, pill buttons, single-field workspace picker, bottom approval bar — the one-command (`npx @meta-ai/dsh web` → `http://127.0.0.1:3100`) surface that makes vibe-coding safe for non-technical users. The harness is invisible; the shield is not.

**Voice:** Calm, precise, non-technical. The fence explains in one line why it blocked and what to do next — never jargon.

## Colors

- **Primary (#0066FF, Meta blue):** Interaction driver — primary actions, active tabs, model provider selection, approval "Allow" state. One high-emphasis color per screen.
- **Tertiary (#00D4AA, Meta teal):** Success/pass — verifier green, fence-look confirmation, `block→pass` transition.
- **Danger (#FF3366):** Block/severity — hard-block verdicts, secret leak intercept, destructive operation denial.
- **Warning (#FFAA00):** Warn/pending approval — soft guards, teaching nudge, queue drafting.
- **Neutral (#0A0A0F, charcoal canvas):** Page background. `neutral-soft (#14141F)` for cards/panels. No pure white pages — glass-on-charcoal everywhere, matching `ai.meta.com` and the Meta AI standalone app.
- **Surfaces:** `surface (rgba 255/8% + blur 16px)` default glass, `surface-strong (12%)` for hover/active, `border-subtle (10%)` for dividers. Backdrop-filter blur is load-bearing for the glass language — never flat opaque on charcoal.
- **On-* tokens:** `on-primary/on-danger/on-tertiary` ensure AA contrast without ad-hoc white.

## Typography

Inter for UI (matching DeepSeek harness docs and Meta AI web). JetBrains Mono for code/logs/tool output — same pairing as `dsh` package READMEs. Tight tracking on display (`-0.02em` h1), default on body. `label-caps` at `0.08em` for section labels (WORKSPACE, MODELS, ACTIVITY) — mirrors `dsh` Providers page label hierarchy.

## Layout

4px baseline. `xs 4` micro-gaps (badge padding), `sm 8` intra-component, `md 16` inter-component, `lg 24` panel gutters, `xl 32` section breaks, `2xl 48` page margins, `3xl 64` hero spacing. Web UI is a centered column (max 1120px) with a sticky left rail (workspace + model cards) and a main session column — same proportions as `dsh web` on `:3080`.

## Elevation & Depth

Flat plus one. Charcoal canvas is matte (`neutral`). Glass cards carry `backdrop-filter: blur(16px)` + `border: 1px solid border-subtle` — no drop shadows. Approval bar is the only elevated surface: `backdrop-filter: blur(20px)` + `border-top` divider, pinned to the viewport bottom (matching `dsh` approval policy modal position). Session log has no elevation — transparent rows on canvas.

## Shapes

`sm 8px` on inputs, `md 12px` on panels, `lg 16px` on major cards, `xl 24px` on hero/approval/modal, `full 9999px` on pills, tabs, badges. Buttons are always pill (`full`). Cards are never pill. Workspace avatar is `full` (circular).

## Components

- `button-primary` — single CTA per screen (e.g. "Allow", "Add workspace", "Save key"). Pill, solid primary. Hover deepens to `#0052CC`.
- `button-ghost` — secondary (Cancel, Dismiss, Skip). Glass surface, primary text. No border.
- `button-danger` — destructive confirm (Block, Revoke). Solid danger.
- `card-glass` — default surface (workspace card, model provider card, session message). Glass + subtle border + blur.
- `card-solid` — panel surface (left rail, settings drawer). `neutral-soft` opaque, no blur.
- `input-field` — single-field inputs (workspace path, API key). Glass, placeholder at `secondary`, focus ring `2px solid primary` (not in token — in CSS).
- `approval-bar` — bottom approval modal. `neutral-soft` + blur 20 + top divider. Contains intent line + Allow/Deny pills.
- `badge-pass` / `badge-block` — verifier verdict chips (pass=teal, block=rose). Pill, small text.
- `tab-active` — segment control (Models: Meta AI / Custom API). Pill, primary fill.
- `provider-card` — model provider card (mirrors `dsh` Providers page: id, models list, key field). Glass.
- `nav-item-active` — left-rail nav selection. `surface-strong`, 12% glass.

## Do's and Don'ts

- **Do** use glass (`surface` + blur) on charcoal — never flat white cards on a dark canvas.
- **Do** keep one `button-primary` per approval/modal — secondary is always `button-ghost`.
- **Do** write the workspace picker as a single field + folder icon — one click to add, one to select (mirrors `dsh web` "Choose workspace").
- **Do** mirror `dsh` Providers UX for model config: provider cards with id + models + eye-toggle key field, `apiKeyEnv: META_API_KEY` fallback, masked key display after save.
- **Don't** nest component variants — `button-primary-hover` is a sibling, not a child.
- **Don't** use flat shadows for elevation — blur + border is the depth language.
- **Don't** invent colors outside the palette — expand `colors` first and lint.
- **Don't** ship a modal without its `approval-bar` bottom position — centered modals break the dsh interaction grammar.
