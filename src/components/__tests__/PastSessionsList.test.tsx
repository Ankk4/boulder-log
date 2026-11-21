import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PastSessionsList from '../PastSessionsList';
const { orderBy } = vi.hoisted(() => ({ orderBy: vi.fn() }));

vi.mock('../../db', () => ({
  db: {
    sessions: {
      orderBy,
    },
    deleteSession: vi.fn(),
  },
}));

describe('PastSessionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs and keeps rendering when loading sessions fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    orderBy.mockImplementation(() => {
      throw new Error('boom');
    });

    render(<PastSessionsList />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error loading sessions:', expect.any(Error));
    });
    expect(screen.queryByText(/Problems:/)).toBeNull();
    errorSpy.mockRestore();
  });
});
