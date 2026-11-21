import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h5" component="h2">
        {title}
      </Typography>
      {action}
    </Stack>
  );
}
