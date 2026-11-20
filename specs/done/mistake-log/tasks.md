# Tasks: Mistake log (per-spec retro)

Executed by the **main session**, not `/run-spec`: every file here is under `.claude/`, `specs/` or is config, which `scope-guard.mjs` blocks for implementers. For each task: the main session implements it, runs the check and `npm run verify`, stages it, spawns `reviewer` in task mode (`Task mode. Spec folder: specs/active/mistake-log/. Task: T<n>. Diff: git diff --cached in <repo root>.`), and commits on PASS as `mistake-log T<n>: <summary>` with `covers: R…` in the body. Branch: `feature/mistake-log`.

Rules for splitting:
- One task = one review = one commit.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- Rules are one line each (spec Constraints). Notes here cite R-IDs; the requirement text in `spec.md` wins.

## T1 — Retro template and the run-spec retro step
- covers: [R1, R2, R3, R4, R5]
- allowed files: `specs/TEMPLATE/retro.md`, `.claude/skills/run-spec/SKILL.md`, `CLAUDE.md`
- check: `rg -n "Where it landed|Fix kind|hook, lint|research/|after merge" specs/TEMPLATE/retro.md && rg -n "retro|after merge|proposed" .claude/skills/run-spec/SKILL.md && rg -n "retro" CLAUDE.md`
- tests to add: none (prose)
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - The retro step goes in run-spec §4, before "Move the spec folder", in both the plain and `--draft-pr` branches (R2, R3).
  - In the `--draft-pr` branch, step 2's PR body lists the proposed rows.
  - The data sources are in spec Context.
  - Template layout: frontmatter-free markdown, an intro of a few lines with the ranking and value lists, then an empty table and the no-issues line.
  - The CLAUDE.md line goes in the Agent workflow bullets, next to the Specs bullet.

## T2 — Pathless-rg hook with node:test tests, wired into verify
- covers: [R10, R11]
- allowed files: `.claude/hooks/block-pathless-rg.mjs`, `.claude/hooks/__tests__/block-pathless-rg.test.mjs`, `.claude/settings.json`, `package.json`, `CLAUDE.md`
- check: `npm run test:hooks` then `npm run verify`
- tests to add: one test per blocked and allowed example in R10, plus a malformed-input (fail-open) case and an empty-command case.
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes:
  - Export a pure `check(command) → {block: boolean, reason?}` and keep the stdin/exit wrapper thin, so the tests import `check` and don't spawn processes. The wrapper runs only when the file is the entry point (`import.meta.url` vs `process.argv[1]`).
  - Copy the stdin-read and exit-2 pattern from `scope-guard.mjs`. Input is `tool_input.command`.
  - Tokenise with simple quote handling: split segments on `;`, `&&`, `||`, `$(` and `|`, and remember whether each segment came after a `|`.
  - Register under `PreToolUse` with matcher `Bash` and timeout 5.
  - Depends on T1 only because both edit `CLAUDE.md`. Add the `test:hooks` step to the Verification list there (R11).
  - Make sure Vitest's `include` (`src/**`) doesn't pick up the `.test.mjs` file. It doesn't today, so don't touch `vite.config.ts`.

## T3 — /spec skill and task-template rules
- covers: [R6, R8, R9, R13, R14]
- allowed files: `.claude/skills/spec/SKILL.md`, `specs/TEMPLATE/tasks.md`
- check: `rg -n "react-refresh|R-ID|requirement wins|size or layout|transition|visual choices" .claude/skills/spec/SKILL.md specs/TEMPLATE/tasks.md`
- tests to add: none (prose)
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - R6 and R8's pointer go in Phase 3. R9, R13 (the spec half) and R14 go in Phase 2, where requirements and checks are written.
  - R8's rule in the template belongs in "Rules for splitting".
  - The reviewer half of R13 is T4.

## T4 — Implementer and reviewer agent rules
- covers: [R7, R13]
- allowed files: `.claude/agents/implementer.md`, `.claude/agents/reviewer.md`
- check: `rg -n "formatter" .claude/agents/implementer.md && rg -n "remount" .claude/agents/reviewer.md`
- tests to add: none (prose)
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - R7 goes under implementer Rules, next to "Stay small".
  - The reviewer half of R13 goes in Task mode item 6 (obvious bugs) or as a new item 7.

## T5 — run-spec orchestrator rules
- covers: [R12, R15]
- allowed files: `.claude/skills/run-spec/SKILL.md`
- check: `rg -n "denied|exactly match|without the user" .claude/skills/run-spec/SKILL.md`
- tests to add: none (prose)
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes:
  - R15's folder match goes in §0 Preflight as the first bullet.
  - R12 and R15's no-edit rule go in a short "Rules" line after the intro paragraph, so they apply to every step.

## T6 — Seed retro for ui-refactor-001
- covers: [R16]
- allowed files: `specs/done/ui-refactor-001/retro.md`
- check: `rg -c "^\| [0-9]" specs/done/ui-refactor-001/retro.md` prints 9, and `rg -n "research/" specs/done/ui-refactor-001/retro.md` prints nothing
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T1, T2, T3, T4, T5]
- notes:
  - Copy the T1 template. The rows map 1:1 to R6–R10 and R12–R15.
  - `Where it landed` names the file and the commit sha of the T2–T5 commit that holds the fix (look them up with `git log --oneline master..`). For R13 and R14 it also names `e397537` and `4c9408d`.
  - For R7, name the planned `chore/prettier` work as the enforcement still to come.
  - Source values: `reviewer FAIL T4`, `T8 follow-up`, `orchestrator`, `user after merge`, and so on.
