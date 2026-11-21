---
status: done
commitment: spec-anchored
---

# Post-session review

## Goal
At the end of a session the climber records how hard it felt (session RPE), how much energy they have left, what they accomplished, what to work on next, and which of their pre-session goals they hit. Past sessions show this review in History, so effort and takeaways can be compared over time. This is the data that taskwarrior #4 (takeaways shown on the next check-in) builds on.

## Context
- Research: none yet (`research/README.md` has no note on post-session review).
- Relevant code:
  - `src/pages/Session.tsx`: active-session screen, `endSession`, the current free-text "Post-session notes" box.
  - `src/types/index.ts`: `Session`, `PreSessionData`.
  - `src/utils/validation.ts`: `LIMITS`, `sanitizeNotes`, `sanitizeGoals`, `clampNumber`.
  - `src/components/PreSessionForm.tsx`: goal chips (Enter to add, chip delete), the pattern for item lists.
  - `src/components/PastSessionsList.tsx`: History list.
- UI decision: the review is **inline** on the active-session screen, not a dialog (mobile UI; a full UI refactor comes later).

## Requirements

### Data
- **R1**: `Session` gets an optional `postSessionReview` with `rpe: number | null` (1–10), `energyAfter: number | null` (1–10), `accomplishments: string[]`, `workOn: string[]` and `achievedGoals: number[]` (indexes into `preSessionData.goals`). Sessions without it, including all existing ones, load and render as before. No Dexie `version()` bump, because none of these fields is indexed. _Check:_ `npm run typecheck`; `git diff master...HEAD -- src/db/database.ts` is empty.
- **R2**: `sanitizePostSessionReview` in `src/utils/validation.ts` does the following:
  - clamps `rpe` and `energyAfter` to whole numbers 1–10, keeping `null` as `null`
  - trims each list item, drops empty items, and caps item length at `LIMITS.reviewItem` (200) and list length at `LIMITS.maxReviewItems` (20)
  - drops `achievedGoals` indexes that are out of range for the session's goals, and removes duplicates

  _Check:_ `src/utils/__tests__/validation.test.ts › "sanitizePostSessionReview"` covers each rule, including `null` ratings and out-of-range indexes.

### Active session (inline review)
- **R3**: Below the problem log, the active-session screen shows a "Session review" section:
  - an RPE picker 1–10 and a post-session energy picker 1–10. Each starts **unset** and can be cleared again, so an untouched picker saves `null`, never a default.
  - "Accomplished" and "Work on" item lists: type, press Enter or tap Add to append; each item has a delete control.
  - when the session has goals, one checkbox per goal, labelled with the goal text, to mark it achieved.
  - the existing "Post-session notes" box.

  _Check:_ `src/pages/__tests__/Session.test.tsx › "post-session review"` tests: pick RPE 7 and energy 4, add one item to each list, tick the second goal, type notes, click End Session. `db.sessions.put` gets `postSessionReview: { rpe: 7, energyAfter: 4, accomplishments: [...], workOn: [...], achievedGoals: [1] }` and the notes.
- **R4**: Ending a session without touching the review saves `postSessionReview` with `rpe: null`, `energyAfter: null` and empty lists. A session with no goals shows no goal checkboxes. _Check:_ `src/pages/__tests__/Session.test.tsx` test: End without input → payload as described; a session with `goals: []` renders no goal checkbox.
- **R5**: The review draft (all of R3, including the notes) is written to the active session in IndexedDB as it changes. It survives leaving the Session page and coming back, and a page reload. After End Session succeeds, the next session starts with an empty review. If the End put fails, the draft stays. _Check:_ `src/pages/__tests__/Session.test.tsx` tests:
  - pick an RPE → `db.sessions.update` (or `put`) is called with the draft
  - unmount, then remount with `useCurrentSession` returning a session that holds a draft → the pickers, lists and notes show it
  - End → rerender with no session → Start → rerender as active → the review is empty

  `manual: npm start → start a session, fill some of the review, go to Workouts and back, then reload → the review is still filled in.`
- **R6**: The review controls work on a phone-width screen (360px): the pickers are tappable without zooming, and nothing scrolls sideways. _Check:_ `manual: npm start → devtools 360px width → fill the review → no horizontal scroll, every RPE/energy value tappable.`

### History
- **R7**: In History, a past session with a review shows the following:
  - `RPE: n` and `Energy: before → after`, where before is the pre-session `energyLevel`. Each part is omitted when its value is `null`.
  - `Goals achieved: x/y` when the session had goals
  - the Accomplished and Work on items, each line only when its list is non-empty

  A session without `postSessionReview` shows exactly what it shows today. _Check:_ `src/components/__tests__/PastSessionsList.test.tsx` tests: a session with a full review shows each line; one with `rpe: null` and empty lists shows no RPE or list lines; a session without a review renders no review lines.

## Constraints
- Data stays local (IndexedDB via Dexie). No schema `version()` bump (R1): the new fields are not indexed.
- Mobile first (R6). No dialogs for the review.
- Reuse `LIMITS`, `clampNumber` and the sanitizers in `src/utils/validation.ts`. Don't edit `PreSessionForm.tsx`.
- `react-refresh/only-export-components`: new components go in their own files, apart from hooks and constants.

## Out of scope
- CSV export (`exportSessionToSheets`) of the review.
- Showing takeaways on the next session's check-in (taskwarrior #4).
- Editing a review after the session has ended.
- Charts or trends of RPE and energy.
- Restyling the existing pre-session form or session screen.

## Open questions
- None. Resolved in the interview: inline rather than a dialog; item lists rather than free text; RPE and energy both 1–10; History and goal ticks are in, CSV is out. R5 (draft persistence) was added by the planner: with an inline review filled over a long session, losing it on navigation would be the main failure.
