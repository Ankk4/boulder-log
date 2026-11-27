import type { SessionProblem } from '../types';
import { colorRange, frenchGrades } from './grades';

type GradeFields = Pick<SessionProblem, 'frenchGrade' | 'colorGrade'>;

export interface LastTimeSummary {
  label: string;
  date: string;
  count: number;
  sent: number;
  flashed: number;
}

/** French grade if set, else colour name, else empty. */
export const gradeLabel = (p: GradeFields): string => p.frenchGrade || p.colorGrade || '';

/** Grades of the newest problem by createdAt, or null when there are none. */
export const lastUsedGrades = (
  problems: SessionProblem[],
): { frenchGrade: string; colorGrade: string } | null => {
  let newest: SessionProblem | null = null;
  for (const p of problems) {
    if (!newest || p.createdAt > newest.createdAt) newest = p;
  }
  return newest ? { frenchGrade: newest.frenchGrade, colorGrade: newest.colorGrade } : null;
};

/** `<label> #<n>` where n is 1 + the number of problems with the same label. */
export const autoName = (problems: SessionProblem[], label: string): string => {
  const same = problems.filter((p) => gradeLabel(p) === label).length;
  const shown = frenchGrades.includes(label) ? label : colorRange(label);
  return `${shown} #${String(same + 1)}`;
};

/** Summary of the most recent earlier session's problems at this label, or null. */
export const summarizeLastTime = (
  problems: SessionProblem[],
  currentSessionId: string,
  label: string,
): LastTimeSummary | null => {
  const isFrench = frenchGrades.includes(label);
  const matches = problems.filter(
    (p) =>
      p.sessionId !== currentSessionId &&
      (isFrench ? p.frenchGrade === label : p.colorGrade === label),
  );
  let latest: SessionProblem | null = null;
  for (const p of matches) {
    if (!latest || p.createdAt > latest.createdAt) latest = p;
  }
  if (!latest) return null;
  const latestSessionId = latest.sessionId;
  const latestCreatedAt = latest.createdAt;

  const group = matches.filter((p) => p.sessionId === latestSessionId);
  return {
    label: isFrench ? label : colorRange(label),
    date: new Date(latestCreatedAt).toLocaleDateString(),
    count: group.length,
    sent: group.filter((p) => p.send || p.flash).length,
    flashed: group.filter((p) => p.flash).length,
  };
};
