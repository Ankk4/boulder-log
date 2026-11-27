import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router';
import PageHeader from '../components/PageHeader';
import type { IntervalWorkout } from '../types';
import { db, useIntervalWorkouts, useRecentIntervalRuns } from '../db';
import WorkoutFormDialog, {
  type WorkoutFormInitial,
  type WorkoutFormValues,
} from '../components/WorkoutFormDialog';
import { calculateTotalSeconds, formatDuration } from '../utils/duration';
import { WORKOUT_PRESETS, type WorkoutPreset } from '../utils/workoutPresets';

const Workouts = () => {
  const workouts = useIntervalWorkouts();
  const runs = useRecentIntervalRuns(15);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [formInitial, setFormInitial] = useState<WorkoutFormInitial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IntervalWorkout | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const openCreate = () => {
    setSaveError(false);
    setFormInitial(null);
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const openEdit = (workout: IntervalWorkout) => {
    setSaveError(false);
    setFormInitial(workout);
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const openPreset = (preset: WorkoutPreset) => {
    setSaveError(false);
    setFormInitial({
      name: preset.name,
      workSeconds: preset.workSeconds,
      restSeconds: preset.restSeconds,
      intervals: preset.intervals,
      muted: false,
    });
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const handleSave = async (values: WorkoutFormValues) => {
    setSaveError(false);
    const editingId = formInitial && 'id' in formInitial ? formInitial.id : undefined;
    try {
      await db.saveIntervalWorkout({
        id: editingId,
        createdAt: formInitial && 'createdAt' in formInitial ? formInitial.createdAt : undefined,
        ...values,
      });
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaveError(true);
      return;
    }
    setDialogOpen(false);
    setFormInitial(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(false);
    try {
      await db.deleteIntervalWorkout(deleteTarget.id);
    } catch (error) {
      console.error('Error deleting workout:', error);
      setDeleteError(true);
      return;
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader
        title="Interval timer"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New
          </Button>
        }
      />

      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
        Presets
      </Typography>
      <Stack direction="row" sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {WORKOUT_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            label={`${preset.name} (${String(preset.workSeconds)}/${String(preset.restSeconds)}×${String(preset.intervals)})`}
            onClick={() => {
              openPreset(preset);
            }}
            clickable
            variant="outlined"
          />
        ))}
      </Stack>

      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
        Workouts
      </Typography>

      {!workouts ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : workouts.length === 0 ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography color="text.secondary">
            No saved workouts yet. Pick a preset or create one with work, rest, and interval count.
          </Typography>
        </Paper>
      ) : (
        <List sx={{ mb: 3 }}>
          {workouts.map((workout) => {
            const total = calculateTotalSeconds(
              workout.workSeconds,
              workout.restSeconds,
              workout.intervals,
            );
            return (
              <Paper key={workout.id} sx={{ mb: 1.5 }}>
                <ListItem
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        edge="end"
                        aria-label={`Start ${workout.name}`}
                        color="primary"
                        component={RouterLink}
                        to={`/workouts/${workout.id}/run`}
                      >
                        <PlayIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label={`Edit ${workout.name}`}
                        onClick={() => {
                          openEdit(workout);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label={`Delete ${workout.name}`}
                        onClick={() => {
                          setDeleteError(false);
                          setDeleteTarget(workout);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={workout.name}
                    secondary={`${String(workout.workSeconds)}s work · ${String(workout.restSeconds)}s rest · ${String(workout.intervals)} intervals · ${formatDuration(total)}`}
                    sx={{ pr: 12 }}
                  />
                </ListItem>
              </Paper>
            );
          })}
        </List>
      )}

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
        Recent runs
      </Typography>

      {!runs ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : runs.length === 0 ? (
        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">No runs yet.</Typography>
        </Paper>
      ) : (
        <List>
          {runs.map((run) => (
            <Paper key={run.id} sx={{ mb: 1, p: 1.5 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Box>
                  <Typography variant="subtitle1">{run.workoutName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {run.completedIntervals}/{run.intervals} intervals ·{' '}
                    {new Date(run.startedAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={run.status === 'completed' ? 'Completed' : 'Aborted'}
                  color={run.status === 'completed' ? 'success' : 'default'}
                />
              </Stack>
            </Paper>
          ))}
        </List>
      )}

      <WorkoutFormDialog
        key={dialogKey}
        open={dialogOpen}
        initial={formInitial}
        error={saveError ? "Couldn't save. Try again." : undefined}
        onClose={() => {
          setSaveError(false);
          setDialogOpen(false);
          setFormInitial(null);
        }}
        onSave={(values) => {
          void handleSave(values);
        }}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
        }}
      >
        <DialogTitle>Delete workout?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete “{deleteTarget?.name}”? Past runs stay in history.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Couldn&apos;t delete. Try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteTarget(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleDelete();
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Workouts;
