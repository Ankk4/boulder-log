import { Box, Chip, Typography } from '@mui/material';
import { frenchGrades, colorGrades } from '../utils/grades';

interface GradePickerProps {
  frenchGrade: string;
  colorGrade: string;
  onFrenchGradeChange: (grade: string) => void;
  onColorGradeChange: (color: string) => void;
}

const chipSx = { minHeight: 40, height: 'auto' };

const GradePicker = ({
  frenchGrade,
  colorGrade,
  onFrenchGradeChange,
  onColorGradeChange,
}: GradePickerProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          French Grade
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {frenchGrades.map((grade) => {
            const selected = grade === frenchGrade;
            return (
              <Chip
                key={grade}
                label={grade}
                clickable
                aria-pressed={selected}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => {
                  onFrenchGradeChange(selected ? '' : grade);
                }}
                sx={chipSx}
              />
            );
          })}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Gym Color
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {colorGrades.map((grade) => {
            const selected = grade.name === colorGrade;
            return (
              <Chip
                key={grade.name}
                label={grade.name}
                clickable
                aria-pressed={selected}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => {
                  onColorGradeChange(selected ? '' : grade.name);
                }}
                icon={
                  <Box
                    component="span"
                    data-testid={`swatch-${grade.name}`}
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: grade.color,
                      borderRadius: '4px',
                      border: 1,
                      borderColor: 'text.secondary',
                    }}
                  />
                }
                sx={{ ...chipSx, '& .MuiChip-icon': { ml: 1, mr: -0.5 } }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default GradePicker;
