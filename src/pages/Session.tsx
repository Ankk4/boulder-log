import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import QuickLog from '../components/QuickLog';
import PreSessionForm from '../components/PreSessionForm';
import PastSessionsList from '../components/PastSessionsList';
import DataCard from '../components/DataCard';
import BackupReminder from '../components/BackupReminder';
import UndoSnackbar from '../components/UndoSnackbar';
import PostSessionReviewSection from '../components/PostSessionReview';
import type { Session, SessionProblem, PreSessionData, PostSessionReview } from '../types';
import { AttemptType } from '../types';
import { db, useCurrentSession } from '../db';
import { requestPersistentStorage } from '../utils/storage';
import { removeProblem, replaceProblem } from '../utils/undo';
import {
  sanitizeGoals,
  sanitizeGrade,
  sanitizeNotes,
  sanitizePostSessionReview,
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

const emptyReview: PostSessionReview = {
  rpe: null,
  energyAfter: null,
  accomplishments: [],
  workOn: [],
  achievedGoals: [],
};

interface Feedback {
  id: number;
  message: string;
  severity: 'info' | 'error';
  undo?: () => Promise<void>;
}

const SAVE_ERROR_MESSAGE = "Couldn't save. Try again.";

const SessionPage = () => {
  const currentSession = useCurrentSession();
  const [mode, setMode] = useState<SessionMode>('climb');
  const [preSessionData, setPreSessionData] = useState<PreSessionData>(defaultPreSessionData);
  const [postSessionNotes, setPostSessionNotes] = useState('');
  const [review, setReview] = useState<PostSessionReview>(emptyReview);
  const [now, setNow] = useState(() => Date.now());
  const [loadedId, setLoadedId] = useState<string | undefined>(undefined);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackId = useRef(0);

  const showFeedback = (
    message: string,
    severity: 'info' | 'error',
    undo?: () => Promise<void>,
  ) => {
    feedbackId.current += 1;
    setFeedback({ id: feedbackId.current, message, severity, undo });
  };

  const showSaveError = () => {
    showFeedback(SAVE_ERROR_MESSAGE, 'error');
  };

  const runUndo = async (action: Feedback) => {
    if (!action.undo) return;
    const undo = action.undo;
    setFeedback({ ...action, undo: undefined });
    try {
      await undo();
      setFeedback(null);
    } catch (error) {
      console.error('Error undoing action:', error);
      showSaveError();
    }
  };

  if (currentSession?.id !== loadedId) {
    setLoadedId(currentSession?.id);
    setReview(currentSession?.postSessionReview ?? emptyReview);
    setPostSessionNotes(currentSession?.postSessionNotes ?? '');
  }

  const saveDraft = async (nextReview: PostSessionReview, nextNotes: string) => {
    if (!currentSession) return;
    try {
      await db.sessions.update(currentSession.id, {
        postSessionReview: nextReview,
        postSessionNotes: nextNotes,
      });
    } catch (error) {
      console.error('Error saving review draft:', error);
    }
  };

  const changeReview = (next: PostSessionReview) => {
    setReview(next);
    void saveDraft(next, postSessionNotes);
  };

  const changeNotes = (next: string) => {
    setPostSessionNotes(next);
    void saveDraft(review, next);
  };

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 30_000);
    return () => {
      clearInterval(id);
    };
  }, []);

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
    try {
      await db.sessions.add(newSession);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    if (currentSession) {
      const savedNotes = sanitizeNotes(postSessionNotes, LIMITS.postSessionNotes);
      const savedReview = sanitizePostSessionReview(
        review,
        currentSession.preSessionData.goals.length,
      );
      const updatedSession: Session = {
        ...currentSession,
        endTime: new Date().toISOString(),
        postSessionNotes: savedNotes,
        postSessionReview: savedReview,
        duration: Math.round(
          (new Date().getTime() - new Date(currentSession.startTime).getTime()) / (1000 * 60),
        ),
      };
      const sessionId = currentSession.id;
      try {
        await db.sessions.put(updatedSession);
        setPreSessionData(defaultPreSessionData);
        setPostSessionNotes('');
        setReview(emptyReview);
        void requestPersistentStorage();
        showFeedback('Session ended', 'info', async () => {
          await db.sessions.update(sessionId, { endTime: null, duration: undefined });
          setPostSessionNotes(savedNotes);
          setReview(savedReview);
        });
      } catch (error) {
        console.error('Error ending session:', error);
        showSaveError();
      }
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
        const sessionId = currentSession.id;
        showFeedback('Problem added', 'info', async () => {
          await db.problems.delete(newProblem.id);
          const current = await db.sessions.get(sessionId);
          if (current) {
            await db.sessions.update(sessionId, {
              problems: removeProblem(current.problems, newProblem.id),
            });
          }
        });
      } catch (error) {
        console.error('Error adding problem:', error);
        showSaveError();
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
        const prevProblem = await db.problems.get(problemId);
        await db.attempts.add(newAttempt);

        const problem = await db.problems.get(problemId);
        if (problem) {
          const attempts = await db.attempts.where('problemId').equals(problemId).toArray();

          const updatedProblem = {
            ...problem,
            flash: problem.flash || (type === AttemptType.FLASH && attempts.length === 1),
            send: problem.send || type === AttemptType.SEND,
            attempts: [...problem.attempts, newAttempt],
          };

          await db.problems.put(updatedProblem);

          const updatedSession: Session = {
            ...currentSession,
            problems: currentSession.problems.map((p) => (p.id === problemId ? updatedProblem : p)),
          };

          await db.sessions.put(updatedSession);

          const sessionId = currentSession.id;
          const labels: Record<AttemptType, string> = {
            [AttemptType.ATTEMPT]: 'Attempt logged',
            [AttemptType.FLASH]: 'Flash logged',
            [AttemptType.SEND]: 'Send logged',
          };
          showFeedback(labels[type], 'info', async () => {
            await db.attempts.delete(newAttempt.id);
            if (prevProblem) {
              await db.problems.put(prevProblem);
              const current = await db.sessions.get(sessionId);
              if (current) {
                await db.sessions.update(sessionId, {
                  problems: replaceProblem(current.problems, prevProblem),
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error adding attempt:', error);
        showSaveError();
      }
    } else {
      console.error('No active session found');
    }
  };

  return (
    <>
      <PageHeader title="Session" />

      <ToggleButtonGroup
        value={mode}
        exclusive
        fullWidth
        size="small"
        onChange={(_event, next: SessionMode | null) => {
          if (next) {
            if (next !== mode) setPreSessionData(defaultPreSessionData);
            setMode(next);
          }
        }}
        sx={{ mb: 2 }}
        aria-label="Session mode"
      >
        <ToggleButton value="climb">Climb</ToggleButton>
        <ToggleButton value="history">History</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'history' ? (
        <>
          <DataCard />
          <PastSessionsList />
        </>
      ) : currentSession === undefined ? null : currentSession === null ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <BackupReminder />
          <Typography variant="h6" gutterBottom>
            Pre-Session Check-in
          </Typography>
          <PreSessionForm onChange={setPreSessionData} />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => {
              void startSession();
            }}
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
            {Math.round((now - new Date(currentSession.startTime).getTime()) / (1000 * 60))} minutes
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
            <Typography>Sends: {currentSession.problems.filter((p) => p.send).length}</Typography>
            <Typography>
              Success Rate:{' '}
              {Math.round(
                (currentSession.problems.filter((p) => p.flash || p.send).length /
                  Math.max(currentSession.problems.length, 1)) *
                  100,
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
            onAddProblem={(problem) => {
              void handleAddProblem(problem);
            }}
            onAddAttempt={(problemId, type) => {
              void handleAddAttempt(problemId, type);
            }}
          />

          <PostSessionReviewSection
            value={review}
            goals={currentSession.preSessionData.goals}
            onChange={changeReview}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Post-session notes"
            value={postSessionNotes}
            slotProps={{ htmlInput: { maxLength: LIMITS.postSessionNotes } }}
            onChange={(e) => {
              changeNotes(e.target.value);
            }}
            sx={{ mt: 2 }}
          />

          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {
              void endSession();
            }}
          >
            End Session
          </Button>
        </Paper>
      )}

      {feedback && (
        <UndoSnackbar
          key={feedback.id}
          open
          message={feedback.message}
          severity={feedback.severity}
          onUndo={
            feedback.undo
              ? () => {
                  void runUndo(feedback);
                }
              : undefined
          }
          onClose={() => {
            setFeedback(null);
          }}
        />
      )}
    </>
  );
};

export default SessionPage;
