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
  Typography,
  List,
  Paper,
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
    setNewFrenchGrade(last?.frenchGrade ?? '');
    setNewColorGrade(last?.colorGrade ?? '');
    setNewProblemName('');
    setIsAddingProblem(true);
  };

  const last = lastUsedGrades(problems);
  const lastLabel = last ? gradeLabel(last) : '';

  const handleOneTapAdd = () => {
    if (!last || !lastLabel) return;
    onAddProblem({
      name: autoName(problems, lastLabel),
      frenchGrade: last.frenchGrade,
      colorGrade: last.colorGrade,
      sessionId,
      createdAt: new Date().toISOString(),
      flash: false,
      send: false,
    });
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
      <Stack
        direction="row"
        sx={{
          gap: 1,
          mb: 2,
          py: 1,
          position: { xs: 'sticky', md: 'static' },
          bottom: 'calc(56px + env(safe-area-inset-bottom))',
          bgcolor: 'background.default',
          zIndex: 1,
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openDialog}
          sx={{ minHeight: 48 }}
        >
          Add Problem
        </Button>
        {last && (
          <Button variant="outlined" onClick={handleOneTapAdd} sx={{ minHeight: 48 }}>
            {`Add ${lastLabel}`}
          </Button>
        )}
      </Stack>

      <List>
        {problems.map((problem) => {
          const attemptCount = problem.attempts.filter(
            (a) => a.type === AttemptType.ATTEMPT,
          ).length;
          return (
            <Paper key={problem.id} sx={{ mb: 2, p: 1.5 }}>
              <Typography variant="subtitle1" noWrap>
                {problem.name}
                {problem.flash && ' 🌟'}
                {problem.send && ' ✓'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {problem.frenchGrade && `French Grade: ${problem.frenchGrade}`}
                {problem.frenchGrade && problem.colorGrade && ' | '}
                {problem.colorGrade && `Color: ${problem.colorGrade}`}
                {(problem.flash || problem.send) && ' • Completed'}
              </Typography>
              <Stack direction="row" sx={{ gap: 1, mt: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<AttemptIcon />}
                  onClick={() => {
                    onAddAttempt(problem.id, AttemptType.ATTEMPT);
                  }}
                  sx={{ minHeight: 48, flex: 1 }}
                  data-testid="attempt-button"
                >
                  {`Attempt (${String(attemptCount)})`}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FlashIcon />}
                  color={problem.flash ? 'success' : 'primary'}
                  onClick={() => {
                    onAddAttempt(problem.id, AttemptType.FLASH);
                  }}
                  disabled={problem.flash || problem.send || problem.attempts.length > 0}
                  sx={{ minHeight: 48, flex: 1 }}
                  data-testid="flash-button"
                >
                  Flash
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  color={problem.send ? 'success' : 'primary'}
                  onClick={() => {
                    onAddAttempt(problem.id, AttemptType.SEND);
                  }}
                  disabled={problem.flash || problem.send}
                  sx={{ minHeight: 48, flex: 1 }}
                  data-testid="send-button"
                >
                  Send
                </Button>
              </Stack>
            </Paper>
          );
        })}
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
