import { useEffect, useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import PostSessionReviewSection from './PostSessionReview';
import type { PostSessionReview, Session } from '../types';
import { formatElapsed, sessionStats } from '../utils/sessions';
import { LIMITS } from '../utils/validation';

interface SessionWrapUpProps {
  session: Session;
  review: PostSessionReview;
  notes: string;
  onReviewChange: (review: PostSessionReview) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onBack: () => void;
}

const SessionWrapUp = ({
  session,
  review,
  notes,
  onReviewChange,
  onNotesChange,
  onSave,
  onBack,
}: SessionWrapUpProps) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);
  const stats = sessionStats(session);
  const elapsed = formatElapsed(now - new Date(session.startTime).getTime());
  const items: [string, string][] = [
    ['Duration', elapsed],
    ['Problems', String(stats.problems)],
    ['Attempts', String(stats.attempts)],
    ['Flashes', String(stats.flashes)],
    ['Sends', String(stats.sends)],
    ['Success rate', `${String(stats.successRate)}%`],
  ];

  return (
    <>
      <Stack direction="row" sx={{ mb: 2, flexWrap: 'wrap', gap: 2 }}>
        {items.map(([label, value]) => (
          <div key={label}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6">{value}</Typography>
          </div>
        ))}
      </Stack>
      <PostSessionReviewSection
        value={review}
        goals={session.preSessionData.goals}
        onChange={onReviewChange}
      />
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Post-session notes"
        value={notes}
        slotProps={{ htmlInput: { maxLength: LIMITS.postSessionNotes } }}
        onChange={(e) => {
          onNotesChange(e.target.value);
        }}
        sx={{ mt: 2 }}
      />
      <Button variant="contained" color="secondary" fullWidth sx={{ mt: 2 }} onClick={onSave}>
        Save & end
      </Button>
      <Button fullWidth sx={{ mt: 1 }} onClick={onBack}>
        Back to climbing
      </Button>
    </>
  );
};

export default SessionWrapUp;
