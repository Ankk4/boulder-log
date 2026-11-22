---
status: approved
commitment: spec-anchored
---

# Session UX

## Goal
During a session, logging comes first: one compact stats strip, the goals, and the problem list, with no review form in the way. Ending is a separate wrap-up step that can be left and resumed. The check-in uses tap rows instead of sliders and brings back last session's "work on" items as goals. History is a scannable list where each session opens on its own page.

## Context
- Research: `research/tracking/qol-mobile-interaction-patterns.md` (check-in sliders, one-handed use), `research/tracking/session-reflection-and-review-loop.md` and `research/README.md` takeaway 1 (takeaways back at check-in close the loop), `research/tracking/evidence-self-monitoring-goals-motivation.md` (goals + feedback)
- Relevant code: `src/pages/Session.tsx`, `src/components/PreSessionForm.tsx`, `src/components/PostSessionReview.tsx` (`RatingPicker`), `src/components/PastSessionsList.tsx` (`ReviewLines`), `src/components/QuickLog.tsx`, `src/db/database.ts`, `src/db/index.ts`, `src/App.tsx`, `src/components/Layout.tsx`
- **Precondition:** `qol-fixes`, `undo-log` and `data-trust` are shipped (in `specs/done/`) before `/run-spec ux-sessions` starts. All three edit `Session.tsx`; the planner re-checks `tasks.md` allowed files and notes against master at that point and adjusts them.

## Requirements

### Live session
- **R1** — The live view shows one stats strip at the top (labelled "Session stats" for assistive tech) with elapsed time, problems, attempts, flashes and sends. The "Session Details" and "Session Stats" headings and the per-line stat list are gone. _Check:_ `src/pages/__tests__/Session.test.tsx` › "shows the stats strip during a session", "updates the strip after logging an attempt"
- **R2** — Session goals show as compact chips under the strip; with no goals nothing is rendered (no heading). _Check:_ `Session.test.tsx` › "shows goals as chips", "renders no goals block without goals"
- **R3** — The live view holds, in order: strip, goals, QuickLog, then a "Finish session" button. The post-session review and the notes field are not rendered in the live view. _Check:_ `Session.test.tsx` › "live view has no review or notes"
- **R4** — Live layout reads well on a phone: strip fits one or two lines at 360 px width, logging is reachable without scrolling past stats. _Check:_ `manual: npm start → phone width (360 px) devtools → start a session, add 3 problems → strip is one or two lines, first problem row visible without scrolling`

### Wrap-up
- **R5** — "Finish session" switches the page to a wrap-up view showing a summary (duration, problems, attempts, flashes, sends, success rate), the post-session review, the notes field, "Save & end" and "Back to climbing". Tapping Finish writes nothing: the session stays active (`endTime: null`). A session with no problems shows zeros and `0%`, never `NaN`. _Check:_ `Session.test.tsx` › "finish opens wrap-up without ending the session", "wrap-up summary with no problems shows 0%"
- **R6** — "Back to climbing" returns to the live view; review and notes entered in wrap-up are kept, and Finish shows them again. _Check:_ `Session.test.tsx` › "back to climbing keeps the review draft" (Finish → pick RPE, type a note → Back → Finish → RPE still selected, note still there)
- **R7** — "Save & end" ends the session exactly as End Session did before (`endTime`, `duration` counted to that moment, sanitized review and notes) and keeps the undo-log and data-trust behavior attached to ending (snackbar with Undo, persistence request). Undo returns to the live view with the draft intact. Existing end-session tests move to the two-step flow; their assertions stay. _Check:_ `Session.test.tsx` › "ends current session", "saves the filled-in review when ending", plus the undo-log and data-trust end-session tests, all passing through Finish → Save & end
- **R8** — The wrap-up view is page state only: switching to History and back, or reloading, returns to the live view of the still-active session, draft intact (it is already autosaved). _Check:_ `Session.test.tsx` › "switching to history from wrap-up returns to the live view"

### Check-in
- **R9** — The five check-in sliders become tap rows: sleep, energy, finger soreness and motivation 1–10, rest days 0–7. They use one `RatingPicker` component (moved from `PostSessionReview.tsx` into its own file, with a range prop), which the post-session review keeps using. In the check-in, tapping the selected value keeps it selected (the field is never empty); in the review, tapping it still clears it. _Check:_ `src/components/__tests__/RatingPicker.test.tsx` › "renders the given range", "clears on re-tap when clearable", "keeps the value on re-tap when not clearable"; `Session.test.tsx` › "clears a picker when the selected value is clicked again" (existing)
- **R10** — Check-in defaults and the saved `preSessionData` shape are unchanged (5s, 1 rest day). _Check:_ `Session.test.tsx` › "starts a new session" (existing, unchanged assertions), "saves picked check-in values"
- **R11** — When the most recently ended session has `postSessionReview.workOn` items, the check-in shows them under "Last time: work on", each with "Add as goal". Adding puts the item into goals through the existing goal rules (`sanitizeGoals`, `LIMITS.maxGoals`); the button is disabled once that item is a goal or the goal limit is reached. Nothing is shown when there is no ended session, no review, or an empty `workOn`. The active session never counts as "last". _Check:_ `src/components/__tests__/PreSessionForm.test.tsx` › "shows last work-on items", "adds a work-on item as a goal", "disables add at the goal limit", "shows nothing without a previous review"; `src/utils/__tests__/sessions.test.ts` › "ignores the active session", "picks the latest ended session", "returns undefined for no sessions"

### History
- **R12** — The History list leaves out the active session. _Check:_ `src/components/__tests__/PastSessionsList.test.tsx` › "omits the active session"
- **R13** — Each History row is a one-line summary: date, duration, problems, sends, and RPE when set. Tapping a row opens `/sessions/:id`. Delete stays on the row with the existing confirm dialog. _Check:_ `PastSessionsList.test.tsx` › "row shows the summary", "row opens the session page"; existing review-line tests move to the detail page tests
- **R14** — `/sessions/:id` shows that session: date and time, summary stats, check-in values, goals with achieved ones marked, review lines, notes, and each problem with grade, attempt count and flash/send. An unknown id shows "Session not found" with a link back to History. _Check:_ `src/pages/__tests__/SessionDetail.test.tsx` › "shows the session", "shows each review line for a full review", "omits empty review lines", "shows not found for an unknown id"
- **R15** — History mode is in the URL (`/session?view=history`), so the browser or phone back button from a session page returns to the History list, not the check-in. The Session tab stays highlighted on `/sessions/:id`. _Check:_ `Session.test.tsx` › "history mode follows the view query"; `src/components/__tests__/Layout.test.tsx` › "highlights Session on a session page"; `manual: npm start → History → open a session → phone/browser back → History list is shown`

### Hygiene
- **R16** — No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- UI only: no new fields, no Dexie `version()` bump. A non-indexed read helper in `src/db/database.ts` is fine.
- Mobile-first: touch targets at least 40 px as in the existing `RatingPicker`; no horizontal scroll at 360 px.
- No confirm dialog before Save & end (undo-log covers mistakes).
- Visual choices (chip style, strip spacing) are the implementer's within MUI defaults; the user checks them in R4.

## Out of scope
- "Same as last time" and "Quick start" on the check-in.
- Session type, new wellness items, or changing rating scales.
- Editing a past session; deleting from the session page.
- Done/carry state for takeaways (only "Add as goal").
- Charts, trends or weekly summaries in History.
- A sticky Finish button (quicklog-speed owns the sticky bottom bar).

## Open questions
