import type { Session } from '../types';

export interface SessionStats {
  problems: number;
  attempts: number;
  flashes: number;
  sends: number;
  /** Whole percent of problems that were a flash or send; 0 for no problems. */
  successRate: number;
}

export function sessionStats(session: Pick<Session, 'problems'>): SessionStats {
  const { problems } = session;
  const succeeded = problems.filter((p) => p.flash || p.send).length;
  return {
    problems: problems.length,
    attempts: problems.reduce((sum, p) => sum + p.attempts.length, 0),
    flashes: problems.filter((p) => p.flash).length,
    sends: problems.filter((p) => p.send).length,
    successRate: problems.length === 0 ? 0 : Math.round((succeeded / problems.length) * 100),
  };
}

/** The ended session with the greatest startTime, or undefined. */
export function latestEndedSession(sessions: Session[]): Session | undefined {
  let latest: Session | undefined;
  for (const session of sessions) {
    if (session.endTime === null) continue;
    if (!latest || new Date(session.startTime).getTime() > new Date(latest.startTime).getTime()) {
      latest = session;
    }
  }
  return latest;
}

/** Format milliseconds as m:ss under an hour, h:mm:ss from an hour. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  if (hours === 0) return `${String(minutes)}:${seconds}`;
  return `${String(hours)}:${String(minutes).padStart(2, '0')}:${seconds}`;
}

/** Drop the goal at `index` from achieved-goal indexes and shift later ones down. */
export function removeGoalAt(achievedGoals: number[], index: number): number[] {
  return achievedGoals.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
}
