import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import Settings from '../Settings';

vi.mock('../../components/DataCard', () => ({ default: () => <div>DataCard stub</div> }));

describe('Settings', () => {
  it('shows the heading and the data card', () => {
    render(<Settings />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('DataCard stub')).toBeInTheDocument();
  });
});
