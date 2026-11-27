import CloseIcon from '@mui/icons-material/Close';
import { Alert, Button, IconButton, Snackbar } from '@mui/material';
import { useRef, useState } from 'react';
import type { PointerEvent, SyntheticEvent } from 'react';

interface UndoSnackbarProps {
  message: string;
  severity: 'info' | 'error';
  onUndo?: () => void;
  onClose: () => void;
  open: boolean;
}

// Dense app bar (48) plus the active session bar (about 44).
const TOP_OFFSET = 'calc(92px + env(safe-area-inset-top))';
const SWIPE_THRESHOLD = 80;
const SLOP = 10;

export default function UndoSnackbar({
  message,
  severity,
  onUndo,
  onClose,
  open,
}: UndoSnackbarProps) {
  const startX = useRef<number | null>(null);
  const [dx, setDx] = useState(0);

  const handleClose = (_event: Event | SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') return;
    onClose();
  };

  const [focused, setFocused] = useState(false);

  const handlePointerDown = (e: PointerEvent) => {
    startX.current = e.clientX;
  };
  const handlePointerMove = (e: PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    setDx(delta);
    if (Math.abs(delta) > SLOP && typeof e.currentTarget.setPointerCapture === 'function') {
      try {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      } catch {
        // Capture is best-effort; the swipe still works while the pointer stays over the alert.
      }
    }
  };
  const handleLostCapture = () => {
    startX.current = null;
    setDx(0);
  };
  const handlePointerEnd = (e: PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    startX.current = null;
    setDx(0);
    if (Math.abs(delta) >= SWIPE_THRESHOLD) onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={focused ? null : 5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: TOP_OFFSET }}
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
        variant="outlined"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handleLostCapture}
        sx={{
          bgcolor: 'background.paper',
          touchAction: 'pan-y',
          transform: `translateX(${String(dx)}px)`,
          transition: dx === 0 ? 'transform 0.2s' : 'none',
        }}
        action={
          <>
            {onUndo ? (
              <Button color="inherit" size="small" sx={{ minHeight: 48 }} onClick={onUndo}>
                Undo
              </Button>
            ) : null}
            <IconButton aria-label="Close" color="inherit" size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
