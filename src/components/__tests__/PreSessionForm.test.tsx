import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PreSessionForm from '../PreSessionForm';
import { LIMITS } from '../../utils/validation';
import type { PreSessionData } from '../../types';

const empty: PreSessionData = { goals: [], additionalNotes: '' };

const Harness = ({
  initial = empty,
  lastWorkOn,
  onChange,
}: {
  initial?: PreSessionData;
  lastWorkOn?: string[];
  onChange?: (d: PreSessionData) => void;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <PreSessionForm
      value={value}
      lastWorkOn={lastWorkOn}
      onChange={(d) => {
        setValue(d);
        onChange?.(d);
      }}
    />
  );
};

const header = (name: RegExp) => screen.getByRole('button', { name });

describe('PreSessionForm', () => {
  it('groups start collapsed except goals', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'How you feel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Plan' })).toBeInTheDocument();
    expect(header(/^Physical/)).toHaveAttribute('aria-expanded', 'false');
    expect(header(/^Mental/)).toHaveAttribute('aria-expanded', 'false');
    expect(header(/^Nutrition/)).toHaveAttribute('aria-expanded', 'false');
    expect(header(/^Goals/)).toHaveAttribute('aria-expanded', 'true');
    expect(header(/^Notes/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('collapsed group shows its summary', () => {
    render(<Harness initial={{ ...empty, sleepQuality: 7, energyLevel: 6 }} />);
    expect(header(/^Physical/)).toHaveTextContent('Sleep 7 · Energy 6');
    expect(header(/^Mental/)).toHaveTextContent('Not recorded');
  });

  it('expands a group on tap', async () => {
    render(<Harness />);
    await userEvent.click(header(/^Physical/));
    expect(header(/^Physical/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the pickers with their ranges', async () => {
    render(<Harness />);
    await userEvent.click(header(/^Physical/));
    const sleep = screen.getByRole('group', { name: /Sleep quality/ });
    expect(within(sleep).getAllByRole('button')).toHaveLength(10);
    const rest = screen.getByRole('group', { name: /Rest days/ });
    expect(
      within(rest)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
  });

  it('records a rating and drops it again on re-tap', async () => {
    const onChange = vi.fn<(d: PreSessionData) => void>();
    render(<Harness onChange={onChange} />);
    await userEvent.click(header(/^Physical/));
    const sleep = screen.getByRole('group', { name: /Sleep quality/ });
    await userEvent.click(within(sleep).getByRole('button', { name: '7' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...empty, sleepQuality: 7 });
    await userEvent.click(within(sleep).getByRole('button', { name: '7' }));
    const last = onChange.mock.lastCall?.[0];
    expect(last).toEqual(empty);
    expect(last).not.toHaveProperty('sleepQuality');
  });

  it('clears nutrition on re-tap', async () => {
    const onChange = vi.fn<(d: PreSessionData) => void>();
    render(<Harness initial={{ ...empty, nutrition: 'good' }} onChange={onChange} />);
    await userEvent.click(header(/^Nutrition/));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    const last = onChange.mock.lastCall?.[0];
    expect(last).not.toHaveProperty('nutrition');
  });

  it('adds a typed goal on Enter', async () => {
    const onChange = vi.fn<(d: PreSessionData) => void>();
    render(<Harness onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText(/Add a goal/), 'Send V4{Enter}');
    expect(onChange).toHaveBeenLastCalledWith({ ...empty, goals: ['Send V4'] });
  });

  it('shows last work-on items', () => {
    render(<Harness lastWorkOn={['Heel hooks', 'Slopers']} />);
    expect(screen.getByText('Last time: work on')).toBeInTheDocument();
    expect(screen.getByText('Heel hooks')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Add as goal/ })).toHaveLength(2);
  });

  it('adds a work-on item as a goal', async () => {
    const onChange = vi.fn<(d: PreSessionData) => void>();
    render(<Harness lastWorkOn={['Heel hooks']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Add as goal/ }));
    expect(onChange).toHaveBeenLastCalledWith({ ...empty, goals: ['Heel hooks'] });
    expect(screen.getByRole('button', { name: /Add as goal/ })).toBeDisabled();
  });

  it('disables add at the goal limit', () => {
    const goals = Array.from({ length: LIMITS.maxGoals }, (_, i) => `Goal ${String(i)}`);
    render(<Harness initial={{ ...empty, goals }} lastWorkOn={['Heel hooks']} />);
    expect(screen.getByRole('button', { name: /Add as goal/ })).toBeDisabled();
  });

  it('disables add once a sanitized item is a goal', async () => {
    render(<Harness lastWorkOn={['  Heel hooks  ']} />);
    await userEvent.click(screen.getByRole('button', { name: /Add as goal/ }));
    expect(screen.getByRole('button', { name: /Add as goal/ })).toBeDisabled();
  });

  it('shows nothing without a previous review', () => {
    render(<Harness />);
    expect(screen.queryByText('Last time: work on')).not.toBeInTheDocument();
    render(<Harness lastWorkOn={[]} />);
    expect(screen.queryByText('Last time: work on')).not.toBeInTheDocument();
  });

  it('works uncontrolled when no value is given', async () => {
    const onChange = vi.fn<(d: PreSessionData) => void>();
    render(<PreSessionForm onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText(/Add a goal/), 'A{Enter}');
    expect(onChange).toHaveBeenLastCalledWith({ ...empty, goals: ['A'] });
  });
});
