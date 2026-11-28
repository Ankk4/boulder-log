import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import type {
  db,
  useCurrentSession,
  useIntervalWorkouts,
  useLatestEndedSession,
  useProblemsAtGrade,
  useRecentIntervalRuns,
} from '../db/index';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    sessions: {
      orderBy: vi.fn<typeof db.sessions.orderBy>().mockReturnThis(),
      reverse: vi.fn<typeof db.sessions.reverse>().mockReturnThis(),
      toArray: vi.fn<typeof db.sessions.toArray>().mockResolvedValue([]),
    },
  },
}));

vi.mock('../db/index', () => ({
  db: mockDb,
  useCurrentSession: vi.fn<typeof useCurrentSession>().mockReturnValue(null),
  useLatestEndedSession: vi.fn<typeof useLatestEndedSession>().mockReturnValue(null),
  useProblemsAtGrade: vi.fn<typeof useProblemsAtGrade>().mockReturnValue([]),
  useIntervalWorkouts: vi.fn<typeof useIntervalWorkouts>().mockReturnValue([]),
  useRecentIntervalRuns: vi.fn<typeof useRecentIntervalRuns>().mockReturnValue([]),
}));

vi.mock('../components/DataCard', () => ({ default: () => <div>DataCard stub</div> }));
vi.mock('../components/PastSessionsList', () => ({
  default: () => <div>PastSessionsList stub</div>,
}));
vi.mock('../components/BackupReminder', () => ({
  default: () => <div>BackupReminder stub</div>,
}));

describe('App routes', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it.each([
    ['/overview', 'Overview'],
    ['/history', 'History'],
    ['/settings', 'Settings'],
    ['/session', 'New session'],
    ['/workouts', 'Interval timer'],
  ])('routes %s to its page', (path, heading) => {
    window.history.pushState({}, '', path);
    render(<App />);
    expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
    expect(window.location.pathname).toBe(path);
  });

  it('redirects / to /overview', () => {
    render(<App />);
    expect(window.location.pathname).toBe('/overview');
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
  });

  it('redirects unknown paths to /overview', () => {
    window.history.pushState({}, '', '/nowhere');
    render(<App />);
    expect(window.location.pathname).toBe('/overview');
  });
});
