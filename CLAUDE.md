# boulder-log

React 18 + TypeScript + Vite SPA, Dexie (IndexedDB) storage, deployed to GitHub Pages under `/boulder-log/`.

## Verification (definition of done)

A change is done only when `npm run verify` passes. It runs, in order:

1. `npm run typecheck`: `tsc -b` over app, tests (every `*.test.ts(x)` and `src/setupTests.ts`), and `vite.config.ts` (project references)
2. `npm run lint`: ESLint with `--max-warnings=0`, type-aware (`strictTypeChecked`)
3. `npm run format:check`: Prettier (`npm run format` fixes it; Markdown is ignored)
4. `npm run knip`: Knip, which fails on dead files, unused exports and unused dependencies
5. `npm run test:run`: Vitest, once (console output is shown only for failing tests)
6. `npm run test:hooks`: `node --test` over `.claude/hooks/__tests__/`

`npm run verify:full` also runs the production build and `npm audit` (production deps only).

The one-time Prettier reformat is listed in `.git-blame-ignore-revs`. To skip it in `git blame`, run once: `git config blame.ignoreRevsFile .git-blame-ignore-revs`.

Narrower loops while iterating:
- One test file: `npx vitest run src/utils/__tests__/duration.test.ts`
- One file's lint: `npx eslint src/path/File.tsx`

### Hooks enforce this (`.claude/settings.json`)

- After every Edit/Write, Prettier formats the edited file, then ESLint lints it if it is `src/**/*.ts(x)`. Errors come back to you; fix them before moving on.
- Before you finish, `npm run verify` runs if source or config changed. If it fails, the stop is blocked and you get the failures. After one retry the hook lets you stop and warns the user, so report what is still failing rather than claiming success.

### Rules

- Fix the cause, never the check. Don't add `eslint-disable`, `@ts-ignore`, `as any`, `.skip`/`.only`, or loosen tsconfig/ESLint rules to get green. If a rule is truly wrong for the project, say so and ask.
- Don't weaken or delete an existing test to make a change pass. If the behavior change is intended, update the test and say so.
- New logic in `src/utils/` or `src/hooks/` gets a test under the sibling `__tests__/` folder.
- Unused parameters that must stay go with a leading `_`.
- Fix knip findings by removing the dead code, never by adding `ignore*` entries to `knip.json`.
- Never run `eslint --suppress-all` or `--suppress-rule`. After fixing a suppressed finding, run `npx eslint --prune-suppressions`.
- UI changes: tests can't see layout or audio. Say so, or run the app (`npm start`) and check it.

## Testing notes

- `src/setupTests.ts` mocks Dexie, `matchMedia`, and `crypto.randomUUID` globally.
- Page tests mock `../../db/index` and assert on the typed `db` export (see `src/pages/__tests__/Session.test.tsx`).

## Agent workflow

The main session (Opus) plans; Sonnet subagents in `.claude/agents/` execute. Running `/spec`, `/run-spec` or `/research` counts as the user asking for subagents.

- Specs: `specs/active/<feature>/{spec.md,tasks.md}`, templates in `specs/TEMPLATE/`, shipped specs move to `specs/done/`. Requirements have IDs (`R1`…) with pass/fail checks; tasks list the requirements they `covers`.
- Retro: each shipped spec gets a `retro.md` (template in `specs/TEMPLATE/`) recording mistakes and where the fix landed; `/run-spec` §4 writes it, issues after merge are appended later.
- `implementer` does one task and never commits. `reviewer` is read-only and returns PASS/FAIL. `researcher` writes only to `research/`.
- `research/` is a separate **private** repo, gitignored here. This repo is public: link research notes by path, never paste competitor detail into specs, commits or PRs.
- `/run-spec <feature> --draft-pr` pushes the branch and opens a draft PR via `.claude/hooks/lib/open-pr.mjs`, only when every task passed. Without the flag nothing is pushed.
- Tasks with `runner: planner` (allowed files protected by scope-guard) are done by the orchestrator itself in the main tree, then verified and reviewed like any other task.
- Worktrees (`isolation: "worktree"`) only for tasks marked `parallel-safe: yes` with `schema-change: no`. Dexie `version()` bumps always run alone.
- Hooks: `scope-guard.mjs` limits what each agent may write; `verify-on-stop.mjs` also runs on the implementer's `SubagentStop`, but a background agent has already handed back by then, so `/run-spec` re-runs it with `verify-on-stop.mjs --check <tree>` before review (instant when the hook's pass stamp matches); `log-agents.mjs` and the gate log to `.claude/logs/agents.jsonl`.
