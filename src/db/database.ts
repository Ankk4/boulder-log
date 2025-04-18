import Dexie, { type Table } from 'dexie';
import type { Session, SessionProblem, Attempt, PreSessionData } from '../types';

export class BoulderLogDatabase extends Dexie {
  sessions!: Table<Session>;
  problems!: Table<SessionProblem>;
  attempts!: Table<Attempt>;

  constructor() {
    super('boulderLog');
    
    this.version(1).stores({
      sessions: 'id, startTime, endTime',
      problems: 'id, sessionId, name, frenchGrade, colorGrade, flash, send, createdAt',
      attempts: 'id, problemId, sessionId, timestamp, type'
    });
  }

  async getCurrentSession(): Promise<Session | undefined> {
    // Find sessions that don't have an endTime (i.e., active sessions)
    const activeSessions = await this.sessions
      .filter(session => session.endTime === null)
      .toArray();
    
    // Return the most recent active session if any exist
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
      problems
    };
  }

  async exportSessionToSheets(sessionId: string): Promise<string> {
    const session = await this.getSessionWithDetails(sessionId);
    if (!session) throw new Error('Session not found');

    // TODO: Implement Google Sheets export
    // For now, return CSV format
    const rows: string[] = [];

    // Session info
    rows.push('Session Details');
    rows.push(`Start Time,${session.startTime}`);
    rows.push(`End Time,${session.endTime || ''}`);
    rows.push(`Duration (minutes),${session.duration || ''}`);
    
    // Pre-session data
    rows.push('\nPre-session Data');
    Object.entries(session.preSessionData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        rows.push(`${key},${value.join('; ')}`);
      } else {
        rows.push(`${key},${value}`);
      }
    });

    // Problems
    rows.push('\nProblems');
    rows.push('Name,French Grade,Color Grade,Flash,Send,Attempts');
    session.problems.forEach(problem => {
      rows.push([
        problem.name,
        problem.frenchGrade,
        problem.colorGrade,
        problem.flash ? 'Yes' : 'No',
        problem.send ? 'Yes' : 'No',
        problem.attempts.length
      ].join(','));
    });

    // Attempts detail
    rows.push('\nAttempts');
    rows.push('Problem Name,Type,Timestamp');
    for (const problem of session.problems) {
      problem.attempts.forEach(attempt => {
        rows.push([
          problem.name,
          attempt.type,
          attempt.timestamp
        ].join(','));
      });
    }

    return rows.join('\n');
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.transaction('rw', [this.sessions, this.problems, this.attempts], async () => {
      await this.attempts
        .where('sessionId')
        .equals(sessionId)
        .delete();
      
      await this.problems
        .where('sessionId')
        .equals(sessionId)
        .delete();
      
      await this.sessions
        .where('id')
        .equals(sessionId)
        .delete();
    });
  }
} 