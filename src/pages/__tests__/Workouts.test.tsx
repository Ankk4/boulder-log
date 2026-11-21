import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import Workouts from '../Workouts';
import type { IntervalWorkout } from '../../types';
import type { db } from '../../db/index';

const workout: IntervalWorkout = {
  id: 'w1',
  name: 'Tabata',
  workSeconds: 20,
  restSeconds: 10,
  intervals: 8,
  muted: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const { saveIntervalWorkout, deleteIntervalWorkout } = vi.hoisted(() => ({
  saveIntervalWorkout: vi.fn<typeof db.saveIntervalWorkout>(),
  deleteIntervalWorkout: vi.fn<typeof db.deleteIntervalWorkout>(),
}));

vi.mock('../../db/index', () => ({
  db: { saveIntervalWorkout, deleteIntervalWorkout },
  useIntervalWorkouts: vi.fn(() => [workout]),
  useRecentIntervalRuns: vi.fn(() => []),
}));

describe('Workouts page error handling', () => {
  let errorSpy: MockInstance<typeof console.error>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <Workouts />
      </MemoryRouter>,
    );

  it('keeps the form dialog open and logs when saving rejects', async () => {
    const failure = new Error('save failed');
    saveIntervalWorkout.mockRejectedValue(failure);
    renderPage();

    fireEvent.click(screen.getByLabelText('edit'));
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error saving workout:', failure);
    });
    expect(saveIntervalWorkout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('keeps the delete confirmation open and logs when deleting rejects', async () => {
    const failure = new Error('delete failed');
    deleteIntervalWorkout.mockRejectedValue(failure);
    renderPage();

    fireEvent.click(screen.getByLabelText('delete'));
    expect(await screen.findByText('Delete workout?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error deleting workout:', failure);
    });
    expect(deleteIntervalWorkout).toHaveBeenCalledWith('w1');
    expect(screen.getByText('Delete workout?')).toBeInTheDocument();
  });
});
