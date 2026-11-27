import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import Workouts from '../Workouts';
import type { IntervalWorkout, IntervalRun } from '../../types';
import type { db } from '../../db/index';
import { useRecentIntervalRuns } from '../../db';

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

const run: IntervalRun = {
  id: 'r',
  workoutId: 'w1',
  workoutName: 'Tabata',
  workSeconds: 20,
  restSeconds: 10,
  intervals: 8,
  completedIntervals: 8,
  status: 'completed',
  startedAt: '2024-01-02T00:00:00.000Z',
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

    fireEvent.click(screen.getByLabelText('Edit Tabata'));
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error saving workout:', failure);
    });
    expect(saveIntervalWorkout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save. Try again.");
  });

  it('closes the form dialog when a save retry succeeds', async () => {
    saveIntervalWorkout.mockRejectedValueOnce(new Error('save failed'));
    saveIntervalWorkout.mockResolvedValueOnce('w1');
    renderPage();

    fireEvent.click(screen.getByLabelText('Edit Tabata'));
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });
    expect(saveIntervalWorkout).toHaveBeenCalledTimes(2);
  });

  it('keeps the delete confirmation open and logs when deleting rejects', async () => {
    const failure = new Error('delete failed');
    deleteIntervalWorkout.mockRejectedValue(failure);
    renderPage();

    fireEvent.click(screen.getByLabelText('Delete Tabata'));
    expect(await screen.findByText('Delete workout?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error deleting workout:', failure);
    });
    expect(deleteIntervalWorkout).toHaveBeenCalledWith('w1');
    expect(screen.getByText('Delete workout?')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't delete. Try again.");
  });

  it('closes the delete confirmation when a retry succeeds', async () => {
    deleteIntervalWorkout.mockRejectedValueOnce(new Error('delete failed'));
    deleteIntervalWorkout.mockResolvedValueOnce(undefined);
    renderPage();

    fireEvent.click(screen.getByLabelText('Delete Tabata'));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('Delete workout?')).not.toBeInTheDocument();
    });
    expect(deleteIntervalWorkout).toHaveBeenCalledTimes(2);
  });

  it('section headings are level 3', () => {
    renderPage();
    for (const name of ['Presets', 'Workouts', 'Recent runs']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
  });

  it('row actions are named after the workout', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Start Tabata' })).toHaveAttribute(
      'href',
      '/workouts/w1/run',
    );
    expect(screen.getByRole('button', { name: 'Edit Tabata' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Tabata' })).toBeInTheDocument();
  });

  it('run status is capitalised', () => {
    vi.mocked(useRecentIntervalRuns).mockReturnValueOnce([
      { ...run, id: 'r1', status: 'completed' },
      { ...run, id: 'r2', status: 'aborted' },
    ]);
    renderPage();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Aborted')).toBeInTheDocument();
  });
});
