import { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Stack,
  Chip
} from '@mui/material';

interface PreSessionFormProps {
  onChange: (data: PreSessionData) => void;
}

export interface PreSessionData {
  sleepQuality: number;
  energyLevel: number;
  fingerSoreness: number;
  motivation: number;
  restDays: number;
  nutrition: 'poor' | 'moderate' | 'good';
  stress: 'low' | 'medium' | 'high';
  goals: string[];
  additionalNotes: string;
}

const PreSessionForm = ({ onChange }: PreSessionFormProps) => {
  const [formData, setFormData] = useState<PreSessionData>({
    sleepQuality: 5,
    energyLevel: 5,
    fingerSoreness: 5,
    motivation: 5,
    restDays: 1,
    nutrition: 'moderate',
    stress: 'medium',
    goals: [],
    additionalNotes: ''
  });

  const [goalInput, setGoalInput] = useState('');

  const handleChange = (field: keyof PreSessionData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleAddGoal = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && goalInput.trim()) {
      const newGoals = [...formData.goals, goalInput.trim()];
      handleChange('goals', newGoals);
      setGoalInput('');
    }
  };

  const handleDeleteGoal = (goalToDelete: string) => {
    const newGoals = formData.goals.filter(goal => goal !== goalToDelete);
    handleChange('goals', newGoals);
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Physical State */}
        <Box>
          <Typography variant="h6" gutterBottom>Physical State</Typography>
          
          <Typography gutterBottom>Sleep Quality (Last Night)</Typography>
          <Slider
            value={formData.sleepQuality}
            onChange={(_, value) => handleChange('sleepQuality', value)}
            marks
            min={1}
            max={10}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>Energy Level</Typography>
          <Slider
            value={formData.energyLevel}
            onChange={(_, value) => handleChange('energyLevel', value)}
            marks
            min={1}
            max={10}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>Finger Soreness (1 = Very Sore, 10 = Fresh)</Typography>
          <Slider
            value={formData.fingerSoreness}
            onChange={(_, value) => handleChange('fingerSoreness', value)}
            marks
            min={1}
            max={10}
            valueLabelDisplay="auto"
          />

          <Typography gutterBottom>Rest Days Since Last Session</Typography>
          <Slider
            value={formData.restDays}
            onChange={(_, value) => handleChange('restDays', value)}
            marks
            min={0}
            max={7}
            valueLabelDisplay="auto"
          />
        </Box>

        {/* Mental State */}
        <Box>
          <Typography variant="h6" gutterBottom>Mental State</Typography>

          <Typography gutterBottom>Motivation Level</Typography>
          <Slider
            value={formData.motivation}
            onChange={(_, value) => handleChange('motivation', value)}
            marks
            min={1}
            max={10}
            valueLabelDisplay="auto"
          />

          <FormControl component="fieldset">
            <Typography gutterBottom>Stress Level</Typography>
            <RadioGroup
              row
              value={formData.stress}
              onChange={(e) => handleChange('stress', e.target.value)}
            >
              <FormControlLabel value="low" control={<Radio />} label="Low" />
              <FormControlLabel value="medium" control={<Radio />} label="Medium" />
              <FormControlLabel value="high" control={<Radio />} label="High" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Nutrition */}
        <Box>
          <Typography variant="h6" gutterBottom>Nutrition</Typography>
          <FormControl component="fieldset">
            <Typography gutterBottom>Today's Nutrition Quality</Typography>
            <RadioGroup
              row
              value={formData.nutrition}
              onChange={(e) => handleChange('nutrition', e.target.value)}
            >
              <FormControlLabel value="poor" control={<Radio />} label="Poor" />
              <FormControlLabel value="moderate" control={<Radio />} label="Moderate" />
              <FormControlLabel value="good" control={<Radio />} label="Good" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Session Goals */}
        <Box>
          <Typography variant="h6" gutterBottom>Session Goals</Typography>
          <TextField
            fullWidth
            placeholder="Add a goal and press Enter"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyPress={handleAddGoal}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.goals.map((goal, index) => (
              <Chip
                key={index}
                label={goal}
                onDelete={() => handleDeleteGoal(goal)}
              />
            ))}
          </Box>
        </Box>

        {/* Additional Notes */}
        <Box>
          <Typography variant="h6" gutterBottom>Additional Notes</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Any other notes about your condition or goals..."
            value={formData.additionalNotes}
            onChange={(e) => handleChange('additionalNotes', e.target.value)}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default PreSessionForm; 