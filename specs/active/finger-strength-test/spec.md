---
status: draft
commitment: spec-anchored
---

# Finger strength test

## Goal
A climber can log a max-hang test (e.g. a 5 s hang on a 20 mm edge, bodyweight plus added load) and see the result as % of bodyweight over time. This is the one strength measure with reasonable evidence behind it, and the app presents it as indicative, never as a grade prediction.

## Context
- Research: `research/sport/evidence-finger-strength-hangboard-injury.md` §2 (%BW finger strength vs grade, r 0.42–0.77) and §3 (9c test unvalidated), `research/sport/assessment-and-athlete-profile.md`, `research/README.md` pass 1 conclusion 4 and pass 2 conclusion 6 (store raw values; bodyweight per test, not a time series; no grade headline)
- Relevant code: `src/db/database.ts` (schema), `src/types/index.ts`, `src/pages/Workouts.tsx` (Timer tab), `src/hooks/useIntervalTimer.ts`, `src/utils/backup.ts`, `src/utils/validation.ts`

## Requirements
- **R1**: There's a new `strengthTests` table storing raw values: `id, testedAt, protocol ('max-hang-5s'), edgeMm, grip ('half-crimp' | 'open' | 'full-crimp'), bodyweightKg, addedKg (negative = assisted), hands ('two' | 'one-left' | 'one-right'), notes?`. A Dexie `version(3)` adds it (or the next version, if `projects` ships first). Existing data loads unchanged. _Check:_ `src/db/__tests__/database.test.ts` › "upgrade keeps existing data", "adds strengthTests"
- **R2**: `percentBodyweight(test)` in `src/utils/strength.ts` returns `(bodyweight + added) / bodyweight × 100`, rounded to one decimal. It returns null for a bodyweight of 0 or less or a total load of 0 or less. _Check:_ `src/utils/__tests__/strength.test.ts` › "computes percent bodyweight", "handles assisted load", "null for invalid bodyweight"
- **R3**: From the Timer tab, "Log strength test" opens a form. Edge, grip and hands default to the last test's values. Bodyweight is asked each time and is never prefilled from an earlier test. Inputs are validated (edge 6–40 mm, bodyweight 20–200 kg, added −100 to 200 kg), with inline errors. _Check:_ `src/components/__tests__/StrengthTestForm.test.tsx` › "defaults to last edge and grip", "bodyweight is not prefilled", "shows range errors"
- **R4**: A history list shows each test's date, %BW, edge, grip and hands. Results are compared only within the same edge, grip and hands ("+4.2 %BW since <date>"). The list never shows a grade estimate. _Check:_ `src/components/__tests__/StrengthTestList.test.tsx` › "compares like with like", "does not compare different edges"; `rg -n -i "grade|9c|predict" src/utils/strength.ts src/components/StrengthTest*.tsx` prints nothing
- **R5**: The form and the list show one line: "Indicative only. Finger strength relates to grade but doesn't predict it. Not medical advice." _Check:_ `StrengthTestList.test.tsx` › "shows the indicative note"
- **R6**: JSON backup includes strength tests, and restore round-trips them. An older backup without them still restores. _Check:_ `backup.test.ts` › "round-trips strength tests", "restores a backup without strength tests"
- **R7**: The form and list work one-handed at 360 px with numeric keyboards. _Check:_ `manual: npm start → Timer → Log strength test at 360 px → numeric keypad opens, form fits, list readable`
- **R8**: No skipped or focused tests are added. _Check:_ `git diff master...HEAD -- . ':!specs' | rg '^\+.*\b(it|test|describe)\.(skip|only)\('` prints nothing

## Constraints
- **Schema change:** a new Dexie version with an upgrade path; the schema task is `schema-change: yes`. Coordinate the version number with `projects`.
- Bodyweight is stored per test only: no weight chart, no BMI and no weight-vs-grade view.
- Units are kg only for now.

## Out of scope
- The 9c test, other test batteries, and the weakness quiz.
- Hangboard training cycles and plans (separate `hangboard-cycles` spec).
- Pull-up or campus tests.
- A chart. Phase 1 is a list with like-for-like deltas.
- Injury tracking.

## Open questions
- Where should this live: the Timer tab (Workouts), a Profile section, or Home?
- Should the 5 s hang use the interval timer (a 5 s work countdown with beeps), or just a log form?
- Protocol choice: only "max hang 5 s", or also 7 s or 10 s? A free-text protocol field instead of a fixed list?
- Bodyweight: always required, or optional so that only added load is stored (then no %BW)? It's sensitive data, so do you want it hidden in the list?
- Units: kg only, or a lb toggle?
