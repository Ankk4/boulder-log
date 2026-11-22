import { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { exportJsonBackup, exportProblemsCsv } from '../utils/exportActions';
import { getLastBackupAt, getStorageStatus } from '../utils/storage';
import type { StorageStatus } from '../utils/storage';

const STORAGE_LINES: Record<StorageStatus, string> = {
  persistent: 'Stored persistently on this device',
  'best-effort': 'The browser may clear this data if storage runs low. Export a backup.',
  unknown: 'Storage status unknown',
};

const formatBackupLine = (iso: string | null): string => {
  if (iso === null) return 'Never backed up';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never backed up';
  return `Last backup: ${date.toLocaleDateString()}`;
};

const DataCard = () => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(() => getLastBackupAt());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void getStorageStatus().then((result) => {
      if (active) setStatus(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const runExport = async (action: () => Promise<boolean>) => {
    const ok = await action();
    setFailed(!ok);
    if (ok) setLastBackupAtState(getLastBackupAt());
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Your data
      </Typography>
      {status !== null && <Typography variant="body2">{STORAGE_LINES[status]}</Typography>}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatBackupLine(lastBackupAt)}
      </Typography>
      {failed && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Export failed. Try again.
        </Alert>
      )}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => void runExport(exportJsonBackup)}>
          Export backup (JSON)
        </Button>
        <Button variant="outlined" onClick={() => void runExport(exportProblemsCsv)}>
          Export problems (CSV)
        </Button>
      </Stack>
    </Paper>
  );
};

export default DataCard;
