import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  SkipNext as SkipIcon,
  Stop as StopIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { db, useIntervalWorkout } from '../db';
import { useIntervalTimer } from '../hooks/useIntervalTimer';
import { useWakeLock } from '../hooks/useWakeLock';
import { unlockAudio } from '../utils/beep';
import {
  calculateTotalSeconds,
  formatCountdown,
  formatDuration,
  PREPARE_SECONDS,
} from '../utils/duration';
import type { IntervalRun } from '../types';

const PHASE_STYLES = {
  idle: {
    bgcolor: '#f5f5f5',
    color: '#212121',
    muted: 'rgba(0, 0, 0, 0.6)',
    progress: 'rgba(0, 0, 0, 0.2)',
  },
  prepare: {
    bgcolor: '#e65100',
    color: '#fff',
    muted: 'rgba(255, 255, 255, 0.85)',
    progress: 'rgba(255, 255, 255, 0.35)',
  },
  work: {
    bgcolor: '#b71c1c',
    color: '#fff',
    muted: 'rgba(255, 255, 255, 0.85)',
    progress: 'rgba(255, 255, 255, 0.35)',
  },
  rest: {
    bgcolor: '#01579b',
    color: '#fff',
    muted: 'rgba(255, 255, 255, 0.85)',
    progress: 'rgba(255, 255, 255, 0.35)',
  },
  done: {
    bgcolor: '#1b5e20',
    color: '#fff',
    muted: 'rgba(255, 255, 255, 0.85)',
    progress: 'rgba(255, 255, 255, 0.35)',
  },
} as const;

const WorkoutRun = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workout = useIntervalWorkout(id);
  const startedAtRef = useRef<string | null>(null);
  const persistedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);

  const timer = useIntervalTimer({
    workSeconds: workout?.workSeconds ?? 5,
    restSeconds: workout?.restSeconds ?? 5,
    intervals: workout?.intervals ?? 1,
    muted: workout?.muted ?? false,
  });

  useWakeLock(hasStarted && timer.phase !== 'done');

  useEffect(() => {
    if (workout && !hasStarted) {
      timer.setMuted(workout.muted);
    }
    // Only sync mute from saved workout before the run starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout?.id, workout?.muted, hasStarted]);

  const persistRun = useCallback(
    async (status: 'completed' | 'aborted') => {
      if (!workout || persistedRef.current || !startedAtRef.current) return;
      persistedRef.current = true;

      const run: IntervalRun = {
        id: Date.now().toString(),
        workoutId: workout.id,
        workoutName: workout.name,
        workSeconds: workout.workSeconds,
        restSeconds: workout.restSeconds,
        intervals: workout.intervals,
        completedIntervals: timer.completedIntervals,
        startedAt: startedAtRef.current,
        completedAt: new Date().toISOString(),
        status,
      };

      await db.addIntervalRun(run);

      if (timer.muted !== workout.muted) {
        await db.saveIntervalWorkout({
          ...workout,
          muted: timer.muted,
        });
      }
    },
    [timer.completedIntervals, timer.muted, workout]
  );

  useEffect(() => {
    if (timer.phase === 'done' && hasStarted) {
      const status =
        timer.completedIntervals >= (workout?.intervals ?? 0) ? 'completed' : 'aborted';
      void persistRun(status);
    }
  }, [timer.phase, timer.completedIntervals, hasStarted, workout, persistRun]);

  if (workout === undefined) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (workout === null || !id) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Workout not found</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/workouts')} sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  const totalSeconds = calculateTotalSeconds(
    workout.workSeconds,
    workout.restSeconds,
    workout.intervals
  );

  const phaseLabel =
    timer.phase === 'prepare'
      ? 'PREPARE'
      : timer.phase === 'work'
        ? 'WORK'
        : timer.phase === 'rest'
          ? 'REST'
          : timer.phase === 'done'
            ? timer.completedIntervals >= workout.intervals
              ? 'DONE'
              : 'STOPPED'
            : 'READY';

  const progress =
    workout.intervals > 0
      ? Math.min(100, (timer.completedIntervals / workout.intervals) * 100)
      : 0;

  const handleStart = async () => {
    await unlockAudio();
    startedAtRef.current = new Date().toISOString();
    persistedRef.current = false;
    setHasStarted(true);
    timer.start();
  };

  const handleAbort = () => {
    timer.abort();
  };

  const handleBack = () => {
    navigate('/workouts');
  };

  const isRunning =
    timer.phase === 'prepare' || timer.phase === 'work' || timer.phase === 'rest';

  const theme = PHASE_STYLES[timer.phase];

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 56px)',
        mb: -7,
        p: 2,
        pb: 9,
        bgcolor: theme.bgcolor,
        color: theme.color,
        transition: 'background-color 0.25s ease',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton aria-label="back" onClick={handleBack} sx={{ color: theme.color }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ color: theme.color }}>
            {workout.name}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.muted }}>
            {workout.workSeconds}s / {workout.restSeconds}s · {workout.intervals} intervals ·{' '}
            {formatDuration(totalSeconds)} (incl. {PREPARE_SECONDS}s prepare)
          </Typography>
        </Box>
        <IconButton
          aria-label={timer.muted ? 'unmute' : 'mute'}
          onClick={() => timer.setMuted(!timer.muted)}
          sx={{ color: theme.color }}
        >
          {timer.muted ? <MuteIcon /> : <UnmuteIcon />}
        </IconButton>
      </Stack>

      <Box sx={{ textAlign: 'center', py: 4, mb: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: theme.color, letterSpacing: 3, fontWeight: 700, fontSize: '1rem' }}
        >
          {phaseLabel}
          {timer.isPaused ? ' · PAUSED' : ''}
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            my: 1,
            fontSize: { xs: '5rem', sm: '6.5rem' },
            fontWeight: 700,
            color: theme.color,
            lineHeight: 1,
          }}
        >
          {timer.phase === 'idle' || timer.phase === 'done'
            ? formatCountdown(workout.workSeconds)
            : formatCountdown(timer.secondsRemaining)}
        </Typography>
        <Typography variant="h6" sx={{ color: theme.muted }}>
          {timer.phase === 'prepare'
            ? 'Get ready'
            : timer.phase === 'idle'
              ? `0 / ${workout.intervals}`
              : `${Math.min(timer.currentInterval, workout.intervals)} / ${workout.intervals}`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 3,
            height: 10,
            borderRadius: 1,
            bgcolor: theme.progress,
            '& .MuiLinearProgress-bar': {
              bgcolor: theme.color,
            },
          }}
        />
      </Box>

      {timer.phase === 'idle' && (
        <Button fullWidth size="large" variant="contained" onClick={handleStart}>
          Start
        </Button>
      )}

      {isRunning && (
        <Stack direction="row" spacing={1} justifyContent="center">
          {timer.isPaused ? (
            <Button
              variant="contained"
              color="inherit"
              startIcon={<PlayIcon />}
              onClick={() => {
                void unlockAudio();
                timer.resume();
              }}
              sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: theme.bgcolor }}
            >
              Resume
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<PauseIcon />}
              onClick={timer.pause}
              sx={{
                borderColor: 'rgba(255,255,255,0.7)',
                color: theme.color,
                '&:hover': { borderColor: theme.color, bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Pause
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<SkipIcon />}
            onClick={timer.skip}
            sx={{
              borderColor: 'rgba(255,255,255,0.7)',
              color: theme.color,
              '&:hover': { borderColor: theme.color, bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Skip
          </Button>
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={handleAbort}
            sx={{
              borderColor: 'rgba(255,255,255,0.7)',
              color: theme.color,
              '&:hover': { borderColor: theme.color, bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Stop
          </Button>
        </Stack>
      )}

      {timer.phase === 'done' && (
        <Stack spacing={1}>
          <Typography align="center" sx={{ color: theme.muted }}>
            {timer.completedIntervals >= workout.intervals
              ? 'Set complete. Saved to history.'
              : `Stopped after ${timer.completedIntervals} interval${timer.completedIntervals === 1 ? '' : 's'}.`}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={handleBack}
            sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: theme.bgcolor }}
          >
            Back to workouts
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              persistedRef.current = false;
              startedAtRef.current = null;
              setHasStarted(false);
              void handleStart();
            }}
            sx={{
              borderColor: 'rgba(255,255,255,0.7)',
              color: theme.color,
              '&:hover': { borderColor: theme.color, bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Run again
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default WorkoutRun;
