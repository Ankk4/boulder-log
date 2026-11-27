---
status: draft
commitment: spec-anchored
---

# Calendar and weekly summary

## Goal
History gets a month calendar, so you can see gaps, clusters and back-to-back hard days at a glance. It also gets a per-week summary (sessions, time, problems, sends, load), so consistency shows without reading every row.

## Context
- Research: `research/tracking/session-reflection-and-review-loop.md` §4 (calendar) and §5 (ISO-week summary), `research/tracking/evidence-self-monitoring-goals-motivation.md` (feedback bundled with goals; a repairable weekly streak is defensible, no reward badges)
- Relevant code: `src/components/PastSessionsList.tsx`, `src/pages/Session.tsx` (History view), `src/db/index.ts`, `src/utils/duration.ts`
- **Precondition:** `ux-sessions` has shipped (History in the URL, `/sessions/:id`). `session-type` ships first if days are coloured by type. `session-load` ships first if the weekly row shows load.

## Requirements
- **R1**: History has a "List | Calendar" switch, and the choice is in the URL (`?view=history&layout=calendar`). _Check:_ `Session.test.tsx` › "calendar layout follows the query"
- **R2**: The calendar shows one month as a Monday-first grid with ISO week numbers in the first column. Today is marked, and previous/next month buttons work. A month with no sessions still renders the grid. _Check:_ `src/components/__tests__/SessionCalendar.test.tsx` › "renders a Monday-first month", "shows week numbers", "navigates months", "renders an empty month"
- **R3**: A day with sessions shows a marker per session (up to 3, then "+n"), tinted and lettered by type when `session-type` is present. Colour is never the only signal. Tapping a day with one session opens `/sessions/:id`; with several, it lists them to choose from. _Check:_ `SessionCalendar.test.tsx` › "marks session days", "opens a single session", "lists multiple sessions on a day"; `manual: npm start → History → Calendar at 360 px → markers readable, letters visible, no horizontal scroll`
- **R4**: `weekSummary(sessions, isoWeek)` in `src/utils/weekly.ts` returns sessions, total minutes, problems, sends (flash + send) and load (or null). It counts only ended sessions, and assigns each session to the week of its local start date. _Check:_ `src/utils/__tests__/weekly.test.ts` › "sums a week", "ignores the active session", "spans a year boundary", "load is null without session-load data"
- **R5**: Under the calendar, the current and previous ISO weeks each show a one-line summary from `weekSummary`. _Check:_ `SessionCalendar.test.tsx` › "shows this week and last week"
- **R6**: No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- No Dexie `version()` bump. Read sessions with the existing `startTime` index, filtered to the month shown.
- No calendar or date library; MUI and plain `Date` only.
- No horizontal scroll at 360 px. Day cells are at least 40 px.

## Out of scope
- Planned or future sessions.
- Streaks of any kind (see open questions).
- Timer runs on the calendar.
- Year view and heatmaps.
- Charts or trends beyond the two week lines.

## Open questions
- Should timer runs (`IntervalRun`) appear on the calendar, e.g. as a hangboard day?
- Do you want a repairable weekly streak ("3 of your last 4 weeks had a session")? The research says it's defensible if it isn't a reward badge. Here or later?
- Should "sends" in the week line include flashes? (This is the same question as quicklog-speed R7.)
- Should the calendar be the default History layout, or the list?
- Should the week summary go on Home as well?
