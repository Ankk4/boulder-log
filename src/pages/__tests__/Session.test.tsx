import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Session from '../Session';
import { Session as SessionType, SessionProblem, AttemptType } from '../../types';
import { BoulderLogDatabase } from '../../db/index';
import { useCurrentSession } from '../../db/index';

// Mock database functions
vi.mock('../../db/index', () => {
  const mockDb = {
    sessions: {
      add: vi.fn(),
      put: vi.fn(),
      orderBy: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    problems: {
      add: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
    },
    attempts: {
      add: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    deleteSession: vi.fn(),
  };
  return {
    BoulderLogDatabase: mockDb,
    db: mockDb,
    useCurrentSession: vi.fn(),
  };
});

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
      </MemoryRouter>
    );
    expect(screen.getByText(/pre-session check-in/i)).toBeInTheDocument();
  });

  it('starts a new session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(undefined);
    vi.mocked(BoulderLogDatabase.sessions.add).mockResolvedValue('1');

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/start session/i));

    await waitFor(() => {
      expect(BoulderLogDatabase.sessions.add).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(String),
          endTime: null,
        })
      );
    });
  });

  it('adds a problem to current session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    vi.mocked(BoulderLogDatabase.problems.add).mockResolvedValue('2');

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/add problem/i));

    const nameInput = screen.getByLabelText(/problem name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Problem' } });

    const [frenchGradeSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(frenchGradeSelect);
    fireEvent.click(await screen.findByRole('option', { name: '6a' }));

    const addButton = screen.getByRole('button', { name: /^add$/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(BoulderLogDatabase.problems.add).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: '1',
          name: 'Test Problem',
          frenchGrade: '6a',
          id: expect.any(String),
        })
      );
    });
  });

  it('adds an attempt to a problem', async () => {
    vi.mocked(useCurrentSession).mockReturnValue({
      ...mockSession,
      problems: [mockProblem],
    });
    vi.mocked(BoulderLogDatabase.attempts.add).mockResolvedValue('3');
    vi.mocked(BoulderLogDatabase.problems.get).mockResolvedValue(mockProblem);
    vi.mocked(BoulderLogDatabase.problems.put).mockResolvedValue(1);
    vi.mocked(BoulderLogDatabase.attempts.toArray).mockResolvedValue([
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
      </MemoryRouter>
    );

    const attemptButton = screen.getByTestId('attempt-button');
    fireEvent.click(attemptButton);

    await waitFor(() => {
      expect(BoulderLogDatabase.attempts.add).toHaveBeenCalledWith(
        expect.objectContaining({
          problemId: '1',
          type: AttemptType.ATTEMPT,
          id: expect.any(String),
        })
      );
    });
  });

  it('marks a problem as flashed', async () => {
    vi.mocked(useCurrentSession).mockReturnValue({
      ...mockSession,
      problems: [mockProblem],
    });
    vi.mocked(BoulderLogDatabase.problems.get).mockResolvedValue(mockProblem);
    vi.mocked(BoulderLogDatabase.problems.put).mockResolvedValue(1);
    vi.mocked(BoulderLogDatabase.attempts.toArray).mockResolvedValue([
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
      </MemoryRouter>
    );

    const flashButton = screen.getByTestId('flash-button');
    fireEvent.click(flashButton);

    await waitFor(() => {
      expect(BoulderLogDatabase.problems.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          flash: true,
          send: false,
        })
      );
    });
  });

  it('ends current session', async () => {
    vi.mocked(useCurrentSession).mockReturnValue(mockSession);
    vi.mocked(BoulderLogDatabase.sessions.put).mockResolvedValue(1);

    render(
      <MemoryRouter>
        <Session />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/end session/i));

    await waitFor(() => {
      expect(BoulderLogDatabase.sessions.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockSession,
          endTime: expect.any(String),
        })
      );
    });
  });
});
