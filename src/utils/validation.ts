import type { PostSessionReview } from '../types';

export const LIMITS = {
  problemName: 200,
  grade: 50,
  goal: 200,
  maxGoals: 20,
  notes: 5000,
  postSessionNotes: 5000,
  reviewItem: 200,
  maxReviewItems: 20,
} as const;

function truncate(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}

export function sanitizeProblemName(name: string): string {
  return truncate(name.trim(), LIMITS.problemName);
}

export function sanitizeGrade(grade: string): string {
  return truncate(grade.trim(), LIMITS.grade);
}

export function sanitizeNotes(notes: string, maxLength = LIMITS.notes): string {
  return truncate(notes, maxLength);
}

export function sanitizeGoals(goals: string[]): string[] {
  return goals
    .map((goal) => truncate(goal.trim(), LIMITS.goal))
    .filter(Boolean)
    .slice(0, LIMITS.maxGoals);
}

export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function sanitizeRating(value: number | null): number | null {
  if (value === null) return null;
  return clampNumber(Math.round(value), 1, 10);
}

function sanitizeReviewItems(items: string[]): string[] {
  return items
    .map((item) => truncate(item.trim(), LIMITS.reviewItem))
    .filter(Boolean)
    .slice(0, LIMITS.maxReviewItems);
}

export function sanitizePostSessionReview(
  review: PostSessionReview,
  goalCount: number,
): PostSessionReview {
  const achieved = review.achievedGoals.filter(
    (index) => Number.isInteger(index) && index >= 0 && index < goalCount,
  );
  return {
    rpe: sanitizeRating(review.rpe),
    energyAfter: sanitizeRating(review.energyAfter),
    accomplishments: sanitizeReviewItems(review.accomplishments),
    workOn: sanitizeReviewItems(review.workOn),
    achievedGoals: [...new Set(achieved)],
  };
}

const NUTRITION_VALUES = ['poor', 'moderate', 'good'] as const;
const STRESS_VALUES = ['low', 'medium', 'high'] as const;

export function sanitizeNutrition(value: string): (typeof NUTRITION_VALUES)[number] {
  return (NUTRITION_VALUES as readonly string[]).includes(value)
    ? (value as (typeof NUTRITION_VALUES)[number])
    : 'moderate';
}

export function sanitizeStress(value: string): (typeof STRESS_VALUES)[number] {
  return (STRESS_VALUES as readonly string[]).includes(value)
    ? (value as (typeof STRESS_VALUES)[number])
    : 'medium';
}
