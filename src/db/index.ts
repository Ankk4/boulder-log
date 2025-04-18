import { BoulderLogDatabase } from './database';
import { useLiveQuery } from 'dexie-react-hooks';

export const db = new BoulderLogDatabase();

export function useCurrentSession() {
  return useLiveQuery(() => db.getCurrentSession());
}

export function useSessionWithDetails(sessionId: string | undefined) {
  return useLiveQuery(
    () => sessionId ? db.getSessionWithDetails(sessionId) : undefined,
    [sessionId]
  );
}

export { BoulderLogDatabase }; 