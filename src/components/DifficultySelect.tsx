import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface DifficultySelectProps {
  frenchGrade: string;
  colorGrade: string;
  onFrenchGradeChange: (grade: string) => void;
  onColorGradeChange: (color: string) => void;
}

const frenchGrades = [
  '3', '3+', '4', '4+', '5', '5+',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+'
];

const colorGrades = [
  { name: 'Aloittelija', color: '#FFFF00', range: '3-4+' },
  { name: 'Helppo', color: '#00FF00', range: '4+-5' },
  { name: 'Leppoisa', color: '#0000FF', range: '5+-6a' },
  { name: 'Napakka', color: '#FF69B4', range: '6a+-6b+' },
  { name: 'Haastava', color: '#FF0000', range: '6c-7a' },
  { name: 'Vaikea', color: '#800080', range: '7a+-7b' },
  { name: 'Erittäin Vaikea', color: '#000000', range: '7b+->' }
];

const DifficultySelect = ({
  frenchGrade,
  colorGrade,
  onFrenchGradeChange,
  onColorGradeChange
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
        <Select
          value={frenchGrade}
          label="French Grade"
          onChange={handleFrenchGradeChange}
        >
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
        <Select
          value={colorGrade}
          label="Gym Color"
          onChange={handleColorGradeChange}
        >
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
                gap: 1
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: grade.color,
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)'
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