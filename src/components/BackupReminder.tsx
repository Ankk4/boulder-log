import { useState } from 'react';
import { Alert, Button } from '@mui/material';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/index';
import { shouldRemindBackup } from '../utils/backup';
import { exportJsonBackup } from '../utils/exportActions';
import { getBackupSnoozeUntil, getLastBackupAt, setBackupSnoozeUntil } from '../utils/storage';

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const isSnoozed = (now: Date): boolean => {
  const until = getBackupSnoozeUntil();
  if (until === null) return false;
  const untilMs = new Date(until).getTime();
  return !Number.isNaN(untilMs) && untilMs > now.getTime();
};

const BackupReminder = () => {
  const endTimes = useLiveQuery(async () => {
    const sessions = await db.sessions.toArray();
    return sessions.flatMap((session) => (session.endTime ? [session.endTime] : []));
  });
  const [dismissed, setDismissed] = useState(false);
  const [failed, setFailed] = useState(false);

  const now = new Date();
  if (dismissed || !endTimes) return null;
  if (
    !failed &&
    (isSnoozed(now) ||
      !shouldRemindBackup({ sessionEndTimes: endTimes, lastBackupAt: getLastBackupAt(), now }))
  ) {
    return null;
  }

  const exportNow = async () => {
    const ok = await exportJsonBackup();
    setFailed(!ok);
    if (ok) setDismissed(true);
  };

  const snooze = () => {
    setBackupSnoozeUntil(new Date(Date.now() + SNOOZE_MS).toISOString());
    setDismissed(true);
  };

  return (
    <Alert
      severity={failed ? 'error' : 'info'}
      sx={{ mb: 2 }}
      action={
        <>
          <Button color="inherit" size="small" onClick={() => void exportNow()}>
            Export now
          </Button>
          <Button color="inherit" size="small" onClick={snooze}>
            Remind me in 7 days
          </Button>
        </>
      }
    >
      {failed ? 'Export failed. Try again.' : 'Back up your data to keep your logbook safe.'}
    </Alert>
  );
};

export default BackupReminder;
