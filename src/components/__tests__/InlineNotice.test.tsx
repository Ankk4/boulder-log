import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import InlineNotice from '../InlineNotice';

describe('InlineNotice', () => {
  it('info uses status role', () => {
    render(<InlineNotice message="Attempt logged" severity="info" />);
    expect(screen.getByRole('status')).toHaveTextContent('Attempt logged');
  });

  it('error uses alert role', () => {
    render(<InlineNotice message="Couldn't save. Try again." severity="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save. Try again.");
  });

  it('renders Undo only with onUndo', () => {
    const { rerender } = render(<InlineNotice message="m" severity="info" />);
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    rerender(
      <InlineNotice
        message="m"
        severity="info"
        onUndo={() => {
          /* noop */
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('Undo calls onUndo', () => {
    const onUndo = vi.fn<() => void>();
    render(<InlineNotice message="m" severity="info" onUndo={onUndo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
