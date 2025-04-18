import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Problems from '../Problems';
import { AppContext, useAppContext } from '../../context/AppContext';
import type { Problem } from '../../types';

// Mock Chakra UI components
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => vi.fn(),
    useDisclosure: () => ({
      isOpen: false,
      onOpen: vi.fn(),
      onClose: vi.fn(),
    }),
  };
});

// Mock data
const mockProblem: Problem = {
  id: '1',
  name: 'Test Problem',
  frenchGrade: '6a',
  colorGrade: 'Red',
  isProject: false,
  completed: false,
  totalAttempts: 0,
  createdAt: new Date().toISOString(),
};

const mockProblems: Problem[] = [mockProblem];
const mockSetProblems = vi.fn();

const mockContext = {
  problems: mockProblems,
  setProblems: mockSetProblems,
  currentSession: null,
  setCurrentSession: vi.fn(),
  attempts: [],
  setAttempts: vi.fn(),
  projects: [],
  setProjects: vi.fn(),
};

// Mock AppContext
vi.mock('../../context/AppContext', () => ({
  AppContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
  useAppContext: vi.fn(() => mockContext),
}));

describe('Problems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(mockContext);
  });

  it('renders the problems list', () => {
    render(
      <MemoryRouter>
        <AppContext.Provider value={mockContext}>
          <Problems />
        </AppContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Problems')).toBeInTheDocument();
    expect(screen.getByText('Test Problem')).toBeInTheDocument();
    expect(screen.getByText('Grade: 6a | Color: Red')).toBeInTheDocument();
  });

  it('adds a new problem', async () => {
    render(
      <MemoryRouter>
        <AppContext.Provider value={mockContext}>
          <Problems />
        </AppContext.Provider>
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText('Problem Name');
    const frenchGradeInput = screen.getByLabelText('French Grade');
    const colorGradeInput = screen.getByLabelText('Gym Color');
    const addButton = screen.getByText('Add New Problem');

    fireEvent.change(nameInput, { target: { value: 'New Problem' } });
    fireEvent.change(frenchGradeInput, { target: { value: '7a' } });
    fireEvent.change(colorGradeInput, { target: { value: 'Blue' } });
    fireEvent.click(addButton);

    expect(mockSetProblems).toHaveBeenCalledWith([
      ...mockProblems,
      expect.objectContaining({
        name: 'New Problem',
        frenchGrade: '7a',
        colorGrade: 'Blue',
        isProject: false,
        completed: false,
      }),
    ]);
  });

  it('toggles project status', async () => {
    render(
      <MemoryRouter>
        <AppContext.Provider value={mockContext}>
          <Problems />
        </AppContext.Provider>
      </MemoryRouter>
    );

    const projectToggle = screen.getByTestId('project-toggle-1');
    fireEvent.click(projectToggle);

    expect(mockSetProblems).toHaveBeenCalledWith([
      { ...mockProblem, isProject: true },
    ]);
  });

  it('toggles completion status', async () => {
    render(
      <MemoryRouter>
        <AppContext.Provider value={mockContext}>
          <Problems />
        </AppContext.Provider>
      </MemoryRouter>
    );

    const completionToggle = screen.getByTestId('completion-toggle-1');
    fireEvent.click(completionToggle);

    expect(mockSetProblems).toHaveBeenCalledWith([
      { ...mockProblem, completed: true },
    ]);
  });

  it('sorts problems by date', () => {
    const problemsWithDates = [
      { ...mockProblem, id: '1', name: 'Problem 1', createdAt: '2023-01-01' },
      { ...mockProblem, id: '2', name: 'Problem 2', createdAt: '2023-01-02' },
    ];

    const sortContext = { ...mockContext, problems: problemsWithDates };
    vi.mocked(useAppContext).mockReturnValue(sortContext);

    render(
      <MemoryRouter>
        <AppContext.Provider value={sortContext}>
          <Problems />
        </AppContext.Provider>
      </MemoryRouter>
    );

    const sortSelect = screen.getByTestId('sort-select');
    fireEvent.change(sortSelect, { target: { value: 'date' } });

    const problemElements = screen.getAllByText(/Problem \d/);
    expect(problemElements[0]).toHaveTextContent('Problem 2');
    expect(problemElements[1]).toHaveTextContent('Problem 1');
  });

  it('sorts problems by difficulty', () => {
    const problemsWithGrades = [
      { ...mockProblem, id: '1', name: 'Problem 1', frenchGrade: '6a' },
      { ...mockProblem, id: '2', name: 'Problem 2', frenchGrade: '6b' },
    ];

    const sortContext = { ...mockContext, problems: problemsWithGrades };
    vi.mocked(useAppContext).mockReturnValue(sortContext);

    render(
      <MemoryRouter>
        <AppContext.Provider value={sortContext}>
          <Problems />
        </AppContext.Provider>
      </MemoryRouter>
    );

    const sortSelect = screen.getByTestId('sort-select');
    fireEvent.change(sortSelect, { target: { value: 'difficulty' } });

    const problemElements = screen.getAllByText(/Problem \d/);
    expect(problemElements[0]).toHaveTextContent('Problem 2');
    expect(problemElements[1]).toHaveTextContent('Problem 1');
  });

  it('sorts problems by project status', () => {
    const problemsWithProjectStatus = [
      { ...mockProblem, id: '1', name: 'Problem 1', isProject: true },
      { ...mockProblem, id: '2', name: 'Problem 2', isProject: false },
    ];

    const sortContext = { ...mockContext, problems: problemsWithProjectStatus };
    vi.mocked(useAppContext).mockReturnValue(sortContext);

    render(
      <MemoryRouter>
        <AppContext.Provider value={sortContext}>
          <Problems />
        </AppContext.Provider>
      </MemoryRouter>
    );

    const sortSelect = screen.getByTestId('sort-select');
    fireEvent.change(sortSelect, { target: { value: 'project' } });

    const problemElements = screen.getAllByText(/Problem \d/);
    expect(problemElements[0]).toHaveTextContent('Problem 1');
    expect(problemElements[1]).toHaveTextContent('Problem 2');
  });
}); 