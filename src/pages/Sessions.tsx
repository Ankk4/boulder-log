import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Stack
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { db } from '../db';
import type { Session } from '../types';

const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      const allSessions = await db.sessions
        .orderBy('startTime')
        .reverse()
        .toArray();
      setSessions(allSessions);
    };
    loadSessions();
  }, []);

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (sessionToDelete) {
      try {
        // Delete the session
        await db.sessions.delete(sessionToDelete.id);
        
        // Delete associated problems
        await db.problems
          .where('sessionId')
          .equals(sessionToDelete.id)
          .delete();
        
        // Delete associated attempts
        await db.attempts
          .where('sessionId')
          .equals(sessionToDelete.id)
          .delete();
        
        // Update the sessions list
        setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Past Sessions
      </Typography>

      <Paper sx={{ p: 2 }}>
        <List>
          {sessions.map((session) => (
            <ListItem
              key={session.id}
              divider
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteClick(session)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1">
                      {new Date(session.startTime).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(session.startTime).toLocaleTimeString()}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <Box component="span">
                    <Typography component="span" variant="body2" display="block">
                      Duration: {session.duration ? formatDuration(session.duration) : 'N/A'}
                    </Typography>
                    <Typography component="span" variant="body2" display="block">
                      Problems: {session.problems.length}
                    </Typography>
                    <Typography component="span" variant="body2" display="block">
                      Flashes: {session.problems.filter(p => p.flash).length}
                    </Typography>
                    <Typography component="span" variant="body2" display="block">
                      Sends: {session.problems.filter(p => p.send).length}
                    </Typography>
                    {session.preSessionData?.goals.length > 0 && (
                      <Typography component="span" variant="body2" display="block">
                        Goals: {session.preSessionData.goals.join(', ')}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this session? This will also delete all associated problems and attempts. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sessions; 