---
status: approved
commitment: spec-anchored
---

# Session UX

## Goal
Starting a session is one tap: the check-in is short, collapsible and optional, and can be filled in after starting. While a session runs, a bar on every page shows that it is live, with a ticking timer and the main counts. The Session page puts logging first, with no mode toggle or review form in the way. Ending is a separate wrap-up step that can be left and resumed. History is a scannable list where each session opens on its own page. The undo snackbar no longer blocks the bottom of the screen.

## Context
- Research: `research/tracking/qol-mobile-interaction-patterns.md` (check-in sliders, one-handed use), `research/tracking/session-reflection-and-review-loop.md` and `research/README.md` takeaway 1 (takeaways back at check-in close the loop), `research/tracking/evidence-self-monitoring-goals-motivation.md` (goals + feedback)
- Relevant code: `src/pages/Session.tsx`, `src/components/PreSessionForm.tsx`, `src/components/PostSessionReview.tsx` (`RatingPicker`), `src/components/PastSessionsList.tsx` (`ReviewLines`), `src/components/QuickLog.tsx`, `src/components/Layout.tsx`, `src/components/PageHeader.tsx`, `src/components/UndoSnackbar.tsx`, `src/types/index.ts` (`PreSessionData`), `src/db/database.ts` (CSV export), `src/db/index.ts`, `src/App.tsx`
- **Base:** this branch is stacked on `feature/quicklog-speed` (finished, in `specs/done/`, not yet merged to master). Until it merges, diff and review against `feature/quicklog-speed`, not master, and open any PR with `--base feature/quicklog-speed`. Once it merges, rebase onto master and retarget the PR. (`qol-fixes`, `undo-log` and `data-trust` are already on master.)

## Requirements

### Active session bar
- **R1** — While a session is active, a bar directly under the app bar shows on every page that has the app bar (so not in `WorkoutRun` focus mode): a live indicator, the elapsed time ticking every second (`m:ss` under an hour, `h:mm:ss` from an hour), problems and sends. It is labelled "Active session" for assistive tech. Tapping it opens the live view at `/session`. With no active session it isn't rendered. _Check:_ `src/components/__tests__/ActiveSessionBar.test.tsx` › "renders nothing without an active session", "shows elapsed time and counts", "ticks every second", "opens the session on tap"; `src/components/__tests__/Layout.test.tsx` › "shows the active session bar on other pages", "hides the active session bar in focus mode"
- **R2** — On `/session` the bar also shows attempts and flashes. The Session page has no stats block of its own: the "Session Details" and "Session Stats" headings and the per-line stat list are gone. _Check:_ `ActiveSessionBar.test.tsx` › "shows attempts and flashes on the session page"; `src/pages/__tests__/Session.test.tsx` › "live view has no stats block"
- **R3** — At 360 px the bar is one line on other pages and at most two on `/session`, sticks with the app bar while scrolling, and causes no horizontal scroll. _Check:_ `manual: npm start → devtools at 360 px → start a session, log 3 problems → open Workouts and Home, then Session, and scroll → bar stays under the app bar, one line on Workouts/Home, two at most on Session`

### Session page
- **R4** — The Climb/History toggle row is gone. The Session page header has a "History" icon button (accessible name "History") that opens `/session?view=history`. The history view's header is "History" with a back button (accessible name "Back") to `/session`. _Check:_ `Session.test.tsx` › "history button opens history", "back from history returns to climb"
- **R5** — History mode is in the URL (`/session?view=history`) and is set with `replace`, so the phone or browser back button from a session page returns to the History list, not the check-in. The Session tab stays highlighted on `/sessions/:id`. _Check:_ `Session.test.tsx` › "history mode follows the view query"; `Layout.test.tsx` › "highlights Session on a session page"; `manual: npm start → History → open a session → phone/browser back → History list is shown`

### Starting a session
- **R6** — With no active session, the page header reads "New session" with a close button (accessible name "Close") that goes to Home (`/`). There is no separate "Pre-Session Check-in" heading. _Check:_ `Session.test.tsx` › "close on new session goes home", "no check-in heading"
- **R7** — "Start session" is the first control under the header, above the check-in, so a session starts in one tap without scrolling. _Check:_ `Session.test.tsx` › "starts a session without touching the check-in"; `manual: npm start → 360 px → Session tab → Start session visible without scrolling`
- **R8** — Check-in values start as "not recorded". A session started without touching them saves only goals and notes in `preSessionData`: sleep, energy, finger soreness, motivation, rest days, nutrition and stress are absent. `PreSessionData` makes those seven fields optional. This is a type change only: no Dexie `version()` bump, and existing sessions keep their values. The CSV export (`exportSessionToSheets`) already skips absent keys and needs no change. _Check:_ `Session.test.tsx` › "starts a new session" (updated: asserts the absent fields), "saves picked check-in values"; `npm run typecheck` passes with the optional fields

### Check-in form
- **R9** — The check-in is grouped under two section headings, "How you feel" (Physical, Mental, Nutrition) and "Plan" (Goals, Notes). Each group is a collapsible panel. Collapsed panels show a one-line summary of what is set (e.g. "Sleep 7 · Energy 6"), or "Not recorded". Goals starts expanded and the others start collapsed. _Check:_ `src/components/__tests__/PreSessionForm.test.tsx` › "groups start collapsed except goals", "collapsed group shows its summary", "expands a group on tap"
- **R10** — Sleep, energy, finger soreness and motivation (1–10) and rest days (0–7) are tap rows using one `RatingPicker` component, moved from `PostSessionReview.tsx` into its own file with `min`/`max` props. The post-session review keeps using it. Nutrition and stress become single-select tap rows in the same style instead of radio buttons. In every picker, tapping the selected value clears it back to not recorded. _Check:_ `src/components/__tests__/RatingPicker.test.tsx` › "renders the given range", "clears on re-tap"; `PreSessionForm.test.tsx` › "renders the pickers with their ranges", "clears nutrition on re-tap"; `Session.test.tsx` › "clears a picker when the selected value is clicked again" (existing)
- **R11** — When the most recently ended session has `postSessionReview.workOn` items, the Goals panel shows them under "Last time: work on", each with "Add as goal". Adding puts the item into goals through the existing goal rules (`sanitizeGoals`, `LIMITS.maxGoals`). The button is disabled once that item is a goal or the goal limit is reached. Nothing is shown with no ended session, no review, or an empty `workOn`. The active session never counts as "last". _Check:_ `PreSessionForm.test.tsx` › "shows last work-on items", "adds a work-on item as a goal", "disables add at the goal limit", "shows nothing without a previous review"; `src/utils/__tests__/sessions.test.ts` › "ignores the active session", "picks the latest ended session", "returns undefined for no sessions"
- **R12** — During an active session, a "Check-in" button in the live view opens the same form, prefilled with the session's values, and a "Done" button returns to the live view. Changes are saved to the active session's `preSessionData` as they are made (sanitized, as at start). Removing a goal also removes it from the review draft's `achievedGoals`, and the indexes of later goals shift down. Like wrap-up, this is page state: reloading returns to the live view. _Check:_ `Session.test.tsx` › "edits the check-in during a session", "removing a goal keeps achieved goals aligned"

### Live view
- **R13** — Session goals show as compact chips at the top of the live view. With no goals nothing is rendered (no heading). _Check:_ `Session.test.tsx` › "shows goals as chips", "renders no goals block without goals"
- **R14** — The live view holds, in order: goal chips, QuickLog, then the "Check-in" and "Finish session" buttons. The post-session review and the notes field are not rendered there. _Check:_ `Session.test.tsx` › "live view has no review or notes"
- **R15** — At 360 px the first problem row is visible without scrolling once three problems are logged. _Check:_ `manual: npm start → 360 px → start a session, add 3 problems → first problem row visible without scrolling`

### Wrap-up
- **R16** — "Finish session" switches the page to a wrap-up view with a summary (duration, problems, attempts, flashes, sends, success rate), the post-session review, the notes field, "Save & end" and "Back to climbing". Tapping Finish writes nothing: the session stays active (`endTime: null`). A session with no problems shows zeros and `0%`, never `NaN`. _Check:_ `Session.test.tsx` › "finish opens wrap-up without ending the session", "wrap-up summary with no problems shows 0%"
- **R17** — "Back to climbing" returns to the live view. Review and notes entered in wrap-up are kept, and Finish shows them again. _Check:_ `Session.test.tsx` › "back to climbing keeps the review draft" (Finish → pick RPE, type a note → Back → Finish → RPE still selected, note still there)
- **R18** — "Save & end" ends the session exactly as End Session did before (`endTime`, `duration` counted to that moment, sanitized review and notes). It keeps the undo-log and data-trust behavior attached to ending (snackbar with Undo, persistence request). Undo returns to the live view with the draft intact. The existing end-session tests move to the two-step flow and keep their assertions. _Check:_ `Session.test.tsx` › "ends current session", "saves the filled-in review when ending", plus the undo-log and data-trust end-session tests, all passing through Finish → Save & end
- **R19** — The wrap-up view is page state only: switching to History and back, or reloading, returns to the live view of the still-active session with the draft intact (it is already autosaved). _Check:_ `Session.test.tsx` › "switching to history from wrap-up returns to the live view"

### History
- **R20** — The History list leaves out the active session. _Check:_ `src/components/__tests__/PastSessionsList.test.tsx` › "omits the active session"
- **R21** — Each History row is a one-line summary: date, duration, problems, sends, and RPE when set. Tapping a row opens `/sessions/:id`. Delete stays on the row with the existing confirm dialog. _Check:_ `PastSessionsList.test.tsx` › "row shows the summary", "row opens the session page"; the existing review-line tests move to the detail page tests
- **R22** — `/sessions/:id` shows that session: date and time, summary stats, check-in values ("—" for not recorded), goals with achieved ones marked, review lines, notes, and each problem with grade, attempt count and flash/send. An unknown id shows "Session not found" with a link back to History. _Check:_ `src/pages/__tests__/SessionDetail.test.tsx` › "shows the session", "shows a dash for unrecorded check-in values", "shows each review line for a full review", "omits empty review lines", "shows not found for an unknown id"

### Undo snackbar
- **R23** — The undo snackbar shows at the top, below the app bar and the active session bar, in a compact non-filled style. It has a close button (accessible name "Close") and can be swiped sideways to dismiss. Auto-hide drops from 8 s to 5 s. Undo works as before. _Check:_ `src/components/__tests__/UndoSnackbar.test.tsx` › "closes on the close button", "closes on a horizontal swipe", "ignores a short swipe", "undo still calls onUndo"; `manual: npm start → 360 px → log an attempt, delete a problem → snackbar at top under the session bar, swipe it away, bottom action bar never covered`

### Hygiene
- **R24** — No skipped or focused tests are added. _Check:_ `git diff feature/quicklog-speed...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing (diff against `master` once quicklog-speed merges)

## Constraints
- No Dexie `version()` bump. The only data change is R8 (seven `PreSessionData` fields made optional). Every reader of those fields handles absence. Non-indexed read helpers in `src/db/database.ts` are fine.
- Mobile-first: touch targets at least 40 px as in the existing `RatingPicker`, and no horizontal scroll at 360 px.
- No confirm dialog before Save & end (undo-log covers mistakes).
- Visual choices (chip style, bar colours, panel spacing) are the implementer's within MUI defaults. The user checks them in R3, R15 and R23.
- One clock for elapsed time: the bar (R1), the wrap-up summary (R16) and `duration` (R18) count from `startTime`.

## Out of scope
- "Same as last time" on the check-in.
- Session type, new wellness items, or changing rating scales.
- Editing an ended session; deleting from the session page.
- Done/carry state for takeaways (only "Add as goal").
- Charts, trends or weekly summaries in History.
- Pausing the session timer.
- A sticky Finish button (quicklog-speed owns the sticky bottom bar).
- A History tab in the bottom navigation.
- The active session bar in focus mode (`WorkoutRun`); maybe later.

## Open questions
