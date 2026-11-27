import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { frenchGrades, colorGrades } from '../utils/grades';

interface DifficultySelectProps {
  frenchGrade: string;
  colorGrade: string;
  onFrenchGradeChange: (grade: string) => void;
  onColorGradeChange: (color: string) => void;
}

const DifficultySelect = ({
  frenchGrade,
  colorGrade,
  onFrenchGradeChange,
  onColorGradeChange,
}: DifficultySelectProps) => {
  const handleFrenchGradeChange = (event: SelectChangeEvent) => {
    onFrenchGradeChange(event.target.value);
  };

  const handleColorGradeChange = (event: SelectChangeEvent) => {
    onColorGradeChange(event.target.value);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>French Grade</InputLabel>
        <Select value={frenchGrade} label="French Grade" onChange={handleFrenchGradeChange}>
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {frenchGrades.map((grade) => (
            <MenuItem key={grade} value={grade}>
              {grade}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Gym Color</InputLabel>
        <Select value={colorGrade} label="Gym Color" onChange={handleColorGradeChange}>
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {colorGrades.map((grade) => (
            <MenuItem
              key={grade.name}
              value={grade.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: grade.color,
                  borderRadius: '4px',
                  border: 1,
                  borderColor: 'text.secondary',
                }}
              />
              {grade.name} ({grade.range})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DifficultySelect;
