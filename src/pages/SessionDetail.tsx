import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router';
import { Box, Button, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useSessionById } from '../db/index';
import { sessionStats } from '../utils/sessions';
import type { PostSessionReview } from '../types';

const HISTORY_PATH = '/session?view=history';

const ReviewLines = ({
  review,
  energyBefore,
  goalCount,
}: {
  review: PostSessionReview;
  energyBefore: number | undefined;
  goalCount: number;
}) => (
  <>
    {review.rpe !== null && (
      <Typography component="span" variant="body2" sx={{ display: 'block' }}>
        RPE: {review.rpe}
      </Typography>
    )}
    {review.energyAfter !== null && (
      <Typography component="span" variant="body2" sx={{ display: 'block' }}>
        Energy: {energyBefore ?? '—'} → {review.energyAfter}
      </Typography>
    )}
    {goalCount > 0 && (
      <Typography component="span" variant="body2" sx={{ display: 'block' }}>
        Goals achieved: {review.achievedGoals.length}/{goalCount}
      </Typography>
    )}
    {review.accomplishments.length > 0 && (
      <Typography component="span" variant="body2" sx={{ display: 'block' }}>
        Accomplished: {review.accomplishments.join(', ')}
      </Typography>
    )}
    {review.workOn.length > 0 && (
      <Typography component="span" variant="body2" sx={{ display: 'block' }}>
        Work on: {review.workOn.join(', ')}
      </Typography>
    )}
  </>
);

const dash = (value: number | string | undefined) => (value === undefined ? '—' : String(value));

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSessionById(id);

  if (session === undefined) return null;

  const back = (
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => {
        if (location.key === 'default') {
          void navigate(HISTORY_PATH, { replace: true });
        } else {
          void navigate(-1);
        }
      }}
    >
      Back
    </Button>
  );

  if (session === null) {
    return (
      <>
        <PageHeader title="Session" action={back} />
        <Paper sx={{ p: 2 }}>
          <Typography>Session not found</Typography>
          <Button component={RouterLink} to={HISTORY_PATH}>
            Back to history
          </Button>
        </Paper>
      </>
    );
  }

  const stats = sessionStats(session);
  const pre = session.preSessionData;
  const review = session.postSessionReview;
  const start = new Date(session.startTime);
  const checkIn: [string, string][] = [
    ['Sleep', dash(pre.sleepQuality)],
    ['Energy', dash(pre.energyLevel)],
    ['Finger soreness', dash(pre.fingerSoreness)],
    ['Motivation', dash(pre.motivation)],
    ['Rest days', dash(pre.restDays)],
    ['Nutrition', dash(pre.nutrition)],
    ['Stress', dash(pre.stress)],
  ];

  return (
    <>
      <PageHeader title="Session" action={back} />
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">
            {start.toLocaleDateString()} {start.toLocaleTimeString()}
          </Typography>
          <Typography variant="body2">
            Duration: {session.duration ? `${String(session.duration)} min` : '—'}
          </Typography>
          <Typography variant="body2">Problems: {stats.problems}</Typography>
          <Typography variant="body2">Attempts: {stats.attempts}</Typography>
          <Typography variant="body2">Flashes: {stats.flashes}</Typography>
          <Typography variant="body2">Sends: {stats.sends}</Typography>
          <Typography variant="body2">Success rate: {stats.successRate}%</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Check-in</Typography>
          {checkIn.map(([label, value]) => (
            <Typography key={label} variant="body2">
              {label}: {value}
            </Typography>
          ))}
          {pre.additionalNotes && (
            <Typography variant="body2">Notes: {pre.additionalNotes}</Typography>
          )}
        </Paper>

        {pre.goals.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Goals</Typography>
            {pre.goals.map((goal, index) => {
              const achieved = review?.achievedGoals.includes(index) ?? false;
              return (
                <Typography key={`${String(index)}-${goal}`} variant="body2">
                  {achieved ? '✓' : '○'} {goal}
                  {achieved ? ' (achieved)' : ''}
                </Typography>
              );
            })}
          </Paper>
        )}

        {review && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Review</Typography>
            <Box>
              <ReviewLines
                review={review}
                energyBefore={pre.energyLevel}
                goalCount={pre.goals.length}
              />
            </Box>
          </Paper>
        )}

        {session.postSessionNotes && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Notes</Typography>
            <Typography variant="body2">{session.postSessionNotes}</Typography>
          </Paper>
        )}

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Problems</Typography>
          {session.problems.length === 0 ? (
            <Typography color="text.secondary">No problems logged.</Typography>
          ) : (
            <List dense>
              {session.problems.map((problem) => (
                <ListItem key={problem.id} divider>
                  <ListItemText
                    primary={`${problem.name} · ${problem.frenchGrade || problem.colorGrade}`}
                    secondary={`${String(problem.attempts.length)} ${problem.attempts.length === 1 ? 'attempt' : 'attempts'}${
                      problem.flash ? ' · Flash' : problem.send ? ' · Send' : ''
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Stack>
    </>
  );
};

export default SessionDetail;
