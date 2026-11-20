# Tasks: Formatter

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.

**Bootstrap (read first):** every task here is `runner: planner`, because all of them touch files scope-guard blocks implementers from. T1 adds the `runner` field to `/run-spec`, so the running orchestrator doesn't know it yet. The orchestrator does T1's edits itself, verifies it, gets it reviewed and commits it like any other task. Then it re-reads `.claude/skills/run-spec/SKILL.md` and runs T2–T5 by the new §2a rules. All tasks run in order on the main tree.

## T1: planner-task support in the template and /run-spec
- covers: [R1]
- runner: planner
- allowed files: `specs/TEMPLATE/tasks.md`, `.claude/skills/run-spec/SKILL.md`
- check: `rg -n "runner" specs/TEMPLATE/tasks.md .claude/skills/run-spec/SKILL.md`
- tests to add: none (doc and skill text; R1's manual check covers it end to end)
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - Template: add a `- runner: implementer` line to both example tasks, and a rule under "Rules for splitting" saying when to use `planner`: the allowed files match `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`.
  - SKILL.md §1: planner tasks are always sequential. §2a: branch at step 1. For a planner task, the orchestrator edits only the task's allowed files itself, instead of spawning an implementer. Steps 2–6 are unchanged (verify gate, `git add -A`, reviewer, commit format). For step 6 on a planner task, the orchestrator fixes the findings itself, within the same budget.
  - Keep the edits short; SKILL.md is read every run.

## T2: Prettier config, deps, scripts, eslint-config-prettier
- covers: [R2, R3, R4]
- runner: planner
- allowed files: `.prettierrc.json`, `.prettierignore`, `package.json`, `package-lock.json`, `eslint.config.js`
- check: the R2 and R3 `_Check:_` commands from spec.md, then `npm run lint`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes:
  - `npm i -D -E prettier@3.10.1 eslint-config-prettier@10.1.8`. These are the versions the spec checks were run against.
  - Add the `format` and `format:check` scripts now, but **don't** add `format:check` to `verify` yet: the tree isn't formatted until T3, so verify would fail. T4 completes R4.
  - `eslint.config.js`: `import prettier from 'eslint-config-prettier'` and add `prettier` as the last argument of `tseslint.config(...)`.
  - Don't run `npm run format` in this task.

## T3: reformat the repo
- covers: [R5]
- runner: planner
- allowed files: whatever `npm run format` changes, nothing else
- check: `npm run format:check && npm run verify`, then `git diff --cached --stat`. The stat should list the same files as `npx prettier --list-different .` printed just before the format (about 42 files; see spec Context).
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes:
  - Run only `npm run format`. Make no hand edits. If verify fails after formatting, stop and report it rather than fixing it here: Prettier shouldn't change behavior.
  - Commit subject: `formatter T3: reformat with Prettier`. T5 needs this commit's SHA.
  - Reviewer: the diff is mechanical, so check that no file outside Prettier's list changed.

## T4: format:check in verify, format-on-edit hook, scope-guard protection
- covers: [R4, R7, R8, R9]
- runner: planner
- allowed files: `package.json`, `.claude/hooks/lint-edited-file.mjs`, `.claude/hooks/scope-guard.mjs`, `.claude/hooks/__tests__/lint-edited-file.test.mjs`, `.claude/hooks/__tests__/scope-guard.test.mjs`
- check: `node --test .claude/hooks/__tests__/lint-edited-file.test.mjs .claude/hooks/__tests__/scope-guard.test.mjs`, then the R4 `_Check:_` transition, then `npm run verify`
- tests to add: the cases listed under R7 and R9
- parallel-safe: no
- schema-change: no
- depends-on: [T3]
- notes:
  - `verify` order per R4.
  - Hook: keep the current root lookup and `ensureDeps(root)`. Then run `npx --no-install prettier --write --ignore-unknown <rel>` from `root` for any file inside the root. `--ignore-unknown` covers `.gitignore` and similar files; `.prettierignore` covers `*.md` and `research/`, even when the path is passed explicitly. On failure, exit 2 with the output filtered like the ESLint branch does. Then keep the existing `src/**/*.ts(x)` ESLint step unchanged.
  - lint-edited-file test: build a throwaway git repo under `os.tmpdir()` (`git init`). Copy in `.prettierrc.json`, `.prettierignore` and `eslint.config.js`, and symlink `node_modules` to the real one. Then spawn the hook with stdin JSON `{tool_input:{file_path}, cwd}`. Don't create temp files inside the real repo. Remove the temp dir in `after()`. Follow the style of `block-pathless-rg.test.mjs`.
  - scope-guard: add the three files to `protectedForImplementer`. Its test spawns the hook with `{agent_type, tool_input:{file_path}, cwd}` and asserts the exit code (2 = blocked).
  - Both tests must pass on Node 20 (CI) as well. Use only `node:test` and `node:assert/strict`.
  - R8 is manual. Do it after committing, in the main session: Edit a `src/` file twice as R8 describes, then revert it. Record the result in the run report.

## T5: blame-ignore file and docs
- covers: [R6, R10]
- runner: planner
- allowed files: `.git-blame-ignore-revs`, `CLAUDE.md`, `.claude/agents/implementer.md`, `.claude/agents/reviewer.md`
- check: the R6 and R10 `_Check:_` commands from spec.md, then `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T3, T4]
- notes:
  - SHA: `git log --format=%H --grep='^formatter T3:' -1`. Use the full 40-character SHA, with a `# formatter T3: reformat with Prettier` comment line above it.
  - CLAUDE.md:
    - In "Verification", add `npm run format:check` as step 3 and renumber.
    - In "Hooks enforce this", say Prettier formats the edited file, then ESLint lints it.
    - Add a line about the blame opt-in.
    - Add one line under "Agent workflow" about `runner: planner`.
  - implementer.md: replace the existing "Never run a formatter" bullet with R10's wording rather than adding a second one.
  - Keep each doc edit to a line or two.
