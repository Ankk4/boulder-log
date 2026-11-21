# Tasks: Upgrade

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

**Why almost everything is `planner` and sequential:** every bump edits `package.json` and `package-lock.json`, which are scope-guarded and would conflict between worktrees. Only T4, a new test file, goes to an implementer.

**Bump recipe (every planner task).**
1. Precondition: `node -v` starts with `v26.`, or stop (spec Constraints).
2. `npm install [-D] <pkg>@<major> …` for the task's packages only. Never `npm audit fix --force`, never hand-edit the lockfile, no `overrides`.
3. Fix the fallout in the allowed files. The probe list is in spec.md Context. Follow the rules from the analyzers spec (`specs/done/analyzers/tasks.md`, "How to fix specific rules").
4. Run `npm run format` if the Prettier version changed, then `npm run verify`. Commit once it's green.
5. If a fix seems to need an allowed file not listed, a rule loosened, or a version pinned back, stop and ask (R8).

## T1: Node 26, workflow actions, @types/node
- covers: [R1, R2, R3]
- runner: planner
- allowed files: `.nvmrc`, `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md`
- check: the R1, R2 and R3 `_Check:_` commands, then `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - `npm install -D @types/node@26`.
  - In both workflows, `setup-node` gets `node-version-file: .nvmrc` (keep `cache: npm`).
  - Bump the actions to the majors in R3, and read each action's release notes for renamed inputs. `deploy.yml` has no `configure-pages` step; don't add one.
  - Leave the audit step alone; T10 changes it.

## T2: Vite 8, plugin-react 6, Vitest 5, coverage-v8 5, jsdom 29
- covers: [R4, R6]
- runner: planner
- allowed files: `package.json`, `package-lock.json`, `vite.config.ts`, `src/setupTests.ts`
- check: `npm run verify && npx vite build`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes:
  - This clears the critical (tinypool, via vitest) and high (vite, source-map-js) findings in R6.
  - Vite 8 bundles with Rolldown. `vite.config.ts:19` has `build.rollupOptions`, so move it to `build.rolldownOptions` if Vite warns, and keep the same output.
  - `base: '/boulder-log/'` must survive (R14).
  - Check the Vitest 5 migration guide against the `test:` block in `vite.config.ts` (`globals`, `environment`, `setupFiles`, coverage keys).

## T3: TypeScript 6.0, ESLint 10, typescript-eslint, minor tooling
- covers: [R4, R8]
- runner: planner
- allowed files: `package.json`, `package-lock.json`, `eslint.config.js`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`, plus any `src/**` file where a new finding appears
- check: `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes:
  - Packages: `typescript@~6.0`, `eslint@10`, `@eslint/js@10`, `typescript-eslint@latest`, `globals`, `prettier`, `knip` and `eslint-plugin-react-refresh` at latest.
  - Also install `eslint-plugin-react-hooks@7` here (user-approved change, 2026-11-21): v5's peer range stops at ESLint 9, so ESLint 10 can't install without it. Keep T3's lint config to the rules the repo has today (`rules-of-hooks`, `exhaustive-deps`); T5 turns the compiler rules on and fixes their findings after T4's test exists. `eslint.config.js` is already an allowed file.
  - TS 6 changed several compiler defaults (for example `types`). `tsconfig.test.json` already lists `types`. If app or node configs lose ambient types, add an explicit `types` entry rather than loosening anything.
  - TS 6 also removes deprecated options. Run `tsc -b` and fix what it names.
  - If `tseslint.config()` is deprecated, switch to `defineConfig` from `eslint/config` with the same blocks and rules (R8).
  - Prettier pinned `3.10.1` and knip pinned `6.44.1` stay exact-pinned at their new versions.
  - If Prettier reformats files, run `npm run format`. If more than about 10 files change, add the commit to `.git-blame-ignore-revs` and say so. Editing that file means adding it to this task's allowed files.

## T4: useIntervalTimer behavior test (before the lint fix)
- covers: [R10]
- runner: implementer
- allowed files: `src/hooks/__tests__/useIntervalTimer.test.ts`
- check: `npx vitest run src/hooks/__tests__/useIntervalTimer.test.ts`
- tests to add: the R10 cases, run against the **current** `src/hooks/useIntervalTimer.ts`, which this task must not edit
- parallel-safe: yes
- schema-change: no
- depends-on: [T2]
- notes:
  - Use `renderHook` and `act` from `@testing-library/react`, plus `vi.useFakeTimers()`.
  - The loop is driven by `requestAnimationFrame` and `performance.now()`, so stub both and advance them together. A small helper that advances N ms and flushes rAF callbacks inside `act` is fine.
  - Mock `../../utils/beep` and assert the `playBeep(kind, muted)` calls: `'tick'` on prepare, `'start'` on work, `'end'` on rest.
  - `PREPARE_SECONDS` comes from `src/utils/duration.ts`; import it rather than hard-coding the number.
  - Assert public results only (`phase`, `currentInterval`, `secondsRemaining`, `completedIntervals`, `isPaused`, `muted`), never refs. That way T5 can change the internals and the test stays the same.
  - Pattern reference: `src/hooks/__tests__/useFocusMode.test.tsx`.

## T5: react-hooks 7 compiler rules and their findings
- covers: [R8, R10, R13]
- runner: planner
- allowed files: `package.json`, `package-lock.json`, `eslint.config.js`, `src/hooks/useIntervalTimer.ts`, `src/components/WorkoutFormDialog.tsx`, `src/pages/Workouts.tsx`, `src/pages/Session.tsx`
- check: `npm run lint && npx vitest run src/hooks/__tests__/useIntervalTimer.test.ts src/pages/__tests__/Workouts.test.tsx src/pages/__tests__/Session.test.tsx && npm run verify`
- tests to add: none (T4 covers the timer). `git diff HEAD~1 -- src/hooks/__tests__/useIntervalTimer.test.ts` must be empty (R10).
- parallel-safe: no
- schema-change: no
- depends-on: [T3, T4]
- notes:
  - v7 exposes the recommended set as a flat config. Use whichever key v7 documents for flat config, so that the compiler rules are on (R8). Don't spread the rules by hand if that drops any of them.
  - `useIntervalTimer.ts`, `refs`/`immutability`:
    - `configRef.current = config;` is written during render. Move it into an effect, or use the ref pattern the rule suggests.
    - The mirror effects (`phaseRef.current = phase`) may be flagged too. Keep the rAF loop reading refs; only change where refs are written.
    - T4 must still pass unchanged.
  - `WorkoutFormDialog.tsx`, `set-state-in-effect`:
    - Replace the reset effect (lines 57–72). Option A: `Workouts.tsx:224` gives the dialog a `key` that changes per open/initial, so state comes from `useState(initial ?? defaults)`. Option B: the "adjust state when a prop changes" pattern from the React docs.
    - Either way, editing a workout must still pre-fill it, and opening "new" must show the defaults (R13).
  - `Session.tsx`, `purity`:
    - `Date.now()` at about line 212 renders the elapsed minutes. Hold `now` in state and update it from a `setInterval` in an effect (with cleanup).
    - A minute-level tick is enough. The display must keep updating (R13).

## T6: React 19, Testing Library 16, jest-dom 8
- covers: [R4, R9]
- runner: planner
- allowed files: `package.json`, `package-lock.json`, `src/setupTests.ts`, `src/main.tsx`, plus `src/**` files with React 19 type errors
- check: `npm run verify` and the R9 `_Check:_`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T5]
- notes:
  - Packages: `react@19`, `react-dom@19`, `@types/react@19`, `@types/react-dom@19`, `@testing-library/react@16`, `@testing-library/dom@10` (now a peer dep, so add it explicitly), `@testing-library/jest-dom@8` and `@testing-library/user-event@latest`.
  - Change `src/setupTests.ts` to `import '@testing-library/jest-dom/vitest';`. This is the fix for the ~30 `toBeInTheDocument`/`no-unsafe-call` errors in the probe.
  - React 19 type changes to watch for: `useRef()` now needs an argument, the global `JSX` namespace is gone (use `React.JSX`), and ref is passed as a prop. The probe showed none, but check.
  - If knip flags `@testing-library/dom` as unused, it's a peer dependency, so it stays. Tell the user rather than adding an ignore entry.

## T7: MUI 9 and Emotion
- covers: [R4, R13]
- runner: planner
- allowed files: `package.json`, `package-lock.json`, `src/components/PageHeader.tsx`, `src/components/PastSessionsList.tsx`, `src/components/PreSessionForm.tsx`, `src/components/QuickLog.tsx`, `src/components/WorkoutFormDialog.tsx`, `src/components/Layout.tsx`, `src/pages/Session.tsx`, `src/pages/WorkoutRun.tsx`, `src/pages/Workouts.tsx`, `src/pages/Home.tsx`, plus their `__tests__` files, the theme file and any other `src/**` file `tsc` names
- check: `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T6]
- notes:
  - Packages: `@mui/material@9`, `@mui/icons-material@9`, `@emotion/react@latest`, `@emotion/styled@latest`.
  - Use MUI's codemods first (`npx @mui/codemod@latest <v6/v7/v9 preset> src`, per the migration guides), then fix what's left by hand.
  - The main fixes:
    - System props move into `sx` (`<Stack mb={2}>` becomes `<Stack sx={{ mb: 2 }}>`). Merge into an existing `sx` rather than duplicating it.
    - `TextField` `inputProps` becomes `slotProps={{ htmlInput: … }}`.
    - Also handle the deprecated `components`/`componentsProps` props and the old `Grid`.
  - Pure visual mapping; no new components (spec Out of scope). The user checks spacing against master side by side (R13), so keep the values exactly as they are.

## T8: React Router 7 (`react-router`), navigate promises
- covers: [R4, R5, R6]
- runner: planner
- allowed files: `package.json`, `package-lock.json`, `src/App.tsx`, `src/components/Layout.tsx`, `src/pages/Home.tsx`, `src/pages/WorkoutRun.tsx`, `src/pages/Workouts.tsx`, `src/hooks/useAppNavigate.ts`, `src/hooks/__tests__/useAppNavigate.test.tsx`, plus `src/**/__tests__` files that import `react-router-dom`
- check: the R5 `_Check:_`, then `npx vitest run src/hooks/__tests__/useAppNavigate.test.tsx && npm run verify`
- tests to add:
  - `useAppNavigate` forwards path and options to `navigate`.
  - A rejected navigation promise is caught and logged with `console.error`, not left unhandled.
- parallel-safe: no
- schema-change: no
- depends-on: [T7]
- notes:
  - Run `npm uninstall react-router-dom && npm install react-router@7`, then swap every import to `react-router`. `BrowserRouter`, `Link`, `Navigate`, `useNavigate`, `useLocation` and `useParams` all exist there.
  - Keep the `basename` setup in `App.tsx` as it is (R14).
  - `navigate()` is typed `void | Promise<void>`. Don't scatter `void navigate(...)`; the analyzers spec counts that as check-dodging.
    - Add `src/hooks/useAppNavigate.ts`, which wraps `useNavigate` and returns a `(to, options?) => void` that does `Promise.resolve(navigate(to, options)).catch((e: unknown) => { console.error(e); })`.
    - Use it at the 7 call sites. `navigate(-1)`-style number calls need an overload if any exist.
  - This clears the last production audit findings (react-router).
  - The hook goes in its own file with no component, because of `react-refresh/only-export-components`.

## T9: Dexie 4 and dexie-react-hooks 4
- covers: [R4, R11]
- runner: planner
- allowed files: `package.json`, `package-lock.json`, `src/db/database.ts`, `src/db/index.ts`, `src/setupTests.ts`, `src/pages/__tests__/Session.test.tsx`
- check: the R11 `_Check:_`, then `npm run verify`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T8]
- notes:
  - `npm install dexie@4 dexie-react-hooks@4`.
  - The probe showed no fallout. `Table<T>` still works, so don't migrate to `EntityTable` (that's not needed).
  - Don't touch `version()`/`stores()`.
  - If the global Dexie mock in `src/setupTests.ts` breaks against v4 exports, fix the mock, not the tests.

## T10: Audit gate, final verification
- covers: [R4, R6, R7, R12, R13, R14]
- runner: planner
- allowed files: `package.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md`, `CLAUDE.md`
- check: the R4, R6, R7 and R12 `_Check:_` commands. Then hand R13 and R14 (manual) to the user, with the steps from spec.md.
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T9]
- notes:
  - `verify:full` becomes `npm run verify && vite build && npm audit --audit-level=moderate`.
  - `ci.yml` gets an `Audit` step with the same command, after `npm ci`.
  - `deploy.yml` changes its existing audit step to it.
  - Update the `verify:full` line in `CLAUDE.md` ("`npm audit` (production deps only)") and any README mention to match.
  - If R4 shows something new tagged `latest` since T2–T9, bump it here with the recipe if it's a minor. If it's a new major, ask.
