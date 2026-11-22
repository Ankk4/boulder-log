import { useState, type FocusEvent } from 'react';
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
export type WorkoutFormInitial = Omit<WorkoutFormValues, 'muted'> & {
  muted?: boolean;
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

const parseDigits = (text: string): number | null =>
  /^\d+$/.test(text) ? parseInt(text, 10) : null;

const numericInput = { inputMode: 'numeric', pattern: '[0-9]*' } as const;

const selectOnFocus = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.select();
};

const WorkoutFormDialog = ({ open, initial, onClose, onSave }: WorkoutFormDialogProps) => {
  // The parent remounts this dialog (via `key`) each time it opens, so state starts from `initial`.
  const start = initial ? { ...initial, muted: initial.muted ?? false } : defaults;
  const [name, setName] = useState(start.name);
  const [workText, setWorkText] = useState(String(start.workSeconds));
  const [restText, setRestText] = useState(String(start.restSeconds));
  const [intervalsText, setIntervalsText] = useState(String(start.intervals));
  const [muted, setMuted] = useState(start.muted);

  const isEditing = Boolean(initial && 'id' in initial && initial.id);

  const workSeconds = parseDigits(workText);
  const restSeconds = parseDigits(restText);
  const intervals = parseDigits(intervalsText);
  const valid = workSeconds !== null && restSeconds !== null && intervals !== null;
  const canSave =
    name.trim().length > 0 && valid && workSeconds >= 1 && restSeconds >= 0 && intervals >= 1;
  const totalSeconds = valid ? calculateTotalSeconds(workSeconds, restSeconds, intervals) : null;

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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEditing ? 'Edit workout' : 'New interval workout'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="e.g. 5 second holds"
            fullWidth
            autoFocus
          />
          <TextField
            label="Work (seconds)"
            slotProps={{ htmlInput: numericInput }}
            value={workText}
            onFocus={selectOnFocus}
            onChange={(e) => {
              setWorkText(e.target.value);
            }}
            fullWidth
            helperText="Length of each interval / hold"
          />
          <TextField
            label="Rest (seconds)"
            slotProps={{ htmlInput: numericInput }}
            value={restText}
            onFocus={selectOnFocus}
            onChange={(e) => {
              setRestText(e.target.value);
            }}
            fullWidth
            helperText="Rest between intervals"
          />
          <TextField
            label="Intervals"
            slotProps={{ htmlInput: numericInput }}
            value={intervalsText}
            onFocus={selectOnFocus}
            onChange={(e) => {
              setIntervalsText(e.target.value);
            }}
            fullWidth
            helperText="How many work intervals in the set"
          />
          <FormControlLabel
            control={
              <Switch
                checked={muted}
                onChange={(e) => {
                  setMuted(e.target.checked);
                }}
              />
            }
            label="Mute beeps by default"
          />
          <Typography variant="body2" color="text.secondary">
            Total set length:{' '}
            {totalSeconds === null
              ? '–'
              : `${formatDuration(totalSeconds)} (${String(totalSeconds)}s)`}
            , includes {PREPARE_SECONDS}s prepare
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
