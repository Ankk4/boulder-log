---
status: draft
commitment: spec-anchored
---

# Personal bests

## Goal
The app works out your hardest flash and hardest send for each grade scale from the problems you've already logged. When you save a session that sets a new one, you get a quiet notice. Progress becomes visible without any extra typing.

## Context
- Research: `research/tracking/progress-records-and-projects.md` §1 (derived PBs per scale and setting, flash vs send), `research/README.md` pass 1 conclusion 2 ("derive, don't ask"), `research/tracking/evidence-self-monitoring-goals-motivation.md` (milestones over streaks, no reward badges)
- Relevant code: `src/utils/grades.ts` (grade order, added in quicklog-speed), `src/types/index.ts` (`SessionProblem.flash`/`send`), `src/pages/Home.tsx`, `src/pages/Session.tsx` (Save & end), `src/components/UndoSnackbar.tsx`
- **Precondition:** `quicklog-speed` (for `src/utils/grades.ts`) and `ux-sessions` (wrap-up and Save & end) have shipped.

## Requirements
- **R1**: `personalBests(problems)` in `src/utils/personalBests.ts` returns, for the French and colour scales separately, the hardest flash and the hardest send (a flash also counts as a send) with the date and session id. Hardness follows the order in `grades.ts`. Unknown grades are ignored. _Check:_ `src/utils/__tests__/personalBests.test.ts` › "hardest flash and send per scale", "a flash counts as a send", "ignores unknown grades", "empty without completed problems"
- **R2**: Ties go to the earliest date, so a later repeat isn't a new PB. _Check:_ `personalBests.test.ts` › "ties keep the first date"
- **R3**: `newBests(before, after)` lists the PBs that went up. Save & end shows "New best: flash 6c" (one line per PB) after the session is saved; nothing shows when there are no new PBs, and none is shown for the very first session. _Check:_ `personalBests.test.ts` › "lists only improved bests", "none on the first session"; `Session.test.tsx` › "shows a new best after save and end"
- **R4**: Home shows a "Personal bests" card with up to four values (French flash and send, colour flash and send) and their dates. The card is hidden when there are none. _Check:_ `src/pages/__tests__/Home.test.tsx` › "shows personal bests", "hides the card without bests"
- **R5**: Undoing Save & end also hides the new-best notice. _Check:_ `Session.test.tsx` › "undo hides the new-best notice"
- **R6**: No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- PBs are derived on read and never stored.
- No Dexie `version()` bump unless the "exclude from PB" open question is answered yes. Even then a non-indexed field needs no bump.
- The notice is quiet: text only, no confetti, sound or badge.

## Out of scope
- Grade pyramid chart.
- PBs per gym or setting.
- Sessions-to-send (that's in the projects spec).
- Converting between French and colour scales.

## Open questions
- Should there be an "exclude from PBs" flag per problem (soft-graded, kids' wall, mislogged)? If so, where: a long-press, or the problem row?
- Colour grades are ranges, not exact grades. Do you want colour PBs at all, or French only?
- Where should the new-best notice appear: inside the undo snackbar, or as its own line on the wrap-up summary?
- Should the Home card link to the session that set each PB?
