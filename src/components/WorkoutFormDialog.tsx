import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import type { IntervalWorkout } from '../types';
import { calculateTotalSeconds, formatDuration, PREPARE_SECONDS } from '../utils/duration';

export type WorkoutFormValues = {
  name: string;
  workSeconds: number;
  restSeconds: number;
  intervals: number;
  muted: boolean;
};

/** Saved workout or draft values used to prefill the form (e.g. presets). */
export type WorkoutFormInitial = WorkoutFormValues & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface WorkoutFormDialogProps {
  open: boolean;
  initial?: WorkoutFormInitial | IntervalWorkout | null;
  onClose: () => void;
  onSave: (values: WorkoutFormValues) => void;
}

const defaults: WorkoutFormValues = {
  name: '',
  workSeconds: 5,
  restSeconds: 5,
  intervals: 6,
  muted: false,
};

const WorkoutFormDialog = ({
  open,
  initial,
  onClose,
  onSave,
}: WorkoutFormDialogProps) => {
  const [name, setName] = useState(defaults.name);
  const [workSeconds, setWorkSeconds] = useState(defaults.workSeconds);
  const [restSeconds, setRestSeconds] = useState(defaults.restSeconds);
  const [intervals, setIntervals] = useState(defaults.intervals);
  const [muted, setMuted] = useState(defaults.muted);

  const isEditing = Boolean(initial && 'id' in initial && initial.id);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setWorkSeconds(initial.workSeconds);
      setRestSeconds(initial.restSeconds);
      setIntervals(initial.intervals);
      setMuted(initial.muted ?? false);
    } else {
      setName(defaults.name);
      setWorkSeconds(defaults.workSeconds);
      setRestSeconds(defaults.restSeconds);
      setIntervals(defaults.intervals);
      setMuted(defaults.muted);
    }
  }, [open, initial]);

  const totalSeconds = calculateTotalSeconds(workSeconds, restSeconds, intervals);
  const canSave =
    name.trim().length > 0 &&
    workSeconds > 0 &&
    restSeconds >= 0 &&
    intervals > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      workSeconds,
      restSeconds,
      intervals,
      muted,
    });
  };

  const parsePositiveInt = (value: string, fallback: number): number => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEditing ? 'Edit workout' : 'New interval workout'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 5 second holds"
            fullWidth
            autoFocus
          />
          <TextField
            label="Work (seconds)"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            value={workSeconds}
            onChange={(e) => setWorkSeconds(Math.max(1, parsePositiveInt(e.target.value, 1)))}
            fullWidth
            helperText="Length of each interval / hold"
          />
          <TextField
            label="Rest (seconds)"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={restSeconds}
            onChange={(e) => setRestSeconds(Math.max(0, parsePositiveInt(e.target.value, 0)))}
            fullWidth
            helperText="Rest between intervals"
          />
          <TextField
            label="Intervals"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            value={intervals}
            onChange={(e) => setIntervals(Math.max(1, parsePositiveInt(e.target.value, 1)))}
            fullWidth
            helperText="How many work intervals in the set"
          />
          <FormControlLabel
            control={
              <Switch checked={muted} onChange={(e) => setMuted(e.target.checked)} />
            }
            label="Mute beeps by default"
          />
          <Typography variant="body2" color="text.secondary">
            Total set length: {formatDuration(totalSeconds)} ({totalSeconds}s), includes{' '}
            {PREPARE_SECONDS}s prepare
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!canSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkoutFormDialog;
