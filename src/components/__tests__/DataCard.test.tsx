import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataCard from '../DataCard';
import * as exportActions from '../../utils/exportActions';
import * as storage from '../../utils/storage';

vi.mock('../../utils/exportActions', () => ({
  exportJsonBackup: vi.fn<() => Promise<boolean>>(),
  exportProblemsCsv: vi.fn<() => Promise<boolean>>(),
}));
vi.mock('../../utils/storage', () => ({
  getStorageStatus: vi.fn<() => Promise<storage.StorageStatus>>(),
  getLastBackupAt: vi.fn<() => string | null>(),
}));

describe('DataCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(storage.getStorageStatus).mockResolvedValue('unknown');
    vi.mocked(storage.getLastBackupAt).mockReturnValue(null);
  });

  it('shows each storage status', async () => {
    const lines = {
      persistent: 'Stored persistently on this device',
      'best-effort': 'The browser may clear this data if storage runs low. Export a backup.',
      unknown: 'Storage status unknown',
    } as const;
    for (const [status, line] of Object.entries(lines) as [keyof typeof lines, string][]) {
      vi.mocked(storage.getStorageStatus).mockResolvedValue(status);
      const { unmount } = render(<DataCard />);
      expect(await screen.findByText(line)).toBeInTheDocument();
      unmount();
    }
  });

  it('shows no storage line before the status resolves', async () => {
    vi.mocked(storage.getStorageStatus).mockReturnValue(
      new Promise<storage.StorageStatus>(() => undefined),
    );
    render(<DataCard />);
    await screen.findByText('Never backed up');
    expect(screen.queryByText('Storage status unknown')).not.toBeInTheDocument();
  });

  it('shows the last backup date or never', async () => {
    const { unmount } = render(<DataCard />);
    expect(await screen.findByText('Never backed up')).toBeInTheDocument();
    unmount();
    const iso = '2024-03-05T12:00:00.000Z';
    vi.mocked(storage.getLastBackupAt).mockReturnValue(iso);
    render(<DataCard />);
    expect(
      await screen.findByText(`Last backup: ${new Date(iso).toLocaleDateString()}`),
    ).toBeInTheDocument();
  });

  it('runs the JSON and CSV exports', async () => {
    vi.mocked(exportActions.exportJsonBackup).mockResolvedValue(true);
    vi.mocked(exportActions.exportProblemsCsv).mockResolvedValue(true);
    render(<DataCard />);
    await userEvent.click(screen.getByRole('button', { name: 'Export backup (JSON)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Export problems (CSV)' }));
    await waitFor(() => {
      expect(exportActions.exportJsonBackup).toHaveBeenCalledTimes(1);
      expect(exportActions.exportProblemsCsv).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Export failed. Try again.')).not.toBeInTheDocument();
  });

  it('shows an error when export fails', async () => {
    vi.mocked(exportActions.exportJsonBackup).mockResolvedValue(false);
    render(<DataCard />);
    await userEvent.click(screen.getByRole('button', { name: 'Export backup (JSON)' }));
    expect(await screen.findByText('Export failed. Try again.')).toBeInTheDocument();
  });
});
