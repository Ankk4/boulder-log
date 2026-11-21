import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PREPARE_SECONDS } from '../../utils/duration';
import { useIntervalTimer, type IntervalTimerConfig } from '../useIntervalTimer';

const { playBeep } = vi.hoisted(() => ({
  playBeep: vi.fn<(kind: 'start' | 'end' | 'tick', muted: boolean) => Promise<void>>(),
}));

vi.mock('../../utils/beep', () => ({ playBeep }));

const FRAME_MS = 100;

const baseConfig: IntervalTimerConfig = {
  workSeconds: 10,
  restSeconds: 5,
  intervals: 2,
  muted: false,
};

let now = 0;
let nextId = 1;
let callbacks = new Map<number, FrameRequestCallback>();

function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
    now += FRAME_MS;
    const pending = [...callbacks.values()];
    callbacks = new Map();
    act(() => {
      for (const cb of pending) cb(now);
    });
  }
}

function beepKinds() {
  return playBeep.mock.calls.map(([kind]) => kind);
}

describe('useIntervalTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    now = 0;
    nextId = 1;
    callbacks = new Map();
    playBeep.mockReset();
    playBeep.mockResolvedValue(undefined);
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId++;
      callbacks.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      callbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts idle with the configured values', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));
    expect(result.current.phase).toBe('idle');
    expect(result.current.currentInterval).toBe(0);
    expect(result.current.secondsRemaining).toBe(10);
    expect(result.current.completedIntervals).toBe(0);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.muted).toBe(false);
  });

  it('runs prepare, work, rest, next work, then done with the matching beeps', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));

    act(() => {
      result.current.start();
    });
    expect(result.current.phase).toBe('prepare');
    expect(result.current.secondsRemaining).toBe(PREPARE_SECONDS);
    expect(playBeep).toHaveBeenLastCalledWith('tick', false);

    advance(PREPARE_SECONDS * 1000);
    expect(result.current.phase).toBe('work');
    expect(result.current.currentInterval).toBe(1);
    expect(playBeep).toHaveBeenLastCalledWith('start', false);

    advance(10_000);
    expect(result.current.phase).toBe('rest');
    expect(result.current.completedIntervals).toBe(1);
    expect(playBeep).toHaveBeenLastCalledWith('end', false);

    advance(5_000);
    expect(result.current.phase).toBe('work');
    expect(result.current.currentInterval).toBe(2);
    expect(playBeep).toHaveBeenLastCalledWith('start', false);

    advance(10_000);
    expect(result.current.phase).toBe('done');
    expect(result.current.completedIntervals).toBe(2);
    expect(playBeep).toHaveBeenLastCalledWith('end', false);
    expect(beepKinds().filter((k) => k === 'start')).toHaveLength(2);
  });

  it('counts down seconds remaining while working', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));
    act(() => {
      result.current.start();
    });
    advance(PREPARE_SECONDS * 1000 + 4_000);
    expect(result.current.phase).toBe('work');
    expect(result.current.secondsRemaining).toBeCloseTo(6, 5);
  });

  it('skips straight to the next work when rest is zero', () => {
    const { result } = renderHook(() => useIntervalTimer({ ...baseConfig, restSeconds: 0 }));
    act(() => {
      result.current.start();
    });
    advance(PREPARE_SECONDS * 1000 + 10_000);
    expect(result.current.phase).toBe('work');
    expect(result.current.currentInterval).toBe(2);
    expect(result.current.completedIntervals).toBe(1);
  });

  it('keeps the remaining time across pause and resume', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));
    act(() => {
      result.current.start();
    });
    advance(PREPARE_SECONDS * 1000 + 4_000);
    expect(result.current.secondsRemaining).toBeCloseTo(6, 5);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    now += 30_000;
    advance(FRAME_MS * 3);
    expect(result.current.phase).toBe('work');
    expect(result.current.secondsRemaining).toBeCloseTo(6, 5);

    act(() => {
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);
    advance(2_000);
    expect(result.current.phase).toBe('work');
    expect(result.current.secondsRemaining).toBeCloseTo(4, 5);

    advance(4_000);
    expect(result.current.phase).toBe('rest');
  });

  it('skip moves to the next phase', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));
    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.skip();
    });
    expect(result.current.phase).toBe('work');
    expect(result.current.currentInterval).toBe(1);

    act(() => {
      result.current.skip();
    });
    expect(result.current.phase).toBe('rest');
    expect(result.current.completedIntervals).toBe(1);

    act(() => {
      result.current.skip();
    });
    expect(result.current.phase).toBe('work');
    expect(result.current.currentInterval).toBe(2);

    act(() => {
      result.current.skip();
    });
    expect(result.current.phase).toBe('done');
    expect(result.current.completedIntervals).toBe(2);
  });

  it('skip while paused unpauses and keeps running', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.skip();
    });
    expect(result.current.isPaused).toBe(false);
    expect(result.current.phase).toBe('work');

    advance(2_000);
    expect(result.current.secondsRemaining).toBeCloseTo(8, 5);
  });

  it('abort ends the run and stops the countdown', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));
    act(() => {
      result.current.start();
    });
    advance(PREPARE_SECONDS * 1000 + 2_000);
    const beepsBefore = playBeep.mock.calls.length;

    act(() => {
      result.current.abort();
    });
    expect(result.current.phase).toBe('done');
    expect(result.current.isPaused).toBe(false);

    advance(20_000);
    expect(result.current.phase).toBe('done');
    expect(result.current.completedIntervals).toBe(0);
    expect(playBeep.mock.calls).toHaveLength(beepsBefore);
  });

  it('passes the initial muted flag to playBeep', () => {
    const { result } = renderHook(() => useIntervalTimer({ ...baseConfig, muted: true }));
    expect(result.current.muted).toBe(true);
    act(() => {
      result.current.start();
    });
    advance(PREPARE_SECONDS * 1000);
    expect(playBeep).toHaveBeenCalled();
    for (const [, muted] of playBeep.mock.calls) {
      expect(muted).toBe(true);
    }
  });

  it('passes a mute toggled mid-run to later beeps', () => {
    const { result } = renderHook(() => useIntervalTimer(baseConfig));
    act(() => {
      result.current.start();
    });
    advance(PREPARE_SECONDS * 1000);
    expect(playBeep).toHaveBeenLastCalledWith('start', false);

    act(() => {
      result.current.setMuted(true);
    });
    expect(result.current.muted).toBe(true);

    advance(10_000);
    expect(result.current.phase).toBe('rest');
    expect(playBeep).toHaveBeenLastCalledWith('end', true);
  });
});
