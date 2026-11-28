import { render, screen, act, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ActiveSessionBar from '../ActiveSessionBar';
import { useCurrentSession } from '../../db/index';
import type { Session, SessionProblem } from '../../types';

vi.mock('../../db/index', () => ({
  useCurrentSession: vi.fn<typeof useCurrentSession>(),
}));

const START = new Date('2026-01-01T10:00:00Z');

const problem = (over: Partial<SessionProblem>): SessionProblem => ({
  id: 'p',
  name: 'P',
  frenchGrade: '6a',
  colorGrade: 'Red',
  sessionId: '1',
  flash: false,
  send: false,
  attempts: [],
  createdAt: START.toISOString(),
  ...over,
});

const session: Session = {
  id: '1',
  startTime: START.toISOString(),
  endTime: null,
  preSessionData: { goals: [], additionalNotes: '' },
  problems: [],
};

const Path = () => {
  const l = useLocation();
  return <div data-testid="path">{l.pathname}</div>;
};

const renderBar = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ActiveSessionBar />
      <Path />
    </MemoryRouter>,
  );

describe('ActiveSessionBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(START.getTime() + 65_000));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing while loading', () => {
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
    renderBar();
    expect(screen.queryByRole('region', { name: 'Active session' })).not.toBeInTheDocument();
  });

  it('renders nothing without an active session', () => {
    vi.mocked(useCurrentSession).mockReturnValue(null);
    renderBar();
    expect(screen.queryByRole('region', { name: 'Active session' })).not.toBeInTheDocument();
  });

  it('shows elapsed time and counts', () => {
    vi.mocked(useCurrentSession).mockReturnValue({
      ...session,
      problems: [problem({ send: true }), problem({ id: 'q' })],
    });
    renderBar();
    const bar = screen.getByRole('region', { name: 'Active session' });
    expect(bar).toHaveTextContent('1:05');
    expect(bar).toHaveTextContent('2 problems');
    expect(bar).toHaveTextContent('1 send');
    expect(bar).not.toHaveTextContent('attempts');
  });

  it('names the button from its content and pluralises counts', () => {
    vi.mocked(useCurrentSession).mockReturnValue({
      ...session,
      problems: [
        problem({
          flash: true,
          send: true,
          attempts: [{ id: 'a' } as SessionProblem['attempts'][number]],
        }),
      ],
    });
    renderBar('/session');
    const region = screen.getByRole('region', { name: 'Active session' });
    const button = within(region).getByRole('button');
    expect(button).toHaveAccessibleName(
      /Open session.*1:05.*1 problem\b.*1 send\b.*1 attempt\b.*1 flash\b/,
    );
  });

  it('ticks every second', () => {
    vi.mocked(useCurrentSession).mockReturnValue(session);
    renderBar();
    expect(screen.getByRole('region', { name: 'Active session' })).toHaveTextContent('1:05');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('region', { name: 'Active session' })).toHaveTextContent('1:08');
  });

  it('opens the session on tap', () => {
    vi.mocked(useCurrentSession).mockReturnValue(session);
    renderBar('/workouts');
    const region = screen.getByRole('region', { name: 'Active session' });
    fireEvent.click(within(region).getByRole('button', { name: /Open session/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/session');
  });

  it('shows attempts and flashes on the session page', () => {
    vi.mocked(useCurrentSession).mockReturnValue(session);
    renderBar('/session');
    const bar = screen.getByRole('region', { name: 'Active session' });
    expect(bar).toHaveTextContent('0 attempts');
    expect(bar).toHaveTextContent('0 flashes');
  });

  it('omits attempts and flashes in history view', () => {
    vi.mocked(useCurrentSession).mockReturnValue(session);
    renderBar('/history');
    expect(screen.getByRole('region', { name: 'Active session' })).not.toHaveTextContent(
      'attempts',
    );
  });
});
