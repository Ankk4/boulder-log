import { describe, it, expect } from 'vitest';
import {
  LIMITS,
  sanitizeGoals,
  sanitizeGrade,
  sanitizeNotes,
  sanitizeNutrition,
  sanitizePostSessionReview,
  sanitizeProblemName,
  sanitizeStress,
  clampNumber,
} from '../validation';

describe('validation helpers', () => {
  it('truncates problem names and grades', () => {
    expect(sanitizeProblemName(`  ${'x'.repeat(LIMITS.problemName + 10)}  `)).toHaveLength(
      LIMITS.problemName,
    );
    expect(sanitizeGrade('  7a+  ')).toBe('7a+');
  });

  it('limits goals count and length', () => {
    const goals = Array.from(
      { length: LIMITS.maxGoals + 5 },
      (_, i) => `goal-${String(i)}-${'y'.repeat(300)}`,
    );
    const sanitized = sanitizeGoals(goals);
    expect(sanitized).toHaveLength(LIMITS.maxGoals);
    expect(sanitized.every((g) => g.length <= LIMITS.goal)).toBe(true);
  });

  it('clamps numbers and coerces enums', () => {
    expect(clampNumber(99, 1, 10)).toBe(10);
    expect(clampNumber(Number.NaN, 1, 10)).toBe(1);
    expect(sanitizeNutrition('good')).toBe('good');
    expect(sanitizeNutrition('weird')).toBe('moderate');
    expect(sanitizeStress('high')).toBe('high');
    expect(sanitizeStress('weird')).toBe('medium');
    expect(sanitizeNotes('n'.repeat(LIMITS.notes + 1))).toHaveLength(LIMITS.notes);
  });
});

describe('sanitizePostSessionReview', () => {
  const base = { rpe: null, energyAfter: null, accomplishments: [], workOn: [], achievedGoals: [] };

  it('clamps and rounds ratings', () => {
    const result = sanitizePostSessionReview({ ...base, rpe: 14, energyAfter: 0.2 }, 0);
    expect(result.rpe).toBe(10);
    expect(result.energyAfter).toBe(1);
    expect(sanitizePostSessionReview({ ...base, rpe: 6.6 }, 0).rpe).toBe(7);
  });

  it('keeps null ratings as null', () => {
    const result = sanitizePostSessionReview(base, 0);
    expect(result.rpe).toBeNull();
    expect(result.energyAfter).toBeNull();
  });

  it('trims, drops empty, truncates and caps both lists', () => {
    const many = Array.from({ length: LIMITS.maxReviewItems + 5 }, (_, i) => `item ${String(i)}`);
    const result = sanitizePostSessionReview(
      {
        ...base,
        accomplishments: ['  sent it  ', '   ', 'x'.repeat(LIMITS.reviewItem + 10)],
        workOn: many,
      },
      0,
    );
    expect(result.accomplishments).toEqual(['sent it', 'x'.repeat(LIMITS.reviewItem)]);
    expect(result.workOn).toHaveLength(LIMITS.maxReviewItems);
  });

  it('drops out-of-range and duplicate achievedGoals', () => {
    const result = sanitizePostSessionReview({ ...base, achievedGoals: [1, 1, 0, 2, -1, 5] }, 3);
    expect(result.achievedGoals).toEqual([1, 0, 2]);
  });
});
