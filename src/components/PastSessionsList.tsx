import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Stack,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { db } from '../db';
import type { Session } from '../types';
import { sessionStats } from '../utils/sessions';
import { useAppNavigate } from '../hooks/useAppNavigate';

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${String(minutes)} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours)}h ${String(remainingMinutes)}m`;
};

const summaryLine = (session: Session) => {
  const { problems, sends } = sessionStats(session);
  const parts = [
    session.duration ? formatDuration(session.duration) : 'N/A',
    `${String(problems)} ${problems === 1 ? 'problem' : 'problems'}`,
    `${String(sends)} ${sends === 1 ? 'send' : 'sends'}`,
  ];
  const rpe = session.postSessionReview?.rpe;
  if (rpe !== null && rpe !== undefined) parts.push(`RPE ${String(rpe)}`);
  return parts.join(' · ');
};

const PastSessionsList = () => {
  const navigate = useAppNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await db.sessions.orderBy('startTime').reverse().toArray();
        setSessions(allSessions.filter((s) => s.endTime !== null));
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };
    void loadSessions();
  }, []);

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (sessionToDelete) {
      try {
        await db.deleteSession(sessionToDelete.id);
        setSessions(sessions.filter((s) => s.id !== sessionToDelete.id));
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  return (
    <>
      <Paper sx={{ p: 2 }}>
        {sessions.length === 0 ? (
          <Typography color="text.secondary">No past sessions yet.</Typography>
        ) : (
          <List>
            {sessions.map((session) => (
              <ListItem
                key={session.id}
                divider
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => {
                      handleDeleteClick(session);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemButton
                  onClick={() => {
                    navigate(`/sessions/${session.id}`);
                  }}
                  sx={{ pr: 7 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {new Date(session.startTime).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {summaryLine(session)}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this session? This will also delete all associated
            problems and attempts. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleDeleteConfirm();
            }}
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PastSessionsList;
