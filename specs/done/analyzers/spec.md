---
status: done              # draft | approved | done. /run-spec only runs approved specs.
commitment: spec-first # spec-first: frozen after shipping | spec-anchored: kept up to date with the code
---

# Analyzers

## Goal
`npm run verify` (and so CI, the stop hooks and every subagent) catches more bugs before review:
- ESLint runs type-aware rules, for example promises nobody awaited, which matter with Dexie.
- TypeScript runs stricter flags and checks the test files as well.
- Knip fails on dead files, unused exports and unused dependencies.

The existing code is brought up to these rules without changing its behavior. This is developer tooling; the climber sees nothing new.

## Context
Measured on `bb971b3` (master after PR #23):
- **The tests are not typechecked today.** `tsconfig.test.json` inherits `exclude: ["src/**/__tests__/**", …]` from `tsconfig.app.json`, so `tsc -p tsconfig.test.json --listFilesOnly` lists 0 of the 11 test files. CLAUDE.md says they are checked. With `exclude: []` they typecheck with 0 errors.
- **tsconfig flags.** `noUncheckedIndexedAccess`, `noImplicitOverride` and `noImplicitReturns` cost 0 errors in the app and 1 in the tests (`src/pages/__tests__/Session.test.tsx:134`, an index that may be `undefined`). `exactOptionalPropertyTypes` was rejected because it fights MUI's `IconButton` overload types.
- **typescript-eslint `strictTypeChecked`.** It reports 110 findings in 24 files with `projectService` and the test fix above. Most come from two rules:
  - `no-confusing-void-expression`: 41
  - `restrict-template-expressions`: 19

  The rest are mostly `no-unnecessary-condition`, `no-misused-promises`, `require-await` and `no-floating-promises`. Full lint goes from about 1 s to about 5 s. One-file lint, which is what the edit hook runs, takes about 2–2.5 s.
- **Rollout.** ESLint 9.39 bulk suppressions (`--suppress-all`) record today's findings in `eslint-suppressions.json`, so lint passes while the fix tasks run. A suppression that no longer matches makes `eslint` exit 2 until `--prune-suppressions` runs, so the file can only shrink. Prettier reformats the file ESLint writes, so the file goes in `.prettierignore`.
- **Knip 6.44.1** (needs Node ^20.19 or ≥22.12; CI's `node-version: '20'` resolves to a 20.x that satisfies this). With `entry` set to the hook scripts it reports exactly:
  - 1 unused file: `src/services/sheetsService.ts`
  - 3 unused dependencies: `@chakra-ui/icons`, `@chakra-ui/react` and `framer-motion`. The app uses MUI.
  - 3 unused exports: `useSessionWithDetails` and `BoulderLogDatabase` in `src/db/index.ts`, and `truncate` in `src/utils/validation.ts`.
  - 3 unused exported types: `PreSessionData`, `TimerPhase` and `IntervalTimerState`.

  It runs in about 3 s.
- **Where each check runs.** `verify` stays the one gate, used by the edit, stop and SubagentStop hooks and by CI. So CI picks up knip and the new rules with no workflow change.
  - The per-edit hook stays one-file ESLint, now type-aware. It catches the issue on the edit that causes it.
  - Knip is project-wide, so it runs in `verify` only.
- Almost every file here is protected by `scope-guard.mjs`, so the config tasks are `runner: planner`. The code fixes are implementer tasks.
- Relevant code: `eslint.config.js`, `tsconfig*.json`, `package.json`, `.prettierignore`, `.claude/hooks/lint-edited-file.mjs` (and its test), `.claude/hooks/scope-guard.mjs` (and its test), `CLAUDE.md`, `.claude/agents/{implementer,reviewer}.md`, `README.md`.

## Requirements
- **R1** — `tsconfig.test.json` typechecks every `src/**/*.test.ts(x)` file and `src/setupTests.ts`.
  - _Check:_ `npx tsc -p tsconfig.test.json --listFilesOnly | grep -cE '/src/.*\.test\.tsx?$'` equals `find src -name '*.test.ts*' | wc -l`.
  - _Check:_ `npm run typecheck` passes.
- **R2** — `tsconfig.app.json` and `tsconfig.node.json` set `noUncheckedIndexedAccess`, `noImplicitOverride` and `noImplicitReturns` to `true`. `tsconfig.test.json` inherits them. `exactOptionalPropertyTypes` is not set.
  - _Check:_ `for p in app node test; do npx tsc -p tsconfig.$p.json --showConfig | node -e "const o=JSON.parse(require('fs').readFileSync(0)).compilerOptions;for(const k of ['noUncheckedIndexedAccess','noImplicitOverride','noImplicitReturns'])if(o[k]!==true)process.exit(1);if(o.exactOptionalPropertyTypes)process.exit(1)" || echo FAIL $p; done` prints nothing.
  - _Check:_ `npm run typecheck` passes.
- **R3** — `eslint.config.js` applies `tseslint.configs.strictTypeChecked` to `**/*.{ts,tsx}`, with type information from `parserOptions.projectService`. No rule from that preset is turned off or downgraded. The existing react-hooks, react-refresh and unused-vars settings stay. `eslint-config-prettier` stays last.
  - _Check:_ `npx eslint --print-config src/pages/Session.tsx | node -e "const r=JSON.parse(require('fs').readFileSync(0)).rules;for(const k of ['no-floating-promises','no-misused-promises','no-confusing-void-expression','restrict-template-expressions','no-unnecessary-condition','await-thenable'])if(![2,'error'].includes([].concat(r['@typescript-eslint/'+k])[0]))process.exit(1)"` exits 0. The formatter spec's R3 check still exits 0. `npm run lint` passes with no parsing errors.
- **R4** — Rollout through bulk suppressions. The task that turns on R3 also creates `eslint-suppressions.json` with `--suppress-all`. After that, every commit only removes entries or lowers counts. The last task deletes the file. No new `eslint-disable`, `@ts-ignore`, `@ts-expect-error` or `as any` is added anywhere.
  - _Check:_ at the branch tip, `test ! -e eslint-suppressions.json`.
  - _Check:_ `git diff master...HEAD -- . ':!specs' ':!.claude/agents' | rg '^\+.*(eslint-disable|@ts-ignore|@ts-expect-error|as any)'` prints nothing (the excluded docs quote the banned patterns).
  - _Check:_ for each fix task, the shrink check in `tasks.md` exits 0.
- **R5** — The code fixes don't change behavior. Every existing test still passes, and none is deleted, skipped or loosened. Where a fix changes what an async handler does on error, for example a promise that used to reject silently and now has a `.catch`, a test covers it.
  - _Check:_ `npm run verify` passes. The reviewer confirms each fix diff is a type-level or equivalent refactor.
  - _Check:_ manual: `npm start`. Start a session, log a problem with attempts, end the session, then create and run a workout. All of it behaves as before.
- **R6** — Knip runs as `npm run knip` (`knip`).
  - `knip` is an exact-pinned devDependency at `6.44.1`.
  - `knip.json` has a `$schema` and an `entry` list for the hook scripts and `scripts/*.mjs`. It has no `ignore`, `ignoreFiles`, `ignoreDependencies` or `ignoreExportsUsedInFile`.

  _Check:_ `npm run knip` exits 0, and `node -e "const k=require('./knip.json');for(const x of ['ignore','ignoreFiles','ignoreDependencies','ignoreExportsUsedInFile'])if(x in k)process.exit(1)"` exits 0.
- **R7** — The dead code is removed:
  - `src/services/sheetsService.ts` is deleted, along with its tests if any.
  - `@chakra-ui/icons`, `@chakra-ui/react` and `framer-motion` are removed from `package.json` and the lockfile.
  - The 3 unused exports and 3 unused exported types are un-exported. If a symbol is also unused locally, it is deleted.

  _Check:_ `npm run knip` exits 0. `rg -n 'chakra|framer-motion' package.json` prints nothing. `npx vite build` passes.
- **R8** — `npm run verify` runs typecheck → lint → format:check → knip → test:run → test:hooks. _Check:_ `node -e "process.exit(require('./package.json').scripts.verify==='npm run typecheck && npm run lint && npm run format:check && npm run knip && npm run test:run && npm run test:hooks'?0:1)"` exits 0.
- **R9** — The edit hook's ESLint step is type-aware, in the main tree and in worktrees.
  - _Check:_ `node --test .claude/hooks/__tests__/lint-edited-file.test.mjs`. Its temp repo gets the tsconfig files it needs.
  - It tests that an un-awaited promise in a `src/*.ts` file exits 2, with `no-floating-promises` in stderr.
  - The existing cases still pass.
- **R10** — scope-guard blocks implementers from `knip.json` and `eslint-suppressions.json`. Implementers can still shrink the suppressions file with the `--prune-suppressions` command (Bash), which scope-guard doesn't see. _Check:_ `node --test .claude/hooks/__tests__/scope-guard.test.mjs`, with tests that an implementer is blocked on both files.
- **R11** — The docs match the new setup.
  - `CLAUDE.md` changes:
    - The verification list includes `knip`, and the typecheck line is true: tests really are checked.
    - A rule: fix knip findings by removing code, never by adding `ignore*` entries.
    - A rule: never run `--suppress-all` or `--suppress-rule`. After fixing a suppressed finding, run `npx eslint --prune-suppressions`.
  - `implementer.md` says the same in one or two lines.
  - `reviewer.md` adds these to its check-dodging list:
    - `knip.json` ignore entries.
    - Any growth in `eslint-suppressions.json`, or its reappearance.
    - `void` used to silence a floating promise that has no error handling.

  _Check:_ `rg -n "knip|suppress" CLAUDE.md .claude/agents/implementer.md .claude/agents/reviewer.md` shows these lines.
- **R12** — The README has two new static shields next to the existing badges: "code style: prettier" and "TypeScript: strict". The Scripts table lists `format`, `format:check` and `knip`. The `verify` row says what it now runs.
  - _Check:_ `rg -n "img.shields.io/badge/(code_style|TypeScript)" README.md` shows 2 lines, and `rg -n '`npm run (format|format:check|knip)`' README.md` shows 3.
  - _Check:_ manual: the badges render on the GitHub repo page.

## Constraints
- No data-model change and no Dexie `version()` bump. No user-visible behavior change.
- Checks must pass on CI's Node 20 and on local Node 25.
- Don't loosen scope-guard. Implementers stay blocked from all config.
- `.github/workflows/ci.yml` doesn't change. CI gets the new checks through `npm run verify`.
- Fix the cause, never the check (CLAUDE.md). The suppressions file is a temporary ratchet, not a place to hide findings.

## Out of scope
- `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature`.
- CodeQL, Semgrep and other SAST tools. jsx-a11y and other new ESLint plugins. Switching to Biome or Oxlint. dependency-cruiser.
- Coverage thresholds, and any badge that needs a service (CodeQL, Codecov).
- Rewriting the existing `eslint-disable-next-line react-hooks/exhaustive-deps` in `src/pages/WorkoutRun.tsx:80`.

## Open questions
- None. Decided in the interview: full `strictTypeChecked`, the 3 tsconfig flags, delete `sheetsService.ts`, and the Prettier and TypeScript badges.
