import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SessionDetail from '../SessionDetail';
import { useSessionById } from '../../db/index';
import { AttemptType, type Session } from '../../types';

vi.mock('../../db/index', () => ({
  useSessionById: vi.fn<typeof useSessionById>(),
}));

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 's1',
  startTime: '2024-01-15T10:00:00.000Z',
  endTime: '2024-01-15T11:00:00.000Z',
  duration: 60,
  preSessionData: {
    sleepQuality: 7,
    goals: ['Send a V4', 'Warm up well'],
    additionalNotes: '',
  },
  problems: [
    {
      id: 'p1',
      name: 'Blue slab',
      frenchGrade: '6A',
      colorGrade: '',
      attempts: [
        {
          id: 'a1',
          problemId: 'p1',
          sessionId: 's1',
          timestamp: '2024-01-15T10:05:00.000Z',
          type: AttemptType.ATTEMPT,
        },
      ],
      send: true,
      sessionId: 's1',
      createdAt: '2024-01-15T10:05:00.000Z',
    },
  ],
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/sessions/s1']}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionDetail />} />
      </Routes>
    </MemoryRouter>,
  );

const renderAt = (entries: string[], initialIndex: number) =>
  render(
    <MemoryRouter initialEntries={entries} initialIndex={initialIndex}>
      <Routes>
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/history" element={<div>History marker</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('SessionDetail', () => {
  beforeEach(() => {
    vi.mocked(useSessionById).mockReset();
  });

  it('renders nothing while loading', () => {
    vi.mocked(useSessionById).mockReturnValue(undefined);
    const { container } = renderPage();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the session', () => {
    vi.mocked(useSessionById).mockReturnValue(
      makeSession({
        postSessionReview: {
          rpe: 6,
          energyAfter: 4,
          accomplishments: [],
          workOn: [],
          achievedGoals: [0],
        },
        postSessionNotes: 'Felt strong',
      }),
    );
    renderPage();
    expect(screen.getByText('Sleep: 7')).toBeInTheDocument();
    expect(screen.getByText(/Send a V4/)).toHaveTextContent('(achieved)');
    expect(screen.getByText(/Warm up well/)).not.toHaveTextContent('(achieved)');
    expect(screen.getByText('Blue slab · 6A')).toBeInTheDocument();
    expect(screen.getByText('1 attempt · Send')).toBeInTheDocument();
    expect(screen.getByText('Felt strong')).toBeInTheDocument();
    expect(screen.getByText('Sends: 1')).toBeInTheDocument();
  });

  it('shows a dash for unrecorded check-in values', () => {
    vi.mocked(useSessionById).mockReturnValue(makeSession());
    renderPage();
    expect(screen.getByText('Energy: —')).toBeInTheDocument();
    expect(screen.getByText('Stress: —')).toBeInTheDocument();
  });

  it('shows each review line for a full review', () => {
    vi.mocked(useSessionById).mockReturnValue(
      makeSession({
        postSessionReview: {
          rpe: 8,
          energyAfter: 3,
          accomplishments: ['Flashed a 6B'],
          workOn: ['Heel hooks'],
          achievedGoals: [0],
        },
      }),
    );
    renderPage();
    expect(screen.getByText('RPE: 8')).toBeInTheDocument();
    expect(screen.getByText('Energy: — → 3')).toBeInTheDocument();
    expect(screen.getByText('Goals achieved: 1/2')).toBeInTheDocument();
    expect(screen.getByText('Accomplished: Flashed a 6B')).toBeInTheDocument();
    expect(screen.getByText('Work on: Heel hooks')).toBeInTheDocument();
  });

  it('omits empty review lines', () => {
    vi.mocked(useSessionById).mockReturnValue(
      makeSession({
        preSessionData: { goals: [], additionalNotes: '' },
        postSessionReview: {
          rpe: null,
          energyAfter: null,
          accomplishments: [],
          workOn: [],
          achievedGoals: [],
        },
      }),
    );
    renderPage();
    expect(screen.queryByText(/RPE:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Energy: .*→/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Goals achieved/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Accomplished/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Work on/)).not.toBeInTheDocument();
  });

  it('shows not found for an unknown id', () => {
    vi.mocked(useSessionById).mockReturnValue(null);
    renderPage();
    expect(screen.getByText('Session not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to history' })).toHaveAttribute(
      'href',
      '/history',
    );
  });

  it('goes back in history when opened from the app', () => {
    vi.mocked(useSessionById).mockReturnValue(makeSession());
    renderAt(['/history', '/sessions/s1'], 1);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('History marker')).toBeInTheDocument();
  });

  it('replaces with history when opened directly', () => {
    vi.mocked(useSessionById).mockReturnValue(makeSession());
    renderAt(['/sessions/s1'], 0);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('History marker')).toBeInTheDocument();
  });

  it('shows Flash for a problem that is both flash and send', () => {
    const base = makeSession();
    vi.mocked(useSessionById).mockReturnValue(
      makeSession({ problems: base.problems.map((p) => ({ ...p, flash: true, send: true })) }),
    );
    renderPage();
    expect(screen.getByText('1 attempt · Flash')).toBeInTheDocument();
  });

  it('shows the date and time', () => {
    vi.mocked(useSessionById).mockReturnValue(makeSession());
    renderPage();
    const start = new Date('2024-01-15T10:00:00.000Z');
    expect(
      screen.getByText(`${start.toLocaleDateString()} ${start.toLocaleTimeString()}`),
    ).toBeInTheDocument();
  });
});
