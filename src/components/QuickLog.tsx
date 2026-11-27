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
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FlashOn as FlashIcon,
  Check as SendIcon,
  FitnessCenterRounded as AttemptIcon,
} from '@mui/icons-material';
import GradePicker from './GradePicker';
import { useProblemsAtGrade } from '../db/index';
import { autoName, gradeLabel, lastUsedGrades, summarizeLastTime } from '../utils/problemDefaults';
import { AttemptType } from '../types';
import type { SessionProblem } from '../types';
import { LIMITS, sanitizeGrade, sanitizeProblemName } from '../utils/validation';

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

  const label = gradeLabel({ frenchGrade: newFrenchGrade, colorGrade: newColorGrade });
  const history = useProblemsAtGrade(label);
  const lastTime = label && history ? summarizeLastTime(history, sessionId, label) : null;

  const openDialog = () => {
    const last = lastUsedGrades(problems);
    setNewFrenchGrade(last?.frenchGrade ?? '');
    setNewColorGrade(last?.colorGrade ?? '');
    setNewProblemName('');
    setIsAddingProblem(true);
  };

  const handleAddProblem = () => {
    const frenchGrade = sanitizeGrade(newFrenchGrade);
    const colorGrade = sanitizeGrade(newColorGrade);
    const gradeText = gradeLabel({ frenchGrade, colorGrade });
    const name = sanitizeProblemName(newProblemName) || autoName(problems, gradeText);

    if (gradeText) {
      if (import.meta.env.DEV) {
        console.log('QuickLog: Adding new problem');
        console.log('Name:', name);
        console.log('French Grade:', frenchGrade);
        console.log('Color Grade:', colorGrade);
      }

      onAddProblem({
        name,
        frenchGrade,
        colorGrade,
        sessionId,
        createdAt: new Date().toISOString(),
        flash: false,
        send: false,
      });

      setNewProblemName('');
      setNewFrenchGrade('');
      setNewColorGrade('');
      setIsAddingProblem(false);
    } else if (import.meta.env.DEV) {
      console.log('QuickLog: Missing required fields');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
          Add Problem
        </Button>
      </Stack>

      <List>
        {problems.map((problem) => (
          <Paper key={problem.id} sx={{ mb: 2, p: 1 }}>
            <ListItem
              secondaryAction={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Tooltip title="Mark as flashed (completed first try)">
                    <span>
                      <IconButton
                        onClick={() => {
                          onAddAttempt(problem.id, AttemptType.FLASH);
                        }}
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
                        onClick={() => {
                          onAddAttempt(problem.id, AttemptType.SEND);
                        }}
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
                      badgeContent={
                        problem.attempts.filter((a) => a.type === AttemptType.ATTEMPT).length
                      }
                      color="primary"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}
                    >
                      <IconButton
                        onClick={() => {
                          onAddAttempt(problem.id, AttemptType.ATTEMPT);
                        }}
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
                },
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
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      Attempts:{' '}
                      {problem.attempts.filter((a) => a.type === AttemptType.ATTEMPT).length}
                      {(problem.flash || problem.send) && ' • Completed'}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>

      <Dialog
        open={isAddingProblem}
        onClose={() => {
          setIsAddingProblem(false);
        }}
      >
        <DialogTitle>Add New Problem</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Problem Name"
            fullWidth
            value={newProblemName}
            slotProps={{ htmlInput: { maxLength: LIMITS.problemName } }}
            onChange={(e) => {
              setNewProblemName(e.target.value);
            }}
            sx={{ mb: 2 }}
          />
          <GradePicker
            frenchGrade={newFrenchGrade}
            colorGrade={newColorGrade}
            onFrenchGradeChange={setNewFrenchGrade}
            onColorGradeChange={setNewColorGrade}
          />
          {lastTime && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {`Last time at ${lastTime.label} (${lastTime.date}): ${String(lastTime.count)} problems, ${String(lastTime.sent)} sent, ${String(lastTime.flashed)} flashed`}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAddingProblem(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleAddProblem} variant="contained" disabled={!label}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuickLog;
