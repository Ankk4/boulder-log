import { BoulderLogDatabase } from './database';
import { useLiveQuery } from 'dexie-react-hooks';
import { latestEndedSession } from '../utils/sessions';

export const db = new BoulderLogDatabase();

export function useCurrentSession() {
  return useLiveQuery(() => db.getCurrentSession());
}

export function useLatestEndedSession() {
  return useLiveQuery(async () => {
    const sessions = await db.sessions.toArray();
    return latestEndedSession(sessions) ?? null;
  });
}

export function useIntervalWorkouts() {
  return useLiveQuery(() => db.getAllIntervalWorkouts());
}

export function useIntervalWorkout(id: string | undefined) {
  return useLiveQuery(async () => {
    if (!id) return null;
    const workout = await db.getIntervalWorkout(id);
    return workout ?? null;
  }, [id]);
}

export function useRecentIntervalRuns(limit = 20) {
  return useLiveQuery(() => db.getRecentIntervalRuns(limit), [limit]);
}

export function useProblemsAtGrade(label: string) {
  return useLiveQuery(async () => {
    if (!label) return [];
    const french = await db.problems.where('frenchGrade').equals(label).toArray();
    if (french.length > 0) return french;
    return db.problems.where('colorGrade').equals(label).toArray();
  }, [label]);
}
