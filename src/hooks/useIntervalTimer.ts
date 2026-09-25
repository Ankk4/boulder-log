import { useCallback, useEffect, useRef, useState } from 'react';
import { playBeep } from '../utils/beep';
import { PREPARE_SECONDS } from '../utils/duration';

export type TimerPhase = 'idle' | 'prepare' | 'work' | 'rest' | 'done';

export interface IntervalTimerConfig {
  workSeconds: number;
  restSeconds: number;
  intervals: number;
  muted: boolean;
}

export interface IntervalTimerState {
  phase: TimerPhase;
  currentInterval: number;
  secondsRemaining: number;
  isPaused: boolean;
  completedIntervals: number;
}

interface UseIntervalTimerResult extends IntervalTimerState {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  abort: () => void;
  setMuted: (muted: boolean) => void;
  muted: boolean;
}

export function useIntervalTimer(config: IntervalTimerConfig): UseIntervalTimerResult {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [currentInterval, setCurrentInterval] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(config.workSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [completedIntervals, setCompletedIntervals] = useState(0);
  const [muted, setMutedState] = useState(config.muted);

  const phaseRef = useRef(phase);
  const intervalRef = useRef(currentInterval);
  const completedRef = useRef(completedIntervals);
  const mutedRef = useRef(muted);
  const pausedRef = useRef(isPaused);
  const endAtRef = useRef<number | null>(null);
  const remainingMsRef = useRef(config.workSeconds * 1000);
  const lastPrepareCeilRef = useRef(PREPARE_SECONDS);
  const rafRef = useRef<number | null>(null);
  const configRef = useRef(config);

  configRef.current = config;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    intervalRef.current = currentInterval;
  }, [currentInterval]);

  useEffect(() => {
    completedRef.current = completedIntervals;
  }, [completedIntervals]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const enterWork = useCallback((intervalNumber: number) => {
    const workMs = configRef.current.workSeconds * 1000;
    phaseRef.current = 'work';
    intervalRef.current = intervalNumber;
    setPhase('work');
    setCurrentInterval(intervalNumber);
    setSecondsRemaining(configRef.current.workSeconds);
    remainingMsRef.current = workMs;
    endAtRef.current = performance.now() + workMs;
    void playBeep('start', mutedRef.current);
  }, []);

  const enterPrepare = useCallback(() => {
    const prepareMs = PREPARE_SECONDS * 1000;
    phaseRef.current = 'prepare';
    setPhase('prepare');
    setCurrentInterval(0);
    setSecondsRemaining(PREPARE_SECONDS);
    remainingMsRef.current = prepareMs;
    endAtRef.current = performance.now() + prepareMs;
    lastPrepareCeilRef.current = PREPARE_SECONDS;
    void playBeep('tick', mutedRef.current);
  }, []);

  const enterRest = useCallback(() => {
    const restMs = configRef.current.restSeconds * 1000;
    phaseRef.current = 'rest';
    setPhase('rest');
    setSecondsRemaining(configRef.current.restSeconds);
    remainingMsRef.current = restMs;
    endAtRef.current = performance.now() + restMs;
    void playBeep('end', mutedRef.current);
  }, []);

  const finish = useCallback(() => {
    stopLoop();
    endAtRef.current = null;
    phaseRef.current = 'done';
    setPhase('done');
    setIsPaused(false);
    void playBeep('end', mutedRef.current);
  }, [stopLoop]);

  const advanceFromWork = useCallback(() => {
    const nextCompleted = completedRef.current + 1;
    completedRef.current = nextCompleted;
    setCompletedIntervals(nextCompleted);

    if (nextCompleted >= configRef.current.intervals) {
      finish();
      return;
    }

    if (configRef.current.restSeconds <= 0) {
      enterWork(intervalRef.current + 1);
      return;
    }

    enterRest();
  }, [enterRest, enterWork, finish]);

  // Rest ends → next work immediately. No prepare countdown/ticks after rest.
  const advanceFromRest = useCallback(() => {
    enterWork(intervalRef.current + 1);
  }, [enterWork]);

  const advanceFromPrepare = useCallback(() => {
    enterWork(1);
  }, [enterWork]);

  const tick = useCallback(() => {
    if (pausedRef.current || phaseRef.current === 'idle' || phaseRef.current === 'done') {
      return;
    }

    const endAt = endAtRef.current;
    if (endAt === null) return;

    const remaining = Math.max(0, endAt - performance.now());
    remainingMsRef.current = remaining;
    setSecondsRemaining(remaining / 1000);

    // Countdown ticks only during the one-time prepare phase before the first work.
    // Rest must stay silent until the work-start beep.
    if (phaseRef.current === 'prepare') {
      const ceil = Math.ceil(remaining / 1000);
      if (ceil < lastPrepareCeilRef.current && ceil >= 1) {
        lastPrepareCeilRef.current = ceil;
        void playBeep('tick', mutedRef.current);
      }
    }

    if (remaining <= 0) {
      if (phaseRef.current === 'prepare') {
        advanceFromPrepare();
      } else if (phaseRef.current === 'work') {
        advanceFromWork();
      } else if (phaseRef.current === 'rest') {
        advanceFromRest();
      }
    }

    if (phaseRef.current !== 'done' && phaseRef.current !== 'idle') {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [advanceFromPrepare, advanceFromRest, advanceFromWork]);

  const startLoop = useCallback(() => {
    stopLoop();
    rafRef.current = requestAnimationFrame(tick);
  }, [stopLoop, tick]);

  const start = useCallback(() => {
    completedRef.current = 0;
    setCompletedIntervals(0);
    setIsPaused(false);
    enterPrepare();
    startLoop();
  }, [enterPrepare, startLoop]);

  const pause = useCallback(() => {
    if (
      phaseRef.current === 'idle' ||
      phaseRef.current === 'done' ||
      pausedRef.current
    ) {
      return;
    }
    if (endAtRef.current !== null) {
      remainingMsRef.current = Math.max(0, endAtRef.current - performance.now());
    }
    endAtRef.current = null;
    setIsPaused(true);
    stopLoop();
  }, [stopLoop]);

  const resume = useCallback(() => {
    if (!pausedRef.current || phaseRef.current === 'idle' || phaseRef.current === 'done') {
      return;
    }
    endAtRef.current = performance.now() + remainingMsRef.current;
    setIsPaused(false);
    startLoop();
  }, [startLoop]);

  const skip = useCallback(() => {
    if (phaseRef.current === 'idle' || phaseRef.current === 'done') return;

    if (pausedRef.current) {
      setIsPaused(false);
    }

    if (phaseRef.current === 'prepare') {
      advanceFromPrepare();
    } else if (phaseRef.current === 'work') {
      advanceFromWork();
    } else {
      advanceFromRest();
    }

    if (phaseRef.current !== 'done') {
      startLoop();
    }
  }, [advanceFromPrepare, advanceFromRest, advanceFromWork, startLoop]);

  const abort = useCallback(() => {
    stopLoop();
    endAtRef.current = null;
    phaseRef.current = 'done';
    setPhase('done');
    setIsPaused(false);
  }, [stopLoop]);

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
  }, []);

  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return {
    phase,
    currentInterval,
    secondsRemaining,
    isPaused,
    completedIntervals,
    start,
    pause,
    resume,
    skip,
    abort,
    setMuted,
    muted,
  };
}
