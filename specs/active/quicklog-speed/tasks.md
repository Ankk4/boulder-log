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
- allowed files: `src/components/QuickLog.tsx`, `src/components/__tests__/QuickLog.test.tsx`, `src/db/index.ts`, `src/components/DifficultySelect.tsx`
- check: `npx vitest run src/components/__tests__/QuickLog.test.tsx`
- tests to add: the R2, R3, R4, R5 and R7 `QuickLog.test.tsx` cases. Mock `../../db/index` for the history hook.
- parallel-safe: no
- schema-change: no
- depends-on: [T2]
- notes:
  - Add `useProblemsAtGrade(label)` to `src/db/index.ts`: `useLiveQuery` over `db.problems.where('frenchGrade').equals(label)`, or `colorGrade` when no French grade.
  - Remove `autoFocus`. Name passes through `sanitizeProblemName`; an empty result uses `autoName`.
  - Delete `DifficultySelect.tsx` once QuickLog no longer imports it. `src/__tests__/theme-usage.test.ts` keeps working: its DifficultySelect exception just stops matching.

## T4 — Labelled row buttons, one-tap add, sticky add bar
- covers: [R1, R6, R8]
- runner: implementer
- allowed files: `src/components/QuickLog.tsx`, `src/components/__tests__/QuickLog.test.tsx`
- check: `npx vitest run src/components/__tests__/QuickLog.test.tsx src/pages/__tests__/Session.test.tsx`
- tests to add: the R1 and R6 `QuickLog.test.tsx` cases.
- parallel-safe: no
- schema-change: no
- depends-on: [T3]
- notes:
  - Replace the `secondaryAction` layout and the `marginRight: '120px'` hack with name/grade on top and a row of three `Button`s (`minHeight: 48`, `flex: 1`, `gap: 1`). Keep the testids and the disable rules.
  - Sticky bar: `position: { xs: 'sticky', md: 'static' }`, `bottom: 'calc(56px + env(safe-area-inset-bottom))'`, with background from the theme.
  - Session tests use the testids, so the check runs them too.
