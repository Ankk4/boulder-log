---
status: done        # draft | approved | done. /run-spec only runs approved specs.
commitment: spec-first # spec-first: frozen after shipping | spec-anchored: kept up to date with the code
---

# Formatter

## Goal
Every file in the repo has one Prettier style. Agents get it automatically when they edit a file, so no agent has a reason to run a formatter that rewrites files outside its task. `npm run verify` (and so CI and the stop hooks) fails on unformatted code.

This is developer tooling. Nothing changes for the climber.

## Context
- Why: in ui-refactor T8 an implementer ran Prettier with its defaults and rewrote a whole file (a 451-line diff). The repo has no formatter config.
- Measured on `a4cbbe3`: the config below changes 41 of 66 tracked non-Markdown files (+380/−287 lines).
- Almost every file here is protected from implementers by `.claude/hooks/scope-guard.mjs`: `package.json`, `eslint.config.js`, `.claude/**`, and the reformat itself, which touches the hooks. So this spec adds **planner tasks**: tasks that `/run-spec` does in the main session, then puts through the same verify gate and reviewer as any other task (R1). The guard is not loosened.
- Relevant code: `.claude/hooks/lint-edited-file.mjs`, `.claude/hooks/scope-guard.mjs`, `.claude/skills/run-spec/SKILL.md`, `specs/TEMPLATE/tasks.md`, `.claude/agents/implementer.md`, `package.json`, `eslint.config.js`.

## Requirements
- **R1** — Tasks can say `runner: planner` (default `implementer`). `specs/TEMPLATE/tasks.md` documents the field and says when to use it: the task's allowed files are protected by scope-guard. `/run-spec` §2a says the orchestrator makes the edits for a planner task itself, in the main tree and never in a worktree, then runs the same verify gate, reviewer and commit format, with the same follow-up budget. §1 treats a planner task as never parallel-safe. _Check:_ `rg -n "runner" specs/TEMPLATE/tasks.md .claude/skills/run-spec/SKILL.md` shows the field and the §1 and §2a rules; manual: this spec's own `/run-spec` runs T2–T5 with no `implementer` entries for them in `.claude/logs/agents.jsonl`, and a `reviewer` entry for each.
- **R2** — `.prettierrc.json` is exactly `{"semi": true, "singleQuote": true, "printWidth": 100, "trailingComma": "all"}`. `.prettierignore` lists `dist`, `coverage`, `research`, `.claude/worktrees`, `.claude/logs`, `package-lock.json`, `*.md`. `prettier` and `eslint-config-prettier` are devDependencies pinned to exact versions (no `^`/`~`). _Check:_ `node -e "const a=require('assert');a.deepStrictEqual(JSON.parse(require('fs').readFileSync('.prettierrc.json','utf8')),{semi:true,singleQuote:true,printWidth:100,trailingComma:'all'});const d=require('./package.json').devDependencies;for(const k of ['prettier','eslint-config-prettier'])a.match(d[k],/^\d+\.\d+\.\d+$/)"`, and `rg -c "" .prettierignore` shows 7 lines.
- **R3** — `eslint-config-prettier` is the last entry in `eslint.config.js`, so no ESLint rule fights Prettier. _Check:_ `node --input-type=module -e "import {isDeepStrictEqual as eq} from 'node:util'; import c from './eslint.config.js'; import p from 'eslint-config-prettier'; process.exit(eq(c.at(-1).rules,p.rules)?0:1)"` exits 0, and `npm run lint` passes.
- **R4** — `npm run format` runs `prettier --write .`. `npm run format:check` runs `prettier --check .`. `npm run verify` runs typecheck → lint → format:check → test:run → test:hooks. _Check:_ on a formatted tree `npm run format:check` exits 0; then `printf 'const a = "x"\n' > src/zz-fmt.ts && npm run format:check; echo $?; rm src/zz-fmt.ts` prints a non-zero code and names `src/zz-fmt.ts`. Markdown is ignored: an unformatted `specs/zz.md` doesn't fail it.
- **R5** — One mechanical commit formats the whole repo with `npm run format`, with no other changes. _Check:_ after that commit, `npm run verify` passes. For that commit, `git show --stat <sha>` lists only files that Prettier with R2's config reports from `--list-different` on the commit's parent.
- **R6** — `.git-blame-ignore-revs` holds the full SHA of the R5 commit, with a comment line naming it. `CLAUDE.md` gives the local opt-in, `git config blame.ignoreRevsFile .git-blame-ignore-revs`. _Check:_ `git cat-file -t $(rg -v '^#' .git-blame-ignore-revs)` prints `commit`, and that commit's subject is the R5 commit's.
- **R7** — The PostToolUse hook (`lint-edited-file.mjs`) runs `prettier --write` on the edited file first. Any file in the repo counts, not only `src/`. It uses the file's own repo root, so worktrees work. ESLint then runs on `src/**/*.ts(x)` as before. Files Prettier ignores or can't parse by extension (`*.md`, `research/`, `.gitignore`) are left untouched, with exit 0. A Prettier syntax error exits 2 with the error message. _Check:_ `node --test .claude/hooks/__tests__/lint-edited-file.test.mjs`, with tests for: an unformatted `src/*.ts` gets formatted; an unformatted `.mjs` outside `src/` gets formatted; a `.md` file stays byte-identical; a syntax error exits 2 with Prettier's message; a formatted file with an ESLint error still exits 2 with ESLint's message.
- **R8** — After the hook reformats a file, the agent can Edit that same file again without a stale-file error. _Check:_ manual: in a Claude Code session, Edit a `src/` file to add `const  x = "y"`, let the hook format it, then Edit the formatted line again. The second Edit succeeds.
- **R9** — scope-guard blocks implementers from `.prettierrc.json`, `.prettierignore` and `.git-blame-ignore-revs`. The main session and other paths behave as before. _Check:_ `node --test .claude/hooks/__tests__/scope-guard.test.mjs`, with tests for: implementer blocked on those three files; implementer allowed on `src/x.ts`; no `agent_type` allowed on `.prettierrc.json`.
- **R10** — The docs match the new setup:
  - `CLAUDE.md`'s verification list includes `format:check`, and its hooks section says edits are formatted, then linted.
  - `implementer.md` says the hook formats files it edits, never to run `npm run format` or Prettier on paths outside its allowed files, and to write files with Edit/Write rather than Bash so the hook sees them.
  - `reviewer.md` says not to flag formatting, because format:check owns it.

  _Check:_ `rg -n "format:check" CLAUDE.md` and `rg -n -i "prettier|format" .claude/agents/implementer.md .claude/agents/reviewer.md` show these lines.

## Constraints
- No data model change. No app behavior change: the reformat only changes whitespace, quotes, semicolons and trailing commas.
- Checks must work on CI's Node 20 and on local Node 25. All the command checks above were run on Node 25 against a scratch install of prettier 3.10.1 / eslint-config-prettier 10.1.8.
- Don't loosen scope-guard. Implementers stay blocked from all config.
- CI already runs `npm run verify`, so `.github/workflows/ci.yml` doesn't change, apart from being reformatted.

## Out of scope
- `.editorconfig`, `.vscode` settings, and editor format-on-save.
- Formatting Markdown (specs, retros, CLAUDE.md tables).
- Pre-commit hooks (husky, lint-staged). Verify and CI are the gate.
- Any ESLint rule change beyond adding `eslint-config-prettier` last.

## Open questions
- Bootstrap: T1 adds planner-task support to `/run-spec`, but `/run-spec` only knows about it after T1 is committed. T1 is itself a planner task, because the implementer is blocked from `.claude/`. So the orchestrator does T1 directly, then re-reads `SKILL.md` before T2 (see tasks.md).
