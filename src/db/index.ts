import { BoulderLogDatabase } from './database';
import { useLiveQuery } from 'dexie-react-hooks';

export const db = new BoulderLogDatabase();

export function useCurrentSession() {
  return useLiveQuery(() => db.getCurrentSession());
}

export function useSessionWithDetails(sessionId: string | undefined) {
  return useLiveQuery(
    () => (sessionId ? db.getSessionWithDetails(sessionId) : undefined),
    [sessionId]
  );
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

export { BoulderLogDatabase }; 