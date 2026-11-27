import { useRef, useState } from 'react';
import { Typography, Button, Paper, IconButton, Stack, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate, useSearchParams } from 'react-router';
import PageHeader from '../components/PageHeader';
import QuickLog from '../components/QuickLog';
import PreSessionForm from '../components/PreSessionForm';
import PastSessionsList from '../components/PastSessionsList';
import DataCard from '../components/DataCard';
import BackupReminder from '../components/BackupReminder';
import UndoSnackbar from '../components/UndoSnackbar';
import SessionWrapUp from '../components/SessionWrapUp';
import type { Session, SessionProblem, PreSessionData, PostSessionReview } from '../types';
import { AttemptType } from '../types';
import { db, useCurrentSession, useLatestEndedSession } from '../db';
import { requestPersistentStorage } from '../utils/storage';
import { removeProblem, replaceProblem } from '../utils/undo';
import { newId } from '../utils/id';
import { removeGoalAt } from '../utils/sessions';
import {
  sanitizeGoals,
  sanitizeGrade,
  sanitizeNotes,
  sanitizePostSessionReview,
  sanitizeProblemName,
  LIMITS,
} from '../utils/validation';

type SessionMode = 'climb' | 'history';
type SessionView = 'live' | 'checkin' | 'wrapup';

const defaultPreSessionData: PreSessionData = {
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
  const latestEnded = useLatestEndedSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: SessionMode = searchParams.get('view') === 'history' ? 'history' : 'climb';
  const [prevMode, setPrevMode] = useState<SessionMode>(mode);
  const [preSessionData, setPreSessionData] = useState<PreSessionData>(defaultPreSessionData);
  const [postSessionNotes, setPostSessionNotes] = useState('');
  const [review, setReview] = useState<PostSessionReview>(emptyReview);
  const [view, setView] = useState<SessionView>('live');
  const [liveCheckIn, setLiveCheckIn] = useState<PreSessionData>(defaultPreSessionData);
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

  if (mode !== prevMode) {
    setPrevMode(mode);
    setPreSessionData(defaultPreSessionData);
    setView('live');
  }

  const changeMode = (next: SessionMode) => {
    setSearchParams(next === 'history' ? { view: 'history' } : {}, { replace: true });
  };

  if (currentSession?.id !== loadedId) {
    setLoadedId(currentSession?.id);
    setView('live');
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

  const changeLiveCheckIn = (next: PreSessionData) => {
    if (!currentSession) return;
    const prevGoals = liveCheckIn.goals;
    setLiveCheckIn(next);
    const sanitized: PreSessionData = {
      ...next,
      goals: sanitizeGoals(next.goals),
      additionalNotes: sanitizeNotes(next.additionalNotes),
    };
    const changes: Partial<Session> = { preSessionData: sanitized };
    if (next.goals.length < prevGoals.length) {
      let removed = next.goals.findIndex((goal, i) => goal !== prevGoals[i]);
      if (removed === -1) removed = prevGoals.length - 1;
      const nextReview: PostSessionReview = {
        ...review,
        achievedGoals: removeGoalAt(review.achievedGoals, removed),
      };
      setReview(nextReview);
      changes.postSessionReview = nextReview;
    }
    void (async () => {
      try {
        await db.sessions.update(currentSession.id, changes);
      } catch (error) {
        console.error('Error saving check-in:', error);
      }
    })();
  };

  const startSession = async () => {
    const sanitizedPreSession: PreSessionData = {
      ...preSessionData,
      goals: sanitizeGoals(preSessionData.goals),
      additionalNotes: sanitizeNotes(preSessionData.additionalNotes),
    };
    const newSession: Session = {
      id: newId(),
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
        setView('live');
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
        id: newId(),
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
        id: newId(),
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
      {mode === 'history' ? (
        <>
          <Stack direction="row" sx={{ mb: 2, alignItems: 'center', gap: 1 }}>
            <IconButton
              aria-label="Back"
              edge="start"
              onClick={() => {
                changeMode('climb');
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h2">
              History
            </Typography>
          </Stack>
          <DataCard />
          <PastSessionsList />
        </>
      ) : currentSession === undefined ? null : currentSession === null ? (
        <>
          <PageHeader
            title="New session"
            action={
              <Stack direction="row">
                <IconButton
                  aria-label="History"
                  onClick={() => {
                    changeMode('history');
                  }}
                >
                  <HistoryIcon />
                </IconButton>
                <IconButton
                  aria-label="Close"
                  edge="end"
                  onClick={() => {
                    void navigate('/');
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            }
          />
          <Paper sx={{ p: 2, mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                void startSession();
              }}
              sx={{ mb: 2 }}
            >
              Start session
            </Button>
            <PreSessionForm
              value={preSessionData}
              onChange={setPreSessionData}
              lastWorkOn={latestEnded?.postSessionReview?.workOn}
            />
            <BackupReminder />
          </Paper>
        </>
      ) : (
        <>
          <PageHeader
            title="Session"
            action={
              <IconButton
                aria-label="History"
                edge="end"
                onClick={() => {
                  changeMode('history');
                }}
              >
                <HistoryIcon />
              </IconButton>
            }
          />
          <Paper sx={{ p: 2, mb: 2 }}>
            {view === 'checkin' ? (
              <>
                <PreSessionForm
                  value={liveCheckIn}
                  onChange={changeLiveCheckIn}
                  lastWorkOn={latestEnded?.postSessionReview?.workOn}
                />
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setView('live');
                  }}
                >
                  Done
                </Button>
              </>
            ) : view === 'wrapup' ? (
              <SessionWrapUp
                session={currentSession}
                review={review}
                notes={postSessionNotes}
                onReviewChange={changeReview}
                onNotesChange={changeNotes}
                onSave={() => {
                  void endSession();
                }}
                onBack={() => {
                  setView('live');
                }}
              />
            ) : (
              <>
                {currentSession.preSessionData.goals.length > 0 && (
                  <Stack direction="row" sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                    {currentSession.preSessionData.goals.map((goal, index) => (
                      <Chip key={index} size="small" label={goal} />
                    ))}
                  </Stack>
                )}
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
                <Stack direction="row" sx={{ mt: 2, gap: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setLiveCheckIn(currentSession.preSessionData);
                      setView('checkin');
                    }}
                  >
                    Check-in
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => {
                      setView('wrapup');
                    }}
                  >
                    Finish session
                  </Button>
                </Stack>
              </>
            )}
          </Paper>
        </>
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
