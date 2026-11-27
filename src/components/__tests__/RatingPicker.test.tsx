import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RatingPicker from '../RatingPicker';

describe('RatingPicker', () => {
  it('renders the given range', () => {
    render(<RatingPicker label="Rest days" value={null} min={0} max={7} onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
  });

  it('renders 1 to 10 by default', () => {
    render(<RatingPicker label="RPE" value={null} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  it('clears on re-tap', async () => {
    const onChange = vi.fn<(next: number | null) => void>();
    render(<RatingPicker label="RPE" value={5} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
