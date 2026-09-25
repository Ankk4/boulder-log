import Dexie, { type Table } from 'dexie';
import type {
  Session,
  SessionProblem,
  Attempt,
  IntervalWorkout,
  IntervalRun,
} from '../types';

export class BoulderLogDatabase extends Dexie {
  sessions!: Table<Session>;
  problems!: Table<SessionProblem>;
  attempts!: Table<Attempt>;
  intervalWorkouts!: Table<IntervalWorkout>;
  intervalRuns!: Table<IntervalRun>;

  constructor() {
    super('boulderLog');

    this.version(1).stores({
      sessions: 'id, startTime, endTime',
      problems: 'id, sessionId, name, frenchGrade, colorGrade, flash, send, createdAt',
      attempts: 'id, problemId, sessionId, timestamp, type',
    });

    this.version(2).stores({
      sessions: 'id, startTime, endTime',
      problems: 'id, sessionId, name, frenchGrade, colorGrade, flash, send, createdAt',
      attempts: 'id, problemId, sessionId, timestamp, type',
      intervalWorkouts: 'id, name, updatedAt',
      intervalRuns: 'id, workoutId, startedAt, status',
    });
  }

  async getCurrentSession(): Promise<Session | undefined> {
    const activeSessions = await this.sessions
      .filter((session) => session.endTime === null)
      .toArray();

    return activeSessions.length > 0 ? activeSessions[0] : undefined;
  }

  async getSessionWithDetails(sessionId: string): Promise<Session | undefined> {
    const session = await this.sessions.get(sessionId);
    if (!session) return undefined;

    const problems = await this.problems
      .where('sessionId')
      .equals(sessionId)
      .toArray();

    for (const problem of problems) {
      problem.attempts = await this.attempts
        .where('problemId')
        .equals(problem.id)
        .toArray();
    }

    return {
      ...session,
      problems,
    };
  }

  async exportSessionToSheets(sessionId: string): Promise<string> {
    const session = await this.getSessionWithDetails(sessionId);
    if (!session) throw new Error('Session not found');

    const rows: string[] = [];

    rows.push('Session Details');
    rows.push(`Start Time,${session.startTime}`);
    rows.push(`End Time,${session.endTime || ''}`);
    rows.push(`Duration (minutes),${session.duration || ''}`);

    rows.push('\nPre-session Data');
    Object.entries(session.preSessionData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        rows.push(`${key},${value.join('; ')}`);
      } else {
        rows.push(`${key},${value}`);
      }
    });

    rows.push('\nProblems');
    rows.push('Name,French Grade,Color Grade,Flash,Send,Attempts');
    session.problems.forEach((problem) => {
      rows.push(
        [
          problem.name,
          problem.frenchGrade,
          problem.colorGrade,
          problem.flash ? 'Yes' : 'No',
          problem.send ? 'Yes' : 'No',
          problem.attempts.length,
        ].join(',')
      );
    });

    rows.push('\nAttempts');
    rows.push('Problem Name,Type,Timestamp');
    for (const problem of session.problems) {
      problem.attempts.forEach((attempt) => {
        rows.push([problem.name, attempt.type, attempt.timestamp].join(','));
      });
    }

    return rows.join('\n');
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.transaction('rw', [this.sessions, this.problems, this.attempts], async () => {
      await this.attempts.where('sessionId').equals(sessionId).delete();
      await this.problems.where('sessionId').equals(sessionId).delete();
      await this.sessions.where('id').equals(sessionId).delete();
    });
  }

  async getIntervalWorkout(id: string): Promise<IntervalWorkout | undefined> {
    return this.intervalWorkouts.get(id);
  }

  async getAllIntervalWorkouts(): Promise<IntervalWorkout[]> {
    return this.intervalWorkouts.orderBy('updatedAt').reverse().toArray();
  }

  async saveIntervalWorkout(
    workout: Omit<IntervalWorkout, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: string;
    }
  ): Promise<string> {
    const now = new Date().toISOString();
    if (workout.id) {
      await this.intervalWorkouts.put({
        ...workout,
        id: workout.id,
        createdAt: workout.createdAt ?? now,
        updatedAt: now,
      });
      return workout.id;
    }

    const id = Date.now().toString();
    await this.intervalWorkouts.add({
      ...workout,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  async deleteIntervalWorkout(id: string): Promise<void> {
    await this.intervalWorkouts.delete(id);
  }

  async addIntervalRun(run: IntervalRun): Promise<string> {
    await this.intervalRuns.add(run);
    return run.id;
  }

  async getRecentIntervalRuns(limit = 20): Promise<IntervalRun[]> {
    return this.intervalRuns.orderBy('startedAt').reverse().limit(limit).toArray();
  }
}
