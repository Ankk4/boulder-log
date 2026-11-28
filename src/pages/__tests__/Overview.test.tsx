import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Overview from '../Overview';
import { useCurrentSession } from '../../db/index';
import type { Session } from '../../types';

vi.mock('../../db/index', () => ({
  useCurrentSession: vi.fn<typeof useCurrentSession>(),
}));

const Path = () => <div data-testid="path">{useLocation().pathname}</div>;

const activeSession: Session = {
  id: 's1',
  startTime: new Date().toISOString(),
  endTime: null,
  preSessionData: {
    sleepQuality: 5,
    energyLevel: 5,
    fingerSoreness: 5,
    motivation: 5,
    restDays: 1,
    nutrition: 'moderate',
    stress: 'medium',
    goals: [],
    additionalNotes: '',
  },
  problems: [],
};

const renderOverview = () =>
  render(
    <MemoryRouter initialEntries={['/overview']}>
      <Overview />
      <Path />
    </MemoryRouter>,
  );

describe('Overview', () => {
  beforeEach(() => {
    vi.mocked(useCurrentSession).mockReturnValue(null);
  });

  it('shows Start session without an active session', () => {
    renderOverview();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start session' })).toHaveAttribute('href', '/session');
    expect(screen.queryByRole('link', { name: 'Resume session' })).not.toBeInTheDocument();
  });

  it('shows Resume session with an active session', () => {
    vi.mocked(useCurrentSession).mockReturnValue(activeSession);
    renderOverview();
    expect(screen.getByRole('link', { name: 'Resume session' })).toHaveAttribute(
      'href',
      '/session',
    );
    expect(screen.queryByRole('link', { name: 'Start session' })).not.toBeInTheDocument();
  });

  it('renders no session card while loading', () => {
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
    renderOverview();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });

  it('Start session goes to the session page', async () => {
    renderOverview();
    await userEvent.click(screen.getByRole('link', { name: 'Start session' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/session');
  });

  it('shows the placeholder sections', () => {
    renderOverview();
    for (const name of ['Calendar', 'Streak', 'Quick stats']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
    expect(screen.getAllByText('Coming soon')).toHaveLength(3);
  });
});
