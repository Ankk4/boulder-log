import { describe, it, expect } from 'vitest';
import type { SessionProblem } from '../../types';
import { autoName, gradeLabel, lastUsedGrades, summarizeLastTime } from '../problemDefaults';

const make = (over: Partial<SessionProblem>): SessionProblem => ({
  id: 'p',
  name: 'n',
  frenchGrade: '',
  colorGrade: '',
  attempts: [],
  sessionId: 's1',
  createdAt: '2026-01-01T10:00:00.000Z',
  ...over,
});

describe('gradeLabel', () => {
  it('prefers French over colour', () => {
    expect(gradeLabel({ frenchGrade: '6a', colorGrade: 'Helppo' })).toBe('6a');
  });
  it('falls back to colour', () => {
    expect(gradeLabel({ frenchGrade: '', colorGrade: 'Helppo' })).toBe('Helppo');
  });
  it('is empty when neither is set', () => {
    expect(gradeLabel({ frenchGrade: '', colorGrade: '' })).toBe('');
  });
});

describe('lastUsedGrades', () => {
  it('picks the newest problem', () => {
    const problems = [
      make({ frenchGrade: '5', createdAt: '2026-01-01T10:00:00.000Z' }),
      make({ frenchGrade: '6a', colorGrade: 'Leppoisa', createdAt: '2026-01-01T11:00:00.000Z' }),
      make({ frenchGrade: '4', createdAt: '2026-01-01T09:00:00.000Z' }),
    ];
    expect(lastUsedGrades(problems)).toEqual({ frenchGrade: '6a', colorGrade: 'Leppoisa' });
  });
  it('returns null for no problems', () => {
    expect(lastUsedGrades([])).toBeNull();
  });
});

describe('autoName', () => {
  it('numbers per label', () => {
    const problems = [
      make({ frenchGrade: '6a' }),
      make({ frenchGrade: '6a' }),
      make({ frenchGrade: '5' }),
    ];
    expect(autoName(problems, '6a')).toBe('6a #3');
    expect(autoName(problems, '5')).toBe('5 #2');
    expect(autoName(problems, '7a')).toBe('7a #1');
  });
});

describe('summarizeLastTime', () => {
  it('groups the latest earlier session', () => {
    const problems = [
      make({
        sessionId: 'old',
        frenchGrade: '6a',
        send: true,
        createdAt: '2026-01-01T10:00:00.000Z',
      }),
      make({
        sessionId: 'new',
        frenchGrade: '6a',
        send: true,
        flash: true,
        createdAt: '2026-02-01T10:00:00.000Z',
      }),
      make({ sessionId: 'new', frenchGrade: '6a', createdAt: '2026-02-01T10:05:00.000Z' }),
      make({
        sessionId: 'new',
        frenchGrade: '5',
        send: true,
        createdAt: '2026-02-01T10:06:00.000Z',
      }),
      make({
        sessionId: 'cur',
        frenchGrade: '6a',
        send: true,
        createdAt: '2026-03-01T10:00:00.000Z',
      }),
    ];
    const result = summarizeLastTime(problems, 'cur', '6a');
    expect(result).toEqual({
      label: '6a',
      date: new Date('2026-02-01T10:05:00.000Z').toLocaleDateString(),
      count: 2,
      sent: 1,
      flashed: 1,
    });
  });

  it('matches colour on problems that also have a French grade', () => {
    const problems = [
      make({
        sessionId: 'old',
        frenchGrade: '6a',
        colorGrade: 'Napakka',
        send: true,
        createdAt: '2026-01-01T10:00:00.000Z',
      }),
    ];
    const result = summarizeLastTime(problems, 'cur', 'Napakka');
    expect(result).toMatchObject({ label: 'Napakka', count: 1, sent: 1, flashed: 0 });
  });

  it('a flash counts as sent', () => {
    const problems = [
      make({
        sessionId: 'old',
        frenchGrade: '6a',
        flash: true,
        createdAt: '2026-01-01T10:00:00.000Z',
      }),
    ];
    expect(summarizeLastTime(problems, 'cur', '6a')).toMatchObject({ sent: 1, flashed: 1 });
  });

  it('is null without history', () => {
    const problems = [make({ sessionId: 'cur', frenchGrade: '6a' })];
    expect(summarizeLastTime(problems, 'cur', '6a')).toBeNull();
    expect(summarizeLastTime([], 'cur', '6a')).toBeNull();
  });
});
