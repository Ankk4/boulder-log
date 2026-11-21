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
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import type { IntervalWorkout } from '../types';
import { db, useIntervalWorkouts, useRecentIntervalRuns } from '../db';
import WorkoutFormDialog, {
  type WorkoutFormInitial,
  type WorkoutFormValues,
} from '../components/WorkoutFormDialog';
import { calculateTotalSeconds, formatDuration } from '../utils/duration';
import { WORKOUT_PRESETS, type WorkoutPreset } from '../utils/workoutPresets';

const Workouts = () => {
  const navigate = useNavigate();
  const workouts = useIntervalWorkouts();
  const runs = useRecentIntervalRuns(15);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [formInitial, setFormInitial] = useState<WorkoutFormInitial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IntervalWorkout | null>(null);

  const openCreate = () => {
    setFormInitial(null);
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const openEdit = (workout: IntervalWorkout) => {
    setFormInitial(workout);
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const openPreset = (preset: WorkoutPreset) => {
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
    const editingId = formInitial && 'id' in formInitial ? formInitial.id : undefined;
    try {
      await db.saveIntervalWorkout({
        id: editingId,
        createdAt: formInitial && 'createdAt' in formInitial ? formInitial.createdAt : undefined,
        ...values,
      });
    } catch (error) {
      console.error('Error saving workout:', error);
      return;
    }
    setDialogOpen(false);
    setFormInitial(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await db.deleteIntervalWorkout(deleteTarget.id);
    } catch (error) {
      console.error('Error deleting workout:', error);
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

      <Typography variant="h6" sx={{ mb: 1 }}>
        Presets
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
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

      <Typography variant="h6" sx={{ mb: 1 }}>
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
                        aria-label="start"
                        color="primary"
                        onClick={() => {
                          navigate(`/workouts/${workout.id}/run`);
                        }}
                      >
                        <PlayIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => {
                          openEdit(workout);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
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

      <Typography variant="h6" sx={{ mb: 1 }}>
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
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Box>
                  <Typography variant="subtitle1">{run.workoutName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {run.completedIntervals}/{run.intervals} intervals ·{' '}
                    {new Date(run.startedAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={run.status}
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
        onClose={() => {
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
