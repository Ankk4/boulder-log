import { Alert, Button, Snackbar } from '@mui/material';
import { useState } from 'react';
import type { SyntheticEvent } from 'react';

interface UndoSnackbarProps {
  message: string;
  severity: 'info' | 'error';
  onUndo?: () => void;
  onClose: () => void;
  open: boolean;
}

export default function UndoSnackbar({
  message,
  severity,
  onUndo,
  onClose,
  open,
}: UndoSnackbarProps) {
  const handleClose = (_event: Event | SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') return;
    onClose();
  };

  const [focused, setFocused] = useState(false);

  return (
    <Snackbar
      open={open}
      autoHideDuration={focused ? null : 8000}
      onClose={handleClose}
      sx={{ bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 24 } }}
    >
      <Alert
        severity={severity}
        role={severity === 'error' ? 'alert' : 'status'}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        variant="filled"
        action={
          onUndo ? (
            <Button color="inherit" size="small" sx={{ minHeight: 48 }} onClick={onUndo}>
              Undo
            </Button>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
