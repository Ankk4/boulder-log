import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn<(to: unknown, options?: unknown) => unknown>();

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
}));

import { useAppNavigate } from '../useAppNavigate';

describe('useAppNavigate', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.restoreAllMocks();
  });

  it('forwards the path and options to navigate', () => {
    const { result } = renderHook(() => useAppNavigate());
    result.current('/workouts', { replace: true });
    expect(navigateMock).toHaveBeenCalledWith('/workouts', { replace: true });
  });

  it('logs a rejected navigation instead of leaving it unhandled', async () => {
    const error = new Error('nav failed');
    navigateMock.mockReturnValue(Promise.reject(error));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useAppNavigate());
    result.current('/session');
    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalledWith(error);
    });
  });
});
