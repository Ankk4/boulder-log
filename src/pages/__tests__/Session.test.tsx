import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Session from '../Session';
import { Session as SessionType, SessionProblem, AttemptType } from '../../types';
import { useCurrentSession } from '../../db/index';
import type { db } from '../../db/index';
import type { WhereClause } from 'dexie';

// Mock database functions
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    sessions: {
      add: vi.fn<typeof db.sessions.add>(),
      put: vi.fn<typeof db.sessions.put>(),
      orderBy: vi.fn<typeof db.sessions.orderBy>().mockReturnThis(),
      reverse: vi.fn<typeof db.sessions.reverse>().mockReturnThis(),
      toArray: vi.fn<typeof db.sessions.toArray>().mockResolvedValue([]),
    },
    problems: {
      add: vi.fn<typeof db.problems.add>(),
      get: vi.fn<typeof db.problems.get>(),
      put: vi.fn<typeof db.problems.put>(),
    },
    attempts: {
      add: vi.fn<typeof db.attempts.add>(),
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
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>,
    );
    expect(screen.getByText(/pre-session check-in/i)).toBeInTheDocument();
  });

  it('starts a new session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
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
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
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
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
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
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
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

  it('logs an error when starting a session fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
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
});
