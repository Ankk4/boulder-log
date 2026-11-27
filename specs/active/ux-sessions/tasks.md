# Tasks: Session UX

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

**Base:** see spec.md › Context. quicklog-speed T1–T4 are already on this branch, so the allowed files and notes below are current. Reviewers diff against `feature/quicklog-speed` until it merges to master.

Order: T1, T2 and T5 first (independent), then T3 and T4, then T6 → T7 → T8 on `Session.tsx`, with T9 alongside, and T10 last.

## T1 — Shared RatingPicker component
- covers: [R10]
- runner: implementer
- allowed files: `src/components/RatingPicker.tsx`, `src/components/__tests__/RatingPicker.test.tsx`, `src/components/PostSessionReview.tsx`
- check: `npx vitest run src/components/__tests__/RatingPicker.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: the two `RatingPicker.test.tsx` cases named in R10
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Move `RatingPicker` and `RATINGS` out of `PostSessionReview.tsx` (the component goes in its own file, per `react-refresh/only-export-components`). Add `min`/`max` props (default 1–10). Re-tap clears everywhere (R10), so there is no `clearable` prop. Keep the 40 px targets.

## T2 — Session helpers and read hooks
- covers: [R1, R11, R16, R22]
- runner: implementer
- allowed files: `src/utils/sessions.ts`, `src/utils/__tests__/sessions.test.ts`, `src/db/index.ts`
- check: `npx vitest run src/utils/__tests__/sessions.test.ts`
- tests to add: the three `sessions.test.ts` cases in R11. Also: `sessionStats` returns problems, attempts, flashes, sends and a success rate that is `0` (not `NaN`) for no problems; `formatElapsed` gives `m:ss` under an hour and `h:mm:ss` from an hour (R1).
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: `sessionStats(session)` replaces the inline reduces/filters in `Session.tsx`, `PastSessionsList.tsx` and the detail page, with the same formulas as today (`flash || send` counts as success). `latestEndedSession(sessions)` is the one with the greatest `startTime` among `endTime !== null` (R11). `formatElapsed(ms)` sits next to `formatDuration` in `src/utils/duration.ts` if that's where it lives; otherwise put it in `sessions.ts`. In `db/index.ts`, add `useLatestEndedSession()` and `useSessionById(id)` with `useLiveQuery`. `useSessionById` must tell loading (`undefined`) from not found (`null`), following the `useCurrentSession()` pattern. Problems are embedded in `Session.problems`, so `db.sessions.get(id)` is enough.

## T3 — Check-in form: optional values, groups, tap rows, last takeaways
- covers: [R8, R9, R10, R11]
- runner: implementer
- allowed files: `src/components/PreSessionForm.tsx`, `src/components/__tests__/PreSessionForm.test.tsx`, `src/types/index.ts`, `src/components/PastSessionsList.tsx`
- check: `npx vitest run src/components/__tests__/PreSessionForm.test.tsx src/components/__tests__/PastSessionsList.test.tsx && npm run typecheck`
- tests to add: the `PreSessionForm.test.tsx` cases named in R9, R10 and R11
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes: Make the seven wellness fields of `PreSessionData` optional in `src/types/index.ts` (R8). Delete the duplicate local interface in `PreSessionForm.tsx` and import the shared type. Make the form controlled (`value`, `onChange`) so `Session.tsx` can prefill it during a session (R12, wired in T7). Add `lastWorkOn?: string[]` (default `[]`); the form doesn't query the db. Use MUI `Accordion` for the groups, Goals `defaultExpanded` (R9). The four ratings and rest days use `RatingPicker` (rest days `min={0} max={7}`). Nutrition and stress use an exclusive `ToggleButtonGroup` whose `null` clears (R10). "Add as goal" goes through `sanitizeGoals` and `LIMITS.maxGoals` from `src/utils/validation.ts`. In `PastSessionsList.tsx`, only make `energyBefore` accept `undefined` and show "—" so typecheck passes (T10 rewrites that file). `Session.tsx` keeps compiling with its current defaults; T6 drops them.

## T4 — Active session bar
- covers: [R1, R2, R3, R5]
- runner: implementer
- allowed files: `src/components/ActiveSessionBar.tsx`, `src/components/__tests__/ActiveSessionBar.test.tsx`, `src/components/Layout.tsx`, `src/components/__tests__/Layout.test.tsx`
- check: `npx vitest run src/components/__tests__/ActiveSessionBar.test.tsx src/components/__tests__/Layout.test.tsx`
- tests to add: the `ActiveSessionBar.test.tsx` cases named in R1 and R2 (fake timers for the tick); in `Layout.test.tsx`, "shows the active session bar on other pages", "hides the active session bar in focus mode" and "highlights Session on a session page" (R5)
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes: Render the bar in `Layout.tsx` inside the sticky `AppBar` block (below the `Toolbar`), so it sticks with it and is hidden in focus mode with it (R1). Data comes from `useCurrentSession()`, stats from `sessionStats` and time from `formatElapsed` (T2), with a 1 s interval that runs only while a session is active. It is a button-like element (`ButtonBase` or `CardActionArea`) that navigates to `/session`. Detect the session page with `useLocation().pathname === '/session'` and no `view=history` (R2). Mock `../../db/index` in the Layout tests as the page tests do. R3 is manual: say so in the report.

## T5 — Undo snackbar at the top, swipeable
- covers: [R23]
- runner: implementer
- allowed files: `src/components/UndoSnackbar.tsx`, `src/components/__tests__/UndoSnackbar.test.tsx`
- check: `npx vitest run src/components/__tests__/UndoSnackbar.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: the four `UndoSnackbar.test.tsx` cases named in R23 (swipe via `fireEvent.pointerDown`/`pointerMove`/`pointerUp` on the alert)
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: `anchorOrigin={{ vertical: 'top', horizontal: 'center' }}`, offset by the dense app bar plus the session bar height (one shared constant is fine). Use `Alert variant="standard"` or `outlined`, plus a close `IconButton`. Swipe: track the horizontal pointer delta, translate the alert while dragging, and dismiss past a threshold (e.g. 80 px). Below it, snap back. Keep the `clickaway` guard and the props API, so `Session.tsx` doesn't change. R23's placement check is manual.

## T6 — Session page header, start-first flow, history in the URL
- covers: [R4, R5, R6, R7, R8, R11]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: the R4, R6, R7 and R5 "history mode follows the view query" cases; update "starts a new session" for absent fields and add "saves picked check-in values" (R8); one asserting the check-in receives the last session's `workOn` (mock `useLatestEndedSession` alongside `useCurrentSession`). Say in the report which existing tests changed.
- parallel-safe: no
- schema-change: no
- depends-on: [T3]
- notes: Remove the `ToggleButtonGroup`. Derive `mode` from `useSearchParams` (`view=history`) and set it with `replace`; the existing reset of `preSessionData` on mode change stays. Use the `PageHeader` `action` slot: a History `IconButton` in climb mode, a Close `IconButton` (to `/`) on the new-session screen, and a Back `IconButton` before the title in history (extend `PageHeader` only if the slot can't hold it; that adds `src/components/PageHeader.tsx`, so report it). Default `preSessionData` becomes `{ goals: [], additionalNotes: '' }`. Put Start session above `PreSessionForm`; keep `BackupReminder` below it. Pass `useLatestEndedSession()?.postSessionReview?.workOn` into the form (R11).

## T7 — Live view: goal chips, check-in during the session
- covers: [R2, R12, R13, R14, R15]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`, `src/utils/sessions.ts`, `src/utils/__tests__/sessions.test.ts`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx src/utils/__tests__/sessions.test.ts`
- tests to add: the R2 "live view has no stats block", R12, R13 and R14 cases; a `sessions.test.ts` case for the goal-removal index remap
- parallel-safe: no
- schema-change: no
- depends-on: [T2, T4, T6]
- notes: Remove the Session Details/Stats blocks (the bar from T4 replaces them). Goals become small MUI `Chip`s. Add a `view: 'live' | 'checkin'` page state, reset to `'live'` when the session id changes or the mode leaves climb (T8 adds `'wrapup'`). Check-in edits write `preSessionData` to the active session through the same sanitizers as `startSession`. Debounce or save on change the way the review draft does, and reuse `saveDraft`'s pattern. `removeGoalAt(achievedGoals, index)` in `sessions.ts` drops that index and shifts the later ones (R12). Apply it to the review draft in the same write. R15 is manual: say so.

## T8 — Finish session and the wrap-up view
- covers: [R14, R16, R17, R18, R19]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/components/SessionWrapUp.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: the R16, R17 and R19 cases. Update the existing end-session, review, undo snackbar and persistence tests to click "Finish session" before "Save & end", without changing what they assert (R18). Say in the report which tests changed.
- parallel-safe: no
- schema-change: no
- depends-on: [T7]
- notes: Extend T7's `view` state with `'wrapup'`. `SessionWrapUp` renders the summary (`sessionStats`, with duration from `startTime` to now), `PostSessionReviewSection`, the notes field and the two buttons. `Session.tsx` keeps `review`, `postSessionNotes`, `saveDraft` and `endSession`, so the autosaved draft is the single source (R17). "Save & end" calls the existing `endSession` and keeps the undo snackbar and persistence call where they are (R18).

## T9 — Session page at /sessions/:id
- covers: [R22]
- runner: implementer
- allowed files: `src/pages/SessionDetail.tsx`, `src/App.tsx`, `src/pages/__tests__/SessionDetail.test.tsx`
- check: `npx vitest run src/pages/__tests__/SessionDetail.test.tsx`
- tests to add: the five `SessionDetail.test.tsx` cases in R22 (render in a `MemoryRouter` with `Routes`; mock `../../db/index` as the page tests do)
- parallel-safe: no
- schema-change: no
- depends-on: [T2, T3]
- notes: Add the `/sessions/:id` route in `App.tsx` and keep the existing `/sessions` → `/session` redirect. Data comes from `useSessionById` (T2): `undefined` renders nothing, `null` renders "Session not found" with a link to `/session?view=history`. Copy `ReviewLines` from `PastSessionsList.tsx` into this page (T10 deletes the original). Achieved goals come from `postSessionReview.achievedGoals` (indexes into `preSessionData.goals`). Absent check-in values show "—" (R8). Use `PageHeader` with a Back button to `/session?view=history`.

## T10 — History rows
- covers: [R20, R21, R24]
- runner: implementer
- allowed files: `src/components/PastSessionsList.tsx`, `src/components/__tests__/PastSessionsList.test.tsx`
- check: `npx vitest run src/components/__tests__/PastSessionsList.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: the R20 and R21 cases. Move the three existing review-line tests out of `PastSessionsList.test.tsx` (T9 covers them on the detail page) and keep "logs and keeps rendering when loading sessions fails".
- parallel-safe: no
- schema-change: no
- depends-on: [T6, T9]
- notes: Filter `endTime !== null` in the list (R20). Rows use `sessionStats` (T2). Remove `ReviewLines` and the per-line stats. Navigate with `useAppNavigate` (`src/hooks/useAppNavigate.ts`) if it fits, otherwise `useNavigate`. R5's back-button check is manual: run it here, since this is the first task where rows link to the detail page.
