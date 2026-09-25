import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
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
import { unlockAudio } from '../utils/beep';
import {
  calculateTotalSeconds,
  formatCountdown,
  formatDuration,
} from '../utils/duration';
import type { IntervalRun } from '../types';

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
    timer.phase === 'work'
      ? 'WORK'
      : timer.phase === 'rest'
        ? 'REST'
        : timer.phase === 'done'
          ? timer.completedIntervals >= workout.intervals
            ? 'DONE'
            : 'STOPPED'
          : 'READY';

  const phaseColor =
    timer.phase === 'work'
      ? 'error.main'
      : timer.phase === 'rest'
        ? 'info.main'
        : timer.phase === 'done'
          ? 'success.main'
          : 'text.primary';

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

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton aria-label="back" onClick={handleBack}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">{workout.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {workout.workSeconds}s / {workout.restSeconds}s · {workout.intervals} intervals ·{' '}
            {formatDuration(totalSeconds)}
          </Typography>
        </Box>
        <IconButton
          aria-label={timer.muted ? 'unmute' : 'mute'}
          onClick={() => timer.setMuted(!timer.muted)}
        >
          {timer.muted ? <MuteIcon /> : <UnmuteIcon />}
        </IconButton>
      </Stack>

      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          mb: 3,
          bgcolor:
            timer.phase === 'work'
              ? 'rgba(211, 47, 47, 0.06)'
              : timer.phase === 'rest'
                ? 'rgba(2, 136, 209, 0.06)'
                : 'background.paper',
        }}
      >
        <Typography variant="overline" sx={{ color: phaseColor, letterSpacing: 2 }}>
          {phaseLabel}
          {timer.isPaused ? ' · PAUSED' : ''}
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            my: 1,
            fontSize: { xs: '4rem', sm: '5rem' },
          }}
        >
          {timer.phase === 'idle' || timer.phase === 'done'
            ? formatCountdown(workout.workSeconds)
            : formatCountdown(timer.secondsRemaining)}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {timer.phase === 'idle'
            ? `0 / ${workout.intervals}`
            : `${Math.min(timer.currentInterval, workout.intervals)} / ${workout.intervals}`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mt: 3, height: 8, borderRadius: 1 }}
        />
      </Paper>

      {timer.phase === 'idle' && (
        <Button fullWidth size="large" variant="contained" onClick={handleStart}>
          Start
        </Button>
      )}

      {(timer.phase === 'work' || timer.phase === 'rest') && (
        <Stack direction="row" spacing={1} justifyContent="center">
          {timer.isPaused ? (
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => {
                void unlockAudio();
                timer.resume();
              }}
            >
              Resume
            </Button>
          ) : (
            <Button variant="outlined" startIcon={<PauseIcon />} onClick={timer.pause}>
              Pause
            </Button>
          )}
          <Button variant="outlined" startIcon={<SkipIcon />} onClick={timer.skip}>
            Skip
          </Button>
          <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={handleAbort}>
            Stop
          </Button>
        </Stack>
      )}

      {timer.phase === 'done' && (
        <Stack spacing={1}>
          <Typography align="center" color="text.secondary">
            {timer.completedIntervals >= workout.intervals
              ? 'Set complete. Saved to history.'
              : `Stopped after ${timer.completedIntervals} interval${timer.completedIntervals === 1 ? '' : 's'}.`}
          </Typography>
          <Button fullWidth variant="contained" onClick={handleBack}>
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
          >
            Run again
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default WorkoutRun;
