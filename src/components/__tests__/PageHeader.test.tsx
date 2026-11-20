import { render, screen } from '@testing-library/react';
import PageHeader from '../PageHeader';

describe('PageHeader', () => {
  it('renders title and action', () => {
    render(<PageHeader title="Session" action={<button>New</button>} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Session' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('renders without an action', () => {
    render(<PageHeader title="Timer" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Timer' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
