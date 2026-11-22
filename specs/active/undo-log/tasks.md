# Tasks: Undo for log actions

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

## T1 — Pure helpers for reverting session lists
- covers: [R2, R3]
- runner: implementer
- allowed files: `src/utils/undo.ts`, `src/utils/__tests__/undo.test.ts`
- check: `npx vitest run src/utils/__tests__/undo.test.ts`
- tests to add: "replaces one problem in the session list" (others unchanged, order kept, unknown id → list unchanged) and "removes one problem from the session list".
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: `replaceProblem(problems, problem)` and `removeProblem(problems, problemId)` return new arrays and don't mutate.

## T2 — UndoSnackbar component
- covers: [R1, R7]
- runner: implementer
- allowed files: `src/components/UndoSnackbar.tsx`, `src/components/__tests__/UndoSnackbar.test.tsx`
- check: `npx vitest run src/components/__tests__/UndoSnackbar.test.tsx`
- tests to add: the R1 and R7 `UndoSnackbar.test.tsx` cases.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Props: `message`, `severity: 'info' | 'error'`, `onUndo?`, `onClose`, `open`, plus a `key` from the parent so each action restarts the timer.
  - MUI `Snackbar` with `autoHideDuration={8000}`. Ignore `reason === 'clickaway'` in `onClose`.
  - Offset: `sx={{ bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 24 } }}` to clear the 56 px bottom nav.
  - Undo is a `Button` with `sx={{ minHeight: 48 }}`. No colour literals.

## T3 — Undo and errors for attempt, flash, send, add problem
- covers: [R1, R2, R3, R5, R6]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: the R1, R2, R3, R5 and R6 Session cases (except the End ones). Add `delete` mocks to `problems`/`attempts` and `update` to `sessions` in `mockDb` if missing.
- parallel-safe: no
- schema-change: no
- depends-on: [T1, T2]
- notes:
  - State: `feedback: { id: number; message: string; severity; undo?: () => Promise<void> } | null`. Increment `id` per action and use it as the snackbar `key`.
  - Before an attempt write, take `prevProblem` from `db.problems.get`. Undo does `db.attempts.delete(id)`, `db.problems.put(prevProblem)` and `db.sessions.update(sessionId, { problems: replaceProblem(current.problems, prevProblem) })`.
  - Read `current.problems` via `db.sessions.get` at undo time, not the render-time `currentSession`.
  - Hide Undo (set `undo` undefined) before awaiting the undo writes (R5).

## T4 — Undo End Session
- covers: [R4, R5, R6]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: "undo End reopens the session with its notes and review", and an End-undo failure case for R6.
- parallel-safe: no
- schema-change: no
- depends-on: [T3]
- notes:
  - Undo does `db.sessions.update(id, { endTime: null, duration: undefined })`, then restores the notes state from the saved `postSessionNotes`.
  - The review state comes back through the existing render-time sync from `currentSession.postSessionReview` when the session id reappears. Check that it does, and set it explicitly if not.
  - `requestPersistentStorage` from data-trust stays after a successful End.
