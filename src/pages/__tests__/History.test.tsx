import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import History from '../History';

vi.mock('../../components/PastSessionsList', () => ({
  default: () => <div>PastSessionsList stub</div>,
}));
vi.mock('../../components/DataCard', () => ({ default: () => <div>DataCard stub</div> }));

describe('History', () => {
  it('shows the heading and past sessions', () => {
    render(<History />);
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByText('PastSessionsList stub')).toBeInTheDocument();
  });

  it('has no back button', () => {
    render(<History />);
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('does not show the data card', () => {
    render(<History />);
    expect(screen.queryByText('DataCard stub')).not.toBeInTheDocument();
  });
});
