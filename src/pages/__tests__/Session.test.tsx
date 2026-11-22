import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Session from '../Session';
import { Session as SessionType, SessionProblem, AttemptType } from '../../types';
import { useCurrentSession } from '../../db/index';
import type { db } from '../../db/index';
import type { WhereClause } from 'dexie';
import { requestPersistentStorage } from '../../utils/storage';

// Mock database functions
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    sessions: {
      add: vi.fn<typeof db.sessions.add>(),
      put: vi.fn<typeof db.sessions.put>(),
      update: vi.fn<typeof db.sessions.update>(),
      get: vi.fn<typeof db.sessions.get>(),
      orderBy: vi.fn<typeof db.sessions.orderBy>().mockReturnThis(),
      reverse: vi.fn<typeof db.sessions.reverse>().mockReturnThis(),
      toArray: vi.fn<typeof db.sessions.toArray>().mockResolvedValue([]),
    },
    problems: {
      add: vi.fn<typeof db.problems.add>(),
      get: vi.fn<typeof db.problems.get>(),
      put: vi.fn<typeof db.problems.put>(),
      delete: vi.fn<typeof db.problems.delete>(),
    },
    attempts: {
      add: vi.fn<typeof db.attempts.add>(),
      delete: vi.fn<typeof db.attempts.delete>(),
      where: vi.fn<typeof db.attempts.where>().mockReturnThis(),
      equals: vi.fn<WhereClause['equals']>().mockReturnThis(),
      toArray: vi.fn<typeof db.attempts.toArray>().mockResolvedValue([]),
    },
    deleteSession: vi.fn<typeof db.deleteSession>(),
  },
}));

vi.mock('../../db/index', () => ({
  db: mockDb,
  useCurrentSession: vi.fn(),
}));

vi.mock('../../utils/storage', () => ({
  requestPersistentStorage: vi.fn<typeof requestPersistentStorage>().mockResolvedValue('persisted'),
}));

vi.mock('../../components/DataCard', () => ({ default: () => <div>DataCard stub</div> }));
vi.mock('../../components/BackupReminder', () => ({
  default: () => <div>BackupReminder stub</div>,
}));

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div>{children}</div> : null,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe('Session Page', () => {
  const mockSession: SessionType = {
    id: '1',
    startTime: new Date().toISOString(),
    endTime: null,
    preSessionData: {
      sleepQuality: 5,
      energyLevel: 5,
      fingerSoreness: 5,
      motivation: 5,
      restDays: 1,
      nutrition: 'moderate',
      stress: 'medium',
      goals: [],
      additionalNotes: '',
    },
    problems: [],
  };

  const mockProblem: SessionProblem = {
    id: '1',
    name: 'Test Problem',
    frenchGrade: '6a',
    colorGrade: 'Red',
    sessionId: '1',
    flash: false,
    send: false,
    attempts: [],
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pre-session form when no active session exists', () => {
    vi.mocked(useCurrentSession).mockReturnValue(null);
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );
    expect(screen.getByText(/pre-session check-in/i)).toBeInTheDocument();
  });

  it('renders no check-in while the current session is loading', () => {
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/pre-session check-in/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /end session/i })).not.toBeInTheDocument();
  });

  it('starts a new session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(null);
    mockDb.sessions.add.mockResolvedValue('1');

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/start session/i));

    await waitFor(() => {
      expect(mockDb.sessions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(String) as string,
          endTime: null,
        }),
      );
    });
  });

  it('adds a problem to current session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    mockDb.problems.add.mockResolvedValue('2');

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/add problem/i));

    const nameInput = screen.getByLabelText(/problem name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Problem' } });

    const [frenchGradeSelect] = screen.getAllByRole('combobox');
    expect(frenchGradeSelect).toBeDefined();
    if (!frenchGradeSelect) return;
    fireEvent.mouseDown(frenchGradeSelect);
    fireEvent.click(await screen.findByRole('option', { name: '6a' }));

    const addButton = screen.getByRole('button', { name: /^add$/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockDb.problems.add).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: '1',
          name: 'Test Problem',
          frenchGrade: '6a',
          id: expect.any(String) as string,
        }),
      );
    });
  });

  it('adds an attempt to a problem', async () => {
    vi.mocked(useCurrentSession).mockReturnValue({
      ...mockSession,
      problems: [mockProblem],
    });
    mockDb.attempts.add.mockResolvedValue('3');
    mockDb.problems.get.mockResolvedValue(mockProblem);
    mockDb.problems.put.mockResolvedValue(1);
    mockDb.attempts.toArray.mockResolvedValue([
      {
        id: 'a1',
        problemId: '1',
        sessionId: '1',
        timestamp: new Date().toISOString(),
        type: AttemptType.ATTEMPT,
      },
    ]);

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    const attemptButton = screen.getByTestId('attempt-button');
    fireEvent.click(attemptButton);

    await waitFor(() => {
      expect(mockDb.attempts.add).toHaveBeenCalledWith(
        expect.objectContaining({
          problemId: '1',
          type: AttemptType.ATTEMPT,
          id: expect.any(String) as string,
        }),
      );
    });
  });

  it('marks a problem as flashed', async () => {
    vi.mocked(useCurrentSession).mockReturnValue({
      ...mockSession,
      problems: [mockProblem],
    });
    mockDb.problems.get.mockResolvedValue(mockProblem);
    mockDb.problems.put.mockResolvedValue(1);
    mockDb.attempts.toArray.mockResolvedValue([
      {
        id: 'a1',
        problemId: '1',
        sessionId: '1',
        timestamp: new Date().toISOString(),
        type: AttemptType.FLASH,
      },
    ]);

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    const flashButton = screen.getByTestId('flash-button');
    fireEvent.click(flashButton);

    await waitFor(() => {
      expect(mockDb.problems.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          flash: true,
          send: false,
        }),
      );
    });
  });

  it.each([
    ['send', { send: true }],
    ['flash', { flash: true }],
  ] as const)('keeps %s sticky when another attempt is logged', async (_name, status) => {
    const problem: SessionProblem = { ...mockProblem, ...status };
    vi.mocked(useCurrentSession).mockReturnValue({ ...mockSession, problems: [problem] });
    mockDb.problems.get.mockResolvedValue(problem);
    mockDb.problems.put.mockResolvedValue(1);
    mockDb.attempts.add.mockResolvedValue('a2');
    mockDb.sessions.put.mockResolvedValue(1);
    mockDb.attempts.toArray.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('attempt-button'));

    await waitFor(() => {
      expect(mockDb.problems.put).toHaveBeenCalledWith(expect.objectContaining(status));
    });
  });

  const ui = () => (
    <MemoryRouter>
      <Session />
    </MemoryRouter>
  );

  const defaultPre = {
    sleepQuality: 5,
    energyLevel: 5,
    fingerSoreness: 5,
    motivation: 5,
    restDays: 1,
    nutrition: 'moderate',
    stress: 'medium',
    goals: [],
    additionalNotes: '',
  };

  const addGoal = (text: string) => {
    const input = screen.getByPlaceholderText(/add a goal/i);
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter' });
  };

  it('resets check-in and notes for the next session after ending one', async () => {
    mockDb.sessions.add.mockResolvedValue('1');
    mockDb.sessions.put.mockResolvedValue(1);
    vi.mocked(useCurrentSession).mockReturnValue(null);
    const { rerender } = render(ui());

    addGoal('Send the red');
    fireEvent.click(screen.getByText(/start session/i));
    await waitFor(() => {
      expect(mockDb.sessions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          preSessionData: expect.objectContaining({ goals: ['Send the red'] }) as unknown,
        }),
      );
    });

    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    rerender(ui());
    fireEvent.change(screen.getByLabelText(/post-session notes/i), {
      target: { value: 'Felt strong' },
    });
    fireEvent.click(screen.getByText(/end session/i));
    await waitFor(() => {
      expect(mockDb.sessions.put).toHaveBeenCalled();
    });

    mockDb.sessions.add.mockClear();
    vi.mocked(useCurrentSession).mockReturnValue(null);
    rerender(ui());
    fireEvent.click(screen.getByText(/start session/i));
    await waitFor(() => {
      expect(mockDb.sessions.add).toHaveBeenCalledWith(
        expect.objectContaining({ preSessionData: defaultPre }),
      );
    });

    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    rerender(ui());
    expect(screen.getByLabelText(/post-session notes/i)).toHaveValue('');
  });

  it('saves the form defaults after switching to History and back', async () => {
    mockDb.sessions.add.mockResolvedValue('1');
    vi.mocked(useCurrentSession).mockReturnValue(null);
    render(ui());

    addGoal('Stale goal');
    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    fireEvent.click(screen.getByRole('button', { name: /climb/i }));
    fireEvent.click(screen.getByText(/start session/i));

    await waitFor(() => {
      expect(mockDb.sessions.add).toHaveBeenCalledWith(
        expect.objectContaining({ preSessionData: defaultPre }),
      );
    });
  });

  it('ends current session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    mockDb.sessions.put.mockResolvedValue(1);

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/end session/i));

    await waitFor(() => {
      expect(mockDb.sessions.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockSession,
          endTime: expect.any(String) as string,
        }),
      );
    });
  });

  it('requests persistent storage after End Session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    mockDb.sessions.put.mockResolvedValue(1);
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText(/end session/i));
    await waitFor(() => {
      expect(requestPersistentStorage).toHaveBeenCalledTimes(1);
    });
  });

  it('does not request persistent storage when End fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    mockDb.sessions.put.mockRejectedValue(new Error('boom'));
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText(/end session/i));
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error ending session:', expect.any(Error));
    });
    expect(requestPersistentStorage).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('renders Your data card in History mode', () => {
    vi.mocked(useCurrentSession).mockReturnValue(null);
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );
    expect(screen.queryByText('DataCard stub')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText('DataCard stub')).toBeInTheDocument();
  });

  it('renders the backup reminder in the check-in', () => {
    vi.mocked(useCurrentSession).mockReturnValue(null);
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );
    expect(screen.getByText('BackupReminder stub')).toBeInTheDocument();
  });

  it('logs an error when starting a session fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(useCurrentSession).mockReturnValue(null);
    mockDb.sessions.add.mockRejectedValue(new Error('boom'));

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/start session/i));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error starting session:', expect.any(Error));
    });
    errorSpy.mockRestore();
  });

  it('logs an error when ending a session fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    mockDb.sessions.put.mockRejectedValue(new Error('boom'));

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/end session/i));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Error ending session:', expect.any(Error));
    });
    errorSpy.mockRestore();
  });

  describe('undo', () => {
    const prev: SessionProblem = { ...mockProblem, attempts: [] };
    const sessionWithProblem = {
      ...mockSession,
      postSessionNotes: 'keep me',
      problems: [prev],
    };

    const setupAttempt = () => {
      vi.mocked(useCurrentSession).mockReturnValue(sessionWithProblem);
      mockDb.problems.get.mockResolvedValue(prev);
      mockDb.problems.put.mockResolvedValue('1');
      mockDb.problems.delete.mockResolvedValue(undefined);
      mockDb.attempts.add.mockResolvedValue('a');
      mockDb.attempts.delete.mockResolvedValue(undefined);
      mockDb.attempts.toArray.mockResolvedValue([]);
      mockDb.sessions.put.mockResolvedValue('1');
      mockDb.sessions.update.mockResolvedValue(1);
      mockDb.sessions.get.mockResolvedValue(sessionWithProblem);
    };

    it('shows a snackbar after logging an attempt', async () => {
      setupAttempt();
      render(ui());
      fireEvent.click(screen.getByTestId('attempt-button'));
      expect(await screen.findByText('Attempt logged')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });

    it.each([
      ['flash-button', 'Flash logged'],
      ['send-button', 'Send logged'],
    ])('shows %s message', async (testId, message) => {
      setupAttempt();
      render(ui());
      fireEvent.click(screen.getByTestId(testId));
      expect(await screen.findByText(message)).toBeInTheDocument();
    });

    it('undo removes the attempt and restores the problem', async () => {
      setupAttempt();
      render(ui());
      fireEvent.click(screen.getByTestId('flash-button'));
      fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

      await waitFor(() => {
        expect(mockDb.attempts.delete).toHaveBeenCalledWith(expect.any(String) as string);
      });
      expect(mockDb.problems.put).toHaveBeenLastCalledWith(prev);
      expect(mockDb.sessions.update).toHaveBeenCalledWith('1', { problems: [prev] });
    });

    it('undo leaves other session fields untouched', async () => {
      setupAttempt();
      render(ui());
      fireEvent.click(screen.getByTestId('attempt-button'));
      fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

      await waitFor(() => {
        expect(mockDb.sessions.update).toHaveBeenCalled();
      });
      const calls = mockDb.sessions.update.mock.calls;
      expect(calls).toHaveLength(1);
      expect(Object.keys(calls[0]?.[1] ?? {})).toEqual(['problems']);
    });

    it('undo removes an added problem', async () => {
      setupAttempt();
      vi.mocked(useCurrentSession).mockReturnValue(mockSession);
      mockDb.problems.add.mockResolvedValue('2');
      render(ui());

      fireEvent.click(screen.getByText(/add problem/i));
      fireEvent.change(screen.getByLabelText(/problem name/i), { target: { value: 'New' } });
      fireEvent.mouseDown(screen.getAllByRole('combobox')[0] as HTMLElement);
      fireEvent.click(await screen.findByRole('option', { name: '6a' }));
      fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

      expect(await screen.findByText('Problem added')).toBeInTheDocument();
      const added = mockDb.problems.add.mock.calls[0]?.[0];
      mockDb.sessions.get.mockResolvedValue({
        ...mockSession,
        problems: [prev, added as SessionProblem],
      });
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

      await waitFor(() => {
        expect(mockDb.problems.delete).toHaveBeenCalledWith(added?.id);
      });
      await waitFor(() => {
        expect(mockDb.sessions.update).toHaveBeenCalledWith('1', { problems: [prev] });
      });
    });

    it('undo after two actions reverts only the latest', async () => {
      setupAttempt();
      render(ui());
      fireEvent.click(screen.getByTestId('attempt-button'));
      await screen.findByText('Attempt logged');
      fireEvent.click(screen.getByTestId('send-button'));
      expect(await screen.findByText('Send logged')).toBeInTheDocument();
      expect(screen.queryByText('Attempt logged')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

      await waitFor(() => {
        expect(mockDb.attempts.delete).toHaveBeenCalledTimes(1);
      });
      const sendCall = mockDb.attempts.add.mock.calls[1]?.[0];
      expect(mockDb.attempts.delete).toHaveBeenCalledWith(sendCall?.id);
    });

    it('Undo can only be pressed once', async () => {
      setupAttempt();
      render(ui());
      fireEvent.click(screen.getByTestId('attempt-button'));
      const undo = await screen.findByRole('button', { name: 'Undo' });
      fireEvent.click(undo);
      fireEvent.click(undo);

      await waitFor(() => {
        expect(mockDb.sessions.update).toHaveBeenCalled();
      });
      expect(mockDb.attempts.delete).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    });

    it('shows an error when logging fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      setupAttempt();
      mockDb.attempts.add.mockRejectedValue(new Error('boom'));
      render(ui());
      fireEvent.click(screen.getByTestId('attempt-button'));

      expect(await screen.findByText("Couldn't save. Try again.")).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
      expect(errorSpy).toHaveBeenCalledWith('Error adding attempt:', expect.any(Error));
      errorSpy.mockRestore();
    });

    it('shows an error when adding a problem fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      setupAttempt();
      vi.mocked(useCurrentSession).mockReturnValue(mockSession);
      mockDb.problems.add.mockRejectedValue(new Error('boom'));
      render(ui());
      fireEvent.click(screen.getByText(/add problem/i));
      fireEvent.change(screen.getByLabelText(/problem name/i), { target: { value: 'New' } });
      fireEvent.mouseDown(screen.getAllByRole('combobox')[0] as HTMLElement);
      fireEvent.click(await screen.findByRole('option', { name: '6a' }));
      fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

      expect(await screen.findByText("Couldn't save. Try again.")).toBeInTheDocument();
      expect(errorSpy).toHaveBeenCalledWith('Error adding problem:', expect.any(Error));
      errorSpy.mockRestore();
    });

    it('undo End reopens the session with its notes and review', async () => {
      const ended = {
        ...mockSession,
        postSessionNotes: 'Saved notes',
        postSessionReview: {
          rpe: 8,
          energyAfter: null,
          accomplishments: ['Did A'],
          workOn: [],
          achievedGoals: [],
        },
      };
      vi.mocked(useCurrentSession).mockReturnValue(ended);
      mockDb.sessions.put.mockResolvedValue('1');
      mockDb.sessions.update.mockResolvedValue(1);
      const view = render(ui());

      fireEvent.click(screen.getByText(/end session/i));
      expect(await screen.findByText('Session ended')).toBeInTheDocument();
      vi.mocked(useCurrentSession).mockReturnValue(null);
      view.rerender(ui());

      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
      await waitFor(() => {
        expect(mockDb.sessions.update).toHaveBeenCalledWith('1', {
          endTime: null,
          duration: undefined,
        });
      });

      vi.mocked(useCurrentSession).mockReturnValue(ended);
      view.rerender(ui());
      expect(screen.getByLabelText(/post-session notes/i)).toHaveValue('Saved notes');
      expect(screen.getByText('Did A')).toBeInTheDocument();
      expect(
        within(screen.getByRole('group', { name: 'RPE' })).getByRole('button', { name: '8' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows an error when ending fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.mocked(useCurrentSession).mockReturnValue(mockSession);
      mockDb.sessions.put.mockRejectedValue(new Error('boom'));
      render(ui());
      fireEvent.click(screen.getByText(/end session/i));

      expect(await screen.findByText("Couldn't save. Try again.")).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
      errorSpy.mockRestore();
    });

    it('shows an error when undoing End fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.mocked(useCurrentSession).mockReturnValue(mockSession);
      mockDb.sessions.put.mockResolvedValue('1');
      mockDb.sessions.update.mockRejectedValue(new Error('boom'));
      render(ui());
      fireEvent.click(screen.getByText(/end session/i));
      fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

      expect(await screen.findByText("Couldn't save. Try again.")).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
      expect(errorSpy).toHaveBeenCalledWith('Error undoing action:', expect.any(Error));
      errorSpy.mockRestore();
    });

    it('shows an error when undo fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      setupAttempt();
      mockDb.attempts.delete.mockRejectedValue(new Error('boom'));
      render(ui());
      fireEvent.click(screen.getByTestId('attempt-button'));
      fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

      expect(await screen.findByText("Couldn't save. Try again.")).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
      expect(errorSpy).toHaveBeenCalledWith('Error undoing action:', expect.any(Error));
      errorSpy.mockRestore();
    });
  });

  describe('post-session review', () => {
    const goalSession: SessionType = {
      ...mockSession,
      preSessionData: { ...mockSession.preSessionData, goals: ['Send red', 'Flash blue'] },
    };

    it('saves the filled-in review when ending', async () => {
      vi.mocked(useCurrentSession).mockReturnValue(goalSession);
      mockDb.sessions.put.mockResolvedValue(1);
      render(ui());

      const rpe = screen.getByRole('group', { name: 'RPE' });
      fireEvent.click(within(rpe).getByRole('button', { name: '7' }));
      const energy = screen.getByRole('group', { name: 'Energy after' });
      fireEvent.click(within(energy).getByRole('button', { name: '4' }));

      const acc = screen.getByLabelText('Accomplished');
      fireEvent.change(acc, { target: { value: 'Project A' } });
      fireEvent.keyDown(acc, { key: 'Enter' });
      const work = screen.getByLabelText('Work on');
      fireEvent.change(work, { target: { value: 'Heel hooks' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add work-on item' }));

      fireEvent.click(screen.getByRole('checkbox', { name: 'Flash blue' }));
      fireEvent.change(screen.getByLabelText(/post-session notes/i), {
        target: { value: 'Good day' },
      });
      fireEvent.click(screen.getByText(/end session/i));

      await waitFor(() => {
        expect(mockDb.sessions.put).toHaveBeenCalledWith(
          expect.objectContaining({
            postSessionNotes: 'Good day',
            postSessionReview: {
              rpe: 7,
              energyAfter: 4,
              accomplishments: ['Project A'],
              workOn: ['Heel hooks'],
              achievedGoals: [1],
            },
          }),
        );
      });
    });

    it('saves nulls and empty lists when the review is untouched', async () => {
      vi.mocked(useCurrentSession).mockReturnValue(goalSession);
      mockDb.sessions.put.mockResolvedValue(1);
      render(ui());

      fireEvent.click(screen.getByText(/end session/i));

      await waitFor(() => {
        expect(mockDb.sessions.put).toHaveBeenCalledWith(
          expect.objectContaining({
            postSessionReview: {
              rpe: null,
              energyAfter: null,
              accomplishments: [],
              workOn: [],
              achievedGoals: [],
            },
          }),
        );
      });
    });

    it('clears a picker when the selected value is clicked again', () => {
      vi.mocked(useCurrentSession).mockReturnValue(goalSession);
      render(ui());
      const button = within(screen.getByRole('group', { name: 'RPE' })).getByRole('button', {
        name: '3',
      });
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows no goal checkbox when the session has no goals', () => {
      vi.mocked(useCurrentSession).mockReturnValue(mockSession);
      render(ui());
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  describe('review draft persistence', () => {
    const goalSession: SessionType = {
      ...mockSession,
      preSessionData: { ...mockSession.preSessionData, goals: ['Send red', 'Flash blue'] },
    };

    it('writes the draft to the active session on change', async () => {
      vi.mocked(useCurrentSession).mockReturnValue(goalSession);
      mockDb.sessions.update.mockResolvedValue(1);
      render(ui());

      fireEvent.click(
        within(screen.getByRole('group', { name: 'RPE' })).getByRole('button', { name: '6' }),
      );

      await waitFor(() => {
        expect(mockDb.sessions.update).toHaveBeenCalledWith('1', {
          postSessionReview: {
            rpe: 6,
            energyAfter: null,
            accomplishments: [],
            workOn: [],
            achievedGoals: [],
          },
          postSessionNotes: '',
        });
      });

      fireEvent.change(screen.getByLabelText(/post-session notes/i), {
        target: { value: 'hi' },
      });
      await waitFor(() => {
        expect(mockDb.sessions.update).toHaveBeenLastCalledWith(
          '1',
          expect.objectContaining({ postSessionNotes: 'hi' }),
        );
      });
    });

    it('logs and swallows a failed draft write', async () => {
      vi.mocked(useCurrentSession).mockReturnValue(goalSession);
      mockDb.sessions.update.mockRejectedValue(new Error('boom'));
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      render(ui());

      fireEvent.click(
        within(screen.getByRole('group', { name: 'RPE' })).getByRole('button', { name: '6' }),
      );

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith('Error saving review draft:', expect.any(Error));
      });
      spy.mockRestore();
    });

    it('restores the draft from the session on remount', () => {
      vi.mocked(useCurrentSession).mockReturnValue({
        ...goalSession,
        postSessionNotes: 'Saved notes',
        postSessionReview: {
          rpe: 8,
          energyAfter: 3,
          accomplishments: ['Did A'],
          workOn: ['Fix B'],
          achievedGoals: [0],
        },
      });
      const first = render(ui());
      first.unmount();
      render(ui());

      expect(
        within(screen.getByRole('group', { name: 'RPE' })).getByRole('button', { name: '8' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        within(screen.getByRole('group', { name: 'Energy after' })).getByRole('button', {
          name: '3',
        }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Did A')).toBeInTheDocument();
      expect(screen.getByText('Fix B')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Send red' })).toBeChecked();
      expect(screen.getByLabelText(/post-session notes/i)).toHaveValue('Saved notes');
    });

    it('starts the next session with an empty review after End', async () => {
      vi.mocked(useCurrentSession).mockReturnValue({
        ...goalSession,
        postSessionReview: {
          rpe: 8,
          energyAfter: null,
          accomplishments: ['Did A'],
          workOn: [],
          achievedGoals: [],
        },
        postSessionNotes: 'Saved notes',
      });
      mockDb.sessions.put.mockResolvedValue(1);
      mockDb.sessions.add.mockResolvedValue('2');
      const view = render(ui());

      fireEvent.click(screen.getByText(/end session/i));
      await waitFor(() => {
        expect(mockDb.sessions.put).toHaveBeenCalled();
      });

      vi.mocked(useCurrentSession).mockReturnValue(null);
      view.rerender(ui());
      fireEvent.click(screen.getByText(/start session/i));
      await waitFor(() => {
        expect(mockDb.sessions.add).toHaveBeenCalled();
      });

      vi.mocked(useCurrentSession).mockReturnValue({ ...goalSession, id: '2' });
      view.rerender(ui());

      expect(
        within(screen.getByRole('group', { name: 'RPE' })).getByRole('button', { name: '8' }),
      ).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByText('Did A')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/post-session notes/i)).toHaveValue('');
    });
  });
});
