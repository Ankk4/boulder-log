import { db } from '../db/index';
import { backupFileName, buildBackup, buildProblemsCsv } from './backup';
import { downloadFile } from './download';
import { setLastBackupAt } from './storage';

export async function exportJsonBackup(): Promise<boolean> {
  try {
    const [sessions, problems, attempts, intervalWorkouts, intervalRuns] = await Promise.all([
      db.sessions.toArray(),
      db.problems.toArray(),
      db.attempts.toArray(),
      db.intervalWorkouts.toArray(),
      db.intervalRuns.toArray(),
    ]);
    const now = new Date();
    const backup = buildBackup(
      { sessions, problems, attempts, intervalWorkouts, intervalRuns },
      now,
    );
    downloadFile(backupFileName('json', now), 'application/json', JSON.stringify(backup, null, 2));
    setLastBackupAt(now.toISOString());
    return true;
  } catch {
    return false;
  }
}

export async function exportProblemsCsv(): Promise<boolean> {
  try {
    const [sessions, problems, attempts] = await Promise.all([
      db.sessions.toArray(),
      db.problems.toArray(),
      db.attempts.toArray(),
    ]);
    const now = new Date();
    downloadFile(
      backupFileName('csv', now),
      'text/csv',
      buildProblemsCsv(sessions, problems, attempts),
    );
    setLastBackupAt(now.toISOString());
    return true;
  } catch {
    return false;
  }
}
