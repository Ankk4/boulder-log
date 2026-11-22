import { describe, expect, it } from 'vitest';
import { AttemptType } from '../../types';
import type { Attempt, Session, SessionProblem } from '../../types';
import { backupFileName, buildBackup, buildProblemsCsv, shouldRemindBackup } from '../backup';

function makeSession(id: string, startTime: string, endTime: string | null = null): Session {
  return {
    id,
    startTime,
    endTime,
    preSessionData: {
      sleepQuality: 3,
      energyLevel: 3,
      fingerSoreness: 1,
      motivation: 3,
      restDays: 1,
      nutrition: 'good',
      stress: 'low',
      goals: [],
      additionalNotes: '',
    },
    problems: [],
  };
}

function makeProblem(
  id: string,
  sessionId: string,
  createdAt: string,
  overrides: Partial<SessionProblem> = {},
): SessionProblem {
  return {
    id,
    name: `P-${id}`,
    frenchGrade: '6a',
    colorGrade: 'blue',
    attempts: [],
    sessionId,
    createdAt,
    ...overrides,
  };
}

function makeAttempt(id: string, problemId: string, type: AttemptType): Attempt {
  return { id, problemId, sessionId: 's', timestamp: '2026-01-01T00:00:00.000Z', type };
}

describe('buildBackup', () => {
  it('builds a backup with every table', () => {
    const now = new Date('2026-03-04T10:00:00.000Z');
    const sessions = [makeSession('s1', '2026-03-01T10:00:00.000Z')];
    const problems = [makeProblem('p1', 's1', '2026-03-01T10:05:00.000Z')];
    const attempts = [makeAttempt('a1', 'p1', AttemptType.ATTEMPT)];
    const backup = buildBackup(
      { sessions, problems, attempts, intervalWorkouts: [], intervalRuns: [] },
      now,
    );
    expect(backup).toEqual({
      format: 'matside-backup',
      version: 1,
      exportedAt: '2026-03-04T10:00:00.000Z',
      sessions,
      problems,
      attempts,
      intervalWorkouts: [],
      intervalRuns: [],
    });
  });
});

describe('backupFileName', () => {
  it('file name uses the local date', () => {
    const now = new Date(2026, 0, 5, 23, 30);
    expect(backupFileName('json', now)).toBe('matside-backup-2026-01-05.json');
    expect(backupFileName('csv', now)).toBe('matside-problems-2026-01-05.csv');
  });
});

describe('buildProblemsCsv', () => {
  const header =
    '"session_start","session_end","problem","french_grade","color_grade","flashed","sent","tries"';

  it('CSV has one row per problem in order', () => {
    const sessions = [
      makeSession('late', '2026-02-02T10:00:00.000Z', '2026-02-02T11:00:00.000Z'),
      makeSession('early', '2026-02-01T10:00:00.000Z', '2026-02-01T11:00:00.000Z'),
    ];
    const problems = [
      makeProblem('c', 'late', '2026-02-02T10:01:00.000Z'),
      makeProblem('b', 'early', '2026-02-01T10:09:00.000Z', { flash: true, send: true }),
      makeProblem('a', 'early', '2026-02-01T10:02:00.000Z'),
    ];
    const lines = buildProblemsCsv(sessions, problems, []).split('\n');
    expect(lines[0]).toBe(header);
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('"P-a"');
    expect(lines[2]).toContain('"P-b"');
    expect(lines[2]).toContain('"yes","yes"');
    expect(lines[3]).toContain('"P-c"');
    expect(lines[3]).toContain('"no","no"');
  });

  it('CSV counts tries from attempts', () => {
    const sessions = [makeSession('s', '2026-02-01T10:00:00.000Z', '2026-02-01T11:00:00.000Z')];
    const problems = [makeProblem('p', 's', '2026-02-01T10:01:00.000Z')];
    const attempts = [
      makeAttempt('1', 'p', AttemptType.ATTEMPT),
      makeAttempt('2', 'p', AttemptType.ATTEMPT),
      makeAttempt('3', 'p', AttemptType.SEND),
      makeAttempt('4', 'other', AttemptType.ATTEMPT),
    ];
    const lines = buildProblemsCsv(sessions, problems, attempts).split('\n');
    expect(lines[1]?.endsWith('"3"')).toBe(true);
  });

  it('CSV gives empty session cells when the session is missing', () => {
    const problems = [makeProblem('p', 'gone', '2026-02-01T10:01:00.000Z')];
    const lines = buildProblemsCsv([], problems, []).split('\n');
    expect(lines[1]?.startsWith('"","",')).toBe(true);
    expect(lines[1]?.endsWith('"0"')).toBe(true);
  });

  it('CSV guards formula cells', () => {
    const sessions = [makeSession('s', '2026-02-01T10:00:00.000Z')];
    const problems = [
      makeProblem('p', 's', '2026-02-01T10:01:00.000Z', { name: '=HYPERLINK("x")' }),
    ];
    const csv = buildProblemsCsv(sessions, problems, []);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});

describe('shouldRemindBackup', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');
  const dayMs = 24 * 60 * 60 * 1000;
  const ends = (count: number, baseMs: number): string[] =>
    Array.from({ length: count }, (_, i) => new Date(baseMs + i * 1000).toISOString());

  it.each([
    ['never, 2 sessions', 2, null, false],
    ['never, 3 sessions', 3, null, true],
    ['never, 0 sessions', 0, null, false],
  ])('%s', (_label, count, lastBackupAt, expected) => {
    expect(
      shouldRemindBackup({
        sessionEndTimes: ends(count, now.getTime() - dayMs),
        lastBackupAt,
        now,
      }),
    ).toBe(expected);
  });

  it('9 sessions since a recent backup does not remind, 10 does', () => {
    const last = new Date(now.getTime() - 2 * dayMs).toISOString();
    const after = now.getTime() - dayMs;
    expect(shouldRemindBackup({ sessionEndTimes: ends(9, after), lastBackupAt: last, now })).toBe(
      false,
    );
    expect(shouldRemindBackup({ sessionEndTimes: ends(10, after), lastBackupAt: last, now })).toBe(
      true,
    );
  });

  it('sessions before the last backup are not counted', () => {
    const last = new Date(now.getTime() - 2 * dayMs).toISOString();
    expect(
      shouldRemindBackup({
        sessionEndTimes: ends(12, now.getTime() - 5 * dayMs),
        lastBackupAt: last,
        now,
      }),
    ).toBe(false);
  });

  it('30 days with a session after reminds; 29 days does not; 30 days with none does not', () => {
    const thirty = new Date(now.getTime() - 30 * dayMs).toISOString();
    const twentyNine = new Date(now.getTime() - 29 * dayMs).toISOString();
    const oneAfter = (last: string): string[] => [
      new Date(new Date(last).getTime() + dayMs).toISOString(),
    ];
    expect(
      shouldRemindBackup({ sessionEndTimes: oneAfter(thirty), lastBackupAt: thirty, now }),
    ).toBe(true);
    expect(
      shouldRemindBackup({ sessionEndTimes: oneAfter(twentyNine), lastBackupAt: twentyNine, now }),
    ).toBe(false);
    expect(shouldRemindBackup({ sessionEndTimes: [], lastBackupAt: thirty, now })).toBe(false);
  });

  it('treats an unparseable last backup as never backed up', () => {
    expect(shouldRemindBackup({ sessionEndTimes: ends(3, 0), lastBackupAt: 'nope', now })).toBe(
      true,
    );
  });
});
