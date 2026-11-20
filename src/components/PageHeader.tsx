import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h5" component="h2">
        {title}
      </Typography>
      {action}
    </Stack>
  );
}
