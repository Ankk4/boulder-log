import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { PostSessionReview as PostSessionReviewData } from '../types';
import { LIMITS } from '../utils/validation';

interface PostSessionReviewProps {
  value: PostSessionReviewData;
  goals: string[];
  onChange: (next: PostSessionReviewData) => void;
}

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const RatingPicker = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
}) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      {label}
    </Typography>
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      aria-label={label}
      onChange={(_event, next: number | null) => {
        onChange(next);
      }}
      sx={{ flexWrap: 'wrap' }}
    >
      {RATINGS.map((n) => (
        <ToggleButton key={n} value={n} sx={{ minWidth: 40, minHeight: 40 }}>
          {n}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </Box>
);

const ItemList = ({
  title,
  addLabel,
  items,
  onChange,
}: {
  title: string;
  addLabel: string;
  items: string[];
  onChange: (next: string[]) => void;
}) => {
  const [input, setInput] = useState('');

  const add = () => {
    const text = input.trim();
    if (text && items.length < LIMITS.maxReviewItems) {
      onChange([...items, text]);
    }
    setInput('');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={`${title}: type and press Enter`}
          value={input}
          slotProps={{ htmlInput: { maxLength: LIMITS.reviewItem, 'aria-label': title } }}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="outlined" aria-label={addLabel} onClick={add}>
          Add
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {items.map((item, index) => (
          <Chip
            key={index}
            label={item}
            onDelete={() => {
              onChange(items.filter((_, i) => i !== index));
            }}
            sx={{ maxWidth: '100%' }}
          />
        ))}
      </Box>
    </Box>
  );
};

const PostSessionReview = ({ value, goals, onChange }: PostSessionReviewProps) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="h6" gutterBottom>
      Session review
    </Typography>
    <RatingPicker
      label="RPE"
      value={value.rpe}
      onChange={(rpe) => {
        onChange({ ...value, rpe });
      }}
    />
    <RatingPicker
      label="Energy after"
      value={value.energyAfter}
      onChange={(energyAfter) => {
        onChange({ ...value, energyAfter });
      }}
    />
    <ItemList
      title="Accomplished"
      addLabel="Add accomplishment"
      items={value.accomplishments}
      onChange={(accomplishments) => {
        onChange({ ...value, accomplishments });
      }}
    />
    <ItemList
      title="Work on"
      addLabel="Add work-on item"
      items={value.workOn}
      onChange={(workOn) => {
        onChange({ ...value, workOn });
      }}
    />
    {goals.length > 0 && (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Goals achieved</Typography>
        {goals.map((goal, index) => (
          <Box key={index}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value.achievedGoals.includes(index)}
                  onChange={(e) => {
                    const rest = value.achievedGoals.filter((i) => i !== index);
                    onChange({
                      ...value,
                      achievedGoals: e.target.checked ? [...rest, index] : rest,
                    });
                  }}
                />
              }
              label={goal}
            />
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

export default PostSessionReview;
