import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QuickLog from '../QuickLog';
import type { SessionProblem } from '../../types';
import { AttemptType } from '../../types';
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

const renderWithAttemptSpy = (problems: SessionProblem[]) => {
  const onAddAttempt = vi.fn();
  render(
    <QuickLog
      sessionId="s1"
      problems={problems}
      onAddProblem={vi.fn()}
      onAddAttempt={onAddAttempt}
    />,
  );
  return onAddAttempt;
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
      within(dialog).getByText(/Last time at 6a \(.+\): 2 problems, 2 sent, 1 flashed/),
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

describe('QuickLog rows', () => {
  beforeEach(() => {
    mockHistory.mockReset();
    mockHistory.mockReturnValue([]);
  });

  const attempt = {
    id: 'x',
    problemId: 'a',
    sessionId: 's1',
    type: AttemptType.ATTEMPT,
    timestamp: '2025-01-02T10:00:00.000Z',
  };

  it('rows show the colour range', () => {
    renderLog([makeProblem({ id: 'a', colorGrade: 'Napakka' })]);
    expect(screen.getByText(/Color: 6a\+-6b\+/)).toBeInTheDocument();
    expect(screen.queryByText(/Napakka/)).not.toBeInTheDocument();
  });

  it('row buttons have visible labels and no flash button', () => {
    renderLog([makeProblem({ id: 'a', frenchGrade: '6b', attempts: [attempt] })]);
    expect(screen.getByTestId('attempt-button')).toHaveTextContent('Attempt (1)');
    expect(screen.getByTestId('send-button')).toHaveTextContent('Send');
    expect(screen.queryByTestId('flash-button')).not.toBeInTheDocument();
  });

  it('Send logs a flash when there are no attempts', () => {
    const onAttempt = renderWithAttemptSpy([makeProblem({ id: 'a', frenchGrade: '6b' })]);
    fireEvent.click(screen.getByTestId('send-button'));
    expect(onAttempt).toHaveBeenCalledWith('a', AttemptType.FLASH);
  });

  it('Send logs a send after an attempt', () => {
    const onAttempt = renderWithAttemptSpy([
      makeProblem({ id: 'a', frenchGrade: '6b', attempts: [attempt] }),
    ]);
    fireEvent.click(screen.getByTestId('send-button'));
    expect(onAttempt).toHaveBeenCalledWith('a', AttemptType.SEND);
  });

  it('Send is disabled once sent or flashed', () => {
    renderLog([makeProblem({ id: 'a', frenchGrade: '6b', flash: true })]);
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('attempt disabled and counts the flash after a flash', () => {
    const flashAttempt = { ...attempt, type: AttemptType.FLASH };
    renderLog([makeProblem({ id: 'a', frenchGrade: '6b', flash: true, attempts: [flashAttempt] })]);
    expect(screen.getByTestId('attempt-button')).toBeDisabled();
    expect(screen.getByTestId('attempt-button')).toHaveTextContent('Attempt (1)');
  });

  it('attempt counts the send after two attempts and is disabled', () => {
    const sendAttempt = { ...attempt, type: AttemptType.SEND };
    renderLog([
      makeProblem({
        id: 'a',
        frenchGrade: '6b',
        send: true,
        attempts: [attempt, { ...attempt, id: 'y' }, sendAttempt],
      }),
    ]);
    expect(screen.getByTestId('attempt-button')).toHaveTextContent('Attempt (3)');
    expect(screen.getByTestId('attempt-button')).toBeDisabled();
  });

  it('no one-tap add button', () => {
    renderLog([makeProblem({ id: 'a', frenchGrade: '6b' })]);
    expect(screen.queryByRole('button', { name: /^Add (?!Problem)/ })).not.toBeInTheDocument();
  });
});
