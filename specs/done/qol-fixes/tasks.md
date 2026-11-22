# Tasks: QoL fixes

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

## T1 — Tell "loading" apart from "no session"
- covers: [R1]
- runner: implementer
- allowed files: `src/db/database.ts`, `src/db/index.ts`, `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: "renders no check-in while the current session is loading" (`undefined` → no "Pre-Session Check-in" heading and no "End Session" button). Change the existing no-session mocks from `undefined` to `null`.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: `useLiveQuery` already yields `undefined` until the first result. Make `getCurrentSession()` resolve to `Session | null`, so the hook's type becomes `Session | null | undefined`. Session.tsx's render-time review sync (`currentSession?.id !== loadedId`) must still work with `null`.

## T2 — Viewport, overscroll and timer digit size
- covers: [R2, R3, R5]
- runner: implementer
- allowed files: `index.html`, `src/theme/theme.ts`, `src/theme/__tests__/theme.test.ts`, `src/pages/WorkoutRun.tsx`
- check: `npx vitest run src/theme/__tests__/theme.test.ts && rg -q 'viewport-fit=cover' index.html`
- tests to add: "contains vertical overscroll on html and body" reads `createAppTheme('dark').components?.MuiCssBaseline?.styleOverrides` and asserts both selectors set `overscrollBehaviorY: 'contain'`.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Use an object for `styleOverrides` so the test can read it. For R5, replace `fontSize: { xs: '5rem', sm: '6.5rem' }` with a `clamp()` using `vw`/`vh`. The digits use `tabular-nums`, so a 5-character "00:00" width is stable. Say in the report that R2/R3/R5 still need the manual checks.

## T3 — Workout form numeric fields
- covers: [R4]
- runner: implementer
- allowed files: `src/components/WorkoutFormDialog.tsx`, `src/components/__tests__/WorkoutFormDialog.test.tsx`
- check: `npx vitest run src/components/__tests__/WorkoutFormDialog.test.tsx`
- tests to add: the four named in R4, using `@testing-library/user-event`.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Hold each field as a string in state, and parse it for the total-length text and `canSave`. Replace `parsePositiveInt`'s fallback-on-change, which causes the "130" bug. Use `slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}` and `onFocus={(e) => { e.target.select(); }}`. Keep `onSave`'s `WorkoutFormValues` shape so `Workouts.tsx` doesn't change.

## T4 — Home copy
- covers: [R6]
- runner: implementer
- allowed files: `src/pages/Home.tsx`, `src/pages/__tests__/Home.test.tsx`
- check: `npx vitest run src/pages/__tests__/Home.test.tsx`
- tests to add: update the description assertion as R6 says.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Suggested copy: "Log your bouldering sessions, problems, attempts and hangboard timers. Your data stays on this device."
