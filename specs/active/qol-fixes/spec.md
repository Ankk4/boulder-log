---
status: approved
commitment: spec-first
---

# QoL fixes

## Goal
Remove six small rough edges: the check-in form flashing on reopen, safe-area padding that does nothing, pull-to-refresh killing a running timer, a number field that turns "30" into "130", timer digits that are too small to read from the mat, and a Home page that promises offline support the app doesn't have yet.

## Context
- Research: `research/tracking/qol-mobile-interaction-patterns.md` (top-15 items 4, 6, 7, 9, 12), `research/README.md` pass-2 Takeaways
- Relevant code: `src/db/index.ts` (`useCurrentSession`), `src/db/database.ts` (`getCurrentSession`), `src/pages/Session.tsx`, `index.html`, `src/theme/theme.ts`, `src/components/WorkoutFormDialog.tsx`, `src/pages/WorkoutRun.tsx`, `src/pages/Home.tsx`
- Run after PR #27 (post-session-review) merges: it changes `Session.tsx` and its tests.
- This was planned as a quick spec, but it touches more than 3 source files, so it uses the full path.

## Requirements

- **R1** — `useCurrentSession()` returns `undefined` while loading and `null` when there is no active session. The Session page (Climb mode) shows the check-in form only for `null`, and for `undefined` renders neither the check-in nor the active session, with no spinner. _Check:_ `src/pages/__tests__/Session.test.tsx › "renders no check-in while the current session is loading"`, and the existing no-session tests mock `null` (intended test change).
- **R2** — The viewport meta tag includes `viewport-fit=cover`, so `env(safe-area-inset-*)` takes effect. _Check:_ `rg -q 'viewport-fit=cover' index.html`, and `manual: npm run build && npm run preview → open on an iPhone added to the Home Screen → the bottom navigation clears the home indicator and the top bar is not under the status bar`
- **R3** — `html` and `body` get `overscroll-behavior-y: contain` (via the theme's `MuiCssBaseline` style overrides), so pulling down at the top of the page doesn't trigger browser pull-to-refresh. _Check:_ `src/theme/__tests__/theme.test.ts › "contains vertical overscroll on html and body"`, and `manual: Android Chrome → start a timer → pull down at the top of the page → the page does not reload and the timer keeps running`
- **R4** — In the workout form, Work, Rest and Intervals are text inputs with `inputMode="numeric"`:
  - A field can be cleared while editing; typing "30" into a cleared field gives 30.
  - Focusing a field selects its contents.
  - Save is disabled while any field is empty or below its minimum (work ≥ 1, rest ≥ 0, intervals ≥ 1). Saved values are integers.
  - _Check:_ `src/components/__tests__/WorkoutFormDialog.test.tsx` › "clearing Work and typing 30 gives 30", "focus selects the field contents", "Save is disabled while a field is empty", "saves integer values"
- **R5** — The countdown digits on the workout run screen scale with the viewport, not fixed rem sizes. _Check:_ `manual: npm start → devtools at 360×640 and at 412×915 → run a workout → the countdown digits span most of the screen width without wrapping or overflowing, and are readable from 2–3 m on a phone`
- **R6** — Home no longer says "offline-first". The description says the data stays on this device. _Check:_ `src/pages/__tests__/Home.test.tsx › "renders heading, description and actions"` asserts `/stays on this device/` and no `/offline/i` text (intended test change).

## Constraints
- No schema change; no Dexie `version()` bump.
- No new dependencies.
- Keep existing `data-testid`s.

## Out of scope
- A service worker or real offline support (a later `pwa-shell` spec).
- Light/dark theme setting.
- Left/right safe areas in landscape.

## Open questions
Decided in an auto-approved run (2026-11-21):
- Loading state shows nothing rather than a skeleton. Local reads finish well under a second, so a placeholder would only flash.
- Number fields switch from `type="number"` to text inputs with `inputMode="numeric"`. This is the only way select-on-focus works and testable.
- Digit size is the user's visual call (R5 manual), not a pinned value.
