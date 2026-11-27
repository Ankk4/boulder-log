import { describe, it, expect } from 'vitest';
import { formatElapsed, latestEndedSession, sessionStats } from '../sessions';
import type { Session, SessionProblem } from '../../types';

function session(id: string, startTime: string, endTime: string | null): Session {
  return {
    id,
    startTime,
    endTime,
    problems: [],
    preSessionData: {} as Session['preSessionData'],
  };
}

function problem(over: Partial<SessionProblem>): SessionProblem {
  return {
    id: 'p',
    name: 'p',
    frenchGrade: '6a',
    colorGrade: 'red',
    attempts: [],
    sessionId: 's',
    createdAt: '2025-01-01T00:00:00Z',
    ...over,
  };
}

describe('latestEndedSession', () => {
  it('ignores the active session', () => {
    const sessions = [
      session('old', '2025-01-01T10:00:00Z', '2025-01-01T11:00:00Z'),
      session('active', '2025-02-01T10:00:00Z', null),
    ];
    expect(latestEndedSession(sessions)?.id).toBe('old');
  });

  it('picks the latest ended session', () => {
    const sessions = [
      session('a', '2025-01-01T10:00:00Z', '2025-01-01T11:00:00Z'),
      session('c', '2025-03-01T10:00:00Z', '2025-03-01T11:00:00Z'),
      session('b', '2025-02-01T10:00:00Z', '2025-02-01T11:00:00Z'),
    ];
    expect(latestEndedSession(sessions)?.id).toBe('c');
  });

  it('returns undefined for no sessions', () => {
    expect(latestEndedSession([])).toBeUndefined();
  });
});

describe('sessionStats', () => {
  it('counts problems, attempts, flashes, sends and success rate', () => {
    const attempt = { type: 'attempt' } as unknown as SessionProblem['attempts'][number];
    const stats = sessionStats({
      problems: [
        problem({ flash: true, attempts: [attempt] }),
        problem({ send: true, attempts: [attempt, attempt] }),
        problem({ attempts: [attempt] }),
        problem({ attempts: [] }),
      ],
    });
    expect(stats).toEqual({ problems: 4, attempts: 4, flashes: 1, sends: 1, successRate: 50 });
  });

  it('returns a success rate of 0 for no problems', () => {
    expect(sessionStats({ problems: [] })).toEqual({
      problems: 0,
      attempts: 0,
      flashes: 0,
      sends: 0,
      successRate: 0,
    });
  });
});

describe('formatElapsed', () => {
  it('uses m:ss under an hour', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(65_000)).toBe('1:05');
    expect(formatElapsed(3_599_000)).toBe('59:59');
  });

  it('uses h:mm:ss from an hour', () => {
    expect(formatElapsed(3_600_000)).toBe('1:00:00');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
  });
});
