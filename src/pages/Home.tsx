import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import PageHeader from '../components/PageHeader';

export default function Home() {
  return (
    <>
      <PageHeader title="Matside" />
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Log your bouldering sessions, problems, attempts and hangboard timers. Your data stays on
        this device.
      </Typography>
      <Stack spacing={2}>
        <Button variant="contained" component={RouterLink} to="/session">
          Start session
        </Button>
        <Button variant="outlined" component={RouterLink} to="/workouts">
          Interval timer
        </Button>
      </Stack>
    </>
  );
}
