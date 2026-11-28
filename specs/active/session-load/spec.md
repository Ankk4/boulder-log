---
status: draft
commitment: spec-anchored
---

# Session load

## Goal
Each ended session shows its load (session RPE × minutes), shown next to the RPE and minutes it comes from. History shows a plain week-over-week comparison once there's enough data, so the climber can spot a jump in volume without the app telling them what it means.

## Context
- Research: `research/sport/evidence-training-load-and-rpe.md` (sRPE validity and timing; monotony/strain not supported; ACWR only descriptive), `research/README.md` takeaways pass 2, conclusion 4 (show less: no monotony/strain, week-over-week only after 3 complete weeks, no zones or risk words)
- Relevant code: `src/types/index.ts` (`PostSessionReview.rpe`, `Session.duration`), `src/components/PostSessionReview.tsx`, `src/components/PastSessionsList.tsx`, `src/utils/duration.ts`
- **Precondition:** `ux-sessions` has shipped (wrap-up view and `/sessions/:id` page).

## Requirements
- **R1**: `sessionLoad(session)` in `src/utils/load.ts` returns `rpe × duration` (minutes), or `null` when the RPE or duration is missing or the session is active. _Check:_ `src/utils/__tests__/load.test.ts` › "multiplies rpe by minutes", "null without rpe", "null for an active session"
- **R2**: The session detail page and the wrap-up summary show "Load <n> (RPE <r> × <m> min)" when the load isn't null, and nothing otherwise. _Check:_ `SessionDetail.test.tsx` › "shows the load with its parts", "hides load without rpe"
- **R3**: In wrap-up, the climber can correct the duration used for load (e.g. the session ran on while they rested at home). The override is saved as minutes, and the original start/end times stay unchanged. _Check:_ `Session.test.tsx` › "duration override changes the saved duration only"
- **R4**: `weeklyLoads(sessions)` groups ended sessions by ISO week (Monday start, local time) and sums the loads. Sessions without a load count toward the session count but not the sum. _Check:_ `load.test.ts` › "groups by ISO week", "spans a year boundary", "skips null loads in the sum"
- **R5**: History shows "This week: <n> · last week: <m> (<±p>%)" only once there are 3 complete ISO weeks with at least one load. The text is descriptive only: no colours meaning good or bad, and no words like risk, danger, overtraining or injury. _Check:_ `PastSessionsList.test.tsx` › "hides the week comparison before 3 weeks", "shows the week comparison after 3 weeks"; `rg -n -i "risk|danger|overtrain|injur" src/utils/load.ts src/components/PastSessionsList.tsx` prints nothing
- **R6**: No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- Load is derived, never stored. Only the duration override is written, and it goes into the existing `duration` field.
- No Dexie `version()` bump.
- Pure utils with tests. Week maths uses local time with an ISO-week helper; no new date library.

## Out of scope
- Monotony, strain, ACWR zones, readiness scores or any risk wording.
- Charts. The calendar-and-weekly spec owns the weekly view.
- Load per session type (needs `session-type`; add it later).
- Load for timer runs.

## Open questions
- RPE scale: the review uses 1–10. Keep it, or switch to CR-10 (0–10 with verbal anchors such as "3 moderate", "7 very hard")? CR-10 is what the sRPE studies use.
- When is RPE asked: in wrap-up right after climbing, or as a nudge about 30 min later? The research notes timing matters, but the evidence is thin for bouldering.
- Should the duration override live in wrap-up only, or also on the session detail page (that would mean editing a past session, currently out of scope)?
- Is "3 complete weeks" the right threshold before showing week-over-week?
- Wording: "Load" or "Session load"? Show the unit as "AU" (arbitrary units) or no unit?
