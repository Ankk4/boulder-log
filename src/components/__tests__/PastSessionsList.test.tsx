import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
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

const SessionDetailStub = () => {
  const { id } = useParams();
  return <div>detail {id}</div>;
};

const mockSessions = (sessions: Session[]) => {
  orderBy.mockReturnValue({
    reverse: () => ({ toArray: () => Promise.resolve(sessions) }),
  } as unknown as ReturnType<typeof db.sessions.orderBy>);
};

const renderList = () =>
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<PastSessionsList />} />
        <Route path="/sessions/:id" element={<SessionDetailStub />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PastSessionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('omits the active session', async () => {
    mockSessions([
      makeSession({ id: 'active', endTime: null, startTime: '2024-02-02T10:00:00.000Z' }),
      makeSession({ id: 'done', endTime: '2024-01-01T11:00:00.000Z' }),
    ]);

    renderList();

    expect(
      await screen.findByText(new Date('2024-01-01T10:00:00.000Z').toLocaleDateString()),
    ).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'delete' })).toHaveLength(1);
  });

  it('row shows the summary', async () => {
    mockSessions([
      makeSession({
        endTime: '2024-01-01T11:00:00.000Z',
        duration: 75,
        problems: [
          { id: 'p1', flash: false, send: true, attempts: [] },
          { id: 'p2', flash: false, send: false, attempts: [] },
        ] as unknown as Session['problems'],
        postSessionReview: {
          rpe: 7,
          energyAfter: null,
          accomplishments: [],
          workOn: [],
          achievedGoals: [],
        },
      }),
    ]);

    renderList();

    expect(await screen.findByText('1h 15m · 2 problems · 1 send · RPE 7')).toBeTruthy();
  });

  it('row uses the singular for one problem', async () => {
    mockSessions([
      makeSession({
        endTime: '2024-01-01T11:00:00.000Z',
        duration: 30,
        problems: [
          { id: 'p1', flash: false, send: true, attempts: [] },
        ] as unknown as Session['problems'],
      }),
    ]);

    renderList();

    expect(await screen.findByText('30 minutes · 1 problem · 1 send')).toBeTruthy();
  });

  it('row omits RPE when not set', async () => {
    mockSessions([makeSession({ endTime: '2024-01-01T11:00:00.000Z', duration: 30 })]);

    renderList();

    expect(await screen.findByText('30 minutes · 0 problems · 0 sends')).toBeTruthy();
  });

  it('row opens the session page', async () => {
    mockSessions([makeSession({ id: 'abc', endTime: '2024-01-01T11:00:00.000Z' })]);

    renderList();

    fireEvent.click(await screen.findByText(/0 problems/));
    expect(await screen.findByText('detail abc')).toBeTruthy();
  });

  it('logs and keeps rendering when loading sessions fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    orderBy.mockImplementation(() => {
      throw new Error('boom');
    });

    renderList();

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error loading sessions:', expect.any(Error));
    });
    expect(screen.queryByText(/problems/)).toBeNull();
    errorSpy.mockRestore();
  });
});
