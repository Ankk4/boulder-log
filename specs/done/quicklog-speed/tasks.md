# Tasks: Faster quick log

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

## T1 — Grade lists and problem-default helpers
- covers: [R3, R4, R6, R7]
- runner: implementer
- allowed files: `src/utils/grades.ts`, `src/utils/problemDefaults.ts`, `src/utils/__tests__/problemDefaults.test.ts`, `src/components/DifficultySelect.tsx`
- check: `npx vitest run src/utils/__tests__/problemDefaults.test.ts`
- tests to add: the R3, R4 and R7 `problemDefaults.test.ts` cases, plus `gradeLabel` (French over colour, empty when neither).
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Move `frenchGrades` and `colorGrades` out of `DifficultySelect.tsx` into `grades.ts`, exported, and have `DifficultySelect.tsx` import them from there (otherwise knip flags `grades.ts` as unused). Don't delete `DifficultySelect.tsx` yet (T3 does).
  - Pure functions: `gradeLabel(p)`, `lastUsedGrades(problems)`, `autoName(problems, label)` and `summarizeLastTime(problems, currentSessionId, label)`.
  - `summarizeLastTime` picks the earlier session whose problems at that label have the newest `createdAt`.

## T2 — GradePicker component
- covers: [R2]
- runner: implementer
- allowed files: `src/components/GradePicker.tsx`, `src/components/__tests__/GradePicker.test.tsx`
- check: `npx vitest run src/components/__tests__/GradePicker.test.tsx`
- tests to add: the R2 `GradePicker.test.tsx` cases.
- parallel-safe: no
- schema-change: no
- depends-on: [T1]
- notes: Props mirror `DifficultySelect` (`frenchGrade`, `colorGrade`, two change callbacks). Use MUI `Chip` with `aria-pressed` for selection state. The swatch uses `grade.color` from `grades.ts`, never a literal in the `.tsx`. Chips at least 40 px tall with 8 px gaps.

## T3 — Faster Add Problem dialog
- covers: [R2, R3, R4, R5, R7]
- runner: implementer
- allowed files: `src/components/QuickLog.tsx`, `src/components/__tests__/QuickLog.test.tsx`, `src/db/index.ts`, `src/components/DifficultySelect.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/components/__tests__/QuickLog.test.tsx`
- tests to add: the R2, R3, R4, R5 and R7 `QuickLog.test.tsx` cases. Mock `../../db/index` for the history hook.
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes:
  - Add `useProblemsAtGrade(label)` to `src/db/index.ts`: `useLiveQuery` over `db.problems.where('frenchGrade').equals(label)`, or `colorGrade` when no French grade.
  - Remove `autoFocus`. Name passes through `sanitizeProblemName`; an empty result uses `autoName`.
  - Delete `DifficultySelect.tsx` once QuickLog no longer imports it. `src/__tests__/theme-usage.test.ts` keeps working: its DifficultySelect exception just stops matching.
  - Add `useProblemsAtGrade` to the `../../db/index` mock in `Session.test.tsx` (Session renders QuickLog).

## T4 — Labelled row buttons, one-tap add, sticky add bar
- covers: [R1, R6, R8]
- runner: implementer
- allowed files: `src/components/QuickLog.tsx`, `src/components/__tests__/QuickLog.test.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/components/__tests__/QuickLog.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: the R1 and R6 `QuickLog.test.tsx` cases.
- parallel-safe: no
- schema-change: no
- depends-on: [T3]
- notes:
  - Replace the `secondaryAction` layout and the `marginRight: '120px'` hack with name/grade on top and a row of three `Button`s (`minHeight: 48`, `flex: 1`, `gap: 1`). Keep the testids and the disable rules.
  - Sticky bar: `position: { xs: 'sticky', md: 'static' }`, `bottom: 'calc(56px + env(safe-area-inset-bottom))'`, with background from the theme.
  - Session tests use the testids, so the check runs them too.

## T5 — Review changes: two filled row buttons, flash from Send, no one-tap add
- covers: [R1, R6, R7, R8]
- runner: implementer
- allowed files: `src/components/QuickLog.tsx`, `src/components/__tests__/QuickLog.test.tsx`, `src/utils/problemDefaults.ts`, `src/utils/__tests__/problemDefaults.test.ts`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/components/__tests__/QuickLog.test.tsx src/utils/__tests__/problemDefaults.test.ts src/pages/__tests__/Session.test.tsx`
- tests to add: the new R1, R6 and R7 cases named in `spec.md`.
- parallel-safe: no
- schema-change: no
- depends-on: [T4]
- notes:
  - Remove the Flash button and the icons on Attempt/Send. Use `variant="contained"` (or a tonal style from the theme) so the background isn't transparent; keep `minHeight: 48`, `flex: 1`, `gap: 1`, and add `minWidth: 0` so they shrink.
  - Send calls `onAddAttempt(id, AttemptType.FLASH)` when `problem.attempts.length === 0`, else `AttemptType.SEND`. `Session.tsx` already sets `flash` for a FLASH attempt, so it needs no change.
  - Remove the one-tap add button, `handleOneTapAdd` and anything only it used (knip).
  - `summarizeLastTime`: `sent` counts `p.send || p.flash`.
  - Session.test: tests that click `flash-button` switch to `send-button` on a problem with no attempts. Keep their assertions (FLASH attempt type, "Flash logged" snackbar, undo).

## T6 — Attempt after a send: disabled, count includes the topping try
- covers: [R1]
- runner: implementer
- allowed files: `src/components/QuickLog.tsx`, `src/components/__tests__/QuickLog.test.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/components/__tests__/QuickLog.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: "attempt disabled and counts the flash after a flash", plus a send-after-attempts case (2 attempts then Send → "Attempt (3)", disabled).
- parallel-safe: no
- schema-change: no
- depends-on: [T5]
- notes:
  - Count `problem.attempts.length` (all attempt types) instead of only `AttemptType.ATTEMPT`.
  - `disabled={problem.flash || problem.send}` on Attempt too.
  - Update existing assertions on the count text only where this changes them, and say which.

## T7 — Colour chips show the French range
- covers: [R2]
- runner: implementer
- allowed files: `src/components/GradePicker.tsx`, `src/components/__tests__/GradePicker.test.tsx`, `src/components/__tests__/QuickLog.test.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/components/__tests__/GradePicker.test.tsx src/components/__tests__/QuickLog.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: "colour chips show the French range" (label is `grade.range`, the Finnish name is not shown, and clicking still calls `onColorGradeChange` with `grade.name`).
- parallel-safe: no
- schema-change: no
- depends-on: [T6]
- notes:
  - Chip `label={grade.range}`; keep `key`, selection and callbacks on `grade.name`. Keep the `swatch-<name>` testid.
  - Don't change `grades.ts`, stored data, the row's "Color: <name>" text or auto-names.
  - Tests that find colour chips by Finnish name switch to the range.

## T8 — Colour ranges everywhere, "7b+ and up"
- covers: [R2, R4, R7]
- runner: implementer
- allowed files: `src/utils/grades.ts`, `src/utils/__tests__/grades.test.ts`, `src/utils/problemDefaults.ts`, `src/utils/__tests__/problemDefaults.test.ts`, `src/components/QuickLog.tsx`, `src/components/__tests__/QuickLog.test.tsx`, `src/components/__tests__/GradePicker.test.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/utils/__tests__/grades.test.ts src/utils/__tests__/problemDefaults.test.ts src/components/__tests__/GradePicker.test.tsx src/components/__tests__/QuickLog.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: `grades.test.ts` › "colorRange maps names to ranges" (known name → range, top colour → "7b+ and up", unknown name → returned unchanged); `QuickLog.test.tsx` › "rows show the colour range"; update `problemDefaults.test.ts` so a colour-only auto-name is `<range> #<n>` and `summarizeLastTime(..., 'Napakka').label` is `'6a+-6b+'`.
- parallel-safe: no
- schema-change: no
- depends-on: [T7]
- notes:
  - In `grades.ts` change the last range to `'7b+ and up'` and export `colorRange(name: string): string` (range, or the name itself when unknown).
  - Stored values and lookups stay on the colour name: `gradeLabel`, `useProblemsAtGrade`, `lastUsedGrades`, the autoName count and the `summarizeLastTime` matching are unchanged. Only displayed text changes.
  - `autoName`: prefix is `colorRange(label)` when `label` isn't a French grade. `summarizeLastTime`: returned `label` is the display text.
  - QuickLog row: `Color: ${colorRange(problem.colorGrade)}`.
  - Don't touch `backup.ts` (exports keep stored names) or already-saved names.
