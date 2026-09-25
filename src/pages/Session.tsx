import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import QuickLog from '../components/QuickLog';
import PreSessionForm from '../components/PreSessionForm';
import PastSessionsList from '../components/PastSessionsList';
import type { Session, SessionProblem, PreSessionData } from '../types';
import { AttemptType } from '../types';
import { db, useCurrentSession } from '../db';
import {
  sanitizeGoals,
  sanitizeGrade,
  sanitizeNotes,
  sanitizeProblemName,
  LIMITS,
} from '../utils/validation';

type SessionMode = 'climb' | 'history';

const defaultPreSessionData: PreSessionData = {
  sleepQuality: 5,
  energyLevel: 5,
  fingerSoreness: 5,
  motivation: 5,
  restDays: 1,
  nutrition: 'moderate',
  stress: 'medium',
  goals: [],
  additionalNotes: '',
};

const SessionPage = () => {
  const currentSession = useCurrentSession();
  const [mode, setMode] = useState<SessionMode>('climb');
  const [preSessionData, setPreSessionData] = useState<PreSessionData>(defaultPreSessionData);
  const [postSessionNotes, setPostSessionNotes] = useState('');

  const startSession = async () => {
    const sanitizedPreSession: PreSessionData = {
      ...preSessionData,
      goals: sanitizeGoals(preSessionData.goals),
      additionalNotes: sanitizeNotes(preSessionData.additionalNotes),
    };
    const newSession: Session = {
      id: crypto.randomUUID(),
      startTime: new Date().toISOString(),
      endTime: null,
      preSessionData: sanitizedPreSession,
      problems: [],
    };
    await db.sessions.add(newSession);
  };

  const endSession = async () => {
    if (currentSession) {
      const updatedSession: Session = {
        ...currentSession,
        endTime: new Date().toISOString(),
        postSessionNotes: sanitizeNotes(postSessionNotes, LIMITS.postSessionNotes),
        duration: Math.round(
          (new Date().getTime() - new Date(currentSession.startTime).getTime()) / (1000 * 60)
        ),
      };
      await db.sessions.put(updatedSession);
    }
  };

  const handleAddProblem = async (problemData: Omit<SessionProblem, 'id' | 'attempts'>) => {
    if (currentSession) {
      if (import.meta.env.DEV) {
        console.log('Adding problem to session:', currentSession.id);
        console.log('Problem data:', problemData);
      }

      const newProblem: SessionProblem = {
        ...problemData,
        name: sanitizeProblemName(problemData.name),
        frenchGrade: sanitizeGrade(problemData.frenchGrade),
        colorGrade: sanitizeGrade(problemData.colorGrade),
        id: crypto.randomUUID(),
        attempts: [],
      };
      if (import.meta.env.DEV) {
        console.log('New problem object:', newProblem);
      }

      try {
        await db.problems.add(newProblem);

        const updatedSession: Session = {
          ...currentSession,
          problems: [...currentSession.problems, newProblem],
        };
        await db.sessions.put(updatedSession);
      } catch (error) {
        console.error('Error adding problem:', error);
      }
    } else {
      console.error('No active session found');
    }
  };

  const handleAddAttempt = async (problemId: string, type: AttemptType) => {
    if (currentSession) {
      if (import.meta.env.DEV) {
        console.log('Adding attempt to problem:', problemId);
        console.log('Attempt type:', type);
      }

      const newAttempt = {
        id: crypto.randomUUID(),
        problemId,
        sessionId: currentSession.id,
        timestamp: new Date().toISOString(),
        type,
      };

      try {
        await db.attempts.add(newAttempt);

        const problem = await db.problems.get(problemId);
        if (problem) {
          const attempts = await db.attempts.where('problemId').equals(problemId).toArray();

          const updatedProblem = {
            ...problem,
            flash: type === AttemptType.FLASH && attempts.length === 1,
            send: type === AttemptType.SEND,
            attempts: [...problem.attempts, newAttempt],
          };

          await db.problems.put(updatedProblem);

          const updatedSession: Session = {
            ...currentSession,
            problems: currentSession.problems.map((p) =>
              p.id === problemId ? updatedProblem : p
            ),
          };

          await db.sessions.put(updatedSession);
        }
      } catch (error) {
        console.error('Error adding attempt:', error);
      }
    } else {
      console.error('No active session found');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Session
      </Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        fullWidth
        size="small"
        onChange={(_event, next: SessionMode | null) => {
          if (next) setMode(next);
        }}
        sx={{ mb: 2 }}
        aria-label="Session mode"
      >
        <ToggleButton value="climb">Climb</ToggleButton>
        <ToggleButton value="history">History</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'history' ? (
        <PastSessionsList />
      ) : !currentSession ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Pre-Session Check-in
          </Typography>
          <PreSessionForm onChange={setPreSessionData} />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={startSession}
            sx={{ mt: 3 }}
          >
            Start Session
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Session Details</Typography>
          <Typography>
            Started: {new Date(currentSession.startTime).toLocaleTimeString()}
          </Typography>
          <Typography>
            Duration:{' '}
            {Math.round(
              (Date.now() - new Date(currentSession.startTime).getTime()) / (1000 * 60)
            )}{' '}
            minutes
          </Typography>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h6">Session Stats</Typography>
            <Typography>Unique Problems: {currentSession.problems.length}</Typography>
            <Typography>
              Total Attempts:{' '}
              {currentSession.problems.reduce((sum, p) => sum + p.attempts.length, 0)}
            </Typography>
            <Typography>
              Flashes: {currentSession.problems.filter((p) => p.flash).length}
            </Typography>
            <Typography>
              Sends: {currentSession.problems.filter((p) => p.send).length}
            </Typography>
            <Typography>
              Success Rate:{' '}
              {Math.round(
                (currentSession.problems.filter((p) => p.flash || p.send).length /
                  Math.max(currentSession.problems.length, 1)) *
                  100
              )}
              %
            </Typography>
          </Box>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="h6">Session Goals</Typography>
            {currentSession.preSessionData.goals.map((goal, index) => (
              <Typography key={index} color="text.secondary">
                • {goal}
              </Typography>
            ))}
          </Box>

          <QuickLog
            sessionId={currentSession.id}
            problems={currentSession.problems}
            onAddProblem={handleAddProblem}
            onAddAttempt={handleAddAttempt}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Post-session notes"
            value={postSessionNotes}
            inputProps={{ maxLength: LIMITS.postSessionNotes }}
            onChange={(e) => setPostSessionNotes(e.target.value)}
            sx={{ mt: 2 }}
          />

          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={endSession}
          >
            End Session
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default SessionPage;
