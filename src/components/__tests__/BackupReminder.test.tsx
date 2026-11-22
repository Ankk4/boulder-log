import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { db } from '../../db/index';
import BackupReminder from '../BackupReminder';
import * as exportActions from '../../utils/exportActions';
import * as storage from '../../utils/storage';

const { endTimes } = vi.hoisted(() => ({ endTimes: { value: [] as string[] | undefined } }));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => endTimes.value,
}));
vi.mock('../../db/index', () => ({
  db: { sessions: { toArray: vi.fn<typeof db.sessions.toArray>() } },
}));
vi.mock('../../utils/exportActions', () => ({
  exportJsonBackup: vi.fn<() => Promise<boolean>>(),
}));
vi.mock('../../utils/storage', () => ({
  getLastBackupAt: vi.fn<() => string | null>(),
  getBackupSnoozeUntil: vi.fn<() => string | null>(),
  setBackupSnoozeUntil: vi.fn<(iso: string) => void>(),
}));

const NOW = new Date('2024-06-01T12:00:00.000Z');

describe('BackupReminder', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: NOW });
    vi.resetAllMocks();
    endTimes.value = [
      '2024-05-01T10:00:00.000Z',
      '2024-05-02T10:00:00.000Z',
      '2024-05-03T10:00:00.000Z',
    ];
    vi.mocked(storage.getLastBackupAt).mockReturnValue(null);
    vi.mocked(storage.getBackupSnoozeUntil).mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows when due', () => {
    render(<BackupReminder />);
    expect(screen.getByRole('button', { name: 'Export now' })).toBeInTheDocument();
  });

  it('is hidden when not due', () => {
    endTimes.value = ['2024-05-01T10:00:00.000Z'];
    render(<BackupReminder />);
    expect(screen.queryByRole('button', { name: 'Export now' })).not.toBeInTheDocument();
  });

  it('hidden when snoozed', () => {
    vi.mocked(storage.getBackupSnoozeUntil).mockReturnValue('2024-06-05T12:00:00.000Z');
    render(<BackupReminder />);
    expect(screen.queryByRole('button', { name: 'Export now' })).not.toBeInTheDocument();
  });

  it('Later snoozes for 7 days', async () => {
    render(<BackupReminder />);
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    const snoozeArg = vi.mocked(storage.setBackupSnoozeUntil).mock.calls[0]?.[0] ?? '';
    const expectedMs = NOW.getTime() + 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(new Date(snoozeArg).getTime() - expectedMs)).toBeLessThan(5000);
    expect(screen.queryByRole('button', { name: 'Later' })).not.toBeInTheDocument();
  });

  it('Export now exports and hides', async () => {
    vi.mocked(exportActions.exportJsonBackup).mockResolvedValue(true);
    render(<BackupReminder />);
    await userEvent.click(screen.getByRole('button', { name: 'Export now' }));
    expect(exportActions.exportJsonBackup).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Export now' })).not.toBeInTheDocument();
  });

  it('shows an error and stays when export fails', async () => {
    vi.mocked(exportActions.exportJsonBackup).mockResolvedValue(false);
    render(<BackupReminder />);
    await userEvent.click(screen.getByRole('button', { name: 'Export now' }));
    expect(await screen.findByText('Export failed. Try again.')).toBeInTheDocument();
  });
});
