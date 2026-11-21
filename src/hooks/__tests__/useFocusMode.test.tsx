import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FocusModeProvider } from '../FocusModeProvider';
import { useFocusMode, useRequestFocusMode } from '../useFocusMode';

function Reader() {
  return <div data-testid="state">{String(useFocusMode())}</div>;
}

function Requester({ active }: { active: boolean }) {
  useRequestFocusMode(active);
  return null;
}

function Harness({ active, mounted }: { active: boolean; mounted: boolean }) {
  return (
    <FocusModeProvider>
      <Reader />
      {mounted && <Requester active={active} />}
    </FocusModeProvider>
  );
}

describe('useFocusMode', () => {
  it('sets and clears focus, clears on unmount', () => {
    const { rerender } = render(<Harness active={false} mounted />);
    expect(screen.getByTestId('state').textContent).toBe('false');

    rerender(<Harness active mounted />);
    expect(screen.getByTestId('state').textContent).toBe('true');

    rerender(<Harness active={false} mounted />);
    expect(screen.getByTestId('state').textContent).toBe('false');

    rerender(<Harness active mounted />);
    expect(screen.getByTestId('state').textContent).toBe('true');

    rerender(<Harness active mounted={false} />);
    expect(screen.getByTestId('state').textContent).toBe('false');
  });

  it('is false and inert outside a provider', () => {
    render(
      <>
        <Reader />
        <Requester active />
      </>,
    );
    expect(screen.getByTestId('state').textContent).toBe('false');
  });
});
