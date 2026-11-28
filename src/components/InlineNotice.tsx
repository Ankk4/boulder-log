import { Box, Button, Typography } from '@mui/material';

export interface Notice {
  message: string;
  severity: 'info' | 'error';
  onUndo?: () => void;
}

export default function InlineNotice({ message, severity, onUndo }: Notice) {
  return (
    <Box
      role={severity === 'error' ? 'alert' : 'status'}
      sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
    >
      <Typography
        variant="body2"
        sx={{ flex: 1 }}
        color={severity === 'error' ? 'error' : 'text.secondary'}
      >
        {message}
      </Typography>
      {onUndo ? (
        <Button size="small" sx={{ minHeight: 48 }} onClick={onUndo}>
          Undo
        </Button>
      ) : null}
    </Box>
  );
}
