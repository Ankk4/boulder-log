import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import Layout from '../Layout';
import { createAppTheme } from '../../theme/theme';

const Path = () => <div data-testid="path">{useLocation().pathname}</div>;

const renderLayout = () =>
  render(
    <ThemeProvider theme={createAppTheme('light')}>
      <MemoryRouter initialEntries={['/session']}>
        <Layout>
          <Path />
        </Layout>
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('Layout', () => {
  it('renders app name in header', () => {
    const { container } = renderLayout();
    expect(screen.getByRole('heading', { name: 'Matside' })).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('bottom navigation still switches tabs', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByText('Timer'));
    expect(screen.getByTestId('path')).toHaveTextContent('/workouts');
    await user.click(screen.getByText('Session'));
    expect(screen.getByTestId('path')).toHaveTextContent('/session');
  });
});
