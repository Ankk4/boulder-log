---
status: done
commitment: spec-anchored
---

# Data trust

## Goal
A climber's logbook lives only in this browser. After this ships, the app asks the browser to keep that data, shows whether it will, lets the climber export a full backup (JSON) or a spreadsheet of problems (CSV) in one tap, and reminds them to back up now and then. Losing data is the top complaint about climbing log apps.

## Context
- Research: `research/README.md` pass-2 Takeaways (conclusion 1, quick win 1), `research/tracking/qol-mobile-interaction-patterns.md` (data trust section), `research/competitors/qol-logging-friction-user-feedback.md`
- Relevant code:
  - `src/utils/csv.ts` (`csvRow`, formula guard)
  - `src/db/index.ts`, `src/db/database.ts` (tables: sessions, problems, attempts, intervalWorkouts, intervalRuns)
  - `src/pages/Session.tsx` (End Session, History mode, check-in)
  - `src/components/PastSessionsList.tsx`
- Run after PR #27 (post-session-review) and `qol-fixes` merge; both change `Session.tsx`.

## Requirements

- **R1** — `requestPersistentStorage()` calls `navigator.storage.persist()` only when `navigator.storage.persisted()` resolves `false`. It resolves `'persisted' | 'denied' | 'unsupported'` and never throws (missing API or rejected promise → `'unsupported'`). The Session page calls it after an End Session write succeeds, and not when the write fails.
  - _Check:_ `src/utils/__tests__/storage.test.ts` › "persists when not yet persisted", "skips persist when already persisted", "unsupported when the API is missing", "unsupported when persist rejects"
  - _Check:_ `src/pages/__tests__/Session.test.tsx` › "requests persistent storage after End Session", "does not request persistent storage when End fails"
- **R2** — The History view shows a "Your data" card above the past sessions. It has a storage line and a last-backup line:
  - persistent → "Stored persistently on this device"
  - not persistent → "The browser may clear this data if storage runs low. Export a backup."
  - unknown → "Storage status unknown"
  - last backup → "Last backup: <local date>" or "Never backed up"
  - _Check:_ `src/components/__tests__/DataCard.test.tsx` › "shows each storage status", "shows the last backup date or never"
- **R3** — "Export backup (JSON)" downloads `matside-backup-YYYY-MM-DD.json` (local date). Its content is `{ format: 'matside-backup', version: 1, exportedAt, sessions, problems, attempts, intervalWorkouts, intervalRuns }`, holding every row of each table as stored.
  - _Check:_ `src/utils/__tests__/backup.test.ts` › "builds a backup with every table", "file name uses the local date"
  - _Check:_ `src/utils/__tests__/exportActions.test.ts` › "JSON export downloads all tables"
  - _Check:_ `manual: npm start → History → Export backup (JSON) → a .json file downloads on Android Chrome and iOS Safari and opens as readable JSON`
- **R4** — "Export problems (CSV)" downloads `matside-problems-YYYY-MM-DD.csv`.
  - Header: `session_start,session_end,problem,french_grade,color_grade,flashed,sent,tries`.
  - One row per problem in the problems table, sorted by session start and then problem `createdAt`.
  - `tries` counts that problem's rows in the attempts table (all types). `flashed`/`sent` are `yes`/`no`.
  - Every cell goes through `csvRow`, so formula injection is guarded.
  - _Check:_ `src/utils/__tests__/backup.test.ts` › "CSV has one row per problem in order", "CSV counts tries from attempts", "CSV guards formula cells"
- **R5** — A successful export (JSON or CSV) records its time under the localStorage key `matside.lastBackupAt`. If localStorage throws, the export still succeeds and nothing crashes. _Check:_ `src/utils/__tests__/exportActions.test.ts` › "records the backup time", "survives a localStorage error"; `src/utils/__tests__/storage.test.ts` › "backup prefs survive a localStorage error"
- **R6** — The check-in screen shows a backup reminder when `shouldRemindBackup` is true and the reminder isn't snoozed. It is true when:
  - never backed up and at least 3 completed sessions, or
  - at least 10 sessions ended after the last backup, or
  - at least 30 days since the last backup and at least 1 session ended after it.

  The reminder has "Export now" (runs the R3 export) and "Later", which snoozes it for 7 days (`matside.backupSnoozeUntil`).
  - _Check:_ `src/utils/__tests__/backup.test.ts` › "shouldRemindBackup" (table of cases, including just below each threshold)
  - _Check:_ `src/components/__tests__/BackupReminder.test.tsx` › "shows when due", "hidden when snoozed", "Later snoozes for 7 days", "Export now exports and hides"
- **R7** — If an export fails (a db read throws), the card or reminder shows "Export failed. Try again." and `lastBackupAt` is not updated. _Check:_ `src/utils/__tests__/exportActions.test.ts` › "failed export does not record a backup", and `src/components/__tests__/DataCard.test.tsx` › "shows an error when export fails"

## Constraints
- No schema change; no Dexie `version()` bump. Reads use plain `toArray()` on each table.
- No new dependencies. Download via `Blob` + `URL.createObjectURL` + a temporary `<a download>`, revoked after the click. The CSP needs no change.
- localStorage only for these two per-device prefs, wrapped in try/catch.
- Components, hooks and constants stay in separate files (`react-refresh/only-export-components`).

## Out of scope
- Import / restore from a backup (a later `data-import` spec, which needs validation and a merge rule).
- Cloud sync, sharing, the Web Share API.
- Changing `db.exportSessionToSheets`.
- Storage usage numbers (`navigator.storage.estimate()`).

## Open questions
Decided in an auto-approved run (2026-11-21):
- The card goes in History for now, where the data is. Home is planned to become an overview page (its own spec, with a Home tab in the bottom nav); the card can move there then.
- `persist()` is asked after End Session because that is a meaningful moment (Firefox may prompt). It is only asked again while the browser hasn't granted it.
- The first reminder comes after 3 sessions, not 1, so a new user isn't nagged on day one.
