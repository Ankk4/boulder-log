import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import GradePicker from '../GradePicker';

const setup = (frenchGrade = '', colorGrade = '') => {
  const onFrenchGradeChange = vi.fn<(g: string) => void>();
  const onColorGradeChange = vi.fn<(c: string) => void>();
  render(
    <GradePicker
      frenchGrade={frenchGrade}
      colorGrade={colorGrade}
      onFrenchGradeChange={onFrenchGradeChange}
      onColorGradeChange={onColorGradeChange}
    />,
  );
  return { onFrenchGradeChange, onColorGradeChange };
};

describe('GradePicker', () => {
  it('selects and deselects a French grade', async () => {
    const user = userEvent.setup();
    const first = setup();
    await user.click(screen.getByRole('button', { name: '6a' }));
    expect(first.onFrenchGradeChange).toHaveBeenCalledWith('6a');
  });

  it('deselects a selected French grade', async () => {
    const user = userEvent.setup();
    const { onFrenchGradeChange } = setup('6a');
    const chip = screen.getByRole('button', { name: '6a' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '6b' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(chip);
    expect(onFrenchGradeChange).toHaveBeenCalledWith('');
  });

  it('selects a colour', async () => {
    const user = userEvent.setup();
    const { onColorGradeChange } = setup();
    expect(screen.getByTestId('swatch-Helppo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Helppo' }));
    expect(onColorGradeChange).toHaveBeenCalledWith('Helppo');
  });

  it('deselects a selected colour', async () => {
    const user = userEvent.setup();
    const { onColorGradeChange } = setup('', 'Helppo');
    const chip = screen.getByRole('button', { name: 'Helppo' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip);
    expect(onColorGradeChange).toHaveBeenCalledWith('');
  });
});
