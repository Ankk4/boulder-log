import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import UndoSnackbar from '../UndoSnackbar';

describe('UndoSnackbar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message and Undo', async () => {
    const onUndo = vi.fn<() => void>();
    render(
      <UndoSnackbar
        open
        message="Attempt logged"
        severity="info"
        onUndo={onUndo}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Attempt logged')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('Undo has an accessible name', () => {
    render(
      <UndoSnackbar
        open
        message="Flash logged"
        severity="info"
        onUndo={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('shows no Undo without onUndo', () => {
    render(
      <UndoSnackbar open message="Couldn't save. Try again." severity="error" onClose={vi.fn()} />,
    );
    expect(screen.getByText("Couldn't save. Try again.")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('auto-hides after 5 s', () => {
    vi.useFakeTimers();
    const onClose = vi.fn<() => void>();
    render(
      <UndoSnackbar
        open
        message="Send logged"
        severity="info"
        onUndo={vi.fn()}
        onClose={onClose}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(4900);
    });
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('info uses status role', () => {
    render(<UndoSnackbar open message="Send logged" severity="info" onClose={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Send logged');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('error uses alert role', () => {
    render(<UndoSnackbar open message="Couldn't save" severity="error" onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save");
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not auto-hide while Undo has focus', () => {
    vi.useFakeTimers();
    const onClose = vi.fn<() => void>();
    render(
      <UndoSnackbar
        open
        message="Send logged"
        severity="info"
        onUndo={vi.fn()}
        onClose={onClose}
      />,
    );
    const undo = screen.getByRole('button', { name: 'Undo' });
    act(() => {
      undo.focus();
    });
    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Send logged')).toBeInTheDocument();
    act(() => {
      undo.blur();
    });
    act(() => {
      vi.advanceTimersByTime(8100);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks elsewhere', async () => {
    const onClose = vi.fn<() => void>();
    render(
      <div>
        <button>outside</button>
        <UndoSnackbar
          open
          message="Problem added"
          severity="info"
          onUndo={vi.fn()}
          onClose={onClose}
        />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'outside' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on the close button', async () => {
    const onClose = vi.fn<() => void>();
    render(<UndoSnackbar open message="m" severity="info" onUndo={vi.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on a horizontal swipe', () => {
    const onClose = vi.fn<() => void>();
    render(<UndoSnackbar open message="m" severity="info" onUndo={vi.fn()} onClose={onClose} />);
    const alert = screen.getByRole('status');
    fireEvent.pointerDown(alert, { clientX: 200 });
    fireEvent.pointerMove(alert, { clientX: 260 });
    fireEvent.pointerUp(alert, { clientX: 320 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores a short swipe', () => {
    const onClose = vi.fn<() => void>();
    render(<UndoSnackbar open message="m" severity="info" onUndo={vi.fn()} onClose={onClose} />);
    const alert = screen.getByRole('status');
    fireEvent.pointerDown(alert, { clientX: 200 });
    fireEvent.pointerMove(alert, { clientX: 220 });
    fireEvent.pointerUp(alert, { clientX: 230 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a tap on Undo is not treated as a swipe', () => {
    const onUndo = vi.fn<() => void>();
    const onClose = vi.fn<() => void>();
    render(<UndoSnackbar open message="m" severity="info" onUndo={onUndo} onClose={onClose} />);
    const undo = screen.getByRole('button', { name: 'Undo' });
    fireEvent.pointerDown(undo, { clientX: 150 });
    fireEvent.pointerUp(undo, { clientX: 150 });
    fireEvent.click(undo);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('captures the pointer once a drag passes the slop, and survives capture errors', () => {
    const onClose = vi.fn<() => void>();
    render(<UndoSnackbar open message="m" severity="info" onUndo={vi.fn()} onClose={onClose} />);
    const alert = screen.getByRole('status');
    const setCapture = vi.fn<(id: number) => void>(() => {
      throw new Error('InvalidStateError');
    });
    Object.assign(alert, { setPointerCapture: setCapture, hasPointerCapture: () => false });
    fireEvent.pointerDown(alert, { clientX: 200 });
    fireEvent.pointerMove(alert, { clientX: 205 });
    expect(setCapture).not.toHaveBeenCalled();
    fireEvent.pointerMove(alert, { clientX: 230 });
    expect(setCapture).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(alert, { clientX: 330 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets the drag when pointer capture is lost', () => {
    const onClose = vi.fn<() => void>();
    render(<UndoSnackbar open message="m" severity="info" onUndo={vi.fn()} onClose={onClose} />);
    const alert = screen.getByRole('status');
    fireEvent.pointerDown(alert, { clientX: 200 });
    fireEvent.pointerMove(alert, { clientX: 250 });
    fireEvent.lostPointerCapture(alert);
    fireEvent.pointerUp(alert, { clientX: 400 });
    expect(onClose).not.toHaveBeenCalled();
    expect(alert.style.transform || '').not.toContain('50px');
  });

  it('undo still calls onUndo', async () => {
    const onUndo = vi.fn<() => void>();
    render(<UndoSnackbar open message="m" severity="info" onUndo={onUndo} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
