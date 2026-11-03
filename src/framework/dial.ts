/**
 * src/framework/dial.ts
 * S-11 — Teaching dial is scaffolding fade (max→medium→min→silent), per-domain vector in
 *   .fence/state/dial.json even if v1 UI shows one global knob. Fixed-schema card
 *   (What changed · Why · Your call · How we'll know) with expand; teaching on disk
 *   (.fence/learn/*.md), pointer only in context; delivered at checkpoint boundaries, never mid-task.
 * S-07 — Teaching dial is a rule-count dial; p^n joint reliability (CCI factorial).
 * GEM-02 — State eviction TTL+LRU: 7-day prune; per-task ephemeral keys at checkpoint boundaries.
 * Anti-patterns: §6 #7 (no ungrounded self-critique lint), #8 (agent must not relax own teaching gate).
 * Sources: 05 A-01/A-03/A-05, 02 D-04/C-05, deepseek 05 (vector store), minimax 05 (card schema).
 */

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types — Teaching Dial Vector Schema
// ---------------------------------------------------------------------------

/** Global knob positions — user-facing single slider. */
export type DialLevel = "max" | "medium" | "min" | "silent";

/** Per-domain vector — underlying store even when UI shows one knob (S-11). */
export type DialDomain =
  | "security"      // secrets, injection, auth, headers
  | "structure"     // file layout, naming, git hygiene
  | "testing"       // test scaffolding, verifier ladder
  | "deployment"    // env isolation, deploy gates
  | "dependencies"  // supply-chain, lockfile, audit
  | "privacy"       // data minimization, consent, PII
  | "general";      // fallback for uncategorized teaching

/** Per-domain level + metadata. */
export interface DomainDialEntry {
  level: DialLevel;
  updatedAt: string; // ISO-8601
  reason: string;    // why this level — e.g. "auto-fade after 3 clean sessions" or "user set"
}

/** Persisted dial state — .fence/state/dial.json */
export interface DialState {
  version: 1;
  /** Global knob — maps to all domains unless overridden per-domain. */
  global: DialLevel;
  /** Per-domain overrides — absent = inherits global. */
  vector: Partial<Record<DialDomain, DomainDialEntry>>;
  /** Learning artefacts — pointers to .fence/learn/*.md (never inline in context). */
  learnPointers: string[]; // relative paths to .fence/learn/*.md
}

/** Fixed-schema teaching card (S-11). */
export interface TeachingCard {
  whatChanged: string;  // What changed
  why: string;          // Why
  yourCall: string;     // Your call
  howWeWillKnow: string; // How we'll know
  expandPath: string | null; // .fence/learn/<topic>.md — detailed teaching on disk, pointer only in context
  // TODO: add evidence_ids for deterministic grounding — every claim cites a check or source
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DIAL_STATE_PATH = ".fence/state/dial.json";
export const LEARN_DIR = ".fence/learn";
export const ALL_DOMAINS: readonly DialDomain[] = [
  "security",
  "structure",
  "testing",
  "deployment",
  "dependencies",
  "privacy",
  "general",
] as const;

/** Maps global knob to per-domain default — v1 all domains follow global. */
export const GLOBAL_TO_VECTOR: Record<DialLevel, DialLevel> = {
  max: "max",
  medium: "medium",
  min: "min",
  silent: "silent",
};

// ---------------------------------------------------------------------------
// Dial I/O
// ---------------------------------------------------------------------------

function defaultDialState(): DialState {
  return {
    version: 1,
    global: "max", // S-11 — default is max (visible teaching), fade is opt-in
    vector: {},
    learnPointers: [],
  };
}

export function loadDialState(projectRoot: string): DialState {
  const p = join(projectRoot, DIAL_STATE_PATH);
  if (!existsSync(p)) return defaultDialState();
  // TODO: validate schema version; migrate if needed
  return JSON.parse(readFileSync(p, "utf-8")) as DialState;
}

export function saveDialState(projectRoot: string, state: DialState): void {
  const p = join(projectRoot, DIAL_STATE_PATH);
  // TODO: atomic write (tmp + rename); ensure .fence/state/ exists
  writeFileSync(p, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

/**
 * Resolve effective level for a domain — per-domain override or global fallback.
 * S-11 — vector store underneath, one global knob UI.
 */
export function effectiveLevel(state: DialState, domain: DialDomain): DialLevel {
  return state.vector[domain]?.level ?? state.global;
}

/** Project-root overload — loads state then delegates to effectiveLevel. */
export function getEffectiveLevel(projectRoot: string, domain: DialDomain): DialLevel {
  const state = loadDialState(projectRoot);
  return effectiveLevel(state, domain);
}

/**
 * Set global knob — updates all domains that have no explicit override.
 * S-11 — one global knob UI over vector store.
 */
export function setGlobalLevel(projectRoot: string, level: DialLevel, reason: string): DialState {
  const state = loadDialState(projectRoot);
  state.global = level;
  // TODO: log to events.ndjson — { type: "dial:global", level, reason, at }
  // TODO: do not overwrite per-domain overrides — they are intentional diverges
  void reason;
  saveDialState(projectRoot, state);
  return state;
}

/**
 * Set per-domain level — explicit override.
 * S-11 — per-domain vector; used for auto-fade or user drill-down.
 */
export function setDomainLevel(
  projectRoot: string,
  domain: DialDomain,
  level: DialLevel,
  reason: string,
): DialState {
  const state = loadDialState(projectRoot);
  state.vector[domain] = { level, updatedAt: new Date().toISOString(), reason };
  // TODO: log to events.ndjson
  saveDialState(projectRoot, state);
  return state;
}

// ---------------------------------------------------------------------------
// Teaching card — fixed schema, delivered at checkpoint boundaries (S-11)
// ---------------------------------------------------------------------------

/**
 * Build a teaching card for a completed checkpoint.
 * S-11 — fixed-schema card (What changed · Why · Your call · How we'll know) with expand on disk.
 * Anti-sycophancy: include Senior-Partner directive — "Do not validate bad technical practices to be polite."
 * Delivery: at checkpoint boundaries, never mid-task.
 */
export function buildTeachingCard(
  _projectRoot: string,
  _domain: DialDomain,
  _context: { action: string; diffSummary: string },
): TeachingCard | null {
  const state = loadDialState(_projectRoot);
  const level = effectiveLevel(state, _domain);
  if (level === "silent") return null; // silent = skip model call entirely (S-13 / GEM-09)

  // TODO: check level to determine verbosity:
  //   max    → full card with expand link
  //   medium → card without expand
  //   min    → one-line nudge only
  //   silent → null (no teaching)
  // TODO: write expand content to .fence/learn/<topic>.md and set expandPath pointer
  // TODO: enforce "delivered at checkpoint boundaries, never mid-task" — caller must be checkpoint handler

  return {
    whatChanged: "TODO",
    why: "TODO",
    yourCall: "TODO",
    howWeWillKnow: "TODO",
    expandPath: null,
  };
}

// ---------------------------------------------------------------------------
// State eviction — TTL + LRU (GEM-02 P2)
// ---------------------------------------------------------------------------

/**
 * State eviction policy (GEM-02 P2) — TTL + LRU note.
 *
 * Contract:
 * - Entries in .fence/state/dial.json and .fence/learn/*.md older than 7 days
 *   without a touching commit are pruned on next `fence validate`.
 * - Per-task ephemeral keys (last-5-observation window, verifier-ephemeral)
 *   are pruned at checkpoint boundaries.
 * - Document retention contract in docs/project/BOUNDARIES.md (TODO).
 *
 * This is a P2 — implement pruning logic in tools/validate.ts; this file declares the policy.
 */
export interface EvictionPolicy {
  ttlDays: number;
  ephemeralKeys: string[];
  pruneTrigger: "fence-validate" | "checkpoint-boundary";
}

export const EVICTION_POLICY: EvictionPolicy = {
  ttlDays: 7,
  ephemeralKeys: ["last-5-observation", "verifier-ephemeral", "last-5-pruning"],
  pruneTrigger: "fence-validate",
};

/**
 * Prune stale dial entries — entries not touched in ttlDays.
 * GEM-02 — TTL+LRU eviction for .fence/state/*.json.
 * TODO: implement — compare entry updatedAt against git log --since="7 days ago" touching commits
 * TODO: also prune .fence/learn/*.md files whose dial entry was evicted (orphan cleanup)
 */
export function pruneStaleEntries(projectRoot: string, ttlDays = EVICTION_POLICY.ttlDays): string[] {
  const state = loadDialState(projectRoot);
  const cutoff = Date.now() - ttlDays * 24 * 60 * 60 * 1000;
  const pruned: string[] = [];

  for (const [domain, entry] of Object.entries(state.vector) as [DialDomain, DomainDialEntry][]) {
    const updatedAt = new Date(entry.updatedAt).getTime();
    if (updatedAt < cutoff) {
      // TODO: check if any commit in last ttlDays touched files related to this domain
      // For now, stub — real impl needs git log correlation per domain
      void cutoff;
      // delete state.vector[domain];
      // pruned.push(domain);
    }
  }

  // TODO: if pruned.length > 0, saveDialState + log to events.ndjson
  void projectRoot;
  return pruned;
}

/**
 * Prune ephemeral keys at checkpoint boundaries.
 * Called by checkpoint() in git.ts after successful checkpoint commit.
 */
export function pruneEphemeralKeys(_projectRoot: string): void {
  // TODO: clear last-5-observation window and verifier-ephemeral keys from .fence/state/
  // TODO: ensure ACID artefacts (.fence/verdicts/) are NOT pruned — they are audit trail
}
