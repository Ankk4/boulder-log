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
import { alpha, useTheme } from '@mui/material/styles';
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
import { useRequestFocusMode } from '../hooks/useFocusMode';
import { CONTENT_MAX_WIDTH } from '../theme/layout';
import { useWakeLock } from '../hooks/useWakeLock';
import { unlockAudio } from '../utils/beep';
import {
  calculateTotalSeconds,
  formatCountdown,
  formatDuration,
  PREPARE_SECONDS,
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

  const isRunning = timer.phase === 'prepare' || timer.phase === 'work' || timer.phase === 'rest';
  useRequestFocusMode(isRunning);

  useWakeLock(hasStarted && timer.phase !== 'done');

  const muiTheme = useTheme();
  // Only a running phase gets its own colour; idle and done/stopped use the normal page.
  const phaseColors =
    timer.phase === 'prepare' || timer.phase === 'work' || timer.phase === 'rest'
      ? muiTheme.palette.phase[timer.phase]
      : { bg: muiTheme.palette.background.default, text: muiTheme.palette.text.primary };
  const theme = {
    bgcolor: phaseColors.bg,
    color: phaseColors.text,
    muted: alpha(phaseColors.text, 0.85),
    progress: alpha(phaseColors.text, 0.35),
  };
  const outlinedSx = {
    borderColor: alpha(phaseColors.text, 0.7),
    color: theme.color,
    '&:hover': { borderColor: theme.color, bgcolor: alpha(phaseColors.text, 0.1) },
  };
  const filledSx = { bgcolor: theme.color, color: theme.bgcolor };

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
    [timer.completedIntervals, timer.muted, workout],
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
        <Button
          startIcon={<BackIcon />}
          onClick={() => {
            navigate('/workouts');
          }}
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Box>
    );
  }

  const totalSeconds = calculateTotalSeconds(
    workout.workSeconds,
    workout.restSeconds,
    workout.intervals,
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
    workout.intervals > 0 ? Math.min(100, (timer.completedIntervals / workout.intervals) * 100) : 0;

  const handleStart = async () => {
    try {
      await unlockAudio();
    } catch (error) {
      console.error('Error unlocking audio:', error);
      return;
    }
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
    <Box
      sx={{
        minHeight: isRunning ? '100dvh' : undefined,
        bgcolor: theme.bgcolor,
        color: theme.color,
        transition: 'background-color 0.25s ease',
      }}
    >
      <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto', p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
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
            onClick={() => {
              timer.setMuted(!timer.muted);
            }}
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
                ? `0 / ${String(workout.intervals)}`
                : `${String(Math.min(timer.currentInterval, workout.intervals))} / ${String(workout.intervals)}`}
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
          <Button
            fullWidth
            size="large"
            variant="contained"
            onClick={() => {
              void handleStart();
            }}
          >
            Start
          </Button>
        )}

        {isRunning && (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
            {timer.isPaused ? (
              <Button
                variant="contained"
                color="inherit"
                startIcon={<PlayIcon />}
                onClick={() => {
                  void unlockAudio();
                  timer.resume();
                }}
                sx={filledSx}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<PauseIcon />}
                onClick={timer.pause}
                sx={outlinedSx}
              >
                Pause
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<SkipIcon />}
              onClick={timer.skip}
              sx={outlinedSx}
            >
              Skip
            </Button>
            <Button
              variant="outlined"
              startIcon={<StopIcon />}
              onClick={handleAbort}
              sx={outlinedSx}
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
                : `Stopped after ${String(timer.completedIntervals)} interval${timer.completedIntervals === 1 ? '' : 's'}.`}
            </Typography>
            <Button fullWidth variant="contained" onClick={handleBack} sx={filledSx}>
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
              sx={outlinedSx}
            >
              Run again
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default WorkoutRun;
