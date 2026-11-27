# Tasks: UI accessibility pass

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

Shared notes for every task:
- The app has no visually-hidden helper and `@mui/utils` is not a direct dependency (knip would fail on an import). Where a task needs hidden text, inline the standard clip sx (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; margin: -1px; padding: 0; border: 0`) in that file. Don't create a shared module (it would couple parallel tasks).
- Don't touch the files the spec's Constraints exclude.
- R17 is covered by every task: `npm run verify` green, and change only the existing tests that R7, R8, R9 and R16 name.

## T1: Theme and shell (subtitle mapping, color-scheme, scroll padding)
- covers: [R1, R14, R15, R17]
- runner: implementer
- allowed files: `src/theme/theme.ts`, `src/App.tsx`, `src/theme/__tests__/theme.test.tsx`
- check: `npx vitest run src/theme/__tests__/theme.test.tsx src/__tests__/theme-usage.test.ts && rg -n 'enableColorScheme' src/App.tsx`
- tests to add: "subtitle variants are not headings" renders `subtitle1` and `subtitle2` Typography inside `ThemeProvider` with `createAppTheme('dark')`: no `heading` role, and the elements are `P`. Also assert that `h6` still renders `H6`.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: R1: use `typography` `MuiTypography.defaultProps.variantMapping` in `createAppTheme`, merging with MUI's defaults (only subtitle1/2 change). R14: `<CssBaseline enableColorScheme />` in `App.tsx`. R15: add `scrollPaddingTop` to the existing `MuiCssBaseline` `html` override, sized to the dense Toolbar (`theme.mixins.toolbar` dense is 48 px; you can derive it, don't guess), and keep `overscrollBehaviorY`. `src/theme/__tests__/` exists but is empty. R14 and R15 also have `manual:` checks; say in your report that you couldn't run them.

## T2: Layout landmarks, skip link and link navigation
- covers: [R4, R5, R6, R17]
- runner: implementer
- allowed files: `src/components/Layout.tsx`, `src/components/__tests__/Layout.test.tsx`
- check: `npx vitest run src/components/__tests__/Layout.test.tsx`
- tests to add:
  - "renders one main landmark", in normal and focus mode.
  - "skip link moves focus to main": it's the first tabbable element, and activating it gives `main` the focus.
  - "nav items are links with aria-current", desktop and mobile: `link` role, href ends `/session` or `/workouts`, active item `aria-current="page"`, the other has none, inside `navigation` named "Main".
  - Keep "home selects no tab", now also meaning no `aria-current`. Existing "tabs switch routes" and "bottom navigation still switches tabs" may change to query `link`; that's intended (R6).
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - R4: make the existing `Container` the landmark with `component="main"` plus `id` and `tabIndex={-1}`. Don't swap or wrap it: the focus-mode comment explains why, and "entering focus mode keeps the page mounted and its state" must pass unchanged.
  - R5: the skip link renders only when `!focus`, before the AppBar. Hide it with clip sx and show it on `:focus-visible`.
  - R6: `Tab component={RouterLink} to=…` and `BottomNavigationAction component={RouterLink} to=…`. MUI sets `role="tab"` on Tab, so check the rendered role really is `link` and override it if needed. Keep `getCurrentTab`'s `startsWith` matching, which ux-sessions relies on.
  - Drop the `onChange` + `useAppNavigate` routing if links make it dead (knip will tell you).
  - ux-sessions T7 also adds a test to `Layout.test.tsx`. Keep your edits local to new `it` blocks and the ones you must change, to keep the merge small.

## T3: Home actions as links
- covers: [R7, R17]
- runner: implementer
- allowed files: `src/pages/Home.tsx`, `src/pages/__tests__/Home.test.tsx`
- check: `npx vitest run src/pages/__tests__/Home.test.tsx`
- tests to add: update "renders heading, description and actions", "renders actions that navigate" and "navigates to workouts" to query `link` by the same names. Clicking still changes the path.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: `Button component={RouterLink} to="/session"` (and `/workouts`). Remove `useAppNavigate` from Home once it's unused.

## T4: Workouts headings, named row actions, failure alerts, status copy
- covers: [R2, R8, R9, R16, R17]
- runner: implementer
- allowed files: `src/pages/Workouts.tsx`, `src/pages/__tests__/Workouts.test.tsx`
- check: `npx vitest run src/pages/__tests__/Workouts.test.tsx`
- tests to add:
  - "section headings are level 3": Presets, Workouts, Recent runs.
  - "row actions are named after the workout": Start is a link to `/workouts/w1/run`.
  - Update the two failure tests to also assert the alert text (R9), and their `getByLabelText('edit'|'delete')` calls to the R8 names.
  - Add a test where a retry succeeds and the dialog closes.
  - "run status is capitalised": completed → "Completed", aborted → "Aborted".
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - R2: `component="h3"`, `variant="h6"` unchanged.
  - R8: Start becomes `IconButton component={RouterLink} to=…`. Check whether the test's `MemoryRouter` needs routes for the click.
  - R9: hold the error in page state and pass it into `WorkoutFormDialog` without editing that file. Render an `Alert` in the Workouts-owned delete dialog. For the save error, prefer rendering the `Alert` from Workouts too. If the only clean option is a new `WorkoutFormDialog` prop, stop and report instead (T5 owns that file).
  - Reuse the wording style of `SAVE_ERROR_MESSAGE` in `src/pages/Session.tsx`, but don't import from that page. Clear the error when the dialog closes or reopens.

## T5: WorkoutFormDialog inline errors and name field
- covers: [R10, R16, R17]
- runner: implementer
- allowed files: `src/components/WorkoutFormDialog.tsx`, `src/components/__tests__/WorkoutFormDialog.test.tsx`
- check: `npx vitest run src/components/__tests__/WorkoutFormDialog.test.tsx`
- tests to add:
  - "blurring an invalid field shows how to fix it": empty Name, `0` in Work, empty Rest, `0` in Intervals, each blurred, then `aria-invalid` and the R10 text.
  - "fixing the field clears the error".
  - "untouched fields show no error": open with defaults and with an empty name, and nothing is invalid before a blur.
  - "name field has no autocomplete".
  - Existing tests stay as they are.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Track `touched` per field and set it in `onBlur`. Keep `selectOnFocus` working, since "focus selects the field contents" must still pass.
  - Validity per field reuses `parseDigits` and the same bounds as `canSave`: don't duplicate the rules differently.
  - TextField's `error` + `helperText` sets `aria-invalid` and links the helper text through `aria-describedby`.
  - Placeholder: `e.g. 5-second holds…`.

## T6: WorkoutRun headings, live announcements, names
- covers: [R3, R11, R12, R17]
- runner: implementer
- allowed files: `src/pages/WorkoutRun.tsx`, `src/pages/__tests__/WorkoutRun.test.tsx`
- check: `npx vitest run src/pages/__tests__/WorkoutRun.test.tsx`
- tests to add:
  - "workout name is the heading and the countdown is not": level-2 heading with the name, and no heading contains the digits.
  - "announces phase changes, not ticks": fake timers, driving the real `useIntervalTimer` mid-run as the spec's check describes.
  - "progress and controls have names".
  - Keep "stays idle and logs when unlockAudio rejects".
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - R3: name `component="h2"` (`variant="h5"` unchanged). Countdown `variant="h1" component="p"`. The interval count under it is `variant="h6"`, which renders a heading too: give it `component="p"`. "Workout not found": `component="h2"`.
  - R11: one always-mounted, visually hidden `aria-live="polite"` region. It holds the phase word (title case, from the existing `phaseLabel` logic plus paused), then the done sentence. Don't put `aria-live` on the countdown.
  - R12: `LinearProgress` takes `aria-label` and `aria-valuetext` directly.
  - The `eslint-disable-next-line` at the mute-sync effect pre-dates this spec. Leave it alone and don't add new ones.
  - `src/utils/beep` is mocked in the test. Reuse that mock for `unlockAudio` resolving.

## T7: UndoSnackbar roles and focus pause
- covers: [R13, R17]
- runner: implementer
- allowed files: `src/components/UndoSnackbar.tsx`, `src/components/__tests__/UndoSnackbar.test.tsx`
- check: `npx vitest run src/components/__tests__/UndoSnackbar.test.tsx`
- tests to add: "info uses status role", "error uses alert role", and "does not auto-hide while Undo has focus" with fake timers, steps as in the spec's check. The existing tests stay, including undo-log R7's "Undo has an accessible name".
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - `Alert` takes a `role` prop.
  - MUI Snackbar pauses on mouse enter and window blur, not on focus. Track focus-within with `onFocus`/`onBlur` on the Alert, and pass `autoHideDuration={focused ? null : 8000}` so the timer restarts on blur. Check this against the installed MUI version.
  - Keep the `clickaway` guard and `minHeight: 48` on Undo.

## T8: DataCard heading and BackupReminder copy
- covers: [R2, R16, R17]
- runner: implementer
- allowed files: `src/components/DataCard.tsx`, `src/components/BackupReminder.tsx`, `src/components/__tests__/DataCard.test.tsx`, `src/components/__tests__/BackupReminder.test.tsx`
- check: `npx vitest run src/components/__tests__/DataCard.test.tsx src/components/__tests__/BackupReminder.test.tsx`
- tests to add: "title is a level-3 heading" (DataCard). Rename "Later snoozes for 7 days" to "Remind me in 7 days snoozes for 7 days" and update its queries. Its assertions stay the same.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: DataCard: `component="h3"`, keep `variant="h6"` and `gutterBottom`. BackupReminder: change only the label; the snooze logic stays the same.
