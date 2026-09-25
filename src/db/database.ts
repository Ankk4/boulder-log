import Dexie, { type Table } from 'dexie';
import type { Session, SessionProblem, Attempt } from '../types';
import { csvRow } from '../utils/csv';

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
    // For now, return CSV format with formula-safe escaping
    const rows: string[] = [];

    rows.push(csvRow(['Session Details']));
    rows.push(csvRow(['Start Time', session.startTime]));
    rows.push(csvRow(['End Time', session.endTime || '']));
    rows.push(csvRow(['Duration (minutes)', session.duration ?? '']));
    
    rows.push(csvRow(['Pre-session Data']));
    Object.entries(session.preSessionData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        rows.push(csvRow([key, value.join('; ')]));
      } else {
        rows.push(csvRow([key, value]));
      }
    });

    rows.push(csvRow(['Problems']));
    rows.push(csvRow(['Name', 'French Grade', 'Color Grade', 'Flash', 'Send', 'Attempts']));
    session.problems.forEach(problem => {
      rows.push(csvRow([
        problem.name,
        problem.frenchGrade,
        problem.colorGrade,
        problem.flash ? 'Yes' : 'No',
        problem.send ? 'Yes' : 'No',
        problem.attempts.length
      ]));
    });

    rows.push(csvRow(['Attempts']));
    rows.push(csvRow(['Problem Name', 'Type', 'Timestamp']));
    for (const problem of session.problems) {
      problem.attempts.forEach(attempt => {
        rows.push(csvRow([
          problem.name,
          attempt.type,
          attempt.timestamp
        ]));
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
