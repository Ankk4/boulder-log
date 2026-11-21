# Tasks: Analyzers

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

**Why nothing here is parallel:** every fix task (T3–T7, T9) shrinks the same file, `eslint-suppressions.json`, so their diffs would conflict on cherry-pick.

**Fix-task recipe (T3–T7, T9).** Implementers follow this; it applies R4 and R5.
1. List the task's findings: `npx eslint <allowed src files>`. Suppressed findings don't print by default, so read the entries for those files in `eslint-suppressions.json`.
2. Fix them in the code.
   - `npx eslint --fix <allowed files>` is fine for auto-fixable rules such as `no-confusing-void-expression`.
   - Afterwards run `npx prettier --write <allowed files>`, because the edit hook doesn't see changes made through Bash.
3. Run `npx eslint --prune-suppressions .`. scope-guard blocks Edit/Write on the suppressions file, so this command is the only way to change it. Never use `--suppress-all` or `--suppress-rule`.
   - The edit hook exits 2 with "There are suppressions left that do not occur anymore" once you fix a suppressed finding. That means: prune.
4. Run the **shrink check**. It must exit 0:
   ```
   node -e "const {execSync:x}=require('child_process');const o=JSON.parse(x('git show HEAD:eslint-suppressions.json'));const fs=require('fs');const n=fs.existsSync('eslint-suppressions.json')?JSON.parse(fs.readFileSync('eslint-suppressions.json','utf8')):{};for(const [f,r] of Object.entries(n))for(const [k,v] of Object.entries(r))if(!(o[f]?.[k]?.count>=v.count)){console.error('suppressions grew: '+f+' '+k);process.exit(1)}"
   ```
5. After the task, `eslint-suppressions.json` has no entries left for the task's files.

**How to fix specific rules** (the R5 guardrails):
- `no-misused-promises` and `no-floating-promises`:
  - Wrap the handler: `onClick={() => { void save(); }}`.
  - `save` must handle its own errors. If it used to reject silently, keep the visible behavior the same, add a `.catch`/`try` that logs or keeps the current UI state, and test that path.
  - A bare `void` on a promise with no error handling is check-dodging.
- `no-unnecessary-condition`:
  - If the guard protects data from IndexedDB, or other runtime data that the types claim can't be missing, fix the **type** (`T | undefined`) instead of deleting the guard.
  - Delete a guard only when it really is dead.
- `restrict-template-expressions`: use `String(n)` or an existing formatter such as `formatDuration` in `src/utils/duration.ts`. Don't use `as string`.
- `require-await`: drop `async` only if no caller depends on the function returning a promise. Otherwise `return Promise.resolve(...)`.
- Never add `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `as any` or `!`. That last one is non-null assertion, which strict also bans.

## T1: typecheck the tests; 3 new tsconfig flags
- covers: [R1, R2]
- runner: planner
- allowed files: `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`, `src/pages/__tests__/Session.test.tsx`
- check: the R1 and R2 `_Check:_` commands, then `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - `tsconfig.test.json`: add `"exclude": []`. Keep its `include` list.
  - Add the 3 flags to the "Linting" block of the app and node configs.
  - The one new error is at `Session.test.tsx:134`, an index that may be `undefined`. Fix it with an explicit assertion (`expect(x).toBeDefined()` and a narrowing guard), not with `!`.

## T2: strictTypeChecked, seeded suppressions, hook test, scope-guard
- covers: [R3, R4, R9, R10]
- runner: planner
- allowed files: `eslint.config.js`, `eslint-suppressions.json`, `.prettierignore`, `.claude/hooks/__tests__/lint-edited-file.test.mjs`, `.claude/hooks/scope-guard.mjs`, `.claude/hooks/__tests__/scope-guard.test.mjs`
- check:
  - the R3 `_Check:_` command
  - `npm run lint`
  - `node --test .claude/hooks/__tests__/lint-edited-file.test.mjs .claude/hooks/__tests__/scope-guard.test.mjs`
  - `npm run verify`
- tests to add: the R9 floating-promise case; the R10 cases (implementer blocked on `knip.json` and `eslint-suppressions.json`)
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes:
  - This task edits `.claude/`, so expect a permission prompt.
  - In the `**/*.{ts,tsx}` block, change `extends` to `[js.configs.recommended, ...tseslint.configs.strictTypeChecked]`. Add `languageOptions.parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }`.
  - Then run `npx eslint --suppress-all .`. The spec Context measured about 110 entries across 24 files. Commit the file as ESLint writes it.
  - Add `eslint-suppressions.json` to `.prettierignore`. Prettier would rewrite it otherwise.
  - scope-guard: add `knip.json` and `eslint-suppressions.json` to `protectedForImplementer` now, before the fix tasks rely on it (fix-task recipe step 3). `knip.json` doesn't exist until T8; the rule is a path match.
  - Hook test: the temp repo also needs `tsconfig.json` and `tsconfig.{app,node,test}.json` copied in, or the type-aware parse fails. Add a case where a `src/*.ts` file has an un-awaited promise. Assert exit 2 and `no-floating-promises` in stderr. Keep the existing cases.

## T3: fix lint in the workouts screens
- covers: [R4, R5]
- runner: implementer
- allowed files: `src/pages/Workouts.tsx`, `src/components/WorkoutFormDialog.tsx`, `src/pages/WorkoutRun.tsx`, their `__tests__/`, `eslint-suppressions.json` (only through `--prune-suppressions`)
- check: `npx eslint src/pages/Workouts.tsx src/components/WorkoutFormDialog.tsx src/pages/WorkoutRun.tsx`, the shrink check, then `npm run verify`
- tests to add: only where a fix changes error handling (R5)
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes:
  - Follow the fix-task recipe. There are about 27 findings.
  - Leave the existing `exhaustive-deps` disable at `WorkoutRun.tsx:80` alone (spec Out of scope).

## T4: fix lint in the session forms
- covers: [R4, R5]
- runner: implementer
- allowed files: `src/components/PreSessionForm.tsx`, `src/components/PastSessionsList.tsx`, `src/components/QuickLog.tsx`, their `__tests__/`, `eslint-suppressions.json` (only through `--prune-suppressions`)
- check: `npx eslint src/components/PreSessionForm.tsx src/components/PastSessionsList.tsx src/components/QuickLog.tsx`, the shrink check, then `npm run verify`
- tests to add: only where a fix changes error handling (R5)
- parallel-safe: no
- schema-change: no
- depends-on: [T3]
- notes:
  - Follow the fix-task recipe. There are about 28 findings.
  - Don't touch the `PreSessionData` export here; T9 owns it.

## T5: fix lint in Session, Home, Layout and main
- covers: [R4, R5]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/Home.tsx`, `src/components/Layout.tsx`, `src/main.tsx`, `src/pages/__tests__/Session.test.tsx`, `src/components/__tests__/Layout.test.tsx`, `eslint-suppressions.json` (only through `--prune-suppressions`)
- check: `npx eslint src/pages/Session.tsx src/pages/Home.tsx src/components/Layout.tsx src/main.tsx src/pages/__tests__/Session.test.tsx src/components/__tests__/Layout.test.tsx`, the shrink check, then `npm run verify`
- tests to add: only where a fix changes error handling (R5)
- parallel-safe: no
- schema-change: no
- depends-on: [T4]
- notes:
  - Follow the fix-task recipe. There are about 32 findings; 19 are in `Session.test.tsx`.
  - Page tests assert on the mocked `db` export (CLAUDE.md Testing notes). Keep those assertions as they are.

## T6: fix lint in the hooks and the db layer
- covers: [R4, R5]
- runner: implementer
- allowed files: `src/hooks/useFocusMode.ts`, `src/hooks/useIntervalTimer.ts`, `src/hooks/useWakeLock.ts`, `src/db/database.ts`, `src/hooks/__tests__/`, `src/db/__tests__/`, `eslint-suppressions.json` (only through `--prune-suppressions`)
- check: `npx eslint src/hooks src/db`, the shrink check, then `npm run verify`
- tests to add: only where a fix changes error handling (R5)
- parallel-safe: no
- schema-change: no
- depends-on: [T5]
- notes:
  - Follow the fix-task recipe. There are about 8 findings.
  - `database.ts` makes no schema change and no `version()` edit.
  - `useWakeLock` talks to a browser API that can be missing. That is a real `no-unnecessary-condition` case, so fix the type rather than deleting the guard.
  - Leave the `TimerPhase` and `IntervalTimerState` exports alone; T9 owns them.

## T7: fix lint in utils and the shared test files
- covers: [R4, R5]
- runner: implementer
- allowed files: `src/utils/beep.ts`, `src/utils/csv.ts`, `src/utils/duration.ts`, `src/utils/__tests__/`, `src/__tests__/branding.test.ts`, `src/__tests__/theme-usage.test.ts`, `src/setupTests.ts`, `eslint-suppressions.json` (only through `--prune-suppressions`)
- check: `npx eslint src/utils src/__tests__ src/setupTests.ts`, the shrink check, then `npm run verify`
- tests to add: only where a fix changes error handling (R5)
- parallel-safe: no
- schema-change: no
- depends-on: [T6]
- notes:
  - Follow the fix-task recipe. There are about 13 findings.
  - `setupTests.ts` holds the global mocks (CLAUDE.md Testing notes). Change types only; the mocks' behavior must not change.

## T8: Knip setup and the unused dependencies
- covers: [R6, R7]
- runner: planner
- allowed files: `knip.json`, `package.json`, `package-lock.json`
- check: `npm run knip` reports only the R7 file, export and type findings, with no dependency findings. Then the R6 `node -e` key check, and `npm run verify`.
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T7]
- notes:
  - `npm i -D -E knip@6.44.1`, and `npm uninstall @chakra-ui/icons @chakra-ui/react framer-motion`.
  - Use the `knip.json` from the spec Context. `entry` is `.claude/hooks/*.mjs`, `.claude/hooks/lib/*.mjs` and `scripts/*.mjs`.
  - Add `"knip": "knip"` to the scripts, but **not** to `verify` yet: the `src/` findings are still there until T9. T10 completes R8.
  - Run `npx vite build` once to prove nothing imported the removed packages.

## T9: remove dead code in src
- covers: [R4, R7]
- runner: implementer
- allowed files: `src/services/sheetsService.ts` (delete), `src/db/index.ts`, `src/utils/validation.ts`, `src/components/PreSessionForm.tsx`, `src/hooks/useIntervalTimer.ts`, their `__tests__/`, `eslint-suppressions.json` (only through `--prune-suppressions`)
- check: `npm run knip` exits 0, the shrink check, `test ! -e src/services/sheetsService.ts`, then `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T8]
- notes:
  - Deleting `sheetsService.ts` leaves its 3 suppression entries unused, so prune them (recipe steps 3–4).
  - Un-export `truncate`, `PreSessionData`, `TimerPhase` and `IntervalTimerState`.
  - Delete them instead if nothing in their own file uses them: `useSessionWithDetails`, and the `export { BoulderLogDatabase }` re-export.
  - If a test or a `vi.mock` of `../../db/index` names a removed symbol, remove that mention. Don't add the export back to satisfy a mock.
  - Fix dead code by removing code. Never edit `knip.json` (R6).

## T10: knip in verify; end the rollout; docs and README
- covers: [R4, R8, R11, R12]
- runner: planner
- allowed files: `package.json`, `eslint-suppressions.json` (delete), `CLAUDE.md`, `.claude/agents/implementer.md`, `.claude/agents/reviewer.md`, `README.md`
- check:
  - all three R4 `_Check:_` commands
  - the R8 `_Check:_` command
  - the R11 and R12 `_Check:_` commands
  - `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T9]
- notes:
  - This task edits `.claude/`, so expect a permission prompt.
  - `package.json`: `verify` order per R8.
  - Before deleting `eslint-suppressions.json`, it should hold no entries (`{}`). If anything is left, stop and report which task missed it.
  - Keep the `.prettierignore` entry for future rollouts.
  - CLAUDE.md:
    - Add `npm run knip` as verification step 4 and renumber.
    - Fix the typecheck line so it matches R1.
    - Add the two R11 rules under "Rules".
  - implementer.md and reviewer.md: one or two lines each (R11).
  - README:
    - Add the two shields after the License badge, linking to prettier.io and to `tsconfig.app.json`.
    - In the Scripts table, add rows for `format`, `format:check` and `knip`.
    - Change the `verify` row to "Typecheck, lint, format check, dead-code check and tests (the definition of done)".
