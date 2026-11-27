import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkoutFormDialog from '../WorkoutFormDialog';

const setup = () => {
  const onSave = vi.fn();
  render(<WorkoutFormDialog open onClose={vi.fn()} onSave={onSave} />);
  return { onSave, user: userEvent.setup() };
};

describe('WorkoutFormDialog', () => {
  it('clearing Work and typing 30 gives 30', async () => {
    const { onSave, user } = setup();
    await user.type(screen.getByLabelText('Name'), 'Holds');
    const work = screen.getByLabelText('Work (seconds)');
    await user.clear(work);
    expect(work).toHaveValue('');
    await user.type(work, '30');
    expect(work).toHaveValue('30');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ workSeconds: 30 }));
  });

  it('focus selects the field contents', async () => {
    const { user } = setup();
    const work = screen.getByLabelText<HTMLInputElement>('Work (seconds)');
    await user.click(work);
    expect(work.selectionStart).toBe(0);
    expect(work.selectionEnd).toBe(work.value.length);
  });

  it('Save is disabled while a field is empty', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Name'), 'Holds');
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeEnabled();
    for (const label of ['Work (seconds)', 'Rest (seconds)', 'Intervals']) {
      const field = screen.getByLabelText(label);
      await user.clear(field);
      expect(save).toBeDisabled();
      await user.type(field, '3');
      expect(save).toBeEnabled();
    }
    const work = screen.getByLabelText('Work (seconds)');
    await user.clear(work);
    await user.type(work, '0');
    expect(save).toBeDisabled();
  });

  it('saves integer values', async () => {
    const { onSave, user } = setup();
    await user.type(screen.getByLabelText('Name'), 'Holds');
    await user.clear(screen.getByLabelText('Rest (seconds)'));
    await user.type(screen.getByLabelText('Rest (seconds)'), '0');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({
      name: 'Holds',
      workSeconds: 5,
      restSeconds: 0,
      intervals: 6,
      muted: false,
    });
  });

  it('blurring an invalid field shows how to fix it', async () => {
    const { user } = setup();
    const name = screen.getByLabelText('Name');
    const work = screen.getByLabelText('Work (seconds)');
    const rest = screen.getByLabelText('Rest (seconds)');
    const intervals = screen.getByLabelText('Intervals');

    await user.click(name);
    await user.tab();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a name')).toBeInTheDocument();

    await user.clear(work);
    await user.type(work, '0');
    await user.tab();
    expect(work).toHaveAttribute('aria-invalid', 'true');

    await user.clear(rest);
    await user.tab();
    expect(rest).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a whole number, 0 or more')).toBeInTheDocument();

    await user.clear(intervals);
    await user.type(intervals, '0');
    await user.tab();
    expect(intervals).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Enter a whole number, 1 or more')).toHaveLength(2);
  });

  it('fixing the field clears the error', async () => {
    const { user } = setup();
    const work = screen.getByLabelText('Work (seconds)');
    await user.clear(work);
    await user.tab();
    expect(work).toHaveAttribute('aria-invalid', 'true');
    await user.type(work, '30');
    expect(work).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByText('Length of each interval / hold')).toBeInTheDocument();
  });

  it('untouched fields show no error', () => {
    setup();
    for (const label of ['Name', 'Work (seconds)', 'Rest (seconds)', 'Intervals']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'false');
    }
    expect(screen.queryByText('Enter a name')).not.toBeInTheDocument();
  });

  it('name field has no autocomplete', () => {
    setup();
    expect(screen.getByLabelText('Name')).toHaveAttribute('autocomplete', 'off');
  });
});
