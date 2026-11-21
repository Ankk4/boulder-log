import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PastSessionsList from '../PastSessionsList';
import type { db } from '../../db';
import type { Session } from '../../types';
const { orderBy } = vi.hoisted(() => ({ orderBy: vi.fn<typeof db.sessions.orderBy>() }));

vi.mock('../../db', () => ({
  db: {
    sessions: {
      orderBy,
    },
    deleteSession: vi.fn<typeof db.deleteSession>(),
  },
}));

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 's1',
  startTime: '2024-01-01T10:00:00.000Z',
  preSessionData: {
    sleepQuality: 3,
    energyLevel: 5,
    fingerSoreness: 1,
    motivation: 3,
    restDays: 1,
    nutrition: 'good',
    stress: 'low',
    goals: ['Send blue', 'Warm up well'],
    additionalNotes: '',
  },
  problems: [],
  ...overrides,
});

const mockSessions = (sessions: Session[]) => {
  orderBy.mockReturnValue({
    reverse: () => ({ toArray: () => Promise.resolve(sessions) }),
  } as unknown as ReturnType<typeof db.sessions.orderBy>);
};

describe('PastSessionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows each review line for a session with a full review', async () => {
    mockSessions([
      makeSession({
        postSessionReview: {
          rpe: 7,
          energyAfter: 3,
          accomplishments: ['Flashed a V3', 'Good warm-up'],
          workOn: ['Heel hooks'],
          achievedGoals: [1],
        },
      }),
    ]);

    render(<PastSessionsList />);

    expect(await screen.findByText('RPE: 7')).toBeTruthy();
    expect(screen.getByText('Energy: 5 → 3')).toBeTruthy();
    expect(screen.getByText('Goals achieved: 1/2')).toBeTruthy();
    expect(screen.getByText('Accomplished: Flashed a V3, Good warm-up')).toBeTruthy();
    expect(screen.getByText('Work on: Heel hooks')).toBeTruthy();
  });

  it('omits RPE, energy and list lines for null ratings and empty lists', async () => {
    mockSessions([
      makeSession({
        postSessionReview: {
          rpe: null,
          energyAfter: null,
          accomplishments: [],
          workOn: [],
          achievedGoals: [],
        },
      }),
    ]);

    render(<PastSessionsList />);

    expect(await screen.findByText('Problems: 0')).toBeTruthy();
    expect(screen.queryByText(/RPE:/)).toBeNull();
    expect(screen.queryByText(/Energy:/)).toBeNull();
    expect(screen.queryByText(/Accomplished:/)).toBeNull();
    expect(screen.queryByText(/Work on:/)).toBeNull();
  });

  it('renders no review lines for a session without a review', async () => {
    mockSessions([makeSession()]);

    render(<PastSessionsList />);

    expect(await screen.findByText('Problems: 0')).toBeTruthy();
    expect(screen.queryByText(/RPE:/)).toBeNull();
    expect(screen.queryByText(/Energy:/)).toBeNull();
    expect(screen.queryByText(/Goals achieved:/)).toBeNull();
    expect(screen.queryByText(/Accomplished:/)).toBeNull();
    expect(screen.queryByText(/Work on:/)).toBeNull();
  });

  it('logs and keeps rendering when loading sessions fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    orderBy.mockImplementation(() => {
      throw new Error('boom');
    });

    render(<PastSessionsList />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error loading sessions:', expect.any(Error));
    });
    expect(screen.queryByText(/Problems:/)).toBeNull();
    errorSpy.mockRestore();
  });
});
