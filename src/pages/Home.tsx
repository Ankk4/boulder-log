import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Matside
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        An offline-first PWA for logging bouldering sessions, problems, attempts, benchmarks and
        everything related to the sport.
      </Typography>
      <Stack spacing={2}>
        <Button variant="contained" onClick={() => navigate('/session')}>
          Start session
        </Button>
        <Button variant="outlined" onClick={() => navigate('/workouts')}>
          Interval timer
        </Button>
      </Stack>
    </Box>
  );
}
