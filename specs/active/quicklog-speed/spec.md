---
status: approved
commitment: spec-anchored
---

# Faster quick log

## Goal
Logging a problem and its attempts takes fewer taps and less precision. Big labelled buttons, grade chips instead of dropdowns, the last grade preselected, a one-tap "add another at this grade", no keyboard unless asked for, and a hint of how that grade went last time. This is for a climber with one chalky hand and 30 seconds between attempts.

## Context
- Research: `research/README.md` pass-2 Takeaways (conclusion 3, quick wins 3–4), `research/tracking/qol-mobile-interaction-patterns.md` (touch targets, input friction), `research/competitors/qol-logging-friction-user-feedback.md` (remembered values, inline "last time")
- Relevant code: `src/components/QuickLog.tsx`, `src/components/DifficultySelect.tsx` (grade lists), `src/utils/validation.ts` (`sanitizeProblemName`, `sanitizeGrade`), `src/db/index.ts`, `src/pages/Session.tsx` (`handleAddProblem` signature stays)
- Run after PR #27, `qol-fixes`, `data-trust` and `undo-log` merge.

## Requirements

- **R1** — Each problem row shows three buttons with visible text: "Attempt" (with its count), "Flash" and "Send". They sit in a row below the problem's name and grade, at least 48 × 48 px each, at least 8 px apart. There are no hover-only tooltips. The existing enable/disable rules and `data-testid`s stay.
  - _Check:_ `src/components/__tests__/QuickLog.test.tsx` › "row buttons have visible labels", "flash disabled after an attempt"
  - _Check:_ `manual: npm start → devtools at 360×640 → add a problem with a long name → the three buttons are large, labelled, not overlapping, and the name stays readable`
- **R2** — The Add Problem dialog shows French grades as a wrap of single-select chips and gym colours as chips with a colour swatch and name. Tapping a selected chip deselects it. Add stays disabled until at least one grade is selected. _Check:_ `src/components/__tests__/GradePicker.test.tsx` › "selects and deselects a French grade", "selects a colour"; `src/components/__tests__/QuickLog.test.tsx` › "Add disabled without a grade"
- **R3** — The dialog opens with the grades of the session's most recently created problem preselected, or nothing selected if the session has no problems. _Check:_ `src/utils/__tests__/problemDefaults.test.ts` › "lastUsedGrades picks the newest problem"; `src/components/__tests__/QuickLog.test.tsx` › "dialog preselects the last grades"
- **R4** — The problem name is optional. An empty name saves as `<label> #<n>`:
  - `<label>` is the French grade if set, else the colour name.
  - `<n>` is 1 + the number of problems in this session with the same label.
  - _Check:_ `src/utils/__tests__/problemDefaults.test.ts` › "autoName numbers per label"; `src/components/__tests__/QuickLog.test.tsx` › "empty name saves an auto-name"
- **R5** — Opening the dialog doesn't focus the name field, so no keyboard pops up. _Check:_ `src/components/__tests__/QuickLog.test.tsx` › "name field not focused on open"
- **R6** — When the session has at least one problem, a button "Add <label>" (the last-used label) next to Add Problem adds a new problem in one tap. It has the last-used grades and an auto-name, and no dialog opens. _Check:_ `src/components/__tests__/QuickLog.test.tsx` › "one-tap add repeats the last grades", "no one-tap add in an empty session"
- **R7** — In the dialog, once a grade is selected, a line shows the most recent earlier session's problems at that grade (French if selected, else colour): "Last time at <label> (<date>): <n> problems, <s> sent, <f> flashed". It shows nothing when no earlier session has that grade. The current session is excluded. _Check:_ `src/utils/__tests__/problemDefaults.test.ts` › "summarizeLastTime groups the latest earlier session", "summarizeLastTime null without history"; `src/components/__tests__/QuickLog.test.tsx` › "shows last time at the selected grade"
- **R8** — On mobile, the Add Problem and one-tap add buttons stay in a bar pinned above the bottom navigation while the problem list scrolls. On desktop they stay inline. _Check:_ `manual: npm start → devtools at 360×640 → add 8 problems → scroll → the add bar stays visible above the bottom nav, never covers the last row's buttons, and the undo snackbar does not cover it`

## Constraints
- No schema change; no Dexie `version()` bump. R7 reads use the existing `frenchGrade` and `colorGrade` indexes on `problems`.
- `onAddProblem`'s signature is unchanged, so `Session.tsx` needs no change.
- Grade lists move to `src/utils/grades.ts` (a `.ts` file, so colour data stays out of `.tsx`). `DifficultySelect.tsx` is deleted once unused (knip).
- No new dependencies.

## Out of scope
- Grade-scale settings, custom gym colours, V-grades.
- Editing or deleting a problem.
- Swipe gestures.
- Carrying the last grade over from the previous session.
- Reordering the problem list.

## Open questions
Decided in an auto-approved run (2026-11-21):
- The last-used grade comes from this session only; the first problem of a session starts blank.
- Auto-names use the French grade when both grades are set.
- The "last time" date is the problem's `createdAt` date in the user's locale.
