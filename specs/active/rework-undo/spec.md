---
status: approved
commitment: spec-anchored
---

# Inline undo

## Goal
Undo and save errors show as a short inline line where the climber acted (on the problem card, under the Add Problem bar, at the top of the page after End), instead of a floating snackbar. Nothing covers buttons on a phone, and the undo stays until the next action, so chalking up or walking back to the mat doesn't lose it.

## Context
- Replaces the snackbar from `specs/done/undo-log/spec.md` (R1, R5–R7) and `specs/done/ui-a11y-pass/spec.md` (R13). The undo data logic (undo-log R2–R4) stays as is.
- User feedback (2026-11-27): the snackbar covered the quick-log add bar on a phone; popups feel noisy between attempts.
- Relevant code: `src/pages/Session.tsx` (`Feedback`, `showFeedback`, `showSaveError`, `runUndo`, `endSession`, `handleAddProblem`, `handleAddAttempt`), `src/components/QuickLog.tsx`, `src/components/SessionWrapUp.tsx`, `src/components/UndoSnackbar.tsx` (to delete), `src/pages/__tests__/Session.test.tsx` (`describe('undo')`).

## Requirements

- **R1** — After logging an attempt, flash or send, the card of that problem shows a line "Attempt logged", "Flash logged" or "Send logged" with an Undo button, below its Attempt/Send buttons. No other card shows it. _Check:_ `src/pages/__tests__/Session.test.tsx` › "shows an inline undo on the logged problem's card" (two problems; log on the second; the line and Undo are inside the second card via `within`, not the first), plus the existing "Send shows %s message" cases
- **R2** — The line has no timer. It stays until the next log, add or End, until Undo succeeds, or until the page unmounts. A new action moves the line to where that action happened. _Check:_ `Session.test.tsx` › "inline undo does not time out" (fake timers: log → advance 60 s → line still shown), "a new action moves the inline undo" (log on card A → log on card B → line in B, gone from A)
- **R3** — After Add Problem, the new problem's card shows "Problem added" with Undo. Undo removes the problem (undo-log R3 data behavior unchanged), and its card and line disappear. _Check:_ `Session.test.tsx` › "undo removes an added problem" (updated to find the line inside the new card)
- **R4** — After End Session, the page that follows shows "Session ended" with Undo at the top of the Session page content. Undo reopens the session with its notes and review (undo-log R4 unchanged). _Check:_ `Session.test.tsx` › "undo End reopens the session with its notes and review" (driven through Finish → Save & end → Undo; updated for the inline line)
- **R5** — Only the latest action can be undone. After one tap, the Undo button is gone, so it can't revert twice. On success the line disappears. _Check:_ `Session.test.tsx` › "undo after two actions reverts only the latest", "Undo can only be pressed once" (updated)
- **R6** — A failed write shows "Couldn't save. Try again." inline with no Undo, and `console.error` stays:
  - log fails → on that problem's card;
  - Add Problem fails → under the Add Problem bar;
  - End fails → in the wrap-up view, next to "Save & end";
  - undo fails → where that undo line was (the card, or the top of the page for End).
  - _Check:_ `Session.test.tsx` › "shows an error when logging fails", "shows an error when adding a problem fails", "shows an error when ending fails", "shows an error when undo fails", "shows an error when undoing End fails" (each asserts the error is inside the expected container)
- **R7** — Starting a new session, or switching to History, clears the line. "Session ended · Undo" can never reopen an old session while a new one is active. _Check:_ `Session.test.tsx` › "starting a session clears the Session ended undo" (End → Undo shown → start a new session → no Undo), "switching to History clears the inline undo" (log → History → back to Climb → no line)
- **R8** — Accessibility: info lines are `role="status"`, errors are `role="alert"`. Undo has the accessible name "Undo" and is at least 48 px tall. _Check:_ `src/components/__tests__/InlineNotice.test.tsx` › "info uses status role", "error uses alert role", "renders Undo only with onUndo", "Undo calls onUndo"; 48 px is covered by R10's manual check
- **R9** — The snackbar is gone: `src/components/UndoSnackbar.tsx` and its test are deleted, and no `Snackbar` is used in `src/`. _Check:_ `test ! -e src/components/UndoSnackbar.tsx && test ! -e src/components/__tests__/UndoSnackbar.test.tsx && ! rg -n "Snackbar" src`
- **R10** — On a phone the line sits inside the layout and covers nothing. _Check:_ `manual: npm start → devtools at 360×640 → start a session, add two problems → log an attempt on the second → the line is inside that card under its buttons, the Add Problem bar and other cards stay tappable, Undo is easy to hit with a thumb → Finish → Save & end → "Session ended · Undo" is visible at the top without scrolling`

## Constraints
- No schema change; no Dexie `version()` bump.
- Undo writes stay as they are (partial `update`/`delete`, no stale whole-session `put`).
- Feedback state stays owned by the Session page; no global provider or context.
- No new dependencies.
- The new inline component lives in its own file (`react-refresh/only-export-components`).

## Out of scope
- Undo for deleting a past session or for interval workouts.
- Multi-level undo, redo, an "Undone" confirmation line.
- Moving focus after Undo is pressed.
- Inline errors for starting a session or saving the review draft (they only log to the console today; unchanged).
- Workouts page save errors (already inline).

## Open questions
Decided in the interview (2026-11-28):
- Undo for logs goes on the problem card; End goes at the top of the page that follows; errors go where the action happened.
- No timeout: the line stays until the next action.
- The snackbar is removed entirely, including its swipe and auto-hide behavior. Its tests are deleted with it, on purpose.
