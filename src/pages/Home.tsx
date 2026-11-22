import { Button, Stack, Typography } from '@mui/material';
import { useAppNavigate } from '../hooks/useAppNavigate';
import PageHeader from '../components/PageHeader';

export default function Home() {
  const navigate = useAppNavigate();
  return (
    <>
      <PageHeader title="Matside" />
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Log your bouldering sessions, problems, attempts and hangboard timers. Your data stays on
        this device.
      </Typography>
      <Stack spacing={2}>
        <Button
          variant="contained"
          onClick={() => {
            navigate('/session');
          }}
        >
          Start session
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            navigate('/workouts');
          }}
        >
          Interval timer
        </Button>
      </Stack>
    </>
  );
}
