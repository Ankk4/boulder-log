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
import { useNavigate } from 'react-router-dom';
import type { IntervalWorkout } from '../types';
import { db, useIntervalWorkouts, useRecentIntervalRuns } from '../db';
import WorkoutFormDialog, { type WorkoutFormValues } from '../components/WorkoutFormDialog';
import { calculateTotalSeconds, formatDuration } from '../utils/duration';

const Workouts = () => {
  const navigate = useNavigate();
  const workouts = useIntervalWorkouts();
  const runs = useRecentIntervalRuns(15);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IntervalWorkout | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IntervalWorkout | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (workout: IntervalWorkout) => {
    setEditing(workout);
    setDialogOpen(true);
  };

  const handleSave = async (values: WorkoutFormValues) => {
    await db.saveIntervalWorkout({
      id: editing?.id,
      createdAt: editing?.createdAt,
      ...values,
    });
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await db.deleteIntervalWorkout(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Interval Timer</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New
        </Button>
      </Stack>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Workouts
      </Typography>

      {!workouts ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : workouts.length === 0 ? (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography color="text.secondary">
            No saved workouts yet. Create one with work, rest, and interval count.
          </Typography>
        </Paper>
      ) : (
        <List sx={{ mb: 3 }}>
          {workouts.map((workout) => {
            const total = calculateTotalSeconds(
              workout.workSeconds,
              workout.restSeconds,
              workout.intervals
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
                        onClick={() => navigate(`/workouts/${workout.id}/run`)}
                      >
                        <PlayIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="edit" onClick={() => openEdit(workout)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => setDeleteTarget(workout)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={workout.name}
                    secondary={`${workout.workSeconds}s work · ${workout.restSeconds}s rest · ${workout.intervals} intervals · ${formatDuration(total)}`}
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
        <Typography color="text.secondary">No runs yet.</Typography>
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
        open={dialogOpen}
        initial={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete workout?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete “{deleteTarget?.name}”? Past runs stay in history.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Workouts;
