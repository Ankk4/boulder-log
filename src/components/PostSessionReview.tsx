import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import type { PostSessionReview as PostSessionReviewData } from '../types';
import RatingPicker from './RatingPicker';
import { LIMITS } from '../utils/validation';

interface PostSessionReviewProps {
  value: PostSessionReviewData;
  goals: string[];
  onChange: (next: PostSessionReviewData) => void;
}

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
