# Tasks: Session UX

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

**Before running:** this spec's precondition (spec.md › Context) must hold. The planner re-checks every task's allowed files and notes against master once `qol-fixes`, `undo-log` and `data-trust` are in `specs/done/`, since all three edit `Session.tsx` and `src/db/index.ts`.

## T1 — Shared RatingPicker component
- covers: [R9]
- runner: implementer
- allowed files: `src/components/RatingPicker.tsx`, `src/components/__tests__/RatingPicker.test.tsx`, `src/components/PostSessionReview.tsx`
- check: `npx vitest run src/components/__tests__/RatingPicker.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: the three `RatingPicker.test.tsx` cases named in R9
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Move `RatingPicker` and `RATINGS` out of `PostSessionReview.tsx` (component in its own file, per `react-refresh/only-export-components`). Add `min`/`max` props (default 1–10) and a `clearable` prop (default true, so the review keeps its current behavior). With `clearable={false}` the value type is `number` and a re-tap (MUI passes `null`) is ignored. Keep the 40 px targets.

## T2 — Session helpers and read hooks
- covers: [R5, R11, R14]
- runner: implementer
- allowed files: `src/utils/sessions.ts`, `src/utils/__tests__/sessions.test.ts`, `src/db/index.ts`
- check: `npx vitest run src/utils/__tests__/sessions.test.ts`
- tests to add: the three `sessions.test.ts` cases in R11; `sessionStats` returns problems, attempts, flashes, sends and a success rate that is `0` (not `NaN`) for no problems
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: `sessionStats(session)` replaces the inline reduces/filters in `Session.tsx` (strip, wrap-up), `PastSessionsList.tsx` and the detail page; same formulas as today (`flash || send` counts as success). `latestEndedSession(sessions)` = greatest `startTime` among `endTime !== null` (R11). In `db/index.ts` add `useLatestEndedSession()` and `useSessionById(id)` with `useLiveQuery`. `useSessionById` must tell loading (`undefined`) from not found (`null`); follow whatever pattern `qol-fixes` T1 landed for `useCurrentSession()`. Problems are embedded in `Session.problems`, so `db.sessions.get(id)` is enough. Reuse `formatDuration` if `qol-fixes`/others moved it to `src/utils/duration.ts`; otherwise leave it where it is.

## T3 — Check-in tap rows and last takeaways
- covers: [R9, R10, R11]
- runner: implementer
- allowed files: `src/components/PreSessionForm.tsx`, `src/components/__tests__/PreSessionForm.test.tsx`
- check: `npx vitest run src/components/__tests__/PreSessionForm.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: the four `PreSessionForm.test.tsx` cases in R11, plus one asserting the five pickers render with their ranges
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes: Replace the five `Slider`s with `RatingPicker clearable={false}` (rest days `min={0} max={7}`). Add an optional prop `lastWorkOn?: string[]` (default `[]`); the form does not query the db. "Add as goal" goes through the existing `handleChange('goals', sanitizeGoals([...]))` path and `LIMITS.maxGoals` from `src/utils/validation.ts`. Defaults stay as they are (R10).

## T4 — Live view: stats strip, goal chips, check-in wiring
- covers: [R1, R2, R10, R11]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/components/SessionStatsStrip.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: the R1 and R2 `Session.test.tsx` cases; "saves picked check-in values" (R10); one asserting the check-in receives the last session's `workOn` (mock `useLatestEndedSession` alongside `useCurrentSession` in the existing `../../db/index` mock)
- parallel-safe: no
- schema-change: no
- depends-on: [T2, T3]
- notes: `SessionStatsStrip` takes the session and `now` and uses `sessionStats` (T2); elapsed time reuses the minutes calculation already in `Session.tsx`. Goals as small MUI `Chip`s. Pass `useLatestEndedSession()?.postSessionReview?.workOn` into `PreSessionForm`. Leave review, notes and End where they are; T5 moves them.

## T5 — Finish session and the wrap-up view
- covers: [R3, R4, R5, R6, R7, R8]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/components/SessionWrapUp.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: the R3, R5, R6 and R8 cases; update the existing end-session, review and (from undo-log/data-trust) snackbar and persistence tests to click "Finish session" before "Save & end", without changing what they assert (R7). Say in the task report which tests changed.
- parallel-safe: no
- schema-change: no
- depends-on: [T4]
- notes: A `view: 'live' | 'wrapup'` state in `Session.tsx`, reset to `'live'` when the session id changes and when the mode leaves climb (R8). `SessionWrapUp` renders the summary (`sessionStats`), `PostSessionReviewSection`, the notes field and the two buttons; `Session.tsx` keeps `review`, `postSessionNotes`, `saveDraft` and `endSession`, so the autosaved draft is the single source (R6). "Save & end" calls the existing `endSession`; keep the undo snackbar and persistence call wherever undo-log/data-trust put them (R7). R4 is manual: say it in the report.

## T6 — Session page at /sessions/:id
- covers: [R14]
- runner: implementer
- allowed files: `src/pages/SessionDetail.tsx`, `src/App.tsx`, `src/pages/__tests__/SessionDetail.test.tsx`
- check: `npx vitest run src/pages/__tests__/SessionDetail.test.tsx`
- tests to add: the four `SessionDetail.test.tsx` cases in R14 (render in a `MemoryRouter` with `Routes`; mock `../../db/index` as the page tests do)
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes: Route `/sessions/:id` in `App.tsx`; keep the existing `/sessions` → `/session` redirect. Data from `useSessionById` (T2): `undefined` renders nothing, `null` renders "Session not found" with a link to `/session?view=history`. Copy `ReviewLines` from `PastSessionsList.tsx` into this page (T7 deletes the original). Achieved goals come from `postSessionReview.achievedGoals` (indexes into `preSessionData.goals`). Use `PageHeader` for the title.

## T7 — History rows, view in the URL
- covers: [R12, R13, R15, R16]
- runner: implementer
- allowed files: `src/components/PastSessionsList.tsx`, `src/components/__tests__/PastSessionsList.test.tsx`, `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`, `src/components/__tests__/Layout.test.tsx`
- check: `npx vitest run src/components/__tests__/PastSessionsList.test.tsx src/pages/__tests__/Session.test.tsx src/components/__tests__/Layout.test.tsx`
- tests to add: the R12, R13 and R15 cases; move the three existing review-line tests out of `PastSessionsList.test.tsx` (T6 covers them on the detail page) and keep "logs and keeps rendering when loading sessions fails"
- parallel-safe: no
- schema-change: no
- depends-on: [T5, T6]
- notes: Filter `endTime !== null` in the list (R12). Rows use `sessionStats` (T2); remove `ReviewLines` and the per-line stats. Navigate with `useAppNavigate` (`src/hooks/useAppNavigate.ts`) if it fits, otherwise `useNavigate`. In `Session.tsx`, derive `mode` from `useSearchParams` (`view=history`), and set it with `replace` so toggling doesn't stack history entries; the existing reset of `preSessionData` on mode change stays. The Layout tab already matches `startsWith('/session')`; the test pins that. R15's back-button check is manual.
