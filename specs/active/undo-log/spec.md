---
status: approved
commitment: spec-anchored
---

# Undo for log actions

## Goal
A mis-tapped Attempt, Flash, Send, Add Problem or End Session can be taken back with one tap, from a snackbar that confirms what was saved. A failed save is visible instead of silent. Climbers log one-handed between attempts, so error recovery beats confirmation dialogs.

## Context
- Research: `research/README.md` pass-2 Takeaways (conclusion 2, quick win 2), `research/tracking/qol-mobile-interaction-patterns.md` (undo vs confirm), `research/competitors/qol-logging-friction-user-feedback.md`
- Relevant code: `src/pages/Session.tsx` (`handleAddProblem`, `handleAddAttempt`, `endSession`), `src/components/QuickLog.tsx`, `src/db/index.ts`
- Data lives in three places: `attempts` rows, `problems` rows (with an embedded `attempts` list and `flash`/`send`), and `session.problems` (embedded copies). Undo must revert all three.
- Run after PR #27 (post-session-review), `qol-fixes` and `data-trust` merge; all change `Session.tsx`.

## Requirements

- **R1** — After logging an attempt, flash or send, a snackbar shows "Attempt logged", "Flash logged" or "Send logged" with an Undo button. It hides on its own after 8 seconds. _Check:_ `src/pages/__tests__/Session.test.tsx` › "shows a snackbar after logging an attempt"; `src/components/__tests__/UndoSnackbar.test.tsx` › "renders message and Undo", "auto-hides after 8 s" (fake timers)
- **R2** — Undoing an attempt, flash or send:
  - Deletes that attempt row.
  - Restores the problem's `attempts`, `flash` and `send` to their values before the action, both in the problems table and in `session.problems`.
  - Writes only `problems` on the session (`db.sessions.update`), so the notes and the review draft are untouched.
  - _Check:_ `src/utils/__tests__/undo.test.ts` › "replaces one problem in the session list"; `src/pages/__tests__/Session.test.tsx` › "undo removes the attempt and restores the problem", "undo leaves other session fields untouched"
- **R3** — After adding a problem, a snackbar shows "Problem added" with Undo. Undo deletes the problem row and removes it from `session.problems`. _Check:_ `src/utils/__tests__/undo.test.ts` › "removes one problem from the session list"; `src/pages/__tests__/Session.test.tsx` › "undo removes an added problem"
- **R4** — After End Session, a snackbar shows "Session ended" with Undo. Undo makes that session active again (`endTime: null`, `duration` cleared). The post-session notes field and the review show what they held at End. _Check:_ `src/pages/__tests__/Session.test.tsx` › "undo End reopens the session with its notes and review"
- **R5** — Only the latest action can be undone. A new action replaces the snackbar. After one tap, Undo is gone, so it can't revert twice. _Check:_ `src/pages/__tests__/Session.test.tsx` › "undo after two actions reverts only the latest", "Undo can only be pressed once"
- **R6** — If a log, add, End or undo write fails, an error snackbar shows "Couldn't save. Try again." with no Undo. `console.error` stays. _Check:_ `src/pages/__tests__/Session.test.tsx` › "shows an error when logging fails", "shows an error when undo fails"
- **R7** — The snackbar sits above the bottom navigation and the home-indicator safe area on mobile. The Undo button has the accessible name "Undo" and is at least 48 px tall.
  - _Check:_ `src/components/__tests__/UndoSnackbar.test.tsx` › "Undo has an accessible name"
  - _Check:_ `manual: npm start → devtools at 360×640 → log an attempt → the snackbar is above the bottom nav, doesn't cover the Attempt button of the problem just logged, and Undo is easy to hit with a thumb`

## Constraints
- No schema change; no Dexie `version()` bump.
- Undo writes are partial (`update`, `delete`), never a `put` of a stale whole-session snapshot.
- One snackbar instance, owned by the Session page; no global provider.
- No new dependencies.

## Out of scope
- Undo for deleting a past session in History, or for interval workouts (both keep their confirm dialogs).
- Multi-level undo history, redo.
- Haptics.
- A confirm dialog before End Session (Undo replaces the need).

## Open questions
Decided in an auto-approved run (2026-11-21):
- The 8 s timeout is longer than the common 4–6 s, because the climber may be chalking up or walking back to the mat.
- Clicking elsewhere doesn't close the snackbar; only a timeout, a new action or Undo does.
