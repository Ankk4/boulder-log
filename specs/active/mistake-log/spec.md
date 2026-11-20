---
status: approved       # draft | approved | done. /run-spec only runs approved specs.
commitment: spec-anchored # the retro step and its rules keep evolving with the workflow
---

# Mistake log (per-spec retro)

## Goal
Each shipped spec leaves a short `retro.md` that records what went wrong while it was built and where the fix landed. Fixes go to the layer that made the mistake (spec, agent, tooling or orchestrator), preferring enforcement over prose, so the same mistake doesn't repeat. This is about the agent workflow, not the climbing app; no `src/` code changes.

## Context
- No research notes apply.
- Workflow files: `.claude/skills/run-spec/SKILL.md`, `.claude/skills/spec/SKILL.md`, `.claude/agents/implementer.md`, `.claude/agents/reviewer.md`, `specs/TEMPLATE/`, `.claude/settings.json`, `.claude/hooks/`.
- Raw data for a retro: reviewer FAIL reports and verify failures in the orchestrator's context, `.claude/logs/agents.jsonl`, and follow-up commits on the feature branch.
- Seed source: ui-refactor-001 (`specs/done/ui-refactor-001/`), fix commits `e397537` and `4c9408d`.
- **Who implements it:** `scope-guard.mjs` blocks implementers from `.claude/` and `specs/`. So the main session implements each task from `tasks.md`, and a `reviewer` subagent (task mode) checks each diff before commit. `/run-spec` is not used for this spec, and the guard is not loosened.

## Requirements

### Retro mechanism
- **R1** — `specs/TEMPLATE/retro.md` exists. It has a table with the columns `#`, `Source`, `Mistake`, `Layer`, `Fix kind` and `Where it landed`. It also gives:
  - the allowed values for `Layer` (`spec`, `agent`, `tooling`, `orchestrator`) and `Fix kind` (`hook`, `lint`, `test`, `rule`, `log`)
  - the fix ranking: enforce with a hook, lint rule or test first; otherwise a one-line rule in the file that layer reads; `log` only when the fix is unknown
  - a note that the repo is public, so no `research/` content goes in.
  _Check:_ `rg -n "Where it landed|Fix kind|hook, lint|research/" specs/TEMPLATE/retro.md` shows every item.
- **R2** — The `/run-spec` wrap-up has a retro step that runs before the spec folder moves to `specs/done/`. It collects candidate rows from this run: reviewer FAILs, verify-gate failures, orchestrator follow-ups, and issues the user reported. For each row it proposes a ranked fix and asks the user to approve, edit or drop it. Approved rule fixes are applied, and the result is committed as `<feature>: retro`. If nothing went wrong, `retro.md` holds one line saying no issues. _Check:_ read `.claude/skills/run-spec/SKILL.md` §4: the step is there in this order, with the user approval and the no-issues case.
- **R3** — With `--draft-pr`, the retro step writes the rows with `Fix kind` set to `proposed`, applies no fixes, and lists them in the PR body for the user to approve later. That way `--draft-pr` stays hands-off and lessons still never land unapproved. _Check:_ read run-spec §4: the `--draft-pr` branch says this.
- **R4** — The template and run-spec both say that issues found after merge (like the ui-refactor timer bug) are appended to the shipped spec's `retro.md` later, in the same row format. _Check:_ `rg -n "after merge" specs/TEMPLATE/retro.md .claude/skills/run-spec/SKILL.md` finds both.
- **R5** — CLAUDE.md's Agent workflow section mentions `retro.md` in one line. _Check:_ `rg -n "retro" CLAUDE.md`.

### Seed lesson fixes (approving this spec approves each lesson)
- **R6** — Lint rules vs the planned file layout (ui-refactor T4: a provider and hooks in one file broke `react-refresh/only-export-components`). Fix: a `/spec` Phase 3 rule to check planned files against the ESLint rules, keeping components apart from hooks, contexts and constants. _Check:_ `rg -n "react-refresh" .claude/skills/spec/SKILL.md`.
- **R7** — The T8 Prettier rewrite. Fix: a rule in implementer.md, "Never run a formatter (Prettier etc.) yourself." Full enforcement comes later in the planned `chore/prettier` work, which the retro row names. _Check:_ `rg -n "formatter" .claude/agents/implementer.md`.
- **R8** — A task note contradicted R12. Fix: a rule in `specs/TEMPLATE/tasks.md`, plus a one-line pointer to it in `/spec` Phase 3: notes cite R-IDs and don't restate requirements, and if they conflict, the requirement wins. _Check:_ `rg -n "R-ID|requirement wins" specs/TEMPLATE/tasks.md .claude/skills/spec/SKILL.md`.
- **R9** — Layout size, like the 72px MUI Tab, is invisible to tests. Fix: a `/spec` rule that a requirement about size or layout gets a `manual:` check, or a test that asserts a class or style. _Check:_ `rg -n "size or layout|layout" .claude/skills/spec/SKILL.md` shows the rule.
- **R10** — A pathless `rg` hangs an agent shell. Fix: a new PreToolUse `Bash` hook, `.claude/hooks/block-pathless-rg.mjs`, registered in `.claude/settings.json` for every session. When a command segment starts with `rg` and has no path operand, it blocks the call (exit 2) with a message that suggests adding `.` or a path. A segment counts if it follows the start, `;`, `&&`, `||` or `$(`, but not the right side of a `|`. Otherwise it allows the call (exit 0).
  - Blocked: `rg foo`, `cd x && rg -n foo`, `rg -e foo`, `rg -g '*.ts' foo`.
  - Allowed:
    - commands with a path: `rg foo .`, `rg -n foo src`, `rg -e foo src`
    - piped input: `git log | rg foo`
    - commands that don't read stdin: `rg --files`, `rg --version`, `rg foo < /dev/null`
    - `grep foo` and commands that only mention rg in a quoted string, like `echo "rg foo"`.
  - A flag that takes a value (`-g`, `-t`, `-T`, `-m`, `-A`, `-B`, `-C`, `-e`, `-f`, `--glob`, `--type`, `--max-count`, …) does not count as a path, and neither does its value.
  - If the input can't be parsed, allow the call (fail open).
  _Check:_ `node --test .claude/hooks/__tests__/` passes, with one test per example above.
- **R11** — Hook tests are part of the definition of done. `package.json` gets `"test:hooks": "node --test .claude/hooks/__tests__/"`, and `verify` becomes `typecheck && lint && test:run && test:hooks`. CLAUDE.md's verification list adds the step. _Check:_ `npm run verify` passes, and its output shows the node:test summary.
- **R12** — The orchestrator worked around a denied sandbox command (`cmp`). Fix: a run-spec rule that when a tool call or command is denied, the orchestrator asks the user and doesn't substitute another command. _Check:_ `rg -n "denied" .claude/skills/run-spec/SKILL.md`.
- **R13** — A focus-mode remount reset the timer; the code fix is in `e397537`. Fixes:
  - a `/spec` rule: a check for a state transition exercises that transition mid-flow, not only the state on mount
  - a reviewer.md task-mode item: flag conditional wrappers or changing `key`s around `children` or stateful subtrees, since they remount.
  _Check:_ `rg -n "transition" .claude/skills/spec/SKILL.md` and `rg -n "remount" .claude/agents/reviewer.md`.
- **R14** — The `done` phase colour was unwanted; it was removed in `4c9408d`. Fix: a `/spec` rule that visual choices (colour, spacing, typography) get a `manual:` check by the user, and the spec doesn't pin exact values unless the user chose them. _Check:_ `rg -n "visual choices" .claude/skills/spec/SKILL.md`.
- **R15** — The orchestrator mapped the wrong feature name and edited tasks.md without asking. Fixes, both in run-spec:
  - preflight: if `<feature>` doesn't exactly match a folder in `specs/active/`, list the folders and ask; never guess
  - never edit `spec.md` or `tasks.md` during a run without the user's OK.
  _Check:_ `rg -n "exactly match|without the user" .claude/skills/run-spec/SKILL.md`.
- **R16** — `specs/done/ui-refactor-001/retro.md` follows the R1 template, with one row per lesson R6–R10 and R12–R15 (9 rows). Each `Where it landed` names the file (and commit, for `e397537` and `4c9408d`) that holds the fix. It contains no `research/` content. _Check:_ count the table rows, and `rg -n "research/" specs/done/ui-refactor-001/retro.md` returns nothing.

## Constraints
- Rules are one line each, put where the layer reads them. CLAUDE.md gains at most 2 lines in total (R5 and R11), to keep it short.
- The hook has no dependencies and uses only Node built-ins, like the existing hooks. It must not slow down every Bash call noticeably: no subprocesses.
- The scope guard is not loosened.
- Public repo: no `research/` content in any of these files, commits or the PR.

## Out of scope
- Prettier itself (`chore/prettier`, separate work).
- Mining old transcripts or `agents.jsonl` automatically. The retro is assembled by the orchestrator plus the user.
- Retros for other shipped specs (branding, better-readme, merge-draft).
- Linting `.mjs` hooks with ESLint.
- Any `src/` change.

## Open questions
- none
