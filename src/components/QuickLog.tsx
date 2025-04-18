import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  FlashOn as FlashIcon,
  Check as SendIcon,
  FitnessCenterRounded as AttemptIcon
} from '@mui/icons-material';
import DifficultySelect from './DifficultySelect';
import { AttemptType } from '../types';
import type { SessionProblem, Attempt } from '../types';

interface QuickLogProps {
  sessionId: string;
  problems: SessionProblem[];
  onAddProblem: (problem: Omit<SessionProblem, 'id' | 'attempts'>) => void;
  onAddAttempt: (problemId: string, type: AttemptType) => void;
}

const QuickLog = ({ sessionId, problems, onAddProblem, onAddAttempt }: QuickLogProps) => {
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [newProblemName, setNewProblemName] = useState('');
  const [newFrenchGrade, setNewFrenchGrade] = useState('');
  const [newColorGrade, setNewColorGrade] = useState('');

  const handleAddProblem = () => {
    if (newProblemName && (newFrenchGrade || newColorGrade)) {
      console.log('QuickLog: Adding new problem');
      console.log('Name:', newProblemName);
      console.log('French Grade:', newFrenchGrade);
      console.log('Color Grade:', newColorGrade);
      
      onAddProblem({
        name: newProblemName,
        frenchGrade: newFrenchGrade,
        colorGrade: newColorGrade,
        sessionId,
        createdAt: new Date().toISOString(),
        flash: false,
        send: false
      });
      
      console.log('QuickLog: Problem data sent to parent');
      
      setNewProblemName('');
      setNewFrenchGrade('');
      setNewColorGrade('');
      setIsAddingProblem(false);
    } else {
      console.log('QuickLog: Missing required fields');
      console.log('Name:', newProblemName);
      console.log('French Grade:', newFrenchGrade);
      console.log('Color Grade:', newColorGrade);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddingProblem(true)}
        >
          Add Problem
        </Button>
      </Stack>

      <List>
        {problems.map((problem) => (
          <Paper key={problem.id} sx={{ mb: 2, p: 1 }}>
            <ListItem
              secondaryAction={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Mark as flashed (completed first try)">
                    <span>
                      <IconButton
                        onClick={() => onAddAttempt(problem.id, AttemptType.FLASH)}
                        color={problem.flash ? 'success' : 'default'}
                        disabled={problem.flash || problem.send || problem.attempts.length > 0}
                        data-testid="flash-button"
                      >
                        <FlashIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Mark as sent (completed)">
                    <span>
                      <IconButton
                        onClick={() => onAddAttempt(problem.id, AttemptType.SEND)}
                        color={problem.send ? 'success' : 'default'}
                        disabled={problem.flash || problem.send}
                        data-testid="send-button"
                      >
                        <SendIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Log an attempt">
                    <Badge 
                      badgeContent={problem.attempts.filter(a => a.type === AttemptType.ATTEMPT).length} 
                      color="primary"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}
                    >
                      <IconButton
                        onClick={() => onAddAttempt(problem.id, AttemptType.ATTEMPT)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        data-testid="attempt-button"
                      >
                        <AttemptIcon />
                      </IconButton>
                    </Badge>
                  </Tooltip>
                </Stack>
              }
              sx={{
                '& .MuiListItemText-root': {
                  marginRight: '120px', // Add space for the icons
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle1" noWrap>
                    {problem.name}
                    {problem.flash && ' 🌟'}
                    {problem.send && ' ✓'}
                  </Typography>
                }
                secondary={
                  <>
                    {problem.frenchGrade && `French Grade: ${problem.frenchGrade}`}
                    {problem.frenchGrade && problem.colorGrade && ' | '}
                    {problem.colorGrade && `Color: ${problem.colorGrade}`}
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      Attempts: {problem.attempts.filter(a => a.type === AttemptType.ATTEMPT).length}
                      {(problem.flash || problem.send) && ' • Completed'}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>

      <Dialog open={isAddingProblem} onClose={() => setIsAddingProblem(false)}>
        <DialogTitle>Add New Problem</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Problem Name"
            fullWidth
            value={newProblemName}
            onChange={(e) => setNewProblemName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <DifficultySelect
            frenchGrade={newFrenchGrade}
            colorGrade={newColorGrade}
            onFrenchGradeChange={setNewFrenchGrade}
            onColorGradeChange={setNewColorGrade}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingProblem(false)}>Cancel</Button>
          <Button onClick={handleAddProblem} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickLog; 