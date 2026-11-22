import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { ThemeProvider } from '@mui/material';
import Home from '../Home';
import { createAppTheme } from '../../theme/theme';

const Path = () => <div data-testid="path">{useLocation().pathname}</div>;

const renderHome = () =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <MemoryRouter initialEntries={['/']}>
        <Home />
        <Path />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('Home', () => {
  it('renders heading, description and actions', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: 'Matside' })).toBeInTheDocument();
    expect(screen.getByText(/stays on this device/)).toBeInTheDocument();
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start session' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Interval timer' })).toBeInTheDocument();
  });

  it('renders actions that navigate', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Start session' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/session');
  });

  it('navigates to workouts', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'Interval timer' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/workouts');
  });
});
