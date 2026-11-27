---
status: done
commitment: spec-first
---

# UI accessibility pass

## Goal
A climber using a screen reader, a keyboard or a zoomed small screen can find their way round the app, use every control on the timer and workout pages, and hear what changed: timer phases, saves and failures. This pass covers the app shell and the pages no other active spec rewrites.

## Context
- Source: the 2026-11-27 `/web-design-guidelines` audit (no `research/` note on accessibility exists).
- Relevant code: `src/theme/theme.ts`, `src/App.tsx`, `src/components/Layout.tsx`, `src/pages/Home.tsx`, `src/pages/Workouts.tsx`, `src/components/WorkoutFormDialog.tsx`, `src/pages/WorkoutRun.tsx`, `src/components/UndoSnackbar.tsx`, `src/components/DataCard.tsx`, `src/components/BackupReminder.tsx`
- Overlap: `specs/active/quicklog-speed` rewrites `QuickLog.tsx` and `DifficultySelect.tsx`. `specs/active/ux-sessions` rewrites `Session.tsx`, `PreSessionForm.tsx`, `PostSessionReview.tsx` and `PastSessionsList.tsx`, and adds a test to `Layout.test.tsx`. This spec doesn't edit those source files. Their findings are listed under "Carry-over".
- Existing rule kept: undo-log R7 (Undo is named "Undo" and is at least 48 px tall).

## Requirements

### Structure
- **R1** — The `subtitle1` and `subtitle2` Typography variants render as `<p>`, not `<h6>`, app-wide (theme `typography`/`MuiTypography` variant mapping). Other variants keep their element. _Check:_ `src/theme/__tests__/theme.test.tsx` › "subtitle variants are not headings"
- **R2** — Under a page's `h2` title, section headings are `h3`: Workouts "Presets", "Workouts" and "Recent runs", and DataCard "Your data". The look stays the same (still `variant="h6"`). _Check:_ `src/pages/__tests__/Workouts.test.tsx` › "section headings are level 3"; `src/components/__tests__/DataCard.test.tsx` › "title is a level-3 heading"
- **R3** — On WorkoutRun, the workout name is an `h2` and the countdown digits are not a heading. "Workout not found" is an `h2`. _Check:_ `src/pages/__tests__/WorkoutRun.test.tsx` › "workout name is the heading and the countdown is not"
- **R4** — Page content sits in exactly one `main` landmark, in normal and in focus mode. Entering focus mode still keeps the page mounted, so the existing test passes unchanged. _Check:_ `src/components/__tests__/Layout.test.tsx` › "renders one main landmark", "entering focus mode keeps the page mounted and its state"
- **R5** — While the app bar shows, the first focusable element on the page is a "Skip to main content" link. It is visually hidden until it has focus, and activating it moves focus to `main`. _Check:_ `Layout.test.tsx` › "skip link moves focus to main"; `manual: npm start → reload → Tab once → the link appears at top left → Enter → the next Tab lands in the page content, not the nav`

### Navigation
- **R6** — The desktop tabs and the mobile bottom navigation are links (`href` ends in `/session` or `/workouts`) inside a `nav` landmark named "Main". The active item has `aria-current="page"`. Which item counts as active doesn't change (`/workouts*` → Timer, `/session*` → Session, `/` → none), and Cmd/Ctrl+click opens a new tab. _Check:_ `Layout.test.tsx` › "nav items are links with aria-current" (desktop and mobile), "home selects no tab"; `manual: npm start (desktop width) → Ctrl+click Timer → it opens in a new tab`
- **R7** — Home's "Start session" and "Interval timer" are links to `/session` and `/workouts` and still look like buttons. _Check:_ `src/pages/__tests__/Home.test.tsx` › "renders actions that navigate", "navigates to workouts" (updated to query `link`)
- **R8** — Each Workouts row's actions are named after the workout: "Start <name>", "Edit <name>" and "Delete <name>". Start is a link to `/workouts/<id>/run`. _Check:_ `Workouts.test.tsx` › "row actions are named after the workout"

### Feedback
- **R9** — If saving a workout fails, the form dialog stays open and shows "Couldn't save. Try again." as an alert. If deleting fails, the confirmation stays open and shows "Couldn't delete. Try again." as an alert. The error is still logged, and a later successful save or delete closes the dialog as before. _Check:_ `Workouts.test.tsx` › "keeps the form dialog open and logs when saving rejects", "keeps the delete confirmation open and logs when deleting rejects" (both updated to also assert the alert text)
- **R10** — In WorkoutFormDialog, once a field has lost focus while invalid, it gets `aria-invalid="true"` and its helper text changes to the fix: Name "Enter a name"; Work and Intervals "Enter a whole number, 1 or more"; Rest "Enter a whole number, 0 or more". Making the value valid brings the normal helper text back. A field nobody has touched never shows an error. Save stays disabled while anything is invalid, as now. _Check:_ `src/components/__tests__/WorkoutFormDialog.test.tsx` › "blurring an invalid field shows how to fix it", "fixing the field clears the error", "untouched fields show no error"
- **R11** — WorkoutRun has a polite live region that announces the phase when it changes ("Prepare", "Work", "Rest", "Paused", "Done" or "Stopped"), plus the closing sentence ("Set complete. Saved to history." / "Stopped after N intervals."). The per-second countdown is not announced. _Check:_ `WorkoutRun.test.tsx` › "announces phase changes, not ticks" (fake timers: Start → region says Prepare → advance past prepare → region says Work → advance 1 s inside work → region text unchanged)
- **R12** — On WorkoutRun, the interval progress bar is named "Intervals completed" with `aria-valuetext` "N of M intervals". The loading spinner is named "Loading workout". The icon buttons are named "Back to workouts" and "Mute beeps" / "Unmute beeps". _Check:_ `WorkoutRun.test.tsx` › "progress and controls have names"
- **R13** — UndoSnackbar uses `role="status"` for info messages and `role="alert"` for errors. It doesn't auto-hide while focus is inside it, and the countdown restarts when focus leaves. _Check:_ `src/components/__tests__/UndoSnackbar.test.tsx` › "info uses status role", "error uses alert role", "does not auto-hide while Undo has focus" (fake timers: focus Undo → advance past 8 s → still shown → blur → advance 8 s → onClose called), plus the existing tests unchanged

### Shell & copy
- **R14** — `<html>` gets `color-scheme: dark` from CssBaseline (`enableColorScheme`), so native scrollbars and inputs follow the dark theme. _Check:_ `rg -n 'enableColorScheme' src/App.tsx` → 1 match; `manual: npm start → DevTools → html computed color-scheme is "dark"; scrollbars are dark`
- **R15** — Keyboard focus never lands under the sticky app bar: the page scroll padding allows for the app bar height. _Check:_ `manual: npm start (mobile width) → Timer with 6+ saved workouts → scroll down, then Shift+Tab up through the rows → each focused row is fully visible below the app bar`
- **R16** — Copy fixes:
  - BackupReminder "Later" becomes "Remind me in 7 days", with the same snooze behaviour.
  - The Workouts recent-run chip shows "Completed" or "Aborted" instead of the raw status.
  - WorkoutFormDialog's Name placeholder ends with "…", and the Name field has `autoComplete="off"`.

  _Check:_ `src/components/__tests__/BackupReminder.test.tsx` › "Remind me in 7 days snoozes for 7 days" (renamed from "Later snoozes for 7 days"); `Workouts.test.tsx` › "run status is capitalised"; `WorkoutFormDialog.test.tsx` › "name field has no autocomplete"

### Whole feature
- **R17** — `npm run verify` passes. The only existing tests that change are the ones R7, R9 and R16 name, plus `getByLabelText('edit'|'delete')` in `Workouts.test.tsx` updated to the R8 names. No other test is weakened or deleted. _Check:_ `npm run verify`; `git diff master...HEAD --stat -- 'src/**/__tests__/*' ':!specs'` shows only the listed test files

## Constraints
- No schema change.
- Don't edit `QuickLog.tsx`, `DifficultySelect.tsx`, `Session.tsx`, `PreSessionForm.tsx`, `PostSessionReview.tsx` or `PastSessionsList.tsx`. The R1 theme change reaches them anyway, and that's intended.
- `Layout.tsx` keeps one `Container` element across focus mode (see its comment). Make it the `main` rather than wrapping or swapping it.
- Use MUI's own props (`component`, `slotProps`, `aria-*`) before hand-rolled ARIA. Add no new dependencies.
- Visual design stays as it is. Spacing, colours and sizes change only where a requirement needs it (the skip link).

## Out of scope
- Timer behaviour changes: keyboard shortcuts, and a confirmation or undo for Stop.
- Moving focus to the snackbar when it opens.
- Adding `eslint-plugin-jsx-a11y` (excluded by `specs/done/analyzers`).
- `theme-color`: `src/__tests__/branding.test.ts` pins it to `brand.dark.paper` on purpose.
- Casing and copy outside the files listed in Context.
- Every carry-over finding below.

## Carry-over (for quicklog-speed and ux-sessions, not this spec)
The 2026-11-27 audit found these in files those specs rewrite. Their new components should avoid them:
- Icon-only buttons are named with their target ("Log attempt on <problem>"). Don't rely on a `Tooltip` around a `<span>` or `Badge`: the name lands on the wrapper.
- Every input, select, slider and radio group has a programmatic label: `labelId`, `aria-labelledby`, or `FormLabel component="legend"`. Placeholders aren't labels.
- Emoji status markers (🌟 ✓) are `aria-hidden` and have a text equivalent.
- Per-row delete actions name the row. A destructive confirm doesn't take `autoFocus`.
- Rating and toggle targets are at least 48 px, matching undo-log R7.
- Save and delete failures reach the user, not only `console.error`.
- Switching Climb/History mode silently resets the check-in (`Session.tsx`). ux-sessions T7 keeps this on purpose; flag it if that changes.

## Open questions
- None.
