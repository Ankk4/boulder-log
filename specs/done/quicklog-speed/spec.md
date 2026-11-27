---
status: approved
commitment: spec-anchored
---

# Faster quick log

## Goal
Logging a problem and its attempts takes fewer taps and less precision. Big labelled buttons, grade chips instead of dropdowns, the last grade preselected, no keyboard unless asked for, and a hint of how that grade went last time. This is for a climber with one chalky hand and 30 seconds between attempts.

## Context
- Research: `research/README.md` pass-2 Takeaways (conclusion 3, quick wins 3–4), `research/tracking/qol-mobile-interaction-patterns.md` (touch targets, input friction), `research/competitors/qol-logging-friction-user-feedback.md` (remembered values, inline "last time")
- Relevant code: `src/components/QuickLog.tsx`, `src/components/DifficultySelect.tsx` (grade lists), `src/utils/validation.ts` (`sanitizeProblemName`, `sanitizeGrade`), `src/db/index.ts`, `src/pages/Session.tsx` (`handleAddProblem` signature stays)
- Run after PR #27, `qol-fixes`, `data-trust` and `undo-log` merge.

## Requirements

- **R1** — Each problem row shows two text-only buttons (no icons) with a filled or tonal background, never transparent: "Attempt" (with its count) and "Send". They sit in a row below the problem's name and grade, at least 48 px tall, at least 8 px apart, and shrink without overflowing at 320 px. There are no hover-only tooltips. There is no Flash button: Send on a problem with no earlier attempts logs a flash, otherwise a send. Once the problem is sent or flashed, both Attempt and Send are disabled. The Attempt count shows all tries including the topping one, so a flash reads "Attempt (1)". The `attempt-button` and `send-button` testids stay.
  - _Check:_ `src/components/__tests__/QuickLog.test.tsx` › "row buttons have visible labels", "send without attempts logs a flash", "send after an attempt logs a send", "no flash button", "attempt disabled and counts the flash after a flash"
  - _Check:_ `manual: npm start → devtools at 320 and 360 px → add a problem with a long name → two filled, labelled buttons, no icons, no overlap; the name truncates with an ellipsis`
- **R2** — The Add Problem dialog shows French grades as a wrap of single-select chips and gym colours as chips with a colour swatch and the colour's French grade range (e.g. "6a+-6b+") as the visible text; the stored value is still the colour name. Tapping a selected chip deselects it. Add stays disabled until at least one grade is selected. _Check:_ `src/components/__tests__/GradePicker.test.tsx` › "selects and deselects a French grade", "selects a colour", "colour chips show the French range"; `src/components/__tests__/QuickLog.test.tsx` › "Add disabled without a grade"
- **R3** — The dialog opens with the grades of the session's most recently created problem preselected, or nothing selected if the session has no problems. _Check:_ `src/utils/__tests__/problemDefaults.test.ts` › "lastUsedGrades picks the newest problem"; `src/components/__tests__/QuickLog.test.tsx` › "dialog preselects the last grades"
- **R4** — The problem name is optional. An empty name saves as `<label> #<n>`:
  - `<label>` is the French grade if set, else the colour name.
  - `<n>` is 1 + the number of problems in this session with the same label.
  - _Check:_ `src/utils/__tests__/problemDefaults.test.ts` › "autoName numbers per label"; `src/components/__tests__/QuickLog.test.tsx` › "empty name saves an auto-name"
- **R5** — Opening the dialog doesn't focus the name field, so no keyboard pops up. _Check:_ `src/components/__tests__/QuickLog.test.tsx` › "name field not focused on open"
- **R6** — ~~One-tap "Add <label>" button~~ Dropped after review (2026-11-27): Add Problem with the last grade preselected (R3) is enough. There is no second add button. _Check:_ `src/components/__tests__/QuickLog.test.tsx` › "no one-tap add button"
- **R7** — In the dialog, once a grade is selected, a line shows the most recent earlier session's problems at that grade (French if selected, else colour): "Last time at <label> (<date>): <n> problems, <s> sent, <f> flashed". A flash counts as sent, so `<s>` includes `<f>`. It shows nothing when no earlier session has that grade. The current session is excluded. _Check:_ `src/utils/__tests__/problemDefaults.test.ts` › "summarizeLastTime groups the latest earlier session", "summarizeLastTime null without history", "a flash counts as sent"; `src/components/__tests__/QuickLog.test.tsx` › "shows last time at the selected grade"
- **R8** — On mobile, the Add Problem button stays in a bar pinned above the bottom navigation while the problem list scrolls. On desktop they stay inline. _Check:_ `manual: npm start → devtools at 360×640 → add 8 problems → scroll → the add bar stays visible above the bottom nav, never covers the last row's buttons, and the undo snackbar does not cover it`

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

Changed after review on PR #34 (2026-11-27):
- A flash counts as sent. The Flash button is removed; flash is derived from Send with no earlier attempts. Stored `flash`/`send` fields are unchanged.
- The one-tap add button is dropped (R6).
- Row buttons are text-only with a filled background.
- "Problem" stays the term.
- After a send or flash, Attempt is disabled too, and its count includes the topping try.
- Colour chips show the French range instead of the Finnish colour name.
