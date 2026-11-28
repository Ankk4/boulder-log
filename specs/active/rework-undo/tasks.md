# Tasks: Inline undo

## T1 — Replace the undo snackbar with inline notices
- covers: [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10]
- runner: implementer
- allowed files: `src/components/InlineNotice.tsx`, `src/components/__tests__/InlineNotice.test.tsx`, `src/components/QuickLog.tsx`, `src/components/SessionWrapUp.tsx`, `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`, `src/components/UndoSnackbar.tsx` (delete), `src/components/__tests__/UndoSnackbar.test.tsx` (delete), `src/components/__tests__/QuickLog.test.tsx`
- check: `npx vitest run src/components/__tests__/InlineNotice.test.tsx src/pages/__tests__/Session.test.tsx src/components/__tests__/QuickLog.test.tsx && test ! -e src/components/UndoSnackbar.tsx && test ! -e src/components/__tests__/UndoSnackbar.test.tsx && ! rg -n "Snackbar" src`
- tests to add: `InlineNotice.test.tsx` with the four R8 cases. In `Session.test.tsx`, add the new R1, R2 and R7 tests named in `spec.md`. Update the existing `describe('undo')` tests for R3–R6 to find the line inside its container (`within(...)`). Rename "shows a snackbar after logging an attempt" to the R1 name.
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - This is one task because Knip fails on an unused new component. Adding `InlineNotice` and deleting `UndoSnackbar` must land together.
  - `InlineNotice` is a component only, in its own file. Props: `message`, `severity: 'info' | 'error'`, optional `onUndo`. It renders text plus an Undo `Button` with `minHeight: 48`. Use `role="status"` for info and `role="alert"` for error. It is not a Snackbar and not positioned, and has no timer, close button or swipe.
  - In `Session.tsx`, keep the `Feedback` state, `feedbackId`, `showFeedback`, `showSaveError` and `runUndo`. Add a target to `Feedback`: a problem id, the add bar, the page top, or wrap-up. The undo closures and their DB writes stay as they are (spec Constraints). Pass the matching notice down as props: QuickLog gets a notice for one problem id or for the add bar, and SessionWrapUp gets an optional notice shown next to "Save & end".
  - Undo failure (R6): `runUndo` currently calls `showSaveError()` and loses the target. Keep the failed action's target when showing the error.
  - Page-top notice (R4, and End-undo errors): render it at the top of the climb-mode content, so it shows on the pre-session view after End.
  - R7: clear the feedback when a session starts (the start-session handler) and inside the existing `if (mode !== prevMode)` block.
  - Use the existing test setup in `Session.test.tsx` (`setupAttempt`, `mockDb`, `finish()`). Tests mock `../../db/index`. With fake timers, mind the existing `vi.useFakeTimers()` usage near line 654.
  - The UndoSnackbar tests are deleted on purpose (spec Open questions). Don't port the swipe, auto-hide or focus-pause cases.
  - R10 is manual. Report it as not run unless you start the app.

## T2 — Mark the old snackbar requirements superseded
- covers: [R9]
- runner: planner
- allowed files: `specs/done/undo-log/spec.md`, `specs/done/ui-a11y-pass/spec.md`
- check: `rg -n "rework-undo" specs/done/undo-log/spec.md specs/done/ui-a11y-pass/spec.md`
- tests to add: none
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes: In `undo-log`, add a one-line note to R1, R5, R6 and R7, and in `ui-a11y-pass` to R13: "Superseded by `specs/active/rework-undo/spec.md` (inline undo)". Leave the rest of the text as is. The path becomes `specs/done/rework-undo/` when the spec ships, so update the pointer then.
