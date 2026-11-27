import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuickLog from '../QuickLog';
import type { SessionProblem } from '../../types';
import { useProblemsAtGrade } from '../../db/index';

vi.mock('../../db/index', () => ({
  useProblemsAtGrade: vi.fn<typeof useProblemsAtGrade>(),
}));

const mockHistory = vi.mocked(useProblemsAtGrade);

const makeProblem = (over: Partial<SessionProblem>): SessionProblem => ({
  id: 'p',
  name: 'P',
  frenchGrade: '',
  colorGrade: '',
  sessionId: 's1',
  createdAt: '2025-01-02T10:00:00.000Z',
  flash: false,
  send: false,
  attempts: [],
  ...over,
});

const renderLog = (problems: SessionProblem[] = [], onAddProblem = vi.fn()) => {
  render(
    <QuickLog
      sessionId="s1"
      problems={problems}
      onAddProblem={onAddProblem}
      onAddAttempt={vi.fn()}
    />,
  );
  return onAddProblem;
};

const openDialog = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add Problem' }));
  return screen.getByRole('dialog');
};

describe('QuickLog add dialog', () => {
  beforeEach(() => {
    mockHistory.mockReset();
    mockHistory.mockReturnValue([]);
  });

  it('Add disabled without a grade', () => {
    renderLog();
    const dialog = openDialog();
    const add = within(dialog).getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: '6a' }));
    expect(add).toBeEnabled();
  });

  it('dialog preselects the last grades', () => {
    renderLog([
      makeProblem({ id: 'a', frenchGrade: '5', createdAt: '2025-01-02T10:00:00.000Z' }),
      makeProblem({ id: 'b', frenchGrade: '6b', createdAt: '2025-01-02T11:00:00.000Z' }),
    ]);
    const dialog = openDialog();
    expect(within(dialog).getByRole('button', { name: '6b' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(dialog).getByRole('button', { name: '5' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('empty name saves an auto-name', () => {
    const onAdd = renderLog([makeProblem({ id: 'a', frenchGrade: '6b' })]);
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: '6b #2', frenchGrade: '6b' }),
    );
  });

  it('keeps a typed name', () => {
    const onAdd = renderLog();
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: '6a' }));
    fireEvent.change(within(dialog).getByLabelText('Problem Name'), {
      target: { value: 'Crimpy' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Crimpy' }));
  });

  it('name field not focused on open', () => {
    renderLog();
    const dialog = openDialog();
    expect(within(dialog).getByLabelText('Problem Name')).not.toHaveFocus();
  });

  it('shows last time at the selected grade', () => {
    mockHistory.mockImplementation((label) =>
      label === '6a'
        ? [
            makeProblem({ id: 'h1', sessionId: 'old', frenchGrade: '6a', send: true }),
            makeProblem({ id: 'h2', sessionId: 'old', frenchGrade: '6a', flash: true }),
            makeProblem({ id: 'h3', sessionId: 's1', frenchGrade: '6a' }),
          ]
        : [],
    );
    renderLog();
    const dialog = openDialog();
    expect(within(dialog).queryByText(/Last time at/)).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: '6a' }));
    expect(
      within(dialog).getByText(/Last time at 6a \(.+\): 2 problems, 1 sent, 1 flashed/),
    ).toBeInTheDocument();
  });

  it('renders no last-time line while history is loading', () => {
    mockHistory.mockReturnValue(undefined);
    renderLog();
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: '6a' }));
    expect(within(dialog).queryByText(/Last time at/)).not.toBeInTheDocument();
  });
});
