import { Button, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import PageHeader from '../components/PageHeader';
import { useCurrentSession } from '../db';

const PLACEHOLDERS = ['Calendar', 'Streak', 'Quick stats'];

export default function Overview() {
  const session = useCurrentSession();

  return (
    <>
      <PageHeader title="Overview" />
      <Stack spacing={2}>
        {session !== undefined && (
          <Paper sx={{ p: 2 }}>
            <Button variant="contained" component={RouterLink} to="/session">
              {session === null ? 'Start session' : 'Resume session'}
            </Button>
          </Paper>
        )}
        {PLACEHOLDERS.map((title) => (
          <Paper key={title} sx={{ p: 2 }}>
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
            <Typography color="text.secondary">Coming soon</Typography>
          </Paper>
        ))}
      </Stack>
    </>
  );
}
