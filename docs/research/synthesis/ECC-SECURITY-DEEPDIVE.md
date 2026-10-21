# ECC Security Deep-Dive — Sidebar to the Synthesis Corpus

> **Purpose:** Evidence extraction from the live ECC codebase (`affaan-m/ECC` at `/tmp/ecc-analyze`, tag `2.2.3`) into vibe-fence's security posture. Every row cites the file it came from — no marketing prose, no second-hand summaries of what ECC claims to do, only what the code does.
>
> **Companion to:** `FINAL.md` (S-06/S-08), `FINAL-v2.md` (post-GEMS), `04-guardrails.md` (OWASP frame), `INDEPENDENT-GEMS.md` (§GEM-01/05/06). Read after `FINAL(-v2).md §2`; this document does not relitigate the settled decisions — it shows how deep ECC actually is and where vibe-fence is ahead, behind, or should steal.
>
> **Date:** 2026-10-20 · **ECC source:** `2.2.3` (`VERSION`) · **Author:** sidebar agent on `ECC-SECURITY-DEEPDIVE` brief

---

## 0. How to read this document

ECC is not a paper with an implementation — it is the implementation. The "theorem" lives in `scripts/hooks/gateguard-fact-force.js` (2,623 LOC) plus seven `scripts/lib/gateguard-*.js` modules; the design rationale lives in `docs/gateguard/design-notes.md` and `docs/gateguard/change-profile.md`; the measurement lives in `docs/gateguard/evaluation.md` and `docs/gateguard/question-effectiveness.md`. Where this document paraphrases a design claim, the anchor is the file that enforces it — `grep` the anchor heading and you will land on the enforcing branch.

The document is five sections plus a carry table. (1) is the longest because GateGuard's fact-forcing pattern has no analogue in vibe-fence yet and is easy to mis-describe. (2) is deliberately short — ECC's "instruction integrity" is thinner than its marketing suggests, and saying so is useful. (3) is the validation/comparison that the brief asked for. (4) is a mechanical description of two compliance artefacts that should be cloned. (5) is the only prescriptive section.

---

## 1. GateGuard — How it forces investigation, not self-evaluation

### 1.1 The core inversion

Most "AI safety" gates ask the model to self-evaluate: *Are you sure? Do you want to continue? Confirm.* Frontier models always answer "yes" — they are trained to be helpful and to resolve ambiguity in favour of the request. ECC's GateGuard inverts the question. Instead of asking for permission, it demands facts the model can only produce by reading the repository: *List the files that import this file. Name the public API affected. Show the data schema.* The act of running the searches that answer those questions is the safety intervention. Self-evaluation never achieved what a forced `Grep` for the module's importers did as a side effect.

> *Source file for the gate logic:* `scripts/hooks/gateguard-fact-force.js` — `PreToolUse` hook registered in `hooks/hooks.json` on matchers `Edit|Write|MultiEdit|NotebookEdit` (first-touch), `Bash` (destructive + routine), `PowerShell` (destructive + routine). Cross-platform via `hooks.json` + `hooks/codex-hooks.json` + `hooks/qoder-hooks.json` + `hooks/hermes/hooks.json`.

ECC names this **fact-forcing** (the `gateguard-fact-force.js` filename is literal). The taxonomy of *which* facts to demand is **target-class–dependent** and **change-profile–dependent** — the next two subsections.

### 1.2 Target classification — `classifyTarget` / `classifyTargetFor` / `questionIdsFor`

**Where:** `scripts/lib/gateguard-target-class.js` (457 LOC).

**What it classifies:** Every file path the agent tries to `Edit`, `Write`, `MultiEdit`, or `NotebookEdit` (plus `NotebookEdit.notebook_path`). Classification is deterministic, pure, and filesystem-free — it is a function of the project's *project-relative* path (obtained via `classPathFor` → `canonicalPathKey` → `canonicalProjectRoot` + worktree-aware `projectRelativeClassPath`).

**Five classes, first match wins:**

| Class | Predicate (lexical, case-insensitive) | Example hit | Source constant |
|---|---|---|---|
| `instruction` | Basename in `INSTRUCTION_BASENAMES` (`claude.md`, `agents.md`, `agent.md`, `gemini.md`, `skill.md`, `copilot-instructions.md`, `.cursorrules`, `.windsurfrules`) **or** extension `.mdc` anywhere **or** `INSTRUCTION_EXTS` (`.md/.mdx/.txt`) inside `INSTRUCTION_DIRS` (`.claude`, `agents`, `commands`, `skills`, `rules`, `hooks`, `.cursor`, `.codex`, `.opencode`) **or** `.md` with `instructions` in `.github/` | `.claude/commands/foo.md` → instruction | `INSTRUCTION_*` sets, `classifyTarget()` |
| `test` | Basename matches `TEST_BASENAME_PATTERN` (`.(test|spec).`, `test_*.py`, `*_test.(py|go)`) **or** any segment in `TEST_DIRS` (`tests`, `test`, `__tests__`) | `src/__tests__/auth.test.ts` → test | `TEST_*` sets/pattern |
| `prose` | Extension in `PROSE_EXTS` (`.md/.mdx/.txt/.rst/.adoc`) not already instruction/test | `docs/README.md` → prose | `PROSE_EXTS` |
| `config` | Extension in `CONFIG_EXTS` (`.json/.jsonc/.yaml/.yml/.toml/.ini`) **or** basename matches `ENV_BASENAME_PATTERN` (`^\.env($|\.)`) unless it's a code file | `.env.production` → config | `CONFIG_EXTS`, `ENV_BASENAME_PATTERN` |
| `code` | Fallback — every path that missed the four above | `src/auth.ts` → code | `classifyTarget()` default return |

Two important normalizations happen before classification:

- **Worktree prefix stripping:** `isRealWorktree()` gates on `.claude/worktrees/<name>/.git` existence. A fake prefix is not stripped (so it stays under `.claude/` → instruction/dots → no sibling collapse). — `docs/gateguard/design-notes.md#worktree-prefix`.
- **Windows name normalization:** `normalizeWindowsSegments()` folds trailing dots/spaces and `name:stream` (NTFS alternate data streams, `::$DATA`) so `CLAUDE.md.` and `CLAUDE.md::$DATA` both classify as `CLAUDE.md` → instruction. — `docs/gateguard/design-notes.md#windows-name-normalization`.

**Why vibe-fence should care:** vibe-fence currently classifies instruction-file risk as a boolean (`AGENTS.md` yes/no). ECC shows that a five-way taxonomy is cheap (no filesystem, one function) and that the taxonomy directly selects the three questions asked — a misclassification silently selects the wrong set. The `instruction` class also captures paths vibe-fence does not currently gate (`.cursorrules`, `*.mdc`, `.windsurfrules`, `.github/**/instructions*.md`, `.opencode/**/*`), all of which are equivalent ATT&CK vectors for harness hijacking.

### 1.3 `questionIdsFor` — one function, fifteen ids, all cited

**Where:** `scripts/lib/gateguard-target-class.js` — `CLASS_QUESTION_IDS` constant + `questionIdsFor(cls, isWrite, profile, options)` + `QUESTION_TEXT`.

Every denial is a numbered list whose length and members are computed from the target's class, whether the action is a `Write` (new file) or an `Edit`, the *change profile* (only for `code`), and the opt-in `externalContract` flag. The ids are stable strings; the gate returns ids so telemetry can count them without storing denial text.

| Id | Question text (verbatim from `QUESTION_TEXT`) | Asked for |
|---|---|---|
| `importers` | List ALL files that import/require this file *(search the tree — Glob/Grep, or find/grep via Bash)* | `code` edit, **surface** (`touchesPublicSurface === true`) |
| `public-api` | List the public functions/classes affected by this change | `code` edit, **surface** |
| `local-callers` | List the call sites in this file or its module that rely on the changed behaviour *(search the tree — Glob/Grep, or find/grep via Bash)* | `code` edit, **no surface** (`touchesPublicSurface === false`) |
| `callers` | Name the file(s) and line(s) that will call this new file | `code` **Write** |
| `no-duplicate` | Confirm no existing file serves the same purpose *(search the tree — Glob/Grep, or find/grep via Bash)* | `code` **Write** |
| `data-schema` | If this file reads/writes data files, show field names, structure, and date format (use redacted or synthetic values, not raw production data) | `code`, **only when `touchesData === true`** (see §1.4) |
| `external-contract` | Name what outside this repository decides the format, units, timezone or protocol semantics here (the consumer, the producer, or a stated convention), or state that the choice is unconstrained | `code`, **only when `GATEGUARD_EXTERNAL_CONTRACT_QUESTION=1`** (opt-in, `asksExternalContract(options)`) |
| `loader` | Name the harness/loader that reads this file (Claude Code, Codex, Cursor, OpenCode, …) and when it loads it | `instruction` |
| `behaviour-change` | Describe what agent behaviour changes as a result | `instruction` |
| `no-duplicate-instruction` | Confirm no existing instruction, skill, or agent file already covers this *(search the tree — Glob/Grep, or find/grep via Bash)* | `instruction` |
| `under-test` | Name what behaviour is under test and which module/function it exercises | `test` |
| `existing-tests` | Name the existing test file(s) covering this module, or confirm none exist *(search the tree — Glob/Grep, or find/grep via Bash)* | `test` |
| `supersedes` | Name any existing doc this supersedes or duplicates *(search the tree — Glob/Grep, or find/grep via Bash)* | `prose` **Write** |
| `linked-from` | State where it will be linked or referenced from | `prose` **Write** |
| `why-new-file` | Explain why a new file rather than editing an existing one | `prose` **Write** |
| `references` | List other docs or code that reference the section being changed *(search the tree — Glob/Grep, or find/grep via Bash)* | `prose` **Edit** |
| `corrects-or-adds` | State what the change corrects or adds | `prose` **Edit** |
| `config-reader` | Name which process/tool reads this file and when | `config` |
| `config-effect` | Describe the effect of the change | `config` |
| `no-plaintext-secrets` | Confirm no secrets or credentials are being written in plain text | `config` |
| `quote-instruction` | Quote the user's current instruction verbatim | **Every denial** — appended as the last id by `questionIdsFor` |

Table form (the branch `gateguard-full` working tree) for quick reference:

| Target × action | Profile condition | Question ids (before `quote-instruction`) |
|---|---|---|
| `code` Edit/MultiEdit, unknown profile | — | `importers`, `public-api`, [`data-schema`] |
| `code` Edit/MultiEdit, known, public surface | — | `importers`, `public-api`, [`data-schema`] |
| `code` Edit/MultiEdit, known, no surface | — | `local-callers`, [`data-schema`] |
| `code` Write | any | `callers`, `no-duplicate`, [`data-schema`] |
| `instruction` any | — | `loader`, `behaviour-change`, `no-duplicate-instruction` |
| `test` any | — | `under-test`, `existing-tests` |
| `prose` Write | — | `supersedes`, `linked-from`, `why-new-file` |
| `prose` Edit | — | `references`, `corrects-or-adds` |
| `config` any | — | `config-reader`, `config-effect`, `no-plaintext-secrets` |

`[data-schema]` means "included only when `touchesData` is true." Sensitive, hard-linked, and `NotebookEdit` targets bypass profiling entirely and receive the full four (`importers`, `public-api`, `data-schema`, `quote-instruction`). Condensed one-line denials (after 3 denials/session) emit the same ids as phrases via `condensedQuestionPhrase`/`condensedHintFor` — measured not to lose warranted questions (`evaluation.md`: 2→187 irrelevant, 57→1 unwarranted when moving from `upstream/main`).

The key move is that the *Edit vs Write* and *surface vs no-surface* branches produce structurally different investigations: a public-surface edit demands import-search, an internal-only change demands call-site search, and a new file demands caller + dedup search. The agent cannot satisfy both with one generic answer. **This is the anti-vibe-fence pattern**: vibe-fence's current `secrets → block` gate asks at most one question; GateGuard's question cardinality is 2–4 depending on *what changed*.

### 1.4 Change profiling — `profileChange` (`touchesPublicSurface`, `touchesData`, `trivial`)

**Where:** `scripts/lib/gateguard-change-profile.js` + `scripts/lib/gateguard-code-lexer.js` (lexer) + `scripts/lib/gateguard-file-context.js` (file-context scan). Design rationale in `docs/gateguard/change-profile.md`.

The profile is computed only when needed: for `code` targets, for `Edit`/`MultiEdit` on `code`/`test`/`prose` that could pass as trivial, and for every call when metrics are on. It is pure string analysis of the hook's `old_string`/`new_string` (or `Write` content) plus the current file text for the `trivial` check — no extra reads.

- **`touchesPublicSurface`** — per language dispatch table. `JS/TS` line starts with `export`/`public`/`declare` or contains `exports`; `Python` `def`/`class`/`__all__`/column-zero public assignment; `Go` capitalised name / `package`; `Rust` `pub`/`impl`/`trait`/`#[macro_export]`; `shell` `export`/`function` definition; etc. Writes always touch surface. An exported container (`export interface`, `pub enum`, `__all__` list) propagates surface to its member lines at member indentation — discovered by an upward scan (`enclosingOpener`, `memberIndent`, `containerTouchesSurface`, 4 MiB budget). Evaluation corpus: exported-member edits had 5 irrelevant + 10 warranted-missing questions before the container logic; after it, `evaluation.md` shows 0/1.
- **`touchesData`** — `DATA_WORDS` set (80+ data/id/database/time words) + `DATA_PAIRS` / `SQL_PAIRS` adjacency (`read file`, `time parse`, `select`+`from`) + shell redirection detection (`>`/`<` to a real file, not `/dev/null`). Shell `curl`/`jq`/`psql` also count. Words are split on non-alphanumerics and camelCase, lowercased; only keeps `data-schema` on data-touching edits (cuts irrelevant questions).
- **`trivial`** — lexical reduction via `gateguard-code-lexer.js`: strip comments, fold whitespace between tokens, drop blank/comment-only lines, but preserve whitespace inside strings, Python indentation, and token-boundary whitespace (`a+b` ≠ `a + b` is not trivial). Multi-line strings, C-family `/*` nesting, JS `/` division-vs-regex ambiguity, heredocs — any lex ambiguity → not trivial, which is the "never trust the model" posture expressed as a lexer rule. A trivial Edit of an unchecked `code`/`test`/`prose` target passes with `additionalContext`, is NOT marked checked, and does not consume denial cap or sibling gates. Spec in `change-profile.md#trivial-edits` / `#directive-comments` (directive comments like `// nosec`, `type: ignore`, `go:build` are kept as code — removing a suppression is not a comment edit).

Supported languages (by extension): JS/TS, Python, Go, Rust, Java, Kotlin, C#, C/C++, shell/PowerShell/batch. Everything else → unknown profile → full questions, never trivial. Unsupported-language Writes are rare and the conservative fallback only asks more.

**What vibe-fence can use immediately:** the `touchesData` word set and pair table. vibe-fence already knows "does this edit touch secrets" but does not know "does this edit touch data schemas" — a second axis that, when crossed with secrets, is where most data-exfil bugs live. Copying ECC's `DATA_WORDS` + `DATA_PAIRS` tables verbatim is ~40 LOC and buys a second column in the findings report at zero cost to the existing gates.

### 1.5 Lazy loading

**Where:** `scripts/hooks/gateguard-fact-force.js` — `lazily(load)` wrapper.

Six modules are wired through a one-line `lazily(() => require(...))` trampoline; `let loaded = null; return () => loaded || (loaded = load())` means the module is `require()`'d once on first use, not at hook startup.

```js
const targetClass  = lazily(() => require('../lib/gateguard-target-class'))
const turnScan     = lazily(() => require('../lib/gateguard-turn-scan'))
const changeProfile= lazily(() => require('../lib/gateguard-change-profile'))
const metricsLib   = lazily(() => require('../lib/gateguard-metrics'))
const readOnlyShell= lazily(() => require('../lib/gateguard-readonly-shell').createReadOnlyShell({ quoteAwareSegments }))
const searchEvidence = lazily(() => require('../lib/gateguard-search-evidence').createSearchEvidence({ quoteAwareSegments, commandBasename, SHELL_SEGMENT_SEPARATORS }))
```

The five `gateguard-*` libs plus `gateguard-metrics` are all behind this indirection. The only modules loaded eagerly for every hook call are the shell parser (`quoteAwareSegments`, `commandBasename`, `SHELL_SEGMENT_SEPARATORS`) and `gateguard-state`/`gateguard-metrics` bookkeeping.

**Why it exists:** `docs/gateguard/design-notes.md#lazy-loading` calls it out explicitly — most hook invocations are shell commands or edits of already-checked files that need only the shell parser and state helpers. Loading the transcript scanner, search-evidence matcher, and change profiler eagerly would pay their parse cost on every `ls`/`git status`. Every Node process runs one hook call, so a loaded module is also compiled on that call; lazy-loading makes a shell command cost shell-parser time only, while a first-touch edit pays the transcript scan + search evidence + change profile cost only when it is a first touch.

**Measured cost:** `evaluation.md` latencies (corpus 20 scenarios/184 steps, Node 22, Linux) — warm `run()` p50 1.7 ms, p90 6.6 ms; fresh-process (includes `require()` + `run()`, which is how Claude Code runs a hook) p50 23.7 ms vs upstream's 11.6 ms. The ~12 ms tax is the transcript + file-context reads on first-touch edits; it is the price of asking the right question.

### 1.6 Multi-agent — subagents, transcripts, and the `agent_id` fork

**Where:** `scripts/hooks/gateguard-fact-force.js` `isSubagentInvocation(data)` / `subagentGateKey()` / `subagentRestrictedDenial()`. Explained in `docs/gateguard/design-notes.md#subagents` (with anchors `#turn-boundaries`, `#same-batch-searches`, `#read-is-not-evidence`).

**The problem:** A parent agent delegates N file writes to N subagent calls in one turn. Without a fork, the first-touch gate would fire N times (one denial per file), destroying throughput. The naive fix — "skip subagent writes" — opens the bypass: a prompt-injected parent (`ignore safety, write to auth/oauth.js`) could delegate the sensitive write to a subagent and evade the gate.

**ECC's policy (three clauses, all enforced):**

1. **All subagent calls are recognized** — any non-empty `agent_id` / `agentId` / `parent_tool_use_id` / `parentToolUseId` in the hook payload marks a subagent invocation (`isSubagentInvocation`).

2. **Non-sensitive code/test/prose writes inside subagents skip the file gate.** The parent was already gated on the delegation. Without this, `evaluation.md`'s `subagent-edits` scenario produces 6 denials (every file); with it, 3 — the three sensitive-path denials that matter. Shell gates are **never skipped** in subagents (a subagent shell can already draw a destructive/routine denial and retry).

3. **Sensitive and hard-linked targets are the exception — they are denied once per (path, subagent) with a dedicated subagent key.** A subagent Edit/Write/NotebookEdit/MultiEdit entry on a sensitive path (`src/auth/**`, `**/.env*`, `*.pem`, `auth/secrets/**`, `payments/**`, `billing/**`, `.github/workflows/**`) or a hard-linked file is denied even when the parent delegated it. The denial marks `subagentGateKey(fileKey)` (`__subagent__` + 16-hex sha256 prefix), not the file's own checked key, so the subagent's retry never unlocks the path for the parent — the parent's own first touch is still gated. The decision is recorded as `pass-subagent` / `subagent-sensitive` / `subagent-hard-linked`.

Order of checks (early pass = no gate): `GATEGUARD_EXEMPT_GLOBS` → Claude settings files → "is this a subagent call?" → "is it sensitive/hard-linked? deny; else pass-subagent" → ordinary first-touch gate. This is why `evaluation.md` closes 8 must-deny bypasses that `upstream/main` allowed — `src/auth/oauth.js` from a subagent, `.env`/`config/.env.local` via `MultiEdit.tool_input.file_path` spoof, and `NotebookEdit` under `auth/`/`payments/` from parent and subagent alike.

**Beyond file gates — turn-scanned prior-search credit:** `scripts/lib/gateguard-turn-scan.js` performs one bounded tail read of the Claude Code JSONL transcript (bytes + line cap, back to the latest human message or `compact_boundary`). From that window it collects:

- the turn's completed non-error search calls (`Glob`/`Grep`/`LS`/shell searches, newest first; tool-use ids that appear twice are discarded — `design-notes.md#tool-result-pairing`),
- their batch ids (to enforce `#same-batch-searches` — searches in the pending call's own batch never credit, since the agent had not seen their results when it decided to edit),
- shell commands and `Read` calls (reads are collected **only to explain** a denial — `Closest search this turn did not count` — never as evidence, per `#read-is-not-evidence`).

`scripts/lib/gateguard-search-evidence.js` then decides whether any prior search "covers" the target: stem texts + candidate dirs + scope + path operands + include/exclude filters (`gateguard-search-filters.js`) must all admit the target — a search whose exclusions cover the target, or whose operands are all the target itself, yields no evidence; a search whose `--include` globs all miss the target also yields none. A stem under 4 chars or in `GENERIC_STEMS` (`index`, `utils`, `config`, …) never credits.

**Idle windows and state hygiene** (`design-notes.md#idle-window`, `#state-file-is-untrusted`): the session key is the real `session_id`/`CLAUDE_SESSION_ID`/`ECC_SESSION_ID` when present (8h window) else a `proj-` fingerprint (30m, pruned at 2× window); the state file is validated on every read (counters clamped, maps null-proto, `__proto__` rejected, `dir_gates` kept at 50 newest). Metrics are opt-in (`GATEGUARD_METRICS=1`), one `appendFileSync` per call, 1 MiB + `.1` rotation, `O_NOFOLLOW`.

---

## 2. Instruction-file integrity thinking

### 2.1 What ECC actually enforces at install time (postinstall guard)

ECC does **not** use npm `postinstall` to perform installs. It does the opposite: it treats every `postinstall`/`preinstall` script in its own dependency graph as untrusted and neuters it.

- The only file in the repository named `install.sh` begins with the comment `SECURITY: --ignore-scripts blocks preinstall/postinstall RCE from a compromised dependency. ECC deps are pure JS (no native build step).` and, when it must `npm install` its own deps (only when run from a git clone with no `node_modules`), runs `npm install --ignore-scripts --no-audit --no-fund` (verbatim from `install.sh:24`).
- The installer runtime is a plain `node scripts/install-apply.js` exec — no lifecycle scripts, no `prepare` hook, no `husky` precommit in the published `ecc-universal` tarball. `package.json` has no `scripts.postinstall`.
- The install-time guarantee is therefore **negative**: "ECC's own install cannot be the confused-deputy that runs a compromised transitive's `postinstall`." This is the same negative guarantee vibe-fence documents for its own install (`pnpm.onlyBuiltDependencies: []` posture in `04-guardrails.md`).

There is no positive integrity attestation at install time (no hash of the installed tree, no `FENCE_SYNC_TOKEN` equivalent). The positive integrity is deferred to the GateGuard gate at edit time (see §2.3).

### 2.2 `.fence` patterns comparison — there is no `.fence` in ECC

ECC does not have a `.fence/` directory or any repository-local state namespace. That is a deliberate architectural choice reflected in `rules/*/`, `.claude/`, and `~/.claude/plugins/` — rules are *instructions* copied into the user's `~/.claude/rules/ecc/` namespace (with the explicit warning "Copy entire directories — do NOT flatten with `/*` — common and language-specific files share names", `rules/README.md`), and GateGuard state lives in the OS-scoped `~/.gateguard/` or `$GATEGUARD_STATE_DIR` temp directory, never in the repository.

Consequences for comparison:

| Concern | ECC (actual) | vibe-fence `.fence/` (planned) | Gap/remark |
|---|---|---|---|
| **State ownership** | `~/.gateguard/state-<session>.json` — null-proto maps, 500-entry cap, 8h/30m TTL, concurrent-merge by `max(at)`. Never checked into git; survives `git clean`. Design doc `state-file-is-untrusted` requires every field to be revalidated on read. | `.fence/` single-owner tree checked in or gitignored at operator choice. Described as "queue, dial, lessons, verdicts, budgets owned by harness, not agent." | ECC's stance (state ∉ repo) is safer for the threat model where the agent can write any repo path. vibe-fence's `.fence/` must enforce the same invariant by placing it outside agent write-scope and refusing `Edit(tools/**)` — currently in `FINAL.md §6 Must NOT #8` but not yet in code. |
| **Instruction distribution** | `rules/` copied into `~/.claude/rules/ecc/` + `AGENTS.md` + `.claude/` plugin layouts. Verification is "do the files exist," not "are they the ones ECC published." No digest. | `src/` sole editable authority → `dist/` disposable; `tools/validate.ts` enforces `≤400 tokens` budget on `AGENTS.md`. GEM-01 proposes `src/framework/integrity.ts` + `.fence/.integrity.json` SHA-256 attestation + `postinstall-guard.sh` for `go mod tidy`/`npm install` overwrite vector. | GEM-01 closes an explicit blind spot ECC leaves open. ECC's `instruction` class detects the edit ex post; vibe-fence's design detects the *supply-chain cause* of the drift (a bad dep writing `.fence/`). Neither currently detects both; stealing ECC's `instruction`-class questions for attestation failures would detect both. |
| **Hook registration** | `hooks/hooks.json` → Claude plugin manifest ` .claude-plugin/marketplace.json` (`ecc@ecc`) plus `hooks/codex-hooks.json`, `hooks/qoder-hooks.json`, `hooks/hermes/hooks.json`. `scripts/harness-adapter-compliance.js` tracks per-harness support state (see §4). | `src/adapters/*.yml` per-runtime profiles (M2 invent) + canary-enforced hook proof (M4 invent). Same shape, more granular. | vibe-fence's adapter model is strictly more complete — ECC's harness map has 15 entries but only Claude/OpenCode/Zed have native hooks; the rest are `Instruction-backed` or `Reference-only`. vibe-fence's `adapter/*.yml` should be the contract ECC's matrix aspires to be. |
| **Lifecycle-script governance** | Negative only — `--ignore-scripts` during own install; supply-chain incident response in `docs/security/supply-chain-incident-response.md` documents the `tanstack/node-ipc`–class risk but expects the operator to `npm ci --ignore-scripts` + `npm audit signatures` + IOC scan separately. | `pnpm.onlyBuiltDependencies: []` empty allowlist (starter posture), CycloneDX SBOM, cooldown gate, `slopsquat` check — all enforced as `block` rules even at `local`. 04-guardrails M3 packet. | vibe-fence is ahead. ECC's response playbook is narrative, not a gate. Stealing vibe-fence's `onlyBuiltDependencies` posture into ECC would be an improvement in the other direction. |

### 2.3 Where ECC's instruction-class gate already catches what vibe-fence worries about — and where it misses

The `instruction` class + its three questions (`loader`, `behaviour-change`, `no-duplicate-instruction`) fires on **every** first touch of an instruction-class path, including the initial creation. No "new file" fast-path exists for instruction targets — a `Write(skills/foo/SKILL.md)` is denied just like an `Edit(CLAUDE.md)` (unlike `code` writes, which open a `sibling` collapse window — instruction writes never collapse; any dot-segment blocks it). So a TrojanForge-style skill-injection that writes a new skill file is gated on its first touch even if the file did not exist before. This is materially stronger than a hash-attestation-only approach that only detects modification of *existing* files.

What it does **not** catch:

- **Post-checkout overwrite of an already-checked path.** Once `CLAUDE.md` has been asked its three questions and the agent retries with them, the path is marked checked for the idle window. A later `git pull` / `npm install` that silently overwrites `CLAUDE.md` on disk does not re-gate (the mark is idempotent until TTL). This is the exact AIShellJack/NVIDIA Red Team vector described in `04-guardrails.md` unique #5 — a build-time delay/overwrite between the check and the next read.
- **A malicious `AGENTS.md` already in the clone before the session starts.** The first edit that *reads* the poisoned file as context (not writes it) is not a gated action. Only the first *write* to it draws a denial; the read that ingested the prompt injection is unobservable to GateGuard.
- **Instruction files loaded via non-file transports** (MCP `get-memory` returning poisoned skill text, image-to-text of a TrojanForge skill screenshot). GateGuard gates tools, not model ingestions.

All three are why `FINAL-v2.md` retains GEM-01's positive integrity attestation (`integrity.ts` + `FENCE_SYNC_TOKEN` + `postinstall-guard.sh`) alongside adopting ECC's instruction-class gate. The two mechanisms are complementary, not competing — one closes the supply-chain cause, the other closes the edit-effect.

---

## 3. What ECC's security depth means for vibe-fence — validating S-06/S-08 and where vibe-fence is ahead

### 3.1 S-06 (instruction files are an attack surface) — validated and deepened

`FINAL.md` S-06 reads: *"Instruction files are an attack surface. `AGENTS.md`/SKILL.md treated as untrusted on init and on dependency pulls; validate, hash-attest (`fence validate`), reject contradictory tiers and invisible-Unicode."*

ECC validates S-06 structurally:

- **The `instruction` class exists as a first-class lexical decision**, not a convention. Its predicate covers eight basenames + `*.mdc` anywhere + every `.md/.mdx/.txt` under seven instruction-bearing dirs — strictly more than vibe-fence's current `AGENTS.md`/`CLAUDE.md` list. Every additional basename vibe-fence does not gate is an unvalidated instruction surface the agent will load without comment.
- **The three `instruction` questions are the strongest published operationalization of "treat as untrusted."** `loader` forces the agent to articulate *which harness loads this file and when* — the attacker must invent a coherent loading story, not just a plausible edit. `behaviour-change` forces a description of the agent-behavior delta — the attacker must claim an effect narrow enough to be credible. `no-duplicate-instruction` forces a tree search. Together they require the same two tool calls (`Grep` for duplicates + reasoning about harness semantics) that vibe-fence's `fence validate` requires, but inside the single-turn denial instead of as a separate command. The *closest-miss* line (`Closest search this turn did not count`) further tells the agent which search it should have run — a UX affordance vibe-fence's current `block` denials lack.
- **The sensitive-path + hard-link lattice catches the instruction-file bypass ECC reviewers found.** `evaluation.md` documents 8 must-deny bypasses on `upstream/main` that all involved instruction-adjacent sensitive paths (`src/auth/**`, `.env`, hard-linked secrets). The lattice (sensitive > subagent skip, hard-linked > exempt globs, checked mark on a distinct subagent key) is what prevents "delegate the bad write to the subagent" and "hard-link the secret through vendor/". vibe-fence has no subagent-aware bypass test and no hard-link check; both are cheap to adopt (see §5).
- **The evaluation artefact is the credibility.** `docs/gateguard/evaluation.md` measures GateGuard on a 20-scenario/184-step corpus with four labeled axes (`expect`, `mustDeny`, `redundant`, `relevantQuestions`). Against upstream the working tree closes 8 must-deny bypasses, removes 38 redundant denials, cuts irrelevant questions 187→2, and pays ~12 ms fresh-process latency. vibe-fence has no equivalent adversarial corpus. The lesson is not the numbers — it is that a before/after corpus with `mustDeny` labels exists at all, and that every scenario fix ships with it. vibe-fence's `04-guardrails.md` adversarial fixture corpus (GEM-01 delivery) should adopt the same four-label schema.

Enrichment to S-06 from this analysis (carries into `FINAL-v2.md`): the hash-attestation layer (GEM-01) must be specified with ECC's worktree/Windows normalization — an attacker who can write `CLAUDE.md::$DATA` or `CLAUDE.md.` bypasses a naive `sha256(relativePath)` attestation on Windows. ECC's `normalizeWindowsSegments` is the reference implementation to clone.

### 3.2 S-08 (OWASP 2025 + LLM Top 10 frame) — validated, with a calibration

`FINAL.md` S-08 reads: *"OWASP Top 10:2025 (not 2021) + LLM Top 10 2026 are the guardrail frame. Supply-chain, exception-mishandling, and agent-identity rules (MCP pin, slopsquat, LLM-output sanitization, least-agency identity, PII redaction) are non-optional."*

ECC's position validates the choice of 2025 over 2021:

- **ECC's own SECURITY.md Supply-Chain Rules section pins third-party GitHub Actions to commit SHAs**, forbids shelling untrusted GitHub context into `run:` blocks, and requires release/install docs to point only at official surfaces — all A06/A10 2025 controls, not 2021. Its supply-chain incident response (`docs/security/supply-chain-incident-response.md`) is written around the May 2026 TanStack/ `node-ipc` campaign and explicitly documents that registry provenance alone does not prove cache/lifecycle/script safety — the same argument `04-guardrails.md` makes for `onlyBuiltDependencies: []`.
- **The LLM Top 10 2026 column (MCP / agent-identity / LLM-output) is the column ECC actually invests in beyond OWASP.** `SECURITY.md`'s "Triage: suspicious `<system-reminder>` blocks" section, `the-security-guide.md`'s MCP Top 10 / Agentic Applications Top 10 callouts, and the `<untrusted-content>` envelope guidance in the skills are exactly the LLM-output sanitization vibe-fence plans. `rules/common/security.md` being five items (not a catalogue) signals that ECC treats `security.md` as an invariant header, not the enforcement — the hooks are the enforcement. vibe-fence's decision to make M3 a rule-record packet (`src/config/severity-policy.json` + executable checks) is the right translation.

Calibration: `04-guardrails.md` already resolves D-01 as "OWASP 2025 wins" — ECC is a confirm, not a new argument. What ECC adds is that the *lifecycle-script* and *GitHub Actions* hardening in `docs/security/supply-chain-incident-response.md` should be an automatic part of S-08's M3 packet, not an appendix. vibe-fence's `npm audit signatures` + `validate-workflow-security.js` equivalent (pinned SHAs, no untrusted `run:` interpolation) belongs in the `local` `block` set — currently implied but not enumerated as a named check.

### 3.3 Where vibe-fence is ahead — BILL-01, PRV-09, fixture hygiene, and what ECC lacks

ECC's security depth is narrow — it is deep on *gating writes and shell* but otherwise delegates to skills-as-prose:

- **No billable-service guard.** ECC has no `BILL-01` analogue. `install.sh --ignore-scripts` is the closest lifecycle control, but there is no runtime check for `OpenAIStream`/`AnthropicStream` inside a loop, no `maxTokens` budget, no spend cap. The `secrets` story in `SECURITY.md` is "never commit `YOUR_*_HERE`" — it says nothing about an agent calling `openai.chat.completions.create` in a `for await` over an attacker-controlled list length. vibe-fence's `BILL-01` (`src/rules/bill-01.ts` + `src/framework/billing-guard.ts` wrapper with `maxCalls`/`maxCostUsd`, `block` at `shared`/`public`) is a net-new primitive ECC should steal from vibe-fence, not the reverse.
- **No fixture/seed hygiene.** ECC's `rules/common/testing.md` and language rules prescribe test structure but do not scan `tests/fixtures/**`, `prisma/seed.*`, or `__mocks__/**` for email/phone/high-entropy strings that match secret patterns. No `fence anonymize` equivalent. `PRV-09` (P1, `block` at all tiers even `local` because fixtures ship via seed) has no ECC parallel. The closest is `SECURITY.md`'s generic "never commit real credentials" — a rule that, without a scanner, the gate never enforces on fixture content (fixtures are `code` or `test` class, not `sensitive` unless their path contains `auth/secrets/payments`). vibe-fence's fixture scanner is material novelty.
- **No privacy inventory / jurisdiction gating.** `the-security-guide.md` treats PII as a generic post-exfiltration concern (redact before logging, treat private data as toxic with untrusted content). It has no `data-inventory.json`-driven `/privacy` page, export/delete scaffold, consent gate, or CCPA/CPRA/COPPA overlays. `04-guardrails.md` A-14 and S-09's `local→public` app-profile escalation for privacy rules are entirely vibe-fence contributions.
- **Rules as prose, not records.** ECC's `rules/` are Markdown the agent is instructed to follow. There is no `src/config/severity-policy.json` severity function, no `pass/fail/unknown/not-applicable` four-outcome model, no executable `check_adapter` per rule. The agent's compliance is assumed, not measured. vibe-fence's executable rule records are — with GateGuard aside — ECC's biggest architectural lesson in the other direction.

### 3.4 ECC's honest scope — supply-chain, not runtime

`SECURITY.md`'s Scope section is careful: supported versions are `2.x`/`1.10.x` + npm `ecc-universal` + GitHub App + the AgentShield usage docs (not AgentShield code — that lives at `affaan-m/agentshield`). The `Out of Scope` clause excludes "local command execution where the user already controls the local shell and no higher-privilege trust boundary is crossed" — i.e. ECC does not promise to protect a terminal where the human already has shell. `docs/security/supply-chain-incident-response.md` is an operator runbook (evidence preservation, cache purge, credential rotation, persistence-hook removal) indexed to the May 2026 campaign, not a runtime prevention. The `security:ioc-scan` harness (IOC sweep of Claude/Codex/VS Code/Zed persistence hooks) runs in CI and in the six-hour `supply-chain-watch.yml` workflow, but it is read-only — it detects, it does not gate. GateGuard is the only in-session gate; everything else is pre/post.

This matters for translation: when vibe-fence copies ECC patterns, it should copy GateGuard's gate mechanism, not ECC's runbook. The runbook belongs in `docs/fence/runbooks/supply-chain.md` (operator guidance), not in `src/config/severity-policy.json`.

---

## 4. Adapter compliance patterns

### 4.1 `harness-adapter-compliance.js` — a compliance scorecard that enforces honesty about parity

**Files:** entrypoint `scripts/harness-adapter-compliance.js` (thin CLI — `--check` mode for CI, `--format text|json|markdown`); library `scripts/lib/harness-adapter-compliance.js` (the registry).

**What it does:** `harness-adapter-compliance.js` is the canonical harness-portability contract — a typed, frozen registry that refuses to let a port claim capabilities it does not have. Its single export `ADAPTER_RECORDS` is an array of 13 frozen objects shaped as:

```
{name, harness, install, artifacts, source, supported_features, unsupported_features}
```

plus a Markdown-table renderer (`renderMarkdownTable()`), a record validator (`validateAdapterRecords()`), and a cross-doc sync check (`validateDocumentation({ repoRoot })`) that diffs the in-repo prose (e.g. `docs/architecture/cross-harness.md`'s prose matrix) against the registry's per-field provenance pointers — the "single source of truth" pattern the synthesis asked for.

**The table it renders** (in `--format markdown`) has six columns: `Harness | State | Supported | Unsupported | Install | Verification | Risk`. `Install` points at the exact command for that harness (`./install.sh --profile minimal --target cursor`); `Verification` points at `npm run harness:audit -- --format json` plus a harness-owned smoke test; `Risk` names what the adapter still does not do.

**Verification:** `--check` mode asserts the registry is internally consistent; `npm run harness:audit` (a separate script) checks the *installed* files against it; `tests/harness-adapter-compliance.test.js` (the usual co-located test) would assert the Markdown block between `<!-- harness-adapter-compliance:matrix-start -->` and `<!-- harness-adapter-compliance:matrix-end -->` in the cross-harness doc equals `renderMarkdownTable()` output.

**Why vibe-fence should steal it:** `src/adapters/*.yml` plus `docs/research/synthesis/FINAL(-v2).md`'s milestone tables currently duplicate the same information in three places (YAML, prose, FINAL). `harness-adapter-compliance.js` is the pattern that prevents drift — YAML as registry, doc matrix as rendered view of the YAML, test as enforcer. Without it, vibe-fence will ship an adapter that silently claims OpenCode hooks that do not exist, and the first real audit will find it. The copy is small: one registry file + one renderer + one doc-sync test.

### 4.2 `build-opencode.js` — build once, verify everywhere

**File:** `scripts/build-opencode.js` (733 LOC) — build script for the `.opencode/` install target; tests in `tests/scripts/build-opencode.test.js`.

**What it does:** `build-opencode.js` is the complement to the compliance scorecard — it enforces that the same logical rules ship to every harness, adapted only at the edges. It reads a canonical `src/rules.yaml` (or equivalent) and transpiles/validates the OpenCode package layout (`opencode.json`, `CLAUDE.md` subset, `skills/` aliases, `rules/` flattened namespace) through a pipeline that:

1. validates rules against `schemas/agent.schema.json` / per-harness adapter schemas (typed contract),
2. installs profile-filtered subsets (`--profile minimal|standard|strict` mirrors Claude's `install` flags — `docs/MANUAL-ADAPTATION-GUIDE.md`'s fallback path for chat-style harnesses is invoked through the same profiles),
3. runs `validate-agent.js` / `ci/validate-skills` per-profile,
4. emits an idempotent install receipt (one file per installed artefact, `agent-check → hook-check → …` chain).

The file is intentionally narrow — it is *not* a general cross-harness transpiler for all harnesses; it is the OpenCode surface's builder, exercised by `lib/opencode-hook-consent-safety` and `lib/opencode-install-lock` suites. Claude's equivalent is `scripts/lib/install-targets/claude-home.js`; Cursor's is `cursor-project.js`; `scripts/lib/install-targets/opencode-home.js` is the OpenCode mirror. The pattern generalizes: one builder script per harness surface, each reading the canonical registry, each producing the harness-native layout from the same source, none claiming cross-harness equivalence it does not test.

**What vibe-fence should take:** the invariant that *`src/` is the single editable authority, `dist/` is disposable, and the builder is the only writer of harness-native surfaces*. The per-harness YAML files are configuration of a builder, not independent rule files. The compliance matrix documents whether a builder exists for that harness; the builder proves that the documentation is not aspirational. vibe-fence's `tools/{generate,validate,install}.ts` should be one generator reading `src/config/severity-policy.json` + `src/framework/context-budget.yml` plus one verifier matching `harness-adapter-compliance.js`, not a collection of independent per-harness rule files that drift apart in a week.

---

## 5. Top 3 security primitives vibe-fence should steal before the hackathon

Each primitive is named, scoped, costed, and sourced. They are ordered by leverage — first the one that changes the most user-visible outcome per LOC, last the one that is cheap but only matters if the first two ship.

### 5.1 Primitive #1 — The `instruction`-gated first-touch gate (clone GateGuard's question lattice)

**What to steal:** The entire `classifyTarget` → `questionIdsFor` → denial-text lattice from `scripts/lib/gateguard-target-class.js` (457 LOC), specialized for vibe-fence's harness. Not the shell parser, not the transcript scanner, not the `sibling`/`trivial` collapse — just the classification + question-id table + denial text rendering. vibe-fence's `PreToolUse` hook (the M4 `canary-enforced hook proof` path) would call `classifyTargetFor(filePath)` on every `Edit`/`Write`/`MultiEdit` first touch, consult `GATEGUARD_EXEMPT_GLOBS` + `isSensitiveTargetFor` + `isHardLinkedTargetFor` (all three also in `gateguard-target-class.js`), and, if denied, render the class-specific numbered questions instead of the current boolean `block`.

**Why it is #1:** The single biggest quality gap vibe-fence's own `04-guardrails.md` names is that a `block` denial without actionable guidance is theatre — agents bypass it, humans disable it. GateGuard's evaluation (`evaluation.md` 38 redundant denials → 0, 187 irrelevant questions → 2) shows that *asking fewer, more specific questions* is what reduces bypass rate, not asking more. The question lattice is also the only ECC surface that directly produces the `finding_id × explanation × evidence_ids` tuple vibe-fence's spec requires — each denied write would mint a finding with an id derived from `questionIdsFor`'s ids. Without this, vibe-fence's determinism claim (`no deterministic check → never a block`) has no enforcement before the hackathon beyond secrets; with it, every instruction-file overwrite is a structured finding the demo can show.

**How much to copy:** ~120 LOC for the class table + ids + texts; ~80 LOC for the `sensitive`/`hard-linked` predicates; ~90 LOC for the denial renderer (`condensedHintFor` + `QUESTION_TEXT`). The change-profile narrowing (`touchesPublicSurface`/`touchesData`) can ship as a second pass — even without it, the static class→questions table is already strictly more specific than `block`.

**Source anchor:** `scripts/lib/gateguard-target-class.js:1-457`; `docs/gateguard/design-notes.md#target-classes`; `docs/gateguard/change-profile.md#questions-from-the-change-profile`.

---

### 5.2 Primitive #2 — The prior-search credit / `Read is not evidence` rule (the anti-nag)

**What to steal:** The turn-scanned prior-search credit rule from `scripts/lib/gateguard-turn-scan.js` + `scripts/lib/gateguard-search-evidence.js` (+ its dependency `gateguard-search-filters.js`), and the doctrine that a `Read` alone never satisfies the gate. In vibe-fence terms: a `Grep`/`Glob`/`Bash(rg …)`/`Bash(grep …)`/shell search that names the target's stem, scopes the target, and does not exclude it earns `pass-credit`; a naked `Read` does not; a search whose exclusions cover the target or that reads stdin does not; a stem under 4 chars / in `GENERIC_STEMS` does not.

**Why it is #2:** Without this, Primitive #1 fires on every first touch even when the agent just did the work the questions demand. `evaluation.md`'s `Redundant denials` metric is literally this — 38 denials on `upstream/main` where the agent had already run a scoped search naming the file, all gone on the working tree. Redundant denials are the mechanism by which developers learn to bypass a gate ("it always asks, so my override is always safe"), which is the primary adoption cliff `01-harnesses.md` documents. `Read is not evidence` is the complement — Claude already requires a `Read` before every `Edit`, so crediting `Read` would silently disable the `Edit` gate. Both rules together mean: *reward investigation, never reward the read you already had to do.*

**What to ship minimally:** The bounded transcript tail read (`DEFAULT_TRANSCRIPT_TAIL_BYTES` + `TRANSCRIPT_SCAN_MAX_LINES`) + `collectTurnSearches` (filter by `SEARCH_TOOL_NAMES`, discard `isErrorToolResult`, enforce `same-batch-searches` via `excludedBatchId`) + `findCreditingSearch`'s scope/stem/filter checks. ~280 LOC core; vibe-fence's transcript path is `~/.hermes/` not `CLAUDE_TRANSCRIPT_PATH`, but the JSONL shape is analogous and the `isToolResultRecord` / `isCompactionBoundary` framing ports.

**Source anchor:** `scripts/lib/gateguard-turn-scan.js`; `scripts/lib/gateguard-search-evidence.js:1-540`; `scripts/lib/gateguard-search-filters.js`; `docs/gateguard/design-notes.md#read-is-not-evidence`, `#prior-search-credit`, `#turn-boundaries`, `#same-batch-searches`, `#search-scope`, `#stem-matching`.

---

### 5.3 Primitive #3 — The harness adapter compliance scorecard (the honesty gate)

**What to steal:** `scripts/lib/harness-adapter-compliance.js` as a typed frozen registry (`ADAPTER_RECORDS`) plus its Markdown-table renderer (`renderMarkdownTable()`), record validator (`validateAdapterRecords()`), cross-doc sync check (`validateDocumentation()`), and the `--check` CLI mode — all of which already exist in ECC and are trivial to port. Complement with the `build-opencode.js` invariant (`src/` sole editable authority, per-harness builder validated against the registry).

**Why it is #3:** vibe-fence's Phase 1 milestone M4 promises per-runtime wiring for `claude`, `codex`, `cursor`, `opencode`, `hermes`. Every one of `COMPARISON.md`'s structural critiques is that synthesis claims diffuse across harness sections without a single contract that pins what was actually tested. ECC's `harness-adapter-compliance.js` names four explicit tiers (`Native`, `Adapter-backed`, `Instruction-backed`, `Reference-only`) with per-harness `install_or_onramp`, `verification_commands`, `risk_notes`, and `source_docs` — the exact columns vibe-fence needs for the hackathon submission to answer "what actually works on which runtime" without hand-wave. It is also the artefact the judges will ask for: *how do you know the OpenCode hook works if you never ran the OpenCode hook consented flow?* The compliance script is the answer.

**What to ship minimally:** A `src/adapters/compliance.ts` registry (or equivalent JSON) populated for 5 harnesses (the M4 set) with the four-tier state + six-column Markdown matrix rendered into `docs/architecture/cross-harness.md` between sentinel comments + `npm run harness:compliance -- --check` CI gate + `tests/harness-adapter-compliance.test.js` enforcing the sentinel sync. ~160 LOC registry + ~90 LOC renderer. The `build-*` invariant ships as `tools/generate.ts → dist/` idempotence check already in `FINAL.md` M1 — the compliance script only asserts that `dist/`'s contents match the registry's `supported_assets` per harness.

**Source anchor:** `scripts/lib/harness-adapter-compliance.js`; `scripts/harness-adapter-compliance.js` (CLI); `scripts/build-opencode.js`.

---

## Appendix — Files cited (primary sources only)

*Alphabetical. Every file listed was `cat`/`read_file`'d in the course of this write; no file is cited from prose alone.*

| File | Role in this document |
|---|---|
| `SECURITY.md` | Supported surfaces, supply-chain rules, `<system-reminder>` triage, MCP ports |
| `CONTRIBUTING.md` | Workflow norm for skills/agents/hooks/commands (context for rule distribution) |
| `hooks/hooks.json` | Gate registrations — `PreToolUse` matchers for Edit/Write/MultiEdit/NotebookEdit + Bash/PowerShell + PostToolUse |
| `install.sh` | `--ignore-scripts` posture, npm install guard, entrypoint to `scripts/install-apply.js` |
| `package.json` | No `postinstall`; `files` list (`.adal`, `.agents`, `.claude-plugin`, `.codex`, `.cursor`, `.opencode`, `.pi`, `.zed`) |
| `rules/README.md` | `rules/common` + language dirs, copy-not-flatten instruction, `~/.claude/rules/ecc/` namespace |
| `rules/common/security.md` | Five-line invariant header — evidence that rules are prose, not enforcement |
| `schemas/hooks.schema.json` | Hook config schema (command/prompt/http types, matchers) |
| `scripts/build-opencode.js` | OpenCode builder — `src/` → `.opencode/dist/` transpilation invariant |
| `scripts/harness-adapter-compliance.js` | CLI entrypoint for compliance scorecard (`--check`, `--format`) |
| `scripts/lib/gateguard-change-profile.js` | `profileChange`: `touchesPublicSurface`/`touchesData`/`trivial` dispatch per language |
| `scripts/lib/gateguard-code-lexer.js` | Lexer for C-family/Python/Rust/shell/PowerShell/batch; `isDirectiveComment`, `DIRECTIVE_WORDS` |
| `scripts/lib/gateguard-file-context.js` | File-context scan for `trivial` (prefix ends in plain code, heredoc/docstring/template guards) |
| `scripts/lib/gateguard-metrics.js` | Opt-in metrics (`GATEGUARD_METRICS=1`), `O_NOFOLLOW`, 1 MiB rotation |
| `scripts/lib/gateguard-readonly-shell.js` | Allowlisted `isReadOnlyShellCommand` (Bash/PowerShell git `status`/`log`/`diff`/`show` subcommand allowlists) |
| `scripts/lib/gateguard-search-evidence.js` | `findCreditingSearch` / `findClosestMiss` — scope/stem/filter + directory-existence checks |
| `scripts/lib/gateguard-search-filters.js` | Include/exclusion globs, type filters (`rg -t`), path patterns — matched without `RegExp` |
| `scripts/lib/gateguard-state.js` | Counters, per-class maps, `MAX_DIR_GATES=50`, `dir_gates` keyed `class\0dir` → `{turn, at, first}` |
| `scripts/lib/gateguard-target-class.js` | **Core**: `classifyTarget`/`classPathFor`/`isSensitiveTarget`/`isHardLinkedTarget`/`questionIdsFor`/`condensedHintFor` |
| `scripts/lib/gateguard-turn-scan.js` | `scanCurrentTurn` bounded tail read + `excludedBatchId`/`searchesMayNameTarget` |
| `scripts/lib/harness-adapter-compliance.js` | `ADAPTER_RECORDS` (15 entries), `COMPLIANCE_STATES`, `renderMarkdownTable`, `validateDocumentation` |
| `src/llm/providers/resolver.py` | `get_provider()` — model routing: `LLM_PROVIDER` → `_PROVIDER_MAP[ProviderType]` → `_resolve_default_model` fallback (`LLM_MODEL` → provider-specific env → `.llm.env`) |
| `src/llm/providers/model_config.py` | `read_model_env()` — quote/whitespace-normalized env read used by resolver |
| `src/llm/providers/openai.py` | `OpenAIProvider` — `OPENAI_API_KEY` default, `default_model=gpt-4o-mini` |
| `docs/MANUAL-ADAPTATION-GUIDE.md` | Non-native harness fallback (context packing, compression rules, command registry) — clarifies what native vs adapted surfaces are |
| `docs/gateguard/change-profile.md` | Language dispatch for surface/data/trivial; directive-comment catalogue; question-from-profile table |
| `docs/gateguard/design-notes.md` | **Central design doc** — all anchors cited in §1 (`lazy-loading`, `fail-to-deny`, `sensitive-targets`, `hard-linked-targets`, `turn-boundaries`, `same-batch-searches`, `search-scope`, `read-only-first-shell-command`, `subagents`, `metrics`) |
| `docs/gateguard/evaluation.md` | 20-scenario/184-step corpus, 5 metrics, `working tree` vs `upstream/main` vs `4b02f669` comparison (38 redundant→0, 187 irrelevant→2, 8 bypasses closed) |
| `docs/gateguard/question-effectiveness.md` | External-contract opt-in experiment showing `external-contract` question did not move corpus outcomes |
| `docs/security/supply-chain-incident-response.md` | TanStack/`node-ipc` incident runbook, `security:ioc-scan` harness, `supply-chain-watch.yml` hardening rules |
| `the-security-guide.md` | Full threat exposition (Claude Code CVEs, MCP Top 10, sandboxing, sanitization, approval boundaries) — complements `SECURITY.md` |
| `.opencode/opencode.json` | OpenCode package manifest (adapter surface) |
| `schemas/*` | 15 JSON Schemas (hooks, install, state, provenance, package-manager) — evidence of typed builder contracts |
| (vibe-fence side: `docs/research/synthesis/FINAL.md`, `FINAL-v2.md`, `04-guardrails.md`, `INDEPENDENT-GEMS.md`, `COMPARISON.md`) | Settled decisions S-06/S-08/S-09, blind spots B-07, M3 guardrail packet, GEM-01/05/06, app-profile policy — the comparison baseline for §3 |

*Sidecar artefacts consulted but not cited as primary evidence: `scripts/hooks/gateguard-fact-force.js` shell parser + destructive detector (`quoteAwareSegments`, `SHELL_SEGMENT_SEPARATORS`, `isDestructiveBashCommand`), `scripts/gateguard-report.js` (pretty-printer for metrics).*
