import { Box, Button, Collapse, Fade, Typography, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckCircleOutlined as CheckIcon, ErrorOutlined as ErrorIcon } from '@mui/icons-material';

export interface Notice {
  message: string;
  severity: 'info' | 'error';
  onUndo?: () => void;
}

const ENTER_MS = 150;

export default function InlineNotice({ message, severity, onUndo }: Notice) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const timeout = reduceMotion ? 0 : ENTER_MS;
  const isError = severity === 'error';
  const Icon = isError ? ErrorIcon : CheckIcon;
  return (
    <Collapse in appear timeout={timeout}>
      <Fade in appear timeout={timeout}>
        <Box sx={{ pt: 1.5 }}>
          <Box
            role={isError ? 'alert' : 'status'}
            sx={(theme) => {
              const tone = isError ? theme.palette.error.main : theme.palette.success.main;
              return {
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
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
        </Box>
      </Fade>
    </Collapse>
  );
}
