import type { Attempt, IntervalRun, IntervalWorkout, Session, SessionProblem } from '../types';
import { csvRow } from './csv';

export interface BackupTables {
  sessions: Session[];
  problems: SessionProblem[];
  attempts: Attempt[];
  intervalWorkouts: IntervalWorkout[];
  intervalRuns: IntervalRun[];
}

export interface Backup extends BackupTables {
  format: 'matside-backup';
  version: 1;
  exportedAt: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function buildBackup(tables: BackupTables, now: Date): Backup {
  return {
    format: 'matside-backup',
    version: 1,
    exportedAt: now.toISOString(),
    sessions: tables.sessions,
    problems: tables.problems,
    attempts: tables.attempts,
    intervalWorkouts: tables.intervalWorkouts,
    intervalRuns: tables.intervalRuns,
  };
}

function localDate(now: Date): string {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function backupFileName(kind: 'json' | 'csv', now: Date): string {
  return kind === 'json'
    ? `matside-backup-${localDate(now)}.json`
    : `matside-problems-${localDate(now)}.csv`;
}

export function buildProblemsCsv(
  sessions: Session[],
  problems: SessionProblem[],
  attempts: Attempt[],
): string {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const triesByProblem = new Map<string, number>();
  for (const attempt of attempts) {
    triesByProblem.set(attempt.problemId, (triesByProblem.get(attempt.problemId) ?? 0) + 1);
  }

  const sortKey = (problem: SessionProblem): string =>
    sessionById.get(problem.sessionId)?.startTime ?? '';
  const sorted = [...problems].sort((a, b) => {
    const bySession = sortKey(a).localeCompare(sortKey(b));
    return bySession !== 0 ? bySession : a.createdAt.localeCompare(b.createdAt);
  });

  const lines = [
    csvRow([
      'session_start',
      'session_end',
      'problem',
      'french_grade',
      'color_grade',
      'flashed',
      'sent',
      'tries',
    ]),
  ];
  for (const problem of sorted) {
    const session = sessionById.get(problem.sessionId);
    lines.push(
      csvRow([
        session?.startTime ?? '',
        session?.endTime ?? '',
        problem.name,
        problem.frenchGrade,
        problem.colorGrade,
        problem.flash ? 'yes' : 'no',
        problem.send ? 'yes' : 'no',
        triesByProblem.get(problem.id) ?? 0,
      ]),
    );
  }
  return lines.join('\n');
}

export function shouldRemindBackup({
  sessionEndTimes,
  lastBackupAt,
  now,
}: {
  sessionEndTimes: string[];
  lastBackupAt: string | null;
  now: Date;
}): boolean {
  if (lastBackupAt === null) {
    return sessionEndTimes.length >= 3;
  }
  const lastBackupMs = new Date(lastBackupAt).getTime();
  if (Number.isNaN(lastBackupMs)) {
    return sessionEndTimes.length >= 3;
  }
  const sessionsSince = sessionEndTimes.filter(
    (endTime) => new Date(endTime).getTime() > lastBackupMs,
  ).length;
  if (sessionsSince >= 10) return true;
  return now.getTime() - lastBackupMs >= 30 * MS_PER_DAY && sessionsSince >= 1;
}
