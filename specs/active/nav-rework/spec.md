---
status: approved
commitment: spec-anchored
---

# Navigation rework

## Goal
The climber reaches every part of the app from one nav bar: Overview, Session, History, Timer and Settings. History and backup/export get their own pages instead of hiding behind an icon on the Session page, and the app opens on an Overview page that starts or resumes a session and holds placeholders for the coming analytics.

## Context
- User feedback (2026-11-28): History is hard to find; the Close (X) on "New session" leads to a dead-end landing page; Overview, History and Settings pages are missing.
- Research: `research/tracking/evidence-self-monitoring-goals-motivation.md` (streak design) and `research/tracking/session-reflection-and-review-loop.md` (calendar) inform the later analytics specs. This spec only reserves their spots on Overview.
- Relevant code: `src/App.tsx` (routes), `src/components/Layout.tsx` (`getCurrentTab`, desktop `Tabs`, mobile `BottomNavigation`), `src/pages/Home.tsx` (replaced), `src/pages/Session.tsx` (`SessionMode`, `changeMode`, `view=history` query, History and Close icons), `src/pages/SessionDetail.tsx` (`HISTORY_PATH`), `src/components/ActiveSessionBar.tsx` (`onSessionPage`), `src/components/DataCard.tsx`, `src/components/PastSessionsList.tsx`, `src/components/PageHeader.tsx`.
- `feature/rework-undo` is in flight and also edits `src/pages/Session.tsx`. Its R7 test "switching to History clears the inline undo" uses the History button this spec removes. Whichever branch merges second rebases and updates that test. With History on its own route, leaving the Session page unmounts it and the notice goes away by itself.

## Requirements

- **R1** — Routes: `/overview` shows Overview, `/history` shows History, `/settings` shows Settings. `/` and unknown paths redirect to `/overview`. `/session`, `/sessions/:id`, `/workouts`, `/workouts/:id/run` and the existing `/sessions` and `/problems` redirects are unchanged. `src/pages/Home.tsx` and its test are deleted. _Check:_ `src/__tests__/App.test.tsx` › "routes each path to its page" (`it.each` over `/overview`, `/history`, `/settings`, `/session`, `/workouts`: the page heading is shown), "redirects / to /overview", "redirects unknown paths to /overview"; plus `test ! -e src/pages/Home.tsx && test ! -e src/pages/__tests__/Home.test.tsx`
- **R2** — No redirect for the old query: `/session?view=history` shows the Session page as `/session` does, and no app code under `src/` reads a `view` search param or links to it. _Check:_ `src/__tests__/App.test.tsx` › "old history query shows the Session page"; plus `! rg -n "view=history|get\('view'\)" src -g '!**/__tests__/**'`
- **R3** — The main nav has five links in this order: Overview, Session, History, Timer, Settings, pointing to `/overview`, `/session`, `/history`, `/workouts`, `/settings`. The same five appear in the desktop app-bar tabs and the mobile bottom bar, each with an icon in the bottom bar. _Check:_ `src/components/__tests__/Layout.test.tsx` › "nav lists the five destinations in order (desktop)" and "(mobile)" (`describe.each`; link names and hrefs in order)
- **R4** — Exactly one nav link has `aria-current="page"`: Overview on `/overview`; Session on `/session`; History on `/history` and `/sessions/:id`; Timer on `/workouts` and `/workouts/:id/run`; Settings on `/settings`. Tapping a link moves the highlight to it. _Check:_ `Layout.test.tsx` › "marks only the active link" (`it.each` over the seven paths above, desktop and mobile), "tapping a nav link moves the highlight" (start on `/overview` → click History → History is current, Overview is not); the existing "highlights Session on a session page" is changed to expect History, since `/sessions/:id` is a History detail page
- **R5** — The brand link in the app bar goes to `/overview`. _Check:_ `Layout.test.tsx` › "brand links to overview" (replaces "brand links home"; "home selects no tab" is removed)
- **R6** — Overview has the heading "Overview" and a session card. With no active session it shows a "Start session" link to `/session`. With an active session it shows "Resume session", linking to `/session`. While the current session is loading, the card renders nothing. _Check:_ `src/pages/__tests__/Overview.test.tsx` › "shows Start session without an active session", "shows Resume session with an active session", "renders no session card while loading", "Start session goes to the session page"
- **R7** — Overview shows three placeholder sections, Calendar, Streak and Quick stats. Each has a heading and the text "Coming soon", and reads no data. _Check:_ `Overview.test.tsx` › "shows the placeholder sections" (headings Calendar, Streak, Quick stats; three "Coming soon")
- **R8** — History has the heading "History" and the past sessions list, with no Back button. Opening a past session goes to `/sessions/:id` as before. _Check:_ `src/pages/__tests__/History.test.tsx` › "shows the heading and past sessions", "has no back button"
- **R9** — SessionDetail's Back, when the detail page was opened directly (no in-app history), replaces the location with `/history`. Opened from inside the app it still goes back one step. _Check:_ `src/pages/__tests__/SessionDetail.test.tsx` › "replaces with history when opened directly" (now expects `/history`), "goes back in history when opened from the app" (initial entries `['/history', '/sessions/s1']`)
- **R10** — Settings has the heading "Settings" and the data card (storage status, last backup, JSON and CSV export), moved off the History view. _Check:_ `src/pages/__tests__/Settings.test.tsx` › "shows the heading and the data card"; `History.test.tsx` › "does not show the data card"
- **R11** — The Session page has no history mode and no History or Close icons. "New session" and "Session" headers show the title only. The backup reminder stays on "New session". _Check:_ `src/pages/__tests__/Session.test.tsx` › "new session header has no History or Close buttons", "active session header has no History button"; the tests "close on new session goes home", "history button opens history", "back from history returns to climb" and "history mode follows the view query" are deleted, because the behavior they cover is removed on purpose
- **R12** — The active session bar shows attempts and flashes only on `/session`. Everywhere else, including `/history` and `/overview`, it shows problems and sends only. _Check:_ `src/components/__tests__/ActiveSessionBar.test.tsx` › "omits attempts and flashes in history view" (now renders at `/history`), "shows attempts and flashes on the session page" (unchanged)
- **R13** — Focus mode still hides the app bar and both navs, as today. _Check:_ `Layout.test.tsx` › "focus mode hides app bar and nav" (unchanged, still passing)
- **R14** — On a phone, the five bottom-bar items fit the screen with readable labels and no horizontal scroll. On desktop, the five tabs fit the app bar next to the brand. _Check:_ `manual: npm start → devtools at 360×640 → all five bottom items visible with labels, none clipped, page does not scroll sideways → tap each, the highlight follows → Overview shows the session card and three "Coming soon" sections → start a session, go to History, the bar shows problems/sends only → open a past session, Back returns to History → at 1280 wide the five tabs sit in the app bar`

## Constraints
- No schema change; no Dexie `version()` bump.
- No new dependencies. Icons come from `@mui/icons-material`.
- Each new page lives in its own file under `src/pages/` (`react-refresh/only-export-components`). If nav items become a shared list, it goes in a non-component module.
- Keep the active session bar, skip link, `main` landmark and focus-mode behavior from `specs/done/ui-a11y-pass/spec.md` working.
- MUI `BottomNavigationAction` has a default `minWidth` of 80 px, so five items need 400 px and overflow a 360 px screen. Fix the width in the bottom bar; don't shorten the labels the user chose.

## Out of scope
- Real calendar, streak or quick-stats logic, and quick-start buttons (timer presets). Each is a later spec.
- Redirecting `/session?view=history` to `/history`.
- New settings beyond the data card (theme, units, about).
- Changing Session check-in, logging or wrap-up flows other than removing the header icons.
- Page transitions or animations.

## Open questions
- (none)
