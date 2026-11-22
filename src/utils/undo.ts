import type { SessionProblem } from '../types';

export function replaceProblem(
  problems: SessionProblem[],
  problem: SessionProblem,
): SessionProblem[] {
  return problems.map((p) => (p.id === problem.id ? problem : p));
}

export function removeProblem(problems: SessionProblem[], problemId: string): SessionProblem[] {
  return problems.filter((p) => p.id !== problemId);
}
