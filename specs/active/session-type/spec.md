---
status: draft
commitment: spec-anchored
---

# Session type

## Goal
Each session carries one type tag (e.g. bouldering, training, complementary, competition, active rest), so later views (calendar, weekly summary, load) can tell a limit day from a recovery day. Picking it costs one tap because the last used type is preselected.

## Context
- Research: `research/tracking/session-reflection-and-review-loop.md` §3 (type taxonomy), `research/README.md` takeaways pass 1, conclusions 1 and 5 (type is the field later views key on; type is a separate axis from training phase)
- Relevant code: `src/types/index.ts` (`Session`, `PreSessionData`), `src/components/PreSessionForm.tsx`, `src/pages/Session.tsx`, `src/components/PastSessionsList.tsx`, `src/db/database.ts` (`exportSessionToSheets`), `src/utils/backup.ts`, `src/utils/validation.ts`
- **Precondition:** `ux-sessions` has shipped. It rewrites the check-in (`PreSessionForm`) and the History rows. The planner re-checks file lists against master before splitting tasks.

## Requirements
- **R1**: The check-in shows a single-select "Session type" chip row with the fixed list `SESSION_TYPES` from `src/utils/sessionTypes.ts`. Exactly one type is always selected. _Check:_ `src/components/__tests__/PreSessionForm.test.tsx` › "shows the session type chips", "always has one type selected"
- **R2**: The type preselects the most recently started earlier session's type. With no earlier session, or when that session has no type, it falls back to the default type. _Check:_ `src/utils/__tests__/sessionTypes.test.ts` › "uses the last session's type", "falls back to the default"
- **R3**: The chosen type is saved on the session when it starts, and old sessions without a type still load and display. _Check:_ `src/pages/__tests__/Session.test.tsx` › "saves the session type on start", `PastSessionsList.test.tsx` › "shows a session without a type"
- **R4**: Each History row and the session detail page show the type label. _Check:_ `PastSessionsList.test.tsx` › "row shows the session type"; `SessionDetail.test.tsx` › "shows the session type"
- **R5**: JSON backup includes the type and restores it. CSV export has a `type` column. _Check:_ `src/utils/__tests__/backup.test.ts` › "round-trips session type"; `src/utils/__tests__/csv.test.ts` (or the export test that covers session rows) › "includes the type column"
- **R6**: A restored or imported value that isn't in `SESSION_TYPES` is treated as missing, never shown raw. _Check:_ `sessionTypes.test.ts` › "rejects unknown types"
- **R7**: No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- No Dexie `version()` bump: `type` is not indexed. Indexing it later for calendar queries would be its own spec.
- The type list lives in one util with stable string ids. Labels can change without migrating data.
- Mobile-first: chips at least 40 px tall, wrapping at 360 px.

## Out of scope
- A second "intent" tag (limit, volume, technique, projecting).
- Training phase (base, strength, power-endurance…); that belongs to a goals/phases spec.
- Logging rest days as sessions.
- Editing the type of a past session.
- Filtering History by type.

## Open questions
- Which list should ship? The research suggests: bouldering, training (board/hangboard/campus), complementary (strength, mobility), competition, active rest. Your spreadsheet uses training, complementary, competition, active rest. Should "bouldering" be separate from "training"?
- Default type for the very first session: "bouldering"?
- Should a timer run (`IntervalRun`) also get a type, or does it count as "training" implicitly?
- Should old sessions with no type show "—", or be shown as the default type?
- Do you want an optional per-type colour now? The calendar spec needs one; it could be defined here.
