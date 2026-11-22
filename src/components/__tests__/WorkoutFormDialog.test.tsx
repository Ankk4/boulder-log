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
});
