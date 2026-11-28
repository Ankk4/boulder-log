import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { ThemeProvider } from '@mui/material';
import Layout from '../Layout';
import { createAppTheme } from '../../theme/theme';
import { useRequestFocusMode } from '../../hooks/useFocusMode';
import { useCurrentSession } from '../../db/index';
import type { Session } from '../../types';

vi.mock('../../db/index', () => ({
  useCurrentSession: vi.fn<typeof useCurrentSession>(),
}));

const activeSession: Session = {
  id: '1',
  startTime: new Date().toISOString(),
  endTime: null,
  preSessionData: { goals: [], additionalNotes: '' },
  problems: [],
};

const Path = () => <div data-testid="path">{useLocation().pathname}</div>;

const Focus = () => {
  useRequestFocusMode(true);
  return <div>focused page</div>;
};

// Like WorkoutRun: local state decides when to request focus mode.
const StatefulFocus = () => {
  const [running, setRunning] = useState(false);
  useRequestFocusMode(running);
  return (
    <button
      type="button"
      onClick={() => {
        setRunning(true);
      }}
    >
      {running ? 'running' : 'start'}
    </button>
  );
};

const renderLayout = (path = '/session', child = <Path />) =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <MemoryRouter initialEntries={[path]}>
        <Layout>{child}</Layout>
      </MemoryRouter>
    </ThemeProvider>,
  );

const originalMatchMedia = window.matchMedia.bind(window);

const mockDesktop = () => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

beforeEach(() => {
  vi.mocked(useCurrentSession).mockReturnValue(null);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('Layout', () => {
  it('renders app name in header', () => {
    const { container } = renderLayout();
    expect(screen.getByRole('heading', { name: 'Matside' })).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('bottom navigation still switches tabs', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('link', { name: /Timer/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/workouts');
    await user.click(screen.getByRole('link', { name: /Session/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/session');
  });

  it('mobile shows bottom nav', () => {
    renderLayout();
    expect(screen.getByRole('link', { name: /Session/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('desktop shows app bar tabs and no bottom nav', () => {
    mockDesktop();
    renderLayout();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Session/ })).not.toBeInTheDocument();
  });

  it('tabs switch routes', async () => {
    mockDesktop();
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('link', { name: /Timer/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/workouts');
    await user.click(screen.getByRole('link', { name: /Session/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/session');
  });

  it('brand links to overview', () => {
    renderLayout('/session');
    const link = screen.getByRole('heading', { name: 'Matside' }).closest('a');
    expect(link).toHaveAttribute('href', '/overview');
  });

  it('focus mode hides app bar and nav', () => {
    renderLayout('/session', <Focus />);
    expect(screen.getByText('focused page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Matside' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Session/ })).not.toBeInTheDocument();
  });

  it('renders one main landmark', () => {
    const { unmount } = renderLayout();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    unmount();
    renderLayout('/session', <Focus />);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Skip to main content' })).not.toBeInTheDocument();
  });

  it('skip link moves focus to main', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  describe.each([
    ['desktop', true],
    ['mobile', false],
  ])('nav items are links with aria-current (%s)', (_name, desktop) => {
    it('nav lists the five destinations in order', () => {
      if (desktop) mockDesktop();
      renderLayout('/overview');
      const links = within(screen.getByRole('navigation', { name: 'Main' })).getAllByRole('link');
      expect(links.map((l) => l.textContent)).toEqual([
        'Overview',
        'Session',
        'History',
        'Timer',
        'Settings',
      ]);
      expect(links.map((l) => l.getAttribute('href'))).toEqual([
        '/overview',
        '/session',
        '/history',
        '/workouts',
        '/settings',
      ]);
    });

    it.each([
      ['/overview', 'Overview'],
      ['/session', 'Session'],
      ['/history', 'History'],
      ['/sessions/abc', 'History'],
      ['/workouts', 'Timer'],
      ['/workouts/abc/run', 'Timer'],
      ['/settings', 'Settings'],
    ])('marks only the active link on %s', (path, active) => {
      if (desktop) mockDesktop();
      renderLayout(path);
      const links = within(screen.getByRole('navigation', { name: 'Main' })).getAllByRole('link');
      const current = links.filter((l) => l.getAttribute('aria-current') === 'page');
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveTextContent(active);
    });

    it('tapping a nav link moves the highlight', async () => {
      if (desktop) mockDesktop();
      const user = userEvent.setup();
      renderLayout('/overview');
      const nav = screen.getByRole('navigation', { name: 'Main' });
      await user.click(within(nav).getByRole('link', { name: /History/ }));
      expect(within(nav).getByRole('link', { name: /History/ })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(within(nav).getByRole('link', { name: /Overview/ })).not.toHaveAttribute(
        'aria-current',
      );
    });
  });

  it('entering focus mode keeps the page mounted and its state', async () => {
    renderLayout('/workouts/1', <StatefulFocus />);
    await userEvent.click(screen.getByRole('button', { name: 'start' }));
    expect(screen.getByRole('button', { name: 'running' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Matside' })).not.toBeInTheDocument();
  });

  it('shows the active session bar on other pages', () => {
    vi.mocked(useCurrentSession).mockReturnValue(activeSession);
    renderLayout('/workouts');
    expect(screen.getByRole('region', { name: 'Active session' })).toBeInTheDocument();
  });

  it('hides the active session bar in focus mode', () => {
    vi.mocked(useCurrentSession).mockReturnValue(activeSession);
    renderLayout('/workouts/1', <Focus />);
    expect(screen.queryByRole('region', { name: 'Active session' })).not.toBeInTheDocument();
  });

  it('highlights History on a session detail page', () => {
    mockDesktop();
    renderLayout('/sessions/abc');
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('aria-current', 'page');
  });
});
