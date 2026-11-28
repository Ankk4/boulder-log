import { Box, Button, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircleOutlined as CheckIcon, ErrorOutlined as ErrorIcon } from '@mui/icons-material';

export interface Notice {
  message: string;
  severity: 'info' | 'error';
  onUndo?: () => void;
}

export default function InlineNotice({ message, severity, onUndo }: Notice) {
  const isError = severity === 'error';
  const Icon = isError ? ErrorIcon : CheckIcon;
  return (
    <Box
      role={isError ? 'alert' : 'status'}
      sx={(theme) => {
        const tone = isError ? theme.palette.error.main : theme.palette.success.main;
        return {
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mt: 1.5,
          pl: 1.5,
          pr: 0.5,
          py: 0.5,
          minHeight: 56,
          borderRadius: 1,
          borderLeft: `3px solid ${tone}`,
          bgcolor: alpha(tone, 0.12),
          '& .notice-icon': { color: tone },
        };
      }}
    >
      <Icon className="notice-icon" fontSize="small" aria-hidden />
      <Typography variant="body2" sx={{ flex: 1, color: 'text.primary' }}>
        {message}
      </Typography>
      {onUndo ? (
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          sx={{ minHeight: 48, minWidth: 72 }}
          onClick={onUndo}
        >
          Undo
        </Button>
      ) : null}
    </Box>
  );
}
