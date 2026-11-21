# Tasks: Session bugfixes

Quick spec (no `spec.md`). Two bugs found while mapping the Session page's implicit state machines.

## T1 — Keep flash/send sticky and reset the check-in after End Session

- covers: [T1]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- behavior:
  1. **Sticky status.** Once a problem has `flash: true` or `send: true`, logging more attempts of any type never sets it back to `false`. A Flash still counts only when it is the problem's first attempt. The Attempt button stays enabled and keeps logging attempts (the user chose this over disabling it).
  2. **Fresh check-in.** After End Session saves, the next Start Session saves the default `PreSessionData` unless the user edits the form again, and the post-session notes box is empty for the new session. The same applies when the user switches Climb → History → Climb before starting: what gets saved must match what the form shows (its defaults after remount).
- tests to add (each one exercises the transition mid-flow, not only the state on mount):
  - Problem with `send: true` (and one with `flash: true`) → click the Attempt button → the `db.problems.put` payload keeps `send: true` / `flash: true`.
  - No session → add a goal in the form → Start → rerender with `useCurrentSession` returning that session → type post-session notes → End → rerender with no session → Start → `db.sessions.add` is called with `goals: []` and the default ratings. Rerender as active → the notes field is empty.
  - No session → edit the form → switch to History and back to Climb → Start → `db.sessions.add` gets the defaults.
  - The existing "marks a problem as flashed" and "adds an attempt" tests still pass unchanged.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Bug 1 is in `handleAddAttempt` (`Session.tsx`, around the `flash:` / `send:` lines): OR the new value with the existing `problem.flash` / `problem.send`. Don't change `QuickLog.tsx`.
  - Bug 2: reset `preSessionData` to `defaultPreSessionData` and `postSessionNotes` to `''` only after `db.sessions.put` succeeds in `endSession`. If the put fails, keep the notes so nothing the user typed is lost. For the History toggle, reset `preSessionData` when the mode changes (`PreSessionForm` keeps its own internal state and starts from defaults on remount, so the parent must too). Don't edit `PreSessionForm.tsx`.
  - Follow the existing mock pattern in `Session.test.tsx` (typed `mockDb`, `vi.mocked(useCurrentSession)`); use `rerender` to move between "no session" and "active session".
