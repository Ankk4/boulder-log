# Tasks: Data trust

Rules for splitting:
- One task = one implementer run = one commit. Aim for ≤ 3 source files plus tests.
- Every requirement in `spec.md` appears in at least one task's `covers`.
- `parallel-safe: yes` only if the task's allowed files overlap no other open task, it has no unmet `depends-on`, and `schema-change: no`.
- Notes cite R-IDs and don't restate requirements; if a note and `spec.md` conflict, the requirement wins.
- The `check` is the narrowest thing that proves the task, e.g. `npx vitest run src/utils/__tests__/grades.test.ts`.
- `runner: planner` (default `implementer`) when any allowed file matches `protectedForImplementer` in `.claude/hooks/scope-guard.mjs`. The orchestrator does those tasks itself; they are never parallel-safe. If one edits `.claude/`, expect a permission prompt and say so in its notes.

## T1 — Storage utilities
- covers: [R1, R2, R5]
- runner: implementer
- allowed files: `src/utils/storage.ts`, `src/utils/__tests__/storage.test.ts`
- check: `npx vitest run src/utils/__tests__/storage.test.ts`
- tests to add: the R1 storage tests; `getStorageStatus()` returning `'persistent' | 'best-effort' | 'unknown'`; and get/set for `lastBackupAt` and `backupSnoozeUntil` (ISO strings), including "backup prefs survive a localStorage error".
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes: Stub `navigator.storage` with `vi.stubGlobal` or `Object.defineProperty` per test, since jsdom has none. Getters return `null` on any throw; setters swallow errors.

## T2 — Backup and CSV builders, reminder rule
- covers: [R3, R4, R6]
- runner: implementer
- allowed files: `src/utils/backup.ts`, `src/utils/__tests__/backup.test.ts`
- check: `npx vitest run src/utils/__tests__/backup.test.ts`
- tests to add: the R3, R4 and R6 `backup.test.ts` cases.
- parallel-safe: yes
- schema-change: no
- depends-on: []
- notes:
  - Pure functions only, with no db and no DOM: `buildBackup(tables, now)`, `buildProblemsCsv(sessions, problems, attempts)`, `backupFileName(kind, now)` and `shouldRemindBackup({ sessionEndTimes, lastBackupAt, now })`.
  - Reuse `csvRow` from `src/utils/csv.ts`.
  - Use `Session`, `SessionProblem` and the other types from `src/types`.
  - A session with no matching row gives empty start/end cells.

## T3 — Export actions and download helper
- covers: [R3, R4, R5, R7]
- runner: implementer
- allowed files: `src/utils/exportActions.ts`, `src/utils/download.ts`, `src/utils/__tests__/exportActions.test.ts`
- check: `npx vitest run src/utils/__tests__/exportActions.test.ts`
- tests to add: the R3, R5 and R7 `exportActions.test.ts` cases. Mock `../../db/index` and `../download`.
- parallel-safe: no
- schema-change: no
- depends-on: [T1, T2]
- notes:
  - `exportJsonBackup()` and `exportProblemsCsv()` read the tables via `db.<table>.toArray()`, build with T2, download, then call T1's `setLastBackupAt`. They resolve `true`/`false` and never throw.
  - `downloadFile(name, mime, text)` lives in `download.ts`. jsdom lacks `URL.createObjectURL`, so its own behaviour is a manual check (R3).

## T4 — "Your data" card and backup reminder
- covers: [R2, R6, R7]
- runner: implementer
- allowed files: `src/components/DataCard.tsx`, `src/components/BackupReminder.tsx`, `src/components/__tests__/DataCard.test.tsx`, `src/components/__tests__/BackupReminder.test.tsx`
- check: `npx vitest run src/components/__tests__/DataCard.test.tsx src/components/__tests__/BackupReminder.test.tsx`
- tests to add: the R2, R6 and R7 component cases. Mock `../../utils/exportActions` and `../../utils/storage`.
- parallel-safe: no
- schema-change: no
- depends-on: [T3]
- notes: BackupReminder gets completed sessions' end times via `useLiveQuery` on `db.sessions`, filtered to a non-null `endTime`. Mock `dexie-react-hooks` or `../../db/index` in its test. Use MUI `Alert` for the reminder and `Paper` for the card, and keep colour literals out (`src/__tests__/theme-usage.test.ts`).

## T5 — Wire into the Session page
- covers: [R1, R2, R6]
- runner: implementer
- allowed files: `src/pages/Session.tsx`, `src/pages/__tests__/Session.test.tsx`
- check: `npx vitest run src/pages/__tests__/Session.test.tsx`
- tests to add: the two R1 Session tests (mock `../../utils/storage`). Also: History mode renders "Your data", and the check-in renders the reminder slot (mock the two components).
- parallel-safe: no
- schema-change: no
- depends-on: [T4]
- notes: Call `void requestPersistentStorage()` only after `db.sessions.put` in End succeeds. In History mode, render `DataCard` above `PastSessionsList`. In the check-in, render `BackupReminder` above the form.
