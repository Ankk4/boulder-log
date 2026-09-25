import { describe, it, expect } from 'vitest';
import {
  LIMITS,
  sanitizeGoals,
  sanitizeGrade,
  sanitizeNotes,
  sanitizeNutrition,
  sanitizeProblemName,
  sanitizeStress,
  clampNumber,
} from '../validation';

describe('validation helpers', () => {
  it('truncates problem names and grades', () => {
    expect(sanitizeProblemName(`  ${'x'.repeat(LIMITS.problemName + 10)}  `)).toHaveLength(
      LIMITS.problemName
    );
    expect(sanitizeGrade('  7a+  ')).toBe('7a+');
  });

  it('limits goals count and length', () => {
    const goals = Array.from({ length: LIMITS.maxGoals + 5 }, (_, i) => `goal-${i}-${'y'.repeat(300)}`);
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
