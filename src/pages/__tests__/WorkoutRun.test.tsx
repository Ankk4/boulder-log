import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import WorkoutRun from '../WorkoutRun';
import type { IntervalWorkout } from '../../types';
import type { db } from '../../db/index';
import { unlockAudio } from '../../utils/beep';

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

vi.mock('../../db/index', () => ({
  db: {
    addIntervalRun: vi.fn<typeof db.addIntervalRun>(),
    saveIntervalWorkout: vi.fn<typeof db.saveIntervalWorkout>(),
  },
  useIntervalWorkout: vi.fn(() => workout),
}));

vi.mock('../../utils/beep', async () => {
  const actual = await vi.importActual<typeof import('../../utils/beep')>('../../utils/beep');
  return {
    ...actual,
    unlockAudio: vi.fn(),
    playBeep: vi.fn(() => Promise.resolve()),
  };
});

describe('WorkoutRun page error handling', () => {
  let errorSpy: MockInstance<typeof console.error>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('stays idle and logs when unlockAudio rejects', async () => {
    const failure = new Error('audio blocked');
    vi.mocked(unlockAudio).mockRejectedValue(failure);
    render(
      <MemoryRouter initialEntries={['/workouts/w1/run']}>
        <Routes>
          <Route path="/workouts/:id/run" element={<WorkoutRun />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error unlocking audio:', failure);
    });
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();
  });
});
