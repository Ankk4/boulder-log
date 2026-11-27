import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

interface RatingPickerProps {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
}

const RatingPicker = ({ label, value, onChange, min = 1, max = 10 }: RatingPickerProps) => {
  const ratings = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i);
  return (
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
        {ratings.map((n) => (
          <ToggleButton key={n} value={n} sx={{ minWidth: 40, minHeight: 40 }}>
            {n}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default RatingPicker;
